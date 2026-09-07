import Link from 'next/link';
import type { Metadata } from 'next';
import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import { Accent, CARTE, Encart } from '../_ui';
import { FormulaireAjout } from './FormulaireAjout';

export const metadata: Metadata = {
  title: 'Ajouter une association',
  robots: { index: false, follow: true },
};

/**
 * AJOUTER UNE ASSOCIATION à un compte qui en a déjà une. Une personne peut
 * piloter plusieurs structures : une association et sa fondation, deux
 * antennes. Chacune reçoit son propre espace, séparé.
 */
export default async function AjouterUneAssociationPage() {
  const session = await getSession();
  if (!session) redirect('/connexion?next=%2Fajouter-une-association');
  const deja = (session.accounts ?? []).filter((c) => (c.type as string) === 'ASSOCIATION').map((c) => c.name);

  return (
    <div className="mx-auto max-w-[680px]">
      <div className={`${CARTE} p-6 sm:p-10`}>
        <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-[#1D1B5C] [text-wrap:balance] sm:text-4xl">
          Ajouter une <Accent>association</Accent>
        </h1>
        <p className="mt-3 text-lg leading-relaxed">
          Une association et sa fondation, deux antennes, deux structures que tu portes : chacune a son espace, son classeur, ses projets et ses comptes. Rien ne
          se mélange, et tu passes de l&apos;une à l&apos;autre depuis « Mes associations », en haut de l&apos;écran.
        </p>

        {deja.length ? (
          <p className="mt-4 text-sm text-[#6B6A8A]">
            Déjà dans ton compte : <span className="font-bold text-[#1D1B5C]">{deja.join(' · ')}</span>
          </p>
        ) : null}

        <div className="mt-8">
          <FormulaireAjout deja={deja} />
        </div>

        <div className="mt-8">
          <Encart ton="info">
            L&apos;association n&apos;est pas encore déclarée ? Commence par le{' '}
            <Link href="/chemin" className="font-bold underline underline-offset-4">
              chemin
            </Link>{' '}
            : douze étapes, de l&apos;idée à la première subvention. Reviens ici le jour où elle existe.
          </Encart>
        </div>
      </div>
    </div>
  );
}
