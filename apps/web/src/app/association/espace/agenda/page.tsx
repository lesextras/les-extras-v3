import type { Metadata } from 'next';
import { sessionAssociation } from '../../_session';
import { Titre } from '../../_ui';
import Ecran from './Ecran';

export const metadata: Metadata = { title: 'Mon agenda', robots: { index: false, follow: false } };

/**
 * MON AGENDA — l'association.
 *
 * Les échéances d'un dossier, la pièce qui périme, l'action prévue, le
 * formulaire qui ferme : chacune de ces dates était déjà saisie quelque part,
 * et aucune n'était visible avec les autres. Elles le sont ici.
 */
export default async function AgendaAssociationPage() {
  await sessionAssociation('/espace/agenda');
  return (
    <>
      <Titre surtitre="Mon association" sousTitre="Rendez-vous et échéances, partagés avec l'équipe.">
        Mon agenda
      </Titre>
      <Ecran />
    </>
  );
}
