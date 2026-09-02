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
      { label: 'Frais de service', href: '/frais-de-service' },
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
            <p className="mt-4 max-w-xs text-sm text-muted-foreground">
              La marketplace qui relie les établissements médico-sociaux aux professionnels
              indépendants. Sereinement.
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
        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row">
          <p>© {new Date().getFullYear()} LES EXTRAS — ADéPA. Tous droits réservés.</p>
          {/* AUCUN LIEN VERS LINKEDIN N'EXISTAIT SUR LES 93 PAGES DU SITE.
              Tout le trafic social vient de là, et le chemin ne se faisait que
              dans un sens. Le compte ci-dessous est celui que le pied de page
              d'adepa77.fr publie déjà — vérifié en direct. */}
          <a
            href="https://www.linkedin.com/in/association-adepa-b98ba5405/"
            target="_blank"
            rel="me noopener noreferrer"
            className="transition-colors hover:text-primary"
          >
            LinkedIn
          </a>
          <p>Fait avec soin pour le secteur médico-social.</p>
        </div>
      </div>
    </footer>
  );
}
