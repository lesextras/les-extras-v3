import type { Metadata } from 'next';
import { apiAcademie, sessionAcademie } from '../_session';
import { Encart, Titre } from '../_ui';
import { Classes } from './Classes';
import type { Classe, CoursResume } from '../_ecole/types';

export const metadata: Metadata = { title: 'Classes virtuelles', robots: { index: false, follow: false } };

/**
 * `/academie/classes-virtuelles` : LES CLASSES EN DIRECT.
 *
 * Deux façons de tenir une classe : un lien vers l'outil de visio de son
 * choix, ou la SALLE INTÉGRÉE, la même visio que les rendez-vous de Les
 * Extras, à plusieurs, sans rien installer. Les apprenants y entrent depuis
 * leur formation ou leur espace ; personne d'autre.
 */
export default async function PageClasses() {
  const s = await sessionAcademie('/academie/classes-virtuelles');
  const [classes, cours, visio] = await Promise.all([
    apiAcademie<Classe[]>(s, '/ecole/classes'),
    apiAcademie<CoursResume[]>(s, '/ecole/cours'),
    apiAcademie<{ disponible: boolean }>(s, '/ecole/visio/disponible'),
  ]);
  return (
    <>
      <Titre surtitre="Formations" sousTitre="Programme tes séances en direct. La salle intégrée s'ouvre dans le navigateur, sans installation ; rien n'y est enregistré.">
        Classes virtuelles
      </Titre>
      {!visio.data?.disponible ? (
        <div className="mb-5">
          <Encart ton="info">La salle intégrée n&apos;est pas encore disponible sur ce serveur : en attendant, colle le lien de ton outil de visio habituel.</Encart>
        </div>
      ) : null}
      {Array.isArray(classes.data) ? (
        <Classes initiales={classes.data} cours={Array.isArray(cours.data) ? cours.data : []} visioDisponible={Boolean(visio.data?.disponible)} />
      ) : (
        <Encart ton="attention">{classes.error ?? 'Les classes ne se chargent pas pour le moment.'}</Encart>
      )}
    </>
  );
}
