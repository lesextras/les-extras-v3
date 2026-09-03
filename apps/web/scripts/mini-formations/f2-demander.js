/**
 * FORMATION 2 — Apprendre à demander plutôt qu'à crier (contenu enrichi v3).
 *
 * Compétence unique : construire et enseigner un comportement de remplacement.
 * Suite logique de la formation 1 : une fois la fonction connue, on donne un
 * autre moyen d'obtenir la même chose.
 *
 * ⚠ Contenu comportemental : l'encart NUANCE_COMPORTEMENTALE est obligatoire
 * en fin de parcours. Ne pas le retirer.
 */

const G = require('./gabarit-v3.js');
const A = require('./annexes.js');

const M1 = {
  reperes: {
    minutes: 12,
    prerequis:
      'savoir nommer la fonction d’un comportement. La formation « Les quatre fonctions d’un comportement » le fait en 39 minutes.',
    evaluation:
      'quiz éclair en fin de module, et le livrable «&nbsp;Mon carnet de séance&nbsp;».',
  },
  objectifs: [
    'Expliquer pourquoi un comportement ne se retire pas, mais se remplace',
    'Vérifier les <strong>trois conditions</strong> sans lesquelles un remplacement échoue',
    'Choisir une forme de demande adaptée au niveau réel de la personne',
    'Anticiper la remontée passagère du comportement en début d’apprentissage',
    'Reconnaître un remplacement qui ne remplace rien',
  ],
  corps: `<h3 style="${G.H3}">1. Retirer sans donner, c’est retirer un outil</h3>
<p>Vous savez maintenant ce que le comportement obtient. La tentation immédiate est de
l’empêcher&nbsp;: ne plus céder, tenir bon, ignorer. Cela peut fonctionner — et cela
laisse la personne sans <em>aucun</em> moyen d’obtenir ce qu’elle cherchait.</p>
<p>Formulons-le crûment&nbsp;: un enfant qui crie pour échapper à une tâche trop dure
n’a pas un problème de comportement, il a un <strong>problème de moyens</strong>. Le
cri est sa seule solution connue. Si on la lui retire sans en installer une autre, il
en trouvera une — et rien ne garantit qu’elle sera plus acceptable. C’est le mécanisme
qui transforme un cri en morsure, puis une morsure en fugue.</p>
<p>La règle tient en une ligne, et c’est la seule de ce module&nbsp;: <strong>on
n’éteint jamais un comportement sans enseigner ce qui le remplace.</strong></p>

<h3 style="${G.H3}">2. Un remplacement, c’est quoi exactement</h3>
<p>Un comportement de remplacement est un comportement qui obtient <strong>exactement
la même chose</strong> que celui qu’on veut voir diminuer. Pas quelque chose de proche
— la même chose.</p>
<div style="${G.GRIS}">
<ul style="${G.UL}">
<li style="${G.LI}">Le cri servait à <em>échapper à la tâche</em> → le remplacement doit
permettre d’obtenir une pause ou de l’aide. Pas un jeton, pas un compliment&nbsp;: une
pause.</li>
<li style="${G.LI}">Le cri servait à <em>obtenir de l’attention</em> → le remplacement
doit faire venir quelqu’un. Un signe, un appel, une carte.</li>
<li style="${G.LI}">Le cri servait à <em>obtenir un objet</em> → le remplacement doit
donner accès à cet objet.</li>
</ul>
</div>
<p>C’est la raison pour laquelle la formation précédente n’est pas facultative&nbsp;:
un remplacement construit sur la mauvaise fonction ne remplace rien, et l’équipe conclut
au bout de trois semaines que «&nbsp;ça n’a pas marché&nbsp;» alors que le plan visait
à côté.</p>

<h3 style="${G.H3}">3. Les trois conditions — et elles sont toutes indispensables</h3>

<h4 style="margin:26px 0 8px">Condition 1 — Plus facile</h4>
<p>Le remplacement doit demander <strong>moins d’effort</strong> que le comportement
problématique. Moins d’effort physique, moins d’effort de langage, moins d’effort
d’organisation. Si demander une pause suppose de construire une phrase complète alors
que crier ne suppose rien, personne ne demandera.</p>
<p>C’est l’erreur la plus fréquente et la plus invisible&nbsp;: on choisit une belle
formule («&nbsp;est-ce que je peux avoir une pause s’il vous plaît&nbsp;?&nbsp;») qui
coûte dix fois plus cher que le cri qu’elle est censée remplacer.</p>

<h4 style="margin:26px 0 8px">Condition 2 — Plus rapide</h4>
<p>Le remplacement doit obtenir le résultat <strong>plus vite</strong>. Si la carte
«&nbsp;pause&nbsp;» met deux minutes à être vue et le cri obtient une réaction en deux
secondes, le cri gagne. Pendant la phase d’apprentissage, on répond à la demande de
remplacement <em>immédiatement</em> — dans les trois secondes, sans discussion, sans
négociation, sans «&nbsp;attends une minute&nbsp;».</p>

<h4 style="margin:26px 0 8px">Condition 3 — Toujours honorée</h4>
<p>Le remplacement doit marcher <strong>à chaque fois</strong>, au début. Une demande
honorée neuf fois sur dix enseigne qu’il faut parfois crier — et un renforcement
intermittent produit des comportements bien plus résistants qu’un renforcement
systématique. C’est contre-intuitif et c’est massivement documenté.</p>

${G.alerte(
  'La condition 3 est celle qui décide, et c’est une décision d’équipe',
  `<p style="margin-bottom:0">Avant de lancer quoi que ce soit, demandez-vous&nbsp;:
<em>«&nbsp;suis-je prêt à honorer cette demande à chaque fois pendant deux
semaines&nbsp;?&nbsp;»</em> Si la réponse est non — parce que l’organisation ne le
permet pas, parce que vous êtes seul avec six jeunes, parce que la pause n’est pas
possible à ce moment-là —, <strong>changez de remplacement</strong>. Ne lancez pas un
plan que vous ne pourrez pas tenir&nbsp;: il produira exactement l’inverse de ce que
vous cherchez.</p>`,
)}

<h3 style="${G.H3}">4. Choisir la forme : ce que la personne peut faire aujourd’hui</h3>
<p>La forme de la demande se choisit au niveau réel, pas au niveau souhaité. Du moins
coûteux au plus coûteux&nbsp;:</p>
${A.tableau(
  ['Forme', 'Quand la choisir', 'Ce qu’il faut préparer'],
  [
    [
      'Un geste simple<br><em>(tendre la main, taper deux fois sur la table)</em>',
      'Aucun langage, ou langage indisponible en situation de tension.',
      'Rien. C’est son avantage décisif&nbsp;: disponible partout, tout de suite.',
    ],
    [
      'Une carte ou une image<br><em>(carte « pause », carte « aide »)</em>',
      'La personne reconnaît les images et peut atteindre la carte.',
      'La carte doit être <strong>à portée de main en permanence</strong>, pas dans un classeur.',
    ],
    [
      'Un mot unique<br><em>(« pause », « aide »)</em>',
      'Le mot est déjà produit spontanément dans d’autres contextes.',
      'Rien, mais vérifier qu’il sort encore en situation de tension.',
    ],
    [
      'Une phrase courte',
      'Le langage est fluide, même en tension.',
      'Une formule fixe, toujours la même, pas une phrase à composer.',
    ],
  ],
)}
<p><strong>On commence toujours un cran en dessous de ce qu’on croit possible.</strong>
Une demande trop coûteuse ne sort pas au moment où elle servirait — c’est-à-dire quand
la personne est déjà en tension. On pourra monter d’un cran plus tard, une fois le
mécanisme installé.</p>

<h3 style="${G.H3}">5. Ce qui va se passer dans les premiers jours</h3>
<p>Deux phénomènes vont survenir, et il faut les connaître à l’avance, sinon on arrête
le plan au moment précis où il commence à marcher.</p>
<ul style="${G.UL}">
<li style="${G.LI}"><strong>Le comportement va d’abord augmenter.</strong> C’est
attendu&nbsp;: ce qui marchait ne marche plus aussi bien, alors la personne essaie plus
fort. Cette remontée dure généralement quelques jours. Si vous cédez pendant cette
phase, vous enseignez qu’il faut insister davantage — et le comportement revient plus
intense qu’avant.</li>
<li style="${G.LI}"><strong>La demande de remplacement va être «&nbsp;sur-utilisée&nbsp;».</strong>
La personne va demander une pause vingt fois par heure. C’est bon signe&nbsp;: elle a
compris. On honore, et on espacera plus tard, une fois le mécanisme solide — jamais
avant.</li>
</ul>`,
  aRetenir:
    'Un remplacement qui n’est pas <strong>plus facile, plus rapide et toujours honoré</strong> que le comportement qu’il vise n’est pas un remplacement&nbsp;: c’est une consigne de plus, et elle sera perdue.',
  exercice: {
    nom: 'Le test des trois conditions',
    duree: '10 minutes',
    quoi:
      'On teste le remplacement AVANT de le lancer. Un plan qui échoue au test échouera sur le terrain, en trois semaines et avec du découragement en prime.',
    etapes: [
      'Écrivez la fonction que vous avez identifiée : attention, échappement, objet, ou sensation. Une seule.',
      'Écrivez le remplacement envisagé, en une phrase : « au lieu de ………, la personne pourra ……… pour obtenir ……… ».',
      'Condition 1 — comparez l’effort. Ce que vous demandez coûte-t-il <em>moins</em> que le comportement actuel ? Si vous hésitez, c’est non : descendez d’un cran dans le tableau des formes.',
      'Condition 2 — comparez la vitesse. Combien de secondes entre la demande et le résultat ? Si c’est plus de trois, dites comment vous allez raccourcir.',
      'Condition 3 — écrivez noir sur blanc : « je m’engage à honorer cette demande à chaque fois pendant deux semaines ». Si vous ne pouvez pas l’écrire, changez de remplacement.',
    ],
    reussi:
      'les trois conditions sont cochées sans « oui mais ». Un « oui mais » sur la condition 3 est une raison suffisante pour tout recommencer.',
  },
  carnet: {
    intro:
      'Ouvrez une page et gardez-la pendant tout le parcours. Ces quatre lignes sont ce que vous présenterez à l’équipe.',
    lignes: [
      '<strong>La fonction identifiée</strong> — une seule des quatre.',
      '<strong>Le remplacement, en une phrase</strong> — au lieu de ………, la personne pourra ……… pour obtenir ……… .',
      '<strong>Les trois conditions</strong> — cochées, ou la raison pour laquelle j’ai changé de remplacement.',
      '<strong>Mon engagement</strong> — la phrase de la condition 3, écrite et datée.',
    ],
  },
  vigilance: [
    '<strong>Un remplacement n’est pas une récompense.</strong> Donner un jeton quand quelqu’un ne crie pas ne remplace rien&nbsp;: le besoin d’échapper à la tâche est toujours là.',
    '<strong>Ne demandez pas la demande au pire moment.</strong> On enseigne la carte « pause » quand tout va bien, pas au milieu d’une crise. En crise, on sécurise&nbsp;; on n’apprend rien.',
    '<strong>Une demande honorée n’est pas une capitulation.</strong> C’est précisément le contraire&nbsp;: c’est ce qui apprend qu’on peut obtenir sans crier. La capitulation, c’est céder au cri.',
    '<strong>Si la tâche est objectivement trop difficile</strong>, aucun remplacement ne tiendra. Réduisez la tâche d’abord — voir «&nbsp;Décomposer une routine en étapes&nbsp;».',
  ],
  annexes:
    'la <strong>fiche des trois conditions</strong> à cocher, le <strong>tableau des formes de demande</strong>, et <strong>trois remplacements corrigés</strong> — dont deux qui ne remplacent rien.',
  avant: [
    'Je sais dire quelle fonction mon remplacement vise, et je l’ai écrite.',
    'Mon remplacement passe les trois conditions sans « oui mais ».',
    'J’ai écrit et daté mon engagement à l’honorer à chaque fois pendant deux semaines.',
  ],
};

const M2 = {
  reperes: {
    minutes: 10,
    prerequis: 'le module 1 — les trois conditions du remplacement.',
    evaluation:
      'votre analyse écrite de la scène, comparée à celle du module.',
  },
  objectifs: [
    'Repérer laquelle des trois conditions a lâché dans une situation réelle',
    'Comprendre pourquoi un plan qui marche pendant dix jours peut s’effondrer le onzième',
    'Identifier ce qui, dans une organisation, rend un remplacement intenable',
    'Formuler une version du plan qui tient avec les moyens réellement disponibles',
  ],
  corps: `<h3 style="${G.H3}">1. Une scène où presque tout a été bien fait</h3>
<p>Celle-ci est plus difficile que la précédente&nbsp;: l’équipe a fait le travail, le
plan était juste, et il a quand même échoué. C’est le cas le plus fréquent, et le plus
décourageant. Lisez, puis arrêtez-vous.</p>

<div style="${G.GRIS}">
<p><em>Une MECS. Noé, 9&nbsp;ans, crie et jette ses affaires au moment des devoirs.
L’équipe a fait l’analyse&nbsp;: sept fois sur huit, les devoirs ont été
interrompus.</em></p>
<p><em>Fonction retenue&nbsp;: échapper aux devoirs. Remplacement choisi&nbsp;: une
carte «&nbsp;pause 5 minutes&nbsp;», posée sur la table. Noé la donne, il obtient cinq
minutes, puis on reprend.</em></p>
<p><em>Semaine 1. Ça marche. Noé utilise la carte huit fois le premier soir, six le
deuxième. Les cris tombent presque à zéro. L’équipe est contente.</em></p>
<p><em>Semaine 2, mardi. Nouvelle organisation&nbsp;: les devoirs passent de
17&nbsp;h&nbsp;30 à 18&nbsp;h&nbsp;15, juste avant le repas. L’éducateur du soir est
seul avec sept jeunes. Noé donne la carte. «&nbsp;Attends deux minutes Noé, je
reviens.&nbsp;» Noé attend. Puis il redonne la carte. «&nbsp;Deux minutes, j’ai
dit.&nbsp;»</em></p>
<p><em>Noé jette son cahier et crie. L’éducateur arrive, les devoirs s’arrêtent.</em></p>
<p><em>Jeudi, Noé ne prend plus la carte. Il crie directement. Vendredi, l’équipe note
en réunion&nbsp;: «&nbsp;la carte pause ne fonctionne pas avec Noé&nbsp;».</em></p>
</div>

<h3 style="${G.H3}">2. Arrêtez-vous ici — cinq minutes, de quoi écrire</h3>
<ul style="${G.UL}">
<li style="${G.LI}">Laquelle des trois conditions a lâché, et quel jour exactement&nbsp;?</li>
<li style="${G.LI}">Qu’est-ce que Noé a appris le mardi soir&nbsp;?</li>
<li style="${G.LI}">La conclusion de la réunion du vendredi est-elle juste&nbsp;?</li>
</ul>

${G.FILET}

<h3 style="${G.H3}">3. L’analyse</h3>
<p><strong>La condition 3 a lâché, le mardi de la semaine 2.</strong> «&nbsp;Attends
deux minutes&nbsp;» est une demande non honorée. Ce n’est pas un refus, ce n’est pas une
faute professionnelle, c’est un délai — et pour un mécanisme qui repose sur
l’immédiateté, un délai est un échec.</p>
<p><strong>Ce que Noé a appris ce soir-là&nbsp;:</strong> «&nbsp;la carte ne marche
pas&nbsp;; crier, si.&nbsp;» Une seule soirée a suffi, parce que le comportement ancien
a été renforcé <em>immédiatement</em> après l’échec du nouveau. C’est la séquence la
plus destructrice qui soit&nbsp;: la demande ignorée, puis le cri récompensé, à trois
minutes d’intervalle.</p>
<p><strong>La conclusion de la réunion est fausse</strong>, et elle est coûteuse. Ce
n’est pas «&nbsp;la carte ne fonctionne pas avec Noé&nbsp;» — elle a fonctionné, on l’a
mesuré pendant une semaine. C’est «&nbsp;l’organisation du soir ne permet pas d’honorer
la carte&nbsp;». La différence est capitale&nbsp;: la première conclusion enterre
l’outil et vise l’enfant, la seconde ouvre une discussion sur le créneau et les moyens.</p>

${G.exemple(
  'Le vrai coupable est un changement d’horaire',
  `<p style="margin-bottom:0">Passer les devoirs de 17&nbsp;h&nbsp;30 à
18&nbsp;h&nbsp;15 a déplacé le moment vers un créneau où un adulte est seul avec sept
jeunes, juste avant le repas. Aucun plan de remplacement ne survit à cela. La question
n’est pas éducative, elle est organisationnelle — et c’est pour cette raison qu’un plan
individuel doit toujours être validé par ceux qui tiennent le planning.</p>`,
)}

<h3 style="${G.H3}">4. La version qui tenait</h3>
<p>Avec un adulte pour sept jeunes à 18&nbsp;h&nbsp;15, la carte «&nbsp;pause
5 minutes accordée par l’adulte&nbsp;» est intenable&nbsp;: elle suppose une
disponibilité qui n’existe pas. Trois options, toutes praticables&nbsp;:</p>
<ul style="${G.UL}">
<li style="${G.LI}"><strong>Rendre la pause auto-servie.</strong> Noé retourne un
carton rouge et va s’asseoir cinq minutes sur une chaise désignée, sans que personne
n’ait à venir. L’adulte valide d’un regard. Coût pour l’éducateur&nbsp;: zéro seconde.</li>
<li style="${G.LI}"><strong>Réduire la tâche plutôt que la fuir.</strong> Trois
exercices au lieu de dix, avec une fin visible. Une tâche qui a une fin ne demande plus
d’échappée.</li>
<li style="${G.LI}"><strong>Revenir au créneau de 17&nbsp;h&nbsp;30</strong>, où deux
adultes sont présents. C’est la solution la plus simple, et c’est celle qu’on ose le
moins proposer parce qu’elle touche au planning et non à l’enfant.</li>
</ul>
<p>Notez que les trois options changent l’<em>environnement</em>. Aucune ne demande à
Noé de faire un effort supplémentaire — il en fait déjà.</p>`,
  aRetenir:
    'Quand un plan de remplacement s’effondre, la question n’est presque jamais «&nbsp;pourquoi la personne n’y arrive pas&nbsp;». C’est <strong>«&nbsp;laquelle des trois conditions avons-nous cessé de tenir, et pourquoi&nbsp;?&nbsp;»</strong>',
  exercice: {
    nom: 'L’audit des trois conditions, sur votre terrain',
    duree: '12 minutes',
    quoi:
      'Avant de lancer votre plan, on cherche par où il va lâcher. C’est plus rapide et bien moins coûteux que de le découvrir en semaine 2.',
    etapes: [
      'Listez les moments de la journée où le comportement se produit. Pour chacun : quelle heure, combien d’adultes présents, quelles autres tâches en cours.',
      'Pour chaque moment, répondez : « puis-je honorer la demande en moins de trois secondes ? » Entourez les moments où la réponse est non.',
      'Sur ces moments-là, trouvez une version <em>auto-servie</em> du remplacement — une version qui ne demande aucune action immédiate de l’adulte.',
      'Vérifiez qui, dans l’organisation, peut faire échouer le plan sans le savoir : le planning, le remplaçant du samedi, la personne qui ne vient qu’en soirée.',
      'Écrivez une phrase pour eux : « quand [la personne] fait ………, ça veut dire ……… , et il faut ……… ». Une phrase, affichée là où ils passent.',
    ],
    reussi:
      'chaque moment de la journée a soit une réponse en moins de trois secondes, soit une version auto-servie — et la phrase pour les autres adultes est écrite et affichée.',
  },
  carnet: {
    intro: 'Ajoutez ces quatre lignes à la page ouverte au module 1.',
    lignes: [
      '<strong>Les moments à risque</strong> — ceux où je ne peux pas répondre en trois secondes.',
      '<strong>La version auto-servie</strong> — ce que la personne peut faire sans attendre personne.',
      '<strong>Qui peut faire échouer le plan sans le savoir</strong> — noms ou fonctions.',
      '<strong>La phrase affichée pour eux</strong> — une seule, recopiée.',
    ],
  },
  vigilance: [
    '<strong>Ne conclure jamais « ça ne marche pas avec lui ».</strong> Cette phrase ferme le sujet et désigne la personne. Cherchez d’abord laquelle des trois conditions a lâché.',
    '<strong>Un plan individuel qui ignore le planning est un plan mort.</strong> Faites-le valider par ceux qui tiennent l’organisation avant de le lancer, pas après.',
    '<strong>Les remplaçants et les week-ends font tomber les plans.</strong> Une phrase affichée vaut mieux qu’un protocole de trois pages que personne ne lira.',
    '<strong>Ne relancez pas un plan à l’identique après un échec.</strong> Corrigez la condition qui a lâché, sinon vous répéterez l’échec — et l’équipe se démobilisera pour de bon.',
  ],
  annexes:
    'la <strong>grille d’audit des moments à risque</strong>, le <strong>modèle de phrase à afficher</strong> pour les autres adultes, et <strong>la scène de Noé corrigée</strong> avec les trois versions praticables.',
  avant: [
    'J’ai listé les moments où je ne peux pas répondre en moins de trois secondes.',
    'J’ai une version auto-servie du remplacement pour ces moments-là.',
    'J’ai écrit la phrase destinée aux autres adultes, et je sais où elle sera affichée.',
  ],
};

const M3 = {
  reperes: {
    minutes: 12,
    prerequis: 'les modules 1 et 2, et une fonction identifiée.',
    evaluation: 'votre plan de remplacement écrit, en six lignes.',
  },
  objectifs: [
    'Écrire un plan de remplacement complet en six lignes',
    'Choisir le moment et la manière d’enseigner la demande — quand tout va bien',
    'Décider à l’avance de la réponse au comportement ancien, pour ne pas l’improviser',
    'Préparer l’espacement, qui viendra bien plus tard',
    'Rendre le plan transmissible à quelqu’un qui n’était pas dans la réunion',
  ],
  corps: `<h3 style="${G.H3}">1. Le plan tient en six lignes — pas une page</h3>
<p>Un protocole de trois pages n’est pas appliqué&nbsp;: il est rangé. Ce qui
s’applique, c’est ce qui tient sur une feuille et se lit en trente secondes par un
remplaçant qui arrive un samedi matin.</p>
<div style="${G.GRIS}">
<ol style="${G.UL}">
<li style="${G.LI}"><strong>Le comportement visé</strong>, en termes observables.</li>
<li style="${G.LI}"><strong>La fonction</strong> — une des quatre.</li>
<li style="${G.LI}"><strong>Le remplacement</strong> — quelle forme, exactement.</li>
<li style="${G.LI}"><strong>Ma réponse à la demande</strong> — quoi, en combien de
secondes.</li>
<li style="${G.LI}"><strong>Ma réponse au comportement ancien</strong> — décidée
maintenant, pas sur le moment.</li>
<li style="${G.LI}"><strong>Ce que je relève</strong> — deux colonnes, pas plus.</li>
</ol>
</div>

<h3 style="${G.H3}">2. Enseigner la demande quand tout va bien</h3>
<p>Voici le contre-sens le plus répandu&nbsp;: attendre que la personne soit en tension
pour lui proposer la carte. En tension, personne n’apprend — ni elle, ni vous. La
demande s’enseigne <strong>à froid</strong>, dans des situations faciles, et plusieurs
fois.</p>
<p>La séquence d’enseignement tient en quatre temps, répétés cinq à dix fois par jour
pendant les premiers jours&nbsp;:</p>
<ul style="${G.UL}">
<li style="${G.LI}"><strong>Créer une petite occasion.</strong> Une tâche facile,
courte, dans un moment calme. Pas la tâche qui pose problème.</li>
<li style="${G.LI}"><strong>Provoquer la demande.</strong> Attendez trois secondes.
Si rien ne vient, guidez discrètement — montrez la carte, orientez la main. Le plus
léger possible.</li>
<li style="${G.LI}"><strong>Honorer immédiatement.</strong> La pause est accordée dans
la seconde, sans commentaire, sans «&nbsp;c’est bien tu as demandé&nbsp;» appuyé — la
récompense, c’est la pause elle-même.</li>
<li style="${G.LI}"><strong>Retirer l’aide, un cran à chaque fois.</strong> Montrer la
carte devient la désigner du regard, puis ne plus rien faire. Le mécanisme de
l’estompage est celui de la formation «&nbsp;Guider puis s’effacer&nbsp;».</li>
</ul>

${G.alerte(
  'Ne piégez pas la personne',
  `<p style="margin-bottom:0">Créer volontairement une frustration pour «&nbsp;faire
travailler&nbsp;» la demande — cacher un objet, imposer une tâche pénible — est à
proscrire. On travaille sur des occasions naturelles, faciles et nombreuses. Une
occasion fabriquée dans la contrariété enseigne surtout que l’adulte est
imprévisible.</p>`,
)}

<h3 style="${G.H3}">3. Décider maintenant de la réponse au comportement ancien</h3>
<p>C’est la ligne 5, et c’est celle qu’on oublie. Si elle n’est pas décidée à froid,
elle sera improvisée à chaud — donc différente selon la personne, l’heure et la
fatigue. Or c’est précisément cette variabilité qui installe les comportements les plus
tenaces.</p>
<p>La réponse, quelle que soit la fonction, suit trois principes&nbsp;:</p>
<ul style="${G.UL}">
<li style="${G.LI}"><strong>Neutre.</strong> Peu de mots, peu d’émotion, pas de
sermon. Un long discours est de l’attention, et il fait durer le moment.</li>
<li style="${G.LI}"><strong>Sans donner ce que le comportement visait</strong>, dans la
mesure du possible et de la sécurité. Si le cri visait la fuite de la tâche, la tâche
reste posée — même réduite, même reportée de deux minutes, mais elle ne disparaît pas.</li>
<li style="${G.LI}"><strong>Suivie d’une occasion de demander correctement.</strong>
Dès que le calme revient, on recrée une occasion facile et on honore. La personne
termine sur une réussite&nbsp;; c’est ce qu’elle retiendra.</li>
</ul>

${G.alerte(
  'La sécurité prime sur le plan, toujours',
  `<p style="margin-bottom:0">Si le comportement met quelqu’un en danger, on protège et
on s’arrange&nbsp;: le plan attendra. Aucun principe éducatif ne passe avant l’intégrité
physique d’une personne, la sienne comprise. Et une situation dangereuse relève d’un
protocole d’établissement, pas d’une décision individuelle.</p>`,
)}

<h3 style="${G.H3}">4. L’espacement — bien plus tard qu’on ne croit</h3>
<p>Une question revient toujours&nbsp;: «&nbsp;on ne va quand même pas accorder une
pause vingt fois par heure pendant des mois&nbsp;?&nbsp;» Non. Mais on ne réduit rien
avant que le mécanisme ne soit solide, et solide veut dire&nbsp;: <strong>la demande est
utilisée à la place du comportement ancien pendant au moins deux semaines
consécutives</strong>.</p>
<p>Ensuite seulement, et un cran à la fois&nbsp;:</p>
<ul style="${G.UL}">
<li style="${G.LI}">on introduit une attente courte et <em>annoncée</em>
(«&nbsp;d’accord, dans une minute&nbsp;» — et on tient la minute)&nbsp;;</li>
<li style="${G.LI}">on allonge très progressivement&nbsp;;</li>
<li style="${G.LI}">on rend l’attente visible — un sablier, un minuteur — pour qu’elle
ne soit pas vécue comme un refus.</li>
</ul>
<p>Au moindre retour du comportement ancien, on revient au cran précédent. Sans drame&nbsp;:
c’est une information, pas une rechute.</p>`,
  aRetenir:
    'La demande s’enseigne <strong>à froid</strong>, dans des situations faciles, cinq à dix fois par jour. Une demande enseignée en pleine crise n’est pas enseignée&nbsp;: elle est subie.',
  exercice: {
    nom: 'Le plan en six lignes',
    duree: '12 minutes',
    quoi:
      'On écrit le plan complet. Il doit tenir sur une feuille et être compréhensible par quelqu’un qui n’était pas dans la réunion.',
    etapes: [
      'Ligne 1 — le comportement visé, en termes observables, sans adjectif.',
      'Ligne 2 — la fonction, une des quatre, avec la proportion qui la soutient (« 7 fois sur 9 »).',
      'Ligne 3 — le remplacement : la forme exacte, et où l’objet se trouve physiquement s’il y en a un.',
      'Ligne 4 — ma réponse à la demande : quoi, et en combien de secondes. Écrivez le nombre.',
      'Ligne 5 — ma réponse au comportement ancien : neutre, sans donner ce qu’il visait, suivie d’une occasion de demander. Trois phrases maximum.',
      'Ligne 6 — ce que je relève : deux colonnes seulement, « demande utilisée » et « comportement ancien ». Une croix par occurrence.',
    ],
    reussi:
      'un collègue qui n’a pas assisté à la réunion peut appliquer votre plan après l’avoir lu une fois. Testez-le vraiment : donnez-le à lire à quelqu’un.',
  },
  carnet: {
    intro:
      'Le plan en six lignes EST le livrable de ce module. Recopiez-le au propre — c’est lui qui sera affiché.',
    lignes: [
      '<strong>Les six lignes du plan</strong>, recopiées au propre.',
      '<strong>La date de lancement</strong> — et celle du bilan, quatorze jours plus tard.',
      '<strong>Le test de lecture</strong> — qui l’a lu, et ce qu’il n’a pas compris du premier coup.',
      '<strong>Où le plan est affiché</strong> — l’endroit exact.',
    ],
  },
  vigilance: [
    '<strong>Six lignes, pas sept.</strong> Chaque ligne ajoutée réduit la probabilité que le plan soit appliqué un vendredi soir.',
    '<strong>La ligne 5 se décide à froid.</strong> Improvisée à chaud, elle sera différente chaque fois — et la variabilité est ce qui installe les comportements les plus résistants.',
    '<strong>N’espacez pas trop tôt.</strong> Deux semaines de demande utilisée à la place du comportement ancien, minimum, avant de réduire quoi que ce soit.',
    '<strong>Le plan se partage avec la personne concernée</strong> quand elle peut le comprendre. Un plan appliqué sur quelqu’un sans qu’il le sache est un plan qu’on n’aimerait pas subir.',
  ],
  annexes:
    'le <strong>plan en six lignes</strong> à remplir, la <strong>séquence d’enseignement en quatre temps</strong>, et <strong>deux plans corrigés</strong> — un bon et un inapplicable.',
  avant: [
    'Mon plan tient en six lignes sur une feuille.',
    'La ligne 5 — ma réponse au comportement ancien — est écrite, pas seulement pensée.',
    'Quelqu’un qui n’était pas dans la réunion l’a lu et a su quoi faire.',
  ],
};

const M4 = {
  reperes: {
    minutes: 12,
    prerequis: 'les modules 1 à 3, et un plan en six lignes prêt à lancer.',
    evaluation:
      'la lecture de votre relevé au quatorzième jour, et la décision que vous en tirez.',
  },
  objectifs: [
    'Tenir un relevé à deux colonnes pendant quatorze jours',
    'Reconnaître la remontée passagère et ne pas arrêter le plan à ce moment-là',
    'Lire deux courbes et savoir laquelle regarder en premier',
    'Décider de la suite : espacer, corriger une condition, ou changer de remplacement',
    'Repérer les signes qu’il faut arrêter et passer la main',
  ],
  corps: `<h3 style="${G.H3}">1. Quatorze jours, deux colonnes, une croix</h3>
<p>Le relevé est volontairement pauvre. Deux colonnes, une croix par occurrence&nbsp;:</p>
${A.tableau(
  ['Jour', 'Demande de remplacement utilisée', 'Comportement ancien'],
  [
    ['J1', '✕ ✕ ✕ ✕ ✕ ✕ ✕ ✕', '✕ ✕ ✕ ✕ ✕ ✕'],
    ['J2', '✕ ✕ ✕ ✕ ✕ ✕', '✕ ✕ ✕ ✕ ✕ ✕ ✕ ✕'],
    ['…', '', ''],
  ],
)}
<p>Trente secondes par jour. Toute grille plus riche sera abandonnée avant le
cinquième jour, et un relevé abandonné ne prouve rien.</p>

<h3 style="${G.H3}">2. La remontée passagère — le moment où l’on arrête à tort</h3>
<p>Dans les premiers jours, la deuxième colonne va <strong>monter</strong>. C’est
attendu, c’est documenté, et c’est le moment exact où la plupart des plans sont
abandonnés.</p>
<p>La raison est simple&nbsp;: ce qui marchait ne marche plus aussi bien, alors la
personne essaie plus fort et plus longtemps. Si vous cédez pendant cette phase, vous
enseignez qu’il faut insister davantage — et le comportement revient plus intense
qu’avant le plan. C’est le scénario le plus coûteux du parcours.</p>

${G.exemple(
  'Ce qu’il faut regarder les cinq premiers jours',
  `<p style="margin-bottom:0">Ne regardez pas la colonne «&nbsp;comportement
ancien&nbsp;» — elle va monter, c’est prévu. Regardez la <strong>première</strong>
colonne&nbsp;: est-ce que la demande apparaît&nbsp;? Une seule fois le premier jour est
déjà une victoire. C’est elle qui dit si le mécanisme s’installe.</p>`,
)}

<h3 style="${G.H3}">3. La lecture du quatorzième jour</h3>
<p>Posez les deux colonnes côte à côte et lisez-les dans cet ordre&nbsp;:</p>
<ul style="${G.UL}">
<li style="${G.LI}"><strong>Colonne 1 (la demande) — monte-t-elle&nbsp;?</strong> Si
oui, quelle que soit la colonne 2, le mécanisme fonctionne. Continuez.</li>
<li style="${G.LI}"><strong>Colonne 2 (le comportement ancien) — après la remontée,
redescend-elle&nbsp;?</strong> On attend une bosse les jours 1 à 4, puis une baisse. Si
la baisse n’arrive pas au bout de deux semaines, une condition a lâché.</li>
<li style="${G.LI}"><strong>Le rapport entre les deux.</strong> Ce qui compte n’est pas
que le comportement ancien disparaisse — c’est qu’il devienne <em>minoritaire</em> par
rapport à la demande. Une personne qui demande quinze fois et crie deux fois a fait un
progrès considérable.</li>
</ul>

<h3 style="${G.H3}">4. Quatre lectures, quatre suites</h3>
${A.tableau(
  ['Ce que disent les colonnes', 'Ce que ça veut dire', 'La suite'],
  [
    [
      'Colonne 1 monte, colonne 2 baisse après une bosse',
      'Le plan fonctionne.',
      'Tenez deux semaines de plus, puis commencez à espacer, un cran à la fois.',
    ],
    [
      'Colonne 1 reste à zéro ou presque',
      'La demande est trop coûteuse, ou elle n’a pas été enseignée à froid.',
      'Descendez d’un cran dans les formes de demande, et enseignez cinq à dix fois par jour dans des situations faciles.',
    ],
    [
      'Colonne 1 monte, colonne 2 ne baisse pas',
      'La demande est utilisée <em>en plus</em> du comportement, pas à sa place — souvent parce que le comportement ancien obtient encore ce qu’il visait.',
      'Reprenez la ligne 5 du plan : que se passe-t-il vraiment après le comportement ancien ?',
    ],
    [
      'Les deux colonnes montent puis tout s’effondre un jour précis',
      'Une condition a lâché ce jour-là. Presque toujours la troisième.',
      'Cherchez ce qui a changé : un horaire, une personne, un remplaçant, une réponse différée.',
    ],
  ],
)}

<h3 style="${G.H3}">5. Transmettre le résultat</h3>
<p>Comme au parcours précédent, ce qui circule doit contenir un nombre. «&nbsp;Ça va
mieux&nbsp;» ne se discute pas et ne se compare pas d’un mois sur l’autre.</p>
<div style="${G.GRIS}">
<p style="margin-bottom:0"><em>«&nbsp;Du 3 au 17 mars, [la personne] a utilisé la carte
pause 84 fois. Le comportement de cri est passé de 6 occurrences par jour la première
semaine à 2 la seconde. Je propose de tenir le plan à l’identique deux semaines de
plus, puis d’introduire une attente annoncée d’une minute.&nbsp;»</em></p>
</div>

${G.alerte(
  'Quand arrêter et passer la main',
  `<ul style="${G.UL}">
<li style="${G.LI}">le comportement blesse la personne ou quelqu’un d’autre&nbsp;;</li>
<li style="${G.LI}">il s’aggrave nettement au-delà de la première semaine&nbsp;;</li>
<li style="${G.LI}">il s’accompagne d’un changement de sommeil, d’appétit ou d’humeur&nbsp;;</li>
<li style="${G.LI}">vous vous sentez seul avec, ou en colère contre la personne.</li>
</ul>
<p style="margin-bottom:0">Dans ces quatre cas, on suspend le plan et on demande un
appui — médical, pluridisciplinaire ou de supervision. Savoir s’arrêter fait partie de
la compétence.</p>`,
)}`,
  aRetenir:
    'Les cinq premiers jours, ne regardez <strong>que la première colonne</strong>. Le comportement ancien va monter — c’est prévu. Ce qui décide, c’est de savoir si la demande apparaît.',
  exercice: {
    nom: 'La lecture du quatorzième jour',
    duree: '10 minutes, le relevé sous les yeux',
    quoi:
      'À faire feuille en main, pas de mémoire : ce qu’on se rappelle de deux semaines et ce que la feuille dit divergent presque toujours.',
    etapes: [
      'Comptez la colonne 1 semaine par semaine. Deux nombres.',
      'Comptez la colonne 2 semaine par semaine. Deux nombres.',
      'Repérez le jour où la colonne 2 a été la plus haute. Notez ce qui s’est passé ce jour-là — c’était probablement la remontée, ou un jour où une condition a lâché.',
      'Placez-vous dans une des quatre lectures du point 4, et écrivez laquelle.',
      'Écrivez la suite en une phrase, avec une date de vérification.',
    ],
    reussi:
      'vous avez quatre nombres, une lecture choisie parmi les quatre, une suite en une phrase et une date. Sans les nombres, l’exercice n’est pas fait.',
  },
  carnet: {
    intro:
      'Ces cinq lignes constituent, telles quelles, ce que vous présenterez en réunion.',
    lignes: [
      '<strong>Colonne 1, semaine 1 et semaine 2</strong> — deux nombres.',
      '<strong>Colonne 2, semaine 1 et semaine 2</strong> — deux nombres.',
      '<strong>Le jour le plus haut</strong> — et ce qui s’est passé ce jour-là.',
      '<strong>La lecture choisie</strong> — une des quatre, et pourquoi.',
      '<strong>La suite et sa date</strong> — une phrase.',
    ],
  },
  vigilance: [
    '<strong>N’arrêtez pas le plan pendant la remontée.</strong> C’est le moment où il commence à agir, et c’est le moment où on l’abandonne le plus souvent.',
    '<strong>Ne changez qu’une chose à la fois.</strong> Modifier la forme de la demande <em>et</em> le moment <em>et</em> la réponse rend le relevé illisible.',
    '<strong>Deux semaines sont un minimum, pas un objectif.</strong> Beaucoup de plans demandent six à huit semaines pour être stables.',
    '<strong>Cette formation ne pose aucun diagnostic.</strong> Elle décrit un mécanisme d’apprentissage valable pour tout le monde, quel que soit le trouble.',
  ],
  annexes:
    'le <strong>relevé à deux colonnes</strong> sur quatorze jours, la <strong>fiche de lecture du quatorzième jour</strong>, et le <strong>tableau des quatre lectures</strong> avec la suite à engager.',
  avant: [
    'J’ai quatorze jours de relevé, ou je sais pourquoi il en manque.',
    'J’ai compté les deux colonnes semaine par semaine — quatre nombres écrits.',
    'J’ai choisi une des quatre lectures et fixé la date de la prochaine vérification.',
  ],
};

/* ── ANNEXES ─────────────────────────────────────────────────────────────── */

const ANNEXES =
  A.entete('Apprendre à demander plutôt qu’à crier') +
  A.fiche({
    numero: 1,
    titre: 'Les trois conditions — à cocher avant de lancer',
    quand: 'avant tout lancement, et à chaque fois qu’un plan s’essouffle.',
    contenu:
      A.tableau(
        ['Condition', 'La question exacte', 'Si la réponse est non'],
        [
          [
            '<strong>1. Plus facile</strong>',
            'Ce que je demande coûte-t-il <em>moins d’effort</em> que le comportement actuel&nbsp;?',
            'Descendez d’un cran&nbsp;: phrase → mot → carte → geste.',
          ],
          [
            '<strong>2. Plus rapide</strong>',
            'Combien de secondes entre la demande et le résultat&nbsp;? (écrivez le nombre)',
            'Rendez la demande auto-servie&nbsp;: la personne obtient sans attendre personne.',
          ],
          [
            '<strong>3. Toujours honorée</strong>',
            'Puis-je l’honorer <em>à chaque fois</em> pendant deux semaines, y compris le samedi et avec un remplaçant&nbsp;?',
            'Changez de remplacement. Ne lancez pas un plan que vous ne tiendrez pas.',
          ],
        ],
      ) +
      `<p><strong>Un «&nbsp;oui mais&nbsp;» sur la condition 3 est une raison suffisante
pour tout recommencer.</strong> C’est elle qui fait échouer la grande majorité des
plans, et jamais pour de mauvaises raisons&nbsp;: un horaire change, un adulte est
seul, un remplaçant ne sait pas.</p>`,
  }) +
  A.fiche({
    numero: 2,
    titre: 'Choisir la forme de la demande',
    quand: 'au moment de décider ce que la personne va faire à la place.',
    contenu:
      A.tableau(
        ['Forme', 'Coût pour la personne', 'Quand la choisir', 'Le piège'],
        [
          [
            'Geste simple (tendre la main, taper deux fois)',
            'Très faible',
            'Aucun langage, ou langage indisponible en tension.',
            'Doit être distinguable des gestes habituels, sinon il passe inaperçu.',
          ],
          [
            'Carte ou image',
            'Faible',
            'La personne reconnaît les images.',
            'La carte doit être <strong>à portée de main en permanence</strong>. Dans un classeur, elle n’existe pas.',
          ],
          [
            'Mot unique',
            'Moyen',
            'Le mot sort déjà spontanément ailleurs.',
            'Un mot disponible au calme peut disparaître en tension.',
          ],
          [
            'Phrase courte',
            'Élevé',
            'Langage fluide, y compris sous tension.',
            'Une phrase à composer coûte trop&nbsp;; fixez une formule unique.',
          ],
        ],
      ) +
      `<p><strong>Règle&nbsp;:</strong> on commence toujours un cran en dessous de ce
qu’on croit possible. On montera plus tard, une fois le mécanisme installé.</p>`,
  }) +
  A.fiche({
    numero: 3,
    titre: 'Le plan en six lignes — à remplir et à afficher',
    quand: 'une fois par plan. C’est le seul document qui sera réellement lu.',
    contenu: `<div style="${G.GRIS}">
<p style="margin:0"><strong>1. Comportement visé</strong> (observable, sans adjectif)&nbsp;:<br>………………………………………………………………………………………………</p>
<p style="margin:14px 0 0"><strong>2. Fonction</strong> (une des quatre) et proportion qui la soutient&nbsp;:<br>……………………………………………… — …… fois sur ……</p>
<p style="margin:14px 0 0"><strong>3. Remplacement</strong> — forme exacte, et où se trouve l’objet&nbsp;:<br>………………………………………………………………………………………………</p>
<p style="margin:14px 0 0"><strong>4. Ma réponse à la demande</strong> — quoi, en combien de secondes&nbsp;:<br>……………………………………………… en …… secondes</p>
<p style="margin:14px 0 0"><strong>5. Ma réponse au comportement ancien</strong> — neutre, sans donner ce qu’il visait, suivie d’une occasion de demander&nbsp;:<br>………………………………………………………………………………………………<br>………………………………………………………………………………………………</p>
<p style="margin:14px 0 0"><strong>6. Ce que je relève</strong> — deux colonnes, une croix par occurrence.</p>
<p style="margin:18px 0 0">Lancé le …… / …… &nbsp;·&nbsp; Bilan le …… / …… &nbsp;·&nbsp; Affiché à&nbsp;: ………………………</p>
</div>
<p><strong>Le test de lecture&nbsp;:</strong> donnez cette feuille à un collègue qui
n’était pas dans la réunion. S’il ne sait pas quoi faire après une lecture, le plan
n’est pas fini.</p>`,
  }) +
  A.fiche({
    numero: 4,
    titre: 'La séquence d’enseignement en quatre temps',
    quand:
      'les premiers jours, cinq à dix fois par jour, dans des situations faciles.',
    contenu: `<ol style="${G.UL}">
<li style="${G.LI}"><strong>Créer une petite occasion</strong> — une tâche facile et
courte, dans un moment calme. <em>Jamais</em> la tâche qui pose problème.</li>
<li style="${G.LI}"><strong>Attendre trois secondes.</strong> Si rien ne vient, guidez
le plus légèrement possible&nbsp;: désigner la carte du regard avant de la montrer,
montrer avant d’orienter la main.</li>
<li style="${G.LI}"><strong>Honorer dans la seconde</strong>, sans commentaire appuyé.
La récompense, c’est la pause — pas le compliment.</li>
<li style="${G.LI}"><strong>Retirer l’aide d’un cran</strong> à chaque répétition.</li>
</ol>
<div style="${G.ALERTE}">
<h3 style="margin-top:0;color:#8a3a2e">À ne pas faire</h3>
<p style="margin-bottom:0">Ne fabriquez pas de frustration pour «&nbsp;faire
travailler&nbsp;» la demande — cacher un objet, imposer une tâche pénible. On travaille
sur des occasions naturelles et faciles. Une occasion fabriquée dans la contrariété
enseigne surtout que l’adulte est imprévisible.</p>
</div>`,
  }) +
  A.fiche({
    numero: 5,
    titre: 'Le relevé à deux colonnes — quatorze jours',
    quand: 'du premier au quatorzième jour, trente secondes par jour.',
    contenu:
      A.tableau(
        ['Jour', 'Demande utilisée', 'Comportement ancien'],
        [
          ['J1', '', ''], ['J2', '', ''], ['J3', '', ''], ['J4', '', ''],
          ['J5', '', ''], ['J6', '', ''], ['J7', '', ''],
          ['<strong>Total S1</strong>', '', ''],
          ['J8', '', ''], ['J9', '', ''], ['J10', '', ''], ['J11', '', ''],
          ['J12', '', ''], ['J13', '', ''], ['J14', '', ''],
          ['<strong>Total S2</strong>', '', ''],
        ],
      ) +
      `<p><strong>Les cinq premiers jours, ne regardez que la colonne du milieu.</strong>
Le comportement ancien va monter&nbsp;: c’est la remontée passagère, elle est attendue.
Ce qui décide, c’est de savoir si la demande apparaît.</p>`,
  }) +
  A.fiche({
    numero: 6,
    titre: 'Trois remplacements corrigés',
    quand: 'vous doutez du vôtre.',
    contenu: `<h4 style="margin:26px 0 8px">A — «&nbsp;Au lieu de crier, il aura un jeton s’il tient dix minutes&nbsp;»</h4>
<p><strong>Ne remplace rien.</strong> Le jeton n’obtient pas ce que le cri obtenait
(échapper à la tâche). La personne se retrouve avec une récompense qui ne résout pas le
problème pour lequel elle criait. Au mieux, ça marche une semaine.</p>

<h4 style="margin:34px 0 8px">B — «&nbsp;Au lieu de crier, elle dira "est-ce que je peux
faire une pause s’il te plaît&nbsp;?"&nbsp;»</h4>
<p><strong>Vise juste, coûte trop.</strong> La fonction est la bonne, mais la forme
échoue à la condition 1&nbsp;: composer une phrase de sept mots en situation de tension
coûte infiniment plus qu’un cri. À remplacer par un mot unique ou une carte.</p>

<h4 style="margin:34px 0 8px">C — «&nbsp;Au lieu de crier, il retourne le carton rouge
posé sur sa table et va s’asseoir cinq minutes sur la chaise près de la fenêtre&nbsp;»</h4>
<p><strong>Tient les trois conditions.</strong> Plus facile qu’un cri (un geste). Plus
rapide (auto-servi, aucune attente). Toujours honoré (aucune disponibilité d’adulte
requise, donc tenable même à 18&nbsp;h&nbsp;15 avec sept jeunes). C’est la forme à
viser chaque fois que l’organisation est tendue.</p>`,
  }) +
  A.pied();

module.exports = {
  slug: 'apprendre-a-demander-plutot-qu-a-crier',
  uuid: '8525da90-543c-424a-bf59-e69f754139c1',
  modules: [
    { titre: 'Module 1', minutes: 12, html: G.assembler(M1) },
    { titre: 'Module 2', minutes: 10, html: G.assembler(M2) },
    { titre: 'Module 3', minutes: 12, html: G.assembler(M3) },
    { titre: 'Module 4', minutes: 12, html: G.assembler(M4) },
  ],
  annexes: ANNEXES,
};
