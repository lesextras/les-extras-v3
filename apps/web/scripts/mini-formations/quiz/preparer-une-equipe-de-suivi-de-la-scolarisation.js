/**
 * QUIZ — Préparer une équipe de suivi de la scolarisation.
 * Un bloc par module, dans l'ordre. Chaque question est ancrée dans le module
 * correspondant : aucune notion qui n'y est pas enseignée.
 *
 * ⚠ RÉFÉRENCES JURIDIQUES : uniquement celles du parcours, avec la portée que
 * le parcours leur donne — D351-10 (évaluation au moins annuelle du PPS),
 * D351-11 (les expertises), D351-12 (l'enseignant référent réunit et coordonne),
 * et D351-16-1 signalé comme l'article cité À TORT (il traite de l'aide
 * humaine). Ce que les parents peuvent demander en matière d'accompagnement à
 * la réunion est une PRATIQUE COURANTE, jamais un droit adossé à un article.
 * Et ce parcours n'est pas un conseil juridique : la dernière question du
 * module 4 le dit.
 */
module.exports = [
  /* ── MODULE 1 ──────────────────────────────────────────────────────────── */
  {
    questions: [
      {
        enonce:
          'Un éducateur de SESSAD prépare un courrier pour demander une réunion. Il écrit&nbsp;: «&nbsp;conformément à l’article D351-16-1, qui régit l’équipe de suivi de la scolarisation&nbsp;». Que faut-il lui dire&nbsp;?',
        options: [
          'La citation est correcte&nbsp;: c’est bien l’article de l’équipe de suivi.',
          'Le D351-16-1 traite de l’aide humaine&nbsp;; l’équipe de suivi relève du D351-10.',
          'Le courrier est irrecevable en l’état, il doit être refait entièrement.',
          'Mieux vaut ne citer aucun article&nbsp;: les textes n’ont pas leur place dans un courrier.',
        ],
        bonne: 1,
        pourquoi:
          'Le D351-16-1 circule partout, dans les courriers et les modèles trouvés en ligne, présenté comme l’article de l’ESS. Il traite d’autre chose&nbsp;: l’aide humaine, et notamment le fait qu’un même élève ne peut se voir attribuer en même temps une aide mutualisée et une aide individuelle. L’article de l’équipe de suivi est le D351-10, complété par le D351-11 pour les expertises et le D351-12 pour l’enseignant référent. Citer le mauvais article ne rend pas le courrier irrecevable — il affaiblit inutilement la demande, et cela se corrige en dix secondes.',
      },
      {
        enonce:
          'Une mère cherche depuis trois jours un «&nbsp;modèle de compte rendu d’ESS&nbsp;» et ne trouve rien de sérieux. Pourquoi&nbsp;?',
        options: [
          'Ces modèles sont réservés aux professionnels de l’éducation nationale.',
          'Le compte rendu est rédigé par la MDPH et n’est pas communiqué aux familles.',
          'Ce document n’existe pas séparément&nbsp;: c’est le GEVA-Sco réexamen qui vaut compte rendu de l’ESS.',
          'Chaque académie a son propre modèle, il faut le demander au rectorat.',
        ],
        bonne: 2,
        pourquoi:
          'Le GEVA-Sco réexamen est rempli par l’enseignant référent lors de la réunion, et il vaut compte rendu de l’ESS&nbsp;: il n’y a pas d’un côté un compte rendu et de l’autre un GEVA-Sco. Chercher un modèle, c’est chercher un document qui n’existe pas. Et ce document n’est pas interne&nbsp;: il alimente l’évaluation de l’équipe pluridisciplinaire de la MDPH, ce qui fait qu’une phrase floue écrite ce jour-là coûte parfois une année entière.',
      },
      {
        enonce:
          'En réunion, un parent dit&nbsp;: «&nbsp;on demande une AESH&nbsp;». Pourquoi cette formulation a-t-elle peu de chances de produire quelque chose&nbsp;?',
        options: [
          'Parce qu’une demande d’aide humaine se formule uniquement par courrier.',
          'Parce que l’ESS n’attribue aucun droit&nbsp;: l’aide humaine relève d’une décision de la CDAPH.',
          'Parce qu’il faut d’abord l’accord de l’enseignant de la classe.',
          'Parce qu’un parent ne formule pas de demande en équipe de suivi.',
        ],
        bonne: 1,
        pourquoi:
          'L’ESS constate, propose et surtout écrit&nbsp;; l’AESH, le matériel, l’orientation et l’aménagement des examens relèvent d’une décision de la CDAPH, à la MDPH. Ce qu’on peut demander à l’ESS, c’est de faire figurer le besoin constaté avec sa mesure — par exemple que l’élève n’entre pas dans une tâche écrite sans qu’un adulte lance la première étape, constaté par l’enseignante et par le SESSAD. La première formulation se perd, la seconde voyage. Un parent, lui, a toute sa place pour demander.',
      },
      {
        enonce:
          'Qui réunit et coordonne l’équipe de suivi, et à quelle fréquence l’évaluation du PPS a-t-elle lieu&nbsp;?',
        options: [
          'L’enseignant référent, et au moins une fois par an.',
          'Le directeur de l’établissement, et une fois par trimestre.',
          'La MDPH, et tous les deux ans.',
          'L’enseignant de la classe, à chaque changement de niveau.',
        ],
        bonne: 0,
        pourquoi:
          'C’est l’enseignant référent qui réunit et coordonne l’ESS, et qui assure la permanence des relations avec l’élève et ses parents — article D351-12. L’évaluation du PPS et de sa mise en œuvre a lieu au moins une fois par an, article D351-10&nbsp;; l’équipe peut se réunir plus souvent, à la demande de la famille ou de l’équipe. Le directeur convoque l’équipe éducative pour le GEVA-Sco première demande, ce qui est un autre document&nbsp;; et la MDPH n’organise pas la réunion, elle évalue sur ce qu’elle lit.',
      },
      {
        enonce:
          'Un père souhaite venir à la réunion accompagné d’un bénévole d’association. Que dit ce parcours&nbsp;?',
        options: [
          'Que c’est un droit garanti par le D351-12, opposable à l’enseignant référent.',
          'Que c’est impossible&nbsp;: seules les personnes convoquées peuvent être présentes.',
          'Que c’est une demande courante, à organiser avec l’enseignant référent avant la réunion.',
          'Que cela suppose l’accord préalable de la CDAPH.',
        ],
        bonne: 2,
        pourquoi:
          'Le parcours présente cet accompagnement comme une pratique courante à négocier avec l’enseignant référent, et surtout pas comme un droit adossé à un article — le texte n’a pas pu être vérifié à la source, et une référence inventée se retourne contre celui qui la cite. La réponse A fabrique un fondement&nbsp;: le D351-12 dit que l’enseignant référent réunit et coordonne l’équipe, rien de plus. Prévenir avant la réunion est précisément ce qui permet que cela s’organise.',
      },
    ],
  },

  /* ── MODULE 2 ──────────────────────────────────────────────────────────── */
  {
    questions: [
      {
        enonce:
          'À l’ESS de Noam, l’AESH dit&nbsp;: «&nbsp;moi je suis sur trois enfants, donc je passe, mais quand je suis à côté ça va mieux&nbsp;». Que manque-t-il à cette phrase&nbsp;?',
        options: [
          'Un ton plus affirmé, pour qu’elle soit prise au sérieux.',
          'Un volume&nbsp;: combien d’heures, et sur quels créneaux.',
          'Une explication de ce qui bloque chez l’élève.',
          'Rien&nbsp;: l’information est complète.',
        ],
        bonne: 1,
        pourquoi:
          'C’est pourtant l’information la plus décisive de la réunion. «&nbsp;Je suis présente environ deux heures par jour sur les six, et les créneaux où je ne suis pas avec lui sont exactement ceux où il y a de l’écrit&nbsp;» se recopie dans un document qui remonte&nbsp;; «&nbsp;je passe&nbsp;» ne se recopie pas. Ce n’est ni une question de ton ni un manque d’explication&nbsp;: c’est un chiffre absent.',
      },
      {
        enonce:
          'La mère de Noam dit que les devoirs durent une heure et demie et qu’il pleure. Que manquait-il à cette intervention&nbsp;?',
        options: [
          'Une mesure&nbsp;: la phrase reste trop vague.',
          'Une explication de ce que ce chiffre signifie.',
          'Rien à la phrase elle-même&nbsp;: il a manqué que quelqu’un demande qu’elle soit écrite.',
          'Un avis professionnel pour la valider.',
        ],
        bonne: 2,
        pourquoi:
          'C’est la seule donnée chiffrée de toute la séance, et elle n’apparaît nulle part dans le document qui remontera à la MDPH&nbsp;: elle a reçu un silence poli et un «&nbsp;il faut qu’on regarde ça&nbsp;». Ce n’est pas de la mauvaise volonté — dans une réunion, ce qui n’est pas explicitement demandé à l’écrit n’est presque jamais écrit. La phrase aurait dû être suivie de&nbsp;: «&nbsp;est-ce qu’on peut le faire figurer au GEVA-Sco&nbsp;?&nbsp;» Un fait apporté par un parent n’a besoin d’aucune validation pour être consigné.',
      },
      {
        enonce:
          'La psychologue dit&nbsp;: «&nbsp;il y a une fragilité attentionnelle, c’est constitutif, il faut du temps&nbsp;». Où est le problème&nbsp;?',
        options: [
          'Elle sort de son rôle en parlant de l’attention en classe.',
          'C’est une explication, pas une observation&nbsp;: elle referme la discussion sans rien apporter au document.',
          'Elle aurait dû préciser le diagnostic pour appuyer son propos.',
          'Elle intervient trop tard dans la réunion.',
        ],
        bonne: 1,
        pourquoi:
          'Une observation se compte et se recopie&nbsp;: «&nbsp;sur les tâches écrites, l’attention se maintient environ dix minutes puis se rompt&nbsp;; un fractionnement en deux fois dix minutes pourrait être essayé et évalué&nbsp;». «&nbsp;C’est constitutif&nbsp;», comme «&nbsp;c’est son handicap&nbsp;» ou «&nbsp;c’est le contexte familial&nbsp;», ferme la discussion. La réponse C aggraverait la situation&nbsp;: l’ESS ne pose pas de diagnostic, et personne autour de la table n’a à le faire.',
      },
      {
        enonce:
          'L’enseignant référent conclut&nbsp;: «&nbsp;on reconduit le PPS, on maintient l’AESH mutualisée, on note qu’il faut être vigilant sur l’écrit&nbsp;». Qu’en penser&nbsp;?',
        options: [
          'C’est une conclusion correcte&nbsp;: elle reprend fidèlement les points abordés.',
          'Il manque un diagnostic pour appuyer la vigilance annoncée.',
          'Il aurait fallu convoquer une seconde réunion dans le mois.',
          'Il n’y a aucune décision&nbsp;: «&nbsp;être vigilant&nbsp;» n’engage personne et ne se vérifie pas.',
        ],
        bonne: 3,
        pourquoi:
          'Une décision porte un nom et une échéance. «&nbsp;Point intermédiaire en janvier, organisé par l’enseignant référent&nbsp;» se vérifie&nbsp;; «&nbsp;être vigilant&nbsp;» ne se vérifie pas, et se retrouvera à l’identique l’année suivante. La question qui répare cela tient en cinq mots&nbsp;: «&nbsp;qui fait ça, et pour quand&nbsp;?&nbsp;» Ni un diagnostic, ni une réunion de plus n’auraient changé ce que dit ce document.',
      },
      {
        enonce:
          'Une éducatrice veut signaler que l’aide humaine n’est jamais présente aux moments d’écrit, sans mettre l’AESH en cause. Quelle formulation le module propose-t-il&nbsp;?',
        options: [
          '«&nbsp;L’AESH n’est jamais là quand il faut, il faudrait revoir son emploi du temps.&nbsp;»',
          '«&nbsp;Les créneaux d’aide et les créneaux d’écrit ne coïncident pas. Est-ce qu’on peut le faire figurer&nbsp;?&nbsp;»',
          '«&nbsp;Je ne veux accuser personne, mais franchement, ça ne va pas du tout.&nbsp;»',
          '«&nbsp;Est-ce que l’AESH pourrait faire un effort sur les horaires du matin&nbsp;?&nbsp;»',
        ],
        bonne: 1,
        pourquoi:
          'C’est un constat d’organisation, pas un reproche à une personne&nbsp;: «&nbsp;les créneaux ne coïncident pas&nbsp;» se discute, «&nbsp;l’AESH n’est jamais là&nbsp;» se défend. Et la phrase ne demande rien à quelqu’un personnellement&nbsp;: elle demande qu’un fait soit écrit, ce qui est très difficile à refuser. Les réponses A et D mettent en cause une professionnelle pour une organisation qu’elle ne décide pas&nbsp;; la C ne laisse aucune trace dans le document.',
      },
    ],
  },

  /* ── MODULE 3 ──────────────────────────────────────────────────────────── */
  {
    questions: [
      {
        enonce:
          'Une éducatrice a écrit sur sa feuille&nbsp;: «&nbsp;il est fatigué l’après-midi&nbsp;». Que lui manque-t-il pour que cette ligne devienne un fait&nbsp;?',
        options: [
          'Un avis médical qui confirme la fatigue.',
          'À partir de quand, ce que cela donne, et ce qui a déjà été essayé.',
          'Une formulation plus prudente, moins affirmative.',
          'Rien&nbsp;: c’est déjà une observation.',
        ],
        bonne: 1,
        pourquoi:
          'Un fait comporte quatre éléments&nbsp;: une situation précise, une mesure, une période, et ce qui a déjà été essayé. La version utilisable donne&nbsp;: «&nbsp;à partir de 14 h 30, il ne produit plus de trace écrite&nbsp;; constaté chaque jour depuis la rentrée de janvier&nbsp;; essayé&nbsp;: une pause à 14 h, sans effet&nbsp;». La colonne «&nbsp;essayé&nbsp;» est celle qui pèse&nbsp;: elle empêche qu’on vous propose en réunion ce que vous faites déjà depuis six semaines.',
      },
      {
        enonce: 'Combien de demandes porte une feuille de préparation, et pourquoi&nbsp;?',
        options: [
          'Autant que nécessaire&nbsp;: mieux vaut tout dire pendant que l’équipe est réunie.',
          'Aucune&nbsp;: on écoute d’abord ce que l’équipe propose.',
          'Une, deux au maximum&nbsp;: cinq demandes dans une ESS, c’est zéro demande.',
          'Trois&nbsp;: une par bloc de la feuille.',
        ],
        bonne: 2,
        pourquoi:
          'Avec cinq demandes, la réunion s’étale, rien n’est arbitré, et le document reprend une formule générale. Choisir la demande qui compte est un travail à faire avant, pas dans la salle. Ne rien demander (réponse B) revient à laisser la réunion refaire celle de l’an dernier&nbsp;; et les trois blocs de la feuille ne sont pas trois demandes&nbsp;: ce qui a changé, les faits, puis la demande.',
      },
      {
        enonce: 'Laquelle de ces demandes peut être recopiée telle quelle dans le GEVA-Sco&nbsp;?',
        options: [
          '«&nbsp;Il faudrait plus d’AESH.&nbsp;»',
          '«&nbsp;Ce serait bien qu’il ait moins de devoirs.&nbsp;»',
          '«&nbsp;Il faut qu’on le suive de près.&nbsp;»',
          '«&nbsp;Demander un allègement des devoirs écrits, à évaluer lors d’un point en janvier.&nbsp;»',
        ],
        bonne: 3,
        pourquoi:
          'Une demande utile est écrite comme elle devrait apparaître dans le document&nbsp;: vous la lisez, l’enseignant référent la recopie, et c’est tout le travail. Les trois autres commencent par «&nbsp;il faudrait&nbsp;» ou «&nbsp;ce serait bien&nbsp;»&nbsp;: elles ne s’écrivent nulle part, donc elles ne voyagent pas jusqu’à l’équipe pluridisciplinaire. Une demande commence par un verbe et se termine par une échéance.',
      },
      {
        enonce:
          'Un père arrive à l’ESS avec un classeur de douze pages préparé tout le week-end. Que va-t-il se passer&nbsp;?',
        options: [
          'Le classeur sera lu après la réunion&nbsp;: le travail portera ses fruits.',
          'Le classeur restera sur la table sans être ouvert&nbsp;; une page recto, lue à voix haute en moins de trois minutes, aurait produit davantage.',
          'Rien de gênant&nbsp;: un dossier épais montre le sérieux de la démarche.',
          'Il aurait fallu l’envoyer directement à la MDPH plutôt que de l’apporter.',
        ],
        bonne: 1,
        pourquoi:
          'Une page se lit et se recopie&nbsp;; dix pages se posent sur la table et ne sont jamais ouvertes. Ce qui compte n’est pas le volume apporté, c’est ce qui pourra être écrit&nbsp;: trois blocs — ce qui a changé, deux ou trois faits, une demande — tiennent sur un recto, que l’on peut lire et même laisser. Le test est simple&nbsp;: chaque phrase des blocs 2 et 3 pourrait-elle être recopiée telle quelle dans un document officiel&nbsp;?',
      },
      {
        enonce:
          'La réunion se termine et vous avez le sentiment que rien de ce que vous avez apporté ne sera écrit. Qu’aviez-vous décidé à l’avance&nbsp;?',
        options: [
          'De laisser la feuille sur la table, ou de l’envoyer par courriel le jour même «&nbsp;pour mémoire&nbsp;».',
          'De demander aussitôt une nouvelle réunion pour tout reprendre.',
          'De rappeler à l’équipe qu’elle a l’obligation d’écrire ce que vous dites.',
          'D’attendre la réunion de l’an prochain pour reposer la question.',
        ],
        bonne: 0,
        pourquoi:
          'Ces trois lignes se décident à froid, avant la réunion, parce que sans plan on ne fait rien — puis on découvre le document trois mois plus tard. Le jour même&nbsp;: une trace écrite datée. Sous quinze jours&nbsp;: la demande du GEVA-Sco, en une phrase polie. S’il manque quelque chose&nbsp;: un courriel de complément, sans polémique. Un dossier qui part à la MDPH avec les éléments ajoutés par la famille reste un dossier complet, et c’est tout ce qui compte.',
      },
    ],
  },

  /* ── MODULE 4 ──────────────────────────────────────────────────────────── */
  {
    questions: [
      {
        enonce:
          'Vous aviez demandé «&nbsp;un allègement des devoirs écrits, à évaluer lors d’un point en janvier&nbsp;». Le GEVA-Sco porte&nbsp;: «&nbsp;vigilance sur la charge de travail à la maison&nbsp;». Que constatez-vous&nbsp;?',
        options: [
          'La demande figure, sous une formulation simplement plus prudente.',
          'La demande a disparu&nbsp;: transformée en «&nbsp;vigilance&nbsp;», elle n’engage plus rien.',
          'C’est une amélioration&nbsp;: le mot attirera l’attention de la MDPH.',
          'Il faut attendre la prochaine réunion pour savoir ce qu’il en est.',
        ],
        bonne: 1,
        pourquoi:
          'C’est le deuxième passage de la relecture&nbsp;: la demande figure-t-elle, et sous quelle forme&nbsp;? Une demande transformée en «&nbsp;vigilance&nbsp;» ou en «&nbsp;à réfléchir&nbsp;» a disparu — il n’y a plus ni objet, ni échéance, ni personne, et c’est ce que lira l’équipe pluridisciplinaire. C’est exactement le cas que traite le courriel de complément, envoyé sans reproche, avec deux éléments au maximum.',
      },
      {
        enonce:
          'Quinze jours après la réunion, un point qui portait un nom et une date n’a pas été mis en place. Que faites-vous&nbsp;?',
        options: [
          'Vous attendez la prochaine ESS pour en reparler.',
          'Vous écrivez à la MDPH pour signaler le manquement.',
          'Vous envoyez un courriel d’une ligne&nbsp;: «&nbsp;il était noté que [X] serait mis en place avant le [date]. Où en est-on&nbsp;?&nbsp;»',
          'Vous complétez vous-même le document et le renvoyez corrigé.',
        ],
        bonne: 2,
        pourquoi:
          'Au bout de quinze jours il n’y a que trois cas&nbsp;: c’est fait, et cela ouvrira le bloc 1 de la prochaine feuille&nbsp;; ce n’est pas fait mais il n’y avait ni nom ni date, donc il n’y avait pas de décision et personne n’a manqué à quoi que ce soit&nbsp;; ce n’est pas fait alors qu’un nom et une date figuraient — et là, il y a quelque chose à demander, sans polémique. On ne réécrit jamais soi-même un document officiel&nbsp;: on demande un ajout, ou on verse une pièce complémentaire.',
      },
      {
        enonce:
          'Le GEVA-Sco décrit l’élève comme «&nbsp;opposant&nbsp;» et «&nbsp;peu investi&nbsp;», et ne mentionne aucun progrès. Que faire&nbsp;?',
        options: [
          'Rien&nbsp;: c’est l’appréciation des professionnels, elle leur appartient.',
          'Exiger le retrait de ces mots, faute de quoi vous refuserez le document.',
          'Le signaler oralement à la prochaine réunion, dans un an.',
          'Demander par écrit l’ajout de ce qui a progressé, et de ce que vous constatez en face de ces qualifications.',
        ],
        bonne: 3,
        pourquoi:
          'C’est le quatrième passage de la relecture&nbsp;: des qualifications sans fait, et l’absence de ce qui va bien. Ce document suivra l’enfant et alimentera une évaluation&nbsp;; un GEVA-Sco qui ne contient que des difficultés donne une image fausse, et cette image voyage. «&nbsp;Pourrait-on ajouter ce qui a progressé depuis novembre&nbsp;?&nbsp;» ne se refuse jamais. En revanche on ne réécrit pas le texte d’un autre, et attendre un an laisse le document partir tel quel.',
      },
      {
        enonce: 'Qu’est-ce qui rend le courriel de complément efficace&nbsp;?',
        options: [
          'Il est court, factuel, sans reproche, et il produit une trace datée même s’il reste sans réponse.',
          'Il rappelle les articles du code de l’éducation et les obligations de chacun.',
          'Il reprend l’intégralité de ce qui a été dit pendant la réunion.',
          'Il est adressé en copie à plusieurs autorités pour faire pression.',
        ],
        bonne: 0,
        pourquoi:
          'Il tient en cinq lignes, s’adresse à l’enseignant référent qui coordonne l’équipe de suivi (article D351-12), et porte deux éléments manquants au maximum — pas six. Un oubli en réunion n’est presque jamais une manœuvre&nbsp;: c’est une réunion qui va vite. Un courriel sans reproche obtient beaucoup plus qu’un courrier de mise en demeure, et il laisse exactement la même trace datée.',
      },
      {
        enonce:
          'Une décision de la MDPH vous paraît injustifiée et vous voulez la contester. Que vous dit ce parcours&nbsp;?',
        options: [
          'Qu’il faut demander une nouvelle ESS pour faire annuler la décision.',
          'Qu’il ne donne pas de conseil juridique&nbsp;: les voies et délais de recours figurent sur la notification, et l’accompagnement se cherche auprès d’une association d’usagers, d’un service social ou d’un juriste.',
          'Qu’il faut écrire à l’enseignant référent, qui transmettra le recours.',
          'Qu’une décision de la CDAPH ne se conteste pas.',
        ],
        bonne: 1,
        pourquoi:
          'Ce parcours travaille une chose et une seule&nbsp;: faire en sorte que ce qui a été dit soit écrit. Il ne rédige pas de recours, et il ne dit pas ce qu’une MDPH accordera. L’ESS, elle, n’annule aucune décision puisqu’elle n’en prend aucune — elle peut en revanche écrire un désaccord, et c’est utile. Et les délais de recours sont courts&nbsp;: ils figurent sur la notification elle-même, il ne faut pas les laisser passer en attendant une réunion.',
      },
    ],
  },
];
