/**
 * F6 — LES PREMIÈRES MINUTES D'UNE CRISE
 *
 * Compétence : réduire ce que l'adulte AJOUTE pendant une crise, et écrire à
 * froid ce qui se passera la prochaine fois.
 *
 * ── POURQUOI CE TITRE, ET PAS UN AUTRE ──────────────────────────────────────
 * La requête qui tourne partout est « désamorcer une crise en 90 secondes ».
 * On ne l'écrit pas. Promettre l'arrêt d'une crise en un temps donné est faux,
 * et c'est un mensonge qui coûte cher : l'adulte qui a acheté cette promesse
 * en veut à la personne quand la crise dure sept minutes. Le titre nomme donc
 * la FENÊTRE (les premières minutes) et la compétence porte sur ce que l'adulte
 * maîtrise réellement — son propre comportement, et la préparation à froid.
 *
 * ── CE PARCOURS EST LE PLUS DÉLICAT DU CATALOGUE ────────────────────────────
 * Trois règles tenues d'un bout à l'autre :
 *   1. AUCUNE technique d'intervention physique n'est enseignée. Ni prise, ni
 *      maintien, ni « accompagnement au sol », ni portage. Ces gestes blessent
 *      et tuent quand ils sont appris dans un texte ; ils relèvent d'un
 *      protocole d'établissement et d'une formation en présentiel avec mise en
 *      situation, pas d'une mini-formation gratuite.
 *   2. La sécurité prime sur la pédagogie, et c'est dit avant tout le reste.
 *   3. On ne promet jamais qu'une crise s'arrêtera. On travaille sur ce qui
 *      s'ajoute, sur ce qui se répète et sur ce qui s'écrit après.
 *
 * ⚠ La nuance comportementale et l'avertissement sont ajoutés par build-v2.js.
 */

const G = require('./gabarit-v3.js');
const A = require('./annexes.js');
const S = require('./schemas.js');

/* ── MODULE 1 ────────────────────────────────────────────────────────────── */


/* ── FIGURES ─────────────────────────────────────────────────────────────── */

const CARTE = S.figure({
  numero: 1,
  titre: 'La carte du parcours',
  corps: S.carte({
    modules: [
      { titre: 'Module 1', produit: 'la théorie et les limites' },
      { titre: 'Module 2', produit: 'une scène analysée' },
      { titre: 'Module 3', produit: 'votre fiche à froid' },
      { titre: 'Module 4', produit: 'la lecture du relevé' },
    ],
    releve:
      '<strong>Entre le module 3 et le module 4 :</strong> dix jours de relevé, une minute par épisode — et rien les jours sans épisode.',
  }),
  legende:
    'Ce parcours n’arrête pas les crises et ne le promet nulle part. Ce qu’il produit est plus modeste : des crises où l’adulte n’ajoute rien, une récupération plus courte, et un écrit qui tient devant une équipe.',
});

const SCH_TEMPS = S.figure({
  numero: 2,
  titre: 'Les quatre temps, et où l’on a une prise',
  corps: S.frise([
    { nom: 'AVANT', largeur: 28, fort: true, quoi: 'Le seul moment où l’on change vraiment quelque chose : alléger, prévenir, offrir une sortie' },
    { nom: 'MONTÉE', largeur: 20, fort: true, quoi: 'Réduire : moins de mots, moins de demandes, moins de public. Sécuriser l’espace' },
    { nom: 'PIC', largeur: 16, fort: false, quoi: 'Presque rien. Rester visible, attendre, ne pas ajouter' },
    { nom: 'DESCENTE et RÉCUPÉRATION', largeur: 36, fort: false, quoi: 'Du temps. Ne rien redemander — c’est ici que naît la deuxième crise' },
  ]),
  legende:
    'La barre pleine marque les deux moments où l’adulte a une prise réelle. Les deux autres se traversent : c’est l’information la plus utile du module, et la plus difficile à tenir.',
});

const SCH_LECTURE6 = S.figure({
  numero: 3,
  titre: 'Lire le relevé au dixième jour',
  corps: S.arbre({
    question: 'Que montrent les cinq colonnes sur dix jours ?',
    branches: [
      {
        condition: 'Un horaire ou un moment revient',
        alors:
          '<strong>Baliser ce moment</strong><br><span style="color:#6b6f76;font-size:.94em">collation, repère visuel, annonce cinq minutes avant</span>',
      },
      {
        condition: 'Les épisodes suivent une demande, ou un refus',
        alors:
          '<strong>Chercher la fonction</strong><br><span style="color:#6b6f76;font-size:.94em">alléger la tâche, enseigner une autre demande</span>',
      },
      {
        condition: 'Les « rien » de la colonne 4 augmentent',
        alors:
          '<strong>Vous avez retiré un ajout</strong><br><span style="color:#6b6f76;font-size:.94em">c’est le résultat attendu : on retire le deuxième</span>',
      },
      {
        condition: 'Les épisodes graves suivent les reprises courtes',
        alors:
          '<strong>Augmenter le délai de reprise</strong><br><span style="color:#6b6f76;font-size:.94em">décision gratuite, applicable dès demain</span>',
      },
    ],
  }),
  legende:
    'La durée du pic n’est pas votre indicateur : elle bouge lentement et dépend de beaucoup de choses. Les colonnes 4 et 5 mesurent ce qui dépend de vous.',
});

const M1 = {
  reperes: {
    minutes: 12,
    prerequis:
      'aucun. Ce module s’adresse autant à un parent qu’à un professionnel, et il ne suppose aucune connaissance préalable.',
    evaluation:
      'votre description d’une crise réelle, écrite en termes observables, et la liste de ce que vous y ajoutez.',
  },
  objectifs: [
    'Décrire une crise en termes observables plutôt que la qualifier',
    'Situer les quatre temps d’une crise, et savoir ce qui est possible à chacun',
    'Reconnaître les six choses que l’adulte ajoute presque toujours sans le vouloir',
    'Appliquer les trois réductions : moins de mots, moins de demandes, moins de public',
    'Nommer les limites absolues, et ce que cette formation ne remplace pas',
  ],
  corps: `${G.alerte(
    'À lire avant tout le reste',
    `<p>Cette formation n’enseigne <strong>aucun geste d’intervention physique</strong>&nbsp;:
ni prise, ni maintien, ni «&nbsp;accompagnement au sol&nbsp;», ni portage. Ces gestes
blessent quand ils s’apprennent dans un texte. S’ils sont nécessaires dans votre cadre de
travail, ils relèvent du protocole écrit de votre établissement et d’une formation en
présentiel avec mise en situation — pas d’une page web.</p>
<p style="margin-bottom:0">Elle ne remplace pas non plus un avis médical. Une crise qui
apparaît brutalement chez quelqu’un qui n’en faisait pas, qui change de forme, ou qui
s’accompagne de signes physiques inhabituels, se signale à un médecin&nbsp;: la douleur
est une cause fréquente et régulièrement manquée.</p>`,
  )}

${CARTE}

<h3 style="${G.H3}">1. Le mot « crise » ne décrit rien</h3>
<p>«&nbsp;Il a fait une crise.&nbsp;» La phrase circule en réunion, passe dans le cahier
de liaison, arrive dans un rapport. Elle ne dit ni ce qui s’est produit, ni combien de
temps, ni ce qui l’a précédé, ni ce qui l’a suivi. Deux professionnels qui l’emploient le
même jour ne parlent pas de la même chose&nbsp;: pour l’un c’est trois minutes de cris,
pour l’autre c’est une chaise renversée.</p>
<p>Le premier geste professionnel de ce parcours n’est donc pas une technique&nbsp;: c’est
un changement de vocabulaire.</p>
${A.tableau(
  ['Ce qu’on écrit', 'Ce que ça permet de faire', 'Ce qu’il vaut mieux écrire'],
  [
    [
      'Il a fait une crise.',
      'Rien. Aucun élément n’est comparable d’une fois sur l’autre.',
      'À 11 h 40, après l’annonce que la sortie était annulée, il a crié pendant environ quatre minutes, debout, sans se déplacer, puis s’est assis contre le mur.',
    ],
    [
      'Elle était ingérable.',
      'Rien, et la phrase désigne la personne comme le problème.',
      'Elle a jeté trois objets à portée de main et a refusé toute proposition pendant six à sept minutes.',
    ],
    [
      'Grosse crise ce matin.',
      'Rien de comparable&nbsp;: «&nbsp;grosse&nbsp;» n’est ni une durée ni une intensité.',
      'Douze minutes, contre quatre la semaine dernière, avec un coup porté à la porte.',
    ],
  ],
)}
<p><strong>Une description utile contient un horaire, une durée, ce qui précédait et ce
qui s’est réellement produit.</strong> Ces quatre éléments tiennent en deux lignes, et ce
sont eux qui rendront le relevé du module&nbsp;4 lisible.</p>

<h3 style="${G.H3}">2. Les quatre temps, et ce qui est possible à chacun</h3>
${SCH_TEMPS}
<p>Une crise n’est pas un bloc. Elle a une forme, presque toujours la même chez la même
personne, et ce qui est possible n’est pas le même à chaque instant.</p>
${A.tableau(
  ['Temps', 'Ce qui se voit', 'Ce qui est possible', 'Ce qui est inutile ou coûteux'],
  [
    [
      '<strong>1. Avant</strong>',
      'Les signes propres à la personne&nbsp;: le débit qui change, une main qui frotte, un déplacement, un silence inhabituel, une question répétée.',
      'C’est le seul moment où l’on change vraiment quelque chose&nbsp;: alléger la demande, offrir une sortie, réduire le bruit, proposer la pause.',
      'Ignorer le signe parce qu’«&nbsp;il faut bien qu’il apprenne&nbsp;».',
    ],
    [
      '<strong>2. La montée</strong>',
      'Le ton monte, les gestes s’amplifient, la personne ne répond plus aux propositions.',
      'Réduire&nbsp;: moins de mots, moins de demandes, moins de public. Sécuriser l’espace.',
      'Raisonner, négocier, expliquer la règle, poser une question ouverte.',
    ],
    [
      '<strong>3. Le pic</strong>',
      'Cris, pleurs, gestes, objets, parfois immobilité totale.',
      'Presque rien, et c’est l’information la plus utile du module. On assure la sécurité, on attend, on n’ajoute pas.',
      'Tout le reste. Une consigne donnée au pic n’est pas entendue&nbsp;; une sanction annoncée au pic ne sera pas reliée à quoi que ce soit.',
    ],
    [
      '<strong>4. La descente et la récupération</strong>',
      'Le volume baisse, la respiration change, la personne accepte à nouveau une présence. Puis une longue phase de fatigue, parfois une heure ou plus.',
      'Rétablir le calme, proposer de l’eau, laisser du temps. Reprendre la tâche <em>plus tard</em>, allégée.',
      'Faire la leçon, exiger des excuses, demander «&nbsp;pourquoi tu as fait ça&nbsp;?&nbsp;». La récupération n’est pas le moment de l’analyse.<br>Et surtout&nbsp;: relancer la demande d’origine trop tôt — c’est ce qui déclenche la deuxième crise, souvent plus dure que la première.',
    ],
  ],
)}
${G.alerte(
  'La deuxième crise',
  `<p style="margin-bottom:0">La faute la plus fréquente n’est pas commise pendant le pic,
elle est commise <strong>huit minutes après</strong>. La personne redescend, l’adulte
estime que «&nbsp;maintenant ça va&nbsp;», et remet la demande qui a tout déclenché. La
récupération est longue et invisible&nbsp;: quelqu’un qui parle à nouveau normalement
n’est pas revenu à son état de départ. Comptez large — et si vous devez vous tromper,
trompez-vous du côté du temps.</p>`,
)}

<h3 style="${G.H3}">3. Ce que l’adulte ajoute, sans le vouloir</h3>
<p>C’est le cœur de cette formation, et c’est la seule chose sur laquelle vous ayez une
prise directe. On ne contrôle pas une crise&nbsp;; on contrôle ce qu’on y verse. Six
ajouts reviennent presque à chaque fois&nbsp;:</p>
<ul style="${G.UL}">
<li style="${G.LI}"><strong>Les mots.</strong> On explique, on reformule, on répète la
consigne, on argumente. Chaque phrase supplémentaire est une information de plus à traiter
au moment précis où traiter de l’information est devenu difficile.</li>
<li style="${G.LI}"><strong>Les demandes.</strong> «&nbsp;Calme-toi&nbsp;»,
«&nbsp;respire&nbsp;», «&nbsp;regarde-moi&nbsp;», «&nbsp;assieds-toi&nbsp;»,
«&nbsp;dis-moi ce qui ne va pas&nbsp;». Ce sont cinq consignes nouvelles, adressées à
quelqu’un qui n’arrive déjà pas à en traiter une.</li>
<li style="${G.LI}"><strong>Le public.</strong> Un deuxième adulte arrive, puis un
troisième. Le groupe regarde. Une crise devant témoins est plus longue et se termine plus
mal, pour tout le monde — y compris parce qu’il devient difficile de s’arrêter devant les
autres.</li>
<li style="${G.LI}"><strong>La proximité physique.</strong> On se rapproche, on se penche,
on met la main sur l’épaule. Le geste est bienveillant&nbsp;; il est reçu comme une
contrainte de plus.</li>
<li style="${G.LI}"><strong>Les annonces de conséquences.</strong> «&nbsp;Si tu continues,
tu n’auras pas…&nbsp;». Annoncée au pic, une conséquence n’est reliée à rien. Elle ajoute
une menace, et elle oblige l’adulte à tenir ensuite une décision prise en colère.</li>
<li style="${G.LI}"><strong>Le ton.</strong> Le volume monte des deux côtés, presque
mécaniquement. C’est le plus difficile à retenir, et c’est celui qui se travaille le
mieux&nbsp;: il suffit de décider à l’avance qu’on parlera plus bas que d’habitude.</li>
</ul>
<p>Aucun de ces six ajouts n’est une faute morale. Ils sont tous des réflexes normaux,
et la plupart marchent très bien dans une conversation ordinaire. Ils cessent de marcher
exactement au moment où l’on en aurait le plus besoin.</p>

<h3 style="${G.H3}">4. Les trois réductions</h3>
<p>Toute la conduite à tenir pendant la montée et le pic tient en trois mots. Ils
s’apprennent par cœur, parce qu’on ne réfléchit pas sur le moment&nbsp;:</p>
<div style="${G.GRIS}">
<ul style="${G.UL}">
<li style="${G.LI}"><strong>Moins de mots.</strong> Une phrase courte, toujours la même,
dite une fois. Puis le silence. Le silence n’est pas de l’indifférence&nbsp;: c’est ce qui
fait baisser la charge.</li>
<li style="${G.LI}"><strong>Moins de demandes.</strong> Zéro consigne pendant le pic. La
seule exception est la sécurité, et elle se formule en un mot.</li>
<li style="${G.LI}"><strong>Moins de public.</strong> On fait sortir les autres, pas la
personne. C’est plus facile, plus rapide, et cela évite un déplacement contraint.</li>
</ul>
</div>
<p>Et une quatrième chose, qui n’est pas une réduction mais qui les tient toutes&nbsp;:
<strong>on reste.</strong> Rester à distance, visible, disponible, sans parler et sans
demander, est une position active — même si elle donne à l’adulte l’impression pénible de
ne rien faire.</p>
${G.exemple(
  'La phrase unique, et pourquoi elle est écrite à l’avance',
  `<p>Une seule phrase, préparée à froid, dite une fois puis répétée seulement si la
personne la sollicite&nbsp;: «&nbsp;Je suis là. On attend.&nbsp;» «&nbsp;Je reste, tu as
le temps.&nbsp;» «&nbsp;C’est fini quand tu veux, je bouge pas.&nbsp;»</p>
<p style="margin-bottom:0">Écrite d’avance, elle sort telle quelle. Improvisée, elle
devient «&nbsp;bon, ça suffit maintenant&nbsp;» — et personne n’a choisi de dire
ça.</p>`,
)}

<h3 style="${G.H3}">5. La sécurité passe avant le reste, et les limites sont absolues</h3>
<p>Rien de ce qui précède ne vaut contre l’intégrité physique de qui que ce soit. S’il y a
un danger réel — pour la personne, pour un autre, pour vous —, la conduite à tenir est
celle du protocole de votre établissement, et à domicile c’est&nbsp;: mettre les autres à
l’abri, retirer ce qui blesse, appeler.</p>
<p>Trois choses ne sont jamais des techniques éducatives, quelle que soit la
situation&nbsp;:</p>
<ul style="${G.UL}">
<li style="${G.LI}"><strong>La contrainte physique</strong> — tenir, immobiliser,
plaquer. Elle blesse, et elle a tué. Elle ne s’improvise pas, elle ne s’apprend pas dans
un texte, et elle n’est jamais une réponse à un comportement qui gêne.</li>
<li style="${G.LI}"><strong>L’enfermement</strong> — mettre dans une pièce et tenir la
porte, ou l’enfermer. Une pièce au calme où l’on peut aller <em>et d’où l’on peut
sortir</em> est autre chose, et cette différence est toute la différence.</li>
<li style="${G.LI}"><strong>La privation</strong> — de repas, d’eau, de sortie, de visite,
de doudou, de moyen de communication. Retirer à quelqu’un son moyen de communiquer parce
qu’il l’a mal employé est la mesure la plus contre-productive du métier.</li>
</ul>
<p>Quand un comportement sert à <em>échapper à une tâche</em>, la fermeté se joue sur la
tâche&nbsp;: on la raccourcit, on l’aide, on la découpe, on la reporte. Jamais sur le
corps de la personne.</p>

<h3 style="${G.H3}">6. Ce que cette formation ne fait pas</h3>
<p>Elle n’arrête pas les crises, et elle ne le promet nulle part. Ce qu’elle produit, quand
elle est appliquée, est plus modeste et plus utile&nbsp;: des crises où l’adulte n’ajoute
rien, une récupération plus courte, un relevé qui montre ce qui revient, et un écrit qui
tient devant une équipe.</p>
<p>La disparition d’un comportement, elle, passe par autre chose&nbsp;: comprendre à quoi
il sert et enseigner un moyen d’obtenir la même chose. C’est l’objet de deux autres
parcours du catalogue, et le module&nbsp;4 vous dira quand y aller.</p>`,
  aRetenir:
    'Vous ne contrôlez pas une crise. Vous contrôlez <strong>ce que vous y ajoutez</strong>&nbsp;: des mots, des demandes, du public, de la proximité, des menaces, du volume. Les trois réductions — moins de mots, moins de demandes, moins de public — sont la seule technique de ce module, et elle se décide à froid.',
  exercice: {
    nom: 'Décrire au lieu de qualifier',
    duree: '10 minutes',
    quoi:
      'On prend une crise réelle, récente, et on la réécrit en termes observables. C’est le matériau de tout le parcours.',
    etapes: [
      'Choisissez une crise des quinze derniers jours. Une seule, et plutôt une ordinaire qu’une exceptionnelle.',
      'Écrivez-la en quatre éléments : l’heure, ce qui précédait dans les deux minutes, ce qui s’est produit (des verbes, pas des adjectifs), la durée approximative.',
      'Relisez : si votre texte contient « crise », « ingérable », « n’importe quoi », « gros », remplacez chaque mot par ce que vous avez vu.',
      'Passez en revue les six ajouts du point 3, et cochez ceux qui étaient présents. Il y en a presque toujours au moins trois.',
      'Écrivez, en une phrase, celui des six que vous vous engagez à retirer en premier. Un seul.',
    ],
    reussi:
      'votre texte tient en cinq lignes, ne contient aucun jugement, et vous avez coché au moins trois ajouts et entouré celui que vous retirez en premier.',
  },
  carnet: {
    intro:
      'Ouvrez une page — carnet, feuille, notes du téléphone. Quatre lignes pour ce module.',
    lignes: [
      '<strong>Ma crise décrite</strong> — heure, avant, ce qui s’est produit, durée.',
      '<strong>Les ajouts présents</strong> — parmi les six.',
      '<strong>Celui que je retire en premier</strong> — un seul, et le plus facile pour vous.',
      '<strong>Ma phrase unique</strong> — écrite mot pour mot, celle que je dirai la prochaine fois.',
    ],
  },
  vigilance: [
    '<strong>Retirer un ajout, ce n’est pas devenir indifférent.</strong> On reste, on est visible, on est disponible. C’est le contraire de sortir de la pièce.',
    '<strong>Ne testez pas les trois réductions un jour où vous êtes seul avec un groupe entier.</strong> Choisissez un moment où un collègue peut prendre le reste.',
    '<strong>Une crise nouvelle chez quelqu’un qui n’en faisait pas se signale à un médecin</strong> avant toute analyse éducative. Douleur dentaire, otite, constipation, règles douloureuses : ce sont des causes fréquentes et régulièrement manquées.',
    '<strong>Si vous vous surprenez à crier</strong>, ce n’est pas une faute morale, c’est une information : ce moment est trop chargé pour être tenu seul. Cela se dit en réunion, et cela s’organise.',
  ],
  annexes:
    'la <strong>carte de poche des trois réductions</strong> à découper, le <strong>tableau « décrire au lieu de qualifier »</strong>, et la <strong>fiche des limites absolues</strong> à afficher en salle d’équipe.',
  avant: [
    'J’ai décrit une crise réelle en quatre éléments, sans aucun mot de jugement.',
    'Je peux citer les six ajouts, et j’ai coché ceux qui étaient présents chez moi.',
    'J’ai écrit ma phrase unique mot pour mot.',
  ],
};

/* ── MODULE 2 ────────────────────────────────────────────────────────────── */

const M2 = {
  reperes: {
    minutes: 10,
    prerequis: 'le module 1 — les quatre temps, les six ajouts, les trois réductions.',
    evaluation:
      'votre propre scène réécrite, avec les ajouts identifiés minute par minute.',
  },
  objectifs: [
    'Repérer, dans une scène ordinaire, le moment exact où elle bascule',
    'Identifier les ajouts de l’adulte à mesure qu’ils arrivent',
    'Distinguer ce qui relevait du « avant » de ce qui relevait du pic',
    'Comprendre pourquoi la deuxième crise a été plus dure que la première',
    'Transposer l’analyse à une scène qui se passe à la maison',
  ],
  corps: `<h3 style="${G.H3}">1. Le goûter de Sofiane</h3>
<p>Quatorze minutes, trois adultes, aucune faute grossière. Lisez, puis arrêtez-vous.</p>

<div style="${G.GRIS}">
<p><em>Une MECS. Sofiane a 11&nbsp;ans. Il est arrivé il y a cinq mois. Le goûter est à
16&nbsp;h&nbsp;30, dans la cuisine collective.</em></p>
<p><em>16&nbsp;h&nbsp;28. Sofiane entre, ouvre le placard, prend le paquet de gâteaux
entier et s’assoit avec.</em></p>
<p><em>«&nbsp;Sofiane, on partage, tu prends deux gâteaux et tu remets le paquet.&nbsp;»
Il ne répond pas, garde le paquet contre lui. L’éducatrice répète, plus fort&nbsp;:
«&nbsp;Sofiane. Le paquet.&nbsp;» Il serre le paquet.</em></p>
<p><em>Elle avance et tend la main. «&nbsp;Tu me le donnes, s’il te plaît.&nbsp;» Il se
lève d’un coup, la chaise tombe. «&nbsp;Tu me lâches&nbsp;!&nbsp;»</em></p>
<p><em>Un collègue entre&nbsp;: «&nbsp;Qu’est-ce qui se passe encore&nbsp;?&nbsp;» Les
quatre autres jeunes se sont retournés. Sofiane jette le paquet contre le mur et crie.
Il crie deux minutes, debout, sans bouger de sa place.</em></p>
<p><em>«&nbsp;Si tu ne te calmes pas tout de suite, il n’y a pas de sortie
samedi.&nbsp;»</em></p>
<p><em>Il donne un coup de pied dans la chaise tombée, sort de la cuisine et va dans le
couloir. Il s’assoit contre le radiateur. Le volume baisse. Cela dure quatre minutes.</em></p>
<p><em>16&nbsp;h&nbsp;42, l’éducatrice le rejoint&nbsp;: «&nbsp;Bon. Tu vas me ramasser
la chaise et tu vas t’excuser auprès du groupe.&nbsp;»</em></p>
<p><em>Sofiane se relève et donne un coup de poing dans la porte. La deuxième crise dure
neuf minutes. Le poignet est enflé le soir. Dans le cahier&nbsp;: «&nbsp;grosse crise au
goûter, refus de partager, a tapé dans la porte.&nbsp;»</em></p>
</div>

<h3 style="${G.H3}">2. Arrêtez-vous ici — cinq minutes, de quoi écrire</h3>
<p>Ne cherchez pas ce qu’il fallait faire. Cherchez <strong>ce qui a été ajouté</strong>,
et à quelle minute. Il y en a sept.</p>

${G.FILET}

<h3 style="${G.H3}">3. Les ajouts, dans l’ordre</h3>
${A.tableau(
  ['Moment', 'Ce qui est ajouté', 'Ce que ça produit'],
  [
    [
      '16 h 28, la consigne',
      'Deux consignes en une phrase&nbsp;: «&nbsp;prends deux gâteaux&nbsp;» <em>et</em> «&nbsp;remets le paquet&nbsp;».',
      'Une consigne double est une consigne qui échoue à moitié. Ici elle échoue en entier, parce que la seconde partie est justement celle qu’il ne veut pas faire.',
    ],
    [
      'La répétition, plus fort',
      'Du volume, et une deuxième demande identique.',
      'Le volume monte des deux côtés. La deuxième demande n’apporte aucune information nouvelle&nbsp;: elle ajoute de la pression.',
    ],
    [
      'La main tendue',
      'De la proximité physique, et un geste vers l’objet.',
      'C’est la bascule. Tendre la main vers ce que quelqu’un serre contre lui est reçu comme une prise, pas comme une demande.',
    ],
    [
      'L’arrivée du collègue',
      'Un deuxième adulte, et une question ouverte au pire moment.',
      '«&nbsp;Qu’est-ce qui se passe encore&nbsp;?&nbsp;» ajoute un public, un jugement («&nbsp;encore&nbsp;») et une question à laquelle personne ne peut répondre à ce moment-là.',
    ],
    [
      'Le groupe qui regarde',
      'Quatre témoins.',
      'Il devient très difficile de redescendre devant les autres. La crise se prolonge pour cette seule raison.',
    ],
    [
      'La menace de la sortie',
      'Une conséquence annoncée pendant le pic.',
      'Elle n’est reliée à rien pour lui, et elle engage l’adulte à tenir samedi une décision prise en dix secondes de tension. Dans les faits, elle sera soit appliquée injustement, soit oubliée — et les deux coûtent.',
    ],
    [
      '16 h 42, la reprise',
      'Deux demandes nouvelles, quatre minutes après le pic&nbsp;: ramasser, et s’excuser devant le groupe.',
      'C’est ce qui déclenche la deuxième crise. Quatre minutes de silence ne sont pas une récupération, et «&nbsp;s’excuser devant le groupe&nbsp;» est exactement la demande la plus coûteuse au moment le plus fragile.',
    ],
  ],
)}
${G.alerte(
  'La blessure est arrivée à la deuxième crise, pas à la première',
  `<p style="margin-bottom:0">C’est le fait le plus important de la scène, et le plus
facile à manquer. La première crise s’était terminée&nbsp;: il était sorti seul, il
s’était assis, le volume baissait. C’est la reprise à 16&nbsp;h&nbsp;42 qui a produit le
coup de poing. Une seule règle en sort, et elle vaut pour tout ce parcours&nbsp;:
<strong>ne rien redemander tant que la personne n’a pas retrouvé son état de
départ</strong> — et cet état revient bien plus tard que le calme apparent.</p>`,
)}

<h3 style="${G.H3}">4. Ce qui était possible, et quand</h3>
<p>Presque tout se jouait <strong>avant</strong> 16&nbsp;h&nbsp;30, et rien pendant le
pic.</p>
<ul style="${G.UL}">
<li style="${G.LI}"><strong>Avant.</strong> Un garçon arrivé il y a cinq mois qui prend le
paquet entier n’est pas en train de défier le groupe&nbsp;: il assure. La question posée en
réunion — «&nbsp;est-ce qu’il a assez mangé aujourd’hui&nbsp;?&nbsp;», «&nbsp;est-ce que le
goûter a une forme prévisible&nbsp;?&nbsp;» — vaut plus que n’importe quelle technique de
crise. Un goûter servi en portions individuelles supprime la scène entièrement.</li>
<li style="${G.LI}"><strong>À 16 h 28.</strong> Une seule consigne, formulée en positif, et
qui laisse le paquet où il est&nbsp;: «&nbsp;Tu peux prendre deux gâteaux.&nbsp;» Puis
attendre. Le paquet se récupère plus tard, ou pas.</li>
<li style="${G.LI}"><strong>À la montée.</strong> Ne pas avancer, ne pas tendre la main.
Faire sortir les autres, pas lui. Une phrase, une fois.</li>
<li style="${G.LI}"><strong>Au pic.</strong> Rien. Rester visible, à distance, sans parler.
Deux minutes, c’est long&nbsp;; c’est aussi tout ce qu’il y avait à faire.</li>
<li style="${G.LI}"><strong>À la descente.</strong> Le laisser au radiateur. Passer, sans
demander. Proposer de l’eau. La chaise se ramasse plus tard, et éventuellement à deux. La
question des excuses ne se pose pas ce jour-là.</li>
</ul>
<p><strong>La reprise n’est jamais une réparation immédiate.</strong> Ce qui doit être
repris l’est le lendemain, à froid, en une phrase courte&nbsp;: «&nbsp;hier au goûter c’est
parti loin. On regarde comment on fait la prochaine fois.&nbsp;»</p>

<h3 style="${G.H3}">5. Ce que le cahier aurait dû dire</h3>
${A.tableau(
  ['Ce qui a été écrit', 'Pourquoi c’est coûteux', 'Ce qui aurait servi'],
  [
    [
      '«&nbsp;Grosse crise au goûter, refus de partager, a tapé dans la porte.&nbsp;»',
      'Trois qualifications et aucun fait. «&nbsp;Refus de partager&nbsp;» est une interprétation&nbsp;: elle prête une intention, elle suivra le dossier, et elle oriente toutes les lectures suivantes.',
      '«&nbsp;16 h 28&nbsp;: prend le paquet entier et s’assoit avec. Consigne donnée deux fois, puis main tendue vers le paquet&nbsp;; se lève, crie deux minutes, sort dans le couloir. Reprise de la demande à 16 h 42 (ramasser la chaise, s’excuser)&nbsp;: deuxième épisode, neuf minutes, coup de poing dans la porte, poignet enflé le soir — vu par l’infirmière. À reprendre en réunion&nbsp;: la forme du goûter.&nbsp;»',
    ],
  ],
)}
<p>Le second texte est plus long de trois lignes. Il permet, lui, de repérer un mois plus
tard que <em>les épisodes graves sont ceux où l’on a redemandé quelque chose trop tôt</em>
— ce qu’aucun «&nbsp;grosse crise&nbsp;» ne permettra jamais de voir.</p>

<h3 style="${G.H3}">6. Et à la maison — la même scène, sans collègue</h3>
<p>À domicile, quatre des sept ajouts disparaissent d’eux-mêmes (pas de collègue, pas de
groupe), et deux deviennent beaucoup plus difficiles à retenir.</p>
<div style="${G.GRIS}">
<p style="margin-top:0"><em>La tablette, 19&nbsp;h&nbsp;10. «&nbsp;C’est fini,
maintenant.&nbsp;» Refus. On répète. On tend la main vers la tablette. Cri. La petite sœur
arrive dans le couloir et regarde. «&nbsp;Si tu continues, demain il n’y a pas de
tablette du tout.&nbsp;»</em></p>
<p style="margin-bottom:0"><em>La même scène, à trois personnes au lieu de huit.</em></p>
</div>
<ul style="${G.UL}">
<li style="${G.LI}"><strong>Le public existe aussi à la maison&nbsp;:</strong> c’est la
fratrie. On la fait sortir, gentiment, sans en faire un événement.</li>
<li style="${G.LI}"><strong>Le ton est plus dur à tenir chez soi</strong>, parce qu’on est
fatigué et que personne ne prend le relais. C’est une raison de plus d’avoir une phrase
écrite&nbsp;: elle tient quand la patience ne tient plus.</li>
<li style="${G.LI}"><strong>La menace sort presque toujours à la maison</strong>, et elle
engage pour le lendemain. Décidez à froid que vous n’annoncerez <em>aucune</em>
conséquence pendant une crise. Ce qui doit être décidé le sera le lendemain, au calme, et
tiendra mieux.</li>
<li style="${G.LI}"><strong>Le «&nbsp;avant&nbsp;» est plus facile à changer chez
soi&nbsp;:</strong> une minuterie visible, un dernier épisode annoncé, la fin posée sur un
repère de la journée plutôt que sur votre décision. Trois quarts des scènes de tablette
disparaissent comme ça.</li>
</ul>
<p>Et une chose qui n’appartient qu’à la maison&nbsp;: <strong>vous n’avez pas de
relève.</strong> Si une crise vous a mis à bout, cela se dit — à l’autre parent, au
service qui accompagne, au médecin. Ce n’est pas un aveu d’échec, c’est ce qui évite la
soirée où l’on ajoute tout ce que ce module demande de retirer.</p>`,
  aRetenir:
    'Presque tout se joue <strong>avant</strong> et <strong>après</strong>, presque rien pendant. Dans cette scène, la blessure n’arrive pas au pic&nbsp;: elle arrive à la reprise, quatre minutes plus tard, quand on a redemandé quelque chose à quelqu’un qui n’était pas revenu.',
  exercice: {
    nom: 'Votre scène, minute par minute',
    duree: '12 minutes',
    quoi: 'On refait l’analyse sur la crise que vous avez décrite au module 1.',
    etapes: [
      'Reprenez votre description du module 1 et découpez-la en moments, comme le tableau du point 3. Un moment par ligne.',
      'En face de chaque moment, écrivez ce que VOUS avez ajouté : mots, demande, public, proximité, menace, volume. Écrivez « rien » quand il n’y a rien, cela arrive.',
      'Entourez le moment de bascule — celui après lequel plus rien de ce que vous disiez n’a été entendu.',
      'Y a-t-il eu une reprise trop tôt ? Si oui, notez combien de minutes s’étaient écoulées. Si non, notez combien vous avez attendu : c’est votre repère.',
      'Écrivez la version « avant » : qu’est-ce qui, dans les deux heures précédentes, rendait cette crise plus probable ? Fatigue, faim, bruit, changement, tâche difficile, douleur.',
    ],
    reussi:
      'chaque moment porte un ajout ou un « rien », le moment de bascule est entouré, et vous avez écrit au moins un élément du « avant ».',
  },
  carnet: {
    intro: 'Quatre lignes de plus sur la page du module 1.',
    lignes: [
      '<strong>Mon moment de bascule</strong> — et ce que j’avais ajouté juste avant.',
      '<strong>Ma reprise</strong> — au bout de combien de minutes, et ce que j’ai redemandé.',
      '<strong>Le « avant »</strong> — ce qui rendait cette crise plus probable.',
      '<strong>Ma phrase de cahier refaite</strong> — des faits, un horaire, une durée.',
    ],
  },
  vigilance: [
    '<strong>Cette scène n’accuse personne.</strong> L’éducatrice de Sofiane fait ce que presque tout le monde fait, et son intention est bonne à chaque ligne. Ce qui manquait est une conduite décidée à froid.',
    '<strong>Ne cherchez pas la faute, cherchez l’ajout.</strong> La différence n’est pas de la politesse : « j’ai été mauvaise » ne se corrige pas, « j’ai tendu la main vers l’objet » se corrige demain.',
    '<strong>Un coup porté à un mur ou à une porte est une information médicale</strong>, pas seulement éducative. Le poignet se regarde le soir même.',
    '<strong>Ne réécrivez jamais un écrit déjà versé au dossier pour le rendre plus flatteur.</strong> On complète, on date, on signe — on ne réécrit pas l’histoire.',
  ],
  annexes:
    'la <strong>scène de Sofiane corrigée</strong> minute par minute, la <strong>grille des sept ajouts</strong> à passer sur votre propre scène, et le <strong>tableau des phrases de cahier</strong> (faits contre qualifications).',
  avant: [
    'Ma scène est découpée en moments, et chaque moment porte un ajout ou un « rien ».',
    'J’ai entouré mon moment de bascule.',
    'J’ai écrit au moins un élément du « avant » — ce qui rendait la crise plus probable.',
  ],
};

/* ── MODULE 3 ────────────────────────────────────────────────────────────── */

const M3 = {
  reperes: {
    minutes: 12,
    apres:
      'dix jours de relevé, une minute par jour, sans rien changer d’autre. Le module&nbsp;4 se lit le dixième jour.',
    prerequis: 'les modules 1 et 2, et une scène analysée minute par minute.',
    evaluation: 'votre fiche « à froid » écrite, en cinq lignes, et affichée.',
  },
  objectifs: [
    'Écrire les signes de montée propres à UNE personne, pas les signes en général',
    'Décider à froid ce que vous ferez de moins, et ce que vous direz — une fois',
    'Fixer la limite de sécurité, en un mot, avant d’en avoir besoin',
    'Écrire la règle de reprise : quand, par qui, et quoi',
    'Rendre la fiche applicable par quelqu’un qui n’était pas dans la réunion',
  ],
  corps: `<h3 style="${G.H3}">1. Cinq lignes, et elles suffisent</h3>
<p>Un protocole de trois pages n’est pas appliqué&nbsp;: il est rangé. Ce qui s’applique à
16&nbsp;h&nbsp;30 un vendredi, c’est ce qui tient sur une feuille et se lit en trente
secondes.</p>
<div style="${G.GRIS}">
<ol style="${G.UL}">
<li style="${G.LI}"><strong>Les signes</strong> — ce qui se voit chez <em>cette</em>
personne, une à deux minutes avant.</li>
<li style="${G.LI}"><strong>Ce que je fais de moins</strong> — un ou deux ajouts retirés,
pas six.</li>
<li style="${G.LI}"><strong>Ma phrase</strong> — une seule, mot pour mot, dite une fois.</li>
<li style="${G.LI}"><strong>La limite de sécurité</strong> — ce qui déclenche autre chose,
et quoi exactement.</li>
<li style="${G.LI}"><strong>La reprise</strong> — dans combien de temps, par qui, et ce
qu’on redemande (souvent&nbsp;: rien, aujourd’hui).</li>
</ol>
</div>
<p>Cinq lignes, une feuille, un endroit où elle est réellement visible. En institution&nbsp;:
le classeur de l’unité, et une copie là où la scène se passe. À la maison&nbsp;: à
l’intérieur d’une porte de placard.</p>

<h3 style="${G.H3}">2. Ligne 1 — les signes de CETTE personne</h3>
<p>Les listes générales de signes ne servent à rien&nbsp;: chacun a les siens, et ce sont
souvent des détails que seuls les proches voient.</p>
${A.tableau(
  ['Catégorie', 'Exemples réellement relevés', 'Ce qu’on écrit'],
  [
    [
      'La voix',
      'Débit qui accélère, ton qui devient plat, silence brusque chez quelqu’un qui parle beaucoup.',
      '«&nbsp;Il arrête de parler d’un coup.&nbsp;»',
    ],
    [
      'Le corps',
      'Balancement, main qui frotte la cuisse, mâchoire, pieds qui tapent, se lève et se rassoit.',
      '«&nbsp;Elle frotte sa cuisse avec la paume.&nbsp;»',
    ],
    [
      'Le déplacement',
      'Fait un tour de la pièce, va vers la porte, se met dos au mur, se rapproche d’un adulte précis.',
      '«&nbsp;Il va se mettre dos au mur près de la fenêtre.&nbsp;»',
    ],
    [
      'Le langage',
      'Question répétée, phrase toute faite qui revient, «&nbsp;j’en ai marre&nbsp;» dit trois fois.',
      '«&nbsp;Il demande trois fois l’heure.&nbsp;»',
    ],
  ],
)}
<p><strong>Deux à quatre signes suffisent</strong>, et ils s’écrivent au présent, avec des
verbes. Si vous n’en connaissez aucun, c’est normal — c’est justement ce que le relevé du
module&nbsp;4 va vous donner. Écrivez alors&nbsp;: «&nbsp;à compléter&nbsp;», et la fiche
reste valable.</p>
${G.exemple(
  'Le signe le plus utile est presque toujours le plus banal',
  `<p style="margin-bottom:0">Dans les équipes qui font ce travail, le signe qui finit par
servir n’est pas spectaculaire&nbsp;: c’est «&nbsp;il ne finit pas son verre&nbsp;»,
«&nbsp;elle garde son manteau&nbsp;», «&nbsp;il s’assoit à une autre place&nbsp;». Ces
détails-là ne sont jamais dans une liste générale, et ils donnent deux minutes
d’avance.</p>`,
)}

<h3 style="${G.H3}">3. Ligne 2 — ce que je fais de moins</h3>
<p>Un ou deux ajouts retirés, pas les six. Un adulte qui essaie de tout changer d’un coup
ne change rien et se décourage en trois jours.</p>
<p>Choisissez celui qui vous coûte le moins&nbsp;: si vous parlez beaucoup, commencez par
les mots. Si vous vous approchez toujours, commencez par la distance. Et écrivez-le
<strong>en positif et concrètement</strong>, sinon rien ne se passe&nbsp;:</p>
${A.tableau(
  ['Écrit ainsi, ça ne s’applique pas', 'Écrit ainsi, ça s’applique'],
  [
    ['Rester calme', 'Je parle moins fort qu’elle, toujours.'],
    ['Ne pas trop parler', 'Je dis ma phrase une fois. Ensuite je me tais jusqu’à ce que le volume baisse.'],
    ['Éviter de le braquer', 'Je reste à deux mètres et je ne tends pas la main vers ce qu’il tient.'],
    ['Gérer le groupe', 'Je fais sortir les autres. Lui, il reste où il est.'],
    ['Ne pas céder', 'Je ne redemande rien pendant la crise. La tâche est reprise plus tard, raccourcie.'],
  ],
)}
${G.alerte(
  'Où passe exactement la fermeté',
  `<p style="margin-bottom:0">«&nbsp;Ne pas céder&nbsp;» est une intention, pas une
conduite — et mal comprise, elle devient dangereuse. Elle ne porte <strong>jamais</strong>
sur le corps de la personne&nbsp;: on ne retient personne, on n’enferme personne, on ne
prive personne. Quand un comportement sert à échapper à une tâche, la fermeté porte
<strong>sur la tâche</strong>&nbsp;: elle sera reprise, plus tard, plus courte, avec de
l’aide. C’est cela, ne pas céder.</p>`,
)}

<h3 style="${G.H3}">4. Ligne 3 — la phrase, écrite mot pour mot</h3>
<p>Une seule, courte, neutre, dite une fois. Elle dit trois choses&nbsp;: <strong>je
reste</strong>, <strong>je ne demande rien</strong>, <strong>il n’y a pas d’urgence</strong>.</p>
<div style="${G.GRIS}">
<p style="margin-top:0"><em>«&nbsp;Je suis là. On attend.&nbsp;»</em></p>
<p style="margin:10px 0 0"><em>«&nbsp;Je reste. Tu as le temps.&nbsp;»</em></p>
<p style="margin:10px 0 0"><em>«&nbsp;Je bouge pas. Quand tu veux.&nbsp;»</em></p>
<p style="margin-bottom:0"><em>«&nbsp;C’est bon. Personne te demande rien.&nbsp;»</em></p>
</div>
<p>Ce qu’elle ne contient pas&nbsp;: aucune consigne («&nbsp;calme-toi&nbsp;»), aucune
question («&nbsp;qu’est-ce qui se passe&nbsp;?&nbsp;»), aucune condition («&nbsp;si tu te
calmes, alors…&nbsp;»), aucun jugement («&nbsp;on ne fait pas ça&nbsp;»). Prononcée une
fois, elle n’est pas répétée&nbsp;: le silence qui suit fait partie de la phrase.</p>
<p><strong>Écrivez-la avec vos mots à vous.</strong> Une phrase empruntée sonne faux, et
une phrase qui sonne faux ne sortira pas.</p>

<h3 style="${G.H3}">5. Ligne 4 — la limite de sécurité, décidée maintenant</h3>
<p>C’est la ligne qu’on n’a pas envie d’écrire, et c’est celle qui protège tout le monde —
la personne d’abord. Décidée à froid, elle évite deux erreurs symétriques&nbsp;: intervenir
trop tôt sur un comportement qui n’était dangereux pour personne, et ne rien faire quand ça
l’est devenu.</p>
<p>Elle se formule en deux morceaux&nbsp;: <strong>ce qui déclenche</strong> et
<strong>ce qu’on fait alors</strong>, précisément.</p>
<div style="${G.GRIS}">
<p style="margin-top:0"><em>«&nbsp;Si un objet est lancé vers quelqu’un, ou s’il se blesse
la tête&nbsp;: je fais sortir tout le monde de la pièce, j’écarte ce qui peut blesser, et
j’appelle [nom / poste]. Je n’interviens pas physiquement seul.&nbsp;»</em></p>
<p style="margin-bottom:0"><em>À la maison&nbsp;: «&nbsp;Si elle se cogne la tête&nbsp;: je
mets un coussin entre elle et le mur, je fais sortir sa sœur, je n’essaie pas de la tenir.
Si ça ne s’arrête pas ou s’il y a une plaie&nbsp;: le 15.&nbsp;»</em></p>
</div>
<ul style="${G.UL}">
<li style="${G.LI}"><strong>Modifier l’environnement plutôt que la personne&nbsp;:</strong>
écarter les objets, ouvrir un passage, faire sortir les autres. Ce sont des gestes qui ne
touchent personne.</li>
<li style="${G.LI}"><strong>Ce que ce parcours n’enseigne pas&nbsp;:</strong> aucune prise,
aucun maintien, aucun portage. Si votre cadre de travail prévoit une intervention physique,
elle est écrite dans le protocole de votre établissement et elle s’apprend en présentiel,
avec mise en situation et réévaluation.</li>
<li style="${G.LI}"><strong>Ce qui se déclare&nbsp;:</strong> toute blessure, à qui que ce
soit, se consigne le jour même et se signale selon la procédure de la structure. Un
poignet enflé le soir n’est pas un détail.</li>
</ul>

<h3 style="${G.H3}">6. Ligne 5 — la reprise</h3>
<p>La ligne oubliée dans neuf plans sur dix, et c’est celle qui a produit la blessure de
Sofiane. Elle contient trois choses&nbsp;:</p>
<ul style="${G.UL}">
<li style="${G.LI}"><strong>Combien de temps&nbsp;?</strong> Une durée écrite, pas
«&nbsp;quand il sera calme&nbsp;». Le calme apparent revient bien avant l’état de départ.
Commencez par vingt à trente minutes, et corrigez avec votre relevé.</li>
<li style="${G.LI}"><strong>Par qui&nbsp;?</strong> Si possible, pas la personne qui était
au cœur de la scène — pas parce qu’elle a mal fait, mais parce qu’elle fait partie du
décor de la crise.</li>
<li style="${G.LI}"><strong>Quoi&nbsp;?</strong> Le plus souvent, rien aujourd’hui. Une
présence, de l’eau, une activité facile. Ce qui doit être repris (ramasser, réparer,
reparler) se fait le lendemain, en une phrase courte et sans public.</li>
</ul>
<div style="${G.GRIS}">
<p style="margin:0"><strong>Modèle&nbsp;:</strong> <em>«&nbsp;Pas de demande pendant
trente minutes après la fin. C’est [prénom] qui reprend contact, pas moi. On propose de
l’eau et on ne parle pas de ce qui vient de se passer. La chaise se ramasse demain, à deux,
sans le groupe.&nbsp;»</em></p>
</div>

<h3 style="${G.H3}">7. Ce que vous devez avoir sur votre feuille en sortant</h3>
<div style="${G.GRIS}">
<ul style="${G.UL}">
<li style="${G.LI}">Deux à quatre signes, écrits avec des verbes (ou «&nbsp;à
compléter&nbsp;»).</li>
<li style="${G.LI}">Un ou deux ajouts retirés, formulés en conduite concrète.</li>
<li style="${G.LI}">Une phrase, mot pour mot, avec vos mots.</li>
<li style="${G.LI}">Une limite de sécurité en deux morceaux.</li>
<li style="${G.LI}">Une règle de reprise avec une durée, un nom et un contenu.</li>
</ul>
</div>
<p><strong>Le test&nbsp;:</strong> donnez la feuille à quelqu’un qui n’était pas là. S’il
peut l’appliquer sans vous poser de question, elle est bonne. C’est le même test que pour
un remplaçant qui arrive un samedi matin — et c’est précisément ce jour-là qu’elle
servira.</p>`,
  aRetenir:
    'Une conduite de crise ne s’improvise pas et ne s’écrit pas pendant. Cinq lignes décidées à froid — signes, ce que je retire, ma phrase, la limite de sécurité, la reprise — valent mieux que trois pages que personne n’ouvrira.',
  exercice: {
    nom: 'La fiche à froid',
    duree: '15 minutes',
    quoi: 'On écrit la feuille, en entier, pour une personne précise. Pas « en général ».',
    etapes: [
      'Ligne 1 : écrivez deux à quatre signes que VOUS avez déjà vus chez cette personne, avec des verbes. Si vous n’en avez aucun, écrivez « à compléter » : le relevé les donnera.',
      'Ligne 2 : parmi les six ajouts du module 1, choisissez-en un — deux au maximum — et écrivez-le en conduite concrète, à la première personne.',
      'Ligne 3 : écrivez votre phrase, mot pour mot, avec vos mots. Relisez-la à voix haute : si elle sonne faux, elle ne sortira pas.',
      'Ligne 4 : écrivez la limite de sécurité en deux morceaux — ce qui déclenche, ce que je fais alors. Nommez la personne à appeler.',
      'Ligne 5 : écrivez la reprise — une durée en minutes, un nom, et ce qu’on redemande aujourd’hui (souvent : rien).',
      'Affichez la feuille là où la scène se passe, et donnez-la à lire à une personne qui n’était pas dans la réunion.',
    ],
    reussi:
      'les cinq lignes sont écrites, la feuille est affichée quelque part, et quelqu’un d’autre que vous l’a lue et n’a pas eu de question à poser.',
  },
  carnet: {
    intro: 'La feuille EST le livrable. Recopiez-la au propre dans votre carnet.',
    lignes: [
      '<strong>Mes signes</strong> — deux à quatre, avec des verbes.',
      '<strong>Ce que je retire</strong> — un ou deux, en conduite concrète.',
      '<strong>Ma phrase</strong> — mot pour mot.',
      '<strong>Ma limite de sécurité</strong> — le déclencheur, et ce que je fais.',
      '<strong>Ma reprise</strong> — durée, qui, quoi.',
    ],
  },
  vigilance: [
    '<strong>Une fiche écrite pour « les crises » ne sert à personne.</strong> Elle s’écrit pour une personne, avec ses signes à elle. Deux personnes du même groupe ont deux fiches différentes.',
    '<strong>Ne changez qu’un ajout à la fois.</strong> Retirer les six d’un coup, c’est n’en retirer aucun et conclure au bout de trois jours que « ça ne marche pas ».',
    '<strong>La fiche se relit à froid, pas au moment où ça monte.</strong> Elle sert si elle a été lue trois fois quand tout allait bien.',
    '<strong>En établissement, elle se présente en réunion.</strong> Une conduite tenue par une seule personne de l’équipe produit des réponses différentes selon qui est là — ce qui est exactement ce qu’on cherchait à éviter.',
  ],
  annexes:
    'le <strong>gabarit de la fiche à froid</strong> en cinq lignes, la <strong>banque de signes de montée</strong> par catégorie, les <strong>modèles de phrase unique</strong>, et le <strong>tableau « écrit ainsi, ça s’applique »</strong>.',
  avant: [
    'Mes cinq lignes sont écrites et la feuille est affichée quelque part.',
    'Ma ligne 2 est une conduite concrète à la première personne, pas une intention.',
    'Quelqu’un qui n’était pas dans la réunion a lu la fiche sans avoir de question à poser.',
  ],
  pause: {
    jours: 'dix jours',
    texte: `<p>Votre fiche est écrite&nbsp;: elle s’applique maintenant, et elle se relève
pendant <strong>dix jours</strong>. Le module&nbsp;4 se lit le dixième jour, le relevé sous
les yeux.</p>
<p>Dix jours parce qu’en dessous, une semaine calme ou une semaine difficile suffit à faire
croire n’importe quoi. Une minute de relevé après chaque épisode, et rien les jours sans
épisode — c’est la mesure la moins coûteuse du catalogue, et souvent la plus utile.</p>
<p style="margin-bottom:0">Date de lancement&nbsp;: …… / …… &nbsp;·&nbsp; date de
lecture&nbsp;: …… / …… .</p>`,
  },
};

/* ── MODULE 4 ────────────────────────────────────────────────────────────── */

const M4 = {
  reperes: {
    minutes: 12,
    prerequis: 'les modules 1 à 3, et une fiche à froid affichée.',
    evaluation: 'la lecture de votre relevé au dixième jour, et la décision qui suit.',
  },
  objectifs: [
    'Tenir un relevé de crise en cinq colonnes, sans qu’il devienne un travail',
    'Lire ce relevé et repérer ce qui revient — ou constater qu’il n’y a pas de motif',
    'Mesurer la seule chose qui dépend de vous : ce que vous avez ajouté',
    'Écrire après une crise un texte qui tient devant une équipe et devant un dossier',
    'Savoir quand cette compétence ne suffit plus, et vers quoi aller',
  ],
  corps: `<h3 style="${G.H3}">1. Le relevé, en cinq colonnes</h3>
<p>Il se remplit <strong>après</strong>, jamais pendant, et il prend une minute. Les jours
sans épisode, il n’y a rien à écrire — et c’est une donnée aussi, gardez la ligne
vide.</p>
${A.tableau(
  ['Colonne', 'Ce qu’on y met', 'Pourquoi elle est là'],
  [
    ['<strong>1. Quand</strong>', 'Date et heure, à cinq minutes près.', 'Les horaires se répètent bien plus souvent qu’on ne le croit. C’est la colonne qui donne les résultats les plus rapides.'],
    ['<strong>2. Avant</strong>', 'Ce qui se passait dans les deux minutes, et l’état du jour&nbsp;: mal dormi, malade, retour de week-end, changement d’adulte, bruit.', 'Sans l’état du jour, deux épisodes identiques paraissent inexplicables alors qu’ils ne le sont pas.'],
    ['<strong>3. Ce qui s’est produit</strong>', 'Des verbes, une durée approximative du pic.', 'C’est ce qui remplace « grosse crise ». La durée permet de comparer.'],
    ['<strong>4. Ce que j’ai ajouté</strong>', 'Parmi les six&nbsp;: mots, demandes, public, proximité, menace, volume. Ou «&nbsp;rien&nbsp;».', 'La seule colonne qui porte sur ce que vous maîtrisez. C’est elle qui progresse en premier.'],
    ['<strong>5. Après</strong>', 'Combien de temps avant de redemander quelque chose, et ce qui s’est passé ensuite.', 'C’est la colonne qui a manqué à l’équipe de Sofiane. Elle révèle les deuxièmes crises.'],
  ],
)}
${G.alerte(
  'Un relevé qui devient un travail est un relevé qui s’arrête',
  `<p style="margin-bottom:0">Cinq colonnes, une minute, une ligne par épisode. Pas de
tableau à quinze colonnes, pas de grille «&nbsp;émotions&nbsp;» à cocher, pas d’échelle
d’intensité de 1 à 10 — une intensité cotée à chaud varie surtout selon la fatigue de celui
qui cote. Si le relevé prend plus d’une minute, il sera tenu quatre jours.</p>`,
)}

<h3 style="${G.H3}">2. Trois règles pendant les dix jours</h3>
<ul style="${G.UL}">
<li style="${G.LI}"><strong>On ne change rien d’autre.</strong> C’est frustrant, et c’est
la condition pour que le relevé veuille dire quelque chose. Si trois choses changent en
même temps, on ne saura jamais laquelle a compté.</li>
<li style="${G.LI}"><strong>On remplit après, au calme</strong>, pas pendant. Un adulte qui
note pendant une crise est un adulte qui ne fait pas les trois réductions.</li>
<li style="${G.LI}"><strong>On écrit aussi les jours où ça s’est bien passé.</strong> Une
ligne&nbsp;: «&nbsp;rien&nbsp;». Un relevé qui ne contient que des mauvais jours donne
l’impression que tout va mal, ce qui est presque toujours faux et décourage l’équipe.</li>
</ul>

<h3 style="${G.H3}">3. La lecture du dixième jour, en quatre questions</h3>
${SCH_LECTURE6}
<p>Feuille en main, pas de mémoire. La mémoire garde les deux pires épisodes et efface les
sept autres.</p>

<h4 style="margin:26px 0 8px">Question 1 — Est-ce que quelque chose revient ?</h4>
<p>Regardez la colonne 1 puis la colonne 2. Cherchez un horaire, un moment de la journée,
un jour de la semaine, une personne, un lieu, une transition. Trois occurrences sur dix
jours suffisent à mériter un essai&nbsp;; ce n’est pas une preuve, c’est une piste.</p>
${A.tableau(
  ['Ce que montre le relevé', 'Ce que ça suggère', 'L’essai qui suit'],
  [
    [
      'Trois épisodes sur quatre entre 11 h 30 et 12 h.',
      'Faim, attente, ou une transition mal balisée.',
      'Décaler ou baliser ce moment&nbsp;: collation, repère visuel, annonce cinq minutes avant.',
    ],
    [
      'Les épisodes suivent presque tous une demande de tâche.',
      'Le comportement sert probablement à échapper à quelque chose.',
      'Alléger, découper ou aider la tâche — et enseigner un moyen de demander une pause.',
    ],
    [
      'Les épisodes suivent presque tous un refus ou un «&nbsp;non&nbsp;».',
      'Le comportement obtient probablement quelque chose.',
      'Rendre l’attente visible, apprendre à demander autrement, tenir la même réponse d’un adulte à l’autre.',
    ],
    [
      'Aucun motif&nbsp;: les épisodes sont dispersés.',
      'Soit le relevé est trop court, soit la cause est ailleurs (douleur, sommeil, événement extérieur).',
      'Continuer dix jours de plus, et parler du sommeil et de la douleur avec un médecin.',
    ],
  ],
)}

<h4 style="margin:26px 0 8px">Question 2 — Qu’est-ce que j’ai ajouté, et est-ce que ça baisse ?</h4>
<p>Comptez les épisodes où la colonne 4 dit «&nbsp;rien&nbsp;», semaine 1 puis semaine 2.
Deux nombres. C’est la mesure de <em>votre</em> progression, et c’est la seule que vous
puissiez faire bouger seul.</p>
<p>Si le nombre monte, même de un&nbsp;: c’est un résultat, et il compte. Si tous vos
épisodes portent encore trois ajouts, ce n’est pas un échec — c’est que vous en avez retiré
un seul, ce qui était la consigne.</p>

<h4 style="margin:26px 0 8px">Question 3 — Combien de temps ai-je attendu avant de redemander ?</h4>
<p>Colonne 5. Écrivez le délai le plus court et le plus long. Puis regardez&nbsp;: les
épisodes qui ont eu une <strong>suite</strong> — deuxième crise, blessure, objet cassé —
sont-ils du côté des délais courts&nbsp;?</p>
<p>Dans la plupart des relevés, la réponse est oui, et c’est la découverte la plus utile de
ce parcours. Elle donne une consigne d’équipe immédiate&nbsp;: <em>on augmente le délai de
reprise</em>. C’est une décision gratuite, qui ne demande aucun moyen supplémentaire.</p>

<h4 style="margin:26px 0 8px">Question 4 — Est-ce que la durée du pic bouge ?</h4>
<p>Moyenne semaine 1, moyenne semaine 2, en minutes approximatives. Attention&nbsp;: cette
colonne bouge lentement et dépend de beaucoup de choses. <strong>Ne concluez rien sur dix
jours si elle est la seule à ne pas avoir bougé</strong> — les colonnes 4 et 5 sont vos
indicateurs, pas celle-ci.</p>

<h3 style="${G.H3}">4. Écrire après une crise</h3>
<p>Ce que vous écrivez le soir sera lu par une équipe, parfois par une famille, parfois par
un juge, et il restera plus longtemps que vous dans la vie de cette personne. Quatre règles
tiennent tout&nbsp;:</p>
<ul style="${G.UL}">
<li style="${G.LI}"><strong>Des faits, dans l’ordre, avec des horaires.</strong> Ce qui se
voit et s’entend.</li>
<li style="${G.LI}"><strong>Ce que les adultes ont fait aussi.</strong> Un compte rendu où
seule la personne agit est un compte rendu faux&nbsp;: il y avait quelqu’un en face.</li>
<li style="${G.LI}"><strong>Les hypothèses signalées comme telles.</strong>
«&nbsp;Peut-être&nbsp;», «&nbsp;il est possible que&nbsp;», «&nbsp;à vérifier&nbsp;» — et
jamais une intention prêtée&nbsp;: «&nbsp;pour se faire remarquer&nbsp;»,
«&nbsp;volontairement&nbsp;», «&nbsp;il sait très bien ce qu’il fait&nbsp;».</li>
<li style="${G.LI}"><strong>Ce qui a été fait ensuite</strong>, y compris médical&nbsp;:
blessure regardée, appel, signalement. Une blessure non écrite est une blessure qui n’a pas
existé pour l’institution, et cela se retourne contre tout le monde — d’abord contre la
personne.</li>
</ul>
${A.tableau(
  ['À ne pas écrire', 'Pourquoi', 'À écrire'],
  [
    ['Crise de manipulation.', 'Prête une intention et disqualifie tout ce qui suivra.', 'A crié pendant six minutes après le refus. Hypothèse à vérifier&nbsp;: le refus, plutôt que la sortie elle-même.'],
    ['Il est devenu violent sans raison.', '«&nbsp;Sans raison&nbsp;» signifie «&nbsp;je n’ai pas trouvé la raison&nbsp;». Ce n’est pas la même phrase.', 'Je n’ai pas identifié ce qui a précédé. Relevé en cours depuis le 3.'],
    ['A refusé de s’excuser.', 'Décrit un refus alors que la demande a été faite quatre minutes après un pic.', 'Demande d’excuses formulée quatre minutes après la fin&nbsp;: nouvel épisode. La demande sera reportée au lendemain.'],
    ['Ingérable, comme d’habitude.', 'Aucun fait, un jugement, et une généralisation.', 'Troisième épisode en dix jours, tous entre 11 h 30 et 12 h.'],
  ],
)}

<h3 style="${G.H3}">5. Quand cette compétence ne suffit plus</h3>
<p>Ce parcours travaille ce qui se passe <em>pendant</em> et <em>juste après</em>. Il ne
fait pas disparaître un comportement qui revient, parce que ce n’est pas son objet. Si
votre relevé montre un motif net, la suite est ailleurs&nbsp;:</p>
<ul style="${G.UL}">
<li style="${G.LI}">Les épisodes suivent une demande de tâche, ou un refus, ou un moment
précis → <strong>«&nbsp;Les quatre fonctions d’un comportement&nbsp;»</strong>, pour
identifier ce que le comportement obtient, puis <strong>«&nbsp;Apprendre à demander plutôt
qu’à crier&nbsp;»</strong>, pour enseigner un moyen d’obtenir la même chose.</li>
<li style="${G.LI}">Les épisodes suivent les changements et les imprévus →
<strong>«&nbsp;Rendre l’environnement prévisible&nbsp;»</strong>.</li>
<li style="${G.LI}">Les épisodes suivent une tâche trop difficile →
<strong>«&nbsp;Décomposer une routine en étapes&nbsp;»</strong> et
<strong>«&nbsp;Guider puis s’effacer&nbsp;»</strong>.</li>
</ul>
<p>Et trois situations où l’on ne continue pas seul, quel que soit le relevé&nbsp;: une
crise nouvelle chez quelqu’un qui n’en faisait pas, des blessures qui apparaissent, ou une
équipe qui ne tient plus. Ce sont des raisons de demander un appui — médecin, équipe
mobile, service ressource — pas des raisons de mieux s’organiser.</p>`,
  aRetenir:
    'La colonne qui compte n’est pas la durée du pic&nbsp;: c’est <strong>ce que vous avez ajouté</strong> et <strong>combien de temps vous avez attendu avant de redemander</strong>. Ce sont les deux seules choses qui dépendent de vous, et ce sont celles qui bougent en dix jours.',
  exercice: {
    nom: 'La lecture du dixième jour',
    duree: '12 minutes, le relevé sous les yeux',
    quoi: 'Feuille en main. La mémoire garde les deux pires épisodes et efface les autres.',
    etapes: [
      'Comptez les épisodes. Écrivez le nombre, et le nombre de jours sans épisode.',
      'Colonnes 1 et 2 : cherchez ce qui revient. Écrivez ce que vous trouvez, ou « rien de net » — c’est une réponse valable.',
      'Colonne 4 : comptez les « rien » en semaine 1, puis en semaine 2. Deux nombres.',
      'Colonne 5 : écrivez le délai de reprise le plus court et le plus long, puis regardez si les épisodes qui ont eu une suite sont du côté des délais courts.',
      'Écrivez UNE décision pour les dix jours suivants, et une date à laquelle vous la vérifierez.',
      'Réécrivez enfin l’un de vos comptes rendus avec les quatre règles du point 4, et comparez-le à l’original.',
    ],
    reussi:
      'vous avez cinq nombres, une décision écrite, une date, et un compte rendu réécrit que vous accepteriez de faire lire à la famille.',
  },
  carnet: {
    intro: 'Les dernières lignes du carnet. Elles constituent votre bilan.',
    lignes: [
      '<strong>Nombre d’épisodes</strong> — et nombre de jours sans.',
      '<strong>Ce qui revient</strong> — ou « rien de net ».',
      '<strong>Mes « rien » colonne 4</strong> — semaine 1, semaine 2.',
      '<strong>Mes délais de reprise</strong> — le plus court, le plus long.',
      '<strong>Ma décision et sa date</strong>.',
    ],
  },
  vigilance: [
    '<strong>Ne montrez pas le relevé à la personne concernée comme une pièce à charge.</strong> C’est un outil de travail des adultes. Selon l’âge et la situation, elle peut y participer — mais ce n’est jamais un tableau de fautes affiché.',
    '<strong>Un relevé n’est pas un document d’évaluation</strong> et n’a pas à entrer tel quel dans un dossier. Ce qui entre au dossier est ce que l’équipe a validé.',
    '<strong>Dix jours ne prouvent rien à eux seuls.</strong> Ils donnent une piste, et une piste se vérifie sur dix jours de plus, en ne changeant qu’une chose.',
    '<strong>Si les crises augmentent nettement pendant le relevé</strong>, arrêtez le relevé et parlez-en. Une aggravation n’est pas une donnée à collecter, c’est un signal.',
    '<strong>Aucun plan ne vaut une blessure.</strong> Si tenir la conduite décidée met quelqu’un en danger, on la suspend, on sécurise, et on la revoit à froid.',
  ],
  annexes:
    'le <strong>relevé de crise en cinq colonnes</strong> sur dix jours, la <strong>fiche de lecture du dixième jour</strong>, le <strong>tableau des phrases de compte rendu</strong>, et la <strong>fiche « à qui s’adresser, et quand »</strong>.',
  avant: [
    'J’ai dix jours de relevé, colonnes 4 et 5 comprises.',
    'J’ai compté mes « rien » sur les deux semaines — comptés, pas estimés.',
    'J’ai une décision écrite, datée, et un compte rendu réécrit avec les quatre règles.',
  ],
};

/* ── ANNEXES ─────────────────────────────────────────────────────────────── */

const ANNEXES =
  A.entete('Les premières minutes d’une crise') +
  A.fiche({
    numero: 1,
    titre: 'La carte de poche — les trois réductions',
    quand: 'à recopier sur un bristol, à garder dans la poche de blouse ou sur le frigo.',
    contenu: `<div style="${G.GRIS}">
<p style="margin-top:0;font-size:1.05em"><strong>MOINS DE MOTS</strong> — ma phrase, une
fois. Puis je me tais.</p>
<p style="margin:12px 0 0;font-size:1.05em"><strong>MOINS DE DEMANDES</strong> — zéro
consigne. La seule exception est la sécurité.</p>
<p style="margin:12px 0 0;font-size:1.05em"><strong>MOINS DE PUBLIC</strong> — je fais
sortir les autres, pas la personne.</p>
<p style="margin:16px 0 0"><strong>ET JE RESTE.</strong> Visible, à distance, disponible.
Ne rien faire est une position active.</p>
</div>
<p><strong>Au dos de la carte, les six ajouts</strong>, pour se relire à froid&nbsp;: les
mots · les demandes · le public · la proximité · les menaces · le volume.</p>
<p><strong>Et la ligne qui protège tout le monde&nbsp;:</strong> <em>«&nbsp;Je ne redemande
rien avant …… minutes.&nbsp;»</em> Écrivez votre chiffre. C’est celui qui évite la deuxième
crise.</p>`,
  }) +
  A.fiche({
    numero: 2,
    titre: 'Décrire au lieu de qualifier',
    quand: 'à chaque écrit — cahier de liaison, transmission, rapport, compte rendu.',
    contenu:
      A.tableau(
        ['Ce qu’on écrit spontanément', 'Pourquoi c’est coûteux', 'Ce qui se vérifie'],
        [
          [
            'Il a fait une crise.',
            'Ne dit ni la durée, ni ce qui précédait, ni ce qui s’est produit. Rien n’est comparable d’une fois sur l’autre.',
            'À 11 h 40, après l’annonce de l’annulation de la sortie&nbsp;: a crié environ quatre minutes, debout, sans se déplacer, puis s’est assis contre le mur.',
          ],
          [
            'Elle était ingérable.',
            'Désigne la personne comme le problème, et disqualifie la suite du texte.',
            'A jeté trois objets à portée de main&nbsp;; n’a accepté aucune proposition pendant six à sept minutes.',
          ],
          [
            'Crise de manipulation.',
            'Prête une intention. Une intention prêtée suit le dossier pendant des années.',
            'A crié pendant six minutes après le refus. Hypothèse à vérifier&nbsp;: c’est le refus qui a compté, plutôt que la sortie elle-même.',
          ],
          [
            'Violent sans raison.',
            '«&nbsp;Sans raison&nbsp;» veut dire «&nbsp;je n’ai pas trouvé la raison&nbsp;». Ce n’est pas la même phrase, et la première ferme la recherche.',
            'Je n’ai pas identifié ce qui a précédé. Relevé en cours depuis le 3.',
          ],
          [
            'A refusé de s’excuser.',
            'Décrit un refus, alors que la demande a été faite quatre minutes après un pic.',
            'Demande d’excuses formulée quatre minutes après la fin&nbsp;: nouvel épisode. La demande sera reportée au lendemain.',
          ],
        ],
      ) +
      `<p><strong>Une description utile contient quatre éléments&nbsp;:</strong> un horaire,
ce qui précédait dans les deux minutes, ce qui s’est produit (des verbes), et une durée
approximative. Quatre éléments, deux lignes.</p>`,
  }) +
  A.fiche({
    numero: 3,
    titre: 'Banque de signes de montée — à cocher, puis à préciser',
    quand: 'au moment d’écrire la ligne 1 de la fiche à froid, et à revoir après le relevé.',
    contenu:
      `<p>Cette liste ne s’utilise pas telle quelle&nbsp;: elle sert à retrouver ce que
vous avez déjà vu. Cochez, puis <strong>réécrivez avec vos mots et un verbe</strong>.</p>` +
      A.tableau(
        ['Catégorie', 'À cocher', 'Réécrit pour ma fiche'],
        [
          ['Voix — débit qui accélère', '☐', ''],
          ['Voix — ton qui devient plat', '☐', ''],
          ['Voix — se tait brusquement', '☐', ''],
          ['Corps — balancement, main qui frotte', '☐', ''],
          ['Corps — mâchoire, poings, épaules', '☐', ''],
          ['Corps — se lève et se rassoit', '☐', ''],
          ['Déplacement — fait le tour de la pièce', '☐', ''],
          ['Déplacement — va vers la porte ou vers un mur', '☐', ''],
          ['Déplacement — se rapproche d’un adulte précis', '☐', ''],
          ['Langage — question répétée', '☐', ''],
          ['Langage — phrase toute faite qui revient', '☐', ''],
          ['Habitude — ne finit pas son verre, garde son manteau, change de place', '☐', ''],
          ['Autre, propre à cette personne', '☐', ''],
        ],
      ) +
      `<div style="${G.GRIS}">
<p style="margin:0"><strong>Deux à quatre signes suffisent.</strong> Le plus utile est
presque toujours le plus banal — celui qu’aucune liste générale ne contient et qui donne
deux minutes d’avance.</p>
</div>`,
  }) +
  A.fiche({
    numero: 4,
    titre: 'Le gabarit de la fiche à froid — cinq lignes',
    quand: 'une fois par personne, à afficher là où la scène se passe.',
    contenu: `<div style="${G.GRIS}">
<p style="margin-top:0"><strong>Pour&nbsp;:</strong> ……………………………… &nbsp;·&nbsp;
<strong>écrite le&nbsp;:</strong> …… / …… &nbsp;·&nbsp; <strong>revue le&nbsp;:</strong> …… / ……</p>
<p style="margin:16px 0 0"><strong>1. Les signes</strong> (deux à quatre, avec des
verbes)&nbsp;: ………………………………………………………………………………………………</p>
<p style="margin:16px 0 0"><strong>2. Ce que je fais de moins</strong> (un ou deux, en
conduite concrète, à la première personne)&nbsp;: ……………………………………………………</p>
<p style="margin:16px 0 0"><strong>3. Ma phrase</strong> (mot pour mot, une
fois)&nbsp;: «&nbsp;………………………………………………………………………………&nbsp;»</p>
<p style="margin:16px 0 0"><strong>4. La limite de sécurité</strong> — si
………………………………………, alors ………………………………………, et j’appelle ………………………</p>
<p style="margin:16px 0 0"><strong>5. La reprise</strong> — pas de demande pendant ……
minutes&nbsp;; c’est ……………………… qui reprend contact&nbsp;; aujourd’hui on redemande&nbsp;:
………………………</p>
</div>
<h4 style="margin:30px 0 8px">Le test de la fiche</h4>
<p>Donnez-la à quelqu’un qui n’était pas dans la réunion. S’il peut l’appliquer sans vous
poser de question, elle est bonne. C’est le même test que pour un remplaçant qui arrive un
samedi matin — et c’est exactement ce jour-là qu’elle servira.</p>
<h4 style="margin:30px 0 8px">Ce qui n’a pas sa place sur cette fiche</h4>
<ul style="${G.UL}">
<li style="${G.LI}">Aucun geste d’intervention physique. Il relève du protocole de
l’établissement et d’une formation en présentiel.</li>
<li style="${G.LI}">Aucune sanction prévue à l’avance. Une conséquence se décide à froid,
après, et pas dans une fiche de conduite de crise.</li>
<li style="${G.LI}">Aucun diagnostic, aucune explication psychologique. La fiche dit ce
qu’on fait, pas ce qu’on croit.</li>
</ul>`,
  }) +
  A.fiche({
    numero: 5,
    titre: 'La phrase unique, et les conduites qui s’appliquent',
    quand: 'au moment d’écrire les lignes 2 et 3.',
    contenu:
      `<h4 style="margin:0 0 8px">Modèles de phrase</h4>
<div style="${G.GRIS}">
<p style="margin-top:0"><em>«&nbsp;Je suis là. On attend.&nbsp;»</em></p>
<p style="margin:10px 0 0"><em>«&nbsp;Je reste. Tu as le temps.&nbsp;»</em></p>
<p style="margin:10px 0 0"><em>«&nbsp;Je bouge pas. Quand tu veux.&nbsp;»</em></p>
<p style="margin:10px 0 0"><em>«&nbsp;C’est bon. Personne te demande rien.&nbsp;»</em></p>
<p style="margin-bottom:0"><em>«&nbsp;Je m’assois là. Je t’attends.&nbsp;»</em></p>
</div>
<p>Elle dit trois choses&nbsp;: <strong>je reste</strong>, <strong>je ne demande
rien</strong>, <strong>il n’y a pas d’urgence</strong>. Elle ne contient ni consigne, ni
question, ni condition, ni jugement. Elle est dite une fois&nbsp;; le silence qui suit fait
partie de la phrase.</p>
<h4 style="margin:30px 0 8px">Écrire une conduite qui s’applique</h4>` +
      A.tableau(
        ['Écrit ainsi, ça ne s’applique pas', 'Écrit ainsi, ça s’applique'],
        [
          ['Rester calme', 'Je parle moins fort qu’elle, toujours.'],
          ['Ne pas trop parler', 'Je dis ma phrase une fois. Ensuite je me tais jusqu’à ce que le volume baisse.'],
          ['Éviter de le braquer', 'Je reste à deux mètres et je ne tends pas la main vers ce qu’il tient.'],
          ['Gérer le groupe', 'Je fais sortir les autres. Lui, il reste où il est.'],
          ['Ne pas céder', 'Je ne redemande rien pendant la crise. La tâche est reprise plus tard, plus courte, avec de l’aide.'],
          ['Être ferme', 'Je ne change pas la règle, et je ne la répète pas non plus. Elle se redit demain, au calme.'],
        ],
      ) +
      `<p><strong>Une conduite s’écrit à la première personne, au présent, et se filme.</strong>
Si on ne peut pas dire à quoi elle ressemblerait sur une vidéo, elle n’est pas encore
écrite.</p>`,
  }) +
  A.fiche({
    numero: 6,
    titre: 'Les limites absolues — à afficher en salle d’équipe',
    quand: 'en permanence. Cette fiche ne se range pas.',
    contenu: `<div style="${G.ALERTE}">
<p style="margin-top:0"><strong>Trois choses ne sont jamais des techniques éducatives,
quelle que soit la situation&nbsp;:</strong></p>
<ul style="${G.UL}">
<li style="${G.LI}"><strong>La contrainte physique</strong> — tenir, immobiliser, plaquer,
porter de force. Elle blesse, et elle a tué. Elle ne s’improvise pas et ne s’apprend pas
dans un texte.</li>
<li style="${G.LI}"><strong>L’enfermement</strong> — mettre dans une pièce et tenir la
porte, ou fermer à clé. Une pièce au calme où l’on peut aller <em>et d’où l’on peut
sortir</em> est une tout autre chose.</li>
<li style="${G.LI}"><strong>La privation</strong> — de repas, d’eau, de sortie, de visite,
d’objet de réconfort, de moyen de communication. Retirer son moyen de communiquer à
quelqu’un parce qu’il l’a mal employé est la mesure la plus contre-productive du
métier.</li>
</ul>
<p style="margin-bottom:0"><strong>Où passe la fermeté&nbsp;:</strong> quand un
comportement sert à échapper à une tâche, la fermeté porte sur <strong>la tâche</strong> —
elle sera reprise, plus tard, plus courte, avec de l’aide. Jamais sur le corps de la
personne.</p>
</div>
<h4 style="margin:30px 0 8px">Ce qui reste possible, et qui ne touche personne</h4>
<ul style="${G.UL}">
<li style="${G.LI}">Écarter les objets qui peuvent blesser.</li>
<li style="${G.LI}">Faire sortir les autres personnes de la pièce.</li>
<li style="${G.LI}">Ouvrir un passage, dégager une porte, éteindre une source de bruit ou
de lumière.</li>
<li style="${G.LI}">Poser un coussin entre une tête et un mur.</li>
<li style="${G.LI}">Appeler du renfort, appeler le 15.</li>
</ul>
<h4 style="margin:30px 0 8px">Et si votre cadre prévoit une intervention physique</h4>
<p>Alors elle est écrite dans le protocole de votre établissement, elle a été apprise en
présentiel avec mise en situation, elle est réévaluée, et chaque usage est consigné et
déclaré. Rien de tout cela ne s’apprend dans une mini-formation gratuite — et une formation
qui prétendrait le contraire serait à fuir.</p>
<div style="${G.GRIS}">
<p style="margin:0"><strong>Aucun plan ne vaut une blessure.</strong> Si tenir la conduite
décidée met quelqu’un en danger, on la suspend, on sécurise, et on la revoit à froid.</p>
</div>`,
  }) +
  A.fiche({
    numero: 7,
    titre: 'La scène de Sofiane, corrigée minute par minute',
    quand: 'comme modèle, à côté de votre propre scène.',
    contenu:
      `<p>Même situation, même personne, même goûter. Ce qui change tient dans la
colonne de droite.</p>` +
      A.tableau(
        ['Moment', 'Ce qui a été fait', 'Ce qui aurait pu l’être'],
        [
          [
            '<strong>Avant 16 h 30</strong>',
            'Paquet entier disponible sur la table commune, goûter sans forme fixe.',
            'Goûter servi en portions individuelles, à heure fixe, annoncé cinq minutes avant. La scène disparaît sans qu’aucune technique ne soit nécessaire.',
          ],
          [
            '<strong>16 h 28</strong>',
            '«&nbsp;Tu prends deux gâteaux et tu remets le paquet.&nbsp;» — deux consignes en une.',
            '«&nbsp;Tu peux prendre deux gâteaux.&nbsp;» Une seule consigne, formulée en positif, et le paquet reste où il est. Puis on attend.',
          ],
          [
            '<strong>La répétition</strong>',
            'Même consigne, plus fort.',
            'Rien. On laisse passer dix secondes. Si besoin, la même phrase, au même volume, une seule fois.',
          ],
          [
            '<strong>La main tendue</strong>',
            'Un pas en avant, la main vers le paquet. C’est la bascule.',
            'On ne s’approche pas, on ne tend pas la main vers ce qu’il tient. Le paquet se récupère plus tard, ou pas.',
          ],
          [
            '<strong>L’arrivée du collègue</strong>',
            '«&nbsp;Qu’est-ce qui se passe encore&nbsp;?&nbsp;»',
            'Le collègue emmène les quatre autres jeunes ailleurs sans commentaire. C’est la seule chose utile qu’un deuxième adulte puisse faire à ce moment-là.',
          ],
          [
            '<strong>Le pic (2 min)</strong>',
            'Menace sur la sortie de samedi.',
            'La phrase, une fois&nbsp;: «&nbsp;Je suis là. On attend.&nbsp;» Puis rien. Aucune conséquence n’est annoncée pendant.',
          ],
          [
            '<strong>La descente</strong>',
            'Il sort dans le couloir, s’assoit. Quatre minutes.',
            'Identique — et on le laisse. On passe, on propose de l’eau, on ne parle pas de ce qui vient de se passer.',
          ],
          [
            '<strong>16 h 42, la reprise</strong>',
            '«&nbsp;Tu ramasses la chaise et tu t’excuses auprès du groupe.&nbsp;» → deuxième crise, poignet enflé.',
            'Rien avant trente minutes, et pas par la même personne. La chaise se ramasse plus tard, à deux, sans le groupe. Les excuses ne sont pas la question du jour.',
          ],
          [
            '<strong>Le lendemain</strong>',
            'Rien.',
            '«&nbsp;Hier au goûter, c’est parti loin. On regarde comment on fait la prochaine fois.&nbsp;» Deux minutes, au calme, sans témoin. Et la forme du goûter passe en réunion.',
          ],
        ],
      ) +
      `<div style="${G.GRIS}">
<p style="margin:0"><strong>Le point à retenir&nbsp;:</strong> la blessure n’arrive pas au
pic, elle arrive à la reprise. La première crise s’était terminée toute seule.</p>
</div>`,
  }) +
  A.fiche({
    numero: 8,
    titre: 'Le relevé de crise — dix jours, cinq colonnes',
    quand: 'après chaque épisode, jamais pendant. Une minute.',
    contenu:
      A.tableau(
        [
          'Quand',
          'Avant (2 min + état du jour)',
          'Ce qui s’est produit (verbes + durée du pic)',
          'Ce que j’ai ajouté',
          'Après (délai avant de redemander + suite)',
        ],
        [
          ['', '', '', '', ''], ['', '', '', '', ''], ['', '', '', '', ''],
          ['', '', '', '', ''], ['', '', '', '', ''], ['', '', '', '', ''],
          ['', '', '', '', ''], ['', '', '', '', ''],
        ],
      ) +
      `<p><em>Colonne 4, les six ajouts&nbsp;: mots · demandes · public · proximité ·
menace · volume — ou «&nbsp;rien&nbsp;».</em></p>
<div style="${G.GRIS}">
<p style="margin-top:0"><strong>Les trois règles des dix jours&nbsp;:</strong></p>
<ul style="${G.UL}">
<li style="${G.LI}">On ne change rien d’autre. Sinon on ne saura jamais ce qui a compté.</li>
<li style="${G.LI}">On remplit après, au calme. Noter pendant, c’est ne pas appliquer les
trois réductions.</li>
<li style="${G.LI}">On écrit aussi les jours sans épisode — une ligne, «&nbsp;rien&nbsp;».
Un relevé qui ne contient que des mauvais jours décourage toute une équipe.</li>
</ul>
</div>`,
  }) +
  A.fiche({
    numero: 9,
    titre: 'La lecture du dixième jour — quatre questions',
    quand: 'le dixième jour, le relevé sous les yeux.',
    contenu:
      `<div style="${G.GRIS}">
<p style="margin-top:0"><strong>Mes cinq nombres&nbsp;:</strong></p>
<p style="margin:0">Épisodes&nbsp;: …… &nbsp;·&nbsp; jours sans&nbsp;: …… &nbsp;·&nbsp;
«&nbsp;rien&nbsp;» colonne 4 semaine 1&nbsp;: …… &nbsp;·&nbsp; semaine 2&nbsp;: ……
&nbsp;·&nbsp; délai de reprise le plus court&nbsp;: …… min</p>
</div>` +
      A.tableau(
        ['Ce que montre le relevé', 'Ce que ça suggère', 'La décision qui suit'],
        [
          [
            'Un horaire ou un moment revient (3 fois sur 10 jours ou plus).',
            'Faim, fatigue, attente, transition mal balisée.',
            'Baliser ou déplacer ce moment. Une seule modification, et dix jours de plus.',
          ],
          [
            'Les épisodes suivent une demande de tâche.',
            'Le comportement sert probablement à échapper à quelque chose.',
            'Alléger, découper, aider — et enseigner un moyen de demander une pause. Voir «&nbsp;Apprendre à demander plutôt qu’à crier&nbsp;».',
          ],
          [
            'Les épisodes suivent un refus.',
            'Le comportement obtient probablement quelque chose.',
            'Rendre l’attente visible, tenir la même réponse d’un adulte à l’autre, enseigner une autre demande.',
          ],
          [
            'Les «&nbsp;rien&nbsp;» de la colonne 4 augmentent, même de un.',
            'Vous avez retiré un ajout. C’est le résultat attendu du parcours.',
            'Retirer le deuxième ajout, et dix jours de plus.',
          ],
          [
            'Les épisodes qui ont eu une suite sont ceux où le délai de reprise était court.',
            'C’est la découverte la plus fréquente, et la plus utile.',
            'Augmenter le délai de reprise. Décision gratuite, applicable dès demain, à porter en réunion.',
          ],
          [
            'Rien de net, épisodes dispersés.',
            'Relevé trop court, ou cause ailleurs&nbsp;: douleur, sommeil, événement extérieur.',
            'Dix jours de plus, et parler du sommeil et de la douleur avec un médecin.',
          ],
        ],
      ) +
      `<div style="${G.GRIS}">
<p style="margin-top:0"><strong>Ma décision&nbsp;:</strong> ………………………………………………………</p>
<p style="margin:14px 0 0"><strong>Je la vérifie le&nbsp;:</strong> …… / …… / ……</p>
</div>
<p><strong>La durée du pic n’est pas votre indicateur.</strong> Elle bouge lentement et
dépend de beaucoup de choses. Les colonnes 4 et 5 sont celles qui mesurent votre
travail.</p>`,
  }) +
  A.fiche({
    numero: 10,
    titre: 'Le débriefing d’équipe, en six questions',
    quand: 'à la réunion qui suit un épisode marquant. Quinze minutes, pas plus.',
    contenu:
      `<p>Un débriefing qui commence par «&nbsp;qu’est-ce qu’on fait de lui&nbsp;?&nbsp;»
finit toujours au même endroit. Ces six questions, dans cet ordre, tiennent la
discussion.</p>
<ol style="${G.UL}">
<li style="${G.LI}"><strong>Que s’est-il passé&nbsp;?</strong> Les faits, dans l’ordre,
avec les horaires. Une personne raconte, les autres écoutent jusqu’au bout.</li>
<li style="${G.LI}"><strong>Qu’est-ce qui se passait avant&nbsp;?</strong> Les deux
minutes, et l’état du jour. On cherche, on ne conclut pas.</li>
<li style="${G.LI}"><strong>Qu’est-ce que nous avons ajouté&nbsp;?</strong> Les six ajouts,
passés en revue. Sans reproche&nbsp;: c’est un inventaire, pas un procès.</li>
<li style="${G.LI}"><strong>Au bout de combien de temps avons-nous redemandé quelque
chose&nbsp;?</strong> Presque toujours la question qui débloque.</li>
<li style="${G.LI}"><strong>Y a-t-il eu une blessure, et a-t-elle été consignée et
déclarée&nbsp;?</strong> Cette question se pose à voix haute, à chaque fois.</li>
<li style="${G.LI}"><strong>Qu’est-ce qu’on change, et qui le fait&nbsp;?</strong> Une
seule chose, un nom, une date de revue.</li>
</ol>
${G.alerte(
  'Ce qu’un débriefing ne produit pas',
  `<p style="margin-bottom:0">Ni une sanction décidée à chaud, ni un diagnostic, ni une
demande d’exclusion. Si la discussion glisse vers «&nbsp;il n’a rien à faire ici&nbsp;»,
c’est le signe qu’il manque un appui extérieur à l’équipe — pas qu’il manque une décision.
Une équipe épuisée demande de l’aide&nbsp;; elle ne prend pas de décision d’orientation un
soir de crise.</p>`,
)}
<p><strong>Et une septième question, pour les adultes&nbsp;:</strong> qui a besoin de
souffler&nbsp;? Une crise coûte à celui qui la traverse et à celui qui l’accompagne. Ne pas
le dire ne le fait pas disparaître&nbsp;: cela le reporte sur l’épisode suivant.</p>`,
  }) +
  A.fiche({
    numero: 11,
    titre: 'À qui s’adresser, et quand',
    quand: 'à lire une fois maintenant, pour ne pas le chercher un soir difficile.',
    contenu:
      A.tableau(
        ['Ce que vous constatez', 'Ce que ça demande'],
        [
          [
            'Des crises apparaissent chez quelqu’un qui n’en faisait pas, ou changent nettement de forme.',
            'Un avis médical, avant toute analyse éducative. Douleur dentaire, otite, constipation, règles douloureuses, effet d’un traitement&nbsp;: ce sont des causes fréquentes et régulièrement manquées.',
          ],
          [
            'Des blessures apparaissent — sur la personne, sur un autre, sur vous.',
            'Consignation le jour même, déclaration selon la procédure de la structure, et un point avec l’encadrement. Ce n’est pas négociable et ce n’est pas une question de loyauté envers l’équipe.',
          ],
          [
            'Le relevé montre un motif net (tâche, refus, moment).',
            'Les parcours du catalogue qui travaillent la cause&nbsp;: les quatre fonctions, apprendre à demander, décomposer une routine, rendre l’environnement prévisible.',
          ],
          [
            'L’équipe ne tient plus, ou les réponses diffèrent d’un adulte à l’autre malgré la fiche.',
            'Un appui extérieur&nbsp;: équipe mobile, service ressource, analyse de la pratique. Ce n’est pas un échec de l’équipe&nbsp;: c’est ce à quoi ces dispositifs servent.',
          ],
          [
            'À la maison&nbsp;: vous êtes seul, épuisé, et vous vous surprenez à crier ou à avoir peur.',
            'Cela se dit — à l’autre parent, au service qui accompagne, au médecin traitant. C’est ce qui évite la soirée où tout ce que ce parcours demande de retirer revient d’un coup.',
          ],
        ],
      ) +
      `<p><strong>Aucune de ces lignes n’est un constat d’échec.</strong> Ce sont les
moments où la bonne compétence professionnelle consiste à passer la main, et savoir le
faire au bon moment fait partie du métier.</p>`,
  }) +
  A.pied();

module.exports = {
  slug: 'les-premieres-minutes-d-une-crise',
  uuid: 'bfc03048-f280-41a9-82c2-f0a17d7b6bba',
  modules: [
    { titre: 'Module 1 — Les quatre temps, les six ajouts, les trois réductions', minutes: 12, html: G.assembler(M1) },
    { titre: 'Module 2 — Une scène qui dérape, et la deuxième crise', minutes: 10, html: G.assembler(M2) },
    { titre: 'Module 3 — Exercice guidé : la fiche à froid en cinq lignes', minutes: 12, html: G.assembler(M3) },
    { titre: 'Module 4 — Dix jours de relevé, et ce qu’on écrit après', minutes: 12, html: G.assembler(M4) },
  ],
  annexes: ANNEXES,
};
