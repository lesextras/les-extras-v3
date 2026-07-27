import { redirect, notFound } from "next/navigation";
import { getSession } from "@/lib/session";
import { getFreelanceById } from "@/app/actions/marketplace";
import { FicheFreelanceClient } from "./FicheFreelanceClient";
import { freelancePublicQueryKeys } from "@/lib/messaging-query-keys";

export const dynamic = "force-dynamic";

function getInitials(first: string, last: string) {
  return `${first[0]}${last[0]}`.toUpperCase();
}

function avgRating(ratings: number[]): number {
  if (ratings.length === 0) return 0;
  return ratings.reduce((s, r) => s + r, 0) / ratings.length;
}

export default async function FicheFreelancePage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const profileQueryKey = freelancePublicQueryKeys.detail(params.id);
  if (!profileQueryKey.length) notFound();

  const freelance = await getFreelanceById(params.id);
  if (!freelance) notFound();

  const profile = freelance.profile;
  const fullName = profile ? `${profile.firstName} ${profile.lastName}` : "Freelance";
  const initials = profile ? getInitials(profile.firstName, profile.lastName) : "F";
  const rating = avgRating(freelance.reviewsReceived.map((r) => r.rating));
  const reviewCount = freelance.reviewsReceived.length;

  return (
    <FicheFreelanceClient
      freelance={freelance}
      fullName={fullName}
      initials={initials}
      rating={rating}
      reviewCount={reviewCount}
    />
  );
}
