import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { fetchPublic } from '../../_shared/server';
import { EntreeClasse, type ClassePublique } from './EntreeClasse';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Classe virtuelle', robots: { index: false, follow: false } };

/**
 * `/classe/<id>` : LA CLASSE VIRTUELLE INTÉGRÉE DE L'ÉCOLE.
 *
 * Même serveur de visio que les rendez-vous de Les Extras, mais à plusieurs.
 * On y entre de trois façons : le lien animateur (`?animateur=`), le lien
 * personnel d'une formation (`?jeton=`), ou la session de l'espace apprenant.
 * Le serveur vérifie les trois ; la page ne décide de rien.
 */
export default async function PageClasse({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ animateur?: string; jeton?: string }>;
}) {
  const { id } = await params;
  const { animateur, jeton } = await searchParams;
  const { data } = await fetchPublic<ClassePublique>(`/public/ecole/classes/${encodeURIComponent(id)}`, { revalidate: 0 });
  if (!data || !(data as ClassePublique).id) notFound();
  return <EntreeClasse classe={data as ClassePublique} animateur={animateur ?? null} jeton={jeton ?? null} />;
}
