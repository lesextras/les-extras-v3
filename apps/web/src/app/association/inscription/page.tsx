import Link from 'next/link';
import type { Metadata } from 'next';
import { Accent, CARTE, FilEtapes } from '../_ui';
import { FormulaireInscription } from './FormulaireInscription';

export const metadata: Metadata = {
  title: "Créer l'espace de mon association",
  description:
    "Ouvre gratuitement l'espace de ton association : un classeur de pièces pré-rempli depuis les répertoires publics, tes dossiers de subvention, et ce qui presse chaque lundi.",
  alternates: { canonical: '/inscription' },
};

export default function InscriptionPage() {
  return (
    <div className="mx-auto max-w-[760px]">
      <p className="mb-4 text-right text-sm">
        Tu as déjà un espace ?{' '}
        <Link href="/connexion" className="font-bold text-[#4F46E5] underline underline-offset-4">
          Connexion →
        </Link>
      </p>
      <div className={`${CARTE} p-6 sm:p-10`}>
        <FilEtapes total={3} courante={1} />
        <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-[#1D1B5C] [text-wrap:balance] sm:text-4xl">
          Crée l&apos;espace de ton association <Accent>gratuitement</Accent>
        </h1>
        <p className="mt-3 text-lg leading-relaxed">
          Ton association, puis toi, puis c&apos;est prêt. Deux minutes. Rien à installer, rien à payer.
        </p>
        <div className="mt-8">
          <FormulaireInscription />
        </div>
      </div>
    </div>
  );
}
