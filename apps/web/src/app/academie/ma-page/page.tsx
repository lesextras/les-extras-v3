import type { Metadata } from 'next';
import { apiAcademie, sessionAcademie } from '../_session';
import { Encart, Titre } from '../_ui';
import type { Vitrine } from '../_ecole/types';
import { Vitrine as VitrinePublique } from './Vitrine';

export const metadata: Metadata = { title: 'Ma page', robots: { index: false, follow: false } };

/**
 * `/academie/ma-page` — LA VITRINE PUBLIQUE DE L'ACADÉMIE.
 *
 * L'adresse qu'on donne, ce qu'on y lit, et le bouton qui la rend visible.
 * Elle reste privée tant qu'on n'a pas cliqué « publier » : on écrit d'abord,
 * on montre ensuite.
 */
export default async function MaPageAcademiePage() {
  const s = await sessionAcademie('/academie/ma-page');
  const { data, error } = await apiAcademie<Vitrine>(s, '/ecole/vitrine');

  return (
    <>
      <Titre
        surtitre="Mon compte"
        sousTitre="Une adresse à donner, une page à remplir, et un bouton pour la rendre visible. Rien n'est public tant que tu ne l'as pas décidé."
      >
        Ma page
      </Titre>

      {data ? (
        <VitrinePublique vitrine={data} />
      ) : (
        <Encart ton="attention">{error ?? 'La page ne se charge pas pour le moment.'}</Encart>
      )}
    </>
  );
}
