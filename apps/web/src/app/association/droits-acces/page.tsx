import type { Metadata } from 'next';
import { EnConstruction } from '../EnConstruction';

export const metadata: Metadata = { title: "Droits d'accès", robots: { index: false, follow: false } };

export default function Page() {
  return (
    <EnConstruction
      titre={"Droits d'accès"}
      surtitre={"Mon compte"}
      quoi={"Qui peut entrer dans l'espace de ton association, et jusqu'où."}
      contenu={["La liste des personnes qui administrent l'espace, avec leur adresse e-mail", "Inviter quelqu'un, et retirer un accès", "Trois niveaux : propriétaire, administrateur, membre", "Qui a fait quoi, et quand"]}
      deja={"Les modèles Membership et Invitation existent déjà en base, avec leurs rôles OWNER, ADMIN, MANAGER et MEMBER : il manque l'écran, pas le mécanisme."}
    />
  );
}
