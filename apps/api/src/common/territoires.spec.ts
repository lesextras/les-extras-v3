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
  REGIONS,
  codesDeLaRegion,
  normaliserLieu,
  departementsDepuisTexte,
  trouverDepartement,
  trouverRegion,
  resumeTerritoire,
} from './territoires';

const IDF = codesDeLaRegion('Île-de-France');

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
    expect(departementsDepuisTexte('Île-de-France')).toEqual([...IDF].sort());
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
    expect(departementsDepuisTexte('Kinshasa')).toEqual([]);
    expect(departementsDepuisTexte('')).toEqual([]);
    expect(departementsDepuisTexte(null)).toEqual([]);
    expect(trouverDepartement('Atlantide')).toBeUndefined();
  });

  it('lit désormais les départements hors Île-de-France', () => {
    // La liste s'arrêtait aux huit départements franciliens : un intervenant
    // lyonnais ne pouvait pas même DÉCRIRE son territoire.
    expect(departementsDepuisTexte('Lyon')).toEqual(['69']);
    expect(departementsDepuisTexte('Marseille')).toEqual(['13']);
    expect(departementsDepuisTexte('HANCHES')).toEqual(['28']);
    expect(trouverDepartement('la-reunion')?.code).toBe('974');
  });

  it('ne prête pas ses voisins à une fiche qui nomme une seule ville', () => {
    // « Melun » ne veut pas dire « toute l'Île-de-France ».
    expect(departementsDepuisTexte('Melun')).not.toEqual(expect.arrayContaining(['75']));
  });
});

describe('Affichage : ce que lit un directeur sur une carte', () => {
  it('remonte d’un cran dès qu’une région est entièrement couverte', () => {
    expect(resumeTerritoire(IDF)).toBe("Toute l'Île-de-France");
    expect(resumeTerritoire(codesDeLaRegion('Bretagne'))).toBe('Toute la Bretagne');
  });

  it('dit « Toute la France » plutôt que cent un noms', () => {
    expect(resumeTerritoire(DEPARTEMENTS.map((d) => d.code))).toBe('Toute la France');
  });

  it('nomme les territoires tant qu’ils tiennent, puis compte', () => {
    expect(resumeTerritoire(['77'])).toBe('Seine-et-Marne');
    expect(resumeTerritoire(['77', '91'])).toBe('Seine-et-Marne et Essonne');
    expect(resumeTerritoire(['75', '77', '91'])).toBe('Paris, Seine-et-Marne +1');
    expect(resumeTerritoire([])).toBeNull();
  });
});

describe('Le référentiel lui-même', () => {
  it('porte les cent un départements français, sans doublon de code ni de slug', () => {
    // 96 métropolitains (Corse comptée 2A/2B) + 5 départements d'outre-mer.
    expect(DEPARTEMENTS).toHaveLength(101);
    expect(new Set(DEPARTEMENTS.map((d) => d.code)).size).toBe(101);
    expect(new Set(DEPARTEMENTS.map((d) => d.slug)).size).toBe(101);
    expect(REGIONS).toHaveLength(18);
  });

  it('rend une région entière depuis son nom', () => {
    expect(trouverRegion('ile de france')).toBe('Île-de-France');
    expect(departementsDepuisTexte('Bretagne')).toEqual(codesDeLaRegion('Bretagne').sort());
    expect(departementsDepuisTexte('Occitanie')).toHaveLength(13);
  });

  it('lit « toute la France » comme le référentiel entier', () => {
    expect(departementsDepuisTexte('France entière')).toHaveLength(101);
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
