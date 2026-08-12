import { describe, expect, it } from 'vitest';
import { premierVisuel, visuel, visuels } from '../media';

describe('visuel', () => {
  it("bascule la médiathèque héritée vers l'hôte qui la sert", () => {
    expect(visuel('https://les-extras.fr/wp-content/uploads/2025/02/handisport.jpeg')).toBe(
      'https://app.les-extras.fr/wp-content/uploads/2025/02/handisport.jpeg',
    );
    expect(visuel('https://www.les-extras.fr/wp-content/uploads/2023/03/younes.jpeg')).toBe(
      'https://app.les-extras.fr/wp-content/uploads/2023/03/younes.jpeg',
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
    ).toEqual(['https://app.les-extras.fr/wp-content/uploads/2023/04/groupe.jpg']);
  });

  it('renvoie le premier visuel affichable, pas le premier enregistré', () => {
    expect(
      premierVisuel([
        'https://les-extras.fr/wp-content/uploads/2025/01/handicap-psychique.jpg',
        'https://les-extras.fr/wp-content/uploads/2023/04/groupe.jpg',
      ]),
    ).toBe('https://app.les-extras.fr/wp-content/uploads/2023/04/groupe.jpg');
  });

  it('renvoie null quand la fiche n’a rien d’affichable', () => {
    expect(premierVisuel([])).toBeNull();
    expect(premierVisuel(null)).toBeNull();
  });
});
