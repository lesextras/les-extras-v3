import Link from 'next/link';
import type { Metadata } from 'next';
import { Encart, Titre } from '../_ui';
import { FormulaireConnexion } from './FormulaireConnexion';

export const metadata: Metadata = {
  title: 'Connexion',
  robots: { index: false, follow: true },
};

const MOTIFS: Record<string, string> = {
  expiree: 'Votre session a expiré. Reconnectez-vous pour reprendre où vous en étiez.',
  compte: "Ce compte n'est pas un compte d'association. Créez l'espace de votre association ci-dessous.",
};

export default async function ConnexionPage({ searchParams }: { searchParams: Promise<{ next?: string; motif?: string }> }) {
  const { next, motif } = await searchParams;
  return (
    <>
      <Titre surtitre="Mon espace" sousTitre="Retrouvez votre classeur, vos dossiers et ce qui presse ce lundi.">
        Se connecter
      </Titre>
      {motif && MOTIFS[motif] ? (
        <div className="mb-6 max-w-[440px]">
          <Encart ton="attention">{MOTIFS[motif]}</Encart>
        </div>
      ) : null}
      <FormulaireConnexion suivant={next ?? '/espace'} />
      <p className="mt-8 text-sm text-[#3E4A44]">
        Pas encore d&apos;espace ?{' '}
        <Link href="/inscription" className="underline underline-offset-4">
          Créer l&apos;espace de mon association
        </Link>{' '}
        — gratuit, deux minutes.
      </p>
    </>
  );
}
