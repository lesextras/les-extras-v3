import type { Metadata } from 'next';
import { apiAcademie, sessionAcademie } from '../_session';
import { Encart, Titre } from '../_ui';
import type { Affilie, Vente, Vitrine } from '../_ecole/types';
import { Affiliation } from './Affiliation';

export const metadata: Metadata = { title: 'Affiliation', robots: { index: false, follow: false } };

/**
 * `/academie/affiliation` — CELLES ET CEUX QUI TE RECOMMANDENT.
 *
 * Chaque affilié a un code. Quand une vente porte ce code, elle lui est
 * attribuée et sa commission se calcule dessus. Rien n'est versé
 * automatiquement : l'écran dit ce qui est dû, le règlement reste ta décision.
 */
export default async function AffiliationPage() {
  const s = await sessionAcademie('/academie/affiliation');
  const [affilies, ventes, vitrine] = await Promise.all([
    apiAcademie<Affilie[]>(s, '/ecole/affilies'),
    apiAcademie<Vente[]>(s, '/ecole/ventes'),
    apiAcademie<Vitrine>(s, '/ecole/vitrine'),
  ]);

  return (
    <>
      <Titre
        surtitre="Se faire connaître par la recommandation"
        sousTitre="Un code par ambassadeur : sa commission se calcule seule."
      >
        Mon programme d&apos;affiliation
      </Titre>

      {affilies.data ? (
        <Affiliation
          initiaux={Array.isArray(affilies.data) ? affilies.data : []}
          ventes={Array.isArray(ventes.data) ? ventes.data : []}
          slug={vitrine.data?.slug ?? ''}
        />
      ) : (
        <Encart ton="attention">{affilies.error ?? "L'affiliation ne se charge pas pour le moment."}</Encart>
      )}
    </>
  );
}
