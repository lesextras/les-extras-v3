// MON AGENDA (24/09/2026) — tout ce qui a une date dans le compte, et les
// agendas que d'autres personnes nous partagent, au niveau qu'elles ont choisi.
// Voir `app/_shared/agenda/AgendaOutlook.tsx` et `apps/api/src/partages`.
import type { Metadata } from 'next';
import { requireSession } from '../../../_shared/server';
import { PageHeader } from '../../../_shared/ui';
import { AgendaOutlook } from '../../../_shared/agenda/AgendaOutlook';

export const metadata: Metadata = { title: 'Mon agenda' };

export const dynamic = 'force-dynamic';

export default async function PageAgenda({ searchParams }: { searchParams: Promise<{ onglet?: string }> }) {
  await requireSession();
  const { onglet } = await searchParams;
  return (
    <div className="space-y-6">
      <PageHeader
        title="Mon agenda"
        subtitle="Vos rendez-vous, réservations, visios et missions au même endroit, et les agendas qu’on vous partage."
      />
      <AgendaOutlook ongletInitial={onglet === 'partages' ? 'partages' : 'calendrier'} />
    </div>
  );
}
