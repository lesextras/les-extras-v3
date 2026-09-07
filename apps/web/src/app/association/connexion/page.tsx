import Link from 'next/link';
import type { Metadata } from 'next';
import { Accent, CARTE, Encart } from '../_ui';
import { FormulaireConnexion } from './FormulaireConnexion';

export const metadata: Metadata = {
  title: 'Connexion',
  robots: { index: false, follow: true },
};

const MOTIFS: Record<string, string> = {
  expiree: 'Ta session a expiré. Reconnecte-toi pour reprendre où tu en étais.',
  compte: "Ce compte n'a pas encore d'espace d'association. Connecte-toi : on te propose de l'ouvrir juste après.",
};

export default async function ConnexionPage({ searchParams }: { searchParams: Promise<{ next?: string; motif?: string }> }) {
  const { next, motif } = await searchParams;
  return (
    <div className="mx-auto max-w-[640px]">
      <p className="mb-4 text-right text-sm">
        Pas encore d&apos;espace ?{' '}
        <Link href="/inscription" className="font-bold text-[#4F46E5] underline underline-offset-4">
          Créer mon espace →
        </Link>
      </p>
      <div className={`${CARTE} p-6 sm:p-10`}>
        <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-[#1D1B5C] [text-wrap:balance] sm:text-4xl">
          Bon retour, <Accent>on continue</Accent>.
        </h1>
        <p className="mt-3 text-lg leading-relaxed">Ton classeur, tes dossiers et ce qui presse ce lundi t&apos;attendent.</p>
        {motif && MOTIFS[motif] ? (
          <div className="mt-6">
            <Encart ton="info">{MOTIFS[motif]}</Encart>
          </div>
        ) : null}
        <div className="mt-8">
          <FormulaireConnexion suivant={next ?? '/espace'} />
        </div>
      </div>
    </div>
  );
}
