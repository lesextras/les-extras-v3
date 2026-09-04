/**
 * QUIZ — Guider puis s'effacer.
 * Un bloc par module, dans l'ordre. Chaque question est ancrée dans le module
 * correspondant : aucune notion qui n'y est pas enseignée.
 */
module.exports = [
  /* ── MODULE 1 — L’échelle des aides, et le délai qu’on ne laisse jamais ── */
  {
    questions: [
      {
        enonce:
          '8&nbsp;h&nbsp;02, consigne «&nbsp;tu te brosses les dents&nbsp;». Silence, cinq secondes comptées, rien. Vous regardez la brosse <em>(1)</em>, rien. Vous la montrez du doigt <em>(2)</em>, rien. Vous posez la main sur son coude et amorcez le geste <em>(6)</em>. Quel niveau notez-vous pour cette séance&nbsp;?',
        options: [
          'Le niveau&nbsp;1, parce que c’est par là que vous avez commencé.',
          'La moyenne des trois niveaux utilisés, soit 3.',
          'Le niveau&nbsp;6, parce qu’on note le niveau le plus lourd de la séance.',
          'Le niveau&nbsp;2, parce que c’est celui qui a duré le plus longtemps.',
        ],
        bonne: 2,
        pourquoi:
          'On cote une séance, pas un geste, et la règle est simple&nbsp;: on note le niveau le plus lourd utilisé. Une séance qui commence par un regard et finit par une main sur le coude se note 6, jamais 1. Noter le premier niveau ou une moyenne fabriquerait un relevé optimiste, c’est-à-dire un relevé qui ne sert à rien&nbsp;: c’est exactement l’écart de deux crans que l’exercice du module cherche à mettre au jour.',
      },
      {
        enonce:
          'La règle du module dit&nbsp;: on utilise le niveau le plus bas qui débloque, pas celui qui marche à coup sûr. Pourquoi&nbsp;?',
        options: [
          'Parce qu’une aide lourde est interdite dans les établissements.',
          'Parce qu’une aide légère se remarque moins par les collègues.',
          'Parce que la personne se sentirait humiliée par une aide lourde.',
          'Parce que c’est le coût du retrait, et non l’efficacité immédiate, qui doit décider.',
        ],
        bonne: 3,
        pourquoi:
          'Toutes les aides ne coûtent pas la même chose à retirer&nbsp;: on s’éloigne d’un indice de position en un jour, on sort d’une guidance physique en plusieurs mois. Une aide de niveau&nbsp;6 donnée «&nbsp;pour gagner du temps&nbsp;» se paie ensuite pendant des semaines. Aucune aide n’est interdite et aucune n’est humiliante en soi&nbsp;: ce qui se décide, c’est ce qu’on aura à défaire.',
      },
      {
        enonce:
          'Vous accompagnez une compétence entièrement nouvelle, sur laquelle des échecs répétés ont déjà installé un évitement&nbsp;: la personne n’y arrive jamais seule, même parfois. Par quelle extrémité de l’échelle commencez-vous&nbsp;?',
        options: [
          'Par le plus léger, en remontant seulement si ça bloque.',
          'Par le niveau qui fait réussir dès le premier essai, puis on redescend cran par cran.',
          'Par le milieu de l’échelle, pour ne pas trancher.',
          'Par le niveau le plus léger, mais en allongeant le délai à quinze secondes.',
        ],
        bonne: 1,
        pourquoi:
          'Le choix se pose en une question&nbsp;: est-ce que ça réussit parfois tout seul aujourd’hui&nbsp;? Si oui, on part du plus léger. Si non — compétence neuve, ou évitement déjà installé — on part d’une aide franchement suffisante pour que ça réussisse au premier essai, puis on la retire cran par cran&nbsp;: c’est l’apprentissage sans erreur. Partir du plus léger ici, ou allonger le délai, ne produirait qu’un échec de plus sur une tâche déjà évitée. Dans les deux cas, la suite est la même&nbsp;: un plan de retrait écrit à l’avance.',
      },
      {
        enonce:
          'Vous êtes persuadé d’attendre cinq secondes avant d’aider. Vous les comptez pour de bon pendant une semaine&nbsp;: vous aidez au bout d’une seconde et demie. Que faut-il en conclure&nbsp;?',
        options: [
          'Rien d’anormal&nbsp;: cinq secondes ressenties valent environ deux secondes réelles, et c’est ce que découvre la plupart des professionnels la première semaine.',
          'Que vous avez commis une faute professionnelle qu’il faut signaler.',
          'Qu’il faut passer à dix secondes de silence pour compenser.',
          'Que l’estimation vaut la mesure dès qu’on a de l’expérience.',
        ],
        bonne: 0,
        pourquoi:
          'C’est la découverte ordinaire de la première semaine, et c’est la raison pour laquelle le module demande de compter — une-mille, deux-mille — plutôt que de ressentir. L’enjeu n’est pas la faute&nbsp;: c’est que l’aide donnée à la deuxième seconde arrive avant que la personne ait eu le temps de chercher, et que répétée cent fois elle enseigne l’inverse de ce qu’on croit, <em>ne cherche pas, quelqu’un va faire</em>. Doubler le silence n’est pas demandé, tenir cinq secondes réelles l’est.',
      },
      {
        enonce:
          'Qu’est-ce qui distingue une aide qui enseigne d’une aide qui remplace la personne&nbsp;?',
        options: [
          'La légèreté du geste&nbsp;: en dessous du niveau&nbsp;3, une aide enseigne toujours.',
          'L’accord de la personne au moment où on l’aide.',
          'Un plan de retrait écrit&nbsp;: sans lui, l’aide sert à faire avancer la journée, pas à apprendre.',
          'Le temps qu’on y consacre chaque jour.',
        ],
        bonne: 2,
        pourquoi:
          'Les deux aides sont légitimes&nbsp;: il y a des matins où l’on habille quelqu’un parce qu’il faut partir, et c’est très bien. Ce qui pose problème, c’est de croire qu’on enseigne alors qu’on remplace, et la différence tient à une seule chose — une date de retrait décidée à l’avance et écrite. Un geste léger sans plan reste une aide qui remplace&nbsp;; le temps passé et l’accord de la personne ne disent rien du retrait.',
      },
    ],
  },

  /* ── MODULE 2 — Une aide qui n’a jamais été retirée ────────────────────── */
  {
    questions: [
      {
        enonce:
          'Inès, 8&nbsp;ans, CE1. En septembre l’AESH ouvre le cartable avec elle&nbsp;; en octobre elle pose la main sur son bras et dit «&nbsp;on sort le cahier&nbsp;»&nbsp;; de janvier à mars, même geste, même phrase. À quel moment l’aide a-t-elle cessé d’enseigner&nbsp;?',
        options: [
          'En septembre, parce que l’AESH faisait la tâche à sa place.',
          'En octobre, au moment précis où elle s’est mise à fonctionner parfaitement et n’a plus bougé.',
          'En mars, quand l’AESH s’est absentée trois jours.',
          'En juin, quand le bilan a été écrit.',
        ],
        bonne: 1,
        pourquoi:
          'Tant que l’aide progressait — de l’ouverture du cartable à la main sur le bras — elle enseignait. À partir du moment où elle est restée identique cinq mois, elle est devenue une partie de la tâche. Septembre n’était pas une faute mais un point de départ&nbsp;; mars n’a rien créé, il a seulement rendu visible ce qui était installé depuis l’automne&nbsp;; et juin ne fait qu’écrire le résultat.',
      },
      {
        enonce: 'Qu’est-ce qu’Inès a réellement appris entre octobre et mars&nbsp;?',
        options: [
          'Rien&nbsp;: elle a stagné cinq mois.',
          'Qu’elle n’est pas capable de préparer son matériel.',
          '«&nbsp;On sort le cahier quand une main se pose sur mon bras&nbsp;»&nbsp;: elle a très bien appris, mais la mauvaise séquence.',
          'À se passer de l’adulte, ce que l’absence de mars a interrompu.',
        ],
        bonne: 2,
        pourquoi:
          'Elle a parfaitement appris&nbsp;: son déclencheur n’est simplement pas le début du cours, c’est le contact. Enlevez le contact, il ne reste rien — et c’est logique, personne ne lui a jamais enseigné à démarrer sans lui. Parler de stagnation ou d’incapacité déplace sur elle ce que le dispositif lui a enseigné.',
      },
      {
        enonce:
          'Vous relisez le bilan de juin&nbsp;: «&nbsp;Inès reste dépendante de l’adulte.&nbsp;» Que faut-il en penser&nbsp;?',
        options: [
          'C’est un constat exact, puisqu’elle n’a rien sorti pendant l’absence de l’AESH.',
          'C’est une maladresse d’écriture, sans réelle conséquence.',
          'C’est acceptable dès lors que toute l’équipe partage cette lecture.',
          'C’est faux et coûteux&nbsp;: la phrase décrit un trait d’Inès là où il faudrait décrire le dispositif.',
        ],
        bonne: 3,
        pourquoi:
          'La formulation juste serait&nbsp;: «&nbsp;l’aide mise en place en septembre n’a pas été estompée&nbsp;; la séquence enseignée comporte l’aide de l’adulte.&nbsp;» La première phrase suit Inès d’un dossier à l’autre pendant des années&nbsp;; la seconde décrit un dispositif, et un dispositif se corrige. Ce n’est donc ni exact ni sans conséquence, et l’accord de l’équipe ne rend pas vraie une phrase qui attribue à l’enfant ce que l’organisation lui a enseigné.',
      },
      {
        enonce:
          'En réunion, quelle question permet de savoir si une aide enseigne encore&nbsp;?',
        options: [
          '«&nbsp;Est-ce que ça marche&nbsp;?&nbsp;»',
          '«&nbsp;À quel niveau aidions-nous il y a trois mois, et à quel niveau aujourd’hui&nbsp;?&nbsp;»',
          '«&nbsp;Est-ce que la personne est motivée en ce moment&nbsp;?&nbsp;»',
          '«&nbsp;Qui s’en occupe habituellement&nbsp;?&nbsp;»',
        ],
        bonne: 1,
        pourquoi:
          'Le signal d’alerte, c’est la stabilité&nbsp;: une aide qui n’a pas changé depuis trois mois a cessé d’enseigner, même si tout se passe bien — surtout si tout se passe bien. «&nbsp;Est-ce que ça marche&nbsp;?&nbsp;» reçoit toujours «&nbsp;oui&nbsp;» dans ce cas de figure, et c’est précisément ce qui endort. La motivation et l’identité de l’accompagnant ne mesurent rien&nbsp;: seuls deux niveaux datés le font.',
      },
      {
        enonce:
          'Vous reconnaissez votre situation dans celle d’Inès&nbsp;: l’aide n’a pas bougé depuis six mois et vous voulez rattraper le retard. Que faites-vous&nbsp;?',
        options: [
          'Un seul cran de moins, tenu une semaine, et annoncé à la personne avant.',
          'Deux crans d’un coup, puisqu’il y a du retard.',
          'Le retrait complet de l’aide pendant trois jours, pour voir ce qu’elle sait faire.',
          'Rien avant la prochaine réunion de projet personnalisé.',
        ],
        bonne: 0,
        pourquoi:
          'Un cran, jamais deux&nbsp;: deux crans produisent un échec, et l’échec répété produit de l’évitement, c’est-à-dire exactement ce qu’on cherchait à éviter. Le retrait total sans plan n’est pas un test mais une rupture. Et attendre la réunion, c’est reproduire ce qui a fait la situation d’Inès&nbsp;: mesurez le niveau actuel sans chercher à le justifier, annoncez le changement, et attendez-vous à une baisse temporaire de quelques jours, qui est normale.',
      },
    ],
  },

  /* ── MODULE 3 — Le plan d’estompage en quatre lignes ───────────────────── */
  {
    questions: [
      {
        enonce: 'Parmi ces quatre critères de passage, lequel est le meilleur&nbsp;?',
        options: [
          '«&nbsp;Quand il sera prêt.&nbsp;»',
          '«&nbsp;Réussi trois fois de suite à ce niveau.&nbsp;»',
          '«&nbsp;Réussi deux jours de suite avec deux adultes différents.&nbsp;»',
          '«&nbsp;Quand on sentira que c’est le moment.&nbsp;»',
        ],
        bonne: 2,
        pourquoi:
          'Les trois fois de suite forment le critère standard, simple et parfaitement utilisable&nbsp;; mais le troisième vérifie en plus que l’apprentissage n’est pas attaché à une personne, ce qui est précisément le risque de ce parcours. À la maison, il se traduit par deux moments différents de la journée ou deux jours non consécutifs&nbsp;: ce n’est pas la personne qui change, c’est le contexte. Les deux formulations restantes ne sont vérifiables par personne et se déplacent toujours dans le même sens, celui de la fatigue de l’adulte.',
      },
      {
        enonce:
          'Vous avez descendu d’un cran lundi. Mercredi et jeudi, la personne rate — deux fois de suite. Que dit le plan écrit à l’avance&nbsp;?',
        options: [
          'On laisse passer, on aide au niveau du jour, on ne commente pas.',
          'On suspend le plan et on en reparle en réunion.',
          'On remonte durablement d’un cran et on coupe le cran suivant en deux.',
          'On remonte d’un cran pour la séance, sans remettre le plan en cause.',
        ],
        bonne: 3,
        pourquoi:
          'Les trois lignes se décident avant&nbsp;: une fois, on laisse passer&nbsp;; deux fois de suite, on remonte d’un cran pour la séance&nbsp;; trois fois de suite, on remonte durablement, on note la date et on coupe le cran suivant en deux. Répondre par le premier ou le troisième palier, c’est décider sur le moment — et un critère décidé sur le moment se déplace vers le confort de l’adulte. Suspendre le plan à la première difficulté revient à ne jamais commencer le retrait.',
      },
      {
        enonce:
          'Un collègue remplaçant arrive un samedi et lit sur la fiche&nbsp;: «&nbsp;Niveau&nbsp;2.&nbsp;» Où est le problème&nbsp;?',
        options: [
          'Il n’y en a pas&nbsp;: le numéro est le langage commun du plan.',
          '«&nbsp;Niveau&nbsp;2&nbsp;» ne lui dit rien&nbsp;; il faut écrire ce que l’aide est concrètement, «&nbsp;on montre du doigt, on ne touche pas&nbsp;».',
          'Il faudrait lui interdire d’aider tant qu’il ne connaît pas le plan.',
          'Il faut attendre le lundi pour reprendre le plan là où il en était.',
        ],
        bonne: 1,
        pourquoi:
          'Un plan qui ne vit que dans votre tête — ou dans un numéro — produit exactement la situation d’Inès. On écrit donc le niveau du jour là où les autres consultent, traduit en mots, et on ajoute la règle du remplaçant&nbsp;: quelqu’un qui ne connaît pas le plan aide au niveau écrit, jamais plus. Lui interdire d’aider ne tiendrait pas une matinée, et suspendre jusqu’à lundi laisse un remplaçant bienveillant faire la tâche à la place, ce qui remet le plan à zéro.',
      },
      {
        enonce:
          'Dans l’annonce «&nbsp;à partir de lundi, je ne mettrai plus ma main sur ton bras&nbsp;; je resterai assis à côté de toi&nbsp;; si tu as besoin, tu me regardes&nbsp;», quel élément est le plus important&nbsp;?',
        options: [
          'Ce qui ne change pas&nbsp;: rester assis à côté.',
          'Ce qui change&nbsp;: la main qui se retire.',
          'La date exacte du changement.',
          'Le ton employé au moment de le dire.',
        ],
        bonne: 0,
        pourquoi:
          'L’annonce tient en trois éléments — ce qui change, ce qui ne change pas, ce que la personne peut faire si elle a besoin — et c’est le deuxième qui porte le plus, parce que c’est lui qui dit que vous ne partez pas. Un retrait annoncé est supportable&nbsp;; un retrait subi ressemble à un abandon et en produit les effets. La date et le ton comptent, mais ils ne répondent pas à la question que se pose la personne.',
      },
      {
        enonce:
          'On entend souvent que l’erreur fait partie de l’apprentissage. Qu’en dit ce module&nbsp;?',
        options: [
          'C’est vrai&nbsp;: il faut donc laisser rater le plus souvent possible.',
          'C’est vrai à condition de commenter chaque échec avec la personne.',
          'L’erreur n’enseigne rien par elle-même&nbsp;; répétée, elle enseigne surtout à éviter la tâche.',
          'L’erreur n’a aucun effet, ni dans un sens ni dans l’autre.',
        ],
        bonne: 2,
        pourquoi:
          'C’est l’idée fausse la plus répandue, et le seul vrai danger de l’estompage&nbsp;: une succession d’échecs transforme une tâche neutre en tâche que la personne évite. Ce qui se décide à l’avance, ce n’est donc pas la dose d’erreurs mais ce qu’on fait au moment où ça rate. Commenter chaque échec ajoute du poids à ce qui en a déjà trop&nbsp;; dire que l’erreur est sans effet, c’est ignorer l’évitement qu’elle installe.',
      },
    ],
  },

  /* ── MODULE 4 — Quinze jours de relevé, et la phrase de bilan ──────────── */
  {
    questions: [
      {
        enonce:
          'Sur un relevé d’estompage, quelle colonne montre réellement un apprentissage&nbsp;?',
        options: [
          'La colonne «&nbsp;réussi / non réussi&nbsp;».',
          'La colonne du niveau d’aide qu’il a fallu donner.',
          'Le temps mis pour réaliser la tâche.',
          'L’humeur de la personne ce jour-là.',
        ],
        bonne: 1,
        pourquoi:
          'Avec une guidance complète, tout le monde réussit tout, tous les jours&nbsp;: la colonne «&nbsp;réussi&nbsp;» aurait affiché «&nbsp;oui&nbsp;» aussi bien au niveau&nbsp;5 il y a trois semaines qu’au niveau&nbsp;2 aujourd’hui. Seul le niveau donné fait apparaître le progrès. Le temps et l’humeur peuvent figurer en remarque facultative, mais un relevé qui demande une phrase par jour n’est plus tenu au-delà du cinquième.',
      },
      {
        enonce:
          'Quinzième jour, vous lisez votre relevé&nbsp;: le niveau est le même depuis dix jours. Que faites-vous&nbsp;?',
        options: [
          'Vous fabriquez un cran intermédiaire&nbsp;: le cran suivant était trop grand.',
          'Vous concluez que la personne a atteint son plafond.',
          'Vous descendez de deux crans d’un coup pour relancer.',
          'Vous changez de tâche.',
        ],
        bonne: 0,
        pourquoi:
          'Une courbe plate ne dit rien sur la personne&nbsp;: elle dit que la marche est trop haute. Entre la consigne directe et l’indice indirect, il y a la consigne raccourcie de moitié, puis chuchotée, puis dite une seule fois&nbsp;; entre le geste montré et l’indice de position, le geste rétrécit, se fait à distance, puis n’est plus qu’un regard. Descendre de deux crans est la règle la plus enfreinte et elle se paie en évitement&nbsp;; changer de tâche abandonne un travail qui n’a pas encore été essayé au bon calibre.',
      },
      {
        enonce:
          'Votre courbe descend bien, mais la tâche n’est jamais réussie ensuite, quel que soit le niveau. Comment lisez-vous cela&nbsp;?',
        options: [
          'C’est la forme normale d’un apprentissage, il faut continuer.',
          'La tâche est peut-être trop difficile en elle-même, indépendamment de l’aide&nbsp;: il faut la reprendre et la découper.',
          'Le relevé est mal tenu, il faut le recommencer.',
          'Il faut remonter d’un cran et attendre une semaine.',
        ],
        bonne: 1,
        pourquoi:
          'C’est l’une des quatre lectures du quinzième jour, et la seule qui ne porte pas sur l’aide mais sur la tâche&nbsp;: on renvoie alors au découpage en étapes, pas à un réglage supplémentaire du niveau. Continuer ne ferait qu’accumuler des échecs&nbsp;; remonter d’un cran est la réponse à une courbe qui remonte, pas à celle-ci&nbsp;; et rien n’indique ici un défaut de relevé.',
      },
      {
        enonce: 'Que doit contenir une phrase de bilan utile&nbsp;?',
        options: [
          'Une appréciation nuancée des progrès accomplis.',
          'Le nombre de séances réalisées dans le trimestre.',
          'L’avis de la famille sur l’accompagnement.',
          'Deux niveaux et une durée.',
        ],
        bonne: 3,
        pourquoi:
          'Deux niveaux et une durée&nbsp;: «&nbsp;l’aide est passée d’une guidance physique partielle en septembre à un indice visuel à distance en mars&nbsp;». Cette phrase se vérifie, se compare d’un trimestre à l’autre et se transmet à une équipe qui change. «&nbsp;Progrès en autonomie&nbsp;» ne dit rien et ne survit pas à un changement d’équipe&nbsp;; un nombre de séances ne mesure pas l’aide&nbsp;; l’avis de la famille a sa place ailleurs, il ne remplace pas la mesure.',
      },
      {
        enonce:
          'Depuis que l’aide a diminué, la personne montre une détresse nette à l’approche de la tâche. Que faites-vous&nbsp;?',
        options: [
          'Vous continuez&nbsp;: la baisse est temporaire et dure quelques jours.',
          'Vous descendez plus lentement, un demi-cran à la fois.',
          'Vous suspendez, vous remettez le niveau qui fonctionnait, et vous en parlez en équipe ou à un professionnel de santé.',
          'Vous arrêtez le relevé et reprenez dans trois mois.',
        ],
        bonne: 2,
        pourquoi:
          'La détresse à l’approche de la tâche fait partie des quatre situations où l’on suspend&nbsp;: avec la mise en danger quand l’aide diminue, la remontée franche sans cause identifiable, et l’hypothèse d’un problème médical, d’un traitement ou d’une douleur. Un estompage n’est jamais urgent. La baisse temporaire annoncée au module&nbsp;2 dure quelques jours et ne ressemble pas à cela&nbsp;; ralentir ou arrêter le relevé laisserait la situation continuer sans que personne d’autre ne la regarde.',
      },
    ],
  },
];
