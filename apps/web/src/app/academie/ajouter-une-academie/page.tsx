import Link from 'next/link';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { Accent, CARTE, Encart } from '../_ui';
import { FormulaireOuverture } from '../ouvrir-mon-espace/FormulaireOuverture';

export const metadata: Metadata = { title: 'Ajouter une académie', robots: { index: false, follow: true } };

/**
 * AJOUTER UNE ACADÉMIE à un compte qui en a déjà une. Deux organismes, deux
 * marques, deux antennes : chacun son espace, sa certification, ses apprenants.
 */
export default async function AjouterUneAcademiePage() {
  const session = await getSession();
  if (!session) redirect('/academie/connexion?next=%2Facademie%2Fajouter-une-academie');

  const tous = (session.accounts ?? []).length ? session.accounts! : session.account ? [session.account] : [];
  const deja = tous.filter((c) => (c.type as string) === 'ACADEMIE').map((c) => c.name);

  return (
    <div className="mx-auto max-w-[640px]">
      <div className={`${CARTE} p-6 sm:p-9`}>
        <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-[#12312A] sm:text-4xl">
          Ajouter une <Accent>académie</Accent>
        </h1>
        <p className="mt-3 text-lg leading-relaxed">
          Deux organismes, deux antennes, deux marques : chacun a son espace, sa certification, son catalogue et ses
          apprenants. Rien ne se mélange, et tu passes de l&apos;un à l&apos;autre depuis « Mes espaces », en haut de l&apos;écran.
        </p>

        {deja.length ? (
          <p className="mt-4 text-sm text-[#5E7A6E]">
            Déjà dans ton compte : <span className="font-bold text-[#12312A]">{deja.join(' · ')}</span>
          </p>
        ) : null}

        <div className="mt-8">
          <FormulaireOuverture autre />
        </div>
      </div>

      <div className="mt-6">
        <Encart ton="info">
          Une preuve Qualiopi vaut pour UN organisme : chaque académie refait son dossier. C&apos;est la règle du référentiel,
          pas une limite de l&apos;outil.{' '}
          <Link href="/academie/certification" className="font-bold underline underline-offset-4">
            Voir ma certification
          </Link>
        </Encart>
      </div>
    </div>
  );
}
