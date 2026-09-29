'use client';

import { useState, type FormEvent } from 'react';
import { appel } from '../_client';
import { BTN_DISCRET, BTN_PRIMAIRE, BTN_SECONDAIRE, CHAMP, Pastille } from '../_ui';
import { ORIGINE, dateCourte, euros, telecharger } from './outils';
import type { FactureOrg } from './types';

const STATUT: Record<string, { libelle: string; ton: 'ok' | 'attention' | 'alerte' | 'neutre' }> = {
  BROUILLON: { libelle: 'Brouillon', ton: 'neutre' },
  EMISE: { libelle: 'Émise', ton: 'attention' },
  PAYEE: { libelle: 'Payée', ton: 'ok' },
  ANNULEE: { libelle: 'Annulée par avoir', ton: 'alerte' },
  ACCEPTE: { libelle: 'Accepté', ton: 'ok' },
  REFUSE: { libelle: 'Refusé', ton: 'alerte' },
};
const TYPE = { FACTURE: 'Facture', AVOIR: 'Avoir', DEVIS: 'Devis' } as const;

export const GENRES: Record<string, string> = {
  ENTREPRISE: 'Entreprise ou association',
  OPCO: 'OPCO',
  PARTICULIER: 'Particulier',
  PUBLIC: 'Financeur public',
  ORGANISME: 'Autre organisme de formation',
};

/**
 * UNE LIGNE DE FACTURE, DEVIS OU AVOIR, AVEC CE QU'ON PEUT EN FAIRE.
 *
 * Les gestes suivent le statut : un brouillon se corrige, s'émet ou se
 * supprime ; une facture émise s'envoie, s'encaisse ou s'annule par un avoir ;
 * un devis s'accepte, se refuse, devient une facture. Jamais de « modifier »
 * sur une facture émise : ce n'est pas un oubli, c'est la loi.
 */
export function LigneFactureOrg({ f, apres, modifier }: { f: FactureOrg; apres: () => Promise<void>; modifier?: (f: FactureOrg) => void }) {
  const [occupe, setOccupe] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [saisie, setSaisie] = useState<'aucune' | 'paiement' | 'avoir'>('aucune');
  const [montant, setMontant] = useState('');
  const [motif, setMotif] = useState('');
  const reste = Math.round((f.totalTtc - f.montantPaye) * 100) / 100;

  const faire = async (fn: () => Promise<unknown>, ok?: string) => {
    setOccupe(true);
    setErreur(null);
    setMessage(null);
    try {
      await fn();
      if (ok) setMessage(ok);
      setSaisie('aucune');
      await apres();
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "L'action n'a pas abouti.");
    } finally {
      setOccupe(false);
    }
  };
  const base = `/academie/gestion/factures/${f.id}`;
  const nombre = (t: string) => Number(t.replace(',', '.'));

  return (
    <li className={`rounded-2xl border bg-white p-4 ${f.enRetard ? 'border-[#F3B0C2]' : 'border-[#DDEBE4]'}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[16px] font-extrabold text-[#12312A]">
              {TYPE[f.type]} {f.numero ?? ''}
            </span>
            <Pastille ton={STATUT[f.statut].ton}>{STATUT[f.statut].libelle}</Pastille>
            {f.enRetard ? <Pastille ton="alerte">En retard{f.relances ? `, ${f.relances} relance${f.relances > 1 ? 's' : ''}` : ''}</Pastille> : null}
          </div>
          <p className="mt-1 text-[15px] text-[#334A42]">
            {f.client.nom}
            {f.session ? ` · ${f.session.title || f.session.formation.title}` : ''}
          </p>
          <p className="text-[14px] text-[#5E7A6E]">
            {f.dateEmission ? `Émis le ${dateCourte(f.dateEmission)}` : 'Pas encore émis'}
            {f.type === 'FACTURE' && f.echeance ? ` · échéance ${dateCourte(f.echeance)}` : ''}
            {f.type === 'DEVIS' && f.echeance ? ` · valable jusqu'au ${dateCourte(f.echeance)}` : ''}
            {f.origineBpf ? ` · ${ORIGINE[f.origineBpf] ?? f.origineBpf}` : ''}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[18px] font-extrabold tabular-nums text-[#12312A]">{euros(f.totalTtc)}</p>
          <p className="text-[13px] text-[#5E7A6E]">{euros(f.totalHt)} HT</p>
          {f.type === 'FACTURE' && f.montantPaye > 0 && f.statut !== 'PAYEE' ? <p className="text-[13px] font-bold text-[#B45309]">Reste {euros(reste)}</p> : null}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-1">
        <button type="button" className={BTN_DISCRET} disabled={occupe} onClick={() => void faire(() => telecharger(`${base}/pdf`, `${f.numero ?? 'brouillon'}.pdf`))}>
          PDF
        </button>
        {f.statut === 'BROUILLON' ? (
          <>
            {modifier ? (
              <button type="button" className={BTN_DISCRET} disabled={occupe} onClick={() => modifier(f)}>
                Corriger
              </button>
            ) : null}
            <button
              type="button"
              className={BTN_DISCRET}
              disabled={occupe}
              onClick={() => {
                if (!window.confirm(`Émettre ${f.type === 'DEVIS' ? 'ce devis' : 'cette facture'} ? ${f.type === 'FACTURE' ? 'Un numéro lui est attribué, et elle ne pourra plus être modifiée : seul un avoir pourra l’annuler.' : 'Un numéro lui est attribué.'}`)) return;
                void faire(() => appel(`${base}/emettre`, { method: 'POST' }), 'Émis : le numéro est attribué.');
              }}
            >
              Émettre
            </button>
            <button
              type="button"
              className={`${BTN_DISCRET} text-[#8A1B3D]`}
              disabled={occupe}
              onClick={() => {
                if (!window.confirm('Supprimer ce brouillon ?')) return;
                void faire(() => appel(base, { method: 'DELETE' }));
              }}
            >
              Supprimer
            </button>
          </>
        ) : null}
        {f.statut !== 'BROUILLON' && f.statut !== 'REFUSE' ? (
          <button type="button" className={BTN_DISCRET} disabled={occupe || !f.client.email} title={f.client.email ? undefined : 'Le client n’a pas d’adresse e-mail'} onClick={() => void faire(() => appel(`${base}/envoyer`, { method: 'POST' }), `Envoyé à ${f.client.email}.`)}>
            Envoyer par e-mail
          </button>
        ) : null}
        {f.type === 'FACTURE' && f.statut === 'EMISE' ? (
          <>
            <button type="button" className={BTN_DISCRET} disabled={occupe} onClick={() => { setSaisie('paiement'); setMontant(String(reste).replace('.', ',')); }}>
              Enregistrer un règlement
            </button>
            <button
              type="button"
              className={BTN_DISCRET}
              disabled={occupe}
              onClick={() => void faire(() => appel(base, { method: 'PATCH', body: { relancesActives: !f.relancesActives } }), f.relancesActives ? 'Relances automatiques suspendues.' : 'Relances automatiques réactivées.')}
            >
              {f.relancesActives ? 'Suspendre les relances' : 'Réactiver les relances'}
            </button>
          </>
        ) : null}
        {f.type === 'FACTURE' && (f.statut === 'EMISE' || f.statut === 'PAYEE') ? (
          <button type="button" className={BTN_DISCRET} disabled={occupe} onClick={() => setSaisie('avoir')}>
            Faire un avoir
          </button>
        ) : null}
        {f.type === 'DEVIS' && f.statut === 'EMISE' ? (
          <>
            <button type="button" className={BTN_DISCRET} disabled={occupe} onClick={() => void faire(() => appel(`${base}/accepter`, { method: 'POST' }), 'Devis accepté.')}>
              Accepté par le client
            </button>
            <button type="button" className={BTN_DISCRET} disabled={occupe} onClick={() => void faire(() => appel(`${base}/refuser`, { method: 'POST' }), 'Devis refusé.')}>
              Refusé
            </button>
          </>
        ) : null}
        {f.type === 'DEVIS' && (f.statut === 'EMISE' || f.statut === 'ACCEPTE') ? (
          <button type="button" className={BTN_DISCRET} disabled={occupe} onClick={() => void faire(() => appel(`${base}/facturer`, { method: 'POST' }), 'Facture préparée en brouillon, reprise du devis : relis-la puis émets-la.')}>
            En faire une facture
          </button>
        ) : null}
      </div>

      {saisie === 'paiement' ? (
        <form
          className="mt-3 flex flex-wrap items-end gap-2 rounded-xl bg-[#F7FBF9] p-3"
          onSubmit={(e: FormEvent) => {
            e.preventDefault();
            void faire(() => appel(`${base}/paiement`, { method: 'POST', body: { montant: nombre(montant) } }), 'Règlement enregistré.');
          }}
        >
          <label className="block">
            <span className="mb-1 block text-sm font-bold text-[#12312A]">Montant reçu (€ TTC)</span>
            <input className={CHAMP} inputMode="decimal" value={montant} onChange={(e) => setMontant(e.target.value)} required />
          </label>
          <button type="submit" className={BTN_PRIMAIRE} disabled={occupe}>
            Enregistrer
          </button>
          <button type="button" className={BTN_SECONDAIRE} onClick={() => setSaisie('aucune')}>
            Annuler
          </button>
        </form>
      ) : null}
      {saisie === 'avoir' ? (
        <form
          className="mt-3 grid gap-2 rounded-xl bg-[#F7FBF9] p-3 sm:grid-cols-[1fr_2fr_auto_auto] sm:items-end"
          onSubmit={(e: FormEvent) => {
            e.preventDefault();
            void faire(() => appel(`${base}/avoir`, { method: 'POST', body: { ...(montant.trim() ? { montantHt: nombre(montant) } : {}), ...(motif.trim() ? { motif: motif.trim() } : {}) } }), 'Avoir émis.');
          }}
        >
          <label className="block">
            <span className="mb-1 block text-sm font-bold text-[#12312A]">Montant HT</span>
            <input className={CHAMP} inputMode="decimal" value={montant} onChange={(e) => setMontant(e.target.value)} placeholder="Vide : avoir total" />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-bold text-[#12312A]">Motif</span>
            <input className={CHAMP} value={motif} onChange={(e) => setMotif(e.target.value)} maxLength={300} placeholder="Absence d'un stagiaire, erreur de prix…" />
          </label>
          <button type="submit" className={BTN_PRIMAIRE} disabled={occupe}>
            Émettre l&apos;avoir
          </button>
          <button type="button" className={BTN_SECONDAIRE} onClick={() => setSaisie('aucune')}>
            Annuler
          </button>
        </form>
      ) : null}

      {erreur ? <p className="mt-2 rounded-lg bg-[#FDE7EC] px-3 py-2 text-[14px] text-[#8A1B3D]">{erreur}</p> : null}
      {message ? <p className="mt-2 rounded-lg bg-[#E3F5EC] px-3 py-2 text-[14px] text-[#0F5F3E]">{message}</p> : null}
    </li>
  );
}

interface LigneSaisie {
  libelle: string;
  quantite: string;
  prix: string;
  tva: string;
}

/** Créer ou corriger un brouillon (facture ou devis). */
export function EditeurFacture({
  initiale,
  tvaParDefaut,
  enregistre,
  annuler,
}: {
  initiale?: FactureOrg | null;
  tvaParDefaut: number;
  enregistre: () => Promise<void>;
  annuler: () => void;
}) {
  const [type, setType] = useState<'FACTURE' | 'DEVIS'>(initiale?.type === 'DEVIS' ? 'DEVIS' : 'FACTURE');
  const [client, setClient] = useState({
    nom: initiale?.client.nom ?? '',
    adresse: initiale?.client.adresse ?? '',
    codePostal: initiale?.client.codePostal ?? '',
    ville: initiale?.client.ville ?? '',
    siret: initiale?.client.siret ?? '',
    email: initiale?.client.email ?? '',
    contact: initiale?.client.contact ?? '',
    genre: initiale?.client.genre ?? 'ENTREPRISE',
  });
  const [lignes, setLignes] = useState<LigneSaisie[]>(
    initiale?.lignes.map((l) => ({ libelle: l.libelle, quantite: String(l.quantite), prix: String(l.prixUnitaireHt), tva: String(l.tauxTva) })) ?? [{ libelle: '', quantite: '1', prix: '', tva: String(tvaParDefaut) }],
  );
  const [dossier, setDossier] = useState(initiale?.numeroDossier ?? '');
  const [reference, setReference] = useState(initiale?.referenceClient ?? '');
  const [occupe, setOccupe] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const nombre = (t: string) => Number(t.replace(',', '.')) || 0;
  const totalHt = lignes.reduce((t, l) => t + Math.round(nombre(l.quantite) * nombre(l.prix) * 100) / 100, 0);
  const totalTva = lignes.reduce((t, l) => t + Math.round(((Math.round(nombre(l.quantite) * nombre(l.prix) * 100) / 100) * nombre(l.tva)) / 100 * 100) / 100, 0);

  const envoyer = async (e: FormEvent) => {
    e.preventDefault();
    setOccupe(true);
    setErreur(null);
    const c = Object.fromEntries(Object.entries(client).map(([k, v]) => [k, typeof v === 'string' ? v.trim() : v]).filter(([, v]) => v !== '')) as Record<string, string>;
    const corps = {
      client: c,
      lignes: lignes.filter((l) => l.libelle.trim()).map((l) => ({ libelle: l.libelle.trim(), quantite: nombre(l.quantite), prixUnitaireHt: nombre(l.prix), tauxTva: nombre(l.tva) })),
      numeroDossier: dossier.trim() || undefined,
      referenceClient: reference.trim() || undefined,
    };
    try {
      if (initiale) await appel(`/academie/gestion/factures/${initiale.id}`, { method: 'PATCH', body: { ...corps, numeroDossier: corps.numeroDossier ?? null, referenceClient: corps.referenceClient ?? null } });
      else await appel('/academie/gestion/factures', { method: 'POST', body: { type, ...corps } });
      await enregistre();
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Le document n'a pas pu être enregistré.");
    } finally {
      setOccupe(false);
    }
  };

  const majClient = (k: keyof typeof client) => (e: { target: { value: string } }) => setClient((x) => ({ ...x, [k]: e.target.value }));

  return (
    <form onSubmit={envoyer} className="space-y-4 rounded-2xl border border-[#DDEBE4] bg-[#F7FBF9] p-4 sm:p-5">
      {!initiale ? (
        <div className="flex gap-2">
          {(['FACTURE', 'DEVIS'] as const).map((t) => (
            <button key={t} type="button" onClick={() => setType(t)} className={`rounded-full px-4 py-2 text-sm font-bold ${type === t ? 'bg-[#0F5F3E] text-white' : 'bg-white text-[#0F5F3E]'}`}>
              {t === 'FACTURE' ? 'Une facture' : 'Un devis'}
            </button>
          ))}
        </div>
      ) : null}
      <fieldset className="grid gap-3 sm:grid-cols-2">
        <legend className="mb-1 text-[15px] font-extrabold text-[#12312A]">Le client</legend>
        <input className={CHAMP} value={client.nom} onChange={majClient('nom')} placeholder="Nom ou raison sociale" required minLength={2} aria-label="Nom du client" />
        <select className={CHAMP} value={client.genre} onChange={majClient('genre')} aria-label="Type de client">
          {Object.entries(GENRES).map(([k, l]) => (
            <option key={k} value={k}>
              {l}
            </option>
          ))}
        </select>
        <input className={CHAMP} value={client.adresse} onChange={majClient('adresse')} placeholder="Adresse" aria-label="Adresse" />
        <div className="grid grid-cols-[120px_1fr] gap-2">
          <input className={CHAMP} value={client.codePostal} onChange={majClient('codePostal')} placeholder="Code postal" aria-label="Code postal" maxLength={10} />
          <input className={CHAMP} value={client.ville} onChange={majClient('ville')} placeholder="Ville" aria-label="Ville" />
        </div>
        <input className={CHAMP} value={client.siret} onChange={majClient('siret')} placeholder="SIRET" aria-label="SIRET" maxLength={14} inputMode="numeric" />
        <input className={CHAMP} type="email" value={client.email} onChange={majClient('email')} placeholder="E-mail (pour l'envoi)" aria-label="E-mail" />
        <input className={CHAMP} value={client.contact} onChange={majClient('contact')} placeholder="À l'attention de" aria-label="Contact" />
      </fieldset>
      <fieldset>
        <legend className="mb-2 text-[15px] font-extrabold text-[#12312A]">Les lignes</legend>
        <div className="grid gap-2">
          {lignes.map((l, i) => (
            <div key={i} className="grid gap-2 sm:grid-cols-[1fr_80px_120px_80px_auto]">
              <input className={CHAMP} value={l.libelle} onChange={(e) => setLignes((x) => x.map((y, k) => (k === i ? { ...y, libelle: e.target.value } : y)))} placeholder="Désignation" aria-label={`Désignation, ligne ${i + 1}`} />
              <input className={CHAMP} inputMode="decimal" value={l.quantite} onChange={(e) => setLignes((x) => x.map((y, k) => (k === i ? { ...y, quantite: e.target.value } : y)))} aria-label={`Quantité, ligne ${i + 1}`} />
              <input className={CHAMP} inputMode="decimal" value={l.prix} onChange={(e) => setLignes((x) => x.map((y, k) => (k === i ? { ...y, prix: e.target.value } : y)))} placeholder="PU HT" aria-label={`Prix unitaire HT, ligne ${i + 1}`} />
              <input className={CHAMP} inputMode="decimal" value={l.tva} onChange={(e) => setLignes((x) => x.map((y, k) => (k === i ? { ...y, tva: e.target.value } : y)))} aria-label={`TVA en %, ligne ${i + 1}`} />
              <button type="button" className={BTN_DISCRET} onClick={() => setLignes((x) => (x.length > 1 ? x.filter((_, k) => k !== i) : x))} aria-label={`Retirer la ligne ${i + 1}`}>
                ✕
              </button>
            </div>
          ))}
        </div>
        <button type="button" className={`${BTN_DISCRET} mt-2`} onClick={() => setLignes((x) => [...x, { libelle: '', quantite: '1', prix: '', tva: String(tvaParDefaut) }])}>
          + Ajouter une ligne
        </button>
        <p className="mt-2 text-right text-[15px] font-bold text-[#12312A]">
          {euros(totalHt)} HT · {euros(totalTva)} TVA · {euros(totalHt + totalTva)} TTC
        </p>
      </fieldset>
      <div className="grid gap-3 sm:grid-cols-2">
        <input className={CHAMP} value={dossier} onChange={(e) => setDossier(e.target.value)} placeholder="N° de dossier OPCO ou d'accord de prise en charge" aria-label="Numéro de dossier" maxLength={80} />
        <input className={CHAMP} value={reference} onChange={(e) => setReference(e.target.value)} placeholder="Référence du client (bon de commande)" aria-label="Référence du client" maxLength={80} />
      </div>
      {erreur ? <p className="rounded-lg bg-[#FDE7EC] px-3 py-2 text-[14px] text-[#8A1B3D]">{erreur}</p> : null}
      <div className="flex flex-wrap gap-2">
        <button type="submit" className={BTN_PRIMAIRE} disabled={occupe}>
          {initiale ? 'Enregistrer le brouillon' : 'Créer le brouillon'}
        </button>
        <button type="button" className={BTN_SECONDAIRE} onClick={annuler}>
          Annuler
        </button>
      </div>
    </form>
  );
}
