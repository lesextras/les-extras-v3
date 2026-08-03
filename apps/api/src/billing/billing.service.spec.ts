import { ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import { createHmac } from 'crypto';
import { BillingService } from './billing.service';

/**
 * LA FACTURATION EST LE SEUL MODULE QUI MANIPULE DE L'ARGENT RÉEL,
 * et c'était le seul sans un test.
 *
 * Ce qu'on protège ici n'est pas l'arithmétique — il n'y en a pas — mais la
 * frontière : ce webhook est une porte ouverte sur Internet. Quiconque connaît
 * son adresse peut lui poster ce qu'il veut. Ce qui l'en empêche est une
 * signature HMAC et une fenêtre de cinq minutes. Si l'une des deux cède,
 * n'importe qui peut activer un abonnement ou déclarer une facture payée.
 *
 * Les tests suivent donc trois axes :
 *  - la porte tient (signature fausse, absente, expirée, secret manquant) ;
 *  - la porte s'ouvre quand elle doit (signature valide → effet en base) ;
 *  - un paiement non abouti ne produit AUCUN effet.
 */

const SECRET = 'whsec_test_0123456789';

/** Fabrique un corps signé comme Stripe le fait. */
function signe(corps: unknown, options: { secret?: string; horodatage?: number } = {}) {
  const brut = Buffer.from(JSON.stringify(corps), 'utf8');
  const t = options.horodatage ?? Math.floor(Date.now() / 1000);
  const v1 = createHmac('sha256', options.secret ?? SECRET)
    .update(`${t}.${brut.toString('utf8')}`)
    .digest('hex');
  return { brut, entete: `t=${t},v1=${v1}` };
}

function service(secretConfigure: string | null = SECRET) {
  const subscription = {
    updateMany: jest.fn(async (_args: { where: unknown; data: Record<string, unknown> }) => ({
      count: 1,
    })),
  };
  const invoice = {
    updateMany: jest.fn(async (_args: { where: unknown; data: Record<string, unknown> }) => ({
      count: 1,
    })),
  };
  const prisma = { subscription, invoice } as never;
  const config = {
    get: jest.fn((clef: string) =>
      clef === 'STRIPE_WEBHOOK_SECRET' ? (secretConfigure ?? undefined) : 'sk_test_x',
    ),
  } as never;
  return { billing: new BillingService(prisma, config), subscription, invoice };
}

const sessionAbonnement = (metadata: Record<string, string>, payment_status = 'paid') => ({
  type: 'checkout.session.completed',
  data: {
    object: {
      id: 'cs_test_1',
      payment_status,
      customer: 'cus_1',
      subscription: 'sub_1',
      metadata,
    },
  },
});

describe('BillingService — le webhook Stripe est une porte sur Internet', () => {
  describe('la porte tient', () => {
    it('refuse une signature absente', async () => {
      const { billing, subscription } = service();
      const { brut } = signe(sessionAbonnement({ kind: 'subscription', accountId: 'acc_1' }));

      await expect(billing.handleWebhook(brut, undefined)).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
      expect(subscription.updateMany).not.toHaveBeenCalled();
    });

    it('refuse une signature forgée avec un autre secret', async () => {
      const { billing, subscription } = service();
      const { brut, entete } = signe(sessionAbonnement({ kind: 'subscription', accountId: 'acc_1' }), {
        secret: 'whsec_celui_de_lattaquant',
      });

      await expect(billing.handleWebhook(brut, entete)).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
      expect(subscription.updateMany).not.toHaveBeenCalled();
    });

    it('refuse un corps modifié après signature', async () => {
      const { billing, subscription } = service();
      const { entete } = signe(sessionAbonnement({ kind: 'subscription', accountId: 'acc_1' }));
      // Même signature, mais on substitue le compte bénéficiaire.
      const falsifie = Buffer.from(
        JSON.stringify(sessionAbonnement({ kind: 'subscription', accountId: 'acc_pirate' })),
        'utf8',
      );

      await expect(billing.handleWebhook(falsifie, entete)).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
      expect(subscription.updateMany).not.toHaveBeenCalled();
    });

    it('refuse un enregistrement rejoué au-delà de cinq minutes', async () => {
      const { billing, subscription } = service();
      const vieux = Math.floor(Date.now() / 1000) - 301;
      const { brut, entete } = signe(sessionAbonnement({ kind: 'subscription', accountId: 'acc_1' }), {
        horodatage: vieux,
      });

      await expect(billing.handleWebhook(brut, entete)).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
      expect(subscription.updateMany).not.toHaveBeenCalled();
    });

    it('accepte encore un enregistrement dans la fenêtre', async () => {
      const { billing, subscription } = service();
      const recent = Math.floor(Date.now() / 1000) - 120;
      const { brut, entete } = signe(sessionAbonnement({ kind: 'subscription', accountId: 'acc_1' }), {
        horodatage: recent,
      });

      await expect(billing.handleWebhook(brut, entete)).resolves.toEqual({ received: true });
      expect(subscription.updateMany).toHaveBeenCalledTimes(1);
    });

    it('refuse un en-tête mal formé', async () => {
      const { billing } = service();
      const { brut } = signe(sessionAbonnement({ kind: 'subscription', accountId: 'acc_1' }));

      await expect(billing.handleWebhook(brut, 'nimporte quoi')).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it('refuse de traiter quoi que ce soit si le secret n’est pas configuré', async () => {
      // Sans secret, on ne peut RIEN vérifier. Le service doit se déclarer
      // indisponible plutôt que de laisser passer : un webhook non vérifiable
      // est un webhook ouvert.
      const { billing, subscription } = service(null);
      const { brut, entete } = signe(sessionAbonnement({ kind: 'subscription', accountId: 'acc_1' }));

      await expect(billing.handleWebhook(brut, entete)).rejects.toBeInstanceOf(
        ServiceUnavailableException,
      );
      expect(subscription.updateMany).not.toHaveBeenCalled();
    });
  });

  describe('la porte s’ouvre quand elle doit', () => {
    it('active l’abonnement du bon compte et mémorise les identifiants Stripe', async () => {
      const { billing, subscription } = service();
      const { brut, entete } = signe(sessionAbonnement({ kind: 'subscription', accountId: 'acc_1' }));

      await billing.handleWebhook(brut, entete);

      expect(subscription.updateMany).toHaveBeenCalledWith({
        where: { accountId: 'acc_1' },
        data: {
          status: 'active',
          stripeCustomerId: 'cus_1',
          stripeSubscriptionId: 'sub_1',
        },
      });
    });

    it('passe la facture en payée, et une seule fois', async () => {
      const { billing, invoice } = service();
      const { brut, entete } = signe(
        sessionAbonnement({ kind: 'invoice', invoiceId: 'inv_1' }),
      );

      await billing.handleWebhook(brut, entete);

      expect(invoice.updateMany).toHaveBeenCalledWith({
        // Le filtre `status: { not: 'PAID' }` rend le rejeu inoffensif : Stripe
        // renvoie le même événement plusieurs fois, c'est normal et documenté.
        where: { id: 'inv_1', status: { not: 'PAID' } },
        data: { status: 'PAID' },
      });
    });

    it('suit la résiliation d’un abonnement', async () => {
      const { billing, subscription } = service();
      const { brut, entete } = signe({
        type: 'customer.subscription.deleted',
        data: { object: { id: 'sub_1', status: 'active' } },
      });

      await billing.handleWebhook(brut, entete);

      expect(subscription.updateMany).toHaveBeenCalledWith({
        where: { stripeSubscriptionId: 'sub_1' },
        data: { status: 'canceled', currentPeriodEnd: undefined },
      });
    });

    it('reporte l’échéance au renouvellement', async () => {
      const { billing, subscription } = service();
      const echeance = 1_800_000_000;
      const { brut, entete } = signe({
        type: 'customer.subscription.updated',
        data: { object: { id: 'sub_1', status: 'active', current_period_end: echeance } },
      });

      await billing.handleWebhook(brut, entete);

      const appel = subscription.updateMany.mock.calls[0][0];
      expect(appel.data.currentPeriodEnd).toEqual(new Date(echeance * 1000));
    });
  });

  describe('aucun effet sans paiement abouti', () => {
    it("n'active rien quand le paiement a échoué", async () => {
      const { billing, subscription } = service();
      const { brut, entete } = signe(
        sessionAbonnement({ kind: 'subscription', accountId: 'acc_1' }, 'unpaid'),
      );

      await expect(billing.handleWebhook(brut, entete)).resolves.toEqual({
        received: true,
        ignored: 'not_paid',
      });
      expect(subscription.updateMany).not.toHaveBeenCalled();
    });

    it('ignore proprement un type d’événement inconnu', async () => {
      const { billing, subscription, invoice } = service();
      const { brut, entete } = signe({
        type: 'payment_intent.created',
        data: { object: { id: 'pi_1' } },
      });

      await expect(billing.handleWebhook(brut, entete)).resolves.toEqual({
        received: true,
        ignored: 'payment_intent.created',
      });
      expect(subscription.updateMany).not.toHaveBeenCalled();
      expect(invoice.updateMany).not.toHaveBeenCalled();
    });

    it("n'écrit rien quand la session n'identifie ni compte ni facture", async () => {
      const { billing, subscription, invoice } = service();
      const { brut, entete } = signe(sessionAbonnement({}));

      await expect(billing.handleWebhook(brut, entete)).resolves.toEqual({ received: true });
      expect(subscription.updateMany).not.toHaveBeenCalled();
      expect(invoice.updateMany).not.toHaveBeenCalled();
    });
  });
});
