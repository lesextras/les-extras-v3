import * as http from 'node:http';
import { AddressInfo } from 'node:net';
import { AdresseRefusee, ipPublique, telechargerAdressePublique, verifierAdresse } from './reseau-sur';
import { endpointPushAutorise } from '../push/web-push';

/**
 * SSRF, 24/09/2026 : le serveur ne va jamais lire une adresse de son propre
 * réseau à la demande d'un compte, ni directement, ni par redirection, ni par
 * un DNS qui répondrait une IP privée.
 */
describe('reseau-sur : téléchargement d’une adresse publique uniquement', () => {
  it.each([
    '127.0.0.1', '10.0.0.5', '172.16.3.4', '172.31.255.255', '192.168.1.1', '169.254.169.254',
    '100.64.0.1', '0.0.0.0', '224.0.0.1', '::1', '::', 'fe80::1', 'fd12:3456::1', '::ffff:127.0.0.1', '::ffff:10.1.2.3',
  ])('refuse l’IP privée ou locale %s', (ip) => expect(ipPublique(ip)).toBe(false));

  it.each(['8.8.8.8', '1.1.1.1', '2606:4700:4700::1111', '172.32.0.1'])('accepte l’IP publique %s', (ip) =>
    expect(ipPublique(ip)).toBe(true),
  );

  it.each([
    'file:///etc/passwd',
    'ftp://exemple.fr/a',
    'gopher://exemple.fr/',
    'http://localhost/a',
    'http://minio:9000/bucket/objet',
    'http://postgres/',
    'http://service.internal/',
    'http://127.0.0.1/',
    'http://[::1]/',
    'http://169.254.169.254/latest/meta-data/',
    'https://user:motdepasse@exemple.fr/',
    'https://exemple.fr:8443/fichier.mp4',
    'pas une adresse',
  ])('refuse l’adresse %s avant tout réseau', (url) => {
    expect(() => verifierAdresse(url)).toThrow(AdresseRefusee);
  });

  it('accepte une adresse publique ordinaire', () => {
    expect(verifierAdresse('https://videos.exemple.fr/cours/1.mp4').hostname).toBe('videos.exemple.fr');
  });

  it('refuse un nom de domaine qui se résout en adresse locale (au moment de la connexion)', async () => {
    // localtest.me et ses sous-domaines se résolvent publiquement en 127.0.0.1.
    // Sans réseau DNS, l'appel échoue aussi : dans les deux cas rien n'est lu.
    await expect(
      telechargerAdressePublique('http://localtest.me/', { maxOctets: 1000, delaiMs: 3000 }),
    ).rejects.toThrow();
  });

  describe('avec un serveur local (vérifie le refus même quand il répond)', () => {
    let serveur: http.Server;
    let port: number;
    beforeAll(async () => {
      serveur = http.createServer((_q, r) => r.end('secret interne'));
      await new Promise<void>((ok) => serveur.listen(0, '127.0.0.1', () => ok()));
      port = (serveur.address() as AddressInfo).port;
    });
    afterAll(() => serveur.close());

    it('ne lit jamais un service qui écoute sur la machine', async () => {
      await expect(
        telechargerAdressePublique(`http://127.0.0.1:${port}/`, { maxOctets: 1000 }),
      ).rejects.toThrow(AdresseRefusee);
    });
  });
});

describe('push : seuls les services des navigateurs', () => {
  it.each([
    ['https://fcm.googleapis.com/fcm/send/abc', true],
    ['https://updates.push.services.mozilla.com/wpush/v2/abc', true],
    ['https://web.push.apple.com/abc', true],
    ['http://fcm.googleapis.com/fcm/send/abc', false],
    ['https://evil.com/?x=.googleapis.com', false],
    ['https://googleapis.com.evil.com/', false],
    ['http://minio:9000/', false],
    ['https://127.0.0.1/', false],
  ])('%s → %s', (url, attendu) => expect(endpointPushAutorise(url)).toBe(attendu));
});
