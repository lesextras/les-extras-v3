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

const TRANSMISSIONS: GuideEcrit = {
  slug: 'transmissions-cahier-de-liaison',
  titre: 'Les transmissions et le cahier de liaison',
  accroche: 'Écrire des transmissions qui tiendront dans six mois',
  description:
    'L’écrit le plus court du métier est celui qui pèse le plus lourd : la transmission du soir se retrouve dans le rapport, puis dans l’orientation. Le test de la caméra, les mots à bannir, et un gabarit en trois lignes.',
  chapo:
    'On écrit une transmission en deux minutes, debout, à la fin d’un service. Six mois plus tard, quelqu’un qui n’était pas là la relit pour décider d’une orientation. Ce guide sert à ce que la phrase écrite vite soit encore vraie ce jour-là.',
  minutes: 8,
  cadre: [
    {
      quoi: 'La personne accompagnée a accès à toute information ou document relatif à sa prise en charge.',
      ou: 'Code de l’action sociale et des familles, article L311-3, 5°',
    },
    {
      quoi: 'Les documents portant une appréciation ou un jugement de valeur sur une personne nommément désignée ne sont communicables qu’à cette personne.',
      ou: 'Code des relations entre le public et l’administration, article L311-6',
    },
  ],
  sections: [
    {
      titre: 'L’écrit du soir devient une orientation six mois plus tard',
      blocs: [
        {
          type: 'p',
          texte:
            'Une transmission n’a pas de lecteur au moment où on l’écrit : c’est ce qui la rend dangereuse. On l’écrit pour le collègue du lendemain, qui la lira en diagonale entre deux levers. Mais elle ne disparaît pas le lendemain. Elle reste dans le cahier de liaison ou dans le logiciel, c’est elle que l’éducateur référent rouvre au moment de rédiger le rapport de situation, et c’est d’elle que sort la phrase « des comportements agressifs sont régulièrement relevés en soirée » qui, un jour, motive un changement d’orientation.',
        },
        {
          type: 'p',
          texte:
            'Le rapport n’est jamais meilleur que les transmissions dont il est tiré. Un rapport rédigé à partir de trente lignes qui disent « soirée compliquée » ou « Nassim insupportable ce soir » ne pourra rien dire de plus, quelle que soit la qualité de son auteur. À l’inverse, trente lignes qui disent ce qui s’est passé, à quelle heure, après quoi, permettent d’écrire trois mois plus tard une phrase chiffrée que personne ne pourra contester.',
        },
        {
          type: 'p',
          texte:
            'C’est pour cela que le cahier de liaison est l’écrit le plus important du secteur, et le moins enseigné : il ne se relit pas avant d’être envoyé, il n’a pas de trame, il n’est pas corrigé par un chef de service. Tout repose sur le réflexe de la personne qui écrit.',
        },
      ],
    },
    {
      titre: 'Le test de la caméra',
      blocs: [
        {
          type: 'p',
          texte:
            'Une seule question, à se poser avant de poser le stylo : une caméra fixée au plafond de la pièce aurait-elle enregistré ce que je viens d’écrire ? Elle aurait filmé un enfant qui renverse une chaise, qui crie, qui pleure, qui sort de la pièce, qui reste vingt minutes sous la table. Elle n’aurait pas filmé un enfant « agressif », « provocateur », « qui cherche l’affrontement » ou « qui teste le cadre ». Ces mots-là ne sont pas des images, ce sont des lectures.',
        },
        {
          type: 'p',
          texte:
            'Le test ne demande pas d’écrire sans penser. Il demande de séparer les deux couches. La couche filmable d’abord, avec l’heure, le lieu et ce qui s’est passé ; la lecture ensuite, si elle est utile, annoncée comme telle : « je fais l’hypothèse que… », « il me semble que… ». Un collègue peut contester votre hypothèse sans contester votre description. Si les deux sont fondues dans le même mot, il doit tout rejeter ou tout accepter.',
        },
        {
          type: 'p',
          texte:
            'Aucun texte ne l’impose. Il n’existe pas de recommandation officielle de la HAS ni de l’ancienne ANESM consacrée aux écrits professionnels, et la règle « les faits d’un côté, l’interprétation de l’autre » est une règle de métier, pas une norme opposable. Mais c’est celle qui fait qu’une transmission résiste à la relecture, six mois après, par quelqu’un qui n’a pas la même lecture que vous.',
        },
        {
          type: 'reecriture',
          avant:
            'Nassim a encore été agressif au repas. Il a cherché la confrontation avec tout le monde et a fini par pourrir la soirée du groupe. Rien ne le calme.',
          apres:
            '19 h 10, salle à manger. Pendant le service, Nassim a poussé son assiette qui est tombée au sol. Il a dit « j’en veux pas de ta bouffe » à l’éducatrice qui servait, puis a quitté la table. Il est resté dans le couloir jusqu’à 19 h 35, assis par terre. Est revenu de lui-même et a mangé un yaourt debout. Le reste du groupe a terminé le repas sans incident. Ce qui a précédé : à 19 h, sa mère a appelé pour dire qu’elle ne viendrait pas samedi.',
          pourquoi:
            '« Agressif », « cherché la confrontation », « pourrir la soirée », « rien ne le calme » : quatre lectures, zéro image. La version réécrite tient en cinq lignes, dit ce qu’une caméra aurait vu, et surtout donne l’information qui manquait : l’appel de la mère, dix minutes avant. C’est cette ligne-là qui servira dans le rapport. Elle change tout, et elle ne coûte rien à écrire.',
        },
      ],
    },
    {
      titre: 'Les mots qui font passer une opinion pour un fait',
      blocs: [
        {
          type: 'p',
          texte:
            'Certains mots sont des jugements déguisés en descriptions. Ils ont l’air neutres parce que tout le monde les emploie, et c’est justement pour cela qu’ils passent. En voici quelques-uns, avec ce qu’il faut écrire à la place.',
        },
        {
          type: 'liste',
          items: [
            '« Agressif » → dites le geste et la parole : a tapé dans la porte, a dit « je vais te casser la gueule », a jeté le verre vers Théo.',
            '« Manipulateur » → c’est une qualification psychologique, elle n’appartient pas à l’éducateur. Décrivez la séquence : a demandé à sortir à l’éducatrice A qui a refusé, l’a demandé dix minutes plus tard à l’éducateur B sans mentionner le premier refus.',
            '« La mère est dans le déni » → écrivez ce qu’elle a dit, entre guillemets, et ce qu’elle a refusé : « Mme R. a indiqué qu’il n’y avait aucun problème à la maison et a décliné le rendez-vous proposé le 12. »',
            '« Comportement inadapté » → inadapté à quoi ? Le mot dit seulement que vous n’avez pas aimé. Décrivez le comportement, et le contexte qui le rend problématique.',
            '« Il fait exprès », « il sait très bien ce qu’il fait » → ce sont des affirmations sur ce qui se passe dans la tête de quelqu’un. Aucune caméra ne le filme. Supprimez.',
            '« Comme d’habitude », « encore », « toujours » → comptez. « Troisième fois cette semaine » est un fait ; « encore » est un soupir.',
          ],
        },
        {
          type: 'p',
          texte:
            'Le plus insidieux de tous est le diagnostic glissé sans y penser. Sous une signature éducative, un mot médical est une affirmation que personne n’a posée. Il reste dans le dossier, se recopie de rapport en rapport, et finit par retarder la vraie consultation parce que « c’est déjà dit ». Si un diagnostic existe, on le rapporte en citant qui l’a posé et quand. On n’en formule jamais un.',
        },
      ],
    },
    {
      titre: 'Le gabarit en trois lignes',
      blocs: [
        {
          type: 'p',
          texte:
            'Une transmission utile tient en trois lignes, toujours dans le même ordre. Ce n’est pas une trame de plus : c’est ce qui fait qu’on peut la relire vite, la comparer à celle d’hier, et la retrouver dans six mois.',
        },
        {
          type: 'liste',
          items: [
            'Quand et où : l’heure, même approximative, et le lieu. « Vers 17 h 30, salle d’activités. » Sans l’heure, on ne peut pas relier l’événement à ce qui l’entoure.',
            'Ce qui a précédé : la consigne donnée, le refus, l’appel téléphonique, l’arrivée d’un autre jeune, la fin d’une activité. C’est la ligne que tout le monde oublie, et c’est la plus utile : un comportement sans antécédent paraît surgir de la personne.',
            'Ce qui s’est passé, puis ce qui a suivi : les gestes, les paroles entre guillemets, la durée. Et comment cela s’est terminé : de lui-même, après une proposition, après un changement de pièce. Le retour au calme est une information aussi importante que la montée.',
          ],
        },
        {
          type: 'reecriture',
          avant:
            'Clara en crise cet après-midi, a dû être isolée. Comportement inadapté envers les autres. À surveiller.',
          apres:
            '16 h 45, salle d’activités, fin de l’atelier peinture. Consigne de ranger donnée au groupe. Clara a continué à peindre ; deuxième rappel de l’éducateur à 16 h 50. Elle a jeté son pinceau dans l’évier, a crié « vous me laissez jamais finir », a poussé Lina qui passait derrière elle (Lina a reculé, pas de chute). L’éducateur lui a proposé d’aller finir son dessin dans le bureau ; elle a accepté et y est restée quinze minutes, seule, porte ouverte. Revenue au goûter à 17 h 10, a demandé pardon à Lina d’elle-même.',
          pourquoi:
            'La première version ne dit ni quand, ni ce qui a précédé, ni ce que l’adulte a fait, et « isolée » décrit une mesure qui n’a pas eu lieu (elle est allée finir son dessin, porte ouverte, sur proposition). La seconde met l’adulte dans la scène, avec ses deux rappels, et donne la fin : la proposition qui a marché, et l’excuse spontanée. C’est cette fin qu’on voudra retrouver le jour où on cherchera ce qui aide Clara.',
        },
        {
          type: 'p',
          texte:
            'Vous remarquerez que dans les deux réécritures, l’adulte apparaît. C’est volontaire. La plupart des transmissions décrivent ce que le jeune a fait et rien de ce que l’adulte a fait juste avant. Or c’est souvent là que se trouve la clé : le rappel donné de loin, la consigne lancée à tout le groupe, la porte fermée. Écrire ce que vous avez fait n’est pas s’accuser : c’est donner à l’équipe la moitié de l’information qu’elle n’a jamais.',
        },
      ],
    },
    {
      titre: 'Écrire aussi ce qui va bien, sinon le dossier ment',
      blocs: [
        {
          type: 'p',
          texte:
            'On écrit quand ça déborde. Les soirées ordinaires ne laissent aucune trace, ou un « RAS ». Résultat mécanique : le cahier de liaison ne contient que les incidents, et le rapport qui en sera tiré décrira un jeune qui n’existe pas, celui des seuls mauvais jours. Un écrit qui n’aligne que des difficultés n’est pas neutre parce qu’il est factuel. Il est à charge, et il est faux par omission.',
        },
        {
          type: 'reecriture',
          avant: 'RAS. Soirée calme.',
          apres:
            'Soirée sans incident. Théo a mis la table sans qu’on le lui demande (première fois depuis son arrivée), a aidé Sofiane à finir ses devoirs de maths pendant vingt minutes. Couché à 21 h 30 à la première demande.',
          pourquoi:
            'Les deux versions décrivent la même soirée. La seconde donne trois informations qu’on ne retrouvera nulle part ailleurs, et qui pèseront le jour où il faudra écrire les points d’appui : l’initiative, la coopération avec un pair, le coucher sans rappel. Écrire ce qui va bien prend trente secondes de plus et c’est ce qui rend le dossier juste.',
        },
      ],
    },
    {
      titre: 'La personne lira son dossier, et c’est le droit commun',
      blocs: [
        {
          type: 'p',
          texte:
            'L’article L311-3, 5° du code de l’action sociale et des familles garantit à la personne accompagnée l’accès à toute information ou document relatif à sa prise en charge. Le cahier de liaison en fait partie. Un jeune devenu majeur, un parent, une personne accueillie en foyer peut demander à le lire, et les transmissions rédigées à chaud sont exactement ce qu’ils y trouveront.',
        },
        {
          type: 'p',
          texte:
            'Deux conséquences pratiques. La première : chaque ligne doit pouvoir être lue par la personne qu’elle décrit sans que vous ayez à la reformuler. Ce n’est pas une raison d’adoucir ce qui s’est passé, c’est une raison d’être exact. La seconde tient à l’article L311-6 du code des relations entre le public et l’administration : les documents qui portent une appréciation ou un jugement de valeur sur une personne nommément désignée ne sont communicables qu’à elle. Plus une transmission nomme d’autres jeunes, plus elle devient compliquée à communiquer. Nommez les tiers le moins possible, et jamais avec un jugement.',
        },
        {
          type: 'p',
          texte:
            'Enfin, si la situation est judiciarisée, le rapport tiré de ces transmissions sera consultable au greffe par les parents et par le mineur capable de discernement, en application de l’article 1187 du code de procédure civile. Le mot « manipulateur » écrit un soir de fatigue peut se retrouver, recopié, sous les yeux d’un avocat.',
        },
      ],
    },
  ],
  faq: [
    {
      q: 'Faut-il tout écrire, ou seulement ce qui est important ?',
      r: 'Ce qui sort de l’ordinaire, dans un sens comme dans l’autre : l’incident, mais aussi l’initiative, la première fois, le retour au calme plus rapide que d’habitude. Une transmission qui ne relève que les débordements produit un dossier à charge. La règle utile : si cela pouvait compter pour comprendre la personne dans six mois, cela s’écrit.',
    },
    {
      q: 'Peut-on écrire ce qu’on pense dans une transmission ?',
      r: 'Oui, à condition de l’annoncer comme tel et de le séparer de ce qu’on a vu. « Je fais l’hypothèse que l’appel de sa mère y est pour quelque chose » est une phrase recevable. « Il a encore fait sa crise parce que sa mère a appelé » présente une hypothèse comme un fait et ne se vérifie pas.',
    },
    {
      q: 'Combien de temps une transmission doit-elle prendre ?',
      r: 'Deux à trois minutes pour une transmission ordinaire, cinq pour un événement. L’heure, ce qui a précédé, ce qui s’est passé, ce qui a suivi : ce n’est pas plus long à écrire que « soirée compliquée », c’est seulement plus précis. Le temps gagné se mesure au moment du rapport, quand tout est déjà là.',
    },
    {
      q: 'Un jeune ou un parent peut-il vraiment lire le cahier de liaison ?',
      r: 'L’article L311-3, 5° du CASF garantit l’accès à toute information ou document relatif à la prise en charge, et le cahier de liaison en fait partie. L’article L311-6 du CRPA en fixe la limite : ce qui porte un jugement de valeur sur un tiers nommément désigné n’est communicable qu’à ce tiers. D’où l’intérêt de nommer les autres jeunes le moins possible.',
    },
    {
      q: 'Que faire d’une transmission qu’un collègue a mal écrite ?',
      r: 'On ne la corrige pas et on ne l’efface pas : un écrit daté et signé appartient à son auteur et à la chronologie du dossier. On ajoute la sienne à la suite, datée, avec ce qu’on a observé soi-même. Et on en parle en réunion d’équipe : c’est une question de pratique commune, pas une faute individuelle.',
    },
  ],
};

/* ────────────────────────────────────────────────────────────────────────── */

const INCIDENT: GuideEcrit = {
  slug: 'note-d-incident-evenement-indesirable',
  titre: 'La note d’incident et l’événement indésirable',
  accroche: 'Rédiger une note d’incident en établissement social ou médico-social',
  description:
    'Ce qu’on écrit dans l’heure qui suit, ce qui a précédé, ce qui a suivi, qui a été prévenu, sans qualifier ni juger. Et la différence entre une note interne, une transmission à la direction et une déclaration aux autorités.',
  chapo:
    'Une note d’incident est le seul écrit du métier qu’on rédige en état de choc, et le seul qui sera relu mot à mot, parfois des mois plus tard, par des gens qui n’étaient pas là. Ces deux contraintes commandent tout : on écrit vite, et on n’écrit que ce qu’on a vu.',
  minutes: 8,
  cadre: [
    {
      quoi: 'La personne accompagnée a accès à toute information ou document relatif à sa prise en charge.',
      ou: 'Code de l’action sociale et des familles, article L311-3, 5°',
    },
    {
      quoi: 'Les documents portant une appréciation ou un jugement de valeur sur une personne nommément désignée ne sont communicables qu’à cette personne.',
      ou: 'Code des relations entre le public et l’administration, article L311-6',
    },
  ],
  sections: [
    {
      titre: 'Écrivez dans l’heure, pas le lendemain',
      blocs: [
        {
          type: 'p',
          texte:
            'La mémoire d’un événement violent ou inattendu se réécrit dès qu’on le raconte. Après le premier récit oral au collègue, après l’appel au cadre d’astreinte, après la nuit, la scène a déjà changé : les durées se sont allongées, l’ordre des gestes s’est réorganisé pour faire sens, les paroles exactes ont été remplacées par leur résumé. La note écrite le lendemain est une note sur le souvenir de l’événement, pas sur l’événement.',
        },
        {
          type: 'p',
          texte:
            'D’où la règle : la note d’incident s’écrit dans l’heure, une fois la sécurité de tout le monde assurée, et pas avant. Elle peut être courte, maladroite, comporter des trous signalés comme tels (« je n’ai pas vu qui a lancé la chaise »). Elle ne doit pas être retardée pour être mieux écrite. Une note complétée le lendemain dit qu’elle l’a été, avec la date et l’heure de l’ajout. Et chacun écrit la sienne, seul, avant d’avoir comparé ses souvenirs avec ceux des collègues.',
        },
      ],
    },
    {
      titre: 'Le déroulé en quatre temps',
      blocs: [
        {
          type: 'p',
          texte:
            'Une note d’incident n’est pas un récit, c’est une chronologie. Les heures, même approximatives, structurent tout : une suite de moments, dans l’ordre où ils se sont produits, et rien d’autre.',
        },
        {
          type: 'liste',
          items: [
            'Ce qui a précédé : où en était le groupe, quelle consigne venait d’être donnée, qui était présent, ce que l’adulte a dit ou fait dans les minutes d’avant. C’est la partie que les notes oublient le plus, et la seule qui permette de comprendre.',
            'Ce qui s’est passé : les gestes, les paroles entre guillemets, les objets, les blessures constatées à l’œil nu, la durée. Un geste à la fois. « Il a frappé » ne suffit pas : avec quoi, où, combien de fois, qu’est-ce qui s’est passé entre chaque coup.',
            'Ce qui a suivi : ce que vous avez fait, ce que les autres adultes ont fait, comment cela s’est arrêté, l’état de chacun dans la demi-heure qui suit, où étaient les autres jeunes pendant ce temps.',
            'Qui a été prévenu, à quelle heure, par qui : le cadre d’astreinte, le médecin, les parents ou le représentant légal, le service gardien, les secours. Et ce qui a été dit à la personne concernée elle-même.',
          ],
        },
        {
          type: 'reecriture',
          avant:
            'Vers 18 h, Yanis a pété un câble dans la salle télé et a agressé violemment Malo. On a dû intervenir à plusieurs pour le maîtriser. Malo a été vu par l’infirmière. Le cadre d’astreinte a été prévenu.',
          apres:
            '17 h 55, salle télé. Six jeunes présents, un éducateur (moi). Malo change de chaîne alors que Yanis regardait un match. Yanis dit « remets-le » deux fois, Malo ne répond pas. Vers 18 h, Yanis se lève et donne un coup de poing à Malo sur le côté gauche de la tête, puis un second sur l’épaule. Malo tombe du canapé. Je me place entre les deux et dis à Yanis de sortir ; il sort dans le couloir en tapant dans la porte. L’éducatrice de l’autre groupe, appelée, reste avec Malo. Aucun maintien physique. Malo a une rougeur à la tempe gauche, pas de saignement ; il pleure. Yanis est resté dix minutes dans le couloir puis est monté dans sa chambre, porte ouverte, sans opposition. 18 h 15 : infirmière prévenue, a vu Malo à 18 h 25. 18 h 20 : cadre d’astreinte prévenu par moi. 18 h 40 : mère de Malo prévenue par le cadre. Les quatre autres jeunes sont restés en salle télé avec l’éducatrice.',
          pourquoi:
            '« Pété un câble », « agressé violemment », « maîtriser » : trois expressions qui disent votre émotion, aucune qui dise ce qui s’est passé. La seconde version donne le déclencheur, les gestes un par un, le fait qu’il n’y a pas eu de maintien physique (« intervenir à plusieurs pour le maîtriser » laissait croire l’inverse), la blessure telle qu’on la voit, et la chaîne des personnes prévenues avec les heures. Elle protège Malo, Yanis, et vous.',
        },
      ],
    },
    {
      titre: 'L’adulte fait partie de la scène',
      blocs: [
        {
          type: 'p',
          texte:
            'La tentation, quand on écrit après un incident, est de se décrire comme un témoin. Or vous n’êtes pas un témoin : vous étiez dans la pièce, vous avez dit des choses, fait des gestes, et ces gestes ont pesé sur ce qui a suivi. Une note sans aucun verbe à la première personne décrit un incident sans adulte, ce qui n’existe pas.',
        },
        {
          type: 'p',
          texte:
            'Écrire ce que vous avez fait n’est pas s’accuser. « J’ai dit non depuis le bureau sans me déplacer », « je lui ai pris le bras », « j’ai crié » : ces phrases sont désagréables à écrire, et ce sont celles qu’on cherche en relecture, parce qu’elles permettent à l’équipe de comprendre ce qui aide et ce qui aggrave. Une note qui les omet sera contredite par le jeune, par un autre jeune, ou par la caméra du couloir.',
        },
        {
          type: 'reecriture',
          avant:
            'Lina a refusé de monter se coucher et s’est mise à insulter l’équipe. Elle a fini par jeter son téléphone contre le mur. Elle a été raccompagnée dans sa chambre.',
          apres:
            '21 h 40, salon. J’ai annoncé l’heure du coucher au groupe depuis la porte. Lina, sur son téléphone, n’a pas bougé. À 21 h 45, je lui ai dit depuis le même endroit « Lina, ça fait deux fois, tu montes ». Elle a répondu « ferme-la » sans lever les yeux. Je me suis approché et j’ai tendu la main vers son téléphone en disant « donne-le-moi ». Elle s’est levée et l’a jeté contre le mur du salon (écran cassé). Elle a dit « vous me le prenez toujours, il est à moi ». Elle est montée seule dans sa chambre à 21 h 50. Je ne l’ai pas suivie. Ma collègue est passée la voir à 22 h 10 ; Lina était couchée, a dit qu’elle ne voulait pas parler. Aucun contact physique.',
          pourquoi:
            '« Raccompagnée » suggère un accompagnement physique qui n’a pas eu lieu ; « insulter l’équipe » remplace deux mots précis par une catégorie. Surtout, la première version fait disparaître le geste de l’adulte, la main tendue vers le téléphone, qui précède immédiatement le jet. Le lire n’accuse personne ; il permet de discuter en équipe de ce qu’on fait des téléphones à l’heure du coucher, ce qui est la seule question utile.',
        },
      ],
    },
    {
      titre: 'Sans qualification, sans jugement, sans diagnostic',
      blocs: [
        {
          type: 'p',
          texte:
            'Une note d’incident ne dit pas qui a tort, ni pourquoi la personne a fait ce qu’elle a fait. Ces deux questions viendront en équipe, avec le recul, et d’autres écrits les porteront. Dans la note, chaque mot qui qualifie affaiblit le tout : un lecteur qui tombe sur « violent » ou « incontrôlable » sait que l’auteur a interprété, et se met à douter du reste.',
        },
        {
          type: 'liste',
          items: [
            '« Agressif », « violent » → les gestes, un par un, avec leur cible et leur effet.',
            '« Il a fait une crise », « elle a décompensé » → ce sont des mots médicaux. Décrivez ce que vous avez vu : cris, pleurs, coups dans le mur, durée, comment cela s’est arrêté.',
            '« Il l’a fait exprès », « pour attirer l’attention » → une intention ne se voit pas. Supprimez.',
            '« Nous avons été obligés de » → dites ce que vous avez fait. Le lecteur jugera lui-même si c’était nécessaire.',
          ],
        },
        {
          type: 'p',
          texte:
            'Un mot sur les diagnostics. Sous une signature éducative, un mot médical est une affirmation que personne n’a posée, qui reste dans le dossier et se recopie de note en rapport. Si un diagnostic existe, on le rapporte en disant qui l’a posé et quand ; on n’en formule pas dans une note d’incident, même sous une forme prudente. Ce n’est pas une question de compétence, c’est une question de signature.',
        },
        {
          type: 'reecriture',
          avant:
            'Sofiane, très instable depuis le début de la semaine, a fait une nouvelle crise au moment du départ pour l’école. Impossible de le raisonner. Il a fini par se calmer tout seul au bout d’un moment.',
          apres:
            '8 h 05, hall d’entrée, départ pour l’école. Sofiane, manteau mis, s’est assis par terre contre le mur et a dit « j’y vais pas ». Je lui ai demandé deux fois de se lever ; il a répété « j’y vais pas » en se tenant les genoux, il respirait vite et pleurait. Je suis resté à côté de lui sans parler. Le reste du groupe est parti avec ma collègue à 8 h 10. À 8 h 20, il s’est levé de lui-même et a demandé un verre d’eau. À 8 h 30, il a accepté que je l’accompagne à l’école en voiture ; arrivé à 8 h 50. Troisième fois cette semaine (notes du lundi 3 et du mercredi 5). École prévenue du retard à 8 h 15, cadre informé à 9 h.',
          pourquoi:
            '« Instable », « crise », « impossible de le raisonner » : un jugement, un mot qui ne décrit rien, et une conclusion. La version réécrite dit ce qu’une caméra aurait vu, respiration rapide et pleurs compris, sans les nommer autrement. Elle dit ce que l’adulte a fait, ce qui a fonctionné, et renvoie aux deux notes précédentes au lieu de dire « nouvelle ». C’est sur ces bases-là qu’une consultation pourra être demandée, si l’équipe le décide.',
        },
      ],
    },
    {
      titre: 'Note interne, transmission à la direction, déclaration aux autorités',
      blocs: [
        {
          type: 'p',
          texte:
            'Ce sont trois écrits différents, pour trois destinataires, et la même note ne sert pas aux trois. La note interne est celle qu’on vient de décrire : rédigée par la personne présente, dans l’heure, versée au dossier et lue par l’équipe. Elle existe pour tout incident, même mineur, et ne demande l’autorisation de personne.',
        },
        {
          type: 'p',
          texte:
            'La transmission à la direction est un second temps. Elle reprend la note interne, souvent mot pour mot, et y ajoute ce que la direction doit savoir pour décider : les suites déjà engagées, les blessures constatées, et le cas échéant l’avis de l’équipe sur ce qu’il conviendrait de faire. C’est ici, et pas dans la note initiale, que l’analyse a sa place, annoncée comme telle.',
        },
        {
          type: 'p',
          texte:
            'La déclaration aux autorités, agence régionale de santé ou conseil départemental selon l’établissement, obéit à un régime propre, avec ses critères, son formulaire et ses délais. Ce guide ne le détaille pas : la liste des événements à déclarer et le circuit sont fixés par la procédure de votre établissement, et c’est à la direction qu’il revient de déclarer. Ce qu’il faut retenir, c’est que la déclaration s’appuie sur votre note interne, et qu’elle peut se retrouver telle quelle sous les yeux d’une autorité de contrôle ou d’un magistrat si l’incident donne lieu à une plainte. Une note précise, horodatée et sans qualification rend la déclaration solide ; une note vague oblige la direction à reconstruire les faits deux jours plus tard, à partir de souvenirs.',
        },
      ],
    },
    {
      titre: 'La personne concernée lira, et les autres jeunes aussi',
      blocs: [
        {
          type: 'p',
          texte:
            'L’article L311-3, 5° du code de l’action sociale et des familles garantit à la personne accompagnée l’accès à toute information ou document relatif à sa prise en charge : la note d’incident qui la concerne en fait partie. Cela ne change rien à ce qu’il faut écrire ; cela interdit seulement d’y écrire ce qu’on n’oserait pas dire en face. Et comme un incident implique souvent plusieurs jeunes, l’article L311-6 du code des relations entre le public et l’administration devient concret : les documents qui portent un jugement de valeur sur une personne nommément désignée ne sont communicables qu’à cette personne. Une note sur Yanis qui décrit Malo comme « provocateur » ne pourra pas être communiquée à Yanis sans difficulté ; une note qui dit « Malo a changé de chaîne » le pourra. Nommez les autres jeunes quand la chronologie l’exige, et jamais avec un jugement.',
        },
      ],
    },
  ],
  faq: [
    {
      q: 'Qu’est-ce qu’un événement indésirable ?',
      r: 'Un événement qui porte atteinte, ou aurait pu porter atteinte, à la sécurité, à la santé ou au bien-être d’une personne accueillie ou d’un professionnel : violence, fugue, accident, erreur de traitement, maltraitance. Ceux qui doivent être déclarés aux autorités, et selon quel circuit, sont fixés par la procédure de votre établissement : demandez-la, elle existe.',
    },
    {
      q: 'Qui rédige la note d’incident ?',
      r: 'La personne qui était présente, elle-même, et non son chef de service à partir de son récit. Si plusieurs professionnels étaient là, chacun rédige la sienne, seul. Des notes qui diffèrent sur un détail ne sont pas un problème : elles montrent qu’elles n’ont pas été harmonisées.',
    },
    {
      q: 'Peut-on écrire ce qu’on pense de l’incident ?',
      r: 'Pas dans la note initiale, qui ne porte que les faits. Votre lecture a sa place dans la transmission à la direction ou en réunion d’équipe, annoncée comme une hypothèse. Une note d’incident qui explique sera lue comme une note écrite pour justifier.',
    },
    {
      q: 'Que faire si on n’a pas tout vu ?',
      r: 'L’écrire. « Je n’ai pas vu le début : quand je suis entré, Malo était au sol et Yanis debout à côté de lui » est une phrase parfaitement recevable, et beaucoup plus solide qu’une reconstruction. Une note qui reconnaît ses trous est crue sur le reste.',
    },
  ],
};

/* ────────────────────────────────────────────────────────────────────────── */

const COURRIER: GuideEcrit = {
  slug: 'courrier-aux-parents-autorite-parentale',
  titre: 'Le courrier aux titulaires de l’autorité parentale',
  accroche: 'Écrire aux parents sans juger, et obtenir une réponse',
  description:
    'Informer sans plaider, distinguer ce qui se décide seul de ce qui demande l’accord des parents, laisser la place à leur point de vue, et faire revenir le coupon-réponse. Avec trois courriers réécrits.',
  chapo:
    'Le courrier aux parents est l’écrit qui sort de l’établissement le plus souvent, et celui qui abîme le plus vite une relation quand il est mal fait. Il n’a qu’un but : que le parent sache, comprenne, et réponde. Tout ce qui ne sert pas ces trois choses est à retirer.',
  minutes: 8,
  cadre: [
    {
      quoi: 'Le service élabore au moins une fois par an un rapport sur la situation de tout enfant accueilli ou faisant l’objet d’une mesure éducative, tous les six mois pour les enfants de moins de deux ans. Son contenu et ses conclusions sont portés à la connaissance du père, de la mère, du tuteur et du mineur selon son âge et sa maturité.',
      ou: 'Code de l’action sociale et des familles, article L223-5',
    },
    {
      quoi: 'La personne accueillie a droit à la participation directe à la conception et à la mise en œuvre du projet d’accueil et d’accompagnement qui la concerne.',
      ou: 'Code de l’action sociale et des familles, article L311-3, 7°',
    },
  ],
  sections: [
    {
      titre: 'Un courrier informe, il ne plaide pas',
      blocs: [
        {
          type: 'p',
          texte:
            'Le courrier aux parents a une fonction et une seule : porter à leur connaissance une information qu’ils doivent avoir, et leur permettre d’y répondre. Une sortie, un séjour, une décision de l’établissement, la date d’une réunion, un événement qui a concerné leur enfant. Il ne sert pas à convaincre, à recadrer, ni à préparer un rapport en constituant des preuves.',
        },
        {
          type: 'p',
          texte:
            'C’est pourtant ce que font beaucoup de courriers, sans le vouloir. Ils commencent par informer, puis glissent vers « nous ne pouvons que constater », « malgré nos nombreuses sollicitations », « comme nous vous l’avons déjà indiqué ». Chacune de ces formules dit au parent qu’il est en tort. Il le lit, il se ferme, et la réunion suivante commence avec une personne qui vient se défendre. La règle qui tient : jamais d’argumentaire contre un parent dans un courrier. Si un désaccord existe, il se traite en entretien, et l’entretien se consigne ensuite dans le dossier, pas dans une lettre.',
        },
        {
          type: 'reecriture',
          avant:
            'Madame, Monsieur, malgré nos nombreuses relances, nous constatons que Nassim n’a toujours pas ses affaires de sport, ce qui l’empêche de participer aux séances depuis un mois. Nous vous rappelons qu’il est de votre responsabilité de fournir le nécessaire à votre enfant. Nous comptons sur vous pour régulariser rapidement la situation.',
          apres:
            'Madame, Monsieur, Nassim n’a pas pu participer aux quatre dernières séances de sport du jeudi (les 5, 12, 19 et 26 mars), faute de tenue adaptée. Il nous dit qu’il y tient. Il lui faut un short, un tee-shirt et des chaussures de sport, qui peuvent rester à l’établissement. Si cela pose une difficulté, l’équipe dispose d’un vestiaire de dépannage : il suffit de nous le dire, par le coupon ci-joint ou par téléphone, et nous nous en occupons. Nous restons à votre disposition.',
          pourquoi:
            '« Malgré nos nombreuses relances », « nous vous rappelons qu’il est de votre responsabilité », « nous comptons sur vous » : le premier courrier est un reproche en trois temps, et il n’offre aucune sortie. Le second donne les dates, dit ce dont l’enfant a besoin, rapporte ce qu’il en dit, et ouvre une porte concrète. Il obtient plus souvent la tenue de sport, et il n’abîme rien.',
        },
      ],
    },
    {
      titre: 'Acte usuel, acte non usuel : dire lequel, et demander ce qu’il faut',
      blocs: [
        {
          type: 'p',
          texte:
            'Une distinction de pratique courante gouverne le courrier aux parents en établissement : celle entre les actes usuels, ceux de la vie quotidienne, que l’établissement qui accueille l’enfant accomplit sans solliciter les parents à chaque fois, et les actes non usuels, ceux qui engagent l’avenir de l’enfant ou touchent à ses droits fondamentaux, qui demandent l’accord des titulaires de l’autorité parentale. Une sortie au parc relève de la première catégorie ; une inscription dans un nouvel établissement scolaire, une intervention chirurgicale programmée ou un voyage à l’étranger relèvent de la seconde. La frontière n’est pas toujours nette, et c’est le document d’accueil de l’établissement qui, le plus souvent, fixe la liste de ce qui se décide seul.',
        },
        {
          type: 'p',
          texte:
            'Ce qui compte pour le courrier : il doit dire de quelle catégorie relève ce qu’il annonce. Soit vous informez d’une décision que l’établissement a prise et dont vous rendez compte ; soit vous demandez un accord sans lequel rien ne se fera. Un courrier qui mélange les deux registres dit au parent qu’il est consulté pour la forme.',
        },
        {
          type: 'reecriture',
          avant:
            'Madame, Monsieur, nous vous informons que Clara participera au séjour de ski organisé du 8 au 13 février à Valloire. Merci de nous retourner l’autorisation ci-jointe signée avant le 20 janvier ainsi que la copie de sa carte d’identité.',
          apres:
            'Madame, Monsieur, l’établissement organise un séjour à Valloire (Savoie) du 8 au 13 février, avec pratique du ski encadrée par des moniteurs diplômés. Clara souhaite y participer. Ce séjour ne peut avoir lieu pour elle qu’avec votre accord, que nous vous demandons par le coupon ci-joint, à nous retourner avant le 20 janvier. Vous y trouverez le programme, les horaires de départ et de retour, la liste des affaires nécessaires et le nom de l’éducatrice joignable pendant le séjour. Si vous souhaitez en parler avant de décider, Mme D., éducatrice référente, peut vous appeler au créneau de votre choix.',
          pourquoi:
            'Le premier courrier annonce la participation comme acquise, puis réclame une autorisation : le parent comprend que son accord ne compte pas. Le second dit clairement que rien ne se fera sans lui, donne ce dont il a besoin pour décider, rapporte le souhait de l’enfant, et propose un échange avant la réponse. C’est ce qu’exige, en pratique, un acte non usuel.',
        },
      ],
    },
    {
      titre: 'La place du point de vue des parents',
      blocs: [
        {
          type: 'p',
          texte:
            'Un parent qui reçoit un courrier de l’établissement lit, avant tout, ce qu’on pense de lui. Le courrier qui laisse une place à son point de vue, qui rapporte ce qu’il a dit, qui reconnaît un désaccord sans le trancher, change la lecture.',
        },
        {
          type: 'p',
          texte:
            'En protection de l’enfance, ce n’est pas seulement une question de tact. L’article L223-5 du code de l’action sociale et des familles impose que le contenu et les conclusions du rapport de situation soient portés à la connaissance du père, de la mère, du tuteur et du mineur selon son âge et sa maturité : le courrier qui invite à la réunion où il sera présenté est le premier contact du parent avec ce qui a été écrit sur lui. Et le cadre national de référence publié par la HAS en janvier 2021, rendu obligatoire pour l’évaluation des informations préoccupantes par le décret n° 2022-1728 du 30 décembre 2022, demande que le point de vue des parents figure dans l’écrit : un courrier qui le sollicite n’est pas une politesse, c’est la façon de l’obtenir. Hors protection de l’enfance, le fondement est le droit à la participation directe garanti par l’article L311-3, 7° du même code, qui, pour un mineur, se joue en pratique avec les titulaires de l’autorité parentale.',
        },
        {
          type: 'reecriture',
          avant:
            'Madame, suite à notre entretien du 3 avril, au cours duquel vous avez exprimé votre désaccord avec le maintien des visites médiatisées, nous vous confirmons que l’équipe maintient ce dispositif, dans l’intérêt de Théo. Nous espérons que vous comprendrez le sens de cette décision.',
          apres:
            'Madame, lors de notre entretien du 3 avril, vous nous avez dit souhaiter que les visites avec Théo aient lieu sans la présence d’un tiers, parce que, selon vos mots, « on ne peut pas parler normalement avec quelqu’un dans la pièce ». Nous avons transmis votre demande telle quelle. Le service propose de maintenir la présence de l’éducatrice pour les deux prochaines visites, puis de faire un point avec vous le 15 mai pour décider de la suite ensemble. Ce point est prévu pour que votre demande soit examinée avec vous, pas à votre place. Si la date ne vous convient pas, dites-le-nous par le coupon ci-joint ou par téléphone, nous en trouverons une autre.',
          pourquoi:
            '« Nous espérons que vous comprendrez » est la formule qui ferme toutes les portes : elle dit à la mère qu’elle n’a pas compris. La version réécrite rapporte sa demande dans ses mots, dit ce qui en a été fait, propose une échéance précise et annonce que la décision se prendra avec elle. Elle ne cède sur rien : les deux visites suivantes restent médiatisées. Mais la mère y trouve sa place, et elle viendra le 15 mai.',
        },
      ],
    },
    {
      titre: 'Le coupon-réponse',
      blocs: [
        {
          type: 'p',
          texte:
            'Un courrier qui attend une réponse doit la rendre facile. Un parent qui devrait rédiger lui-même une réponse ne le fera pas, ou tard ; un parent qui a trois cases à cocher et une signature à apposer le fera le soir même. Le coupon-réponse n’est pas une formalité : c’est ce qui transforme une lettre en échange.',
        },
        {
          type: 'liste',
          items: [
            'Le rappel en une ligne de ce sur quoi on répond : « Séjour à Valloire du 8 au 13 février ».',
            'Des cases, jamais une question ouverte seule : « j’autorise / je n’autorise pas / je souhaite en parler avant de décider ». La troisième case est celle qui compte : elle donne au parent une façon de ne pas dire non.',
            'Un espace libre de quelques lignes, « Ce que je souhaite vous dire », pour le point de vue du parent. Souvent vide ; quand il ne l’est pas, c’est l’information la plus utile du dossier.',
            'La date, le nom et la signature du ou des titulaires de l’autorité parentale. Quand les deux parents exercent l’autorité parentale et vivent séparément, chacun reçoit son courrier et son coupon.',
            'La date limite de retour, ce qui se passe si le coupon ne revient pas (pour un acte non usuel, l’enfant ne participe pas, et il faut le dire), et les façons de le retourner : par l’enfant, par courrier, en photo par message. Plus il y a de voies, plus il revient.',
          ],
        },
      ],
    },
    {
      titre: 'Le ton',
      blocs: [
        {
          type: 'p',
          texte:
            'Le ton d’un courrier se juge en une lecture, avant même le sens. Quelques règles qui font la différence entre une lettre qu’on lit jusqu’au bout et une lettre qu’on pose.',
        },
        {
          type: 'liste',
          items: [
            'La civilité et le nom : « Madame R. », « Monsieur B. ». Jamais « la famille » en adresse.',
            'Des phrases courtes, une information par phrase, et une seule page : ce qui ne tient pas sur une page sera dit en entretien.',
            'Aucun sigle non expliqué. « L’ESS », « le PPS », « la CRIP » sont des mots de professionnels ; le parent les lit comme une langue étrangère, et il n’ose pas demander.',
            'L’enfant par son prénom, et ce qu’il en dit quand c’est pertinent : « Clara souhaite y participer ». Un courrier qui rapporte la parole de l’enfant est lu autrement.',
            'Un nom et un numéro joignable. « L’équipe » ne se rappelle pas ; Mme D., le mardi et le jeudi après 14 h, oui.',
            'Ni conditionnel de reproche (« il aurait été souhaitable que »), ni impératif (« vous devez »), ni menace voilée (« à défaut, nous serions contraints de »). Ce qui se passe en l’absence de réponse se dit simplement.',
          ],
        },
      ],
    },
    {
      titre: 'Ce qu’un courrier aux parents ne porte jamais',
      blocs: [
        {
          type: 'liste',
          items: [
            'Un argumentaire contre l’un des parents, ou une comparaison entre les deux : le courrier adressé au père ne dit rien de la mère, et inversement.',
            'Un diagnostic, même prudent, même entre parenthèses. Un courrier signé par un éducateur ne dit pas « trouble », « anxiété », « profil ». Il dit ce que l’enfant fait, et propose une consultation si l’équipe le pense utile.',
            'Le récit détaillé d’un incident impliquant un autre enfant nommé : le parent est informé de ce qui est arrivé à son enfant, pas de ce qu’a fait celui du voisin.',
            'Une décision qui n’a pas encore été prise, présentée comme acquise pour obtenir l’accord plus vite.',
          ],
        },
        {
          type: 'p',
          texte:
            'Un dernier point de méthode : faites lire le courrier par un collègue qui ne connaît pas la situation, en lui demandant une seule chose, comment il se sentirait s’il le recevait pour son propre enfant. Deux minutes, et le reproche caché que l’auteur ne voit plus est repéré.',
        },
      ],
    },
  ],
  faq: [
    {
      q: 'Faut-il écrire aux deux parents ?',
      r: 'Quand les deux exercent l’autorité parentale, oui, chacun à son adresse s’ils vivent séparément, avec le même contenu et le même coupon. Écrire à un seul en comptant sur lui pour transmettre, c’est se retrouver avec un parent qui n’a pas été informé et qui le fera savoir. Les situations particulières se vérifient dans le dossier avant d’écrire.',
    },
    {
      q: 'Qu’est-ce qu’un acte usuel ?',
      r: 'En pratique, un acte de la vie courante de l’enfant, que l’établissement qui l’accueille accomplit sans solliciter les parents à chaque fois : une sortie à la journée, une activité habituelle. Les actes non usuels, ceux qui engagent l’avenir de l’enfant ou touchent à ses droits fondamentaux, demandent l’accord des titulaires de l’autorité parentale. La liste de ce qui se décide seul figure le plus souvent dans le document d’accueil de votre établissement : c’est lui qui fait foi.',
    },
    {
      q: 'Que faire si le coupon ne revient pas ?',
      r: 'Relancer une fois, par téléphone ou message, en rappelant simplement la date limite et ce qui se passe sans réponse. Pour un acte non usuel, l’absence de réponse vaut absence d’accord : l’enfant ne participe pas, et il faut le lui expliquer. Une relance qui reproche le silence n’obtient jamais le coupon.',
    },
    {
      q: 'Peut-on dire à un parent que l’équipe n’est pas d’accord avec lui ?',
      r: 'Oui, en entretien, où le désaccord peut se discuter. Dans un courrier, on rapporte sa position dans ses mots, ce que le service propose et quand la décision sera prise avec lui. Un désaccord écrit sans possibilité de réponse immédiate se lit comme une sentence.',
    },
  ],
};

/* ────────────────────────────────────────────────────────────────────────── */

// Ordre de lecture : le pilier, puis les écrits du quotidien dont tout le reste
// est tiré (transmissions, note d’incident), puis les documents formels, et
// enfin le courrier qui sort de l’établissement.
export const GUIDES_ECRITS: GuideEcrit[] = [
  PILIER,
  TRANSMISSIONS,
  INCIDENT,
  RAPPORT,
  PROJET,
  ESS,
  IP,
  BILAN,
  COURRIER,
];

export function trouverGuideEcrit(slug: string): GuideEcrit | undefined {
  return GUIDES_ECRITS.find((g) => g.slug === slug);
}
