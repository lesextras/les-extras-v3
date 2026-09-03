/**
 * FORMATION 3 — Guider puis s'effacer (contenu enrichi v3).
 * Compétence unique : doser une aide, puis la retirer selon un plan décidé à
 * l'avance. C'est la formation qui répond à « il n'y arrive que si quelqu'un
 * est à côté ».
 */

const G = require('./gabarit-v3.js');
const A = require('./annexes.js');

const ECHELLE = A.tableau(
  ['Niveau', "L'aide, du plus léger au plus lourd", 'Ce qu’elle coûte à retirer'],
  [
    ['0', '<strong>Rien.</strong> La consigne, puis le silence.', '—'],
    ['1', '<strong>Indice de position.</strong> Vous vous placez près de l’objet utile, ou vous regardez dans sa direction.', 'Très facile : on s’éloigne.'],
    ['2', '<strong>Indice visuel.</strong> Vous montrez du doigt, ou vous tapotez l’objet.', 'Facile : le geste rétrécit, puis disparaît.'],
    ['3', '<strong>Indice verbal indirect.</strong> «&nbsp;Et après&nbsp;?&nbsp;», «&nbsp;Qu’est-ce qui vient&nbsp;?&nbsp;»', 'Moyen : la phrase raccourcit.'],
    ['4', '<strong>Consigne verbale directe.</strong> «&nbsp;Prends le savon.&nbsp;»', 'Difficile : elle devient vite une habitude d’adulte.'],
    ['5', '<strong>Démonstration.</strong> Vous faites devant, la personne refait.', 'Difficile : suppose de refaire la tâche à chaque fois.'],
    ['6', '<strong>Guidance physique partielle.</strong> Vous touchez le coude, vous initiez le geste.', 'Très difficile : le contact devient le signal de départ.'],
    ['7', '<strong>Guidance physique complète.</strong> Vous conduisez la main du début à la fin.', 'Le plus difficile de tous. À n’utiliser qu’en dernier recours et jamais durablement.'],
  ],
);

const M1 = {
  reperes: {
    minutes: 12,
    prerequis: 'aucun, mais la formation « Décomposer une routine en étapes » se marie bien avec celle-ci.',
    evaluation: 'les trois critères «&nbsp;Avant de passer au module suivant&nbsp;», que vous cochez vous-même, et le livrable «&nbsp;Mon carnet de séance&nbsp;». Ni examen, ni note&nbsp;: ce sont des productions, pas des questions de connaissance.',
  },
  objectifs: [
    'Classer les aides du plus léger au plus lourd et nommer celle que vous utilisez <em>réellement</em>',
    'Appliquer la règle du délai : un temps de silence avant toute aide',
    'Comprendre pourquoi une aide efficace jamais retirée produit une dépendance',
    'Distinguer une aide qui enseigne d’une aide qui remplace la personne',
    'Savoir qu’un plan d’estompage se décide <strong>avant</strong> de commencer — y compris par quelle extrémité de l’échelle on part',
    'Coter une séance réelle : noter le niveau d’aide le plus lourd utilisé, pas le premier',
  ],
  corps: `<h3 style="${G.H3}">1. Le seul outil éducatif qui devient nuisible quand il marche trop bien</h3>
<p>L’aide est ce qu’il y a de plus naturel&nbsp;: quelqu’un n’y arrive pas, on l’aide,
ça marche, tout le monde est content. Le problème n’apparaît pas quand l’aide échoue —
il apparaît quand elle réussit, longtemps, et que personne ne l’a jamais retirée.</p>
<p>Ce qui s’installe alors s’appelle une <strong>dépendance à l’aide</strong>. La
personne n’exécute plus la tâche&nbsp;: elle exécute la tâche <em>en présence d’un
adulte qui donne le signal</em>. Retirez l’adulte, tout s’arrête. Et ce n’est pas la
personne qui a échoué&nbsp;: c’est l’aide qui n’a jamais été conçue pour partir.</p>
<p>Le plus injuste vient après. Six mois ou trois ans plus tard, on écrit dans un
rapport&nbsp;: «&nbsp;n’a pas acquis l’autonomie&nbsp;», «&nbsp;ne fait rien sans
sollicitation&nbsp;». On reproche à la personne exactement ce que l’organisation lui a
enseigné.</p>

<h3 style="${G.H3}">2. L’échelle des aides — et pourquoi l’ordre compte</h3>
<p>Toutes les aides ne se valent pas, et surtout&nbsp;: <strong>elles ne coûtent pas la
même chose à retirer</strong>. C’est ce dernier point qui doit guider le choix, pas
l’efficacité immédiate.</p>
${ECHELLE}
<p><strong>La règle&nbsp;: on utilise le niveau le plus bas qui débloque.</strong> Pas
celui qui marche à coup sûr, pas celui qui va le plus vite — le plus léger. Une aide de
niveau 6 donnée «&nbsp;pour gagner du temps&nbsp;» se paie pendant des mois.</p>
<p><strong>Une exception, et elle est décisive.</strong> Cette règle vaut pour une tâche que
la personne réussit <em>déjà</em>, au moins parfois. Pour une compétence entièrement
nouvelle — ou quand des échecs répétés ont déjà installé un évitement —, on fait exactement
l’inverse&nbsp;: on part d’une aide franchement suffisante pour que ça réussisse dès le
premier essai, et on la retire ensuite cran par cran. On appelle cela «&nbsp;du plus lourd
au plus léger&nbsp;», ou apprentissage sans erreur. Le choix se pose en une
question&nbsp;: <em>est-ce que ça réussit parfois tout seul aujourd’hui&nbsp;?</em> Si oui,
partez du plus léger et remontez si besoin. Si non, partez du niveau qui fait réussir et
descendez. Dans les deux cas, la suite est la même&nbsp;: un plan de retrait écrit à
l’avance.</p>

${G.exemple(
  'Coter une séance, pas un geste',
  `<p><strong>La règle&nbsp;: on note le niveau le plus lourd utilisé dans la séance.</strong>
Une séance qui commence par un regard et finit par une main sur le coude se note 6, pas 1.</p>
<p><em>Exemple.</em> 8&nbsp;h&nbsp;02, consigne «&nbsp;tu te brosses les dents&nbsp;».
Silence, cinq secondes comptées, rien. Je regarde la brosse <em>(1)</em>. Rien. Je la montre
du doigt <em>(2)</em>. Rien. Je pose la main sur son coude et j’amorce le geste <em>(6)</em>.
<strong>Je note 6.</strong></p>
<p style="margin-bottom:0">Et si le niveau change dans la journée, on note la séance
choisie — toujours la même, à la même heure.</p>`,
)}

<h3 style="${G.H3}">3. La règle du délai : cinq secondes de silence</h3>
<p>C’est la partie la plus simple à énoncer et la plus difficile à tenir&nbsp;: après
la consigne, on se tait cinq secondes avant d’aider. Cinq secondes, c’est long. C’est
même très long quand un groupe attend et qu’il est huit heures moins dix.</p>
<p>Et pourtant, c’est ce silence qui contient l’apprentissage. L’aide donnée à la
deuxième seconde n’enseigne rien&nbsp;: elle arrive avant que la personne ait eu le
temps de chercher. Répétée cent fois, elle enseigne même l’inverse — <em>ne cherche
pas, quelqu’un va faire</em>.</p>

${G.exemple(
  'Comptez, ne ressentez pas',
  `<p style="margin-bottom:0">Cinq secondes ressenties, c’est deux secondes réelles.
Comptez-les dans votre tête, une-mille-deux-mille, ou regardez une trotteuse. La
première semaine, la plupart des professionnels découvrent qu’ils aidaient au bout
d’une seconde et demie.</p>`,
)}

<h3 style="${G.H3}">4. Deux aides qui n’ont rien à voir</h3>
<ul style="${G.UL}">
<li style="${G.LI}"><strong>L’aide qui enseigne</strong> est temporaire, la plus légère
possible, et elle a une date de retrait décidée à l’avance. Elle sert à faire réussir
maintenant pour ne plus être nécessaire ensuite.</li>
<li style="${G.LI}"><strong>L’aide qui remplace</strong> est confortable, elle marche
tout de suite, et personne n’a prévu de l’enlever. Elle sert à faire avancer la journée.</li>
</ul>
<p>Les deux sont légitimes&nbsp;: il y a des matins où l’on habille quelqu’un parce
qu’il faut partir, et c’est très bien. Ce qui pose problème, c’est de croire qu’on
enseigne alors qu’on remplace. La différence tient à une seule chose&nbsp;: <strong>un
plan de retrait écrit</strong>.</p>

${G.alerte(
  'Ce que l’estompage n’est pas',
  `<p>Ce n’est pas «&nbsp;laisser se débrouiller pour voir&nbsp;». Retirer une aide sans
plan produit un échec, et un échec répété produit de l’évitement — c’est-à-dire
exactement le comportement qu’on cherchait à éviter.</p>
<p style="margin-bottom:0">Ce n’est pas non plus une course. Une aide retirée trop vite
se remet, sans drame. La seule chose qui ne se rattrape pas, c’est une aide qu’on n’a
jamais commencé à retirer.</p>`,
)}

<h3 style="${G.H3}">5. Le plan d’estompage se décide avant</h3>
<p>Trois éléments, et ils s’écrivent avant la première séance&nbsp;:</p>
<ul style="${G.UL}">
<li style="${G.LI}"><strong>Le niveau de départ.</strong> Celui qui fait réussir
aujourd’hui, pas celui qu’on aimerait.</li>
<li style="${G.LI}"><strong>Le critère de passage.</strong> Ce qui autorise à descendre
d’un cran — par exemple&nbsp;: réussi à ce niveau trois fois de suite.</li>
<li style="${G.LI}"><strong>Le niveau d’arrivée.</strong> Souvent le niveau&nbsp;0, mais
pas toujours&nbsp;: un indice visuel définitif est une aide légitime, ce n’est pas un
échec.</li>
</ul>
<p>Décidé sur le moment, le critère se déplace toujours dans le même sens&nbsp;: celui
de la fatigue de l’adulte. Écrit à l’avance, il tient.</p>`,
  aRetenir:
    'Choisissez l’aide <strong>la plus légère qui débloque</strong>, pas celle qui marche le mieux&nbsp;: c’est le coût du retrait, pas l’efficacité immédiate, qui doit décider.',
  exercice: {
    nom: 'Le niveau réel',
    duree: '10 minutes',
    quoi:
      'On ne travaille pas sur le niveau d’aide qu’on croit donner, mais sur celui qu’on donne vraiment. L’écart est souvent de deux crans.',
    etapes: [
      'Choisissez une tâche que vous accompagnez tous les jours et qui « ne marche que si vous êtes là ».',
      'Demain, faites-la comme d’habitude — sans rien changer — et notez juste après, sur l’échelle de 0 à 7, le niveau que vous avez réellement donné.',
      'Notez aussi combien de secondes vous avez attendu avant d’aider. Comptez-les, ne les estimez pas.',
      'Recommencez le surlendemain. Deux mesures valent mieux qu’une : le premier jour, on se surveille et on fausse la mesure.',
      'Écrivez enfin la phrase : « aujourd’hui, j’aide au niveau ……… après ……… secondes ». C’est votre point de départ.',
    ],
    reussi:
      'vous avez un numéro de niveau et un nombre de secondes, mesurés deux fois — pas estimés de mémoire.',
  },
  carnet: {
    intro: 'Ouvrez une page et gardez-la pendant tout le parcours.',
    lignes: [
      '<strong>La tâche choisie</strong> — une seule, quotidienne.',
      '<strong>Mon niveau réel</strong> — un numéro de 0 à 7, mesuré deux fois.',
      '<strong>Mon délai réel</strong> — en secondes, compté.',
      '<strong>Ce que je fais quand ça ne vient pas</strong> — décrit tel que je le fais vraiment.',
    ],
  },
  vigilance: [
    '<strong>Une aide n’est pas une faute.</strong> Ce module ne demande pas d’aider moins, il demande de savoir à quel niveau on aide et d’avoir prévu la suite.',
    '<strong>Le contact physique est le niveau le plus coûteux à retirer.</strong> Il devient très vite le signal de départ de la tâche. Réservez-le aux situations où rien d’autre ne débloque, et prévoyez son retrait dès le premier jour.',
    '<strong>Certaines aides restent, et c’est très bien.</strong> Une liste affichée, un minuteur, un repère de couleur ne sont pas des échecs&nbsp;: ce sont des aménagements. On ne cherche pas la performance sans support, on cherche l’autonomie.',
    '<strong>Ne mesurez pas le jour d’une crise ou d’un changement.</strong> Vous mesureriez le contexte, pas l’aide.',
  ],
  annexes:
    'l’<strong>échelle des aides de 0 à 7</strong> à imprimer, la <strong>fiche de mesure du niveau réel</strong>, et un <strong>mémo sur la règle du délai</strong>.',
  avant: [
    'Je peux nommer les niveaux d’aide et dire lequel je donne réellement.',
    'J’ai compté mon délai en secondes, deux fois, sur une vraie situation.',
    'J’ai écrit, pour ma tâche, s’il existe aujourd’hui un plan de retrait de l’aide : oui ou non.',
  ],
};

const M2 = {
  reperes: {
    minutes: 10,
    prerequis: 'le module 1 — l’échelle des aides et la règle du délai.',
    evaluation: 'votre analyse écrite de la scène, comparée à celle du module.',
  },
  objectifs: [
    'Repérer le moment exact où une aide utile est devenue une dépendance',
    'Comprendre pourquoi une aide « qui marche très bien » est un signal d’alerte',
    'Identifier ce qui, dans les écrits professionnels, transforme une dépendance en défaut de la personne',
    'Formuler le plan qui aurait dû exister dès le premier jour',
  ],
  corps: `<h3 style="${G.H3}">1. Une aide qui a très bien marché pendant six mois</h3>
<p>Cette scène ne contient aucune erreur visible. C’est ce qui la rend utile&nbsp;: la
plupart des dépendances s’installent sans que personne ne fasse rien de mal.</p>

<div style="${G.GRIS}">
<p><em>Un SESSAD. Inès, 8&nbsp;ans, scolarisée en CE1 avec une AESH. Objectif du
projet&nbsp;: sortir son matériel seule en début de cours.</em></p>
<p><em>Septembre. Inès ne sort rien. L’AESH s’assoit à côté, ouvre le cartable avec elle,
lui met le cahier dans les mains. Ça fonctionne, Inès travaille.</em></p>
<p><em>Octobre. L’AESH n’ouvre plus le cartable, elle pose la main sur le bras d’Inès et
dit «&nbsp;on sort le cahier&nbsp;». Inès le fait. C’est un progrès, tout le monde le
note.</em></p>
<p><em>Janvier. Même geste, même phrase, tous les jours. Inès sort son cahier
immédiatement dès que la main se pose. L’équipe est satisfaite&nbsp;: «&nbsp;elle a
compris&nbsp;».</em></p>
<p><em>Mars. L’AESH est absente trois jours. Inès ne sort rien. Elle attend, cartable
fermé, pendant tout le cours. L’enseignante finit par le faire à sa place.</em></p>
<p><em>Juin, bilan écrit&nbsp;: «&nbsp;Inès n’a pas acquis l’autonomie dans la
préparation du matériel. Elle reste dépendante de l’adulte.&nbsp;»</em></p>
</div>

<h3 style="${G.H3}">2. Arrêtez-vous ici — cinq minutes, de quoi écrire</h3>
<ul style="${G.UL}">
<li style="${G.LI}">À quel moment précis l’aide a-t-elle cessé d’enseigner&nbsp;?</li>
<li style="${G.LI}">Qu’est-ce qu’Inès a réellement appris entre octobre et mars&nbsp;?</li>
<li style="${G.LI}">La phrase du bilan de juin est-elle exacte&nbsp;?</li>
</ul>

${G.FILET}

<h3 style="${G.H3}">3. L’analyse</h3>
<p><strong>L’aide a cessé d’enseigner en octobre</strong> — au moment précis où elle
s’est mise à fonctionner parfaitement. Tant qu’elle progressait (de l’ouverture du
cartable à la main sur le bras), elle enseignait. À partir du moment où elle est
restée identique cinq mois, elle est devenue une partie de la tâche.</p>
<p><strong>Ce qu’Inès a appris&nbsp;:</strong> «&nbsp;on sort le cahier quand une main
se pose sur mon bras&nbsp;». Elle a parfaitement appris — mais elle a appris la
mauvaise séquence. Le déclencheur n’est pas le début du cours, c’est le contact.
Enlevez le contact, il ne reste rien. Et c’est logique&nbsp;: personne ne lui a jamais
enseigné à démarrer sans lui.</p>
<p><strong>La phrase du bilan est fausse</strong>, et elle est lourde de conséquences.
«&nbsp;Elle reste dépendante de l’adulte&nbsp;» décrit un trait d’Inès. La formulation
juste serait&nbsp;: «&nbsp;l’aide mise en place en septembre n’a pas été estompée&nbsp;;
la séquence enseignée comporte l’aide de l’adulte&nbsp;». La première phrase suit Inès
d’un dossier à l’autre pendant des années. La seconde décrit un dispositif, et un
dispositif se corrige.</p>

${G.alerte(
  'Le signal d’alerte, c’est la stabilité',
  `<p style="margin-bottom:0">Une aide qui n’a pas changé depuis trois mois est une aide
qui a cessé d’enseigner, même si tout se passe bien — <em>surtout</em> si tout se passe
bien. La question à poser en réunion n’est pas «&nbsp;est-ce que ça marche&nbsp;?&nbsp;»
mais «&nbsp;à quel niveau aidions-nous il y a trois mois, et à quel niveau
aujourd’hui&nbsp;?&nbsp;». Si la réponse est la même, il n’y a pas eu d’apprentissage.</p>`,
)}

<h3 style="${G.H3}">4. Ce qui aurait dû exister dès septembre</h3>
<p>Une seule chose manquait, et elle tient en quatre lignes sur une feuille&nbsp;:</p>
<div style="${G.GRIS}">
<ul style="${G.UL}">
<li style="${G.LI}"><strong>Niveau de départ&nbsp;:</strong> 6 — guidance physique
partielle (ouverture du cartable à deux).</li>
<li style="${G.LI}"><strong>Critère de passage&nbsp;:</strong> réussi trois jours de
suite → on descend d’un cran.</li>
<li style="${G.LI}"><strong>Niveau d’arrivée&nbsp;:</strong> 1 — l’AESH est présente
dans la classe, sans intervenir au démarrage.</li>
<li style="${G.LI}"><strong>Date de revue&nbsp;:</strong> tous les quinze jours,
noté dans le cahier de liaison.</li>
</ul>
</div>
<p>Avec ce plan, l’absence de mars n’aurait pas été une catastrophe&nbsp;: elle aurait
été un test. Et le bilan de juin aurait porté un nombre — «&nbsp;passée du niveau 6 au
niveau 2 en neuf mois&nbsp;» — au lieu d’un jugement.</p>

<h3 style="${G.H3}">5. Défaire une dépendance installée</h3>
<p>Si vous reconnaissez votre situation dans celle d’Inès, la bonne nouvelle est qu’on
ne repart pas de zéro. On reprend le plan là où il aurait dû être écrit&nbsp;:</p>
<ul style="${G.UL}">
<li style="${G.LI}"><strong>Mesurez le niveau actuel</strong> sans chercher à le
justifier.</li>
<li style="${G.LI}"><strong>Descendez d’UN cran seulement</strong>, et tenez-le une
semaine. Un cran, pas deux&nbsp;: deux crans produisent un échec, et un échec produit
de l’évitement.</li>
<li style="${G.LI}"><strong>Prévenez la personne.</strong> «&nbsp;À partir de lundi, je
ne mettrai plus ma main&nbsp;; je resterai à côté.&nbsp;» Un retrait annoncé est
supportable&nbsp;; un retrait subi est un abandon.</li>
<li style="${G.LI}"><strong>Attendez-vous à une baisse temporaire.</strong> Elle est
normale et elle dure quelques jours.</li>
</ul>`,
  aRetenir:
    'Une aide qui n’a pas changé de niveau depuis trois mois n’enseigne plus rien — <strong>surtout si tout se passe bien</strong>. La stabilité est le signal d’alerte, pas la réussite.',
  exercice: {
    nom: 'La photo d’il y a trois mois',
    duree: '10 minutes',
    quoi:
      'Un exercice de mémoire, et il est plus dur qu’il n’en a l’air : on se souvient très mal du niveau d’aide qu’on donnait.',
    etapes: [
      'Prenez la tâche du module 1. Écrivez le niveau d’aide que vous donnez aujourd’hui.',
      'Cherchez ce que vous donniez il y a trois mois. Fouillez : cahier de liaison, transmissions, compte rendu de réunion, souvenirs d’un collègue.',
      'Si les deux niveaux sont identiques, écrivez-le. C’est le résultat le plus fréquent, et c’est celui qui justifie ce parcours.',
      'Écrivez la phrase de bilan telle qu’elle serait écrite aujourd’hui — puis réécrivez-la en décrivant le dispositif et non la personne. À la maison, prenez la phrase que vous diriez au médecin, à l’enseignant ou à l’équipe si on vous demandait où vous en êtes.',
      'Comparez les deux phrases. C’est cette réécriture qui fait la différence dans un dossier lu par une MDPH ou un juge.',
    ],
    reussi:
      'vous avez deux niveaux (aujourd’hui et il y a trois mois) et deux phrases de bilan — celle qui décrit la personne, et celle qui décrit le dispositif.',
  },
  carnet: {
    intro: 'Quatre lignes, à ajouter à la page du module 1.',
    lignes: [
      '<strong>Mon niveau aujourd’hui</strong> — un numéro.',
      '<strong>Mon niveau il y a trois mois</strong> — un numéro, ou « je ne sais pas », qui est déjà une information.',
      '<strong>La phrase de bilan spontanée</strong> — celle qui décrit la personne.',
      '<strong>La phrase réécrite</strong> — celle qui décrit le dispositif.',
    ],
  },
  vigilance: [
    '<strong>Ce module n’accuse personne.</strong> L’AESH d’Inès a fait un travail sérieux&nbsp;; ce qui manquait était un plan, et le plan n’est pas de sa responsabilité seule.',
    '<strong>Attention aux écrits.</strong> « Reste dépendant de l’adulte » est une phrase qui suit une personne pendant des années. Décrivez le dispositif, pas le caractère.',
    '<strong>Ne retirez jamais deux crans d’un coup</strong>, même si vous êtes en retard. L’échec produit de l’évitement, et l’évitement coûte bien plus cher que la lenteur.',
    '<strong>Une absence d’AESH ou d’éducateur n’est pas un test valable</strong> si elle n’a pas été préparée. C’est une rupture, pas une mesure.',
  ],
  annexes:
    'la <strong>fiche « photo à trois mois »</strong>, le <strong>tableau des reformulations d’écrits</strong> (décrire le dispositif plutôt que la personne), et le <strong>plan d’Inès</strong> tel qu’il aurait dû être écrit.',
  avant: [
    'Je connais mon niveau d’aide aujourd’hui et, autant que possible, celui d’il y a trois mois.',
    'J’ai réécrit une phrase de bilan pour qu’elle décrive le dispositif et non la personne.',
    'J’ai daté le dernier changement de niveau d’aide sur ma tâche — ou j’ai écrit « je ne sais pas », ce qui est déjà la réponse.',
  ],
};

const M3 = {
  reperes: {
    minutes: 12,
    apres:
      'quinze jours de relevé du niveau d’aide, environ trente secondes par jour. Le module&nbsp;4 se lit le quinzième jour.',
    prerequis: 'les modules 1 et 2, et un niveau d’aide mesuré.',
    evaluation: 'votre plan d’estompage écrit, en quatre lignes.',
  },
  objectifs: [
    'Écrire un plan d’estompage complet : départ, critère, arrivée, revue',
    'Choisir un critère de passage vérifiable, décidé à froid',
    'Prévoir ce qui se passe en cas d’échec, avant qu’il ne survienne',
    'Annoncer le retrait à la personne concernée',
    'Rendre le plan applicable par quelqu’un d’autre que vous',
  ],
  corps: `<h3 style="${G.H3}">1. Quatre lignes, et elles suffisent</h3>
<div style="${G.GRIS}">
<ol style="${G.UL}">
<li style="${G.LI}"><strong>Niveau de départ</strong> — celui que vous donnez
<em>réellement</em>, mesuré, pas estimé.</li>
<li style="${G.LI}"><strong>Critère de passage</strong> — ce qui autorise à descendre
d’un cran.</li>
<li style="${G.LI}"><strong>Niveau d’arrivée</strong> — et il n’est pas toujours zéro.</li>
<li style="${G.LI}"><strong>Date de revue</strong> — celle où l’on regarde le relevé,
qu’on ait avancé ou non.</li>
</ol>
</div>

<h3 style="${G.H3}">2. Le critère de passage — la ligne qui fait tout tenir</h3>
<p>Un bon critère est <strong>vérifiable par n’importe qui</strong> et il ne dépend pas
de l’humeur du jour. Trois formulations qui marchent&nbsp;:</p>
<ul style="${G.UL}">
<li style="${G.LI}">«&nbsp;Réussi <strong>trois fois de suite</strong> à ce niveau.&nbsp;»
C’est le critère standard, et le plus simple à tenir.</li>
<li style="${G.LI}">«&nbsp;Réussi <strong>quatre fois sur cinq</strong> sur la
semaine.&nbsp;» Utile quand la tâche n’a lieu qu’une fois par jour.</li>
<li style="${G.LI}">«&nbsp;Réussi <strong>deux jours de suite avec deux adultes
différents</strong>.&nbsp;» Le meilleur des trois, parce qu’il vérifie que
l’apprentissage n’est pas attaché à une personne — ce qui est précisément le risque de
cette formation. <strong>À la maison&nbsp;:</strong> deux moments différents de la journée,
ou deux jours non consécutifs. Ce n’est pas la personne qui change, c’est le contexte — et
c’est ce que le critère vérifie.</li>
</ul>
<p>Et trois formulations qui ne marchent pas&nbsp;: «&nbsp;quand il sera prêt&nbsp;»,
«&nbsp;quand ce sera acquis&nbsp;», «&nbsp;quand on sentira que c’est le
moment&nbsp;». Aucune n’est vérifiable, et toutes se déplacent avec la fatigue.</p>

${G.exemple(
  'Le critère se décide à froid, sinon il bouge',
  `<p style="margin-bottom:0">Un critère fixé sur le moment se déplace toujours dans le
même sens&nbsp;: celui du confort de l’adulte, un jour où l’on est pressé. Écrit à
l’avance, il tient — et surtout, il permet à un collègue de prendre le relais sans avoir
à décider.</p>`,
)}

<h3 style="${G.H3}">3. Prévoir l’échec avant qu’il arrive</h3>
<p>La personne va rater à un moment ou à un autre, et il faut l’avoir prévu. Attention en
revanche à une idée fausse et très répandue&nbsp;: l’erreur n’enseigne rien par elle-même.
Répétée, elle enseigne surtout à éviter la tâche — c’est le seul vrai danger de ce module.
Ce qui se décide à l’avance, c’est donc <em>ce qu’on fait au moment où ça rate</em>&nbsp;:</p>
<ul style="${G.UL}">
<li style="${G.LI}"><strong>Une fois&nbsp;:</strong> on laisse passer. On aide au
niveau du jour, on ne commente pas, on continue.</li>
<li style="${G.LI}"><strong>Deux fois de suite&nbsp;:</strong> on remonte d’un cran
pour la séance, sans remettre le plan en cause.</li>
<li style="${G.LI}"><strong>Trois fois de suite&nbsp;:</strong> on remonte d’un cran
durablement et on note la date. Le cran suivant était trop grand&nbsp;: coupez-le en
deux.</li>
</ul>
<p>Ces trois lignes évitent la seule vraie catastrophe de l’estompage&nbsp;: la
succession d’échecs, qui transforme une tâche neutre en tâche que la personne évite.</p>

<h3 style="${G.H3}">4. Annoncer le retrait</h3>
<p>Un retrait annoncé est supportable&nbsp;; un retrait subi ressemble à un abandon,
et il en produit les effets. L’annonce tient en une phrase, elle est faite avant, au
calme, et elle est concrète&nbsp;:</p>
<div style="${G.GRIS}">
<p style="margin-bottom:0"><em>«&nbsp;À partir de lundi, je ne mettrai plus ma main sur
ton bras. Je resterai assis à côté de toi. Si tu as besoin, tu me
regardes.&nbsp;»</em></p>
</div>
<p>Trois éléments&nbsp;: ce qui change, ce qui ne change pas, et ce que la personne
peut faire si elle a besoin. Le deuxième élément est le plus important — c’est lui qui
dit que vous ne partez pas.</p>

<h3 style="${G.H3}">5. Le plan doit survivre à votre absence</h3>
<p>Un plan d’estompage qui ne vit que dans votre tête produira exactement la situation
d’Inès. Trois précautions&nbsp;:</p>
<ul style="${G.UL}">
<li style="${G.LI}"><strong>Écrivez le niveau du jour</strong> quelque part que les
autres consultent — cahier de liaison, tableau de l’unité, fiche dans le classeur.</li>
<li style="${G.LI}"><strong>Écrivez ce que l’aide EST</strong> concrètement.
«&nbsp;Niveau 2&nbsp;» ne veut rien dire pour un remplaçant&nbsp;; «&nbsp;on montre du
doigt, on ne touche pas&nbsp;» se comprend tout de suite.</li>
<li style="${G.LI}"><strong>Prévoyez la règle du remplaçant&nbsp;:</strong> quelqu’un
qui ne connaît pas le plan aide au niveau écrit, jamais plus. Sans cette règle, un
remplaçant bienveillant fait la tâche à la place et remet le plan à zéro.</li>
</ul>`,
  aRetenir:
    'Le critère de passage se décide <strong>avant</strong> de commencer, et il doit être vérifiable par quelqu’un d’autre que vous. «&nbsp;Quand il sera prêt&nbsp;» n’est pas un critère, c’est une intention.',
  exercice: {
    nom: 'Le plan en quatre lignes',
    duree: '12 minutes',
    quoi:
      'On écrit le plan complet, y compris ce qu’on fait quand ça rate. Le plan doit être applicable par un collègue qui arrive un samedi.',
    etapes: [
      'Ligne 1 — le niveau de départ, mesuré au module 1. Écrivez le numéro ET ce qu’il veut dire concrètement (« on pose la main sur le coude »).',
      'Ligne 2 — le critère de passage. Prenez de préférence « deux jours de suite avec deux adultes différents ».',
      'Ligne 3 — le niveau d’arrivée. Demandez-vous honnêtement s’il doit être zéro : un indice visuel permanent est souvent la bonne réponse.',
      'Ligne 4 — la date de revue, dans quinze jours, notée dans un agenda partagé.',
      'Ajoutez les trois lignes « en cas d’échec » (une fois / deux fois / trois fois), et la phrase d’annonce à la personne.',
    ],
    reussi:
      'un collègue lit votre feuille et sait exactement quoi faire lundi matin, y compris si ça rate deux fois.',
  },
  carnet: {
    intro: 'Le plan EST le livrable. Recopiez-le au propre : c’est lui qui sera affiché.',
    lignes: [
      '<strong>Les quatre lignes du plan</strong>, avec le niveau traduit en mots.',
      '<strong>Les trois lignes « en cas d’échec »</strong>.',
      '<strong>La phrase d’annonce</strong> — ce qui change, ce qui ne change pas, ce que la personne peut faire.',
      '<strong>Où le plan est écrit</strong> — et qui d’autre y a accès.',
    ],
  },
  vigilance: [
    '<strong>Le niveau d’arrivée n’est pas toujours zéro.</strong> Une liste affichée, un minuteur, un repère de couleur sont des aménagements, pas des échecs.',
    '<strong>Un cran à la fois, jamais deux.</strong> C’est la règle la plus enfreinte, et elle se paie en évitement.',
    '<strong>Sans la règle du remplaçant, le plan tombe le premier week-end.</strong> Écrivez-la.',
    '<strong>Ne lancez pas un estompage la semaine d’un changement</strong> — déménagement, nouvelle classe, nouveau professionnel. Attendez que le reste soit stable.',
  ],
  annexes:
    'le <strong>plan d’estompage en quatre lignes</strong> à remplir, la <strong>fiche « en cas d’échec »</strong>, et un <strong>modèle de phrase d’annonce</strong>.',
  avant: [
    'Mon plan tient en quatre lignes et le niveau y est traduit en mots concrets.',
    'Mon critère de passage est vérifiable par quelqu’un d’autre que moi.',
    'J’ai écrit ce que je fais en cas d’échec une, deux et trois fois de suite.',
  ],
  pause: {
    jours: 'quinze jours',
    texte: `<p>Votre plan d’estompage est écrit&nbsp;: il s’applique maintenant, et il demande <strong>quinze jours</strong> avant de pouvoir être lu. Le module&nbsp;4 se lit le quinzième jour.</p>
<p>Quinze jours, parce qu’un niveau d’aide se lit en moyenne hebdomadaire&nbsp;: il en faut deux pour qu’une comparaison veuille dire quelque chose. Trente secondes par jour suffisent — un chiffre, pas une phrase.</p>
<p style="margin-bottom:0">Date de lancement&nbsp;: …… / …… &nbsp;·&nbsp; date de lecture&nbsp;: …… / …… .</p>`,
  },
};

const M4 = {
  reperes: {
    minutes: 12,
    prerequis: 'les modules 1 à 3, et un plan d’estompage prêt à lancer.',
    evaluation: 'la lecture de votre relevé au quinzième jour.',
  },
  objectifs: [
    'Tenir un relevé qui suit <strong>l’aide</strong>, et non la réussite de la tâche',
    'Lire une courbe d’aide et savoir si l’estompage progresse',
    'Reconnaître une étape trop grande et la couper en deux',
    'Décider de la suite : descendre, tenir, remonter, ou changer de tâche',
    'Écrire un bilan qui décrit le dispositif plutôt que la personne',
  ],
  corps: `<h3 style="${G.H3}">1. Le relevé suit l’aide, pas la réussite</h3>
<p>C’est le point le plus important du module, et le plus contre-intuitif. Presque
tous les relevés de terrain notent «&nbsp;réussi / non réussi&nbsp;». Or cette colonne
ne dit rien&nbsp;: avec une guidance complète, tout le monde réussit tout, tous les
jours.</p>
<p>Ce qui se mesure, c’est <strong>le niveau d’aide qu’il a fallu donner</strong>. Une
tâche réussie au niveau 2 aujourd’hui alors qu’elle demandait le niveau 5 il y a trois
semaines&nbsp;: voilà un progrès. La colonne «&nbsp;réussi&nbsp;» aurait affiché
«&nbsp;oui&nbsp;» les deux fois.</p>
${A.tableau(
  ['Jour', 'Niveau donné (0-7)', 'Réussi seul ensuite ?', 'Remarque (facultatif)'],
  [['J1', '', '', ''], ['J2', '', '', ''], ['J3', '', '', ''], ['…', '', '', '']],
)}
<p>Trente secondes par jour. La quatrième colonne est facultative et le reste — un
relevé qui demande une phrase par jour n’est pas tenu au-delà du cinquième.</p>

<h3 style="${G.H3}">2. La lecture au quinzième jour</h3>
<p>On regarde une seule chose&nbsp;: <strong>la colonne du niveau descend-elle&nbsp;?</strong>
Si la moyenne vous rebute, écrivez le niveau <em>le plus fréquent</em> de la semaine&nbsp;:
deux modes valent une moyenne, et se comparent aussi bien.</p>
<p>
Pas régulièrement — en escalier, avec des paliers et des remontées. C’est la forme
normale d’un apprentissage.</p>
${A.tableau(
  ['Ce que fait la courbe', 'Ce que ça veut dire', 'La suite'],
  [
    [
      'Elle descend, avec des paliers',
      'L’estompage fonctionne. C’est la forme attendue.',
      'Continuez, un cran à la fois, au critère écrit.',
    ],
    [
      'Elle est plate depuis dix jours',
      'Le cran suivant est trop grand.',
      'Coupez-le en deux&nbsp;: entre le niveau 4 et le 3, il y a « consigne raccourcie », puis « consigne chuchotée ».',
    ],
    [
      'Elle remonte',
      'Soit vous êtes descendu de deux crans, soit quelque chose a changé autour (fatigue, maladie, changement d’organisation).',
      'Remontez d’un cran, tenez une semaine, et cherchez ce qui a changé.',
    ],
    [
      'Elle descend mais la tâche n’est jamais réussie ensuite',
      'La tâche est peut-être trop difficile en elle-même, indépendamment de l’aide.',
      'Reprenez la tâche&nbsp;: découpez-la. Voir «&nbsp;Décomposer une routine en étapes&nbsp;».',
    ],
  ],
)}

<h3 style="${G.H3}">3. Couper un cran en deux</h3>
<p>Quand la courbe est plate, on n’insiste pas&nbsp;: on fabrique un cran
intermédiaire. C’est toujours possible, et c’est la compétence qui distingue un plan
qui avance d’un plan qui stagne.</p>
<ul style="${G.UL}">
<li style="${G.LI}"><strong>Entre la consigne directe (4) et l’indice indirect (3)</strong>&nbsp;:
la même consigne mais raccourcie de moitié, puis chuchotée, puis dite une seule fois au
lieu de deux.</li>
<li style="${G.LI}"><strong>Entre le geste montré (2) et l’indice de position (1)</strong>&nbsp;:
le geste devient plus petit, puis se fait à distance, puis n’est plus qu’un regard.</li>
<li style="${G.LI}"><strong>Entre la guidance physique (6-7) et la démonstration (5)</strong>&nbsp;:
le contact recule le long du bras — main, poignet, avant-bras, coude, épaule — puis
devient une simple pression de départ.</li>
</ul>
<p>Ce dernier point mérite d’être connu&nbsp;: reculer le contact le long du membre est
la façon la plus fiable de sortir d’une guidance physique sans casser la tâche.</p>

<h3 style="${G.H3}">4. Écrire le bilan</h3>
<p>Le module 2 l’a montré&nbsp;: la phrase de bilan compte autant que le travail. Elle
doit contenir <strong>deux niveaux et une durée</strong>.</p>
<div style="${G.GRIS}">
<p style="margin-bottom:0"><em>«&nbsp;Sur la préparation du matériel, l’aide est passée
d’une guidance physique partielle (main sur le bras) en septembre à un indice visuel à
distance en mars. Le geste est réalisé seul quatre jours sur cinq, avec deux
professionnels différents. L’objectif du prochain trimestre est le retrait de l’indice
visuel.&nbsp;»</em></p>
</div>
<p>Comparez avec «&nbsp;progrès en autonomie&nbsp;»&nbsp;: la première phrase se
vérifie, se compare et se transmet. La seconde ne dit rien et ne survit pas à un
changement d’équipe.</p>

${G.alerte(
  'Quand arrêter et passer la main',
  `<ul style="${G.UL}">
<li style="${G.LI}">la personne se met en danger quand l’aide diminue&nbsp;;</li>
<li style="${G.LI}">elle développe une détresse nette à l’approche de la tâche&nbsp;;</li>
<li style="${G.LI}">la courbe remonte franchement sans cause identifiable&nbsp;;</li>
<li style="${G.LI}">un changement médical, un traitement ou une douleur sont possibles.</li>
</ul>
<p style="margin-bottom:0">Dans ces quatre cas on suspend, on remet le niveau qui
fonctionnait, et on en parle en équipe ou à un professionnel de santé. Un estompage
n’est jamais urgent.</p>`,
)}`,
  aRetenir:
    'On ne relève pas «&nbsp;réussi / pas réussi&nbsp;» — avec une guidance complète, tout est réussi. On relève <strong>le niveau d’aide qu’il a fallu donner</strong>. C’est la seule colonne qui montre un apprentissage.',
  exercice: {
    nom: 'La lecture du quinzième jour',
    duree: '10 minutes, le relevé sous les yeux',
    quoi: 'À faire feuille en main. De mémoire, on se rappelle les bons jours.',
    etapes: [
      'Écrivez le niveau moyen de la semaine 1, puis celui de la semaine 2. Deux nombres.',
      'Repérez le plus long palier : combien de jours au même niveau ?',
      'Si le palier dépasse cinq jours, écrivez le cran intermédiaire que vous allez fabriquer — concrètement, en mots.',
      'Placez-vous dans une des quatre lectures du point 2.',
      'Écrivez la phrase de bilan avec deux niveaux et une durée. Relisez-la : décrit-elle le dispositif ou la personne ?',
    ],
    reussi:
      'vous avez deux niveaux moyens, une longueur de palier, une lecture choisie, et une phrase de bilan qui décrit le dispositif.',
  },
  carnet: {
    intro: 'Les dernières lignes du carnet. Elles constituent votre bilan.',
    lignes: [
      '<strong>Niveau moyen semaine 1 / semaine 2</strong> — deux nombres.',
      '<strong>Le plus long palier</strong> — en jours.',
      '<strong>Le cran intermédiaire fabriqué</strong> — s’il a fallu.',
      '<strong>La phrase de bilan</strong> — deux niveaux, une durée, aucun jugement.',
      '<strong>La prochaine date de revue</strong>.',
    ],
  },
  vigilance: [
    '<strong>Une courbe en escalier est normale.</strong> Une courbe qui descend régulièrement est même suspecte&nbsp;: elle signifie souvent qu’on note ce qu’on espère.',
    '<strong>Ne descendez pas parce que la date est arrivée.</strong> Le critère prime sur le calendrier.',
    '<strong>Vérifiez avec deux adultes différents.</strong> Un apprentissage attaché à une personne n’est pas un apprentissage&nbsp;: c’est la situation d’Inès.',
    '<strong>Cette formation ne pose aucun diagnostic.</strong> Elle décrit un mécanisme d’apprentissage, pas une caractéristique d’un trouble.',
  ],
  annexes:
    'le <strong>relevé de niveau d’aide</strong> sur quinze jours, le <strong>tableau des crans intermédiaires</strong>, et des <strong>modèles de phrases de bilan</strong> qui décrivent le dispositif.',
  avant: [
    'J’ai relevé le niveau d’aide, pas la réussite, pendant au moins deux semaines.',
    'J’ai calculé mes deux niveaux moyens et repéré mon plus long palier.',
    'Ma phrase de bilan contient deux niveaux et une durée, et elle décrit le dispositif.',
  ],
};

/* ── ANNEXES ─────────────────────────────────────────────────────────────── */

const ANNEXES =
  A.entete('Guider puis s’effacer') +
  A.fiche({
    numero: 1,
    titre: 'L’échelle des aides, de 0 à 7',
    quand: 'à afficher là où la tâche se déroule.',
    contenu:
      ECHELLE +
      `<p><strong>La règle&nbsp;:</strong> on utilise le niveau le plus bas qui débloque —
pas celui qui marche à coup sûr. C’est le coût du retrait qui décide, pas l’efficacité
immédiate.</p>`,
  }) +
  A.fiche({
    numero: 2,
    titre: 'Mesurer son niveau réel',
    quand: 'avant d’écrire le moindre plan.',
    contenu:
      A.tableau(
        ['Jour', 'Niveau donné (0-7)', 'Secondes attendues avant d’aider', 'Tâche'],
        [['J1', '', '', ''], ['J2', '', '', ''], ['J3', '', '', '']],
      ) +
      `<div style="${G.GRIS}">
<p style="margin:0"><strong>Ma phrase de départ&nbsp;:</strong> «&nbsp;Aujourd’hui,
j’aide au niveau …… après …… secondes.&nbsp;»</p>
</div>
<p><strong>Comptez les secondes, ne les estimez pas.</strong> Cinq secondes ressenties,
c’est deux secondes réelles. La première semaine, la plupart des professionnels
découvrent qu’ils aidaient au bout d’une seconde et demie.</p>`,
  }) +
  A.fiche({
    numero: 3,
    titre: 'Le plan d’estompage en quatre lignes',
    quand: 'une fois par tâche, avant de commencer.',
    contenu: `<div style="${G.GRIS}">
<p style="margin:0"><strong>1. Niveau de départ&nbsp;:</strong> ……… — concrètement&nbsp;: ………………………………………………</p>
<p style="margin:14px 0 0"><strong>2. Critère de passage&nbsp;:</strong> ………………………………………………………………………</p>
<p style="margin:14px 0 0"><strong>3. Niveau d’arrivée&nbsp;:</strong> ……… — concrètement&nbsp;: ………………………………………………</p>
<p style="margin:14px 0 0"><strong>4. Date de revue&nbsp;:</strong> …… / …… &nbsp;·&nbsp; noté dans&nbsp;: ………………………</p>
</div>
<h4 style="margin:30px 0 8px">En cas d’échec — décidé maintenant</h4>
<ul style="${G.UL}">
<li style="${G.LI}"><strong>Une fois&nbsp;:</strong> on laisse passer, on aide au niveau du jour, on ne commente pas.</li>
<li style="${G.LI}"><strong>Deux fois de suite&nbsp;:</strong> on remonte d’un cran pour la séance.</li>
<li style="${G.LI}"><strong>Trois fois de suite&nbsp;:</strong> on remonte durablement, on note la date, et on coupe le cran suivant en deux.</li>
</ul>
<h4 style="margin:30px 0 8px">La règle du remplaçant</h4>
<p>«&nbsp;Quelqu’un qui ne connaît pas le plan aide au niveau écrit, jamais plus.&nbsp;»
Sans cette phrase affichée, un remplaçant bienveillant fait la tâche à la place et remet
le plan à zéro.</p>`,
  }) +
  A.fiche({
    numero: 4,
    titre: 'Les crans intermédiaires — quand la courbe est plate',
    quand: 'après cinq jours au même niveau.',
    contenu:
      A.tableau(
        ['Entre…', '…et…', 'Les crans à fabriquer'],
        [
          [
            'Consigne directe (4)',
            'Indice indirect (3)',
            'Consigne raccourcie de moitié → consigne chuchotée → consigne dite une seule fois.',
          ],
          [
            'Geste montré (2)',
            'Indice de position (1)',
            'Geste plus petit → geste fait à distance → simple regard vers l’objet.',
          ],
          [
            'Guidance physique (6-7)',
            'Démonstration (5)',
            'Le contact recule le long du membre&nbsp;: main → poignet → avant-bras → coude → épaule → simple pression de départ.',
          ],
          [
            'Indice de position (1)',
            'Rien (0)',
            'Vous restez debout à distance → assis à distance → présent dans la pièce sans regarder.',
          ],
        ],
      ) +
      `<p><strong>Reculer le contact le long du membre</strong> est la façon la plus
fiable de sortir d’une guidance physique sans casser la tâche. À connaître par cœur.</p>`,
  }) +
  A.fiche({
    numero: 5,
    titre: 'Écrire le bilan : décrire le dispositif, pas la personne',
    quand: 'à chaque écrit — projet, bilan, compte rendu, transmission.',
    contenu:
      A.tableau(
        ['Ce qu’on écrit spontanément', 'Pourquoi c’est coûteux', 'Ce qui se vérifie'],
        [
          [
            'Reste dépendant de l’adulte',
            'Décrit un trait de la personne. Suit le dossier pendant des années.',
            'L’aide mise en place en septembre n’a pas été estompée&nbsp;; la séquence enseignée comporte l’aide de l’adulte.',
          ],
          [
            'N’a pas acquis l’autonomie',
            'Constat sans repère&nbsp;: on ne sait ni d’où l’on part ni où l’on va.',
            'L’aide est passée du niveau 6 au niveau 2 en neuf mois&nbsp;; l’objectif du trimestre est le retrait de l’indice visuel.',
          ],
          [
            'Progrès en autonomie',
            'Ne se compare pas d’un trimestre à l’autre.',
            'Geste réalisé seul quatre jours sur cinq, avec deux professionnels différents.',
          ],
          [
            'Ne fait rien sans sollicitation',
            'Prête une passivité à la personne.',
            'Le démarrage de la tâche est actuellement déclenché par un indice de l’adulte&nbsp;; le travail porte sur le transfert vers un repère de l’environnement.',
          ],
        ],
      ) +
      `<p><strong>Une phrase de bilan utile contient deux niveaux et une durée.</strong>
C’est ce qui la rend vérifiable, comparable, et transmissible à une équipe qui change.</p>`,
  }) +
  A.fiche({
    numero: 6,
    titre: 'Le relevé de niveau d’aide — quinze jours',
    quand: 'du premier au quinzième jour, trente secondes par jour.',
    contenu:
      A.tableau(
        ['Jour', 'Niveau donné (0-7)', 'Réussi seul ensuite ?', 'Remarque'],
        [
          ['J1', '', '', ''], ['J2', '', '', ''], ['J3', '', '', ''], ['J4', '', '', ''],
          ['J5', '', '', ''], ['J6', '', '', ''], ['J7', '', '', ''],
          ['<strong>Moyenne S1</strong>', '', '', ''],
          ['J8', '', '', ''], ['J9', '', '', ''], ['J10', '', '', ''], ['J11', '', '', ''],
          ['J12', '', '', ''], ['J13', '', '', ''], ['J14', '', '', ''], ['J15', '', '', ''],
          ['<strong>Moyenne S2</strong>', '', '', ''],
        ],
      ) +
      `<p><strong>On relève le niveau d’aide, pas la réussite.</strong> Avec une guidance
complète, tout est réussi tous les jours — et le relevé ne montre aucun apprentissage.</p>`,
  }) +
  A.fiche({
    numero: 7,
    titre: 'La photo à trois mois',
    quand: 'une fois par trimestre, et avant tout écrit de bilan.',
    contenu:
      `<p>C’est l’exercice le plus court du parcours et celui qui surprend le plus. On
remplit les deux colonnes, on les compare, et la réponse est là.</p>` +
      A.tableau(
        ['', 'Aujourd’hui', 'Il y a trois mois'],
        [
          ['Niveau d’aide donné (0-7)', '', ''],
          ['Secondes attendues avant d’aider', '', ''],
          ['Qui aide', '', ''],
          ['Sur quelle partie de la tâche', '', ''],
          ['Ce que la personne fait sans moi', '', ''],
        ],
      ) +
      `<div style="${G.GRIS}">
<p style="margin-top:0"><strong>La lecture, en une phrase&nbsp;:</strong></p>
<ul style="${G.UL}">
<li style="${G.LI}"><strong>Les deux colonnes sont identiques</strong> → il n’y a pas eu
d’apprentissage, il y a eu de l’accompagnement. Ce n’est pas une faute&nbsp;: c’est
l’information qui manquait pour décider d’un plan.</li>
<li style="${G.LI}"><strong>Le niveau a baissé d’un cran ou plus</strong> → il y a
apprentissage. Notez la date du changement, c’est elle qui fera la phrase de bilan.</li>
<li style="${G.LI}"><strong>Le niveau a monté</strong> → cherchez un événement (changement
d’adulte, de lieu, d’horaire, période difficile) avant de conclure quoi que ce soit sur
la personne.</li>
</ul>
</div>
<h4 style="margin:30px 0 8px">Si rien n’a été écrit il y a trois mois</h4>
<p>C’est le cas le plus fréquent, et la colonne de droite se reconstitue quand même —
imparfaitement, mais assez pour décider&nbsp;:</p>
<ul style="${G.UL}">
<li style="${G.LI}">le cahier de liaison, les transmissions, le dernier compte rendu de
réunion&nbsp;;</li>
<li style="${G.LI}">le dernier écrit de bilan, même s’il est flou&nbsp;: «&nbsp;a besoin
d’être accompagné&nbsp;» situe déjà un niveau haut&nbsp;;</li>
<li style="${G.LI}"><strong>deux personnes de l’équipe interrogées séparément.</strong>
Séparément&nbsp;: sinon la première réponse emporte la seconde.</li>
</ul>
<p>Si vous ne trouvez rien, écrivez «&nbsp;je ne sais pas&nbsp;» dans la colonne de
droite. C’est une réponse, et elle explique à elle seule pourquoi la question du retrait
de l’aide ne s’est jamais posée.</p>`,
  }) +
  A.fiche({
    numero: 8,
    titre: 'Le plan d’Inès, tel qu’il aurait dû être écrit',
    quand: 'comme modèle, à côté de votre propre plan.',
    contenu:
      `<p>Rappel de la situation du module&nbsp;2&nbsp;: en septembre, l’AESH ouvre le
cartable et met le cahier dans les mains d’Inès. En janvier, elle pose la main sur son
bras et dit «&nbsp;on sort le cahier&nbsp;». En mars, elle est absente trois jours&nbsp;:
Inès ne sort rien. Voici la feuille qui aurait tout changé — quatre lignes, écrites en
octobre, en dix minutes.</p>
<div style="${G.GRIS}">
<p style="margin-top:0"><strong>Tâche&nbsp;:</strong> sortir le cahier du cartable au
début du cours, en CE1.</p>
<p style="margin:14px 0 0"><strong>1. Niveau de départ&nbsp;: 6</strong> — concrètement&nbsp;:
main posée sur le bras + consigne «&nbsp;on sort le cahier&nbsp;».</p>
<p style="margin:14px 0 0"><strong>2. Critère de passage&nbsp;:</strong> trois jours de
suite où Inès sort le cahier après la consigne seule, sans contact.</p>
<p style="margin:14px 0 0"><strong>3. Niveau d’arrivée&nbsp;: 1</strong> —
concrètement&nbsp;: le cartable est posé ouvert sur la table, personne ne dit rien.</p>
<p style="margin:14px 0 0"><strong>4. Date de revue&nbsp;: 15 décembre</strong>
&nbsp;·&nbsp; noté dans&nbsp;: le cahier de liaison AESH / enseignante.</p>
</div>
<h4 style="margin:30px 0 8px">Les crans prévus entre 6 et 1</h4>
<p>6 (main sur le bras + consigne) → 4 (consigne seule) → 3 (consigne raccourcie&nbsp;:
«&nbsp;le cahier&nbsp;») → 2 (l’AESH regarde le cartable sans parler) → 1 (cartable
ouvert posé sur la table) → 0.</p>
<h4 style="margin:30px 0 8px">En cas d’échec — décidé en octobre, pas en mars</h4>
<ul style="${G.UL}">
<li style="${G.LI}"><strong>Une fois&nbsp;:</strong> on aide au niveau du jour, on ne
commente pas.</li>
<li style="${G.LI}"><strong>Deux fois de suite&nbsp;:</strong> on remonte d’un cran pour
la journée.</li>
<li style="${G.LI}"><strong>Trois fois de suite&nbsp;:</strong> on remonte durablement, on
note la date, et on coupe le cran suivant en deux.</li>
</ul>
<h4 style="margin:30px 0 8px">La ligne qui aurait évité le mois de mars</h4>
<p><em>«&nbsp;Toute personne qui remplace l’AESH aide au niveau écrit sur cette fiche,
jamais plus. La fiche est dans le cahier de liaison.&nbsp;»</em></p>
<p>Trois jours d’absence n’auraient alors rien révélé de dramatique&nbsp;: ils auraient
été une vérification, celle que le module&nbsp;4 demande de faire exprès — un
apprentissage attaché à une seule personne n’est pas un apprentissage.</p>
<h4 style="margin:30px 0 8px">Et la phrase de bilan de juin</h4>
${A.tableau(
  ['Ce qui a été écrit', 'Ce qui aurait pu l’être'],
  [
    [
      'Inès n’a pas acquis l’autonomie dans la préparation de son matériel.',
      'La sortie du cahier est acquise avec une consigne verbale seule (niveau&nbsp;4) depuis janvier&nbsp;; le passage au niveau&nbsp;2 est l’objectif du premier trimestre, avec l’AESH et l’enseignante.',
    ],
  ],
)}
<p><strong>La deuxième phrase se compare l’année suivante.</strong> La première suit Inès
de dossier en dossier sans que personne ne puisse dire ce qui a été tenté.</p>`,
  }) +
  A.fiche({
    numero: 9,
    titre: 'Annoncer le retrait de l’aide — modèles de phrases',
    quand: 'la veille du premier changement de niveau.',
    contenu:
      `<p>Un retrait d’aide non annoncé se vit comme un abandon. Annoncé, il se vit comme
une étape. C’est la même chose techniquement, et pas du tout la même chose pour la
personne.</p>
<h4 style="margin:26px 0 8px">À la personne accompagnée</h4>
<div style="${G.GRIS}">
<p style="margin-top:0"><em>«&nbsp;À partir de demain, je ne mets plus ma main sur ton
bras. Je dis juste “le cahier”. Si c’est trop dur, tu me fais signe et je t’aide — on
recommencera plus tard.&nbsp;»</em></p>
<p style="margin-bottom:0"><em>«&nbsp;Demain, je reste debout à côté et je ne montre plus.
Tu commences, et je regarde.&nbsp;»</em></p>
</div>
<p>Trois ingrédients, toujours les mêmes&nbsp;: <strong>ce qui change exactement</strong>,
<strong>à partir de quand</strong>, <strong>ce qui se passe si ça ne marche pas</strong>.
Le troisième est le plus important&nbsp;: sans lui, la personne ne sait pas si elle a le
droit d’échouer.</p>
<h4 style="margin:26px 0 8px">À l’équipe</h4>
<div style="${G.GRIS}">
<p style="margin:0"><em>«&nbsp;Sur la routine du manteau, on passe du geste montré à
l’indice de position à partir de lundi. Concrètement&nbsp;: on pose le manteau devant lui
et on ne montre plus. Si ça bloque deux fois de suite, on remonte au geste montré pour la
journée et on me le dit. La fiche est dans le classeur.&nbsp;»</em></p>
</div>
<h4 style="margin:26px 0 8px">À la famille</h4>
<div style="${G.GRIS}">
<p style="margin:0"><em>«&nbsp;En ce moment, on l’aide moins qu’avant sur ce moment-là,
volontairement&nbsp;: c’est prévu, c’est écrit, et on remonte l’aide si besoin. Il se peut
qu’il vous dise que c’est plus dur — c’est le signe que le plan est en cours, pas qu’il
va mal.&nbsp;»</em></p>
</div>
${G.alerte(
  'Ce qu’une annonce ne doit jamais contenir',
  `<p style="margin-bottom:0">Ni «&nbsp;maintenant tu es grand&nbsp;», ni «&nbsp;tu dois y
arriver seul&nbsp;», ni «&nbsp;je ne t’aiderai plus&nbsp;». Ces trois formules
transforment un réglage technique en jugement, et elles rendent l’échec honteux — donc
invisible, donc impossible à corriger.</p>`,
)}`,
  }) +
  A.pied();

module.exports = {
  slug: 'guider-puis-s-effacer',
  uuid: '86b77ee2-8273-4e01-8143-52d5783d4926',
  modules: [
    { titre: 'Module 1 — L’échelle des aides, et le délai qu’on ne laisse jamais', minutes: 12, html: G.assembler(M1) },
    { titre: 'Module 2 — Une aide qui n’a jamais été retirée', minutes: 10, html: G.assembler(M2) },
    { titre: 'Module 3 — Exercice guidé : le plan d’estompage en quatre lignes', minutes: 12, html: G.assembler(M3) },
    { titre: 'Module 4 — Quinze jours de relevé, et la phrase de bilan', minutes: 12, html: G.assembler(M4) },
  ],
  annexes: ANNEXES,
};
