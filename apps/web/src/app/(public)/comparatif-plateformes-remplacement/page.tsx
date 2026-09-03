import type { Metadata } from 'next';
import Link from 'next/link';
import { Check, Info, Scale, Wallet, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { metaPublique } from '@/lib/meta';

export const metadata: Metadata = metaPublique({
  title: 'Ce que coûtent les plateformes de remplacement',
  description:
    'Combien un établissement médico-social paie réellement pour un remplacement : les frais publiés par Brigad, ce que Hublo facture et ce qu’il ne publie pas, et pourquoi Les Extras ne prélève rien.',
  path: '/comparatif-plateformes-remplacement',
});

/**
 * PUBLICITÉ COMPARATIVE — ce qui la rend licite, et ce qui la rendrait fautive.
 *
 * Les articles L122-1 et suivants du code de la consommation autorisent la
 * comparaison nominative à trois conditions : qu'elle ne soit pas trompeuse,
 * qu'elle porte sur des services répondant aux mêmes besoins, et qu'elle
 * compare objectivement des caractéristiques essentielles, pertinentes et
 * VÉRIFIABLES. D'où les trois règles tenues sur cette page :
 *
 *  1. Chaque chiffre cité est repris des documents PUBLICS de l'acteur
 *     concerné — page « frais de service », conditions générales — et la page
 *     où il figure est nommée pour que le lecteur puisse le vérifier lui-même.
 *  2. Quand un tarif n'est PAS publié, on écrit qu'il n'est pas publié. On ne
 *     l'estime pas, on ne l'extrapole pas, on n'en tire aucune insinuation.
 *     C'est aussi vrai pour les 30 € et 40 € qui figurent dans le simulateur
 *     public de Hublo : ces montants existent, mais uniquement comme
 *     paramètres d'un simulateur, sans mention HT ou TTC et sans valeur
 *     contractuelle. Ils ne figurent donc PAS sur cette page.
 *  3. Aucun jugement sur la qualité de leurs services. Ce sont des acteurs
 *     sérieux ; la comparaison porte sur le modèle économique, rien d'autre.
 *
 * Relevé le 2 septembre 2026. La date est affichée : une grille tarifaire
 * change, et une comparaison non datée devient trompeuse le jour où elle
 * change.
 */

const RELEVE_LE = '2 septembre 2026';

type Ligne = {
  question: string;
  brigad: string;
  hublo: string;
  nous: string;
};

const LIGNES: Ligne[] = [
  {
    question: 'Ce que paie l’établissement sur une mission',
    brigad: '10 % HT du total facturé par le professionnel, sur chaque mission.',
    hublo: 'Non publié. Les conditions générales renvoient au contrat de prestation négocié, et le site ne comporte pas de page tarifs.',
    nous: 'Rien. L’établissement paie le tarif de l’intervenant, et ce tarif seul.',
  },
  {
    question: 'Ce que paie le professionnel',
    brigad: '15 % TTC de frais de service sur chaque mission — 9,9 % TTC pour les missions d’infirmier.',
    hublo: 'Rien : l’inscription du soignant est gratuite.',
    nous: 'Rien. La commission est à zéro : le tarif chiffré lui revient intégralement.',
  },
  {
    question: 'Abonnement',
    brigad: 'Aucun : la plateforme est mise à disposition à titre gratuit, la rémunération passe par les frais de service.',
    hublo: 'Existe, montant non publié.',
    nous: 'Aucun. Ni pour publier une mission, ni pour y répondre.',
  },
  {
    question: 'Si vous embauchez durablement quelqu’un rencontré sur la plateforme',
    brigad: 'Non publié.',
    hublo: '2 000 € HT pour un aide-soignant, 3 000 € HT pour un infirmier issu du vivier — sauf après douze mois ou trente missions, les deux n’étant pas cumulatifs.',
    nous: 'Rien. Une embauche est une bonne nouvelle, pas un événement facturable.',
  },
  {
    question: 'Mission annulée à moins de 48 heures',
    brigad: '25 % du montant du premier jour la veille ; 50 % du premier jour et 25 % du second le jour même.',
    hublo: 'Toute mission annulée à moins de 48 heures avant son début est facturée.',
    nous: 'Rien n’est facturé — il n’y a rien à facturer.',
  },
  {
    question: 'Statut du professionnel',
    brigad: 'Contrat de prestation de services avec des indépendants, complété récemment par une brique « emplois salariés ».',
    hublo: 'Contrat de vacation conclu directement entre l’établissement et le soignant ; la plateforme se qualifie de simple intermédiaire.',
    nous: 'CDD signé directement avec l’établissement pour le renfort. Un bulletin de paie, pas une facture.',
  },
];

const OU_VERIFIER = [
  'Brigad — page « frais de service » côté entreprises et côté talents, et centre d’aide, article « Tout sur les frais de service ». Les pourcentages y sont écrits en toutes lettres, et confirmés par les exemples chiffrés que Brigad publie lui-même.',
  'Brigad — conditions générales d’utilisation, annexes relatives aux missions indépendants et aux emplois salariés, pour les frais d’annulation.',
  'Hublo — conditions générales de vente, article 7 pour les conditions financières et annexe 1 pour le Pool : frais de recrutement, exonérations, facturation des annulations.',
  'Hublo — conditions générales d’utilisation à destination des soignants, article 4.3, pour la gratuité de l’inscription.',
];

export default function ComparatifRemplacementPage() {
  return (
    <div className="section">
      <div className="mx-auto max-w-3xl text-center">
        <span className="eyebrow">
          <Wallet className="size-3.5" aria-hidden />
          Comparatif
        </span>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-foreground text-balance md:text-4xl">
          Ce que coûtent les plateformes de remplacement
        </h1>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground">
Trois façons de financer le même service, d’après ce que chaque acteur publie
          lui-même, relevé le {RELEVE_LE}. Là où rien n’est publié, nous l’écrivons plutôt que de l’estimer.
        </p>
      </div>

      <div className="mx-auto mt-12 max-w-5xl overflow-x-auto rounded-2xl border border-border">
        <table className="w-full min-w-[760px] border-collapse text-left text-sm">
          <caption className="sr-only">
            Comparaison des frais prélevés par Brigad, Hublo et Les Extras sur une mission
            de remplacement en établissement médico-social, relevés le {RELEVE_LE}.
          </caption>
          <thead>
            <tr className="bg-card">
              <th scope="col" className="w-[26%] p-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Ce que vous payez
              </th>
              <th scope="col" className="w-[24%] p-4 text-sm font-semibold text-foreground">
                Brigad
              </th>
              <th scope="col" className="w-[24%] p-4 text-sm font-semibold text-foreground">
                Hublo
              </th>
              <th scope="col" className="w-[26%] bg-success/10 p-4 text-sm font-semibold text-foreground">
                Les Extras
              </th>
            </tr>
          </thead>
          <tbody>
            {LIGNES.map((l) => (
              <tr key={l.question} className="border-t border-border align-top">
                <th scope="row" className="p-4 text-[13px] font-medium leading-relaxed text-foreground">
                  {l.question}
                </th>
                <td className="p-4 text-[13px] leading-relaxed text-muted-foreground">{l.brigad}</td>
                <td className="p-4 text-[13px] leading-relaxed text-muted-foreground">{l.hublo}</td>
                <td className="bg-success/5 p-4 text-[13px] leading-relaxed text-foreground">
                  {l.nous}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <section className="mx-auto mt-14 max-w-3xl">
        <h2 className="text-xl font-semibold text-foreground">
          « Gratuit », ça veut dire quoi exactement ?
        </h2>
        <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">
Une plateforme gratuite sans modèle économique visible inquiète, à juste titre. Il
          n’y a pas de piège : Les Extras est édité par une association loi 1901, pas par une société financée pour croître.
          Deux choses, et deux seulement, sont payantes — et aucune n’est le renfort.
        </p>
        <ul className="mt-6 space-y-4">
          <li className="flex gap-3">
            <Check className="mt-0.5 size-5 shrink-0 text-success" aria-hidden />
            <span className="text-[15px] leading-relaxed text-muted-foreground">
              <strong className="text-foreground">Les formations Qualiopi</strong>, facturées
              au devis par l’association, qui est certifiée et fait appel aux formateurs de
              son réseau.
            </span>
          </li>
          <li className="flex gap-3">
            <Check className="mt-0.5 size-5 shrink-0 text-success" aria-hidden />
            <span className="text-[15px] leading-relaxed text-muted-foreground">
              <strong className="text-foreground">LEX</strong>, l’assistant de rédaction des
              écrits professionnels, à crédits.
            </span>
          </li>
          <li className="flex gap-3">
            <X className="mt-0.5 size-5 shrink-0 text-muted-foreground" aria-hidden />
            <span className="text-[15px] leading-relaxed text-muted-foreground">
              Le renfort, les ateliers, la mise en relation, la contractualisation, le
              coffre-fort de conformité : <strong className="text-foreground">rien de tout
              cela n’est facturé</strong>, et rien de tout cela ne le sera. Ce n’est pas une
              offre de lancement, c’est le modèle.
            </span>
          </li>
        </ul>
        <p className="mt-6 text-[15px] leading-relaxed text-muted-foreground">
          Le détail complet est sur la page{' '}
          <Link href="/frais-de-service" className="text-primary underline-offset-4 hover:underline">
            ce qui est gratuit, ce qui est payant
          </Link>
          .
        </p>
      </section>

      <section className="mx-auto mt-14 max-w-3xl rounded-2xl border border-border bg-card p-6">
        <p className="inline-flex items-center gap-2 text-sm font-semibold text-foreground">
          <Scale className="size-4 text-primary" aria-hidden />
          Le point juridique qui compte plus que le prix
        </p>
        <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">
          Par une décision du 11 février 2025 (n° 491128), le Conseil d’État a jugé qu’un
          aide-soignant ne peut pas exercer sous statut d’indépendant en établissement : il
          agit sous la responsabilité d’un infirmier, dans le respect de l’organisation
          interne et sous l’autorité de la hiérarchie. La Fédération hospitalière de France
          y lit l’invalidation du modèle des plateformes fondées sur le statut
          d’auto-entrepreneur.
        </p>
        <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">
          C’est la raison pour laquelle le renfort passe chez nous par un CDD signé
          directement entre l’établissement et le professionnel, et jamais par une
          prestation de services. Sur ce point précis, nous ne prétendons à aucune
          originalité : c’est aussi le montage retenu par Hublo. C’est simplement le seul
          que cette décision sécurise.
        </p>
      </section>

      <section className="mx-auto mt-14 max-w-3xl">
        <p className="inline-flex items-center gap-2 text-sm font-semibold text-foreground">
          <Info className="size-4 text-primary" aria-hidden />
          Où vérifier ces chiffres vous-même
        </p>
        <ul className="mt-4 space-y-3">
          {OU_VERIFIER.map((s) => (
            <li key={s.slice(0, 40)} className="flex gap-3 text-sm leading-relaxed text-muted-foreground">
              <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary/60" aria-hidden />
              <span>{s}</span>
            </li>
          ))}
        </ul>
        <p className="mt-5 text-xs leading-relaxed text-muted-foreground">
Comparaison établie le {RELEVE_LE} à partir des documents publics de chaque acteur,
          sur le seul terrain du modèle économique. Une grille évolue : si vous constatez qu’un chiffre a changé, écrivez-nous et nous corrigerons cette page.
          Nous ne portons aucune appréciation sur la qualité de leurs services.
        </p>
      </section>

      <div className="mx-auto mt-14 max-w-3xl rounded-2xl border border-border bg-card p-6 text-center shadow-sm">
        <p className="text-base font-semibold text-foreground">
          Publier un besoin de renfort ne vous engage à rien
        </p>
        <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
Gratuit, sans carte bancaire ni engagement. Vous verrez le fonctionnement avant de
          décider.
        </p>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
          <Button asChild>
            <Link href="/register?type=etablissement">Créer le compte de ma structure</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/renforteam">Comment fonctionne RenforTeam</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
