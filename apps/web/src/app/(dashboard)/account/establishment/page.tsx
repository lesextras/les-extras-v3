import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { apiRequest } from "@/lib/api";
import { EstablishmentProfileClient } from "@/components/profile/EstablishmentProfileClient";

export default async function EstablishmentPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  let profile: Record<string, any> | null = null;
  try {
    const me = await apiRequest<{ profile: Record<string, any> | null }>("/users/me", {
      token: session.token,
    });
    profile = me.profile ?? null;
  } catch (error) {
    console.error("Failed to load establishment profile:", error);
  }

  const initialData = {
    companyName: profile?.companyName || "",
    phone: profile?.phone || "",
    address: profile?.address || "",
    city: profile?.city || "",
    zipCode: profile?.zipCode || "",
    country: profile?.country || "France",
    siret: profile?.siret || "",
    tvaNumber: profile?.tvaNumber || "",
    bio: profile?.bio || "",
    createdAt: profile?.createdAt ?? new Date().toISOString(),
  };

  const stats = {
    totalMissions: 0,
    activeBookings: 0,
    availableCredits: profile?.availableCredits ?? 0,
  };

  return (
    <EstablishmentProfileClient initialData={initialData} stats={stats} />
  );
}
