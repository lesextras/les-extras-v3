// Back-office ADMIN : KPIs plateforme, modération des offres, gestion des users.
import type { Metadata } from "next";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireAdmin, fetchApi } from "../../_shared/server";
import { PageHeader, StatCard, EmptyState } from "../../_shared/ui";
import { ModerateMissionActions, UserStatusActions } from "../../_shared/AdminActions";
import {
  MISSION_CATEGORY_LABEL,
  MISSION_STATUS_LABEL,
  missionBadgeVariant,
  formatDate,
  fullName,
  initials,
} from "../../_shared/format";
import type { Mission, PublicUser } from "../../_shared/types";

export const metadata: Metadata = { title: "Administration · Les Extras" };

interface AdminStats {
  users?: number;
  establishments?: number;
  freelances?: number;
  pendingMissions?: number;
  activeMissions?: number;
}

interface AdminUser extends PublicUser {
  email?: string;
  role?: string;
  status?: string;
  createdAt?: string;
}

export default async function AdminPage() {
  const session = await requireAdmin();
  const accountId = session.account.id;

  const [stats, pending, users] = await Promise.all([
    fetchApi<AdminStats>(session, "/admin/stats"),
    fetchApi<Mission[]>(session, "/admin/missions?moderation=pending"),
    fetchApi<AdminUser[]>(session, "/admin/users"),
  ]);

  const s = stats.data ?? {};

  return (
    <div className="space-y-8">
      <PageHeader title="Administration" subtitle="Modération des offres et gestion des utilisateurs." />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard label="Utilisateurs" value={s.users ?? 0} accent="teal" />
        <StatCard label="Établissements" value={s.establishments ?? 0} />
        <StatCard label="Freelances" value={s.freelances ?? 0} />
        <StatCard label="Offres à modérer" value={s.pendingMissions ?? pending.data?.length ?? 0} accent="terracotta" />
        <StatCard label="Missions actives" value={s.activeMissions ?? 0} />
      </div>

      <Tabs defaultValue="moderation" className="space-y-6">
        <TabsList>
          <TabsTrigger value="moderation">
            Modération
            {pending.data && pending.data.length > 0 ? (
              <Badge variant="secondary" className="ml-2">
                {pending.data.length}
              </Badge>
            ) : null}
          </TabsTrigger>
          <TabsTrigger value="users">Utilisateurs</TabsTrigger>
        </TabsList>

        <TabsContent value="moderation" className="space-y-4">
          {!pending.data || pending.data.length === 0 ? (
            <EmptyState title="Rien à modérer" description="Aucune offre en attente de validation." />
          ) : (
            <div className="space-y-3">
              {pending.data.map((m) => (
                <Card key={m.id}>
                  <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant={missionBadgeVariant(m.status)}>
                          {MISSION_STATUS_LABEL[m.status]}
                        </Badge>
                        <Badge variant="outline">{MISSION_CATEGORY_LABEL[m.category]}</Badge>
                      </div>
                      <p className="truncate text-sm font-medium text-foreground">{m.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {m.account?.name ?? "Établissement"} · {formatDate(m.startDate)}
                      </p>
                    </div>
                    <ModerateMissionActions missionId={m.id} accountId={accountId} />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="users">
          {!users.data || users.data.length === 0 ? (
            <EmptyState title="Aucun utilisateur" />
          ) : (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Utilisateur</TableHead>
                      <TableHead>Rôle</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Inscrit le</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.data.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={u.avatarUrl ?? undefined} />
                              <AvatarFallback>{initials(u.firstName, u.lastName)}</AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-foreground">
                                {fullName(u.firstName, u.lastName)}
                              </p>
                              <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={u.role === "ADMIN" ? "default" : "outline"}>
                            {u.role ?? "USER"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={u.status === "BANNED" ? "destructive" : "secondary"}>
                            {u.status ?? "PENDING"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {formatDate(u.createdAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          {u.role !== "ADMIN" ? (
                            <UserStatusActions userId={u.id} status={u.status ?? "PENDING"} accountId={accountId} />
                          ) : null}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
