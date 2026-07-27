import { AppShell } from "@/components/layout/AppShell";
import { OnboardingGuard } from "@/components/onboarding/OnboardingGuard";
import { getSession, deleteSession } from "@/lib/session";
import { apiRequest, UnauthorizedError } from "@/lib/api";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  // Vérifie que le token API est encore valide (peut expirer indépendamment du cookie Next.js)
  try {
    await apiRequest("/users/me", {
      token: session.token,
      cache: "no-store",
      label: "dashboard.session",
    });
  } catch (e) {
    if (e instanceof UnauthorizedError) {
      await deleteSession();
      redirect("/login");
    }
    // Toute autre erreur réseau n'invalide pas la session
  }

  const onboardingStep = session.user.onboardingStep ?? 0;

  return (
    <OnboardingGuard
      userRole={session.user.role}
      onboardingStep={onboardingStep}
    >
      <AppShell>
        {children}
      </AppShell>
    </OnboardingGuard>
  );
}
