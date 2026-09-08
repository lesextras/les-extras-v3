/**
 * LES QUIZ D'UNE LEÇON.
 *
 * Un quiz vit dans la leçon, en JSON : on ne crée pas trois tables pour trois
 * questions. Ce fichier est la seule autorité sur sa forme — l'atelier écrit,
 * le lecteur répond, et la correction se fait ici, côté serveur, jamais dans le
 * navigateur : sinon la bonne réponse voyage avec la question.
 */

export const TYPES_QUESTION = ['CHOIX_UNIQUE', 'CHOIX_MULTIPLE', 'VRAI_FAUX'] as const;
export type TypeQuestion = (typeof TYPES_QUESTION)[number];

export interface QuestionQuiz {
  id: string;
  enonce: string;
  type: TypeQuestion;
  options: string[];
  /** Les index des bonnes réponses dans `options`. */
  bonnes: number[];
  explication?: string;
  points: number;
}

export interface Quiz {
  noteMinimale: number;
  questions: QuestionQuiz[];
}

const QUIZ_VIDE: Quiz = { noteMinimale: 70, questions: [] };

function texte(v: unknown, max: number) {
  return typeof v === 'string' ? v.trim().slice(0, max) : '';
}

function entier(v: unknown, defaut: number, min: number, max: number) {
  const n = typeof v === 'number' ? v : Number.parseInt(String(v ?? ''), 10);
  if (!Number.isFinite(n)) return defaut;
  return Math.max(min, Math.min(max, Math.trunc(n)));
}

/** Remet un quiz d'aplomb : on corrige ce qui peut l'être, on jette le reste. */
export function nettoyerQuiz(brut: unknown): Quiz {
  if (!brut || typeof brut !== 'object') return { ...QUIZ_VIDE, questions: [] };
  const o = brut as { noteMinimale?: unknown; questions?: unknown };
  const questions = Array.isArray(o.questions) ? o.questions : [];

  const propres: QuestionQuiz[] = [];
  questions.forEach((q, i) => {
    if (!q || typeof q !== 'object') return;
    const c = q as Record<string, unknown>;
    const enonce = texte(c.enonce, 500);
    if (!enonce) return;

    const type: TypeQuestion = TYPES_QUESTION.includes(c.type as TypeQuestion)
      ? (c.type as TypeQuestion)
      : 'CHOIX_UNIQUE';

    let options =
      type === 'VRAI_FAUX'
        ? ['Vrai', 'Faux']
        : (Array.isArray(c.options) ? c.options : []).map((x) => texte(x, 200)).filter(Boolean).slice(0, 12);
    if (options.length < 2) options = type === 'VRAI_FAUX' ? ['Vrai', 'Faux'] : ['', ''].map((_, k) => `Réponse ${k + 1}`);

    let bonnes = (Array.isArray(c.bonnes) ? c.bonnes : [])
      .map((x) => entier(x, -1, 0, options.length - 1))
      .filter((x) => x >= 0);
    bonnes = [...new Set(bonnes)];
    if (type !== 'CHOIX_MULTIPLE') bonnes = bonnes.slice(0, 1);
    if (!bonnes.length) bonnes = [0];

    propres.push({
      id: texte(c.id, 40) || `q${i + 1}${Math.random().toString(36).slice(2, 7)}`,
      enonce,
      type,
      options,
      bonnes,
      explication: texte(c.explication, 800) || undefined,
      points: entier(c.points, 1, 1, 20),
    });
  });

  return { noteMinimale: entier(o.noteMinimale, 70, 0, 100), questions: propres.slice(0, 50) };
}

/** Ce qu'on envoie au navigateur : la question, jamais la réponse. */
export function quizSansReponses(quiz: Quiz) {
  return {
    noteMinimale: quiz.noteMinimale,
    questions: quiz.questions.map((q) => ({
      id: q.id,
      enonce: q.enonce,
      type: q.type,
      options: q.options,
      points: q.points,
    })),
  };
}

export interface ResultatQuiz {
  score: number;
  reussi: boolean;
  total: number;
  obtenus: number;
  details: { id: string; juste: boolean; bonnes: number[]; explication?: string }[];
}

/** La correction. `reponses` : par identifiant de question, les index cochés. */
export function corrigerQuiz(quiz: Quiz, reponses: Record<string, unknown>): ResultatQuiz {
  let total = 0;
  let obtenus = 0;
  const details: ResultatQuiz['details'] = [];

  for (const q of quiz.questions) {
    total += q.points;
    const brut = reponses?.[q.id];
    const cochees = [
      ...new Set(
        (Array.isArray(brut) ? brut : brut === undefined || brut === null ? [] : [brut])
          .map((x) => (typeof x === 'number' ? x : Number.parseInt(String(x), 10)))
          .filter((n) => Number.isInteger(n)),
      ),
    ].sort((a, b) => a - b);
    const attendues = [...q.bonnes].sort((a, b) => a - b);
    const juste = cochees.length === attendues.length && cochees.every((v, i) => v === attendues[i]);
    if (juste) obtenus += q.points;
    details.push({ id: q.id, juste, bonnes: attendues, explication: q.explication });
  }

  const score = total === 0 ? 100 : Math.round((obtenus / total) * 100);
  return { score, reussi: score >= quiz.noteMinimale, total, obtenus, details };
}

/** Un quiz vaut la peine d'être passé s'il a au moins une question. */
export function quizUtilisable(quiz: Quiz | null | undefined) {
  return Boolean(quiz && quiz.questions.length);
}
