import Link from 'next/link';
import type { Metadata } from 'next';
import { apiAcademie, sessionAcademie } from '../../_session';
import { BTN_DISCRET, Encart, Titre } from '../../_ui';
import { FilCommunaute, type Publication } from '../../../ecole/_espace/FilCommunaute';

export const metadata: Metadata = { title: 'Fil de la communauté', robots: { index: false, follow: false } };

/** `/academie/communaute/<espace>` : le fil d'un espace, côté modération. */
export default async function PageFil({ params }: { params: Promise<{ espaceId: string }> }) {
  const { espaceId } = await params;
  const s = await sessionAcademie(`/academie/communaute/${espaceId}`);
  const { data, error } = await apiAcademie<{ espace: { id: string; titre: string; description: string | null; icone: string | null }; publications: Publication[] }>(
    s,
    `/ecole/communaute/espaces/${encodeURIComponent(espaceId)}/publications`,
  );
  return (
    <>
      <Titre
        surtitre="Communauté"
        sousTitre={data?.espace.description ?? 'Publie, épingle, masque.'}
        actions={
          <Link href="/academie/communaute" className={BTN_DISCRET}>
            Tous les espaces
          </Link>
        }
      >
        {data ? `${data.espace.icone ? `${data.espace.icone} ` : ''}${data.espace.titre}` : 'Fil'}
      </Titre>
      {data ? (
        <FilCommunaute mode="academie" espaceId={espaceId} peutPublier couleur="#1E9E6A" initiales={data.publications} />
      ) : (
        <Encart ton="attention">{error ?? 'Ce fil ne se charge pas pour le moment.'}</Encart>
      )}
    </>
  );
}
