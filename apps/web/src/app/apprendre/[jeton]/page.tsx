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
  const { data, status, error } = await fetchPublic<CoursSuivi>(`/public/ecole/apprendre/${encodeURIComponent(jeton)}`, { revalidate: 0 });
  const suivi = data && (data as CoursSuivi).cours ? (data as CoursSuivi) : null;
  // Un accès arrivé à son terme n'est pas un lien faux : on le dit.
  if (!suivi && status === 403) {
    return (
      <main className="mx-auto max-w-[640px] px-4 py-16 text-[#334A42]">
        <h1 className="text-3xl font-extrabold tracking-tight text-[#12312A]">Accès terminé</h1>
        <p className="mt-4 text-lg leading-relaxed">{error ?? "Votre accès à cette formation a pris fin."}</p>
        <p className="mt-3 leading-relaxed">Pour le prolonger, écrivez à l&apos;organisme qui vous a inscrit.</p>
      </main>
    );
  }
  if (!suivi) notFound();

  return <Lecteur jeton={jeton} suivi={suivi} />;
}
