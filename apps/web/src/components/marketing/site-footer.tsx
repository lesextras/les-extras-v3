import Link from 'next/link';
import Script from 'next/script';
import { Logo } from '@/components/brand/logo';

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
      { label: 'Tarifs', href: '/#tarifs' },
      { label: 'Créer un compte', href: '/register' },
    ],
  },
  {
    title: 'Secteur',
    links: [
      { label: 'MECS & foyers', href: '/renforteam' },
      { label: 'IME · ITEP · SESSAD', href: '/renforteam' },
      { label: 'EHPAD', href: '/renforteam' },
      { label: 'Renfort par métier', href: '/renfort' },
      { label: 'Intervenant indépendant', href: '/intervenant-independant' },
    ],
  },
  {
    title: 'Ressources',
    links: [
      // L'ancre `/#comment` n'existe pas sur l'accueil (les sections y sont
      // #lex, #gap, #marketplace, #tarifs) : le lien ne bougeait pas la page.
      // La page qui répond vraiment à la question, c'est le mode d'emploi.
      { label: 'Comment ça marche', href: '/mode-demploi' },
      { label: 'Le GAP', href: '/gap' },
      { label: 'L’Édublog', href: '/edublog' },
      { label: 'Notre histoire', href: '/notre-histoire' },
      { label: 'Centre d’aide', href: '/aide' },
      { label: 'Guides des écrits professionnels', href: '/guides' },
      { label: 'Frais de service', href: '/frais-de-service' },
      { label: 'Ce que coûtent les plateformes', href: '/comparatif-plateformes-remplacement' },
      { label: 'Le prix d’un écrit rédigé par l’IA', href: '/comparatif-assistants-redaction' },
      { label: 'Cadre de confiance LEX', href: '/confiance-lex' },
      { label: "Simulateur d'économies", href: '/simulateur' },
      { label: 'Recevoir le catalogue', href: '/catalogue' },
      { label: 'Demander une démo', href: '/demo' },
      { label: 'Nous contacter', href: '/contact' },
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
      { label: 'Médiation', href: '/legal#mediation' },
    ],
  },
];

/** Pied de page marketing. */
export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto max-w-[1200px] px-6 py-14">
        <div className="grid gap-10 md:grid-cols-[1.4fr_repeat(4,1fr)]">
          <div>
            <Logo />
            {/* « professionnels indépendants » était le mot à ne pas employer.
                C'est exactement le vocabulaire que le Conseil d'État a
                sanctionné le 11/02/2025 (n° 491128) pour les plateformes de
                remplacement en établissement : un aide-soignant ou un
                éducateur qui remplace ne peut pas être indépendant, il est
                embauché en CDD. « Intervenant » couvre les deux dispositifs
                sans les confondre. */}
            <p className="mt-4 max-w-xs text-sm text-muted-foreground">
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
        */}
        <div className="mt-12 flex flex-col items-center gap-3 border-t border-border pt-8">
          {/* La phrase précédente s'adressait au moteur de recherche, pas au
              lecteur — et avec deux accents manquants, sur les 93 pages du
              site. Celle-ci dit au visiteur ce que le bouton fait. */}
          <p className="text-xs text-muted-foreground">
            Suivez Les Extras dans Google : nos articles remonteront en priorité dans vos
            résultats.
          </p>
          <Script
            async
            src="https://news.google.com/swg/js/v1/publisher.js"
            strategy="afterInteractive"
          />
          <div {...{ 'google-add-preferred-source-btn': '' }} />
        </div>
        {/*
          QUI SOMMES-NOUS, EN CHIFFRES VÉRIFIABLES — sur les 93 pages du site.

          Le concurrent direct de LEX (notasuivi.fr) publie des mentions
          légales sans SIREN, sans adresse et sans forme juridique, avec un
          contact en gmail.com, tout en vendant un abonnement à 1 290 €/mois.
          C'est une faiblesse structurelle qu'on ne peut pas copier — et
          l'inverse est notre seul avantage gratuit : une direction d'ESMS
          VÉRIFIE avant de signer, et elle vérifie ici, pas dans un formulaire.

          Chaque valeur ci-dessous vient du certificat Qualiopi lui-même ou de
          /legal, jamais d'une note interne : le numéro de déclaration
          d'activité a circulé pendant des mois dans une variante FAUSSE
          (« 11 77 01011 77 »), et c'est ce genre d'erreur qu'un financeur
          relève. Si l'un de ces chiffres change, il change ici ET sur /legal.
        */}
        <div className="mt-12 border-t border-border pt-8">
          <p className="text-sm font-semibold text-foreground">Qui édite ce site</p>
          <dl className="mt-4 grid gap-x-8 gap-y-4 text-xs leading-relaxed text-muted-foreground sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <dt className="font-medium text-foreground/80">Éditeur</dt>
              <dd className="mt-1">
                ADéPA, association loi 1901
                <br />
                SIRET 820 051 852 00011
              </dd>
            </div>
            <div>
              <dt className="font-medium text-foreground/80">Siège social</dt>
              <dd className="mt-1">
                7 rue André Malraux
                <br />
                77000 Melun
              </dd>
            </div>
            <div>
              <dt className="font-medium text-foreground/80">Organisme de formation</dt>
              <dd className="mt-1">
                Déclaration d’activité n° 11771011677
                <br />
                <span className="text-muted-foreground/80">
                  Cet enregistrement ne vaut pas agrément de l’État.
                </span>
              </dd>
            </div>
            <div>
              <dt className="font-medium text-foreground/80">Certification Qualiopi</dt>
              <dd className="mt-1">
                N° QNW0132 — QUALIPRO CERTIFICATION
                <br />
                Accréditation COFRAC n° 5-0681, valable jusqu’au 9 mars 2029, au titre des
                actions de formation et des bilans de compétences.
              </dd>
            </div>
          </dl>
          <p className="mt-4 text-xs text-muted-foreground">
            Le détail figure dans les{' '}
            <Link href="/legal#mentions" className="underline hover:text-primary">
              mentions légales
            </Link>
            . Écrire à l’association :{' '}
            <a href="mailto:assoc.adepa@gmail.com" className="underline hover:text-primary">
              assoc.adepa@gmail.com
            </a>
            .
          </p>
        </div>
        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row">
          <p>© {new Date().getFullYear()} LES EXTRAS — ADéPA. Tous droits réservés.</p>
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
            Les Extras sur LinkedIn
          </a>
          <p>Fait avec soin pour le secteur médico-social.</p>
        </div>
      </div>
    </footer>
  );
}
