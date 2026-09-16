import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { UpdateFormationAdminDto } from './dto/formation-admin.dto';

/**
 * L'INTERRUPTEUR DE LA VENTE DE L'ATTESTATION DOIT ÊTRE ACTIONNABLE.
 *
 * ⚠⚠ CE TEST EXISTE PARCE QUE LE TUNNEL A ÉTÉ LIVRÉ SANS SON INTERRUPTEUR.
 * Le 16/09/2026, tout le circuit d'achat de l'attestation de suivi a été
 * construit — commande publique, Stripe, webhook, rétractation de quatorze
 * jours, délivrance, PDF. Il s'ouvre en posant un montant sur
 * `Formation.attestationPrixCents`. Or ce champ n'était dans AUCUN DTO
 * d'écriture, et le ValidationPipe global est en `forbidNonWhitelisted` : la
 * requête partait en 400. La décision d'ouvrir la vente, même prise, ne
 * pouvait s'exécuter qu'en écrivant directement en base.
 *
 * Un tunnel complet qu'aucune route ne peut ouvrir est un tunnel qui n'existe
 * pas. Ces tests vérifient qu'il reste actionnable — et refermable.
 */
async function erreurs(objet: Record<string, unknown>) {
  const dto = plainToInstance(UpdateFormationAdminDto, objet);
  const res = await validate(dto, { whitelist: true, forbidNonWhitelisted: true });
  return res.map((e) => e.property);
}

describe('Le prix de l’attestation, dans le DTO d’administration', () => {
  it('accepte un montant en centimes', async () => {
    expect(await erreurs({ attestationPrixCents: 2000 })).toEqual([]);
  });

  /**
   * ⚠ REFERMER LA VENTE EST AUSSI IMPORTANT QUE L'OUVRIR. `null` doit passer :
   * sans lui, une vente ouverte par erreur — ou le jour où le médiateur de la
   * consommation manque — ne pourrait plus être arrêtée depuis l'écran.
   */
  it('accepte null, qui referme la vente', async () => {
    expect(await erreurs({ attestationPrixCents: null })).toEqual([]);
  });

  it('accepte zéro, qui vaut aussi « fermé »', async () => {
    expect(await erreurs({ attestationPrixCents: 0 })).toEqual([]);
  });

  /**
   * ⚠ LE PLAFOND ARRÊTE LA FAUTE QUI DÉBITE VRAIMENT QUELQU'UN. L'unité est le
   * centime : 20 000 tapés pour « 20 € » vendraient le document 200 €. La
   * faute inverse (20 pour 20 €) ouvre à 0,20 € — gênante, mais elle ne coûte
   * rien à l'acheteur, et c'est pour ça que l'écran saisit des euros.
   */
  it('refuse un montant aberrant', async () => {
    expect(await erreurs({ attestationPrixCents: 2_000_000 })).toEqual([
      'attestationPrixCents',
    ]);
  });

  it('refuse un montant négatif', async () => {
    expect(await erreurs({ attestationPrixCents: -100 })).toEqual([
      'attestationPrixCents',
    ]);
  });

  it('refuse un montant décimal : la base compte en centiemes entiers', async () => {
    expect(await erreurs({ attestationPrixCents: 19.99 })).toEqual([
      'attestationPrixCents',
    ]);
  });
});
