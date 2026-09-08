import type { Metadata } from 'next';
import { apiAcademie, sessionAcademie } from '../_session';
import { Encart, Titre } from '../_ui';
import { Registre, type Reclamation } from './Registre';

export const metadata: Metadata = { title: 'Mes réclamations' };

/**
 * `/academie/reclamations` — LE REGISTRE, CRITÈRE 7.
 *
 * Avec le journal de veille, c'est le motif de non-conformité le plus fréquent
 * en audit : ce que le référentiel demande, c'est la trace du traitement.
 */
export default async function ReclamationsPage() {
  const s = await sessionAcademie('/academie/reclamations');
  const { data, error } = await apiAcademie<Reclamation[]>(s, '/academie/reclamations');

  return (
    <>
      <Titre
        surtitre="Critère 7 du référentiel national qualité"
        sousTitre="Ce qu'on nous reproche, et ce qu'on en a fait. Un registre tenu vaut mieux qu'un registre vide : l'auditeur cherche la trace du traitement, pas l'absence de plainte."
      >
        Mes réclamations
      </Titre>

      {data ? (
        <Registre reclamations={Array.isArray(data) ? data : []} />
      ) : (
        <Encart ton="attention">{error ?? 'Le registre ne se charge pas pour le moment.'}</Encart>
      )}
    </>
  );
}
