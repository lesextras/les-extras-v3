'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { appel, messageDe } from './api';
import {
  MODALITE_COURTE,
  NOM_MODALITE,
  NOM_STATUT_COURS,
  VERT,
  duree,
  euros,
  type CoursResume,
  type ModaliteCours,
} from './types';

/**
 * MES FORMATIONS.
 *
 * La liste, et le bouton qui en crée une. Créer demande deux choses — un titre
 * et une phrase de présentation — puis ouvre la formation, vide : on y pose
 * ensuite ce qu'on veut, une leçon suffit, le chapitre est facultatif.
 *
 * La modalité — en ligne, en présentiel, en visio, mixte — n'est pas une autre
 * liste : c'est une étiquette sur la formation, et un filtre au-dessus.
 */
export function ListeCours({
  cours: initiaux,
  origine,
  modaliteInitiale,
}: {
  cours: CoursResume[];
  origine: string;
  modaliteInitiale?: ModaliteCours | null;
}) {
  const router = useRouter();
  const [cours, setCours] = useState(initiaux);
  const [occupe, setOccupe] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [aSupprimer, setASupprimer] = useState<string | null>(null);
  const [filtre, setFiltre] = useState<ModaliteCours | 'TOUTES'>(modaliteInitiale ?? 'TOUTES');
  const [ouvrirCreation, setOuvrirCreation] = useState(false);
  const [titreNeuf, setTitreNeuf] = useState('');
  const [sousTitreNeuf, setSousTitreNeuf] = useState('');

  const visibles = filtre === 'TOUTES' ? cours : cours.filter((c) => (c.modalite ?? 'EN_LIGNE') === filtre);

  const creer = () => {
    setTitreNeuf('');
    setSousTitreNeuf('');
    setErreur(null);
    setOuvrirCreation(true);
  };

  async function creerVraiment() {
    const titre = titreNeuf.trim();
    if (titre.length < 2) {
      setErreur('Donne un titre à ta formation.');
      return;
    }
    setOccupe(true);
    setErreur(null);
    try {
      const c = await appel<{ id: string }>('/ecole/cours', {
        methode: 'POST',
        corps: { titre, ...(sousTitreNeuf.trim() ? { sousTitre: sousTitreNeuf.trim() } : {}) },
      });
      router.push(`/academie/formations/${c.id}`);
    } catch (e) {
      setErreur(messageDe(e));
      setOccupe(false);
    }
  }

  async function dupliquer(id: string) {
    setOccupe(true);
    setErreur(null);
    try {
      const c = await appel<{ id: string }>(`/ecole/cours/${id}/dupliquer`, { methode: 'POST' });
      router.push(`/academie/formations/${c.id}`);
    } catch (e) {
      setErreur(messageDe(e));
      setOccupe(false);
    }
  }

  async function supprimer(id: string) {
    setOccupe(true);
    setErreur(null);
    try {
      await appel(`/ecole/cours/${id}`, { methode: 'DELETE' });
      setCours((p) => p.filter((c) => c.id !== id));
      setASupprimer(null);
      router.refresh();
    } catch (e) {
      setErreur(messageDe(e));
    } finally {
      setOccupe(false);
    }
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-[15px]" style={{ color: VERT.sourdine }}>
          {cours.length === 0
            ? 'Aucune formation pour le moment.'
            : `${visibles.length} formation${visibles.length > 1 ? 's' : ''}${filtre === 'TOUTES' ? '' : ` sur ${cours.length}`}.`}
        </p>
        <button
          type="button"
          onClick={creer}
          disabled={occupe}
          className="inline-flex items-center gap-2 rounded-xl px-5 py-3 text-base font-bold text-white shadow-sm transition disabled:opacity-60"
          style={{ backgroundColor: VERT.fonce }}
        >
          <span aria-hidden="true">+</span> Nouvelle formation
        </button>
      </div>

      {cours.length ? (
        <div className="mb-5 flex flex-wrap gap-2">
          {(['TOUTES', 'EN_LIGNE', 'PRESENTIEL', 'VIRTUEL', 'MIXTE'] as const).map((m) => {
            const n = m === 'TOUTES' ? cours.length : cours.filter((c) => (c.modalite ?? 'EN_LIGNE') === m).length;
            const actif = filtre === m;
            return (
              <button
                key={m}
                type="button"
                onClick={() => setFiltre(m)}
                aria-pressed={actif}
                className="rounded-full border-2 px-4 py-1.5 text-sm font-bold transition"
                style={
                  actif
                    ? { borderColor: VERT.plein, backgroundColor: VERT.clair, color: VERT.fonce }
                    : { borderColor: VERT.bord, backgroundColor: '#FFFFFF', color: VERT.sourdine }
                }
              >
                {m === 'TOUTES' ? 'Toutes' : NOM_MODALITE[m]} <span className="tabular-nums">({n})</span>
              </button>
            );
          })}
        </div>
      ) : null}

      {erreur ? (
        <p className="mb-4 rounded-2xl border border-[#F3B0C2] bg-[#FDE7EC] px-5 py-4 text-[15px] font-bold text-[#8A1B3D]">{erreur}</p>
      ) : null}

      {cours.length === 0 ? (
        <div className="rounded-2xl border bg-white p-8 text-center" style={{ borderColor: VERT.bord }}>
          <h2 className="text-xl font-extrabold tracking-tight" style={{ color: VERT.encre }}>
            Une formation, c&apos;est ton savoir-faire, découpé.
          </h2>
          <p className="mx-auto mt-3 max-w-[62ch] leading-relaxed" style={{ color: VERT.texte }}>
            Des chapitres, des leçons, des vidéos, des documents, des quiz. Tu écris, tu publies, tu partages
            l&apos;adresse. Les inscrits avancent leçon par leçon, tu vois leur progression, et l&apos;attestation part
            toute seule quand tout est fait. En ligne, en salle, en visio ou les deux : c&apos;est une option de la
            formation, pas une autre liste.
          </p>
          <button
            type="button"
            onClick={creer}
            disabled={occupe}
            className="mt-6 inline-flex items-center gap-2 rounded-xl px-5 py-3 text-base font-bold text-white transition disabled:opacity-60"
            style={{ backgroundColor: VERT.fonce }}
          >
            Créer ma première formation
          </button>
        </div>
      ) : visibles.length === 0 ? (
        <p className="rounded-2xl border bg-white px-5 py-6 text-center" style={{ borderColor: VERT.bord, color: VERT.texte }}>
          Aucune formation dans cette modalité. Change de filtre, ou choisis la modalité dans l&apos;onglet
          « Paramètres » d&apos;une formation.
        </p>
      ) : (
        <ul className="grid gap-3">
          {visibles.map((c) => (
            <li key={c.id} className="rounded-2xl border bg-white p-5" style={{ borderColor: VERT.bord }}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex min-w-0 flex-1 gap-4">
                  {c.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.imageUrl} alt="" className="h-16 w-24 shrink-0 rounded-lg object-cover" />
                  ) : (
                    <span
                      className="flex h-16 w-24 shrink-0 items-center justify-center rounded-lg text-2xl font-extrabold"
                      style={{ backgroundColor: VERT.clair, color: VERT.fonce }}
                      aria-hidden="true"
                    >
                      {c.titre.trim()[0]?.toUpperCase() ?? '?'}
                    </span>
                  )}
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/academie/formations/${c.id}`}
                        className="text-lg font-extrabold tracking-tight no-underline hover:underline"
                        style={{ color: VERT.encre }}
                      >
                        {c.titre}
                      </Link>
                      <Etiquette statut={c.statut} />
                      <span
                        className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold"
                        style={{ backgroundColor: '#ECEBFC', color: '#4338CA' }}
                      >
                        {MODALITE_COURTE[c.modalite ?? 'EN_LIGNE']}
                      </span>
                    </div>
                    {c.sousTitre ? (
                      <p className="mt-0.5 text-[15px]" style={{ color: VERT.texte }}>
                        {c.sousTitre}
                      </p>
                    ) : null}
                    <p className="mt-1 text-sm" style={{ color: VERT.sourdine }}>
                      {c.nbChapitres} chapitre{c.nbChapitres > 1 ? 's' : ''} · {c.nbLecons} leçon
                      {c.nbLecons > 1 ? 's' : ''} · {duree(c.dureeMinutes)} · {c.nbApprenants} apprenant
                      {c.nbApprenants > 1 ? 's' : ''} · {c.gratuit || c.prixCents === 0 ? 'Gratuit' : euros(c.prixCents)}
                      {c.nbSessions ? ` · ${c.nbSessions} session${c.nbSessions > 1 ? 's' : ''}` : ''}
                      {c.formationId ? '' : ' · sans fiche programme'}
                    </p>
                    {c.statut === 'PUBLIE' ? (
                      <p className="mt-1 truncate text-sm" style={{ color: VERT.sourdine }}>
                        {origine.replace(/^https?:\/\//, '')}/cours/{c.slug}
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="flex shrink-0 flex-wrap gap-2">
                  <Link
                    href={`/academie/formations/${c.id}`}
                    className="rounded-lg border-2 bg-white px-3 py-2 text-sm font-bold no-underline"
                    style={{ borderColor: VERT.bord, color: VERT.encre }}
                  >
                    Ouvrir
                  </Link>
                  {c.statut === 'PUBLIE' ? (
                    <a
                      href={`/cours/${c.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-lg border-2 bg-white px-3 py-2 text-sm font-bold no-underline"
                      style={{ borderColor: VERT.bord, color: VERT.encre }}
                    >
                      Voir la page
                    </a>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => dupliquer(c.id)}
                    disabled={occupe}
                    className="rounded-lg border-2 bg-white px-3 py-2 text-sm font-bold disabled:opacity-60"
                    style={{ borderColor: VERT.bord, color: VERT.encre }}
                  >
                    Dupliquer
                  </button>
                  <button
                    type="button"
                    onClick={() => setASupprimer(c.id)}
                    disabled={occupe}
                    className="rounded-lg border-2 border-[#F3B0C2] bg-white px-3 py-2 text-sm font-bold text-[#8A1B3D] disabled:opacity-60"
                  >
                    Supprimer
                  </button>
                </div>
              </div>

              {aSupprimer === c.id ? (
                <div className="mt-4 rounded-xl border border-[#F3B0C2] bg-[#FDE7EC] px-4 py-3">
                  <p className="text-[15px] font-bold text-[#8A1B3D]">
                    Supprimer « {c.titre} », ses leçons et ses {c.nbApprenants} inscrit
                    {c.nbApprenants > 1 ? 's' : ''} ? C&apos;est définitif.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => supprimer(c.id)}
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

      {/* ------------------------------------------------- créer une formation */}
      {ouvrirCreation ? (
        <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/40 px-4 py-8">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6">
            <h2 className="text-xl font-extrabold tracking-tight" style={{ color: VERT.encre }}>
              Ajouter une formation
            </h2>
            <p className="mt-1 text-sm" style={{ color: VERT.sourdine }}>
              Deux choses suffisent pour commencer. Tout le reste — le contenu, le prix, les
              descriptions — se règle ensuite, dans la formation.
            </p>

            <label className="mt-5 grid gap-1.5 text-sm font-bold" style={{ color: VERT.texte }}>
              Titre
              <input
                autoFocus
                value={titreNeuf}
                onChange={(e) => setTitreNeuf(e.target.value)}
                maxLength={128}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') void creerVraiment();
                }}
                className="rounded-xl border-2 px-3 py-2 text-[15px] font-normal focus:outline-none"
                style={{ borderColor: VERT.bord, color: VERT.encre }}
              />
              <span className="text-right text-xs font-normal" style={{ color: VERT.sourdine }}>
                {titreNeuf.length} / 128
              </span>
            </label>

            <label className="mt-3 grid gap-1.5 text-sm font-bold" style={{ color: VERT.texte }}>
              Description courte
              <textarea
                rows={4}
                value={sousTitreNeuf}
                onChange={(e) => setSousTitreNeuf(e.target.value)}
                maxLength={300}
                className="rounded-xl border-2 px-3 py-2 text-[15px] font-normal focus:outline-none"
                style={{ borderColor: VERT.bord, color: VERT.encre }}
              />
              <span className="text-xs font-normal" style={{ color: VERT.sourdine }}>
                Cette phrase s&apos;affiche sous le titre, sur ta page et dans l&apos;espace apprenant.
                Tu peux la laisser vide.
              </span>
            </label>

            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={() => setOuvrirCreation(false)}
                className="rounded-xl border-2 bg-white px-4 py-2 text-sm font-extrabold"
                style={{ borderColor: VERT.bord, color: VERT.texte }}
              >
                Fermer
              </button>
              <button
                type="button"
                onClick={() => void creerVraiment()}
                disabled={occupe}
                className="rounded-xl px-5 py-2 text-sm font-extrabold text-white disabled:opacity-60"
                style={{ backgroundColor: VERT.fonce }}
              >
                {occupe ? 'Création…' : 'Ajouter'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Etiquette({ statut }: { statut: CoursResume['statut'] }) {
  const style =
    statut === 'PUBLIE'
      ? { backgroundColor: VERT.clair, color: VERT.fonce }
      : statut === 'ARCHIVE'
        ? { backgroundColor: '#FEF3E2', color: '#7C3E06' }
        : { backgroundColor: '#EDF3F0', color: VERT.sourdine };
  return (
    <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold" style={style}>
      {NOM_STATUT_COURS[statut]}
    </span>
  );
}
