/**
 * F11 — RENFORCER CE QUI VA
 *
 * Compétence : faire augmenter un comportement DÉJÀ présent, en le remarquant
 * au bon moment et au bon rythme — et savoir reconnaître, en dix jours de
 * relevé, si ce qu'on croyait renforçant l'est réellement.
 *
 * ── LA FRONTIÈRE AVEC LES AUTRES PARCOURS ──────────────────────────────────
 * Celui-ci ne traite QUE l'augmentation d'un comportement qui existe déjà,
 * même rarement. Il ne traite PAS :
 *   · ce que le comportement gênant obtient → « Les quatre fonctions » ;
 *   · l'enseignement d'un moyen de remplacement → « Apprendre à demander » ;
 *   · l'apprentissage d'une séquence → « Décomposer une routine » ;
 *   · le retrait de l'aide → « Guider puis s'effacer » ;
 *   · l'entrée dans la tâche → « Aider à démarrer une tâche ».
 * On ne peut pas renforcer un comportement qui n'existe pas encore : c'est la
 * phrase qui trie, et le module 1 la pose avant tout le reste.
 *
 * ⚠ TROIS GARDE-FOUS QUI NE SE NÉGOCIENT PAS, et qui sont dans le texte, pas
 * en note de bas de page :
 *   1. ON NE RETIRE JAMAIS CE QUI A ÉTÉ GAGNÉ. Retirer un point, une image, un
 *      jeton acquis transforme le dispositif en punition et détruit en une fois
 *      la confiance qu'il a mis des semaines à construire. C'est l'erreur la
 *      plus fréquente des tableaux de comportement, et la plus coûteuse.
 *   2. ON NE CONDITIONNE JAMAIS UN BESOIN FONDAMENTAL. Le repas, le sommeil,
 *      les soins, l'affection, la sortie, le lien avec la famille et surtout le
 *      MOYEN DE COMMUNICATION ne sont pas des récompenses. Ils ne se méritent
 *      pas, ils sont dus.
 *   3. LE RENFORÇATEUR SOCIAL N'EST PAS UNIVERSEL. Les félicitations
 *      publiques, le contact visuel, la main sur l'épaule sont neutres ou
 *      franchement désagréables pour une partie des personnes accompagnées,
 *      autistes en particulier. Le parcours fait donc TESTER, jamais supposer.
 *
 * ⚠ NUANCE ABA OBLIGATOIRE. Le contenu vient de l'analyse appliquée du
 * comportement : le parcours porte l'encart `COMPORTEMENTALES` de build-v2.js,
 * et la fiche publique porte `GARDE_FOU`. Les deux doivent dire la même chose.
 *
 * ⚠ ON NE TRAVAILLE PAS SUR CE QUI ARRANGE L'ADULTE. Le module 3 fait écrire,
 * AVANT de choisir le comportement à renforcer, à qui il sert. Un comportement
 * qui ne sert qu'au confort de l'équipe n'entre pas dans le dispositif. Sans
 * cette colonne, le parcours devient une méthode pour obtenir de la docilité,
 * et c'est exactement ce que les personnes autistes adultes reprochent, à
 * juste titre, aux usages dérivés de ces outils.
 */

const G = require('./gabarit-v3.js');
const A = require('./annexes.js');
const S = require('./schemas.js');

/* ── FIGURES ─────────────────────────────────────────────────────────────── */

const CARTE = S.figure({
  numero: 1,
  titre: 'La carte du parcours',
  corps: S.carte({
    modules: [
      { titre: 'Module 1', produit: 'la règle des trois réglages' },
      { titre: 'Module 2', produit: 'un dispositif disséqué' },
      { titre: 'Module 3', produit: 'votre fiche de renforcement' },
      { titre: 'Module 4', produit: 'la lecture, puis l’espacement' },
    ],
    releve:
      '<strong>Entre le module 3 et le module 4&nbsp;:</strong> dix jours, deux chiffres par jour — combien de fois le comportement est apparu, combien de fois vous l’avez remarqué.',
  }),
  legende:
    'Dix jours, et pas moins : un comportement qui apparaît deux fois par jour ne montre pas de tendance lisible avant une bonne semaine.',
});

const BOUCLE = S.figure({
  numero: 2,
  titre: 'Pourquoi un comportement augmente',
  corps: S.boucle(
    [
      { titre: 'Situation', detail: 'ce qui se passe juste avant' },
      { titre: 'Comportement', detail: 'ce que la personne fait' },
      { titre: 'Conséquence', detail: 'ce qui arrive juste après' },
    ],
    'et le comportement devient plus probable la prochaine fois',
  ),
  legende:
    'C’est la même boucle que dans « Les quatre fonctions ». La différence tient en un mot : là-bas on la subissait, ici on la pose exprès.',
});

const DELAI = S.figure({
  numero: 3,
  titre: 'Ce que coûte chaque seconde de délai',
  corps: S.echelle(
    [
      {
        niveau: 'Immédiat',
        libelle:
          'Dans les <strong>trois secondes</strong>. La personne relie sans effort ce qu’elle vient de faire à ce qui arrive.',
      },
      {
        niveau: '30 secondes',
        libelle:
          'Le lien tient encore, mais il faut que rien ne se soit passé entre les deux.',
      },
      {
        niveau: 'Fin de séance',
        libelle:
          'Le lien est déjà fragile. Ce qui est renforcé, c’est souvent le dernier comportement, pas celui qu’on visait.',
      },
      {
        niveau: 'Le soir',
        libelle:
          'Aucun effet d’apprentissage. C’est un bilan, ce peut être agréable, mais ce n’est plus du renforcement.',
      },
      {
        niveau: 'Le vendredi',
        libelle:
          'Pour beaucoup d’enfants, une semaine est une durée abstraite. Le tableau devient un décor.',
      },
    ],
    { titreNiveau: 'Délai', titreLibelle: 'Ce qui se passe réellement' },
  ),
  legende:
    'La colonne du milieu se lit comme une perte : c’est le délai, bien plus que le contenu de la récompense, qui décide si un dispositif marche.',
});

const CROYANCES = S.figure({
  numero: 4,
  titre: 'Ce qu’on croit renforçant, et ce qui l’est',
  corps: S.paires({
    gauche: 'Ce que l’adulte met en place',
    droite: 'Ce que ça vaut vraiment, et pourquoi',
    lignes: [
      {
        g: '« Bravo&nbsp;! » lancé à la cantonade',
        d: 'Souvent rien. Trop vague pour dire QUEL comportement est visé, et parfois gênant en public.',
      },
      {
        g: 'Une image en fin de semaine',
        d: 'Trop tard de plusieurs jours. Ce qui est renforcé, c’est au mieux le vendredi.',
      },
      {
        g: 'Un compliment devant le groupe',
        d: 'Renforçateur pour certains, <strong>punition pour d’autres</strong>. Cela se teste, cela ne se suppose pas.',
      },
      {
        g: 'Un bonbon quand l’adulte y pense',
        d: 'Irrégulier, donc illisible. Et l’effet s’effondre dès que la personne n’a plus faim.',
      },
      {
        g: 'Nommer le comportement dans les trois secondes',
        d: '<strong>Le seul de la liste qui marche à tous les coups</strong>, et il est gratuit.',
      },
    ],
  }),
  legende:
    'Quatre lignes sur cinq coûtent de l’argent ou du matériel, et la cinquième, qui ne coûte rien, est la plus efficace.',
});

const ARBRE = S.figure({
  numero: 5,
  titre: 'Ça n’augmente pas. Dans quel ordre chercher',
  corps: S.arbre({
    question: 'Après dix jours, la colonne « apparu » ne monte pas. Que regarder, et dans cet ordre&nbsp;?',
    branches: [
      {
        condition: '1. Le délai',
        contenu:
          'Mesurez-le vraiment, chronomètre en main, sur trois occasions. Au-delà de trente secondes, le reste ne sert à rien : corrigez le délai avant de toucher à quoi que ce soit.',
      },
      {
        condition: '2. Le renforçateur',
        contenu:
          'Ce que vous donnez n’en est peut-être pas un pour cette personne. Un renforçateur se reconnaît à l’effet, jamais à l’intention. Reprenez la liste de préférences.',
      },
      {
        condition: '3. Le critère',
        contenu:
          'Il est peut-être trop haut. Si le comportement n’apparaît jamais, il n’y a rien à renforcer : abaissez jusqu’à ce qu’il apparaisse au moins une fois par jour.',
      },
    ],
  }),
  legende:
    'Cet ordre n’est pas indifférent : changer la récompense quand le problème est le délai fait perdre trois semaines et fait conclure, à tort, que « ça ne marche pas avec lui ».',
});

const ESTOMPAGE = S.figure({
  numero: 6,
  titre: 'Espacer sans tout perdre',
  corps: S.frise([
    {
      nom: 'Continu',
      largeur: 25,
      fort: true,
      quoi: 'Chaque fois. C’est la phase d’installation, et elle est courte.',
    },
    {
      nom: 'Une fois sur deux',
      largeur: 25,
      fort: true,
      quoi: 'Dès que le comportement apparaît tous les jours sans exception.',
    },
    {
      nom: 'Irrégulier',
      largeur: 25,
      quoi: 'Environ une fois sur trois, sans régularité. C’est la phase la plus solide.',
    },
    {
      nom: 'Naturel',
      largeur: 25,
      quoi: 'Ce que la situation apporte d’elle-même. On ne retire jamais totalement.',
    },
  ]),
  legende:
    'Un comportement renforcé irrégulièrement résiste bien mieux qu’un comportement renforcé à chaque fois. C’est contre-intuitif, et c’est pour ça qu’on espace au lieu d’arrêter net.',
});

/* ── MODULE 1 ────────────────────────────────────────────────────────────── */

const M1 = {
  reperes: {
    minutes: 12,
    prerequis: 'Aucun. Ce parcours se suit seul, mais il se comprend mieux après « Les quatre fonctions d’un comportement ».',
    evaluation:
      'Le module 3 fait produire une fiche de renforcement, et le module 4 la confronte à dix jours de relevé. C’est le relevé qui évalue, pas un quiz.',
    apres: 'dix jours de relevé, deux chiffres par jour, entre le module 3 et le module 4.',
  },
  objectifs: [
    'Énoncer la seule définition utilisable d’un renforçateur, et expliquer pourquoi l’intention de l’adulte n’y figure pas.',
    'Citer les trois réglages qui décident du résultat : le délai, le critère, la fréquence.',
    'Reconnaître les quatre situations où un dispositif de renforcement ne doit pas être posé du tout.',
    'Distinguer un comportement à renforcer d’un comportement à enseigner, et savoir vers quel parcours renvoyer.',
  ],
  corps: `${CARTE}

<h3 style="${G.H3}">1. La phrase qui trie</h3>

<p>On ne peut renforcer que ce qui existe déjà. Même rarement, même mal, même
une fois par semaine — mais cela doit exister. Si le comportement que vous
attendez n’est jamais apparu, il n’y a rien à renforcer, et aucun tableau, aucun
jeton, aucune récompense ne le fera apparaître.</p>

<p>C’est la première chose à vérifier, et elle élimine à peu près un projet sur
deux. « Il faut qu’il demande au lieu de crier » n’est pas un objectif de
renforcement tant qu’il n’a jamais demandé : c’est un objectif d’enseignement,
et il relève du parcours « Apprendre à demander plutôt qu’à crier ».</p>

${G.exemple(
  'Deux phrases qui se ressemblent et qui ne relèvent pas du même parcours',
  `<p><strong>« Il range son plateau une fois sur cinq. »</strong> Le comportement
existe. On peut le renforcer, et c’est ce parcours.</p>
<p><strong>« Il ne range jamais son plateau, il ne sait pas par où commencer. »</strong>
Le comportement n’existe pas. Il faut l’enseigner par étapes, et c’est
« Décomposer une routine en étapes ».</p>`,
)}

<h3 style="${G.H3}">2. Un renforçateur se reconnaît à l’effet</h3>

<p>Voici la définition, et elle n’est pas négociable : <strong>est renforçateur
ce qui, placé après un comportement, le rend plus fréquent.</strong> Rien
d’autre. Ni ce qui fait plaisir, ni ce qui devrait faire plaisir, ni ce que vous
donneriez volontiers.</p>

<p>La conséquence est inconfortable et il faut la regarder en face : on ne sait
pas à l’avance ce qui est renforçateur pour quelqu’un. On le découvre après
coup, en comptant. Un professionnel qui affirme « les félicitations, ça marche
avec lui » sans avoir compté énonce une croyance, pas une donnée.</p>

${BOUCLE}

${G.alerte(
  'Le renforçateur social n’est pas universel, et le supposer fait des dégâts',
  `<p>Les félicitations à voix haute, le contact visuel appuyé, la main sur
l’épaule, l’applaudissement du groupe : ce sont des renforçateurs puissants pour
beaucoup de gens, et des <strong>situations franchement désagréables</strong>
pour d’autres, notamment pour des personnes autistes.</p>
<p>Quand c’est le cas, l’effet observé est l’inverse de celui recherché : le
comportement diminue, et l’équipe conclut que « le renforcement ne marche pas
avec lui ». Ce qui ne marchait pas, c’était le choix du renforçateur.</p>
<p><strong>On teste, on ne suppose pas.</strong> Le module 3 fait établir une
liste de préférences avant de choisir quoi que ce soit.</p>`,
)}

<h3 style="${G.H3}">3. Les trois réglages, par ordre d’importance</h3>

<p>Un dispositif de renforcement tient sur trois réglages. Quand il échoue,
c’est presque toujours l’un des trois, et presque jamais le contenu de la
récompense — qui est pourtant ce qu’on discute en réunion.</p>

<p><strong>Le délai.</strong> C’est le premier, et de loin. Ce qui arrive dans
les trois secondes après un comportement lui est attribué ; ce qui arrive dix
minutes plus tard est attribué à autre chose, ou à rien.</p>

${DELAI}

<p><strong>Le critère.</strong> C’est le niveau à partir duquel on remarque.
S’il est trop haut, le comportement n’apparaît jamais et rien ne se déclenche.
La règle pratique : réglez-le de façon à ce que la personne réussisse
<strong>au moins une fois par jour dès le premier jour</strong>. Un dispositif
qui ne se déclenche pas la première semaine est déjà mort.</p>

<p><strong>La fréquence.</strong> Au début, chaque fois. C’est la phase
d’installation, elle est courte et elle est intense. On espace ensuite, et le
module 4 explique comment — trop tôt, tout s’effondre ; jamais, le dispositif
devient un dû et il ne veut plus rien dire.</p>

${CROYANCES}

<h3 style="${G.H3}">4. Les quatre situations où l’on ne pose pas de dispositif</h3>

<p>Ce paragraphe est le plus important du module. Il ne s’agit pas de finesse
pédagogique mais de limites, et elles tiennent quel que soit le service, le
public, ou l’urgence.</p>

<p><strong>1. Quand ce qui est en jeu est un besoin fondamental.</strong> Le
repas, la boisson, le sommeil, les soins, l’hygiène, l’affection, le fait de
sortir, le lien avec la famille et <strong>le moyen de communication</strong> ne
sont jamais des récompenses. Ils ne se méritent pas. Un dispositif qui les
conditionne n’est pas un dispositif de renforcement, c’est une privation, et
elle est illégitime même quand elle est efficace.</p>

<p><strong>2. Quand le comportement visé ne sert qu’à l’adulte.</strong> Rester
assis quarante minutes, ne pas se balancer, ne pas parler de son sujet
d’intérêt : demandez-vous à qui cela coûte réellement. Si la réponse est
« à l’équipe », le dispositif n’a rien à faire là. Le module 3 fait écrire cette
colonne avant toute autre.</p>

<p><strong>3. Quand le comportement gênant n’a pas été compris.</strong>
Renforcer le calme sans savoir ce que la crise obtenait, c’est travailler à
côté. Passez d’abord par « Les quatre fonctions d’un comportement ».</p>

<p><strong>4. Quand la personne n’a pas d’autre moyen.</strong> Renforcer le
fait de « ne pas crier » chez quelqu’un qui n’a que le cri pour se faire
comprendre, c’est lui demander de se taire. Il faut d’abord enseigner le moyen
de remplacement.</p>`,
  aRetenir: `Est renforçateur <strong>ce qui rend un comportement plus
fréquent</strong>, et cela se constate après coup, en comptant. Trois réglages
décident du résultat, dans cet ordre : le délai, le critère, la fréquence. Et on
ne conditionne jamais un besoin fondamental, quel que soit le résultat espéré.`,
  exercice: {
    nom: 'Le tri en deux colonnes',
    duree: '10 minutes, sur papier',
    quoi: 'Vérifier que ce que vous avez en tête relève bien de ce parcours, avant d’y passer dix jours.',
    etapes: [
      'Écrivez les trois comportements que vous aimeriez voir plus souvent chez une personne que vous accompagnez. Formulez-les à la forme positive et observable : « demande de l’aide en levant la main », pas « est moins passif ».',
      'Pour chacun, répondez par oui ou non : <strong>est-il déjà apparu au moins une fois cette semaine&nbsp;?</strong> Si c’est non, sortez-le de la liste et notez vers quel parcours il renvoie.',
      'Pour ceux qui restent, répondez à la seconde question : <strong>à qui ce comportement sert-il&nbsp;?</strong> Écrivez la réponse en toutes lettres, pas dans votre tête.',
      'Rayez tout comportement dont la réponse est « à moi », « à l’équipe » ou « au groupe ». Ce n’est pas une coquetterie éthique : un dispositif qui sert l’adulte se retourne toujours, parce que la personne le sent.',
    ],
    reussi:
      'Il vous reste au moins un comportement qui existe déjà, qui est formulé de façon observable, et dont vous pouvez dire à qui il profite sans hésiter.',
  },
  carnet: {
    intro:
      'Trois lignes à garder. Elles serviront telles quelles au module 3, et elles évitent de recommencer le tri quand la fiche sera à remplir.',
    lignes: [
      'Le comportement retenu, écrit à la forme positive et observable.',
      'Le nombre de fois où il est apparu cette semaine, de mémoire. Ce chiffre approximatif deviendra le point de comparaison.',
      'La phrase « ce comportement sert d’abord à… », complétée.',
    ],
  },
  vigilance: [
    'Un comportement formulé en négatif ne se renforce pas. « Ne pas se lever » n’est pas un comportement, c’est une absence : on ne peut pas remarquer une absence dans les trois secondes. Cherchez ce que la personne fait quand elle ne se lève pas, et renforcez ça.',
    'Attention au mot « motivation ». Il ferme la réflexion : dire qu’une personne « n’est pas motivée » revient à placer le problème hors de portée. Le parcours n’utilise pas ce mot et regarde à la place ce qui suit le comportement.',
    'Un renforçateur perd son effet quand la personne en a eu son content. Le bonbon du matin ne vaut plus rien à onze heures. C’est normal, ce n’est pas un échec du dispositif, et c’est une raison de plus d’avoir une liste plutôt qu’un seul renforçateur.',
  ],
  annexes: 'la grille de relevé à dix jours, la liste de préférences à faire remplir, et l’affiche des quatre situations où l’on ne pose pas de dispositif.',
  quiz: {
    questions: [
      {
        enonce: 'Un professionnel félicite chaleureusement un jeune chaque fois qu’il range son matériel. Trois semaines plus tard, il range moins souvent qu’avant. Que peut-on en conclure&nbsp;?',
        options: [
          'Le jeune manque de motivation.',
          'Les félicitations ne sont pas un renforçateur pour lui, et pourraient même être désagréables.',
          'Il faut féliciter plus fort et plus souvent.',
          'Le renforcement ne fonctionne pas sur les adolescents.',
        ],
        bonne: 1,
        pourquoi:
          'Un renforçateur se définit par son EFFET : ce qui augmente un comportement. Ici le comportement diminue, donc ce n’est pas un renforçateur pour cette personne — et les félicitations à voix haute sont franchement désagréables pour une partie des gens. La réponse A place le problème hors de portée, la C aggrave, et la D transforme une observation sur une personne en règle générale.',
      },
      {
        enonce: 'Parmi ces trois réglages, lequel regarder EN PREMIER quand un dispositif ne produit rien&nbsp;?',
        options: ['Le contenu de la récompense.', 'Le critère.', 'Le délai.', 'La durée totale du dispositif.'],
        bonne: 2,
        pourquoi:
          'Le délai d’abord, toujours. Au-delà de trente secondes, le lien entre le comportement et ce qui suit se défait, et corriger la récompense ou le critère ne sert plus à rien. C’est l’ordre de l’arbre du module 3, et le respecter fait gagner des semaines.',
      },
      {
        enonce: 'Une équipe propose de conditionner l’appel hebdomadaire à la famille au fait que la personne participe aux ateliers. Que faire&nbsp;?',
        options: [
          'Accepter si l’équipe est unanime.',
          'Accepter en réduisant à un appel sur deux.',
          'Refuser : le lien avec la famille est un droit, pas une récompense.',
          'Accepter à titre d’essai sur deux semaines.',
        ],
        bonne: 2,
        pourquoi:
          'C’est la première des quatre situations où l’on ne pose pas de dispositif. Le lien familial, comme le repas, les soins, la sortie et le moyen de communication, ne se mérite pas. Un dispositif qui le conditionne est une privation, et elle reste illégitime même si elle « marche » — l’unanimité de l’équipe ou la durée d’essai n’y changent rien.',
      },
      {
        enonce: 'Un enfant n’a jamais demandé d’aide autrement qu’en criant. On veut qu’il lève la main. Ce parcours convient-il&nbsp;?',
        options: [
          'Oui, il suffit de renforcer la main levée.',
          'Non : le comportement n’existe pas encore, il faut d’abord l’enseigner.',
          'Oui, en renforçant l’absence de cri.',
          'Oui, si on met un renforçateur assez fort.',
        ],
        bonne: 1,
        pourquoi:
          'On ne peut renforcer que ce qui existe déjà, même rarement. Ici le comportement n’est jamais apparu : il relève de « Apprendre à demander plutôt qu’à crier ». La réponse C est fausse pour une raison de plus — une absence n’est pas un comportement, elle ne se remarque pas dans les trois secondes.',
      },
      {
        enonce: 'Quelle formulation peut entrer telle quelle dans une fiche de renforcement&nbsp;?',
        options: [
          '« Être moins agité pendant l’atelier. »',
          '« Faire des efforts. »',
          '« Poser son plateau sur le chariot en sortant. »',
          '« Ne pas déranger les autres. »',
        ],
        bonne: 2,
        pourquoi:
          'Un comportement doit être observable et formulé positivement : deux personnes qui regardent la même scène doivent compter pareil. A, B et D décrivent des absences ou des impressions — on ne peut ni les compter, ni les remarquer au moment où elles se produisent.',
      },
    ],
  },
  avant: [
    'Vous pouvez énoncer la définition d’un renforçateur sans employer le mot « plaisir ».',
    'Vous avez au moins un comportement retenu, écrit à la forme positive, et vous savez à qui il sert.',
    'Vous pouvez citer les quatre situations où un dispositif ne se pose pas, et dire laquelle concerne le moyen de communication.',
  ],
};

/* ── MODULE 2 ────────────────────────────────────────────────────────────── */

const M2 = {
  reperes: {
    minutes: 10,
    prerequis: 'Le module 1, et le comportement retenu à l’exercice.',
    evaluation: 'Vous devez pouvoir situer les quatre erreurs de la scène sur la figure 3 et la figure 4.',
  },
  objectifs: [
    'Repérer, dans un dispositif réel, les quatre erreurs qui l’ont fait échouer.',
    'Expliquer pourquoi le retrait d’un point acquis détruit plus que le point n’avait construit.',
    'Reformuler un dispositif effondré en corrigeant un seul réglage à la fois.',
  ],
  corps: `<h3 style="${G.H3}">1. La scène</h3>

<p>Un service d’accueil de jour, neuf adultes. Malik, 27 ans, participe aux
ateliers mais quitte la salle plusieurs fois par matinée, parfois pour dix
minutes. L’équipe veut le voir rester davantage. Un tableau est posé un lundi :
une case par demi-journée, une gommette quand il « reste jusqu’au bout », et
au bout de dix gommettes, une sortie au café.</p>

<p>Le mercredi de la deuxième semaine, le tableau n’a que trois gommettes. Un
professionnel en retire une après une matinée difficile. Le vendredi, Malik
arrache le tableau du mur. L’équipe conclut en réunion que « le renforcement ne
fonctionne pas avec lui ».</p>

${G.exemple(
  'Ce que le relevé aurait montré, si quelqu’un l’avait tenu',
  `<p>Malik est resté jusqu’au bout <strong>trois fois en neuf jours</strong>. Il
est resté plus de vingt minutes <strong>seize fois</strong>. Le dispositif n’a
donc rien pu renforcer : il ne se déclenchait presque jamais, alors qu’il se
passait, chaque jour, quelque chose qui méritait d’être remarqué.</p>`,
)}

<h3 style="${G.H3}">2. Les quatre erreurs, dans l’ordre où elles coûtent</h3>

<p><strong>Le critère était trop haut.</strong> « Rester jusqu’au bout » était
hors de portée dans l’état actuel. Un critère à quinze minutes se serait
déclenché seize fois en neuf jours au lieu de trois. La règle du module 1 le
disait : réglez pour que ça se déclenche dès le premier jour.</p>

<p><strong>Le délai était de plusieurs jours.</strong> Entre le comportement et
le café, il y avait dix gommettes, donc au rythme observé plusieurs semaines.
Sur la figure 3, on est en bas de l’échelle : aucun effet d’apprentissage.</p>

<p><strong>Le renforçateur n’avait pas été vérifié.</strong> Personne n’a
demandé à Malik ce qu’il aurait aimé. Le café a été choisi par l’équipe, en
réunion, sans lui.</p>

<p><strong>Une gommette acquise a été retirée.</strong> C’est la quatrième, et
c’est celle qui a mis fin au dispositif.</p>

${G.alerte(
  'On ne retire jamais ce qui a été gagné',
  `<p>Le retrait d’un point, d’une gommette ou d’un jeton déjà obtenu paraît
logique — « il l’a perdu par son comportement » — et il est ruineux, pour trois
raisons qui se cumulent.</p>
<p><strong>Il transforme le dispositif en punition.</strong> Ce qui devait
signaler « voilà ce qui va » devient un compteur de fautes, et la personne
apprend à le fuir plutôt qu’à le remplir.</p>
<p><strong>Il rend le dispositif imprévisible.</strong> Un acquis qui peut
disparaître n’est plus un acquis. L’effort n’a plus de rapport fiable avec le
résultat, et c’est exactement la condition dans laquelle on cesse d’essayer.</p>
<p><strong>Il détruit d’un coup ce qui s’était construit lentement.</strong>
Neuf jours de crédit ont disparu en une seconde, et le geste de Malik le
vendredi n’est pas une crise&nbsp;: c’est une conclusion.</p>
<p>Si un comportement grave doit être traité, il se traite ailleurs, avec ses
propres outils. Jamais en reprenant ce qui a été gagné.</p>`,
)}

<h3 style="${G.H3}">3. Ce que l’équipe a fait ensuite, et qui a marché</h3>

<p>Le dispositif a été repris trois semaines plus tard, avec un seul réglage
changé à la fois — c’est la méthode, et elle demande de la patience.</p>

<p>Le critère est passé à <strong>quinze minutes</strong>, mesurées. Le
renforçateur a été choisi par Malik dans une liste de six propositions
présentées en images : il a désigné la musique, pas le café. Et surtout, la
conséquence est devenue immédiate — le professionnel vient dire, dans les trois
secondes après la quinzième minute, ce qu’il vient de voir, en nommant le
comportement : « tu es resté un quart d’heure sur l’atelier ».</p>

<p>Rien n’a été retiré à aucun moment. Au bout de dix jours, la colonne
« apparu » était passée de trois à onze.</p>

<h3 style="${G.H3}">4. Et à la maison</h3>

<p>La même scène se joue autour des devoirs, du couvert, du réveil. Le tableau
affiché sur le frigo en septembre, abandonné en octobre, échoue presque toujours
pour les deux mêmes raisons : la récompense est lointaine — le week-end, le
cadeau de fin de mois — et le critère est fixé sur la version parfaite du
comportement.</p>

<p>Le correctif est le même : abaissez jusqu’à ce que cela se déclenche chaque
jour, et remarquez dans les trois secondes, à voix normale, en nommant ce que
vous voyez. Et n’effacez jamais une croix déjà mise, même le soir où tout s’est
mal passé.</p>`,
  aRetenir: `Un dispositif qui ne se déclenche presque jamais n’a rien renforcé
du tout : avant de conclure que « ça ne marche pas », regardez combien de fois
il s’est déclenché. Et <strong>ce qui est gagné est gagné</strong> — le retrait
d’un acquis met fin au dispositif, quelle qu’en soit la raison.`,
  exercice: {
    nom: 'La dissection',
    duree: '12 minutes',
    quoi: 'Appliquer la grille des quatre erreurs à un dispositif que vous avez vu échouer.',
    etapes: [
      'Repensez à un tableau, un système de points ou une récompense mis en place autour de vous, et qui s’est éteint. Décrivez-le en trois lignes.',
      'Quel était le critère&nbsp;? Estimez combien de fois par semaine il pouvait se déclencher, d’après ce que faisait réellement la personne.',
      'Quel était le délai entre le comportement et la conséquence&nbsp;? Placez-le sur l’échelle de la figure 3.',
      'Qui avait choisi la récompense&nbsp;? Et enfin : a-t-on retiré, à un moment, quelque chose qui avait été gagné&nbsp;?',
      'Écrivez le seul réglage que vous changeriez en premier si le dispositif reprenait demain.',
    ],
    reussi:
      'Vous avez nommé les quatre réglages du dispositif observé, et vous pouvez dire lequel corriger d’abord sans hésiter entre deux.',
  },
  carnet: {
    intro:
      'Deux lignes, qui serviront de garde-fou au module 3 : on répète volontiers l’erreur qu’on a vu faire.',
    lignes: [
      'L’erreur qui revient le plus souvent autour de vous, parmi les quatre.',
      'La phrase que vous direz à l’équipe le jour où quelqu’un proposera de retirer un point.',
    ],
  },
  vigilance: [
    'Un dispositif qui s’effondre est presque toujours accusé à la place du réglage. Notez la phrase « ça ne marche pas avec lui » quand vous l’entendez : elle signale neuf fois sur dix un critère trop haut.',
    'Changer deux réglages en même temps rend le résultat illisible. Si vous corrigez le délai et la récompense la même semaine, vous ne saurez jamais lequel des deux a agi.',
    'Le fait de laisser la personne choisir son renforçateur n’est pas seulement plus efficace : c’est aussi ce qui distingue un accompagnement d’un dressage. Quand le choix n’est pas verbal, il se fait en images, en objets, ou en observant vers quoi la personne va d’elle-même.',
  ],
  annexes: 'la fiche des quatre erreurs, et la liste de préférences avec ses trois modes de passation.',
  quiz: {
    questions: [
      {
        enonce: 'Le tableau de Malik s’est déclenché trois fois en neuf jours. Quelle est la première conclusion à en tirer&nbsp;?',
        options: [
          'Malik n’est pas réceptif au renforcement.',
          'Le critère était trop haut : le dispositif n’a presque jamais pu agir.',
          'La récompense n’était pas assez attractive.',
          'Neuf jours, c’est trop court pour juger.',
        ],
        bonne: 1,
        pourquoi:
          'Un dispositif qui ne se déclenche presque pas n’a rien pu renforcer : il n’y a donc rien à conclure sur la personne. Le critère « rester jusqu’au bout » était hors de portée alors qu’un critère à quinze minutes se serait déclenché seize fois.',
      },
      {
        enonce: 'Pourquoi le retrait d’une gommette déjà acquise est-il plus grave qu’une gommette jamais donnée&nbsp;?',
        options: [
          'Parce que cela fait de la peine.',
          'Parce que cela rend l’acquis incertain : l’effort n’a plus de rapport fiable avec le résultat.',
          'Parce que cela complique le comptage.',
          'Parce que la règle n’avait pas été annoncée.',
        ],
        bonne: 1,
        pourquoi:
          'Trois effets se cumulent : le dispositif devient un compteur de fautes, l’acquis cesse d’être un acquis, et des jours de crédit disparaissent d’un coup. Quand l’effort ne prédit plus le résultat, on cesse d’essayer — c’est ce que dit le geste de Malik le vendredi.',
      },
      {
        enonce: 'L’équipe reprend le dispositif. Combien de réglages change-t-elle en même temps&nbsp;?',
        options: ['Tous, pour repartir à neuf.', 'Deux, pour aller plus vite.', 'Un seul.', 'Aucun, on attend encore.'],
        bonne: 2,
        pourquoi:
          'Un seul à la fois, sinon le résultat est illisible : si on corrige le délai et la récompense la même semaine, on ne saura jamais lequel des deux a agi, et on gardera peut-être le mauvais.',
      },
      {
        enonce: 'Le renforçateur retenu pour Malik a finalement été la musique, pas la sortie au café. Qu’est-ce qui a changé la décision&nbsp;?',
        options: [
          'Le budget du service.',
          'On a présenté six propositions en images et on a regardé ce qu’il désignait.',
          'L’avis du psychologue.',
          'La sortie au café était trop compliquée à organiser.',
        ],
        bonne: 1,
        pourquoi:
          'Le café avait été choisi par l’équipe, en réunion, sans lui — c’est la troisième erreur. Laisser la personne choisir n’est pas seulement plus efficace : c’est ce qui distingue un accompagnement d’un dressage. Quand le choix n’est pas verbal, il se fait en images ou en objets.',
      },
      {
        enonce: 'À la maison, un tableau posé en septembre est abandonné en octobre. Les deux causes les plus fréquentes sont&nbsp;:',
        options: [
          'Le manque de constance des parents et la fatigue de l’enfant.',
          'Une récompense lointaine, et un critère fixé sur la version parfaite du comportement.',
          'Un tableau trop petit et mal placé.',
          'L’absence de sanction en cas d’échec.',
        ],
        bonne: 1,
        pourquoi:
          'Ce sont les deux mêmes erreurs qu’en institution : le délai et le critère. La réponse A accuse les personnes plutôt que le réglage — c’est le réflexe que ce module cherche justement à défaire.',
      },
    ],
  },
  avant: [
    'Vous pouvez expliquer, en une phrase, pourquoi retirer une gommette acquise coûte plus cher que de ne jamais en avoir donné.',
    'Vous avez disséqué un dispositif réel et nommé ses quatre réglages.',
    'Vous savez pourquoi on ne corrige qu’un seul réglage à la fois.',
  ],
};

/* ── MODULE 3 ────────────────────────────────────────────────────────────── */

const M3 = {
  reperes: {
    minutes: 12,
    prerequis: 'Les modules 1 et 2, et le comportement retenu.',
    evaluation:
      'Vous produisez une fiche de renforcement complète, puis vous tenez dix jours de relevé. Le module 4 se lit avec ce relevé sous les yeux.',
    apres:
      'dix jours de relevé, deux chiffres par jour. Le module 4 n’a aucun intérêt sans eux.',
  },
  objectifs: [
    'Établir une liste de préférences avec la personne, et non à sa place.',
    'Régler le critère de façon à ce que le dispositif se déclenche dès le premier jour.',
    'Écrire la phrase de remarque, et savoir pourquoi elle nomme le comportement.',
    'Tenir un relevé à deux colonnes pendant dix jours.',
  ],
  corps: `<h3 style="${G.H3}">1. La liste de préférences, d’abord</h3>

<p>Avant de choisir quoi que ce soit, on demande. Ce n’est pas une politesse :
c’est ce qui évite l’erreur numéro trois du module 2, et c’est la seule façon de
découvrir qu’une personne préfère la musique au café.</p>

<p>Trois modes de passation, selon la personne. <strong>Par la parole</strong>,
en proposant six possibilités concrètes et en demandant de les classer.
<strong>En images ou en objets</strong>, en présentant deux propositions à la
fois et en notant vers laquelle la main va — on refait le tour plusieurs fois,
et un classement se dégage. <strong>Par l’observation</strong> enfin, en notant
pendant trois jours ce que la personne fait quand elle a le choix : c’est la
méthode la plus lente et la plus fiable, et la seule possible quand rien
d’autre ne l’est.</p>

${G.alerte(
  'Ce qui ne peut jamais figurer sur la liste',
  `<p>Aucun besoin fondamental n’entre dans une liste de préférences : ni le
repas, ni la boisson, ni le repos, ni les soins, ni l’affection, ni le fait de
sortir, ni le contact avec la famille, ni le moyen de communication.</p>
<p>Ce sont des droits. Les faire figurer comme récompense, c’est décider qu’ils
peuvent être suspendus — et cela reste vrai même si la personne les désigne
elle-même comme ce qu’elle préfère. C’est précisément là qu’un outil
comportemental devient un moyen de contrainte, et c’est la limite que ce
parcours ne franchit pas.</p>`,
)}

<h3 style="${G.H3}">2. Régler le critère par le bas</h3>

<p>Reprenez le comportement retenu et observez-le pendant deux jours sans rien
changer. Notez seulement à quel niveau il apparaît réellement : combien de
minutes, combien de fois, avec quelle aide. Puis fixez le critère
<strong>juste en dessous de ce que la personne fait déjà</strong>.</p>

<p>Cela paraît trop facile, et c’est exactement le but. Un dispositif doit
d’abord se déclencher, sinon il n’enseigne rien. On monte ensuite, par paliers,
et le module 4 dit quand.</p>

${G.exemple(
  'Trois critères réglés par le bas',
  `<p><strong>Malik&nbsp;:</strong> reste en moyenne 22 minutes → critère à
15&nbsp;minutes.</p>
<p><strong>Une enfant qui demande de l’aide en criant, et une fois sur dix en
levant la main&nbsp;:</strong> critère à « lève la main », même si la main est
levée après le cri.</p>
<p><strong>Un adolescent qui range son plateau une fois sur cinq&nbsp;:</strong>
critère à « pose le plateau sur le chariot », même si les couverts restent sur
la table.</p>`,
)}

<h3 style="${G.H3}">3. La phrase de remarque</h3>

<p>C’est l’outil central, il est gratuit, et il est presque toujours mal
employé. Une phrase de remarque efficace tient trois conditions : elle arrive
<strong>dans les trois secondes</strong>, elle <strong>nomme le comportement</strong>,
et elle se dit <strong>sur un ton normal</strong>.</p>

<p>« Bravo&nbsp;! » ne remplit qu’une condition sur trois : on ne sait pas ce
qui est salué. « Tu es resté un quart d’heure sur l’atelier » les remplit toutes.
La différence n’est pas cosmétique — c’est elle qui dit à la personne quel
comportement répéter.</p>

<p>Sur le ton : l’enthousiasme excessif est contre-productif avec beaucoup de
personnes, et franchement pénible pour certaines. Une voix normale, à hauteur de
la personne, sans public, marche mieux et se tient sur la durée.</p>

<h3 style="${G.H3}">4. Le relevé, deux colonnes et dix jours</h3>

<p>Deux chiffres par jour, pas un de plus. <strong>Combien de fois le
comportement est apparu</strong>, et <strong>combien de fois vous l’avez
remarqué</strong>. C’est l’écart entre les deux colonnes qui rend le relevé
utile : il mesure votre régularité, pas seulement le progrès de la personne.</p>

<p>Dix jours, parce qu’un comportement qui apparaît deux ou trois fois par jour
ne montre pas de tendance lisible avant une bonne semaine, et parce que les
premiers jours sont toujours atypiques.</p>

${ARBRE}`,
  aRetenir: `On règle le critère <strong>en dessous de ce que la personne fait
déjà</strong>, on choisit le renforçateur <strong>avec elle</strong>, et on
remarque <strong>dans les trois secondes en nommant le comportement</strong>.
Le relevé compte deux choses : ce qu’elle a fait, et ce que vous avez vu.`,
  exercice: {
    nom: 'La fiche de renforcement',
    duree: '20 minutes, puis dix jours de relevé',
    quoi: 'Produire le document qui tiendra le dispositif, et commencer à compter.',
    etapes: [
      'En haut : le comportement, à la forme positive et observable, et la phrase « il sert d’abord à… » complétée au module 1.',
      'La liste de préférences : six propositions, classées avec la personne, selon l’un des trois modes. Vérifiez qu’aucun besoin fondamental n’y figure.',
      'Le critère, chiffré, réglé sous le niveau observé pendant deux jours. Écrivez aussi le niveau observé, il servira de point de départ.',
      'La phrase de remarque, écrite mot pour mot. L’écrire évite de l’improviser, et permet à toute l’équipe de dire la même chose.',
      'La grille de relevé : dix lignes, deux colonnes. Recopiez-la à la main, affichez-la là où le comportement se produit.',
      'Prévenez l’équipe, ou la famille : un dispositif tenu par une seule personne sur trois ne produit rien de lisible.',
    ],
    reussi:
      'La fiche tient sur une page, le critère s’est déclenché dès le premier jour, et les deux colonnes du relevé sont remplies chaque soir.',
  },
  carnet: {
    intro:
      'La fiche elle-même est le livrable. Ajoutez-y ces deux éléments, qui serviront au module 4.',
    lignes: [
      'Le niveau observé pendant les deux jours d’observation, avant tout changement. C’est le point de comparaison, et sans lui le relevé ne se lit pas.',
      'La date du premier jour de relevé.',
    ],
  },
  vigilance: [
    'Si le dispositif ne s’est pas déclenché le premier jour, ne continuez pas dix jours pour le constater : abaissez le critère le soir même.',
    'La deuxième colonne du relevé est celle qu’on oublie, et c’est la plus instructive. Un écart important entre « apparu » et « remarqué » ne dit rien de la personne : il dit que le dispositif n’est pas tenu.',
    'Un dispositif se prévient, il ne se cache pas. La personne doit savoir ce qui est observé et pourquoi, dans des termes qu’elle comprend. Un relevé tenu à son insu n’a pas sa place dans un accompagnement.',
  ],
  annexes: 'la fiche de renforcement vierge, la grille de relevé à dix jours, et la liste de préférences avec ses trois modes de passation.',
  quiz: {
    questions: [
      {
        enonce: 'Une personne reste en moyenne 22 minutes sur l’atelier. À combien règle-t-on le critère&nbsp;?',
        options: ['À 30 minutes, pour la tirer vers le haut.', 'À 22 minutes, son niveau exact.', 'À 15 minutes.', 'À 45 minutes, l’objectif final.'],
        bonne: 2,
        pourquoi:
          'On règle JUSTE EN DESSOUS du niveau observé, pour que le dispositif se déclenche dès le premier jour. Un critère posé au niveau exact ne se déclenche qu’une fois sur deux ; posé au-dessus, jamais. On monte ensuite par paliers, et le module 4 dit quand.',
      },
      {
        enonce: 'Laquelle de ces phrases de remarque remplit les trois conditions&nbsp;?',
        options: [
          '« Bravo, c’est super&nbsp;! » lancé depuis l’autre bout de la salle.',
          '« Tu es resté un quart d’heure sur l’atelier », dit calmement dans les trois secondes.',
          '« Tu vois quand tu veux&nbsp;! »',
          '« On applaudit Malik&nbsp;! »',
        ],
        bonne: 1,
        pourquoi:
          'Les trois conditions sont : dans les trois secondes, nommer le comportement, ton normal. B les remplit toutes. A ne nomme rien, C est un reproche déguisé, et D ajoute un public — renforçateur pour certains, punition pour d’autres.',
      },
      {
        enonce: 'Que comptent les deux colonnes du relevé&nbsp;?',
        options: [
          'Les réussites et les échecs.',
          'Le comportement, et l’humeur de la personne.',
          'Combien de fois le comportement est apparu, et combien de fois vous l’avez remarqué.',
          'Le matin et l’après-midi.',
        ],
        bonne: 2,
        pourquoi:
          'La seconde colonne est celle qu’on oublie, et la plus instructive : un écart important ne dit rien de la personne, il dit que le dispositif n’est pas tenu. C’est votre régularité qu’elle mesure.',
      },
      {
        enonce: 'La personne désigne « aller voir ma mère » comme sa préférence numéro un. Que fait-on&nbsp;?',
        options: [
          'On le met en tête de la liste, puisque c’est son choix.',
          'On l’écarte de la liste : c’est un droit, pas une récompense.',
          'On le garde pour les très grandes réussites.',
          'On le remplace par un appel téléphonique.',
        ],
        bonne: 1,
        pourquoi:
          'Aucun besoin fondamental n’entre dans une liste de préférences, et cela reste vrai quand la personne le désigne elle-même. L’y faire figurer, c’est décider qu’il peut être suspendu. C’est exactement là qu’un outil comportemental devient un moyen de contrainte.',
      },
      {
        enonce: 'Le dispositif ne s’est pas déclenché du tout le premier jour. Que faites-vous&nbsp;?',
        options: [
          'Vous poursuivez les dix jours pour avoir des données complètes.',
          'Vous abaissez le critère le soir même.',
          'Vous changez de renforçateur.',
          'Vous en parlez à la prochaine réunion d’équipe.',
        ],
        bonne: 1,
        pourquoi:
          'Inutile d’attendre dix jours pour constater ce qu’on voit au premier : un dispositif qui ne se déclenche pas n’enseigne rien et use la patience de tout le monde. On abaisse tout de suite. Le renforçateur ne se change qu’après avoir vérifié le délai puis le critère.',
      },
    ],
  },
  avant: [
    'Votre fiche tient sur une page et le critère est chiffré.',
    'La liste de préférences a été établie avec la personne, et ne contient aucun besoin fondamental.',
    'Le relevé est commencé, et les deux colonnes sont remplies.',
  ],
  pause: {
    jours: 'dix jours',
    texte: `<p>Le module 4 se lit avec le relevé sous les yeux. Sans lui, il n’y
a rien à lire, rien à décider, et l’espacement du module 4 se ferait à
l’aveugle.</p>
<p>Pendant ces dix jours, vous n’avez qu’une chose à faire : remarquer dans les
trois secondes, et remplir deux cases le soir. Si vous sautez un jour, notez-le
comme tel plutôt que de l’estimer&nbsp;— un trou honnête se lit, une estimation
fausse le relevé entier.</p>`,
  },
};

/* ── MODULE 4 ────────────────────────────────────────────────────────────── */

const M4 = {
  reperes: {
    minutes: 12,
    prerequis: 'Les dix jours de relevé du module 3.',
    evaluation:
      'Vous produisez une phrase de bilan contenant deux chiffres et une durée, et un plan d’espacement daté.',
  },
  objectifs: [
    'Lire un relevé à deux colonnes et distinguer un progrès d’une variation ordinaire.',
    'Décider quel réglage corriger en premier quand la courbe ne monte pas.',
    'Espacer le renforcement par paliers, sans que le comportement s’effondre.',
    'Écrire une phrase de bilan transmissible à une équipe ou à une famille.',
  ],
  corps: `<h3 style="${G.H3}">1. Lire les deux colonnes</h3>

<p>Commencez par la deuxième colonne, « remarqué ». Si elle est très inférieure
à la première, arrêtez là : le dispositif n’a pas été tenu, et le relevé ne dit
rien de la personne. Ce n’est pas un échec, c’est une information sur
l’organisation — et le correctif est de réduire l’ambition, pas d’insister.</p>

<p>Si les deux colonnes sont proches, comparez la première au niveau observé
avant de commencer, celui que vous avez noté au module 3. Trois cas se
présentent.</p>

<p><strong>La colonne monte régulièrement.</strong> Le dispositif fait ce qu’on
lui demande. Passez à l’espacement, section 3.</p>

<p><strong>Elle stagne.</strong> Reprenez l’arbre du module 3, dans l’ordre :
le délai d’abord, le renforçateur ensuite, le critère en dernier. Changez un
seul réglage et refaites dix jours.</p>

<p><strong>Elle monte puis retombe.</strong> C’est le cas le plus fréquent, et
il a presque toujours la même cause : le renforçateur a perdu son effet à force
d’être donné. Changez-le en reprenant la liste de préférences, et profitez-en
pour espacer.</p>

${G.alerte(
  'Trois jours ne font pas une tendance',
  `<p>Une chute sur deux ou trois jours n’est pas un effondrement : c’est le
bruit normal d’un comportement humain, et il y en a toujours. Une maladie, une
absence, un changement d’emploi du temps, un week-end suffisent à faire plonger
une colonne.</p>
<p>On ne modifie jamais un dispositif sur trois jours. On regarde la deuxième
semaine par rapport à la première, et on décide sur cet écart.</p>`,
)}

<h3 style="${G.H3}">2. Monter le critère, un palier à la fois</h3>

<p>Quand le comportement apparaît chaque jour au niveau du critère, on peut
monter — d’un cran, pas de deux. Malik est resté quinze minutes tous les jours
pendant une semaine : le critère passe à vingt, pas à quarante.</p>

<p>Et on garde l’ancien niveau comme filet : les jours difficiles, on remarque
quand même les quinze minutes. Un dispositif qui ne récompense plus jamais
l’ancien niveau enseigne surtout que les efforts d’hier ne comptent plus.</p>

<h3 style="${G.H3}">3. Espacer sans tout perdre</h3>

<p>C’est l’étape que presque personne ne fait, et c’est elle qui décide si le
travail des dix jours tient dans six mois. On n’arrête jamais net : on passe du
continu à l’irrégulier, par paliers.</p>

${ESTOMPAGE}

<p>Le point contre-intuitif mérite d’être dit clairement : <strong>un
comportement renforcé irrégulièrement résiste beaucoup mieux</strong> qu’un
comportement renforcé à chaque fois. Quand la conséquence n’est pas certaine, on
continue plus longtemps — c’est ce qui rend les dispositifs irréguliers si
solides, et c’est aussi, exactement, ce qui rend certains comportements gênants
si difficiles à faire disparaître.</p>

<p>La dernière colonne de la frise n’est pas vide : on ne retire jamais tout.
Il reste la remarque de temps en temps, et surtout ce que la situation apporte
d’elle-même — l’atelier terminé, le travail rendu, la personne à qui on a réussi
à demander quelque chose.</p>

<h3 style="${G.H3}">4. La phrase de bilan</h3>

<p>Une phrase utile en réunion, en synthèse ou devant une famille contient
<strong>deux chiffres et une durée</strong>. Elle est comparable au bilan
suivant, et elle montre un travail au lieu d’une impression.</p>

${G.exemple(
  'Deux façons de dire la même chose',
  `<p><strong>Sans chiffres&nbsp;:</strong> « Malik s’est bien investi ce mois-ci,
il participe davantage aux ateliers. »</p>
<p><strong>Avec&nbsp;:</strong> « Sur dix jours, Malik est resté au moins quinze
minutes sur l’atelier onze fois, contre trois fois sur la période précédente.
Le critère passe à vingt minutes à partir du 15. »</p>
<p>La seconde se vérifie, se compare, et se reprend par le collègue qui prendra
la suite.</p>`,
)}

<h3 style="${G.H3}">5. Et à la maison</h3>

<p>Le même relevé tient sur un coin de frigo, et la même règle s’applique :
on remarque dans les trois secondes, on ne retire jamais ce qui est acquis, et
on espace quand le comportement est là tous les jours.</p>

<p>Une seule différence, et elle compte : à la maison, le renforçateur le plus
disponible est l’attention de l’adulte, et elle est gratuite. Le dispositif qui
tient le mieux dans une famille n’est presque jamais un tableau de points,
c’est une habitude — trente secondes d’attention, à chaud, sur ce qui vient
d’être fait.</p>`,
  aRetenir: `On lit d’abord la colonne « remarqué » : elle dit si le dispositif
a été tenu. On ne décide jamais sur trois jours. Et quand ça marche, on
<strong>espace au lieu d’arrêter</strong> — c’est l’irrégularité qui rend un
comportement solide.`,
  exercice: {
    nom: 'La lecture et le plan d’espacement',
    duree: '15 minutes, relevé sous les yeux',
    quoi: 'Décider de la suite avec les chiffres, et la dater.',
    etapes: [
      'Comparez la moyenne des cinq derniers jours à celle des cinq premiers. Écrivez les deux chiffres.',
      'Regardez l’écart entre les colonnes « apparu » et « remarqué ». S’il dépasse la moitié, votre premier chantier est l’organisation, pas le réglage.',
      'Tranchez entre les trois cas de la section 1, et notez la décision en une ligne.',
      'Si vous espacez : écrivez à quelle date vous passez à « une fois sur deux », et à quelle date vous réévaluerez.',
      'Écrivez la phrase de bilan, avec ses deux chiffres et sa durée.',
    ],
    reussi:
      'Vous avez une décision datée, et une phrase de bilan qu’un collègue pourrait reprendre sans vous demander d’explication.',
  },
  carnet: {
    intro:
      'Trois lignes, qui referment le parcours et qui se reprennent telles quelles dans un écrit professionnel.',
    lignes: [
      'La phrase de bilan, avec ses deux chiffres et sa durée.',
      'La date du passage au palier suivant, et celle de la réévaluation.',
      'Ce que vous feriez différemment si vous recommenciez demain, en une phrase.',
    ],
  },
  vigilance: [
    'Un dispositif qui a marché ne se démonte pas parce qu’il a marché. C’est la fin la plus fréquente, et la plus bête : on cesse de remarquer, le comportement retombe, et on conclut que le progrès était factice.',
    'Si la personne demande elle-même à arrêter le dispositif, c’est une donnée, pas un caprice. Écoutez ce qu’elle en dit : la plupart des adolescents et des adultes trouvent les tableaux infantilisants, et ils ont souvent raison. La remarque nommée, elle, ne l’est jamais.',
    'Ne transportez pas un dispositif d’une personne à l’autre. Le critère, le renforçateur et le délai ont été réglés pour quelqu’un ; recopiés tels quels, ils ne renforcent rien.',
  ],
  annexes: 'la fiche de lecture du relevé, la frise d’espacement, et le modèle de phrase de bilan.',
  quiz: {
    questions: [
      {
        enonce: 'Le relevé montre « apparu » 40 fois et « remarqué » 9 fois. Que conclure&nbsp;?',
        options: [
          'Le comportement progresse bien.',
          'Le renforçateur a perdu son effet.',
          'Le dispositif n’a pas été tenu : le relevé ne dit rien de la personne.',
          'Le critère est trop bas.',
        ],
        bonne: 2,
        pourquoi:
          'On lit toujours la deuxième colonne en premier. Un écart pareil signale un problème d’organisation, pas de personne : le correctif est de réduire l’ambition et de répartir sur l’équipe, surtout pas de conclure quoi que ce soit sur la personne.',
      },
      {
        enonce: 'La courbe monte pendant huit jours, puis chute les deux derniers. Que faites-vous&nbsp;?',
        options: [
          'Vous changez le renforçateur immédiatement.',
          'Vous abaissez le critère.',
          'Vous ne changez rien et vous comparez semaine à semaine.',
          'Vous arrêtez le dispositif.',
        ],
        bonne: 2,
        pourquoi:
          'Trois jours ne font pas une tendance. Une maladie, une absence, un changement d’emploi du temps suffisent à faire plonger une colonne. On décide sur l’écart entre la deuxième semaine et la première, jamais sur la fin du relevé.',
      },
      {
        enonce: 'Le comportement est acquis, il apparaît tous les jours. Que fait-on du renforcement&nbsp;?',
        options: [
          'On l’arrête, l’objectif est atteint.',
          'On l’espace par paliers, jusqu’à un rythme irrégulier.',
          'On le maintient identique indéfiniment.',
          'On le double pour consolider.',
        ],
        bonne: 1,
        pourquoi:
          'On n’arrête jamais net. Un comportement renforcé irrégulièrement résiste bien mieux qu’un comportement renforcé à chaque fois : quand la conséquence n’est pas certaine, on continue plus longtemps. Arrêter d’un coup est la fin la plus fréquente et la plus bête des dispositifs qui marchaient.',
      },
      {
        enonce: 'On monte le critère de quinze à vingt minutes. Que devient l’ancien niveau&nbsp;?',
        options: [
          'Il ne compte plus, c’est le principe du palier.',
          'On continue de le remarquer les jours difficiles.',
          'On le sanctionne, pour marquer la progression.',
          'On revient à quinze une semaine sur deux.',
        ],
        bonne: 1,
        pourquoi:
          'On garde l’ancien niveau comme filet. Un dispositif qui cesse brutalement de reconnaître ce qui était valorisé hier enseigne surtout que les efforts passés ne comptent plus, et c’est le meilleur moyen de faire retomber la courbe.',
      },
      {
        enonce: 'Laquelle de ces phrases de bilan est utilisable en réunion&nbsp;?',
        options: [
          '« Il s’est bien investi ce mois-ci. »',
          '« On sent une nette amélioration de sa participation. »',
          '« Sur dix jours, il est resté au moins quinze minutes onze fois, contre trois sur la période précédente. »',
          '« Le dispositif porte ses fruits. »',
        ],
        bonne: 2,
        pourquoi:
          'Une phrase de bilan utile contient deux chiffres et une durée : elle se vérifie, elle se compare au bilan suivant, et le collègue qui prendra la suite peut la reprendre sans vous demander d’explication. Les trois autres sont des impressions.',
      },
    ],
  },
  avant: [
    'Vous avez comparé deux moyennes, pas deux impressions.',
    'Votre décision est datée, et ne porte que sur un seul réglage.',
    'Votre phrase de bilan contient deux chiffres et une durée.',
  ],
};

/* ── ANNEXES ─────────────────────────────────────────────────────────────── */

const ANNEXES =
  A.entete('Renforcer ce qui va') +
  A.fiche({
    numero: 1,
    titre: 'Les quatre situations où l’on ne pose pas de dispositif',
    quand: 'avant toute réunion où quelqu’un propose « un système de points ».',
    contenu:
      A.tableau(
        ['Situation', 'Pourquoi', 'Ce qu’on fait à la place'],
        [
          [
            'Un besoin fondamental est en jeu',
            'Repas, boisson, repos, soins, affection, sortie, lien familial, moyen de communication : ce sont des droits, pas des récompenses.',
            'On les retire du dispositif, sans exception et sans discussion.',
          ],
          [
            'Le comportement ne sert qu’à l’adulte',
            'Le dispositif devient un outil de docilité, et la personne le sent.',
            'On écrit à qui il sert. Si la réponse est « à l’équipe », on renonce.',
          ],
          [
            'Le comportement gênant n’a pas été compris',
            'On renforce à côté de ce qui se joue réellement.',
            'On passe par « Les quatre fonctions d’un comportement ».',
          ],
          [
            'La personne n’a pas d’autre moyen',
            'Renforcer « ne pas crier » sans alternative revient à demander le silence.',
            'On enseigne d’abord le moyen de remplacement.',
          ],
        ],
      ) +
      `<div style="${G.ALERTE}">
<p style="margin:0"><strong>Cette fiche s’affiche en salle d’équipe.</strong>
Elle sert le jour où quelqu’un propose, de bonne foi et pour aider, de
conditionner une sortie ou un appel à la famille.</p>
</div>`,
  }) +
  A.fiche({
    numero: 2,
    titre: 'La liste de préférences, et ses trois modes de passation',
    quand: 'au début du module 3, avant de choisir quoi que ce soit.',
    contenu: A.tableau(
      ['Mode', 'Comment', 'Quand le choisir'],
      [
        [
          'Par la parole',
          'Six propositions concrètes, à classer de la préférée à la dernière. On refait le classement une semaine plus tard.',
          'La personne s’exprime verbalement et le classement lui parle.',
        ],
        [
          'En images ou en objets',
          'Deux propositions présentées à la fois, on note vers laquelle la main va. On refait tous les couples, un ordre se dégage.',
          'Pas de langage verbal fiable, ou le classement abstrait ne parle pas.',
        ],
        [
          'Par l’observation',
          'Pendant trois jours, on note ce que la personne fait quand elle a le choix et rien à faire.',
          'Rien d’autre n’est possible. Méthode la plus lente et la plus fiable.',
        ],
      ],
    ),
  }) +
  A.fiche({
    numero: 3,
    titre: 'La grille de relevé à dix jours',
    quand: 'affichée là où le comportement se produit, dès le premier jour du module 3.',
    contenu:
      `<p>Recopiez-la à la main. Deux chiffres par jour, remplis le soir même :
une grille qu’on remplit de mémoire le dimanche ne vaut rien.</p>` +
      A.tableau(
        ['Jour', 'Apparu (combien de fois)', 'Remarqué (combien de fois)', 'Un mot s’il s’est passé quelque chose'],
        [
          ['1', '', '', ''],
          ['2', '', '', ''],
          ['3', '', '', ''],
          ['4', '', '', ''],
          ['5', '', '', ''],
          ['6', '', '', ''],
          ['7', '', '', ''],
          ['8', '', '', ''],
          ['9', '', '', ''],
          ['10', '', '', ''],
        ],
      ) +
      `<div style="${G.GRIS}">
<p style="margin:0"><strong>Niveau observé avant de commencer&nbsp;:</strong>
_______ . C’est la case la plus oubliée, et sans elle le relevé ne se compare à
rien.</p>
</div>`,
  }) +
  A.fiche({
    numero: 4,
    titre: 'La fiche de renforcement vierge',
    quand: 'à l’exercice du module 3. Une page, pas deux.',
    contenu: A.tableau(
      ['Rubrique', 'À écrire'],
      [
        ['Le comportement', 'À la forme positive et observable. « Lève la main pour demander », pas « est moins agité ».'],
        ['Il sert d’abord à', 'Complétez en toutes lettres. Si la réponse est « à l’équipe », on s’arrête.'],
        ['Niveau observé', 'Ce que la personne fait déjà, chiffré, mesuré sur deux jours.'],
        ['Critère retenu', 'Juste en dessous du niveau observé. Il doit se déclencher dès le premier jour.'],
        ['Renforçateur', 'Choisi avec la personne, dans la liste de préférences. Aucun besoin fondamental.'],
        ['Phrase de remarque', 'Écrite mot pour mot. Dans les trois secondes, nomme le comportement, ton normal.'],
        ['Qui tient le dispositif', 'Les noms. Un dispositif tenu par une personne sur trois ne produit rien de lisible.'],
        ['Date de début', 'Et date de relecture, dix jours plus tard.'],
      ],
    ),
  }) +
  A.fiche({
    numero: 5,
    titre: 'Lire le relevé, et décider',
    quand: 'au module 4, relevé sous les yeux.',
    contenu:
      A.tableau(
        ['Ce que montre le relevé', 'Ce que ça veut dire', 'La décision'],
        [
          [
            '« Remarqué » très inférieur à « apparu »',
            'Le dispositif n’a pas été tenu. Le relevé ne dit rien de la personne.',
            'Réduire l’ambition, répartir sur l’équipe. Ne rien conclure d’autre.',
          ],
          [
            'La colonne monte régulièrement',
            'Le dispositif fait son travail.',
            'Monter le critère d’un cran, puis espacer.',
          ],
          [
            'Elle stagne',
            'Un réglage est faux.',
            'Délai, puis renforçateur, puis critère. Un seul à la fois, dix jours de plus.',
          ],
          [
            'Elle monte puis retombe',
            'Le renforçateur a perdu son effet.',
            'En changer, et espacer.',
          ],
          [
            'Elle chute deux ou trois jours',
            'Bruit normal. Ce n’est pas une tendance.',
            'Ne rien changer. Comparer semaine à semaine.',
          ],
        ],
      ) +
      `<div style="${G.GRIS}">
<p style="margin:0"><strong>La phrase de bilan contient deux chiffres et une
durée.</strong> « Sur dix jours, X est apparu onze fois contre trois sur la
période précédente. Le critère passe à vingt minutes le 15. »</p>
</div>`,
  }) +
  A.pied();

module.exports = {
  uuid: '18e0ccdd-723d-4c5d-9edb-f13074c7de8c',
  slug: 'renforcer-ce-qui-va',
  modules: [
    { titre: 'Module 1 — Un renforçateur se reconnaît à l’effet, jamais à l’intention', minutes: 12, html: G.assembler(M1) },
    { titre: 'Module 2 — Le tableau qui s’est effondré en neuf jours', minutes: 10, html: G.assembler(M2) },
    { titre: 'Module 3 — Exercice guidé : la fiche de renforcement', minutes: 12, html: G.assembler(M3) },
    { titre: 'Module 4 — Dix jours, puis espacer sans tout perdre', minutes: 12, html: G.assembler(M4) },
  ],
  annexes: ANNEXES,
};
