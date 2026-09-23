import type { Metadata } from 'next';
import { apiAcademie, sessionAcademie } from '../_session';
import { Encart, Titre } from '../_ui';
import { Devoirs, type ListeDevoirs } from './Devoirs';
import type { CoursResume } from '../_ecole/types';

export const metadata: Metadata = { title: 'Devoirs à corriger', robots: { index: false, follow: false } };

/**
 * `/academie/devoirs` : CE QUE LES APPRENANTS ONT RENDU.
 *
 * Une leçon « Devoir » ne se coche pas toute seule : l'apprenant dépose,
 * l'académie corrige. Valider fait avancer la formation ; « à reprendre »
 * renvoie la main à l'apprenant avec le commentaire.
 */
export default async function PageDevoirs({ searchParams }: { searchParams: Promise<{ cours?: string }> }) {
  const { cours } = await searchParams;
  const s = await sessionAcademie('/academie/devoirs');
  const [liste, formations] = await Promise.all([
    apiAcademie<ListeDevoirs>(s, `/ecole/devoirs${cours ? `?coursId=${encodeURIComponent(cours)}` : ''}`),
    apiAcademie<CoursResume[]>(s, '/ecole/cours'),
  ]);
  return (
    <>
      <Titre surtitre="Formations" sousTitre="Les devoirs rendus par tes apprenants. Valider fait avancer leur formation ; « à reprendre » leur renvoie ton commentaire.">
        Devoirs à corriger
      </Titre>
      {liste.data ? (
        <Devoirs initiale={liste.data} formations={Array.isArray(formations.data) ? formations.data : []} coursInitial={cours ?? ''} />
      ) : (
        <Encart ton="attention">{liste.error ?? 'Les devoirs ne se chargent pas pour le moment.'}</Encart>
      )}
    </>
  );
}
