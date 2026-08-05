import * as nodemailer from 'nodemailer';
import { MailService, versionTexte } from './mail.service';

/**
 * LE TRANSPORT D'ENVOI, ET POURQUOI IL COMPTE.
 *
 * Les e-mails partaient par l'API Brevo au nom de `contact@adepa77.fr`, alors
 * que le SPF des deux domaines n'autorise que Hostinger. Brevo acceptait les
 * messages, les décomptait du quota, et une partie disparaissait sans trace.
 *
 * Ces tests verrouillent trois choses :
 *  - dès que le SMTP du domaine est configuré, c'est LUI qui envoie ;
 *  - l'expéditeur par défaut appartient au domaine qui signe ;
 *  - un échec d'envoi ne fait jamais échouer l'action qui l'a déclenché.
 */

jest.mock('nodemailer', () => ({ createTransport: jest.fn() }));

const CREER = nodemailer.createTransport as unknown as jest.Mock;

function config(valeurs: Record<string, string | undefined>) {
  return { get: (k: string) => valeurs[k] } as never;
}

/** Un envoi réel passe par une méthode publique ; celle-ci est la plus simple. */
function envoyer(service: MailService) {
  return service.sendEmailVerification('directrice@mecs-exemple.fr', 'jeton', 'Claire');
}

describe('MailService — choix du transport', () => {
  beforeEach(() => {
    CREER.mockReset();
    jest.spyOn(globalThis, 'fetch' as never).mockResolvedValue({
      ok: true,
      text: async () => '',
    } as never);
  });

  afterEach(() => jest.restoreAllMocks());

  it('passe par le SMTP du domaine dès qu’il est configuré, même si une clé Brevo traîne', async () => {
    const sendMail = jest.fn().mockResolvedValue({ messageId: '<1@les-extras.fr>' });
    CREER.mockReturnValue({ sendMail, close: jest.fn() });

    const service = new MailService(
      config({
        SMTP_HOST: 'smtp.hostinger.com',
        SMTP_USER: 'contact@les-extras.fr',
        SMTP_PASSWORD: 'secret',
        BREVO_API_KEY: 'une-vieille-cle',
      }),
    );

    await envoyer(service);

    expect(sendMail).toHaveBeenCalledTimes(1);
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('utilise le port 465 en TLS implicite par défaut', async () => {
    CREER.mockReturnValue({ sendMail: jest.fn().mockResolvedValue({}), close: jest.fn() });

    await envoyer(
      new MailService(
        config({
          SMTP_HOST: 'smtp.hostinger.com',
          SMTP_USER: 'contact@les-extras.fr',
          SMTP_PASSWORD: 'secret',
        }),
      ),
    );

    expect(CREER).toHaveBeenCalledWith(expect.objectContaining({ port: 465, secure: true }));
  });

  it('bascule en STARTTLS quand le port 587 est demandé', async () => {
    CREER.mockReturnValue({ sendMail: jest.fn().mockResolvedValue({}), close: jest.fn() });

    await envoyer(
      new MailService(
        config({
          SMTP_HOST: 'smtp.hostinger.com',
          SMTP_PORT: '587',
          SMTP_USER: 'contact@les-extras.fr',
          SMTP_PASSWORD: 'secret',
        }),
      ),
    );

    expect(CREER).toHaveBeenCalledWith(expect.objectContaining({ port: 587, secure: false }));
  });

  it('expédie depuis le domaine qui signe, pas depuis un autre', async () => {
    const sendMail = jest.fn().mockResolvedValue({});
    CREER.mockReturnValue({ sendMail, close: jest.fn() });

    await envoyer(
      new MailService(
        config({
          SMTP_HOST: 'smtp.hostinger.com',
          SMTP_USER: 'contact@les-extras.fr',
          SMTP_PASSWORD: 'secret',
        }),
      ),
    );

    expect(sendMail.mock.calls[0][0].from).toEqual({
      name: 'LES EXTRAS',
      address: 'contact@les-extras.fr',
    });
  });

  it('joint toujours une version texte au HTML', async () => {
    const sendMail = jest.fn().mockResolvedValue({});
    CREER.mockReturnValue({ sendMail, close: jest.fn() });

    await envoyer(
      new MailService(
        config({
          SMTP_HOST: 'smtp.hostinger.com',
          SMTP_USER: 'contact@les-extras.fr',
          SMTP_PASSWORD: 'secret',
        }),
      ),
    );

    const message = sendMail.mock.calls[0][0];
    expect(message.text).toBeTruthy();
    expect(message.text).not.toMatch(/<[a-z]/i);
  });

  it('ne crée aucun transport SMTP tant que le mot de passe manque', async () => {
    const service = new MailService(
      config({ SMTP_HOST: 'smtp.hostinger.com', SMTP_USER: 'contact@les-extras.fr' }),
    );

    await envoyer(service);

    expect(CREER).not.toHaveBeenCalled();
  });

  it('se replie sur Brevo si le SMTP échoue — un message imparfait vaut mieux que rien', async () => {
    CREER.mockReturnValue({
      sendMail: jest.fn().mockRejectedValue(new Error('connexion refusée')),
      close: jest.fn(),
    });

    await envoyer(
      new MailService(
        config({
          SMTP_HOST: 'smtp.hostinger.com',
          SMTP_USER: 'contact@les-extras.fr',
          SMTP_PASSWORD: 'secret',
          BREVO_API_KEY: 'cle',
        }),
      ),
    );

    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
  });

  it('n’échoue jamais l’action appelante, même sans aucun transport', async () => {
    await expect(envoyer(new MailService(config({})))).resolves.toBeUndefined();
  });
});

describe('Version texte du message', () => {
  it('conserve les adresses des liens : c’est tout l’intérêt de nos e-mails', () => {
    const texte = versionTexte(
      '<p>Bonjour</p><a href="https://app.les-extras.fr/verify-email?token=abc">Confirmer mon adresse</a>',
    );
    expect(texte).toContain('https://app.les-extras.fr/verify-email?token=abc');
    expect(texte).toContain('Confirmer mon adresse');
  });

  it('ne laisse aucune balise ni entité HTML', () => {
    const texte = versionTexte('<div>Devis&nbsp;n&#39;1 &amp; facture<br>Merci</div>');
    expect(texte).not.toMatch(/<[^>]+>/);
    expect(texte).toContain("Devis n'1 & facture");
  });
});
