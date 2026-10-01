'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, type DragEvent, type FormEvent } from 'react';
import type { FormulaireResume, StatutFormulaire, Teinte } from './types';

/**
 * MES FORMULAIRES : en colonnes (brouillon, publié, fermé), et le bouton qui
 * en crée un. On attrape une carte et on la pose dans une autre colonne pour
 * changer son statut ; sur téléphone, le menu « Déplacer vers » fait pareil.
 *
 * Le même écran sert les deux espaces. Un formulaire naît toujours en
 * brouillon, avec deux questions déjà posées : on part de quelque chose plutôt
 * que d'une page blanche.
 */
const COLONNES: { statut: StatutFormulaire; titre: string; aide: string }[] = [
  { statut: 'BROUILLON', titre: 'Brouillon', aide: 'En préparation, personne ne le voit' },
  { statut: 'PUBLIE', titre: 'Publié', aide: 'Ouvert aux réponses' },
  { statut: 'FERME', titre: 'Fermé', aide: 'Plus de nouvelles réponses' },
];

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
  /** La petite case qui demande le nom avant de créer. */
  const [nomOuvert, setNomOuvert] = useState(false);
  const [nom, setNom] = useState('');
  /** Le glisser-déposer : la carte tenue, la colonne survolée. */
  const [attrape, setAttrape] = useState<string | null>(null);
  const [survolee, setSurvolee] = useState<StatutFormulaire | null>(null);

  async function appeler(chemin: string, methode: 'POST' | 'PATCH' | 'DELETE', corps?: unknown) {
    const res = await fetch(`/api/proxy${chemin}`, {
      method: methode,
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      credentials: 'include',
      body: corps ? JSON.stringify(corps) : undefined,
    });
    const texte = await res.text();
    let data: { message?: string | string[] } & Record<string, unknown> = {};
    try {
      data = texte ? JSON.parse(texte) : {};
    } catch {
      data = {};
    }
    if (!res.ok) {
      const message = Array.isArray(data?.message) ? data.message.join(' ') : data?.message;
      throw new Error(message || "L'opération n'a pas abouti.");
    }
    return data;
  }

  /** Change le statut tout de suite à l'écran ; si l'API refuse, la carte revient. */
  async function deplacer(id: string, statut: StatutFormulaire) {
    const avant = formulaires.find((f) => f.id === id);
    if (!avant || avant.statut === statut) return;
    setErreur(null);
    setFormulaires((p) => p.map((f) => (f.id === id ? { ...f, statut } : f)));
    try {
      await appeler(`/formulaires/${id}`, 'PATCH', { statut });
      router.refresh();
    } catch (e) {
      setFormulaires((p) => p.map((f) => (f.id === id ? { ...f, statut: avant.statut } : f)));
      setErreur(e instanceof Error ? e.message : 'Le déplacement a échoué.');
    }
  }

  function surDepot(e: DragEvent<HTMLElement>, statut: StatutFormulaire) {
    e.preventDefault();
    setSurvolee(null);
    const id = e.dataTransfer.getData('text/plain') || attrape;
    setAttrape(null);
    if (id) void deplacer(id, statut);
  }

  async function creer(e: FormEvent) {
    e.preventDefault();
    const titre = nom.trim();
    if (!titre) return;
    setOccupe(true);
    setErreur(null);
    try {
      const cree = (await appeler('/formulaires', 'POST', { titre })) as { id: string };
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

  const ouvrirNom = () => {
    setNom('');
    setNomOuvert(true);
  };

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-[15px]" style={{ color: teinte.sourdine }}>
          {formulaires.length === 0
            ? ''
            : `${formulaires.length} formulaire${formulaires.length > 1 ? 's' : ''}`}
        </p>
        {!nomOuvert ? (
          <button
            type="button"
            onClick={ouvrirNom}
            disabled={occupe}
            className="inline-flex items-center gap-2 rounded-xl px-5 py-3 text-base font-bold text-white shadow-sm transition disabled:opacity-60"
            style={{ backgroundColor: teinte.plein }}
          >
            <span aria-hidden="true">+</span> Nouveau formulaire
          </button>
        ) : null}
      </div>

      {nomOuvert ? (
        <form
          onSubmit={creer}
          className="mb-5 flex flex-wrap items-center gap-2 rounded-2xl border bg-white p-4"
          style={{ borderColor: teinte.bord }}
        >
          <label htmlFor="nom-formulaire" className="sr-only">
            Nom du formulaire
          </label>
          <input
            id="nom-formulaire"
            autoFocus
            required
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') setNomOuvert(false);
            }}
            placeholder="Nom du formulaire (ex. Adhésion 2026)"
            maxLength={120}
            className="min-w-0 flex-1 rounded-xl border-2 px-4 py-2.5 text-base outline-none focus:border-current"
            style={{ borderColor: teinte.bord, color: teinte.encre }}
          />
          <button
            type="submit"
            disabled={occupe || !nom.trim()}
            className="rounded-xl px-5 py-2.5 text-base font-bold text-white transition disabled:opacity-50"
            style={{ backgroundColor: teinte.plein }}
          >
            Créer
          </button>
          <button
            type="button"
            onClick={() => setNomOuvert(false)}
            className="rounded-xl px-3 py-2.5 text-base font-bold"
            style={{ color: teinte.sourdine }}
          >
            Annuler
          </button>
        </form>
      ) : null}

      {erreur ? (
        <p role="alert" className="mb-4 rounded-2xl border border-[#F3B0C2] bg-[#FDE7EC] px-5 py-4 text-[15px] font-bold text-[#8A1B3D]">
          {erreur}
        </p>
      ) : null}

      {formulaires.length === 0 ? (
        nomOuvert ? null : (
          <div
            className="flex flex-col items-center rounded-2xl border bg-white px-6 py-10 text-center"
            style={{ borderColor: teinte.bord }}
          >
            <span
              className="grid size-12 place-items-center rounded-2xl"
              style={{ backgroundColor: teinte.clair, color: teinte.plein }}
              aria-hidden="true"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="5" y="3" width="14" height="18" rx="2" />
                <path d="M9 8h6M9 12h6M9 16h3" />
              </svg>
            </span>
            <p className="mt-3 text-[15px] font-bold" style={{ color: teinte.encre }}>
              Aucun formulaire pour l&apos;instant.
            </p>
            <button
              type="button"
              onClick={ouvrirNom}
              disabled={occupe}
              className="mt-4 inline-flex items-center gap-2 rounded-xl px-5 py-3 text-base font-bold text-white transition disabled:opacity-60"
              style={{ backgroundColor: teinte.plein }}
            >
              Créer mon premier formulaire
            </button>
          </div>
        )
      ) : (
        <section className="grid gap-4 md:grid-cols-3" aria-label="Mes formulaires en colonnes">
          {COLONNES.map((col) => {
            const siens = formulaires.filter((f) => f.statut === col.statut);
            const cible = survolee === col.statut;
            return (
              <div
                key={col.statut}
                onDragOver={(e) => {
                  e.preventDefault();
                  setSurvolee(col.statut);
                }}
                onDragLeave={() => setSurvolee((s) => (s === col.statut ? null : s))}
                onDrop={(e) => surDepot(e, col.statut)}
                className="rounded-2xl p-3 transition motion-reduce:transition-none"
                style={{
                  backgroundColor: teinte.fond,
                  boxShadow: cible ? `inset 0 0 0 2px ${teinte.plein}` : `inset 0 0 0 1px ${teinte.bord}`,
                }}
              >
                <h2 className="flex items-center gap-2 px-2 font-extrabold" style={{ color: teinte.encre }}>
                  <Etiquette statut={col.statut} teinte={teinte} />
                  <span style={{ color: teinte.sourdine }}>{siens.length}</span>
                </h2>
                <p className="mt-1 px-2 text-xs" style={{ color: teinte.sourdine }}>
                  {col.aide}
                </p>

                <ul className="mt-3 space-y-2">
                  {siens.map((f) => (
                    <li
                      key={f.id}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('text/plain', f.id);
                        e.dataTransfer.effectAllowed = 'move';
                        setAttrape(f.id);
                      }}
                      onDragEnd={() => setAttrape(null)}
                      className={`relative cursor-grab rounded-2xl border bg-white p-4 transition hover:shadow-md active:cursor-grabbing has-[[aria-expanded=true]]:z-30 motion-reduce:transition-none ${
                        attrape === f.id ? 'opacity-50' : ''
                      }`}
                      style={{ borderColor: teinte.bord }}
                    >
                      {/* Toute la carte ouvre le formulaire. */}
                      <Link
                        href={`${base}/${f.id}`}
                        draggable={false}
                        aria-label={`Ouvrir « ${f.titre} »`}
                        className="absolute inset-0 rounded-2xl focus:outline-none focus-visible:ring-2"
                        style={{ ['--tw-ring-color' as string]: teinte.plein }}
                      />
                      <div className="pointer-events-none flex items-start justify-between gap-2">
                        <span className="min-w-0 flex-1 break-words font-extrabold leading-snug tracking-tight" style={{ color: teinte.encre }}>
                          {f.titre}
                        </span>
                        <div className="pointer-events-auto relative z-10 shrink-0">
                          <MenuActions
                            teinte={teinte}
                            occupe={occupe}
                            onDupliquer={() => dupliquer(f.id)}
                            onSupprimer={() => setASupprimer(f.id)}
                          />
                        </div>
                      </div>
                      <p className="pointer-events-none mt-1 text-sm" style={{ color: teinte.sourdine }}>
                        {dateCourte(f.creeLe, f.modifieLe)} · {f.nbChamps} question{f.nbChamps > 1 ? 's' : ''} · {f.nbReponses} réponse
                        {f.nbReponses > 1 ? 's' : ''}
                      </p>
                      {f.statut === 'PUBLIE' ? (
                        <p className="pointer-events-none mt-1 break-all text-xs" style={{ color: teinte.sourdine }}>
                          {origine.replace(/^https?:\/\//, '')}/f/{f.slug}
                        </p>
                      ) : null}

                      <div className="relative z-10 mt-3 flex flex-wrap items-center gap-2">
                        <label className="flex min-w-0 flex-1 items-center gap-2 text-[11px] font-bold" style={{ color: teinte.sourdine }}>
                          Déplacer vers
                          <select
                            value={f.statut}
                            onChange={(e) => void deplacer(f.id, e.target.value as StatutFormulaire)}
                            aria-label={`Déplacer « ${f.titre} » vers`}
                            className="min-w-0 flex-1 rounded-lg border bg-white px-2 py-1 text-xs font-bold focus:outline-none"
                            style={{ borderColor: teinte.bord, color: teinte.encre }}
                          >
                            {COLONNES.map((c) => (
                              <option key={c.statut} value={c.statut}>
                                {c.titre}
                              </option>
                            ))}
                          </select>
                        </label>
                        {f.statut === 'PUBLIE' ? (
                          <a
                            href={`/f/${f.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            draggable={false}
                            className="rounded-lg border-2 bg-white px-2.5 py-1 text-xs font-bold no-underline transition motion-reduce:transition-none"
                            style={{ borderColor: teinte.bord, color: teinte.encre }}
                          >
                            Voir la page
                          </a>
                        ) : null}
                      </div>

                      {aSupprimer === f.id ? (
                        <div className="relative z-10 mt-3 rounded-xl border border-[#F3B0C2] bg-[#FDE7EC] px-3 py-3">
                          <p className="text-sm font-bold text-[#8A1B3D]">
                            Supprimer « {f.titre} » et ses {f.nbReponses} réponse{f.nbReponses > 1 ? 's' : ''} ? C&apos;est définitif.
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
                  {siens.length === 0 ? (
                    <li className="px-2 py-6 text-center text-sm" style={{ color: teinte.sourdine }}>
                      {cible ? 'Pose la carte ici' : 'Rien ici'}
                    </li>
                  ) : null}
                </ul>
              </div>
            );
          })}
        </section>
      )}
    </div>
  );
}

/** « créé le 1 oct. » — ou, faute de date de création, la dernière modification. */
function dateCourte(creeLe: string | undefined, modifieLe: string) {
  const d = new Date(creeLe ?? modifieLe);
  if (Number.isNaN(d.getTime())) return creeLe ? 'créé' : 'modifié';
  const jour = d.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    ...(d.getFullYear() !== new Date().getFullYear() ? { year: 'numeric' } : {}),
  });
  return `${creeLe ? 'créé' : 'modifié'} le ${jour}`;
}

/** Le petit menu « ⋯ » : Dupliquer, Supprimer. Se ferme au clic dehors ou sur Échap. */
function MenuActions({
  teinte,
  occupe,
  onDupliquer,
  onSupprimer,
}: {
  teinte: Teinte;
  occupe: boolean;
  onDupliquer: () => void;
  onSupprimer: () => void;
}) {
  const [ouvert, setOuvert] = useState(false);
  const boite = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ouvert) return;
    const dehors = (e: MouseEvent) => {
      if (boite.current && !boite.current.contains(e.target as Node)) setOuvert(false);
    };
    const echap = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOuvert(false);
    };
    document.addEventListener('mousedown', dehors);
    document.addEventListener('keydown', echap);
    return () => {
      document.removeEventListener('mousedown', dehors);
      document.removeEventListener('keydown', echap);
    };
  }, [ouvert]);

  const item = 'block w-full rounded-lg px-3 py-2 text-left text-sm font-bold transition hover:bg-[#F5F4FC] disabled:opacity-60';

  return (
    <div ref={boite} className="relative">
      <button
        type="button"
        aria-label="Plus d'actions"
        aria-haspopup="menu"
        aria-expanded={ouvert}
        onClick={() => setOuvert((o) => !o)}
        className="grid size-10 place-items-center rounded-lg border-2 bg-white text-lg font-bold leading-none transition"
        style={{ borderColor: teinte.bord, color: teinte.encre }}
      >
        <span aria-hidden="true">⋯</span>
      </button>
      {ouvert ? (
        <div
          role="menu"
          className="absolute right-0 top-full z-20 mt-1 w-44 rounded-xl border bg-white p-1 shadow-lg"
          style={{ borderColor: teinte.bord }}
        >
          <button
            type="button"
            role="menuitem"
            disabled={occupe}
            onClick={() => {
              setOuvert(false);
              onDupliquer();
            }}
            className={item}
            style={{ color: teinte.encre }}
          >
            Dupliquer
          </button>
          <button
            type="button"
            role="menuitem"
            disabled={occupe}
            onClick={() => {
              setOuvert(false);
              onSupprimer();
            }}
            className={`${item} text-[#8A1B3D]`}
          >
            Supprimer
          </button>
        </div>
      ) : null}
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
