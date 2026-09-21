// PAGE « PARTENAIRES ASSOCIATIFS » — demandée par Siham le 3 septembre 2026,
// sur le modèle de place-d.fr/partenaires-associatifs.
//
// ⚠ CE QU'ON N'ÉCRIT PAS ICI. Aucun nom de partenaire, aucun logo, aucun
// témoignage : l'association n'a pas encore de partenariat associatif publié,
// et une page qui en afficherait vaudrait mieux que rien exactement jusqu'au
// jour où quelqu'un demande lequel. La section « ils sont déjà partenaires »
// du modèle est donc remplacée par un appel à partenariat assumé — c'est le
// choix de Siham, et il travaille pour l'association en attendant.
//
// ⚠ CE QUE LA PAGE PROMET EST DÉJÀ EN LIGNE. Publier au catalogue, la
// gratuité de la mise en relation, les 15 générations LEX offertes chaque
// mois, l'Édublog ouvert à l'écriture : chacun de ces quatre points existe et
// se vérifie sur le site. Rien n'est promis ici qui demande une décision.
//
// ⚠ LA CONVENTION est décrite comme ce que l'association PROPOSE, jamais
// comme un document déjà rédigé — il ne l'est pas.
import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  HeartHandshake,
  Eye,
  Network,
  Blocks,
  MapPin,
  Handshake,
  Lightbulb,
  FileSignature,
  Mail,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "../../_shared/ui";
import { metaPublique } from "@/lib/meta";

export const metadata: Metadata = metaPublique({
  title: "Partenaires associatifs",
  description:
    "Associations, collectifs et structures de l’économie sociale : ce qu’un partenariat avec ADéPA apporte, et comment il se met en place.",
  path: "/partenaires-associatifs",
});

const POURQUOI = [
  {
    icone: Eye,
    titre: "Gagner en visibilité",
    texte:
      "Vos ateliers et vos formations au catalogue, lu par les établissements du secteur.",
  },
  {
    icone: Network,
    titre: "Toucher les établissements",
    texte:
      "MECS, IME, ITEP, SESSAD, EHPAD : le réseau que vous mettriez des mois à démarcher.",
  },
  {
    icone: Blocks,
    titre: "Mutualiser des moyens",
    texte:
      "Contrats, devis et factures édités par la plateforme. LEX, l’assistant d’écriture, offert 15 fois par mois.",
  },
  {
    icone: HeartHandshake,
    titre: "Construire ensemble",
    texte:
      "Projets communs, réponses à appel à projets, écriture partagée sur l’Édublog.",
  },
];

const VALEURS = [
  {
    icone: MapPin,
    titre: "Ancrage local",
    texte:
      "L’association est à Melun. Le réseau se construit d’abord en Seine-et-Marne et en Île-de-France.",
  },
  {
    icone: Handshake,
    titre: "Gratuité de la mise en relation",
    texte:
      "Zéro commission sur les ateliers et les formations du catalogue. Ce n’est pas une offre de lancement, c’est le modèle.",
  },
  {
    icone: Lightbulb,
    titre: "Le terrain d’abord",
    texte:
      "Les interventions sont portées par ceux qui les font. Un partenariat ne s’écrit pas au-dessus d’eux.",
  },
];

const ETAPES = [
  {
    titre: "Prendre contact",
    texte: "Vous nous écrivez ce que fait votre structure et ce que vous cherchez.",
  },
  {
    titre: "Se parler une fois",
    texte: "Un échange pour voir ce que chacun apporte, et si le public se recoupe.",
  },
  {
    titre: "Écrire ce qu’on fait ensemble",
    texte:
      "Durée, modalités, engagements de chaque côté : c’est plus court à lire qu’à écrire, et ça évite les malentendus.",
  },
];

export default function PartenairesAssociatifsPage() {
  return (
    <div className="space-y-16">
      <PageHeader
        title="Partenaires associatifs"
        subtitle="Associations, collectifs, structures de l’économie sociale et solidaire : ce qu’un partenariat avec ADéPA apporte, et comment il se met en place."
      />

      {/* Pourquoi */}
      <section>
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">
          Pourquoi devenir partenaire d’ADéPA
        </h2>
        <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">
          ADéPA est une association loi 1901, certifiée Qualiopi, qui tient
          Les Extras : le catalogue d’ateliers, de formations et de renfort du
          médico-social.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {POURQUOI.map((p) => (
            <div
              key={p.titre}
              className="rounded-2xl border border-border bg-card p-5"
            >
              <span className="grid size-10 place-items-center rounded-xl bg-primary-soft text-primary">
                <p.icone className="size-5" aria-hidden />
              </span>
              <p className="mt-4 font-semibold text-foreground">{p.titre}</p>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                {p.texte}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Valeurs */}
      <section className="rounded-2xl border-2 border-primary/30 bg-primary-soft/30 p-6 md:p-8">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">
          Un partenariat fondé sur des valeurs communes
        </h2>
        <ul className="mt-6 grid gap-5 md:grid-cols-3">
          {VALEURS.map((v, i) => (
            <li key={v.titre} className="flex gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-card text-primary shadow-sm">
                <v.icone className="size-4" aria-hidden />
              </span>
              <span>
                <span className="block font-semibold text-foreground">
                  {i + 1}. {v.titre}
                </span>
                <span className="mt-1 block text-sm leading-relaxed text-muted-foreground">
                  {v.texte}
                </span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* Comment */}
      <section>
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">
          Comment ça se met en place
        </h2>
        <ol className="mt-6 grid gap-4 md:grid-cols-3">
          {ETAPES.map((e, i) => (
            <li
              key={e.titre}
              className="rounded-2xl border border-border bg-card p-5"
            >
              <span className="grid size-8 place-items-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                {i + 1}
              </span>
              <p className="mt-4 font-semibold text-foreground">{e.titre}</p>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                {e.texte}
              </p>
            </li>
          ))}
        </ol>
        <p className="mt-5 flex max-w-3xl items-start gap-3 rounded-xl border border-border bg-card p-5 text-sm leading-relaxed text-muted-foreground">
          <FileSignature className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
          <span>
            Nous proposons d’écrire une convention à chaque partenariat, même
            court : ce qu’on fait ensemble, pendant combien de temps, et ce que
            chacun met dedans. Une association qui change de bureau l’année
            suivante retrouve ainsi ce qui a été convenu.
          </span>
        </p>
      </section>

      {/* L'appel à partenariat : à la place d'une liste de partenaires que
          nous n'avons pas encore. Dire « soyez le premier » est vrai ;
          afficher trois logos empruntés ne l'aurait pas été. */}
      <section className="rounded-2xl bg-primary p-8 text-primary-foreground">
        <h2 className="text-2xl font-semibold tracking-tight">
          Vous voulez être la première association partenaire ?
        </h2>
        <p className="mt-2 max-w-2xl text-primary-foreground/85">
          Le réseau se construit maintenant. Les structures qui entrent
          aujourd’hui écrivent la façon dont il fonctionnera.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/contact"
            className="inline-flex h-11 items-center gap-2 rounded-lg bg-primary-foreground px-5 text-sm font-semibold text-primary transition hover:opacity-90"
          >
            <Mail className="size-4" aria-hidden />
            Proposer un partenariat
          </Link>
          <Link
            href="/notre-histoire"
            className="inline-flex h-11 items-center rounded-lg border border-primary-foreground/40 px-5 text-sm font-semibold transition hover:bg-primary-foreground/10"
          >
            Qui est ADéPA
          </Link>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-6">
        <h2 className="text-lg font-semibold text-foreground">
          Vous êtes une structure, pas une association ?
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Un établissement s’inscrit directement et publie ses besoins ; un
          professionnel indépendant se référence au catalogue. Ni l’un ni
          l’autre ne demande de partenariat, et les deux sont gratuits.
        </p>
        <div className="mt-4 flex flex-wrap gap-4 text-sm">
          <Button asChild variant="outline" size="sm">
            <Link href="/renforteam">
              Je suis un établissement <ArrowRight className="size-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/intervenant-independant">
              Je suis un professionnel <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
