'use client';
/* Textes allégés le 01/10/2026 (demande : le moins de texte possible) */

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { appel, messageDe } from './api';
import { Portail } from './Portail';
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
 * La liste, et le bouton qui en crée une. Créer ouvre une fenêtre — la même
 * que Teachizy, relevée sur place le 09/09/2026 : un titre, une description
 * courte, un « Générer » par champ, « Fermer » et « Ajouter ». Puis la
 * formation s'ouvre, vide : on y pose ensuite ce qu'on veut, une leçon suffit,
 * le chapitre est facultatif.
 *
 * ⚠ CE QUI AVAIT CASSÉ, ET POURQUOI (08-09/09/2026).
 *
 * Notre fenêtre portait, en plus des deux champs, un chapeau de trois lignes,
 * un compteur de caractères et deux phrases d'aide : la carte montait à ~690 px
 * quand l'écran d'un portable en fait 640. Le bouton « Ajouter » passait sous
 * le bord, et il fallait deviner qu'on pouvait faire défiler DANS la boîte.
 * J'ai d'abord supprimé la fenêtre — c'était une erreur : Teachizy en a une, et
 * elle doit rester.
 *
 * La vraie correction tient en trois points, et ils sont à garder :
 *   1. la carte porte EXACTEMENT ce que porte celle de Teachizy, rien de plus
 *      (leur carte fait 494 px de haut : c'est ce qui la fait tenir) ;
 *   2. `max-h` + `overflow-y-auto` sur la carte : si l'écran est vraiment
 *      minuscule, c'est la carte qui défile, jamais le bouton qui disparaît ;
 *   3. le voile s'aligne en haut (`items-start`) et non au centre : centré,
 *      un contenu plus haut que la fenêtre voit son haut ET son bas coupés,
 *      et aucun défilement ne les rattrape.
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
  /** Quel champ l'IA est en train d'écrire : rien, le titre, ou la description. */
  const [ecrit, setEcrit] = useState<'titre' | 'description' | null>(null);

  const visibles = filtre === 'TOUTES' ? cours : cours.filter((c) => (c.modalite ?? 'EN_LIGNE') === filtre);

  const creer = () => {
    setTitreNeuf('');
    setSousTitreNeuf('');
    setErreur(null);
    setOuvrirCreation(true);
  };

  /**
   * « GÉNÉRER », COMME CHEZ TEACHIZY.
   *
   * Le sujet, c'est ce qui est déjà écrit : le titre s'il y en a un, sinon la
   * description. Sans rien, on ne devine pas — on le dit.
   */
  async function generer(champ: 'titre' | 'description') {
    const sujet = (titreNeuf.trim() || sousTitreNeuf.trim()).slice(0, 400);
    if (sujet.length < 3) {
      setErreur('Écris d’abord un mot sur le sujet : l’IA part de là.');
      return;
    }
    setEcrit(champ);
    setErreur(null);
    try {
      const p = await appel<{ titre: string; description: string }>('/ecole/ia/titre', {
        methode: 'POST',
        corps: { sujet },
      });
      if (champ === 'titre' && p.titre) setTitreNeuf(p.titre.slice(0, 128));
      if (champ === 'description' && p.description) setSousTitreNeuf(p.description.slice(0, 300));
    } catch (e) {
      setErreur(messageDe(e));
    } finally {
      setEcrit(null);
    }
  }

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
            ? 'Aucune formation.'
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
            Aucune formation.
          </h2>
          <ul className="mx-auto mt-4 max-w-[40ch] space-y-1.5 text-left leading-relaxed" style={{ color: VERT.texte }}>
            <li>Leçons, vidéos, quiz</li>
            <li>En ligne, en salle ou en visio</li>
            <li>Attestation automatique</li>
          </ul>
          <button
            type="button"
            onClick={creer}
            disabled={occupe}
            className="mt-6 inline-flex items-center gap-2 rounded-xl px-5 py-3 text-base font-bold text-white transition disabled:opacity-60"
            style={{ backgroundColor: VERT.fonce }}
          >
            Nouvelle formation
          </button>
        </div>
      ) : visibles.length === 0 ? (
        <p className="rounded-2xl border bg-white px-5 py-6 text-center" style={{ borderColor: VERT.bord, color: VERT.texte }}>
          Aucune formation dans cette modalité.
        </p>
      ) : (
        <ul className="grid gap-3">
          {visibles.map((c) => (
            // ⚠ TOUTE LA CARTE S'OUVRE (01/10/2026) : le titre porte un lien
            // étiré sur la carte (after:inset-0) ; les actions secondaires sont
            // rangées dans « ⋯ », posé au-dessus du lien (z-10).
            <li
              key={c.id}
              className="relative rounded-2xl border bg-white p-5 transition focus-within:z-20 hover:z-20 hover:-translate-y-0.5 hover:shadow-[0_10px_28px_rgba(15,95,62,0.10)] motion-reduce:transition-none motion-reduce:hover:translate-y-0"
              style={{ borderColor: VERT.bord }}
            >
              <div className="flex items-start justify-between gap-3">
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
                        className="text-lg font-extrabold tracking-tight no-underline after:absolute after:inset-0 after:rounded-2xl after:content-[''] hover:underline focus-visible:outline-none focus-visible:after:ring-4 focus-visible:after:ring-[#B7E4CE]"
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

                <MenuActions
                  pageHref={c.statut === 'PUBLIE' ? `/cours/${c.slug}` : null}
                  occupe={occupe}
                  onDupliquer={() => dupliquer(c.id)}
                  onSupprimer={() => setASupprimer(c.id)}
                />
              </div>

              {aSupprimer === c.id ? (
                <div className="relative z-10 mt-4 rounded-xl border border-[#F3B0C2] bg-[#FDE7EC] px-4 py-3">
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

      {/* ------------------------------------------------- créer une formation
          Le voile s'aligne EN HAUT et la carte plafonne à 90 % de la hauteur :
          sur un petit écran, c'est la carte qui défile, et « Ajouter » reste
          toujours atteignable. Voir le grand commentaire en tête de fichier. */}
      {ouvrirCreation ? (
        <Portail>
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 px-4 py-8"
          role="dialog"
          aria-modal="true"
          aria-label="Ajouter une formation"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOuvrirCreation(false);
          }}
        >
          <div className="my-auto max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6">
            <h2 className="text-xl font-extrabold tracking-tight" style={{ color: VERT.encre }}>
              Ajouter une formation
            </h2>

            <div className="mt-5 grid gap-1.5">
              <div className="flex items-center justify-between gap-3">
                <label htmlFor="titre-neuf" className="text-sm font-bold" style={{ color: VERT.texte }}>
                  Titre
                </label>
                <button
                  type="button"
                  onClick={() => void generer('titre')}
                  disabled={ecrit !== null || occupe}
                  className="rounded-lg border-2 px-2.5 py-1 text-xs font-bold disabled:opacity-60"
                  style={{ borderColor: VERT.bord, color: VERT.fonce }}
                >
                  {ecrit === 'titre' ? 'Écriture…' : 'Générer'}
                </button>
              </div>
              <input
                id="titre-neuf"
                autoFocus
                value={titreNeuf}
                onChange={(e) => setTitreNeuf(e.target.value)}
                maxLength={128}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') void creerVraiment();
                  if (e.key === 'Escape') setOuvrirCreation(false);
                }}
                className="rounded-xl border-2 px-3 py-2 text-[15px] focus:outline-none"
                style={{ borderColor: VERT.bord, color: VERT.encre }}
              />
            </div>

            <div className="mt-4 grid gap-1.5">
              <div className="flex items-center justify-between gap-3">
                <label htmlFor="sous-titre-neuf" className="text-sm font-bold" style={{ color: VERT.texte }}>
                  Description courte
                </label>
                <button
                  type="button"
                  onClick={() => void generer('description')}
                  disabled={ecrit !== null || occupe}
                  className="rounded-lg border-2 px-2.5 py-1 text-xs font-bold disabled:opacity-60"
                  style={{ borderColor: VERT.bord, color: VERT.fonce }}
                >
                  {ecrit === 'description' ? 'Écriture…' : 'Générer'}
                </button>
              </div>
              <textarea
                id="sous-titre-neuf"
                rows={2}
                value={sousTitreNeuf}
                onChange={(e) => setSousTitreNeuf(e.target.value)}
                maxLength={300}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') setOuvrirCreation(false);
                }}
                className="rounded-xl border-2 px-3 py-2 text-[15px] focus:outline-none"
                style={{ borderColor: VERT.bord, color: VERT.encre }}
              />
            </div>

            <div className="mt-6 flex flex-wrap justify-end gap-2">
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
        </Portail>
      ) : null}
    </div>
  );
}

/**
 * LE PETIT MENU « ⋯ » D'UNE CARTE : voir la page, dupliquer, supprimer.
 * Se ferme au clic dehors, à Échap, et après chaque choix.
 */
function MenuActions({
  pageHref,
  occupe,
  onDupliquer,
  onSupprimer,
}: {
  pageHref: string | null;
  occupe: boolean;
  onDupliquer: () => void;
  onSupprimer: () => void;
}) {
  const [ouvert, setOuvert] = useState(false);
  const boite = useRef<HTMLDivElement>(null);
  const bouton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!ouvert) return;
    const dehors = (e: MouseEvent | TouchEvent) => {
      if (boite.current && !boite.current.contains(e.target as Node)) setOuvert(false);
    };
    const echap = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOuvert(false);
        bouton.current?.focus();
      }
    };
    document.addEventListener('mousedown', dehors);
    document.addEventListener('touchstart', dehors);
    document.addEventListener('keydown', echap);
    return () => {
      document.removeEventListener('mousedown', dehors);
      document.removeEventListener('touchstart', dehors);
      document.removeEventListener('keydown', echap);
    };
  }, [ouvert]);

  const item = 'block w-full rounded-lg px-3 py-2 text-left text-sm font-bold no-underline transition hover:bg-[#E3F5EC] disabled:opacity-60';

  return (
    <div ref={boite} className="relative z-10 shrink-0">
      <button
        ref={bouton}
        type="button"
        aria-label="Plus d'actions"
        aria-haspopup="menu"
        aria-expanded={ouvert}
        onClick={() => setOuvert((o) => !o)}
        className="flex h-10 w-10 items-center justify-center rounded-xl border-2 bg-white transition hover:bg-[#E3F5EC]"
        style={{ borderColor: VERT.bord, color: VERT.encre }}
      >
        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
          <circle cx="5" cy="12" r="2" />
          <circle cx="12" cy="12" r="2" />
          <circle cx="19" cy="12" r="2" />
        </svg>
      </button>
      {ouvert ? (
        <div
          role="menu"
          className="absolute right-0 top-12 w-48 rounded-xl border bg-white p-1.5 shadow-[0_10px_28px_rgba(15,95,62,0.16)]"
          style={{ borderColor: VERT.bord }}
        >
          {pageHref ? (
            <a
              role="menuitem"
              href={pageHref}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOuvert(false)}
              className={item}
              style={{ color: VERT.encre }}
            >
              Voir la page
            </a>
          ) : null}
          <button
            role="menuitem"
            type="button"
            disabled={occupe}
            onClick={() => {
              setOuvert(false);
              onDupliquer();
            }}
            className={item}
            style={{ color: VERT.encre }}
          >
            Dupliquer
          </button>
          <button
            role="menuitem"
            type="button"
            disabled={occupe}
            onClick={() => {
              setOuvert(false);
              onSupprimer();
            }}
            className={`${item} text-[#8A1B3D] hover:bg-[#FDE7EC]`}
          >
            Supprimer
          </button>
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
