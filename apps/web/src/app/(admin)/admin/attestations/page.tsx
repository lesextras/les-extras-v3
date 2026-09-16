// LA FILE DES ATTESTATIONS — commandées, payées, délivrées.
//
// ⚠⚠ LE BOUTON « DÉLIVRER » REFUSE TANT QUE LE DÉLAI DE RÉTRACTATION COURT, et
// le refus vient du serveur, pas d'ici. Quatorze jours (art. L221-18 c. conso),
// qui ne s'éteignent que sur demande expresse d'exécution immédiate de
// l'acheteur (L221-25, L221-28 1°). L'écran affiche donc la date à partir de
// laquelle on peut délivrer : sans elle, on clique, on se fait refuser, et le
// refus se lit comme une panne.
import type { Metadata } from "next";
import { requireAdmin, fetchApi } from "../../../_shared/server";
import { PageHeader, EmptyState, ErrorState } from "../../../_shared/ui";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ActionsAttestation } from "../../../_shared/ActionsAttestation";

export const metadata: Metadata = { title: "Attestations" };

interface DemandeAttestation {
  id: string;
  email: string;
  prenom: string;
  nom: string;
  montantCents: number;
  statut: "EN_ATTENTE_PAIEMENT" | "PAYEE" | "DELIVREE" | "ANNULEE";
  renonciationRetractation: boolean;
  payeeLe?: string | null;
  livrableLe?: string | null;
  delivreeLe?: string | null;
  createdAt: string;
  formation?: { id: string; title: string; slug?: string | null } | null;
}

const LIBELLE: Record<DemandeAttestation["statut"], string> = {
  EN_ATTENTE_PAIEMENT: "En attente de paiement",
  PAYEE: "Payée",
  DELIVREE: "Délivrée",
  ANNULEE: "Annulée",
};

function variante(statut: DemandeAttestation["statut"]) {
  if (statut === "DELIVREE") return "success" as const;
  if (statut === "PAYEE") return "default" as const;
  if (statut === "ANNULEE") return "destructive" as const;
  return "muted" as const;
}

function date(iso?: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default async function AdminAttestationsPage() {
  const session = await requireAdmin();
  const { data, error } = await fetchApi<DemandeAttestation[]>(
    session,
    "/attestations/admin",
  );

  const demandes = data ?? [];
  const aDelivrer = demandes.filter(
    (d) => d.statut === "PAYEE" && (!d.livrableLe || new Date(d.livrableLe) <= new Date()),
  ).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Attestations de suivi"
        subtitle={
          aDelivrer > 0
            ? `${aDelivrer} attestation(s) à délivrer maintenant.`
            : "Ce qui est commandé, payé, et délivré."
        }
      />

      {error ? (
        <ErrorState retryHref="/admin/attestations" />
      ) : demandes.length === 0 ? (
        <EmptyState
          title="Aucune commande"
          description="La vente s’ouvre parcours par parcours, en posant un prix d’attestation sur la fiche. Tant qu’aucun prix n’est posé, le bouton d’achat n’apparaît pas."
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Personne</TableHead>
                    <TableHead>Parcours</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Délivrable</TableHead>
                    <TableHead className="text-right">Montant</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {demandes.map((d) => {
                    const attend =
                      d.statut === "PAYEE" &&
                      Boolean(d.livrableLe) &&
                      new Date(d.livrableLe as string) > new Date();
                    return (
                      <TableRow key={d.id}>
                        <TableCell>
                          <p className="font-medium">
                            {d.prenom} {d.nom}
                          </p>
                          <p className="text-xs text-muted-foreground">{d.email}</p>
                        </TableCell>
                        <TableCell className="max-w-[18rem]">
                          <span className="line-clamp-2 text-sm">
                            {d.formation?.title ?? "—"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant={variante(d.statut)}>{LIBELLE[d.statut]}</Badge>
                        </TableCell>
                        <TableCell>
                          {d.statut === "DELIVREE" ? (
                            <span className="text-xs text-muted-foreground">
                              le {date(d.delivreeLe)}
                            </span>
                          ) : attend ? (
                            /* Le délai de rétractation court : on dit jusqu'à
                               quand, et pourquoi le bouton refusera. */
                            <span className="text-xs text-secondary">
                              rétractation jusqu’au {date(d.livrableLe)}
                            </span>
                          ) : d.statut === "PAYEE" ? (
                            <span className="text-xs font-medium text-success">
                              maintenant
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {(d.montantCents / 100).toFixed(2).replace(".", ",")} €
                        </TableCell>
                        <TableCell className="text-right">
                          <ActionsAttestation
                            id={d.id}
                            statut={d.statut}
                            bloqueeJusquA={attend ? d.livrableLe ?? null : null}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
