// MON POSTE ET MES DROITS.
//
// Le même formulaire que la dernière étape de l'inscription, atteignable à tout
// moment. C'est ce qui rend les étapes de l'inscription non bloquantes : on
// peut toutes les passer et revenir ici, au lieu de subir un questionnaire
// administratif avant d'avoir vu le produit.
import type { Metadata } from 'next';
import Link from 'next/link';
import { requireSession, fetchApi } from '../../../_shared/server';
import { PageHeader, ErrorState } from '../../../_shared/ui';
import { Card, CardContent } from '@/components/ui/card';
import { MonPoste, type MaFiche } from './MonPoste';

export const metadata: Metadata = { title: 'Mon poste' };

export default async function MonPostePage() {
  const session = await requireSession();
  const { data, error } = await fetchApi<MaFiche>(session, '/organisation/moi');

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mon poste et mes droits"
        subtitle="Ce que vous faites dans l’établissement, et ce que vous pouvez engager en son nom."
      />

      {error || !data ? (
        <ErrorState
          title="Fiche indisponible"
          description="Cette page ne concerne que les comptes rattachés à un établissement."
          retryHref="/dashboard/mon-poste"
        />
      ) : (
        <MonPoste fiche={data} />
      )}

      <Card>
        <CardContent className="space-y-2 p-5 text-sm">
          <p className="font-semibold">Comment ça marche, en une phrase</p>
          <p className="text-muted-foreground" lang="fr">
            Vous voyez les personnes que vous avez fait venir, et celles des
            services que vous encadrez. Déclarer un niveau ne donne rien par
            lui-même : c’est l’invitation qui ouvre. Seule la Direction est
            validée à la main par Les Extras, parce qu’elle seule voit des
            équipes qu’elle n’a pas constituées.{' '}
            <Link
              href="/dashboard/organigramme"
              className="font-medium text-primary hover:underline"
            >
              Voir l’organigramme
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
