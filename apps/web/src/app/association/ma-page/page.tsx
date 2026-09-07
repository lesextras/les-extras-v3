import type { Metadata } from 'next';
import { EnConstruction } from '../EnConstruction';

export const metadata: Metadata = { title: "Ma page association", robots: { index: false, follow: false } };

export default function Page() {
  return (
    <EnConstruction
      titre={"Ma page association"}
      surtitre={"Mon compte"}
      quoi={"La vitrine publique de ton association : une adresse à donner, une page à remplir toi-même, et un bouton pour passer de l'édition à la version publique."}
      contenu={["Une bannière et un logo, remplaçables en un clic", "Ta thématique et ta description en 300 caractères — c'est aussi l'aperçu au partage et la description pour Google", "« Nos actions en cours » : billetterie, adhésion, appel à dons, financement participatif", "« Qui sommes-nous ? » dans un éditeur riche, avec images et vidéos", "Ton adresse partageable : pilote.toulali.fr/asso/ton-nom", "La page reste privée tant que tu n'as pas cliqué « publier »"]}
      deja={"C'est le lot 4 du cahier des charges. Le modèle PagePublique reste à créer — et le texte riche devra être nettoyé côté serveur avant d'être rendu."}
    />
  );
}
