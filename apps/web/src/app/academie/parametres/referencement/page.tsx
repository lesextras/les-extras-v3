import type { Metadata } from 'next';
import { apiAcademie, sessionAcademie } from '../../_session';
import { Encart, Titre } from '../../_ui';
import { OngletsParametres } from '../_onglets';
import { Referencement } from './Referencement';
import type { ReglagesSuite } from '../../_ecole/suite-types';

export const metadata: Metadata = { title: 'Référencement', robots: { index: false, follow: false } };

export default async function PageReferencement() {
  const s = await sessionAcademie('/academie/parametres/referencement');
  const { data, error } = await apiAcademie<ReglagesSuite>(s, '/ecole/reglages-suite');
  return (
    <>
      <Titre surtitre="Paramètres" sousTitre="Ce que Google affiche pour la page de ton école. Chaque formation garde son propre titre et sa description.">
        Référencement
      </Titre>
      <OngletsParametres actif="/academie/parametres/referencement" />
      {data ? <Referencement initial={data} /> : <Encart ton="attention">{error ?? 'Les réglages ne se chargent pas.'}</Encart>}
    </>
  );
}
