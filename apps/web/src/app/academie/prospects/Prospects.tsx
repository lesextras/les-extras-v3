'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { CalendarClock, ChevronLeft, ChevronRight, FileText, Landmark, Mail, Phone, Plus, Trash2, X } from 'lucide-react';
import { appel } from '../_client';
import { Squelette } from '../Squelette';
import { BTN_DISCRET, BTN_PRIMAIRE, BTN_SECONDAIRE, CARTE, CHAMP, Encart, Pastille, Tuile } from '../_ui';
import { ETAPES_PROSPECT, ETAPE_PROSPECT, STATUT_DOSSIER, centsDepuis, champDate, eurosCents, jourMois, saisieCents } from '../_gestion/financements';
import type { DossierFinancement, EtapeProspect, ListeProspects, ProspectOrg } from '../_gestion/types';

const ETIQUETTE = 'mb-1.5 block text-sm font-bold text-[#334A42]';

/** La couleur du liseré de chaque colonne. */
const TEINTE: Record<EtapeProspect, string> = {
  NOUVEAU: 'border-t-[#8FA79B]',
  CONTACTE: 'border-t-[#1E9E6A]',
  DEVIS_ENVOYE: 'border-t-[#B45309]',
  GAGNE: 'border-t-[#0F5F3E]',
  PERDU: 'border-t-[#C42B57]',
};

/**
 * LE TABLEAU DES PROSPECTS : cinq colonnes, des flèches pour avancer ou
 * reculer d'une étape (pas de glisser-déposer : ça marche au doigt comme à la
 * souris), un panneau pour le détail.
 */
export function Prospects({ devis }: { devis: { id: string; libelle: string }[] }) {
  const router = useRouter();
  const [liste, setListe] = useState<ListeProspects | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [occupe, setOccupe] = useState(false);
  const [ouvert, setOuvert] = useState<ProspectOrg | null>(null);

  const lire = useCallback(async () => {
    setListe(await appel<ListeProspects>('/academie/gestion/prospects'));
  }, []);
  useEffect(() => {
    lire().catch((e: Error) => setErreur(e.message));
  }, [lire]);

  const agir = async (fn: () => Promise<unknown>) => {
    setOccupe(true);
    setErreur(null);
    try {
      const r = await fn();
      await lire();
      return r;
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "L'action n'a pas abouti.");
      return null;
    } finally {
      setOccupe(false);
    }
  };

  const deplacer = (p: ProspectOrg, sens: -1 | 1) => {
    const i = ETAPES_PROSPECT.indexOf(p.etape) + sens;
    if (i < 0 || i >= ETAPES_PROSPECT.length) return;
    void agir(() => appel(`/academie/gestion/prospects/${p.id}/etape`, { method: 'POST', body: { etape: ETAPES_PROSPECT[i] } }));
  };

  const versDossier = async (p: ProspectOrg) => {
    const d = (await agir(() => appel<DossierFinancement>(`/academie/gestion/prospects/${p.id}/financement`, { method: 'POST' }))) as DossierFinancement | null;
    if (d?.id) router.push(`/academie/financements/${d.id}`);
  };

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
          <Tuile libelle="En cours" valeur={eurosCents(r.enCoursCents)} detail={`${r.parEtape.NOUVEAU + r.parEtape.CONTACTE + r.parEtape.DEVIS_ENVOYE} prospect${r.parEtape.NOUVEAU + r.parEtape.CONTACTE + r.parEtape.DEVIS_ENVOYE > 1 ? 's' : ''} ouverts`} />
          <Tuile libelle="Devis envoyés" valeur={r.parEtape.DEVIS_ENVOYE} ton={r.parEtape.DEVIS_ENVOYE ? 'attention' : 'neutre'} />
          <Tuile libelle="Gagnés" valeur={r.parEtape.GAGNE} detail={r.gagneCents ? eurosCents(r.gagneCents) : undefined} ton={r.parEtape.GAGNE ? 'ok' : 'neutre'} />
          <Tuile libelle="Actions en retard" valeur={r.actionsEnRetard} ton={r.actionsEnRetard ? 'alerte' : 'ok'} />
        </div>
      ) : null}

      <AjoutRapide apres={lire} />

      {!liste ? (
        <Squelette lignes={4} />
      ) : (
        <div className="-mx-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
          <div className="grid min-w-[1000px] grid-cols-5 gap-3">
            {ETAPES_PROSPECT.map((etape, iCol) => {
              const cartes = liste.prospects.filter((p) => p.etape === etape);
              return (
                <section key={etape} className={`rounded-2xl border border-t-4 border-[#DDEBE4] bg-[#F7FBF9] p-2.5 ${TEINTE[etape]}`} aria-label={ETAPE_PROSPECT[etape].libelle}>
                  <h2 className="mb-2 flex items-center justify-between px-1 text-[14px] font-extrabold text-[#12312A]">
                    {ETAPE_PROSPECT[etape].libelle}
                    <span className="rounded-full bg-white px-2 text-[12px] font-bold text-[#5E7A6E]">{cartes.length}</span>
                  </h2>
                  <ul className="grid gap-2">
                    {cartes.map((p) => (
                      <li key={p.id} className={`${CARTE} p-3 ${p.actionEnRetard ? 'border-[#F3B0C2]' : ''}`}>
                        <button type="button" className="block w-full text-left" onClick={() => setOuvert(p)}>
                          <p className="truncate text-[15px] font-extrabold text-[#12312A]">{p.nom}</p>
                          {p.besoin ? <p className="truncate text-[13px] text-[#5E7A6E]">{p.besoin}</p> : null}
                          {p.montantEstimeCents ? <p className="mt-1 text-[14px] font-bold tabular-nums text-[#0F5F3E]">{eurosCents(p.montantEstimeCents)}</p> : null}
                          {p.prochaineAction || p.dateProchaineAction ? (
                            <p className={`mt-1.5 flex items-center gap-1.5 text-[12px] font-bold ${p.actionEnRetard ? 'text-[#8A1B3D]' : 'text-[#334A42]'}`}>
                              <CalendarClock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                              <span className="truncate">
                                {p.dateProchaineAction ? `${jourMois(p.dateProchaineAction)} · ` : ''}
                                {p.prochaineAction ?? 'Relancer'}
                              </span>
                            </p>
                          ) : null}
                        </button>
                        {p.etape === 'GAGNE' ? (
                          p.priseEnCharge ? (
                            <Link href={`/academie/financements/${p.priseEnCharge.id}`} className="mt-2 flex items-center gap-1.5 text-[12px] font-bold text-[#0F5F3E] no-underline">
                              <Landmark className="h-3.5 w-3.5" aria-hidden="true" /> Dossier : {STATUT_DOSSIER[p.priseEnCharge.statut].libelle}
                            </Link>
                          ) : (
                            <button type="button" className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg bg-[#E3F5EC] px-2 py-1.5 text-[12px] font-bold text-[#0F5F3E] hover:bg-[#CFEBDD]" disabled={occupe} onClick={() => void versDossier(p)}>
                              <Landmark className="h-3.5 w-3.5" aria-hidden="true" /> Créer le dossier de financement
                            </button>
                          )
                        ) : null}
                        <div className="mt-2 flex items-center justify-between">
                          <button type="button" className={`${BTN_DISCRET} px-2 py-1`} disabled={occupe || iCol === 0} onClick={() => deplacer(p, -1)} aria-label={`Reculer ${p.nom} d'une étape`}>
                            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                          </button>
                          {p.facture ? (
                            <span className="inline-flex items-center gap-1 text-[11px] text-[#5E7A6E]">
                              <FileText className="h-3 w-3" aria-hidden="true" /> {p.facture.numero ?? 'Devis'}
                            </span>
                          ) : null}
                          <button
                            type="button"
                            className={`${BTN_DISCRET} px-2 py-1`}
                            disabled={occupe || iCol === ETAPES_PROSPECT.length - 1}
                            onClick={() => deplacer(p, 1)}
                            aria-label={`Avancer ${p.nom} d'une étape`}
                          >
                            <ChevronRight className="h-4 w-4" aria-hidden="true" />
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>
              );
            })}
          </div>
        </div>
      )}

      {ouvert ? (
        <Panneau
          key={ouvert.id}
          p={ouvert}
          devis={devis}
          fermer={() => setOuvert(null)}
          apres={async () => {
            setOuvert(null);
            await lire();
          }}
        />
      ) : null}
    </>
  );
}

/* ------------------------------------------------------------ ajout rapide */

function AjoutRapide({ apres }: { apres: () => Promise<void> }) {
  const [nom, setNom] = useState('');
  const [besoin, setBesoin] = useState('');
  const [montant, setMontant] = useState('');
  const [occupe, setOccupe] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const envoyer = async (e: FormEvent) => {
    e.preventDefault();
    if (!nom.trim()) return;
    setOccupe(true);
    setErreur(null);
    try {
      const m = centsDepuis(montant);
      await appel('/academie/gestion/prospects', {
        method: 'POST',
        body: { nom: nom.trim(), ...(besoin.trim() ? { besoin: besoin.trim() } : {}), ...(m !== null ? { montantEstimeCents: m } : {}) },
      });
      setNom('');
      setBesoin('');
      setMontant('');
      await apres();
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Le prospect n'a pas pu être ajouté.");
    } finally {
      setOccupe(false);
    }
  };

  return (
    <form onSubmit={(e) => void envoyer(e)} className={`${CARTE} mb-6 grid gap-3 p-4 sm:grid-cols-[minmax(0,1.3fr)_minmax(0,1.3fr)_minmax(0,0.7fr)_auto] sm:items-end`}>
      <label>
        <span className={ETIQUETTE}>Entreprise ou personne</span>
        <input className={CHAMP} required maxLength={160} value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Raison sociale" />
      </label>
      <label>
        <span className={ETIQUETTE}>Besoin</span>
        <input className={CHAMP} maxLength={200} value={besoin} onChange={(e) => setBesoin(e.target.value)} placeholder="SST pour 8 salariés" />
      </label>
      <label>
        <span className={ETIQUETTE}>Montant (€)</span>
        <input inputMode="decimal" className={CHAMP} value={montant} onChange={(e) => setMontant(e.target.value)} placeholder="2 400" />
      </label>
      <button type="submit" className={BTN_PRIMAIRE} disabled={occupe || !nom.trim()}>
        <Plus className="h-5 w-5" aria-hidden="true" /> Ajouter
      </button>
      {erreur ? (
        <div className="sm:col-span-4">
          <Encart ton="alerte">{erreur}</Encart>
        </div>
      ) : null}
    </form>
  );
}

/* ------------------------------------------------------------ panneau */

function Panneau({ p, devis, fermer, apres }: { p: ProspectOrg; devis: { id: string; libelle: string }[]; fermer: () => void; apres: () => Promise<void> }) {
  const [v, setV] = useState({
    nom: p.nom,
    contactNom: p.contactNom ?? '',
    contactEmail: p.contactEmail ?? '',
    telephone: p.telephone ?? '',
    source: p.source ?? '',
    besoin: p.besoin ?? '',
    montant: saisieCents(p.montantEstimeCents),
    prochaineAction: p.prochaineAction ?? '',
    dateProchaineAction: champDate(p.dateProchaineAction),
    factureId: p.factureId ?? '',
    notes: p.notes ?? '',
  });
  const [occupe, setOccupe] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const maj = (k: keyof typeof v) => (e: { target: { value: string } }) => setV((x) => ({ ...x, [k]: e.target.value }));
  const texte = (t: string) => (t.trim() ? t.trim() : null);

  const faire = async (fn: () => Promise<unknown>) => {
    setOccupe(true);
    setErreur(null);
    try {
      await fn();
      await apres();
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "L'action n'a pas abouti.");
      setOccupe(false);
    }
  };

  const envoyer = (e: FormEvent) => {
    e.preventDefault();
    void faire(() =>
      appel(`/academie/gestion/prospects/${p.id}`, {
        method: 'PATCH',
        body: {
          nom: v.nom.trim(),
          contactNom: texte(v.contactNom),
          contactEmail: texte(v.contactEmail),
          telephone: texte(v.telephone),
          source: texte(v.source),
          besoin: texte(v.besoin),
          montantEstimeCents: centsDepuis(v.montant),
          prochaineAction: texte(v.prochaineAction),
          dateProchaineAction: v.dateProchaineAction || null,
          factureId: v.factureId || null,
          notes: texte(v.notes),
        },
      }),
    );
  };

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-[#12312A]/30" role="dialog" aria-modal="true" aria-labelledby="titre-prospect" onClick={fermer}>
      <form onSubmit={envoyer} onClick={(e) => e.stopPropagation()} className="flex h-full w-full max-w-md flex-col gap-4 overflow-y-auto bg-white p-5 shadow-xl sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="titre-prospect" className="text-[20px] font-extrabold text-[#12312A]">
              {p.nom}
            </h2>
            <Pastille ton={ETAPE_PROSPECT[p.etape].ton}>{ETAPE_PROSPECT[p.etape].libelle}</Pastille>
          </div>
          <button type="button" className={BTN_DISCRET} onClick={fermer} aria-label="Fermer">
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {p.contactEmail || p.telephone ? (
          <div className="flex flex-wrap gap-2">
            {p.contactEmail ? (
              <a href={`mailto:${p.contactEmail}`} className={BTN_SECONDAIRE}>
                <Mail className="h-4 w-4" aria-hidden="true" /> Écrire
              </a>
            ) : null}
            {p.telephone ? (
              <a href={`tel:${p.telephone.replace(/\s/g, '')}`} className={BTN_SECONDAIRE}>
                <Phone className="h-4 w-4" aria-hidden="true" /> Appeler
              </a>
            ) : null}
          </div>
        ) : null}

        <label>
          <span className={ETIQUETTE}>Entreprise ou personne</span>
          <input className={CHAMP} required maxLength={160} value={v.nom} onChange={maj('nom')} />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label>
            <span className={ETIQUETTE}>Contact</span>
            <input className={CHAMP} maxLength={120} value={v.contactNom} onChange={maj('contactNom')} />
          </label>
          <label>
            <span className={ETIQUETTE}>Téléphone</span>
            <input className={CHAMP} maxLength={30} value={v.telephone} onChange={maj('telephone')} />
          </label>
        </div>
        <label>
          <span className={ETIQUETTE}>E-mail</span>
          <input type="email" className={CHAMP} value={v.contactEmail} onChange={maj('contactEmail')} />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label>
            <span className={ETIQUETTE}>Source</span>
            <input className={CHAMP} maxLength={80} value={v.source} onChange={maj('source')} placeholder="Salon, bouche-à-oreille…" />
          </label>
          <label>
            <span className={ETIQUETTE}>Montant estimé (€)</span>
            <input inputMode="decimal" className={CHAMP} value={v.montant} onChange={maj('montant')} />
          </label>
        </div>
        <label>
          <span className={ETIQUETTE}>Besoin</span>
          <input className={CHAMP} maxLength={200} value={v.besoin} onChange={maj('besoin')} />
        </label>
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <label>
            <span className={ETIQUETTE}>Prochaine action</span>
            <input className={CHAMP} maxLength={160} value={v.prochaineAction} onChange={maj('prochaineAction')} placeholder="Rappeler" />
          </label>
          <label>
            <span className={ETIQUETTE}>Le</span>
            <input type="date" className={CHAMP} value={v.dateProchaineAction} onChange={maj('dateProchaineAction')} />
          </label>
        </div>
        <label>
          <span className={ETIQUETTE}>Devis lié</span>
          <select className={CHAMP} value={v.factureId} onChange={maj('factureId')}>
            <option value="">Aucun</option>
            {devis.map((d) => (
              <option key={d.id} value={d.id}>
                {d.libelle}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className={ETIQUETTE}>Notes</span>
          <textarea className={`${CHAMP} min-h-[90px]`} maxLength={4000} value={v.notes} onChange={maj('notes')} />
        </label>

        {erreur ? <Encart ton="alerte">{erreur}</Encart> : null}

        <div className="mt-auto flex flex-wrap items-center gap-2 pt-2">
          <button type="submit" className={BTN_PRIMAIRE} disabled={occupe || !v.nom.trim()}>
            Enregistrer
          </button>
          <button type="button" className={BTN_SECONDAIRE} onClick={fermer}>
            Annuler
          </button>
          <button
            type="button"
            className={`${BTN_DISCRET} ml-auto text-[#8A1B3D]`}
            disabled={occupe}
            onClick={() => {
              if (!window.confirm(`Supprimer ${p.nom} ?`)) return;
              void faire(() => appel(`/academie/gestion/prospects/${p.id}`, { method: 'DELETE' }));
            }}
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" /> Supprimer
          </button>
        </div>
      </form>
    </div>
  );
}
