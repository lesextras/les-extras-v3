/**
 * FORMATION 1 — Les quatre fonctions d'un comportement (contenu enrichi v3).
 *
 * Compétence unique : identifier à quoi sert un comportement avant de chercher
 * à le modifier.
 *
 * ⚠ Cette formation enseigne des principes issus de l'analyse appliquée du
 * comportement. L'encart NUANCE_COMPORTEMENTALE est obligatoire en fin de
 * parcours — voir catalogue-mini-formations.js. Ne pas le retirer.
 */

const G = require('./gabarit-v3.js');

const M1 = {
  reperes: {
    minutes: 12,
    prerequis: 'aucun. C’est le module d’entrée du parcours.',
    evaluation:
      'quiz éclair en fin de module, et le livrable «&nbsp;Mon carnet de séance&nbsp;».',
  },
  objectifs: [
    'Distinguer la <strong>forme</strong> d’un comportement (ce qu’on voit) de sa <strong>fonction</strong> (ce qu’il obtient)',
    'Nommer les quatre fonctions possibles et donner un exemple de chacune tiré de votre propre terrain',
    'Décrire un comportement en termes observables, sans interprétation ni jugement',
    'Reconnaître les deux erreurs qui font échouer la plupart des plans d’action',
    'Comprendre pourquoi deux comportements identiques peuvent demander deux réponses opposées',
  ],
  corps: `<h3 style="${G.H3}">1. Un comportement n’est pas un symptôme, c’est une fonction</h3>
<p>Face à un comportement qui pose problème — crier, frapper, se mordre, fuir la table,
jeter un objet, s’effondrer au sol —, le premier réflexe est de chercher à le faire
cesser. C’est le réflexe le plus naturel du monde, et c’est celui qui échoue le plus
souvent. Il échoue parce qu’il traite la <em>forme</em> et laisse intacte la
<em>fonction</em>.</p>
<p>Un comportement qui se répète se répète pour une raison très simple&nbsp;: il
<strong>marche</strong>. Il produit un résultat que la personne recherche, et il le
produit de façon suffisamment fiable pour valoir la peine d’être refait. Cela n’a rien
à voir avec la volonté, le caractère ou l’éducation&nbsp;: c’est un mécanisme
d’apprentissage, le même chez tout le monde, vous compris.</p>
<p>La question utile n’est donc jamais «&nbsp;comment le faire arrêter&nbsp;?&nbsp;».
Elle est&nbsp;: <strong>«&nbsp;qu’est-ce que ce comportement obtient&nbsp;?&nbsp;»</strong>
Une fois qu’on le sait, la suite devient presque évidente — et c’est l’objet de la
formation suivante du parcours.</p>

<h3 style="${G.H3}">2. Forme et fonction : pourquoi on se trompe de cible</h3>
<p>La forme, c’est ce qu’une caméra enregistrerait. La fonction, c’est ce qui se passe
juste après et qui explique que ça recommence. Deux personnes peuvent produire
<em>exactement</em> la même forme pour deux fonctions opposées.</p>
<p>Prenons «&nbsp;Léa jette son assiette&nbsp;». Trois versions&nbsp;:</p>
<ul style="${G.UL}">
<li style="${G.LI}">Léa jette son assiette, l’éducateur arrive aussitôt, s’assoit à
côté d’elle et lui parle pendant cinq minutes. <em>Fonction probable&nbsp;: obtenir de
l’attention.</em></li>
<li style="${G.LI}">Léa jette son assiette, on la fait sortir de table et le repas
s’arrête pour elle. <em>Fonction probable&nbsp;: échapper au repas.</em></li>
<li style="${G.LI}">Léa jette son assiette, quelqu’un lui apporte autre chose à manger.
<em>Fonction probable&nbsp;: obtenir un objet ou un aliment précis.</em></li>
</ul>
<p>Même geste, trois moteurs différents. Si vous répondez à la deuxième version comme à
la première — en venant lui parler longuement —, vous ne réglez rien&nbsp;; si vous
répondez à la première comme à la deuxième — en la faisant sortir —, vous lui apprenez
que jeter son assiette permet de partir. <strong>C’est la fonction, pas la forme, qui
dicte la réponse.</strong></p>

${G.exemple(
  'Le test qui tranche en une phrase',
  `<p style="margin-bottom:0">Terminez cette phrase&nbsp;: «&nbsp;Quand ……… se produit,
[la personne] fait ………, et du coup elle obtient ………&nbsp;». Si vous ne savez pas
remplir le troisième blanc, vous n’avez pas encore de plan d’action&nbsp;: vous avez une
plainte.</p>`,
)}

<h3 style="${G.H3}">3. Les quatre fonctions, une par une</h3>
<p>La littérature comportementale en retient quatre. Elles couvrent l’immense majorité
des situations, et il n’est pas rare qu’un même comportement en serve deux selon le
moment de la journée.</p>

<h4 style="margin:26px 0 8px">a. Obtenir de l’attention</h4>
<p>Le comportement fait venir quelqu’un. Attention&nbsp;: <strong>une réprimande est de
l’attention</strong>. Se faire gronder, c’est être regardé, nommé, touché parfois — pour
une personne dont c’est le principal moyen d’exister dans le groupe, c’est un résultat.
Indice&nbsp;: le comportement survient surtout quand l’adulte est occupé ailleurs, au
téléphone, avec un autre enfant, et il s’arrête dès que l’adulte arrive.</p>

<h4 style="margin:26px 0 8px">b. Échapper à quelque chose, ou l’éviter</h4>
<p>Le comportement fait disparaître une demande, une tâche, un lieu, un bruit, une
personne. C’est la fonction la plus fréquente en établissement, et la plus souvent
manquée&nbsp;: on lit de l’opposition là où il y a une fuite. Indice&nbsp;: le
comportement apparaît <em>après la consigne</em>, jamais avant, et il cesse quand la
demande est retirée.</p>

<h4 style="margin:26px 0 8px">c. Obtenir un objet ou une activité</h4>
<p>Le comportement fait apparaître quelque chose de concret&nbsp;: un aliment, un
écran, un jouet, la permission de sortir. Indice&nbsp;: il survient quand l’objet est
visible mais inaccessible, ou quand on vient de l’enlever.</p>

<h4 style="margin:26px 0 8px">d. Une sensation recherchée en elle-même</h4>
<p>Le comportement produit une sensation agréable ou fait baisser une sensation
désagréable, sans que personne d’autre n’y soit pour quelque chose&nbsp;: se balancer,
se frotter les mains, faire un bruit répétitif. Indice décisif&nbsp;: <strong>il
continue quand la personne est seule</strong>, et il ne dépend pas de ce que vous
faites.</p>

${G.alerte(
  'La quatrième fonction n’est pas un problème par défaut',
  `<p style="margin-bottom:0">Un balancement qui apaise et ne blesse personne n’est pas
un objectif de travail. Le transformer en objectif, c’est demander à quelqu’un de
renoncer à sa manière de se réguler pour le confort de l’entourage. On n’intervient sur
un comportement sensoriel que s’il blesse, s’il empêche un apprentissage que la personne
souhaite, ou s’il l’isole d’une vie sociale qu’elle recherche. Sinon, on le laisse.</p>`,
)}

<h3 style="${G.H3}">4. L’outil : la grille en trois temps</h3>
<p>On ne devine pas une fonction, on la déduit d’un relevé. L’outil tient en trois
colonnes, dans cet ordre&nbsp;:</p>
<ul style="${G.UL}">
<li style="${G.LI}"><strong>Avant</strong> — ce qui se passait juste avant. Où, avec
qui, quelle demande venait d’être faite, quel bruit, quel changement.</li>
<li style="${G.LI}"><strong>Comportement</strong> — ce que la caméra aurait vu, décrit
sans adjectif. Pas «&nbsp;il s’énerve&nbsp;», mais «&nbsp;il pousse la table des deux
mains et crie pendant environ trente secondes&nbsp;».</li>
<li style="${G.LI}"><strong>Après</strong> — ce qui s’est passé dans les dix secondes
qui ont suivi. Qui est venu, ce qui a été dit, ce qui a été retiré, ce qui a été donné.
C’est cette colonne qui contient la réponse, et c’est celle qu’on remplit le moins bien.</li>
</ul>
<p>Une seule ligne ne prouve rien. Cinq à dix lignes sur une semaine font apparaître un
motif, et le motif se lit dans la colonne «&nbsp;Après&nbsp;»&nbsp;: si les trois quarts
des lignes se terminent par «&nbsp;la consigne a été retirée&nbsp;», vous connaissez la
fonction.</p>

<h3 style="${G.H3}">5. Décrire sans juger — la compétence qui conditionne tout le reste</h3>
<p>Un relevé écrit avec des mots d’interprétation ne sert à rien&nbsp;: on ne peut pas
compter «&nbsp;il était agressif&nbsp;». Trois habitudes suffisent&nbsp;:</p>
<ul style="${G.UL}">
<li style="${G.LI}"><strong>Un verbe, pas un adjectif.</strong> «&nbsp;Provocateur&nbsp;»
devient «&nbsp;répète la consigne en imitant la voix de l’adulte&nbsp;».</li>
<li style="${G.LI}"><strong>Une durée ou un compte.</strong> «&nbsp;Souvent&nbsp;»
devient «&nbsp;quatre fois entre 8&nbsp;h et 9&nbsp;h&nbsp;».</li>
<li style="${G.LI}"><strong>Aucune cause dans la colonne du comportement.</strong>
«&nbsp;Il crie parce qu’il est fatigué&nbsp;» mélange l’observation et l’hypothèse&nbsp;:
la fatigue va dans la colonne «&nbsp;Avant&nbsp;», si elle est constatable.</li>
</ul>
<p>Cette habitude sert bien au-delà de la formation&nbsp;: c’est exactement l’écriture
qu’attend un rapport de situation, une note d’observation ou un compte rendu d’ESS.</p>`,
  aRetenir:
    'Un comportement qui se répète obtient quelque chose. Tant que vous ne savez pas <strong>quoi</strong>, toute réponse est un pari — et la moitié des paris renforcent le comportement qu’ils visaient à réduire.',
  exercice: {
    nom: 'La colonne « Après » en dix minutes',
    duree: '10 minutes, sur une situation réelle',
    quoi:
      'On travaille d’abord la colonne la plus mal remplie, pas la grille entière : c’est elle qui contient la fonction.',
    etapes: [
      'Choisissez UN comportement, un seul, celui qui vous coûte le plus cette semaine. Écrivez-le en une phrase observable, sans adjectif.',
      'Rappelez-vous les trois dernières fois où il s’est produit. Pour chacune, écrivez uniquement ce qui s’est passé <em>dans les dix secondes qui ont suivi</em> — qui est venu, ce qui a été dit, ce qui a été donné ou retiré.',
      'Relisez vos trois lignes et entourez ce qui revient. Attention venue ? Demande retirée ? Objet obtenu ? Rien du tout de la part de l’entourage ?',
      'Écrivez votre hypothèse en une phrase : « Je fais l’hypothèse que ce comportement sert à ………, parce que dans ……… cas sur trois il a obtenu ……… ».',
      'Notez enfin ce qui vous ferait changer d’avis. Une hypothèse qu’aucune observation ne pourrait démentir n’est pas une hypothèse.',
    ],
    reussi:
      'votre phrase d’hypothèse tient en une ligne, elle nomme une des quatre fonctions, et elle s’appuie sur au moins deux observations concordantes — pas sur une impression.',
  },
  carnet: {
    intro:
      'Ouvrez une page et gardez-la ouverte pendant tout le parcours. Vous la remplirez à chaque module, et c’est elle qui deviendra votre trace de suivi.',
    lignes: [
      '<strong>Le comportement, en une phrase observable</strong> — ce qu’une caméra verrait, sans adjectif.',
      '<strong>Trois lignes « Après »</strong> — ce qui s’est passé dans les dix secondes suivantes, trois fois.',
      '<strong>Mon hypothèse de fonction</strong> — une des quatre, et pourquoi.',
      '<strong>Ce qui me ferait changer d’avis</strong> — l’observation qui démentirait mon hypothèse.',
    ],
  },
  vigilance: [
    '<strong>Deux fonctions à la fois, c’est fréquent.</strong> Le même cri peut servir à échapper à la douche le matin et à obtenir de l’attention le soir. Dans ce cas on ne fait pas un plan, on en fait deux — un par moment.',
    '<strong>Ne cherchez pas la fonction pendant la crise.</strong> Pendant, on sécurise. L’analyse se fait après, au calme, sur des notes.',
    '<strong>Une hypothèse n’est pas un diagnostic.</strong> Elle se partage en équipe, elle se discute, et elle se révise. Elle ne se met pas dans un dossier comme un fait établi.',
    '<strong>Attention à l’explication qui arrange.</strong> « Il fait ça pour m’embêter » n’est pas une fonction : c’est une intention prêtée. Aucune des quatre fonctions ne suppose une intention hostile.',
  ],
  annexes:
    'la <strong>grille Avant / Comportement / Après</strong> à imprimer, un <strong>mémo des quatre fonctions</strong> avec leurs indices, et <strong>trois relevés corrigés</strong> à comparer aux vôtres.',
  avant: [
    'Je peux nommer les quatre fonctions sans relire le module.',
    'J’ai écrit UN comportement en termes observables, sans un seul adjectif.',
    'J’ai une hypothèse de fonction adossée à au moins deux observations, et je sais ce qui la démentirait.',
  ],
};

const M2 = {
  reperes: {
    minutes: 10,
    prerequis: 'le module 1 — les quatre fonctions et la grille en trois temps.',
    evaluation:
      'votre analyse écrite de la scène, comparée à celle du module. Aucune note : ce qui compte est l’écart entre les deux.',
  },
  objectifs: [
    'Analyser une situation réelle sans qu’on vous en donne d’abord la solution',
    'Repérer, dans une scène, le moment exact où la fonction du comportement a été renforcée',
    'Identifier les trois erreurs de réponse les plus fréquentes en équipe',
    'Formuler ce qui aurait dû être fait AVANT la scène, pas seulement pendant',
  ],
  corps: `<h3 style="${G.H3}">1. On vous montre d’abord ce qui rate</h3>
<p>La plupart des formations montrent un professionnel qui réussit. C’est agréable à
regarder et ça ne s’apprend pas&nbsp;: on voit le résultat, jamais le raisonnement.
Ici, on fait l’inverse — on vous montre une scène qui dérape, on vous demande de
chercher pourquoi, et l’analyse ne vient qu’après. C’est un principe pédagogique
éprouvé&nbsp;: la réponse que vous produisez vous-même est celle que vous
retrouverez sur le terrain, à chaud.</p>
<p>Lisez la scène en entier, puis arrêtez-vous. Ne faites pas défiler.</p>

<h3 style="${G.H3}">2. La scène — l’atelier cuisine du mardi</h3>
<div style="${G.GRIS}">
<p><em>Un ITEP. Atelier cuisine, six jeunes, deux professionnels. Yanis a
11&nbsp;ans. Il participe depuis trois semaines, il aime cet atelier — il l’a dit.</em></p>
<p><em>14&nbsp;h&nbsp;10. L’éducatrice&nbsp;: «&nbsp;Yanis, tu épluches les carottes
avec Sarah.&nbsp;» Yanis prend l’économe, le repose, se lève et va à la fenêtre.</em></p>
<p><em>«&nbsp;Yanis, on a dit les carottes.&nbsp;» Il ne bouge pas. Elle
répète, plus fort. Il tape du plat de la main sur le rebord de la fenêtre, trois fois.</em></p>
<p><em>«&nbsp;Bon. Tu ne veux pas&nbsp;? Tu sors, tu reviendras quand tu seras
calme.&nbsp;» Yanis sort. Il reste dans le couloir quinze minutes, puis revient
s’asseoir. L’atelier est fini, il aide à ranger, tout se passe bien.</em></p>
<p><em>La semaine suivante, même atelier. Yanis tape sur la fenêtre au bout de
quatre minutes. La semaine d’après, au bout de deux.</em></p>
</div>

<h3 style="${G.H3}">3. Arrêtez-vous ici — cinq minutes, de quoi écrire</h3>
<p>Trois questions, dans cet ordre. Écrivez les réponses, ne les pensez pas
seulement&nbsp;: la différence entre penser et écrire est exactement la différence
entre «&nbsp;j’ai compris&nbsp;» et «&nbsp;je sais le faire&nbsp;».</p>
<ul style="${G.UL}">
<li style="${G.LI}">Que s’est-il passé dans les dix secondes qui ont suivi le
comportement&nbsp;?</li>
<li style="${G.LI}">Quelle fonction cela renforce-t-il&nbsp;?</li>
<li style="${G.LI}">Qu’est-ce qui prouve, dans la scène, que l’hypothèse est
bonne&nbsp;?</li>
</ul>

${G.FILET}

<h3 style="${G.H3}">4. L’analyse</h3>
<p><strong>Ce qui s’est passé après&nbsp;: la tâche a disparu.</strong> Yanis n’a pas
épluché les carottes, et il n’a pas eu à le faire. Le comportement a produit une
échappée, immédiate et complète. Fonction&nbsp;: <em>échapper à une tâche</em>.</p>
<p><strong>La preuve est dans la courbe.</strong> Quatre minutes, puis deux. Un
comportement qui apparaît <em>de plus en plus tôt</em> semaine après semaine est un
comportement qui a été renforcé — c’est la signature la plus fiable qui soit. S’il
s’agissait d’un problème d’humeur ou de fatigue, le délai varierait au hasard&nbsp;;
il ne raccourcirait pas régulièrement.</p>
<p><strong>Et le détail qui écarte l’attention&nbsp;:</strong> Yanis revient de
lui-même, aide au rangement, et tout se passe bien. Quelqu’un qui cherche de
l’attention ne s’apaise pas dans un couloir vide pendant quinze minutes. Ce n’est pas
l’adulte qu’il fuyait, c’est l’épluchage.</p>

<h3 style="${G.H3}">5. Les trois erreurs, et elles sont classiques</h3>
<ul style="${G.UL}">
<li style="${G.LI}"><strong>On a répété la consigne plus fort.</strong> Monter le ton
augmente la pression, donc augmente la valeur de l’échappée. Chaque répétition rendait
la sortie plus désirable.</li>
<li style="${G.LI}"><strong>On a fait sortir au pire moment.</strong> «&nbsp;Tu
reviendras quand tu seras calme&nbsp;» est une phrase raisonnable dans une situation
d’attention&nbsp;; dans une situation d’échappée, c’est exactement la récompense
demandée, servie dans la seconde.</li>
<li style="${G.LI}"><strong>Personne n’a regardé la tâche elle-même.</strong> Éplucher
une carotte à l’économe demande une coordination fine, ça peut faire mal, ça peut rater
devant les autres. On a lu un refus là où il y avait peut-être une difficulté motrice
et une peur de l’échec en public.</li>
</ul>

${G.alerte(
  'Ce qui ne s’est PAS passé, et qui compte autant',
  `<p style="margin-bottom:0">Personne n’a demandé à Yanis ce qui coinçait. Il a
11&nbsp;ans et il parle. Aucune analyse fonctionnelle ne remplace la question posée à
la personne concernée — quand elle peut y répondre, elle donne souvent la réponse en
une phrase.</p>`,
)}

<h3 style="${G.H3}">6. Ce qui aurait dû se passer avant la scène</h3>
<p>Le module 1 le disait&nbsp;: la réponse se prépare froid, pas à chaud. Trois
décisions auraient changé la semaine&nbsp;:</p>
<ul style="${G.UL}">
<li style="${G.LI}"><strong>Réduire la tâche avant de la proposer.</strong> Deux
carottes, pas six. Un économe à poignée large. Ou l’étape suivante de la recette, si
c’est l’épluchage qui pose problème.</li>
<li style="${G.LI}"><strong>Décider à l’avance ce qui se passe en cas de refus</strong>,
et que ce ne soit pas la sortie. Par exemple&nbsp;: la tâche reste sur la table, on
propose de la faire à deux, et on n’insiste pas plus de deux fois.</li>
<li style="${G.LI}"><strong>Donner un moyen de demander une pause</strong> — c’est
l’objet de la formation «&nbsp;Apprendre à demander plutôt qu’à crier&nbsp;». Une pause
demandée et accordée coûte trente secondes&nbsp;; une pause arrachée coûte l’atelier.</li>
</ul>`,
  aRetenir:
    'Un comportement qui apparaît <strong>de plus en plus tôt</strong> d’une fois sur l’autre n’est pas un caprice qui s’aggrave : c’est un comportement que l’environnement a renforcé. La courbe est souvent la preuve la plus solide dont vous disposiez.',
  exercice: {
    nom: 'Votre scène qui dérape',
    duree: '12 minutes',
    quoi:
      'On refait l’exercice sur une situation à vous — la vôtre est plus difficile que celle de Yanis, parce que vous y êtes.',
    etapes: [
      'Racontez par écrit, au présent et sans commentaire, une scène récente qui s’est mal terminée. Dix à quinze lignes. Interdit : les mots « énervé », « provocateur », « caprice », « exprès ».',
      'Soulignez la phrase qui décrit ce qui s’est passé <em>juste après</em> le comportement.',
      'Demandez-vous : ce qui s’est passé après, est-ce que la personne le cherchait ? Si oui, vous tenez la fonction.',
      'Cherchez la courbe : est-ce que ce comportement arrive plus tôt, plus fort ou plus souvent qu’il y a un mois ? Notez-le.',
      'Écrivez enfin les deux décisions qui auraient dû être prises AVANT la scène. Pas pendant — avant.',
    ],
    reussi:
      'vos deux décisions portent sur la tâche, l’environnement ou une possibilité offerte à la personne — et aucune ne consiste à « réagir mieux » sur le moment.',
  },
  carnet: {
    intro: 'Reprenez la page ouverte au module 1 et ajoutez-y ces quatre lignes.',
    lignes: [
      '<strong>Ma scène</strong> — quinze lignes au présent, sans adjectif de jugement.',
      '<strong>Ce qui s’est passé juste après</strong> — une phrase soulignée.',
      '<strong>La courbe</strong> — plus tôt / pareil / plus tard qu’il y a un mois.',
      '<strong>Deux décisions « avant »</strong> — ce qui aurait changé la scène en amont.',
    ],
  },
  vigilance: [
    '<strong>Écrire une scène où l’on figure soi-même est inconfortable.</strong> C’est normal, et ce n’est pas un procès : l’équipe de Yanis n’a rien fait d’aberrant, elle a fait ce que tout le monde fait. Le but est de voir le mécanisme, pas de désigner un coupable.',
    '<strong>Ne changez rien cette semaine.</strong> Ce module observe. Modifier une réponse avant d’avoir stabilisé l’hypothèse, c’est se priver de la seule chose qui permettra de savoir si le changement a marché.',
    '<strong>Si la scène implique une contention ou une blessure</strong>, elle relève d’un protocole d’établissement et d’une analyse en équipe, pas d’un exercice individuel. Sortez-la de cet exercice et portez-la où elle doit aller.',
  ],
  annexes:
    'la <strong>trame « scène qui dérape »</strong> à remplir, la <strong>liste des mots à bannir</strong> d’un relevé, et <strong>la scène de Yanis corrigée</strong>, avec l’analyse ligne à ligne.',
  avant: [
    'J’ai écrit une scène de dix à quinze lignes sans un seul mot de jugement.',
    'J’ai identifié ce que le comportement a obtenu dans les dix secondes suivantes.',
    'J’ai formulé deux décisions « avant », et aucune ne consiste à mieux réagir sur le moment.',
  ],
};

const M3 = {
  reperes: {
    minutes: 12,
    prerequis: 'les modules 1 et 2 — la grille et l’analyse d’une scène.',
    evaluation:
      'la grille remplie sur votre propre situation, avec au moins cinq lignes.',
  },
  objectifs: [
    'Remplir une grille en quatre colonnes sur une situation réelle, pendant une semaine',
    'Choisir un moment d’observation qui donnera des lignes exploitables',
    'Repérer un motif dans un relevé, et savoir quand il n’y en a pas',
    'Écrire une hypothèse de fonction argumentée, transmissible à une équipe',
    'Reconnaître les quatre erreurs de relevé qui rendent une semaine d’observation inutilisable',
  ],
  corps: `<h3 style="${G.H3}">1. La grille, en quatre colonnes</h3>
<p>Le module 1 en présentait trois. On en ajoute une, et c’est celle qui fait la
différence entre un relevé qui dort dans un classeur et un relevé qui sert&nbsp;: la
date et l’heure.</p>
<div style="${G.GRIS}">
<ul style="${G.UL}">
<li style="${G.LI}"><strong>Quand</strong> — jour et heure précise. Un motif horaire
saute aux yeux dès la cinquième ligne&nbsp;: avant le repas, après la sieste, le lundi
matin.</li>
<li style="${G.LI}"><strong>Avant</strong> — la situation dans les deux minutes
précédentes. Lieu, personnes présentes, demande formulée, bruit, changement de dernière
minute.</li>
<li style="${G.LI}"><strong>Comportement</strong> — ce qu’une caméra verrait. Verbe
d’action, durée ou nombre.</li>
<li style="${G.LI}"><strong>Après</strong> — les dix secondes suivantes. Qui est venu,
ce qui a été dit, donné, retiré.</li>
</ul>
</div>

<h3 style="${G.H3}">2. Choisir le bon moment d’observation</h3>
<p>Observer toute la journée, c’est n’observer nulle part&nbsp;: personne ne tient plus
de trois jours. On choisit donc <strong>une fenêtre de trente à soixante minutes</strong>,
la même chaque jour, et on l’annonce à l’équipe.</p>
<p>La bonne fenêtre remplit trois conditions&nbsp;: le comportement s’y produit
presque toujours&nbsp;; vous y êtes physiquement présent&nbsp;; et vous pouvez y écrire
trois lignes sans quitter votre poste. Si vous ne pouvez pas écrire, vous ne relèverez
rien — c’est la première cause d’abandon, très loin devant le manque de motivation.</p>

${G.exemple(
  'Un relevé minuscule vaut mieux qu’un beau relevé abandonné',
  `<p style="margin-bottom:0">Une croix dans une case et trois mots suffisent. Les
grilles élégantes en douze colonnes que l’on trouve en ligne sont abandonnées au
troisième jour, et un relevé abandonné ne prouve rien du tout. Visez une minute par
ligne, pas davantage.</p>`,
)}

<h3 style="${G.H3}">3. Lire le relevé — ce qu’on cherche exactement</h3>
<p>Au bout de cinq à dix lignes, on ne lit pas le relevé en entier&nbsp;: on lit
<strong>une colonne à la fois</strong>, et dans cet ordre.</p>
<ul style="${G.UL}">
<li style="${G.LI}"><strong>La colonne «&nbsp;Après&nbsp;» d’abord.</strong> Comptez.
Combien de lignes se terminent par une attention reçue&nbsp;? une demande
retirée&nbsp;? un objet obtenu&nbsp;? rien du tout&nbsp;? La catégorie majoritaire est
votre hypothèse.</li>
<li style="${G.LI}"><strong>La colonne «&nbsp;Avant&nbsp;» ensuite</strong>, pour
confirmer. Si «&nbsp;Après&nbsp;» dit «&nbsp;échappée&nbsp;», «&nbsp;Avant&nbsp;»
devrait contenir une demande dans presque toutes les lignes. Si ce n’est pas le cas,
votre hypothèse est fragile.</li>
<li style="${G.LI}"><strong>La colonne «&nbsp;Quand&nbsp;» en dernier.</strong> Un
motif horaire ne donne pas la fonction, mais il donne le moment où intervenir — et
c’est souvent lui qui rend le plan réalisable.</li>
</ul>

<h3 style="${G.H3}">4. Quand il n’y a pas de motif</h3>
<p>Cela arrive, et ce n’est pas un échec de votre part. Trois causes, dans l’ordre de
fréquence&nbsp;:</p>
<ul style="${G.UL}">
<li style="${G.LI}"><strong>Le comportement a deux fonctions</strong> selon le moment.
Séparez le relevé en deux — matin et après-midi, ou avec untel et avec untel — et
relisez chaque moitié séparément. Le motif réapparaît souvent d’un coup.</li>
<li style="${G.LI}"><strong>La colonne «&nbsp;Après&nbsp;» est trop vague.</strong>
«&nbsp;On a géré&nbsp;», «&nbsp;ça s’est calmé&nbsp;» ne se comptent pas. Reprenez une
semaine en n’écrivant QUE cette colonne, et en nommant qui a fait quoi.</li>
<li style="${G.LI}"><strong>Il y a une cause physique.</strong> Douleur dentaire,
otite, constipation, effet d’un traitement, faim, sommeil. Un comportement qui apparaît
sans motif environnemental, chez quelqu’un qui n’en avait pas il y a un mois, appelle
d’abord un avis médical — pas un plan éducatif.</li>
</ul>

${G.alerte(
  'Ce que ce relevé n’est pas',
  `<p>Ce n’est pas une pièce à charge. Il décrit un comportement dans un contexte, et
le contexte comprend les adultes. Un relevé qui montrerait que le comportement survient
surtout avec une personne précise est une information de travail, pas une faute — et il
se partage avec cette personne, pas dans son dos.</p>
<p style="margin-bottom:0">Ce n’est pas non plus un document d’usager tant que l’équipe
ne l’a pas validé. Gardez-le sur un support neutre, sans nom complet ni date de
naissance, tant qu’il est à l’état de brouillon.</p>`,
)}

<h3 style="${G.H3}">5. Écrire l’hypothèse pour qu’elle circule</h3>
<p>Une hypothèse utile tient en trois phrases et se lit par quelqu’un qui n’était pas
là&nbsp;:</p>
<div style="${G.GRIS}">
<p style="margin-bottom:0"><em>«&nbsp;Sur neuf observations entre le 3 et le 10 mars,
dans la fenêtre 11&nbsp;h&nbsp;30 – 12&nbsp;h, [le jeune] pousse la table et crie. Sept
fois sur neuf, la demande de venir à table a été retirée ou reportée dans les
secondes qui ont suivi. Je fais l’hypothèse d’une fonction d’échappement à
l’installation à table, et je propose d’en discuter en réunion du 15.&nbsp;»</em></p>
</div>
<p>Trois éléments obligatoires&nbsp;: <strong>un nombre</strong> (neuf observations),
<strong>une proportion</strong> (sept sur neuf), <strong>une proposition</strong> (en
discuter). Sans le nombre, c’est une impression. Sans la proposition, c’est un
constat qui ne mène nulle part.</p>`,
  aRetenir:
    'On ne lit pas un relevé en le lisant&nbsp;: on <strong>compte la colonne « Après »</strong>. Une hypothèse sans nombre est une impression, et une impression ne se transmet pas à une équipe.',
  exercice: {
    nom: 'La grille de la semaine',
    duree: '12 minutes maintenant, puis une minute par jour',
    quoi:
      'On prépare la grille aujourd’hui pour que le relevé de la semaine ne demande plus aucune décision.',
    etapes: [
      'Tracez quatre colonnes sur une feuille : Quand · Avant · Comportement · Après. Une feuille, pas un fichier — elle doit pouvoir rester dans une poche.',
      'Écrivez EN HAUT, une fois pour toutes, le comportement observé en termes observables. Vous ne le réécrirez pas à chaque ligne.',
      'Choisissez votre fenêtre : trente à soixante minutes, la même chaque jour, un moment où vous êtes présent et où vous pouvez écrire.',
      'Prévenez l’équipe ou la famille : « je relève ce comportement cette semaine sur ce créneau, je ne change rien d’autre ». Cette phrase évite qu’on modifie les réponses en même temps que vous observez.',
      'Faites une ligne d’essai dès aujourd’hui, sur un souvenir. Si elle vous a pris plus d’une minute, simplifiez la grille avant de commencer.',
    ],
    reussi:
      'votre grille tient sur une feuille, la ligne d’essai a pris moins d’une minute, et la fenêtre d’observation est écrite noir sur blanc avec une heure de début et de fin.',
  },
  carnet: {
    intro:
      'Ces quatre lignes se remplissent à la fin de la semaine d’observation, pas avant.',
    lignes: [
      '<strong>Nombre de lignes relevées</strong> — et sur combien de jours.',
      '<strong>Colonne « Après » comptée</strong> — combien d’attention, d’échappée, d’objet, de rien.',
      '<strong>Motif horaire</strong> — s’il y en a un, à quelle heure.',
      '<strong>Mon hypothèse en trois phrases</strong> — avec un nombre, une proportion et une proposition.',
    ],
  },
  vigilance: [
    '<strong>Ne changez rien pendant la semaine d’observation.</strong> Si vous modifiez vos réponses en même temps que vous relevez, vous ne saurez jamais ce que vous avez mesuré.',
    '<strong>Cinq lignes suffisent pour une hypothèse de travail.</strong> Attendre vingt lignes parfaites, c’est ne jamais commencer.',
    '<strong>Un comportement rare mais grave ne se relève pas de cette façon.</strong> Une agression sérieuse, une automutilation, une fugue relèvent d’un protocole d’établissement et d’une analyse pluridisciplinaire.',
    '<strong>Le relevé contient des données sur une personne.</strong> Pas de nom complet, pas de date de naissance sur une feuille volante&nbsp;; des initiales suffisent, et la feuille ne sort pas du service.',
  ],
  annexes:
    'la <strong>grille en quatre colonnes</strong> prête à imprimer (format poche et format A4), une <strong>feuille de comptage</strong> de la colonne « Après », et <strong>deux relevés d’une semaine entière</strong>, l’un exploitable et l’autre non, avec ce qui les distingue.',
  avant: [
    'Ma grille est tracée, le comportement est écrit en haut, et la fenêtre d’observation a une heure de début et de fin.',
    'Ma ligne d’essai a pris moins d’une minute.',
    'J’ai prévenu l’équipe ou la famille que j’observe sans rien changer d’autre.',
  ],
};

const M4 = {
  reperes: {
    minutes: 12,
    prerequis: 'les modules 1 à 3, et une semaine de relevé derrière vous.',
    evaluation:
      'la lecture de votre propre relevé au septième jour, et la décision que vous en tirez.',
  },
  objectifs: [
    'Tenir un relevé sur sept jours sans qu’il devienne une charge',
    'Lire ce relevé et en tirer une conclusion argumentée',
    'Décider de la suite : plan de remplacement, aménagement, avis médical, ou nouvelle semaine d’observation',
    'Transmettre l’hypothèse à une équipe ou à une famille sans la présenter comme un fait',
    'Repérer les signes qu’il faut arrêter et passer la main',
  ],
  corps: `<h3 style="${G.H3}">1. Sept jours, une minute par ligne</h3>
<p>Le protocole est volontairement pauvre&nbsp;: vous relevez, et vous ne changez rien
d’autre. Trois règles suffisent.</p>
<ul style="${G.UL}">
<li style="${G.LI}"><strong>Une ligne par occurrence</strong>, dans la fenêtre choisie.
Si le comportement se produit dix fois, dix lignes&nbsp;; s’il ne se produit pas,
écrivez «&nbsp;rien&nbsp;» — un jour sans occurrence est une donnée, pas une case vide.</li>
<li style="${G.LI}"><strong>La colonne «&nbsp;Après&nbsp;» est prioritaire.</strong> Si
vous ne pouvez remplir qu’une colonne, remplissez celle-là.</li>
<li style="${G.LI}"><strong>Vous répondez comme d’habitude.</strong> Cette semaine
mesure l’existant. Améliorer sa réponse pendant la mesure, c’est mesurer autre chose.</li>
</ul>

<h3 style="${G.H3}">2. Le septième jour : la lecture guidée</h3>
<p>Posez le relevé, prenez dix minutes, et répondez à ces quatre questions dans
l’ordre. Écrivez les réponses.</p>
<ul style="${G.UL}">
<li style="${G.LI}"><strong>Combien de lignes, sur combien de jours&nbsp;?</strong>
Moins de cinq lignes&nbsp;: soit la fenêtre est mal choisie, soit le comportement est
plus rare que ressenti — et cela seul est déjà une information utile à rapporter.</li>
<li style="${G.LI}"><strong>Que dit la colonne «&nbsp;Après&nbsp;»&nbsp;?</strong>
Comptez par catégorie. Une catégorie qui rassemble plus de la moitié des lignes
constitue une hypothèse solide.</li>
<li style="${G.LI}"><strong>Que dit la colonne «&nbsp;Avant&nbsp;»&nbsp;?</strong>
Cherchez ce qui revient&nbsp;: une consigne, une personne, un lieu, une transition, un
bruit. C’est là que se trouvent les aménagements les moins coûteux.</li>
<li style="${G.LI}"><strong>Que dit l’heure&nbsp;?</strong> Un motif horaire indique
souvent une cause physiologique — faim, fatigue, fin d’effet d’un traitement — autant
qu’une cause éducative.</li>
</ul>

<h3 style="${G.H3}">3. Quatre conclusions possibles, et une seule à choisir</h3>
<div style="${G.GRIS}">
<ul style="${G.UL}">
<li style="${G.LI}"><strong>Une fonction se dégage nettement.</strong> Vous passez à la
suite&nbsp;: enseigner un comportement de remplacement qui obtient la même chose. C’est
l’objet de la formation «&nbsp;Apprendre à demander plutôt qu’à crier&nbsp;».</li>
<li style="${G.LI}"><strong>La colonne «&nbsp;Avant&nbsp;» désigne une difficulté de
tâche.</strong> Avant tout plan comportemental, on modifie la tâche&nbsp;: on la
raccourcit, on la découpe, on change le matériel. Voir «&nbsp;Décomposer une routine en
étapes&nbsp;».</li>
<li style="${G.LI}"><strong>La colonne «&nbsp;Avant&nbsp;» désigne l’imprévu.</strong>
Le travail porte alors sur la prévisibilité&nbsp;: annoncer, rendre le temps visible,
préparer les changements. Voir «&nbsp;Rendre l’environnement prévisible&nbsp;».</li>
<li style="${G.LI}"><strong>Rien ne se dégage, ou le motif est horaire et récent.</strong>
On ne s’acharne pas&nbsp;: on demande un avis médical et on refait une semaine après.</li>
</ul>
</div>

<h3 style="${G.H3}">4. Transmettre sans figer</h3>
<p>Le moment où l’hypothèse quitte votre feuille est le plus délicat du parcours. Une
hypothèse mal transmise devient une étiquette, et une étiquette suit une personne bien
plus longtemps qu’un relevé.</p>
<ul style="${G.UL}">
<li style="${G.LI}"><strong>Dites «&nbsp;je fais l’hypothèse&nbsp;», jamais «&nbsp;il
fait ça pour&nbsp;».</strong> La première formule invite à discuter, la seconde ferme
le sujet.</li>
<li style="${G.LI}"><strong>Donnez les nombres avant la conclusion.</strong>
«&nbsp;Sept fois sur neuf&nbsp;» se discute&nbsp;; «&nbsp;il cherche à
échapper&nbsp;» s’adopte ou se rejette en bloc.</li>
<li style="${G.LI}"><strong>Nommez ce qui vous ferait changer d’avis.</strong> C’est
ce qui distingue une hypothèse d’un jugement, et c’est ce qui vous protège si elle se
révèle fausse.</li>
<li style="${G.LI}"><strong>Ne mettez pas le relevé brut au dossier.</strong> Ce qui
va au dossier, c’est la synthèse validée en équipe — pas les notes de terrain.</li>
</ul>

${G.alerte(
  'Quand arrêter et passer la main',
  `<p>Quatre signaux, et aucun n’est négociable&nbsp;:</p>
<ul style="${G.UL}">
<li style="${G.LI}">le comportement blesse la personne ou quelqu’un d’autre&nbsp;;</li>
<li style="${G.LI}">il est apparu brutalement chez quelqu’un qui n’en avait pas&nbsp;;</li>
<li style="${G.LI}">il s’accompagne d’un changement de sommeil, d’appétit ou d’humeur&nbsp;;</li>
<li style="${G.LI}">vous vous sentez seul avec, ou en colère contre la personne.</li>
</ul>
<p style="margin-bottom:0">Dans ces quatre cas, l’analyse fonctionnelle n’est pas la
bonne première étape. Un avis médical, une reprise en équipe ou une supervision le sont.
Savoir s’arrêter fait partie de la compétence.</p>`,
)}`,
  aRetenir:
    'Au bout d’une semaine, vous n’aurez pas «&nbsp;la&nbsp;» réponse — vous aurez une hypothèse chiffrée, ce qui est infiniment plus solide qu’une certitude sans relevé. Et vous saurez laquelle des quatre suites engager.',
  exercice: {
    nom: 'La lecture du septième jour',
    duree: '10 minutes, une seule fois',
    quoi:
      'Cet exercice se fait le relevé sous les yeux. Ne le faites pas de mémoire : ce que vous vous rappelez d’une semaine et ce que la feuille dit divergent presque toujours.',
    etapes: [
      'Comptez les lignes et les jours. Écrivez les deux nombres.',
      'Comptez la colonne « Après » par catégorie : attention / échappée / objet / rien. Quatre nombres.',
      'Entourez ce qui revient dans la colonne « Avant » — un mot, pas une phrase.',
      'Écrivez votre hypothèse en trois phrases : le relevé, la proportion, la proposition.',
      'Choisissez UNE des quatre conclusions du point 3, et écrivez la date à laquelle vous vérifierez si elle tenait.',
    ],
    reussi:
      'vous avez six nombres écrits, une hypothèse en trois phrases, une conclusion entourée et une date de vérification. Si un seul de ces éléments manque, l’exercice n’est pas terminé.',
  },
  carnet: {
    intro:
      'Ce sont les dernières lignes du carnet. Elles constituent, telles quelles, ce que vous pouvez présenter en réunion.',
    lignes: [
      '<strong>Le relevé chiffré</strong> — nombre de lignes, nombre de jours, comptage de la colonne « Après ».',
      '<strong>L’hypothèse en trois phrases</strong> — relevé, proportion, proposition.',
      '<strong>La conclusion choisie</strong> — une des quatre, et pourquoi celle-là.',
      '<strong>La date de vérification</strong> — quand je regarde si ça tenait.',
      '<strong>Ce qui me ferait changer d’avis</strong> — repris du module 1, corrigé s’il le faut.',
    ],
  },
  vigilance: [
    '<strong>Une semaine ne suffit pas à conclure sur un comportement rare.</strong> Deux ou trois occurrences ne font pas un motif&nbsp;: prolongez plutôt que de conclure.',
    '<strong>Méfiez-vous du soulagement.</strong> Trouver une fonction est agréable, et l’envie de s’y tenir malgré des lignes qui la contredisent est réelle. Comptez avant de conclure, pas l’inverse.',
    '<strong>Le relevé ne remplace pas la parole de la personne.</strong> Si elle peut dire ce qui la gêne, sa réponse prime sur votre comptage.',
    '<strong>Cette formation ne pose aucun diagnostic.</strong> Elle ne dit rien de l’autisme, du TDAH ni d’aucun trouble&nbsp;: elle décrit un mécanisme valable pour tout le monde.',
  ],
  annexes:
    'la <strong>fiche de lecture du septième jour</strong>, le <strong>modèle d’hypothèse en trois phrases</strong> à recopier, et un <strong>arbre de décision</strong> qui relie chaque conclusion à la formation suivante du catalogue.',
  avant: [
    'J’ai un relevé d’au moins cinq lignes et je l’ai compté, pas seulement relu.',
    'Mon hypothèse tient en trois phrases et contient un nombre et une proportion.',
    'J’ai choisi une des quatre conclusions et fixé la date à laquelle je vérifierai qu’elle tenait.',
  ],
};

module.exports = {
  slug: 'les-quatre-fonctions-d-un-comportement',
  uuid: '2e3b3107-9939-4860-8239-f22e595bb718',
  modules: [
    { titre: 'Module 1 — La théorie : forme, fonction, et les quatre moteurs', minutes: 12, html: G.assembler(M1) },
    { titre: 'Module 2 — Une situation qui dérape, et pourquoi', minutes: 10, html: G.assembler(M2) },
    { titre: 'Module 3 — Exercice guidé : la grille en quatre colonnes', minutes: 12, html: G.assembler(M3) },
    { titre: 'Module 4 — Mise en pratique et auto-observation', minutes: 12, html: G.assembler(M4) },
  ],
};
