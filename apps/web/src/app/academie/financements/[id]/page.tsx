import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { apiAcademie, sessionAcademie } from '../../_session';
import { BTN_DISCRET, Encart } from '../../_ui';
import type { DossierFinancement, LigneSessionAdmin, ListeFactures } from '../../_gestion/types';
import { FicheDossier } from './FicheDossier';

export const metadata: Metadata = { title: 'Dossier de financement', robots: { index: false, follow: false } };

export default async function DossierFinancementPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const s = await sessionAcademie(`/academie/financements/${id}`);
  const [detail, sessionsR, facturesR] = await Promise.all([
    apiAcademie<DossierFinancement>(s, `/academie/gestion/financements/${encodeURIComponent(id)}`),
    apiAcademie<LigneSessionAdmin[]>(s, '/academie/gestion/sessions'),
    apiAcademie<ListeFactures>(s, '/academie/gestion/factures?type=FACTURE'),
  ]);
  if (detail.status === 404) notFound();
  if (!detail.data) {
    return (
      <>
        <Link href="/academie/financements" className={BTN_DISCRET}>
          ← Tous les dossiers
        </Link>
        <div className="mt-4">
          <Encart ton="attention">{detail.error ?? 'Le dossier ne se charge pas pour le moment.'}</Encart>
        </div>
      </>
    );
  }
  const sessions = (Array.isArray(sessionsR.data) ? sessionsR.data : []).map((x) => ({ id: x.id, titre: x.titre, startDate: x.startDate }));
  const factures = (facturesR.data?.factures ?? [])
    .filter((f) => f.statut !== 'BROUILLON')
    .map((f) => ({ id: f.id, libelle: `${f.numero ?? 'Facture'} · ${f.client.nom}` }));
  return <FicheDossier initial={detail.data} sessions={sessions} factures={factures} />;
}
