// LES ATELIERS PAYÉS EN LIGNE, CÔTÉ ACHETEUR (28/09/2026).
//
// Le formulaire de paiement d'un atelier ouvre un compte : il faut donc que ce
// compte montre ce qu'on vient d'acheter, sinon il ne sert à rien. Rien ne
// s'affiche tant qu'aucun achat n'existe : un encart vide sur chaque tableau
// de bord ne dirait rien à personne.
import Link from "next/link";
import { Receipt } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { SectionTitle } from "./ui";

export interface AchatAtelier {
  id: string;
  statut: "PAYEE" | "CONFIRMEE" | "REALISEE" | "ANNULEE";
  montantCents: number;
  montantRembourseCents?: number | null;
  dateSouhaitee?: string | null;
  creneau?: string | null;
  participants?: number | null;
  atelier?: { id: string; titre: string; slug?: string | null } | null;
  intervenant?: string | null;
}

const STATUT: Record<AchatAtelier["statut"], string> = {
  PAYEE: "Payé, date à confirmer",
  CONFIRMEE: "Date confirmée",
  REALISEE: "Réalisé",
  ANNULEE: "Annulé",
};

const euros = (c: number) => (c / 100).toFixed(2).replace(".", ",") + " €";

export function AteliersPayes({ achats }: { achats: AchatAtelier[] }) {
  if (achats.length === 0) return null;
  return (
    <section className="space-y-3">
      <SectionTitle title="Mes ateliers payés en ligne" />
      <div className="space-y-2">
        {achats.map((a) => {
          const date = a.dateSouhaitee
            ? new Date(a.dateSouhaitee).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })
            : null;
          return (
            <Card key={a.id}>
              <CardContent className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="truncate font-medium text-foreground">
                    {a.atelier ? (
                      <Link href={`/ateliers/${a.atelier.slug ?? a.atelier.id}`} className="hover:underline">
                        {a.atelier.titre}
                      </Link>
                    ) : (
                      "Atelier"
                    )}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {[a.intervenant ? `Avec ${a.intervenant}` : null, date ? `le ${date}` : null, a.creneau]
                      .filter(Boolean)
                      .join(" · ") || "Date à caler avec l'intervenant"}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3 text-sm">
                  <span className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
                    {STATUT[a.statut] ?? a.statut}
                  </span>
                  <span className="flex items-center gap-1 font-medium text-foreground">
                    <Receipt className="size-4 text-muted-foreground" aria-hidden />
                    {euros(a.montantCents)}
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
