// LA SEULE VALIDATION MANUELLE DU MODÈLE.
//
// ⚠ UNE DEMANDE PAR ÉTABLISSEMENT, PAS UNE PAR SALARIÉ — c'est ce qui rend
// cette charge tenable. Un chef de service qui arrive seul ne passe pas par
// ici : son périmètre est celui qu'il constitue lui-même, par invitation, et
// il n'ouvre donc rien qu'on ne lui ait donné. Seule la DIRECTION demande une
// validation, parce qu'elle seule gagne la vue sur des équipes constituées par
// d'autres, avant elle.
//
// ⚠ ACCEPTER OUVRE DES DONNÉES À QUELQU'UN QUE PERSONNE N'A CHOISI. Les
// salariés déjà rattachés en sont informés automatiquement à l'acceptation
// (notification posée côté API) : c'est une obligation d'information, et c'est
// aussi ce qui rend le dispositif acceptable en interne — personne ne découvre
// après coup que sa direction voit ses demandes.
//
// Les « indices » affichés ne décident de rien : ils éclairent. Un courriel au
// domaine de la structure vaut mieux qu'un gmail, mais beaucoup de petites
// associations n'ont que des adresses grand public — refuser sur ce seul motif
// écarterait exactement les structures qu'on veut servir.
import type { Metadata } from 'next';
import { requireAdmin, fetchApi } from '../../../_shared/server';
import { PageHeader, EmptyState, ErrorState } from '../../../_shared/ui';
import { DemandesNiveau, type DemandeNiveau } from './DemandesNiveau';

export const metadata: Metadata = { title: 'Demandes de direction' };

export default async function AdminOrganisationPage() {
  const session = await requireAdmin();
  const { data, error } = await fetchApi<DemandeNiveau[]>(
    session,
    '/admin/organisation/demandes-niveau',
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Demandes d’accès direction"
        subtitle="Le seul passage manuel du modèle : une demande par établissement, jamais une par salarié."
      />

      {error ? (
        <ErrorState
          title="Demandes indisponibles"
          description="Impossible de charger les demandes pour le moment."
          retryHref="/admin/organisation"
        />
      ) : !data || data.length === 0 ? (
        <EmptyState
          title="Aucune demande en attente"
          description="Les responsables et les salariés n’en font pas : leur périmètre est celui qu’ils constituent eux-mêmes, par invitation."
        />
      ) : (
        <DemandesNiveau demandes={data} />
      )}
    </div>
  );
}
