import { chiffrer, heuresParJour, joursCouverts, minutesDepuisMinuit } from './proposition';

/**
 * Le chiffrage d'une proposition décide de ce qu'un directeur lit avant de
 * s'engager. Deux pièges sont couverts ici parce qu'ils viennent du terrain :
 * les horaires sont saisis dans des formats variés, et l'internat travaille
 * la nuit — un service de 21 h à 7 h ne dure pas moins dix-quatre heures.
 */

describe('proposition d’engagement — chiffrage', () => {
  describe('lecture des horaires', () => {
    it('accepte les formats saisis en vrai', () => {
      expect(minutesDepuisMinuit('09h00')).toBe(540);
      expect(minutesDepuisMinuit('9:00')).toBe(540);
      expect(minutesDepuisMinuit('9h')).toBe(540);
      expect(minutesDepuisMinuit('21h30')).toBe(1290);
    });

    it('refuse ce qui n’est pas une heure', () => {
      expect(minutesDepuisMinuit('matin')).toBeNull();
      expect(minutesDepuisMinuit('25h00')).toBeNull();
      expect(minutesDepuisMinuit('9h70')).toBeNull();
      expect(minutesDepuisMinuit(null)).toBeNull();
    });
  });

  describe('durée d’une vacation', () => {
    it('compte une journée ordinaire', () => {
      expect(heuresParJour('09h00', '17h00')).toBe(8);
    });

    it('compte un service de nuit qui passe minuit', () => {
      // 21 h → 7 h, c'est dix heures de nuit, pas moins quatorze.
      expect(heuresParJour('21h00', '07h00')).toBe(10);
    });

    it('gère les demi-heures', () => {
      expect(heuresParJour('08h30', '16h15')).toBe(7.75);
    });

    it('renvoie null quand un horaire manque', () => {
      expect(heuresParJour('09h00', null)).toBeNull();
    });
  });

  describe('jours couverts', () => {
    const d = (s: string) => new Date(`${s}T00:00:00Z`);

    it('compte les bornes', () => {
      expect(joursCouverts(d('2026-09-01'), d('2026-09-03'))).toBe(3);
    });

    it('vaut un jour sans date de fin', () => {
      expect(joursCouverts(d('2026-09-01'), null)).toBe(1);
    });
  });

  describe('chiffrage complet', () => {
    const base = {
      startDate: new Date('2026-09-01T00:00:00Z'),
      endDate: new Date('2026-09-05T00:00:00Z'),
      startTime: '09h00',
      endTime: '17h00',
      hourlyRate: 14.5,
      headcount: 1,
    };

    it('multiplie heures, jours et postes', () => {
      const c = chiffrer(base);
      expect(c.heuresParJour).toBe(8);
      expect(c.jours).toBe(5);
      expect(c.heuresTotales).toBe(40);
      expect(c.brutEstime).toBeCloseTo(580, 2);
    });

    it('tient compte de plusieurs postes à pourvoir', () => {
      expect(chiffrer({ ...base, headcount: 2 }).heuresTotales).toBe(80);
    });

    it('ne chiffre rien sans taux annoncé, mais compte les heures', () => {
      const c = chiffrer({ ...base, hourlyRate: null });
      expect(c.heuresTotales).toBe(40);
      expect(c.brutEstime).toBeNull();
    });

    it('ne chiffre rien sans horaires', () => {
      const c = chiffrer({ ...base, startTime: null, endTime: null });
      expect(c.heuresTotales).toBeNull();
      expect(c.brutEstime).toBeNull();
    });

    it('dit ce que le montant ne comprend pas, et ce que le document n’est pas', () => {
      const c = chiffrer(base);
      expect(c.avertissement).toContain('cotisations patronales');
      expect(c.avertissement).toContain("n'est pas un contrat de travail");
    });
  });
});
