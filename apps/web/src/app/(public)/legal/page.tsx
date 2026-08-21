import type { Metadata } from 'next';
import Link from 'next/link';
import { metaPublique } from "@/lib/meta";

export const metadata: Metadata = metaPublique({
  title: 'Informations légales',
  description:
    'Mentions légales, conditions générales d’utilisation et de vente, protection des données et médiation de LES EXTRAS.',
  path: "/legal",
});

/**
 * CETTE PAGE DOIT DÉCRIRE CE QUE LE SERVICE FAIT, PAS CE QU'IL POURRAIT FAIRE.
 *
 * La version précédente promettait une politique de remboursement détaillée —
 * annulation à sept jours, moitié du montant due, remboursement « sur le moyen
 * de paiement d'origine sous quatorze jours ». Or aucun de ces flux ne passe
 * par la plateforme : les prestations sont contractées et réglées DIRECTEMENT
 * entre l'établissement et l'intervenant. Décrire un remboursement qu'on n'est
 * pas en mesure d'effectuer n'est pas une clause de style : c'est un engagement
 * intenable, et une information trompeuse au sens du code de la consommation.
 *
 * Les conditions de vente ne couvrent donc que ce que l'association vend
 * réellement : les crédits et abonnements LEX, et les formations Qualiopi
 * facturées au devis. Aucun prix n'est écrit ici — ils vivent sur la page
 * « Frais de service » et dans l'espace de chaque compte, un seul endroit à
 * tenir à jour.
 *
 * La partie données personnelles reflète le registre de traitement
 * (docs/conformite/REGISTRE-RGPD.md) : mêmes sous-traitants, mêmes durées.
 * Quand le registre bouge, cette page bouge — jamais l'inverse.
 */

interface Section {
  id: string;
  title: string;
  body: (string | { sous: string; points: string[] })[];
}

const sections: Section[] = [
  {
    id: 'mentions',
    title: 'Mentions légales',
    body: [
      'LES EXTRAS est un service édité par ADéPA — association loi 1901, SIRET 820 051 852 00011, dont le siège est situé 7 rue André Malraux, 77000 Melun (adresse administrative : 30 rue Nouvelle, 77190 Dammarie-lès-Lys). Le site met en relation les établissements sociaux et médico-sociaux et les professionnels du secteur.',
      'Directeur de la publication : Christophe Renaud. Contact : contact@les-extras.fr.',
      // Le numéro ci-dessous est celui du certificat Qualiopi lui-même. La
      // variante « 11 77 01011 77 » qui circulait sur plusieurs pages du
      // réseau est fausse — vérifié sur le certificat le 10/08/2026.
      'Organisme de formation enregistré sous le numéro de déclaration d’activité 11771011677 (préfecture d’Île-de-France) — cet enregistrement ne vaut pas agrément de l’État.',
      'Certification Qualiopi n° QNW0132, délivrée le 10 mars 2026 par QUALIPRO CERTIFICATION (accréditation COFRAC n° 5-0681), valable jusqu’au 9 mars 2029, au titre des actions de formation et des bilans de compétences.',
      'Hébergement : Hostinger International Ltd., 61 Lordou Vironos Street, 6023 Larnaca, Chypre. Les serveurs utilisés sont situés dans l’Union européenne.',
    ],
  },
  {
    id: 'cgu',
    title: 'Conditions générales d’utilisation',
    body: [
      {
        sous: 'Objet du service',
        points: [
          'LES EXTRAS est une plateforme de mise en relation. Elle permet à un établissement de publier un besoin de renfort ou de rechercher une intervention (atelier, formation), et à un professionnel de se faire connaître, de répondre à ces besoins et d’en assurer le suivi : planning, pointage des heures, pièces de conformité, messagerie, documents.',
          'La plateforme fournit également des outils d’aide à la contractualisation (modèles de contrat, devis, factures) et un assistant d’écriture professionnelle, LEX.',
          'La création d’un compte, la publication d’un besoin, la candidature et la contractualisation sont gratuites, pour les établissements comme pour les intervenants. Aucune commission n’est prélevée sur les missions.',
        ],
      },
      {
        sous: 'Ce que la plateforme n’est pas',
        points: [
          'Elle n’est ni l’employeur, ni le donneur d’ordre, ni le mandataire des personnes qu’elle met en relation. Le contrat à durée déterminée, le contrat de prestation ou la convention de formation sont conclus directement entre l’établissement et le professionnel, seuls signataires et seuls responsables de leur exécution.',
          'Elle ne perçoit pas les paiements des missions. Les sommes dues au titre d’une intervention sont réglées directement par l’établissement au professionnel : elles ne transitent à aucun moment par un compte de l’association.',
          'Elle n’est pas une agence d’intérim et n’exerce aucune activité de placement payant. Elle ne garantit ni la conclusion d’un contrat, ni le remplacement d’un intervenant défaillant.',
        ],
      },
      {
        sous: 'Comptes et accès',
        points: [
          'L’ouverture d’un compte suppose d’être majeur et, pour un compte d’établissement, d’avoir qualité pour engager la structure représentée.',
          'Chaque utilisateur est responsable de la confidentialité de ses identifiants et des actions réalisées depuis son compte. Toute utilisation suspecte doit être signalée sans délai à contact@les-extras.fr.',
          'Un compte peut réunir plusieurs membres avec des rôles distincts : le propriétaire du compte décide de ces accès et en répond.',
          'Un compte créé au titre d’un poste salarié ne donne pas accès au marché ouvert : ce qu’un salarié propose s’adresse aux seuls établissements qui l’emploient. Ses fiches ne sont ni publiées au catalogue public, ni réservables par des tiers.',
        ],
      },
      {
        sous: 'Engagements des utilisateurs',
        points: [
          'Fournir des informations exactes et les tenir à jour, en particulier l’identité, le métier, les diplômes et les pièces de conformité.',
          'Respecter la réglementation applicable à son activité : conditions d’exercice, obligations déclaratives, assurance et, pour les établissements, obligations d’employeur ainsi que les vérifications préalables prévues par l’article L. 133-6 du code de l’action sociale et des familles.',
          'Ne déposer aucune donnée relative aux personnes accompagnées en dehors des espaces prévus à cet effet, et jamais dans les descriptifs publics ou la messagerie.',
          'S’abstenir de tout contenu illicite, diffamatoire ou discriminatoire, de tout démarchage de masse et de toute extraction automatisée des profils du site.',
        ],
      },
      {
        sous: 'Modération et suspension',
        points: [
          'Les fiches, missions et contenus publiés peuvent être contrôlés a posteriori. Un contenu manifestement illicite ou contraire aux présentes conditions est retiré ; son auteur en est informé et peut contester par retour de courriel.',
          'Un compte peut être suspendu en cas de manquement grave ou répété, de fraude ou d’usage détourné du service. Sauf urgence ou obligation légale, la suspension est précédée d’un avertissement.',
          'Chacun peut supprimer son compte à tout moment depuis « Mes données personnelles ». Les documents légalement conservés — factures, contrats — le restent pour la durée prévue par la loi.',
        ],
      },
      {
        sous: 'Responsabilité',
        points: [
          'Les contenus des profils, fiches et annonces sont publiés sous la responsabilité de leurs auteurs. La plateforme, qui les héberge, n’en garantit ni l’exactitude ni l’exhaustivité et n’est pas partie aux relations contractuelles nouées entre utilisateurs.',
          'L’association met en œuvre les moyens raisonnables pour assurer la disponibilité du service, sans garantie d’absence d’interruption ; les opérations de maintenance sont annoncées lorsqu’elles sont prévisibles.',
          'Sa responsabilité ne peut être engagée qu’en cas de faute qui lui est propre, et dans la limite des dommages directs et prévisibles. Rien dans les présentes ne limite la responsabilité en cas de dommage corporel, de faute lourde ou de dol.',
        ],
      },
      {
        sous: 'Évolution des conditions',
        points: [
          'Ces conditions évoluent avec le service. Toute modification substantielle est annoncée aux utilisateurs inscrits au moins quinze jours avant son entrée en vigueur ; poursuivre l’utilisation du service après cette date vaut acceptation.',
          'Les présentes sont régies par le droit français. En cas de litige, une solution amiable est recherchée en priorité (voir « Réclamations et médiation »).',
        ],
      },
    ],
  },
  {
    id: 'cgv',
    title: 'Conditions générales de vente',
    body: [
      'Ces conditions ne portent que sur ce que l’association vend elle-même. La mise en relation, la publication d’un besoin, les candidatures, le planning, la messagerie et l’aide à la contractualisation sont gratuits, et le restent.',
      {
        sous: 'Ce qui est vendu',
        points: [
          'Les crédits et abonnements LEX, l’assistant d’écriture : une allocation mensuelle est offerte à chaque compte, sans carte bancaire et sans date de fin ; au-delà, un pack de crédits ou un abonnement mensuel peut être souscrit.',
          'Les formations sous certification Qualiopi, commandées à l’association et facturées par elle sur devis, avec convention de formation et financement possible par un OPCO.',
        ],
      },
      {
        sous: 'Prix, commande et paiement',
        points: [
          'Les prix en vigueur sont ceux affichés sur la page « Frais de service » et, pour les crédits et abonnements, dans l’espace de votre compte au moment de la commande. Aucun prix ne figure sur la présente page, afin qu’il n’existe qu’une seule source à jour.',
          'Les prix sont exprimés en euros. L’association n’est pas assujettie à la TVA sur ces prestations, sauf mention contraire portée sur la facture.',
          'Le paiement des crédits et abonnements s’effectue en ligne par carte bancaire via Stripe : les données de carte sont saisies chez Stripe et ne transitent jamais par la plateforme. Les formations sont réglées sur facture, aux conditions du devis accepté.',
          'La commande est ferme à la validation du paiement : les crédits sont portés au compte immédiatement, l’abonnement est actif dès l’encaissement.',
        ],
      },
      {
        sous: 'Durée, renouvellement et résiliation',
        points: [
          'L’abonnement LEX est mensuel et se renouvelle par tacite reconduction, sans engagement de durée.',
          'Il peut être résilié à tout moment depuis l’espace de facturation du compte. La résiliation prend effet au terme de la période en cours, déjà payée, qui reste due ; aucun prorata n’est remboursé pour la période entamée.',
          'Les crédits achetés à l’unité n’expirent pas tant que le compte existe ; l’allocation mensuelle offerte se reporte dans la limite prévue par l’offre en vigueur.',
          'L’association peut mettre fin à un abonnement en cas de non-paiement ou de manquement grave aux conditions d’utilisation, après information de l’intéressé.',
        ],
      },
      {
        sous: 'Droit de rétractation',
        points: [
          'Le consommateur dispose d’un délai de quatorze jours à compter de la conclusion du contrat pour se rétracter, sans motif ni pénalité (article L. 221-18 du code de la consommation). Ce droit bénéficie également, dans les conditions de l’article L. 221-3, au professionnel employant cinq salariés au plus lorsque l’objet du contrat n’entre pas dans le champ de son activité principale.',
          'Pour l’exercer, il suffit d’écrire à contact@les-extras.fr en indiquant le compte et la commande concernés. Le remboursement intervient dans les quatorze jours suivant la réception de la demande, par le même moyen de paiement.',
          'Pour un service exécuté immédiatement à la demande expresse du client — c’est le cas des crédits LEX, utilisables aussitôt —, le droit de rétractation ne peut plus être exercé une fois le service pleinement exécuté, et les crédits déjà consommés sont déduits du remboursement (articles L. 221-25 et L. 221-28 du code de la consommation).',
          'Les formations font l’objet d’une convention distincte : le délai de rétractation applicable y est rappelé, ainsi que les conditions d’annulation propres au financement retenu.',
        ],
      },
    ],
  },
  {
    id: 'paiements',
    title: 'Paiements, annulations et remboursements',
    body: [
      'Il n’existe pas de politique de remboursement des prestations sur cette plateforme, pour une raison simple : les prestations ne lui sont pas payées.',
      'Une mission de renfort donne lieu à un contrat conclu entre l’établissement et l’intervenant, le plus souvent un contrat à durée déterminée. La rémunération est versée par l’établissement, selon les règles de la paie ou de la facturation, sans intervention de l’association. Un atelier ou une intervention se règle de la même façon : directement, sur la facture émise par l’intervenant.',
      'Les conditions d’annulation d’une intervention relèvent donc de l’accord entre les deux parties et des règles applicables au contrat conclu. La plateforme conserve la trace des échanges, des créneaux et des heures validées : ces éléments restent consultables par chacune des parties et peuvent servir de preuve en cas de désaccord.',
      'Les remboursements que l’association peut effectuer ne concernent que ce qu’elle a elle-même encaissé — crédits et abonnements LEX, formations qu’elle a facturées — dans les conditions de la rubrique précédente.',
      // La phrase annonçait « l’IBAN qui y figure » : renseigner ses
      // coordonnées bancaires reste facultatif pour l’émetteur, et une
      // facture peut donc parfaitement sortir sans. On énonce le principe —
      // virement, selon ce que l’émetteur indique — sans promettre au lecteur
      // une mention qui n’est pas garantie.
      'Le règlement en ligne n’est proposé que pour les factures émises par l’association. Une facture émise par un intervenant se règle par virement, selon les coordonnées bancaires que celui-ci indique sur sa facture ; à défaut, il appartient au destinataire de les lui demander. La plateforme n’encaisse pas pour le compte d’un tiers.',
    ],
  },
  {
    id: 'donnees',
    title: 'Protection des données personnelles',
    body: [
      'Responsable de traitement : association ADéPA, 7 rue André Malraux, 77000 Melun. Contact pour toute question ou demande relative aux données : assoc.adepa@gmail.com. Aucun délégué à la protection des données n’est désigné — la désignation n’est obligatoire ni par la taille ni par l’activité de l’association, et ce point de contact en tient lieu.',
      'Pour les comptes, le catalogue et la mise en relation, l’association est responsable de traitement. Pour les données que chaque établissement gère dans son propre espace — équipe, contrats, dossiers de conformité de ses intervenants —, l’établissement est responsable de traitement et l’association agit comme sous-traitant au sens de l’article 28 du RGPD.',
      {
        sous: 'Ce qui est traité, et pourquoi',
        points: [
          'Comptes et profils : identité, coordonnées, métier, qualifications, ville, rayon d’intervention, taux horaire, disponibilité, photographie. Base légale : exécution du contrat.',
          'Dossier de conformité : pièce d’identité, diplôme, bulletin n° 3 du casier judiciaire, attestation URSSAF, assurance. Base légale : obligation légale de l’établissement (article L. 133-6 du code de l’action sociale et des familles). Le bulletin n° 3 relève de l’article 10 du RGPD : son accès est strictement limité à la personne concernée et aux responsables du compte qui suit son dossier.',
          'Mise en relation, planning et pointage : missions, candidatures, créneaux, heures déclarées et validées. Base légale : exécution du contrat.',
          'Contrats à durée déterminée et facturation : mentions obligatoires, montants, numéros de facture. Base légale : obligation légale et exécution du contrat.',
          'Formation professionnelle : inscriptions, émargements, évaluations, attestations. Base légale : contrat de formation et obligations de l’organisme de formation.',
          'Signature électronique : nom, adresse électronique, empreinte du document, horodatage, adresse IP, journal des étapes, pour constituer le faisceau de preuves.',
          'Assistant LEX : les noms des personnes accompagnées sont pseudonymisés avant tout envoi au modèle de langage, et les notes soumises ne sont pas conservées. La plateforme n’a pas vocation à détenir d’informations sur les personnes accueillies.',
          'Journal d’audit et sécurité : traçabilité des actions sensibles. Base légale : intérêt légitime.',
        ],
      },
      {
        sous: 'Durées de conservation',
        points: [
          'Comptes et profils : durée de vie du compte, puis trois ans après la dernière activité ; suppression sur demande.',
          'Dossier de conformité : durée de la collaboration, puis cinq ans. Le bulletin n° 3, renouvelé chaque année, est supprimé dès son remplacement.',
          'Missions, candidatures et créneaux : cinq ans après la fin de la relation. Les heures validées suivent la durée des pièces comptables qu’elles fondent, soit dix ans.',
          'Contrats à durée déterminée : cinq ans après la fin du contrat.',
          'Factures et pièces comptables : dix ans (article L. 123-22 du code de commerce).',
          'Formation : six ans, durée des contrôles des financeurs et de la certification Qualiopi.',
          'Dossier de preuve d’une signature : durée de conservation du document signé, de cinq à dix ans selon sa nature.',
          'Journal d’audit : douze mois glissants. Notes soumises à LEX : aucune conservation.',
        ],
      },
      {
        sous: 'Sous-traitants',
        points: [
          'Hostinger — hébergement du serveur applicatif et de la base de données, dans l’Union européenne.',
          'Stripe — paiement en ligne des crédits, abonnements et factures de l’association. Irlande et États-Unis, encadré par les clauses contractuelles types.',
          'Brevo — envoi des courriels transactionnels : notifications, invitations, alertes. Union européenne.',
          'Mistral AI — modèle de langage de l’assistant LEX, alimenté par des données pseudonymisées. France.',
          'Les fichiers déposés (diplômes, justificatifs, pièces jointes) sont stockés sur un serveur MinIO auto-hébergé, sur la même infrastructure : ils ne sont confiés à aucun prestataire tiers.',
          'Aucune donnée n’est vendue, louée ni cédée à des fins publicitaires.',
        ],
      },
      {
        sous: 'Vos droits',
        points: [
          'Vous disposez des droits d’accès, de rectification, d’effacement, de limitation, d’opposition et de portabilité prévus par le RGPD.',
          'Deux d’entre eux s’exercent directement depuis votre espace, rubrique « Mes données personnelles » : l’export complet de vos données dans un format lisible par machine (article 20) et la suppression de votre compte (article 17).',
          'Les autres s’exercent par courriel à assoc.adepa@gmail.com ; il y est répondu dans un délai d’un mois.',
          'Vous pouvez introduire une réclamation auprès de la Commission nationale de l’informatique et des libertés (cnil.fr).',
          'Toute violation de données est documentée. Elle est notifiée à la CNIL dans les soixante-douze heures lorsqu’elle présente un risque pour vos droits et libertés, et aux personnes concernées en cas de risque élevé.',
        ],
      },
    ],
  },
  {
    id: 'mediation',
    title: 'Réclamations et médiation',
    body: [
      'Toute réclamation peut être adressée à contact@les-extras.fr. Nous nous engageons à en accuser réception et à y répondre dans un délai raisonnable.',
      'Conformément à l’article L. 612-1 du code de la consommation, tout consommateur a le droit de recourir gratuitement à un médiateur de la consommation. Le médiateur compétent pour LES EXTRAS est en cours de désignation : ses coordonnées seront publiées ici dès qu’elles seront connues. Dans l’intervalle, écrivez-nous — aucune réclamation ne restera sans réponse au motif que cette désignation est en cours.',
      'Le recours à la médiation suppose d’avoir tenté au préalable de résoudre le différend directement avec nous, par une réclamation écrite.',
      'Les litiges entre un établissement et un intervenant relèvent de leur relation contractuelle et, le cas échéant, de la juridiction compétente pour celle-ci : la plateforme n’y est pas partie.',
    ],
  },
];

export default function LegalPage() {
  return (
    <article className="mx-auto max-w-2xl">
      <header className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Informations légales</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Mentions légales, conditions d’utilisation et de vente, protection des données. Cette page
          décrit le service tel qu’il fonctionne réellement.
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          Dernière mise à jour : 13 août 2026. Voir aussi{' '}
          <Link href="/legal/cookies" className="underline underline-offset-2 hover:text-primary">
            cookies et stockage local
          </Link>{' '}
          et{' '}
          <Link href="/frais-de-service" className="underline underline-offset-2 hover:text-primary">
            frais de service
          </Link>
          .
        </p>
      </header>

      <nav aria-label="Sommaire" className="mb-10 flex flex-wrap gap-2">
        {sections.map((s) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            className="inline-flex min-h-10 items-center rounded-lg border border-border bg-card px-3.5 text-sm font-medium text-foreground transition-colors hover:border-primary/40 hover:text-primary"
          >
            {s.title}
          </a>
        ))}
      </nav>

      <div className="space-y-12">
        {sections.map((s) => (
          <section key={s.id} id={s.id} className="scroll-mt-24">
            <h2 className="text-xl font-semibold tracking-tight text-foreground">{s.title}</h2>
            <div className="mt-3 space-y-5 text-sm leading-relaxed text-muted-foreground">
              {s.body.map((bloc, i) =>
                typeof bloc === 'string' ? (
                  <p key={i}>{bloc}</p>
                ) : (
                  <div key={i} className="space-y-2">
                    <h3 className="text-sm font-semibold text-foreground">{bloc.sous}</h3>
                    <ul className="ml-4 list-disc space-y-2 marker:text-primary/50">
                      {bloc.points.map((point, j) => (
                        <li key={j}>{point}</li>
                      ))}
                    </ul>
                  </div>
                ),
              )}
            </div>
          </section>
        ))}
      </div>
    </article>
  );
}
