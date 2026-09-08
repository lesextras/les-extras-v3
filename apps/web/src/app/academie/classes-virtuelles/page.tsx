import type { Metadata } from 'next';
import { apiAcademie, sessionAcademie } from '../_session';
import { Encart, Titre } from '../_ui';
import type { Classe, CoursResume } from '../_ecole/types';
import { Classes } from './Classes';

export const metadata: Metadata = { title: 'Mes classes virtuelles', robots: { index: false, follow: false } };

/**
 * `/academie/classes-virtuelles` — LES RENDEZ-VOUS EN VISIO.
 *
 * Une classe virtuelle est une date, un lien, et éventuellement le cours
 * auquel elle se rattache. Le reste — qui vient, qui a émargé — se suit dans
 * la session correspondante.
 */
export default async function ClassesPage() {
  const s = await sessionAcademie('/academie/classes-virtuelles');
  const [classes, cours] = await Promise.all([
    apiAcademie<Classe[]>(s, '/ecole/classes'),
    apiAcademie<CoursResume[]>(s, '/ecole/cours'),
  ]);

  return (
    <>
      <Titre
        surtitre="Les rendez-vous en visio"
        sousTitre="Une date, une heure, un lien. Les personnes inscrites au cours rattaché retrouvent la classe dans leur espace."
      >
        Mes classes virtuelles
      </Titre>

      {classes.data ? (
        <Classes
          initiales={Array.isArray(classes.data) ? classes.data : []}
          cours={Array.isArray(cours.data) ? cours.data : []}
        />
      ) : (
        <Encart ton="attention">{classes.error ?? 'Les classes ne se chargent pas pour le moment.'}</Encart>
      )}
    </>
  );
}
