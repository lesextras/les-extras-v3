import type { Metadata } from 'next';
import { apiAcademie, sessionAcademie } from '../_session';
import { Encart, Titre } from '../_ui';
import { Communaute, type VueCommunaute } from './Communaute';
import type { CoursResume } from '../_ecole/types';

export const metadata: Metadata = { title: 'Communauté', robots: { index: false, follow: false } };

/**
 * `/academie/communaute` : L'ENDROIT OÙ LES APPRENANTS SE PARLENT.
 *
 * Des espaces (un fil chacun), rangés en collections, ouverts à tous ou aux
 * apprenants de certaines formations. Rien n'apparaît côté apprenant tant que
 * la communauté n'est pas activée.
 */
export default async function PageCommunaute() {
  const s = await sessionAcademie('/academie/communaute');
  const [vue, cours] = await Promise.all([apiAcademie<VueCommunaute>(s, '/ecole/communaute'), apiAcademie<CoursResume[]>(s, '/ecole/cours')]);
  return (
    <>
      <Titre surtitre="Apprenants" sousTitre="Questions, entraide et annonces entre tes apprenants.">
        Communauté
      </Titre>
      {vue.data ? (
        <Communaute initiale={vue.data} cours={Array.isArray(cours.data) ? cours.data : []} />
      ) : (
        <Encart ton="attention">{vue.error ?? 'La communauté ne se charge pas pour le moment.'}</Encart>
      )}
    </>
  );
}
