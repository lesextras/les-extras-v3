'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent, type ReactNode } from 'react';
import { Ban, Building2, CalendarDays, Check, Euro, Landmark, Trash2, X } from 'lucide-react';
import { appel } from '../../_client';
import { BTN_DISCRET, BTN_PRIMAIRE, CARTE, CHAMP, Encart, Pastille, Tuile } from '../../_ui';
import { ETAPES_DOSSIER, FINANCEUR, STATUT_DOSSIER, centsDepuis, champDate, eurosCents, jourCourt, saisieCents } from '../../_gestion/financements';
import type { DossierFinancement, StatutDossier, TypeFinanceur } from '../../_gestion/types';
import { AlerteDossier } from '../Financements';

const ETIQUETTE = 'mb-1.5 block text-sm font-bold text-[#334A42]';

/** La date que chaque étape renseigne, pour l'afficher sous la frise. */
const DATE_ETAPE: Partial<Record<StatutDossier, keyof DossierFinancement>> = {
  A_DEPOSER: 'dateLimiteDepot',
  DEPOSE: 'dateDepot',
  ACCORDE: 'dateAccord',
  EN_FORMATION: 'dateDebutFormation',
  A_FACTURER: 'dateFinFormation',
  FACTURE: 'dateFacturation',
  PAYE: 'datePaiement',
};

/**
 * LA FICHE D'UN DOSSIER DE FINANCEMENT.
 *
 * En haut, ce qui se lit d'un coup d'œil : la frise des étapes, les montants,
 * la checklist. En bas, les champs. Chaque geste écrit par l'API et remplace
 * le dossier par celui qu'elle renvoie : une seule source de vérité.
 */
export function FicheDossier({
  initial,
  sessions,
  factures,
}: {
  initial: DossierFinancement;
  sessions: { id: string; titre: string; startDate: string }[];
  factures: { id: string; libelle: string }[];
}) {
  const router = useRouter();
  const [d, setD] = useState(initial);
  const [occupe, setOccupe] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const base = `/academie/gestion/financements/${d.id}`;

  const agir = async (fn: () => Promise<DossierFinancement | unknown>, ok?: string) => {
    setOccupe(true);
    setErreur(null);
    setMessage(null);
    try {
      const r = await fn();
      if (r && typeof r === 'object' && 'pieces' in r) setD(r as DossierFinancement);
      if (ok) setMessage(ok);
      return true;
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "L'action n'a pas abouti.");
      return false;
    } finally {
      setOccupe(false);
    }
  };

  const statut = STATUT_DOSSIER[d.statut];
  const indice = ETAPES_DOSSIER.indexOf(d.statut);
  const suivante = indice >= 0 && indice < ETAPES_DOSSIER.length - 1 ? ETAPES_DOSSIER[indice + 1] : null;
  const changerStatut = (s: StatutDossier) => void agir(() => appel(`${base}/statut`, { method: 'POST', body: { statut: s } }), `Statut : ${STATUT_DOSSIER[s].libelle}.`);

  return (
    <>
      <Link href="/academie/financements" className={BTN_DISCRET}>
        ← Tous les dossiers
      </Link>

      <header className="mb-6 mt-4 flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#E3F5EC] text-[#0F5F3E]" aria-hidden="true">
            <Building2 className="h-6 w-6" />
          </span>
          <div className="min-w-0">
            <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-[#12312A]">{d.entrepriseNom}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-[15px] text-[#5E7A6E]">
              <Pastille ton={statut.ton}>{statut.libelle}</Pastille>
              <span>
                {FINANCEUR[d.financeur]}
                {d.nomFinanceur ? ` · ${d.nomFinanceur}` : ''}
                {d.numeroDossier ? ` · n° ${d.numeroDossier}` : ''}
              </span>
            </div>
          </div>
        </div>
        {suivante && d.statut !== 'REFUSE' && d.statut !== 'ANNULE' ? (
          <button type="button" className={BTN_PRIMAIRE} disabled={occupe} onClick={() => changerStatut(suivante)}>
            <Check className="h-5 w-5" aria-hidden="true" /> Passer à « {STATUT_DOSSIER[suivante].libelle} »
          </button>
        ) : null}
      </header>

      <div className="mb-4 grid gap-2">
        <AlerteDossier d={d} />
        {erreur ? <Encart ton="alerte">{erreur}</Encart> : null}
        {message ? <Encart ton="ok">{message}</Encart> : null}
      </div>

      {/* La frise : chaque étape se clique pour y ramener le dossier. */}
      <section className={`${CARTE} mb-6 p-5`} aria-label="Étapes du dossier">
        <ol className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
          {ETAPES_DOSSIER.map((e, i) => {
            const fait = indice >= 0 && i < indice;
            const courant = e === d.statut;
            const champ = DATE_ETAPE[e];
            const quand = champ ? (d[champ] as string | null) : null;
            return (
              <li key={e}>
                <button
                  type="button"
                  disabled={occupe || courant}
                  onClick={() => changerStatut(e)}
                  className="flex w-full flex-col items-center gap-1.5 rounded-xl p-2 text-center hover:bg-[#F2F7F5] disabled:cursor-default disabled:hover:bg-transparent"
                  aria-current={courant ? 'step' : undefined}
                >
                  <span
                    className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-extrabold ${
                      courant ? 'bg-[#1E9E6A] text-white ring-4 ring-[#E3F5EC]' : fait ? 'bg-[#0F5F3E] text-white' : 'border-2 border-[#CFE4D9] bg-white text-[#5E7A6E]'
                    }`}
                    aria-hidden="true"
                  >
                    {fait ? <Check className="h-4 w-4" /> : i + 1}
                  </span>
                  <span className={`text-[13px] font-bold ${courant ? 'text-[#0F5F3E]' : 'text-[#334A42]'}`}>{STATUT_DOSSIER[e].libelle}</span>
                  {quand ? <span className="text-[12px] text-[#5E7A6E]">{jourCourt(quand)}</span> : null}
                </button>
              </li>
            );
          })}
        </ol>
        <div className="mt-3 flex flex-wrap gap-1 border-t border-[#EDF3F0] pt-3">
          {d.statut === 'REFUSE' || d.statut === 'ANNULE' ? (
            <button type="button" className={BTN_DISCRET} disabled={occupe} onClick={() => changerStatut('A_DEPOSER')}>
              Rouvrir le dossier
            </button>
          ) : (
            <>
              <button type="button" className={`${BTN_DISCRET} text-[#8A1B3D]`} disabled={occupe} onClick={() => changerStatut('REFUSE')}>
                <X className="h-4 w-4" aria-hidden="true" /> Refusé par le financeur
              </button>
              <button type="button" className={BTN_DISCRET} disabled={occupe} onClick={() => changerStatut('ANNULE')}>
                <Ban className="h-4 w-4" aria-hidden="true" /> Annuler
              </button>
            </>
          )}
        </div>
      </section>

      <section className="mb-6 grid gap-4 sm:grid-cols-3">
        <Tuile libelle="Demandé" valeur={eurosCents(d.montantDemandeCents)} detail={`${d.nbStagiaires} × ${String(d.heures).replace('.', ',')} h × ${eurosCents(d.tarifHoraireCents)}`} />
        <Tuile libelle="Accordé" valeur={d.montantAccordeCents !== null ? eurosCents(d.montantAccordeCents) : '—'} ton={d.montantAccordeCents !== null ? 'ok' : 'neutre'} />
        <Tuile
          libelle="Payé"
          valeur={d.statut === 'PAYE' ? eurosCents(d.montantAccordeCents ?? d.montantDemandeCents) : '—'}
          detail={d.datePaiement ? `le ${jourCourt(d.datePaiement)}` : d.subrogation ? 'Subrogation' : 'Sans subrogation'}
          ton={d.statut === 'PAYE' ? 'ok' : 'neutre'}
        />
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        <section className={`${CARTE} h-fit p-5`} aria-labelledby="pieces">
          <h2 id="pieces" className="mb-3 flex items-center justify-between text-[17px] font-extrabold text-[#12312A]">
            Pièces du dossier
            <span className="text-[14px] font-bold text-[#5E7A6E]">
              {d.piecesFaites}/{d.pieces.length}
            </span>
          </h2>
          <ul className="grid gap-1">
            {d.pieces.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  disabled={occupe}
                  onClick={() => void agir(() => appel(`${base}/pieces/${p.id}`, { method: 'PATCH', body: { cochee: !p.cochee } }))}
                  className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left hover:bg-[#F2F7F5]"
                  aria-pressed={p.cochee}
                >
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 ${p.cochee ? 'border-[#1E9E6A] bg-[#1E9E6A] text-white' : 'border-[#CFE4D9] bg-white'}`}
                    aria-hidden="true"
                  >
                    {p.cochee ? <Check className="h-4 w-4" /> : null}
                  </span>
                  <span className={`flex-1 text-[15px] ${p.cochee ? 'text-[#5E7A6E] line-through' : 'text-[#12312A]'}`}>{p.libelle}</span>
                  {p.cocheeLe ? <span className="text-[12px] text-[#5E7A6E]">{jourCourt(p.cocheeLe)}</span> : null}
                </button>
              </li>
            ))}
          </ul>
          {d.session ? (
            <Link href={`/academie/sessions/${d.session.id}`} className={`${BTN_DISCRET} mt-3`}>
              <CalendarDays className="h-4 w-4" aria-hidden="true" /> Session : {d.session.title || d.session.formation.title}
            </Link>
          ) : null}
          {d.facture ? (
            <Link href="/academie/facturation" className={`${BTN_DISCRET} mt-1`}>
              <Euro className="h-4 w-4" aria-hidden="true" /> Facture {d.facture.numero ?? ''} · {eurosCents(Math.round(d.facture.totalTtc * 100))}
            </Link>
          ) : null}
        </section>

        <Champs
          key={d.updatedAt}
          d={d}
          sessions={sessions}
          factures={factures}
          occupe={occupe}
          enregistrer={(corps) => agir(() => appel(base, { method: 'PATCH', body: corps }), 'Enregistré.')}
        />
      </div>

      <div className="mt-8">
        <button
          type="button"
          className={`${BTN_DISCRET} text-[#8A1B3D]`}
          disabled={occupe}
          onClick={async () => {
            if (!window.confirm('Supprimer ce dossier et sa checklist ?')) return;
            if (await agir(() => appel(base, { method: 'DELETE' }))) router.push('/academie/financements');
          }}
        >
          <Trash2 className="h-4 w-4" aria-hidden="true" /> Supprimer le dossier
        </button>
      </div>
    </>
  );
}

/* ------------------------------------------------------------ champs */

function Bloc({ titre, icone, children }: { titre: string; icone: ReactNode; children: ReactNode }) {
  return (
    <fieldset className="grid gap-3 sm:grid-cols-2">
      <legend className="mb-2 flex items-center gap-2 text-[15px] font-extrabold text-[#12312A]">
        <span className="text-[#0F5F3E]" aria-hidden="true">
          {icone}
        </span>
        {titre}
      </legend>
      {children}
    </fieldset>
  );
}

function Champ({ libelle, children, large }: { libelle: string; children: ReactNode; large?: boolean }) {
  return (
    <label className={large ? 'sm:col-span-2' : undefined}>
      <span className={ETIQUETTE}>{libelle}</span>
      {children}
    </label>
  );
}

function Champs({
  d,
  sessions,
  factures,
  occupe,
  enregistrer,
}: {
  d: DossierFinancement;
  sessions: { id: string; titre: string; startDate: string }[];
  factures: { id: string; libelle: string }[];
  occupe: boolean;
  enregistrer: (corps: Record<string, unknown>) => Promise<boolean>;
}) {
  const [v, setV] = useState({
    entrepriseNom: d.entrepriseNom,
    entrepriseSiret: d.entrepriseSiret ?? '',
    contactNom: d.contactNom ?? '',
    contactEmail: d.contactEmail ?? '',
    financeur: d.financeur,
    nomFinanceur: d.nomFinanceur ?? '',
    numeroDossier: d.numeroDossier ?? '',
    subrogation: d.subrogation,
    salairesRembourses: d.salairesRembourses === null ? '' : d.salairesRembourses ? 'oui' : 'non',
    sessionId: d.sessionId ?? '',
    dateDebutFormation: champDate(d.dateDebutFormation),
    dateLimiteDepot: champDate(d.dateLimiteDepot),
    dateFinFormation: champDate(d.dateFinFormation),
    dateDepot: champDate(d.dateDepot),
    dateAccord: champDate(d.dateAccord),
    dateFacturation: champDate(d.dateFacturation),
    datePaiement: champDate(d.datePaiement),
    nbStagiaires: String(d.nbStagiaires),
    heures: String(d.heures).replace('.', ','),
    tarif: saisieCents(d.tarifHoraireCents),
    montantDemande: saisieCents(d.montantDemandeCents),
    montantAccorde: saisieCents(d.montantAccordeCents),
    factureId: d.factureId ?? '',
    notes: d.notes ?? '',
  });
  const maj = (k: keyof typeof v) => (e: { target: { value: string } }) => setV((x) => ({ ...x, [k]: e.target.value }));
  const nb = Math.max(1, Math.round(Number(v.nbStagiaires) || 1));
  const h = Number(v.heures.replace(',', '.')) || 0;
  const calcule = Math.round(nb * h * (centsDepuis(v.tarif) ?? 0));
  const debutChange = v.dateDebutFormation !== champDate(d.dateDebutFormation);
  const limiteChange = v.dateLimiteDepot !== champDate(d.dateLimiteDepot);

  const envoyer = (e: FormEvent) => {
    e.preventDefault();
    const texte = (t: string) => (t.trim() ? t.trim() : null);
    const jour = (t: string) => (t ? t : null);
    void enregistrer({
      entrepriseNom: v.entrepriseNom.trim(),
      entrepriseSiret: texte(v.entrepriseSiret.replace(/\s/g, '')),
      contactNom: texte(v.contactNom),
      contactEmail: texte(v.contactEmail),
      financeur: v.financeur,
      nomFinanceur: texte(v.nomFinanceur),
      numeroDossier: texte(v.numeroDossier),
      subrogation: v.subrogation,
      salairesRembourses: v.salairesRembourses === '' ? null : v.salairesRembourses === 'oui',
      sessionId: v.sessionId || null,
      dateDebutFormation: jour(v.dateDebutFormation),
      // La date limite suit le début (− 15 jours) si on ne l'a pas touchée.
      ...(debutChange && !limiteChange ? {} : { dateLimiteDepot: jour(v.dateLimiteDepot) }),
      dateFinFormation: jour(v.dateFinFormation),
      dateDepot: jour(v.dateDepot),
      dateAccord: jour(v.dateAccord),
      dateFacturation: jour(v.dateFacturation),
      datePaiement: jour(v.datePaiement),
      nbStagiaires: nb,
      heures: h,
      tarifHoraireCents: centsDepuis(v.tarif) ?? 0,
      montantDemandeCents: centsDepuis(v.montantDemande) ?? calcule,
      montantAccordeCents: centsDepuis(v.montantAccorde),
      factureId: v.factureId || null,
      notes: texte(v.notes),
    });
  };

  return (
    <form onSubmit={envoyer} className={`${CARTE} grid gap-6 p-5 sm:p-6`}>
      <Bloc titre="Entreprise" icone={<Building2 className="h-4 w-4" />}>
        <Champ libelle="Raison sociale" large>
          <input className={CHAMP} required maxLength={160} value={v.entrepriseNom} onChange={maj('entrepriseNom')} />
        </Champ>
        <Champ libelle="SIRET">
          <input className={CHAMP} inputMode="numeric" maxLength={17} value={v.entrepriseSiret} onChange={maj('entrepriseSiret')} />
        </Champ>
        <Champ libelle="Contact">
          <input className={CHAMP} maxLength={120} value={v.contactNom} onChange={maj('contactNom')} />
        </Champ>
        <Champ libelle="E-mail du contact" large>
          <input type="email" className={CHAMP} value={v.contactEmail} onChange={maj('contactEmail')} />
        </Champ>
      </Bloc>

      <Bloc titre="Financeur" icone={<Landmark className="h-4 w-4" />}>
        <Champ libelle="Type">
          <select className={CHAMP} value={v.financeur} onChange={(e) => setV((x) => ({ ...x, financeur: e.target.value as TypeFinanceur }))}>
            {Object.entries(FINANCEUR).map(([k, l]) => (
              <option key={k} value={k}>
                {l}
              </option>
            ))}
          </select>
        </Champ>
        <Champ libelle="Nom">
          <input className={CHAMP} maxLength={120} value={v.nomFinanceur} onChange={maj('nomFinanceur')} placeholder="Constructys" />
        </Champ>
        <Champ libelle="N° de dossier">
          <input className={CHAMP} maxLength={80} value={v.numeroDossier} onChange={maj('numeroDossier')} />
        </Champ>
        <Champ libelle="Subrogation">
          <select className={CHAMP} value={v.subrogation ? 'oui' : 'non'} onChange={(e) => setV((x) => ({ ...x, subrogation: e.target.value === 'oui' }))}>
            <option value="oui">Oui, le financeur me paie</option>
            <option value="non">Non, l’entreprise avance</option>
          </select>
        </Champ>
        <Champ libelle="Salaires remboursés">
          <select className={CHAMP} value={v.salairesRembourses} onChange={maj('salairesRembourses')}>
            <option value="">Ne sait pas</option>
            <option value="oui">Oui</option>
            <option value="non">Non</option>
          </select>
        </Champ>
      </Bloc>

      <Bloc titre="Formation et montants" icone={<Euro className="h-4 w-4" />}>
        <Champ libelle="Session" large>
          <select className={CHAMP} value={v.sessionId} onChange={maj('sessionId')}>
            <option value="">Aucune</option>
            {sessions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.titre} · {new Date(s.startDate).toLocaleDateString('fr-FR')}
              </option>
            ))}
          </select>
        </Champ>
        <Champ libelle="Stagiaires">
          <input type="number" min={1} className={CHAMP} value={v.nbStagiaires} onChange={maj('nbStagiaires')} />
        </Champ>
        <Champ libelle="Heures par stagiaire">
          <input inputMode="decimal" className={CHAMP} value={v.heures} onChange={maj('heures')} />
        </Champ>
        <Champ libelle="Tarif horaire (€)">
          <input inputMode="decimal" className={CHAMP} value={v.tarif} onChange={maj('tarif')} />
        </Champ>
        <Champ libelle="Montant demandé (€)">
          <div className="flex gap-2">
            <input inputMode="decimal" className={CHAMP} value={v.montantDemande} onChange={maj('montantDemande')} />
            {calcule && saisieCents(calcule) !== v.montantDemande ? (
              <button type="button" className={BTN_DISCRET} onClick={() => setV((x) => ({ ...x, montantDemande: saisieCents(calcule) }))} title={`Calculé : ${eurosCents(calcule)}`}>
                Recalculer
              </button>
            ) : null}
          </div>
        </Champ>
        <Champ libelle="Montant accordé (€)">
          <input inputMode="decimal" className={CHAMP} value={v.montantAccorde} onChange={maj('montantAccorde')} />
        </Champ>
        <Champ libelle="Facture liée">
          <select className={CHAMP} value={v.factureId} onChange={maj('factureId')}>
            <option value="">Aucune</option>
            {factures.map((f) => (
              <option key={f.id} value={f.id}>
                {f.libelle}
              </option>
            ))}
          </select>
        </Champ>
      </Bloc>

      <Bloc titre="Dates" icone={<CalendarDays className="h-4 w-4" />}>
        <Champ libelle="Début de la formation">
          <input type="date" className={CHAMP} value={v.dateDebutFormation} onChange={maj('dateDebutFormation')} />
        </Champ>
        <Champ libelle="Dépôt avant le">
          <input type="date" className={CHAMP} value={v.dateLimiteDepot} onChange={maj('dateLimiteDepot')} />
        </Champ>
        <Champ libelle="Fin de la formation">
          <input type="date" className={CHAMP} value={v.dateFinFormation} onChange={maj('dateFinFormation')} />
        </Champ>
        <Champ libelle="Déposé le">
          <input type="date" className={CHAMP} value={v.dateDepot} onChange={maj('dateDepot')} />
        </Champ>
        <Champ libelle="Accordé le">
          <input type="date" className={CHAMP} value={v.dateAccord} onChange={maj('dateAccord')} />
        </Champ>
        <Champ libelle="Facturé le">
          <input type="date" className={CHAMP} value={v.dateFacturation} onChange={maj('dateFacturation')} />
        </Champ>
        <Champ libelle="Payé le">
          <input type="date" className={CHAMP} value={v.datePaiement} onChange={maj('datePaiement')} />
        </Champ>
      </Bloc>

      <Champ libelle="Notes">
        <textarea className={`${CHAMP} min-h-[96px]`} maxLength={4000} value={v.notes} onChange={maj('notes')} />
      </Champ>

      <div>
        <button type="submit" className={BTN_PRIMAIRE} disabled={occupe || !v.entrepriseNom.trim()}>
          Enregistrer
        </button>
      </div>
    </form>
  );
}
