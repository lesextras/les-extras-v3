import type { Metadata } from "next";
import Link from "next/link";
import {
  AlertTriangle,
  BadgeCheck,
  Building2,
  CalendarClock,
  FileText,
  Gauge,
  MessageSquareWarning,
  Scale,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { metaPublique } from "@/lib/meta";

export const metadata: Metadata = metaPublique({
  title: "Informations réglementaires, organisme de formation",
  description:
    "Identité de l’organisme, prérequis, délais d’accès, modalités d’évaluation, accessibilité, indicateurs de résultats et procédure de réclamation.",
  path: "/informations-reglementaires",
});

/**
 * PAGE RÉGLEMENTAIRE DE L'ORGANISME DE FORMATION.
 *
 * ── POURQUOI ELLE EXISTE ────────────────────────────────────────────────────
 * Ce sont les premiers points qu'un OPCO, France Travail ou un stagiaire
 * vérifient : qui est l'organisme, quels sont les prérequis, sous quel délai
 * on accède, comment on est évalué, comment on réclame. La même page existe
 * déjà sur toulali.fr (`/informations-reglementaires/`) ; celle-ci est son
 * pendant pour le catalogue Les Extras, qui porte désormais des formations
 * gratuites en ligne à côté des actions Qualiopi facturées au devis.
 *
 * ── LES CHIFFRES VIENNENT DU CERTIFICAT, PAS D'UNE NOTE INTERNE ─────────────
 * NDA 11771011677 (et NON la variante « 11 77 01011 77 » qui a circulé),
 * siège 7 rue André Malraux 77000 Melun (Dammarie-lès-Lys est l'adresse
 * administrative), SIRET 820 051 852 00011, certificat QNW0132 délivré par
 * QUALIPRO CERTIFICATION (COFRAC 5-0681) le 10/03/2026, valable jusqu'au
 * 09/03/2029, périmètre : actions de formation ET bilans de compétences.
 *
 * ── DEUX CHOSES QU'ON NE PUBLIE PAS, ET C'EST VOLONTAIRE ────────────────────
 * 1. AUCUN INDICATEUR DE RÉSULTATS CHIFFRÉ. Aucune session n'est terminée.
 *    Publier un taux inventé serait une faute lourde vis-à-vis d'un financeur ;
 *    une page qui dit honnêtement « pas encore » vaut mieux qu'un pourcentage
 *    invérifiable. À REMPLIR dès la fin de la première session.
 * 2. AUCUN MÉDIATEUR DE LA CONSOMMATION N'EST NOMMÉ. L'article L612-1 du code
 *    de la consommation l'impose dès qu'on vend à un particulier. Tant que
 *    l'association n'a pas adhéré à un médiateur référencé par la CECMC,
 *    l'attestation de suivi à 20 € N'EST PAS MISE EN VENTE : la fiche annonce
 *    le prix et renvoie au contact, les conditions sont communiquées avant tout
 *    paiement, et aucun tunnel d'achat n'existe. Inventer un nom de médiateur
 *    serait pire que de ne rien écrire.
 */

const RELEVE_LE = "2 septembre 2026";

const IDENTITE = [
  ["Raison sociale", "Association ADéPA, association loi 1901"],
  ["Dispositif", "LES EXTRAS"],
  ["Siège social", "7 rue André Malraux, 77000 Melun"],
  ["SIRET", "820 051 852 00011"],
  [
    "Déclaration d’activité",
    "11771011677, enregistrée auprès du préfet de région Île-de-France",
  ],
  [
    "Certification qualité",
    "Qualiopi n° QNW0132, délivrée par QUALIPRO CERTIFICATION (accréditation COFRAC n° 5-0681) le 10 mars 2026, valable jusqu’au 9 mars 2029",
  ],
  [
    "Périmètre certifié",
    "Actions de formation et bilans de compétences",
  ],
  ["Contact", "Par le formulaire de contact du site"],
];

const CATEGORIES = [
  {
    icone: BadgeCheck,
    titre: "Les actions de formation facturées au devis",
    corps: [
      "Ce sont les formations animées en présentiel ou à distance, commandées par un établissement et facturées à l’association. Elles entrent dans le périmètre de la certification Qualiopi et peuvent, à ce titre, être présentées à un financeur.",
      "Durée, prérequis, objectifs, modalités et tarif figurent sur la fiche de chaque formation, au catalogue.",
    ],
  },
  {
    icone: Wallet,
    titre: "Les mini-formations gratuites en ligne",
    corps: [
      "Ce sont des parcours courts, en accès libre, sans inscription payante et sans date de fin. Chacun travaille une compétence éducative précise et se suit en quarante-cinq minutes environ, plus une boîte à outils d’annexes.",
      "Elles ne sont PAS des actions de formation au sens du code du travail, elles ne sont pas couvertes par la certification Qualiopi, et elles ne peuvent pas être présentées à un financeur. Une attestation de suivi nominative peut être délivrée : ce n’est ni un diplôme, ni une certification professionnelle inscrite au RNCP ou au RS.",
    ],
  },
];

const PREREQUIS = [
  "Aucun prérequis de diplôme ni d’expérience pour les mini-formations gratuites. Elles s’adressent aux parents comme aux professionnels.",
  "Une situation réelle sous la main : les exercices se font sur une personne que vous accompagnez ou que vous élevez, jamais sur un cas fictif.",
  "Un accès à internet et un navigateur à jour. Les parcours se suivent sur ordinateur, tablette ou téléphone.",
  "Pour les formations facturées au devis, les prérequis propres à chaque action figurent sur sa fiche.",
];

const DELAIS = [
  [
    "Mini-formation gratuite en ligne",
    "Accès immédiat, sans inscription payante. Aucun délai.",
  ],
  [
    "Formation commandée par un établissement",
    "Réponse à une demande de devis sous 72 heures ouvrées. Le calendrier est fixé avec l’établissement ; comptez deux à quatre semaines entre l’accord et la première séance, le temps de la convention et de l’organisation.",
  ],
  [
    "Parcours financé (OPCO, France Travail)",
    "Deux à quatre semaines de traitement administratif s’ajoutent, hors délai de l’organisme.",
  ],
];

const EVALUATION = [
  "Les mini-formations en ligne enregistrent la progression module par module : chaque module porte une durée minimale de consultation, et le parcours est réputé suivi lorsque tous les modules ont été parcourus.",
  "Chaque module se termine par trois critères vérifiables, « Avant de passer au module suivant », que l’apprenant coche lui-même. Ce ne sont pas des questions de connaissance : ce sont des productions (une grille remplie, une phrase écrite, un relevé compté).",
  "Il n’y a ni examen, ni note, ni classement.",
  "Les formations facturées au devis suivent les modalités d’évaluation décrites sur leur propre fiche, et donnent lieu à une attestation de fin de formation.",
];

const ACCESSIBILITE = [
  "Les parcours en ligne se lisent au clavier, se redimensionnent, et n’imposent ni durée ni rythme : ils sont accessibles sans date de fin et se fractionnent librement.",
  "Les contenus sont écrits en phrases courtes, sans jargon non expliqué, et chaque grille est reproduite en texte plutôt qu’en image : une image de tableau n’est pas lisible par une synthèse vocale.",
  "Pour toute situation de handicap nécessitant un aménagement, sur une formation en ligne comme en présentiel, , prenez contact avant l’inscription : nous étudions l’aménagement possible et, si nous ne pouvons pas le proposer, nous orientons vers un organisme qui le peut.",
];

const RECLAMATION = [
  "Toute réclamation s’adresse à l’association par le formulaire de contact du site, ou par courrier au siège social.",
  "Nous accusons réception sous 5 jours ouvrés.",
  "Une réponse motivée est apportée sous 15 jours ouvrés à compter de l’accusé de réception.",
  "En cas de désaccord persistant, la présidence de l’association est saisie et statue sous un mois.",
];

export default function InformationsReglementairesPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-14">
      <header className="max-w-3xl space-y-5">
        <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          <Scale className="size-3.5" />
          Informations réglementaires
        </span>
        <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
          Ce qu’un financeur, un stagiaire ou une direction doit pouvoir vérifier
        </h1>
        <p className="text-lg leading-relaxed text-foreground/75">
          Identité de l’organisme, prérequis, délais d’accès, modalités d’évaluation,
          accessibilité, indicateurs de résultats et procédure de réclamation. Deux
          rubriques sont volontairement vides, et la page dit pourquoi plutôt que
          d’afficher un chiffre invérifiable.
        </p>
        <p className="text-sm text-muted-foreground">
          Page à jour au {RELEVE_LE}.
        </p>
      </header>

      {/* 1, L'organisme */}
      <section className="space-y-5">
        <h2 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
          <Building2 className="size-5 text-primary" />
          L’organisme de formation
        </h2>
        <div className="overflow-x-auto rounded-2xl border border-border">
          <table className="w-full text-sm">
            <tbody>
              {IDENTITE.map(([cle, valeur], i) => (
                <tr key={cle} className={i % 2 ? "bg-card" : "bg-muted/40"}>
                  <th className="sm:w-56 border-b border-border px-4 py-3 text-left align-top font-medium text-foreground">
                    {cle}
                  </th>
                  <td className="border-b border-border px-4 py-3 align-top text-foreground/80">
                    {valeur}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Une déclaration d'activité n'est PAS un agrément de l'État : le dire
            évite une confusion que le code du travail impose de ne pas
            entretenir (art. L6351-1 et s.). */}
        <p className="text-sm text-muted-foreground">
          L’enregistrement d’une déclaration d’activité auprès du préfet de région ne
          vaut pas agrément de l’État.
        </p>
      </section>

      {/* 2, Deux catégories */}
      <section className="space-y-5">
        <h2 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
          <FileText className="size-5 text-primary" />
          Deux catégories, et elles n’ont pas le même statut
        </h2>
        <div className="grid gap-5 sm:grid-cols-2">
          {CATEGORIES.map((c) => (
            <div key={c.titre} className="rounded-2xl border border-border bg-card p-6 shadow-soft">
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary-soft text-primary">
                <c.icone className="size-5" />
              </div>
              <h3 className="mt-4 font-semibold text-foreground">{c.titre}</h3>
              {c.corps.map((p) => (
                <p key={p} className="mt-2 text-sm leading-relaxed text-foreground/70">
                  {p}
                </p>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* 3, Prérequis */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">Prérequis</h2>
        <ul className="space-y-2">
          {PREREQUIS.map((p) => (
            <li
              key={p}
              className="rounded-xl border border-border bg-card p-4 text-sm leading-relaxed text-foreground/80"
            >
              {p}
            </li>
          ))}
        </ul>
      </section>

      {/* 4, Délais d'accès */}
      <section className="space-y-4">
        <h2 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
          <CalendarClock className="size-5 text-primary" />
          Délais d’accès
        </h2>
        <div className="overflow-x-auto rounded-2xl border border-border">
          <table className="w-full text-sm">
            <tbody>
              {DELAIS.map(([quoi, delai], i) => (
                <tr key={quoi} className={i % 2 ? "bg-card" : "bg-muted/40"}>
                  <th className="sm:w-64 border-b border-border px-4 py-3 text-left align-top font-medium text-foreground">
                    {quoi}
                  </th>
                  <td className="border-b border-border px-4 py-3 align-top text-foreground/80">
                    {delai}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 5, Évaluation et sanction */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">
          Modalités d’évaluation et sanction du parcours
        </h2>
        <ul className="space-y-2">
          {EVALUATION.map((e) => (
            <li
              key={e}
              className="rounded-xl border border-border bg-card p-4 text-sm leading-relaxed text-foreground/80"
            >
              {e}
            </li>
          ))}
        </ul>
        {/* Le mot « certificat » est proscrit dans tout le dispositif : il
            évoque une certification professionnelle que ces parcours ne sont
            pas. La page l'écrit noir sur blanc plutôt que de laisser le doute. */}
        <div className="rounded-2xl border-2 border-primary/30 bg-primary-soft/30 p-6">
          <h3 className="flex items-center gap-2 font-semibold text-foreground">
            <ShieldCheck className="size-4 text-primary" />
            L’attestation de suivi, et ce qu’elle n’est pas
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-foreground/80">
            Une attestation de suivi nominative peut être délivrée à l’issue d’une
            mini-formation gratuite, pour 20 €, à la demande. Elle indique que vous avez
            suivi le parcours. <strong>Ce n’est ni un diplôme, ni une certification
            professionnelle inscrite au RNCP ou au RS, ni une action de formation
            certifiée Qualiopi.</strong> Nous employons volontairement le mot
            « attestation » et jamais le mot « certificat », qui laisserait entendre
            l’inverse.
          </p>
          <p className="mt-2 text-sm leading-relaxed text-foreground/80">
            La formation elle-même reste intégralement gratuite, avec ou sans
            attestation.
          </p>
        </div>
      </section>

      {/* 6, Accessibilité */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">
          Accessibilité et situation de handicap
        </h2>
        <ul className="space-y-2">
          {ACCESSIBILITE.map((a) => (
            <li
              key={a}
              className="rounded-xl border border-border bg-card p-4 text-sm leading-relaxed text-foreground/80"
            >
              {a}
            </li>
          ))}
        </ul>
        {/* Le référent handicap doit être NOMMÉ : c'est un attendu Qualiopi
            (indicateur 26) et c'est une décision de Siham, pas une donnée que
            le code peut inventer. Tant qu'il n'est pas désigné, la page décrit
            la fonction et le canal, sans prétendre qu'une personne existe. */}
        <p className="text-sm text-muted-foreground">
          La fonction de référent handicap est assurée par la direction de
          l’association ; la personne désignée sera nommée sur cette page.
        </p>
      </section>

      {/* 7, Indicateurs */}
      <section className="space-y-4">
        <h2 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
          <Gauge className="size-5 text-primary" />
          Indicateurs de résultats
        </h2>
        <div className="rounded-2xl border-2 border-dashed border-border bg-muted/30 p-6">
          <p className="text-sm leading-relaxed text-foreground/80">
            <strong>Aucun indicateur n’est publié à ce jour, et c’est volontaire.</strong>{" "}
            Les mini-formations gratuites viennent d’être mises en ligne et aucune
            session de formation facturée n’est encore terminée. Nous préférons une page
            honnête à des pourcentages invérifiables.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-foreground/80">
            Dès la fin de la première session, cette rubrique portera les taux réels :
            nombre de participants, taux d’achèvement, taux de satisfaction, et le
            nombre de réponses sur lequel ils sont calculés.
          </p>
        </div>
      </section>

      {/* 8, Réclamation */}
      <section className="space-y-4">
        <h2 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
          <MessageSquareWarning className="size-5 text-primary" />
          Procédure de réclamation
        </h2>
        <ol className="space-y-2">
          {RECLAMATION.map((r, i) => (
            <li
              key={r}
              className="flex items-start gap-3 rounded-xl border border-border bg-card p-4 text-sm leading-relaxed text-foreground/80"
            >
              <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary-soft text-xs font-semibold text-primary">
                {i + 1}
              </span>
              <span>{r}</span>
            </li>
          ))}
        </ol>
      </section>

      {/* 9, Médiation : ce qui manque, dit franchement */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">
          Médiation de la consommation
        </h2>
        <div className="rounded-2xl border-l-4 border-l-destructive/60 border border-border bg-card p-6">
          <h3 className="flex items-center gap-2 font-semibold text-foreground">
            <AlertTriangle className="size-4 text-destructive" />
            Aucun médiateur n’est désigné à ce jour
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-foreground/80">
            L’article L612-1 du code de la consommation impose à tout professionnel qui
            vend à un particulier de lui garantir le recours gratuit à un médiateur de la
            consommation référencé. L’association n’a pas encore adhéré à un tel
            dispositif.
          </p>
          <p className="mt-2 text-sm leading-relaxed text-foreground/80">
            <strong>Conséquence assumée, et elle est concrète :</strong> l’attestation de
            suivi à 20 € n’est pas mise en vente en ligne. Les fiches annoncent son prix
            et renvoient au contact ; les conditions sont communiquées avant tout
            paiement. Aucun tunnel d’achat n’existe tant que le médiateur n’est pas
            désigné et que les conditions générales de vente ne sont pas publiées.
          </p>
          <p className="mt-2 text-sm leading-relaxed text-foreground/80">
            Cette rubrique portera le nom, l’adresse postale et l’adresse du site du
            médiateur retenu dès son adhésion, comme la loi l’exige.
          </p>
        </div>
      </section>

      {/* Liens utiles */}
      <section className="rounded-2xl border border-border bg-card p-6">
        <h2 className="text-lg font-semibold text-foreground">Voir aussi</h2>
        <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm">
          <Link href="/formations" className="text-primary underline-offset-4 hover:underline">
            Le catalogue des formations
          </Link>
          <Link href="/frais-de-service" className="text-primary underline-offset-4 hover:underline">
            Ce qui est gratuit et ce qui est payant
          </Link>
          <Link href="/legal" className="text-primary underline-offset-4 hover:underline">
            Mentions légales, CGU et confidentialité
          </Link>
          <Link href="/contact" className="text-primary underline-offset-4 hover:underline">
            Nous contacter
          </Link>
        </div>
      </section>
    </div>
  );
}
