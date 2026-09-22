"use client";

// Écran affiché à la place du tableau de bord tant que l'adresse e-mail
// n'est pas confirmée.
//
// Bloquant, par choix : un compte dont l'adresse n'a jamais été validée ne
// doit rien pouvoir faire sur la plateforme (demandes, devis, réservations,
// messages). La personne garde deux issues : renvoyer le lien, ou se
// déconnecter pour reprendre avec une autre adresse.
import { useState } from "react";
import { useRouter } from "next/navigation";
import { MailCheck, RefreshCw, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

export function ConfirmationRequise({ email }: { email: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const [envoi, setEnvoi] = useState(false);
  const [verif, setVerif] = useState(false);

  async function renvoyer() {
    setEnvoi(true);
    try {
      await fetch("/api/proxy/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      toast({
        title: "Lien renvoyé",
        description: `Regardez dans ${email}, et dans les indésirables, au cas où.`,
      });
    } catch {
      toast({
        title: "Envoi impossible",
        description: "Réessayez dans un instant.",
        variant: "error",
      });
    } finally {
      setEnvoi(false);
    }
  }

  function verifier() {
    setVerif(true);
    router.refresh();
    setTimeout(() => setVerif(false), 1500);
  }

  async function deconnexion() {
    await fetch("/api/auth/session", { method: "DELETE" });
    router.push("/login");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-8 shadow-sm">
        <div className="mb-5 flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <MailCheck className="size-6" aria-hidden />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Confirmez votre adresse e-mail
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Nous avons envoyé un lien de confirmation à{" "}
          <span className="font-medium text-foreground">{email}</span>. Cliquez
          dessus pour ouvrir votre espace. Pensez à regarder dans les
          indésirables.
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Tant que l&apos;adresse n&apos;est pas confirmée, votre espace reste
          fermé : c&apos;est ce qui garantit à tout le monde que les comptes
          Les Extras sont bien tenus par de vraies personnes.
        </p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Button type="button" onClick={verifier} disabled={verif}>
            <RefreshCw className={verif ? "size-4 animate-spin" : "size-4"} aria-hidden />
            J&apos;ai confirmé
          </Button>
          <Button type="button" variant="outline" onClick={renvoyer} disabled={envoi}>
            {envoi ? "Envoi…" : "Renvoyer le lien"}
          </Button>
        </div>

        <button
          type="button"
          onClick={deconnexion}
          className="mt-6 inline-flex items-center gap-2 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          <LogOut className="size-4" aria-hidden />
          Ce n&apos;est pas la bonne adresse ? Se déconnecter
        </button>
      </div>
    </main>
  );
}
