import { TUNNEL_ACCUEIL } from './mail.service';

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

  it('ne pointe que vers des chemins internes du catalogue', () => {
    // Un chemin absolu (http…) contournerait `webUrl` : le message partirait
    // vers l'ancien domaine le jour où l'adresse du site change encore.
    for (const m of TUNNEL_ACCUEIL) {
      expect(m.chemin.startsWith('/formations')).toBe(true);
      expect(m.chemin).not.toMatch(/^https?:/);
      expect(m.chemin).not.toMatch(/\s/);
    }
  });

  it('ne renvoie jamais deux fois au même parcours', () => {
    const chemins = TUNNEL_ACCUEIL.map((m) => m.chemin);
    expect(new Set(chemins).size).toBe(chemins.length);
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
