// PARTAGER LEX (24/09/2026) — le titulaire d'un compte paie les générations LEX
// d'autres personnes, chacune avec un plafond mensuel. On partage des crédits,
// jamais un compte : voir `apps/api/src/billing/enveloppes.service.ts`.
import type { Metadata } from "next";
import { requireSession } from "../../../_shared/server";
import { PageHeader } from "../../../_shared/ui";
import { GestionEnveloppes } from "../../../_shared/GestionEnveloppes";

export const metadata: Metadata = { title: "Partager LEX" };
export const dynamic = "force-dynamic";

export default async function PagePartagerLex() {
  await requireSession();
  return (
    <div className="space-y-6">
      <PageHeader
        title="Partager LEX avec votre équipe"
        subtitle="Vous prenez en charge les générations LEX des personnes de votre choix, avec un plafond par mois. Chacune garde son compte et ses écrits."
      />
      <GestionEnveloppes />
    </div>
  );
}
