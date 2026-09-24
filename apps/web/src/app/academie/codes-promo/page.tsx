import type { Metadata } from 'next';
import { apiAcademie, sessionAcademie } from '../_session';
import { Encart, Titre } from '../_ui';
import type { CoursResume, Promo } from '../_ecole/types';
import { CodesPromo } from './CodesPromo';

export const metadata: Metadata = { title: 'Mes codes promo', robots: { index: false, follow: false } };

/**
 * `/academie/codes-promo` — LES REMISES QU'ON DONNE À QUELQU'UN.
 *
 * Par défaut un code s'applique à tout. On peut le restreindre à certains
 * cours, lui donner une date de début et de fin, et un nombre d'usages.
 */
export default async function CodesPromoPage() {
  const s = await sessionAcademie('/academie/codes-promo');
  const [promos, cours] = await Promise.all([
    apiAcademie<Promo[]>(s, '/ecole/codes-promo'),
    apiAcademie<CoursResume[]>(s, '/ecole/cours'),
  ]);

  return (
    <>
      <Titre
        surtitre="Les remises"
        sousTitre="Un code, une remise, les cours concernés."
      >
        Mes codes promo
      </Titre>

      {promos.data ? (
        <CodesPromo
          initiaux={Array.isArray(promos.data) ? promos.data : []}
          cours={Array.isArray(cours.data) ? cours.data : []}
        />
      ) : (
        <Encart ton="attention">{promos.error ?? 'Les codes promo ne se chargent pas pour le moment.'}</Encart>
      )}
    </>
  );
}
