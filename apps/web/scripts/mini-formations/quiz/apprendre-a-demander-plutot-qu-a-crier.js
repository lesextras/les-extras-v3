/**
 * QUIZ — Apprendre à demander plutôt qu’à crier.
 * Un bloc par module, dans l’ordre. Chaque question est ancrée dans le module
 * correspondant : aucune notion qui n’y est pas enseignée.
 */
module.exports = [
  /* ── MODULE 1 ────────────────────────────────────────────────────────────
     Pourquoi un comportement se remplace, et jamais ne s’efface.          */
  {
    questions: [
      {
        enonce:
          'Une équipe décide en réunion&nbsp;: «&nbsp;à partir de lundi, on ne cède plus aux cris de Théo, on tient bon&nbsp;». Rien d’autre n’est prévu. Que dit le module de cette décision&nbsp;?',
        options: [
          'Elle est juste&nbsp;: la fermeté finit toujours par faire baisser le comportement.',
          'Elle est incomplète&nbsp;: on retire un moyen sans en installer un autre, et Théo en trouvera un autre, pas forcément plus acceptable.',
          'Elle est prudente&nbsp;: on observe d’abord, on enseignera le remplacement plus tard.',
          'Elle est neutre&nbsp;: ne plus céder n’enlève rien à la personne.',
        ],
        bonne: 1,
        pourquoi:
          'Le cri est la seule solution connue de Théo pour obtenir ce qu’il cherche&nbsp;: le lui retirer sans rien installer, c’est lui retirer un outil. C’est le mécanisme qui transforme un cri en morsure, puis une morsure en fugue. La règle du module est absolue&nbsp;: on n’éteint jamais un comportement sans enseigner ce qui le remplace. Attendre pour enseigner le remplacement, comme le propose la réponse C, revient exactement au même pendant tout le temps de l’attente.',
      },
      {
        enonce:
          'Le cri d’un jeune sert à échapper à une tâche trop dure. L’équipe met en place un jeton offert chaque fois qu’il tient dix minutes sans crier. Que peut-on en dire&nbsp;?',
        options: [
          'C’est un bon remplacement&nbsp;: le jeton est plus facile à obtenir qu’une crise.',
          'C’est un bon remplacement si le jeton est échangeable contre une pause.',
          'Ce n’est pas un remplacement&nbsp;: le jeton n’obtient pas ce que le cri obtenait, c’est-à-dire une pause ou de l’aide.',
          'C’est un remplacement à condition d’y ajouter des félicitations.',
        ],
        bonne: 2,
        pourquoi:
          'Un remplacement doit obtenir exactement la même chose que le comportement visé, et autant. Ici la fonction est l’échappement&nbsp;: le besoin de sortir de la tâche reste entier, le jeton n’y répond pas, et le cri reviendra dès la première journée difficile. La réponse B a l’air fine, mais elle décrit encore une récompense différée alors que le module demande une demande directe, honorée tout de suite. Un remplacement n’est pas une récompense.',
      },
      {
        enonce:
          'Parmi les quatre conditions, laquelle ne décrit pas le nouveau comportement mais celui qu’on veut voir diminuer&nbsp;?',
        options: [
          'La condition 1 — plus facile.',
          'La condition 2 — plus rapide.',
          'La condition 3 — toujours honorée.',
          'La condition 4 — le comportement ancien cesse de marcher.',
        ],
        bonne: 3,
        pourquoi:
          'Les trois premières décrivent la demande de remplacement&nbsp;; la quatrième décrit ce qu’elle remplace, et c’est elle qui décide du sort des trois autres. Tant que crier obtient encore la sortie de table, la carte n’est pas un remplacement mais une deuxième option, plus lente et moins sûre&nbsp;: la personne gardera les deux, et le plus souvent l’ancienne. C’est la ligne 5 du plan, celle qu’on laisse le plus souvent vide.',
      },
      {
        enonce:
          'Troisième jour du plan. Lina demande une pause vingt fois dans l’heure. L’éducatrice se demande si elle doit commencer à espacer. Que dit le module&nbsp;?',
        options: [
          'On honore à chaque fois&nbsp;: la sur-utilisation est bon signe, l’espacement viendra une fois le mécanisme solide.',
          'On honore une fois sur deux pour éviter l’abus.',
          'On accorde la pause mais on la raccourcit à trente secondes.',
          'On explique à Lina qu’une pause toutes les trois minutes n’est pas raisonnable.',
        ],
        bonne: 0,
        pourquoi:
          'Vingt demandes en une heure veut dire une seule chose&nbsp;: elle a compris. On honore, et on n’espace jamais avant que le mécanisme ne soit installé. Les trois autres réponses cassent la condition 3 ou la condition 2&nbsp;: une demande honorée une fois sur deux enseigne qu’il faut demander puis crier, une pause raccourcie rapporte moins que le cri, et un discours transforme la demande en négociation.',
      },
      {
        enonce:
          'Un jeune de 9 ans parle peu et son langage disparaît dès qu’il est tendu. L’équipe hésite entre lui apprendre à dire «&nbsp;est-ce que je peux avoir une pause s’il vous plaît&nbsp;?&nbsp;» et lui apprendre à taper deux fois sur la table. Que choisir&nbsp;?',
        options: [
          'La phrase&nbsp;: elle le prépare à ce qu’on attendra de lui plus tard.',
          'La phrase, mais raccourcie à «&nbsp;je peux avoir une pause&nbsp;?&nbsp;».',
          'Les deux en parallèle, il utilisera celle qu’il préfère.',
          'Le geste&nbsp;: il coûte moins que le cri qu’il remplace, et il reste disponible en tension.',
        ],
        bonne: 3,
        pourquoi:
          'La condition 1 se juge par comparaison&nbsp;: le remplacement doit coûter moins d’effort que le comportement actuel. Une phrase à composer coûte dix fois plus qu’un cri, elle ne sortira pas au moment où elle servirait — et raccourcir la phrase ne règle rien tant que le langage disparaît en tension. On choisit toujours un cran en dessous de ce qu’on croit possible&nbsp;; on montera plus tard, une fois le mécanisme installé.',
      },
    ],
  },

  /* ── MODULE 2 ────────────────────────────────────────────────────────────
     Une scène qui dérape, et le plan qui manquait.                        */
  {
    questions: [
      {
        enonce:
          'Noé utilise sa carte «&nbsp;pause&nbsp;» toute la première semaine et les cris tombent presque à zéro. Le mardi suivant, les devoirs sont passés à 18&nbsp;h&nbsp;15, l’éducateur est seul avec sept jeunes et répond «&nbsp;attends deux minutes Noé, je reviens&nbsp;». Quelle condition vient de lâcher&nbsp;?',
        options: [
          'La condition 1&nbsp;: la carte est devenue trop difficile à utiliser.',
          'La condition 3&nbsp;: la demande n’a pas été honorée, et un délai est un échec.',
          'Aucune&nbsp;: deux minutes d’attente restent raisonnables.',
          'La condition 4&nbsp;: le comportement ancien obtenait encore quelque chose.',
        ],
        bonne: 1,
        pourquoi:
          '«&nbsp;Attends deux minutes&nbsp;» n’est ni un refus ni une faute professionnelle&nbsp;: c’est un délai — et pour un mécanisme qui repose sur l’immédiateté, un délai est un échec. La condition 4 lâche bien ensuite, quand le cri fait s’arrêter les devoirs, mais elle lâche parce que la troisième a lâché la première. La carte n’a pas changé de coût&nbsp;: c’est l’organisation du soir qui a changé.',
      },
      {
        enonce:
          'Le vendredi, l’équipe note en réunion&nbsp;: «&nbsp;la carte pause ne fonctionne pas avec Noé&nbsp;». Que faut-il en penser&nbsp;?',
        options: [
          'La conclusion est juste&nbsp;: le relevé de la semaine 2 le montre.',
          'La conclusion est prudente&nbsp;: mieux vaut changer d’outil que d’insister.',
          'La conclusion est fausse et coûteuse&nbsp;: la carte a fonctionné une semaine entière, c’est l’organisation du soir qui ne permet pas de l’honorer.',
          'La conclusion est incomplète&nbsp;: il faudrait deux semaines de plus avant de trancher.',
        ],
        bonne: 2,
        pourquoi:
          'La différence entre les deux formulations est capitale&nbsp;: la première enterre l’outil et vise l’enfant, la seconde ouvre une discussion sur le créneau et les moyens. Et elle est vérifiable&nbsp;: la carte a été mesurée pendant sept jours, les cris étaient tombés presque à zéro. Relancer le plan à l’identique ou changer d’outil sans corriger la condition qui a lâché répéterait l’échec, et l’équipe se démobiliserait pour de bon.',
      },
      {
        enonce:
          'Le comportement d’un jeune sert à obtenir de l’attention, et l’adulte n’est pas toujours disponible dans la minute. Quelle version du remplacement tient&nbsp;?',
        options: [
          'Une version auto-servie&nbsp;: il se sert lui-même de l’attention dont il a besoin.',
          'Un rendez-vous fixe et garanti&nbsp;: «&nbsp;je viens te voir à la fin de l’exercice&nbsp;», minuteur visible posé, et on tient l’heure.',
          'Une carte «&nbsp;attention&nbsp;» posée sur la table, honorée quand c’est possible.',
          'On lance quand même le plan&nbsp;: on verra bien ce que le relevé donne.',
        ],
        bonne: 1,
        pourquoi:
          'Sur la fonction attention, l’auto-service est impossible par définition&nbsp;: il faut quelqu’un. La condition 3 ne se tient donc pas par un dispositif, elle se tient par un créneau — et si le créneau ne peut pas être garanti, on ne lance pas le plan. «&nbsp;Honorée quand c’est possible&nbsp;» est exactement ce qui est arrivé à Noé le mardi soir&nbsp;; lancer pour voir revient à enseigner l’escalade pendant qu’on observe.',
      },
      {
        enonce:
          'Le plan tient depuis dix jours. Samedi, un remplaçant qui n’était pas en réunion prend le service. Que faut-il avoir préparé&nbsp;?',
        options: [
          'Un protocole écrit de trois pages, laissé dans le classeur de l’unité.',
          'Rien de particulier&nbsp;: on lui expliquera à sa prise de poste s’il pose la question.',
          'Une phrase affichée là où il passe&nbsp;: «&nbsp;quand il fait ceci, ça veut dire cela, et il faut faire cela&nbsp;».',
          'Une consigne de suspendre le plan le week-end, pour ne pas prendre de risque.',
        ],
        bonne: 2,
        pourquoi:
          'Les remplaçants et les week-ends font tomber les plans, et jamais par mauvaise volonté&nbsp;: un adulte bienveillant qui ne sait pas fait exactement l’inverse du plan, en toute bonne foi. Une phrase affichée se lit&nbsp;; un protocole de trois pages est rangé, pas appliqué. Et suspendre le plan deux jours, c’est faire lâcher la condition 3 tous les samedis, donc enseigner qu’il faut crier le week-end.',
      },
      {
        enonce:
          'À la maison, Lina déchire sa feuille de devoirs et quitte la table. Le plan est en cours. Que fait-on&nbsp;?',
        options: [
          'On la ramène à la table et on la fait rester jusqu’à ce que la feuille soit finie.',
          'On arrête les devoirs pour ce soir&nbsp;: elle est trop énervée.',
          'On remplace la feuille sans commentaire et la tâche reprend, raccourcie&nbsp;: deux lignes au lieu de dix.',
          'On lui explique longuement pourquoi déchirer une feuille n’est pas acceptable.',
        ],
        bonne: 2,
        pourquoi:
          'La tâche ne disparaît pas parce qu’on a déchiré la feuille — sinon le comportement ancien obtient encore ce qu’il visait — mais elle se réduit, parce que la fermeté porte sur la tâche et jamais sur la personne&nbsp;: on ne retient personne à une table. Arrêter les devoirs renforce directement l’échappement, et un long discours est de l’attention qui fait durer le moment.',
      },
    ],
  },

  /* ── MODULE 3 ────────────────────────────────────────────────────────────
     Exercice guidé : le plan de remplacement en six lignes.               */
  {
    questions: [
      {
        enonce: 'Quand enseigne-t-on la demande de remplacement&nbsp;?',
        options: [
          'Au moment où la tension monte, pour que la personne fasse le lien.',
          'À froid, dans des situations faciles, cinq à dix fois par jour les premiers jours.',
          'Une fois, calmement, en expliquant bien la règle du jeu.',
          'Juste après une crise, quand le calme revient et que la personne est réceptive.',
        ],
        bonne: 1,
        pourquoi:
          'En tension, personne n’apprend — ni la personne, ni l’adulte. Une demande enseignée en pleine crise n’est pas enseignée, elle est subie. On crée de petites occasions faciles, dans des moments calmes, et on répète&nbsp;: une explication unique n’installe pas un geste qui devra sortir tout seul au pire moment.',
      },
      {
        enonce:
          'Pour «&nbsp;faire travailler&nbsp;» la carte «&nbsp;aide&nbsp;», un éducateur décide de placer volontairement le matériel hors de portée et d’imposer un exercice pénible. Que dit le module&nbsp;?',
        options: [
          'C’est efficace&nbsp;: la demande apparaîtra plus vite si le besoin est fort.',
          'C’est acceptable une fois par jour, pas davantage.',
          'C’est à proscrire&nbsp;: on travaille sur des occasions naturelles et faciles.',
          'C’est utile si on prévient la personne à l’avance.',
        ],
        bonne: 2,
        pourquoi:
          'Fabriquer une frustration pour provoquer la demande enseigne surtout que l’adulte est imprévisible, et ce qui s’apprend là ne se désapprend pas. Les occasions naturelles sont nombreuses et suffisent&nbsp;: une tâche facile, courte, dans un moment calme, avec trois secondes d’attente puis une guidance légère. Doser ou annoncer le piège n’en change pas la nature.',
      },
      {
        enonce:
          'Quelle formulation peut entrer telle quelle sur la ligne 5 du plan — la réponse au comportement ancien&nbsp;?',
        options: [
          '«&nbsp;Je reste calme et je lui explique pourquoi ce n’est pas la bonne façon de faire.&nbsp;»',
          '«&nbsp;Je le retiens à la table jusqu’à ce qu’il ait terminé, sinon il aura gagné.&nbsp;»',
          '«&nbsp;Je m’adapte selon le moment et selon la personne qui est là.&nbsp;»',
          '«&nbsp;Je dis une seule fois "la feuille reste là", je m’éloigne d’un pas, je ne réponds plus&nbsp;; dès qu’il s’est arrêté, je propose une tâche facile et j’honore la carte à la première demande.&nbsp;»',
        ],
        bonne: 3,
        pourquoi:
          'La ligne 5 doit être neutre, ne pas donner ce que le comportement visait, et être suivie d’une occasion de demander correctement&nbsp;: la réponse D fait les trois, en trois phrases, applicables par quelqu’un qui n’était pas en réunion. Expliquer longuement est de l’attention, donc souvent ce que le plan cherche à réduire. Retenir quelqu’un franchit la limite absolue&nbsp;: la fermeté se tient sur la tâche, jamais sur le corps de la personne — si la tâche ne peut pas rester posée sans contrainte, c’est qu’elle est trop grosse, et on la réduit. Et une réponse qui varie selon l’heure et la fatigue est précisément ce qui installe les comportements les plus tenaces.',
      },
      {
        enonce:
          'À partir de quand peut-on commencer à espacer, c’est-à-dire à introduire une attente&nbsp;?',
        options: [
          'Dès que la demande apparaît régulièrement, en général au bout de trois ou quatre jours.',
          'Après au moins deux semaines consécutives où la demande est utilisée à la place du comportement ancien.',
          'Dès que le comportement ancien a totalement disparu.',
          'Quand l’organisation ne permet plus d’honorer à chaque fois.',
        ],
        bonne: 1,
        pourquoi:
          'On ne réduit rien avant que le mécanisme ne soit solide, et solide a une définition précise&nbsp;: deux semaines consécutives de demande utilisée à la place du comportement ancien. Espacer au bout de quatre jours, c’est faire lâcher la condition 3 juste au moment où elle s’installe. Attendre la disparition totale ferait attendre indéfiniment&nbsp;: ce qui compte, c’est que l’ancien devienne minoritaire. Et une organisation qui ne permet plus d’honorer n’est pas une raison d’espacer&nbsp;: c’est une raison de revoir le plan.',
      },
      {
        enonce:
          'Le plan tient depuis un mois. On vient d’introduire une attente annoncée d’une minute, et le comportement ancien réapparaît trois fois en deux jours. Que fait-on&nbsp;?',
        options: [
          'On revient au cran précédent quelques jours, puis on repart.',
          'On maintient l’attente&nbsp;: céder maintenant annulerait un mois de travail.',
          'On recommence le plan depuis le début, avec une nouvelle forme de demande.',
          'On conclut que le remplacement visait la mauvaise fonction.',
        ],
        bonne: 0,
        pourquoi:
          'C’est le mécanisme normal&nbsp;: dès qu’un moyen rapporte un peu moins, l’ancien réapparaît pour vérifier. Le signal dit qu’on est allé d’un cran trop loin, pas que le plan ne tient pas — on remet le cran précédent quelques jours et on repart. Attendez-vous à la même chose aux changements&nbsp;: nouvel adulte, nouveau lieu, retour de vacances, remplaçant du samedi. Tout reprendre depuis le début coûterait un mois pour rien, et remettre la fonction en cause après un mois de résultats reviendrait à défaire ce qui marche.',
      },
    ],
  },

  /* ── MODULE 4 ────────────────────────────────────────────────────────────
     Quatorze jours d’application, et la lecture du relevé.                */
  {
    questions: [
      {
        enonce:
          'Troisième jour du plan. Le relevé montre que les cris ont augmenté par rapport à la semaine d’avant. Une collègue propose d’arrêter avant que ça n’empire. Que répondez-vous&nbsp;?',
        options: [
          'Elle a raison&nbsp;: trois jours suffisent à voir qu’un plan ne prend pas.',
          'On continue, mais en cédant au cri quand il dure trop longtemps.',
          'C’est la remontée passagère, elle est attendue&nbsp;: les cinq premiers jours, on ne regarde que la colonne de la demande.',
          'On change de forme de demande dès ce soir, et on garde le reste.',
        ],
        bonne: 2,
        pourquoi:
          'Ce qui marchait ne marche plus aussi bien, alors la personne essaie plus fort&nbsp;: la deuxième colonne monte, c’est prévu, et c’est le moment exact où la plupart des plans sont abandonnés. Ce qui décide au troisième jour, c’est de savoir si la demande apparaît — une seule fois le premier jour est déjà une victoire. Céder pendant cette phase enseigne qu’il faut insister davantage, et le comportement revient plus intense qu’avant&nbsp;: c’est le scénario le plus coûteux du parcours.',
      },
      {
        enonce:
          'Au quatorzième jour, la colonne de la demande monte nettement, mais la colonne du comportement ancien ne baisse pas. Que faut-il reprendre&nbsp;?',
        options: [
          'La forme de la demande&nbsp;: elle est sans doute trop coûteuse.',
          'La ligne 5 du plan&nbsp;: que se passe-t-il vraiment après le comportement ancien&nbsp;?',
          'Le relevé&nbsp;: il a probablement été mal tenu.',
          'La fonction&nbsp;: le remplacement vise à côté.',
        ],
        bonne: 1,
        pourquoi:
          'La demande est utilisée en plus du comportement, pas à sa place&nbsp;: c’est la signature de la condition 4, le comportement ancien obtient encore ce qu’il visait. La forme n’est pas en cause, puisque la demande monte&nbsp;; et la fonction non plus, pour la même raison — un remplacement construit sur la mauvaise fonction ne produit rien du tout, la première colonne resterait à zéro.',
      },
      {
        enonce:
          'Au quatorzième jour, la colonne de la demande est restée à zéro ou presque. Quelles sont les deux corrections à engager&nbsp;?',
        options: [
          'Ajouter une récompense à la demande, et rappeler la règle chaque matin.',
          'Prolonger le relevé de deux semaines, et changer de fonction.',
          'Descendre d’un cran dans les formes de demande, et l’enseigner à froid cinq à dix fois par jour.',
          'Augmenter la durée de la pause obtenue, et la donner sans attendre.',
        ],
        bonne: 2,
        pourquoi:
          'Une demande qui n’apparaît pas est trop coûteuse, ou elle n’a pas été enseignée dans des situations faciles&nbsp;: on descend d’un cran — phrase vers mot, mot vers carte, carte vers geste — et on multiplie les occasions à froid. Ajouter une récompense transforme le remplacement en autre chose, prolonger sans rien changer répète l’échec, et rallonger la pause ne sert à rien tant que la demande ne sort pas.',
      },
      {
        enonce:
          'Vous présentez le bilan des quatorze jours en réunion. Quelle formulation transmet réellement le résultat&nbsp;?',
        options: [
          '«&nbsp;Ça va nettement mieux depuis qu’on a posé la carte.&nbsp;»',
          '«&nbsp;Il a utilisé la carte 84 fois du 3 au 17 mars, et les cris sont passés de 6 par jour la première semaine à 2 la seconde. Je propose de tenir le plan à l’identique deux semaines de plus.&nbsp;»',
          '«&nbsp;La carte fonctionne bien avec lui, il a compris le principe.&nbsp;»',
          '«&nbsp;C’est encore fragile, mais l’équipe sent une amélioration.&nbsp;»',
        ],
        bonne: 1,
        pourquoi:
          'Ce qui circule doit contenir un nombre&nbsp;: «&nbsp;ça va mieux&nbsp;» ne se discute pas et ne se compare pas d’un mois sur l’autre, donc ne survit pas au changement d’équipe. La bonne phrase donne les deux colonnes, la période, et la suite proposée — c’est ce qui permet à quelqu’un d’autre de dire s’il est d’accord. Et l’à-retenir du module rappelle que le comportement ancien n’a pas besoin de disparaître&nbsp;: il doit devenir minoritaire.',
      },
      {
        enonce:
          'Au bout de dix jours, le comportement s’est nettement aggravé, l’enfant dort mal et mange moins, et vous vous sentez seul avec la situation. Que faites-vous&nbsp;?',
        options: [
          'Vous tenez jusqu’au quatorzième jour&nbsp;: un relevé incomplet ne prouve rien.',
          'Vous durcissez la ligne 5 pour reprendre la main.',
          'Vous suspendez le plan et vous demandez un appui — médical, pluridisciplinaire ou de supervision.',
          'Vous changez à la fois la forme de la demande, le moment et la réponse au comportement ancien.',
        ],
        bonne: 2,
        pourquoi:
          'Trois des quatre signaux d’arrêt sont réunis&nbsp;: aggravation nette au-delà de la première semaine, changement de sommeil et d’appétit, et le sentiment d’être seul avec la situation. Dans ces cas-là on suspend et on passe la main&nbsp;: savoir s’arrêter fait partie de la compétence, et aucun relevé ne vaut plus que cela. Modifier trois réglages d’un coup rendrait de toute façon le relevé illisible — on ne change qu’une chose à la fois.',
      },
    ],
  },
];
