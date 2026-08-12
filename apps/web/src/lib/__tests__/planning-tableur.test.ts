import { describe, it, expect } from 'vitest';
import { indexColonne, lireClasseur } from '@/lib/planning/tableur';
import { lireMatrice, bilanParPersonne } from '@/lib/planning/lecture';

/**
 * UN VRAI CLASSEUR, LU SANS BIBLIOTHÈQUE.
 *
 * Le fichier ci-dessous est un .xlsx minimal mais authentique : archive ZIP,
 * chaînes partagées, dates en numéro de série, horaires en fraction de journée
 * — et une ligne à trou, celle du congé, qui n'écrit pas ses cellules vides.
 * C'est exactement là qu'un lecteur naïf décale les colonnes et attribue les
 * horaires de quelqu'un à son collègue.
 */
const CLASSEUR_XLSX =
  'UEsDBBQAAAAIABCrDF3muHRrXAAAAGIAAAATAAAAW0NvbnRlbnRfVHlwZXNdLnhtbBXMTQqAIBBA4auE+xxr0SJKL9EFRKYf' +
  'ylGcIer22fLxwZvcE6/mxsJHoll12ihnp+XNyE0V4lntInkE4LBj9KxTRqqyphK91CwbZB9OvyH0xgwQEgmStPI/FNgPUEsD' +
  'BBQAAAAIABCrDF1PA8920QAAAIoBAAAUAAAAeGwvc2hhcmVkU3RyaW5ncy54bWxl0MFKBDEMBuBXKb277exBZenMgoIX8aQ+' +
  'QGyz08o0rW1m0UfyOXwxK4Jg55gv+UmIOb7HRZyx1JBolMNOS4Fkkws0j/L56e7iWh4nUyuLNkh1lJ45H5Sq1mOEuksZqXVO' +
  'qUTgVpZZ1VwQXPWIHBe11/pSRQgkhU0rcVsySLFSeFvx9g/aijAZnnK7JBGhUTwZ9WO/7oC3hi8r93gK1BN/5E32MWUfUDxA' +
  'sR7IbSIFzhCWnm2i+euz13soIYobXDy41765Hw5a96iv/qFq752+AVBLAwQUAAAACAAQqwxd23rPdQMBAADbAgAAGAAAAHhs' +
  'L3dvcmtzaGVldHMvc2hlZXQxLnhtbH2S0W6DIBSG7/cUhvsKglO3oE03uyfYHoBYVs0qGCB2jz/WbvRIYr0CvnP4vxzh2+/x' +
  'lMzS2EGrGmUpQYlUnT4M6lijj/e3TYW2zQM/a/Nleyld4uuVrVHv3PSMse16OQqb6kkqTz61GYXzW3PEdjJSHC5N4wlTQgo8' +
  'ikGhhl/OWuGEv9joc2J8sD/ufhe7DCWuRtbv54ZwPDccd3/sBbJsyV4ho0vWQsaWbA9ZHhj2Xjc7GuwoqH6M7Oj1joIWReR2' +
  'JSRlZdTT/pOSVAx8kSNMLVYcWXBkdxxZcCyjDNhVrmTkISMH1VWUka/OAXY9RZOALIt+/D6/NwB8e08ch4fa/ABQSwECFAMU' +
  'AAAACAAQqwxd5rh0a1wAAABiAAAAEwAAAAAAAAAAAAAAgAEAAAAAW0NvbnRlbnRfVHlwZXNdLnhtbFBLAQIUAxQAAAAIABCr' +
  'DF1PA8920QAAAIoBAAAUAAAAAAAAAAAAAACAAY0AAAB4bC9zaGFyZWRTdHJpbmdzLnhtbFBLAQIUAxQAAAAIABCrDF3bes91' +
  'AwEAANsCAAAYAAAAAAAAAAAAAACAAZABAAB4bC93b3Jrc2hlZXRzL3NoZWV0MS54bWxQSwUGAAAAAAMAAwDJAAAAyQIAAAAA';

function enOctets(b64: string): ArrayBuffer {
  const bin = atob(b64);
  const u = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
  return u.buffer;
}

describe('Références de colonnes', () => {
  it('traduit une référence de cellule en index', () => {
    expect(indexColonne('A1')).toBe(0);
    expect(indexColonne('E12')).toBe(4);
    expect(indexColonne('AA3')).toBe(26);
  });
});

describe('Lecture d’un classeur Excel', () => {
  it('rend la matrice, cellules vides comprises', async () => {
    const m = await lireClasseur(enOctets(CLASSEUR_XLSX));
    expect(m[0]).toEqual(['personne', 'date', 'debut', 'fin', 'type']);
    // La ligne du congé n'a que trois cellules écrites : le « type » doit
    // rester en cinquième position, pas remonter en troisième.
    expect(m[2][0]).toBe('Sophie Marchand');
    expect(m[2][4]).toBe('congé');
    expect(m[2][2]).toBe('');
  });

  it('compte juste, séries de dates et fractions d’heures comprises', async () => {
    const r = lireMatrice(await lireClasseur(enOctets(CLASSEUR_XLSX)));
    expect(r.colonnesManquantes).toEqual([]);
    expect(r.refusees).toEqual([]);
    expect(r.lignes).toHaveLength(3);
    expect(r.lignes[0].date).toBe('2026-09-01');

    const b = bilanParPersonne(r.lignes);
    // Sophie : 9 h → 17 h (0,375 → 0,708333) = 8 h, plus un jour de congé.
    // Karim : 21 h → 7 h, poste de nuit = 10 h.
    expect(b).toEqual([
      { personne: 'Karim Belhadj', heuresTravaillees: 10, joursAbsence: 0, jours: 1 },
      { personne: 'Sophie Marchand', heuresTravaillees: 8, joursAbsence: 1, jours: 2 },
    ]);
  });
});
