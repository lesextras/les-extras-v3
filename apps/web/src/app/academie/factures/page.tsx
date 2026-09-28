import type { Metadata } from 'next';
import { sessionAcademie } from '../_session';
import { BTN_PRIMAIRE, BTN_SECONDAIRE, CARTE, Titre } from '../_ui';
import { MesFactures } from '../../_shared/pilote/MesFactures';

export const metadata: Metadata = { title: 'Mes factures', robots: { index: false, follow: false } };

/** `/academie/factures` : le même outil premium, aux couleurs de l'académie. */
export default async function FacturesPage() {
  await sessionAcademie('/academie/factures');
  return (
    <>
      <Titre surtitre="Outil premium">Mes factures</Titre>
      <MesFactures
        theme={{
          espace: 'academie',
          primaire: '#1E9E6A',
          primaireFonce: '#0F5F3E',
          encre: '#12312A',
          bordure: '#DDEBE4',
          fond: '#F4FAF7',
          carte: CARTE,
          btnPrimaire: BTN_PRIMAIRE,
          btnSecondaire: BTN_SECONDAIRE,
        }}
      />
    </>
  );
}
