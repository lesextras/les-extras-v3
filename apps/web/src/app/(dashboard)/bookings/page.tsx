import { getBookingsPageDataSafe } from "@/app/actions/bookings";
import type { BookingsPageData } from "@/app/actions/bookings";
import { BookingsPageClient } from "@/components/bookings/BookingsPageClient";
import { getSession, deleteSession } from "@/lib/session";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function BookingsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  let initialData: BookingsPageData = { lines: [], nextStep: null };
  let initialError: string | null = null;

  const result = await getBookingsPageDataSafe(session.token);
  if (result.ok) {
    initialData = result.data;
  } else if (result.unauthorized) {
    await deleteSession();
    redirect("/login");
  } else {
    console.error("[bookings] initial load error", result.error);
    initialError = result.error || "Impossible de charger votre agenda pour le moment.";
  }

  return <BookingsPageClient initialData={initialData} initialError={initialError} />;
}
