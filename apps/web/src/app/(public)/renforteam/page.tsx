// Page publique RenforTeam — le remplacement d'urgence en médico-social.
//
// Elle s'adresse aux deux côtés du métier : l'établissement qui a un poste à
// couvrir demain matin, et l'intervenant qui cherche des missions. Le détail
// des missions ouvertes reste réservé aux comptes : ce sont les besoins de
// structures clientes, ils n'ont pas à être lisibles par leurs concurrents.
import type { Metadata } from "next";
import Link from "next/link";
import {
  Megaphone,
  Clock,
  Users,
  ShieldCheck,
  FileCheck2,
  ArrowRight,
  Lock,
  MapPin,
  Zap,
  Building2,
  UserRound,
  Scale,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { fetchPublic } from "../../_shared/server";
import { formatDate } from "../../_shared/format";
import { metaPublique } from "@/lib/meta";
// Venus de l'accueil le 08/09/2026 : l'accueil traite les trois usages à
// égalité, et le détail du renfort — le formulaire unique, la cascade, les
// écrans du produit — appartient à la page qui raconte le renfort.
import { UnSeulFormulaire } from "../../_shared/UnSeulFormulaire";
import { ApercuProduit } from "../../_shared/ApercuProduit";

export const metadata: Metadata = metaPublique({
  title: "RenforTeam, remplacement urgent en médico-social",
  description:
    "Un poste à couvrir demain matin ? Publiez le besoin. Il descend en cascade : votre équipe, les habitués, le réseau. Le premier qui accepte emporte la mission.",
  path: "/renforteam",
});

interface MissionApercu {
  id: string;
  title: string;
  city: string | null;
  job: string | null;
  startDate: string;
  endDate: string | null;
  emergency: boolean;
  categoryRef?: { title: string } | null;
}

const CASCADE = [
  {
    numero: "1",
    titre: "Votre équipe d’abord",
    texte:
      "Vos salariés d’abord. Moins cher qu’un renfort externe, et personne à présenter au public accueilli.",
  },
  {
    numero: "2",
    titre: "Puis les intervenants déjà venus chez vous",
    texte:
      "Ceux qui connaissent déjà la maison. Ils reprennent le poste sans temps d’adaptation.",
  },
  {
    numero: "3",
    titre: "Enfin la marketplace",
    texte:
      "Sans réponse, le besoin s’ouvre au réseau, classé par correspondance avec votre demande.",
  },
];

const ETABLISSEMENT = [
  { icone: Clock, texte: "Publication en trois minutes : métier, dates, horaires, lieu, taux." },
  { icone: Zap, texte: "Marquez « urgent » et le besoin saute directement à la diffusion large." },
  { icone: Users, texte: "Le premier intervenant qui accepte emporte la mission, pas de tri à faire." },
  // Ce que la plateforme produit est une proposition chiffrée, pas un contrat
  // de travail : c'est l'établissement qui embauche, en son nom propre. Le
  // promettre autrement, c'est promettre de l'intérim qu'on ne fait pas.
  { icone: FileCheck2, texte: "Proposition chiffrée immédiate, puis votre CDD pré-rempli en un clic." },
];

const INTERVENANT = [
  { icone: MapPin, texte: "Des missions près de chez vous, filtrées par métier et disponibilité." },
  { icone: Zap, texte: "Vous acceptez, c’est à vous. Pas de candidature à défendre, pas d’attente." },
  { icone: ShieldCheck, texte: "Structures identifiées, taux horaire brut annoncé avant d’accepter." },
  { icone: FileCheck2, texte: "Vous êtes embauché en CDD par l’établissement : un vrai bulletin de paie, pas une facture." },
];

export default async function SosRenfortPage() {
  // `error` n'était pas déstructuré : une API muette et une plateforme sans
  // aucun besoin ouvert donnaient exactement le même écran. C'est la page que
  // la publicité alimente ; laisser un visiteur conclure « il n'y a rien ici »
  // à cause d'une panne coûte le visiteur ET la confiance.
  const { data, error } = await fetchPublic<{ items: MissionApercu[]; total: number }>(
    "/public/missions?take=6",
  );
  const missions = data?.items ?? [];
  const total = data?.total ?? 0;
  const enPanne = Boolean(error) && missions.length === 0;

  return (
    <div className="space-y-20">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-amber-500/15 via-background to-background px-6 py-16 sm:px-12 sm:py-20">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full bg-amber-500/20 blur-3xl"
        />
        <div className="relative max-w-3xl space-y-6">
          <Badge variant="soft" className="gap-1.5">
            <Megaphone className="size-3.5" />
            RenforTeam
          </Badge>
          <h1 className="text-4xl font-semibold leading-tight tracking-tight text-foreground sm:text-5xl">
            Un arrêt maladie à 21 h. Le poste est couvert avant l’ouverture.
          </h1>
          <p className="text-lg leading-relaxed text-muted-foreground">
Votre équipe, puis les habitués, puis le réseau. Le premier qui accepte emporte la
            mission. Vous l’embauchez en CDD : moins cher que l’intérim, sans requalification.
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button asChild size="lg">
              <Link href="/register?type=etablissement&next=/dashboard/renforts">
                Publier un besoin <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/register?next=/dashboard/opportunites">
                Je cherche des missions
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/*
        ⚠⚠ LA NOTE DE DROIT — VENUE DE L'ACCUEIL LE 16/09/2026, ET ELLE RESTE ICI.

        Elle était en bas de la section « le renfort, en deux » de la page
        d'accueil. Siham l'a fait retirer de là : deux références d'articles
        arrêtaient la lecture au moment où le visiteur cherche encore à savoir
        si le site est pour lui. Elle n'a pas été supprimée pour autant — c'est
        la seule chose qui distingue vraiment Les Extras des plateformes que
        cette décision a sanctionnées, et sa place est ici, sur la page où un
        directeur lit comment se monte un remplacement.

        ⚠ NE PAS LA RENVOYER SUR L'ACCUEIL, et ne pas la retirer d'ici : la page
        promet « sans requalification » trois paragraphes plus haut. Une
        promesse de ce genre sans sa source est exactement ce qu'on reproche aux
        autres.
      */}
      <section className="flex flex-wrap items-center gap-x-5 gap-y-3 rounded-2xl border border-border bg-gradient-to-r from-card via-primary-soft to-card px-6 py-5">
        <Scale className="size-5 shrink-0 text-primary" aria-hidden />
        <p className="min-w-[240px] flex-1 text-sm leading-relaxed text-muted-foreground" lang="fr">
          <strong className="font-semibold text-foreground">
            Un remplacement de poste ne se fait pas en indépendant.
          </strong>{" "}
          Conseil d’État, 11 février 2025, n° 491128 ; LFSS 2025, art. 70. C’est pour cela que le
          renfort de poste passe par un CDD, et que le renfort personnalisé — qui ne remplace
          personne — se facture en prestation.
        </p>
      </section>

      {/* Deux côtés du métier */}
      <section className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border/80">
          <CardContent className="space-y-5 p-8">
            <div className="flex items-center gap-3">
              <span className="grid size-11 place-items-center rounded-xl bg-primary/15 text-primary">
                <Building2 className="size-5" />
              </span>
              <div>
                <p className="text-xl font-medium text-foreground">Vous êtes un établissement</p>
                <p className="text-sm text-muted-foreground">MECS, IME, ITEP, EHPAD, SESSAD…</p>
              </div>
            </div>
            <ul className="space-y-3">
              {ETABLISSEMENT.map((l) => (
                <li key={l.texte} className="flex gap-3 text-sm leading-relaxed text-muted-foreground">
                  <l.icone className="mt-0.5 size-4 shrink-0 text-primary" />
                  {l.texte}
                </li>
              ))}
            </ul>
            <Button asChild variant="outline" className="w-full">
              <Link href="/register?type=etablissement&next=/dashboard/renforts">
                Publier un besoin
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="border-border/80">
          <CardContent className="space-y-5 p-8">
            <div className="flex items-center gap-3">
              <span className="grid size-11 place-items-center rounded-xl bg-amber-500/15 text-amber-400">
                <UserRound className="size-5" />
              </span>
              <div>
                <p className="text-xl font-medium text-foreground">Vous êtes intervenant</p>
                <p className="text-sm text-muted-foreground">
                  Éducateur, moniteur, AES, psychologue…
                </p>
              </div>
            </div>
            <ul className="space-y-3">
              {INTERVENANT.map((l) => (
                <li key={l.texte} className="flex gap-3 text-sm leading-relaxed text-muted-foreground">
                  <l.icone className="mt-0.5 size-4 shrink-0 text-amber-400" />
                  {l.texte}
                </li>
              ))}
            </ul>
            <Button asChild variant="outline" className="w-full">
              <Link href="/register?next=/dashboard/opportunites">
                Je cherche des missions
              </Link>
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* La cascade */}
      <section className="space-y-8">
        <div className="max-w-2xl space-y-3">
          <h2 className="text-3xl font-semibold tracking-tight text-foreground">
            La diffusion en cascade
          </h2>
          <p className="text-muted-foreground">
            Pas de diffusion au hasard. Le besoin descend palier par palier et s’arrête dès qu’il est pourvu.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {CASCADE.map((c) => (
            <div key={c.numero} className="space-y-3">
              <span className="grid size-11 place-items-center rounded-full bg-primary text-lg font-semibold text-primary-foreground">
                {c.numero}
              </span>
              <p className="text-lg font-medium text-foreground">{c.titre}</p>
              <p className="text-sm leading-relaxed text-muted-foreground">{c.texte}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Missions ouvertes, aperçu flouté. Section absente s'il n'y en a pas. */}
      {enPanne ? (
        <section className="rounded-2xl border border-warning/40 bg-warning/5 px-6 py-5">
          <p className="font-medium text-foreground">
            Les missions ouvertes ne s’affichent pas en ce moment
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
Un incident technique de notre côté, pas une absence de besoins. Réessayez dans
            quelques minutes.
          </p>
        </section>
      ) : null}

      {missions.length > 0 ? (
        <section className="space-y-6">
          <div className="max-w-2xl space-y-3">
            <h2 className="text-3xl font-semibold tracking-tight text-foreground">
              {total} {total > 1 ? "missions ouvertes" : "mission ouverte"} en ce moment
            </h2>
            <p className="text-muted-foreground">
              Métier, ville et dates visibles. Le reste s’affiche une fois connecté.
            </p>
          </div>

          <div className="relative">
            <div className="grid gap-3 sm:grid-cols-2" aria-hidden>
              {missions.map((m) => (
                <Card key={m.id} className="border-border/70 bg-card/60">
                  <CardContent className="space-y-3 p-5">
                    <div className="flex flex-wrap items-center gap-2">
                      {m.emergency ? (
                        <Badge variant="destructive" className="gap-1">
                          <Zap className="size-3" /> Urgent
                        </Badge>
                      ) : null}
                      {m.job ? <Badge variant="secondary">{m.job}</Badge> : null}
                      {m.categoryRef?.title ? (
                        <Badge variant="outline">{m.categoryRef.title}</Badge>
                      ) : null}
                    </div>
                    <p className="text-sm font-medium text-foreground/80">{m.title}</p>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      {m.city ? (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="size-3.5" /> {m.city}
                        </span>
                      ) : null}
                      <span className="inline-flex items-center gap-1">
                        <Clock className="size-3.5" />
                        {formatDate(m.startDate)}
                        {m.endDate ? ` → ${formatDate(m.endDate)}` : ""}
                      </span>
                    </div>
                    <p className="select-none text-xs text-muted-foreground/60 blur-[3px]">
                      Taux horaire et structure réservés aux membres connectés
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background via-background/80 to-transparent"
            />
            <div className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-3">
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <Lock className="size-4" />
                Le détail des missions est réservé aux comptes
              </p>
              <Button asChild>
                <Link href="/register?next=/dashboard/opportunites">
                  Je cherche des missions <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      ) : null}

      {/* Un seul formulaire, puis l'intérieur du produit. */}
      <UnSeulFormulaire />

      <ApercuProduit />

      {/* CTA final */}
      <section className="rounded-3xl border border-border bg-card/50 px-6 py-14 text-center sm:px-12">
        <div className="mx-auto max-w-2xl space-y-5">
          <Megaphone className="mx-auto size-8 text-primary" />
          <h2 className="text-3xl font-semibold tracking-tight text-foreground">
            Le prochain arrêt maladie tombera un vendredi soir.
          </h2>
          <p className="text-muted-foreground">
            Cinq minutes, gratuit. Vous ne payez que les renforts réalisés.
          </p>
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <Button asChild size="lg">
              <Link href="/register?type=etablissement&next=/dashboard/renforts">
                Publier un besoin
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/login?next=/dashboard/renforts">Se connecter</Link>
            </Button>
          </div>

          {/* LES DEUX BOUTONS DE FIN DE PAGE S'ADRESSAIENT À L'ÉTABLISSEMENT.
              La page parle pourtant aux deux publics d'un bout à l'autre, et
              c'est l'intervenant qu'on cherche à faire venir. Il repartait
              sans rien à cliquer. */}
          <div className="border-t border-border/60 pt-6">
            <p className="text-sm text-muted-foreground">
Vous êtes intervenant ? C’est l’établissement qui vous embauche en CDD : aucun statut
              d’indépendant n’est nécessaire.
            </p>
            <div className="flex flex-wrap justify-center gap-3 pt-4">
              <Button asChild size="lg" variant="outline">
                <Link href="/register?next=/dashboard/opportunites">
                  Je cherche des missions
                </Link>
              </Button>
              <Button asChild size="lg" variant="ghost">
                <Link href="/intervenant-independant">
                  Proposer aussi mes ateliers
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
