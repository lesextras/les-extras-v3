"use client";

// BANDEAU COOKIES — DEUX VISAGES, SELON CE QUE LE SITE FAIT RÉELLEMENT.
//
// Tant qu'aucune mesure publicitaire n'est configurée, la plateforme ne pose
// que des cookies strictement nécessaires : la loi demande alors d'informer,
// pas de recueillir un accord. On informe, on détaille, on laisse fermer — et
// surtout on n'affiche pas un faux bouton « Refuser » qui ne refuserait rien.
//
// Dès qu'un identifiant Google Ads est renseigné, ce même composant devient un
// vrai gestionnaire de consentement : deux boutons de poids identique, refus
// aussi simple qu'acceptation, aucun script chargé avant la réponse, et choix
// révocable. C'est `mesureConfiguree()` qui bascule, jamais un réglage à la
// main : impossible d'oublier de changer le texte en posant la variable.
import { useEffect, useState } from "react";
import Link from "next/link";
import { Cookie, ShieldCheck, X, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  enregistrerConsentement,
  lireConsentement,
  mesureConfiguree,
  surChangement,
} from "@/lib/consentement";

const CLE_INFO = "lx.cookies.info.v1";

const NECESSAIRES = [
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

const MESURE = [
  {
    nom: "_gcl_au",
    role: "Attribue une inscription à l'annonce qui l'a amenée (Google Ads)",
    duree: "90 jours",
    type: "Mesure",
  },
  {
    nom: "_gac_*",
    role: "Relie la visite à une campagne publicitaire",
    duree: "90 jours",
    type: "Mesure",
  },
];

export function BandeauCookies() {
  const [visible, setVisible] = useState(false);
  const [detaille, setDetaille] = useState(false);
  // Lu une seule fois au montage : la valeur ne peut pas changer d'un rendu à
  // l'autre, et la lire pendant le rendu ferait diverger serveur et client.
  const [avecMesure, setAvecMesure] = useState(false);

  useEffect(() => {
    const configuree = mesureConfiguree();
    setAvecMesure(configuree);
    if (configuree) {
      setVisible(lireConsentement() === "inconnu");
      // Le lien « revenir sur mon choix » rouvre le bandeau.
      return surChangement((v) => setVisible(v === "inconnu"));
    }
    try {
      setVisible(!window.localStorage.getItem(CLE_INFO));
    } catch {
      /* stockage indisponible : on n'insiste pas */
    }
  }, []);

  function accuserReception() {
    try {
      window.localStorage.setItem(CLE_INFO, new Date().toISOString());
    } catch {
      /* rien à faire */
    }
    setVisible(false);
  }

  function repondre(valeur: "accepte" | "refuse") {
    enregistrerConsentement(valeur);
    setVisible(false);
  }

  if (!visible) return null;

  const lignes = avecMesure ? [...NECESSAIRES, ...MESURE] : NECESSAIRES;

  return (
    <div
      role="region"
      aria-label={avecMesure ? "Choix concernant les cookies" : "Information sur les cookies"}
      className="theme-sombre fixed inset-x-0 bottom-0 z-[60] border-t border-border bg-card/95 p-4 text-foreground shadow-card backdrop-blur-md md:p-5"
    >
      <div className="mx-auto flex max-w-[1200px] flex-col gap-4">
        <div className="flex flex-wrap items-start gap-4">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
            <Cookie className="size-5" aria-hidden />
          </span>

          <div className="min-w-0 flex-1">
            {avecMesure ? (
              <>
                <p className="font-semibold">Votre accord pour la mesure de nos campagnes</p>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  Les cookies qui vous gardent connecté sont indispensables et restent posés dans
                  tous les cas. À côté, nous aimerions déposer un cookie de mesure : il nous dit
                  quelle annonce a amené une inscription, et rien de plus — jamais votre identité,
                  jamais le contenu de vos écrits professionnels.{" "}
                  <strong className="text-foreground">
                    Refuser ne change rien à votre utilisation du site.
                  </strong>
                </p>
              </>
            ) : (
              <>
                <p className="font-semibold">Ce site n&apos;utilise que des cookies indispensables</p>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  Aucun traceur publicitaire, aucun outil de mesure d&apos;audience, aucun partage
                  avec des tiers. Les seuls cookies déposés servent à vous garder connecté et à
                  mémoriser votre compte actif — sans eux, la plateforme ne fonctionne pas.
                  C&apos;est pour cela qu&apos;il n&apos;y a rien à refuser ici.
                </p>
              </>
            )}

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

          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/legal/cookies">La politique complète</Link>
            </Button>

            {avecMesure ? (
              <>
                {/* Même taille, même variante, refus en premier : accepter ne
                    doit pas être le chemin le plus facile. */}
                <Button variant="outline" size="sm" onClick={() => repondre("refuse")}>
                  Refuser
                </Button>
                <Button size="sm" onClick={() => repondre("accepte")}>
                  Accepter
                </Button>
              </>
            ) : (
              <>
                <Button size="sm" onClick={accuserReception}>
                  J&apos;ai compris
                </Button>
                <button
                  type="button"
                  onClick={accuserReception}
                  aria-label="Fermer cette information"
                  className="rounded-md p-1.5 text-muted-foreground transition hover:text-foreground"
                >
                  <X className="size-4" aria-hidden />
                </button>
              </>
            )}
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
                {lignes.map((c) => (
                  <tr key={c.nom} className="border-b border-border/60 last:border-0">
                    <td className="p-3 font-mono text-xs">{c.nom}</td>
                    <td className="p-3 text-muted-foreground">{c.role}</td>
                    <td className="p-3 text-muted-foreground">{c.duree}</td>
                    <td className="p-3">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ${
                          c.type === "Mesure"
                            ? "bg-secondary/15 text-secondary"
                            : "bg-success/12 text-success"
                        }`}
                      >
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
