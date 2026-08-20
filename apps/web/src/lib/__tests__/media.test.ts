import { describe, expect, it } from 'vitest';
import { MEDIATHEQUE, premierVisuel, visuel, visuels, wp } from '../media';

// LES ATTENDUS SE CALCULENT, ILS NE SE RECOPIENT PAS.
//
// Ils citaient `app.les-extras.fr` en toutes lettres. Au déménagement suivant
// de la médiathèque (20/08/2026, vers ialexia.fr), trois tests ont cassé alors
// que le code était juste — un test qui punit un changement légitime finit par
// être désactivé plutôt que lu. On vérifie désormais le COMPORTEMENT (l'hôte
// hérité est réécrit vers celui qui sert) et non la valeur du jour.

describe('visuel', () => {
  it("bascule la médiathèque héritée vers l'hôte qui la sert", () => {
    expect(visuel('https://les-extras.fr/wp-content/uploads/2025/02/handisport.jpeg')).toBe(
      wp('/wp-content/uploads/2025/02/handisport.jpeg'),
    );
    expect(visuel('https://www.les-extras.fr/wp-content/uploads/2023/03/younes.jpeg')).toBe(
      wp('/wp-content/uploads/2023/03/younes.jpeg'),
    );
  });

  it('ne touche pas aux adresses du SaaS, qui vit sur les mêmes domaines', () => {
    expect(visuel('https://les-extras.fr/api/files/abc.jpg')).toBe(
      'https://les-extras.fr/api/files/abc.jpg',
    );
    expect(visuel('/api/files/abc.jpg')).toBe('/api/files/abc.jpg');
  });

  it('laisse passer les autres hôtes', () => {
    const s3 = 'https://s3.adepa77.fr/visuel.png';
    expect(visuel(s3)).toBe(s3);
  });

  it('écarte le portrait d’enfant, quel que soit son hôte', () => {
    expect(visuel('https://les-extras.fr/wp-content/uploads/2025/02/handicap-psychique.jpg')).toBeNull();
    expect(visuel('https://app.les-extras.fr/wp-content/uploads/2025/01/handicap-psychique.jpg')).toBeNull();
    expect(visuel(wp('/wp-content/uploads/2025/01/handicap-psychique.jpg'))).toBeNull();
  });

  it('traite le vide comme une absence de visuel', () => {
    expect(visuel(null)).toBeNull();
    expect(visuel('   ')).toBeNull();
  });
});

describe('visuels / premierVisuel', () => {
  it('conserve l’ordre et retire les visuels inutilisables', () => {
    expect(
      visuels([
        'https://les-extras.fr/wp-content/uploads/2025/02/handicap-psychique.jpg',
        'https://les-extras.fr/wp-content/uploads/2023/04/groupe.jpg',
        '',
      ]),
    ).toEqual([wp('/wp-content/uploads/2023/04/groupe.jpg')]);
  });

  it('renvoie le premier visuel affichable, pas le premier enregistré', () => {
    expect(
      premierVisuel([
        'https://les-extras.fr/wp-content/uploads/2025/01/handicap-psychique.jpg',
        'https://les-extras.fr/wp-content/uploads/2023/04/groupe.jpg',
      ]),
    ).toBe(wp('/wp-content/uploads/2023/04/groupe.jpg'));
  });

  it('renvoie null quand la fiche n’a rien d’affichable', () => {
    expect(premierVisuel([])).toBeNull();
    expect(premierVisuel(null)).toBeNull();
  });
});

describe('médiathèque', () => {
  it('déclare un hôte, et wp() le respecte', () => {
    expect(MEDIATHEQUE).toMatch(/^[a-z0-9.-]+$/);
    expect(wp('/wp-content/x.jpg')).toBe(`https://${MEDIATHEQUE}/wp-content/x.jpg`);
    // Tolérance sur le chemin : `wp('wp-content/x.jpg')` ne doit pas produire
    // une URL sans barre oblique.
    expect(wp('wp-content/x.jpg')).toBe(`https://${MEDIATHEQUE}/wp-content/x.jpg`);
  });

  it("n'est jamais un hôte hérité — sinon la réécriture boucle", () => {
    expect(visuel(wp('/wp-content/uploads/a.jpg'))).toBe(wp('/wp-content/uploads/a.jpg'));
  });
});
