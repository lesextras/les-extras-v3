'use client';

import { useEffect, useRef, useState } from 'react';
import { appel } from './_client';
import { CHAMP } from './_ui';

/** Ce que les répertoires publics savent d'un organisme de formation. */
export interface OrganismeTrouve {
  nom: string;
  sigle: string | null;
  siren: string;
  siret: string | null;
  ape: string | null;
  apeFormation: boolean;
  adresse: string | null;
  codePostal: string | null;
  commune: string | null;
  declaration: {
    nda: string;
    region: string | null;
    departement: string | null;
    certifie: boolean;
    specialites: string[];
  } | null;
}

/**
 * RETROUVER SON ORGANISME PLUTÔT QUE LE RECOPIER.
 *
 * Deux répertoires publics répondent. SIRENE donne le nom, le SIREN, le SIRET
 * et l'adresse ; la liste publique des organismes de formation donne le numéro
 * de déclaration d'activité, la DREETS et la certification. Ceux qui sont déjà
 * déclarés apparaissent en premier.
 *
 * ⚠ CE QUI NE MARCHAIT PLUS, ET POURQUOI. Le champ cherchait sur `onBlur` ET un
 * bouton « Retrouver dans les répertoires » cherchait aussi. Au doigt, toucher
 * le bouton fait D'ABORD perdre le focus au champ : la recherche partait, le
 * bouton passait en `disabled` le temps de l'appel, et le toucher arrivait sur
 * un bouton désactivé. Le geste ne faisait donc rien. C'est un bug qu'on ne voit
 * jamais à la souris, et c'est exactement ce qui a été signalé sur téléphone.
 *
 * CE QU'ON FAIT À LA PLACE. On ne demande plus de cliquer. La recherche part
 * toute seule, une demi-seconde après la dernière frappe, dès la troisième
 * lettre. Quand les répertoires ne renvoient qu'UN organisme, on le retient
 * sans rien demander, et le nom officiel remplace ce qui a été tapé.
 *
 * Le bouton reste pour qui veut relancer. Il écoute `onPointerDown`, qui arrive
 * AVANT le `blur`, et il ne se désactive plus pendant la recherche.
 *
 * Rien n'est obligatoire. Un organisme qui n'est pas encore déclaré tape son
 * nom et complète plus tard.
 */
export function ChoixAcademie({
  nom,
  onNom,
  choisi,
  onChoisi,
  libelle = 'Le nom de ton académie',
}: {
  nom: string;
  onNom: (v: string) => void;
  choisi: OrganismeTrouve | null;
  onChoisi: (v: OrganismeTrouve | null) => void;
  libelle?: string;
}) {
  const [resultats, setResultats] = useState<OrganismeTrouve[]>([]);
  const [recherche, setRecherche] = useState(false);
  const [cherche, setCherche] = useState(false);
  /** Le terme de la dernière recherche lancée, pour ne pas la refaire pour rien. */
  const dernier = useRef('');

  async function chercher(terme: string) {
    const q = terme.trim();
    if (q.length < 3) return;
    dernier.current = q;
    setRecherche(true);
    setCherche(true);
    try {
      const r = await appel<{ organismes: OrganismeTrouve[] }>(
        `/public/academie/recherche?q=${encodeURIComponent(q)}`,
      );
      const liste = Array.isArray(r?.organismes) ? r.organismes : [];
      setResultats(liste);
      // Un seul organisme trouvé, c'est le sien. On ne fait pas choisir entre
      // une possibilité et rien.
      if (liste.length === 1) {
        onChoisi(liste[0]);
        onNom(liste[0].nom);
      }
    } catch {
      setResultats([]);
    } finally {
      setRecherche(false);
    }
  }

  // La recherche suit la frappe, avec un demi-temps d'arrêt. On interroge les
  // répertoires quand la personne a fini de taper, pas à chaque lettre.
  useEffect(() => {
    const q = nom.trim();
    if (choisi || q.length < 3 || q === dernier.current) return;
    const t = window.setTimeout(() => void chercher(q), 500);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nom, choisi]);

  return (
    <div className="flex flex-col gap-3">
      <label className="block">
        <span className="mb-1.5 block text-sm font-bold text-[#12312A]">{libelle}</span>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            type="text"
            required
            minLength={2}
            maxLength={160}
            value={nom}
            onChange={(e) => {
              onNom(e.target.value);
              onChoisi(null);
            }}
            placeholder="Le nom de la structure qui forme"
            autoComplete="organization"
            className={`flex-1 ${CHAMP}`}
          />
          <button
            type="button"
            /* `onPointerDown` et non `onClick`. Au doigt, le `blur` du champ part
               avant le clic et emportait le geste avec lui. */
            onPointerDown={(e) => {
              e.preventDefault();
              dernier.current = '';
              void chercher(nom);
            }}
            className="whitespace-nowrap rounded-xl border-2 border-[#1E9E6A] px-4 py-3 text-sm font-bold text-[#0F5F3E] transition hover:bg-[#E3F5EC]"
          >
            {recherche ? 'Recherche…' : 'Chercher à nouveau'}
          </button>
        </div>
        <span className="mt-1 block text-xs text-[#5E7A6E]">
          Tape trois lettres, on cherche tout seul dans les répertoires publics et la fiche se
          remplit.
        </span>
      </label>

      {recherche && !choisi ? (
        <p className="text-sm text-[#5E7A6E]">Recherche dans les répertoires publics…</p>
      ) : null}

      {resultats.length > 0 && !choisi ? (
        <ul className="divide-y divide-[#DDEBE4] rounded-xl border border-[#DDEBE4] bg-white text-sm">
          {resultats.map((r) => (
            <li key={r.siren}>
              <button
                type="button"
                onClick={() => {
                  onChoisi(r);
                  onNom(r.nom);
                  setResultats([]);
                }}
                className="flex w-full flex-col items-start gap-0.5 px-4 py-3 text-left hover:bg-[#F2F7F5]"
              >
                <span className="font-bold text-[#12312A]">
                  {r.nom}
                  {r.sigle ? ` (${r.sigle})` : ''}
                </span>
                <span className="text-[#5E7A6E]">
                  {[r.codePostal, r.commune].filter(Boolean).join(' ')} · SIREN {r.siren}
                  {r.declaration ? ` · NDA ${r.declaration.nda}` : ''}
                </span>
                {r.declaration ? (
                  <span className="mt-1 inline-flex flex-wrap gap-1.5">
                    <span className="rounded-full bg-[#E3F5EC] px-2 py-0.5 text-[12px] font-bold text-[#0F5F3E]">
                      Activité déclarée
                    </span>
                    {r.declaration.certifie ? (
                      <span className="rounded-full bg-[#ECEBFC] px-2 py-0.5 text-[12px] font-bold text-[#4338CA]">Qualiopi</span>
                    ) : null}
                  </span>
                ) : null}
              </button>
            </li>
          ))}
          <li className="px-4 py-2 text-xs text-[#5E7A6E]">
            Ce n&apos;est pas le tien ? Continue, tu le rattacheras plus tard.
          </li>
        </ul>
      ) : null}

      {cherche && !recherche && !resultats.length && !choisi && nom.trim().length >= 3 ? (
        <p className="rounded-xl border border-[#DDEBE4] bg-[#F2F7F5] px-4 py-3 text-sm text-[#334A42]">
          Rien trouvé sous ce nom dans les répertoires publics. C&apos;est normal si la structure est
          très récente ou pas encore déclarée. Continue avec le nom que tu as tapé.
        </p>
      ) : null}

      {choisi ? (
        <div className="rounded-xl border border-[#B7E4CE] bg-[#E3F5EC] px-4 py-3 text-sm text-[#0F5F3E]">
          <p className="font-bold text-[#12312A]">
            {choisi.nom}
            {choisi.sigle ? ` (${choisi.sigle})` : ''}
          </p>
          <ul className="mt-1 space-y-0.5">
            <li>SIREN {choisi.siren}</li>
            {choisi.siret ? <li>SIRET {choisi.siret}</li> : null}
            {choisi.declaration ? <li>NDA {choisi.declaration.nda}</li> : null}
            {choisi.declaration?.certifie ? <li>Certifié Qualiopi</li> : null}
            {choisi.codePostal || choisi.commune ? (
              <li>{[choisi.codePostal, choisi.commune].filter(Boolean).join(' ')}</li>
            ) : null}
          </ul>
          <p className="mt-2">
            Ces informations rempliront sa fiche.{' '}
            <button
              type="button"
              onClick={() => {
                onChoisi(null);
                dernier.current = '';
              }}
              className="underline underline-offset-4"
            >
              Ce n&apos;est pas lui
            </button>
          </p>
        </div>
      ) : null}
    </div>
  );
}
