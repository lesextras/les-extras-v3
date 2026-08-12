import { describe, it, expect } from 'vitest';
import {
  enMinutes,
  dateDeSerie,
  decouper,
  trouverEntete,
  lireMatrice,
  lirePlanningCsv,
  bilanParPersonne,
} from '@/lib/planning/lecture';

/**
 * CE QUI SE TESTE ICI, C'EST LE COMPTAGE.
 *
 * Une erreur d'une heure sur un planning d'équipe ne se voit pas à l'œil : elle
 * se retrouve dans un compteur, puis dans une paie. Les cas ci-dessous sont
 * ceux qui font vraiment se tromper — le poste de nuit, la fraction décimale
 * d'Excel, la case vide qui décale une ligne, la colonne absente.
 */

describe('Lecture des horaires', () => {
  it('lit les écritures courantes d’un horaire', () => {
    expect(enMinutes('09:00')).toBe(540);
    expect(enMinutes('9h00')).toBe(540);
    expect(enMinutes('9h30')).toBe(570);
    expect(enMinutes('9')).toBe(540);
    expect(enMinutes('21h15')).toBe(1275);
  });

  it('comprend la fraction de journée qu’écrit un tableur', () => {
    // Excel stocke 9 h du matin comme 0,375 de journée.
    expect(enMinutes('0.375')).toBe(540);
    expect(enMinutes('0,375')).toBe(540);
    expect(enMinutes('0.5')).toBe(720);
  });

  it('refuse « 8.5 » plutôt que de trancher entre 8 h 30 et 8 h 05', () => {
    // Une demi-heure de travail par ligne, sur un mois, fait une journée.
    // On ne devine pas : la ligne est signalée, l'utilisateur corrige.
    expect(enMinutes('8.5')).toBeNull();
    expect(enMinutes('9.30')).toBeNull();
    expect(enMinutes('9:30')).toBe(570);
  });

  it('refuse ce qu’il ne comprend pas au lieu de rendre zéro', () => {
    expect(enMinutes('')).toBeNull();
    expect(enMinutes('matin')).toBeNull();
    expect(enMinutes('25:00')).toBeNull();
    expect(enMinutes('9h70')).toBeNull();
  });
});

describe('Numéro de série d’un tableur', () => {
  it('rend la date que l’utilisateur a saisie', () => {
    // 1er septembre 2026 dans le calendrier d'Excel.
    expect(dateDeSerie(46266)).toBe('2026-09-01');
  });
});

describe('Découpage CSV', () => {
  it('respecte les guillemets et les séparateurs à l’intérieur', () => {
    expect(decouper('a;"b;c";d', ';')).toEqual(['a', 'b;c', 'd']);
    expect(decouper('"Il dit ""oui""";x', ';')).toEqual(['Il dit "oui"', 'x']);
  });
});

describe('Repérage de l’en-tête', () => {
  it('saute un titre posé au-dessus du tableau', () => {
    const m = [
      ['Planning de septembre'],
      [''],
      ['Nom', 'Date', 'Début', 'Fin'],
      ['Sophie', '2026-09-01', '09:00', '17:00'],
    ];
    expect(trouverEntete(m)).toBe(2);
  });

  it('rend -1 quand personne et date ne sont pas nommées ensemble', () => {
    expect(trouverEntete([['prénom', 'heure'], ['x', 'y']])).toBe(-1);
  });
});

describe('Comptage des heures', () => {
  const enTete = ['personne', 'date', 'debut', 'fin', 'type'];

  it('compte une journée ordinaire', () => {
    const r = lireMatrice([enTete, ['Sophie', '2026-09-01', '09:00', '17:00', 'travail']]);
    expect(r.lignes).toHaveLength(1);
    expect(r.lignes[0].heures).toBe(8);
    expect(r.lignes[0].estAbsence).toBe(false);
  });

  it('compte un poste de nuit qui finit le lendemain', () => {
    // 21 h → 7 h fait dix heures. Sans cela, la personne sortirait à -14 h.
    const r = lireMatrice([enTete, ['Karim', '2026-09-01', '21:00', '07:00', 'travail']]);
    expect(r.lignes[0].heures).toBe(10);
  });

  it('ne compte pas d’heures sur une absence', () => {
    const r = lireMatrice([enTete, ['Sophie', '2026-09-02', '', '', 'congé']]);
    expect(r.lignes[0].estAbsence).toBe(true);
    expect(r.lignes[0].heures).toBe(0);
  });

  it('signale une ligne illisible au lieu de la compter pour zéro', () => {
    const r = lireMatrice([enTete, ['Sophie', '2026-09-03', 'matin', 'soir', 'travail']]);
    expect(r.lignes).toHaveLength(0);
    expect(r.refusees).toHaveLength(1);
    expect(r.refusees[0].raison).toContain('horaire illisible');
  });

  it('signale une ligne sans personne ni date', () => {
    const r = lireMatrice([enTete, ['', '2026-09-03', '09:00', '17:00', 'travail']]);
    expect(r.refusees[0].raison).toContain('personne ou date');
  });

  it('nomme les colonnes manquantes plutôt que de deviner', () => {
    const r = lireMatrice([['prénom', 'horaire'], ['Sophie', '9h']]);
    expect(r.lignes).toHaveLength(0);
    expect(r.colonnesManquantes).toEqual(['personne', 'date']);
  });

  it('convertit une date écrite en numéro de série', () => {
    const r = lireMatrice([enTete, ['Sophie', '46266', '09:00', '17:00', 'travail']]);
    expect(r.lignes[0].date).toBe('2026-09-01');
  });
});

describe('Lecture d’un CSV complet', () => {
  it('choisit le point-virgule quand Excel FR l’a écrit', () => {
    const csv = [
      'personne;date;debut;fin;type',
      'Sophie Marchand;2026-09-01;09:00;17:00;travail',
      'Sophie Marchand;2026-09-02;;;congé',
      'Karim Belhadj;2026-09-01;21:00;07:00;travail',
    ].join('\n');
    const r = lirePlanningCsv(csv);
    expect(r.lignes).toHaveLength(3);
    expect(r.refusees).toHaveLength(0);

    const b = bilanParPersonne(r.lignes);
    expect(b).toHaveLength(2);
    expect(b[0]).toMatchObject({ personne: 'Karim Belhadj', heuresTravaillees: 10, joursAbsence: 0 });
    expect(b[1]).toMatchObject({ personne: 'Sophie Marchand', heuresTravaillees: 8, joursAbsence: 1 });
  });

  it('accepte aussi la virgule', () => {
    const r = lirePlanningCsv('personne,date,debut,fin\nSophie,2026-09-01,09:00,17:00');
    expect(r.lignes[0].heures).toBe(8);
  });
});
