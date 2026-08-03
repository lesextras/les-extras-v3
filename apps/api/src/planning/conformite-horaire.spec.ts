import { evaluerCreneau, heuresSur, lundiDe, PLAFONDS } from './conformite-horaire';

/** Un créneau de `h` heures démarrant le `jour` (AAAA-MM-JJ) à `heure` (UTC). */
const c = (jour: string, heure: number, h: number) => {
  const startAt = new Date(`${jour}T00:00:00Z`);
  startAt.setUTCHours(heure);
  return { startAt, endAt: new Date(startAt.getTime() + h * 3_600_000) };
};

/** Jour de la semaine du lundi 6 juillet 2026, en AAAA-MM-JJ. */
const jour = (i: number) =>
  new Date(Date.UTC(2026, 6, 6) + i * 86_400_000).toISOString().slice(0, 10);

const codes = (constats: { code: string }[]) => constats.map((x) => x.code).sort();

describe('conformité horaire', () => {
  // 2026-07-06 est un lundi.
  it('place le lundi de la semaine en UTC', () => {
    expect(lundiDe(new Date('2026-07-09T22:00:00Z')).toISOString()).toBe('2026-07-06T00:00:00.000Z');
    expect(lundiDe(new Date('2026-07-06T00:00:00Z')).toISOString()).toBe('2026-07-06T00:00:00.000Z');
    // Dimanche : on ne bascule pas sur la semaine suivante.
    expect(lundiDe(new Date('2026-07-12T23:00:00Z')).toISOString()).toBe('2026-07-06T00:00:00.000Z');
  });

  it('répartit au prorata un service à cheval sur deux semaines', () => {
    // Dimanche 22 h → lundi 6 h : 2 h sur la semaine qui finit, 6 h sur la suivante.
    const nuit = c('2026-07-12', 22, 8);
    const lundi = lundiDe(new Date('2026-07-06T12:00:00Z'));
    const lundiSuivant = new Date(lundi.getTime() + 7 * 86_400_000);
    expect(heuresSur([nuit], lundi, lundiSuivant)).toBeCloseTo(2, 5);
  });

  it('ne signale rien sur une semaine ordinaire', () => {
    const semaine = [0, 1, 2, 3].map((i) => c(jour(i), 9, 7));
    expect(evaluerCreneau(semaine, c(jour(4), 9, 7))).toEqual([]);
  });

  it('bloque au-delà de 48 h sur une semaine isolée', () => {
    // 5 × 9 h = 45 h déjà posées, le candidat de 6 h fait 51 h.
    const semaine = [0, 1, 2, 3, 4].map((i) => c(jour(i), 8, 9));
    const constats = evaluerCreneau(semaine, c(jour(5), 8, 6));
    const semaineMax = constats.find((x) => x.code === 'SEMAINE_MAX');
    expect(semaineMax).toBeDefined();
    expect(semaineMax!.gravite).toBe('BLOQUANT');
    expect(semaineMax!.valeur).toBeCloseTo(51, 5);
  });

  it('alerte sans bloquer entre 44 h et 48 h', () => {
    const semaine = [0, 1, 2, 3].map((i) => c(jour(i), 8, 10));
    const constats = evaluerCreneau(semaine, c(jour(4), 8, 6));
    expect(codes(constats)).toContain('SEMAINE_ALERTE');
    expect(constats.every((x) => x.gravite === 'INFO')).toBe(true);
  });

  it('bloque quand la moyenne sur 12 semaines dépasse 44 h', () => {
    // 12 semaines à 46 h : chaque semaine isolée passe (< 48 h), la moyenne non.
    const creneaux = [];
    for (let s = 0; s < 12; s++) {
      const lundi = new Date(Date.UTC(2026, 3, 6) + s * 7 * 86_400_000);
      for (let j = 0; j < 5; j++) {
        const d = new Date(lundi.getTime() + j * 86_400_000);
        creneaux.push({
          startAt: new Date(d.getTime() + 8 * 3_600_000),
          endAt: new Date(d.getTime() + (8 + 9.2) * 3_600_000),
        });
      }
    }
    const dernier = creneaux[creneaux.length - 1];
    const constats = evaluerCreneau(creneaux.slice(0, -1), dernier);
    const moyenne = constats.find((x) => x.code === 'MOYENNE_MAX');
    expect(moyenne).toBeDefined();
    expect(moyenne!.gravite).toBe('BLOQUANT');
    expect(moyenne!.valeur).toBeGreaterThan(PLAFONDS.moyenneMax);
    // Aucune semaine ne dépasse 48 h : sans la moyenne, rien n'aurait été vu.
    expect(codes(constats)).not.toContain('SEMAINE_MAX');
  });

  it('bloque un repos quotidien inférieur à 11 h', () => {
    const veille = c(jour(0), 14, 8); // finit à 22 h
    const constats = evaluerCreneau([veille], c(jour(1), 6, 7)); // 8 h de repos
    const repos = constats.find((x) => x.code === 'REPOS_QUOTIDIEN');
    expect(repos).toBeDefined();
    expect(repos!.gravite).toBe('BLOQUANT');
    expect(repos!.valeur).toBeCloseTo(8, 5);
  });

  it('bloque quand il ne reste pas 35 h de coupure dans la semaine', () => {
    // 7 jours travaillés, coupures de 16 h : aucune coupure de 35 h.
    const semaine = [];
    for (let j = 0; j < 6; j++) {
      const d = new Date(Date.UTC(2026, 6, 6) + j * 86_400_000);
      semaine.push({
        startAt: new Date(d.getTime() + 8 * 3_600_000),
        endAt: new Date(d.getTime() + 16 * 3_600_000),
      });
    }
    const candidat = c(jour(6), 8, 8);
    const constats = evaluerCreneau(semaine, candidat);
    expect(codes(constats)).toContain('REPOS_HEBDO');
  });

  it('cumule les employeurs : la liste passée ne distingue pas les comptes', () => {
    // L'établissement A a déjà posé 30 h cette semaine.
    const etabA = [0, 1, 2].map((i) => c(jour(i), 8, 10));
    // L'établissement B en ajoute 10 : 40 h au total, rien à signaler.
    expect(evaluerCreneau(etabA, c(jour(3), 8, 10))).toEqual([]);
    // B en ajoute encore 10 : 50 h cumulées, le plafond hebdomadaire saute —
    // alors qu'aucun des deux employeurs, seul, n'aurait rien vu.
    const cumul = [...etabA, c(jour(3), 8, 10)];
    const suite = evaluerCreneau(cumul, c(jour(4), 8, 10));
    expect(codes(suite)).toContain('SEMAINE_MAX');
  });

  it('ignore les plafonds quand le créneau ne dure pas assez pour les franchir', () => {
    expect(evaluerCreneau([], c(jour(0), 9, 7))).toEqual([]);
  });
});
