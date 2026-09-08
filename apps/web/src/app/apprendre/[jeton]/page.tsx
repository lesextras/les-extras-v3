import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { fetchPublic } from '../../_shared/server';
import { Lecteur, type CoursSuivi } from './Lecteur';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'Mon cours', robots: { index: false, follow: false } };

/**
 * SUIVRE UN COURS.
 *
 * Le lien personnel ouvre le cours, et lui seul : pas de mot de passe, pas de
 * compte à créer. C'est le jeton dans l'adresse qui fait foi — long, aléatoire,
 * propre à une personne — et la page n'est jamais indexée.
 */
export default async function PageApprendre({ params }: { params: Promise<{ jeton: string }> }) {
  const { jeton } = await params;
  const { data } = await fetchPublic<CoursSuivi>(`/public/ecole/apprendre/${encodeURIComponent(jeton)}`, { revalidate: 0 });
  const suivi = data && (data as CoursSuivi).cours ? (data as CoursSuivi) : null;
  if (!suivi) notFound();

  return <Lecteur jeton={jeton} suivi={suivi} />;
}
