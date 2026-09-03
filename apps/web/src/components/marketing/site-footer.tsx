import Link from 'next/link';
import Script from 'next/script';
import { Logo } from '@/components/brand/logo';

/**
 * PIED DE PAGE — RÉÉQUILIBRÉ LE 2 SEPTEMBRE 2026.
 *
 * Il avait doublé de hauteur dans la journée : la colonne « Ressources »
 * portait onze liens quand les trois autres en portaient quatre ou sept, et
 * c'est la plus longue qui décide de la hauteur de TOUTES les autres. S'y
 * ajoutaient un bloc d'identité en quatre colonnes de trois lignes chacune, et
 * un encart Google entouré de deux séparateurs. Résultat : près de 1 400 px de
 * pied de page sur chacune des 93 pages du site.
 *
 * Trois règles pour que ça ne recommence pas :
 *
 *  1. SEPT LIENS PAR COLONNE, JAMAIS PLUS. Un lien de plus se place ailleurs,
 *     ou remplace un lien existant — il ne s'empile pas.
 *  2. L'identité de l'éditeur tient en un paragraphe, pas en un tableau. Elle
 *     doit rester lisible et vérifiable (c'est ce qu'une direction d'ESMS
 *     contrôle avant de signer), mais elle n'a pas à occuper une bande entière.
 *  3. « Notre histoire » et « Nous contacter » vivent dans la barre du bas,
 *     avec le copyright : c'est de la hauteur qui existe déjà.
 */
const columns: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: 'Produit',
    links: [
      // L'ancre `#renfort` n'existe sur aucune page : ces quatre liens ne
      // bougeaient pas d'un pixel, sur toutes les pages du site. RenforTeam a
      // sa propre route depuis le changement de nom.
      { label: 'RenforTeam', href: '/renforteam' },
      // L'ancre `/#ateliers` n'existe pas sur l'accueil : le lien ne bougeait
      // pas la page. Le catalogue d'ateliers a sa propre route.
      { label: 'Ateliers', href: '/ateliers' },
      { label: 'Renfort par métier', href: '/renfort' },
      { label: 'Tarifs', href: '/#tarifs' },
      { label: "Simulateur d'économies", href: '/simulateur' },
      { label: 'Créer un compte', href: '/register' },
    ],
  },
  {
    title: 'Secteur',
    links: [
      { label: 'MECS & foyers', href: '/renforteam' },
      { label: 'IME · ITEP · SESSAD', href: '/renforteam' },
      { label: 'EHPAD', href: '/renforteam' },
      { label: 'Intervenant indépendant', href: '/intervenant-independant' },
      // Ajouté le 03/09/2026 (demande Siham). Cette colonne en portait
      // quatre : la règle des sept liens par colonne tient toujours.
      { label: 'Partenaires associatifs', href: '/partenaires-associatifs' },
    ],
  },
  {
    // Les trois pages qui répondent à « combien ça coûte », plus celle qui
    // répond à « où vont mes données ». Ce sont les questions qu'on pose avant
    // de créer un compte : elles méritaient d'être ensemble et visibles, pas
    // noyées au milieu de onze liens de ressources.
    title: 'Combien ça coûte',
    links: [
      { label: 'Frais de service', href: '/frais-de-service' },
      { label: 'Prix des plateformes', href: '/comparatif-plateformes-remplacement' },
      { label: 'Prix d’un écrit avec l’IA', href: '/comparatif-assistants-redaction' },
      { label: 'Cadre de confiance LEX', href: '/confiance-lex' },
    ],
  },
  {
    title: 'Ressources',
    links: [
      { label: 'Guides des écrits pro', href: '/guides' },
      // L'ancre `/#comment` n'existe pas sur l'accueil (les sections y sont
      // #lex, #gap, #marketplace, #tarifs) : le lien ne bougeait pas la page.
      // La page qui répond vraiment à la question, c'est le mode d'emploi.
      { label: 'Comment ça marche', href: '/mode-demploi' },
      { label: 'Le GAP', href: '/gap' },
      { label: 'L’Édublog', href: '/edublog' },
      { label: 'Centre d’aide', href: '/aide' },
      { label: 'Recevoir le catalogue', href: '/catalogue' },
      { label: 'Demander une démo', href: '/demo' },
    ],
  },
  {
    title: 'Légal',
    links: [
      // Les ancres suivent les rubriques réelles de /legal. « Remboursements »,
      // « Confidentialité » et « RGPD » renvoyaient à des ancres qui n'existent
      // plus depuis la réécriture : un lien mort dans un pied de page légal se
      // remarque, et se retient.
      { label: 'Mentions légales', href: '/legal#mentions' },
      { label: 'CGU', href: '/legal#cgu' },
      { label: 'CGV', href: '/legal#cgv' },
      { label: 'Paiements et annulations', href: '/legal#paiements' },
      { label: 'Cookies', href: '/legal/cookies' },
      { label: 'Données personnelles', href: '/legal#donnees' },
      // « Médiation » pointait sur une ancre de /legal ; la page réglementaire
      // couvre le même sujet ET tout ce qu'un OPCO vérifie avant elle (NDA,
      // Qualiopi, prérequis, délais, évaluation, accessibilité, indicateurs,
      // réclamation). Elle remplace le lien plutôt que de s'y ajouter : la
      // règle des SEPT LIENS PAR COLONNE tient, et l'ancre reste atteignable
      // depuis la page elle-même.
      { label: 'Informations réglementaires', href: '/informations-reglementaires' },
    ],
  },
];

/** Pied de page marketing. */
export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto max-w-[1200px] px-6 py-10">
        <div className="grid gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-[1.15fr_repeat(5,minmax(0,1fr))]">
          <div>
            <Logo />
            {/* « professionnels indépendants » était le mot à ne pas employer.
                C'est exactement le vocabulaire que le Conseil d'État a
                sanctionné le 11/02/2025 (n° 491128) pour les plateformes de
                remplacement en établissement : un aide-soignant ou un
                éducateur qui remplace ne peut pas être indépendant, il est
                embauché en CDD. « Intervenant » couvre les deux dispositifs
                sans les confondre. */}
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted-foreground">
              Les établissements médico-sociaux et les intervenants qui connaissent leurs
              publics, reliés sans commission.
            </p>
          </div>
          {columns.map((col) => (
            <div key={col.title}>
              <p className="text-sm font-semibold text-foreground">{col.title}</p>
              <ul className="mt-3 space-y-2">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link
                      href={l.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-primary"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/*
          QUI ÉDITE CE SITE — en un paragraphe, sur les 93 pages.

          Le concurrent direct de LEX publie des mentions légales sans SIREN,
          sans adresse et sans forme juridique, avec un contact en gmail.com,
          tout en vendant un abonnement à 1 290 €/mois. C'est une faiblesse
          structurelle qu'on ne peut pas copier — et l'inverse est notre seul
          avantage gratuit : une direction d'ESMS VÉRIFIE avant de signer, et
          elle vérifie ici, pas dans un formulaire.

          Chaque valeur vient du certificat Qualiopi lui-même ou de /legal,
          jamais d'une note interne : le numéro de déclaration d'activité a
          circulé pendant des mois dans une variante FAUSSE (« 11 77 01011 77 »),
          et c'est ce genre d'erreur qu'un financeur relève. Si l'un de ces
          chiffres change, il change ici ET sur /legal.
        */}
        <div className="mt-10 border-t border-border pt-6">
          <p className="max-w-4xl text-xs leading-relaxed text-muted-foreground">
            <span className="font-medium text-foreground/80">Qui édite ce site.</span> ADéPA,
            association loi 1901 — SIRET 820 051 852 00011, 7 rue André Malraux, 77000 Melun.
            Organisme de formation déclaré sous le n° 11771011677 (cet enregistrement ne vaut
            pas agrément de l’État), certifié Qualiopi n° QNW0132 par QUALIPRO CERTIFICATION,
            accréditation COFRAC n° 5-0681, valable jusqu’au 9 mars 2029, au titre des actions
            de formation et des bilans de compétences.{' '}
            <Link href="/legal#mentions" className="underline hover:text-primary">
              Mentions légales
            </Link>{' '}
            ·{' '}
            <a href="mailto:assoc.adepa@gmail.com" className="underline hover:text-primary">
              assoc.adepa@gmail.com
            </a>
          </p>
        </div>

        {/*
          LE BOUTON « SOURCES PREFEREES » DE GOOGLE (26/08/2026).

          Google laisse une personne epingler un site comme source preferee :
          ses pages remontent alors davantage dans LES resultats de cette
          personne. Un directeur qui nous epingle une fois nous retrouve
          ensuite sans nous chercher — exactement la fidelisation que vise un
          site de niche comme le notre.

          Le bouton se pose en deux morceaux : le script officiel de Google, et
          un conteneur vide que ce script remplit lui-meme. On ne dessine rien
          nous-memes, sinon Google ne le reconnait pas.
          Reference : developers.google.com/search/docs/appearance/preferred-sources

          L attribut passe par un spread : ecrit tel quel dans le JSX, il
          n existe dans aucun type React et le typecheck echoue.

          Il occupait auparavant une bande entiere, entre deux separateurs et
          precede d'une phrase d'explication : il partage desormais la barre du
          bas avec le copyright.
        */}
        <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-border pt-6 text-xs text-muted-foreground lg:flex-row">
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
            <p>© {new Date().getFullYear()} LES EXTRAS — ADéPA</p>
            <Link href="/notre-histoire" className="transition-colors hover:text-primary">
              Notre histoire
            </Link>
            <Link href="/contact" className="transition-colors hover:text-primary">
              Nous contacter
            </Link>
            {/* AUCUN LIEN VERS LINKEDIN N'EXISTAIT SUR LES 93 PAGES DU SITE.
                Tout le trafic social vient de là, et le chemin ne se faisait que
                dans un sens. C'est la PAGE ENTREPRISE qu'on met en avant ici :
                c'est elle qui porte la marque et que le site doit faire grandir
                — son adresse a été relevée dans son administration. */}
            <a
              href="https://www.linkedin.com/company/les-extras-adepa/"
              target="_blank"
              rel="me noopener noreferrer"
              className="transition-colors hover:text-primary"
            >
              LinkedIn
            </a>
          </div>
          <Script
            async
            src="https://news.google.com/swg/js/v1/publisher.js"
            strategy="afterInteractive"
          />
          <div {...{ 'google-add-preferred-source-btn': '' }} />
        </div>
      </div>
    </footer>
  );
}
