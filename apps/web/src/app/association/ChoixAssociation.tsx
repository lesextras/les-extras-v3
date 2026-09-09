'use client';

import { useEffect, useRef, useState } from 'react';
import { appel } from './_client';

export interface AssociationTrouvee {
  nom: string;
  siren: string;
  rna: string | null;
  commune: string | null;
  codePostal: string | null;
  sigle?: string | null;
  dateCreation?: string | null;
  natureLibelle?: string | null;
}

export const CHAMP =
  'rounded-xl border border-[#D9D6EE] bg-white px-4 py-3 text-base focus:border-[#4F46E5] focus:outline-none focus:ring-2 focus:ring-[#ECEBFC]';

/**
 * LA STRUCTURE, RECONNUE PENDANT QU'ON TAPE.
 *
 * ⚠ CE QUI NE MARCHAIT PLUS, ET POURQUOI. Le champ cherchait sur `onBlur` ET
 * un bouton « Retrouver dans les répertoires » cherchait aussi. Sur téléphone,
 * toucher le bouton fait D'ABORD perdre le focus au champ : la recherche
 * partait, le bouton passait en `disabled` le temps de l'appel, et le toucher
 * arrivait sur un bouton désactivé. Le geste ne faisait donc rien — c'est
 * exactement ce qu'on nous a signalé, et c'est un bug qu'on ne voit jamais à
 * la souris.
 *
 * CE QU'ON FAIT À LA PLACE. On ne demande plus de cliquer : la recherche part
 * toute seule, une demi-seconde après la dernière frappe. Trois lettres
 * suffisent. Et quand les répertoires ne renvoient qu'UNE structure, on la
 * retient sans rien demander — c'est la sienne, il n'y a pas de choix à faire.
 *
 * Le bouton reste, pour qui veut relancer : il écoute `onPointerDown`, qui
 * arrive AVANT le `blur`, et il ne se désactive plus pendant la recherche.
 *
 * CE QU'ON REMPLIT. Le nom officiel remplace ce qui a été tapé — « adepa »
 * devient le nom déclaré en préfecture — et le SIREN, le RNA, la commune et la
 * date de création sont affichés pour que la personne vérifie AVANT de créer
 * son compte. Le reste du classeur se remplira côté serveur à partir du SIREN.
 */
export function ChoixAssociation({
  nom,
  onNom,
  choisie,
  onChoisie,
  /** « association » par défaut ; « structure » pour un organisme de formation. */
  motStructure = 'association',
}: {
  nom: string;
  onNom: (v: string) => void;
  choisie: AssociationTrouvee | null;
  onChoisie: (v: AssociationTrouvee | null) => void;
  motStructure?: string;
}) {
  const [resultats, setResultats] = useState<AssociationTrouvee[]>([]);
  const [recherche, setRecherche] = useState(false);
  const [cherche, setCherche] = useState(false);
  /** Le terme de la dernière recherche lancée : évite de la refaire pour rien. */
  const dernier = useRef('');

  async function chercher(terme: string) {
    const q = terme.trim();
    if (q.length < 3) return;
    dernier.current = q;
    setRecherche(true);
    setCherche(true);
    try {
      const r = await appel<AssociationTrouvee[]>(
        `/public/association/recherche?q=${encodeURIComponent(q)}`,
      );
      const liste = Array.isArray(r) ? r : [];
      setResultats(liste);
      // Une seule structure trouvée : c'est la sienne. On ne fait pas choisir
      // entre une possibilité et rien.
      if (liste.length === 1) {
        onChoisie(liste[0]);
        onNom(liste[0].nom);
      }
    } catch {
      setResultats([]);
    } finally {
      setRecherche(false);
    }
  }

  // La recherche suit la frappe, avec un demi-temps d'arrêt : on interroge les
  // répertoires quand la personne a fini de taper, pas à chaque lettre.
  useEffect(() => {
    const q = nom.trim();
    if (choisie || q.length < 3 || q === dernier.current) return;
    const t = window.setTimeout(() => void chercher(q), 500);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nom, choisie]);

  function retenir(r: AssociationTrouvee) {
    onChoisie(r);
    onNom(r.nom);
    setResultats([]);
  }

  return (
    <div className="flex flex-col gap-3">
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-bold">Son nom</span>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            type="text"
            required
            minLength={3}
            value={nom}
            onChange={(e) => {
              onNom(e.target.value);
              onChoisie(null);
            }}
            placeholder="Tel qu'il est déclaré en préfecture"
            autoComplete="organization"
            className={`flex-1 ${CHAMP}`}
          />
          <button
            type="button"
            /* `onPointerDown` et non `onClick` : au doigt, le `blur` du champ
               part avant le clic et emportait le geste avec lui. */
            onPointerDown={(e) => {
              e.preventDefault();
              dernier.current = '';
              void chercher(nom);
            }}
            className="rounded-xl border border-[#4F46E5] px-4 py-3 text-sm font-bold text-[#4F46E5] hover:bg-[#ECEBFC]"
          >
            {recherche ? 'Recherche…' : 'Chercher à nouveau'}
          </button>
        </div>
        <span className="text-xs text-[#6B6A8A]">
          Tape trois lettres : on cherche tout seul dans les répertoires publics.
        </span>
      </label>

      {recherche && !choisie ? (
        <p className="text-sm text-[#6B6A8A]">Recherche dans les répertoires publics…</p>
      ) : null}

      {resultats.length > 0 && !choisie ? (
        <ul className="divide-y divide-[#E6E4F3] rounded-xl border border-[#E6E4F3] bg-white text-sm">
          {resultats.map((r) => (
            <li key={r.siren}>
              <button
                type="button"
                onClick={() => retenir(r)}
                className="flex w-full flex-col items-start gap-0.5 px-4 py-3 text-left hover:bg-[#F5F4FC]"
              >
                <span className="font-bold">{r.nom}</span>
                <span className="text-[#6B6A8A]">
                  {[r.codePostal, r.commune].filter(Boolean).join(' ')} · SIREN {r.siren}
                  {r.rna ? ` · RNA ${r.rna}` : ''}
                </span>
              </button>
            </li>
          ))}
          <li className="px-4 py-2 text-xs text-[#6B6A8A]">
            Ce n&apos;est pas la vôtre ? Continuez, vous la rattacherez plus tard.
          </li>
        </ul>
      ) : null}

      {cherche && !recherche && resultats.length === 0 && !choisie && nom.trim().length >= 3 ? (
        <p className="rounded-xl border border-[#F5D6A8] bg-[#FEF3E2] px-4 py-3 text-sm text-[#7C3E06]">
          Rien trouvé sous ce nom. Ce n&apos;est pas bloquant : continue, ton espace s&apos;ouvre
          quand même et tu rattacheras ta {motStructure} plus tard, avec son SIREN.
        </p>
      ) : null}

      {choisie ? (
        <div className="rounded-xl border border-[#BFE6D2] bg-[#E3F5EC] px-4 py-3 text-sm">
          <p className="font-bold">{choisie.nom}</p>
          <ul className="mt-1 space-y-0.5 text-[#2F6B4F]">
            <li>SIREN {choisie.siren}</li>
            {choisie.rna ? <li>RNA {choisie.rna}</li> : null}
            {choisie.codePostal || choisie.commune ? (
              <li>{[choisie.codePostal, choisie.commune].filter(Boolean).join(' ')}</li>
            ) : null}
            {choisie.dateCreation ? (
              <li>Créée le {new Date(choisie.dateCreation).toLocaleDateString('fr-FR')}</li>
            ) : null}
          </ul>
          <p className="mt-2">
            Ces informations rempliront ton classeur.{' '}
            <button
              type="button"
              onClick={() => {
                onChoisie(null);
                dernier.current = '';
              }}
              className="underline underline-offset-4"
            >
              Ce n&apos;est pas elle
            </button>
          </p>
        </div>
      ) : null}
    </div>
  );
}
