import { describe, it, expect } from 'vitest';
import { titreSeo, texteDuTitre } from '../meta';

// Longueur affichée par Google ≈ 65 caractères ; le template du layout ajoute
// « · LES EXTRAS » (13 caractères). Ces tests vérifient que CHAQUE mode de
// sortie respecte la limite, et que l'éditorial n'est jamais mutilé quand une
// coupe naturelle existe.

const SUFFIXE = ' · LES EXTRAS';

/** Longueur telle que Google la verra, suffixe compris quand il s'applique. */
function longueurRendue(t: ReturnType<typeof titreSeo>): number {
  if (typeof t === 'string') return t.length + SUFFIXE.length;
  return texteDuTitre(t).length;
}

describe('titreSeo', () => {
  it('laisse intact un titre qui tient avec le suffixe', () => {
    expect(titreSeo('Le GAP, un espace de parole')).toBe('Le GAP, un espace de parole');
  });

  it("coupe au « : » quand le sujet seul est consistant", () => {
    const t = titreSeo(
      "Formation Qualiopi accueil des publics difficiles : un investissement qui protège l'équipe",
    );
    expect(t).toBe('Formation Qualiopi accueil des publics difficiles');
    expect(longueurRendue(t)).toBeLessThanOrEqual(65);
  });

  it("ne coupe PAS au « : » quand le sujet est trop maigre pour porter seul", () => {
    // « Échec Scolaire » (14) < 25 : couper là appauvrirait plus que ça n'aide.
    const t = titreSeo('Échec Scolaire : Lutter Contre Le Décrochage Scolaire');
    expect(t).toEqual({ absolute: 'Échec Scolaire : Lutter Contre Le Décrochage Scolaire' });
    expect(longueurRendue(t)).toBeLessThanOrEqual(65);
  });

  it('sacrifie le suffixe de marque avant le propos', () => {
    const t = titreSeo("Comment nous préparons l'arrivée d'un intervenant extérieur");
    expect(t).toEqual({ absolute: "Comment nous préparons l'arrivée d'un intervenant extérieur" });
  });

  it('coupe au dernier mot entier, jamais au milieu', () => {
    const t = titreSeo(
      'Éducateurs, Professeurs, Coachs, donnez un nouvel élan durable à votre carrière avec Les Extras',
    );
    const texte = texteDuTitre(t);
    expect(texte.endsWith('…')).toBe(true);
    expect(texte.length).toBeLessThanOrEqual(65);
    // Le caractère précédant l'ellipse termine un mot : pas de coupe interne.
    expect(texte.at(-2)).not.toBe(' ');
  });

  it('reste sous 65 caractères rendus pour tous les titres réels du site', () => {
    const reels = [
      'Activité physique adaptée en établissement : le programme PAPA',
      "Atelier estime de soi par la photo et la vidéo : redonner confiance aux jeunes accompagnés",
      'Analyse des pratiques professionnelles : un espace pour souffler et progresser',
      "Gestion de la violence en établissement : une formation pour outiller l'équipe",
      'Accompagnement des jeunes majeurs : éviter la sortie sèche',
      "L'atelier psycho-boxe : canaliser l'agressivité par le sport",
      'Atelier individuel ou collectif : comment choisir en établissement ?',
      "L'atelier socio-esthétique en établissement médico-social",
      "Recrutement éducateur freelance : bien cadrer un renfort d'équipe",
      'Atelier socio-esthétique : redonner une image positive de soi',
      "Bilan de compétences éducateur : pourquoi l'envisager pour votre équipe",
      'Faire Des Fiches De Révision : Optimiser Son Apprentissage',
    ];
    for (const titre of reels) {
      expect(longueurRendue(titreSeo(titre)), titre).toBeLessThanOrEqual(65);
    }
  });

  it('normalise les espaces multiples avant de mesurer', () => {
    expect(titreSeo('  Un   titre    aéré  ')).toBe('Un titre aéré');
  });
});
