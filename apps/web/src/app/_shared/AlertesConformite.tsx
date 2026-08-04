"use client";

// QUI N'EST PAS EN RÈGLE — et pour quoi.
//
// L'ancien écran listait tout le monde, du plus conforme au moins conforme,
// et laissait chercher. Ce n'est pas la question qu'on se pose en ouvrant
// cette page : on l'ouvre parce qu'on veut savoir qui bloque. On ne montre
// donc que les dossiers en défaut, le plus urgent en tête, et une pièce
// manquante pèse plus lourd qu'une pièce qui expire bientôt.
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  ShieldAlert,
  Clock,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiRequest } from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { EmptyState, StatCard } from "./ui";
import { ACCOUNT_ROLE_LABEL, fullName, initials } from "./format";
import type { Repartition } from "./EquipeTable";

const TOUS = "__tous__";

export interface LigneAlerte {
  user: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    avatarUrl: string | null;
    job: string | null;
  };
  membershipRole: string;
  orgUnit: { id: string; name: string } | null;
  completeness: { total: number; valid: number; pct: number; expiringSoon: number; missing: number };
  urgence: number;
}

export interface PageAlertes {
  items: LigneAlerte[];
  total: number;
  page: number;
  perPage: number;
  pages: number;
  membresActifs: number;
  requiredTypes: string[];
}

export function AlertesConformite({
  initial,
  repartition,
}: {
  initial: PageAlertes;
  repartition: Repartition;
}) {
  const { toast } = useToast();
  const [donnees, setDonnees] = useState(initial);
  const [service, setService] = useState(TOUS);
  const [chargement, setChargement] = useState(false);
  const premierRendu = useRef(true);

  const charger = useCallback(
    async (page: number, unite: string) => {
      setChargement(true);
      try {
        const p = new URLSearchParams({ page: String(page), perPage: "25" });
        if (unite !== TOUS) p.set("orgUnitId", unite);
        setDonnees((await apiRequest(`/conformite/alertes?${p.toString()}`)) as PageAlertes);
      } catch (err) {
        // Sans ce toast, un filtre qui échoue laissait l'écran figé sur les
        // anciennes données, sans un mot : on croyait le service vide.
        toast({
          title: "Chargement impossible",
          description: err instanceof Error ? err.message : "Réessayez dans un instant.",
          variant: "error",
        });
      } finally {
        setChargement(false);
      }
    },
    [toast],
  );

  useEffect(() => {
    if (premierRendu.current) {
      premierRendu.current = false;
      return;
    }
    void charger(1, service);
  }, [service, charger]);

  const conformes = Math.max(0, donnees.membresActifs - donnees.total);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Dossiers complets"
          value={conformes}
          hint={`sur ${donnees.membresActifs} personne${donnees.membresActifs > 1 ? "s" : ""} active${donnees.membresActifs > 1 ? "s" : ""}`}
          icon={<ShieldCheck className="h-4 w-4" />}
          accent="teal"
        />
        <StatCard
          label="Dossiers en défaut"
          value={donnees.total}
          hint="pièce manquante ou proche de l'échéance"
          icon={<ShieldAlert className="h-4 w-4" />}
          accent={donnees.total > 0 ? "warning" : "neutral"}
        />
        <StatCard
          label="Pièces suivies"
          value={donnees.requiredTypes.length}
          hint="par personne, dont le casier judiciaire"
          icon={<Clock className="h-4 w-4" />}
          accent="neutral"
        />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-sm font-medium text-muted-foreground">
          Les dossiers à traiter, du plus urgent au moins urgent
        </h2>
        <Select value={service} onValueChange={setService}>
          <SelectTrigger className="sm:w-64">
            <SelectValue placeholder="Tous les services" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={TOUS}>Tous les services</SelectItem>
            {repartition.services.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name} ({s.membres})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {donnees.items.length === 0 ? (
        <EmptyState
          icon={<ShieldCheck className="h-5 w-5" />}
          title="Tous les dossiers sont à jour"
          description="Aucune pièce obligatoire ne manque et aucune n'arrive à échéance dans les deux mois. Rien à faire aujourd'hui."
        />
      ) : (
        <div className="space-y-2">
          {donnees.items.map((l) => (
            <Card
              key={l.user.id}
              className={chargement ? "opacity-60" : "transition-colors hover:border-primary/40"}
            >
              <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={l.user.avatarUrl ?? undefined} alt="" />
                    <AvatarFallback>
                      {initials(l.user.firstName, l.user.lastName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <Link
                      href={`/dashboard/equipe/${l.user.id}`}
                      className="font-medium text-foreground hover:underline"
                    >
                      {fullName(l.user.firstName, l.user.lastName) || l.user.email}
                    </Link>
                    <p className="truncate text-xs text-muted-foreground">
                      {ACCOUNT_ROLE_LABEL[l.membershipRole] ?? l.membershipRole}
                      {l.orgUnit ? ` · ${l.orgUnit.name}` : " · non rattaché"}
                      {l.user.job ? ` · ${l.user.job}` : ""}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  {l.completeness.missing > 0 ? (
                    <Badge variant="destructive">
                      {l.completeness.missing} manquante
                      {l.completeness.missing > 1 ? "s" : ""}
                    </Badge>
                  ) : null}
                  {l.completeness.expiringSoon > 0 ? (
                    <Badge variant="warning">
                      {l.completeness.expiringSoon} à renouveler
                    </Badge>
                  ) : null}
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/dashboard/equipe/${l.user.id}`}>Ouvrir le dossier</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {donnees.pages > 1 ? (
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={donnees.page <= 1 || chargement}
            onClick={() => void charger(donnees.page - 1, service)}
          >
            <ChevronLeft className="h-4 w-4" />
            Précédent
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {donnees.page} / {donnees.pages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={donnees.page >= donnees.pages || chargement}
            onClick={() => void charger(donnees.page + 1, service)}
          >
            Suivant
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      ) : null}
    </div>
  );
}
