'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { FormulaireResume, StatutFormulaire, Teinte } from './types';

/**
 * MES FORMULAIRES : la liste, et le bouton qui en crée un.
 *
 * Le même écran sert les deux espaces. Un formulaire naît toujours en
 * brouillon, avec deux questions déjà posées : on part de quelque chose plutôt
 * que d'une page blanche.
 */
export function Liste({
  formulaires: initiaux,
  teinte,
  base,
  origine,
}: {
  formulaires: FormulaireResume[];
  teinte: Teinte;
  /** L'adresse de la liste dans cet espace, par exemple `/espace/formulaires`. */
  base: string;
  origine: string;
}) {
  const router = useRouter();
  const [formulaires, setFormulaires] = useState(initiaux);
  const [occupe, setOccupe] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [aSupprimer, setASupprimer] = useState<string | null>(null);

  async function appeler(chemin: string, methode: 'POST' | 'DELETE', corps?: unknown) {
    const res = await fetch(`/api/proxy${chemin}`, {
      method: methode,
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      credentials: 'include',
      body: corps ? JSON.stringify(corps) : undefined,
    });
    const texte = await res.text();
    const data = texte ? JSON.parse(texte) : {};
    if (!res.ok) throw new Error(data?.message ?? "L'opération n'a pas abouti.");
    return data;
  }

  async function creer() {
    setOccupe(true);
    setErreur(null);
    try {
      const cree = (await appeler('/formulaires', 'POST', { titre: 'Mon formulaire' })) as { id: string };
      router.push(`${base}/${cree.id}`);
    } catch (e) {
      setErreur(e instanceof Error ? e.message : 'Erreur inconnue');
      setOccupe(false);
    }
  }

  async function dupliquer(id: string) {
    setOccupe(true);
    setErreur(null);
    try {
      const copie = (await appeler(`/formulaires/${id}/dupliquer`, 'POST')) as { id: string };
      router.push(`${base}/${copie.id}`);
    } catch (e) {
      setErreur(e instanceof Error ? e.message : 'Erreur inconnue');
      setOccupe(false);
    }
  }

  async function supprimer(id: string) {
    setOccupe(true);
    setErreur(null);
    try {
      await appeler(`/formulaires/${id}`, 'DELETE');
      setFormulaires((p) => p.filter((f) => f.id !== id));
      setASupprimer(null);
      router.refresh();
    } catch (e) {
      setErreur(e instanceof Error ? e.message : 'Erreur inconnue');
    } finally {
      setOccupe(false);
    }
  }

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-[15px]" style={{ color: teinte.sourdine }}>
          {formulaires.length === 0
            ? 'Aucun formulaire pour le moment.'
            : `${formulaires.length} formulaire${formulaires.length > 1 ? 's' : ''}.`}
        </p>
        <button
          type="button"
          onClick={creer}
          disabled={occupe}
          className="inline-flex items-center gap-2 rounded-xl px-5 py-3 text-base font-bold text-white shadow-sm transition disabled:opacity-60"
          style={{ backgroundColor: teinte.plein }}
        >
          <span aria-hidden="true">+</span> Nouveau formulaire
        </button>
      </div>

      {erreur ? (
        <p className="mb-4 rounded-2xl border border-[#F3B0C2] bg-[#FDE7EC] px-5 py-4 text-[15px] font-bold text-[#8A1B3D]">{erreur}</p>
      ) : null}

      {formulaires.length === 0 ? (
        <div
          className="rounded-2xl border p-8 text-center"
          style={{ borderColor: teinte.bord, backgroundColor: '#FFFFFF' }}
        >
          <h2 className="text-xl font-extrabold tracking-tight" style={{ color: teinte.encre }}>
            Un formulaire, c&apos;est une question posée à plusieurs personnes.
          </h2>
          <p className="mx-auto mt-3 max-w-[58ch] leading-relaxed" style={{ color: teinte.texte }}>
            Une inscription, un sondage, une demande d&apos;adhésion, un retour après une séance. Tu écris les questions,
            tu publies, tu partages le lien. Les réponses arrivent ici, et tu les récupères en tableur quand tu veux.
          </p>
          <button
            type="button"
            onClick={creer}
            disabled={occupe}
            className="mt-6 inline-flex items-center gap-2 rounded-xl px-5 py-3 text-base font-bold text-white transition disabled:opacity-60"
            style={{ backgroundColor: teinte.plein }}
          >
            Créer mon premier formulaire
          </button>
        </div>
      ) : (
        <ul className="grid gap-3">
          {formulaires.map((f) => (
            <li
              key={f.id}
              className="rounded-2xl border bg-white p-5"
              style={{ borderColor: teinte.bord }}
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`${base}/${f.id}`}
                      className="text-lg font-extrabold tracking-tight no-underline hover:underline"
                      style={{ color: teinte.encre }}
                    >
                      {f.titre}
                    </Link>
                    <Etiquette statut={f.statut} teinte={teinte} />
                  </div>
                  <p className="mt-1 text-sm" style={{ color: teinte.sourdine }}>
                    {f.nbChamps} question{f.nbChamps > 1 ? 's' : ''} · {f.nbReponses} réponse
                    {f.nbReponses > 1 ? 's' : ''}
                    {f.statut === 'PUBLIE' ? ` · ${origine.replace(/^https?:\/\//, '')}/f/${f.slug}` : ''}
                  </p>
                </div>

                <div className="flex shrink-0 flex-wrap gap-2">
                  <Link
                    href={`${base}/${f.id}`}
                    className="rounded-lg border-2 bg-white px-3 py-2 text-sm font-bold no-underline transition"
                    style={{ borderColor: teinte.bord, color: teinte.encre }}
                  >
                    Ouvrir
                  </Link>
                  {f.statut === 'PUBLIE' ? (
                    <a
                      href={`/f/${f.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-lg border-2 bg-white px-3 py-2 text-sm font-bold no-underline transition"
                      style={{ borderColor: teinte.bord, color: teinte.encre }}
                    >
                      Voir la page
                    </a>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => dupliquer(f.id)}
                    disabled={occupe}
                    className="rounded-lg border-2 bg-white px-3 py-2 text-sm font-bold transition disabled:opacity-60"
                    style={{ borderColor: teinte.bord, color: teinte.encre }}
                  >
                    Dupliquer
                  </button>
                  <button
                    type="button"
                    onClick={() => setASupprimer(f.id)}
                    disabled={occupe}
                    className="rounded-lg border-2 border-[#F3B0C2] bg-white px-3 py-2 text-sm font-bold text-[#8A1B3D] transition disabled:opacity-60"
                  >
                    Supprimer
                  </button>
                </div>
              </div>

              {aSupprimer === f.id ? (
                <div className="mt-4 rounded-xl border border-[#F3B0C2] bg-[#FDE7EC] px-4 py-3">
                  <p className="text-[15px] font-bold text-[#8A1B3D]">
                    Supprimer « {f.titre} » et ses {f.nbReponses} réponse{f.nbReponses > 1 ? 's' : ''} ? C&apos;est
                    définitif.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => supprimer(f.id)}
                      disabled={occupe}
                      className="rounded-lg bg-[#C42B57] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#8A1B3D] disabled:opacity-60"
                    >
                      Oui, supprimer
                    </button>
                    <button
                      type="button"
                      onClick={() => setASupprimer(null)}
                      className="rounded-lg border-2 border-[#F3B0C2] bg-white px-4 py-2 text-sm font-bold text-[#8A1B3D]"
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Etiquette({ statut, teinte }: { statut: StatutFormulaire; teinte: Teinte }) {
  const style =
    statut === 'PUBLIE'
      ? { backgroundColor: teinte.clair, color: teinte.plein }
      : statut === 'FERME'
        ? { backgroundColor: '#FEF3E2', color: '#7C3E06' }
        : { backgroundColor: '#EFEFF4', color: teinte.sourdine };
  const mot = statut === 'PUBLIE' ? 'Publié' : statut === 'FERME' ? 'Fermé' : 'Brouillon';
  return (
    <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold" style={style}>
      {mot}
    </span>
  );
}
