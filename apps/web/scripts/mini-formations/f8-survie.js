/**
 * F8 — LIRE UN COMPORTEMENT COMME UNE RÉACTION DE SURVIE
 *
 * Compétence : relire un comportement d'un enfant confié comme une stratégie
 * qui a été utile ailleurs, et TRANSFORMER CETTE LECTURE EN UN RÉGLAGE CONCRET
 * du quotidien.
 *
 * ── LE PIÈGE DU SUJET, ET COMMENT IL EST TENU ───────────────────────────────
 * La lecture « c'est le traumatisme » est devenue le lieu commun du secteur, et
 * elle produit trois dégâts bien identifiés : elle explique tout (donc plus
 * rien), elle excuse tout (donc l'enfant n'a plus de prise sur ce qu'il fait),
 * et surtout elle REMPLACE L'ACTION — on comprend, on est ému, et rien ne change
 * dans la maison. Ce parcours ne s'arrête donc jamais à la lecture : chaque
 * module la fait aboutir à un réglage du quotidien, écrit et testé quinze jours.
 *
 * ⚠ CE QUE CE PARCOURS N'EST PAS. Ni un cours sur le psychotraumatisme, ni un
 * outil de repérage clinique, ni une aide au diagnostic. Un éducateur n'écrit
 * pas de diagnostic, et une mini-formation gratuite n'en apprend pas. Le
 * module 1 dit ce qui ne se lit PAS comme une réaction de survie — douleur,
 * faim, sommeil, vue, audition, effet d'un traitement — parce que c'est là que
 * cette grille de lecture fait le plus de dégâts quand elle est appliquée à
 * tout.
 *
 * ⚠ Aucun nom de programme déposé, aucune échelle clinique reproduite.
 */

const G = require('./gabarit-v3.js');
const A = require('./annexes.js');

/* ── MODULE 1 ────────────────────────────────────────────────────────────── */

const M1 = {
  reperes: {
    minutes: 12,
    prerequis:
      'aucun. Ce module s’adresse aux professionnels de la protection de l’enfance comme aux assistants familiaux et aux parents d’accueil.',
    evaluation:
      'un comportement de votre quotidien, relu avec la question « à quoi cela a-t-il pu servir », et le piège que vous avez failli commettre.',
  },
  objectifs: [
    'Poser la question « à quoi cela a-t-il pu servir » plutôt que « pourquoi me fait-il ça »',
    'Reconnaître sept conduites fréquentes et les contextes où elles étaient adaptées',
    'Nommer les trois pièges de cette lecture, dont le plus fréquent : elle remplace l’action',
    'Distinguer ce qui ne se lit PAS comme une réaction de survie',
    'Faire aboutir une lecture à un réglage concret du quotidien',
  ],
  corps: `${G.alerte(
    'À lire avant tout le reste',
    `<p>Ce parcours n’est <strong>ni un cours sur le psychotraumatisme, ni un outil de
repérage clinique, ni une aide au diagnostic</strong>. Un éducateur, un assistant
familial ou un enseignant n’écrit pas de diagnostic, et une mini-formation gratuite n’en
apprend pas.</p>
<p style="margin-bottom:0">Ce qu’il apprend est plus modeste et directement
utilisable&nbsp;: relire une conduite autrement, et en tirer <strong>un réglage du
quotidien</strong> — un seul, écrit, testé quinze jours. Si un enfant va mal, la lecture
ne remplace ni un avis médical, ni un accompagnement thérapeutique, ni une transmission
au cadre.</p>`,
  )}

<h3 style="${G.H3}">1. Changer de question</h3>
<p>Devant une conduite qui déroute, deux questions sont possibles. Elles ne mènent pas au
même endroit.</p>
${A.tableau(
  ['La question', 'Où elle mène'],
  [
    [
      '«&nbsp;Pourquoi il me fait ça&nbsp;?&nbsp;»',
      'Vers l’intention, donc vers la relation, donc vers l’affrontement. Elle est presque toujours sans réponse, et elle épuise celui qui la pose.',
    ],
    [
      '«&nbsp;À quoi cela a-t-il pu servir, là d’où il vient&nbsp;?&nbsp;»',
      'Vers une hypothèse, donc vers quelque chose à essayer. Elle ne dit pas ce qui s’est passé — personne ne le sait — mais elle rend la conduite lisible et, surtout, elle débouche.',
    ],
  ],
)}
<p>La seconde question ne prétend rien savoir de l’histoire de l’enfant. Elle demande
seulement&nbsp;: <em>dans quel contexte cette conduite serait-elle une bonne
idée&nbsp;?</em> Et il y a presque toujours un contexte où elle en est une.</p>

<h3 style="${G.H3}">2. Sept conduites, et les contextes où elles étaient adaptées</h3>
<p>Ce tableau n’est pas une clé de lecture&nbsp;: c’est une liste d’hypothèses à tester.
Une même conduite peut avoir plusieurs raisons, et parfois aucune de celles-là.</p>
${A.tableau(
  ['Ce qu’on observe', 'Le contexte où c’est une bonne idée', 'Ce que ça devient ici'],
  [
    [
      '<strong>Cacher de la nourriture</strong>',
      'Là où la nourriture n’est pas garantie, en mettre de côté est la conduite la plus rationnelle qui soit.',
      'Une chambre qui sent, des règles d’hygiène, et une fouille — c’est-à-dire la preuve que rien n’est garanti ici non plus.',
    ],
    [
      '<strong>Ne pas dormir, ou dormir habillé</strong>',
      'Là où la nuit est le moment où les choses arrivent, rester en alerte protège.',
      'Des levers difficiles, des retards à l’école, et un adulte qui « n’arrive pas à le coucher ».',
    ],
    [
      '<strong>Vérifier les portes, les sorties, où sont les adultes</strong>',
      'Savoir par où l’on peut partir est une compétence, pas une bizarrerie.',
      'Des déplacements incessants, lus comme de l’agitation ou de la provocation.',
    ],
    [
      '<strong>Mentir sur des choses sans enjeu</strong>',
      'Là où dire vrai a coûté cher, le mensonge n’est pas une stratégie&nbsp;: c’est un réflexe de protection, y compris quand il n’y a rien à protéger.',
      'Une réputation de manipulateur, écrite dans un dossier, qui suivra l’enfant des années.',
    ],
    [
      '<strong>S’occuper des plus petits, gérer les adultes</strong>',
      'Là où un enfant a dû tenir la maison, prendre en charge est ce qu’il sait faire de mieux.',
      'Un jeune « trop mature », qu’on félicite — et qui n’a toujours aucun endroit où être un enfant.',
    ],
    [
      '<strong>Tester la constance de l’adulte, faire monter</strong>',
      'Là où les adultes partaient, savoir vite qui va rester évite de s’attacher pour rien.',
      'Une escalade lue comme de la provocation, et souvent un changement de lieu — qui confirme l’hypothèse de départ.',
    ],
    [
      '<strong>Refuser toute aide, tout faire seul</strong>',
      'Là où l’aide a eu un prix, la refuser protège.',
      'Un « refus d’accompagnement » noté au dossier, et un jeune qu’on finit par laisser tranquille.',
    ],
  ],
)}
${G.alerte(
  'La troisième colonne est le vrai sujet',
  `<p style="margin-bottom:0">Dans chaque ligne, la réponse ordinaire de l’institution
<strong>confirme</strong> ce que l’enfant avait appris ailleurs&nbsp;: la nourriture n’est
pas garantie, les adultes partent, dire vrai coûte cher, l’aide a un prix. C’est ce
qu’on appelle une réponse qui fonctionne à l’envers — et c’est là que ce parcours
travaille.</p>`,
)}

<h3 style="${G.H3}">3. Les trois pièges de cette lecture</h3>
<p>Ils sont réels, ils sont fréquents, et le troisième est de loin le plus courant.</p>
<ul style="${G.UL}">
<li style="${G.LI}"><strong>Elle explique tout.</strong> Une grille qui rend compte de
toutes les conduites ne rend compte d’aucune. Si vous pouvez relier n’importe quel geste
à l’histoire de l’enfant, vous n’avez plus une hypothèse&nbsp;: vous avez une croyance,
et elle ne se teste pas.</li>
<li style="${G.LI}"><strong>Elle excuse tout.</strong> Comprendre d’où vient une conduite
ne la rend pas sans conséquence, et retirer toute limite à un enfant au motif de son
histoire lui retire aussi toute prise sur ce qu’il fait. Le cadre protège&nbsp;; il n’est
pas l’ennemi de la compréhension.</li>
<li style="${G.LI}"><strong>Elle remplace l’action.</strong> C’est le piège
principal&nbsp;: la réunion est de grande qualité, tout le monde est ému, la lecture est
juste — et <em>rien ne change</em> dans la maison le lendemain. Une lecture qui n’aboutit
pas à un réglage concret n’a servi qu’aux adultes.</li>
</ul>
<div style="${G.GRIS}">
<p style="margin:0"><strong>Le test de la lecture utile&nbsp;:</strong> qu’est-ce qui, à
la fin de cette réunion, <strong>sera différent demain matin</strong> dans le quotidien
de cet enfant&nbsp;? Si personne ne peut le dire en une phrase, la réunion n’est pas
finie.</p>
</div>

<h3 style="${G.H3}">4. Ce qui ne se lit PAS comme une réaction de survie</h3>
<p>C’est là que cette grille fait le plus de dégâts, parce qu’elle est appliquée à tout
et qu’elle retarde des réponses simples. Avant toute lecture de l’histoire&nbsp;:</p>
<ul style="${G.UL}">
<li style="${G.LI}"><strong>La douleur.</strong> Dents, oreilles, ventre, règles, une
douleur chronique jamais explorée. Elle produit de l’irritabilité, des refus et des
crises, et elle est régulièrement manquée chez les enfants qui parlent peu ou qu’on
n’écoute plus.</li>
<li style="${G.LI}"><strong>La faim et le sommeil.</strong> Un enfant qui dort cinq
heures n’a pas un problème de comportement.</li>
<li style="${G.LI}"><strong>La vue et l’audition.</strong> Un bilan qui n’a jamais été
fait explique parfois trois ans de «&nbsp;n’écoute pas&nbsp;» et de difficultés
scolaires.</li>
<li style="${G.LI}"><strong>Un traitement</strong> commencé, arrêté ou modifié. Les
changements d’humeur et de sommeil qui suivent ne sont pas une réaction à
l’accompagnement.</li>
<li style="${G.LI}"><strong>Un trouble du neurodéveloppement</strong> non repéré. Une
grande partie des enfants confiés en présentent un, et les conduites qui en découlent se
travaillent avec d’autres outils — ceux des autres parcours de ce catalogue.</li>
</ul>
<p><strong>La règle&nbsp;:</strong> on ne remplace jamais un examen par une hypothèse.
Quand une conduite est nouvelle, quand elle s’aggrave, ou quand elle s’accompagne de
signes physiques, le premier réflexe est médical.</p>

<h3 style="${G.H3}">5. De la lecture au réglage — la seule chose qui compte</h3>
<p>Une lecture aboutit à <strong>un réglage du quotidien</strong>&nbsp;: un changement
concret, petit, tenu par toute l’équipe, et testé quinze jours. Petit, parce qu’un
changement qui demande une réorganisation ne sera pas tenu&nbsp;; tenu par tous, parce
qu’un réglage que la moitié de l’équipe ignore n’existe pas.</p>
${G.exemple(
  'Trois lectures, trois réglages',
  `<ul style="${G.UL}">
<li style="${G.LI}"><strong>Cacher de la nourriture</strong> → une corbeille de fruits et
de gâteaux <em>accessible en permanence</em>, dans un endroit ouvert, jamais retirée, et
la phrase dite une fois&nbsp;: «&nbsp;il y en a toujours, tu peux te servir&nbsp;». La
nourriture cachée cesse quand elle devient inutile — pas quand on fouille.</li>
<li style="${G.LI}"><strong>Vérifier où sont les adultes</strong> → un tableau à
l’entrée avec le prénom des adultes présents et l’heure à laquelle ils partent, mis à
jour à chaque relève.</li>
<li style="${G.LI}"><strong>Tester la constance</strong> → une phrase dite à froid et
tenue&nbsp;: «&nbsp;je suis là mardi, jeudi et vendredi. Si je ne suis pas là, on te le
dit la veille.&nbsp;» Puis on le fait, y compris les semaines où c’est compliqué.</li>
</ul>
<p style="margin-bottom:0">Aucun de ces trois réglages ne demande de moyens
supplémentaires, et aucun ne dépend de l’adhésion de l’enfant.</p>`,
)}

<h3 style="${G.H3}">6. Ce qui appartient à cette lecture, et ce qui ne lui appartient pas</h3>
<ul style="${G.UL}">
<li style="${G.LI}"><strong>Elle est une hypothèse, pas un savoir.</strong> On ne sait
pas ce qui est arrivé à cet enfant, et on n’a pas à le deviner. Une hypothèse s’écrit
comme telle, et se teste.</li>
<li style="${G.LI}"><strong>Elle ne se dit pas à l’enfant comme une explication.</strong>
«&nbsp;Tu fais ça parce que tu as été maltraité&nbsp;» est une phrase qu’aucun
professionnel ne devrait prononcer&nbsp;: elle assigne, et elle raconte à l’enfant une
histoire qu’il n’a pas choisi de raconter.</li>
<li style="${G.LI}"><strong>Elle ne s’écrit pas au dossier comme un fait.</strong> Ce
qui s’écrit&nbsp;: ce qu’on observe, ce qu’on a essayé, ce que ça a donné.</li>
<li style="${G.LI}"><strong>Elle ne remplace pas les personnes dont c’est le
métier.</strong> Ce qui relève du soin psychique relève de soignants. Le rôle éducatif
est ailleurs, et il est décisif&nbsp;: c’est celui qui tient le quotidien.</li>
</ul>`,
  aRetenir:
    'On remplace «&nbsp;pourquoi il me fait ça&nbsp;» par <strong>«&nbsp;à quoi cela a-t-il pu servir&nbsp;»</strong>. Et une lecture qui n’aboutit pas à <strong>un réglage concret du quotidien</strong> n’a servi qu’aux adultes.',
  exercice: {
    nom: 'À quoi cela a-t-il pu servir',
    duree: '10 minutes',
    quoi:
      'On prend une conduite réelle, d’un enfant réel, et on la relit. Une seule conduite, la plus banale de préférence.',
    etapes: [
      'Décrivez la conduite en termes observables : ce qui se voit, quand, à quelle fréquence. Pas d’adjectif, pas d’intention.',
      'Écrivez ce que vous vous dites d’habitude en la voyant. Honnêtement — « il le fait exprès », « il cherche », « il manipule ». Personne ne lira cette ligne.',
      'Écrivez maintenant : dans quel contexte cette conduite serait-elle une bonne idée ? Cherchez-en deux, pas un.',
      'Regardez la réponse habituelle de la maison ou du service. Est-ce qu’elle confirme, sans le vouloir, ce que l’enfant a appris ailleurs ?',
      'Passez la conduite au filtre du point 4 : douleur, faim, sommeil, vue, audition, traitement, trouble non repéré. Y a-t-il quelque chose à vérifier avant ?',
      'Écrivez une phrase : « ce qui sera différent demain matin, c’est ……… ». Une seule chose, petite.',
    ],
    reussi:
      'vous avez deux contextes d’hypothèse, un filtre passé, et une phrase de réglage qui tient en une ligne et qui ne demande aucun moyen supplémentaire.',
  },
  carnet: {
    intro:
      'Ouvrez une page — carnet, feuille, notes du téléphone. Quatre lignes pour ce module.',
    lignes: [
      '<strong>La conduite</strong> — décrite, sans intention prêtée.',
      '<strong>Mes deux hypothèses</strong> — les contextes où ce serait une bonne idée.',
      '<strong>La réponse habituelle</strong> — et si elle confirme ce qu’il a appris ailleurs.',
      '<strong>Mon réglage</strong> — ce qui sera différent demain matin.',
    ],
  },
  vigilance: [
    '<strong>Une hypothèse n’est pas un savoir.</strong> Vous ne savez pas ce qui est arrivé à cet enfant, et vous n’avez pas à le deviner pour agir.',
    '<strong>Ne dites jamais à un enfant qu’il agit « à cause de » son histoire.</strong> Cela l’assigne, et cela raconte à sa place une histoire qu’il n’a pas choisi de raconter.',
    '<strong>Vérifiez le corps avant l’histoire.</strong> Douleur, sommeil, vue, audition, traitement : ce sont les causes les plus fréquentes et les plus souvent manquées.',
    '<strong>Une lecture juste qui ne change rien est une lecture inutile.</strong> Le seul livrable de ce parcours est un réglage du quotidien.',
  ],
  annexes:
    'le <strong>tableau des sept conduites</strong> et de leurs contextes, la <strong>fiche « ce qui ne se lit pas comme ça »</strong>, et la <strong>liste des réglages du quotidien</strong> déjà écrits.',
  avant: [
    'J’ai décrit une conduite réelle sans lui prêter d’intention.',
    'J’ai écrit deux contextes dans lesquels elle serait une bonne idée.',
    'J’ai une phrase de réglage : ce qui sera différent demain matin.',
  ],
};

/* ── MODULE 2 ────────────────────────────────────────────────────────────── */

const M2 = {
  reperes: {
    minutes: 10,
    prerequis: 'le module 1 — la question, les sept conduites, les trois pièges.',
    evaluation:
      'votre propre scène relue, avec la réponse institutionnelle qui confirme ce que l’enfant avait appris.',
  },
  objectifs: [
    'Repérer, dans une réponse ordinaire et bien intentionnée, ce qui confirme l’apprentissage ancien',
    'Distinguer la règle qui protège de la règle qui n’existe que pour l’ordre',
    'Voir comment une lecture juste peut ne rien changer',
    'Écrire le réglage qui aurait évité la scène',
    'Transposer l’analyse à un accueil familial',
  ],
  corps: `<h3 style="${G.H3}">1. Les provisions de Yasmine</h3>
<p>Six semaines d’accueil, une équipe attentive, une règle raisonnable — et une rupture.
Lisez, puis arrêtez-vous.</p>

<div style="${G.GRIS}">
<p><em>Une MECS. Yasmine, 13&nbsp;ans, est accueillie depuis six semaines. Elle est
décrite comme «&nbsp;facile&nbsp;», discrète, polie.</em></p>
<p><em>Une éducatrice trouve dans sa chambre, derrière l’armoire, quatre yaourts, du pain
et des tranches de jambon dans un sac plastique. Certains sont périmés.</em></p>
<p><em>En réunion, la décision est prise&nbsp;: rappel du règlement — pas de nourriture
dans les chambres — et un point avec elle. L’argument est l’hygiène, et il est
juste.</em></p>
<p><em>L’éducatrice lui en parle le soir, gentiment&nbsp;: «&nbsp;Yasmine, on a vu ce
qu’il y avait derrière ton armoire. Tu sais, ici tu n’as pas besoin de faire ça. Il y a
à manger, tu ne manqueras de rien. Mais on ne garde pas de nourriture dans les chambres,
c’est le règlement, d’accord&nbsp;?&nbsp;»</em></p>
<p><em>Yasmine dit «&nbsp;d’accord&nbsp;». Elle ne discute pas.</em></p>
<p><em>La semaine suivante, une autre éducatrice trouve un sac dans le placard du couloir.
Deuxième rappel, plus ferme. La semaine d’après, la chambre est vérifiée pendant qu’elle
est au collège.</em></p>
<p><em>Yasmine l’apprend. Le soir, elle refuse de dîner. Puis elle ne dîne plus avec le
groupe. Trois semaines plus tard, elle a perdu du poids, et l’équipe écrit&nbsp;:
«&nbsp;refus alimentaire, transgression répétée du règlement, opposition passive&nbsp;».</em></p>
</div>

<h3 style="${G.H3}">2. Arrêtez-vous ici — cinq minutes, de quoi écrire</h3>
<p>Personne n’a mal agi. La règle est fondée, le ton était bon, l’intention aussi.
Cherchez à quel moment la réponse de la maison a <strong>confirmé</strong> ce que Yasmine
savait déjà.</p>

${G.FILET}

<h3 style="${G.H3}">3. Ce que chaque étape a enseigné</h3>
${A.tableau(
  ['Ce que fait l’institution', 'Ce que ça vise', 'Ce que ça enseigne'],
  [
    [
      'On trouve les provisions et on en fait un sujet.',
      'L’hygiène, la salubrité de la chambre.',
      'Ma réserve n’est pas en sécurité. C’est exactement l’information contre laquelle la réserve existait.',
    ],
    [
      '«&nbsp;Tu n’as pas besoin de faire ça, tu ne manqueras de rien.&nbsp;»',
      'Rassurer.',
      'Une promesse d’adulte. Elle en a déjà reçu. Rien dans la maison ne la rend vérifiable&nbsp;: les placards sont fermés, la cuisine aussi.',
    ],
    [
      'Deuxième rappel, plus ferme.',
      'Faire respecter le cadre.',
      'Le sujet devient l’obéissance. La question de la nourriture, elle, n’a été traitée par personne.',
    ],
    [
      'Vérification de la chambre en son absence.',
      'Vérifier, régler le problème d’hygiène.',
      'Mon espace n’est pas à moi&nbsp;; on entre quand je ne suis pas là. Pour une adolescente placée, c’est l’information la plus coûteuse de toute la scène.',
    ],
    [
      'Elle cesse de manger avec le groupe.',
      '—',
      'Le seul terrain qui lui reste. Ce n’est pas de l’opposition&nbsp;: c’est ce qu’il reste quand la réserve est impossible.',
    ],
    [
      '«&nbsp;Refus alimentaire, transgression répétée, opposition passive.&nbsp;»',
      'Décrire la situation.',
      'Trois qualifications, aucun fait, et une lecture qui ferme le dossier. C’est cette phrase qui suivra Yasmine dans son prochain lieu.',
    ],
  ],
)}
${G.alerte(
  'La règle était bonne. C’est l’ordre des choses qui ne l’était pas',
  `<p style="margin-bottom:0">On peut parfaitement interdire la nourriture dans les
chambres — c’est une règle d’hygiène, elle protège tout le monde. Mais une règle qui
retire une sécurité <strong>doit être précédée de ce qui la remplace</strong>. Ici, on a
retiré la réserve avant d’avoir rendu la nourriture accessible. Fait dans cet ordre,
n’importe quel règlement produit ce qu’il voulait éviter.</p>`,
)}

<h3 style="${G.H3}">4. Où la lecture aurait dû aboutir</h3>
<p>Une équipe peut très bien avoir <em>compris</em> la scène. En réunion, quelqu’un dira
sans doute&nbsp;: «&nbsp;elle a dû manquer, c’est normal qu’elle fasse des
réserves&nbsp;». C’est juste — et c’est le troisième piège du module&nbsp;1 si l’on
s’arrête là.</p>
<p>La question qui manque est toujours la même&nbsp;: <strong>qu’est-ce qui sera
différent demain matin&nbsp;?</strong></p>
<div style="${G.GRIS}">
<p style="margin-top:0"><strong>Le réglage&nbsp;:</strong> une corbeille de fruits, de
pain et de gâteaux, <strong>accessible en permanence</strong>, dans un endroit ouvert, et
qui n’est jamais retirée — même les soirs difficiles, même quand quelqu’un se sert
trop.</p>
<p style="margin:14px 0 0"><strong>La phrase, dite une fois&nbsp;:</strong>
«&nbsp;Là, il y en a toujours. Tu peux te servir quand tu veux, sans demander.&nbsp;»</p>
<p style="margin-bottom:0"><strong>Et l’ordre&nbsp;:</strong> la corbeille arrive
<em>avant</em> qu’on reparle des chambres. Deux ou trois semaines après, la question de
la chambre se pose d’elle-même, et souvent elle ne se pose plus.</p>
</div>
<p>Ce réglage ne coûte rien, ne demande aucune adhésion de Yasmine, et il est vérifiable
en quinze jours&nbsp;: soit les réserves diminuent, soit elles ne diminuent pas — et dans
ce cas l’hypothèse était mauvaise, ce qui est aussi une information.</p>

<h3 style="${G.H3}">5. Et la chambre ?</h3>
<p>Un point que la scène tranche mal, et qui mérite d’être dit clairement.</p>
<ul style="${G.UL}">
<li style="${G.LI}"><strong>Vérifier une chambre en l’absence de l’occupant n’est jamais
anodin.</strong> Cela peut être nécessaire — sécurité, produits, objets dangereux — mais
cela relève d’un cadre écrit, connu de l’enfant, et cela se dit avant, pas après.</li>
<li style="${G.LI}"><strong>Ce qui se fait sans le dire enseigne autre chose que ce qu’on
croyait enseigner.</strong> Pour un enfant dont l’espace n’a jamais été respecté, c’est
la confirmation la plus directe qui soit.</li>
<li style="${G.LI}"><strong>Une odeur ou une denrée périmée se traite avec
l’occupant.</strong> «&nbsp;On regarde ensemble ce qui est encore bon, on jette le reste,
et je te montre où il y en a toujours&nbsp;» règle l’hygiène sans rien retirer.</li>
</ul>

<h3 style="${G.H3}">6. Et en accueil familial — la même scène, chez soi</h3>
<p>La scène se passe en collectif&nbsp;; en famille d’accueil, deux choses changent, et
la seconde est difficile.</p>
<ul style="${G.UL}">
<li style="${G.LI}"><strong>Le réglage est plus facile.</strong> Une corbeille sur le plan
de travail, un placard qui reste ouvert, un tiroir «&nbsp;à toi&nbsp;» dans le
frigo&nbsp;: cela se décide en une soirée, sans réunion et sans règlement à modifier.
Beaucoup d’assistants familiaux le font d’instinct.</li>
<li style="${G.LI}"><strong>La conduite touche la maison de plus près.</strong> De la
nourriture qui disparaît, un enfant qui se lève la nuit, des affaires qui se déplacent&nbsp;:
c’est votre foyer, vos autres enfants, votre nuit. La lecture ne rend pas cela plus
facile à vivre, et prétendre le contraire serait faux.</li>
</ul>
<p><strong>Deux choses valent d’être dites&nbsp;:</strong> ce que vous observez à la
maison est une information de première main que le service n’a pas, et elle mérite d’être
transmise avec ses détails plutôt que résumée en «&nbsp;ça se passe mal&nbsp;». Et si la
situation devient trop lourde, cela se dit sans attendre — c’est ce qui permet un appui,
et c’est ce qui évite une fin d’accueil dans l’urgence, dont l’enfant paierait le prix
une fois de plus.</p>`,
  aRetenir:
    '<strong>Une règle qui retire une sécurité doit être précédée de ce qui la remplace.</strong> Dans le désordre, n’importe quel règlement produit exactement ce qu’il voulait éviter — et l’enfant en ressort avec trois qualifications de plus dans son dossier.',
  exercice: {
    nom: 'Ce que notre réponse enseigne',
    duree: '12 minutes',
    quoi: 'On refait l’analyse sur une situation de votre service ou de votre maison.',
    etapes: [
      'Racontez par écrit une situation où une conduite s’est aggravée malgré une réponse raisonnable. Dix lignes, au présent.',
      'Faites deux colonnes : ce que la réponse visait, ce qu’elle a pu enseigner. Une ligne par étape.',
      'Cherchez le moment où le sujet a changé — où l’on a cessé de parler du besoin pour parler de la règle ou de l’attitude.',
      'Vérifiez l’ordre : a-t-on retiré quelque chose avant d’avoir mis en place ce qui le remplace ?',
      'Écrivez le réglage : ce qui aurait pu être installé AVANT. Il doit être petit, permanent, et ne dépendre d’aucune adhésion de l’enfant.',
      'Écrivez enfin la phrase du dossier telle qu’elle a été rédigée, puis telle qu’elle aurait pu l’être — des faits, une hypothèse signalée comme telle, un essai en cours.',
    ],
    reussi:
      'vos deux colonnes sont remplies, vous avez repéré une inversion d’ordre, votre réglage tient en une ligne, et votre phrase de dossier ne contient aucune qualification.',
  },
  carnet: {
    intro: 'Quatre lignes de plus sur la page du module 1.',
    lignes: [
      '<strong>Ce que notre réponse enseignait</strong> — la colonne de droite.',
      '<strong>L’inversion d’ordre</strong> — ce qu’on a retiré avant d’avoir remplacé.',
      '<strong>Mon réglage</strong> — petit, permanent, sans adhésion requise.',
      '<strong>Ma phrase de dossier refaite</strong> — faits, hypothèse, essai en cours.',
    ],
  },
  vigilance: [
    '<strong>Cette scène n’accuse personne.</strong> La règle est fondée, l’éducatrice est attentive, la réunion a bien travaillé. Ce qui manquait est l’ordre des choses et un réglage concret.',
    '<strong>Ne transformez pas un besoin en question d’obéissance.</strong> Dès que le sujet devient le respect du règlement, le besoin d’origine n’est plus traité par personne.',
    '<strong>Une vérification de chambre relève d’un cadre écrit et annoncé</strong>, jamais d’une initiative du soir. Pour un enfant placé, c’est un des points les plus sensibles qui soient.',
    '<strong>« Refus alimentaire » est un signe médical avant d’être un signe éducatif.</strong> Une perte de poids se signale au médecin, quelle que soit l’explication qu’on lui trouve.',
  ],
  annexes:
    'la <strong>scène de Yasmine corrigée</strong> étape par étape, la <strong>fiche « ce que notre réponse enseigne »</strong> à deux colonnes, et le <strong>mémo sur l’ordre des choses</strong>.',
  avant: [
    'J’ai rempli mes deux colonnes : ce que la réponse visait, ce qu’elle enseignait.',
    'J’ai repéré une inversion d’ordre — quelque chose retiré avant d’être remplacé.',
    'Mon réglage tient en une ligne et ne dépend d’aucune adhésion de l’enfant.',
  ],
};

/* ── MODULE 3 ────────────────────────────────────────────────────────────── */

const M3 = {
  reperes: {
    minutes: 12,
    apres:
      'quinze jours d’application du réglage, avec un relevé de trente secondes par jour. Le module&nbsp;4 se lit le quinzième jour.',
    prerequis: 'les modules 1 et 2, et une conduite relue.',
    evaluation: 'votre fiche « lecture → réglage » écrite, en cinq lignes, et portée en réunion.',
  },
  objectifs: [
    'Écrire une fiche qui va de la conduite observée au réglage, en cinq lignes',
    'Choisir un réglage parmi ceux qui tiennent : petit, permanent, sans adhésion requise',
    'Écrire ce que le réglage ne doit pas être',
    'Rendre le réglage tenable par toute l’équipe, y compris par un remplaçant',
    'Fixer une date de revue avant de commencer',
  ],
  corps: `<h3 style="${G.H3}">1. Cinq lignes, de la conduite au réglage</h3>
<div style="${G.GRIS}">
<ol style="${G.UL}">
<li style="${G.LI}"><strong>La conduite</strong> — ce qui se voit, quand, à quelle
fréquence. Aucun adjectif, aucune intention.</li>
<li style="${G.LI}"><strong>Mes deux hypothèses</strong> — deux contextes où cette
conduite serait une bonne idée.</li>
<li style="${G.LI}"><strong>Ce que notre réponse actuelle enseigne</strong> — la colonne
de droite du module&nbsp;2.</li>
<li style="${G.LI}"><strong>Le réglage</strong> — ce qui sera différent demain matin. Un
seul, petit, permanent.</li>
<li style="${G.LI}"><strong>La date de revue</strong> — quinze jours, et ce qu’on
regardera ce jour-là.</li>
</ol>
</div>
<p>La ligne&nbsp;3 est celle qu’on saute, et c’est celle qui rend le réglage évident. Tant
qu’on n’a pas écrit ce que la réponse actuelle enseigne, on cherche un réglage à
l’aveugle.</p>

<h3 style="${G.H3}">2. Les huit réglages qui reviennent</h3>
<p>Ils ne sont pas une liste à appliquer&nbsp;: ce sont ceux que les équipes finissent par
inventer, et les avoir sous les yeux fait gagner trois réunions.</p>
${A.tableau(
  ['Ce qui est en jeu', 'Le réglage', 'Ce qui le fait échouer'],
  [
    [
      '<strong>La nourriture</strong>',
      'Quelque chose de comestible accessible en permanence, dans un endroit ouvert, jamais retiré&nbsp;: corbeille de fruits, pain, gâteaux. Et la phrase dite une fois&nbsp;: «&nbsp;il y en a toujours, tu peux te servir sans demander&nbsp;».',
      'La retirer un soir parce que quelqu’un s’est trop servi. Une fois retirée, elle n’a plus jamais aucune valeur.',
    ],
    [
      '<strong>La nuit</strong>',
      'Dire ce qui se passe la nuit&nbsp;: qui est là, où il est, ce qu’il fait, comment on l’appelle. Une veilleuse, une porte entrouverte au choix de l’enfant.',
      'Exiger l’extinction et le silence avant d’avoir rendu la nuit prévisible.',
    ],
    [
      '<strong>L’espace personnel</strong>',
      'Un endroit à soi, réellement à soi&nbsp;: on frappe, on n’entre pas en son absence, et si une vérification est nécessaire elle est écrite, annoncée, et faite avec lui.',
      'Une vérification faite «&nbsp;pour son bien&nbsp;» pendant qu’il est au collège. C’est la confirmation la plus directe qui soit.',
    ],
    [
      '<strong>Savoir où sont les adultes</strong>',
      'Un tableau à l’entrée&nbsp;: prénoms des adultes présents, heure à laquelle ils partent, qui prend le relais. Mis à jour à chaque relève.',
      'Le laisser périmé deux jours. Un support faux enseigne la méfiance (voir «&nbsp;Rendre l’environnement prévisible&nbsp;»).',
    ],
    [
      '<strong>Les départs et les retours</strong>',
      'Annoncer les absences la veille — congés, arrêts, changement d’équipe — et dire quand on revient. Y compris pour un départ définitif, et surtout pour celui-là.',
      'Ne rien dire pour «&nbsp;ne pas l’inquiéter&nbsp;». Il l’apprendra, et il apprendra en même temps que les adultes partent sans prévenir.',
    ],
    [
      '<strong>Les affaires personnelles</strong>',
      'De vrais contenants&nbsp;: valise, sac, boîte à soi. Rien de ce qui lui appartient ne se transporte en sac poubelle, jamais, y compris dans l’urgence.',
      'L’urgence, précisément. C’est toujours dans l’urgence que ça se produit, et c’est ce dont les jeunes se souviennent vingt ans après.',
    ],
    [
      '<strong>Les visites</strong>',
      'Dire à l’avance ce qui est prévu, ce qui n’est pas garanti, et ce qui se passe si la visite n’a pas lieu. Prévoir le retour de visite&nbsp;: du temps, peu de demandes, personne qui interroge.',
      'Traiter l’état d’après-visite comme un problème de comportement.',
    ],
    [
      '<strong>Le mensonge sans enjeu</strong>',
      'Ne pas en faire un sujet. Ne pas piéger («&nbsp;dis-moi la vérité, je sais déjà&nbsp;»). Reprendre le fait sans demander d’aveu&nbsp;: «&nbsp;le verre est cassé, on le ramasse ensemble.&nbsp;»',
      'La confrontation. Elle n’obtient jamais la vérité et elle confirme que dire vrai coûte cher.',
    ],
  ],
)}

<h3 style="${G.H3}">3. Ce qui fait qu’un réglage tient</h3>
<ul style="${G.UL}">
<li style="${G.LI}"><strong>Il est petit.</strong> Un réglage qui demande une
réorganisation, un budget ou une décision de direction ne sera pas en place lundi. Ceux
qui tiennent tiennent parce qu’ils sont dérisoires.</li>
<li style="${G.LI}"><strong>Il est permanent.</strong> C’est la condition la plus
importante et la plus difficile&nbsp;: la corbeille n’est jamais retirée, le tableau est
toujours à jour, la porte est toujours frappée. Un réglage intermittent est pire que pas
de réglage — il enseigne exactement ce qu’on voulait corriger.</li>
<li style="${G.LI}"><strong>Il ne demande aucune adhésion de l’enfant.</strong> Il ne se
négocie pas, ne se mérite pas, ne se retire pas en cas de bêtise. S’il peut servir de
levier, ce n’est plus un réglage&nbsp;: c’est une récompense, et elle sera perdue le
premier mauvais soir.</li>
<li style="${G.LI}"><strong>Il est tenu par tout le monde.</strong> Un réglage que la
moitié de l’équipe ignore n’existe pas, et il apprend à l’enfant que tout dépend de qui
est de service.</li>
<li style="${G.LI}"><strong>Il a une date de revue.</strong> Quinze jours, écrits.</li>
</ul>
${G.alerte(
  'Ce qu’un réglage n’est jamais',
  `<p style="margin-bottom:0">Ni une récompense, ni un privilège, ni quelque chose qu’on
retire quand ça se passe mal. Retirer un réglage un soir de tension annule tout le travail
et confirme la leçon d’origine&nbsp;: ce qui est donné se reprend. Si un réglage pose un
vrai problème — hygiène, sécurité, équité avec les autres —, il se <strong>modifie à
froid, en réunion</strong>, et le changement s’annonce à l’enfant.</p>`,
)}

<h3 style="${G.H3}">4. Écrire la ligne 3 sans accuser personne</h3>
<p>«&nbsp;Ce que notre réponse enseigne&nbsp;» est une ligne inconfortable à écrire en
équipe, et elle se retourne facilement en procès. Deux précautions&nbsp;:</p>
<ul style="${G.UL}">
<li style="${G.LI}"><strong>Elle porte sur la réponse, pas sur les personnes.</strong>
«&nbsp;La vérification des chambres enseigne que l’espace n’est pas à eux&nbsp;» se
discute&nbsp;; «&nbsp;tu n’aurais pas dû fouiller&nbsp;» ne se discute pas, cela se
défend.</li>
<li style="${G.LI}"><strong>Elle vise ce qui est ordinaire, pas ce qui est
exceptionnel.</strong> Les réponses les plus coûteuses sont presque toujours les plus
banales et les mieux intentionnées — c’est bien pour cela qu’elles n’ont jamais été
interrogées.</li>
</ul>

<h3 style="${G.H3}">5. Le porter en réunion, ou le dire chez soi</h3>
<p>Un réglage se décide collectivement, sinon il ne sera pas permanent. Cinq minutes en
réunion suffisent si l’on arrive avec la fiche écrite&nbsp;:</p>
<div style="${G.GRIS}">
<p style="margin-top:0"><em>«&nbsp;Voilà ce qu’on observe. Voilà deux hypothèses. Voilà ce
que notre réponse actuelle enseigne, sans qu’on l’ait voulu. Je propose ce réglage-là,
pendant quinze jours, et on regarde le [date]. Si ça ne change rien, l’hypothèse était
mauvaise et on en essaie une autre.&nbsp;»</em></p>
<p style="margin-bottom:0">Quatre phrases. Une hypothèse qui s’annonce comme telle et qui
prévoit sa propre vérification obtient presque toujours l’accord — parce qu’elle
n’engage personne à croire quoi que ce soit.</p>
</div>
<p><strong>En accueil familial</strong>, la réunion n’existe pas, et c’est plus simple à
mettre en place mais plus solitaire à tenir. Deux choses aident&nbsp;: écrire quand même
la fiche (elle sert le jour où l’on doit expliquer au référent ce qu’on a fait et
pourquoi), et prévenir le service — un réglage transmis devient une information partagée
plutôt qu’une initiative personnelle.</p>

<h3 style="${G.H3}">6. Ce que vous devez avoir sur votre feuille en sortant</h3>
<div style="${G.GRIS}">
<ul style="${G.UL}">
<li style="${G.LI}">Une conduite décrite, sans intention prêtée.</li>
<li style="${G.LI}">Deux hypothèses, écrites comme des hypothèses.</li>
<li style="${G.LI}">Une ligne «&nbsp;ce que notre réponse enseigne&nbsp;».</li>
<li style="${G.LI}">Un réglage&nbsp;: petit, permanent, sans adhésion requise, tenu par
tous.</li>
<li style="${G.LI}">Une date de revue, et ce qu’on regardera ce jour-là.</li>
</ul>
</div>
<p><strong>Le test&nbsp;:</strong> un remplaçant qui arrive samedi matin peut-il tenir le
réglage sans rien savoir de l’histoire de l’enfant&nbsp;? Si oui, il est bon. C’est aussi
ce qui le protège&nbsp;: un réglage qui a besoin d’être expliqué pour être appliqué ne
survit pas au premier week-end.</p>`,
  aRetenir:
    'Un réglage tient quand il est <strong>petit, permanent, et qu’il ne se retire jamais</strong> — pas même un soir de tension. Le retirer annule tout le travail et confirme la leçon d’origine&nbsp;: ce qui est donné se reprend.',
  exercice: {
    nom: 'La fiche lecture → réglage',
    duree: '15 minutes',
    quoi: 'On écrit la feuille en entier, pour un enfant précis. Pas « en général ».',
    etapes: [
      'Ligne 1 : décrivez la conduite en termes observables — quoi, quand, à quelle fréquence.',
      'Ligne 2 : écrivez deux hypothèses, deux contextes où cette conduite serait une bonne idée. Deux, pas une : une seule hypothèse devient vite une certitude.',
      'Ligne 3 : écrivez ce que la réponse actuelle enseigne. Portez-la sur la réponse, jamais sur une personne de l’équipe.',
      'Ligne 4 : choisissez UN réglage. Passez-le aux cinq conditions du point 3 — petit, permanent, sans adhésion, tenu par tous, avec une date.',
      'Ligne 5 : écrivez la date de revue (quinze jours) et ce que vous regarderez ce jour-là : un chiffre, pas une impression.',
      'Portez la fiche en réunion avec les quatre phrases du point 5 — ou transmettez-la à votre référent si vous accueillez chez vous.',
    ],
    reussi:
      'les cinq lignes sont écrites, votre réglage passe les cinq conditions, la date est posée, et quelqu’un d’autre que vous connaît la fiche.',
  },
  carnet: {
    intro: 'La fiche EST le livrable. Recopiez-la au propre dans votre carnet.',
    lignes: [
      '<strong>La conduite</strong> — observable, datée, avec sa fréquence.',
      '<strong>Mes deux hypothèses</strong>.',
      '<strong>Ce que notre réponse enseigne</strong>.',
      '<strong>Mon réglage</strong> — et les cinq conditions cochées.',
      '<strong>Ma date de revue</strong> — et ce que je regarderai.',
    ],
  },
  vigilance: [
    '<strong>Un seul réglage à la fois.</strong> Trois réglages simultanés, c’est zéro information au quinzième jour : on ne saura pas lequel a compté.',
    '<strong>Ne faites jamais du réglage un levier.</strong> Dès qu’il peut être retiré, ce n’est plus un réglage — et ce qu’il enseignait s’efface d’un seul soir.',
    '<strong>La ligne 3 vise les réponses, pas les collègues.</strong> Écrite autrement, elle transforme une réunion de travail en tribunal, et plus personne n’écrira rien.',
    '<strong>Si la conduite touche la sécurité</strong> — fugue, mise en danger, violence —, le réglage ne remplace ni le protocole du service, ni les transmissions, ni le cadre judiciaire.',
  ],
  annexes:
    'le <strong>gabarit de la fiche en cinq lignes</strong>, le <strong>tableau des huit réglages</strong> avec ce qui les fait échouer, et les <strong>quatre phrases pour porter un réglage en réunion</strong>.',
  avant: [
    'Mes cinq lignes sont écrites, y compris la ligne 3.',
    'Mon réglage passe les cinq conditions, et il tiendrait un samedi avec un remplaçant.',
    'La date de revue est posée, et je sais quel chiffre je regarderai ce jour-là.',
  ],
  pause: {
    jours: 'quinze jours',
    texte: `<p>Votre réglage est décidé&nbsp;: il se met en place maintenant, et il tient
<strong>quinze jours</strong> sans être modifié. Le module&nbsp;4 se lit le quinzième jour,
le relevé sous les yeux.</p>
<p>Quinze jours, parce qu’une conduite installée depuis des années ne bouge pas en une
semaine, et parce qu’un réglage a besoin d’être vécu comme permanent avant d’être cru. Le
relevé prend trente secondes par jour&nbsp;: une croix, un chiffre.</p>
<p style="margin-bottom:0">Date de mise en place&nbsp;: …… / …… &nbsp;·&nbsp; date de
lecture&nbsp;: …… / …… .</p>`,
  },
};

/* ── MODULE 4 ────────────────────────────────────────────────────────────── */

const M4 = {
  reperes: {
    minutes: 12,
    prerequis: 'les modules 1 à 3, et un réglage en place depuis quinze jours.',
    evaluation:
      'la lecture de votre relevé au quinzième jour, et la phrase d’écrit professionnel que vous en tirez.',
  },
  objectifs: [
    'Tenir un relevé de trente secondes par jour, qui mesure la conduite et non l’humeur',
    'Lire ce relevé, y compris quand il dit que l’hypothèse était mauvaise',
    'Reconnaître les quatre issues possibles, dont deux sont des réussites',
    'Écrire dans un rapport une hypothèse signalée comme telle, sans poser de diagnostic',
    'Savoir ce qui ne relève pas de vous, et à qui cela revient',
  ],
  corps: `<h3 style="${G.H3}">1. Le relevé, en trois colonnes</h3>
<p>Trente secondes en fin de journée. Il mesure la conduite, jamais l’humeur — «&nbsp;bonne
journée&nbsp;» n’est pas une donnée.</p>
${A.tableau(
  ['Colonne', 'Ce qu’on y met', 'Pourquoi'],
  [
    [
      '<strong>1. La conduite</strong>',
      'Présente ou absente aujourd’hui — et si elle se compte, le nombre.',
      'C’est la seule mesure de l’hypothèse. Une croix par jour suffit.',
    ],
    [
      '<strong>2. Le réglage a été tenu</strong>',
      'Oui ou non. Non veut dire&nbsp;: la corbeille était vide, le tableau pas à jour, quelqu’un est entré dans la chambre.',
      'C’est la colonne qui explique tout le reste. Un réglage tenu neuf jours sur quinze n’a pas été testé.',
    ],
    [
      '<strong>3. Autre chose ce jour-là</strong>',
      'Trois mots au maximum&nbsp;: visite, audience, changement d’équipe, malade, week-end, appel de la famille.',
      'Sans cette colonne, les jours en dents de scie paraissent inexplicables alors qu’ils ne le sont pas.',
    ],
  ],
)}
${G.alerte(
  'Ce relevé ne se montre pas à l’enfant comme un tableau de fautes',
  `<p style="margin-bottom:0">C’est un outil de travail des adultes. Selon l’âge et la
situation, l’enfant peut y participer — savoir qu’on essaie quelque chose pour lui, et
qu’on regardera si ça marche, est en soi une information de qualité. Mais un tableau de
croix affiché dans le couloir, non.</p>`,
)}

<h3 style="${G.H3}">2. La lecture du quinzième jour, en quatre issues</h3>
<p>Comptez d’abord, lisez ensuite. Trois nombres&nbsp;: jours avec la conduite, jours où
le réglage a été tenu, et le nombre de jours «&nbsp;autre chose&nbsp;».</p>
${A.tableau(
  ['Ce que dit le relevé', 'Ce que ça veut dire', 'Ce qu’on fait'],
  [
    [
      'La conduite <strong>diminue</strong>, le réglage est tenu presque tous les jours.',
      'L’hypothèse tenait, au moins en partie. C’est le cas le plus fréquent quand le réglage touche la nourriture, la nuit ou l’espace.',
      '<strong>On garde le réglage définitivement</strong> — pas «&nbsp;encore un mois&nbsp;». Et on n’en ajoute pas d’autre avant six semaines.',
    ],
    [
      'La conduite ne bouge pas, le réglage <strong>a été tenu</strong>.',
      'L’hypothèse était mauvaise, ou insuffisante. C’est une vraie information, et c’est une réussite du parcours&nbsp;: on a éliminé une piste en quinze jours au lieu de la discuter pendant un an.',
      'On reprend la ligne&nbsp;2 de la fiche et on essaie <strong>la deuxième hypothèse</strong>. C’est exactement pour cela qu’on en écrit deux.',
    ],
    [
      'La conduite ne bouge pas, le réglage <strong>n’a pas été tenu</strong> (moins de douze jours sur quinze).',
      'Rien n’a été testé. C’est le résultat le plus fréquent, et ce n’est pas un échec de l’équipe&nbsp;: c’est un réglage trop coûteux.',
      'On <strong>réduit le réglage</strong> jusqu’à ce qu’il soit tenable, et on refait quinze jours. Un réglage dérisoire tenu vaut mieux qu’un beau réglage oublié.',
    ],
    [
      'La conduite <strong>augmente</strong>.',
      'Ce n’est pas nécessairement mauvais&nbsp;: une chose qu’on rend possible se voit d’abord davantage. Mais cela peut aussi signaler autre chose.',
      'On regarde la colonne&nbsp;3 (visite, audience, changement), <strong>et on vérifie le corps</strong>&nbsp;: douleur, sommeil, traitement. Si la situation se dégrade, on suspend et on en parle — un relevé ne se poursuit pas contre l’intérêt d’un enfant.',
    ],
  ],
)}
<p><strong>Deux des quatre issues sont des réussites</strong>, et il faut le dire aux
équipes&nbsp;: éliminer une hypothèse en quinze jours vaut mieux que la débattre en
réunion pendant six mois.</p>

<h3 style="${G.H3}">3. Écrire dans un rapport sans poser de diagnostic</h3>
<p>Ce que vous écrivez sera lu par un cadre, un référent, parfois un juge, et il restera
plus longtemps dans la vie de cet enfant que vous. Trois règles, et une interdiction.</p>
<ul style="${G.UL}">
<li style="${G.LI}"><strong>Des faits d’abord</strong>&nbsp;: ce qui se voit, la
fréquence, la période.</li>
<li style="${G.LI}"><strong>L’hypothèse ensuite, signalée comme telle</strong>&nbsp;:
«&nbsp;l’équipe a fait l’hypothèse que…&nbsp;», «&nbsp;une piste envisagée
était…&nbsp;».</li>
<li style="${G.LI}"><strong>L’essai et son résultat</strong>&nbsp;: ce qui a été mis en
place, sur quelle période, et ce que cela a donné. C’est la partie qui manque presque
toujours, et c’est la seule qui montre un travail.</li>
<li style="${G.LI}"><strong>Jamais de diagnostic, ni de vocabulaire clinique.</strong>
«&nbsp;Troubles de l’attachement&nbsp;», «&nbsp;profil traumatique&nbsp;»,
«&nbsp;syndrome&nbsp;», «&nbsp;état limite&nbsp;» ne s’écrivent pas sous une signature
éducative. Ce n’est pas de la prudence excessive&nbsp;: c’est ce qui distingue un écrit
professionnel d’un écrit qui sera retourné contre son auteur.</li>
</ul>
${A.tableau(
  ['À ne pas écrire', 'Pourquoi', 'À écrire'],
  [
    [
      'Yasmine présente des troubles de l’attachement.',
      'Un diagnostic, posé par quelqu’un dont ce n’est pas la fonction. Il suivra le dossier et orientera tout ce qui suivra.',
      'Yasmine constituait des réserves de nourriture dans sa chambre (quatre fois en six semaines). L’équipe a fait l’hypothèse d’une insécurité alimentaire antérieure.',
    ],
    [
      'Transgression répétée du règlement, opposition passive.',
      'Trois qualifications, aucun fait, et une lecture qui ferme le dossier.',
      'Le rappel du règlement n’a pas fait cesser les réserves. Une corbeille en accès libre a été installée le 12&nbsp;; les réserves ont cessé en huit jours.',
    ],
    [
      'Refuse l’aide et se met en échec.',
      'Prête une intention, et transforme une conduite en trait de caractère.',
      'Les propositions d’aide sur les devoirs sont refusées. L’aide apportée sans être annoncée (s’installer à côté sans proposer) est acceptée trois fois sur quatre.',
    ],
    [
      'Manipulateur, ment en permanence.',
      'Un jugement moral. Écrit une fois, il détermine la façon dont l’enfant sera lu pendant des années.',
      'Des inexactitudes portant sur des faits sans enjeu sont fréquentes. Elles diminuent lorsque les faits sont repris sans demander d’aveu.',
    ],
    [
      'Son histoire explique ce comportement.',
      'Affirme un lien de cause qu’on ne peut pas établir, et clôt la recherche.',
      'Hypothèse formulée par l’équipe, testée du 12 au 27 par la mise en place de …&nbsp;; résultat&nbsp;: …',
    ],
  ],
)}
<div style="${G.GRIS}">
<p style="margin:0"><strong>Le test&nbsp;:</strong> accepteriez-vous que cet enfant lise
cette phrase à dix-huit ans, en consultant son dossier&nbsp;? Beaucoup le font, et ce
qu’ils y trouvent compte. Une phrase qui ne passe pas ce test se réécrit.</p>
</div>

<h3 style="${G.H3}">4. Ce qui ne relève pas de vous</h3>
<p>Ce parcours travaille le quotidien, et le quotidien est décisif&nbsp;: c’est là que se
répare une partie de ce qui a été abîmé. Mais il y a des choses qu’il ne fait pas, et
savoir les passer fait partie du métier.</p>
${A.tableau(
  ['Ce que vous constatez', 'À qui cela revient'],
  [
    [
      'Une souffrance psychique&nbsp;: idées noires, retrait durable, angoisses envahissantes, gestes auto-agressifs.',
      'Un soignant, sans délai, et une transmission au cadre le jour même. Aucune lecture éducative ne remplace cela.',
    ],
    [
      'Des révélations sur ce qui s’est passé avant.',
      'On écoute, on ne questionne pas, on note les mots exacts, et on transmet selon la procédure du service. On ne mène pas d’enquête, et on ne promet pas le secret.',
      ],
    [
      'Une conduite nouvelle, brutale, ou qui change de forme.',
      'Un avis médical avant toute lecture de l’histoire — douleur, sommeil, traitement, puberté.',
    ],
    [
      'Un doute sur un trouble du neurodéveloppement jamais repéré.',
      'Le médecin, et une demande de bilan. Une grande partie des enfants confiés en présentent un, et les conduites qui en découlent se travaillent avec d’autres outils.',
    ],
    [
      'Une équipe ou une famille d’accueil qui n’en peut plus.',
      'Cela se dit, tôt. Un appui demandé à temps évite une fin d’accueil dans l’urgence — dont l’enfant paierait le prix une fois de plus.',
    ],
  ],
)}
<p>Aucune de ces lignes n’est un constat d’échec. Ce sont les moments où la bonne
compétence consiste à passer la main.</p>

<h3 style="${G.H3}">5. Après le quinzième jour</h3>
<ul style="${G.UL}">
<li style="${G.LI}"><strong>Un réglage qui a marché ne se retire pas.</strong> Il devient
la façon dont la maison fonctionne, pour tout le monde. C’est d’ailleurs souvent ce qui
arrive&nbsp;: la corbeille profite à tous les jeunes du groupe.</li>
<li style="${G.LI}"><strong>On n’ajoute pas le suivant tout de suite.</strong> Six
semaines de stabilité avant d’en installer un deuxième&nbsp;: sinon plus rien n’est
attribuable, et l’équipe s’épuise.</li>
<li style="${G.LI}"><strong>La fiche se garde.</strong> Elle est ce qu’on transmet au lieu
suivant — bien plus utile qu’un résumé de comportements, et c’est ce qui évite au
prochain de recommencer à zéro.</li>
</ul>`,
  aRetenir:
    'Deux des quatre issues sont des réussites&nbsp;: la conduite diminue, ou <strong>l’hypothèse est éliminée en quinze jours</strong>. Et un écrit professionnel contient des faits, une hypothèse signalée comme telle, et ce qu’on a essayé — jamais un diagnostic.',
  exercice: {
    nom: 'La lecture du quinzième jour',
    duree: '12 minutes, le relevé sous les yeux',
    quoi: 'Feuille en main, pas de mémoire.',
    etapes: [
      'Comptez la colonne 1 : combien de jours la conduite était-elle présente ? Comparez la première semaine et la seconde.',
      'Comptez la colonne 2 : combien de jours le réglage a-t-il été tenu ? En dessous de douze sur quinze, rien n’a été testé — c’est la première conclusion.',
      'Regardez la colonne 3 : les jours qui sortent du lot correspondent-ils à un événement ?',
      'Placez-vous dans une des quatre issues du point 2, et écrivez laquelle.',
      'Écrivez la suite : garder le réglage, essayer la deuxième hypothèse, réduire le réglage, ou suspendre et transmettre. Avec une date.',
      'Rédigez le paragraphe de rapport : faits, hypothèse signalée comme telle, essai et résultat. Passez-le au test de la lecture à dix-huit ans.',
    ],
    reussi:
      'vous avez trois nombres, une issue choisie parmi les quatre, une suite datée, et un paragraphe de rapport sans aucun mot de diagnostic.',
  },
  carnet: {
    intro: 'Les dernières lignes du carnet. Elles constituent votre bilan.',
    lignes: [
      '<strong>Jours avec la conduite</strong> — semaine 1, semaine 2.',
      '<strong>Jours où le réglage a été tenu</strong> — sur quinze.',
      '<strong>Les jours qui sortent du lot</strong> — et ce qui s’y est passé.',
      '<strong>Mon issue</strong> — parmi les quatre.',
      '<strong>Ma suite et sa date</strong>, et mon paragraphe de rapport.',
    ],
  },
  vigilance: [
    '<strong>Un relevé ne se poursuit pas contre l’intérêt d’un enfant.</strong> Si la situation se dégrade, on suspend, on transmet, et on reprend plus tard.',
    '<strong>N’écrivez jamais de diagnostic sous une signature éducative</strong>, même repris d’un autre écrit. Citez la source et le professionnel qui l’a posé, ou n’écrivez rien.',
    '<strong>Une hypothèse éliminée est un résultat</strong>, et cela se dit en réunion : sinon les équipes n’essaient plus rien, de peur de « se tromper ».',
    '<strong>Ne cumulez pas les réglages.</strong> Six semaines de stabilité avant le suivant, sinon plus rien n’est attribuable et l’équipe s’use.',
    '<strong>Ce parcours ne remplace ni le soin, ni le cadre judiciaire, ni les transmissions.</strong> Il rend le quotidien plus juste — et le quotidien est déjà beaucoup.',
  ],
  annexes:
    'le <strong>relevé de quinze jours</strong> à trois colonnes, la <strong>fiche de lecture aux quatre issues</strong>, le <strong>tableau des phrases de rapport</strong>, et la <strong>fiche « à qui cela revient »</strong>.',
  avant: [
    'J’ai quinze jours de relevé, avec la colonne « réglage tenu » remplie.',
    'J’ai compté — pas estimé — les jours avec la conduite et les jours de réglage tenu.',
    'J’ai un paragraphe de rapport qui contient un fait, une hypothèse signalée comme telle, un essai et son résultat, et aucun mot de diagnostic.',
  ],
};

/* ── ANNEXES ─────────────────────────────────────────────────────────────── */

const ANNEXES =
  A.entete('Lire un comportement comme une réaction de survie') +
  A.fiche({
    numero: 1,
    titre: 'Sept conduites, et les contextes où elles étaient adaptées',
    quand: 'quand une conduite déroute. À lire comme une liste d’hypothèses, jamais comme une clé.',
    contenu:
      A.tableau(
        ['Ce qu’on observe', 'Le contexte où c’est une bonne idée', 'Ce que la réponse ordinaire confirme'],
        [
          ['<strong>Cacher de la nourriture</strong>', 'Là où la nourriture n’est pas garantie, en mettre de côté est rationnel.', 'Une fouille&nbsp;: la preuve que rien n’est garanti ici non plus.'],
          ['<strong>Ne pas dormir, dormir habillé</strong>', 'Là où la nuit est le moment où les choses arrivent, rester en alerte protège.', 'Une exigence d’extinction avant que la nuit ne soit rendue prévisible.'],
          ['<strong>Vérifier les portes, où sont les adultes</strong>', 'Savoir par où l’on peut partir est une compétence.', 'Une lecture en «&nbsp;agitation&nbsp;» ou en «&nbsp;provocation&nbsp;».'],
          ['<strong>Mentir sans enjeu</strong>', 'Là où dire vrai a coûté cher, le mensonge devient un réflexe, même sans rien à protéger.', 'Une confrontation, qui confirme que dire vrai coûte cher.'],
          ['<strong>S’occuper des plus petits, gérer les adultes</strong>', 'Là où un enfant a dû tenir la maison, prendre en charge est ce qu’il sait faire de mieux.', 'Des félicitations pour la maturité — et toujours aucun endroit où être un enfant.'],
          ['<strong>Tester la constance, faire monter</strong>', 'Là où les adultes partaient, savoir vite qui reste évite de s’attacher pour rien.', 'Un changement de lieu, qui confirme l’hypothèse de départ.'],
          ['<strong>Refuser toute aide</strong>', 'Là où l’aide a eu un prix, la refuser protège.', 'Un «&nbsp;refus d’accompagnement&nbsp;» au dossier, et un jeune qu’on laisse tranquille.'],
        ],
      ) +
      `<div style="${G.GRIS}">
<p style="margin:0"><strong>La question à poser&nbsp;:</strong> pas «&nbsp;pourquoi il me
fait ça&nbsp;?&nbsp;» mais <strong>«&nbsp;à quoi cela a-t-il pu servir, là d’où il
vient&nbsp;?&nbsp;»</strong> — et on en cherche deux, pas une&nbsp;: une hypothèse seule
devient vite une certitude.</p>
</div>`,
  }) +
  A.fiche({
    numero: 2,
    titre: 'Ce qui ne se lit PAS comme une réaction de survie',
    quand: 'avant toute lecture de l’histoire. À chaque fois.',
    contenu: `<div style="${G.ALERTE}">
<p style="margin-top:0"><strong>On ne remplace jamais un examen par une
hypothèse.</strong> C’est là que cette grille de lecture fait le plus de dégâts&nbsp;:
appliquée à tout, elle retarde des réponses simples pendant des mois.</p>
<ul style="${G.UL}">
<li style="${G.LI}"><strong>La douleur</strong> — dents, oreilles, ventre, règles, douleur
chronique jamais explorée. Elle produit irritabilité, refus et crises, et elle est
régulièrement manquée chez les enfants qui parlent peu ou qu’on n’écoute plus.</li>
<li style="${G.LI}"><strong>La faim et le sommeil</strong> — un enfant qui dort cinq
heures n’a pas un problème de comportement.</li>
<li style="${G.LI}"><strong>La vue et l’audition</strong> — un bilan jamais fait explique
parfois trois ans de «&nbsp;n’écoute pas&nbsp;».</li>
<li style="${G.LI}"><strong>Un traitement</strong> commencé, arrêté ou modifié.</li>
<li style="${G.LI}"><strong>Un trouble du neurodéveloppement non repéré</strong> — fréquent
chez les enfants confiés, et il se travaille avec d’autres outils.</li>
<li style="${G.LI}"><strong>La puberté, un deuil, un événement récent</strong> dont
personne ne vous a parlé.</li>
</ul>
<p style="margin-bottom:0"><strong>Le réflexe&nbsp;:</strong> une conduite nouvelle, qui
s’aggrave, ou qui s’accompagne de signes physiques&nbsp;→ avis médical d’abord.</p>
</div>
<h4 style="margin:30px 0 8px">Et les trois pièges de la lecture</h4>
<ul style="${G.UL}">
<li style="${G.LI}"><strong>Elle explique tout</strong> — donc plus rien. Une grille qui
rend compte de toutes les conduites n’est plus une hypothèse, c’est une croyance.</li>
<li style="${G.LI}"><strong>Elle excuse tout</strong> — et retire à l’enfant toute prise
sur ce qu’il fait. Le cadre protège&nbsp;; il n’est pas l’ennemi de la
compréhension.</li>
<li style="${G.LI}"><strong>Elle remplace l’action</strong> — le piège principal. La
réunion est excellente, tout le monde est ému, et rien ne change le lendemain.</li>
</ul>
<div style="${G.GRIS}">
<p style="margin:0"><strong>Le test de la lecture utile&nbsp;:</strong> qu’est-ce qui
<strong>sera différent demain matin</strong> dans le quotidien de cet enfant&nbsp;? Si
personne ne peut le dire en une phrase, la réunion n’est pas finie.</p>
</div>`,
  }) +
  A.fiche({
    numero: 3,
    titre: 'La fiche lecture → réglage, en cinq lignes',
    quand: 'une fois par conduite travaillée. À porter en réunion.',
    contenu: `<div style="${G.GRIS}">
<p style="margin-top:0"><strong>Pour&nbsp;:</strong> ……………………… &nbsp;·&nbsp;
<strong>écrite le&nbsp;:</strong> …… / …… &nbsp;·&nbsp; <strong>revue le&nbsp;:</strong>
…… / ……</p>
<p style="margin:16px 0 0"><strong>1. La conduite</strong> (quoi, quand, fréquence — aucun
adjectif)&nbsp;: ………………………………………………………………………</p>
<p style="margin:16px 0 0"><strong>2. Mes deux hypothèses</strong> (deux contextes où ce
serait une bonne idée)&nbsp;: ………………………………………… / …………………………………………</p>
<p style="margin:16px 0 0"><strong>3. Ce que notre réponse actuelle enseigne</strong>
(sur la réponse, jamais sur une personne)&nbsp;: ………………………………………………………</p>
<p style="margin:16px 0 0"><strong>4. Le réglage</strong> (ce qui sera différent demain
matin — un seul)&nbsp;: ………………………………………………………………………………</p>
<p style="margin:16px 0 0"><strong>5. La date de revue et ce que je regarderai</strong>
(un chiffre, pas une impression)&nbsp;: ………………………………………………</p>
</div>
<h4 style="margin:30px 0 8px">Les cinq conditions du réglage</h4>
<ul style="${G.UL}">
<li style="${G.LI}"><strong>Petit</strong> — s’il demande une réorganisation ou un budget,
il ne sera pas en place lundi.</li>
<li style="${G.LI}"><strong>Permanent</strong> — jamais retiré, pas même un soir de
tension.</li>
<li style="${G.LI}"><strong>Sans adhésion requise</strong> — il ne se négocie pas, ne se
mérite pas, ne se retire pas.</li>
<li style="${G.LI}"><strong>Tenu par tout le monde</strong> — un remplaçant du samedi doit
pouvoir le tenir sans rien savoir de l’histoire.</li>
<li style="${G.LI}"><strong>Avec une date de revue</strong> — quinze jours, écrits.</li>
</ul>
<h4 style="margin:30px 0 8px">Les quatre phrases pour le porter en réunion</h4>
<div style="${G.GRIS}">
<p style="margin:0"><em>«&nbsp;Voilà ce qu’on observe. Voilà deux hypothèses. Voilà ce que
notre réponse actuelle enseigne, sans qu’on l’ait voulu. Je propose ce réglage-là pendant
quinze jours, et on regarde le [date]&nbsp;: si ça ne change rien, l’hypothèse était
mauvaise et on essaie la seconde.&nbsp;»</em></p>
</div>`,
  }) +
  A.fiche({
    numero: 4,
    titre: 'Les huit réglages du quotidien',
    quand: 'au moment de choisir la ligne 4. Ce sont ceux que les équipes finissent par inventer.',
    contenu:
      A.tableau(
        ['Ce qui est en jeu', 'Le réglage', 'Ce qui le fait échouer'],
        [
          ['<strong>La nourriture</strong>', 'Corbeille de fruits, pain, gâteaux, accessible en permanence, dans un endroit ouvert, jamais retirée. Phrase dite une fois&nbsp;: «&nbsp;il y en a toujours, sers-toi sans demander&nbsp;».', 'La retirer un soir parce que quelqu’un s’est trop servi. Une fois retirée, elle n’a plus de valeur.'],
          ['<strong>La nuit</strong>', 'Dire qui est là la nuit, où il est, comment on l’appelle. Veilleuse, porte entrouverte au choix de l’enfant.', 'Exiger l’extinction et le silence avant d’avoir rendu la nuit prévisible.'],
          ['<strong>L’espace personnel</strong>', 'On frappe, on n’entre pas en son absence. Si une vérification est nécessaire&nbsp;: écrite, annoncée, faite avec lui.', 'Une vérification «&nbsp;pour son bien&nbsp;» pendant qu’il est au collège.'],
          ['<strong>Savoir où sont les adultes</strong>', 'Tableau à l’entrée&nbsp;: prénoms présents, heure de départ, qui prend le relais. Mis à jour à chaque relève.', 'Le laisser périmé deux jours&nbsp;: un support faux enseigne la méfiance.'],
          ['<strong>Départs et retours</strong>', 'Annoncer les absences la veille — congés, arrêts, changement d’équipe — et dire quand on revient. Y compris pour un départ définitif.', 'Ne rien dire «&nbsp;pour ne pas l’inquiéter&nbsp;». Il l’apprendra autrement.'],
          ['<strong>Les affaires personnelles</strong>', 'Valise, sac, boîte à soi. Rien ne se transporte en sac poubelle, jamais, y compris dans l’urgence.', 'L’urgence, précisément — et c’est ce dont les jeunes se souviennent vingt ans après.'],
          ['<strong>Les visites</strong>', 'Dire à l’avance ce qui est prévu, ce qui n’est pas garanti, ce qui se passe si elle n’a pas lieu. Prévoir le retour&nbsp;: du temps, peu de demandes, personne qui interroge.', 'Traiter l’état d’après-visite comme un problème de comportement.'],
          ['<strong>Le mensonge sans enjeu</strong>', 'Ne pas en faire un sujet, ne pas piéger. Reprendre le fait sans demander d’aveu&nbsp;: «&nbsp;le verre est cassé, on le ramasse ensemble.&nbsp;»', 'La confrontation&nbsp;: elle n’obtient jamais la vérité et confirme que dire vrai coûte cher.'],
        ],
      ) +
      `<div style="${G.ALERTE}">
<p style="margin:0"><strong>Un réglage n’est jamais une récompense.</strong> Le retirer un
soir de tension annule tout le travail et confirme la leçon d’origine&nbsp;: ce qui est
donné se reprend. S’il pose un vrai problème, il se modifie <strong>à froid, en
réunion</strong>, et le changement s’annonce à l’enfant.</p>
</div>`,
  }) +
  A.fiche({
    numero: 5,
    titre: 'La scène de Yasmine, corrigée étape par étape',
    quand: 'comme modèle, à côté de votre propre situation.',
    contenu:
      A.tableau(
        ['Ce qui a été fait', 'Ce que ça enseignait', 'Ce qui aurait pu être fait'],
        [
          [
            'On trouve les provisions et on en fait un sujet.',
            'Ma réserve n’est pas en sécurité — l’information exacte contre laquelle la réserve existait.',
            'Installer d’abord une corbeille en accès libre. Ne pas parler de la chambre pendant deux ou trois semaines.',
          ],
          [
            '«&nbsp;Tu n’as pas besoin de faire ça, tu ne manqueras de rien.&nbsp;»',
            'Une promesse d’adulte de plus, que rien dans la maison ne rend vérifiable.',
            'Une phrase adossée à quelque chose de visible&nbsp;: «&nbsp;là, il y en a toujours. Tu peux te servir quand tu veux, sans demander.&nbsp;»',
          ],
          [
            'Deuxième rappel du règlement, plus ferme.',
            'Le sujet devient l’obéissance&nbsp;; le besoin d’origine n’est traité par personne.',
            'Ne pas y revenir. Regarder si les réserves diminuent depuis la corbeille&nbsp;: c’est la seule question utile.',
          ],
          [
            'Vérification de la chambre en son absence.',
            'Mon espace n’est pas à moi. Pour une adolescente placée, l’information la plus coûteuse de la scène.',
            'Rien sans elle. Une odeur ou une denrée périmée se traite ensemble&nbsp;: «&nbsp;on regarde ce qui est encore bon, on jette le reste, et je te montre où il y en a toujours.&nbsp;»',
          ],
          [
            'Elle cesse de manger avec le groupe.',
            'Le seul terrain qui lui reste.',
            'Une perte de poids se signale au médecin le jour même, quelle que soit l’explication qu’on lui trouve.',
          ],
          [
            '«&nbsp;Refus alimentaire, transgression répétée, opposition passive.&nbsp;»',
            'Trois qualifications, aucun fait, une lecture qui ferme le dossier et le suivra.',
            '«&nbsp;Réserves de nourriture (4 fois en 6 semaines). Hypothèse&nbsp;: insécurité alimentaire antérieure. Corbeille en accès libre installée le 12&nbsp;; réserves arrêtées en 8 jours.&nbsp;»',
          ],
        ],
      ) +
      `<div style="${G.GRIS}">
<p style="margin:0"><strong>La règle qui sort de cette scène&nbsp;:</strong> une règle qui
retire une sécurité <strong>doit être précédée de ce qui la remplace</strong>. Dans le
désordre, n’importe quel règlement — même fondé, même bien expliqué — produit exactement
ce qu’il voulait éviter.</p>
</div>`,
  }) +
  A.fiche({
    numero: 6,
    titre: 'Le relevé de quinze jours',
    quand: 'chaque soir pendant la période d’essai. Trente secondes.',
    contenu:
      A.tableau(
        ['Jour', 'Conduite présente ?', 'Réglage tenu ?', 'Autre chose ce jour-là (3 mots)'],
        [
          ['J1', '', '', ''], ['J2', '', '', ''], ['J3', '', '', ''], ['J4', '', '', ''],
          ['J5', '', '', ''], ['J6', '', '', ''], ['J7', '', '', ''],
          ['<strong>Total S1</strong>', '', '', ''],
          ['J8', '', '', ''], ['J9', '', '', ''], ['J10', '', '', ''], ['J11', '', '', ''],
          ['J12', '', '', ''], ['J13', '', '', ''], ['J14', '', '', ''], ['J15', '', '', ''],
          ['<strong>Total S2</strong>', '', '', ''],
        ],
      ) +
      `<div style="${G.GRIS}">
<p style="margin-top:0"><strong>La colonne&nbsp;2 explique tout le reste.</strong> Un
réglage tenu moins de douze jours sur quinze n’a pas été testé&nbsp;: la seule conclusion
possible est qu’il était trop coûteux.</p>
<p style="margin-bottom:0">La colonne&nbsp;3 sauve les relevés en dents de scie&nbsp;:
visite, audience, changement d’équipe, malade, appel de la famille, retour de week-end.
Sans elle, ces jours-là paraissent inexplicables.</p>
</div>`,
  }) +
  A.fiche({
    numero: 7,
    titre: 'La lecture du quinzième jour — quatre issues',
    quand: 'le quinzième jour, le relevé sous les yeux.',
    contenu:
      `<div style="${G.GRIS}">
<p style="margin:0"><strong>Mes trois nombres&nbsp;:</strong> conduite présente ……&nbsp;/&nbsp;15
&nbsp;·&nbsp; réglage tenu ……&nbsp;/&nbsp;15 &nbsp;·&nbsp; jours «&nbsp;autre
chose&nbsp;» ……</p>
</div>` +
      A.tableau(
        ['Ce que dit le relevé', 'Ce que ça veut dire', 'Ce qu’on fait'],
        [
          ['La conduite <strong>diminue</strong>, réglage tenu.', 'L’hypothèse tenait, au moins en partie.', '<strong>On garde le réglage définitivement</strong>, et on n’en ajoute pas d’autre avant six semaines.'],
          ['La conduite ne bouge pas, réglage <strong>tenu</strong>.', 'L’hypothèse était mauvaise. <strong>C’est une réussite du parcours</strong>&nbsp;: une piste éliminée en quinze jours plutôt que débattue un an.', 'On essaie <strong>la deuxième hypothèse</strong> de la ligne 2. C’est pour cela qu’on en écrit deux.'],
          ['La conduite ne bouge pas, réglage <strong>non tenu</strong> (moins de 12/15).', 'Rien n’a été testé. Ce n’est pas un échec de l’équipe&nbsp;: le réglage était trop coûteux.', 'On le <strong>réduit</strong> jusqu’à ce qu’il soit tenable, et on refait quinze jours.'],
          ['La conduite <strong>augmente</strong>.', 'Parfois normal&nbsp;: ce qu’on rend possible se voit d’abord davantage. Parfois le signe d’autre chose.', 'Regarder la colonne 3, <strong>et vérifier le corps</strong>. Si la situation se dégrade&nbsp;: suspendre, transmettre, reprendre plus tard.'],
        ],
      ) +
      `<div style="${G.GRIS}">
<p style="margin-top:0"><strong>Ma suite&nbsp;:</strong> …………………………………………………………</p>
<p style="margin-bottom:0"><strong>Je la vérifie le&nbsp;:</strong> …… / …… / ……</p>
</div>
<p><strong>Un réglage qui a marché ne se retire pas</strong>&nbsp;: il devient la façon
dont la maison fonctionne, pour tout le monde. Et <strong>la fiche se garde</strong> —
c’est ce qu’on transmet au lieu suivant, bien plus utile qu’un résumé de comportements.</p>`,
  }) +
  A.fiche({
    numero: 8,
    titre: 'Écrire dans un rapport — tableau des phrases',
    quand: 'à chaque écrit : note, rapport, projet, transmission au référent.',
    contenu:
      A.tableau(
        ['À ne pas écrire', 'Pourquoi', 'À écrire'],
        [
          [
            'Présente des troubles de l’attachement. / Profil traumatique.',
            'Un diagnostic, posé par quelqu’un dont ce n’est pas la fonction. Il suivra le dossier et orientera tout ce qui viendra après.',
            'Constituait des réserves de nourriture dans sa chambre (4 fois en 6 semaines). L’équipe a fait l’hypothèse d’une insécurité alimentaire antérieure.',
          ],
          [
            'Transgression répétée du règlement, opposition passive.',
            'Trois qualifications, aucun fait, et une lecture qui ferme le dossier.',
            'Le rappel du règlement n’a pas fait cesser les réserves. Une corbeille en accès libre a été installée le 12&nbsp;; les réserves ont cessé en 8 jours.',
          ],
          [
            'Refuse l’aide et se met en échec.',
            'Prête une intention et transforme une conduite en trait de caractère.',
            'Les propositions d’aide sur les devoirs sont refusées. L’aide apportée sans être annoncée est acceptée trois fois sur quatre.',
          ],
          [
            'Manipulateur, ment en permanence.',
            'Un jugement moral qui déterminera la façon dont l’enfant sera lu pendant des années.',
            'Des inexactitudes portant sur des faits sans enjeu sont fréquentes. Elles diminuent lorsque les faits sont repris sans demander d’aveu.',
          ],
          [
            'Son histoire explique ce comportement.',
            'Affirme un lien de cause qu’on ne peut pas établir, et clôt la recherche.',
            'Hypothèse formulée par l’équipe, testée du 12 au 27 par la mise en place de …&nbsp;; résultat&nbsp;: …',
          ],
          [
            'Va mieux / va moins bien depuis…',
            'Sans fait ni période, la phrase ne se compare à rien d’un rapport à l’autre.',
            'Trois épisodes en janvier, un en février, aucun en mars. Le réglage mis en place le 12 janvier est maintenu.',
          ],
        ],
      ) +
      `<div style="${G.GRIS}">
<p style="margin:0"><strong>Le test&nbsp;:</strong> accepteriez-vous que cet enfant lise
cette phrase à dix-huit ans, en consultant son dossier&nbsp;? Beaucoup le font, et ce
qu’ils y trouvent compte. Une phrase qui ne passe pas ce test se réécrit.</p>
</div>
<p><strong>Et une règle sans exception&nbsp;:</strong> aucun diagnostic ni vocabulaire
clinique sous une signature éducative, même repris d’un autre écrit. On cite la source et
le professionnel qui l’a posé, ou on n’écrit rien.</p>`,
  }) +
  A.fiche({
    numero: 9,
    titre: 'À qui cela revient — la fiche à garder sous la main',
    quand: 'à lire une fois maintenant, pour ne pas la chercher un soir difficile.',
    contenu:
      A.tableau(
        ['Ce que vous constatez', 'Ce que ça demande'],
        [
          [
            'Souffrance psychique&nbsp;: idées noires, retrait durable, angoisses envahissantes, gestes auto-agressifs.',
            'Un soignant, sans délai, et une transmission au cadre le jour même. Aucune lecture éducative ne remplace cela.',
          ],
          [
            'Des révélations sur ce qui s’est passé avant.',
            'On écoute, on ne questionne pas, on note les mots exacts, on transmet selon la procédure du service. On ne mène pas d’enquête, et on ne promet jamais le secret.',
          ],
          [
            'Une conduite nouvelle, brutale, ou qui change de forme.',
            'Un avis médical avant toute lecture de l’histoire&nbsp;: douleur, sommeil, traitement, puberté.',
          ],
          [
            'Un doute sur un trouble du neurodéveloppement jamais repéré.',
            'Le médecin, et une demande de bilan. Les conduites qui en découlent se travaillent avec d’autres outils — les autres parcours de ce catalogue.',
          ],
          [
            'Une perte de poids, un refus alimentaire durable.',
            'Un signe médical avant d’être un signe éducatif. Le médecin, quelle que soit l’explication qu’on lui trouve.',
          ],
          [
            'Une équipe, ou une famille d’accueil, qui n’en peut plus.',
            'Cela se dit tôt. Un appui demandé à temps évite une fin d’accueil dans l’urgence — dont l’enfant paierait le prix une fois de plus.',
          ],
        ],
      ) +
      `<p><strong>Aucune de ces lignes n’est un constat d’échec.</strong> Ce sont les
moments où la bonne compétence professionnelle consiste à passer la main, et savoir le
faire au bon moment fait partie du métier.</p>`,
  }) +
  A.pied();

module.exports = {
  slug: 'lire-un-comportement-comme-une-reaction-de-survie',
  uuid: 'f365d1de-dd74-4651-ba78-54f340387845',
  modules: [
    { titre: 'Module 1 — Changer de question, et les trois pièges', minutes: 12, html: G.assembler(M1) },
    { titre: 'Module 2 — Une réponse raisonnable qui confirme tout', minutes: 10, html: G.assembler(M2) },
    { titre: 'Module 3 — Exercice guidé : de la lecture au réglage', minutes: 12, html: G.assembler(M3) },
    { titre: 'Module 4 — Quinze jours, et ce qu’on écrit dans un rapport', minutes: 12, html: G.assembler(M4) },
  ],
  annexes: ANNEXES,
};
