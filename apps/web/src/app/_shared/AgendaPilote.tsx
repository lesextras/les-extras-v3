'use client';

/**
 * L'AGENDA DE PILOTE — 9/09/2026.
 *
 * CE QU'IL RÉPARE. Les dates de Pilote existaient déjà, mais chacune dans son
 * écran : la session dans « Mes formations », l'échéance dans « Mes dossiers »,
 * la péremption d'une pièce dans le classeur, la date choisie par un répondant
 * au fond d'un tableau de réponses. Personne ne pouvait répondre à la question
 * la plus simple d'une équipe : qu'est-ce qu'on a la semaine prochaine ?
 *
 * CE QU'IL FAIT. Une seule grille, celle du COMPTE — donc la même pour toute
 * l'équipe. Les dates y sont LUES dans leurs écrans d'origine : on ne recopie
 * rien, donc rien ne peut diverger. Seuls les rendez-vous pris à la main
 * appartiennent à l'agenda ; eux seuls s'y modifient. Le reste porte un lien
 * vers l'écran où il vit.
 *
 * POURQUOI UNE GRILLE ET UNE LISTE. Le mois répond à « quand ? », la liste à
 * « quoi ensuite ? ». Les deux questions se posent, et une seule vue oblige
 * toujours l'une des deux à se débrouiller.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Teinte } from './formulaires/types';

/* ------------------------------------------------------------------ types */

export type SourceEvenement =
  | 'RENDEZ_VOUS'
  | 'SESSION'
  | 'CLASSE_VIRTUELLE'
  | 'FORMULAIRE'
  | 'REPONSE_FORMULAIRE'
  | 'DOSSIER'
  | 'PIECE'
  | 'ACTION';

export interface EvenementAgenda {
  id: string;
  source: SourceEvenement;
  rendezVousId: string | null;
  titre: string;
  detail: string | null;
  lieu: string | null;
  lien: string | null;
  debut: string;
  fin: string | null;
  journeeEntiere: boolean;
  categorie: string | null;
  participants: string[];
  modifiable: boolean;
  href: string | null;
  par: string | null;
}

export interface PersonneAgenda {
  nom: string;
  detail: string | null;
  groupe: 'EQUIPE' | 'CONTACT';
}

interface Props {
  /** La teinte de l'espace : vert bouteille pour l'académie, indigo pour l'association. */
  teinte: Teinte;
  /** L'appel à l'API de l'espace : c'est lui qui porte le compte actif. */
  appel: <T = unknown>(
    path: string,
    init?: { method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'; body?: unknown },
  ) => Promise<T>;
}

/* --------------------------------------------------------------- sources */

/**
 * Chaque provenance a sa couleur, et la même dans les deux espaces : on
 * apprend la légende une fois. Les couleurs sont assez foncées pour rester
 * lisibles sur leur fond clair (contraste ≥ 4,5:1).
 */
const SOURCES: Record<SourceEvenement, { nom: string; fond: string; texte: string; bord: string }> = {
  RENDEZ_VOUS: { nom: 'Rendez-vous', fond: '#EEF2FF', texte: '#3730A3', bord: '#C7D2FE' },
  SESSION: { nom: 'Session de formation', fond: '#FEF3C7', texte: '#92400E', bord: '#FDE68A' },
  CLASSE_VIRTUELLE: { nom: 'Classe virtuelle', fond: '#E0F2FE', texte: '#075985', bord: '#BAE6FD' },
  FORMULAIRE: { nom: 'Clôture de formulaire', fond: '#F3E8FF', texte: '#6B21A8', bord: '#E9D5FF' },
  REPONSE_FORMULAIRE: { nom: 'Date choisie dans un formulaire', fond: '#CCFBF1', texte: '#115E59', bord: '#99F6E4' },
  DOSSIER: { nom: 'Dossier de financement', fond: '#FEE2E2', texte: '#991B1B', bord: '#FECACA' },
  PIECE: { nom: 'Pièce à renouveler', fond: '#FFEDD5', texte: '#9A3412', bord: '#FED7AA' },
  ACTION: { nom: 'Action de l’association', fond: '#DBEAFE', texte: '#1E40AF', bord: '#BFDBFE' },
};

const CATEGORIES = [
  { valeur: 'RENDEZ_VOUS', libelle: 'Rendez-vous' },
  { valeur: 'REUNION', libelle: 'Réunion' },
  { valeur: 'APPEL', libelle: 'Appel' },
  { valeur: 'VISITE', libelle: 'Visite' },
  { valeur: 'ECHEANCE', libelle: 'Échéance' },
  { valeur: 'AUTRE', libelle: 'Autre' },
];

const JOURS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
const JOURS_COURT = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const MOIS = [
  'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
];

/* ---------------------------------------------------------------- dates */

const cle = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** Lundi de la semaine d'une date. Le calendrier français commence le lundi. */
function lundi(d: Date) {
  const r = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const decalage = (r.getDay() + 6) % 7;
  r.setDate(r.getDate() - decalage);
  return r;
}

/** Les 42 cases d'une grille de mois : six semaines, toujours. */
function grilleDuMois(mois: Date): Date[] {
  const depart = lundi(new Date(mois.getFullYear(), mois.getMonth(), 1));
  return Array.from({ length: 42 }, (_, i) => {
    const j = new Date(depart);
    j.setDate(depart.getDate() + i);
    return j;
  });
}

function heure(iso: string) {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}h${String(d.getMinutes()).padStart(2, '0')}`;
}

function jourLong(d: Date) {
  return `${JOURS[(d.getDay() + 6) % 7]} ${d.getDate()} ${MOIS[d.getMonth()]}`;
}

/** Une date locale au format que réclame <input type="datetime-local">. */
function pourChamp(d: Date) {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

function brouillonVide(): Brouillon {
  const n = new Date();
  n.setMinutes(0, 0, 0);
  return {
    id: null,
    titre: '',
    categorie: 'RENDEZ_VOUS',
    debut: pourChamp(n),
    fin: '',
    journeeEntiere: false,
    lieu: '',
    lien: '',
    participants: '',
    description: '',
  };
}

/* ------------------------------------------------------------ habillage */

/**
 * Les deux espaces partagent la mise en page et ne diffèrent que par leur
 * teinte. Tailwind ne sait pas composer une classe depuis une variable : ce
 * qui dépend de la couleur passe donc en style en ligne, et ce qui n'en dépend
 * pas reste en classes.
 */
interface Classes extends Teinte {
  champ: string;
  btnPrimaire: string;
  btnSecondaire: string;
  carte: string;
}

function classes(teinte: Teinte): Classes {
  return {
    ...teinte,
    champ:
      'w-full rounded-xl border border-[color:var(--ag-bord)] bg-white px-3 py-2.5 text-[15px] text-[color:var(--ag-encre)] focus:border-[color:var(--ag-plein)] focus:outline-none focus:ring-4 focus:ring-[color:var(--ag-clair)]',
    btnPrimaire:
      'inline-flex items-center justify-center gap-2 rounded-xl bg-[color:var(--ag-plein)] px-4 py-2.5 text-[15px] font-bold text-white no-underline shadow-sm transition hover:bg-[color:var(--ag-plein-survol)] focus:outline-none focus:ring-4 focus:ring-[color:var(--ag-clair)] disabled:opacity-60',
    btnSecondaire:
      'inline-flex items-center justify-center gap-2 rounded-xl border-2 border-[color:var(--ag-bord)] bg-white px-4 py-2 text-[15px] font-bold text-[color:var(--ag-encre)] no-underline transition hover:border-[color:var(--ag-plein)] hover:text-[color:var(--ag-plein)] focus:outline-none focus:ring-4 focus:ring-[color:var(--ag-clair)] disabled:opacity-60',
    carte: 'rounded-2xl border border-[color:var(--ag-bord)] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)]',
  };
}

/* ------------------------------------------------------------ composant */

export default function AgendaPilote({ teinte, appel }: Props) {
  const t = classes(teinte);
  const [mois, setMois] = useState(() => {
    const n = new Date();
    return new Date(n.getFullYear(), n.getMonth(), 1);
  });
  const [vue, setVue] = useState<'mois' | 'liste'>('mois');
  const [evenements, setEvenements] = useState<EvenementAgenda[]>([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);
  const [jourOuvert, setJourOuvert] = useState<string | null>(null);
  const [formulaire, setFormulaire] = useState<Brouillon | null>(null);
  const zoneJour = useRef<HTMLDivElement | null>(null);
  /* Le rendez-vous qu'on tient pendant le glissé. Une référence et non un
     état : le changer ne doit pas re-rendre la grille quarante fois pendant
     qu'on traverse le mois. */
  const glisse = useRef<EvenementAgenda | null>(null);
  const [surZone, setSurZone] = useState<string | null>(null);
  const [personnes, setPersonnes] = useState<PersonneAgenda[]>([]);

  const cases = useMemo(() => grilleDuMois(mois), [mois]);

  const charger = useCallback(async () => {
    setChargement(true);
    setErreur(null);
    try {
      const du = cases[0];
      const au = new Date(cases[41]);
      au.setHours(23, 59, 59, 999);
      const liste = await appel<EvenementAgenda[]>(
        `/agenda?du=${encodeURIComponent(du.toISOString())}&au=${encodeURIComponent(au.toISOString())}`,
      );
      setEvenements(Array.isArray(liste) ? liste : []);
    } catch (e) {
      setErreur(e instanceof Error ? e.message : 'L’agenda n’a pas pu être chargé.');
      setEvenements([]);
    } finally {
      setChargement(false);
    }
  }, [appel, cases]);

  useEffect(() => {
    void charger();
  }, [charger]);

  // Qui on peut convier : l'équipe du compte, et le répertoire de contacts
  // quand il y en a un. Chargé une fois, pas à chaque changement de mois.
  useEffect(() => {
    let vivant = true;
    appel<PersonneAgenda[]>('/agenda/personnes')
      .then((l) => {
        if (vivant && Array.isArray(l)) setPersonnes(l);
      })
      .catch(() => undefined);
    return () => {
      vivant = false;
    };
  }, [appel]);

  /** Les événements rangés par jour : la grille n'a plus qu'à piocher. */
  const parJour = useMemo(() => {
    const carte = new Map<string, EvenementAgenda[]>();
    for (const e of evenements) {
      const k = cle(new Date(e.debut));
      const liste = carte.get(k);
      if (liste) liste.push(e);
      else carte.set(k, [e]);
    }
    return carte;
  }, [evenements]);

  const aujourdhui = cle(new Date());

  const suivants = useMemo(() => {
    const maintenant = Date.now();
    return evenements
      .filter((e) => new Date(e.fin ?? e.debut).getTime() >= maintenant - 12 * 3600 * 1000)
      .slice(0, 60);
  }, [evenements]);

  /**
   * CLIQUER UN JOUR, C'EST DÉJÀ COMMENCER À ÉCRIRE.
   *
   * Le clic ouvrait le détail du jour, et il fallait un second clic pour
   * atteindre le formulaire. On ouvre les deux d'un coup : le jour à gauche,
   * la saisie déjà datée à droite. Qui voulait seulement regarder n'a qu'à
   * lire ; qui voulait poser un rendez-vous a le curseur au bon endroit.
   */
  const ouvrirJour = (k: string) => {
    setJourOuvert(k);
    const j = new Date(`${k}T12:00:00`);
    j.setHours(9, 0, 0, 0);
    setFormulaire((f) =>
      f && f.id ? f : { ...brouillonVide(), debut: pourChamp(j) },
    );
    window.setTimeout(() => zoneJour.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 60);
  };

  const nouveau = (jour?: Date) => {
    const base = jour ? new Date(jour) : new Date();
    if (jour) base.setHours(9, 0, 0, 0);
    else base.setMinutes(0, 0, 0);
    setFormulaire({ ...brouillonVide(), debut: pourChamp(base) });
    window.setTimeout(() => zoneJour.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 60);
  };

  const editer = (e: EvenementAgenda) => {
    if (!e.rendezVousId) return;
    setFormulaire({
      id: e.rendezVousId,
      titre: e.titre,
      categorie: e.categorie ?? 'RENDEZ_VOUS',
      debut: pourChamp(new Date(e.debut)),
      fin: e.fin ? pourChamp(new Date(e.fin)) : '',
      journeeEntiere: e.journeeEntiere,
      lieu: e.lieu ?? '',
      lien: e.lien ?? '',
      participants: e.participants.join(', '),
      description: e.detail ?? '',
    });
  };

  const enregistrer = async (b: Brouillon) => {
    const corps = {
      titre: b.titre.trim(),
      categorie: b.categorie,
      debut: new Date(b.debut).toISOString(),
      ...(b.fin ? { fin: new Date(b.fin).toISOString() } : {}),
      journeeEntiere: b.journeeEntiere,
      lieu: b.lieu.trim() || undefined,
      lien: b.lien.trim() || undefined,
      description: b.description.trim() || undefined,
      participants: b.participants
        .split(',')
        .map((p) => p.trim())
        .filter(Boolean),
    };
    if (b.id) await appel(`/agenda/${b.id}`, { method: 'PATCH', body: corps });
    else await appel('/agenda', { method: 'POST', body: corps });
    setFormulaire(null);
    await charger();
  };

  /**
   * DÉPOSER UN RENDEZ-VOUS SUR UN AUTRE JOUR.
   *
   * On garde l'heure et la durée : déplacer une réunion de mardi à jeudi ne
   * veut pas dire la remettre à neuf heures. Et on écrit tout de suite dans la
   * grille avant que l'API réponde — sinon le rendez-vous saute une seconde à
   * son ancienne place, ce qui donne l'impression que le geste a raté.
   */
  const deplacer = async (jour: Date) => {
    const e = glisse.current;
    glisse.current = null;
    if (!e || !e.rendezVousId) return;

    const ancien = new Date(e.debut);
    const nouveauDebut = new Date(jour);
    nouveauDebut.setHours(ancien.getHours(), ancien.getMinutes(), 0, 0);
    const ecart = nouveauDebut.getTime() - ancien.getTime();
    if (ecart === 0) return;
    const nouvelleFin = e.fin ? new Date(new Date(e.fin).getTime() + ecart) : null;

    setEvenements((liste) =>
      liste.map((x) =>
        x.id === e.id
          ? { ...x, debut: nouveauDebut.toISOString(), fin: nouvelleFin ? nouvelleFin.toISOString() : null }
          : x,
      ),
    );

    try {
      await appel(`/agenda/${e.rendezVousId}`, {
        method: 'PATCH',
        body: {
          debut: nouveauDebut.toISOString(),
          ...(nouvelleFin ? { fin: nouvelleFin.toISOString() } : {}),
        },
      });
    } catch (err) {
      setErreur(err instanceof Error ? err.message : 'Le déplacement n’a pas été enregistré.');
    }
    await charger();
  };

  const supprimer = async (id: string) => {
    await appel(`/agenda/${id}`, { method: 'DELETE' });
    setFormulaire(null);
    await charger();
  };

  const jourChoisi = jourOuvert ? parJour.get(jourOuvert) ?? [] : [];

  /**
   * Les couleurs passent par des variables CSS posées ici : les classes
   * Tailwind ne peuvent pas être fabriquées à partir d'une variable, mais elles
   * peuvent LIRE une variable. Une seule déclaration teinte tout l'écran.
   */
  const variables = {
    '--ag-plein': teinte.plein,
    '--ag-plein-survol': teinte.pleinSurvol,
    '--ag-clair': teinte.clair,
    '--ag-bord': teinte.bord,
    '--ag-encre': teinte.encre,
    '--ag-fond': teinte.fond,
  } as React.CSSProperties;

  return (
    <div className="space-y-5" style={variables}>
      {/* ------------------------------------------------------ barre */}
      <div className={`${t.carte} flex flex-wrap items-center gap-3 p-4`}>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setMois(new Date(mois.getFullYear(), mois.getMonth() - 1, 1))}
            className="rounded-lg border border-transparent px-3 py-2 text-lg font-bold leading-none hover:bg-black/5"
            style={{ color: t.plein }}
            aria-label="Mois précédent"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={() => setMois(new Date(mois.getFullYear(), mois.getMonth() + 1, 1))}
            className="rounded-lg border border-transparent px-3 py-2 text-lg font-bold leading-none hover:bg-black/5"
            style={{ color: t.plein }}
            aria-label="Mois suivant"
          >
            ›
          </button>
        </div>

        <h2 className="text-lg font-extrabold capitalize" style={{ color: t.encre }}>
          {MOIS[mois.getMonth()]} {mois.getFullYear()}
        </h2>

        <button
          type="button"
          onClick={() => {
            const n = new Date();
            setMois(new Date(n.getFullYear(), n.getMonth(), 1));
            ouvrirJour(cle(n));
          }}
          className="rounded-lg px-3 py-2 text-sm font-bold hover:bg-black/5"
          style={{ color: t.plein }}
        >
          Aujourd’hui
        </button>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <div
            className="inline-flex rounded-xl border p-1"
            style={{ borderColor: t.bord }}
            role="group"
            aria-label="Affichage de l’agenda"
          >
            {(['mois', 'liste'] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setVue(v)}
                aria-pressed={vue === v}
                className="rounded-lg px-3 py-1.5 text-sm font-bold transition"
                style={
                  vue === v
                    ? { background: t.plein, color: '#fff' }
                    : { color: t.encre, background: 'transparent' }
                }
              >
                {v === 'mois' ? 'Mois' : 'Liste'}
              </button>
            ))}
          </div>
          <button type="button" className={t.btnPrimaire} onClick={() => nouveau()}>
            Ajouter un rendez-vous
          </button>
        </div>
      </div>

      {erreur ? (
        <p className="rounded-xl border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-sm font-bold text-[#991B1B]">
          {erreur}
        </p>
      ) : null}

      {/* ------------------------------------------------------- grille */}
      {vue === 'mois' ? (
        <div className={`${t.carte} overflow-hidden`}>
          <div className="grid grid-cols-7 border-b" style={{ borderColor: t.bord }}>
            {JOURS_COURT.map((j, i) => (
              <div
                key={j}
                className="px-2 py-2 text-center text-xs font-extrabold uppercase tracking-wide"
                style={{ color: t.encre, opacity: i >= 5 ? 0.45 : 0.7 }}
              >
                <span className="hidden sm:inline">{JOURS[i]}</span>
                <span className="sm:hidden">{j}</span>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7">
            {cases.map((jour) => {
              const k = cle(jour);
              const duJour = parJour.get(k) ?? [];
              const horsMois = jour.getMonth() !== mois.getMonth();
              const estAujourdhui = k === aujourdhui;
              const choisi = k === jourOuvert;
              const survole = k === surZone;
              return (
                /* La case n'est plus un bouton : elle doit accueillir un
                   rendez-vous qu'on lui dépose, et un bouton n'est pas une
                   zone de dépôt fiable. Elle garde le rôle, le focus clavier
                   et Entrée / Espace, donc rien ne se perd. */
                <div
                  key={k}
                  role="button"
                  tabIndex={0}
                  onClick={() => ouvrirJour(k)}
                  onKeyDown={(ev) => {
                    if (ev.key === 'Enter' || ev.key === ' ') {
                      ev.preventDefault();
                      ouvrirJour(k);
                    }
                  }}
                  onDragOver={(ev) => {
                    if (!glisse.current) return;
                    ev.preventDefault();
                    ev.dataTransfer.dropEffect = 'move';
                    if (surZone !== k) setSurZone(k);
                  }}
                  onDragLeave={() => setSurZone((v) => (v === k ? null : v))}
                  onDrop={(ev) => {
                    ev.preventDefault();
                    setSurZone(null);
                    void deplacer(jour);
                  }}
                  aria-label={`${jourLong(jour)} · ${duJour.length} élément${duJour.length > 1 ? 's' : ''}`}
                  aria-pressed={choisi}
                  className="min-h-[104px] cursor-pointer border-b border-r p-1.5 text-left align-top transition hover:bg-black/[0.03] focus:outline-none focus:ring-2 focus:ring-inset"
                  style={{
                    borderColor: t.bord,
                    background: survole ? t.clair : choisi ? t.clair : horsMois ? '#FAFAFA' : '#fff',
                    boxShadow: survole ? `inset 0 0 0 2px ${t.plein}` : undefined,
                    opacity: horsMois ? 0.55 : 1,
                  }}
                >
                  <span
                    className="mb-1 inline-flex h-6 min-w-6 items-center justify-center rounded-full px-1.5 text-[13px] font-extrabold"
                    style={
                      estAujourdhui
                        ? { background: t.plein, color: '#fff' }
                        : { color: t.encre }
                    }
                  >
                    {jour.getDate()}
                  </span>
                  <span className="block space-y-1">
                    {duJour.slice(0, 3).map((e) => {
                      const s = SOURCES[e.source];
                      return (
                        <span
                          key={e.id}
                          /* Seul un rendez-vous se déplace : les autres dates
                             appartiennent à leur écran d'origine, et les
                             tirer ici ne changerait rien là-bas. */
                          draggable={e.modifiable}
                          onDragStart={(ev) => {
                            glisse.current = e;
                            ev.dataTransfer.effectAllowed = 'move';
                            ev.dataTransfer.setData('text/plain', e.id);
                          }}
                          onDragEnd={() => {
                            glisse.current = null;
                            setSurZone(null);
                          }}
                          onClick={(ev) => {
                            if (!e.modifiable) return;
                            ev.stopPropagation();
                            ouvrirJour(k);
                            editer(e);
                          }}
                          className={`block truncate rounded-md border px-1.5 py-0.5 text-[11px] font-bold leading-4 ${e.modifiable ? 'cursor-grab active:cursor-grabbing' : ''}`}
                          style={{ background: s.fond, color: s.texte, borderColor: s.bord }}
                          title={e.detail ? `${e.titre} · ${e.detail}` : e.titre}
                        >
                          {e.journeeEntiere ? '' : `${heure(e.debut)} `}
                          {e.titre}
                        </span>
                      );
                    })}
                    {duJour.length > 3 ? (
                      <span className="block px-1.5 text-[11px] font-bold" style={{ color: t.plein }}>
                        + {duJour.length - 3} autre{duJour.length - 3 > 1 ? 's' : ''}
                      </span>
                    ) : null}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* -------------------------------------------------------- liste */
        <div className={`${t.carte} divide-y`} style={{ borderColor: t.bord }}>
          {chargement ? (
            <p className="p-5 text-sm font-bold" style={{ color: t.encre }}>
              Chargement…
            </p>
          ) : suivants.length === 0 ? (
            <Vide t={t} onAjouter={() => nouveau()} />
          ) : (
            suivants.map((e) => (
              <Ligne key={e.id} evenement={e} t={t} onEditer={() => editer(e)} avecDate />
            ))
          )}
        </div>
      )}

      {/* ------------------------------------------------- jour + saisie */}
      <div ref={zoneJour} className="grid gap-5 lg:grid-cols-2">
        {jourOuvert ? (
          <section className={`${t.carte} p-5`} aria-label="Détail du jour">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-base font-extrabold capitalize" style={{ color: t.encre }}>
                {jourLong(new Date(`${jourOuvert}T12:00:00`))}
              </h3>
              <button
                type="button"
                className={t.btnSecondaire}
                onClick={() => nouveau(new Date(`${jourOuvert}T12:00:00`))}
              >
                Ajouter ce jour-là
              </button>
            </div>
            {jourChoisi.length === 0 ? (
              <p className="text-sm" style={{ color: t.encre, opacity: 0.7 }}>
                Rien de prévu ce jour-là.
              </p>
            ) : (
              <ul className="divide-y" style={{ borderColor: t.bord }}>
                {jourChoisi.map((e) => (
                  <li key={e.id}>
                    <Ligne evenement={e} t={t} onEditer={() => editer(e)} />
                  </li>
                ))}
              </ul>
            )}
          </section>
        ) : null}

        {formulaire ? (
          <Formulaire
            t={t}
            personnes={personnes}
            brouillon={formulaire}
            onChange={setFormulaire}
            onAnnuler={() => setFormulaire(null)}
            onEnregistrer={enregistrer}
            onSupprimer={supprimer}
          />
        ) : null}
      </div>

      {/* ------------------------------------------------------ légende */}
      <section className={`${t.carte} p-4`} aria-label="Ce que l’agenda affiche">
        <h3 className="mb-2 text-sm font-extrabold" style={{ color: t.encre }}>
          Ce que vous voyez ici
        </h3>
        <ul className="flex flex-wrap gap-x-4 gap-y-2">
          {(Object.keys(SOURCES) as SourceEvenement[]).map((s) => (
            <li key={s} className="flex items-center gap-2 text-[13px] font-bold" style={{ color: t.encre }}>
              <span
                className="inline-block h-3 w-3 rounded border"
                style={{ background: SOURCES[s].fond, borderColor: SOURCES[s].bord }}
                aria-hidden
              />
              {SOURCES[s].nom}
            </li>
          ))}
        </ul>
        <p className="mt-3 text-[13px]" style={{ color: t.encre, opacity: 0.75 }}>
          Une seule chose se saisit ici : le rendez-vous. Le reste vient des écrans où ces dates sont
          déjà renseignées et se met à jour tout seul.
        </p>
      </section>
    </div>
  );
}

/* -------------------------------------------------------------- morceaux */

function Ligne({
  evenement,
  t,
  onEditer,
  avecDate = false,
}: {
  evenement: EvenementAgenda;
  t: Classes;
  onEditer: () => void;
  avecDate?: boolean;
}) {
  const s = SOURCES[evenement.source];
  const d = new Date(evenement.debut);
  return (
    <div className="flex flex-wrap items-start gap-3 px-1 py-3">
      <span
        className="mt-0.5 shrink-0 rounded-md border px-2 py-1 text-[11px] font-extrabold"
        style={{ background: s.fond, color: s.texte, borderColor: s.bord }}
      >
        {s.nom}
      </span>
      <div className="min-w-[12rem] flex-1">
        <p className="text-sm font-extrabold" style={{ color: t.encre }}>
          {evenement.titre}
        </p>
        <ul className="mt-1 space-y-0.5 text-[13px]" style={{ color: t.encre, opacity: 0.8 }}>
          <li>
            {avecDate ? `${jourLong(d)} · ` : ''}
            {evenement.journeeEntiere
              ? 'Toute la journée'
              : `${heure(evenement.debut)}${evenement.fin ? ` – ${heure(evenement.fin)}` : ''}`}
          </li>
          {evenement.lieu ? <li>{evenement.lieu}</li> : null}
          {evenement.participants.length ? <li>Avec : {evenement.participants.join(', ')}</li> : null}
          {evenement.detail ? <li>{evenement.detail}</li> : null}
        </ul>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {evenement.lien ? (
          <a
            href={evenement.lien}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[13px] font-bold underline"
            style={{ color: t.plein }}
          >
            Rejoindre
          </a>
        ) : null}
        {evenement.modifiable ? (
          <button type="button" onClick={onEditer} className="text-[13px] font-bold underline" style={{ color: t.plein }}>
            Modifier
          </button>
        ) : evenement.href ? (
          <a href={evenement.href} className="text-[13px] font-bold underline" style={{ color: t.plein }}>
            Ouvrir
          </a>
        ) : null}
      </div>
    </div>
  );
}

function Vide({ t, onAjouter }: { t: Classes; onAjouter: () => void }) {
  return (
    <div className="p-6">
      <p className="text-sm font-extrabold" style={{ color: t.encre }}>
        Rien dans cette période.
      </p>
      <ul className="mt-2 space-y-1 text-[13px]" style={{ color: t.encre, opacity: 0.8 }}>
        <li>· Ajoutez un rendez-vous : il sera visible par toute l’équipe.</li>
        <li>· Les sessions, échéances et clôtures de formulaires arrivent ici toutes seules.</li>
      </ul>
      <button type="button" className={`${t.btnPrimaire} mt-4`} onClick={onAjouter}>
        Ajouter un rendez-vous
      </button>
    </div>
  );
}

interface Brouillon {
  id: string | null;
  titre: string;
  categorie: string;
  debut: string;
  fin: string;
  journeeEntiere: boolean;
  lieu: string;
  lien: string;
  participants: string;
  description: string;
}

function Formulaire({
  t,
  personnes,
  brouillon,
  onChange,
  onAnnuler,
  onEnregistrer,
  onSupprimer,
}: {
  t: Classes;
  personnes: PersonneAgenda[];
  brouillon: Brouillon;
  onChange: (b: Brouillon) => void;
  onAnnuler: () => void;
  onEnregistrer: (b: Brouillon) => Promise<void>;
  onSupprimer: (id: string) => Promise<void>;
}) {
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const maj = (p: Partial<Brouillon>) => onChange({ ...brouillon, ...p });

  const soumettre = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!brouillon.titre.trim()) {
      setErreur('Donnez un titre à ce rendez-vous.');
      return;
    }
    setEnvoi(true);
    setErreur(null);
    try {
      await onEnregistrer(brouillon);
    } catch (err) {
      setErreur(err instanceof Error ? err.message : 'L’enregistrement a échoué.');
    } finally {
      setEnvoi(false);
    }
  };

  const label = 'mb-1 block text-[13px] font-extrabold';

  return (
    <form onSubmit={soumettre} className={`${t.carte} space-y-3 p-5`} aria-label="Rendez-vous">
      <h3 className="text-base font-extrabold" style={{ color: t.encre }}>
        {brouillon.id ? 'Modifier le rendez-vous' : 'Nouveau rendez-vous'}
      </h3>

      <div>
        <label className={label} style={{ color: t.encre }} htmlFor="rdv-titre">
          Titre
        </label>
        <input
          id="rdv-titre"
          className={t.champ}
          value={brouillon.titre}
          onChange={(e) => maj({ titre: e.target.value })}
          maxLength={160}
          required
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className={label} style={{ color: t.encre }} htmlFor="rdv-debut">
            Début
          </label>
          <input
            id="rdv-debut"
            type="datetime-local"
            className={t.champ}
            value={brouillon.debut}
            onChange={(e) => maj({ debut: e.target.value })}
            required
          />
        </div>
        <div>
          <label className={label} style={{ color: t.encre }} htmlFor="rdv-fin">
            Fin <span className="font-normal opacity-70">(facultatif)</span>
          </label>
          <input
            id="rdv-fin"
            type="datetime-local"
            className={t.champ}
            value={brouillon.fin}
            onChange={(e) => maj({ fin: e.target.value })}
          />
        </div>
      </div>

      <label className="flex items-center gap-2 text-[13px] font-bold" style={{ color: t.encre }}>
        <input
          type="checkbox"
          checked={brouillon.journeeEntiere}
          onChange={(e) => maj({ journeeEntiere: e.target.checked })}
        />
        Toute la journée
      </label>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className={label} style={{ color: t.encre }} htmlFor="rdv-categorie">
            Nature
          </label>
          <select
            id="rdv-categorie"
            className={t.champ}
            value={brouillon.categorie}
            onChange={(e) => maj({ categorie: e.target.value })}
          >
            {CATEGORIES.map((c) => (
              <option key={c.valeur} value={c.valeur}>
                {c.libelle}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={label} style={{ color: t.encre }} htmlFor="rdv-lieu">
            Lieu <span className="font-normal opacity-70">(facultatif)</span>
          </label>
          <input
            id="rdv-lieu"
            className={t.champ}
            value={brouillon.lieu}
            onChange={(e) => maj({ lieu: e.target.value })}
            maxLength={200}
          />
        </div>
      </div>

      <div>
        <label className={label} style={{ color: t.encre }} htmlFor="rdv-lien">
          Lien de visioconférence <span className="font-normal opacity-70">(facultatif)</span>
        </label>
        <input
          id="rdv-lien"
          className={t.champ}
          value={brouillon.lien}
          onChange={(e) => maj({ lien: e.target.value })}
          maxLength={500}
          placeholder="https://…"
        />
      </div>

      <ChoixPersonnes
        t={t}
        personnes={personnes}
        valeur={brouillon.participants}
        onChange={(v) => maj({ participants: v })}
      />

      <div>
        <label className={label} style={{ color: t.encre }} htmlFor="rdv-description">
          Notes <span className="font-normal opacity-70">(facultatif)</span>
        </label>
        <textarea
          id="rdv-description"
          className={`${t.champ} min-h-[90px]`}
          value={brouillon.description}
          onChange={(e) => maj({ description: e.target.value })}
          maxLength={4000}
        />
      </div>

      {erreur ? (
        <p className="rounded-xl border border-[#FECACA] bg-[#FEF2F2] px-3 py-2 text-[13px] font-bold text-[#991B1B]">
          {erreur}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <button type="submit" className={t.btnPrimaire} disabled={envoi}>
          {envoi ? 'Enregistrement…' : 'Enregistrer'}
        </button>
        <button type="button" className={t.btnSecondaire} onClick={onAnnuler} disabled={envoi}>
          Annuler
        </button>
        {brouillon.id ? (
          <button
            type="button"
            className="ml-auto text-[13px] font-bold text-[#991B1B] underline"
            disabled={envoi}
            onClick={async () => {
              setEnvoi(true);
              try {
                await onSupprimer(brouillon.id as string);
              } catch (err) {
                setErreur(err instanceof Error ? err.message : 'La suppression a échoué.');
              } finally {
                setEnvoi(false);
              }
            }}
          >
            Retirer de l’agenda
          </button>
        ) : null}
      </div>
    </form>
  );
}

/**
 * QUI EST ATTENDU.
 *
 * Le champ était une ligne de texte à virgules : personne n'écrit deux fois le
 * même nom de la même façon, et « Mme Dubois », « dubois », « Christine D. »
 * finissaient par désigner trois personnes différentes dans une même semaine.
 *
 * On propose donc ce que le compte connaît déjà — l'équipe et, pour une
 * association, son répertoire de contacts — en deux groupes séparés : convier
 * un collègue et convier un partenaire ne sont pas le même geste. La saisie
 * libre reste ouverte à côté, parce qu'on convie aussi la mairie, un parent,
 * ou quelqu'un qui n'aura jamais de compte ici.
 *
 * La valeur reste une chaîne à virgules : c'est le format que le rendez-vous
 * stocke, et le traduire dans les deux sens à chaque frappe coûterait plus que
 * ce que ça rapporte.
 */
function ChoixPersonnes({
  t,
  personnes,
  valeur,
  onChange,
}: {
  t: Classes;
  personnes: PersonneAgenda[];
  valeur: string;
  onChange: (v: string) => void;
}) {
  const choisis = valeur
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean);

  const basculer = (nom: string) => {
    const dedans = choisis.some((c) => c.toLowerCase() === nom.toLowerCase());
    const suite = dedans
      ? choisis.filter((c) => c.toLowerCase() !== nom.toLowerCase())
      : [...choisis, nom];
    onChange(suite.join(', '));
  };

  const groupes: Array<{ cle: PersonneAgenda['groupe']; titre: string }> = [
    { cle: 'EQUIPE', titre: 'Mon équipe' },
    { cle: 'CONTACT', titre: 'Mes contacts' },
  ];

  return (
    <div>
      <span className="mb-1 block text-[13px] font-extrabold" style={{ color: t.encre }}>
        Qui est attendu
      </span>

      {groupes.map((g) => {
        const liste = personnes.filter((p) => p.groupe === g.cle);
        if (!liste.length) return null;
        return (
          <div key={g.cle} className="mb-2">
            <span className="mb-1 block text-[11px] font-bold uppercase tracking-wide" style={{ color: t.encre, opacity: 0.6 }}>
              {g.titre}
            </span>
            <div className="flex flex-wrap gap-1.5">
              {liste.map((p) => {
                const actif = choisis.some((c) => c.toLowerCase() === p.nom.toLowerCase());
                return (
                  <button
                    key={`${g.cle}-${p.nom}`}
                    type="button"
                    onClick={() => basculer(p.nom)}
                    aria-pressed={actif}
                    title={p.detail ?? undefined}
                    className="rounded-full border px-2.5 py-1 text-[12px] font-bold transition"
                    style={
                      actif
                        ? { background: t.plein, borderColor: t.plein, color: '#fff' }
                        : { background: '#fff', borderColor: t.bord, color: t.encre }
                    }
                  >
                    {actif ? '✓ ' : ''}
                    {p.nom}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      <label className="mb-1 mt-2 block text-[12px] font-bold" style={{ color: t.encre, opacity: 0.75 }} htmlFor="rdv-participants">
        Ou quelqu’un d’autre <span className="font-normal">(séparez par des virgules)</span>
      </label>
      <input
        id="rdv-participants"
        className={t.champ}
        value={valeur}
        onChange={(e) => onChange(e.target.value)}
        placeholder="La mairie, les parents de Léa…"
      />
    </div>
  );
}
