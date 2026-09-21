/**
 * F13 — MESURER UN COMPORTEMENT : LIGNE DE BASE ET COURBE
 *
 * Compétence : lire une tendance sans se laisser avoir par trois jours.
 *
 * ── POURQUOI CE PARCOURS, ET POURQUOI AU NIVEAU 3 ──────────────────────────
 * Le catalogue apprend à comprendre un comportement (les quatre fonctions), à
 * le remplacer (apprendre à demander), à l'augmenter (renforcer ce qui va) et
 * à l'écrire (décrire sans juger). Il ne dit nulle part comment SAVOIR si ce
 * qu'on a mis en place produit quelque chose. C'est ce trou-là.
 *
 * Et c'est un trou coûteux, dans les deux sens. Une équipe qui conclut trop tôt
 * abandonne un dispositif qui marchait, ou maintient pendant des mois un
 * dispositif qui ne fait rien — dans les deux cas, c'est la personne qui paie.
 *
 * ⚠ CE PARCOURS SUPPOSE «&nbsp;DÉCRIRE UN COMPORTEMENT SANS LE JUGER&nbsp;», ET IL LE
 * DIT DÈS LE MODULE 1. On ne compte pas «&nbsp;de l'agressivité&nbsp;» : deux collègues
 * ne compteraient pas la même chose, et la courbe mesurerait alors qui était de
 * service. Le module 3 fait faire le test d'accord entre deux observateurs, qui
 * est exactement la vérification de ce prérequis.
 *
 * ── LES TROIS GARDE-FOUS QUI TIENNENT CE TEXTE, ET QU'IL NE FAUT PAS DÉFAIRE ─
 *
 * 1. ON NE MESURE QUE CE QUI COÛTE À LA PERSONNE. Le module 1 fait écrire, AVANT
 *    de choisir une unité, à qui le comportement coûte. Si la réponse est
 *    «&nbsp;à l'équipe&nbsp;», on ne mesure pas : on aurait fabriqué un outil de
 *    surveillance avec l'apparence d'un outil clinique. Même règle que la
 *    colonne «&nbsp;à qui ça sert&nbsp;» de «&nbsp;Renforcer ce qui va&nbsp;».
 *
 * 2. AUCUNE LIGNE DE BASE QUAND IL Y A DANGER. C'est la question que tout le
 *    monde se pose au module 2 et à laquelle beaucoup de textes ne répondent
 *    pas : attendre dix jours en regardant quelqu'un se blesser serait
 *    monstrueux. On agit, et on mesure APRÈS, en le sachant — une courbe sans
 *    ligne de base ne prouve rien, mais elle informe quand même.
 *
 * 3. UNE COURBE NE JUGE PERSONNE. Ni la personne accompagnée, ni le
 *    professionnel. Une courbe plate ne dit pas «&nbsp;il ne progresse pas&nbsp;» : elle
 *    dit que l'hypothèse était fausse, et elle renvoie aux quatre fonctions.
 *    Le module 4 l'écrit en toutes lettres, parce que c'est le moment précis où
 *    une équipe découragée se met à parler de la personne au lieu de parler du
 *    dispositif.
 *
 * ── CE QU'ON N'ENSEIGNE PAS, ET POURQUOI ───────────────────────────────────
 * ⚠ AUCUN TEST STATISTIQUE. Pas de significativité, pas d'écart-type, pas de
 * régression. Ces parcours s'adressent à des professionnels de terrain avec du
 * papier quadrillé, pas à des chercheurs : un test mal appliqué donne une
 * certitude fausse, ce qui est pire que l'incertitude honnête. Ce qu'on
 * enseigne — niveau, pente, variabilité, et la règle des trois points — est ce
 * qui se lit à l'œil sur une feuille, et c'est suffisant pour décider.
 *
 * ⚠ AUCUN «&nbsp;SCORE&nbsp;», AUCUN «&nbsp;NIVEAU&nbsp;» ATTRIBUÉ À LA PERSONNE. On mesure un
 * comportement dans un contexte, jamais quelqu'un. Un chiffre accolé à un nom
 * finit recopié dans le dossier suivant et survit à l'équipe qui l'a produit.
 *
 * ⚠ LE CONTENU VIENT DE L'ANALYSE APPLIQUÉE DU COMPORTEMENT : ce parcours doit
 * figurer dans `COMPORTEMENTALES` de `build-v2.js`, et sa fiche publique doit
 * porter le `GARDE_FOU` correspondant. Les deux doivent dire la même chose.
 */

const G = require('./gabarit-v3.js');
const A = require('./annexes.js');
const S = require('./schemas.js');
const Q = require('./quiz/mesurer-un-comportement-ligne-de-base.js');

/* ── FIGURES ─────────────────────────────────────────────────────────────── */

const CARTE = S.figure({
  numero: 1,
  titre: 'La carte du parcours',
  corps: S.carte({
    modules: [
      { titre: 'Module 1', produit: 'l’unité de mesure de VOTRE situation' },
      { titre: 'Module 2', produit: 'la décision sur la ligne de base' },
      { titre: 'Module 3', produit: 'votre feuille de relevé, testée à deux' },
      { titre: 'Module 4', produit: 'la lecture de votre courbe' },
    ],
    releve:
      '<strong>Entre le module 3 et le module 4&nbsp;:</strong> dix jours de relevé. C’est le plus long du catalogue, et c’est le cœur du parcours — une ligne de base de trois jours ne se lit pas.',
  }),
  legende:
    'Les trois premiers modules se lisent dans l’après-midi. Le quatrième ne peut pas être fait avant d’avoir dix points sur une feuille.',
});

const UNITES = S.figure({
  numero: 2,
  titre: 'Les quatre unités, et celle qu’il vous faut',
  corps: S.arbre({
    question: 'Qu’est-ce qui pose réellement problème dans ce comportement&nbsp;?',
    branches: [
      {
        condition: 'Ça revient trop souvent',
        contenu:
          '<strong>La fréquence.</strong> On compte combien de fois, sur un créneau toujours identique. «&nbsp;Quatre fois entre 16&nbsp;h et 18&nbsp;h.&nbsp;»',
      },
      {
        condition: 'Ça dure trop longtemps',
        contenu:
          '<strong>La durée.</strong> On chronomètre du début à la fin. «&nbsp;Onze minutes.&nbsp;» Une seule occurrence très longue ne se voit pas en fréquence.',
      },
      {
        condition: 'Ça met trop de temps à démarrer',
        contenu:
          '<strong>La latence.</strong> On mesure l’écart entre la consigne et le premier geste. «&nbsp;Sept minutes entre «&nbsp;on y va&nbsp;» et la première chaussure.&nbsp;»',
      },
    ],
  }),
  legende:
    'La quatrième unité — l’intensité — est traitée à part au module 1&nbsp;: c’est la plus demandée et la plus piégeuse, parce qu’elle ne se compte pas, elle s’estime.',
});

const LIGNE = S.figure({
  numero: 3,
  titre: 'Ce que la ligne de base rend possible',
  corps: S.frise([
    {
      nom: 'Avant',
      largeur: 45,
      quoi: 'Dix jours où l’on ne change RIEN. On relève, c’est tout. C’est la partie que tout le monde saute.',
    },
    {
      nom: 'On change une chose',
      largeur: 10,
      fort: true,
      quoi: 'Une seule, et on note la date sur la feuille.',
    },
    {
      nom: 'Après',
      largeur: 45,
      quoi: 'Dix jours de plus, relevés exactement de la même façon, par les mêmes personnes.',
    },
  ]),
  legende:
    'Sans la partie gauche, la partie droite ne veut rien dire&nbsp;: on ne sait pas d’où l’on part, donc on ne sait pas si l’on a bougé.',
});

const LECTURE = S.figure({
  numero: 4,
  titre: 'Les trois questions à poser à une courbe',
  corps: S.paires({
    gauche: 'Ce qu’on regarde',
    droite: 'Ce que ça veut dire, et ce que ça ne veut pas dire',
    lignes: [
      {
        g: '<strong>Le niveau</strong><br>Où se situe le nuage de points&nbsp;?',
        d: 'La médiane des dix points d’après, comparée à celle des dix points d’avant. Un niveau qui descend est le signal le plus simple et le plus solide.',
      },
      {
        g: '<strong>La pente</strong><br>Ça monte, ça descend, ou c’est plat&nbsp;?',
        d: 'Une pente était peut-être déjà là AVANT. Si la ligne de base descendait déjà, votre dispositif n’a peut-être rien fait du tout.',
      },
      {
        g: '<strong>La variabilité</strong><br>Les points sont-ils serrés ou dispersés&nbsp;?',
        d: 'Une courbe qui se resserre sans descendre est un vrai progrès&nbsp;: les journées catastrophiques ont disparu, même si la moyenne n’a pas bougé.',
      },
    ],
  }),
  legende:
    'On répond aux trois dans cet ordre. Beaucoup d’équipes ne regardent que la pente, qui est la plus trompeuse des trois.',
});

const TROIS = S.figure({
  numero: 5,
  titre: 'La règle des trois points',
  corps: S.arbre({
    question: 'Combien de points consécutifs sont sortis de la zone habituelle&nbsp;?',
    branches: [
      {
        condition: 'Un ou deux',
        contenu:
          'Ce n’est rien. Une bonne journée existe, une mauvaise aussi. <strong>On ne change rien et on continue de relever.</strong>',
      },
      {
        condition: 'Trois ou plus',
        contenu:
          'C’est un signal. On le note, on continue encore cinq jours, et on regarde si ça tient. <strong>Un signal n’est pas une conclusion.</strong>',
      },
      {
        condition: 'Tous, d’un coup',
        contenu:
          'Méfiance&nbsp;: un changement brutal et total vient plus souvent d’autre chose (vacances, absence d’un collègue, maladie) que du dispositif. Fiche&nbsp;5.',
      },
    ],
  }),
  legende:
    'C’est la règle qui donne son titre au parcours. Trois jours ne sont pas une tendance — et trois jours dans le mauvais sens non plus.',
});

const ARRET = S.figure({
  numero: 6,
  titre: 'Quand arrêter de mesurer',
  corps: S.echelle(
    [
      {
        niveau: 'Arrêter',
        libelle:
          'Le comportement ne coûte plus rien à la personne. Mesurer encore, c’est continuer de la regarder pour rien.',
      },
      {
        niveau: 'Espacer',
        libelle:
          'Ça tient depuis trois semaines. On passe d’un relevé quotidien à un relevé hebdomadaire, une journée par semaine.',
      },
      {
        niveau: 'Continuer',
        libelle: 'La courbe bouge encore, dans un sens ou dans l’autre. On garde le rythme.',
      },
      {
        niveau: 'Reprendre à zéro',
        libelle:
          'Rien n’a bougé en quatre semaines. Ce n’est pas la personne qui est en cause&nbsp;: l’hypothèse était fausse. Retour aux quatre fonctions.',
      },
    ],
    { titreNiveau: 'Décision', titreLibelle: 'Quand' },
  ),
  legende:
    'Une mesure qui ne s’arrête jamais devient une habitude de service, et plus personne ne sait à quelle question elle répond.',
});

/* ── MODULE 1 ────────────────────────────────────────────────────────────── */

const M1 = {
  reperes: {
    minutes: 12,
    prerequis:
      'Avoir suivi «&nbsp;Décrire un comportement sans le juger&nbsp;». Ce parcours compte des comportements&nbsp;: un comportement mal décrit ne se compte pas.',
    evaluation:
      'Cinq questions d’autocorrection en fin de module, ni notées ni transmises.',
  },
  objectifs: [
    'Dire à qui un comportement coûte, avant de décider de le mesurer.',
    'Choisir entre fréquence, durée et latence selon ce qui pose problème.',
    'Reconnaître pourquoi l’intensité est la plus demandée et la moins fiable.',
  ],
  corps: `${CARTE}

<h3 style="${G.H3}">1. «&nbsp;Ça va mieux&nbsp;» n’est pas une mesure</h3>
<p>Prenez une réunion de synthèse. Quelqu’un dit «&nbsp;depuis qu’on a mis en place le
tableau, ça va nettement mieux&nbsp;». Personne ne conteste, parce que personne n’a de
quoi contester. Trois semaines plus tard, un incident arrive, et la même équipe dit
«&nbsp;finalement ça n’a rien changé&nbsp;». Les deux phrases sont dites avec la même
conviction, et aucune des deux ne repose sur quoi que ce soit.</p>

<p>Ce n’est pas un défaut de sérieux. C’est un défaut de <strong>mémoire</strong> :
nous retenons ce qui a frappé, pas ce qui s’est passé. Un incident marquant pèse plus
lourd dans le souvenir que douze journées calmes, et c’est vrai pour tout le monde,
y compris pour les professionnels les plus expérimentés.</p>

<p>Une mesure ne rend pas plus intelligent. Elle remplace simplement ce dont on se
souvient par ce qui s’est produit.</p>

${G.alerte(
  'À qui ce comportement coûte-t-il&nbsp;? Répondez avant de continuer.',
  `C’est la première question du parcours, et elle décide s’il y a lieu de mesurer.
Si le comportement coûte <strong>à la personne</strong> — il l’isole, il la blesse, il
l’empêche d’obtenir ce qu’elle veut, il lui ferme une activité — alors le mesurer
sert à l’aider. Si la réponse honnête est «&nbsp;<strong>ça nous gêne</strong>&nbsp;»,
alors on est en train de fabriquer un outil de surveillance qui aura l’apparence d’un
outil clinique. On n’écrit pas la suite.`,
)}

<h3 style="${G.H3}">2. On ne compte pas un mot, on compte un geste</h3>
<p>«&nbsp;Agressivité&nbsp;», «&nbsp;opposition&nbsp;», «&nbsp;crise&nbsp;» ne se
comptent pas. Deux collègues ne mettront pas la même chose derrière, et la courbe
finira par mesurer <em>qui était de service</em> plutôt que ce qui s’est passé. C’est
l’erreur qui ruine le plus de relevés, et elle se produit à la première ligne.</p>

<p>Ce qui se compte, c’est ce qu’une caméra aurait enregistré. «&nbsp;A jeté un objet.&nbsp;»
«&nbsp;A quitté la pièce sans prévenir.&nbsp;» «&nbsp;A frappé le mur avec la main
ouverte.&nbsp;» Si vous ne savez pas décrire ainsi le comportement que vous voulez
suivre, ce parcours n’est pas le bon&nbsp;: commencez par «&nbsp;Décrire un comportement
sans le juger&nbsp;», puis revenez.</p>

${G.exemple(
  'La même situation, comptable et incomptable',
  `<p><strong>Incomptable&nbsp;:</strong> «&nbsp;Léo a été très opposant cette
semaine.&nbsp;» Combien de fois&nbsp;? À quel moment&nbsp;? Qu’est-ce qui compte comme
opposition&nbsp;?</p>
<p style="margin-bottom:0"><strong>Comptable&nbsp;:</strong> «&nbsp;Léo est resté assis
sans bouger après la consigne de départ&nbsp;: lundi 1 fois, mardi 3, mercredi 2,
jeudi 4, vendredi 2.&nbsp;» Là, on peut faire quelque chose — et on peut surtout
constater, dans quinze jours, si ça a changé.</p>`,
)}

${UNITES}

<h3 style="${G.H3}">3. Une seule unité, choisie sur le problème</h3>
<p>La figure&nbsp;2 pose la question dans le bon sens&nbsp;: on ne choisit pas l’unité
la plus facile à relever, on choisit celle qui décrit ce qui pose problème.</p>

<ul style="${G.UL}">
<li style="${G.LI}"><strong>La fréquence</strong> convient quand ce qui gêne, c’est le
retour. Elle exige un <strong>créneau fixe</strong> : «&nbsp;quatre fois&nbsp;» ne veut
rien dire si c’est quatre fois en deux heures un jour et quatre fois en dix heures le
lendemain.</li>
<li style="${G.LI}"><strong>La durée</strong> convient quand une seule occurrence suffit
à gâcher la journée. Une crise par jour qui passe de quarante minutes à huit minutes est
un progrès énorme que la fréquence ne verrait pas du tout — elle compterait 1 et 1.</li>
<li style="${G.LI}"><strong>La latence</strong> convient quand le comportement finit par
arriver mais trop tard. C’est l’unité des transitions, des départs, des couchers. Elle
est aussi celle qui bouge le plus vite quand un dispositif marche.</li>
</ul>

<p><strong>Une seule à la fois.</strong> Relever deux unités sur le même comportement
double le travail, et fait presque toujours abandonner le relevé au quatrième jour.</p>

<h3 style="${G.H3}">4. L’intensité&nbsp;: la plus demandée, la moins fiable</h3>
<p>Tout le monde veut noter l’intensité, parce que c’est ce qui fait la différence entre
une journée acceptable et une journée terrible. Et c’est un vrai besoin. Le problème est
qu’elle ne se compte pas&nbsp;: elle s’estime, donc elle varie avec la fatigue de celui
qui estime, avec ce qui s’est passé la veille, avec l’affection qu’on porte à la personne.</p>

<p>Deux façons de s’en sortir, et une seule est solide&nbsp;:</p>

<ul style="${G.UL}">
<li style="${G.LI}"><strong>Solide&nbsp;:</strong> remplacer l’intensité par quelque chose
de comptable qui en dépend. Plutôt que «&nbsp;intensité&nbsp;», relever «&nbsp;a-t-il fallu
faire sortir les autres de la pièce&nbsp;: oui / non&nbsp;». Une question fermée, deux
réponses possibles, aucune estimation. C’est moins riche, et c’est lisible dans six mois.</li>
<li style="${G.LI}"><strong>Fragile&nbsp;:</strong> une échelle de 1 à 5. Elle ne vaut que
si les cinq niveaux sont décrits par des faits (fiche&nbsp;1) ET si le test d’accord du
module&nbsp;3 est passé. Sans les deux, elle donne des chiffres qui ont l’air de données
et qui n’en sont pas.</li>
</ul>

${G.alerte(
  'Un chiffre ne s’accole jamais à un nom',
  `On mesure un comportement dans un contexte, on ne mesure pas quelqu’un. «&nbsp;Léo est à
3,2&nbsp;» n’existe pas. Ce qui existe, c’est «&nbsp;les départs de table sans prévenir, au
repas du soir, dans cet internat, ont été relevés 4 fois sur 10 jours&nbsp;». La différence
n’est pas de la précaution de langage&nbsp;: un chiffre accolé à un nom est recopié dans le
dossier suivant, survit à l’équipe qui l’a produit, et devient une caractéristique de la
personne.`,
)}`,
  aRetenir:
    'On ne mesure que ce qui coûte à la personne, on ne compte que ce qu’une caméra aurait vu, et on choisit UNE unité sur ce qui pose problème — pas sur ce qui est commode à relever.',
  exercice: {
    nom: 'Le choix de l’unité',
    duree: '15 minutes, sur une situation réelle',
    quoi: 'Une situation que vous suivez en ce moment, et la décision d’unité écrite noir sur blanc.',
    etapes: [
      'Nommez le comportement en une phrase qu’une caméra aurait pu filmer. Si vous n’y arrivez pas, la mesure ne tiendra pas&nbsp;: reprenez la description avant tout le reste.',
      'Écrivez à qui il coûte, et en quoi. Une phrase. Si la seule réponse est «&nbsp;à l’équipe&nbsp;», arrêtez-vous là et prenez une autre situation.',
      'Répondez à la question de la figure&nbsp;2&nbsp;: ça revient trop souvent, ça dure trop longtemps, ou ça met trop de temps à démarrer&nbsp;?',
      'Écrivez l’unité retenue et le créneau exact d’observation. «&nbsp;Fréquence, tous les jours entre 16&nbsp;h&nbsp;30 et 18&nbsp;h&nbsp;30.&nbsp;»',
      'Relisez&nbsp;: quelqu’un qui ne connaît pas la situation pourrait-il relever à votre place demain&nbsp;? Si non, c’est que la définition n’est pas encore assez précise.',
    ],
    reussi:
      'C’est réussi quand un collègue lit votre phrase, va sur le terrain, et relève les mêmes choses que vous — sans avoir à vous poser de question.',
  },
  carnet: {
    intro: 'Le carnet du module 1, à garder&nbsp;: c’est la première ligne de votre feuille de relevé.',
    lignes: [
      'Le comportement, écrit comme une caméra l’aurait filmé',
      'À qui il coûte, et en quoi',
      'L’unité retenue&nbsp;: fréquence, durée ou latence',
      'Le créneau exact d’observation',
      'Ce que je fais de l’intensité, si elle compte&nbsp;: la question fermée retenue',
    ],
  },
  vigilance: [
    'Mesurer ce qui gêne l’équipe plutôt que ce qui coûte à la personne. C’est le seul point de ce module qui peut transformer l’outil en son contraire.',
    'Compter un mot («&nbsp;agressivité&nbsp;») plutôt qu’un geste. La courbe mesurera qui était de service.',
    'Relever deux unités «&nbsp;pour être sûr&nbsp;». Le relevé est abandonné au quatrième jour, et on n’a rien.',
    'Noter une intensité estimée sans avoir décrit les niveaux par des faits. Des chiffres qui ont l’air de données et qui n’en sont pas.',
  ],
  annexes: 'la fiche 1 (choisir son unité) et la fiche 7 (ce qu’on ne mesure jamais)',
  quiz: Q[0],
  avant: [
    'Vous avez UNE situation, UN comportement décrit en termes filmables, et UNE unité.',
    'Vous avez écrit à qui ce comportement coûte, et la réponse n’est pas «&nbsp;à nous&nbsp;».',
    'Vous savez à quel créneau exact vous allez relever.',
  ],
};

/* ── MODULE 2 ────────────────────────────────────────────────────────────── */

const M2 = {
  reperes: {
    minutes: 10,
    prerequis: 'Le module 1, et l’unité choisie.',
    evaluation: 'Cinq questions d’autocorrection en fin de module.',
  },
  objectifs: [
    'Expliquer pourquoi on ne change rien pendant la ligne de base.',
    'Décider, dans une situation donnée, s’il faut faire une ligne de base ou agir tout de suite.',
    'Reconnaître les trois raisons pour lesquelles «&nbsp;ça a marché tout de suite&nbsp;» est presque toujours faux.',
  ],
  corps: `<h3 style="${G.H3}">1. Une semaine qui ne prouve rien</h3>

${G.exemple(
  'Ce qui s’est passé à l’internat, du lundi au vendredi',
  `<p>Samir, 14 ans, quitte la table du dîner avant la fin, plusieurs fois par semaine,
souvent en claquant la porte. L’équipe en a assez. Le lundi, elle décide trois choses
d’un coup&nbsp;: un tableau de suivi affiché dans le couloir, une place de table
changée, et un temps calme de dix minutes avant le repas.</p>
<p>Le vendredi, Samir n’est sorti qu’une fois de la semaine. L’équipe est soulagée, et
conclut que le dispositif fonctionne.</p>
<p style="margin-bottom:0"><strong>Trois semaines plus tard</strong>, on en est à quatre
sorties par semaine, comme avant. La réunion conclut que «&nbsp;Samir a régressé&nbsp;».</p>`,
)}

<p>Personne n’a mal travaillé. Mais rien, dans cette histoire, ne permet de dire si l’un
des trois changements a produit quoi que ce soit. Trois raisons à cela, et elles se
cumulent.</p>

<h3 style="${G.H3}">2. Les trois raisons pour lesquelles «&nbsp;ça a marché tout de suite&nbsp;» est suspect</h3>

<ul style="${G.UL}">
<li style="${G.LI}"><strong>On agit toujours au pire moment.</strong> Une équipe décide de
mettre quelque chose en place quand elle n’en peut plus, c’est-à-dire après une très
mauvaise semaine. Or une très mauvaise semaine est, par définition, suivie d’une semaine
plus ordinaire — que l’on fasse quelque chose ou non. C’est le piège principal, et il
n’épargne personne.</li>
<li style="${G.LI}"><strong>Le neuf agit tout seul, quelques jours.</strong> Un tableau qui
apparaît dans le couloir change quelque chose parce qu’il est nouveau, pas parce qu’il est
bon. L’effet s’éteint en une à deux semaines. C’est exactement la durée pendant laquelle
une équipe conclut.</li>
<li style="${G.LI}"><strong>Regarder change ce qu’on regarde.</strong> Une équipe qui relève
est une équipe plus attentive, plus présente, qui anticipe mieux. Le comportement baisse
parfois dès le premier jour de relevé, avant même qu’on ait mis quoi que ce soit en
place.</li>
</ul>

<p>La troisième est une bonne nouvelle déguisée&nbsp;: elle veut dire que relever
sérieusement produit déjà un effet. Mais elle interdit de mettre cet effet au crédit du
dispositif.</p>

${LIGNE}

<h3 style="${G.H3}">3. Ce qu’est une ligne de base, et ce qu’elle coûte</h3>
<p>Une ligne de base, ce sont dix jours pendant lesquels on relève sans rien changer. Pas
de nouveau tableau, pas de nouvelle règle, pas de nouvelle place à table. On continue
exactement comme avant, et on note.</p>

<p>C’est la partie que tout le monde saute, pour une raison compréhensible&nbsp;: elle
donne le sentiment de ne rien faire pendant que la situation dure. Deux choses à savoir
là-dessus.</p>

<p><strong>On ne fait pas rien&nbsp;:</strong> on fait tout ce qu’on faisait déjà. La
ligne de base n’est pas une suspension de l’accompagnement, c’est une suspension des
<em>nouveautés</em>. Tout ce qui est en place reste en place.</p>

<p><strong>Dix jours, et pas une semaine.</strong> Cinq points ne permettent pas de voir
une variabilité&nbsp;: avec cinq jours, deux journées atypiques représentent 40&nbsp;% de
ce que vous savez. Avec dix, elles en représentent 20&nbsp;%, et surtout vous voyez à quoi
ressemble une journée ordinaire — ce qui est précisément l’information qui vous manquera
au module 4.</p>

${G.alerte(
  'S’il y a danger, on n’attend pas. Jamais.',
  `Aucune ligne de base ne justifie de regarder quelqu’un se blesser, blesser quelqu’un,
ou se mettre en danger pendant dix jours. Quand la sécurité est en jeu&nbsp;: <strong>on
agit tout de suite</strong>, et on commence à relever en même temps, en le sachant.
<br><br>Une courbe sans ligne de base ne <em>prouve</em> rien — on ne pourra pas dire que
c’est le dispositif qui a agi. Mais elle <em>informe</em> quand même&nbsp;: elle dit si la
situation s’améliore, se dégrade ou stagne, et c’est déjà beaucoup plus que des souvenirs.
On l’écrit simplement sur la feuille&nbsp;: «&nbsp;pas de ligne de base, intervention
immédiate le [date], motif&nbsp;: sécurité&nbsp;».`,
)}

<h3 style="${G.H3}">4. Une seule chose à la fois, et la date écrite</h3>
<p>L’équipe de Samir a changé trois choses le même lundi. Même avec une ligne de base
impeccable, elle n’aurait pas su laquelle avait agi — ni si l’une des trois annulait les
deux autres.</p>

<p>Quand le dix-septième jour arrive et que vous mettez quelque chose en place&nbsp;:
<strong>une seule chose</strong>, et <strong>la date entourée sur la feuille de
relevé</strong>. Ce trait vertical sur la courbe est ce qui rendra le module 4 lisible.
Sans lui, vous aurez vingt points et aucun repère.</p>

<p>«&nbsp;Mais on n’a pas le temps d’essayer une chose après l’autre.&nbsp;» C’est vrai, et
c’est un vrai arbitrage. La réponse honnête est&nbsp;: changez plusieurs choses si la
situation l’exige, mais sachez alors que vous ne saurez pas laquelle a compté — et donc
que vous devrez tout maintenir, y compris ce qui ne sert à rien.</p>`,
  aRetenir:
    'Dix jours sans rien changer, puis UNE chose à la fois avec la date écrite. Et s’il y a danger, on agit immédiatement en notant qu’il n’y a pas de ligne de base.',
  exercice: {
    nom: 'La décision «&nbsp;ligne de base ou pas&nbsp;»',
    duree: '10 minutes',
    quoi: 'Une décision écrite et datée, et la liste de ce qui ne bougera pas pendant dix jours.',
    etapes: [
      'Reprenez votre situation du module 1. Y a-t-il un enjeu de sécurité immédiat pour la personne ou pour quelqu’un d’autre&nbsp;? Répondez par oui ou par non, sans nuance.',
      'Si c’est oui&nbsp;: écrivez ce que vous mettez en place aujourd’hui, et la mention «&nbsp;pas de ligne de base, motif sécurité&nbsp;» en tête de feuille. Passez à l’étape 5.',
      'Si c’est non&nbsp;: écrivez la date de début et la date de fin des dix jours de relevé.',
      'Listez ce qui est déjà en place et qui ne bougera pas pendant ces dix jours. Dites-le à l’équipe — c’est cette phrase-là qui fait tenir la ligne de base, pas la bonne volonté.',
      'Écrivez ce que vous mettrez en place le onzième jour. Une seule chose. L’écrire maintenant évite d’improviser au moment où l’on est fatigué de relever.',
    ],
    reussi:
      'C’est réussi quand chaque membre de l’équipe peut dire, sans hésiter, ce qui ne change pas d’ici la date de fin — et pourquoi.',
  },
  carnet: {
    intro: 'Le carnet du module 2&nbsp;: la décision, pour qu’elle ne se rediscute pas chaque lundi.',
    lignes: [
      'Ligne de base&nbsp;: oui / non — et le motif si c’est non',
      'Date de début, date de fin',
      'Ce qui reste en place et ne bouge pas',
      'Ce qui sera mis en place le onzième jour&nbsp;: une seule chose',
      'Qui prévient l’équipe, et quand',
    ],
  },
  vigilance: [
    'Changer quelque chose «&nbsp;en attendant&nbsp;» pendant la ligne de base. Elle est perdue, il faut recommencer.',
    'Conclure au bout de cinq jours. C’est exactement le moment où l’effet de nouveauté est le plus fort.',
    'Mettre trois choses en place le même jour. On ne saura jamais laquelle a compté, et on devra tout garder.',
    'Attendre dix jours alors que quelqu’un se met en danger. La ligne de base n’est pas une règle au-dessus de la sécurité.',
    'Oublier d’écrire la date du changement. C’est le trait vertical sans lequel la courbe du module 4 ne se lit pas.',
  ],
  quiz: Q[1],
  avant: [
    'Vous avez décidé&nbsp;: ligne de base ou intervention immédiate, et c’est écrit.',
    'L’équipe sait ce qui ne bouge pas, et jusqu’à quelle date.',
    'La chose que vous mettrez en place ensuite est déjà écrite.',
  ],
};

/* ── MODULE 3 ────────────────────────────────────────────────────────────── */

const M3 = {
  reperes: {
    minutes: 12,
    prerequis: 'Les modules 1 et 2. Une unité, un créneau, une décision.',
    evaluation: 'Cinq questions d’autocorrection, puis dix jours de relevé.',
    apres:
      'dix jours de relevé, une ligne par jour. Le module 4 ne peut pas être fait avant — il porte sur VOTRE courbe.',
  },
  objectifs: [
    'Construire une feuille de relevé qu’un collègue peut remplir sans explication.',
    'Vérifier, à deux, que vous comptez la même chose.',
    'Tracer une courbe à la main et poser le seuil de départ.',
  ],
  corps: `<h3 style="${G.H3}">1. La feuille tient sur une page, et elle est affichée</h3>
<p>Une feuille de relevé qui vit dans un ordinateur n’est jamais remplie. Elle est
remplie quand elle est punaisée là où le comportement se produit, avec un stylo
accroché à côté.</p>

<p>Six colonnes, pas davantage&nbsp;:</p>

<ul style="${G.UL}">
<li style="${G.LI}"><strong>Date</strong> — une ligne par jour, même les jours à zéro.
Un jour sans rien est une donnée, pas une case à laisser vide.</li>
<li style="${G.LI}"><strong>Qui relève</strong> — l’initiale suffit. Elle sert au module 4
quand la courbe fait un bond inexpliqué.</li>
<li style="${G.LI}"><strong>La mesure</strong> — un nombre. Rien d’autre dans cette
colonne.</li>
<li style="${G.LI}"><strong>Créneau respecté&nbsp;?</strong> — oui / non. Un jour où la
personne était absente deux heures n’est pas comparable aux autres.</li>
<li style="${G.LI}"><strong>Inhabituel</strong> — trois mots maximum&nbsp;: «&nbsp;sortie
piscine&nbsp;», «&nbsp;absence de M.&nbsp;», «&nbsp;fièvre&nbsp;». C’est la colonne qui
sauve la lecture de la courbe.</li>
<li style="${G.LI}"><strong>La question fermée</strong>, si vous en avez retenu une au
module 1. Oui / non.</li>
</ul>

${G.alerte(
  'La colonne «&nbsp;inhabituel&nbsp;» n’est pas facultative',
  `C’est trois mots par jour, et c’est ce qui vous évitera de croire à un progrès qui
n’existe pas. Une courbe qui descend magnifiquement pendant les vacances scolaires, et
qui remonte à la rentrée, n’a rien mesuré du tout — sauf si la colonne le dit, auquel cas
vous le voyez immédiatement.`,
)}

<h3 style="${G.H3}">2. Le test d’accord&nbsp;: compter la même chose</h3>
<p>Si trois personnes relèvent, il faut vérifier une fois qu’elles comptent la même chose.
Ça prend une séance, et ça décide de la valeur de tout le reste.</p>

<p><strong>Comment on fait&nbsp;:</strong> deux personnes relèvent le même créneau, en même
temps, <strong>sans se parler et sans regarder la feuille de l’autre</strong>. À la fin, on
compare les deux nombres.</p>

<ul style="${G.UL}">
<li style="${G.LI}"><strong>Les deux nombres sont identiques ou à un près</strong> — la
définition tient. Vous pouvez commencer.</li>
<li style="${G.LI}"><strong>L’écart est plus grand</strong> — la définition ne tient pas.
Ce n’est pas que l’un des deux a mal regardé&nbsp;: c’est que la phrase du module 1 laisse
de la place à l’interprétation. On la réécrit ensemble, et on refait le test.</li>
</ul>

<p>Cette discussion — «&nbsp;moi j’ai compté ça, et toi&nbsp;?&nbsp;» — est souvent le
moment le plus utile du parcours. Elle fait apparaître que l’équipe ne mettait pas la
même chose derrière le même mot, ce qui était déjà vrai avant le relevé, mais invisible.</p>

${G.exemple(
  'Un test d’accord qui échoue, et ce qu’il révèle',
  `<p>Définition retenue&nbsp;: «&nbsp;quitte la table avant la fin du repas&nbsp;».
Au dîner, Claire compte 2, Mehdi compte 5.</p>
<p>En comparant&nbsp;: Mehdi a compté les allers-retours à la cuisine pour chercher de
l’eau. Claire ne les a pas comptés, parce que Samir revenait s’asseoir.</p>
<p style="margin-bottom:0">Aucun des deux n’a tort. La définition était trop courte. Elle
devient&nbsp;: «&nbsp;quitte la table et ne revient pas s’asseoir dans la minute&nbsp;».
Nouveau test le lendemain&nbsp;: 2 et 2.</p>`,
)}

<h3 style="${G.H3}">3. Tracer, à la main, sur du papier quadrillé</h3>
<p>Un tableur est plus joli et ne sera pas ouvert. Une feuille quadrillée punaisée à côté
de la feuille de relevé se remplit en dix secondes par jour, et elle se regarde en
passant — ce qui est exactement ce qu’on veut.</p>

<ul style="${G.UL}">
<li style="${G.LI}">L’axe du bas&nbsp;: les jours, un carreau par jour.</li>
<li style="${G.LI}">L’axe de gauche&nbsp;: votre unité. Prenez large&nbsp;: si vous montez
à 6 aujourd’hui, graduez jusqu’à 10.</li>
<li style="${G.LI}">Un point par jour, et on relie. Les jours à zéro font un point sur la
ligne du bas, pas un trou.</li>
<li style="${G.LI}">Au onzième jour&nbsp;: un <strong>trait vertical</strong>, et le nom
de ce que vous avez mis en place écrit à côté.</li>
</ul>

<h3 style="${G.H3}">4. Le seuil de départ&nbsp;: la médiane, pas la moyenne</h3>
<p>Au bout de dix jours, vous avez besoin d’un nombre qui résume «&nbsp;à quoi ressemblait
une journée ordinaire avant&nbsp;». Ce nombre, c’est la <strong>médiane</strong> : rangez
vos dix valeurs de la plus petite à la plus grande, et prenez celle du milieu (avec dix
valeurs, la moyenne des deux du milieu).</p>

<p><strong>Pas la moyenne</strong>, et la raison est simple&nbsp;: une seule journée
catastrophique tire la moyenne vers le haut et vous fera croire, le mois prochain, à une
amélioration qui n’est que le retour à l’ordinaire.</p>

${G.exemple(
  'Pourquoi la médiane, en chiffres',
  `<p>Dix jours de relevé&nbsp;: 2, 3, 2, 4, 3, <strong>14</strong>, 2, 3, 4, 3.</p>
<p><strong>Moyenne&nbsp;: 4</strong> — tirée par la journée à 14, qui était le jour de la
sortie annulée.</p>
<p style="margin-bottom:0"><strong>Médiane&nbsp;: 3</strong> — c’est bien à ça que
ressemble une journée ordinaire. Si vous vous fixez la moyenne comme repère, le mois
prochain à 3,5 vous vous féliciterez d’un progrès qui n’a pas eu lieu.</p>`,
)}`,
  aRetenir:
    'Une feuille affichée à six colonnes, un test d’accord à deux avant de commencer, un point par jour tracé à la main, et la médiane — jamais la moyenne — comme repère de départ.',
  exercice: {
    nom: 'La feuille, le test, et les dix jours',
    duree: '30 minutes de préparation, puis dix jours',
    quoi: 'Votre feuille de relevé remplie sur dix jours, et la courbe tracée au fur et à mesure.',
    etapes: [
      'Tracez la feuille à six colonnes sur une A4 (fiche&nbsp;2 pour le modèle), avec dix lignes datées. Punaisez-la là où le comportement se produit.',
      'Faites le test d’accord avec un collègue&nbsp;: même créneau, chacun sa feuille, aucune parole. Comparez. Si l’écart dépasse 1, réécrivez la définition et refaites-le.',
      'Relevez dix jours. Une ligne par jour, y compris les jours à zéro et les jours où vous n’étiez pas là (notez «&nbsp;non relevé&nbsp;», ce n’est pas zéro).',
      'Reportez chaque point sur le papier quadrillé le soir même. Dix secondes. Ne le faites pas à la fin&nbsp;: on recopie mal, et on se souvient mal.',
      'Au dixième jour, calculez la médiane de vos dix valeurs et tracez-la en pointillés sur toute la largeur de la feuille.',
    ],
    reussi:
      'C’est réussi quand vous avez dix points sur une feuille, une ligne de médiane en pointillés, et que vous pouvez dire ce qui s’est passé les jours où le point sort du lot.',
  },
  carnet: {
    intro: 'Le carnet du module 3&nbsp;: ce qui doit exister physiquement avant de commencer.',
    lignes: [
      'La feuille de relevé, affichée, avec un stylo',
      'Le résultat du test d’accord&nbsp;: les deux nombres, et l’écart',
      'La définition finale du comportement, après le test',
      'La feuille quadrillée, à côté',
      'La médiane des dix premiers jours',
    ],
  },
  vigilance: [
    'Laisser une case vide au lieu d’écrire zéro. Au module 4, on ne saura plus si c’était un jour calme ou un jour non relevé.',
    'Sauter le test d’accord parce qu’on est pressé. Toute la courbe repose dessus.',
    'Remplir la feuille de mémoire le vendredi pour toute la semaine. Ce n’est plus une mesure, c’est un souvenir — exactement ce qu’on voulait remplacer.',
    'Prendre la moyenne comme repère. Une journée exceptionnelle vous fera voir un progrès qui n’existe pas.',
    'Changer quelque chose pendant les dix jours. Il faut tout recommencer, et personne n’a envie de recommencer.',
  ],
  annexes: 'la fiche 2 (la feuille vierge) et la fiche 3 (le test d’accord)',
  quiz: Q[2],
  avant: [
    'Votre feuille est affichée et le test d’accord est passé.',
    'Vous avez dix points, ou vous savez exactement quand vous les aurez.',
    'La médiane est calculée et tracée.',
  ],
  pause: {
    jours: 10,
    texte:
      'Le module 4 porte sur VOTRE courbe&nbsp;: il ne peut pas être fait avant. Revenez quand les dix jours sont relevés — et si vous avez mis quelque chose en place au onzième, revenez plutôt au vingtième, avec les deux moitiés.',
  },
};

/* ── MODULE 4 ────────────────────────────────────────────────────────────── */

const M4 = {
  reperes: {
    minutes: 12,
    prerequis: 'Dix jours de relevé au minimum, tracés, avec la médiane.',
    evaluation:
      'Cinq questions d’autocorrection, et la lecture écrite de votre propre courbe.',
  },
  objectifs: [
    'Répondre aux trois questions — niveau, pente, variabilité — dans cet ordre.',
    'Appliquer la règle des trois points avant de conclure quoi que ce soit.',
    'Décider de continuer, d’espacer, d’arrêter ou de reprendre l’hypothèse à zéro.',
  ],
  corps: `${LECTURE}

<h3 style="${G.H3}">1. Le niveau d’abord, parce que c’est le plus solide</h3>
<p>Prenez la médiane des dix jours d’avant, et la médiane des dix jours d’après. Comparez
les deux nombres. C’est tout, et c’est le signal le plus fiable dont vous disposerez.</p>

<p>Un niveau qui passe de 4 à 1,5 est un résultat. Un niveau qui passe de 4 à 3,5 n’en est
pas un&nbsp;: c’est à l’intérieur de ce que vos dix premiers jours faisaient varier tout
seuls.</p>

<p><strong>Le repère&nbsp;:</strong> regardez l’écart entre votre plus petite et votre plus
grande valeur de ligne de base. Si le nouveau niveau est encore dans cet intervalle, vous
n’avez rien montré.</p>

<h3 style="${G.H3}">2. La pente, et le piège qu’elle tend</h3>
<p>La pente est ce que tout le monde regarde en premier, et c’est la plus trompeuse des
trois — parce qu’elle était peut-être déjà là.</p>

${G.exemple(
  'Une pente qui descendait déjà',
  `<p>Ligne de base sur dix jours&nbsp;: 6, 6, 5, 5, 4, 4, 4, 3, 3, 3. Médiane&nbsp;: 4.</p>
<p>Après intervention&nbsp;: 3, 2, 2, 2, 1, 2, 1, 1, 2, 1. Médiane&nbsp;: 2. La courbe
descend, le niveau a baissé, l’équipe est satisfaite.</p>
<p style="margin-bottom:0"><strong>Sauf que la ligne de base descendait déjà</strong>, de
6 à 3, avant qu’on ne touche à quoi que ce soit. La suite est peut-être la continuation
pure et simple de ce mouvement. On ne peut pas conclure — et il faut le dire en réunion,
même quand ça déçoit.</p>`,
)}

<p>C’est la raison pour laquelle la ligne de base se trace, et pas seulement se résume par
un nombre. Une ligne de base qui descend déjà vous interdit de vous attribuer une descente
qui continue.</p>

<h3 style="${G.H3}">3. La variabilité&nbsp;: le progrès que personne ne voit</h3>
<p>Regardez l’épaisseur du nuage de points, pas seulement sa hauteur.</p>

<p>Une courbe qui passe de «&nbsp;0, 8, 1, 7, 0, 9&nbsp;» à «&nbsp;3, 4, 3, 4, 3, 4&nbsp;»
a exactement la même moyenne. Et pourtant la vie de la personne a changé du tout au tout&nbsp;:
les journées catastrophiques ont disparu. C’est souvent le premier effet visible d’un
dispositif, et c’est celui que les équipes ratent le plus souvent parce qu’elles ne
regardent que la moyenne.</p>

${G.alerte(
  'Une courbe plate ne juge personne',
  `Quand rien ne bouge en quatre semaines, la phrase qui vient en réunion est
«&nbsp;il ne progresse pas&nbsp;». Elle est fausse, et elle est coûteuse&nbsp;: elle
déplace le problème sur la personne au moment exact où il faudrait revenir au dispositif.
<br><br>Ce qu’une courbe plate dit, c’est que <strong>l’hypothèse était fausse</strong>.
Le comportement sert probablement à autre chose que ce qu’on avait supposé, et ce qu’on a
mis en place ne répond donc pas à la bonne question. Le chemin, c’est le retour aux quatre
fonctions — pas un chapitre de plus sur la personne.`,
)}

${TROIS}

<h3 style="${G.H3}">4. Ce qui fait mentir une courbe</h3>
<p>Avant de conclure quoi que ce soit, relisez la colonne «&nbsp;inhabituel&nbsp;». Cinq
causes expliquent la plupart des variations spectaculaires, et aucune n’a de rapport avec
votre dispositif&nbsp;:</p>

<ul style="${G.UL}">
<li style="${G.LI}"><strong>Le calendrier&nbsp;:</strong> vacances, week-ends prolongés,
périodes de fêtes, rentrée. Ce sont les plus grosses variations de toutes.</li>
<li style="${G.LI}"><strong>Les personnes&nbsp;:</strong> l’absence d’un collègue,
l’arrivée d’un stagiaire, un remplaçant. Le comportement dépend souvent de qui est là,
bien plus que de ce qu’on a mis en place.</li>
<li style="${G.LI}"><strong>Le corps&nbsp;:</strong> une douleur dentaire, un rhume, un
changement de traitement, une mauvaise nuit. On ne diagnostique rien, on note simplement
que quelque chose a changé.</li>
<li style="${G.LI}"><strong>La famille&nbsp;:</strong> un retour de week-end, une visite
annulée, un appel qui n’a pas eu lieu.</li>
<li style="${G.LI}"><strong>Le relevé lui-même&nbsp;:</strong> si la courbe fait un bond le
jour où l’initiale de la colonne «&nbsp;qui relève&nbsp;» change, ce n’est probablement pas
le comportement qui a bougé.</li>
</ul>

<h3 style="${G.H3}">5. Décider, et le dire</h3>
${ARRET}

<p>Quelle que soit la décision, elle s’écrit en trois lignes dans le dossier&nbsp;: ce qui
a été mesuré, sur quelle période, et ce qu’on en conclut — <strong>y compris quand la
conclusion est «&nbsp;on ne peut pas conclure&nbsp;»</strong>. C’est la phrase la plus utile
que vous puissiez laisser à l’équipe suivante, et c’est celle qu’on n’écrit jamais.</p>

${G.alerte(
  'La personne a le droit de savoir qu’on la relève, et de lire ce qu’on écrit',
  `L’article L311-3 du code de l’action sociale et des familles range l’accès à toute
information ou document relatif à sa prise en charge parmi les droits de la personne
accompagnée. Une courbe la concernant en fait partie.
<br><br>Concrètement&nbsp;: on lui dit ce qu’on compte et pourquoi, dans des mots qu’elle
comprend, et on le dit à ses parents ou à son représentant légal. Ce n’est pas seulement
une obligation&nbsp;: dans beaucoup de situations, le dire fait partie de ce qui marche —
surtout avec un adolescent ou un adulte, qui peut alors regarder sa propre courbe avec vous.`,
)}`,
  aRetenir:
    'Niveau, pente, variabilité — dans cet ordre. Trois points consécutifs hors de la zone habituelle font un signal, jamais une conclusion. Et une courbe plate accuse l’hypothèse, pas la personne.',
  exercice: {
    nom: 'La lecture de votre courbe',
    duree: '20 minutes, avec votre feuille sous les yeux',
    quoi: 'Trois lignes écrites dans le dossier, et une décision.',
    etapes: [
      'Calculez la médiane d’avant et la médiane d’après. Écrivez les deux nombres côte à côte.',
      'Regardez si la ligne de base avait déjà une pente. Si oui, écrivez-le&nbsp;: c’est ce qui vous empêchera de vous attribuer un progrès qui était en route.',
      'Comparez l’épaisseur du nuage avant et après. Les journées extrêmes ont-elles disparu&nbsp;?',
      'Appliquez la règle des trois points&nbsp;: combien de points consécutifs sont sortis de la zone de la ligne de base&nbsp;?',
      'Relisez la colonne «&nbsp;inhabituel&nbsp;» sur toute la période, et barrez toute conclusion qu’une des cinq causes de la fiche&nbsp;5 pourrait expliquer.',
      'Écrivez les trois lignes, et entourez la décision&nbsp;: arrêter, espacer, continuer, ou reprendre l’hypothèse à zéro.',
    ],
    reussi:
      'C’est réussi quand vos trois lignes tiennent devant quelqu’un qui n’était pas là — et qu’elles disent «&nbsp;on ne peut pas conclure&nbsp;» si c’est le cas.',
  },
  carnet: {
    intro: 'Le carnet du module 4&nbsp;: ce qui part dans le dossier.',
    lignes: [
      'Ce qui a été mesuré, et sur quelle période',
      'Médiane avant / médiane après',
      'La ligne de base avait-elle déjà une pente&nbsp;?',
      'Ce que dit la colonne «&nbsp;inhabituel&nbsp;»',
      'La conclusion, y compris «&nbsp;on ne peut pas conclure&nbsp;»',
      'La décision&nbsp;: arrêter, espacer, continuer, reprendre',
      'Ce qui a été dit à la personne, et quand',
    ],
  },
  vigilance: [
    'Conclure sur trois jours. C’est le défaut que ce parcours existe pour réparer, et il revient à chaque fois qu’on est pressé.',
    'Regarder la pente sans regarder si elle était déjà là avant.',
    'Prendre une courbe plate pour un échec de la personne. C’est l’hypothèse qui est en cause, et c’est là que ça se répare.',
    'Oublier la colonne «&nbsp;inhabituel&nbsp;» au moment de conclure. La moitié des variations spectaculaires y sont expliquées.',
    'Mesurer quelqu’un sans le lui dire. C’est un droit, c’est l’article L311-3, et le dire fait souvent partie de ce qui marche.',
    'Continuer à relever indéfiniment. Une mesure qui ne s’arrête jamais devient une habitude de service, et plus personne ne sait à quelle question elle répond.',
  ],
  annexes: 'les fiches 4, 5 et 6 (lire la courbe, ce qui la fait mentir, quand arrêter)',
  quiz: Q[3],
  avant: [
    'Vos trois lignes sont écrites, et la décision est entourée.',
    'Vous savez ce que vous direz en réunion, y compris si c’est «&nbsp;on ne peut pas conclure&nbsp;».',
    'La personne, et sa famille, savent ce qui a été relevé.',
  ],
};

/* ── ANNEXES ─────────────────────────────────────────────────────────────── */

const ANNEXES =
  A.entete('Mesurer un comportement : ligne de base et courbe') +
  A.fiche({
    numero: 1,
    titre: 'Choisir son unité',
    quand: 'au moment de décider ce qu’on va relever, avant d’imprimer quoi que ce soit.',
    contenu: A.tableau(
      ['Ce qui pose problème', 'Unité', 'Ce qu’on écrit sur la feuille', 'Le piège'],
      [
        [
          'Ça revient trop souvent',
          '<strong>Fréquence</strong>',
          'Un nombre&nbsp;: combien de fois sur le créneau.',
          'Le créneau doit être rigoureusement le même tous les jours, sinon les nombres ne se comparent pas.',
        ],
        [
          'Ça dure trop longtemps',
          '<strong>Durée</strong>',
          'Des minutes, du début à la fin.',
          'Il faut avoir défini ce qui compte comme «&nbsp;la fin&nbsp;», sinon deux personnes chronomètrent deux choses.',
        ],
        [
          'Ça met trop de temps à démarrer',
          '<strong>Latence</strong>',
          'Des minutes entre la consigne et le premier geste.',
          'La consigne doit être donnée de la même façon&nbsp;; sinon on mesure la consigne, pas la latence.',
        ],
        [
          'C’est l’ampleur qui change tout',
          '<strong>Question fermée</strong>',
          'Oui / non. «&nbsp;A-t-il fallu faire sortir les autres&nbsp;?&nbsp;»',
          'Une échelle de 1 à 5 sans niveaux décrits par des faits ne donne pas des données, seulement des chiffres.',
        ],
      ],
    ),
  }) +
  A.fiche({
    numero: 2,
    titre: 'La feuille de relevé, à recopier',
    quand: 'aujourd’hui. Elle se retrace à la main en une minute sur une A4, et elle s’affiche.',
    contenu: `${A.tableau(
      ['Date', 'Qui', 'Mesure', 'Créneau respecté', 'Inhabituel (3 mots)', 'Question fermée'],
      [
        ['__ / __', '__', '____', 'oui / non', '________________', 'oui / non'],
        ['__ / __', '__', '____', 'oui / non', '________________', 'oui / non'],
        ['__ / __', '__', '____', 'oui / non', '________________', 'oui / non'],
        ['__ / __', '__', '____', 'oui / non', '________________', 'oui / non'],
        ['__ / __', '__', '____', 'oui / non', '________________', 'oui / non'],
      ],
    )}
<p style="margin-top:14px"><strong>En tête de feuille, trois lignes à écrire une fois
pour toutes&nbsp;:</strong></p>
<ul style="${G.UL}">
<li style="${G.LI}">Le comportement, tel qu’une caméra l’aurait filmé.</li>
<li style="${G.LI}">L’unité et le créneau exact.</li>
<li style="${G.LI}">Ligne de base du __/__ au __/__ &nbsp;·&nbsp; changement mis en place le __/__ &nbsp;:&nbsp; ____________</li>
</ul>
<p><strong>Dix lignes minimum.</strong> Un jour à zéro s’écrit «&nbsp;0&nbsp;», un jour non
relevé s’écrit «&nbsp;non relevé&nbsp;». Les deux ne sont pas la même chose et il sera
impossible de les distinguer plus tard.</p>`,
  }) +
  A.fiche({
    numero: 3,
    titre: 'Le test d’accord entre deux observateurs',
    quand: 'une fois, avant le premier jour de relevé, dès que plusieurs personnes relèvent.',
    contenu: `<ul style="${G.UL}">
<li style="${G.LI}">Deux personnes, le même créneau, <strong>chacune sa feuille</strong>.</li>
<li style="${G.LI}">Aucune parole pendant, aucun regard sur la feuille de l’autre.</li>
<li style="${G.LI}">À la fin, on pose les deux nombres côte à côte.</li>
</ul>
${A.tableau(
  ['Écart entre les deux nombres', 'Ce que ça veut dire', 'Ce qu’on fait'],
  [
    ['0 ou 1', 'La définition tient.', 'On commence le relevé.'],
    [
      '2 ou plus',
      'La définition laisse de la place à l’interprétation. Personne n’a mal regardé.',
      'On compare ce que chacun a compté, on réécrit la définition ensemble, on refait le test le lendemain.',
    ],
    [
      'Écart énorme (du simple au double)',
      'Les deux personnes ne parlent pas du même comportement.',
      'On repart de la description filmable, et on nomme explicitement ce qui NE compte PAS.',
    ],
  ],
)}
<p style="margin-top:14px"><strong>Cette discussion est souvent le moment le plus utile du
parcours&nbsp;:</strong> elle fait apparaître que l’équipe ne mettait pas la même chose
derrière le même mot. C’était déjà vrai avant le relevé — c’était simplement invisible.</p>`,
  }) +
  A.fiche({
    numero: 4,
    titre: 'Lire une courbe en trois questions',
    quand: 'devant la feuille quadrillée, au moment de conclure.',
    contenu: A.tableau(
      ['Question', 'Comment on regarde', 'Ce qu’on peut dire', 'Ce qu’on ne peut pas dire'],
      [
        [
          '<strong>1. Le niveau</strong>',
          'Médiane des dix jours d’avant, médiane des dix jours d’après.',
          'Le niveau a baissé / monté / n’a pas bougé.',
          'Rien, si le nouveau niveau est encore dans l’intervalle qu’occupait la ligne de base.',
        ],
        [
          '<strong>2. La pente</strong>',
          'La ligne de base montait-elle, descendait-elle, ou était-elle plate&nbsp;?',
          'Le mouvement s’est accentué / inversé / a commencé.',
          '«&nbsp;Ça descend donc ça marche&nbsp;», quand la ligne de base descendait déjà.',
        ],
        [
          '<strong>3. La variabilité</strong>',
          'L’épaisseur du nuage de points, avant et après.',
          'Les journées extrêmes ont disparu — c’est un vrai progrès même à niveau égal.',
          'Que rien n’a changé, au seul motif que la moyenne est la même.',
        ],
      ],
    ),
  }) +
  A.fiche({
    numero: 5,
    titre: 'Ce qui fait mentir une courbe',
    quand: 'avant de conclure, en relisant la colonne «&nbsp;inhabituel&nbsp;» sur toute la période.',
    contenu: A.tableau(
      ['Cause', 'À quoi ça ressemble sur la courbe', 'Comment on vérifie'],
      [
        [
          '<strong>Le calendrier</strong>',
          'Une chute nette qui commence un vendredi et remonte quinze jours plus tard.',
          'Vacances scolaires, ponts, fêtes. C’est la cause n°1, et de loin.',
        ],
        [
          '<strong>Les personnes</strong>',
          'Un palier qui démarre le jour où quelqu’un part en arrêt.',
          'La colonne «&nbsp;qui relève&nbsp;» et le planning de l’équipe.',
        ],
        [
          '<strong>Le corps</strong>',
          'Deux ou trois jours très au-dessus, sans rien d’autre.',
          'Douleur, rhume, mauvaise nuit, changement de traitement. On le note, on ne diagnostique rien.',
        ],
        [
          '<strong>La famille</strong>',
          'Un pic régulier, toujours le même jour de la semaine.',
          'Retours de week-end, visites, appels prévus ou annulés.',
        ],
        [
          '<strong>Le relevé lui-même</strong>',
          'Un bond le jour où l’initiale change dans la colonne «&nbsp;qui&nbsp;».',
          'Refaites un test d’accord. Ce n’est probablement pas le comportement qui a bougé.',
        ],
      ],
    ),
  }) +
  A.fiche({
    numero: 6,
    titre: 'Quand arrêter de mesurer',
    quand: 'toutes les trois ou quatre semaines, pour que le relevé ne devienne pas une habitude de service.',
    contenu: A.tableau(
      ['Situation', 'Décision', 'Ce qu’on écrit'],
      [
        [
          'Le comportement ne coûte plus rien à la personne.',
          '<strong>Arrêter.</strong>',
          '«&nbsp;Relevé arrêté le __/__ : l’objectif du module 1 n’a plus lieu d’être.&nbsp;»',
        ],
        [
          'Ça tient depuis trois semaines au nouveau niveau.',
          '<strong>Espacer.</strong>',
          '«&nbsp;Passage à un relevé hebdomadaire, une journée par semaine, à compter du __/__.&nbsp;»',
        ],
        [
          'La courbe bouge encore, dans un sens ou dans l’autre.',
          '<strong>Continuer.</strong>',
          'Rien de particulier — on garde le rythme.',
        ],
        [
          'Rien n’a bougé en quatre semaines.',
          '<strong>Reprendre l’hypothèse à zéro.</strong>',
          '«&nbsp;Dispositif sans effet mesurable sur 4 semaines. L’hypothèse de départ est à revoir — retour à l’analyse des fonctions.&nbsp;»',
        ],
        [
          'Ça s’est dégradé nettement et durablement.',
          '<strong>Arrêter le dispositif, garder le relevé.</strong>',
          '«&nbsp;Dispositif retiré le __/__ : dégradation sur __ jours consécutifs. Relevé maintenu.&nbsp;»',
        ],
      ],
    ),
  }) +
  A.fiche({
    numero: 7,
    titre: 'Ce qu’on ne mesure jamais',
    quand: 'à afficher en salle d’équipe, et à relire avant d’ouvrir une nouvelle feuille.',
    contenu: `<ul style="${G.UL}">
<li style="${G.LI}"><strong>Un comportement qui ne gêne que l’équipe.</strong> Si la
réponse honnête à «&nbsp;à qui ça coûte&nbsp;?&nbsp;» est «&nbsp;à nous&nbsp;», la feuille
qu’on s’apprête à ouvrir est un outil de surveillance avec l’apparence d’un outil
clinique.</li>
<li style="${G.LI}"><strong>Une personne.</strong> On mesure un comportement, dans un
contexte, sur une période. Jamais quelqu’un. Un chiffre accolé à un nom est recopié dans
le dossier suivant et devient une caractéristique.</li>
<li style="${G.LI}"><strong>Un mot.</strong> «&nbsp;Agressivité&nbsp;»,
«&nbsp;opposition&nbsp;», «&nbsp;régression&nbsp;» ne se comptent pas. Ce qu’on compte,
c’est ce qu’une caméra aurait enregistré.</li>
<li style="${G.LI}"><strong>Sans le dire à la personne.</strong> L’article L311-3 du CASF
lui donne accès à toute information relative à sa prise en charge. Une courbe la concernant
en fait partie — et le dire fait souvent partie de ce qui marche.</li>
<li style="${G.LI}"><strong>Pour comparer deux personnes.</strong> Deux courbes ne se
superposent pas&nbsp;: elles n’ont ni le même comportement derrière, ni le même contexte,
ni le même relevé. Une comparaison entre usagers n’a aucun sens et produit des décisions
injustes.</li>
<li style="${G.LI}"><strong>Pour évaluer un professionnel.</strong> Le jour où une courbe
sert à juger celui qui accompagne, les relevés deviennent faux dans la semaine — et c’est
rationnel de leur part.</li>
</ul>`,
  }) +
  A.pied();

module.exports = {
  uuid: '991df2ab-a898-44b7-88c7-c1436cb02bed',
  slug: 'mesurer-un-comportement-ligne-de-base',
  modules: [
    { titre: 'Module 1 — Ce qu’on mesure, et ce qu’on ne mesure pas', minutes: 12, html: G.assembler(M1) },
    { titre: 'Module 2 — La ligne de base, et pourquoi on ne change rien pendant', minutes: 10, html: G.assembler(M2) },
    { titre: 'Module 3 — Exercice guidé : la feuille, le test, les dix jours', minutes: 12, html: G.assembler(M3) },
    { titre: 'Module 4 — Lire la courbe : progrès, variation, ou rien', minutes: 12, html: G.assembler(M4) },
  ],
  annexes: ANNEXES,
};
