// Aperçu du produit sur la page d'accueil.
//
// Un visiteur ne crée pas de compte pour découvrir ce qu'il y a derrière. Il
// veut voir avant. Plutôt que des captures d'écran — lourdes, vite périmées,
// illisibles sur téléphone et fausses dès qu'on change une couleur — l'écran
// est reconstruit avec les composants et les variables du produit. Il est donc
// net à toutes les tailles, suit la bascule clair/sombre, et ne ment pas.
import Link from "next/link";
import {
  ArrowRight,
  Bell,
  Building2,
  Check,
  ChevronRight,
  Clock,
  Megaphone,
  Users,
} from "lucide-react";

/** Chrome de fenêtre : trois pastilles et une barre d'adresse. */
function Fenetre({ url, children }: { url: string; children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-background shadow-card">
      <div className="flex items-center gap-2 border-b border-border bg-muted/60 px-3 py-2">
        <span className="flex gap-1.5" aria-hidden>
          <span className="size-2.5 rounded-full bg-destructive/50" />
          <span className="size-2.5 rounded-full bg-warning/50" />
          <span className="size-2.5 rounded-full bg-success/50" />
        </span>
        <span className="ml-2 truncate rounded-md bg-background px-2.5 py-0.5 text-[11px] text-muted-foreground">
          {url}
        </span>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

/** La cascade de diffusion, l'idée la plus difficile à expliquer par écrit. */
// L'adresse de la fausse barre d'URL datait d'avant l'inversion des domaines
// du 10/08 : `app.les-extras.fr` sert désormais l'ancien WordPress. Montrer
// une adresse qui n'est plus la bonne, sur la capture censée prouver que le
// produit existe, c'est se tirer une balle dans le pied.
function EcranCascade() {
  const paliers = [
    { titre: "Votre équipe", detail: "4 salariés prévenus", etat: "Sans réponse", icone: Users, actif: false },
    { titre: "Déjà venus chez vous", detail: "6 intervenants prévenus", etat: "Sans réponse", icone: Building2, actif: false },
    { titre: "Le réseau", detail: "23 intervenants correspondants", etat: "Accepté", icone: Megaphone, actif: true },
  ];

  return (
    <Fenetre url="les-extras.fr/dashboard/renforts">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-foreground">Éducateur spécialisé — nuit</p>
          <p className="mt-0.5 text-xs text-muted-foreground">Ce soir 21 h → 7 h · Unité Les Tilleuls</p>
        </div>
        <span className="shrink-0 rounded-full bg-success/15 px-2.5 py-1 text-[11px] font-semibold text-success">
          Pourvu
        </span>
      </div>

      <ol className="mt-4 space-y-2">
        {paliers.map((p) => {
          const Icone = p.icone;
          return (
            <li
              key={p.titre}
              className={`flex items-center gap-3 rounded-lg border p-2.5 ${
                p.actif ? "border-success/40 bg-success/5" : "border-border bg-muted/40"
              }`}
            >
              <span
                className={`grid size-8 shrink-0 place-items-center rounded-lg ${
                  p.actif ? "bg-success/15 text-success" : "bg-background text-muted-foreground"
                }`}
              >
                {p.actif ? <Check className="size-4" aria-hidden /> : <Icone className="size-4" aria-hidden />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-medium text-foreground">{p.titre}</span>
                <span className="block truncate text-[11px] text-muted-foreground">{p.detail}</span>
              </span>
              <span
                className={`shrink-0 text-[11px] font-medium ${
                  p.actif ? "text-success" : "text-muted-foreground"
                }`}
              >
                {p.etat}
              </span>
            </li>
          );
        })}
      </ol>

      <p className="mt-3 flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <Clock className="size-3.5" aria-hidden />
        Contrat généré automatiquement à l’acceptation.
      </p>
    </Fenetre>
  );
}

/** Le téléphone : la notification qui arrive à 21 h. */
function EcranTelephone() {
  return (
    <div className="mx-auto w-[210px] overflow-hidden rounded-[26px] border-[6px] border-foreground/85 bg-background shadow-card">
      <div className="flex items-center justify-between bg-foreground/85 px-4 pb-2 pt-1 text-[10px] font-medium text-background">
        <span>21:04</span>
        <span aria-hidden>▮▮▮</span>
      </div>
      <div className="space-y-2 p-2.5">
        <div className="rounded-xl border border-border bg-card p-2.5 shadow-soft">
          <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
            <Bell className="size-3" aria-hidden />
            Les Extras
          </p>
          <p className="mt-1 text-[12px] font-semibold leading-snug text-foreground">
            Nouveau renfort près de chez vous
          </p>
          <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">
            Éducateur spécialisé — nuit, Melun. Ce soir 21 h → 7 h.
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-2.5">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Rappel
          </p>
          <p className="mt-1 text-[12px] font-semibold leading-snug text-foreground">
            Mission demain 21 h
          </p>
          <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">
            MECS Les Hirondelles — rappel automatique la veille.
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-2.5">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Il y a 2 h
          </p>
          <p className="mt-1 text-[12px] font-semibold leading-snug text-foreground">
            Une réponse à votre situation
          </p>
          <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">
            Un·e éducateur spécialisé a répondu dans le GAP.
          </p>
        </div>
      </div>
    </div>
  );
}

export function ApercuProduit() {
  return (
    <section className="section">
      <div className="mx-auto max-w-2xl text-center">
        <span className="eyebrow">L’intérieur</span>
        <h2 className="mt-4 text-3xl font-bold tracking-tight text-foreground text-balance md:text-4xl">
          Voir avant de créer un compte
        </h2>
        <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
          Un renfort publié à 21 h, la cascade qui descend toute seule, et le téléphone
          qui sonne chez les bonnes personnes.
        </p>
      </div>

      <div className="mt-12 grid items-center gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:gap-14">
        <div className="animate-fade-in-up stagger-1">
          <EcranCascade />
        </div>

        <div className="animate-fade-in-up stagger-2 space-y-6">
          <EcranTelephone />
          <div className="text-center lg:text-left">
            <p className="text-sm font-semibold text-foreground">
              Installable sur le téléphone, notifications comprises
            </p>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
              Pas d’application à télécharger sur un magasin : on ajoute Les Extras à l’écran
              d’accueil, et les alertes arrivent même application fermée.
            </p>
            <Link
              href="/sos-renfort"
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
            >
              Comment marche le renfort
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
        </div>
      </div>

      <div className="mt-12 grid gap-4 sm:grid-cols-3">
        {[
          { titre: "Planning partagé", texte: "Créneaux, missions récurrentes et heures déclarées au même endroit." },
          { titre: "Coffre-fort de conformité", texte: "Diplômes, casier, URSSAF — alerte avant l’échéance." },
          { titre: "Devis, contrat, facture", texte: "Générés depuis la mission. Rien à ressaisir." },
          { titre: "Congés & compteurs", texte: "Demandes d’absence, soldes, heures du mois et export paie en CSV." },
          { titre: "72 h pour ajuster", texte: "Après la mission, chacun vérifie les heures. Passé le délai, tout se valide seul." },
          { titre: "Progression intervenant", texte: "Nouveau, Confirmé, Super Extra : les plus fiables sont prévenus en premier." },
        ].map((c, i) => (
          <div
            key={c.titre}
            className={`animate-fade-in-up ${["stagger-1", "stagger-2", "stagger-3"][i % 3]} rounded-xl border border-border bg-card p-4`}
          >
            <p className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
              <ChevronRight className="size-4 text-primary" aria-hidden />
              {c.titre}
            </p>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{c.texte}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
