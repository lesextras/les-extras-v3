import Link from 'next/link';
import type { Metadata } from 'next';
import { Titre } from '../_ui';
import { FormulaireInscription } from './FormulaireInscription';

export const metadata: Metadata = {
  title: "Créer l'espace de mon association",
  description:
    "Ouvrez gratuitement l'espace de votre association : un classeur de pièces pré-rempli depuis les répertoires publics, vos dossiers de financement, et ce qui presse chaque lundi.",
  alternates: { canonical: '/inscription' },
};

export default function InscriptionPage() {
  return (
    <>
      <Titre
        surtitre="Gratuit, deux minutes"
        sousTitre="Un classeur qui prévient avant qu'une pièce expire, des dossiers de financement suivis jusqu'au compte rendu, et chaque lundi ce qui presse. Rien à installer."
      >
        Créer l&apos;espace de mon association
      </Titre>
      <FormulaireInscription />
      <p className="mt-8 text-sm text-[#3E4A44]">
        Déjà un espace ?{' '}
        <Link href="/connexion" className="underline underline-offset-4">
          Se connecter
        </Link>
      </p>
    </>
  );
}
