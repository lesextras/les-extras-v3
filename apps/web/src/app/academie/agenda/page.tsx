import type { Metadata } from 'next';
import { sessionAcademie } from '../_session';
import { Titre } from '../_ui';
import Ecran from './Ecran';

export const metadata: Metadata = { title: 'Mon agenda', robots: { index: false, follow: false } };

/**
 * MON AGENDA — l'académie.
 *
 * L'écran répond à une question que Pilote ne savait pas traiter : qu'est-ce
 * qu'on a cette semaine ? Les dates existaient, éparpillées dans les écrans
 * qui les portent ; elles sont maintenant réunies dans une grille, sans être
 * recopiées nulle part.
 */
export default async function AgendaAcademiePage() {
  await sessionAcademie('/academie/agenda');
  return (
    <>
      <Titre
        surtitre="Formations"
        sousTitre="Sessions, classes virtuelles et rendez-vous, partagés avec l'équipe."
      >
        Mon agenda
      </Titre>
      <Ecran />
    </>
  );
}
