import { TUNNEL_ACCUEIL, lienTunnel } from './mail.service';

/**
 * LE TUNNEL PART À DES CENTAINES DE BOÎTES, ET IL PART SEUL.
 *
 * Un lien mort dans un message transactionnel se rattrape : la personne
 * réécrit. Un lien mort dans une séquence automatique part six fois, à tout le
 * monde, sans que personne ne le voie passer — c'est exactement le genre de
 * défaut qui ne se découvre que des mois plus tard, par hasard.
 *
 * Ces tests ne jugent pas la qualité du texte : ils vérifient ce qu'une
 * relecture humaine rate, c'est-à-dire la mécanique.
 */
describe("Tunnel d'accueil", () => {
  it('compte exactement six messages : la longueur que le planificateur attend', () => {
    // TunnelScheduler.ETAPES vaut 6. Si l'un des deux change sans l'autre, soit
    // le dernier message ne part jamais, soit le planificateur demande une
    // étape qui n'existe pas (et `sendTunnelAccueil` sort en silence).
    expect(TUNNEL_ACCUEIL).toHaveLength(6);
  });

  it('a un sujet, un corps et un bouton sur chaque message', () => {
    for (const m of TUNNEL_ACCUEIL) {
      expect(m.sujet.trim().length).toBeGreaterThan(10);
      expect(m.corps.trim().length).toBeGreaterThan(80);
      expect(m.bouton.trim().length).toBeGreaterThan(3);
    }
  });

  /**
   * ⚠ DEPUIS LE 28/09/2026 LES PARCOURS VIVENT SUR ADEPA77.FR (décision de
   * Siham) : le centre de formation ADéPA a son propre site, et chaque fiche y
   * porte le même slug que sur Les Extras. Une adresse absolue est donc
   * acceptée, mais UNE SEULE famille : `https://adepa77.fr/formations/…/`.
   * Tout autre domaine reste refusé, et un chemin interne passe toujours par
   * `webUrl` (le domaine du site peut encore changer).
   */
  const ADEPA = /^https:\/\/adepa77\.fr\/formations\/(?:[a-z0-9]+(?:-[a-z0-9]+)*\/)?$/;

  it('ne pointe que vers un chemin interne ou vers le catalogue d’adepa77.fr', () => {
    for (const m of TUNNEL_ACCUEIL) {
      expect(m.lien).not.toMatch(/\s/);
      if (/^[a-z]+:/i.test(m.lien) || m.lien.startsWith('//')) {
        expect(m.lien).toMatch(ADEPA);
      } else {
        expect(m.lien.startsWith('/')).toBe(true);
      }
    }
  });

  it('refuse toute autre adresse externe', () => {
    // Le motif lui-même : s'il laissait passer ces adresses, le test
    // précédent ne prouverait rien.
    for (const faux of [
      'https://les-extras.fr/formations/x/',
      'http://adepa77.fr/formations/',
      'https://adepa77.fr.exemple.com/formations/',
      'https://adepa77.fr/autre-page/',
      'https://exemple.com/https://adepa77.fr/formations/',
    ]) {
      expect(faux).not.toMatch(ADEPA);
    }
    expect('https://adepa77.fr/formations/les-premieres-minutes-d-une-crise/').toMatch(ADEPA);
  });

  it('préfixe un chemin interne par le domaine du site, et laisse une adresse absolue telle quelle', () => {
    expect(lienTunnel('/ateliers', 'https://les-extras.fr')).toBe('https://les-extras.fr/ateliers');
    expect(lienTunnel('https://adepa77.fr/formations/', 'https://les-extras.fr')).toBe(
      'https://adepa77.fr/formations/',
    );
  });

  it('ne renvoie jamais deux fois au même parcours', () => {
    const liens = TUNNEL_ACCUEIL.map((m) => m.lien);
    expect(new Set(liens).size).toBe(liens.length);
  });

  it("n'annonce ni remise, ni compte à rebours, ni échéance", () => {
    // Garde-fou volontaire : le modèle dont s'inspire cette séquence est bâti
    // sur « −86 % », « expire ce soir », « c'est terminé ». On ne les reprend
    // pas — l'association n'a rien à vendre ici, et une échéance annoncée qui
    // n'en est pas une est une pratique commerciale trompeuse (art. L121-1 et
    // s. du code de la consommation). Ce test le rend impossible par accident.
    const interdits =
      /(-\s?\d+\s?%|\d+\s?%\s*de\s*(remise|réduction)|expire|dernière chance|plus que quelques heures|offre limitée|compte à rebours)/i;
    for (const m of TUNNEL_ACCUEIL) {
      expect(`${m.sujet} ${m.corps} ${m.bouton}`).not.toMatch(interdits);
    }
  });
});
