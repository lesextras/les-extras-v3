import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { apiRequest } from "@/lib/api";
import { UserProfileClient } from "@/components/profile/UserProfileClient";
import type { UserKycDocumentsPayload } from "@/lib/kyc-documents";

export default async function AccountPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
    return null;
  }

  if (session.user.role === "ESTABLISHMENT") {
    redirect("/account/establishment");
    return null;
  }

  let profile: Record<string, any> | null = null;
  let isAvailable = false;
  let kycDocuments: UserKycDocumentsPayload["documents"] = [];
  let kycSummary: UserKycDocumentsPayload["summary"] = {
    globalStatus: "MISSING",
    requiredDocuments: 6,
    uploadedDocuments: 0,
    approvedDocuments: 0,
    pendingDocuments: 0,
    rejectedDocuments: 0,
    missingDocuments: [],
  };
  try {
    const [me, documentsPayload] = await Promise.all([
      apiRequest<{ isAvailable: boolean; profile: Record<string, any> | null }>("/users/me", {
        token: session.token,
      }),
      session.user.role === "FREELANCE"
        ? apiRequest<UserKycDocumentsPayload>("/users/me/documents", {
            token: session.token,
          })
        : Promise.resolve(null),
    ]);
    profile = me.profile ?? null;
    isAvailable = me.isAvailable ?? false;
    if (documentsPayload) {
      kycDocuments = documentsPayload.documents;
      kycSummary = documentsPayload.summary;
    }
  } catch (error) {
    console.error("Failed to load profile:", error);
  }

  const initialData = {
    firstName: profile?.firstName || "",
    lastName: profile?.lastName || "",
    jobTitle: profile?.jobTitle || "",
    bio: profile?.bio || "",
    avatar: profile?.avatar || undefined,
    phone: profile?.phone || "",
    address: profile?.address || "",
    city: profile?.city || "",
    zipCode: profile?.zipCode || "",
    siret: profile?.siret || "",
    tvaNumber: profile?.tvaNumber || "",
    skills: profile?.skills || [],
    availableDays: profile?.availableDays || [],
    isAvailable,
    availableCredits: profile?.availableCredits ?? 0,
    createdAt: profile?.createdAt ?? new Date().toISOString(),
  };

  return (
    <UserProfileClient
      initialData={initialData}
      initialKycDocuments={kycDocuments}
      initialKycSummary={kycSummary}
      userRole={session.user.role as "ESTABLISHMENT" | "FREELANCE" | "ADMIN"}
      userEmail={session.user.email}
    />
  );
}
