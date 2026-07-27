import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getOrderTracker } from "@/app/actions/orders";
import { OrderTrackerClient } from "@/components/orders/OrderTrackerClient";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ bookingId: string }>;
};

export default async function OrderPage({ params }: Props) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { bookingId } = await params;

  let data;
  try {
    data = await getOrderTracker(bookingId, session.token);
  } catch {
    redirect("/bookings");
  }

  return (
    <OrderTrackerClient
      data={data}
      currentUserId={session.user.id}
      apiToken={session.token}
    />
  );
}
