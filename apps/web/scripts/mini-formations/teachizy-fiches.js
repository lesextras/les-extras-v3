/**
 * LES PAGES DE VENTE TEACHIZY DES MINI-FORMATIONS.
 *
 * ⚠ POURQUOI CE FICHIER EXISTE. Le 21/09/2026, un relevé des douze parcours a
 * montré que « Renforcer ce qui va » et « Décrire un comportement sans le
 * juger » — les deux publiés le 4/09 — étaient EN LIGNE AVEC UNE PAGE
 * ENTIÈREMENT VIDE : ni description, ni public visé, ni objectifs, ni
 * prérequis, ni couverture. Les dix autres portent tout cela.
 *
 * C'est exactement le défaut relevé le 11/08 sur CM Mobile et le Workshop
 * A2PA, et il est revenu parce que la chaîne de publication (voir CLAUDE.md,
 * « Ce que la chaîne de publication demande ») décrit la création des items
 * et le chargement des contenus, mais ne dit nulle part d'écrire la page de
 * vente. Elle se remplissait à la main, donc elle finissait par ne plus se
 * remplir du tout.
 *
 * ⚠ CE N'EST PAS COSMÉTIQUE. « Public visé », « Objectifs » et « Prérequis »
 * sont les trois champs qu'un financeur — OPCO, France Travail — regarde en
 * premier, et leur absence est un manquement Qualiopi (indicateur 1). Une
 * formation gratuite n'y échappe pas : elle est au catalogue d'un organisme
 * certifié.
 *
 * ⚠ CE QUI TIENT CES TEXTES :
 *  - les OBJECTIFS sont des verbes d'action ÉVALUABLES, et chacun renvoie à
 *    quelque chose que le parcours fait réellement faire ;
 *  - la DURÉE annoncée couvre le CALENDRIER, jamais le seul temps de lecture ;
 *  - les GARDE-FOUS de sécurité du parcours sont dans la description, pas
 *    seulement dans les modules : la fiche et la formation doivent dire la
 *    même chose, sinon la fiche promet autre chose que le parcours ;
 *  - « attestation de suivi », jamais « certificat » ;
 *  - aucune promesse de vérification, aucun prix inventé.
 */

/** Le pied commun : il dit la gratuité et ce que l'attestation n'est pas. */
const PIED =
  '<p><strong>Formation gratuite du premier au dernier module.</strong> Une ' +
  'attestation de suivi nominative peut être délivrée sur demande, au tarif de ' +
  '20&nbsp;€. Ce n’est ni un diplôme, ni une certification professionnelle.</p>';

/** Le paragraphe de format, identique d'un parcours à l'autre. */
const FORMAT =
  '<p><strong>Format&nbsp;:</strong> 4 modules, plus une section d’annexes. Chaque ' +
  'module s’ouvre sur une carte «&nbsp;Repères du module&nbsp;», enchaîne la théorie ' +
  'brève, une situation réelle qui dérape et que vous analysez vous-même, un exercice ' +
  'guidé nommé, un carnet de séance et des points de vigilance, puis se ferme sur cinq ' +
  'questions d’autocorrection et «&nbsp;Avant de passer au module suivant&nbsp;».</p>';

const FICHES = {
  /* ════════════════════════════════════════════════════════════════════ f11 */
  'renforcer-ce-qui-va': {
    uuid: '18e0ccdd-723d-4c5d-9edb-f13074c7de8c',
    summary:
      'Un renforçateur se reconnaît à l’effet, jamais à l’intention. Ce qui marche pour l’un est parfois pénible pour l’autre — alors on teste.',
    description:
      '<p><strong>Thématique&nbsp;: comportements-défis et opposition.</strong> Cette ' +
      'mini-formation travaille une seule compétence&nbsp;: <em>augmenter ce qui va déjà</em>, ' +
      'plutôt que d’éteindre ce qui dérange.</p>' +
      '<p>C’est le pilier qui manquait à côté de «&nbsp;Les quatre fonctions d’un ' +
      'comportement&nbsp;» (comprendre) et de «&nbsp;Apprendre à demander plutôt qu’à ' +
      'crier&nbsp;» (remplacer). Le module 1 pose la phrase qui trie&nbsp;: on ne peut ' +
      'renforcer que ce qui est déjà apparu au moins une fois. Si le comportement n’existe ' +
      'nulle part, ce n’est pas ce parcours qu’il vous faut, et le module le dit.</p>' +
      FORMAT +
      '<p>Comptez environ 46 minutes de lecture, fractionnables comme vous voulez. Mais le ' +
      'parcours ne se termine pas le jour où vous l’ouvrez&nbsp;: le module 3 lance dix jours ' +
      'd’application, et le module 4 — qui porte sur l’espacement, la partie que presque tout ' +
      'le monde rate — se lit le dixième jour. Comptez donc une dizaine de jours entre le ' +
      'premier et le dernier module.</p>' +
      '<p><strong>Trois règles sont tenues dans le corps du texte, et elles ne se négocient ' +
      'pas&nbsp;:</strong> on ne retire jamais ce qui a été gagné (retirer un point acquis ' +
      'transforme le dispositif en punition)&nbsp;; on ne conditionne jamais un besoin ' +
      'fondamental — repas, sommeil, soins, affection, sortie, lien familial, et surtout le ' +
      'moyen de communication&nbsp;; et le renforçateur social n’est pas universel — ' +
      'félicitations publiques, contact visuel et main sur l’épaule sont pénibles pour une ' +
      'partie des personnes accompagnées, autistes en particulier, donc le parcours fait ' +
      'tester plutôt que supposer.</p>' +
      '<p>Le module 3 fait écrire <strong>à qui sert le comportement</strong> avant de le ' +
      'choisir, et fait renoncer si la réponse est «&nbsp;à l’équipe&nbsp;». Sans cette ' +
      'colonne, le parcours deviendrait une méthode pour obtenir de la docilité.</p>' +
      PIED,
    target:
      '<p>Cette mini-formation s’adresse à&nbsp;:</p><ul>' +
      '<li>les <strong>professionnels du médico-social</strong>&nbsp;: IME, ITEP, SESSAD, ' +
      'MECS, ESAT, foyer de vie, IEM&nbsp;;</li>' +
      '<li>les <strong>parents et les proches</strong>, à qui l’on répète d’encourager sans ' +
      'jamais dire comment&nbsp;;</li>' +
      '<li>les <strong>assistants familiaux</strong> et les professionnels de la protection ' +
      'de l’enfance&nbsp;;</li>' +
      '<li>les <strong>équipes qui ont déjà essayé un tableau de points</strong> et l’ont vu ' +
      's’effondrer au bout de dix jours.</li></ul>' +
      '<p>Aucun prérequis.</p>',
    goals:
      '<p>À l’issue de cette mini-formation, vous serez capable de&nbsp;:</p><ul>' +
      '<li>distinguer un renforçateur d’une récompense supposée, en jugeant à l’effet ' +
      'observé&nbsp;;</li>' +
      '<li>vérifier qu’un comportement existe déjà avant de chercher à l’augmenter&nbsp;;</li>' +
      '<li>construire une liste de préférences propre à la personne, par test et non par ' +
      'supposition&nbsp;;</li>' +
      '<li>nommer les trois réglages qui décident de l’effet&nbsp;: quoi, quand, combien ' +
      'de fois&nbsp;;</li>' +
      '<li>écrire une fiche de renforcement qu’un collègue applique sans explication&nbsp;;</li>' +
      '<li>identifier ce qui ne se conditionne jamais, et refuser un dispositif qui y ' +
      'touche&nbsp;;</li>' +
      '<li>espacer le renforcement sans perdre ce qui a été acquis&nbsp;;</li>' +
      '<li>reconnaître le moment où le dispositif sert l’équipe plutôt que la personne, et ' +
      'l’arrêter.</li></ul>',
    requirements:
      '<p>Aucun prérequis. Il est utile d’avoir en tête une situation précise et un ' +
      'comportement que vous aimeriez voir plus souvent — un comportement qui existe déjà, ' +
      'même rarement. Prévoyez de quoi écrire, et un relevé de quelques secondes par jour ' +
      'pendant dix jours entre le module 3 et le module 4.</p>',
  },

  /* ════════════════════════════════════════════════════════════════════ f12 */
  'decrire-un-comportement-sans-le-juger': {
    uuid: 'd70788a2-04cb-41b9-8252-82fca1d1e82e',
    summary:
      'Une caméra posée dans la pièce aurait-elle enregistré ce que vous venez d’écrire&nbsp;? Elle ne filme ni les intentions, ni les diagnostics.',
    description:
      '<p><strong>Thématique&nbsp;: observer et écrire.</strong> Cette mini-formation ' +
      'travaille une seule compétence&nbsp;: <em>écrire une observation qu’une caméra aurait ' +
      'pu enregistrer</em>, annoncer ses hypothèses comme telles, et relire un écrit avant ' +
      'qu’il ne circule.</p>' +
      '<p>C’est le socle des autres parcours d’observation&nbsp;: on ne peut pas relever ce ' +
      'qui précède un comportement si l’on écrit «&nbsp;il a été agressif&nbsp;», ni compter ' +
      'un comportement si deux collègues ne comptent pas la même chose. Et un écrit ' +
      'professionnel voyage&nbsp;: chaque recopie perd du contexte et garde les adjectifs.</p>' +
      FORMAT +
      '<p>Comptez environ 46 minutes de lecture. Le module 3 lance <strong>sept jours ' +
      'd’application — une observation écrite par jour, trois lignes</strong> — et le module 4 ' +
      'porte sur la relecture de vos propres écrits&nbsp;: c’est le seul relevé du catalogue ' +
      'qui porte sur ce que VOUS produisez. Comptez donc une semaine entre le premier et le ' +
      'dernier module.</p>' +
      '<p><strong>Aucun diagnostic sous une signature éducative.</strong> Écrire ' +
      '«&nbsp;évoquant une problématique psychotique&nbsp;» étiquette la personne sans ' +
      'évaluation et retarde le vrai diagnostic de plusieurs mois, parce que «&nbsp;c’est déjà ' +
      'dit dans le dossier&nbsp;». On rapporte un diagnostic existant en citant qui l’a ' +
      'posé&nbsp;; on n’en formule jamais.</p>' +
      '<p><strong>Trois malentendus sont traités explicitement</strong>, parce qu’ils font ' +
      'autant de dégâts que l’interprétation déguisée&nbsp;: écrire des faits ne veut dire ni ' +
      'écrire sans penser (l’hypothèse s’annonce), ni écrire froidement ' +
      '(«&nbsp;il pleurait&nbsp;» est filmable), ni ne rapporter que le négatif — un écrit qui ' +
      'n’aligne que des difficultés n’est pas neutre parce qu’il est factuel, il est à charge, ' +
      'et il est incomplet au regard du cadre national de référence rendu obligatoire par le ' +
      'décret 2022-1728.</p>' +
      '<p>Une fiche d’annexe est faite pour le jour où quelqu’un affirme le contraire en ' +
      'réunion&nbsp;: elle distingue ce qui est une règle de métier de ce qui est une ' +
      'obligation opposable, et rappelle que la personne accompagnée a accès à son dossier ' +
      '(art. L311-3 du CASF).</p>' +
      PIED,
    target:
      '<p>Cette mini-formation s’adresse à&nbsp;:</p><ul>' +
      '<li>les <strong>éducateurs, moniteurs-éducateurs, AES et AMP</strong> qui écrivent ' +
      'chaque soir dans un cahier de liaison&nbsp;;</li>' +
      '<li>les <strong>professionnels de la protection de l’enfance</strong> dont les écrits ' +
      'sont lus par un juge, un référent ASE ou une MDPH&nbsp;;</li>' +
      '<li>les <strong>coordinateurs et chefs de service</strong> qui relisent et signent ce ' +
      'que l’équipe transmet&nbsp;;</li>' +
      '<li>les <strong>assistants familiaux</strong> et les professionnels de l’école&nbsp;: ' +
      'AESH, enseignants, enseignants référents&nbsp;;</li>' +
      '<li>toute personne qui a déjà vu une phrase écrite un soir de fatigue réapparaître ' +
      'trois ans plus tard dans un dossier.</li></ul>' +
      '<p>Aucun prérequis.</p>',
    goals:
      '<p>À l’issue de cette mini-formation, vous serez capable de&nbsp;:</p><ul>' +
      '<li>appliquer le test de la caméra à une phrase que vous venez d’écrire&nbsp;;</li>' +
      '<li>repérer les mots qui font passer une opinion pour un fait&nbsp;;</li>' +
      '<li>annoncer une hypothèse comme telle, au lieu de la glisser au milieu des ' +
      'faits&nbsp;;</li>' +
      '<li>écrire ce qui a précédé le comportement, y compris ce que l’adulte a fait juste ' +
      'avant&nbsp;;</li>' +
      '<li>rapporter un diagnostic existant en citant qui l’a posé, sans jamais en ' +
      'formuler&nbsp;;</li>' +
      '<li>tenir une grille en trois colonnes&nbsp;: ce que j’ai vu, ce que j’en ai pensé, ce ' +
      'que j’écris&nbsp;;</li>' +
      '<li>relire un écrit en quatre passes avant qu’il ne circule&nbsp;;</li>' +
      '<li>équilibrer un écrit entre éléments préoccupants et points d’appui, et y faire ' +
      'figurer le point de vue de la personne.</li></ul>',
    requirements:
      '<p>Aucun prérequis. Il est utile d’avoir sous la main quelques écrits que vous avez ' +
      'produits récemment — transmissions, cahier de liaison, notes d’observation. Prévoyez ' +
      'de quoi écrire, et trois lignes par jour pendant sept jours entre le module 3 et le ' +
      'module 4.</p>',
  },

  /* ════════════════════════════════════════════════════════════════════ f13 */
  'mesurer-un-comportement-ligne-de-base': {
    uuid: null, // posé à la création
    summary:
      'Trois bonnes journées ne font pas un progrès. Dix jours sans rien changer, une seule unité, la médiane — et une courbe qu’on sait lire.',
    description:
      '<p><strong>Thématique&nbsp;: observer et écrire.</strong> Cette mini-formation ' +
      'travaille une seule compétence&nbsp;: <em>lire une tendance sans se laisser avoir par ' +
      'trois jours</em> — choisir une unité, tenir une ligne de base, tracer la courbe et ' +
      'savoir ce qu’elle dit.</p>' +
      '<p>Le catalogue apprend à comprendre un comportement, à le remplacer, à l’augmenter et ' +
      'à l’écrire. Il ne disait nulle part comment SAVOIR si ce qu’on a mis en place produit ' +
      'quelque chose. C’est ce trou-là, et il est coûteux dans les deux sens&nbsp;: on ' +
      'abandonne un dispositif qui marchait, et on maintient pendant des mois un dispositif ' +
      'qui ne fait rien.</p>' +
      FORMAT +
      '<p>Comptez environ 46 minutes de lecture. Le module 3 lance <strong>dix jours de ' +
      'relevé, une ligne par jour</strong>, et le module 4 porte sur VOTRE courbe&nbsp;: il ne ' +
      'peut pas être fait avant. Comptez donc une dizaine de jours entre le premier et le ' +
      'dernier module.</p>' +
      '<p><strong>Aucune ligne de base quand il y a danger.</strong> C’est la question à ' +
      'laquelle beaucoup de textes ne répondent pas&nbsp;: attendre dix jours en regardant ' +
      'quelqu’un se blesser serait une faute. On agit immédiatement, et on écrit ' +
      '«&nbsp;pas de ligne de base, motif sécurité&nbsp;». Le module 2 le dit avant ' +
      'd’enseigner quoi que ce soit d’autre.</p>' +
      '<p><strong>On mesure un comportement dans un contexte, jamais quelqu’un.</strong> Aucun ' +
      'chiffre n’est accolé à un nom&nbsp;: pas de «&nbsp;score comportemental&nbsp;», pas de ' +
      '«&nbsp;niveau 3 d’opposition&nbsp;». Ce genre de phrase est recopié dans le dossier ' +
      'suivant et survit à l’équipe qui l’a produite. Et la personne a accès à ce qui est ' +
      'écrit sur elle (art. L311-3 du CASF).</p>' +
      '<p><strong>Aucune statistique&nbsp;:</strong> pas de significativité, pas d’écart-type, ' +
      'pas de régression. Ce parcours s’adresse à des professionnels avec un crayon et du ' +
      'papier quadrillé, pas à des chercheurs — un test mal appliqué donne une certitude ' +
      'fausse, ce qui est pire que l’incertitude honnête. Ce qui est enseigné tient en trois ' +
      'questions posées à une courbe, et ça se lit à l’œil.</p>' +
      '<p><strong>Une courbe plate accuse l’hypothèse, pas la personne.</strong> Si rien n’a ' +
      'bougé en quatre semaines, ce n’est pas «&nbsp;il ne progresse pas&nbsp;»&nbsp;: c’est ' +
      'que l’hypothèse de départ était fausse, et on retourne aux quatre fonctions.</p>' +
      PIED,
    target:
      '<p>Cette mini-formation s’adresse à&nbsp;:</p><ul>' +
      '<li>les <strong>professionnels du médico-social</strong> qui mettent des choses en ' +
      'place sans savoir si elles marchent&nbsp;: IME, ITEP, SESSAD, MECS, ESAT, foyer de ' +
      'vie&nbsp;;</li>' +
      '<li>les <strong>coordinateurs et chefs de service</strong> qui lisent des bilans où ' +
      '«&nbsp;ça va mieux&nbsp;» n’est adossé à rien&nbsp;;</li>' +
      '<li>les <strong>psychologues, éducateurs et ergothérapeutes</strong> qui construisent ' +
      'un projet d’accompagnement et doivent en rendre compte&nbsp;;</li>' +
      '<li>les <strong>parents</strong> qui ont changé quelque chose à la maison et veulent ' +
      'savoir si ça a produit un effet.</li></ul>' +
      '<p>Aucun prérequis, et <strong>aucune notion de statistique n’est nécessaire</strong>.</p>',
    goals:
      '<p>À l’issue de cette mini-formation, vous serez capable de&nbsp;:</p><ul>' +
      '<li>distinguer ce qui coûte à la personne de ce qui gêne l’entourage, et renoncer à ' +
      'mesurer dans le second cas&nbsp;;</li>' +
      '<li>décrire un comportement en termes filmables avant de le compter&nbsp;;</li>' +
      '<li>choisir une unité — fréquence, durée ou latence — sur ce qui pose réellement ' +
      'problème&nbsp;;</li>' +
      '<li>remplacer une intensité estimée par une question fermée et comptable&nbsp;;</li>' +
      '<li>tenir dix jours de ligne de base sans rien changer, et savoir s’en passer lorsque ' +
      'la sécurité l’impose&nbsp;;</li>' +
      '<li>construire une feuille de relevé à six colonnes qu’un collègue remplit sans ' +
      'explication&nbsp;;</li>' +
      '<li>vérifier à deux que vous comptez la même chose, et reprendre la définition si ce ' +
      'n’est pas le cas&nbsp;;</li>' +
      '<li>lire une courbe par le niveau, la pente et la variabilité, et distinguer un signal ' +
      'de trois points d’une conclusion.</li></ul>',
    requirements:
      '<p>Aucun prérequis, et aucune notion de statistique n’est nécessaire. Il est utile ' +
      'd’avoir en tête une situation que vous suivez en ce moment. Prévoyez de quoi écrire, ' +
      'une feuille quadrillée, et un relevé de quelques secondes par jour pendant dix jours ' +
      'entre le module 3 et le module 4.</p>',
  },
};

module.exports = { FICHES, PIED, FORMAT };
