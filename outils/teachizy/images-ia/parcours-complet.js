// Formation originale d'ADéPA : les chapitres qui complètent « Créer des images
// avec l'IA » pour en faire un parcours entier : bases, vidéos, avatars, montage
// et son, publication et monétisation. Écrit le 28/09/2026.
// ⚠ Ce n'est PAS une copie : la demande de départ visait une formation d'une
// communauté payante (Skool) dont Siham est membre. On n'a relevé que les
// INTITULÉS de ses chapitres pour couvrir les mêmes sujets ; tous les textes,
// exemples et exercices sont à nous.
// Règles maison : aucun tiret cadratin, « attestation » et jamais l'autre mot,
// aucun prix, aucune promesse de revenu, exemples et personnages fictifs.
const { h3, h4, p, ul, ol, hr, table, carte, encart, alerte, pe } = require('../accompagnement-numerique/h');

const LETTRES = ['A', 'B', 'C', 'D'];
const quiz = (qs) =>
  hr() + h3('Quiz d’autocorrection') + p('Répondez avant de lire les réponses, regroupées en bas. Le quiz n’est pas noté.') +
  qs.map((q, i) => h4(`Question ${i + 1}`) + p(q.q) + ul(q.o.map((o, j) => `<strong>${LETTRES[j]}.</strong> ${o}`))).join('') +
  hr() + h3('Réponses et explications') +
  qs.map((q, i) => carte(`Question ${i + 1} : réponse ${q.r}`, pe(q.pourquoi), '14px 0')).join('');
const reperes = (items) => carte('Repères de la leçon', ul(items), '0 0 26px');
const aRetenir = (items) => carte('À retenir', ul(items));
const exercice = (titre, duree, etapes, reussi) =>
  hr() + h3(`Exercice : ${titre}`) + pe(`<strong>Durée :</strong> ${duree}.`) + ol(etapes) + encart('C’est réussi quand', ul(reussi));

/* ================================================================== */
/* CHAPITRE 0 · INTRODUCTION ET BASES                                  */
/* ================================================================== */
const BASES = {
  nom: 'Introduction · Les bases de l’IA générative',
  lecons: [
    {
      nom: 'Leçon · Le parcours, et ce que vous saurez faire à la fin',
      min: 10,
      html:
        reperes(['Durée : 10 minutes', 'Production : votre objectif écrit en une phrase']) +
        h3('À qui s’adresse ce parcours') +
        p('À toute personne qui veut produire des contenus visuels avec l’intelligence artificielle sans être graphiste ni vidéaste : jeunes créateurs, bénévoles d’association, salariés d’un organisme, indépendants qui gèrent leurs propres réseaux. Aucun prérequis technique. Il faut un ordinateur ou un téléphone, une connexion, et un compte sur un ou deux outils gratuits.') +
        h3('Le fil du parcours') +
        table(
          ['Chapitre', 'Ce que vous apprenez', 'Ce que vous produisez'],
          [
            ['Bases', 'comment fonctionne un modèle, comment lui parler, ce qu’on a le droit de faire', 'votre charte d’usage'],
            ['Images', 'générer, retoucher, garder un personnage, décrire ses images', 'une campagne visuelle'],
            ['Vidéos', 'passer de l’image au mouvement, écrire un plan, tenir la cohérence', 'un clip de 20 à 30 secondes'],
            ['Avatars et voix', 'un présentateur généré, une voix de synthèse, les règles de transparence', 'une vidéo face caméra sans caméra'],
            ['Montage, son et effets', 'rythmer, sous-titrer, habiller, mixer', 'une vidéo verticale prête à publier'],
            ['Publier et monétiser', 'formats qui retiennent, séries, affiliation et partenariats, cadre légal', 'une série de cinq vidéos et un plan de diffusion'],
          ],
        ) +
        h3('La méthode, la même du début à la fin') +
        ol([
          '<strong>Décrire</strong> ce qu’on veut avec précision : sujet, style, cadrage, lumière, format.',
          '<strong>Corriger</strong> par petites touches, une chose à la fois, plutôt que de tout recommencer.',
          '<strong>Garder une cohérence</strong> : un personnage, une palette, une voix, d’un contenu à l’autre.',
          '<strong>Respecter les règles</strong> : droit à l’image, mention du contenu généré, données personnelles.',
        ]) +
        alerte('Ce que ce parcours ne promet pas', p('Aucun chiffre de vues ni de revenu. Les outils changent tous les mois, les plateformes aussi. Ce qui reste, c’est une méthode de travail et des contenus qui vous appartiennent. À la fin, une attestation de suivi peut être demandée ; elle n’est ni un diplôme ni une certification professionnelle.')) +
        exercice('Votre objectif en une phrase', '5 minutes', [
          'Écrivez pour qui vous créez (une association, un projet personnel, un client fictif pour vous entraîner).',
          'Écrivez le premier contenu que vous voulez publier à la fin du parcours (une affiche, un clip, une série).',
          'Gardez cette phrase : chaque exercice y renvoie.',
        ], ['votre phrase tient en une ligne et nomme un public et un format.']) +
        aRetenir(['Une méthode en quatre gestes : décrire, corriger, garder la cohérence, respecter les règles.', 'Les outils passent, la méthode reste.']),
    },
    {
      nom: 'Leçon · Comment fonctionne un modèle génératif, sans jargon',
      min: 20,
      html:
        reperes(['Durée : 20 minutes', 'Production : trois consignes réécrites']) +
        h3('Un modèle prédit, il ne comprend pas') +
        p('Un modèle de langage a lu d’énormes quantités de textes ; un modèle d’image a vu des millions d’images accompagnées de descriptions. Quand vous écrivez une consigne, le modèle produit la suite la plus plausible : le mot suivant, ou l’image qui correspond le mieux à vos mots. Il ne vérifie rien, il n’a pas d’intention, il ne « sait » pas ce qu’il fait. C’est ce qui explique ses forces (rapidité, variété) et ses faiblesses (inventions, erreurs de détail, biais).') +
        h3('Les trois familles d’outils que vous allez croiser') +
        table(
          ['Famille', 'Vous donnez', 'Vous recevez', 'Exemples de tâches'],
          [
            ['Texte', 'une consigne écrite', 'du texte', 'idées, scripts, légendes, plans de tournage'],
            ['Image', 'une consigne, parfois une image', 'une image', 'affiche, visuel de post, décor, personnage'],
            ['Vidéo et voix', 'une consigne, une image ou un texte à lire', 'une vidéo ou un son', 'clip court, avatar qui parle, voix off'],
          ],
        ) +
        h3('Ce qu’il faut savoir sur ses erreurs') +
        ul([
          '<strong>Il invente avec assurance</strong> : une date, une citation, un nom de loi. Tout fait énoncé se vérifie ailleurs.',
          '<strong>Il lisse</strong> : sans consigne, il produit la version la plus moyenne, la plus attendue.',
          '<strong>Il reproduit des stéréotypes</strong> présents dans ses données : demandez explicitement la diversité que vous voulez montrer.',
          '<strong>Il ne connaît pas votre contexte</strong> : ce que vous ne dites pas, il le devine, souvent mal.',
        ]) +
        h3('Parler à un modèle : la consigne en cinq parties') +
        table(
          ['Partie', 'Question à se poser', 'Exemple'],
          [
            ['Rôle', 'qui doit-il être ?', '« Tu es rédacteur pour une association de quartier »'],
            ['Tâche', 'que doit-il produire ?', '« Écris trois accroches pour un atelier vidéo gratuit »'],
            ['Contexte', 'ce qu’il ignore', '« Public : jeunes de 16 à 25 ans, ton direct, tutoiement »'],
            ['Contraintes', 'longueur, format, interdits', '« 12 mots au plus, pas de point d’exclamation »'],
            ['Exemple', 'un modèle de ce qu’on aime', '« Dans l’esprit de : “Ton téléphone est un studio” »'],
          ],
        ) +
        exercice('Réécrire trois consignes', '10 minutes', [
          'Prenez trois demandes vagues (« fais-moi une affiche », « écris un post », « propose des idées »).',
          'Réécrivez chacune avec les cinq parties.',
          'Envoyez la version vague puis la version complète à un outil de texte, et comparez.',
        ], ['la version complète donne un résultat que vous pourriez publier après une relecture ;', 'vous savez dire ce qui manquait à la version vague.']) +
        quiz([
          { q: 'Un modèle génératif produit…', o: ['la vérité vérifiée', 'la suite la plus plausible de votre consigne', 'toujours la même réponse', 'une copie d’une image existante'], r: 'B', pourquoi: 'Il prédit ce qui est probable à partir de ce qu’il a appris ; il ne vérifie rien et ne copie pas une image précise.' },
          { q: 'Une date citée par un modèle…', o: ['est fiable si elle est précise', 'se vérifie toujours ailleurs', 'est fausse par principe', 'n’a pas d’importance'], r: 'B', pourquoi: 'L’assurance du modèle ne prouve rien : un fait s’appuie sur une source.' },
        ]) +
        aRetenir(['Le modèle prédit, vous vérifiez.', 'Rôle, tâche, contexte, contraintes, exemple : une consigne complète change tout.']),
    },
    {
      nom: 'Leçon · Le cadre : droits, transparence et données',
      min: 20,
      html:
        reperes(['Durée : 20 minutes', 'Production : votre charte d’usage en dix lignes']) +
        h3('Quatre questions avant de publier') +
        table(
          ['Question', 'Pourquoi elle compte', 'Ce qu’on fait'],
          [
            ['Qui apparaît ?', 'une personne réelle a un droit à l’image ; un mineur, une autorisation de ses responsables', 'personnages fictifs, ou autorisation écrite'],
            ['D’où vient l’image de départ ?', 'une photo trouvée en ligne appartient à quelqu’un', 'ses propres photos, ou des images sous licence claire'],
            ['Est-ce présenté comme réel ?', 'un contenu généré qui imite le réel peut tromper', 'mention visible « image générée par IA » quand il y a doute'],
            ['Qu’ai-je transmis à l’outil ?', 'ce qui est envoyé peut être conservé et réutilisé', 'jamais de données personnelles d’autrui, de documents internes ni de visages sans accord'],
          ],
        ) +
        h3('Ce que dit le cadre européen, en une minute') +
        p('Le règlement européen sur l’intelligence artificielle prévoit une obligation de transparence : les contenus générés ou manipulés par une IA qui ressemblent à des personnes, des lieux ou des événements réels doivent être signalés comme tels, et les hypertrucages (deepfakes) en particulier. Le RGPD s’applique dès qu’une personne est identifiable : une voix, un visage, un nom. Le droit d’auteur, lui, reste discuté pour les images générées ; ce qui est certain, c’est que copier le style d’un artiste vivant en le nommant, ou réutiliser une œuvre existante, expose à un litige.') +
        alerte('Trois interdits nets', ul([
          'faire dire à une personne réelle ce qu’elle n’a pas dit (voix ou vidéo) ;',
          'utiliser l’image d’un enfant sans autorisation de ses responsables légaux ;',
          'présenter comme une photo réelle une scène générée qui pourrait tromper (un événement, une preuve).',
        ])) +
        h3('La mention, comment la rédiger') +
        ul([
          'Sur une image : « Visuel généré avec une IA » en légende ou dans l’image, lisible.',
          'Sur une vidéo : une ligne au début ou dans la description, et le hashtag de la plateforme s’il existe.',
          'Sur un avatar : « Présentateur généré par IA, voix de synthèse » dans la description.',
        ]) +
        exercice('Votre charte d’usage', '10 minutes', [
          'Listez ce que vous vous autorisez (personnages fictifs, vos propres photos, images sous licence).',
          'Listez ce que vous vous interdisez (les trois interdits, plus les vôtres).',
          'Écrivez la phrase de mention que vous utiliserez, et où elle ira.',
          'Gardez cette charte dans le dossier partagé de votre structure.',
        ], ['une personne extérieure pourrait l’appliquer sans vous poser de question.']) +
        aRetenir(['Fictif, autorisé, ou sous licence : il n’y a pas de quatrième cas.', 'La mention « généré par IA » protège le public et vous protège.']),
    },
  ],
};

/* ================================================================== */
/* CHAPITRE 3 · VIDÉOS                                                 */
/* ================================================================== */
const VIDEOS = {
  nom: 'Chapitre · Créer des vidéos avec l’IA',
  lecons: [
    {
      nom: 'Leçon · Panorama des générateurs de vidéo, et ce qu’ils savent faire',
      min: 15,
      html:
        reperes(['Durée : 15 minutes', 'Production : un tableau de trois outils testés']) +
        h3('Deux façons de générer une vidéo') +
        ul([
          '<strong>Du texte à la vidéo</strong> : on décrit la scène, l’outil invente tout. Rapide, mais peu contrôlable.',
          '<strong>De l’image à la vidéo</strong> : on part d’une image que l’on maîtrise (celle du chapitre Images) et on décrit le mouvement. C’est la voie que ce parcours privilégie : la cohérence se gagne à l’image fixe.',
        ]) +
        h3('Les outils du moment, par famille') +
        table(
          ['Outil', 'Point fort', 'Limites courantes'],
          [
            ['Veo (Google)', 'mouvement naturel, son généré avec l’image', 'accès selon l’offre, durée courte'],
            ['Sora (OpenAI)', 'scènes complexes, remix d’une vidéo', 'file d’attente, résultats variables'],
            ['Kling', 'image vers vidéo fidèle, personnages', 'interface parfois en anglais ou en chinois'],
            ['Runway', 'outils de retouche et de contrôle de caméra', 'crédits consommés vite'],
            ['Pika, Luma', 'simplicité, effets', 'moins de contrôle fin'],
          ],
        ) +
        alerte('Un tableau qui vieillit vite', p('Les noms changent, les durées s’allongent, les prix bougent. Ce qui compte : savoir ce que vous voulez contrôler (le mouvement, la caméra, la durée, le son) et tester deux outils sur la même image avant d’en choisir un.')) +
        h3('Ce que toute vidéo générée a en commun') +
        ul([
          'des plans courts : 5 à 10 secondes, rarement plus ;',
          'un mouvement qui se dégrade quand il est trop ample : un geste lent vaut mieux qu’une course ;',
          'des mains, des textes et des visages de dos qui restent fragiles ;',
          'un son à retravailler au montage, même quand l’outil en génère un.',
        ]) +
        exercice('Tester la même image sur deux outils', '15 minutes', [
          'Prenez une image réussie du chapitre Images (un personnage, une lumière nette).',
          'Écrivez une seule consigne de mouvement : « la personne tourne lentement la tête vers la fenêtre, la caméra reste fixe ».',
          'Générez sur deux outils différents. Notez durée, fidélité au personnage, défauts visibles.',
        ], ['vous savez lequel garde le mieux votre personnage ;', 'vous avez repéré au moins un défaut à corriger dans la consigne.']) +
        aRetenir(['On part de l’image, on ajoute le mouvement.', 'Un plan généré est court : on construit une vidéo en assemblant des plans.']),
    },
    {
      nom: 'Leçon · Écrire un mouvement : caméra, sujet, durée',
      min: 25,
      html:
        reperes(['Durée : 25 minutes', 'Production : trois plans générés à partir d’une même image']) +
        h3('La consigne de mouvement, en quatre lignes') +
        table(
          ['Ligne', 'Ce qu’elle décrit', 'Exemple'],
          [
            ['Le sujet', 'qui bouge, et comment, lentement', '« la bénévole lève la main pour saluer, sourire léger »'],
            ['La caméra', 'fixe, travelling, zoom, à quelle vitesse', '« lent travelling avant, caméra à hauteur d’yeux »'],
            ['L’ambiance', 'ce qui vit dans le décor', '« rideaux qui bougent, lumière du soir »'],
            ['Ce qui ne change pas', 'ce que l’outil doit préserver', '« visage, vêtements et décor identiques à l’image »'],
          ],
        ) +
        h3('Le vocabulaire de la caméra') +
        table(
          ['Terme', 'Effet', 'Quand l’utiliser'],
          [
            ['plan fixe', 'stabilité, on regarde le sujet', 'un visage qui parle, un objet présenté'],
            ['travelling avant', 'on entre dans la scène', 'ouverture d’une vidéo'],
            ['travelling latéral', 'on découvre un lieu', 'présentation d’un espace, d’une équipe'],
            ['panoramique', 'la caméra tourne sur place', 'suivre un geste, relier deux éléments'],
            ['contre-plongée', 'le sujet paraît grand', 'un bâtiment, une affirmation'],
          ],
        ) +
        h3('Les erreurs qui cassent un plan') +
        ul([
          'deux mouvements à la fois (le sujet court et la caméra tourne) ;',
          'une action trop longue pour cinq secondes ;',
          'un texte lisible dans l’image : il se déforme dès que ça bouge ;',
          'un changement de décor demandé dans le même plan.',
        ]) +
        exercice('Trois plans, une image', '15 minutes', [
          'Générez un plan fixe où seul le sujet bouge.',
          'Générez un travelling avant lent sur la même image, sujet immobile.',
          'Générez un panoramique qui relie le sujet à un élément du décor.',
          'Classez les trois du plus réussi au moins réussi et notez pourquoi.',
        ], ['chaque plan garde le visage et le décor de l’image ;', 'vous savez lequel des trois servira d’ouverture.']) +
        quiz([
          { q: 'Pour un plan généré de cinq secondes, on demande…', o: ['une course et un zoom', 'un seul mouvement, lent', 'trois actions successives', 'un changement de décor'], r: 'B', pourquoi: 'Un mouvement unique et lent reste fidèle ; l’outil se dégrade dès que l’action est ample ou double.' },
        ]) +
        aRetenir(['Sujet, caméra, ambiance, ce qui ne change pas : quatre lignes.', 'Un plan, un mouvement.']),
    },
    {
      nom: 'Leçon · Du scénario au clip : planche de plans et cohérence',
      min: 30,
      html:
        reperes(['Durée : 30 minutes', 'Production : un clip de 20 à 30 secondes en cinq plans']) +
        h3('Écrire court : la structure en cinq plans') +
        table(
          ['Plan', 'Rôle', 'Durée', 'Exemple pour un atelier vidéo gratuit'],
          [
            ['1', 'accroche : une image forte ou une question', '3 s', 'un téléphone posé sur un trépied, lumière qui s’allume'],
            ['2', 'le problème', '5 s', 'une jeune femme filme dans un couloir sombre, image floue'],
            ['3', 'la bascule', '5 s', 'elle entre dans le studio, la lumière change'],
            ['4', 'la solution en action', '7 s', 'elle parle face caméra, cadrage net, sourire'],
            ['5', 'l’appel', '5 s', 'l’affiche de l’atelier, un espace vide pour le texte'],
          ],
        ) +
        h3('La planche de plans : neuf images avant une seconde de vidéo') +
        p('Reprenez la planche de neuf plans du chapitre Images : même personnage, même lumière, neuf cadrages. Choisissez-y vos cinq plans. C’est cette planche qui garantit que le personnage du plan 2 est celui du plan 4. Sans elle, chaque génération réinvente un visage.') +
        h3('Assembler') +
        ol([
          'Générez chaque plan à partir de son image, avec sa consigne de mouvement.',
          'Nommez les fichiers dans l’ordre (01-accroche, 02-probleme…).',
          'Importez-les dans votre outil de montage (chapitre Montage) : coupez les premières et dernières images de chaque plan, souvent instables.',
          'Ajoutez le texte et le son au montage, jamais dans la génération.',
        ]) +
        alerte('Ce qui doit rester vrai', p('Un clip qui montre un lieu, un événement ou une personne réels doit dire qu’il est généré. Un décor inventé pour illustrer une idée ne pose pas de problème ; une fausse salle comble à un événement réel, si.')) +
        exercice('Votre premier clip', '20 minutes', [
          'Écrivez vos cinq plans dans le tableau (rôle, durée, description).',
          'Choisissez cinq images de votre planche de plans.',
          'Générez les cinq plans, assemblez-les sans son ni texte.',
          'Regardez-le deux fois : une fois pour le rythme, une fois pour la cohérence du personnage.',
        ], ['le clip dure entre 20 et 30 secondes ;', 'le personnage est reconnaissable d’un plan à l’autre ;', 'vous avez noté ce que le montage devra rattraper.']) +
        aRetenir(['Cinq plans : accroche, problème, bascule, solution, appel.', 'La planche de plans est votre assurance cohérence.']),
    },
  ],
};

/* ================================================================== */
/* CHAPITRE 4 · AVATARS ET VOIX                                        */
/* ================================================================== */
const AVATARS = {
  nom: 'Chapitre · Avatars IA et voix de synthèse',
  lecons: [
    {
      nom: 'Leçon · Un présentateur sans caméra : ce qu’est un avatar IA',
      min: 15,
      html:
        reperes(['Durée : 15 minutes', 'Production : le choix de votre type d’avatar']) +
        h3('Trois types d’avatars') +
        table(
          ['Type', 'Comment il est fait', 'Pour quoi', 'Point d’attention'],
          [
            ['Avatar de catalogue', 'un acteur filmé, puis animé par le texte que vous donnez', 'tutoriels, annonces, formations', 'le même visage sert à des milliers de comptes'],
            ['Avatar personnel', 'vous vous filmez deux minutes, l’outil apprend votre visage et votre voix', 'votre chaîne, vos formations', 'consentement, sécurité du compte, mention obligatoire'],
            ['Personnage généré', 'une image de personnage fictif animée pour parler', 'mascotte, série, pédagogie', 'plus libre, moins réaliste'],
          ],
        ) +
        h3('Les outils') +
        ul([
          '<strong>HeyGen, Synthesia, D-ID</strong> : avatars parlants à partir d’un texte, doublage automatique.',
          '<strong>ElevenLabs et équivalents</strong> : voix de synthèse et clonage de voix.',
          '<strong>Les outils d’image vers vidéo</strong> vus au chapitre précédent : pour animer un personnage fictif.',
        ]) +
        h3('Quand un avatar est une bonne idée, et quand il ne l’est pas') +
        table(
          ['Bonne idée', 'Mauvaise idée'],
          [
            ['une capsule pédagogique de deux minutes, réenregistrable à volonté', 'un message personnel où la sincérité compte (remerciement, annonce difficile)'],
            ['une version en plusieurs langues d’une même vidéo', 'faire croire qu’une personne réelle a tourné'],
            ['un personnage fictif qui porte une série', 'remplacer un témoignage'],
          ],
        ) +
        exercice('Choisir', '5 minutes', [
          'Reprenez votre objectif de la première leçon.',
          'Choisissez le type d’avatar qui lui convient et écrivez pourquoi en deux lignes.',
        ], ['votre choix tient compte du public et de la question de la sincérité.']) +
        aRetenir(['Un avatar sert la pédagogie et la répétition, pas la sincérité.', 'Personnel, de catalogue ou fictif : trois usages, trois règles.']),
    },
    {
      nom: 'Leçon · Voix de synthèse : écrire pour être entendu',
      min: 20,
      html:
        reperes(['Durée : 20 minutes', 'Production : un texte de 45 secondes lu par une voix de synthèse']) +
        h3('Écrire pour l’oreille') +
        ul([
          'des phrases courtes, un sujet et un verbe ;',
          'des chiffres écrits en toutes lettres quand la prononciation compte ;',
          'une virgule là où vous respireriez ;',
          'pas de sigle non expliqué : « le D-U-I, le dossier de l’usager », pas « le DUI ».',
        ]) +
        h3('Régler une voix') +
        table(
          ['Réglage', 'Effet', 'Conseil'],
          [
            ['vitesse', 'rythme de lecture', 'un peu plus lent que la parole naturelle'],
            ['stabilité', 'régularité du ton', 'élevée pour un tutoriel, plus basse pour une histoire'],
            ['pauses', 'silences entre les idées', 'un point = une vraie pause ; ajoutez « … » si l’outil les ignore'],
            ['prononciation', 'mots étrangers, noms propres', 'écrivez-les comme ils se prononcent'],
          ],
        ) +
        h3('Cloner sa propre voix') +
        p('C’est possible en quelques minutes d’enregistrement. Trois conditions : c’est votre voix ou celle d’une personne qui a signé son accord ; le compte est protégé par une authentification forte ; chaque vidéo qui l’utilise le dit. Une voix clonée qui prononce un texte que la personne n’a jamais dit est un hypertrucage.') +
        alerte('Jamais la voix d’autrui', p('Ni celle d’une personnalité, ni celle d’un collègue « pour rire », ni celle d’un enfant. Le règlement européen exige la transparence, le droit français protège la voix comme attribut de la personnalité.')) +
        exercice('Un texte lu', '15 minutes', [
          'Écrivez 45 secondes de texte (environ 110 mots) qui présentent votre projet.',
          'Lisez-le à voix haute et corrigez ce qui accroche.',
          'Faites-le lire par une voix de synthèse, deux réglages différents.',
          'Écoutez sans regarder l’écran : notez ce qui sonne faux.',
        ], ['un auditeur comprend le projet sans rien voir ;', 'aucun sigle ni chiffre n’est mal prononcé.']) +
        aRetenir(['On écrit pour l’oreille, pas pour l’œil.', 'Une voix clonée = votre voix, votre accord, votre mention.']),
    },
    {
      nom: 'Leçon · Une vidéo face caméra sans caméra : de A à Z',
      min: 30,
      html:
        reperes(['Durée : 30 minutes', 'Production : une capsule de 60 secondes avec avatar']) +
        h3('La chaîne complète') +
        ol([
          '<strong>Le script</strong> : 60 secondes, environ 150 mots, structure « question, réponse en trois points, appel ».',
          '<strong>Le décor</strong> : une image générée au chapitre Images (fond neutre, lumière douce) ou un fond uni.',
          '<strong>L’avatar</strong> : catalogue, personnel ou personnage fictif animé.',
          '<strong>La voix</strong> : de synthèse, réglée comme à la leçon précédente.',
          '<strong>Les inserts</strong> : deux ou trois images ou plans générés qui illustrent les points, ajoutés au montage.',
          '<strong>La mention</strong> : « présentateur et voix générés par IA » dans la description et, si l’avatar est réaliste, à l’écran.',
        ]) +
        h3('Le script type') +
        carte('Modèle de 60 secondes', ul([
          '<strong>0 à 8 s</strong> : une question que le public se pose vraiment.',
          '<strong>8 à 45 s</strong> : trois points, une phrase chacun, une image d’illustration chacun.',
          '<strong>45 à 55 s</strong> : ce que ça change concrètement.',
          '<strong>55 à 60 s</strong> : un seul appel (s’inscrire, essayer, partager).',
        ])) +
        h3('Les pièges du rendu') +
        ul([
          'un avatar qui gesticule : réglez les gestes au minimum, le montage fera le rythme ;',
          'un regard qui ne fixe pas la caméra : choisissez un cadrage en plan poitrine ;',
          'une voix qui accélère sur les listes : ajoutez des pauses ;',
          'un fond trop détaillé qui « flotte » derrière l’avatar : fond uni ou flou.',
        ]) +
        exercice('Votre capsule', '25 minutes', [
          'Écrivez le script avec le modèle.',
          'Générez l’avatar avec la voix et le fond choisis.',
          'Exportez, puis ajoutez deux inserts au montage (vous affinerez au chapitre suivant).',
          'Ajoutez la mention. Faites regarder la capsule à une personne qui ne connaît pas le projet.',
        ], ['la personne peut répéter les trois points ;', 'la mention est visible sans chercher.']) +
        quiz([
          { q: 'Un avatar réaliste qui présente une vidéo…', o: ['n’a pas besoin de mention', 'est signalé comme généré', 'remplace un témoignage', 'peut prendre le visage d’un collègue'], r: 'B', pourquoi: 'La transparence est une obligation ; un témoignage reste une parole réelle, et un visage n’est jamais utilisé sans accord.' },
        ]) +
        aRetenir(['Script, décor, avatar, voix, inserts, mention : six étapes.', 'Le montage fait le rythme, pas les gestes de l’avatar.']),
    },
  ],
};

/* ================================================================== */
/* CHAPITRE 5 · MONTAGE, SON ET EFFETS                                 */
/* ================================================================== */
const MONTAGE = {
  nom: 'Chapitre · Montage, son et effets',
  lecons: [
    {
      nom: 'Leçon · Monter sur téléphone ou ordinateur : couper, rythmer, sous-titrer',
      min: 25,
      html:
        reperes(['Durée : 25 minutes', 'Production : votre clip du chapitre Vidéos, monté et sous-titré']) +
        h3('L’outil : ce qu’il doit savoir faire') +
        p('CapCut, DaVinci Resolve, iMovie, Canva vidéo ou un autre : peu importe, à condition de pouvoir couper au dixième de seconde, poser des sous-titres automatiques et exporter en vertical. Ce parcours montre les gestes, pas les menus : ils changent à chaque mise à jour.') +
        h3('Les quatre gestes du montage') +
        table(
          ['Geste', 'Règle', 'Pourquoi'],
          [
            ['couper', 'retirer les premières et dernières images de chaque plan généré', 'ce sont les plus instables'],
            ['rythmer', 'un changement toutes les 2 à 4 secondes en vertical', 'l’œil décroche sinon'],
            ['aligner', 'la coupe tombe sur un temps du son ou une fin de phrase', 'la coupe devient invisible'],
            ['sous-titrer', 'sous-titres automatiques, puis relus mot à mot', 'la majorité regarde sans le son'],
          ],
        ) +
        h3('Les sous-titres qui se lisent') +
        ul([
          'trois à cinq mots par ligne, deux lignes au plus ;',
          'dans le tiers inférieur, jamais sur un visage ;',
          'police sans empattement, taille lisible sur un téléphone tenu à bout de bras ;',
          'un fond léger derrière le texte si l’image est claire.',
        ]) +
        alerte('Relire les sous-titres automatiques', p('Ils inventent des mots, surtout les noms propres et les sigles. Un sous-titre faux sur une vidéo d’organisme se remarque, et il reste.')) +
        exercice('Le clip monté', '20 minutes', [
          'Importez vos cinq plans, coupez les bords instables.',
          'Placez une coupe toutes les 2 à 4 secondes ; supprimez ce qui ne sert pas.',
          'Générez les sous-titres, relisez-les mot à mot.',
          'Exportez en 9:16, regardez sur un téléphone.',
        ], ['le clip se comprend sans le son ;', 'aucune coupe ne saute à l’œil.']) +
        aRetenir(['Couper, rythmer, aligner, sous-titrer.', 'Le montage se juge sur un téléphone, sans le son.']),
    },
    {
      nom: 'Leçon · Le son : musique, voix, niveaux',
      min: 20,
      html:
        reperes(['Durée : 20 minutes', 'Production : la piste son de votre clip']) +
        h3('Le son se pardonne moins que l’image') +
        p('Une image imparfaite passe ; un son saturé, une musique trop forte ou une voix étouffée font quitter la vidéo en deux secondes. On règle donc le son avec autant de soin que les plans.') +
        h3('Trois pistes, trois rôles') +
        table(
          ['Piste', 'Rôle', 'Niveau indicatif', 'Où la trouver'],
          [
            ['voix', 'porte le message', 'la plus forte, nette', 'enregistrée, ou de synthèse (chapitre Avatars)'],
            ['musique', 'donne le rythme et l’émotion', 'nettement sous la voix', 'bibliothèques libres de droits ou musique générée'],
            ['ambiance et effets', 'rendent la scène vivante', 'discrète', 'son généré avec la vidéo, banques d’effets'],
          ],
        ) +
        h3('Musique : ce qu’on a le droit d’utiliser') +
        ul([
          'les bibliothèques intégrées aux plateformes, dans les conditions de la plateforme ;',
          'les musiques sous licence libre en respectant la mention demandée ;',
          'une musique générée par IA à partir d’une description (ambiance, tempo, durée), en vérifiant les conditions d’usage commercial de l’outil ;',
          'jamais un titre commercial « parce que tout le monde le fait » : la vidéo peut être coupée ou monétisée par un tiers.',
        ]) +
        h3('Les réglages qui sauvent') +
        ul([
          'une <strong>montée et une descente</strong> de la musique au début et à la fin ;',
          'un <strong>abaissement automatique</strong> de la musique quand la voix parle ;',
          'un <strong>réducteur de bruit</strong> léger sur une voix enregistrée ;',
          'un contrôle final au casque, puis sur un haut-parleur de téléphone.',
        ]) +
        exercice('La piste son', '15 minutes', [
          'Choisissez une musique dont le tempo suit vos coupes.',
          'Posez la voix (enregistrée ou de synthèse) et abaissez la musique sous elle.',
          'Ajoutez une ambiance sur un plan, pas plus.',
          'Écoutez au casque, puis sur le haut-parleur d’un téléphone.',
        ], ['la voix se comprend mot à mot sur un téléphone ;', 'la musique ne couvre jamais la voix.']) +
        aRetenir(['Voix au-dessus, musique dessous, ambiance discrète.', 'Une musique, une licence.']),
    },
    {
      nom: 'Leçon · Effets, textes et habillage : une identité qui revient',
      min: 20,
      html:
        reperes(['Durée : 20 minutes', 'Production : votre gabarit d’habillage réutilisable']) +
        h3('L’habillage, c’est ce qui fait reconnaître une série') +
        p('Une couleur, une police, une façon d’écrire les titres, une transition, un son d’ouverture : cinq éléments qui reviennent, et un spectateur reconnaît votre contenu avant d’avoir lu le nom du compte. Ils se décident une fois, et se rangent dans un gabarit.') +
        h3('Le gabarit en cinq lignes') +
        table(
          ['Élément', 'Décision', 'Exemple'],
          [
            ['palette', 'deux couleurs, une claire, une foncée', 'bleu nuit et crème'],
            ['police', 'une pour les titres, une pour les sous-titres', 'sans empattement, grasse pour les titres'],
            ['titre d’ouverture', 'même position, même animation, 2 secondes', 'texte qui glisse depuis la gauche'],
            ['transition', 'une seule, discrète', 'coupe franche ou fondu court'],
            ['signature', 'même image ou même plan de fin', 'le logo sur fond crème, 2 secondes'],
          ],
        ) +
        h3('Les effets : moins, c’est mieux') +
        ul([
          'un <strong>zoom lent</strong> sur une image fixe donne du mouvement sans générer de vidéo ;',
          'un <strong>texte qui apparaît mot par mot</strong> suit la voix et retient l’attention ;',
          'un <strong>ralenti</strong> sur un plan généré masque une instabilité ;',
          'les effets « tendance » d’une application datent en trois mois : ils ne vont pas dans le gabarit.',
        ]) +
        h3('Les formats d’export') +
        table(
          ['Format', 'Usage', 'Repère'],
          [
            ['9:16', 'stories, TikTok, Reels, Shorts', 'zone sûre : évitez le tiers haut et le tiers bas pour les textes'],
            ['16:9', 'site, YouTube, projection', 'textes plus petits possibles'],
            ['1:1', 'publications carrées', 'recadrer, ne pas écraser'],
          ],
        ) +
        exercice('Votre gabarit', '15 minutes', [
          'Décidez les cinq éléments dans le tableau.',
          'Appliquez-les à votre clip : titre d’ouverture, transition, signature.',
          'Enregistrez le projet comme modèle dans votre outil de montage.',
          'Exportez en 9:16 et en 16:9.',
        ], ['une seconde vidéo peut être habillée en dix minutes avec le modèle ;', 'les textes restent dans la zone sûre en 9:16.']) +
        quiz([
          { q: 'Une bonne transition dans une série, c’est…', o: ['une différente à chaque coupe', 'la plus spectaculaire', 'toujours la même, discrète', 'celle du moment'], r: 'C', pourquoi: 'L’identité vient de la répétition ; les effets à la mode datent vite.' },
        ]) +
        aRetenir(['Palette, police, titre, transition, signature : un gabarit.', 'Un effet doit servir le message, sinon il s’enlève.']),
    },
  ],
};

/* ================================================================== */
/* CHAPITRE 6 · PUBLIER, TESTER, MONÉTISER                             */
/* ================================================================== */
const MONETISATION = {
  nom: 'Chapitre · Publier, tester et monétiser sans mentir',
  lecons: [
    {
      nom: 'Leçon · Formats et niches : ce qui retient l’attention, et pourquoi',
      min: 20,
      html:
        reperes(['Durée : 20 minutes', 'Production : le choix d’un format de série et de sa niche']) +
        h3('Pourquoi une série plutôt que des vidéos isolées') +
        p('Une vidéo isolée est jugée seule ; une série crée une attente. Le spectateur revient pour le personnage, le rendez-vous, la forme qu’il reconnaît. Pour un créateur qui débute, la série est aussi une économie : le gabarit, le personnage et la voix sont faits une fois.') +
        h3('Les formats courts qui fonctionnent avec l’IA') +
        table(
          ['Format', 'Principe', 'Ce que l’IA apporte', 'Exemple fictif'],
          [
            ['la mini-histoire', 'un personnage, une situation, une chute, 30 secondes', 'personnage cohérent, décors variés', 'un fruit qui découvre un métier chaque épisode'],
            ['l’explication en trois points', 'une question, trois réponses', 'inserts illustrés, avatar', '« Pourquoi ta vidéo est floue ? »'],
            ['l’avant / après', 'un état, une transformation', 'les deux images générées dans le même cadrage', 'un stand d’association avant et après une affiche lisible'],
            ['la liste', 'cinq outils, trois erreurs', 'une image par élément', '« Trois erreurs de lumière »'],
            ['le personnage récurrent', 'une mascotte qui commente', 'image de référence, voix fixe', 'la mascotte d’un centre social'],
          ],
        ) +
        h3('Choisir une niche : trois cercles') +
        ul([
          '<strong>ce que vous savez</strong> (votre métier, votre association, votre quartier) ;',
          '<strong>ce que le public cherche</strong> (regardez les questions posées en commentaire sur des comptes proches) ;',
          '<strong>ce que vous pouvez tenir</strong> : une vidéo par semaine pendant trois mois vaut mieux que dix en un week-end.',
        ]) +
        alerte('Ce que les compteurs ne disent pas', p('Un format « viral » ailleurs ne l’est pas chez vous : le public, l’heure, la langue et la plateforme changent tout. Ce parcours n’annonce aucun chiffre. On teste, on mesure, on garde ce qui marche pour vous.')) +
        exercice('Votre série', '15 minutes', [
          'Choisissez un format dans le tableau et une niche au croisement des trois cercles.',
          'Écrivez le titre de la série et les cinq premiers épisodes en une ligne chacun.',
          'Vérifiez que le personnage, le gabarit et la voix des chapitres précédents servent aux cinq.',
        ], ['les cinq épisodes se ressemblent par la forme et diffèrent par le sujet.']) +
        aRetenir(['Une série, un format, une niche que vous pouvez tenir.', 'On mesure chez soi, on ne copie pas les chiffres des autres.']),
    },
    {
      nom: 'Leçon · Affiliation, boutique et partenariats : comment ça marche, et ce que dit la loi',
      min: 25,
      html:
        reperes(['Durée : 25 minutes', 'Production : votre fiche « mentions obligatoires »']) +
        h3('Les façons dont un contenu peut rapporter') +
        table(
          ['Voie', 'Principe', 'Ce qu’il faut', 'Point de vigilance'],
          [
            ['programmes des plateformes', 'la plateforme reverse une part selon les vues, sous conditions', 'un compte éligible, des contenus originaux', 'les conditions changent, rien n’est garanti'],
            ['affiliation', 'un lien qui vous identifie ; une part de la vente vous revient', 'un programme d’affiliation, un lien suivi', 'mention « lien affilié » visible'],
            ['boutique intégrée', 'la plateforme vend le produit que la vidéo présente', 'un vendeur partenaire ou vos produits', 'responsabilité sur ce que vous recommandez'],
            ['partenariat', 'une marque ou une structure paie un contenu', 'un contrat, un brief', 'mention « publicité » ou « en partenariat avec »'],
            ['prestation', 'vous produisez pour d’autres (associations, commerces)', 'un devis, une facture, un statut', 'ce parcours ne conseille pas sur le statut : renseignez-vous'],
          ],
        ) +
        h3('Ce que la loi impose en France') +
        ul([
          'la <strong>loi du 9 juin 2023</strong> encadre l’influence commerciale : toute promotion rémunérée ou en échange d’un avantage se signale par « publicité » ou « collaboration commerciale », de façon claire, lisible et pendant toute la vidéo ;',
          'certains produits ne peuvent pas être promus (opérations de chirurgie esthétique, produits financiers risqués, paris sportifs hors cadre…) ;',
          'un contenu généré par IA qui montre un visage ou une voix imitant le réel le signale ;',
          'les revenus se déclarent : c’est une question de statut et de fiscalité, à voir avec un professionnel, pas avec ce parcours.',
        ]) +
        alerte('Un mineur qui crée', p('Les jeunes de moins de 18 ans sont concernés par des règles propres (autorisation des responsables légaux, protection des revenus). Une structure qui accompagne des jeunes vérifie ce cadre avant toute collaboration commerciale.')) +
        h3('La mention, concrètement') +
        table(
          ['Situation', 'Ce qu’on écrit', 'Où'],
          [
            ['lien affilié', '« Lien affilié : je touche une commission si vous achetez »', 'description et à l’oral ou à l’écran'],
            ['produit reçu gratuitement', '« Produit offert par… »', 'à l’écran dès le début'],
            ['contenu payé', '« Publicité » ou « Collaboration commerciale »', 'à l’écran pendant toute la vidéo'],
            ['contenu généré', '« Images générées par IA »', 'description ; à l’écran si réaliste'],
          ],
        ) +
        exercice('Votre fiche mentions', '10 minutes', [
          'Listez les voies que vous envisagez pour votre série (au plus deux pour commencer).',
          'Écrivez pour chacune la mention exacte et l’endroit où elle ira.',
          'Ajoutez la mention IA de votre charte du chapitre Bases.',
        ], ['une personne extérieure sait, en lisant la fiche, quelle mention mettre sur chaque vidéo.']) +
        quiz([
          { q: 'Une vidéo payée par une marque doit porter…', o: ['rien, si la marque est connue', '« publicité » ou « collaboration commerciale », lisible pendant toute la vidéo', 'un simple hashtag à la fin', 'une mention dans un commentaire'], r: 'B', pourquoi: 'La loi de 2023 exige une mention claire et lisible pendant toute la durée.' },
          { q: 'Un lien affilié…', o: ['se cache pour ne pas gêner', 'se signale comme tel', 'n’existe que sur les boutiques', 'dispense de facture'], r: 'B', pourquoi: 'Le public a le droit de savoir que vous êtes rémunéré sur la vente.' },
        ]) +
        aRetenir(['Cinq voies, toutes conditionnées à une mention claire.', 'La loi de 2023 sur l’influence commerciale s’applique dès le premier euro.']),
    },
    {
      nom: 'Leçon · Publier, mesurer, ajuster : la méthode des trois semaines',
      min: 20,
      html:
        reperes(['Durée : 20 minutes', 'Production : votre tableau de suivi']) +
        h3('Le calendrier') +
        table(
          ['Semaine', 'Action', 'Ce qu’on regarde'],
          [
            ['1', 'publier les épisodes 1 à 3, mêmes heures, mêmes jours', 'rien : trop tôt'],
            ['2', 'publier 4 et 5, répondre à chaque commentaire', 'la rétention à 3 secondes et à la fin'],
            ['3', 'refaire l’épisode le plus regardé avec une autre accroche', 'ce qui change quand seule l’accroche change'],
          ],
        ) +
        h3('Les trois chiffres qui servent, et ceux qui flattent') +
        ul([
          '<strong>rétention à 3 secondes</strong> : l’accroche fonctionne, ou pas ;',
          '<strong>vues complètes</strong> : la vidéo tient sa promesse ;',
          '<strong>partages et enregistrements</strong> : le contenu vaut d’être gardé.',
          'Les « j’aime » et le nombre d’abonnés sont agréables et n’aident pas à décider.',
        ]) +
        h3('Ajuster une chose à la fois') +
        p('Changez l’accroche, ou la durée, ou la musique ; jamais les trois. Sinon vous ne saurez pas ce qui a joué. Notez chaque changement dans le tableau, avec la date.') +
        exercice('Le tableau de suivi', '10 minutes', [
          'Créez un tableau : épisode, date, accroche, durée, rétention 3 s, vues complètes, partages, note.',
          'Remplissez-le pour vos cinq premiers épisodes au fil des trois semaines.',
          'À la fin, écrivez en trois lignes ce que vous gardez et ce que vous changez.',
        ], ['vous savez nommer une chose à garder et une chose à changer, chiffres à l’appui.']) +
        aRetenir(['Trois semaines, une chose changée à la fois.', 'Rétention, vues complètes, partages : le reste flatte.']),
    },
    {
      nom: 'Leçon · Projet final du parcours et attestation',
      min: 30,
      html:
        reperes(['Durée : 30 minutes de préparation, puis le temps de production', 'Production : une série de cinq épisodes et son dossier']) +
        h3('Le projet') +
        p('Produire les cinq premiers épisodes de votre série, publiés ou prêts à l’être, avec le dossier qui va avec. Le dossier prouve la méthode ; les épisodes prouvent le résultat.') +
        h3('Le dossier attendu') +
        table(
          ['Pièce', 'Vient de', 'Critère'],
          [
            ['charte d’usage et fiche mentions', 'chapitres Bases et Monétiser', 'complètes, applicables par un tiers'],
            ['planche de plans du personnage', 'chapitre Images', 'même personnage, même lumière, neuf cadrages'],
            ['scripts des cinq épisodes', 'chapitres Vidéos et Avatars', 'cinq plans ou 60 secondes, un appel par épisode'],
            ['gabarit d’habillage', 'chapitre Montage', 'cinq éléments décidés, modèle enregistré'],
            ['les cinq épisodes', 'tous', 'sous-titrés, son réglé, mention IA présente, 9:16'],
            ['tableau de suivi', 'chapitre Publier', 'rempli pour au moins trois épisodes'],
          ],
        ) +
        h3('Auto-évaluation') +
        ol([
          'Le personnage est-il reconnaissable du premier au cinquième épisode ?',
          'Chaque épisode se comprend-il sans le son ?',
          'La mention IA et, s’il y a lieu, la mention commerciale sont-elles visibles ?',
          'Une personne extérieure retrouve-t-elle la série grâce à l’habillage ?',
          'Avez-vous changé une seule chose entre deux épisodes, et noté l’effet ?',
        ]) +
        encart('Attestation de suivi', p('À la fin du parcours, vous pouvez demander une attestation de suivi à ADéPA. Elle atteste que vous avez suivi ce parcours et remis un projet ; elle n’est ni un diplôme, ni une certification professionnelle, et n’ouvre aucun droit à exercer. La formation elle-même reste accessible.')) +
        aRetenir(['Cinq épisodes, un dossier, une méthode.', 'Ce que vous gardez : un personnage, un gabarit, une charte, et l’habitude de mesurer.']),
    },
  ],
};

const SECTIONS_AVANT = [BASES];
const SECTIONS_APRES = [VIDEOS, AVATARS, MONTAGE, MONETISATION];

const FICHE = {
  name: 'Créer du contenu avec l’IA : images, vidéos, avatars et monétisation',
  description:
    '<p>Un parcours complet pour produire des contenus visuels avec l’intelligence artificielle, de la première image à la série publiée : les bases (comment fonctionne un modèle, comment lui parler, ce qu’on a le droit de faire), les images avec Nano Banana, les vidéos générées à partir de vos images, les avatars et voix de synthèse, le montage, le son et l’habillage, puis la publication et les façons de monétiser en respectant la loi.</p><p>Chaque leçon se termine par un exercice sur votre propre projet ; chaque chapitre produit une pièce du projet final : une série de cinq épisodes et son dossier.</p><p>Formation originale d’ADéPA, organisme de formation certifié Qualiopi. Aucun chiffre de vues ni de revenu n’est promis : les outils et les plateformes changent, la méthode reste. Une attestation de suivi peut être demandée ; elle n’est ni un diplôme ni une certification professionnelle.</p>',
  target:
    '<p>Jeunes créateurs, bénévoles et salariés d’associations, indépendants qui gèrent leurs propres réseaux, toute personne qui veut produire des visuels et des vidéos sans être graphiste ni vidéaste. Aucun diplôme exigé.</p>',
  goals:
    '<ul><li>Écrire une consigne complète à un modèle de texte, d’image ou de vidéo.</li><li>Générer, retoucher et garder cohérent un personnage ou un produit d’une image à l’autre.</li><li>Produire un clip de cinq plans à partir d’une planche d’images.</li><li>Réaliser une capsule face caméra avec un avatar et une voix de synthèse, en respectant la transparence.</li><li>Monter, sous-titrer, mixer et habiller une vidéo verticale avec un gabarit réutilisable.</li><li>Choisir un format de série, publier, mesurer et ajuster ; connaître les mentions obligatoires de l’influence commerciale.</li></ul>',
  requirements:
    '<p>Un ordinateur ou un téléphone récent, une connexion internet, un compte Google pour Nano Banana. Aucune compétence en graphisme ou en vidéo n’est nécessaire. Les outils cités changent régulièrement : la formation enseigne la méthode, et signale à chaque chapitre ce qui peut évoluer.</p>',
};

module.exports = { SECTIONS_AVANT, SECTIONS_APRES, FICHE };
