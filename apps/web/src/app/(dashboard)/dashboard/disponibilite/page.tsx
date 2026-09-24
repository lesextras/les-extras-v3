// MA DISPONIBILITÉ — ce que j'accepte de faire, et qui peut me voir.
//
// ⚠ CETTE PAGE EST LA SORTIE AUTANT QUE L'ENTRÉE. C'est ici qu'on se met dans
// la liste consultée par les établissements, et c'est ici qu'on s'en retire —
// en un clic, sans avoir à chercher. Quelqu'un qui a retrouvé un poste doit
// pouvoir disparaître tout de suite ; sinon il ne le fait pas, et la liste
// devient fausse pour tout le monde.
//
// C'est aussi l'adresse que porte le courriel de relance « toujours
// disponible ? » : si elle bouge, il faut reprendre `sendRelanceDisponibilite`.
import type { Metadata } from 'next';
import { requireSession, fetchApi } from '../../../_shared/server';
import { PageHeader, ErrorState } from '../../../_shared/ui';
import { Card, CardContent } from '@/components/ui/card';
import { MaDisponibilite, type EtatDisponibilite } from './MaDisponibilite';

export const metadata: Metadata = { title: 'Ma disponibilité' };

export default async function DisponibilitePage() {
  const session = await requireSession();
  const { data, error } = await fetchApi<EtatDisponibilite>(session, '/disponibilites/moi');

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ma disponibilité"
        subtitle="Ce que vous acceptez de faire, où vous pouvez vous déplacer, et si les établissements peuvent vous voir."
      />

      {error || !data ? (
        <ErrorState
          title="Page indisponible"
          description="Cette page ne concerne pas les comptes d’établissement : ce sont les professionnels qui s’y déclarent, depuis leur propre compte."
          retryHref="/dashboard/disponibilite"
        />
      ) : (
        <MaDisponibilite etat={data} />
      )}

      <Card>
        <CardContent className="space-y-2 p-5 text-sm">
          <p className="font-semibold">Ce que les établissements voient</p>
          <p className="text-muted-foreground" lang="fr">
            Votre nom, votre métier, les départements où vous pouvez vous
            déplacer et vos deux lignes de présentation.{' '}
            <strong className="text-foreground">
              Ni votre téléphone, ni votre adresse e-mail
            </strong>{' '}
            : ils vous écrivent par la messagerie, et vos coordonnées ne
            s’ouvrent qu’une fois la demande confirmée.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
