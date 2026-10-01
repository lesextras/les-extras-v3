'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { AlertTriangle, Building2, CalendarClock, ClipboardCheck, Plus, Wallet } from 'lucide-react';
import { appel } from '../_client';
import { BTN_PRIMAIRE, BTN_SECONDAIRE, CARTE, CARTE_VIVE, CHAMP, Encart, Pastille, Tuile } from '../_ui';
import { FINANCEUR, STATUT_DOSSIER, centsDepuis, eurosCents, jourMois, saisieCents } from '../_gestion/financements';
import type { DossierFinancement, ListeFinancements, TypeFinanceur } from '../_gestion/types';

export interface SessionChoix {
  id: string;
  titre: string;
  startDate: string;
  endDate: string | null;
}

const FILTRES = [
  ['tout', 'Tout'],
  ['a-deposer', 'À déposer'],
  ['en-cours', 'En cours'],
  ['a-facturer', 'À facturer'],
  ['factures', 'Facturés'],
  ['payes', 'Payés'],
  ['retard', 'En retard'],
] as const;
type Filtre = (typeof FILTRES)[number][0];

const garder = (d: DossierFinancement, f: Filtre) => {
  switch (f) {
    case 'a-deposer':
      return d.statut === 'A_DEPOSER';
    case 'en-cours':
      return d.statut === 'DEPOSE' || d.statut === 'ACCORDE' || d.statut === 'EN_FORMATION';
    case 'a-facturer':
      return d.statut === 'A_FACTURER';
    case 'factures':
      return d.statut === 'FACTURE';
    case 'payes':
      return d.statut === 'PAYE';
    case 'retard':
      return d.enRetard;
    default:
      return true;
  }
};

/** La liste des dossiers de financement, ses chiffres, et le formulaire de création. */
export function Financements({ sessions }: { sessions: SessionChoix[] }) {
  const [liste, setListe] = useState<ListeFinancements | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [filtre, setFiltre] = useState<Filtre>('tout');
  const [creation, setCreation] = useState(false);

  const lire = useCallback(async () => {
    setListe(await appel<ListeFinancements>('/academie/gestion/financements'));
  }, []);
  useEffect(() => {
    lire().catch((e: Error) => setErreur(e.message));
  }, [lire]);

  const visibles = useMemo(() => (liste?.dossiers ?? []).filter((d) => garder(d, filtre)), [liste, filtre]);
  const r = liste?.resume;

  return (
    <>
      {erreur ? (
        <div className="mb-5">
          <Encart ton="alerte">{erreur}</Encart>
        </div>
      ) : null}

      {r ? (
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Tuile libelle="Demandé" valeur={eurosCents(r.demandeCents)} detail={`${r.enCours} dossier${r.enCours > 1 ? 's' : ''} en cours`} />
          <Tuile libelle="Accordé" valeur={eurosCents(r.accordeCents)} ton={r.accordeCents ? 'ok' : 'neutre'} />
          <Tuile libelle="Payé" valeur={eurosCents(r.payeCents)} ton={r.payeCents ? 'ok' : 'neutre'} />
          <Tuile
            libelle="En retard"
            valeur={r.enRetard}
            detail={r.enRetard ? `${r.depotsEnRetard} dépôt${r.depotsEnRetard > 1 ? 's' : ''}, ${r.paiementsEnRetard} paiement${r.paiementsEnRetard > 1 ? 's' : ''}` : r.aDeposerBientot ? `${r.aDeposerBientot} à déposer sous 7 jours` : 'Aucun'}
            ton={r.enRetard ? 'alerte' : r.aDeposerBientot ? 'attention' : 'ok'}
          />
        </div>
      ) : null}

      <div className="mb-5 flex flex-wrap gap-2">
        <button type="button" className={BTN_PRIMAIRE} onClick={() => setCreation((c) => !c)} aria-expanded={creation}>
          <Plus className="h-5 w-5" aria-hidden="true" /> Nouveau dossier
        </button>
        <Link href="/academie/prospects" className={BTN_SECONDAIRE}>
          Mes prospects
        </Link>
      </div>

      {creation ? (
        <div className="mb-6">
          <NouveauDossier sessions={sessions} annuler={() => setCreation(false)} />
        </div>
      ) : null}

      <nav className="mb-4 flex flex-wrap gap-2" aria-label="Filtrer">
        {FILTRES.map(([cle, libelle]) => (
          <button
            key={cle}
            type="button"
            onClick={() => setFiltre(cle)}
            className={`rounded-full px-4 py-2 text-sm font-bold ${filtre === cle ? 'bg-[#0F5F3E] text-white' : 'bg-[#E3F5EC] text-[#0F5F3E]'}`}
          >
            {libelle}
          </button>
        ))}
      </nav>

      {!liste ? (
        <p className="text-[15px] text-[#5E7A6E]">Chargement…</p>
      ) : visibles.length ? (
        <ul className="grid gap-3 md:grid-cols-2">
          {visibles.map((d) => (
            <CarteDossier key={d.id} d={d} />
          ))}
        </ul>
      ) : liste.dossiers.length ? (
        <Encart ton="info">Rien à afficher ici.</Encart>
      ) : (
        <Encart ton="info">Aucun dossier pour l&apos;instant. Crée le premier dès qu&apos;une entreprise te demande une prise en charge.</Encart>
      )}
    </>
  );
}

/** Ce qu'un dossier demande maintenant : l'alerte la plus urgente, ou rien. */
export function AlerteDossier({ d }: { d: DossierFinancement }) {
  if (d.depotEnRetard) {
    return (
      <p className="flex items-center gap-2 rounded-xl border border-[#F3B0C2] bg-[#FDE7EC] px-3 py-2 text-[14px] font-bold text-[#8A1B3D]">
        <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" /> Dépôt dépassé ({jourMois(d.dateLimiteDepot)})
      </p>
    );
  }
  if (d.depotProche) {
    return (
      <p className="flex items-center gap-2 rounded-xl border border-[#F5D6A8] bg-[#FEF3E2] px-3 py-2 text-[14px] font-bold text-[#7C3E06]">
        <CalendarClock className="h-4 w-4 shrink-0" aria-hidden="true" /> Dépôt avant le {jourMois(d.dateLimiteDepot)}
      </p>
    );
  }
  if (d.paiementEnRetard) {
    return (
      <p className="flex items-center gap-2 rounded-xl border border-[#F3B0C2] bg-[#FDE7EC] px-3 py-2 text-[14px] font-bold text-[#8A1B3D]">
        <Wallet className="h-4 w-4 shrink-0" aria-hidden="true" /> Impayé depuis plus de 45 jours
      </p>
    );
  }
  return null;
}

function CarteDossier({ d }: { d: DossierFinancement }) {
  const statut = STATUT_DOSSIER[d.statut];
  const montant = d.montantAccordeCents ?? d.montantDemandeCents;
  return (
    <li>
      <Link href={`/academie/financements/${d.id}`} className={`${CARTE_VIVE} flex h-full flex-col gap-3 p-5 no-underline ${d.enRetard ? 'border-[#F3B0C2]' : ''}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#E3F5EC] text-[#0F5F3E]" aria-hidden="true">
              <Building2 className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-[17px] font-extrabold text-[#12312A]">{d.entrepriseNom}</p>
              <p className="truncate text-[14px] text-[#5E7A6E]">
                {FINANCEUR[d.financeur]}
                {d.nomFinanceur ? ` · ${d.nomFinanceur}` : ''}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[18px] font-extrabold tabular-nums text-[#12312A]">{eurosCents(montant)}</p>
            <p className="text-[12px] text-[#5E7A6E]">{d.montantAccordeCents !== null ? 'accordé' : 'demandé'}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Pastille ton={statut.ton}>{statut.libelle}</Pastille>
          <span className="inline-flex items-center gap-1 text-[13px] text-[#5E7A6E]">
            <ClipboardCheck className="h-4 w-4" aria-hidden="true" /> {d.piecesFaites}/{d.pieces.length}
          </span>
          {d.session ? <span className="truncate text-[13px] text-[#5E7A6E]">· {d.session.title || d.session.formation.title}</span> : null}
        </div>
        <AlerteDossier d={d} />
      </Link>
    </li>
  );
}

/* ------------------------------------------------------------ création */

const ETIQUETTE = 'mb-1.5 block text-sm font-bold text-[#334A42]';

function NouveauDossier({ sessions, annuler }: { sessions: SessionChoix[]; annuler: () => void }) {
  const router = useRouter();
  const [entreprise, setEntreprise] = useState('');
  const [financeur, setFinanceur] = useState<TypeFinanceur>('OPCO');
  const [nomFinanceur, setNomFinanceur] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [debut, setDebut] = useState('');
  const [stagiaires, setStagiaires] = useState('1');
  const [heures, setHeures] = useState('');
  const [tarif, setTarif] = useState('');
  const [montant, setMontant] = useState('');
  const [montantSaisi, setMontantSaisi] = useState(false);
  const [subrogation, setSubrogation] = useState(true);
  const [occupe, setOccupe] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  // Le montant suit stagiaires × heures × tarif, tant qu'on ne l'a pas saisi soi-même.
  const calcule = useMemo(() => {
    const nb = Number(stagiaires);
    const h = Number(heures.replace(',', '.'));
    const t = centsDepuis(tarif);
    return nb > 0 && h > 0 && t ? Math.round(nb * h * t) : null;
  }, [stagiaires, heures, tarif]);
  const montantAffiche = montantSaisi ? montant : saisieCents(calcule);

  const choisirSession = (id: string) => {
    setSessionId(id);
    const s = sessions.find((x) => x.id === id);
    if (s && !debut) setDebut(s.startDate.slice(0, 10));
  };

  const envoyer = async (e: FormEvent) => {
    e.preventDefault();
    setOccupe(true);
    setErreur(null);
    try {
      const h = Number(heures.replace(',', '.'));
      const m = montantSaisi ? centsDepuis(montant) : calcule;
      const d = await appel<DossierFinancement>('/academie/gestion/financements', {
        method: 'POST',
        body: {
          entrepriseNom: entreprise.trim(),
          financeur,
          ...(nomFinanceur.trim() ? { nomFinanceur: nomFinanceur.trim() } : {}),
          ...(sessionId ? { sessionId } : {}),
          ...(debut ? { dateDebutFormation: debut } : {}),
          nbStagiaires: Math.max(1, Math.round(Number(stagiaires) || 1)),
          ...(h > 0 ? { heures: h } : {}),
          ...(centsDepuis(tarif) !== null ? { tarifHoraireCents: centsDepuis(tarif) } : {}),
          ...(m !== null ? { montantDemandeCents: m } : {}),
          subrogation,
        },
      });
      router.push(`/academie/financements/${d.id}`);
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Le dossier n'a pas pu être créé.");
      setOccupe(false);
    }
  };

  return (
    <form onSubmit={(e) => void envoyer(e)} className={`${CARTE} grid gap-4 p-5 sm:p-6`}>
      <p className="text-[17px] font-extrabold text-[#12312A]">Nouveau dossier</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="sm:col-span-2">
          <span className={ETIQUETTE}>Entreprise</span>
          <input className={CHAMP} required maxLength={160} value={entreprise} onChange={(e) => setEntreprise(e.target.value)} placeholder="Raison sociale" />
        </label>
        <label>
          <span className={ETIQUETTE}>Financeur</span>
          <select className={CHAMP} value={financeur} onChange={(e) => setFinanceur(e.target.value as TypeFinanceur)}>
            {Object.entries(FINANCEUR).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className={ETIQUETTE}>Nom du financeur</span>
          <input className={CHAMP} maxLength={120} value={nomFinanceur} onChange={(e) => setNomFinanceur(e.target.value)} placeholder="Constructys, Akto…" />
        </label>
        <label>
          <span className={ETIQUETTE}>Session (facultatif)</span>
          <select className={CHAMP} value={sessionId} onChange={(e) => choisirSession(e.target.value)}>
            <option value="">Aucune</option>
            {sessions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.titre} · {new Date(s.startDate).toLocaleDateString('fr-FR')}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className={ETIQUETTE}>Début de la formation</span>
          <input type="date" className={CHAMP} value={debut} onChange={(e) => setDebut(e.target.value)} />
        </label>
        <label>
          <span className={ETIQUETTE}>Stagiaires</span>
          <input type="number" min={1} className={CHAMP} value={stagiaires} onChange={(e) => setStagiaires(e.target.value)} />
        </label>
        <label>
          <span className={ETIQUETTE}>Heures par stagiaire</span>
          <input inputMode="decimal" className={CHAMP} value={heures} onChange={(e) => setHeures(e.target.value)} placeholder="14" />
        </label>
        <label>
          <span className={ETIQUETTE}>Tarif horaire (€)</span>
          <input inputMode="decimal" className={CHAMP} value={tarif} onChange={(e) => setTarif(e.target.value)} placeholder="45" />
        </label>
        <label>
          <span className={ETIQUETTE}>Montant demandé (€)</span>
          <input
            inputMode="decimal"
            className={CHAMP}
            value={montantAffiche}
            onChange={(e) => {
              setMontantSaisi(true);
              setMontant(e.target.value);
            }}
            placeholder="Calculé"
          />
        </label>
      </div>
      <fieldset className="flex flex-wrap items-center gap-2">
        <legend className={ETIQUETTE}>Subrogation (le financeur te paie directement)</legend>
        {[
          [true, 'Oui'],
          [false, 'Non'],
        ].map(([v, l]) => (
          <button
            key={String(v)}
            type="button"
            onClick={() => setSubrogation(v as boolean)}
            aria-pressed={subrogation === v}
            className={`rounded-full px-4 py-2 text-sm font-bold ${subrogation === v ? 'bg-[#0F5F3E] text-white' : 'bg-[#E3F5EC] text-[#0F5F3E]'}`}
          >
            {l as string}
          </button>
        ))}
      </fieldset>
      {erreur ? <Encart ton="alerte">{erreur}</Encart> : null}
      <div className="flex flex-wrap gap-2">
        <button type="submit" className={BTN_PRIMAIRE} disabled={occupe || !entreprise.trim()}>
          Créer le dossier
        </button>
        <button type="button" className={BTN_SECONDAIRE} onClick={annuler}>
          Annuler
        </button>
      </div>
    </form>
  );
}
