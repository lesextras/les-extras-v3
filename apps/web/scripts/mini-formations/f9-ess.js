/**
 * F9 — PRÉPARER UNE ÉQUIPE DE SUIVI DE LA SCOLARISATION
 *
 * Compétence : arriver à une ESS avec trois éléments écrits, et formuler ses
 * demandes de façon à ce qu'elles deviennent des décisions écrites.
 *
 * ── POURQUOI CETTE FORMATION, ALORS QUE LE SITE A DÉJÀ UN GUIDE ESS ─────────
 * Le guide `/guides/ess-geva-sco` s'adresse à un professionnel qui rédige : il
 * dit qui remplit quoi, sous quel article, et comment écrire. Ce parcours
 * s'adresse à quelqu'un qui va S'ASSEOIR à la réunion — un parent, un
 * éducateur de SESSAD, une AESH — et il travaille autre chose : ce qu'on
 * prépare avant, ce qu'on dit pendant, et ce qu'on vérifie après. Les deux se
 * complètent et ne se répètent pas.
 *
 * ⚠ RÉFÉRENCES JURIDIQUES — LES MÊMES QUE LE GUIDE, ET PAS UNE DE PLUS.
 * Ce qui est cité ici a été vérifié et documenté dans `guides/contenu.ts` :
 *   · D351-10 : l'ESS procède au moins annuellement à l'évaluation du PPS et
 *     de sa mise en œuvre ;
 *   · D351-11 : les expertises sur lesquelles l'équipe s'appuie ;
 *   · D351-12 : l'enseignant référent réunit et coordonne l'ESS, et assure la
 *     permanence des relations avec l'élève et ses parents ;
 *   · D351-16-1 : l'aide humaine — l'article le plus souvent cité À TORT pour
 *     l'ESS ;
 *   · le GEVA-Sco est fixé par arrêté, en deux versions ; le GEVA-Sco réexamen,
 *     rempli par l'enseignant référent lors de la réunion, VAUT compte rendu de
 *     l'ESS. Le « compte rendu séparé » que tout le monde cherche n'existe pas.
 * Rien d'autre n'est affirmé comme du droit. En particulier, ce que les parents
 * peuvent demander en matière d'accompagnement à la réunion est présenté comme
 * une pratique courante à négocier avec l'enseignant référent, PAS comme un
 * droit adossé à un article — faute d'avoir pu vérifier le texte à la source.
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
      { titre: 'Module 1', produit: 'les textes, et ce que l’ESS décide' },
      { titre: 'Module 2', produit: 'une réunion analysée' },
      { titre: 'Module 3', produit: 'votre feuille d’une page' },
      { titre: 'Module 4', produit: 'la relecture du GEVA-Sco' },
    ],
    releve:
      '<strong>Entre le module 3 et le module 4 :</strong> la réunion, puis quinze jours pour vérifier ce qui a été écrit et ce qui a été fait.',
  }),
  legende:
    'Le module 4 se lit une fois le GEVA-Sco reçu — ou quinze jours après la réunion si vous ne l’avez pas reçu, ce qui est en soi une information à traiter.',
});

const SCH_CIRCUIT = S.figure({
  numero: 2,
  titre: 'Où va ce qui se dit en réunion',
  corps: S.flux([
    { titre: 'L’ESS', detail: 'constate, propose, et surtout ÉCRIT' },
    { titre: 'Le GEVA-Sco réexamen', detail: 'rempli par l’enseignant référent, il vaut compte rendu' },
    { titre: 'L’équipe pluridisciplinaire', detail: 'à la MDPH, elle évalue sur ce qu’elle lit' },
    { titre: 'La CDAPH', detail: 'décide les droits : aide humaine, matériel, orientation' },
  ]),
  legende:
    'L’ESS n’attribue aucun droit. Ce qu’on lui demande, c’est d’écrire ce sur quoi la CDAPH décidera — d’où la règle du parcours : on ne travaille pas à être entendu, on travaille à ce qui sera écrit.',
});

const SCH_FEUILLE = S.figure({
  numero: 3,
  titre: 'La feuille d’une page, en trois blocs',
  corps: S.flux([
    { titre: '1. Ce qui a changé', detail: 'trois lignes datées, dans les deux sens' },
    { titre: '2. Deux ou trois faits', detail: 'situation · mesure · période · ce qui a été essayé' },
    { titre: '3. Une demande', detail: 'écrite pour être recopiée telle quelle' },
  ]),
  legende:
    'Une page recto, lue à voix haute en moins de trois minutes. Le test : chaque phrase des blocs 2 et 3 pourrait-elle être recopiée telle quelle dans un document officiel ?',
});

const M1 = {
  reperes: {
    minutes: 12,
    prerequis:
      'aucun. Ce module s’adresse aux parents comme aux professionnels qui siègent en ESS — SESSAD, IME, AESH, éducateurs.',
    evaluation:
      'la date de votre prochaine ESS, la liste des personnes qui y seront, et les trois éléments que vous préparerez.',
  },
  objectifs: [
    'Savoir qui réunit l’ESS, à quelle fréquence, et sur quels textes',
    'Comprendre que le compte rendu que tout le monde cherche n’existe pas séparément',
    'Distinguer ce que l’ESS propose de ce que la CDAPH décide',
    'Reconnaître les cinq raisons pour lesquelles une ESS ne produit rien',
    'Préparer les trois éléments écrits qui changent une réunion',
  ],
  corps: `${CARTE}

<h3 style="${G.H3}">1. Ce qu’est une ESS, en quatre lignes</h3>
<p>L’<strong>équipe de suivi de la scolarisation</strong> réunit, autour d’un élève qui a
un projet personnalisé de scolarisation (PPS), les personnes qui concourent à sa mise en
œuvre&nbsp;: la famille, l’enseignant, l’enseignant référent, souvent l’AESH, et les
professionnels du service ou de l’établissement qui accompagnent l’enfant.</p>
<ul style="${G.UL}">
<li style="${G.LI}"><strong>Elle se réunit au moins une fois par an</strong> pour évaluer
le PPS et sa mise en œuvre&nbsp;: c’est ce que prévoit l’article <strong>D351-10</strong>
du code de l’éducation. Elle peut se réunir plus souvent, à la demande de la famille ou
de l’équipe.</li>
<li style="${G.LI}"><strong>C’est l’enseignant référent qui la réunit et la
coordonne</strong>, et qui assure la permanence des relations avec l’élève et ses parents
— article <strong>D351-12</strong>.</li>
<li style="${G.LI}"><strong>L’équipe s’appuie sur des expertises</strong> (article
D351-11)&nbsp;: c’est là que la contribution d’un SESSAD, d’un IME ou d’un soignant trouve
sa place.</li>
</ul>
${G.alerte(
  'L’article qu’on cite à tort',
  `<p style="margin-bottom:0">Le <strong>D351-16-1</strong> circule beaucoup dans les
courriers et les modèles trouvés en ligne, présenté comme l’article de l’ESS. Il traite
d’autre chose&nbsp;: <strong>l’aide humaine</strong>, et notamment le fait qu’un même élève
ne peut se voir attribuer en même temps une aide mutualisée et une aide individuelle. Citer
le mauvais article dans un courrier ne le rend pas irrecevable, mais cela affaiblit
inutilement une demande — et cela se corrige en dix secondes.</p>`,
)}

<h3 style="${G.H3}">2. Le compte rendu que vous cherchez n’existe pas</h3>
<p>C’est la question la plus posée sur le sujet, et la réponse déçoit avant de soulager&nbsp;:
il n’y a pas, d’un côté, un compte rendu de réunion et, de l’autre, un GEVA-Sco.</p>
${A.tableau(
  ['Le document', 'Qui le remplit', 'Ce qu’il est'],
  [
    [
      '<strong>GEVA-Sco première demande</strong>',
      'L’équipe éducative, convoquée par le directeur de l’établissement, en dialogue avec l’élève majeur ou ses représentants légaux.',
      'Il concerne un élève qui n’a pas encore de PPS.',
    ],
    [
      '<strong>GEVA-Sco réexamen</strong>',
      'L’enseignant référent, lors de la réunion de l’ESS.',
      'Il fait le bilan du PPS existant, et <strong>il vaut compte rendu de l’ESS</strong>.',
    ],
  ],
)}
<p><strong>Deux conséquences pratiques, et elles changent tout&nbsp;:</strong></p>
<ul style="${G.UL}">
<li style="${G.LI}">Chercher un «&nbsp;modèle de compte rendu d’ESS&nbsp;», c’est chercher
un document qui n’existe pas. Ce qui compte est ce qui sera écrit dans le GEVA-Sco.</li>
<li style="${G.LI}"><strong>Ce document n’est pas interne&nbsp;: il remonte.</strong> Il
alimente l’évaluation de l’équipe pluridisciplinaire de la MDPH, et il pèse sur les
décisions de compensation. Une phrase floue écrite ce jour-là coûte parfois une année
entière.</li>
</ul>
<p>D’où la règle qui traverse tout ce parcours&nbsp;: <strong>on ne travaille pas à être
entendu, on travaille à ce que quelque chose soit écrit.</strong></p>

<h3 style="${G.H3}">3. Ce que l’ESS peut faire, et ce qu’elle ne peut pas</h3>
${SCH_CIRCUIT}
${A.tableau(
  ['Ce que l’ESS fait', 'Ce qu’elle ne fait pas'],
  [
    [
      'Elle évalue le PPS et sa mise en œuvre, au moins une fois par an.',
      'Elle n’attribue aucun droit. L’AESH, le matériel, l’orientation, l’aménagement des examens relèvent d’une <strong>décision de la CDAPH</strong>, à la MDPH.',
    ],
    [
      'Elle constate ce qui se passe réellement en classe, et le fait écrire.',
      'Elle ne pose pas de diagnostic, et personne autour de la table n’a à le faire.',
    ],
    [
      'Elle propose&nbsp;: elle peut demander une révision du PPS, signaler un besoin nouveau, alerter sur une mise en œuvre incomplète.',
      'Elle ne peut pas créer un moyen qui n’existe pas dans l’établissement. Elle peut, en revanche, écrire qu’il manque — et c’est souvent la seule chose qui fait bouger.',
    ],
    [
      'Elle organise concrètement&nbsp;: emploi du temps, aménagements, coordination entre l’école et le service.',
      'Elle ne remplace ni l’équipe éducative ordinaire, ni les échanges du quotidien avec l’enseignant.',
    ],
  ],
)}
${G.exemple(
  'La différence qui fait gagner un an',
  `<p style="margin-bottom:0">«&nbsp;On demande une AESH&nbsp;» n’est pas une demande que
l’ESS peut satisfaire — elle ne décide pas. En revanche&nbsp;: «&nbsp;faire figurer au
GEVA-Sco que l’élève ne peut pas entrer dans une tâche écrite sans qu’un adulte lance la
première étape, constaté par l’enseignante et par le SESSAD, et que ce besoin se présente
dans toutes les matières&nbsp;» est exactement ce que l’équipe pluridisciplinaire de la
MDPH a besoin de lire. La première formulation se perd&nbsp;; la seconde
voyage.</p>`,
)}

<h3 style="${G.H3}">4. Les cinq raisons pour lesquelles une ESS ne produit rien</h3>
<ul style="${G.UL}">
<li style="${G.LI}"><strong>Personne n’est venu avec des faits datés.</strong> Chacun
raconte des impressions, et la réunion se termine sur «&nbsp;il faut voir&nbsp;».</li>
<li style="${G.LI}"><strong>Elle refait celle de l’an dernier.</strong> Une ESS qui ne dit
pas ce qui a changé, avec des dates, ne permet à personne de décider quoi que ce
soit.</li>
<li style="${G.LI}"><strong>Les demandes ne sont pas formulées comme des
demandes.</strong> «&nbsp;Ce serait bien si…&nbsp;» ne s’écrit nulle part. Une demande
commence par un verbe et se termine par une échéance.</li>
<li style="${G.LI}"><strong>Rien n’est reformulé pour l’écrit.</strong> Le point important
est dit à la douzième minute, tout le monde acquiesce, et il n’apparaît dans aucun
document.</li>
<li style="${G.LI}"><strong>Personne ne repart avec une échéance et un nom.</strong>
«&nbsp;On va se recontacter&nbsp;» n’est pas une décision.</li>
</ul>
<p>Aucune de ces cinq raisons ne tient à la bonne volonté des participants. Toutes se
corrigent avec une préparation de vingt minutes, et c’est l’objet du module&nbsp;3.</p>

<h3 style="${G.H3}">5. Les trois éléments qu’on prépare</h3>
<div style="${G.GRIS}">
<ol style="${G.UL}">
<li style="${G.LI}"><strong>Ce qui a changé depuis la dernière fois</strong>, avec des
dates. Dans les deux sens&nbsp;: ce qui va mieux compte autant que ce qui va moins
bien.</li>
<li style="${G.LI}"><strong>Deux ou trois faits datés et mesurés</strong>, pas une
appréciation générale. Un fait, c’est&nbsp;: une situation, une fréquence, une période, et
si possible ce qui a déjà été essayé.</li>
<li style="${G.LI}"><strong>Une demande écrite, une seule ou deux au maximum</strong>,
formulées de façon à pouvoir être recopiées dans le GEVA-Sco.</li>
</ol>
</div>
<p>Trois éléments, une feuille recto. Une réunion où deux personnes arrivent avec ça
change de nature — et c’est vrai que vous soyez parent ou professionnel.</p>

<h3 style="${G.H3}">6. Si vous êtes parent</h3>
<ul style="${G.UL}">
<li style="${G.LI}"><strong>Vous n’avez pas à «&nbsp;bien parler&nbsp;» pour être
utile.</strong> Ce qui compte n’est pas votre aisance à l’oral&nbsp;: c’est votre feuille.
Vous pouvez la lire, et même la donner.</li>
<li style="${G.LI}"><strong>Vous savez des choses que personne d’autre ne sait&nbsp;:</strong>
combien de temps durent les devoirs, comment se passe le réveil, ce qui se passe le
dimanche soir, l’état dans lequel il rentre. Ce sont des données, pas des anecdotes, et
elles ont leur place.</li>
<li style="${G.LI}"><strong>Vous pouvez demander à venir accompagné</strong> — d’un
proche, d’un professionnel qui suit votre enfant, d’une association. Ce n’est pas une
faveur exceptionnelle&nbsp;: c’est une demande courante. Prévenez l’enseignant référent
avant la réunion, pour que cela s’organise.</li>
<li style="${G.LI}"><strong>Vous pouvez demander une réunion</strong> sans attendre la
suivante, si la situation change.</li>
<li style="${G.LI}"><strong>Vous pouvez demander à recevoir le GEVA-Sco.</strong> Le
demander avant la réunion, plutôt qu’après, est ce qui vous permettra de vérifier que ce
que vous avez dit y figure.</li>
</ul>
${G.alerte(
  'Ce que ce parcours ne fait pas',
  `<p style="margin-bottom:0">Il ne donne pas de conseil juridique, ne rédige pas de
recours et ne dit pas ce qu’une MDPH accordera. Si un droit est refusé et que vous voulez
le contester, les voies de recours sont indiquées sur la notification elle-même, et une
association d’usagers ou un service social vous accompagnera bien mieux qu’une page
web.</p>`,
)}`,
  aRetenir:
    'On ne travaille pas à être entendu&nbsp;: on travaille à <strong>ce qui sera écrit dans le GEVA-Sco</strong>, parce que c’est lui qui vaut compte rendu et qui remonte à la MDPH. Une phrase floue ce jour-là coûte parfois une année.',
  exercice: {
    nom: 'Le repérage avant la réunion',
    duree: '10 minutes',
    quoi:
      'Cinq questions à écrire, qui décident déjà de la moitié de ce que la réunion produira.',
    etapes: [
      'Écrivez la date de la prochaine ESS. Si vous ne l’avez pas, écrivez « à demander à l’enseignant référent » — c’est déjà une action.',
      'Listez qui y sera : l’enseignant référent, l’enseignant, la famille, l’AESH s’il y en a une, le service. Repérez qui manque et qui aurait dû être là.',
      'Écrivez en une phrase ce que vous voulez qu’il soit écrit à la fin. Une seule phrase, celle que vous voudriez lire dans le GEVA-Sco.',
      'Relisez le compte rendu de l’an dernier, s’il existe. Qu’est-ce qui avait été décidé ? Qu’est-ce qui a été fait ?',
      'Écrivez laquelle des cinq raisons du point 4 a fait échouer la dernière réunion. Il y en a presque toujours une.',
    ],
    reussi:
      'vous avez une date (ou une action pour l’obtenir), la liste des présents, une phrase-cible écrite, et une raison identifiée parmi les cinq.',
  },
  carnet: {
    intro:
      'Ouvrez une page — carnet, feuille, notes du téléphone. Quatre lignes pour ce module.',
    lignes: [
      '<strong>La date et les présents</strong> — et qui manque.',
      '<strong>Ma phrase-cible</strong> — ce que je veux lire dans le GEVA-Sco.',
      '<strong>Ce qui avait été décidé l’an dernier</strong> — et ce qui a été fait.',
      '<strong>La raison de l’échec précédent</strong> — parmi les cinq.',
    ],
  },
  vigilance: [
    '<strong>Ne citez pas le D351-16-1 pour l’ESS.</strong> Il traite de l’aide humaine. L’article de l’équipe de suivi est le D351-10, et le D351-12 pour l’enseignant référent.',
    '<strong>Ne cherchez pas un modèle de compte rendu d’ESS</strong> : il n’existe pas. C’est le GEVA-Sco réexamen qui en tient lieu.',
    '<strong>Une ESS ne décide aucun droit.</strong> Elle constate, elle propose, elle écrit — et c’est la CDAPH qui décide. Confondre les deux fait perdre des réunions entières.',
    '<strong>Ce qui va bien se dit aussi.</strong> Une réunion qui ne parle que de difficultés donne une image fausse de l’enfant, et cette image-là voyage aussi.',
  ],
  annexes:
    'la <strong>fiche des textes</strong> (qui fait quoi, sous quel article), le <strong>tableau des deux GEVA-Sco</strong>, et la <strong>liste des cinq raisons d’échec</strong> à passer sur votre dernière réunion.',
  avant: [
    'Je sais qui réunit l’ESS, à quelle fréquence, et je ne confonds plus le D351-10 avec le D351-16-1.',
    'Je sais que le GEVA-Sco réexamen vaut compte rendu, et qu’il remonte à la MDPH.',
    'J’ai écrit ma phrase-cible : ce que je veux lire à la fin.',
  ],
};

/* ── MODULE 2 ────────────────────────────────────────────────────────────── */

const M2 = {
  reperes: {
    minutes: 10,
    prerequis: 'le module 1 — les textes, les deux GEVA-Sco, les cinq raisons d’échec.',
    evaluation: 'votre dernière réunion relue, avec le moment où elle a cessé de produire.',
  },
  objectifs: [
    'Repérer, dans une réunion cordiale, le moment où plus rien ne s’écrit',
    'Distinguer une observation d’un fait daté et mesuré',
    'Voir ce qu’une demande mal formulée devient une fois écrite',
    'Reconnaître la phrase de fin qui ne décide rien',
    'Réécrire une réunion en trois interventions utiles',
  ],
  corps: `<h3 style="${G.H3}">1. L’ESS de Noam</h3>
<p>Cinquante minutes, sept personnes, aucune tension — et un GEVA-Sco qui ne dit rien.
Lisez, puis arrêtez-vous.</p>

<div style="${G.GRIS}">
<p><em>Noam, 9&nbsp;ans, CE2. PPS en place depuis deux ans, AESH mutualisée. Sont
présents&nbsp;: l’enseignante, l’enseignant référent, la directrice, l’AESH, la mère,
l’éducatrice du SESSAD et la psychologue du service.</em></p>
<p><em>L’enseignante ouvre&nbsp;: «&nbsp;Noam a fait des progrès, il est agréable, mais il
reste très en difficulté à l’écrit. Dès qu’il y a une trace écrite, ça bloque. C’est
compliqué.&nbsp;»</em></p>
<p><em>L’AESH&nbsp;: «&nbsp;Moi je suis sur trois enfants, donc je passe, mais quand je
suis à côté ça va mieux.&nbsp;»</em></p>
<p><em>L’éducatrice du SESSAD&nbsp;: «&nbsp;De notre côté le travail se poursuit, il est
en progrès sur la relation, on continue le suivi.&nbsp;»</em></p>
<p><em>La mère&nbsp;: «&nbsp;À la maison les devoirs c’est très dur, ça peut durer une
heure et demie, il pleure. On n’en peut plus.&nbsp;» Un silence. «&nbsp;Ah oui, il faut
qu’on regarde ça&nbsp;», dit la directrice.</em></p>
<p><em>La psychologue&nbsp;: «&nbsp;Il y a une fragilité attentionnelle, c’est
constitutif, il faut du temps.&nbsp;»</em></p>
<p><em>L’enseignant référent&nbsp;: «&nbsp;Donc on reconduit le PPS, on maintient
l’AESH mutualisée. On note qu’il faut être vigilant sur l’écrit. On se revoit l’an
prochain, sauf si besoin.&nbsp;»</em></p>
<p><em>Dans le GEVA-Sco&nbsp;: «&nbsp;Progrès notables. Reste en difficulté sur les
tâches écrites. Poursuite de l’accompagnement. Vigilance sur la fatigabilité.&nbsp;»</em></p>
</div>

<h3 style="${G.H3}">2. Arrêtez-vous ici — cinq minutes, de quoi écrire</h3>
<p>Personne n’a mal fait. Cherchez, intervention par intervention, ce qui manquait pour
qu’elle produise quelque chose d’écrivable.</p>

${G.FILET}

<h3 style="${G.H3}">3. Intervention par intervention</h3>
${A.tableau(
  ['Ce qui a été dit', 'Ce qui manquait', 'Ce qui aurait pu être dit'],
  [
    [
      '«&nbsp;Il reste très en difficulté à l’écrit, dès qu’il y a une trace écrite ça bloque.&nbsp;»',
      'Une mesure et un moment. «&nbsp;Ça bloque&nbsp;» ne se recopie pas dans un document qui remonte.',
      '«&nbsp;Sur une consigne écrite, il ne commence pas seul. Sur les quinze séances de la période, il a démarré seul deux fois. Quand un adulte écrit le premier mot avec lui, il enchaîne la suite.&nbsp;»',
    ],
    [
      '«&nbsp;Je suis sur trois enfants, quand je suis à côté ça va mieux.&nbsp;»',
      'Un volume. C’est pourtant l’information la plus décisive de la réunion.',
      '«&nbsp;Je suis présente environ deux heures par jour sur les six. Les créneaux où je ne suis pas avec lui sont le matin de 9 h à 10 h et l’après-midi&nbsp;: ce sont exactement ceux où il y a de l’écrit.&nbsp;»',
    ],
    [
      '«&nbsp;Le travail se poursuit, il est en progrès sur la relation.&nbsp;»',
      'Ce que le service a observé qui serve à l’école. Une contribution qui parle du service ne sert pas la réunion.',
      '«&nbsp;En séance, il entre dans une tâche écrite lorsque le matériel est sorti et la première ligne amorcée. Sans amorçage&nbsp;: il n’entre pas. C’est reproductible depuis janvier.&nbsp;»',
    ],
    [
      '«&nbsp;Les devoirs durent une heure et demie, il pleure.&nbsp;»',
      'Rien&nbsp;: c’est un fait, daté et mesuré. Ce qui a manqué, c’est <strong>que quelqu’un demande à ce que ce soit écrit</strong>.',
      'La même phrase, suivie de&nbsp;: «&nbsp;est-ce qu’on peut le faire figurer au GEVA-Sco&nbsp;? C’est un fait qui a sa place dans l’évaluation.&nbsp;»',
    ],
    [
      '«&nbsp;Il y a une fragilité attentionnelle, c’est constitutif.&nbsp;»',
      'Ce n’est pas une observation, c’est une explication — et elle referme la discussion.',
      '«&nbsp;Sur les tâches écrites, l’attention se maintient environ dix minutes puis se rompt. Un fractionnement en deux fois dix minutes pourrait être essayé et évalué.&nbsp;»',
    ],
    [
      '«&nbsp;On reconduit, on maintient, on note qu’il faut être vigilant.&nbsp;»',
      'Une décision. «&nbsp;Être vigilant&nbsp;» n’engage personne et ne se vérifie pas.',
      '«&nbsp;Trois points au GEVA-Sco&nbsp;: (1) besoin d’amorçage systématique pour entrer dans une tâche écrite&nbsp;; (2) les créneaux d’écrit ne coïncident pas avec la présence de l’AESH&nbsp;; (3) durée des devoirs à la maison&nbsp;: 1 h 30 avec pleurs. Point intermédiaire en janvier, organisé par l’enseignant référent.&nbsp;»',
    ],
  ],
)}
${G.alerte(
  'Le seul vrai fait de la réunion est passé à la trappe',
  `<p style="margin-bottom:0">La mère a apporté la seule donnée chiffrée de toute la
séance&nbsp;: une heure et demie de devoirs, avec pleurs. Elle a reçu un silence poli et
un «&nbsp;il faut qu’on regarde ça&nbsp;», et elle n’apparaît nulle part dans le document
qui remontera à la MDPH. <strong>Ce n’est pas de la mauvaise volonté&nbsp;:</strong> dans
une réunion, ce qui n’est pas explicitement demandé à l’écrit n’est presque jamais écrit.
Il faut le demander, et cela se prépare.</p>`,
)}

<h3 style="${G.H3}">4. La phrase magique, et pourquoi elle marche</h3>
<div style="${G.GRIS}">
<p style="margin:0"><em>«&nbsp;Est-ce qu’on peut le faire figurer au GEVA-Sco&nbsp;?&nbsp;»</em></p>
</div>
<p>Elle n’est ni agressive, ni technique, et elle est très difficile à refuser — parce
qu’elle ne demande pas un droit, elle demande qu’un fait soit consigné. Trois moments où
elle sert&nbsp;:</p>
<ul style="${G.UL}">
<li style="${G.LI}"><strong>Après un fait que vous venez d’apporter</strong>, pour qu’il
ne se perde pas.</li>
<li style="${G.LI}"><strong>Après un constat gênant</strong> — un moyen qui manque, une
mise en œuvre incomplète. C’est là qu’elle est la plus utile, et le plus souvent
oubliée.</li>
<li style="${G.LI}"><strong>À la fin</strong>, sous la forme&nbsp;: «&nbsp;est-ce qu’on
peut relire ensemble ce qui sera écrit&nbsp;?&nbsp;»</li>
</ul>
<p>Et sa jumelle, pour les décisions&nbsp;: <strong>«&nbsp;qui fait ça, et pour
quand&nbsp;?&nbsp;»</strong> Deux questions courtes qui transforment une réunion cordiale
en réunion utile.</p>

<h3 style="${G.H3}">5. Ce que la réunion aurait produit</h3>
<p>Avec exactement les mêmes personnes, la même durée et le même climat, mais trois
interventions préparées&nbsp;:</p>
<div style="${G.GRIS}">
<p style="margin-top:0"><em>«&nbsp;Besoin d’amorçage&nbsp;: Noam n’entre pas seul dans une
tâche écrite (2 démarrages autonomes sur 15 séances). Il enchaîne lorsque la première
ligne est amorcée avec lui — observé en classe et en séance SESSAD depuis
janvier.&nbsp;»</em></p>
<p style="margin:14px 0 0"><em>«&nbsp;L’aide humaine mutualisée représente environ 2 h par
jour&nbsp;; les créneaux d’écrit ne sont pas couverts.&nbsp;»</em></p>
<p style="margin:14px 0 0"><em>«&nbsp;Devoirs à la maison&nbsp;: 1 h 30 en moyenne, avec
pleurs. Un allègement des devoirs écrits est demandé et sera évalué en
janvier.&nbsp;»</em></p>
<p style="margin-bottom:0"><em>«&nbsp;Point intermédiaire en janvier, organisé par
l’enseignant référent.&nbsp;»</em></p>
</div>
<p>Ce texte-là, l’équipe pluridisciplinaire de la MDPH sait quoi en faire. Le premier —
«&nbsp;progrès notables, reste en difficulté, vigilance&nbsp;» — ne permet à personne de
décider quoi que ce soit, et il repassera à l’identique l’année suivante.</p>

<h3 style="${G.H3}">6. Trois façons de dire les choses difficiles</h3>
<p>Une partie de ce qu’il faut dire en ESS est inconfortable&nbsp;: un moyen qui manque,
une aide qui n’est pas là aux bons moments, un enfant qui va moins bien. Trois
formulations qui permettent de le dire sans mettre personne en accusation&nbsp;:</p>
${A.tableau(
  ['Ce qu’on n’ose pas dire', 'Comment le dire'],
  [
    [
      'L’AESH n’est jamais là quand il faut.',
      '«&nbsp;Les créneaux d’aide et les créneaux d’écrit ne coïncident pas. Est-ce qu’on peut le faire figurer&nbsp;?&nbsp;» — c’est un constat d’organisation, pas un reproche à une personne.',
    ],
    [
      'Ce qui avait été décidé l’an dernier n’a pas été fait.',
      '«&nbsp;L’an dernier il était noté …. Où en est-on&nbsp;? Est-ce qu’on peut écrire ce qui a pu être mis en place et ce qui n’a pas pu&nbsp;?&nbsp;»',
    ],
    [
      'À la maison, c’est intenable.',
      '«&nbsp;Voici ce que ça donne à la maison&nbsp;: [durée, fréquence, ce qu’on a essayé]. Est-ce qu’on peut le faire figurer&nbsp;?&nbsp;»',
    ],
  ],
)}
<p><strong>Aucune de ces trois phrases ne demande quoi que ce soit à quelqu’un
personnellement.</strong> Elles demandent qu’un fait soit écrit — et c’est justement ce
qui les rend efficaces.</p>`,
  aRetenir:
    'Dans une réunion, <strong>ce qui n’est pas explicitement demandé à l’écrit n’est presque jamais écrit</strong>. Deux phrases suffisent à changer une ESS&nbsp;: «&nbsp;est-ce qu’on peut le faire figurer au GEVA-Sco&nbsp;?&nbsp;» et «&nbsp;qui fait ça, et pour quand&nbsp;?&nbsp;»',
  exercice: {
    nom: 'Votre dernière réunion, relue',
    duree: '12 minutes',
    quoi: 'On refait l’analyse sur une ESS ou une réunion d’équipe éducative à laquelle vous avez assisté.',
    etapes: [
      'Écrivez ce qui a été dit d’important, intervention par intervention. Cinq ou six lignes suffisent.',
      'En face de chacune, écrivez ce qui manquait : une mesure, un moment, un volume, une demande.',
      'Retrouvez le seul vrai fait apporté ce jour-là — il y en a presque toujours un. A-t-il été écrit ?',
      'Écrivez la phrase de conclusion telle qu’elle a été prononcée. Contient-elle un nom et une date ? Si non, elle ne décidait rien.',
      'Réécrivez la réunion en trois interventions utiles, comme au point 5. Trois phrases, chacune avec un chiffre ou une date.',
    ],
    reussi:
      'chaque intervention porte ce qui lui manquait, vous avez repéré le fait perdu, et vos trois phrases réécrites contiennent chacune un chiffre ou une date.',
  },
  carnet: {
    intro: 'Quatre lignes de plus sur la page du module 1.',
    lignes: [
      '<strong>Le fait perdu</strong> — celui qui n’a pas été écrit.',
      '<strong>La phrase de conclusion</strong> — et si elle contenait un nom et une date.',
      '<strong>Mes trois phrases réécrites</strong> — avec un chiffre ou une date chacune.',
      '<strong>Ma phrase difficile</strong> — celle que je n’ose pas dire, et sa formulation.',
    ],
  },
  vigilance: [
    '<strong>Cette réunion n’accuse personne.</strong> Sept professionnels attentifs, aucune tension, et un document qui ne dit rien : c’est le cas le plus fréquent, pas le pire.',
    '<strong>Ne transformez pas un constat d’organisation en reproche à une personne.</strong> « Les créneaux ne coïncident pas » se discute ; « l’AESH n’est jamais là » se défend.',
    '<strong>Une explication n’est pas une observation.</strong> « C’est constitutif », « c’est son handicap », « c’est le contexte familial » ferment la discussion sans rien apporter au document.',
    '<strong>Ce qui va bien s’écrit aussi</strong>, avec la même précision. Un GEVA-Sco qui ne contient que des difficultés donne une image fausse — et elle voyage.',
  ],
  annexes:
    'la <strong>réunion de Noam corrigée</strong> intervention par intervention, le <strong>mémo des deux phrases</strong>, et le <strong>tableau des trois façons de dire les choses difficiles</strong>.',
  avant: [
    'J’ai relu une réunion réelle, intervention par intervention, avec ce qui manquait à chacune.',
    'J’ai repéré le fait qui a été perdu faute d’avoir été demandé à l’écrit.',
    'J’ai réécrit trois interventions, chacune avec un chiffre ou une date.',
  ],
};

/* ── MODULE 3 ────────────────────────────────────────────────────────────── */

const M3 = {
  reperes: {
    minutes: 12,
    apres:
      'la réunion elle-même, puis quinze jours de vérification de ce qui a été écrit et de ce qui a été fait. Le module&nbsp;4 se lit une fois le GEVA-Sco reçu, ou quinze jours après la réunion.',
    prerequis: 'les modules 1 et 2, et une réunion à venir (ou une réunion à demander).',
    evaluation: 'votre feuille d’une page, prête à être lue et donnée le jour de la réunion.',
  },
  objectifs: [
    'Écrire la feuille d’une page : ce qui a changé, deux ou trois faits, une demande',
    'Transformer une appréciation en fait daté et mesuré',
    'Formuler une demande de façon à ce qu’elle puisse être recopiée telle quelle',
    'Préparer les deux phrases qui font écrire, et la question de fin',
    'Décider à l’avance de ce que vous ferez si rien n’est écrit',
  ],
  corps: `<h3 style="${G.H3}">1. Une page, trois blocs</h3>
${SCH_FEUILLE}
<p>Pas un dossier&nbsp;: une page recto, lisible en deux minutes, que vous pouvez lire à
voix haute et laisser sur la table à la fin.</p>
<div style="${G.GRIS}">
<ol style="${G.UL}">
<li style="${G.LI}"><strong>Ce qui a changé depuis la dernière fois</strong> — trois
lignes, avec des dates, dans les deux sens.</li>
<li style="${G.LI}"><strong>Deux ou trois faits datés et mesurés</strong> — les seuls
éléments qui pourront être recopiés.</li>
<li style="${G.LI}"><strong>Une ou deux demandes</strong> — écrites comme elles devraient
apparaître dans le GEVA-Sco.</li>
</ol>
</div>
<p>Et en bas de page, pour vous seul&nbsp;: les deux phrases du module&nbsp;2, et la
question de fin. On les oublie systématiquement dans le feu de la réunion.</p>

<h3 style="${G.H3}">2. Bloc 1 — ce qui a changé</h3>
<p>Une ESS qui répète celle de l’an dernier n’aide personne, et c’est ce qui arrive quand
personne n’a préparé ce bloc. Trois lignes suffisent&nbsp;:</p>
<ul style="${G.UL}">
<li style="${G.LI}"><strong>Ce qui va mieux</strong>, avec une date de départ. C’est ce
qui manque le plus souvent, et c’est ce qui rend le reste crédible.</li>
<li style="${G.LI}"><strong>Ce qui va moins bien</strong>, depuis quand.</li>
<li style="${G.LI}"><strong>Ce qui a été mis en place</strong> depuis la dernière
réunion — par l’école, par le service, par la famille — et ce que cela a donné.</li>
</ul>
${G.exemple(
  'Trois lignes, écrites',
  `<p style="margin-bottom:0"><em>«&nbsp;Depuis novembre, il entre seul dans les tâches de
manipulation (avant&nbsp;: jamais). Depuis février, les tâches écrites se sont
dégradées&nbsp;: refus à l’entrée, alors qu’il s’y mettait avec aide en début d’année.
Mis en place en janvier&nbsp;: un plan de travail visuel en trois cases, tenu deux
semaines puis abandonné faute de temps de mise à jour.&nbsp;»</em></p>`,
)}

<h3 style="${G.H3}">3. Bloc 2 — transformer une appréciation en fait</h3>
<p>C’est le cœur de la préparation, et cela s’apprend en dix minutes. Un fait comporte
<strong>quatre éléments</strong>&nbsp;: une situation précise, une mesure (un nombre, une
durée, une fréquence), une période, et ce qui a déjà été essayé.</p>
${A.tableau(
  ['Ce qu’on dit spontanément', 'Ce qui manque', 'Le fait'],
  [
    [
      'Il est en difficulté à l’écrit.',
      'Tout&nbsp;: quelle situation, combien, depuis quand.',
      'Sur une consigne écrite, il ne démarre pas seul&nbsp;: 2 démarrages autonomes sur 15 séances entre janvier et mars. Avec la première ligne amorcée, il enchaîne.',
    ],
    [
      'Les devoirs sont difficiles.',
      'Une durée et une fréquence.',
      'Les devoirs durent en moyenne 1 h 30, quatre soirs sur cinq, avec des pleurs deux soirs sur cinq. Essayé&nbsp;: fractionner en deux fois — durée inchangée.',
    ],
    [
      'Il est fatigué l’après-midi.',
      'À partir de quand, et ce que ça donne.',
      'À partir de 14 h 30, il ne produit plus de trace écrite. Constaté chaque jour depuis la rentrée de janvier. Essayé&nbsp;: une pause à 14 h — sans effet.',
    ],
    [
      'L’AESH aide beaucoup.',
      'Un volume et des créneaux.',
      'L’aide mutualisée représente environ 2 h par jour sur 6. Les créneaux d’écrit (9 h-10 h et 14 h-15 h) ne sont pas couverts.',
    ],
    [
      'Ça se passe mal avec les autres.',
      'Quoi, combien, où.',
      'Trois conflits en récréation depuis janvier, tous au moment du retour en classe. Aucun en classe. Essayé&nbsp;: rentrer deux minutes avant le groupe — aucun conflit depuis trois semaines.',
    ],
  ],
)}
<p><strong>La colonne «&nbsp;essayé&nbsp;» est celle qui pèse.</strong> Elle montre qu’un
travail a eu lieu, et elle empêche la réponse la plus décourageante des réunions&nbsp;:
«&nbsp;et si on essayait de…&nbsp;» — alors que vous l’avez déjà fait pendant six
semaines.</p>

<h3 style="${G.H3}">4. Bloc 3 — écrire la demande</h3>
<p>Une demande utile est <strong>écrite comme elle devrait apparaître dans le
document</strong>. Vous la lisez, l’enseignant référent peut la recopier. C’est tout le
travail.</p>
${A.tableau(
  ['Ce qui ne s’écrit nulle part', 'Ce qui se recopie'],
  [
    ['«&nbsp;Il faudrait plus d’AESH.&nbsp;»', '«&nbsp;Faire figurer que les créneaux d’aide humaine ne couvrent pas les temps d’écrit, et que l’élève ne démarre pas ces tâches sans amorçage.&nbsp;»'],
    ['«&nbsp;Ce serait bien qu’il ait moins de devoirs.&nbsp;»', '«&nbsp;Demander un allègement des devoirs écrits, à évaluer lors d’un point en janvier.&nbsp;»'],
    ['«&nbsp;Il faudrait qu’on communique mieux.&nbsp;»', '«&nbsp;Mettre en place un cahier de liaison relevé chaque vendredi par l’éducatrice du SESSAD.&nbsp;»'],
    ['«&nbsp;On aimerait un ordinateur.&nbsp;»', '«&nbsp;Faire figurer le besoin d’un outil de compensation de l’écrit, au vu des éléments ci-dessus, pour l’évaluation par l’équipe pluridisciplinaire.&nbsp;»'],
    ['«&nbsp;Il faut qu’on le suive de près.&nbsp;»', '«&nbsp;Point intermédiaire en janvier, organisé par l’enseignant référent.&nbsp;»'],
  ],
)}
${G.alerte(
  'Une demande par réunion, deux au maximum',
  `<p style="margin-bottom:0">Cinq demandes dans une ESS, c’est zéro demande&nbsp;: la
réunion s’étale, rien n’est arbitré, et le document reprend une formule générale. Choisir
la demande qui compte est un travail à faire <strong>avant</strong>, pas dans la salle. Et
rappelez-vous du module&nbsp;1&nbsp;: l’ESS ne décide aucun droit. Ce qu’on lui demande,
c’est d’<strong>écrire</strong> ce sur quoi la CDAPH décidera.</p>`,
)}

<h3 style="${G.H3}">5. Le bas de page : trois phrases à ne pas oublier</h3>
<div style="${G.GRIS}">
<p style="margin-top:0"><strong>1.</strong> <em>«&nbsp;Est-ce qu’on peut le faire figurer
au GEVA-Sco&nbsp;?&nbsp;»</em> — après chaque fait, et surtout après les constats
gênants.</p>
<p style="margin:12px 0 0"><strong>2.</strong> <em>«&nbsp;Qui fait ça, et pour
quand&nbsp;?&nbsp;»</em> — après chaque décision.</p>
<p style="margin-bottom:0"><strong>3.</strong> <em>«&nbsp;Est-ce qu’on peut relire
ensemble ce qui sera écrit&nbsp;?&nbsp;»</em> — à la fin, avant que tout le monde se
lève.</p>
</div>
<p>Elles sont écrites en bas de la page pour une raison précise&nbsp;: dans une réunion,
on n’y pense pas. Les avoir sous les yeux suffit à ce qu’elles sortent.</p>

<h3 style="${G.H3}">6. Décider maintenant ce que vous ferez si rien n’est écrit</h3>
<p>Cela arrive, et sans plan on ne fait rien — puis on découvre le GEVA-Sco trois mois
plus tard. Trois lignes, décidées à froid&nbsp;:</p>
<ul style="${G.UL}">
<li style="${G.LI}"><strong>Le jour même&nbsp;:</strong> vous laissez votre feuille sur la
table, ou vous l’envoyez par courriel à l’enseignant référent en disant simplement
«&nbsp;voici les éléments que j’ai apportés, pour mémoire&nbsp;». Une trace écrite datée
existe alors, quoi qu’il arrive.</li>
<li style="${G.LI}"><strong>Sous quinze jours&nbsp;:</strong> vous demandez le GEVA-Sco.
Poliment, une phrase&nbsp;: «&nbsp;pourrais-je recevoir le GEVA-Sco de la réunion du
[date]&nbsp;?&nbsp;»</li>
<li style="${G.LI}"><strong>S’il manque quelque chose&nbsp;:</strong> vous répondez par
écrit, sans polémique&nbsp;: «&nbsp;j’ai bien reçu le document. Deux éléments abordés en
réunion n’y figurent pas&nbsp;: […]. Pourriez-vous les ajouter, ou m’indiquer comment les
verser au dossier&nbsp;?&nbsp;»</li>
</ul>
<p>Ces trois lignes ne fâchent personne et changent complètement la suite. Un dossier qui
part à la MDPH avec les éléments manquants ajoutés par la famille reste un dossier
complet — c’est tout ce qui compte.</p>

<h3 style="${G.H3}">7. Ce que vous devez avoir sur votre feuille en sortant</h3>
<div style="${G.GRIS}">
<ul style="${G.UL}">
<li style="${G.LI}">Trois lignes «&nbsp;ce qui a changé&nbsp;», avec des dates, dans les
deux sens.</li>
<li style="${G.LI}">Deux ou trois faits, chacun avec une situation, une mesure, une
période et ce qui a été essayé.</li>
<li style="${G.LI}">Une demande, deux au maximum, écrites pour être recopiées.</li>
<li style="${G.LI}">Les trois phrases, en bas de page.</li>
<li style="${G.LI}">Vos trois lignes «&nbsp;si rien n’est écrit&nbsp;».</li>
</ul>
</div>
<p><strong>Le test&nbsp;:</strong> votre feuille se lit à voix haute en deux minutes, et
chaque phrase de vos blocs 2 et 3 pourrait être recopiée telle quelle dans un document
officiel. Si une phrase ne peut pas l’être, elle n’est pas encore finie.</p>`,
  aRetenir:
    'Une page recto, trois blocs, et chaque phrase des blocs&nbsp;2 et 3 <strong>écrite pour être recopiée telle quelle</strong>. Une demande par réunion, deux au maximum — et les trois phrases notées en bas de page, parce que dans la salle on n’y pense pas.',
  exercice: {
    nom: 'La feuille d’une page',
    duree: '20 minutes',
    quoi: 'On écrit la feuille en entier, pour une réunion précise. Elle servira telle quelle.',
    etapes: [
      'Bloc 1 : trois lignes sur ce qui a changé — ce qui va mieux (avec une date), ce qui va moins bien (depuis quand), ce qui a été mis en place et ce que ça a donné.',
      'Bloc 2 : écrivez deux ou trois faits. Pour chacun, vérifiez les quatre éléments : situation, mesure, période, ce qui a été essayé. S’il manque la mesure, allez la chercher avant la réunion — comptez sur une semaine.',
      'Bloc 3 : écrivez UNE demande (deux au maximum), formulée comme elle devrait apparaître dans le GEVA-Sco. Relisez-la : pourrait-elle être recopiée telle quelle ?',
      'Recopiez les trois phrases en bas de page.',
      'Écrivez vos trois lignes « si rien n’est écrit » : la trace du jour même, la demande du GEVA-Sco, le courriel de complément.',
      'Lisez la feuille à voix haute, en vous chronométrant. Au-delà de trois minutes, coupez.',
    ],
    reussi:
      'votre feuille tient sur un recto, se lit en moins de trois minutes, et chaque phrase des blocs 2 et 3 pourrait être recopiée telle quelle dans un document officiel.',
  },
  carnet: {
    intro: 'La feuille EST le livrable. Recopiez ces cinq lignes au propre.',
    lignes: [
      '<strong>Ce qui a changé</strong> — trois lignes datées.',
      '<strong>Mes faits</strong> — deux ou trois, avec les quatre éléments.',
      '<strong>Ma demande</strong> — une, écrite pour être recopiée.',
      '<strong>Les trois phrases</strong> — en bas de page.',
      '<strong>Mon plan « si rien n’est écrit »</strong> — les trois lignes.',
    ],
  },
  vigilance: [
    '<strong>N’arrivez pas avec un dossier.</strong> Une page se lit et se recopie ; dix pages se posent sur la table et ne sont jamais ouvertes.',
    '<strong>Une mesure qui manque se va chercher avant.</strong> Compter les devoirs sur une semaine, ou les démarrages autonomes sur dix séances, prend une minute par jour et change la réunion.',
    '<strong>Ne demandez pas un droit à l’ESS.</strong> Demandez que le besoin soit écrit : c’est la CDAPH qui décide, sur ce qu’elle lit.',
    '<strong>Écrivez aussi ce qui va bien</strong>, avec la même précision. C’est ce qui rend le reste crédible, et c’est ce que l’enfant mérite de lire dans son dossier.',
  ],
  annexes:
    'le <strong>gabarit de la feuille d’une page</strong>, le <strong>tableau « appréciation → fait »</strong>, la <strong>liste des demandes recopiables</strong>, et les <strong>trois courriels types</strong> (demander une réunion, demander le GEVA-Sco, demander un complément).',
  avant: [
    'Ma feuille tient sur un recto et se lit en moins de trois minutes.',
    'Chacun de mes faits contient une situation, une mesure, une période et ce qui a été essayé.',
    'Ma demande pourrait être recopiée telle quelle dans le GEVA-Sco.',
  ],
  pause: {
    jours: 'la réunion, puis quinze jours',
    texte: `<p>Votre feuille est prête. La suite du parcours se joue en deux
temps&nbsp;: <strong>la réunion</strong>, puis <strong>quinze jours</strong> pendant
lesquels vous vérifiez ce qui a été écrit et ce qui a été fait.</p>
<p>Le module&nbsp;4 se lit une fois le GEVA-Sco reçu — ou quinze jours après la réunion si
vous ne l’avez pas reçu, ce qui est en soi une information à traiter.</p>
<p style="margin-bottom:0">Date de la réunion&nbsp;: …… / …… &nbsp;·&nbsp; date de
relecture&nbsp;: …… / …… .</p>`,
  },
};

/* ── MODULE 4 ────────────────────────────────────────────────────────────── */

const M4 = {
  reperes: {
    minutes: 12,
    prerequis: 'les modules 1 à 3, la réunion passée, et si possible le GEVA-Sco reçu.',
    evaluation:
      'la relecture du document, la liste de ce qui manque, et le courriel de complément écrit.',
  },
  objectifs: [
    'Relire un GEVA-Sco et repérer ce qui a disparu entre la réunion et l’écrit',
    'Écrire un courriel de complément qui ne fâche personne et qui produit une trace',
    'Vérifier, au bout de quinze jours, ce qui a été fait de ce qui avait été décidé',
    'Préparer la réunion suivante dès celle-ci',
    'Savoir à qui s’adresser quand ce parcours ne suffit plus',
  ],
  corps: `<h3 style="${G.H3}">1. Relire le document, en quatre passages</h3>
<p>Vingt minutes, une fois. C’est le moment le plus rentable de tout le parcours, parce
que c’est le seul où l’on peut encore corriger quelque chose.</p>
${A.tableau(
  ['Passage', 'Ce qu’on cherche'],
  [
    [
      '<strong>1. Mes faits</strong>',
      'Chacun des deux ou trois faits de ma feuille figure-t-il&nbsp;? Avec sa mesure, ou seulement en version édulcorée&nbsp;? «&nbsp;Difficultés à l’écrit&nbsp;» n’est pas la même chose que «&nbsp;2 démarrages autonomes sur 15&nbsp;».',
    ],
    [
      '<strong>2. Ma demande</strong>',
      'Figure-t-elle&nbsp;? Sous quelle forme&nbsp;? Une demande transformée en «&nbsp;vigilance&nbsp;» ou en «&nbsp;à réfléchir&nbsp;» a disparu.',
    ],
    [
      '<strong>3. Les décisions</strong>',
      'Y a-t-il un nom et une date en face de chaque chose à faire&nbsp;? Sinon, il n’y a pas de décision, il y a une intention.',
    ],
    [
      '<strong>4. Ce qui est écrit sur l’enfant</strong>',
      'Y a-t-il des qualifications sans fait («&nbsp;opposant&nbsp;», «&nbsp;peu investi&nbsp;», «&nbsp;immature&nbsp;»)&nbsp;? Y a-t-il ce qui va bien&nbsp;? Ce document le suivra&nbsp;: il a le droit d’y être décrit correctement.',
    ],
  ],
)}
${G.alerte(
  'Le quatrième passage n’est pas un détail',
  `<p style="margin-bottom:0">Un GEVA-Sco qui ne contient que des difficultés donne une
image fausse, et cette image alimente une évaluation. Si votre enfant, ou l’enfant que
vous accompagnez, a fait des progrès quelque part, et qu’ils n’apparaissent pas, cela se
demande aussi&nbsp;: «&nbsp;pourrait-on ajouter ce qui a progressé depuis
novembre&nbsp;?&nbsp;» Personne ne refuse jamais cette demande-là.</p>`,
)}

<h3 style="${G.H3}">2. Le courriel de complément</h3>
<p>Court, factuel, sans reproche, et il produit une trace datée quoi qu’il advienne. C’est
le seul écrit du parcours, et il tient en cinq lignes.</p>
<div style="${G.GRIS}">
<p style="margin-top:0"><em>Objet&nbsp;: ESS du [date] — [prénom de l’élève], compléments</em></p>
<p style="margin:12px 0 0"><em>Bonjour,</em></p>
<p style="margin:12px 0 0"><em>J’ai bien reçu le document de la réunion du [date], je vous
en remercie.</em></p>
<p style="margin:12px 0 0"><em>Deux éléments abordés en réunion n’y figurent pas&nbsp;:</em></p>
<p style="margin:12px 0 0"><em>— [fait 1, avec sa mesure]&nbsp;;</em></p>
<p style="margin:12px 0 0"><em>— [fait 2, avec sa mesure].</em></p>
<p style="margin:12px 0 0"><em>Pourriez-vous les ajouter, ou m’indiquer comment les verser
au dossier&nbsp;?</em></p>
<p style="margin-bottom:0"><em>Bien cordialement,</em></p>
</div>
<ul style="${G.UL}">
<li style="${G.LI}"><strong>Il s’adresse à l’enseignant référent</strong>, qui coordonne
l’équipe de suivi (article D351-12).</li>
<li style="${G.LI}"><strong>Il ne contient aucun reproche</strong>, et c’est ce qui le rend
efficace. Un oubli en réunion n’est presque jamais une manœuvre&nbsp;: c’est une réunion
qui va vite.</li>
<li style="${G.LI}"><strong>Il produit une trace datée</strong> même s’il reste sans
réponse — et c’est déjà beaucoup.</li>
</ul>

<h3 style="${G.H3}">3. Quinze jours après : ce qui a été fait</h3>
<p>Reprenez les décisions du document et cochez. Trois cas seulement&nbsp;:</p>
${A.tableau(
  ['Ce que vous constatez', 'Ce que ça veut dire', 'Ce que vous faites'],
  [
    [
      'C’est fait.',
      'La réunion a produit. C’est plus fréquent qu’on ne le croit quand un nom et une date figuraient.',
      'Notez-le. Cela servira de point de départ à la réunion suivante — «&nbsp;ce qui a changé&nbsp;», bloc 1.',
    ],
    [
      'Ce n’est pas fait, mais il n’y avait ni nom ni date.',
      'Il n’y avait pas de décision. Ce n’est pas un manquement de quelqu’un.',
      'À la prochaine réunion, systématiser la question «&nbsp;qui fait ça, et pour quand&nbsp;?&nbsp;».',
    ],
    [
      'Ce n’est pas fait alors qu’un nom et une date figuraient.',
      'Là, il y a quelque chose à demander — sans polémique.',
      'Un courriel d’une ligne&nbsp;: «&nbsp;il était noté que [X] serait mis en place avant le [date]. Où en est-on&nbsp;?&nbsp;» Et à la réunion suivante, ce point ouvre le bloc&nbsp;1.',
    ],
  ],
)}
<p><strong>Ce suivi de quinze jours est ce qui distingue une famille ou un service qui
obtient des choses d’une famille ou d’un service qui n’en obtient pas</strong> — bien plus
que l’aisance à l’oral ou la connaissance des textes.</p>

<h3 style="${G.H3}">4. Préparer la suivante dès maintenant</h3>
<p>La réunion suivante se prépare le jour où celle-ci se termine, et cela ne coûte
rien&nbsp;:</p>
<ul style="${G.UL}">
<li style="${G.LI}"><strong>Ouvrez une page dans un carnet ou un fichier</strong>, avec la
date de la prochaine ESS en haut.</li>
<li style="${G.LI}"><strong>Notez-y les faits au fil de l’eau</strong>, en une ligne, avec
la date. Trois lignes par trimestre suffisent. C’est ainsi qu’on arrive avec des mesures
plutôt qu’avec des impressions — l’effort est nul, réparti sur l’année.</li>
<li style="${G.LI}"><strong>Notez ce qui a été décidé</strong> et ce qui a été fait. Le
bloc&nbsp;1 de la prochaine feuille sera déjà écrit.</li>
<li style="${G.LI}"><strong>Si la situation change nettement</strong>, n’attendez pas
l’échéance annuelle&nbsp;: une réunion peut être demandée en cours d’année.</li>
</ul>
${G.exemple(
  'Le carnet d’une ligne par semaine',
  `<p style="margin-bottom:0">C’est la pratique la plus efficace observée chez les familles
et les services qui obtiennent des choses en ESS, et c’est la plus simple&nbsp;: une ligne
datée par semaine, dans les notes du téléphone. «&nbsp;12/11&nbsp;: devoirs 1 h 40, pleurs.
19/11&nbsp;: a démarré seul la rédaction, une fois. 26/11&nbsp;: refus d’aller à
l’école lundi.&nbsp;» En juin, il y a trente lignes datées — et personne, dans la salle, ne
peut apporter mieux.</p>`,
)}

<h3 style="${G.H3}">5. Quand ce parcours ne suffit plus</h3>
${A.tableau(
  ['Ce que vous constatez', 'À qui cela revient'],
  [
    [
      'Une décision de la MDPH que vous voulez contester.',
      'Les voies et délais de recours figurent sur la notification elle-même. Une association d’usagers, un service social ou un juriste vous accompagnera bien mieux qu’une page web — et il y a des délais à ne pas laisser passer.',
    ],
    [
      'Aucune ESS n’a lieu, alors qu’un PPS existe.',
      'L’enseignant référent, qui réunit et coordonne l’équipe (D351-12). Par écrit, en rappelant que l’évaluation est au moins annuelle (D351-10).',
    ],
    [
      'Un désaccord persistant sur l’orientation.',
      'Cela se traite avec la MDPH et l’enseignant référent, pas en ESS. L’ESS peut en revanche écrire le désaccord, et c’est utile.',
    ],
    [
      'Un enfant qui va mal — sommeil, alimentation, idées noires, refus scolaire durable.',
      'Un médecin, sans attendre la prochaine réunion. Aucune préparation d’ESS ne remplace cela.',
    ],
    [
      'Vous ne savez pas comment formuler une demande à la MDPH.',
      'Le guide «&nbsp;ESS et GEVA-Sco&nbsp;» du site détaille les documents et leurs auteurs&nbsp;; une association d’usagers ou une PCPE peut vous aider à monter le dossier.',
    ],
  ],
)}
<p>Ce parcours travaille une chose et une seule&nbsp;: <strong>faire en sorte que ce qui a
été dit soit écrit</strong>. C’est modeste, et c’est ce qui manque le plus souvent.</p>`,
  aRetenir:
    'Le travail ne s’arrête pas à la réunion. <strong>Relire le document, demander ce qui manque par écrit, et vérifier à quinze jours ce qui a été fait</strong> — c’est ce qui distingue ceux qui obtiennent des choses de ceux qui n’en obtiennent pas.',
  exercice: {
    nom: 'La relecture, et le courriel',
    duree: '20 minutes',
    quoi: 'Le document sous les yeux. Si vous ne l’avez pas encore, la première étape devient la seule.',
    etapes: [
      'Si vous n’avez pas reçu le GEVA-Sco : écrivez le courriel de demande, une phrase, et envoyez-le. Reprenez cet exercice à réception.',
      'Passage 1 : cochez, un par un, si vos faits figurent — et s’ils ont gardé leur mesure.',
      'Passage 2 : votre demande figure-t-elle, et sous quelle forme ? Transformée en « vigilance », elle a disparu.',
      'Passage 3 : listez les décisions. Combien portent un nom et une date ?',
      'Passage 4 : relevez les qualifications sans fait, et vérifiez que ce qui va bien apparaît.',
      'Écrivez le courriel de complément avec les deux éléments manquants les plus importants. Deux, pas six.',
      'Ouvrez la page de la prochaine réunion, avec sa date en haut, et notez-y les décisions à vérifier dans quinze jours.',
    ],
    reussi:
      'les quatre passages sont faits, votre courriel est écrit (et envoyé), et la page de la prochaine réunion est ouverte avec sa date.',
  },
  carnet: {
    intro: 'Les dernières lignes du carnet. Elles constituent votre bilan.',
    lignes: [
      '<strong>Mes faits qui figurent</strong> — et ceux qui ont perdu leur mesure.',
      '<strong>Ma demande</strong> — telle qu’elle a été écrite.',
      '<strong>Les décisions</strong> — combien avec un nom et une date.',
      '<strong>Mon courriel de complément</strong> — envoyé le ……',
      '<strong>La page de la prochaine réunion</strong> — ouverte, avec sa date.',
    ],
  },
  vigilance: [
    '<strong>Ne réécrivez jamais un document officiel vous-même.</strong> On demande un ajout, ou on verse une pièce complémentaire — on ne corrige pas le texte d’un autre.',
    '<strong>Un courriel sans reproche obtient beaucoup plus qu’un courrier de mise en demeure</strong>, et il laisse la même trace datée.',
    '<strong>Les délais de recours MDPH sont courts.</strong> Ils figurent sur la notification : ne les laissez pas passer en attendant une réunion.',
    '<strong>Ce parcours ne dit pas ce qu’une MDPH accordera</strong>, et personne ne peut le dire. Il augmente la qualité de ce qu’elle lira, ce qui n’est pas rien.',
  ],
  annexes:
    'la <strong>grille de relecture en quatre passages</strong>, les <strong>trois courriels types</strong>, et la <strong>page de suivi</strong> à ouvrir pour la réunion suivante.',
  avant: [
    'J’ai relu le document en quatre passages, ou j’ai écrit le courriel pour l’obtenir.',
    'J’ai écrit et envoyé mon courriel de complément, avec deux éléments au maximum.',
    'La page de la prochaine réunion est ouverte, avec sa date et les décisions à vérifier.',
  ],
};

/* ── ANNEXES ─────────────────────────────────────────────────────────────── */

const ANNEXES =
  A.entete('Préparer une équipe de suivi de la scolarisation') +
  A.fiche({
    numero: 1,
    titre: 'Qui fait quoi, sous quel article',
    quand: 'à lire une fois, et à ressortir avant d’écrire un courrier.',
    contenu:
      A.tableau(
        ['Ce qui est en jeu', 'Ce que dit le texte', 'Article'],
        [
          [
            'L’équipe de suivi de la scolarisation évalue le PPS et sa mise en œuvre.',
            'Elle procède <strong>au moins une fois par an</strong> à cette évaluation. Elle peut se réunir plus souvent, à la demande de la famille ou de l’équipe.',
            '<strong>D351-10</strong> du code de l’éducation',
          ],
          [
            'Les expertises sur lesquelles l’équipe s’appuie.',
            'C’est là que trouve sa place la contribution d’un SESSAD, d’un IME, d’un soignant.',
            '<strong>D351-11</strong>',
          ],
          [
            'Qui réunit et coordonne l’ESS.',
            'L’<strong>enseignant référent</strong>, qui assure aussi la permanence des relations avec l’élève et ses parents.',
            '<strong>D351-12</strong>',
          ],
          [
            'L’aide humaine — mutualisée ou individuelle.',
            'Un même élève ne peut se voir attribuer simultanément une aide mutualisée et une aide individuelle. <strong>Cet article ne régit PAS l’ESS</strong>, contrairement à ce qu’on lit partout.',
            '<strong>D351-16-1</strong>',
          ],
          [
            'Le GEVA-Sco.',
            'Fixé par arrêté, en deux versions&nbsp;: «&nbsp;première demande&nbsp;» et «&nbsp;réexamen&nbsp;».',
            'arrêté',
          ],
        ],
      ) +
      `<div style="${G.ALERTE}">
<p style="margin:0"><strong>L’erreur la plus fréquente&nbsp;:</strong> citer le
<strong>D351-16-1</strong> comme l’article de l’équipe de suivi. Il traite de l’aide
humaine. L’article de l’ESS est le <strong>D351-10</strong>, complété par le D351-11 et le
D351-12.</p>
</div>
<h4 style="margin:30px 0 8px">Et ce que l’ESS ne fait pas</h4>
<p>Elle <strong>n’attribue aucun droit</strong>. L’AESH, le matériel, l’orientation,
l’aménagement des examens relèvent d’une décision de la <strong>CDAPH</strong>, à la MDPH.
L’ESS constate, propose, et surtout <strong>écrit</strong> — et c’est sur cet écrit que la
décision se prendra.</p>`,
  }) +
  A.fiche({
    numero: 2,
    titre: 'Les deux GEVA-Sco, et le compte rendu qui n’existe pas',
    quand: 'quand quelqu’un cherche « un modèle de compte rendu d’ESS ».',
    contenu:
      A.tableau(
        ['Le document', 'Qui le remplit', 'Ce qu’il est'],
        [
          ['<strong>GEVA-Sco première demande</strong>', 'L’équipe éducative, convoquée par le directeur de l’établissement, en dialogue avec l’élève majeur ou ses représentants légaux.', 'Il concerne un élève qui n’a pas encore de PPS.'],
          ['<strong>GEVA-Sco réexamen</strong>', 'L’enseignant référent, lors de la réunion de l’ESS.', 'Il fait le bilan du PPS existant et <strong>vaut compte rendu de l’ESS</strong>.'],
        ],
      ) +
      `<div style="${G.GRIS}">
<p style="margin-top:0"><strong>Il n’existe pas de compte rendu d’ESS distinct du
GEVA-Sco.</strong> Chercher un modèle, c’est chercher un document qui n’existe pas.</p>
<p style="margin-bottom:0"><strong>Et ce document n’est pas interne&nbsp;: il
remonte.</strong> Il alimente l’évaluation de l’équipe pluridisciplinaire de la MDPH et
pèse sur les décisions de compensation. Une phrase floue écrite ce jour-là coûte parfois
une année entière.</p>
</div>`,
  }) +
  A.fiche({
    numero: 3,
    titre: 'La feuille d’une page — gabarit',
    quand: 'avant chaque réunion. Une page recto, lue en moins de trois minutes.',
    contenu: `<div style="${G.GRIS}">
<p style="margin-top:0"><strong>Élève&nbsp;:</strong> ……………………… &nbsp;·&nbsp;
<strong>réunion du&nbsp;:</strong> …… / …… &nbsp;·&nbsp; <strong>préparée
par&nbsp;:</strong> ………………………</p>
<p style="margin:18px 0 6px"><strong>1. CE QUI A CHANGÉ DEPUIS LA DERNIÈRE FOIS</strong></p>
<p style="margin:0">Ce qui va mieux, depuis …………&nbsp;: …………………………………………………………</p>
<p style="margin:8px 0 0">Ce qui va moins bien, depuis …………&nbsp;: ………………………………………………</p>
<p style="margin:8px 0 0">Mis en place depuis la dernière réunion, et résultat&nbsp;:
…………………………………</p>
<p style="margin:18px 0 6px"><strong>2. DEUX OU TROIS FAITS</strong>
<em>(situation · mesure · période · ce qui a été essayé)</em></p>
<p style="margin:0">a) …………………………………………………………………………………………………</p>
<p style="margin:8px 0 0">b) …………………………………………………………………………………………………</p>
<p style="margin:8px 0 0">c) …………………………………………………………………………………………………</p>
<p style="margin:18px 0 6px"><strong>3. MA DEMANDE</strong> <em>(une, deux au maximum,
écrite pour être recopiée)</em></p>
<p style="margin:0">…………………………………………………………………………………………………………</p>
</div>
<div style="${G.ALERTE}">
<p style="margin-top:0"><strong>En bas de page, pour moi&nbsp;:</strong></p>
<p style="margin:0">1. «&nbsp;Est-ce qu’on peut le faire figurer au GEVA-Sco&nbsp;?&nbsp;»
— après chaque fait, et surtout après les constats gênants.</p>
<p style="margin:8px 0 0">2. «&nbsp;Qui fait ça, et pour quand&nbsp;?&nbsp;» — après chaque
décision.</p>
<p style="margin-bottom:0">3. «&nbsp;Est-ce qu’on peut relire ensemble ce qui sera
écrit&nbsp;?&nbsp;» — à la fin, avant que tout le monde se lève.</p>
</div>
<p><strong>Le test&nbsp;:</strong> chaque phrase des blocs 2 et 3 pourrait-elle être
recopiée telle quelle dans un document officiel&nbsp;? Si non, elle n’est pas finie.</p>`,
  }) +
  A.fiche({
    numero: 4,
    titre: 'Transformer une appréciation en fait',
    quand: 'au moment d’écrire le bloc 2. C’est le cœur de la préparation.',
    contenu:
      `<p>Un fait comporte <strong>quatre éléments</strong>&nbsp;: une situation précise,
une mesure (nombre, durée, fréquence), une période, et ce qui a déjà été essayé.</p>` +
      A.tableau(
        ['Ce qu’on dit spontanément', 'Le fait'],
        [
          ['Il est en difficulté à l’écrit.', 'Sur une consigne écrite, il ne démarre pas seul&nbsp;: 2 démarrages autonomes sur 15 séances entre janvier et mars. Avec la première ligne amorcée, il enchaîne.'],
          ['Les devoirs sont difficiles.', 'Les devoirs durent en moyenne 1 h 30, quatre soirs sur cinq, avec des pleurs deux soirs sur cinq. Essayé&nbsp;: fractionner en deux fois — durée inchangée.'],
          ['Il est fatigué l’après-midi.', 'À partir de 14 h 30, plus aucune trace écrite produite. Constaté chaque jour depuis janvier. Essayé&nbsp;: une pause à 14 h — sans effet.'],
          ['L’AESH aide beaucoup.', 'L’aide mutualisée représente environ 2 h par jour sur 6. Les créneaux d’écrit (9 h-10 h et 14 h-15 h) ne sont pas couverts.'],
          ['Ça se passe mal avec les autres.', 'Trois conflits en récréation depuis janvier, tous au retour en classe&nbsp;; aucun en classe. Essayé&nbsp;: rentrer deux minutes avant le groupe — aucun conflit depuis trois semaines.'],
          ['Il ne veut plus aller à l’école.', 'Refus le matin&nbsp;: 6 matins sur 20 depuis la rentrée de janvier, tous des lundis ou des jeudis (jours avec évaluation écrite).'],
          ['Il a fait des progrès.', 'Il entre seul dans les tâches de manipulation depuis novembre (auparavant&nbsp;: jamais). Il termine désormais les exercices de mathématiques sans aide, 4 fois sur 5.'],
        ],
      ) +
      `<div style="${G.GRIS}">
<p style="margin:0"><strong>La colonne «&nbsp;essayé&nbsp;» est celle qui pèse.</strong>
Elle montre qu’un travail a eu lieu, et elle évite la réponse la plus décourageante des
réunions&nbsp;: «&nbsp;et si on essayait de…&nbsp;» — alors que vous l’avez fait pendant
six semaines.</p>
</div>
<p><strong>Il vous manque une mesure&nbsp;?</strong> Allez la chercher avant la réunion.
Compter les devoirs sur une semaine, ou les démarrages autonomes sur dix séances, prend une
minute par jour.</p>`,
  }) +
  A.fiche({
    numero: 5,
    titre: 'Des demandes qui se recopient',
    quand: 'au moment d’écrire le bloc 3.',
    contenu:
      A.tableau(
        ['Ce qui ne s’écrit nulle part', 'Ce qui se recopie'],
        [
          ['«&nbsp;Il faudrait plus d’AESH.&nbsp;»', '«&nbsp;Faire figurer que les créneaux d’aide humaine ne couvrent pas les temps d’écrit, et que l’élève ne démarre pas ces tâches sans amorçage.&nbsp;»'],
          ['«&nbsp;Ce serait bien qu’il ait moins de devoirs.&nbsp;»', '«&nbsp;Demander un allègement des devoirs écrits, à évaluer lors d’un point en janvier.&nbsp;»'],
          ['«&nbsp;Il faudrait qu’on communique mieux.&nbsp;»', '«&nbsp;Mettre en place un cahier de liaison relevé chaque vendredi par l’éducatrice du SESSAD.&nbsp;»'],
          ['«&nbsp;On aimerait un ordinateur.&nbsp;»', '«&nbsp;Faire figurer le besoin d’un outil de compensation de l’écrit, au vu des éléments ci-dessus, pour l’évaluation par l’équipe pluridisciplinaire.&nbsp;»'],
          ['«&nbsp;Il faut qu’on le suive de près.&nbsp;»', '«&nbsp;Point intermédiaire en janvier, organisé par l’enseignant référent.&nbsp;»'],
          ['«&nbsp;Il faudrait des aménagements.&nbsp;»', '«&nbsp;Faire figurer les aménagements en place et ceux qui ne peuvent pas l’être actuellement, avec le motif.&nbsp;»'],
          ['«&nbsp;On voudrait qu’il soit mieux compris.&nbsp;»', '«&nbsp;Faire figurer que les consignes orales longues ne sont pas suivies, et que la même consigne découpée en deux l’est.&nbsp;»'],
        ],
      ) +
      `<div style="${G.ALERTE}">
<p style="margin:0"><strong>Une demande par réunion, deux au maximum.</strong> Cinq
demandes, c’est zéro demande&nbsp;: rien n’est arbitré et le document reprend une formule
générale. Et l’ESS ne décide aucun droit — ce qu’on lui demande, c’est d’écrire ce sur quoi
la CDAPH décidera.</p>
</div>`,
  }) +
  A.fiche({
    numero: 6,
    titre: 'Dire les choses difficiles',
    quand: 'quand il faut signaler un moyen qui manque, ou une décision non appliquée.',
    contenu:
      A.tableau(
        ['Ce qu’on n’ose pas dire', 'Comment le dire'],
        [
          ['L’AESH n’est jamais là quand il faut.', '«&nbsp;Les créneaux d’aide et les créneaux d’écrit ne coïncident pas. Est-ce qu’on peut le faire figurer&nbsp;?&nbsp;» — un constat d’organisation, pas un reproche à une personne.'],
          ['Ce qui avait été décidé l’an dernier n’a pas été fait.', '«&nbsp;L’an dernier il était noté …. Où en est-on&nbsp;? Est-ce qu’on peut écrire ce qui a pu être mis en place et ce qui n’a pas pu, avec le motif&nbsp;?&nbsp;»'],
          ['À la maison, c’est intenable.', '«&nbsp;Voici ce que ça donne à la maison&nbsp;: [durée, fréquence, ce qu’on a essayé]. Est-ce qu’on peut le faire figurer&nbsp;?&nbsp;»'],
          ['Je ne suis pas d’accord avec l’orientation proposée.', '«&nbsp;Je ne partage pas cette orientation. Est-ce que mon désaccord peut être écrit, avec les motifs&nbsp;?&nbsp;» — un désaccord écrit compte&nbsp;; un désaccord dit ne compte pas.'],
          ['Ce qui est écrit sur mon enfant est faux.', '«&nbsp;Cette formulation ne correspond pas à ce que j’observe. Voici ce que je constate&nbsp;: […]. Est-ce qu’on peut l’ajouter&nbsp;?&nbsp;»'],
        ],
      ) +
      `<p><strong>Aucune de ces phrases ne demande quelque chose à quelqu’un
personnellement.</strong> Elles demandent qu’un fait soit écrit — et c’est précisément ce
qui les rend efficaces, et difficiles à refuser.</p>`,
  }) +
  A.fiche({
    numero: 7,
    titre: 'La réunion de Noam, corrigée intervention par intervention',
    quand: 'comme modèle, à côté de votre propre préparation.',
    contenu:
      A.tableau(
        ['Ce qui a été dit', 'Ce qui aurait pu être dit'],
        [
          [
            '«&nbsp;Il reste très en difficulté à l’écrit, dès qu’il y a une trace écrite ça bloque.&nbsp;»',
            '«&nbsp;Sur une consigne écrite, il ne commence pas seul&nbsp;: 2 démarrages autonomes sur 15 séances. Quand un adulte écrit le premier mot avec lui, il enchaîne la suite.&nbsp;»',
          ],
          [
            '«&nbsp;Je suis sur trois enfants, quand je suis à côté ça va mieux.&nbsp;»',
            '«&nbsp;Je suis présente environ 2 h par jour sur 6. Les créneaux où je ne suis pas avec lui — 9 h-10 h et l’après-midi — sont exactement ceux où il y a de l’écrit.&nbsp;»',
          ],
          [
            '«&nbsp;Le travail se poursuit, il est en progrès sur la relation.&nbsp;»',
            '«&nbsp;En séance, il entre dans une tâche écrite lorsque le matériel est sorti et la première ligne amorcée. Sans amorçage, il n’entre pas. Reproductible depuis janvier.&nbsp;»',
          ],
          [
            '«&nbsp;Les devoirs durent une heure et demie, il pleure.&nbsp;»',
            'La même phrase — c’est un vrai fait — suivie de&nbsp;: «&nbsp;est-ce qu’on peut le faire figurer au GEVA-Sco&nbsp;?&nbsp;»',
          ],
          [
            '«&nbsp;Il y a une fragilité attentionnelle, c’est constitutif.&nbsp;»',
            '«&nbsp;Sur les tâches écrites, l’attention se maintient environ dix minutes puis se rompt. Un fractionnement en deux fois dix minutes pourrait être essayé et évalué.&nbsp;»',
          ],
          [
            '«&nbsp;On reconduit, on maintient, on note qu’il faut être vigilant.&nbsp;»',
            '«&nbsp;Trois points au GEVA-Sco&nbsp;: (1) besoin d’amorçage systématique&nbsp;; (2) les créneaux d’écrit ne coïncident pas avec la présence de l’AESH&nbsp;; (3) devoirs&nbsp;: 1 h 30 avec pleurs. Point intermédiaire en janvier, organisé par l’enseignant référent.&nbsp;»',
          ],
        ],
      ) +
      `<div style="${G.GRIS}">
<p style="margin:0"><strong>Ce que la scène enseigne&nbsp;:</strong> la seule donnée
chiffrée de la réunion avait été apportée par la mère, et elle n’a été écrite nulle part.
Dans une réunion, <strong>ce qui n’est pas explicitement demandé à l’écrit n’est presque
jamais écrit</strong>.</p>
</div>`,
  }) +
  A.fiche({
    numero: 8,
    titre: 'Trois courriels types',
    quand: 'avant la réunion, après la réunion, et quinze jours après.',
    contenu: `<h4 style="margin:0 0 8px">1. Demander une réunion</h4>
<div style="${G.GRIS}">
<p style="margin-top:0"><em>Objet&nbsp;: [prénom de l’élève] — demande de réunion de
l’équipe de suivi</em></p>
<p style="margin:10px 0 0"><em>Bonjour,</em></p>
<p style="margin:10px 0 0"><em>La situation de [prénom] a évolué depuis la dernière
réunion&nbsp;: [une phrase, avec un fait daté].</em></p>
<p style="margin:10px 0 0"><em>Serait-il possible de réunir l’équipe de suivi de la
scolarisation&nbsp;?</em></p>
<p style="margin-bottom:0"><em>Bien cordialement,</em></p>
</div>
<h4 style="margin:30px 0 8px">2. Demander le GEVA-Sco</h4>
<div style="${G.GRIS}">
<p style="margin-top:0"><em>Objet&nbsp;: ESS du [date] — [prénom de l’élève]</em></p>
<p style="margin:10px 0 0"><em>Bonjour,</em></p>
<p style="margin:10px 0 0"><em>Pourrais-je recevoir le GEVA-Sco établi lors de la réunion
du [date]&nbsp;?</em></p>
<p style="margin-bottom:0"><em>Vous remerciant par avance,</em></p>
</div>
<h4 style="margin:30px 0 8px">3. Demander un complément</h4>
<div style="${G.GRIS}">
<p style="margin-top:0"><em>Objet&nbsp;: ESS du [date] — [prénom de l’élève],
compléments</em></p>
<p style="margin:10px 0 0"><em>Bonjour,</em></p>
<p style="margin:10px 0 0"><em>J’ai bien reçu le document de la réunion du [date], je vous
en remercie.</em></p>
<p style="margin:10px 0 0"><em>Deux éléments abordés en réunion n’y figurent
pas&nbsp;:</em></p>
<p style="margin:10px 0 0"><em>— [fait 1, avec sa mesure]&nbsp;;</em></p>
<p style="margin:10px 0 0"><em>— [fait 2, avec sa mesure].</em></p>
<p style="margin:10px 0 0"><em>Pourriez-vous les ajouter, ou m’indiquer comment les verser
au dossier&nbsp;?</em></p>
<p style="margin-bottom:0"><em>Bien cordialement,</em></p>
</div>
<ul style="${G.UL}">
<li style="${G.LI}">Ils s’adressent à l’<strong>enseignant référent</strong>, qui réunit et
coordonne l’équipe de suivi (D351-12).</li>
<li style="${G.LI}"><strong>Aucun ne contient de reproche</strong>, et c’est ce qui les
rend efficaces. Un oubli en réunion n’est presque jamais une manœuvre.</li>
<li style="${G.LI}">Chacun <strong>produit une trace datée</strong> même s’il reste sans
réponse.</li>
</ul>`,
  }) +
  A.fiche({
    numero: 9,
    titre: 'Relire le document, en quatre passages',
    quand: 'à réception du GEVA-Sco. Vingt minutes, une fois.',
    contenu:
      A.tableau(
        ['Passage', 'Ce qu’on cherche', '☐'],
        [
          ['<strong>1. Mes faits</strong>', 'Figurent-ils&nbsp;? Avec leur mesure, ou en version édulcorée&nbsp;? «&nbsp;Difficultés à l’écrit&nbsp;» ≠ «&nbsp;2 démarrages sur 15&nbsp;».', '☐'],
          ['<strong>2. Ma demande</strong>', 'Figure-t-elle, et sous quelle forme&nbsp;? Transformée en «&nbsp;vigilance&nbsp;» ou «&nbsp;à réfléchir&nbsp;», elle a disparu.', '☐'],
          ['<strong>3. Les décisions</strong>', 'Y a-t-il un nom et une date en face de chaque chose à faire&nbsp;? Sinon, il n’y a pas de décision, il y a une intention.', '☐'],
          ['<strong>4. Ce qui est écrit sur l’enfant</strong>', 'Des qualifications sans fait («&nbsp;opposant&nbsp;», «&nbsp;peu investi&nbsp;», «&nbsp;immature&nbsp;»)&nbsp;? Ce qui va bien apparaît-il&nbsp;?', '☐'],
        ],
      ) +
      `<div style="${G.GRIS}">
<p style="margin-top:0"><strong>À quinze jours&nbsp;: ce qui a été fait.</strong></p>
<ul style="${G.UL}">
<li style="${G.LI}"><strong>C’est fait</strong> → notez-le, ce sera le bloc 1 de la
prochaine feuille.</li>
<li style="${G.LI}"><strong>Pas fait, sans nom ni date</strong> → il n’y avait pas de
décision. Systématiser «&nbsp;qui fait ça, et pour quand&nbsp;?&nbsp;» la prochaine
fois.</li>
<li style="${G.LI}"><strong>Pas fait, avec un nom et une date</strong> → un courriel d’une
ligne&nbsp;: «&nbsp;il était noté que [X] serait mis en place avant le [date]. Où en
est-on&nbsp;?&nbsp;»</li>
</ul>
</div>
<h4 style="margin:30px 0 8px">La page de la prochaine réunion</h4>
<p>Ouvrez-la maintenant, avec la date en haut, et notez-y <strong>une ligne datée par
semaine</strong> — dans les notes du téléphone, cela suffit. En juin, vous aurez trente
lignes datées, et personne dans la salle ne pourra apporter mieux.</p>`,
  }) +
  A.pied();

module.exports = {
  slug: 'preparer-une-equipe-de-suivi-de-la-scolarisation',
  uuid: '948fad74-0c93-439c-864c-e3c8882d034b',
  modules: [
    { titre: 'Module 1 — Ce qu’est une ESS, et ce qu’elle peut écrire', minutes: 12, html: G.assembler(M1) },
    { titre: 'Module 2 — Une réunion cordiale qui ne produit rien', minutes: 10, html: G.assembler(M2) },
    { titre: 'Module 3 — Exercice guidé : la feuille d’une page', minutes: 12, html: G.assembler(M3) },
    { titre: 'Module 4 — Relire, compléter, et vérifier à quinze jours', minutes: 12, html: G.assembler(M4) },
  ],
  annexes: ANNEXES,
};
