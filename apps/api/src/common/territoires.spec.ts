/**
 * LE FILTRE DE LIEU ÉTAIT CASSÉ EN PRODUCTION, ET RIEN NE LE DISAIT.
 *
 * Ces cas sont les valeurs RÉELLES relevées dans `Service.city` le 4/09/2026,
 * pas des exemples inventés. Ils tiennent la promesse qui manquait : deux
 * graphies d'un même lieu doivent rendre le même résultat, et une ville doit
 * rendre son département.
 */
import {
  DEPARTEMENTS,
  CODES_IDF,
  normaliserLieu,
  departementsDepuisTexte,
  trouverDepartement,
  resumeTerritoire,
} from './territoires';

describe('Normalisation : deux graphies, un seul lieu', () => {
  it('réduit toutes les écritures de la région à la même clé', () => {
    const attendu = 'ile de france';
    for (const v of ['Île-de-France', 'Ile de France', 'ILE DE FRANCE', 'île de  france']) {
      expect(normaliserLieu(v)).toBe(attendu);
    }
  });

  it('rend les mêmes départements pour « Île-de-France » et « Ile de France »', () => {
    // C'EST LE BUG. En production, la première rendait 10 fiches, la seconde 3.
    expect(departementsDepuisTexte('Île-de-France')).toEqual(
      departementsDepuisTexte('Ile de France'),
    );
    expect(departementsDepuisTexte('Île-de-France')).toEqual([...CODES_IDF].sort());
  });
});

describe('Lecture des lieux réellement écrits sur les fiches', () => {
  it('rattache une commune à son département', () => {
    expect(departementsDepuisTexte('Melun')).toEqual(['77']);
    expect(departementsDepuisTexte('Créteil')).toEqual(['94']);
    expect(departementsDepuisTexte('Paris 12e')).toEqual(['75']);
  });

  it('reconnaît un département par son nom comme par son code', () => {
    expect(departementsDepuisTexte('Seine-et-Marne')).toEqual(['77']);
    expect(departementsDepuisTexte('77')).toEqual(['77']);
    expect(trouverDepartement('seine-et-marne')?.code).toBe('77');
    expect(trouverDepartement('94')?.nom).toBe('Val-de-Marne');
  });

  it("n'invente rien devant un lieu qu'il ne sait pas lire", () => {
    // Mieux vaut une fiche sans territoire qu'une fiche à qui l'on prête une
    // couverture qu'elle n'a jamais annoncée.
    expect(departementsDepuisTexte('Villeneuve-sur-Lot')).toEqual([]);
    expect(departementsDepuisTexte('')).toEqual([]);
    expect(departementsDepuisTexte(null)).toEqual([]);
    expect(trouverDepartement('Creuse')).toBeUndefined();
  });

  it('ne prête pas ses voisins à une fiche qui nomme une seule ville', () => {
    // « Melun » ne veut pas dire « toute l'Île-de-France ».
    expect(departementsDepuisTexte('Melun')).not.toEqual(expect.arrayContaining(['75']));
  });
});

describe('Affichage : ce que lit un directeur sur une carte', () => {
  it('résume les huit départements franciliens en une phrase', () => {
    expect(resumeTerritoire(CODES_IDF)).toBe("Toute l'Île-de-France");
  });

  it('nomme les territoires tant qu’ils tiennent, puis compte', () => {
    expect(resumeTerritoire(['77'])).toBe('Seine-et-Marne');
    expect(resumeTerritoire(['77', '91'])).toBe('Seine-et-Marne et Essonne');
    expect(resumeTerritoire(['75', '77', '91'])).toBe('Paris, Seine-et-Marne +1');
    expect(resumeTerritoire([])).toBeNull();
  });
});

describe('Le référentiel lui-même', () => {
  it('porte huit départements franciliens, sans doublon de code ni de slug', () => {
    expect(DEPARTEMENTS).toHaveLength(8);
    expect(new Set(DEPARTEMENTS.map((d) => d.code)).size).toBe(8);
    expect(new Set(DEPARTEMENTS.map((d) => d.slug)).size).toBe(8);
  });

  it('sait relire chacune de ses propres entrées', () => {
    // Un référentiel qui ne se relit pas lui-même laisserait passer une entrée
    // dont le nom ou le slug ne retrouve pas son département.
    for (const d of DEPARTEMENTS) {
      expect(trouverDepartement(d.slug)?.code).toBe(d.code);
      expect(trouverDepartement(d.nom)?.code).toBe(d.code);
      expect(trouverDepartement(d.code)?.code).toBe(d.code);
      expect(departementsDepuisTexte(d.nom)).toContain(d.code);
    }
  });
});
