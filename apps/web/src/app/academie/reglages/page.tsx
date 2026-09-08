import type { Metadata } from 'next';
import { apiAcademie, sessionAcademie } from '../_session';
import { Encart, Titre } from '../_ui';
import type { Vitrine } from '../_ecole/types';
import { ReglagesFormations } from './ReglagesFormations';

export const metadata: Metadata = { title: 'Réglages des formations', robots: { index: false, follow: false } };

/**
 * `/academie/reglages` — CE QUI VAUT POUR TOUTES LES FORMATIONS.
 *
 * Le certificat de réussite, les commentaires, les codes de suivi : trois
 * réglages qui ne concernent pas une formation en particulier mais toutes à
 * la fois. Ils étaient dispersés — ou absents ; ils sont ici.
 */
export default async function ReglagesPage() {
  const s = await sessionAcademie('/academie/reglages');
  const { data, error } = await apiAcademie<Vitrine>(s, '/ecole/vitrine');

  return (
    <>
      <Titre
        surtitre="Ce qui vaut partout"
        sousTitre="Le certificat de réussite, les commentaires, les codes de suivi : ces réglages s'appliquent à toutes tes formations d'un coup."
      >
        Réglages des formations
      </Titre>

      {data ? (
        <ReglagesFormations vitrine={data} />
      ) : (
        <Encart ton="attention">{error ?? 'Les réglages ne se chargent pas pour le moment.'}</Encart>
      )}
    </>
  );
}
