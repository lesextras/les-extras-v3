import type { Metadata } from 'next';
import Link from 'next/link';
import { BadgeCheck, Info, Lock, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { metaPublique } from '@/lib/meta';

export const metadata: Metadata = metaPublique({
  title: 'Le prix d’un écrit rédigé avec une IA',
  description:
    'Combien coûte vraiment une génération d’écrit professionnel : le calcul, formule par formule, et ce qu’il faut regarder avant le prix.',
  path: '/comparatif-assistants-redaction',
});

/**
 * COMPARER DES PRIX, PAS DES PERSONNES.
 *
 * Cette page compare des grilles tarifaires publiques, et rien d'autre. Deux
 * garde-fous, tenus délibérément :
 *
 *  1. On ne dit RIEN de la solidité, de la taille ou de l'ancienneté des
 *     éditeurs concurrents. Ces informations existent, elles sont publiques,
 *     et elles nous seraient favorables — mais les publier serait du
 *     dénigrement, ce que la publicité comparative n'autorise pas (art. L122-1
 *     et s. du code de la consommation). Notre propre identité est affichée en
 *     pied de page de chaque page du site : le lecteur compare qui il veut.
 *  2. On compare ce qui est comparable : le coût d'une génération d'écrit. Un
 *     dossier usager complet et un assistant de rédaction ne répondent pas au
 *     même besoin, et la page le dit explicitement plutôt que de laisser croire
 *     à une équivalence.
 *
 * Les prix concurrents sont relevés le 2 septembre 2026 sur les pages tarifs
 * publiques. Les nôtres viennent du code (`billing.service.ts`) : 19 € pour
 * 200 générations, 49 € pour 600, dotation gratuite de 15 par mois.
 */

const RELEVE_LE = '2 septembre 2026';

type Offre = {
  nom: string;
  prix: string;
  inclus: string;
  generations: string;
  /** Coût unitaire, déjà calculé — affiché tel quel pour être vérifiable. */
  unitaire: string;
  nous?: boolean;
};

const OFFRES: Offre[] = [
  {
    nom: 'Dotation gratuite Les Extras',
    prix: '0 €',
    inclus: 'Tout compte, sans carte bancaire et sans date de fin',
    generations: '15 par mois, reportables 3 mois',
    unitaire: '0 €',
    nous: true,
  },
  {
    nom: 'LEX',
    prix: '19 € / mois',
    inclus: 'Un professionnel',
    generations: '200 par mois, reportables',
    unitaire: '0,095 €',
    nous: true,
  },
  {
    nom: 'LEX Pro',
    prix: '49 € / mois',
    inclus: 'Un professionnel, support prioritaire',
    generations: '600 par mois, reportables',
    unitaire: '0,082 €',
    nous: true,
  },
  {
    nom: 'LEX Équipe (établissement)',
    prix: '89 € / mois',
    inclus: 'Les personnes de votre choix, chacune avec son compte et un plafond mensuel, trames maison partagées',
    generations: '1 000 par mois, réparties',
    unitaire: '0,089 €',
    nous: true,
  },
  {
    nom: 'Logiciel de suivi éducatif, formule d’entrée',
    prix: '39 € / mois',
    inclus: 'Un utilisateur, 20 dossiers actifs, avec dossier usager',
    generations: '20 par mois',
    unitaire: '1,95 €',
  },
  {
    nom: 'Logiciel de suivi éducatif, formule équipe',
    prix: '149 € / mois',
    inclus: 'Jusqu’à 12 utilisateurs, dossiers illimités, avec dossier usager',
    generations: 'Illimitées',
    unitaire: 'Non applicable',
  },
];

export default function ComparatifAssistantsPage() {
  return (
    <div className="section">
      <div className="mx-auto max-w-3xl text-center">
        <span className="eyebrow">
          <Sparkles className="size-3.5" aria-hidden />
          Comparatif
        </span>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-foreground text-balance md:text-4xl">
          Combien coûte un écrit rédigé avec une IA
        </h1>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground">
Les offres affichent un prix mensuel ; ce qui compte, c’est le prix d’une
          génération. Voici la division faite, avec les prix relevés le {RELEVE_LE}.
        </p>
      </div>

      <div className="mx-auto mt-12 max-w-5xl overflow-x-auto rounded-2xl border border-border">
        <table className="w-full min-w-[820px] border-collapse text-left text-sm">
          <caption className="sr-only">
            Coût par génération d’écrit professionnel selon les formules du marché, relevé
            le {RELEVE_LE}.
          </caption>
          <thead>
            <tr className="bg-card">
              <th scope="col" className="p-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Formule
              </th>
              <th scope="col" className="p-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Prix
              </th>
              <th scope="col" className="p-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Pour qui
              </th>
              <th scope="col" className="p-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Générations
              </th>
              <th scope="col" className="p-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Par génération
              </th>
            </tr>
          </thead>
          <tbody>
            {OFFRES.map((o) => (
              <tr
                key={o.nom}
                className={`border-t border-border align-top ${o.nous ? 'bg-success/5' : ''}`}
              >
                <th scope="row" className="p-4 text-[13px] font-medium leading-relaxed text-foreground">
                  {o.nom}
                </th>
                <td className="whitespace-nowrap p-4 text-[13px] font-semibold text-foreground">
                  {o.prix}
                </td>
                <td className="p-4 text-[13px] leading-relaxed text-muted-foreground">{o.inclus}</td>
                <td className="p-4 text-[13px] leading-relaxed text-muted-foreground">
                  {o.generations}
                </td>
                <td className="whitespace-nowrap p-4 text-[13px] font-semibold text-foreground">
                  {o.unitaire}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <section className="mx-auto mt-12 max-w-3xl">
        <h2 className="text-xl font-semibold text-foreground">Ce que le tableau ne dit pas</h2>
        <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">
          Une formule d’entrée à 39 € par mois avec vingt générations comprend aussi un
          dossier usager, un planning et un tableau de bord de direction. Ce n’est pas la
          même chose que LEX, et nous ne prétendons pas le contraire : si vous cherchez un
          logiciel de gestion du dossier de l’usager, ce n’est pas ici.
        </p>
        <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">
          La comparaison porte sur un point précis, et c’est celui qui décide de l’usage
          réel : combien d’écrits vous pouvez faire assister dans un mois. Vingt générations
          mensuelles, c’est une semaine de travail pour un éducateur référent en période de
          bilans : après quoi l’outil est là mais ne sert plus, et le professionnel revient
          à sa page blanche ou, pire, à un assistant grand public dans lequel il collera des
          noms d’enfants.
        </p>
      </section>

      <section className="mx-auto mt-12 max-w-3xl rounded-2xl border border-border bg-card p-6">
        <p className="inline-flex items-center gap-2 text-sm font-semibold text-foreground">
          <Lock className="size-4 text-primary" aria-hidden />
          À regarder avant le prix
        </p>
        <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">
          Un écrit professionnel contient le nom d’un mineur, sa situation familiale, parfois
          des données de santé. Trois questions à poser à n’importe quel éditeur, y compris
          à nous, avant de comparer des euros :
        </p>
        <ul className="mt-4 space-y-3">
          {[
            'Les noms sortent-ils du poste de travail ? Chez nous, non : ils sont remplacés par des rôles, [le jeune], [la mère], [l’éducatrice référente], avant tout traitement, et rétablis localement dans le document rendu.',
            'Qui est le fournisseur du modèle de langage, nommément ? Un éditeur qui refuse de le nommer vous demande une confiance qu’il ne documente pas.',
            'Le contenu saisi sert-il à entraîner un modèle ? La réponse doit être écrite dans un contrat, pas dans une page marketing.',
          ].map((s) => (
            <li key={s.slice(0, 40)} className="flex gap-3 text-[15px] leading-relaxed text-muted-foreground">
              <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary/60" aria-hidden />
              <span>{s}</span>
            </li>
          ))}
        </ul>
        <p className="mt-5 text-[15px] leading-relaxed text-muted-foreground">
          Nos réponses, en détail, sur la page{' '}
          <Link href="/confiance-lex" className="text-primary underline-offset-4 hover:underline">
            cadre de confiance LEX
          </Link>
          .
        </p>
      </section>

      <section className="mx-auto mt-12 max-w-3xl rounded-2xl border border-border bg-card p-6">
        <p className="inline-flex items-center gap-2 text-sm font-semibold text-foreground">
          <BadgeCheck className="size-4 text-primary" aria-hidden />
          Qui édite LEX
        </p>
        <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">
          ADéPA, association loi 1901, SIRET 820 051 852 00011, siège 7 rue André Malraux à
          Melun. Organisme de formation déclaré sous le numéro 11771011677, certifié
          Qualiopi sous le numéro QNW0132 par QUALIPRO CERTIFICATION, accréditée par le
          COFRAC sous le numéro 5-0681, au titre des actions de formation et des bilans de
          compétences.
        </p>
        <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">
          Ces éléments figurent en pied de page de chacune de nos pages et en détail dans
          nos{' '}
          <Link href="/legal#mentions" className="text-primary underline-offset-4 hover:underline">
            mentions légales
          </Link>
          . Vérifiez-les : et vérifiez ceux des autres.
        </p>
      </section>

      <section className="mx-auto mt-12 max-w-3xl">
        <p className="inline-flex items-center gap-2 text-sm font-semibold text-foreground">
          <Info className="size-4 text-primary" aria-hidden />
          Méthode
        </p>
        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
          Le coût unitaire est obtenu en divisant le prix mensuel par le nombre de
          générations incluses, arrondi au millième d’euro. Les prix des offres concurrentes
          sont ceux affichés publiquement sur leurs pages tarifs au {RELEVE_LE} ; les nôtres
          sont ceux appliqués par notre facturation. Aucune formule sans prix public n’a été
          estimée. Si une grille change, écrivez-nous et cette page sera corrigée. Nous ne
          portons aucune appréciation sur la qualité des solutions citées, dont plusieurs
          couvrent des besoins que nous ne couvrons pas.
        </p>
      </section>

      <div className="mx-auto mt-12 max-w-3xl rounded-2xl border border-border bg-card p-6 text-center shadow-sm">
        <p className="text-base font-semibold text-foreground">
          Quinze générations par mois, gratuitement, sans date de fin
        </p>
        <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
Sans carte bancaire. De quoi juger sur pièces, avec vos propres écrits.
        </p>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
          <Button asChild>
            <Link href="/register">Créer un compte</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/guides">Lire les guides des écrits professionnels</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
