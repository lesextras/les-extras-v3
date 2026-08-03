import {
  chiffrerVacation,
  MAJORATIONS_NEUTRES,
  ParametresMajorations,
  qualifierHeures,
} from './majorations';

/**
 * Ce que ces tests protègent : le découpage d'une vacation en heures de nuit,
 * de dimanche et de férié. C'est un calcul que personne ne fait juste à la
 * main dès qu'un service passe minuit — et c'est précisément là que l'outil
 * gagne sa place.
 *
 * Ils protègent aussi une règle de droit qui est la clé de tout le module :
 * en dehors du 1er mai, AUCUNE majoration n'est imposée par la loi dans le
 * secteur social et médico-social. Si un jour quelqu'un ajoute un taux par
 * défaut « pour faire joli », le test « aucune majoration inventée » tombera.
 */

const p = (o: Partial<ParametresMajorations> = {}): ParametresMajorations => ({
  ...MAJORATIONS_NEUTRES,
  ...o,
});

const d = (s: string) => new Date(s);

describe('découpage des heures de nuit', () => {
  it('compte une journée ordinaire sans nuit', () => {
    const h = qualifierHeures({ debut: d('2026-06-16T09:00:00Z'), fin: d('2026-06-16T17:00:00Z') }, p());
    expect(h.total).toBe(8);
    expect(h.nuit).toBe(0);
  });

  it('compte un service de nuit qui passe minuit', () => {
    // 21 h → 7 h avec une plage de nuit 21 h – 6 h : neuf heures de nuit sur
    // dix heures de service. C'est le cas typique de l'internat, et c'est
    // celui qu'on rate le plus souvent.
    const h = qualifierHeures(
      { debut: d('2026-06-16T21:00:00Z'), fin: d('2026-06-17T07:00:00Z') },
      p(),
    );
    expect(h.total).toBe(10);
    expect(h.nuit).toBe(9);
  });

  it('respecte une plage de nuit décalée', () => {
    // L'accord de branche du 17 avril 2002 laisse chaque établissement
    // positionner ses neuf heures dans l'amplitude 21 h – 7 h.
    const h = qualifierHeures(
      { debut: d('2026-06-16T21:00:00Z'), fin: d('2026-06-17T07:00:00Z') },
      p({ nuitDebutHeure: 22, nuitFinHeure: 7 }),
    );
    expect(h.nuit).toBe(9);
  });

  it('ne compte aucune nuit sur une vacation d’après-midi', () => {
    const h = qualifierHeures({ debut: d('2026-06-16T14:00:00Z'), fin: d('2026-06-16T20:00:00Z') }, p());
    expect(h.nuit).toBe(0);
  });
});

describe('découpage du dimanche', () => {
  it('compte les heures du dimanche', () => {
    // 14 juin 2026 est un dimanche.
    const h = qualifierHeures({ debut: d('2026-06-14T09:00:00Z'), fin: d('2026-06-14T17:00:00Z') }, p());
    expect(h.dimanche).toBe(8);
  });

  it('coupe au bon endroit une nuit du samedi au dimanche', () => {
    // Samedi 21 h → dimanche 7 h : trois heures le samedi, sept le dimanche.
    // Le calcul à la main se trompe presque toujours ici.
    const h = qualifierHeures(
      { debut: d('2026-06-13T21:00:00Z'), fin: d('2026-06-14T07:00:00Z') },
      p(),
    );
    expect(h.total).toBe(10);
    expect(h.dimanche).toBe(7);
    expect(h.nuit).toBe(9);
  });
});

describe('jours fériés', () => {
  it('reconnaît un férié travaillé', () => {
    // 14 juillet 2026.
    const h = qualifierHeures({ debut: d('2026-07-14T09:00:00Z'), fin: d('2026-07-14T17:00:00Z') }, p());
    expect(h.ferie).toBe(8);
    expect(h.premierMai).toBe(0);
    expect(h.feriesRencontres[0].nom).toBe('FETE_NATIONALE');
  });

  it('isole le 1er mai des autres fériés', () => {
    const h = qualifierHeures({ debut: d('2026-05-01T09:00:00Z'), fin: d('2026-05-01T17:00:00Z') }, p());
    expect(h.premierMai).toBe(8);
    expect(h.ferie).toBe(0);
  });

  it('coupe une nuit qui entre dans un férié à minuit', () => {
    // 30 avril 21 h → 1er mai 7 h : trois heures ordinaires, sept heures de
    // 1er mai. La bascule se fait à minuit pile.
    const h = qualifierHeures(
      { debut: d('2026-04-30T21:00:00Z'), fin: d('2026-05-01T07:00:00Z') },
      p(),
    );
    expect(h.premierMai).toBe(7);
    expect(h.nuit).toBe(9);
  });
});

describe('cumul dimanche et férié', () => {
  // Le 1er novembre 2026 (Toussaint) tombe un dimanche.
  const vacation = { debut: d('2026-11-01T09:00:00Z'), fin: d('2026-11-01T17:00:00Z') };

  it('ne cumule pas quand la convention l’exclut', () => {
    // La CCN 51 l'écrit noir sur blanc : « lorsqu'un jour férié tombe un
    // dimanche il n'y a pas de cumul ».
    const h = qualifierHeures(vacation, p({ cumulDimancheEtFerie: false }));
    expect(h.ferie).toBe(8);
    expect(h.dimanche).toBe(0);
  });

  it('cumule quand la convention le permet', () => {
    const h = qualifierHeures(vacation, p({ cumulDimancheEtFerie: true }));
    expect(h.ferie).toBe(8);
    expect(h.dimanche).toBe(8);
  });
});

describe('chiffrage', () => {
  it("n'invente aucune majoration quand rien n'est renseigné", () => {
    // LE test de garde du module. Aucun taux par défaut ne doit apparaître :
    // la loi n'impose ni majoration de nuit, ni majoration de dimanche, ni
    // majoration de férié dans le médico-social.
    const c = chiffrerVacation(
      { debut: d('2026-06-13T21:00:00Z'), fin: d('2026-06-14T07:00:00Z') },
      p(),
      15,
    );
    expect(c.lignes.every((l) => l.tauxPct === 0)).toBe(true);
    expect(c.totalMajorations).toBe(0);
    expect(c.totalEstime).toBe(150);
  });

  it('dit pourquoi la majoration est à zéro plutôt que de la taire', () => {
    const c = chiffrerVacation(
      { debut: d('2026-06-16T21:00:00Z'), fin: d('2026-06-17T07:00:00Z') },
      p(),
      15,
    );
    expect(c.avertissements.join(' ')).toContain('convention collective');
  });

  it('applique les taux conventionnels renseignés', () => {
    const c = chiffrerVacation(
      { debut: d('2026-06-16T21:00:00Z'), fin: d('2026-06-17T07:00:00Z') },
      p({ nuitPct: 10 }),
      20,
    );
    // 9 h de nuit × 20 € × 10 % = 18 €
    expect(c.lignes.find((l) => l.libelle.startsWith('Heures de nuit'))!.montant).toBeCloseTo(18, 2);
    expect(c.baseEstimee).toBe(200);
    expect(c.totalEstime).toBeCloseTo(218, 2);
  });

  it('majore le 1er mai de 100 % sans qu’on le lui demande', () => {
    // Le seul taux écrit en dur du module, parce qu'il vient de l'article
    // L. 3133-6 et non d'une convention.
    const c = chiffrerVacation(
      { debut: d('2026-05-01T09:00:00Z'), fin: d('2026-05-01T17:00:00Z') },
      p(),
      15,
    );
    const ligne = c.lignes.find((l) => l.libelle.includes('1er mai'))!;
    expect(ligne.tauxPct).toBe(100);
    expect(ligne.legale).toBe(true);
    expect(ligne.montant).toBeCloseTo(120, 2);
    expect(c.totalEstime).toBeCloseTo(240, 2);
  });

  it('explique la mécanique de paie du 1er mai', () => {
    // Le doublement du 1er mai n'est pas un taux horaire multiplié par deux :
    // c'est le salaire PLUS une indemnité d'un montant égal, sur deux lignes.
    const c = chiffrerVacation(
      { debut: d('2026-05-01T09:00:00Z'), fin: d('2026-05-01T17:00:00Z') },
      p(),
      15,
    );
    expect(c.avertissements.join(' ')).toContain('deux lignes distinctes');
  });

  it('compte les heures même sans taux horaire connu', () => {
    // Savoir qu'une vacation comporte neuf heures de nuit sert à vérifier un
    // bulletin, même quand le tarif n'est pas renseigné.
    const c = chiffrerVacation(
      { debut: d('2026-06-16T21:00:00Z'), fin: d('2026-06-17T07:00:00Z') },
      p({ nuitPct: 10 }),
      null,
    );
    expect(c.heures.nuit).toBe(9);
    expect(c.baseEstimee).toBeNull();
    expect(c.totalEstime).toBeNull();
  });

  it('rappelle toujours que les cotisations patronales s’ajoutent', () => {
    const c = chiffrerVacation(
      { debut: d('2026-06-16T09:00:00Z'), fin: d('2026-06-16T17:00:00Z') },
      p(),
      15,
    );
    expect(c.avertissements.join(' ')).toContain('cotisations patronales');
  });
});
