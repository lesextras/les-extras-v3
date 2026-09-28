'use client';

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';

/**
 * MES FACTURES : l'outil premium des deux espaces de Pilote.
 *
 * Un seul composant pour l'association et l'académie ; seules les couleurs et
 * l'adresse de retour changent (`theme`). Le fonctionnement suit celui d'un
 * logiciel de gestion : on dépose la facture, le moteur la lit, on relit et on
 * valide, on suit les postes et les fournisseurs, on exporte pour le comptable.
 *
 * PREMIUM : sans abonnement actif, l'écran présente l'outil et le bouton
 * d'abonnement. Le prix est celui que l'API annonce ; s'il n'est pas encore
 * fixé, le bouton le dit au lieu d'inventer un montant.
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
}

interface Charge {
  abonnement: Abonnement;
  factures: Facture[];
  resume: Resume | null;
  postes: readonly string[];
}

const MOIS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
const STATUTS: Record<Facture['statut'], string> = { A_VERIFIER: 'À vérifier', VALIDEE: 'Validée', PAYEE: 'Payée' };

function euros(n: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 }).format(n);
}
function dateCourte(d: string | null) {
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

export function MesFactures({ theme }: { theme: ThemeFactures }) {
  const [charge, setCharge] = useState<Charge | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [occupe, setOccupe] = useState(false);
  const [ouverte, setOuverte] = useState<string | null>(null);
  const fichier = useRef<HTMLInputElement>(null);

  const recharger = useCallback(async () => {
    try {
      setCharge(await appel<Charge>('/factures'));
      setErreur(null);
    } catch (e) {
      setErreur(e instanceof Error ? e.message : 'Erreur');
    }
  }, []);

  useEffect(() => {
    void recharger();
    const q = new URLSearchParams(window.location.search).get('abonnement');
    if (q === 'succes') setMessage("Merci : l'abonnement s'active dans quelques secondes. Rechargez la page si l'outil ne s'ouvre pas encore.");
    if (q === 'annule') setMessage("Le paiement a été annulé : l'outil reste fermé.");
  }, [recharger]);

  const abonner = async () => {
    setOccupe(true);
    try {
      const r = await appel<{ url: string }>('/factures/abonnement', { method: 'POST', body: { espace: theme.espace } });
      window.location.href = r.url;
    } catch (e) {
      setErreur(e instanceof Error ? e.message : 'Erreur');
      setOccupe(false);
    }
  };

  const deposer = async (f: File, poste: string) => {
    setOccupe(true);
    setErreur(null);
    try {
      const form = new FormData();
      form.append('file', f);
      if (poste) form.append('poste', poste);
      const fa = await appel<Facture>('/factures', { method: 'POST', form });
      setMessage(`Facture lue : ${fa.fournisseur}, ${euros(fa.montantTTC)}. Relisez-la, puis validez.`);
      setOuverte(fa.id);
      await recharger();
    } catch (e) {
      setErreur(e instanceof Error ? e.message : 'Erreur');
    } finally {
      setOccupe(false);
      if (fichier.current) fichier.current.value = '';
    }
  };

  const modifier = async (id: string, corps: Partial<Facture>) => {
    setOccupe(true);
    try {
      await appel(`/factures/${id}`, { method: 'PATCH', body: corps });
      await recharger();
    } catch (e) {
      setErreur(e instanceof Error ? e.message : 'Erreur');
    } finally {
      setOccupe(false);
    }
  };

  const supprimer = async (id: string) => {
    if (!window.confirm('Supprimer cette facture ? Le fichier sera retiré du coffre.')) return;
    setOccupe(true);
    try {
      await appel(`/factures/${id}`, { method: 'DELETE' });
      await recharger();
    } catch (e) {
      setErreur(e instanceof Error ? e.message : 'Erreur');
    } finally {
      setOccupe(false);
    }
  };

  if (!charge && !erreur) return <p className="text-sm opacity-70">Chargement…</p>;

  const ab = charge?.abonnement;

  // ─── Sans abonnement : la page de présentation et le bouton ────────────────
  if (!ab?.actif) {
    return (
      <div className="grid gap-5">
        {message ? <Bandeau ton="info">{message}</Bandeau> : null}
        {erreur ? <Bandeau ton="alerte">{erreur}</Bandeau> : null}
        <div className={`${theme.carte} p-6 sm:p-8`}>
          <p className={`text-[13px] font-bold uppercase tracking-wide`} style={{ color: theme.primaire }}>
            Outil premium
          </p>
          <h2 className="mt-1 text-[26px] font-black leading-tight" style={{ color: theme.encre }}>
            Fini la saisie des factures.
          </h2>
          <p className="mt-3 max-w-[60ch] text-[16px] leading-relaxed" style={{ color: theme.encre }}>
            Vous déposez la facture d’un fournisseur, en photo ou en PDF. Le moteur lit le fournisseur, les montants, les dates et les
            lignes. Vous relisez, vous validez, et tout s’exporte pour votre expert-comptable ou le compte rendu financier d’une subvention.
          </p>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2">
            {[
              ['Zéro saisie', 'Une photo suffit : fournisseur, HT, TVA, TTC, échéance et lignes sont lus.'],
              ['Le budget qui se tient', 'Chaque facture va dans un poste : loyer, assurance, matériel, prestations…'],
              ['Alertes de prix', 'Un fournisseur qui augmente de 20 % ou plus, ou une facture en double : vous êtes prévenu.'],
              ['Export comptable', 'Un fichier propre pour le comptable, l’assemblée générale ou le financeur.'],
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
                Activer Mes factures, {euros(ab.prixCents / 100)} par mois
              </button>
            ) : (
              <button type="button" disabled className={theme.btnPrimaire} title="Le tarif n’est pas encore fixé">
                Tarif à venir
              </button>
            )}
            <span className="text-[14px] opacity-80" style={{ color: theme.encre }}>
              {ab?.quotaMensuel ?? 100} lectures par mois, sans engagement, résiliable à tout moment.
            </span>
          </div>
          <p className="mt-4 text-[13px] opacity-70" style={{ color: theme.encre }}>
            Vos factures restent dans votre coffre. Le moteur ne garde rien après la lecture.
          </p>
        </div>
      </div>
    );
  }

  // ─── Avec abonnement : l'outil ─────────────────────────────────────────────
  const r = charge!.resume!;
  const factures = charge!.factures;
  const plafond = Math.max(1, ...r.parMois);
  const postes = charge!.postes;

  return (
    <div className="grid gap-5">
      {message ? <Bandeau ton="info">{message}</Bandeau> : null}
      {erreur ? <Bandeau ton="alerte">{erreur}</Bandeau> : null}

      {/* Dépôt */}
      <div className={`${theme.carte} p-5`}>
        <div className="flex flex-wrap items-end gap-3">
          <label className="grid gap-1 text-[14px] font-bold" style={{ color: theme.encre }}>
            Déposer une facture (photo ou PDF)
            <input
              ref={fichier}
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              disabled={occupe}
              className="text-[14px]"
              onChange={(e) => {
                const f = e.target.files?.[0];
                const poste = (e.currentTarget.form?.elements.namedItem('poste') as HTMLSelectElement | null)?.value ?? '';
                if (f) void deposer(f, poste);
              }}
            />
          </label>
          <form className="contents" onSubmit={(e) => e.preventDefault()}>
            <label className="grid gap-1 text-[14px] font-bold" style={{ color: theme.encre }}>
              Poste (facultatif)
              <select name="poste" className="rounded-xl border px-3 py-2 text-[14px]" style={{ borderColor: theme.bordure }}>
                <option value="">Laisser le moteur choisir</option>
                {postes.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </label>
          </form>
          <p className="text-[13px] opacity-70" style={{ color: theme.encre }}>
            {ab.restantes} lecture{ab.restantes > 1 ? 's' : ''} restante{ab.restantes > 1 ? 's' : ''} ce mois-ci sur {ab.quotaMensuel}.
          </p>
          <a href="/api/proxy/factures/export.csv" className={`${theme.btnSecondaire} ml-auto`}>
            Exporter pour le comptable (CSV)
          </a>
        </div>
        {occupe ? (
          <p className="mt-3 text-[14px]" style={{ color: theme.primaire }}>
            Lecture en cours…
          </p>
        ) : null}
      </div>

      {/* Les chiffres */}
      <div className="grid gap-3 sm:grid-cols-4">
        <Chiffre theme={theme} titre={`Dépensé en ${r.annee}`} valeur={euros(r.total)} detail={`${r.nombre} facture${r.nombre > 1 ? 's' : ''}`} />
        <Chiffre theme={theme} titre="À payer" valeur={euros(r.aPayer)} detail="factures non réglées" />
        <Chiffre theme={theme} titre="À vérifier" valeur={String(r.aVerifier)} detail="lues par le moteur, à relire" />
        <Chiffre theme={theme} titre="Alertes" valeur={String(r.alertes)} detail="hausses et doublons" />
      </div>

      {/* Par mois et par poste */}
      <div className="grid gap-5 md:grid-cols-2">
        <div className={`${theme.carte} p-5`}>
          <h3 className="mb-3 text-[15px] font-bold" style={{ color: theme.encre }}>
            Par mois, {r.annee}
          </h3>
          <div className="flex h-32 items-end gap-1">
            {r.parMois.map((m, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-1" title={`${MOIS[i]} : ${euros(m)}`}>
                <div className="w-full rounded-t" style={{ height: `${Math.max(2, (m / plafond) * 100)}%`, background: theme.primaire }} />
                <span className="text-[10px] opacity-70" style={{ color: theme.encre }}>
                  {MOIS[i]}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className={`${theme.carte} p-5`}>
          <h3 className="mb-3 text-[15px] font-bold" style={{ color: theme.encre }}>
            Par poste et par fournisseur
          </h3>
          <ul className="grid gap-1 text-[14px]" style={{ color: theme.encre }}>
            {r.parPoste.slice(0, 6).map((p) => (
              <li key={p.poste} className="flex justify-between">
                <span>{p.poste}</span>
                <b>{euros(p.total)}</b>
              </li>
            ))}
          </ul>
          <ul className="mt-3 grid gap-1 border-t pt-3 text-[13px] opacity-80" style={{ color: theme.encre, borderColor: theme.bordure }}>
            {r.parFournisseur.slice(0, 5).map((f) => (
              <li key={f.fournisseur} className="flex justify-between">
                <span>{f.fournisseur}</span>
                <span>{euros(f.total)}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* La liste */}
      <div className={`${theme.carte} overflow-hidden`}>
        <table className="w-full text-[14px]" style={{ color: theme.encre }}>
          <thead>
            <tr className="text-left text-[12px] uppercase tracking-wide opacity-70">
              <th className="p-3">Date</th>
              <th className="p-3">Fournisseur</th>
              <th className="hidden p-3 sm:table-cell">Poste</th>
              <th className="p-3 text-right">TTC</th>
              <th className="p-3">Statut</th>
            </tr>
          </thead>
          <tbody>
            {factures.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-5 text-center opacity-70">
                  Aucune facture pour l’instant : déposez la première.
                </td>
              </tr>
            ) : null}
            {factures.map((f) => (
              <Ligne key={f.id} f={f} theme={theme} ouverte={ouverte === f.id} onOuvrir={() => setOuverte(ouverte === f.id ? null : f.id)} onModifier={modifier} onSupprimer={supprimer} postes={postes} occupe={occupe} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Chiffre({ theme, titre, valeur, detail }: { theme: ThemeFactures; titre: string; valeur: string; detail: string }) {
  return (
    <div className={`${theme.carte} p-4`}>
      <p className="text-[12px] font-bold uppercase tracking-wide opacity-70" style={{ color: theme.encre }}>
        {titre}
      </p>
      <p className="mt-1 text-[24px] font-black leading-none" style={{ color: theme.primaireFonce }}>
        {valeur}
      </p>
      <p className="mt-1 text-[13px] opacity-70" style={{ color: theme.encre }}>
        {detail}
      </p>
    </div>
  );
}

function Bandeau({ ton, children }: { ton: 'info' | 'alerte'; children: ReactNode }) {
  return (
    <p className={`rounded-xl border px-4 py-3 text-[14px] ${ton === 'alerte' ? 'border-[#F3B0C2] bg-[#FDE7EC] text-[#8A1B3D]' : 'border-[#C7C4F2] bg-[#ECEBFC] text-[#1D1B5C]'}`}>
      {children}
    </p>
  );
}

function Ligne({
  f,
  theme,
  ouverte,
  onOuvrir,
  onModifier,
  onSupprimer,
  postes,
  occupe,
}: {
  f: Facture;
  theme: ThemeFactures;
  ouverte: boolean;
  onOuvrir: () => void;
  onModifier: (id: string, corps: Partial<Facture>) => Promise<void>;
  onSupprimer: (id: string) => Promise<void>;
  postes: readonly string[];
  occupe: boolean;
}) {
  const [brouillon, setBrouillon] = useState<Partial<Facture>>({});
  const v = <K extends keyof Facture>(k: K) => (brouillon[k] !== undefined ? brouillon[k] : f[k]) as Facture[K];
  const champ = 'w-full rounded-lg border px-2 py-1 text-[14px]';
  return (
    <>
      <tr className="cursor-pointer border-t hover:bg-black/[0.02]" style={{ borderColor: theme.bordure }} onClick={onOuvrir}>
        <td className="p-3 whitespace-nowrap">{dateCourte(f.dateFacture) || dateCourte(f.deposeLe)}</td>
        <td className="p-3">
          <span className="font-bold">{f.fournisseur}</span>
          {f.alerte ? (
            <span className="ml-2 rounded-full bg-[#FDE7EC] px-2 py-0.5 text-[12px] font-bold text-[#8A1B3D]" title={f.alerte}>
              {f.variationPct !== null && f.variationPct >= 20 ? `+${f.variationPct} %` : 'à voir'}
            </span>
          ) : null}
        </td>
        <td className="hidden p-3 sm:table-cell">{f.poste ?? <span className="opacity-50">Sans poste</span>}</td>
        <td className="p-3 text-right font-bold">{euros(f.montantTTC)}</td>
        <td className="p-3">
          <span className={`rounded-full px-2 py-0.5 text-[12px] font-bold ${f.statut === 'PAYEE' ? 'bg-[#E3F5EC] text-[#0F5F3E]' : f.statut === 'VALIDEE' ? 'bg-[#ECEBFC] text-[#1D1B5C]' : 'bg-[#FFF4D6] text-[#7A4B00]'}`}>
            {STATUTS[f.statut]}
          </span>
        </td>
      </tr>
      {ouverte ? (
        <tr className="border-t" style={{ borderColor: theme.bordure, background: theme.fond }}>
          <td colSpan={5} className="p-4">
            {f.alerte ? <p className="mb-3 rounded-lg bg-[#FDE7EC] px-3 py-2 text-[13px] text-[#8A1B3D]">{f.alerte}</p> : null}
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
              <label className="grid gap-1 text-[12px] font-bold">
                Statut
                <select className={champ} style={{ borderColor: theme.bordure }} value={v('statut')} onChange={(e) => setBrouillon({ ...brouillon, statut: e.target.value as Facture['statut'] })}>
                  {(Object.keys(STATUTS) as Facture['statut'][]).map((s) => (
                    <option key={s} value={s}>
                      {STATUTS[s]}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            {f.lignes.length ? (
              <table className="mt-3 w-full text-[13px]">
                <tbody>
                  {f.lignes.map((l, i) => (
                    <tr key={i} className="border-t" style={{ borderColor: theme.bordure }}>
                      <td className="py-1 pr-2">{l.libelle}</td>
                      <td className="py-1 pr-2 text-right opacity-70">{l.quantite ?? ''}</td>
                      <td className="py-1 pr-2 text-right opacity-70">{l.prixUnitaire !== null ? euros(l.prixUnitaire) : ''}</td>
                      <td className="py-1 text-right font-bold">{l.total !== null ? euros(l.total) : ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : null}
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={occupe}
                className={theme.btnPrimaire}
                onClick={() => {
                  const corps = { ...brouillon };
                  if (f.statut === 'A_VERIFIER' && corps.statut === undefined) corps.statut = 'VALIDEE';
                  void onModifier(f.id, corps).then(() => setBrouillon({}));
                }}
              >
                {f.statut === 'A_VERIFIER' ? 'Valider la facture' : 'Enregistrer'}
              </button>
              {f.statut !== 'PAYEE' ? (
                <button type="button" disabled={occupe} className={theme.btnSecondaire} onClick={() => void onModifier(f.id, { statut: 'PAYEE' })}>
                  Marquer payée
                </button>
              ) : null}
              {f.fileId ? (
                <a href={`/api/proxy/files/${f.fileId}`} target="_blank" rel="noopener" className={theme.btnSecondaire}>
                  Voir le fichier
                </a>
              ) : null}
              <button type="button" disabled={occupe} className="ml-auto text-[13px] font-bold text-[#8A1B3D] underline" onClick={() => void onSupprimer(f.id)}>
                Supprimer
              </button>
            </div>
          </td>
        </tr>
      ) : null}
    </>
  );
}
