import {
  delaiDeCarence,
  dpaeAuPlusTot,
  dureeEnJours,
  indemniteFinDeContrat,
  limiteTransmission,
  mentionsManquantes,
  periodeEssaiMaxJours,
  ProjetContrat,
  synthese,
} from './contrat-cdd';

const d = (s: string) => new Date(`${s}T00:00:00Z`);

/** Un projet complet, que chaque test dégrade sur un seul point. */
const complet = (): ProjetContrat => ({
  motif: 'REMPLACEMENT_SALARIE_ABSENT',
  salarieRemplaceNom: 'Camille Roy',
  salarieRemplaceQualification: 'Éducatrice spécialisée',
  dateDebut: d('2026-09-01'),
  dateFin: d('2026-09-30'),
  poste: 'Éducateur spécialisé — internat',
  qualification: 'Éducateur spécialisé',
  conventionCollective: 'CCN 66',
  remunerationBrute: 2200,
  caisseRetraiteComplementaire: 'AG2R La Mondiale',
  organismePrevoyance: 'Malakoff Humanis',
  posteARisques: false,
});

const champs = (p: ProjetContrat) => mentionsManquantes(p).map((m) => m.champ).sort();

describe('contrat CDD', () => {
  describe('durée', () => {
    it('compte les bornes', () => {
      expect(dureeEnJours(d('2026-09-01'), d('2026-09-30'))).toBe(30);
      expect(dureeEnJours(d('2026-09-01'), d('2026-09-01'))).toBe(1);
    });
  });

  describe("période d'essai (art. L. 1242-10)", () => {
    it('compte un jour par semaine entamée', () => {
      expect(periodeEssaiMaxJours(7)).toBe(1);
      expect(periodeEssaiMaxJours(8)).toBe(2);
      expect(periodeEssaiMaxJours(30)).toBe(5);
    });

    it('plafonne à deux semaines jusqu’à six mois de contrat', () => {
      // 180 jours ≈ 26 semaines : le brut ferait 26 jours, le plafond ramène à 14.
      expect(periodeEssaiMaxJours(180)).toBe(14);
    });

    it('plafonne à un mois au-delà de six mois', () => {
      expect(periodeEssaiMaxJours(365)).toBe(30);
    });

    it('renvoie zéro sur une durée nulle', () => {
      expect(periodeEssaiMaxJours(0)).toBe(0);
    });
  });

  describe('indemnité de fin de contrat (art. L. 1243-8 et L. 1243-10)', () => {
    it('vaut 10 % du brut au terme normal', () => {
      const i = indemniteFinDeContrat(2200);
      expect(i.due).toBe(true);
      expect(i.montant).toBeCloseTo(220, 2);
    });

    it("n'est pas due si le salarié refuse un CDI", () => {
      const i = indemniteFinDeContrat(2200, 'REFUS_CDI');
      expect(i.due).toBe(false);
      expect(i.montant).toBe(0);
      expect(i.article).toContain('L. 1243-10');
    });

    it("n'est pas due en cas de faute grave ni de rupture par le salarié", () => {
      expect(indemniteFinDeContrat(1000, 'FAUTE_GRAVE').due).toBe(false);
      expect(indemniteFinDeContrat(1000, 'RUPTURE_SALARIE').due).toBe(false);
      expect(indemniteFinDeContrat(1000, 'FORCE_MAJEURE').due).toBe(false);
    });
  });

  describe('délai de carence (art. L. 1244-3-1)', () => {
    it('vaut un tiers pour un contrat d’au moins 14 jours', () => {
      const c = delaiDeCarence(30);
      expect(c.jours).toBe(10);
      expect(c.message).toContain("jours d'ouverture");
    });

    it('vaut la moitié en deçà de 14 jours', () => {
      expect(delaiDeCarence(10).jours).toBe(5);
    });

    it('bascule exactement à 14 jours', () => {
      expect(delaiDeCarence(14).jours).toBe(5); // tiers de 14 = 4,67 arrondi à 5
      expect(delaiDeCarence(13).jours).toBe(7); // moitié de 13 = 6,5 arrondi à 7
    });
  });

  describe('mentions obligatoires (art. L. 1242-12)', () => {
    it('ne signale rien sur un projet complet', () => {
      expect(mentionsManquantes(complet())).toEqual([]);
    });

    it('exige la personne remplacée quand le motif est un remplacement', () => {
      const p = { ...complet(), salarieRemplaceNom: '', salarieRemplaceQualification: null };
      expect(champs(p)).toEqual(['salarieRemplaceQualification', 'salarieRemplaceNom'].sort());
    });

    it("ne l'exige pas pour un accroissement d'activité", () => {
      const p: ProjetContrat = {
        ...complet(),
        motif: 'ACCROISSEMENT_TEMPORAIRE',
        salarieRemplaceNom: null,
        salarieRemplaceQualification: null,
      };
      expect(mentionsManquantes(p)).toEqual([]);
    });

    it('accepte un terme imprécis assorti d’une durée minimale', () => {
      const p = { ...complet(), dateFin: null, dureeMinimaleJours: 15 };
      expect(mentionsManquantes(p)).toEqual([]);
    });

    it('refuse un contrat sans terme ni durée minimale', () => {
      const p = { ...complet(), dateFin: null, dureeMinimaleJours: null };
      expect(champs(p)).toContain('dateFin');
    });

    it('exige la réponse sur les postes à risques, même négative', () => {
      const p = { ...complet(), posteARisques: null };
      expect(champs(p)).toContain('posteARisques');
      expect(mentionsManquantes({ ...complet(), posteARisques: false })).toEqual([]);
    });

    it('exige rémunération, convention, retraite et prévoyance', () => {
      const p: ProjetContrat = {
        ...complet(),
        remunerationBrute: 0,
        conventionCollective: '  ',
        caisseRetraiteComplementaire: null,
        organismePrevoyance: '',
      };
      expect(champs(p)).toEqual(
        ['caisseRetraiteComplementaire', 'conventionCollective', 'organismePrevoyance', 'remunerationBrute'].sort(),
      );
    });
  });

  describe('échéances', () => {
    it('donne deux jours ouvrables pour transmettre, en sautant le dimanche', () => {
      // 2026-09-05 est un samedi : +1 = dimanche (sauté), donc lundi puis mardi.
      expect(limiteTransmission(d('2026-09-05')).toISOString().slice(0, 10)).toBe('2026-09-08');
      // 2026-09-01 est un mardi : mercredi puis jeudi.
      expect(limiteTransmission(d('2026-09-01')).toISOString().slice(0, 10)).toBe('2026-09-03');
    });

    it('place la DPAE au plus tôt huit jours avant l’embauche', () => {
      expect(dpaeAuPlusTot(d('2026-09-10')).toISOString().slice(0, 10)).toBe('2026-09-02');
    });
  });

  describe('synthèse', () => {
    it('déclare le projet émissible et calcule tout', () => {
      const s = synthese(complet());
      expect(s.emissible).toBe(true);
      expect(s.dureeJours).toBe(30);
      expect(s.termePrecis).toBe(true);
      expect(s.periodeEssaiMaxJours).toBe(5);
      expect(s.indemniteFinDeContrat.montant).toBeCloseTo(220, 2);
      expect(s.carenceApres.jours).toBe(10);
      expect(s.motifLibelle).toBe("Remplacement d'un salarié absent");
      expect(s.avertissement).toContain('reste l');
    });

    it('bloque l’émission dès qu’une mention manque', () => {
      const s = synthese({ ...complet(), poste: '' });
      expect(s.emissible).toBe(false);
      expect(s.mentionsManquantes.map((m) => m.champ)).toContain('poste');
    });

    it('calcule sur la durée minimale quand le terme est imprécis', () => {
      const s = synthese({ ...complet(), dateFin: null, dureeMinimaleJours: 21 });
      expect(s.termePrecis).toBe(false);
      expect(s.dureeJours).toBe(21);
      expect(s.periodeEssaiMaxJours).toBe(3);
    });
  });
});
