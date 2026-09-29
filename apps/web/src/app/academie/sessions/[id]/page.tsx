import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { apiAcademie, sessionAcademie } from '../../_session';
import { BTN_DISCRET, Encart } from '../../_ui';
import type { FormateurOrg, SalleOrg, SessionDetail } from '../../_gestion/types';
import { Fiche } from './Fiche';

export const metadata: Metadata = { title: 'Administrer une session', robots: { index: false, follow: false } };

export default async function FicheSessionPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ onglet?: string }> }) {
  const { id } = await params;
  const { onglet } = await searchParams;
  const s = await sessionAcademie(`/academie/sessions/${id}`);
  const [detail, formateurs, salles] = await Promise.all([
    apiAcademie<SessionDetail>(s, `/academie/gestion/sessions/${encodeURIComponent(id)}`),
    apiAcademie<FormateurOrg[]>(s, '/academie/gestion/formateurs'),
    apiAcademie<SalleOrg[]>(s, '/academie/gestion/salles'),
  ]);
  if (detail.status === 404) notFound();
  if (!detail.data) {
    return (
      <>
        <Link href="/academie/sessions" className={BTN_DISCRET}>
          ← Toutes les sessions
        </Link>
        <div className="mt-4">
          <Encart ton="attention">{detail.error ?? 'La session ne se charge pas pour le moment.'}</Encart>
        </div>
      </>
    );
  }
  return <Fiche initiale={detail.data} formateurs={formateurs.data ?? []} salles={salles.data ?? []} ongletInitial={onglet} />;
}
