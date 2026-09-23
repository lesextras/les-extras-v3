import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { apiApprenant } from '../../../../_shared/apprenant-serveur';
import { CoqueEcole } from '../../../_espace/coque';
import { ecoleDuSlug, moiSurEcole } from '../../../_espace/donnees';
import { FilCommunaute, type Publication } from '../../../_espace/FilCommunaute';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Communauté', robots: { index: false, follow: false } };

export default async function PageEspaceCommunaute({ params }: { params: Promise<{ slug: string; espaceId: string }> }) {
  const { slug, espaceId } = await params;
  const ecole = await ecoleDuSlug(slug);
  if (!ecole) notFound();
  const moi = await moiSurEcole(slug);
  if (!moi) redirect(`/ecole/${slug}/connexion`);
  const { data, error } = await apiApprenant<{
    espace: { id: string; titre: string; description: string | null; icone: string | null; ecritureApprenants: boolean };
    publications: Publication[];
  }>(`/apprenant/communaute/espaces/${encodeURIComponent(espaceId)}`);

  return (
    <CoqueEcole ecole={moi.ecole} actif="communaute" connecte>
      <Link href={`/ecole/${slug}/communaute`} className="text-[15px] font-bold underline underline-offset-4" style={{ color: moi.ecole.couleur }}>
        ← Tous les espaces
      </Link>
      {!data ? (
        <p className="mt-4 leading-relaxed">{error ?? 'Cet espace ne se charge pas pour le moment.'}</p>
      ) : (
        <>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-[#12312A]">
            {data.espace.icone ? `${data.espace.icone} ` : ''}
            {data.espace.titre}
          </h1>
          {data.espace.description ? <p className="mt-2 max-w-[68ch] text-lg leading-relaxed">{data.espace.description}</p> : null}
          <FilCommunaute
            mode="apprenant"
            espaceId={data.espace.id}
            peutPublier={data.espace.ecritureApprenants}
            couleur={moi.ecole.couleur}
            initiales={data.publications}
          />
        </>
      )}
    </CoqueEcole>
  );
}
