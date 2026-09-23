// LES PERSONNES DISPONIBLES — le vivier ouvert.
//
// ⚠⚠ CE N'EST PAS `/dashboard/vivier`, ET LES DEUX NE DOIVENT PAS ÊTRE FONDUS.
//
//   — `/dashboard/vivier` est VOTRE carnet d'adresses : les gens que vous avez
//     déjà fait venir ou déjà réservés. C'est lui qui alimente le palier
//     « réseau » de la cascade de diffusion des missions.
//   — Celui-ci est alimenté par les personnes ELLES-MÊMES, et vous y trouverez
//     des gens que vous ne connaissez pas encore.
//
// Les mélanger remplirait « mes intervenants » de gens jamais rencontrés et
// fausserait le ciblage de vos missions.
//
// ⚠ DEUX MONTAGES, ET LA LISTE LES AFFICHE PLUTÔT QUE DE LES GOMMER. Remplacer
// quelqu'un sur un poste se conclut en CDD ; un renfort personnalisé se
// facture par la structure de l'intervenant. L'étiquette est calculée par le
// serveur pour que les deux écrans n'en donnent jamais deux traductions
// différentes.
import type { Metadata } from 'next';
import { requireSession, fetchApi } from '../../../_shared/server';
import { PageHeader, ErrorState } from '../../../_shared/ui';
import { Card, CardContent } from '@/components/ui/card';
import { VivierOuvert, type PersonneDisponible } from './VivierOuvert';

export const metadata: Metadata = { title: 'Personnes disponibles' };

export default async function VivierOuvertPage() {
  const session = await requireSession();
  const { data, error } = await fetchApi<PersonneDisponible[]>(session, '/disponibilites/vivier');

  return (
    <div className="space-y-6">
      <PageHeader
        title="Personnes disponibles"
        subtitle="Celles et ceux qui se sont déclarés disponibles. Vous ne les connaissez pas forcément : c’est tout l’intérêt."
      />

      {error || !data ? (
        <ErrorState
          title="Liste indisponible"
          description="Cette liste est réservée aux comptes de structure. Si vous en avez un, reconnectez-vous et réessayez."
          retryHref="/dashboard/vivier-ouvert"
        />
      ) : (
        <VivierOuvert personnes={data} />
      )}

      <Card>
        <CardContent className="space-y-2 p-5 text-sm">
          <p className="font-semibold">Deux montages, deux contrats</p>
          <p className="text-muted-foreground" lang="fr">
            <strong className="text-foreground">Remplacement · CDD</strong> : la
            personne vient couvrir un poste, vous l’embauchez en contrat court.{' '}
            <strong className="text-foreground">Renfort personnalisé</strong> :
            elle intervient en plus de l’équipe, sur un besoin nommé, et facture
            par sa structure. Ce n’est pas la personne qui choisit, c’est votre
            besoin.
          </p>
          <p className="text-muted-foreground" lang="fr">
            <strong className="text-foreground">Le dossier.</strong> Personne ne
            peut candidater à un remplacement sans avoir déposé sa pièce
            d’identité et son bulletin n° 3 dans son compte. Les pièces sont donc
            prêtes : demandez-les au moment de l’embauche, vous n’aurez pas à
            courir après.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
