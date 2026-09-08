import type { Metadata } from 'next';
import { apiAcademie, sessionAcademie } from '../_session';
import { Encart, Titre } from '../_ui';
import type { CoursResume, Pack } from '../_ecole/types';
import { Packs } from './Packs';

export const metadata: Metadata = { title: 'Mes packs', robots: { index: false, follow: false } };

/**
 * `/academie/packs` — PLUSIEURS COURS VENDUS ENSEMBLE.
 *
 * Un pack n'est pas une remise : c'est une offre. On choisit les cours qui en
 * font partie, on fixe un prix pour l'ensemble, et il se vend comme un cours.
 */
export default async function PacksPage() {
  const s = await sessionAcademie('/academie/packs');
  const [packs, cours] = await Promise.all([
    apiAcademie<Pack[]>(s, '/ecole/packs'),
    apiAcademie<CoursResume[]>(s, '/ecole/cours'),
  ]);

  return (
    <>
      <Titre
        surtitre="Vendre plusieurs cours ensemble"
        sousTitre="Un prix pour un ensemble de cours. La personne achète une fois et reçoit tout, d'un coup."
      >
        Mes packs
      </Titre>

      {packs.data ? (
        <Packs
          initiaux={Array.isArray(packs.data) ? packs.data : []}
          cours={Array.isArray(cours.data) ? cours.data : []}
        />
      ) : (
        <Encart ton="attention">{packs.error ?? 'Les packs ne se chargent pas pour le moment.'}</Encart>
      )}
    </>
  );
}
