import type { Metadata } from 'next';
import { apiAcademie, sessionAcademie } from '../_session';
import { Encart, ORIGINE_SITE, Titre } from '../_ui';
import { Liste } from '../../_shared/formulaires/Liste';
import { TEINTE_ACADEMIE, type FormulaireResume } from '../../_shared/formulaires/types';

export const metadata: Metadata = { title: 'Mes formulaires', robots: { index: false, follow: false } };

/**
 * MES FORMULAIRES — l'académie.
 *
 * Le même atelier que dans l'espace association, en vert. Ici il sert surtout
 * l'avant et l'après d'une formation : le recueil du besoin, le
 * positionnement, la satisfaction à chaud, la mesure à froid — autant de
 * preuves que Qualiopi demande.
 */
export default async function FormulairesAcademiePage() {
  const s = await sessionAcademie('/academie/formulaires');
  const { data, error } = await apiAcademie<FormulaireResume[]>(s, '/formulaires');
  if (!data) return <Encart ton="attention">{error ?? 'Les formulaires ne se chargent pas pour le moment.'}</Encart>;

  return (
    <>
      <Titre
        surtitre="Mes formulaires"
        sousTitre="Recueil du besoin, positionnement à l'entrée, satisfaction à chaud, mesure à froid, réclamation : tu écris les questions, tu publies, tu partages le lien. Les réponses arrivent ici, et servent de preuve."
      >
        Poser une question, à plusieurs
      </Titre>
      <Liste formulaires={data} teinte={TEINTE_ACADEMIE} base="/academie/formulaires" origine={ORIGINE_SITE} />
    </>
  );
}
