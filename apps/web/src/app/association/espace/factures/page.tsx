import type { Metadata } from 'next';
import { sessionAssociation } from '../../_session';
import { BTN_PRIMAIRE, BTN_SECONDAIRE, CARTE, Titre } from '../../_ui';
import { MesFactures } from '../../../_shared/pilote/MesFactures';

export const metadata: Metadata = { title: 'Mes factures', robots: { index: false, follow: false } };

/**
 * `/espace/factures` : l'outil premium de l'association. Le contenu est
 * chargé côté client (dépôt, lecture, validation), la page ne fait que
 * vérifier la session et poser le thème.
 */
export default async function FacturesPage() {
  await sessionAssociation('/espace/factures');
  return (
    <>
      <Titre surtitre="Outil premium">Mes factures</Titre>
      <MesFactures
        theme={{
          espace: 'association',
          primaire: '#4F46E5',
          primaireFonce: '#1D1B5C',
          encre: '#1D1B5C',
          bordure: '#E6E4F3',
          fond: '#F7F7FC',
          carte: CARTE,
          btnPrimaire: BTN_PRIMAIRE,
          btnSecondaire: BTN_SECONDAIRE,
        }}
      />
    </>
  );
}
