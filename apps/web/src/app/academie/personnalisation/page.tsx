import type { Metadata } from 'next';
import { apiAcademie, sessionAcademie } from '../_session';
import { Encart, Titre } from '../_ui';
import type { Vitrine } from '../_ecole/types';
import { Personnalisation } from './Personnalisation';

export const metadata: Metadata = { title: 'Personnalisation', robots: { index: false, follow: false } };

/**
 * `/academie/personnalisation` — L'IMAGE DE MARQUE DE L'ESPACE.
 *
 * Logo, bannière, couleur : ce que voient les personnes qui arrivent sur ta
 * page et dans leur espace apprenant. Le texte de la page, lui, se règle dans
 * « Ma page ».
 */
export default async function PersonnalisationPage() {
  const s = await sessionAcademie('/academie/personnalisation');
  const { data, error } = await apiAcademie<Vitrine>(s, '/ecole/vitrine');

  return (
    <>
      <Titre
        surtitre="Ton image de marque"
        sousTitre="Logo, bannière, couleur."
      >
        Personnalisation
      </Titre>

      {data ? (
        <Personnalisation vitrine={data} />
      ) : (
        <Encart ton="attention">{error ?? 'La personnalisation ne se charge pas pour le moment.'}</Encart>
      )}
    </>
  );
}
