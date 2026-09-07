import Link from 'next/link';
import { apiEspace, sessionAssociation } from '../../_session';
import { Barre, Encart } from '../../_ui';
import type { Espace } from '../_types';
import { CaseEtape } from './CaseEtape';

/** Le chemin, vu depuis l'espace : ce qui est fait, ce qui reste, où reprendre. */
export default async function CheminEspacePage() {
  const s = await sessionAssociation('/espace/chemin');
  const { data, error } = await apiEspace<Espace>(s, '/association/espace');
  if (!data) return <Encart ton="attention">{error ?? 'Le chemin ne se charge pas pour le moment.'}</Encart>;
  const { chemin } = data;
  const prochaine = chemin.etapes.find((e) => !e.faite);

  return (
    <>
      <header className="mb-6">
        <p className="text-xs uppercase tracking-[0.14em] text-[#5C6B63]">{data.organisation.nom}</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">Le chemin</h1>
        <p className="mt-2 max-w-[64ch] text-[#3E4A44]">
          {chemin.faites} étape{chemin.faites > 1 ? 's' : ''} sur {chemin.total}. Les étapes 1 et 2 se cochent toutes seules quand les
          répertoires publics les confirment ; les autres, c&apos;est vous qui dites « je l&apos;ai fait ».
        </p>
        <div className="mt-3 max-w-[64ch]">
          <Barre pourcentage={chemin.pourcentage} />
        </div>
      </header>

      {prochaine ? (
        <div className="mb-6 max-w-[64ch]">
          <Encart ton="ok">
            <p className="text-xs uppercase tracking-[0.14em] text-[#5C6B63]">Prochaine étape</p>
            <p className="mt-1 font-semibold">
              {prochaine.numero}. {prochaine.titre}
            </p>
            <Link href={`/chemin/${prochaine.slug}`} className="mt-2 inline-block text-sm font-medium text-[#1F6A4E] underline underline-offset-4">
              Voir quoi faire →
            </Link>
          </Encart>
        </div>
      ) : (
        <div className="mb-6 max-w-[64ch]">
          <Encart ton="ok">Le chemin est fait. L&apos;écran du lundi prend le relais.</Encart>
        </div>
      )}

      <ol className="space-y-2">
        {chemin.etapes.map((e) => (
          <CaseEtape key={e.slug} etape={e} />
        ))}
      </ol>
    </>
  );
}
