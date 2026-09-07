'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ouvrirEspace } from '../_client';
import { BTN_PRIMAIRE } from '../_ui';
import { ChoixAssociation, type AssociationTrouvee } from '../ChoixAssociation';

/**
 * AJOUTER UNE ASSOCIATION. Une même personne peut en piloter plusieurs — une
 * association et sa fondation, deux antennes, deux structures. Chacune a son
 * classeur, ses projets, ses comptes : rien ne se mélange.
 */
export function FormulaireAjout({ deja }: { deja: string[] }) {
  const [nom, setNom] = useState('');
  const [choisie, setChoisie] = useState<AssociationTrouvee | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [creee, setCreee] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  async function ajouter() {
    const voulu = (choisie?.nom ?? nom).trim();
    if (voulu.length < 2) {
      setErreur("Écris le nom de l'association ou de la fondation à ajouter.");
      return;
    }
    if (deja.some((d) => d.trim().toLowerCase() === voulu.toLowerCase())) {
      setErreur(`« ${voulu} » est déjà dans ton compte.`);
      return;
    }
    setErreur(null);
    setEnCours(true);
    try {
      const r = await ouvrirEspace(voulu, choisie?.siren, true);
      if (r.existant) {
        setErreur(`« ${voulu} » est déjà dans ton compte.`);
        return;
      }
      setCreee(voulu);
      setNom('');
      setChoisie(null);
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "L'espace n'a pas pu être créé.");
    } finally {
      setEnCours(false);
    }
  }

  if (creee) {
    return (
      <div className="rounded-2xl border border-[#BFE6D2] bg-[#E3F5EC] px-5 py-4">
        <p className="font-extrabold text-[#0F5F3E]">L&apos;espace de « {creee} » est créé.</p>
        <p className="mt-1 text-sm leading-relaxed text-[#0F5F3E]">
          Son classeur est déjà en place et se remplit depuis les répertoires publics. Elle apparaît dans « Mes associations », en haut de l&apos;écran.
        </p>
        <div className="mt-3 flex flex-wrap gap-3">
          <button type="button" onClick={() => setCreee(null)} className="text-sm font-bold text-[#0F5F3E] underline underline-offset-4">
            En ajouter une autre
          </button>
          <Link href="/espace/association" className="text-sm font-bold text-[#0F5F3E] underline underline-offset-4">
            Retour à mon association →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <ChoixAssociation nom={nom} onNom={setNom} choisie={choisie} onChoisie={setChoisie} />
      {erreur ? <p className="rounded-xl border border-[#F3B0C2] bg-[#FDE7EC] px-4 py-3 text-sm font-bold text-[#8A1B3D]">{erreur}</p> : null}
      <button type="button" onClick={ajouter} disabled={enCours} className={BTN_PRIMAIRE}>
        {enCours ? 'Création…' : 'Créer son espace'}
      </button>
    </div>
  );
}
