// Accepter une enveloppe LEX (24/09/2026) : un compte prend en charge les
// générations LEX de la personne invitée. Voir `apps/api/src/billing/enveloppes.service.ts`.
import type { Metadata } from "next";
import { Suspense } from "react";
import { RejoindreEnveloppe } from "../../_shared/RejoindreEnveloppe";

export const metadata: Metadata = {
  title: "Générations LEX offertes",
  robots: { index: false, follow: false },
};

export default async function PageRejoindreEnveloppe({
  searchParams: promesse,
}: {
  searchParams?: Promise<{ jeton?: string }>;
}) {
  const searchParams = await promesse;
  return (
    <main id="main" className="theme-sombre flex min-h-screen items-center justify-center bg-background px-6 py-16 text-foreground">
      <Suspense>
        <RejoindreEnveloppe jeton={searchParams?.jeton} />
      </Suspense>
    </main>
  );
}
