"use client";

import { FormEvent, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle } from "lucide-react";
import { adminLogin } from "@/app/actions/admin-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function AdminLoginPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");

    setError(null);
    startTransition(async () => {
      try {
        await adminLogin({ email, password });
        router.replace("/admin");
        router.refresh();
      } catch (submitError) {
        const message =
          submitError instanceof Error ? submitError.message : "Connexion impossible.";
        setError(message);
      }
    });
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-background px-4">
      {/* Background halos */}
      <div className="pointer-events-none fixed inset-0 halo-primary" aria-hidden="true" />
      <div className="pointer-events-none fixed inset-0 halo-secondary" aria-hidden="true" />

      <div className="relative z-10 w-full max-w-md">
        {/* Glass login card */}
        <div className="glass-surface rounded-lg p-8 shadow-sm">
          <div className="space-y-1 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-2.5 w-2.5 rounded-full bg-primary" aria-hidden="true" />
              <span className="text-lg font-semibold tracking-tight text-foreground">
                LesExtras
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Connexion Desk</h1>
            <p className="text-sm text-muted-foreground">Accès réservé à l’équipe admin Les Extras.</p>
          </div>

          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="username"
                required
                aria-invalid={error ? "true" : undefined}
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                aria-invalid={error ? "true" : undefined}
                className="h-11"
              />
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-md bg-destructive/10 border border-destructive/20 px-3 py-2.5 text-sm text-destructive" role="alert">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" aria-hidden="true" />
                <span>{error}</span>
              </div>
            )}

            <Button className="w-full h-11 shadow-sm" type="submit" disabled={isPending}>
              {isPending ? "Connexion…" : "Se connecter"}
            </Button>
          </form>
        </div>
      </div>
    </main>
  );
}
