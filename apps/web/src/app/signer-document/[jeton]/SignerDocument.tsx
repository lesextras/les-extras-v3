'use client';

import { useState } from 'react';

export interface InfosSignature {
  type: 'CONVENTION' | 'CONTRAT';
  titre: string;
  organisme: string;
  formation: string;
  debut: string | null;
  fin: string | null;
  signataireNom: string | null;
  emailMasque: string;
  statut: 'PRODUIT' | 'ENVOYE' | 'A_SIGNER' | 'SIGNE' | 'REFUSE';
  signeLe: string | null;
}

const bouton = 'inline-flex items-center justify-center rounded-xl bg-[#1E9E6A] px-5 py-3 text-base font-bold text-white shadow-sm disabled:opacity-60';
const secondaire = 'inline-flex items-center justify-center rounded-xl border-2 border-[#CFE4D9] bg-white px-5 py-[10px] text-base font-bold text-[#12312A] disabled:opacity-60';

async function poster<T>(url: string, corps?: unknown): Promise<T> {
  const r = await fetch(`/api/proxy${url}`, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: corps === undefined ? undefined : JSON.stringify(corps) });
  const texte = await r.text();
  let j: unknown = null;
  try {
    j = texte ? JSON.parse(texte) : null;
  } catch {
    j = null;
  }
  if (!r.ok) {
    if (r.status === 429) throw new Error('Trop de tentatives : patientez un moment avant de réessayer.');
    const m = (j as { message?: string | string[] } | null)?.message;
    throw new Error((Array.isArray(m) ? m.join(' · ') : m) || "L'opération n'a pas abouti.");
  }
  return j as T;
}

/**
 * SIGNER UNE CONVENTION OU UN CONTRAT : lire, recevoir un code, signer.
 *
 * Signature électronique simple (art. 1367 du code civil) : le code à six
 * chiffres part à l'adresse du signataire et vaut quinze minutes ; le document
 * signé est celui dont l'empreinte a été calculée à l'envoi.
 */
export function SignerDocument({ jeton, infos }: { jeton: string; infos: InfosSignature }) {
  const base = `/public/academie/signature/${encodeURIComponent(jeton)}`;
  const [etape, setEtape] = useState<'lire' | 'code' | 'signe' | 'refuse'>(infos.statut === 'SIGNE' ? 'signe' : infos.statut === 'REFUSE' ? 'refuse' : 'lire');
  const [lu, setLu] = useState(false);
  const [code, setCode] = useState('');
  const [motif, setMotif] = useState('');
  const [refus, setRefus] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [occupe, setOccupe] = useState(false);
  const [envoyeA, setEnvoyeA] = useState(infos.emailMasque);

  const faire = async (f: () => Promise<void>) => {
    setOccupe(true);
    setErreur(null);
    try {
      await f();
    } catch (e) {
      setErreur((e as Error).message);
    } finally {
      setOccupe(false);
    }
  };
  const nom = infos.type === 'CONVENTION' ? 'la convention' : 'le contrat';

  return (
    <main className="min-h-screen bg-[#F2F7F5] px-4 py-10 text-[#334A42]" style={{ fontFamily: 'system-ui, sans-serif' }}>
      <div className="mx-auto max-w-[680px] rounded-3xl border border-[#DDEBE4] bg-white p-6 shadow-sm sm:p-8">
        <p className="text-sm font-bold uppercase tracking-[0.14em] text-[#5E7A6E]">{infos.organisme}</p>
        <h1 className="mt-2 text-[28px] font-extrabold leading-tight tracking-tight text-[#12312A]">{infos.type === 'CONVENTION' ? 'Convention de formation' : 'Contrat de formation professionnelle'}</h1>
        <p className="mt-2 text-[17px]">
          {infos.formation}
          {infos.debut ? `, à partir du ${new Date(infos.debut).toLocaleDateString('fr-FR')}` : ''}
        </p>

        {etape === 'signe' ? (
          <p className="mt-6 rounded-2xl bg-[#E3F5EC] px-5 py-4 text-[17px] font-bold text-[#0F5F3E]">
            ✓ {infos.type === 'CONVENTION' ? 'La convention est signée' : 'Le contrat est signé'}
            {infos.signeLe ? ` depuis le ${new Date(infos.signeLe).toLocaleDateString('fr-FR')}` : ''}. Vous pouvez télécharger l&apos;exemplaire signé ci-dessous.
          </p>
        ) : null}
        {etape === 'refuse' ? <p className="mt-6 rounded-2xl bg-[#FDE7EC] px-5 py-4 text-[#8A1B3D]">Cette demande de signature a été retirée ou refusée. Pour toute question, écrivez à l&apos;organisme.</p> : null}

        <a href={`/api/proxy${base}/pdf`} target="_blank" rel="noopener" onClick={() => setLu(true)} className={`${secondaire} mt-6 w-full no-underline`}>
          {etape === 'signe' ? "Télécharger l'exemplaire signé (PDF)" : `Lire ${nom} (PDF)`}
        </a>

        {etape === 'lire' ? (
          <div className="mt-6 grid gap-4">
            <label className="flex items-start gap-3 text-[16px]">
              <input type="checkbox" className="mt-1 h-5 w-5 accent-[#1E9E6A]" checked={lu} onChange={(e) => setLu(e.target.checked)} />
              <span>
                J&apos;ai lu {nom} et je l&apos;accepte{infos.signataireNom ? `, en tant que ${infos.signataireNom}` : ''}.
              </span>
            </label>
            <button
              type="button"
              className={bouton}
              disabled={!lu || occupe}
              onClick={() =>
                void faire(async () => {
                  const r = await poster<{ emailMasque: string }>(`${base}/code`);
                  setEnvoyeA(r.emailMasque);
                  setEtape('code');
                })
              }
            >
              Recevoir mon code de signature
            </button>
            {infos.type === 'CONTRAT' ? <p className="text-[14px] text-[#5E7A6E]">Vous disposerez de dix jours à compter de la signature pour vous rétracter, par lettre recommandée avec avis de réception.</p> : null}
            {!refus ? (
              <button type="button" className="text-left text-[14px] font-bold text-[#5E7A6E] underline" onClick={() => setRefus(true)}>
                Je ne souhaite pas signer
              </button>
            ) : (
              <div className="grid gap-2 rounded-2xl bg-[#F7FBF9] p-4">
                <label className="block">
                  <span className="mb-1.5 block text-[15px] font-bold text-[#12312A]">Pourquoi ? (facultatif)</span>
                  <textarea className="w-full rounded-xl border border-[#CFE4D9] px-3 py-2" maxLength={500} value={motif} onChange={(e) => setMotif(e.target.value)} />
                </label>
                <button type="button" className={secondaire} disabled={occupe} onClick={() => void faire(async () => { await poster(`${base}/refuser`, { motif: motif.trim() || undefined }); setEtape('refuse'); })}>
                  Refuser la signature
                </button>
              </div>
            )}
          </div>
        ) : null}

        {etape === 'code' ? (
          <form
            className="mt-6 grid gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              void faire(async () => {
                await poster(`${base}/signer`, { code: code.replace(/\D/g, '') });
                setEtape('signe');
              });
            }}
          >
            <p className="text-[16px]">
              Un code à six chiffres vient de partir à <strong>{envoyeA}</strong>. Il vaut quinze minutes.
            </p>
            <input
              className="w-full max-w-[240px] rounded-xl border border-[#CFE4D9] px-4 py-3 text-center font-mono text-2xl tracking-[0.3em]"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={7}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/[^\d ]/g, ''))}
              aria-label="Code reçu par e-mail"
              required
            />
            <button type="submit" className={bouton} disabled={occupe || code.replace(/\D/g, '').length !== 6}>
              Signer
            </button>
            <button type="button" className="text-left text-[14px] font-bold text-[#5E7A6E] underline" disabled={occupe} onClick={() => void faire(async () => { const r = await poster<{ emailMasque: string }>(`${base}/code`); setEnvoyeA(r.emailMasque); })}>
              Renvoyer un code
            </button>
          </form>
        ) : null}

        {erreur ? <p className="mt-4 rounded-xl bg-[#FDE7EC] px-4 py-3 text-[#8A1B3D]" role="alert">{erreur}</p> : null}
        <p className="mt-8 text-[13px] text-[#8FA79B]">Signature électronique simple (article 1367 du code civil). La date, l&apos;heure et l&apos;empreinte du document signé sont conservées.</p>
      </div>
    </main>
  );
}
