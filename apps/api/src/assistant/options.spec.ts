import {
  GROUPES_ACTIVITE,
  GROUPES_APPUI,
  GROUPES_ECRIT,
  catalogueChoix,
  consignesDepuisChoix,
  libellesRetenus,
} from './options';

const TOUS = [...GROUPES_ACTIVITE, ...GROUPES_ECRIT, ...GROUPES_APPUI];

describe('catalogue des choix', () => {
  it('expose les deux familles attendues', () => {
    const c = catalogueChoix();
    expect(c.activite.map((g) => g.cle)).toEqual(['mediations', 'competences', 'cadre']);
    expect(c.ecrit.map((g) => g.cle)).toEqual([
      'destinataire',
      'registre',
      'sections',
      'longueur',
    ]);
    expect(c.appui.map((g) => g.cle)).toEqual(['supports', 'obstacles', 'posture']);
  });

  it('donne à chaque groupe un titre, une aide et des choix', () => {
    for (const groupe of TOUS) {
      expect(groupe.titre.length).toBeGreaterThan(2);
      expect(groupe.aide.length).toBeGreaterThan(10);
      expect(groupe.choix.length).toBeGreaterThan(1);
    }
  });

  it('n’a aucune clé en double, ni dans un groupe ni entre groupes', () => {
    for (const groupe of TOUS) {
      const cles = groupe.choix.map((c) => c.cle);
      expect(new Set(cles).size).toBe(cles.length);
    }
    const clesGroupes = TOUS.map((g) => g.cle);
    expect(new Set(clesGroupes).size).toBe(clesGroupes.length);
  });

  it('n’expose que des clés sobres, sûres à faire transiter', () => {
    for (const groupe of TOUS) {
      for (const choix of groupe.choix) {
        expect(choix.cle).toMatch(/^[a-z0-9-]{2,40}$/);
        expect(choix.libelle.trim()).toBe(choix.libelle);
        expect(choix.libelle.length).toBeGreaterThan(2);
      }
    }
  });

  it('limite à un seul choix les groupes non multiples', () => {
    for (const groupe of TOUS) {
      if (!groupe.multiple) expect(groupe.max).toBe(1);
      else expect(groupe.max).toBeGreaterThan(1);
      expect(groupe.max).toBeLessThanOrEqual(groupe.choix.length);
    }
  });
});

describe('libellesRetenus', () => {
  const groupe = GROUPES_ACTIVITE[0];

  it('traduit les clés connues en libellés, dans l’ordre reçu', () => {
    expect(libellesRetenus(groupe, ['cuisine', 'musique'])).toEqual(['Cuisine', 'Musique']);
  });

  it('écarte en silence une clé inconnue plutôt que de la propager', () => {
    expect(libellesRetenus(groupe, ['cuisine', 'clé-bricolée', 'musique'])).toEqual([
      'Cuisine',
      'Musique',
    ]);
  });

  it('ignore les doublons', () => {
    expect(libellesRetenus(groupe, ['cuisine', 'cuisine'])).toEqual(['Cuisine']);
  });

  it('s’arrête au maximum du groupe', () => {
    const trop = groupe.choix.map((c) => c.cle);
    expect(libellesRetenus(groupe, trop)).toHaveLength(groupe.max);
  });

  it('rend un tableau vide quand rien n’est coché', () => {
    expect(libellesRetenus(groupe, undefined)).toEqual([]);
    expect(libellesRetenus(groupe, [])).toEqual([]);
  });
});

describe('consignesDepuisChoix', () => {
  it('ne produit rien quand rien n’est coché — LEX propose de lui-même', () => {
    expect(consignesDepuisChoix(GROUPES_ACTIVITE, {})).toEqual([]);
    expect(
      consignesDepuisChoix(GROUPES_ACTIVITE, { mediations: [], competences: undefined }),
    ).toEqual([]);
  });

  it('rend une ligne par groupe renseigné, titrée et ponctuée', () => {
    const lignes = consignesDepuisChoix(GROUPES_ACTIVITE, {
      mediations: ['cuisine'],
      cadre: ['budget-nul', 'temps-court'],
    });
    expect(lignes).toHaveLength(2);
    expect(lignes[0]).toBe('Supports envisagés : Cuisine.');
    expect(lignes[1]).toBe('Contraintes du terrain : Budget nul, Moins de 45 minutes.');
  });

  it('respecte l’ordre des groupes du catalogue, pas celui de la saisie', () => {
    const lignes = consignesDepuisChoix(GROUPES_ECRIT, {
      longueur: ['bref'],
      destinataire: ['juge'],
    });
    expect(lignes[0]).toContain('Pour qui');
    expect(lignes[1]).toContain('Longueur');
  });

  it('n’invente rien à partir d’un groupe entièrement inconnu', () => {
    expect(consignesDepuisChoix(GROUPES_ECRIT, { inexistant: ['peu importe'] })).toEqual([]);
  });
});

describe('appui scolaire', () => {
  it('sépare ce qu’on veut produire de ce qui bloque', () => {
    const [supports, obstacles, posture] = GROUPES_APPUI;
    expect(supports.choix.map((c) => c.cle)).toContain('script-de-deblocage');
    expect(obstacles.choix.map((c) => c.cle)).toContain('memorisation');
    expect(posture.multiple).toBe(false);
  });

  it('n’emploie aucun terme de diagnostic dans les obstacles', () => {
    const interdits = /dys|tdah|autis|trouble|handicap|retard|patholog|deficit|déficit/i;
    for (const choix of GROUPES_APPUI[1].choix) {
      expect(choix.libelle).not.toMatch(interdits);
      expect(choix.cle).not.toMatch(interdits);
    }
  });

  it('traduit les cases en consignes lisibles', () => {
    const lignes = consignesDepuisChoix(GROUPES_APPUI, {
      supports: ['fiche-memo'],
      obstacles: ['attention', 'confiance'],
      posture: ['individuel'],
    });
    expect(lignes).toHaveLength(3);
    expect(lignes[0]).toBe('Ce qu’on veut en sortir : Fiche mémo visuelle.');
    expect(lignes[2]).toBe('Comment ça se passe : En individuel.');
  });
});
