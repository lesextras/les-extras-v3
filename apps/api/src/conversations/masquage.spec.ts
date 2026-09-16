import { masquerCoordonnees } from './masquage';

/**
 * Le masquage protège le modèle économique : sans lui, le premier échange sert
 * à donner un numéro et la réservation se fait ailleurs.
 *
 * Mais un faux positif coûte plus cher qu'un faux négatif. Ce secteur parle en
 * effectifs, en âges, en horaires et en articles de loi toute la journée : une
 * règle trop large rendrait la messagerie inutilisable, et les gens
 * partiraient pour de bon. Les tests « ne touche pas » comptent donc autant que
 * les tests « masque ».
 */
describe('masquerCoordonnees', () => {
  describe('ce qui doit être retiré', () => {
    it.each([
      ['un courriel simple', 'Écrivez-moi à marie.dupont@asso.fr merci'],
      ['un courriel détourné', 'marie (at) asso (point) fr'],
      ['un courriel avec « arobase »', 'marie arobase asso point fr'],
      ['un 06 espacé', 'Mon numéro : 06 12 34 56 78'],
      ['un 06 collé', 'Appelez le 0612345678'],
      ['un 06 pointé', 'Tel 06.12.34.56.78'],
      ['un numéro international', 'Joignable au +33 6 12 34 56 78'],
      ['un numéro en 00 33', 'Depuis l’étranger : 00 33 1 45 67 89 10'],
      ['un lien complet', 'Voir https://mon-site.fr/contact'],
      ['un lien sans protocole', 'Tout est sur www.mon-site.fr'],
      ['un domaine nu', 'Mon site : monatelier.com'],
      ['un identifiant WhatsApp', 'WhatsApp : 0612345678'],
      ['un compte Instagram', 'Instagram @monatelier'],
    ])('retire %s', (_cas, texte) => {
      const r = masquerCoordonnees(texte);
      expect(r.masque).toBe(true);
      expect(r.texte).toContain('[coordonnées masquées]');
    });

    it('conserve le texte utile autour de la coordonnée', () => {
      const r = masquerCoordonnees(
        'Bonjour, je suis disponible le 12 mars. Mon numéro : 06 12 34 56 78. À bientôt.',
      );
      expect(r.texte).toContain('je suis disponible le 12 mars');
      expect(r.texte).toContain('À bientôt');
      expect(r.texte).not.toContain('06 12 34 56 78');
    });

    it('ne répète pas le marqueur quand plusieurs coordonnées se suivent', () => {
      const r = masquerCoordonnees('marie@asso.fr 06 12 34 56 78');
      const occurrences = r.texte.split('[coordonnées masquées]').length - 1;
      expect(occurrences).toBe(1);
    });
  });

  describe('ce qui ne doit PAS être touché', () => {
    it.each([
      ['un effectif', 'Nous accueillons 12 enfants de 6 à 11 ans.'],
      ['une durée', 'L’atelier dure 1 h 30, deux groupes de 8.'],
      ['une date', 'Séance le 12 mars 2026, de 14 h à 16 h.'],
      ['un article de loi', 'Voir l’article D351-10 du code de l’éducation.'],
      ['un montant', 'Le devis s’élève à 450 euros pour 3 séances.'],
      ['un code postal et une ville', 'L’établissement est à Melun 77000.'],
      ['un numéro de salle', 'Rendez-vous en salle 214, bâtiment B.'],
      ['une année', 'Le dispositif existe depuis 2019.'],
      ['un sigle métier', 'Le SESSAD et l’IME travaillent ensemble.'],
    ])('laisse %s intact', (_cas, texte) => {
      const r = masquerCoordonnees(texte);
      expect(r.masque).toBe(false);
      expect(r.texte).toBe(texte);
    });
  });

  describe('robustesse', () => {
    it('supporte un texte vide', () => {
      expect(masquerCoordonnees('')).toEqual({ texte: '', masque: false });
    });

    it('est idempotent — un texte déjà masqué ne bouge plus', () => {
      const premier = masquerCoordonnees('Appelez le 06 12 34 56 78');
      const second = masquerCoordonnees(premier.texte);
      expect(second.texte).toBe(premier.texte);
      expect(second.masque).toBe(false);
    });

    it('donne le même résultat à chaque appel (curseur des expressions remis à zéro)', () => {
      const texte = 'marie@asso.fr puis 06 12 34 56 78';
      const a = masquerCoordonnees(texte);
      const b = masquerCoordonnees(texte);
      expect(a.texte).toBe(b.texte);
    });
  });
});
