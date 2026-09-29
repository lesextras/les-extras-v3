import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  chevauche,
  cleSlot,
  csv,
  demiJournee,
  demiJourneesDuPlanning,
  heuresRealisees,
  numero,
  objectifsEnListe,
  ordreSlot,
  totaux,
  traceValide,
} from './outils';
import { relanceDue, PALIERS_RELANCE } from './facturation-organisme.service';
import { cleEntreprise, estParticulier, masquer } from './documents-session.service';
import { pointsFormation, pointsOrganisme } from './edof';
import { instantParis } from './sessions-admin.service';
import { ouvertureFroid } from './qualite-session.service';

describe("Administration de l'organisme : les règles", () => {
  it('range une séance de 11 h à 12 h 30 le matin, et 14 h l’après-midi (heure de Paris)', () => {
    expect(demiJournee(instantParis('2026-10-12', '11:00'))).toBe('MORNING');
    expect(demiJournee(instantParis('2026-10-12', '12:59'))).toBe('MORNING');
    expect(demiJournee(instantParis('2026-10-12', '14:00'))).toBe('AFTERNOON');
    // Heure d'hiver : 25 octobre 2026 est un dimanche de changement.
    expect(demiJournee(instantParis('2026-11-03', '09:00'))).toBe('MORNING');
  });

  it('convertit le planning en demi-journées et compte les heures réalisées', () => {
    const planning = demiJourneesDuPlanning([
      { debut: instantParis('2026-10-12', '09:00'), fin: instantParis('2026-10-12', '12:30') },
      { debut: instantParis('2026-10-12', '13:30'), fin: instantParis('2026-10-12', '17:00') },
      { debut: instantParis('2026-10-13', '09:00'), fin: instantParis('2026-10-13', '12:00') },
    ]);
    expect(planning.map((p) => [p.cle, p.heures])).toEqual([
      ['2026-10-12:MORNING', 3.5],
      ['2026-10-12:AFTERNOON', 3.5],
      ['2026-10-13:MORNING', 3],
    ]);
    const presences = [
      { slotDate: new Date('2026-10-12T00:00:00Z'), slot: 'MORNING', present: true },
      { slotDate: new Date('2026-10-12T00:00:00Z'), slot: 'AFTERNOON', present: false },
      { slotDate: new Date('2026-10-13T00:00:00Z'), slot: 'MORNING', present: true },
    ];
    expect(heuresRealisees(presences, planning, 10)).toEqual({ heures: 6.5, estime: false });
    expect(heuresRealisees([], planning, 10)).toEqual({ heures: 0, estime: false });
  });

  it('sans planning, estime au prorata des demi-journées émargées de la session', () => {
    const p = [{ slotDate: new Date('2026-10-12T00:00:00Z'), slot: 'MORNING', present: true }];
    expect(heuresRealisees(p, [], 14, 4)).toEqual({ heures: 3.5, estime: true });
  });

  it('range le matin avant l’après-midi, pas par ordre alphabétique', () => {
    const cles = ['2026-10-13:MORNING', '2026-10-12:AFTERNOON', '2026-10-12:MORNING'];
    expect([...cles].sort(ordreSlot)).toEqual(['2026-10-12:MORNING', '2026-10-12:AFTERNOON', '2026-10-13:MORNING']);
  });

  it('les créneaux bout à bout ne se chevauchent pas', () => {
    const a = { debut: new Date('2026-10-12T08:00:00Z'), fin: new Date('2026-10-12T10:00:00Z') };
    expect(chevauche(a, { debut: new Date('2026-10-12T10:00:00Z'), fin: new Date('2026-10-12T12:00:00Z') })).toBe(false);
    expect(chevauche(a, { debut: new Date('2026-10-12T09:59:00Z'), fin: new Date('2026-10-12T12:00:00Z') })).toBe(true);
    expect(cleSlot(new Date('2026-10-12T00:00:00Z'), 'MORNING')).toBe('2026-10-12:MORNING');
  });

  it('arrondit les totaux ligne par ligne, comme sur la facture imprimée', () => {
    expect(totaux([{ libelle: 'a', quantite: 3, prixUnitaireHt: 33.333, tauxTva: 20 }])).toEqual({ totalHt: 100, totalTva: 20, totalTtc: 120 });
    expect(totaux([{ libelle: 'a', quantite: 1, prixUnitaireHt: 1200, tauxTva: 0 }])).toEqual({ totalHt: 1200, totalTva: 0, totalTtc: 1200 });
    expect(numero('FACTURE', 2026, 12)).toBe('F2026-00012');
    expect(numero('AVOIR', 2026, 1)).toBe('AV2026-00001');
    expect(numero('DEVIS', 2027, 3)).toBe('D2027-00003');
  });

  it('relance à J+1, J+15 et J+30, puis plus rien', () => {
    const echeance = new Date('2026-10-01T00:00:00Z');
    const le = (j: number) => new Date(echeance.getTime() + j * 86_400_000);
    expect(PALIERS_RELANCE).toEqual([1, 15, 30]);
    expect(relanceDue(echeance, 0, le(0))).toBeNull();
    expect(relanceDue(echeance, 0, le(1))).toBe(1);
    expect(relanceDue(echeance, 1, le(10))).toBeNull();
    expect(relanceDue(echeance, 1, le(15))).toBe(2);
    expect(relanceDue(echeance, 2, le(30))).toBe(3);
    expect(relanceDue(echeance, 3, le(90))).toBeNull();
  });

  it("un tracé de signature n'accepte que des traits", () => {
    const bon = 'M 10 10 L 20 20 L 30 25 L 40 30 L 50 30 L 60 40';
    expect(traceValide(bon)).toBe(bon);
    expect(traceValide('M 1 1')).toBeNull();
    expect(traceValide(`${bon} <script>`)).toBeNull();
    expect(traceValide(`${bon} Z`)).toBeNull();
    expect(traceValide(42)).toBeNull();
  });

  it('distingue le stagiaire qui paie lui-même (contrat) de celui qu’une entreprise envoie (convention)', () => {
    expect(estParticulier({ typeStagiaire: 'PARTICULIER', financing: 'ESTABLISHMENT' } as never)).toBe(true);
    expect(estParticulier({ typeStagiaire: 'SALARIE_PRIVE', financing: 'PERSONAL' } as never)).toBe(true);
    expect(estParticulier({ typeStagiaire: 'SALARIE_PRIVE', financing: 'OPCO' } as never)).toBe(false);
    expect(cleEntreprise('  MECS Les Tilleuls ')).toBe(cleEntreprise('mecs les tilleuls'));
    expect(cleEntreprise('Hôpital')).toBe('hopital');
  });

  it('masque l’adresse du signataire', () => {
    expect(masquer('camille@exemple.fr')).toBe('ca•••••@exemple.fr');
    expect(masquer(null)).toBe('');
  });

  it('découpe des objectifs écrits en liste, en puces ou en numéros', () => {
    expect(objectifsEnListe('- Rédiger un écrit\n2) Évaluer\n• Transmettre ; Observer')).toEqual(['Rédiger un écrit', 'Évaluer', 'Transmettre', 'Observer']);
    expect(csv('a;b')).toBe('"a;b"');
  });

  it("n'annonce une formation prête pour EDOF que si tout y est", () => {
    const f = {
      objectifBpf: 'RS',
      codeCertification: 'RS1234',
      objectives: 'x',
      prerequisites: 'Aucun',
      program: 'y',
      evaluation: 'z',
      durationHours: 14,
      sessionsAVenir: 1,
    };
    expect(pointsFormation(f).every((p) => p.ok)).toBe(true);
    expect(pointsFormation({ ...f, objectifBpf: 'AUTRE' })[0].ok).toBe(false);
    expect(pointsFormation({ ...f, codeCertification: null }).find((p) => p.cle === 'certification')!.ok).toBe(false);
    expect(pointsOrganisme({ nda: '11', siret: '1', qualiopi: 'CERTIFIE', certifieAu: new Date(Date.now() - 86_400_000) }).find((p) => p.cle === 'qualiopi')!.ok).toBe(false);
  });

  it("ouvre l'enquête à froid après le délai choisi", () => {
    expect(ouvertureFroid(new Date('2026-10-01T00:00:00Z'), 60).toISOString()).toBe('2026-11-30T00:00:00.000Z');
  });

  it('déclare les routes nommées avant les routes à paramètre', () => {
    const source = readFileSync(join(__dirname, 'gestion.controller.ts'), 'utf8');
    const position = (motif: string) => source.indexOf(motif);
    expect(position("@Get('factures/journal.csv')")).toBeLessThan(position("@Get('factures/:id')"));
    expect(position("@Get('qualite.csv')")).toBeLessThan(position("@Get('qualite')"));
    expect(position("@Get('bpf.xlsx')")).toBeLessThan(position("@Get('bpf')"));
    expect(position("@Post('sessions/:id/creneaux/serie')")).toBeLessThan(position("@Post('sessions/:id/creneaux')"));
  });

  it("n'imprime aucune identité d'organisme en dur dans les documents d'une académie", () => {
    const source = readFileSync(join(__dirname, 'documents-session.pdf.ts'), 'utf8').replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, '');
    expect(source).not.toMatch(/11771011677|ADéPA|82005185200011/);
  });
});
