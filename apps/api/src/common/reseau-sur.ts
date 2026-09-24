import { lookup as dnsLookup, type LookupAddress } from 'node:dns';
import * as http from 'node:http';
import * as https from 'node:https';
import { isIP } from 'node:net';

/**
 * ALLER CHERCHER UNE ADRESSE DONNÉE PAR QUELQU'UN D'AUTRE, SANS OUVRIR LE RÉSEAU
 * INTERNE (24/09/2026).
 *
 * `importerMedia` téléchargeait n'importe quelle adresse http(s) fournie par un
 * membre d'un compte, en suivant les redirections, sans délai ni plafond, et
 * rangeait le résultat dans une médiathèque SERVIE PUBLIQUEMENT. Un compte
 * pouvait donc faire lire au serveur `http://minio:9000/...`, `http://localhost`,
 * l'adresse de métadonnées d'un hébergeur, ou n'importe quel service du réseau
 * Docker, puis récupérer la réponse par le lien public du média. C'est une
 * falsification de requête côté serveur (SSRF).
 *
 * Ce module ferme la porte à trois endroits :
 *
 *  1. l'adresse : http ou https seulement, ports 80 et 443, pas d'identifiants
 *     dans l'URL, pas de nom sans domaine (« minio », « postgres ») ;
 *  2. LA CONNEXION ELLE-MÊME : chaque adresse IP résolue est contrôlée AU
 *     MOMENT DE SE CONNECTER (option `lookup`), pas avant. Contrôler avant
 *     puis laisser `fetch` résoudre à nouveau laisserait passer un DNS qui
 *     change de réponse entre les deux (rebinding) ;
 *  3. les redirections sont suivies À LA MAIN, trois au plus, et chacune repasse
 *     les deux contrôles. Plus un délai et un plafond d'octets : un fichier
 *     sans fin ne remplit pas la mémoire du serveur.
 */

export class AdresseRefusee extends Error {}

/** L'adresse IP est-elle publique, donc joignable sans risque ? */
export function ipPublique(ip: string): boolean {
  const v = isIP(ip);
  if (v === 4) return ipv4Publique(ip);
  if (v === 6) {
    const bas = ip.toLowerCase();
    // IPv4 transportée en IPv6 : ::ffff:10.0.0.1 → on juge l'IPv4.
    const mappee = bas.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
    if (mappee) return ipv4Publique(mappee[1]);
    if (bas === '::' || bas === '::1') return false;
    if (/^f[cd]/.test(bas)) return false; // fc00::/7, adresses locales uniques
    if (/^fe[89ab]/.test(bas)) return false; // fe80::/10, lien local
    if (/^ff/.test(bas)) return false; // multidiffusion
    if (/^64:ff9b:/.test(bas)) return false; // NAT64, peut viser de l'IPv4 privée
    if (/^2001:db8:/.test(bas)) return false; // documentation
    return true;
  }
  return false;
}

function ipv4Publique(ip: string): boolean {
  const [a, b] = ip.split('.').map(Number);
  if (a === 0 || a === 10 || a === 127) return false;
  if (a === 100 && b >= 64 && b <= 127) return false; // 100.64/10, CGNAT
  if (a === 169 && b === 254) return false; // lien local, métadonnées d'hébergeur
  if (a === 172 && b >= 16 && b <= 31) return false;
  if (a === 192 && b === 168) return false;
  if (a === 192 && b === 0) return false; // 192.0.0/24 et 192.0.2/24
  if (a === 198 && (b === 18 || b === 19)) return false; // bancs d'essai
  if (a === 198 && b === 51) return false;
  if (a === 203 && b === 0) return false;
  if (a >= 224) return false; // multidiffusion et réservé
  return true;
}

/** Contrôle de forme, sans réseau. Lève `AdresseRefusee` avec un message lisible. */
export function verifierAdresse(brute: string): URL {
  let url: URL;
  try {
    url = new URL(brute);
  } catch {
    throw new AdresseRefusee("Cette adresse n'est pas valide.");
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    throw new AdresseRefusee('Seules les adresses http et https sont acceptées.');
  }
  if (url.username || url.password) {
    throw new AdresseRefusee("Une adresse contenant un identifiant ou un mot de passe n'est pas acceptée.");
  }
  if (url.port && url.port !== '80' && url.port !== '443') {
    throw new AdresseRefusee('Seuls les ports web habituels (80 et 443) sont acceptés.');
  }
  const hote = url.hostname.replace(/^\[|\]$/g, '').toLowerCase();
  if (isIP(hote)) {
    if (!ipPublique(hote)) throw new AdresseRefusee('Cette adresse désigne un réseau privé.');
  } else if (!hote.includes('.') || hote.endsWith('.local') || hote.endsWith('.internal') || hote === 'localhost' || hote.endsWith('.localhost')) {
    throw new AdresseRefusee('Cette adresse désigne un réseau privé.');
  }
  return url;
}

/** Résolution DNS qui refuse toute réponse privée : c'est elle que le socket utilise. */
function lookupPublic(
  hostname: string,
  options: { all?: boolean; family?: number },
  rappel: (err: NodeJS.ErrnoException | null, adresse: string | LookupAddress[], famille?: number) => void,
) {
  dnsLookup(hostname, { all: true, family: options.family ?? 0 }, (err, adresses) => {
    if (err) return rappel(err, '', 0);
    const liste = adresses as LookupAddress[];
    if (!liste.length || liste.some((a) => !ipPublique(a.address))) {
      const e = new AdresseRefusee('Cette adresse désigne un réseau privé.') as NodeJS.ErrnoException;
      e.code = 'EADRESSEPRIVEE';
      return rappel(e, '', 0);
    }
    if (options.all) return rappel(null, liste);
    return rappel(null, liste[0].address, liste[0].family);
  });
}

export interface Telechargement {
  octets: Buffer;
  type: string;
  /** L'adresse finale, après redirections. */
  url: URL;
}

/**
 * Télécharge une adresse publique. Refuse le réseau privé à chaque saut,
 * s'arrête au-delà de `maxOctets` ou de `delaiMs`.
 */
export async function telechargerAdressePublique(
  brute: string,
  opts: { maxOctets: number; delaiMs?: number; redirectionsMax?: number },
): Promise<Telechargement> {
  const delai = opts.delaiMs ?? 60_000;
  let url = verifierAdresse(brute);
  for (let saut = 0; saut <= (opts.redirectionsMax ?? 3); saut++) {
    const r = await unAppel(url, opts.maxOctets, delai);
    if ('redirection' in r) {
      url = verifierAdresse(new URL(r.redirection, url).toString());
      continue;
    }
    return { ...r, url };
  }
  throw new AdresseRefusee('Trop de redirections.');
}

function unAppel(
  url: URL,
  maxOctets: number,
  delai: number,
): Promise<{ redirection: string } | { octets: Buffer; type: string }> {
  const module = url.protocol === 'https:' ? https : http;
  return new Promise((resoudre, rejeter) => {
    const req = module.get(
      url,
      { lookup: lookupPublic as unknown as typeof dnsLookup, headers: { 'user-agent': 'pilote.toulali.fr (import de media)' } },
      (rep) => {
        const code = rep.statusCode ?? 0;
        if (code >= 300 && code < 400 && rep.headers.location) {
          rep.resume();
          return resoudre({ redirection: rep.headers.location });
        }
        if (code < 200 || code >= 300) {
          rep.resume();
          return rejeter(new Error(`réponse ${code}`));
        }
        const annonce = Number(rep.headers['content-length'] ?? 0);
        if (annonce > maxOctets) {
          rep.destroy();
          return rejeter(new AdresseRefusee('Le fichier dépasse la taille autorisée.'));
        }
        const morceaux: Buffer[] = [];
        let total = 0;
        rep.on('data', (m: Buffer) => {
          total += m.length;
          if (total > maxOctets) {
            rep.destroy();
            rejeter(new AdresseRefusee('Le fichier dépasse la taille autorisée.'));
            return;
          }
          morceaux.push(m);
        });
        rep.on('end', () =>
          resoudre({ octets: Buffer.concat(morceaux), type: String(rep.headers['content-type'] ?? '') }),
        );
        rep.on('error', rejeter);
      },
    );
    req.setTimeout(delai, () => req.destroy(new Error('délai dépassé')));
    req.on('error', rejeter);
  });
}
