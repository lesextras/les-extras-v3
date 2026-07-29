// Acceptation d'une invitation à rejoindre un compte.
//
// Cette page manquait. L'e-mail d'invitation pointe depuis toujours vers
// /invitations/accept?token=… , mais la route n'a jamais été créée : le bouton
// « Rejoindre l'équipe » tombait sur un 404, et personne ne pouvait rejoindre
// une équipe depuis l'invitation reçue.
import type { Metadata } from "next";
import { Suspense } from "react";
import { AccepterInvitation } from "../../_shared/AccepterInvitation";

export const metadata: Metadata = {
  title: "Rejoindre l'équipe",
  robots: { index: false, follow: false },
};

export default function AccepterInvitationPage({
  searchParams,
}: {
  searchParams?: { token?: string };
}) {
  return (
    <div className="theme-sombre flex min-h-screen items-center justify-center bg-background px-6 py-16 text-foreground">
      <Suspense>
        <AccepterInvitation token={searchParams?.token} />
      </Suspense>
    </div>
  );
}
