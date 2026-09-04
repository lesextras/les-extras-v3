"use client";

// « RECEVOIR LA FICHE RÉCAP PAR E-MAIL » — 4/09/2026.
//
// Le geste qui manquait sur les douze fiches de parcours : la fiche renvoyait
// vers Teachizy, qui gardait l'adresse, et Les Extras ne conservait rien. Ici
// la personne donne son adresse pour un document qu'elle veut vraiment, en
// consentement daté — c'est la base propre qui remplace la base achetée.
//
// ⚠ DEUX CONSENTEMENTS, ET ILS RESTENT SÉPARÉS. L'envoi de la fiche est le
// service demandé. La séquence d'accueil (les parcours suivants) est une case
// à part, DÉCOCHÉE par défaut : sans elle, on ne renvoie jamais rien d'autre
// que la fiche. Pré-cocher cette case ferait de tout le dispositif un
// consentement de façade, exactement ce qui rend une base invendable.
import { useState } from "react";
import { Mail, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiRequest } from "@/lib/api";
import { sourceComplete } from "@/lib/source";

export function CaptureFiche({ slug, titre }: { slug: string; titre: string }) {
  const [ouvert, setOuvert] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const origine = sourceComplete();
    const body = {
      email: String(fd.get("email") || "").trim(),
      prenom: String(fd.get("prenom") || "").trim() || undefined,
      slug,
      consentTunnel: fd.get("suite") === "on",
      website: String(fd.get("website") || "") || undefined,
      source: origine.source,
      sourceMedium: origine.medium,
      sourceCampaign: origine.campaign,
      sourceLanding: origine.landing,
    };
    try {
      await apiRequest("/public/captures", { method: "POST", body });
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Envoi impossible. Réessayez.");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-md border border-success/30 bg-success/10 p-3 text-sm text-foreground">
        <p className="flex items-center gap-2 font-medium">
          <Check className="size-4 text-success" /> La fiche part dans votre boîte.
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Si elle n&apos;arrive pas dans les minutes qui viennent, regardez les courriers
          indésirables&nbsp;: elle vient de Les Extras.
        </p>
      </div>
    );
  }

  if (!ouvert) {
    return (
      <Button type="button" variant="outline" className="w-full" onClick={() => setOuvert(true)}>
        <Mail className="mr-2 size-4" /> Recevoir la fiche récap par e-mail
      </Button>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3 rounded-md border border-border bg-muted/40 p-3">
      <p className="text-sm font-medium text-foreground">La fiche A4 de « {titre} », par e-mail</p>
      {/* Champ-piège : hors flux, jamais rempli par un humain. */}
      <div aria-hidden="true" className="absolute -left-[9999px] top-0 h-0 w-0 overflow-hidden">
        <label>
          Site web
          <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <div className="grid gap-2 sm:grid-cols-[1fr_2fr]">
        <Input name="prenom" placeholder="Prénom (facultatif)" maxLength={60} aria-label="Prénom" />
        <Input
          name="email"
          type="email"
          required
          placeholder="votre@adresse.fr"
          maxLength={160}
          aria-label="Adresse e-mail"
          autoComplete="email"
        />
      </div>
      <label className="flex items-start gap-2 text-xs text-muted-foreground">
        <input type="checkbox" name="suite" className="mt-0.5" />
        <span>
          Recevoir aussi les parcours suivants&nbsp;: six messages, un tous les trois jours,
          chacun avec un outil utilisable le jour même. Désabonnement en un clic.
        </span>
      </label>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
      <div className="flex flex-wrap items-center gap-2">
        <Button type="submit" size="sm" disabled={loading}>
          {loading ? "Envoi…" : "Envoyer la fiche"}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => setOuvert(false)}>
          Annuler
        </Button>
      </div>
      <p className="text-[11px] leading-snug text-muted-foreground">
        Votre adresse ne sert qu&apos;à cet envoi, et à la séquence si vous l&apos;avez cochée.
        Elle n&apos;est ni vendue ni partagée. Association ADéPA, Melun.
      </p>
    </form>
  );
}

/**
 * « PARTAGER À UN COLLÈGUE » — la fiche voyage de main en main.
 *
 * Une page A4 punaisée en salle d'équipe est vue par dix personnes. Ici on
 * facilite le passage numérique : copie du lien, ou un courriel prérempli. Pas
 * de bouton par réseau social — un professionnel du médico-social partage à
 * un collègue précis, pas à son fil.
 */
export function PartagerFiche({ slug, titre }: { slug: string; titre: string }) {
  const [copie, setCopie] = useState(false);
  const url = `https://les-extras.fr/formations/${slug}`;
  const sujet = encodeURIComponent(`Un parcours gratuit : ${titre}`);
  const corps = encodeURIComponent(
    `Bonjour,\n\nJe te transmets ce parcours gratuit de l’association ADéPA : « ${titre} ». 45 minutes de lecture, quatre modules, une fiche récap A4 à imprimer.\n\n${url}\n\n`,
  );

  async function copier() {
    try {
      await navigator.clipboard.writeText(url);
      setCopie(true);
      setTimeout(() => setCopie(false), 2500);
    } catch {
      /* presse-papiers refusé : le lien reste visible dans la barre d'adresse */
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs">
      <span className="text-muted-foreground">Partager à un collègue&nbsp;:</span>
      <button
        type="button"
        onClick={copier}
        className="rounded border border-border px-2 py-1 text-foreground transition hover:bg-muted"
      >
        {copie ? "Lien copié" : "Copier le lien"}
      </button>
      <a
        href={`mailto:?subject=${sujet}&body=${corps}`}
        className="rounded border border-border px-2 py-1 text-foreground transition hover:bg-muted"
      >
        Par e-mail
      </a>
    </div>
  );
}
