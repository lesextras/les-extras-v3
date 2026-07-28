"use client";

// BANDEAU COOKIES.
//
// Parti pris assumé, et il est rare : la plateforme n'utilise AUCUN traceur
// publicitaire ni de mesure d'audience. Les seuls cookies posés sont
// strictement nécessaires au fonctionnement (session, compte actif), et la
// réglementation n'exige pas de consentement pour ceux-là — elle exige de
// l'information.
//
// On ne simule donc pas un choix qui n'existe pas : pas de faux bouton
// « Refuser » qui ne refuserait rien, pas de mur de consentement. On informe,
// on détaille, et on laisse fermer. Le jour où un outil de mesure sera ajouté,
// ce composant devra devenir un vrai gestionnaire de consentement.
import { useEffect, useState } from "react";
import Link from "next/link";
import { Cookie, ShieldCheck, X, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";

const CLE = "lx.cookies.info.v1";

const DETAIL = [
  {
    nom: "lesextras_session",
    role: "Vous garde connecté d'une page à l'autre",
    duree: "7 jours",
    type: "Nécessaire",
  },
  {
    nom: "lesextras_account",
    role: "Mémorise le compte actif quand vous en avez plusieurs",
    duree: "7 jours",
    type: "Nécessaire",
  },
  {
    nom: "Préférences d'affichage",
    role: "Menu replié, aides déjà lues, campagne d'arrivée — stockées dans votre navigateur",
    duree: "Jusqu'à effacement",
    type: "Local",
  },
];

export function BandeauCookies() {
  const [visible, setVisible] = useState(false);
  const [detaille, setDetaille] = useState(false);

  useEffect(() => {
    try {
      if (!window.localStorage.getItem(CLE)) setVisible(true);
    } catch {
      /* stockage indisponible : on n'insiste pas */
    }
  }, []);

  function fermer() {
    try {
      window.localStorage.setItem(CLE, new Date().toISOString());
    } catch {
      /* rien à faire */
    }
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="region"
      aria-label="Information sur les cookies"
      className="theme-sombre fixed inset-x-0 bottom-0 z-[60] border-t border-border bg-card/95 p-4 text-foreground shadow-card backdrop-blur-md md:p-5"
    >
      <div className="mx-auto flex max-w-[1200px] flex-col gap-4">
        <div className="flex flex-wrap items-start gap-4">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
            <Cookie className="size-5" aria-hidden />
          </span>

          <div className="min-w-0 flex-1">
            <p className="font-semibold">Ce site n&apos;utilise que des cookies indispensables</p>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              Aucun traceur publicitaire, aucun outil de mesure d&apos;audience, aucun partage avec
              des tiers. Les seuls cookies déposés servent à vous garder connecté et à mémoriser
              votre compte actif — sans eux, la plateforme ne fonctionne pas. C&apos;est pour cela
              qu&apos;il n&apos;y a rien à refuser ici.
            </p>

            <button
              type="button"
              onClick={() => setDetaille((v) => !v)}
              aria-expanded={detaille}
              className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
            >
              {detaille ? "Masquer le détail" : "Voir exactement ce qui est stocké"}
              <ChevronDown
                className={`size-4 transition-transform ${detaille ? "rotate-180" : ""}`}
                aria-hidden
              />
            </button>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/legal/cookies">La politique complète</Link>
            </Button>
            <Button size="sm" onClick={fermer}>
              J&apos;ai compris
            </Button>
            <button
              type="button"
              onClick={fermer}
              aria-label="Fermer cette information"
              className="rounded-md p-1.5 text-muted-foreground transition hover:text-foreground"
            >
              <X className="size-4" aria-hidden />
            </button>
          </div>
        </div>

        {detaille ? (
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead className="border-b border-border text-left text-muted-foreground">
                <tr>
                  <th className="p-3 font-medium">Nom</th>
                  <th className="p-3 font-medium">À quoi ça sert</th>
                  <th className="p-3 font-medium">Durée</th>
                  <th className="p-3 font-medium">Type</th>
                </tr>
              </thead>
              <tbody>
                {DETAIL.map((c) => (
                  <tr key={c.nom} className="border-b border-border/60 last:border-0">
                    <td className="p-3 font-mono text-xs">{c.nom}</td>
                    <td className="p-3 text-muted-foreground">{c.role}</td>
                    <td className="p-3 text-muted-foreground">{c.duree}</td>
                    <td className="p-3">
                      <span className="inline-flex items-center gap-1 rounded-full bg-success/12 px-2 py-0.5 text-xs text-success">
                        <ShieldCheck className="size-3" aria-hidden />
                        {c.type}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>
    </div>
  );
}
