// Les devis ont rejoint les factures sur une page commune. On redirige plutôt
// que de supprimer : d'anciens liens, des favoris et des e-mails déjà partis
// pointent vers cette adresse.
import { redirect } from "next/navigation";

export default function DevisPage() {
  redirect("/dashboard/facturation?vue=devis");
}
