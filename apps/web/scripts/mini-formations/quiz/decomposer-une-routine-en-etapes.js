/**
 * QUIZ — Décomposer une routine en étapes.
 * Un bloc par module, dans l'ordre. Chaque question est ancrée dans le module
 * correspondant : aucune notion qui n'y est pas enseignée.
 */
module.exports = [
  /* ── MODULE 1 — La chaîne, la ligne de base, les trois modes ───────────── */
  {
    questions: [
      {
        enonce:
          'En réunion de synthèse, une éducatrice dit&nbsp;: «&nbsp;Il ne sait pas se laver les mains, il faut tout faire à sa place.&nbsp;» Quelle reformulation permet, elle, de travailler&nbsp;?',
        options: [
          '«&nbsp;Il a besoin de gagner en autonomie sur l’hygiène.&nbsp;»',
          '«&nbsp;Il ne se lave pas correctement les mains.&nbsp;»',
          '«&nbsp;Six étapes sur huit sont acquises seules&nbsp;; ça bloque au rinçage et à l’essuyage.&nbsp;»',
          '«&nbsp;Il faudrait travailler l’hygiène avec lui cette année.&nbsp;»',
        ],
        bonne: 2,
        pourquoi:
          'La phrase de départ décrit un résultat&nbsp;: elle ne dit ni ce qui est déjà acquis, ni où exactement ça s’arrête — donc elle n’indique rien à enseigner, et elle n’appelle que du découragement. La bonne réponse nomme des étapes précises&nbsp;: elle dit quoi travailler, elle se transmet à un collègue, et elle permettra de dire dans trois semaines si les choses ont bougé. Les autres options restent des résultats ou des intentions&nbsp;; «&nbsp;correctement&nbsp;» ajoute même un jugement, qui ne s’observe pas et ne se coche pas.',
      },
      {
        enonce: 'Laquelle de ces lignes peut figurer telle quelle dans une chaîne écrite&nbsp;?',
        options: [
          '«&nbsp;Prendre le savon et frotter les paumes.&nbsp;»',
          '«&nbsp;Se laver correctement les mains.&nbsp;»',
          '«&nbsp;Lui donner le savon.&nbsp;»',
          '«&nbsp;Ouvrir le robinet.&nbsp;»',
        ],
        bonne: 3,
        pourquoi:
          'Trois règles font passer le test du témoin, et chaque mauvaise réponse en casse une. Une étape qui contient «&nbsp;et&nbsp;» en fait deux&nbsp;: on peut réussir l’une et rater l’autre. Un jugement — «&nbsp;correctement&nbsp;» — ne s’observe pas, donc ne se coche pas. Et une chaîne décrit ce que fait <em>la personne</em>, jamais ce que vous faites&nbsp;: c’est l’erreur la plus fréquente, et elle rend la ligne de base impossible à remplir.',
      },
      {
        enonce:
          'Vous prenez la ligne de base d’un habillage. La personne s’arrête devant la fermeture&nbsp;; au bout de trois secondes vous lâchez un «&nbsp;vas-y&nbsp;», et elle la remonte. Que notez-vous&nbsp;?',
        options: [
          'S&nbsp;: elle a fait le geste elle-même.',
          'A&nbsp;: un «&nbsp;vas-y&nbsp;» est déjà une aide, et elle est arrivée avant les cinq secondes.',
          'N&nbsp;: elle a hésité, donc l’étape n’est pas acquise.',
          'Rien&nbsp;: la mesure est perdue, il faut recommencer l’observation demain.',
        ],
        bonne: 1,
        pourquoi:
          'Pendant une ligne de base, on n’encourage pas&nbsp;: un encouragement est une aide, et il transforme un S en A. On n’intervient qu’après cinq secondes de blocage, et on note alors A. Coter S créditerait la personne d’un geste qu’elle n’a pas fait seule&nbsp;; coter N confondrait une hésitation avec un échec&nbsp;; et il n’y a pas lieu de tout reprendre demain&nbsp;: une seule observation suffit pour démarrer, et à ce stade la précision compte moins que le fait de commencer.',
      },
      {
        enonce:
          'Une routine jamais travaillée jusqu’ici, avec une personne qui se décourage vite. Quel mode d’enseignement choisit-on par défaut&nbsp;?',
        options: [
          'Le chaînage arrière.',
          'Le chaînage avant.',
          'La chaîne entière avec aide dégressive.',
          'Peu importe&nbsp;: les trois modes se valent, on prend ce qui vient.',
        ],
        bonne: 0,
        pourquoi:
          'Le chaînage arrière est le choix par défaut dans ce cas précis, et son avantage est décisif&nbsp;: la personne <em>termine</em> la routine dès la première séance, donc ce qui la récompense naturellement — les mains propres, le manteau mis — arrive juste après ce qu’elle vient d’apprendre. Le chaînage avant se réserve aux routines dont les premières étapes sont les plus dures, ou trop longues à tenir en entier&nbsp;; la chaîne entière suppose que plus de la moitié des étapes soient déjà acquises seules. Et le mode ne se choisit pas au ressenti&nbsp;: c’est ce qui permet à deux adultes de faire pareil.',
      },
      {
        enonce:
          'Pourquoi n’enseigne-t-on qu’une seule étape à la fois, en accompagnant tout le reste sans commentaire et à vitesse normale&nbsp;?',
        options: [
          'Parce qu’une personne ne peut apprendre qu’une chose à la fois.',
          'Parce qu’une routine entièrement transformée en leçon devient un moment pénible — donc évité — et se retrouve plus difficile qu’avant.',
          'Parce que les autres étapes seront travaillées par les collègues.',
          'Parce que le temps manque de toute façon sur ce créneau.',
        ],
        bonne: 1,
        pourquoi:
          'La raison est pratique autant que pédagogique&nbsp;: une routine corrigée en permanence devient longue, désagréable et jamais finie, et ce qui est désagréable finit par être évité. On perd alors davantage qu’on n’avait gagné. Les autres réponses décrivent des contraintes réelles, mais aucune n’est le motif&nbsp;: ce n’est ni une question de capacité d’apprentissage, ni une répartition entre collègues, ni un manque de temps.',
      },
    ],
  },

  /* ── MODULE 2 — La séance de Malik, et ce qui manquait avant ───────────── */
  {
    questions: [
      {
        enonce:
          '16&nbsp;h&nbsp;05, le groupe est déjà dans le couloir. Malik tient son manteau et attend&nbsp;; l’éducatrice finit par lui mettre la deuxième manche et remonter la fermeture. Qu’a-t-il appris ce jour-là&nbsp;?',
        options: [
          'Qu’il doit faire plus d’efforts la prochaine fois.',
          'Que mettre un manteau est une tâche trop difficile pour lui.',
          'Rien du tout&nbsp;: la séance a été neutre.',
          'Que s’il attend assez longtemps, quelqu’un le fait à sa place.',
        ],
        bonne: 3,
        pourquoi:
          'L’aide est arrivée quand il a fallu partir, pas quand il a fallu apprendre&nbsp;: c’est l’attente qui a été suivie d’effet, c’est donc elle qui a été enseignée. La séance n’a pas été neutre — elle n’a produit ni apprentissage ni information, mais elle a produit cela. Et la scène n’accuse personne&nbsp;: à cette heure-là, avec un groupe qui part, ce qui manquait est un plan, pas de la bonne volonté.',
      },
      {
        enonce:
          'Malik a enfilé un bras seul, avant que l’adulte n’intervienne. Quelle phrase de retour lui dire&nbsp;?',
        options: [
          '«&nbsp;C’est bien&nbsp;!&nbsp;»',
          '«&nbsp;Tu as mis un bras tout seul avant que je bouge.&nbsp;»',
          '«&nbsp;Tu es un grand, maintenant.&nbsp;»',
          '«&nbsp;La prochaine fois, tu le feras tout seul.&nbsp;»',
        ],
        bonne: 1,
        pourquoi:
          'Un retour nomme le geste, jamais la personne. «&nbsp;C’est bien&nbsp;» ne dit pas ce qui était bien&nbsp;; «&nbsp;tu es un grand&nbsp;» juge la personne, et le jour où ça rate, elle n’est plus un grand&nbsp;; «&nbsp;la prochaine fois tout seul&nbsp;» décrit un échec au moment même d’une réussite partielle. Ces phrases-là s’écrivent à l’avance&nbsp;: improvisées, elles deviennent «&nbsp;bravo&nbsp;» et n’enseignent rien.',
      },
      {
        enonce:
          'À la maison, l’habillage coince tous les matins à 7&nbsp;h&nbsp;40, juste avant le départ à l’école. Par où commence-t-on&nbsp;?',
        options: [
          'On travaille la routine le matin, puisque c’est là qu’elle pose problème.',
          'On renonce à cette routine tant que l’enfant est scolarisé.',
          'On prend la ligne de base un samedi, et on place la séance au moment le plus calme de la journée.',
          'On coupe la routine en deux moitiés, travaillées chacune un matin sur deux.',
        ],
        bonne: 2,
        pourquoi:
          'Un matin d’école, vous mesurez votre pression, pas ses compétences&nbsp;: la ligne de base se prend un jour sans horaire, un samedi ou pendant des vacances. Et l’enseignement se place au moment le plus calme, même si ce n’est pas celui qui pose problème — le geste appris le soir se transfère au matin, l’inverse ne s’apprend jamais. Les autres moments continuent comme avant&nbsp;: on y aide normalement, sans relevé et sans culpabilité.',
      },
      {
        enonce:
          'Chaîne du manteau, six étapes. Ligne de base&nbsp;: 1, 2 et 6 réussies seules&nbsp;; 3 et 4 avec aide&nbsp;; 5 jamais. En chaînage arrière, quelle est l’étape cible&nbsp;?',
        options: [
          'L’étape 5.',
          'L’étape 6, la dernière de la chaîne.',
          'L’étape 3, la première qui n’est pas réussie seule.',
          'Les étapes 3, 4 et 5, travaillées ensemble.',
        ],
        bonne: 0,
        pourquoi:
          'En chaînage arrière, on remonte depuis la fin jusqu’à la première étape non acquise&nbsp;: la 6 est déjà réussie seule, on s’arrête donc à la 5. L’éducatrice fait les étapes 1 à 4, Malik joint le bas de la fermeture, la remonte, et <em>termine</em> la routine. Partir de la 3 reviendrait à remonter depuis le début, ce qui relève d’un autre mode&nbsp;; et trois étapes cibles à la fois, c’est aucune étape cible&nbsp;: la personne ne saurait pas ce qui est attendu d’elle.',
      },
      {
        enonce:
          'Presque toutes les séances d’apprentissage ratées le sont pour la même raison. Laquelle&nbsp;?',
        options: [
          'Un manque de technique de l’adulte.',
          'Un manque de motivation de la personne.',
          'Une raison d’organisation&nbsp;: le créneau ne permet pas cinq secondes de silence.',
          'Un mode d’enseignement mal choisi au départ.',
        ],
        bonne: 2,
        pourquoi:
          'Si le moment retenu ne laisse pas cinq secondes de silence, aucun plan ne tiendra — et il vaut mieux déplacer la séance de quinze minutes que d’améliorer sa technique. C’est pour cela qu’on ne travaille jamais une routine sur son créneau le plus contraint&nbsp;: le matin de la sortie, l’heure du bus, la fin de service. La technique et le mode comptent, mais ils ne rattrapent pas un créneau impossible, et la motivation n’est pas en cause quand on demande la routine entière d’un coup.',
      },
    ],
  },

  /* ── MODULE 3 — Le compte des S, l’étape cible, le critère ─────────────── */
  {
    questions: [
      {
        enonce:
          'Mettre la table, six étapes. Ligne de base prise un samedi&nbsp;: 1&nbsp;S, 2&nbsp;S, 3&nbsp;S, 4&nbsp;S, 5&nbsp;A, 6&nbsp;N. Que dit la règle&nbsp;?',
        options: [
          'Chaînage arrière, étape cible&nbsp;: la 6.',
          'Chaîne entière avec aide dégressive, étape cible&nbsp;: la 5.',
          'Chaînage avant, étape cible&nbsp;: la 1.',
          'Chaînage arrière, étape cible&nbsp;: la 5.',
        ],
        bonne: 1,
        pourquoi:
          'On applique les trois lignes dans l’ordre et on s’arrête à la première qui répond. La ligne&nbsp;1 ne répond pas&nbsp;: ce ne sont pas les premières étapes qui sont en échec, ce sont les dernières. La ligne&nbsp;2 répond&nbsp;: quatre S sur six, c’est strictement supérieur à la moitié — donc chaîne entière à aide dégressive, avec pour cible la première A ou N en partant du début, soit la 5. On ne descend pas jusqu’à la ligne&nbsp;3&nbsp;: le chaînage arrière découperait une routine qui roule déjà aux deux tiers.',
      },
      {
        enonce: 'Pourquoi laisse-t-on le compte des S décider du mode, plutôt que son intuition&nbsp;?',
        options: [
          'Parce que le chaînage arrière est démontré supérieur aux deux autres modes.',
          'Parce que les études départagent nettement les trois modes.',
          'Parce que l’intuition des professionnels est le plus souvent fausse.',
          'Parce qu’une règle écrite à froid donne le même choix quels que soient l’adulte, le jour et la fatigue.',
        ],
        bonne: 3,
        pourquoi:
          'Les trois modes fonctionnent, et aucune étude ne les départage nettement&nbsp;: le seuil de la moitié n’est pas une vérité démontrée, c’est une convention utile. Son mérite est ailleurs&nbsp;— une intuition donne trois réponses différentes selon l’adulte et l’heure, une règle écrite en donne une seule. Ce qui compte n’est donc pas d’avoir choisi le bon mode du premier coup, mais d’avoir écrit lequel, de s’y tenir dix jours, et d’en changer si le relevé ne bouge pas.',
      },
      {
        enonce:
          'La toilette du matin est accompagnée par vous trois jours sur cinq, et par deux collègues le reste du temps. Quel critère de passage écrivez-vous&nbsp;?',
        options: [
          'Trois réussites de suite sans aide, avec vous.',
          'On passera à l’étape suivante quand vous sentirez que c’est acquis.',
          'Deux réussites de suite sans aide, avec deux personnes différentes.',
          'Une semaine complète sans aucune aide.',
        ],
        bonne: 2,
        pourquoi:
          'Quand plusieurs adultes interviennent, c’est le meilleur critère&nbsp;: il vérifie que l’apprentissage n’est pas attaché à quelqu’un. Le critère général reste trois réussites sans aide de suite, et «&nbsp;trois jours de suite&nbsp;» sert quand la routine n’a lieu qu’une fois par jour — mais tenus par vous seule, ils ne disent rien des jours où vous n’êtes pas là. Quant à «&nbsp;quand je sentirai que c’est acquis&nbsp;», ce n’est pas un critère&nbsp;: décidé sur le moment, il se déplace toujours.',
      },
      {
        enonce:
          'Vous prenez la ligne de base d’un repas, et toutes les étapes sont cotées N. Que faites-vous&nbsp;?',
        options: [
          'Vous cherchez une routine plus simple pour installer le mécanisme, et vous reviendrez à celle-ci plus tard.',
          'Vous démarrez quand même en chaînage arrière, sur la dernière étape.',
          'Vous refaites trois observations pour être sûr du résultat.',
          'Vous découpez chacune des étapes en deux, puis vous reprenez la ligne de base.',
        ],
        bonne: 0,
        pourquoi:
          'Une chaîne entièrement en N signale que la routine est probablement trop difficile dans son ensemble&nbsp;: ce parcours cherche l’étape qui manque, il ne construit pas une compétence entière depuis zéro. Refaire trois observations n’y changera rien — deux valent mieux qu’une, trois ne servent à rien. Et découper toute la chaîne avant d’avoir enseigné quoi que ce soit ne rend pas la routine plus accessible&nbsp;: cela allonge seulement la liste.',
      },
      {
        enonce:
          'Jeudi soir, fatiguée, une professionnelle se dit que deux réussites suffiront bien à valider l’étape cible. Qu’est-ce qui aurait dû l’en empêcher&nbsp;?',
        options: [
          'L’avis d’un collègue, demandé au moment de décider.',
          'Le critère de passage, écrit avant de commencer.',
          'Le mode d’enseignement retenu.',
          'La phrase de retour préparée à l’avance.',
        ],
        bonne: 1,
        pourquoi:
          'Le critère se fixe avant de commencer, et c’est sa seule utilité&nbsp;: décidé sur le moment, il se déplace toujours au moment où l’on est fatigué ou pressé. Le mode et la phrase de retour font partie des six éléments de la feuille, mais ni l’un ni l’autre ne protège de ce glissement-là. Et demander l’avis d’un collègue le jeudi soir, c’est encore décider sur le moment.',
      },
    ],
  },

  /* ── MODULE 4 — Le relevé, et la lecture du dixième jour ───────────────── */
  {
    questions: [
      {
        enonce:
          'Dixième jour. La colonne «&nbsp;réussi&nbsp;» affiche «&nbsp;oui&nbsp;» tous les jours, et la colonne «&nbsp;aide utilisée&nbsp;» affiche 6 du premier au dernier. Que lisez-vous&nbsp;?',
        options: [
          'L’étape est acquise&nbsp;: elle est réussie dix fois sur dix.',
          'La personne progresse lentement&nbsp;: on prolonge de dix jours.',
          'L’étape est trop grosse&nbsp;: on la coupe en deux.',
          'Le relevé a été mal rempli.',
        ],
        bonne: 2,
        pourquoi:
          'Avec une main guidée, tout est réussi tous les jours&nbsp;: c’est pour cela que la colonne qui montre l’apprentissage est «&nbsp;aide utilisée&nbsp;», pas «&nbsp;réussi&nbsp;». Une aide qui n’a pas bougé en dix jours ne signifie qu’une chose, et prolonger n’y changera rien&nbsp;: on coupe l’étape en deux — «&nbsp;enfiler le bras gauche&nbsp;» devient «&nbsp;attraper la manche&nbsp;», puis «&nbsp;pousser le bras&nbsp;». Le relevé, lui, a parfaitement fait son travail&nbsp;: il dit exactement ce qui s’est passé.',
      },
      {
        enonce:
          'Depuis trois jours, la personne se raidit dès qu’elle approche du lavabo, et la toilette tourne au conflit. Que faites-vous&nbsp;?',
        options: [
          'Vous arrêtez l’enseignement une semaine et vous reprenez la routine accompagnée normalement.',
          'Vous tenez les dix jours&nbsp;: un relevé incomplet ne se lit pas.',
          'Vous réduisez l’exigence de moitié et vous continuez.',
          'Vous confiez la séance à un autre adulte.',
        ],
        bonne: 0,
        pourquoi:
          'Quand la routine devient un moment de tension, le coût dépasse le bénéfice&nbsp;: une compétence acquise dans un moment détesté ne se transfère nulle part. On suspend, on reprend la routine accompagnée comme avant, et ce n’est pas un échec, c’est un réglage. Si la détresse est nette, si une régression apparaît ou si une douleur est possible, on en parle — en équipe, avec un ergothérapeute ou avec un médecin. Continuer, alléger ou changer d’adulte, c’est maintenir l’enseignement au moment précis où il faut le retirer&nbsp;: une routine n’est jamais urgente.',
      },
      {
        enonce:
          'Le relevé donne, du premier au dixième jour&nbsp;: 5, 4, 4, 3, 2, 2, 2, 5, 5, 5. Comment le lisez-vous&nbsp;?',
        options: [
          'L’étape est trop grosse&nbsp;: on la coupe en deux.',
          'Il faut revenir à la main guidée et repartir de zéro.',
          'Le mode d’enseignement était le mauvais&nbsp;: on en change.',
          'Une cause extérieure est probable&nbsp;: on tient le niveau qui marchait, et on cherche ce qui a changé autour.',
        ],
        bonne: 3,
        pourquoi:
          'Une aide qui diminue puis remonte ne se lit pas comme un échec de l’étape&nbsp;: fatigue, maladie, changement d’organisation — c’est le plus souvent autour de la séance que quelque chose a bougé. On tient donc le niveau d’aide qui marchait, le temps de trouver quoi. Couper l’étape est la réponse à une aide qui n’a <em>jamais</em> bougé, pas à une aide qui avait baissé&nbsp;; et revenir à la main guidée annulerait précisément ce qui avait été gagné.',
      },
      {
        enonce:
          'En relisant son relevé, un éducateur compte six jours sur dix où il a aidé avant les cinq secondes. Qu’en fait-il&nbsp;?',
        options: [
          'Il ne le note pas&nbsp;: cela fausserait la lecture du relevé.',
          'Il déplace la séance de quinze minutes plus tôt&nbsp;: cette erreur vient de l’horaire.',
          'Il se concentre davantage et compte les secondes dans sa tête.',
          'Il change d’étape cible&nbsp;: celle-ci est manifestement trop difficile.',
        ],
        bonne: 1,
        pourquoi:
          'Aider avant les cinq secondes est l’erreur la plus commune et la plus invisible, et elle vient de l’horaire, pas de la personne&nbsp;: un créneau serré fait intervenir l’adulte avant que le silence ait fait son travail. C’est aussi la donnée la plus utile du relevé, donc elle se note — l’effacer supprimerait la seule trace de ce qui bloque. La bonne volonté ne compense pas un créneau trop court, et rien ne dit que l’étape soit trop difficile tant que le silence n’a pas été laissé.',
      },
      {
        enonce: 'Quelle phrase de bilan peut entrer telle quelle dans un projet personnalisé&nbsp;?',
        options: [
          '«&nbsp;Progrès en autonomie ce trimestre.&nbsp;»',
          '«&nbsp;Il est plus autonome pour s’habiller.&nbsp;»',
          '«&nbsp;Sur la routine du manteau (six étapes), trois étapes étaient réalisées seules début mars&nbsp;; après deux semaines de travail en chaînage arrière sur l’étape 5, cinq sur six le sont, avec deux professionnels différents.&nbsp;»',
          '«&nbsp;Le travail sur le manteau a bien avancé, il reste une étape.&nbsp;»',
        ],
        bonne: 2,
        pourquoi:
          'Une phrase de bilan contient un point de départ, un point d’arrivée et une durée&nbsp;: c’est ce qui la rend comparable d’un bilan à l’autre et ce qui la fait survivre à un changement d’équipe. Les trois autres ne permettent ni de savoir d’où l’on partait, ni de mesurer quoi que ce soit dans six mois&nbsp;; la dernière nomme bien la routine, mais elle ne chiffre ni le départ, ni l’arrivée, ni la durée.',
      },
    ],
  },
];
