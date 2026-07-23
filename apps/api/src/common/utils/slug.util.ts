/** Génère un slug URL-safe à partir d'un libellé. */
export function slugify(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
}

/** Suffixe court aléatoire pour garantir l'unicité d'un slug. */
export function randomSuffix(length = 6): string {
  return Math.random().toString(36).slice(2, 2 + length);
}
