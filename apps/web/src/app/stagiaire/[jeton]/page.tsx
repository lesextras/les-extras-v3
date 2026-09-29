import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { fetchPublic } from '../../_shared/server';
import { EspaceStagiaire, type Espace } from './EspaceStagiaire';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: { absolute: 'Mon espace stagiaire' }, robots: { index: false, follow: false } };

/**
 * L'ESPACE DU STAGIAIRE, OUVERT PAR SON LIEN PERSONNEL.
 *
 * Pas de compte, pas de mot de passe : le jeton de l'adresse fait foi. Il
 * n'ouvre que les pièces de CETTE inscription, et la page n'est jamais indexée.
 */
export default async function PageStagiaire({ params }: { params: Promise<{ jeton: string }> }) {
  const { jeton } = await params;
  const { data } = await fetchPublic<Espace>(`/public/academie/stagiaire/${encodeURIComponent(jeton)}`, { revalidate: 0 });
  if (!data || !(data as Espace).session) notFound();
  return <EspaceStagiaire jeton={jeton} initial={data as Espace} />;
}
