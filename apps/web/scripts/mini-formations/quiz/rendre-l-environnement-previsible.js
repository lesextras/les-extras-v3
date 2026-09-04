/**
 * QUIZ — Rendre l'environnement prévisible.
 * Un bloc par module, dans l'ordre. Chaque question est ancrée dans le module
 * correspondant : aucune notion qui n'y est pas enseignée.
 */
module.exports = [
  /* ── MODULE 1 ──────────────────────────────────────────────────────────── */
  {
    questions: [
      {
        enonce:
          'Un support visuel remplace une consigne parlée. Mais qu’apporte-t-il d’essentiel, que la parole n’apporte pas&nbsp;?',
        options: [
          'Il fait mieux comprendre la consigne, parce que l’image est plus claire que le mot.',
          'Il évite d’avoir à répéter, ce qui fait gagner du temps à l’équipe.',
          'Il permet de savoir ce qui vient sans dépendre de la disponibilité d’un adulte.',
          'Il rappelle les règles du lieu et aide à les faire respecter.',
        ],
        bonne: 2,
        pourquoi:
          'Un support n’est pas une aide à la compréhension, c’est une aide à l’<strong>autonomie</strong>&nbsp;: il se consulte plusieurs fois, et surtout sans rien demander à personne — ce qui coûte cher à quelqu’un qui a précisément du mal à demander. La réponse A confond image et compréhension. La B décrit un bénéfice pour l’adulte, pas pour la personne. La D est écartée par le module&nbsp;: un support informe de ce qui va se passer, il ne sert ni à obtenir une obéissance ni à rappeler des règles.',
      },
      {
        enonce:
          'Dans une salle d’attente, un jeune demande sans arrêt «&nbsp;c’est encore long&nbsp;?&nbsp;». L’équipe envisage d’afficher un emploi du temps plus détaillé. Que dit le module&nbsp;?',
        options: [
          'C’est la bonne réponse&nbsp;: plus le déroulé est précis, moins la question revient.',
          'La question posée est celle d’une durée&nbsp;: elle appelle un repère de temps, pas un emploi du temps.',
          'Il faut d’abord une séquence de tâche, puisqu’il ne sait pas quoi faire en attendant.',
          'Il faut afficher les trois objets ensemble pour couvrir tous les cas.',
        ],
        bonne: 1,
        pourquoi:
          'Chaque objet répond à une question et à une seule&nbsp;: l’emploi du temps à «&nbsp;qu’est-ce qui se passe aujourd’hui&nbsp;?&nbsp;», la séquence de tâche à «&nbsp;comment je fais ça&nbsp;?&nbsp;», le repère de temps à «&nbsp;c’est encore long&nbsp;?&nbsp;». C’est bien la troisième question qui est posée ici. La réponse D est celle qu’il faut éviter&nbsp;: un mur qui mélange les trois ne répond à aucune des trois.',
      },
      {
        enonce:
          'Vous posez deux photos côte à côte, dans un moment calme, et vous demandez&nbsp;: «&nbsp;montre le bain&nbsp;». La personne hésite environ une seconde, puis montre la bonne image. Que retenez-vous&nbsp;?',
        options: [
          'La réponse est juste&nbsp;: ce niveau convient, vous l’utilisez.',
          'L’hésitation d’une seconde signifie une chose&nbsp;: vous descendez d’un niveau.',
          'Vous refaites le test avec quatre images pour être sûr.',
          'Vous montez d’un niveau, l’hésitation venant du manque de difficulté.',
        ],
        bonne: 1,
        pourquoi:
          'La règle du test de dix secondes est explicite&nbsp;: réponse immédiate, le niveau convient&nbsp;; hésitation d’une seconde, on descend d’un niveau&nbsp;; pas de réponse, on descend de deux. On prend le niveau reconnu <em>aujourd’hui</em>, jamais celui qu’on aimerait atteindre — on montera plus tard. Et si l’hésitation portait sur des pictogrammes, la photo prise sur place est le repli évident&nbsp;: elle coûte trente secondes et ne suppose aucun apprentissage.',
      },
      {
        enonce:
          'Parmi les cinq causes d’abandon d’un support, laquelle tue le plus souvent, très loin devant les autres&nbsp;?',
        options: [
          'Le niveau de représentation a été supposé au lieu d’être testé.',
          'Le support est trop chargé&nbsp;: plus de six cases.',
          'Personne n’est chargé de la mise à jour&nbsp;: aucun nom, aucun moment.',
          'Il n’y a pas de marque de fin&nbsp;: la bande s’arrête sans rien.',
        ],
        bonne: 2,
        pourquoi:
          'Les quatre autres causes existent bel et bien, mais celle-ci les précède toutes&nbsp;: un support meurt d’organisation, pas de conception pédagogique. Ce n’est même pas une question de motivation — fabriquer un support est valorisant, l’entretenir ne l’est pas. C’est précisément pour cela que la ligne de responsabilité s’écrit <strong>avant</strong> la première case.',
      },
      {
        enonce:
          'Une personne qui ne lit pas l’heure joue dans la salle. L’adulte annonce «&nbsp;encore cinq minutes&nbsp;». Cinq minutes plus tard, l’arrêt est très difficile. Qu’aurait-il fallu poser&nbsp;?',
        options: [
          'Une horloge murale bien visible, en désignant l’aiguille.',
          'Le même avertissement, répété trois fois plutôt qu’une.',
          'Une consigne plus ferme, annoncée sur un ton plus net.',
          'Une durée qui se voit diminuer — sablier, minuteur visuel, jetons retirés un par un — et l’annonce de ce qui vient après.',
        ],
        bonne: 3,
        pourquoi:
          '«&nbsp;Encore cinq minutes&nbsp;» ne veut rien dire pour qui ne lit pas l’heure&nbsp;: c’est une durée invisible. Ce qui fonctionne, c’est une durée qui <strong>se voit</strong> diminuer. Une horloge suppose la lecture de l’heure, et répéter ou durcir le ton ne rend pas la durée plus visible. Le second point est aussi important que le premier&nbsp;: on annonce toujours ce qui vient après, parce que c’est le vide qui suit la fin qui inquiète, pas la fin elle-même.',
      },
    ],
  },

  /* ── MODULE 2 ──────────────────────────────────────────────────────────── */
  {
    questions: [
      {
        enonce:
          'La piscine de Léa est annulée. On le lui dit oralement. Elle se lève, va dans le couloir, regarde le panneau où la vignette piscine est toujours là, revient et se met à crier. Que montre ce déplacement&nbsp;?',
        options: [
          'Qu’elle n’a pas compris l’explication orale et qu’il faut la reformuler plus simplement.',
          'Qu’elle a fait confiance au support et que le support mentait — c’est exactement le comportement qu’on cherchait à installer.',
          'Que le niveau de représentation choisi est trop abstrait pour elle.',
          'Que le visuel ne convient pas à son profil et qu’il faut chercher un autre outil.',
        ],
        bonne: 1,
        pourquoi:
          'Le support n’a pas échoué&nbsp;: il a parfaitement fonctionné. Léa est allée vérifier toute seule, c’est-à-dire qu’elle a fait exactement ce qu’on voulait lui apprendre — et c’est ce comportement-là qui a été puni. Ce qu’elle a appris ce mardi, c’est que le panneau n’est pas fiable&nbsp;: <strong>un support faux enseigne la méfiance</strong>, et la méfiance se rattrape beaucoup plus lentement qu’elle ne s’installe.',
      },
      {
        enonce:
          'En réunion, l’équipe conclut&nbsp;: «&nbsp;le visuel ne marche pas avec elle&nbsp;». Quelle formulation aurait ouvert une discussion utile&nbsp;?',
        options: [
          '«&nbsp;Léa supporte mal les changements de programme.&nbsp;»',
          '«&nbsp;Il nous faudrait un panneau plus grand et des pictogrammes plus lisibles.&nbsp;»',
          '«&nbsp;Il faudrait la préparer davantage aux imprévus.&nbsp;»',
          '«&nbsp;Notre organisation ne permet pas de tenir ce support à jour.&nbsp;»',
        ],
        bonne: 3,
        pourquoi:
          'La première formulation ferme le sujet et désigne l’enfant&nbsp;; la seconde ouvre une discussion sur la taille du support et sur qui le met à jour. Les propositions A et C déplacent aussi le problème sur Léa, et la B propose d’agrandir un panneau que personne ne tenait déjà — c’est-à-dire d’aggraver la cause qui l’a tué.',
      },
      {
        enonce:
          'Le panneau était fixé au mur du couloir, à 1&nbsp;m&nbsp;60. Pourquoi est-ce un problème en soi&nbsp;?',
        options: [
          'Un support se consulte là où la question se pose&nbsp;: dans le couloir et à cette hauteur, il est consultable par les adultes qui passent, pas par l’enfant qui attend dans la salle.',
          'Parce qu’un couloir est un lieu de passage trop bruyant pour se concentrer.',
          'Parce qu’un support fixé au mur s’abîme plus vite qu’un support posé sur une table.',
          'Parce que la lumière du couloir rend les pictogrammes moins lisibles.',
        ],
        bonne: 0,
        pourquoi:
          'Deux choses se cumulent&nbsp;: l’endroit et la hauteur. Un support à 1&nbsp;m&nbsp;60 est un support pour les adultes, et un support éloigné du lieu de vie est consulté par ceux qui passent devant, pas par la personne qui attend ailleurs. Les trois autres réponses sont des considérations de confort&nbsp;: elles n’expliquent pas pourquoi l’information n’arrive jamais là où la question se pose.',
      },
      {
        enonce:
          'À la maison, le grand planning familial acheté en septembre est rempli deux semaines puis figé sur une semaine d’octobre. Quelle version tient réellement&nbsp;?',
        options: [
          'Le même planning, mais rempli au crayon pour pouvoir le corriger vite.',
          'Le même planning, affiché dans l’entrée pour que tout le monde le voie en passant.',
          'Quatre cases pour la soirée, sur une bande aimantée posée sur le frigo à hauteur d’enfant, avec une pochette «&nbsp;fini&nbsp;» et une règle écrite&nbsp;: «&nbsp;la bande du lendemain est posée par celui qui couche, avant d’éteindre.&nbsp;»',
          'Une semaine complète, mais avec des images plus grandes pour qu’elles se voient de loin.',
        ],
        bonne: 2,
        pourquoi:
          'Sept jours de planning familial ne se tiennent pas, et personne n’a jamais tenu les siens&nbsp;; quatre cases se tiennent en trente secondes. Les réponses A, B et D gardent la semaine entière et ne changent que la forme&nbsp;: elles laissent intactes les deux causes qui l’ont tué, la charge et l’absence de responsable. La version qui tient combine la réduction, la hauteur d’enfant, quelque chose à manipuler et un nom avec un moment.',
      },
      {
        enonce:
          'Vous terminez l’autopsie d’un support abandonné et vous écrivez votre phrase de bilan. Laquelle est recevable&nbsp;?',
        options: [
          '«&nbsp;Ce support est tombé parce que Kévin ne regarde pas les images.&nbsp;»',
          '«&nbsp;Ce support est tombé parce que personne n’était chargé de le mettre à jour, et qu’il comptait quarante cases.&nbsp;»',
          '«&nbsp;Ce support est tombé parce que l’équipe manque de motivation.&nbsp;»',
          '«&nbsp;Ce support est tombé parce que le visuel ne marche pas avec ce public.&nbsp;»',
        ],
        bonne: 1,
        pourquoi:
          'La phrase de bilan désigne une cause d’organisation, jamais une personne accompagnée&nbsp;: A et D sont donc écartées d’emblée, et D reprend en plus la conclusion que le module démonte. C paraît honnête mais rate la cible&nbsp;: ce n’est pas une question de motivation, c’est une question d’organisation — un nom et un moment, écrits.',
      },
    ],
  },

  /* ── MODULE 3 ──────────────────────────────────────────────────────────── */
  {
    questions: [
      {
        enonce:
          'Une équipe écrit au dos de sa bande&nbsp;: «&nbsp;Mis à jour par l’équipe du matin.&nbsp;» Que manque-t-il&nbsp;?',
        options: [
          'Rien&nbsp;: la responsabilité est attribuée, l’équipe du matin sait ce qu’elle a à faire.',
          'Un prénom et une heure précise.',
          'La date de fabrication du support et le nom de la personne concernée.',
          'La signature du chef de service, qui valide l’engagement.',
        ],
        bonne: 1,
        pourquoi:
          'La ligne de responsabilité s’écrit «&nbsp;mis à jour par ……………, chaque jour à …… h …… &nbsp;»&nbsp;: un prénom, une heure. Pas «&nbsp;l’équipe&nbsp;», pas «&nbsp;le matin&nbsp;» — une responsabilité collective n’engage personne, et c’est exactement ainsi que le panneau de Léa est mort. Et le corollaire vaut d’être retenu&nbsp;: si personne ne peut mettre son prénom, c’est que le support est trop gros&nbsp;; on le réduit jusqu’à ce que quelqu’un puisse s’engager.',
      },
      {
        enonce:
          'Vous chronométrez la première mise à jour de votre support&nbsp;: elle prend une minute vingt. Que faites-vous&nbsp;?',
        options: [
          'Rien&nbsp;: une minute vingt par jour reste très raisonnable.',
          'Vous prévoyez un temps dédié dans le planning de l’équipe.',
          'Vous formez mieux la personne qui s’en charge, pour qu’elle aille plus vite.',
          'Vous réduisez le nombre de cases jusqu’à passer sous les trente secondes.',
        ],
        bonne: 3,
        pourquoi:
          'Au-delà de trente secondes, la mise à jour ne sera pas faite tous les jours — quelles que soient les bonnes intentions de la personne qui s’est engagée. Ce n’est ni une question de formation ni une question d’emploi du temps&nbsp;: c’est le support qui est trop gros. Et un support qui n’est pas tenu devient un support faux, c’est-à-dire pire qu’un support absent.',
      },
      {
        enonce:
          'La carte «&nbsp;changement&nbsp;» s’utilise en trois gestes, toujours les mêmes. Lequel est le plus important&nbsp;?',
        options: [
          'Montrer la carte «&nbsp;changement&nbsp;».',
          'Retirer la case de l’activité qui ne se fera pas.',
          'Poser immédiatement la case qui la remplace.',
          'Expliquer oralement pourquoi le programme change.',
        ],
        bonne: 2,
        pourquoi:
          'On ne laisse <strong>jamais</strong> un trou&nbsp;: un vide sur un emploi du temps est plus inquiétant que le changement lui-même. Les deux premiers gestes sont nécessaires, mais s’arrêter là laisse exactement le vide qui angoisse. L’explication orale, elle, disparaît en une seconde — c’est le défaut de la parole que le support est censé corriger.',
      },
      {
        enonce:
          'Un vendredi, l’éducatrice qui pose la bande est absente et personne n’a le temps de la mettre à jour. Qu’a-t-on prévu&nbsp;?',
        options: [
          'On retire le support pour la journée, ou on ne laisse que les cases certaines avec la carte «&nbsp;changement&nbsp;» sur le reste — la règle est écrite d’avance sur le support.',
          'On laisse la bande telle quelle&nbsp;: ce n’est qu’une journée.',
          'On ajoute une case «&nbsp;imprévu&nbsp;» à la fin de la bande.',
          'On demande à la personne de ne pas regarder la bande aujourd’hui.',
        ],
        bonne: 0,
        pourquoi:
          'Il y aura des jours où le support ne pourra pas être tenu&nbsp;: on décide donc <em>à l’avance</em>, et on l’écrit à côté de la ligne de responsabilité, parce que sur le moment la tentation sera de le laisser tel quel — c’est-à-dire faux. La réponse B est précisément ce qu’on veut éviter. La D revient au même en demandant à la personne de se méfier d’un outil qu’on lui a appris à consulter.',
      },
      {
        enonce:
          'Une équipe consacre son mercredi après-midi à découper et plastifier trente vignettes, avant d’avoir écrit la question à laquelle le support répondra. Quel est le problème&nbsp;?',
        options: [
          'Aucun&nbsp;: plastifier dès le départ fait gagner du temps sur la durée.',
          'Trente vignettes, c’est le bon volume, mais il aurait fallu s’y prendre le matin.',
          'On fabrique avant d’avoir écrit la question, et on plastifie avant d’avoir tenu un mois.',
          'Il aurait fallu commencer par acheter des pictogrammes du commerce, plus lisibles.',
        ],
        bonne: 2,
        pourquoi:
          'On conçoit d’abord, on découpe ensuite&nbsp;: l’inverse produit de jolis supports inutilisables. Et un support en papier utilisé bat un support plastifié abandonné — on plastifie ce qui a survécu un mois, pas ce qu’on espère utiliser. La réponse D ajoute une erreur de plus&nbsp;: un pictogramme est une convention qui s’apprend, alors qu’une photo prise sur place ne suppose aucun apprentissage et coûte trente secondes.',
      },
    ],
  },

  /* ── MODULE 4 ──────────────────────────────────────────────────────────── */
  {
    questions: [
      {
        enonce:
          'Le relevé compte trois colonnes. Laquelle compte le plus, et pourquoi&nbsp;?',
        options: [
          'La première — le support était-il à jour&nbsp;? — parce qu’un support faux abîme la confiance.',
          'La deuxième — a-t-il été consulté de sa propre initiative&nbsp;? — parce qu’elle mesure l’autonomie, qui est l’objectif réel.',
          'La troisième — le moment s’est-il mieux passé&nbsp;? — parce que c’est le résultat attendu.',
          'Les trois ont exactement le même poids, sinon la lecture serait biaisée.',
        ],
        bonne: 1,
        pourquoi:
          'La première colonne mesure votre organisation et la troisième le confort du moment&nbsp;; seule la deuxième dit si la personne va vérifier d’elle-même — c’est-à-dire si elle fait, sans le demander à personne, exactement ce que le support est censé lui permettre. C’est la raison d’être de tout le parcours, et c’est pour cela qu’elle est lue en premier au quatorzième jour.',
      },
      {
        enonce:
          'Au quatorzième jour&nbsp;: le support était à jour treize jours sur quatorze, consulté spontanément douze jours, et la troisième colonne dit «&nbsp;pareil&nbsp;» presque partout. Que concluez-vous&nbsp;?',
        options: [
          'Le support est mal conçu&nbsp;: il faut le refaire entièrement.',
          'Il faut descendre d’un niveau de représentation.',
          'Le support est tenu et consulté&nbsp;: ce moment ne pose probablement pas un problème de prévisibilité, il faut chercher ailleurs.',
          'Il faut prolonger le relevé de quatorze jours supplémentaires.',
        ],
        bonne: 2,
        pourquoi:
          'Les deux premières colonnes disent que le support fonctionne&nbsp;: il est tenu, et il est consulté sans qu’on le demande. Si le moment reste difficile malgré cela, la difficulté n’est pas une question de prévisibilité — on relit la situation avec la grille des quatre fonctions, on regarde si la tâche est trop difficile, ou on demande un avis médical. Refaire le support ou changer le niveau reviendrait à corriger ce qui marche déjà.',
      },
      {
        enonce:
          'Autre relevé&nbsp;: le support était à jour presque tous les jours, mais la personne ne l’a jamais consulté d’elle-même. Que faites-vous, et dans quel ordre&nbsp;?',
        options: [
          'Vous le rapprochez du lieu où la question se pose&nbsp;; si rien ne change, vous descendez ensuite d’un niveau.',
          'Vous le déplacez et vous descendez d’un niveau en même temps, pour aller plus vite.',
          'Vous lui rappelez chaque matin de regarder son planning.',
          'Vous concluez que le visuel ne convient pas à cette personne.',
        ],
        bonne: 0,
        pourquoi:
          'Deux causes sont probables&nbsp;: le support est trop loin de l’endroit où la question se pose, ou son niveau est trop abstrait. On rapproche d’abord, on descend ensuite — parce qu’on ne change qu’une chose à la fois, sans quoi le relevé devient illisible et l’on ne saura pas ce qui a joué. La réponse C est écartée par la troisième règle des quatorze jours&nbsp;: on ne commente pas l’usage du support, qui est une ressource et non une consigne de plus. La D est la conclusion que le module 2 démonte.',
      },
      {
        enonce:
          'Au troisième jour, tout se passe remarquablement bien. L’équipe propose d’étendre le support à toute la journée et aux trois autres jeunes du groupe. Que répondez-vous&nbsp;?',
        options: [
          'On étend tout de suite, tant que l’élan est là.',
          'On étend à toute la journée, mais on attend pour les autres jeunes.',
          'On étend aux autres jeunes d’abord&nbsp;: le support est déjà fabriqué, cela ne coûte rien.',
          'On attend&nbsp;: quatorze jours de relevé, puis un mois de fonctionnement stable, et une extension à la fois.',
        ],
        bonne: 3,
        pourquoi:
          'C’est le piège de la réussite, et c’est ainsi qu’on se retrouve avec un mur de quarante cases que personne ne tient à jour. Trois jours ne mesurent que la nouveauté&nbsp;: il faut quatorze jours, parce qu’un support tient presque toujours la première semaine et que c’est la deuxième qui dit s’il survivra. Ensuite seulement&nbsp;: un mois de fonctionnement stable, puis une extension, une seule, tenue un mois à son tour.',
      },
      {
        enonce:
          'Le relevé est mauvais et vous décidez d’arrêter. Quelle est la bonne façon de le faire&nbsp;?',
        options: [
          'Le laisser au mur&nbsp;: il finira peut-être par servir, et le retirer serait avouer un échec.',
          'Le retirer, écrire en une phrase pourquoi, et garder cette phrase.',
          'Le retirer discrètement et ne pas en reparler à l’équipe.',
          'Le retirer et fabriquer immédiatement un support tout neuf sur un autre modèle.',
        ],
        bonne: 1,
        pourquoi:
          'Un support abandonné après un test honnête n’est pas un échec&nbsp;: c’est une information, et la phrase écrite vous évitera de refabriquer le même dans six mois. Ce qui coûte cher, c’est de le laisser au mur en sachant qu’il ne sert plus — il occupe la place, il donne mauvaise conscience, et il enseigne que les supports ne servent à rien. Refabriquer aussitôt, c’est se priver de la seule chose que ces quatorze jours ont produite. Et un support retiré peut revenir&nbsp;: ce n’est pas définitif, c’est un réglage.',
      },
    ],
  },
];
