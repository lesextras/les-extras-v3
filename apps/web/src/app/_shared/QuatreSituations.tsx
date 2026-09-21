/**
 * LES QUATRE SITUATIONS — le fil de l'accueil.
 *
 * ⚠ POURQUOI CE BLOC REMPLACE « LES TROIS USAGES » (demande de Siham,
 * 21/09/2026). L'accueil enchaînait « Le réseau répond aux trois » puis « Le
 * travail administratif que vous ne ferez plus » : deux fois les mêmes offres,
 * une fois en produits, une fois en fonctions du logiciel. Le visiteur lisait
 * donc deux inventaires et aucune histoire — et RenforTeam n'avait nulle part
 * une section qui l'explique, alors que c'est le service le plus difficile à
 * comprendre.
 *
 * ⚠ LA RÈGLE D'ÉCRITURE, ET C'EST ELLE QU'IL NE FAUT PAS DÉFAIRE : chaque
 * section s'ouvre sur LA SITUATION, jamais sur le produit. Le titre est une
 * phrase qu'on pourrait entendre dans un couloir d'établissement ou dans une
 * cuisine à 21 h ; le service n'arrive qu'en réponse. Un visiteur ne cherche
 * pas « une plateforme de mise en relation », il cherche à sortir de quelque
 * chose.
 *
 * ⚠ LES CHIFFRES SONT VRAIS, ET ILS VIENNENT D'AILLEURS DANS LE SITE :
 *  - 0 % sur les ateliers et les formations, 15 % sur le renfort
 *    (/frais-de-service, arrêté le 21/09/2026) ;
 *  - 48 h pour un devis (promesse tenue partout ailleurs) ;
 *  - 14 parcours gratuits (mesuré, `/parcours-de-formation`) ;
 *  - 15 générations LEX offertes par mois, puis 19 € (billing.service.ts).
 * Aucun n'est arrondi ni inventé. Si l'un bouge, il bouge aux deux endroits.
 *
 * ⚠ ON N'ÉCRIT PAS « VISIOCONSULTATION » ICI tant que
 * `NEXT_PUBLIC_VISIOCONSULTATION` n'est pas posée. L'ancienne carte « Renfort »
 * l'annonçait alors que `/visio/:jeton` redirige : la page promettait un
 * service que le site ne pouvait pas rendre. La mention est donc conditionnée,
 * comme la carte de l'accueil et comme /renforteam.
 *
 * ⚠ AUCUNE PROMESSE DE VÉRIFICATION. Ni « intervenants vérifiés », ni
 * « profils contrôlés » : aucune vérification d'identité, de diplôme ou de
 * casier n'existe dans ce produit, et c'est l'établissement qui contrôle à
 * l'embauche. Le test `promesses-interdites` le vérifie.
 */
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Check } from 'lucide-react';
import { wp } from '@/lib/media';
import { visioconsultationVisible } from '@/lib/offre';
import { Reveal } from './Reveal';
import { Button } from '@/components/ui/button';

type Situation = {
  service: string;
  /** La phrase du couloir. C'est le titre, et c'est le problème. */
  probleme: string;
  /** Deux ou trois phrases qui déroulent la situation, sans vendre. */
  situation: string[];
  /** Ce que la plateforme fait, concrètement. Trois lignes, pas quatre. */
  reponse: string[];
  /** Le chiffre vrai, et ce qu'il désigne. */
  chiffre: { valeur: string; quoi: string };
  lien: { href: string; libelle: string };
  /** Une photo, OU `visuel: 'lex'` pour le rendu maison. Jamais les deux. */
  image?: string;
  alt?: string;
  visuel?: 'lex';
  teinte: string;
  trait: string;
  puce: string;
};

const SITUATIONS: Situation[] = [
  {
    service: 'RenforTeam',
    probleme: 'La notification est arrivée. Le rendez-vous est dans quatorze mois.',
    situation: [
      'La MDPH a notifié, le SESSAD a une liste d’attente, et l’orthophoniste du secteur ne prend plus personne. Pendant ce temps l’enfant grandit, et c’est la seule chose qui ne peut pas attendre.',
      'Les établissements connaissent la même impasse de l’autre côté : un accompagnement à monter, personne de disponible, et un budget qui ne permet pas d’embaucher.',
    ],
    reponse: [
      'Vous décrivez le besoin en cinq minutes, le soir même',
      'Les indépendants du réseau sont prévenus : ergothérapeute, psychomotricienne, orthophoniste, éducateur spécialisé, psychologue',
      'Devis écrit avant l’intervention, jamais après',
    ],
    chiffre: { valeur: '48 h', quoi: 'pour recevoir un devis' },
    lien: { href: '/renforteam', libelle: 'Comment ça se passe' },
    image: wp('/wp-content/uploads/2025/02/mineur-protection-de-lenfance.jpg'),
    alt: 'Un professionnel accompagne un enfant lors d’une séance individuelle',
    teinte: 'text-primary',
    trait: 'bg-primary',
    puce: 'text-primary',
  },
  {
    service: 'Ateliers',
    probleme: 'Il faut « faire quelque chose » avec le groupe, et personne n’a le temps de le monter.',
    situation: [
      'Un atelier qui tient debout, ça demande un intervenant, un matériel, une durée, un tarif, et quelqu’un pour tout caler. En pratique, on retombe sur ce qu’on a déjà fait l’an dernier.',
      'Les intervenants existent — musicothérapie, théâtre, psycho-boxe, slam, socio-esthétique — mais ils sont introuvables autrement que par le bouche-à-oreille.',
    ],
    reponse: [
      'Le catalogue affiche le public visé, la durée, le matériel et le tarif',
      'Vous réservez ou vous demandez un devis, sans créer de dossier',
      'Le tarif affiché est le tarif payé : l’association ne prend rien dessus',
    ],
    chiffre: { valeur: '0 %', quoi: 'de commission sur les ateliers' },
    lien: { href: '/ateliers', libelle: 'Parcourir le catalogue' },
    image: wp('/wp-content/uploads/2023/02/cerf-volant-game-enfant-400x400.jpg'),
    alt: 'Des enfants en activité collective en extérieur',
    teinte: 'text-secondary',
    trait: 'bg-secondary',
    puce: 'text-secondary',
  },
  {
    service: 'Formations',
    probleme: 'L’équipe encaisse depuis six mois, et la dernière formation remonte à trois ans.',
    situation: [
      'Le budget formation existe, le plan est à rendre, et ce qui manque c’est le temps de chercher un organisme, de monter le dossier OPCO et de faire revenir tout le monde le même jour.',
      'Et il y a ce qu’aucun budget ne couvre : le professionnel qui voudrait comprendre une situation précise, un mardi soir, sans attendre le prochain plan.',
    ],
    reponse: [
      'Formations en intra, certifiées Qualiopi, finançables par votre OPCO',
      'Émargement, attestations et convention édités par la plateforme',
      'Et quatorze parcours en ligne, gratuits, à suivre quand on veut',
    ],
    chiffre: { valeur: '14', quoi: 'parcours gratuits, sans carte bancaire' },
    lien: { href: '/formations', libelle: 'Voir le catalogue' },
    image: wp('/wp-content/uploads/2025/02/lever-vous-400x400.jpeg'),
    alt: 'Une salle de formation professionnelle',
    teinte: 'text-foreground',
    trait: 'bg-foreground',
    puce: 'text-foreground',
  },
  {
    service: 'LEX',
    probleme: 'Il est 21 h, le rapport est pour demain, et la page est blanche.',
    situation: [
      'Personne n’a appris à écrire un rapport de situation. On l’apprend en le ratant, avec le modèle du collègue et la peur de mettre un mot de travers — dans un document qu’un juge lira peut-être.',
      'Les assistants génériques écrivent vite, mais on y colle des noms d’usagers. C’est précisément ce qu’on ne peut pas faire.',
    ],
    reponse: [
      'Vous donnez vos notes ; les noms sont remplacés avant que le modèle les voie',
      'Le texte revient structuré, avec les vrais noms rétablis chez vous',
      'Vous relisez, vous corrigez, vous signez : la plume reste la vôtre',
    ],
    chiffre: { valeur: '15', quoi: 'écrits offerts chaque mois, puis 19 €' },
    lien: { href: '/lex', libelle: 'Ce que LEX fait, et ne fait pas' },
    // ⚠ PAS DE PHOTO ICI, ET C'EST UN CHOIX. Une photo de bureau n'explique
    // rien d'un assistant d'écriture, alors que le AVANT / APRÈS ci-dessous
    // montre en trois secondes ce que le produit fait ET que les noms sont
    // remplacés — c'est-à-dire l'argument qui le sépare d'un assistant
    // générique. (`ecrire-400x400.jpeg` répond par ailleurs 404 sur
    // WordPress : ne pas la remettre.)
    visuel: 'lex',
    teinte: 'text-primary',
    trait: 'bg-primary',
    puce: 'text-primary',
  },
];

/**
 * LE AVANT / APRÈS DE LEX.
 *
 * ⚠ IL MONTRE LE JETON `[LE JEUNE]`, ET C'EST TOUT L'INTÉRÊT. Le seul
 * argument qui sépare LEX d'un assistant générique est que les noms ne
 * sortent pas — et une phrase qui l'affirme convainc moins qu'une capture où
 * on voit le nom disparaître. Le jeton affiché est un jeton PARLANT, comme
 * ceux que le pseudonymiseur produit réellement (voir `pseudonymiseur.service`).
 *
 * ⚠ LE TEXTE EST FICTIF ET NE DÉSIGNE PERSONNE. Un prénom seul, aucun nom de
 * famille, aucune structure, aucune date : c'est une illustration, pas un
 * extrait de dossier.
 */
function VisuelLex() {
  return (
    <div className="rounded-2xl border border-border bg-muted/30 p-4 shadow-card sm:p-5">
      <div className="rounded-xl border border-border bg-background p-4">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
          Vos notes, telles quelles
        </p>
        <p className="mt-2 text-sm leading-relaxed text-foreground">
          «&nbsp;Kevin a encore quitté la table hier soir, 3<sup>e</sup> fois cette semaine. Il est
          revenu tout seul au bout de 10 min. Sa mère doit appeler vendredi.&nbsp;»
        </p>
      </div>

      <div className="flex items-center gap-3 py-3">
        <span className="h-px flex-1 bg-border" aria-hidden />
        <span className="rounded-full border border-primary/30 bg-primary-soft px-3 py-1 text-[11px] font-bold text-primary">
          les noms partent ici
        </span>
        <span className="h-px flex-1 bg-border" aria-hidden />
      </div>

      <div className="rounded-xl border border-border bg-background p-4">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
          Ce que le modèle reçoit
        </p>
        <p className="mt-2 text-sm leading-relaxed text-foreground">
          «&nbsp;<mark className="rounded bg-primary-soft px-1 font-semibold text-primary">
            [LE JEUNE]
          </mark>{' '}
          a quitté la table à trois reprises cette semaine, revenant seul après une dizaine de
          minutes. Un échange est prévu avec{' '}
          <mark className="rounded bg-primary-soft px-1 font-semibold text-primary">[LA MÈRE]</mark>
          .&nbsp;»
        </p>
        <p className="mt-3 border-t border-border pt-3 text-xs leading-relaxed text-muted-foreground">
          Les vrais prénoms sont rétablis chez vous, dans le document rendu. Ils ne quittent jamais
          la plateforme.
        </p>
      </div>
    </div>
  );
}

export function QuatreSituations() {
  return (
    <section className="bg-background">
      <div className="section">
        <Reveal className="max-w-3xl">
          <span className="eyebrow">Ce qu’on résout</span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl text-balance">
            Quatre situations qu’on connaît tous. Quatre réponses.
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
            Les Extras n’est pas un annuaire de plus. C’est quatre services qui répondent chacun à
            un blocage précis du médico-social — et un seul endroit où le devis, le contrat et la
            facture sont édités.
          </p>
        </Reveal>

        <div className="mt-14 space-y-16 md:space-y-24">
          {SITUATIONS.map((s, i) => (
            <Reveal key={s.service}>
              {/*
                ⚠ L'ALTERNANCE SE FAIT PAR `order`, PAS PAR `flex-row-reverse` :
                sur mobile la grille se replie en une colonne, et l'image doit
                alors TOUJOURS passer après le texte. Un `row-reverse` remonte
                l'image au-dessus du titre une fois sur deux, et on lit une
                photo sans savoir de quoi on parle.
              */}
              <div className="grid items-center gap-8 md:grid-cols-2 md:gap-14">
                <div className={i % 2 === 1 ? 'md:order-2' : ''}>
                  <div className="flex items-center gap-3">
                    <span className={`h-px w-8 ${s.trait}`} aria-hidden />
                    <span
                      className={`text-xs font-bold uppercase tracking-[0.18em] ${s.teinte}`}
                    >
                      {s.service}
                    </span>
                  </div>

                  <h3 className="mt-4 text-2xl font-bold leading-tight tracking-tight text-foreground md:text-3xl text-balance">
                    {s.probleme}
                  </h3>

                  {s.situation.map((p) => (
                    <p key={p.slice(0, 28)} className="mt-4 leading-relaxed text-muted-foreground">
                      {p}
                    </p>
                  ))}

                  <ul className="mt-6 space-y-2.5">
                    {s.reponse.map((r) => (
                      <li key={r.slice(0, 28)} className="flex gap-2.5 text-sm leading-relaxed">
                        <Check className={`mt-0.5 size-4 shrink-0 ${s.puce}`} aria-hidden />
                        <span className="text-foreground">{r}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3">
                    <Button asChild variant="outline">
                      <Link href={s.lien.href}>
                        {s.lien.libelle}
                        <ArrowRight className="size-4" />
                      </Link>
                    </Button>
                    <p className="text-sm text-muted-foreground">
                      <strong className={`text-base font-bold ${s.teinte}`}>
                        {s.chiffre.valeur}
                      </strong>{' '}
                      {s.chiffre.quoi}
                    </p>
                  </div>
                </div>

                <div className={i % 2 === 1 ? 'md:order-1' : ''}>
                  {s.visuel === 'lex' ? (
                    <VisuelLex />
                  ) : (
                    <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-border shadow-card">
                      <Image
                        src={s.image as string}
                        alt={s.alt as string}
                        fill
                        sizes="(min-width: 768px) 46vw, 100vw"
                        className="object-cover"
                      />
                    </div>
                  )}
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        {visioconsultationVisible() && (
          <Reveal delay={120}>
            <p className="mt-14 rounded-xl border border-border bg-muted/40 p-5 text-sm leading-relaxed text-muted-foreground">
              <strong className="text-foreground">Et quand personne n’est disponible près de
              chez vous</strong>, la séance se tient en visioconsultation — même devis, même feuille
              de mission, même facture.
            </p>
          </Reveal>
        )}
      </div>
    </section>
  );
}
