import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { fetchPublic } from '../../../_shared/server';
import { CarteIntegree } from '../../_carte/Carte';

export const revalidate = 300;
export const metadata: Metadata = { title: { absolute: 'Formation' }, robots: { index: false, follow: false } };

interface CarteCours {
  titre: string;
  slug: string;
  sousTitre: string | null;
  imageUrl: string | null;
  prixCents: number;
  prixBarreCents: number | null;
  gratuit: boolean;
  ecole: { nom: string; couleur: string; couleurBoutons: string | null } | null;
}

/** `/integration/cours/<slug>` : la carte d'une formation, à coller dans une iframe. */
export default async function Page({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ bouton?: string }> }) {
  const { slug } = await params;
  const { bouton } = await searchParams;
  const { data } = await fetchPublic<CarteCours>(`/public/ecole/integration/cours/${encodeURIComponent(slug)}`, { revalidate: 300 });
  if (!data || !(data as CarteCours).slug) notFound();
  const c = data as CarteCours;
  return (
    <CarteIntegree
      titre={c.titre}
      sousTitre={c.sousTitre}
      imageUrl={c.imageUrl}
      prixCents={c.prixCents}
      prixBarreCents={c.prixBarreCents}
      gratuit={c.gratuit}
      href={`/cours/${c.slug}`}
      couleur={c.ecole?.couleurBoutons || c.ecole?.couleur || '#1E9E6A'}
      texteBouton={(bouton ?? '').slice(0, 40) || 'Découvrir la formation'}
      ecole={c.ecole?.nom ?? null}
    />
  );
}
