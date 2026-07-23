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

          <Card className="bg-primary/5">
            <CardContent className="space-y-3 p-5">
              <Badge variant="secondary">Raccourcis</Badge>
              <div className="flex flex-col gap-2">
                <Button asChild variant="outline" className="justify-start">
                  <Link href="/dashboard/inbox">Messagerie {s.unreadMessages ? `(${s.unreadMessages})` : ""}</Link>
                </Button>
                <Button asChild variant="outline" className="justify-start">
                  <Link href="/dashboard/finance">Factures &amp; revenus</Link>
                </Button>
                <Button asChild variant="outline" className="justify-start">
                  <Link href="/dashboard/account">Équipe &amp; paramètres</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
