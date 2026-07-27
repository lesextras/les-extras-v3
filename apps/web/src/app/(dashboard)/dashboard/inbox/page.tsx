import { redirect } from "next/navigation";
import { getSession, deleteSession } from "@/lib/session";
import { getBookingsPageDataSafe, type BookingLineStatus } from "@/app/actions/bookings";
import { getNotifications } from "@/actions/messaging";
import { InboxClient } from "./InboxClient";
import type { MessagingConversationSeed } from "@/lib/messaging-v1";

export const dynamic = "force-dynamic";

export default async function InboxPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  let seeds: MessagingConversationSeed[] = [];
  let loadError: string | null = null;
  let notifications: {
    id: string;
    message: string;
    type: string;
    isRead: boolean;
    createdAt: string;
  }[] = [];
  let notificationsError: string | null = null;

  const MESSAGING_ALLOWED_STATUSES: BookingLineStatus[] = [
    "CONFIRMED", "IN_PROGRESS", "COMPLETED", "AWAITING_PAYMENT", "PAID",
    "ASSIGNED", "COMPLETED_AWAITING_PAYMENT",
  ];

  const bookingsResult = await getBookingsPageDataSafe(session.token);
  if (bookingsResult.ok) {
    seeds = bookingsResult.data.lines
      .filter((line) => MESSAGING_ALLOWED_STATUSES.includes(line.status))
      .map((line) => ({
        id: `booking:${line.lineType}:${line.lineId}`,
        name: line.interlocutor,
        context: line.typeLabel,
        source: "BOOKING" as const,
      }));
  } else if (bookingsResult.unauthorized) {
    await deleteSession();
    redirect("/login");
  } else {
    loadError = bookingsResult.error || "Impossible de charger les conversations liées à vos missions et ateliers.";
  }

  try {
    const raw = await getNotifications();
    notifications = (raw ?? []).slice(0, 8).map((item: any) => ({
      id: item.id,
      message: item.message,
      type: item.type,
      isRead: Boolean(item.isRead),
      createdAt: item.createdAt instanceof Date ? item.createdAt.toISOString() : String(item.createdAt),
    }));
  } catch {
    notificationsError = "Notifications indisponibles pour le moment.";
  }

  const uniqueSeeds = Array.from(new Map(seeds.map((seed) => [seed.id, seed])).values());

  return (
    <InboxClient
      currentUserId={session.user.id}
      currentUserRole={session.user.role === "ESTABLISHMENT" ? "ESTABLISHMENT" : "FREELANCE"}
      initialSeeds={uniqueSeeds}
      initialLoadError={loadError}
      initialNotifications={notifications}
      notificationsError={notificationsError}
    />
  );
}
