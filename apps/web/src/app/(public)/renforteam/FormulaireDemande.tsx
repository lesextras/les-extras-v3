"use client";

// LE FORMULAIRE #demande DE RENFORTEAM, avec l'intervenant souhaité.
//
// C'est `FormulaireLanding` (`../l/FormulaireLanding.tsx`) plus UNE chose :
// quand la page est ouverte avec `?intervenant=<id>` (bouton « Demander cette
// personne » d'une carte de la team), une ligne en lecture seule
// « Intervenant souhaité : Nom » s'affiche au-dessus des champs, et la même
// ligne part dans le texte de la demande.
//
// ⚠ AUCUN CHAMP D'API N'EST INVENTÉ. La demande reste une demande de contact
// classique (POST /public/contact → /admin/contacts) ; l'intervenant voyage
// dans `content`, le texte libre que l'équipe lit déjà.
//
// ⚠ Si `FormulaireLanding` change (champs, mentions, message de succès), ce
// fichier doit suivre : il en est la copie, à cette ligne près.
import { Suspense, useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Check, UserCheck, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiRequest } from "@/lib/api";
import { sourceComplete } from "@/lib/source";
import { lancerConfettis } from "@/lib/confetti";

type Props = {
  sujet: string;
  bouton: string;
  structure: boolean;
  offre: string;
  /** Les intervenants affichés sur la page, pour retrouver le nom par l'id. */
  intervenants: { id: string; nom: string }[];
};

export function FormulaireDemande(props: Props) {
  // `useSearchParams` sur une page statique exige une frontière Suspense ; le
  // repli est le même formulaire, sans intervenant présélectionné.
  return (
    <Suspense fallback={<Formulaire {...props} cible={null} />}>
      <AvecCible {...props} />
    </Suspense>
  );
}

function AvecCible(props: Props) {
  const params = useSearchParams();
  const id = params.get("intervenant")?.trim() || null;
  const nomParam = params.get("nom")?.trim().slice(0, 120) || null;
  const connu = id ? props.intervenants.find((i) => i.id === id) : undefined;
  const cible = id ? { id, nom: connu?.nom ?? nomParam ?? "intervenant de la team" } : null;
  return <Formulaire {...props} cible={cible} />;
}

function Formulaire({
  sujet,
  bouton,
  structure,
  offre,
  cible,
}: Props & { cible: { id: string; nom: string } | null }) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const racine = useRef<HTMLDivElement>(null);

  // Arrivée par une carte : on amène le formulaire à l'écran.
  useEffect(() => {
    if (!cible) return;
    const reduit = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    racine.current?.scrollIntoView({ behavior: reduit ? "auto" : "smooth", block: "center" });
  }, [cible?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const origine = sourceComplete();
    const nomStructure = String(fd.get("structure") || "").trim();
    const besoin = String(fd.get("besoin") || "").trim();
    const lignes = [
      cible ? `Intervenant souhaité : ${cible.nom} (/intervenants/${cible.id})` : null,
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
          {/* ⚠ Le prénom public est « Sarah » (décision du 4/09/2026). */}
          Vous recevez une réponse de Sarah sous 24 h ouvrées, à l&apos;adresse indiquée. Pas de
          séquence automatique, pas de relance : une réponse.
        </p>
      </div>
    );
  }

  return (
    <div ref={racine}>
      <form onSubmit={onSubmit} className="space-y-3 rounded-xl border border-border bg-card p-5 shadow-sm">
        <p className="text-sm leading-relaxed text-foreground">{offre}</p>
        {cible ? (
          <div
            className="flex items-center gap-3 rounded-lg border border-primary/30 bg-primary-soft px-3 py-2.5 text-sm text-foreground"
            aria-live="polite"
          >
            <UserCheck className="size-4 shrink-0 text-primary" aria-hidden />
            <p className="min-w-0 flex-1">
              Intervenant souhaité : <strong className="font-semibold">{cible.nom}</strong>
            </p>
            <button
              type="button"
              onClick={() => router.replace(`${pathname}#demande`, { scroll: false })}
              className="inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              <X className="size-3.5" aria-hidden />
              Retirer
            </button>
          </div>
        ) : null}
        <div aria-hidden="true" className="absolute -left-[9999px] top-0 h-0 w-0 overflow-hidden">
          <label>
            Site web
            <input type="text" name="website" tabIndex={-1} autoComplete="off" />
          </label>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Champ id="fd-name" libelle="Nom" requis>
            <Input id="fd-name" name="name" required maxLength={120} autoComplete="name" />
          </Champ>
          <Champ id="fd-email" libelle="Adresse e-mail" requis>
            <Input id="fd-email" name="email" type="email" inputMode="email" required maxLength={160} autoComplete="email" />
          </Champ>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {structure ? (
            <Champ id="fd-structure" libelle="Établissement ou structure">
              <Input id="fd-structure" name="structure" maxLength={160} autoComplete="organization" />
            </Champ>
          ) : null}
          <Champ id="fd-phone" libelle="Téléphone">
            <Input id="fd-phone" name="phone" type="tel" inputMode="tel" maxLength={40} autoComplete="tel" />
          </Champ>
        </div>
        <Champ id="fd-besoin" libelle="Votre besoin, en une ligne">
          <Input id="fd-besoin" name="besoin" maxLength={300} />
        </Champ>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <Button type="submit" size="lg" className="w-full" disabled={loading}>
          {loading ? "Envoi…" : bouton}
        </Button>
        <p className="text-[11px] leading-snug text-muted-foreground">
          Votre adresse sert à vous répondre, et à rien d&apos;autre. Association ADéPA, Melun.
          Pas de revente, pas de séquence automatique.
        </p>
      </form>
    </div>
  );
}

function Champ({ id, libelle, requis, children }: { id: string; libelle: string; requis?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="text-sm font-medium text-foreground">
        {libelle}
        {requis ? <span className="text-destructive"> *</span> : <span className="text-muted-foreground"> (facultatif)</span>}
      </label>
      {children}
    </div>
  );
}
