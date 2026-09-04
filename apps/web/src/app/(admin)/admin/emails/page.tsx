// Back-office ADMIN — suivi des e-mails.
//
// POURQUOI CET ÉCRAN (03/09/2026). Cinq envois partent tout seuls : la
// confirmation d'adresse et le message de bienvenue à l'inscription, l'alerte
// à l'association, l'activation du lendemain, le tunnel d'accueil tous les
// trois jours et le rendez-vous du lundi. `MailService.send()` ne lève jamais
// — c'est ce qui empêche un serveur de messagerie lent de faire échouer une
// inscription — mais l'effet de bord était qu'un envoi raté ne se voyait
// NULLE PART, sinon dans les journaux du conteneur.
//
// Source : GET /admin/emails.
//
// ⚠ Le journal des envois vit en mémoire du serveur : il repart à zéro à
// chaque redéploiement. Il répond à « est-ce que ça part en ce moment ? »,
// pas à « qu'est-ce qui est parti le mois dernier ». L'avancement du tunnel,
// lui, est lu en base et ne se perd pas.
import type { Metadata } from "next";
import { AlertTriangle, CheckCircle2, Clock, Mail, MailX, Send, Users } from "lucide-react";
import { requireAdmin, fetchApi } from "../../../_shared/server";
import { PageHeader, StatCard, ErrorState, EmptyState, SectionTitle } from "../../../_shared/ui";
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
import { formatDateTime } from "../../../_shared/format";

export const metadata: Metadata = { title: "Suivi des e-mails · Administration" };

interface LigneJournal {
  date: string;
  destinataire: string;
  sujet: string;
  voie: "smtp" | "brevo" | "aucune";
  ok: boolean;
  erreur?: string;
}

interface Recent {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  createdAt: string;
  emailVerified: boolean;
  hebdoOptIn: boolean;
  activationMailAt?: string | null;
  tunnelEtape: number;
  tunnelDernierAt?: string | null;
}

interface Suivi {
  envois: {
    depuis: string;
    transport:
      | { voie: "smtp"; hote: string; port: number; boite: string }
      | { voie: "brevo" }
      | { voie: "aucune" };
    expediteur: { name: string; email: string };
    envoyes: number;
    echecs: number;
    sansTransport: number;
    derniers: LigneJournal[];
  };
  tunnel: {
    parEtape: { etape: number; comptes: number }[];
    envoyes7j: number;
    aVenir: number;
    optOut: number;
    nonConfirmes: number;
  };
  recents: Recent[];
}

/** Les six messages, dans l'ordre. Doit suivre `TUNNEL_ACCUEIL` côté API. */
const ETAPES = [
  "Pas encore commencé",
  "1, Les quatre fonctions",
  "2, Les premières minutes d’une crise",
  "3, L’enfant qui dit non",
  "4, Demander plutôt que crier",
  "5, Démarrer une tâche",
  "6, Les fiches A4 (fin)",
];

export default async function AdminEmailsPage() {
  const session = await requireAdmin();
  const { data, error } = await fetchApi<Suivi>(session, "/admin/emails");

  if (error || !data) {
    return (
      <div className="space-y-6">
        <PageHeader title="Suivi des e-mails" subtitle="Ce qui part, et ce qui ne part pas." />
        <ErrorState
          title="Le suivi des e-mails est momentanément indisponible"
          description="Réessayez dans un instant."
        />
      </div>
    );
  }

  const { envois, tunnel, recents } = data;
  const transportOk = envois.transport.voie === "smtp";
  const totalTente = envois.envoyes + envois.echecs + envois.sansTransport;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Suivi des e-mails"
        subtitle="Ce qui part, ce qui échoue, et où en sont les inscrits dans la séquence d’accueil."
      />

      {/* L'ÉTAT DU TRANSPORT EN PREMIER : si le SMTP n'est pas configuré,
          tout le reste de l'écran ne veut rien dire. */}
      {!transportOk ? (
        <Card className="border-warning/40 bg-warning/5">
          <CardContent className="flex items-start gap-3 p-5">
            <AlertTriangle className="mt-0.5 size-5 shrink-0 text-warning" />
            <div className="text-sm">
              <p className="font-semibold text-foreground">
                {envois.transport.voie === "brevo"
                  ? "Les messages partent par Brevo, pas par le SMTP du domaine"
                  : "Aucun serveur d’envoi n’est configuré"}
              </p>
              <p className="mt-1 leading-relaxed text-muted-foreground">
                {envois.transport.voie === "brevo"
                  ? "L’enregistrement SPF du domaine n’autorise que Hostinger : les messages émis par Brevo échouent l’authentification et sont écartés silencieusement par une partie des boîtes. Il faut renseigner SMTP_HOST, SMTP_USER et SMTP_PASSWORD."
                  : "Les messages ne sont pas envoyés : ils sont seulement écrits dans les journaux. Renseignez SMTP_HOST, SMTP_USER et SMTP_PASSWORD."}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Envoyés"
          value={envois.envoyes}
          icon={<Send className="size-4" />}
          hint="depuis le dernier redémarrage"
        />
        <StatCard
          label="Échecs"
          value={envois.echecs + envois.sansTransport}
          icon={<MailX className="size-4" />}
          hint={totalTente > 0 ? `sur ${totalTente} tentatives` : "aucune tentative"}
        />
        <StatCard
          label="Dans la séquence"
          value={tunnel.aVenir}
          icon={<Users className="size-4" />}
          hint="comptes qui recevront encore un message"
        />
        <StatCard
          label="Envois du tunnel"
          value={tunnel.envoyes7j}
          icon={<Mail className="size-4" />}
          hint="ces sept derniers jours"
        />
      </div>

      <Card>
        <CardContent className="grid gap-x-8 gap-y-2 p-5 text-sm sm:grid-cols-2">
          <p className="flex justify-between gap-4">
            <span className="text-muted-foreground">Expéditeur</span>
            <span className="font-medium text-foreground">{envois.expediteur.email}</span>
          </p>
          <p className="flex justify-between gap-4">
            <span className="text-muted-foreground">Transport</span>
            <span className="font-medium text-foreground">
              {envois.transport.voie === "smtp"
                ? `${envois.transport.hote}:${envois.transport.port}`
                : envois.transport.voie === "brevo"
                  ? "API Brevo (repli)"
                  : "aucun"}
            </span>
          </p>
          <p className="flex justify-between gap-4">
            <span className="text-muted-foreground">Compteurs depuis</span>
            <span className="font-medium text-foreground">{formatDateTime(envois.depuis)}</span>
          </p>
          <p className="flex justify-between gap-4">
            <span className="text-muted-foreground">Désabonnés</span>
            <span className="font-medium text-foreground">{tunnel.optOut}</span>
          </p>
        </CardContent>
      </Card>

      {/* L'AVANCEMENT DU TUNNEL : la seule partie durable de cet écran. */}
      <section className="space-y-3">
        <SectionTitle>Où en sont les inscrits</SectionTitle>
        <Card>
          <CardContent className="space-y-2 p-5">
            {tunnel.parEtape.map((e) => {
              const total = tunnel.parEtape.reduce((s, x) => s + x.comptes, 0) || 1;
              const part = Math.round((e.comptes / total) * 100);
              return (
                <div key={e.etape} className="flex items-center gap-3 text-sm">
                  <span className="w-64 shrink-0 truncate text-muted-foreground">
                    {ETAPES[e.etape] ?? `Étape ${e.etape}`}
                  </span>
                  <span className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                    <span
                      className="block h-full rounded-full bg-primary"
                      style={{ width: `${part}%` }}
                    />
                  </span>
                  <span className="w-12 shrink-0 text-right font-medium text-foreground">
                    {e.comptes}
                  </span>
                </div>
              );
            })}
            <p className="pt-2 text-xs leading-relaxed text-muted-foreground">
              L’étape 0 réunit les comptes qui n’ont pas encore reçu le premier message :
              les inscrits de moins de trois jours, ceux dont l’adresse n’est pas confirmée
              ({tunnel.nonConfirmes} sur les trente derniers jours), les désabonnés, et tous
              les comptes créés avant la mise en service du tunnel, le planificateur ne
              remonte pas au-delà de trente jours.
            </p>
          </CardContent>
        </Card>
      </section>

      {/* LES DERNIERS INSCRITS, LIGNE À LIGNE. */}
      <section className="space-y-3">
        <SectionTitle>Les derniers inscrits</SectionTitle>
        {recents.length === 0 ? (
          <EmptyState
            title="Aucune inscription ces trente derniers jours"
            description="La séquence d’accueil ne concerne que les comptes récents."
          />
        ) : (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Compte</TableHead>
                    <TableHead>Inscrit le</TableHead>
                    <TableHead>Adresse</TableHead>
                    <TableHead>Activation</TableHead>
                    <TableHead>Tunnel</TableHead>
                    <TableHead>Dernier envoi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recents.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell>
                        <span className="block font-medium text-foreground">
                          {[u.firstName, u.lastName].filter(Boolean).join(" ") || ", "}
                        </span>
                        <span className="block text-xs text-muted-foreground">{u.email}</span>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDateTime(u.createdAt)}
                      </TableCell>
                      <TableCell>
                        {u.emailVerified ? (
                          <Badge variant="soft" className="gap-1">
                            <CheckCircle2 className="size-3" /> confirmée
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="gap-1 text-warning">
                            <Clock className="size-3" /> en attente
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {u.activationMailAt ? "traitée" : "à venir"}
                      </TableCell>
                      <TableCell className="text-sm">
                        {!u.hebdoOptIn ? (
                          <span className="text-muted-foreground">désabonné</span>
                        ) : (
                          <span className="font-medium text-foreground">{u.tunnelEtape}/6</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {u.tunnelDernierAt ? formatDateTime(u.tunnelDernierAt) : ", "}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </section>

      {/* LE JOURNAL, volatil, et c'est écrit. */}
      <section className="space-y-3">
        <SectionTitle>Les derniers envois</SectionTitle>
        {envois.derniers.length === 0 ? (
          <EmptyState
            title="Rien depuis le dernier redémarrage"
            description="Ce journal vit en mémoire du serveur : il repart à zéro à chaque déploiement. Il répond à « est-ce que ça part en ce moment ? », pas à « qu’est-ce qui est parti le mois dernier »."
          />
        ) : (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Quand</TableHead>
                    <TableHead>Destinataire</TableHead>
                    <TableHead>Sujet</TableHead>
                    <TableHead>Résultat</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {envois.derniers.map((l, i) => (
                    <TableRow key={`${l.date}-${i}`}>
                      <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                        {formatDateTime(l.date)}
                      </TableCell>
                      <TableCell className="text-sm text-foreground">{l.destinataire}</TableCell>
                      <TableCell className="max-w-[22rem] truncate text-sm text-muted-foreground">
                        {l.sujet}
                      </TableCell>
                      <TableCell>
                        {l.ok ? (
                          <Badge variant="soft" className="gap-1">
                            <CheckCircle2 className="size-3" /> {l.voie}
                          </Badge>
                        ) : (
                          <span className="block max-w-[20rem]">
                            <Badge variant="outline" className="gap-1 text-destructive">
                              <MailX className="size-3" /> échec
                            </Badge>
                            {l.erreur ? (
                              <span className="mt-1 block text-xs leading-snug text-muted-foreground">
                                {l.erreur}
                              </span>
                            ) : null}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}
