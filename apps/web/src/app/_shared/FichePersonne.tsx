"use client";

// LA FICHE D'UNE PERSONNE.
//
// C'est le changement de fond demandé : la conformité n'est plus un écran où
// tout le monde est empilé, c'est une propriété de quelqu'un. On ouvre une
// personne, et on voit sa place dans la structure, son dossier, ses contrats.
// Quand l'établissement comptera trois cents personnes, cet écran-ci ne
// changera pas de taille — seule la liste qui y mène pagine.
import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Briefcase,
  Building2,
  FileSignature,
  Mail,
  ShieldCheck,
  ShieldAlert,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { apiRequest } from "@/lib/api";
import { MemberDocuments } from "./ComplianceManager";
import { Field } from "./form-fields";
import {
  ACCOUNT_ROLE_DESCRIPTION,
  ACCOUNT_ROLE_LABEL,
  formatDate,
  fullName,
  initials,
} from "./format";
import type { MembreListe } from "./EquipeTable";

const SANS_SERVICE = "__aucun__";
const ROLES_ATTRIBUABLES = ["ADMIN", "MANAGER", "MEMBER"] as const;

export interface ContratResume {
  id: string;
  statut: string;
  poste: string | null;
  dateDebut: string;
  dateFin: string | null;
}

export function FichePersonne({
  membre,
  accountId,
  services,
  contrats,
  canManage,
  estMoiMeme,
}: {
  membre: MembreListe;
  accountId: string;
  services: { id: string; name: string }[];
  contrats: ContratResume[];
  canManage: boolean;
  estMoiMeme: boolean;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [, startTransition] = useTransition();
  const [service, setService] = useState(membre.orgUnitId ?? SANS_SERVICE);
  const [role, setRole] = useState(membre.role);
  const [occupe, setOccupe] = useState(false);

  const nom = fullName(membre.user.firstName, membre.user.lastName) || membre.user.email;
  const c = membre.conformite;

  async function agir(action: () => Promise<unknown>, message: string) {
    setOccupe(true);
    try {
      await action();
      toast({ title: message });
      startTransition(() => router.refresh());
    } catch (err) {
      toast({
        title: "Action impossible",
        description: err instanceof Error ? err.message : undefined,
        variant: "error",
      });
    } finally {
      setOccupe(false);
    }
  }

  const changerService = (valeur: string) => {
    setService(valeur);
    void agir(
      () =>
        apiRequest("/units/assign", {
          method: "POST",
          body: { membershipId: membre.id, unitId: valeur === SANS_SERVICE ? null : valeur },
          accountId,
        }),
      valeur === SANS_SERVICE ? "Détaché du service" : "Rattaché au service",
    );
  };

  const changerRole = (valeur: string) => {
    setRole(valeur);
    void agir(
      () =>
        apiRequest(`/memberships/${membre.id}/role`, {
          method: "PATCH",
          body: { role: valeur },
          accountId,
        }),
      "Rôle modifié",
    );
  };

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="gap-2">
        <Link href="/dashboard/equipe">
          <ArrowLeft className="h-4 w-4" />
          Toute l’équipe
        </Link>
      </Button>

      <Card>
        <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="h-14 w-14">
              <AvatarImage src={membre.user.avatarUrl ?? undefined} alt="" />
              <AvatarFallback className="text-lg">
                {initials(membre.user.firstName, membre.user.lastName)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 space-y-1">
              <h2 className="text-xl font-semibold text-foreground">{nom}</h2>
              <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5" />
                  {membre.user.email}
                </span>
                {membre.user.job ? <span>{membre.user.job}</span> : null}
              </p>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <Badge variant={membre.externe ? "warning" : "soft"} className="gap-1">
                  {membre.externe ? (
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
                </Badge>
                <Badge variant="outline">{ACCOUNT_ROLE_LABEL[membre.role] ?? membre.role}</Badge>
                {membre.orgUnit ? <Badge variant="muted">{membre.orgUnit.name}</Badge> : null}
              </div>
            </div>
          </div>

          {c ? (
            <div className="shrink-0 rounded-lg border border-border bg-muted/40 p-4 text-center">
              {c.missing > 0 ? (
                <ShieldAlert className="mx-auto h-5 w-5 text-destructive" />
              ) : c.expiringSoon > 0 ? (
                <ShieldAlert className="mx-auto h-5 w-5 text-warning-foreground" />
              ) : (
                <ShieldCheck className="mx-auto h-5 w-5 text-success" />
              )}
              <p className="mt-1 text-2xl font-semibold text-foreground">{c.pct} %</p>
              <p className="text-xs text-muted-foreground">
                {c.valid} pièce{c.valid > 1 ? "s" : ""} sur {c.total}
              </p>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {membre.externe ? (
        <Card className="border-warning/40 bg-warning/5">
          <CardContent className="flex gap-3 p-4">
            <Briefcase className="mt-0.5 h-4 w-4 shrink-0 text-warning-foreground" />
            <p className="text-sm text-muted-foreground">
              Cette personne possède aussi un compte d’intervenant indépendant. Selon le cadre de
              son intervention, elle relève soit d’un contrat de travail avec votre établissement,
              soit d’une prestation qu’elle facture. Les deux ne se mélangent pas : si elle
              intervient dans vos horaires, vos locaux et sous votre encadrement, c’est un contrat
              de travail qui s’impose.
            </p>
          </CardContent>
        </Card>
      ) : null}

      <Tabs defaultValue="place" className="space-y-4">
        <TabsList>
          <TabsTrigger value="place">Sa place</TabsTrigger>
          <TabsTrigger value="dossier">
            Dossier
            {c && c.missing > 0 ? (
              <Badge variant="destructive" className="ml-2">
                {c.missing}
              </Badge>
            ) : null}
          </TabsTrigger>
          <TabsTrigger value="contrats">
            Contrats
            {contrats.length > 0 ? (
              <Badge variant="secondary" className="ml-2">
                {contrats.length}
              </Badge>
            ) : null}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="place">
          <Card>
            <CardContent className="space-y-5 p-5">
              <Field
                label="Service"
                hint="Rattacher quelqu’un à un service, c’est le faire apparaître dans le planning et les compteurs de son chef de service."
              >
                <Select
                  value={service}
                  onValueChange={changerService}
                  disabled={!canManage || occupe}
                >
                  <SelectTrigger className="sm:w-80">
                    <SelectValue placeholder="Non rattaché" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={SANS_SERVICE}>Non rattaché</SelectItem>
                    {services.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field label="Rôle dans l’établissement" hint={ACCOUNT_ROLE_DESCRIPTION[role]}>
                <Select
                  value={role}
                  onValueChange={changerRole}
                  disabled={!canManage || occupe || membre.role === "OWNER" || estMoiMeme}
                >
                  <SelectTrigger className="sm:w-80">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {membre.role === "OWNER" ? (
                      <SelectItem value="OWNER">{ACCOUNT_ROLE_LABEL.OWNER}</SelectItem>
                    ) : null}
                    {ROLES_ATTRIBUABLES.map((r) => (
                      <SelectItem key={r} value={r}>
                        {ACCOUNT_ROLE_LABEL[r]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              {membre.role === "OWNER" ? (
                <p className="text-xs text-muted-foreground">
                  Le rôle de la direction ne se modifie pas depuis cet écran.
                </p>
              ) : null}
              {estMoiMeme ? (
                <p className="text-xs text-muted-foreground">
                  Vous ne pouvez pas changer votre propre rôle.
                </p>
              ) : null}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dossier">
          <Card>
            <CardContent className="p-5">
              <MemberDocuments
                userId={membre.user.id}
                accountId={accountId}
                canEdit={canManage}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contrats">
          <Card>
            <CardContent className="p-5">
              {contrats.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  Aucun contrat conclu avec cette personne.
                </p>
              ) : (
                <ul className="divide-y divide-border">
                  {contrats.map((ct) => (
                    <li key={ct.id} className="flex items-center justify-between gap-3 py-3">
                      <div className="min-w-0">
                        <p className="truncate font-medium text-foreground">
                          {ct.poste ?? "Poste à préciser"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Du {formatDate(ct.dateDebut)}
                          {ct.dateFin ? ` au ${formatDate(ct.dateFin)}` : " (terme imprécis)"}
                        </p>
                      </div>
                      <Button asChild variant="ghost" size="sm" className="shrink-0 gap-2">
                        <Link href={`/dashboard/contrats/${ct.id}`}>
                          <FileSignature className="h-4 w-4" />
                          Ouvrir
                        </Link>
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
