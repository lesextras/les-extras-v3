import { redirect } from 'next/navigation';

/** L'atelier a déménagé : une formation s'ouvre depuis « Mes formations ». */
export default async function AncienCoursPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/academie/formations/${id}`);
}
