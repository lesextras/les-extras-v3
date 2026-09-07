import type { Metadata } from 'next';
import { EnConstruction } from '../EnConstruction';

export const metadata: Metadata = { title: "Paramètres", robots: { index: false, follow: false } };

export default function Page() {
  return (
    <EnConstruction
      titre={"Paramètres"}
      surtitre={"Mon compte"}
      quoi={"Les réglages de l'espace : l'association, la banque, les notifications, la fermeture du compte."}
      contenu={["L'identité de la structure et ses coordonnées", "Le compte bancaire et les informations de vérification", "Les notifications : ce qu'on t'envoie, et à quelle fréquence", "La fermeture du compte et l'export de tes données"]}
      deja={"L'identité de ton association se règle déjà dans « Mon association » ; cet écran regroupera le reste."}
    />
  );
}
