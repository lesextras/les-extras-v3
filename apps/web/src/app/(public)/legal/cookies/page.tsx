// Politique de cookies — page de référence liée depuis le bandeau et le pied
// de page. Elle décrit ce qui est réellement déposé, pas un texte type.
import type { Metadata } from "next";
import Link from "next/link";
import { Cookie, ShieldCheck, HardDrive, Ban, ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "../../../_shared/ui";

export const metadata: Metadata = {
  title: "Cookies et stockage local",
  description:
    "Ce que Les Extras dépose sur votre navigateur : uniquement des cookies indispensables au fonctionnement. Aucun traceur publicitaire, aucune mesure d'audience.",
  alternates: { canonical: "/legal/cookies" },
};

const NECESSAIRES = [
  {
    nom: "lesextras_session",
    role: "Contient votre jeton de connexion. Sans lui, vous seriez déconnecté à chaque page.",
    duree: "7 jours",
    portee: "Cookie httpOnly, inaccessible au JavaScript de la page",
  },
  {
    nom: "lesextras_account",
    role: "Mémorise le compte actif lorsque vous êtes rattaché à plusieurs structures.",
    duree: "7 jours",
    portee: "Cookie lisible par la page, ne contient qu'un identifiant technique",
  },
];

const LOCAL = [
  { nom: "lx.sidebar.mode.*", role: "Menu en vue essentielle ou complète" },
  { nom: "lx.sidebar.collapsed.*", role: "Sections du menu repliées" },
  { nom: "lex-aide-v1:*", role: "Encarts d'aide que vous avez déjà fermés" },
  { nom: "lx.cookies.info.v1", role: "Bandeau d'information déjà lu" },
  { nom: "lx.pwa.dismissed", role: "Proposition d'installation déjà écartée" },
];

export default function CookiesPage() {
  return (
    <div className="space-y-8">
      <Link
        href="/legal"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Mentions légales
      </Link>

      <PageHeader
        title="Cookies et stockage local"
        subtitle="Ce que Les Extras dépose réellement sur votre navigateur — la liste complète, pas un texte type."
      />

      <Card className="border-success/30 bg-success/5">
        <CardContent className="flex gap-4 pt-6">
          <Ban className="mt-0.5 size-6 shrink-0 text-success" aria-hidden />
          <div>
            <h2 className="font-semibold">Ce que nous n&apos;utilisons pas</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Aucun cookie publicitaire. Aucun outil de mesure d&apos;audience — pas de Google
              Analytics, pas de Matomo, pas de pixel de réseau social. Aucun partage de données de
              navigation avec un tiers. Aucun profilage.
            </p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              C&apos;est la raison pour laquelle vous ne trouverez pas de bouton « Refuser » : il
              n&apos;y a rien à refuser. Les seuls cookies déposés sont indispensables au
              fonctionnement, et la réglementation les dispense de consentement — elle impose en
              revanche de vous en informer, ce que fait cette page.
            </p>
          </div>
        </CardContent>
      </Card>

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Cookie className="size-5 text-primary" aria-hidden />
          <h2 className="text-lg font-semibold">Cookies strictement nécessaires</h2>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {NECESSAIRES.map((c) => (
            <Card key={c.nom}>
              <CardContent className="space-y-2 pt-6">
                <p className="font-mono text-sm font-medium">{c.nom}</p>
                <p className="text-sm text-muted-foreground">{c.role}</p>
                <div className="flex flex-wrap gap-3 pt-1 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <ShieldCheck className="size-3 text-success" aria-hidden />
                    Nécessaire
                  </span>
                  <span>Durée : {c.duree}</span>
                </div>
                <p className="text-xs text-muted-foreground">{c.portee}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <HardDrive className="size-5 text-primary" aria-hidden />
          <h2 className="text-lg font-semibold">Préférences stockées dans votre navigateur</h2>
        </div>
        <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
          Ce ne sont pas des cookies : ces informations restent dans le stockage local de votre
          navigateur et ne sont <strong>jamais transmises à nos serveurs</strong>. Elles servent
          uniquement à retrouver l&apos;interface comme vous l&apos;aviez laissée.
        </p>
        <Card>
          <CardContent className="p-0">
            <ul className="divide-y divide-border">
              {LOCAL.map((l) => (
                <li key={l.nom} className="flex flex-wrap items-center gap-3 px-5 py-3 text-sm">
                  <span className="font-mono text-xs">{l.nom}</span>
                  <span className="text-muted-foreground">{l.role}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Comment tout effacer</h2>
        <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
          Vider les données du site depuis les réglages de votre navigateur supprime l&apos;ensemble :
          cookies de session et préférences d&apos;affichage. Vous serez simplement déconnecté et
          l&apos;interface repartira de ses réglages par défaut. Pour vos données de compte, la page{" "}
          <Link href="/dashboard/donnees-personnelles" className="text-primary hover:underline">
            Mes données personnelles
          </Link>{" "}
          permet l&apos;export et la suppression au titre du RGPD.
        </p>
      </section>

      <p className="text-xs text-muted-foreground">
        Cette page décrit l&apos;état du site au moment de sa dernière mise à jour. Si un outil de
        mesure d&apos;audience venait à être ajouté, un véritable choix de consentement serait mis
        en place avant tout dépôt.
      </p>
    </div>
  );
}
