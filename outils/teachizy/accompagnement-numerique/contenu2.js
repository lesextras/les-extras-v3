// Journées 1, 2 et 3 du parcours « Accompagnement au numérique », version enrichie
// du 28/09/2026 (demande de Siham). Remplace contenu.js : mêmes clés, mêmes titres.
// Règles : aucun tiret cadratin ou demi-cadratin dans les textes, « attestation »
// et jamais l’autre mot, aucun chiffre inventé, prénoms fictifs, aucune donnée réelle.
const { h3, h4, p, ul, ol, hr, table, carte, encart, alerte, pe, lignes, matrice, grille, accessibilite, casPratique } = require('./h');

const reperes = (titre, items) =>
  `<div style="background:#f6f7f8;border-radius:12px;padding:18px 24px;margin:0 0 30px"><h3 style="margin-top:0">${titre}</h3><ul style="margin:14px 0;padding-left:22px">${items
    .map((i) => `<li style="margin:7px 0">${i}</li>`)
    .join('')}</ul></div>`;
const objectifs = (items, quand = 'la leçon') => h3('Objectifs') + pe(`À la fin de ${quand}, le participant :`) + ul(items);
const aRetenir = (items) => carte('À retenir', ul(items));
const avantSuite = (items) =>
  carte('Avant de passer à la suite', pe('Cette étape est acquise quand vous pouvez cocher ces trois lignes :') + ul(items), '30px 0 0');
const erreurs = (items) => h4('Les erreurs les plus fréquentes') + ul(items);
const transfert = (items) => encart('Transfert au poste de travail', ul(items));
const chrono = (titre, duree, consigne, sans) =>
  hr() + h3(`Mise en situation chronométrée : ${titre}`) + pe(`<strong>Durée :</strong> ${duree}.`) + consigne + encart('Version sans chronomètre', pe(sans));
const tf = (head, fn, rows) => table(head, rows.map(fn));
const modalites = (rows) => tf(['Moment', 'Comment', 'Ce qu’on en garde'], (r) => [`<strong>${r[0]}</strong><br>${r[1]}`, r[2], r[3]], rows);
const pourFormateur = (items) => encart('Pour le formateur', ul(items));
const deroule = (rows) =>
  table(
    ['Horaire', 'Séquence et méthode', 'Support et production attendue'],
    rows.map(([h, d, seq, meth, sup, prod]) =>
      prod === undefined
        ? [`<strong>${h}</strong><br>${d}`, `<em>${seq}</em>`, '']
        : [`<strong>${h}</strong><br>${d}`, `<strong>${seq}</strong><br>${meth}`, `<em>Support :</em> ${sup}<br><em>Production :</em> ${prod}`],
    ),
  );

// Quiz : questions en haut, réponses et explications regroupées en bas de la leçon.
const LETTRES = ['A', 'B', 'C', 'D'];
const quizQuestions = (qs) =>
  hr() +
  h3('Quiz d’autocorrection : six questions') +
  p('Répondez aux six questions avant de regarder les réponses : elles sont regroupées tout en bas de la leçon, avec l’explication de la bonne réponse et de chacune des autres. Le quiz n’est pas noté ; il sert à repérer ce qui est à revoir.') +
  qs.map((q, i) => h4(`Question ${i + 1}`) + p(q.q) + ul(q.o.map((o, j) => `<strong>${LETTRES[j]}.</strong> ${o}`))).join('');
const quizReponses = (qs) =>
  hr() +
  h3('Réponses du quiz et explications') +
  qs
    .map((q, i) =>
      carte(
        `Question ${i + 1} : réponse ${q.r}`,
        pe(`<strong>Pourquoi ${q.r} :</strong> ${q.pourquoi}`) + pe(`<strong>Pourquoi pas les autres :</strong> ${q.autres}`),
        '14px 0',
      ),
    )
    .join('');

const echelle = table(
  ['Niveau', 'Ce que la personne fait seule'],
  [
    ['<strong>0 · Découverte</strong>', 'n’utilise pas l’outil, ou seulement avec quelqu’un à côté'],
    ['<strong>1 · Débutant</strong>', 'fait les gestes de base en suivant une consigne pas à pas'],
    ['<strong>2 · Utilisateur</strong>', 'réalise les tâches courantes de son poste sans aide'],
    ['<strong>3 · Autonome</strong>', 'résout un imprévu, choisit la bonne méthode, aide un collègue'],
  ],
);

const MODULES = [
  ['Socle · Environnement numérique professionnel', 'fichiers, dossiers partagés, sauvegarde : le prérequis de tous les autres', 'je dois pouvoir retrouver en quelques instants le compte rendu de la dernière réunion d’équipe'],
  ['Module 1 · Word', 'courriers, comptes rendus, documents professionnels', 'je dois pouvoir produire le courrier aux familles à partir du modèle de la structure'],
  ['Module 2 · Excel', 'tableaux de suivi, présences, activités', 'je dois pouvoir tenir seule le tableau de présence mensuel de l’unité'],
  ['Module 3 · Outlook', 'mails et agenda', 'je dois pouvoir traiter la boîte partagée du service sans oublier de message'],
  ['Module 4 · Canva', 'affiches et supports de communication internes', 'je dois pouvoir faire l’affiche de la fête de fin d’année, lisible et sans photo non autorisée'],
  ['Module 5 · Dossier usager informatisé (DUI)', 'saisie, recherche et traçabilité dans le logiciel métier', 'je dois pouvoir saisir une observation datée dans le DUI avant la fin de mon service'],
  ['Écrits professionnels et numérique', 'synthétiser ses écrits pour les adapter au numérique', 'je dois pouvoir écrire une transmission courte, factuelle et lisible à l’écran'],
  ['Module 6 · Outils d’IA au quotidien', 'reformuler, résumer, préparer, sans exposer de données', 'je dois pouvoir préparer le plan d’un courrier avec l’outil autorisé, sans y mettre aucune donnée personnelle'],
];

const REVUE_J = (n, plus) => `Journée ${n} revue le 28 septembre 2026 : déroulé, objectifs, matrice et renvois vers les autres éléments du parcours vérifiés à cette date.${plus ? ' ' + plus : ''} Prochaine revue : septembre 2027, ou avant si un module du parcours change.`;

// ═══════════════════════════ JOURNÉE 1 ═══════════════════════════

const J1_PROGRAMME =
  reperes('Repères de la journée 1 (niveau 1)', [
    '<strong>Intitulé :</strong> évaluer ses compétences numériques, repérer ce qui se transfère et ce qui bloque, connaître les règles du RGPD, et repartir avec un parcours à la carte.',
    '<strong>Public :</strong> professionnels du social et du médico-social : éducateurs spécialisés, moniteurs-éducateurs, accompagnants éducatifs et sociaux (AES), secrétaires, chefs de service, en MECS, IME, ITEP, SESSAD, ESAT, EHPAD ou dans une autre structure du secteur.',
    '<strong>Prérequis :</strong> aucun niveau numérique n’est demandé. Il faut un poste (celui de la structure, ou un poste prêté pour la journée) et, si possible, avoir rempli avant d’arriver le questionnaire du « Bilan de compétences numériques de départ ».',
    '<strong>Durée :</strong> une journée, de 9 h 00 à 17 h 00, soit sept heures de formation, pause déjeuner non comprise.',
    '<strong>Modalités :</strong> en présentiel dans la structure, sur les outils de l’équipe, ou en classe virtuelle avec partage d’écran.',
    '<strong>Livrable de la journée :</strong> la fiche bilan individualisée, relue et signée avec le formateur, déposée avant 17 h dans le devoir de la journée.',
  ]) +
  h3('Ce que la journée produit') +
  p('La journée 1 ne forme pas encore à un outil : elle sert à savoir, pour chaque participant, <strong>où il en est</strong>, <strong>pourquoi il est là</strong>, <strong>ce qu’il sait déjà faire sans le savoir</strong>, <strong>ce qui l’empêche d’avancer</strong> et <strong>quelles règles s’appliquent à ses gestes numériques</strong>. Tout converge vers un seul document : la fiche bilan individualisée, qui dit quel module pratique suivre, dans quel ordre, et si la journée 2 est utile.') +
  p('Le parcours est modulable : chacun est inscrit sur le ou les modules dont il a besoin, et pas sur les autres.') +
  hr() +
  h3('Le déroulé de la journée') +
  deroule([
    ['9 h 00 à 9 h 30', '30 min', 'Accueil, programme et règles du groupe', 'Apport et échange en groupe : tour de table (poste, structure, un outil utilisé chaque jour), présentation du programme, règles de confidentialité.', 'cette leçon et « Bienvenue : votre parcours numérique à la carte »', 'règles du groupe posées, besoins d’aménagement recueillis, émargement du matin'],
    ['9 h 30 à 10 h 45', '1 h 15', 'Évaluation des compétences numériques', 'Travail individuel (questionnaire), puis mises en situation courtes sur poste, observées par le formateur.', '« Bilan de compétences numériques de départ » et leçon « Évaluation des compétences numériques »', 'grille par domaine, niveau par outil, tableau des habitudes'],
    ['10 h 45 à 11 h 00', '15 min', 'Pause'],
    ['11 h 00 à 12 h 30', '1 h 30', 'Compétences transférables', 'Échange en groupe, démonstration, mise en situation sur poste, travail individuel. Pendant le travail individuel, le formateur reçoit chaque participant dix minutes : c’est le premier temps d’entretien (la demande de départ).', 'leçon « Compétences transférables »', 'trois compétences transférables par personne, un geste refait sur le poste, la demande de départ écrite'],
    ['12 h 30 à 13 h 30', '1 h', 'Pause déjeuner'],
    ['13 h 30 à 14 h 15', '45 min', 'Points de blocage', 'Apport court, échange en groupe sur les familles de blocages, puis deuxième temps d’entretien individuel pendant l’exercice d’analyse.', 'leçon « Repérer les points de blocage »', 'blocages retenus avec l’accord de la personne, une action et un responsable pour chacun'],
    ['14 h 15 à 15 h 15', '1 h', 'RGPD et hygiène numérique', 'Apport, démonstration (le même message avant et après), mise en situation chronométrée, puis entrée dans le module 7.', 'leçon RGPD, leçon et quiz du module 7 « Hygiène numérique et protection des données »', 'trois engagements RGPD personnels'],
    ['15 h 15 à 15 h 30', '15 min', 'Pause'],
    ['15 h 30 à 16 h 00', '30 min', 'Cas pratique corrigé et quiz', 'Travail individuel, puis correction commentée en groupe.', 'leçon « Cas pratique corrigé et quiz de la journée 1 »', 'la fiche bilan fictive corrigée, le quiz autocorrigé'],
    ['16 h 00 à 16 h 50', '50 min', 'Fiche bilan individualisée', 'Travail individuel, puis relecture à deux avec le formateur : c’est le troisième temps d’entretien.', 'leçon « Fiche bilan individualisée » et devoir de la journée', 'la fiche bilan complète, relue, signée et déposée'],
    ['16 h 50 à 17 h 00', '10 min', 'Clôture', 'Échange en groupe : « ce que je change dès demain ».', 'questionnaire de satisfaction à chaud', 'avis de satisfaction, émargement de l’après-midi'],
  ]) +
  pe('Les horaires sont indicatifs et s’adaptent au groupe ; les séquences, leur ordre et les productions attendues restent les mêmes.') +
  hr() +
  h3('Les objectifs de la journée') +
  pe('À la fin de la journée, le participant :') +
  ol([
    '<strong>situe son niveau</strong> sur chacun des outils utiles à son poste, sur l’échelle 0 à 3, à partir d’une mise en situation courte observée par le formateur, et le reporte dans sa fiche bilan ;',
    '<strong>formule par écrit la demande</strong> qui a conduit à sa formation, en une à trois phrases validées avec le formateur : qui l’a faite, à partir de quelle situation, et quelle tâche du poste doit changer ;',
    '<strong>nomme au moins trois compétences numériques personnelles transférables</strong>, chacune reliée à une tâche précise de son poste, et refait l’une d’elles sur le poste professionnel sans aide ;',
    '<strong>identifie ses points de blocage</strong> et écrit, pour chacun, une action et la personne qui s’en charge, sans qu’aucune difficulté personnelle ne soit notée sans son accord ;',
    '<strong>applique les principes du RGPD</strong> à des gestes du quotidien : il classe correctement les gestes de la mise en situation et écrit trois engagements qu’il applique dès le lendemain ;',
    '<strong>rend sa fiche bilan individualisée</strong> avant 17 h, complète, relue et signée, avec quatre modules recommandés au plus, dans l’ordre, chacun relié à un besoin « je dois pouvoir… ».',
  ]) +
  matrice([
    ['Situer son niveau, outil par outil, à partir d’une mise en situation observée', 'Questionnaire et mises en situation courtes sur poste', 'Niveau observé noté par le formateur (réussi seul, avec aide, non réussi)', 'La grille de niveau dans la fiche bilan', '5. Résolution de problèmes'],
    ['Formuler par écrit la demande de départ', 'Premier temps d’entretien individuel', 'La demande dit qui, à partir de quelle situation, quelle tâche doit changer', 'La rubrique « Demande de départ » de la fiche', '5. Résolution de problèmes'],
    ['Nommer trois compétences transférables et en refaire une sur le poste', 'Échange en groupe, démonstration, mise en situation sur poste', 'Trois lignes complètes ; le geste refait seul sur l’outil de la structure', 'Le tableau de correspondance', '1. Information et données · 2. Communication et collaboration · 3. Création de contenu (selon la compétence)'],
    ['Identifier ses blocages, avec une action et un responsable', 'Échange en groupe, deuxième temps d’entretien', 'Chaque blocage retenu a une action et un responsable, avec l’accord de la personne', 'La rubrique « Blocages » de la fiche', '5. Résolution de problèmes'],
    ['Appliquer les principes du RGPD aux gestes du quotidien', 'Démonstration, mise en situation chronométrée, cas pratique, quiz', 'Gestes correctement classés ; trois engagements concrets', 'Les trois engagements', '4. Sécurité'],
    ['Rendre sa fiche bilan complète, relue et signée', 'Rédaction, puis relecture avec le formateur', 'Devoir noté avec la grille commune : validé à partir de 17 sur 24, jamais avec un 0 en sécurité', 'La fiche bilan déposée', '5. Résolution de problèmes'],
  ]) +
  hr() +
  h3('Modalités d’évaluation') +
  modalites(
    [
      ['Matin', 'Le niveau de départ', 'Questionnaire, mises en situation observées, grille du bilan de départ ; rien n’est noté sur 20 ni classé', 'La grille, reprise à l’identique au bilan final pour mesurer la progression'],
      ['Toute la journée', 'Les gestes', 'Observation du formateur : réussi seul, avec aide, non réussi', 'Des faits, jamais un jugement'],
      ['Après-midi', 'La compréhension', 'Cas pratique corrigé et quiz d’autocorrection de six questions', 'Les points à revoir, pour soi'],
      ['Fin de journée', 'Le livrable', 'Devoir « Fiche bilan individualisée », noté avec la grille commune du parcours', 'La fiche validée, qui déclenche l’inscription sur les modules'],
    ],
  ) +
  p('Le devoir note la <strong>qualité de la fiche</strong>, jamais le niveau numérique : une personne à 0 partout peut rendre une fiche parfaite. Les acquis évalués figurent sur l’attestation de fin de formation.') +
  hr() +
  h3('Les autres éléments de cette section, et quand on s’en sert') +
  p('La section contient aussi des éléments déjà en place : les leçons de la journée y renvoient sans les répéter.') +
  table(
    ['Élément', 'Quand', 'Son rôle dans la journée'],
    [
      ['« Bienvenue : votre parcours numérique à la carte »', '9 h 00', 'Présenté en ouverture : les étapes du parcours, la grille commune des devoirs, les règles de confidentialité.'],
      ['« Bilan de compétences numériques de départ » et son devoir', '9 h 30, puis toute la journée', 'Le protocole de l’évaluation. Son entretien est réparti en trois temps d’environ dix minutes ; son plan individuel signé est repris par renvoi dans la fiche bilan.'],
      ['« Socle : environnement numérique professionnel » et son devoir', 'Après la journée, si la fiche bilan le recommande', 'Premier module conseillé à qui est à 0 ou 1 sur « Poste de travail et fichiers ».'],
      ['Module 7 « Hygiène numérique et protection des données » : leçon, quiz et devoir', '14 h 15 pour la leçon et le quiz ; le devoir ensuite', 'Les gestes de sécurité, dans le prolongement de la leçon RGPD. Si le temps manque, le quiz se fait en ligne après la journée.'],
      ['Bilan final : bilan « après », quiz final, devoir bilan final, « Transfert au poste de travail »', 'En fin de parcours, après les modules suivis', 'Pas pendant la journée 1 : la grille du matin y est reprise pour mesurer la progression.'],
    ],
  ) +
  pourFormateur([
    '<strong>Animation :</strong> alternez apport court, démonstration et pratique sur poste, et partez des tâches réelles du groupe (transmissions, plannings, tableaux de présence, courriers aux familles), jamais d’une liste de fonctions de logiciel.',
    '<strong>Un participant en difficulté :</strong> proposez la version sans chronomètre, limitez les mises en situation aux outils utiles à son poste, proposez un binôme s’il le souhaite, et notez ce qu’il fait plutôt que ce qu’il ne fait pas. Une difficulté qui dépasse le cadre de la formation (lecture, santé, handicap) ne se note qu’avec son accord, dans ses mots, et seulement pour adapter la suite.',
    '<strong>Un participant réticent</strong> (« on m’a inscrit », « je n’en ai pas besoin ») : reconnaissez la réticence, dites ce qui sera transmis, commencez par une compétence transférable qu’il réussit, ne forcez jamais une mise en situation. S’il refuse, notez « non évalué, à la demande de la personne ».',
    '<strong>Confidentialité :</strong> posez la règle dès 9 h 00 : ce qui se dit dans le groupe reste dans le groupe. Les grilles et la fiche bilan appartiennent au participant ; l’employeur ne reçoit, avec son accord, que les modules recommandés et leur durée. Si un participant évoque une situation réelle d’une personne accompagnée, recentrez sur un exemple fictif et ne notez rien.',
    '<strong>Matériel en présentiel :</strong> un poste par participant avec les outils de la structure et l’accès à l’espace partagé ; si possible, un environnement de test du logiciel métier ou des dossiers fictifs ; un vidéoprojecteur ; l’échelle de niveau affichée ; les fiches bilan en version papier et numérique ; la feuille d’émargement par demi-journée.',
    '<strong>Matériel en classe virtuelle :</strong> un test de connexion avant la journée, le partage d’écran du participant, des salles de sous-groupe pour les entretiens, une fiche bilan par personne en document individuel (jamais un document commun), l’émargement numérique.',
    '<strong>Entretiens :</strong> les trois temps se prennent pendant les travaux individuels ; si le groupe est trop nombreux, prévoyez un complément en classe virtuelle plutôt que de raccourcir la relecture de la fiche bilan.',
  ]) +
  accessibilite(REVUE_J(1));

const J1_EVAL =
  reperes('Repères de la leçon', [
    '<strong>Place dans la journée 1 :</strong> de 9 h 30 à 10 h 45, juste après l’accueil. Tout le reste de la journée s’appuie sur ce que cette évaluation fait apparaître.',
    '<strong>Pour chaque participant :</strong> son niveau outil par outil, ses habitudes numériques (au travail et en dehors), et la demande qui a conduit à la formation.',
    '<strong>Modalité :</strong> le questionnaire et les mises en situation du « Bilan de compétences numériques de départ », complétés par les mises en situation courtes par outil de cette leçon, puis un premier échange de dix minutes avec le formateur.',
    '<strong>Preuve produite :</strong> la grille remplie, reprise en fin de journée dans la fiche bilan individualisée.',
  ]) +
  objectifs([
    'situe son niveau sur l’échelle 0 à 3 pour chaque outil utile à son poste, à partir d’une mise en situation courte observée par le formateur, et non d’une simple déclaration ;',
    'remplit les deux colonnes du tableau des habitudes (vie personnelle et travail), avec au moins une réponse par ligne ;',
    'formule avec le formateur, en une à trois phrases, la demande qui a conduit à sa formation : qui l’a faite, à partir de quelle situation, et quelle tâche doit changer.',
  ]) +
  h3('Ce que cette leçon ajoute au bilan de départ') +
  p('Le « Bilan de compétences numériques de départ » donne le protocole : questionnaire, entretien, mises en situation observées, grille par domaine et plan individuel. On ne le répète pas ici. Cette leçon ajoute trois regards dont la journée 1 a besoin pour orienter vers les modules pratiques.') +
  table(
    ['', 'Bilan de compétences numériques de départ', 'Cette leçon'],
    [
      ['<strong>Ce qu’on regarde</strong>', 'les grands domaines de compétence (information, communication, création, sécurité, environnement numérique, IA)', 'les outils du poste, un par un : c’est ce qui décide du module pratique'],
      ['<strong>L’échelle</strong>', 'la grille du bilan, de 0 à 4, par domaine', 'l’échelle 0 à 3, par outil, ci-dessous'],
      ['<strong>En plus</strong>', 'le plan individuel signé', 'les habitudes personnelles et professionnelles, et la demande de départ écrite'],
    ],
  ) +
  pe('Les deux grilles ne se mélangent pas : la grille par domaine mesure la progression au bilan final, l’échelle par outil sert à choisir les modules. Une même mise en situation peut nourrir les deux : on ne fait pas faire deux fois le même exercice.') +
  h3('Pourquoi on évalue avant de former') +
  p('Deux personnes inscrites à la même formation n’arrivent jamais avec le même bagage. L’une se débrouille très bien sur son téléphone mais n’a jamais ouvert un tableur ; l’autre utilise Excel tous les jours mais perd ses fichiers. Former les deux de la même façon, c’est ennuyer la première et perdre la seconde.') +
  p('L’évaluation de la journée 1 sert à trois choses : situer chaque personne, comprendre pourquoi elle est là, et décider ensemble de la suite de son parcours. Ce n’est pas un examen : il n’y a ni note ni classement, et rien de ce qui est dit n’est transmis à l’employeur sans l’accord de la personne.') +
  hr() +
  h3('1. Le niveau, outil par outil') +
  p('Pour chaque outil, le participant se situe, puis le formateur confirme par une mise en situation courte (deux à cinq minutes). On note ce que la personne <strong>fait</strong>, pas ce qu’elle pense savoir faire.') +
  echelle +
  table(
    ['Domaine', 'Mise en situation courte', 'Niveau (0 à 3)'],
    [
      ['Poste de travail et fichiers', 'retrouver un document, le renommer, le ranger dans le bon dossier', ''],
      ['Traitement de texte (Word)', 'mettre en forme un courrier d’une page à partir d’un modèle', ''],
      ['Tableur (Excel)', 'compléter un tableau de suivi et faire un total', ''],
      ['Messagerie et agenda (Outlook)', 'répondre à un mail avec une pièce jointe, poser un rendez-vous', ''],
      ['Supports visuels (Canva)', 'modifier une affiche à partir d’un modèle', ''],
      ['Logiciel métier (DUI ou autre)', 'retrouver une information dans un dossier fictif', ''],
      ['Outils d’IA', 'reformuler un texte court sans y mettre de donnée personnelle', ''],
      ['Sécurité et données', 'repérer ce qui ne va pas dans un mail suspect', ''],
    ],
  ) +
  h4('On n’évalue que les outils utiles au poste') +
  p('Une AES d’EHPAD qui ne fera jamais d’affiche n’a pas à passer la mise en situation Canva : on écrit « non utile au poste » et on passe. Évaluer tout, pour tout le monde, prend du temps et met inutilement en échec. Le formateur demande d’abord : « Parmi ces outils, lesquels utilisez-vous ou devrez-vous utiliser au travail ? »') +
  h4('Conduire une mise en situation courte') +
  ol([
    '<strong>Donner une consigne neutre et complète</strong>, sur un fichier fictif prêt à l’emploi : « Voici le tableau de présence de l’unité. Complétez les présences de mardi, puis faites le total de la semaine. »',
    '<strong>Ne pas aider pendant l’exercice.</strong> Si la personne bloque, on attend qu’elle demande ; une aide donnée se note.',
    '<strong>Noter trois choses :</strong> réussi seul, réussi avec aide (et laquelle), non réussi ; le temps approximatif ; la méthode utilisée.',
    '<strong>Dire ce qu’on a vu</strong>, en une phrase, avant de passer à la suite : la personne repart en sachant où elle en est.',
  ]) +
  hr() +
  h3('Démonstration : la même observation, mal notée puis bien notée') +
  p('Mise en situation « Tableur » avec Malik, moniteur-éducateur en IME (situation fictive). Consigne : compléter les présences de mardi dans le tableau fictif de l’unité et calculer le total de la semaine.') +
  table(
    ['Ce qu’on lit parfois', 'Ce qu’on écrit'],
    [
      ['« Se débrouille moyen avec Excel. »', '« A complété seul les présences de mardi. A fait le total avec la somme automatique après une indication du formateur. Environ six minutes. »'],
      ['« Pas à l’aise, stressé. »', 'Rien sur l’état émotionnel : ce n’est pas une observation de compétence. Si Malik dit lui-même « je stresse devant un tableau », on peut le noter entre guillemets, avec son accord, dans la rubrique confiance.'],
      ['« Niveau 2. »', '« Niveau 1 : gestes de base réussis, calcul réussi avec aide. » Le niveau est justifié par ce qui a été vu.'],
    ],
  ) +
  p('La bonne note est plus longue, mais elle sert : au moment de la fiche bilan, on sait exactement ce qui manque (le calcul), donc quel module recommander et à quel niveau le commencer.') +
  h4('Quand l’auto-évaluation et l’observation ne disent pas la même chose') +
  p('Les écarts sont précieux. Une personne qui se met à 3 et réussit avec aide risque de faire des erreurs sans s’en rendre compte ; une personne qui se met à 0 et réussit seule a surtout un besoin de confiance. Le bilan de départ fixe la règle pour les domaines (un écart de deux points ou plus rend le domaine prioritaire) ; pour les outils, on écrit simplement les deux niveaux côte à côte et on en parle pendant l’entretien.') +
  chrono(
    'le tour des outils utiles',
    'quinze minutes pour trois mises en situation au choix parmi les outils utiles à votre poste',
    ul([
      'Choisissez avec le formateur les trois outils que vous utilisez le plus, ou que vous devrez utiliser bientôt.',
      'Pour chacun, lisez la consigne, réalisez la tâche sur le fichier fictif, puis levez la main.',
      'Le formateur note : réussi seul, avec aide, non réussi, et le temps approximatif.',
    ]),
    'Même exercice, sans limite de temps et une mise en situation à la fois. Le formateur ne note pas le temps, seulement le résultat et la méthode. C’est la version proposée d’office à toute personne qui en fait la demande ou qui a signalé un besoin d’aménagement.',
  ) +
  hr() +
  h3('2. Les habitudes numériques') +
  p('Les habitudes disent souvent plus que le niveau. Le questionnaire pose les mêmes questions sur la vie privée et sur le travail, pour faire apparaître ce qui existe déjà et ce qui peut être transféré (c’est l’objet de la leçon suivante).') +
  table(
    ['Question', 'Dans ma vie personnelle', 'Au travail'],
    [
      ['Quels appareils j’utilise chaque jour ?', '', ''],
      ['Quelles applications j’ouvre le plus souvent ?', '', ''],
      ['Comment je range mes photos, documents, messages ?', '', ''],
      ['Comment je retrouve une information ?', '', ''],
      ['À qui je demande de l’aide quand je bloque ?', '', ''],
      ['Qu’est-ce que j’évite de faire sur écran ?', '', ''],
    ],
  ) +
  encart(
    'Dans votre secteur : quatre profils fictifs',
    ul([
      '<strong>Inès, éducatrice spécialisée en MECS (internat) :</strong> échange beaucoup par messages vocaux sur son téléphone ; au travail, recopie le soir dans le logiciel ce qu’elle a noté sur le cahier de transmissions papier.',
      '<strong>Olivier, secrétaire en ESAT :</strong> tient les comptes de son club de sport dans un tableur ; au bureau, utilise un logiciel de gestion sans savoir exporter une liste.',
      '<strong>Fatou, AES en EHPAD :</strong> fait chaque semaine une visio avec ses petits-enfants ; au travail, n’a pas d’identifiant personnel sur la tablette de l’unité.',
      '<strong>Claire, cheffe de service en SESSAD :</strong> gère l’agenda familial partagé sur son téléphone ; au travail, tient un agenda papier et doit ressaisir les rendez-vous de l’équipe.',
    ]) + pe('Dans les quatre cas, la compétence existe déjà (messages, tableur, visio, agenda partagé) : c’est la matière de la leçon sur les compétences transférables. Et dans deux cas, un blocage apparaît déjà (pas d’identifiant, double saisie papier et écran) : il sera repris dans la leçon sur les points de blocage.'),
  ) +
  hr() +
  h3('3. La demande qui a conduit à la formation') +
  p('Une formation naît toujours d’une demande : celle de la direction, d’un chef de service, d’un changement d’outil, ou de la personne elle-même. La connaître permet de vérifier, en fin de journée, que les recommandations y répondent vraiment.') +
  ul([
    '<strong>Qui a demandé la formation ?</strong> la personne, son responsable, la direction, un financeur',
    '<strong>À partir de quelle situation ?</strong> un nouveau logiciel, un DUI qui arrive, des écrits à produire plus vite, une difficulté répétée',
    '<strong>Qu’est-ce qui doit changer après ?</strong> une tâche précise, formulée avec la personne : « je fais seule le tableau de présence du mois »',
    '<strong>Ce que la personne attend, elle, de la formation</strong>, qui n’est pas toujours la même chose que la demande de départ',
  ]) +
  h4('D’une demande floue à une demande qu’on peut vérifier') +
  table(
    ['Ce qu’on entend', 'Ce qu’on écrit dans la grille'],
    [
      ['« Il faut qu’elle se mette à l’informatique. »', '« Demande de la cheffe de service : que la secrétaire produise seule le tableau de présence mensuel de l’unité, sans le refaire à la main. »'],
      ['« Je veux être à l’aise avec le DUI. »', '« Demande de la personne : saisir une observation datée dans le DUI avant la fin de son service, sans aide. »'],
      ['« L’équipe écrit trop long. »', '« Demande de la direction : des transmissions courtes et factuelles, lisibles à l’écran par l’équipe suivante. »'],
      ['« On m’a inscrit, je ne sais pas pourquoi. »', '« Demande de l’employeur, à préciser avec le cadre. La personne souhaite apprendre à retrouver ses documents. » On note les deux.'],
    ],
  ) +
  h4('Le premier temps d’entretien : dix minutes, cinq questions') +
  ol([
    'Qui vous a proposé ou demandé cette formation, et pourquoi à votre avis ?',
    'Quelle tâche de votre travail vous prend du temps ou vous met en difficulté avec l’écran ?',
    'Si la formation réussit, qu’est-ce que vous ferez autrement dans trois mois ?',
    'Qu’est-ce que vous faites déjà bien avec le numérique, au travail ou ailleurs ?',
    'Y a-t-il quelque chose dont vous avez besoin pour que la formation se passe bien (aménagement, horaires, matériel) ?',
  ]) +
  encart('Le point de vigilance', pe('Quand la demande vient de l’employeur, on le dit clairement à la personne et on l’écrit dans la grille. Si la personne ne s’y retrouve pas, on note les deux points de vue : la fiche bilan en tiendra compte.')) +
  alerte('Rester à sa place', pe('Le formateur observe des gestes numériques. Il ne pose aucun diagnostic, ni médical, ni psychologique, ni sur la personnalité (« anxieux », « rigide », « réfractaire »). Une difficulté de lecture, de santé ou liée à un handicap se note seulement si la personne le souhaite, dans ses mots, et uniquement pour adapter la formation.')) +
  erreurs([
    'Noter le niveau que la personne annonce, sans mise en situation.',
    'Aider pendant l’exercice, puis noter « réussi seul ».',
    'Faire passer tous les outils à tout le monde, y compris ceux dont le poste n’a pas besoin.',
    'Écrire la demande de l’employeur comme si c’était celle de la personne.',
    'Écrire une impression (« peu motivé ») au lieu d’un fait observé.',
  ]) +
  aRetenir([
    'On évalue ce que la personne fait, en situation, pas ce qu’elle déclare.',
    'On n’évalue que les outils utiles au poste ; les autres sont notés « non utile au poste ».',
    'Les habitudes personnelles sont une ressource, pas un défaut à corriger.',
    'La demande de départ est écrite noir sur blanc : c’est elle qu’on vérifie en fin de parcours.',
    'Le formateur observe et note des faits ; il ne pose jamais de diagnostic.',
  ]) +
  avantSuite([
    'chaque outil utile à votre poste a un niveau de 0 à 3, issu d’une mise en situation observée ;',
    'votre tableau des habitudes est rempli dans les deux colonnes ;',
    'votre demande de départ est écrite (qui, quelle situation, quelle tâche doit changer) et relue avec le formateur.',
  ]);

const J1_TRANSFERT =
  reperes('Repères de la leçon', [
    '<strong>Place dans la journée 1 :</strong> de 11 h 00 à 12 h 30, à partir des habitudes que chacun vient de décrire.',
    '<strong>Objectif :</strong> identifier ce que chaque participant sait déjà faire dans sa vie privée et qui lui servira au travail, puis faciliter ce passage.',
    '<strong>Modalité :</strong> échange en groupe, démonstration, mise en situation sur poste, puis tableau individuel de correspondance. Pendant le travail individuel, le formateur conduit le premier temps d’entretien.',
    '<strong>Preuve produite :</strong> trois compétences transférables par personne, reprises dans la fiche bilan, et un geste refait sur le poste professionnel.',
  ]) +
  objectifs([
    'nomme au moins trois compétences numériques qu’il utilise dans sa vie personnelle, formulées avec un verbe d’action (« organiser », « rédiger », « remplir »), et non avec le nom d’une application ;',
    'relie chacune à une tâche précise de son poste, écrite dans le tableau de correspondance ;',
    'refait l’une de ces compétences sur l’outil de la structure, sans aide, pendant la mise en situation ;',
    'cite, pour chaque compétence, la règle professionnelle qui change au travail (données, destinataires, droits d’accès).',
  ]) +
  h3('Ce qu’on sait déjà faire sans le savoir') +
  p('Beaucoup de professionnels se disent « nuls en informatique » alors qu’ils gèrent chaque jour des photos, des messageries, des achats en ligne, des démarches administratives. Les gestes sont souvent les mêmes que ceux du travail : seuls l’outil et le cadre changent.') +
  table(
    ['Ce que je fais chez moi', 'La compétence derrière', 'Ce que ça donne au travail'],
    [
      ['Je classe mes photos par album ou par date', 'organiser et retrouver des fichiers', 'ranger les documents du service dans une arborescence commune'],
      ['J’écris dans un groupe de messagerie familial', 'écrire court, au bon destinataire', 'rédiger une transmission claire, ou un mail à un partenaire'],
      ['Je fais mes démarches en ligne (CAF, impôts, banque)', 'remplir un formulaire, joindre une pièce, garder une preuve', 'renseigner un dossier dans le DUI ou une plateforme de partenaire'],
      ['Je gère un budget ou une liste de courses sur mon téléphone', 'tenir une liste, faire des calculs simples', 'tenir un tableau de suivi (présences, stocks, activités)'],
      ['Je crée des invitations ou des montages photo', 'mettre en page un visuel', 'faire l’affiche d’une activité ou d’une réunion de familles'],
      ['Je me méfie des SMS ou mails bizarres', 'repérer une arnaque', 'appliquer les règles de sécurité et protéger les données des personnes accompagnées'],
    ],
  ) +
  h3('Dans votre secteur : d’autres correspondances') +
  table(
    ['Structure et poste (fictifs)', 'Compétence personnelle', 'Tâche professionnelle où elle sert'],
    [
      ['MECS, éducateur en internat', 'partager un agenda familial sur son téléphone', 'consulter et mettre à jour l’agenda partagé du groupe (rendez-vous médicaux, visites, audiences)'],
      ['IME, monitrice-éducatrice', 'faire un diaporama de photos de vacances', 'préparer un support visuel pour une activité, sans photo de jeune reconnaissable sans autorisation'],
      ['ITEP, éducatrice scolaire', 'suivre les devoirs de ses enfants sur l’espace numérique du collège', 'retrouver une information dans l’outil de liaison avec l’école, dans le cadre prévu'],
      ['SESSAD, éducateur en déplacement', 'se repérer avec une application de cartes', 'organiser ses tournées de visites et les noter dans l’agenda du service'],
      ['ESAT, moniteur d’atelier', 'comparer des prix en ligne avant un achat', 'tenir le tableau des commandes de l’atelier et vérifier les quantités'],
      ['EHPAD, AES', 'organiser une visio avec sa famille', 'aider un résident à joindre ses proches en visio, avec le matériel de la structure'],
    ],
  ) +
  h3('Repérer une compétence cachée : trois questions') +
  ol([
    '<strong>« Qu’est-ce que vous faites sur votre téléphone ou votre ordinateur sans même y penser ? »</strong> La réponse donne l’habitude.',
    '<strong>« Pour faire ça, qu’est-ce que vous devez savoir faire ? »</strong> La réponse donne la compétence : ranger, chercher, écrire, remplir, calculer, vérifier.',
    '<strong>« Où, dans votre travail, faut-il savoir faire la même chose ? »</strong> La réponse donne la tâche du poste.',
  ]) +
  h4('Formuler la compétence') +
  p('Une compétence se formule avec un <strong>verbe d’action</strong>, un <strong>objet</strong> et, si possible, une <strong>condition</strong> : « organiser des fichiers par date et par thème pour les retrouver seule ». On évite le nom d’une application (« sait utiliser Google Photos ») : l’outil change, la compétence reste. On évite aussi les formules vagues (« se débrouille bien sur son téléphone ») : elles ne disent rien de ce que la personne sait faire.') +
  hr() +
  h3('Démonstration : des albums photo au dossier partagé') +
  p('Le formateur projette côte à côte deux écrans : la galerie de photos d’un téléphone (albums « Vacances 2025 », « Anniversaire Léa », tri par date) et le dossier partagé d’un service (fictif). Il montre les mêmes gestes, un par un.') +
  table(
    ['Sur le téléphone', 'Sur le poste de la structure'],
    [
      ['Créer un album « Vacances 2025 »', 'Créer un dossier « 02 Réunions › 2026 »'],
      ['Déplacer une photo dans l’album', 'Glisser le compte rendu dans le bon dossier'],
      ['Renommer l’album', 'Renommer le fichier selon la convention de l’équipe'],
      ['Chercher « plage » dans la galerie', 'Chercher un mot du titre dans l’explorateur de fichiers'],
      ['Supprimer les doublons', 'Comparer deux versions avant d’en archiver une'],
    ],
  ) +
  p('La convention de nommage et l’arborescence de référence sont celles du module « Socle : environnement numérique professionnel » : on s’y réfère sans les réexpliquer ici. Ce qui compte dans la démonstration, c’est que le participant voie qu’il connaît déjà la logique.') +
  h3('Faciliter le passage') +
  ol([
    '<strong>Nommer la compétence :</strong> on passe de « je fais ça sur mon téléphone » à « je sais organiser des fichiers ». Le mot compte : il donne confiance.',
    '<strong>Montrer la ressemblance :</strong> le formateur refait le geste sur l’outil du travail, en rapprochant les deux écrans.',
    '<strong>Faire faire tout de suite :</strong> la personne refait le geste sur le poste professionnel, pendant qu’elle se souvient de ce qu’elle sait faire.',
    '<strong>Marquer la différence :</strong> ce qui change au travail, ce sont les règles (données des personnes accompagnées, secret professionnel, droits d’accès). On les dit à ce moment-là.',
  ]) +
  alerte('Ce qui ne se transfère pas', pe('Les habitudes privées qui exposent des données ne passent pas au travail : photo d’un document avec son téléphone personnel, envoi d’une information sur une messagerie grand public, mot de passe noté ou partagé. Ces points sont repris dans la leçon RGPD de la journée.')) +
  table(
    ['L’habitude privée', 'Sa version professionnelle'],
    [
      ['Envoyer une photo par messagerie pour aller vite', 'Scanner avec l’outil de la structure et ranger dans le dossier, au bon endroit'],
      ['Garder ses documents « dans son téléphone »', 'Ranger dans l’espace partagé, là où c’est sauvegardé et accessible à l’équipe habilitée'],
      ['Écrire comme on parle, avec des émojis et des abréviations', 'Écrire une phrase complète, datée, factuelle, compréhensible par un collègue qui ne connaît pas la situation'],
      ['Utiliser le même mot de passe partout', 'Un mot de passe par compte professionnel (voir le module 7)'],
    ],
  ) +
  chrono(
    'refaire le geste sur le poste',
    'dix minutes',
    ul([
      'Choisissez une de vos trois compétences transférables.',
      'Sur le poste de la structure, réalisez la tâche professionnelle qui lui correspond, sur un fichier ou un dossier fictif préparé par le formateur.',
      'Écrivez en une ligne ce qui était pareil et ce qui était différent de votre habitude personnelle.',
    ]),
    'Même tâche, sans limite de temps. Si vous préférez, faites-la d’abord en regardant le formateur la refaire une seconde fois, puis seul. L’important est de finir en ayant fait le geste vous-même, pas d’aller vite.',
  ) +
  h4('Exercice individuel : le tableau de correspondance') +
  p('Chaque participant écrit trois lignes du tableau à partir de ses propres habitudes : ce qu’il fait chez lui, la compétence, et une tâche précise de son poste où il pourra s’en servir.') +
  tf(['Ce que je fais chez moi', 'La compétence (verbe d’action)', 'La tâche de mon poste, et la règle qui change au travail'], (r) => [r[0], r[1], r[2] ? `${r[2]}<br>${r[3]}` : ''],
    [
      ['<em>Exemple : je range mes photos par album</em>', '<em>organiser des fichiers pour les retrouver</em>', '<em>ranger les comptes rendus de réunion</em>', '<em>espace partagé, convention de nommage, aucun nom de personne accompagnée dans le nom du fichier</em>'],
      ['', '', '', ''],
      ['', '', '', ''],
      ['', '', '', ''],
    ],
  ) +
  lignes(3) +
  h4('L’échange en groupe') +
  p('Chacun lit une de ses lignes. Le groupe cherche une autre tâche du poste où la même compétence sert. On découvre souvent qu’une compétence « du téléphone » sert à trois ou quatre tâches différentes du travail.') +
  erreurs([
    'Nommer une application au lieu d’une compétence.',
    'Relier la compétence à « l’informatique en général » au lieu d’une tâche précise du poste.',
    'Oublier la règle qui change au travail : c’est elle qui fait d’une habitude une compétence professionnelle.',
    'Laisser la personne dire « je ne sais rien faire » sans chercher avec elle.',
  ]) +
  aRetenir([
    'Une compétence se formule avec un verbe d’action, pas avec le nom d’une application.',
    'Chaque compétence transférable est reliée à une tâche précise du poste.',
    'On refait le geste tout de suite, sur l’outil de la structure.',
    'Ce qui change au travail, ce sont les règles : données, destinataires, droits d’accès.',
  ]) +
  transfert([
    'Demain : refaites au travail le geste de la mise en situation, sur un vrai fichier du service, en respectant la convention de nommage de l’équipe.',
    'Cette semaine : repérez une autre tâche de votre poste où l’une de vos trois compétences peut servir, et notez-la dans votre fiche bilan.',
  ]) +
  avantSuite([
    'vous avez écrit trois compétences transférables, chacune avec un verbe d’action ;',
    'chacune est reliée à une tâche précise de votre poste et à la règle qui change au travail ;',
    'vous avez refait l’un des gestes sur le poste de la structure, sans aide.',
  ]);

const J1_BLOCAGES =
  reperes('Repères de la leçon', [
    '<strong>Place dans la journée 1 :</strong> de 13 h 30 à 14 h 15, au retour de la pause déjeuner.',
    '<strong>Objectif :</strong> repérer, en plus du niveau, ce qui empêche la personne d’avancer, pour que les recommandations en tiennent compte.',
    '<strong>Modalité :</strong> apport court, échange en groupe sur les familles de blocages, puis deuxième temps d’entretien individuel, en confiance ; rien n’est noté sans l’accord de la personne.',
    '<strong>Preuve produite :</strong> la rubrique « Blocages » de la fiche bilan, avec une action et un responsable pour chaque blocage retenu.',
  ]) +
  objectifs([
    'identifie au moins un point de blocage qui le concerne, ou écrit qu’il n’en voit pas, après avoir parcouru les sept familles de blocages ;',
    'écrit pour chaque blocage retenu ce qui a été observé, l’action proposée et la personne qui s’en charge (lui-même, le formateur ou la structure) ;',
    'distingue, dans l’exercice d’analyse, un blocage d’un manque de niveau, pour chacune des situations proposées.',
  ]) +
  h3('Un blocage n’est pas un manque de niveau') +
  p('Une personne peut connaître les gestes et ne pas les faire. Si on ne repère que le niveau, on lui propose une formation qu’elle a déjà les moyens de suivre, et le blocage reste entier. Les principales familles de blocages :') +
  table(
    ['Type de blocage', 'Comment on le repère', 'Ce qu’on peut proposer'],
    [
      ['Matériel', 'pas de poste attitré, écran partagé, connexion instable, pas d’identifiants', 'le signaler à la structure dans la fiche bilan ; c’est un préalable à toute formation'],
      ['Accès et droits', 'n’a pas accès au dossier partagé ou au DUI, ou pas les bons droits', 'demande précise à l’administrateur, avec la personne'],
      ['Temps', 'pas de moment prévu dans le planning pour saisir ou pratiquer', 'recommander un temps dédié dans la fiche bilan'],
      ['Confiance', '« je vais tout casser », « je suis trop vieux pour ça »', 'commencer par une compétence transférable, réussir vite, avancer par petites étapes'],
      ['Lecture, écriture, langue', 'évite d’écrire, demande qu’on lise à sa place', 'adapter les supports, orienter si besoin vers un accompagnement adapté'],
      ['Situation de handicap', 'fatigue visuelle, difficultés motrices, besoins d’aménagement', 'aménagements : voir la page Accessibilité, en parler avec le référent handicap'],
      ['Sens et organisation', 'ne voit pas à quoi sert l’outil, ou double le papier et l’écran', 'relier l’outil à une tâche utile de son poste'],
    ],
  ) +
  h3('Dans votre secteur : cinq situations fictives') +
  table(
    ['Situation', 'Le blocage', 'L’action et qui s’en charge'],
    [
      ['Yacine, surveillant de nuit en MECS : le seul poste du service est dans le bureau des éducateurs, fermé la nuit.', 'Matériel', 'Demander un accès la nuit au poste ou à un poste dédié. <em>La structure (chef de service).</em>'],
      ['Fatou, AES en EHPAD : utilise la tablette de l’unité avec l’identifiant d’une collègue.', 'Accès et droits (et sécurité)', 'Demander un identifiant personnel ; en attendant, ne plus utiliser celui d’une autre personne. <em>La personne, avec le cadre ; demande transmise à l’administrateur.</em>'],
      ['Olivier, secrétaire en ESAT : tient le planning sur papier puis le ressaisit dans le logiciel.', 'Sens et organisation', 'Choisir un seul support qui fait foi, en accord avec le chef de service. <em>La personne et le cadre ; le module pratique vient après.</em>'],
      ['Nora, éducatrice en SESSAD : en visite à domicile toute la journée, n’a pas de temps prévu pour saisir.', 'Temps', 'Recommander un créneau de saisie dans le planning de la semaine. <em>La structure, sur recommandation de la fiche bilan.</em>'],
      ['Gérard, moniteur d’atelier en ESAT : « À mon âge, ce n’est plus pour moi. »', 'Confiance', 'Commencer par une compétence qu’il maîtrise (il commande des pièces en ligne pour son jardin), réussir une première tâche au poste. <em>Le formateur, dès la journée 2.</em>'],
    ],
  ) +
  h3('Comment en parler') +
  p('On ne demande pas « Qu’est-ce qui ne va pas chez vous avec l’informatique ? ». On part de la situation de travail et on laisse la personne dire ce qui la gêne.') +
  table(
    ['Les phrases qui ferment', 'Les phrases qui ouvrent'],
    [
      ['« Vous avez un problème avec l’écrit ? »', '« Qu’est-ce qui vous prend le plus de temps quand vous devez écrire une transmission ? »'],
      ['« C’est une question de volonté. »', '« Qu’est-ce qui ferait que vous le fassiez plus souvent ? »'],
      ['« Tout le monde y arrive. »', '« Qu’est-ce qui a marché, la dernière fois que vous avez réussi quelque chose sur l’ordinateur ? »'],
      ['« Il faudrait voir un spécialiste. »', '« Est-ce qu’un aménagement vous aiderait pendant la formation ? Vous n’êtes pas obligé de me dire pourquoi. »'],
    ],
  ) +
  encart('Rester à sa place', pe('Le formateur repère et propose ; il ne pose aucun diagnostic. Une difficulté de lecture ou de santé se note seulement si la personne le souhaite, dans ses mots, et uniquement pour adapter la formation.') + pe('Formule à utiliser : « Est-ce que vous êtes d’accord pour que j’écrive dans votre fiche : <em>préfère des consignes lues à voix haute</em> ? Cela restera dans votre fiche, qui vous appartient. » Si la personne refuse, on n’écrit rien, et on adapte quand même.')) +
  h4('Qui s’en charge') +
  table(
    ['Qui', 'Pour quels blocages', 'Exemple d’action'],
    [
      ['<strong>La personne</strong>', 'confiance, organisation personnelle, habitudes', 'refaire chaque jour le geste appris, garder sa fiche mémo près du poste'],
      ['<strong>Le formateur</strong>', 'rythme, supports, aménagements pendant la formation', 'version sans chronomètre, supports agrandis, consignes lues'],
      ['<strong>La structure</strong>', 'matériel, identifiants, droits d’accès, temps dans le planning', 'poste disponible, identifiant personnel, créneau de saisie'],
    ],
  ) +
  p('Un blocage qui relève de la structure est écrit dans la fiche bilan comme une <strong>condition</strong> : sans identifiant personnel, le module sur le DUI ne peut pas produire son effet. Le formateur ne promet pas que la structure le lèvera ; il l’écrit, avec l’accord de la personne, pour que la demande existe.') +
  chrono(
    'blocage ou manque de niveau ?',
    'huit minutes pour les cinq situations',
    ol([
      'Une éducatrice sait faire un tableau, mais n’a jamais le fichier : il est sur l’ordinateur personnel de sa collègue.',
      'Un moniteur-éducateur ne sait pas joindre un fichier à un mail.',
      'Une secrétaire refuse d’utiliser le nouveau logiciel : « l’ancien marchait très bien ».',
      'Un AES réussit la saisie en formation, mais n’a jamais de temps pour la faire pendant son service.',
      'Une cheffe de service ne sait pas partager son agenda avec l’équipe.',
    ]) + pe('Pour chacune : blocage (lequel) ou manque de niveau ? Et qui s’en charge ?'),
    'Même exercice, sans limite de temps, à l’oral avec le formateur si vous préférez ne pas écrire. On peut aussi n’en traiter que trois.',
  ) +
  carte(
    'Correction',
    table(
      ['N°', 'Réponse', 'Qui s’en charge'],
      [
        ['1', 'Blocage « accès et droits » : le fichier n’est pas dans l’espace partagé', 'La structure et l’équipe (ranger le fichier dans l’espace partagé)'],
        ['2', 'Manque de niveau (messagerie)', 'Module 3 · Outlook, si la tâche est utile au poste'],
        ['3', 'Blocage « sens et organisation » : l’utilité du nouvel outil n’est pas perçue', 'Le formateur et le cadre : relier l’outil à une tâche du poste'],
        ['4', 'Blocage « temps »', 'La structure : un créneau de saisie dans le planning'],
        ['5', 'Manque de niveau (agenda)', 'Module 3 · Outlook'],
      ],
    ),
  ) +
  h4('Dans la fiche bilan') +
  p('Pour chaque blocage retenu : ce qu’on a observé, ce qui est proposé, et qui s’en charge (la personne, le formateur ou la structure).') +
  erreurs([
    'Recommander un module à quelqu’un dont le problème est de ne pas avoir d’identifiant.',
    'Écrire une hypothèse sur la santé ou le parcours de la personne.',
    'Noter un blocage sans action ni responsable : il reste une plainte.',
    'Promettre au participant que la structure va régler le problème.',
  ]) +
  aRetenir([
    'Un blocage n’est pas un manque de niveau : il se traite autrement qu’avec un module.',
    'Chaque blocage retenu a une action et un responsable.',
    'On part des situations de travail, avec des questions ouvertes.',
    'Rien n’est noté sans l’accord de la personne, et jamais sous forme de diagnostic.',
  ]) +
  avantSuite([
    'vous avez parcouru les sept familles de blocages et retenu ceux qui vous concernent, ou écrit qu’il n’y en a pas ;',
    'chaque blocage retenu a une action et un responsable dans votre fiche bilan ;',
    'rien de ce qui est écrit ne l’a été sans votre accord.',
  ]);

const J1_RGPD =
  reperes('Repères de la leçon', [
    '<strong>Place dans la journée 1 :</strong> de 14 h 15 à 15 h 15, avant le cas pratique et le bilan. Elle introduit le module 7 « Hygiène numérique et protection des données », placé juste après dans cette journée.',
    '<strong>Objectif :</strong> connaître les règles du RGPD qui s’appliquent à chaque geste numérique du quotidien dans une structure sociale ou médico-sociale.',
    '<strong>Modalité :</strong> apport, démonstration, mise en situation chronométrée, puis engagements personnels.',
    '<strong>Preuve produite :</strong> trois engagements personnels, repris dans la fiche bilan.',
  ]) +
  objectifs([
    'distingue une donnée personnelle, une donnée sensible (dont la santé) et une information sans lien avec une personne, sur les exemples de la mise en situation ;',
    'classe chacun des gestes de la mise en situation en « conforme », « à corriger » ou « à signaler tout de suite », et justifie son choix par un principe ;',
    'décrit, dans l’ordre, ce qu’il fait en cas d’erreur ou de fuite de données : qui il prévient et quand ;',
    'écrit trois engagements concrets, applicables dès le lendemain à son poste.',
  ]) +
  h3('Le RGPD en une phrase') +
  p('Le Règlement général sur la protection des données (règlement (UE) 2016/679, applicable depuis le 25 mai 2018) encadre toute utilisation de données qui permettent d’identifier une personne. Dans le social et le médico-social, on manipule en plus des données sensibles, en particulier des données de santé (article 9), et des informations couvertes par le droit à la confidentialité des personnes accompagnées (article L311-3 du code de l’action sociale et des familles).') +
  h3('Donnée personnelle, donnée sensible : se repérer') +
  table(
    ['Type', 'Ce que c’est', 'Exemples du secteur (fictifs)'],
    [
      ['<strong>Donnée personnelle</strong>', 'toute information qui identifie une personne, directement ou en recoupant', 'le nom d’un jeune, son adresse, sa date de naissance, mais aussi « le seul garçon de 15 ans du groupe des Tilleuls »'],
      ['<strong>Donnée sensible</strong>', 'une catégorie protégée plus fortement, dont les données de santé (article 9)', 'un diagnostic, un traitement, une hospitalisation, un compte rendu de rendez-vous médical'],
      ['<strong>Information non personnelle</strong>', 'une information qui ne permet de reconnaître personne', 'le menu de la semaine, le planning des salles, la procédure incendie'],
    ],
  ) +
  p('Le piège le plus courant, c’est l’identification indirecte : retirer le nom ne suffit pas quand l’âge, le groupe, la commune ou un événement rare suffisent à reconnaître la personne.') +
  h3('Qui fait quoi') +
  table(
    ['Qui', 'Son rôle'],
    [
      ['<strong>La structure</strong> (l’organisme gestionnaire), responsable de traitement', 'décide des outils, des droits d’accès et des durées de conservation ; c’est elle qui notifie une violation à la CNIL quand c’est nécessaire'],
      ['<strong>Le délégué à la protection des données</strong>, s’il a été désigné', 'conseille, reçoit les signalements, fait le lien avec la CNIL'],
      ['<strong>La direction ou le cadre</strong>', 'votre premier interlocuteur pour toute question ou tout incident'],
      ['<strong>Vous</strong>', 'appliquez les règles dans chaque geste, signalez sans attendre, transmettez les demandes des personnes sans y répondre seul'],
    ],
  ) +
  h3('Les principes à appliquer au quotidien') +
  table(
    ['Principe', 'Ce que ça veut dire pour moi', 'Exemple du secteur'],
    [
      ['<strong>Finalité</strong>', 'je n’utilise une information que pour l’accompagnement pour lequel elle a été recueillie', 'l’adresse d’une famille sert au courrier du service, pas à lui envoyer une invitation personnelle'],
      ['<strong>Minimisation</strong>', 'je n’écris et je ne partage que ce qui est utile, pas tout ce que je sais', 'la fiche de sortie à la piscine indique ce qu’il faut savoir pour la sécurité, pas le dossier complet'],
      ['<strong>Confidentialité et sécurité</strong>', 'mon poste est verrouillé quand je m’absente, mes mots de passe ne se partagent pas, je range les données dans les outils de la structure', 'le planning des rendez-vous médicaux n’est pas affiché dans le couloir'],
      ['<strong>Durée de conservation</strong>', 'je ne garde pas de copies personnelles : clé USB, téléphone, boîte mail privée', 'le tableau de l’année dernière reste dans l’espace partagé, là où la structure décide de sa durée de conservation'],
      ['<strong>Droits des personnes</strong>', 'une personne peut demander à accéder à ses données ou à les faire corriger ; je transmets la demande, je n’y réponds pas seul', 'un père demande à voir ce qui est écrit sur son fils : je l’oriente vers la procédure de la structure'],
    ],
  ) +
  hr() +
  h3('Démonstration : le même message, avant et après') +
  p('Mardi soir, dans une MECS (situation fictive). Une éducatrice veut prévenir la collègue qui prend le relais.') +
  encart('Avant', pe('<em>Envoyé depuis son téléphone personnel, sur une messagerie grand public : « Pour info, Enzo D. (chambre 12) a pleuré toute la soirée après l’appel de sa mère, qui avait l’air d’avoir bu. Je t’envoie la photo de la page du cahier et de son ordonnance. »</em>')) +
  encart('Après', pe('<em>Saisi dans le logiciel de la structure, dans le dossier du jeune, rubrique transmissions : « Mardi, 21 h 10 : après un appel téléphonique de sa mère, E. a pleuré et n’a pas voulu dîner. Retour au calme vers 21 h 40 après un temps d’échange avec l’éducatrice. À voir avec le cadre : organisation des prochains appels. »</em>')) +
  table(
    ['Ce qui a changé', 'Le principe'],
    [
      ['Le canal : le logiciel de la structure, pas une messagerie grand public sur un téléphone personnel', 'confidentialité et sécurité'],
      ['Plus de photo d’ordonnance : la donnée de santé reste dans la rubrique prévue, accessible aux seules personnes habilitées', 'donnée sensible, minimisation'],
      ['Plus de jugement sur la mère (« avait l’air d’avoir bu ») : une impression sur un tiers, non vérifiée, n’a pas sa place dans une transmission', 'minimisation, finalité'],
      ['Des faits datés et une suite à donner', 'finalité : la transmission sert l’accompagnement'],
    ],
  ) +
  h3('Les gestes qui posent problème, et ce qu’on fait à la place') +
  table(
    ['À éviter', 'À faire'],
    [
      ['Photographier un document avec son téléphone personnel', 'utiliser le scanner ou l’outil prévu par la structure'],
      ['Écrire le nom d’une personne accompagnée dans une messagerie grand public ou dans un outil d’IA', 'utiliser la messagerie de la structure ; ne jamais mettre de nom ni d’information identifiante dans une IA'],
      ['Envoyer un dossier en pièce jointe à plusieurs destinataires', 'partager un lien avec des droits limités, vérifier les destinataires'],
      ['Garder un fichier « pour plus tard » sur son bureau', 'le ranger dans le dossier partagé, au bon endroit, puis supprimer la copie'],
      ['Laisser sa session ouverte pour « revenir tout de suite »', 'verrouiller le poste à chaque départ, même court'],
      ['Parler d’une situation dans un lieu public ou au téléphone dans le couloir', 's’isoler, ne donner que ce qui est utile à l’interlocuteur'],
    ],
  ) +
  alerte('En cas d’erreur ou de fuite', pe('Mail envoyé au mauvais destinataire, clé USB perdue, poste piraté : on prévient tout de suite sa direction ou le délégué à la protection des données de la structure. Le RGPD impose au responsable de traitement de notifier certaines violations à la CNIL dans les 72 heures (article 33) : c’est pour cela que chaque minute compte, et que cacher une erreur est toujours pire que la signaler.') + ol([
    'J’arrête ce qui peut l’être (je n’envoie plus, je retire le partage).',
    'Je préviens tout de suite ma direction ou le délégué à la protection des données, avec les faits : quoi, quand, à qui.',
    'Je ne contacte pas la CNIL moi-même et je ne décide pas seul de ce qu’on dit aux personnes : c’est le rôle de la structure.',
    'Je note ce qui s’est passé, pour que la structure puisse l’analyser.',
  ])) +
  h3('Ce qui est ici, ce qui est dans le module 7') +
  table(
    ['Dans cette leçon : les règles', 'Dans le module 7 : les gestes de sécurité'],
    [
      ['Ce qu’est une donnée personnelle, une donnée sensible', 'Mots de passe, gestionnaire de mots de passe, double authentification'],
      ['Les principes : finalité, minimisation, confidentialité, conservation, droits', 'Reconnaître un hameçonnage et réagir dans le bon ordre'],
      ['Qui fait quoi, et qui prévenir en cas d’erreur', 'Postes partagés, clés USB, télétravail, visioconférence'],
      ['Les gestes du quotidien à éviter', 'Compte piraté, rançongiciel, appareil perdu : le premier geste ; la fiche réflexe'],
    ],
  ) +
  chrono(
    'huit gestes à trier',
    'huit minutes',
    ol([
      'Une secrétaire d’IME envoie le planning des transports (prénoms et adresses) par mail à tous les chauffeurs, en copie visible.',
      'Un éducateur écrit une observation datée dans le DUI, dans la rubrique prévue.',
      'Une AES d’EHPAD prend en photo le tableau des traitements pour « l’avoir sur elle ».',
      'Un chef de service partage le compte rendu de synthèse par un lien, en lecture seule, aux seuls participants.',
      'Une monitrice-éducatrice s’aperçoit qu’elle a envoyé un bilan au mauvais partenaire.',
      'Un éducateur de SESSAD garde sur une clé USB personnelle les écrits de l’année « au cas où ».',
      'Une secrétaire d’ESAT verrouille son poste avant d’aller à l’accueil.',
      'Un moniteur colle une transmission avec le prénom d’un jeune dans un assistant d’IA pour la reformuler.',
    ]) + pe('Pour chacun : conforme, à corriger, ou à signaler tout de suite ? Quel principe ?'),
    'Même exercice, sans limite de temps. Vous pouvez aussi le faire à deux, en disant votre réponse à voix haute avant de l’écrire.',
  ) +
  carte(
    'Correction',
    table(
      ['N°', 'Réponse', 'Pourquoi'],
      [
        ['1', 'À corriger', 'minimisation et confidentialité : chaque chauffeur n’a besoin que de sa tournée ; copie visible = adresses de tous exposées à tous'],
        ['2', 'Conforme', 'bon outil, bonne rubrique, fait daté'],
        ['3', 'À corriger (et à dire au cadre si la photo existe déjà)', 'donnée de santé sur un appareil personnel'],
        ['4', 'Conforme', 'lien restreint, lecture seule, destinataires concernés'],
        ['5', 'À signaler tout de suite', 'violation possible : la structure doit l’analyser vite (article 33)'],
        ['6', 'À corriger', 'durée de conservation et sécurité : les écrits restent dans les outils de la structure'],
        ['7', 'Conforme', 'confidentialité et sécurité'],
        ['8', 'À corriger, et à signaler au cadre si la transmission contenait d’autres éléments identifiants', 'aucune donnée identifiante dans une IA ; voir le module 6'],
      ],
    ),
  ) +
  h4('Mes trois engagements') +
  p('Chaque participant écrit trois gestes qu’il change dès demain. Ils seront repris dans la fiche bilan. Un bon engagement est concret et vérifiable : « je verrouille mon poste à chaque fois que je quitte le bureau » plutôt que « je fais attention aux données ».') +
  lignes(3) +
  erreurs([
    'Croire qu’un prénom seul ou des initiales suffisent à anonymiser.',
    'Envoyer « juste une photo » depuis son téléphone personnel parce que c’est plus rapide.',
    'Cacher une erreur d’envoi en espérant que personne ne s’en aperçoive.',
    'Répondre soi-même à une demande d’accès au dossier, dans un sens ou dans l’autre.',
  ]) +
  aRetenir([
    'Une donnée personnelle identifie une personne, directement ou en recoupant ; la santé est une donnée sensible.',
    'Finalité, minimisation, confidentialité, conservation, droits des personnes : cinq questions avant chaque geste.',
    'Une erreur se signale tout de suite à la direction ou au délégué à la protection des données.',
    'Les gestes de sécurité (mots de passe, hameçonnage, incidents) sont dans le module 7.',
  ]) +
  transfert([
    'Demain : appliquez vos trois engagements, et relisez-les en fin de journée.',
    'Cette semaine : demandez à votre cadre qui est le délégué à la protection des données de la structure, ou qui prévenir s’il n’y en a pas, et notez-le dans votre fiche bilan.',
  ]) +
  avantSuite([
    'vous classez correctement les huit gestes de la mise en situation, principe à l’appui ;',
    'vous savez qui prévenir, et dans quel ordre, en cas d’erreur ou de fuite ;',
    'vos trois engagements sont écrits, concrets et vérifiables.',
  ]);

const J1_BILAN =
  reperes('Repères de la leçon', [
    '<strong>Place dans la journée 1 :</strong> de 16 h 00 à 16 h 50, la dernière séquence de travail de la journée.',
    '<strong>Objectif :</strong> formaliser, pour chaque participant, ses besoins et le parcours qui y répond.',
    '<strong>Livrable :</strong> la fiche bilan individualisée, à rendre à la fin de la journée dans le devoir prévu.',
    '<strong>Suite :</strong> la personne est inscrite sur le ou les modules dont elle a besoin, et pas sur les autres. Le parcours est modulable.',
  ]) +
  objectifs([
    'rassemble dans sa fiche bilan les huit rubriques, à partir de ce qu’il a produit dans la journée, sans rubrique vide non justifiée ;',
    'formule au moins deux besoins sous la forme « je dois pouvoir… », chacun relié à une tâche de son poste ;',
    'choisit avec le formateur quatre modules au plus, dans l’ordre, en appliquant la règle de recommandation, et dit si la journée 2 est recommandée ;',
    'relit et signe la fiche avec le formateur avant 17 h.',
  ]) +
  h3('Ce que contient la fiche bilan') +
  ol([
    '<strong>La demande de départ</strong> et ce que la personne attend elle-même',
    '<strong>Le niveau, outil par outil</strong> (0 à 3), repris de l’évaluation du matin',
    '<strong>Les habitudes et les compétences transférables</strong> : trois au moins',
    '<strong>Les points de blocage</strong> et qui s’en charge',
    '<strong>Les trois engagements RGPD</strong>',
    '<strong>Les besoins</strong>, formulés comme des tâches du poste : « je dois pouvoir… »',
    '<strong>Les recommandations de formation</strong> : le ou les modules pratiques, dans l’ordre conseillé',
    '<strong>La suite</strong> : journée 2 (niveau 2) si la personne doit transférer ses acquis et en acquérir de nouveaux',
  ]) +
  p('Si le plan individuel du « Bilan de compétences numériques de départ » est déjà signé, la fiche bilan y renvoie pour les domaines et les échéances, au lieu de le recopier : la fiche ajoute ce que la journée a fait apparaître (habitudes, compétences transférables, blocages, engagements RGPD, journée 2).') +
  h3('Formuler un besoin') +
  p('Un besoin n’est pas un outil (« Excel ») ni un souhait vague (« être plus à l’aise ») : c’est une <strong>tâche du poste</strong>, avec une <strong>condition</strong> qui permet de vérifier plus tard qu’elle est acquise.') +
  table(
    ['Formulation à reprendre', 'Formulation utilisable'],
    [
      ['« Excel »', '« Je dois pouvoir tenir seule le tableau de présence mensuel de l’unité, totaux compris. »'],
      ['« Mieux écrire »', '« Je dois pouvoir écrire une transmission de cinq lignes au plus, datée et factuelle, dans le DUI, avant la fin de mon service. »'],
      ['« Le numérique en général »', '« Je dois pouvoir retrouver un compte rendu de réunion dans l’espace partagé sans demander à une collègue. »'],
      ['« L’IA, parce qu’on en parle »', '« Je dois pouvoir préparer le plan d’un courrier aux familles avec l’outil autorisé, sans y mettre de donnée personnelle. »'],
    ],
  ) +
  h3('De la grille aux recommandations') +
  p('La règle est simple : on recommande un module quand le niveau sur l’outil est à 0 ou 1 <strong>et</strong> qu’une tâche du poste en a besoin. Un niveau faible sur un outil dont la personne ne se sert pas au travail ne donne pas lieu à une recommandation.') +
  ul([
    '<strong>Le Socle d’abord</strong> pour qui est à 0 ou 1 sur « Poste de travail et fichiers » : tous les autres modules supposent de savoir ranger et retrouver un fichier.',
    '<strong>Ensuite, le module qui débloque la tâche la plus fréquente</strong> du poste, ou celle qui arrive bientôt (un DUI qui se déploie, un nouveau modèle de courrier).',
    '<strong>Quatre modules au plus</strong>, comme le prévoit le bilan de départ : au-delà, on ne transfère plus rien au poste de travail. On peut n’en recommander qu’un.',
    '<strong>Un blocage qui relève de la structure</strong> (identifiant, poste, temps) s’écrit avant les modules : c’est une condition pour que le module serve.',
    '<strong>Le module 7</strong> fait déjà partie de la journée 1 : il n’apparaît dans les recommandations que si son devoir reste à terminer.',
  ]) +
  table(['Module pratique', 'Pour qui', 'Exemple de besoin qui y mène'], MODULES.map(([m, q, b]) => [`<strong>${m}</strong>`, q, `« ${b} »`])) +
  encart('Modulable', pe('Chaque module se suit seul. Une personne peut n’en suivre qu’un, ou plusieurs dans l’ordre recommandé. Le Socle est conseillé avant tous les autres pour qui est à 0 ou 1 sur « Poste de travail et fichiers ».')) +
  hr() +
  h3('Démonstration : de la grille à la recommandation') +
  p('Hugo, moniteur-éducateur en ITEP (situation fictive). Son chef de service l’a inscrit parce que le DUI arrive dans l’établissement ; Hugo, lui, voudrait « arrêter de perdre ses documents ».') +
  tf(['Outil', 'Niveau observé · utile au poste ?', 'Recommandation'], (r) => [r[0], `${r[1]} · ${r[2]}`, r[3]],
    [
      ['Poste de travail et fichiers', '1', 'oui, chaque jour', '<strong>Socle</strong>, en premier'],
      ['Word', '2', 'oui', 'aucune : il fait seul les courriers courants'],
      ['Excel', '1', 'non, la secrétaire tient les tableaux', 'aucune'],
      ['Outlook', '2', 'oui', 'aucune'],
      ['Canva', '0', 'non', 'aucune'],
      ['Logiciel métier (DUI)', '0', 'oui, dès son déploiement', '<strong>Module 5 · DUI</strong>, en second'],
      ['Outils d’IA', '0', 'non, pas d’outil autorisé dans la structure à ce jour', 'aucune'],
      ['Sécurité et données', '1', 'oui', 'module 7 déjà suivi en journée 1 ; devoir à terminer'],
    ],
  ) +
  p('Deux modules, dans cet ordre : le Socle répond à la demande d’Hugo, le module 5 à celle du chef de service. Canva et l’IA sont à 0, mais sans tâche du poste derrière : on ne les recommande pas. La journée 2 est recommandée, parce qu’Hugo a trois compétences transférables solides (il gère les photos et les documents de son club de football) qu’il faut faire passer sur l’outil du travail.') +
  h3('Modèle de fiche bilan individualisée') +
  carte('Fiche bilan · journée 1',
    pe('<strong>Nom, prénom :</strong>') + lignes(1) +
    pe('<strong>Poste et structure :</strong>') + lignes(1) +
    pe('<strong>Demande de départ (qui, pourquoi) :</strong>') + lignes(2) +
    pe('<strong>Ce que j’attends de la formation :</strong>') + lignes(2) +
    table(['Domaine', 'Niveau (0 à 3)', 'Utile à mon poste ?'], [
      ['Poste de travail et fichiers', '', ''], ['Word', '', ''], ['Excel', '', ''], ['Outlook', '', ''], ['Canva', '', ''], ['Logiciel métier', '', ''], ['Outils d’IA', '', ''], ['Sécurité et données', '', ''],
    ]) +
    pe('<strong>Mes compétences transférables :</strong>') + lignes(3) +
    pe('<strong>Mes points de blocage et qui s’en charge :</strong>') + lignes(2) +
    pe('<strong>Mes trois engagements RGPD :</strong>') + lignes(3) +
    pe('<strong>Mes besoins (« je dois pouvoir… ») :</strong>') + lignes(3) +
    pe('<strong>Modules recommandés, dans l’ordre :</strong>') + lignes(2) +
    pe('<strong>Journée 2 recommandée :</strong> oui / non') +
    pe('<strong>Date et signature du participant et du formateur</strong>'),
  ) +
  h3('La relecture à deux') +
  p('Dix minutes environ, en fin de séquence. Le formateur et le participant relisent la fiche ensemble, rubrique par rubrique, avec quatre questions :') +
  ol([
    'Chaque niveau est-il appuyé sur une mise en situation ?',
    'Chaque besoin est-il une tâche du poste, qu’on pourra vérifier ?',
    'Chaque module recommandé répond-il à un besoin écrit, et l’ordre est-il justifié ?',
    'Le participant est-il d’accord avec tout ce qui est écrit, en particulier sur les blocages ?',
  ]) +
  h4('Quand recommander la journée 2') +
  ul([
    'La personne a des compétences transférables qu’elle n’utilise pas encore au travail.',
    'Un besoin demande de faire passer un savoir-faire personnel sur l’outil de la structure.',
    'La personne veut, en plus, acquérir une compétence nouvelle avec un module spécifique choisi en journée 2.',
  ]) +
  alerte('Confidentialité de la fiche', pe('La fiche appartient au participant. Elle n’est transmise à l’employeur ou au financeur qu’avec son accord, et seulement pour ce qui concerne la formation (les modules recommandés et leur durée).')) +
  erreurs([
    'Recommander tous les modules où le niveau est bas, sans regarder les tâches du poste.',
    'Recopier le plan individuel du bilan de départ au lieu d’y renvoyer.',
    'Écrire des besoins qui sont des noms d’outils.',
    'Signer une fiche que le participant n’a pas relue.',
  ]) +
  aRetenir([
    'Un module est recommandé quand le niveau est à 0 ou 1 et qu’une tâche du poste en a besoin.',
    'Le Socle d’abord pour qui est à 0 ou 1 sur les fichiers ; quatre modules au plus.',
    'Un besoin se formule « je dois pouvoir… », avec une tâche et une condition.',
    'La fiche appartient au participant ; l’employeur ne reçoit que les modules et leur durée, avec son accord.',
  ]) +
  avantSuite([
    'les huit rubriques de votre fiche sont remplies, ou la raison d’une rubrique vide est écrite ;',
    'chaque module recommandé est relié à un besoin « je dois pouvoir… » et l’ordre est justifié ;',
    'la fiche est relue et signée par vous et le formateur.',
  ]);

// ─── J1 · Cas pratique corrigé et quiz ───────────────────────────────────────
const QUIZ_J1 = [
  {
    q: 'Pendant l’évaluation, une éducatrice dit « je suis nulle en informatique », puis réussit seule la mise en situation « retrouver un document, le renommer et le ranger ». Que notez-vous pour « Poste de travail et fichiers » ?',
    o: [
      'Le niveau 0, parce qu’il faut respecter ce qu’elle dit d’elle-même.',
      'Le niveau correspondant à ce qu’elle a fait seule ; sa phrase peut être notée dans la rubrique confiance, avec son accord.',
      'Rien pour l’instant : on attend l’entretien pour trancher.',
      'Le niveau 3, pour l’encourager.',
    ],
    r: 'B',
    pourquoi: 'on note ce que la personne fait en situation, pas ce qu’elle déclare. L’écart entre sa phrase et sa réussite est une information utile : il signale un possible blocage de confiance, qu’on écrit seulement si elle est d’accord.',
    autres: 'A note une déclaration au lieu d’une observation, et la mettrait sur un module qu’elle n’a pas besoin de suivre. C laisse la grille incomplète alors que l’observation a eu lieu. D surestime : le niveau 3 suppose de résoudre un imprévu et d’aider un collègue, ce qui n’a pas été observé.',
  },
  {
    q: 'Un chef de service a inscrit un moniteur-éducateur pour « se mettre à Excel ». Le moniteur dit qu’il veut surtout apprendre le DUI qui arrive dans l’établissement. Que faites-vous ?',
    o: [
      'Vous suivez la demande de l’employeur, qui finance la formation.',
      'Vous suivez la demande du participant, puisque c’est lui qui se forme.',
      'Vous recommandez les deux modules, pour être sûr de ne rien oublier.',
      'Vous écrivez les deux demandes dans la grille, vous regardez quelle tâche du poste a besoin de quel outil, et la fiche bilan en tient compte.',
    ],
    r: 'D',
    pourquoi: 'la demande de départ s’écrit noir sur blanc, et quand les points de vue diffèrent, on note les deux. La recommandation dépend ensuite de la règle : niveau à 0 ou 1 et tâche du poste qui en a besoin.',
    autres: 'A et B tranchent sans regarder le poste : on risque de former à un outil inutile, ou de laisser de côté une demande légitime de la structure. C recommande par précaution, alors qu’un module ne se recommande que si une tâche du poste en a besoin.',
  },
  {
    q: 'Une secrétaire range ses photos par album et par date sur son téléphone. Quelle formulation reportez-vous dans sa fiche bilan, au titre des compétences transférables ?',
    o: [
      '« Sait organiser des fichiers par thème et par date pour les retrouver seule. »',
      '« Utilise bien son téléphone. »',
      '« Maîtrise l’application de photos de son téléphone. »',
      '« Peut administrer le serveur de fichiers de la structure. »',
    ],
    r: 'A',
    pourquoi: 'une compétence se formule avec un verbe d’action, un objet et une condition. Celle-ci se relie directement à une tâche du poste : ranger les documents du service dans l’arborescence commune.',
    autres: 'B est trop vague pour orienter vers une tâche. C nomme une application : l’outil change, la compétence reste, c’est elle qu’on écrit. D surestime largement : ranger ses photos ne dit rien de la gestion d’un serveur, et ce n’est pas une tâche de son poste.',
  },
  {
    q: 'Un AES évite d’écrire ses transmissions et demande souvent à un collègue de le faire à sa place. Qu’écrivez-vous dans sa fiche bilan ?',
    o: [
      '« Difficultés de lecture et d’écriture probables. »',
      'Rien : cela ne regarde pas la formation.',
      'Ce qu’il accepte que vous notiez, dans ses mots, et l’adaptation proposée (consignes lues, modèle de transmission, dictée si l’outil le permet).',
      '« Orienter vers un bilan des savoirs de base. »',
    ],
    r: 'C',
    pourquoi: 'le formateur repère et propose, sans poser de diagnostic. Une difficulté ne se note qu’avec l’accord de la personne, dans ses mots, et seulement pour adapter la formation.',
    autres: 'A et D sont des hypothèses sur la personne, écrites sans son accord : c’est exactement ce que le formateur ne fait pas. B passe à côté d’un vrai blocage : si on ne l’écrit pas (avec son accord), la formation ne s’adaptera pas.',
  },
  {
    q: 'Vous voulez qu’un outil d’IA vous aide à reformuler une note sur un jeune de la MECS. Que faites-vous ?',
    o: [
      'Vous remplacez le prénom par une initiale, puis vous collez la note.',
      'Vous ne collez aucune information sur le jeune : vous demandez un plan ou une formulation générale, et vous rédigez vous-même, avec l’outil autorisé par la structure s’il y en a un.',
      'Vous utilisez votre compte personnel sur votre téléphone, pour ne pas engager la structure.',
      'Vous collez la note, puisque l’outil indique qu’il ne conserve pas les échanges.',
    ],
    r: 'B',
    pourquoi: 'aucune information identifiante ne va dans un outil d’IA. On peut lui demander une aide générale (un plan, une tournure), puis écrire soi-même, avec l’outil que la structure a autorisé.',
    autres: 'A croit anonymiser : l’âge, le groupe, les faits racontés suffisent souvent à reconnaître le jeune. C aggrave la situation : un compte personnel sort la donnée de tout cadre professionnel. D se fie à une promesse de l’outil ; la règle du parcours ne dépend pas de ce que l’outil annonce.',
  },
  {
    q: 'Vous vous apercevez qu’un mail contenant le compte rendu d’une synthèse est parti vers le mauvais partenaire. Quel est votre premier geste ?',
    o: [
      'Envoyer un second mail pour demander au destinataire de le supprimer, puis ne pas en parler.',
      'Attendre de voir si le destinataire réagit.',
      'Notifier vous-même la violation à la CNIL.',
      'Prévenir tout de suite votre direction ou le délégué à la protection des données, avec les faits : quoi, quand, à qui.',
    ],
    r: 'D',
    pourquoi: 'c’est la structure, responsable de traitement, qui analyse l’incident et notifie certaines violations à la CNIL dans les 72 heures (article 33). Elle ne peut le faire que si elle est prévenue tout de suite.',
    autres: 'A peut limiter les dégâts, mais cacher l’erreur empêche la structure de l’analyser dans le délai. B fait perdre un temps précieux. C se trompe de rôle : la notification revient au responsable de traitement, pas au salarié.',
  },
];

const J1_CAS =
  reperes('Repères de la leçon', [
    '<strong>Place dans la journée 1 :</strong> de 15 h 30 à 16 h 00, juste avant la rédaction de votre propre fiche bilan.',
    '<strong>Objectif :</strong> vous entraîner sur une fiche bilan fictive complète, avant de rédiger la vôtre, et vérifier ce que vous avez compris de la journée.',
    '<strong>Modalité :</strong> travail individuel, puis correction commentée en groupe ; quiz d’autocorrection de six questions, non noté.',
    '<strong>Preuve produite :</strong> la fiche fictive corrigée et vos réponses au quiz.',
  ]) +
  objectifs([
    'rédige, à partir des notes d’évaluation fictives, les rubriques besoins, blocages et recommandations d’une fiche bilan, en appliquant la règle de recommandation ;',
    'repère dans ces notes au moins trois erreurs de formulation (déclaration au lieu d’observation, diagnostic, besoin formulé comme un outil) ;',
    'répond aux six questions du quiz, puis explique chacune de ses erreurs à l’aide des réponses commentées.',
  ]) +
  casPratique(
    'la fiche bilan de Samia',
    pe('Samia est éducatrice spécialisée dans une MECS (situation et personne fictives). Voici les notes prises pendant sa journée 1, telles qu’un formateur pressé les aurait écrites.') +
      table(
        ['Rubrique', 'Notes brutes'],
        [
          ['Demande', '« Inscrite par la cheffe de service : il faut qu’elle se mette au numérique, le logiciel de transmissions arrive en janvier. » Samia : « Moi, je voudrais surtout arrêter de perdre du temps à chercher les documents. »'],
          ['Niveaux observés', 'Fichiers : 1 (retrouve le document avec aide). Word : 2. Excel : 1. Outlook : 2. Canva : 0. Logiciel métier : 0 (pas encore déployé, essai sur l’environnement de test). IA : 0. Sécurité : 1 (n’a pas repéré l’adresse de l’expéditeur du mail suspect).'],
          ['Habitudes', 'Gère l’agenda familial partagé et les photos de ses enfants par album. Écrit beaucoup de messages vocaux. Envoie parfois des photos du cahier de transmissions à ses collègues « quand c’est urgent ».'],
          ['Blocages', '« Stressée, sans doute anxieuse. » Pas d’identifiant personnel sur le poste du groupe : se connecte avec la session d’un collègue. Pas de temps de saisie prévu dans le planning de l’internat.'],
          ['Besoins', '« Excel. » « Canva. » « Le logiciel. »'],
          ['Recommandations', '« Tous les modules, elle a un niveau bas partout. »'],
        ],
      ),
    ol([
      'Repérez dans les notes ce qui ne peut pas rester tel quel, et dites pourquoi.',
      'Réécrivez les rubriques « Blocages », « Besoins » et « Recommandations », avec qui s’en charge.',
      'Dites si la journée 2 est recommandée, et pourquoi.',
    ]),
    table(
      ['Dans les notes', 'Le problème', 'Ce qu’on écrit'],
      [
        ['« Stressée, sans doute anxieuse »', 'Un diagnostic, sous la plume du formateur', 'Rien, sauf si Samia le souhaite et dans ses mots : « dit qu’elle perd ses moyens quand elle ne retrouve pas un document »'],
        ['Photos du cahier envoyées « quand c’est urgent »', 'Une habitude qui expose des données', 'Engagement RGPD : « je n’envoie plus de photo du cahier ; j’utilise la transmission prévue par la structure »'],
        ['Session d’un collègue', 'Blocage d’accès, et risque de sécurité', 'Blocage « accès et droits » : identifiant personnel à demander. <em>Qui : la structure, sur demande de Samia avec la cheffe de service.</em>'],
        ['Pas de temps de saisie', 'Blocage « temps »', 'Créneau de saisie à prévoir dans le planning de l’internat avant le déploiement. <em>Qui : la structure.</em>'],
        ['« Excel », « Canva », « Le logiciel »', 'Des noms d’outils, pas des besoins', '« Je dois pouvoir retrouver un document de l’espace partagé sans aide. » « Je dois pouvoir saisir une transmission datée dans le logiciel avant la fin de mon service. »'],
        ['« Tous les modules »', 'Contraire à la règle et au plafond de quatre modules', 'Voir la recommandation ci-dessous'],
      ],
    ) +
      h4('La recommandation corrigée') +
      ol([
        '<strong>Condition préalable :</strong> un identifiant personnel sur le poste du groupe (sans lui, le module 5 ne sert à rien).',
        '<strong>Socle · Environnement numérique professionnel</strong> : fichiers à 1, tâche quotidienne ; répond à la demande de Samia.',
        '<strong>Module 5 · DUI</strong> : à 0, et le logiciel arrive ; répond à la demande de la cheffe de service. À suivre avant le déploiement.',
        '<strong>Module 7</strong> : déjà vu en journée 1 ; devoir à terminer (sécurité à 1).',
      ]) +
      p('Pas de Word ni d’Outlook (niveau 2, tâches réussies seule). Pas d’Excel : à 1, mais Samia ne tient aucun tableau à son poste. Pas de Canva ni d’IA : à 0, sans tâche du poste derrière.') +
      p('<strong>Journée 2 : oui.</strong> Samia a au moins deux compétences transférables solides (agenda partagé, classement par album) qui répondent directement à ses deux besoins : il faut les faire passer sur l’outil de la structure.'),
    'Ce qui compte le plus dans cette correction : la fiche ne dit plus rien de la personnalité de Samia, elle dit ce qu’elle fait, ce qui la bloque et qui s’en charge. Et elle passe de « tous les modules » à deux modules et une condition, ce qui la rend réalisable.',
  ) +
  erreurs([
    'Recopier les notes brutes dans la fiche, sans les reformuler.',
    'Oublier les blocages qui relèvent de la structure, parce qu’ils « ne dépendent pas de la formation ».',
    'Recommander un module pour un outil à 0 dont le poste n’a pas besoin.',
  ]) +
  quizQuestions(QUIZ_J1) +
  avantSuite([
    'vous avez réécrit les rubriques de la fiche de Samia sans diagnostic et avec un responsable pour chaque blocage ;',
    'vous avez répondu aux six questions avant de lire les réponses ;',
    'pour chaque réponse fausse, vous avez relu la leçon de la journée qui en parle (évaluation, compétences transférables, blocages ou RGPD).',
  ]) +
  quizReponses(QUIZ_J1);

const J1_DEVOIR =
  p('<strong>À rendre à la fin de la journée 1.</strong> Déposez votre fiche bilan individualisée complétée (modèle dans la leçon « Fiche bilan individualisée et recommandations de modules »), relue et signée avec le formateur.') +
  h4('Les livrables') +
  ul([
    'la grille de niveau remplie, outil par outil, avec « non utile au poste » pour les outils qui ne vous concernent pas',
    'votre demande de départ (qui, quelle situation, quelle tâche doit changer) et ce que vous attendez vous-même',
    'trois compétences transférables au moins, chacune reliée à une tâche de votre poste',
    'vos points de blocage et qui s’en charge',
    'vos trois engagements RGPD',
    'vos besoins (« je dois pouvoir… ») et le ou les modules recommandés, dans l’ordre, quatre au plus',
    'la réponse « journée 2 recommandée : oui ou non »',
  ]) +
  h4('Les critères de réussite') +
  ul([
    'chaque niveau s’appuie sur une mise en situation observée ;',
    'chaque module recommandé répond à un besoin écrit, relié à une tâche du poste ;',
    'aucune difficulté personnelle n’est notée sans votre accord ;',
    'la fiche est signée par vous et par le formateur.',
  ]) +
  p('Format accepté : la fiche remplie en ligne, un document ou une photo nette de la fiche papier. Aucune donnée réelle sur une personne accompagnée ne doit figurer dans la fiche. Le formateur valide la fiche et vous inscrit sur les modules recommandés.') +
  pe('Ce qui est noté, c’est la qualité de la fiche, jamais votre niveau numérique : une personne au niveau 0 sur tous les outils peut obtenir la note maximale.') +
  grille([
    'chaque niveau est appuyé sur une observation, et non sur une déclaration ;',
    'les besoins sont formulés « je dois pouvoir… », avec une tâche du poste ;',
    'la règle de recommandation est appliquée : niveau 0 ou 1 et tâche du poste, quatre modules au plus, Socle d’abord si besoin ;',
    'aucun diagnostic ni aucune donnée réelle d’une personne accompagnée.',
  ]);

// ═══════════════════════════ JOURNÉE 2 ═══════════════════════════

const J2_PROGRAMME =
  reperes('Repères de la journée 2 (niveau 2)', [
    '<strong>Intitulé :</strong> transférer ses compétences personnelles en compétences professionnelles, et en acquérir de nouvelles grâce au module spécifique choisi selon ses besoins.',
    '<strong>Public :</strong> les participants de la journée 1 dont la fiche bilan recommande la journée 2 : éducateurs, moniteurs-éducateurs, AES, secrétaires, chefs de service, en MECS, IME, ITEP, SESSAD, ESAT, EHPAD ou dans une autre structure du secteur.',
    '<strong>Prérequis :</strong> avoir suivi la journée 1 et avoir déposé sa fiche bilan, validée par le formateur, avec la mention « journée 2 recommandée : oui ». Le formateur le vérifie dans le devoir de la journée 1 avant l’inscription.',
    '<strong>À apporter :</strong> sa fiche bilan (les trois compétences transférables et les besoins « je dois pouvoir… » en sont le point de départ).',
    '<strong>Durée :</strong> une journée, de 9 h 00 à 17 h 00, soit sept heures de formation, pause déjeuner non comprise.',
    '<strong>Modalités :</strong> en présentiel dans la structure, sur les outils réels de l’équipe avec des fichiers fictifs, ou en classe virtuelle avec partage d’écran.',
    '<strong>Livrable de la journée :</strong> le plan de transfert individuel et le choix argumenté du module spécifique, déposés avant 17 h.',
  ]) +
  h3('Ce que la journée produit') +
  p('En journée 1, chacun a repéré ce qu’il sait déjà faire dans sa vie personnelle. La journée 2 fait passer ces compétences du repérage à la pratique : chaque compétence est travaillée sur une tâche réelle du poste, avec l’outil de la structure, jusqu’à ce que la personne la réalise seule, sur un cas qu’elle n’a pas encore vu.') +
  p('Pour les besoins que les compétences transférables ne couvrent pas, la journée se termine par le choix d’un module spécifique, à prendre en option : Socle, Word, Excel, Outlook, Canva, DUI, écrits professionnels et numérique, ou outils d’IA.') +
  hr() +
  h3('Le déroulé de la journée') +
  deroule([
    ['9 h 00 à 9 h 30', '30 min', 'Accueil et retour depuis la journée 1', 'Échange en groupe : chacun relit sa fiche bilan et dit une chose essayée au travail depuis la journée 1.', 'cette leçon, la fiche bilan de chacun', 'les trois compétences à travailler dans la journée, confirmées ; émargement du matin'],
    ['9 h 30 à 10 h 30', '1 h', 'La méthode de transfert en quatre étapes', 'Apport, puis démonstration sur poste : décomposer une tâche en gestes.', 'leçon « Du personnel au professionnel »', 'une tâche de son poste décomposée en gestes numérotés'],
    ['10 h 30 à 10 h 45', '15 min', 'Pause'],
    ['10 h 45 à 12 h 30', '1 h 45', 'Compétences 1 et 2 : avec, puis sans aide', 'Mise en situation sur poste, en binômes ; premier passage guidé, deuxième passage seul, observé par le formateur.', 'fichiers fictifs préparés par le formateur, modèle de fiche mémo', 'deux tâches réalisées seul, deux fiches mémo'],
    ['12 h 30 à 13 h 30', '1 h', 'Pause déjeuner'],
    ['13 h 30 à 14 h 30', '1 h', 'Compétence 3 sur un cas différent', 'Mise en situation chronométrée (avec sa version sans chronomètre), puis échange en groupe sur ce qui change au travail.', 'leçon « Du personnel au professionnel »', 'la troisième tâche réalisée seul sur une variante, la troisième fiche mémo, les règles professionnelles écrites'],
    ['14 h 30 à 15 h 15', '45 min', 'Choisir le module spécifique', 'Apport court, puis entretien de choix individuel de dix minutes pendant que le groupe termine ses fiches mémo.', 'leçon « Acquérir de nouvelles compétences »', 'le module choisi (ou la décision de ne pas en prendre), relié à un besoin de la fiche bilan'],
    ['15 h 15 à 15 h 30', '15 min', 'Pause'],
    ['15 h 30 à 16 h 15', '45 min', 'Cas pratique corrigé et quiz', 'Travail individuel, puis correction commentée en groupe.', 'leçon « Cas pratique corrigé et quiz de la journée 2 »', 'le plan de transfert fictif corrigé, le quiz autocorrigé'],
    ['16 h 15 à 16 h 50', '35 min', 'Plan de transfert individuel', 'Travail individuel, relecture rapide avec le formateur.', 'devoir de la journée 2', 'le plan de transfert daté, déposé'],
    ['16 h 50 à 17 h 00', '10 min', 'Clôture', 'Échange en groupe : « la compétence que j’applique en premier, et quand ».', 'questionnaire de satisfaction à chaud', 'avis de satisfaction, émargement ; rappel : la journée 3 s’ouvre après validation du devoir'],
  ]) +
  pe('Les horaires sont indicatifs et s’adaptent au groupe ; les séquences, leur ordre et les productions attendues restent les mêmes.') +
  hr() +
  h3('Les objectifs de la journée') +
  pe('À la fin de la journée, le participant :') +
  ol([
    '<strong>réalise seul</strong>, sur l’outil de la structure, trois tâches professionnelles issues de ses compétences transférables, la troisième sur un cas différent de la démonstration, en atteignant le critère de réussite écrit pour chacune ;',
    '<strong>décompose une tâche en gestes numérotés</strong> et rédige la fiche mémo correspondante (une demi-page, dans ses mots, sans donnée réelle), qu’un collègue peut suivre sans explication ;',
    '<strong>écrit, pour chaque tâche, la règle professionnelle</strong> qui change par rapport à l’usage privé : canal, destinataires, droits d’accès, version qui fait foi ;',
    '<strong>choisit avec le formateur le module spécifique</strong> à suivre en option, ou décide de ne pas en prendre, en le reliant par écrit à un besoin « je dois pouvoir… » de sa fiche bilan ;',
    '<strong>dépose avant 17 h son plan de transfert daté</strong>, noté avec la grille commune du parcours.',
  ]) +
  matrice([
    ['Réaliser seul trois tâches professionnelles, dont une sur une variante', 'Mises en situation sur poste : guidé, seul, variante', 'Critère de réussite atteint au troisième passage, sans aide', 'Les trois lignes du plan de transfert', 'Selon la tâche : 1. Information et données · 2. Communication et collaboration · 3. Création de contenu'],
    ['Décomposer une tâche et rédiger la fiche mémo', 'Démonstration, puis rédaction', 'Un autre participant suit la fiche sans explication', 'Les trois fiches mémo', '3. Création de contenu · 5. Résolution de problèmes'],
    ['Écrire la règle professionnelle qui change', 'Échange en groupe, tableau des règles', 'Une règle juste pour chaque tâche', 'La colonne « règle » du plan', '4. Sécurité · 2. Communication et collaboration'],
    ['Choisir le module spécifique, relié à un besoin', 'Apport, entretien de choix', 'Le choix cite un besoin écrit de la fiche bilan', 'Le choix argumenté', '5. Résolution de problèmes'],
    ['Déposer le plan de transfert daté', 'Rédaction, relecture', 'Devoir noté avec la grille commune : validé à partir de 17 sur 24, jamais avec un 0 en sécurité', 'Le plan déposé', '5. Résolution de problèmes'],
  ]) +
  hr() +
  h3('Modalités d’évaluation') +
  modalites(
    [
      ['Matin et début d’après-midi', 'Les gestes', 'Observation du formateur à chaque passage : guidé, seul, variante', 'Le passage réussi seul sur la variante, qui vaut acquisition'],
      ['Après-midi', 'Le choix du module', 'Entretien de choix : le module est-il relié à un besoin écrit ?', 'Le choix argumenté'],
      ['Après-midi', 'La compréhension', 'Cas pratique corrigé et quiz d’autocorrection de six questions', 'Les points à revoir, pour soi'],
      ['Fin de journée', 'Le livrable', 'Devoir « Plan de transfert », noté avec la grille commune', 'La validation de la journée 2, condition d’accès à la journée 3'],
      ['Clôture', 'La journée elle-même', 'Questionnaire de satisfaction à chaud', 'Les améliorations de la journée suivante'],
    ],
  ) +
  p('Le devoir de la journée 2 validé (« Acquis » ou « Maîtrisé » sur la grille commune) est la seule condition d’accès à la journée 3. Les acquis évalués figurent sur l’attestation de fin de formation.') +
  h3('Les modules spécifiques, en option') +
  p('Les modules pratiques ne font pas partie de la journée 2 : ils se prennent en plus, un seul à la fois, selon le besoin écrit dans la fiche bilan. Ils sont décrits dans la leçon « Acquérir de nouvelles compétences : le module spécifique en option ». Le Socle et le module 7 figurent déjà dans la section de la journée 1.') +
  pourFormateur([
    '<strong>Animation :</strong> la journée est d’abord pratique. Limitez les apports à la méthode (début de matinée) et au choix du module (après-midi) ; le reste du temps, les participants sont sur le poste et vous circulez. Formez des binômes qui travaillent sur des outils proches, pas forcément de même niveau.',
    '<strong>Préparer les cas :</strong> avant la journée, relisez les fiches bilan et préparez, pour chaque compétence annoncée, un fichier fictif et une variante (autre mois, colonne en plus, fichier déjà ouvert par un collègue, destinataire différent). Sans variante, on vérifie une répétition, pas un transfert.',
    '<strong>Un participant en difficulté :</strong> revenez au passage guidé, réduisez la tâche à ses gestes essentiels, proposez la version sans chronomètre, et gardez les trois compétences en simplifiant la variante plutôt qu’en en supprimant une. Notez ce qu’il réussit, même partiellement.',
    '<strong>Un participant réticent</strong> (« je le fais déjà », « chez nous ça ne marchera pas ») : demandez-lui de montrer comment il fait, puis confrontez à la variante ; s’il réussit, il valide vite et peut aider son binôme. S’il doute de l’utilité, revenez au besoin écrit dans sa fiche bilan, dans ses mots à lui.',
    '<strong>Confidentialité :</strong> uniquement des fichiers fictifs ou l’environnement de test du logiciel métier. Vérifiez chaque fiche mémo : aucune capture ne doit laisser lire un nom ou une information réelle. Ce qui se dit sur la structure ou sur les collègues reste dans le groupe.',
    '<strong>Matériel en présentiel :</strong> un poste par participant, avec les mêmes outils qu’à son poste ; les fichiers fictifs et leurs variantes ; l’accès à l’environnement de test du logiciel métier si possible ; le modèle de fiche mémo imprimé ; la feuille d’émargement par demi-journée.',
    '<strong>Matériel en classe virtuelle :</strong> partage d’écran du participant pendant chaque passage ; prise de contrôle à distance seulement avec son accord et seulement au passage guidé ; fichiers fictifs envoyés avant la journée ; salles de sous-groupe pour les binômes et l’entretien de choix ; émargement numérique.',
  ]) +
  accessibilite(REVUE_J(2));

const J2_TRANSFERT =
  reperes('Repères de la leçon', [
    '<strong>Place dans la journée 2 :</strong> de 9 h 30 à 14 h 30 : la méthode le matin, les trois compétences sur poste jusqu’en début d’après-midi.',
    '<strong>Pour qui :</strong> les participants dont la fiche bilan de la journée 1 recommande la journée 2.',
    '<strong>Prérequis :</strong> avoir suivi la journée 1 et rendu sa fiche bilan.',
    '<strong>Objectif :</strong> transformer les compétences personnelles repérées en journée 1 en compétences professionnelles.',
    '<strong>Preuve produite :</strong> trois tâches réalisées seul, trois fiches mémo et les règles professionnelles écrites, reprises dans le plan de transfert.',
  ]) +
  objectifs([
    'décompose une tâche de son poste en gestes numérotés sur l’outil de la structure, avec pour chacun ce qu’il faut vérifier ;',
    'réalise chacune de ses trois tâches trois fois (guidé, seul, sur une variante) et atteint le critère de réussite au troisième passage, sans aide ;',
    'rédige trois fiches mémo d’une demi-page au plus, dans ses mots, sans donnée réelle, qu’un autre participant suit sans explication ;',
    'écrit, pour chaque tâche, la règle professionnelle qui la distingue de l’usage privé.',
  ], 'la séquence') +
  h3('De « je sais le faire chez moi » à « je le fais au travail »') +
  p('En journée 1, chacun a repéré au moins trois compétences transférables. La journée 2 les fait passer du repérage à la pratique : chaque compétence est reprise sur une tâche réelle du poste, avec l’outil de la structure, jusqu’à ce que la personne la réalise seule.') +
  p('Une compétence est transférée quand elle tient <strong>trois épreuves</strong> : elle se fait sur l’outil du travail et non sur son téléphone, elle se fait seul, et elle résiste à un cas un peu différent de celui qu’on a appris. C’est ce que vérifient les trois passages de la méthode.') +
  h3('La méthode en quatre étapes') +
  ol([
    '<strong>Repartir de la fiche bilan :</strong> reprendre une compétence transférable et la tâche du poste qui lui correspond.',
    '<strong>Décomposer la tâche :</strong> écrire les gestes un par un sur l’outil professionnel (où cliquer, où ranger, qui prévenir).',
    '<strong>Faire, avec puis sans aide :</strong> une première fois guidé par le formateur, une deuxième fois seul, une troisième fois sur un cas un peu différent.',
    '<strong>Écrire sa fiche mémo :</strong> une demi-page, dans ses mots, à garder près du poste.',
  ]) +
  hr() +
  h3('Démonstration : décomposer une tâche') +
  p('Tâche : « mettre à jour le tableau de suivi des activités de la semaine », pour une monitrice-éducatrice d’IME (fichier fictif). Compétence transférable de départ : elle tient la liste des dépenses de sa famille dans un tableur sur son téléphone.') +
  table(
    ['N°', 'Le geste', 'Ce qu’on vérifie'],
    [
      ['1', 'Ouvrir l’espace partagé du service, dossier des activités', 'c’est bien l’espace partagé, pas une copie sur le bureau'],
      ['2', 'Ouvrir le fichier du mois, nommé selon la convention de l’équipe', 'le nom et la date : c’est la version en cours'],
      ['3', 'Aller à la ligne de l’activité du jour', 'la date, l’atelier'],
      ['4', 'Saisir les identifiants des jeunes présents et la durée', 'les identifiants prévus par la structure, pas les noms si le tableau circule hors de l’équipe'],
      ['5', 'Vérifier que le total de la colonne s’est mis à jour', 'le total change ; sinon, la formule ne couvre pas la nouvelle ligne'],
      ['6', 'Enregistrer (et non « Enregistrer sous »), puis fermer', 'une seule version existe'],
      ['7', 'Prévenir la coordinatrice si un atelier a été annulé', 'par le canal prévu par la structure'],
    ],
  ) +
  p('Ce que la démonstration montre : sur son téléphone, la monitrice faisait déjà les gestes 3, 4 et 5. Les gestes 1, 2, 6 et 7 sont nouveaux : ce sont ceux du cadre professionnel (espace partagé, version, identifiants, circuit d’information). C’est sur eux que portera la fiche mémo.') +
  h3('Des exemples de transfert, et leur critère de réussite') +
  table(
    ['Compétence personnelle', 'Tâche professionnelle travaillée', 'Critère de réussite'],
    [
      ['classer ses photos', 'ranger les comptes rendus du mois dans l’arborescence du service', 'un collègue retrouve un document en moins d’une minute'],
      ['écrire dans un groupe de messagerie', 'rédiger une transmission dans l’outil de la structure', 'la transmission est comprise sans question complémentaire'],
      ['faire ses démarches en ligne', 'renseigner une fiche dans le logiciel métier', 'tous les champs obligatoires sont remplis, sans donnée inutile'],
      ['tenir une liste sur son téléphone', 'mettre à jour le tableau de suivi des activités', 'les totaux sont justes et le fichier est à jour'],
      ['partager un agenda familial', 'poser les rendez-vous du groupe dans l’agenda partagé du service (MECS)', 'un collègue voit le rendez-vous, avec le lieu et la personne qui accompagne, sans détail inutile'],
      ['faire une visio avec sa famille', 'préparer une visio entre un résident et ses proches avec le matériel de la structure (EHPAD)', 'la visio démarre à l’heure prévue, sans utiliser de compte personnel'],
      ['suivre ses commandes en ligne', 'tenir le tableau des commandes de l’atelier (ESAT)', 'chaque commande a une date, une quantité et un état à jour'],
    ],
  ) +
  h3('Avec, puis sans aide : trois passages') +
  table(
    ['Passage', 'Ce que fait le participant', 'Ce que fait le formateur'],
    [
      ['<strong>1 · Guidé</strong>', 'réalise la tâche en même temps que le formateur, geste par geste, sur le fichier fictif', 'montre, explique ce qui change par rapport à l’usage privé, répond aux questions'],
      ['<strong>2 · Seul</strong>', 'refait la même tâche seul, avec sa décomposition sous les yeux', 'observe, n’intervient que si on le lui demande, note les gestes qui ont posé question'],
      ['<strong>3 · Variante</strong>', 'réalise la tâche sur un cas différent (autre mois, colonne en plus, fichier déjà ouvert par un collègue, autre destinataire)', 'observe et vérifie le critère de réussite, sans aider'],
    ],
  ) +
  p('La compétence est considérée comme transférée quand le <strong>troisième passage</strong> est réussi seul, en atteignant le critère écrit. Un deuxième passage réussi prouve qu’on sait répéter ; le troisième prouve qu’on sait faire.') +
  h4('Comment le formateur se retire') +
  ul([
    'Au passage 2, il s’éloigne physiquement du poste (ou coupe son micro en classe virtuelle) : sa présence suffit à orienter les gestes.',
    'Quand on lui pose une question, il répond par une question : « Qu’est-ce que dit votre décomposition ? »',
    'Il ne touche jamais la souris ou le clavier du participant après le passage 1.',
  ]) +
  chrono(
    'le troisième passage',
    'quinze minutes par tâche',
    ul([
      'Le formateur vous remet la variante de votre tâche : même compétence, cas différent.',
      'Réalisez-la seul, sans votre fiche mémo (vous pouvez garder la décomposition).',
      'Quand vous avez fini, vérifiez vous-même le critère de réussite, puis appelez le formateur.',
    ]),
    'Même variante, sans limite de temps. Vous pouvez garder votre fiche mémo sous les yeux ; le formateur note alors « réussi seul avec la fiche mémo », qui compte comme réussi seul : la fiche mémo est faite pour ça.',
  ) +
  hr() +
  h3('La fiche mémo') +
  p('Une demi-page au plus, dans vos mots, à garder près du poste. Elle n’est pas un tutoriel de l’éditeur du logiciel : c’est ce que <strong>vous</strong> avez besoin de relire pour refaire la tâche seul dans trois semaines.') +
  carte(
    'Modèle de fiche mémo',
    pe('<strong>La tâche :</strong> …') +
      pe('<strong>Quand je la fais :</strong> …') +
      pe('<strong>Les gestes, dans l’ordre :</strong> 1. … 2. … 3. …') +
      pe('<strong>Où je range, sous quel nom :</strong> …') +
      pe('<strong>Qui je préviens, par quel canal :</strong> …') +
      pe('<strong>La règle qui change par rapport à chez moi :</strong> …') +
      pe('<strong>Si ça bloque :</strong> …'),
  ) +
  carte(
    'Exemple rempli (fictif)',
    pe('<strong>La tâche :</strong> ranger les comptes rendus de réunion du mois.') +
      pe('<strong>Quand :</strong> chaque vendredi, avant de partir.') +
      pe('<strong>Les gestes :</strong> 1. J’ouvre le dossier « À trier ». 2. Pour chaque compte rendu, je vérifie la date et l’état (brouillon ou validé). 3. Je renomme selon la convention de l’équipe. 4. Je le glisse dans « 02 Réunions › année en cours ». 5. Je vide « À trier ».') +
      pe('<strong>Où, sous quel nom :</strong> date à l’envers, type, objet, version.') +
      pe('<strong>Qui je préviens :</strong> personne, sauf si un compte rendu n’est pas validé : je le signale à la cheffe de service par la messagerie de la structure.') +
      pe('<strong>La règle qui change :</strong> jamais de nom de personne accompagnée dans un nom de fichier.') +
      pe('<strong>Si ça bloque :</strong> j’applique la méthode du Socle (décrire, reproduire, isoler, chercher, demander), puis j’appelle le référent.'),
  ) +
  alerte('Les captures d’écran dans une fiche mémo', pe('Une capture aide beaucoup, à condition qu’elle soit faite sur un fichier fictif ou dans l’environnement de test du logiciel. Une capture d’un vrai dossier, même floutée à la main, reste une donnée réelle qui circule : on la refait.')) +
  h3('Le cadre professionnel') +
  encart('La règle à rappeler à chaque geste', pe('À chaque geste transféré, on rappelle la règle qui change au travail : confidentialité, droits d’accès, version qui fait foi. C’est la différence entre une habitude personnelle et une compétence professionnelle.')) +
  table(
    ['Ce qui change', 'Chez moi', 'Au travail'],
    [
      ['<strong>Le canal</strong>', 'la messagerie de mon choix', 'les outils de la structure (messagerie, logiciel métier, espace partagé)'],
      ['<strong>Les destinataires</strong>', 'qui je veux', 'les seules personnes qui en ont besoin pour leur mission'],
      ['<strong>Les droits d’accès</strong>', 'tout le monde voit mes albums partagés', 'lecture seule par défaut ; modification pour ceux qui écrivent'],
      ['<strong>La version</strong>', 'plusieurs copies, peu importe', 'une seule version fait foi, rangée au bon endroit'],
      ['<strong>La conservation</strong>', 'je garde ce que je veux', 'c’est la structure qui décide ; pas de copie personnelle'],
    ],
  ) +
  p('Pour les gestes de sécurité eux-mêmes (mots de passe, hameçonnage, postes partagés), le module 7 de la journée 1 fait foi ; pour la méthode quand quelque chose ne marche pas, c’est la partie 7 du Socle. On ne les réexplique pas ici : on les applique.') +
  erreurs([
    'Arrêter au deuxième passage, parce que « ça marche » : sans variante, on n’a vérifié qu’une répétition.',
    'Écrire une fiche mémo de trois pages, ou recopier le guide de l’éditeur.',
    'Faire une capture d’écran d’un vrai dossier pour illustrer sa fiche mémo.',
    'Transférer le geste sans la règle : ranger vite, mais avec le nom d’un jeune dans le nom du fichier.',
  ]) +
  aRetenir([
    'Une compétence est transférée quand elle se fait sur l’outil du travail, seul, et sur un cas différent.',
    'Trois passages : guidé, seul, variante. Le troisième vaut acquisition.',
    'La fiche mémo tient sur une demi-page, dans vos mots, sans donnée réelle.',
    'À chaque geste, la règle qui change : canal, destinataires, droits, version, conservation.',
  ]) +
  transfert([
    'Dans la semaine qui suit : refaites chacune des trois tâches au moins une fois dans votre travail réel, avec votre fiche mémo.',
    'Dans le mois : montrez l’une de vos fiches mémo à un collègue et vérifiez qu’il peut refaire la tâche avec elle.',
  ]) +
  avantSuite([
    'vos trois tâches sont réussies seul au troisième passage, critère de réussite atteint ;',
    'vos trois fiches mémo tiennent chacune sur une demi-page et ne contiennent aucune donnée réelle ;',
    'pour chaque tâche, la règle professionnelle qui change est écrite.',
  ]);

const J2_MODULE =
  reperes('Repères de la leçon', [
    '<strong>Place dans la journée 2 :</strong> de 14 h 30 à 15 h 15, avec un entretien de choix individuel de dix minutes.',
    '<strong>Objectif :</strong> acquérir de nouvelles compétences grâce à une formation spécifique, choisie selon ses besoins.',
    '<strong>Option :</strong> le module spécifique se prend en plus de la journée 2 ; il n’est pas imposé.',
    '<strong>Preuve produite :</strong> le choix du module, relié à un besoin écrit dans la fiche bilan.',
  ]) +
  objectifs([
    'relit ses besoins « je dois pouvoir… » et repère ceux que ses compétences transférables ne couvrent pas ;',
    'choisit un module spécifique (ou décide de ne pas en prendre) en répondant par écrit aux trois questions de la grille de choix ;',
    'écrit en une phrase le lien entre le module choisi, le besoin de sa fiche bilan et la tâche du poste concernée.',
  ], 'la séquence') +
  h3('Choisir le module spécifique qui vous correspond') +
  p('Les compétences transférables ne couvrent jamais tout. Certaines tâches du poste demandent un savoir-faire nouveau : un tableau croisé, un modèle de courrier, une saisie dans le DUI. Pour ces besoins, chaque participant choisit, avec le formateur, le module pratique à suivre en plus.') +
  table(
    ['Module spécifique', 'Il répond à quel besoin', 'Exemple de besoin du secteur'],
    MODULES.map(([m, q, b]) => [`<strong>${m}</strong>`, q, `« ${b} »`]),
  ) +
  h3('Ce que chaque module vous fait produire') +
  p('Chaque module se termine par un devoir noté avec la même grille que ceux des journées. Ce que vous y produisez vous sert ensuite au travail :') +
  table(
    ['Module', 'Ce que vous repartez avec'],
    [
      ['Socle', 'la convention de nommage de votre équipe et un dossier rangé selon elle'],
      ['Module 1 · Word', 'un modèle de document réutilisable, et un document vérifié pour l’accessibilité'],
      ['Module 2 · Excel', 'un tableau de données propre, documenté par un dictionnaire, avec un commentaire de décision'],
      ['Module 3 · Outlook', 'un tableau de tri de messages justifié, des règles et des catégories en place'],
      ['Module 4 · Canva', 'un support décliné (papier, téléphone, FALC) et un registre des images'],
      ['Module 5 · DUI', 'la carte de votre logiciel et des transmissions réécrites, factuelles'],
      ['Écrits professionnels et numérique', 'des écrits synthétisés et adaptés à la lecture à l’écran (voir la présentation du module)'],
      ['Module 6 · Outils d’IA', 'des demandes sans donnée personnelle, une sortie corrigée et un journal d’usage'],
    ],
  ) +
  h3('Comment on choisit') +
  ul([
    'on part d’un besoin écrit dans la fiche bilan (« je dois pouvoir… »), jamais d’un outil à la mode',
    'on choisit le module qui débloque la tâche la plus fréquente du poste',
    'un seul module à la fois : on termine, on applique au travail, puis on voit la suite',
    'si le besoin est collectif (toute l’équipe sur le même DUI), le module peut se faire en groupe dans la structure',
  ]) +
  h4('La grille de choix : trois questions') +
  ol([
    '<strong>Quel besoin de ma fiche bilan n’est pas couvert</strong> par mes compétences transférables ?',
    '<strong>À quelle fréquence la tâche revient-elle</strong> dans mon travail : chaque jour, chaque semaine, chaque mois ?',
    '<strong>Qu’est-ce qui arrive bientôt</strong> dans ma structure : un nouveau logiciel, un nouveau modèle, une nouvelle organisation ?',
  ]) +
  p('Le module retenu est celui qui répond au besoin non couvert le plus fréquent, ou à celui qui arrive le plus tôt. Si aucun besoin n’est non couvert, la bonne décision est de <strong>ne pas prendre de module</strong> : on l’écrit, avec la raison.') +
  table(
    ['Ce qui ne justifie pas un choix', 'Pourquoi'],
    [
      ['« Tout le monde en parle »', 'un outil à la mode sans tâche derrière ne se transfère pas au poste'],
      ['« C’est là que j’ai le niveau le plus bas »', 'un niveau bas sur un outil inutile au poste n’est pas un besoin'],
      ['« Ma collègue le fait »', 'son poste n’est pas le vôtre'],
      ['« Pour avoir plus de modules sur mon attestation »', 'l’attestation dit ce qui a été suivi et acquis ; un module non utilisé au travail n’apporte rien'],
    ],
  ) +
  hr() +
  h3('Démonstration : trois participants, trois choix') +
  table(
    ['Participant (fictif)', 'Besoin non couvert', 'Choix et raison'],
    [
      ['Inès, éducatrice en MECS', '« Je dois pouvoir écrire une transmission courte, factuelle et lisible à l’écran, avant la fin de mon service. »', '<strong>Écrits professionnels et numérique</strong> : la tâche revient à chaque service, et le passage au logiciel de transmissions est prévu dans la structure.'],
      ['Olivier, secrétaire en ESAT', '« Je dois pouvoir produire seul le tableau des présences mensuelles de l’atelier, totaux compris. »', '<strong>Module 2 · Excel</strong> : tâche mensuelle, aujourd’hui refaite à la main ; sa compétence transférable (les comptes de son club) couvre la saisie, pas les formules.'],
      ['Claire, cheffe de service en SESSAD', '« Je dois pouvoir organiser les rendez-vous de l’équipe dans un agenda partagé, sans ressaisie. »', '<strong>Module 3 · Outlook</strong> : l’agenda partagé est quotidien pour tout le service ; sa compétence transférable (l’agenda familial) couvre la logique, pas le partage professionnel ni les droits.'],
    ],
  ) +
  p('Dans les trois cas, le choix cite le besoin exact de la fiche bilan, et la raison combine la fréquence de la tâche et ce que la compétence transférable ne couvre pas. Aucun des trois ne choisit l’IA ou Canva, alors que tous les trois y étaient à 0 : aucune tâche de leur poste ne le demande aujourd’hui.') +
  h3('L’entretien de choix') +
  p('Dix minutes, en tête à tête avec le formateur, pendant que le groupe termine ses fiches mémo.') +
  ol([
    'Le participant lit ses besoins « je dois pouvoir… » et dit lesquels ses trois compétences transférables couvrent désormais.',
    'Il répond aux trois questions de la grille de choix pour ceux qui restent.',
    'Il propose un module, ou aucun ; le formateur vérifie le lien avec le besoin et la tâche.',
    'Il écrit la phrase de choix : « Je choisis le module… parce que je dois pouvoir… pour la tâche… qui revient… »',
  ]) +
  h3('Organisation et financement') +
  ul([
    '<strong>En individuel</strong> : le module se suit en ligne, à son rythme, avec le formateur pour le devoir.',
    '<strong>En groupe dans la structure</strong> : quand plusieurs personnes ont le même besoin (un DUI qui se déploie pour toute l’équipe), le module peut se faire en intra.',
    '<strong>Un module à la fois</strong> : on le termine et on l’applique au travail avant d’en commencer un autre.',
  ]) +
  encart('Modulable', pe('Le participant est inscrit uniquement sur le ou les modules dont il a besoin. Le financement se demande module par module : voir la page de la formation et le devis.')) +
  erreurs([
    'Choisir d’après l’outil plutôt que d’après le besoin écrit.',
    'Prendre deux ou trois modules « tant qu’on y est ».',
    'Oublier qu’on peut ne prendre aucun module, si les compétences transférables suffisent.',
    'Choisir un module dont la tâche n’existera pas à son poste avant longtemps.',
  ]) +
  aRetenir([
    'Le module spécifique est une option, pas une obligation.',
    'On le choisit à partir d’un besoin écrit dans la fiche bilan, non couvert par les compétences transférables.',
    'Un seul à la fois : celui de la tâche la plus fréquente, ou de celle qui arrive bientôt.',
    'Ne pas prendre de module est une décision valable, qui s’écrit avec sa raison.',
  ]) +
  avantSuite([
    'vous savez quels besoins de votre fiche bilan vos compétences transférables couvrent désormais ;',
    'vous avez répondu par écrit aux trois questions de la grille de choix ;',
    'votre phrase de choix relie le module (ou l’absence de module) à un besoin et à une tâche de votre poste.',
  ]);

// ─── J2 · Cas pratique corrigé et quiz ───────────────────────────────────────
const QUIZ_J2 = [
  {
    q: 'Vous avez repris une compétence transférable et la tâche du poste qui lui correspond. Quelle est l’étape suivante de la méthode ?',
    o: [
      'Faire la tâche seul tout de suite, pour voir où vous en êtes.',
      'Écrire la fiche mémo, pendant que vous vous souvenez de la démonstration.',
      'Décomposer la tâche en gestes, un par un, sur l’outil professionnel.',
      'Choisir le module spécifique qui correspond à cette tâche.',
    ],
    r: 'C',
    pourquoi: 'la méthode suit quatre étapes : repartir de la fiche bilan, décomposer la tâche, faire avec puis sans aide, écrire la fiche mémo. La décomposition fait apparaître les gestes nouveaux, ceux du cadre professionnel.',
    autres: 'A saute la décomposition et le passage guidé : on met la personne en échec sur des gestes qu’elle n’a jamais vus. B écrit la fiche avant d’avoir fait la tâche : elle décrira ce qu’on a vu, pas ce qu’on sait faire. D se trompe de moment : le module spécifique répond aux besoins que les compétences transférables ne couvrent pas, il se choisit en fin de journée.',
  },
  {
    q: 'Quel est le meilleur critère de réussite pour la tâche « ranger les comptes rendus du mois dans l’arborescence du service » ?',
    o: [
      'Un collègue retrouve un compte rendu du mois en moins d’une minute, sans aide.',
      'Je me sens plus à l’aise avec le dossier partagé.',
      'J’ai rangé les comptes rendus.',
      'Le dossier est bien présenté.',
    ],
    r: 'A',
    pourquoi: 'un critère de réussite est observable et vérifiable par quelqu’un d’autre. Celui-ci dit qui vérifie, quoi et dans quelle condition.',
    autres: 'B décrit un ressenti, qui ne se vérifie pas. C décrit l’action, pas son résultat : on peut avoir rangé au mauvais endroit. D est un jugement d’apparence, sans lien avec l’usage.',
  },
  {
    q: 'Une éducatrice transfère au travail son habitude d’écrire dans un groupe de messagerie familial. Qu’est-ce qui change au travail ?',
    o: [
      'Rien : c’est le même geste, seul le contenu change.',
      'On peut utiliser la même messagerie grand public si l’équipe est d’accord, parce que c’est plus rapide.',
      'On écrit plus long, pour être sûr d’être complet.',
      'Le canal (l’outil de la structure), les destinataires (ceux qui en ont besoin) et le contenu (factuel, daté, sans jugement).',
    ],
    r: 'D',
    pourquoi: 'ce qui fait d’une habitude une compétence professionnelle, ce sont les règles qui s’y ajoutent : canal, destinataires, droits, contenu. Le geste d’écrire court reste, le cadre change.',
    autres: 'A oublie précisément ce qui change. B est une erreur fréquente : l’accord de l’équipe ne fait pas d’une messagerie grand public un outil adapté aux informations sur les personnes accompagnées. C va contre la minimisation : on écrit ce qui est utile, pas tout.',
  },
  {
    q: 'La fiche bilan d’un participant dit : « je dois pouvoir saisir mes observations dans le DUI qui arrive en janvier ». Il est à 0 sur Canva et très attiré par l’IA. Quel module spécifique retenir ?',
    o: [
      'Module 6 · Outils d’IA, parce que c’est ce qui l’intéresse le plus.',
      'Module 5 · Dossier usager informatisé (DUI).',
      'Module 4 · Canva, parce que c’est là que son niveau est le plus bas.',
      'Les trois, l’un après l’autre, sans attendre.',
    ],
    r: 'B',
    pourquoi: 'le choix part d’un besoin écrit et d’une tâche du poste qui arrive bientôt : la saisie dans le DUI.',
    autres: 'A choisit un outil à la mode sans besoin écrit derrière. C confond niveau bas et besoin : sans tâche du poste, un 0 sur Canva ne justifie rien. D contredit la règle « un seul module à la fois ».',
  },
  {
    q: 'Laquelle de ces fiches mémo est conforme ?',
    o: [
      'Une demi-page dans vos mots : les gestes numérotés, où ranger, qui prévenir, la règle qui change, sans donnée réelle.',
      'Le guide complet de l’éditeur du logiciel, imprimé et surligné.',
      'Une capture d’écran d’un vrai dossier ouvert, pour montrer exactement où cliquer.',
      'Les notes prises pendant la démonstration du formateur, telles quelles.',
    ],
    r: 'A',
    pourquoi: 'la fiche mémo sert à refaire la tâche seul dans quelques semaines : courte, personnelle, complète sur le cadre, et sans donnée réelle.',
    autres: 'B est trop long pour être relu au moment de la tâche, et ne dit rien des règles de votre structure. C fait circuler une donnée réelle : la capture se refait sur un fichier fictif ou l’environnement de test. D décrit ce que le formateur a fait, pas ce que vous avez besoin de relire.',
  },
  {
    q: 'Un participant réussit sa tâche avec l’aide du formateur au premier passage, puis seul au deuxième. La compétence est-elle transférée ?',
    o: [
      'Oui : le deuxième passage réussi seul suffit.',
      'Non : il faudra refaire toute la journée 2.',
      'Pas encore : il reste le troisième passage, seul, sur un cas différent.',
      'Oui, si le formateur l’a trouvé à l’aise.',
    ],
    r: 'C',
    pourquoi: 'le troisième passage, sur une variante, vérifie qu’on sait faire et pas seulement répéter. C’est lui qui vaut acquisition.',
    autres: 'A s’arrête à la répétition. B est disproportionné : il manque un passage, pas une journée. D remplace une observation par une impression.',
  },
];

const J2_CAS =
  reperes('Repères de la leçon', [
    '<strong>Place dans la journée 2 :</strong> de 15 h 30 à 16 h 15, juste avant la rédaction de votre propre plan de transfert.',
    '<strong>Objectif :</strong> vous entraîner à corriger un plan de transfert complet, puis vérifier ce que vous avez compris de la journée.',
    '<strong>Modalité :</strong> travail individuel, puis correction commentée en groupe ; quiz d’autocorrection de six questions, non noté.',
    '<strong>Preuve produite :</strong> le plan fictif corrigé et vos réponses au quiz.',
  ]) +
  objectifs([
    'repère dans le plan fictif au moins cinq problèmes (compétence mal formulée, critère invérifiable, canal non conforme, donnée réelle, choix de module non relié à un besoin, date absente) ;',
    'réécrit les trois lignes du plan avec une compétence, une tâche, un critère vérifiable, une règle et une date ;',
    'répond aux six questions du quiz, puis explique chacune de ses erreurs à l’aide des réponses commentées.',
  ]) +
  casPratique(
    'le plan de transfert de Nadia',
    pe('Nadia est secrétaire dans un ESAT (situation et personne fictives). Sa fiche bilan de la journée 1 indique deux besoins : « je dois pouvoir tenir seule le tableau des présences mensuelles des travailleurs de l’atelier conditionnement » et « je dois pouvoir diffuser le planning de la semaine aux moniteurs d’atelier sans erreur de version ». Voici le brouillon de son plan de transfert.') +
      tf(['Compétence personnelle', 'Tâche professionnelle', 'Critère de réussite et date'], (r) => [r[0], r[1], `${r[2]}<br><em>Date :</em> ${r[3]}`],
        [
          ['« Tableur sur mon téléphone »', '« Excel »', '« Être plus à l’aise »', '« Bientôt »'],
          ['« Groupe de messagerie du club de handball »', '« Envoyer le planning aux moniteurs sur la même messagerie, c’est plus rapide »', '« Tout le monde l’a reçu »', '« Lundi »'],
          ['« Démarches CAF en ligne »', '« Saisir les absences des travailleurs dans le logiciel »', '« Tous les champs remplis »', '« Dans le mois »'],
        ],
      ) +
      pe('<strong>Fiche mémo n° 3 :</strong> une capture d’écran du logiciel, avec la fiche d’un travailleur ouverte et son nom lisible, « pour savoir où cliquer ».') +
      pe('<strong>Module spécifique choisi :</strong> « Module 6 · Outils d’IA, parce que tout le monde en parle ».'),
    ol([
      'Relevez tout ce qui ne peut pas rester tel quel, ligne par ligne.',
      'Réécrivez le plan : compétence (verbe d’action), tâche précise, critère vérifiable, règle qui change, date.',
      'Corrigez le choix du module spécifique.',
    ]),
    table(
      ['Dans le brouillon', 'Le problème', 'La correction'],
      [
        ['« Tableur sur mon téléphone »', 'un outil, pas une compétence', '« tenir une liste et faire des calculs simples dans un tableur »'],
        ['« Excel »', 'un nom de logiciel, pas une tâche', '« mettre à jour le tableau des présences mensuelles de l’atelier conditionnement »'],
        ['« Être plus à l’aise »', 'un ressenti, invérifiable', '« les totaux par semaine sont justes, vérifiés à la main sur une semaine, et le fichier est enregistré dans l’espace partagé selon la convention »'],
        ['« Sur la même messagerie »', 'messagerie grand public : le planning contient les noms des travailleurs', '« diffuser un lien vers le planning de l’espace partagé, en lecture seule, aux moniteurs d’atelier, par la messagerie de la structure »'],
        ['« Tout le monde l’a reçu »', 'ne vérifie pas le besoin écrit (pas d’erreur de version)', '« chaque moniteur ouvre la version à jour depuis le lien ; il n’existe qu’une version »'],
        ['Fiche mémo avec un nom lisible', 'donnée réelle dans un support qui circule', 'capture refaite dans l’environnement de test, ou décomposition écrite sans capture'],
        ['« Bientôt », « Dans le mois »', 'pas de date : le plan reste une intention', 'une date précise pour chaque ligne, par exemple le premier vendredi après la formation'],
        ['« Module 6, parce que tout le monde en parle »', 'aucun besoin écrit derrière', 'voir ci-dessous'],
      ],
    ) +
      h4('Le plan réécrit') +
      tf(['Compétence et tâche', 'Critère, règle et date'], (r) => [`<em>Compétence :</em> ${r[0]}<br><em>Tâche :</em> ${r[1]}`, `<em>Critère :</em> ${r[2]}<br><em>Règle qui change :</em> ${r[3]}<br><em>Date :</em> ${r[4]}`],
        [
          ['tenir une liste et faire des calculs simples dans un tableur', 'mettre à jour le tableau des présences mensuelles de l’atelier', 'totaux justes, vérifiés sur une semaine ; fichier rangé selon la convention', 'identifiants prévus par la structure si le tableau circule hors de l’équipe ; une seule version', 'premier vendredi après la formation'],
          ['écrire court, au bon destinataire', 'diffuser le planning de la semaine aux moniteurs d’atelier', 'chaque moniteur ouvre la version à jour depuis le lien', 'canal de la structure ; lien en lecture seule ; destinataires concernés seulement', 'lundi suivant la formation'],
          ['remplir un formulaire en ligne et garder une preuve', 'saisir les absences des travailleurs dans le logiciel', 'tous les champs obligatoires remplis, sans donnée inutile, avant la fin de la journée', 'rubrique prévue, droits d’accès de son profil ; aucune capture de vrai dossier', 'dès la première absence après la formation'],
        ],
      ) +
      h4('Le module spécifique corrigé') +
      p('<strong>Module 2 · Excel.</strong> Le besoin « tenir seule le tableau des présences mensuelles » n’est couvert qu’en partie par sa compétence transférable : Nadia sait saisir, mais pas encore construire les totaux par semaine ni vérifier les formules. La tâche revient chaque mois. Le module 6 pourra être reconsidéré plus tard, s’il correspond un jour à un besoin écrit et si la structure autorise un outil.'),
    'Le point qui compte le plus : la ligne 2. L’envoi par messagerie grand public paraissait être un simple gain de temps ; il fait circuler les noms des travailleurs hors des outils de la structure, et il ne règle même pas le besoin écrit (les erreurs de version). Le lien vers l’espace partagé règle les deux.',
  ) +
  erreurs([
    'Corriger la forme d’un plan sans vérifier qu’il répond aux besoins de la fiche bilan.',
    'Laisser une date floue « parce qu’on ne sait pas encore ».',
    'Garder une capture « floutée » d’un vrai dossier.',
  ]) +
  quizQuestions(QUIZ_J2) +
  avantSuite([
    'vous avez relevé au moins cinq problèmes dans le plan de Nadia et réécrit ses trois lignes ;',
    'vous avez répondu aux six questions avant de lire les réponses ;',
    'pour chaque réponse fausse, vous avez relu la partie de la leçon « Du personnel au professionnel » ou « Acquérir de nouvelles compétences » qui en parle.',
  ]) +
  quizReponses(QUIZ_J2);

const J2_DEVOIR =
  p('<strong>À rendre à la fin de la journée 2.</strong> Déposez votre plan de transfert individuel, sur le modèle du plan réécrit du cas pratique.') +
  h4('Les livrables') +
  ul([
    'trois compétences personnelles transférées, chacune avec la tâche professionnelle travaillée, son critère de réussite et la règle qui change au travail',
    'vos trois fiches mémo (une demi-page chacune)',
    'le module spécifique choisi en option, et le besoin de la fiche bilan auquel il répond, ou la décision de ne pas en prendre, avec sa raison',
    'la date à laquelle vous appliquerez chaque compétence dans votre travail réel',
  ]) +
  h4('Les critères de réussite') +
  ul([
    'chaque tâche a été réussie seul au troisième passage (le formateur l’a noté pendant la journée) ;',
    'chaque critère de réussite est observable par quelqu’un d’autre que vous ;',
    'chaque ligne a une date précise ;',
    'aucune fiche mémo ni capture ne contient de donnée réelle.',
  ]) +
  p('Format accepté : un document ou un tableau, et les fiches mémo en fichier ou en photo nette. Aucune donnée réelle sur une personne accompagnée : utilisez des exemples fictifs. Ce devoir, validé (« Acquis » ou « Maîtrisé »), valide la journée 2 et ouvre l’accès à la journée 3.') +
  grille([
    'chaque compétence est formulée avec un verbe d’action et reliée à une tâche précise du poste ;',
    'chaque critère de réussite est vérifiable, et la règle professionnelle qui change est écrite ;',
    'le choix du module spécifique cite un besoin écrit de la fiche bilan ;',
    'aucune capture ni fiche mémo ne laisse lire une donnée réelle.',
  ]);

// ═══════════════════════════ JOURNÉE 3 ═══════════════════════════

const J3_PROGRAMME =
  reperes('Repères de la journée 3 (niveau 3)', [
    '<strong>Intitulé :</strong> rendre ses compétences numériques fonctionnelles en emploi et transférables, avec le langage commun des nomenclatures SERAFIN-PH.',
    '<strong>Public :</strong> les participants qui ont validé la journée 2 : éducateurs, moniteurs-éducateurs, AES, secrétaires, chefs de service. La journée est construite sur l’exemple des établissements et services pour personnes handicapées (IME, ITEP, SESSAD…) ; la méthode vaut aussi en MECS, en ESAT ou en EHPAD.',
    '<strong>Prérequis obligatoire :</strong> avoir suivi la journée 2 et validé son devoir « Plan de transfert et choix du module spécifique » (« Acquis » ou « Maîtrisé » sur la grille commune, sans 0 en sécurité). Le formateur vérifie cette validation dans le devoir de la journée 2 avant d’ouvrir l’inscription : sans elle, la journée 3 n’est pas accessible.',
    '<strong>À apporter :</strong> son plan de transfert de la journée 2, et la liste des écrits et saisies qu’on fait chaque semaine à son poste (sans aucun contenu réel).',
    '<strong>Durée :</strong> une journée, de 9 h 00 à 17 h 00, soit sept heures de formation, pause déjeuner non comprise.',
    '<strong>Modalités :</strong> en présentiel dans la structure, ou en classe virtuelle ; exercices sur des situations fictives uniquement.',
    '<strong>Livrable de la journée :</strong> la cartographie de son activité avec les nomenclatures SERAFIN-PH, déposée avant 16 h 30.',
  ]) +
  h3('Ce que la journée produit') +
  p('Les journées 1 et 2 ont fait passer des compétences de la vie personnelle à l’outil du travail. La journée 3 pose la question suivante : <strong>à quoi servent ces compétences dans l’activité de la structure</strong>, et comment les rendre valables ailleurs, avec un autre logiciel, à un autre poste, dans une autre structure ?') +
  p('La réponse passe par un langage commun : les nomenclatures des besoins et des prestations de la réforme SERAFIN-PH. Un professionnel qui sait relier ce qu’il fait à un besoin de la personne et à une prestation, et en laisser une trace numérique exacte, a une compétence qui fonctionne dans n’importe quel établissement ou service du secteur.') +
  hr() +
  h3('Le déroulé de la journée') +
  deroule([
    ['9 h 00 à 9 h 30', '30 min', 'Accueil et retour sur les plans de transfert', 'Échange en groupe : ce qui a été appliqué depuis la journée 2, ce qui a résisté.', 'cette leçon, le plan de transfert de chacun', 'une compétence transférée par personne, citée avec sa trace au travail ; émargement du matin'],
    ['9 h 30 à 10 h 30', '1 h', 'Compétences fonctionnelles et transférables', 'Apport, démonstration (la même trace avant et après), échange en groupe « le test du changement ».', 'leçon « Rendre les compétences fonctionnelles en emploi et transférables »', 'une trace de son poste réécrite, ce qui resterait valable ailleurs'],
    ['10 h 30 à 10 h 45', '15 min', 'Pause'],
    ['10 h 45 à 12 h 30', '1 h 45', 'SERAFIN-PH et les nomenclatures', 'Apport à partir des sources de la CNSA, démonstration (rattacher un écrit), mise en situation chronométrée.', 'leçon « SERAFIN-PH : la tarification dans le social et le rôle du numérique »', 'des activités fictives rattachées à un besoin et à une prestation'],
    ['12 h 30 à 13 h 30', '1 h', 'Pause déjeuner'],
    ['13 h 30 à 15 h 00', '1 h 30', 'Cas pratique : la journée de Karim, et quiz', 'Travail individuel ou en binôme, puis correction commentée en groupe ; quiz d’autocorrection.', 'leçon « Cas pratique corrigé et quiz de la journée 3 »', 'les six activités rattachées, les traces réécrites, le quiz autocorrigé'],
    ['15 h 00 à 15 h 15', '15 min', 'Pause'],
    ['15 h 15 à 16 h 30', '1 h 15', 'Cartographier son activité', 'Travail individuel, le formateur passe de poste en poste.', 'devoir de la journée 3', 'la cartographie déposée'],
    ['16 h 30 à 17 h 00', '30 min', 'Bilan de la journée et suite du parcours', 'Échange en groupe, présentation du bilan final.', 'éléments du bilan final (bilan « après », quiz final, devoir bilan final, « Transfert au poste de travail ») ; questionnaire de satisfaction', 'avis de satisfaction, émargement ; chacun sait ce qui reste à faire pour le bilan final'],
  ]) +
  pe('Les horaires sont indicatifs et s’adaptent au groupe ; les séquences, leur ordre et les productions attendues restent les mêmes.') +
  hr() +
  h3('Les objectifs de la journée') +
  pe('À la fin de la journée, le participant :') +
  ol([
    '<strong>explique en trois à cinq phrases</strong> ce qu’est SERAFIN-PH (sigle, objectifs, calendrier annoncé par la CNSA, composition de la future dotation), sans erreur de fait ;',
    '<strong>rattache au moins cinq des six activités du cas pratique</strong> au bon domaine de la nomenclature des besoins et au bon domaine de la nomenclature des prestations (directes ou indirectes) ;',
    '<strong>réécrit une trace numérique</strong> (observation, transmission, ligne de tableau) pour qu’elle dise quoi, pour qui, quand et en lien avec quel objectif, sans jugement ni donnée inutile ;',
    '<strong>distingue ce qui relève de son rôle</strong> (des écrits et saisies exacts et structurés) de ce qui relève de la direction (le codage officiel et les recueils) ;',
    '<strong>dépose la cartographie de trois activités de son poste</strong>, décrites de façon fictive, avec ce qui resterait valable dans une autre structure ou avec un autre logiciel.',
  ]) +
  matrice(
    [
      ['Expliquer ce qu’est SERAFIN-PH, sans erreur de fait', 'Apport à partir des sources de la CNSA', 'Questions 1, 2 et 6 du quiz', 'Vos réponses au quiz', 'Objectifs et calendrier de la réforme ; composition de la dotation'],
      ['Rattacher des activités aux nomenclatures', 'Démonstration, mise en situation chronométrée, cas pratique', 'Au moins cinq activités sur six correctement rattachées', 'Le tableau du cas pratique', 'Nomenclature des besoins ; nomenclature des prestations directes et indirectes'],
      ['Réécrire une trace numérique fonctionnelle', 'Démonstration, cas pratique', 'La trace dit quoi, pour qui, quand, lien avec l’objectif ; aucun jugement', 'Les traces réécrites', 'Prestations directes : ce que la trace décrit'],
      ['Distinguer son rôle de celui de la direction', 'Apport, question 4 du quiz', 'Le participant ne code pas, il décrit', 'Votre réponse et votre cartographie', 'Pilotage et fonctions support (prestations indirectes)'],
      ['Cartographier son activité et ce qui se transfère', 'Travail individuel', 'Devoir noté avec la grille commune : validé à partir de 17 sur 24, jamais avec un 0 en sécurité', 'La cartographie déposée', 'Langage commun des nomenclatures, d’une structure à l’autre'],
    ],
    'Cadre SERAFIN-PH',
  ) +
  hr() +
  h3('Modalités d’évaluation') +
  modalites(
    [
      ['Avant la journée', 'Le prérequis', 'Devoir de la journée 2 validé par le formateur', 'L’accès à la journée 3'],
      ['Matin', 'La compréhension', 'Démonstration et mise en situation chronométrée corrigée', 'Les rattachements à revoir'],
      ['Après-midi', 'L’application', 'Cas pratique corrigé et quiz d’autocorrection de six questions', 'Les points à revoir, pour soi'],
      ['Fin de journée', 'Le livrable', 'Devoir « Cartographier son activité », noté avec la grille commune', 'La validation de la journée 3'],
      ['Clôture', 'La journée elle-même', 'Questionnaire de satisfaction à chaud', 'Les améliorations de la journée suivante'],
    ],
  ) +
  p('Les acquis évalués figurent sur l’attestation de fin de formation. La journée 3 ne prépare ni au codage officiel de l’activité, ni aux réponses aux recueils : ces tâches relèvent de la direction.') +
  alerte('Les sources, et leur date', pe('Les informations sur SERAFIN-PH viennent des pages de la CNSA, consultées le 28 septembre 2026. La réforme est en cours et son calendrier peut évoluer : le formateur vérifie le site de la CNSA avant chaque session et renvoie les participants à ce site pour le détail des nomenclatures.')) +
  pourFormateur([
    '<strong>Animation :</strong> l’apport sur SERAFIN-PH est court et factuel ; la journée se joue sur les traces écrites. Ramenez chaque notion à un écrit ou une saisie du quotidien : « Où, dans votre logiciel, verrait-on cette activité ? »',
    '<strong>Rester dans les faits autorisés :</strong> n’annoncez aucun effet financier, aucun calendrier et aucune règle au-delà de ce que dit la CNSA. À une question précise sur le budget de la structure ou sur le codage, la réponse est : « C’est la direction qui le sait et qui le fait ; voyons ce que vous pouvez écrire de juste. »',
    '<strong>Un participant en difficulté :</strong> réduisez le nombre d’activités à rattacher, travaillez d’abord la distinction besoin et prestation à l’oral, proposez la version sans chronomètre et le travail en binôme. Le vocabulaire des nomenclatures s’affiche au mur ou dans le chat.',
    '<strong>Un participant réticent</strong> (« on nous demande de tout justifier », « on n’est pas des comptables ») : reconnaissez la crainte ; rappelez que le professionnel ne code pas, et que des traces exactes protègent aussi la personne accompagnée et le professionnel lui-même. Partez de son propre écrit, pas de la réforme.',
    '<strong>Confidentialité :</strong> uniquement des situations fictives. Si un participant cite une personne réelle ou une situation reconnaissable, recentrez sur un exemple inventé. Les informations internes sur la structure (budget, organisation) restent dans le groupe.',
    '<strong>Matériel en présentiel :</strong> un poste par participant ; le tableau des domaines des nomenclatures imprimé ou affiché ; l’accès au site de la CNSA pour montrer la source ; la feuille d’émargement par demi-journée.',
    '<strong>Matériel en classe virtuelle :</strong> le tableau des domaines partagé à l’écran ou dans le chat ; salles de sous-groupe pour les binômes du cas pratique ; émargement numérique.',
  ]) +
  accessibilite(REVUE_J(3, 'Les informations SERAFIN-PH ont été vérifiées sur le site de la CNSA à la même date ; elles sont à revérifier avant chaque session.'));

const J3_EMPLOI =
  reperes('Repères de la journée 3 (niveau 3)', [
    '<strong>Prérequis obligatoire :</strong> avoir suivi la journée 2 et validé son plan de transfert. La journée 3 n’est pas accessible sans la journée 2.',
    '<strong>Place dans la journée 3 :</strong> de 9 h 30 à 10 h 30, avant l’apport sur SERAFIN-PH.',
    '<strong>Objectif :</strong> utiliser les compétences des professionnels pour les rendre fonctionnelles en emploi, et permettre leur transférabilité d’un poste, d’un outil ou d’une structure à l’autre.',
    '<strong>Cadre :</strong> la réforme SERAFIN-PH de la tarification des établissements et services pour personnes handicapées.',
    '<strong>Preuve produite :</strong> une trace de son poste réécrite, et la liste de ce qui resterait valable ailleurs ; puis, en fin de journée, la cartographie de ses activités avec les nomenclatures SERAFIN-PH.',
  ]) +
  objectifs([
    'vérifie, sur une trace de son poste (fictive), les trois conditions d’une compétence fonctionnelle, et la réécrit si l’une manque ;',
    'réécrit une observation pour qu’elle dise quoi, pour qui, quand et en lien avec quel objectif, en cinq lignes au plus, sans jugement ;',
    'cite, pour une de ses compétences, ce qui resterait valable s’il changeait de logiciel, de poste et de structure.',
  ], 'la séquence') +
  h3('Une compétence est fonctionnelle quand elle sert l’activité') +
  p('Savoir utiliser un outil ne suffit pas : la compétence devient fonctionnelle quand elle rend un service mesurable à l’activité de la structure et aux personnes accompagnées. Un tableau bien tenu, une transmission claire, une saisie complète dans le DUI : chacun de ces gestes laisse une trace qui décrit ce qui a été fait, pour qui, et pourquoi.') +
  table(
    ['Savoir utiliser l’outil', 'Compétence fonctionnelle en emploi'],
    [
      ['savoir saisir du texte dans le DUI', 'saisir une observation datée, reliée à un objectif du projet personnalisé, que l’équipe suivante comprend sans question'],
      ['savoir faire un tableau', 'tenir le tableau de suivi des ateliers de façon que la cheffe de service puisse en tirer l’activité du mois sans le retraiter'],
      ['savoir envoyer un mail', 'transmettre au bon partenaire, par le bon canal, seulement ce qui lui est utile, et le tracer'],
      ['savoir ouvrir l’agenda', 'poser les rendez-vous de l’équipe avec qui accompagne, où, et combien de temps, pour que l’organisation du service tienne'],
    ],
  ) +
  h3('Les trois conditions d’une compétence fonctionnelle') +
  ol([
    '<strong>Elle sert une tâche réelle du poste</strong>, reliée à un besoin de la personne accompagnée ou au fonctionnement du service.',
    '<strong>Elle laisse une trace exploitable</strong> : datée, factuelle, rangée au bon endroit, lisible par un collègue et par la personne qui devra plus tard décrire l’activité.',
    '<strong>Elle est reproductible par un autre</strong> : la méthode est écrite (fiche mémo, procédure), elle ne tient pas qu’à la personne qui la connaît.',
  ]) +
  p('La troisième condition est celle qui manque le plus souvent. Une professionnelle très efficace, qui a « tout dans la tête », fait fonctionner le service tant qu’elle est là ; son départ en congé suffit à tout arrêter. Écrire sa méthode ne la rend pas remplaçable : cela rend sa compétence utile à l’équipe.') +
  hr() +
  h3('Démonstration : la même trace, avant et après') +
  p('Nora, éducatrice en SESSAD (situation fictive), a accompagné Théo au collège pour une réunion avec son professeur principal. Voici ce qu’elle a saisi, puis ce qu’elle aurait pu saisir.') +
  encart('Avant', pe('<em>« Collège avec Théo. Ça s’est bien passé, le prof est sympa. À suivre. »</em>')) +
  encart('Après', pe('<em>« Jeudi, 16 h 00 à 16 h 45, au collège : réunion avec le professeur principal de Théo, en présence de Théo. Objectif du projet personnalisé travaillé : participer aux échanges qui le concernent. Théo a présenté lui-même deux difficultés en mathématiques. Décision : temps de travail supplémentaire proposé par le collège le mardi. Suite : point avec les parents, par Nora, avant la fin du mois. »</em>')) +
  table(
    ['Ce qui a changé', 'Pourquoi c’est utile'],
    [
      ['La date, l’heure et la durée', 'l’activité existe et se situe dans le temps'],
      ['L’objectif du projet personnalisé', 'on sait à quel besoin de Théo répond cette activité'],
      ['Ce que Théo a fait, et non ce que Nora a ressenti', 'un fait se partage, une impression non'],
      ['La décision et la suite, avec qui et quand', 'l’équipe peut continuer sans Nora'],
      ['Plus de jugement sur le professeur', 'il n’apporte rien à l’accompagnement'],
    ],
  ) +
  p('La trace « après » répond aux trois conditions : elle sert une tâche réelle, elle est exploitable par toute l’équipe, et n’importe quel collègue pourrait l’écrire de la même façon. Elle se relie aussi, on le verra dans la leçon suivante, à un besoin et à une prestation des nomenclatures SERAFIN-PH.') +
  h3('La transférabilité : ce qui reste quand on change de poste') +
  table(
    ['Ce qui change', 'Ce qui reste (la compétence transférable)'],
    [
      ['le logiciel (un DUI remplace un autre)', 'savoir structurer une information, la retrouver, la mettre à jour'],
      ['le poste (éducateur vers coordinateur)', 'savoir rendre compte de son activité par écrit et par des indicateurs'],
      ['la structure (IME vers SESSAD)', 'savoir décrire les besoins d’une personne et les prestations apportées dans un langage commun'],
    ],
  ) +
  h4('Le test du changement') +
  p('Prenez une compétence de votre plan de transfert et posez-vous trois questions. Ce que vous pouvez garder à chaque fois, c’est la partie transférable ; ce que vous devez réapprendre, c’est la partie liée à l’outil.') +
  table(
    ['Si demain…', 'Je dois réapprendre', 'Je garde'],
    [
      ['<em>Exemple : mon service change de logiciel de dossier</em>', '<em>où cliquer, le nom des rubriques</em>', '<em>écrire une observation datée, factuelle, reliée à un objectif, au bon endroit</em>'],
      ['… mon service change de logiciel', '', ''],
      ['… je change de poste dans la structure', '', ''],
      ['… je travaille dans une autre structure du secteur', '', ''],
    ],
  ) +
  h3('Rendre transférable : documenter') +
  ul([
    '<strong>La fiche mémo</strong> de la journée 2 dit comment <em>vous</em> faites la tâche.',
    '<strong>La procédure d’équipe</strong> dit comment <em>l’équipe</em> la fait : quand, qui, comment, où sont les modèles, qui la tient à jour. Sa rédaction est décrite dans la leçon « Transfert au poste de travail » du bilan final ; on ne la répète pas ici.',
    '<strong>Le langage commun</strong> dit à quoi sert la tâche, dans des mots que toute structure du secteur comprend : ce sont les nomenclatures de la leçon suivante.',
  ]) +
  chrono(
    'réécrire trois traces',
    'dix minutes pour les trois traces',
    ol([
      'ESAT : « Atelier ok, Mehdi a bien bossé. »',
      'IME : « Crise de Jade au goûter, comme d’habitude. »',
      'EHPAD : « Mme R. pas contente aujourd’hui. »',
    ]) + pe('Réécrivez chacune (faits fictifs à inventer) pour qu’elle dise quoi, pour qui, quand, et en lien avec quel objectif, en cinq lignes au plus.'),
    'Même exercice, sans limite de temps. Vous pouvez n’en réécrire qu’une, en détail, et dire à l’oral ce que vous changeriez dans les deux autres.',
  ) +
  carte(
    'Exemple de correction (une réécriture possible parmi d’autres)',
    ul([
      '<strong>ESAT :</strong> « Lundi, atelier conditionnement, 9 h à 12 h : Mehdi a préparé seul les cartons de la commande en respectant l’ordre des étapes affiché. Objectif du projet : travailler sans rappel de consigne. Aucun rappel ce matin. »',
      '<strong>IME :</strong> « Mercredi, 16 h 10 : au goûter, Jade a crié et renversé son verre quand le groupe est entré. Retour au calme en cinq minutes environ, dans la salle voisine, avec l’éducatrice. Troisième fois cette semaine au même moment : à évoquer en réunion d’équipe. » (« comme d’habitude » est remplacé par un fait vérifiable.)',
      '<strong>EHPAD :</strong> « Mardi, 11 h : Mme R. a refusé la toilette en disant “pas maintenant, je suis fatiguée”. Toilette proposée de nouveau à 14 h, acceptée. » (ses mots entre guillemets, pas une interprétation.)',
    ]),
  ) +
  h3('Et le lien avec SERAFIN-PH') +
  p('Ce langage commun existe désormais dans le secteur du handicap : ce sont les nomenclatures SERAFIN-PH. Les connaître rend les compétences numériques directement utiles en emploi, et transférables d’une structure à l’autre.') +
  erreurs([
    'Confondre « je sais utiliser le logiciel » et « mes traces servent l’activité ».',
    'Écrire ce qu’on a ressenti au lieu de ce que la personne a fait.',
    'Garder sa méthode dans la tête : la compétence s’arrête quand on part en congé.',
    'Croire qu’une compétence transférable est liée à un logiciel précis.',
  ]) +
  aRetenir([
    'Une compétence est fonctionnelle quand elle sert une tâche réelle, laisse une trace exploitable et se reproduit par un autre.',
    'Une trace fonctionnelle dit quoi, pour qui, quand, en lien avec quel objectif, et la suite.',
    'Ce qui se transfère d’une structure à l’autre, c’est la méthode, pas l’outil.',
    'Les nomenclatures SERAFIN-PH donnent au secteur du handicap un langage commun pour décrire besoins et prestations.',
  ]) +
  transfert([
    'Dans la semaine : relisez vos cinq dernières traces au travail avec les trois conditions, et réécrivez la moins claire.',
    'Dans le mois : proposez à votre équipe une trame commune d’observation (date, objectif du projet, faits, décision, suite).',
  ]) +
  avantSuite([
    'vous savez vérifier les trois conditions d’une compétence fonctionnelle sur une trace de votre poste ;',
    'vous avez réécrit au moins une trace qui dit quoi, pour qui, quand et en lien avec quel objectif ;',
    'votre tableau « le test du changement » est rempli pour une compétence de votre plan de transfert.',
  ]);

const J3_SERAFIN =
  reperes('Repères de la leçon', [
    '<strong>Place dans la journée 3 :</strong> de 10 h 45 à 12 h 30.',
    '<strong>Objectif :</strong> comprendre ce qu’est SERAFIN-PH, pourquoi il concerne le quotidien numérique des professionnels, et relier ses propres écrits aux nomenclatures.',
    '<strong>Sources :</strong> CNSA, pages SERAFIN-PH, consultées le 28 septembre 2026. Le calendrier peut évoluer : vérifiez-le sur le site de la CNSA, qui publie aussi le détail des nomenclatures.',
    '<strong>Preuve produite :</strong> les activités de la mise en situation rattachées à un besoin et à une prestation.',
  ]) +
  objectifs([
    'explique en trois à cinq phrases le sigle, les objectifs et le calendrier annoncé de SERAFIN-PH, sans erreur de fait ;',
    'distingue un besoin d’une prestation sur chacun des exemples de la leçon ;',
    'rattache les activités de la mise en situation au bon domaine de la nomenclature des besoins et au bon domaine de la nomenclature des prestations ;',
    'cite ce qui relève de son rôle et ce qui relève de la direction.',
  ], 'la séquence') +
  h3('SERAFIN-PH en quelques mots') +
  p('SERAFIN-PH signifie « Services et établissements : réforme pour une adéquation des financements aux parcours des personnes handicapées ». C’est la réforme de la tarification des établissements et services médico-sociaux (ESMS) qui accompagnent des personnes en situation de handicap. Elle vise à relier le budget attribué aux caractéristiques des personnes accompagnées et aux modalités de leur accompagnement, à soutenir les parcours et à rendre le financement compréhensible par tous.') +
  table(
    ['Les objectifs affichés par la CNSA', 'Ce que cela veut dire concrètement'],
    [
      ['Des budgets plus équitables, qui relient le budget, les caractéristiques des personnes et les modalités d’accompagnement', 'deux structures qui accompagnent des personnes aux besoins comparables, de façon comparable, doivent pouvoir être financées selon les mêmes règles'],
      ['Soutenir les parcours des personnes', 'le financement ne doit pas freiner un accompagnement qui évolue avec la personne'],
      ['Une réforme compréhensible', 'un vocabulaire commun (les nomenclatures) pour décrire ce qui est fait et pour qui'],
    ],
  ) +
  h3('Où en est la réforme') +
  table(
    ['Période', 'Ce qui est prévu (selon la CNSA)'],
    [
      ['2026', 'année de préparation : un recueil d’informations ciblé auprès des ESMS pour enfants et jeunes adultes, sans effet sur les budgets'],
      ['À partir de 2027', 'déploiement progressif du nouveau modèle de financement, sur plusieurs années, en commençant par le secteur enfance et jeunesse'],
    ],
  ) +
  p('Le futur modèle repose sur une dotation composée d’une part socle (liée aux places), d’une part transports et d’une part de modulation liée à l’activité et aux objectifs.') +
  table(
    ['Part de la dotation', 'Ce qu’elle recouvre', 'Où la trace numérique compte'],
    [
      ['<strong>Part socle capacitaire</strong>', 'liée aux places de la structure', 'peu pour le professionnel : c’est une donnée de la structure'],
      ['<strong>Part transports</strong>', 'les transports des personnes accompagnées', 'les trajets doivent être connus : l’agenda et les plannings de transport tenus à jour'],
      ['<strong>Part de modulation</strong>', 'liée à l’activité et aux objectifs', 'l’activité réalisée doit pouvoir être décrite et vérifiée : c’est là que des traces exactes comptent le plus'],
    ],
  ) +
  pe('Le détail du calcul de chaque part n’est pas l’objet de cette formation ; il relève de la direction et des documents de la CNSA.') +
  h3('Les nomenclatures : un langage commun') +
  p('SERAFIN-PH s’appuie sur deux nomenclatures, qui décrivent les <strong>besoins</strong> des personnes et les <strong>prestations</strong> qui y répondent.') +
  table(
    ['Nomenclature', 'Grands domaines'],
    [
      ['<strong>Besoins</strong>', 'santé somatique ou psychique · autonomie · participation sociale'],
      ['<strong>Prestations directes</strong>', 'soins, maintien et développement des capacités fonctionnelles · autonomie · participation sociale'],
      ['<strong>Prestations indirectes</strong>', 'pilotage et fonctions support (gestion, logistique, organisation)'],
    ],
  ) +
  h3('Besoin ou prestation : ne pas confondre') +
  p('Le <strong>besoin</strong> décrit la personne : ce dont elle a besoin pour sa santé, son autonomie, sa participation à la vie sociale. La <strong>prestation</strong> décrit la structure : ce qu’elle fait pour y répondre. Une même activité se lit donc deux fois : du côté de la personne, et du côté de ce qui est apporté.') +
  table(
    ['Exemple (fictif)', 'Le besoin (la personne)', 'La prestation (la structure)'],
    [
      ['Apprendre à Lucas à s’habiller seul le matin, à l’internat de l’IME', 'autonomie', 'directe : autonomie'],
      ['Accompagner Maya à l’entraînement du club de basket du quartier', 'participation sociale', 'directe : participation sociale'],
      ['Séance avec la psychomotricienne du SESSAD', 'santé somatique ou psychique', 'directe : soins, maintien et développement des capacités fonctionnelles'],
      ['Préparer le planning de l’équipe de la semaine', 'aucun besoin d’une personne en particulier', 'indirecte : pilotage et fonctions support'],
    ],
  ) +
  p('Les prestations <strong>indirectes</strong> ne sont pas « moins importantes » : sans planning, sans logistique, sans outils, les prestations directes n’ont pas lieu. Elles se décrivent simplement autrement : elles servent l’ensemble des personnes, pas une en particulier.') +
  hr() +
  h3('Démonstration : rattacher un écrit') +
  p('Voici une observation fictive, saisie dans le DUI d’un IME, puis la façon de la lire avec les nomenclatures.') +
  encart('L’observation', pe('<em>« Vendredi, 10 h à 11 h, marché du quartier : Rayan a choisi deux fruits sur sa liste en images, les a demandés lui-même au marchand et a payé avec l’aide de l’éducateur pour le rendu de monnaie. Objectif du projet personnalisé travaillé : faire un achat simple dans un commerce. Suite : même sortie dans deux semaines, rendu de monnaie à travailler en classe. »</em>')) +
  table(
    ['Question', 'Réponse'],
    [
      ['À quel besoin de Rayan répond l’activité ?', 'participation sociale (vivre dans son quartier, faire un achat) ; l’autonomie est aussi travaillée (choisir, payer)'],
      ['Quelle prestation la structure apporte-t-elle ?', 'directe : participation sociale, principalement'],
      ['Qu’est-ce qui, dans la trace, permet de le voir ?', 'l’objectif du projet personnalisé écrit, ce que Rayan a fait lui-même, la durée'],
      ['Qu’est-ce qui manquerait si la trace disait seulement « marché avec Rayan, bien » ?', 'tout : ni besoin, ni prestation, ni durée ne seraient lisibles'],
    ],
  ) +
  p('Quand une activité touche deux domaines, on retient le domaine principal au regard de l’objectif écrit dans le projet personnalisé. Le rattachement officiel, lui, suit les règles fixées par la direction et les documents de la CNSA : votre rôle est d’écrire une trace qui permet ce rattachement.') +
  h3('Pourquoi c’est une affaire de compétences numériques') +
  ul([
    'l’activité d’une structure se lit dans ses traces écrites et dans son logiciel : ce qui n’est pas tracé ne se voit pas',
    'des écrits structurés (besoin, prestation, objectif, résultat) se rattachent facilement aux nomenclatures',
    'un tableau de suivi bien tenu alimente les indicateurs d’activité demandés à la structure',
    'la même méthode vaut dans n’importe quel ESMS : c’est la transférabilité de la compétence',
  ]) +
  h3('Ce que fait le professionnel, ce que fait la direction') +
  table(
    ['Le professionnel', 'La direction et les personnes qu’elle désigne'],
    [
      ['écrit des observations et des transmissions exactes, datées, reliées aux objectifs du projet personnalisé', 'définit l’organisation du recueil d’activité dans la structure'],
      ['tient à jour les tableaux de suivi et l’agenda', 'réalise le codage officiel de l’activité, s’il est demandé'],
      ['signale ce qui manque pour tracer (temps, droits d’accès, rubrique absente)', 'répond aux recueils, comme celui de 2026 auprès des ESMS pour enfants et jeunes adultes'],
      ['applique les règles de confidentialité à chaque trace', 'dialogue avec les autorités sur le budget'],
    ],
  ) +
  encart('Si votre structure n’accueille pas de personnes handicapées', pe('SERAFIN-PH concerne les établissements et services qui accompagnent des personnes handicapées. SERAFIN-PH concerne les établissements et services qui accompagnent des personnes en situation de handicap : une MECS (protection de l’enfance) ou un EHPAD (personnes âgées) relèvent d’autres modes de financement, vérifiez auprès de votre direction ; mais la méthode de cette journée (relier ce qu’on fait à un besoin de la personne, et en laisser une trace exacte) vaut partout. C’est précisément ce qui la rend transférable.')) +
  chrono(
    'rattacher sept activités',
    'dix minutes',
    ol([
      'Aider un jeune de l’internat à faire sa toilette et à s’habiller le matin.',
      'Accompagner un groupe de jeunes adultes à un atelier théâtre avec une troupe amateur de la ville.',
      'Séance de kinésithérapie avec le kinésithérapeute de l’établissement.',
      'Préparer le budget prévisionnel de l’unité.',
      'Faire réviser le minibus du service.',
      'Accompagner un jeune adulte dans une démarche pour faire valoir ses droits auprès d’une administration.',
      'Préparer avec un adolescent son premier stage d’observation en entreprise.',
    ]) + pe('Pour chacune : quel besoin (ou aucun), et quelle prestation (directe, avec son domaine, ou indirecte) ?'),
    'Même exercice, sans limite de temps, en binôme si vous le souhaitez. Vous pouvez aussi ne traiter que quatre activités, dont au moins une indirecte.',
  ) +
  carte(
    'Correction',
    table(
      ['N°', 'Besoin', 'Prestation'],
      [
        ['1', 'autonomie', 'directe : autonomie'],
        ['2', 'participation sociale', 'directe : participation sociale'],
        ['3', 'santé somatique ou psychique', 'directe : soins, maintien et développement des capacités fonctionnelles'],
        ['4', 'aucun besoin d’une personne en particulier', 'indirecte : pilotage et fonctions support'],
        ['5', 'aucun besoin d’une personne en particulier', 'indirecte : fonctions support (logistique)'],
        ['6', 'participation sociale', 'directe : participation sociale'],
        ['7', 'participation sociale', 'directe : participation sociale'],
      ],
    ) + pe('Ces rattachements se font au niveau des grands domaines. Le détail de chaque nomenclature (les sous-parties de chaque domaine) est publié par la CNSA : c’est la référence à consulter en cas de doute, avec la direction.'),
  ) +
  alerte('Rester dans son rôle', pe('Le codage officiel de l’activité et les réponses aux recueils relèvent de la direction et des personnes désignées par la structure. Le professionnel, lui, produit des écrits et des saisies exacts, complets et structurés : c’est ce qui rend le reste possible. Aucune donnée réelle dans les exercices de la formation.')) +
  erreurs([
    'Confondre SERAFIN-PH avec un logiciel ou avec une évaluation des professionnels.',
    'Annoncer des effets financiers ou des dates que la CNSA n’a pas publiés.',
    'Confondre besoin (la personne) et prestation (la structure).',
    'Oublier les prestations indirectes, qui rendent les autres possibles.',
    'Coder soi-même l’activité au lieu d’écrire une trace exacte.',
  ]) +
  aRetenir([
    'SERAFIN-PH : la réforme de la tarification des ESMS pour personnes handicapées ; 2026 est une année de préparation, sans effet financier ; le déploiement progressif est annoncé à partir de 2027, en commençant par l’enfance et la jeunesse.',
    'La future dotation : une part socle capacitaire, une part transports, une part de modulation liée à l’activité et aux objectifs.',
    'Besoins : santé somatique ou psychique, autonomie, participation sociale. Prestations directes : soins et capacités fonctionnelles, autonomie, participation sociale. Prestations indirectes : pilotage et fonctions support.',
    'Le professionnel écrit des traces exactes ; la direction code et répond aux recueils. Le détail est sur le site de la CNSA.',
  ]) +
  avantSuite([
    'vous expliquez SERAFIN-PH en trois à cinq phrases, sans rien ajouter à ce que publie la CNSA ;',
    'vous rattachez correctement au moins cinq des sept activités de la mise en situation ;',
    'vous savez dire ce qui relève de votre rôle et ce qui relève de la direction.',
  ]);

// ─── J3 · Cas pratique corrigé et quiz ───────────────────────────────────────
const QUIZ_J3 = [
  {
    q: 'Qu’est-ce que SERAFIN-PH ?',
    o: [
      'Un logiciel de dossier usager que les ESMS devront tous utiliser.',
      'Une grille d’évaluation individuelle des professionnels du médico-social.',
      'Un référentiel des diplômes du travail social.',
      'La réforme de la tarification des établissements et services pour personnes handicapées, qui relie les financements aux besoins des personnes et aux modalités d’accompagnement.',
    ],
    r: 'D',
    pourquoi: 'SERAFIN-PH signifie « Services et établissements : réforme pour une adéquation des financements aux parcours des personnes handicapées ». C’est une réforme du financement, qui s’appuie sur des nomenclatures de besoins et de prestations.',
    autres: 'A confond la réforme et les outils qui servent à tracer l’activité : SERAFIN-PH n’impose pas de logiciel. B est une crainte fréquente, mais la réforme décrit des besoins et des prestations, pas la valeur des professionnels. C n’a aucun lien avec la réforme.',
  },
  {
    q: 'Selon la CNSA, qu’est-ce qui est prévu en 2026 ?',
    o: [
      'Les budgets des ESMS sont déjà calculés avec le nouveau modèle.',
      'Une année de préparation, avec un recueil ciblé auprès des ESMS pour enfants et jeunes adultes, sans effet financier.',
      'L’abandon de la réforme.',
      'L’application du nouveau modèle aux seuls ESMS pour adultes.',
    ],
    r: 'B',
    pourquoi: 'c’est le calendrier publié par la CNSA : 2026 prépare le déploiement, qui est annoncé progressif à partir de 2027, sur plusieurs années.',
    autres: 'A anticipe à tort : 2026 est sans effet sur les budgets. C est faux. D inverse l’ordre annoncé : le déploiement commence par l’enfance et la jeunesse.',
  },
  {
    q: 'Un éducateur d’IME accompagne trois jeunes à la médiathèque du quartier pour emprunter un livre et échanger avec la bibliothécaire. À quel besoin et à quelle prestation l’activité se rattache-t-elle principalement ?',
    o: [
      'Besoin : autonomie ; prestation : soins, maintien et développement des capacités fonctionnelles.',
      'Besoin : santé somatique ou psychique ; prestation indirecte.',
      'Besoin : participation sociale ; prestation directe : participation sociale.',
      'Aucun : c’est un loisir, cela ne se trace pas.',
    ],
    r: 'C',
    pourquoi: 'vivre dans la cité, fréquenter un lieu public, entrer en relation avec d’autres personnes : c’est la participation sociale, du côté du besoin comme de la prestation.',
    autres: 'A mélange deux domaines sans lien avec l’objectif de l’activité. B confond : aucune dimension de santé ici, et la prestation apportée à ces jeunes est directe. D est une erreur fréquente : une activité de loisir travaillée dans le cadre du projet personnalisé est une prestation, et elle se trace comme les autres.',
  },
  {
    q: 'Dans une structure, qui réalise le codage officiel de l’activité et répond aux recueils SERAFIN-PH ?',
    o: [
      'La direction et les personnes qu’elle désigne ; les professionnels produisent des écrits et des saisies exacts et structurés.',
      'Chaque éducateur, qui code ses propres actes dans le DUI.',
      'L’organisme de formation, à partir des devoirs des participants.',
      'Les familles des personnes accompagnées.',
    ],
    r: 'A',
    pourquoi: 'le codage et les recueils relèvent de la direction. Le rôle du professionnel est ce qui rend ce travail possible : des traces exactes, datées, reliées aux objectifs.',
    autres: 'B attribue au professionnel une tâche qui n’est pas la sienne, et fait courir le risque de codes inexacts. C est faux : la formation n’a accès à aucune donnée réelle et ne produit aucun codage. D n’a aucun fondement.',
  },
  {
    q: 'Laquelle de ces traces est la plus utile ?',
    o: [
      '« Bonne journée pour Lina. »',
      '« Lina a été agitée, sans doute à cause de son traitement. »',
      '« Lina, 9 ans, qui habite rue des Lilas, a fait l’atelier. »',
      '« Mardi, 9 h 10 : Lina a choisi seule son activité sur l’emploi du temps visuel (objectif du projet personnalisé : faire un choix entre deux propositions). Une aide verbale. »',
    ],
    r: 'D',
    pourquoi: 'elle dit quoi, pour qui, quand, en lien avec quel objectif, et le niveau d’aide. On peut la relier à un besoin (autonomie) et à une prestation, et un collègue peut la poursuivre.',
    autres: 'A est une impression, sans fait. B mêle une interprétation et une hypothèse de santé, qui n’a pas sa place sous la plume de l’éducateur dans une observation d’activité. C ajoute des données personnelles inutiles (âge, adresse) et ne dit rien de ce que Lina a fait.',
  },
  {
    q: 'Selon la CNSA, comment se compose la future dotation des ESMS concernés ?',
    o: [
      'Un prix de journée unique par place.',
      'Une part socle capacitaire, une part transports et une part de modulation liée à l’activité et aux objectifs.',
      'Un paiement à l’acte, pour chaque prestation codée.',
      'Un montant fixé selon le nombre de professionnels diplômés.',
    ],
    r: 'B',
    pourquoi: 'c’est la composition annoncée par la CNSA. La part de modulation est celle où la description exacte de l’activité compte le plus.',
    autres: 'A ne correspond pas au modèle annoncé, qui compte trois parts. C est une confusion fréquente : la modulation est liée à l’activité et aux objectifs au sein d’une dotation, ce n’est pas un paiement acte par acte. D n’est pas un critère annoncé par la CNSA.',
  },
];

const J3_CAS =
  reperes('Repères de la leçon', [
    '<strong>Place dans la journée 3 :</strong> de 13 h 30 à 15 h 00.',
    '<strong>Objectif :</strong> relier une journée entière de travail aux nomenclatures SERAFIN-PH, et réécrire les traces numériques qui la prouvent.',
    '<strong>Modalité :</strong> travail individuel ou en binôme, puis correction commentée en groupe ; quiz d’autocorrection de six questions, non noté.',
    '<strong>Preuve produite :</strong> le tableau des six activités rattachées et les traces réécrites ; vos réponses au quiz.',
  ]) +
  objectifs([
    'rattache au moins cinq des six activités de la journée de Karim au bon domaine de besoin et au bon domaine de prestation (directe ou indirecte) ;',
    'réécrit les six traces brutes pour qu’elles disent quoi, pour qui, quand, en lien avec quel objectif, dans le bon outil et à la bonne rubrique ;',
    'repère les deux traces qui posent un problème de confidentialité, et dit ce qui ne relève pas du rôle de Karim ;',
    'répond aux six questions du quiz, puis explique chacune de ses erreurs à l’aide des réponses commentées.',
  ]) +
  casPratique(
    'la journée de Karim, éducateur spécialisé en IME',
    pe('Karim est éducateur spécialisé dans un IME (personne, jeunes et situations fictifs). Voici sa journée de mardi, et ce qu’il en a gardé comme traces, en fin de journée, à la va-vite.') +
      table(
        ['Heure', 'Activité', 'Trace brute laissée par Karim'],
        [
          ['9 h 00', 'Accueil du groupe. Avec Lina, travail sur l’emploi du temps visuel : se repérer dans la journée et choisir une activité parmi deux.', 'DUI : « Lina ok ce matin. »'],
          ['10 h 00', 'Sortie à pied à la médiathèque du quartier avec Noé, Sofia et Adam : emprunter un livre, attendre son tour, saluer la bibliothécaire.', 'Tableau de suivi des ateliers : « Médiathèque super, tous contents. »'],
          ['11 h 45', 'Repas : Noé travaille à se servir seul et à couper sa viande, objectif de son projet personnalisé.', 'Rien.'],
          ['13 h 30', 'Accompagnement d’Adam, en véhicule de service, à un rendez-vous médical de suivi prévu dans son projet ; retour d’information à l’infirmière de l’IME.', 'Tableau de suivi des ateliers, visible par toute l’équipe et les stagiaires : « Adam RDV médecin, traitement changé, très angoissé à cause de sa maladie. »'],
          ['15 h 00', 'Temps d’inclusion de Sofia dans une classe de l’école voisine ; point de dix minutes avec l’enseignante.', 'SMS depuis son téléphone personnel à l’enseignante : « Sofia a été top ce aprem, bisous à la classe. »'],
          ['16 h 15', 'Saisie des observations, mise à jour du tableau de suivi des ateliers, ordre du jour de la réunion d’équipe du lendemain.', '« Fait. »'],
        ],
      ),
    ol([
      'Pour chaque activité, indiquez le besoin (domaine de la nomenclature des besoins) auquel elle répond, ou « aucun besoin d’une personne en particulier ».',
      'Indiquez la prestation : directe (avec son domaine) ou indirecte.',
      'Dites quelle trace numérique devrait la prouver (outil, rubrique, qui peut la consulter), et réécrivez la trace brute.',
      'Repérez les traces qui posent un problème de confidentialité, et ce qui ne relève pas du rôle de Karim.',
    ]),
    tf(['Activité, besoin et prestation', 'Trace corrigée (outil et contenu)'], (r) => [`<strong>${r[0]}</strong><br><em>Besoin :</em> ${r[1]}<br><em>Prestation :</em> ${r[2]}`, r[3]],
      [
        ['9 h 00', 'autonomie (se repérer, faire des choix)', 'directe : autonomie', 'DUI, observations de Lina : « Mardi, 9 h 10 : Lina a choisi seule son activité sur l’emploi du temps visuel (objectif du projet personnalisé : faire un choix entre deux propositions). Une aide verbale. »'],
        ['10 h 00', 'participation sociale (vie dans le quartier, relations avec d’autres personnes)', 'directe : participation sociale', 'Tableau de suivi des ateliers : date, « médiathèque », identifiants des trois jeunes, 10 h à 11 h 15, objectif travaillé. Dans le DUI de chacun, une ligne si l’objectif figure à son projet : « Sofia a demandé elle-même le livre à la bibliothécaire. »'],
        ['11 h 45', 'autonomie (s’alimenter seul)', 'directe : autonomie', 'DUI, observations de Noé : « Repas : s’est servi seul l’entrée et le plat ; a coupé sa viande avec une aide physique pour les premiers morceaux. Objectif : se servir seul. »'],
        ['13 h 30', 'santé somatique ou psychique', 'directe : soins, maintien et développement des capacités fonctionnelles, pour ce qui relève du suivi de santé (Karim ne soigne pas : il accompagne et transmet) ; le trajet relève des fonctions support (logistique), et la future dotation prévoit une part transports', 'Agenda du service : rendez-vous, accompagnant, véhicule, horaires de départ et de retour. DUI, rubrique réservée aux professionnels habilités : « Rendez-vous de suivi réalisé ; document remis à l’infirmière à 16 h. » Rien sur la santé d’Adam dans le tableau des ateliers.'],
        ['15 h 00', 'participation sociale (scolarité)', 'directe : participation sociale', 'Outil de liaison prévu avec l’école, ou messagerie de la structure : « 15 h à 15 h 45 : Sofia a participé à la séance de lecture ; a levé la main une fois pour répondre. Prochaine séance jeudi. » Seulement ce qui est utile à l’école, dans le cadre convenu avec les parents.'],
        ['16 h 15', 'aucun besoin d’une personne en particulier', 'indirecte : pilotage et fonctions support', 'Les saisies elles-mêmes, et l’ordre du jour rangé dans l’espace partagé selon la convention de l’équipe. Si la structure organise un relevé des temps, c’est elle qui en fixe la forme.'],
      ],
    ) +
      h4('Les deux problèmes de confidentialité') +
      ul([
        '<strong>13 h 30 :</strong> une information de santé (le traitement) et une interprétation (« angoissé à cause de sa maladie ») dans un tableau que voient toute l’équipe et les stagiaires. La santé est une donnée sensible : elle va seulement dans la rubrique prévue, accessible aux personnes habilitées, et l’éducateur n’écrit pas d’hypothèse sur la maladie. S’il a observé quelque chose d’utile, il écrit le fait : « a demandé plusieurs fois l’heure du retour pendant le trajet ».',
        '<strong>15 h 00 :</strong> un SMS depuis un téléphone personnel, avec le prénom de Sofia, hors des outils de la structure. On passe par l’outil de liaison prévu ou par la messagerie de la structure, et on écrit une information utile, pas une appréciation.',
      ]) +
      h4('Ce qui ne relève pas du rôle de Karim') +
      p('Karim n’inscrit aucun code de nomenclature dans ses traces, et il ne répond pas lui-même au recueil de 2026. Son travail est d’écrire des traces qui permettent à la direction de décrire l’activité sans les réinterpréter. Le tableau ci-dessus est un exercice de compréhension, pas un modèle de codage.') +
      h4('Ce qui resterait valable si Karim changeait de structure') +
      p('S’il partait demain en SESSAD, Karim changerait de logiciel, de rubriques et de public. Il garderait sa méthode : relier chaque activité à un objectif du projet personnalisé, écrire des faits datés, mettre chaque information dans le bon outil pour les bonnes personnes, et savoir lire son activité en besoins et en prestations.'),
    'L’activité de 13 h 30 est la plus discutable du cas, et c’est voulu : la façon exacte de rattacher un accompagnement à un rendez-vous de soins se vérifie dans les documents publiés par la CNSA et relève de la direction. Ce qu’on attend du professionnel ne change pas : une trace exacte (qui, quoi, quand, durée, trajet), au bon endroit, sans information de santé là où elle n’a pas à être. Remarquez aussi que l’activité de 11 h 45, sans aucune trace au départ, n’existait pas pour la structure : ce qui n’est pas tracé ne se voit pas.',
  ) +
  erreurs([
    'Rattacher l’activité à l’outil utilisé (« c’est du DUI ») au lieu du besoin de la personne.',
    'Oublier l’activité de 16 h 15 parce qu’elle « ne concerne pas les jeunes » : c’est une prestation indirecte.',
    'Corriger la forme d’une trace sans voir qu’elle est dans le mauvais outil.',
    'Écrire le code d’une nomenclature dans le DUI « pour aider la direction ».',
  ]) +
  quizQuestions(QUIZ_J3) +
  avantSuite([
    'vous avez rattaché au moins cinq des six activités de Karim au bon besoin et à la bonne prestation ;',
    'vos six traces réécrites disent quoi, pour qui, quand, en lien avec quel objectif, et sont dans le bon outil ;',
    'vous avez répondu aux six questions avant de lire les réponses, et relu la leçon SERAFIN-PH pour chaque réponse fausse.',
  ]) +
  quizReponses(QUIZ_J3);

const J3_DEVOIR =
  p('<strong>À rendre à la fin de la journée 3.</strong> Cartographiez votre activité avec les nomenclatures SERAFIN-PH, à partir d’exemples fictifs, sur le modèle du tableau corrigé de la journée de Karim :') +
  h4('Les livrables') +
  ul([
    'trois activités que vous réalisez régulièrement, décrites en une phrase (dont au moins une prestation indirecte si votre poste en comporte)',
    'pour chacune : le besoin de la personne auquel elle répond (domaine de la nomenclature des besoins) et la prestation qu’elle représente (domaine de la nomenclature des prestations)',
    'la trace numérique qui prouve l’activité : outil utilisé, écrit ou saisie, et qui peut la consulter ; avec un exemple de trace fictive rédigée',
    'une amélioration de votre façon de tracer, et la compétence numérique qu’elle mobilise',
    'ce qui resterait valable si vous changiez de structure ou de logiciel',
  ]) +
  h4('Les critères de réussite') +
  ul([
    'chaque activité est rattachée au bon domaine de besoin et au bon domaine de prestation ;',
    'chaque trace fictive dit quoi, pour qui, quand, en lien avec quel objectif, sans jugement ;',
    'aucun code de nomenclature n’est inventé, et rien n’est ajouté aux informations publiées par la CNSA ;',
    'aucune donnée réelle sur une personne accompagnée.',
  ]) +
  p('Format accepté : un tableau ou un document. Si vous travaillez dans une structure qui n’accueille pas de personnes handicapées (MECS, EHPAD…), faites le même exercice : la méthode est la même, et c’est ce qui est évalué. Ce devoir valide la journée 3 ; la suite du parcours est le bilan final.') +
  grille([
    'les trois activités sont correctement rattachées aux domaines des deux nomenclatures ;',
    'chaque trace est dans le bon outil, lisible par les seules personnes qui en ont besoin ;',
    'la partie « ce qui resterait valable » décrit une méthode, pas un logiciel ;',
    'aucune donnée réelle, aucune information de santé hors de la rubrique prévue.',
  ]);

// ═══════════════════════════ EXPORT ═══════════════════════════

module.exports = {
  update: {
    j1eval: { html: J1_EVAL, min: 45 },
    j1transfert: { html: J1_TRANSFERT, min: 90 },
    j1blocages: { html: J1_BLOCAGES, min: 45 },
    j1rgpd: { html: J1_RGPD, min: 30 },
    j1bilan: { html: J1_BILAN, min: 20 },
    j1devoir: { html: J1_DEVOIR, min: 30 },
    j2transfert: { html: J2_TRANSFERT, min: 225 },
    j2module: { html: J2_MODULE, min: 45 },
    j2devoir: { html: J2_DEVOIR, min: 35 },
    j3emploi: { html: J3_EMPLOI, min: 60 },
    j3serafin: { html: J3_SERAFIN, min: 105 },
    j3devoir: { html: J3_DEVOIR, min: 75 },
  },
  nouveaux: [
    { key: 'j1programme', section: 'J1', position: 'debut', type: 'GENERIC', name: 'Programme de la journée 1 : déroulé, objectifs et évaluation', html: J1_PROGRAMME, min: 15 },
    { key: 'j1cas', section: 'J1', position: 'avant-devoir', type: 'GENERIC', name: 'Cas pratique corrigé et quiz de la journée 1', html: J1_CAS, min: 30 },
    { key: 'j2programme', section: 'J2', position: 'debut', type: 'GENERIC', name: 'Programme de la journée 2 : déroulé, objectifs et évaluation', html: J2_PROGRAMME, min: 15 },
    { key: 'j2cas', section: 'J2', position: 'avant-devoir', type: 'GENERIC', name: 'Cas pratique corrigé et quiz de la journée 2', html: J2_CAS, min: 45 },
    { key: 'j3programme', section: 'J3', position: 'debut', type: 'GENERIC', name: 'Programme de la journée 3 : déroulé, objectifs et évaluation', html: J3_PROGRAMME, min: 15 },
    { key: 'j3cas', section: 'J3', position: 'avant-devoir', type: 'GENERIC', name: 'Cas pratique corrigé et quiz de la journée 3', html: J3_CAS, min: 90 },
  ],
  noms: {
    J1: 'Formation journée 1 (niveau 1) : évaluer ses compétences numériques et construire son parcours à la carte',
    J2: 'Formation journée 2 (niveau 2) : transférer ses acquis et en acquérir de nouveaux',
    J3: 'Formation journée 3 (niveau 3) : compétences fonctionnelles en emploi et SERAFIN-PH (après la journée 2)',
  },
};
