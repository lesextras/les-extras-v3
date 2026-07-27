import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getBookingsPageDataSafe } from "@/app/actions/bookings";
import { OrdersListClient } from "@/components/orders/OrdersListClient";

export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const result = await getBookingsPageDataSafe(session.token);

  return (
    <OrdersListClient
      lines={result.ok ? result.data.lines : []}
      error={result.ok ? null : result.error}
    />
  );
}
