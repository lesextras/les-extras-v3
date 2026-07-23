// Hub du tableau de bord — role-based (ESTABLISHMENT vs FREELANCE).
// KPIs + widgets renforts/ateliers dans une BentoGrid.
import Link from "next/link";
import type { Metadata } from "next";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { requireSession, fetchApi } from "../../_shared/server";
import { PageHeader, StatCard, EmptyState, SectionTitle } from "../../_shared/ui";
import { MissionCard, ServiceCard, BookingRow } from "../../_shared/cards";
import { RenfortModal } from "../../_shared/modals/RenfortModal";
import { fullName } from "../../_shared/format";
import type { Booking, Mission, Service } from "../../_shared/types";

export const metadata: Metadata = { title: "Tableau de bord · Les Extras" };

interface DashStats {
  activeMissions?: number;
  applications?: number;
  upcomingBookings?: number;
  revenueMonth?: number;
  unreadMessages?: number;
  fillRate?: number;
}

export default async function DashboardPage() {
  const session = await requireSession();
  const isEstablishment = session.account.type === "ESTABLISHMENT";

  const [stats, missions, bookings, services] = await Promise.all([
    fetchApi<DashStats>(session, "/dashboard/stats"),
    fetchApi<Mission[]>(session, "/missions?scope=account&take=4"),
    fetchApi<Booking[]>(session, "/bookings?scope=account&take=5"),
    fetchApi<Service[]>(session, "/services?scope=account&take=4"),
  ]);

  const s = stats.data ?? {};

  return (
    <div className="space-y-8">
      <PageHeader
        title={(() => {
          const who = fullName(session.user.firstName, session.user.lastName);
          const name = who !== "Utilisateur" ? who : (session.account?.name ?? "");
          return name ? `Bonjour ${name}` : "Bonjour";
        })()}
        subtitle={
          isEstablishment
            ? "Pilotez vos renforts, réservations d’ateliers et votre équipe."
            : "Trouvez des missions, gérez vos ateliers et vos candidatures."
        }
        actions={
          isEstablishment ? (
            <RenfortModal accountId={session.account.id} />
          ) : (
            <Button asChild>
              <Link href="/marketplace">Explorer les missions</Link>
            </Button>
          )
        }
      />

      {/* Onboarding : guide de démarrage, masqué une fois toutes les étapes faites. */}
      {(() => {
        const hasCatalog = isEstablishment
          ? (missions.data?.length ?? 0) > 0
          : (services.data?.length ?? 0) > 0;
        const steps = [
          { done: Boolean(session.user.firstName), label: "Complétez votre profil", href: "/dashboard/account" },
          isEstablishment
            ? { done: hasCatalog, label: "Publiez votre premier SOS Renfort", href: "/dashboard/renforts" }
            : { done: hasCatalog, label: "Créez votre premier atelier", href: "/dashboard/ateliers" },
          isEstablishment
            ? { done: (session.account as { credits?: number })?.credits !== undefined && false, label: "Invitez votre équipe", href: "/dashboard/account" }
            : { done: (s.applications ?? 0) > 0, label: "Candidatez à une première mission", href: "/dashboard/opportunites" },
        ];
        const remaining = steps.filter((st) => !st.done).length;
        if (remaining === 0) return null;
        return (
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="space-y-3 p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-foreground">Prise en main — {steps.length - remaining}/{steps.length}</p>
                <span className="text-xs text-muted-foreground">Quelques étapes pour bien démarrer</span>
              </div>
              <div className="grid gap-2 sm:grid-cols-3">
                {steps.map((st) => (
                  <Link
                    key={st.label}
                    href={st.href}
                    className={`flex items-center gap-2 rounded-lg border p-3 text-sm transition ${
                      st.done ? "border-border bg-card text-muted-foreground" : "border-primary/40 bg-card hover:bg-primary/10"
                    }`}
                  >
                    <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs ${st.done ? "bg-success/20 text-success" : "border border-primary text-primary"}`}>
                      {st.done ? "✓" : ""}
                    </span>
                    <span className={st.done ? "line-through" : "font-medium text-foreground"}>{st.label}</span>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })()}

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {isEstablishment ? (
          <>
            <StatCard label="Renforts actifs" value={s.activeMissions ?? 0} accent="teal" />
            <StatCard label="Candidatures reçues" value={s.applications ?? 0} accent="terracotta" />
            <StatCard label="Missions à venir" value={s.upcomingBookings ?? 0} />
            <StatCard label="Taux de couverture" value={`${s.fillRate ?? 0}%`} hint="30 derniers jours" />
          </>
        ) : (
          <>
            <StatCard label="Candidatures en cours" value={s.applications ?? 0} accent="teal" />
            <StatCard label="Missions à venir" value={s.upcomingBookings ?? 0} accent="terracotta" />
            <StatCard label="Ateliers publiés" value={services.data?.length ?? 0} />
            <StatCard
              label="Revenus du mois"
              value={new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(s.revenueMonth ?? 0)}
            />
          </>
        )}
      </div>

      {/* BentoGrid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Colonne principale (2/3) */}
        <div className="space-y-6 lg:col-span-2">
          {isEstablishment ? (
            <Card>
              <CardHeader>
                <SectionTitle
                  title="Mes renforts"
                  action={
                    <Button asChild variant="link" size="sm">
                      <Link href="/dashboard/renforts">Tout voir</Link>
                    </Button>
                  }
                />
              </CardHeader>
              <CardContent>
                {missions.data && missions.data.length > 0 ? (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {missions.data.map((m) => (
                      <MissionCard key={m.id} mission={m} href={`/dashboard/renforts?mission=${m.id}`} />
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    title="Aucun renfort publié"
                    description="Publiez votre premier SOS Renfort pour recevoir des candidatures."
                    action={<RenfortModal accountId={session.account.id} />}
                  />
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <SectionTitle
                  title="Mes ateliers"
                  action={
                    <Button asChild variant="link" size="sm">
                      <Link href="/dashboard/ateliers">Gérer</Link>
                    </Button>
                  }
                />
              </CardHeader>
              <CardContent>
                {services.data && services.data.length > 0 ? (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {services.data.map((sv) => (
                      <ServiceCard key={sv.id} service={sv} href={`/dashboard/ateliers?service=${sv.id}`} />
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    title="Aucun atelier"
                    description="Créez votre premier atelier pour être visible dans le catalogue."
                    action={
                      <Button asChild>
                        <Link href="/dashboard/ateliers">Créer un atelier</Link>
                      </Button>
                    }
                  />
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Colonne latérale (1/3) : activité récente */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <SectionTitle
                title="Activité récente"
                action={
                  <Button asChild variant="link" size="sm">
                    <Link href="/dashboard/planning">Planning</Link>
                  </Button>
                }
              />
            </CardHeader>
            <CardContent className="space-y-3">
              {bookings.data && bookings.data.length > 0 ? (
                bookings.data.map((b) => <BookingRow key={b.id} booking={b} />)
              ) : (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  Aucune activité pour le moment.
                </p>
              )}
            </CardContent>
          </Card>

          {(() => {
            // Bloc « À faire » : uniquement des actions qui attendent l'utilisateur.
            const todos: { label: string; href: string }[] = [];
            if ((s.applications ?? 0) > 0) {
              todos.push({
                label: `${s.applications} candidature${s.applications! > 1 ? "s" : ""} à examiner`,
                href: isEstablishment ? "/dashboard/renforts" : "/dashboard/opportunites",
              });
            }
            if ((s.upcomingBookings ?? 0) > 0) {
              todos.push({
                label: `${s.upcomingBookings} intervention${s.upcomingBookings! > 1 ? "s" : ""} à venir`,
                href: "/dashboard/planning",
              });
            }
            if ((s.unreadMessages ?? 0) > 0) {
              todos.push({
                label: `${s.unreadMessages} message${s.unreadMessages! > 1 ? "s" : ""} non lu${s.unreadMessages! > 1 ? "s" : ""}`,
                href: "/dashboard/inbox",
              });
            }
            if (!session.user.firstName) {
              todos.push({ label: "Compléter votre profil", href: "/dashboard/account" });
            }
            return (
              <Card className="bg-primary/5">
                <CardHeader>
                  <SectionTitle title="À faire" />
                </CardHeader>
                <CardContent className="space-y-2">
                  {todos.length > 0 ? (
                    todos.map((t) => (
                      <Button key={t.href + t.label} asChild variant="outline" className="w-full justify-between">
                        <Link href={t.href}>
                          <span>{t.label}</span>
                          <span aria-hidden>→</span>
                        </Link>
                      </Button>
                    ))
                  ) : (
                    <p className="py-4 text-center text-sm text-muted-foreground">
                      Tout est à jour. Rien ne vous attend pour le moment.
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
