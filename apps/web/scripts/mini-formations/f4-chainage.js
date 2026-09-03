/**
 * FORMATION 4 — Décomposer une routine en étapes (contenu enrichi v3).
 * Compétence unique : découper une routine du quotidien en étapes enseignables
 * et choisir par quelle extrémité commencer.
 */

const G = require('./gabarit-v3.js');
const A = require('./annexes.js');

const TROIS_MODES = A.tableau(
  ['Mode', 'Comment ça se passe', 'Quand le choisir', 'Son avantage décisif'],
  [
    [
      '<strong>Chaînage arrière</strong>',
      'Vous faites les étapes 1 à n−1, la personne fait la dernière et termine. Puis les deux dernières. Puis les trois.',
      'Routine nouvelle, ou personne qui se décourage vite.',
      '<strong>La personne finit toujours la tâche.</strong> Ce qui récompense — les mains propres, le pull mis — arrive juste après ce qu’elle vient d’apprendre.',
    ],
    [
      '<strong>Chaînage avant</strong>',
      'La personne fait l’étape 1 seule, vous accompagnez la suite. Puis les deux premières.',
      'Les premières étapes sont les plus dures, ou la routine est trop longue pour être tenue en entier.',
      'Suit l’ordre naturel, plus facile à expliquer à une équipe.',
    ],
    [
      '<strong>Chaîne entière, aide dégressive</strong>',
      'La personne fait toute la routine à chaque fois&nbsp;; vous aidez seulement là où c’est nécessaire, et vous retirez l’aide étape par étape.',
      'Plus de la moitié des étapes sont déjà acquises seules.',
      'Ne découpe pas ce qui roule déjà. C’est le mode le plus rapide quand il s’applique.',
    ],
  ],
);

const M1 = {
  reperes: {
    minutes: 12,
    prerequis: 'aucun. La formation « Guider puis s’effacer » se marie bien avec celle-ci.',
    evaluation: 'quiz éclair en fin de module, et le livrable «&nbsp;Mon carnet de séance&nbsp;».',
  },
  objectifs: [
    'Transformer une phrase qui ne se travaille pas en une étape précise qui se travaille',
    'Écrire la chaîne d’une routine en étapes observables qui passent le test du témoin',
    'Prendre une ligne de base et dire ce qui est déjà acquis',
    'Choisir entre les trois modes d’enseignement, et justifier ce choix',
    'Comprendre pourquoi on n’enseigne qu’<strong>une seule</strong> étape à la fois',
  ],
  corps: `<h3 style="${G.H3}">1. « Il ne sait pas s’habiller » ne se travaille pas</h3>
<p>«&nbsp;Il ne sait pas s’habiller.&nbsp;» «&nbsp;Elle n’arrive pas à se laver les
mains.&nbsp;» «&nbsp;Il faut tout faire à sa place pour le repas.&nbsp;» Ces phrases
décrivent un résultat. Elles ne disent ni ce qui est déjà acquis, ni où exactement ça
s’arrête — et tant qu’on ne le sait pas, on ne peut qu’aider globalement, c’est-à-dire
faire à la place.</p>
<p>Comparez avec&nbsp;: «&nbsp;il bloque à l’étape 4 sur 9, celle où il faut passer le
bras derrière le dos&nbsp;». Cette phrase-là se travaille. Elle indique quoi enseigner,
elle se transmet à un collègue, et elle permettra de dire dans trois semaines si les
choses ont bougé.</p>
<p>Tout le travail de cette formation consiste à passer de la première phrase à la
seconde.</p>

<h3 style="${G.H3}">2. Une routine est une chaîne</h3>
<p>Un geste du quotidien est en réalité une <strong>suite d’étapes</strong> où chacune
sert de signal à la suivante. Enfiler un pull, ce n’est pas un geste, c’en est six ou
sept. Se laver les mains, huit. Mettre la table, six. Et la plupart de ces étapes sont
probablement déjà acquises&nbsp;: c’est précisément ce que la vision globale empêche de
voir.</p>
<div style="${G.GRIS}">
<p style="margin-top:0"><strong>Se laver les mains, en huit étapes&nbsp;:</strong></p>
<ol style="${G.UL}">
<li style="${G.LI}">ouvrir le robinet</li>
<li style="${G.LI}">mouiller les deux mains</li>
<li style="${G.LI}">prendre le savon</li>
<li style="${G.LI}">frotter les paumes</li>
<li style="${G.LI}">frotter le dos des mains</li>
<li style="${G.LI}">rincer</li>
<li style="${G.LI}">fermer le robinet</li>
<li style="${G.LI}">essuyer</li>
</ol>
<p style="margin-bottom:0">Huit étapes, chacune visible de l’extérieur, chacune
apprenable séparément.</p>
</div>

<h3 style="${G.H3}">3. Le test du témoin</h3>
<p>Une bonne décomposition passe un test simple&nbsp;: <strong>une personne qui n’a
jamais vu la routine doit pouvoir l’exécuter en lisant votre liste, sans rien
deviner</strong>. Trois règles suffisent pour y arriver&nbsp;:</p>
<ul style="${G.UL}">
<li style="${G.LI}"><strong>Si une étape contient «&nbsp;et&nbsp;», c’est deux
étapes.</strong> «&nbsp;Prendre le savon et frotter&nbsp;» se coupe en deux&nbsp;: on
peut réussir l’un et rater l’autre.</li>
<li style="${G.LI}"><strong>Si une étape contient un jugement, ce n’est pas une
étape.</strong> «&nbsp;Se laver correctement&nbsp;», «&nbsp;s’habiller
proprement&nbsp;» ne s’observent pas et ne se cochent pas.</li>
<li style="${G.LI}"><strong>Une chaîne décrit ce que fait LA PERSONNE.</strong>
«&nbsp;Lui donner le savon&nbsp;» décrit ce que vous faites, vous. C’est l’erreur la
plus fréquente et elle rend la ligne de base impossible à remplir.</li>
</ul>
<p>Visez entre cinq et douze étapes. Moins de cinq, la décomposition est trop grossière
pour être utile&nbsp;; plus de douze, elle ne sera pas tenue.</p>

<h3 style="${G.H3}">4. La ligne de base : regarder avant d’enseigner</h3>
<p>Avant d’enseigner quoi que ce soit, on regarde. On demande la routine complète, une
seule fois, dans les conditions habituelles, et on coche pour chaque étape&nbsp;:</p>
<ul style="${G.UL}">
<li style="${G.LI}"><strong>S</strong> — réussie seule</li>
<li style="${G.LI}"><strong>A</strong> — réussie avec une aide</li>
<li style="${G.LI}"><strong>N</strong> — non réussie</li>
</ul>
<p>Pendant cette observation, on ne corrige pas, on n’encourage pas, et on n’aide que
si la personne est bloquée depuis plus de cinq secondes — on note alors
«&nbsp;A&nbsp;». Le relevé prend le temps de la routine, pas une minute de plus.</p>

${G.exemple(
  'Ce que la ligne de base change dans une réunion',
  `<p style="margin-bottom:0">On ne dit plus «&nbsp;il ne sait pas se laver les
mains&nbsp;». On dit «&nbsp;six étapes sur huit sont acquises seules, ça bloque au
rinçage et à l’essuyage&nbsp;». La première phrase appelle du découragement&nbsp;; la
seconde appelle un plan de deux semaines.</p>`,
)}

<h3 style="${G.H3}">5. Trois façons d’enseigner une chaîne</h3>
${TROIS_MODES}
<p><strong>Le choix par défaut est le chaînage arrière</strong> quand la routine est
nouvelle ou quand la personne se décourage vite. On passe à la chaîne entière quand la
ligne de base montre plus de la moitié des étapes déjà acquises seules.</p>
<p>Le chaînage arrière surprend souvent au premier abord — il paraît illogique de
commencer par la fin. C’est pourtant lui qui a l’avantage le plus solide&nbsp;: la
personne <em>termine</em> la routine à chaque essai, dès la première séance. Elle vit
une réussite complète, et ce qui la récompense naturellement arrive juste après ce
qu’elle vient d’apprendre.</p>

<h3 style="${G.H3}">6. Une seule étape cible à la fois</h3>
<p>Le reste de la chaîne est accompagné sans hésitation, sans commentaire et à vitesse
normale. On n’enseigne pas toute la routine&nbsp;: on enseigne <strong>une
étape</strong>, et on assure toutes les autres.</p>
<p>La raison est pratique autant que pédagogique. Une routine entièrement transformée
en leçon devient un moment pénible — long, corrigé en permanence, jamais fini. Et un
moment pénible finit par être évité, ce qui rend la routine plus difficile qu’avant
d’avoir commencé.</p>`,
  aRetenir:
    'Une routine n’est pas une compétence, c’est une <strong>suite de compétences</strong> — et la plupart sont déjà acquises. Le travail consiste à trouver laquelle manque, pas à tout réapprendre.',
  exercice: {
    nom: 'La chaîne en huit lignes',
    duree: '10 minutes',
    quoi:
      'On écrit la chaîne aujourd’hui. La ligne de base se prendra demain, dans les conditions habituelles.',
    etapes: [
      'Choisissez une routine que vous accompagnez tous les jours et qui vous coûte du temps : habillage, toilette, repas, préparation du sac, coucher. Une seule.',
      'Numérotez les étapes. Entre cinq et douze. Un verbe d’action par étape, aucun « et », aucun adverbe de qualité.',
      'Passez le test du témoin : relisez en vous demandant si quelqu’un qui n’a jamais vu la routine pourrait l’exécuter. Là où il devrait deviner, il manque une étape.',
      'Vérifiez le point de vue : chaque étape décrit-elle ce que fait <em>la personne</em> ? Si votre liste contient ce que VOUS faites, réécrivez-la.',
      'Ajoutez à droite trois colonnes vides : S, A, N. Vous les cocherez demain.',
    ],
    reussi:
      'votre liste tient entre cinq et douze étapes, chacune commence par un verbe, aucune ne contient « et », et aucune ne décrit ce que vous faites.',
  },
  carnet: {
    intro: 'Ouvrez une page et gardez-la pendant tout le parcours.',
    lignes: [
      '<strong>La routine choisie</strong> — une seule, quotidienne.',
      '<strong>La chaîne numérotée</strong> — cinq à douze étapes observables.',
      '<strong>La ligne de base</strong> — S, A ou N pour chaque étape, prise en une seule fois.',
      '<strong>Le nombre de S</strong> — c’est lui qui décidera du mode d’enseignement.',
    ],
  },
  vigilance: [
    '<strong>Ne prenez pas la ligne de base un jour de crise ou de changement.</strong> Vous mesureriez le contexte, pas la compétence.',
    '<strong>Ne corrigez pas pendant la ligne de base.</strong> C’est le réflexe le plus difficile à retenir, et c’est celui qui fausse la mesure.',
    '<strong>Une routine intime — toilette, habillage — se travaille avec les précautions qui s’imposent&nbsp;:</strong> intimité respectée, accord de la personne, cadre posé en équipe. La technique ne dispense de rien.',
    '<strong>Si la personne peut dire ce qui coince, demandez-lui.</strong> Sa réponse vaut mieux que votre ligne de base.',
  ],
  annexes:
    'la <strong>feuille de chaîne</strong> avec les colonnes S/A/N, <strong>quatre chaînes déjà écrites</strong> (mains, pull, table, sac), et le <strong>tableau des trois modes d’enseignement</strong>.',
  avant: [
    'Ma chaîne compte entre cinq et douze étapes et passe le test du témoin.',
    'Chaque étape décrit ce que fait la personne, pas ce que je fais.',
    'Mes trois colonnes S / A / N sont prêtes à cocher.',
  ],
};

const M2 = {
  reperes: {
    minutes: 10,
    prerequis: 'le module 1 — la chaîne, la ligne de base, les trois modes.',
    evaluation: 'votre analyse écrite de la scène.',
  },
  objectifs: [
    'Repérer ce qui manquait <em>avant</em> une séance ratée, pas pendant',
    'Comprendre pourquoi une demande globale échoue toujours',
    'Identifier le moment où l’horaire décide à la place de la pédagogie',
    'Reformuler un retour qui valorise ce qui a réellement été fait',
  ],
  corps: `<h3 style="${G.H3}">1. Le manteau de Malik</h3>
<p>Une séance de trois minutes, un professionnel sérieux, et zéro apprentissage. Lisez,
puis arrêtez-vous.</p>

<div style="${G.GRIS}">
<p><em>Un IME. Malik a 9&nbsp;ans. L’équipe a décidé de travailler «&nbsp;mettre son
manteau tout seul&nbsp;» avant la sortie.</em></p>
<p><em>16&nbsp;h&nbsp;05. L’éducatrice&nbsp;: «&nbsp;Allez Malik, tu mets ton manteau
tout seul aujourd’hui.&nbsp;» Malik attrape le manteau par une manche et le tient
devant lui. Il attend.</em></p>
<p><em>«&nbsp;Vas-y, tu sais faire.&nbsp;» Il ne bouge pas. «&nbsp;Regarde, il faut le
mettre à l’endroit d’abord.&nbsp;» Elle lui retourne le manteau. Il enfile un bras.
«&nbsp;Voilà&nbsp;! Et l’autre&nbsp;?&nbsp;» Il tourne sur lui-même en cherchant la
deuxième manche. Trente secondes. Les autres enfants sont déjà dans le couloir.</em></p>
<p><em>«&nbsp;Bon, attends.&nbsp;» Elle lui met la deuxième manche, remonte la
fermeture éclair et le pousse doucement vers la porte. «&nbsp;C’est bien, la prochaine
fois tu le feras tout seul.&nbsp;»</em></p>
</div>

<h3 style="${G.H3}">2. Arrêtez-vous ici — cinq minutes, de quoi écrire</h3>
<p>La séance n’a rien produit&nbsp;: ni apprentissage, ni information. Cherchez ce qui
manquait <strong>avant</strong> la séance, pas pendant.</p>

${G.FILET}

<h3 style="${G.H3}">3. Ce qui manquait</h3>
<ul style="${G.UL}">
<li style="${G.LI}"><strong>Aucune chaîne écrite.</strong> «&nbsp;Mettre son
manteau&nbsp;» n’est pas une étape, c’en est six ou sept. Personne dans l’équipe ne
pourrait dire lesquelles Malik réussit — ni avant la séance, ni après.</li>
<li style="${G.LI}"><strong>Aucune étape cible.</strong> On lui a demandé la routine
entière, sans aide, d’un coup. C’est la seule consigne dont on est certain qu’elle
échouera.</li>
<li style="${G.LI}"><strong>L’aide est arrivée quand il a fallu partir</strong>, pas
quand il a fallu apprendre. La deuxième manche a été mise sous la pression de
l’horaire. Ce qui a été enseigné ce jour-là, c’est&nbsp;: <em>si j’attends assez
longtemps, quelqu’un le fait</em>.</li>
<li style="${G.LI}"><strong>Le seul retour reçu est un reproche déguisé.</strong>
«&nbsp;La prochaine fois tu le feras tout seul&nbsp;» décrit un échec — alors que Malik
a bel et bien enfilé un bras seul, ce que personne n’a nommé.</li>
<li style="${G.LI}"><strong>Le moment était le pire possible.</strong> Seize heures
cinq, groupe qui part, couloir qui attend. Une chaîne s’enseigne quand on a le temps de
<em>ne pas</em> aider.</li>
</ul>

${G.alerte(
  'L’horaire décide plus souvent que la pédagogie',
  `<p style="margin-bottom:0">Presque toutes les séances d’apprentissage ratées le sont
pour une raison d’organisation, pas de méthode. Si le créneau ne permet pas cinq
secondes de silence, aucun plan ne tiendra — et il vaut mieux déplacer la séance de
quinze minutes que d’améliorer sa technique.</p>`,
)}

<h3 style="${G.H3}">4. La même séance, autrement</h3>
<p><strong>Chaîne écrite&nbsp;:</strong> 1. poser le manteau à l’endroit — 2. enfiler
le bras droit — 3. passer derrière le dos — 4. enfiler le bras gauche — 5. joindre le
bas de la fermeture — 6. remonter la fermeture.</p>
<p><strong>Ligne de base prise mardi&nbsp;:</strong> étapes 1, 2 et 6 réussies
seules&nbsp;; 3 et 4 avec aide&nbsp;; 5 jamais.</p>
<p><strong>Trois S sur six</strong>&nbsp;: exactement la moitié. Avec un enfant qui se
décourage, on prend le chaînage arrière. <strong>Étape cible&nbsp;: la 5</strong> —
l’éducatrice fait 1 à 4, Malik joint le bas de la fermeture et la remonte, donc
<em>il termine</em>.</p>
<p><strong>La séance dure vingt secondes</strong>, elle a lieu à 15&nbsp;h&nbsp;50 avant
que le groupe ne s’agite, et elle se conclut sur ce qui s’est réellement
produit&nbsp;: «&nbsp;tu as accroché la fermeture tout seul, ton manteau est
mis.&nbsp;»</p>

<h3 style="${G.H3}">5. Le retour : nommer le geste, jamais la personne</h3>
<p>Un détail qui n’en est pas un. Comparez&nbsp;:</p>
${A.tableau(
  ['Ce qu’on dit spontanément', 'Ce que ça enseigne', 'Ce qu’il vaut mieux dire'],
  [
    ['«&nbsp;C’est bien&nbsp;!&nbsp;»', 'Rien de précis&nbsp;: la personne ne sait pas ce qui était bien.', '«&nbsp;Tu as accroché la fermeture tout seul.&nbsp;»'],
    ['«&nbsp;Tu es un grand&nbsp;»', 'Juge la personne. Le jour où ça rate, elle n’est plus un grand.', '«&nbsp;Tu as mis les deux bras avant que je bouge.&nbsp;»'],
    ['«&nbsp;La prochaine fois tout seul&nbsp;»', 'Décrit un échec au moment d’une réussite partielle.', '«&nbsp;Ton manteau est mis. Demain on refait pareil.&nbsp;»'],
  ],
)}
<p><strong>Une phrase de retour s’écrit à l’avance.</strong> Improvisée, elle devient
«&nbsp;bravo&nbsp;» et n’enseigne rien. Écrite, elle sort au bon moment et elle nomme
exactement ce qui vient d’être appris.</p>`,
  aRetenir:
    'Une séance ratée l’est presque toujours à cause de ce qui manquait <strong>avant</strong>&nbsp;: pas de chaîne, pas d’étape cible, pas de créneau. Améliorer sa réaction sur le moment ne rattrape aucune de ces trois absences.',
  exercice: {
    nom: 'Votre séance qui rate',
    duree: '10 minutes',
    quoi: 'On refait l’exercice sur une routine à vous.',
    etapes: [
      'Racontez par écrit, au présent, une séance récente qui n’a rien produit. Dix lignes.',
      'Cherchez les cinq absences du point 3 : chaîne écrite, étape cible, aide au bon moment, retour utile, créneau. Cochez celles qui manquaient.',
      'Regardez l’heure de la séance. Aviez-vous cinq secondes de silence disponibles ? Si non, écrivez à quelle heure vous les auriez.',
      'Écrivez ce que la personne a RÉELLEMENT réussi ce jour-là. Il y a toujours quelque chose, et c’est presque toujours ce qu’on oublie de nommer.',
      'Écrivez la phrase de retour que vous direz demain — nommant le geste, pas la personne.',
    ],
    reussi:
      'vous avez coché au moins deux absences, vous avez un nouvel horaire de séance, et une phrase de retour écrite mot pour mot.',
  },
  carnet: {
    intro: 'Ajoutez ces quatre lignes à la page du module 1.',
    lignes: [
      '<strong>Les absences cochées</strong> — parmi les cinq du point 3.',
      '<strong>Le créneau retenu</strong> — l’heure où j’ai cinq secondes de silence.',
      '<strong>Ce que la personne réussit déjà</strong> — écrit noir sur blanc.',
      '<strong>Ma phrase de retour</strong> — mot pour mot, prête à sortir.',
    ],
  },
  vigilance: [
    '<strong>Cette scène n’accuse personne.</strong> L’éducatrice de Malik fait ce que tout le monde fait à 16 h 05 avec un groupe qui part. Ce qui manquait est un plan, pas de la bonne volonté.',
    '<strong>Ne travaillez pas une routine sur le créneau où elle est la plus contrainte.</strong> Le matin de la sortie, l’heure du bus, la fin de service : ce sont les pires moments.',
    '<strong>Ne nommez jamais l’échec dans le retour.</strong> « La prochaine fois tout seul » transforme une réussite partielle en reproche.',
    '<strong>Une routine peut être refusée</strong>, et le refus se respecte. On revient plus tard, on ne force pas — voir les garde-fous en fin de parcours.',
  ],
  annexes:
    'la <strong>grille des cinq absences</strong>, le <strong>tableau des phrases de retour</strong>, et <strong>la séance de Malik corrigée</strong>, chaîne et ligne de base comprises.',
  avant: [
    'J’ai identifié au moins deux des cinq absences dans une de mes séances.',
    'J’ai choisi un créneau où cinq secondes de silence sont réellement possibles.',
    'J’ai écrit ma phrase de retour, qui nomme le geste et pas la personne.',
  ],
};

const M3 = {
  reperes: {
    minutes: 12,
    prerequis: 'les modules 1 et 2, et une chaîne écrite.',
    evaluation: 'votre ligne de base remplie et votre étape cible entourée.',
  },
  objectifs: [
    'Prendre une ligne de base exploitable en une seule observation',
    'Compter les S et en déduire le mode d’enseignement',
    'Choisir l’étape cible selon le mode retenu',
    'Fixer un critère de passage avant de commencer',
    'Écrire la phrase de retour qui accompagnera l’étape cible',
  ],
  corps: `<h3 style="${G.H3}">1. La ligne de base, en une seule fois</h3>
<p>Vous avez votre chaîne. Demain, vous demandez la routine complète, <strong>une seule
fois</strong>, dans les conditions habituelles, et vous cochez.</p>
<p>Trois règles pendant cette observation, et elles sont difficiles&nbsp;:</p>
<ul style="${G.UL}">
<li style="${G.LI}"><strong>Vous ne corrigez pas.</strong> Même si c’est fait à
l’envers, même si ça va être plus long.</li>
<li style="${G.LI}"><strong>Vous n’encouragez pas pendant.</strong> Un
«&nbsp;vas-y&nbsp;» est déjà une aide, et il transforme un S en A.</li>
<li style="${G.LI}"><strong>Vous n’aidez qu’après cinq secondes de blocage</strong>, et
vous notez alors A.</li>
</ul>
<p>Une seule observation suffit pour démarrer. Deux valent mieux qu’une, et trois ne
servent à rien&nbsp;: à ce stade, la précision compte moins que le fait de commencer.</p>

<h3 style="${G.H3}">2. Compter les S, et laisser le compte décider</h3>
<div style="${G.GRIS}">
<ul style="${G.UL}">
<li style="${G.LI}"><strong>Plus de la moitié des étapes en S</strong> → <em>chaîne
entière avec aide dégressive</em>. Étape cible&nbsp;: la première A ou N en partant du
début.</li>
<li style="${G.LI}"><strong>Moins de la moitié</strong>, ou personne qui se décourage
vite → <em>chaînage arrière</em>. Étape cible&nbsp;: la dernière étape non acquise en
partant de la fin. Vous faites tout ce qui la précède&nbsp;; la personne exécute la
cible et termine la routine.</li>
<li style="${G.LI}"><strong>Les premières étapes sont les plus dures</strong> →
<em>chaînage avant</em>. Étape cible&nbsp;: l’étape 1.</li>
</ul>
</div>
<p>Le compte décide, pas l’intuition. C’est le point de la méthode&nbsp;: une règle
écrite à froid résiste à la fatigue d’un jeudi soir, une intuition non.</p>

${G.exemple(
  'Un exemple complet, chiffres compris',
  `<p><strong>Se laver les mains, huit étapes. Ligne de base&nbsp;:</strong> 1&nbsp;S,
2&nbsp;S, 3&nbsp;A, 4&nbsp;S, 5&nbsp;A, 6&nbsp;N, 7&nbsp;S, 8&nbsp;N.</p>
<p><strong>Compte&nbsp;:</strong> quatre S sur huit — exactement la moitié, donc pas
«&nbsp;plus de la moitié&nbsp;». La personne se décourage vite&nbsp;: chaînage arrière.</p>
<p style="margin-bottom:0"><strong>Étape cible&nbsp;:</strong> la dernière non acquise
en partant de la fin, soit la 8 (essuyer). Vous faites les étapes 1 à 7, la personne
s’essuie les mains et termine. Dès que le critère est atteint, on ajoute la 7, puis la
6.</p>`,
)}

<h3 style="${G.H3}">3. Le critère de passage, décidé maintenant</h3>
<p>On passe à l’étape suivante quand l’étape cible est réussie <strong>sans aide, trois
fois de suite</strong>. Ce critère se fixe avant de commencer&nbsp;: décidé sur le
moment, il se déplace toujours au moment où l’on est fatigué ou pressé.</p>
<p>Deux variantes utiles&nbsp;:</p>
<ul style="${G.UL}">
<li style="${G.LI}">Si la routine n’a lieu qu’une fois par jour&nbsp;: «&nbsp;trois
jours de suite&nbsp;».</li>
<li style="${G.LI}">Si plusieurs adultes interviennent&nbsp;: «&nbsp;deux fois de suite
avec deux personnes différentes&nbsp;». C’est le meilleur critère, parce qu’il vérifie
que l’apprentissage n’est pas attaché à quelqu’un.</li>
</ul>

<h3 style="${G.H3}">4. La phrase de retour, écrite d’avance</h3>
<p>Préparez maintenant ce que vous direz juste après la réussite de l’étape cible. Elle
doit&nbsp;:</p>
<ul style="${G.UL}">
<li style="${G.LI}"><strong>nommer le geste</strong>, pas la personne&nbsp;;</li>
<li style="${G.LI}"><strong>être courte</strong> — une phrase, pas un discours&nbsp;;</li>
<li style="${G.LI}"><strong>arriver tout de suite</strong>, avant que la routine ne
continue.</li>
</ul>
<p>Une phrase écrite d’avance sort au bon moment. Une phrase improvisée devient
«&nbsp;bravo&nbsp;» et n’enseigne rien.</p>

<h3 style="${G.H3}">5. Ce que vous devez avoir sur votre feuille en sortant</h3>
<div style="${G.GRIS}">
<ul style="${G.UL}">
<li style="${G.LI}">Une chaîne numérotée, cinq à douze étapes.</li>
<li style="${G.LI}">Une colonne S / A / N remplie.</li>
<li style="${G.LI}">Un mode d’enseignement entouré.</li>
<li style="${G.LI}">Une étape cible entourée.</li>
<li style="${G.LI}">Un critère de passage écrit.</li>
<li style="${G.LI}">Une phrase de retour écrite mot pour mot.</li>
</ul>
</div>
<p>Six éléments, une feuille. Si l’un manque, le relevé de la semaine suivante ne
servira à rien.</p>`,
  aRetenir:
    'Le <strong>compte des S décide du mode</strong>, et le mode décide de l’étape cible. Une règle écrite à froid résiste à un jeudi soir&nbsp;; une intuition, non.',
  exercice: {
    nom: 'La ligne de base et l’étape cible',
    duree: '12 minutes, dont l’observation de demain',
    quoi: 'On complète la feuille jusqu’à pouvoir démarrer lundi.',
    etapes: [
      'Demain, demandez la routine complète une seule fois. Cochez S, A ou N pour chaque étape. Ne corrigez pas, n’encouragez pas, n’aidez qu’après cinq secondes.',
      'Comptez les S. Écrivez le nombre en bas de la feuille.',
      'Appliquez la règle du point 2 et entourez le mode d’enseignement.',
      'Entourez l’étape cible selon le mode retenu. Une seule.',
      'Écrivez le critère de passage, puis la phrase de retour mot pour mot.',
    ],
    reussi:
      'les six éléments du point 5 sont sur votre feuille, et vous pourriez la donner à un collègue qui commencerait lundi à votre place.',
  },
  carnet: {
    intro: 'La feuille EST le livrable. Recopiez ces cinq lignes au propre.',
    lignes: [
      '<strong>Ma ligne de base</strong> — S / A / N pour chaque étape.',
      '<strong>Le nombre de S</strong> — sur le nombre total d’étapes.',
      '<strong>Le mode retenu</strong> — et la règle qui l’a décidé.',
      '<strong>L’étape cible</strong> — une seule, et pourquoi celle-là.',
      '<strong>Le critère et la phrase de retour</strong> — écrits mot pour mot.',
    ],
  },
  vigilance: [
    '<strong>Ne prenez pas la ligne de base un jour particulier.</strong> Retour de week-end, maladie, changement d’adulte : reportez.',
    '<strong>Une seule étape cible.</strong> Deux étapes cibles, c’est zéro étape cible : la personne ne saura pas ce qui est attendu.',
    '<strong>Le critère se fixe avant.</strong> C’est la seule protection contre le déplacement de l’objectif un soir de fatigue.',
    '<strong>Si toutes les étapes sont en N</strong>, la routine est probablement trop difficile dans son ensemble : cherchez une routine plus simple pour installer le mécanisme, et revenez à celle-ci plus tard.',
  ],
  annexes:
    'la <strong>feuille de chaîne complète</strong> (étapes, S/A/N, mode, cible, critère, phrase), <strong>quatre chaînes prêtes à l’emploi</strong>, et un <strong>exemple entièrement chiffré</strong>.',
  avant: [
    'Ma ligne de base est prise et mes S sont comptés.',
    'Mon mode d’enseignement découle de la règle, pas de mon intuition.',
    'J’ai une seule étape cible, un critère écrit et une phrase de retour mot pour mot.',
  ],
};

const M4 = {
  reperes: {
    minutes: 12,
    prerequis: 'les modules 1 à 3, et une feuille complète.',
    evaluation: 'la lecture de votre relevé au dixième jour.',
  },
  objectifs: [
    'Tenir le protocole en quatre gestes, dix jours de suite',
    'Relever l’aide utilisée plutôt que la seule réussite',
    'Lire le relevé et reconnaître une étape trop grosse',
    'Décider de la suite : passer à l’étape suivante, découper, ou changer de routine',
    'Vérifier que la routine est restée supportable',
  ],
  corps: `<h3 style="${G.H3}">1. Le protocole, en quatre gestes</h3>
<p>Il se répète à l’identique, tous les jours, et il tient en quatre lignes&nbsp;:</p>
<ol style="${G.UL}">
<li style="${G.LI}"><strong>Vous exécutez toutes les étapes hors cible</strong> sans
commentaire, à vitesse normale. Ce ne sont pas des leçons.</li>
<li style="${G.LI}"><strong>Arrivé à l’étape cible, vous laissez cinq secondes de
silence.</strong> Le silence est l’outil principal&nbsp;: c’est lui qui laisse la place
au geste.</li>
<li style="${G.LI}"><strong>Si rien ne vient, vous donnez l’aide la plus légère qui
débloque</strong> — un regard vers l’objet avant de le montrer, le montrer avant de
guider le poignet — et vous retirez cette aide d’un cran à chaque séance.</li>
<li style="${G.LI}"><strong>Dès que l’étape est faite, votre phrase de retour</strong>,
puis la routine se termine normalement.</li>
</ol>

<h3 style="${G.H3}">2. Le relevé, dix lignes</h3>
${A.tableau(
  ['Jour', 'Étape cible', 'Aide utilisée', 'Réussi ?'],
  [
    ['J1', '', 'aucune / mot / geste montré / main guidée', 'oui / non'],
    ['J2', '', '', ''],
    ['…', '', '', ''],
  ],
)}
<p>Rien d’autre. Un relevé qui demande plus d’une minute n’est pas tenu au-delà du
troisième jour, et un relevé abandonné vaut moins qu’un relevé minuscule.</p>
<p><strong>La colonne qui compte est «&nbsp;aide utilisée&nbsp;», pas
«&nbsp;réussi&nbsp;».</strong> Avec une main guidée, tout est réussi tous les jours&nbsp;:
c’est la diminution de l’aide qui montre l’apprentissage.</p>

<h3 style="${G.H3}">3. La lecture du dixième jour</h3>
${A.tableau(
  ['Ce que dit le relevé', 'Ce que ça veut dire', 'La suite'],
  [
    [
      'L’aide diminue, et le critère est atteint',
      'L’étape est acquise.',
      'Ajoutez l’étape suivante selon votre mode. Refaites une feuille.',
    ],
    [
      'L’aide reste identique dix jours',
      'L’étape est trop grosse.',
      'Coupez-la en deux. « Enfiler le bras gauche » devient « attraper la manche » puis « pousser le bras ».',
    ],
    [
      'L’aide diminue puis remonte',
      'Souvent une cause extérieure&nbsp;: fatigue, maladie, changement d’organisation.',
      'Tenez le niveau qui marchait, et cherchez ce qui a changé autour.',
    ],
    [
      'La routine est devenue un moment de tension',
      'Le coût dépasse le bénéfice.',
      'Arrêtez l’enseignement une semaine, reprenez la routine accompagnée normalement. Une compétence acquise dans un moment détesté ne se transfère nulle part.',
    ],
  ],
)}

<h3 style="${G.H3}">4. Les trois questions du dixième jour</h3>
<ul style="${G.UL}">
<li style="${G.LI}"><strong>L’aide a-t-elle diminué&nbsp;?</strong> Regardez cette
colonne seule. Elle doit descendre. Si elle reste identique, votre étape est trop
grosse&nbsp;: découpez-la, n’insistez pas.</li>
<li style="${G.LI}"><strong>Ai-je aidé avant les cinq secondes&nbsp;?</strong> C’est
l’erreur la plus commune et la plus invisible, et elle vient de l’horaire, pas de la
personne. Si oui, déplacez la séance de quinze minutes plus tôt.</li>
<li style="${G.LI}"><strong>La routine est-elle restée supportable&nbsp;?</strong> Si
elle est devenue un moment de tension, arrêtez une semaine. Ce n’est pas un échec, c’est
un réglage.</li>
</ul>

<h3 style="${G.H3}">5. Écrire ce que vous avez obtenu</h3>
<p>Comme pour l’estompage, la phrase de bilan doit contenir <strong>un point de départ,
un point d’arrivée et une durée</strong>&nbsp;:</p>
<div style="${G.GRIS}">
<p style="margin-bottom:0"><em>«&nbsp;Sur la routine du manteau (six étapes), trois
étapes étaient réalisées seules début mars. Après deux semaines de travail en chaînage
arrière sur l’étape 5, cinq étapes sur six sont réalisées seules, avec deux
professionnels différents. L’étape 4 reste à travailler.&nbsp;»</em></p>
</div>
<p>Cette phrase-là entre dans un projet personnalisé, se compare d’un bilan à l’autre,
et survit à un changement d’équipe. «&nbsp;Progrès en autonomie&nbsp;» ne fait rien de
tout cela.</p>

${G.alerte(
  'Quand arrêter et passer la main',
  `<ul style="${G.UL}">
<li style="${G.LI}">la routine devient un moment de conflit systématique&nbsp;;</li>
<li style="${G.LI}">la personne manifeste une détresse nette à son approche&nbsp;;</li>
<li style="${G.LI}">une régression apparaît sur des étapes auparavant acquises&nbsp;;</li>
<li style="${G.LI}">une douleur ou une difficulté motrice est possible.</li>
</ul>
<p style="margin-bottom:0">Dans ces quatre cas on suspend et on en parle — en équipe,
avec un ergothérapeute, ou avec un médecin. Une routine n’est jamais urgente.</p>`,
)}`,
  aRetenir:
    'La colonne qui montre l’apprentissage est <strong>«&nbsp;aide utilisée&nbsp;»</strong>, pas «&nbsp;réussi&nbsp;». Et une aide qui ne diminue pas en dix jours signifie une seule chose&nbsp;: l’étape est trop grosse.',
  exercice: {
    nom: 'La lecture du dixième jour',
    duree: '10 minutes, le relevé sous les yeux',
    quoi: 'Feuille en main, pas de mémoire.',
    etapes: [
      'Regardez la colonne « aide » seule. Écrivez le niveau du J1 et celui du J10.',
      'Comptez les jours où vous avez aidé avant les cinq secondes. Soyez honnête : c’est la donnée la plus utile du relevé.',
      'Placez-vous dans une des quatre lectures du point 3.',
      'Si l’aide n’a pas bougé, écrivez maintenant les deux sous-étapes qui remplaceront votre étape cible.',
      'Écrivez la phrase de bilan : point de départ, point d’arrivée, durée.',
    ],
    reussi:
      'vous avez deux niveaux d’aide, un nombre de jours « aidé trop tôt », une lecture choisie, et une phrase de bilan chiffrée.',
  },
  carnet: {
    intro: 'Les dernières lignes. Elles constituent votre bilan.',
    lignes: [
      '<strong>Niveau d’aide au J1 et au J10</strong>.',
      '<strong>Nombre de jours où j’ai aidé trop tôt</strong>.',
      '<strong>La lecture choisie</strong> — une des quatre.',
      '<strong>Les sous-étapes fabriquées</strong>, s’il a fallu.',
      '<strong>La phrase de bilan</strong> — départ, arrivée, durée.',
    ],
  },
  vigilance: [
    '<strong>Dix jours, une étape.</strong> Ajouter une deuxième étape cible en cours de route rend le relevé illisible.',
    '<strong>Un relevé minuscule tenu vaut mieux qu’un beau relevé abandonné.</strong> Une minute par jour, pas plus.',
    '<strong>Vérifiez avec un deuxième adulte.</strong> Une étape acquise avec vous seul n’est pas acquise.',
    '<strong>Cette formation ne pose aucun diagnostic</strong> et ne remplace ni un bilan ergothérapique ni un avis médical. Une difficulté motrice se traite avec un professionnel de la motricité.',
  ],
  annexes:
    'le <strong>relevé de dix jours</strong>, la <strong>fiche de lecture du dixième jour</strong>, et le <strong>tableau des découpages</strong> pour couper une étape trop grosse.',
  avant: [
    'J’ai dix jours de relevé, avec la colonne « aide » remplie.',
    'Je sais combien de fois j’ai aidé avant les cinq secondes.',
    'J’ai une phrase de bilan qui contient un départ, une arrivée et une durée.',
  ],
};

/* ── ANNEXES ─────────────────────────────────────────────────────────────── */

const ANNEXES =
  A.entete('Décomposer une routine en étapes') +
  A.fiche({
    numero: 1,
    titre: 'La feuille de chaîne — à recopier',
    quand: 'une fois par routine travaillée.',
    contenu:
      `<div style="${G.GRIS}">
<p style="margin:0"><strong>Routine&nbsp;:</strong> ……………………………………………… &nbsp;·&nbsp; <strong>Initiales&nbsp;:</strong> ……</p>
<p style="margin:8px 0 0"><strong>Créneau&nbsp;:</strong> …… h …… <em>(un moment où cinq secondes de silence sont possibles)</em></p>
</div>` +
      A.tableau(
        ['N°', 'Étape (ce que fait la personne)', 'S', 'A', 'N'],
        [
          ['1', '', '', '', ''], ['2', '', '', '', ''], ['3', '', '', '', ''],
          ['4', '', '', '', ''], ['5', '', '', '', ''], ['6', '', '', '', ''],
          ['7', '', '', '', ''], ['8', '', '', '', ''], ['9', '', '', '', ''],
          ['10', '', '', '', ''], ['11', '', '', '', ''], ['12', '', '', '', ''],
        ],
      ) +
      `<div style="${G.GRIS}">
<p style="margin:0"><strong>Nombre de S&nbsp;:</strong> …… sur ……</p>
<p style="margin:10px 0 0"><strong>Mode retenu&nbsp;:</strong> chaînage arrière · chaînage avant · chaîne entière à aide dégressive</p>
<p style="margin:10px 0 0"><strong>Étape cible&nbsp;:</strong> n° ……</p>
<p style="margin:10px 0 0"><strong>Critère de passage&nbsp;:</strong> ………………………………………………………</p>
<p style="margin:10px 0 0"><strong>Phrase de retour</strong> (mot pour mot)&nbsp;: «&nbsp;………………………………………………………&nbsp;»</p>
</div>`,
  }) +
  A.fiche({
    numero: 2,
    titre: 'Quatre chaînes déjà écrites',
    quand: 'pour démarrer sans partir de zéro. À adapter, jamais à recopier tel quel.',
    contenu: `<h4 style="margin:26px 0 8px">Se laver les mains — 8 étapes</h4>
<p>1. ouvrir le robinet · 2. mouiller les deux mains · 3. prendre le savon · 4. frotter
les paumes · 5. frotter le dos des mains · 6. rincer · 7. fermer le robinet ·
8. essuyer</p>

<h4 style="margin:26px 0 8px">Mettre un manteau — 6 étapes</h4>
<p>1. poser le manteau à l’endroit · 2. enfiler le bras droit · 3. passer derrière le
dos · 4. enfiler le bras gauche · 5. joindre le bas de la fermeture · 6. remonter la
fermeture</p>

<h4 style="margin:26px 0 8px">Mettre la table pour une personne — 6 étapes</h4>
<p>1. poser le set · 2. poser l’assiette au milieu · 3. poser la fourchette à gauche ·
4. poser le couteau à droite · 5. poser le verre en haut à droite · 6. poser la
serviette</p>

<h4 style="margin:26px 0 8px">Préparer son sac pour le lendemain — 7 étapes</h4>
<p>1. sortir l’emploi du temps · 2. lire les matières du lendemain · 3. sortir les
cahiers de la veille · 4. mettre les cahiers du lendemain · 5. vérifier la trousse ·
6. fermer le sac · 7. poser le sac près de la porte</p>

<div style="${G.ALERTE}">
<h3 style="margin-top:0;color:#8a3a2e">À adapter, toujours</h3>
<p style="margin-bottom:0">Ces chaînes sont des points de départ. La vraie chaîne
dépend du lavabo, du manteau, de la table et du sac de la personne concernée. Une
chaîne recopiée telle quelle échoue au test du témoin dès la deuxième étape.</p>
</div>`,
  }) +
  A.fiche({
    numero: 3,
    titre: 'Les trois modes d’enseignement',
    quand: 'après avoir compté les S.',
    contenu:
      TROIS_MODES +
      `<div style="${G.GRIS}">
<p style="margin-top:0"><strong>La règle de décision, en trois lignes&nbsp;:</strong></p>
<ul style="${G.UL}">
<li style="${G.LI}">Plus de la moitié des étapes en S → chaîne entière, aide dégressive. Cible&nbsp;: la première A ou N en partant du début.</li>
<li style="${G.LI}">Moins de la moitié, ou découragement rapide → chaînage arrière. Cible&nbsp;: la dernière non acquise en partant de la fin.</li>
<li style="${G.LI}">Les premières étapes sont les plus dures → chaînage avant. Cible&nbsp;: l’étape 1.</li>
</ul>
</div>`,
  }) +
  A.fiche({
    numero: 4,
    titre: 'Couper une étape trop grosse',
    quand: 'quand l’aide n’a pas diminué en dix jours.',
    contenu:
      A.tableau(
        ['Étape trop grosse', 'Les deux sous-étapes'],
        [
          ['Enfiler le bras gauche', 'Attraper la manche → pousser le bras dedans'],
          ['Remonter la fermeture éclair', 'Joindre les deux bas de la fermeture → tirer le curseur'],
          ['Frotter les mains avec le savon', 'Frotter les paumes → frotter le dos des mains'],
          ['Ranger son cahier', 'Fermer le cahier → le mettre dans le sac'],
          ['Se servir à boire', 'Attraper la carafe à deux mains → verser jusqu’au trait'],
          ['Lacer ses chaussures', 'Croiser les lacets → faire le premier nœud → faire les boucles'],
        ],
      ) +
      `<p><strong>Le principe&nbsp;:</strong> chercher le point où le geste change de
nature. Attraper n’est pas pousser&nbsp;; joindre n’est pas tirer. C’est là qu’on coupe,
et c’est presque toujours là que ça bloquait.</p>`,
  }) +
  A.fiche({
    numero: 5,
    titre: 'Le relevé de dix jours',
    quand: 'du premier au dixième jour, une minute par jour.',
    contenu:
      A.tableau(
        ['Jour', 'Étape cible', 'Aide utilisée (aucune / mot / geste montré / main guidée)', 'Réussi ?'],
        [
          ['J1', '', '', ''], ['J2', '', '', ''], ['J3', '', '', ''], ['J4', '', '', ''],
          ['J5', '', '', ''], ['J6', '', '', ''], ['J7', '', '', ''], ['J8', '', '', ''],
          ['J9', '', '', ''], ['J10', '', '', ''],
        ],
      ) +
      `<div style="${G.GRIS}">
<p style="margin-top:0"><strong>Les trois questions du dixième jour&nbsp;:</strong></p>
<ul style="${G.UL}">
<li style="${G.LI}">L’aide a-t-elle diminué&nbsp;? <em>Si non&nbsp;: l’étape est trop grosse, coupez-la.</em></li>
<li style="${G.LI}">Ai-je aidé avant les cinq secondes&nbsp;? <em>Si oui&nbsp;: déplacez la séance de quinze minutes plus tôt.</em></li>
<li style="${G.LI}">La routine est-elle restée supportable&nbsp;? <em>Si non&nbsp;: arrêtez l’enseignement une semaine.</em></li>
</ul>
</div>`,
  }) +
  A.fiche({
    numero: 6,
    titre: 'Écrire ce qu’on a obtenu',
    quand: 'au bilan, au projet personnalisé, en réunion.',
    contenu:
      A.tableau(
        ['Ce qu’on écrit spontanément', 'Ce qui se vérifie et se compare'],
        [
          [
            'Progrès en autonomie sur l’habillage',
            'Sur la routine du manteau (six étapes), trois étapes étaient réalisées seules début mars&nbsp;; après deux semaines de chaînage arrière sur l’étape 5, cinq sur six le sont, avec deux professionnels différents.',
          ],
          [
            'Ne sait pas se laver les mains',
            'Six étapes sur huit sont acquises seules&nbsp;; le rinçage et l’essuyage nécessitent encore un geste montré.',
          ],
          [
            'Nécessite l’aide de l’adulte',
            'L’aide est passée d’une main guidée à un mot en dix jours sur l’étape cible.',
          ],
        ],
      ) +
      `<p><strong>Une phrase utile contient un point de départ, un point d’arrivée et une
durée.</strong> C’est ce qui permet de la comparer au bilan suivant — et de montrer un
travail plutôt qu’une impression.</p>`,
  }) +
  A.pied();

module.exports = {
  slug: 'decomposer-une-routine-en-etapes',
  uuid: '13aca11a-ba31-439e-a197-6da6b461a9b5',
  modules: [
    { titre: 'Module 1', minutes: 12, html: G.assembler(M1) },
    { titre: 'Module 2', minutes: 10, html: G.assembler(M2) },
    { titre: 'Module 3', minutes: 12, html: G.assembler(M3) },
    { titre: 'Module 4', minutes: 12, html: G.assembler(M4) },
  ],
  annexes: ANNEXES,
};
