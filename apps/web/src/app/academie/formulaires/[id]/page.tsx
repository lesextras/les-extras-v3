import Link from 'next/link';
import type { Metadata } from 'next';
import { apiAcademie, sessionAcademie } from '../../_session';
import { Encart, ORIGINE_SITE } from '../../_ui';
import { Atelier } from '../../../_shared/formulaires/Atelier';
import { TEINTE_ACADEMIE, type FormulaireComplet, type ReponsesFormulaire } from '../../../_shared/formulaires/types';

export const metadata: Metadata = { title: 'Mon formulaire', robots: { index: false, follow: false } };

/** UN FORMULAIRE : ses questions, ses réglages, ses réponses. */
export default async function FormulaireAcademiePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const s = await sessionAcademie(`/academie/formulaires/${id}`);

  const [f, r] = await Promise.all([
    apiAcademie<FormulaireComplet>(s, `/formulaires/${id}`),
    apiAcademie<ReponsesFormulaire>(s, `/formulaires/${id}/reponses`),
  ]);

  if (!f.data) {
    return (
      <>
        <Encart ton="attention">{f.error ?? "Ce formulaire n'existe pas, ou il ne t'appartient pas."}</Encart>
        <p className="mt-4">
          <Link href="/academie/formulaires" className="font-bold text-[#0F5F3E] underline underline-offset-4">
            Revenir à mes formulaires
          </Link>
        </p>
      </>
    );
  }

  return (
    <>
      <p className="mb-5">
        <Link href="/academie/formulaires" className="text-sm font-bold text-[#0F5F3E] no-underline hover:underline">
          ← Mes formulaires
        </Link>
      </p>
      <Atelier formulaire={f.data} reponsesInitiales={r.data?.reponses ?? []} teinte={TEINTE_ACADEMIE} origine={ORIGINE_SITE} />
    </>
  );
}
