import { describe, expect, it } from 'vitest';
import { dansLaBande, decaler, fenetre, placer, preparer, toucheLeJour, type EvenementBrut } from '../../app/_shared/agenda/outils';

const brut = (id: string, debut: string, fin: string | null, journeeEntiere = false): EvenementBrut => ({
  id,
  source: 'RENDEZ_VOUS',
  rendezVousId: id,
  titre: id,
  detail: null,
  lieu: null,
  lien: null,
  debut,
  fin,
  journeeEntiere,
  categorie: null,
  participants: [],
  modifiable: true,
  href: null,
  par: null,
});
const ev = (id: string, debut: string, fin: string | null, j = false) => preparer(brut(id, debut, fin, j), 'moi', '#e11d48', 'Mon agenda');

describe('Mon agenda : fenêtres', () => {
  it('la semaine commence le lundi, même un dimanche', () => {
    const { jours } = fenetre('semaine', new Date(2026, 8, 27)); // dimanche 27/09/2026
    expect(jours[0].getDay()).toBe(1);
    expect(jours[0].getDate()).toBe(21);
    expect(jours).toHaveLength(7);
  });
  it('la semaine de travail affiche 5 jours', () => {
    expect(fenetre('semaineTravail', new Date(2026, 8, 24)).jours).toHaveLength(5);
  });
  it('le mois couvre six semaines entières', () => {
    const { jours } = fenetre('mois', new Date(2026, 8, 15));
    expect(jours).toHaveLength(42);
    expect(jours[0].getDay()).toBe(1);
  });
  it('les flèches avancent d’un mois, sans glisser au 31', () => {
    const r = decaler('mois', new Date(2026, 0, 31), 1);
    expect(r.getMonth()).toBe(1);
  });
});

describe('Mon agenda : placement des chevauchements', () => {
  const jour = new Date(2026, 8, 24);
  it('deux rendez-vous qui se chevauchent se partagent la largeur', () => {
    const p = placer([ev('a', '2026-09-24T09:00:00', '2026-09-24T10:00:00'), ev('b', '2026-09-24T09:30:00', '2026-09-24T10:30:00')], jour);
    expect(p.map((x) => x.colonnes)).toEqual([2, 2]);
    expect(new Set(p.map((x) => x.colonne)).size).toBe(2);
  });
  it('deux rendez-vous qui se suivent gardent toute la largeur', () => {
    const p = placer([ev('a', '2026-09-24T09:00:00', '2026-09-24T10:00:00'), ev('b', '2026-09-24T10:00:00', '2026-09-24T11:00:00')], jour);
    expect(p.map((x) => x.colonnes)).toEqual([1, 1]);
  });
  it('une journée entière va dans la bande, pas dans la grille', () => {
    const e = ev('j', '2026-09-24T00:00:00', null, true);
    expect(dansLaBande(e)).toBe(true);
    expect(placer([e], jour)).toHaveLength(0);
    expect(toucheLeJour(e, jour)).toBe(true);
    expect(toucheLeJour(e, new Date(2026, 8, 25))).toBe(false);
  });
  it('sans fin, un rendez-vous dure une heure', () => {
    const e = ev('x', '2026-09-24T14:00:00', null);
    expect(e.fin.getTime() - e.debut.getTime()).toBe(3_600_000);
  });
});
