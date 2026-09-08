'use client';

import { useMemo, useState } from 'react';
import { BlocsLecon } from '../../_shared/blocs-lecon';
import type { Bloc } from '../../_shared/blocs';

/* ------------------------------------------------------------------ types */

export interface QuestionPublique {
  id: string;
  enonce: string;
  type: 'CHOIX_UNIQUE' | 'CHOIX_MULTIPLE' | 'VRAI_FAUX';
  options: string[];
  points: number;
}

export interface LeconSuivie {
  id: string;
  titre: string;
  type: string;
  contenu: string | null;
  videoUrl: string | null;
  fichierUrl: string | null;
  /** La leçon telle qu'elle a été composée, bloc par bloc. */
  blocs: Bloc[] | null;
  dureeMinutes: number;
  quiz: { noteMinimale: number; questions: QuestionPublique[] } | null;
  faite: boolean;
  score: number | null;
}

export interface CoursSuivi {
  apprenant: { prenom: string | null; nom: string | null; email: string };
  progression: number;
  termineLe: string | null;
  certificat: boolean;
  cours: { titre: string; sousTitre: string | null; imageUrl: string | null; certificat: boolean };
  ecole: { nom: string; couleur: string; logoUrl: string | null };
  chapitres: { id: string; titre: string | null; resume: string | null; lecons: LeconSuivie[] }[];
}

interface Correction {
  score: number;
  reussi: boolean;
  noteMinimale: number;
  details: { id: string; juste: boolean; bonnes: number[]; explication?: string }[];
}

/**
 * LE LECTEUR.
 *
 * À gauche le sommaire, à droite la leçon. On coche, on avance, on passe le
 * quiz — et la correction vient du serveur : les bonnes réponses ne sont
 * jamais dans la page avant d'avoir répondu.
 */
export function Lecteur({ jeton, suivi: initial }: { jeton: string; suivi: CoursSuivi }) {
  const [suivi, setSuivi] = useState(initial);
  const [ouverte, setOuverte] = useState<string | null>(initial.chapitres[0]?.lecons[0]?.id ?? null);
  const [occupe, setOccupe] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [reponses, setReponses] = useState<Record<string, number[]>>({});
  const [correction, setCorrection] = useState<Correction | null>(null);

  const couleur = suivi.ecole.couleur || '#0F5F3E';

  const toutes = useMemo(() => suivi.chapitres.flatMap((c) => c.lecons), [suivi]);
  const lecon = toutes.find((l) => l.id === ouverte) ?? toutes[0] ?? null;
  const index = lecon ? toutes.findIndex((l) => l.id === lecon.id) : -1;
  const suivante = index >= 0 && index < toutes.length - 1 ? toutes[index + 1] : null;

  function ouvrir(id: string) {
    setOuverte(id);
    setCorrection(null);
    setReponses({});
    setErreur(null);
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function envoyer(faite: boolean) {
    if (!lecon) return;
    setOccupe(true);
    setErreur(null);
    try {
      const res = await fetch(`/api/proxy/public/ecole/apprendre/${encodeURIComponent(jeton)}/lecons/${lecon.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(lecon.quiz ? { reponses } : { faite }),
      });
      const texte = await res.text();
      const data = texte ? JSON.parse(texte) : {};
      if (!res.ok) throw new Error(data?.message ?? "L'enregistrement n'a pas abouti.");

      const cochee = Boolean(data?.faite);
      setSuivi((p) => ({
        ...p,
        progression: typeof data?.progression === 'number' ? data.progression : p.progression,
        chapitres: p.chapitres.map((ch) => ({
          ...ch,
          lecons: ch.lecons.map((l) =>
            l.id === lecon.id ? { ...l, faite: cochee, score: data?.quiz?.score ?? l.score } : l,
          ),
        })),
      }));
      if (data?.quiz) setCorrection(data.quiz as Correction);
      else if (cochee && suivante) ouvrir(suivante.id);
    } catch (e) {
      setErreur(e instanceof Error ? e.message : 'Erreur inconnue');
    } finally {
      setOccupe(false);
    }
  }

  function cocher(q: QuestionPublique, i: number) {
    setReponses((p) => {
      const actuelles = p[q.id] ?? [];
      if (q.type === 'CHOIX_MULTIPLE') {
        return { ...p, [q.id]: actuelles.includes(i) ? actuelles.filter((x) => x !== i) : [...actuelles, i] };
      }
      return { ...p, [q.id]: [i] };
    });
  }

  return (
    <div className="min-h-screen bg-[#F7F8F7] text-[#334A42]" style={{ fontFamily: 'var(--font-pilote), system-ui, sans-serif' }}>
      <header className="px-4 py-5 text-white" style={{ backgroundColor: couleur }}>
        <div className="mx-auto flex w-full max-w-[1160px] flex-wrap items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm font-bold text-white/80">{suivi.ecole.nom}</p>
            <h1 className="truncate text-xl font-extrabold tracking-tight sm:text-2xl">{suivi.cours.titre}</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-2.5 w-40 overflow-hidden rounded-full bg-white/25">
              <div className="h-full rounded-full bg-white" style={{ width: `${suivi.progression}%` }} />
            </div>
            <span className="tabular-nums text-sm font-bold">{suivi.progression} %</span>
          </div>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-[1160px] gap-6 px-4 py-6 lg:grid-cols-[320px_minmax(0,1fr)] lg:py-10">
        <nav className="rounded-2xl border border-[#DDEBE4] bg-white p-4 lg:sticky lg:top-6 lg:max-h-[80vh] lg:self-start lg:overflow-y-auto">
          <p className="px-2 pb-2 text-sm font-extrabold uppercase tracking-[0.1em] text-[#5E7A6E]">Le sommaire</p>
          {suivi.chapitres.map((ch) => (
            <div key={ch.id} className="mb-3">
              {ch.titre ? (
                <p className="px-2 py-1.5 text-[15px] font-extrabold text-[#12312A]">{ch.titre}</p>
              ) : null}
              <ul className="grid gap-0.5">
                {ch.lecons.map((l) => (
                  <li key={l.id}>
                    <button
                      type="button"
                      onClick={() => ouvrir(l.id)}
                      className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-[15px]"
                      style={
                        l.id === lecon?.id
                          ? { backgroundColor: `${couleur}14`, color: couleur, fontWeight: 700 }
                          : { color: '#334A42' }
                      }
                    >
                      <span
                        className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[11px] font-bold"
                        style={
                          l.faite
                            ? { backgroundColor: couleur, borderColor: couleur, color: '#FFFFFF' }
                            : { borderColor: '#CFE4D9', color: '#8FA79B' }
                        }
                        aria-hidden="true"
                      >
                        {l.faite ? '✓' : ''}
                      </span>
                      <span className="min-w-0 flex-1 truncate">{l.titre}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <main className="min-w-0">
          {!lecon ? (
            <p className="rounded-2xl border border-[#DDEBE4] bg-white px-5 py-6">Ce cours n&apos;a pas encore de leçon.</p>
          ) : (
            <article className="rounded-2xl border border-[#DDEBE4] bg-white p-6 sm:p-8">
              <h2 className="text-2xl font-extrabold leading-tight tracking-tight text-[#12312A] sm:text-3xl">{lecon.titre}</h2>

              {lecon.videoUrl ? (
                <div className="mt-5 overflow-hidden rounded-xl border border-[#DDEBE4]">
                  <iframe
                    src={enIntegration(lecon.videoUrl)}
                    title={lecon.titre}
                    className="aspect-video w-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              ) : null}

              {lecon.fichierUrl ? (
                <p className="mt-5">
                  <a
                    href={lecon.fichierUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl border-2 border-[#CFE4D9] bg-white px-4 py-2.5 font-bold text-[#12312A] no-underline"
                  >
                    Ouvrir le document
                  </a>
                </p>
              ) : null}

              {/* Une leçon composée de blocs s'affiche exactement comme dans
                  l'éditeur. Les leçons écrites avant les blocs gardent leur
                  texte : rien de ce qui existait ne disparaît. */}
              {lecon.blocs?.length ? (
                <div className="mt-5 max-w-[68ch]">
                  <BlocsLecon
                    blocs={lecon.blocs}
                    couleur={couleur}
                    lecons={toutes}
                    ouvrirLecon={(id) => {
                      if (toutes.some((l) => l.id === id)) setOuverte(id);
                    }}
                  />
                </div>
              ) : lecon.contenu ? (
                <div className="mt-5 max-w-[68ch] whitespace-pre-line text-lg leading-relaxed">{lecon.contenu}</div>
              ) : null}

              {lecon.quiz ? (
                <section className="mt-7">
                  <h3 className="text-xl font-extrabold tracking-tight text-[#12312A]">
                    Le quiz — {lecon.quiz.noteMinimale} % pour valider
                  </h3>
                  <ol className="mt-4 grid gap-4">
                    {lecon.quiz.questions.map((q, n) => {
                      const detail = correction?.details.find((d) => d.id === q.id);
                      return (
                        <li key={q.id} className="rounded-xl border border-[#DDEBE4] p-5">
                          <p className="font-bold text-[#12312A]">
                            {n + 1}. {q.enonce}
                          </p>
                          <ul className="mt-3 grid gap-2">
                            {q.options.map((o, i) => {
                              const choisie = (reponses[q.id] ?? []).includes(i);
                              const bonne = detail?.bonnes.includes(i);
                              return (
                                <li key={i}>
                                  <label
                                    className="flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-2.5 text-[15px]"
                                    style={
                                      correction
                                        ? bonne
                                          ? { borderColor: '#B7E4CE', backgroundColor: '#E3F5EC' }
                                          : choisie
                                            ? { borderColor: '#F3B0C2', backgroundColor: '#FDE7EC' }
                                            : { borderColor: '#DDEBE4' }
                                        : { borderColor: choisie ? couleur : '#DDEBE4' }
                                    }
                                  >
                                    <input
                                      type={q.type === 'CHOIX_MULTIPLE' ? 'checkbox' : 'radio'}
                                      name={q.id}
                                      checked={choisie}
                                      onChange={() => cocher(q, i)}
                                      disabled={Boolean(correction)}
                                      className="h-4 w-4"
                                      style={{ accentColor: couleur }}
                                    />
                                    <span>{o}</span>
                                  </label>
                                </li>
                              );
                            })}
                          </ul>
                          {detail?.explication ? (
                            <p className="mt-2 text-[15px] leading-relaxed text-[#5E7A6E]">{detail.explication}</p>
                          ) : null}
                        </li>
                      );
                    })}
                  </ol>

                  {correction ? (
                    <div
                      className="mt-5 rounded-xl border px-5 py-4"
                      style={
                        correction.reussi
                          ? { borderColor: '#B7E4CE', backgroundColor: '#E3F5EC', color: '#0F5F3E' }
                          : { borderColor: '#F5D6A8', backgroundColor: '#FEF3E2', color: '#7C3E06' }
                      }
                    >
                      <p className="text-lg font-extrabold">
                        {correction.score} % — {correction.reussi ? 'c’est validé.' : 'pas encore.'}
                      </p>
                      {!correction.reussi ? (
                        <button
                          type="button"
                          onClick={() => {
                            setCorrection(null);
                            setReponses({});
                          }}
                          className="mt-3 rounded-lg border-2 border-current bg-white px-4 py-2 text-sm font-bold"
                        >
                          Recommencer le quiz
                        </button>
                      ) : null}
                    </div>
                  ) : null}
                </section>
              ) : null}

              {erreur ? <p className="mt-5 text-[15px] font-bold text-[#8A1B3D]">{erreur}</p> : null}

              <div className="mt-7 flex flex-wrap items-center gap-3">
                {lecon.quiz && !correction ? (
                  <button
                    type="button"
                    onClick={() => envoyer(true)}
                    disabled={occupe}
                    className="rounded-xl px-6 py-3 text-base font-extrabold text-white disabled:opacity-60"
                    style={{ backgroundColor: couleur }}
                  >
                    {occupe ? 'Correction…' : 'Valider mes réponses'}
                  </button>
                ) : null}

                {!lecon.quiz ? (
                  <button
                    type="button"
                    onClick={() => envoyer(!lecon.faite)}
                    disabled={occupe}
                    className="rounded-xl px-6 py-3 text-base font-extrabold text-white disabled:opacity-60"
                    style={{ backgroundColor: lecon.faite ? '#5E7A6E' : couleur }}
                  >
                    {lecon.faite ? 'Décocher cette leçon' : 'J’ai terminé cette leçon'}
                  </button>
                ) : null}

                {suivante ? (
                  <button
                    type="button"
                    onClick={() => ouvrir(suivante.id)}
                    className="rounded-xl border-2 border-[#CFE4D9] bg-white px-5 py-2.5 text-base font-bold text-[#12312A]"
                  >
                    Leçon suivante →
                  </button>
                ) : null}
              </div>
            </article>
          )}

          {suivi.progression >= 100 ? (
            <div className="mt-5 rounded-2xl border border-[#B7E4CE] bg-[#E3F5EC] p-6 text-center">
              <h2 className="text-2xl font-extrabold tracking-tight text-[#0F5F3E]">Le cours est terminé.</h2>
              <p className="mt-2 leading-relaxed text-[#0F5F3E]/85">
                {suivi.cours.certificat
                  ? `${suivi.ecole.nom} peut maintenant t'envoyer ton attestation de fin.`
                  : 'Toutes les leçons sont faites. Tu peux revenir les relire quand tu veux.'}
              </p>
            </div>
          ) : null}
        </main>
      </div>
    </div>
  );
}

/**
 * L'adresse d'intégration d'une vidéo.
 *
 * On accepte le lien qu'on a sous la main — celui de la barre d'adresse — et on
 * le transforme ici. Personne ne devrait avoir à connaître la forme « embed ».
 */
function enIntegration(url: string) {
  try {
    const u = new URL(url);
    if (u.hostname.includes('youtu.be')) return `https://www.youtube.com/embed/${u.pathname.slice(1)}`;
    if (u.hostname.includes('youtube.com')) {
      const v = u.searchParams.get('v');
      if (v) return `https://www.youtube.com/embed/${v}`;
      if (u.pathname.startsWith('/embed/')) return url;
    }
    if (u.hostname.includes('vimeo.com') && /^\/\d+/.test(u.pathname)) {
      return `https://player.vimeo.com/video/${u.pathname.slice(1).split('/')[0]}`;
    }
    return url;
  } catch {
    return url;
  }
}
