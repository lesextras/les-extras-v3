import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { MesAteliersClient } from "@/components/dashboard/MesAteliersClient";
import { getMyAteliers } from "@/app/actions/marketplace";
import { getBookingsPageDataSafe } from "@/app/actions/bookings";
import { toUserFacingApiError } from "@/lib/api";

export const dynamic = "force-dynamic";

export default async function MesAteliersPage() {
    const session = await getSession();
    if (!session) redirect("/login");
    if (session.user.role !== "FREELANCE") redirect("/dashboard");

    try {
        const [ateliers, bookingsData] = await Promise.all([
            getMyAteliers(session.token),
            getBookingsPageDataSafe(session.token),
        ]);

        const serviceBookings = (bookingsData.ok ? bookingsData.data.lines : []).filter(
            (line) => line.lineType === "SERVICE_BOOKING",
        );

        return (
            <MesAteliersClient
                ateliers={ateliers}
                serviceBookings={serviceBookings}
            />
        );
    } catch (error) {
        console.error("MesAteliersPage error", error);
        const message = toUserFacingApiError(
            error,
            "Impossible de charger vos ateliers pour le moment.",
        );
        return <MesAteliersClient ateliers={[]} serviceBookings={[]} error={message} />;
    }
}
