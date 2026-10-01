'use client';
/* Textes allégés le 01/10/2026 (demande : le moins de texte possible) */

import { Fragment, useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { Barres, Camembert, Courbe, Jauge, PALETTE, euros } from './graphiques';
import { PrevuRealise } from './PrevuRealise';

/**
 * MES FACTURES : l'outil premium des deux espaces de Pilote.
 *
 * Un seul composant pour l'association et l'académie ; seules les couleurs et
 * l'adresse de retour changent (`theme`). Neuf onglets (une enveloppe de subvention ou de projet ouvre aussi son prévu / réalisé) :
 *   Tableau de bord · Factures · Devis · Enveloppes · Relevés · Trésorerie ·
 *   Fournisseurs · Notes de frais · Journal
 * et deux exports : le CSV comptable, et le bilan financier de l'exercice en
 * classeur Excel, rempli automatiquement.
 *
 * PREMIUM : sans abonnement actif, l'écran présente l'outil et le bouton
 * d'abonnement. Le prix est celui que l'API annonce.
 */

export interface ThemeFactures {
  espace: 'association' | 'academie';
  primaire: string;
  primaireFonce: string;
  encre: string;
  bordure: string;
  fond: string;
  carte: string;
  btnPrimaire: string;
  btnSecondaire: string;
}

interface Abonnement {
  actif: boolean;
  statut: string;
  quotaMensuel: number;
  luesCeMois: number;
  restantes: number;
  finPeriode: string | null;
  prixCents: number | null;
}

interface Verification {
  siretOk: boolean | null;
  etat: 'A' | 'C' | null;
  nomAnnuaire: string | null;
  ibanChange: boolean;
  ibanNouveau: boolean;
  alertes: string[];
}

interface Facture {
  id: string;
  fileId: string | null;
  fournisseur: string;
  numero: string | null;
  dateFacture: string | null;
  dateEcheance: string | null;
  montantHT: number | null;
  tva: number | null;
  montantTTC: number;
  devise: string;
  poste: string | null;
  lignes: { libelle: string; quantite: number | null; prixUnitaire: number | null; total: number | null }[];
  statut: 'A_VERIFIER' | 'VALIDEE' | 'PAYEE';
  alerte: string | null;
  variationPct: number | null;
  origine: string;
  notes: string | null;
  deposeLe: string;
  siret: string | null;
  ibanFin: string | null;
  verification: Verification | null;
  enveloppeId: string | null;
  enveloppe: { id: string; nom: string } | null;
  devis: { id: string; reference: string | null; montantTTC: number; ecartPct: number | null } | null;
  validations: number;
  validationsRequises: number;
}

interface Devis {
  id: string;
  fileId: string | null;
  fournisseur: string;
  reference: string | null;
  dateDevis: string | null;
  dateValidite: string | null;
  montantHT: number | null;
  tva: number | null;
  montantTTC: number;
  poste: string | null;
  lignes: { libelle: string; quantite: number | null; prixUnitaire: number | null; total: number | null }[];
  statut: 'EN_ATTENTE' | 'FACTURE' | 'ANNULE';
  factureId: string | null;
  facture: { id: string; numero: string | null; montantTTC: number; dateFacture: string | null; statut: string } | null;
  ecartPct: number | null;
  alerte: string | null;
  notes: string | null;
  deposeLe: string;
  perime: boolean;
}

interface DevisCharge {
  resume: { enAttente: number; engageSansFacture: number; perimes: number; ecarts: number };
  devis: Devis[];
}

interface Tresorerie {
  horizonJours: number;
  depart: { solde: number; au: string; source: 'saisi' | 'releve' } | null;
  soldeAujourdhui: number;
  soldeFin: number;
  pointBas: { date: string; montant: number };
  totalEntrees: number;
  totalSorties: number;
  semaines: { debut: string; fin: string; entrees: number; sorties: number; solde: number }[];
  mouvements: { date: string; libelle: string; montant: number; type: 'facture' | 'note' | 'devis' | 'recurrent' | 'subvention'; certain: boolean; id?: string }[];
  recurrents: { libelle: string; montant: number; jourDuMois: number; occurrences: number }[];
  aPercevoirSansDate: { id: string; nom: string; montant: number }[];
  alertes: string[];
}

interface Sessions {
  annee: number;
  sessions: { id: string; nom: string; coursId: string | null; produits: number; sourceProduits: string; charges: number; chargesParPoste: { poste: string; total: number }[]; marge: number; margePct: number | null; inscrits: number; coutParInscrit: number | null; produitParInscrit: number | null }[];
  totaux: { produits: number; charges: number; marge: number; inscrits: number };
}

interface Depot {
  enService: boolean;
  adresse: string | null;
  jeton: string | null;
}

interface Resume {
  annee: number;
  total: number;
  nombre: number;
  aVerifier: number;
  aPayer: number;
  alertes: number;
  parPoste: { poste: string; total: number }[];
  parFournisseur: { fournisseur: string; total: number }[];
  parMois: number[];
  seuilDoubleValidation: number | null;
}

interface Charge {
  abonnement: Abonnement;
  factures: Facture[];
  resume: Resume | null;
  postes: readonly string[];
}

interface Enveloppe {
  id: string;
  nom: string;
  type: 'SUBVENTION' | 'PROJET' | 'FONDS_PROPRES' | 'SESSION' | 'AUTRE';
  financeur: string | null;
  montantAccorde: number | null;
  engage: number;
  paye: number;
  restant: number | null;
  pourcentage: number | null;
  nombreFactures: number;
  dateDebut: string | null;
  dateFin: string | null;
  dateJustification: string | null;
  dateVersementPrevu: string | null;
  notes: string | null;
  alertes: string[];
  dossierId?: string | null;
}

interface Releves {
  annee: number;
  releves: { id: string; libelle: string; periodeDebut: string | null; periodeFin: string | null; soldeDebut: number | null; soldeFin: number | null; nbOperations: number; deposeLe: string }[];
  resume: { recettes: number; depenses: number; rapprochees: number; sansFacture: number; sansPoste: number; parNature: { nature: string; total: number }[]; parMois: { recettes: number[]; depenses: number[] } };
  operations: { id: string; date: string; libelle: string; montant: number; sens: 'DEPENSE' | 'RECETTE'; poste: string | null; enveloppeId: string | null; rapprochement: string | null; facture: { id: string; fournisseur: string; numero: string | null } | null }[];
}

interface Fournisseurs {
  fiches: { id: string; nom: string; siret: string | null; ibanFin: string | null; etat: string | null; nomAnnuaire: string | null; verifieLe: string | null }[];
  comparatif: { poste: string; total: number; fournisseurs: { fournisseur: string; total: number; nombre: number; evolutionPct: number | null; prixUnitaireMoyen: number | null; siret: string | null; etat: string | null; ibanFin: string | null }[] }[];
}

interface Frais {
  annee: number;
  resume: { aValider: number; aRembourser: number; rembourse: number; abandonne: number };
  notes: { id: string; beneficiaire: string; date: string; objet: string; montant: number; poste: string | null; fileId: string | null; statut: 'A_VALIDER' | 'VALIDEE' | 'REMBOURSEE' | 'ABANDONNEE' | 'REFUSEE'; abandon: boolean; recuNumero: string | null; enveloppeId: string | null; notes: string | null }[];
}

interface Bilan {
  annee: number;
  structure: string;
  charges: { rubrique: string; total: number }[];
  produits: { origine: string; total: number }[];
  sourceProduits: string;
  totalCharges: number;
  totalProduits: number;
  resultat: number;
  budget: { lignes: { poste: string; factures: number; releve: number; frais: number; total: number }[]; total: number };
  tresorerie: { recettes: number[]; depenses: number[] };
}

type Journal = { id: string; le: string; par: string; action: string; cible: string | null; detail: Record<string, unknown> | null }[];
type Agir = (fn: () => Promise<unknown>, succes?: string) => Promise<void>;

const MOIS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
const STATUTS: Record<Facture['statut'], string> = { A_VERIFIER: 'À vérifier', VALIDEE: 'Validée', PAYEE: 'Payée' };
const TYPES_ENV: Record<Enveloppe['type'], string> = { SUBVENTION: 'Subvention', PROJET: 'Projet ou action', FONDS_PROPRES: 'Fonds propres', SESSION: 'Session de formation', AUTRE: 'Autre' };
const STATUTS_NOTE: Record<Frais['notes'][number]['statut'], string> = { A_VALIDER: 'À valider', VALIDEE: 'Validée, à rembourser', REMBOURSEE: 'Remboursée', ABANDONNEE: 'Abandon de frais', REFUSEE: 'Refusée' };
const ONGLETS = ['Tableau de bord', 'Factures', 'Devis', 'Enveloppes', 'Relevés', 'Trésorerie', 'Fournisseurs', 'Notes de frais', 'Journal'] as const;
const STATUTS_DEVIS: Record<Devis['statut'], string> = { EN_ATTENTE: 'Accepté, pas encore facturé', FACTURE: 'Facturé', ANNULE: 'Annulé' };
const TYPES_MOUVEMENT: Record<Tresorerie['mouvements'][number]['type'], string> = { facture: 'Facture à payer', note: 'Note de frais', devis: 'Devis accepté', recurrent: 'Charge ou recette récurrente', subvention: 'Subvention à percevoir' };
type Onglet = (typeof ONGLETS)[number];

function dateCourte(d: string | null | undefined) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

async function appel<T>(path: string, init?: { method?: string; body?: unknown; form?: FormData }): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  let body: BodyInit | undefined;
  if (init?.form) body = init.form;
  else if (init?.body !== undefined) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(init.body);
  }
  const res = await fetch(`/api/proxy${path}`, { method: init?.method ?? 'GET', headers, body, credentials: 'include' });
  const texte = await res.text();
  let charge: unknown = null;
  try {
    charge = texte ? JSON.parse(texte) : null;
  } catch {
    charge = null;
  }
  if (!res.ok) {
    const m = (charge as { message?: string | string[] } | null)?.message;
    throw new Error(Array.isArray(m) ? m.join(' ') : m || `Erreur ${res.status}`);
  }
  return charge as T;
}

/* ═══════════════════════════════════════════════════════════════════════ */

export function MesFactures({ theme }: { theme: ThemeFactures }) {
  const [charge, setCharge] = useState<Charge | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [occupe, setOccupe] = useState(false);
  const [onglet, setOnglet] = useState<Onglet>('Tableau de bord');
  const [enveloppes, setEnveloppes] = useState<Enveloppe[] | null>(null);
  const [releves, setReleves] = useState<Releves | null>(null);
  const [fournisseurs, setFournisseurs] = useState<Fournisseurs | null>(null);
  const [frais, setFrais] = useState<Frais | null>(null);
  const [bilan, setBilan] = useState<Bilan | null>(null);
  const [journal, setJournal] = useState<Journal | null>(null);
  const [devis, setDevis] = useState<DevisCharge | null>(null);
  const [tresorerie, setTresorerie] = useState<Tresorerie | null>(null);
  const [sessions, setSessions] = useState<Sessions | null>(null);
  const [depot, setDepot] = useState<Depot | null>(null);
  const [annee, setAnnee] = useState(new Date().getFullYear());

  const signaler = (e: unknown) => setErreur(e instanceof Error ? e.message : 'Erreur');

  const recharger = useCallback(async () => {
    try {
      const c = await appel<Charge>('/factures');
      setCharge(c);
      setErreur(null);
      if (c.abonnement.actif) {
        const [env, rel, four, fr, bi, dv, tr, dp, se] = await Promise.all([
          appel<Enveloppe[]>('/factures/enveloppes'),
          appel<Releves>(`/factures/releves?annee=${annee}`),
          appel<Fournisseurs>('/factures/fournisseurs'),
          appel<Frais>(`/factures/frais?annee=${annee}`),
          appel<Bilan>(`/factures/bilan?annee=${annee}`),
          appel<DevisCharge>('/factures/devis'),
          appel<Tresorerie>('/factures/tresorerie'),
          appel<Depot>('/factures/depot'),
          theme.espace === 'academie' ? appel<Sessions>(`/factures/sessions?annee=${annee}`) : Promise.resolve(null),
        ]);
        setEnveloppes(env);
        setReleves(rel);
        setFournisseurs(four);
        setFrais(fr);
        setBilan(bi);
        setDevis(dv);
        setTresorerie(tr);
        setDepot(dp);
        setSessions(se);
      }
    } catch (e) {
      signaler(e);
    }
  }, [annee, theme.espace]);

  useEffect(() => {
    void recharger();
    const q = new URLSearchParams(window.location.search).get('abonnement');
    if (q === 'succes') setMessage('Merci ! Activation en cours, quelques secondes.');
    if (q === 'annule') setMessage("Le paiement a été annulé : l'outil reste fermé.");
  }, [recharger]);

  useEffect(() => {
    if (onglet === 'Journal' && !journal) appel<Journal>('/factures/journal').then(setJournal).catch(signaler);
  }, [onglet, journal]);

  const abonner = async () => {
    setOccupe(true);
    try {
      const r = await appel<{ url: string }>('/factures/abonnement', { method: 'POST', body: { espace: theme.espace } });
      window.location.href = r.url;
    } catch (e) {
      signaler(e);
      setOccupe(false);
    }
  };

  const agir: Agir = async (fn, succes) => {
    setOccupe(true);
    setErreur(null);
    try {
      await fn();
      if (succes) setMessage(succes);
      await recharger();
      setJournal(null);
    } catch (e) {
      signaler(e);
    } finally {
      setOccupe(false);
    }
  };

  if (!charge && !erreur) return <SqueletteFactures />;
  const ab = charge?.abonnement;

  // ─── Sans abonnement : la page de présentation et le bouton ────────────────
  if (!ab?.actif) {
    return (
      <div className="grid gap-5">
        {message ? <Bandeau ton="info">{message}</Bandeau> : null}
        {erreur ? <Bandeau ton="alerte">{erreur}</Bandeau> : null}
        <div className={`${theme.carte} p-6 sm:p-8`}>
          <p className="text-[13px] font-bold uppercase tracking-wide" style={{ color: theme.primaire }}>
            Outil premium
          </p>
          <h2 className="mt-1 text-[26px] font-black leading-tight" style={{ color: theme.encre }}>
            Fini la saisie des factures.
          </h2>
          <p className="mt-3 max-w-[64ch] text-[16px] leading-relaxed" style={{ color: theme.encre }}>
            Une photo de la facture : tout est lu, rangé, compté.
          </p>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2">
            {[
              ['Zéro saisie', 'Montants, dates, lignes lus'],
              ['Restant des subventions', 'Accordé, payé, restant · Cerfa'],
              ['Anti-fraude', 'RIB, SIRET, doublons vérifiés'],
              ['Relevé rapproché', 'Lignes reliées aux factures'],
              ['Bilan de l’exercice', 'Classeur Excel automatique'],
              ['Notes de frais', 'Abandon de frais, double validation'],
            ].map(([t, d]) => (
              <li key={t} className="rounded-xl border p-4" style={{ borderColor: theme.bordure, background: theme.fond }}>
                <p className="font-bold" style={{ color: theme.encre }}>
                  {t}
                </p>
                <p className="mt-1 text-[14px] opacity-80" style={{ color: theme.encre }}>
                  {d}
                </p>
              </li>
            ))}
          </ul>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            {ab?.prixCents ? (
              <button type="button" onClick={abonner} disabled={occupe} className={theme.btnPrimaire}>
                Activer Mes factures, {euros(ab.prixCents / 100, 2)} par mois
              </button>
            ) : (
              <button type="button" disabled className={theme.btnPrimaire} title="Le tarif n’est pas encore fixé">
                Tarif à venir
              </button>
            )}
            <span className="text-[14px] opacity-80" style={{ color: theme.encre }}>
              {ab?.quotaMensuel ?? 100} lectures / mois · sans engagement
            </span>
          </div>
          <p className="mt-4 text-[13px] opacity-70" style={{ color: theme.encre }}>
            Aucune connexion bancaire · rien gardé après lecture
          </p>
        </div>
      </div>
    );
  }

  // ─── Avec abonnement : l'outil ─────────────────────────────────────────────
  const r = charge!.resume!;
  const postes = charge!.postes;
  const factures = charge!.factures;

  return (
    <div className="grid gap-5">
      {message ? <Bandeau ton="info">{message}</Bandeau> : null}
      {erreur ? <Bandeau ton="alerte">{erreur}</Bandeau> : null}

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap gap-1 rounded-xl border p-1" style={{ borderColor: theme.bordure, background: theme.fond }}>
          {ONGLETS.map((o) => (
            <button key={o} type="button" onClick={() => setOnglet(o)} className="rounded-lg px-3 py-1.5 text-[13px] font-bold transition" style={{ background: onglet === o ? theme.primaire : 'transparent', color: onglet === o ? '#fff' : theme.encre }}>
              {o}
            </button>
          ))}
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <select value={annee} onChange={(e) => setAnnee(Number(e.target.value))} className="rounded-lg border px-2 py-1.5 text-[13px]" style={{ borderColor: theme.bordure }} aria-label="Exercice">
            {[0, 1, 2, 3].map((k) => {
              const a = new Date().getFullYear() - k;
              return (
                <option key={a} value={a}>
                  Exercice {a}
                </option>
              );
            })}
          </select>
          <a href={`/api/proxy/factures/bilan.xlsx?annee=${annee}`} className={theme.btnPrimaire} style={{ padding: '8px 14px', fontSize: 13 }}>
            Bilan {annee} (Excel)
          </a>
        </div>
      </div>

      {onglet === 'Tableau de bord' ? <TableauDeBord theme={theme} r={r} bilan={bilan} enveloppes={enveloppes} releves={releves} frais={frais} annee={annee} tresorerie={tresorerie} sessions={sessions} devis={devis} /> : null}
      {onglet === 'Factures' ? <FacturesVue theme={theme} r={r} ab={ab} factures={factures} postes={postes} enveloppes={enveloppes ?? []} occupe={occupe} agir={agir} depot={depot} /> : null}
      {onglet === 'Devis' ? <DevisVue theme={theme} data={devis} postes={postes} factures={factures} occupe={occupe} agir={agir} /> : null}
      {onglet === 'Enveloppes' ? <EnveloppesVue theme={theme} enveloppes={enveloppes ?? []} occupe={occupe} agir={agir} /> : null}
      {onglet === 'Relevés' ? <RelevesVue theme={theme} releves={releves} postes={postes} enveloppes={enveloppes ?? []} factures={factures} occupe={occupe} agir={agir} /> : null}
      {onglet === 'Trésorerie' ? <TresorerieVue theme={theme} t={tresorerie} occupe={occupe} agir={agir} /> : null}
      {onglet === 'Fournisseurs' ? <FournisseursVue theme={theme} data={fournisseurs} /> : null}
      {onglet === 'Notes de frais' ? <NotesDeFrais theme={theme} frais={frais} postes={postes} enveloppes={enveloppes ?? []} occupe={occupe} agir={agir} /> : null}
      {onglet === 'Journal' ? <JournalVue theme={theme} journal={journal} seuil={r.seuilDoubleValidation} occupe={occupe} agir={agir} /> : null}
    </div>
  );
}

/* ═══════════════════════ Tableau de bord ═══════════════════════ */

function TableauDeBord({ theme, r, bilan, enveloppes, releves, frais, annee, tresorerie, sessions, devis }: { theme: ThemeFactures; r: Resume; bilan: Bilan | null; enveloppes: Enveloppe[] | null; releves: Releves | null; frais: Frais | null; annee: number; tresorerie: Tresorerie | null; sessions: Sessions | null; devis: DevisCharge | null }) {
  const alertesEnv = (enveloppes ?? []).filter((e) => e.alertes.length);
  const zero = Array.from({ length: 12 }, () => 0);
  return (
    <div className="grid gap-5">
      <div className="grid gap-3 sm:grid-cols-4">
        <Chiffre theme={theme} titre={`Charges ${annee}`} valeur={euros(bilan?.totalCharges ?? r.total)} detail="factures, relevé, frais" />
        <Chiffre theme={theme} titre={`Produits ${annee}`} valeur={euros(bilan?.totalProduits ?? 0)} detail={bilan?.sourceProduits ?? ''} />
        <Chiffre theme={theme} titre="Résultat" valeur={euros(bilan?.resultat ?? 0)} detail="produits − charges" ton={(bilan?.resultat ?? 0) < 0 ? '#B91C1C' : undefined} />
        <Chiffre theme={theme} titre="À traiter" valeur={String(r.aVerifier + (frais?.notes.filter((n) => n.statut === 'A_VALIDER').length ?? 0))} detail={`${r.aVerifier} à vérifier · ${r.alertes} alerte${r.alertes > 1 ? 's' : ''}`} />
      </div>

      {alertesEnv.length ? <Bandeau ton="alerte">{alertesEnv.map((e) => `${e.nom} : ${e.alertes.join(' ')}`).join(' · ')}</Bandeau> : null}

      <div className="grid gap-5 md:grid-cols-2">
        <div className={`${theme.carte} p-5`}>
          <h3 className="mb-3 text-[15px] font-bold" style={{ color: theme.encre }}>
            Charges par poste
          </h3>
          <Camembert encre={theme.encre} parts={(bilan?.budget.lignes ?? r.parPoste.map((p) => ({ poste: p.poste, total: p.total }))).map((l) => ({ nom: l.poste, valeur: l.total }))} titre="Charges" />
        </div>
        <div className={`${theme.carte} p-5`}>
          <h3 className="mb-3 text-[15px] font-bold" style={{ color: theme.encre }}>
            Produits par origine
          </h3>
          <Camembert encre={theme.encre} parts={(bilan?.produits ?? []).map((p) => ({ nom: p.origine, valeur: p.total }))} titre="Produits" />
          {!bilan?.produits.length ? (
            <p className="mt-2 text-[13px] opacity-70" style={{ color: theme.encre }}>
              Aucune recette (onglet Relevés).
            </p>
          ) : null}
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <div className={`${theme.carte} p-5`}>
          <h3 className="mb-3 text-[15px] font-bold" style={{ color: theme.encre }}>
            Trésorerie par mois
          </h3>
          <Barres encre={theme.encre} etiquettes={MOIS} series={[{ nom: 'Entrées', valeurs: releves?.resume.parMois.recettes ?? zero, couleur: '#1E9E6A' }, { nom: 'Sorties', valeurs: releves?.resume.parMois.depenses ?? zero, couleur: '#EF4444' }]} />
        </div>
        <div className={`${theme.carte} p-5`}>
          <h3 className="mb-3 text-[15px] font-bold" style={{ color: theme.encre }}>
            Restant par enveloppe
          </h3>
          {enveloppes?.length ? (
            <ul className="grid gap-3">
              {enveloppes.slice(0, 6).map((e, i) => (
                <li key={e.id}>
                  <div className="flex items-baseline justify-between gap-2 text-[13px]" style={{ color: theme.encre }}>
                    <span className="truncate font-bold">{e.nom}</span>
                    <span className="shrink-0 tabular-nums">{e.restant === null ? `${euros(e.engage)} engagés` : `${euros(e.restant)} restants sur ${euros(e.montantAccorde ?? 0)}`}</span>
                  </div>
                  <Jauge pourcentage={e.pourcentage} couleur={PALETTE[i % PALETTE.length]} encre={theme.encre} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[13px] opacity-70" style={{ color: theme.encre }}>
              Aucune enveloppe.
            </p>
          )}
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <div className={`${theme.carte} p-5`}>
          <h3 className="mb-1 text-[15px] font-bold" style={{ color: theme.encre }}>
            Trésorerie à 90 jours
          </h3>
          {tresorerie ? (
            <>
              <p className="mb-2 text-[13px] opacity-70" style={{ color: theme.encre }}>
                Auj. {euros(tresorerie.soldeAujourdhui)} · J+90 {euros(tresorerie.soldeFin)} · point bas {euros(tresorerie.pointBas.montant)} ({dateCourte(tresorerie.pointBas.date)})
              </p>
              <Courbe encre={theme.encre} couleur={theme.primaire} points={tresorerie.semaines.map((s) => ({ etiquette: dateCourte(s.debut).slice(0, 6), valeur: s.solde }))} />
              {tresorerie.alertes.length ? <p className="mt-2 rounded-lg bg-[#FFF4D6] px-3 py-2 text-[13px] text-[#7A4B00]">{tresorerie.alertes[0]}</p> : null}
            </>
          ) : null}
        </div>
        <div className={`${theme.carte} p-5`}>
          <h3 className="mb-3 text-[15px] font-bold" style={{ color: theme.encre }}>
            Factures par mois
          </h3>
          <Barres encre={theme.encre} etiquettes={MOIS} series={[{ nom: 'Factures', valeurs: r.parMois, couleur: theme.primaire }]} />
          {devis && devis.resume.enAttente ? (
            <p className="mt-2 text-[13px] opacity-70" style={{ color: theme.encre }}>
              {devis.resume.enAttente} devis non facturé{devis.resume.enAttente > 1 ? 's' : ''} · {euros(devis.resume.engageSansFacture)}
            </p>
          ) : null}
        </div>
      </div>

      {theme.espace === 'academie' ? <SessionsVue theme={theme} sessions={sessions} /> : null}
    </div>
  );
}

/* ═══════════════════════ Coût par session (académie) ═══════════════════════ */

function SessionsVue({ theme, sessions }: { theme: ThemeFactures; sessions: Sessions | null }) {
  if (!sessions) return null;
  return (
    <div className={`${theme.carte} p-5`}>
      <div className="mb-3 flex items-center gap-2">
        <h3 className="text-[15px] font-bold" style={{ color: theme.encre }}>
          Coût par session
        </h3>
        <Info theme={theme}>Encaissé, dépensé et coût par inscrit de chaque enveloppe « Session de formation ».</Info>
      </div>
      {!sessions.sessions.length ? (
        <p className="text-[13px] opacity-70" style={{ color: theme.encre }}>
          Aucune session (onglet Enveloppes → Importer).
        </p>
      ) : (
        <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
          <Camembert encre={theme.encre} titre="Charges" parts={sessions.sessions.map((s) => ({ nom: s.nom, valeur: s.charges }))} />
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-[13px]" style={{ color: theme.encre }}>
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wide opacity-70">
                  <th className="p-2">Session</th>
                  <th className="p-2 text-right">Produits</th>
                  <th className="p-2 text-right">Charges</th>
                  <th className="p-2 text-right">Marge</th>
                  <th className="p-2 text-right">Inscrits</th>
                  <th className="p-2 text-right">Coût / inscrit</th>
                </tr>
              </thead>
              <tbody>
                {sessions.sessions.map((s) => (
                  <tr key={s.id} className="border-t" style={{ borderColor: theme.bordure }}>
                    <td className="p-2 font-bold">{s.nom}</td>
                    <td className="p-2 text-right tabular-nums">{euros(s.produits)}</td>
                    <td className="p-2 text-right tabular-nums">{euros(s.charges)}</td>
                    <td className="p-2 text-right font-bold tabular-nums" style={{ color: s.marge < 0 ? '#B91C1C' : '#0F5F3E' }}>
                      {euros(s.marge)}
                      {s.margePct !== null ? <span className="ml-1 text-[11px] opacity-70">{s.margePct} %</span> : null}
                    </td>
                    <td className="p-2 text-right tabular-nums">{s.inscrits}</td>
                    <td className="p-2 text-right tabular-nums">{s.coutParInscrit !== null ? euros(s.coutParInscrit) : '·'}</td>
                  </tr>
                ))}
                <tr className="border-t font-bold" style={{ borderColor: theme.bordure }}>
                  <td className="p-2">Total</td>
                  <td className="p-2 text-right tabular-nums">{euros(sessions.totaux.produits)}</td>
                  <td className="p-2 text-right tabular-nums">{euros(sessions.totaux.charges)}</td>
                  <td className="p-2 text-right tabular-nums">{euros(sessions.totaux.marge)}</td>
                  <td className="p-2 text-right tabular-nums">{sessions.totaux.inscrits}</td>
                  <td className="p-2" />
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════ Factures ═══════════════════════ */

function FacturesVue({ theme, r, ab, factures, postes, enveloppes, occupe, agir, depot }: { theme: ThemeFactures; r: Resume; ab: Abonnement; factures: Facture[]; postes: readonly string[]; enveloppes: Enveloppe[]; occupe: boolean; agir: Agir; depot: Depot | null }) {
  const fichier = useRef<HTMLInputElement>(null);
  const [ouverte, setOuverte] = useState<string | null>(null);
  const [saisie, setSaisie] = useState(false);
  const [posteDepot, setPosteDepot] = useState('');
  const [envDepot, setEnvDepot] = useState('');

  const deposer = (f: File) =>
    agir(async () => {
      const form = new FormData();
      form.append('file', f);
      if (posteDepot) form.append('poste', posteDepot);
      if (envDepot) form.append('enveloppeId', envDepot);
      const fa = await appel<Facture>('/factures', { method: 'POST', form });
      setOuverte(fa.id);
      if (fichier.current) fichier.current.value = '';
      return fa;
    }, 'Facture lue : à relire et valider.');

  return (
    <div className="grid gap-5">
      <div className={`${theme.carte} p-5`}>
        <div className="flex flex-wrap items-end gap-3">
          <label className="grid gap-1 text-[14px] font-bold" style={{ color: theme.encre }}>
            Déposer une facture
            <input
              ref={fichier}
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              disabled={occupe}
              className="text-[14px]"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void deposer(f);
              }}
            />
          </label>
          <label className="grid gap-1 text-[13px] font-bold" style={{ color: theme.encre }}>
            Poste
            <select value={posteDepot} onChange={(e) => setPosteDepot(e.target.value)} className="rounded-xl border px-3 py-2 text-[14px]" style={{ borderColor: theme.bordure }}>
              <option value="">Automatique</option>
              {postes.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-[13px] font-bold" style={{ color: theme.encre }}>
            Enveloppe
            <select value={envDepot} onChange={(e) => setEnvDepot(e.target.value)} className="rounded-xl border px-3 py-2 text-[14px]" style={{ borderColor: theme.bordure }}>
              <option value="">Aucune</option>
              {enveloppes.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.nom}
                </option>
              ))}
            </select>
          </label>
          <p className="text-[13px] opacity-70" style={{ color: theme.encre }}>
            {ab.restantes} / {ab.quotaMensuel} lectures
          </p>
          <div className="ml-auto flex gap-2">
            <button type="button" className={theme.btnSecondaire} onClick={() => setSaisie(!saisie)}>
              Saisie manuelle
            </button>
            <a href="/api/proxy/factures/export.csv" className={theme.btnSecondaire}>
              Export CSV
            </a>
          </div>
        </div>
        {occupe ? (
          <p className="mt-3 text-[14px]" style={{ color: theme.primaire }}>
            Lecture en cours…
          </p>
        ) : null}
        {saisie ? <Saisie theme={theme} postes={postes} enveloppes={enveloppes} occupe={occupe} onOk={() => setSaisie(false)} agir={agir} /> : null}
      </div>

      <DepotEmail theme={theme} depot={depot} occupe={occupe} agir={agir} />

      <div className="grid gap-3 sm:grid-cols-4">
        <Chiffre theme={theme} titre={`Factures ${r.annee}`} valeur={euros(r.total)} detail={`${r.nombre} facture${r.nombre > 1 ? 's' : ''}`} />
        <Chiffre theme={theme} titre="À payer" valeur={euros(r.aPayer)} detail="non réglées" />
        <Chiffre theme={theme} titre="À vérifier" valeur={String(r.aVerifier)} detail="à relire" />
        <Chiffre theme={theme} titre="Alertes" valeur={String(r.alertes)} detail="hausses, doublons, RIB, SIRET" />
      </div>

      <div className={`${theme.carte} overflow-x-auto`}>
        <table className="w-full min-w-[640px] text-[14px]" style={{ color: theme.encre }}>
          <thead>
            <tr className="text-left text-[12px] uppercase tracking-wide opacity-70">
              <th className="p-3">Date</th>
              <th className="p-3">Fournisseur</th>
              <th className="p-3">Poste</th>
              <th className="p-3">Enveloppe</th>
              <th className="p-3 text-right">TTC</th>
              <th className="p-3">Statut</th>
            </tr>
          </thead>
          <tbody>
            {factures.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-5 text-center opacity-70">
                  Aucune facture.
                </td>
              </tr>
            ) : null}
            {factures.map((f) => (
              <Ligne key={f.id} f={f} theme={theme} ouverte={ouverte === f.id} onOuvrir={() => setOuverte(ouverte === f.id ? null : f.id)} postes={postes} enveloppes={enveloppes} occupe={occupe} agir={agir} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Saisie({ theme, postes, enveloppes, occupe, onOk, agir }: { theme: ThemeFactures; postes: readonly string[]; enveloppes: Enveloppe[]; occupe: boolean; onOk: () => void; agir: Agir }) {
  const [v, setV] = useState({ fournisseur: '', montantTTC: '', dateFacture: '', poste: '', numero: '', enveloppeId: '' });
  const champ = 'rounded-lg border px-2 py-1.5 text-[14px]';
  return (
    <form
      className="mt-4 grid gap-2 border-t pt-4 sm:grid-cols-6"
      style={{ borderColor: theme.bordure }}
      onSubmit={(e) => {
        e.preventDefault();
        void agir(async () => {
          await appel('/factures/saisie', { method: 'POST', body: { fournisseur: v.fournisseur, montantTTC: Number(v.montantTTC), dateFacture: v.dateFacture || undefined, poste: v.poste || undefined, numero: v.numero || undefined, enveloppeId: v.enveloppeId || null } });
          onOk();
        }, 'Facture enregistrée.');
      }}
    >
      <input required placeholder="Fournisseur" className={champ} style={{ borderColor: theme.bordure }} value={v.fournisseur} onChange={(e) => setV({ ...v, fournisseur: e.target.value })} />
      <input required type="number" step="0.01" min="0" placeholder="TTC" className={champ} style={{ borderColor: theme.bordure }} value={v.montantTTC} onChange={(e) => setV({ ...v, montantTTC: e.target.value })} />
      <input type="date" className={champ} style={{ borderColor: theme.bordure }} value={v.dateFacture} onChange={(e) => setV({ ...v, dateFacture: e.target.value })} />
      <select className={champ} style={{ borderColor: theme.bordure }} value={v.poste} onChange={(e) => setV({ ...v, poste: e.target.value })}>
        <option value="">Poste</option>
        {postes.map((p) => (
          <option key={p} value={p}>
            {p}
          </option>
        ))}
      </select>
      <select className={champ} style={{ borderColor: theme.bordure }} value={v.enveloppeId} onChange={(e) => setV({ ...v, enveloppeId: e.target.value })}>
        <option value="">Enveloppe</option>
        {enveloppes.map((x) => (
          <option key={x.id} value={x.id}>
            {x.nom}
          </option>
        ))}
      </select>
      <button type="submit" disabled={occupe} className={theme.btnPrimaire} style={{ padding: '8px 14px', fontSize: 13 }}>
        Enregistrer
      </button>
    </form>
  );
}

function Ligne({ f, theme, ouverte, onOuvrir, postes, enveloppes, occupe, agir }: { f: Facture; theme: ThemeFactures; ouverte: boolean; onOuvrir: () => void; postes: readonly string[]; enveloppes: Enveloppe[]; occupe: boolean; agir: Agir }) {
  const [brouillon, setBrouillon] = useState<Partial<Facture>>({});
  const v = <K extends keyof Facture>(k: K) => (brouillon[k] !== undefined ? brouillon[k] : f[k]) as Facture[K];
  const champ = 'w-full rounded-lg border px-2 py-1 text-[14px]';
  const modifier = (corps: Record<string, unknown>) => agir(() => appel(`/factures/${f.id}`, { method: 'PATCH', body: corps }));
  const ver = f.verification;
  const doubleAttendue = f.validationsRequises > 1;
  return (
    <>
      <tr className="cursor-pointer border-t hover:bg-black/[0.02]" style={{ borderColor: theme.bordure }} onClick={onOuvrir}>
        <td className="whitespace-nowrap p-3">{dateCourte(f.dateFacture) || dateCourte(f.deposeLe)}</td>
        <td className="p-3">
          <span className="font-bold">{f.fournisseur}</span>
          {f.alerte ? (
            <span className="ml-2 rounded-full bg-[#FDE7EC] px-2 py-0.5 text-[12px] font-bold text-[#8A1B3D]" title={f.alerte}>
              {ver?.ibanChange ? 'RIB changé' : ver?.etat === 'C' ? 'SIRET fermé' : f.variationPct !== null && f.variationPct >= 20 ? `+${f.variationPct} %` : 'à voir'}
            </span>
          ) : null}
        </td>
        <td className="p-3">{f.poste ?? <span className="opacity-50">Sans poste</span>}</td>
        <td className="p-3">
          {f.enveloppe?.nom ?? <span className="opacity-50">Aucune</span>}
          {f.devis ? (
            <span className="ml-2 rounded-full px-2 py-0.5 text-[11px] font-bold" style={{ background: f.devis.ecartPct !== null && Math.abs(f.devis.ecartPct) > 2 ? '#FFF4D6' : '#E3F5EC', color: f.devis.ecartPct !== null && Math.abs(f.devis.ecartPct) > 2 ? '#7A4B00' : '#0F5F3E' }} title={`Devis ${f.devis.reference ?? ''} : ${euros(f.devis.montantTTC, 2)}`}>
              devis {f.devis.ecartPct !== null && f.devis.ecartPct !== 0 ? `${f.devis.ecartPct > 0 ? '+' : ''}${f.devis.ecartPct} %` : 'conforme'}
            </span>
          ) : null}
        </td>
        <td className="p-3 text-right font-bold tabular-nums">{euros(f.montantTTC, 2)}</td>
        <td className="p-3">
          <span className={`rounded-full px-2 py-0.5 text-[12px] font-bold ${f.statut === 'PAYEE' ? 'bg-[#E3F5EC] text-[#0F5F3E]' : f.statut === 'VALIDEE' ? 'bg-[#ECEBFC] text-[#1D1B5C]' : 'bg-[#FFF4D6] text-[#7A4B00]'}`}>
            {STATUTS[f.statut]}
            {f.statut === 'A_VERIFIER' && doubleAttendue ? ` ${f.validations}/${f.validationsRequises}` : ''}
          </span>
        </td>
      </tr>
      {ouverte ? (
        <tr className="border-t" style={{ borderColor: theme.bordure, background: theme.fond }}>
          <td colSpan={6} className="p-4">
            {f.alerte ? <p className="mb-3 rounded-lg bg-[#FDE7EC] px-3 py-2 text-[13px] text-[#8A1B3D]">{f.alerte}</p> : null}
            {ver ? (
              <p className="mb-3 text-[13px] opacity-80">
                Vérification : SIRET {f.siret ?? 'non lu'}
                {ver.siretOk === true ? ` (${ver.etat === 'A' ? 'actif' : ver.etat === 'C' ? 'fermé' : 'trouvé'}${ver.nomAnnuaire ? `, ${ver.nomAnnuaire}` : ''})` : ver.siretOk === false ? ' (introuvable)' : ''} · RIB {f.ibanFin ? `…${f.ibanFin}` : 'non lu'}
                {ver.ibanNouveau ? ' (premier RIB enregistré)' : ''}
              </p>
            ) : null}
            <div className="grid gap-3 sm:grid-cols-3">
              <label className="grid gap-1 text-[12px] font-bold">
                Fournisseur
                <input className={champ} style={{ borderColor: theme.bordure }} value={v('fournisseur')} onChange={(e) => setBrouillon({ ...brouillon, fournisseur: e.target.value })} />
              </label>
              <label className="grid gap-1 text-[12px] font-bold">
                Numéro
                <input className={champ} style={{ borderColor: theme.bordure }} value={v('numero') ?? ''} onChange={(e) => setBrouillon({ ...brouillon, numero: e.target.value })} />
              </label>
              <label className="grid gap-1 text-[12px] font-bold">
                Poste
                <select className={champ} style={{ borderColor: theme.bordure }} value={v('poste') ?? ''} onChange={(e) => setBrouillon({ ...brouillon, poste: e.target.value || null })}>
                  <option value="">Sans poste</option>
                  {postes.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-1 text-[12px] font-bold">
                Enveloppe
                <select className={champ} style={{ borderColor: theme.bordure }} value={v('enveloppeId') ?? ''} onChange={(e) => setBrouillon({ ...brouillon, enveloppeId: e.target.value || null })}>
                  <option value="">Aucune</option>
                  {enveloppes.map((x) => (
                    <option key={x.id} value={x.id}>
                      {x.nom}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-1 text-[12px] font-bold">
                Date de la facture
                <input type="date" className={champ} style={{ borderColor: theme.bordure }} value={(v('dateFacture') ?? '').slice(0, 10)} onChange={(e) => setBrouillon({ ...brouillon, dateFacture: e.target.value || null })} />
              </label>
              <label className="grid gap-1 text-[12px] font-bold">
                Échéance
                <input type="date" className={champ} style={{ borderColor: theme.bordure }} value={(v('dateEcheance') ?? '').slice(0, 10)} onChange={(e) => setBrouillon({ ...brouillon, dateEcheance: e.target.value || null })} />
              </label>
              <label className="grid gap-1 text-[12px] font-bold">
                TTC
                <input type="number" step="0.01" className={champ} style={{ borderColor: theme.bordure }} value={v('montantTTC')} onChange={(e) => setBrouillon({ ...brouillon, montantTTC: Number(e.target.value) })} />
              </label>
              <label className="grid gap-1 text-[12px] font-bold">
                HT
                <input type="number" step="0.01" className={champ} style={{ borderColor: theme.bordure }} value={v('montantHT') ?? ''} onChange={(e) => setBrouillon({ ...brouillon, montantHT: e.target.value === '' ? null : Number(e.target.value) })} />
              </label>
              <label className="grid gap-1 text-[12px] font-bold">
                TVA
                <input type="number" step="0.01" className={champ} style={{ borderColor: theme.bordure }} value={v('tva') ?? ''} onChange={(e) => setBrouillon({ ...brouillon, tva: e.target.value === '' ? null : Number(e.target.value) })} />
              </label>
            </div>
            {f.lignes.length ? (
              <table className="mt-3 w-full text-[13px]">
                <tbody>
                  {f.lignes.map((l, i) => (
                    <tr key={i} className="border-t" style={{ borderColor: theme.bordure }}>
                      <td className="py-1 pr-2">{l.libelle}</td>
                      <td className="py-1 pr-2 text-right opacity-70">{l.quantite ?? ''}</td>
                      <td className="py-1 pr-2 text-right opacity-70">{l.prixUnitaire !== null ? euros(l.prixUnitaire, 2) : ''}</td>
                      <td className="py-1 text-right font-bold">{l.total !== null ? euros(l.total, 2) : ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : null}
            <div className="mt-3 flex flex-wrap gap-2">
              {Object.keys(brouillon).length ? (
                <button type="button" disabled={occupe} className={theme.btnSecondaire} onClick={() => void modifier(brouillon).then(() => setBrouillon({}))}>
                  Enregistrer les corrections
                </button>
              ) : null}
              {f.statut === 'A_VERIFIER' ? (
                <button
                  type="button"
                  disabled={occupe}
                  className={theme.btnPrimaire}
                  onClick={() => void agir(() => appel(`/factures/${f.id}/valider`, { method: 'POST' }), doubleAttendue && f.validations + 1 < f.validationsRequises ? 'Première validation enregistrée : une seconde personne doit valider.' : 'Facture validée.')}
                >
                  {doubleAttendue ? `Valider (${f.validations}/${f.validationsRequises})` : 'Valider la facture'}
                </button>
              ) : null}
              {f.statut !== 'PAYEE' ? (
                <button type="button" disabled={occupe} className={theme.btnSecondaire} onClick={() => void modifier({ statut: 'PAYEE' })}>
                  Marquer payée
                </button>
              ) : null}
              {ver?.ibanChange ? (
                <button type="button" disabled={occupe} className={theme.btnSecondaire} onClick={() => void modifier({ accepterRib: true })}>
                  Ce nouveau RIB est vérifié, l’adopter
                </button>
              ) : null}
              {f.fileId ? (
                <a href={`/api/proxy/files/${f.fileId}`} target="_blank" rel="noopener" className={theme.btnSecondaire}>
                  Voir le fichier
                </a>
              ) : null}
              <button
                type="button"
                disabled={occupe}
                className="ml-auto text-[13px] font-bold text-[#8A1B3D] underline"
                onClick={() => {
                  if (window.confirm('Supprimer cette facture ? Le fichier sera retiré du coffre.')) void agir(() => appel(`/factures/${f.id}`, { method: 'DELETE' }));
                }}
              >
                Supprimer
              </button>
            </div>
          </td>
        </tr>
      ) : null}
    </>
  );
}

/* ═══════════════════════ Enveloppes ═══════════════════════ */

const ENV_VIDE = { nom: '', type: 'SUBVENTION', financeur: '', montantAccorde: '', dateJustification: '', dateVersementPrevu: '' };

function EnveloppesVue({ theme, enveloppes, occupe, agir }: { theme: ThemeFactures; enveloppes: Enveloppe[]; occupe: boolean; agir: Agir }) {
  const [v, setV] = useState(ENV_VIDE);
  const champ = 'rounded-lg border px-2 py-1.5 text-[14px]';
  const [edition, setEdition] = useState<string | null>(null);
  const [prevu, setPrevu] = useState<string | null>(null);
  return (
    <div className="grid gap-5">
      <div className={`${theme.carte} p-5`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-[15px] font-bold" style={{ color: theme.encre }}>
            Nouvelle enveloppe
          </h3>
          <button type="button" disabled={occupe} className={theme.btnSecondaire} onClick={() => void agir(() => appel('/factures/enveloppes/importer', { method: 'POST' }), 'Import terminé.')}>
            Importer depuis Pilote
          </button>
        </div>
        <form
          className="mt-3 grid gap-2 sm:grid-cols-8"
          onSubmit={(e) => {
            e.preventDefault();
            void agir(async () => {
              await appel('/factures/enveloppes', { method: 'POST', body: { nom: v.nom, type: v.type, financeur: v.financeur || null, montantAccorde: v.montantAccorde ? Number(v.montantAccorde) : null, dateJustification: v.dateJustification || null, dateVersementPrevu: v.dateVersementPrevu || null } });
              setV(ENV_VIDE);
            }, 'Enveloppe créée.');
          }}
        >
          <input required placeholder="Nom (ex. Subvention CAF 2026)" className={`${champ} sm:col-span-2`} style={{ borderColor: theme.bordure }} value={v.nom} onChange={(e) => setV({ ...v, nom: e.target.value })} />
          <select className={champ} style={{ borderColor: theme.bordure }} value={v.type} onChange={(e) => setV({ ...v, type: e.target.value })}>
            {(Object.keys(TYPES_ENV) as Enveloppe['type'][]).map((t) => (
              <option key={t} value={t}>
                {TYPES_ENV[t]}
              </option>
            ))}
          </select>
          <input placeholder="Financeur" className={champ} style={{ borderColor: theme.bordure }} value={v.financeur} onChange={(e) => setV({ ...v, financeur: e.target.value })} />
          <input type="number" step="0.01" min="0" placeholder="Montant accordé" className={champ} style={{ borderColor: theme.bordure }} value={v.montantAccorde} onChange={(e) => setV({ ...v, montantAccorde: e.target.value })} />
          <input type="date" title="Date limite de justification" className={champ} style={{ borderColor: theme.bordure }} value={v.dateJustification} onChange={(e) => setV({ ...v, dateJustification: e.target.value })} />
          <input type="date" title="Date de versement prévue" className={champ} style={{ borderColor: theme.bordure }} value={v.dateVersementPrevu} onChange={(e) => setV({ ...v, dateVersementPrevu: e.target.value })} />
          <button type="submit" disabled={occupe} className={theme.btnPrimaire} style={{ padding: '8px 14px', fontSize: 13 }}>
            Créer
          </button>
        </form>
        <div className="mt-2 flex items-center gap-2 text-[12px] opacity-70" style={{ color: theme.encre }}>
          <span>Dates : justification, puis versement</span>
          <Info theme={theme}>1re date : compte rendu à rendre (alerte 30 jours avant). 2e date : versement attendu, pour la trésorerie.</Info>
        </div>
      </div>

      {enveloppes.length ? (
        <div className="grid gap-4 md:grid-cols-2">
          {enveloppes.map((e, i) => (
            <div key={e.id} className={`${theme.carte} p-5 ${prevu === e.id ? 'md:col-span-2' : ''}`}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-[12px] font-bold uppercase tracking-wide opacity-60" style={{ color: theme.encre }}>
                    {TYPES_ENV[e.type]}
                    {e.financeur ? ` · ${e.financeur}` : ''}
                  </p>
                  <h4 className="text-[16px] font-black" style={{ color: theme.encre }}>
                    {e.nom}
                  </h4>
                </div>
                <a href={`/api/proxy/factures/enveloppes/${e.id}/compte-rendu.xlsx`} className={theme.btnSecondaire} style={{ padding: '6px 10px', fontSize: 12 }}>
                  Compte rendu (Excel)
                </a>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-[11px] uppercase opacity-60" style={{ color: theme.encre }}>
                    Accordé
                  </p>
                  <p className="font-black tabular-nums" style={{ color: theme.encre }}>
                    {e.montantAccorde === null ? 'non fixé' : euros(e.montantAccorde)}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] uppercase opacity-60" style={{ color: theme.encre }}>
                    Engagé
                  </p>
                  <p className="font-black tabular-nums" style={{ color: theme.encre }}>
                    {euros(e.engage)}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] uppercase opacity-60" style={{ color: theme.encre }}>
                    Restant
                  </p>
                  <p className="font-black tabular-nums" style={{ color: e.restant !== null && e.restant < 0 ? '#B91C1C' : theme.primaireFonce }}>
                    {e.restant === null ? 'non fixé' : euros(e.restant)}
                  </p>
                </div>
              </div>
              <div className="mt-3">
                <Jauge pourcentage={e.pourcentage} couleur={PALETTE[i % PALETTE.length]} encre={theme.encre} libelle={`${e.nombreFactures} facture${e.nombreFactures > 1 ? 's' : ''} · ${euros(e.paye)} payés${e.dateJustification ? ` · justification le ${dateCourte(e.dateJustification)}` : ''}`} />
              </div>
              {e.alertes.length ? <p className="mt-2 rounded-lg bg-[#FFF4D6] px-3 py-2 text-[13px] text-[#7A4B00]">{e.alertes.join(' ')}</p> : null}
              <div className="mt-3 flex gap-2">
                <button type="button" className="text-[13px] font-bold underline" style={{ color: theme.primaire }} onClick={() => setEdition(edition === e.id ? null : e.id)}>
                  {edition === e.id ? 'Fermer' : 'Modifier'}
                </button>
                {e.type === 'SUBVENTION' || e.type === 'PROJET' ? (
                  <button type="button" className="text-[13px] font-bold underline" style={{ color: theme.primaire }} onClick={() => setPrevu(prevu === e.id ? null : e.id)}>
                    Prévu / réalisé
                  </button>
                ) : null}
                <button
                  type="button"
                  className="ml-auto text-[13px] font-bold text-[#8A1B3D] underline"
                  onClick={() => {
                    if (window.confirm('Supprimer cette enveloppe ? Les factures restent, elles perdent seulement leur rattachement.')) void agir(() => appel(`/factures/enveloppes/${e.id}`, { method: 'DELETE' }));
                  }}
                >
                  Supprimer
                </button>
              </div>
              {edition === e.id ? <EditionEnveloppe theme={theme} e={e} occupe={occupe} agir={agir} onOk={() => setEdition(null)} /> : null}
              {prevu === e.id ? <PrevuRealise theme={theme} enveloppeId={e.id} onFermer={() => setPrevu(null)} /> : null}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-[14px] opacity-70" style={{ color: theme.encre }}>
          Aucune enveloppe.
        </p>
      )}
    </div>
  );
}

function EditionEnveloppe({ theme, e, occupe, agir, onOk }: { theme: ThemeFactures; e: Enveloppe; occupe: boolean; agir: Agir; onOk: () => void }) {
  const [v, setV] = useState({ nom: e.nom, financeur: e.financeur ?? '', montantAccorde: e.montantAccorde === null ? '' : String(e.montantAccorde), dateJustification: (e.dateJustification ?? '').slice(0, 10), dateVersementPrevu: (e.dateVersementPrevu ?? '').slice(0, 10), notes: e.notes ?? '' });
  const champ = 'rounded-lg border px-2 py-1.5 text-[14px] w-full';
  return (
    <form
      className="mt-3 grid gap-2 border-t pt-3 sm:grid-cols-2"
      style={{ borderColor: theme.bordure }}
      onSubmit={(ev) => {
        ev.preventDefault();
        void agir(async () => {
          await appel(`/factures/enveloppes/${e.id}`, { method: 'PATCH', body: { nom: v.nom, financeur: v.financeur || null, montantAccorde: v.montantAccorde ? Number(v.montantAccorde) : null, dateJustification: v.dateJustification || null, dateVersementPrevu: v.dateVersementPrevu || null, notes: v.notes || null } });
          onOk();
        }, 'Enveloppe mise à jour.');
      }}
    >
      <input className={champ} style={{ borderColor: theme.bordure }} value={v.nom} onChange={(x) => setV({ ...v, nom: x.target.value })} />
      <input className={champ} style={{ borderColor: theme.bordure }} placeholder="Financeur" value={v.financeur} onChange={(x) => setV({ ...v, financeur: x.target.value })} />
      <input className={champ} style={{ borderColor: theme.bordure }} type="number" step="0.01" placeholder="Montant accordé" value={v.montantAccorde} onChange={(x) => setV({ ...v, montantAccorde: x.target.value })} />
      <label className="grid gap-1 text-[12px] font-bold">
        Justification à rendre le
        <input className={champ} style={{ borderColor: theme.bordure }} type="date" value={v.dateJustification} onChange={(x) => setV({ ...v, dateJustification: x.target.value })} />
      </label>
      <label className="grid gap-1 text-[12px] font-bold">
        Versement prévu le
        <input className={champ} style={{ borderColor: theme.bordure }} type="date" value={v.dateVersementPrevu} onChange={(x) => setV({ ...v, dateVersementPrevu: x.target.value })} />
      </label>
      <textarea className={`${champ} sm:col-span-2`} style={{ borderColor: theme.bordure }} placeholder="Notes" value={v.notes} onChange={(x) => setV({ ...v, notes: x.target.value })} />
      <button type="submit" disabled={occupe} className={theme.btnPrimaire} style={{ padding: '8px 14px', fontSize: 13 }}>
        Enregistrer
      </button>
    </form>
  );
}

/* ═══════════════════════ Relevés ═══════════════════════ */

function RelevesVue({ theme, releves, postes, enveloppes, factures, occupe, agir }: { theme: ThemeFactures; releves: Releves | null; postes: readonly string[]; enveloppes: Enveloppe[]; factures: Facture[]; occupe: boolean; agir: Agir }) {
  const fichier = useRef<HTMLInputElement>(null);
  const [filtre, setFiltre] = useState<'tout' | 'sans-facture' | 'sans-poste' | 'recettes'>('tout');
  if (!releves) return <SqueletteVue />;
  const ops = releves.operations.filter((o) => (filtre === 'tout' ? true : filtre === 'recettes' ? o.sens === 'RECETTE' : filtre === 'sans-facture' ? o.sens === 'DEPENSE' && !o.facture : o.sens === 'DEPENSE' && !o.facture && !o.poste));
  const modifierOp = (id: string, corps: Record<string, unknown>) => agir(() => appel(`/factures/releves/operations/${id}`, { method: 'PATCH', body: corps }));
  const candidates = factures.filter((f) => f.statut !== 'PAYEE');
  return (
    <div className="grid gap-5">
      <div className={`${theme.carte} p-5`}>
        <div className="flex flex-wrap items-end gap-3">
          <label className="grid gap-1 text-[14px] font-bold" style={{ color: theme.encre }}>
            Déposer un relevé (CSV ou PDF)
            <input
              ref={fichier}
              type="file"
              accept=".csv,.txt,text/csv,text/plain,application/pdf"
              disabled={occupe}
              className="text-[14px]"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                void agir(async () => {
                  const form = new FormData();
                  form.append('file', f);
                  const r = await appel<{ operations: number; rapprochees: number }>('/factures/releves', { method: 'POST', form });
                  if (fichier.current) fichier.current.value = '';
                  return r;
                }, 'Relevé lu et rapproché.');
              }}
            />
          </label>
          <p className="text-[13px] opacity-70" style={{ color: theme.encre }}>
            Aucune connexion bancaire · pas de doublon
          </p>
        </div>
        {occupe ? (
          <p className="mt-3 text-[14px]" style={{ color: theme.primaire }}>
            Lecture en cours…
          </p>
        ) : null}
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        <Chiffre theme={theme} titre={`Entrées ${releves.annee}`} valeur={euros(releves.resume.recettes)} detail="relevés" />
        <Chiffre theme={theme} titre={`Sorties ${releves.annee}`} valeur={euros(releves.resume.depenses)} detail="relevés" />
        <Chiffre theme={theme} titre="Rapprochées" valeur={String(releves.resume.rapprochees)} detail="avec facture" />
        <Chiffre theme={theme} titre="À classer" valeur={String(releves.resume.sansPoste)} detail="sans facture ni poste" />
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <div className={`${theme.carte} p-5`}>
          <h3 className="mb-3 text-[15px] font-bold" style={{ color: theme.encre }}>
            Recettes par origine
          </h3>
          <Camembert encre={theme.encre} parts={releves.resume.parNature.map((n) => ({ nom: n.nature, valeur: n.total }))} titre="Recettes" />
        </div>
        <div className={`${theme.carte} p-5`}>
          <h3 className="mb-3 text-[15px] font-bold" style={{ color: theme.encre }}>
            Relevés déposés
          </h3>
          <ul className="grid gap-1 text-[13px]" style={{ color: theme.encre }}>
            {releves.releves.map((rl) => (
              <li key={rl.id} className="flex items-center gap-2">
                <span className="min-w-0 flex-1 truncate">{rl.libelle}</span>
                <span className="opacity-70">
                  {dateCourte(rl.periodeDebut)} → {dateCourte(rl.periodeFin)}
                </span>
                <span className="tabular-nums opacity-70">{rl.nbOperations} lignes</span>
                <button
                  type="button"
                  className="text-[12px] text-[#8A1B3D] underline"
                  onClick={() => {
                    if (window.confirm('Retirer ce relevé et ses lignes ?')) void agir(() => appel(`/factures/releves/${rl.id}`, { method: 'DELETE' }));
                  }}
                >
                  retirer
                </button>
              </li>
            ))}
            {!releves.releves.length ? <li className="opacity-70">Aucun relevé déposé.</li> : null}
          </ul>
        </div>
      </div>

      <div className={`${theme.carte} overflow-x-auto`}>
        <div className="flex flex-wrap gap-1 p-3">
          {(
            [
              ['tout', 'Tout'],
              ['sans-facture', 'Sorties sans facture'],
              ['sans-poste', 'À classer'],
              ['recettes', 'Recettes'],
            ] as const
          ).map(([k, l]) => (
            <button key={k} type="button" onClick={() => setFiltre(k)} className="rounded-lg px-3 py-1 text-[12px] font-bold" style={{ background: filtre === k ? theme.primaire : theme.fond, color: filtre === k ? '#fff' : theme.encre }}>
              {l}
            </button>
          ))}
        </div>
        <table className="w-full min-w-[720px] text-[13px]" style={{ color: theme.encre }}>
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wide opacity-70">
              <th className="p-2">Date</th>
              <th className="p-2">Libellé</th>
              <th className="p-2 text-right">Montant</th>
              <th className="p-2">Poste ou nature</th>
              <th className="p-2">Enveloppe</th>
              <th className="p-2">Facture</th>
            </tr>
          </thead>
          <tbody>
            {ops.slice(0, 400).map((o) => (
              <tr key={o.id} className="border-t" style={{ borderColor: theme.bordure }}>
                <td className="whitespace-nowrap p-2">{dateCourte(o.date)}</td>
                <td className="max-w-[320px] truncate p-2" title={o.libelle}>
                  {o.libelle}
                </td>
                <td className="p-2 text-right font-bold tabular-nums" style={{ color: o.sens === 'RECETTE' ? '#0F5F3E' : theme.encre }}>
                  {euros(o.montant, 2)}
                </td>
                <td className="p-2">
                  {o.sens === 'DEPENSE' && !o.facture ? (
                    <select value={o.poste ?? ''} disabled={occupe} onChange={(e) => void modifierOp(o.id, { poste: e.target.value || null })} className="rounded border px-1 py-0.5 text-[12px]" style={{ borderColor: theme.bordure }}>
                      <option value="">À classer</option>
                      {postes.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  ) : (
                    o.poste ?? ''
                  )}
                </td>
                <td className="p-2">
                  {o.sens === 'DEPENSE' ? (
                    <select value={o.enveloppeId ?? ''} disabled={occupe} onChange={(e) => void modifierOp(o.id, { enveloppeId: e.target.value || null })} className="rounded border px-1 py-0.5 text-[12px]" style={{ borderColor: theme.bordure }}>
                      <option value="">Aucune</option>
                      {enveloppes.map((x) => (
                        <option key={x.id} value={x.id}>
                          {x.nom}
                        </option>
                      ))}
                    </select>
                  ) : (
                    ''
                  )}
                </td>
                <td className="p-2">
                  {o.facture ? (
                    <span className="text-[12px]">
                      {o.facture.fournisseur} {o.facture.numero ?? ''}{' '}
                      <button type="button" className="ml-1 underline opacity-70" onClick={() => void modifierOp(o.id, { factureId: null })}>
                        détacher
                      </button>
                    </span>
                  ) : o.sens === 'DEPENSE' ? (
                    <select
                      value=""
                      disabled={occupe}
                      onChange={(e) => {
                        if (e.target.value) void modifierOp(o.id, { factureId: e.target.value });
                      }}
                      className="rounded border px-1 py-0.5 text-[12px]"
                      style={{ borderColor: theme.bordure }}
                    >
                      <option value="">Relier à une facture…</option>
                      {candidates
                        .filter((f) => Math.abs(f.montantTTC - Math.abs(o.montant)) < 50)
                        .map((f) => (
                          <option key={f.id} value={f.id}>
                            {f.fournisseur} · {euros(f.montantTTC, 2)}
                          </option>
                        ))}
                    </select>
                  ) : (
                    ''
                  )}
                </td>
              </tr>
            ))}
            {!ops.length ? (
              <tr>
                <td colSpan={6} className="p-4 text-center opacity-70">
                  Rien dans cette vue.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ═══════════════════════ Fournisseurs ═══════════════════════ */

function FournisseursVue({ theme, data }: { theme: ThemeFactures; data: Fournisseurs | null }) {
  if (!data) return <SqueletteVue />;
  return (
    <div className="grid gap-5">
      <div className={`${theme.carte} p-5`}>
        <div className="mb-3 flex items-center gap-2">
          <h3 className="text-[15px] font-bold" style={{ color: theme.encre }}>
            Comparatif sur 12 mois
          </h3>
          <Info theme={theme}>Coût par fournisseur, évolution et prix unitaire moyen, d’après vos factures.</Info>
        </div>
        {data.comparatif.length ? (
          <div className="grid gap-4 md:grid-cols-2">
            {data.comparatif.map((p) => (
              <div key={p.poste} className="rounded-xl border p-4" style={{ borderColor: theme.bordure }}>
                <div className="mb-2 flex items-baseline justify-between">
                  <b style={{ color: theme.encre }}>{p.poste}</b>
                  <span className="tabular-nums" style={{ color: theme.encre }}>
                    {euros(p.total)}
                  </span>
                </div>
                <Camembert encre={theme.encre} taille={130} parts={p.fournisseurs.map((f) => ({ nom: f.fournisseur, valeur: f.total }))} />
                <table className="mt-2 w-full text-[12px]" style={{ color: theme.encre }}>
                  <tbody>
                    {p.fournisseurs.map((f) => (
                      <tr key={f.fournisseur} className="border-t" style={{ borderColor: theme.bordure }}>
                        <td className="py-1 pr-2">
                          {f.fournisseur}
                          {f.etat === 'C' ? <span className="ml-1 rounded bg-[#FDE7EC] px-1 text-[10px] font-bold text-[#8A1B3D]">SIRET fermé</span> : null}
                        </td>
                        <td className="py-1 pr-2 text-right opacity-70">{f.nombre} fact.</td>
                        <td className="py-1 pr-2 text-right" style={{ color: f.evolutionPct !== null && f.evolutionPct >= 20 ? '#B91C1C' : undefined }}>
                          {f.evolutionPct === null ? '' : `${f.evolutionPct > 0 ? '+' : ''}${f.evolutionPct} %`}
                        </td>
                        <td className="py-1 text-right opacity-70">{f.prixUnitaireMoyen === null ? '' : `${euros(f.prixUnitaireMoyen, 2)} l’unité`}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[13px] opacity-70" style={{ color: theme.encre }}>
            Pas encore de factures sur 12 mois.
          </p>
        )}
      </div>
      <div className={`${theme.carte} overflow-x-auto`}>
        <table className="w-full min-w-[640px] text-[13px]" style={{ color: theme.encre }}>
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wide opacity-70">
              <th className="p-3">Fournisseur</th>
              <th className="p-3">SIRET</th>
              <th className="p-3">Annuaire des entreprises</th>
              <th className="p-3">RIB connu</th>
            </tr>
          </thead>
          <tbody>
            {data.fiches.map((f) => (
              <tr key={f.id} className="border-t" style={{ borderColor: theme.bordure }}>
                <td className="p-3 font-bold">{f.nom}</td>
                <td className="p-3 tabular-nums">{f.siret ?? <span className="opacity-50">non lu</span>}</td>
                <td className="p-3">
                  {f.etat === 'A' ? (
                    <span className="rounded-full bg-[#E3F5EC] px-2 py-0.5 text-[12px] font-bold text-[#0F5F3E]">Actif{f.nomAnnuaire ? ` · ${f.nomAnnuaire}` : ''}</span>
                  ) : f.etat === 'C' ? (
                    <span className="rounded-full bg-[#FDE7EC] px-2 py-0.5 text-[12px] font-bold text-[#8A1B3D]">Fermé</span>
                  ) : (
                    <span className="opacity-50">non vérifié</span>
                  )}
                </td>
                <td className="p-3">{f.ibanFin ? `…${f.ibanFin}` : <span className="opacity-50">aucun</span>}</td>
              </tr>
            ))}
            {!data.fiches.length ? (
              <tr>
                <td colSpan={4} className="p-4 text-center opacity-70">
                  Aucun fournisseur.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ═══════════════════════ Notes de frais ═══════════════════════ */

const NOTE_VIDE = { beneficiaire: '', date: '', objet: '', montant: '', poste: '', enveloppeId: '', abandon: false };

function NotesDeFrais({ theme, frais, postes, enveloppes, occupe, agir }: { theme: ThemeFactures; frais: Frais | null; postes: readonly string[]; enveloppes: Enveloppe[]; occupe: boolean; agir: Agir }) {
  const [v, setV] = useState(NOTE_VIDE);
  const fichier = useRef<HTMLInputElement>(null);
  const champ = 'rounded-lg border px-2 py-1.5 text-[14px]';
  if (!frais) return <SqueletteVue />;
  const statut = (id: string, s: string) => agir(() => appel(`/factures/frais/${id}/statut`, { method: 'PATCH', body: { statut: s } }));
  return (
    <div className="grid gap-5">
      <div className={`${theme.carte} p-5`}>
        <div className="mb-3 flex items-center gap-2">
          <h3 className="text-[15px] font-bold" style={{ color: theme.encre }}>
            Nouvelle note de frais
          </h3>
          <Info theme={theme}>« Abandon de frais » : la personne renonce au remboursement. L’association vérifie son droit au reçu fiscal.</Info>
        </div>
        <form
          className="grid gap-2 sm:grid-cols-4"
          onSubmit={(e) => {
            e.preventDefault();
            void agir(async () => {
              const form = new FormData();
              form.append('beneficiaire', v.beneficiaire);
              form.append('date', v.date);
              form.append('objet', v.objet);
              form.append('montant', v.montant);
              if (v.poste) form.append('poste', v.poste);
              if (v.enveloppeId) form.append('enveloppeId', v.enveloppeId);
              form.append('abandon', v.abandon ? 'true' : 'false');
              const f = fichier.current?.files?.[0];
              if (f) form.append('file', f);
              await appel('/factures/frais', { method: 'POST', form });
              setV(NOTE_VIDE);
              if (fichier.current) fichier.current.value = '';
            }, 'Note de frais déposée.');
          }}
        >
          <input required placeholder="Bénéficiaire" className={champ} style={{ borderColor: theme.bordure }} value={v.beneficiaire} onChange={(e) => setV({ ...v, beneficiaire: e.target.value })} />
          <input required type="date" className={champ} style={{ borderColor: theme.bordure }} value={v.date} onChange={(e) => setV({ ...v, date: e.target.value })} />
          <input required placeholder="Objet (ex. train, réunion CAF)" className={`${champ} sm:col-span-2`} style={{ borderColor: theme.bordure }} value={v.objet} onChange={(e) => setV({ ...v, objet: e.target.value })} />
          <input required type="number" step="0.01" min="0.01" placeholder="Montant" className={champ} style={{ borderColor: theme.bordure }} value={v.montant} onChange={(e) => setV({ ...v, montant: e.target.value })} />
          <select className={champ} style={{ borderColor: theme.bordure }} value={v.poste} onChange={(e) => setV({ ...v, poste: e.target.value })}>
            <option value="">Poste</option>
            {postes.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          <select className={champ} style={{ borderColor: theme.bordure }} value={v.enveloppeId} onChange={(e) => setV({ ...v, enveloppeId: e.target.value })}>
            <option value="">Enveloppe</option>
            {enveloppes.map((x) => (
              <option key={x.id} value={x.id}>
                {x.nom}
              </option>
            ))}
          </select>
          <input ref={fichier} type="file" accept="image/jpeg,image/png,image/webp,application/pdf" className="text-[13px]" />
          <label className="flex items-center gap-2 text-[13px]" style={{ color: theme.encre }}>
            <input type="checkbox" checked={v.abandon} onChange={(e) => setV({ ...v, abandon: e.target.checked })} /> Abandon de frais (don en nature)
          </label>
          <button type="submit" disabled={occupe} className={theme.btnPrimaire} style={{ padding: '8px 14px', fontSize: 13 }}>
            Déposer
          </button>
        </form>
      </div>
      <div className="grid gap-3 sm:grid-cols-4">
        <Chiffre theme={theme} titre="À valider" valeur={euros(frais.resume.aValider)} detail="notes déposées" />
        <Chiffre theme={theme} titre="À rembourser" valeur={euros(frais.resume.aRembourser)} detail="validées, non payées" />
        <Chiffre theme={theme} titre="Remboursé" valeur={euros(frais.resume.rembourse)} detail={`en ${frais.annee}`} />
        <Chiffre theme={theme} titre="Abandons de frais" valeur={euros(frais.resume.abandonne)} detail="dons en nature" />
      </div>
      <div className={`${theme.carte} overflow-x-auto`}>
        <table className="w-full min-w-[720px] text-[13px]" style={{ color: theme.encre }}>
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wide opacity-70">
              <th className="p-3">Date</th>
              <th className="p-3">Bénéficiaire</th>
              <th className="p-3">Objet</th>
              <th className="p-3 text-right">Montant</th>
              <th className="p-3">Statut</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {frais.notes.map((n) => (
              <tr key={n.id} className="border-t" style={{ borderColor: theme.bordure }}>
                <td className="whitespace-nowrap p-3">{dateCourte(n.date)}</td>
                <td className="p-3 font-bold">{n.beneficiaire}</td>
                <td className="p-3">
                  {n.objet}
                  {n.poste ? <span className="ml-1 opacity-60">· {n.poste}</span> : null}
                </td>
                <td className="p-3 text-right font-bold tabular-nums">{euros(n.montant, 2)}</td>
                <td className="p-3">
                  {STATUTS_NOTE[n.statut]}
                  {n.recuNumero ? <span className="ml-1 opacity-70">reçu {n.recuNumero}</span> : null}
                </td>
                <td className="p-3">
                  <div className="flex flex-wrap gap-1">
                    {n.statut === 'A_VALIDER' ? (
                      <>
                        <button type="button" disabled={occupe} className="rounded px-2 py-0.5 text-[12px] font-bold text-white" style={{ background: theme.primaire }} onClick={() => void statut(n.id, n.abandon ? 'ABANDONNEE' : 'VALIDEE')}>
                          {n.abandon ? 'Valider l’abandon' : 'Valider'}
                        </button>
                        <button type="button" disabled={occupe} className="rounded px-2 py-0.5 text-[12px] font-bold text-[#8A1B3D] underline" onClick={() => void statut(n.id, 'REFUSEE')}>
                          Refuser
                        </button>
                      </>
                    ) : null}
                    {n.statut === 'VALIDEE' && !n.abandon ? (
                      <button type="button" disabled={occupe} className="rounded px-2 py-0.5 text-[12px] font-bold text-white" style={{ background: '#1E9E6A' }} onClick={() => void statut(n.id, 'REMBOURSEE')}>
                        Marquer remboursée
                      </button>
                    ) : null}
                    {n.fileId ? (
                      <a href={`/api/proxy/files/${n.fileId}`} target="_blank" rel="noopener" className="text-[12px] underline">
                        Justificatif
                      </a>
                    ) : null}
                    {n.statut === 'A_VALIDER' || n.statut === 'REFUSEE' ? (
                      <button
                        type="button"
                        disabled={occupe}
                        className="text-[12px] text-[#8A1B3D] underline"
                        onClick={() => {
                          if (window.confirm('Supprimer cette note ?')) void agir(() => appel(`/factures/frais/${n.id}`, { method: 'DELETE' }));
                        }}
                      >
                        Supprimer
                      </button>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
            {!frais.notes.length ? (
              <tr>
                <td colSpan={6} className="p-4 text-center opacity-70">
                  Aucune note de frais en {frais.annee}.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ═══════════════════════ Journal et réglages ═══════════════════════ */

function JournalVue({ theme, journal, seuil, occupe, agir }: { theme: ThemeFactures; journal: Journal | null; seuil: number | null; occupe: boolean; agir: Agir }) {
  const [s, setS] = useState(seuil === null ? '' : String(seuil));
  return (
    <div className="grid gap-5">
      <div className={`${theme.carte} p-5`}>
        <h3 className="text-[15px] font-bold" style={{ color: theme.encre }}>
          Validation à deux
        </h3>
        <p className="mb-3 text-[13px] opacity-70" style={{ color: theme.encre }}>
          Au-dessus de ce montant TTC, une facture demande deux personnes différentes avant d’être validée (trésorier puis président, par exemple). Vide : jamais.
        </p>
        <form
          className="flex flex-wrap items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            void agir(() => appel('/factures/reglages', { method: 'PATCH', body: { seuilDoubleValidation: s === '' ? null : Number(s) } }), 'Réglage enregistré.');
          }}
        >
          <input type="number" step="0.01" min="0" placeholder="Seuil en euros" className="rounded-lg border px-2 py-1.5 text-[14px]" style={{ borderColor: theme.bordure }} value={s} onChange={(e) => setS(e.target.value)} />
          <button type="submit" disabled={occupe} className={theme.btnPrimaire} style={{ padding: '8px 14px', fontSize: 13 }}>
            Enregistrer
          </button>
        </form>
      </div>
      <div className={`${theme.carte} p-5`}>
        <div className="mb-3 flex items-center gap-2">
          <h3 className="text-[15px] font-bold" style={{ color: theme.encre }}>
            Journal
          </h3>
          <Info theme={theme}>Qui a fait quoi, quand. Non modifiable.</Info>
        </div>
        <ul className="grid gap-1 text-[13px]" style={{ color: theme.encre }}>
          {(journal ?? []).map((l) => (
            <li key={l.id} className="flex flex-wrap gap-2 border-t py-1" style={{ borderColor: theme.bordure }}>
              <span className="whitespace-nowrap tabular-nums opacity-70">{new Date(l.le).toLocaleString('fr-FR')}</span>
              <b>{l.par}</b>
              <span>{l.action.replace(/[.-]/g, ' ')}</span>
              {l.detail ? (
                <span className="opacity-70">
                  {Object.entries(l.detail)
                    .map(([k, val]) => `${k} : ${typeof val === 'number' && /montant/i.test(k) ? euros(val, 2) : String(val)}`)
                    .join(', ')}
                </span>
              ) : null}
            </li>
          ))}
          {journal && !journal.length ? <li className="opacity-70">Rien encore.</li> : null}
        </ul>
      </div>
    </div>
  );
}

/* ═══════════════════════ Dépôt par e-mail ═══════════════════════ */

function DepotEmail({ theme, depot, occupe, agir }: { theme: ThemeFactures; depot: Depot | null; occupe: boolean; agir: Agir }) {
  const [copie, setCopie] = useState(false);
  if (!depot) return null;
  const copier = async () => {
    if (!depot.adresse) return;
    try {
      await navigator.clipboard.writeText(depot.adresse);
      setCopie(true);
      setTimeout(() => setCopie(false), 2000);
    } catch {
      setCopie(false);
    }
  };
  return (
    <div className={`${theme.carte} p-5`}>
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="text-[15px] font-bold" style={{ color: theme.encre }}>
            Dépôt par e-mail
          </h3>
          {!depot.enService ? (
            <p className="mt-1 text-[13px] opacity-70" style={{ color: theme.encre }}>
              Bientôt disponible.
            </p>
          ) : depot.adresse ? (
            <p className="mt-1 text-[13px]" style={{ color: theme.encre }}>
              Adresse à donner aux fournisseurs :
              <br />
              <code className="mt-1 inline-block rounded-lg px-2 py-1 text-[14px] font-bold" style={{ background: theme.fond, color: theme.primaireFonce }}>
                {depot.adresse}
              </code>
            </p>
          ) : (
            <p className="mt-1 text-[13px] opacity-70" style={{ color: theme.encre }}>
              Une adresse privée, renouvelable.
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {depot.enService && depot.adresse ? (
            <>
              <button type="button" className={theme.btnSecondaire} onClick={() => void copier()}>
                {copie ? 'Copiée' : 'Copier l’adresse'}
              </button>
              <button type="button" disabled={occupe} className={theme.btnSecondaire} onClick={() => { if (window.confirm('Renouveler l’adresse ? L’ancienne cessera de fonctionner.')) void agir(() => appel('/factures/depot/activer?renouveler=1', { method: 'POST' }), 'Nouvelle adresse créée.'); }}>
                Renouveler
              </button>
              <button type="button" disabled={occupe} className="text-[13px] font-bold text-[#8A1B3D] underline" onClick={() => void agir(() => appel('/factures/depot/desactiver', { method: 'POST' }), 'Dépôt par e-mail désactivé.')}>
                Désactiver
              </button>
            </>
          ) : depot.enService ? (
            <button type="button" disabled={occupe} className={theme.btnPrimaire} onClick={() => void agir(() => appel('/factures/depot/activer', { method: 'POST' }), 'Adresse de dépôt créée.')}>
              Activer
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════ Devis ═══════════════════════ */

const DEVIS_VIDE = { fournisseur: '', montantTTC: '', reference: '', dateDevis: '', dateValidite: '', poste: '' };

function DevisVue({ theme, data, postes, factures, occupe, agir }: { theme: ThemeFactures; data: DevisCharge | null; postes: readonly string[]; factures: Facture[]; occupe: boolean; agir: Agir }) {
  const fichier = useRef<HTMLInputElement>(null);
  const [saisie, setSaisie] = useState(false);
  const [v, setV] = useState(DEVIS_VIDE);
  const [ouvert, setOuvert] = useState<string | null>(null);
  const champ = 'rounded-lg border px-2 py-1.5 text-[14px]';
  if (!data) return <SqueletteVue />;
  const modifier = (id: string, corps: Record<string, unknown>, msg?: string) => agir(() => appel(`/factures/devis/${id}`, { method: 'PATCH', body: corps }), msg);
  return (
    <div className="grid gap-5">
      <div className={`${theme.carte} p-5`}>
        <div className="flex flex-wrap items-end gap-3">
          <label className="grid gap-1 text-[14px] font-bold" style={{ color: theme.encre }}>
            Déposer un devis accepté
            <input
              ref={fichier}
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              disabled={occupe}
              className="text-[14px]"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                void agir(async () => {
                  const form = new FormData();
                  form.append('file', f);
                  const d = await appel<Devis>('/factures/devis', { method: 'POST', form });
                  setOuvert(d.id);
                  if (fichier.current) fichier.current.value = '';
                }, 'Devis lu.');
              }}
            />
          </label>
          <Info theme={theme}>Un devis = une dépense engagée. La facture lui sera comparée.</Info>
          <button type="button" className={`${theme.btnSecondaire} ml-auto`} onClick={() => setSaisie(!saisie)}>
            Saisie manuelle
          </button>
        </div>
        {occupe ? (
          <p className="mt-3 text-[14px]" style={{ color: theme.primaire }}>
            Lecture en cours…
          </p>
        ) : null}
        {saisie ? (
          <form
            className="mt-4 grid gap-2 border-t pt-4 sm:grid-cols-7"
            style={{ borderColor: theme.bordure }}
            onSubmit={(e) => {
              e.preventDefault();
              void agir(async () => {
                await appel('/factures/devis/saisie', { method: 'POST', body: { fournisseur: v.fournisseur, montantTTC: Number(v.montantTTC), reference: v.reference || undefined, dateDevis: v.dateDevis || undefined, dateValidite: v.dateValidite || undefined, poste: v.poste || undefined } });
                setV(DEVIS_VIDE);
                setSaisie(false);
              }, 'Devis enregistré.');
            }}
          >
            <input required placeholder="Fournisseur" className={champ} style={{ borderColor: theme.bordure }} value={v.fournisseur} onChange={(e) => setV({ ...v, fournisseur: e.target.value })} />
            <input required type="number" step="0.01" min="0" placeholder="TTC" className={champ} style={{ borderColor: theme.bordure }} value={v.montantTTC} onChange={(e) => setV({ ...v, montantTTC: e.target.value })} />
            <input placeholder="Référence" className={champ} style={{ borderColor: theme.bordure }} value={v.reference} onChange={(e) => setV({ ...v, reference: e.target.value })} />
            <input type="date" title="Date du devis" className={champ} style={{ borderColor: theme.bordure }} value={v.dateDevis} onChange={(e) => setV({ ...v, dateDevis: e.target.value })} />
            <input type="date" title="Valable jusqu’au" className={champ} style={{ borderColor: theme.bordure }} value={v.dateValidite} onChange={(e) => setV({ ...v, dateValidite: e.target.value })} />
            <select className={champ} style={{ borderColor: theme.bordure }} value={v.poste} onChange={(e) => setV({ ...v, poste: e.target.value })}>
              <option value="">Poste</option>
              {postes.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
            <button type="submit" disabled={occupe} className={theme.btnPrimaire} style={{ padding: '8px 14px', fontSize: 13 }}>
              Enregistrer
            </button>
          </form>
        ) : null}
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        <Chiffre theme={theme} titre="En attente" valeur={String(data.resume.enAttente)} detail="acceptés, pas encore facturés" />
        <Chiffre theme={theme} titre="Engagé" valeur={euros(data.resume.engageSansFacture)} detail="montant des devis en attente" />
        <Chiffre theme={theme} titre="Périmés" valeur={String(data.resume.perimes)} detail="validité dépassée sans facture" ton={data.resume.perimes ? '#B91C1C' : undefined} />
        <Chiffre theme={theme} titre="Écarts" valeur={String(data.resume.ecarts)} detail="factures qui s’écartent du devis" ton={data.resume.ecarts ? '#7A4B00' : undefined} />
      </div>

      <div className={`${theme.carte} overflow-x-auto`}>
        <table className="w-full min-w-[720px] text-[14px]" style={{ color: theme.encre }}>
          <thead>
            <tr className="text-left text-[12px] uppercase tracking-wide opacity-70">
              <th className="p-3">Date</th>
              <th className="p-3">Fournisseur</th>
              <th className="p-3">Référence</th>
              <th className="p-3 text-right">TTC</th>
              <th className="p-3">Statut</th>
              <th className="p-3">Facture</th>
            </tr>
          </thead>
          <tbody>
            {!data.devis.length ? (
              <tr>
                <td colSpan={6} className="p-5 text-center opacity-70">
                  Aucun devis.
                </td>
              </tr>
            ) : null}
            {data.devis.map((d) => (
              <Fragment key={d.id}>
                <tr className="cursor-pointer border-t hover:bg-black/[0.02]" style={{ borderColor: theme.bordure }} onClick={() => setOuvert(ouvert === d.id ? null : d.id)}>
                  <td className="whitespace-nowrap p-3">{dateCourte(d.dateDevis) || dateCourte(d.deposeLe)}</td>
                  <td className="p-3 font-bold">
                    {d.fournisseur}
                    {d.perime ? <span className="ml-2 rounded-full bg-[#FDE7EC] px-2 py-0.5 text-[12px] font-bold text-[#8A1B3D]">périmé</span> : null}
                  </td>
                  <td className="p-3">{d.reference ?? <span className="opacity-50">·</span>}</td>
                  <td className="p-3 text-right font-bold tabular-nums">{euros(d.montantTTC, 2)}</td>
                  <td className="p-3">
                    <span className={`rounded-full px-2 py-0.5 text-[12px] font-bold ${d.statut === 'FACTURE' ? 'bg-[#E3F5EC] text-[#0F5F3E]' : d.statut === 'ANNULE' ? 'bg-black/5 opacity-70' : 'bg-[#ECEBFC] text-[#1D1B5C]'}`}>{STATUTS_DEVIS[d.statut]}</span>
                  </td>
                  <td className="p-3">
                    {d.facture ? (
                      <span>
                        {euros(d.facture.montantTTC, 2)}
                        {d.ecartPct !== null && d.ecartPct !== 0 ? (
                          <span className="ml-1 rounded-full px-2 py-0.5 text-[11px] font-bold" style={{ background: Math.abs(d.ecartPct) > 2 ? '#FFF4D6' : '#E3F5EC', color: Math.abs(d.ecartPct) > 2 ? '#7A4B00' : '#0F5F3E' }}>
                            {d.ecartPct > 0 ? '+' : ''}
                            {d.ecartPct} %
                          </span>
                        ) : null}
                      </span>
                    ) : (
                      <span className="opacity-50">en attente</span>
                    )}
                  </td>
                </tr>
                {ouvert === d.id ? (
                  <tr className="border-t" style={{ borderColor: theme.bordure, background: theme.fond }}>
                    <td colSpan={6} className="p-4">
                      {d.alerte ? <p className="mb-3 rounded-lg bg-[#FDE7EC] px-3 py-2 text-[13px] text-[#8A1B3D]">{d.alerte}</p> : null}
                      <p className="text-[13px] opacity-80">
                        {d.dateValidite ? `Valable jusqu’au ${dateCourte(d.dateValidite)}. ` : ''}
                        {d.montantHT !== null ? `HT ${euros(d.montantHT, 2)}` : ''}
                        {d.tva !== null ? ` · TVA ${euros(d.tva, 2)}` : ''}
                        {d.poste ? ` · ${d.poste}` : ''}
                      </p>
                      {d.lignes.length ? (
                        <table className="mt-2 w-full text-[13px]">
                          <tbody>
                            {d.lignes.map((l, i) => (
                              <tr key={i} className="border-t" style={{ borderColor: theme.bordure }}>
                                <td className="py-1 pr-2">{l.libelle}</td>
                                <td className="py-1 pr-2 text-right opacity-70">{l.quantite ?? ''}</td>
                                <td className="py-1 text-right font-bold">{l.total !== null ? euros(l.total, 2) : ''}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : null}
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        {d.statut === 'EN_ATTENTE' ? (
                          <label className="flex items-center gap-2 text-[13px]">
                            Rapprocher d’une facture
                            <select
                              className="rounded-lg border px-2 py-1 text-[13px]"
                              style={{ borderColor: theme.bordure }}
                              defaultValue=""
                              onChange={(e) => {
                                if (e.target.value) void modifier(d.id, { factureId: e.target.value }, 'Devis rapproché de la facture.');
                              }}
                            >
                              <option value="">Choisir…</option>
                              {factures
                                .filter((f) => !f.devis)
                                .map((f) => (
                                  <option key={f.id} value={f.id}>
                                    {f.fournisseur} · {euros(f.montantTTC, 2)} · {dateCourte(f.dateFacture) || dateCourte(f.deposeLe)}
                                  </option>
                                ))}
                            </select>
                          </label>
                        ) : null}
                        {d.statut === 'FACTURE' ? (
                          <button type="button" disabled={occupe} className={theme.btnSecondaire} onClick={() => void modifier(d.id, { factureId: null }, 'Rapprochement retiré.')}>
                            Détacher de la facture
                          </button>
                        ) : null}
                        {d.statut === 'EN_ATTENTE' ? (
                          <button type="button" disabled={occupe} className={theme.btnSecondaire} onClick={() => void modifier(d.id, { statut: 'ANNULE' }, 'Devis annulé.')}>
                            Annuler ce devis
                          </button>
                        ) : d.statut === 'ANNULE' ? (
                          <button type="button" disabled={occupe} className={theme.btnSecondaire} onClick={() => void modifier(d.id, { statut: 'EN_ATTENTE' })}>
                            Remettre en attente
                          </button>
                        ) : null}
                        {d.fileId ? (
                          <a href={`/api/proxy/files/${d.fileId}`} target="_blank" rel="noopener" className={theme.btnSecondaire}>
                            Voir le fichier
                          </a>
                        ) : null}
                        <button
                          type="button"
                          disabled={occupe}
                          className="ml-auto text-[13px] font-bold text-[#8A1B3D] underline"
                          onClick={() => {
                            if (window.confirm('Supprimer ce devis ?')) void agir(() => appel(`/factures/devis/${d.id}`, { method: 'DELETE' }));
                          }}
                        >
                          Supprimer
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : null}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ═══════════════════════ Trésorerie prévisionnelle ═══════════════════════ */

function TresorerieVue({ theme, t, occupe, agir }: { theme: ThemeFactures; t: Tresorerie | null; occupe: boolean; agir: Agir }) {
  const [solde, setSolde] = useState('');
  const [au, setAu] = useState(new Date().toISOString().slice(0, 10));
  if (!t) return <SqueletteVue />;
  return (
    <div className="grid gap-5">
      {t.alertes.map((a) => (
        <Bandeau key={a} ton={/sous zéro/.test(a) ? 'alerte' : 'info'}>
          {a}
        </Bandeau>
      ))}
      <div className="grid gap-3 sm:grid-cols-4">
        <Chiffre theme={theme} titre="Aujourd’hui" valeur={euros(t.soldeAujourdhui)} detail={t.depart ? `depuis le ${dateCourte(t.depart.au)}` : 'sans solde de départ'} />
        <Chiffre theme={theme} titre="Point bas" valeur={euros(t.pointBas.montant)} detail={`semaine du ${dateCourte(t.pointBas.date)}`} ton={t.pointBas.montant < 0 ? '#B91C1C' : undefined} />
        <Chiffre theme={theme} titre="Dans 13 semaines" valeur={euros(t.soldeFin)} detail={`+${euros(t.totalEntrees)} / −${euros(t.totalSorties)}`} ton={t.soldeFin < 0 ? '#B91C1C' : undefined} />
        <div className={`${theme.carte} p-4`}>
          <p className="text-[12px] font-bold uppercase tracking-wide opacity-70" style={{ color: theme.encre }}>
            Solde en banque
          </p>
          <form
            className="mt-2 grid gap-1"
            onSubmit={(e) => {
              e.preventDefault();
              void agir(() => appel('/factures/reglages', { method: 'PATCH', body: { soldeBancaire: solde === '' ? null : Number(solde), soldeBancaireAu: au || null } }), 'Solde enregistré.');
            }}
          >
            <input type="number" step="0.01" placeholder="Solde du compte" className="rounded-lg border px-2 py-1 text-[13px]" style={{ borderColor: theme.bordure }} value={solde} onChange={(e) => setSolde(e.target.value)} />
            <input type="date" className="rounded-lg border px-2 py-1 text-[13px]" style={{ borderColor: theme.bordure }} value={au} onChange={(e) => setAu(e.target.value)} />
            <button type="submit" disabled={occupe} className={theme.btnSecondaire} style={{ padding: '6px 10px', fontSize: 12 }}>
              Enregistrer
            </button>
          </form>
        </div>
      </div>

      <div className={`${theme.carte} p-5`}>
        <div className="mb-3 flex items-center gap-2">
          <h3 className="text-[15px] font-bold" style={{ color: theme.encre }}>
            Solde par semaine
          </h3>
          <Info theme={theme}>Engagements déjà pris, pas une prédiction : factures, frais, devis, charges récurrentes, subventions datées.</Info>
        </div>
        <Courbe encre={theme.encre} couleur={theme.primaire} points={t.semaines.map((s) => ({ etiquette: dateCourte(s.debut).slice(0, 6), valeur: s.solde }))} hauteur={200} />
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[520px] text-[13px]" style={{ color: theme.encre }}>
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wide opacity-70">
                <th className="p-2">Semaine</th>
                <th className="p-2 text-right">Entrées</th>
                <th className="p-2 text-right">Sorties</th>
                <th className="p-2 text-right">Solde</th>
              </tr>
            </thead>
            <tbody>
              {t.semaines.map((s) => (
                <tr key={s.debut} className="border-t" style={{ borderColor: theme.bordure }}>
                  <td className="p-2">
                    {dateCourte(s.debut)} → {dateCourte(s.fin)}
                  </td>
                  <td className="p-2 text-right tabular-nums text-[#0F5F3E]">{s.entrees ? euros(s.entrees) : '·'}</td>
                  <td className="p-2 text-right tabular-nums text-[#B91C1C]">{s.sorties ? euros(s.sorties) : '·'}</td>
                  <td className="p-2 text-right font-bold tabular-nums" style={{ color: s.solde < 0 ? '#B91C1C' : theme.primaireFonce }}>
                    {euros(s.solde)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <div className={`${theme.carte} p-5`}>
          <h3 className="mb-3 text-[15px] font-bold" style={{ color: theme.encre }}>
            Les mouvements attendus
          </h3>
          <ul className="grid gap-1 text-[13px]" style={{ color: theme.encre }}>
            {t.mouvements.map((m, i) => (
              <li key={i} className="flex items-center gap-2 border-t py-1" style={{ borderColor: theme.bordure }}>
                <span className="w-[72px] shrink-0 tabular-nums opacity-70">{dateCourte(m.date)}</span>
                <span className="min-w-0 flex-1 truncate" title={TYPES_MOUVEMENT[m.type]}>
                  {m.libelle}
                  {!m.certain ? <span className="ml-1 text-[11px] opacity-60">estimé</span> : null}
                </span>
                <b className="tabular-nums" style={{ color: m.montant < 0 ? '#B91C1C' : '#0F5F3E' }}>
                  {m.montant > 0 ? '+' : ''}
                  {euros(m.montant)}
                </b>
              </li>
            ))}
            {!t.mouvements.length ? <li className="opacity-70">Aucun mouvement connu sur 90 jours.</li> : null}
          </ul>
        </div>
        <div className="grid gap-5">
          <div className={`${theme.carte} p-5`}>
            <h3 className="mb-3 text-[15px] font-bold" style={{ color: theme.encre }}>
              Charges récurrentes
            </h3>
            <ul className="grid gap-1 text-[13px]" style={{ color: theme.encre }}>
              {t.recurrents.map((r) => (
                <li key={r.libelle} className="flex items-center gap-2 border-t py-1" style={{ borderColor: theme.bordure }}>
                  <span className="min-w-0 flex-1 truncate">{r.libelle}</span>
                  <span className="opacity-70">le {r.jourDuMois}</span>
                  <b className="tabular-nums" style={{ color: r.montant < 0 ? '#B91C1C' : '#0F5F3E' }}>
                    {euros(r.montant)}
                  </b>
                </li>
              ))}
              {!t.recurrents.length ? <li className="opacity-70">Rien de récurrent (3 mois de relevés requis).</li> : null}
            </ul>
          </div>
          {t.aPercevoirSansDate.length ? (
            <div className={`${theme.carte} p-5`}>
              <h3 className="mb-1 text-[15px] font-bold" style={{ color: theme.encre }}>
                À percevoir, sans date
              </h3>
              <p className="mb-2 text-[12px] opacity-70" style={{ color: theme.encre }}>
                Hors courbe (date de versement absente)
              </p>
              <ul className="grid gap-1 text-[13px]" style={{ color: theme.encre }}>
                {t.aPercevoirSansDate.map((s) => (
                  <li key={s.id} className="flex items-center gap-2 border-t py-1" style={{ borderColor: theme.bordure }}>
                    <span className="min-w-0 flex-1 truncate">{s.nom}</span>
                    <b className="tabular-nums text-[#0F5F3E]">{euros(s.montant)}</b>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════ Briques ═══════════════════════ */

function Chiffre({ theme, titre, valeur, detail, ton }: { theme: ThemeFactures; titre: string; valeur: string; detail: string; ton?: string }) {
  return (
    <div className={`${theme.carte} p-4`}>
      <p className="text-[12px] font-bold uppercase tracking-wide opacity-70" style={{ color: theme.encre }}>
        {titre}
      </p>
      <p className="mt-1 text-[24px] font-black leading-none tabular-nums" style={{ color: ton ?? theme.primaireFonce }}>
        {valeur}
      </p>
      <p className="mt-1 text-[13px] opacity-70" style={{ color: theme.encre }}>
        {detail}
      </p>
    </div>
  );
}

/** Le petit « i » : une explication rangée, ouverte au clic ou au clavier (details natif). */
function Info({ theme, children }: { theme: ThemeFactures; children: ReactNode }) {
  return (
    <details className="relative inline-block shrink-0 align-middle text-left">
      <summary
        aria-label="Plus d’infos"
        title="Plus d’infos"
        className="flex h-5 w-5 cursor-pointer list-none items-center justify-center rounded-full border bg-white font-serif text-[12px] font-bold italic focus:outline-none focus-visible:ring-2 [&::-webkit-details-marker]:hidden"
        style={{ borderColor: theme.bordure, color: theme.primaire }}
      >
        i
      </summary>
      <div className="absolute left-0 top-7 z-30 w-72 max-w-[calc(100vw-2rem)] rounded-xl border bg-white p-3 text-[13px] font-normal normal-case leading-relaxed tracking-normal shadow-lg" style={{ borderColor: theme.bordure, color: theme.encre }}>
        {children}
      </div>
    </details>
  );
}

function Bandeau({ ton, children }: { ton: 'info' | 'alerte'; children: ReactNode }) {
  return <p className={`rounded-xl border px-4 py-3 text-[14px] ${ton === 'alerte' ? 'border-[#F3B0C2] bg-[#FDE7EC] text-[#8A1B3D]' : 'border-[#C7C4F2] bg-[#ECEBFC] text-[#1D1B5C]'}`}>{children}</p>;
}

/* ═══════════════════════ Squelettes de chargement ═══════════════════════ */

function BlocGris({ className = '' }: { className?: string }) {
  return <div aria-hidden="true" className={`animate-pulse rounded-xl bg-[#ECEBF3] ${className}`} />;
}

/** La silhouette de l'écran chargé : onglets, quatre tuiles, deux graphiques. */
function SqueletteFactures() {
  return (
    <div role="status" aria-busy="true" aria-label="Chargement" className="grid gap-5">
      <div className="flex flex-wrap items-center gap-2">
        <BlocGris className="h-10 w-full max-w-[640px]" />
        <BlocGris className="ml-auto h-9 w-48" />
      </div>
      <div className="grid gap-3 sm:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <BlocGris key={i} className="h-[92px]" />
        ))}
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <BlocGris className="h-64" />
        <BlocGris className="h-64" />
      </div>
    </div>
  );
}

/** Pour un onglet dont les données arrivent encore. */
function SqueletteVue() {
  return (
    <div role="status" aria-busy="true" aria-label="Chargement" className="grid gap-3">
      <BlocGris className="h-28" />
      <BlocGris className="h-16" />
      <BlocGris className="h-16" />
    </div>
  );
}
