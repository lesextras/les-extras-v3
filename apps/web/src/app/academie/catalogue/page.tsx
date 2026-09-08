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

      {liste ? (
        <Programmes initiaux={liste} />
      ) : (
        <Encart ton="attention">{error ?? 'Le catalogue ne se charge pas pour le moment.'}</Encart>
      )}

      <p className="mt-8 max-w-[75ch] text-[14px] leading-relaxed text-[#5E7A6E]">
        Les formations en ligne, avec leurs chapitres et leurs quiz, se gèrent dans{' '}
        <Link href="/academie/cours-en-ligne" className="font-bold text-[#0F5F3E] underline underline-offset-4">
          Mes cours en ligne
        </Link>
        . Ce catalogue-ci porte les programmes de l&apos;organisme — ceux qui donnent lieu à des sessions et à des
        conventions.
      </p>
    </>
  );
}
