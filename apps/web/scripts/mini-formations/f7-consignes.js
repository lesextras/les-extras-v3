/**
 * F7 — L'ENFANT QUI DIT NON À TOUT
 *
 * Compétence : formuler une consigne qui peut être exécutée, et savoir lire un
 * « non » avant d'y répondre.
 *
 * ── POURQUOI CETTE FORMATION EXISTE À CÔTÉ DES AUTRES ───────────────────────
 * Les parcours « quatre fonctions » et « apprendre à demander » travaillent le
 * comportement de la personne. Celui-ci travaille l'autre moitié de la scène :
 * LA CONSIGNE DE L'ADULTE — sa forme, son nombre, son moment. C'est une
 * compétence distincte, elle s'exerce sans rien savoir de la personne d'en
 * face, et elle produit des résultats en quelques jours parce qu'elle ne
 * demande de changer que soi.
 *
 * ── LE PIÈGE DU SUJET, ET COMMENT IL EST TENU ───────────────────────────────
 * « Faire obéir » est ce que le public vient chercher, et ce n'est pas ce qu'on
 * enseigne. Une formation sur les consignes qui ne dirait pas que le refus est
 * une communication, et qu'une part des « non » sont légitimes, fabriquerait
 * des adultes plus efficaces à obtenir une obéissance qui ne leur revient pas.
 * D'où deux sections qui ne sautent jamais : les cinq « non » (module 1,
 * section 2) et la liste négociable / non négociable, écrite AVANT de travailler
 * la forme des consignes (module 3, ligne 1).
 *
 * ⚠ La nuance comportementale et l'avertissement sont ajoutés par build-v2.js.
 */

const G = require('./gabarit-v3.js');
const A = require('./annexes.js');

/* ── MODULE 1 ────────────────────────────────────────────────────────────── */

const M1 = {
  reperes: {
    minutes: 12,
    prerequis:
      'aucun. Ce module s’adresse autant à un parent qu’à un professionnel, et il ne suppose aucune connaissance préalable.',
    evaluation:
      'le comptage de vos consignes sur une heure, et la réécriture de trois d’entre elles.',
  },
  objectifs: [
    'Compter les consignes réellement données sur une heure, plutôt que de les estimer',
    'Distinguer les cinq choses qu’un « non » peut vouloir dire',
    'Repérer les sept défauts qui rendent une consigne inexécutable',
    'Formuler une consigne exécutable : un verbe, une chose, maintenant, en positif',
    'Laisser cinq secondes de silence après une consigne, et savoir pourquoi c’est difficile',
  ],
  corps: `<h3 style="${G.H3}">1. « Il dit non à tout » n’est pas une donnée</h3>
<p>C’est une impression, et elle est presque toujours fausse dans les proportions
qu’elle annonce. La question utile n’est pas «&nbsp;pourquoi refuse-t-il&nbsp;?&nbsp;»
mais&nbsp;: <strong>combien de consignes reçoit-il, et combien en refuse-t-il
réellement&nbsp;?</strong></p>
<p>Les comptages faits par des équipes sur une heure ordinaire donnent des chiffres qui
surprennent toujours celui qui vient de les faire&nbsp;: on donne beaucoup plus de
consignes qu’on ne le croit, et on en abandonne une bonne partie en cours de route sans
s’en apercevoir.</p>
${G.exemple(
  'Ce que le comptage révèle presque toujours',
  `<ul style="${G.UL}">
<li style="${G.LI}"><strong>Le nombre.</strong> Une heure de fin de journée contient
souvent plusieurs dizaines de consignes. Refuser dix fois sur soixante n’est pas
«&nbsp;refuser à tout&nbsp;»&nbsp;: c’est un taux, et un taux se travaille.</li>
<li style="${G.LI}"><strong>Les abandons.</strong> Une part des consignes n’est jamais
suivie — ni par l’enfant, ni par l’adulte, qui passe à autre chose. Chacune enseigne
qu’une consigne n’engage à rien.</li>
<li style="${G.LI}"><strong>La répartition.</strong> Les refus se concentrent presque
toujours sur deux ou trois moments de la journée. Ce n’est pas «&nbsp;tout le
temps&nbsp;», et ces moments-là se préparent.</li>
</ul>
<p style="margin-bottom:0">Aucun de ces trois constats ne se voit sans compter. C’est
l’exercice de ce module, et il tient en une heure.</p>`,
)}

<h3 style="${G.H3}">2. Les cinq « non », et pourquoi on ne répond pas pareil</h3>
<p>Un même mot recouvre cinq situations qui n’ont rien à voir. Y répondre de la même
façon, c’est se tromper quatre fois sur cinq.</p>
${A.tableau(
  ['Le « non » veut dire', 'Ce qui le trahit', 'Ce qui marche', 'Ce qui aggrave'],
  [
    [
      '<strong>Je n’ai pas compris</strong>',
      'La personne regarde ailleurs, fait autre chose, répète la fin de votre phrase, ou exécute une partie seulement.',
      'Redire autrement, plus court. Montrer. Réduire à une seule chose.',
      'Répéter à l’identique, plus fort. Le volume n’ajoute aucune information.',
    ],
    [
      '<strong>Je ne peux pas</strong>',
      'Le refus revient toujours sur la même tâche, ou sur la même étape d’une tâche.',
      'Aider, découper, ou faire ensemble la première étape. La demande devient exécutable.',
      'Insister. On obtient un échec, et la tâche devient encore plus coûteuse la fois suivante.',
    ],
    [
      '<strong>Je n’ai pas fini</strong>',
      'Le refus arrive au milieu de quelque chose, et la personne y retourne.',
      'Prévenir avant, donner une fin visible («&nbsp;après cette page&nbsp;»), attendre la fin de l’unité en cours.',
      'Interrompre net. C’est le déclencheur de crise le plus fréquent de tous.',
    ],
    [
      '<strong>Je ne veux pas maintenant</strong>',
      'La personne accepte si on repose la question dix minutes plus tard.',
      'Négocier le moment, pas la tâche&nbsp;: «&nbsp;maintenant ou dans cinq minutes&nbsp;?&nbsp;» — et tenir le choix.',
      'Faire du moment un enjeu d’autorité. On y gagne parfois la tâche, on y perd toujours du temps.',
    ],
    [
      '<strong>Je ne veux pas, point</strong>',
      'Le refus est constant, calme, et se répète quel que soit le moment ou la formulation.',
      'Regarder si c’est un refus qu’on a le droit d’entendre — et souvent oui. Sinon, chercher la fonction (autre parcours du catalogue).',
      'Traiter les cinq cas comme celui-là. C’est l’erreur la plus courante, et elle transforme un malentendu en conflit.',
    ],
  ],
)}
${G.alerte(
  'Le refus est une communication, y compris quand il dérange',
  `<p style="margin-bottom:0">Une partie des «&nbsp;non&nbsp;» sont légitimes et doivent
être entendus&nbsp;: sur son corps, sur son intimité, sur ce qui lui appartient, sur une
activité qui lui fait peur, sur un contact. Une formation qui apprendrait seulement à
obtenir l’obéissance ferait des adultes plus efficaces à passer par-dessus. C’est pour
cela que le module&nbsp;3 commence par écrire ce qui est négociable et ce qui ne l’est
pas — <strong>avant</strong> de travailler la forme des consignes.</p>`,
)}

<h3 style="${G.H3}">3. Les sept défauts d’une consigne</h3>
<p>Aucun n’est une faute&nbsp;: ce sont des formes de politesse ordinaire, qui marchent
très bien entre adultes et qui cessent de marcher dès qu’il y a une difficulté de
compréhension, d’attention ou de langage.</p>
${A.tableau(
  ['Le défaut', 'Ce que ça donne', 'Pourquoi ça rate', 'La version exécutable'],
  [
    [
      '<strong>1. Formulée en question</strong>',
      '«&nbsp;Tu veux bien ranger tes chaussures&nbsp;?&nbsp;»',
      'Une question autorise un «&nbsp;non&nbsp;». Si le «&nbsp;non&nbsp;» n’est pas recevable, il ne fallait pas poser la question.',
      '«&nbsp;Range tes chaussures.&nbsp;»',
    ],
    [
      '<strong>2. Formulée en négatif</strong>',
      '«&nbsp;Ne cours pas.&nbsp;» «&nbsp;Arrête de crier.&nbsp;»',
      'Elle dit ce qu’il faut arrêter, pas ce qu’il faut faire. Il reste à trouver quoi faire à la place, et c’est justement la partie difficile.',
      '«&nbsp;Tu marches.&nbsp;» «&nbsp;Parle doucement.&nbsp;»',
    ],
    [
      '<strong>3. Double ou triple</strong>',
      '«&nbsp;Tu ranges tes affaires et tu vas te laver les mains.&nbsp;»',
      'Deux consignes, dont une seule sera faite — presque toujours la première, jamais celle qui coûte.',
      'Une seule. La deuxième arrive quand la première est finie.',
    ],
    [
      '<strong>4. Vague</strong>',
      '«&nbsp;Range ta chambre.&nbsp;» «&nbsp;Sois sage.&nbsp;»',
      'Ce n’est pas une consigne, c’est un objectif. Personne ne sait par où commencer, ni quand c’est fini.',
      '«&nbsp;Mets les Lego dans la caisse bleue.&nbsp;»',
    ],
    [
      '<strong>5. Donnée à distance, sans attention</strong>',
      'Lancée d’une autre pièce, ou dans le dos.',
      'Elle n’a peut-être jamais été entendue. Le refus qu’on croit constater n’existe pas.',
      'À portée de voix, en face, après avoir capté l’attention — un prénom, un geste, la présence.',
    ],
    [
      '<strong>6. Donnée au mauvais moment</strong>',
      'Au milieu d’une activité, d’un écran, d’un repas commencé.',
      'On demande d’arrêter <em>et</em> de faire. Deux efforts pour une consigne.',
      'Prévenir avant, donner une fin visible, puis demander.',
    ],
    [
      '<strong>7. Noyée dans un flot</strong>',
      'Trois phrases d’explication, la consigne au milieu, une justification après.',
      'La consigne est la partie la plus courte du message. Elle passe inaperçue.',
      'La consigne seule. L’explication vient après l’exécution, si elle est utile.',
    ],
  ],
)}

<h3 style="${G.H3}">4. La consigne exécutable, en cinq mots</h3>
<div style="${G.GRIS}">
<p style="margin-top:0"><strong>Un verbe · une chose · maintenant · en positif · à portée
de voix.</strong></p>
<p style="margin-bottom:0">Et une sixième, qui ne se voit pas&nbsp;: <strong>on ne la
donne que si on est prêt à aller jusqu’au bout.</strong> Une consigne abandonnée en cours
de route enseigne que les consignes n’engagent à rien — et elle coûte plus cher que celle
qu’on n’a pas donnée.</p>
</div>
<p>Un test simple&nbsp;: <strong>votre consigne pourrait-elle être filmée&nbsp;?</strong>
Si on ne peut pas dire à quoi ressemblerait l’image de quelqu’un en train de l’exécuter,
elle n’est pas encore une consigne. «&nbsp;Sois gentil avec ta sœur&nbsp;» ne se filme
pas. «&nbsp;Rends-lui la voiture rouge&nbsp;» se filme.</p>

<h3 style="${G.H3}">5. Les cinq secondes, et pourquoi elles sont si dures</h3>
<p>Après une consigne, on attend <strong>cinq secondes</strong>, en silence, sans
répéter, sans ajouter, sans regarder ailleurs.</p>
<p>Cinq secondes réelles, comptées. La plupart des adultes qui le mesurent découvrent
qu’ils répètent au bout d’une seconde et demie — et une consigne répétée trop vite
enseigne deux choses, toutes deux coûteuses&nbsp;: <em>la première fois ne compte pas</em>,
et <em>on peut attendre la troisième</em>.</p>
<p>Le silence est difficile pour une raison qui n’a rien à voir avec la pédagogie&nbsp;:
il est inconfortable. Il donne l’impression de ne rien faire, devant témoins. C’est
pourtant la partie du travail qui produit le plus de résultats en dix jours, parce
qu’elle ne demande de changer que soi.</p>
${G.exemple(
  'Ce qu’on fait au bout des cinq secondes',
  `<p style="margin-bottom:0">On ne répète pas la consigne&nbsp;: <strong>on aide</strong>.
On montre, on commence à la place, on fait la première étape ensemble. Une consigne non
suivie deux fois de suite n’est pas un problème d’obéissance — c’est une consigne trop
grosse, trop vague, ou donnée au mauvais moment. Elle se réécrit, elle ne se répète
pas.</p>`,
)}

<h3 style="${G.H3}">6. Le choix : puissant, et facile à abîmer</h3>
<p>Proposer un choix transforme souvent un refus en exécution, parce qu’il rend à la
personne une prise sur ce qui lui arrive. Trois conditions, et sans elles il se
retourne&nbsp;:</p>
<ul style="${G.UL}">
<li style="${G.LI}"><strong>Deux options, pas plus</strong>, et les deux vous conviennent.
«&nbsp;Le pyjama bleu ou le vert&nbsp;?&nbsp;»</li>
<li style="${G.LI}"><strong>Le choix porte sur le comment ou le quand, pas sur le
si.</strong> «&nbsp;Tu ranges maintenant ou après ce dessin&nbsp;?&nbsp;» est un vrai
choix. «&nbsp;Tu veux ranger&nbsp;?&nbsp;» n’en est pas un&nbsp;: c’est une question dont
on refusera la réponse.</li>
<li style="${G.LI}"><strong>Le choix est tenu.</strong> Choisir «&nbsp;après ce
dessin&nbsp;» et se voir demander de ranger tout de suite apprend que choisir ne sert à
rien — et le choix cesse de fonctionner pour longtemps.</li>
</ul>
<p><strong>La fausse alternative se repère vite</strong> et coûte cher&nbsp;: «&nbsp;tu
ranges ou tu vas dans ta chambre&nbsp;» n’est pas un choix, c’est une menace habillée en
choix. Elle marche une fois ou deux, puis elle abîme les vrais choix qui viendront
après.</p>`,
  aRetenir:
    '«&nbsp;Il dit non à tout&nbsp;» se transforme en donnée dès qu’on compte. Et la moitié des refus disparaît quand la consigne devient exécutable&nbsp;: <strong>un verbe, une chose, maintenant, en positif, à portée de voix</strong> — puis cinq secondes de silence.',
  exercice: {
    nom: 'Le comptage d’une heure',
    duree: '10 minutes d’écriture, après une heure d’observation',
    quoi:
      'On mesure avant de corriger. Choisissez une heure ordinaire et plutôt difficile : fin de journée, repas, coucher, ou un temps d’atelier.',
    etapes: [
      'Pendant cette heure, faites un bâton pour chaque consigne que vous donnez. Un bâton, rien d’autre : écrire davantage vous ferait arrêter de compter.',
      'Notez à part, en deux mots, celles qui ont été refusées. Écrivez le mot exact du refus quand il y en a un.',
      'À la fin de l’heure : combien de consignes ? combien de refus ? Faites la proportion. Elle est presque toujours plus basse que l’impression.',
      'Reprenez trois consignes refusées et passez-les aux sept défauts. Notez lequel ou lesquels étaient présents.',
      'Réécrivez ces trois consignes en version exécutable : un verbe, une chose, maintenant, en positif. Écrivez-les mot pour mot.',
    ],
    reussi:
      'vous avez deux nombres et une proportion, trois défauts identifiés, et trois consignes réécrites que vous pourriez dire telles quelles demain.',
  },
  carnet: {
    intro:
      'Ouvrez une page — carnet, feuille, notes du téléphone. Quatre lignes pour ce module.',
    lignes: [
      '<strong>Mon comptage</strong> — consignes données, refus, proportion.',
      '<strong>Mes deux moments</strong> — ceux où les refus se concentrent.',
      '<strong>Mes défauts dominants</strong> — parmi les sept, les deux qui reviennent chez moi.',
      '<strong>Mes trois consignes réécrites</strong> — mot pour mot.',
    ],
  },
  vigilance: [
    '<strong>Compter n’est pas se juger.</strong> Le nombre de consignes d’une fin de journée est élevé chez tout le monde : c’est le moment qui le veut, pas la personne qui les donne.',
    '<strong>Une consigne exécutable n’est pas une consigne sèche.</strong> On peut dire « range tes chaussures » avec chaleur. C’est la forme qu’on change, pas le ton.',
    '<strong>Certains « non » se respectent</strong> : sur le corps, l’intimité, les objets personnels, un contact. Le module 3 vous fera écrire cette liste avant tout le reste.',
    '<strong>Si le refus porte toujours sur la même tâche</strong>, ce n’est probablement pas un problème de consigne : c’est une tâche trop difficile. Le parcours « Décomposer une routine en étapes » traite exactement cela.',
  ],
  annexes:
    'la <strong>grille de comptage d’une heure</strong>, le <strong>tableau des cinq « non »</strong>, et les <strong>sept défauts avec vingt consignes réécrites</strong>.',
  avant: [
    'J’ai compté mes consignes sur une heure réelle, et j’ai une proportion de refus.',
    'Je peux nommer les cinq « non » et dire lequel je rencontre le plus souvent.',
    'J’ai réécrit trois consignes en version exécutable, mot pour mot.',
  ],
};

/* ── MODULE 2 ────────────────────────────────────────────────────────────── */

const M2 = {
  reperes: {
    minutes: 10,
    prerequis: 'le module 1 — les cinq « non », les sept défauts, les cinq secondes.',
    evaluation:
      'votre propre scène réécrite, consigne par consigne, avec les défauts identifiés.',
  },
  objectifs: [
    'Repérer les défauts de consigne dans une scène ordinaire, à mesure qu’ils arrivent',
    'Distinguer, dans une même scène, les refus qui viennent de la forme et ceux qui viennent d’autre chose',
    'Comprendre ce que produit une consigne abandonnée en cours de route',
    'Reconnaître la fausse alternative et ce qu’elle coûte',
    'Transposer l’analyse à une scène en collectif',
  ],
  corps: `<h3 style="${G.H3}">1. Le rangement du samedi</h3>
<p>Six minutes, une pièce, une mère qui fait tout correctement — et rien qui ne se
range. Lisez, puis arrêtez-vous.</p>

<div style="${G.GRIS}">
<p><em>Samedi, 11&nbsp;h. Camille, 7&nbsp;ans, est assise par terre au milieu de sa
chambre, en train de finir un dessin.</em></p>
<p><em>De la cuisine&nbsp;: «&nbsp;Camille, tu peux ranger ta chambre s’il te
plaît&nbsp;?&nbsp;» Pas de réponse.</em></p>
<p><em>Trente secondes plus tard, depuis le couloir&nbsp;: «&nbsp;Camille&nbsp;! J’ai
demandé de ranger&nbsp;!&nbsp;» — «&nbsp;Ouiiii.&nbsp;» Elle ne bouge pas.</em></p>
<p><em>La mère entre. «&nbsp;Bon, tu ranges tes Lego et tes feutres, et après tu mets
tes habits sales dans le panier. Et ne laisse pas traîner tes chaussons comme la
dernière fois.&nbsp;»</em></p>
<p><em>Camille se lève, prend deux Lego, les met dans la caisse, puis se rassoit et
reprend son dessin.</em></p>
<p><em>«&nbsp;Camille&nbsp;! Tu te moques de moi&nbsp;?&nbsp;» — «&nbsp;Mais j’ai
rangé&nbsp;!&nbsp;»</em></p>
<p><em>«&nbsp;Tu ranges ou il n’y a pas de parc cet après-midi.&nbsp;»</em></p>
<p><em>Camille jette son crayon, dit «&nbsp;de toute façon je m’en fous&nbsp;» et sort
de la chambre. Personne ne va au parc. La chambre est rangée le soir, par la mère.</em></p>
</div>

<h3 style="${G.H3}">2. Arrêtez-vous ici — cinq minutes, de quoi écrire</h3>
<p>Comptez les consignes. Pour chacune, cherchez lequel des sept défauts est présent.
Il y en a six, et un huitième problème qui n’est pas un défaut de consigne.</p>

${G.FILET}

<h3 style="${G.H3}">3. Consigne par consigne</h3>
${A.tableau(
  ['La consigne', 'Le défaut', 'Ce que ça produit'],
  [
    [
      '«&nbsp;Tu peux ranger ta chambre s’il te plaît&nbsp;?&nbsp;» — depuis la cuisine',
      '<strong>Question</strong> + <strong>vague</strong> + <strong>à distance, sans attention</strong> + <strong>au mauvais moment</strong> (dessin en cours).',
      'Quatre défauts d’un coup. On ne saura jamais si elle a entendu — et «&nbsp;ranger sa chambre&nbsp;» n’indique aucun premier geste.',
    ],
    [
      '«&nbsp;J’ai demandé de ranger&nbsp;!&nbsp;» — depuis le couloir',
      '<strong>Répétition</strong>, plus fort, toujours à distance.',
      'Le volume n’ajoute pas d’information. Le «&nbsp;ouiiii&nbsp;» qui suit est une réponse au ton, pas à la demande.',
    ],
    [
      '«&nbsp;Tu ranges tes Lego et tes feutres, et après tes habits sales… et ne laisse pas traîner tes chaussons&nbsp;»',
      '<strong>Triple</strong> + <strong>négatif</strong> + <strong>noyée dans un flot</strong>.',
      'Quatre tâches en une phrase, dont une formulée à l’envers. Camille en fait une, la moins coûteuse, et elle a raison de croire qu’elle a obéi.',
    ],
    [
      '«&nbsp;Tu te moques de moi&nbsp;?&nbsp;»',
      'Ce n’est plus une consigne&nbsp;: c’est une intention prêtée.',
      'La scène change de nature. On ne parle plus de rangement, on parle de respect — et personne ne peut plus reculer.',
    ],
    [
      '«&nbsp;Tu ranges ou il n’y a pas de parc.&nbsp;»',
      '<strong>Fausse alternative</strong>, posée en pleine tension.',
      'Elle engage la mère à supprimer le parc — ce qu’elle fera, ce qui punit tout le monde, y compris elle. Et le rangement n’aura toujours pas eu lieu.',
    ],
    [
      'La chambre rangée le soir, par la mère',
      '<strong>La consigne abandonnée.</strong> Ce n’est pas un défaut de forme, c’est le huitième problème.',
      'C’est ce qui coûte le plus cher, et c’est la seule chose que Camille retiendra vraiment&nbsp;: si j’attends assez longtemps, ça se range tout seul.',
    ],
  ],
)}
${G.alerte(
  'Le vrai coût n’est pas la chambre en désordre',
  `<p style="margin-bottom:0">C’est la leçon donnée sans le vouloir&nbsp;: une consigne
n’engage à rien, et la répétition finit toujours par la remplacer. Chaque consigne
abandonnée rend la suivante un peu plus coûteuse. <strong>Mieux vaut donner trois
consignes par jour et les tenir toutes les trois que d’en donner trente et d’en tenir
dix.</strong></p>`,
)}

<h3 style="${G.H3}">4. Lequel des cinq « non » ?</h3>
<p>Le refus de Camille n’était aucun des cinq au départ. Il n’y avait pas de refus du
tout&nbsp;: il y avait <strong>«&nbsp;je n’ai pas fini&nbsp;»</strong> et
<strong>«&nbsp;je n’ai pas compris&nbsp;»</strong> — une consigne vague reçue au milieu
d’un dessin.</p>
<p>Le vrai refus, celui qui a mis fin à la scène, est apparu <strong>à la sixième
minute</strong>, et il portait sur autre chose que le rangement&nbsp;: sur l’accusation
et sur la menace. À ce moment-là, la chambre n’était plus le sujet pour personne.</p>

<h3 style="${G.H3}">5. La même scène, autrement</h3>
<div style="${G.GRIS}">
<p style="margin-top:0"><em>11&nbsp;h. La mère entre dans la chambre, s’accroupit à côté
de Camille et regarde le dessin dix secondes.</em></p>
<p style="margin:14px 0 0"><em>«&nbsp;Il est beau. Tu le finis, et après on range. Tu me
dis quand tu as fini.&nbsp;»</em></p>
<p style="margin:14px 0 0"><em>Quatre minutes plus tard&nbsp;: «&nbsp;J’ai
fini&nbsp;!&nbsp;» — «&nbsp;Mets les Lego dans la caisse bleue.&nbsp;» Puis silence. Cinq
secondes.</em></p>
<p style="margin:14px 0 0"><em>Camille commence. Quand la caisse est pleine&nbsp;:
«&nbsp;Les feutres dans la trousse.&nbsp;» Puis&nbsp;: «&nbsp;Les habits sales dans le
panier.&nbsp;»</em></p>
<p style="margin-bottom:0"><em>Trois consignes, une à la fois, chacune finie avant la
suivante. Les chaussons&nbsp;: pas aujourd’hui.</em></p>
</div>
<ul style="${G.UL}">
<li style="${G.LI}"><strong>La fin visible («&nbsp;tu le finis&nbsp;»)</strong> supprime à
elle seule le premier refus. C’est le geste le plus rentable de toute la scène.</li>
<li style="${G.LI}"><strong>Une consigne à la fois</strong>, énoncée seulement quand la
précédente est terminée. C’est plus long à lire qu’à faire.</li>
<li style="${G.LI}"><strong>Les chaussons attendent.</strong> Une consigne qu’on n’est pas
prêt à suivre jusqu’au bout ne se donne pas.</li>
<li style="${G.LI}"><strong>Aucune récompense n’a été promise, aucune menace
proférée.</strong> Ce qui a changé tient entièrement dans la forme et dans le
moment.</li>
</ul>

<h3 style="${G.H3}">6. Et en collectif — quand il y a huit enfants</h3>
<p>La scène ci-dessus se passe à la maison, avec un adulte pour un enfant. En groupe,
trois choses changent, et deux jouent en votre faveur.</p>
<ul style="${G.UL}">
<li style="${G.LI}"><strong>La consigne collective n’est adressée à personne.</strong>
«&nbsp;On range&nbsp;!&nbsp;» lancé à huit enfants est entendu par ceux qui rangeaient
déjà. Une consigne qui doit être suivie se donne <em>à quelqu’un</em>, avec son prénom,
en face — quitte à en donner huit.</li>
<li style="${G.LI}"><strong>Le public change tout.</strong> Reculer devant les autres est
coûteux&nbsp;: une consigne donnée devant le groupe à un enfant qui résiste se transforme
vite en épreuve de face. La même consigne, dite à côté et à voix basse, passe souvent
sans difficulté.</li>
<li style="${G.LI}"><strong>Deux adultes, deux formulations, c’est zéro consigne.</strong>
En collectif, la cohérence de forme compte autant que la forme elle-même. Les trois ou
quatre consignes qui reviennent chaque jour gagnent à être écrites, mot pour mot, et
dites pareil par tout le monde.</li>
</ul>
<p><strong>Ce qui joue en votre faveur&nbsp;:</strong> un rituel remplace une consigne. Ce
qui se fait tous les jours, dans le même ordre, au même moment, finit par ne plus avoir
besoin d’être demandé — et c’est autant de consignes en moins dans le comptage du
module&nbsp;1. Un support visuel accélère franchement les choses&nbsp;: c’est l’objet du
parcours «&nbsp;Rendre l’environnement prévisible&nbsp;».</p>`,
  aRetenir:
    'La scène ne contient presque aucun refus&nbsp;: elle contient <strong>six défauts de consigne</strong> et <strong>une consigne abandonnée</strong>. Le seul vrai refus apparaît à la sixième minute, et il porte sur l’accusation — pas sur le rangement.',
  exercice: {
    nom: 'Votre scène, consigne par consigne',
    duree: '12 minutes',
    quoi:
      'On refait l’analyse sur un de vos moments difficiles, à partir de votre comptage du module 1.',
    etapes: [
      'Racontez par écrit, au présent, un moment récent où « ça a refusé ». Dix lignes, avec les phrases exactes que vous avez dites.',
      'Surlignez chaque consigne. Numérotez-les.',
      'En face de chacune, écrivez le ou les défauts parmi les sept. Écrivez « aucun » quand il n’y en a pas : cela arrive, et c’est une information.',
      'Cherchez la consigne abandonnée — celle que personne n’a suivie et que vous avez faite vous-même ou laissée tomber. Il y en a presque toujours une.',
      'Repérez le moment où la scène a changé de sujet : où avez-vous cessé de parler de la tâche pour parler de l’attitude ?',
      'Réécrivez la séquence : combien de consignes reste-t-il vraiment ? Souvent trois au lieu de neuf.',
    ],
    reussi:
      'chaque consigne porte un défaut ou un « aucun », vous avez trouvé la consigne abandonnée, et votre séquence réécrite compte moins de consignes que l’originale.',
  },
  carnet: {
    intro: 'Quatre lignes de plus sur la page du module 1.',
    lignes: [
      '<strong>Ma consigne abandonnée</strong> — celle que j’ai faite à sa place.',
      '<strong>Mon moment de bascule</strong> — quand j’ai cessé de parler de la tâche.',
      '<strong>Ma séquence réécrite</strong> — le nombre de consignes avant, et après.',
      '<strong>La fin visible que j’aurais pu donner</strong> — « tu finis ça, et après… ».',
    ],
  },
  vigilance: [
    '<strong>Cette scène n’accuse personne.</strong> La mère de Camille est attentive, polie et cohérente. Ce qui manquait tient entièrement dans la forme et dans le moment.',
    '<strong>« Tu te moques de moi ? » n’est pas une consigne</strong>, c’est une intention prêtée. Dès qu’elle est dite, la tâche cesse d’être le sujet et plus personne ne peut reculer.',
    '<strong>Ne promettez jamais une conséquence que vous n’appliquerez pas</strong>, et n’en annoncez aucune sous tension : elle vous engagera plus qu’elle n’engagera l’autre.',
    '<strong>Trois consignes tenues valent mieux que trente données.</strong> Baisser volontairement le nombre de consignes d’un moment difficile est une décision professionnelle, pas un renoncement.',
  ],
  annexes:
    'la <strong>scène de Camille corrigée</strong> consigne par consigne, la <strong>fiche « une consigne à la fois »</strong>, et le <strong>mémo du choix et de la fausse alternative</strong>.',
  avant: [
    'Ma scène est découpée, et chaque consigne porte un défaut ou un « aucun ».',
    'J’ai identifié ma consigne abandonnée.',
    'Ma séquence réécrite compte moins de consignes que l’originale.',
  ],
};

/* ── MODULE 3 ────────────────────────────────────────────────────────────── */

const M3 = {
  reperes: {
    minutes: 12,
    apres:
      'dix jours de relevé, une minute par jour, sans rien changer d’autre. Le module&nbsp;4 se lit le dixième jour.',
    prerequis: 'les modules 1 et 2, et un comptage d’une heure derrière vous.',
    evaluation:
      'votre liste négociable / non négociable, et vos cinq consignes du moment difficile, écrites mot pour mot.',
  },
  objectifs: [
    'Écrire ce qui est négociable et ce qui ne l’est pas — avant de travailler la forme',
    'Choisir UN moment de la journée, et y réduire volontairement le nombre de consignes',
    'Écrire mot pour mot les cinq consignes qui restent',
    'Décider à l’avance de ce qui se passe au bout des cinq secondes',
    'Rendre la liste applicable par un autre adulte que vous',
  ],
  corps: `<h3 style="${G.H3}">1. D’abord : ce qui est négociable, et ce qui ne l’est pas</h3>
<p>Cette ligne vient <strong>avant</strong> tout travail sur la forme des consignes, et
l’ordre n’est pas un détail. Une méthode qui rend les consignes plus efficaces sans avoir
d’abord trié ce qui mérite d’être exigé fabrique des adultes plus efficaces à obtenir une
obéissance qui ne leur revient pas.</p>
${A.tableau(
  ['Colonne', 'Ce qu’on y met', 'Exemples'],
  [
    [
      '<strong>Non négociable</strong>',
      'La sécurité, la santé, le respect des autres, et les quelques obligations réelles du cadre.',
      'Tenir la main pour traverser&nbsp;; ne pas frapper&nbsp;; prendre le traitement&nbsp;; être présent au repas.',
    ],
    [
      '<strong>Négociable</strong>',
      'Le moment, l’ordre, la manière, la quantité — tout ce qui peut faire l’objet d’un choix sans que rien ne soit perdu.',
      'Quand on range&nbsp;; par quoi on commence&nbsp;; quel pyjama&nbsp;; se laver le soir ou le matin&nbsp;; manger assis à côté de qui.',
    ],
    [
      '<strong>Son droit — ce que je n’ai pas à obtenir</strong>',
      'Ce qui lui appartient. Aucune technique ne doit servir à passer par-dessus.',
      'Un refus de contact ou d’embrassade&nbsp;; ses objets personnels&nbsp;; son intimité&nbsp;; le droit de dire qu’il n’aime pas&nbsp;; le droit de se taire.',
    ],
  ],
)}
<p>La troisième colonne est celle qu’on n’écrit jamais, et c’est celle qui change le
plus de choses. Un adulte qui l’a écrite arrête de livrer trois batailles par jour qui ne
lui appartenaient pas — et il lui reste beaucoup plus d’énergie pour les deux qui
comptent.</p>
${G.alerte(
  'La règle de tri, quand on hésite',
  `<p style="margin-bottom:0">Posez-vous&nbsp;: <strong>«&nbsp;qu’est-ce qui se passe
réellement si je n’obtiens pas&nbsp;?&nbsp;»</strong> Si la réponse est «&nbsp;rien de
grave, mais ça m’agace&nbsp;», ce n’est pas non négociable. Ce n’est pas une raison de
renoncer&nbsp;: c’est une raison de le demander autrement, et de ne pas en faire une
épreuve de force.</p>`,
)}

<h3 style="${G.H3}">2. Un seul moment, et moins de consignes</h3>
<p>On ne réécrit pas une journée. On prend <strong>le moment que votre comptage a
désigné</strong> — le coucher, le repas, la sortie, le retour d’école — et on y travaille
seul.</p>
<p>Première décision, et elle surprend&nbsp;: <strong>on en enlève.</strong> Regardez la
liste des consignes que vous donnez pendant ce moment et rayez celles qui&nbsp;:</p>
<ul style="${G.UL}">
<li style="${G.LI}">relèvent de la colonne «&nbsp;son droit&nbsp;»&nbsp;;</li>
<li style="${G.LI}">sont négociables et ne coûtent rien à laisser tomber ce mois-ci&nbsp;;</li>
<li style="${G.LI}">se répètent tous les jours à l’identique — celles-là deviennent un
<strong>rituel</strong> ou un <strong>support visuel</strong>, pas une consigne&nbsp;;</li>
<li style="${G.LI}">vous ne les suivez jamais jusqu’au bout. Une consigne qu’on abandonne
coûte plus cher que celle qu’on ne donne pas.</li>
</ul>
<p>L’objectif est d’arriver à <strong>cinq consignes maximum</strong> pour ce moment. Les
équipes et les familles qui le font descendent en général de quinze à cinq, et le taux
de refus baisse avant même que la forme n’ait été retravaillée&nbsp;: il y a simplement
moins d’occasions de refuser, et chacune est tenue.</p>

<h3 style="${G.H3}">3. Écrire les cinq, mot pour mot</h3>
<p>Mot pour mot, pas «&nbsp;en gros&nbsp;». Une consigne pensée est toujours meilleure
qu’une consigne dite&nbsp;: c’est en l’écrivant qu’on voit qu’elle est double, vague ou
négative.</p>
<div style="${G.GRIS}">
<p style="margin-top:0"><strong>Le gabarit&nbsp;:</strong> <em>[prénom]</em>,
<em>[verbe à l’impératif ou au présent]</em> <em>[une seule chose, concrète]</em>.</p>
<p style="margin-bottom:0"><strong>Le test&nbsp;:</strong> est-ce que je saurais filmer
quelqu’un en train de l’exécuter&nbsp;? Si non, ce n’est pas encore une consigne.</p>
</div>
${A.tableau(
  ['Ce qu’on dit d’habitude', 'Ce qu’on écrit sur la feuille'],
  [
    ['«&nbsp;On se prépare&nbsp;!&nbsp;»', '«&nbsp;Mets tes chaussures.&nbsp;»'],
    ['«&nbsp;Tu peux mettre la table&nbsp;?&nbsp;»', '«&nbsp;Pose les assiettes.&nbsp;»'],
    ['«&nbsp;Arrête de courir dans le couloir&nbsp;»', '«&nbsp;Tu marches jusqu’à la porte.&nbsp;»'],
    ['«&nbsp;Va te laver et mets ton pyjama&nbsp;»', '«&nbsp;Va à la salle de bain.&nbsp;» (le pyjama viendra après)'],
    ['«&nbsp;Sois sage pendant le repas&nbsp;»', '«&nbsp;Tu restes assis jusqu’au dessert.&nbsp;»'],
    ['«&nbsp;Range un peu tout ça&nbsp;»', '«&nbsp;Mets les Lego dans la caisse bleue.&nbsp;»'],
  ],
)}
<p><strong>Et l’ordre compte&nbsp;:</strong> la consigne qui coûte le plus se donne quand
la personne est le plus disponible, c’est-à-dire rarement en dernier. Regardez votre liste
et déplacez-en une.</p>

<h3 style="${G.H3}">4. Décider maintenant ce qui se passe au bout des cinq secondes</h3>
<p>C’est la partie qu’on improvise, et c’est celle qui se dégrade le plus vite un soir de
fatigue. Elle se décide à froid, en trois lignes&nbsp;:</p>
<div style="${G.GRIS}">
<ul style="${G.UL}">
<li style="${G.LI}"><strong>Rien ne vient au bout de cinq secondes&nbsp;:</strong> je
<em>n’</em>ai <em>pas</em> répété. J’aide — je montre, je commence, je fais la première
étape avec.</li>
<li style="${G.LI}"><strong>Deuxième fois de suite&nbsp;:</strong> je découpe la consigne
en deux plus petites, ou je change de moment. Je ne monte pas le ton.</li>
<li style="${G.LI}"><strong>Troisième fois de suite&nbsp;:</strong> la consigne sort de la
liste pour l’instant. Ce n’est pas un problème d’obéissance, c’est une consigne trop
grosse — et je regarde du côté de la tâche, pas du côté de la personne.</li>
</ul>
</div>
<p>Rien dans ces trois lignes ne ressemble à une sanction, et ce n’est pas un oubli. Une
conséquence décidée sous tension engage l’adulte plus qu’elle n’engage l’autre, et elle
est presque toujours ou trop lourde ou jamais appliquée. Ce qui doit être décidé se décide
à froid, à un autre moment, et se dit une fois — jamais pendant.</p>
${G.exemple(
  'Ce qu’on fait quand la consigne est non négociable et qu’elle est refusée',
  `<p style="margin-bottom:0">On ne renonce pas, et on ne force pas non plus. On
<strong>réduit ce qui est demandé</strong> jusqu’à ce que ce soit faisable&nbsp;: prendre
la main plutôt que traverser seul, s’asseoir à table sans obligation de manger, laisser
le traitement sur la table et proposer le verre. On garde le cap sur ce qui protège, on
lâche tout le reste — et on en reparle plus tard, à froid.</p>`,
)}

<h3 style="${G.H3}">5. La rendre applicable par quelqu’un d’autre</h3>
<p>En institution, deux adultes qui formulent différemment la même attente produisent
zéro consigne&nbsp;: la personne apprend surtout que la règle dépend de qui est là. À la
maison, c’est exactement pareil avec deux parents, ou avec les grands-parents du
week-end.</p>
<ul style="${G.UL}">
<li style="${G.LI}"><strong>La feuille des cinq consignes s’affiche</strong> — dans le
classeur de l’unité, ou à l’intérieur d’une porte de placard.</li>
<li style="${G.LI}"><strong>Elle se lit à voix haute une fois</strong> avec les autres
adultes concernés. Cinq phrases, deux minutes.</li>
<li style="${G.LI}"><strong>La liste négociable / non négociable part avec elle.</strong>
C’est elle qui évite qu’un adulte exige ce qu’un autre a décidé de laisser.</li>
</ul>
<div style="${G.GRIS}">
<p style="margin:0"><strong>Le test&nbsp;:</strong> quelqu’un qui n’était pas dans la
discussion peut-il tenir le moment avec cette feuille seule&nbsp;? Si oui, elle est
bonne. C’est aussi ce qui la rend utile un samedi matin, quand c’est un remplaçant qui
est là.</p>
</div>

<h3 style="${G.H3}">6. Ce que vous devez avoir sur votre feuille en sortant</h3>
<div style="${G.GRIS}">
<ul style="${G.UL}">
<li style="${G.LI}">Trois colonnes remplies&nbsp;: non négociable, négociable, son
droit.</li>
<li style="${G.LI}">Un moment de la journée, un seul.</li>
<li style="${G.LI}">Cinq consignes au maximum, écrites mot pour mot.</li>
<li style="${G.LI}">Les trois lignes du «&nbsp;au bout des cinq secondes&nbsp;».</li>
<li style="${G.LI}">Un endroit où la feuille est affichée, et une personne à qui vous
l’avez lue.</li>
</ul>
</div>
<p>Cinq éléments, une feuille. Si l’un manque, le relevé des dix prochains jours ne
mesurera rien de comparable.</p>`,
  aRetenir:
    'On écrit ce qui est négociable <strong>avant</strong> de rendre les consignes efficaces&nbsp;: sinon on devient seulement plus performant à obtenir ce qu’on n’avait pas à exiger. Puis on descend à <strong>cinq consignes</strong> sur un seul moment, écrites mot pour mot.',
  exercice: {
    nom: 'La feuille du moment difficile',
    duree: '15 minutes',
    quoi: 'On écrit la feuille, en entier, pour un moment précis. Pas « en général ».',
    etapes: [
      'Tracez trois colonnes et remplissez-les : non négociable, négociable, son droit. Au moins trois lignes dans chacune. La troisième est la plus importante.',
      'Choisissez le moment que votre comptage a désigné. Un seul.',
      'Listez toutes les consignes que vous y donnez, puis rayez selon les quatre critères du point 2. Visez cinq.',
      'Écrivez les cinq restantes mot pour mot, avec le gabarit. Passez chacune au test du film.',
      'Regardez l’ordre : déplacez la plus coûteuse vers le moment où la personne est le plus disponible.',
      'Écrivez les trois lignes du « au bout des cinq secondes ».',
      'Affichez la feuille, et lisez-la à voix haute à un autre adulte concerné.',
    ],
    reussi:
      'les trois colonnes sont remplies, il reste cinq consignes ou moins écrites mot pour mot, les trois lignes sont écrites, et quelqu’un d’autre a lu la feuille.',
  },
  carnet: {
    intro: 'La feuille EST le livrable. Recopiez ces cinq lignes au propre.',
    lignes: [
      '<strong>Mes trois colonnes</strong> — et surtout la troisième.',
      '<strong>Mon moment</strong> — un seul, celui que le comptage a désigné.',
      '<strong>Mes cinq consignes</strong> — mot pour mot.',
      '<strong>Mes trois lignes des cinq secondes</strong>.',
      '<strong>Où la feuille est affichée</strong> — et qui l’a lue.',
    ],
  },
  vigilance: [
    '<strong>Réduire le nombre de consignes n’est pas baisser les bras.</strong> C’est concentrer l’autorité là où elle sert, et arrêter de la dépenser en monnaie.',
    '<strong>La colonne « son droit » ne se négocie pas non plus dans l’autre sens.</strong> Ce qui y est écrit n’est pas une faveur qu’on retire un jour de tension.',
    '<strong>Aucune sanction ne figure sur cette feuille</strong>, et c’est volontaire : une conséquence décidée sous tension engage l’adulte plus qu’elle n’engage l’autre.',
    '<strong>Si une consigne non négociable est refusée</strong>, on réduit ce qui est demandé jusqu’à ce que ce soit faisable. On ne force jamais un corps.',
  ],
  annexes:
    'la <strong>fiche des trois colonnes</strong> à remplir, le <strong>gabarit des cinq consignes</strong>, les <strong>vingt consignes réécrites</strong>, et le <strong>mémo « au bout des cinq secondes »</strong>.',
  avant: [
    'Mes trois colonnes sont remplies, la troisième comprise.',
    'Il me reste cinq consignes ou moins, écrites mot pour mot, et chacune passe le test du film.',
    'La feuille est affichée quelque part, et un autre adulte l’a lue.',
  ],
  pause: {
    jours: 'dix jours',
    texte: `<p>Votre feuille est écrite&nbsp;: elle s’applique maintenant, sur ce seul
moment, pendant <strong>dix jours</strong>. Le module&nbsp;4 se lit le dixième jour, le
relevé sous les yeux.</p>
<p>Une minute par jour, à la fin du moment&nbsp;: cinq consignes, cinq croix. C’est le
relevé le plus court du catalogue, et il donne des résultats visibles dès la deuxième
semaine — parce qu’il ne mesure pas la personne d’en face, il mesure votre feuille.</p>
<p style="margin-bottom:0">Date de lancement&nbsp;: …… / …… &nbsp;·&nbsp; date de
lecture&nbsp;: …… / …… .</p>`,
  },
};

/* ── MODULE 4 ────────────────────────────────────────────────────────────── */

const M4 = {
  reperes: {
    minutes: 12,
    prerequis: 'les modules 1 à 3, et une feuille de cinq consignes affichée.',
    evaluation: 'la lecture de votre relevé au dixième jour, et la décision qui suit.',
  },
  objectifs: [
    'Tenir un relevé de cinq croix par jour, sans qu’il devienne un travail',
    'Lire le relevé consigne par consigne plutôt que globalement',
    'Distinguer une consigne à réécrire d’une consigne à retirer',
    'Mesurer sa propre tenue : le silence de cinq secondes, et les consignes abandonnées',
    'Écrire un refus dans un écrit professionnel sans prêter d’intention',
  ],
  corps: `<h3 style="${G.H3}">1. Le relevé : cinq croix, une minute</h3>
<p>À la fin du moment, tous les jours&nbsp;: pour chacune de vos cinq consignes, une
croix dans une colonne. Rien d’autre.</p>
${A.tableau(
  ['Colonne', 'Ce qu’elle veut dire'],
  [
    ['<strong>F</strong>', 'Fait après la consigne seule, dans les cinq secondes ou juste après.'],
    ['<strong>A</strong>', 'Fait avec de l’aide — j’ai montré, commencé, ou fait la première étape avec.'],
    ['<strong>N</strong>', 'Pas fait, ou fait par moi à sa place.'],
    ['<strong>—</strong>', 'La consigne n’a pas été donnée ce jour-là (elle ne s’appliquait pas).'],
  ],
)}
<p>Et <strong>deux cases par jour, pour vous</strong>, qui sont en réalité les plus
utiles du relevé&nbsp;:</p>
<ul style="${G.UL}">
<li style="${G.LI}"><strong>«&nbsp;J’ai tenu les cinq secondes&nbsp;»</strong> —
oui&nbsp;/&nbsp;non. Une seule case pour tout le moment.</li>
<li style="${G.LI}"><strong>«&nbsp;Consignes hors liste données&nbsp;»</strong> — un
nombre. Elles reviennent toujours, et les voir baisser est le premier signe que la
méthode s’installe.</li>
</ul>
${G.alerte(
  'Ce relevé ne mesure pas la personne d’en face',
  `<p style="margin-bottom:0">Il mesure <strong>votre feuille</strong>&nbsp;: la qualité de
vos consignes, votre silence, votre constance. C’est ce qui le rend supportable à tenir,
et c’est aussi ce qui le rend efficace — on ne peut agir que sur ce qui dépend de soi.
Ne le présentez jamais comme un tableau de fautes, et ne l’affichez pas là où la personne
concernée le lira comme tel.</p>`,
)}

<h3 style="${G.H3}">2. Trois règles pendant les dix jours</h3>
<ul style="${G.UL}">
<li style="${G.LI}"><strong>On ne change pas la feuille en route.</strong> Même si une
consigne rate quatre jours de suite&nbsp;: on la note, on l’aide, et on décide au dixième
jour. Changer en cours rend le relevé illisible.</li>
<li style="${G.LI}"><strong>On ne travaille qu’un moment.</strong> Le reste de la journée
continue comme avant, sans culpabilité et sans relevé.</li>
<li style="${G.LI}"><strong>On remplit le jour même.</strong> Rempli le lendemain, un
relevé devient un souvenir — et un souvenir se souvient surtout des mauvais soirs.</li>
</ul>

<h3 style="${G.H3}">3. La lecture du dixième jour, en quatre questions</h3>

<h4 style="margin:26px 0 8px">Question 1 — Consigne par consigne, pas en bloc</h4>
<p>Comptez les F, les A et les N <strong>pour chaque consigne séparément</strong>. C’est
le geste qui donne toute l’information, et c’est celui qu’on saute.</p>
${A.tableau(
  ['Ce que montre la ligne', 'Ce que ça veut dire', 'La décision'],
  [
    [
      'Surtout des <strong>F</strong>',
      'La consigne est bonne et le moment est bon.',
      'On la garde telle quelle. On peut en ajouter une nouvelle au prochain cycle.',
    ],
    [
      'Surtout des <strong>A</strong>',
      'La consigne est comprise, la tâche est un peu trop grosse.',
      'On la découpe en deux, ou on garde l’aide et on la réduit d’un cran — voir «&nbsp;Guider puis s’effacer&nbsp;».',
    ],
    [
      'Surtout des <strong>N</strong>, et toujours la même consigne',
      'Ce n’est pas un problème d’obéissance. C’est la consigne, le moment, ou la tâche.',
      'On la réécrit (défauts du module 1), on change son moment, ou on la retire un mois. Trois essais, pas plus.',
    ],
    [
      'Des <strong>N</strong> répartis sur toutes les lignes, certains jours seulement',
      'Ce sont les journées qui décident, pas les consignes&nbsp;: fatigue, retour de week-end, changement, douleur.',
      'On regarde le jour, pas la consigne. Et on allège la liste ces jours-là — décider à l’avance qu’il n’y en a que deux.',
    ],
  ],
)}

<h4 style="margin:26px 0 8px">Question 2 — Ai-je tenu les cinq secondes ?</h4>
<p>Comptez vos «&nbsp;oui&nbsp;» en semaine 1, puis en semaine 2. Deux nombres. C’est la
mesure de votre propre progression, et elle bouge vite&nbsp;: la plupart des adultes
passent de deux ou trois jours sur cinq à quatre ou cinq.</p>
<p>Si elle ne bouge pas, la cause est presque toujours matérielle et non pédagogique&nbsp;:
le moment est trop serré pour supporter cinq secondes de silence. On déplace le moment de
quinze minutes avant de retravailler quoi que ce soit.</p>

<h4 style="margin:26px 0 8px">Question 3 — Combien de consignes hors liste ?</h4>
<p>Moyenne semaine 1, moyenne semaine 2. Ce nombre baisse presque toujours, et c’est le
résultat le plus visible du parcours pour l’entourage&nbsp;: le moment devient plus
calme parce qu’il contient moins d’injonctions, pas parce que quelqu’un obéit
davantage.</p>

<h4 style="margin:26px 0 8px">Question 4 — Qu’est-ce qui est sorti de la liste tout seul ?</h4>
<p>Regardez les consignes marquées «&nbsp;—&nbsp;» plusieurs jours de suite&nbsp;: elles
ne s’appliquaient pas, ou elles sont devenues un rituel. Une consigne devenue rituelle est
une victoire complète&nbsp;: elle n’a plus besoin d’être donnée. Retirez-la de la feuille
et remplacez-la par une nouvelle.</p>
${G.exemple(
  'La progression normale, en trois cycles de dix jours',
  `<p style="margin-bottom:0"><strong>Cycle 1&nbsp;:</strong> la feuille se tient, le
nombre de consignes hors liste baisse, une ou deux consignes passent en F.
<strong>Cycle 2&nbsp;:</strong> les consignes en A sont découpées, une consigne
irréductible est retirée, une nouvelle entre. <strong>Cycle 3&nbsp;:</strong> on ouvre un
deuxième moment de la journée. C’est le rythme réel&nbsp;; vouloir traiter la journée
entière au premier cycle est la façon la plus sûre de tout abandonner.</p>`,
)}

<h3 style="${G.H3}">4. Écrire un refus dans un écrit professionnel</h3>
<p>Ce qui est écrit après un refus reste dans un dossier bien plus longtemps que le refus
lui-même, et oriente toutes les lectures suivantes. Trois règles&nbsp;:</p>
<ul style="${G.UL}">
<li style="${G.LI}"><strong>On écrit la consigne, pas seulement le refus.</strong> Un
refus sans la demande qui l’a précédé n’est pas une information.</li>
<li style="${G.LI}"><strong>On ne prête aucune intention.</strong>
«&nbsp;S’oppose&nbsp;», «&nbsp;provoque&nbsp;», «&nbsp;teste les limites&nbsp;»,
«&nbsp;refuse l’autorité&nbsp;» sont des interprétations, et elles se transmettent comme
des faits.</li>
<li style="${G.LI}"><strong>On ne généralise pas.</strong> «&nbsp;Refuse
systématiquement&nbsp;» est presque toujours démenti par un comptage&nbsp;: écrivez le
comptage.</li>
</ul>
${A.tableau(
  ['À ne pas écrire', 'Pourquoi', 'À écrire'],
  [
    [
      'S’oppose systématiquement aux consignes.',
      'Une généralisation, presque toujours fausse en proportion, et qui devient une caractéristique de la personne.',
      'Sur dix jours, quatre consignes sur cinq sont suivies au coucher&nbsp;; la cinquième (le brossage des dents) ne l’est pas.',
    ],
    [
      'Refuse l’autorité de l’adulte.',
      'Prête une intention et déplace le sujet vers la relation, où plus rien n’est vérifiable.',
      'Les refus se concentrent sur les consignes données pendant une activité en cours. Prévenir deux minutes avant a supprimé trois refus sur quatre.',
    ],
    [
      'Ne fait rien sans qu’on lui répète dix fois.',
      'Décrit la personne, alors que c’est la conduite de l’adulte qui produit la répétition.',
      'La consigne était répétée en moyenne trois fois. Depuis la mise en place d’un délai de cinq secondes sans répétition, elle est suivie à la première demande quatre jours sur cinq.',
    ],
    [
      'Est dans la provocation.',
      'Un jugement, non vérifiable, et il rend toute lecture bienveillante impossible pour ceux qui liront après vous.',
      'A répondu «&nbsp;non&nbsp;» à trois consignes du matin, puis a exécuté les trois après reformulation.',
    ],
  ],
)}
<p><strong>Le test&nbsp;:</strong> accepteriez-vous de lire cette phrase à voix haute
devant la personne concernée et devant sa famille&nbsp;? Si la réponse est non, elle
n’est pas encore assez précise.</p>

<h3 style="${G.H3}">5. Quand cette compétence ne suffit plus</h3>
<ul style="${G.UL}">
<li style="${G.LI}">Les refus portent toujours sur la même tâche →
<strong>«&nbsp;Décomposer une routine en étapes&nbsp;»</strong>, puis
<strong>«&nbsp;Guider puis s’effacer&nbsp;»</strong>. C’est un problème de difficulté, pas
de consigne.</li>
<li style="${G.LI}">Les refus arrivent surtout aux changements et aux imprévus →
<strong>«&nbsp;Rendre l’environnement prévisible&nbsp;»</strong>.</li>
<li style="${G.LI}">Le refus obtient quelque chose de précis à chaque fois, ou tourne
régulièrement à la crise → <strong>«&nbsp;Les quatre fonctions d’un comportement&nbsp;»</strong>,
puis <strong>«&nbsp;Apprendre à demander plutôt qu’à crier&nbsp;»</strong> et
<strong>«&nbsp;Les premières minutes d’une crise&nbsp;»</strong>.</li>
<li style="${G.LI}">Le refus est apparu brutalement, sur des choses qui ne posaient pas
problème → un avis médical avant toute analyse éducative. La douleur, le sommeil et un
changement de traitement produisent des refus qu’aucune reformulation ne lèvera.</li>
</ul>`,
  aRetenir:
    'Le relevé ne mesure pas la personne d’en face&nbsp;: il mesure <strong>votre feuille</strong>. Les deux nombres qui bougent en premier sont le nombre de consignes hors liste et le nombre de jours où vous avez tenu les cinq secondes — et ce sont les seuls qui dépendent entièrement de vous.',
  exercice: {
    nom: 'La lecture du dixième jour',
    duree: '12 minutes, le relevé sous les yeux',
    quoi: 'Feuille en main. La mémoire garde les deux pires soirs et efface les huit autres.',
    etapes: [
      'Pour chacune de vos cinq consignes, comptez les F, les A et les N. Cinq lignes de trois nombres.',
      'Placez chaque consigne dans une des quatre lectures du point 3, et écrivez la décision correspondante.',
      'Comptez vos « oui » aux cinq secondes : semaine 1, semaine 2. Deux nombres.',
      'Faites la moyenne des consignes hors liste : semaine 1, semaine 2. Deux nombres.',
      'Repérez ce qui est devenu un rituel — les « — » répétés — et retirez-le de la feuille.',
      'Écrivez la feuille du cycle suivant : ce qui reste, ce qui est découpé, ce qui est retiré, ce qui entre. Et une date de relecture.',
      'Réécrivez enfin une phrase d’écrit professionnel avec les trois règles du point 4, et passez-la au test de la lecture à voix haute.',
    ],
    reussi:
      'vous avez quinze nombres, une décision par consigne, une feuille pour le cycle suivant avec sa date, et une phrase d’écrit que vous liriez devant la famille.',
  },
  carnet: {
    intro: 'Les dernières lignes du carnet. Elles constituent votre bilan.',
    lignes: [
      '<strong>Mes cinq lignes F / A / N</strong> — une par consigne.',
      '<strong>Mes cinq secondes</strong> — semaine 1, semaine 2.',
      '<strong>Mes consignes hors liste</strong> — semaine 1, semaine 2.',
      '<strong>Ce qui est devenu un rituel</strong> — et ce qui entre à sa place.',
      '<strong>Ma feuille du cycle suivant</strong> — et sa date de relecture.',
    ],
  },
  vigilance: [
    '<strong>Ne lisez pas le relevé globalement.</strong> Une moyenne sur cinq consignes ne dit rien : c’est ligne par ligne que l’information apparaît.',
    '<strong>Trois essais sur une consigne, pas davantage.</strong> Réécrite, déplacée, découpée — si elle rate encore, elle sort de la liste pour un mois. Ce n’est pas un échec, c’est une donnée.',
    '<strong>Le relevé n’entre pas au dossier tel quel.</strong> C’est un outil de travail des adultes ; ce qui entre au dossier est ce que l’équipe a validé.',
    '<strong>Si les refus augmentent nettement pendant les dix jours</strong>, arrêtez et regardez ailleurs : douleur, sommeil, événement, changement d’adulte. Une aggravation n’est pas une donnée à collecter, c’est un signal.',
    '<strong>Un enfant qui obéit à tout n’est pas un objectif.</strong> Savoir dire non, y compris à un adulte, est une compétence de protection — et la colonne « son droit » du module 3 est là pour ça.',
  ],
  annexes:
    'le <strong>relevé de dix jours</strong> à cinq lignes, la <strong>fiche de lecture</strong> aux quatre questions, et le <strong>tableau des phrases d’écrit professionnel</strong>.',
  avant: [
    'J’ai dix jours de relevé, avec mes deux cases personnelles remplies.',
    'J’ai compté F, A et N pour chaque consigne séparément — comptés, pas estimés.',
    'J’ai une feuille pour le cycle suivant, datée, et une phrase d’écrit réécrite.',
  ],
};

/* ── ANNEXES ─────────────────────────────────────────────────────────────── */

const ANNEXES =
  A.entete('L’enfant qui dit non à tout') +
  A.fiche({
    numero: 1,
    titre: 'La grille de comptage d’une heure',
    quand: 'une fois maintenant, puis à chaque fois que l’impression « il refuse tout » revient.',
    contenu:
      `<p>Une heure, un stylo, des bâtons. On ne note rien d’autre&nbsp;: écrire davantage
fait arrêter de compter au bout de dix minutes.</p>` +
      A.tableau(
        ['', 'Bâtons', 'Total'],
        [
          ['<strong>Consignes données</strong>', '', ''],
          ['<strong>Consignes refusées</strong>', '', ''],
          ['<strong>Consignes abandonnées</strong> (ni suivies, ni reprises)', '', ''],
        ],
      ) +
      `<div style="${G.GRIS}">
<p style="margin-top:0"><strong>Ma proportion&nbsp;:</strong> …… refus sur …… consignes.</p>
<p style="margin:14px 0 0"><strong>Mes deux moments&nbsp;:</strong> ………………………… et
…………………………</p>
<p style="margin-bottom:0"><strong>Les mots exacts du refus&nbsp;:</strong>
«&nbsp;………………………………&nbsp;»</p>
</div>
<p><strong>Ce qu’on découvre presque toujours&nbsp;:</strong> le nombre est plus élevé
qu’on ne croyait, la proportion de refus plus basse, et les refus concentrés sur deux
moments. Aucun des trois ne se voit sans compter.</p>`,
  }) +
  A.fiche({
    numero: 2,
    titre: 'Les cinq « non » — table de lecture',
    quand: 'à relire avant de répondre à un refus qui revient.',
    contenu:
      A.tableau(
        ['Le « non » veut dire', 'Ce qui le trahit', 'Ce qui marche', 'Ce qui aggrave'],
        [
          [
            '<strong>Je n’ai pas compris</strong>',
            'Regarde ailleurs, fait autre chose, répète la fin de votre phrase, exécute une partie seulement.',
            'Redire autrement, plus court. Montrer. Réduire à une seule chose.',
            'Répéter à l’identique, plus fort.',
          ],
          [
            '<strong>Je ne peux pas</strong>',
            'Le refus revient toujours sur la même tâche, ou la même étape.',
            'Aider, découper, faire ensemble la première étape.',
            'Insister&nbsp;: on obtient un échec, et la tâche coûte plus cher la fois suivante.',
          ],
          [
            '<strong>Je n’ai pas fini</strong>',
            'Le refus arrive au milieu de quelque chose, et la personne y retourne.',
            'Prévenir avant. Donner une fin visible. Attendre la fin de l’unité en cours.',
            'Interrompre net — le déclencheur de crise le plus fréquent.',
          ],
          [
            '<strong>Je ne veux pas maintenant</strong>',
            'La personne accepte si on repose la question dix minutes plus tard.',
            'Négocier le moment, pas la tâche. Et tenir le choix donné.',
            'En faire un enjeu d’autorité.',
          ],
          [
            '<strong>Je ne veux pas, point</strong>',
            'Constant, calme, quel que soit le moment ou la formulation.',
            'Vérifier si c’est un refus qu’on a le droit d’entendre. Sinon, chercher la fonction.',
            'Traiter les cinq cas comme celui-là.',
          ],
        ],
      ) +
      `<div style="${G.GRIS}">
<p style="margin:0"><strong>Avant de répondre&nbsp;:</strong> lequel des cinq&nbsp;? La
question prend deux secondes et évite quatre erreurs sur cinq.</p>
</div>`,
  }) +
  A.fiche({
    numero: 3,
    titre: 'Les sept défauts, et vingt consignes réécrites',
    quand: 'au moment d’écrire vos cinq consignes, et chaque fois qu’une consigne rate deux fois.',
    contenu:
      A.tableau(
        ['Le défaut', 'La question de contrôle'],
        [
          ['<strong>1. Formulée en question</strong>', 'Est-ce que j’accepterais un «&nbsp;non&nbsp;»&nbsp;? Si non, ce n’était pas une question.'],
          ['<strong>2. Formulée en négatif</strong>', 'Est-ce que je dis ce qu’il faut FAIRE&nbsp;?'],
          ['<strong>3. Double ou triple</strong>', 'Y a-t-il un «&nbsp;et&nbsp;», un «&nbsp;puis&nbsp;», un «&nbsp;après&nbsp;»&nbsp;?'],
          ['<strong>4. Vague</strong>', 'Est-ce que je saurais filmer quelqu’un en train de l’exécuter&nbsp;?'],
          ['<strong>5. À distance, sans attention</strong>', 'Suis-je sûr qu’elle a été entendue&nbsp;?'],
          ['<strong>6. Au mauvais moment</strong>', 'Est-ce que je demande d’arrêter <em>et</em> de faire&nbsp;?'],
          ['<strong>7. Noyée dans un flot</strong>', 'La consigne est-elle la phrase la plus courte de mon message&nbsp;?'],
        ],
      ) +
      `<h4 style="margin:30px 0 8px">Vingt consignes réécrites</h4>` +
      A.tableau(
        ['Ce qu’on dit', 'Ce qui s’exécute'],
        [
          ['«&nbsp;Tu peux ranger&nbsp;?&nbsp;»', '«&nbsp;Mets les Lego dans la caisse bleue.&nbsp;»'],
          ['«&nbsp;On se prépare&nbsp;!&nbsp;»', '«&nbsp;Mets tes chaussures.&nbsp;»'],
          ['«&nbsp;Ne cours pas&nbsp;»', '«&nbsp;Tu marches jusqu’à la porte.&nbsp;»'],
          ['«&nbsp;Arrête de crier&nbsp;»', '«&nbsp;Parle doucement.&nbsp;»'],
          ['«&nbsp;Ne touche pas&nbsp;»', '«&nbsp;Mains dans les poches.&nbsp;»'],
          ['«&nbsp;Sois sage à table&nbsp;»', '«&nbsp;Tu restes assis jusqu’au dessert.&nbsp;»'],
          ['«&nbsp;Range ta chambre&nbsp;»', '«&nbsp;Les habits sales dans le panier.&nbsp;»'],
          ['«&nbsp;Dépêche-toi&nbsp;»', '«&nbsp;Mets ton manteau.&nbsp;»'],
          ['«&nbsp;Tu te laves et tu mets ton pyjama&nbsp;»', '«&nbsp;Va à la salle de bain.&nbsp;» (le pyjama ensuite)'],
          ['«&nbsp;Fais attention&nbsp;»', '«&nbsp;Tiens le verre à deux mains.&nbsp;»'],
          ['«&nbsp;Tu veux bien aider&nbsp;?&nbsp;»', '«&nbsp;Pose les assiettes.&nbsp;»'],
          ['«&nbsp;Arrête l’écran&nbsp;»', '«&nbsp;Tu finis cette vidéo, et après tu me donnes la tablette.&nbsp;»'],
          ['«&nbsp;Sois gentil avec ta sœur&nbsp;»', '«&nbsp;Rends-lui la voiture rouge.&nbsp;»'],
          ['«&nbsp;On y va&nbsp;!&nbsp;»', '«&nbsp;Lève-toi et va à la porte.&nbsp;»'],
          ['«&nbsp;Ne mets pas les pieds sur le canapé&nbsp;»', '«&nbsp;Pieds par terre.&nbsp;»'],
          ['«&nbsp;Tu as fini tes devoirs&nbsp;?&nbsp;»', '«&nbsp;Montre-moi ton cahier.&nbsp;»'],
          ['«&nbsp;Calme-toi&nbsp;»', '(rien&nbsp;: pendant une montée, on retire, on n’ajoute pas)'],
          ['«&nbsp;Écoute-moi quand je te parle&nbsp;»', '(se déplacer, être en face, dire le prénom, puis la consigne)'],
          ['«&nbsp;Il faudrait penser à mettre tes affaires&nbsp;»', '«&nbsp;Mets ton sac dans le placard.&nbsp;»'],
          ['«&nbsp;Vous rangez tous&nbsp;!&nbsp;» (en groupe)', '«&nbsp;Sami, mets les feutres dans la boîte.&nbsp;» (une par personne)'],
        ],
      ) +
      `<p><strong>Deux consignes n’ont pas de version exécutable</strong>, et c’est
volontaire&nbsp;: «&nbsp;calme-toi&nbsp;» et «&nbsp;écoute-moi&nbsp;» ne se reformulent
pas, elles se remplacent par autre chose que des mots.</p>`,
  }) +
  A.fiche({
    numero: 4,
    titre: 'Négociable, non négociable, et ce qui ne m’appartient pas',
    quand: 'avant d’écrire la moindre consigne. À remplir en équipe, ou à deux à la maison.',
    contenu:
      A.tableau(
        ['<strong>Non négociable</strong><br><em>sécurité, santé, respect des autres</em>', '<strong>Négociable</strong><br><em>le moment, l’ordre, la manière, la quantité</em>', '<strong>Son droit</strong><br><em>ce que je n’ai pas à obtenir</em>'],
        [['', '', ''], ['', '', ''], ['', '', ''], ['', '', ''], ['', '', '']],
      ) +
      `<div style="${G.GRIS}">
<p style="margin-top:0"><strong>La règle de tri, quand on hésite&nbsp;:</strong>
qu’est-ce qui se passe réellement si je n’obtiens pas&nbsp;? Si la réponse est
«&nbsp;rien de grave, mais ça m’agace&nbsp;», ce n’est pas non négociable.</p>
<p style="margin-bottom:0">Ce n’est pas une raison de renoncer&nbsp;: c’est une raison de
le demander autrement, et de ne pas en faire une épreuve de force.</p>
</div>
<h4 style="margin:30px 0 8px">Ce qui va toujours dans la troisième colonne</h4>
<ul style="${G.UL}">
<li style="${G.LI}">Le refus d’un contact, d’une embrassade, d’une main sur l’épaule.</li>
<li style="${G.LI}">Ses objets personnels, son espace, son intimité.</li>
<li style="${G.LI}">Le droit de dire qu’il n’aime pas, qu’il n’a pas envie, qu’il trouve
ça nul.</li>
<li style="${G.LI}">Le droit de se taire, et de ne pas raconter.</li>
<li style="${G.LI}">Son moyen de communication, quel qu’il soit — il ne se retire jamais,
à aucun titre.</li>
</ul>
<p><strong>C’est la colonne qu’on n’écrit jamais, et celle qui change le plus de
choses.</strong> Un adulte qui l’a écrite arrête de livrer trois batailles par jour qui ne
lui appartenaient pas.</p>`,
  }) +
  A.fiche({
    numero: 5,
    titre: 'La feuille des cinq consignes',
    quand: 'une fois par moment difficile. À afficher, et à lire à voix haute aux autres adultes.',
    contenu: `<div style="${G.GRIS}">
<p style="margin-top:0"><strong>Le moment&nbsp;:</strong> ……………………………………
&nbsp;·&nbsp; <strong>écrite le&nbsp;:</strong> …… / …… &nbsp;·&nbsp;
<strong>revue le&nbsp;:</strong> …… / ……</p>
<p style="margin:16px 0 0"><strong>1.</strong> «&nbsp;………………………………………………………&nbsp;»</p>
<p style="margin:12px 0 0"><strong>2.</strong> «&nbsp;………………………………………………………&nbsp;»</p>
<p style="margin:12px 0 0"><strong>3.</strong> «&nbsp;………………………………………………………&nbsp;»</p>
<p style="margin:12px 0 0"><strong>4.</strong> «&nbsp;………………………………………………………&nbsp;»</p>
<p style="margin:12px 0 0"><strong>5.</strong> «&nbsp;………………………………………………………&nbsp;»</p>
</div>
<h4 style="margin:30px 0 8px">Au bout des cinq secondes — décidé maintenant</h4>
<ul style="${G.UL}">
<li style="${G.LI}"><strong>Rien ne vient&nbsp;:</strong> je ne répète pas. J’aide — je
montre, je commence, je fais la première étape avec.</li>
<li style="${G.LI}"><strong>Deuxième fois de suite&nbsp;:</strong> je découpe la consigne
en deux, ou je change son moment. Je ne monte pas le ton.</li>
<li style="${G.LI}"><strong>Troisième fois de suite&nbsp;:</strong> la consigne sort de la
liste pour un mois. C’est la tâche qu’il faut regarder, pas la personne.</li>
</ul>
<h4 style="margin:30px 0 8px">Les quatre critères pour rayer une consigne</h4>
<ul style="${G.UL}">
<li style="${G.LI}">Elle relève de la colonne «&nbsp;son droit&nbsp;».</li>
<li style="${G.LI}">Elle est négociable et ne coûte rien à laisser tomber ce mois-ci.</li>
<li style="${G.LI}">Elle revient tous les jours à l’identique → elle devient un rituel ou
un support visuel, pas une consigne.</li>
<li style="${G.LI}">Vous ne la suivez jamais jusqu’au bout.</li>
</ul>
<div style="${G.GRIS}">
<p style="margin:0"><strong>Le test&nbsp;:</strong> quelqu’un qui n’était pas dans la
discussion peut-il tenir ce moment avec cette feuille seule&nbsp;?</p>
</div>`,
  }) +
  A.fiche({
    numero: 6,
    titre: 'La scène de Camille, corrigée consigne par consigne',
    quand: 'comme modèle, à côté de votre propre scène.',
    contenu:
      A.tableau(
        ['Ce qui a été dit', 'Le défaut', 'Ce qui aurait pu être dit'],
        [
          [
            '«&nbsp;Tu peux ranger ta chambre s’il te plaît&nbsp;?&nbsp;» (depuis la cuisine)',
            'Question + vague + à distance + au mauvais moment.',
            'Entrer, s’accroupir, regarder le dessin&nbsp;: «&nbsp;Il est beau. Tu le finis, et après on range. Tu me dis quand tu as fini.&nbsp;»',
          ],
          [
            '«&nbsp;J’ai demandé de ranger&nbsp;!&nbsp;» (depuis le couloir)',
            'Répétition, plus fort, toujours à distance.',
            'Rien. On attend la fin annoncée.',
          ],
          [
            '«&nbsp;Tu ranges tes Lego et tes feutres, et après tes habits sales… et ne laisse pas traîner tes chaussons.&nbsp;»',
            'Triple + négatif + noyée.',
            '«&nbsp;Mets les Lego dans la caisse bleue.&nbsp;» Puis silence, cinq secondes. La suivante quand celle-là est finie.',
          ],
          [
            '«&nbsp;Tu te moques de moi&nbsp;?&nbsp;»',
            'Intention prêtée&nbsp;: la scène change de sujet.',
            'Rien. Elle a fait ce qui avait été demandé de façon compréhensible&nbsp;: deux Lego, après une consigne triple.',
          ],
          [
            '«&nbsp;Tu ranges ou il n’y a pas de parc.&nbsp;»',
            'Fausse alternative, sous tension, qui engage l’adulte.',
            'Aucune conséquence annoncée pendant. Ce qui doit être décidé se décide à froid.',
          ],
          [
            'La chambre rangée le soir par la mère.',
            'La consigne abandonnée — ce qui coûte le plus cher.',
            'Trois consignes seulement, tenues jusqu’au bout. Les chaussons&nbsp;: pas aujourd’hui.',
          ],
        ],
      ) +
      `<div style="${G.GRIS}">
<p style="margin:0"><strong>Ce qui a changé&nbsp;:</strong> aucune récompense, aucune
menace, aucun ton nouveau. Une fin visible, une consigne à la fois, et trois au lieu de
neuf.</p>
</div>`,
  }) +
  A.fiche({
    numero: 7,
    titre: 'Le choix, et la fausse alternative',
    quand: 'chaque fois qu’on est tenté de proposer un choix pour débloquer.',
    contenu:
      A.tableau(
        ['Ce qu’on propose', 'Est-ce un vrai choix ?', 'Pourquoi'],
        [
          ['«&nbsp;Le pyjama bleu ou le vert&nbsp;?&nbsp;»', '<strong>Oui</strong>', 'Deux options, les deux vous conviennent, le choix porte sur le comment.'],
          ['«&nbsp;Tu ranges maintenant ou après ce dessin&nbsp;?&nbsp;»', '<strong>Oui</strong>', 'Le choix porte sur le quand. À condition de tenir la réponse.'],
          ['«&nbsp;Tu veux ranger&nbsp;?&nbsp;»', '<strong>Non</strong>', 'C’est une question dont on refusera la réponse. Elle enseigne que «&nbsp;non&nbsp;» ne compte pas.'],
          ['«&nbsp;Tu ranges ou tu vas dans ta chambre.&nbsp;»', '<strong>Non</strong>', 'Une menace habillée en choix. Elle marche une ou deux fois, puis abîme les vrais choix.'],
          ['«&nbsp;Tu veux quoi pour le goûter&nbsp;?&nbsp;» (rien n’est prêt)', '<strong>Non</strong>', 'Un choix ouvert sur ce qui n’existe pas. Il produit un refus qu’on aura fabriqué.'],
          ['«&nbsp;On commence par les dents ou par le pyjama&nbsp;?&nbsp;»', '<strong>Oui</strong>', 'Le choix porte sur l’ordre. Les deux mènent au même endroit.'],
        ],
      ) +
      `<div style="${G.GRIS}">
<p style="margin-top:0"><strong>Les trois conditions&nbsp;:</strong></p>
<ul style="${G.UL}">
<li style="${G.LI}">deux options, pas plus, et les deux vous conviennent&nbsp;;</li>
<li style="${G.LI}">le choix porte sur le <em>comment</em> ou le <em>quand</em>, jamais sur
le <em>si</em>&nbsp;;</li>
<li style="${G.LI}">le choix est tenu — sinon il cesse de fonctionner pour longtemps.</li>
</ul>
</div>`,
  }) +
  A.fiche({
    numero: 8,
    titre: 'Le relevé de dix jours — cinq lignes',
    quand: 'à la fin du moment, tous les jours. Une minute.',
    contenu:
      A.tableau(
        ['Consigne', 'J1', 'J2', 'J3', 'J4', 'J5', 'J6', 'J7', 'J8', 'J9', 'J10'],
        [
          ['1. ………………………', '', '', '', '', '', '', '', '', '', ''],
          ['2. ………………………', '', '', '', '', '', '', '', '', '', ''],
          ['3. ………………………', '', '', '', '', '', '', '', '', '', ''],
          ['4. ………………………', '', '', '', '', '', '', '', '', '', ''],
          ['5. ………………………', '', '', '', '', '', '', '', '', '', ''],
          ['<strong>J’ai tenu les 5 secondes</strong>', '', '', '', '', '', '', '', '', '', ''],
          ['<strong>Consignes hors liste</strong>', '', '', '', '', '', '', '', '', '', ''],
        ],
      ) +
      `<p><em><strong>F</strong> = fait après la consigne seule · <strong>A</strong> = fait
avec de l’aide · <strong>N</strong> = pas fait, ou fait par moi · <strong>—</strong> = la
consigne ne s’appliquait pas ce jour-là.</em></p>
<div style="${G.GRIS}">
<p style="margin-top:0"><strong>Les trois règles des dix jours&nbsp;:</strong></p>
<ul style="${G.UL}">
<li style="${G.LI}">On ne change pas la feuille en route, même si une consigne rate quatre
jours de suite.</li>
<li style="${G.LI}">On ne travaille qu’un moment. Le reste de la journée continue comme
avant, sans relevé et sans culpabilité.</li>
<li style="${G.LI}">On remplit le jour même. Rempli le lendemain, un relevé devient un
souvenir — et un souvenir se souvient des mauvais soirs.</li>
</ul>
</div>`,
  }) +
  A.fiche({
    numero: 9,
    titre: 'La lecture du dixième jour',
    quand: 'le dixième jour, le relevé sous les yeux.',
    contenu:
      `<div style="${G.GRIS}">
<p style="margin-top:0"><strong>Mes nombres&nbsp;:</strong></p>
<p style="margin:0">Cinq secondes tenues&nbsp;: …… / 5 en semaine 1, …… / 5 en semaine 2
&nbsp;·&nbsp; consignes hors liste&nbsp;: …… puis ……</p>
</div>` +
      A.tableau(
        ['Ce que montre la LIGNE (une consigne)', 'Ce que ça veut dire', 'La décision'],
        [
          ['Surtout des <strong>F</strong>', 'La consigne est bonne, le moment est bon.', 'On la garde. On peut en ajouter une nouvelle au cycle suivant.'],
          ['Surtout des <strong>A</strong>', 'Comprise, mais la tâche est un peu trop grosse.', 'On la découpe en deux, ou on réduit l’aide d’un cran.'],
          ['Surtout des <strong>N</strong>, toujours la même consigne', 'Ce n’est pas l’obéissance&nbsp;: c’est la consigne, le moment, ou la tâche.', 'La réécrire, ou changer son moment, ou la retirer un mois. Trois essais, pas plus.'],
          ['Des <strong>N</strong> sur toutes les lignes, certains jours', 'Ce sont les journées qui décident&nbsp;: fatigue, retour de week-end, changement, douleur.', 'Regarder le jour, pas la consigne. Décider à l’avance qu’il n’y en a que deux ces jours-là.'],
          ['Des <strong>—</strong> répétés', 'La consigne est devenue un rituel, ou ne s’applique plus.', 'Victoire complète&nbsp;: la retirer de la feuille et en faire entrer une nouvelle.'],
        ],
      ) +
      `<div style="${G.GRIS}">
<p style="margin-top:0"><strong>Ma feuille du cycle suivant&nbsp;:</strong> ce qui reste
…………, ce qui est découpé …………, ce qui est retiré …………, ce qui entre …………</p>
<p style="margin-bottom:0"><strong>Je la relis le&nbsp;:</strong> …… / …… / ……</p>
</div>
<p><strong>La progression réelle, en trois cycles&nbsp;:</strong> cycle 1, la feuille se
tient et les consignes hors liste baissent&nbsp;; cycle 2, on découpe, on retire, on
ajoute&nbsp;; cycle 3, on ouvre un deuxième moment de la journée. Vouloir traiter la
journée entière au premier cycle est la façon la plus sûre de tout abandonner.</p>`,
  }) +
  A.fiche({
    numero: 10,
    titre: 'Écrire un refus — tableau des phrases',
    quand: 'à chaque écrit : cahier de liaison, transmission, bilan, projet.',
    contenu:
      A.tableau(
        ['À ne pas écrire', 'Pourquoi', 'À écrire'],
        [
          [
            'S’oppose systématiquement aux consignes.',
            'Généralisation presque toujours démentie par un comptage, et qui devient une caractéristique de la personne.',
            'Sur dix jours, quatre consignes sur cinq sont suivies au coucher&nbsp;; la cinquième (le brossage des dents) ne l’est pas.',
          ],
          [
            'Refuse l’autorité de l’adulte.',
            'Prête une intention et déplace le sujet vers la relation, où plus rien n’est vérifiable.',
            'Les refus se concentrent sur les consignes données pendant une activité en cours. Prévenir deux minutes avant a supprimé trois refus sur quatre.',
          ],
          [
            'Ne fait rien sans qu’on lui répète dix fois.',
            'Décrit la personne, alors que c’est la conduite de l’adulte qui produit la répétition.',
            'La consigne était répétée en moyenne trois fois. Depuis la mise en place d’un délai de cinq secondes sans répétition, elle est suivie à la première demande quatre jours sur cinq.',
          ],
          [
            'Est dans la provocation. / Teste les limites.',
            'Jugements non vérifiables, qui rendent toute lecture bienveillante impossible pour ceux qui liront après vous.',
            'A répondu «&nbsp;non&nbsp;» à trois consignes du matin, puis a exécuté les trois après reformulation.',
          ],
          [
            'Refuse par principe la moindre demande.',
            '«&nbsp;Par principe&nbsp;» prête une position idéologique à un enfant.',
            'Les refus portent sur les demandes formulées à distance. En face et avec le prénom, ils disparaissent presque tous.',
          ],
        ],
      ) +
      `<div style="${G.GRIS}">
<p style="margin:0"><strong>Le test&nbsp;:</strong> accepteriez-vous de lire cette phrase
à voix haute devant la personne concernée et devant sa famille&nbsp;? Si non, elle n’est
pas encore assez précise.</p>
</div>
<p><strong>Et une règle qui ne souffre aucune exception&nbsp;:</strong> on ne réécrit
jamais un écrit déjà versé au dossier pour le rendre plus flatteur. On complète, on date,
on signe.</p>`,
  }) +
  A.pied();

module.exports = {
  slug: 'l-enfant-qui-dit-non-a-tout',
  uuid: '6cd59c2e-2fbd-426e-a7d7-02755dbff8dc',
  modules: [
    { titre: 'Module 1 — Les cinq « non », les sept défauts, les cinq secondes', minutes: 12, html: G.assembler(M1) },
    { titre: 'Module 2 — Une scène qui dérape, consigne par consigne', minutes: 10, html: G.assembler(M2) },
    { titre: 'Module 3 — Exercice guidé : la feuille des cinq consignes', minutes: 12, html: G.assembler(M3) },
    { titre: 'Module 4 — Dix jours de relevé, et ce qu’on écrit après', minutes: 12, html: G.assembler(M4) },
  ],
  annexes: ANNEXES,
};
