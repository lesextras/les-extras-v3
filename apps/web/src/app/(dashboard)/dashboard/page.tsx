import { redirect } from "next/navigation";
import { getSession, deleteSession } from "@/lib/session";
import { getBookingsPageData } from "@/app/actions/bookings";
import type { BookingsPageData } from "@/app/actions/bookings";
import type { SerializedQuote } from "@/actions/quotes";
import { getInvoices } from "@/actions/finance";
import type { SerializedInvoice } from "@/actions/finance";
import { getCredits } from "@/actions/credits";
import { getReviewsByTarget } from "@/app/actions/reviews";
import { getEstablishmentMissions, getAvailableMissions } from "@/app/actions/missions";
import type { EstablishmentMission } from "@/app/actions/missions";
import { getMyAteliers, type MesAtelierItem } from "@/app/actions/marketplace";
import { getMyDeskRequestsSafe, type MyDeskRequest } from "@/app/actions/desk";
import { fetchSafe } from "@/lib/widget-result";
import { UnauthorizedError } from "@/lib/api";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import type { MatchingMission } from "@/components/dashboard/MatchingMissionsWidget";
import { getCurrentUser } from "@/app/actions/user";
import { EstablishmentDashboard } from "./_components/EstablishmentDashboard";
import { FreelanceDashboard } from "./_components/FreelanceDashboard";
import type { ReviewItem } from "./_components/FreelanceDashboard";
import { getMissionPlanning } from "@/lib/mission-planning";
import { getMissionDisplayTitle } from "@/lib/mission-display";
import { getNextUpcomingBooking, isUpcomingBooking } from "@/lib/dashboard-bookings";
import {
    getAssignedUpcomingMissions,
    getMissionsWithPendingCandidates,
    getRenfortsToFill,
} from "@/lib/establishment-renforts";
import { computeFreelanceTrustProfile } from "@/lib/freelance-trust";
import { computeEstablishmentTrustProfile } from "@/lib/establishment-trust";
import { getTopMatchingMissions } from "@/lib/mission-matching";

export const dynamic = "force-dynamic";

// ─── Data fetching helpers ──────────────────────────────────────

async function fetchEstablishmentData(token: string, userId: string) {
    const [
        bookingsResult,
        missionsResult,
        invoicesResult,
        creditsResult,
        reviewsResult,
        deskRequestsResult,
        userResult,
    ] =
        await Promise.all([
            fetchSafe<BookingsPageData>(
                () => getBookingsPageData(token),
                { lines: [], nextStep: null },
                "Réservations",
            ),
            fetchSafe<EstablishmentMission[]>(
                () => getEstablishmentMissions(token),
                [],
                "Renforts",
            ),
            fetchSafe<SerializedInvoice[]>(
                () => getInvoices(),
                [],
                "Factures",
            ),
            fetchSafe<number | null>(
                () => getCredits(token),
                null,
                "Crédits",
            ),
            fetchReviews(userId, token),
            fetchSafe<MyDeskRequest[]>(
                async () => {
                    const result = await getMyDeskRequestsSafe(token);
                    if (!result.ok) {
                        throw new Error(result.error);
                    }
                    return result.data;
                },
                [],
                "Demandes",
            ),
            fetchSafe(
                () => getCurrentUser(),
                null,
                "Profil établissement",
            ),
        ]);

    // TODO(Sprint établissement 3): brancher les devis réels ou supprimer ce flux.
    const quotesResult = { data: [] as SerializedQuote[], error: null };

    const lines = bookingsResult.data?.lines ?? [];
    const missions = missionsResult.data;
    const currentUser = userResult.data;
    const establishmentTrustUser =
        currentUser?.profile && creditsResult.data !== null
            ? {
                  ...currentUser,
                  profile: {
                      ...currentUser.profile,
                      availableCredits: creditsResult.data,
                  },
              }
            : currentUser;
    const now = new Date();

    const activeMissions = missions.filter(
        (m) => m.status === "OPEN" || m.status === "ASSIGNED",
    );
    const renfortsToFillMissions = getRenfortsToFill(missions, now);
    const missionsWithPendingCandidates = getMissionsWithPendingCandidates(missions, now);
    const assignedUpcomingMissions = getAssignedUpcomingMissions(missions, now);
    const renfortsToFill = renfortsToFillMissions.length;
    const pendingCandidatures = missionsWithPendingCandidates.reduce(
        (acc, m) => acc + (m.bookings?.filter((b) => b.status === "PENDING").length ?? 0),
        0,
    );
    // Missions CONFIRMED that establishment needs to mark as complete ("valider les heures").
    // Previously filtered on "COMPLETED_AWAITING_PAYMENT" which the backend never emits.
    const awaitingPaymentBookings = lines.filter(
        (b) => (b.status === "CONFIRMED" || b.status === "ASSIGNED") && b.lineType === "MISSION",
    );
    const confirmedBookings = lines.filter(
        (b) => b.status === "CONFIRMED" || b.status === "ASSIGNED",
    );
    const completedBookings = lines.filter(
        (b) => b.status === "COMPLETED" || b.status === "PAID",
    );
    const upcomingInterventions = confirmedBookings.filter((booking) =>
        isUpcomingBooking(booking, now),
    ).length;
    const pendingQuotes = (quotesResult.data ?? []).filter((q) => q.status === "PENDING");
    const openDeskRequests = (deskRequestsResult.data ?? []).filter(
        (request) => request.status === "OPEN" || request.status === "IN_PROGRESS",
    );

    return {
        activeMissions,
        missionsError: missionsResult.error,
        pendingQuotes,
        quotesError: quotesResult.error,
        invoices: invoicesResult.data ?? [],
        invoicesError: invoicesResult.error,
        availableCredits: creditsResult.data,
        creditsError: creditsResult.error,
        pendingCandidatures,
        awaitingPaymentBookings,
        confirmedBookings,
        completedBookings,
        bookingsError: bookingsResult.error,
        nextMission: assignedUpcomingMissions[0] ?? null,
        recentReviews: reviewsResult.data,
        recentReviewsError: reviewsResult.error,
        openDeskRequests,
        deskRequestsError: deskRequestsResult.error,
        renfortsToFill,
        renfortsToFillMissions,
        missionsWithPendingCandidates,
        upcomingInterventions,
        establishmentTrustProfile: computeEstablishmentTrustProfile(establishmentTrustUser, missions),
    };
}

async function fetchFreelanceData(token: string, userId: string) {
    const [
        bookingsResult,
        missionsResult,
        reviewsResult,
        userResult,
        servicesResult,
        deskRequestsResult,
    ] = await Promise.all([
        fetchSafe<BookingsPageData>(
            () => getBookingsPageData(token),
            { lines: [], nextStep: null },
            "Réservations",
        ),
        fetchSafe(
            () => getAvailableMissions(token),
            [],
            "Missions disponibles",
        ),
        fetchReviews(userId, token),
        fetchSafe(
            () => getCurrentUser(),
            null,
            "Profil freelance",
        ),
        fetchSafe<MesAtelierItem[]>(
            () => getMyAteliers(token),
            [],
            "Services",
        ),
        fetchSafe<MyDeskRequest[]>(
            async () => {
                const result = await getMyDeskRequestsSafe(token);
                if (!result.ok) {
                    throw new Error(result.error);
                }
                return result.data;
            },
            [],
            "Demandes",
        ),
    ]);

    const lines = bookingsResult.data?.lines ?? [];
    const missionBookings = lines.filter((line) => line.lineType === "MISSION");
    const serviceBookings = lines.filter((line) => line.lineType === "SERVICE_BOOKING");
    const confirmedBookings = missionBookings.filter(
        (b) => b.status === "CONFIRMED" || b.status === "ASSIGNED",
    );
    const now = new Date();
    const upcomingMissions = confirmedBookings.filter((booking) => isUpcomingBooking(booking, now)).length;
    const pendingApplications = missionBookings.filter((booking) => booking.status === "PENDING").length;
    const pendingServiceRequests = serviceBookings.filter(
        (booking) =>
            booking.viewerSide === "PROVIDER" &&
            (booking.status === "PENDING" || booking.status === "QUOTE_ACCEPTED"),
    ).length;
    const currentUser = userResult.data;
    const services = servicesResult.data ?? [];
    const deskRequests = deskRequestsResult.data ?? [];
    const openDeskRequests = deskRequests.filter(
        (request) => request.status === "OPEN" || request.status === "IN_PROGRESS",
    ).length;

    const matchingMissions: MatchingMission[] = getTopMatchingMissions(
        missionsResult.data ?? [],
        currentUser,
        3,
    )
        .map(({ mission: m, score, reasons }) => {
            const planning = getMissionPlanning(m);
            const firstSlot = planning.firstSlot;

            return {
                id: m.id,
                title: getMissionDisplayTitle(m),
                establishment: m.establishment?.profile?.companyName ?? "Établissement",
                city: m.city ?? m.establishment?.profile?.city ?? "",
                dates: firstSlot ? format(firstSlot.start, "dd MMM", { locale: fr }) : undefined,
                hours: firstSlot ? `${firstSlot.heureDebut} – ${firstSlot.heureFin}` : undefined,
                rate: `${m.hourlyRate}\u00a0€/h`,
                urgent: m.isUrgent ?? false,
                matchScore: score,
                matchReasons: reasons,
            };
        });

    return {
        confirmedBookings,
        pendingBookings: missionBookings.filter((b) => b.status === "PENDING"),
        bookingsError: bookingsResult.error,
        matchingMissions,
        availableMissionsError: missionsResult.error,
        nextMission: getNextUpcomingBooking(missionBookings, now),
        recentReviews: reviewsResult.data,
        recentReviewsError: reviewsResult.error,
        isAvailable: currentUser?.isAvailable ?? false,
        trustProfile: computeFreelanceTrustProfile(currentUser),
        services,
        servicesError: servicesResult.error,
        deskRequests,
        deskRequestsError: deskRequestsResult.error,
        upcomingMissions,
        pendingApplications,
        pendingServiceRequests,
        activeServices: services.filter((service) => service.status === "ACTIVE").length,
        openDeskRequests,
        averageRating: reviewsResult.averageRating,
    };
}

async function fetchReviews(
    userId: string,
    token: string,
): Promise<{ data: ReviewItem[]; error: string | null; averageRating: number | null }> {
    try {
        const rawReviews = await getReviewsByTarget(userId, token);
        const averageRating =
            rawReviews.length > 0
                ? rawReviews.reduce((acc: number, review: any) => acc + review.rating, 0) / rawReviews.length
                : null;
        const data: ReviewItem[] = rawReviews.slice(0, 4).map((review: any) => {
            const authorProfile = review.author?.profile;
            const authorName = authorProfile
                ? authorProfile.companyName ||
                  `${authorProfile.firstName ?? ""} ${authorProfile.lastName ?? ""}`.trim() ||
                  "Établissement"
                : "Établissement";
            return {
                id: review.id,
                authorName,
                authorRole: authorProfile?.jobTitle ?? undefined,
                rating: review.rating,
                text: review.comment ?? "Avis sans commentaire.",
                context: new Date(review.createdAt).toLocaleDateString("fr-FR", {
                    month: "long",
                    year: "numeric",
                }),
            };
        });
        return { data, error: null, averageRating };
    } catch (error) {
        if (error instanceof UnauthorizedError) {
            throw error;
        }

        return { data: [], error: "Impossible de charger les avis pour le moment.", averageRating: null };
    }
}

// ─── Page component ─────────────────────────────────────────────

export default async function DashboardPage() {
    const session = await getSession();
    if (!session) redirect("/login");

    const { role: userRole } = session.user;
    const { token } = session;

    try {
        if (userRole === "ESTABLISHMENT") {
            const data = await fetchEstablishmentData(token, session.user.id);
            return <EstablishmentDashboard {...data} />;
        }

        const data = await fetchFreelanceData(token, session.user.id);
        return <FreelanceDashboard {...data} />;
    } catch (e) {
        if (e instanceof UnauthorizedError) {
            await deleteSession();
            redirect("/login");
        }
        throw e;
    }
}
