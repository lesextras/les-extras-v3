import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { fetchPublic } from '../../_shared/server';
import { SignerDocument, type InfosSignature } from './SignerDocument';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: { absolute: 'Signer un document' }, robots: { index: false, follow: false } };

export default async function PageSigner({ params }: { params: Promise<{ jeton: string }> }) {
  const { jeton } = await params;
  const { data } = await fetchPublic<InfosSignature>(`/public/academie/signature/${encodeURIComponent(jeton)}`, { revalidate: 0 });
  if (!data || !(data as InfosSignature).titre) notFound();
  return <SignerDocument jeton={jeton} infos={data as InfosSignature} />;
}
