// Compte : profil / paramètres + gestion des sous-comptes (membres & invitations).
import type { Metadata } from "next";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { requireSession, fetchApi } from "../../../_shared/server";
import { PageHeader, SectionTitle } from "../../../_shared/ui";
import { ProfileForm } from "../../../_shared/ProfileForm";
import { CvManager } from "../../../_shared/CvManager";
import { UnitsManager } from "../../../_shared/UnitsManager";
import { MembersManager } from "../../../_shared/MembersManager";
import { InviteMemberModal } from "../../../_shared/modals/InviteMemberModal";
import { ACCOUNT_ROLE_LABEL } from "../../../_shared/format";
import type { Invitation, Membership, Profile } from "../../../_shared/types";

export const metadata: Metadata = { title: "Mon compte · Les Extras" };

export default async function AccountPage() {
  const session = await requireSession();
  const isFreelance = session.account.type === "FREELANCE";
  const canManage = session.account.role === "OWNER" || session.account.role === "ADMIN";
  const accountId = session.account.id;

  const [profileRes, membersRes, invitesRes] = await Promise.all([
    fetchApi<{ user: typeof session.user & { phone?: string | null }; profile?: Profile | null }>(
      session,
      "/users/me",
    ),
    fetchApi<Membership[]>(session, `/memberships`),
    fetchApi<Invitation[]>(session, `/invitations?status=PENDING`),
  ]);

  const user = profileRes.data?.user ?? session.user;
  const profile = profileRes.data?.profile ?? null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mon compte"
        subtitle={`${session.account.name} · Votre rôle : ${ACCOUNT_ROLE_LABEL[session.account.role]}`}
      />

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile">Profil</TabsTrigger>
          <TabsTrigger value="team">
            Équipe
            {membersRes.data ? (
              <Badge variant="secondary" className="ml-2">
                {membersRes.data.length}
              </Badge>
            ) : null}
          </TabsTrigger>
          <TabsTrigger value="settings">Paramètres</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <ProfileForm
            user={user as any}
            profile={profile}
            isFreelance={isFreelance}
            accountId={accountId}
          />
          {isFreelance ? (
            <div className="mt-6 space-y-2">
              <SectionTitle title="Mon CV" />
              <p className="text-sm text-muted-foreground">
                Diplômes et expériences visibles par les établissements qui consultent votre profil.
              </p>
              <CvManager accountId={accountId} />
            </div>
          ) : null}
        </TabsContent>

        <TabsContent value="team" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Membres du compte</h2>
              <p className="text-sm text-muted-foreground">
                Gérez les sous-comptes et les invitations de {session.account.name}.
              </p>
            </div>
            {canManage ? <InviteMemberModal accountId={accountId} /> : null}
          </div>
          <MembersManager
            accountId={accountId}
            currentUserId={session.user.id}
            canManage={canManage}
            members={membersRes.data ?? []}
            invitations={invitesRes.data ?? []}
          />
          {!canManage ? (
            <p className="text-xs text-muted-foreground">
              Seuls les propriétaires et administrateurs peuvent modifier l'équipe.
            </p>
          ) : null}
          {!isFreelance ? (
            <div className="pt-2">
              <UnitsManager accountId={accountId} canManage={canManage} />
            </div>
          ) : null}
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <SectionTitle title="Préférences" />
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div>
                  <p className="font-medium text-foreground">Notifications email</p>
                  <p>Recevez un email pour chaque candidature ou réservation.</p>
                </div>
                <Badge variant="outline">Activé</Badge>
              </div>
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div>
                  <p className="font-medium text-foreground">Compte actif</p>
                  <p>{session.account.name}</p>
                </div>
                <Badge>{session.account.type === "ESTABLISHMENT" ? "Établissement" : "Freelance"}</Badge>
              </div>
              <div>
                <p className="font-medium text-destructive">Zone de danger</p>
                <p>La suppression du compte est irréversible. Contactez le support.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
