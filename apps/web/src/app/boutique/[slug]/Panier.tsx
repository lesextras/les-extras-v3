'use client';

import { useEffect, useMemo, useState } from 'react';

export interface ProduitPublic {
  id: string;
  titre: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  nature: 'REEL' | 'VIRTUEL';
  prixCents: number;
  prixBarreCents: number | null;
  livraisonCents: number;
  stock: number | null;
  epuise: boolean;
}

const euros = (c: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(c / 100);

/**
 * LE PANIER ET LA COMMANDE.
 *
 * L'adresse de livraison n'est demandée que si le panier contient un objet à
 * expédier : personne ne devrait avoir à taper une adresse pour télécharger un
 * fichier. Le paiement se fait sur la page sécurisée du prestataire — aucun
 * numéro de carte ne passe par ici.
 */
export function Panier({
  slug,
  teinte,
  produits,
  livraisonTexte,
}: {
  slug: string;
  teinte: string;
  produits: ProduitPublic[];
  livraisonTexte: string | null;
}) {
  const [quantites, setQuantites] = useState<Record<string, number>>({});
  const [email, setEmail] = useState('');
  const [nom, setNom] = useState('');
  const [telephone, setTelephone] = useState('');
  const [adresse, setAdresse] = useState('');
  const [codePostal, setCodePostal] = useState('');
  const [ville, setVille] = useState('');
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [retour, setRetour] = useState<'succes' | 'annule' | null>(null);

  // Le retour du prestataire de paiement : on le lit une fois, à l'arrivée.
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const etat = p.get('paiement');
    if (etat === 'succes' || etat === 'annule') setRetour(etat);
  }, []);

  const lignes = useMemo(
    () =>
      produits
        .map((p) => ({ p, q: quantites[p.id] ?? 0 }))
        .filter((l) => l.q > 0),
    [produits, quantites],
  );
  const sousTotal = lignes.reduce((t, l) => t + l.p.prixCents * l.q, 0);
  const port = lignes
    .filter((l) => l.p.nature === 'REEL')
    .reduce((t, l) => t + l.p.livraisonCents, 0);
  const aExpedier = lignes.some((l) => l.p.nature === 'REEL');

  function changer(id: string, delta: number, max: number | null) {
    setQuantites((q) => {
      const actuel = q[id] ?? 0;
      let neuf = actuel + delta;
      if (neuf < 0) neuf = 0;
      if (max !== null && neuf > max) neuf = max;
      return { ...q, [id]: neuf };
    });
    setErreur(null);
  }

  async function commander() {
    if (!lignes.length) {
      setErreur('Choisis au moins un article.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) {
      setErreur('Indique une adresse e-mail valide : c’est là que part ta commande.');
      return;
    }
    if (aExpedier && !(adresse.trim() && codePostal.trim() && ville.trim())) {
      setErreur('Cette commande contient un article à expédier : indique une adresse.');
      return;
    }
    setEnvoi(true);
    setErreur(null);
    try {
      const res = await fetch(
        `/api/proxy/public/boutique/${encodeURIComponent(slug)}/commander`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({
            email: email.trim(),
            nom: nom.trim() || undefined,
            telephone: telephone.trim() || undefined,
            adresse: aExpedier ? adresse.trim() : undefined,
            codePostal: aExpedier ? codePostal.trim() : undefined,
            ville: aExpedier ? ville.trim() : undefined,
            lignes: lignes.map((l) => ({ produitId: l.p.id, quantite: l.q })),
          }),
        },
      );
      const texte = await res.text();
      const data = texte ? (JSON.parse(texte) as { url?: string; message?: unknown }) : {};
      if (!res.ok || !data.url) {
        const m = Array.isArray(data.message) ? data.message[0] : data.message;
        throw new Error(typeof m === 'string' ? m : "Le paiement n'a pas pu s'ouvrir.");
      }
      window.location.href = data.url;
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Le paiement n'a pas pu s'ouvrir.");
      setEnvoi(false);
    }
  }

  const champ =
    'w-full rounded-xl border-2 border-[#DDEBE4] bg-white px-3 py-2 text-[15px] text-[#12312A] focus:outline-none';
  const etiquette = 'grid gap-1 text-sm font-bold text-[#334A42]';

  if (retour === 'succes') {
    return (
      <section className="rounded-2xl border border-[#DDEBE4] bg-white p-6">
        <h2 className="text-2xl font-extrabold tracking-tight" style={{ color: teinte }}>
          Merci, votre commande est confirmée
        </h2>
        <p className="mt-2 max-w-[62ch] leading-relaxed">
          Un message vient de partir à l&apos;adresse indiquée : il porte le détail de la commande,
          et le lien de ce qui se télécharge. Gardez-le.
        </p>
        {livraisonTexte ? (
          <p className="mt-4 whitespace-pre-line rounded-xl bg-[#F2F7F4] p-4 leading-relaxed">
            {livraisonTexte}
          </p>
        ) : null}
      </section>
    );
  }

  return (
    <section>
      {retour === 'annule' ? (
        <p className="mb-6 rounded-xl border border-[#F0D9A8] bg-[#FDF6E8] p-4 leading-relaxed">
          Le paiement a été interrompu : rien n&apos;a été débité, et rien n&apos;a été commandé.
        </p>
      ) : null}

      <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl" style={{ color: '#12312A' }}>
        La boutique
      </h2>

      {produits.length === 0 ? (
        <p className="mt-3 leading-relaxed">Rien n&apos;est en vente pour le moment.</p>
      ) : (
        <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {produits.map((p) => {
            const q = quantites[p.id] ?? 0;
            const max = p.nature === 'REEL' ? p.stock : null;
            return (
              <li
                key={p.id}
                className="flex flex-col overflow-hidden rounded-2xl border border-[#DDEBE4] bg-white"
              >
                {p.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.imageUrl} alt="" className="h-40 w-full object-cover" />
                ) : (
                  <div className="h-40 w-full" style={{ backgroundColor: `${teinte}1A` }} />
                )}
                <div className="flex flex-1 flex-col p-5">
                  <h3 className="text-lg font-extrabold leading-tight tracking-tight text-[#12312A]">
                    {p.titre}
                  </h3>
                  {p.description ? (
                    <p className="mt-1 whitespace-pre-line text-[15px] leading-relaxed">
                      {p.description}
                    </p>
                  ) : null}
                  <p className="mt-2 text-sm text-[#5E7A6E]">
                    {p.nature === 'VIRTUEL'
                      ? 'Remis en ligne dès le paiement'
                      : p.livraisonCents > 0
                        ? `Expédition ${euros(p.livraisonCents)}`
                        : 'Remise en main propre ou port offert'}
                  </p>
                  <p className="mt-3 text-lg font-extrabold" style={{ color: teinte }}>
                    {euros(p.prixCents)}
                    {p.prixBarreCents ? (
                      <span className="ml-2 text-sm font-bold text-[#5E7A6E] line-through">
                        {euros(p.prixBarreCents)}
                      </span>
                    ) : null}
                  </p>

                  <div className="mt-auto pt-4">
                    {p.epuise ? (
                      <p className="text-sm font-bold text-[#8A2419]">Épuisé pour le moment.</p>
                    ) : (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => changer(p.id, -1, max)}
                          disabled={q === 0}
                          aria-label={`Retirer un ${p.titre}`}
                          className="h-9 w-9 rounded-xl border-2 border-[#DDEBE4] text-lg font-bold disabled:opacity-40"
                        >
                          −
                        </button>
                        <span className="w-8 text-center font-extrabold tabular-nums">{q}</span>
                        <button
                          type="button"
                          onClick={() => changer(p.id, 1, max)}
                          aria-label={`Ajouter un ${p.titre}`}
                          className="h-9 w-9 rounded-xl border-2 text-lg font-bold text-white"
                          style={{ backgroundColor: teinte, borderColor: teinte }}
                        >
                          +
                        </button>
                        {max !== null ? (
                          <span className="ml-2 text-xs text-[#5E7A6E]">{max} disponible{max > 1 ? 's' : ''}</span>
                        ) : null}
                      </div>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* ---------------------------------------------------- la commande */}
      {lignes.length ? (
        <div className="mt-10 rounded-2xl border border-[#DDEBE4] bg-white p-6">
          <h3 className="text-xl font-extrabold tracking-tight text-[#12312A]">Ma commande</h3>
          <ul className="mt-4 grid gap-1 text-[15px]">
            {lignes.map((l) => (
              <li key={l.p.id} className="flex items-center justify-between gap-3">
                <span>
                  {l.p.titre}
                  {l.q > 1 ? ` × ${l.q}` : ''}
                </span>
                <span className="font-bold tabular-nums">{euros(l.p.prixCents * l.q)}</span>
              </li>
            ))}
            {port > 0 ? (
              <li className="flex items-center justify-between gap-3 border-t border-[#DDEBE4] pt-1">
                <span>Frais d&apos;expédition</span>
                <span className="font-bold tabular-nums">{euros(port)}</span>
              </li>
            ) : null}
            <li className="mt-2 flex items-center justify-between gap-3 border-t border-[#DDEBE4] pt-2 text-lg font-extrabold">
              <span>Total</span>
              <span className="tabular-nums" style={{ color: teinte }}>
                {euros(sousTotal + port)}
              </span>
            </li>
          </ul>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <label className={etiquette}>
              Votre adresse e-mail
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={champ}
                placeholder="prenom@exemple.fr"
              />
            </label>
            <label className={etiquette}>
              Votre nom
              <input value={nom} onChange={(e) => setNom(e.target.value)} className={champ} />
            </label>
          </div>

          {aExpedier ? (
            <>
              <p className="mt-6 text-sm font-bold text-[#334A42]">
                Où livrer, cette commande contient un article à expédier.
              </p>
              <div className="mt-2 grid gap-4 sm:grid-cols-2">
                <label className={`${etiquette} sm:col-span-2`}>
                  L&apos;adresse
                  <input
                    value={adresse}
                    onChange={(e) => setAdresse(e.target.value)}
                    className={champ}
                  />
                </label>
                <label className={etiquette}>
                  Le code postal
                  <input
                    value={codePostal}
                    onChange={(e) => setCodePostal(e.target.value)}
                    className={champ}
                  />
                </label>
                <label className={etiquette}>
                  La ville
                  <input value={ville} onChange={(e) => setVille(e.target.value)} className={champ} />
                </label>
                <label className={etiquette}>
                  Un téléphone (facultatif)
                  <input
                    value={telephone}
                    onChange={(e) => setTelephone(e.target.value)}
                    className={champ}
                  />
                </label>
              </div>
              {livraisonTexte ? (
                <p className="mt-4 whitespace-pre-line rounded-xl bg-[#F2F7F4] p-4 text-sm leading-relaxed">
                  {livraisonTexte}
                </p>
              ) : null}
            </>
          ) : null}

          {erreur ? (
            <p className="mt-4 rounded-xl border border-[#E8C4BE] bg-[#FDF1EF] p-3 text-sm font-bold text-[#8A2419]">
              {erreur}
            </p>
          ) : null}

          <button
            type="button"
            onClick={() => void commander()}
            disabled={envoi}
            className="mt-5 w-full rounded-xl px-5 py-3 text-base font-bold text-white disabled:opacity-60 sm:w-auto"
            style={{ backgroundColor: teinte }}
          >
            {envoi ? 'Ouverture du paiement…' : `Payer ${euros(sousTotal + port)}`}
          </button>
          <p className="mt-3 text-sm leading-relaxed text-[#5E7A6E]">
            Le paiement se fait sur la page sécurisée de notre prestataire : aucun numéro de carte
            ne passe par cette page.
          </p>
        </div>
      ) : null}
    </section>
  );
}
