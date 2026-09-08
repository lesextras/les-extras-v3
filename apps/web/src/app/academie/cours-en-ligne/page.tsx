import type { Metadata } from 'next';
import { apiAcademie, sessionAcademie } from '../_session';
import { Encart, ORIGINE_SITE, Titre } from '../_ui';
import { ListeCours } from '../_ecole/ListeCours';
import type { CoursResume } from '../_ecole/types';

export const metadata: Metadata = { title: 'Mes cours en ligne', robots: { index: false, follow: false } };

/**
 * MES COURS EN LIGNE — le catalogue de l'école.
 *
 * C'est la porte de tout le reste : un cours porte ses chapitres, ses leçons,
 * ses quiz et ses inscrits. Les ventes, les codes promo et les packs sont dans
 * les écrans voisins, parce qu'ils traversent plusieurs cours.
 */
export default async function CoursEnLignePage() {
  const s = await sessionAcademie('/academie/cours-en-ligne');
  const { data, error } = await apiAcademie<CoursResume[]>(s, '/ecole/cours');
  if (!data) return <Encart ton="attention">{error ?? 'Les cours ne se chargent pas pour le moment.'}</Encart>;

  return (
    <>
      <Titre
        surtitre="Mes cours en ligne"
        sousTitre="Des chapitres, des leçons, des vidéos, des documents, des quiz. Tu écris, tu publies, tu partages l'adresse — et tu vois qui avance."
      >
        Mon école en ligne
      </Titre>
      <ListeCours cours={data} origine={ORIGINE_SITE} />
    </>
  );
}
