// Page publique RenforTeam.
//
// ⚠⚠ CETTE PAGE A CHANGÉ D'OBJET LE 19/09/2026, PAS SEULEMENT DE TEXTE.
//
// Jusqu'ici elle vendait le remplacement de poste : un arrêt maladie à 21 h,
// un CDD signé avant l'ouverture. Décision de Siham : ce montage sort de
// l'offre publique (voir `@/lib/offre`). Ce qui reste — et qui devient le
// sujet de la page — c'est le renfort assuré par des intervenants
// INDÉPENDANTS et SPÉCIALISÉS.
//
// ⚠⚠ RECENTRÉE LE 28/09/2026 (audit, stratégie de Siham) : RenforTeam est
// « la team d'éducateurs en renfort », le cœur de la place de marché.
// Éducateurs spécialisés, moniteurs-éducateurs, AES ; en Seine-et-Marne puis
// en Île-de-France ; chaque mission décrite comme une PRESTATION AVEC SES
// OBJECTIFS. Ergothérapeute, psychomotricienne, orthophoniste (et tout métier
// paramédical) sont retirés de la promesse, partout. Ne pas les remettre.
// ⚠ 01/10/2026 : PLUS DE COMMISSION, NI SUR LES RENFORTS NI SUR LES ATELIERS.
// Ce que le client paie revient à l'intervenant. Les 15 % de frais de gestion
// (21/09/2026) sont retirés de cette page. Jamais « freelance », jamais « vérifié(s) » comme
// promesse de contrôle.
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
//     envoyer chez quelqu'un. (Historique : une commission payait cette
//     vérification. Retirée le 01/10/2026, voir plus haut.) Le reste
//     du site (les ateliers) reste à 0 %, et les deux régimes doivent
//     rester distincts partout où ils sont écrits.
//     ⚠ (Caduc depuis le 01/10/2026) 15 % de frais de gestion, AJOUTÉS au tarif —
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
//
// ⚠⚠ REFAITE LE 01/10/2026 : « TROP DE TEXTE, PAS D'ICÔNE, D'ANIMATION,
// D'IMAGE » (Siham). Le SENS de chaque bloc est conservé, le texte est
// condensé (titres courts, une ligne par carte, pastilles plutôt que
// paragraphes). Les images viennent de la médiathèque rapatriée, via `wp()`.
// Les animations réutilisent `Reveal` et les utilitaires de `globals.css`
// (marquee, halo, derive, panoramique) : aucune règle CSS nouvelle.
// Avant de rallonger un bloc, relire cette ligne.
import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import type { LucideIcon } from "lucide-react";
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
  DoorOpen,
  Landmark,
  PhoneOff,
  PenLine,
  UserCheck,
  Handshake,
  Percent,
  Sparkles,
  GraduationCap,
  School,
  TreePine,
  IdCard,
  BadgeCheck,
  Wallet,
  Network,
  FileSignature,
  Check,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { fetchPublic } from "../../_shared/server";
import { formatDate } from "../../_shared/format";
import { Reveal } from "../../_shared/Reveal";
import { metaPublique } from "@/lib/meta";
import { wp } from "@/lib/media";
import { cn } from "@/lib/utils";
import { renfortSalarieVisible, visioconsultationVisible } from "@/lib/offre";
// ⚠ UN LIBELLÉ PAR DESTINATION : les libellés d'inscription ne s'écrivent plus
// dans la page, ils s'importent. La règle s'est défaite trois fois ;
// `lib/__tests__/inscription-liens.test.ts` échoue si une page recommence.
import { INSCRIPTION } from "@/lib/inscription-liens";
// Copie locale de `../l/FormulaireLanding`, qui sait recevoir l'intervenant
// choisi sur une carte de la team (`?intervenant=<id>`).
import { FormulaireDemande } from "./FormulaireDemande";
import { CarrouselsIntervenants, type GroupeMetier } from "./CarrouselsIntervenants";
// Venus de l'accueil le 08/09/2026. ⚠ Ils décrivent le produit côté
// établissement employeur (« votre vivier de CDD », « export paie ») et ne
// s'affichent qu'en offre complète, depuis le 19/09/2026.
import { UnSeulFormulaire } from "../../_shared/UnSeulFormulaire";
import { ApercuProduit } from "../../_shared/ApercuProduit";

export const metadata: Metadata = metaPublique({
  title: "RenforTeam, la team d’éducateurs en renfort",
  // ⚠ 160 CARACTÈRES MAXIMUM, et un test le vérifie
  // (`lib/__tests__/meta-descriptions.test.ts`).
  description: visioconsultationVisible()
    ? "Éducateurs spécialisés, moniteurs-éducateurs, AES : la team d’éducateurs en renfort, sur place ou en visioconsultation, en Seine-et-Marne puis en Île-de-France."
    : "Éducateurs spécialisés, moniteurs-éducateurs, AES : la team d’éducateurs en renfort, sur un besoin précis, en Seine-et-Marne puis en Île-de-France.",
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

type Ligne = { icone: LucideIcon; texte: string };

/** Une ligne de GET /public/vendors (l'annuaire public des intervenants). */
interface VendorApercu {
  id: string;
  nom: string;
  metier?: string | null;
  ville?: string | null;
  logoUrl?: string | null;
}

/**
 * LES MÉTIERS DE LA TEAM, nommés, jamais résumés en « professionnels ».
 * ⚠ Trois métiers depuis le 28/09/2026 : ergothérapeute, psychomotricienne,
 * psychologue et orthophoniste sont retirés de la promesse. Ne pas les remettre.
 */
const METIERS_TEAM: Ligne[] = [
  { icone: GraduationCap, texte: "Éducateur spécialisé" },
  { icone: UserRound, texte: "Moniteur-éducateur" },
  { icone: HeartHandshake, texte: "AES" },
];

/**
 * Qui peut demander. ⚠ « Les particuliers ET les familles » (21/09/2026) : un
 * particulier réserve aussi pour lui-même, et « famille » seule laissait
 * entendre qu'il faut un enfant pour être légitime ici.
 */
const DEMANDEURS = [
  {
    icone: HeartHandshake,
    titre: "Particuliers et familles",
    texte: "Pour votre enfant, un proche ou vous-même.",
    image: wp("/wp-content/uploads/2025/02/mineur-protection-de-lenfance.jpg"),
    alt: "Une éducatrice joue au sol avec des enfants",
  },
  {
    icone: Building2,
    titre: "Établissements",
    texte: "MECS, IME, ITEP, EHPAD, SESSAD.",
    image: wp("/wp-content/uploads/2023/02/aide-soignant.jpg"),
    alt: "Une équipe de professionnels du médico-social",
  },
  {
    icone: School,
    titre: "Écoles",
    texte: "Pendant le temps scolaire, avec l’équipe enseignante.",
    image: wp("/wp-content/uploads/2026/04/school.jpeg"),
    alt: "Une enseignante devant le tableau de sa classe",
  },
  {
    icone: TreePine,
    titre: "Mairies et collectivités",
    texte: "Périscolaire, centre de loisirs, service enfance.",
    image: wp("/wp-content/uploads/2023/02/cerf-volant-game-enfant-400x400.jpg"),
    alt: "Des enfants jouent sous un parachute coloré au centre de loisirs",
  },
];

/**
 * LES TROIS PORTES DÉJÀ POUSSÉES, le deuxième acte de la page.
 * ⚠ Chaque entrée décrit un chemin réel, pas un concurrent : on ne dit de mal
 * ni du CAMSP, ni des libéraux, ni des établissements. Ils sont saturés.
 * ⚠ Aucune durée, aucun pourcentage : nous ne mesurons pas les délais.
 */
const PORTES_FERMEES = [
  { icone: Landmark, titre: "Le service public", texte: "CAMSP, CMPP, SESSAD : une date, mais loin." },
  { icone: PhoneOff, titre: "Le libéral, en direct", texte: "Répondeur, ou liste fermée." },
  {
    icone: Building2,
    titre: "L’établissement, en interne",
    texte: "Personne à embaucher pour trois heures.",
  },
];

/** Comment une demande se déroule. Trois paliers, pas une promesse de délai. */
const DEROULE = [
  {
    numero: "1",
    icone: PenLine,
    titre: "Vous décrivez le besoin",
    texte: "Situation, objectifs, lieu. Sans compte.",
  },
  {
    numero: "2",
    icone: UserCheck,
    titre: "Un éducateur de la team répond",
    texte: "Son dossier est contrôlé par l’association avant qu’il n’intervienne.",
  },
  {
    numero: "3",
    icone: Handshake,
    titre: "L’intervention démarre",
    // Chaque mission est une PRESTATION AVEC SES OBJECTIFS (28/09/2026).
    texte: visioconsultationVisible()
      ? "Objectifs écrits, sur place ou en visio. Devis accepté avant."
      : "Objectifs écrits, chez vous, à l’école ou en établissement. Devis accepté avant.",
  },
];

/** Le bandeau de repères. ⚠ 0 % de commission partout depuis le 01/10/2026. */
function reperes(): Ligne[] {
  return [
    { icone: ShieldCheck, texte: "Dossier contrôlé par l’association" },
    { icone: FileCheck2, texte: "Devis avant toute intervention" },
    visioconsultationVisible()
      ? { icone: Video, texte: "Présentiel ou visio" }
      : { icone: MapPin, texte: "Chez vous, à l’école, en établissement" },
    { icone: Percent, texte: "0 % de commission" },
    { icone: Sparkles, texte: "Ce que vous payez revient à l’intervenant" },
    { icone: Users, texte: "Familles, écoles, mairies, établissements" },
  ];
}

/** Les pièces que l'association contrôle (titre de la section « team »). */
const PIECES: Ligne[] = [
  { icone: GraduationCap, texte: "Diplôme" },
  { icone: IdCard, texte: "Pièce d’identité" },
  { icone: Scale, texte: "Casier judiciaire (B3)" },
  { icone: BadgeCheck, texte: "Assurance" },
];

const INTERVENANT_POINTS: Ligne[] = [
  { icone: MapPin, texte: "Des demandes près de chez vous" },
  { icone: Zap, texte: "Vous acceptez, c’est à vous" },
  { icone: UserRound, texte: "En libéral, pour votre compte" },
  { icone: Wallet, texte: "L’association encaisse et vous reverse" },
];

/**
 * LES MÉTIERS DES CARROUSELS, dans cet ordre ; tout autre métier présent dans
 * l'annuaire suit, par ordre alphabétique. Le rapprochement se fait sur le
 * libellé saisi par l'intervenant, en minuscules et sans accents.
 */
const ORDRE_METIERS: { libelle: string; motif: RegExp }[] = [
  { libelle: "Éducateur spécialisé", motif: /educat\w*\s+specialise/ },
  { libelle: "Moniteur-éducateur", motif: /monit(eur|rice)/ },
  { libelle: "AES", motif: /\baes\b|accompagnant\w*\s+educati/ },
];

function sansAccents(t: string) {
  return t.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

/** Range les intervenants de l'annuaire en un groupe par métier. */
function grouperParMetier(items: VendorApercu[]): GroupeMetier[] {
  const groupes = new Map<string, GroupeMetier>();
  for (const v of items) {
    const brut = (v.metier ?? "").trim() || "Intervenant";
    const connu = ORDRE_METIERS.find((m) => m.motif.test(sansAccents(brut)));
    const metier = connu?.libelle ?? brut.charAt(0).toUpperCase() + brut.slice(1);
    const g = groupes.get(metier) ?? { metier, intervenants: [] };
    g.intervenants.push({
      id: v.id,
      nom: v.nom,
      metier: v.metier ?? null,
      ville: v.ville ?? null,
      logoUrl: v.logoUrl ?? null,
    });
    groupes.set(metier, g);
  }
  const rang = (m: string) => {
    const i = ORDRE_METIERS.findIndex((o) => o.libelle === m);
    return i === -1 ? ORDRE_METIERS.length : i;
  };
  return Array.from(groupes.values())
    .filter((g) => g.intervenants.length > 0)
    .sort((a, b) => rang(a.metier) - rang(b.metier) || a.metier.localeCompare(b.metier, "fr"));
}

/**
 * LES ÉCRITS. ⚠ Rédigés et signés par le professionnel qui a vu la personne :
 * ni la plateforme ni l'association n'écrit ni ne signe à sa place.
 * « Bilan orthophonique » et « Bilan psychologique » retirés le 28/09/2026.
 */
const ECRITS = ["Dossier MDPH", "Convention école – éducateur"];

/** Ce que la visio sert bien. Le reste se fait sur place. */
const USAGES_VISIO = ["Guidance", "Suivi", "Point avec l’école"];

/* ------------------------------------------------------------------------ */
/* Petits blocs de présentation                                              */
/* ------------------------------------------------------------------------ */

function Surtitre({ icone: Icone, children }: { icone: LucideIcon; children: ReactNode }) {
  return (
    <span className="eyebrow w-fit">
      <Icone className="size-3.5" aria-hidden />
      {children}
    </span>
  );
}

function TitreSection({
  icone,
  surtitre,
  titre,
  sousTitre,
  centre = false,
}: {
  icone: LucideIcon;
  surtitre: string;
  titre: ReactNode;
  sousTitre?: string;
  centre?: boolean;
}) {
  return (
    <div className={cn("max-w-2xl space-y-3", centre && "mx-auto text-center")}>
      <Surtitre icone={icone}>{surtitre}</Surtitre>
      <h2 className="text-balance text-3xl font-bold tracking-tight text-foreground md:text-4xl">
        {titre}
      </h2>
      {sousTitre ? <p className="text-muted-foreground">{sousTitre}</p> : null}
    </div>
  );
}

/**
 * CE QUE RENFORTEAM NE FAIT PAS.
 * ⚠ Ce n'est pas une précaution juridique, c'est l'ADN du dispositif :
 * confondre éducation spécialisée et soin, c'est promettre un diagnostic que
 * ces professionnels ne délivrent pas. Le dire évite à une famille d'attendre
 * d'ici ce qu'elle doit demander à son médecin.
 */
function NoteAdn() {
  return (
    <Reveal>
      <section className="flex flex-col gap-4 rounded-2xl border border-border bg-gradient-to-r from-card via-primary-soft to-card px-5 py-5 sm:flex-row sm:items-center sm:px-6">
        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary">
          <Scale className="size-5" aria-hidden />
        </span>
        <p className="flex-1 text-sm leading-relaxed text-muted-foreground" lang="fr">
          <strong className="block text-base font-semibold text-foreground">
            Ce n’est pas du soin, c’est de l’éducation spécialisée.
          </strong>
          Pas de diagnostic. En complément du médecin, du CAMSP ou du CMPP, jamais à leur place.
        </p>
      </section>
    </Reveal>
  );
}

/** Bandeau défilant de repères (même mécanique que l'accueil). */
function Bandeau({ items }: { items: Ligne[] }) {
  const puce = (l: Ligne, i: number) => (
    <li
      key={`${l.texte}-${i}`}
      className="inline-flex shrink-0 items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground shadow-soft"
    >
      <l.icone className="size-4 text-primary" aria-hidden />
      {l.texte}
    </li>
  );
  return (
    <section
      aria-label="Nos engagements"
      className="marquee-hover relative overflow-hidden py-2 [mask-image:linear-gradient(90deg,transparent,#000_8%,#000_92%,transparent)] motion-reduce:[mask-image:none]"
    >
      <div className="flex w-max gap-3 animate-marquee motion-reduce:w-auto motion-reduce:flex-wrap motion-reduce:justify-center">
        <ul className="flex gap-3 motion-reduce:flex-wrap motion-reduce:justify-center">
          {items.map(puce)}
        </ul>
        {/* La copie qui rend la boucle continue : décorative, et absente
            quand le visiteur demande moins d'animations. */}
        <ul className="flex gap-3 motion-reduce:hidden" aria-hidden>
          {items.map(puce)}
        </ul>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------------ */

export default async function SosRenfortPage() {
  const montreCdd = renfortSalarieVisible();
  const visio = visioconsultationVisible();

  // `error` est déstructuré : une API muette et une plateforme sans besoin
  // ouvert ne doivent pas donner le même écran.
  const { data, error } = await fetchPublic<{ items: MissionApercu[]; total: number }>(
    "/public/missions?take=6",
  );
  const missions = data?.items ?? [];
  const total = data?.total ?? 0;
  const enPanne = Boolean(error) && missions.length === 0;

  // La team, pour les carrousels. API muette = liste vide = encart d'attente.
  const { data: annuaire } = await fetchPublic<{ items: VendorApercu[] }>("/public/vendors?take=60");
  const vendors = annuaire?.items ?? [];
  const groupes = grouperParMetier(vendors);

  /*
   * ⚠⚠ LE BOUTON DE DEMANDE NE FORCE PLUS « ÉTABLISSEMENT » (21/09/2026) ET
   * NE MÈNE PLUS À L'INSCRIPTION (24/09/2026). Hors offre complète, la demande
   * se fait sur place, dans le formulaire #demande en bas de page ; le compte
   * se crée quand il y a un devis à accepter. En offre complète, seul un
   * établissement employeur publie un besoin, et le raccourci garde son sens.
   */
  const lienDemande = montreCdd ? INSCRIPTION.publierBesoin.href : "#demande";
  const libelleDemande = montreCdd ? INSCRIPTION.publierBesoin.libelle : "Demander un intervenant";
  const etapes = montreCdd ? CASCADE : DEROULE;

  return (
    <div className="space-y-20 md:space-y-24">
      {/* ═══ HÉROS : texte, deux actions, trois métiers ; photo et cartes flottantes */}
      <section className="relative isolate overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-primary/[0.12] via-background to-background px-5 py-10 sm:px-10 sm:py-14 lg:px-12">
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden>
          <span className="animate-halo absolute -left-24 -top-32 size-[26rem] rounded-full bg-primary/[0.14] blur-3xl" />
          <span className="animate-halo-2 absolute -right-24 bottom-0 size-[22rem] rounded-full bg-secondary/[0.12] blur-3xl" />
        </div>

        <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-12">
          <div className="space-y-6">
            <span className="eyebrow animate-fade-in-up">
              <Megaphone className="size-3.5" aria-hidden />
              RenforTeam
            </span>
            <h1 className="animate-fade-in-up stagger-1 text-balance text-4xl font-bold leading-[1.08] tracking-tight text-foreground sm:text-5xl">
              {montreCdd ? (
                "Un arrêt maladie à 21 h. Le poste est couvert avant l’ouverture."
              ) : (
                <>
                  Un éducateur de plus, quelques heures par semaine.{" "}
                  <span className="text-secondary">Une demande, ce soir.</span>
                </>
              )}
            </h1>
            <p className="animate-fade-in-up stagger-2 max-w-xl text-lg leading-relaxed text-muted-foreground">
              {montreCdd
                ? "Vos intervenants, puis le réseau. Vous embauchez en CDD : moins cher que l’intérim, sans requalification."
                : "Des éducateurs indépendants, sur un besoin nommé et des objectifs écrits. En Seine-et-Marne puis en Île-de-France."}
            </p>

            <div className="animate-fade-in-up stagger-3 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Button asChild size="lg">
                <Link href={lienDemande}>
                  {libelleDemande}
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href={INSCRIPTION.chercherMissions.href}>{INSCRIPTION.chercherMissions.libelle}</Link>
              </Button>
            </div>

            {!montreCdd && (
              <ul className="animate-fade-in-up stagger-4 flex flex-wrap gap-2" aria-label="Les métiers de la team">
                {METIERS_TEAM.map((m) => (
                  <li
                    key={m.texte}
                    className="inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-3 py-1.5 text-sm text-foreground backdrop-blur"
                  >
                    <span className="grid size-6 place-items-center rounded-full bg-primary/15 text-primary">
                      <m.icone className="size-3.5" aria-hidden />
                    </span>
                    {m.texte}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Colonne photo. ⚠ Reveal applique un `transform` : les cartes
              `absolute` se positionnent SUR le Reveal, pas dans son enfant
              (même piège que sur l'accueil). */}
          <div className="relative mx-auto w-full max-w-md lg:max-w-none">
            <Reveal>
              <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] shadow-card sm:aspect-[5/4] lg:aspect-[4/5]">
                <Image
                  src={wp("/wp-content/uploads/2023/02/educateur-2.jpeg")}
                  alt="Une éducatrice accompagne des enfants dans un jeu de construction"
                  fill
                  priority
                  sizes="(max-width: 1024px) 90vw, 480px"
                  className="animate-panoramique object-cover"
                />
                <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/45 to-transparent" />
              </div>
            </Reveal>
            <Reveal delay={200} className="absolute bottom-4 left-3 z-10 sm:-left-4">
              <div className="animate-derive flex items-center gap-3 rounded-2xl border border-border/70 bg-card/95 p-3 shadow-card backdrop-blur">
                <span className="grid size-9 place-items-center rounded-xl bg-primary-soft text-primary">
                  <ShieldCheck className="size-5" aria-hidden />
                </span>
                <span className="text-sm font-semibold text-foreground">Dossier contrôlé</span>
              </div>
            </Reveal>
            <Reveal delay={320} className="absolute right-3 top-4 z-10 sm:-right-4">
              <div className="animate-derive-lente flex items-center gap-3 rounded-2xl border border-border/70 bg-card/95 p-3 shadow-card backdrop-blur">
                <span className="grid size-9 place-items-center rounded-xl bg-secondary-soft text-secondary">
                  <FileCheck2 className="size-5" aria-hidden />
                </span>
                <span className="text-sm font-semibold text-foreground">Devis avant tout</span>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {montreCdd ? (
        /*
          ⚠⚠ LA NOTE DE DROIT, VENUE DE L'ACCUEIL LE 16/09/2026. Elle n'a de
          sens QUE si la page promet « sans requalification », donc uniquement
          en offre complète. Hors offre complète, c'est `NoteAdn` qui la remplace.
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

      {/* ═══ LES TROIS PORTES FERMÉES, puis la quatrième (21/09/2026).
          ⚠ On ne promet aucun délai en face : la quatrième porte n'est pas
          « plus rapide », elle est OUVERTE. */}
      {!montreCdd && (
        <section className="space-y-8">
          <Reveal>
            <TitreSection icone={DoorClosed} surtitre="Avant d’arriver ici" titre="Vous avez déjà essayé" />
          </Reveal>
          <ol className="grid gap-4 md:grid-cols-3">
            {PORTES_FERMEES.map((p, i) => (
              <li key={p.titre}>
                <Reveal delay={i * 120} className="h-full">
                  <div className="group flex h-full items-start gap-4 rounded-2xl border border-border bg-card p-5 transition duration-300 hover:-translate-y-0.5 hover:shadow-card motion-reduce:transition-none motion-reduce:hover:translate-y-0">
                    <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-muted text-muted-foreground transition-colors group-hover:text-foreground">
                      <p.icone className="size-5" aria-hidden />
                    </span>
                    <div>
                      <p className="font-semibold text-foreground">{p.titre}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{p.texte}</p>
                    </div>
                  </div>
                </Reveal>
              </li>
            ))}
          </ol>

          {/* LE PIVOT DE LA PAGE : la seule phrase qui annonce le produit. */}
          <Reveal>
            <div className="reflet relative overflow-hidden rounded-3xl border-2 border-primary/35 bg-primary-soft/50 px-6 py-7 shadow-card sm:px-10">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-card">
                  <DoorOpen className="size-7" aria-hidden />
                </span>
                <div>
                  <p className="text-2xl font-bold tracking-tight text-foreground">
                    RenforTeam est la quatrième porte.
                  </p>
                  <p className="mt-1 text-muted-foreground" lang="fr">
                    Un éducateur, sans attendre qu’une place se libère. À côté de l’équipe qui suit
                    déjà la personne.
                  </p>
                </div>
              </div>
            </div>
          </Reveal>
        </section>
      )}

      {/* ═══ QUI PEUT DEMANDER, en cartes photo. Le bloc n'existe que depuis 2026. */}
      {!montreCdd && (
        <section className="space-y-8">
          <Reveal>
            <TitreSection
              icone={Users}
              surtitre="Ouvert à tous"
              titre="Qui peut demander ? Tout le monde."
              sousTitre="Sans prescription, sans dossier à monter d’avance."
            />
          </Reveal>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {DEMANDEURS.map((d, i) => (
              <li key={d.titre}>
                <Reveal delay={i * 100} className="h-full">
                  <div className="group relative aspect-[16/11] overflow-hidden rounded-2xl border border-border shadow-soft transition duration-300 hover:-translate-y-1 hover:shadow-card motion-reduce:transition-none motion-reduce:hover:translate-y-0 sm:aspect-[4/5]">
                    <Image
                      src={d.image}
                      alt={d.alt}
                      fill
                      sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 280px"
                      className="object-cover transition-transform duration-700 group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
                    <span className="absolute left-4 top-4 grid size-10 place-items-center rounded-xl bg-white/90 text-neutral-900 shadow-card">
                      <d.icone className="size-5" aria-hidden />
                    </span>
                    <div className="absolute inset-x-0 bottom-0 p-4 text-white">
                      <p className="text-lg font-semibold">{d.titre}</p>
                      <p className="text-sm text-white/85">{d.texte}</p>
                    </div>
                  </div>
                </Reveal>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ═══ OFFRE COMPLÈTE : les deux rôles, employeur et salarié en CDD.
          ⚠ Hors offre complète, ces deux cartes ne s'affichent pas : la carte
          de gauche répétait « Qui peut demander ». */}
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
                  <li key={l.texte} className="flex gap-3 text-sm leading-relaxed text-muted-foreground">
                    <l.icone className="mt-0.5 size-4 shrink-0 text-primary" />
                    {l.texte}
                  </li>
                ))}
              </ul>
              <Button asChild variant="outline" className="w-full">
                <Link href={INSCRIPTION.publierBesoin.href}>{INSCRIPTION.publierBesoin.libelle}</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="border-border/80">
            <CardContent className="space-y-5 p-8">
              <div className="flex items-center gap-3">
                <span className="grid size-11 place-items-center rounded-xl bg-secondary/15 text-secondary">
                  <UserRound className="size-5" />
                </span>
                <div>
                  <p className="text-xl font-medium text-foreground">Vous êtes intervenant</p>
                  <p className="text-sm text-muted-foreground">Éducateur, moniteur, AES…</p>
                </div>
              </div>
              <ul className="space-y-3">
                {INTERVENANT.map((l) => (
                  <li key={l.texte} className="flex gap-3 text-sm leading-relaxed text-muted-foreground">
                    <l.icone className="mt-0.5 size-4 shrink-0 text-secondary" />
                    {l.texte}
                  </li>
                ))}
              </ul>
              <Button asChild variant="outline" className="w-full">
                <Link href={INSCRIPTION.chercherMissions.href}>{INSCRIPTION.chercherMissions.libelle}</Link>
              </Button>
            </CardContent>
          </Card>
        </section>
      )}

      {/* ═══ LE DÉROULÉ, en frise numérotée. La cascade en offre complète.
          ⚠ LE TRAIT QUI RELIE LES PASTILLES N'EST PAS UNE DÉCORATION : sans
          lui, trois pastilles se lisent comme trois options, pas comme un
          trajet. Il se dessine quand la frise entre à l'écran (classe
          `is-visible` posée par Reveal), horizontal dès `md`, vertical
          dessous. Il est posé au centre des pastilles (`size-14` = 56 px). */}
      <section className="space-y-10">
        <Reveal>
          <TitreSection
            icone={Clock}
            surtitre={montreCdd ? "La diffusion en cascade" : "Trois étapes"}
            titre={montreCdd ? "Le besoin descend palier par palier" : "Comment ça se passe"}
            sousTitre={
              montreCdd
                ? "Il s’arrête dès qu’il est pourvu."
                : "Rien n’est engagé tant que le devis n’est pas accepté."
            }
          />
        </Reveal>
        <Reveal className="relative">
          <span
            aria-hidden
            className="pointer-events-none absolute left-[16%] right-[16%] top-[28px] hidden h-0.5 origin-left scale-x-0 rounded-full bg-gradient-to-r from-primary via-secondary to-primary transition-transform delay-300 duration-1000 ease-out motion-reduce:scale-x-100 motion-reduce:transition-none md:block [.is-visible_&]:scale-x-100"
          />
          <span
            aria-hidden
            className="pointer-events-none absolute bottom-10 left-[27px] top-10 w-0.5 origin-top scale-y-0 rounded-full bg-gradient-to-b from-primary via-secondary to-primary transition-transform delay-300 duration-1000 ease-out motion-reduce:scale-y-100 motion-reduce:transition-none md:hidden [.is-visible_&]:scale-y-100"
          />
          <ol className="relative grid gap-8 md:grid-cols-3 md:gap-6">
            {etapes.map((c) => (
              <li key={c.numero} className="flex gap-4 md:flex-col md:items-center md:text-center">
                <span className="relative grid size-14 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground shadow-card ring-4 ring-background">
                  <c.icone className="size-6" aria-hidden />
                  <span className="absolute -right-1 -top-1 grid size-6 place-items-center rounded-full bg-secondary text-xs font-bold text-secondary-foreground ring-2 ring-background">
                    {c.numero}
                  </span>
                </span>
                <div className="pt-1 md:pt-0">
                  <p className="text-lg font-semibold text-foreground">{c.titre}</p>
                  <p className="mt-1 text-sm text-muted-foreground" lang="fr">
                    {c.texte}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </Reveal>
      </section>

      {!montreCdd && <Bandeau items={reperes()} />}

      {/*
        ═══ POURQUOI RENFORTEAM EST COMMISSIONNÉ (21/09/2026) ═══
        ⚠ Le reste du site annonce 0 % : la page DOIT dire pourquoi elle ne dit
        pas la même chose. Ici, l'association contrôle un professionnel avant
        de l'envoyer chez quelqu'un.
        ⚠ 01/10/2026 : 0 % de commission, sur les renforts comme sur les
        ateliers. Ce que le client paie revient à l'intervenant. Les « 15 % de
        frais de gestion » sont retirés de ce bloc et du bandeau.
        ⚠⚠ Ce bloc vient APRÈS le déroulé : un prix lu avant de comprendre
        l'offre se lit toujours comme cher. Ne pas le remonter.
        ⚠ Titre : plus aucune promesse écrite avec « vérifié(s) » (28/09/2026).
      */}
      {!montreCdd && (
        <Reveal>
          <section className="relative overflow-hidden rounded-3xl bloc-nuit bg-[hsl(222,21%,15%)] px-6 py-10 shadow-card ring-1 ring-border sm:px-10 md:py-12">
            <div className="absolute inset-0 bg-grid opacity-10" aria-hidden />
            <div className="absolute -right-16 -top-16 size-64 rounded-full bg-secondary/20 blur-3xl" aria-hidden />
            <div className="relative grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
              <div className="space-y-5">
                <span className="grid size-12 place-items-center rounded-xl bg-primary/20 text-primary">
                  <ShieldCheck className="size-6" aria-hidden />
                </span>
                <h2 className="text-balance text-2xl font-bold tracking-tight text-foreground md:text-3xl">
                  Une team d’éducateurs, pas un annuaire ouvert
                </h2>
                <p className="text-muted-foreground" lang="fr">
                  L’association contrôle le dossier de chacun avant qu’il n’intervienne.
                </p>
                <ul className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
                  {PIECES.map((p) => (
                    <li
                      key={p.texte}
                      className="inline-flex items-center gap-2 rounded-xl border border-border bg-white/5 px-3 py-2 text-sm text-foreground"
                    >
                      <p.icone className="size-4 shrink-0 text-primary" aria-hidden />
                      {p.texte}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-2xl border border-border bg-white/5 p-6">
                <p className="flex items-baseline gap-2">
                  <span className="text-5xl font-bold tracking-tight text-foreground">0&nbsp;%</span>
                  <span className="text-sm text-muted-foreground">de commission</span>
                </p>
                <p className="mt-1 text-sm font-medium text-foreground">
                  Ce que vous payez revient à l’intervenant.
                </p>
                <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                  {[
                    "Renforts et ateliers : même règle",
                    "Le tarif est écrit sur le devis, avant votre accord",
                  ].map((t) => (
                    <li key={t} className="flex items-start gap-2">
                      <Check className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>
        </Reveal>
      )}

      {/* ═══ LA TEAM, UN CARROUSEL PAR MÉTIER (01/10/2026) ═══
          Les cartes sont celles de l'annuaire public (/public/vendors), comme
          sur la fiche atelier. Un métier sans personne n'a pas de carrousel ;
          une API muette donne l'encart d'attente, jamais une section vide. */}
      <section id="team" className="scroll-mt-24 space-y-8">
        <Reveal>
          <TitreSection
            icone={Users}
            surtitre="La team"
            titre="Rencontrez les intervenants"
            sousTitre={montreCdd ? undefined : "Choisissez un profil, ou laissez-nous trouver la bonne personne."}
          />
        </Reveal>
        {groupes.length > 0 ? (
          <Reveal>
            <CarrouselsIntervenants groupes={groupes} demandeCiblee={!montreCdd} />
          </Reveal>
        ) : (
          <Reveal>
            <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-border bg-card/60 px-6 py-10 text-center">
              <span className="grid size-14 place-items-center rounded-2xl bg-primary/15 text-primary">
                <Users className="size-7" aria-hidden />
              </span>
              <p className="font-semibold text-foreground">Les profils de la team arrivent ici.</p>
              <p className="max-w-md text-sm text-muted-foreground">
                Vous êtes éducateur, moniteur-éducateur ou AES&nbsp;? Votre carte peut être la première.
              </p>
              <Button asChild>
                <Link href="/intervenant-independant">
                  Rejoindre la team <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>
          </Reveal>
        )}
      </section>

      {/*
        ═══ LA VISIOCONSULTATION ET LES ÉCRITS ═══
        ⚠ LA CARTE VISIO N'EST PAS ENCORE VRAIE tant que `visioconsultationVisible()`
        ne l'est pas (ni salle, ni lien, ni serveur média) : on ne l'annonce que
        le jour où un rendez-vous peut réellement avoir lieu.
        ⚠ La visio n'est pas un second choix, mais elle ne convient pas à tout :
        la première rencontre et le lieu de vie se font sur place.
      */}
      {!montreCdd && (
        <section className={cn("grid gap-6", visio && "lg:grid-cols-2")}>
          {visio && (
            <Reveal className="h-full">
              <CarteImage
                image={wp("/wp-content/uploads/2023/02/educatheure.jpeg")}
                alt="Un éducateur souriant, tablette en main, prêt pour un rendez-vous"
                icone={Video}
                titre="En visio ou en présentiel"
                ligne="Un lien par rendez-vous, rien à installer. Première rencontre sur place."
                puces={USAGES_VISIO}
              />
            </Reveal>
          )}
          <Reveal delay={visio ? 120 : 0} className="h-full">
            <CarteImage
              image={wp("/wp-content/uploads/2021/09/apprendre-par-le-dessin-scaled.jpg")}
              alt="Un enfant dessine, entouré de crayons et de feuilles"
              icone={FileText}
              titre="Les écrits qui débloquent"
              ligne="En option. Rédigés et signés par le professionnel qui a vu la personne, jamais par l’association."
              puces={ECRITS}
              large={!visio}
            />
          </Reveal>
        </section>
      )}

      {/*
        ═══ L'AUTRE CÔTÉ : l'intervenant, juste avant les missions ouvertes ═══
        ⚠ « INTERVENANT INDÉPENDANT », JAMAIS « FREELANCE » (Conseil d'État,
        11/02/2025, n° 491128 ; `lib/__tests__/promesses-interdites.test.ts`).
      */}
      {!montreCdd && (
        <Reveal>
          <section className="overflow-hidden rounded-3xl border border-secondary/30 bg-gradient-to-br from-secondary/[0.12] via-card to-card">
            <div className="grid lg:grid-cols-[0.9fr_1.1fr]">
              <div className="relative aspect-[16/9] lg:aspect-auto">
                <Image
                  src={wp("/wp-content/uploads/2023/04/groupe-id-2.jpg")}
                  alt="Des professionnels souriants tiennent des bulles de dialogue colorées"
                  fill
                  sizes="(max-width: 1024px) 100vw, 520px"
                  className="object-cover"
                />
              </div>
              <div className="space-y-5 px-6 py-8 sm:px-10">
                <Surtitre icone={UserRound}>Intervenants</Surtitre>
                <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                  Vous êtes de l’autre côté&nbsp;?
                </h2>
                <p className="text-muted-foreground" lang="fr">
                  Éducateur spécialisé, moniteur-éducateur, AES&nbsp;: ces demandes vous attendent.
                </p>
                <ul className="grid gap-2 sm:grid-cols-2">
                  {INTERVENANT_POINTS.map((l) => (
                    <li
                      key={l.texte}
                      className="flex items-center gap-3 rounded-xl border border-border bg-background/60 px-3 py-2.5 text-sm text-foreground"
                    >
                      <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-secondary/15 text-secondary">
                        <l.icone className="size-4" aria-hidden />
                      </span>
                      {l.texte}
                    </li>
                  ))}
                </ul>
                {/* ⚠ ADHÉSION OBLIGATOIRE EN 2027 (décision de Siham, 01/10/2026). */}
                <p className="flex items-start gap-3 rounded-xl border border-secondary/30 bg-secondary/10 px-3 py-2.5 text-sm text-foreground">
                  <HeartHandshake className="mt-0.5 size-4 shrink-0 text-secondary" aria-hidden />
                  <span>
                    À partir de 2027, tous les intervenants seront adhérents de l’association
                    ADéPA pour utiliser la plateforme.
                  </span>
                </p>
                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                  <Button asChild>
                    <Link href={INSCRIPTION.chercherMissions.href}>
                      {INSCRIPTION.chercherMissions.libelle} <ArrowRight className="size-4" />
                    </Link>
                  </Button>
                  <Button asChild variant="ghost">
                    <Link href="/intervenant-independant">Proposer aussi mes ateliers</Link>
                  </Button>
                </div>
              </div>
            </div>
          </section>
        </Reveal>
      )}

      {/* Missions ouvertes, aperçu flouté. ⚠ Le détail reste réservé aux
          comptes : ce sont les besoins de structures clientes. */}
      {enPanne ? (
        <section className="flex items-start gap-3 rounded-2xl border border-warning/40 bg-warning/5 px-6 py-5">
          <Clock className="mt-0.5 size-5 shrink-0 text-warning" aria-hidden />
          <div>
            <p className="font-medium text-foreground">Les missions ouvertes ne s’affichent pas en ce moment</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Un incident de notre côté, pas une absence de besoins. Réessayez dans quelques minutes.
            </p>
          </div>
        </section>
      ) : null}

      {missions.length > 0 ? (
        <section className="space-y-6">
          <Reveal>
            <TitreSection
              icone={Zap}
              surtitre="En ce moment"
              titre={`${total} ${total > 1 ? "missions ouvertes" : "mission ouverte"}`}
              sousTitre="Métier, ville et dates visibles. Le reste après connexion."
            />
          </Reveal>

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
                      {m.categoryRef?.title ? <Badge variant="outline">{m.categoryRef.title}</Badge> : null}
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
                Détail réservé aux comptes
              </p>
              <Button asChild>
                <Link href={INSCRIPTION.chercherMissions.href}>
                  {INSCRIPTION.chercherMissions.libelle} <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      ) : null}

      {/* ⚠ Offre complète uniquement : ces deux composants décrivent
          l'établissement employeur (vivier de CDD, export paie). */}
      {montreCdd && (
        <>
          <UnSeulFormulaire />
          <ApercuProduit />
        </>
      )}

      {/* LA DEMANDE SANS COMPTE (24/09/2026) : elle arrive dans /admin/contacts.
          Le compte se crée au moment d'accepter un devis. */}
      {!montreCdd && (
        <section id="demande" className="mx-auto max-w-2xl scroll-mt-24 space-y-6">
          <Reveal>
            <TitreSection
              icone={PenLine}
              surtitre="Sans compte"
              titre="Décrire le besoin"
              sousTitre="Réponse sous 24 h ouvrées. Le compte ne se crée qu’au devis."
              centre
            />
          </Reveal>
          <FormulaireDemande
            intervenants={vendors.map((v) => ({ id: v.id, nom: v.nom }))}
            sujet="RenforTeam · demande sans compte"
            bouton="Envoyer ma demande"
            structure
            offre="La situation, les objectifs de l’intervention, où et quand. N’indiquez ni le nom d’une personne accompagnée, ni une information de santé."
          />
        </section>
      )}

      {/* CTA final. ⚠ Il parle aux deux publics : l'intervenant ne doit pas
          repartir sans rien à cliquer. */}
      <Reveal>
        <section className="relative overflow-hidden rounded-3xl bloc-nuit bg-[hsl(222,21%,15%)] px-6 py-12 text-center shadow-card ring-1 ring-border sm:px-12">
          <div className="absolute inset-0 bg-grid opacity-10" aria-hidden />
          <div className="absolute -left-16 -top-16 size-64 rounded-full bg-primary/20 blur-3xl" aria-hidden />
          <div className="relative mx-auto max-w-2xl space-y-5">
            <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-primary/20 text-primary">
              <Megaphone className="size-7" aria-hidden />
            </span>
            <h2 className="text-balance text-3xl font-bold tracking-tight text-foreground">
              {montreCdd
                ? "Le prochain arrêt maladie tombera un vendredi soir."
                : "La liste d’attente ne raccourcira pas toute seule."}
            </h2>
            <p className="text-muted-foreground">
              {montreCdd
                ? "Cinq minutes, gratuit. Vous ne payez que les renforts réalisés."
                : "Quelques minutes pour décrire la situation. Vous ne payez qu’après un devis accepté."}
            </p>
            <div className="flex flex-col justify-center gap-3 pt-2 sm:flex-row">
              <Button asChild size="lg" variant="secondary">
                <Link href={lienDemande}>
                  {libelleDemande}
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-border bg-transparent text-foreground hover:bg-accent"
              >
                <Link href="/login?next=/dashboard/renforts">Se connecter</Link>
              </Button>
            </div>
            <p className="border-t border-border/60 pt-5 text-sm text-muted-foreground" lang="fr">
              {montreCdd
                ? "Vous êtes intervenant ? L’établissement vous embauche en CDD, sans statut d’indépendant."
                : "Vous exercez en libéral ? L’association vous règle, sans relance ni impayé."}{" "}
              <Link
                href={INSCRIPTION.chercherMissions.href}
                className="font-medium text-foreground underline underline-offset-4 hover:text-primary"
              >
                {INSCRIPTION.chercherMissions.libelle}
              </Link>
            </p>
          </div>
        </section>
      </Reveal>
    </div>
  );
}

/** Carte image + icône + titre + une ligne + pastilles (visio, écrits). */
function CarteImage({
  image,
  alt,
  icone: Icone,
  titre,
  ligne,
  puces,
  large = false,
}: {
  image: string;
  alt: string;
  icone: LucideIcon;
  titre: string;
  ligne: string;
  puces: string[];
  large?: boolean;
}) {
  return (
    <div
      className={cn(
        "group grid h-full overflow-hidden rounded-3xl border border-border bg-card shadow-soft transition duration-300 hover:-translate-y-0.5 hover:shadow-card motion-reduce:transition-none motion-reduce:hover:translate-y-0",
        large && "md:grid-cols-2",
      )}
    >
      <div className={cn("relative aspect-[16/9] overflow-hidden", large && "md:aspect-auto md:min-h-[260px]")}>
        <Image
          src={image}
          alt={alt}
          fill
          sizes={large ? "(max-width: 768px) 100vw, 560px" : "(max-width: 1024px) 100vw, 560px"}
          className="object-cover transition-transform duration-700 group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
        />
      </div>
      <div className="space-y-3 p-6">
        <span className="grid size-11 place-items-center rounded-xl bg-primary/15 text-primary">
          <Icone className="size-5" aria-hidden />
        </span>
        <p className="text-xl font-semibold text-foreground">{titre}</p>
        <p className="text-sm text-muted-foreground" lang="fr">
          {ligne}
        </p>
        <ul className="flex flex-wrap gap-2">
          {puces.map((p) => (
            <li key={p}>
              <Badge variant="secondary" className="gap-1.5 font-normal">
                <Check className="size-3.5" aria-hidden />
                {p}
              </Badge>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------------ */
/* L'OFFRE COMPLÈTE : conservée intégralement, plus affichée par défaut       */
/* ------------------------------------------------------------------------ */

/**
 * ⚠ CE QUI SUIT DÉCRIT LE RENFORT DE POSTE EN CDD SALARIÉ, hors offre publique
 * depuis le 19/09/2026 (`@/lib/offre`). Rien n'est supprimé : ces trois listes
 * se rallument avec NEXT_PUBLIC_OFFRE_PUBLIQUE=complete.
 *
 * ⚠ La cascade ne commence plus par « votre équipe » (24/09/2026, « 1 compte
 * = 1 personne ») : elle part des intervenants que l'établissement connaît,
 * puis du réseau.
 */
const CASCADE = [
  {
    numero: "1",
    icone: Users,
    titre: "Vos intervenants d’abord",
    texte: "Ceux déjà venus chez vous : pas de temps d’adaptation.",
  },
  {
    numero: "2",
    icone: Network,
    titre: "Puis le réseau",
    texte: "Sans réponse, le besoin s’ouvre, classé par correspondance.",
  },
  {
    numero: "3",
    icone: FileSignature,
    titre: "Le premier qui accepte",
    texte: "Vous l’embauchez en CDD, contrat signé en ligne.",
  },
];

const ETABLISSEMENT: Ligne[] = [
  { icone: Clock, texte: "Publication en trois minutes : métier, dates, horaires, lieu, taux." },
  { icone: Zap, texte: "Marquez « urgent » et le besoin saute directement à la diffusion large." },
  { icone: Users, texte: "Le premier intervenant qui accepte emporte la mission, pas de tri à faire." },
  // Ce que la plateforme produit est une proposition chiffrée, pas un contrat
  // de travail : c'est l'établissement qui embauche, en son nom propre.
  { icone: FileCheck2, texte: "Proposition chiffrée immédiate, puis votre CDD pré-rempli en un clic." },
];

const INTERVENANT: Ligne[] = [
  { icone: MapPin, texte: "Des missions près de chez vous, filtrées par métier et disponibilité." },
  { icone: Zap, texte: "Vous acceptez, c’est à vous. Pas de candidature à défendre, pas d’attente." },
  { icone: ShieldCheck, texte: "Structures identifiées, taux horaire brut annoncé avant d’accepter." },
  { icone: FileCheck2, texte: "Vous êtes embauché en CDD par l’établissement : un vrai bulletin de paie, pas une facture." },
];
