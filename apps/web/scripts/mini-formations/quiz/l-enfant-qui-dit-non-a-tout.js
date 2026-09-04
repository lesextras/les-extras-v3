/**
 * QUIZ — L'enfant qui dit non à tout.
 * Un bloc par module, dans l'ordre. Chaque question est ancrée dans le module
 * correspondant : aucune notion qui n'y est pas enseignée.
 */
module.exports = [
  /* ── MODULE 1 ──────────────────────────────────────────────────────────── */
  {
    questions: [
      {
        enonce:
          'En réunion, une éducatrice dit d’un enfant du groupe&nbsp;: «&nbsp;il dit non à tout, du matin au soir&nbsp;». Par quoi commencer&nbsp;?',
        options: [
          'Chercher tout de suite la fonction du refus.',
          'Reformuler les consignes du groupe pour les rendre plus fermes.',
          'Compter, sur une heure ordinaire, les consignes données et celles réellement refusées.',
          'Noter la phrase dans le dossier pour garder une trace du comportement.',
        ],
        bonne: 2,
        pourquoi:
          '«&nbsp;Il dit non à tout&nbsp;» est une impression, pas une donnée&nbsp;: une heure de comptage donne un nombre de consignes, un nombre de refus, une proportion — presque toujours bien plus basse que l’impression — et montre que les refus se concentrent sur deux ou trois moments. Chercher la fonction ou raffermir le ton avant d’avoir compté, c’est travailler sur un chiffre qu’on n’a pas. Et écrire la phrase telle quelle au dossier fige une généralisation qu’aucun comptage ne soutient.',
      },
      {
        enonce:
          'Depuis trois semaines, Sami refuse toujours la même chose et rien d’autre&nbsp;: mettre ses chaussures. Ailleurs, il suit les demandes. Lequel des cinq «&nbsp;non&nbsp;» est le plus probable, et que faire&nbsp;?',
        options: [
          '«&nbsp;Je ne peux pas&nbsp;»&nbsp;: aider, découper, ou faire la première étape avec lui.',
          '«&nbsp;Je ne veux pas, point&nbsp;»&nbsp;: entendre le refus et passer à autre chose.',
          '«&nbsp;Je n’ai pas compris&nbsp;»&nbsp;: répéter la consigne plus fort et plus lentement.',
          '«&nbsp;Je ne veux pas maintenant&nbsp;»&nbsp;: reposer la demande dix minutes plus tard.',
        ],
        bonne: 0,
        pourquoi:
          'Un refus qui revient <strong>toujours sur la même tâche</strong> est la signature du «&nbsp;je ne peux pas&nbsp;»&nbsp;: la demande est trop coûteuse telle quelle, et insister produit un échec qui rendra la tâche encore plus chère demain. Le «&nbsp;je ne veux pas maintenant&nbsp;» se reconnaît au fait que la personne accepte plus tard, ce qui n’est pas le cas ici&nbsp;; le «&nbsp;je ne veux pas, point&nbsp;» est constant quels que soient le moment et la tâche&nbsp;; et répéter plus fort n’ajoute aucune information, le volume n’explique rien.',
      },
      {
        enonce:
          'Une seule de ces quatre phrases passe le test du film — on saurait dire à quoi ressemblerait l’image de quelqu’un en train de l’exécuter. Laquelle&nbsp;?',
        options: [
          '«&nbsp;Range ta chambre.&nbsp;»',
          '«&nbsp;Ne laisse pas traîner tes affaires.&nbsp;»',
          '«&nbsp;Tu ranges tes feutres et tu vas te laver les mains.&nbsp;»',
          '«&nbsp;Mets les Lego dans la caisse bleue.&nbsp;»',
        ],
        bonne: 3,
        pourquoi:
          'Une consigne exécutable tient en cinq mots&nbsp;: un verbe, une chose, maintenant, en positif, à portée de voix. La quatrième les réunit. «&nbsp;Range ta chambre&nbsp;» est vague — c’est un objectif, personne ne sait par où commencer ni quand c’est fini&nbsp;; «&nbsp;ne laisse pas traîner&nbsp;» est en négatif et laisse à trouver quoi faire à la place, ce qui est justement la partie difficile&nbsp;; la troisième est double, et c’est presque toujours la seconde moitié, celle qui coûte, qui n’est pas faite.',
      },
      {
        enonce:
          'Vous avez donné une consigne exécutable, vous avez compté cinq secondes de silence, et rien ne vient. Que faites-vous&nbsp;?',
        options: [
          'Vous répétez la consigne, une fois, plus fermement.',
          'Vous aidez&nbsp;: vous montrez, vous commencez, vous faites la première étape avec la personne.',
          'Vous annoncez ce qui se passera si elle n’est pas suivie.',
          'Vous attendez cinq secondes de plus avant d’intervenir.',
        ],
        bonne: 1,
        pourquoi:
          'Au bout des cinq secondes on <strong>aide</strong>, on ne répète pas. Une consigne répétée enseigne deux choses coûteuses&nbsp;: que la première fois ne compte pas, et qu’on peut attendre la troisième. Annoncer une conséquence sous tension engage l’adulte plus qu’elle n’engage l’autre, et allonger l’attente ne change rien&nbsp;: une consigne non suivie deux fois de suite n’est pas un problème d’obéissance, c’est une consigne trop grosse, trop vague ou donnée au mauvais moment — elle se réécrit.',
      },
      {
        enonce:
          'Un enfant accueilli dans le service refuse d’embrasser un adulte qui vient le voir. Que faire&nbsp;?',
        options: [
          'Insister doucement&nbsp;: dire bonjour correctement fait partie du cadre.',
          'Reformuler la demande pour la rendre exécutable&nbsp;: «&nbsp;fais un bisou à Madame&nbsp;».',
          'Entendre le refus&nbsp;: le contact fait partie de ce qui lui appartient.',
          'Proposer un choix entre un bisou et un câlin, pour lui rendre une prise.',
        ],
        bonne: 2,
        pourquoi:
          'Une partie des «&nbsp;non&nbsp;» sont légitimes et doivent être entendus&nbsp;: sur le corps, l’intimité, les objets personnels, un contact. Aucune technique de ce parcours ne doit servir à passer par-dessus — c’est précisément pour cela que le module&nbsp;3 fait écrire la colonne «&nbsp;son droit&nbsp;» avant tout travail sur la forme des consignes. Reformuler ne change rien à ce qui est demandé, et le choix ne s’applique qu’au comment ou au quand, jamais au <em>si</em>&nbsp;: proposer bisou ou câlin, c’est habiller en choix une chose qu’on n’avait pas à obtenir.',
      },
    ],
  },

  /* ── MODULE 2 ──────────────────────────────────────────────────────────── */
  {
    questions: [
      {
        enonce:
          'Samedi 11&nbsp;h. Camille finit un dessin par terre dans sa chambre. Depuis la cuisine&nbsp;: «&nbsp;Camille, tu peux ranger ta chambre s’il te plaît&nbsp;?&nbsp;» Que porte cette seule phrase&nbsp;?',
        options: [
          'Un seul défaut&nbsp;: elle est formulée en question.',
          'Quatre défauts&nbsp;: question, vague, donnée à distance sans attention, et au mauvais moment.',
          'Aucun défaut&nbsp;: elle est polie et clairement adressée.',
          'Deux défauts&nbsp;: elle est double et noyée dans un flot.',
        ],
        bonne: 1,
        pourquoi:
          'Quatre défauts d’un coup. La question autorise un «&nbsp;non&nbsp;» qu’on n’acceptera pas&nbsp;; «&nbsp;ranger sa chambre&nbsp;» n’indique aucun premier geste&nbsp;; lancée d’une autre pièce, on ne saura jamais si elle a été entendue — le refus qu’on croit constater n’existe peut-être pas&nbsp;; et elle arrive au milieu d’un dessin en cours. La politesse n’est pas en cause&nbsp;: ces formes marchent très bien entre adultes, elles cessent de marcher dès qu’il y a une difficulté d’attention ou de compréhension.',
      },
      {
        enonce:
          'Après «&nbsp;tu ranges tes Lego et tes feutres, et après tes habits sales… et ne laisse pas traîner tes chaussons&nbsp;», Camille met deux Lego dans la caisse, se rassoit, et dit&nbsp;: «&nbsp;mais j’ai rangé&nbsp;!&nbsp;» Comment lire cette phrase&nbsp;?',
        options: [
          'Elle se moque&nbsp;: elle sait très bien ce qui lui a été demandé.',
          'Elle n’a pas écouté&nbsp;: il faut redire la demande en la répétant.',
          'Elle teste jusqu’où elle peut aller avant que sa mère ne s’énerve.',
          'Elle a exécuté une consigne sur quatre — la moins coûteuse — et elle a raison de croire qu’elle a obéi.',
        ],
        bonne: 3,
        pourquoi:
          'Quatre tâches en une phrase, dont une formulée à l’envers&nbsp;: dans une consigne multiple, une seule est faite, presque toujours la première et jamais celle qui coûte. Camille dit vrai. Les trois autres lectures prêtent une intention — se moquer, tester, ne pas écouter — et c’est exactement ce qui fait basculer la scène deux minutes plus tard&nbsp;: dès qu’on parle de l’attitude, on ne parle plus de la tâche et plus personne ne peut reculer.',
      },
      {
        enonce:
          'Dans cette scène, qu’est-ce qui coûte réellement le plus cher&nbsp;?',
        options: [
          'La chambre rangée le soir par la mère&nbsp;: la consigne abandonnée.',
          'Le ton qui monte au milieu de la scène.',
          'La chambre restée en désordre pendant toute la journée.',
          'Le fait que Camille ait quitté la pièce en claquant la porte.',
        ],
        bonne: 0,
        pourquoi:
          'C’est le huitième problème, et ce n’est pas un défaut de forme&nbsp;: une consigne que personne ne suit et que l’adulte finit par exécuter enseigne qu’une consigne n’engage à rien, et que la répétition finit toujours par la remplacer. Chaque consigne abandonnée rend la suivante un peu plus coûteuse. Le désordre se répare en dix minutes, le ton se rattrape&nbsp;; cette leçon-là reste. Mieux vaut donner trois consignes par jour et les tenir toutes les trois que d’en donner trente et d’en tenir dix.',
      },
      {
        enonce:
          'Sous tension, la mère finit par dire&nbsp;: «&nbsp;tu ranges ou il n’y a pas de parc cet après-midi.&nbsp;» Qu’est-ce que cette phrase&nbsp;?',
        options: [
          'Un choix, puisque Camille garde la décision.',
          'Une conséquence logique, qui aide à faire le lien entre l’acte et ses effets.',
          'Une fausse alternative&nbsp;: une menace habillée en choix, qui engage surtout celle qui la prononce.',
          'Une limite claire, ce qui manquait depuis le début de la scène.',
        ],
        bonne: 2,
        pourquoi:
          'Un vrai choix porte sur le comment ou le quand, propose deux options qui vous conviennent toutes les deux, et il est tenu. Ici, une seule option est acceptable&nbsp;: c’est une menace. Elle engage la mère à supprimer le parc — ce qu’elle fera, ce qui punit tout le monde, elle comprise — et le rangement n’aura toujours pas eu lieu. Une fausse alternative marche une fois ou deux, puis elle abîme les vrais choix qui viendront après. Ne jamais annoncer une conséquence sous tension&nbsp;: ce qui doit être décidé se décide à froid.',
      },
      {
        enonce:
          'En internat, un éducateur lance «&nbsp;on range&nbsp;!&nbsp;» à huit enfants. Deux commencent, les autres continuent leur jeu. Que faut-il en tirer&nbsp;?',
        options: [
          'Le groupe est trop nombreux pour qu’une consigne collective fonctionne&nbsp;: il faut réduire le groupe.',
          'Une consigne collective n’est adressée à personne&nbsp;: celle qui doit être suivie se donne à quelqu’un, avec son prénom, en face — quitte à en donner huit.',
          'Il faut la répéter plus fort, pour couvrir le bruit du groupe.',
          'Les six autres refusent&nbsp;: c’est un problème d’autorité sur le groupe.',
        ],
        bonne: 1,
        pourquoi:
          '«&nbsp;On range&nbsp;!&nbsp;» est entendu par ceux qui rangeaient déjà. Ce n’est pas un refus qu’on observe, c’est une consigne qui n’a été adressée à personne. Deux autres choses changent en collectif&nbsp;: le public rend coûteux de reculer, donc une consigne dite à côté et à voix basse passe souvent sans difficulté&nbsp;; et deux adultes qui formulent différemment la même attente produisent zéro consigne — les trois ou quatre qui reviennent chaque jour gagnent à être écrites et dites pareil par tout le monde. Un rituel, lui, remplace une consigne&nbsp;: ce qui se fait chaque jour dans le même ordre finit par ne plus avoir besoin d’être demandé.',
      },
    ],
  },

  /* ── MODULE 3 ──────────────────────────────────────────────────────────── */
  {
    questions: [
      {
        enonce:
          'En réunion, l’équipe liste ce qu’elle attend de Théo au lever. Quelqu’un propose d’ajouter&nbsp;: «&nbsp;qu’il accepte qu’on l’embrasse le matin&nbsp;». Où cela va-t-il&nbsp;?',
        options: [
          'En «&nbsp;non négociable&nbsp;»&nbsp;: le bonjour fait partie de la vie du groupe.',
          'En «&nbsp;négociable&nbsp;»&nbsp;: on peut discuter du moment ou de la personne.',
          'En «&nbsp;son droit&nbsp;»&nbsp;: cela lui appartient, et l’exigence sort de la liste.',
          'En «&nbsp;non négociable&nbsp;», mais en dernier, quand il est le plus disponible.',
        ],
        bonne: 2,
        pourquoi:
          'La troisième colonne est celle qu’on n’écrit jamais, et c’est celle qui change le plus de choses&nbsp;: un refus de contact, les objets personnels, l’intimité, le droit de dire qu’on n’aime pas, le droit de se taire. Aucune technique ne doit servir à passer par-dessus, et ce qui y est écrit n’est pas une faveur qu’on retire un jour de tension. Le classer en «&nbsp;négociable&nbsp;» est l’erreur la plus fréquente&nbsp;: on négocie alors le moment d’une chose qu’on n’avait pas à obtenir. Un adulte qui a rempli cette colonne cesse de livrer trois batailles par jour qui ne lui appartenaient pas, et il lui reste beaucoup plus d’énergie pour les deux qui comptent.',
      },
      {
        enonce:
          'Vous hésitez à classer une exigence en non négociable. Quelle question la tranche&nbsp;?',
        options: [
          '«&nbsp;Qu’est-ce qui se passe réellement si je n’obtiens pas&nbsp;?&nbsp;»',
          '«&nbsp;Est-ce que les autres adultes l’exigent aussi&nbsp;?&nbsp;»',
          '«&nbsp;Est-ce que je saurais filmer quelqu’un en train de l’exécuter&nbsp;?&nbsp;»',
          '«&nbsp;Est-ce qu’il l’a déjà fait sans difficulté par le passé&nbsp;?&nbsp;»',
        ],
        bonne: 0,
        pourquoi:
          'Si la réponse est «&nbsp;rien de grave, mais ça m’agace&nbsp;», ce n’est pas non négociable. Ce n’est pas une raison de renoncer&nbsp;: c’est une raison de le demander autrement et de ne pas en faire une épreuve de force. Le test du film est un bon test, mais il porte sur la <em>forme</em> de la consigne, pas sur sa légitimité — une exigence peut être parfaitement filmable et n’avoir pas à être exigée. La pratique des collègues et l’historique ne disent rien de ce qui se passe si on n’obtient pas.',
      },
      {
        enonce:
          'Vous listez ce que vous demandez pendant le coucher&nbsp;: quinze consignes. Que faites-vous&nbsp;?',
        options: [
          'Vous les gardez toutes, mais vous les reformulez pour qu’elles soient exécutables.',
          'Vous les répartissez sur trois moments différents de la soirée.',
          'Vous en gardez cinq et vous reportez les dix autres au cycle suivant.',
          'Vous rayez celles qui relèvent de «&nbsp;son droit&nbsp;», celles qui ne coûtent rien à laisser tomber ce mois-ci, celles qui deviennent un rituel ou un support visuel, et celles que vous ne suivez jamais jusqu’au bout — pour viser cinq.',
        ],
        bonne: 3,
        pourquoi:
          'La première décision surprend&nbsp;: on en enlève, et selon quatre critères précis. Les équipes et les familles qui le font descendent en général de quinze à cinq, et le taux de refus baisse <strong>avant même</strong> que la forme n’ait été retravaillée&nbsp;: il y a simplement moins d’occasions de refuser, et chacune est tenue. Reformuler quinze consignes les rend meilleures une par une sans rien changer à leur nombre&nbsp;; les étaler sur la soirée les garde toutes&nbsp;; et «&nbsp;reporter au cycle suivant&nbsp;» n’est pas un tri, c’est une liste d’attente. Réduire n’est pas baisser les bras&nbsp;: c’est concentrer l’autorité là où elle sert.',
      },
      {
        enonce:
          'Sur la feuille des cinq consignes, on écrit à froid trois lignes pour «&nbsp;au bout des cinq secondes&nbsp;». Aucune sanction n’y figure. Pourquoi&nbsp;?',
        options: [
          'Parce qu’une sanction n’a pas d’effet sur les refus liés à la compréhension.',
          'Parce qu’une conséquence décidée sous tension engage l’adulte plus qu’elle n’engage l’autre&nbsp;: elle est presque toujours ou trop lourde, ou jamais appliquée.',
          'Parce que la sanction relève de l’équipe de direction, pas de la feuille.',
          'Parce que la feuille est affichée et qu’une sanction écrite serait humiliante.',
        ],
        bonne: 1,
        pourquoi:
          'C’est la partie qu’on improvise, et celle qui se dégrade le plus vite un soir de fatigue. Les trois lignes disent&nbsp;: rien au bout de cinq secondes, j’aide sans répéter&nbsp;; deuxième fois de suite, je découpe la consigne ou je change son moment, sans monter le ton&nbsp;; troisième fois, elle sort de la liste — c’est une consigne trop grosse, et je regarde du côté de la tâche, pas du côté de la personne. Ce qui doit être décidé se décide à froid, à un autre moment, et se dit une fois — jamais pendant.',
      },
      {
        enonce:
          'Une consigne réellement non négociable — prendre son traitement du soir — est refusée deux soirs de suite. Que faites-vous&nbsp;?',
        options: [
          'Vous réduisez ce qui est demandé jusqu’à ce que ce soit faisable&nbsp;: laisser le traitement sur la table, proposer le verre — et vous en reparlez plus tard, à froid.',
          'Vous la retirez de la feuille, comme n’importe quelle consigne refusée deux fois.',
          'Vous maintenez la demande jusqu’à obtention&nbsp;: c’est la définition d’un non négociable.',
          'Vous annoncez une conséquence pour le lendemain soir, afin que la règle soit claire.',
        ],
        bonne: 0,
        pourquoi:
          'On ne renonce pas, et on ne force pas non plus&nbsp;: on garde le cap sur ce qui protège et on lâche tout le reste. Prendre la main plutôt que traverser seul, s’asseoir à table sans obligation de manger, laisser le traitement à portée et proposer le verre. La règle des trois essais s’applique aux consignes ordinaires, pas à ce qui relève de la santé ou de la sécurité&nbsp;; maintenir jusqu’à obtention conduit à forcer un corps, ce que ce parcours interdit&nbsp;; et une conséquence annoncée sous tension engage l’adulte plus qu’elle n’engage l’autre.',
      },
    ],
  },

  /* ── MODULE 4 ──────────────────────────────────────────────────────────── */
  {
    questions: [
      {
        enonce:
          'Au dixième jour, une ligne de votre relevé porte surtout des <strong>A</strong>&nbsp;: la consigne est faite, mais avec votre aide presque chaque fois. Que décidez-vous&nbsp;?',
        options: [
          'Vous la retirez de la feuille&nbsp;: elle n’est pas acquise.',
          'Vous la découpez en deux plus petites, ou vous réduisez l’aide d’un cran.',
          'Vous la gardez telle quelle&nbsp;: l’aide finira par ne plus être nécessaire.',
          'Vous la déplacez à un autre moment de la journée.',
        ],
        bonne: 1,
        pourquoi:
          'Surtout des A veut dire que la consigne est comprise et que la tâche est un peu trop grosse&nbsp;: on découpe, ou on garde l’aide en la réduisant d’un cran. La retirer ferait perdre un acquis réel — elle est faite, tous les jours. La garder à l’identique en espérant que l’aide s’efface toute seule ne décide de rien. Et changer le moment est la réponse à des <strong>N</strong> répétés, pas à des A.',
      },
      {
        enonce:
          'Votre relevé montre des <strong>N</strong> sur presque toutes les lignes, mais seulement le lundi et le jeudi&nbsp;; les autres jours, tout passe. Que lisez-vous&nbsp;?',
        options: [
          'Les consignes sont mal écrites&nbsp;: il faut les réécrire toutes les cinq.',
          'Le relevé est trop court pour être lisible&nbsp;: il faut le prolonger de dix jours.',
          'La personne a compris que le relevé existe et se comporte différemment.',
          'Ce sont les journées qui décident, pas les consignes&nbsp;: on allège la liste ces jours-là.',
        ],
        bonne: 3,
        pourquoi:
          'Des N répartis sur toutes les lignes, certains jours seulement, désignent le jour et non la consigne&nbsp;: fatigue, retour de week-end, changement, douleur. On décide à l’avance qu’il n’y a que deux consignes ces jours-là. Réécrire cinq consignes qui marchent quatre jours sur cinq, c’est corriger ce qui n’est pas cassé&nbsp;; et prolonger le relevé sans décision ne fait qu’ajouter des lignes. C’est bien pour cela qu’on lit le relevé <strong>ligne par ligne</strong>&nbsp;: une moyenne sur cinq consignes aurait effacé ce motif.',
      },
      {
        enonce:
          'Entre la première et la deuxième semaine, votre case «&nbsp;j’ai tenu les cinq secondes&nbsp;» ne bouge pas&nbsp;: deux jours sur cinq, toujours. Où chercher&nbsp;?',
        options: [
          'Du côté du moment, presque toujours trop serré pour supporter cinq secondes de silence&nbsp;: on le déplace de quinze minutes avant de retravailler quoi que ce soit.',
          'Du côté de la personne, qui met plus de temps que la moyenne à répondre.',
          'Du côté de la formulation des consignes, qu’il faut raccourcir encore.',
          'Nulle part&nbsp;: cette case mesure une habitude d’adulte, elle bouge sur des mois.',
        ],
        bonne: 0,
        pourquoi:
          'La cause est presque toujours matérielle et non pédagogique&nbsp;: un moment trop serré ne laisse pas de place à cinq secondes de silence, et le silence est déjà difficile en soi — il donne l’impression de ne rien faire, devant témoins. Chez la plupart des adultes ce chiffre bouge vite, de deux ou trois jours sur cinq à quatre ou cinq&nbsp;: s’il ne bouge pas, c’est un signal, pas une fatalité. Et cette case ne mesure pas la personne d’en face, elle ne dit donc rien de son temps de réponse.',
      },
      {
        enonce:
          'Vous devez rendre compte par écrit d’une période de refus. Laquelle de ces phrases peut entrer dans un écrit professionnel&nbsp;?',
        options: [
          '«&nbsp;S’oppose systématiquement aux consignes.&nbsp;»',
          '«&nbsp;Refuse l’autorité de l’adulte.&nbsp;»',
          '«&nbsp;Sur dix jours, quatre consignes sur cinq sont suivies au coucher&nbsp;; la cinquième, le brossage des dents, ne l’est pas.&nbsp;»',
          '«&nbsp;Ne fait rien sans qu’on lui répète dix fois.&nbsp;»',
        ],
        bonne: 2,
        pourquoi:
          'Trois règles&nbsp;: on écrit la consigne et pas seulement le refus, on ne prête aucune intention, on ne généralise pas. «&nbsp;S’oppose systématiquement&nbsp;» est une généralisation qu’un comptage dément presque toujours, et qui devient une caractéristique de la personne&nbsp;; «&nbsp;refuse l’autorité&nbsp;» prête une intention et déplace le sujet vers la relation, où plus rien n’est vérifiable&nbsp;; «&nbsp;sans qu’on lui répète dix fois&nbsp;» décrit la personne alors que c’est la conduite de l’adulte qui produit la répétition. Le test&nbsp;: accepteriez-vous de lire cette phrase à voix haute devant la personne et devant sa famille&nbsp;? Ce qui est écrit reste au dossier bien plus longtemps que le refus, et oriente toutes les lectures suivantes.',
      },
      {
        enonce:
          'Troisième jour du relevé&nbsp;: une de vos cinq consignes a été refusée trois soirs de suite. Que faites-vous&nbsp;?',
        options: [
          'Vous la réécrivez ce soir, pendant que la scène est fraîche.',
          'Vous la remplacez par une consigne plus facile pour ne pas décourager tout le monde.',
          'Vous ajoutez une conséquence, annoncée calmement le quatrième soir.',
          'Vous la notez, vous aidez, et vous décidez au dixième jour&nbsp;: on ne change pas la feuille en route.',
        ],
        bonne: 3,
        pourquoi:
          'Changer la feuille en cours rend le relevé illisible&nbsp;: on ne saurait plus ce qui a produit quoi, et les dix jours seraient perdus. Deux autres règles tiennent la période&nbsp;: on ne travaille qu’un moment, le reste de la journée continue comme avant et sans culpabilité&nbsp;; et on remplit le jour même — rempli le lendemain, un relevé devient un souvenir, et un souvenir se souvient surtout des mauvais soirs. Une seule chose fait interrompre le relevé&nbsp;: des refus qui augmentent nettement, signe qu’il faut regarder ailleurs (douleur, sommeil, événement, changement d’adulte).',
      },
    ],
  },
];
