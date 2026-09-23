import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CoqueEcole } from '../../_espace/coque';
import { ecoleDuSlug } from '../../_espace/donnees';
import { ChoisirMotDePasse } from './ChoisirMotDePasse';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: { absolute: 'Choisir mon mot de passe' }, robots: { index: false, follow: false } };

export default async function PageMotDePasse({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ jeton?: string }>;
}) {
  const { slug } = await params;
  const { jeton } = await searchParams;
  const ecole = await ecoleDuSlug(slug);
  if (!ecole) notFound();
  return (
    <CoqueEcole ecole={ecole} actif="connexion" connecte={false}>
      <ChoisirMotDePasse slug={slug} jeton={jeton ?? ''} couleur={ecole.couleur} />
    </CoqueEcole>
  );
}
