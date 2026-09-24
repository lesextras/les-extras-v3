// Page publique RenforTeam.
//
// ⚠⚠ CETTE PAGE A CHANGÉ D'OBJET LE 19/09/2026, PAS SEULEMENT DE TEXTE.
//
// Jusqu'ici elle vendait le remplacement de poste : un arrêt maladie à 21 h,
// un CDD signé avant l'ouverture. Décision de Siham : ce montage sort de
// l'offre publique (voir `@/lib/offre`). Ce qui reste — et qui devient le
// sujet de la page — c'est le renfort assuré par des intervenants
// INDÉPENDANTS et SPÉCIALISÉS : ergothérapeute, éducateur spécialisé,
// psychomotricienne, psychologue, orthophoniste.
//
// Trois conséquences, et chacune se voit dans le texte :
//
//  1. LE DEMANDEUR N'EST PLUS SEULEMENT UN ÉTABLISSEMENT. Une famille, une
//     école, une mairie demandent directement. La page ne peut donc plus être
//     écrite pour un chef de service.
//  2. CE N'EST PAS DU SOIN. C'est de la rééducation et de l'éducation
//     spécialisée, en complément de ce que fait déjà l'équipe soignante —
//     jamais à sa place. La page doit le dire avant de vendre quoi que ce soit.
//  3. ÇA SE PASSE EN PRÉSENTIEL OU EN VISIOCONSULTATION. Les deux, au choix
//     du besoin, et la visio n'est pas un pis-aller.
//  4. RENFORTEAM EST COMMISSIONNÉ, ET LA PAGE DIT POURQUOI (21/09/2026).
//     Ce n'est pas une place de marché où l'on se sert au passage : c'est une
//     équipe SPÉCIALISÉE — des professionnels de l'éducation spécialisée et de
//     la rééducation — que l'association VÉRIFIE un par un avant de les
//     envoyer chez quelqu'un. La commission paie cette vérification. Le reste
//     du site (ateliers, formations) reste à 0 %, et les deux régimes doivent
//     rester distincts partout où ils sont écrits.
//     ⚠ 15 % de frais de gestion, AJOUTÉS au tarif et payés par le demandeur —
//     rien n'est prélevé sur l'intervenant. Taux, calcul et relevé des grilles
//     concurrentes dans `lib/commission.ts`.
//
// ⚠ RIEN N'EST SUPPRIMÉ. Les blocs qui racontaient le CDD sont conservés ici,
// derrière `renfortSalarieVisible()`. Ils reviennent tels quels avec
// NEXT_PUBLIC_OFFRE_PUBLIQUE=complete, sans redéploiement de code.
//
// Le détail des missions ouvertes reste réservé aux comptes : ce sont les
// besoins de structures clientes, ils n'ont pas à être lisibles par leurs
// concurrents.
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
  Video,
  Zap,
  Building2,
  UserRound,
  HeartHandshake,
  FileText,
  Scale,
  DoorClosed,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { fetchPublic } from "../../_shared/server";
import { formatDate } from "../../_shared/format";
import { metaPublique } from "@/lib/meta";
import { cn } from "@/lib/utils";
import { renfortSalarieVisible, visioconsultationVisible } from "@/lib/offre";
// ⚠ UN LIBELLÉ PAR DESTINATION : les libellés d'inscription ne s'écrivent plus
// dans la page, ils s'importent. La règle s'est défaite trois fois ;
// `lib/__tests__/inscription-liens.test.ts` échoue si une page recommence.
import { INSCRIPTION } from "@/lib/inscription-liens";
import { FormulaireLanding } from "../l/FormulaireLanding";
// Venus de l'accueil le 08/09/2026 : l'accueil traite les trois usages à
// égalité, et le détail du renfort — le formulaire unique, la cascade, les
// écrans du produit — appartient à la page qui raconte le renfort.
//
// ⚠ Les deux blocs ci-dessous décrivent le produit côté établissement
// employeur (« votre vivier de CDD », « export paie »). Ils ne sont plus
// affichés depuis le 19/09/2026 — voir le bas du fichier.
import { UnSeulFormulaire } from "../../_shared/UnSeulFormulaire";
import { ApercuProduit } from "../../_shared/ApercuProduit";

export const metadata: Metadata = metaPublique({
  title: "RenforTeam, des intervenants spécialisés en renfort",
  // ⚠ 160 CARACTÈRES MAXIMUM, et un test le vérifie
  // (`lib/__tests__/meta-descriptions.test.ts`). Au-delà, Google coupe au
  // milieu d'un mot. « Psychologue » et la liste des demandeurs ont sauté ici
  // : ils sont dans le titre H1 et dans le premier paragraphe, que le moteur
  // lit aussi.
  description: visioconsultationVisible()
    ? "Ergothérapeute, éducateur spécialisé, psychomotricienne, orthophoniste : un renfort sur un besoin précis, en présentiel ou en visioconsultation."
    : "Ergothérapeute, éducateur spécialisé, psychomotricienne, orthophoniste : un renfort sur un besoin précis, là où vit la personne accompagnée.",
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

/**
 * LES MÉTIERS DE LA TEAM — nommés, jamais résumés en « professionnels ».
 *
 * Une famille ne cherche pas « un intervenant » : elle cherche une
 * psychomotricienne, parce que le CAMSP lui en a parlé et qu'il n'y en a pas
 * avant quatorze mois. Le mot exact est ce qui fait reconnaître la page.
 */
const METIERS_TEAM = [
  "Ergothérapeute",
  "Éducateur spécialisé",
  "Psychomotricienne",
  "Psychologue",
  "Orthophoniste",
];

/**
 * Qui peut demander. La liste est ouverte, et c'est le changement de 2026.
 *
 * ⚠ « LES FAMILLES » NE SUFFISAIT PAS (précision de Siham, 21/09/2026) : un
 * particulier réserve aussi POUR LUI-MÊME. Un adulte accompagné, un aidant qui
 * cherche un appui pour son propre quotidien — ils ne se reconnaissent pas
 * dans « famille », qui laisse entendre qu'il faut un enfant pour être
 * légitime ici. Le titre nomme donc les deux.
 */
const DEMANDEURS = [
  {
    icone: HeartHandshake,
    titre: "Les particuliers et les familles",
    texte:
      "Pour votre enfant, votre proche, ou vous-même. Sans passer par un établissement, sans dossier à monter d’abord.",
  },
  {
    icone: Building2,
    titre: "Les établissements",
    texte: "MECS, IME, ITEP, EHPAD, SESSAD : un besoin nommé, en plus de votre équipe.",
  },
  {
    icone: Users,
    titre: "Les écoles",
    texte:
      "Un accompagnement pendant le temps scolaire, une guidance à l’équipe enseignante.",
  },
  {
    icone: MapPin,
    titre: "Les mairies et les collectivités",
    texte: "Périscolaire, centre de loisirs, service enfance : un appui sur une situation.",
  },
];

/**
 * LES TROIS PORTES DÉJÀ POUSSÉES — le deuxième acte de la page.
 *
 * ⚠ CHAQUE ENTRÉE DÉCRIT UN CHEMIN RÉEL, PAS UN CONCURRENT. On ne dit de mal
 * ni du CAMSP, ni des libéraux, ni des établissements : ils ne sont pas en
 * cause, ils sont saturés. Écrire ces trois blocs comme des reproches
 * retournerait contre nous exactement les professionnels avec qui nos
 * intervenants doivent travailler ensuite.
 *
 * ⚠ AUCUNE DURÉE, AUCUN POURCENTAGE. Nous ne mesurons pas les délais d'attente
 * et nous n'en publions donc aucun. Le titre de la page porte « quatorze mois »
 * parce que c'est une phrase rapportée dans une situation, pas une statistique
 * — et elle n'est pas répétée ici comme si c'en était une.
 */
const PORTES_FERMEES = [
  {
    titre: "Le service public",
    texte:
      "CAMSP, CMPP, SESSAD, CMP : la demande est faite, le dossier est complet, la place n’existe pas encore.",
    mur: "On vous a donné une date, et elle est loin.",
  },
  {
    titre: "Le libéral, en direct",
    texte:
      "Vous appelez les cabinets du département les uns après les autres, ceux dont on vous a donné le nom.",
    mur: "Répondeur, ou liste fermée.",
  },
  {
    titre: "L’établissement, en interne",
    texte:
      "Il faudrait trois heures par semaine d’ergothérapie. Ni la ligne budgétaire, ni le poste, ni le candidat.",
    mur: "Personne à embaucher pour trois heures.",
  },
];

/** Comment une demande se déroule. Trois paliers, pas une promesse de délai. */
const DEROULE = [
  {
    numero: "1",
    titre: "Vous décrivez le besoin",
    texte:
      "La situation, ce que vous cherchez, où et quand. Quelques minutes, et sans compte pour commencer.",
  },
  {
    numero: "2",
    titre: "Un professionnel vérifié vous répond",
    texte:
      "Le métier que la situation appelle, parmi les indépendants de l’équipe. Diplôme, pièces et assurance contrôlés par l’association avant qu’il n’intervienne.",
  },
  {
    numero: "3",
    titre: "L’intervention se met en place",
    texte:
      visioconsultationVisible()
        ? "Chez vous, dans l’établissement, à l’école, ou en visioconsultation. Le devis est écrit avant, pas après."
        : "Chez vous, dans l’établissement, à l’école. Le devis est écrit avant, pas après.",
  },
];

const DEMANDEUR_POINTS = [
  { icone: Clock, texte: "Une demande en quelques minutes : la situation, le lieu, le rythme." },
  {
    icone: ShieldCheck,
    texte: "Des intervenants diplômés, dont les pièces sont au dossier avant la première séance.",
  },
  {
    icone: Video,
    texte: visioconsultationVisible()
      ? "En présentiel ou en visioconsultation, selon ce que la situation permet."
      : "Sur le lieu de vie, dans l’établissement ou à l’école, selon ce qui a du sens.",
  },
  {
    icone: FileCheck2,
    texte: "Devis écrit avant l’intervention, frais de gestion compris. Rien ne part avant votre accord.",
  },
];

const INTERVENANT_POINTS = [
  { icone: MapPin, texte: "Des demandes près de chez vous, filtrées par métier et disponibilité." },
  {
    icone: Zap,
    texte: "Vous acceptez, c’est à vous. Pas de candidature à défendre, pas d’attente.",
  },
  {
    icone: UserRound,
    texte: "Vous exercez en libéral, pour votre compte : c’est une prestation, pas un emploi.",
  },
  {
    icone: FileCheck2,
    texte: "L’association encaisse et vous reverse. Ni relance, ni impayé à courir.",
  },
];

/**
 * LES ÉCRITS. C'est la demande qui revient le plus souvent, et c'est celle que
 * personne ne prend : un dossier MDPH qu'il faut rendre, un bilan dont
 * l'école a besoin pour ouvrir des droits.
 *
 * ⚠ Ces documents sont rédigés par le professionnel qui a vu la personne, sur
 * la base de son propre travail. Ce n'est pas un service de rédaction : ni la
 * plateforme ni l'association n'écrit ni ne signe à sa place.
 */
const ECRITS = [
  "Dossier MDPH",
  "Convention école – éducateur",
  "Bilan orthophonique",
  "Bilan psychologique",
];

/**
 * CE QUE LES EXTRAS NE FAIT PAS.
 *
 * ⚠ CETTE SECTION N'EST PAS UNE PRÉCAUTION JURIDIQUE, C'EST L'ADN DU
 * DISPOSITIF. Confondre rééducation et soin, c'est promettre un diagnostic et
 * un traitement — que ces professionnels ne délivrent pas, et que l'association
 * n'a pas vocation à organiser. Le dire en toutes lettres évite à une famille
 * d'attendre d'ici ce qu'elle doit demander à son médecin, et c'est la seule
 * façon d'être vraiment COMPLÉMENTAIRE du parcours de soin plutôt qu'en
 * concurrence avec lui.
 */
function NoteAdn() {
  return (
    <section className="flex flex-wrap items-center gap-x-5 gap-y-3 rounded-2xl border border-border bg-gradient-to-r from-card via-primary-soft to-card px-6 py-5">
      <Scale className="size-5 shrink-0 text-primary" aria-hidden />
      <p className="min-w-[240px] flex-1 text-sm leading-relaxed text-muted-foreground" lang="fr">
        <strong className="font-semibold text-foreground">
          Ce n’est pas du soin, c’est de la rééducation et de l’éducation spécialisée.
        </strong>{" "}
        Les intervenants ne posent pas de diagnostic et ne remplacent ni votre médecin, ni le
        CMPP, ni l’équipe qui suit déjà la personne. Ils interviennent en complément, sur un
        besoin précis, et travaillent avec ce qui existe autour d’elle.
      </p>
    </section>
  );
}

export default async function SosRenfortPage() {
  const montreCdd = renfortSalarieVisible();

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

  /**
   * ⚠⚠ LE BOUTON DE DEMANDE NE FORCE PLUS « ÉTABLISSEMENT » (21/09/2026).
   *
   * Il pointait sur `/register?type=etablissement` des deux côtés. Or ce
   * paramètre ne fait pas que pré-remplir : il SAUTE l'écran des trois cartes
   * et crée un compte ESTABLISHMENT (`register/page.tsx`). Une mère qui
   * cliquait « Demander un intervenant », deux lignes sous « Qui peut
   * demander ? Tout le monde », se retrouvait donc à devoir nommer son
   * établissement — et repartait avec un compte du mauvais type, dont le slug
   * public ne se recalcule jamais.
   *
   * Hors offre complète, la page s'adresse aux particuliers, aux familles, aux
   * écoles, aux mairies ET aux établissements : le type doit rester au choix
   * du visiteur. En offre complète, seul un établissement employeur publie un
   * besoin, et le raccourci garde son sens.
   */
  /*
   * ⚠ « SANS COMPTE » ÉTAIT PROMIS, ET LE BOUTON MENAIT À L'INSCRIPTION
   * (24/09/2026). Le déroulé annonce « quelques minutes, et sans compte pour
   * commencer » ; le bouton, lui, ouvrait /register. La demande se fait
   * désormais sur place, dans le formulaire #demande en bas de page : une
   * demande de contact classique, qui arrive dans /admin/contacts. Le compte
   * se crée ensuite, quand il y a un devis à accepter.
   */
  const lienDemande = montreCdd ? INSCRIPTION.publierBesoin.href : "#demande";

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
            {montreCdd
              ? "Un arrêt maladie à 21 h. Le poste est couvert avant l’ouverture."
              : "Quatorze mois d’attente pour une psychomotricienne. Ou une demande, ce soir."}
          </h1>
          <p className="text-lg leading-relaxed text-muted-foreground">
            {montreCdd ? (
              <>
                Votre équipe, puis les habitués, puis le réseau. Le premier qui accepte emporte la
                mission. Vous l’embauchez en CDD : moins cher que l’intérim, sans requalification.
              </>
            ) : (
              <>
                Ergothérapeute, éducateur spécialisé, psychomotricienne, psychologue,
                orthophoniste : des indépendants qui interviennent en renfort, sur un besoin
                nommé.{visioconsultationVisible() ? " En présentiel ou en visioconsultation." : ""} Que
                vous soyez une famille, une école, une mairie ou un établissement.
              </>
            )}
          </p>
          {!montreCdd && (
            <ul className="flex flex-wrap gap-2 pt-1">
              {METIERS_TEAM.map((m) => (
                <li key={m}>
                  <Badge variant="outline" className="text-xs font-normal">
                    {m}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button asChild size="lg">
              <Link href={lienDemande}>
                {montreCdd ? "Publier un besoin" : "Demander un intervenant"}{" "}
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/register?next=/dashboard/opportunites">
                {/* ⚠ Même destination, même libellé — y compris hors offre
                    complète, où la page disait « Je suis intervenant
                    indépendant » au sommet et « Rejoindre la team » en bas.
                    Trois verbes pour un seul écran. */}
                {INSCRIPTION.chercherMissions.libelle}
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {montreCdd ? (
        /*
          ⚠⚠ LA NOTE DE DROIT — VENUE DE L'ACCUEIL LE 16/09/2026.

          Elle était en bas de la section « le renfort, en deux » de la page
          d'accueil. Siham l'a fait retirer de là : deux références d'articles
          arrêtaient la lecture au moment où le visiteur cherche encore à savoir
          si le site est pour lui. Elle n'a pas été supprimée pour autant —
          c'est la seule chose qui distinguait Les Extras des plateformes que
          cette décision a sanctionnées, et sa place est sur la page où un
          directeur lit comment se monte un remplacement.

          ⚠ Elle n'a de sens QUE si la page promet « sans requalification »,
          donc uniquement en offre complète. Hors offre complète, plus personne
          ne remplace un poste ici : la note qui la remplace est celle qui dit
          ce que le dispositif n'est pas — `NoteAdn`, juste en dessous.
        */
        <section className="flex flex-wrap items-center gap-x-5 gap-y-3 rounded-2xl border border-border bg-gradient-to-r from-card via-primary-soft to-card px-6 py-5">
          <Scale className="size-5 shrink-0 text-primary" aria-hidden />
          <p className="min-w-[240px] flex-1 text-sm leading-relaxed text-muted-foreground" lang="fr">
            <strong className="font-semibold text-foreground">
              Un remplacement de poste ne se fait pas en indépendant.
            </strong>{" "}
            Conseil d’État, 11 février 2025, n° 491128 ; LFSS 2025, art. 70. C’est pour cela que le
            renfort de poste passe par un CDD, et que le renfort personnalisé, qui ne remplace
            personne, se facture en prestation.
          </p>
        </section>
      ) : (
        <NoteAdn />
      )}

      {/*
        ═══ LES TROIS PORTES FERMÉES — la section qui manquait (21/09/2026) ═══

        ⚠ AVANT CETTE SECTION, LA PAGE NE RACONTAIT RIEN. Constat de Siham :
        « la page renforteam n'a pas un bon design qui raconte un storytelling ».
        Elle était une pile de blocs juxtaposés — le hero, la commission, les
        demandeurs, deux cartes, le déroulé — dont chacun se tenait seul et
        dont aucun ne menait au suivant. Un visiteur lisait une plaquette.

        Ce qui manquait n'était pas du texte, c'était le DEUXIÈME ACTE : dire
        ce que la personne a déjà essayé avant d'arriver ici. Personne ne
        cherche « une plateforme de renfort » ; on cherche une psychomotricienne
        parce que trois autres chemins n'ont rien donné. Nommer ces trois
        chemins fait reconnaître la situation, et c'est CE moment qui rend la
        suite de la page lisible.

        ⚠ ON NE PROMET AUCUN DÉLAI EN FACE. La quatrième porte n'est pas « plus
        rapide » : elle est OUVERTE, c'est-à-dire qu'elle ne suppose pas qu'une
        place se libère. Écrire « sous 48 h » serait une promesse que rien dans
        le produit ne tient — il n'y a aujourd'hui aucun engagement de délai,
        et une famille déçue là-dessus ne revient pas.

        ⚠ AUCUN CHIFFRE NOUVEAU ICI. Les durées d'attente varient d'un
        département à l'autre et nous n'en publions aucune mesure : la page
        décrit ce que les gens racontent, sans le chiffrer.
      */}
      {!montreCdd && (
        <section className="space-y-8">
          <div className="max-w-2xl space-y-3">
            <h2 className="text-3xl font-semibold tracking-tight text-foreground">
              Vous avez déjà essayé trois choses
            </h2>
            <p className="text-muted-foreground" lang="fr">
              Personne n’arrive ici en premier. On y arrive après.
            </p>
          </div>

          <ol className="grid gap-5 md:grid-cols-3">
            {PORTES_FERMEES.map((p, i) => (
              <li
                key={p.titre}
                className="relative flex h-full flex-col rounded-2xl border border-border bg-card/50 p-6"
              >
                <span
                  className="text-xs font-semibold uppercase tracking-wide text-muted-foreground/70"
                  aria-hidden
                >
                  {i + 1}
                </span>
                <p className="mt-2 text-lg font-medium text-foreground">{p.titre}</p>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground" lang="fr">
                  {p.texte}
                </p>
                <p className="mt-4 flex items-start gap-2 border-t border-border/60 pt-3 text-sm font-medium text-foreground/80">
                  <DoorClosed className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
                  {p.mur}
                </p>
              </li>
            ))}
          </ol>

          {/* LE PIVOT DE LA PAGE. Tout ce qui précède décrit la situation ;
              tout ce qui suit décrit la réponse. C'est la seule phrase de la
              page qui a le droit d'annoncer le produit. */}
          <div className="rounded-2xl border-2 border-primary/35 bg-primary-soft/40 px-6 py-8 sm:px-10">
            <p className="text-xl font-semibold leading-snug text-foreground sm:text-2xl" lang="fr">
              RenforTeam est la quatrième porte.
            </p>
            <p className="mt-3 max-w-3xl leading-relaxed text-muted-foreground" lang="fr">
              Un professionnel indépendant, sur un besoin nommé, sans attendre qu’une place se
              libère quelque part. Il ne remplace pas le CAMSP ni l’équipe qui suit déjà la
              personne&nbsp;: il intervient à côté, sur ce qui est possible maintenant.
            </p>
          </div>
        </section>
      )}

      {/* Qui peut demander. Le bloc n'existe que depuis l'ouverture de 2026. */}
      {!montreCdd && (
        <section className="space-y-8">
          <div className="max-w-2xl space-y-3">
            <h2 className="text-3xl font-semibold tracking-tight text-foreground">
              Qui peut demander&nbsp;? Tout le monde.
            </h2>
            <p className="text-muted-foreground">
              Il n’y a pas de porte d’entrée réservée. Un particulier réserve directement, pour
              son enfant, son proche ou lui-même, sans prescription et sans dossier monté
              d’avance.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {DEMANDEURS.map((d) => (
              <div key={d.titre} className="space-y-3">
                <span className="grid size-11 place-items-center rounded-xl bg-primary/15 text-primary">
                  <d.icone className="size-5" />
                </span>
                <p className="text-lg font-medium text-foreground">{d.titre}</p>
                <p className="text-sm leading-relaxed text-muted-foreground" lang="fr">
                  {d.texte}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/*
        ⚠ LES DEUX CARTES « ÉTABLISSEMENT / INTERVENANT » NE S'AFFICHENT PLUS
        QU'EN OFFRE COMPLÈTE (21/09/2026), ET CE N'EST PAS UNE SUPPRESSION.

        Hors offre complète, la carte de gauche répétait mot pour mot la
        section « Qui peut demander ? » située juste au-dessus — mêmes publics,
        même promesse, deux blocs d'affilée. C'est précisément le défaut que
        Siham a nommé : « des blocs séparés les uns des autres ». La moitié
        gauche est donc fondue dans le déroulé (les quatre repères ci-dessous)
        et la moitié droite devient une section à elle, placée là où elle a du
        sens : après avoir montré la demande, on s'adresse à qui y répond.

        En offre complète (`renfortSalarieVisible()`), les deux cartes
        reviennent telles quelles : elles y décrivent deux rôles réellement
        différents, l'employeur et le salarié en CDD.
      */}
      {montreCdd && (
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
                  <li
                    key={l.texte}
                    className="flex gap-3 text-sm leading-relaxed text-muted-foreground"
                  >
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
                  <p className="text-sm text-muted-foreground">Éducateur, moniteur, AES, psychologue…</p>
                </div>
              </div>
              <ul className="space-y-3">
                {INTERVENANT.map((l) => (
                  <li
                    key={l.texte}
                    className="flex gap-3 text-sm leading-relaxed text-muted-foreground"
                  >
                    <l.icone className="mt-0.5 size-4 shrink-0 text-amber-400" />
                    {l.texte}
                  </li>
                ))}
              </ul>
              <Button asChild variant="outline" className="w-full">
                <Link href="/register?next=/dashboard/opportunites">Je cherche des missions</Link>
              </Button>
            </CardContent>
          </Card>
        </section>
      )}

      {/* ═══ LE DÉROULÉ — la cascade en offre complète, les trois étapes sinon.

          ⚠ LE TRAIT QUI RELIE LES TROIS NUMÉROS N'EST PAS UNE DÉCORATION : sans
          lui, trois pastilles alignées se lisent comme trois options au choix,
          pas comme un trajet. Il est posé à 22 px du haut, c'est-à-dire au
          centre vertical des pastilles (`size-11` = 44 px) : changer la taille
          des pastilles oblige à recalculer cette valeur.

          ⚠ Il s'arrête à 16 % de chaque bord pour tomber SOUS la première et la
          dernière pastille plutôt que de dépasser dans le vide, et il
          disparaît sous `md` — en colonne, il relierait des points qui ne sont
          plus côte à côte. */}
      <section className="space-y-8">
        <div className="max-w-2xl space-y-3">
          <h2 className="text-3xl font-semibold tracking-tight text-foreground">
            {montreCdd ? "La diffusion en cascade" : "Comment ça se passe, à partir d’ici"}
          </h2>
          <p className="text-muted-foreground">
            {montreCdd
              ? "Pas de diffusion au hasard. Le besoin descend palier par palier et s’arrête dès qu’il est pourvu."
              : "Trois étapes, et rien n’est engagé tant que le devis n’est pas accepté."}
          </p>
        </div>
        <div className="relative">
          <span
            aria-hidden
            className="pointer-events-none absolute left-[16%] right-[16%] top-[22px] hidden h-px bg-border md:block"
          />
          <ol className="relative grid gap-6 md:grid-cols-3">
            {(montreCdd ? CASCADE : DEROULE).map((c) => (
              <li key={c.numero} className="space-y-3">
                <span className="relative grid size-11 place-items-center rounded-full bg-primary text-lg font-semibold text-primary-foreground shadow-card ring-4 ring-background">
                  {c.numero}
                </span>
                <p className="text-lg font-medium text-foreground">{c.titre}</p>
                <p className="text-sm leading-relaxed text-muted-foreground" lang="fr">
                  {c.texte}
                </p>
              </li>
            ))}
          </ol>
        </div>

        {/* LES QUATRE REPÈRES, venus de la carte de gauche supprimée ci-dessus.
            Ils répondent aux questions qu'on se pose PENDANT le déroulé —
            combien de temps ça prend, qui vient, où, et quand on paie — et
            c'est là qu'ils servent, pas dans une carte séparée. */}
        {!montreCdd && (
          <ul className="grid gap-4 rounded-2xl border border-border bg-card/50 p-6 sm:grid-cols-2">
            {DEMANDEUR_POINTS.map((l) => (
              <li key={l.texte} className="flex gap-3 text-sm leading-relaxed text-muted-foreground">
                <l.icone className="mt-0.5 size-4 shrink-0 text-primary" />
                <span lang="fr">{l.texte}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/*
        POURQUOI RENFORTEAM EST COMMISSIONNÉ — et pourquoi la page le dit
        elle-même plutôt que de le laisser découvrir sur un devis.

        ⚠ Le reste du site annonce 0 % de commission. Quelqu'un qui lit
        l'accueil puis cette page-ci DOIT comprendre pourquoi les deux ne
        disent pas la même chose, sinon il conclut au piège. La réponse tient
        en une phrase : sur un atelier, on réserve en direct ; ici,
        l'association vérifie un professionnel avant de l'envoyer chez un
        enfant. Ce n'est pas la même prestation, ce n'est pas le même prix.

        ⚠ 15 %, arrêté le 21/09/2026. Le chiffre est ici, sur l'accueil, sur
        /frais-de-service et dans les CGU : les quatre bougent ensemble.

        ⚠⚠ CE BLOC A ÉTÉ DESCENDU LE 21/09/2026, ET IL NE FAUT PAS LE REMONTER.
        Il arrivait en troisième position, juste après le titre : le visiteur
        lisait le prix avant d'avoir compris ce qu'on lui proposait, et un prix
        sans objet se lit toujours comme cher. Il arrive maintenant après le
        déroulé — on a vu ce qui se passe, on peut dire ce qu'on paie.
      */}
      {!montreCdd && (
        <section className="rounded-2xl border border-border bg-card/50 px-6 py-8 sm:px-10">
          <div className="grid gap-6 lg:grid-cols-[auto_1fr] lg:items-start lg:gap-8">
            <span className="grid size-12 place-items-center rounded-xl bg-primary/15 text-primary">
              <ShieldCheck className="size-6" />
            </span>
            <div className="space-y-3">
              <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                Une équipe spécialisée, vérifiée une par une
              </h2>
              <p className="text-sm leading-relaxed text-muted-foreground" lang="fr">
                RenforTeam n’est pas un annuaire ouvert. Ce sont des professionnels de
                l’éducation spécialisée et de la rééducation, et l’association contrôle chacun
                d’eux avant qu’il n’intervienne&nbsp;: diplôme, pièce d’identité, bulletin n° 3 du
                casier judiciaire, assurance, et le numéro ADELI quand la profession en a un.
              </p>
              <p className="text-sm leading-relaxed text-muted-foreground" lang="fr">
                C’est ce travail-là que paient les <strong className="font-semibold text-foreground">15&nbsp;%
                de frais de gestion</strong> sur les renforts, les seuls du site. Ils s’<em>ajoutent</em>
                au tarif de l’intervenant, qui le touche en entier, et la ligne figure sur le devis
                avant que vous n’acceptiez quoi que ce soit. Les ateliers et les formations du
                catalogue, eux, se réservent en direct et restent à 0&nbsp;%.
              </p>
            </div>
          </div>
        </section>
      )}

      {/*
        LA VISIOCONSULTATION ET LES ÉCRITS — les deux ajouts de septembre 2026.

        ⚠ La visio n'est pas présentée comme un second choix. Pour une guidance
        parentale, une reprise d'exercices ou un point avec une enseignante,
        elle supprime deux heures de route à une famille qui n'en a pas les
        moyens. Mais elle ne convient pas à tout : la page le dit, plutôt que de
        laisser quelqu'un réserver une séance qui n'aurait pas de sens.
      */}
      {!montreCdd && (
        <section className={cn('grid gap-6', visioconsultationVisible() && 'lg:grid-cols-2')}>
          {/* ⚠ LA CARTE VISIO N'EST PAS ENCORE VRAIE. Le service est décidé et
              spécifié, il n'est pas construit : ni salle, ni lien de
              rendez-vous, ni serveur média. On ne l'annonce donc que le jour
              où un rendez-vous peut réellement avoir lieu — voir
              `visioconsultationVisible()` dans `@/lib/offre`. Le reste du
              recentrage, lui, est vrai dès maintenant et part sans elle. */}
          {visioconsultationVisible() && (
          <Card className="border-border/80">
            <CardContent className="space-y-4 p-8">
              <span className="grid size-11 place-items-center rounded-xl bg-primary/15 text-primary">
                <Video className="size-5" />
              </span>
              <p className="text-xl font-medium text-foreground">
                En visioconsultation ou en présentiel
              </p>
              <p className="text-sm leading-relaxed text-muted-foreground" lang="fr">
                La visioconsultation se fait depuis votre navigateur, sur un lien qui n’est valable
                que pour ce rendez-vous. Rien à installer, rien à créer pour la personne qui vous
                rejoint. Elle convient à la guidance, au suivi, au point avec une équipe ou une
                enseignante.
              </p>
              <p className="text-sm leading-relaxed text-muted-foreground" lang="fr">
                Une première rencontre, une passation de bilan ou une intervention sur le lieu de
                vie se font sur place : l’intervenant vous le dit avant, pas après.
              </p>
            </CardContent>
          </Card>
          )}

          <Card className="border-border/80">
            <CardContent className="space-y-4 p-8">
              <span className="grid size-11 place-items-center rounded-xl bg-amber-500/15 text-amber-400">
                <FileText className="size-5" />
              </span>
              <p className="text-xl font-medium text-foreground">Les écrits qui débloquent</p>
              <p className="text-sm leading-relaxed text-muted-foreground" lang="fr">
                Le document qu’il faut rendre, et que personne n’a le temps de rédiger. Il peut
                être demandé en option, avec l’intervention&nbsp;:
              </p>
              <ul className="flex flex-wrap gap-2">
                {ECRITS.map((e) => (
                  <li key={e}>
                    <Badge variant="secondary" className="font-normal">
                      {e}
                    </Badge>
                  </li>
                ))}
              </ul>
              <p className="text-sm leading-relaxed text-muted-foreground" lang="fr">
                Chaque écrit est rédigé et signé par le professionnel qui a vu la personne, à
                partir de son propre travail. L’association ne rédige rien à sa place et ne signe
                rien.
              </p>
            </CardContent>
          </Card>
        </section>
      )}

      {/*
        ═══ L'AUTRE CÔTÉ — et il arrive ici, pas au milieu de la page ═══

        C'est la moitié droite de l'ancienne section « Deux côtés du métier ».
        Placée au milieu, elle coupait le récit de la demande en deux pour
        parler à quelqu'un d'autre. Placée ici, elle tombe juste avant les
        missions ouvertes, c'est-à-dire là où un professionnel qui a lu la page
        veut savoir ce qu'il y a pour lui — et le bloc suivant le lui montre.

        ⚠ « INTERVENANT INDÉPENDANT », JAMAIS « FREELANCE ». C'est le
        vocabulaire sanctionné par le Conseil d'État le 11/02/2025 (n° 491128),
        et un test du dépôt refuse le mot dans la prose
        (`lib/__tests__/promesses-interdites.test.ts`).
      */}
      {!montreCdd && (
        <section className="overflow-hidden rounded-3xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-card to-card px-6 py-10 sm:px-10">
          <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr] lg:items-start">
            <div className="space-y-4">
              <span className="grid size-12 place-items-center rounded-xl bg-amber-500/15 text-amber-400">
                <UserRound className="size-6" />
              </span>
              <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                Vous êtes de l’autre côté&nbsp;?
              </h2>
              <p className="text-sm leading-relaxed text-muted-foreground" lang="fr">
                Ergothérapeute, éducateur spécialisé, psychomotricienne, psychologue,
                orthophoniste&nbsp;: ce sont ces demandes-là qui arrivent, et elles attendent
                quelqu’un.
              </p>
              <Button asChild variant="outline">
                <Link href="/register?next=/dashboard/opportunites">
                  {INSCRIPTION.chercherMissions.libelle} <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>
            <ul className="grid gap-4 sm:grid-cols-2">
              {INTERVENANT_POINTS.map((l) => (
                <li
                  key={l.texte}
                  className="flex gap-3 rounded-xl border border-border bg-background/50 p-4 text-sm leading-relaxed text-muted-foreground"
                >
                  <l.icone className="mt-0.5 size-4 shrink-0 text-amber-400" />
                  <span lang="fr">{l.texte}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

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

      {/*
        ⚠ LE FORMULAIRE UNIQUE ET L'APERÇU DU PRODUIT DÉCRIVENT L'ÉTABLISSEMENT
        EMPLOYEUR — « votre vivier de CDD », « export paie en CSV ». Ils sortent
        de la page publique le 19/09/2026 en même temps que le reste, sans être
        supprimés : les deux composants existent toujours, et reviennent ici en
        offre complète.
      */}
      {montreCdd && (
        <>
          <UnSeulFormulaire />
          <ApercuProduit />
        </>
      )}

      {!montreCdd && (
        <section id="demande" className="scroll-mt-24 mx-auto max-w-2xl space-y-4">
          <div className="space-y-2 text-center">
            <h2 className="text-3xl font-semibold tracking-tight text-foreground">Décrire le besoin, sans compte</h2>
            <p className="text-muted-foreground">
              Une réponse sous 24 h ouvrées. Le compte ne se crée qu’au moment d’accepter un devis.
            </p>
          </div>
          <FormulaireLanding
            sujet="RenforTeam · demande sans compte"
            bouton="Envoyer ma demande"
            structure
            offre="La situation, le métier recherché, où et quand. N’indiquez ni le nom d’une personne accompagnée, ni une information de santé."
          />
        </section>
      )}

      {/* CTA final */}
      <section className="rounded-3xl border border-border bg-card/50 px-6 py-14 text-center sm:px-12">
        <div className="mx-auto max-w-2xl space-y-5">
          <Megaphone className="mx-auto size-8 text-primary" />
          <h2 className="text-3xl font-semibold tracking-tight text-foreground">
            {montreCdd
              ? "Le prochain arrêt maladie tombera un vendredi soir."
              : "La liste d’attente ne raccourcira pas toute seule."}
          </h2>
          <p className="text-muted-foreground">
            {montreCdd
              ? "Cinq minutes, gratuit. Vous ne payez que les renforts réalisés."
              : "Décrivez la situation en quelques minutes. Vous ne payez qu’après avoir accepté un devis écrit."}
          </p>
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <Button asChild size="lg">
              <Link href={lienDemande}>
                {montreCdd ? "Publier un besoin" : "Demander un intervenant"}
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
            <p className="text-sm text-muted-foreground" lang="fr">
              {montreCdd
                ? "Vous êtes intervenant ? C’est l’établissement qui vous embauche en CDD : aucun statut d’indépendant n’est nécessaire."
                : "Vous exercez en libéral ? Vos interventions vous sont réglées par l’association, sans relance ni impayé à courir."}
            </p>
            <div className="flex flex-wrap justify-center gap-3 pt-4">
              <Button asChild size="lg" variant="outline">
                <Link href="/register?next=/dashboard/opportunites">
                  {/* ⚠ « Rejoindre la team » disait la même destination
                      autrement : trois libellés pour `/dashboard/opportunites`
                      sur la même page. Le libellé vient du fichier, une fois. */}
                  {INSCRIPTION.chercherMissions.libelle}
                </Link>
              </Button>
              <Button asChild size="lg" variant="ghost">
                <Link href="/intervenant-independant">Proposer aussi mes ateliers</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

/* ------------------------------------------------------------------------ */
/* L'OFFRE COMPLÈTE — conservée intégralement, plus affichée par défaut       */
/* ------------------------------------------------------------------------ */

/**
 * ⚠ CE QUI SUIT DÉCRIT LE RENFORT DE POSTE EN CDD SALARIÉ, hors offre publique
 * depuis le 19/09/2026 (`@/lib/offre`). Rien n'est supprimé : ces trois listes
 * sont celles d'avant, au mot près, et elles se rallument avec
 * NEXT_PUBLIC_OFFRE_PUBLIQUE=complete.
 */
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
