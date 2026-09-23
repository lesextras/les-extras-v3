"use client";

// LA FICHE D'UNE PERSONNE — version « un compte = une personne » (23/09/2026).
//
// Il n'y a plus de service à lui attribuer, plus de rôle à lui donner, plus de
// niveau à valider : Les Extras ne gère pas la hiérarchie interne d'une
// structure. Ce qui reste, c'est ce qui sert à travailler avec quelqu'un :
// qui c'est, l'état de son dossier de conformité, et les contrats conclus.
import Link from "next/link";
import { ArrowLeft, Briefcase, FileSignature, Mail, ShieldAlert, ShieldCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MemberDocuments } from "./ComplianceManager";
import { formatDate, fullName, initials } from "./format";
import type { MembreListe } from "./EquipeTable";

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
  contrats,
  canManage,
  estMoiMeme,
}: {
  membre: MembreListe;
  accountId: string;
  contrats: ContratResume[];
  canManage: boolean;
  estMoiMeme: boolean;
}) {
  const nom = fullName(membre.user.firstName, membre.user.lastName) || membre.user.email;
  const c = membre.conformite;
  const dossierComplet = c ? c.missing === 0 && c.expiringSoon === 0 : false;

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="gap-2">
        <Link href="/dashboard/equipe">
          <ArrowLeft className="h-4 w-4" />
          Toute l&apos;équipe
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
              <h2 className="text-xl font-semibold text-foreground">
                {nom}
                {estMoiMeme ? (
                  <span className="ml-2 text-sm font-normal text-muted-foreground">(vous)</span>
                ) : null}
              </h2>
              <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Mail className="h-3.5 w-3.5" />
                  {membre.user.email}
                </span>
                {membre.user.job ? (
                  <span className="flex items-center gap-1">
                    <Briefcase className="h-3.5 w-3.5" />
                    {membre.user.job}
                  </span>
                ) : null}
                {membre.externe ? <Badge variant="outline">Intervenant extérieur</Badge> : null}
              </p>
            </div>
          </div>
          {c ? (
            <div className="shrink-0 text-right">
              {dossierComplet ? (
                <Badge variant="success" className="gap-1">
                  <ShieldCheck className="h-3 w-3" />
                  Dossier complet
                </Badge>
              ) : (
                <Badge variant={c.missing > 0 ? "destructive" : "warning"} className="gap-1">
                  <ShieldAlert className="h-3 w-3" />
                  {c.missing > 0
                    ? `${c.missing} pièce${c.missing > 1 ? "s" : ""} manquante${c.missing > 1 ? "s" : ""}`
                    : "À renouveler"}
                </Badge>
              )}
              <p className="mt-1 text-xs text-muted-foreground">
                {c.valid} pièce{c.valid > 1 ? "s" : ""} sur {c.total} vérifiée{c.valid > 1 ? "s" : ""}
              </p>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Tabs defaultValue="dossier">
        <TabsList>
          <TabsTrigger value="dossier">Dossier</TabsTrigger>
          <TabsTrigger value="contrats">
            Contrats{contrats.length > 0 ? ` (${contrats.length})` : ""}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dossier">
          <Card>
            <CardContent className="p-5">
              <p className="mb-3 text-sm text-muted-foreground">
                La personne dépose ses pièces, vous les vérifiez. Une note de lecture automatique
                vous indique où regarder ; la validation reste votre décision.
              </p>
              <MemberDocuments userId={membre.user.id} accountId={accountId} canEdit={canManage} />
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
