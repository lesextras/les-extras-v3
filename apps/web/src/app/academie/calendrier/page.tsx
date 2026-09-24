import type { Metadata } from 'next';
import { apiAcademie, sessionAcademie } from '../_session';
import { Encart, Titre } from '../_ui';
import { Calendrier } from './Calendrier';
import type { Evenement, ReglagesSuite } from '../_ecole/suite-types';
import type { CoursResume } from '../_ecole/types';

export const metadata: Metadata = { title: 'Calendrier', robots: { index: false, follow: false } };

/**
 * `/academie/calendrier` : CE QUE VOIENT LES APPRENANTS DANS LEUR CALENDRIER.
 *
 * Trois sources, comme chez Teachizy : les événements posés ici, les classes
 * virtuelles, et les leçons à ouverture différée. On règle ici les premiers,
 * et si le calendrier s'affiche dans l'espace apprenant.
 */
export default async function PageCalendrier() {
  const s = await sessionAcademie('/academie/calendrier');
  const [ev, reg, cours] = await Promise.all([
    apiAcademie<Evenement[]>(s, '/ecole/evenements'),
    apiAcademie<ReglagesSuite>(s, '/ecole/reglages-suite'),
    apiAcademie<CoursResume[]>(s, '/ecole/cours'),
  ]);
  return (
    <>
      <Titre surtitre="Formations" sousTitre="Ce que tes apprenants voient arriver.">
        Calendrier
      </Titre>
      {Array.isArray(ev.data) && reg.data ? (
        <Calendrier initiaux={ev.data} visible={reg.data.calendrierVisible} cours={Array.isArray(cours.data) ? cours.data : []} />
      ) : (
        <Encart ton="attention">{ev.error ?? reg.error ?? 'Le calendrier ne se charge pas pour le moment.'}</Encart>
      )}
    </>
  );
}
