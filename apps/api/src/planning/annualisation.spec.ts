import {
  ANNUALISATION_SUPPLETIVE,
  bilanAnnualisation,
  bilanPeriodePartielle,
  controlerParametres,
  PLAFOND_ANNUEL_LEGAL,
  SemaineTravaillee,
  volumeAnnuel,
} from './annualisation';

/**
 * L'annualisation est le poste où un logiciel de planning fait le plus de
 * dégâts quand il se trompe : les erreurs ne se voient qu'en fin d'année, sur
 * la paie de tout un établissement, et se rattrapent mal.
 *
 * Trois pièges sont couverts ici, dans l'ordre de leur coût.
 *
 * Le premier : confondre le volume à planifier et le seuil de déclenchement
 * des heures supplémentaires. Ce sont deux nombres différents. Un éducateur
 * de la CCN 66 avec dix-huit jours de congés trimestriels ne peut pas faire
 * mille six cent sept heures, mais son seuil reste à mille six cent sept sauf
 * accord contraire.
 *
 * Le deuxième : majorer deux fois les mêmes heures. Celles qui dépassent la
 * limite hebdomadaire haute sont payées avec le mois ; l'article L. 3121-44
 * impose de les retirer du décompte de fin de période.
 *
 * Le troisième : proratiser le seuil annuel pour un remplaçant. L'article
 * D. 3121-25 dit le contraire — on repasse à un décompte hebdomadaire.
 */

const semaines = (heures: number[], depart = '2026-01-05'): SemaineTravaillee[] =>
  heures.map((h, i) => {
    const d = new Date(`${depart}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() + i * 7);
    return { lundi: d.toISOString().slice(0, 10), heures: h };
  });

describe('contrôle des paramètres', () => {
  it('accepte les valeurs supplétives', () => {
    expect(controlerParametres(ANNUALISATION_SUPPLETIVE).valide).toBe(true);
  });

  it('refuse un seuil au-dessus de 1 607 heures', () => {
    // Cass. soc., 11 mai 2016, n° 14-29.512 : 1 607 h est un plafond, même
    // si le salarié n'a pas acquis tous ses congés. Laisser saisir 1 800 h
    // fabriquerait une infraction sous couvert de souplesse.
    const r = controlerParametres({ ...ANNUALISATION_SUPPLETIVE, seuilDeclenchementHS: 1800 });
    expect(r.valide).toBe(false);
    expect(r.erreurs[0]).toContain('L. 3121-41');
  });

  it('accepte un seuil inférieur, qu’un accord peut fixer', () => {
    // L'article 11.1 de l'accord de branche du 1er avril 1999 le prévoit
    // expressément : « un accord d'entreprise peut fixer une durée annuelle
    // inférieure ».
    expect(
      controlerParametres({ ...ANNUALISATION_SUPPLETIVE, seuilDeclenchementHS: 1540 }).valide,
    ).toBe(true);
  });

  it('refuse une majoration sous le plancher de 10 %', () => {
    const r = controlerParametres({ ...ANNUALISATION_SUPPLETIVE, majorationHS1Pct: 5 });
    expect(r.valide).toBe(false);
    expect(r.erreurs[0]).toContain('L. 3121-33');
  });

  it('accepte 10 %, qui est le plancher exact', () => {
    expect(
      controlerParametres({
        ...ANNUALISATION_SUPPLETIVE,
        majorationHS1Pct: 10,
        majorationHS2Pct: 10,
      }).valide,
    ).toBe(true);
  });

  it('refuse une limite hebdomadaire haute au-dessus de 48 heures', () => {
    const r = controlerParametres({ ...ANNUALISATION_SUPPLETIVE, limiteHebdoHaute: 50 });
    expect(r.valide).toBe(false);
    expect(r.erreurs[0]).toContain('L. 3121-20');
  });
});

describe('volume annuel à planifier', () => {
  const base = {
    annee: 2026,
    joursReposHebdo: 104,
    joursCongesPayes: 25,
    heuresParJour: 7,
    quotite: 1,
  };

  it('retire les congés trimestriels du volume planifiable', () => {
    // C'est le point qui distingue le secteur social du reste : dix-huit
    // jours de congés trimestriels retirent dix-huit jours de planning.
    const sans = volumeAnnuel({ ...base, joursCongesTrimestriels: 0 });
    const avec = volumeAnnuel({ ...base, joursCongesTrimestriels: 18 });
    expect(sans.joursTravaillables - avec.joursTravaillables).toBe(18);
    expect(sans.heuresAPlanifier - avec.heuresAPlanifier).toBeCloseTo(126, 2);
  });

  it('reste très en dessous de 1 607 heures pour un éducateur', () => {
    // La démonstration du piège : ce salarié ne peut PAS faire 1 607 heures.
    // Lui planifier ce volume serait mathématiquement impossible.
    const v = volumeAnnuel({ ...base, joursCongesTrimestriels: 18 });
    expect(v.heuresAPlanifier).toBeLessThan(PLAFOND_ANNUEL_LEGAL);
    expect(v.heuresAPlanifier).toBeGreaterThan(1350);
  });

  it('ajoute la journée de solidarité', () => {
    const avec = volumeAnnuel({ ...base, joursCongesTrimestriels: 0 });
    const sans = volumeAnnuel({ ...base, joursCongesTrimestriels: 0, journeeSolidarite: false });
    expect(avec.heuresAPlanifier - sans.heuresAPlanifier).toBeCloseTo(7, 2);
  });

  it('proratise au temps partiel', () => {
    const plein = volumeAnnuel({ ...base, joursCongesTrimestriels: 9 });
    const demi = volumeAnnuel({ ...base, joursCongesTrimestriels: 9, quotite: 0.5 });
    expect(demi.heuresAPlanifier).toBeCloseTo(plein.heuresAPlanifier / 2, 1);
  });

  it('détaille son calcul pour qu’il se vérifie à la main', () => {
    const v = volumeAnnuel({ ...base, joursCongesTrimestriels: 18 });
    expect(v.detail.congesTrimestriels).toBe(18);
    expect(v.detail.feriesChomes).toBeGreaterThan(0);
    expect(v.joursCalendaires).toBe(365);
  });
});

describe('bilan de fin de période', () => {
  const p = { ...ANNUALISATION_SUPPLETIVE, limiteHebdoHaute: 44 };

  it('ne déclenche rien tant que le seuil n’est pas franchi', () => {
    const b = bilanAnnualisation(semaines(Array(45).fill(35)), p);
    expect(b.heuresTravaillees).toBe(1575);
    expect(b.totalHeuresSup).toBe(0);
  });

  it('compte les heures au-delà du seuil en fin de période', () => {
    const b = bilanAnnualisation(semaines(Array(46).fill(35)), p);
    expect(b.heuresTravaillees).toBe(1610);
    expect(b.heuresSupFinDePeriode).toBe(3);
  });

  it('paie immédiatement les heures au-delà de la limite hebdomadaire', () => {
    const b = bilanAnnualisation(semaines([48, 35, 35]), p);
    expect(b.heuresSupHebdo).toBe(4);
    expect(b.semainesEnDepassement).toHaveLength(1);
  });

  it('ne majore pas deux fois les mêmes heures', () => {
    // LE test qui protège du bug le plus coûteux. Quarante-six semaines à 46 h
    // font 2 116 heures. Deux heures par semaine dépassent la limite de 44 h,
    // soit 92 h déjà payées. En fin de période, il reste
    // 2 116 − 1 607 − 92 = 417 h, et non 509.
    const b = bilanAnnualisation(semaines(Array(46).fill(46)), p);
    expect(b.heuresTravaillees).toBe(2116);
    expect(b.heuresSupHebdo).toBe(92);
    expect(b.heuresSupFinDePeriode).toBe(417);
    expect(b.totalHeuresSup).toBe(509);
    // Sans le retrait, on trouverait 92 + 509 = 601 heures majorées.
  });

  it('répartit selon le seuil de bascule entre les deux taux', () => {
    const b = bilanAnnualisation(semaines(Array(46).fill(35)), p);
    expect(b.heuresAuTaux1).toBe(3);
    expect(b.heuresAuTaux2).toBe(0);

    const c = bilanAnnualisation(semaines(Array(47).fill(36)), p);
    expect(c.heuresAuTaux1).toBe(8);
    expect(c.heuresAuTaux2).toBeGreaterThan(0);
  });

  it('signale le dépassement du contingent annuel', () => {
    const b = bilanAnnualisation(semaines(Array(46).fill(41)), p);
    expect(b.heuresHorsContingent).toBeGreaterThan(0);
    expect(b.alertes.join(' ')).toContain('L. 3121-30');
  });

  it('alerte sur une semaine au-delà de 48 heures', () => {
    // Ce n'est pas une heure supplémentaire de plus : c'est une infraction.
    const b = bilanAnnualisation(semaines([52, 35, 35]), p);
    expect(b.alertes.join(' ')).toContain('L. 3121-20');
  });

  it('alerte sur la moyenne de 44 heures sur douze semaines glissantes', () => {
    const b = bilanAnnualisation(semaines(Array(14).fill(46)), p);
    expect(b.alertes.join(' ')).toContain('L. 3121-22');
  });

  it('situe le réalisé par rapport au volume prévu', () => {
    const b = bilanAnnualisation(semaines(Array(40).fill(35)), p, 1456);
    expect(b.ecartAuVolumePrevu).toBe(1400 - 1456);
  });
});

describe('période incomplète — le cas du remplaçant', () => {
  it('décompte à la semaine, pas au prorata du seuil annuel', () => {
    // Article D. 3121-25 : en cas d'arrivée ou de départ en cours de période,
    // les heures au-delà de 35 h hebdomadaires sont supplémentaires. Le
    // prorata du seuil annuel serait une erreur — et c'est le réflexe naturel.
    const b = bilanPeriodePartielle(semaines([39, 35, 42]), ANNUALISATION_SUPPLETIVE);
    expect(b.totalHeuresSup).toBe(11);
    expect(b.semainesEnDepassement).toHaveLength(2);
  });

  it('explique pourquoi il ne proratise pas', () => {
    const b = bilanPeriodePartielle(semaines([39]), ANNUALISATION_SUPPLETIVE);
    expect(b.alertes.join(' ')).toContain('D. 3121-25');
  });

  it('proratise quand un accord le prévoit', () => {
    // La règle hebdomadaire est supplétive : un accord peut décider autrement
    // (article L. 3121-44, 3°).
    const b = bilanPeriodePartielle(
      semaines(Array(12).fill(40)),
      ANNUALISATION_SUPPLETIVE,
      'prorata',
      12 / 52,
    );
    // Seuil proratisé : 1 607 × 12/52 ≈ 371 h. Réalisé : 480 h.
    expect(b.heuresSupFinDePeriode).toBeGreaterThan(100);
  });

  it('alerte quand même sur les 48 heures', () => {
    const b = bilanPeriodePartielle(semaines([50]), ANNUALISATION_SUPPLETIVE);
    expect(b.alertes.join(' ')).toContain('L. 3121-20');
  });
});
