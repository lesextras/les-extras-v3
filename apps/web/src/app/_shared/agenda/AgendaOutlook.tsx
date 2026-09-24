'use client';

/**
 * « MON AGENDA », AU NIVEAU D'OUTLOOK (24/09/2026, demande de Siham).
 *
 * Une seule grille pour tout ce qui a une date dans le compte : les
 * rendez-vous notés à la main, les réservations (des deux côtés), les visios,
 * les missions de renfort et les créneaux du planning. À côté du sien, on
 * superpose en couleur les agendas que d'autres personnes nous partagent, au
 * niveau qu'elles ont choisi (voir apps/api/src/partages).
 *
 * Ce que la grille sait faire, comme Outlook :
 *  - cinq vues : jour, semaine de travail, semaine, mois, liste ;
 *  - un clic sur un créneau vide crée un rendez-vous à cette heure-là ;
 *  - un clic sur un événement ouvre sa fiche complète ;
 *  - un rendez-vous modifiable se déplace en le faisant glisser, et
 *    s'allonge ou se raccourcit par son bord bas (pas de 15 minutes) ;
 *  - chaque agenda s'affiche ou se masque, et change de couleur ;
 *  - une recherche filtre la grille ;
 *  - le mini-calendrier de gauche saute à n'importe quel jour.
 *
 * ⚠ Seuls les rendez-vous se modifient ici. Une réservation, une visio ou une
 * mission vivent dans leur écran : la fiche y mène, elle ne les réécrit pas.
 */

import Link from 'next/link';
import type { Route } from 'next';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, Clock, ExternalLink, MapPin, PanelLeft, Plus, Search, Share2, Trash2, Users, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { apiRequest, ApiError } from '@/lib/api';
import { cn } from '@/lib/utils';
import {
  COULEURS,
  F_HEURE,
  F_JOUR_COURT,
  F_JOUR_LONG,
  LIBELLE_CATEGORIE,
  LIBELLE_NIVEAU,
  LIBELLE_SOURCE,
  JOUR_MS,
  MIN_MS,
  ajouterJours,
  arrondir,
  dansLaBande,
  debutDuJour,
  decaler,
  depuisLocal,
  fenetre,
  hexAlpha,
  majuscule,
  memeJour,
  placer,
  plage,
  preparer,
  titrePeriode,
  toucheLeJour,
  versDateLocale,
  versHeureLocale,
  type Evenement,
  type EvenementBrut,
  type Niveau,
  type Vue,
} from './outils';
import { PanneauPartages, type ListePartages, type VuePartage } from './PanneauPartages';

const PX_HEURE = 48;
const PX_MIN = PX_HEURE / 60;
const CLE_PREFS = 'lesextras_agenda_prefs';

interface CalPartage extends VuePartage {
  evenements: EvenementBrut[];
}

interface Prefs {
  vue: Vue;
  couleurMoi: string;
  moiVisible: boolean;
}

interface Edition {
  mode: 'creer' | 'modifier';
  agenda: string;
  rendezVousId?: string;
  titre: string;
  date: string;
  heureDebut: string;
  heureFin: string;
  journeeEntiere: boolean;
  lieu: string;
  lien: string;
  categorie: string;
  participants: string;
  description: string;
  rappelMinutes: string;
}

interface Glisse {
  id: string;
  mode: 'deplacer' | 'etirer';
  x0: number;
  y0: number;
  debut0: Date;
  fin0: Date;
  jourIndex0: number;
  bouge: boolean;
}

function lirePrefs(): Prefs {
  const defaut: Prefs = { vue: 'semaine', couleurMoi: COULEURS[0], moiVisible: true };
  try {
    const brut = typeof window !== 'undefined' ? window.localStorage.getItem(CLE_PREFS) : null;
    if (!brut) return defaut;
    return { ...defaut, ...(JSON.parse(brut) as Partial<Prefs>) };
  } catch {
    return defaut;
  }
}

function ecrirePrefs(p: Prefs) {
  try {
    window.localStorage.setItem(CLE_PREFS, JSON.stringify(p));
  } catch {
    /* navigation privée : on garde les réglages le temps de la visite */
  }
}

export function AgendaOutlook({ prenom, ongletInitial = 'calendrier' }: { prenom?: string | null; ongletInitial?: 'calendrier' | 'partages' }) {
  const { toast } = useToast();
  const [onglet, setOnglet] = useState<'calendrier' | 'partages'>(ongletInitial);
  const [prefs, setPrefs] = useState<Prefs>({ vue: 'semaine', couleurMoi: COULEURS[0], moiVisible: true });
  const [ref, setRef] = useState<Date>(() => debutDuJour(new Date()));
  const [propres, setPropres] = useState<EvenementBrut[]>([]);
  const [partages, setPartages] = useState<CalPartage[]>([]);
  const [liste, setListe] = useState<ListePartages | null>(null);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);
  const [recherche, setRecherche] = useState('');
  const [selection, setSelection] = useState<Evenement | null>(null);
  const [edition, setEdition] = useState<Edition | null>(null);
  const [enregistrement, setEnregistrement] = useState(false);
  const [offresDe, setOffresDe] = useState<VuePartage | null>(null);
  const [gaucheOuverte, setGaucheOuverte] = useState(false);
  const [apercu, setApercu] = useState<{ id: string; debut: Date; fin: Date } | null>(null);
  const [maintenant, setMaintenant] = useState(() => new Date());
  const [focusPartage, setFocusPartage] = useState<'inviter' | 'demander' | null>(null);

  const vue = prefs.vue;
  const { jours, du, au } = useMemo(() => fenetre(vue, ref), [vue, ref]);

  // Préférences propres à ce navigateur (vue, couleur de son agenda).
  useEffect(() => {
    const p = lirePrefs();
    // Sur un téléphone, la semaine ne tient pas : on ouvre sur le jour.
    if (typeof window !== 'undefined' && window.innerWidth < 640 && (p.vue === 'semaine' || p.vue === 'semaineTravail')) p.vue = 'jour';
    setPrefs(p);
  }, []);
  const changerPrefs = (maj: Partial<Prefs>) =>
    setPrefs((p) => {
      const n = { ...p, ...maj };
      ecrirePrefs(n);
      return n;
    });

  useEffect(() => {
    const t = window.setInterval(() => setMaintenant(new Date()), 60_000);
    return () => window.clearInterval(t);
  }, []);

  const charger = useCallback(async () => {
    setChargement(true);
    setErreur(null);
    const q = `du=${encodeURIComponent(du.toISOString())}&au=${encodeURIComponent(au.toISOString())}`;
    try {
      const [a, b, c] = await Promise.all([
        apiRequest<EvenementBrut[]>(`/agenda?${q}`),
        apiRequest<CalPartage[]>(`/partages/calendrier?${q}`).catch(() => [] as CalPartage[]),
        apiRequest<ListePartages>('/partages').catch(() => null),
      ]);
      setPropres(a ?? []);
      setPartages(b ?? []);
      setListe(c);
    } catch (e) {
      setErreur(e instanceof ApiError ? e.message : 'L’agenda ne répond pas pour le moment.');
    } finally {
      setChargement(false);
    }
  }, [du, au]);

  useEffect(() => {
    void charger();
  }, [charger]);

  /* ------------------------------------------------ les événements visibles */

  const evenements = useMemo(() => {
    const tous: Evenement[] = [];
    if (prefs.moiVisible) for (const b of propres) tous.push(preparer(b, 'moi', prefs.couleurMoi, 'Mon agenda'));
    for (const p of partages) {
      if (!p.visible) continue;
      const nom = p.compte?.nom ?? p.titulaire?.nom ?? 'Agenda partagé';
      for (const b of p.evenements) tous.push(preparer(b, p.id, p.couleur, nom));
    }
    const q = recherche.trim().toLowerCase();
    const filtres = q
      ? tous.filter((e) => [e.titre, e.lieu, e.detail, e.nomAgenda].some((t) => t?.toLowerCase().includes(q)))
      : tous;
    return filtres
      .map((e) => (apercu && apercu.id === e.id ? { ...e, debut: apercu.debut, fin: apercu.fin } : e))
      .sort((a, b) => a.debut.getTime() - b.debut.getTime());
  }, [propres, partages, prefs.moiVisible, prefs.couleurMoi, recherche, apercu]);

  const partagesModifiables = partages.filter((p) => p.niveau === 'MODIFICATION');
  const enAttente = (liste?.invitationsRecues.length ?? 0) + (liste?.demandesRecues.length ?? 0);

  /* ------------------------------------------------------------ écriture */

  const ouvrirCreation = (debut: Date, fin?: Date, journee = false, agenda = 'moi') => {
    const f = fin ?? new Date(debut.getTime() + 60 * MIN_MS);
    setEdition({
      mode: 'creer',
      agenda,
      titre: '',
      date: versDateLocale(debut),
      heureDebut: versHeureLocale(debut),
      heureFin: versHeureLocale(f),
      journeeEntiere: journee,
      lieu: '',
      lien: '',
      categorie: 'RENDEZ_VOUS',
      participants: '',
      description: '',
      rappelMinutes: '',
    });
  };

  const ouvrirModification = (e: Evenement) => {
    if (!e.rendezVousId) return;
    setSelection(null);
    setEdition({
      mode: 'modifier',
      agenda: e.agenda,
      rendezVousId: e.rendezVousId,
      titre: e.titre,
      date: versDateLocale(e.debut),
      heureDebut: versHeureLocale(e.debut),
      heureFin: versHeureLocale(e.fin),
      journeeEntiere: e.journeeEntiere,
      lieu: e.lieu ?? '',
      lien: e.lien ?? '',
      categorie: e.categorie ?? 'RENDEZ_VOUS',
      participants: e.participants.join(', '),
      description: e.detail ?? '',
      rappelMinutes: '',
    });
  };

  const cheminRdv = (agenda: string, rendezVousId?: string) =>
    agenda === 'moi'
      ? `/agenda${rendezVousId ? `/${rendezVousId}` : ''}`
      : `/partages/${agenda}/rendez-vous${rendezVousId ? `/${rendezVousId}` : ''}`;

  const enregistrer = async () => {
    if (!edition) return;
    if (edition.titre.trim().length < 2) {
      toast({ title: 'Donnez un titre à ce rendez-vous.', variant: 'error' });
      return;
    }
    const debut = depuisLocal(edition.date, edition.journeeEntiere ? '00:00' : edition.heureDebut);
    let fin = edition.journeeEntiere ? null : depuisLocal(edition.date, edition.heureFin);
    if (fin && fin <= debut) fin = new Date(debut.getTime() + 60 * MIN_MS);
    const corps = {
      titre: edition.titre.trim(),
      debut: debut.toISOString(),
      fin: fin ? fin.toISOString() : undefined,
      journeeEntiere: edition.journeeEntiere,
      lieu: edition.lieu.trim() || undefined,
      lien: edition.lien.trim() || undefined,
      categorie: edition.categorie,
      participants: edition.participants.split(',').map((p) => p.trim()).filter(Boolean),
      description: edition.description.trim() || undefined,
      rappelMinutes: edition.rappelMinutes ? Number(edition.rappelMinutes) : undefined,
    };
    setEnregistrement(true);
    try {
      await apiRequest(cheminRdv(edition.agenda, edition.mode === 'modifier' ? edition.rendezVousId : undefined), {
        method: edition.mode === 'creer' ? 'POST' : 'PATCH',
        body: corps,
      });
      toast({ title: edition.mode === 'creer' ? 'Rendez-vous ajouté' : 'Rendez-vous modifié', variant: 'success' });
      setEdition(null);
      await charger();
    } catch (e) {
      toast({ title: e instanceof ApiError ? e.message : 'Enregistrement impossible.', variant: 'error' });
    } finally {
      setEnregistrement(false);
    }
  };

  const supprimer = async (e: Evenement) => {
    if (!e.rendezVousId) return;
    if (!window.confirm(`Supprimer « ${e.titre} » ?`)) return;
    try {
      await apiRequest(cheminRdv(e.agenda, e.rendezVousId), { method: 'DELETE' });
      toast({ title: 'Rendez-vous supprimé', variant: 'success' });
      setSelection(null);
      await charger();
    } catch (err) {
      toast({ title: err instanceof ApiError ? err.message : 'Suppression impossible.', variant: 'error' });
    }
  };

  const deplacer = async (e: Evenement, debut: Date, fin: Date) => {
    if (!e.rendezVousId) return;
    try {
      await apiRequest(cheminRdv(e.agenda, e.rendezVousId), {
        method: 'PATCH',
        body: { debut: debut.toISOString(), fin: fin.toISOString() },
      });
      toast({ title: `« ${e.titre} » déplacé au ${F_JOUR_LONG.format(debut)}, ${F_HEURE.format(debut)}` });
      await charger();
    } catch (err) {
      toast({ title: err instanceof ApiError ? err.message : 'Déplacement impossible.', variant: 'error' });
    } finally {
      setApercu(null);
    }
  };

  const reglerPartage = async (p: VuePartage, maj: { couleur?: string; visible?: boolean }) => {
    setPartages((liste) => liste.map((x) => (x.id === p.id ? { ...x, ...maj } : x)));
    try {
      await apiRequest(`/partages/${p.id}/affichage`, { method: 'PATCH', body: maj });
    } catch {
      /* l'affichage local suffit ; il se resynchronise au prochain chargement */
    }
  };

  /* ------------------------------------------------------------- rendu */

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 border-b border-border">
        {(['calendrier', 'partages'] as const).map((o) => (
          <button
            key={o}
            type="button"
            onClick={() => setOnglet(o)}
            aria-pressed={onglet === o}
            className={cn(
              '-mb-px inline-flex items-center gap-2 border-b-2 px-3 py-2.5 text-sm font-semibold transition',
              onglet === o ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            {o === 'calendrier' ? <CalendarDays className="size-4" aria-hidden /> : <Share2 className="size-4" aria-hidden />}
            {o === 'calendrier' ? 'Calendrier' : 'Partages'}
            {o === 'partages' && enAttente > 0 ? (
              <span className="rounded-full bg-primary px-1.5 py-0.5 text-[11px] leading-none text-primary-foreground">{enAttente}</span>
            ) : null}
          </button>
        ))}
      </div>

      {onglet === 'partages' ? (
        <PanneauPartages
          liste={liste}
          focus={focusPartage}
          onChange={async () => {
            setFocusPartage(null);
            await charger();
          }}
          onVoirOffres={(p) => setOffresDe(p)}
        />
      ) : (
        <>
          {enAttente > 0 ? (
            <button
              type="button"
              onClick={() => setOnglet('partages')}
              className="flex w-full items-center gap-2 rounded-xl border border-primary/30 bg-primary-soft px-4 py-2.5 text-left text-sm font-medium text-foreground"
            >
              <Share2 className="size-4 text-primary" aria-hidden />
              {enAttente === 1 ? 'Une demande de partage attend votre réponse.' : `${enAttente} demandes de partage attendent votre réponse.`}
              <span className="ml-auto text-primary">Répondre</span>
            </button>
          ) : null}

          {/* Barre d'outils, comme le ruban d'Outlook */}
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" onClick={() => ouvrirCreation(prochaineDemiHeure(ref))}>
              <Plus aria-hidden /> Nouveau rendez-vous
            </Button>
            <Button size="sm" variant="outline" className="lg:hidden" onClick={() => setGaucheOuverte((v) => !v)} aria-expanded={gaucheOuverte}>
              <PanelLeft aria-hidden /> Agendas
            </Button>
            <Button size="sm" variant="outline" onClick={() => setRef(debutDuJour(new Date()))}>
              Aujourd’hui
            </Button>
            <div className="flex items-center">
              <Button size="icon" variant="ghost" aria-label="Période précédente" onClick={() => setRef((r) => decaler(vue, r, -1))}>
                <ChevronLeft aria-hidden />
              </Button>
              <Button size="icon" variant="ghost" aria-label="Période suivante" onClick={() => setRef((r) => decaler(vue, r, 1))}>
                <ChevronRight aria-hidden />
              </Button>
            </div>
            <h2 className="mr-auto text-base font-semibold text-foreground sm:text-lg" aria-live="polite">
              {titrePeriode(vue, ref)}
            </h2>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
              <Input
                value={recherche}
                onChange={(e) => setRecherche(e.target.value)}
                placeholder="Rechercher"
                aria-label="Rechercher dans l’agenda"
                className="h-10 w-40 pl-9 sm:w-52"
              />
            </div>
            <div className="flex overflow-hidden rounded-lg border border-border" role="group" aria-label="Affichage">
              {(
                [
                  ['jour', 'Jour'],
                  ['semaineTravail', 'Semaine de travail'],
                  ['semaine', 'Semaine'],
                  ['mois', 'Mois'],
                  ['liste', 'Liste'],
                ] as const
              ).map(([v, l]) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => changerPrefs({ vue: v })}
                  aria-pressed={vue === v}
                  className={cn(
                    'px-3 py-2 text-[13px] font-semibold transition',
                    v === 'semaineTravail' && 'hidden md:block',
                    vue === v ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground hover:bg-accent hover:text-foreground',
                  )}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-4">
            {gaucheOuverte ? (
              <button type="button" aria-label="Fermer le volet des agendas" className="fixed inset-0 z-30 bg-black/30 lg:hidden" onClick={() => setGaucheOuverte(false)} />
            ) : null}
            {/* Volet de gauche : mini-calendrier et liste des agendas */}
            <aside
              className={cn(
                'w-64 shrink-0 space-y-5',
                gaucheOuverte ? 'fixed inset-y-0 left-0 z-40 overflow-y-auto border-r border-border bg-background p-4 shadow-xl' : 'hidden',
                'lg:static lg:block lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none',
              )}
            >
              <MiniMois
                ref0={ref}
                jours={jours}
                onChoisir={(d) => {
                  setRef(d);
                  setGaucheOuverte(false);
                }}
              />

              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Mes agendas</p>
                <LigneAgenda
                  nom={prenom ? `Mon agenda (${prenom})` : 'Mon agenda'}
                  couleur={prefs.couleurMoi}
                  visible={prefs.moiVisible}
                  onVisible={(v) => changerPrefs({ moiVisible: v })}
                  onCouleur={(c) => changerPrefs({ couleurMoi: c })}
                />
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Agendas partagés avec moi</p>
                {partages.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Aucun pour l’instant.</p>
                ) : (
                  partages.map((p) => (
                    <LigneAgenda
                      key={p.id}
                      nom={p.compte?.nom ?? p.titulaire?.nom ?? 'Agenda partagé'}
                      sousTitre={`${p.titulaire?.nom ?? ''}${p.titulaire?.nom ? ' · ' : ''}${LIBELLE_NIVEAU[p.niveau]}`}
                      couleur={p.couleur}
                      visible={p.visible}
                      onVisible={(v) => reglerPartage(p, { visible: v })}
                      onCouleur={(c) => reglerPartage(p, { couleur: c })}
                      onOffres={() => setOffresDe(p)}
                    />
                  ))
                )}
              </div>

              <div className="grid gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setFocusPartage('inviter');
                    setOnglet('partages');
                  }}
                >
                  <Share2 aria-hidden /> Partager mon agenda
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setFocusPartage('demander');
                    setOnglet('partages');
                  }}
                >
                  <Users aria-hidden /> Ouvrir un autre agenda
                </Button>
              </div>
              {gaucheOuverte ? (
                <Button size="sm" variant="ghost" className="w-full lg:hidden" onClick={() => setGaucheOuverte(false)}>
                  Fermer
                </Button>
              ) : null}
            </aside>

            <section className="min-w-0 flex-1" aria-busy={chargement}>
              {erreur ? (
                <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm">
                  {erreur}{' '}
                  <button type="button" className="font-semibold text-primary underline" onClick={() => void charger()}>
                    Réessayer
                  </button>
                </div>
              ) : null}

              {vue === 'mois' ? (
                <VueMois
                  jours={jours}
                  mois={ref.getMonth()}
                  evenements={evenements}
                  maintenant={maintenant}
                  onOuvrir={setSelection}
                  onCreer={(d) => ouvrirCreation(new Date(d.getFullYear(), d.getMonth(), d.getDate(), 9, 0))}
                  onVoirJour={(d) => {
                    setRef(d);
                    changerPrefs({ vue: 'jour' });
                  }}
                  onDeposer={(e, jour) => {
                    const decalage = debutDuJour(jour).getTime() - debutDuJour(e.debut).getTime();
                    if (decalage) void deplacer(e, new Date(e.debut.getTime() + decalage), new Date(e.fin.getTime() + decalage));
                  }}
                />
              ) : vue === 'liste' ? (
                <VueListe jours={jours} evenements={evenements} onOuvrir={setSelection} chargement={chargement} />
              ) : (
                <VueGrille
                  jours={jours}
                  evenements={evenements}
                  maintenant={maintenant}
                  onOuvrir={setSelection}
                  onCreer={(d) => ouvrirCreation(d)}
                  onApercu={setApercu}
                  onDeposer={(e, debut, fin) => void deplacer(e, debut, fin)}
                />
              )}
            </section>
          </div>
        </>
      )}

      {/* Fiche d'un événement */}
      <Dialog open={Boolean(selection)} onOpenChange={(o) => !o && setSelection(null)}>
        <DialogContent className="max-w-lg">
          {selection ? (
            <FicheEvenement
              e={selection}
              onModifier={() => ouvrirModification(selection)}
              onSupprimer={() => void supprimer(selection)}
            />
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Création et modification */}
      <Dialog open={Boolean(edition)} onOpenChange={(o) => !o && setEdition(null)}>
        <DialogContent className="max-w-xl">
          {edition ? (
            <FormulaireRendezVous
              edition={edition}
              setEdition={setEdition}
              agendas={[{ id: 'moi', nom: 'Mon agenda', couleur: prefs.couleurMoi }, ...partagesModifiables.map((p) => ({ id: p.id, nom: p.compte?.nom ?? 'Agenda partagé', couleur: p.couleur }))]}
              enregistrement={enregistrement}
              onEnregistrer={() => void enregistrer()}
              onAnnuler={() => setEdition(null)}
            />
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Les offres de services d'un agenda partagé */}
      <Dialog open={Boolean(offresDe)} onOpenChange={(o) => !o && setOffresDe(null)}>
        <DialogContent className="max-w-2xl">{offresDe ? <OffresDuPartage partage={offresDe} /> : null}</DialogContent>
      </Dialog>
    </div>
  );
}

function prochaineDemiHeure(jour: Date): Date {
  const now = new Date();
  const base = memeJour(jour, now) ? now : new Date(jour.getFullYear(), jour.getMonth(), jour.getDate(), 9, 0);
  const m = Math.ceil((base.getHours() * 60 + base.getMinutes()) / 30) * 30;
  return new Date(base.getFullYear(), base.getMonth(), base.getDate(), Math.floor(m / 60), m % 60);
}

/* ================================================================ volet */

function MiniMois({ ref0, jours, onChoisir }: { ref0: Date; jours: Date[]; onChoisir: (d: Date) => void }) {
  const [mois, setMois] = useState(() => new Date(ref0.getFullYear(), ref0.getMonth(), 1));
  useEffect(() => setMois(new Date(ref0.getFullYear(), ref0.getMonth(), 1)), [ref0]);
  const grille = fenetre('mois', mois).jours;
  const aujourdhui = new Date();
  const actifs = new Set(jours.map((d) => versDateLocale(d)));
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <div className="mb-2 flex items-center justify-between">
        <button type="button" className="rounded p-1 hover:bg-accent" aria-label="Mois précédent" onClick={() => setMois(new Date(mois.getFullYear(), mois.getMonth() - 1, 1))}>
          <ChevronLeft className="size-4" aria-hidden />
        </button>
        <span className="text-sm font-semibold">{majuscule(new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(mois))}</span>
        <button type="button" className="rounded p-1 hover:bg-accent" aria-label="Mois suivant" onClick={() => setMois(new Date(mois.getFullYear(), mois.getMonth() + 1, 1))}>
          <ChevronRight className="size-4" aria-hidden />
        </button>
      </div>
      <div className="grid grid-cols-7 text-center text-[11px] text-muted-foreground">
        {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((j, i) => (
          <span key={i} className="py-1">
            {j}
          </span>
        ))}
        {grille.map((d) => (
          <button
            key={d.toISOString()}
            type="button"
            onClick={() => onChoisir(d)}
            className={cn(
              'm-0.5 rounded-md py-1 text-xs transition hover:bg-accent',
              d.getMonth() !== mois.getMonth() && 'text-muted-foreground/50',
              actifs.has(versDateLocale(d)) && 'bg-primary-soft font-semibold text-foreground',
              memeJour(d, aujourdhui) && 'bg-primary font-bold text-primary-foreground hover:bg-primary',
            )}
            aria-label={F_JOUR_LONG.format(d)}
          >
            {d.getDate()}
          </button>
        ))}
      </div>
    </div>
  );
}

function LigneAgenda({
  nom,
  sousTitre,
  couleur,
  visible,
  onVisible,
  onCouleur,
  onOffres,
}: {
  nom: string;
  sousTitre?: string;
  couleur: string;
  visible: boolean;
  onVisible: (v: boolean) => void;
  onCouleur: (c: string) => void;
  onOffres?: () => void;
}) {
  const [palette, setPalette] = useState(false);
  return (
    <div className="rounded-lg px-1 py-1 hover:bg-accent/60">
      <div className="flex items-start gap-2">
        <input
          type="checkbox"
          checked={visible}
          onChange={(e) => onVisible(e.target.checked)}
          aria-label={`Afficher ${nom}`}
          className="mt-1 size-4 shrink-0 cursor-pointer rounded"
          style={{ accentColor: couleur }}
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground">{nom}</p>
          {sousTitre ? <p className="truncate text-xs text-muted-foreground">{sousTitre}</p> : null}
          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs">
            <button type="button" className="text-muted-foreground hover:text-foreground" onClick={() => setPalette((v) => !v)} aria-expanded={palette}>
              Couleur
            </button>
            {onOffres ? (
              <button type="button" className="text-muted-foreground hover:text-foreground" onClick={onOffres}>
                Ses services
              </button>
            ) : null}
          </div>
          {palette ? (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {COULEURS.map((c) => (
                <button
                  key={c}
                  type="button"
                  aria-label={`Couleur ${c}`}
                  onClick={() => {
                    onCouleur(c);
                    setPalette(false);
                  }}
                  className={cn('size-5 rounded-full ring-offset-2 ring-offset-background', c === couleur && 'ring-2 ring-foreground')}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/* ======================================================== vue en grille */

function VueGrille({
  jours,
  evenements,
  maintenant,
  onOuvrir,
  onCreer,
  onApercu,
  onDeposer,
}: {
  jours: Date[];
  evenements: Evenement[];
  maintenant: Date;
  onOuvrir: (e: Evenement) => void;
  onCreer: (d: Date) => void;
  onApercu: (a: { id: string; debut: Date; fin: Date } | null) => void;
  onDeposer: (e: Evenement, debut: Date, fin: Date) => void;
}) {
  const defilement = useRef<HTMLDivElement | null>(null);
  const colonnes = useRef<HTMLDivElement | null>(null);
  const glisse = useRef<Glisse | null>(null);
  const [actif, setActif] = useState<string | null>(null);

  useEffect(() => {
    // On ouvre sur la matinée, comme Outlook, sans cacher la nuit.
    if (defilement.current) defilement.current.scrollTop = 7 * PX_HEURE;
  }, []);

  const bande = jours.map((j) => evenements.filter((e) => dansLaBande(e) && toucheLeJour(e, j)));
  const aBande = bande.some((b) => b.length > 0);

  const surPointeurBas = (ev: React.PointerEvent, e: Evenement, mode: Glisse['mode'], jourIndex: number) => {
    if (!e.modifiable || !e.rendezVousId) return;
    ev.stopPropagation();
    (ev.target as HTMLElement).setPointerCapture?.(ev.pointerId);
    glisse.current = { id: e.id, mode, x0: ev.clientX, y0: ev.clientY, debut0: e.debut, fin0: e.fin, jourIndex0: jourIndex, bouge: false };
    setActif(e.id);
  };

  const calculer = (ev: React.PointerEvent) => {
    const g = glisse.current;
    const zone = colonnes.current;
    if (!g || !zone) return null;
    const dy = ev.clientY - g.y0;
    const dx = ev.clientX - g.x0;
    if (!g.bouge && Math.hypot(dx, dy) < 5) return null;
    g.bouge = true;
    const largeur = zone.getBoundingClientRect().width / jours.length;
    const dJours = g.mode === 'deplacer' ? Math.round(dx / largeur) : 0;
    const dMin = arrondir(dy / PX_MIN);
    if (g.mode === 'deplacer') {
      const decal = dJours * JOUR_MS + dMin * MIN_MS;
      return { debut: new Date(g.debut0.getTime() + decal), fin: new Date(g.fin0.getTime() + decal) };
    }
    const fin = new Date(Math.max(g.debut0.getTime() + 15 * MIN_MS, g.fin0.getTime() + dMin * MIN_MS));
    return { debut: g.debut0, fin };
  };

  const surPointeurBouge = (ev: React.PointerEvent) => {
    const r = calculer(ev);
    if (r && glisse.current) onApercu({ id: glisse.current.id, ...r });
  };

  const surPointeurHaut = (ev: React.PointerEvent, e: Evenement) => {
    const g = glisse.current;
    glisse.current = null;
    setActif(null);
    if (!g) return;
    if (!g.bouge) {
      onApercu(null);
      onOuvrir(e);
      return;
    }
    glisse.current = g;
    const r = calculer(ev) ?? { debut: g.debut0, fin: g.fin0 };
    glisse.current = null;
    if (r.debut.getTime() === g.debut0.getTime() && r.fin.getTime() === g.fin0.getTime()) {
      onApercu(null);
      return;
    }
    onDeposer(e, r.debut, r.fin);
  };

  const heures = Array.from({ length: 24 }, (_, h) => h);

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      {/* En-têtes des jours */}
      <div className="flex border-b border-border">
        <div className="w-14 shrink-0" />
        <div className="grid flex-1" style={{ gridTemplateColumns: `repeat(${jours.length}, minmax(0, 1fr))` }}>
          {jours.map((j) => {
            const auj = memeJour(j, maintenant);
            return (
              <div key={j.toISOString()} className="border-l border-border px-2 py-2 text-center">
                <p className={cn('text-xs font-semibold uppercase tracking-wide', auj ? 'text-primary' : 'text-muted-foreground')}>
                  {new Intl.DateTimeFormat('fr-FR', { weekday: jours.length > 1 ? 'short' : 'long' }).format(j)}
                </p>
                <p className={cn('mx-auto mt-0.5 flex size-8 items-center justify-center rounded-full text-lg font-semibold', auj && 'bg-primary text-primary-foreground')}>
                  {j.getDate()}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bande des journées entières et des événements sur plusieurs jours */}
      {aBande ? (
        <div className="flex border-b border-border bg-muted/30">
          <div className="flex w-14 shrink-0 items-start justify-end px-1 pt-1.5 text-[10px] text-muted-foreground">Journée</div>
          <div className="grid flex-1" style={{ gridTemplateColumns: `repeat(${jours.length}, minmax(0, 1fr))` }}>
            {bande.map((liste, i) => (
              <div key={i} className="min-h-8 space-y-1 border-l border-border p-1">
                {liste.map((e) => (
                  <button
                    key={e.id}
                    type="button"
                    onClick={() => onOuvrir(e)}
                    className="block w-full truncate rounded px-1.5 py-0.5 text-left text-xs font-medium text-foreground"
                    style={{ backgroundColor: hexAlpha(e.couleur, 0.18), borderLeft: `3px solid ${e.couleur}` }}
                  >
                    {e.titre}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* La grille horaire */}
      <div ref={defilement} className="relative overflow-y-auto" style={{ height: 'min(70vh, 720px)' }}>
        <div className="flex" style={{ height: 24 * PX_HEURE }}>
          <div className="relative w-14 shrink-0">
            {heures.map((h) => (
              <span key={h} className="absolute right-2 -translate-y-1/2 text-[11px] text-muted-foreground" style={{ top: h * PX_HEURE }}>
                {h === 0 ? '' : `${String(h).padStart(2, '0')}:00`}
              </span>
            ))}
          </div>
          <div ref={colonnes} className="relative grid flex-1" style={{ gridTemplateColumns: `repeat(${jours.length}, minmax(0, 1fr))` }}>
            {jours.map((jour, ji) => {
              const places = placer(evenements, jour);
              const auj = memeJour(jour, maintenant);
              const minutesMaintenant = maintenant.getHours() * 60 + maintenant.getMinutes();
              return (
                <div
                  key={jour.toISOString()}
                  className={cn('relative border-l border-border', auj && 'bg-primary/[0.03]')}
                  onClick={(ev) => {
                    if (ev.target !== ev.currentTarget) return;
                    const rect = (ev.currentTarget as HTMLDivElement).getBoundingClientRect();
                    const m = Math.floor((ev.clientY - rect.top) / PX_MIN / 30) * 30;
                    onCreer(new Date(jour.getFullYear(), jour.getMonth(), jour.getDate(), Math.floor(m / 60), m % 60));
                  }}
                  role="presentation"
                >
                  {heures.map((h) => (
                    <div key={h} className="pointer-events-none absolute inset-x-0 border-t border-border/70" style={{ top: h * PX_HEURE }}>
                      <div className="absolute inset-x-0 border-t border-dashed border-border/40" style={{ top: PX_HEURE / 2 }} />
                    </div>
                  ))}
                  {auj ? (
                    <div className="pointer-events-none absolute inset-x-0 z-20" style={{ top: minutesMaintenant * PX_MIN }}>
                      <div className="absolute -left-1.5 -top-1.5 size-3 rounded-full bg-red-500" />
                      <div className="border-t-2 border-red-500" />
                    </div>
                  ) : null}
                  {places.map((p) => {
                    const hauteur = Math.max(20, (p.bas - p.haut) * PX_MIN);
                    const court = hauteur < 38;
                    const e = p.e;
                    return (
                      <div
                        key={e.id}
                        role="button"
                        tabIndex={0}
                        aria-label={`${e.titre}, ${plage(e)}, ${e.nomAgenda}`}
                        onKeyDown={(k) => {
                          if (k.key === 'Enter' || k.key === ' ') {
                            k.preventDefault();
                            onOuvrir(e);
                          }
                        }}
                        onPointerDown={(ev) => surPointeurBas(ev, e, 'deplacer', ji)}
                        onPointerMove={surPointeurBouge}
                        onPointerUp={(ev) => (glisse.current ? surPointeurHaut(ev, e) : onOuvrir(e))}
                        className={cn(
                          'absolute z-10 select-none overflow-hidden rounded-md px-1.5 py-0.5 text-left text-xs leading-tight text-foreground shadow-sm transition-shadow hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                          e.modifiable ? 'cursor-grab' : 'cursor-pointer',
                          actif === e.id && 'cursor-grabbing opacity-90 shadow-lg ring-2 ring-foreground/30',
                        )}
                        style={{
                          top: p.haut * PX_MIN,
                          height: hauteur,
                          left: `calc(${(p.colonne / p.colonnes) * 100}% + 2px)`,
                          width: `calc(${100 / p.colonnes}% - 4px)`,
                          backgroundColor: hexAlpha(e.couleur, e.source === 'OCCUPE' ? 0.28 : 0.16),
                          borderLeft: `3px solid ${e.couleur}`,
                        }}
                      >
                        <p className={cn('font-semibold', court ? 'truncate' : 'line-clamp-2')}>
                          {court ? `${F_HEURE.format(e.debut)} ${e.titre}` : e.titre}
                        </p>
                        {!court ? (
                          <p className="truncate text-[11px] text-muted-foreground">
                            {F_HEURE.format(e.debut)} à {F_HEURE.format(e.fin)}
                            {e.lieu ? ` · ${e.lieu}` : ''}
                          </p>
                        ) : null}
                        {!court && e.agenda !== 'moi' ? <p className="truncate text-[10px] text-muted-foreground">{e.nomAgenda}</p> : null}
                        {e.modifiable ? (
                          <span
                            aria-hidden
                            onPointerDown={(ev) => surPointeurBas(ev, e, 'etirer', ji)}
                            className="absolute inset-x-0 bottom-0 h-2 cursor-ns-resize"
                          />
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <p className="border-t border-border px-3 py-2 text-[11px] text-muted-foreground">
        Cliquez sur un créneau libre pour ajouter un rendez-vous. Faites glisser un rendez-vous pour le déplacer, ou son bord bas pour changer sa durée.
      </p>
    </div>
  );
}

/* ============================================================= vue mois */

function VueMois({
  jours,
  mois,
  evenements,
  maintenant,
  onOuvrir,
  onCreer,
  onVoirJour,
  onDeposer,
}: {
  jours: Date[];
  mois: number;
  evenements: Evenement[];
  maintenant: Date;
  onOuvrir: (e: Evenement) => void;
  onCreer: (d: Date) => void;
  onVoirJour: (d: Date) => void;
  onDeposer: (e: Evenement, jour: Date) => void;
}) {
  const [survol, setSurvol] = useState<string | null>(null);
  const glisse = useRef<Evenement | null>(null);
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="grid grid-cols-7 border-b border-border">
        {['lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.', 'dim.'].map((j) => (
          <p key={j} className="px-2 py-2 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {j}
          </p>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {jours.map((d) => {
          const k = versDateLocale(d);
          const liste = evenements.filter((e) => toucheLeJour(e, d));
          const visibles = liste.slice(0, 3);
          const auj = memeJour(d, maintenant);
          return (
            <div
              key={k}
              className={cn(
                'min-h-28 border-b border-l border-border p-1.5 transition-colors',
                d.getMonth() !== mois && 'bg-muted/30',
                survol === k && 'bg-primary-soft',
              )}
              onClick={(ev) => {
                if (ev.target === ev.currentTarget) onCreer(d);
              }}
              onDragOver={(ev) => {
                if (!glisse.current) return;
                ev.preventDefault();
                setSurvol(k);
              }}
              onDragLeave={() => setSurvol((v) => (v === k ? null : v))}
              onDrop={(ev) => {
                ev.preventDefault();
                setSurvol(null);
                if (glisse.current) onDeposer(glisse.current, d);
                glisse.current = null;
              }}
              role="presentation"
            >
              <button
                type="button"
                onClick={() => onVoirJour(d)}
                className={cn(
                  'mb-1 flex size-7 items-center justify-center rounded-full text-sm font-semibold hover:bg-accent',
                  d.getMonth() !== mois && 'text-muted-foreground/60',
                  auj && 'bg-primary text-primary-foreground hover:bg-primary',
                )}
                aria-label={`Voir le ${F_JOUR_LONG.format(d)}`}
              >
                {d.getDate()}
              </button>
              <div className="space-y-1">
                {visibles.map((e) => (
                  <button
                    key={e.id}
                    type="button"
                    draggable={e.modifiable}
                    onDragStart={() => {
                      glisse.current = e;
                    }}
                    onDragEnd={() => {
                      glisse.current = null;
                      setSurvol(null);
                    }}
                    onClick={() => onOuvrir(e)}
                    className="flex w-full items-center gap-1 truncate rounded px-1 py-0.5 text-left text-[11px] text-foreground hover:bg-accent"
                    style={dansLaBande(e) ? { backgroundColor: hexAlpha(e.couleur, 0.18) } : undefined}
                    title={`${e.titre}, ${plage(e)}`}
                  >
                    <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: e.couleur }} />
                    {!dansLaBande(e) ? <span className="shrink-0 text-muted-foreground">{F_HEURE.format(e.debut)}</span> : null}
                    <span className="truncate font-medium">{e.titre}</span>
                  </button>
                ))}
                {liste.length > 3 ? (
                  <button type="button" onClick={() => onVoirJour(d)} className="px-1 text-[11px] font-semibold text-primary hover:underline">
                    {liste.length - 3} de plus
                  </button>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ============================================================ vue liste */

function VueListe({ jours, evenements, onOuvrir, chargement }: { jours: Date[]; evenements: Evenement[]; onOuvrir: (e: Evenement) => void; chargement: boolean }) {
  const groupes = jours.map((j) => ({ j, liste: evenements.filter((e) => toucheLeJour(e, j)) })).filter((g) => g.liste.length > 0);
  if (!chargement && groupes.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
        Rien de prévu sur les 31 prochains jours.
      </div>
    );
  }
  return (
    <div className="space-y-4">
      {groupes.map(({ j, liste }) => (
        <div key={j.toISOString()} className="overflow-hidden rounded-xl border border-border bg-card">
          <p className="border-b border-border bg-muted/40 px-4 py-2 text-sm font-semibold">{majuscule(F_JOUR_LONG.format(j))}</p>
          <ul className="divide-y divide-border">
            {liste.map((e) => (
              <li key={e.id}>
                <button type="button" onClick={() => onOuvrir(e)} className="flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-accent/60">
                  <span className="mt-1 h-10 w-1 shrink-0 rounded-full" style={{ backgroundColor: e.couleur }} />
                  <span className="w-28 shrink-0 text-sm text-muted-foreground">{plage(e)}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-foreground">{e.titre}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {[LIBELLE_SOURCE[e.source] ?? e.source, e.lieu, e.agenda !== 'moi' ? e.nomAgenda : null].filter(Boolean).join(' · ')}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

/* ================================================================ fiche */

function FicheEvenement({ e, onModifier, onSupprimer }: { e: Evenement; onModifier: () => void; onSupprimer: () => void }) {
  return (
    <>
      <DialogHeader>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <span className="size-2.5 rounded-full" style={{ backgroundColor: e.couleur }} />
          {e.nomAgenda} · {LIBELLE_SOURCE[e.source] ?? e.source}
          {e.categorie && e.source === 'RENDEZ_VOUS' ? ` · ${LIBELLE_CATEGORIE[e.categorie] ?? e.categorie}` : ''}
        </div>
        <DialogTitle className="text-xl">{e.titre}</DialogTitle>
        <DialogDescription className="sr-only">Fiche de l’événement</DialogDescription>
      </DialogHeader>
      <dl className="space-y-3 text-sm">
        <div className="flex gap-3">
          <Clock className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
          <div>
            <dt className="sr-only">Quand</dt>
            <dd className="font-medium text-foreground">{majuscule(F_JOUR_LONG.format(e.debut))}</dd>
            <dd className="text-muted-foreground">{plage(e)}</dd>
          </div>
        </div>
        {e.lieu ? (
          <div className="flex gap-3">
            <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
            <div>
              <dt className="sr-only">Lieu</dt>
              <dd>{e.lieu}</dd>
            </div>
          </div>
        ) : null}
        {e.participants.length ? (
          <div className="flex gap-3">
            <Users className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
            <div>
              <dt className="sr-only">Participants</dt>
              <dd>{e.participants.join(', ')}</dd>
            </div>
          </div>
        ) : null}
        {e.lien ? (
          <div className="flex gap-3">
            <Video className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
            <dd>
              <a href={e.lien} target="_blank" rel="noopener noreferrer" className="font-medium text-primary underline-offset-4 hover:underline">
                Rejoindre la réunion
              </a>
            </dd>
          </div>
        ) : null}
        {e.detail ? <dd className="whitespace-pre-line rounded-lg bg-muted/50 p-3 text-foreground">{e.detail}</dd> : null}
        {e.source === 'OCCUPE' ? (
          <p className="text-xs text-muted-foreground">Cette personne partage seulement ses disponibilités : les détails ne sont pas visibles.</p>
        ) : null}
        {e.par ? <p className="text-xs text-muted-foreground">Ajouté par {e.par}</p> : null}
      </dl>
      <DialogFooter className="flex-wrap gap-2">
        {e.href ? (
          <Button asChild variant="outline" size="sm">
            <Link href={e.href as Route}>
              <ExternalLink aria-hidden /> Ouvrir
            </Link>
          </Button>
        ) : null}
        {e.modifiable && e.rendezVousId ? (
          <>
            <Button variant="ghost" size="sm" onClick={onSupprimer}>
              <Trash2 aria-hidden /> Supprimer
            </Button>
            <Button size="sm" onClick={onModifier}>
              Modifier
            </Button>
          </>
        ) : null}
      </DialogFooter>
    </>
  );
}

/* =========================================================== formulaire */

function FormulaireRendezVous({
  edition,
  setEdition,
  agendas,
  enregistrement,
  onEnregistrer,
  onAnnuler,
}: {
  edition: Edition;
  setEdition: (e: Edition) => void;
  agendas: { id: string; nom: string; couleur: string }[];
  enregistrement: boolean;
  onEnregistrer: () => void;
  onAnnuler: () => void;
}) {
  const maj = (m: Partial<Edition>) => setEdition({ ...edition, ...m });
  const champ = 'mt-1 w-full rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring';
  return (
    <form
      onSubmit={(ev) => {
        ev.preventDefault();
        onEnregistrer();
      }}
      className="space-y-4"
    >
      <DialogHeader>
        <DialogTitle>{edition.mode === 'creer' ? 'Nouveau rendez-vous' : 'Modifier le rendez-vous'}</DialogTitle>
        <DialogDescription>Seul le titre est obligatoire.</DialogDescription>
      </DialogHeader>
      <label className="block text-sm font-medium">
        Titre
        <input autoFocus className={champ} value={edition.titre} onChange={(e) => maj({ titre: e.target.value })} maxLength={160} placeholder="Ex. : point avec l’équipe éducative" />
      </label>
      {edition.mode === 'creer' && agendas.length > 1 ? (
        <label className="block text-sm font-medium">
          Dans l’agenda
          <select className={champ} value={edition.agenda} onChange={(e) => maj({ agenda: e.target.value })}>
            {agendas.map((a) => (
              <option key={a.id} value={a.id}>
                {a.nom}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="block text-sm font-medium sm:col-span-1">
          Date
          <input type="date" className={champ} value={edition.date} onChange={(e) => maj({ date: e.target.value })} required />
        </label>
        {!edition.journeeEntiere ? (
          <>
            <label className="block text-sm font-medium">
              Début
              <input type="time" step={900} className={champ} value={edition.heureDebut} onChange={(e) => maj({ heureDebut: e.target.value })} />
            </label>
            <label className="block text-sm font-medium">
              Fin
              <input type="time" step={900} className={champ} value={edition.heureFin} onChange={(e) => maj({ heureFin: e.target.value })} />
            </label>
          </>
        ) : null}
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={edition.journeeEntiere} onChange={(e) => maj({ journeeEntiere: e.target.checked })} className="size-4" />
        Toute la journée
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm font-medium">
          Type
          <select className={champ} value={edition.categorie} onChange={(e) => maj({ categorie: e.target.value })}>
            {Object.entries(LIBELLE_CATEGORIE).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-medium">
          Rappel par courriel
          <select className={champ} value={edition.rappelMinutes} onChange={(e) => maj({ rappelMinutes: e.target.value })}>
            <option value="">Aucun</option>
            <option value="15">15 minutes avant</option>
            <option value="60">1 heure avant</option>
            <option value="1440">La veille</option>
          </select>
        </label>
      </div>
      <label className="block text-sm font-medium">
        Lieu
        <input className={champ} value={edition.lieu} onChange={(e) => maj({ lieu: e.target.value })} maxLength={200} placeholder="Adresse, salle" />
      </label>
      <label className="block text-sm font-medium">
        Lien de visio
        <input className={champ} value={edition.lien} onChange={(e) => maj({ lien: e.target.value })} maxLength={500} placeholder="https://" />
      </label>
      <label className="block text-sm font-medium">
        Participants
        <input className={champ} value={edition.participants} onChange={(e) => maj({ participants: e.target.value })} placeholder="Noms séparés par des virgules" />
      </label>
      <label className="block text-sm font-medium">
        Notes
        <textarea className={cn(champ, 'min-h-24')} value={edition.description} onChange={(e) => maj({ description: e.target.value })} maxLength={4000} />
      </label>
      <p className="text-xs text-muted-foreground">
        Ne notez ici aucune information de santé ni de situation d’une personne accompagnée : un agenda se partage.
      </p>
      <DialogFooter className="gap-2">
        <Button type="button" variant="ghost" onClick={onAnnuler}>
          Annuler
        </Button>
        <Button type="submit" loading={enregistrement}>
          Enregistrer
        </Button>
      </DialogFooter>
    </form>
  );
}

/* =============================================================== offres */

interface Offre {
  id: string;
  slug: string | null;
  title: string;
  description: string;
  category: string;
  format: string;
  duration: string | null;
  durationMinutes: number | null;
  price: number | null;
  city: string | null;
  image: string | null;
  timeSlots: string[];
}

function OffresDuPartage({ partage }: { partage: VuePartage }) {
  const [offres, setOffres] = useState<Offre[] | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  useEffect(() => {
    apiRequest<Offre[]>(`/partages/${partage.id}/offres`)
      .then(setOffres)
      .catch((e) => setErreur(e instanceof ApiError ? e.message : 'Les services ne répondent pas.'));
  }, [partage.id]);
  const nom = partage.compte?.nom ?? partage.titulaire?.nom ?? 'Cette personne';
  return (
    <>
      <DialogHeader>
        <DialogTitle>Les services de {nom}</DialogTitle>
        <DialogDescription>Ses fiches publiées, telles qu’elle les propose.</DialogDescription>
      </DialogHeader>
      {erreur ? <p className="text-sm text-destructive">{erreur}</p> : null}
      {offres === null && !erreur ? <p className="text-sm text-muted-foreground">Chargement…</p> : null}
      {offres && offres.length === 0 ? <p className="text-sm text-muted-foreground">Aucun service publié pour l’instant.</p> : null}
      <ul className="grid gap-3 sm:grid-cols-2">
        {(offres ?? []).map((o) => (
          <li key={o.id} className="overflow-hidden rounded-xl border border-border bg-card">
            {o.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={o.image} alt="" className="h-28 w-full object-cover" />
            ) : null}
            <div className="space-y-1 p-3">
              <p className="font-semibold text-foreground">{o.title}</p>
              <p className="text-xs text-muted-foreground">
                {[o.format === 'INDIVIDUEL' ? 'Renfort personnalisé' : 'Atelier', o.duration ?? (o.durationMinutes ? `${o.durationMinutes} min` : null), o.city, o.price !== null ? `${o.price.toLocaleString('fr-FR')} €` : null]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
              <p className="line-clamp-3 text-sm text-muted-foreground">{o.description}</p>
              {o.slug ? (
                <Link href={`/ateliers/${o.slug}` as Route} className="inline-block pt-1 text-sm font-semibold text-primary hover:underline">
                  Voir la fiche
                </Link>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}

export type { Niveau };
