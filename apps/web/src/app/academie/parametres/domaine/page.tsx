import type { Metadata } from 'next';
import { apiAcademie, sessionAcademie } from '../../_session';
import { Encart, Titre } from '../../_ui';
import { OngletsParametres } from '../_onglets';
import { Domaine } from './Domaine';
import type { ReglagesSuite } from '../../_ecole/suite-types';

export const metadata: Metadata = { title: 'Domaine personnalisé', robots: { index: false, follow: false } };

export default async function PageDomaine() {
  const s = await sessionAcademie('/academie/parametres/domaine');
  const { data, error } = await apiAcademie<ReglagesSuite>(s, '/ecole/reglages-suite');
  return (
    <>
      <Titre surtitre="Paramètres" sousTitre="Ton école à ta propre adresse, par exemple formations.monsite.fr.">
        Domaine personnalisé
      </Titre>
      <OngletsParametres actif="/academie/parametres/domaine" />
      {data ? <Domaine initial={data} /> : <Encart ton="attention">{error ?? 'Les réglages ne se chargent pas.'}</Encart>}
    </>
  );
}
