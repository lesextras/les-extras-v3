/**
 * F10 — AIDER QUELQU'UN À DÉMARRER UNE TÂCHE
 *
 * Compétence : réduire le coût du DÉMARRAGE d'une tâche — identifier ce qui
 * coûte à l'entrée, et agir sur les six leviers correspondants.
 *
 * ── LA FRONTIÈRE AVEC LES AUTRES PARCOURS, ET POURQUOI ELLE TIENT ───────────
 * Ce parcours s'arrête volontairement au démarrage. Il ne traite PAS :
 *   · le retrait de l'aide une fois qu'elle marche → « Guider puis s'effacer » ;
 *   · l'apprentissage de la séquence elle-même → « Décomposer une routine » ;
 *   · la forme de la consigne → « L'enfant qui dit non à tout » ;
 *   · ce que le refus obtient → « Les quatre fonctions d'un comportement ».
 * C'est ce qui permet de tenir la règle du catalogue : une formation = une
 * compétence. Le module 1 dit explicitement quand aller voir ailleurs, et le
 * module 4 le redit avec le relevé sous les yeux.
 *
 * ⚠ CE PARCOURS PARLE AUSSI D'ADULTES. La scène du module 2 se passe en ESAT :
 * le catalogue s'adressait jusque-là presque exclusivement à des situations
 * d'enfants, alors que l'inertie de démarrage est un des motifs les plus
 * fréquents en ESAT, en foyer de vie et en accompagnement d'adultes.
 *
 * ⚠ « Il ne veut pas » et « il n'y arrive pas » ne se distinguent pas à l'œil.
 * Le parcours ne tranche jamais l'intention : il mesure le délai jusqu'au
 * premier geste, et regarde ce qui le fait bouger.
 */

const G = require('./gabarit-v3.js');
const A = require('./annexes.js');

/* ── MODULE 1 ────────────────────────────────────────────────────────────── */

const M1 = {
  reperes: {
    minutes: 12,
    prerequis:
      'aucun. Ce module vaut pour un enfant comme pour un adulte, à la maison comme en atelier.',
    evaluation:
      'une tâche de votre quotidien, passée aux six coûts du démarrage, avec le levier que vous allez essayer.',
  },
  objectifs: [
    'Distinguer un blocage à l’entrée d’une difficulté dans l’exécution',
    'Nommer les six coûts du démarrage et repérer ceux qui jouent chez vous',
    'Appliquer le levier qui correspond à chaque coût',
    'Amorcer une tâche sans la faire à la place',
    'Reconnaître ce qui n’est pas un problème de démarrage, et où aller alors',
  ],
  corps: `<h3 style="${G.H3}">1. « Il ne fait rien » décrit rarement ce qui se passe</h3>
<p>Regardez une séance de près, chronomètre en main, et vous verrez presque toujours la
même chose&nbsp;: <strong>ce n’est pas la tâche qui bloque, c’est l’entrée dans la
tâche</strong>. Une fois la première action faite, la suite s’enchaîne souvent sans
difficulté particulière.</p>
${A.tableau(
  ['Ce qu’on observe', 'Ce qu’on en conclut d’habitude', 'Ce que ça montre en réalité'],
  [
    [
      'Il reste devant la feuille sans rien écrire, puis fait l’exercice en trois minutes quand quelqu’un écrit le premier mot.',
      '«&nbsp;Il traîne.&nbsp;»',
      'Le coût est à l’entrée. L’exercice, lui, ne pose pas de problème.',
    ],
    [
      'Elle ne commence pas le rangement, mais range très bien une fois la première boîte posée devant elle.',
      '«&nbsp;Elle attend qu’on la serve.&nbsp;»',
      'La première action était indéterminée&nbsp;: par où commencer&nbsp;?',
    ],
    [
      'Il tourne dans l’atelier vingt minutes, puis travaille une heure sans s’arrêter.',
      '«&nbsp;Il n’est pas motivé.&nbsp;»',
      'Le démarrage coûte&nbsp;; l’exécution, non. Ce sont deux problèmes différents, et un seul est réel.',
    ],
  ],
)}
<p><strong>La conséquence pratique est considérable&nbsp;:</strong> si le blocage est à
l’entrée, tout ce qui porte sur la tâche elle-même — l’expliquer mieux, la simplifier,
motiver, encourager — n’a presque aucun effet. Ce qui a un effet, c’est de réduire le coût
des trente premières secondes.</p>

<h3 style="${G.H3}">2. Les six coûts du démarrage</h3>
<p>Ils se cumulent, et il suffit souvent d’en retirer un ou deux pour que la tâche
démarre.</p>
${A.tableau(
  ['Le coût', 'Ce que ça donne', 'Le levier'],
  [
    [
      '<strong>1. Le matériel à réunir</strong>',
      'Il faut d’abord aller chercher le cahier, la trousse, le bon outil. Trois micro-décisions avant même de commencer.',
      '<strong>Le matériel est prêt et visible</strong> avant qu’on demande quoi que ce soit. C’est le levier le plus rentable de tous, et le plus souvent négligé.',
    ],
    [
      '<strong>2. La première action est indéterminée</strong>',
      '«&nbsp;Range ta chambre&nbsp;», «&nbsp;fais tes devoirs&nbsp;», «&nbsp;prépare le poste&nbsp;»&nbsp;: aucune ne dit par quoi on commence.',
      '<strong>La première action est nommée</strong>, et une seule&nbsp;: «&nbsp;mets les Lego dans la caisse&nbsp;», «&nbsp;ouvre le cahier à la page 12&nbsp;».',
    ],
    [
      '<strong>3. On ne sait pas quand ça finit</strong>',
      'Une tâche sans fin visible se refuse. C’est rationnel&nbsp;: on ne s’engage pas dans quelque chose dont on ignore la durée.',
      '<strong>Une fin visible</strong>&nbsp;: un nombre («&nbsp;les cinq premières&nbsp;»), une limite matérielle («&nbsp;jusqu’à ce que la caisse soit pleine&nbsp;»), un temps montré (un minuteur qu’on voit).',
    ],
    [
      '<strong>4. La difficulté perçue</strong>',
      'Ce n’est pas la difficulté réelle&nbsp;: c’est ce qu’on croit en regardant la page. Une page pleine décourage même quand elle est facile.',
      '<strong>Une première marche très basse</strong>&nbsp;: masquer le reste, ne montrer qu’un exercice, découper la feuille, commencer par la partie la plus facile.',
    ],
    [
      '<strong>5. L’arrachement à ce qui est en cours</strong>',
      'On demande d’<em>arrêter</em> et de <em>commencer</em>. Deux efforts pour une consigne, et c’est le déclencheur de refus le plus fréquent.',
      '<strong>Une transition annoncée</strong>, avec une fin donnée à ce qui est en cours&nbsp;: «&nbsp;tu finis cette vidéo, et après on fait les maths&nbsp;».',
    ],
    [
      '<strong>6. L’échec anticipé</strong>',
      'Quelqu’un qui a raté quinze fois cette tâche ne se remet pas devant sans raison. Ne pas commencer protège d’un nouvel échec.',
      '<strong>Le droit à l’imparfait, dit explicitement</strong>&nbsp;: «&nbsp;on essaie, on efface si ça ne va pas&nbsp;», «&nbsp;fais le premier, on regarde ensemble après&nbsp;».',
    ],
  ],
)}
${G.exemple(
  'Le levier le plus rentable, et pourquoi personne ne le voit',
  `<p style="margin-bottom:0"><strong>Le matériel prêt.</strong> Sortir le cahier, ouvrir à
la bonne page et poser le stylo dessus <em>avant</em> de demander quoi que ce soit
supprime, à lui seul, une bonne partie des refus de devoirs. Il ne se voit pas parce qu’il
ne ressemble pas à une technique éducative — il ressemble à «&nbsp;faire à la
place&nbsp;». Ce n’en est pas&nbsp;: la tâche reste entière, c’est l’<em>installation</em>
qui a été retirée.</p>`,
)}

<h3 style="${G.H3}">3. L’amorçage : deux minutes ensemble</h3>
<p>Quand les six leviers ne suffisent pas, il reste le plus efficace de tous, et le plus
mal compris&nbsp;: <strong>faire la première action avec la personne, puis se retirer.</strong></p>
<div style="${G.GRIS}">
<p style="margin-top:0"><em>«&nbsp;On fait le premier ensemble, les autres tu les fais
seul.&nbsp;»</em></p>
<p style="margin:10px 0 0"><em>«&nbsp;Je pose la première pièce, tu continues.&nbsp;»</em></p>
<p style="margin-bottom:0"><em>«&nbsp;J’écris la date, tu fais la suite.&nbsp;»</em></p>
</div>
<ul style="${G.UL}">
<li style="${G.LI}"><strong>C’est court&nbsp;:</strong> une action, pas cinq minutes de
présence. Au-delà, ce n’est plus un amorçage, c’est une aide continue — et elle relève
d’un autre parcours.</li>
<li style="${G.LI}"><strong>On se retire</strong>, physiquement. Rester assis à côté
transforme l’amorçage en surveillance, et la personne s’arrête quand vous partez.</li>
<li style="${G.LI}"><strong>Ce n’est pas de la triche.</strong> Ce qui est appris, ce
n’est pas «&nbsp;quelqu’un fait à ma place&nbsp;»&nbsp;: c’est que la tâche est
commençable. La différence se voit dans le relevé du module&nbsp;4.</li>
</ul>
${G.alerte(
  'Un amorçage qui ne se retire jamais devient une dépendance',
  `<p style="margin-bottom:0">C’est le risque réel de ce parcours, et il porte un
nom&nbsp;: une aide efficace et jamais retirée produit une dépendance à l’adulte, qui est
ensuite reprochée à la personne. <strong>Le retrait de l’amorçage n’est pas traité
ici</strong>&nbsp;: c’est l’objet entier du parcours «&nbsp;Guider puis
s’effacer&nbsp;», qui apprend à mesurer le niveau d’aide réel et à le baisser selon un
plan écrit. Commencez par faire démarrer la tâche&nbsp;; occupez-vous du retrait
ensuite.</p>`,
)}

<h3 style="${G.H3}">4. Ce qui n’est PAS un problème de démarrage</h3>
<p>Ce parcours ne sert à rien dans quatre situations, et il vaut mieux le savoir avant
d’essayer six leviers pendant trois semaines.</p>
${A.tableau(
  ['Ce que vous observez', 'Ce n’est pas un démarrage, c’est…', 'Où aller'],
  [
    [
      'Ça démarre, mais ça s’arrête toujours au même endroit.',
      'Une difficulté d’exécution, à une étape précise.',
      '«&nbsp;Décomposer une routine en étapes&nbsp;», puis «&nbsp;Guider puis s’effacer&nbsp;».',
    ],
    [
      'Le refus disparaît quand la consigne est reformulée, ou donnée en face.',
      'Un problème de consigne.',
      '«&nbsp;L’enfant qui dit non à tout&nbsp;».',
    ],
    [
      'Le refus obtient toujours quelque chose de précis&nbsp;: la tâche est annulée, ou quelqu’un vient.',
      'Une fonction du comportement.',
      '«&nbsp;Les quatre fonctions d’un comportement&nbsp;», puis «&nbsp;Apprendre à demander plutôt qu’à crier&nbsp;».',
    ],
    [
      'Ça a changé brutalement, ou ça touche toutes les activités y compris celles qui plaisaient.',
      'Autre chose&nbsp;: douleur, sommeil, traitement, humeur, événement.',
      'Un médecin, avant toute analyse éducative.',
    ],
  ],
)}
${G.alerte(
  'Le cas qu’il faut nommer',
  `<p style="margin-bottom:0"><strong>Un ralentissement général, une perte d’intérêt pour
ce qui plaisait, un repli</strong> ne sont pas des problèmes de démarrage. Chez un
adolescent comme chez un adulte, cela se signale à un médecin — et cela n’attend pas
la fin d’un relevé de dix jours.</p>`,
)}

<h3 style="${G.H3}">5. Motivation, paresse, volonté : trois mots qui n’aident pas</h3>
<p>Ils reviennent tous les trois dans les réunions et dans les écrits, et aucun ne débouche
sur une action.</p>
<ul style="${G.UL}">
<li style="${G.LI}"><strong>«&nbsp;Il n’est pas motivé&nbsp;»</strong> n’est pas une
observation&nbsp;: c’est une explication, et elle ne se vérifie pas. Elle a surtout un
défaut pratique&nbsp;: elle ne dit pas quoi faire lundi matin.</li>
<li style="${G.LI}"><strong>«&nbsp;Il est paresseux&nbsp;»</strong> décrit un trait de la
personne, et un trait ne se travaille pas. Le même écrit, dans un dossier, oriente toutes
les lectures suivantes.</li>
<li style="${G.LI}"><strong>«&nbsp;Il faut qu’il y mette du sien&nbsp;»</strong> déplace
le travail sur quelqu’un qui, précisément, n’y arrive pas — et prépare le reproche qui
suivra.</li>
</ul>
<p><strong>À la place&nbsp;:</strong> «&nbsp;le délai avant le premier geste est de trois
minutes en moyenne&nbsp;; il tombe à quinze secondes quand le matériel est prêt et la
première action nommée&nbsp;». Cette phrase-là se vérifie, se compare, et dit quoi faire
demain.</p>`,
  aRetenir:
    'Le blocage est presque toujours <strong>à l’entrée</strong>, pas dans l’exécution. Six coûts, six leviers — et le plus rentable ne ressemble pas à une technique&nbsp;: <strong>le matériel prêt et visible avant qu’on demande quoi que ce soit</strong>.',
  exercice: {
    nom: 'Les six coûts, sur votre tâche',
    duree: '10 minutes',
    quoi:
      'On prend une tâche précise qui ne démarre jamais — devoirs, habillage, poste de travail, rangement, douche.',
    etapes: [
      'Écrivez la tâche, et le moment exact où elle se pose. Une seule tâche.',
      'Passez-la aux six coûts et cochez ceux qui jouent. Il y en a presque toujours trois ou quatre.',
      'Pour chaque coût coché, écrivez le levier correspondant en termes concrets : qu’est-ce qui serait différent, matériellement, demain ?',
      'Regardez la scène de près : au bout de combien de temps quelqu’un intervient ? Estimez-le, vous le mesurerez au module 4.',
      'Passez enfin la tâche au tableau du point 4 : est-ce bien un problème de démarrage ? Si la réponse est non, allez au parcours indiqué — vous gagnerez trois semaines.',
    ],
    reussi:
      'vous avez une tâche unique, trois ou quatre coûts cochés, un levier concret écrit pour chacun, et vous avez vérifié que c’est bien un problème de démarrage.',
  },
  carnet: {
    intro:
      'Ouvrez une page — carnet, feuille, notes du téléphone. Quatre lignes pour ce module.',
    lignes: [
      '<strong>Ma tâche</strong> — et le moment où elle se pose.',
      '<strong>Les coûts cochés</strong> — parmi les six.',
      '<strong>Mes leviers</strong> — un par coût, en termes matériels.',
      '<strong>Mon estimation du délai</strong> — avant de le mesurer.',
    ],
  },
  vigilance: [
    '<strong>Préparer le matériel n’est pas faire à la place.</strong> La tâche reste entière : c’est l’installation qu’on retire, pas le travail.',
    '<strong>Un amorçage se retire un jour.</strong> Ce parcours ne traite pas le retrait — « Guider puis s’effacer » le fait, et il vaut mieux le savoir dès maintenant.',
    '<strong>Ne travaillez qu’une tâche.</strong> Six leviers sur quatre tâches à la fois, c’est zéro information au dixième jour.',
    '<strong>Un ralentissement général n’est pas un problème de démarrage.</strong> Perte d’intérêt pour ce qui plaisait, repli, changement brutal : cela se signale à un médecin.',
  ],
  annexes:
    'le <strong>tableau des six coûts et des six leviers</strong>, la <strong>liste des amorçages par type de tâche</strong>, et la <strong>fiche « est-ce bien un problème de démarrage&nbsp;? »</strong>.',
  avant: [
    'J’ai une tâche unique et j’ai coché les coûts qui jouent, parmi les six.',
    'J’ai écrit un levier concret et matériel pour chacun.',
    'J’ai vérifié que c’est bien un problème de démarrage, et pas autre chose.',
  ],
};

/* ── MODULE 2 ────────────────────────────────────────────────────────────── */

const M2 = {
  reperes: {
    minutes: 10,
    prerequis: 'le module 1 — les six coûts, les six leviers, l’amorçage.',
    evaluation: 'votre scène relue, avec les coûts identifiés minute par minute.',
  },
  objectifs: [
    'Repérer les coûts de démarrage dans une scène ordinaire de travail',
    'Distinguer ce que l’adulte fait pour aider de ce qui augmente le coût',
    'Voir pourquoi « faire à la place » n’est pas le contraire d’« amorcer »',
    'Réécrire la scène avec deux leviers seulement',
    'Transposer à une scène domestique',
  ],
  corps: `<h3 style="${G.H3}">1. Le poste de Karim</h3>
<p>Un ESAT, un atelier de conditionnement, un moniteur attentif — et vingt minutes
perdues chaque matin. Lisez, puis arrêtez-vous.</p>

<div style="${G.GRIS}">
<p><em>Karim, 24&nbsp;ans, travaille en ESAT depuis trois ans. Atelier
conditionnement&nbsp;: monter une boîte, y placer six pièces, fermer, poser sur le
chariot. Il fait ce travail correctement, à bonne cadence, depuis deux ans.</em></p>
<p><em>8&nbsp;h&nbsp;30. Le moniteur ouvre l’atelier&nbsp;: «&nbsp;Allez, on y va, chacun
à son poste.&nbsp;» Karim s’assoit. Le carton de pièces est au fond de l’atelier, les
boîtes à plat sur l’étagère.</em></p>
<p><em>8&nbsp;h&nbsp;40. Il n’a rien fait. Il regarde les autres, se lève, va aux
toilettes, revient.</em></p>
<p><em>«&nbsp;Karim, tu t’y mets&nbsp;?&nbsp;» — «&nbsp;Ouais ouais.&nbsp;» Il ne bouge
pas.</em></p>
<p><em>8&nbsp;h&nbsp;50. «&nbsp;Karim, franchement, tu sais faire, hein. Tu vas pas y
passer la matinée.&nbsp;» Il sourit, ne répond pas.</em></p>
<p><em>8&nbsp;h&nbsp;55. Le moniteur va chercher le carton, le pose sur le poste, prend
une boîte, la monte, la pose devant lui&nbsp;: «&nbsp;Tiens, voilà.&nbsp;»</em></p>
<p><em>Karim place les six pièces, ferme, pose sur le chariot. Puis la suivante. Il
travaille sans s’arrêter jusqu’à 11&nbsp;h&nbsp;30, cadence normale.</em></p>
<p><em>Au bilan annuel&nbsp;: «&nbsp;Karim a besoin d’être constamment relancé. Manque
d’autonomie dans la mise au travail. Motivation fluctuante.&nbsp;»</em></p>
</div>

<h3 style="${G.H3}">2. Arrêtez-vous ici — cinq minutes, de quoi écrire</h3>
<p>Karim travaille très bien pendant deux heures et demie. Cherchez lesquels des six coûts
étaient présents à 8&nbsp;h&nbsp;30, et ce que le moniteur a fait à 8&nbsp;h&nbsp;55 sans
s’en rendre compte.</p>

${G.FILET}

<h3 style="${G.H3}">3. L’analyse</h3>
<p><strong>Quatre des six coûts étaient présents</strong>, et aucun ne concernait le
travail lui-même&nbsp;:</p>
<ul style="${G.UL}">
<li style="${G.LI}"><strong>Le matériel à réunir</strong> — le carton est au fond de
l’atelier, les boîtes à plat sur l’étagère. Trois déplacements et deux décisions avant la
première pièce.</li>
<li style="${G.LI}"><strong>La première action indéterminée</strong> — «&nbsp;chacun à son
poste&nbsp;» n’est pas une action. Aller chercher le carton&nbsp;? Monter une
boîte&nbsp;? Attendre&nbsp;?</li>
<li style="${G.LI}"><strong>Pas de fin visible</strong> — combien de boîtes ce matin&nbsp;?
Jusqu’à quand&nbsp;? Personne ne l’a dit, et personne ne le sait.</li>
<li style="${G.LI}"><strong>L’échec anticipé</strong> — «&nbsp;tu sais faire, hein&nbsp;»
et «&nbsp;tu vas pas y passer la matinée&nbsp;» ajoutent une évaluation à un moment déjà
coûteux. Elles ne visent qu’à encourager&nbsp;; elles sont reçues comme un jugement.</li>
</ul>
${G.exemple(
  'Ce que le moniteur a fait à 8 h 55, sans le savoir',
  `<p style="margin-bottom:0">Il a <strong>amorcé</strong>&nbsp;: matériel apporté,
première boîte montée, première action faite. Le résultat a été immédiat — deux heures et
demie de travail à cadence normale. Le geste était le bon. Le seul problème est qu’il est
arrivé <strong>vingt-cinq minutes trop tard</strong>, après trois relances, et qu’il a été
vécu par tout le monde — Karim compris — comme le moment où l’adulte a fini par céder.</p>`,
)}

<h3 style="${G.H3}">4. Amorcer n’est pas faire à la place</h3>
<p>C’est la confusion qui empêche la plupart des équipes d’essayer, et elle se lève avec
un critère simple.</p>
${A.tableau(
  ['', 'Faire à la place', 'Amorcer'],
  [
    ['Ce qui est fait par l’adulte', 'Une partie du travail lui-même.', 'L’installation, et la toute première action.'],
    ['Ce qui reste à la personne', 'Moins de travail.', '<strong>Tout le travail</strong>, moins le démarrage.'],
    ['Ce que ça enseigne', 'Si j’attends, quelqu’un fait.', 'La tâche est commençable.'],
    ['Comment on le vérifie', 'La production totale baisse.', 'La production totale ne bouge pas, et le délai avant le premier geste s’effondre.'],
  ],
)}
<p>Dans la scène, Karim a monté toutes les boîtes de la matinée sauf une. <strong>Il n’a
pas travaillé moins&nbsp;: il a travaillé vingt-cinq minutes de plus.</strong></p>

<h3 style="${G.H3}">5. La même matinée, autrement</h3>
<div style="${G.GRIS}">
<p style="margin-top:0"><em>8&nbsp;h&nbsp;25, avant l’arrivée&nbsp;: le carton est posé au
poste de Karim, une boîte est déjà montée, la pile de boîtes à plat est à portée de
main.</em></p>
<p style="margin:14px 0 0"><em>8&nbsp;h&nbsp;30&nbsp;: «&nbsp;Karim, tu mets les six
pièces dans celle-là.&nbsp;» Puis le moniteur s’éloigne.</em></p>
<p style="margin:14px 0 0"><em>Sur le poste, une étiquette&nbsp;: «&nbsp;ce matin&nbsp;:
40 boîtes&nbsp;», et un bac qui les contient toutes — quand le bac est vide, c’est
fini.</em></p>
<p style="margin-bottom:0"><em>Aucune relance. Aucun encouragement. Aucune évaluation.</em></p>
</div>
<ul style="${G.UL}">
<li style="${G.LI}"><strong>Trois leviers seulement</strong>&nbsp;: matériel prêt,
première action nommée, fin visible. Le quatrième coût — l’échec anticipé — disparaît de
lui-même dès qu’on cesse de commenter.</li>
<li style="${G.LI}"><strong>Coût pour l’atelier&nbsp;:</strong> deux minutes de
préparation la veille au soir.</li>
<li style="${G.LI}"><strong>Ce qui change dans l’écrit annuel&nbsp;:</strong> tout. On
passe de «&nbsp;manque d’autonomie dans la mise au travail&nbsp;» à «&nbsp;entre au travail
seul lorsque le poste est préparé et la première action nommée&nbsp;; cadence et qualité
conformes&nbsp;».</li>
</ul>
${G.alerte(
  'La phrase du bilan annuel est le vrai dommage',
  `<p style="margin-bottom:0">«&nbsp;Manque d’autonomie, motivation fluctuante&nbsp;» décrit
Karim, alors que ce qui manquait était un carton posé au bon endroit. Cette phrase-là
voyage&nbsp;: elle passe d’un bilan à l’autre, elle pèse sur les orientations, et elle
survit longtemps à l’atelier où elle a été écrite. <strong>Décrire le dispositif plutôt que
la personne</strong> n’est pas une précaution de langage&nbsp;: c’est ce qui distingue un
écrit utile d’un écrit qui enferme.</p>`,
)}

<h3 style="${G.H3}">6. Et à la maison — la même chose, en plus discret</h3>
<p>Les six coûts sont exactement les mêmes&nbsp;; ce qui change, c’est qu’à la maison
personne ne les voit, parce qu’il n’y a pas d’atelier ni de poste de travail.</p>
<div style="${G.GRIS}">
<p style="margin-top:0"><em>Les devoirs, 17&nbsp;h&nbsp;30. Le cartable est dans l’entrée,
la table est encombrée, la consigne est «&nbsp;va faire tes devoirs&nbsp;», et personne ne
sait combien il y en a.</em></p>
<p style="margin-bottom:0"><em>La version qui démarre&nbsp;: la table dégagée, le cahier
ouvert à la page, le stylo posé dessus, et «&nbsp;tu fais les trois premiers, je reviens
après&nbsp;».</em></p>
</div>
<ul style="${G.UL}">
<li style="${G.LI}"><strong>La douche</strong>&nbsp;: la serviette et les affaires posées
sur le lit — au lieu de «&nbsp;va prendre ta douche&nbsp;».</li>
<li style="${G.LI}"><strong>S’habiller</strong>&nbsp;: les vêtements dans l’ordre, sur la
chaise, la veille au soir.</li>
<li style="${G.LI}"><strong>Ranger</strong>&nbsp;: la caisse posée au milieu de la pièce,
et une seule catégorie nommée.</li>
<li style="${G.LI}"><strong>Le repas</strong>&nbsp;: l’assiette servie plutôt que le plat
au centre, quand se servir est ce qui coûte.</li>
</ul>
<p><strong>Le coût pour vous&nbsp;: deux minutes, la veille ou juste avant.</strong> Et la
comparaison honnête n’est pas «&nbsp;deux minutes contre zéro&nbsp;» — c’est «&nbsp;deux
minutes contre vingt minutes de relances&nbsp;», que vous passiez déjà.</p>`,
  aRetenir:
    'Karim n’a pas travaillé moins&nbsp;: il a travaillé <strong>vingt-cinq minutes de plus</strong>. Le geste du moniteur était le bon — il est simplement arrivé après trois relances, ce qui l’a transformé en capitulation au lieu d’un réglage.',
  exercice: {
    nom: 'Votre scène, coût par coût',
    duree: '12 minutes',
    quoi: 'On refait l’analyse sur la tâche choisie au module 1.',
    etapes: [
      'Racontez par écrit, au présent, un matin ou une séance récente où la tâche n’a pas démarré. Dix lignes, avec les horaires.',
      'Marquez, sur cette chronologie, à quel moment vous êtes intervenu la première fois, et ce que vous avez dit.',
      'Cochez les coûts présents à l’instant zéro — avant toute intervention.',
      'Repérez le moment où quelque chose a fini par démarrer. Qu’est-ce qui l’avait déclenché ? C’est presque toujours un amorçage, arrivé trop tard.',
      'Écrivez la version « autrement » avec DEUX leviers seulement, pas six. Deux, choisis parmi ceux que vous pouvez tenir tous les jours.',
      'Écrivez enfin la phrase d’écrit : celle qui a été dite ou notée sur cette personne, et celle qui décrirait le dispositif à la place.',
    ],
    reussi:
      'votre chronologie porte l’heure de votre première intervention, les coûts sont cochés à l’instant zéro, votre version « autrement » ne contient que deux leviers, et votre phrase d’écrit décrit le dispositif.',
  },
  carnet: {
    intro: 'Quatre lignes de plus sur la page du module 1.',
    lignes: [
      '<strong>L’heure de ma première intervention</strong> — et ce que j’ai dit.',
      '<strong>Les coûts présents à l’instant zéro</strong>.',
      '<strong>Ce qui a fini par déclencher le démarrage</strong>.',
      '<strong>Mes deux leviers</strong> — ceux que je peux tenir tous les jours.',
    ],
  },
  vigilance: [
    '<strong>Cette scène n’accuse personne.</strong> Le moniteur a fait le bon geste, et il a fini par le faire. Ce qui manquait est qu’il soit prévu, pas improvisé au bout de vingt-cinq minutes.',
    '<strong>Deux leviers, pas six.</strong> Ceux qu’on tient tous les jours valent mieux que ceux qu’on tient trois jours.',
    '<strong>Ne commentez pas pendant le démarrage.</strong> « Tu sais faire », « tu vas pas y passer la matinée » ajoutent une évaluation au moment le plus coûteux.',
    '<strong>« Manque d’autonomie » décrit une personne.</strong> « Entre au travail seul lorsque le poste est préparé » décrit un dispositif — et c’est vérifiable.',
  ],
  annexes:
    'la <strong>scène de Karim corrigée</strong>, le <strong>tableau « amorcer / faire à la place »</strong>, et la <strong>liste des préparations de deux minutes</strong>, en atelier comme à la maison.',
  avant: [
    'Ma chronologie porte l’heure de ma première intervention.',
    'J’ai coché les coûts présents avant toute intervention.',
    'J’ai écrit une version « autrement » qui ne contient que deux leviers.',
  ],
};

/* ── MODULE 3 ────────────────────────────────────────────────────────────── */

const M3 = {
  reperes: {
    minutes: 12,
    apres:
      'dix jours d’application, avec un relevé de trente secondes par jour — le délai avant le premier geste. Le module&nbsp;4 se lit le dixième jour.',
    prerequis: 'les modules 1 et 2, et une tâche choisie.',
    evaluation: 'votre fiche de démarrage écrite, en cinq lignes, et la préparation faite.',
  },
  objectifs: [
    'Écrire une fiche de démarrage en cinq lignes, pour une tâche et un moment précis',
    'Choisir deux leviers tenables tous les jours plutôt que six',
    'Écrire la première action au mot près, et la phrase qui l’accompagne',
    'Décider à l’avance de ce qu’on fait si rien ne démarre',
    'Rendre la préparation tenable par quelqu’un d’autre',
  ],
  corps: `<h3 style="${G.H3}">1. Cinq lignes</h3>
<div style="${G.GRIS}">
<ol style="${G.UL}">
<li style="${G.LI}"><strong>La tâche et le moment</strong> — un seul moment de la
journée.</li>
<li style="${G.LI}"><strong>La préparation</strong> — ce qui est posé, ouvert, sorti,
<em>avant</em> qu’on demande quoi que ce soit. Et par qui.</li>
<li style="${G.LI}"><strong>La première action</strong> — une seule, nommée au mot
près.</li>
<li style="${G.LI}"><strong>La fin visible</strong> — un nombre, une limite matérielle, ou
un temps montré.</li>
<li style="${G.LI}"><strong>Si rien ne démarre</strong> — ce que je fais au bout de …
secondes, décidé maintenant.</li>
</ol>
</div>
<p>Cinq lignes, une feuille, affichée là où la tâche se passe. Le test est le même que
partout dans ce catalogue&nbsp;: quelqu’un qui n’était pas dans la discussion peut-il
l’appliquer sans poser de question&nbsp;?</p>

<h3 style="${G.H3}">2. Ligne 2 — la préparation, et qui la fait</h3>
<p>C’est la ligne qui produit le plus d’effet et celle qui échoue le plus souvent, pour
une raison unique&nbsp;: <strong>personne n’a été désigné.</strong></p>
${A.tableau(
  ['La tâche', 'Ce qui est préparé', 'Par qui, et quand'],
  [
    ['Devoirs', 'Table dégagée, cahier ouvert à la page, stylo posé dessus.', 'Le parent, au retour de l’école — pas au moment des devoirs.'],
    ['Poste de travail', 'Matière première au poste, première pièce montée, consigne du jour affichée.', 'Le moniteur, la veille au soir en fermant l’atelier.'],
    ['Habillage', 'Les vêtements dans l’ordre, sur la chaise.', 'La personne elle-même, ou l’adulte, la veille au coucher.'],
    ['Douche', 'Serviette et affaires propres posées sur le lit.', 'L’adulte du soir, avant le repas.'],
    ['Rangement', 'La caisse au milieu de la pièce, vide.', 'Celui qui demande, juste avant de demander.'],
    ['Repas / mise de table', 'La pile d’assiettes posée à l’endroit d’où on part.', 'L’adulte, en même temps qu’il annonce.'],
  ],
)}
<div style="${G.GRIS}">
<p style="margin:0"><strong>La ligne à écrire, mot pour mot&nbsp;:</strong>
«&nbsp;………………… prépare ………………… à ………… heures.&nbsp;» Un nom, un objet, un moment. Sans
nom, la préparation ne survit pas à la première semaine chargée.</p>
</div>

<h3 style="${G.H3}">3. Ligne 3 — la première action, au mot près</h3>
<p>Une action, pas une intention&nbsp;; observable, pas globale&nbsp;; et la plus petite
possible.</p>
${A.tableau(
  ['Ce qu’on dit', 'La première action'],
  [
    ['«&nbsp;Fais tes devoirs.&nbsp;»', '«&nbsp;Écris la date.&nbsp;»'],
    ['«&nbsp;Chacun à son poste.&nbsp;»', '«&nbsp;Mets les six pièces dans celle-là.&nbsp;»'],
    ['«&nbsp;Range ta chambre.&nbsp;»', '«&nbsp;Mets les Lego dans la caisse.&nbsp;»'],
    ['«&nbsp;Va te préparer.&nbsp;»', '«&nbsp;Mets ton pantalon.&nbsp;»'],
    ['«&nbsp;Mets la table.&nbsp;»', '«&nbsp;Pose les assiettes.&nbsp;»'],
    ['«&nbsp;Commence ton exercice.&nbsp;»', '«&nbsp;Recopie la première ligne.&nbsp;»'],
  ],
)}
<p><strong>Et la phrase qui l’accompagne&nbsp;:</strong> une seule, courte, sans
encouragement et sans évaluation. «&nbsp;Tu écris la date, je reviens après.&nbsp;»
Le «&nbsp;je reviens après&nbsp;» compte&nbsp;: il annonce le retrait, et le retrait fait
partie du réglage.</p>
${G.alerte(
  'Ce qu’on ne dit pas pendant le démarrage',
  `<p style="margin-bottom:0">«&nbsp;Tu sais faire&nbsp;», «&nbsp;allez, un effort&nbsp;»,
«&nbsp;tu vas pas y passer la matinée&nbsp;», «&nbsp;c’est facile&nbsp;». Toutes veulent
encourager, toutes ajoutent une évaluation au moment le plus coûteux — et
«&nbsp;c’est facile&nbsp;» est la pire de toutes&nbsp;: si c’est facile et que je n’y
arrive pas, alors le problème c’est moi.</p>`,
)}

<h3 style="${G.H3}">4. Ligne 4 — rendre la fin visible</h3>
<ul style="${G.UL}">
<li style="${G.LI}"><strong>Un nombre&nbsp;:</strong> «&nbsp;les trois premiers&nbsp;»,
«&nbsp;quarante boîtes&nbsp;».</li>
<li style="${G.LI}"><strong>Une limite matérielle&nbsp;:</strong> un bac qui se vide, une
pile qui diminue, une feuille pliée pour ne montrer que la moitié. C’est la forme la plus
efficace, parce qu’elle se voit sans compter.</li>
<li style="${G.LI}"><strong>Un temps montré&nbsp;:</strong> un minuteur visible. Attention
— pour certaines personnes, le décompte devient lui-même une source de tension&nbsp;: à
tester, pas à imposer.</li>
</ul>
<p><strong>La fin annoncée est tenue.</strong> «&nbsp;Encore trois&nbsp;» après les trois
promis détruit la fin visible pour longtemps, et c’est la faute la plus fréquente&nbsp;:
la tâche démarrait bien, on en profite, et on paie deux semaines plus tard.</p>

<h3 style="${G.H3}">5. Ligne 5 — si rien ne démarre</h3>
<div style="${G.GRIS}">
<ul style="${G.UL}">
<li style="${G.LI}"><strong>Au bout de … secondes</strong> (choisissez&nbsp;: 30, 60,
90), <strong>j’amorce</strong>&nbsp;: je fais la première action avec la personne, puis je
m’éloigne. Sans commentaire, sans reproche.</li>
<li style="${G.LI}"><strong>Deuxième fois de suite&nbsp;:</strong> je réduis encore la
première action — plus petite, plus concrète — ou je change le moment.</li>
<li style="${G.LI}"><strong>Troisième fois de suite&nbsp;:</strong> ce n’est probablement
pas un problème de démarrage. Je reprends le tableau du module&nbsp;1, point&nbsp;4, et je
vais voir ailleurs.</li>
</ul>
</div>
<p>Décider ce délai à froid évite les deux erreurs symétriques&nbsp;: amorcer au bout de
trois secondes, ce qui n’apprend rien, et attendre vingt-cinq minutes, ce qui transforme
un réglage en capitulation.</p>

<h3 style="${G.H3}">6. Ce que vous devez avoir sur votre feuille en sortant</h3>
<div style="${G.GRIS}">
<ul style="${G.UL}">
<li style="${G.LI}">Une tâche, un moment.</li>
<li style="${G.LI}">Une préparation, avec un nom et une heure.</li>
<li style="${G.LI}">Une première action, au mot près, et la phrase qui l’accompagne.</li>
<li style="${G.LI}">Une fin visible.</li>
<li style="${G.LI}">Un délai en secondes, et les trois lignes du «&nbsp;si rien ne
démarre&nbsp;».</li>
</ul>
</div>
<p>Et une chose à faire tout de suite, avant de refermer&nbsp;: <strong>préparez le
matériel pour demain.</strong> C’est le seul livrable de ce module qui se voit, et c’est
celui qui produira les trois quarts du résultat.</p>`,
  aRetenir:
    'Deux leviers tenus tous les jours valent mieux que six tenus trois jours. Et la ligne qui décide de tout est la deuxième&nbsp;: <strong>la préparation, avec un nom et une heure</strong> — sans nom, elle ne survit pas à la première semaine chargée.',
  exercice: {
    nom: 'La fiche de démarrage',
    duree: '12 minutes',
    quoi: 'On écrit la feuille, pour une tâche et un moment précis.',
    etapes: [
      'Ligne 1 : la tâche, et le moment exact. Un seul.',
      'Ligne 2 : ce qui est préparé, par qui, et à quelle heure. Écrivez le nom : sans nom, la préparation ne tient pas.',
      'Ligne 3 : la première action, au mot près, et la phrase qui l’accompagne — avec le « je reviens après ».',
      'Ligne 4 : la fin visible. Privilégiez une limite matérielle : un bac, une pile, une feuille pliée.',
      'Ligne 5 : le délai en secondes avant d’amorcer, et les trois lignes du « si rien ne démarre ».',
      'Affichez la feuille, dites-la à la personne qui prépare, et PRÉPAREZ LE MATÉRIEL POUR DEMAIN maintenant.',
    ],
    reussi:
      'les cinq lignes sont écrites, la ligne 2 porte un nom et une heure, et le matériel de demain est déjà prêt.',
  },
  carnet: {
    intro: 'La fiche EST le livrable. Recopiez-la au propre dans votre carnet.',
    lignes: [
      '<strong>La tâche et le moment</strong>.',
      '<strong>La préparation</strong> — quoi, par qui, à quelle heure.',
      '<strong>La première action</strong> — au mot près, avec sa phrase.',
      '<strong>La fin visible</strong>.',
      '<strong>Mon délai avant d’amorcer</strong>, et les trois lignes.',
    ],
  },
  vigilance: [
    '<strong>La fin annoncée est tenue.</strong> « Encore trois » après les trois promis détruit la fin visible, et cela se paie deux semaines plus tard.',
    '<strong>Le minuteur n’est pas universel.</strong> Pour certaines personnes, le décompte devient lui-même une source de tension : à tester, pas à imposer.',
    '<strong>Aucun commentaire pendant le démarrage.</strong> Surtout pas « c’est facile » : si c’est facile et que je n’y arrive pas, alors le problème c’est moi.',
    '<strong>Un amorçage se retire un jour.</strong> Pas pendant ces dix jours — mais dès que le démarrage est acquis, le parcours « Guider puis s’effacer » prend le relais.',
  ],
  annexes:
    'le <strong>gabarit de la fiche en cinq lignes</strong>, le <strong>tableau des premières actions</strong>, la <strong>liste des fins visibles</strong>, et le <strong>mémo des phrases à ne pas dire</strong>.',
  avant: [
    'Mes cinq lignes sont écrites et la feuille est affichée.',
    'La ligne 2 porte un nom et une heure.',
    'Le matériel de demain est déjà prêt.',
  ],
  pause: {
    jours: 'dix jours',
    texte: `<p>Votre fiche est écrite&nbsp;: elle s’applique maintenant, sur ce seul
moment, pendant <strong>dix jours</strong>. Le module&nbsp;4 se lit le dixième jour, le
relevé sous les yeux.</p>
<p>Le relevé tient en un chiffre par jour&nbsp;: <strong>le délai avant le premier
geste</strong>, en secondes ou en minutes. C’est la mesure la plus simple du catalogue, et
c’est celle qui bouge le plus vite — souvent dès la première semaine.</p>
<p style="margin-bottom:0">Date de lancement&nbsp;: …… / …… &nbsp;·&nbsp; date de
lecture&nbsp;: …… / …… .</p>`,
  },
};

/* ── MODULE 4 ────────────────────────────────────────────────────────────── */

const M4 = {
  reperes: {
    minutes: 12,
    prerequis: 'les modules 1 à 3, et une fiche appliquée pendant dix jours.',
    evaluation: 'la lecture de votre relevé au dixième jour, et la phrase d’écrit qui en sort.',
  },
  objectifs: [
    'Mesurer un délai avant le premier geste plutôt que d’estimer une motivation',
    'Lire un relevé de dix jours et reconnaître les quatre issues',
    'Distinguer un amorçage utile d’un amorçage qui s’installe',
    'Écrire une phrase de bilan qui décrit le dispositif et non la personne',
    'Savoir quand passer au parcours suivant',
  ],
  corps: `<h3 style="${G.H3}">1. Le relevé : un chiffre par jour</h3>
<p>C’est le relevé le plus court du catalogue, et le plus parlant.</p>
${A.tableau(
  ['Colonne', 'Ce qu’on y met'],
  [
    ['<strong>1. Délai avant le premier geste</strong>', 'En secondes, ou en minutes. On compte à partir du moment où la première action est dite.'],
    ['<strong>2. Préparation faite ?</strong>', 'Oui / non. Cette colonne explique la précédente&nbsp;: un jour sans préparation n’est pas un jour testé.'],
    ['<strong>3. Amorçage nécessaire ?</strong>', 'Oui / non. C’est la colonne qui dit si l’aide s’installe ou si elle recule.'],
    ['<strong>4. Tâche terminée ?</strong>', 'Oui / non. Elle protège d’une erreur de lecture&nbsp;: un démarrage rapide suivi d’un abandon n’est pas un progrès.'],
  ],
)}
<p><strong>Comptez vraiment le délai.</strong> Estimé, il vaut ce que valent les
estimations d’un mardi soir&nbsp;: la plupart des adultes découvrent qu’ils intervenaient
au bout de vingt secondes là où ils croyaient attendre deux minutes — ou l’inverse.</p>

<h3 style="${G.H3}">2. Trois règles pendant les dix jours</h3>
<ul style="${G.UL}">
<li style="${G.LI}"><strong>On ne change pas la fiche en route</strong>, même si un jour
rate. Dix jours, puis on décide.</li>
<li style="${G.LI}"><strong>On ne travaille qu’une tâche.</strong> Le reste de la journée
continue comme avant, sans relevé et sans culpabilité.</li>
<li style="${G.LI}"><strong>On note le jour même</strong>, à la fin du moment. Un délai
noté le lendemain est un délai inventé.</li>
</ul>

<h3 style="${G.H3}">3. La lecture du dixième jour, en quatre issues</h3>
<p>Trois nombres d’abord&nbsp;: le délai moyen de la semaine&nbsp;1, celui de la
semaine&nbsp;2, et le nombre de jours où la préparation a été faite.</p>
${A.tableau(
  ['Ce que dit le relevé', 'Ce que ça veut dire', 'Ce qu’on fait'],
  [
    [
      'Le délai <strong>baisse</strong>, la préparation est faite presque tous les jours.',
      'La fiche fonctionne. C’est le cas le plus fréquent quand la ligne 2 portait un nom.',
      'On garde la fiche telle quelle un mois. Ensuite seulement, on ouvre le parcours «&nbsp;Guider puis s’effacer&nbsp;» pour retirer l’amorçage — et jamais avant.',
    ],
    [
      'Le délai ne bouge pas, la préparation <strong>a été faite</strong>.',
      'Ce n’était pas (ou pas seulement) un problème de coût de démarrage.',
      'On reprend le tableau du module 1, point 4&nbsp;: consigne, difficulté d’exécution, fonction du comportement, ou cause médicale. On change de parcours plutôt que d’insister.',
    ],
    [
      'Le délai ne bouge pas, la préparation <strong>n’a pas été faite</strong> (moins de huit jours sur dix).',
      'Rien n’a été testé. Le réglage était trop coûteux, ou personne n’avait été désigné.',
      'On réduit la préparation jusqu’à ce qu’elle tienne — une seule chose posée suffit souvent — et on refait dix jours.',
    ],
    [
      'Le délai baisse, mais la colonne <strong>«&nbsp;amorçage&nbsp;» reste à «&nbsp;oui&nbsp;»</strong> tous les jours.',
      'La tâche démarre grâce à vous, pas grâce au dispositif. Ce n’est pas un échec — c’est une étape — mais il faut le voir.',
      'On garde, et on prépare le retrait avec «&nbsp;Guider puis s’effacer&nbsp;»&nbsp;: l’amorçage est une aide, et une aide jamais retirée devient une dépendance.',
    ],
  ],
)}
${G.exemple(
  'Un relevé réel, et ce qu’on en tire',
  `<p><strong>Délais&nbsp;:</strong> J1 4 min · J2 3 min · J3 3 min · J4 90 s · J5 2 min ·
J6 60 s · J7 45 s · J8 30 s · J9 20 s · J10 15 s. <strong>Préparation&nbsp;:</strong> oui
sauf J5. <strong>Amorçage&nbsp;:</strong> oui J1 à J4, non ensuite.</p>
<p style="margin-bottom:0"><strong>Lecture&nbsp;:</strong> première issue. Le délai passe de
3 min 30 (moyenne S1) à 30 s (moyenne S2), l’amorçage n’est plus nécessaire depuis J5, et le
seul jour en hausse est celui où la préparation n’a pas été faite — ce qui confirme le
dispositif plutôt qu’il ne l’infirme.</p>`,
)}

<h3 style="${G.H3}">4. Écrire ce qu’on a obtenu</h3>
<p>Une phrase de bilan utile décrit <strong>le dispositif</strong>, avec deux chiffres et
une durée. Elle se compare d’un bilan à l’autre&nbsp;; les autres non.</p>
${A.tableau(
  ['Ce qu’on écrit spontanément', 'Pourquoi c’est coûteux', 'Ce qui se vérifie'],
  [
    [
      'Manque d’autonomie dans la mise au travail.',
      'Décrit un trait de la personne. Suit le dossier, pèse sur les orientations, survit à l’atelier où la phrase a été écrite.',
      'Entre au travail seul lorsque le poste est préparé et la première action nommée&nbsp;: délai moyen passé de 3 min 30 à 30 s en dix jours. Cadence et qualité conformes.',
    ],
    [
      'Motivation fluctuante.',
      'Non vérifiable, et elle décourage toute recherche.',
      'Le délai de démarrage varie avec la préparation du poste&nbsp;: 30 s les jours où elle est faite, 3 min les autres.',
    ],
    [
      'A besoin d’être constamment relancé.',
      'Décrit la personne, alors que c’est l’organisation qui produit les relances.',
      'Les relances ont disparu depuis la mise en place de la préparation. Un amorçage a été nécessaire les quatre premiers jours, plus depuis.',
    ],
    [
      'Ne se met pas au travail.',
      'Un constat sans repère&nbsp;: ni durée, ni condition.',
      'Ne démarre pas lorsque le matériel n’est pas sorti (délai&nbsp;&gt;&nbsp;3 min)&nbsp;; démarre en moins de 30 s lorsqu’il l’est.',
    ],
  ],
)}
<div style="${G.GRIS}">
<p style="margin:0"><strong>Une phrase de bilan utile contient deux chiffres et une
durée.</strong> C’est ce qui la rend comparable au bilan suivant — et ce qui montre un
travail plutôt qu’une impression.</p>
</div>

<h3 style="${G.H3}">5. La suite, dans l’ordre</h3>
<ul style="${G.UL}">
<li style="${G.LI}"><strong>Un mois de stabilité</strong> avant de toucher à quoi que ce
soit. C’est long, et c’est ce qui évite de tout casser au premier bon résultat.</li>
<li style="${G.LI}"><strong>Puis le retrait de l’amorçage</strong>, s’il en reste un —
avec «&nbsp;Guider puis s’effacer&nbsp;», qui apprend à mesurer le niveau d’aide et à le
baisser selon un plan écrit.</li>
<li style="${G.LI}"><strong>Puis, éventuellement, une deuxième tâche.</strong> Une seule à
la fois&nbsp;: la préparation de deux tâches, ce sont deux noms et deux moments, et cela
tient rarement.</li>
<li style="${G.LI}"><strong>Et si le délai ne bouge pas malgré une préparation
tenue&nbsp;:</strong> changez de parcours. Insister sur le démarrage quand le problème est
ailleurs coûte des semaines à tout le monde, à commencer par la personne.</li>
</ul>`,
  aRetenir:
    'On mesure <strong>un délai</strong>, pas une motivation. Et la colonne qui protège de l’erreur de lecture est la deuxième&nbsp;: un jour sans préparation n’est pas un jour testé.',
  exercice: {
    nom: 'La lecture du dixième jour',
    duree: '10 minutes, le relevé sous les yeux',
    quoi: 'Feuille en main. Un délai de mémoire est un délai inventé.',
    etapes: [
      'Calculez le délai moyen de la semaine 1, puis celui de la semaine 2. Deux nombres.',
      'Comptez les jours où la préparation a été faite. En dessous de huit sur dix, c’est la seule conclusion : le réglage était trop coûteux.',
      'Regardez la colonne « amorçage » : est-il encore nécessaire tous les jours, ou a-t-il reculé ?',
      'Vérifiez la colonne « terminée » : un démarrage plus rapide suivi d’abandons n’est pas un progrès.',
      'Placez-vous dans une des quatre issues, écrivez laquelle, et la suite avec une date.',
      'Écrivez la phrase de bilan : deux chiffres, une durée, et le dispositif — pas la personne.',
    ],
    reussi:
      'vous avez deux délais moyens, un nombre de jours préparés, une issue choisie, une suite datée, et une phrase de bilan qui contient deux chiffres et une durée.',
  },
  carnet: {
    intro: 'Les dernières lignes du carnet. Elles constituent votre bilan.',
    lignes: [
      '<strong>Délai moyen</strong> — semaine 1, semaine 2.',
      '<strong>Jours préparés</strong> — sur dix.',
      '<strong>L’amorçage</strong> — encore nécessaire ou non.',
      '<strong>Mon issue</strong> — parmi les quatre — et la suite, datée.',
      '<strong>Ma phrase de bilan</strong> — deux chiffres, une durée, le dispositif.',
    ],
  },
  vigilance: [
    '<strong>Un démarrage plus rapide suivi d’abandons n’est pas un progrès.</strong> C’est la raison d’être de la quatrième colonne.',
    '<strong>Ne conservez pas un amorçage sans plan de retrait.</strong> Une aide efficace et jamais retirée produit une dépendance, ensuite reprochée à la personne.',
    '<strong>Un mois de stabilité avant de changer quoi que ce soit.</strong> Le premier bon résultat donne toujours envie d’en faire plus, et c’est ainsi qu’on perd ce qui marchait.',
    '<strong>Si le délai ne bouge pas malgré une préparation tenue</strong>, changez de parcours plutôt que d’insister. Le tableau du module 1 dit où aller.',
    '<strong>N’écrivez jamais « manque de motivation » dans un bilan.</strong> Ce n’est pas vérifiable, cela décrit la personne, et cela survit à l’endroit où c’est écrit.',
  ],
  annexes:
    'le <strong>relevé de dix jours</strong> à quatre colonnes, la <strong>fiche de lecture aux quatre issues</strong>, et le <strong>tableau des phrases de bilan</strong>.',
  avant: [
    'J’ai dix jours de relevé, avec la colonne « préparation » remplie.',
    'J’ai calculé — pas estimé — mes deux délais moyens.',
    'J’ai une phrase de bilan qui contient deux chiffres, une durée, et qui décrit le dispositif.',
  ],
};

/* ── ANNEXES ─────────────────────────────────────────────────────────────── */

const ANNEXES =
  A.entete('Aider quelqu’un à démarrer une tâche') +
  A.fiche({
    numero: 1,
    titre: 'Les six coûts du démarrage, et les six leviers',
    quand: 'devant toute tâche qui ne démarre pas. À cocher.',
    contenu:
      A.tableau(
        ['Le coût', 'La question de contrôle', '☐', 'Le levier'],
        [
          ['<strong>1. Le matériel à réunir</strong>', 'Faut-il aller chercher quelque chose avant de commencer&nbsp;?', '☐', 'Le matériel est prêt et visible <em>avant</em> qu’on demande. Le levier le plus rentable de tous.'],
          ['<strong>2. La première action indéterminée</strong>', 'Est-ce que je pourrais dire par quoi on commence&nbsp;?', '☐', 'Une première action nommée, une seule, au mot près.'],
          ['<strong>3. Pas de fin visible</strong>', 'Est-ce qu’on sait quand c’est fini&nbsp;?', '☐', 'Un nombre, une limite matérielle, ou un temps montré.'],
          ['<strong>4. La difficulté perçue</strong>', 'À quoi ressemble la tâche quand on la regarde&nbsp;?', '☐', 'Une première marche très basse&nbsp;: masquer le reste, découper, commencer par le plus facile.'],
          ['<strong>5. L’arrachement</strong>', 'Est-ce que je demande d’arrêter <em>et</em> de commencer&nbsp;?', '☐', 'Une transition annoncée, avec une fin donnée à ce qui est en cours.'],
          ['<strong>6. L’échec anticipé</strong>', 'Cette tâche a-t-elle déjà raté souvent&nbsp;?', '☐', 'Le droit à l’imparfait, dit&nbsp;: «&nbsp;on essaie, on efface si ça ne va pas&nbsp;».'],
        ],
      ) +
      `<div style="${G.GRIS}">
<p style="margin:0"><strong>Deux leviers, pas six.</strong> Ceux qu’on tient tous les jours
valent mieux que ceux qu’on tient trois jours. Commencez par le 1 et le 2&nbsp;: à eux
deux, ils règlent la majorité des cas.</p>
</div>`,
  }) +
  A.fiche({
    numero: 2,
    titre: 'Est-ce bien un problème de démarrage ?',
    quand: 'avant d’essayer quoi que ce soit. Cinq minutes qui font gagner trois semaines.',
    contenu:
      A.tableau(
        ['Ce que vous observez', 'Ce n’est pas un démarrage, c’est…', 'Le parcours à suivre'],
        [
          ['Ça démarre, mais ça s’arrête toujours au même endroit.', 'Une difficulté d’exécution, à une étape précise.', '«&nbsp;Décomposer une routine en étapes&nbsp;», puis «&nbsp;Guider puis s’effacer&nbsp;».'],
          ['Le refus disparaît quand la consigne est reformulée, ou donnée en face.', 'Un problème de consigne.', '«&nbsp;L’enfant qui dit non à tout&nbsp;».'],
          ['Le refus obtient toujours quelque chose&nbsp;: la tâche est annulée, ou quelqu’un vient.', 'Une fonction du comportement.', '«&nbsp;Les quatre fonctions d’un comportement&nbsp;», puis «&nbsp;Apprendre à demander plutôt qu’à crier&nbsp;».'],
          ['Ça tourne régulièrement à la crise.', 'Autre chose que du démarrage.', '«&nbsp;Les premières minutes d’une crise&nbsp;».'],
          ['Les difficultés arrivent aux changements et aux imprévus.', 'Un problème de prévisibilité.', '«&nbsp;Rendre l’environnement prévisible&nbsp;».'],
          ['Changement brutal, ou toutes les activités touchées, y compris celles qui plaisaient.', 'Une cause médicale, un trouble du sommeil, un traitement, une humeur.', 'Un médecin, avant toute analyse éducative — et sans attendre la fin d’un relevé.'],
        ],
      ) +
      `<div style="${G.ALERTE}">
<p style="margin:0"><strong>Un ralentissement général, une perte d’intérêt pour ce qui
plaisait, un repli</strong> ne sont pas des problèmes de démarrage. Chez un adolescent
comme chez un adulte, cela se signale à un médecin.</p>
</div>`,
  }) +
  A.fiche({
    numero: 3,
    titre: 'La fiche de démarrage — gabarit',
    quand: 'une fois par tâche. À afficher là où la tâche se passe.',
    contenu: `<div style="${G.GRIS}">
<p style="margin-top:0"><strong>Pour&nbsp;:</strong> ……………………… &nbsp;·&nbsp;
<strong>écrite le&nbsp;:</strong> …… / …… &nbsp;·&nbsp; <strong>revue le&nbsp;:</strong>
…… / ……</p>
<p style="margin:16px 0 0"><strong>1. La tâche et le moment&nbsp;:</strong>
………………………………………………………………………</p>
<p style="margin:16px 0 0"><strong>2. La préparation&nbsp;:</strong> ………………………………………
&nbsp;·&nbsp; <strong>préparée par&nbsp;:</strong> ……………………… &nbsp;·&nbsp;
<strong>à&nbsp;:</strong> …… h ……</p>
<p style="margin:16px 0 0"><strong>3. La première action&nbsp;:</strong>
«&nbsp;……………………………………………………&nbsp;» — et la phrase&nbsp;: «&nbsp;…………………………, je reviens
après.&nbsp;»</p>
<p style="margin:16px 0 0"><strong>4. La fin visible&nbsp;:</strong>
………………………………………………………………………</p>
<p style="margin:16px 0 0"><strong>5. Si rien ne démarre au bout de …… secondes&nbsp;:</strong>
j’amorce — je fais la première action avec, puis je m’éloigne. Sans commentaire.</p>
</div>
<h4 style="margin:30px 0 8px">Les trois lignes du « si rien ne démarre »</h4>
<ul style="${G.UL}">
<li style="${G.LI}"><strong>Une fois&nbsp;:</strong> j’amorce, sans commentaire ni
reproche.</li>
<li style="${G.LI}"><strong>Deux fois de suite&nbsp;:</strong> je réduis encore la première
action, ou je change le moment.</li>
<li style="${G.LI}"><strong>Trois fois de suite&nbsp;:</strong> ce n’est probablement pas un
problème de démarrage. Fiche&nbsp;2 des annexes, et je change de parcours.</li>
</ul>
<div style="${G.GRIS}">
<p style="margin:0"><strong>Le test&nbsp;:</strong> quelqu’un qui n’était pas dans la
discussion peut-il appliquer cette fiche sans poser de question&nbsp;? Et&nbsp;: le
matériel de demain est-il déjà prêt&nbsp;?</p>
</div>`,
  }) +
  A.fiche({
    numero: 4,
    titre: 'Préparations de deux minutes, et premières actions',
    quand: 'au moment d’écrire les lignes 2 et 3.',
    contenu:
      A.tableau(
        ['La tâche', 'La préparation (2 minutes)', 'La première action, au mot près'],
        [
          ['Devoirs', 'Table dégagée, cahier ouvert à la page, stylo posé dessus.', '«&nbsp;Écris la date.&nbsp;»'],
          ['Poste de travail / atelier', 'Matière au poste, première pièce montée, consigne du jour affichée.', '«&nbsp;Mets les six pièces dans celle-là.&nbsp;»'],
          ['Habillage', 'Vêtements dans l’ordre, sur la chaise, la veille au soir.', '«&nbsp;Mets ton pantalon.&nbsp;»'],
          ['Douche', 'Serviette et affaires propres posées sur le lit.', '«&nbsp;Ouvre l’eau.&nbsp;»'],
          ['Rangement', 'La caisse posée vide au milieu de la pièce.', '«&nbsp;Mets les Lego dans la caisse.&nbsp;»'],
          ['Mettre la table', 'La pile d’assiettes posée à l’endroit d’où on part.', '«&nbsp;Pose les assiettes.&nbsp;»'],
          ['Repas (si se servir coûte)', 'L’assiette servie, plutôt que le plat au centre.', '«&nbsp;Prends ta fourchette.&nbsp;»'],
          ['Préparer son sac', 'La liste des affaires posée sur le sac ouvert.', '«&nbsp;Mets ton cahier de textes.&nbsp;»'],
          ['Sortir / se préparer à partir', 'Chaussures et manteau sortis, posés au sol dans le sens.', '«&nbsp;Mets tes chaussures.&nbsp;»'],
        ],
      ) +
      `<h4 style="margin:30px 0 8px">Les fins visibles</h4>
<ul style="${G.UL}">
<li style="${G.LI}"><strong>Un nombre&nbsp;:</strong> «&nbsp;les trois premiers&nbsp;»,
«&nbsp;quarante boîtes&nbsp;».</li>
<li style="${G.LI}"><strong>Une limite matérielle&nbsp;:</strong> un bac qui se vide, une
pile qui diminue, une feuille pliée en deux. La forme la plus efficace&nbsp;: elle se voit
sans compter.</li>
<li style="${G.LI}"><strong>Un temps montré&nbsp;:</strong> un minuteur visible — à tester,
pas à imposer&nbsp;: pour certaines personnes, le décompte est lui-même une source de
tension.</li>
</ul>
<div style="${G.ALERTE}">
<p style="margin:0"><strong>La fin annoncée est tenue.</strong> «&nbsp;Encore trois&nbsp;»
après les trois promis détruit la fin visible pour longtemps. C’est la faute la plus
fréquente&nbsp;: ça démarrait bien, on en profite, et on paie deux semaines plus tard.</p>
</div>`,
  }) +
  A.fiche({
    numero: 5,
    titre: 'Amorcer, ou faire à la place',
    quand: 'chaque fois qu’une équipe hésite à préparer le matériel « pour ne pas l’assister ».',
    contenu:
      A.tableau(
        ['', 'Faire à la place', 'Amorcer'],
        [
          ['Ce qui est fait par l’adulte', 'Une partie du travail lui-même.', 'L’installation, et la toute première action.'],
          ['Ce qui reste à la personne', 'Moins de travail.', '<strong>Tout le travail</strong>, moins le démarrage.'],
          ['Ce que ça enseigne', 'Si j’attends, quelqu’un fait.', 'La tâche est commençable.'],
          ['Ce que montre le relevé', 'La production totale baisse.', 'La production ne bouge pas, et le délai avant le premier geste s’effondre.'],
          ['Durée', 'Variable, souvent croissante.', 'Une action, puis on s’éloigne.'],
        ],
      ) +
      `<h4 style="margin:30px 0 8px">Les phrases d’amorçage</h4>
<div style="${G.GRIS}">
<p style="margin-top:0"><em>«&nbsp;On fait le premier ensemble, les autres tu les fais
seul.&nbsp;»</em></p>
<p style="margin:10px 0 0"><em>«&nbsp;Je pose la première pièce, tu continues.&nbsp;»</em></p>
<p style="margin-bottom:0"><em>«&nbsp;J’écris la date, tu fais la suite.&nbsp;»</em></p>
</div>
<h4 style="margin:30px 0 8px">Ce qu’on ne dit pas pendant le démarrage</h4>
<ul style="${G.UL}">
<li style="${G.LI}">«&nbsp;Tu sais faire, hein&nbsp;» — ajoute une évaluation.</li>
<li style="${G.LI}">«&nbsp;Allez, un effort&nbsp;» — désigne un manque de volonté.</li>
<li style="${G.LI}">«&nbsp;Tu vas pas y passer la matinée&nbsp;» — annonce l’échec.</li>
<li style="${G.LI}"><strong>«&nbsp;C’est facile&nbsp;»</strong> — la pire de toutes&nbsp;:
si c’est facile et que je n’y arrive pas, alors le problème c’est moi.</li>
</ul>
<div style="${G.ALERTE}">
<p style="margin:0"><strong>Un amorçage se retire.</strong> Une aide efficace et jamais
retirée produit une dépendance à l’adulte, ensuite reprochée à la personne. Le retrait
n’est pas l’objet de ce parcours&nbsp;: c’est celui de «&nbsp;Guider puis s’effacer&nbsp;»,
et il se met en route après un mois de stabilité.</p>
</div>`,
  }) +
  A.fiche({
    numero: 6,
    titre: 'La matinée de Karim, corrigée',
    quand: 'comme modèle, à côté de votre propre fiche.',
    contenu:
      A.tableau(
        ['Ce qui s’est passé', 'Le coût en jeu', 'Ce qui aurait pu être fait'],
        [
          [
            '8 h 30&nbsp;: «&nbsp;chacun à son poste&nbsp;». Le carton est au fond de l’atelier, les boîtes à plat sur l’étagère.',
            'Matériel à réunir + première action indéterminée.',
            '8 h 25, avant l’arrivée&nbsp;: carton posé au poste, une boîte déjà montée, pile à portée de main. Puis&nbsp;: «&nbsp;Karim, tu mets les six pièces dans celle-là.&nbsp;»',
          ],
          [
            'Rien n’indique combien de boîtes, ni jusqu’à quand.',
            'Pas de fin visible.',
            'Une étiquette&nbsp;: «&nbsp;ce matin&nbsp;: 40 boîtes&nbsp;», et un bac qui les contient toutes. Quand le bac est vide, c’est fini.',
          ],
          [
            '8 h 40 et 8 h 50&nbsp;: deux relances, dont «&nbsp;tu sais faire, hein&nbsp;» et «&nbsp;tu vas pas y passer la matinée&nbsp;».',
            'Échec anticipé, ajouté par l’adulte.',
            'Aucune relance, aucun commentaire. Le moniteur s’éloigne après la première action.',
          ],
          [
            '8 h 55&nbsp;: le moniteur apporte le carton et monte la première boîte. Karim travaille deux heures et demie.',
            '—',
            'Le geste était le bon&nbsp;: il arrive simplement <strong>vingt-cinq minutes trop tôt</strong> dans la journée, c’est-à-dire avant les relances et non après.',
          ],
          [
            'Bilan annuel&nbsp;: «&nbsp;besoin d’être constamment relancé, manque d’autonomie, motivation fluctuante&nbsp;».',
            '—',
            '«&nbsp;Entre au travail seul lorsque le poste est préparé et la première action nommée&nbsp;: délai passé de 3 min 30 à 30 s en dix jours. Cadence et qualité conformes.&nbsp;»',
          ],
        ],
      ) +
      `<div style="${G.GRIS}">
<p style="margin:0"><strong>Coût du réglage&nbsp;:</strong> deux minutes de préparation la
veille au soir. <strong>Coût de la situation d’origine&nbsp;:</strong> vingt-cinq minutes
de production perdues chaque matin, et une phrase de bilan qui suivra Karim des
années.</p>
</div>`,
  }) +
  A.fiche({
    numero: 7,
    titre: 'Le relevé de dix jours',
    quand: 'chaque jour, à la fin du moment. Trente secondes.',
    contenu:
      A.tableau(
        ['Jour', 'Délai avant le 1er geste', 'Préparation faite ?', 'Amorçage nécessaire ?', 'Tâche terminée ?'],
        [
          ['J1', '', '', '', ''], ['J2', '', '', '', ''], ['J3', '', '', '', ''],
          ['J4', '', '', '', ''], ['J5', '', '', '', ''],
          ['<strong>Moyenne S1</strong>', '', '', '', ''],
          ['J6', '', '', '', ''], ['J7', '', '', '', ''], ['J8', '', '', '', ''],
          ['J9', '', '', '', ''], ['J10', '', '', '', ''],
          ['<strong>Moyenne S2</strong>', '', '', '', ''],
        ],
      ) +
      `<div style="${G.GRIS}">
<p style="margin-top:0"><strong>Comptez vraiment le délai.</strong> Estimé, il vaut ce que
valent les estimations d’un mardi soir&nbsp;: la plupart des adultes découvrent qu’ils
intervenaient au bout de vingt secondes là où ils croyaient attendre deux minutes — ou
l’inverse.</p>
<p style="margin-bottom:0"><strong>La colonne&nbsp;2 explique tout le reste&nbsp;:</strong>
un jour sans préparation n’est pas un jour testé. Et la colonne&nbsp;4 protège d’une erreur
de lecture&nbsp;: un démarrage rapide suivi d’un abandon n’est pas un progrès.</p>
</div>`,
  }) +
  A.fiche({
    numero: 8,
    titre: 'La lecture du dixième jour, et les phrases de bilan',
    quand: 'le dixième jour, le relevé sous les yeux.',
    contenu:
      `<div style="${G.GRIS}">
<p style="margin:0"><strong>Mes nombres&nbsp;:</strong> délai moyen S1 ……&nbsp;·&nbsp;
délai moyen S2 ……&nbsp;·&nbsp; jours préparés ……&nbsp;/&nbsp;10&nbsp;·&nbsp; amorçages
……&nbsp;/&nbsp;10</p>
</div>` +
      A.tableau(
        ['Ce que dit le relevé', 'Ce qu’on fait'],
        [
          ['Le délai <strong>baisse</strong>, préparation faite presque tous les jours.', 'On garde la fiche telle quelle <strong>un mois</strong>. Ensuite seulement&nbsp;: «&nbsp;Guider puis s’effacer&nbsp;» pour retirer l’amorçage.'],
          ['Le délai ne bouge pas, préparation <strong>faite</strong>.', 'Ce n’était pas un problème de coût de démarrage. Fiche&nbsp;2 des annexes&nbsp;: on change de parcours plutôt que d’insister.'],
          ['Le délai ne bouge pas, préparation <strong>non faite</strong> (moins de 8/10).', 'Rien n’a été testé. On <strong>réduit</strong> la préparation jusqu’à ce qu’elle tienne, et on refait dix jours.'],
          ['Le délai baisse, mais <strong>l’amorçage reste nécessaire</strong> tous les jours.', 'Ce n’est pas un échec, c’est une étape. On garde, et on prépare le retrait avec «&nbsp;Guider puis s’effacer&nbsp;».'],
        ],
      ) +
      `<h4 style="margin:30px 0 8px">Écrire ce qu’on a obtenu</h4>` +
      A.tableau(
        ['Ce qu’on écrit spontanément', 'Ce qui se vérifie'],
        [
          ['Manque d’autonomie dans la mise au travail.', 'Entre au travail seul lorsque le poste est préparé et la première action nommée&nbsp;: délai moyen passé de 3 min 30 à 30 s en dix jours. Cadence et qualité conformes.'],
          ['Motivation fluctuante.', 'Le délai de démarrage varie avec la préparation du poste&nbsp;: 30 s les jours où elle est faite, 3 min les autres.'],
          ['A besoin d’être constamment relancé.', 'Les relances ont disparu depuis la mise en place de la préparation. Un amorçage a été nécessaire les quatre premiers jours, plus depuis.'],
          ['Ne se met pas au travail.', 'Ne démarre pas lorsque le matériel n’est pas sorti (délai&nbsp;&gt;&nbsp;3 min)&nbsp;; démarre en moins de 30 s lorsqu’il l’est.'],
          ['Paresseux, ne fait aucun effort.', '(à ne jamais écrire&nbsp;: un jugement moral, non vérifiable, qui survit longtemps à l’endroit où il a été écrit)'],
        ],
      ) +
      `<div style="${G.GRIS}">
<p style="margin:0"><strong>Une phrase de bilan utile contient deux chiffres et une
durée.</strong> C’est ce qui la rend comparable au bilan suivant — et ce qui montre un
travail plutôt qu’une impression.</p>
</div>`,
  }) +
  A.pied();

module.exports = {
  slug: 'aider-a-demarrer-une-tache',
  uuid: 'ccb1b2fe-b012-4754-912b-b9a2eb48029a',
  modules: [
    { titre: 'Module 1 — Les six coûts du démarrage, et les six leviers', minutes: 12, html: G.assembler(M1) },
    { titre: 'Module 2 — Une matinée perdue, et le geste arrivé trop tard', minutes: 10, html: G.assembler(M2) },
    { titre: 'Module 3 — Exercice guidé : la fiche de démarrage', minutes: 12, html: G.assembler(M3) },
    { titre: 'Module 4 — Dix jours, et la phrase de bilan', minutes: 12, html: G.assembler(M4) },
  ],
  annexes: ANNEXES,
};
