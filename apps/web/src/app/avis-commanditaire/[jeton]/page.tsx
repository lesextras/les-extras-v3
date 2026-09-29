import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { fetchPublic } from '../../_shared/server';
import { AvisCommanditaire, type InfosCommanditaire } from './AvisCommanditaire';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: { absolute: 'Votre avis sur la formation' }, robots: { index: false, follow: false } };

export default async function PageAvis({ params }: { params: Promise<{ jeton: string }> }) {
  const { jeton } = await params;
  const { data } = await fetchPublic<InfosCommanditaire>(`/public/academie/commanditaire/${encodeURIComponent(jeton)}`, { revalidate: 0 });
  if (!data || !(data as InfosCommanditaire).formation) notFound();
  return <AvisCommanditaire jeton={jeton} infos={data as InfosCommanditaire} />;
}
