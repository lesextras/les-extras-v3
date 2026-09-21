/**
 * QUIZ — Résoudre un problème avec la personne plutôt que contre elle.
 *
 * Un bloc par module, dans l'ordre. Chaque question est ancrée dans le module
 * correspondant : aucune notion qui n'y est pas enseignée, et aucune réponse
 * qui suppose un autre parcours du catalogue (les renvois restent des renvois).
 *
 * ⚠ LES MAUVAISES RÉPONSES SONT LES ERREURS RÉELLES DU MÉTIER, pas des
 * absurdités : demander pourquoi, annoncer la limite à la fin, proposer sa
 * solution au temps 1, conclure que la personne n'a pas voulu. Une option
 * manifestement fausse ne teste rien.
 *
 * ⚠ LES GARDE-FOUS TIENNENT DANS LES QUESTIONS COMME DANS LE TEXTE : aucune
 * bonne réponse ne fait négocier la sécurité, les soins ou le moyen de
 * communication, ni tenir la conversation à chaud, ni passer outre un refus
 * de parler maintenant.
 */
module.exports = [
  /* ── MODULE 1 — Ce qu'une solution imposée ne peut pas faire ───────────── */
  {
    questions: [
      {
        enonce:
          'Un chef de service dit&nbsp;: «&nbsp;On a posé la règle trois fois, il ne l’applique toujours pas, il faut être plus ferme.&nbsp;» Que répond le module&nbsp;1&nbsp;?',
        options: [
          'Qu’une solution imposée obtient l’arrêt tant que l’adulte est là, et qu’une règle reposée plus fermement ne devient pas une règle à laquelle la personne a participé.',
          'Que la fermeté est contre-productive et qu’il ne faut plus poser de règles.',
          'Qu’il faut d’abord mesurer combien de fois le comportement se produit.',
          'Que la règle est probablement mal formulée et qu’il faut la réécrire.',
        ],
        bonne: 0,
        pourquoi:
          'Le module ne dit pas qu’imposer ne marche pas&nbsp;: il dit que ça marche tant que vous êtes là. Répéter plus fermement ne change pas ce qui manque — la participation de l’autre. Ce parcours ne demande à personne d’arrêter de poser des limites&nbsp;: un adulte qui ne pose plus rien est absent, ce qui est une autre façon de laisser quelqu’un seul. La mesure et la formulation de la consigne sont de vrais sujets, mais ce sont ceux d’autres parcours&nbsp;; ici la question est de savoir qui a participé à la solution.',
      },
      {
        enonce:
          'Une équipe veut «&nbsp;chercher une solution avec Nadia&nbsp;» à propos de son traitement du soir, qu’elle refuse régulièrement. Que dit le tri&nbsp;?',
        options: [
          'C’est un problème récurrent qui coûte à la personne&nbsp;: c’est exactement le terrain du parcours.',
          'Ça ne gêne que l’équipe&nbsp;: on laisse.',
          'Le traitement lui-même ne se négocie pas&nbsp;; ce qui se cherche à deux, c’est l’heure, le lieu, qui l’apporte et devant qui.',
          'Il faut d’abord obtenir l’accord du médecin avant toute conversation.',
        ],
        bonne: 2,
        pourquoi:
          'Les soins prescrits figurent sur la liste de ce qui ne se négocie jamais — on peut chercher ensemble COMMENT ils se passent, jamais s’ils ont lieu. Et la distinction n’est pas théorique&nbsp;: dans l’exemple du module, la seule chose qui bloquait réellement était de devoir le prendre devant les autres, ce qui est entièrement négociable. Traiter la prise elle-même comme négociable serait une faute&nbsp;; la classer «&nbsp;on laisse&nbsp;» le serait aussi.',
      },
      {
        enonce:
          'Vous préparez une conversation sur un retour tardif. Quand annoncez-vous la limite horaire, qui vient du règlement et sur laquelle vous n’avez pas la main&nbsp;?',
        options: [
          'À la fin, une fois que la personne a proposé ses idées, pour ne pas fermer la discussion trop tôt.',
          'Au début, dans la même phrase que l’invitation à chercher ensemble.',
          'Jamais&nbsp;: si elle est non négociable, il n’y a pas de conversation à avoir.',
          'Au moment où la personne propose quelque chose qui ne la respecte pas.',
        ],
        bonne: 1,
        pourquoi:
          'Une limite non négociable s’annonce au début, en disant d’où elle vient. L’annoncer à la fin fait perdre son temps à la personne et lui apprend que l’invitation était décorative&nbsp;: c’est la faute qui fait le plus de dégâts pour le moins d’intention. Attendre qu’elle propose quelque chose d’inacceptable revient au même en pire. Et la limite n’annule pas la conversation&nbsp;: c’est ce qui l’entoure qui se cherche à deux.',
      },
      {
        enonce:
          'Trois problèmes sont sur votre feuille de tri. Lequel sort du parcours&nbsp;?',
        options: [
          'Un adolescent met une heure à ranger sa chambre le samedi&nbsp;; l’équipe trouve ça long.',
          'Un jeune quitte la table avant la fin du repas trois soirs sur cinq et n’y revient pas.',
          'Une personne arrive systématiquement en retard à l’atelier qu’elle a choisi et finit par en être exclue.',
          'Un enfant refuse de monter dans le bus scolaire, et rate la moitié de ses journées de classe.',
        ],
        bonne: 0,
        pourquoi:
          'La colonne «&nbsp;à qui ça coûte&nbsp;» tranche. Ranger lentement sa chambre ne ferme rien à l’adolescent&nbsp;: c’est l’équipe que ça gêne. Ouvrir une recherche commune là-dessus, c’est demander à quelqu’un de résoudre notre problème à notre place, et il le sentira. Les trois autres ferment quelque chose à la personne — un repas, un atelier, des journées de classe — et relèvent donc du parcours. C’est la même règle que la colonne «&nbsp;à qui ça sert&nbsp;» de «&nbsp;Renforcer ce qui va&nbsp;».',
      },
      {
        enonce:
          'Dans quelle situation le module&nbsp;1 demande explicitement de NE PAS ouvrir cette conversation&nbsp;?',
        options: [
          'Quand la personne a déjà refusé d’en parler une fois.',
          'Quand le problème dure depuis plus de six mois.',
          'Quand la personne n’a pas de moyen fiable d’exprimer un point de vue&nbsp;: on travaille d’abord la communication.',
          'Quand la personne est mineure et que les parents n’ont pas été prévenus.',
        ],
        bonne: 2,
        pourquoi:
          'Une recherche commune suppose que les deux puissent dire ce qui les préoccupe. Sans moyen fiable — et parler n’est pas le seul&nbsp;: images, tablette, gestes, oui/non fiable conviennent très bien —, on déciderait seul et on appellerait ça un accord. Les deux autres situations d’exclusion du module sont «&nbsp;c’est encore chaud&nbsp;» et «&nbsp;vous connaissez déjà la solution&nbsp;». Un refus ponctuel se reporte, il n’exclut rien&nbsp;; l’ancienneté du problème ne change pas la branche&nbsp;; et la question de l’autorité parentale ne fait pas partie des critères du tri.',
      },
    ],
  },

  /* ── MODULE 2 — La conversation qui s'est arrêtée ──────────────────────── */
  {
    questions: [
      {
        enonce:
          'Dans la conversation entre Marc et Kenza, à quel moment exact cesse-t-elle d’en être une&nbsp;?',
        options: [
          'À la proposition de l’alarme, qui est la première solution énoncée.',
          'À la fin, quand il demande «&nbsp;on est d’accord&nbsp;?&nbsp;» au lieu de faire redire l’accord.',
          'À la première réplique, parce qu’il annonce d’emblée qu’il y a un problème.',
          'À «&nbsp;pourquoi tu ne regardes pas&nbsp;?&nbsp;»&nbsp;: la question demande une justification, pas une information.',
        ],
        bonne: 3,
        pourquoi:
          'La première réplique est correcte — le fait est daté, il n’y a pas de jugement — et c’est ce qui rend la scène instructive. C’est la troisième qui referme&nbsp;: «&nbsp;pourquoi&nbsp;» n’a qu’une réponse possible, «&nbsp;je sais pas&nbsp;», et elle n’est pas un mensonge. L’alarme et le «&nbsp;on est d’accord&nbsp;» sont des conséquences de cette fermeture, pas sa cause&nbsp;: à ce stade la conversation était déjà finie.',
      },
      {
        enonce:
          'Kenza répond «&nbsp;je sais pas&nbsp;». Que faut-il en conclure&nbsp;?',
        options: [
          'Que c’est probablement vrai&nbsp;: peu de gens savent dire pourquoi ils font ce qu’ils font.',
          'Qu’elle protège quelqu’un et qu’il faut chercher qui.',
          'Qu’elle n’a pas compris la question et qu’il faut la simplifier.',
          'Qu’elle refuse de coopérer et qu’il faut reposer la question autrement.',
        ],
        bonne: 0,
        pourquoi:
          'Le module le dit en une ligne&nbsp;: vous non plus, vous ne sauriez pas dire pourquoi vous avez été en retard la dernière fois. «&nbsp;Je sais pas&nbsp;» est une réponse honnête à une question qui demande une raison, et c’est souvent le début plutôt que la fin. Ce qui suit n’est pas une autre question mais un silence, puis éventuellement une question sur les FAITS — «&nbsp;qu’est-ce que tu faisais juste avant&nbsp;?&nbsp;» — jamais sur les raisons.',
      },
      {
        enonce:
          'Qu’est-ce qui, dans la scène, aurait pu faire apparaître l’histoire du bus&nbsp;?',
        options: [
          'Une question plus directe sur ce qu’elle faisait le samedi après-midi.',
          'Un entretien avec la référente de sa petite sœur.',
          'Dix secondes de silence après «&nbsp;qu’est-ce qui se passe, à ce moment-là&nbsp;?&nbsp;».',
          'Un rappel que l’équipe est là pour l’aider et qu’elle peut tout dire.',
        ],
        bonne: 2,
        pourquoi:
          'C’est le geste technique central du parcours, et le plus difficile&nbsp;: dix secondes sont très longues, presque tout le monde les remplit au bout de trois. Ce que vous mettez dans ces sept secondes est exactement ce que l’autre n’aura pas dit. Une question plus directe aurait obtenu la même réponse polie&nbsp;; et se renseigner ailleurs, c’est apprendre par hasard ce qu’on aurait pu apprendre d’elle — ce qui est précisément ce qui s’est passé, trois semaines trop tard.',
      },
      {
        enonce:
          'Comment le module distingue-t-il un accord obtenu d’un accord consenti&nbsp;?',
        options: [
          'Par le ton de la réponse&nbsp;: un «&nbsp;ouais ouais&nbsp;» n’est pas un vrai oui.',
          'Par la question finale&nbsp;: un accord consenti se redit en une phrase, un accord obtenu ne se redit pas.',
          'Par sa durée&nbsp;: un accord consenti tient plus de dix jours.',
          'Par l’écrit&nbsp;: un accord consenti est signé des deux côtés.',
        ],
        bonne: 1,
        pourquoi:
          'Le test pratique est «&nbsp;redis-moi ce qu’on a décidé&nbsp;?&nbsp;»&nbsp;: quelqu’un qui a participé le redit en une phrase, quelqu’un qui a dit oui pour en finir ne peut pas. Le ton est un indice, pas une preuve, et il se lit mal. La durée est un résultat, pas un critère — on ne peut pas s’en servir pour décider avant. Quant à la signature, le module&nbsp;3 l’exclut explicitement&nbsp;: elle transforme un accord en preuve opposable.',
      },
      {
        enonce:
          'Marc avait pensé à l’alarme pendant le week-end. Qu’est-ce que cela change&nbsp;?',
        options: [
          'Cela explique pourquoi la conversation a été si courte.',
          'Cela aurait été acceptable s’il l’avait proposée à la fin plutôt qu’au milieu.',
          'Rien&nbsp;: c’est une bonne préparation, et la solution était pertinente.',
          'Cela montre qu’il connaissait déjà la solution&nbsp;: ce n’était pas une recherche commune mais une annonce, et Kenza l’a senti avant lui.',
        ],
        bonne: 3,
        pourquoi:
          'C’est le signe qui ne trompe pas. Quand vous connaissez déjà la solution et que vous y tenez, tout le reste de la conversation n’est que le chemin pour y arriver — et l’autre le perçoit très tôt. Le module ne demande pas de renoncer à préparer&nbsp;: il demande de préparer ses QUESTIONS plutôt que sa conclusion. Et si vous tenez à votre solution, annoncez-la franchement&nbsp;: une consigne assumée se discute, une fausse invitation apprend qu’on ne peut pas vous croire.',
      },
    ],
  },

  /* ── MODULE 3 — Les trois temps ────────────────────────────────────────── */
  {
    questions: [
      {
        enonce:
          'Quel est le seul feu vert pour passer du temps&nbsp;1 au temps&nbsp;2&nbsp;?',
        options: [
          'La personne a dit «&nbsp;oui, c’est ça&nbsp;» après votre reformulation.',
          'Vous avez posé au moins trois questions ouvertes.',
          'La personne a cessé de répondre «&nbsp;je sais pas&nbsp;».',
          'Vous avez compris ce qui se passe, même si elle ne l’a pas confirmé.',
        ],
        bonne: 0,
        pourquoi:
          'C’est le seul critère, et il appartient à l’autre&nbsp;: tant qu’elle n’a pas validé votre reformulation, ou bien vous n’avez pas compris, ou bien elle n’a pas tout dit. Le nombre de questions ne prouve rien, et la fin des «&nbsp;je sais pas&nbsp;» non plus. Quant à comprendre sans confirmation&nbsp;: c’est exactement l’interprétation que «&nbsp;Décrire un comportement sans le juger&nbsp;» apprend à annoncer au lieu de la glisser dans les faits.',
      },
      {
        enonce:
          'Laquelle de ces formulations est un temps&nbsp;2 correct&nbsp;?',
        options: [
          '«&nbsp;De mon côté il faut que tu sois rentré à 19&nbsp;h, c’est comme ça.&nbsp;»',
          '«&nbsp;De mon côté, ce qui m’inquiète, c’est que je ne sais pas où tu es après 19&nbsp;h et que je suis responsable de toi. L’heure n’est pas de moi, c’est le règlement.&nbsp;»',
          '«&nbsp;De mon côté, j’aimerais qu’on trouve une solution ensemble pour que tu rentres à l’heure.&nbsp;»',
          '«&nbsp;De mon côté, ça fait trois fois, et la prochaine fois il y aura des conséquences.&nbsp;»',
        ],
        bonne: 1,
        pourquoi:
          'Le temps&nbsp;2 dit ce qui vous préoccupe et pourquoi, jamais ce que l’autre devrait faire — et il pose la limite non négociable en disant d’où elle vient. La première énonce une solution et referme&nbsp;; la troisième a l’air ouverte mais contient déjà le résultat attendu («&nbsp;que tu rentres à l’heure&nbsp;»), c’est une solution déguisée&nbsp;; la quatrième annonce une sanction, ce qui transforme la recherche en négociation sous contrainte.',
      },
      {
        enonce:
          'Au temps&nbsp;3, la personne propose une idée manifestement irréaliste. Que fait-on&nbsp;?',
        options: [
          'On explique pourquoi elle ne peut pas marcher, pour ne pas lui laisser de faux espoirs.',
          'On l’écrit sans commenter, et on continue&nbsp;: c’est souvent la deuxième idée qui compte.',
          'On la reformule pour la rendre acceptable avant de l’écrire.',
          'On propose la sienne à la place, en expliquant qu’elle est plus réaliste.',
        ],
        bonne: 1,
        pourquoi:
          'Écarter la première idée de l’autre ferme la suivante, et c’est la suivante qu’on attend. On note tout, sans commenter, puis on juge chaque idée sur une seule question&nbsp;: est-ce que ça répond aux DEUX préoccupations&nbsp;? Reformuler pour rendre acceptable revient à substituer son idée à la sienne en douce&nbsp;; et proposer la sienne à la place, au moment où l’autre vient de parler, referme le temps&nbsp;3 aussi sûrement qu’une annonce.',
      },
      {
        enonce:
          'Que ne contient JAMAIS un accord écrit, selon le module&nbsp;3&nbsp;?',
        options: [
          'La date de la prochaine relecture.',
          'Ce qui dépend d’une personne absente, avec son nom et la date de sa réponse.',
          'Une sanction en cas de non-respect, et une signature.',
          'Les deux préoccupations, en une phrase chacune.',
        ],
        bonne: 2,
        pourquoi:
          'Une sanction transforme la recherche en négociation sous contrainte&nbsp;; une signature transforme l’accord en preuve, c’est-à-dire en quelque chose qu’on ressortira contre quelqu’un. Les trois autres éléments sont au contraire obligatoires&nbsp;: sans date de relecture, un accord est un espoir&nbsp;; et ce qui dépend d’un tiers doit nommer qui demande et quand il répond, sans quoi l’accord dépend de quelqu’un qui n’était pas dans la pièce.',
      },
      {
        enonce:
          'La conversation n’aboutit à rien au bout de quinze minutes. Quelle est la bonne sortie&nbsp;?',
        options: [
          'Poser soi-même la solution pour ne pas laisser le problème sans réponse.',
          'Demander à la personne de réfléchir et de revenir avec une proposition.',
          'Dire qu’on n’a pas trouvé aujourd’hui, et fixer une date pour se revoir.',
          'Laisser tomber ce problème et en choisir un autre, plus accessible.',
        ],
        bonne: 2,
        pourquoi:
          '«&nbsp;On n’a pas trouvé aujourd’hui, on se revoit jeudi&nbsp;» est un résultat honorable et fréquent, très supérieur à un accord bâclé qui ne tiendra pas trois jours. Poser sa solution à la fin annule tout ce qui précède. Renvoyer la personne chercher seule lui transfère le travail qu’on venait de proposer de faire à deux. Et abandonner le problème contredit le tri&nbsp;: s’il était sur la bonne branche, il coûte toujours quelque chose à la personne.',
      },
    ],
  },

  /* ── MODULE 4 — Tenir l'accord ─────────────────────────────────────────── */
  {
    questions: [
      {
        enonce:
          'L’accord a parfaitement tenu pendant dix jours. Que fait-on de la relecture prévue&nbsp;?',
        options: [
          'On la fait quand même&nbsp;: c’est la plus utile des quatre, c’est elle qui rend la conversation suivante possible.',
          'On l’annule&nbsp;: la relecture sert à réparer ce qui n’a pas marché.',
          'On la repousse de dix jours pour vérifier que ça tient dans la durée.',
          'On la remplace par un mot dans le cahier de liaison.',
        ],
        bonne: 0,
        pourquoi:
          'C’est le cas le plus fréquemment sauté, et c’est une erreur&nbsp;: un accord jamais relu s’érode sans que personne ne le remarque, et la personne n’aura jamais su que ça avait marché. La relecture d’un accord qui a tenu sert à dire que ça a marché, à alléger ce qui peut l’être, et à transmettre l’accord à l’équipe pour qu’il ne dépende plus de vous. La transmission est un complément de la relecture, pas un substitut.',
      },
      {
        enonce:
          'L’accord n’a pas tenu. Dans quel ordre examine-t-on les causes&nbsp;?',
        options: [
          'On commence par demander à la personne si elle a vraiment essayé.',
          'Irréaliste d’abord, puis préoccupation manquante, puis défaut de transmission, puis problème qui a changé.',
          'On regarde d’abord si quelqu’un dans l’équipe a défait l’accord.',
          'On reprend la conversation depuis le début, les trois temps compris.',
        ],
        bonne: 1,
        pourquoi:
          'L’ordre n’est pas décoratif&nbsp;: «&nbsp;irréaliste&nbsp;» est de loin la cause la plus fréquente, et la regarder en premier évite de refaire une conversation entière pour un accord qu’il suffisait de rendre plus petit. Commencer par interroger l’effort de la personne, c’est aller à la cinquième hypothèse avant les quatre autres. Et reprendre les trois temps est la réponse à UNE des causes — préoccupation manquante —, pas à toutes&nbsp;: dans ce cas-là, on refait le temps&nbsp;1 et lui seul.',
      },
      {
        enonce:
          'L’accord demandait d’envoyer un message à chaque sortie. Il a tenu deux jours, puis plus rien. Que fait-on&nbsp;?',
        options: [
          'On le répète plus fermement, en rappelant qu’il avait été accepté.',
          'On le rend plus petit&nbsp;: un message une fois par semaine plutôt qu’à chaque sortie.',
          'On ajoute un rappel sur le téléphone pour compenser l’oubli.',
          'On conclut que la personne n’était pas prête et on attend qu’elle le redemande.',
        ],
        bonne: 1,
        pourquoi:
          'Tenir deux jours puis plus rien est la signature d’un accord irréaliste&nbsp;: trop d’efforts, trop souvent. On le rend plus petit — c’est la seule action qui traite la cause. Le répéter plus fermement ne le rend pas réaliste, ça l’use et ça use la personne avec&nbsp;; ajouter un mécanisme par-dessus alourdit encore un accord déjà trop lourd&nbsp;; et attendre qu’elle redemande, c’est la cinquième hypothèse déguisée en patience.',
      },
      {
        enonce:
          'Pourquoi le module écarte-t-il «&nbsp;elle n’a pas voulu&nbsp;» des causes à examiner&nbsp;?',
        options: [
          'Parce que c’est faux&nbsp;: une personne veut toujours que ça s’arrange.',
          'Parce que ce serait un jugement, et qu’on n’en écrit pas dans un dossier.',
          'Parce que cette hypothèse ne mène à aucune action, alors que les quatre autres en donnent chacune une — on la garde donc pour après.',
          'Parce qu’elle relève d’un autre parcours du catalogue.',
        ],
        bonne: 2,
        pourquoi:
          'Le motif est pratique, pas moral&nbsp;: le module dit explicitement que cette hypothèse est parfois exacte, et qu’on ne l’écarte pas définitivement — on la garde pour la fin, ce que presque personne ne fait. Et si la personne dit clairement qu’elle ne veut pas, c’est une information précieuse&nbsp;: elle dit que le problème choisi n’était pas le sien, et on retourne au tri. Ce n’est donc ni faux par principe, ni renvoyé ailleurs.',
      },
      {
        enonce:
          'Que peut-on écrire dans le dossier après une relecture où l’accord n’a pas tenu&nbsp;?',
        options: [
          '«&nbsp;Reste dans l’opposition et ne respecte pas les accords posés.&nbsp;»',
          '«&nbsp;Accord du 14&nbsp;: tenu 2 fois sur 3. Relecture du 24&nbsp;: l’autorisation n’ayant pas été accordée, l’accord est remplacé par [autre disposition], à titre d’essai jusqu’au 10.&nbsp;»',
          '«&nbsp;A fait des efforts mais manque encore de maturité pour tenir un engagement.&nbsp;»',
          '«&nbsp;L’accord a échoué&nbsp;; une nouvelle tentative sera faite si elle en fait la demande.&nbsp;»',
        ],
        bonne: 1,
        pourquoi:
          'On écrit ce qu’une caméra aurait vu, on date, on dit ce qui remplace, et on ne qualifie personne — c’est la règle de «&nbsp;Décrire un comportement sans le juger&nbsp;» appliquée à un accord. Les deux premières mauvaises réponses collent un trait de caractère à une personne&nbsp;; il sera recopié dans le dossier suivant et la suivra des années. La dernière est factuelle mais fausse sur le fond&nbsp;: elle renvoie la charge de la reprise à la personne, alors que la relecture a eu lieu et qu’une décision a été prise. Et rappelons-le&nbsp;: la personne a accès à ce qui est écrit sur elle (art. L311-3 du CASF).',
      },
    ],
  },
];
