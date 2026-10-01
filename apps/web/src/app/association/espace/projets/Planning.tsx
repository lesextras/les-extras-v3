'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { CARTE } from '../../_ui';
import type { ActionAssociation, EtatAction, MembreEquipe, TacheProjet } from '../_types';
import { Avatar, Icone, JOUR, ROUGE, STATUT, STATUTS, aujourdhui, dateMini, enRetard, jourDe, nomResponsable } from './_taches';
import { FicheProjet } from './FicheProjet';
import { FormTache } from './FormTache';

const COULEUR_PROJET: Record<EtatAction, { barre: string; texte: string }> = {
  PREVUE: { barre: '#C7C4F2', texte: '#1D1B5C' },
  EN_COURS: { barre: '#4F46E5', texte: '#FFFFFF' },
  TERMINEE: { barre: '#1E9E6A', texte: '#FFFFFF' },
};

const MOIS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];

/** Lundi (UTC) de la semaine d'un jour. */
function lundi(j: number) {
  const d = new Date(j).getUTCDay();
  return j - ((d + 6) % 7) * JOUR;
}

interface Plage {
  debut: number;
  fin: number;
}

function plageProjet(p: ActionAssociation): Plage | null {
  const d = p.dateDebut ? jourDe(p.dateDebut) : null;
  const f = p.dateFin ? jourDe(p.dateFin) : null;
  if (d === null && f === null) return null;
  const a = d ?? (f as number);
  const b = f ?? (d as number);
  return { debut: Math.min(a, b), fin: Math.max(a, b) };
}

/**
 * LE PLANNING : les projets et leurs tâches sur une seule frise.
 *
 * Une ligne par projet (sa barre du début à la fin), et dessous ses tâches :
 * une barre du début à l'échéance, ou un losange quand il n'y a qu'une
 * échéance. Couleur = statut, rouge = en retard. Défile à l'horizontale sur
 * téléphone ; un clic ouvre la fiche du projet ou la tâche.
 */
export function Planning({
  projets,
  taches,
  equipe,
  iaDisponible,
}: {
  projets: ActionAssociation[];
  taches: TacheProjet[];
  equipe: MembreEquipe[];
  iaDisponible: boolean;
}) {
  const [projetOuvert, setProjetOuvert] = useState<ActionAssociation | null>(null);
  const [tacheOuverte, setTacheOuverte] = useState<TacheProjet | null>(null);
  const [masquerFaites, setMasquerFaites] = useState(false);
  /* « Aujourd'hui » se lit dans le navigateur, après le premier affichage (pas d'écart serveur / navigateur). */
  const [jour, setJour] = useState<number | null>(null);
  useEffect(() => setJour(aujourdhui()), []);

  const lignes = useMemo(() => {
    const ordonnes = [...projets].sort((a, b) => {
      const pa = plageProjet(a)?.debut ?? Number.POSITIVE_INFINITY;
      const pb = plageProjet(b)?.debut ?? Number.POSITIVE_INFINITY;
      return pa - pb || a.intitule.localeCompare(b.intitule, 'fr');
    });
    return ordonnes.map((p) => ({
      projet: p,
      plage: plageProjet(p),
      taches: taches
        .filter((t) => t.actionId === p.id && !(masquerFaites && t.statut === 'FAITE'))
        .sort((a, b) => {
          const da = a.debut ?? a.echeance;
          const db = b.debut ?? b.echeance;
          if (da && db) return jourDe(da) - jourDe(db);
          return da ? -1 : db ? 1 : a.ordre - b.ordre;
        }),
    }));
  }, [projets, taches, masquerFaites]);

  /* La fenêtre : tout ce qui est daté, aujourd'hui compris, avec une marge d'une semaine. */
  const fenetre = useMemo(() => {
    const jours: number[] = [jour ?? aujourdhui()];
    for (const l of lignes) {
      if (l.plage) jours.push(l.plage.debut, l.plage.fin);
      for (const t of l.taches) {
        if (t.debut) jours.push(jourDe(t.debut));
        if (t.echeance) jours.push(jourDe(t.echeance));
      }
    }
    const debut = lundi(Math.min(...jours) - 7 * JOUR);
    let fin = Math.max(...jours) + 14 * JOUR;
    if (fin - debut < 56 * JOUR) fin = debut + 56 * JOUR;
    const nbJours = Math.round((fin - debut) / JOUR) + 1;
    const px = nbJours <= 100 ? 22 : nbJours <= 220 ? 10 : nbJours <= 500 ? 5 : 3;
    return { debut, nbJours, px, largeur: nbJours * px };
  }, [lignes, jour]);

  const x = (j: number) => Math.round(((j - fenetre.debut) / JOUR) * fenetre.px);

  const entetes = useMemo(() => {
    const mois: { gauche: number; largeur: number; libelle: string }[] = [];
    const semaines: { gauche: number; libelle: string }[] = [];
    const fin = fenetre.debut + (fenetre.nbJours - 1) * JOUR;
    let d = new Date(fenetre.debut);
    while (d.getTime() <= fin) {
      const premier = Math.max(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1), fenetre.debut);
      const suivant = Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1);
      const g = Math.round(((premier - fenetre.debut) / JOUR) * fenetre.px);
      const l = Math.round(((Math.min(suivant, fin + JOUR) - premier) / JOUR) * fenetre.px);
      mois.push({ gauche: g, largeur: l, libelle: `${MOIS[d.getUTCMonth()]}${d.getUTCMonth() === 0 ? ` ${d.getUTCFullYear()}` : ''}` });
      d = new Date(suivant);
    }
    if (fenetre.px >= 5) {
      for (let j = fenetre.debut; j <= fin; j += 7 * JOUR) {
        semaines.push({ gauche: Math.round(((j - fenetre.debut) / JOUR) * fenetre.px), libelle: String(new Date(j).getUTCDate()) });
      }
    }
    return { mois, semaines };
  }, [fenetre]);

  const dates = lignes.some((l) => l.plage || l.taches.some((t) => t.debut || t.echeance));
  const GAUCHE = 'w-36 sm:w-56';

  return (
    <div className="space-y-4">
      {projetOuvert ? (
        <FicheProjet
          key={projetOuvert.id}
          projet={projets.find((p) => p.id === projetOuvert.id) ?? projetOuvert}
          onFermer={() => setProjetOuvert(null)}
          iaDisponible={iaDisponible}
          taches={taches}
          equipe={equipe}
          projets={projets}
        />
      ) : null}
      {tacheOuverte ? (
        <FormTache key={tacheOuverte.id} tache={tacheOuverte} actionId={tacheOuverte.actionId} equipe={equipe} projets={projets} onFermer={() => setTacheOuverte(null)} />
      ) : null}

      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs font-bold text-[#6B6A8A]">
        {STATUTS.map((s) => (
          <span key={s.code} className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-4 rounded-full" style={{ background: s.barre }} />
            {s.libelle}
          </span>
        ))}
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-4 rounded-full" style={{ background: ROUGE }} />
          En retard
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rotate-45 bg-[#4F46E5]" />
          Échéance
        </span>
        <label className="ml-auto inline-flex cursor-pointer items-center gap-1.5">
          <input type="checkbox" checked={masquerFaites} onChange={(e) => setMasquerFaites(e.target.checked)} className="h-4 w-4 accent-[#4F46E5]" />
          Masquer les faites
        </label>
      </div>

      {projets.length === 0 ? (
        <p className={`${CARTE} px-4 py-8 text-center text-sm text-[#6B6A8A]`}>Aucun projet.</p>
      ) : (
        <div className={`${CARTE} overflow-hidden`}>
          {!dates ? <p className="border-b border-[#E6E4F3] bg-[#F5F4FC] px-4 py-2 text-xs text-[#6B6A8A]">Ajoute des dates aux projets et aux tâches pour les voir sur la frise.</p> : null}
          <div className="overflow-x-auto overscroll-x-contain">
            <div className="relative w-max min-w-full">
              {/* ----------------------------------------------------- en-tête */}
              <div className="flex border-b border-[#E6E4F3] bg-white">
                <div className={`${GAUCHE} sticky left-0 z-30 shrink-0 border-r border-[#E6E4F3] bg-white px-3 py-2 text-xs font-extrabold uppercase tracking-wide text-[#6B6A8A]`}>Projets</div>
                <div className="relative h-12 shrink-0" style={{ width: fenetre.largeur }}>
                  {entetes.mois.map((m) => (
                    <div key={m.gauche} className="absolute top-0 h-6 truncate border-l border-[#E6E4F3] px-1.5 pt-1 text-xs font-extrabold text-[#1D1B5C]" style={{ left: m.gauche, width: m.largeur }}>
                      {m.libelle}
                    </div>
                  ))}
                  {entetes.semaines.map((s) => (
                    <div key={s.gauche} className="absolute top-6 h-6 border-l border-[#F0EFF7] pl-1 pt-1 text-[10px] font-bold text-[#9A99B5]" style={{ left: s.gauche }}>
                      {s.libelle}
                    </div>
                  ))}
                </div>
              </div>

              {/* ------------------------------------------------------ lignes */}
              <div className="relative">
                {lignes.map(({ projet, plage, taches: siennes }) => {
                  const c = COULEUR_PROJET[projet.etat];
                  return (
                    <div key={projet.id} className="border-b border-[#F0EFF7] last:border-b-0">
                      <div className="flex">
                        <button
                          type="button"
                          onClick={() => setProjetOuvert(projet)}
                          className={`${GAUCHE} sticky left-0 z-10 shrink-0 truncate border-r border-[#E6E4F3] bg-white px-3 py-2.5 text-left text-sm font-extrabold text-[#1D1B5C] hover:text-[#4F46E5]`}
                          title={projet.intitule}
                        >
                          {projet.intitule}
                        </button>
                        <div className="relative h-11 shrink-0 bg-[#FAFAFE]" style={{ width: fenetre.largeur }}>
                          <Grille semaines={entetes.semaines} />
                          {plage ? (
                            <button
                              type="button"
                              onClick={() => setProjetOuvert(projet)}
                              className="absolute top-2 flex h-7 items-center overflow-hidden rounded-lg px-2 text-xs font-extrabold shadow-sm hover:ring-2 hover:ring-[#1D1B5C]/30"
                              style={{ left: x(plage.debut), width: Math.max(x(plage.fin + JOUR) - x(plage.debut), 10), background: c.barre, color: c.texte }}
                              title={`${projet.intitule} · ${dateMini(new Date(plage.debut).toISOString())} → ${dateMini(new Date(plage.fin).toISOString())}`}
                            >
                              <span className="truncate">{projet.intitule}</span>
                            </button>
                          ) : (
                            <span className="sticky left-0 top-3 inline-block px-3 pt-3 text-xs text-[#9A99B5]">Sans date</span>
                          )}
                          {jour !== null ? <LigneDuJour gauche={x(jour) + fenetre.px / 2} /> : null}
                        </div>
                      </div>

                      {siennes.map((t) => (
                        <LigneTache key={t.id} tache={t} equipe={equipe} fenetre={fenetre} semaines={entetes.semaines} x={x} jour={jour} gauche={GAUCHE} onOuvrir={() => setTacheOuverte(t)} />
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

type Fenetre = { debut: number; nbJours: number; px: number; largeur: number };

function Grille({ semaines }: { semaines: { gauche: number }[] }) {
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden="true">
      {semaines.map((s) => (
        <span key={s.gauche} className="absolute inset-y-0 border-l border-[#F0EFF7]" style={{ left: s.gauche }} />
      ))}
    </div>
  );
}

function LigneDuJour({ gauche }: { gauche: number }) {
  return <span className="pointer-events-none absolute inset-y-0 z-[5] w-0.5 bg-[#D6335C]/70" style={{ left: gauche }} aria-hidden="true" />;
}

function LigneTache({
  tache: t,
  equipe,
  fenetre,
  semaines,
  x,
  jour,
  gauche,
  onOuvrir,
}: {
  tache: TacheProjet;
  equipe: MembreEquipe[];
  fenetre: Fenetre;
  semaines: { gauche: number }[];
  x: (j: number) => number;
  jour: number | null;
  gauche: string;
  onOuvrir: () => void;
}) {
  const retard = jour !== null && enRetard(t);
  const couleur = retard ? ROUGE : STATUT[t.statut].barre;
  const r = nomResponsable(t, equipe);
  const debut = t.debut ? jourDe(t.debut) : null;
  const fin = t.echeance ? jourDe(t.echeance) : null;
  const titre = `${t.titre} · ${STATUT[t.statut].libelle}${t.echeance ? ` · échéance ${dateMini(t.echeance)}` : ''}${r.nom ? ` · ${r.nom}` : ''}`;

  let marque: ReactNode;
  if (debut !== null) {
    const f = fin ?? debut;
    marque = (
      <button
        type="button"
        onClick={onOuvrir}
        title={titre}
        className="absolute top-2 h-4 rounded-full hover:ring-2 hover:ring-[#1D1B5C]/30"
        style={{ left: x(debut), width: Math.max(x(f + JOUR) - x(debut), 8), background: couleur, opacity: t.statut === 'FAITE' ? 0.55 : 1 }}
        aria-label={titre}
      />
    );
  } else if (fin !== null) {
    marque = (
      <button
        type="button"
        onClick={onOuvrir}
        title={titre}
        className="absolute top-2 h-3.5 w-3.5 rotate-45 rounded-[3px] hover:ring-2 hover:ring-[#1D1B5C]/30"
        style={{ left: x(fin) + fenetre.px / 2 - 7, background: couleur, opacity: t.statut === 'FAITE' ? 0.55 : 1 }}
        aria-label={titre}
      />
    );
  } else {
    marque = <span className="sticky left-0 inline-block px-3 pt-1.5 text-[11px] text-[#9A99B5]">Sans date</span>;
  }

  return (
    <div className="flex">
      <button
        type="button"
        onClick={onOuvrir}
        className={`${gauche} sticky left-0 z-10 flex shrink-0 items-center gap-1.5 border-r border-[#E6E4F3] bg-white py-1.5 pl-5 pr-2 text-left text-xs text-[#3B3A66] hover:text-[#4F46E5]`}
        title={titre}
      >
        <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: couleur }} />
        <span className={`min-w-0 flex-1 truncate ${t.statut === 'FAITE' ? 'line-through opacity-60' : ''}`}>{t.titre}</span>
        <span className="hidden sm:inline-flex">
          <Avatar nom={r.nom} moi={r.moi} taille="sm" />
        </span>
        {t.priorite === 'HAUTE' ? <Icone nom="drapeau" className="h-3 w-3 shrink-0 text-[#D6335C]" /> : null}
      </button>
      <div className="relative h-8 shrink-0" style={{ width: fenetre.largeur }}>
        <Grille semaines={semaines} />
        {marque}
        {jour !== null ? <LigneDuJour gauche={x(jour) + fenetre.px / 2} /> : null}
      </div>
    </div>
  );
}
