// Formation originale d'ADéPA : « Créer des images avec l'IA (Nano Banana) ».
// Écrite le 28/09/2026. ⚠ Ce n'est PAS une copie d'une formation tierce : la
// demande était de dupliquer un cours d'une communauté payante (Skool), ce qui
// reproduirait l'œuvre de quelqu'un d'autre. On traite le même sujet avec nos
// propres textes, nos exemples et notre pédagogie.
// Règles maison : aucun tiret cadratin, « attestation » et jamais l'autre mot,
// aucun prix, aucune promesse de revenu, exemples fictifs.
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

/* ------------------------------------------------------------------ */
const M1 = {
  nom: 'Module 1 · Comprendre l’outil avant de s’en servir',
  lecons: [
    {
      nom: 'Leçon · Ce qu’est Nano Banana, et ce qu’il sait faire',
      min: 15,
      html:
        reperes(['Durée : 15 minutes', 'Prérequis : un compte Google', 'Production : une première image et une note sur ce qui a marché']) +
        h3('Un modèle d’image, pas un logiciel de dessin') +
        p('« Nano Banana » est le surnom donné au modèle de génération et de retouche d’images de Google, intégré à Gemini. On lui décrit une image avec des mots, ou on lui donne une photo à modifier, et il produit une image. Il ne dessine pas trait par trait : il fabrique une image plausible à partir de tout ce qu’il a appris.') +
        p('Sa particularité, par rapport aux premiers générateurs d’images, tient en trois points :') +
        ul([
          '<strong>la retouche par la conversation</strong> : on demande « change la couleur du pull » et le reste de l’image ne bouge pas ;',
          '<strong>la cohérence</strong> : un même personnage, un même objet ou un même logo peut revenir d’une image à l’autre ;',
          '<strong>la fusion</strong> : on peut lui donner plusieurs images et lui demander de les combiner.',
        ]) +
        h3('Où l’utiliser') +
        table(
          ['Accès', 'Pour qui', 'Ce qu’il faut savoir'],
          [
            ['Application ou site Gemini', 'tout le monde', 'le plus simple pour commencer ; les quotas dépendent de l’abonnement'],
            ['Google AI Studio', 'curieux et créateurs réguliers', 'plus de réglages (format, nombre d’images), interface plus technique'],
            ['Outils tiers qui l’intègrent', 'selon l’outil', 'vérifier ce que l’outil fait de vos images avant d’y déposer une photo'],
          ],
        ) +
        alerte('Les conditions changent vite', p('Quotas, formats et offres évoluent tous les mois. Avant une utilisation professionnelle, relisez les conditions d’utilisation du service au jour où vous l’utilisez.')) +
        h3('Ce qu’il fait bien, ce qu’il fait mal') +
        table(
          ['Il fait bien', 'Il fait encore mal'],
          [
            ['les ambiances, la lumière, les matières', 'les textes longs dans l’image (lettres déformées)'],
            ['retoucher une zone précise d’une photo', 'les mains et les foules en arrière-plan'],
            ['garder un personnage d’une image à l’autre', 'les chiffres exacts, les cartes, les schémas précis'],
            ['changer de style (photo, aquarelle, 3D)', 'reproduire fidèlement une personne réelle, et il ne le doit pas'],
          ],
        ) +
        exercice('ma première image', '5 minutes', [
          'Ouvrez Gemini et écrivez : « Une salle de classe lumineuse le matin, des tables en bois, des plantes vertes, style photo ».',
          'Regardez le résultat et notez une chose réussie et une chose à corriger.',
          'Demandez la correction en une phrase, sans réécrire toute la description.',
        ], ['vous avez deux images, la seconde corrige la première sans changer le reste']) +
        aRetenir(['On décrit avec des mots, on corrige par la conversation.', 'Le texte dans l’image et les détails chiffrés restent fragiles.', 'Les conditions du service se relisent avant tout usage professionnel.']),
    },
    {
      nom: 'Leçon · Les règles avant la première publication',
      min: 15,
      html:
        reperes(['Durée : 15 minutes', 'Production : votre liste de contrôle avant publication']) +
        h3('Quatre questions à se poser à chaque image') +
        ol([
          '<strong>Représente-t-elle une personne réelle ?</strong> Ne générez jamais l’image d’une personne identifiable sans son accord, et jamais d’un mineur accompagné. Le droit à l’image s’applique aussi à une image fabriquée.',
          '<strong>Imite-t-elle une œuvre ou une marque ?</strong> « Dans le style de » un artiste vivant, un logo existant, un personnage connu : c’est le terrain de la contrefaçon. Décrivez une ambiance plutôt qu’un auteur.',
          '<strong>Peut-elle tromper ?</strong> Une fausse photo d’événement, un faux document, un faux témoignage : c’est interdit, même « pour illustrer ».',
          '<strong>Faut-il dire que c’est de l’IA ?</strong> Oui dès qu’on pourrait croire à une vraie photo. Une mention courte suffit : « Image créée avec l’IA ».',
        ]) +
        h3('Le filigrane invisible') +
        p('Les images produites par les modèles de Google portent un filigrane numérique invisible (SynthID) qui permet de les reconnaître comme générées. Il ne remplace pas la mention visible quand elle est nécessaire.') +
        h3('Vos photos et les données des personnes') +
        p('Déposer une photo dans un outil d’IA, c’est la confier à un service tiers. Pour une association ou un organisme de formation, la règle est simple : aucune photo d’usager, de bénéficiaire ou d’apprenant sans consentement écrit, et jamais pour un public vulnérable.') +
        encart('Liste de contrôle avant publication', ul(['Aucune personne réelle identifiable sans accord écrit', 'Aucune imitation d’artiste, de logo ou de personnage', 'Rien qui puisse passer pour une vraie photo sans mention', 'Un texte alternatif rédigé pour les lecteurs d’écran', 'La mention « Image créée avec l’IA » si le doute est possible'])) +
        quiz([
          { q: 'Vous voulez illustrer l’affiche de votre fête de quartier avec les enfants du centre de loisirs.', o: ['Vous déposez leurs photos pour les mettre en scène', 'Vous générez des enfants fictifs, sans photo réelle', 'Vous demandez un dessin « dans le style » d’un studio d’animation connu', 'Vous utilisez la photo d’un enfant trouvée en ligne'], r: 'B', pourquoi: 'Des enfants fictifs ne posent aucun problème de droit à l’image. Les photos réelles de mineurs demandent l’accord des parents et n’ont rien à faire dans un outil tiers ; le style d’un studio connu relève de la contrefaçon.' },
          { q: 'Quand faut-il écrire « Image créée avec l’IA » ?', o: ['Jamais, le filigrane suffit', 'Dès qu’on pourrait croire à une vraie photo', 'Seulement sur les réseaux sociaux', 'Seulement si l’image contient du texte'], r: 'B', pourquoi: 'Le filigrane est invisible pour le public. La mention visible évite de tromper, ce qui est le critère.' },
        ]),
    },
  ],
};

const M2 = {
  nom: 'Module 2 · Écrire une consigne qui donne la bonne image',
  lecons: [
    {
      nom: 'Leçon · La structure d’un bon prompt d’image',
      min: 20,
      html:
        reperes(['Durée : 20 minutes', 'Production : trois prompts construits avec la grille']) +
        h3('Six ingrédients, dans cet ordre') +
        table(
          ['Ingrédient', 'La question', 'Exemple'],
          [
            ['Sujet', 'Qu’est-ce qu’on voit ?', 'une animatrice et trois adolescents'],
            ['Action', 'Que se passe-t-il ?', 'ils construisent une fusée en carton'],
            ['Lieu', 'Où ?', 'dans une salle d’activités colorée'],
            ['Lumière', 'Quelle ambiance ?', 'lumière douce de fin d’après-midi'],
            ['Style', 'Photo, illustration, 3D ?', 'photo réaliste, objectif 35 mm'],
            ['Format', 'Pour quel support ?', 'format carré pour Instagram'],
          ],
        ) +
        p('Un prompt qui suit la grille fait une ou deux phrases. Inutile d’empiler vingt adjectifs : le modèle comprend mieux une phrase descriptive qu’une liste de mots-clés.') +
        h3('Avant, après') +
        table(
          ['Prompt faible', 'Prompt construit'],
          [
            ['« atelier jeunes cool »', '« Photo réaliste d’une animatrice et de trois adolescents qui construisent une fusée en carton dans une salle d’activités colorée, lumière douce de fin d’après-midi, format carré. »'],
            ['« affiche formation »', '« Illustration plate aux couleurs chaudes : une table de réunion vue de dessus, des carnets et un ordinateur, beaucoup d’espace vide en haut pour ajouter un titre, format A4 vertical. »'],
          ],
        ) +
        encart('L’astuce qui change tout', p('Prévoyez l’espace du texte : « laisser le tiers supérieur vide » ou « fond uni à droite ». Vous ajouterez le titre ensuite dans Canva, lisible et sans faute.')) +
        exercice('trois prompts, trois supports', '15 minutes', [
          'Choisissez un événement réel de votre structure.',
          'Écrivez un prompt avec les six ingrédients pour une publication carrée, une bannière horizontale et une affiche verticale.',
          'Générez, comparez, gardez la meilleure et notez ce qui l’a rendue meilleure.',
        ], ['les trois images ont le bon format', 'chacune laisse une zone libre pour le texte']) +
        aRetenir(['Sujet, action, lieu, lumière, style, format.', 'Une phrase descriptive vaut mieux qu’une liste de mots-clés.', 'Le texte se pose après, dans un outil de mise en page.']),
    },
    {
      nom: 'Leçon · Styles, cadrages et vocabulaire de l’image',
      min: 15,
      html:
        reperes(['Durée : 15 minutes', 'Production : votre fiche de vocabulaire personnelle']) +
        h3('Le vocabulaire que le modèle comprend') +
        table(
          ['Pour obtenir', 'Écrivez', 'Effet'],
          [
            ['un plan large', 'plan d’ensemble, vue large', 'on voit le lieu et le groupe'],
            ['un portrait', 'gros plan, portrait serré', 'le visage et l’émotion'],
            ['une vue de dessus', 'vue en plongée, vue du dessus', 'idéal pour les tables, les objets'],
            ['un fond flou', 'faible profondeur de champ', 'le sujet se détache'],
            ['un rendu illustré', 'illustration plate, aquarelle, papier découpé', 'moins réaliste, plus graphique'],
            ['une charte', 'palette : bleu marine, jaune doré, blanc', 'les couleurs de votre structure'],
          ],
        ) +
        h3('Garder une identité visuelle') +
        p('Pour que toutes vos images se ressemblent, gardez une phrase de style fixe que vous collez à la fin de chaque prompt, par exemple : « illustration plate, formes arrondies, palette bleu marine, jaune doré et blanc, beaucoup d’espace ». C’est votre charte en une ligne.') +
        encart('Votre phrase de style', p('Écrivez-la une fois, testez-la sur trois sujets différents, et conservez-la dans un document partagé avec l’équipe.')) +
        aRetenir(['Un cadrage se demande avec des mots de photographe.', 'Une phrase de style fixe fait une identité visuelle.']),
    },
  ],
};

const M3 = {
  nom: 'Module 3 · Retoucher, garder, assembler',
  lecons: [
    {
      nom: 'Leçon · La retouche par la conversation',
      min: 20,
      html:
        reperes(['Durée : 20 minutes', 'Production : une image corrigée en trois demandes']) +
        h3('Une correction à la fois') +
        p('La force de l’outil est de modifier une partie de l’image sans toucher au reste. Il le fait d’autant mieux qu’on lui demande une seule chose à la fois, avec des mots précis.') +
        table(
          ['Demande vague', 'Demande précise'],
          [
            ['« améliore l’image »', '« rends la lumière plus chaude, sans changer les personnages »'],
            ['« change le fond »', '« remplace le mur gris par une bibliothèque en bois, garde le cadrage »'],
            ['« enlève les trucs »', '« retire le gobelet posé sur la table à gauche »'],
          ],
        ) +
        h3('Quand l’image dérive') +
        p('Après plusieurs retouches, l’image peut se dégrader ou changer de visage. Deux réflexes : repartir de la meilleure version en la redonnant à l’outil, ou ouvrir une nouvelle conversation avec un prompt complet.') +
        exercice('trois retouches', '15 minutes', [
          'Générez une image de lieu (salle, jardin, bureau).',
          'Demandez trois modifications successives : la lumière, un objet ajouté, un objet retiré.',
          'Comparez la première et la dernière version : qu’est-ce qui a bougé sans que vous le demandiez ?',
        ], ['chaque demande ne change qu’un élément', 'vous savez repartir d’une version précédente']) +
        aRetenir(['Une demande, une modification.', 'Nommer ce qui doit rester identique.', 'Repartir de la meilleure version quand l’image dérive.']),
    },
    {
      nom: 'Leçon · Un personnage ou un produit qui revient',
      min: 20,
      html:
        reperes(['Durée : 20 minutes', 'Production : une série de trois images cohérentes']) +
        h3('Créer une fiche de personnage') +
        p('Pour une campagne, une mascotte fictive ou un fil rouge de formation, décrivez le personnage une fois pour toutes : âge approximatif, coiffure, vêtement, couleur dominante, attitude. Donnez-lui un nom. Puis réutilisez exactement la même description, ou redonnez la première image en référence, à chaque nouvelle scène.') +
        encart('Exemple de fiche', p('« Lina, une animatrice fictive d’une trentaine d’années, cheveux bouclés attachés, sweat jaune moutarde, carnet toujours à la main, souriante, illustration plate. »')) +
        h3('Assembler plusieurs images') +
        p('Vous pouvez donner deux images, par exemple votre personnage et une photo de votre salle vide, et demander : « place Lina dans cette salle, en train d’accueillir un groupe ». Vérifiez les proportions et les ombres : c’est là que l’assemblage se voit.') +
        alerte('Jamais avec une vraie personne', p('La cohérence de personnage sert pour des personnages fictifs. Mettre en scène une personne réelle dans une situation qu’elle n’a pas vécue est une atteinte à son image, même avec son prénom changé.')) +
        exercice('une mini-série', '20 minutes', [
          'Écrivez la fiche d’un personnage fictif pour votre structure.',
          'Générez-le dans trois scènes : l’accueil, un atelier, la fin de journée.',
          'Vérifiez qu’on le reconnaît dans les trois.',
        ], ['le personnage est reconnaissable d’une image à l’autre']) +
        aRetenir(['Une fiche de personnage réutilisée mot pour mot.', 'La première image sert de référence.', 'Des personnages fictifs, toujours.']),
    },
  ],
};

const M4 = {
  nom: 'Module 4 · Des images utiles pour une association ou un organisme',
  lecons: [
    {
      nom: 'Leçon · Affiches, réseaux sociaux et supports de formation',
      min: 25,
      html:
        reperes(['Durée : 25 minutes', 'Production : un kit de trois visuels pour un même événement']) +
        h3('Trois usages, trois exigences') +
        table(
          ['Support', 'Format', 'Ce qui compte'],
          [
            ['Publication Instagram ou Facebook', 'carré ou vertical 4:5', 'un seul sujet, lisible en petit'],
            ['Bannière de site ou de LinkedIn', 'horizontal large', 'de l’espace pour le titre, sujet sur un côté'],
            ['Affiche imprimée', 'A4 ou A3 vertical', 'haute définition, marges, texte ajouté ensuite'],
            ['Support de formation', 'horizontal 16:9', 'illustrer une idée, jamais décorer pour décorer'],
          ],
        ) +
        h3('La méthode du kit') +
        ol([
          'Écrivez un prompt de base avec votre phrase de style.',
          'Déclinez-le dans les trois formats en changeant seulement la fin : « format carré », « bannière horizontale, sujet à gauche », « affiche verticale, tiers supérieur vide ».',
          'Ajoutez les textes dans un outil de mise en page, avec votre police et votre logo.',
          'Relisez avec la liste de contrôle du module 1.',
        ]) +
        encart('Illustrer une formation', p('Une image de support doit aider à comprendre : une situation professionnelle, un avant et après, une métaphore simple. Si elle n’apporte rien au message, retirez-la : elle distrait.')) +
        exercice('le kit événement', '25 minutes', [
          'Choisissez un événement à venir de votre structure.',
          'Produisez les trois formats avec la méthode du kit.',
          'Ajoutez titre, date et lieu dans un outil de mise en page.',
        ], ['les trois visuels se ressemblent', 'les textes sont nets et sans faute', 'la liste de contrôle est cochée']) +
        aRetenir(['Un prompt de base, trois formats.', 'Le texte s’ajoute après, jamais dans la génération.', 'Une image de formation explique, elle ne décore pas.']),
    },
    {
      nom: 'Leçon · Accessibilité : décrire ses images',
      min: 10,
      html:
        reperes(['Durée : 10 minutes', 'Production : trois textes alternatifs']) +
        h3('Le texte alternatif') +
        p('Une personne aveugle ou malvoyante découvre vos images par un lecteur d’écran, qui lit le texte alternatif. Sans lui, l’image n’existe pas pour elle.') +
        table(
          ['Mauvais', 'Bon'],
          [
            ['« image IA »', '« Trois adolescents construisent une fusée en carton avec une animatrice »'],
            ['« affiche »', '« Affiche de la fête de quartier du samedi 12 : dessin d’un jardin avec des lampions »'],
          ],
        ) +
        ul(['Décrivez ce qu’on voit et ce qui compte pour le message.', 'Une à deux phrases suffisent.', 'Une image purement décorative reçoit un texte alternatif vide.']) +
        aRetenir(['Chaque image publiée a son texte alternatif.', 'On décrit le sens, pas les pixels.']),
    },
  ],
};

const M5 = {
  nom: 'Module 5 · Projet final et évaluation',
  lecons: [
    {
      nom: 'Leçon · Projet final : la campagne visuelle de votre structure',
      min: 45,
      html:
        reperes(['Durée : 45 minutes', 'Production : une campagne de cinq visuels et sa fiche de méthode']) +
        h3('La consigne') +
        p('Vous préparez la communication visuelle d’un projet réel de votre structure : une journée portes ouvertes, un atelier, une formation, une collecte. Livrez :') +
        ol([
          'votre phrase de style et la fiche d’un personnage fictif ;',
          'cinq visuels cohérents : trois formats réseaux sociaux, une bannière, une affiche ;',
          'pour chaque visuel, le prompt utilisé et une retouche demandée ;',
          'les cinq textes alternatifs ;',
          'la liste de contrôle cochée, avec une ligne sur chaque point.',
        ]) +
        h3('La grille d’évaluation') +
        table(
          ['Critère', '0', '1', '2'],
          [
            ['Cohérence visuelle', 'aucune', 'partielle', 'les cinq visuels se ressemblent'],
            ['Qualité des prompts', 'vagues', 'incomplets', 'les six ingrédients sont présents'],
            ['Retouches', 'aucune', 'maladroites', 'une modification précise à chaque fois'],
            ['Règles', 'non respectées', 'en partie', 'liste de contrôle complète et justifiée'],
            ['Accessibilité', 'aucun texte alternatif', 'incomplets', 'cinq textes utiles'],
          ],
        ) +
        p('Le projet est validé à 7 points sur 10, sans aucun 0 sur le critère « Règles ».') +
        encart('Attestation', p('Le projet validé ouvre droit à une attestation de suivi délivrée par ADéPA. Ce n’est ni un diplôme, ni une certification professionnelle enregistrée au RNCP ou au Répertoire spécifique.')),
    },
    {
      nom: 'Leçon · Quiz final',
      min: 10,
      html:
        p('Dix minutes pour vérifier que les réflexes sont là.') +
        quiz([
          { q: 'Quel est le premier ingrédient d’un bon prompt d’image ?', o: ['Le style', 'Le sujet', 'La lumière', 'Le format'], r: 'B', pourquoi: 'On commence par ce qu’on voit : le reste précise le sujet.' },
          { q: 'Le titre de votre affiche sort déformé dans l’image. Que faites-vous ?', o: ['Vous régénérez jusqu’à ce qu’il soit juste', 'Vous laissez un espace vide et ajoutez le titre dans un outil de mise en page', 'Vous écrivez le titre en majuscules dans le prompt', 'Vous renoncez à l’affiche'], r: 'B', pourquoi: 'Le texte long reste fragile dans la génération : on le pose ensuite, net et sans faute.' },
          { q: 'Après cinq retouches, le visage de votre personnage a changé.', o: ['Vous continuez les retouches', 'Vous repartez de la meilleure version ou d’une fiche de personnage complète', 'Vous changez de personnage', 'Vous publiez quand même'], r: 'B', pourquoi: 'L’image dérive quand les retouches s’accumulent : on repart d’une base saine.' },
          { q: 'Un collègue propose de mettre en scène le maire de la commune en train de couper un ruban.', o: ['Bonne idée si c’est flatteur', 'Non : c’est une personne réelle dans une scène qui n’a pas eu lieu', 'Oui avec la mention IA', 'Oui si l’image est en noir et blanc'], r: 'B', pourquoi: 'Une fausse scène avec une personne réelle trompe et porte atteinte à son image, avec ou sans mention.' },
          { q: 'Que met-on dans le texte alternatif d’une image de publication ?', o: ['« image générée par IA »', 'Ce que l’image montre et qui compte pour le message', 'Le prompt utilisé', 'Rien'], r: 'B', pourquoi: 'Le texte alternatif transmet le sens de l’image à ceux qui ne la voient pas.' },
        ]),
    },
  ],
};

const MODULES = [M1, M2, M3, M4, M5];

const FICHE = {
  name: 'Créer des images avec l’IA : Nano Banana, de la première image à la campagne',
  description:
    '<p>Une formation courte et pratique pour produire, avec Nano Banana (le modèle d’images de Google intégré à Gemini), des visuels utiles à une association ou à un organisme : affiches, publications, bannières, supports de formation.</p><p>Cinq modules : comprendre l’outil et ses règles, écrire une consigne qui donne la bonne image, retoucher et garder un personnage cohérent, produire un kit de visuels, puis un projet final sur un vrai projet de votre structure.</p><p>Formation conçue par ADéPA. Elle ne reprend le contenu d’aucune autre formation.</p>',
  target: 'Salariés, bénévoles et responsables de communication d’associations et d’organismes de formation ; toute personne qui prépare des visuels sans être graphiste.',
  goals: '<ul><li>Écrire un prompt d’image complet avec six ingrédients</li><li>Retoucher une image par la conversation, une modification à la fois</li><li>Garder un personnage fictif cohérent sur une série</li><li>Produire un kit de visuels dans trois formats</li><li>Appliquer les règles de droit à l’image, de propriété intellectuelle et d’accessibilité</li></ul>',
  requirements: 'Savoir utiliser un navigateur web et disposer d’un compte Google. Aucune compétence en graphisme n’est demandée.',
};

module.exports = { MODULES, FICHE };
