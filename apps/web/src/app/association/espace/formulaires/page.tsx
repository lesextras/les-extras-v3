import type { Metadata } from 'next';
import { apiEspace, sessionAssociation } from '../../_session';
import { Encart, ORIGINE_SITE, Titre } from '../../_ui';
import { Liste } from '../../../_shared/formulaires/Liste';
import { TEINTE_ASSOCIATION, type FormulaireResume } from '../../../_shared/formulaires/types';

export const metadata: Metadata = { title: 'Mes formulaires', robots: { index: false, follow: false } };

/**
 * MES FORMULAIRES — l'association.
 *
 * Un formulaire libre, comme on en fait ailleurs : on écrit ses questions, on
 * publie, on partage un lien. Les réponses restent dans l'espace, et se
 * récupèrent en tableur.
 */
export default async function FormulairesPage() {
  const s = await sessionAssociation('/espace/formulaires');
  const { data, error } = await apiEspace<FormulaireResume[]>(s, '/formulaires');
  if (!data) return <Encart ton="attention">{error ?? 'Les formulaires ne se chargent pas pour le moment.'}</Encart>;

  return (
    <>
      <Titre
        surtitre="Mes formulaires"
        sousTitre="Une inscription, un sondage, une demande d'adhésion, un retour après une action : tu écris les questions, tu publies, tu partages le lien. Les réponses arrivent ici."
      >
        Poser une question, à plusieurs
      </Titre>
      <Liste formulaires={data} teinte={TEINTE_ASSOCIATION} base="/espace/formulaires" origine={ORIGINE_SITE} />
    </>
  );
}
