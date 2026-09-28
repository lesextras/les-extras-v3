// Compléments du 28/09/2026 (soir) à « Créer des images avec l'IA ».
// Comparaison faite avec le chapitre 2 d'une formation Skool dont Siham est
// MEMBRE (accès « Recrue », chapitres verrouillés) : on n'a lu que les TITRES
// des leçons pour repérer les sujets absents, jamais leur contenu. Tout ce qui
// suit est écrit par nous. Règles maison : aucun tiret cadratin, aucun prix,
// exemples fictifs.
const { h3, h4, p, ul, ol, hr, table, carte, encart, alerte, pe } = require('../accompagnement-numerique/h');

const reperes = (items) => carte('Repères de la leçon', ul(items), '0 0 26px');
const aRetenir = (items) => carte('À retenir', ul(items));
const exercice = (titre, duree, etapes, reussi) =>
  hr() + h3(`Exercice : ${titre}`) + pe(`<strong>Durée :</strong> ${duree}.`) + ol(etapes) + encart('C’est réussi quand', ul(reussi));

const MODELES = {
  module: 0,
  nom: 'Leçon · Panorama des modèles d’image, et quand choisir lequel',
  min: 15,
  html:
    reperes(['Durée : 15 minutes', 'Production : votre choix d’outil selon trois besoins']) +
    h3('Pourquoi l’image vient en premier') +
    p('Une vidéo générée, un avatar, un carrousel ou une affiche partent presque toujours d’une image. Une image ratée donne une vidéo ratée : c’est pourquoi on apprend d’abord à maîtriser l’image fixe, puis on anime.') +
    h3('Les grandes familles d’outils') +
    table(
      ['Outil', 'Point fort', 'À savoir'],
      [
        ['Nano Banana (Gemini)', 'retouche par la conversation, cohérence, fusion d’images', 'l’outil de cette formation'],
        ['Générateur d’images de ChatGPT', 'comprend bien les consignes longues, texte correct dans l’image', 'rendu parfois « lisse »'],
        ['Midjourney', 'rendus très esthétiques, ambiances', 'fonctionne par abonnement, interface propre'],
        ['Flux', 'photoréalisme, disponible dans de nombreux outils', 'réglages plus techniques'],
        ['Ideogram', 'typographie et texte dans l’image', 'utile pour affiches et logos de travail'],
        ['Adobe Firefly', 'entraîné sur des images sous licence', 'prudent pour un usage commercial'],
      ],
    ) +
    alerte('Un paysage qui bouge chaque mois', p('Les modèles changent vite : un outil en tête aujourd’hui peut être dépassé dans trois mois. Ce qui ne change pas, c’est la méthode de cette formation : décrire, corriger, garder une cohérence, respecter les règles.')) +
    h3('Choisir selon le besoin') +
    ul([
      '<strong>Modifier une photo existante ou garder un personnage</strong> : Nano Banana.',
      '<strong>Une affiche avec un titre lisible</strong> : un outil fort en texte, ou l’image sans texte puis la mise en page.',
      '<strong>Un usage commercial sensible</strong> : un outil qui garantit ses données d’entraînement.',
    ]) +
    aRetenir(['L’image fixe est la base de tout le reste.', 'Chaque outil a son point fort, la méthode reste la même.']),
};

const PHOTOREALISME = {
  module: 1,
  nom: 'Leçon · Le photoréalisme : obtenir une image qui ressemble à une vraie photo',
  min: 20,
  html:
    reperes(['Durée : 20 minutes', 'Production : deux versions d’une même scène, « IA » et « photo »']) +
    h3('Pourquoi une image fait « IA »') +
    ul(['une peau trop lisse, sans pores ni défaut ;', 'une lumière parfaite venue de nulle part ;', 'des couleurs trop saturées ;', 'un décor trop propre, sans objet du quotidien ;', 'un cadrage centré, comme une publicité.']) +
    h3('Le vocabulaire du photographe') +
    table(
      ['Pour', 'Écrivez', 'Effet'],
      [
        ['un appareil réel', 'photo prise au reflex, objectif 50 mm', 'perspective naturelle'],
        ['un téléphone', 'photo prise au smartphone, lumière naturelle', 'rendu spontané, réseaux sociaux'],
        ['une vraie peau', 'texture de peau naturelle, pores visibles, sans retouche', 'fin de l’effet « plastique »'],
        ['une vraie lumière', 'lumière de fenêtre sur la gauche, ombres douces', 'la lumière a une source'],
        ['un vrai décor', 'léger désordre, objets du quotidien en arrière-plan', 'une scène vécue'],
        ['un vrai grain', 'léger grain de pellicule, couleurs naturelles', 'moins numérique'],
      ],
    ) +
    encart('Exemple', p('« Photo prise au smartphone d’une animatrice fictive qui rit avec un groupe d’adolescents autour d’une table, lumière de fenêtre sur la gauche, texture de peau naturelle, gobelets et feuilles sur la table, couleurs naturelles, cadrage légèrement décentré. »')) +
    alerte('Réaliste ne veut pas dire trompeur', p('Plus l’image est réaliste, plus la mention « Image créée avec l’IA » est nécessaire. Une image photoréaliste d’un événement qui n’a pas eu lieu ne se publie pas comme un souvenir.')) +
    exercice('IA ou photo ?', '15 minutes', [
      'Générez une scène avec un prompt court.',
      'Régénérez-la en ajoutant quatre éléments du tableau.',
      'Montrez les deux à un collègue sans rien dire : laquelle croit-il être une photo ?',
    ], ['la seconde version passe pour une photo', 'vous savez dire quels mots ont fait la différence']) +
    aRetenir(['Une source de lumière, une vraie peau, un vrai décor.', 'Le réalisme appelle toujours la mention IA.']),
};

const LUMIERE = {
  module: 1,
  nom: 'Leçon · Maîtriser la lumière, et la changer sur une image existante',
  min: 15,
  html:
    reperes(['Durée : 15 minutes', 'Production : une même image sous trois lumières']) +
    h3('La lumière fait l’émotion') +
    table(
      ['Lumière', 'Écrivez', 'Ce qu’elle raconte'],
      [
        ['Heure dorée', 'lumière chaude de fin de journée, soleil bas', 'chaleur, souvenir, bien-être'],
        ['Contre-jour', 'soleil derrière le sujet, halo autour des cheveux', 'espoir, énergie'],
        ['Lumière de studio', 'éclairage doux et uniforme, fond neutre', 'sérieux, portrait professionnel'],
        ['Lumière du soir', 'lampes allumées, ambiance tamisée', 'intimité, calme'],
        ['Ciel couvert', 'lumière grise et diffuse, sans ombre marquée', 'réalisme, quotidien'],
      ],
    ) +
    h3('Changer la lumière sans refaire l’image') +
    p('Avec Nano Banana, la lumière se modifie par la conversation, comme un objet : « garde exactement la scène et les personnages, passe la lumière en fin de journée dorée ». Nommez toujours ce qui ne doit pas changer.') +
    exercice('trois lumières', '10 minutes', [
      'Reprenez une image réussie.',
      'Demandez successivement l’heure dorée, la lumière de studio et le soir.',
      'Choisissez celle qui sert le mieux votre message et notez pourquoi.',
    ], ['les trois versions gardent la même scène', 'votre choix est justifié par le message']) +
    aRetenir(['La lumière se choisit selon l’émotion.', 'On la change sans toucher au reste, en le disant.']),
};

const NEUF_PLANS = {
  module: 1,
  nom: 'Leçon · Une scène, neuf plans : la planche de cadrages',
  min: 20,
  html:
    reperes(['Durée : 20 minutes', 'Production : une planche de neuf plans d’une même scène']) +
    h3('Pourquoi une planche') +
    p('Pour un carrousel, un storyboard de vidéo ou une série de publications, il faut la même scène vue sous plusieurs angles. Plutôt que neuf demandes séparées, on peut demander une planche : une seule image découpée en neuf cases, puis agrandir les meilleures.') +
    h3('La consigne type') +
    encart('Planche de neuf plans', p('« Crée une planche de 3 cases sur 3 montrant la même scène et les mêmes personnages sous neuf cadrages : plan d’ensemble, plan moyen, gros plan du visage, gros plan des mains, vue de dessus, contre-plongée, plan par-dessus l’épaule, détail d’un objet, plan de dos. Même lumière dans toutes les cases. »')) +
    h3('Ensuite') +
    ol(['Repérez les deux ou trois cases réussies.', 'Demandez chacune en grand : « agrandis la case du gros plan des mains, en haute définition, même lumière ».', 'Vérifiez la cohérence des visages et des vêtements d’une case à l’autre.']) +
    table(
      ['Plan', 'Il sert à'],
      [
        ['Plan d’ensemble', 'situer le lieu'],
        ['Plan moyen', 'montrer l’action'],
        ['Gros plan', 'faire ressentir une émotion'],
        ['Détail', 'attirer l’œil sur un objet ou un geste'],
        ['Contre-plongée', 'donner de la force au sujet'],
      ],
    ) +
    exercice('ma planche', '15 minutes', [
      'Choisissez une scène avec votre personnage fictif.',
      'Demandez la planche de neuf plans.',
      'Agrandissez les trois meilleures cases et composez un carrousel de trois images.',
    ], ['les trois images forment une histoire', 'le personnage est reconnaissable dans chacune']) +
    aRetenir(['Une planche de neuf plans fait gagner du temps.', 'On agrandit ensuite les meilleures cases.']),
};

const REFERENCE = {
  module: 2,
  nom: 'Leçon · Partir d’une image de référence',
  min: 15,
  html:
    reperes(['Durée : 15 minutes', 'Production : un prompt tiré de votre propre photo']) +
    h3('Faire décrire une image pour en tirer un prompt') +
    p('Quand une ambiance vous plaît, demandez à l’outil de la décrire : « décris cette image comme un prompt : sujet, cadrage, lumière, couleurs, style ». Vous obtenez un point de départ que vous adaptez à votre sujet.') +
    alerte('Quelles images de référence ?', ul([
      'vos propres photos, ou celles de votre structure avec les accords nécessaires ;',
      'des images libres de droits dont la licence autorise la réutilisation ;',
      'jamais l’œuvre d’un photographe, d’un illustrateur ou d’une marque pour la reproduire : s’inspirer d’une lumière ou d’un cadrage est permis, copier une œuvre ne l’est pas.',
    ])) +
    h3('Garder l’ambiance, changer le sujet') +
    p('Le bon usage : « garde la lumière, les couleurs et le cadrage de cette photo, mais remplace la scène par un atelier de peinture avec quatre adultes fictifs ». Vous reprenez une manière de faire, pas le contenu.') +
    exercice('de ma photo au prompt', '10 minutes', [
      'Prenez une photo que vous avez faite vous-même (un lieu, sans personne).',
      'Demandez-en la description sous forme de prompt.',
      'Réutilisez ce prompt pour une scène différente.',
    ], ['la nouvelle image garde l’ambiance de votre photo', 'aucune œuvre d’un tiers n’a servi de modèle']) +
    aRetenir(['On fait décrire une image pour apprendre à la décrire.', 'Ses propres photos ou des images libres, jamais l’œuvre d’un autre.']),
};

const BIBLIOTHEQUE = {
  module: 3,
  nom: 'Leçon · La bibliothèque de prompts d’ADéPA',
  min: 15,
  html:
    reperes(['Durée : 15 minutes', 'Production : votre bibliothèque personnelle de dix prompts']) +
    p('Des modèles prêts à adapter : remplacez ce qui est entre crochets, ajoutez votre phrase de style à la fin.') +
    h3('Communication') +
    table(
      ['Usage', 'Modèle de prompt'],
      [
        ['Annonce d’événement', 'Photo réaliste de [lieu] décoré pour [événement], lumière chaude de fin de journée, personne au premier plan, tiers supérieur vide pour un titre, format [carré ou vertical].'],
        ['Appel à bénévoles', 'Illustration plate de [nombre] personnes fictives d’âges variés qui [action], ambiance accueillante, fond uni à droite pour un texte.'],
        ['Remerciement', 'Gros plan de mains qui [geste : se serrent, tiennent un colis, plantent une graine], lumière douce, faible profondeur de champ.'],
        ['Collecte ou don', 'Vue de dessus d’une table avec [objets collectés], rangés avec soin, lumière naturelle, beaucoup d’espace libre.'],
      ],
    ) +
    h3('Formation') +
    table(
      ['Usage', 'Modèle de prompt'],
      [
        ['Couverture de module', 'Illustration plate représentant [idée du module] par un objet symbole, palette [couleurs], fond uni, format 16:9.'],
        ['Situation professionnelle', 'Photo réaliste d’un [métier] fictif qui [action professionnelle] dans [lieu], lumière de fenêtre, cadrage décentré.'],
        ['Avant, après', 'Deux cases côte à côte : à gauche [situation avant], à droite [situation après], même cadrage et même lumière.'],
        ['Planche de plans', 'Planche de 3 cases sur 3 de [scène] sous neuf cadrages différents, mêmes personnages, même lumière.'],
      ],
    ) +
    h3('Retouche') +
    table(
      ['Besoin', 'Consigne'],
      [
        ['Lumière', 'Garde la scène et les personnages, passe la lumière en [ambiance].'],
        ['Fond', 'Remplace le fond par [nouveau fond], garde le cadrage et le sujet.'],
        ['Objet', 'Retire [objet] à [position], sans rien changer d’autre.'],
        ['Format', 'Étends l’image vers [la gauche, le haut] pour obtenir un format [16:9, vertical], en prolongeant le décor.'],
      ],
    ) +
    encart('Votre bibliothèque', p('Copiez ces modèles dans un document partagé avec l’équipe, avec pour chacun l’image obtenue et la date : c’est ce qui fera gagner du temps à toute la structure.')) +
    aRetenir(['Un modèle de prompt se complète, il ne se recopie pas tel quel.', 'Une bibliothèque partagée fait une identité commune.']),
};

module.exports = { AJOUTS: [MODELES, PHOTOREALISME, LUMIERE, NEUF_PLANS, REFERENCE, BIBLIOTHEQUE] };
