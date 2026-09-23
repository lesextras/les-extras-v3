'use client';

import { useState, type FormEvent } from 'react';
import { appel, messageDe } from '../../_ecole/api';
import { BTN_DISCRET, BTN_PRIMAIRE, CARTE, CHAMP, Encart, Pastille, formaterDate } from '../../_ui';

export interface Cle {
  id: string;
  nom: string;
  prefixe: string;
  creeLe: string;
  derniereUtilisation: string | null;
  revoqueeLe: string | null;
}

const ROUTES = [
  { methode: 'GET', chemin: '/formations', quoi: 'Tes formations (titre, adresse, prix, statut, nombre d’inscrits).' },
  { methode: 'GET', chemin: '/apprenants?coursId=…', quoi: 'Tes apprenants et leur progression, pour une formation ou toutes.' },
  { methode: 'POST', chemin: '/inscriptions', quoi: 'Inscrire quelqu’un à une formation : { "coursId", "email", "prenom", "nom" }. Il reçoit son lien d’accès.' },
  { methode: 'GET', chemin: '/ventes', quoi: 'Tes ventes (formation, montant, date, acheteur).' },
];

export function CleApi({ initiales, base }: { initiales: Cle[]; base: string }) {
  const [cles, setCles] = useState(initiales);
  const [nom, setNom] = useState('');
  const [nouvelle, setNouvelle] = useState<string | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [occupe, setOccupe] = useState(false);

  async function creer(e: FormEvent) {
    e.preventDefault();
    setOccupe(true);
    setErreur(null);
    try {
      const c = await appel<Cle & { cle: string }>('/ecole/cles-api', { methode: 'POST', corps: { nom: nom.trim() } });
      setNouvelle(c.cle);
      setCles((l) => [{ id: c.id, nom: c.nom, prefixe: c.prefixe, creeLe: c.creeLe, derniereUtilisation: null, revoqueeLe: null }, ...l]);
      setNom('');
    } catch (err) {
      setErreur(messageDe(err));
    } finally {
      setOccupe(false);
    }
  }

  async function revoquer(id: string) {
    if (!window.confirm('Révoquer cette clé ? Les outils qui l’utilisent cesseront de fonctionner.')) return;
    try {
      await appel(`/ecole/cles-api/${id}`, { methode: 'DELETE' });
      setCles((l) => l.map((c) => (c.id === id ? { ...c, revoqueeLe: new Date().toISOString() } : c)));
    } catch (err) {
      setErreur(messageDe(err));
    }
  }

  return (
    <div className="grid gap-5">
      <form onSubmit={creer} className={`${CARTE} flex flex-wrap items-end gap-3 p-5`}>
        <label className="block min-w-[240px] flex-1">
          <span className="mb-1.5 block text-[13px] font-bold text-[#12312A]">Nom de la clé (à quoi elle sert)</span>
          <input value={nom} onChange={(e) => setNom(e.target.value)} className={CHAMP} maxLength={80} placeholder="Zapier, mon CRM…" required minLength={2} />
        </label>
        <button type="submit" disabled={occupe} className={BTN_PRIMAIRE}>
          Créer une clé
        </button>
      </form>

      {nouvelle ? (
        <Encart ton="attention">
          <p className="font-extrabold">Copie cette clé maintenant : elle ne sera plus jamais affichée.</p>
          <p className="mt-2 break-all rounded-lg bg-white px-3 py-2 font-mono text-[14px] text-[#12312A]">{nouvelle}</p>
          <p className="mt-2 text-sm">Garde-la comme un mot de passe : elle donne accès à tes apprenants. Si elle fuit, révoque-la.</p>
          <button
            type="button"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(nouvelle);
              } catch {
                /* la clé reste affichée */
              }
            }}
            className={`${BTN_DISCRET} mt-1`}
          >
            Copier
          </button>
        </Encart>
      ) : null}
      {erreur ? <Encart ton="alerte">{erreur}</Encart> : null}

      <section className={`${CARTE} p-5`}>
        <h2 className="text-[17px] font-extrabold text-[#12312A]">Tes clés</h2>
        {cles.length ? (
          <ul className="mt-3 grid gap-2">
            {cles.map((c) => (
              <li key={c.id} className="flex flex-wrap items-center gap-3 border-b border-[#EDF4F1] py-2">
                <span className="min-w-[160px] flex-1 font-bold text-[#12312A]">{c.nom}</span>
                <span className="font-mono text-[14px] text-[#5E7A6E]">{c.prefixe}…</span>
                <span className="text-sm text-[#5E7A6E]">créée le {formaterDate(c.creeLe)}</span>
                <span className="text-sm text-[#5E7A6E]">{c.derniereUtilisation ? `utilisée le ${formaterDate(c.derniereUtilisation)}` : 'jamais utilisée'}</span>
                {c.revoqueeLe ? (
                  <Pastille ton="neutre">Révoquée</Pastille>
                ) : (
                  <button type="button" onClick={() => revoquer(c.id)} className={BTN_DISCRET}>
                    Révoquer
                  </button>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-[15px] text-[#5E7A6E]">Aucune clé pour l&apos;instant.</p>
        )}
      </section>

      <section className={`${CARTE} p-5`}>
        <h2 className="text-[17px] font-extrabold text-[#12312A]">La documentation</h2>
        <p className="mt-1 text-[15px]">
          Adresse de base : <code className="rounded bg-[#EDF3F0] px-1.5 py-0.5 font-mono text-[14px]">{base}</code>. Chaque appel porte l&apos;en-tête{' '}
          <code className="rounded bg-[#EDF3F0] px-1.5 py-0.5 font-mono text-[14px]">Authorization: Bearer pk_…</code>. Réponses en JSON ; 120 appels par minute au plus.
        </p>
        <ul className="mt-4 grid gap-3">
          {ROUTES.map((r) => (
            <li key={r.chemin} className="rounded-xl border border-[#EDF4F1] p-3">
              <p className="font-mono text-[14px]">
                <span className={`mr-2 rounded px-1.5 py-0.5 text-[12px] font-bold text-white ${r.methode === 'GET' ? 'bg-[#1E9E6A]' : 'bg-[#C42B57]'}`}>{r.methode}</span>
                {r.chemin}
              </p>
              <p className="mt-1 text-[15px] text-[#334A42]">{r.quoi}</p>
            </li>
          ))}
        </ul>
        <pre className="mt-4 overflow-x-auto rounded-xl bg-[#12312A] p-4 text-[13px] text-[#D3E7DC]">{`curl ${base}/formations \\
  -H "Authorization: Bearer pk_votre_cle"`}</pre>
      </section>
    </div>
  );
}
