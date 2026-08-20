// Politique de cookies — page de référence liée depuis le bandeau et le pied
// de page. Elle décrit ce qui est réellement déposé, pas un texte type.
import type { Metadata } from "next";
import Link from "next/link";
import { Cookie, ShieldCheck, HardDrive, Ban, ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "../../../_shared/ui";
import { ChoixMesure } from "../../../_shared/ChoixMesure";

/**
 * La page décrit ce que le site fait RÉELLEMENT : elle bascule sur la même
 * variable que le bandeau. Impossible de poser le tag et d'oublier de mettre
 * cette page à jour — c'était le risque principal de cette évolution.
 */
const MESURE_ACTIVE = (process.env.NEXT_PUBLIC_GOOGLE_ADS_ID ?? "").trim().length > 0;

export const metadata: Metadata = {
  title: "Cookies et stockage local",
  description: MESURE_ACTIVE
    ? "Ce que Les Extras dépose sur votre navigateur : les cookies indispensables au fonctionnement, et un cookie de mesure de campagne soumis à votre accord."
    : "Ce que Les Extras dépose sur votre navigateur : uniquement des cookies indispensables au fonctionnement. Aucun traceur publicitaire, aucune mesure d'audience.",
  alternates: { canonical: "/legal/cookies" },
  openGraph: { url: "/legal/cookies", title: "Cookies et stockage local" },
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
  {
    nom: "lx.source.v1",
    role: "Le mot-clé de la campagne par laquelle vous êtes arrivé (ex. « google »), pour savoir où communiquer. Effacé à la fermeture de l'onglet.",
  },
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

      {MESURE_ACTIVE ? (
        <>
          <Card className="border-secondary/30 bg-secondary/5">
            <CardContent className="flex gap-4 pt-6">
              <Ban className="mt-0.5 size-6 shrink-0 text-secondary" aria-hidden />
              <div>
                <h2 className="font-semibold">Un seul cookie non essentiel, et seulement si vous l&apos;acceptez</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  L&apos;association finance sa visibilité par de la publicité en ligne. Pour savoir
                  quelle annonce amène réellement des inscriptions — et arrêter celles qui ne
                  servent à rien — nous utilisons la mesure de conversion de Google Ads.
                  <strong className="text-foreground">
                    {" "}
                    Rien n&apos;est chargé tant que vous n&apos;avez pas répondu
                  </strong>
                  , et refuser est aussi simple qu&apos;accepter.
                </p>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Ce qui remonte : le fait qu&apos;une inscription a eu lieu, et s&apos;il
                  s&apos;agit d&apos;un établissement ou d&apos;un intervenant. Ce qui ne remonte
                  jamais : votre nom, votre adresse e-mail, le nom de votre structure, et rien
                  absolument rien de ce que vous écrivez dans la plateforme. Toujours aucun pixel de
                  réseau social, aucun Matomo, aucun profilage publicitaire.
                </p>
              </div>
            </CardContent>
          </Card>

          <ChoixMesure />
        </>
      ) : (
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
      )}

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
          Ce ne sont pas des cookies : ces informations restent dans le stockage de votre
          navigateur. Elles servent à retrouver l&apos;interface comme vous l&apos;aviez laissée.
          Une seule fait exception, <code className="font-mono text-xs">lx.source.v1</code> : si
          vous créez un compte, le mot-clé de campagne qu&apos;elle contient est enregistré avec
          ce compte, pour que l&apos;association sache quelle communication a fonctionné. Aucun
          identifiant, aucun suivi d&apos;une page à l&apos;autre, aucun partage.
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
        {MESURE_ACTIVE
          ? "Cette page est engendrée depuis la configuration réelle du site : elle ne peut pas décrire un état qui ne serait plus le sien. Si un autre outil venait à être ajouté, un choix vous serait demandé avant tout dépôt, comme pour celui-ci."
          : "Cette page décrit l’état du site au moment de sa dernière mise à jour. Si un outil de mesure d’audience venait à être ajouté, un véritable choix de consentement serait mis en place avant tout dépôt."}
      </p>
    </div>
  );
}
