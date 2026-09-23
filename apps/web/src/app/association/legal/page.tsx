import Link from 'next/link';
import type { Metadata } from 'next';
import { Carte, Titre } from '../_ui';

export const metadata: Metadata = {
  title: 'Mentions légales et confidentialité',
  description: "Mentions légales, conditions d'utilisation, données personnelles et cookies de Piloter, l'outil de Toulali pour les associations et les organismes de formation.",
  alternates: { canonical: '/legal' },
};

/**
 * `pilote.toulali.fr/legal` : LES TEXTES DE PILOTER LUI-MÊME.
 *
 * Ce ne sont PAS ceux d'une école : chaque école a les siens sous
 * `/ecole/<adresse>/legal`. Ici, ADéPA parle de l'outil qu'elle édite, et du
 * rôle qu'elle tient pour les données des apprenants (sous-traitant, voir
 * l'accord de traitement).
 */
const SECTIONS: { id: string; titre: string; paragraphes: string[] }[] = [
  {
    id: 'mentions',
    titre: 'Mentions légales',
    paragraphes: [
      "Piloter (Piloter mon association, Piloter mon académie) est édité par ADéPA, association loi 1901, SIRET 820 051 852 00011, dont le siège est au 7 rue André Malraux, 77000 Melun. Toulali est l'organisme de formation d'ADéPA (déclaration d'activité 11771011677, certification Qualiopi QNW0132).",
      'Directeur de la publication : Christophe Renaud. Contact : assoc.adepa@gmail.com.',
      'Hébergement : Hostinger International Ltd., 61 Lordou Vironos Street, 6023 Larnaca, Chypre. Les serveurs utilisés sont situés dans l’Union européenne.',
    ],
  },
  {
    id: 'cgu',
    titre: "Conditions générales d'utilisation",
    paragraphes: [
      "Piloter met à la disposition des associations et des organismes de formation un espace pour organiser leur activité : documents, formations en ligne, apprenants, ventes, communauté, classes virtuelles. L'ouverture d'un espace est gratuite ; les fonctions payantes éventuelles sont annoncées avec leur prix avant toute souscription.",
      "Chaque structure reste responsable de ce qu'elle publie (contenus de formation, textes de vente, messages), de ses conditions de vente et de la relation avec ses apprenants et ses clients. Elle s'engage à ne publier que des contenus dont elle détient les droits, et rien d'illicite.",
      "Les paiements des apprenants sont encaissés par la structure elle-même, par l'intermédiaire de Stripe, sur son propre compte : ADéPA ne reçoit pas ces sommes.",
      "ADéPA peut suspendre un espace qui enfreint ces conditions, après en avoir informé la structure sauf urgence. Chaque structure peut fermer son espace à tout moment en écrivant à l'adresse de contact.",
    ],
  },
  {
    id: 'donnees',
    titre: 'Données personnelles',
    paragraphes: [
      "Pour les comptes des structures (nom, adresse e-mail, informations administratives), ADéPA est responsable du traitement. Ces données servent à ouvrir et faire fonctionner l'espace, à répondre aux demandes et à respecter nos obligations légales. Elles sont conservées tant que l'espace est ouvert, puis supprimées ou archivées selon les durées légales.",
      "Pour les données des apprenants d'une école (identité, adresse e-mail, progression, devoirs, messages dans la communauté), c'est l'école qui est responsable du traitement ; ADéPA agit comme sous-traitant, dans le cadre de l'accord de traitement ci-dessous.",
      "Vous disposez d'un droit d'accès, de rectification, d'effacement, d'opposition, de limitation et de portabilité. Pour les exercer : assoc.adepa@gmail.com. Pour les données tenues par une école, adressez-vous d'abord à elle. Vous pouvez aussi saisir la CNIL (cnil.fr).",
    ],
  },
  {
    id: 'cookies',
    titre: 'Cookies',
    paragraphes: [
      "Piloter dépose les cookies nécessaires à son fonctionnement : la session de connexion, l'espace choisi quand vous en avez plusieurs, et la session de l'espace apprenant. Ils ne servent à rien d'autre et ne demandent pas de consentement.",
      "Une mesure d'audience n'est déposée qu'avec votre accord, donné dans le bandeau prévu à cet effet, et se retire à tout moment.",
    ],
  },
];

export default function PageLegalPilote() {
  return (
    <>
      <Titre surtitre="Piloter" sousTitre="Ce qu'ADéPA, qui édite Piloter, vous doit comme informations, et ce qu'elle fait de vos données.">
        Mentions légales et confidentialité
      </Titre>
      <nav className="mb-6 flex flex-wrap gap-2" aria-label="Sommaire">
        {SECTIONS.map((s) => (
          <a key={s.id} href={`#${s.id}`} className="rounded-full border border-[#E6E4F3] bg-white px-3 py-1.5 text-sm font-bold text-[#1D1B5C] no-underline">
            {s.titre}
          </a>
        ))}
        <Link href="/legal/dpa" className="rounded-full border border-[#E6E4F3] bg-white px-3 py-1.5 text-sm font-bold text-[#1D1B5C] no-underline">
          Accord de traitement (DPA)
        </Link>
      </nav>
      <div className="grid gap-5">
        {SECTIONS.map((s) => (
          <Carte key={s.id}>
            <h2 id={s.id} className="scroll-mt-24 text-xl font-extrabold text-[#1D1B5C]">
              {s.titre}
            </h2>
            {s.paragraphes.map((p) => (
              <p key={p} className="mt-3 leading-relaxed text-[#3B3A66]">
                {p}
              </p>
            ))}
          </Carte>
        ))}
      </div>
    </>
  );
}
