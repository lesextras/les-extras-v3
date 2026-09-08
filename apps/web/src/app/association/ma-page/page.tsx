import type { Metadata } from 'next';
import { apiEspace, sessionAssociation } from '../_session';
import { Encart, Titre } from '../_ui';
import type { Espace } from '../espace/_types';
import { Presentation } from './Presentation';

export const metadata: Metadata = { title: 'Ma page association', robots: { index: false, follow: false } };

/**
 * `/ma-page` — LA PAGE DE PRÉSENTATION DE L'ASSOCIATION.
 *
 * C'est la page qu'on donne : à un financeur qui demande « qui êtes-vous ? »,
 * à une mairie, à un partenaire. Elle n'est pas saisie une deuxième fois :
 * elle est composée de ce qui est déjà dans l'espace — l'organisation, le
 * projet, les actions, le bureau — et elle s'imprime ou se copie telle quelle.
 */
export default async function MaPagePage() {
  const s = await sessionAssociation('/ma-page');
  const { data, error } = await apiEspace<Espace>(s, '/association/espace');

  return (
    <>
      <Titre
        surtitre="Mon compte"
        sousTitre="Tout ce qui est ici vient de ton espace : tu ne le ressaisis pas. Imprime la page, enregistre-la en PDF ou copie le texte pour le coller dans un dossier."
      >
        Ma page association
      </Titre>

      {data ? (
        <Presentation espace={data} />
      ) : (
        <Encart ton="attention">{error ?? 'La page ne se charge pas pour le moment.'}</Encart>
      )}
    </>
  );
}
