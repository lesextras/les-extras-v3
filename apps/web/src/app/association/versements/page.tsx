import type { Metadata } from 'next';
import { EnConstruction } from '../EnConstruction';

export const metadata: Metadata = { title: "Versements", robots: { index: false, follow: false } };

export default function Page() {
  return (
    <EnConstruction
      titre={"Versements"}
      surtitre={"Mon compte"}
      quoi={"Ce que tu as collecté, ce qui reste à te verser, et sur quel compte bancaire."}
      contenu={["Le solde disponible et le solde en attente de validation", "L'historique des versements sur le compte bancaire, avec leur date", "Le compte bancaire de destination, et de quoi le changer", "Le versement automatique une fois par mois, si tu le choisis"]}
      deja={"La collecte en ligne arrive avec la billetterie et Stripe, au lot 4. En attendant, les dons et règlements hors ligne se notent dans ta comptabilité."}
    />
  );
}
