// Confirmation d'adresse e-mail — la cible du bouton envoyé à l'inscription.
//
// Cette page manquait : le lien du mail tombait sur un 404, et personne ne
// pouvait donc confirmer son adresse. Elle valide le jeton, puis ouvre
// l'espace connecté.
import type { Metadata } from "next";
import { Suspense } from "react";
import { VerifyEmail } from "../_shared/VerifyEmail";

export const metadata: Metadata = {
  title: "Confirmation de votre adresse",
  robots: { index: false, follow: false },
};

export default function VerifyEmailPage({
  searchParams,
}: {
  searchParams?: { token?: string };
}) {
  return (
    <div className="theme-sombre flex min-h-screen items-center justify-center bg-background px-6 py-16 text-foreground">
      <Suspense>
        <VerifyEmail token={searchParams?.token} />
      </Suspense>
    </div>
  );
}
