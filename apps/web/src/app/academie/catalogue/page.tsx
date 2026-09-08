import Link from 'next/link';
import type { Metadata } from 'next';
import { apiAcademie, sessionAcademie } from '../_session';
import { Encart, Titre } from '../_ui';
import { Programmes, type Programme } from './Programmes';

export const metadata: Metadata = { title: 'Mon catalogue' };

/**
 * `/academie/catalogue` — LES FORMATIONS DE L'ORGANISME.
 *
 * Une fiche programme n'est pas une plaquette : c'est la pièce que l'auditeur
 * ouvre en premier et que le financeur demande. Cinq mentions y sont exigées.
 */
export default async function CataloguePage() {
  const s = await sessionAcademie('/academie/catalogue');
  const { data, error } = await apiAcademie<{ items?: Programme[] } | Programme[]>(s, '/formations?perPage=100');

  // L'API rend une page { items, total, … } ; on accepte aussi un tableau nu.
  const liste = Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : null;

  return (
    <>
      <Titre
        surtitre="Indicateur 1 du référentiel"
        sousTitre="Chaque formation a sa fiche : des objectifs évaluables, le public visé, les prérequis, la durée et le déroulé. C'est le premier document qu'on te demandera."
      >
        Mon catalogue
      </Titre>

      <div className="mb-6">
        <Encart ton="info">
          <span className="font-extrabold">Deux endroits, deux métiers.</span> Ici, les{' '}
          <span className="font-bold">programmes</span> de l&apos;organisme : ce que l&apos;auditeur et le financeur
          lisent, ce qui donne lieu à des sessions et à des conventions. Les cours qu&apos;on vend en ligne — vignette,
          prix, chapitres, leçons, quiz, apprenants — se gèrent dans{' '}
          <Link href="/academie/cours-en-ligne" className="font-bold underline underline-offset-2">
            Mes cours en ligne
          </Link>
          .
        </Encart>
      </div>

      {liste ? (
        <Programmes initiaux={liste} />
      ) : (
        <Encart ton="attention">{error ?? 'Le catalogue ne se charge pas pour le moment.'}</Encart>
      )}
    </>
  );
}
