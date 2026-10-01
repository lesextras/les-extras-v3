import Link from 'next/link';
import type { Metadata } from 'next';
import { Accent, CARTE, Encart } from '../_ui';
import { FormulaireNouveau } from './FormulaireNouveau';

export const metadata: Metadata = {
  title: 'Nouveau mot de passe',
  robots: { index: false, follow: false },
};

/** La cible du lien envoyé par Pilote. Le jeton est dans l'adresse. */
export default async function ReinitialiserPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  return (
    <div className="mx-auto max-w-[560px]">
      <div className={`${CARTE} p-6 sm:p-10`}>
        <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-[#1D1B5C] sm:text-4xl">
          Un <Accent>nouveau</Accent> mot de passe
        </h1>
        <div className="mt-8">
          {token ? (
            <FormulaireNouveau token={token} />
          ) : (
            <Encart ton="attention">
              Ce lien est incomplet. Recopie-le en entier depuis le courriel, ou{' '}
              <Link href="/mot-de-passe-oublie" className="font-bold underline underline-offset-4">
                demande un nouveau lien
              </Link>
              .
            </Encart>
          )}
        </div>
      </div>
    </div>
  );
}
