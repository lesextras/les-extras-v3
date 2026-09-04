// LES GUIDES DES ÉCRITS PROFESSIONNELS.
//
// POURQUOI CETTE SECTION EXISTE (2 septembre 2026).
//
// Un concurrent direct de LEX — notasuivi.fr — occupait la première page de
// Google sur « écrits professionnels éducateur spécialisé », c'est-à-dire sur
// la requête qui décrit exactement ce que LEX fait, avec des guides génériques
// et sans un seul exemple rédigé. C'est le canal d'acquisition le plus rentable
// de ce marché, et nous n'y étions pas.
//
// TROIS RÈGLES D'ÉCRITURE, TENUES SUR TOUS LES GUIDES :
//
// 1. AUCUNE RÉFÉRENCE JURIDIQUE INVENTÉE. Chaque article cité ci-dessous a été
//    vérifié article par article le 2 septembre 2026. Trois pièges classiques
//    ont été évités et méritent d'être écrits noir sur blanc, parce qu'ils
//    circulent partout ailleurs :
//      · le CASF ne dit JAMAIS « projet personnalisé » dans le régime général,
//        il dit « projet d'accueil et d'accompagnement » (L311-3, 7°) ;
//      · le rapport annuel au juge des enfants vient du DERNIER ALINÉA DE
//        L'ARTICLE 375 DU CODE CIVIL, pas de l'article L223-5 du CASF, qui
//        régit le rapport administratif — ce sont deux obligations distinctes ;
//      · l'article D351-16-1 du code de l'éducation ne régit PAS l'ESS (il
//        traite de l'aide humaine) : c'est le D351-10.
//    La loi du 17 juillet 1978 n'est plus citable : elle est codifiée dans le
//    Code des relations entre le public et l'administration depuis 2016.
//
// 2. AUCUNE RECOMMANDATION OFFICIELLE INVENTÉE NON PLUS. Il n'existe AUCUNE
//    recommandation ANESM/HAS consacrée aux écrits professionnels — vérifié
//    sur la liste consolidée des recommandations du champ. La règle « faits
//    d'un côté, interprétation de l'autre » est une règle de métier, solide,
//    mais ce n'est pas une norme opposable : elle est présentée comme telle.
//    Ce que la HAS exige réellement (cadre national de référence de janvier
//    2021, outil 6), c'est l'ÉQUILIBRE : éléments préoccupants ET points
//    d'appui, point de vue de l'enfant ET des parents.
//
// 3. DE VRAIS AVANT/APRÈS. C'est le seul endroit où nous sommes structurellement
//    meilleurs qu'un contenu écrit pour le référencement : nous faisons ce
//    métier. Les exemples sont fictifs et anonymes, jamais tirés d'un dossier.

export type Bloc =
  | { type: 'p'; texte: string }
  | { type: 'liste'; items: string[] }
  | { type: 'reecriture'; avant: string; apres: string; pourquoi: string };

export interface Section {
  titre: string;
  blocs: Bloc[];
}

export interface Reference {
  /** Ce que le texte dit, en une phrase. */
  quoi: string;
  /** La référence exacte, telle qu'on peut la vérifier. */
  ou: string;
}

export interface GuideEcrit {
  slug: string;
  /** Balise <title>, calibrée court. */
  titre: string;
  /** H1. */
  accroche: string;
  description: string;
  /** Chapô affiché sous le H1. */
  chapo: string;
  minutes: number;
  /** Encadré « ce que dit le droit », en tête de page. Vide si sans objet. */
  cadre: Reference[];
  sections: Section[];
  faq: { q: string; r: string }[];
}

/* ────────────────────────────────────────────────────────────────────────── */

const PILIER: GuideEcrit = {
  slug: 'ecrits-professionnels-educateur-specialise',
  titre: 'Les écrits professionnels en travail social',
  accroche: 'Les écrits professionnels de l’éducateur spécialisé',
  description:
    'Ce que vous écrivez sera lu par la famille et parfois par un juge. Les six règles qui tiennent, la distinction faits/interprétation, et des exemples réécrits phrase par phrase.',
  chapo:
    'Un écrit professionnel n’est pas un exercice de style : c’est une pièce qui circule, qui reste, et qui pèse sur la vie de quelqu’un. Voici ce qui le rend solide : et les formulations qui le fragilisent, réécrites.',
  minutes: 9,
  cadre: [
    {
      quoi: 'La personne accompagnée a accès à toute information ou document relatif à sa prise en charge.',
      ou: 'Code de l’action sociale et des familles, article L311-3, 5°',
    },
    {
      quoi: 'Les documents portant une appréciation ou un jugement de valeur sur une personne nommément désignée ne sont communicables qu’à cette personne.',
      ou: 'Code des relations entre le public et l’administration, article L311-6',
    },
    {
      quoi: 'En assistance éducative, les parents, le service gardien et le mineur capable de discernement peuvent consulter le dossier au greffe jusqu’à la veille de l’audience ; le juge ne peut en écarter des pièces que par décision motivée.',
      ou: 'Code de procédure civile, article 1187',
    },
  ],
  sections: [
    {
      titre: 'Écrivez comme si la famille lisait, parce qu’elle lira',
      blocs: [
        {
          type: 'p',
          texte:
            'C’est la règle qui commande toutes les autres, et ce n’est pas une précaution morale : c’est le régime de droit commun. En assistance éducative, l’article 1187 du code de procédure civile ouvre la consultation du dossier au greffe aux parents et au mineur capable de discernement, et le juge ne peut écarter une pièce que par une décision qu’il doit motiver. Côté administratif, l’article L223-5 du CASF impose que le contenu et les conclusions du rapport de situation soient portés à la connaissance des parents et du mineur selon son âge et sa maturité.',
        },
        {
          type: 'p',
          texte:
            'Autrement dit : la phrase que vous écrivez à trois heures de l’après-midi, épuisé, entre deux transmissions, sera peut-être lue par la mère dont vous parlez. Ce n’est pas une raison pour édulcorer. C’est une raison pour être exact.',
        },
        {
          type: 'reecriture',
          avant:
            'La mère est dans le déni total et refuse toute remise en question. Elle instrumentalise clairement l’enfant contre le père.',
          apres:
            'Lors de l’entretien du 14 mars, Mme M. a indiqué ne pas partager l’inquiétude du service concernant l’absentéisme scolaire de [le jeune] et a déclaré : « à la maison il n’y a aucun problème ». Elle a refusé la proposition d’un temps d’échange avec le père en présence du service. [Le jeune] nous a rapporté le 21 mars que sa mère lui aurait dit de ne pas parler de son père devant nous ; le père n’a pas été rencontré depuis le 4 février.',
          pourquoi:
            '« Déni total », « instrumentalise » et « clairement » sont des qualifications, pas des observations : elles ne se prouvent pas et elles se retournent contre le service à l’audience. La version réécrite dit strictement la même inquiétude, mais elle est datée, sourcée, et le lecteur, juge, parent, collègue, peut la vérifier.',
        },
      ],
    },
    {
      titre: 'Séparer ce que vous avez vu de ce que vous en pensez',
      blocs: [
        {
          type: 'p',
          texte:
            'Aucun texte ne l’impose : contrairement à ce qu’on lit souvent, il n’existe pas de recommandation officielle de la HAS ou de l’ancienne ANESM consacrée aux écrits professionnels. C’est une règle de métier, pas une norme opposable : mais c’est la règle qui distingue un écrit qui tient d’un écrit qui s’effondre à la première contestation.',
        },
        {
          type: 'p',
          texte:
            'Concrètement, trois registres doivent rester visuellement distincts dans votre texte. Ce que vous avez constaté (un fait, daté, situé). Ce qui vous a été rapporté (par qui, quand, dans quels termes). Ce que vous en déduisez (votre analyse, annoncée comme telle). Un lecteur doit pouvoir contester votre analyse sans contester vos faits.',
        },
        {
          type: 'liste',
          items: [
            'Constat : « Le 3 avril, [le jeune] est arrivé à l’internat sans ses affaires de sport pour la quatrième fois consécutive. »',
            'Élément rapporté : « L’enseignante référente indique, par courriel du 5 avril, qu’il n’a pas participé aux séances d’EPS depuis le 12 mars. »',
            'Analyse : « Le service fait l’hypothèse d’un évitement lié au regard des pairs sur son corps, hypothèse que [le jeune] n’a ni confirmée ni infirmée lors de l’entretien du 8 avril. »',
          ],
        },
        {
          type: 'p',
          texte:
            'Le mot « hypothèse » n’affaiblit pas l’écrit. Il le rend recevable. Une analyse présentée comme un fait est attaquable ; une hypothèse assumée comme telle ne l’est pas.',
        },
      ],
    },
    {
      titre: 'Dire aussi ce qui va bien, c’est une exigence, pas une politesse',
      blocs: [
        {
          type: 'p',
          texte:
            'Le cadre national de référence publié par la HAS en janvier 2021, rendu obligatoire pour l’évaluation des informations préoccupantes par le décret n° 2022-1728 du 30 décembre 2022, demande explicitement que le rapport présente « à la fois les éléments préoccupants et les points d’appui / ressources repérés », ainsi que le point de vue de l’enfant, celui des parents et celui des autres membres du réseau.',
        },
        {
          type: 'p',
          texte:
            'Un écrit qui n’aligne que des difficultés donne une image fausse et, très concrètement, prive le magistrat des leviers sur lesquels il pourrait s’appuyer. Un parent qui n’est décrit que par ses manquements n’a plus de raison de coopérer, et il l’a lu.',
        },
      ],
    },
    {
      titre: 'Nommer les personnes correctement',
      blocs: [
        {
          type: 'liste',
          items: [
            'Les mineurs par leur prénom et l’initiale du nom, ou par leur fonction dans la situation. Jamais « le cas », jamais « le sujet ».',
            'Les adultes par leur civilité et leur nom : « Mme M. », « M. D. ». La civilité n’est pas un ornement, elle marque le respect dû à quelqu’un qui vous lira.',
            'Les professionnels par leur fonction, pas leur nom, sauf si l’identification est nécessaire : « l’éducatrice référente », « la psychologue du service ».',
            'Les tiers non concernés : le moins possible. L’article L311-6 du CRPA réserve à la seule personne concernée les documents qui portent sur elle un jugement de valeur : plus vous nommez de tiers, plus vous compliquez la communication du dossier.',
          ],
        },
      ],
    },
    {
      titre: 'Les cinq formulations à supprimer de vos écrits',
      blocs: [
        {
          type: 'liste',
          items: [
            '« Il est manipulateur » → décrivez le comportement observé et son contexte. La qualification psychologique n’appartient pas à l’éducateur.',
            '« La famille est démissionnaire » → dites ce qui a été proposé, ce qui a été refusé, et ce qui n’a pas eu lieu.',
            '« Comme chacun sait » / « il est évident que » → si c’est évident, le fait suffit ; sinon, c’est une opinion.',
            '« Il semblerait que » sans source → indiquez qui vous l’a rapporté et quand, ou n’écrivez pas la phrase.',
            '« Toujours », « jamais », « systématiquement » → comptez. Quatre fois sur six est un fait ; « systématiquement » est une exagération qu’un avocat relèvera.',
          ],
        },
      ],
    },
    {
      titre: 'Combien de temps cela devrait vous prendre',
      blocs: [
        {
          type: 'p',
          texte:
            'Un rapport de situation bien mené prend rarement moins de deux heures : relire les transmissions, retrouver les dates, vérifier ce qui a effectivement été proposé, écrire, faire relire. Ce n’est pas du temps perdu : c’est le temps qui fait la différence entre un écrit qui décide et un écrit qu’on subit.',
        },
        {
          type: 'p',
          texte:
            'Ce que LEX fait, c’est la partie mécanique : structurer un brouillon à partir de vos notes, tenir la trame de votre établissement, proposer une reformulation quand une phrase glisse vers le jugement. Ce qu’il ne fait pas, et ne fera pas : décider à votre place de ce qui doit être écrit. Les noms des personnes ne quittent jamais votre poste : ils sont remplacés par des rôles avant tout envoi, et rétablis à l’arrivée.',
        },
      ],
    },
  ],
  faq: [
    {
      q: 'Un parent peut-il vraiment lire tout ce que j’écris sur lui ?',
      r: 'Dans la procédure d’assistance éducative, oui : l’article 1187 du code de procédure civile permet aux parents de consulter le dossier au greffe du juge des enfants jusqu’à la veille de l’audience. Le juge peut écarter des pièces, mais seulement par décision motivée et en cas de danger physique ou moral grave. Hors procédure judiciaire, l’article L311-3, 5° du CASF garantit l’accès aux documents relatifs à la prise en charge, et l’article L311-6 du CRPA en fixe les limites lorsque des tiers sont concernés.',
    },
    {
      q: 'Faut-il faire relire ses écrits par le chef de service ?',
      r: 'Aucun texte ne l’impose de façon générale, mais c’est la pratique de la quasi-totalité des services, et pour une bonne raison : l’écrit engage l’établissement, pas seulement son auteur. Une relecture à deux repère en dix minutes les qualifications non étayées et les dates manquantes, qui sont les deux défauts les plus fréquents.',
    },
    {
      q: 'Peut-on utiliser une intelligence artificielle pour rédiger un écrit professionnel ?',
      r: 'Pour aider à structurer et à reformuler, oui, à une condition non négociable : que les données nominatives ne sortent pas de votre poste de travail. C’est le principe de LEX : les noms sont remplacés par des rôles avant tout traitement et rétablis localement. Coller un rapport nominatif dans un assistant grand public, en revanche, transmet des données de santé et des données de mineurs à un tiers, ce que ni le RGPD ni votre employeur ne permettent.',
    },
  ],
};

/* ────────────────────────────────────────────────────────────────────────── */

const RAPPORT: GuideEcrit = {
  slug: 'rapport-de-situation-protection-de-l-enfance',
  titre: 'Le rapport de situation, en protection de l’enfance',
  accroche: 'Rédiger un rapport de situation en protection de l’enfance',
  description:
    'Deux obligations distinctes, trois domaines de vie imposés par décret, un destinataire qui n’est pas toujours celui qu’on croit. La méthode complète, avec un exemple réécrit.',
  chapo:
    'Le rapport annuel au juge des enfants et le rapport de situation de l’aide sociale à l’enfance ne reposent pas sur le même texte, n’ont pas le même destinataire et n’ont pas la même périodicité. Les confondre est l’erreur la plus fréquente.',
  minutes: 8,
  cadre: [
    {
      quoi: 'Un rapport concernant la situation de l’enfant doit être transmis annuellement au juge des enfants.',
      ou: 'Code civil, article 375, dernier alinéa',
    },
    {
      quoi: 'Le service élabore au moins une fois par an un rapport sur la situation de tout enfant accueilli ou faisant l’objet d’une mesure éducative, tous les six mois pour les enfants de moins de deux ans. Son contenu et ses conclusions sont portés à la connaissance du père, de la mère, du tuteur et du mineur selon son âge et sa maturité.',
      ou: 'Code de l’action sociale et des familles, article L223-5',
    },
    {
      quoi: 'Le contenu du rapport de situation est fixé par référentiel réglementaire, organisé autour de trois domaines de vie.',
      ou: 'Décret n° 2016-1557 du 17 novembre 2016, articles R223-18 à R223-21 du CASF',
    },
  ],
  sections: [
    {
      titre: 'Deux rapports, deux fondements, ne les mélangez pas',
      blocs: [
        {
          type: 'p',
          texte:
            'Le rapport annuel au juge des enfants découle du dernier alinéa de l’article 375 du code civil. C’est une obligation judiciaire, attachée à la mesure d’assistance éducative. Le rapport de situation de l’article L223-5 du CASF, lui, est une obligation administrative qui pèse sur le service de l’aide sociale à l’enfance et sur le président du conseil départemental.',
        },
        {
          type: 'p',
          texte:
            'En pratique, le même document sert souvent les deux usages : mais si vous devez citer un texte dans un courrier, une note de service ou une procédure interne, citez le bon. Et retenez la périodicité renforcée : tous les six mois pour les enfants de moins de deux ans. Cette règle vient de la loi du 14 mars 2016, pas de la loi Taquet du 7 février 2022 : laquelle a bien modifié l’article L223-5, mais sur d’autres points.',
        },
      ],
    },
    {
      titre: 'Les trois domaines de vie imposés par le référentiel',
      blocs: [
        {
          type: 'p',
          texte:
            'Le décret du 17 novembre 2016 organise le rapport autour de trois domaines. Ce n’est pas un plan suggéré : c’est le cadre réglementaire, et un rapport qui n’en couvre qu’un est incomplet quel que soit son volume.',
        },
        {
          type: 'liste',
          items: [
            'Le développement et la santé physique et psychique de l’enfant.',
            'Les relations familiales et les relations avec les tiers.',
            'La scolarité et la vie sociale.',
          ],
        },
        {
          type: 'p',
          texte:
            'À quoi s’ajoutent l’évaluation pluridisciplinaire, le bilan des actions menées au titre du projet pour l’enfant, et l’atteinte, ou non, des objectifs fixés par la décision administrative ou judiciaire. C’est ce dernier point qui manque le plus souvent : le rapport raconte l’année sans jamais revenir sur ce que la décision demandait.',
        },
      ],
    },
    {
      titre: 'La partie que tout le monde bâcle : la conclusion',
      blocs: [
        {
          type: 'p',
          texte:
            'La conclusion est la seule partie que le magistrat lira à coup sûr, et souvent en premier. Elle doit répondre à trois questions et à rien d’autre : où en est-on, qu’est-ce qui a changé depuis la dernière décision, et que propose le service.',
        },
        {
          type: 'reecriture',
          avant:
            'Au vu de ce qui précède, il apparaît que la situation reste préoccupante et que le maintien de la mesure semble nécessaire afin de poursuivre le travail engagé avec la famille.',
          apres:
            'Deux des trois objectifs fixés par l’ordonnance du 12 mai 2025 sont atteints : la scolarité de [le jeune] est stabilisée (aucune exclusion depuis novembre, 92 % de présence au deuxième trimestre) et les visites médiatisées se déroulent sans incident depuis février. Le troisième, la reprise d’un hébergement au domicile maternel un week-end sur deux, n’a pas pu être engagé : Mme M. a annulé les quatre rendez-vous de préparation proposés entre janvier et avril. Le service propose le renouvellement de la mesure de placement pour douze mois, assorti d’un objectif unique et resserré : la mise en œuvre effective de ces temps d’hébergement, avec un point d’étape à six mois.',
          pourquoi:
            'La première version ne dit rien qu’un magistrat puisse utiliser : ni ce qui a changé, ni ce qui bloque, ni ce qu’on demande. La seconde est chiffrée, elle reprend les objectifs de la décision précédente un par un, elle nomme l’obstacle sans qualifier la mère, et elle formule une demande précise. Elle fait la même longueur.',
        },
      ],
    },
    {
      titre: 'Avant d’envoyer : la relecture en six points',
      blocs: [
        {
          type: 'liste',
          items: [
            'Chaque affirmation est-elle datée ? Un fait sans date n’est pas vérifiable.',
            'Les trois domaines de vie sont-ils couverts, même brièvement ?',
            'Les objectifs de la décision précédente sont-ils repris un par un ?',
            'Les points d’appui apparaissent-ils, et pas seulement les difficultés ?',
            'Le point de vue de l’enfant et celui des parents sont-ils rapportés, dans leurs mots ?',
            'Le contenu et les conclusions ont-ils été portés à la connaissance des parents et du mineur, comme l’exige l’article L223-5 ?',
          ],
        },
      ],
    },
  ],
  faq: [
    {
      q: 'À quelle fréquence faut-il rédiger un rapport de situation ?',
      r: 'Au moins une fois par an au titre de l’article L223-5 du CASF, et tous les six mois pour les enfants de moins de deux ans. En assistance éducative, le dernier alinéa de l’article 375 du code civil impose en outre la transmission annuelle d’un rapport au juge des enfants ; en AEMO, l’article 375-2 prévoit un rapport « périodique ».',
    },
    {
      q: 'Doit-on montrer le rapport aux parents avant de l’envoyer ?',
      r: 'L’article L223-5 du CASF impose que son contenu et ses conclusions soient portés à la connaissance du père, de la mère, du tuteur et du mineur selon son âge et sa maturité. Le texte parle de porter à connaissance, ce qui n’est pas une demande d’accord : le service reste l’auteur de son analyse.',
    },
    {
      q: 'Que faire si les parents contestent ce qui est écrit ?',
      r: 'Leur désaccord se rapporte, et c’est une force pour l’écrit : « Mme M. conteste cette lecture et indique que… ». Un rapport qui restitue le désaccord est plus crédible qu’un rapport qui l’efface, et le magistrat y trouve l’information qu’il cherche : la position réelle de chacun.',
    },
  ],
};

/* ────────────────────────────────────────────────────────────────────────── */

const PROJET: GuideEcrit = {
  slug: 'projet-personnalise-objectifs',
  titre: 'Écrire un projet personnalisé qui tient',
  accroche: 'Le projet personnalisé et ses objectifs',
  description:
    'Les délais réglementaires que presque personne ne connaît, la différence entre un objectif et une intention, et cinq objectifs réécrits pour devenir évaluables.',
  chapo:
    'Le projet personnalisé est le document le plus recopié du secteur : et celui dont les objectifs sont le plus souvent inévaluables. Voici comment le rendre utile, et ce que la réglementation exige vraiment.',
  minutes: 7,
  cadre: [
    {
      quoi: 'La personne accueillie a droit à la participation directe à la conception et à la mise en œuvre du projet d’accueil et d’accompagnement qui la concerne.',
      ou: 'Code de l’action sociale et des familles, article L311-3, 7°',
    },
    {
      quoi: 'Un contrat de séjour est conclu ou un document individuel de prise en charge (DIPC) est établi.',
      ou: 'Code de l’action sociale et des familles, article L311-4',
    },
    {
      quoi: 'Le document est remis au plus tard dans les quinze jours suivant l’admission et conclu dans le mois qui suit ; un avenant précise dans un délai maximum de six mois les objectifs et les prestations adaptées ; le tout est réactualisé chaque année.',
      ou: 'Code de l’action sociale et des familles, article D311',
    },
  ],
  sections: [
    {
      titre: 'Une précision de vocabulaire qui a des conséquences',
      blocs: [
        {
          type: 'p',
          texte:
            'Le Code de l’action sociale et des familles n’emploie pas l’expression « projet personnalisé » dans son régime général : il parle de « projet d’accueil et d’accompagnement » (article L311-3, 7°). L’expression « projet personnalisé d’accompagnement » existe en revanche dans le régime propre aux ITEP, à l’article D312-59-2.',
        },
        {
          type: 'p',
          texte:
            'Ce n’est pas de la pédanterie : si vous écrivez dans une procédure interne ou un courrier à l’ARS que « le projet personnalisé est imposé par l’article L311-3 », la citation est fausse et se vérifie en trente secondes. Dites plutôt : le projet personnalisé est la mise en œuvre concrète du droit à la participation garanti par l’article L311-3, 7°.',
        },
      ],
    },
    {
      titre: 'Les trois délais que presque personne ne cite correctement',
      blocs: [
        {
          type: 'p',
          texte:
            'Ils ne figurent pas dans l’article L311-4, que tout le monde cite, mais dans la partie réglementaire : l’article D311 du CASF, issu du décret du 26 novembre 2004.',
        },
        {
          type: 'liste',
          items: [
            'Quinze jours : le contrat de séjour ou le DIPC est remis à la personne, au plus tard, dans les quinze jours qui suivent l’admission.',
            'Un mois : il est conclu dans le mois qui suit l’admission.',
            'Six mois : un avenant précise, dans un délai maximum de six mois, les objectifs et les prestations adaptées à la personne.',
            'Puis chaque année : le tout est réactualisé annuellement.',
          ],
        },
        {
          type: 'p',
          texte:
            'C’est cet avenant à six mois qui porte les objectifs : pas le document d’admission. Beaucoup d’établissements le découvrent lors d’une évaluation, alors qu’il s’agit du document que l’autorité de contrôle demande en premier.',
        },
      ],
    },
    {
      titre: 'Un objectif, ce n’est pas une intention',
      blocs: [
        {
          type: 'p',
          texte:
            'Le test est simple : dans six mois, une personne qui n’a pas suivi la situation doit pouvoir dire si l’objectif est atteint, sans vous appeler. Si elle ne peut pas, ce n’est pas un objectif.',
        },
        {
          type: 'reecriture',
          avant: 'Favoriser l’autonomie de [le jeune] dans les gestes du quotidien.',
          apres:
            'D’ici au 30 juin, [le jeune] prépare seul son petit-déjeuner quatre matins sur sept, avec une consigne orale de rappel le premier jour de la semaine. Évaluation : relevé quotidien tenu par l’équipe du matin, point d’étape le 15 avril.',
          pourquoi:
            '« Favoriser » n’est pas un résultat, c’est une posture professionnelle : elle décrit ce que fait l’équipe, pas ce qui aura changé pour la personne. La version réécrite nomme le comportement attendu, sa fréquence, l’échéance, l’aide maintenue et la façon dont on saura.',
        },
        {
          type: 'reecriture',
          avant: 'Travailler le lien avec la famille.',
          apres:
            'Deux visites médiatisées d’une heure par mois avec la mère, à partir du 15 mars, en présence de l’éducatrice référente pour les trois premières puis sans tiers si les trois se déroulent sans interruption. Point d’étape avec Mme M. le 20 mai.',
          pourquoi:
            'Le premier énoncé pourrait figurer dans n’importe quel projet de n’importe quel service : c’est le signe qu’il ne dit rien. Le second engage l’établissement sur un dispositif précis, ce qui est exactement ce que la personne et sa famille sont en droit d’attendre d’un document qu’elles cosignent.',
        },
      ],
    },
    {
      titre: 'Faire participer réellement, et le prouver',
      blocs: [
        {
          type: 'p',
          texte:
            'La participation directe est un droit, pas une formalité de fin de réunion. Le moyen le plus simple de la rendre visible dans le document : une rubrique où figurent, dans leurs mots, ce que la personne demande, ce qu’elle refuse, et ce sur quoi elle n’est pas d’accord avec l’équipe. Deux phrases entre guillemets valent mieux qu’un paragraphe qui affirme que « la personne a été associée à l’élaboration ».',
        },
        {
          type: 'p',
          texte:
            'La recommandation de bonnes pratiques de référence sur ce point reste « Les attentes de la personne et le projet personnalisé », publiée par l’ANESM en décembre 2008 et toujours diffusée par la HAS.',
        },
      ],
    },
  ],
  faq: [
    {
      q: 'Quel est le délai légal pour établir le projet personnalisé ?',
      r: 'L’article D311 du CASF prévoit que le contrat de séjour ou le DIPC est remis dans les quinze jours suivant l’admission et conclu dans le mois, et qu’un avenant précise les objectifs et les prestations adaptées dans un délai maximum de six mois. Ce sont ces six mois qui constituent en pratique le délai du projet personnalisé.',
    },
    {
      q: 'Le projet personnalisé doit-il être signé par la personne ?',
      r: 'Le contrat de séjour est conclu avec la personne ou son représentant légal : il est donc signé. Le DIPC, lui, est établi par l’établissement lorsque la conclusion d’un contrat n’est pas possible. Dans les deux cas, l’avenant qui porte les objectifs suit le régime du document principal.',
    },
    {
      q: 'Combien d’objectifs faut-il écrire ?',
      r: 'Aucun texte ne le fixe. L’expérience du secteur converge vers deux à quatre objectifs réellement travaillés sur six mois. Un projet qui en aligne huit annonce, en pratique, qu’aucun ne sera évalué.',
    },
  ],
};

/* ────────────────────────────────────────────────────────────────────────── */

const ESS: GuideEcrit = {
  slug: 'compte-rendu-ess-geva-sco',
  titre: 'ESS et GEVA-Sco : ce qu’il faut écrire',
  accroche: 'Préparer une équipe de suivi de la scolarisation',
  description:
    'Qui réunit l’ESS, qui remplit le GEVA-Sco, et pourquoi le compte rendu que vous cherchez n’existe pas séparément. Le guide complet, textes à l’appui.',
  chapo:
    'Deux confusions coûtent chaque année des heures aux équipes : croire que l’ESS produit un compte rendu distinct du GEVA-Sco, et se tromper d’article du code de l’éducation. Voici la version exacte.',
  minutes: 6,
  cadre: [
    {
      quoi: 'L’équipe de suivi de la scolarisation procède, au moins une fois par an, à l’évaluation du projet personnalisé de scolarisation et de sa mise en œuvre.',
      ou: 'Code de l’éducation, article D351-10',
    },
    {
      quoi: 'L’enseignant référent assure la permanence des relations avec l’élève et ses parents ; il réunit et coordonne l’équipe de suivi de la scolarisation.',
      ou: 'Code de l’éducation, article D351-12',
    },
    {
      quoi: 'Le GEVA-Sco est fixé par arrêté ; il existe en deux versions, « première demande » et « réexamen ».',
      ou: 'Arrêté du 6 février 2015, publié au Journal officiel du 11 février 2015',
    },
  ],
  sections: [
    {
      titre: 'Le compte rendu de l’ESS, c’est le GEVA-Sco réexamen',
      blocs: [
        {
          type: 'p',
          texte:
            'C’est la réponse à la question la plus posée sur le sujet : il n’y a pas, d’un côté, un compte rendu de réunion et, de l’autre, un GEVA-Sco. Le GEVA-Sco réexamen, rempli par l’enseignant référent lors de la réunion, constitue le compte rendu de l’ESS. Chercher un modèle de compte rendu séparé, c’est chercher un document qui n’existe pas.',
        },
        {
          type: 'liste',
          items: [
            'GEVA-Sco première demande : rempli par l’équipe éducative, convoquée par le directeur d’établissement, en dialogue avec l’élève majeur ou ses représentants légaux. Il concerne un élève qui n’a pas encore de projet personnalisé de scolarisation.',
            'GEVA-Sco réexamen : rempli par l’enseignant référent lors de l’ESS. Il fait le bilan d’un PPS existant et vaut compte rendu de la réunion.',
          ],
        },
        {
          type: 'p',
          texte:
            'Le GEVA-Sco n’est pas un document interne : il alimente l’évaluation de l’équipe pluridisciplinaire de la MDPH. Ce que vous y écrivez remonte, et pèse sur les décisions de compensation.',
        },
      ],
    },
    {
      titre: 'Une erreur de référence qui circule beaucoup',
      blocs: [
        {
          type: 'p',
          texte:
            'L’article qui régit l’équipe de suivi de la scolarisation est le D351-10 du code de l’éducation, complété par le D351-11 (les expertises sur lesquelles l’équipe s’appuie) et le D351-12 (le rôle de l’enseignant référent). L’article D351-16-1, qu’on voit souvent cité à tort, traite d’autre chose : l’aide humaine, et le fait qu’un même élève ne peut se voir attribuer simultanément une aide mutualisée et une aide individuelle.',
        },
      ],
    },
    {
      titre: 'Ce que le service médico-social apporte à la réunion',
      blocs: [
        {
          type: 'p',
          texte:
            'Un SESSAD ou un IME n’a pas à refaire le travail de l’école. Sa contribution utile tient en trois éléments, et ils gagnent à être préparés par écrit avant la réunion.',
        },
        {
          type: 'liste',
          items: [
            'Ce que le service observe dans un cadre différent de la classe : autonomie, fatigabilité, relations aux pairs, gestion des transitions. Ce sont des informations que l’enseignant n’a pas.',
            'Ce qui a changé depuis la dernière ESS, avec des dates. Une ESS qui répète celle de l’an dernier n’aide personne.',
            'Ce que le service demande concrètement pour l’année à venir : un aménagement précis, un temps partagé, une modification d’emploi du temps. Une demande formulée en réunion et consignée pèse ; la même exprimée oralement sans trace disparaît.',
          ],
        },
        {
          type: 'reecriture',
          avant:
            'Les progrès sont notables mais [le jeune] reste en difficulté sur les apprentissages et un accompagnement renforcé serait souhaitable.',
          apres:
            'Depuis septembre, [le jeune] tient une séance de trente minutes sans sortir de la salle, contre dix minutes l’an dernier : relevé sur les vingt-quatre séances du service. Les sorties de classe restent concentrées sur les temps de transition (interclasses, entrée en salle après la récréation) : sept des neuf incidents signalés par l’établissement en relèvent. Le service demande que l’AESH accompagne prioritairement ces temps de transition plutôt que les temps d’apprentissage assis, et propose de partager sa grille d’observation avec l’enseignante au premier trimestre.',
          pourquoi:
            '« Notable », « en difficulté » et « souhaitable » ne permettent à personne de décider quoi que ce soit. La version réécrite apporte une mesure, identifie un motif, et transforme le constat en une demande précise que l’ESS peut acter.',
        },
      ],
    },
  ],
  faq: [
    {
      q: 'Qui réunit l’équipe de suivi de la scolarisation ?',
      r: 'L’enseignant référent, en application de l’article D351-12 du code de l’éducation. C’est également lui qui assure la permanence des relations avec l’élève et ses parents.',
    },
    {
      q: 'À quelle fréquence l’ESS se réunit-elle ?',
      r: 'Au moins une fois par an : l’article D351-10 du code de l’éducation impose à l’équipe de procéder au moins annuellement à l’évaluation du projet personnalisé de scolarisation et de sa mise en œuvre. Elle peut se réunir plus souvent à la demande de la famille ou de l’équipe.',
    },
    {
      q: 'Qui remplit le GEVA-Sco ?',
      r: 'Cela dépend de la version. Le GEVA-Sco première demande est rempli par l’équipe éducative convoquée par le directeur d’établissement ; le GEVA-Sco réexamen est rempli par l’enseignant référent lors de la réunion de l’ESS.',
    },
  ],
};

/* ────────────────────────────────────────────────────────────────────────── */

const IP: GuideEcrit = {
  slug: 'information-preoccupante-ou-signalement',
  titre: 'Information préoccupante ou signalement ?',
  accroche: 'Information préoccupante ou signalement : deux circuits, pas deux intensités',
  description:
    'Ce ne sont pas deux degrés d’une même démarche. Destinataires, fondements juridiques et effets diffèrent. Le guide qui évite l’erreur d’aiguillage.',
  chapo:
    'On enseigne souvent que l’information préoccupante serait un « petit » signalement. C’est faux, et cette croyance envoie des situations au mauvais destinataire. Voici la ligne de partage exacte.',
  minutes: 7,
  cadre: [
    {
      quoi: 'L’information préoccupante est l’information transmise à la cellule départementale pour alerter sur la situation d’un mineur pouvant laisser craindre que sa santé, sa sécurité ou sa moralité sont en danger ou en risque de l’être, ou que les conditions de son éducation ou de son développement sont compromises.',
      ou: 'Code de l’action sociale et des familles, article R226-2-2',
    },
    {
      quoi: 'Le président du conseil départemental est chargé du recueil, du traitement et de l’évaluation des informations préoccupantes, à tout moment et quelle qu’en soit l’origine.',
      ou: 'Code de l’action sociale et des familles, article L226-3',
    },
    {
      quoi: 'Le président du conseil départemental avise sans délai le procureur de la République dans les cas énumérés ; toute personne saisissant directement le procureur lui en adresse copie.',
      ou: 'Code de l’action sociale et des familles, article L226-4',
    },
  ],
  sections: [
    {
      titre: 'Deux circuits distincts',
      blocs: [
        {
          type: 'p',
          texte:
            'L’information préoccupante suit la voie administrative : elle part vers la cellule départementale de recueil (la CRIP), et le président du conseil départemental en organise le traitement et l’évaluation. Le signalement suit la voie judiciaire : il vise le procureur de la République, qui décide des suites pénales et peut saisir le juge des enfants.',
        },
        {
          type: 'p',
          texte:
            'Ce ne sont pas deux paliers du même acte. Ce sont deux administrations, deux fondements textuels, deux temporalités et deux effets. Une situation qui appelle une évaluation pluridisciplinaire va à la CRIP. Une situation où un enfant est en danger immédiat, ou lorsque des faits susceptibles de constituer une infraction sont portés à votre connaissance, va au procureur.',
        },
        {
          type: 'p',
          texte:
            'Un réflexe utile : l’article L226-4 précise que quiconque saisit directement le procureur doit en adresser copie au président du conseil départemental. Le département n’est donc jamais court-circuité : c’est une raison de moins d’hésiter quand l’urgence commande.',
        },
      ],
    },
    {
      titre: 'Une idée fausse qui expose les professionnels',
      blocs: [
        {
          type: 'p',
          texte:
            'On entend souvent que « tout professionnel a l’obligation de signaler au titre de l’article 40 du code de procédure pénale ». C’est inexact. Le deuxième alinéa de l’article 40 ne vise que « toute autorité constituée, tout officier public ou fonctionnaire ». Un éducateur salarié d’une association de droit privé n’en relève pas.',
        },
        {
          type: 'p',
          texte:
            'Ce qui s’applique à lui, c’est l’article 226-14 du code pénal, qui lève le secret professionnel pour informer les autorités de privations ou de sévices infligés à un mineur. C’est une permission, pas une obligation générale : et cette nuance est précisément ce qui rend la décision collective, en équipe et avec le chef de service, plutôt qu’individuelle et solitaire.',
        },
      ],
    },
    {
      titre: 'Une autre confusion : l’article 375 du code civil',
      blocs: [
        {
          type: 'p',
          texte:
            'L’article 375 du code civil ne fonde pas le signalement. Il définit l’assistance éducative et énumère qui peut saisir le juge des enfants : les père et mère conjointement ou l’un d’eux, la personne ou le service à qui l’enfant a été confié, le tuteur, le mineur lui-même, le ministère public, et, à titre exceptionnel seulement, le juge d’office.',
        },
        {
          type: 'p',
          texte:
            'Conséquence directe et souvent ignorée : un service qui n’est pas gardien ne peut pas saisir le juge des enfants. Il passe par la CRIP ou par le procureur. Écrire « nous saisissons le juge des enfants » dans un courrier, quand on n’est pas gardien, est une erreur qui décrédibilise l’ensemble du dossier.',
        },
      ],
    },
    {
      titre: 'Écrire une information préoccupante : les cinq blocs',
      blocs: [
        {
          type: 'p',
          texte:
            'Le rôle de l’écrit n’est pas de qualifier le danger : c’est le travail de l’évaluation qui suivra, désormais encadrée par le cadre national de référence publié par la HAS en janvier 2021 et rendu obligatoire par le décret du 30 décembre 2022. Votre rôle est de transmettre ce que vous savez, proprement.',
        },
        {
          type: 'liste',
          items: [
            'Qui : identité du mineur, âge, adresse, composition familiale connue, mesures en cours.',
            'Quoi : les faits, datés, dans l’ordre chronologique. Ce que vous avez constaté vous-même, et ce qui vous a été rapporté : en distinguant les deux.',
            'Les paroles : ce que l’enfant a dit, entre guillemets, dans ses mots, sans reformulation. C’est le seul endroit où la formulation exacte compte plus que le style.',
            'Ce qui a déjà été tenté : entretiens, propositions, refus, partenaires mobilisés.',
            'Ce qui vous inquiète, annoncé comme votre analyse : et non comme une conclusion.',
          ],
        },
        {
          type: 'p',
          texte:
            'Attention au dernier point : n’écrivez pas « cet enfant est en danger ». Écrivez ce que vous observez et ce que vous craignez. La qualification du danger n’appartient pas à l’auteur de l’information préoccupante.',
        },
      ],
    },
    {
      titre: 'Faut-il prévenir les parents ?',
      blocs: [
        {
          type: 'p',
          texte:
            'Oui, en principe. L’article L226-2-2 du CASF encadre le partage d’informations à caractère secret entre professionnels : il doit être strictement limité à ce qui est nécessaire, et les parents comme le mineur doivent en être informés préalablement, sauf si cette information est contraire à l’intérêt de l’enfant.',
        },
        {
          type: 'p',
          texte:
            'Cette exception existe et elle est réelle. Mais c’est une exception : elle se décide en équipe, elle se motive, et elle se consigne.',
        },
      ],
    },
    {
      titre: 'Pourquoi LEX ne rédige pas d’information préoccupante',
      blocs: [
        {
          type: 'p',
          texte:
            'C’est une décision assumée, et c’est la seule trame que nous avons volontairement laissée hors du catalogue de l’assistant. Rédiger une information préoccupante, c’est qualifier un danger : cela engage la responsabilité du professionnel, cela déclenche une évaluation, et cela peut aboutir à une séparation. Aucun outil d’aide à la rédaction n’a sa place à cet endroit-là.',
        },
        {
          type: 'p',
          texte:
            'LEX vous aide sur le rapport de situation, le bilan de fin d’accompagnement, le compte rendu d’activité, les courriers aux partenaires et aux titulaires de l’autorité parentale. Pas sur celui-ci.',
        },
      ],
    },
  ],
  faq: [
    {
      q: 'Quelle différence entre information préoccupante et signalement ?',
      r: 'L’information préoccupante est adressée à la cellule départementale de recueil (CRIP) et suit la voie administrative, sur le fondement des articles L226-3 et R226-2-2 du CASF. Le signalement vise le procureur de la République et suit la voie judiciaire, sur le fondement de l’article L226-4 du CASF. Ce ne sont pas deux intensités d’un même acte mais deux circuits distincts, avec des destinataires et des effets différents.',
    },
    {
      q: 'Un éducateur en association est-il tenu de signaler au procureur ?',
      r: 'L’article 40, alinéa 2, du code de procédure pénale n’oblige que les autorités constituées, officiers publics et fonctionnaires : il ne s’applique pas de plein droit à un salarié d’association. L’article 226-14 du code pénal lève en revanche le secret professionnel pour informer les autorités de privations ou sévices infligés à un mineur : c’est une permission, et la décision se prend en équipe.',
    },
    {
      q: 'Peut-on saisir directement le juge des enfants ?',
      r: 'Seulement si l’on figure parmi les personnes énumérées à l’article 375 du code civil : les parents, la personne ou le service à qui l’enfant a été confié, le tuteur, le mineur lui-même, ou le ministère public. Un service non gardien passe par la CRIP ou par le procureur.',
    },
  ],
};

/* ────────────────────────────────────────────────────────────────────────── */

const BILAN: GuideEcrit = {
  slug: 'bilan-de-fin-d-accompagnement',
  titre: 'Le bilan de fin d’accompagnement',
  accroche: 'Rédiger un bilan de fin d’accompagnement',
  description:
    'Le document qu’on écrit le plus vite et qui sert le plus longtemps : c’est lui que le service suivant lira. Structure, écueils, et un exemple réécrit.',
  chapo:
    'Le bilan de fin d’accompagnement est rédigé dans l’urgence d’une sortie, et relu des mois plus tard par un professionnel qui ne connaît rien de la situation. Écrivez pour lui.',
  minutes: 6,
  cadre: [
    {
      quoi: 'La personne a droit à l’accès à toute information ou document relatif à sa prise en charge.',
      ou: 'Code de l’action sociale et des familles, article L311-3, 5°',
    },
    {
      quoi: 'Les documents portant une appréciation ou un jugement de valeur sur une personne nommément désignée ne sont communicables qu’à cette personne.',
      ou: 'Code des relations entre le public et l’administration, article L311-6',
    },
  ],
  sections: [
    {
      titre: 'Écrivez pour le professionnel suivant, pas pour votre dossier',
      blocs: [
        {
          type: 'p',
          texte:
            'Un bilan de fin d’accompagnement a deux lecteurs. La personne concernée et sa famille, qui y ont accès. Et surtout le professionnel qui prendra la suite, un autre service, un référent ASE, un enseignant, un employeur en insertion, et qui n’a aucune connaissance du dossier.',
        },
        {
          type: 'p',
          texte:
            'Ce second lecteur cherche trois choses, dans cet ordre : ce qui marche avec cette personne, ce qui ne marche pas, et ce qu’il ne faut surtout pas refaire. Un bilan qui raconte chronologiquement deux ans d’accompagnement sans jamais répondre à ces trois questions est un document que personne ne lira jusqu’au bout.',
        },
      ],
    },
    {
      titre: 'La structure qui fonctionne',
      blocs: [
        {
          type: 'liste',
          items: [
            'Le cadre : dates d’entrée et de sortie, nature de la mesure, motif de la fin (échéance, déménagement, orientation, rupture).',
            'Le point de départ : la situation à l’arrivée, en quelques lignes. C’est ce qui permet de mesurer le chemin parcouru.',
            'Les objectifs et leur devenir : repris un par un, atteints, partiellement atteints ou non atteints, avec ce qui l’explique.',
            'Ce qui a fonctionné : les leviers concrets, nommés. « Les entretiens en marchant », « la présence du grand frère aux rendez-vous », « les consignes écrites plutôt qu’orales ».',
            'Ce qui n’a pas fonctionné : dit sans détour, et sans en faire porter la responsabilité à la personne.',
            'Les préconisations : ce que le service recommande pour la suite, et pourquoi.',
          ],
        },
      ],
    },
    {
      titre: 'Le passage qui décide de tout',
      blocs: [
        {
          type: 'reecriture',
          avant:
            'L’accompagnement s’est heurté au manque d’adhésion de [le jeune], qui n’a jamais réellement investi la relation éducative malgré les efforts constants de l’équipe.',
          apres:
            'Sur les vingt-quatre rendez-vous proposés en bureau, [le jeune] en a honoré neuf. Sur les onze temps proposés en extérieur, trajets, atelier vélo, courses, il en a honoré dix. Ce contraste, constant sur les deux années, a été le principal enseignement de l’accompagnement : la relation s’établit dans l’activité partagée et se dérobe dans le face-à-face assis. Le service recommande au professionnel suivant de construire les premiers temps de rencontre sur un support concret plutôt que sur un entretien.',
          pourquoi:
            'La première version rend la personne responsable de l’échec et ne transmet rien d’utilisable. La seconde transmet un savoir : elle donne au professionnel suivant la clé qu’il aurait mis six mois à trouver seul. C’est exactement ce à quoi sert un bilan.',
        },
      ],
    },
    {
      titre: 'Trois écueils fréquents',
      blocs: [
        {
          type: 'liste',
          items: [
            'Recopier les rapports antérieurs. Un bilan n’est pas une compilation : c’est une synthèse écrite depuis la fin, avec le recul que les rapports intermédiaires n’avaient pas.',
            'Régler ses comptes avec la famille ou avec un partenaire. Ce document sera lu, y compris par les personnes concernées, et il survivra à votre passage dans le service.',
            'Omettre ce qui a échoué. Un bilan qui ne dit que la réussite prive le suivant de l’information la plus précieuse, et il se remarque.',
          ],
        },
      ],
    },
  ],
  faq: [
    {
      q: 'Le bilan de fin d’accompagnement est-il obligatoire ?',
      r: 'Aucun texte général ne l’impose sous ce nom. Il découle en pratique de l’obligation de continuité de l’accompagnement et des exigences d’évaluation de la qualité, et il est presque toujours prévu par les procédures internes et les conventions avec les financeurs. En protection de l’enfance, il s’articule avec le rapport de situation de l’article L223-5 du CASF.',
    },
    {
      q: 'La personne peut-elle demander à lire son bilan ?',
      r: 'Oui : l’article L311-3, 5° du CASF garantit l’accès à toute information ou document relatif à la prise en charge. L’article L311-6 du CRPA en fixe la limite lorsque le document porte une appréciation ou un jugement de valeur sur un tiers nommément désigné : raison de plus pour n’y nommer que les personnes nécessaires.',
    },
    {
      q: 'Combien de pages ?',
      r: 'Deux à quatre. Au-delà, le professionnel suivant lira la première page et la conclusion. Autant écrire ces deux-là très bien.',
    },
  ],
};

/* ────────────────────────────────────────────────────────────────────────── */

export const GUIDES_ECRITS: GuideEcrit[] = [PILIER, RAPPORT, PROJET, ESS, IP, BILAN];

export function trouverGuideEcrit(slug: string): GuideEcrit | undefined {
  return GUIDES_ECRITS.find((g) => g.slug === slug);
}
