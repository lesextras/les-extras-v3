"use client";

// Le formulaire des pages d'atterrissage : une adresse, et le moins possible
// autour. Il dépose une demande de contact classique (POST /public/contact),
// donc elle arrive dans /admin/contacts et prévient l'équipe — aucun circuit
// parallèle à surveiller.
import { useState } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiRequest } from "@/lib/api";
import { sourceComplete } from "@/lib/source";
import { lancerConfettis } from "@/lib/confetti";

export function FormulaireLanding({
  sujet,
  bouton,
  structure,
  offre,
}: {
  sujet: string;
  bouton: string;
  structure: boolean;
  offre: string;
}) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const origine = sourceComplete();
    const nomStructure = String(fd.get("structure") || "").trim();
    const besoin = String(fd.get("besoin") || "").trim();
    const lignes = [
      nomStructure ? `Structure : ${nomStructure}` : null,
      besoin ? `Besoin : ${besoin}` : null,
      `Page : ${typeof window !== "undefined" ? window.location.pathname : ""}`,
      origine.campaign ? `Campagne : ${origine.campaign}` : null,
    ].filter(Boolean);
    const body = {
      name: String(fd.get("name") || "").trim(),
      email: String(fd.get("email") || "").trim(),
      phone: String(fd.get("phone") || "").trim() || undefined,
      type: sujet,
      // Le serveur exige dix caractères : la page et le sujet suffisent
      // toujours, même si la personne n'a rien écrit.
      content: lignes.join("\n"),
      website: String(fd.get("website") || "") || undefined,
      source: origine.source,
    };
    try {
      await apiRequest("/public/contact", { method: "POST", body });
      setDone(true);
      lancerConfettis();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Envoi impossible. Réessayez.");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-xl border border-success/30 bg-success/10 p-5 text-foreground">
        <p className="flex items-center gap-2 font-semibold">
          <Check className="size-5 text-success" /> C&apos;est noté.
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {/* ⚠ LE PRÉNOM PUBLIC EST « SARAH » (décision de Siham, 4/09/2026) : il s'écrit
              Sarah partout où un destinataire ou un visiteur le lit. Les commentaires du
              code continuent de dire Siham — personne d'autre ne les lit. */}
          Vous recevez une réponse de Sarah sous 24 h ouvrées, à l&apos;adresse indiquée. Pas de
          séquence automatique, pas de relance : une réponse.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3 rounded-xl border border-border bg-card p-5 shadow-sm">
      <p className="text-sm leading-relaxed text-foreground">{offre}</p>
      <div aria-hidden="true" className="absolute -left-[9999px] top-0 h-0 w-0 overflow-hidden">
        <label>
          Site web
          <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <Input name="name" required placeholder="Votre nom" maxLength={120} aria-label="Nom" autoComplete="name" />
        <Input
          name="email"
          type="email"
          required
          placeholder="Adresse e-mail"
          maxLength={160}
          aria-label="Adresse e-mail"
          autoComplete="email"
        />
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {structure ? (
          <Input name="structure" placeholder="Établissement (facultatif)" maxLength={160} aria-label="Établissement" autoComplete="organization" />
        ) : null}
        <Input name="phone" type="tel" placeholder="Téléphone (facultatif)" maxLength={40} aria-label="Téléphone" autoComplete="tel" />
      </div>
      <Input name="besoin" placeholder="En une ligne : ce dont vous avez besoin (facultatif)" maxLength={300} aria-label="Votre besoin" />
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Button type="submit" size="lg" className="w-full" disabled={loading}>
        {loading ? "Envoi…" : bouton}
      </Button>
      <p className="text-[11px] leading-snug text-muted-foreground">
        Votre adresse sert à vous répondre, et à rien d&apos;autre. Association ADéPA, Melun.
        Pas de revente, pas de séquence automatique.
      </p>
    </form>
  );
}
