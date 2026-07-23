// Annuaire public des établissements partenaires.
import type { Metadata } from "next";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { fetchPublic } from "../../_shared/server";
import { PageHeader, EmptyState } from "../../_shared/ui";
import { initials } from "../../_shared/format";
import type { Account } from "../../_shared/types";

export const metadata: Metadata = { title: "Établissements · Les Extras" };

interface EstablishmentCard extends Account {
  openMissions?: number;
}

export default async function EtablissementsPage() {
  const { data } = await fetchPublic<EstablishmentCard[]>("/etablissements");
  const list = data ?? [];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Nos établissements partenaires"
        subtitle="MECS, IME, ITEP, EHPAD, SESSAD… découvrez les structures qui recrutent des renforts."
      />

      {list.length === 0 ? (
        <EmptyState title="Annuaire en construction" description="Les établissements partenaires apparaîtront ici prochainement." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((e) => (
            <Card key={e.id} className="transition-shadow hover:shadow-md">
              <CardContent className="space-y-3 p-5">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={e.logoUrl ?? undefined} />
                    <AvatarFallback>{initials(e.name)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="truncate font-medium text-foreground">{e.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {e.city ?? ""} {e.postalCode ? `(${e.postalCode})` : ""}
                    </p>
                  </div>
                </div>
                {e.openMissions ? (
                  <Badge variant="secondary">{e.openMissions} renfort(s) ouvert(s)</Badge>
                ) : (
                  <Badge variant="outline">Partenaire</Badge>
                )}
                <div className="pt-1">
                  <Link
                    href={`/etablissements/${e.slug ?? e.id}`}
                    className="text-sm text-primary hover:underline"
                  >
                    Voir la structure →
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
