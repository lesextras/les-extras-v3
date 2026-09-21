/**
 * QUIZ — Mesurer un comportement : ligne de base et courbe.
 *
 * Un bloc par module, dans l'ordre. Chaque question est ancrée dans le module
 * correspondant : aucune notion qui n'y est pas enseignée, et aucune réponse
 * qui suppose un autre parcours du catalogue (les renvois restent des renvois).
 *
 * ⚠ LES MAUVAISES RÉPONSES SONT LES ERREURS RÉELLES DU MÉTIER, pas des
 * absurdités : conclure sur trois jours, prendre la moyenne, compter un mot au
 * lieu d'un geste, attribuer à son dispositif une pente qui descendait déjà.
 * Une option manifestement fausse ne teste rien.
 *
 * ⚠ LES GARDE-FOUS TIENNENT DANS LES QUESTIONS COMME DANS LE TEXTE : aucune
 * bonne réponse ne fait mesurer ce qui gêne l'équipe, ni attendre dix jours
 * quand quelqu'un se met en danger, ni accoler un chiffre à un nom.
 */
module.exports = [
  /* ── MODULE 1 — Ce qu'on mesure, et ce qu'on ne mesure pas ─────────────── */
  {
    questions: [
      {
        enonce:
          'Une équipe veut suivre «&nbsp;les crises de Nour&nbsp;» et ouvre une feuille de relevé dès le lendemain. Qu’est-ce qui manque&nbsp;?',
        options: [
          'Un tableur, parce qu’un relevé sur papier se perd.',
          'Le choix entre fréquence et durée, qui se fera au bout de quelques jours de relevé.',
          'Une description filmable de ce qu’on compte&nbsp;: «&nbsp;crise&nbsp;» est un mot, et deux collègues ne mettront pas la même chose derrière.',
          'L’accord de la direction, sans lequel aucun relevé ne peut commencer.',
        ],
        bonne: 2,
        pourquoi:
          'Tant que le comportement est nommé par un mot et non par un geste, la courbe mesurera qui était de service plutôt que ce qui s’est passé. C’est l’erreur qui ruine le plus de relevés, et elle se produit à la première ligne. Le choix de l’unité vient APRÈS la description, jamais après quelques jours de relevé&nbsp;: on ne change pas d’unité en cours de route sous peine de perdre tout ce qu’on a. Et le papier affiché là où le comportement se produit est précisément ce que le module 3 recommande, contre le tableur que personne n’ouvre.',
      },
      {
        enonce:
          'Avant de choisir une unité, le module fait écrire une phrase. Laquelle, et pourquoi décide-t-elle de tout&nbsp;?',
        options: [
          'À qui le comportement coûte, et en quoi — parce que si la réponse est «&nbsp;à l’équipe&nbsp;», on fabrique un outil de surveillance.',
          'Ce que la personne obtient par ce comportement — pour identifier sa fonction.',
          'Qui sera chargé du relevé — pour que le travail soit réparti dès le départ.',
          'Depuis combien de temps le comportement dure — pour savoir s’il est installé.',
        ],
        bonne: 0,
        pourquoi:
          'C’est la première question du parcours et elle décide s’il y a lieu de mesurer. Un comportement qui coûte à la personne — il l’isole, la blesse, lui ferme une activité — se mesure pour l’aider. Un comportement qui ne fait que gêner l’équipe produirait une feuille qui a l’apparence d’un outil clinique et la fonction d’un outil de surveillance. L’ancienneté ne change rien à cette décision&nbsp;; la fonction du comportement relève d’un autre parcours et n’est pas ce qu’on mesure ici&nbsp;; et la répartition du relevé est une question du module 3.',
      },
      {
        enonce:
          'Un jeune fait une seule crise par jour, mais elle dure entre trente et cinquante minutes. L’équipe relève la fréquence. Après un mois de dispositif, les crises durent huit minutes. Que montre la courbe&nbsp;?',
        options: [
          'Une dégradation, parce que la fréquence n’a pas baissé.',
          'Une amélioration, mais qu’il faudrait confirmer par un second mois de relevé.',
          'Une nette amélioration, puisque la durée a été divisée par cinq.',
          'Rien du tout&nbsp;: elle affiche 1 avant et 1 après. L’unité choisie ne voit pas ce qui a changé.',
        ],
        bonne: 3,
        pourquoi:
          'C’est l’illustration directe de la règle «&nbsp;une unité choisie sur le problème&nbsp;». Ici, ce qui gâchait la journée était la durée, pas le retour&nbsp;: la fréquence affiche 1 et 1, et un progrès considérable devient invisible. La courbe ne montre ni amélioration ni dégradation — elle ne montre rien, ce qui est le pire résultat possible pour un mois de relevé. Un second mois avec la même unité ne ferait pas apparaître davantage.',
      },
      {
        enonce:
          'Pourquoi le module déconseille-t-il l’échelle d’intensité de 1 à 5, alors que c’est ce que les équipes demandent le plus souvent&nbsp;?',
        options: [
          'Parce que l’intensité n’a pas d’importance clinique à côté de la fréquence.',
          'Parce qu’elle s’estime au lieu de se compter&nbsp;: elle varie avec la fatigue de celui qui note, et donne des chiffres qui ressemblent à des données sans en être.',
          'Parce qu’une échelle à cinq niveaux est trop fine pour être tenue sur dix jours.',
          'Parce qu’elle exige un logiciel de saisie que les établissements n’ont pas.',
        ],
        bonne: 1,
        pourquoi:
          'Le besoin est réel — l’intensité fait la différence entre une journée acceptable et une journée terrible — et le module ne le nie pas. Le problème est la fiabilité&nbsp;: une estimation bouge avec la fatigue, avec la veille, avec l’affection qu’on porte à la personne. D’où la solution robuste&nbsp;: remplacer l’intensité par une question fermée et comptable («&nbsp;a-t-il fallu faire sortir les autres&nbsp;: oui/non&nbsp;»). L’échelle reste possible, mais seulement avec des niveaux décrits par des faits ET le test d’accord du module 3.',
      },
      {
        enonce:
          'Une note de synthèse va être rédigée. Laquelle de ces formulations le parcours autorise-t-il&nbsp;?',
        options: [
          '«&nbsp;Le score comportemental de Samir s’est amélioré de 30&nbsp;%.&nbsp;»',
          '«&nbsp;Samir se situe à un niveau 3 d’opposition.&nbsp;»',
          '«&nbsp;Les départs de table sans retour dans la minute, au repas du soir, ont été relevés 4 fois sur 10 jours.&nbsp;»',
          '«&nbsp;Samir est plus agité que les autres jeunes du groupe.&nbsp;»',
        ],
        bonne: 2,
        pourquoi:
          'On mesure un comportement, dans un contexte, sur une période — jamais quelqu’un. La bonne formulation nomme le geste, le créneau, le lieu, le nombre et la durée d’observation&nbsp;: elle est vérifiable et elle ne dit rien sur la personne. Les trois autres accolent un chiffre ou un jugement à un nom. Ce genre de phrase est recopié dans le dossier suivant, survit à l’équipe qui l’a produite, et devient une caractéristique de la personne. La comparaison entre usagers est par ailleurs explicitement écartée par la fiche 7&nbsp;: deux courbes n’ont ni le même comportement derrière, ni le même contexte.',
      },
    ],
  },

  /* ── MODULE 2 — La ligne de base ───────────────────────────────────────── */
  {
    questions: [
      {
        enonce:
          'Une équipe met trois choses en place le lundi et constate une nette amélioration le vendredi. Quelle est l’explication la plus probable selon le module&nbsp;?',
        options: [
          'On a agi après une très mauvaise semaine, qui est par définition suivie d’une semaine plus ordinaire — qu’on fasse quelque chose ou non.',
          'La plus efficace des trois mesures a produit l’effet&nbsp;; les deux autres sont neutres.',
          'Le personnel s’est mobilisé, et c’est cette mobilisation qu’il faut entretenir.',
          'Les trois mesures se renforcent mutuellement&nbsp;: il faut les maintenir toutes les trois.',
        ],
        bonne: 0,
        pourquoi:
          'Une équipe décide d’agir quand elle n’en peut plus, c’est-à-dire au pire moment&nbsp;: la suite sera meilleure quoi qu’il arrive. C’est le piège principal du module, et il n’épargne personne. Deux autres mécanismes s’y ajoutent — l’effet de nouveauté, qui s’éteint en une à deux semaines, et le fait que relever rend l’équipe plus attentive dès le premier jour. Quant à savoir laquelle des trois mesures a compté&nbsp;: on ne le saura jamais, et c’est précisément pourquoi le module en impose une seule à la fois.',
      },
      {
        enonce:
          'Que fait-on, exactement, pendant les dix jours de ligne de base&nbsp;?',
        options: [
          'On teste discrètement une première mesure pour ne pas perdre de temps.',
          'On observe sans rien noter, pour ne pas influencer le comportement.',
          'On suspend les interventions en cours pour observer le comportement à l’état brut.',
          'On continue tout ce qui est déjà en place, et on n’ajoute aucune nouveauté. On relève, c’est tout.',
        ],
        bonne: 3,
        pourquoi:
          'La ligne de base n’est pas une suspension de l’accompagnement, c’est une suspension des NOUVEAUTÉS&nbsp;: tout ce qui existe reste en place. C’est ce qui la rend acceptable pour une équipe, et c’est ce qu’il faut dire pour qu’elle tienne. Suspendre l’existant serait dégrader la situation exprès. Tester «&nbsp;discrètement&nbsp;» quelque chose annule la ligne de base et oblige à tout recommencer. Et ne rien noter reviendrait à se retrouver, au onzième jour, sans le point de comparaison qui est toute la raison d’être de l’exercice.',
      },
      {
        enonce:
          'Un résident se blesse en se frappant la tête contre le mur, plusieurs fois par semaine. Que dit le module&nbsp;?',
        options: [
          'On fait la ligne de base de dix jours&nbsp;: sans elle, on ne pourra rien conclure.',
          'On agit immédiatement et on commence à relever en même temps, en écrivant sur la feuille qu’il n’y a pas de ligne de base.',
          'On raccourcit la ligne de base à trois jours pour faire un compromis.',
          'On renonce à mesurer&nbsp;: la sécurité et la mesure sont incompatibles.',
        ],
        bonne: 1,
        pourquoi:
          'Aucune ligne de base ne justifie de regarder quelqu’un se blesser pendant dix jours — et c’est écrit en encadré dans le module. On agit tout de suite. La courbe qui suivra ne PROUVERA rien (on ne pourra pas attribuer l’évolution au dispositif), mais elle INFORMERA quand même&nbsp;: elle dira si ça s’améliore, se dégrade ou stagne, ce qui vaut infiniment mieux que des souvenirs. Une ligne de base de trois jours n’est pas un compromis, c’est un relevé illisible&nbsp;: elle ne permet même pas de voir la variabilité ordinaire.',
      },
      {
        enonce:
          'Pourquoi dix jours plutôt qu’une semaine&nbsp;?',
        options: [
          'Parce qu’en dessous de dix jours, la médiane ne peut pas être calculée.',
          'Pour couvrir deux week-ends et lisser l’effet du calendrier.',
          'Parce qu’avec cinq points, deux journées atypiques représentent 40&nbsp;% de ce qu’on sait&nbsp;; avec dix, elles en représentent 20&nbsp;% et on voit à quoi ressemble une journée ordinaire.',
          'Parce que c’est la durée recommandée par la HAS pour les observations en ESSMS.',
        ],
        bonne: 2,
        pourquoi:
          'Ce qu’on cherche, ce n’est pas un nombre&nbsp;: c’est de savoir à quoi ressemble une journée ordinaire, et de combien elle varie toute seule. Cinq points ne le donnent pas. Attention à l’option qui invoque une recommandation&nbsp;: aucune recommandation HAS ne porte sur la durée des relevés comportementaux, et le parcours ne s’adosse à aucun texte sur ce point — c’est une règle de métier, présentée comme telle. La médiane, elle, se calcule sur n’importe quel nombre de valeurs&nbsp;; c’est sa fiabilité qui dépend du nombre de points.',
      },
      {
        enonce:
          'Le onzième jour, l’équipe met en place le dispositif prévu. Qu’est-ce qui doit impérativement apparaître sur la feuille&nbsp;?',
        options: [
          'La date du changement, entourée&nbsp;: c’est le trait vertical sans lequel la courbe ne se lira pas.',
          'L’objectif chiffré qu’on se fixe pour les dix jours suivants.',
          'La signature du chef de service validant la mise en place.',
          'Le nom du professionnel qui a proposé le dispositif.',
        ],
        bonne: 0,
        pourquoi:
          'Sans ce repère, on se retrouve au module 4 avec vingt points et aucun moyen de dire où commence l’après. C’est le détail le plus simple du parcours et celui qu’on oublie le plus souvent, parce qu’au onzième jour on est occupé par la mise en place elle-même. Un objectif chiffré fixé d’avance est même contre-productif ici&nbsp;: il pousse à lire la courbe en cherchant à atteindre un nombre plutôt qu’à voir ce qui s’est passé.',
      },
    ],
  },

  /* ── MODULE 3 — La feuille, le test, les dix jours ─────────────────────── */
  {
    questions: [
      {
        enonce:
          'Un jour où le comportement ne s’est pas produit du tout&nbsp;: que met-on dans la colonne «&nbsp;mesure&nbsp;»&nbsp;?',
        options: [
          'On écrit «&nbsp;RAS&nbsp;», qui est plus clair qu’un zéro.',
          'On saute la ligne et on passe au lendemain.',
          'On laisse la case vide, puisqu’il n’y a rien à noter.',
          'On écrit «&nbsp;0&nbsp;»&nbsp;: un jour sans rien est une donnée, et une case vide se confondra plus tard avec un jour non relevé.',
        ],
        bonne: 3,
        pourquoi:
          'Zéro et «&nbsp;non relevé&nbsp;» sont deux informations opposées, et une case vide ne permet plus de les distinguer. Au module 4, un trou dans la courbe rendra toute la période douteuse&nbsp;: on ne saura pas si la journée était calme ou si personne n’était là. «&nbsp;RAS&nbsp;» pose le même problème qu’une case vide&nbsp;: ce n’est pas un nombre, donc ça ne se trace pas et ça n’entre pas dans le calcul de la médiane. La feuille prévoit d’ailleurs explicitement la mention «&nbsp;non relevé&nbsp;» pour l’autre cas.',
      },
      {
        enonce:
          'Test d’accord sur le même créneau&nbsp;: Claire compte 2, Mehdi compte 5. Que conclut-on&nbsp;?',
        options: [
          'Mehdi a été plus attentif&nbsp;: on retient 5 et on lui confie le relevé.',
          'La définition du comportement laisse de la place à l’interprétation&nbsp;: on la réécrit ensemble et on refait le test.',
          'On prend la moyenne des deux, soit 3,5.',
          'Le comportement est trop irrégulier pour être mesuré&nbsp;: on change de situation.',
        ],
        bonne: 1,
        pourquoi:
          'Aucun des deux n’a mal regardé&nbsp;: c’est la phrase du module 1 qui est trop courte, et le test vient de le révéler. Dans l’exemple du module, Mehdi comptait les allers-retours à la cuisine, Claire non, parce que le jeune revenait s’asseoir — la définition devient «&nbsp;quitte la table et ne revient pas s’asseoir dans la minute&nbsp;», et le nouveau test donne 2 et 2. Confier le relevé au «&nbsp;plus attentif&nbsp;» ne règle rien dès que deux personnes relèvent&nbsp;; et faire une moyenne de deux comptages qui ne portent pas sur la même chose ne produit qu’un nombre sans objet.',
      },
      {
        enonce:
          'Dix jours de ligne de base&nbsp;: 2, 3, 2, 4, 3, 14, 2, 3, 4, 3. Quel repère retient-on, et pourquoi&nbsp;?',
        options: [
          'Le minimum, 2&nbsp;: c’est le niveau qu’on vise.',
          'La moyenne, 4&nbsp;: elle tient compte de toutes les journées, y compris les difficiles.',
          'La médiane, 3&nbsp;: la journée à 14 tirerait la moyenne vers le haut et ferait croire, plus tard, à un progrès qui n’a pas eu lieu.',
          'Le maximum, 14&nbsp;: c’est le pire qu’on ait à traiter.',
        ],
        bonne: 2,
        pourquoi:
          'La médiane décrit la journée ordinaire&nbsp;; la moyenne décrit la journée ordinaire déformée par les exceptions. Avec la moyenne à 4 comme repère, une période ultérieure à 3,5 passerait pour une amélioration alors qu’il s’agit simplement du retour à l’ordinaire. C’est la même logique qui interdit de prendre le maximum (une seule journée, souvent explicable par la colonne «&nbsp;inhabituel&nbsp;») ou le minimum (un objectif, pas un point de départ).',
      },
      {
        enonce:
          'Pourquoi le module insiste-t-il pour que la courbe soit tracée à la main, sur du papier quadrillé affiché à côté de la feuille&nbsp;?',
        options: [
          'Parce qu’un point tracé chaque soir prend dix secondes et se regarde en passant, alors qu’un tableur ne sera pas ouvert.',
          'Parce que le papier est le seul support admis par la réglementation.',
          'Parce que tracer à la main permet de repérer les erreurs de saisie.',
          'Parce qu’un tableur fausse les calculs de médiane.',
        ],
        bonne: 0,
        pourquoi:
          'C’est la même logique que la feuille punaisée&nbsp;: ce qui vit dans un ordinateur n’est pas rempli, et surtout n’est pas REGARDÉ. Une courbe affichée se consulte en passant, par toute l’équipe, ce qui est exactement l’effet recherché. Un tableur ne fausse aucun calcul et aucune réglementation n’impose le papier&nbsp;: l’argument est entièrement pratique, et c’est ce qui le rend solide.',
      },
      {
        enonce:
          'Un collègue propose de remplir la feuille le vendredi pour toute la semaine, «&nbsp;pour gagner du temps&nbsp;». Que répondre&nbsp;?',
        options: [
          'C’est acceptable pour la ligne de base, mais pas après l’intervention.',
          'C’est préférable&nbsp;: on évite ainsi que le relevé influence le comportement.',
          'C’est acceptable si la même personne s’en charge chaque semaine.',
          'Ce n’est plus une mesure mais un souvenir — c’est-à-dire exactement ce que le relevé devait remplacer.',
        ],
        bonne: 3,
        pourquoi:
          'Tout le parcours part du constat que nous retenons ce qui a frappé, pas ce qui s’est passé&nbsp;: un incident marquant pèse plus lourd que douze journées calmes. Reconstituer la semaine le vendredi restitue exactement ce biais, et la feuille ne sert plus à rien. La régularité de la personne qui reconstitue n’y change rien. Quant à l’influence du relevé sur le comportement, le module 2 l’identifie comme un effet réel — mais c’est un effet plutôt favorable, et en aucun cas une raison de fausser les données.',
      },
    ],
  },

  /* ── MODULE 4 — Lire la courbe ─────────────────────────────────────────── */
  {
    questions: [
      {
        enonce:
          'Trois jours de suite, la mesure est nettement plus basse que pendant toute la ligne de base. Que fait-on&nbsp;?',
        options: [
          'On conclut que le dispositif fonctionne et on l’étend aux autres situations.',
          'On note le signal, on continue de relever cinq jours de plus, et on regarde si ça tient.',
          'On ne tient pas compte de trois points&nbsp;: il en faut dix pour conclure quoi que ce soit.',
          'On arrête le relevé&nbsp;: l’objectif est atteint.',
        ],
        bonne: 1,
        pourquoi:
          'Trois points consécutifs hors de la zone habituelle font un SIGNAL&nbsp;: c’est assez pour ne plus parler de hasard, et pas assez pour conclure. La règle qui donne son titre au parcours dit les deux choses en même temps — un ou deux points ne sont rien, trois méritent qu’on continue en regardant. Ignorer le signal ferait rater ce qu’on cherche&nbsp;; étendre le dispositif ou arrêter le relevé sur trois jours, c’est exactement le défaut que le parcours existe pour réparer.',
      },
      {
        enonce:
          'Ligne de base&nbsp;: 6, 6, 5, 5, 4, 4, 4, 3, 3, 3. Après intervention&nbsp;: 3, 2, 2, 2, 1, 2, 1, 1, 2, 1. Que peut-on dire&nbsp;?',
        options: [
          'Il faut refaire une ligne de base après l’intervention pour pouvoir comparer.',
          'Le dispositif a fait baisser le comportement de moitié&nbsp;: la médiane passe de 4 à 2.',
          'On ne peut pas conclure&nbsp;: la ligne de base descendait déjà, et la suite est peut-être la continuation de ce mouvement.',
          'Le dispositif n’a eu aucun effet, puisque la pente est identique avant et après.',
        ],
        bonne: 2,
        pourquoi:
          'C’est le piège de la pente, et c’est la raison pour laquelle on trace la ligne de base au lieu de la résumer par un nombre. La médiane a bien baissé de 4 à 2, mais une courbe qui descendait déjà de 6 à 3 avant qu’on ne touche à quoi que ce soit interdit de s’attribuer la descente qui suit. «&nbsp;On ne peut pas conclure&nbsp;» est ici la réponse honnête, et c’est celle qu’il faut oser dire en réunion. Affirmer l’absence d’effet serait aussi peu fondé que d’affirmer l’inverse.',
      },
      {
        enonce:
          'Une courbe passe de «&nbsp;0, 8, 1, 7, 0, 9&nbsp;» à «&nbsp;3, 4, 3, 4, 3, 4&nbsp;». La moyenne est identique. Que dit le module&nbsp;?',
        options: [
          'Les journées catastrophiques ont disparu&nbsp;: c’est un vrai progrès, celui que les équipes ratent le plus souvent.',
          'La deuxième série est suspecte&nbsp;: une régularité pareille indique un relevé mal fait.',
          'Il faut attendre que le niveau baisse pour parler de progrès.',
          'Rien n’a changé&nbsp;: le niveau est le même.',
        ],
        bonne: 0,
        pourquoi:
          'La variabilité est la troisième question, et c’est celle qui passe inaperçue quand on ne regarde que la moyenne. Pour la personne, la différence entre les deux séries est considérable&nbsp;: les journées à 8 et à 9 ont disparu. C’est souvent le premier effet visible d’un dispositif, avant même que le niveau ne bouge. Soupçonner le relevé au seul motif qu’il est régulier reviendrait à ne jamais pouvoir constater ce type de progrès.',
      },
      {
        enonce:
          'La courbe chute nettement à partir d’un vendredi, puis remonte quinze jours plus tard. Par quoi commence-t-on&nbsp;?',
        options: [
          'Par recalculer la médiane sur l’ensemble de la période.',
          'Par refaire un test d’accord avec l’équipe.',
          'Par renforcer le dispositif, qui a visiblement produit un effet temporaire.',
          'Par relire la colonne «&nbsp;inhabituel&nbsp;»&nbsp;: le calendrier est la cause n°1 des variations spectaculaires.',
        ],
        bonne: 3,
        pourquoi:
          'Une chute qui commence un vendredi et dure quinze jours a toutes les allures de vacances scolaires — et le module range le calendrier en tête des cinq causes qui font mentir une courbe, devant l’absence d’un collègue, le corps, la famille et le relevé lui-même. C’est exactement pour ce moment-là que la colonne «&nbsp;inhabituel&nbsp;» existe, et elle prend trois mots par jour. Le test d’accord est une piste sérieuse, mais elle vient plus loin dans la liste&nbsp;: on la retient quand le bond coïncide avec un changement dans la colonne «&nbsp;qui relève&nbsp;».',
      },
      {
        enonce:
          'Quatre semaines de dispositif, la courbe n’a pas bougé. Quelle phrase le module met-il en garde de prononcer en réunion, et par quoi la remplace-t-il&nbsp;?',
        options: [
          '«&nbsp;Le dispositif est mal appliqué&nbsp;» — à remplacer par un rappel des consignes à l’équipe.',
          '«&nbsp;Il ne progresse pas&nbsp;» — à remplacer par «&nbsp;l’hypothèse était fausse&nbsp;», ce qui renvoie à l’analyse des fonctions et non à la personne.',
          '«&nbsp;Il faut plus de temps&nbsp;» — à remplacer par la poursuite du relevé pendant deux mois.',
          '«&nbsp;La mesure ne convient pas&nbsp;» — à remplacer par un changement d’unité.',
        ],
        bonne: 1,
        pourquoi:
          'C’est le moment précis où une équipe découragée se met à parler de la personne au lieu de parler du dispositif, et le module l’écrit en encadré. Une courbe plate n’accuse personne&nbsp;: elle dit que le comportement sert probablement à autre chose que ce qu’on avait supposé, donc que ce qu’on a mis en place ne répond pas à la bonne question. Le chemin est le retour aux quatre fonctions. Changer d’unité en cours de route ferait perdre toute la période&nbsp;; et prolonger sans nouvelle hypothèse revient à mesurer pour mesurer.',
      },
    ],
  },
];
