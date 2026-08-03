"use client";

// L'ÉQUIPE — la liste des personnes rattachées à l'établissement.
//
// C'est l'écran qui remplace le mur. Trois principes le gouvernent :
//
//  1. On cherche avant de faire défiler. La recherche et les filtres partent
//     au serveur ; la taille de la structure n'a plus d'effet sur l'affichage.
//  2. Une personne est un objet, pas une ligne de tableau. Chaque ligne mène
//     à SA fiche, où l'on trouve ses pièces, son service, ses contrats.
//     Le coffre-fort n'est plus une page à part : c'est une colonne ici et un
//     onglet là-bas.
//  3. On dit ce qu'on voit : interne ou externe, quel service, quel rôle,
//     et où en est le dossier. Un responsable ne devrait jamais avoir à
//     deviner s'il parle à son salarié ou à un prestataire.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Search,
  Users,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  ShieldAlert,
  Building2,
  Briefcase,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiRequest } from "@/lib/api";
import { EmptyState } from "./ui";
import { ACCOUNT_ROLE_LABEL, fullName, initials } from "./format";

export interface MembreListe {
  id: string;
  role: string;
  status: string;
  orgUnitId: string | null;
  orgUnit: { id: string; name: string } | null;
  user: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    avatarUrl: string | null;
    job: string | null;
  };
  externe: boolean;
  compteIntervenantId: string | null;
  conformite: { total: number; valid: number; pct: number; expiringSoon: number; missing: number } | null;
}

export interface PageMembres {
  items: MembreListe[];
  total: number;
  page: number;
  perPage: number;
  pages: number;
}

export interface Repartition {
  total: number;
  sansService: number;
  services: { id: string; name: string; membres: number }[];
}

const TOUS = "__tous__";

/** Pastille de conformité : verte, orange ou rouge, avec le compte à l'appui. */
function PastilleConformite({ c }: { c: MembreListe["conformite"] }) {
  if (!c) return <span className="text-sm text-muted-foreground">—</span>;
  if (c.missing > 0) {
    return (
      <Badge variant="destructive" className="gap-1">
        <ShieldAlert className="h-3 w-3" />
        {c.missing} pièce{c.missing > 1 ? "s" : ""} manquante{c.missing > 1 ? "s" : ""}
      </Badge>
    );
  }
  if (c.expiringSoon > 0) {
    return (
      <Badge variant="warning" className="gap-1">
        <ShieldAlert className="h-3 w-3" />
        {c.expiringSoon} à renouveler
      </Badge>
    );
  }
  return (
    <Badge variant="success" className="gap-1">
      <ShieldCheck className="h-3 w-3" />
      Dossier complet
    </Badge>
  );
}

export function EquipeTable({
  initial,
  repartition,
}: {
  initial: PageMembres;
  repartition: Repartition;
}) {
  const router = useRouter();
  const params = useSearchParams();

  const [donnees, setDonnees] = useState(initial);
  const [q, setQ] = useState(params.get("q") ?? "");
  const [service, setService] = useState(params.get("orgUnitId") ?? TOUS);
  const [role, setRole] = useState(params.get("role") ?? TOUS);
  const [chargement, setChargement] = useState(false);
  const premierRendu = useRef(true);

  const charger = useCallback(
    async (page: number, recherche: string, unite: string, roleFiltre: string) => {
      setChargement(true);
      try {
        const p = new URLSearchParams({ page: String(page), perPage: "25" });
        if (recherche.trim()) p.set("q", recherche.trim());
        if (unite !== TOUS) p.set("orgUnitId", unite);
        if (roleFiltre !== TOUS) p.set("role", roleFiltre);
        const res = (await apiRequest(`/memberships?${p.toString()}`)) as PageMembres;
        setDonnees(res);
        // L'adresse reflète la recherche : un responsable peut envoyer
        // « les six personnes du foyer sans casier à jour » à son directeur.
        router.replace(`/dashboard/equipe?${p.toString()}`, { scroll: false });
      } finally {
        setChargement(false);
      }
    },
    [router],
  );

  // Recherche différée : on n'interroge pas le serveur à chaque frappe.
  useEffect(() => {
    if (premierRendu.current) {
      premierRendu.current = false;
      return;
    }
    const t = setTimeout(() => void charger(1, q, service, role), 350);
    return () => clearTimeout(t);
  }, [q, service, role, charger]);

  const filtre = q.trim() !== "" || service !== TOUS || role !== TOUS;
  const debut = (donnees.page - 1) * donnees.perPage + 1;
  const fin = Math.min(donnees.page * donnees.perPage, donnees.total);

  const enDefaut = useMemo(
    () => donnees.items.filter((m) => (m.conformite?.missing ?? 0) > 0).length,
    [donnees.items],
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Rechercher un nom, un prénom, un courriel…"
            className="pl-9"
            aria-label="Rechercher une personne"
          />
        </div>
        <Select value={service} onValueChange={setService}>
          <SelectTrigger className="sm:w-56">
            <SelectValue placeholder="Tous les services" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={TOUS}>Tous les services ({repartition.total})</SelectItem>
            {repartition.services.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name} ({s.membres})
              </SelectItem>
            ))}
            {repartition.sansService > 0 ? (
              <SelectItem value="sans-service">
                Sans service ({repartition.sansService})
              </SelectItem>
            ) : null}
          </SelectContent>
        </Select>
        <Select value={role} onValueChange={setRole}>
          <SelectTrigger className="sm:w-48">
            <SelectValue placeholder="Tous les rôles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={TOUS}>Tous les rôles</SelectItem>
            <SelectItem value="OWNER">Direction</SelectItem>
            <SelectItem value="ADMIN">Administration</SelectItem>
            <SelectItem value="MANAGER">Chef de service</SelectItem>
            <SelectItem value="MEMBER">Équipe</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {donnees.items.length === 0 ? (
        <EmptyState
          icon={<Users className="h-5 w-5" />}
          title={filtre ? "Personne ne correspond" : "Aucun membre"}
          description={
            filtre
              ? "Aucune personne ne correspond à cette recherche. Essayez un autre nom ou élargissez le filtre."
              : "Invitez vos collègues pour qu’ils rejoignent l’établissement."
          }
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Personne</TableHead>
                  <TableHead className="hidden md:table-cell">Service</TableHead>
                  <TableHead className="hidden lg:table-cell">Rôle</TableHead>
                  <TableHead>Dossier</TableHead>
                  <TableHead className="text-right">Fiche</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {donnees.items.map((m) => (
                  <TableRow key={m.id} className={chargement ? "opacity-60" : undefined}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={m.user.avatarUrl ?? undefined} alt="" />
                          <AvatarFallback>
                            {initials(m.user.firstName, m.user.lastName)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <Link
                            href={`/dashboard/equipe/${m.user.id}`}
                            className="font-medium text-foreground hover:underline"
                          >
                            {fullName(m.user.firstName, m.user.lastName) || m.user.email}
                          </Link>
                          <p className="flex items-center gap-1.5 truncate text-xs text-muted-foreground">
                            {m.externe ? (
                              <>
                                <Briefcase className="h-3 w-3" />
                                Intervenant indépendant
                              </>
                            ) : (
                              <>
                                <Building2 className="h-3 w-3" />
                                Salarié de la structure
                              </>
                            )}
                            {m.user.job ? ` · ${m.user.job}` : null}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {m.orgUnit ? (
                        <Badge variant="soft">{m.orgUnit.name}</Badge>
                      ) : (
                        <span className="text-sm text-muted-foreground">Non rattaché</span>
                      )}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <span className="text-sm text-foreground">
                        {ACCOUNT_ROLE_LABEL[m.role] ?? m.role}
                      </span>
                    </TableCell>
                    <TableCell>
                      <PastilleConformite c={m.conformite} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/dashboard/equipe/${m.user.id}`}>Ouvrir</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          {donnees.total === 0
            ? "Aucun résultat"
            : `${debut}–${fin} sur ${donnees.total} personne${donnees.total > 1 ? "s" : ""}`}
          {enDefaut > 0 ? ` · ${enDefaut} dossier${enDefaut > 1 ? "s" : ""} incomplet${enDefaut > 1 ? "s" : ""} sur cette page` : null}
        </p>
        {donnees.pages > 1 ? (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={donnees.page <= 1 || chargement}
              onClick={() => void charger(donnees.page - 1, q, service, role)}
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
              onClick={() => void charger(donnees.page + 1, q, service, role)}
            >
              Suivant
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
