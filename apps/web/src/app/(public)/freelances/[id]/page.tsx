// Ancienne fiche intervenant, remplacée par `/intervenants/[id]`.
//
// Cette page servait une version appauvrie de la même fiche (même endpoint
// `/public/vendors/:id`, mais sans les avis, la note ni les blocs de
// réassurance). Aucun lien du site n'y menait, et `robots.txt` étant en
// `Allow: /`, Google pouvait l'indexer À LA PLACE de la vraie fiche.
//
// On garde la route en redirection permanente : les liens déjà partagés et
// l'historique d'indexation continuent de fonctionner.
import { permanentRedirect } from 'next/navigation';

export default function AncienneFicheFreelance({ params }: { params: { id: string } }) {
  permanentRedirect(`/intervenants/${params.id}`);
}
