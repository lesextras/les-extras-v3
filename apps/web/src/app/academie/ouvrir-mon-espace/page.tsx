import Link from 'next/link';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { Accent, CARTE, Encart } from '../_ui';
import { FormulaireOuverture } from './FormulaireOuverture';

export const metadata: Metadata = { title: 'Ouvrir mon espace', robots: { index: false, follow: true } };

/**
 * OUVRIR L'ESPACE D'UNE ACADÉMIE pour quelqu'un qui a déjà un compte — parce
 * qu'il pilote une association, ou qu'il s'est inscrit sans organisme.
 */
export default async function OuvrirEspaceAcademiePage() {
  const session = await getSession();
  if (!session) redirect('/academie/connexion?next=%2Facademie%2Fouvrir-mon-espace');

  const tous = (session.accounts ?? []).length ? session.accounts! : session.account ? [session.account] : [];
  const associations = tous.filter((c) => (c.type as string) === 'ASSOCIATION');

  return (
    <div className="mx-auto max-w-[640px]">
      <div className={`${CARTE} p-6 sm:p-9`}>
        <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-[#12312A] sm:text-4xl">
          Ouvrir l&apos;espace de mon <Accent>académie</Accent>
        </h1>
        <p className="mt-3 text-lg leading-relaxed">
          Ton compte existe déjà. Il ne reste qu&apos;à nommer ton organisme de formation : son espace s&apos;ouvre à part, avec
          son chemin, ses preuves Qualiopi et ses apprenants.
        </p>

        {associations.length ? (
          <p className="mt-4 text-sm text-[#5E7A6E]">
            Déjà dans ton compte :{' '}
            <span className="font-bold text-[#12312A]">{associations.map((a) => a.name).join(' · ')}</span>. Ton académie
            viendra à côté, sans rien mélanger.
          </p>
        ) : null}

        <div className="mt-8">
          <FormulaireOuverture />
        </div>
      </div>

      <div className="mt-6">
        <Encart ton="info">
          Tu cherchais l&apos;espace de ton association ?{' '}
          <Link href="/" className="font-bold underline underline-offset-4">
            Il est ici
          </Link>
          .
        </Encart>
      </div>
    </div>
  );
}
