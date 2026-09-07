import Link from 'next/link';
import type { Metadata } from 'next';
import { Accent, CARTE, Encart } from '../_ui';
import { FormulaireConnexion } from './FormulaireConnexion';

export const metadata: Metadata = { title: 'Connexion', robots: { index: false, follow: true } };

export default async function ConnexionAcademiePage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; motif?: string }>;
}) {
  const { next, motif } = await searchParams;
  // On ne renvoie que vers une adresse interne : jamais vers un site tiers.
  const destination = next && next.startsWith('/') && !next.startsWith('//') ? next : '/academie';

  return (
    <div className="mx-auto max-w-[520px]">
      <div className={`${CARTE} p-6 sm:p-8`}>
        <p className="mb-2 text-sm font-bold text-[#5E7A6E]">
          Pas encore d&apos;espace ?{' '}
          <Link href="/academie/inscription" className="text-[#0F5F3E] underline underline-offset-4">
            Ouvrir mon espace →
          </Link>
        </p>
        <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-[#12312A]">
          Bon retour, on <Accent>continue</Accent>.
        </h1>
        <p className="mt-2 leading-relaxed">Ton chemin, tes preuves Qualiopi et tes sessions t&apos;attendent.</p>

        {motif === 'expiree' ? (
          <div className="mt-4">
            <Encart ton="attention">Ta session a expiré. Reconnecte-toi, rien n&apos;est perdu.</Encart>
          </div>
        ) : null}

        <div className="mt-6">
          <FormulaireConnexion destination={destination} />
        </div>
      </div>
    </div>
  );
}
