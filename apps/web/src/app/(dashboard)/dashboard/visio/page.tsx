// LES RENDEZ-VOUS À DISTANCE — l'agenda de l'intervenant.
//
// ⚠⚠ CE N'EST PAS DE LA TÉLÉMÉDECINE. Les séances qui se posent ici relèvent
// de la rééducation et de l'éducation spécialisée, en complément du parcours
// de la personne : guidance, suivi, point avec une équipe ou une enseignante.
// Aucun diagnostic n'y est posé, aucune prescription n'y est délivrée, et
// aucun champ de cet écran ne doit jamais porter un motif médical.
//
// ⚠ L'ÉCRAN N'EXISTE QUE SI LE SERVICE EST OUVERT (`visioconsultationVisible`,
// voir `@/lib/offre`). Une entrée de menu qui mènerait à « service
// indisponible » se lit comme une panne, et c'est le genre de détail qui fait
// douter du reste.
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { requireSession, fetchApi } from '../../../_shared/server';
import { PageHeader, ErrorState } from '../../../_shared/ui';
import { MesVisios } from './MesVisios';
import { visioconsultationVisible } from '@/lib/offre';

export const metadata: Metadata = { title: 'Rendez-vous à distance' };

export const dynamic = 'force-dynamic';

export default async function PageVisioDashboard() {
  if (!visioconsultationVisible()) notFound();

  const session = await requireSession();

  /*
   * Les deux appels partent ensemble : la liste des rendez-vous et celle des
   * interventions sur lesquelles on peut en poser un. Séquentiels, ils
   * ajouteraient un aller-retour à un écran qu'on ouvre entre deux séances.
   */
  const [rdv, interventions] = await Promise.all([
    fetchApi<Parameters<typeof MesVisios>[0]['visios']>(session, '/visio/mes-rendez-vous'),
    fetchApi<{ items?: Parameters<typeof MesVisios>[0]['interventions'] }>(
      session,
      '/bookings?take=50',
    ),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Rendez-vous à distance"
        subtitle="Une séance en visioconsultation, sur une intervention déjà acceptée. La personne reçoit un lien : ni compte à créer, ni logiciel à installer."
      />

      {rdv.error ? (
        <ErrorState
          title="Vos rendez-vous ne s’affichent pas"
          description="Un incident technique de notre côté, pas une absence de rendez-vous. Réessayez dans quelques minutes."
        />
      ) : (
        <MesVisios
          visios={rdv.data ?? []}
          interventions={
            Array.isArray(interventions.data)
              ? interventions.data
              : (interventions.data?.items ?? [])
          }
        />
      )}
    </div>
  );
}
