/**
 * F12 — DÉCRIRE UN COMPORTEMENT SANS LE JUGER
 *
 * Compétence : écrire ce qu'on a vu, et non ce qu'on en a pensé — puis
 * reconnaître, dans ses propres écrits, les mots qui font passer une
 * interprétation pour un fait.
 *
 * ── POURQUOI CE PARCOURS FERME LE NIVEAU 1 ─────────────────────────────────
 * C'est le socle des trois autres. « Les quatre fonctions » demande de noter ce
 * qui se passe avant et après : impossible si l'on note « il a été agressif ».
 * « Renforcer ce qui va » demande de compter un comportement : impossible si
 * deux collègues ne comptent pas la même chose. Et le niveau 3 (ESS, réaction
 * de survie) suppose des écrits qui tiennent devant un partenaire.
 *
 * ⚠ CE QUI EST EN JEU N'EST PAS LA FORME, C'EST LA PERSONNE. Un écrit
 * professionnel circule, il est recopié dans le dossier suivant, il survit à
 * l'équipe qui l'a produit, et il peut être lu par un juge des enfants. Une
 * interprétation écrite comme un fait devient un fait au bout de deux copies.
 * Le parcours ne parle donc jamais de « bien rédiger » : il parle de ce que
 * l'écrit fait à la personne dont il parle.
 *
 * ── LES RÉFÉRENCES : CE QUI EST VRAI, ET CE QUI CIRCULE À TORT ─────────────
 * ⚠ IL N'EXISTE AUCUNE RECOMMANDATION ANESM/HAS CONSACRÉE AUX ÉCRITS
 * PROFESSIONNELS. La règle « faits / interprétation » est une règle de métier,
 * solide et partagée, mais ce n'est pas une norme opposable. Le parcours la
 * présente comme telle et ne l'adosse à aucun texte. C'est la même consigne
 * que celle documentée en tête de `(public)/guides/contenu.ts`.
 *
 * ⚠ CE QUE LA HAS EXIGE RÉELLEMENT, et qui est autre chose : l'ÉQUILIBRE. Le
 * cadre national de référence de janvier 2021, rendu obligatoire par le décret
 * 2022-1728, demande que l'évaluation porte sur les éléments préoccupants ET
 * les points d'appui, sur le point de vue de l'enfant ET celui des parents.
 * C'est le module 4 qui le traite, et c'est le seul texte cité du parcours.
 *
 * ⚠ LE DROIT D'ACCÈS EST RÉEL ET IL EST DANS LE CASF : l'article L311-3 range
 * parmi les droits de la personne accompagnée « l'accès à toute information ou
 * document relatif à sa prise en charge ». C'est l'argument le plus efficace du
 * parcours, et il est vérifiable : ce que vous écrivez, la personne peut le
 * lire.
 *
 * ⚠ ON NE CITE PAS l'article 40 al. 2 du CPP (il n'oblige que les autorités
 * constituées et les fonctionnaires, donc pas un salarié d'association), ni la
 * loi du 17 juillet 1978 (codifiée au CRPA, art. L311-6), ni une quelconque
 * « obligation de neutralité » qui n'existe pas dans les textes.
 *
 * ⚠ AUCUN DIAGNOSTIC, JAMAIS. Le parcours interdit explicitement d'écrire un
 * terme clinique sous une signature éducative — « psychotique », « pervers »,
 * « TDAH », « autiste » quand il n'y a pas de diagnostic posé. Même règle que
 * dans « Lire un comportement comme une réaction de survie ».
 */

const G = require('./gabarit-v3.js');
const A = require('./annexes.js');
const S = require('./schemas.js');

/* ── FIGURES ─────────────────────────────────────────────────────────────── */

const CARTE = S.figure({
  numero: 1,
  titre: 'La carte du parcours',
  corps: S.carte({
    modules: [
      { titre: 'Module 1', produit: 'le test de la caméra' },
      { titre: 'Module 2', produit: 'un écrit qui a fait dérailler une décision' },
      { titre: 'Module 3', produit: 'votre grille en trois colonnes' },
      { titre: 'Module 4', produit: 'la relecture de vos propres écrits' },
    ],
    releve:
      '<strong>Entre le module 3 et le module 4&nbsp;:</strong> sept jours. Une observation écrite par jour, trois lignes, pas davantage.',
  }),
  legende:
    'Le relevé le plus court du catalogue, et le seul qui porte sur ce que VOUS produisez plutôt que sur ce que fait la personne.',
});

const CAMERA = S.figure({
  numero: 2,
  titre: 'Le test de la caméra',
  corps: S.arbre({
    question:
      'Une caméra posée dans la pièce aurait-elle enregistré ce que vous venez d’écrire&nbsp;?',
    branches: [
      {
        condition: 'Oui, elle l’aurait filmé',
        contenu:
          'C’est un fait. « Il a repoussé la table de deux mains », « il a crié pendant environ trente secondes », « il est sorti par la porte du fond ». Ça s’écrit tel quel.',
      },
      {
        condition: 'Non, mais je l’ai déduit',
        contenu:
          'C’est une interprétation. Elle a sa place, mais dans une phrase qui l’annonce : « je fais l’hypothèse que… ». Jamais glissée au milieu des faits.',
      },
      {
        condition: 'Non, c’est un mot de métier',
        contenu:
          '« Opposant », « immature », « en demande » : ces mots portent un jugement sous une apparence technique. On les remplace par ce qui a été vu.',
      },
    ],
  }),
  legende:
    'Une caméra n’enregistre ni les intentions, ni les motivations, ni les diagnostics. C’est exactement la frontière qu’on cherche.',
});

const MOTS = S.figure({
  numero: 3,
  titre: 'Les mots qui font passer une opinion pour un fait',
  corps: S.paires({
    gauche: 'Ce qui s’écrit spontanément',
    droite: 'Ce qui a réellement été vu, et qui s’écrit à la place',
    lignes: [
      {
        g: '« Il a été agressif »',
        d: 'Décrivez le geste : « il a jeté sa chaise contre le mur ». Le lecteur jugera lui-même.',
      },
      {
        g: '« Il refuse de participer »',
        d: '« Il est resté assis pendant les vingt minutes de l’atelier. » Le refus est une intention, pas une observation.',
      },
      {
        g: '« Il cherche l’attention »',
        d: 'Vous décrivez une motivation que vous ne pouvez pas voir. Écrivez ce qu’il a fait, et ce qui a suivi.',
      },
      {
        g: '« Il est manipulateur »',
        d: 'Aucune caméra ne filme une manipulation. Ce mot dit ce que vous ressentez, et il collera à la personne pendant des années.',
      },
      {
        g: '« La mère est dans le déni »',
        d: 'Rapportez ses mots : « Mme X nous a dit ne pas constater ces difficultés à la maison. »',
      },
      {
        g: '« Comportement inadapté »',
        d: 'Inadapté à quoi, et selon qui&nbsp;? Nommez la situation et le comportement, séparément.',
      },
    ],
  }),
  legende:
    'Aucun de ces mots n’est interdit. Ils sont simplement à leur place dans une hypothèse annoncée, jamais dans le récit des faits.',
});

const TROIS_COLONNES = S.figure({
  numero: 4,
  titre: 'La grille en trois colonnes',
  corps: S.flux([
    { titre: 'Ce que j’ai vu', detail: 'filmable, daté, situé' },
    { titre: 'Ce que j’en ai pensé', detail: 'pour moi, ou annoncé comme hypothèse' },
    { titre: 'Ce que j’écris', detail: 'la colonne 1, plus l’hypothèse si elle est utile' },
  ]),
  legende:
    'La colonne du milieu n’est pas une colonne de honte : penser est le métier. Elle existe pour que la pensée ne se déguise pas en observation.',
});

const CIRCULATION = S.figure({
  numero: 5,
  titre: 'Où va ce que vous écrivez',
  corps: S.frise([
    { nom: 'Le cahier', largeur: 20, fort: true, quoi: 'Vous l’écrivez ce soir.' },
    { nom: 'La synthèse', largeur: 20, fort: true, quoi: 'Recopié, souvent sans la nuance.' },
    { nom: 'Le rapport', largeur: 20, fort: true, quoi: 'Transmis au partenaire, au financeur, au juge.' },
    { nom: 'Le dossier suivant', largeur: 20, quoi: 'La personne change de structure, l’écrit la suit.' },
    { nom: 'Des années plus tard', largeur: 20, quoi: 'Elle demande son dossier et se lit.' },
  ]),
  legende:
    'Chaque étape perd du contexte et garde les adjectifs. C’est la raison technique pour laquelle on écrit des faits : eux seuls survivent aux recopies.',
});

/* ── MODULE 1 ────────────────────────────────────────────────────────────── */

const M1 = {
  reperes: {
    minutes: 12,
    prerequis: 'Aucun. C’est le parcours d’entrée du niveau 1.',
    evaluation:
      'Le module 3 fait produire une grille en trois colonnes, et le module 4 la confronte à sept jours de vos propres écrits.',
    apres: 'sept jours, une observation écrite par jour, entre le module 3 et le module 4.',
  },
  objectifs: [
    'Appliquer le test de la caméra à une phrase, et trancher fait ou interprétation.',
    'Reconnaître les six formulations qui font passer une opinion pour une observation.',
    'Expliquer pourquoi un adjectif survit aux recopies alors que le contexte disparaît.',
    'Citer le droit d’accès de la personne à son dossier, et ce qu’il change à l’écriture.',
  ],
  corps: `${CARTE}

<h3 style="${G.H3}">1. Le problème n’est pas le style, c’est ce que l’écrit produit</h3>

<p>On présente souvent la distinction entre faits et interprétation comme une
exigence de rigueur, presque une politesse professionnelle. Ce n’est pas de cela
qu’il s’agit. Un écrit professionnel <strong>produit des décisions</strong> :
une orientation, un renouvellement de mesure, un signalement, un refus
d’admission. Et il produit ces décisions longtemps après que son auteur a quitté
le service.</p>

${CIRCULATION}

<p>Regardez la frise&nbsp;: à chaque étape, le contexte se perd et les adjectifs
restent. « Il a repoussé la table quand on lui a demandé de ranger, après une
matinée sans sa référente » devient, deux recopies plus loin, « comportement
agressif ». Personne n’a menti. Chacun a résumé.</p>

<p>C’est pour cette raison technique, et pas par vertu, qu’on écrit des faits :
<strong>seuls les faits survivent aux recopies.</strong></p>

${G.alerte(
  'Ce que vous écrivez, la personne peut le lire',
  `<p>L’article <strong>L311-3 du code de l’action sociale et des familles</strong>
range parmi les droits de la personne accompagnée « l’accès à toute information
ou document relatif à sa prise en charge ». Ce n’est pas une éventualité
théorique : des personnes demandent leur dossier, et le lisent.</p>
<p>Le test le plus utile n’est donc pas « est-ce bien écrit », mais&nbsp;:
<strong>seriez-vous à l’aise de lire cette phrase à voix haute, devant la
personne concernée&nbsp;?</strong> Si la réponse est non, ce n’est pas forcément
que la phrase est fausse — c’est souvent qu’elle contient un jugement que vous
n’assumeriez pas de défendre.</p>`,
)}

<h3 style="${G.H3}">2. Le test de la caméra</h3>

<p>Un seul outil, et il tranche presque tous les cas. Posez la question&nbsp;:
<strong>une caméra placée dans la pièce aurait-elle enregistré ce que je viens
d’écrire&nbsp;?</strong></p>

${CAMERA}

<p>Une caméra enregistre des gestes, des paroles, des durées, des positions dans
l’espace. Elle n’enregistre ni les intentions, ni les motivations, ni les
diagnostics, ni les traits de caractère. Tout ce qui n’est pas filmable est une
interprétation — ce qui ne veut pas dire qu’elle est fausse, seulement qu’elle
doit être annoncée comme telle.</p>

${G.exemple(
  'La même scène, deux écritures',
  `<p><strong>Ce qui s’écrit souvent&nbsp;:</strong> « Ce matin encore, Nour s’est
montrée opposante et a refusé toute participation, dans une logique de
provocation vis-à-vis de l’adulte. »</p>
<p><strong>Ce qu’une caméra aurait filmé&nbsp;:</strong> « À 9 h 40, à la
consigne de rejoindre la table, Nour est restée assise sur le banc. Je lui ai
redemandé deux fois. Elle a répondu “non” la première fois, n’a pas répondu la
seconde, et est restée sur le banc jusqu’à 10 h 05. »</p>
<p>La seconde version est plus longue de vingt mots. Elle est aussi la seule
utilisable&nbsp;: on peut la discuter, la comparer à demain, et chercher ce qui
s’est passé à 9 h 35.</p>`,
)}

<h3 style="${G.H3}">3. Les mots qui trahissent</h3>

<p>Certains mots ont l’apparence d’un constat et le contenu d’un jugement. Ils
sont d’autant plus dangereux qu’ils font professionnel.</p>

${MOTS}

<p>Un cas mérite d’être isolé, celui du verbe <strong>« refuser »</strong>. Il
paraît factuel et il ne l’est jamais&nbsp;: refuser suppose de comprendre la
demande, de pouvoir faire autrement, et de décider de ne pas le faire. Vous ne
pouvez observer aucune de ces trois choses. Écrivez ce qui s’est passé — « elle
est restée assise », « il a dit non », « il n’a pas bougé » — et laissez la
question du refus à l’analyse.</p>

${G.alerte(
  'Aucun terme clinique sous une signature éducative',
  `<p>« Psychotique », « pervers », « immature », « TDAH », « autiste » quand
aucun diagnostic n’est posé, « troubles du comportement » employé comme une
catégorie : ces mots relèvent d’une compétence médicale et d’une procédure.</p>
<p>Les écrire sous une signature éducative produit deux dégâts d’un coup&nbsp;:
la personne se retrouve étiquetée sans évaluation, et le vrai travail de
diagnostic — celui qui donnerait accès à des droits et à un accompagnement
adapté — est retardé de mois parce que « c’est déjà dit dans le dossier ».</p>
<p>La règle est simple&nbsp;: on rapporte un diagnostic existant en citant qui
l’a posé et quand. On n’en formule jamais un.</p>`,
)}

<h3 style="${G.H3}">4. Ce que la rigueur ne veut pas dire</h3>

<p>Trois malentendus reviennent, et ils font autant de dégâts que
l’interprétation déguisée.</p>

<p><strong>Décrire des faits ne veut pas dire écrire sans penser.</strong>
Votre analyse est ce que l’équipe attend de vous. Elle a simplement sa place —
annoncée, dans une phrase qui commence par « je fais l’hypothèse que » ou « ce
que j’en comprends ».</p>

<p><strong>Cela ne veut pas dire écrire froidement.</strong> On peut écrire
« Kevin pleurait » : c’est filmable. On ne peut pas écrire « Kevin était
désespéré » : ça ne l’est pas.</p>

<p><strong>Cela ne veut pas dire ne rapporter que le négatif.</strong> C’est
l’erreur la plus fréquente des écrits « rigoureux », et le module 4 y revient :
un écrit qui ne contient que des faits problématiques n’est pas neutre, il est
à charge.</p>`,
  aRetenir: `Une caméra n’enregistre ni les intentions, ni les motivations, ni
les diagnostics. <strong>Tout ce qui n’est pas filmable est une
interprétation</strong> — elle a sa place, annoncée comme telle, jamais glissée
au milieu des faits. Et ce que vous écrivez, la personne a le droit de le lire.`,
  exercice: {
    nom: 'Le passage à la caméra',
    duree: '12 minutes',
    quoi: 'Faire passer le test à des phrases réelles, dont les vôtres.',
    etapes: [
      'Ouvrez le dernier écrit que vous avez produit — cahier de liaison, transmission, compte rendu. N’en choisissez pas un « bon » exprès.',
      'Soulignez chaque mot qui décrit une intention, une motivation, un trait de caractère ou un état intérieur.',
      'Pour chacun, écrivez en face ce qu’une caméra aurait enregistré. Si vous ne savez plus, notez-le : c’est l’information la plus utile de l’exercice.',
      'Comptez les mots soulignés et le nombre de lignes de l’écrit. Notez le rapport, il servira de point de comparaison au module 4.',
    ],
    reussi:
      'Vous avez au moins trois reformulations écrites, et vous savez combien d’interprétations contenait un écrit ordinaire de votre main.',
  },
  carnet: {
    intro: 'Trois lignes, qui serviront de point de départ au relevé du module 3.',
    lignes: [
      'Le nombre d’interprétations relevées dans votre écrit, rapporté au nombre de lignes.',
      'Les deux mots qui reviennent le plus souvent sous votre plume.',
      'Une phrase que vous n’auriez pas voulu lire à voix haute devant la personne concernée.',
    ],
  },
  vigilance: [
    'Ne transformez pas l’exercice en procès de vos collègues. Les formulations de la figure 3 sont dans tous les dossiers de France, y compris les vôtres et les miens : elles viennent de la fatigue et de l’urgence, pas de la négligence.',
    'Un écrit factuel est plus long. C’est le coût réel de ce parcours, et il faut l’assumer devant une équipe : vingt mots de plus par observation, contre une phrase qui tiendra devant un juge.',
    'Attention au mot « encore » (« encore une fois, il a… »). Il n’ajoute aucun fait et installe une accumulation que rien ne vient documenter.',
  ],
  annexes:
    'la liste des formulations à remplacer, la grille en trois colonnes vierge, et l’affiche du test de la caméra.',
  quiz: {
    questions: [
      {
        enonce: 'Laquelle de ces phrases passe le test de la caméra&nbsp;?',
        options: [
          '« Il s’est montré agressif envers l’éducatrice. »',
          '« Il a poussé la porte qui a heurté le mur, puis est sorti. »',
          '« Il a voulu impressionner le groupe. »',
          '« Il était dans une logique d’opposition. »',
        ],
        bonne: 1,
        pourquoi:
          'Seule B décrit des gestes qu’un enregistrement aurait captés. A porte un jugement, C prête une intention, D emploie un mot de métier qui a l’apparence d’un constat. Aucune caméra ne filme une logique.',
      },
      {
        enonce: 'Pourquoi le verbe « refuser » n’est-il pas un fait&nbsp;?',
        options: [
          'Parce qu’il est trop négatif.',
          'Parce qu’il suppose que la personne a compris, pouvait faire autrement, et a décidé de ne pas le faire.',
          'Parce qu’il est trop vague.',
          'Parce qu’il est réservé aux écrits médicaux.',
        ],
        bonne: 1,
        pourquoi:
          'Refuser suppose trois choses que vous ne pouvez pas observer : la compréhension, la capacité et la décision. On écrit ce qui s’est passé — « elle est restée assise », « il a dit non » — et on laisse la question du refus à l’analyse.',
      },
      {
        enonce: 'Un collègue écrit « comportements évoquant une problématique psychotique ». Que faut-il en penser&nbsp;?',
        options: [
          'C’est acceptable, la formulation reste prudente.',
          'C’est un diagnostic posé sous une signature éducative, et il ne doit pas y figurer.',
          'C’est utile pour alerter le médecin.',
          'C’est correct si l’équipe est d’accord.',
        ],
        bonne: 1,
        pourquoi:
          '« Évoquant » ne change rien : le mot restera dans le dossier et suivra la personne. Deux dégâts se cumulent — elle est étiquetée sans évaluation, et le vrai travail de diagnostic est retardé parce que « c’est déjà dit ». On rapporte un diagnostic existant en citant qui l’a posé ; on n’en formule jamais.',
      },
      {
        enonce: 'Pourquoi les adjectifs survivent-ils aux recopies alors que le contexte disparaît&nbsp;?',
        options: [
          'Parce qu’ils sont plus courts et plus faciles à résumer.',
          'Parce qu’ils sont plus exacts.',
          'Parce que les logiciels de dossier les indexent.',
          'Parce que les professionnels les préfèrent.',
        ],
        bonne: 0,
        pourquoi:
          'Chaque recopie résume, et un adjectif tient en un mot là où le contexte tient en trois lignes. Personne ne ment : « il a repoussé la table après une matinée sans sa référente » devient « comportement agressif » par simple compression. C’est la raison technique d’écrire des faits.',
      },
      {
        enonce: 'Quel article fonde le droit de la personne à accéder à ce qui est écrit sur elle&nbsp;?',
        options: [
          'L’article 40 du code de procédure pénale.',
          'La loi du 17 juillet 1978.',
          'L’article L311-3 du code de l’action sociale et des familles.',
          'L’article 375 du code civil.',
        ],
        bonne: 2,
        pourquoi:
          'L311-3 du CASF range « l’accès à toute information ou document relatif à sa prise en charge » parmi les droits de la personne accompagnée. L’article 40 al. 2 du CPP ne concerne que les autorités constituées et les fonctionnaires ; la loi de 1978 est codifiée au CRPA et ne se cite plus telle quelle ; l’article 375 du code civil concerne l’assistance éducative.',
      },
    ],
  },
  avant: [
    'Vous pouvez appliquer le test de la caméra à une phrase sans hésiter.',
    'Vous avez reformulé au moins trois interprétations tirées de vos propres écrits.',
    'Vous pouvez expliquer pourquoi un écrit factuel est plus long, et pourquoi cela vaut le coût.',
  ],
};

/* ── MODULE 2 ────────────────────────────────────────────────────────────── */

const M2 = {
  reperes: {
    minutes: 10,
    prerequis: 'Le module 1, et l’écrit passé au test de la caméra.',
    evaluation: 'Vous devez pouvoir repérer, dans un écrit réel, l’endroit exact où la décision a basculé.',
  },
  objectifs: [
    'Suivre le trajet d’une interprétation, d’une transmission du soir jusqu’à une décision d’orientation.',
    'Identifier les trois moments où quelqu’un aurait pu arrêter la chaîne.',
    'Réécrire un paragraphe à charge en séparant les faits de l’hypothèse.',
  ],
  corps: `<h3 style="${G.H3}">1. La scène</h3>

<p>Un ITEP. Yanis, 12 ans, est accueilli depuis huit mois. Un mardi de novembre,
il quitte l’atelier en claquant la porte après une remarque sur son travail. La
transmission du soir dit&nbsp;: <em>« Yanis a de nouveau été agressif et
provocateur, il supporte mal l’autorité. »</em></p>

<p>Trois semaines plus tard, la synthèse reprend&nbsp;: <em>« difficultés
importantes face au cadre et à l’autorité »</em>. En janvier, le rapport pour la
commission écrit&nbsp;: <em>« opposition constante à l’adulte »</em>. En mars,
la commission oriente Yanis vers une structure plus contenante, à quarante
kilomètres.</p>

${G.exemple(
  'Ce que la caméra aurait filmé, ce mardi de novembre',
  `<p>Yanis travaille depuis vingt minutes. L’éducateur technique passe, regarde
sa pièce, et dit&nbsp;: « c’est à refaire. » Yanis pose son outil, se lève, sort
et claque la porte. Il revient de lui-même onze minutes plus tard et se remet au
travail sans rien dire.</p>
<p><strong>Le retour de lui-même au bout de onze minutes n’a jamais été écrit
nulle part.</strong> C’était pourtant le fait le plus intéressant de la
journée.</p>`,
)}

<h3 style="${G.H3}">2. Où la chaîne aurait pu s’arrêter</h3>

<p><strong>Au premier écrit.</strong> « Agressif et provocateur » n’est pas ce
qui s’est passé, et « il supporte mal l’autorité » est une théorie sur Yanis
présentée comme un constat. Une transmission factuelle aurait tenu en trois
lignes : la remarque, le départ, le retour au bout de onze minutes.</p>

<p><strong>À la synthèse.</strong> Personne n’est retourné à la source. La
synthèse a résumé le résumé — c’est là que « une fois » est devenu
« importantes », sans qu’aucun fait nouveau ne soit apparu.</p>

<p><strong>Au rapport.</strong> « Opposition constante » est une affirmation de
fréquence. Elle se vérifie, ou elle ne s’écrit pas. Personne n’a compté.</p>

${G.alerte(
  'Le glissement le plus coûteux : de l’épisode au trait de caractère',
  `<p>« Il a claqué la porte » décrit un événement, situé un mardi de novembre à
propos d’une remarque précise. « Il supporte mal l’autorité » décrit une
propriété de Yanis, valable partout et tout le temps.</p>
<p>Le passage de l’un à l’autre est invisible et il est décisif&nbsp;: un
événement appelle une réponse — parler de la remarque, revoir la façon de la
formuler. Un trait de caractère n’appelle rien d’autre qu’un changement de
lieu.</p>
<p><strong>Repérez les verbes d’état.</strong> « Il est », « il reste »,
« il demeure », « il présente » : à chaque fois qu’un de ces verbes précède un
adjectif, vérifiez qu’il s’agit bien d’une propriété observée dix fois, et pas
d’un épisode transformé en nature.</p>`,
)}

<h3 style="${G.H3}">3. Ce qui manquait, et qui ne coûtait rien</h3>

<p>Les onze minutes. Le fait que Yanis soit revenu seul, sans qu’on aille le
chercher, sans négociation, et qu’il se soit remis au travail. Ce fait existait,
il était gratuit à écrire, et il ne figure dans aucun document.</p>

<p>Un écrit qui l’aurait porté n’aurait pas empêché la difficulté d’exister.
Il aurait posé une autre question&nbsp;: pourquoi cet enfant, qui sait se
réguler tout seul en onze minutes, est-il décrit comme ayant besoin d’un cadre
plus contenant&nbsp;?</p>

<h3 style="${G.H3}">4. Et à la maison</h3>

<p>Le cahier de liaison scolaire fonctionne exactement pareil, et il circule
tout autant. « Journée difficile, comportement inacceptable » ne dit rien à
personne, et arrive le soir chez un parent qui ne peut ni vérifier ni
comprendre. « Il a bousculé un camarade dans le rang à 11 h, il s’est excusé
après » se discute avec l’enfant, le soir même.</p>

<p>La règle vaut dans les deux sens&nbsp;: ce que l’école écrit sur un enfant,
les parents ont le droit de le lire — et ce que les parents écrivent en réponse
entre dans le dossier lui aussi.</p>`,
  aRetenir: `Ce n’est pas une phrase qui a orienté Yanis, c’est une
<strong>chaîne de résumés</strong> dont personne n’est jamais remonté à la
source. Surveillez le glissement de l’épisode au trait de caractère&nbsp;: un
événement appelle une réponse, un trait de caractère n’appelle qu’un changement
de lieu.`,
  exercice: {
    nom: 'La remontée à la source',
    duree: '15 minutes',
    quoi: 'Vérifier une affirmation générale de dossier en cherchant ce qui la fonde.',
    etapes: [
      'Dans un dossier que vous connaissez, trouvez une affirmation générale : « opposition constante », « refuse systématiquement », « difficultés relationnelles importantes ».',
      'Cherchez les écrits qui la fondent. Combien d’épisodes datés trouvez-vous réellement&nbsp;?',
      'Pour un de ces épisodes, écrivez ce qu’une caméra aurait filmé, en trois lignes.',
      'Notez ce qui manque : ce que la personne a fait APRÈS, ce qui s’est passé AVANT, et ce qui s’est bien passé le même jour.',
      'Réécrivez l’affirmation générale en une phrase qui tienne devant ce que vous avez trouvé.',
    ],
    reussi:
      'Vous savez combien d’épisodes datés soutiennent réellement une affirmation qui circule depuis des mois, et vous en avez écrit une version défendable.',
  },
  carnet: {
    intro: 'Deux lignes. Elles se transmettent en réunion, telles quelles.',
    lignes: [
      'L’affirmation générale examinée, et le nombre d’épisodes datés qui la fondent.',
      'Le fait favorable qui existait et que personne n’avait écrit.',
    ],
  },
  vigilance: [
    'Remonter à la source n’est pas accuser l’auteur du premier écrit. Il écrivait à 19 h après une journée difficile, avec quatre transmissions à faire. La chaîne se corrige à chaque maillon, pas au premier.',
    'Une affirmation de fréquence — « constant », « systématique », « toujours » — est une donnée chiffrée déguisée. Si personne n’a compté, elle ne s’écrit pas.',
    'Attention à la synthèse qui résume la synthèse. Dès qu’un écrit reprend un autre écrit sans revenir aux observations, notez-le : c’est là que les nuances disparaissent.',
  ],
  annexes: 'la fiche des verbes d’état, et le tableau des affirmations de fréquence à vérifier.',
  quiz: {
    questions: [
      {
        enonce: 'Quel fait manquait dans tous les écrits concernant Yanis&nbsp;?',
        options: [
          'La remarque de l’éducateur technique.',
          'Le claquement de porte.',
          'Son retour de lui-même au bout de onze minutes.',
          'La date de l’épisode.',
        ],
        bonne: 2,
        pourquoi:
          'Il était gratuit à écrire et c’était le fait le plus intéressant : un enfant qui se régule seul en onze minutes, sans qu’on aille le chercher. Son absence a fait basculer la lecture vers « il faut un cadre plus contenant ».',
      },
      {
        enonce: 'Quelle est la différence décisive entre « il a claqué la porte » et « il supporte mal l’autorité »&nbsp;?',
        options: [
          'La seconde est plus courte.',
          'La première décrit un événement situé, la seconde une propriété permanente.',
          'La seconde est plus professionnelle.',
          'Il n’y en a pas, c’est la même information.',
        ],
        bonne: 1,
        pourquoi:
          'Un événement appelle une réponse — revoir la façon de formuler la remarque. Un trait de caractère n’appelle rien d’autre qu’un changement de lieu. C’est le glissement le plus coûteux du dossier, et il est invisible.',
      },
      {
        enonce: 'Un rapport écrit « opposition constante à l’adulte ». Que faut-il faire avant de l’accepter&nbsp;?',
        options: [
          'Rien, c’est la synthèse de l’équipe.',
          'Compter les épisodes datés qui la fondent.',
          'Demander l’avis du psychologue.',
          'La reformuler plus prudemment.',
        ],
        bonne: 1,
        pourquoi:
          '« Constant » est une affirmation de fréquence, donc une donnée chiffrée déguisée. Si personne n’a compté, elle ne s’écrit pas. La reformuler plus prudemment ne règle rien : elle continuerait de circuler sans fondement.',
      },
      {
        enonce: 'Quels verbes signalent le passage possible de l’épisode au trait de caractère&nbsp;?',
        options: [
          '« Il a dit », « il a fait », « il est sorti ».',
          '« Il est », « il reste », « il demeure », « il présente ».',
          '« Il pourrait », « il semblerait ».',
          '« Il refuse », « il conteste ».',
        ],
        bonne: 1,
        pourquoi:
          'Les verbes d’état suivis d’un adjectif transforment un épisode en nature. À chaque fois, vérifiez qu’il s’agit d’une propriété observée dix fois et non d’un mardi de novembre.',
      },
      {
        enonce: 'Qui porte la responsabilité de la chaîne qui a mené à l’orientation de Yanis&nbsp;?',
        options: [
          'L’auteur de la première transmission.',
          'La commission qui a décidé.',
          'Chaque maillon : la chaîne se corrige à chaque étape, pas seulement au début.',
          'Personne, c’est le fonctionnement normal.',
        ],
        bonne: 2,
        pourquoi:
          'Le premier auteur écrivait à 19 h avec quatre transmissions à faire. La synthèse aurait pu revenir aux observations, le rapport aurait pu compter. Chercher un coupable au premier maillon empêche justement de corriger les suivants.',
      },
    ],
  },
  avant: [
    'Vous avez remonté une affirmation générale jusqu’aux épisodes qui la fondent, et vous les avez comptés.',
    'Vous pouvez citer les quatre verbes d’état qui signalent un glissement.',
    'Vous avez identifié, dans un dossier réel, un fait favorable que personne n’avait écrit.',
  ],
};

/* ── MODULE 3 ────────────────────────────────────────────────────────────── */

const M3 = {
  reperes: {
    minutes: 12,
    prerequis: 'Les modules 1 et 2.',
    evaluation:
      'Vous produisez une grille en trois colonnes, puis vous écrivez une observation par jour pendant sept jours. Le module 4 se lit avec ces sept observations.',
    apres: 'sept jours, une observation écrite par jour, trois lignes maximum.',
  },
  objectifs: [
    'Tenir une grille en trois colonnes sans y passer plus de trois minutes.',
    'Écrire une observation datée, située et filmable, en trois lignes.',
    'Annoncer une hypothèse au lieu de la glisser dans les faits.',
    'Écrire ce qui s’est bien passé avec la même précision que ce qui a posé problème.',
  ],
  corps: `<h3 style="${G.H3}">1. La grille en trois colonnes</h3>

${TROIS_COLONNES}

<p>La colonne du milieu est celle qui surprend. Elle n’est pas là pour être
effacée&nbsp;: penser, faire des hypothèses, ressentir, c’est le métier. Elle
est là pour que la pensée <strong>ne se déguise pas en observation</strong>.</p>

<p>Dans la pratique, on remplit la colonne 2 en premier — c’est ce qui vient
spontanément — puis on se demande ce qui l’a produite. C’est là que la colonne 1
apparaît, et souvent qu’on découvre qu’on ne sait plus.</p>

${G.exemple(
  'Une grille remplie, en trois minutes',
  `<p><strong>Ce que j’en ai pensé&nbsp;:</strong> « il m’a envoyé balader, il
était de mauvaise foi. »</p>
<p><strong>Ce que j’ai vu&nbsp;:</strong> « À 14 h 10, je lui ai demandé s’il
avait rangé sa chambre. Il a répondu “j’ai dit que je le ferais” en haussant la
voix, puis est parti dans le couloir. Il est redescendu vingt minutes plus tard
et a rangé sa chambre. »</p>
<p><strong>Ce que j’écris&nbsp;:</strong> les faits ci-dessus, plus une phrase
annoncée&nbsp;: « J’ai eu le sentiment d’une réponse agacée ; c’était ma
troisième demande de la journée sur le même sujet. »</p>
<p>La dernière incise vaut tout le reste&nbsp;: elle met l’adulte dans la scène,
et c’est presque toujours ce qui manque.</p>`,
)}

<h3 style="${G.H3}">2. Écrire une observation en trois lignes</h3>

<p>Une observation utilisable tient quatre éléments, et pas un de plus&nbsp;:
<strong>quand, où, ce qui a précédé, ce qui s’est passé</strong>. Si vous
ajoutez ce qui a suivi, c’est encore mieux — c’est l’élément le plus souvent
absent, et le plus riche.</p>

<p>Trois lignes, c’est une contrainte volontaire. Un écrit long n’est pas plus
rigoureux&nbsp;; il est surtout moins relu. Et la contrainte force à choisir les
faits qui comptent plutôt qu’à tout raconter.</p>

${G.alerte(
  'Mettez l’adulte dans la scène',
  `<p>La quasi-totalité des observations professionnelles décrivent ce que la
personne a fait, et rien de ce que l’adulte a fait juste avant. C’est une
amputation, et elle oriente la lecture&nbsp;: un comportement sans antécédent
paraît surgir de la personne.</p>
<p>Notez la consigne que vous avez donnée, sa formulation, le nombre de fois,
le moment. Cela ne vous met pas en cause&nbsp;: cela rend la scène lisible, et
c’est souvent là que se trouve ce qui peut changer.</p>`,
)}

<h3 style="${G.H3}">3. Annoncer une hypothèse</h3>

<p>Trois formulations suffisent, et elles doivent devenir des réflexes&nbsp;:
<strong>« je fais l’hypothèse que… »</strong>, <strong>« ce que j’en comprends,
à ce stade… »</strong>, <strong>« il me semble, sans en être sûr… »</strong>.</p>

<p>Elles ne fragilisent pas l’écrit, elles le renforcent. Un professionnel qui
distingue ce qu’il a vu de ce qu’il en pense est nettement plus crédible devant
un partenaire qu’un professionnel qui affirme tout au même niveau — et son
hypothèse, elle, sera lue.</p>

<h3 style="${G.H3}">4. Le relevé : une observation par jour, sept jours</h3>

<p>Une seule par jour, trois lignes, sur n’importe quelle situation — pas
forcément un incident. C’est justement l’intérêt&nbsp;: la moitié des
observations devraient porter sur des moments ordinaires ou favorables.</p>

<p>Si les sept observations portent sur des difficultés, vous n’avez pas un
relevé, vous avez un dossier à charge — et le module 4 commence par là.</p>`,
  aRetenir: `On remplit la colonne « ce que j’en ai pensé » en premier, puis on
cherche ce qui l’a produite. Une observation tient en trois lignes&nbsp;: quand,
où, ce qui a précédé, ce qui s’est passé. Et <strong>l’adulte fait partie de la
scène</strong>.`,
  exercice: {
    nom: 'Sept jours, sept observations',
    duree: '3 minutes par jour, pendant sept jours',
    quoi: 'Produire le matériau que le module 4 fera relire.',
    etapes: [
      'Recopiez la grille en trois colonnes à la main, sur une feuille que vous gardez sur vous.',
      'Chaque jour, une observation. Trois lignes : quand, où, ce qui a précédé, ce qui s’est passé. Ajoutez ce qui a suivi quand vous le savez.',
      'Écrivez-la le jour même. Une observation reconstituée le dimanche est une interprétation, quelle que soit votre bonne foi.',
      'Au moins trois des sept doivent porter sur un moment ordinaire ou favorable. Comptez-les.',
      'Quand une hypothèse vous vient, écrivez-la — dans une phrase qui l’annonce.',
    ],
    reussi:
      'Vous avez sept observations datées, dont au moins trois ne portent pas sur une difficulté, et aucune ne contient de verbe d’état suivi d’un adjectif.',
  },
  carnet: {
    intro: 'Les sept observations sont le livrable. Ajoutez ces deux lignes.',
    lignes: [
      'Le nombre d’observations portant sur un moment ordinaire ou favorable, sur sept.',
      'La difficulté que vous avez rencontrée le plus souvent en écrivant : trouver les faits, résister à l’adjectif, ou tenir en trois lignes.',
    ],
  },
  vigilance: [
    'Ne montrez pas vos sept observations à l’équipe avant le module 4. L’exercice porte sur votre écriture, et le regard d’un collègue la change immédiatement.',
    'Si vous ne vous souvenez plus des faits en écrivant le soir, notez-le tel quel : « je ne me souviens plus de ce qui a précédé ». C’est une observation honnête, et elle vaut mieux qu’une reconstitution vraisemblable.',
    'Une observation n’est pas un rapport. Trois lignes suffisent, et la contrainte fait partie de l’exercice : ce qui ne tient pas en trois lignes contient probablement de l’interprétation.',
  ],
  annexes: 'la grille en trois colonnes vierge, le gabarit d’observation en trois lignes, et les trois formulations d’hypothèse.',
  quiz: {
    questions: [
      {
        enonce: 'Dans quel ordre remplit-on la grille en trois colonnes&nbsp;?',
        options: [
          'Colonne 1, puis 2, puis 3, dans l’ordre logique.',
          'La colonne 2 d’abord — ce qu’on a pensé — puis on cherche ce qui l’a produite.',
          'La colonne 3 d’abord, c’est le résultat qui compte.',
          'Peu importe, l’ordre n’a pas d’effet.',
        ],
        bonne: 1,
        pourquoi:
          'La colonne 2 est ce qui vient spontanément : la nier ne la fait pas disparaître, elle ressort déguisée en observation. En l’écrivant d’abord, on se demande ensuite ce qui l’a produite — et c’est là qu’on découvre parfois qu’on ne sait plus.',
      },
      {
        enonce: 'Quels sont les quatre éléments d’une observation utilisable&nbsp;?',
        options: [
          'Le comportement, sa fréquence, sa gravité, sa cause.',
          'Quand, où, ce qui a précédé, ce qui s’est passé.',
          'La personne, l’équipe, le lieu, l’heure.',
          'Le fait, l’hypothèse, la décision, le suivi.',
        ],
        bonne: 1,
        pourquoi:
          'Et si vous pouvez ajouter ce qui a suivi, c’est encore mieux : c’est l’élément le plus souvent absent des dossiers et le plus riche — c’est lui qui manquait dans le cas de Yanis.',
      },
      {
        enonce: 'Pourquoi noter la consigne que VOUS avez donnée&nbsp;?',
        options: [
          'Pour se protéger en cas de contestation.',
          'Parce qu’un comportement sans antécédent paraît surgir de la personne.',
          'Parce que le règlement l’impose.',
          'Pour allonger l’observation.',
        ],
        bonne: 1,
        pourquoi:
          'Décrire ce que fait la personne sans ce que l’adulte vient de faire est une amputation, et elle oriente la lecture. Mettre l’adulte dans la scène ne met personne en cause : c’est souvent là que se trouve ce qui peut changer.',
      },
      {
        enonce: 'Vos sept observations portent toutes sur des incidents. Que faut-il en conclure&nbsp;?',
        options: [
          'Que la semaine a été difficile.',
          'Que vous avez produit un dossier à charge, pas un relevé.',
          'Que la personne va mal.',
          'Que l’exercice est réussi, les incidents sont ce qui compte.',
        ],
        bonne: 1,
        pourquoi:
          'Un écrit qui ne contient que des faits problématiques n’est pas neutre parce qu’il est factuel : il est à charge. C’est l’erreur la plus fréquente des écrits « rigoureux », et c’est aussi ce que le cadre national de référence de la HAS demande d’éviter.',
      },
      {
        enonce: 'Vous ne vous souvenez plus de ce qui a précédé. Que faites-vous&nbsp;?',
        options: [
          'Vous reconstituez le plus vraisemblable.',
          'Vous demandez à un collègue ce qu’il en pense.',
          'Vous écrivez « je ne me souviens plus de ce qui a précédé ».',
          'Vous n’écrivez pas l’observation.',
        ],
        bonne: 2,
        pourquoi:
          'Une reconstitution vraisemblable est une interprétation qui entrera dans le dossier comme un fait. Le trou honnête, lui, se lit et se corrige. C’est la même règle que pour un relevé chiffré : un blanc annoncé vaut mieux qu’une estimation.',
      },
    ],
  },
  avant: [
    'Vos sept observations sont écrites, datées, et tiennent en trois lignes.',
    'Au moins trois portent sur un moment ordinaire ou favorable.',
    'Chaque hypothèse est annoncée par une des trois formulations.',
  ],
  pause: {
    jours: 'sept jours',
    texte: `<p>Le module 4 fait relire vos propres observations. Sans elles, il
n’y a rien à relire, et la partie la plus utile du parcours — se voir écrire —
n’a pas lieu.</p>
<p>Trois minutes par jour. Si vous sautez un jour, écrivez-le plutôt que de
rattraper deux observations le lendemain&nbsp;: une observation écrite à
distance n’est plus une observation.</p>`,
  },
};

/* ── MODULE 4 ────────────────────────────────────────────────────────────── */

const M4 = {
  reperes: {
    minutes: 12,
    prerequis: 'Les sept observations du module 3.',
    evaluation:
      'Vous produisez une relecture chiffrée de vos propres écrits, et une phrase de bilan transmissible.',
  },
  objectifs: [
    'Relire ses propres écrits avec quatre critères mesurables.',
    'Rétablir l’équilibre exigé par le cadre national de référence : préoccupations et points d’appui.',
    'Faire figurer le point de vue de la personne, et savoir comment le rapporter.',
    'Transmettre la méthode à une équipe sans en faire un procès.',
  ],
  corps: `<h3 style="${G.H3}">1. La relecture en quatre passes</h3>

<p>Prenez vos sept observations. Quatre passes, chacune sur un seul critère —
c’est ce qui rend la relecture faisable, et honnête.</p>

<p><strong>Passe 1, les verbes d’état.</strong> Soulignez chaque « il est »,
« il reste », « il présente » suivi d’un adjectif. Comptez-les.</p>

<p><strong>Passe 2, les intentions.</strong> Soulignez chaque mot qui prête une
motivation : « pour », « afin de », « cherche à », « veut », « refuse ».</p>

<p><strong>Passe 3, l’adulte.</strong> Dans combien de vos observations
apparaît ce que vous avez fait ou dit juste avant&nbsp;? Le chiffre est
généralement bas, et c’est le plus instructif du parcours.</p>

<p><strong>Passe 4, l’équilibre.</strong> Combien portent sur un moment
ordinaire ou favorable&nbsp;?</p>

${G.alerte(
  'L’équilibre n’est pas une délicatesse, c’est une exigence de la HAS',
  `<p>Le <strong>cadre national de référence de janvier 2021</strong>, rendu
obligatoire par le <strong>décret 2022-1728</strong>, demande que l’évaluation
d’une situation porte sur les <strong>éléments préoccupants ET les points
d’appui</strong>, et qu’elle fasse figurer le <strong>point de vue de l’enfant
comme celui de ses parents</strong>.</p>
<p>C’est, à notre connaissance, le seul texte qui encadre réellement ce que doit
contenir un écrit d’évaluation. Il ne dit rien de la distinction entre faits et
interprétation — cette règle-là est une règle de métier, pas une norme
opposable, et le parcours ne prétend pas le contraire.</p>
<p>Un dossier qui n’aligne que des difficultés n’est donc pas seulement injuste :
il est incomplet au regard de ce qui est attendu.</p>`,
)}

<h3 style="${G.H3}">2. Faire figurer le point de vue de la personne</h3>

<p>C’est ce qui manque le plus souvent, et c’est ce qui se répare le plus
facilement&nbsp;: il suffit de demander, puis de citer.</p>

<p>« Quand je lui ai relu ce passage, Yanis m’a dit&nbsp;: “j’étais énervé
parce qu’il a dit ça devant les autres.” » Une phrase. Elle change la nature du
document&nbsp;: on passe d’un écrit <em>sur</em> quelqu’un à un écrit <em>avec</em>
quelqu’un.</p>

<p>Et quand la personne ne s’exprime pas verbalement, cela s’écrit
aussi&nbsp;: ce qu’elle a fait quand on lui a montré, vers quoi elle est allée,
ce qu’elle a repoussé.</p>

<h3 style="${G.H3}">3. Ce qui reste vrai quand c’est grave</h3>

<p>Une question revient toujours&nbsp;: et quand il y a danger&nbsp;? La réponse
ne change pas — elle devient plus importante.</p>

<p>Un écrit qui doit servir à protéger quelqu’un doit être <strong>solide</strong>,
et rien n’est plus fragile qu’un dossier d’adjectifs. Devant un magistrat, « il
a été violent à plusieurs reprises » ne pèse rien face à trois épisodes datés,
décrits, avec ce qui a précédé et ce qui a suivi.</p>

<p>La précision n’est pas une tiédeur. C’est ce qui rend un écrit utilisable au
moment où il compte vraiment.</p>

<h3 style="${G.H3}">4. Transmettre à l’équipe sans faire de procès</h3>

<p>Le pire usage de ce parcours serait d’arriver en réunion avec une liste de
formulations fautives relevées chez les collègues. Cela produit de la vexation
et zéro changement.</p>

<p>Ce qui marche&nbsp;: proposer une règle commune, sur un seul point à la fois,
pendant un mois. Par exemple&nbsp;: <em>« ce mois-ci, on écrit ce qui s’est
passé juste avant. »</em> Un critère, un mois, et on regarde ensemble ce que ça
change dans les dossiers.</p>

<p>La phrase de bilan, elle, contient <strong>deux chiffres</strong>&nbsp;:
« Sur sept observations, quatre contenaient un verbe d’état, et deux
mentionnaient ce que j’avais dit juste avant. »</p>`,
  aRetenir: `Relisez-vous en quatre passes, une par critère. Un dossier qui
n’aligne que des difficultés est <strong>incomplet</strong> au regard du cadre
national de référence, pas seulement injuste. Et quand c’est grave, la précision
n’est pas une tiédeur&nbsp;: c’est ce qui rend l’écrit utilisable.`,
  exercice: {
    nom: 'La relecture chiffrée',
    duree: '20 minutes',
    quoi: 'Se voir écrire, avec des nombres plutôt qu’avec une impression.',
    etapes: [
      'Faites les quatre passes sur vos sept observations. Notez les quatre chiffres.',
      'Reprenez l’observation qui contient le plus d’interprétations et réécrivez-la entièrement.',
      'Choisissez une observation et allez demander à la personne concernée ce qu’elle en dit. Ajoutez sa phrase, entre guillemets.',
      'Écrivez la règle commune que vous proposerez à l’équipe : un seul critère, pour un mois.',
      'Écrivez la phrase de bilan, avec ses deux chiffres.',
    ],
    reussi:
      'Vous avez quatre chiffres sur vos propres écrits, une observation réécrite, une citation de la personne, et une règle d’équipe tenant en une phrase.',
  },
  carnet: {
    intro: 'Quatre lignes, qui referment le parcours et se reprennent en réunion.',
    lignes: [
      'Les quatre chiffres de la relecture.',
      'La citation obtenue de la personne concernée.',
      'La règle commune proposée à l’équipe, et la date à laquelle vous la réévaluerez.',
      'La phrase de bilan.',
    ],
  },
  vigilance: [
    'Ne corrigez pas les écrits déjà versés au dossier. Un document signé et transmis ne se réécrit pas : on ajoute une observation nouvelle et datée, on n’efface pas le passé.',
    'Demander son avis à la personne n’est pas lui faire valider l’écrit. Elle peut être en désaccord, et le désaccord s’écrit aussi : « Yanis conteste cette description et dit que… ».',
    'Un critère par mois, pas quatre. Une équipe à qui on demande de tout changer d’un coup ne change rien, et le parcours aura servi à produire de la culpabilité.',
  ],
  annexes: 'la fiche de relecture en quatre passes, le tableau des formulations à remplacer, et le modèle de règle d’équipe.',
  quiz: {
    questions: [
      {
        enonce: 'Que demande réellement le cadre national de référence de janvier 2021&nbsp;?',
        options: [
          'De distinguer les faits des interprétations.',
          'Que l’évaluation porte sur les éléments préoccupants ET les points d’appui, et fasse figurer le point de vue de l’enfant et des parents.',
          'De faire relire les écrits par un cadre.',
          'D’utiliser une trame unique nationale.',
        ],
        bonne: 1,
        pourquoi:
          'C’est l’exigence d’ÉQUILIBRE, rendue obligatoire par le décret 2022-1728. La distinction faits/interprétation, elle, est une règle de métier solide mais qu’aucun texte n’impose : il n’existe aucune recommandation consacrée aux écrits professionnels, et il ne faut pas prétendre le contraire.',
      },
      {
        enonce: 'Un écrit doit servir à protéger un enfant en danger. Faut-il assouplir la règle des faits&nbsp;?',
        options: [
          'Oui, l’urgence justifie d’être plus direct.',
          'Non : c’est précisément là que la précision compte le plus.',
          'Oui, à condition de le signaler.',
          'Peu importe, le magistrat tranchera.',
        ],
        bonne: 1,
        pourquoi:
          'Rien n’est plus fragile qu’un dossier d’adjectifs. « Il a été violent à plusieurs reprises » ne pèse rien devant trois épisodes datés, décrits, avec ce qui a précédé et ce qui a suivi. La précision n’est pas une tiédeur, c’est ce qui rend l’écrit utilisable au moment où il compte.',
      },
      {
        enonce: 'La personne conteste ce que vous avez écrit. Que faites-vous&nbsp;?',
        options: [
          'Vous modifiez l’écrit pour tenir compte de son avis.',
          'Vous écrivez son désaccord : « X conteste cette description et dit que… ».',
          'Vous retirez le passage contesté.',
          'Vous notez qu’elle n’adhère pas à l’accompagnement.',
        ],
        bonne: 1,
        pourquoi:
          'Demander son avis n’est pas lui faire valider l’écrit. Le désaccord s’écrit et enrichit le document. La réponse D est la plus dangereuse : elle transforme un désaccord légitime en trait de caractère, exactement le glissement du module 2.',
      },
      {
        enonce: 'Comment transmettre la méthode à une équipe&nbsp;?',
        options: [
          'En relevant en réunion les formulations fautives des collègues.',
          'En proposant une règle commune, un seul critère, pendant un mois.',
          'En faisant relire tous les écrits par un référent.',
          'En diffusant la liste des mots interdits.',
        ],
        bonne: 1,
        pourquoi:
          'Une équipe à qui on demande de tout changer d’un coup ne change rien. Un critère, un mois, et on regarde ensemble ce que ça donne. La réponse A produit de la vexation et zéro changement — et ces formulations sont dans tous les dossiers, y compris les nôtres.',
      },
      {
        enonce: 'Vous relisez un écrit déjà versé au dossier et vous y trouvez une interprétation écrite comme un fait. Que faites-vous&nbsp;?',
        options: [
          'Vous le corrigez.',
          'Vous ajoutez une observation nouvelle et datée, sans effacer le passé.',
          'Vous demandez le retrait du document.',
          'Vous en parlez à l’auteur uniquement.',
        ],
        bonne: 1,
        pourquoi:
          'Un document signé et transmis ne se réécrit pas — le corriger après coup poserait un problème bien plus grave que la formulation d’origine. On complète, on date, et le dossier garde la trace des deux lectures.',
      },
    ],
  },
  avant: [
    'Vous avez les quatre chiffres de votre relecture.',
    'Une observation a été réécrite entièrement, et une citation de la personne y figure.',
    'Votre règle d’équipe tient en une phrase et ne porte que sur un critère.',
  ],
};

/* ── ANNEXES ─────────────────────────────────────────────────────────────── */

const ANNEXES =
  A.entete('Décrire un comportement sans le juger') +
  A.fiche({
    numero: 1,
    titre: 'Le test de la caméra',
    quand: 'à afficher au-dessus du poste où l’on écrit les transmissions.',
    contenu:
      `<div style="${G.GRIS}">
<p style="margin:0;font-size:1.05em"><strong>Une caméra posée dans la pièce
aurait-elle enregistré ce que je viens d’écrire&nbsp;?</strong></p>
</div>` +
      A.tableau(
        ['Elle l’aurait filmé', 'Elle ne l’aurait pas filmé'],
        [
          [
            'Gestes, paroles rapportées, durées, positions, heures, ce qui a précédé, ce qui a suivi.',
            'Intentions, motivations, traits de caractère, états intérieurs, diagnostics.',
          ],
          [
            '<em>« Il a poussé la porte qui a heurté le mur, puis est sorti. Il est revenu onze minutes plus tard. »</em>',
            '<em>« Il a claqué la porte pour provoquer l’adulte. Il supporte mal l’autorité. »</em>',
          ],
          ['Ça s’écrit tel quel.', 'Ça s’écrit annoncé : « je fais l’hypothèse que… ».'],
        ],
      ),
  }) +
  A.fiche({
    numero: 2,
    titre: 'Les formulations à remplacer',
    quand: 'à la relecture, avant de valider une transmission ou un rapport.',
    contenu: A.tableau(
      ['Ce qui s’écrit spontanément', 'Ce qui s’écrit à la place'],
      [
        ['Il a été agressif', 'Le geste : « il a jeté sa chaise contre le mur »'],
        ['Il refuse de participer', '« Il est resté assis pendant les vingt minutes »'],
        ['Il cherche l’attention', 'Ce qu’il a fait, et ce qui a suivi'],
        ['Il est manipulateur', 'Aucune caméra ne filme une manipulation. À retirer.'],
        ['La mère est dans le déni', 'Ses mots : « Mme X nous a dit ne pas constater… »'],
        ['Comportement inadapté', 'La situation et le comportement, séparément'],
        ['Opposition constante', 'Le nombre d’épisodes datés. Sinon, à retirer.'],
        ['Il est immature', 'Ce qu’il fait, et à quel âge on l’attendrait — si on le sait'],
        ['Encore une fois, il a…', 'La date et le fait. « Encore » n’ajoute rien.'],
        ['Comportements évoquant…', 'Aucun diagnostic sous signature éducative.'],
      ],
    ),
  }) +
  A.fiche({
    numero: 3,
    titre: 'La grille en trois colonnes',
    quand: 'à recopier à la main et à garder sur soi pendant les sept jours.',
    contenu:
      A.tableau(
        ['Ce que j’ai vu (filmable)', 'Ce que j’en ai pensé', 'Ce que j’écris'],
        [
          ['', '', ''],
          ['', '', ''],
          ['', '', ''],
        ],
      ) +
      `<div style="${G.GRIS}">
<p style="margin:0"><strong>On remplit la colonne 2 en premier</strong>, puis on
cherche ce qui l’a produite. La colonne 2 n’est pas une colonne de honte&nbsp;:
penser est le métier. Elle existe pour que la pensée ne se déguise pas en
observation.</p>
</div>`,
  }) +
  A.fiche({
    numero: 4,
    titre: 'Le gabarit d’observation en trois lignes',
    quand: 'chaque jour du relevé, le jour même.',
    contenu:
      A.tableau(
        ['Élément', 'À écrire'],
        [
          ['Quand', 'Date et heure approximative.'],
          ['Où', 'Le lieu, et qui était présent.'],
          ['Ce qui a précédé', 'Ce que l’adulte a dit ou fait juste avant. L’élément le plus souvent absent.'],
          ['Ce qui s’est passé', 'Les gestes et les paroles, sans adjectif.'],
          ['Ce qui a suivi', 'Facultatif, et c’est le plus riche.'],
          ['Hypothèse', 'Annoncée : « je fais l’hypothèse que… ». Facultative.'],
        ],
      ) +
      `<div style="${G.ALERTE}">
<p style="margin:0"><strong>Au moins trois observations sur sept doivent porter
sur un moment ordinaire ou favorable.</strong> Sept observations d’incidents ne
font pas un relevé, elles font un dossier à charge — et c’est incomplet au
regard du cadre national de référence de janvier 2021.</p>
</div>`,
  }) +
  A.fiche({
    numero: 5,
    titre: 'La relecture en quatre passes',
    quand: 'au module 4, et ensuite une fois par mois sur ses propres écrits.',
    contenu: A.tableau(
      ['Passe', 'Ce qu’on souligne', 'Le chiffre à noter'],
      [
        ['1. Verbes d’état', '« il est », « il reste », « il demeure », « il présente » + adjectif', 'Combien'],
        ['2. Intentions', '« pour », « afin de », « cherche à », « veut », « refuse »', 'Combien'],
        ['3. L’adulte', 'Ce que vous avez dit ou fait juste avant', 'Dans combien d’observations sur 7'],
        ['4. Équilibre', 'Moments ordinaires ou favorables', 'Combien sur 7'],
      ],
    ),
  }) +
  A.fiche({
    numero: 6,
    titre: 'Ce qui est vrai, et ce qui circule à tort',
    quand: 'le jour où quelqu’un affirme en réunion qu’un texte impose telle façon d’écrire.',
    contenu: A.tableau(
      ['Ce qu’on entend', 'Ce qu’il en est'],
      [
        [
          '« La HAS impose de distinguer les faits des interprétations. »',
          '<strong>Faux.</strong> Il n’existe aucune recommandation consacrée aux écrits professionnels. C’est une règle de métier, solide et partagée, mais pas une norme opposable.',
        ],
        [
          '« Rien n’encadre le contenu de nos écrits. »',
          '<strong>Faux aussi.</strong> Le cadre national de référence de janvier 2021, rendu obligatoire par le décret 2022-1728, exige l’équilibre : éléments préoccupants ET points d’appui, point de vue de l’enfant ET des parents.',
        ],
        [
          '« La personne n’a pas accès à ce qu’on écrit. »',
          '<strong>Faux.</strong> L’article L311-3 du CASF range l’accès à toute information ou document relatif à sa prise en charge parmi ses droits.',
        ],
        [
          '« L’article 40 nous oblige à signaler. »',
          '<strong>Inexact pour la plupart.</strong> L’article 40 al. 2 du CPP n’oblige que les autorités constituées et les fonctionnaires, donc pas un salarié d’association.',
        ],
      ],
    ),
  }) +
  A.pied();

module.exports = {
  slug: 'decrire-un-comportement-sans-le-juger',
  modules: [
    { titre: 'Module 1 — Le test de la caméra', minutes: 12, html: G.assembler(M1) },
    { titre: 'Module 2 — Comment une phrase du soir devient une orientation', minutes: 10, html: G.assembler(M2) },
    { titre: 'Module 3 — Exercice guidé : la grille en trois colonnes', minutes: 12, html: G.assembler(M3) },
    { titre: 'Module 4 — Se relire, et transmettre à l’équipe', minutes: 12, html: G.assembler(M4) },
  ],
  annexes: ANNEXES,
};
