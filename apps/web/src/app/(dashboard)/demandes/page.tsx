import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default function LegacyMesDemandesPage() {
  redirect("/dashboard/demandes");
}
