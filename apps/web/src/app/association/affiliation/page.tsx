import type { Metadata } from 'next';
import { apiEspace, sessionAssociation } from '../_session';
import { Encart, Titre } from '../_ui';
import type { Affilie, Vente } from '../../academie/_ecole/types';
import { Affiliation } from './Affiliation';

export const metadata: Metadata = { title: 'Affiliation', robots: { index: false, follow: false } };

/**
 * `/affiliation` — CELLES ET CEUX QUI RECOMMANDENT L'ASSOCIATION.
 *
 * Le même registre que côté académie : un nom, un code, une commission. Ce
 * qu'un code rapporte se calcule sur les ventes encaissées ; tant que
 * l'association ne vend rien, les montants restent à zéro et la liste sert
 * simplement à savoir qui relaie.
 */
export default async function AffiliationPage() {
  const s = await sessionAssociation('/affiliation');
  const [affilies, ventes] = await Promise.all([
    apiEspace<Affilie[]>(s, '/ecole/affilies'),
    apiEspace<Vente[]>(s, '/ecole/ventes'),
  ]);

  return (
    <>
      <Titre
        surtitre="Se faire connaître par la recommandation"
        sousTitre="Tu donnes un code à quelqu'un ; ce qui est encaissé avec ce code lui est attribué, et sa commission se calcule dessus."
      >
        Mon programme d&apos;affiliation
      </Titre>

      {affilies.data ? (
        <Affiliation
          initiaux={Array.isArray(affilies.data) ? affilies.data : []}
          ventes={Array.isArray(ventes.data) ? ventes.data : []}
        />
      ) : (
        <Encart ton="attention">{affilies.error ?? "L'affiliation ne se charge pas pour le moment."}</Encart>
      )}
    </>
  );
}
