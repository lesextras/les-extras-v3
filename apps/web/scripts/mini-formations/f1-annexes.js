/**
 * ANNEXES — Les quatre fonctions d'un comportement.
 *
 * Quatre fiches, une par module, plus deux relevés corrigés. Tout est écrit en
 * clair : ces grilles se recopient à la main sur une feuille, c'est la seule
 * forme qui survit à une journée de travail.
 */

const G = require('./gabarit-v3.js');
const A = require('./annexes.js');

const FICHE_1 = A.fiche({
  numero: 1,
  titre: 'Les quatre fonctions, et l’indice qui les distingue',
  quand:
    'vous avez un comportement en tête et vous ne savez pas par quel bout le prendre.',
  contenu:
    A.tableau(
      ['Fonction', 'Ce que le comportement obtient', 'L’indice qui la signale', 'Le piège'],
      [
        [
          '<strong>Attention</strong>',
          'Quelqu’un vient, parle, regarde, touche.',
          'Survient quand l’adulte est occupé ailleurs&nbsp;; cesse dès qu’il arrive.',
          'Une réprimande est de l’attention. Gronder peut renforcer.',
        ],
        [
          '<strong>Échappement</strong>',
          'Une demande, une tâche, un lieu ou un bruit disparaît.',
          'Survient <em>après</em> la consigne&nbsp;; cesse quand la demande est retirée.',
          'On lit de l’opposition là où il y a une fuite — souvent une tâche trop dure.',
        ],
        [
          '<strong>Objet ou activité</strong>',
          'Quelque chose de concret apparaît.',
          'Survient quand l’objet est visible mais inaccessible, ou vient d’être retiré.',
          'Céder une fois sur dix suffit à installer durablement le comportement.',
        ],
        [
          '<strong>Sensation</strong>',
          'Une sensation agréable, ou une sensation désagréable qui baisse.',
          'Continue quand la personne est seule&nbsp;; indépendant de ce que vous faites.',
          'Ce n’est pas un problème par défaut. On n’intervient que si ça blesse ou isole.',
        ],
      ],
    ) +
    `<p><strong>Deux fonctions à la fois, c’est fréquent.</strong> Si votre relevé ne
tranche pas, séparez-le en deux moments (matin / après-midi, ou selon la personne
présente) et relisez chaque moitié séparément.</p>`,
});

const FICHE_2 = A.fiche({
  numero: 2,
  titre: 'Décrire sans juger — les mots à bannir et par quoi les remplacer',
  quand:
    'vous écrivez une observation, une transmission, un rapport — donc à peu près tous les jours.',
  contenu:
    A.tableau(
      ['Ce qu’on écrit spontanément', 'Pourquoi ça ne va pas', 'Ce qui se compte'],
      [
        [
          'Il était agressif',
          'Adjectif d’interprétation, non observable, non comptable.',
          'Il a poussé la table des deux mains et crié environ trente secondes.',
        ],
        [
          'Elle a fait un caprice',
          'Prête une intention, ferme l’analyse.',
          'Elle s’est allongée au sol et a refusé de se lever pendant quatre minutes.',
        ],
        [
          'Il est opposant',
          'Décrit une personne, pas un moment. Devient une étiquette.',
          'À trois demandes sur cinq ce matin, il n’a pas répondu dans les dix secondes.',
        ],
        [
          'Il fait ça exprès pour m’embêter',
          'Aucune des quatre fonctions ne suppose une intention hostile.',
          'Le comportement survient quand je suis occupé avec un autre jeune.',
        ],
        [
          'Souvent, régulièrement, tout le temps',
          'Impossible à comparer d’une semaine à l’autre.',
          'Quatre fois entre 8&nbsp;h et 9&nbsp;h, lundi, mardi et jeudi.',
        ],
        [
          'Ça s’est bien passé / on a géré',
          'La colonne « Après » devient inutilisable.',
          'Je me suis assis à côté de lui et la consigne a été reportée à 14&nbsp;h.',
        ],
      ],
    ) +
    `<p><strong>Le test&nbsp;:</strong> votre phrase pourrait-elle être filmée&nbsp;? Si
une caméra ne peut pas l’enregistrer, ce n’est pas une observation.</p>`,
});

const FICHE_3 = A.fiche({
  numero: 3,
  titre: 'La grille en quatre colonnes — à recopier sur une feuille',
  quand: 'au début de votre semaine d’observation, une fois pour toutes.',
  contenu:
    `<p><strong>En haut de la feuille, écrivez une seule fois&nbsp;:</strong></p>
<div style="${G.GRIS}">
<p style="margin:0">Comportement observé&nbsp;: ……………………………………………………………………………</p>
<p style="margin:8px 0 0">Fenêtre d’observation&nbsp;: de …… h …… à …… h …… &nbsp;·&nbsp; du …… au ……</p>
<p style="margin:8px 0 0">Initiales de la personne&nbsp;: …… <em>(pas de nom complet, pas de date de naissance)</em></p>
</div>` +
    A.tableau(
      ['Quand', 'Avant<br><span style="font-weight:400;font-size:13px">(les 2 minutes précédentes)</span>', 'Comportement<br><span style="font-weight:400;font-size:13px">(ce qu’une caméra verrait)</span>', 'Après<br><span style="font-weight:400;font-size:13px">(les 10 secondes suivantes)</span>'],
      [
        ['……h……', '', '', ''],
        ['……h……', '', '', ''],
        ['……h……', '', '', ''],
        ['……h……', '', '', ''],
        ['……h……', '', '', ''],
        ['……h……', '', '', ''],
        ['……h……', '', '', ''],
        ['……h……', '', '', ''],
      ],
    ) +
    `<p><strong>Version poche</strong>, si vous ne pouvez pas sortir une feuille A4&nbsp;:
une ligne par occurrence, quatre éléments séparés par des barres obliques —
<em>«&nbsp;11h40 / demande de venir à table / pousse la table + crie 30 s / consigne
reportée&nbsp;»</em>. C’est suffisant.</p>
<p><strong>Un jour sans occurrence se note</strong> «&nbsp;rien&nbsp;». Une case vide ne
veut rien dire&nbsp;: on ne sait pas si le comportement n’a pas eu lieu ou si personne
n’a relevé.</p>`,
});

const FICHE_4 = A.fiche({
  numero: 4,
  titre: 'La feuille de comptage du septième jour',
  quand: 'le relevé sous les yeux, à la fin de la semaine.',
  contenu:
    `<p>Ne relisez pas votre relevé&nbsp;: comptez-le. C’est le geste que ce parcours
essaie d’installer, et c’est celui qui transforme une impression en argument.</p>` +
    A.tableau(
      ['Ce que je compte', 'Nombre'],
      [
        ['Lignes relevées au total', '………'],
        ['Jours couverts', '………'],
        ['Lignes où le comportement a obtenu de l’<strong>attention</strong>', '………'],
        ['Lignes où une demande a été <strong>retirée ou reportée</strong>', '………'],
        ['Lignes où un <strong>objet ou une activité</strong> a été obtenu', '………'],
        ['Lignes où <strong>rien</strong> n’est venu de l’entourage', '………'],
        ['Heure qui revient le plus souvent', '……h……'],
        ['Mot qui revient le plus souvent dans la colonne « Avant »', '………'],
      ],
    ) +
    `<h4 style="margin:26px 0 8px">Mon hypothèse, en trois phrases</h4>
<div style="${G.GRIS}">
<p style="margin:0">Sur ……… observations entre le ……… et le ………, dans la fenêtre
………, [la personne] ……………………………………………………… .</p>
<p style="margin:10px 0 0">……… fois sur ………, ………………………………………………………… dans les
secondes qui ont suivi.</p>
<p style="margin:10px 0 0">Je fais l’hypothèse d’une fonction de ……………………………, et je
propose ………………………………………………………… .</p>
</div>
<p><strong>Trois éléments obligatoires&nbsp;:</strong> un nombre, une proportion, une
proposition. Sans le nombre, c’est une impression&nbsp;; sans la proposition, c’est un
constat qui ne mène nulle part.</p>`,
});

const FICHE_5 = A.fiche({
  numero: 5,
  titre: 'Deux relevés corrigés — l’un exploitable, l’autre non',
  quand: 'vous doutez de la qualité du vôtre.',
  contenu:
    `<h4 style="margin:26px 0 8px">Relevé A — inexploitable, et pourtant il a demandé du travail</h4>` +
    A.tableau(
      ['Quand', 'Avant', 'Comportement', 'Après'],
      [
        ['Lundi', 'Il était fatigué', 'Énervé', 'On a géré'],
        ['Mardi', 'Ambiance tendue', 'Agressif', 'Ça s’est calmé'],
        ['Jeudi', 'Comme d’habitude', 'Crise', 'Rien de spécial'],
      ],
    ) +
    `<p><strong>Pourquoi il ne sert à rien&nbsp;:</strong> pas une seule ligne n’est
comptable. «&nbsp;Fatigué&nbsp;» est une hypothèse, pas une observation&nbsp;;
«&nbsp;énervé&nbsp;» et «&nbsp;agressif&nbsp;» sont des jugements&nbsp;; «&nbsp;on a
géré&nbsp;» ne dit ni qui, ni quoi. Une semaine de travail, zéro information.</p>

<h4 style="margin:34px 0 8px">Relevé B — cinq lignes, et la fonction saute aux yeux</h4>` +
    A.tableau(
      ['Quand', 'Avant', 'Comportement', 'Après'],
      [
        ['Lun 11h38', 'Consigne : « on range et on va à table »', 'Pousse la table, crie ~30 s', 'Consigne reportée, il reste au jeu'],
        ['Lun 11h52', 'Deuxième consigne pour la table', 'Se jette au sol, crie ~1 min', 'Emmené au calme, ne mange pas'],
        ['Mar 11h41', 'Consigne : « on va à table »', 'Pousse la table, crie ~20 s', 'On attend, il vient 10 min plus tard'],
        ['Jeu 11h35', 'Consigne : « on va à table »', 'Crie ~15 s', 'Consigne reportée'],
        ['Ven 11h40', 'Consigne : « on va à table »', 'Pousse la table, crie ~25 s', 'Consigne reportée'],
      ],
    ) +
    `<p><strong>Ce qu’il dit&nbsp;:</strong> cinq lignes, cinq fois la même consigne dans
la colonne «&nbsp;Avant&nbsp;», et quatre fois sur cinq une demande retirée ou reportée
dans la colonne «&nbsp;Après&nbsp;». Fonction&nbsp;: <em>échappement à l’installation à
table</em>. On remarque aussi que le comportement apparaît <strong>de plus en plus
tôt</strong> par rapport à la consigne — la signature d’un comportement renforcé.</p>
<p><strong>Et ce qu’il ne dit pas&nbsp;:</strong> pourquoi la table pose problème. Bruit
du groupe&nbsp;? Odeur&nbsp;? Voisin de table&nbsp;? Faim absente à cette heure&nbsp;? Le
relevé ouvre la question, il ne la referme pas. C’est exactement ce qu’on attend de lui.</p>`,
});

const FICHE_6 = A.fiche({
  numero: 6,
  titre: 'Arbre de décision — et après ?',
  quand: 'vous avez votre hypothèse et vous vous demandez quoi faire de la semaine suivante.',
  contenu:
    A.tableau(
      ['Ce que dit votre relevé', 'La suite', 'Où continuer'],
      [
        [
          'Une fonction se dégage nettement (plus de la moitié des lignes)',
          'Enseigner un comportement qui obtient la même chose, plus vite et moins cher.',
          '«&nbsp;Apprendre à demander plutôt qu’à crier&nbsp;»',
        ],
        [
          'La colonne « Avant » contient toujours la même tâche difficile',
          'Modifier la tâche AVANT tout plan comportemental&nbsp;: la découper, la raccourcir, changer le matériel.',
          '«&nbsp;Décomposer une routine en étapes&nbsp;»',
        ],
        [
          'La colonne « Avant » contient un imprévu, un changement, une transition',
          'Travailler la prévisibilité&nbsp;: annoncer, rendre le temps visible, préparer les changements.',
          '«&nbsp;Rendre l’environnement prévisible&nbsp;»',
        ],
        [
          'La personne « n’y arrive que si quelqu’un est à côté »',
          'Doser l’aide et la retirer selon un plan décidé à l’avance.',
          '«&nbsp;Guider puis s’effacer&nbsp;»',
        ],
        [
          'Rien ne se dégage, ou le motif est horaire et récent',
          'Demander un avis médical, puis refaire une semaine d’observation.',
          'Aucune formation&nbsp;: un professionnel de santé.',
        ],
      ],
    ) +
    `<div style="${G.ALERTE}">
<h3 style="margin-top:0;color:#8a3a2e">Les quatre situations où l’on s’arrête</h3>
<ul style="${G.UL}">
<li style="${G.LI}">le comportement blesse la personne ou quelqu’un d’autre&nbsp;;</li>
<li style="${G.LI}">il est apparu brutalement chez quelqu’un qui n’en avait pas&nbsp;;</li>
<li style="${G.LI}">il s’accompagne d’un changement de sommeil, d’appétit ou d’humeur&nbsp;;</li>
<li style="${G.LI}">vous vous sentez seul avec, ou en colère contre la personne.</li>
</ul>
<p style="margin-bottom:0">Dans ces quatre cas, l’analyse fonctionnelle n’est pas la
bonne première étape. Savoir s’arrêter et passer la main fait partie de la compétence.</p>
</div>`,
});

const FICHE_7 = A.fiche({
  numero: 7,
  titre: 'La trame « scène qui dérape » — à remplir',
  quand: 'à chaque fois qu’une situation s’est mal terminée et que vous voulez comprendre.',
  contenu: `<div style="${G.GRIS}">
<p style="margin:0"><strong>1. La scène</strong>, au présent, dix à quinze lignes. Interdit&nbsp;:
«&nbsp;énervé&nbsp;», «&nbsp;provocateur&nbsp;», «&nbsp;caprice&nbsp;», «&nbsp;exprès&nbsp;»,
«&nbsp;agressif&nbsp;», «&nbsp;crise&nbsp;».</p>
<p style="margin:14px 0 0">………………………………………………………………………………………………………………<br>
………………………………………………………………………………………………………………<br>
………………………………………………………………………………………………………………</p>
<p style="margin:14px 0 0"><strong>2. Ce qui s’est passé dans les dix secondes suivantes</strong>
— une phrase, soulignée&nbsp;:<br>………………………………………………………………………………………</p>
<p style="margin:14px 0 0"><strong>3. La courbe</strong>&nbsp;: par rapport à il y a un mois, ce
comportement arrive <em>plus tôt · pareil · plus tard</em>.</p>
<p style="margin:14px 0 0"><strong>4. Ce que j’écarte</strong>&nbsp;: douleur récente&nbsp;?
traitement modifié&nbsp;? tâche devenue plus dure&nbsp;? ………………………………………</p>
<p style="margin:14px 0 0"><strong>5. Deux décisions «&nbsp;avant&nbsp;»</strong> — qui portent
sur la tâche, l’environnement ou une possibilité offerte, jamais sur «&nbsp;mieux réagir&nbsp;»&nbsp;:<br>
a. ………………………………………………………………………………………<br>
b. ………………………………………………………………………………………</p>
</div>`,
});

const FICHE_8 = A.fiche({
  numero: 8,
  titre: 'La scène de Yanis, corrigée ligne à ligne',
  quand: 'après avoir fait la vôtre. Comparez, ne recopiez pas.',
  contenu:
    A.tableau(
      ['Ce que dit la scène', 'Ce qu’on en tire', 'Ce que ça ne prouve pas'],
      [
        [
          '« Yanis prend l’économe, le repose, se lève et va à la fenêtre. »',
          'Le comportement arrive <em>après</em> la consigne. La colonne « Avant » contient une demande.',
          'Rien sur la fonction encore&nbsp;: beaucoup de comportements suivent une consigne.',
        ],
        [
          '« Elle répète, plus fort. Il tape sur le rebord. »',
          'La pression monte&nbsp;: la valeur de l’échappée augmente en même temps.',
          'Que le bruit soit dirigé contre l’adulte. Rien ne le dit.',
        ],
        [
          '« Tu sors, tu reviendras quand tu seras calme. » Yanis sort.',
          '<strong>La tâche a disparu, complètement et immédiatement.</strong> C’est la ligne décisive de la colonne « Après ».',
          'Que ce soit la seule conséquence&nbsp;: il a aussi reçu trois échanges et l’attention du groupe.',
        ],
        [
          '« Il reste dans le couloir quinze minutes, puis revient. »',
          'Il s’apaise seul, sans adulte. Cela <em>pèse contre</em> l’attention comme fonction principale.',
          'Que l’attention n’y soit pour rien&nbsp;: il en a reçu beaucoup <em>avant</em> de sortir.',
        ],
        [
          '« Quatre minutes, puis deux. »',
          'La courbe raccourcit régulièrement&nbsp;: indice fort d’un comportement renforcé.',
          'Une preuve&nbsp;: une douleur, un traitement ou une tâche devenue plus dure feraient la même courbe.',
        ],
      ],
    ) +
    `<div style="${G.GRIS}">
<p style="margin-top:0"><strong>L’hypothèse, telle qu’elle s’écrit&nbsp;:</strong></p>
<p style="margin-bottom:0"><em>«&nbsp;Sur trois séances d’atelier cuisine entre le 3 et le
17 mars, Yanis quitte la table et tape sur le rebord de la fenêtre après la consigne
d’épluchage. Trois fois sur trois, l’épluchage n’a pas eu lieu. Je fais l’hypothèse d’une
fonction d’échappement à cette tâche précise, et je propose d’en discuter en réunion du 20.
Ce qui me ferait changer d’avis&nbsp;: qu’il refuse aussi des tâches faciles qu’il aime, ou
qu’un examen dentaire ou visuel explique la difficulté motrice.&nbsp;»</em></p>
</div>
<p><strong>Ce que l’équipe n’a pas fait, et qui aurait tout changé&nbsp;:</strong> personne
n’a demandé à Yanis ce qui coinçait. Il a onze ans et il parle. Aucune analyse
fonctionnelle ne remplace la question posée à la personne concernée.</p>`,
});

const HTML =
  A.entete('Les quatre fonctions d’un comportement') +
  FICHE_1 +
  FICHE_2 +
  FICHE_3 +
  FICHE_4 +
  FICHE_5 +
  FICHE_6 +
  FICHE_7 +
  FICHE_8 +
  A.pied();

module.exports = { HTML };
