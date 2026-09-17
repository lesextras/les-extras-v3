/**
 * LE TABLEAU DE BORD D'UN COMPTE QUI ATTEND SON ÉTABLISSEMENT.
 *
 * ⚠⚠ CE N'ÉTAIT PAS UN TABLEAU DE BORD, ET ÇA SE VOYAIT (17/09/2026).
 *
 * Depuis le 25/08, `(dashboard)/layout.tsx` REMPLACE la page demandée par cet
 * écran tant que `enAttenteRattachement` est vrai. Le motif tient toujours :
 * le serveur refuse déjà ces routes, et une succession d'erreurs ne dit pas à
 * la personne ce qu'on attend d'elle. Mais ce qui s'affichait à la place était
 * une page d'attente — un titre, un formulaire, deux boutons — alors que
 * TOUS LES AUTRES COMPTES reçoivent un tableau de bord. Quelqu'un qui se
 * connecte pour la première fois sur un compte autre qu'administrateur voit
 * donc, littéralement, « pas de tableau de bord ».
 *
 * Or le menu de gauche (`attenteRattachementNav`) lui ouvre déjà Opportunités,
 * Mes interventions, Mes ateliers, Mes formations, Mon planning, Mon dossier
 * et LEX. Ce qui manquait n'était pas l'accès : c'était l'écran qui en rend
 * compte — une salutation, des chiffres à soi, et la marche à suivre en tête.
 *
 * ⚠ LES CHIFFRES NE VIENNENT QUE DES ROUTES QUE LE SERVEUR OUVRE À CE COMPTE.
 * `apps/api/src/common/guards/rattachement.ts` laisse passer `billing` et
 * `conformite` ; il refuse `dashboard/stats`, `missions`, `bookings` et
 * `services`. Ajouter ici une carte alimentée par l'une de ces quatre-là
 * afficherait une erreur là où on voulait un chiffre — et ce serait pire
 * qu'une carte absente.
 *
 * Ce n'est pas une page d'erreur : la personne n'a rien fait de travers.
 */
import Link from "next/link";
import {
  ArrowRight,
  Building2,
  CalendarClock,
  CalendarCheck,
  FolderCheck,
  Lock,
  PenLine,
  Sparkles,
  Target,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { fetchApi } from "./server";
import { PageHeader, StatCard, SectionTitle } from "./ui";
import type { Session } from "./types";
import { DemandeRattachement } from "./DemandeRattachement";

/** Ce que renvoie `/billing/utilisation` — voir `credits.service.ts`. */
interface Utilisation {
  credits?: number;
  illimite?: boolean;
  consomme30Jours?: number;
  offreGratuite?: { mensuel?: number; permanente?: boolean };
}

/** Ce que renvoie `/conformite/mes-documents` — voir `MonDossier.tsx`. */
interface Dossier {
  completeness?: { total: number; valid: number; pct: number; missing: number };
}

/** Les portes que le menu ouvre déjà : on les met aussi sous la main. */
const RACCOURCIS = [
  {
    href: "/dashboard/assistant",
    icon: PenLine,
    label: "Écrire avec LEX",
    aide: "Vos notes deviennent un écrit professionnel, les noms masqués.",
  },
  {
    href: "/dashboard/mon-dossier",
    icon: FolderCheck,
    label: "Compléter mon dossier",
    aide: "Identité, diplôme, casier : prêts le jour du rattachement.",
  },
  {
    href: "/dashboard/opportunites",
    icon: Target,
    label: "Voir les opportunités",
    aide: "Ce qui est ouvert dans le réseau, en lecture.",
  },
  {
    href: "/dashboard/planning",
    icon: CalendarClock,
    label: "Mon planning",
    aide: "Votre agenda — importez celui que vous avez déjà.",
  },
  {
    href: "/dashboard/reservations",
    icon: CalendarCheck,
    label: "Mes interventions",
    aide: "Ce qu'on vous a confié, et les engagements en attente.",
  },
] as const;

export async function EnAttenteRattachement({
  session,
  prenom,
  demandes,
}: {
  session: Session;
  /** Prénom lu sur `/auth/me` par le layout : le jeton ne le porte pas. */
  prenom?: string | null;
  /** Demandes déjà envoyées, en attente de réponse. */
  demandes?: { id: string; nom: string; envoyeeLe?: string | null }[];
}) {
  const accountId = session.account.id;
  const enAttente = demandes ?? [];

  // ⚠ LES DEUX APPELS EN PARALLÈLE, ET AUCUN N'EST BLOQUANT. `fetchApi` ne
  // lève jamais : une API muette laisse une carte à zéro, elle ne vide pas
  // l'écran. C'est l'inverse qui coûterait cher — la demande de rattachement,
  // qui est la seule action utile ici, disparaîtrait avec le reste.
  const [utilisation, dossier] = await Promise.all([
    fetchApi<Utilisation>(session, "/billing/utilisation"),
    fetchApi<Dossier>(session, "/conformite/mes-documents"),
  ]);

  const u = utilisation.data ?? {};
  const d = dossier.data?.completeness;
  const mensuel = u.offreGratuite?.mensuel ?? 0;

  const salutation = prenom?.trim() || session.user.firstName?.trim();

  return (
    <div className="space-y-8">
      <PageHeader
        title={salutation ? `Bonjour ${salutation}` : "Bonjour"}
        subtitle="Votre compte est ouvert. Les missions, les réservations et la facturation appartiennent à la maison qui vous emploie : elles s’ouvriront dès qu’un établissement vous aura rattaché. En attendant, LEX, votre dossier et votre planning sont à vous."
        actions={
          <Badge variant="warning" className="inline-flex items-center gap-1.5">
            <Building2 className="size-3.5" aria-hidden />
            En attente de rattachement
          </Badge>
        }
      />

      {/* ⚠ LES QUATRE CHIFFRES S'AFFICHENT TOUJOURS, MÊME À ZÉRO — c'est la
          règle posée le 21/08/2026 pour le hub : un zéro est une information,
          et un tableau de bord qui n'affiche ses cartes qu'à partir de la
          première activité n'en est pas un le premier jour. */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Crédits LEX"
          value={u.illimite ? "∞" : (u.credits ?? 0)}
          hint={
            u.illimite
              ? "Accès illimité"
              : mensuel > 0
                ? `${mensuel} générations offertes chaque mois`
                : "Dotation mensuelle offerte"
          }
          accent="teal"
        />
        <StatCard
          label="Écrits produits"
          value={u.consomme30Jours ?? 0}
          hint="30 derniers jours"
          accent="terracotta"
        />
        <StatCard
          label="Mon dossier"
          value={`${d?.pct ?? 0}%`}
          hint={
            d && d.missing > 0
              ? `${d.missing} pièce${d.missing > 1 ? "s" : ""} à déposer`
              : d
                ? "Complet"
                : "À compléter"
          }
        />
        <StatCard
          label="Demandes envoyées"
          value={enAttente.length}
          hint={enAttente.length > 0 ? "en attente de réponse" : "aucune pour l’instant"}
          accent="warning"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* ⚠ LA DEMANDE DE RATTACHEMENT RESTE EN TÊTE ET EN GRAND. C'est la
            seule action qui change l'état du compte ; la reléguer à côté des
            raccourcis ferait un écran agréable où personne ne ferait le
            geste attendu. */}
        <div className="space-y-6 lg:col-span-2">
          <Card className="border-primary/30">
            <CardHeader>
              <SectionTitle
                title={enAttente.length > 0 ? "Votre rattachement" : "Rejoignez votre établissement"}
              />
            </CardHeader>
            <CardContent className="space-y-5">
              {enAttente.length > 0 ? (
                <div className="space-y-2 rounded-xl border border-primary/30 bg-primary-soft/40 p-4">
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    {enAttente.map((demande) => (
                      <li key={demande.id}>
                        <span className="font-medium text-foreground">{demande.nom}</span>, en
                        attente de réponse
                        {demande.envoyeeLe ? ` (envoyée le ${demande.envoyeeLe})` : ""}
                      </li>
                    ))}
                  </ul>
                  <p className="text-sm text-muted-foreground">
                    Vous serez prévenu ici et par e-mail dès qu’une réponse arrive. Une même adresse
                    peut être rattachée à plusieurs établissements : vous pouvez en demander un
                    autre en attendant.
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Cherchez votre maison par son nom. Elle verra votre demande dans son espace
                  « Équipe », et tout s’ouvre dès qu’elle l’accepte.
                </p>
              )}

              <DemandeRattachement accountId={accountId} />
            </CardContent>
          </Card>
        </div>

        {/* Colonne latérale : ce qui est ouvert dès maintenant. */}
        <div className="space-y-6">
          <Card className="bg-primary/5">
            <CardHeader>
              <SectionTitle title="Ce que vous pouvez déjà faire" />
            </CardHeader>
            <CardContent className="space-y-2">
              {RACCOURCIS.map(({ href, icon: Icone, label, aide }) => (
                <Button
                  key={href}
                  asChild
                  variant="outline"
                  className="h-auto w-full justify-start gap-3 py-3 text-left"
                >
                  <Link href={href}>
                    <Icone className="size-4 shrink-0 text-primary" aria-hidden />
                    <span className="min-w-0 flex-1">
                      <span className="block font-medium text-foreground">{label}</span>
                      <span className="block text-xs font-normal text-muted-foreground">
                        {aide}
                      </span>
                    </span>
                    <ArrowRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                  </Link>
                </Button>
              ))}
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-primary/10 via-transparent to-secondary/10">
            <CardContent className="space-y-2 p-5">
              <h2 className="flex items-center gap-2 font-semibold text-foreground">
                <Sparkles className="size-4 text-primary" aria-hidden />
                LEX est ouvert dès maintenant
              </h2>
              <p className="text-sm text-muted-foreground">
                Vos notes brutes deviennent un écrit professionnel, les noms sont masqués avant tout
                envoi, et rien de ce que vous écrivez n’est conservé. C’est la seule chose que vous
                pouvez faire seul dès le premier jour — et c’est celle qui sert le plus.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <p className="flex items-start gap-2 text-xs text-muted-foreground">
        <Lock className="mt-0.5 size-3.5 shrink-0" aria-hidden />
        Vous vous êtes trompé de profil ? Un compte d’intervenant indépendant, lui, publie et
        facture sans rattachement. Écrivez-nous depuis « Support », en haut à droite : nous le
        changeons sans vous faire recréer de compte.
      </p>
    </div>
  );
}
