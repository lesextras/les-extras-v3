'use client';

import { useEffect, useState, type DragEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useProjets } from './contexte';
import { LIBELLES_ETAT_ACTION, dateCourte, formaterEuros, type ActionAssociation, type EtatAction, type MembreEquipe, type TacheProjet } from '../../association/espace/_types';
import { FicheProjet } from './FicheProjet';
import { CARTE, Icone } from './_taches';

/**
 * MES PROJETS EN COLONNES.
 *
 * Prévu, en cours, terminé : on attrape une carte et on la pose dans la
 * colonne suivante. Sur téléphone, le menu « Déplacer vers » fait pareil.
 */
const COLONNES: { etat: EtatAction; titre: string; aide: string }[] = [
  { etat: 'PREVUE', titre: 'Prévus', aide: 'Ce qu’on veut faire' },
  { etat: 'EN_COURS', titre: 'En cours', aide: 'Ce qui tourne en ce moment' },
  { etat: 'TERMINEE', titre: 'Terminés', aide: 'À raconter dans le rapport' },
];

export function Kanban({
  projets,
  taches = [],
  equipe = [],
}: {
  projets: ActionAssociation[];
  taches?: TacheProjet[];
  equipe?: MembreEquipe[];
}) {
  const router = useRouter();
  const { appel, chemins, financeurs } = useProjets();
  const [ouvert, setOuvert] = useState<ActionAssociation | null | 'nouveau'>(null);
  const [attrape, setAttrape] = useState<string | null>(null);
  const [survolee, setSurvolee] = useState<EtatAction | null>(null);
  const [deplaces, setDeplaces] = useState<Record<string, EtatAction>>({});
  const [erreur, setErreur] = useState<string | null>(null);

  /* Les liens « Trouver des financeurs » (…/projets#financeurs) ouvrent la fiche. */
  useEffect(() => {
    if (window.location.hash === '#financeurs') setOuvert('nouveau');
  }, []);

  const etatDe = (p: ActionAssociation) => deplaces[p.id] ?? p.etat;

  async function deplacer(id: string, etat: EtatAction) {
    const projet = projets.find((p) => p.id === id);
    if (!projet || etatDe(projet) === etat) return;
    setErreur(null);
    setDeplaces((x) => ({ ...x, [id]: etat }));
    try {
      await appel(`${chemins.projets}/${id}`, { method: 'PATCH', body: { etat } });
      router.refresh();
    } catch (err) {
      setDeplaces((x) => {
        const suite = { ...x };
        delete suite[id];
        return suite;
      });
      setErreur(err instanceof Error ? err.message : 'Le déplacement a échoué.');
    }
  }

  function surDepot(e: DragEvent<HTMLDivElement>, etat: EtatAction) {
    e.preventDefault();
    setSurvolee(null);
    const id = e.dataTransfer.getData('text/plain') || attrape;
    setAttrape(null);
    if (id) void deplacer(id, etat);
  }

  return (
    <div id="financeurs" className="scroll-mt-24 space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {financeurs ? <p className="text-sm text-[var(--pj-gris,#6B6A8A)]">Un projet ajouté → ses financeurs.</p> : null}
        <button type="button" onClick={() => setOuvert('nouveau')} className="ml-auto rounded-xl bg-[var(--pj-accent,#4F46E5)] px-4 py-2 text-sm font-bold text-white hover:bg-[var(--pj-accent-fonce,#4338CA)]">
          + Ajouter un projet
        </button>
      </div>

      {erreur ? <p className="rounded-xl border border-[#F5D6A8] bg-[#FEF3E2] px-4 py-3 text-sm text-[#7C3E06]">{erreur}</p> : null}
      {ouvert === 'nouveau' ? (
        <FicheProjet projet={null} onFermer={() => setOuvert(null)} taches={taches} equipe={equipe} projets={projets} />
      ) : null}
      {ouvert && ouvert !== 'nouveau' ? (
        <FicheProjet
          key={ouvert.id}
          projet={projets.find((p) => p.id === ouvert.id) ?? ouvert}
          onFermer={() => setOuvert(null)}
         
          taches={taches}
          equipe={equipe}
          projets={projets}
        />
      ) : null}

      <section className="grid gap-4 md:grid-cols-3">
        {COLONNES.map((col) => {
          const siens = projets.filter((p) => etatDe(p) === col.etat);
          const cible = survolee === col.etat;
          return (
            <div
              key={col.etat}
              onDragOver={(e) => {
                e.preventDefault();
                setSurvolee(col.etat);
              }}
              onDragLeave={() => setSurvolee((s) => (s === col.etat ? null : s))}
              onDrop={(e) => surDepot(e, col.etat)}
              className={`rounded-2xl p-3 transition ${cible ? 'bg-[var(--pj-teinte,#ECEBFC)] ring-2 ring-[var(--pj-accent,#4F46E5)]' : 'bg-[var(--pj-teinte-douce,#F3F2FD)]'}`}
            >
              <p className="px-2 font-extrabold text-[var(--pj-encre,#1D1B5C)]">
                {col.titre} <span className="text-[var(--pj-gris,#6B6A8A)]">{siens.length}</span>
              </p>
              <p className="px-2 text-xs text-[var(--pj-gris,#6B6A8A)]">{col.aide}</p>

              <ul className="mt-3 space-y-2">
                {siens.map((p) => (
                  <li key={p.id}>
                    <div
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('text/plain', p.id);
                        e.dataTransfer.effectAllowed = 'move';
                        setAttrape(p.id);
                      }}
                      onDragEnd={() => setAttrape(null)}
                      className={`${CARTE} cursor-grab p-3 active:cursor-grabbing ${attrape === p.id ? 'opacity-50' : ''}`}
                    >
                      <button type="button" onClick={() => setOuvert(p)} className="block w-full text-left">
                        <span className="block font-extrabold leading-snug text-[var(--pj-encre,#1D1B5C)]">{p.intitule}</span>
                        <span className="mt-0.5 block text-sm text-[var(--pj-gris,#6B6A8A)]">
                          {p.dateDebut ? dateCourte(p.dateDebut) : 'Pas encore de date'}
                          {p.lieu ? ` · ${p.lieu}` : ''}
                        </span>
                        {p.resume ? <span className="mt-2 line-clamp-2 block text-sm leading-relaxed text-[var(--pj-texte,#3B3A66)]">{p.resume}</span> : null}
                        <span className="mt-2 flex flex-wrap gap-1.5 text-xs font-bold text-[var(--pj-gris,#6B6A8A)]">
                          {p.beneficiaires !== null ? <span className="rounded-full bg-[var(--pj-fond,#F0EFF7)] px-2 py-0.5">{p.beneficiaires} personnes</span> : null}
                          {p.benevoles !== null ? <span className="rounded-full bg-[var(--pj-fond,#F0EFF7)] px-2 py-0.5">{p.benevoles} bénévoles</span> : null}
                          {p.cout !== null ? <span className="rounded-full bg-[var(--pj-fond,#F0EFF7)] px-2 py-0.5">{formaterEuros(p.cout)}</span> : null}
                          {etatDe(p) === 'TERMINEE' && !p.bilan ? <span className="rounded-full bg-[#FEF3E2] px-2 py-0.5 text-[#7C3E06]">Bilan à écrire</span> : null}
                        </span>
                        <PastillesFormations projet={p} />
                        <Progression projet={p} />
                      </button>

                      <label className="mt-2 flex items-center gap-2 text-[11px] font-bold text-[var(--pj-gris,#6B6A8A)]">
                        Déplacer vers
                        <select
                          value={etatDe(p)}
                          onChange={(e) => void deplacer(p.id, e.target.value as EtatAction)}
                          className="flex-1 rounded-lg border border-[var(--pj-bord-champ,#D9D6EE)] bg-white px-2 py-1 text-xs font-bold text-[var(--pj-encre,#1D1B5C)] focus:border-[var(--pj-accent,#4F46E5)] focus:outline-none"
                        >
                          {COLONNES.map((c) => (
                            <option key={c.etat} value={c.etat}>
                              {LIBELLES_ETAT_ACTION[c.etat]}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                  </li>
                ))}
                {siens.length === 0 ? (
                  <li className="px-2 py-6 text-center text-sm text-[var(--pj-gris-clair,#9A99B5)]">{cible ? 'Pose la carte ici' : 'Rien ici'}</li>
                ) : null}
              </ul>
            </div>
          );
        })}
      </section>
    </div>
  );
}

/** Les formations reliées au projet, et l'espace qui le porte quand ce n'est pas le nôtre. */
export function PastillesFormations({ projet }: { projet: ActionAssociation }) {
  const formations = projet.formations ?? [];
  const autre = projet.proprietaire?.type === 'ASSOCIATION' ? projet.proprietaire : null;
  if (!formations.length && !autre) return null;
  return (
    <span className="mt-2 flex flex-wrap gap-1.5 text-xs font-bold">
      {autre ? (
        <span className="rounded-full border border-[var(--pj-bord-champ,#D9D6EE)] px-2 py-0.5 text-[var(--pj-gris,#6B6A8A)]" title="Projet de l'association reliée">
          {autre.nom}
        </span>
      ) : null}
      {formations.map((f) => (
        <span key={f.id} className="inline-flex max-w-full items-center gap-1 rounded-full bg-[#E3F5EC] px-2 py-0.5 text-[#0F5F3E]" title={`Formation · ${f.academieNom}`}>
          <Icone nom="toque" className="h-3 w-3 shrink-0" />
          <span className="truncate">{f.titre}</span>
        </span>
      ))}
    </span>
  );
}

/** x/y tâches faites, en barre fine. Rien tant que le projet n'a pas de tâche. */
function Progression({ projet }: { projet: ActionAssociation }) {
  const total = projet.tachesTotal ?? 0;
  if (!total) return null;
  const faites = projet.tachesFaites ?? 0;
  const p = Math.round((faites / total) * 100);
  return (
    <span className="mt-2.5 flex items-center gap-2" title={`${faites} tâche${faites > 1 ? 's' : ''} faite${faites > 1 ? 's' : ''} sur ${total}`}>
      <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--pj-teinte,#ECEBFC)]">
        <span className={`block h-full rounded-full ${faites === total ? 'bg-[#1E9E6A]' : 'bg-[var(--pj-accent,#4F46E5)]'}`} style={{ width: `${p}%` }} />
      </span>
      <span className="text-[11px] font-bold text-[var(--pj-gris,#6B6A8A)]">
        {faites}/{total}
      </span>
    </span>
  );
}
