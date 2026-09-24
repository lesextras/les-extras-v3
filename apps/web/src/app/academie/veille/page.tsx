import type { Metadata } from 'next';
import { apiAcademie, sessionAcademie } from '../_session';
import { Encart, Titre } from '../_ui';
import { Journal, type Entree } from './Journal';

export const metadata: Metadata = { title: 'Ma veille' };

/**
 * `/academie/veille` — LE JOURNAL DE VEILLE, CRITÈRE 6.
 *
 * Avec le registre des réclamations, c'est le motif de non-conformité le plus
 * fréquent en audit Qualiopi : non pas parce que la veille n'est pas faite,
 * mais parce qu'elle n'est écrite nulle part.
 */
export default async function VeillePage() {
  const s = await sessionAcademie('/academie/veille');
  const { data, error } = await apiAcademie<Entree[]>(s, '/academie/veille');

  return (
    <>
      <Titre
        surtitre="Critère 6 du référentiel national qualité"
        sousTitre="Cinq veilles : légale, métier, handicap, pédagogie, emploi."
      >
        Ma veille
      </Titre>

      {data ? (
        <Journal entrees={Array.isArray(data) ? data : []} />
      ) : (
        <Encart ton="attention">{error ?? 'Le journal de veille ne se charge pas pour le moment.'}</Encart>
      )}
    </>
  );
}
