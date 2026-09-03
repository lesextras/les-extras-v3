/**
 * FORMATION 5 — Rendre l'environnement prévisible (contenu enrichi v3).
 * Compétence unique : construire un support visuel qui est réellement consulté,
 * et rendre le temps qui passe visible.
 *
 * Cette formation n'est PAS comportementale : pas d'encart NUANCE ici, mais
 * l'avertissement général et l'attestation restent obligatoires.
 */

const G = require('./gabarit-v3.js');
const A = require('./annexes.js');
const S = require('./schemas.js');

const NIVEAUX = A.tableau(
  ['Niveau de représentation', 'Ce que la personne doit déjà savoir', 'Comment le tester en dix secondes'],
  [
    ['<strong>Objet réel</strong> (la brosse à dents elle-même)', 'Rien. Aucun apprentissage préalable.', 'Elle prend l’objet quand on le lui tend.'],
    ['<strong>Photo de l’objet ou du lieu</strong>, prise sur place', 'Reconnaître une image de son propre environnement.', 'Deux photos côte à côte&nbsp;: «&nbsp;montre le bain&nbsp;».'],
    ['<strong>Dessin réaliste</strong>', 'Faire le lien entre un dessin et un objet réel.', 'Même test, avec deux dessins.'],
    ['<strong>Pictogramme</strong>', 'Un apprentissage préalable&nbsp;: un pictogramme s’apprend, il ne se devine pas.', 'Même test. Une hésitation d’une seconde = descendez d’un niveau.'],
    ['<strong>Mot écrit</strong>', 'Lecture, même partielle, du mot en question.', 'Deux mots côte à côte, sans image.'],
  ],
);


/* ── FIGURES ─────────────────────────────────────────────────────────────── */

const CARTE = S.figure({
  numero: 1,
  titre: 'La carte du parcours',
  corps: S.carte({
    modules: [
      { titre: 'Module 1', produit: 'la théorie' },
      { titre: 'Module 2', produit: 'un support autopsié' },
      { titre: 'Module 3', produit: 'votre support fabriqué' },
      { titre: 'Module 4', produit: 'la lecture du relevé' },
    ],
    releve:
      '<strong>Entre le module 3 et le module 4 :</strong> quatorze jours d’utilisation, trente secondes de relevé par jour.',
  }),
  legende:
    'Quatorze jours parce qu’un support tient presque toujours la première semaine : c’est la deuxième qui dit s’il survivra.',
});

const SCH_CAUSES = S.figure({
  numero: 2,
  titre: 'Les cinq causes d’abandon, et ce qui les lève',
  corps: S.paires({
    gauche: 'Ce qui tue un support',
    droite: 'Ce qui le fait survivre',
    lignes: [
      { g: 'Il est affiché, pas manipulé', d: 'Quelque chose s’y déplace : une carte, une pochette « fini »' },
      { g: 'Il n’a pas de marque de fin', d: 'Une fin visible : la dernière case, le bac vide' },
      { g: 'Il est trop chargé', d: 'Quatre à six cases, une demi-journée, pas la semaine' },
      { g: 'Personne n’est chargé de le tenir', d: '<strong>Un nom et un moment</strong>, écrits' },
      { g: 'Le niveau de représentation est trop abstrait', d: 'Le niveau testé, jamais supposé' },
    ],
  }),
  legende:
    'La quatrième ligne est celle qui décide de tout. Fabriquer un support est valorisant ; l’entretenir ne l’est pas — c’est pour cela que la ligne de responsabilité s’écrit avant la première case.',
});

const SCH_LECTURE5 = S.figure({
  numero: 3,
  titre: 'Lire le relevé au quatorzième jour',
  corps: S.arbre({
    question: 'Que disent les trois colonnes ?',
    branches: [
      {
        condition: 'Colonne 1 souvent « non »',
        alors:
          '<strong>Rien n’a été testé</strong><br><span style="color:#6b6f76;font-size:.94em">réduire le nombre de cases, redésigner un responsable</span>',
      },
      {
        condition: '1 oui, 2 non',
        alors:
          '<strong>Tenu mais pas consulté</strong><br><span style="color:#6b6f76;font-size:.94em">le rapprocher, puis descendre d’un niveau</span>',
      },
      {
        condition: '1 et 2 oui, 3 « pareil »',
        alors:
          '<strong>Ce n’est pas la prévisibilité</strong><br><span style="color:#6b6f76;font-size:.94em">chercher ailleurs : fonction, tâche, avis médical</span>',
      },
      {
        condition: 'Colonne 3 « mieux »',
        alors:
          '<strong>Ça fonctionne</strong><br><span style="color:#6b6f76;font-size:.94em">garder tel quel un mois avant d’étendre, et une extension à la fois</span>',
      },
    ],
  }),
  legende:
    'La colonne qui compte est la deuxième : la personne va-t-elle voir d’elle-même ? C’est elle qui mesure l’autonomie, qui est l’objectif réel du support.',
});

const M1 = {
  reperes: {
    minutes: 12,
    prerequis:
      'aucun pour les modules 1 à 3. Le module 4 renvoie à la grille des quatre fonctions, enseignée dans « Les quatre fonctions d’un comportement » — utile mais pas indispensable pour suivre celui-ci.',
    evaluation: 'les trois critères «&nbsp;Avant de passer au module suivant&nbsp;», que vous cochez vous-même, et le livrable «&nbsp;Mon carnet de séance&nbsp;». Ni examen, ni note&nbsp;: ce sont des productions, pas des questions de connaissance.',
  },
  objectifs: [
    'Expliquer ce qu’un support visuel remplace <em>vraiment</em> — et ce n’est pas la compréhension',
    'Distinguer les trois objets qu’on confond&nbsp;: emploi du temps, séquence de tâche, repère de temps',
    'Nommer les cinq raisons pour lesquelles un support est abandonné',
    'Choisir un niveau de représentation par le test, pas par la supposition',
    'Rendre visible une durée pour quelqu’un qui ne lit pas l’heure',
  ],
  corps: `${CARTE}

<h3 style="${G.H3}">1. Ce qu’un support visuel remplace vraiment</h3>
<p>Une consigne parlée a trois défauts, et ils se cumulent&nbsp;: elle disparaît en une
seconde&nbsp;; elle exige de comprendre au moment exact où elle est dite&nbsp;; et elle
oblige à la redemander — ce qui coûte cher à quelqu’un qui a précisément du mal à
demander.</p>
<p>Un support visuel n’a aucun de ces trois défauts. Il reste, il se consulte plusieurs
fois, et surtout <strong>il se consulte sans rien demander à personne</strong>.</p>
<p>C’est ce dernier point qui compte le plus, et c’est celui qu’on oublie toujours. Un
support n’est pas une aide à la compréhension&nbsp;: c’est une aide à
l’<strong>autonomie</strong>. Il permet de savoir ce qui vient sans dépendre de la
disponibilité d’un adulte. Une personne qui va vérifier son planning toute seule vient
de faire exactement ce qu’on voulait lui apprendre.</p>

<h3 style="${G.H3}">2. Trois objets différents, souvent mélangés sur le même mur</h3>
${A.tableau(
  ['L’objet', 'La question à laquelle il répond', 'Ce qu’il couvre'],
  [
    ['<strong>L’emploi du temps</strong>', '«&nbsp;Qu’est-ce qui se passe aujourd’hui&nbsp;?&nbsp;»', 'Une demi-journée ou une journée, dans l’ordre. Quatre à six cases, pas davantage.'],
    ['<strong>La séquence de tâche</strong>', '«&nbsp;Comment je fais ça&nbsp;?&nbsp;»', 'Une routine, étape par étape. Voir «&nbsp;Décomposer une routine en étapes&nbsp;».'],
    ['<strong>Le repère de temps</strong>', '«&nbsp;C’est encore long&nbsp;?&nbsp;»', 'Une durée qui ne se voit pas, rendue visible.'],
  ],
)}
<p>Un mur couvert d’images qui mélange les trois ne répond à aucune des trois questions.
<strong>Un support = une question.</strong> Si vous en avez deux, faites deux supports —
ou choisissez.</p>

<h3 style="${G.H3}">3. Les cinq raisons d’un abandon</h3>
${SCH_CAUSES}
<p>Presque tout le monde fabrique des supports. Presque personne ne s’en sert encore
trois semaines plus tard. Cinq causes, et elles reviennent toujours dans le même
ordre.</p>

<h4 style="margin:26px 0 8px">a. Il est affiché, pas manipulé</h4>
<p>Un panneau au mur se regarde une fois, puis devient du décor — pour tout le monde,
vous compris. Ce qui tient, c’est ce qu’on <strong>déplace</strong>&nbsp;: on retourne
la carte, on la décroche, on la glisse dans une pochette «&nbsp;fini&nbsp;». Le geste
crée l’attention&nbsp;; l’affichage la perd.</p>

<h4 style="margin:26px 0 8px">b. Il ne dit pas où ça s’arrête</h4>
<p>Une bande de dix images sans marque de fin n’apaise personne. La question réelle
n’est presque jamais «&nbsp;quoi&nbsp;?&nbsp;»&nbsp;: c’est «&nbsp;combien de temps
encore&nbsp;?&nbsp;» et «&nbsp;qu’est-ce qu’il y a après&nbsp;?&nbsp;». Ce qui angoisse
dans une fin, c’est le vide qui la suit, pas la fin elle-même.</p>

<h4 style="margin:26px 0 8px">c. Il est trop chargé</h4>
<p>Douze vignettes pour une matinée&nbsp;: personne ne tient la mise à jour, et
<strong>un support faux est pire qu’un support absent</strong> — il enseigne qu’on ne
peut pas s’y fier. Quatre à six cases, jamais plus.</p>

<h4 style="margin:26px 0 8px">d. Il n’appartient à personne</h4>
<p>Si aucun nom n’est écrit en face de «&nbsp;qui met à jour, et quand&nbsp;», la mise à
jour ne se fait pas. Ce n’est pas une question de motivation, c’est une question
d’organisation — et c’est la cause de mort la plus fréquente, très loin devant les
autres.</p>

<h4 style="margin:26px 0 8px">e. Le niveau de représentation est mal choisi</h4>
<p>Un pictogramme abstrait pour quelqu’un qui reconnaît les photos, ou l’inverse. On
teste, on ne suppose pas — c’est l’objet du point suivant.</p>

<h3 style="${G.H3}">4. Choisir le niveau : tester, ne pas supposer</h3>
${NIVEAUX}

${G.exemple(
  'Une photo prise chez vous bat un pictogramme du commerce',
  `<p style="margin-bottom:0">La photo de <em>votre</em> salle de bain, de <em>ce</em>
manteau, de <em>cette</em> personne se reconnaît sans aucun apprentissage. Un
pictogramme, lui, doit d’abord être appris — c’est une convention, pas une évidence. Si
vous hésitez entre les deux, prenez la photo&nbsp;: elle coûte trente secondes et elle
ne suppose rien.</p>`,
)}

<p><strong>Prenez le niveau que la personne reconnaît aujourd’hui sans hésiter</strong>,
pas celui qu’on aimerait qu’elle atteigne. Une seconde d’hésitation au test signifie
une chose&nbsp;: descendez d’un niveau. On pourra monter plus tard.</p>

<h3 style="${G.H3}">5. Rendre le temps visible</h3>
<p>«&nbsp;Encore cinq minutes&nbsp;» ne veut rien dire pour qui ne lit pas l’heure. Ce
qui fonctionne, c’est une durée qui <strong>se voit diminuer</strong>&nbsp;:</p>
<ul style="${G.UL}">
<li style="${G.LI}">un sablier, dont le sable descend&nbsp;;</li>
<li style="${G.LI}">une surface colorée qui se réduit — un minuteur visuel&nbsp;;</li>
<li style="${G.LI}">une bande de jetons qu’on retire un par un&nbsp;;</li>
<li style="${G.LI}">une file de cases qu’on barre à mesure.</li>
</ul>
<p>Et dans tous les cas, <strong>on annonce ce qui vient après</strong>. Une fin sans
suite annoncée est un vide, et c’est le vide qui inquiète.</p>

<h3 style="${G.H3}">6. Annoncer les changements plutôt que les subir ensemble</h3>
<p>L’imprévu est le point de rupture le plus fréquent — bien avant la difficulté d’une
tâche. Un imprévu <em>annoncé</em> trente secondes à l’avance, avec une carte
«&nbsp;changement&nbsp;» et l’indication de ce qui le remplace, coûte infiniment moins
cher qu’un imprévu découvert sur place.</p>
<p>La carte «&nbsp;changement&nbsp;» se fabrique tout de suite, et surtout&nbsp;:
<strong>elle se rode quand tout va bien</strong>. Utilisez-la deux ou trois fois pour de
tout petits changements sans importance. Une carte découverte pour la première fois un
jour de contrariété devient elle-même le problème.</p>`,
  aRetenir:
    'Un support visuel n’est pas une aide à la compréhension, c’est une aide à l’<strong>autonomie</strong>&nbsp;: il permet de savoir ce qui vient sans avoir à le demander à quelqu’un.',
  exercice: {
    nom: 'Le test du niveau, en dix secondes',
    duree: '10 minutes',
    quoi:
      'On mesure ce que la personne reconnaît vraiment. C’est plus rapide que de fabriquer un support qui ne sera jamais lu.',
    etapes: [
      'Choisissez trois éléments du quotidien de la personne : un lieu, un objet, une activité.',
      'Fabriquez deux versions de chacun : une photo prise sur place, et un pictogramme ou un dessin.',
      'Posez deux images côte à côte et demandez : « montre le bain ». Notez si la réponse est immédiate, hésitante, ou absente.',
      'Recommencez avec les deux autres éléments, dans un moment calme.',
      'Écrivez la conclusion : « aujourd’hui, [la personne] reconnaît sans hésiter le niveau ……… ». C’est ce niveau-là que vous utiliserez.',
    ],
    reussi:
      'vous avez un niveau écrit, obtenu par un test réel — pas par une supposition ni par ce qui existait déjà dans le service.',
  },
  carnet: {
    intro: 'Ouvrez une page et gardez-la pendant tout le parcours.',
    lignes: [
      '<strong>Le moment choisi</strong> — un seul moment de la journée qui pose problème.',
      '<strong>La question du support</strong> — celle que la personne se pose, écrite avec ses mots.',
      '<strong>Le niveau reconnu</strong> — obtenu par le test, pas supposé.',
      '<strong>Ce qui existe déjà</strong> — et pourquoi ça ne sert plus.',
    ],
  },
  vigilance: [
    '<strong>Un support faux abîme la confiance construite les jours précédents.</strong> S’il ne peut pas être mis à jour, retirez-le pour la journée.',
    '<strong>Ne mélangez pas les trois objets.</strong> Un emploi du temps, une séquence de tâche et un repère de temps sur le même panneau ne répondent à aucune question.',
    '<strong>Un support n’est pas un contrat.</strong> Il informe de ce qui va se passer&nbsp;; il ne sert pas à obtenir une obéissance ni à rappeler des règles.',
    '<strong>Les supports du commerce ne sont pas neutres.</strong> Un pictogramme est une convention culturelle&nbsp;: il s’apprend. Une photo de l’environnement réel ne demande aucun apprentissage.',
  ],
  annexes:
    'le <strong>tableau des niveaux de représentation</strong> avec le test de dix secondes, le <strong>mémo des cinq causes d’abandon</strong>, et une <strong>liste de repères de temps</strong> selon l’âge et le profil.',
  avant: [
    'Je sais dire à quelle question mon support répondra — une seule.',
    'J’ai testé le niveau de représentation, je ne l’ai pas supposé.',
    'Je peux citer les cinq raisons pour lesquelles un support est abandonné.',
  ],
};

const M2 = {
  reperes: {
    minutes: 10,
    prerequis: 'le module 1 — les trois objets, les cinq causes, les niveaux.',
    evaluation: 'votre analyse écrite de la scène.',
  },
  objectifs: [
    'Reconnaître un support qui a parfaitement fonctionné et qu’on a déclaré inutile',
    'Identifier laquelle des cinq causes a tué un support',
    'Comprendre pourquoi la ligne de responsabilité est la ligne la plus importante',
    'Formuler une version du support qui tient avec les moyens réels',
  ],
  corps: `<h3 style="${G.H3}">1. Le planning plastifié de l’unité</h3>
<p>Deux après-midi de travail, un beau panneau, et trois semaines plus tard plus
personne ne s’en sert. Lisez, puis arrêtez-vous.</p>

<div style="${G.GRIS}">
<p><em>Un SESSAD. L’équipe a fabriqué un emploi du temps visuel pour Léa, 7&nbsp;ans.
Quarante pictogrammes plastifiés, un panneau, du velcro.</em></p>
<p><em>Le panneau est fixé au mur du couloir, à 1&nbsp;m&nbsp;60. Il couvre la semaine
entière&nbsp;: cinq colonnes, huit lignes. Il a été mis à jour la dernière fois le lundi
de la semaine précédente.</em></p>
<p><em>Mardi, la séance de piscine est annulée&nbsp;: le car ne passe pas. Personne ne
touche au panneau — il est dans le couloir, l’information arrive dans la salle. On
explique à Léa oralement&nbsp;: «&nbsp;pas de piscine aujourd’hui, on fera un jeu à la
place.&nbsp;»</em></p>
<p><em>Léa se lève, va dans le couloir, regarde le panneau où la vignette piscine est
toujours là, revient, et se met à crier.</em></p>
<p><em>«&nbsp;Mais je viens de te le dire, il n’y a pas piscine&nbsp;!&nbsp;» La crise
dure vingt minutes. Le vendredi, l’équipe conclut en réunion que «&nbsp;le visuel ne
marche pas avec elle&nbsp;».</em></p>
</div>

<h3 style="${G.H3}">2. Arrêtez-vous ici — cinq minutes, de quoi écrire</h3>
<p>Le support n’a pas échoué. Il a parfaitement fonctionné, et Léa a fait exactement ce
qu’on lui avait appris à faire. Cherchez ce qui a été enseigné ce mardi-là.</p>

${G.FILET}

<h3 style="${G.H3}">3. L’analyse</h3>
<p><strong>Léa a fait confiance au support, et le support mentait.</strong> Elle s’est
levée, elle est allée vérifier toute seule&nbsp;: c’est exactement le comportement qu’on
cherchait à installer, et c’est celui qu’on a puni. Ce qu’elle a appris ce mardi, c’est
que le panneau n’est pas fiable. <strong>Un support faux enseigne la méfiance</strong>,
et la méfiance se rattrape beaucoup plus lentement qu’elle ne s’installe.</p>
<p><strong>Personne n’était responsable de la mise à jour.</strong> Aucun nom, aucun
moment dans la journée. Le support est mort de cela — la cause (d) du module 1 — et de
rien d’autre.</p>
<p><strong>Le panneau était loin du lieu de vie.</strong> Un support se consulte là où
la question se pose. Dans un couloir, il est consulté par les adultes qui passent, pas
par l’enfant qui attend dans la salle.</p>
<p><strong>La semaine entière, c’est trop.</strong> Quarante cases à tenir à jour, c’est
un travail quotidien que personne n’a le temps de faire. Une demi-journée, quatre à six
cases, se tient réellement — cause (c).</p>
<p><strong>Le changement n’avait aucune forme.</strong> Il n’existait pas de carte
«&nbsp;changement&nbsp;», donc l’annulation n’existait que dans une phrase déjà
terminée. Il n’y avait rien à quoi se raccrocher.</p>

${G.alerte(
  'La conclusion de la réunion est fausse, et elle coûte cher',
  `<p style="margin-bottom:0">«&nbsp;Le visuel ne marche pas avec elle&nbsp;» ferme le
sujet et désigne l’enfant. La formulation juste est&nbsp;: «&nbsp;notre organisation ne
permet pas de tenir ce support à jour&nbsp;». La première phrase enterre un outil qui
fonctionnait&nbsp;; la seconde ouvre une discussion sur la taille du support et sur qui
le met à jour.</p>`,
)}

<h3 style="${G.H3}">4. La même semaine, autrement</h3>
<ul style="${G.UL}">
<li style="${G.LI}"><strong>Une bande de quatre cases</strong> pour la matinée, posée
sur la table de Léa, pas au mur.</li>
<li style="${G.LI}"><strong>Une pochette «&nbsp;fini&nbsp;»</strong> où elle glisse
chaque carte terminée — le support est manipulé, pas regardé.</li>
<li style="${G.LI}"><strong>Une carte rouge «&nbsp;changement&nbsp;»</strong> rangée
avec les autres, rodée plusieurs fois alors que rien ne change, pour qu’elle ne soit
pas découverte un jour de contrariété.</li>
<li style="${G.LI}"><strong>Une règle écrite dans le classeur de l’unité&nbsp;:</strong>
<em>«&nbsp;la bande du lendemain est posée par l’éducateur du soir, avant de
partir.&nbsp;»</em> Un nom, un moment.</li>
</ul>
<p>Coût de fabrication&nbsp;: vingt minutes. Coût d’entretien&nbsp;: trente secondes par
jour, par une personne désignée. C’est ce rapport-là qui fait qu’un support survit.</p>

<h3 style="${G.H3}">5. Et à la maison — le frigo plutôt que le mur du couloir</h3>
<p>Le panneau de l’unité a un équivalent domestique très exact&nbsp;: le grand planning
familial acheté en septembre, rempli deux semaines, puis figé sur une semaine d’octobre.
Les cinq causes sont les mêmes, et la quatrième — personne n’est chargé de le tenir —
frappe encore plus fort à la maison, où il n’y a pas de classeur d’unité pour rappeler la
règle.</p>
<div style="${G.GRIS}">
<p style="margin-top:0"><em>La version qui tient&nbsp;: quatre cases pour la soirée —
repas · bain · histoire · lit — sur une bande aimantée posée sur le frigo, à hauteur
d’enfant.</em></p>
<p style="margin:14px 0 0"><em>Une pochette «&nbsp;fini&nbsp;» scotchée au bout&nbsp;: les
cartes s’y glissent une à une.</em></p>
<p style="margin-bottom:0"><em>La règle écrite au dos du frigo&nbsp;: «&nbsp;la bande du
lendemain est posée par celui qui couche, avant d’éteindre.&nbsp;»</em></p>
</div>
<ul style="${G.UL}">
<li style="${G.LI}"><strong>À hauteur d’enfant, dans la pièce où l’attente a
lieu.</strong> Un support à 1&nbsp;m&nbsp;60 est un support pour les adultes.</li>
<li style="${G.LI}"><strong>La soirée, pas la semaine.</strong> Quatre cases se tiennent
en trente secondes&nbsp;; sept jours de planning familial ne se tiennent pas, et personne
n’a jamais tenu les siens.</li>
<li style="${G.LI}"><strong>La carte «&nbsp;changement&nbsp;» se rode les jours où rien ne
change.</strong> Découverte le soir où la sortie est annulée, elle n’est qu’un carton
rouge de plus dans un moment déjà difficile.</li>
<li style="${G.LI}"><strong>Un support faux se retire tout de suite.</strong> Si la bande
annonce le bain et qu’il n’y a pas de bain, on pose la carte «&nbsp;changement&nbsp;» —
ou on enlève la case. On ne laisse jamais l’image mentir&nbsp;: c’est la seule erreur qui
coûte cher, à la maison comme ailleurs.</li>
</ul>`,
  aRetenir:
    'Un support faux est <strong>pire</strong> qu’un support absent&nbsp;: il enseigne la méfiance. Et la cause de mort la plus fréquente n’est jamais pédagogique — c’est l’absence d’un nom en face de «&nbsp;qui met à jour, et quand&nbsp;».',
  exercice: {
    nom: 'L’autopsie du support existant',
    duree: '10 minutes',
    quoi:
      'Presque tout le monde a déjà un support quelque part qui ne sert plus. On regarde pourquoi avant d’en fabriquer un autre.',
    etapes: [
      'Trouvez un support visuel existant dans votre service ou chez vous qui n’est plus utilisé. Il y en a presque toujours un.',
      'Passez-le aux cinq causes du module 1 : affiché plutôt que manipulé ? pas de marque de fin ? trop chargé ? sans responsable ? mauvais niveau ?',
      'Comptez ses cases. Au-delà de six, entourez le chiffre.',
      'Cherchez le nom du responsable de la mise à jour. S’il n’y en a pas, écrivez « personne » — c’est la réponse dans neuf cas sur dix.',
      'Écrivez la phrase de bilan honnête : « ce support est tombé parce que ……… », en désignant une cause d’organisation, pas une personne accompagnée.',
    ],
    reussi:
      'vous avez identifié au moins deux des cinq causes, et votre phrase de bilan ne contient le nom d’aucune personne accompagnée.',
  },
  carnet: {
    intro: 'Ajoutez ces quatre lignes à la page du module 1.',
    lignes: [
      '<strong>Le support existant</strong> — ce qu’il est, et où il est.',
      '<strong>Les causes identifiées</strong> — parmi les cinq.',
      '<strong>Le nombre de cases</strong> — et s’il dépasse six.',
      '<strong>Ma phrase de bilan</strong> — une cause d’organisation, pas une personne.',
    ],
  },
  vigilance: [
    '<strong>Ne concluez jamais « le visuel ne marche pas avec lui ».</strong> Cherchez d’abord laquelle des cinq causes a joué.',
    '<strong>Un support faux se retire.</strong> Mieux vaut pas de support qu’un support qui ment — la confiance perdue se rattrape lentement.',
    '<strong>Un support dans un couloir est un support pour les adultes.</strong> Il se pose là où la question se pose.',
    '<strong>Fabriquer un support est valorisant, l’entretenir ne l’est pas.</strong> C’est précisément pour cela que la ligne de responsabilité doit être écrite avant la première case.',
  ],
  annexes:
    'la <strong>grille des cinq causes</strong> à passer sur un support existant, et <strong>le support de Léa refait</strong>, avec son coût d’entretien chiffré.',
  avant: [
    'J’ai passé un support existant aux cinq causes et j’en ai identifié au moins deux.',
    'Je sais dire combien de cases il comptait et qui était censé le mettre à jour.',
    'Ma phrase de bilan désigne une cause d’organisation, pas une personne.',
  ],
};

const M3 = {
  reperes: {
    minutes: 12,
    apres:
      'quatorze jours d’utilisation du support, avec un relevé de trente secondes par jour. Le module&nbsp;4 se lit le quatorzième jour.',
    prerequis: 'les modules 1 et 2, et un niveau de représentation testé.',
    evaluation: 'votre support fabriqué, avec sa ligne de responsabilité.',
  },
  objectifs: [
    'Formuler la question unique à laquelle le support répond',
    'Fabriquer un support qui respecte les trois contraintes',
    'Écrire la ligne de responsabilité — la ligne qui décide de sa survie',
    'Préparer et roder la carte « changement » avant d’en avoir besoin',
    'Prévoir ce qui se passe le jour où le support ne peut pas être tenu',
  ],
  corps: `<h3 style="${G.H3}">1. La question, écrite avec les mots de la personne</h3>
<p>Avant toute fabrication&nbsp;: quelle question&nbsp;? Écrivez-la telle qu’elle se la
poserait.</p>
<ul style="${G.UL}">
<li style="${G.LI}">«&nbsp;Qu’est-ce qu’on fait maintenant&nbsp;?&nbsp;» → emploi du
temps</li>
<li style="${G.LI}">«&nbsp;Comment on fait&nbsp;?&nbsp;» → séquence de tâche</li>
<li style="${G.LI}">«&nbsp;C’est encore long&nbsp;?&nbsp;» → repère de temps</li>
<li style="${G.LI}">«&nbsp;Qu’est-ce qu’il y a après&nbsp;?&nbsp;» → marque de fin et
suite annoncée</li>
</ul>
<p>Un support répond à une seule question. Si vous en avez écrit deux, faites deux
supports, ou choisissez celle qui coûte le plus cher aujourd’hui.</p>

<h3 style="${G.H3}">2. Les trois contraintes de fabrication</h3>
<div style="${G.GRIS}">
<ul style="${G.UL}">
<li style="${G.LI}"><strong>Quatre à six cases maximum.</strong> Si votre moment en
demande dix, il en fait deux. Cette contrainte n’est pas esthétique&nbsp;: elle décide
si la mise à jour sera tenue.</li>
<li style="${G.LI}"><strong>Une marque de fin.</strong> La dernière case dit ce qui
vient après, ou porte une image «&nbsp;fini&nbsp;». Jamais une bande qui s’arrête sans
rien.</li>
<li style="${G.LI}"><strong>Quelque chose à manipuler.</strong> Carte à retourner, à
décrocher, à glisser dans une pochette. Un support qu’on ne touche pas n’est pas
consulté.</li>
</ul>
</div>

<h3 style="${G.H3}">3. La ligne de responsabilité</h3>
<p>C’est la ligne la plus importante de tout le parcours, et elle s’écrit
<strong>sur le support lui-même</strong>, au dos ou en bas&nbsp;:</p>
<div style="${G.GRIS}">
<p style="margin-bottom:0"><em>«&nbsp;Mis à jour par ……………, chaque jour à
…… h …… .&nbsp;»</em></p>
</div>
<p>Un prénom, une heure. Pas «&nbsp;l’équipe&nbsp;», pas «&nbsp;le matin&nbsp;»&nbsp;:
un prénom et une heure. C’est elle qui décide si le support existe encore dans un mois,
et elle seule.</p>
<p><strong>Le corollaire&nbsp;:</strong> si personne ne peut mettre son prénom, le
support est trop gros. Réduisez-le jusqu’à ce que quelqu’un puisse s’engager.</p>

${G.exemple(
  'Le test des trente secondes',
  `<p style="margin-bottom:0">Chronométrez la mise à jour. Si elle prend plus de trente
secondes, elle ne sera pas faite tous les jours — quelles que soient les bonnes
intentions de la personne qui s’est engagée. Réduisez le nombre de cases jusqu’à passer
sous les trente secondes.</p>`,
)}

<h3 style="${G.H3}">4. La carte « changement », rodée à froid</h3>
<p>Fabriquez-la maintenant, même si rien ne change cette semaine. Puis
<strong>utilisez-la deux ou trois fois pour de tout petits changements sans
importance</strong>, quand tout va bien&nbsp;: on inverse deux activités, on décale un
goûter de dix minutes.</p>
<p>La séquence tient en trois gestes, toujours les mêmes&nbsp;:</p>
<ol style="${G.UL}">
<li style="${G.LI}">On montre la carte «&nbsp;changement&nbsp;».</li>
<li style="${G.LI}">On retire la case qui ne se fera pas.</li>
<li style="${G.LI}">On pose immédiatement celle qui la remplace.</li>
</ol>
<p>Ce troisième geste est le plus important&nbsp;: <strong>on ne laisse jamais un
trou</strong>. Un vide sur un emploi du temps est plus inquiétant que le changement
lui-même.</p>

<h3 style="${G.H3}">5. Prévoir le jour où ça ne tient pas</h3>
<p>Il y aura des jours où le support ne pourra pas être mis à jour&nbsp;: absence,
imprévu, surcharge. Décidez maintenant ce qui se passe alors, parce que sur le moment
la tentation sera de le laisser tel quel — c’est-à-dire faux.</p>
<ul style="${G.UL}">
<li style="${G.LI}"><strong>La règle par défaut&nbsp;: on retire le support pour la
journée</strong> plutôt que de le laisser mentir.</li>
<li style="${G.LI}"><strong>La variante&nbsp;:</strong> on ne laisse que les cases
certaines et on met la carte «&nbsp;changement&nbsp;» sur le reste. C’est mieux, mais
ça demande dix secondes de plus.</li>
</ul>
<p>Écrivez celle des deux que vous retenez, sur le support, à côté de la ligne de
responsabilité.</p>

${G.exemple(
  'Ce qu’il vous faut, et ce que ça coûte',
  `<p>Un téléphone — les photos de <em>votre</em> salle de bain battent tout le reste, et
elles coûtent trente secondes. Une feuille A4 en paysage, pliée en quatre ou en six. Des
ciseaux. Du scotch double face, des pinces à linge ou du velcro adhésif. Une enveloppe ou
une boîte à chaussures pour la pochette «&nbsp;fini&nbsp;».</p>
<p><strong>Pour les pictogrammes&nbsp;:</strong> une banque libre de droits suffit. ARASAAC
(arasaac.org) est la plus complète en français, sous licence Creative Commons et gratuite
pour un usage éducatif.</p>
<p style="margin-bottom:0"><strong>N’achetez rien avant d’avoir tenu un mois.</strong> Le
module&nbsp;2 de ce parcours existe précisément parce que les supports plastifiés meurent
plus vite que les supports en papier — et coûtent bien plus cher à refaire.</p>`,
)}`,
  aRetenir:
    'La ligne <strong>«&nbsp;mis à jour par ……, chaque jour à …… h&nbsp;»</strong> décide de la survie du support. Si personne ne peut y mettre son prénom, le support est trop gros&nbsp;: réduisez-le.',
  exercice: {
    nom: 'Le support en vingt minutes',
    duree: '12 minutes de conception, puis la fabrication',
    quoi: 'On conçoit d’abord, on découpe ensuite. L’inverse produit de jolis supports inutilisables.',
    etapes: [
      'Écrivez la question, avec les mots de la personne. Une seule.',
      'Écrivez le niveau de représentation retenu, celui du test du module 1.',
      'Listez les cases : quatre à six, la dernière portant la marque de fin ou la suite.',
      'Décidez ce qui se manipule : carte retournée, décrochée, glissée dans une pochette. Écrivez-le.',
      'Écrivez la ligne de responsabilité — un prénom, une heure — et la règle du jour où ça ne tient pas. Puis fabriquez, et chronométrez la première mise à jour.',
    ],
    reussi:
      'la mise à jour prend moins de trente secondes chronométrées, et la ligne de responsabilité porte un prénom et une heure.',
  },
  carnet: {
    intro: 'Le support EST le livrable. Ces cinq lignes le documentent.',
    lignes: [
      '<strong>La question</strong> — une seule, avec les mots de la personne.',
      '<strong>Le niveau et le nombre de cases</strong>.',
      '<strong>Ce qui se manipule</strong> — le geste exact.',
      '<strong>La ligne de responsabilité</strong> — prénom et heure.',
      '<strong>Le temps de mise à jour chronométré</strong> — en secondes.',
    ],
  },
  vigilance: [
    '<strong>Ne fabriquez pas avant d’avoir écrit la question.</strong> C’est l’ordre qui produit des supports utilisés.',
    '<strong>Plastifier n’est pas une priorité.</strong> Un support en papier utilisé bat un support plastifié abandonné. Plastifiez ce qui a survécu un mois.',
    '<strong>N’installez pas la carte « changement » un jour de changement.</strong> Rodez-la quand tout va bien, sinon elle devient le signal d’une mauvaise nouvelle.',
    '<strong>Associez la personne à la fabrication</strong> quand c’est possible. Un support qu’on a aidé à construire se consulte davantage.',
  ],
  annexes:
    'la <strong>fiche de conception</strong> (question, niveau, cases, manipulation, responsabilité), le <strong>gabarit de bande à quatre et six cases</strong>, et la <strong>séquence de la carte « changement »</strong> en trois gestes.',
  avant: [
    'Mon support répond à une seule question, écrite avec les mots de la personne.',
    'Il compte au plus six cases, il porte une marque de fin, et quelque chose s’y manipule.',
    'La ligne de responsabilité porte un prénom et une heure, et la mise à jour prend moins de trente secondes.',
  ],
  pause: {
    jours: 'quatorze jours',
    texte: `<p>Votre support est fabriqué&nbsp;: il se met en service maintenant, et il s’observe pendant <strong>quatorze jours</strong>. Le module&nbsp;4 se lit le quatorzième jour.</p>
<p>Quatorze jours, parce qu’un support tient presque toujours la première semaine — c’est la deuxième qui dit s’il survivra. Trois croix par jour, trente secondes.</p>
<p style="margin-bottom:0">Date de mise en service&nbsp;: …… / …… &nbsp;·&nbsp; date de lecture&nbsp;: …… / …… .</p>`,
  },
};

const M4 = {
  reperes: {
    minutes: 12,
    prerequis: 'les modules 1 à 3, et un support fabriqué.',
    evaluation: 'la lecture de votre relevé au quatorzième jour, et la décision honnête qui suit.',
  },
  objectifs: [
    'Utiliser le support pendant quatorze jours selon trois règles simples',
    'Tenir un relevé de trois colonnes en trente secondes par jour',
    'Lire ce relevé et distinguer un problème d’organisation d’un problème de conception',
    'Décider honnêtement : corriger, déplacer, ou abandonner',
    'Ne pas généraliser trop tôt',
  ],
  corps: `<h3 style="${G.H3}">1. Trois règles pendant quatorze jours</h3>
<ol style="${G.UL}">
<li style="${G.LI}"><strong>Vous montrez le support avant de parler</strong>, pas après.
L’ordre compte&nbsp;: si la phrase arrive d’abord, le support devient une redite dont
personne n’a besoin.</li>
<li style="${G.LI}"><strong>Le support est toujours vrai.</strong> S’il ne peut pas
être mis à jour, il est retiré pour la journée. Un support faux abîme la confiance
construite les jours précédents.</li>
<li style="${G.LI}"><strong>Vous ne commentez pas son usage.</strong> Pas de
«&nbsp;regarde ton planning&nbsp;!&nbsp;» sur un ton d’injonction&nbsp;: le support est
une ressource, pas une consigne de plus.</li>
</ol>

<h3 style="${G.H3}">2. Le relevé, trois colonnes</h3>
${A.tableau(
  ['Jour', 'Support à jour ?', 'Consulté de sa propre initiative ?', 'Le moment s’est passé…'],
  [
    ['J1', 'oui / non', 'oui / non', 'mieux / pareil / moins bien'],
    ['J2', '', '', ''],
    ['…', '', '', ''],
  ],
)}
<p>Trente secondes par jour. La deuxième colonne est celle qui compte le plus&nbsp;:
elle mesure l’autonomie, qui est l’objectif réel.</p>

<h3 style="${G.H3}">3. La lecture du quatorzième jour</h3>
${SCH_LECTURE5}
${A.tableau(
  ['Ce que disent les colonnes', 'Ce que ça veut dire', 'La suite'],
  [
    [
      'Colonne 1 majoritairement «&nbsp;non&nbsp;»',
      'Ce n’est pas le support qui est en cause, c’est l’organisation.',
      'Reprenez la ligne de responsabilité&nbsp;: le prénom ou l’heure ne tiennent pas dans la vraie journée. Réduisez le support jusqu’à ce qu’ils tiennent.',
    ],
    [
      'Colonne 1 «&nbsp;oui&nbsp;», colonne 2 «&nbsp;non&nbsp;»',
      'Le support est tenu mais il n’intéresse personne.',
      'Deux causes probables&nbsp;: il est trop loin du lieu où la question se pose, ou le niveau est trop abstrait. Rapprochez-le d’abord&nbsp;; descendez d’un niveau ensuite.',
    ],
    [
      'Colonnes 1 et 2 «&nbsp;oui&nbsp;», colonne 3 «&nbsp;pareil&nbsp;»',
      'Le support est consulté et le moment reste difficile&nbsp;: ce moment ne pose probablement pas un problème de prévisibilité.',
      'Relisez-le avec la grille des quatre fonctions&nbsp;: il y a peut-être une demande derrière, et pas une incompréhension.',
    ],
    [
      'Colonne 3 «&nbsp;mieux&nbsp;»',
      'Le support fonctionne.',
      'Gardez-le tel quel un mois avant de l’étendre. L’erreur classique est de généraliser tout de suite à toute la journée — ce qui ramène directement au panneau de quarante cases.',
    ],
  ],
)}

<h3 style="${G.H3}">4. Ne pas généraliser trop tôt</h3>
<p>C’est le piège de la réussite. Un support qui marche donne envie d’en faire partout&nbsp;:
toute la journée, tous les enfants, toutes les activités. Et c’est exactement ainsi
qu’on se retrouve avec un mur de quarante cases que personne ne tient à jour.</p>
<p>La règle&nbsp;: <strong>un mois de fonctionnement stable avant d’étendre, et une
extension à la fois.</strong> Ajoutez un moment, tenez-le un mois, puis un autre.</p>

<h3 style="${G.H3}">5. Décider honnêtement d’abandonner</h3>
<p>Un support abandonné après un test honnête n’est pas un échec&nbsp;: c’est une
information. Ce qui coûte cher, c’est de le laisser au mur pendant six mois en sachant
qu’il ne sert plus — parce qu’il occupe la place, parce qu’il donne mauvaise conscience,
et parce qu’il enseigne que les supports ne servent à rien.</p>
<p>Retirez-le, écrivez pourquoi en une phrase, et gardez la phrase. Elle vous évitera de
refabriquer le même dans six mois.</p>

${G.alerte(
  'Ce qu’un support ne résout pas',
  `<p style="margin-bottom:0">La prévisibilité ne résout ni une douleur, ni une tâche
trop difficile, ni un besoin de communication. Si le moment reste difficile alors que le
support est tenu et consulté, cherchez ailleurs&nbsp;: la grille des quatre fonctions, la
décomposition de la tâche, ou un avis médical. Un support visuel n’est pas une réponse
universelle, et le présenter comme telle dessert les personnes à qui il servirait
vraiment.</p>`,
)}`,
  aRetenir:
    'La colonne qui compte est la deuxième&nbsp;: <strong>la personne consulte-t-elle le support de sa propre initiative&nbsp;?</strong> C’est elle qui mesure l’autonomie, qui est l’objectif réel.',
  exercice: {
    nom: 'La lecture du quatorzième jour',
    duree: '10 minutes, le relevé sous les yeux',
    quoi: 'Feuille en main. La mémoire retient les bons jours.',
    etapes: [
      'Comptez la colonne 1 : combien de jours le support était-il à jour ?',
      'Comptez la colonne 2 : combien de jours a-t-il été consulté spontanément ?',
      'Comptez la colonne 3 : combien de « mieux », de « pareil », de « moins bien » ?',
      'Placez-vous dans une des quatre lectures du point 3, et écrivez laquelle.',
      'Écrivez la décision — corriger, déplacer, descendre d’un niveau, garder tel quel un mois, ou retirer — et la date à laquelle vous la vérifierez.',
    ],
    reussi:
      'vous avez trois comptages, une lecture choisie, une décision et une date. Une décision sans date n’est pas une décision.',
  },
  carnet: {
    intro: 'Les dernières lignes du carnet.',
    lignes: [
      '<strong>Jours à jour / 14</strong>.',
      '<strong>Jours consultés spontanément / 14</strong>.',
      '<strong>Mieux / pareil / moins bien</strong> — trois nombres.',
      '<strong>La lecture choisie</strong> — une des quatre.',
      '<strong>La décision et sa date</strong>.',
    ],
  },
  vigilance: [
    '<strong>Quatorze jours minimum.</strong> Un support jugé au bout de trois jours est jugé sur la nouveauté, pas sur son usage.',
    '<strong>Ne changez qu’une chose à la fois</strong> — l’emplacement, ou le niveau, ou le nombre de cases. Trois changements simultanés rendent le relevé illisible.',
    '<strong>Un support retiré peut revenir.</strong> Ce n’est pas définitif&nbsp;: c’est un réglage.',
    '<strong>Cette formation ne pose aucun diagnostic</strong> et ne dit rien de l’autisme en particulier&nbsp;: la prévisibilité aide tout le monde, et elle aide davantage certaines personnes.',
  ],
  annexes:
    'le <strong>relevé de quatorze jours</strong> à trois colonnes, la <strong>fiche de lecture</strong> avec les quatre décisions, et un <strong>modèle de phrase d’abandon</strong> à conserver.',
  avant: [
    'J’ai quatorze jours de relevé, avec les trois colonnes.',
    'J’ai compté chaque colonne — pas relu, compté.',
    'J’ai une décision écrite et une date de vérification.',
  ],
};

/* ── ANNEXES ─────────────────────────────────────────────────────────────── */

const ANNEXES =
  A.entete('Rendre l’environnement prévisible') +
  A.fiche({
    numero: 1,
    titre: 'Les niveaux de représentation, et le test de dix secondes',
    quand: 'avant de fabriquer quoi que ce soit.',
    contenu:
      NIVEAUX +
      `<div style="${G.GRIS}">
<p style="margin-top:0"><strong>Le test&nbsp;:</strong> deux images côte à côte, dans un
moment calme, et une consigne simple — «&nbsp;montre le bain&nbsp;».</p>
<ul style="${G.UL}">
<li style="${G.LI}">Réponse immédiate → ce niveau convient.</li>
<li style="${G.LI}">Hésitation d’une seconde → descendez d’un niveau.</li>
<li style="${G.LI}">Pas de réponse → descendez de deux.</li>
</ul>
<p style="margin-bottom:0">On prend le niveau reconnu <em>aujourd’hui</em>, pas celui
qu’on aimerait atteindre. On montera plus tard.</p>
</div>`,
  }) +
  A.fiche({
    numero: 2,
    titre: 'Les cinq causes d’abandon — à passer sur tout support existant',
    quand: 'avant d’en fabriquer un nouveau, et tous les trois mois sur ceux qui existent.',
    contenu:
      A.tableau(
        ['Cause', 'La question à se poser', 'Le remède'],
        [
          ['<strong>a. Affiché, pas manipulé</strong>', 'Quelque chose se déplace-t-il&nbsp;? Une carte se retourne, se décroche, se range&nbsp;?', 'Ajoutez une pochette «&nbsp;fini&nbsp;» ou des cartes à retourner.'],
          ['<strong>b. Pas de marque de fin</strong>', 'La dernière case dit-elle ce qui vient après&nbsp;?', 'Ajoutez une case «&nbsp;fini&nbsp;» ou la suite annoncée.'],
          ['<strong>c. Trop chargé</strong>', 'Combien de cases&nbsp;? Plus de six&nbsp;?', 'Coupez en deux supports, ou réduisez à une demi-journée.'],
          ['<strong>d. Sans responsable</strong>', 'Y a-t-il un prénom et une heure écrits dessus&nbsp;?', 'Écrivez-les. Si personne ne peut s’engager, le support est trop gros.'],
          ['<strong>e. Mauvais niveau</strong>', 'Le niveau a-t-il été testé, ou supposé&nbsp;?', 'Faites le test de dix secondes, et descendez au besoin.'],
        ],
      ) +
      `<p><strong>La cause (d) est la plus fréquente, et de très loin.</strong> Un
support meurt presque toujours d’organisation, jamais de conception pédagogique.</p>`,
  }) +
  A.fiche({
    numero: 3,
    titre: 'La fiche de conception',
    quand: 'une fois par support, avant de découper quoi que ce soit.',
    contenu: `<div style="${G.GRIS}">
<p style="margin:0"><strong>1. La question</strong>, avec les mots de la personne&nbsp;: «&nbsp;………………………………………………&nbsp;»</p>
<p style="margin:14px 0 0"><strong>2. Le type&nbsp;:</strong> emploi du temps · séquence de tâche · repère de temps</p>
<p style="margin:14px 0 0"><strong>3. Le niveau retenu</strong> (testé)&nbsp;: ………………………………</p>
<p style="margin:14px 0 0"><strong>4. Les cases</strong> (4 à 6, la dernière porte la fin ou la suite)&nbsp;:<br>
① ……………………… ② ……………………… ③ ……………………… <br>
④ ……………………… ⑤ ……………………… ⑥ ………………………</p>
<p style="margin:14px 0 0"><strong>5. Ce qui se manipule&nbsp;:</strong> ………………………………………………</p>
<p style="margin:14px 0 0"><strong>6. Où il est posé&nbsp;:</strong> ……………………………… <em>(là où la question se pose)</em></p>
<p style="margin:14px 0 0"><strong>7. Mis à jour par</strong> ……………, <strong>chaque jour à</strong> …… h …… .</p>
<p style="margin:14px 0 0"><strong>8. Le jour où ça ne tient pas&nbsp;:</strong> on retire le support · on ne laisse que les cases certaines</p>
<p style="margin:14px 0 0"><strong>9. Temps de mise à jour chronométré&nbsp;:</strong> …… secondes <em>(au-delà de 30, réduisez)</em></p>
</div>`,
  }) +
  A.fiche({
    numero: 4,
    titre: 'Gabarits de bande — quatre et six cases',
    quand: 'à recopier sur une feuille, en paysage.',
    contenu:
      `<p><strong>Bande de quatre cases</strong> — une demi-journée, ou un moment de la
journée.</p>` +
      A.tableau(
        ['①', '②', '③', '④ — fin ou suite'],
        [['', '', '', '']],
      ) +
      `<p><strong>Bande de six cases</strong> — une journée courte. Au-delà, coupez en
deux bandes.</p>` +
      A.tableau(
        ['①', '②', '③', '④', '⑤', '⑥ — fin ou suite'],
        [['', '', '', '', '', '']],
      ) +
      `<div style="${G.GRIS}">
<p style="margin:0"><strong>Au dos de la bande, recopiez&nbsp;:</strong></p>
<p style="margin:10px 0 0">Mis à jour par ……………, chaque jour à …… h …… .</p>
<p style="margin:8px 0 0">Le jour où ça ne tient pas&nbsp;: ………………………………………………</p>
</div>`,
  }) +
  A.fiche({
    numero: 5,
    titre: 'La carte « changement », en trois gestes',
    quand: 'à fabriquer tout de suite, à roder quand tout va bien.',
    contenu: `<ol style="${G.UL}">
<li style="${G.LI}"><strong>On montre la carte «&nbsp;changement&nbsp;».</strong> Toujours le même geste, toujours la même carte.</li>
<li style="${G.LI}"><strong>On retire la case qui ne se fera pas.</strong></li>
<li style="${G.LI}"><strong>On pose immédiatement celle qui la remplace.</strong></li>
</ol>
<div style="${G.ALERTE}">
<h3 style="margin-top:0;color:#8a3a2e">Le troisième geste est le plus important</h3>
<p style="margin-bottom:0">On ne laisse <strong>jamais</strong> un trou. Un vide sur un
emploi du temps est plus inquiétant que le changement lui-même — c’est le vide qui
angoisse, pas la nouvelle.</p>
</div>
<p><strong>Rodez la carte à froid.</strong> Utilisez-la deux ou trois fois pour de tout
petits changements sans importance&nbsp;: inverser deux activités, décaler un goûter de
dix minutes. Une carte découverte pour la première fois un jour de contrariété devient
elle-même le problème.</p>`,
  }) +
  A.fiche({
    numero: 6,
    titre: 'Rendre le temps visible — quoi choisir',
    quand: 'quand la question est «&nbsp;c’est encore long&nbsp;?&nbsp;».',
    contenu:
      A.tableau(
        ['Le repère', 'Ce qu’il demande', 'Quand le choisir'],
        [
          ['<strong>Sablier</strong>', 'Rien. La durée est fixe et visible.', 'Durées courtes et toujours identiques&nbsp;: brossage de dents, attente d’un tour.'],
          ['<strong>Minuteur visuel</strong> (surface colorée qui se réduit)', 'Rien à lire. Se règle à la durée voulue.', 'Le repère le plus polyvalent. Durées variables de 1 à 60 minutes.'],
          ['<strong>Bande de jetons à retirer</strong>', 'Comprendre qu’un jeton retiré = du temps qui passe.', 'Quand la durée est découpée en événements plutôt qu’en minutes&nbsp;: «&nbsp;encore trois tours&nbsp;».'],
          ['<strong>File de cases à barrer</strong>', 'Suivre une file de gauche à droite.', 'Attentes longues et découpées&nbsp;: nombre de nuits avant un événement.'],
          ['<strong>Minuteur sonore seul</strong>', 'Rien, mais <em>rien ne se voit</em>.', '<strong>À éviter seul&nbsp;:</strong> la sonnerie surprend au lieu de préparer. À combiner avec un repère visible.'],
        ],
      ) +
      `<p><strong>Et dans tous les cas&nbsp;: on annonce ce qui vient après.</strong> Une
fin sans suite annoncée est un vide, et c’est le vide qui inquiète.</p>`,
  }) +
  A.fiche({
    numero: 7,
    titre: 'Le relevé de quatorze jours',
    quand: 'du premier au quatorzième jour, trente secondes par jour.',
    contenu:
      A.tableau(
        ['Jour', 'Support à jour ?', 'Consulté spontanément ?', 'Le moment s’est passé…'],
        [
          ['J1', '', '', ''], ['J2', '', '', ''], ['J3', '', '', ''], ['J4', '', '', ''],
          ['J5', '', '', ''], ['J6', '', '', ''], ['J7', '', '', ''], ['J8', '', '', ''],
          ['J9', '', '', ''], ['J10', '', '', ''], ['J11', '', '', ''], ['J12', '', '', ''],
          ['J13', '', '', ''], ['J14', '', '', ''],
          ['<strong>Totaux</strong>', '…… / 14', '…… / 14', '…… mieux · …… pareil · …… moins bien'],
        ],
      ) +
      `<p><strong>La deuxième colonne est celle qui compte.</strong> Elle mesure
l’autonomie — la personne va-t-elle voir toute seule&nbsp;? — qui est l’objectif réel du
support.</p>`,
  }) +
  A.fiche({
    numero: 8,
    titre: 'Le support de Léa, refait — avec son coût d’entretien',
    quand: 'comme modèle, avant de fabriquer le vôtre.',
    contenu:
      `<p>Le panneau du module&nbsp;2 comptait quarante cases, il était au mur du couloir,
et personne n’était chargé de le mettre à jour. Voici la version qui tient — moins jolie,
et toujours vivante six mois plus tard.</p>
<h4 style="margin:26px 0 8px">Ce qu’il est</h4>
<ul style="${G.UL}">
<li style="${G.LI}"><strong>Une bande de quatre cases</strong>, pour la matinée
seulement&nbsp;: arrivée · atelier · récréation · repas.</li>
<li style="${G.LI}"><strong>Posée sur la table de Léa</strong>, là où l’attente a lieu —
pas au mur d’un couloir.</li>
<li style="${G.LI}"><strong>Une pochette «&nbsp;fini&nbsp;»</strong> collée au bout de la
bande&nbsp;: Léa y glisse chaque carte terminée. Le support se manipule.</li>
<li style="${G.LI}"><strong>Une carte rouge «&nbsp;changement&nbsp;»</strong> rangée avec
les autres, rodée les jours où rien ne change.</li>
<li style="${G.LI}"><strong>Niveau de représentation&nbsp;:</strong> photo de l’objet réel
du lieu, testée — pas un pictogramme choisi parce qu’il était dans la boîte.</li>
</ul>
<h4 style="margin:26px 0 8px">La ligne qui le fait survivre</h4>
<div style="${G.GRIS}">
<p style="margin:0"><em>«&nbsp;La bande du lendemain est posée par l’éducateur du soir,
avant de partir. Si le planning change dans la journée, la personne qui l’apprend pose la
carte “changement”.&nbsp;»</em></p>
</div>
<p>Un nom, un moment, et une règle pour l’imprévu. C’est cette ligne, et rien d’autre, qui
manquait au panneau de quarante cases.</p>
<h4 style="margin:26px 0 8px">Le coût, chiffré</h4>
${A.tableau(
  ['', 'Le panneau d’origine', 'La bande de quatre cases'],
  [
    ['Fabrication', '2 après-midi (≈ 6 h), 40 pictogrammes plastifiés', '20 minutes, 6 cartes'],
    ['Entretien quotidien', '≈ 5 min si quelqu’un s’en charge — personne ne s’en charge', '30 secondes, par une personne désignée'],
    ['Entretien sur un mois (20 jours)', '≈ 1 h 40 — jamais faite', '10 minutes'],
    ['Qui le met à jour', 'Personne (aucun nom écrit)', 'L’éducateur du soir, nommé dans le classeur'],
    ['Ce qui se passe en cas d’imprévu', 'Rien&nbsp;: le support ment', 'La carte «&nbsp;changement&nbsp;» est posée'],
    ['Durée de vie observée', '3 semaines', 'Tient tant que la ligne de responsabilité tient'],
  ],
)}
<div style="${G.GRIS}">
<p style="margin:0"><strong>Le rapport qui décide de tout&nbsp;:</strong> un support
survit quand son coût d’entretien quotidien tient en moins d’une minute et qu’un nom est
écrit en face. Six heures de fabrication ne rachètent jamais cinq minutes par jour que
personne n’a.</p>
</div>
<p><strong>Avant de plastifier quoi que ce soit</strong>, écrivez les deux chiffres&nbsp;:
combien de temps pour le faire, combien de temps par jour pour le tenir. Si le second
dépasse une minute, réduisez le nombre de cases — pas la fréquence de mise à jour.</p>`,
  }) +
  A.fiche({
    numero: 9,
    titre: 'La fiche de lecture du quatorzième jour — les quatre décisions',
    quand: 'le quatorzième jour, le relevé sous les yeux.',
    contenu:
      `<p>On compte d’abord, on lit ensuite. Comptez vraiment&nbsp;: relire un relevé donne
toujours une impression plus favorable que le compter.</p>
<div style="${G.GRIS}">
<p style="margin-top:0"><strong>Mes trois comptages&nbsp;:</strong></p>
<p style="margin:0">Colonne&nbsp;1, support à jour&nbsp;: …… / 14 &nbsp;·&nbsp;
Colonne&nbsp;2, consulté spontanément&nbsp;: …… / 14 &nbsp;·&nbsp;
Colonne&nbsp;3&nbsp;: …… mieux · …… pareil · …… moins bien</p>
</div>` +
      A.tableau(
        ['Ce que disent les colonnes', 'Ce que cela signifie', 'La décision'],
        [
          [
            'Colonne&nbsp;1 souvent «&nbsp;non&nbsp;»',
            'Le support n’a pas été testé&nbsp;: il n’a pas existé assez de jours pour qu’on puisse conclure quoi que ce soit.',
            '<strong>Corriger l’organisation</strong>, pas le support. Réduire le nombre de cases, redésigner un responsable, refaire quatorze jours.',
          ],
          [
            'Colonne&nbsp;1 «&nbsp;oui&nbsp;», colonne&nbsp;2 «&nbsp;non&nbsp;»',
            'Le support est tenu, mais il n’intéresse personne.',
            '<strong>Déplacer</strong> le support là où la question se pose. Si rien ne change en une semaine&nbsp;: <strong>descendre d’un niveau</strong> de représentation.',
          ],
          [
            'Colonnes 1 et 2 «&nbsp;oui&nbsp;», colonne&nbsp;3 «&nbsp;pareil&nbsp;»',
            'Le support est consulté et le moment reste difficile&nbsp;: ce moment ne pose probablement pas un problème de prévisibilité.',
            '<strong>Chercher ailleurs</strong>&nbsp;: la grille des quatre fonctions, la décomposition de la tâche, ou un avis médical. Le support peut rester s’il est consulté.',
          ],
          [
            'Colonne&nbsp;3 «&nbsp;mieux&nbsp;»',
            'Le support fonctionne.',
            '<strong>Garder tel quel un mois</strong> avant d’étendre — et une extension à la fois. C’est ainsi qu’on évite de refabriquer un mur de quarante cases.',
          ],
        ],
      ) +
      `<div style="${G.GRIS}">
<p style="margin-top:0"><strong>Ma décision&nbsp;:</strong> ………………………………………………………………</p>
<p style="margin:14px 0 0"><strong>Je la vérifie le&nbsp;:</strong> …… / …… /
……</p>
</div>
<p><strong>Une décision sans date n’est pas une décision.</strong> C’est exactement ce qui
laisse un support mort accroché au mur pendant six mois.</p>`,
  }) +
  A.fiche({
    numero: 10,
    titre: 'La phrase d’abandon — à écrire et à garder',
    quand: 'le jour où vous retirez un support.',
    contenu:
      `<p>Retirer un support qui ne sert plus n’est pas un échec&nbsp;: c’est le résultat
d’un test. Ce qui coûte cher, c’est de le laisser au mur — il occupe la place, il donne
mauvaise conscience, et il enseigne que les supports ne servent à rien.</p>
<div style="${G.GRIS}">
<p style="margin-top:0"><strong>Le modèle, en quatre morceaux&nbsp;:</strong></p>
<p style="margin:0"><em>«&nbsp;Le <strong>[support]</strong>, en place du
<strong>[date]</strong> au <strong>[date]</strong>, a été retiré. Sur quatorze jours, il
était à jour <strong>[…]</strong> jours et consulté spontanément <strong>[…]</strong>
jours. La cause identifiée est <strong>[une des cinq causes]</strong>. Ce qui serait à
retenter&nbsp;: <strong>[la version plus petite, ou le niveau en dessous]</strong>.&nbsp;»</em></p>
</div>
<h4 style="margin:26px 0 8px">Deux exemples</h4>
<div style="${G.GRIS}">
<p style="margin-top:0"><em>«&nbsp;Le planning mural de la semaine, en place du 12 janvier
au 3 février, a été retiré. Sur quatorze jours, il était à jour 4 jours et consulté
spontanément 1 jour. La cause identifiée est l’absence de responsable de mise à jour, avec
un nombre de cases hors de portée (40). Ce qui serait à retenter&nbsp;: une bande de quatre
cases pour la matinée, posée sur la table, mise à jour par l’éducateur du soir.&nbsp;»</em></p>
<p style="margin:14px 0 0"><em>«&nbsp;La bande de pictogrammes du coucher, en place du 2 au
16 mai, a été retirée. Elle était à jour 14 jours sur 14 et consultée spontanément 2 jours.
La cause identifiée est le niveau de représentation&nbsp;: le test des dix secondes n’avait
pas été fait. Ce qui serait à retenter&nbsp;: les mêmes étapes en photos des objets réels de
la chambre.&nbsp;»</em></p>
</div>
${G.alerte(
  'Ce qu’une phrase d’abandon ne contient jamais',
  `<p style="margin-bottom:0">Le nom d’une personne accompagnée comme cause. «&nbsp;Le
visuel ne marche pas avec elle&nbsp;» ferme le sujet, désigne l’enfant, et suit le dossier
pendant des années. La cause d’un support abandonné est presque toujours
organisationnelle&nbsp;: taille, emplacement, responsabilité, niveau, absence de
manipulation.</p>`,
)}
<p><strong>Gardez la phrase</strong> dans le classeur de l’unité ou dans votre carnet. Elle
vous évitera de refabriquer le même support dans six mois — et elle donnera à l’équipe
suivante l’information que personne n’écrit jamais.</p>`,
  }) +
  A.pied();

module.exports = {
  slug: 'rendre-l-environnement-previsible',
  uuid: '5ae97ba7-c347-42f4-8a4e-8c10e6319287',
  modules: [
    { titre: 'Module 1 — Ce qui rend un support consultable, et les cinq causes d’abandon', minutes: 12, html: G.assembler(M1) },
    { titre: 'Module 2 — Un support qui fonctionnait, et qu’on a enterré', minutes: 10, html: G.assembler(M2) },
    { titre: 'Module 3 — Exercice guidé : fabriquer le support et sa ligne de responsabilité', minutes: 12, html: G.assembler(M3) },
    { titre: 'Module 4 — Quatorze jours d’usage, et la décision honnête', minutes: 12, html: G.assembler(M4) },
  ],
  annexes: ANNEXES,
};
