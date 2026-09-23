import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { fetchPublic } from '../../../_shared/server';
import { CarteIntegree } from '../../_carte/Carte';

export const revalidate = 300;
export const metadata: Metadata = { title: 'Pack', robots: { index: false, follow: false } };

interface CartePack {
  titre: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  prixCents: number;
  ecole: { nom: string; couleur: string; couleurBoutons: string | null } | null;
}

/** `/integration/pack/<slug>` : la carte d'un pack, à coller dans une iframe. */
export default async function Page({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ bouton?: string }> }) {
  const { slug } = await params;
  const { bouton } = await searchParams;
  const { data } = await fetchPublic<CartePack>(`/public/ecole/integration/pack/${encodeURIComponent(slug)}`, { revalidate: 300 });
  if (!data || !(data as CartePack).slug) notFound();
  const p = data as CartePack;
  return (
    <CarteIntegree
      titre={p.titre}
      sousTitre={p.description}
      imageUrl={p.imageUrl}
      prixCents={p.prixCents}
      href={`/boutique/${p.slug}`}
      couleur={p.ecole?.couleurBoutons || p.ecole?.couleur || '#1E9E6A'}
      texteBouton={(bouton ?? '').slice(0, 40) || 'Découvrir le pack'}
      ecole={p.ecole?.nom ?? null}
    />
  );
}
