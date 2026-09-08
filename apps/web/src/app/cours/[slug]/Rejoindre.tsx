'use client';

import { useEffect, useState } from 'react';

/**
 * S'INSCRIRE À UN COURS.
 *
 * Un cours gratuit s'ouvre tout de suite : une adresse e-mail, et le lien
 * personnel s'affiche. Un cours payant se règle en ligne — on part chez le
 * prestataire de paiement, et l'accès s'ouvre au retour, quand le paiement est
 * confirmé. Rien n'est créé avant : tant que ce n'est pas payé, rien n'existe.
 */
export function Rejoindre({
  slug,
  gratuit,
  couleur,
  ecole,
}: {
  slug: string;
  gratuit: boolean;
  couleur: string;
  ecole: string;
}) {
  const [email, setEmail] = useState('');
  const [prenom, setPrenom] = useState('');
  const [code, setCode] = useState('');
  const [occupe, setOccupe] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [lien, setLien] = useState<string | null>(null);
  const [attente, setAttente] = useState(false);

  /**
   * LE RETOUR DU PAIEMENT.
   *
   * Le prestataire nous renvoie avec l'identifiant de la session ; c'est son
   * appel à nous, pas ce retour, qui inscrit l'apprenant. On demande donc le
   * lien jusqu'à ce qu'il existe, quelques secondes tout au plus.
   */
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const p = new URLSearchParams(window.location.search);
    if (p.get('paiement') !== 'succes') return;
    const session = p.get('session');
    if (!session) return;
    setAttente(true);
    let restant = 15;
    const t = setInterval(async () => {
      restant -= 1;
      try {
        const r = await fetch(`/api/proxy/public/ecole/achat/${encodeURIComponent(session)}`, {
          headers: { Accept: 'application/json' },
        });
        const d = (await r.json()) as { pret?: boolean; lien?: string };
        if (d?.pret && d.lien) {
          clearInterval(t);
          setAttente(false);
          setLien(d.lien);
          return;
        }
      } catch {
        // On réessaie : le webhook peut arriver une seconde après nous.
      }
      if (restant <= 0) {
        clearInterval(t);
        setAttente(false);
        setErreur(
          "Le paiement est passé, mais l'accès n'est pas encore ouvert. Recharge cette page dans une minute, ou écris-nous.",
        );
      }
    }, 2000);
    return () => clearInterval(t);
  }, []);

  if (lien) {
    return (
      <div className="rounded-xl border border-[#DDEBE4] bg-[#F2F7F5] p-4">
        <p className="text-[15px] font-bold text-[#12312A]">C&apos;est ouvert.</p>
        <p className="mt-1 text-[15px] leading-relaxed text-[#334A42]">
          Ton accès est personnel : garde ce lien, c&apos;est lui qui rouvre le cours.
        </p>
        <a
          href={lien}
          className="mt-4 inline-flex w-full items-center justify-center rounded-xl px-5 py-3.5 text-base font-extrabold text-white no-underline"
          style={{ backgroundColor: couleur }}
        >
          Commencer le cours
        </a>
      </div>
    );
  }

  /** Un cours payant : on part chez le prestataire de paiement. */
  async function payer(e: React.FormEvent) {
    e.preventDefault();
    setOccupe(true);
    setErreur(null);
    try {
      const res = await fetch(`/api/proxy/public/ecole/cours/${encodeURIComponent(slug)}/acheter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ email: email.trim(), nom: prenom.trim() || undefined, codePromo: code.trim() || undefined }),
      });
      const texte = await res.text();
      const data = texte ? JSON.parse(texte) : {};
      if (!res.ok) throw new Error(data?.message ?? "Le paiement n'a pas pu s'ouvrir.");
      if (data?.deja && data?.lien) {
        setLien(data.lien);
        return;
      }
      if (typeof data?.url === 'string') window.location.href = data.url;
    } catch (err) {
      setErreur(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setOccupe(false);
    }
  }

  async function envoyer(e: React.FormEvent) {
    e.preventDefault();
    setOccupe(true);
    setErreur(null);
    try {
      const res = await fetch(`/api/proxy/public/ecole/cours/${encodeURIComponent(slug)}/rejoindre`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ email: email.trim(), prenom: prenom.trim() }),
      });
      const texte = await res.text();
      const data = texte ? JSON.parse(texte) : {};
      if (!res.ok) throw new Error(data?.message ?? "L'inscription n'a pas abouti.");
      setLien(typeof data?.lien === 'string' ? data.lien : null);
    } catch (err) {
      setErreur(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setOccupe(false);
    }
  }

  if (attente) {
    return (
      <div className="rounded-xl border border-[#DDEBE4] bg-[#F2F7F5] p-4">
        <p className="text-[15px] font-bold text-[#12312A]">Paiement reçu. On ouvre ton accès…</p>
        <p className="mt-1 text-[15px] leading-relaxed text-[#334A42]">Quelques secondes, ne ferme pas cette page.</p>
      </div>
    );
  }

  return (
    <form onSubmit={gratuit ? envoyer : payer} className="grid gap-3">
      <input
        value={prenom}
        onChange={(e) => setPrenom(e.target.value)}
        placeholder="Ton prénom"
        className={CHAMP}
        autoComplete="given-name"
      />
      <input
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Ton adresse e-mail"
        type="email"
        required
        className={CHAMP}
        autoComplete="email"
      />
      {gratuit ? null : (
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Code promo (facultatif)"
          className={CHAMP}
        />
      )}
      {erreur ? <p className="text-[15px] font-bold text-[#8A1B3D]">{erreur}</p> : null}
      <button
        type="submit"
        disabled={occupe}
        className="rounded-xl px-5 py-3.5 text-base font-extrabold text-white disabled:opacity-60"
        style={{ backgroundColor: couleur }}
      >
        {occupe ? 'Ouverture…' : gratuit ? 'Commencer gratuitement' : 'Payer et commencer'}
      </button>
      <p className="text-sm leading-relaxed text-[#5E7A6E]">
        {gratuit
          ? 'Pas de compte à créer. Ton adresse sert à retrouver ton avancement et à t’envoyer ton attestation.'
          : `Le paiement se fait sur la page sécurisée de notre prestataire — ${ecole} ne voit jamais ton numéro de carte. Ton accès s’ouvre au retour.`}
      </p>
    </form>
  );
}

const CHAMP =
  'w-full rounded-xl border border-[#CFE4D9] bg-white px-4 py-3 text-base text-[#12312A] placeholder:text-[#8FA79B] focus:border-[#1E9E6A] focus:outline-none focus:ring-4 focus:ring-[#E3F5EC]';
