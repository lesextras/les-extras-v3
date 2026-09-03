/**
 * ⚠ FICHIER SUPERSÉDÉ — CONSERVÉ POUR MÉMOIRE, PLUS UTILISÉ PAR LA CHAÎNE.
 *
 * C'est la première écriture des deux formations « chaînage » et « support
 * visuel », au format v1 : environ 2 500 caractères par module, sans annexes,
 * sans carte « Repères », sans exercice chronométré. Elles ont été entièrement
 * réécrites au gabarit v3 dans `f4-chainage.js` et `f5-previsible.js`, qui sont
 * les seules sources lues par `build-v2.js`.
 *
 * Il n'est pas supprimé : les scènes et les tournures d'origine ont servi de
 * base à la réécriture, et il documente d'où viennent ces deux parcours. Mais
 * RIEN NE DOIT PLUS ÊTRE CORRIGÉ ICI — une correction faite dans ce fichier ne
 * partirait nulle part.
 */

/**
 * VAGUE 2 — les deux compétences qui complètent la thématique TSA.
 *
 * Même gabarit que la vague 1 (théorie brève → situation qui dérape →
 * exercice guidé → mise en pratique et auto-observation), mêmes garde-fous.
 * Les constantes communes sont importées, jamais recopiées : une correction
 * sur l'attestation ou sur l'encart de nuance doit se propager partout.
 *
 * ⚠ RÈGLE TENUE ICI COMME AILLEURS : aucun nom de programme déposé, aucune
 * vignette empruntée, aucun curriculum recopié. La séquence pédagogique est
 * une structure, elle se reprend ; un contenu de programme, non.
 */

const {
  ATTESTATION,
  AVERTISSEMENT,
  NUANCE_COMPORTEMENTALE,
} = require('./catalogue-mini-formations.js');

/* ══════════════════════════════════════════════════════════════════════════
   TSA 4 — LE CHAÎNAGE
   Compétence : découper une routine en étapes enseignables et choisir par
   quelle extrémité commencer. C'est la formation qui répond à « il ne sait
   pas s'habiller » — une phrase qui ne dit rien tant qu'on n'a pas su dire
   à QUELLE étape précise ça bloque.
   ══════════════════════════════════════════════════════════════════════════ */

const CHAINAGE = {
  slug: 'decomposer-une-routine-en-etapes',
  thematique: 'TSA, communication et comportement',
  nom: 'Décomposer une routine en étapes',
  competence:
    'Découper une routine du quotidien en étapes enseignables et choisir par quelle extrémité commencer',
  trouble:
    'Troubles du spectre de l’autisme, troubles du neurodéveloppement, déficience intellectuelle',
  resume:
    '« Il ne sait pas s’habiller » ne se travaille pas. « Il bloque à l’étape 4 sur 9 » se travaille. Découper une routine, tester où ça coince, et décider si on enseigne par le début ou par la fin.',
  modules: [
    {
      titre: 'Module 1 — La théorie, en huit minutes',
      minutes: 8,
      html: `<h2>Une routine n’est pas une compétence, c’est une suite de compétences</h2>
<p>«&nbsp;Il ne sait pas s’habiller.&nbsp;» «&nbsp;Elle n’arrive pas à se laver les mains.&nbsp;»
«&nbsp;Il faut tout faire à sa place pour le repas.&nbsp;» Ces phrases décrivent un résultat, pas
un apprentissage. Elles ne disent pas ce qui est déjà acquis, ni où exactement ça s’arrête — et
tant qu’on ne le sait pas, on ne peut qu’aider globalement, c’est-à-dire faire à la place.</p>
<p>Un geste du quotidien est en réalité une <strong>chaîne</strong>&nbsp;: une suite d’étapes où
chaque étape sert de signal à la suivante. Enfiler un pull, ce n’est pas un geste, c’en est neuf.
Se laver les mains, sept. Mettre la table, six. Chacune de ces étapes est apprenable séparément,
et la plupart sont probablement déjà acquises.</p>
<h3>Écrire la chaîne : la règle du témoin</h3>
<p>Une bonne décomposition passe le test du témoin&nbsp;: une personne qui n’a jamais vu la
routine doit pouvoir l’exécuter en lisant votre liste, sans rien deviner. Si une étape contient
«&nbsp;et&nbsp;», c’est deux étapes. Si une étape contient un jugement
(«&nbsp;correctement&nbsp;», «&nbsp;proprement&nbsp;»), ce n’est pas une étape observable.</p>
<p>Exemple, se laver les mains&nbsp;: 1. ouvrir le robinet — 2. mouiller les deux mains —
3. prendre le savon — 4. frotter les paumes — 5. frotter le dos des mains — 6. rincer —
7. fermer le robinet — 8. essuyer. Huit étapes, chacune visible de l’extérieur.</p>
<h3>Puis mesurer : quelles étapes sont déjà là</h3>
<p>Avant d’enseigner quoi que ce soit, on regarde. On demande la routine complète, une seule fois,
sans aide, et on coche pour chaque étape&nbsp;: réussie seule / réussie avec une aide / non
réussie. Ce relevé s’appelle une <strong>ligne de base</strong>. Il tient sur une feuille et il
change complètement la conversation en équipe&nbsp;: on ne dit plus «&nbsp;il ne sait pas&nbsp;»,
on dit «&nbsp;six étapes sur huit sont acquises, ça bloque au rinçage et à l’essuyage&nbsp;».</p>
<h3>Trois façons d’enseigner une chaîne</h3>
<ul>
<li><p><strong>Par la fin (chaînage arrière).</strong> L’accompagnant fait les étapes 1 à 7, la
personne fait la 8 et termine seule. Puis elle fait 7 et 8. Puis 6, 7 et 8. L’avantage est
décisif&nbsp;: <em>la personne finit toujours la tâche</em>. Elle vit la réussite complète dès la
première séance, et ce qui la récompense — les mains propres, le pull mis, la table dressée —
arrive juste après ce qu’elle vient d’apprendre.</p></li>
<li><p><strong>Par le début (chaînage avant).</strong> La personne fait l’étape 1 seule, on
l’accompagne pour la suite. Utile quand les premières étapes sont les plus dures, ou quand la
routine est trop longue pour être tenue en entier.</p></li>
<li><p><strong>La chaîne entière avec aide dégressive.</strong> La personne exécute toute la
routine à chaque fois, l’accompagnant aide seulement là où c’est nécessaire, et retire son aide
étape par étape. C’est le choix quand la plupart des étapes sont déjà acquises&nbsp;: inutile de
découper ce qui roule.</p></li>
</ul>
<p><strong>Le choix par défaut est le chaînage arrière</strong> quand la routine est nouvelle ou
quand la personne se décourage vite. On passe à la chaîne entière quand la ligne de base montre
plus de la moitié des étapes déjà acquises seules.</p>
<h3>Une seule étape cible à la fois</h3>
<p>Le reste de la chaîne est accompagné sans hésitation, sans commentaire et sans lenteur. On ne
transforme pas toute la routine en leçon&nbsp;: on enseigne UNE étape, on assure toutes les
autres. Une routine entièrement transformée en exercice devient un moment pénible, et un moment
pénible est un moment qu’on finit par éviter.</p>`,
    },
    {
      titre: 'Module 2 — Une situation qui dérape, et pourquoi',
      minutes: 8,
      html: `<h2>Le manteau de Malik</h2>
<p>Malik a 9 ans, il est accueilli en IME. L’équipe a décidé de travailler «&nbsp;mettre son
manteau tout seul&nbsp;» avant la sortie. Voici la séance, telle qu’elle s’est passée.</p>
<div style="border-left:3px solid #d9cfc2;padding:2px 0 2px 16px;margin:18px 0">
<p><em>16&nbsp;h&nbsp;05. L’éducatrice&nbsp;: «&nbsp;Allez Malik, tu mets ton manteau tout seul
aujourd’hui.&nbsp;» Malik attrape le manteau par une manche et le tient devant lui. Il attend.</em></p>
<p><em>«&nbsp;Vas-y, tu sais faire.&nbsp;» Il ne bouge pas. «&nbsp;Regarde, il faut le mettre à
l’endroit d’abord.&nbsp;» Elle lui retourne le manteau. Il enfile un bras. «&nbsp;Voilà&nbsp;! Et
l’autre&nbsp;?&nbsp;» Il tourne sur lui-même en cherchant la deuxième manche. Trente secondes.
Les autres enfants sont déjà dans le couloir.</em></p>
<p><em>«&nbsp;Bon, attends.&nbsp;» Elle lui met la deuxième manche, remonte la fermeture éclair
et le pousse doucement vers la porte. «&nbsp;C’est bien, la prochaine fois tu le feras tout
seul.&nbsp;»</em></p>
</div>
<h3>Prenez trois minutes avant de lire la suite</h3>
<p>La séance n’a rien produit — ni apprentissage, ni information. Repérez ce qui a manqué
<em>avant</em> la séance, pas pendant.</p>
<hr style="height:1px;border:0;background:#e5e0d8;margin:24px 0">
<h3>Ce qui manquait</h3>
<ul>
<li><p><strong>Aucune chaîne écrite.</strong> «&nbsp;Mettre son manteau&nbsp;» n’est pas une
étape, c’en est six ou sept. Personne dans l’équipe ne pourrait dire lesquelles Malik réussit.</p></li>
<li><p><strong>Aucune étape cible.</strong> On lui a demandé la routine entière, sans aide,
d’un coup. C’est-à-dire tout, tout de suite — la seule consigne dont on est sûr qu’elle
échouera.</p></li>
<li><p><strong>L’aide est arrivée quand il a fallu partir, pas quand il a fallu apprendre.</strong>
Elle a fini la tâche à sa place sous la pression de l’horaire. Ce qui a été enseigné ce jour-là,
c’est&nbsp;: si j’attends assez longtemps, quelqu’un le fait.</p></li>
<li><p><strong>Le seul retour reçu est un reproche déguisé.</strong> «&nbsp;La prochaine fois tu
le feras tout seul&nbsp;» décrit un échec. Malik n’a rien fait de valorisable, alors qu’il a bel
et bien enfilé un bras seul.</p></li>
<li><p><strong>Le moment était mal choisi.</strong> Seize heures cinq, groupe qui part, couloir
qui attend&nbsp;: le pire créneau pour un apprentissage. Une chaîne s’enseigne quand on a le
temps de ne pas aider.</p></li>
</ul>
<h3>La même séance, autrement</h3>
<p>Chaîne écrite&nbsp;: 1. poser le manteau à l’endroit — 2. enfiler le bras droit — 3. passer
derrière le dos — 4. enfiler le bras gauche — 5. joindre le bas de la fermeture — 6. remonter la
fermeture. Ligne de base prise mardi&nbsp;: 1, 2 et 6 réussies seules, 3 et 4 avec aide, 5 jamais.</p>
<p>Étape cible retenue&nbsp;: la 5, en chaînage arrière — l’éducatrice fait 1 à 4, Malik joint le
bas de la fermeture et la remonte, donc <em>il termine</em>. La séance dure vingt secondes, elle
a lieu à 15&nbsp;h&nbsp;50 avant que le groupe ne s’agite, et elle se conclut sur ce qui s’est
réellement produit&nbsp;: «&nbsp;tu as accroché la fermeture tout seul, ton manteau est mis&nbsp;».</p>`,
    },
    {
      titre: 'Module 3 — Exercice guidé : écrire la chaîne et prendre la ligne de base',
      minutes: 10,
      html: `<h2>Vous allez décomposer une routine réelle</h2>
<p>Choisissez une routine que vous accompagnez en ce moment et qui vous coûte du temps tous les
jours&nbsp;: habillage, toilette, repas, préparation du sac, coucher. Une seule.</p>
<h3>Étape 1 — Écrire la chaîne (4 minutes)</h3>
<p>Numérotez les étapes. Contraintes&nbsp;: entre 5 et 12 étapes&nbsp;; un verbe d’action par
étape&nbsp;; aucun «&nbsp;et&nbsp;»&nbsp;; aucun adverbe de qualité. Puis passez le test du
témoin&nbsp;: relisez votre liste en vous demandant si quelqu’un qui n’a jamais vu la routine
pourrait l’exécuter sans rien deviner. Là où il devrait deviner, il manque une étape.</p>
<div style="background:#f7f4ee;border:1px solid #e5e0d8;border-radius:10px;padding:16px 18px;margin:18px 0">
<p style="margin:0"><strong>Erreur la plus fréquente&nbsp;:</strong> écrire les étapes du point de
vue de l’accompagnant («&nbsp;lui donner le savon&nbsp;») plutôt que de la personne
(«&nbsp;prendre le savon&nbsp;»). Une chaîne décrit ce que fait <em>la personne</em>. Si votre
liste contient ce que VOUS faites, réécrivez-la.</p>
</div>
<h3>Étape 2 — Prendre la ligne de base (à faire demain, 1 fois)</h3>
<p>Demandez la routine complète une seule fois, dans les conditions habituelles. Vous ne
corrigez pas, vous n’encouragez pas pendant, vous n’aidez que si la personne est bloquée depuis
plus de cinq secondes — et vous notez alors «&nbsp;avec aide&nbsp;».</p>
<p>Cochez pour chaque étape&nbsp;: <strong>S</strong> (seule) · <strong>A</strong> (avec aide) ·
<strong>N</strong> (non réussie). Ce relevé prend le temps de la routine, pas une minute de plus.</p>
<h3>Étape 3 — Choisir l’extrémité et l’étape cible (3 minutes)</h3>
<p>Comptez vos <strong>S</strong>. Puis appliquez la règle&nbsp;:</p>
<ul>
<li><p>Plus de la moitié des étapes en <strong>S</strong> → <em>chaîne entière avec aide
dégressive</em>. Étape cible&nbsp;: la première <strong>A</strong> ou <strong>N</strong> en
partant du début.</p></li>
<li><p>Moins de la moitié, ou personne qui se décourage vite → <em>chaînage arrière</em>. Étape
cible&nbsp;: la dernière étape non acquise en partant de la fin. Vous faites tout ce qui la
précède, la personne exécute la cible et termine la routine.</p></li>
</ul>
<h3>Étape 4 — Écrire la phrase de retour (2 minutes)</h3>
<p>Préparez à l’avance ce que vous direz juste après la réussite de l’étape cible. Elle doit
nommer le geste, pas la personne&nbsp;: «&nbsp;tu as accroché la fermeture tout seul&nbsp;»,
jamais «&nbsp;c’est bien, tu es un grand&nbsp;». Une phrase écrite d’avance est une phrase qui
sort au bon moment&nbsp;; une phrase improvisée devient «&nbsp;bravo&nbsp;» et n’enseigne rien.</p>
<h3>Ce que vous devez avoir sur votre feuille en sortant</h3>
<p>Une chaîne numérotée. Une colonne S/A/N à remplir. Un mode d’enseignement entouré. Une étape
cible entourée. Une phrase de retour écrite.</p>`,
    },
    {
      titre: 'Module 4 — Mise en pratique et auto-observation',
      minutes: 10,
      html: `<h2>Dix jours, une étape</h2>
<p>Le protocole tient en quatre lignes et il se répète à l’identique&nbsp;:</p>
<ol>
<li><p>Vous exécutez toutes les étapes hors cible sans commentaire, à vitesse normale.</p></li>
<li><p>Arrivé à l’étape cible, vous laissez cinq secondes de silence. Le silence est l’outil
principal&nbsp;: c’est lui qui laisse la place au geste.</p></li>
<li><p>Si rien ne vient, vous donnez l’aide <em>la plus légère</em> qui débloque&nbsp;: un geste
de la main vers l’objet avant de guider le poignet, un mot avant de montrer. Puis vous retirez
cette aide un cran à chaque séance.</p></li>
<li><p>Dès que l’étape est faite, votre phrase de retour, puis la routine se termine
normalement.</p></li>
</ol>
<h3>Le critère de passage, décidé maintenant</h3>
<p>On passe à l’étape suivante quand l’étape cible est réussie <strong>sans aide, trois fois de
suite</strong>. Ce critère se fixe avant de commencer, jamais au feeling du jour&nbsp;: décidé
sur le moment, il se déplace toujours au moment où l’on est fatigué ou pressé.</p>
<h3>Votre relevé, dix lignes</h3>
<p>Une ligne par jour&nbsp;: date · étape cible · aide utilisée (aucune / mot / geste montré /
main guidée) · réussi oui-non. Rien d’autre. Un relevé qui demande plus d’une minute n’est pas
tenu au-delà du troisième jour, et un relevé abandonné vaut moins qu’un relevé minuscule.</p>
<h3>Trois questions à vous poser au dixième jour</h3>
<ul>
<li><p><strong>L’aide a-t-elle diminué&nbsp;?</strong> Regardez la colonne «&nbsp;aide&nbsp;»
seule. Elle doit descendre. Si elle reste identique, votre étape est trop grosse&nbsp;:
découpez-la en deux.</p></li>
<li><p><strong>Ai-je aidé avant les cinq secondes&nbsp;?</strong> C’est l’erreur la plus commune
et la plus invisible. Elle vient de l’horaire, pas de la personne. Si oui, déplacez la séance de
quinze minutes plus tôt.</p></li>
<li><p><strong>La routine est-elle restée supportable&nbsp;?</strong> Si elle est devenue un
moment de tension, arrêtez l’enseignement une semaine et reprenez la routine accompagnée
normalement. Une compétence acquise dans un moment détesté ne se transfère nulle part.</p></li>
</ul>
<h3>Ce que vous savez faire maintenant</h3>
<p>Transformer une phrase qui ne se travaille pas — «&nbsp;il ne sait pas&nbsp;» — en une étape
précise, un mode d’enseignement justifié, un critère de passage et une trace écrite. C’est
exactement ce qui s’écrit dans un projet d’accompagnement et ce qui se transmet à un collègue
sans perdre le fil.</p>
${NUANCE_COMPORTEMENTALE}
${AVERTISSEMENT}
${ATTESTATION}`,
    },
  ],
};

/* ══════════════════════════════════════════════════════════════════════════
   TSA 5 — RENDRE L'ENVIRONNEMENT PRÉVISIBLE
   Compétence : construire un support visuel qui est réellement utilisé.
   La formation ne porte pas sur « faire des pictogrammes » — tout le monde
   en fait — mais sur les raisons pour lesquelles ils finissent scotchés au
   mur sans que personne ne les regarde.
   ══════════════════════════════════════════════════════════════════════════ */

const PREVISIBLE = {
  slug: 'rendre-l-environnement-previsible',
  thematique: 'TSA, communication et comportement',
  nom: 'Rendre l’environnement prévisible',
  competence:
    'Construire un support visuel qui est réellement consulté, et rendre le temps qui passe visible',
  trouble:
    'Troubles du spectre de l’autisme, troubles du neurodéveloppement, anxiété liée à l’imprévu',
  resume:
    'Tout le monde fabrique des pictogrammes ; presque personne ne les utilise trois semaines plus tard. Ce qui fait qu’un support tient, et comment rendre visible ce qui ne se voit pas : le temps, la fin, et ce qui vient après.',
  modules: [
    {
      titre: 'Module 1 — La théorie, en sept minutes',
      minutes: 7,
      html: `<h2>Ce qu’un support visuel remplace vraiment</h2>
<p>Une consigne parlée a trois défauts&nbsp;: elle disparaît en une seconde, elle exige de
comprendre au moment exact où elle est dite, et elle oblige à la redemander — ce qui coûte à
quelqu’un qui a du mal à demander. Un support visuel n’a aucun de ces défauts&nbsp;: il reste,
il se consulte plusieurs fois, et il se consulte <em>sans rien demander à personne</em>.</p>
<p>C’est ce dernier point qui compte le plus, et c’est celui qu’on oublie. Un support n’est pas
une aide à la compréhension&nbsp;: c’est une aide à l’<strong>autonomie</strong>. Il permet à
quelqu’un de savoir ce qui vient sans dépendre de la disponibilité d’un adulte.</p>
<h3>Trois choses différentes, souvent confondues</h3>
<ul>
<li><p><strong>L’emploi du temps</strong> répond à «&nbsp;qu’est-ce qui se passe
aujourd’hui&nbsp;?&nbsp;». Il couvre une demi-journée ou une journée, dans l’ordre.</p></li>
<li><p><strong>La séquence de tâche</strong> répond à «&nbsp;comment je fais ça&nbsp;?&nbsp;».
Elle couvre une routine, étape par étape (voir la formation sur le chaînage).</p></li>
<li><p><strong>Le repère de temps</strong> répond à «&nbsp;c’est encore long&nbsp;?&nbsp;». Il
rend visible une durée qui ne se voit pas.</p></li>
</ul>
<p>Un mur couvert d’images qui mélange les trois ne répond à aucune des trois questions. Un
support = une question.</p>
<h3>Les cinq raisons qui font qu’un support est abandonné</h3>
<ul>
<li><p><strong>Il est affiché, pas manipulé.</strong> Un panneau au mur se regarde une fois puis
devient du décor. Ce qui tient, c’est ce qu’on <em>déplace</em>&nbsp;: on retourne la carte, on la
décroche, on la met dans la pochette «&nbsp;fini&nbsp;». Le geste crée l’attention.</p></li>
<li><p><strong>Il ne dit pas où ça s’arrête.</strong> Une bande de dix images sans marque de fin
n’apaise personne. La question réelle n’est presque jamais «&nbsp;quoi&nbsp;?&nbsp;», c’est
«&nbsp;combien de temps encore&nbsp;?&nbsp;» et «&nbsp;qu’est-ce qu’il y a après&nbsp;?&nbsp;».</p></li>
<li><p><strong>Il est trop chargé.</strong> Douze vignettes pour une matinée&nbsp;: personne ne
tient la mise à jour, et un support faux est pire qu’un support absent — il apprend qu’on ne peut
pas s’y fier.</p></li>
<li><p><strong>Il n’appartient à personne.</strong> Si aucun nom n’est écrit en face de
«&nbsp;qui met à jour, et quand&nbsp;», la mise à jour ne se fait pas. C’est une question
d’organisation, pas de motivation.</p></li>
<li><p><strong>Le niveau de représentation est mal choisi.</strong> Un pictogramme abstrait pour
quelqu’un qui reconnaît les photos, ou l’inverse&nbsp;: on teste, on ne suppose pas.</p></li>
</ul>
<h3>Rendre le temps visible</h3>
<p>«&nbsp;Encore cinq minutes&nbsp;» ne veut rien dire pour qui ne lit pas l’heure. Ce qui
fonctionne&nbsp;: une durée qui <em>se voit diminuer</em> — un sablier, une surface colorée qui
se réduit, une bande de jetons qu’on retire un par un. Et une annonce systématique de ce qui vient
après, car ce qui angoisse dans une fin, c’est le vide qui suit, pas la fin elle-même.</p>
<p>Règle de fond&nbsp;: <strong>on annonce les changements, on ne les subit pas ensemble</strong>.
Un imprévu annoncé trente secondes à l’avance, avec une carte «&nbsp;changement&nbsp;» et
l’indication de ce qui le remplace, coûte infiniment moins cher qu’un imprévu découvert sur
place.</p>`,
    },
    {
      titre: 'Module 2 — Une situation qui dérape, et pourquoi',
      minutes: 8,
      html: `<h2>Le planning plastifié de l’unité</h2>
<p>Une unité de SESSAD a investi deux après-midi à fabriquer un emploi du temps visuel pour Léa,
7 ans. Quarante pictogrammes plastifiés, un beau panneau, du velcro. Trois semaines plus tard,
plus personne ne s’en sert. Voici pourquoi.</p>
<div style="border-left:3px solid #d9cfc2;padding:2px 0 2px 16px;margin:18px 0">
<p><em>Le panneau est fixé au mur du couloir, à 1&nbsp;m&nbsp;60. Il couvre la semaine entière,
cinq colonnes, huit lignes. Il a été mis à jour la dernière fois le lundi de la semaine
précédente.</em></p>
<p><em>Mardi, la séance de piscine est annulée&nbsp;: le car ne passe pas. Personne ne touche au
panneau — il est dans le couloir, l’information arrive dans la salle. On explique à Léa
oralement&nbsp;: «&nbsp;pas de piscine aujourd’hui, on fera un jeu à la place.&nbsp;» Elle se
lève, va dans le couloir, regarde le panneau où la vignette piscine est toujours là, revient et
se met à crier.</em></p>
<p><em>«&nbsp;Mais je viens de te le dire, il n’y a pas piscine&nbsp;!&nbsp;» La crise dure vingt
minutes. Le vendredi, l’équipe conclut que «&nbsp;le visuel ne marche pas avec elle&nbsp;».</em></p>
</div>
<h3>Prenez trois minutes avant de lire la suite</h3>
<p>Le support n’a pas échoué&nbsp;: il a parfaitement fonctionné. Léa a fait exactement ce qu’on
lui avait appris à faire. Repérez ce qui a été enseigné ce jour-là.</p>
<hr style="height:1px;border:0;background:#e5e0d8;margin:24px 0">
<h3>Ce qui s’est réellement passé</h3>
<ul>
<li><p><strong>Léa a fait confiance au support, et le support mentait.</strong> Elle est allée
vérifier — c’est exactement le comportement qu’on cherchait à installer. Ce qu’elle a appris ce
mardi, c’est que le panneau n’est pas fiable. Un support faux enseigne la méfiance.</p></li>
<li><p><strong>Personne n’était responsable de la mise à jour.</strong> Aucun nom, aucun moment
dans la journée. Le support est mort de cela, pas d’autre chose.</p></li>
<li><p><strong>Le panneau était loin du lieu de vie.</strong> Un support se consulte là où la
question se pose. Dans un couloir, il est consulté par les adultes qui passent, pas par
l’enfant qui attend.</p></li>
<li><p><strong>La semaine entière, c’est trop.</strong> Quarante cases à tenir à jour, c’est un
travail quotidien que personne n’a le temps de faire. Une demi-journée, quatre à six cases, se
tient réellement.</p></li>
<li><p><strong>Le changement n’a pas été rendu visible.</strong> Il n’existait pas de carte
«&nbsp;changement&nbsp;», donc l’annulation n’avait aucune forme. Une annulation qui n’existe que
dans une phrase déjà terminée ne laisse rien à quoi se raccrocher.</p></li>
</ul>
<h3>La même semaine, autrement</h3>
<p>Une bande de quatre cases pour la matinée, posée sur la table de Léa, pas au mur. Une pochette
«&nbsp;fini&nbsp;» où elle glisse chaque carte terminée. Une carte rouge
«&nbsp;changement&nbsp;» rangée avec les autres, dont l’usage est répété calmement plusieurs fois
alors que rien ne change — pour qu’elle ne soit pas découverte un jour de contrariété. Et une
règle écrite dans le classeur de l’unité&nbsp;: <em>la bande du lendemain est posée par
l’éducateur du soir, avant de partir</em>. Un nom, un moment.</p>`,
    },
    {
      titre: 'Module 3 — Exercice guidé : construire un support qui tient',
      minutes: 10,
      html: `<h2>Vous allez fabriquer un support, et surtout décider qui le tient</h2>
<p>Choisissez UN moment de la journée qui pose problème de façon répétée&nbsp;: le lever, le
retour de l’école, l’attente avant le repas, le coucher. Un seul moment, pas la journée.</p>
<h3>Étape 1 — Formuler la question à laquelle le support répond (2 minutes)</h3>
<p>Écrivez-la telle que la personne se la poserait&nbsp;: «&nbsp;qu’est-ce qu’on fait
maintenant&nbsp;?&nbsp;», «&nbsp;c’est encore long&nbsp;?&nbsp;», «&nbsp;comment on
fait&nbsp;?&nbsp;», «&nbsp;qu’est-ce qu’il y a après&nbsp;?&nbsp;». Un support répond à une seule
question. Si vous en avez écrit deux, faites deux supports — ou choisissez.</p>
<h3>Étape 2 — Choisir le niveau de représentation (2 minutes)</h3>
<p>Objet réel → photo de l’objet ou du lieu → dessin → pictogramme → mot écrit. Prenez le niveau
que la personne reconnaît <em>aujourd’hui sans hésiter</em>, pas celui qu’on aimerait qu’elle
atteigne. Dans le doute, testez&nbsp;: posez deux images côte à côte et demandez celle du bain.
Une seconde d’hésitation signifie&nbsp;: descendez d’un niveau.</p>
<div style="background:#f7f4ee;border:1px solid #e5e0d8;border-radius:10px;padding:16px 18px;margin:18px 0">
<p style="margin:0"><strong>Une photo prise chez vous bat un pictogramme du commerce.</strong>
La photo de <em>votre</em> salle de bain, de <em>ce</em> manteau, de <em>cette</em> personne, se
reconnaît sans apprentissage. Le pictogramme, lui, doit d’abord être appris.</p>
</div>
<h3>Étape 3 — Fabriquer, avec trois contraintes (4 minutes)</h3>
<ul>
<li><p><strong>Quatre à six cases maximum.</strong> Si votre moment en demande dix, il en fait
deux.</p></li>
<li><p><strong>Une marque de fin.</strong> La dernière case dit ce qui vient après, ou porte une
image «&nbsp;fini&nbsp;». Jamais une bande qui s’arrête sans rien.</p></li>
<li><p><strong>Quelque chose à manipuler.</strong> Carte à retourner, à décrocher, à glisser dans
une pochette. Un support qu’on ne touche pas n’est pas consulté.</p></li>
</ul>
<h3>Étape 4 — Écrire la ligne de responsabilité (2 minutes)</h3>
<p>Sur le support lui-même, au dos ou en bas, écrivez&nbsp;: <em>«&nbsp;Mis à jour par ……, chaque
jour à …… .&nbsp;»</em> Un prénom, une heure. C’est la ligne la plus importante de tout
l’exercice&nbsp;: c’est elle qui décide si le support existe encore dans un mois.</p>
<h3>Étape 5 — Préparer la carte « changement »</h3>
<p>Fabriquez-la maintenant, même si rien ne change cette semaine. Utilisez-la deux ou trois fois
pour de tout petits changements sans importance, quand tout va bien. Une carte découverte pour
la première fois un jour de contrariété devient elle-même le problème.</p>`,
    },
    {
      titre: 'Module 4 — Mise en pratique et auto-observation',
      minutes: 10,
      html: `<h2>Deux semaines, et une décision honnête au bout</h2>
<p>Utilisez le support tous les jours sur le moment choisi. Trois règles pendant ces deux
semaines&nbsp;:</p>
<ol>
<li><p><strong>Vous montrez le support avant de parler</strong>, pas après. L’ordre compte&nbsp;:
si la phrase arrive d’abord, le support devient une redite dont personne n’a besoin.</p></li>
<li><p><strong>Le support est toujours vrai.</strong> S’il ne peut pas être mis à jour, il est
retiré pour la journée. Un support faux abîme la confiance construite les jours précédents.</p></li>
<li><p><strong>Vous ne commentez pas son usage.</strong> Pas de «&nbsp;regarde ton
planning&nbsp;!&nbsp;» sur un ton d’injonction&nbsp;: le support est une ressource, pas une
consigne de plus.</p></li>
</ol>
<h3>Votre relevé, quatorze lignes</h3>
<p>Une ligne par jour, trois colonnes&nbsp;: le support était-il à jour (oui/non) · la personne
l’a-t-elle regardé de sa propre initiative (oui/non) · le moment s’est-il passé mieux
qu’avant (mieux / pareil / moins bien). Trente secondes par jour.</p>
<h3>La lecture, au quatorzième jour</h3>
<ul>
<li><p><strong>Colonne 1 majoritairement «&nbsp;non&nbsp;»</strong> → ce n’est pas le support qui
est en cause, c’est l’organisation. Reprenez la ligne de responsabilité&nbsp;: le prénom ou
l’heure ne tiennent pas dans la vraie journée.</p></li>
<li><p><strong>Colonne 1 «&nbsp;oui&nbsp;», colonne 2 «&nbsp;non&nbsp;»</strong> → le support est
tenu mais il n’intéresse personne. Deux causes probables&nbsp;: il est trop loin du lieu où la
question se pose, ou le niveau de représentation est trop abstrait. Rapprochez-le d’abord&nbsp;;
descendez d’un niveau ensuite.</p></li>
<li><p><strong>Colonnes 1 et 2 «&nbsp;oui&nbsp;», colonne 3 «&nbsp;pareil&nbsp;»</strong> → le
support est consulté et le moment reste difficile&nbsp;: ce moment ne pose probablement pas un
problème de prévisibilité. Relisez-le avec la grille des quatre fonctions&nbsp;: il y a peut-être
une demande derrière, et pas une incompréhension.</p></li>
<li><p><strong>Colonne 3 «&nbsp;mieux&nbsp;»</strong> → gardez-le tel quel un mois avant de
l’étendre. L’erreur classique est de généraliser tout de suite à toute la journée, ce qui ramène
directement au panneau de quarante cases.</p></li>
</ul>
<h3>Ce que vous savez faire maintenant</h3>
<p>Concevoir un support qui répond à une question précise, au bon niveau de représentation,
manipulable, avec une fin visible et un responsable nommé — et savoir, au bout de deux semaines
et sur des traces écrites, s’il faut le corriger, le déplacer ou l’abandonner.</p>
${AVERTISSEMENT}
${ATTESTATION}`,
    },
  ],
};

const VAGUE_2 = [CHAINAGE, PREVISIBLE];

module.exports = { VAGUE_2, CHAINAGE, PREVISIBLE };
