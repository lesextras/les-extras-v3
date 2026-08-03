import {
  dateSolidariteValide,
  ferieDuJour,
  feriesDeLAnnee,
  feriesEntre,
  paques,
} from './feries';

/**
 * Trois des onze fêtes légales suivent Pâques, dont la date se calcule par
 * comput ecclésiastique. Une erreur d'un jour, et c'est la paie d'un
 * établissement entier qui est fausse — dans les deux sens : un férié oublié
 * fait perdre une majoration au salarié, un férié inventé fait payer
 * l'établissement pour rien.
 *
 * Les dates de contrôle ci-dessous sont vérifiables dans n'importe quel
 * calendrier.
 */

const jour = (f: ReturnType<typeof feriesDeLAnnee>, nom: string) =>
  f.find((x) => x.nom === nom)?.date;

describe('calcul de Pâques', () => {
  it('retrouve les dimanches de Pâques connus', () => {
    const d = (a: number) => paques(a).toISOString().slice(0, 10);
    expect(d(2024)).toBe('2024-03-31');
    expect(d(2025)).toBe('2025-04-20');
    expect(d(2026)).toBe('2026-04-05');
    expect(d(2027)).toBe('2027-03-28');
    expect(d(2028)).toBe('2028-04-16');
  });

  it('tombe toujours un dimanche', () => {
    // La propriété la plus simple à vérifier, et celle qui attrape la plupart
    // des erreurs d'implémentation du comput.
    for (let a = 2020; a <= 2060; a++) {
      expect(paques(a).getUTCDay()).toBe(0);
    }
  });

  it('reste dans la fenêtre du 22 mars au 25 avril', () => {
    // Bornes canoniques du calendrier grégorien.
    for (let a = 2020; a <= 2100; a++) {
      const d = paques(a).toISOString().slice(5, 10);
      expect(d >= '03-22' && d <= '04-25').toBe(true);
    }
  });
});

describe('les onze fêtes légales', () => {
  it('en compte onze, ni plus ni moins', () => {
    expect(feriesDeLAnnee(2026)).toHaveLength(11);
  });

  it('place correctement les fêtes mobiles de 2026', () => {
    const f = feriesDeLAnnee(2026);
    expect(jour(f, 'LUNDI_PAQUES')).toBe('2026-04-06');
    expect(jour(f, 'ASCENSION')).toBe('2026-05-14');
    expect(jour(f, 'LUNDI_PENTECOTE')).toBe('2026-05-25');
  });

  it('place correctement les fêtes fixes', () => {
    const f = feriesDeLAnnee(2026);
    expect(jour(f, 'JOUR_AN')).toBe('2026-01-01');
    expect(jour(f, 'FETE_TRAVAIL')).toBe('2026-05-01');
    expect(jour(f, 'VICTOIRE_1945')).toBe('2026-05-08');
    expect(jour(f, 'FETE_NATIONALE')).toBe('2026-07-14');
    expect(jour(f, 'ASSOMPTION')).toBe('2026-08-15');
    expect(jour(f, 'TOUSSAINT')).toBe('2026-11-01');
    expect(jour(f, 'ARMISTICE')).toBe('2026-11-11');
    expect(jour(f, 'NOEL')).toBe('2026-12-25');
  });

  it("l'Ascension tombe toujours un jeudi", () => {
    for (let a = 2024; a <= 2035; a++) {
      const d = feriesDeLAnnee(a).find((x) => x.nom === 'ASCENSION')!;
      expect(new Date(`${d.date}T00:00:00Z`).getUTCDay()).toBe(4);
    }
  });
});

describe('le régime du 1er mai', () => {
  it("est le seul jour férié chômé par la loi", () => {
    const f = feriesDeLAnnee(2026);
    const chomes = f.filter((x) => x.chomeParLaLoi);
    expect(chomes).toHaveLength(1);
    expect(chomes[0].nom).toBe('FETE_TRAVAIL');
  });

  it("est le seul à porter une majoration légale, de 100 %", () => {
    // C'est le point de droit qui gouverne tout le module de majorations :
    // hors 1er mai, aucune majoration de férié n'est imposée par la loi.
    const f = feriesDeLAnnee(2026);
    expect(f.filter((x) => x.majorationLegalePct > 0)).toHaveLength(1);
    expect(f.find((x) => x.nom === 'FETE_TRAVAIL')!.majorationLegalePct).toBe(100);
  });

  it('les dix autres ne portent aucune majoration légale', () => {
    const f = feriesDeLAnnee(2026).filter((x) => x.nom !== 'FETE_TRAVAIL');
    expect(f.every((x) => x.majorationLegalePct === 0)).toBe(true);
  });
});

describe("le droit local d'Alsace-Moselle", () => {
  it('ajoute la Saint-Étienne le 26 décembre', () => {
    const f = feriesDeLAnnee(2026, { droitLocal: true });
    expect(jour(f, 'SAINT_ETIENNE')).toBe('2026-12-26');
    expect(f).toHaveLength(12);
  });

  it("n'ajoute le Vendredi saint que si la commune l'ouvre", () => {
    // L'article L. 3134-13 réserve le Vendredi saint aux communes disposant
    // d'un temple protestant ou d'une église mixte : un drapeau
    // départemental serait faux.
    const sans = feriesDeLAnnee(2026, { droitLocal: true });
    expect(sans.find((x) => x.nom === 'VENDREDI_SAINT')).toBeUndefined();

    const avec = feriesDeLAnnee(2026, { droitLocal: true, vendrediSaint: true });
    expect(jour(avec, 'VENDREDI_SAINT')).toBe('2026-04-03');
    expect(avec).toHaveLength(13);
  });

  it("n'ajoute rien hors droit local", () => {
    const f = feriesDeLAnnee(2026, { vendrediSaint: true });
    expect(f).toHaveLength(11);
  });
});

describe('recherche sur une plage', () => {
  it('trouve les fériés à cheval sur deux années', () => {
    // Un contrat de remplacement qui court du 20 décembre au 5 janvier doit
    // voir Noël ET le Jour de l'An.
    const f = feriesEntre(
      new Date('2026-12-20T00:00:00Z'),
      new Date('2027-01-05T00:00:00Z'),
    );
    expect(f.map((x) => x.nom)).toEqual(['NOEL', 'JOUR_AN']);
  });

  it('reconnaît un jour férié isolé', () => {
    expect(ferieDuJour(new Date('2026-07-14T09:00:00Z'))?.nom).toBe('FETE_NATIONALE');
    expect(ferieDuJour(new Date('2026-07-15T09:00:00Z'))).toBeNull();
  });
});

describe('journée de solidarité', () => {
  it('refuse le 1er mai', () => {
    const r = dateSolidariteValide(new Date('2026-05-01T00:00:00Z'));
    expect(r.valide).toBe(false);
    expect(r.motif).toContain('L. 3133-4');
  });

  it('accepte le lundi de Pentecôte, qui n’est plus imposé depuis 2008', () => {
    // Contre-intuitif mais exact : la loi du 16 avril 2008 a supprimé le
    // lundi de Pentecôte comme date par défaut. Il reste férié et reste un
    // choix possible, mais ce n'est plus une obligation.
    expect(dateSolidariteValide(new Date('2026-05-25T00:00:00Z')).valide).toBe(true);
  });

  it('refuse Noël et la Saint-Étienne en Alsace-Moselle', () => {
    const o = { droitLocal: true };
    expect(dateSolidariteValide(new Date('2026-12-25T00:00:00Z'), o).valide).toBe(false);
    expect(dateSolidariteValide(new Date('2026-12-26T00:00:00Z'), o).valide).toBe(false);
  });

  it('accepte un jour ordinaire', () => {
    expect(dateSolidariteValide(new Date('2026-06-15T00:00:00Z')).valide).toBe(true);
  });
});
