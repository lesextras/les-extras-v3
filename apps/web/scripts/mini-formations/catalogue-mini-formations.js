/**
 * CATALOGUE DE MINI-FORMATIONS ÉDUCATIVES — architecture et première vague.
 *
 * ── LE PRINCIPE ─────────────────────────────────────────────────────────────
 * Une mini-formation = UNE compétence, acquise et vérifiable. Format court
 * (30 à 45 min), théorie brève, exemples, exercices. Plusieurs formations
 * peuvent partager la même thématique — ce sont alors des compétences
 * DIFFÉRENTES sur le même terrain. C'est ce qui permet de les suivre en
 * complément les unes des autres, en formation continue, sans redondance.
 *
 * ── D'OÙ VIENT LA STRUCTURE ─────────────────────────────────────────────────
 * Des programmes canadiens d'entraînement aux habiletés, dont la séquence de
 * séance est publiée dans la littérature scientifique et dans les documents de
 * santé publique — notamment l'avis de l'INSPQ de 2013 sur les programmes de
 * formation aux habiletés parentales en groupe, qui recense les composantes
 * communes : apport bref, vignettes, mises en situation, jeux de rôle,
 * exercices à la maison, retour en groupe.
 *
 * On reprend UNE idée pédagogique précise, empruntée au programme COPE
 * (C. Cunningham, Université McMaster, Hamilton) : le « coping model ». On ne
 * montre pas un modèle parfait, on montre une situation qui DÉRAPE, et c'est
 * l'apprenant qui produit la solution. C'est un principe pédagogique, pas un
 * contenu : il se reprend librement.
 *
 * ⚠ CE QU'ON NE REPREND PAS, ET C'EST IMPORTANT. Les noms de programme sont
 * des marques déposées : Incredible Years®, Ces années incroyables, SNAP®,
 * Triple P®, Fluppy, Y'a personne de parfait. On peut écrire « inspiré de la
 * structure des programmes canadiens », JAMAIS « programme X ». On ne reprend
 * ni leurs vignettes, ni leurs cahiers, ni la liste ordonnée de leurs modules
 * — c'est leur curriculum, il est protégé. On ne redessine pas non plus la
 * Parenting Pyramid®, y compris redessinée : la marque porte sur l'objet.
 *
 * ── SUR L'ABA, ET POURQUOI ON NE FAIT PAS SEMBLANT ──────────────────────────
 * Les trois premières formations enseignent des principes issus de l'analyse
 * appliquée du comportement. C'est ce qui est demandé sur le terrain et c'est
 * ce qui manque le plus. Mais on ne publie pas de l'ABA des années 1990 :
 * chaque formation de cette thématique porte un encart « ce que cette approche
 * ne doit pas devenir », qui reprend les critiques formulées notamment par des
 * personnes autistes elles-mêmes — l'objectif n'est jamais de faire disparaître
 * un comportement pour le confort de l'entourage, mais de donner à la personne
 * un moyen d'obtenir ce qu'elle cherche. Une formation qui tait ce débat serait
 * en retard, pas à l'avant-garde.
 *
 * ── MODÈLE ÉCONOMIQUE (décidé par Siham le 2/09/2026) ───────────────────────
 * Formation GRATUITE, intégralement. Attestation payante à 20 €, facultative.
 *
 * ⚠ VOCABULAIRE À TENIR : on écrit « ATTESTATION DE SUIVI », jamais
 * « certificat ». Un certificat évoque une certification professionnelle
 * (RNCP, RS), ce que ces formations ne sont pas. Écrire « certificat » créerait
 * une pratique commerciale trompeuse pour 20 €, ce qui est exactement le genre
 * d'erreur qui coûte cher à une association certifiée Qualiopi par ailleurs.
 *
 * ⚠ CONSÉQUENCE À TRAITER AVANT LA MISE EN VENTE : vendre à des particuliers
 * oblige à des CGV propres, à l'information précontractuelle, au droit de
 * rétractation de 14 jours (renonçable pour un contenu numérique fourni
 * immédiatement, à condition de le faire accepter explicitement) et à la
 * désignation d'un MÉDIATEUR DE LA CONSOMMATION (art. L612-1 c. conso).
 * Aucun médiateur n'est nommé à ce jour : c'est déjà signalé dans CLAUDE.md,
 * et cela devient bloquant le jour où l'attestation est vendue.
 */

const ATTESTATION = `<hr style="height:1px;border:0;background:#e5e0d8;margin:28px 0">
<p style="font-size:14px;color:#6b6157"><strong>Attestation de suivi — 20 €, facultative.</strong>
La formation est gratuite du premier au dernier module, sans carte bancaire et sans limite de
temps. Si vous souhaitez une attestation nominative de suivi — pour votre dossier de formation
continue, votre employeur ou votre entretien professionnel —, elle est délivrée pour 20 €.
Elle atteste que vous avez suivi la formation&nbsp;; ce n'est ni un diplôme, ni une
certification professionnelle, ni une action de formation certifiée Qualiopi.</p>`;

const NUANCE_COMPORTEMENTALE = `<hr style="height:1px;border:0;background:#e5e0d8;margin:28px 0">
<h3 style="color:#8a3a2e">Ce que cette approche ne doit jamais devenir</h3>
<p>Les principes enseignés ici viennent de l'analyse appliquée du comportement. Ils sont
efficaces, et ils ont été critiqués — notamment par des personnes autistes adultes, dont
certaines décrivent des prises en charge vécues comme de la mise en conformité. Cette critique
est fondée et elle change la façon de travailler. Quatre garde-fous, non négociables&nbsp;:</p>
<ul>
<li><p><strong>On n'éteint jamais un comportement sans le remplacer.</strong> Un comportement
sert à quelque chose. Le faire disparaître sans donner un autre moyen d'obtenir la même chose,
c'est retirer un outil à quelqu'un qui n'en a pas d'autre.</p></li>
<li><p><strong>On ne travaille pas sur ce qui gêne, on travaille sur ce qui coûte à la
personne.</strong> Un balancement qui apaise et ne blesse personne n'est pas un objectif de
travail. Une difficulté à demander de l'aide, si.</p></li>
<li><p><strong>Le refus est une communication.</strong> Une personne qui refuse dit quelque
chose. Le passage en force enseigne que son avis ne compte pas — et c'est exactement ce qu'on
lui reprochera plus tard de ne pas savoir exprimer.</p></li>
<li><p><strong>Ces outils ne remplacent pas un accompagnement.</strong> Ils s'inscrivent dans
un projet construit avec la personne, sa famille et les professionnels qui la connaissent.</p></li>
</ul>`;

const AVERTISSEMENT = `<hr style="height:1px;border:0;background:#e5e0d8;margin:28px 0">
<p style="font-size:14px;color:#6b6157"><strong>Ce que cette formation n'est pas.</strong>
Elle ne pose aucun diagnostic et ne remplace ni un avis médical, ni un accompagnement éducatif,
ni un suivi psychologique. Elle transmet un geste professionnel, transposable à la maison. Si
une situation vous inquiète, parlez-en à un professionnel qui connaît la personne concernée.</p>`;

/* ══════════════════════════════════════════════════════════════════════════
   THÉMATIQUE 1 — TSA, COMMUNICATION ET COMPORTEMENT
   Trois compétences distinctes sur le même terrain. Elles se suivent dans
   l'ordre : comprendre à quoi sert un comportement, puis donner un autre
   moyen, puis apprendre à s'effacer.
   ══════════════════════════════════════════════════════════════════════════ */

const FONCTIONS = {
  slug: 'les-quatre-fonctions-d-un-comportement',
  thematique: 'TSA, communication et comportement',
  nom: 'Les quatre fonctions d’un comportement',
  competence: 'Identifier à quoi sert un comportement avant de chercher à le modifier',
  trouble: 'Troubles du spectre de l’autisme, troubles du neurodéveloppement, comportements-défis',
  resume:
    'Un comportement qui se répète obtient quelque chose. Quatre fonctions possibles, une grille pour trancher, et la règle qui évite de se tromper de cible.',
  modules: [
    {
      titre: 'Module 1 — La théorie, en huit minutes',
      minutes: 8,
      html: `<h2>Un comportement n'est pas un symptôme, c'est une fonction</h2>
<p>Face à un comportement qui pose problème — crier, frapper, se mordre, fuir, jeter — le premier
réflexe est de chercher à le faire cesser. C'est le réflexe qui échoue le plus souvent, parce
qu'il traite la forme et non la fonction.</p>
<p>Un comportement qui se répète se répète pour une raison&nbsp;: il <em>marche</em>. Il produit un
résultat. La question utile n'est donc pas «&nbsp;comment le faire arrêter&nbsp;?&nbsp;» mais
«&nbsp;qu'est-ce qu'il obtient&nbsp;?&nbsp;»</p>

<h3>Les quatre fonctions</h3>
<p>La littérature comportementale en distingue quatre. Elles couvrent l'essentiel des situations,
et un même comportement peut en servir plusieurs selon le contexte.</p>
<ul>
<li><p><strong>Obtenir de l'attention.</strong> Un adulte se déplace, parle, regarde. Y compris
pour gronder&nbsp;: une réprimande reste de l'attention, et pour quelqu'un qui n'en obtient pas
autrement, c'est la source la plus fiable.</p></li>
<li><p><strong>Obtenir quelque chose de tangible.</strong> Un objet, un aliment, un écran, une
activité. Le comportement est un moyen d'accès.</p></li>
<li><p><strong>Échapper ou éviter.</strong> Une demande, une tâche, un bruit, une personne, un
lieu. C'est la fonction la plus fréquente en établissement, et la plus souvent manquée&nbsp;:
sortir du groupe est très souvent le résultat recherché, pas la sanction subie.</p></li>
<li><p><strong>Sensorielle, ou automatique.</strong> Le comportement produit une sensation qui
suffit en elle-même. Il apparaît alors aussi quand personne ne regarde — c'est le meilleur
indice.</p></li>
</ul>

<h3>Le test qui départage</h3>
<p>Une seule question, et elle est décisive&nbsp;: <em>le comportement apparaît-il quand la
personne est seule&nbsp;?</em></p>
<p>Si oui, la fonction est probablement sensorielle. Si non, elle est sociale — attention, tangible
ou échappement — et la suite de la grille tranche.</p>
${NUANCE_COMPORTEMENTALE}
${AVERTISSEMENT}`,
    },
    {
      titre: 'Module 2 — Une situation qui dérape, et pourquoi',
      minutes: 9,
      html: `<h2>On vous montre d'abord ce qui rate</h2>
<p>C'est le principe retenu tout au long de ce catalogue&nbsp;: plutôt qu'un modèle parfait qu'on
ne reproduira jamais, une situation réelle qui échoue — et c'est vous qui trouvez pourquoi.</p>

<h3>La situation</h3>
<p>Léo, 9 ans, IME. Chaque matin, au moment de l'atelier écrit, il jette son classeur au sol et
sort de la salle. L'éducatrice le suit dans le couloir, s'assoit avec lui, lui explique
calmement que ce n'est pas acceptable, et lui propose de revenir quand il sera prêt. Il revient
au bout de quinze minutes. L'atelier est terminé.</p>
<p>L'équipe applique cette réponse depuis trois semaines, avec constance et bienveillance. Le
comportement augmente.</p>

<h3>Cherchez avant de lire la suite</h3>
<p>Prenez trente secondes. Qu'est-ce que le comportement de Léo obtient&nbsp;? Écrivez-le.</p>

<h3>Ce qui se passe réellement</h3>
<p>Le comportement obtient <strong>deux</strong> choses, et la réponse de l'équipe les délivre
toutes les deux à chaque fois&nbsp;:</p>
<ul>
<li><p><strong>L'échappement&nbsp;:</strong> l'atelier écrit n'a pas lieu. C'est probablement la
fonction principale.</p></li>
<li><p><strong>L'attention&nbsp;:</strong> quinze minutes d'adulte pour lui seul, dans le couloir.
En groupe, il ne les obtient jamais.</p></li>
</ul>
<p>Autrement dit&nbsp;: la réponse de l'équipe, qui est bienveillante et constante, <em>renforce</em>
exactement ce qu'elle cherche à réduire. Ce n'est pas une erreur de posture, c'est une erreur
d'analyse — et c'est pour cela qu'on ne peut pas répondre à un comportement sans en connaître la
fonction.</p>

<h3>Ce que l'analyse ouvre</h3>
<p>Si la fonction est l'échappement, alors la question devient&nbsp;: <em>pourquoi l'atelier écrit
est-il insupportable&nbsp;?</em> Écriture douloureuse&nbsp;? Consigne trop longue&nbsp;? Peur de
l'échec devant les autres&nbsp;? Et surtout&nbsp;: <em>comment Léo pourrait-il obtenir une pause
autrement&nbsp;?</em> C'est là que le travail commence, et ce n'est pas du tout le même travail.</p>
${AVERTISSEMENT}`,
    },
    {
      titre: 'Module 3 — Exercice guidé : la grille en quatre colonnes',
      minutes: 10,
      html: `<h2>La grille</h2>
<p>Quatre colonnes, remplies sur cinq occurrences du même comportement. Pas moins de cinq&nbsp;:
c'est le nombre à partir duquel un motif apparaît.</p>
<table style="width:100%;border-collapse:collapse;font-size:15px">
<tr style="background:#f2f0eb"><th style="padding:8px;text-align:left;border:1px solid #e5e0d8">Quand / où</th><th style="padding:8px;text-align:left;border:1px solid #e5e0d8">Juste avant</th><th style="padding:8px;text-align:left;border:1px solid #e5e0d8">Le comportement</th><th style="padding:8px;text-align:left;border:1px solid #e5e0d8">Juste après</th></tr>
<tr><td style="padding:8px;border:1px solid #e5e0d8">Mardi 9h15, salle 2</td><td style="padding:8px;border:1px solid #e5e0d8">Consigne d'écriture donnée</td><td style="padding:8px;border:1px solid #e5e0d8">Jette le classeur, sort</td><td style="padding:8px;border:1px solid #e5e0d8">Adulte le suit, 15 min couloir, pas d'atelier</td></tr>
</table>

<h3>Trois règles de remplissage</h3>
<ul>
<li><p><strong>Colonne 3&nbsp;: du factuel, uniquement.</strong> «&nbsp;Jette le classeur&nbsp;»,
pas «&nbsp;s'énerve&nbsp;». Si vous ne pouvez pas le filmer, ce n'est pas un comportement
observable.</p></li>
<li><p><strong>Colonne 4&nbsp;: ce que font les adultes AUSSI.</strong> C'est la colonne qu'on
remplit le moins bien, parce qu'elle nous implique. C'est aussi celle qui donne la réponse.</p></li>
<li><p><strong>On remplit dans la minute</strong>, pas le soir. Un souvenir de fin de journée est
déjà une interprétation.</p></li>
</ul>

<h3>Lire la grille</h3>
<p>Au bout de cinq lignes, posez-vous ces questions dans l'ordre&nbsp;:</p>
<ol>
<li><p>La colonne 2 se répète-t-elle&nbsp;? → vous tenez le déclencheur.</p></li>
<li><p>La colonne 4 se répète-t-elle&nbsp;? → vous tenez la fonction.</p></li>
<li><p>Le comportement apparaît-il aussi quand personne n'est là&nbsp;? → fonction sensorielle,
et la grille sociale ne s'applique pas.</p></li>
</ol>

<h3>Le piège le plus fréquent</h3>
<p>Conclure après deux lignes. Deux occurrences donnent une hypothèse&nbsp;; cinq donnent un
motif. Une équipe qui décide d'un plan après deux observations se trompe environ une fois sur
deux, et perd ensuite trois semaines à appliquer une réponse inadaptée avec constance.</p>
${AVERTISSEMENT}`,
    },
    {
      titre: 'Module 4 — Mise en pratique et auto-observation',
      minutes: 12,
      html: `<h2>Votre semaine</h2>
<p>Choisissez UN comportement. Un seul — celui qui vous coûte le plus. Remplissez la grille sur
cinq occurrences, sur une semaine au maximum.</p>
<p>Puis répondez par écrit à ces trois questions&nbsp;:</p>
<ol>
<li><p><strong>Quelle est la fonction la plus probable&nbsp;?</strong> Attention, tangible,
échappement, sensorielle.</p></li>
<li><p><strong>Qu'est-ce que la personne obtient, et que fait notre réponse&nbsp;?</strong>
Soyez honnête sur ce point&nbsp;: c'est là que se trouve la marge de manœuvre.</p></li>
<li><p><strong>Par quel autre moyen pourrait-elle obtenir la même chose&nbsp;?</strong> Ce moyen
doit être plus rapide et moins coûteux que le comportement actuel, sinon il ne sera pas
adopté.</p></li>
</ol>

<h2>Auto-observation</h2>
<p>Notez aussi ce qui vous concerne&nbsp;: à quel moment de votre journée avez-vous le moins de
disponibilité pour appliquer une réponse réfléchie&nbsp;? C'est presque toujours la même plage
horaire, et c'est presque toujours celle où le comportement apparaît. Ce n'est pas une
coïncidence.</p>

<h2>Vous savez maintenant</h2>
<ul>
<li><p>nommer les quatre fonctions et les distinguer&nbsp;;</p></li>
<li><p>remplir une grille en quatre colonnes sur cinq occurrences&nbsp;;</p></li>
<li><p>repérer quand votre propre réponse renforce ce que vous voulez réduire.</p></li>
</ul>
<p>Ce que vous ne savez pas encore faire&nbsp;: construire le comportement de remplacement. C'est
l'objet de la formation suivante, «&nbsp;Apprendre à demander plutôt qu'à crier&nbsp;», qui prend
la suite exactement ici.</p>
${ATTESTATION}
${AVERTISSEMENT}`,
    },
  ],
};

const DEMANDER = {
  slug: 'apprendre-a-demander-plutot-qu-a-crier',
  thematique: 'TSA, communication et comportement',
  nom: 'Apprendre à demander plutôt qu’à crier',
  competence: 'Installer un comportement de demande qui remplace le comportement-défi',
  trouble: 'Troubles du spectre de l’autisme, communication peu ou pas verbale, comportements-défis',
  resume:
    'Le comportement de remplacement, pas à pas : le choisir, le rendre plus rentable que celui qu’il remplace, et tenir les deux premières semaines.',
  modules: [
    {
      titre: 'Module 1 — La théorie, en huit minutes',
      minutes: 8,
      html: `<h2>On ne retire rien sans donner autre chose</h2>
<p>Un comportement-défi est souvent la solution la plus efficace qu'une personne ait trouvée pour
obtenir ce dont elle a besoin. Le supprimer sans rien mettre à la place, c'est retirer un outil à
quelqu'un qui n'en a pas d'autre. Le comportement revient, ou un autre le remplace — généralement
pire.</p>
<p>La règle tient en une phrase&nbsp;: <strong>on n'enlève un comportement qu'en installant un
autre moyen d'obtenir la même chose.</strong> C'est ce qu'on appelle un comportement de
remplacement.</p>

<h3>Les trois conditions d'un remplacement qui tient</h3>
<ul>
<li><p><strong>Même fonction.</strong> Si le comportement servait à échapper à une tâche, le
remplacement doit permettre d'échapper à la tâche. Proposer un moyen d'obtenir de l'attention à
quelqu'un qui cherchait une pause ne marchera jamais.</p></li>
<li><p><strong>Moins coûteux.</strong> La nouvelle façon doit demander moins d'effort que
l'ancienne. Une phrase complète à prononcer est plus coûteuse qu'un cri&nbsp;: elle perdra. Un
geste, une image, un mot suffisent.</p></li>
<li><p><strong>Plus rapide et plus fiable.</strong> La demande doit marcher <em>à tous les
coups</em> au début, et immédiatement. Une demande honorée une fois sur deux enseigne qu'il vaut
mieux crier.</p></li>
</ul>

<h3>Trois exemples de remplacement</h3>
<ul>
<li><p>Fonction <em>échappement</em> → une carte «&nbsp;pause&nbsp;» que la personne tend, et qui
donne une pause de deux minutes, sans discussion.</p></li>
<li><p>Fonction <em>attention</em> → taper deux fois sur la table, ou un geste convenu, qui fait
venir l'adulte.</p></li>
<li><p>Fonction <em>tangible</em> → une image de l'objet à donner, ou le mot, ou le signe.</p></li>
</ul>
${NUANCE_COMPORTEMENTALE}
${AVERTISSEMENT}`,
    },
    {
      titre: 'Module 2 — Une situation qui dérape, et pourquoi',
      minutes: 9,
      html: `<h2>La situation</h2>
<p>Une équipe met en place une carte «&nbsp;pause&nbsp;» pour Sofia, 14 ans, qui quitte
brutalement les temps collectifs. La carte est plastifiée, expliquée, affichée. Trois semaines
plus tard, Sofia ne l'utilise jamais et continue de partir.</p>

<h3>Cherchez avant de lire la suite</h3>
<p>Trois raisons possibles. Écrivez-en au moins deux.</p>

<h3>Ce qui s'est passé, en réalité</h3>
<p>Trois erreurs, et ce sont les trois plus fréquentes.</p>
<ul>
<li><p><strong>La carte est rangée dans un tiroir du bureau.</strong> Une demande doit être
disponible à l'instant où le besoin apparaît. Si elle demande de traverser la pièce, elle est
déjà plus coûteuse que de partir.</p></li>
<li><p><strong>La pause a été négociée deux fois sur trois.</strong> «&nbsp;Attends la fin de
l'exercice.&nbsp;» Une seule négociation suffit à enseigner que la carte n'est pas fiable — et
la fiabilité est la seule chose qui la rend préférable au départ brutal.</p></li>
<li><p><strong>Personne n'a guidé les premières fois.</strong> On a expliqué la carte, on n'a pas
accompagné son usage au moment où le besoin apparaissait. Une explication n'installe pas un
comportement.</p></li>
</ul>

<h3>La règle qui en découle</h3>
<p>Pendant les deux premières semaines, la demande est <strong>honorée à 100&nbsp;%,
immédiatement, sans condition</strong>. Y compris quand elle tombe mal. Cette phase paraît
excessive et coûteuse&nbsp;: c'est elle qui décide de tout. On ne commence à espacer qu'une fois
la demande installée, et progressivement.</p>
${AVERTISSEMENT}`,
    },
    {
      titre: 'Module 3 — Exercice guidé : construire le remplacement',
      minutes: 10,
      html: `<h2>La fiche de remplacement</h2>
<p>Six lignes à remplir avant toute mise en œuvre. Une équipe qui ne peut pas les remplir n'est
pas prête, et le dispositif échouera.</p>
<ol>
<li><p><strong>Le comportement actuel</strong>, décrit de façon observable.</p></li>
<li><p><strong>Sa fonction</strong>, établie sur cinq observations (formation précédente).</p></li>
<li><p><strong>Le comportement de remplacement</strong>&nbsp;: quel geste, quel objet, quel
mot&nbsp;? Choisissez ce que la personne sait <em>déjà</em> faire — on n'apprend pas un nouveau
geste et une nouvelle règle en même temps.</p></li>
<li><p><strong>Où se trouve le support</strong>, à chaque instant de la journée. Écrivez les
lieux, un par un.</p></li>
<li><p><strong>Ce qu'on donne, et en combien de temps.</strong> Soyez précis&nbsp;: «&nbsp;pause
de deux minutes dans le couloir, dans les cinq secondes&nbsp;».</p></li>
<li><p><strong>Qui guide les dix premières fois</strong>, et comment.</p></li>
</ol>

<h3>Le guidage des premières fois</h3>
<p>On n'attend pas que la personne pense à la carte&nbsp;: on la lui met en main <em>au moment où
l'on voit monter le comportement</em>, et on honore aussitôt. On associe ainsi le geste au
résultat. Ce n'est pas de la triche&nbsp;: c'est de l'apprentissage.</p>
<p>Et on retire le guidage progressivement — c'est l'objet de la formation
«&nbsp;Guider puis s'effacer&nbsp;», qui traite exactement ce point.</p>

<h3>Un piège à connaître</h3>
<p>Dans les premiers jours, la demande peut devenir très fréquente&nbsp;: vingt cartes
«&nbsp;pause&nbsp;» dans la matinée. C'est un <strong>bon</strong> signe, et non un échec&nbsp;: la
personne a compris que ça marche. La fréquence redescend d'elle-même une fois la fiabilité
établie. Restreindre à ce moment-là casse tout ce qui vient d'être construit.</p>
${AVERTISSEMENT}`,
    },
    {
      titre: 'Module 4 — Mise en pratique et auto-observation',
      minutes: 12,
      html: `<h2>Vos deux semaines</h2>
<p>Semaine 1&nbsp;: le remplacement est guidé et honoré à 100&nbsp;%. On ne compte rien d'autre que
le nombre de demandes.</p>
<p>Semaine 2&nbsp;: le guidage s'allège. On note deux chiffres par jour — nombre de demandes
spontanées, nombre d'occurrences du comportement d'origine.</p>

<h2>Ce que la courbe doit montrer</h2>
<p>Les demandes montent d'abord fortement, puis se stabilisent. Le comportement d'origine baisse
avec un retard de quelques jours. Si au bout de deux semaines rien n'a bougé, ne persévérez pas
davantage&nbsp;: reprenez la fonction. Dans neuf cas sur dix, elle avait été mal identifiée.</p>

<h2>Auto-observation</h2>
<p>Notez chaque fois que vous n'avez PAS honoré la demande, et pourquoi. Sans vous juger. Cette
liste est l'information la plus utile de tout le dispositif&nbsp;: elle dit à quelles conditions
il tient dans votre organisation réelle, et non dans l'organisation idéale.</p>

<h2>Vous savez maintenant</h2>
<ul>
<li><p>choisir un comportement de remplacement de même fonction, moins coûteux et plus
fiable&nbsp;;</p></li>
<li><p>remplir une fiche de remplacement en six lignes&nbsp;;</p></li>
<li><p>tenir la phase de 100&nbsp;%, et reconnaître une explosion de demandes comme un
succès.</p></li>
</ul>
${ATTESTATION}
${AVERTISSEMENT}`,
    },
  ],
};

const GUIDAGE = {
  slug: 'guider-puis-s-effacer',
  thematique: 'TSA, communication et comportement',
  nom: 'Guider puis s’effacer',
  competence: 'Doser une aide et la retirer progressivement sans créer de dépendance',
  trouble: 'Troubles du spectre de l’autisme, déficience intellectuelle, troubles des apprentissages',
  resume:
    'L’aide qui devient une habitude est le problème le plus courant et le moins repéré. La hiérarchie des guidages, le sens du retrait, et comment mesurer qu’on s’efface vraiment.',
  modules: [
    {
      titre: 'Module 1 — La théorie, en sept minutes',
      minutes: 7,
      html: `<h2>Le paradoxe de l'aide</h2>
<p>Aider quelqu'un à réussir est ce qu'on fait de plus naturel. C'est aussi ce qui, mal dosé, crée
la dépendance la plus tenace&nbsp;: une personne qui réussit toujours <em>avec</em> l'aide n'a
aucune raison d'apprendre à faire sans.</p>
<p>Le phénomène a un nom sur le terrain&nbsp;: la dépendance au guidage. Il se repère à un signe
très simple — la personne attend, regarde l'adulte, et ne démarre pas tant qu'un signal n'est pas
venu. Ce n'est pas de la passivité&nbsp;: c'est un apprentissage réussi, mais du mauvais
comportement.</p>

<h3>La hiérarchie des guidages, du plus fort au plus léger</h3>
<ol>
<li><p><strong>Physique complet</strong>&nbsp;: on fait le geste avec la personne, main sur la
main. Le plus intrusif — à n'utiliser que si rien d'autre ne fonctionne, et avec son accord.</p></li>
<li><p><strong>Physique partiel</strong>&nbsp;: une amorce, un contact au coude, on lâche.</p></li>
<li><p><strong>Modelage</strong>&nbsp;: on montre le geste, la personne le reproduit.</p></li>
<li><p><strong>Verbal</strong>&nbsp;: on dit quoi faire. Attention&nbsp;: c'est le guidage dont on
se défait le plus difficilement, parce qu'il ne se voit pas.</p></li>
<li><p><strong>Gestuel</strong>&nbsp;: on montre du doigt, on oriente le regard.</p></li>
<li><p><strong>Visuel</strong>&nbsp;: une image, une liste, une couleur. Le plus léger, et souvent
le seul qui doive rester à la fin.</p></li>
</ol>

<h3>Les deux sens du retrait</h3>
<p><strong>Du plus fort au plus léger</strong> — on commence par la main sur la main et on
allège. La réussite est garantie dès le début, l'échec quasi impossible. C'est le choix pour une
personne en difficulté ou qui supporte mal l'erreur.</p>
<p><strong>Du plus léger au plus fort</strong> — on laisse d'abord essayer seul et on n'ajoute
d'aide que si nécessaire. Plus rapide, et surtout plus respectueux de l'autonomie&nbsp;: on
n'aide qu'à hauteur du besoin réel. C'est le choix par défaut chaque fois qu'il est possible.</p>
${NUANCE_COMPORTEMENTALE}
${AVERTISSEMENT}`,
    },
    {
      titre: 'Module 2 — Une situation qui dérape, et pourquoi',
      minutes: 8,
      html: `<h2>La situation</h2>
<p>Karim, 17 ans, ESAT. Il sait mettre la table&nbsp;: il l'a fait des centaines de fois. Chaque
midi, le moniteur l'accompagne et lui dit «&nbsp;les assiettes&nbsp;», puis «&nbsp;les
verres&nbsp;», puis «&nbsp;les couverts&nbsp;». Karim exécute parfaitement à chaque fois.</p>
<p>Un jour, le moniteur est absent. Karim reste debout devant le chariot, sans rien faire, pendant
dix minutes.</p>

<h3>Cherchez avant de lire la suite</h3>
<p>Karim sait-il mettre la table&nbsp;? Répondez par oui ou par non, et justifiez.</p>

<h3>La réponse</h3>
<p>Non. Karim sait <em>exécuter une consigne verbale</em>. Ce n'est pas la même compétence, et le
dispositif quotidien a soigneusement entretenu la confusion pendant des mois.</p>
<p>Le guidage verbal a ceci de particulier qu'il ne se voit pas. Personne, dans l'équipe, n'aurait
dit «&nbsp;on l'aide&nbsp;»&nbsp;: on lui parlait, simplement. C'est pour cette raison que la
dépendance au guidage verbal est la plus fréquente et la plus longue à repérer.</p>

<h3>Ce qu'il aurait fallu faire</h3>
<p>Remplacer la parole par un support visuel dès que la séquence était acquise&nbsp;: une bande de
trois images, affichée sur le chariot. Puis retirer les images une par une, en commençant par la
dernière — celle dont la personne a le moins besoin, puisqu'elle est déjà lancée.</p>
<p>Le repère à retenir&nbsp;: <strong>un guidage qui dure plus de deux semaines sans s'alléger
n'est plus un guidage, c'est devenu une partie de la tâche.</strong></p>
${AVERTISSEMENT}`,
    },
    {
      titre: 'Module 3 — Exercice guidé : le plan d’estompage',
      minutes: 10,
      html: `<h2>Le plan en cinq lignes</h2>
<p>Il s'écrit avant de commencer, pas en cours de route.</p>
<ol>
<li><p><strong>La tâche</strong>, décomposée en étapes observables. Trois à sept étapes&nbsp;:
au-delà, on redécoupe.</p></li>
<li><p><strong>Le niveau de guidage de départ</strong>, étape par étape. Il n'est pas le même
partout&nbsp;: c'est le point le plus souvent oublié.</p></li>
<li><p><strong>Le critère de passage au niveau inférieur.</strong> Par exemple&nbsp;: trois
réussites consécutives sur deux jours différents. Écrivez-le, sinon il n'existe pas.</p></li>
<li><p><strong>Le niveau final visé.</strong> Ce n'est pas toujours zéro aide&nbsp;: un support
visuel permanent est une réussite, pas un échec. Le but est l'autonomie, pas la performance sans
aide.</p></li>
<li><p><strong>Qui note, et où.</strong> Un plan d'estompage sans relevé ne s'estompe jamais&nbsp;:
il se poursuit à l'identique parce que personne ne voit qu'il faudrait alléger.</p></li>
</ol>

<h3>Trois erreurs classiques</h3>
<ul>
<li><p><strong>Alléger trop vite parce que ça se passe bien.</strong> Trois réussites d'affilée ne
sont pas une acquisition, ce sont trois réussites. Le critère doit être écrit à l'avance,
précisément pour résister à l'enthousiasme.</p></li>
<li><p><strong>Remettre l'aide au premier échec.</strong> Un échec isolé est normal. On ne
remonte d'un niveau qu'après deux échecs consécutifs — sinon la courbe fait du surplace pendant
des mois.</p></li>
<li><p><strong>Changer d'intervenant sans transmettre le plan.</strong> Le remplaçant du vendredi
guide au niveau qui lui semble naturel, et défait trois semaines de travail sans le savoir. Le
plan doit être affiché, pas rangé.</p></li>
</ul>
${AVERTISSEMENT}`,
    },
    {
      titre: 'Module 4 — Mise en pratique et auto-observation',
      minutes: 11,
      html: `<h2>Votre semaine</h2>
<p>Choisissez UNE tâche que la personne fait quotidiennement avec votre aide. Écrivez le plan
d'estompage en cinq lignes. Appliquez-le une semaine. Notez chaque jour le niveau de guidage
réellement utilisé, étape par étape.</p>

<h2>Le test de l'absence</h2>
<p>À la fin de la semaine, faites une chose et une seule&nbsp;: <strong>ne dites rien</strong>.
Restez présent, disponible, et attendez trente secondes avant d'intervenir. Ce que la personne
fait pendant ces trente secondes est ce qu'elle sait faire. Le reste est ce que vous faites.</p>
<p>C'est un test inconfortable et il est très instructif. Beaucoup d'équipes découvrent à ce
moment-là qu'une compétence considérée comme acquise depuis un an ne l'est pas — et,
inversement, que trois autres n'avaient plus besoin d'aide depuis longtemps.</p>

<h2>Auto-observation</h2>
<p>Notez ce qui vous pousse à intervenir avant les trente secondes. Le temps qui presse&nbsp;? La
gêne de voir quelqu'un chercher&nbsp;? Le regard d'un collègue&nbsp;? C'est presque toujours l'une
de ces trois raisons, et aucune ne concerne la personne accompagnée.</p>

<h2>Vous savez maintenant</h2>
<ul>
<li><p>nommer les six niveaux de guidage et choisir un sens de retrait&nbsp;;</p></li>
<li><p>écrire un plan d'estompage avec un critère de passage explicite&nbsp;;</p></li>
<li><p>repérer une dépendance au guidage verbal, la plus invisible de toutes.</p></li>
</ul>
${ATTESTATION}
${AVERTISSEMENT}`,
    },
  ],
};

/* ══════════════════════════════════════════════════════════════════════════
   LE CATALOGUE COMPLET — première vague écrite, suite planifiée.
   ══════════════════════════════════════════════════════════════════════════ */

const VAGUE_1 = [FONCTIONS, DEMANDER, GUIDAGE];

/**
 * La suite du catalogue, thématique par thématique. Chaque ligne est une
 * compétence distincte : plusieurs formations partagent une thématique sans
 * jamais se recouvrir, ce qui permet de les suivre en complément.
 *
 * Les cinq formations marquées (écrite) existent déjà en toutes lettres dans
 * `formations-gratuites.js` et n'attendent qu'un reformatage au gabarit à
 * quatre modules ci-dessus.
 */
const CATALOGUE_PREVU = [
  {
    thematique: 'TSA, communication et comportement',
    formations: [
      'Les quatre fonctions d’un comportement ✔ écrite',
      'Apprendre à demander plutôt qu’à crier ✔ écrite',
      'Guider puis s’effacer ✔ écrite',
      'Décomposer une routine en étapes (le chaînage)',
      'Rendre l’environnement prévisible : supports visuels et repères de temps',
    ],
  },
  {
    thematique: 'TDAH, attention et autorégulation',
    formations: [
      'Donner une consigne qui soit suivie (écrite)',
      'Préparer une transition (écrite)',
      'Découper une tâche trop longue',
      'Paramétrer un système de jetons qui ne s’effondre pas',
    ],
  },
  {
    thematique: 'Comportements-défis et opposition',
    formations: [
      'Traverser une crise sans l’aggraver (écrite)',
      'Renforcer ce qui va (écrite)',
      'L’ignorance intentionnelle : ce qu’elle est, et quand elle est dangereuse',
      'Poser une conséquence logique plutôt qu’une punition',
      'Résoudre un problème avec la personne plutôt que contre elle',
    ],
  },
  {
    thematique: 'Anxiété et évitement',
    formations: [
      'Accompagner un évitement sans le nourrir',
      'Construire une exposition graduée',
    ],
  },
  {
    thematique: 'Observer et écrire (professionnels)',
    formations: [
      'Décrire un comportement sans le juger (écrite)',
      'Mesurer un comportement : ligne de base et courbe',
    ],
  },
];

module.exports = { VAGUE_1, CATALOGUE_PREVU, ATTESTATION, AVERTISSEMENT, NUANCE_COMPORTEMENTALE };
