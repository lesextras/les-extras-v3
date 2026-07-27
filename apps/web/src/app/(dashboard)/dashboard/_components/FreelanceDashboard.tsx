import Link from "next/link";
import type { BookingLine } from "@/app/actions/bookings";
import type { MyDeskRequest } from "@/app/actions/desk";
import type { MesAtelierItem } from "@/app/actions/marketplace";
import type { MatchingMission } from "@/components/dashboard/MatchingMissionsWidget";
import { BentoItem, BentoSection } from "@/components/layout/BentoSection";
import { FreelanceKpiGrid } from "@/components/dashboard/FreelanceKpiGrid";
import { BookingListWidget } from "@/components/dashboard/BookingListWidget";
import { TrustChecklistWidget } from "@/components/dashboard/TrustChecklistWidget";
import type { FreelanceTrustProfile } from "@/lib/freelance-trust";
import { NextMissionCard } from "@/components/dashboard/NextMissionCard";
import { MatchingMissionsWidget } from "@/components/dashboard/MatchingMissionsWidget";
import { RecentReviewsWidget } from "@/components/dashboard/RecentReviewsWidget";
import { Button } from "@/components/ui/button";
import { getDeskContextLabel, getDeskRequestTypeLabel } from "@/lib/desk-labels";
import { DashboardWidget } from "./DashboardWidget";
import { FreelanceAvailabilityToggle } from "./FreelanceAvailabilityToggle";
import {
    Calendar,
    Briefcase,
    BookOpen,
    ShieldCheck,
    TrendingUp,
    Star,
    Sparkles,
    Inbox,
} from "lucide-react";

export interface ReviewItem {
    id: string;
    authorName: string;
    rating: number;
    text: string;
    context: string;
}

export interface FreelanceDashboardProps {
    confirmedBookings: BookingLine[];
    pendingBookings: BookingLine[];
    bookingsError: string | null;
    matchingMissions: MatchingMission[];
    availableMissionsError: string | null;
    nextMission: BookingLine | undefined;
    recentReviews: ReviewItem[];
    recentReviewsError: string | null;
    isAvailable?: boolean;
    trustProfile: FreelanceTrustProfile;
    services: MesAtelierItem[];
    servicesError: string | null;
    deskRequests: MyDeskRequest[];
    deskRequestsError: string | null;
    upcomingMissions: number;
    pendingApplications: number;
    pendingServiceRequests: number;
    activeServices: number;
    openDeskRequests: number;
    averageRating: number | null;
}

export function FreelanceDashboard({
    confirmedBookings,
    pendingBookings,
    bookingsError,
    matchingMissions,
    availableMissionsError,
    nextMission,
    recentReviews,
    recentReviewsError,
    isAvailable,
    trustProfile,
    services,
    servicesError,
    deskRequests,
    deskRequestsError,
    upcomingMissions,
    pendingApplications,
    pendingServiceRequests,
    activeServices,
    openDeskRequests,
    averageRating,
}: FreelanceDashboardProps) {
    const nextMissionDetailsHref =
        nextMission?.lineType && nextMission?.lineId
            ? `/bookings/${nextMission.lineType}/${nextMission.lineId}`
            : "/bookings";
    const matchingMissionsSubtitle = matchingMissions.some((mission) => (mission.matchScore ?? 0) > 0)
        ? "Sélectionnées pour votre profil"
        : "Missions disponibles";
    const draftServices = services.filter((service) => service.status === "DRAFT").length;
    const answeredDeskRequests = deskRequests.filter((request) => request.status === "ANSWERED").length;
    const latestDeskRequest = deskRequests[0];
    const latestDeskRequestLabel = latestDeskRequest
        ? (() => {
            const contextLabel = getDeskContextLabel(latestDeskRequest);
            return contextLabel === "Sans objet lié"
                ? getDeskRequestTypeLabel(latestDeskRequest.type)
                : contextLabel;
        })()
        : null;

    return (
        <div className="space-y-8">
            {/* Page header */}
            <header className="flex items-start justify-between gap-4 flex-wrap">
                <div className="space-y-1.5">
                    <p className="text-overline uppercase tracking-widest text-muted-foreground">
                        Espace Freelance
                    </p>
                    <h1 className="font-display text-heading-xl tracking-tight">
                        Mon Tableau de bord
                    </h1>
                    <FreelanceAvailabilityToggle initialIsAvailable={Boolean(isAvailable)} />
                    <p className="text-body-md text-muted-foreground">
                        Pilotez vos missions de renfort, vos services et vos échanges avec l&apos;équipe.
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <Link href="/marketplace">
                        <span className="inline-flex items-center gap-2 rounded-xl bg-[hsl(var(--teal))] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:opacity-90 transition-opacity">
                            <Sparkles className="h-4 w-4" aria-hidden="true" />
                            Explorer missions & services
                        </span>
                    </Link>
                    <Button variant="glass" className="min-h-[44px]" asChild>
                        <Link href="/dashboard/ateliers">
                            <BookOpen className="h-4 w-4" aria-hidden="true" />
                            Proposer mes services
                        </Link>
                    </Button>
                </div>
            </header>

            {/* Next mission (elevated card) */}
            {nextMission && (
                <NextMissionCard
                    detailsHref={nextMissionDetailsHref}
                    title={nextMission.typeLabel ?? "Mission confirmée"}
                    establishment={nextMission.interlocutor ?? "Établissement"}
                    city={nextMission.address ?? ""}
                    scheduledAt={nextMission.date ?? new Date().toISOString()}
                    dateDisplay={
                        nextMission.date
                            ? new Date(nextMission.date).toLocaleDateString("fr-FR", {
                                  weekday: "long",
                                  day: "numeric",
                                  month: "long",
                              })
                            : "Date à confirmer"
                    }
                />
            )}

            {/* KPI row */}
            <FreelanceKpiGrid
                upcomingMissions={upcomingMissions}
                pendingApplications={pendingApplications}
                pendingServiceRequests={pendingServiceRequests}
                averageRating={averageRating}
            />

            {/* Main bento */}
            <BentoSection cols={3} gap="md">
                {/* Matching missions */}
                <BentoItem span={2}>
                    <DashboardWidget
                        icon={Sparkles}
                        iconColor="coral"
                        title="Nouvelles missions"
                        subtitle={matchingMissionsSubtitle}
                    >
                        <MatchingMissionsWidget
                            missions={matchingMissions}
                            error={availableMissionsError}
                        />
                    </DashboardWidget>
                </BentoItem>

                {/* Trust progress */}
                <DashboardWidget
                    icon={ShieldCheck}
                    iconColor="emerald"
                    title="Profil & Confiance"
                >
                    <TrustChecklistWidget trustProfile={trustProfile} />
                </DashboardWidget>

                {/* Services */}
                <DashboardWidget
                    icon={BookOpen}
                    iconColor="teal"
                    title="Mes services"
                    subtitle="Ateliers et formations proposés"
                    viewAllHref="/dashboard/ateliers"
                    viewAllLabel="Voir tous mes services"
                >
                    {servicesError ? (
                        <div className="flex h-28 items-center justify-center rounded-lg border border-dashed bg-muted/50 text-sm text-muted-foreground">
                            {servicesError}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="grid grid-cols-3 gap-3 text-center">
                                <div>
                                    <p className="text-2xl font-bold">{services.length}</p>
                                    <p className="text-xs text-muted-foreground">total</p>
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">{activeServices}</p>
                                    <p className="text-xs text-muted-foreground">actifs</p>
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">{pendingServiceRequests}</p>
                                    <p className="text-xs text-muted-foreground">à traiter</p>
                                </div>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                {services.length > 0
                                    ? `${draftServices} brouillon${draftServices > 1 ? "s" : ""} à finaliser.`
                                    : "Publiez un atelier ou une formation pour recevoir des demandes de réservation."}
                            </p>
                            <Button variant="glass" size="sm" className="w-full min-h-[44px]" asChild>
                                <Link href="/dashboard/ateliers">Gérer mes services</Link>
                            </Button>
                        </div>
                    )}
                </DashboardWidget>

                {/* Agenda */}
                <BentoItem span={2}>
                    <DashboardWidget
                        icon={Calendar}
                        iconColor="teal"
                        title="Mon Agenda"
                        subtitle="Missions confirmées"
                    >
                        <BookingListWidget
                            bookings={confirmedBookings}
                            emptyMessage="Aucune mission prévue."
                            viewAllLink="/bookings"
                            viewAllLabel="Voir tout mon agenda"
                            error={bookingsError}
                        />
                    </DashboardWidget>
                </BentoItem>

                {/* Recent reviews */}
                <DashboardWidget icon={Star} iconColor="amber" title="Derniers avis">
                    <RecentReviewsWidget
                        reviews={recentReviews}
                        error={recentReviewsError}
                    />
                </DashboardWidget>

                {/* Candidatures */}
                <BentoItem span={2}>
                    <DashboardWidget
                        icon={Briefcase}
                        iconColor="coral"
                        title="Mes Candidatures"
                        subtitle="En cours de traitement"
                    >
                        <BookingListWidget
                            bookings={pendingBookings}
                            emptyMessage="Aucune candidature en cours."
                            viewAllLink="/bookings"
                            viewAllLabel="Voir toutes mes candidatures"
                            error={bookingsError}
                        />
                    </DashboardWidget>
                </BentoItem>

                {/* Desk requests */}
                <DashboardWidget
                    icon={Inbox}
                    iconColor="coral"
                    title="Mes demandes"
                    subtitle="Réponses de l'équipe"
                    viewAllHref="/dashboard/demandes"
                    viewAllLabel="Voir toutes mes demandes"
                >
                    {deskRequestsError ? (
                        <div className="flex h-28 items-center justify-center rounded-lg border border-dashed bg-muted/50 text-sm text-muted-foreground">
                            {deskRequestsError}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-3 text-center">
                                <div>
                                    <p className="text-2xl font-bold">{openDeskRequests}</p>
                                    <p className="text-xs text-muted-foreground">ouvertes</p>
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">{answeredDeskRequests}</p>
                                    <p className="text-xs text-muted-foreground">réponses</p>
                                </div>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                {latestDeskRequestLabel
                                    ? `Dernière demande : ${latestDeskRequestLabel}`
                                    : "Aucune demande d'information en cours."}
                            </p>
                            <Button variant="glass" size="sm" className="w-full min-h-[44px]" asChild>
                                <Link href="/dashboard/demandes">Voir mes demandes</Link>
                            </Button>
                        </div>
                    )}
                </DashboardWidget>

                {/* Finances */}
                <DashboardWidget icon={TrendingUp} iconColor="emerald" title="Mes Finances">
                    <div className="space-y-3">
                        <p className="text-sm text-muted-foreground">
                            Suivez vos factures et paiements validés dans l&apos;espace finances.
                        </p>
                        <Button variant="glass" size="sm" className="w-full min-h-[44px]" asChild>
                            <Link href="/finance">Voir mes finances</Link>
                        </Button>
                    </div>
                </DashboardWidget>
            </BentoSection>
        </div>
    );
}
