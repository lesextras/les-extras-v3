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
 *
 * ⚠⚠ RESSERRÉ LE 21/09/2026 — « il y a trop de textes à lire », demande de
 * Siham, capture à l'appui. Chaque section portait DEUX paragraphes : le
 * premier posait la situation, le second la reposait depuis l'autre côté
 * (l'établissement après la famille, les assistants génériques après LEX).
 * Le second commentait le premier, et c'est exactement ce qui fait sauter les
 * deux. Un paragraphe par section désormais, deux phrases au plus.
 *
 * ⚠ ET PLUS DE TIRET CADRATIN NI DE DEUX-POINTS DANS CE BLOC, toujours à sa
 * demande. Ce n'est pas une préférence de ponctuation, c'est un effet mesuré à
 * l'écran : un « — » ou un « : » au milieu d'une ligne annonce une SUITE, donc
 * une phrase plus longue, et sur quatre sections empilées cela se lit comme un
 * mur. Les incises deviennent des phrases, les listes après deux-points
 * deviennent la phrase elle-même. Si une nouvelle section en rapporte un, elle
 * rouvre le défaut pour tout le bloc.
 *
 * ⚠ AUCUN CHIFFRE N'A ÉTÉ RETIRÉ au passage, et aucun fait : 48 h, 0 %, 14
 * parcours, 15 écrits puis 19 €. Ce qui a sauté, ce sont les redites. Un
 * resserrage qui emporte un chiffre fait mentir la page au lieu de l'alléger.
 */
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Check } from 'lucide-react';
import { wp } from '@/lib/media';
import { visioconsultationVisible } from '@/lib/offre';
import { Reveal } from './Reveal';
import { Button } from '@/components/ui/button';

/**
 * ⚠ LU UNE SEULE FOIS, EN TÊTE DE MODULE. `NEXT_PUBLIC_VISIOCONSULTATION` est
 * figée à la construction : l'appeler à chaque rendu ne change rien, et deux
 * lectures dans le même fichier finiraient par diverger si l'une est oubliée.
 */
const VISIO = visioconsultationVisible();

type Situation = {
  service: string;
  /** La phrase du couloir. C'est le titre, et c'est le problème. */
  probleme: string;
  /** UNE ou deux phrases qui déroulent la situation, sans vendre. */
  situation: string[];
  /** Ce que la plateforme fait, concrètement. Trois lignes, pas quatre. */
  reponse: string[];
  /**
   * La ligne mise en avant sous les puces — QUI intervient, et comment.
   *
   * ⚠ ELLE N'EXISTE QUE SUR RENFORTEAM, et c'est une demande de Siham du
   * 21/09/2026 : « met en avant les éducateurs renforts en présentiel ou
   * visioconférence ». Les métiers étaient noyés au milieu d'une puce, entre
   * une durée et un devis, alors que c'est la seule chose qu'un directeur
   * cherche vraiment sur cette section. La poser partout en ferait un gabarit,
   * donc du bruit.
   */
  accent?: string;
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
  /**
   * Le filet de gauche de la ligne mise en avant.
   *
   * ⚠⚠ ÉCRIT EN TOUTES LETTRES, JAMAIS CALCULÉ. La première version faisait
   * `trait.replace('bg-', 'border-')` — c'est juste en JavaScript et FAUX en
   * Tailwind : le compilateur ne lit que des classes littérales dans les
   * sources. Une classe fabriquée à l'exécution n'est jamais générée, le filet
   * retombe sur la bordure grise par défaut, rien ne casse et aucun test ne
   * tombe. C'est le genre de défaut qu'on ne voit qu'en regardant la page.
   */
  bordure: string;
};

const SITUATIONS: Situation[] = [
  {
    service: 'RenforTeam',
    probleme: 'La notification est arrivée. Le rendez-vous est dans quatorze mois.',
    situation: [
      'La MDPH a notifié, le SESSAD a une liste d’attente, l’orthophoniste du secteur ne prend plus personne. Côté établissement c’est la même impasse, et l’enfant grandit pendant ce temps.',
    ],
    reponse: [
      'Vous décrivez le besoin en cinq minutes, le soir même',
      'Le réseau est prévenu, vous choisissez qui vient',
      'Devis écrit avant l’intervention, jamais après',
    ],
    /*
      ⚠ LA MOITIÉ « VISIOCONFÉRENCE » EST CONDITIONNÉE, ET ELLE DOIT LE RESTER.
      Tant que `NEXT_PUBLIC_VISIOCONSULTATION` n'est pas posée, `/visio/:jeton`
      redirige : l'annoncer alors promettrait un service que le site ne peut pas
      rendre. C'est le défaut exact de l'ancienne carte « Renfort ».

      ⚠ « VISIOCONFÉRENCE » EST LE MOT DE SIHAM (21/09). Le reste du site dit
      « visioconsultation » et le menu dit « rendez-vous à distance » ; aucun ne
      dit « téléconsultation », qui désigne un acte médical alors qu'il s'agit
      ici de rééducation et d'éducation spécialisée. Si l'on aligne un jour les
      trois, c'est partout en même temps, pas ici seulement.
    */
    accent: VISIO
      ? 'Éducateurs spécialisés, ergothérapeutes, psychomotriciennes, orthophonistes, psychologues. Ils interviennent chez vous, en présentiel ou en visioconférence quand personne n’est disponible près de chez vous.'
      : 'Éducateurs spécialisés, ergothérapeutes, psychomotriciennes, orthophonistes, psychologues. Ils interviennent chez vous, dans votre établissement ou au domicile.',
    chiffre: { valeur: '48 h', quoi: 'pour recevoir un devis' },
    lien: { href: '/renforteam', libelle: 'Comment ça se passe' },
    image: wp('/wp-content/uploads/2025/02/mineur-protection-de-lenfance.jpg'),
    alt: 'Un professionnel accompagne un enfant lors d’une séance individuelle',
    teinte: 'text-primary',
    trait: 'bg-primary',
    puce: 'text-primary',
    bordure: 'border-primary',
  },
  {
    service: 'Ateliers',
    probleme: 'Il faut « faire quelque chose » avec le groupe, et personne n’a le temps de le monter.',
    situation: [
      'Musicothérapie, théâtre, psycho-boxe, slam, socio-esthétique. Les intervenants existent, mais on ne les trouve que par le bouche-à-oreille, alors on refait ce qu’on a fait l’an dernier.',
    ],
    reponse: [
      'Le catalogue affiche le public visé, la durée, le matériel et le tarif',
      'Vous réservez ou vous demandez un devis, sans créer de dossier',
      'Le tarif affiché est le tarif payé, l’association ne prend rien dessus',
    ],
    chiffre: { valeur: '0 %', quoi: 'de commission sur les ateliers' },
    lien: { href: '/ateliers', libelle: 'Parcourir le catalogue' },
    image: wp('/wp-content/uploads/2023/02/cerf-volant-game-enfant-400x400.jpg'),
    alt: 'Des enfants en activité collective en extérieur',
    teinte: 'text-secondary',
    trait: 'bg-secondary',
    puce: 'text-secondary',
    bordure: 'border-secondary',
  },
  {
    service: 'Formations',
    probleme: 'L’équipe encaisse depuis six mois, et la dernière formation remonte à trois ans.',
    situation: [
      'Le budget existe et le plan est à rendre. Ce qui manque, c’est le temps de chercher un organisme, de monter le dossier OPCO et de faire revenir tout le monde le même jour.',
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
    bordure: 'border-foreground',
  },
  {
    service: 'LEX',
    probleme: 'Il est 21 h, le rapport est pour demain, et la page est blanche.',
    situation: [
      'Personne n’a appris à écrire un rapport de situation. On l’apprend en le ratant, avec la peur de mettre un mot de travers dans un document qu’un juge lira peut-être.',
    ],
    reponse: [
      'Vous donnez vos notes, les noms sont remplacés avant que le modèle les voie',
      'Le texte revient structuré, avec les vrais noms rétablis chez vous',
      'Vous relisez, vous corrigez, vous signez. La plume reste la vôtre',
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
    bordure: 'border-primary',
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
            {/* ⚠ « LA FEUILLE DE MISSION », PAS « LE CONTRAT » (21/09/2026).
                Le logiciel édite un devis, une feuille de mission et une
                facture ; le contrat de travail, lui, reste rédigé par
                l'établissement. Écrire « contrat » ici promettait de l'intérim
                qu'on ne fait pas — et contredisait le premier écran, qui dit
                la bonne chose. Les deux phrases doivent rester identiques. */}
            Les Extras n’est pas un annuaire de plus. Quatre services, et un seul endroit où le
            devis, la feuille de mission et la facture sont édités.
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

                  {/*
                    LES MÉTIERS, MIS EN AVANT — voir `accent` dans le type.

                    ⚠ LE CONTOUR PORTE LA TEINTE DE LA SECTION, L'INTÉRIEUR
                    RESTE SOBRE. Un aplat teinté de plus, juste sous trois
                    puces déjà colorées, ferait un troisième niveau de fond sur
                    la même colonne — c'est le défaut corrigé le 3/09 sur les
                    encarts de la fiche formation, et il se reproduit à
                    l'identique dès qu'on empile deux surfaces voisines.
                  */}
                  {s.accent ? (
                    <p
                      className={`mt-5 rounded-xl border-l-2 bg-muted/30 py-3 pl-4 pr-3 text-sm font-medium leading-relaxed text-foreground ${s.bordure}`}
                    >
                      {s.accent}
                    </p>
                  ) : null}

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

        {/*
          ⚠ LA NOTE DE VISIO A QUITTÉ LE PIED DE SECTION LE 21/09/2026.

          Elle y était en dernier, après les quatre situations, en gris et en
          petit — c'est-à-dire à l'endroit exact où l'on ne lit plus. Siham a
          demandé de mettre en avant les éducateurs « en présentiel ou
          visioconférence » : la mention est donc remontée DANS la section
          RenforTeam (champ `accent`), juste sous les puces, là où le directeur
          se demande précisément qui va venir et comment.

          ⚠ NE PAS LA REMETTRE ICI EN PLUS. Deux fois la même chose sur une
          page qu'on vient de resserrer, c'est ce qui fait sauter les deux.
        */}
      </div>
    </section>
  );
}
