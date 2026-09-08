import Link from 'next/link';
import type { Metadata } from 'next';
import { apiAcademie, sessionAcademie } from '../../_session';
import { Encart, ORIGINE_SITE } from '../../_ui';
import { AtelierCours } from '../../_ecole/AtelierCours';
import type { Apprenant, CoursComplet } from '../../_ecole/types';

export const metadata: Metadata = { title: 'Mon cours', robots: { index: false, follow: false } };

/** UN COURS : son contenu, sa fiche, ses apprenants. */
export default async function CoursPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const s = await sessionAcademie(`/academie/cours-en-ligne/${id}`);

  const [c, a] = await Promise.all([
    apiAcademie<CoursComplet>(s, `/ecole/cours/${id}`),
    apiAcademie<Apprenant[]>(s, `/ecole/apprenants?cours=${id}`),
  ]);

  if (!c.data) {
    return (
      <>
        <Encart ton="attention">{c.error ?? "Ce cours n'existe pas, ou il ne t'appartient pas."}</Encart>
        <p className="mt-4">
          <Link href="/academie/cours-en-ligne" className="font-bold text-[#0F5F3E] underline underline-offset-4">
            Revenir à mes cours
          </Link>
        </p>
      </>
    );
  }

  return (
    <>
      <p className="mb-5">
        <Link href="/academie/cours-en-ligne" className="text-sm font-bold text-[#0F5F3E] no-underline hover:underline">
          ← Mes cours en ligne
        </Link>
      </p>
      <AtelierCours cours={c.data} apprenants={a.data ?? []} origine={ORIGINE_SITE} />
    </>
  );
}
