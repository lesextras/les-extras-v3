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
      <Titre
        surtitre="Mon agenda"
        sousTitre="Tout ce qui a une date, au même endroit : les échéances de tes dossiers, les pièces à renouveler, tes actions, la clôture de tes formulaires, les dates choisies par ceux qui y répondent, et les rendez-vous que tu notes. Toute l'équipe voit le même agenda."
      >
        Ce qui vient
      </Titre>
      <Ecran />
    </>
  );
}
