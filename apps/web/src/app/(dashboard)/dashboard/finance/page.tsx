// Les factures ont rejoint les devis sur une page commune. Redirection
// conservée pour les liens existants.
import { redirect } from "next/navigation";

export default function FinancePage() {
  redirect("/dashboard/facturation?vue=factures");
}
