/**
 * F14 — RÉSOUDRE UN PROBLÈME AVEC LA PERSONNE PLUTÔT QUE CONTRE ELLE
 *
 * Compétence : chercher la solution à deux, et tenir l'accord obtenu.
 *
 * ── POURQUOI CE PARCOURS, ET POURQUOI AU NIVEAU 3 ──────────────────────────
 * Les douze autres parcours outillent l'adulte : comprendre à quoi sert un
 * comportement, donner un autre moyen, rendre l'environnement prévisible,
 * renforcer, décomposer, mesurer. Tous ont le même angle mort : c'est l'adulte
 * qui décide de la solution, même quand il la décide bien.
 *
 * Celui-ci fait l'inverse, et c'est pour ça qu'il est au niveau 3 : il demande
 * de savoir déjà décrire un comportement sans le juger, et il demande surtout
 * d'accepter de ne pas connaître la solution en entrant dans la pièce. C'est la
 * compétence la plus difficile du catalogue, et elle n'est pas technique.
 *
 * ── LES SEPT GARDE-FOUS QUI TIENNENT CE TEXTE, ET QU'IL NE FAUT PAS DÉFAIRE ─
 *
 * 1. ON NE NÉGOCIE JAMAIS LA SÉCURITÉ, et on ne négocie pas une limite qui
 *    n'est pas négociable. Le module 1 fait TRIER avant d'ouvrir la bouche, et
 *    la limite s'annonce dans la même phrase que l'invitation — pas après,
 *    quand la personne a déjà proposé quelque chose qu'on va lui refuser.
 *
 * 2. LA CONVERSATION SE TIENT À FROID. Jamais pendant, jamais dans les minutes
 *    qui suivent. Pendant, c'est « Les premières minutes d'une crise », et le
 *    module 1 y renvoie explicitement.
 *
 * 3. LE CONSENTEMENT N'EST PAS UNE FORMALITÉ. Si la personne ne veut pas
 *    parler maintenant, on reporte, et on le lui dit sans en faire un reproche.
 *    Une résolution « à deux » imposée est une résolution imposée : elle porte
 *    juste un nom plus flatteur.
 *
 * 4. ON NE DEMANDE JAMAIS « POURQUOI TU AS FAIT ÇA ». C'est la question qui
 *    ferme : elle demande une justification et non une information, et la
 *    plupart des gens — enfants comme adultes — ne connaissent pas la réponse.
 *    Le module 3 donne les questions qui ouvrent, à la place.
 *
 * 5. CE N'EST PAS UN OUTIL POUR OBTENIR UN AVEU, ni pour faire accepter une
 *    sanction décidée d'avance. Une conversation menée pour ça se reconnaît en
 *    une ligne : l'adulte connaît déjà la solution avant d'entrer. Le module 2
 *    dissèque exactement ce cas.
 *
 * 6. SI LA PERSONNE N'A PAS DE MOYEN DE DONNER SON POINT DE VUE, la première
 *    chose à faire n'est pas cette conversation : c'est le moyen de
 *    communication. Le module 1 renvoie à « Apprendre à demander plutôt qu'à
 *    crier », et il le dit avant toute technique.
 *
 * 7. UN ACCORD QUI NE TIENT PAS ACCUSE L'ACCORD, PAS LA PERSONNE. Mêmes termes
 *    que la courbe plate de « Mesurer un comportement » : le module 4 nomme les
 *    quatre causes, et aucune des quatre n'est « elle n'a pas voulu ».
 *
 * ── CE QU'ON N'ENSEIGNE PAS, ET POURQUOI ───────────────────────────────────
 * ⚠ AUCUN NOM DE PROGRAMME. La structure en trois temps — comprendre le point
 * de vue de la personne, énoncer le sien, chercher ensemble — se retrouve dans
 * plusieurs approches nord-américaines de résolution collaborative et dans la
 * littérature de négociation raisonnée. Les noms de ces programmes sont des
 * marques déposées, leurs grilles et leurs scripts leur appartiennent : on
 * enseigne le geste, jamais leur matériel, et on ne cite aucune marque.
 *
 * ⚠ AUCUNE RÉFÉRENCE JURIDIQUE AU-DELÀ DE L311-3 DU CASF (accès de la personne
 * aux informations qui la concernent, et participation directe au projet
 * d'accueil et d'accompagnement). Le reste — recueillir le point de vue de la
 * personne, tracer l'accord — est présenté comme une PRATIQUE DE MÉTIER, parce
 * que c'en est une. Voir la discipline déjà tenue dans « Préparer une ESS ».
 *
 * ⚠ CE PARCOURS NE VIENT PAS DE L'ANALYSE APPLIQUÉE DU COMPORTEMENT : il ne
 * doit PAS figurer dans `COMPORTEMENTALES` de `build-v2.js`, et sa fiche
 * publique ne porte pas le `GARDE_FOU`. Y coller l'encart laisserait croire que
 * le contenu en vient, ce qui serait faux — même raisonnement que pour
 * « L'enfant qui dit non à tout » et « Préparer une ESS ». Ses garde-fous à lui
 * sont dans le corps du texte, et ils sont plus adaptés.
 */

const G = require('./gabarit-v3.js');
const A = require('./annexes.js');
const S = require('./schemas.js');
const Q = require('./quiz/resoudre-un-probleme-avec-la-personne.js');

/* ── FIGURES ─────────────────────────────────────────────────────────────── */

const CARTE = S.figure({
  numero: 1,
  titre: 'La carte du parcours',
  corps: S.carte({
    modules: [
      { titre: 'Module 1', produit: 'le tri de VOS trois problèmes récurrents' },
      { titre: 'Module 2', produit: 'une conversation ratée, disséquée' },
      { titre: 'Module 3', produit: 'votre conversation préparée, mot pour mot' },
      { titre: 'Module 4', produit: 'l’accord relu, et le deuxième tour' },
    ],
    releve:
      '<strong>Entre le module 3 et le module 4&nbsp;:</strong> vous tenez la conversation, puis dix jours pour voir si l’accord tient. Le module 4 porte sur VOTRE accord — il ne se lit pas avant.',
  }),
  legende:
    'Les trois premiers modules se lisent dans l’après-midi. Le quatrième demande d’avoir tenu la conversation, et d’avoir laissé passer dix jours.',
});

const TRI = S.figure({
  numero: 2,
  titre: 'Quelle sorte de problème avez-vous devant vous&nbsp;?',
  corps: S.arbre({
    question:
      'Avant d’ouvrir la bouche&nbsp;: de quoi s’agit-il exactement&nbsp;?',
    branches: [
      {
        condition: 'Quelqu’un est en danger, maintenant',
        contenu:
          '<strong>On agit.</strong> On ne cherche pas de solution à deux pendant qu’une personne se blesse ou en blesse une autre. La conversation viendra, à froid, plus tard. Voir «&nbsp;Les premières minutes d’une crise&nbsp;».',
      },
      {
        condition: 'C’est une limite qui ne se négocie pas',
        contenu:
          '<strong>On l’annonce, on ne la discute pas.</strong> Et on l’annonce AVANT d’inviter à chercher — pas après avoir laissé la personne proposer quelque chose qu’on va lui refuser. Ce qui reste négociable autour de la limite, lui, se cherche à deux.',
      },
      {
        condition: 'Ça revient, et ça coûte à la personne',
        contenu:
          '<strong>C’est le terrain de ce parcours.</strong> Un problème récurrent, identifiable, qui lui ferme quelque chose — une activité, un lien, une possibilité. C’est là que chercher à deux vaut mieux qu’imposer.',
      },
      {
        condition: 'Ça ne gêne que l’équipe',
        contenu:
          'On laisse. Ouvrir une conversation de résolution sur ce qui n’arrange que nous, c’est demander à quelqu’un de résoudre notre problème à notre place — et il le sentira.',
      },
    ],
  }),
  legende:
    'Les quatre branches se décident AVANT la conversation, sur le papier. Une conversation ouverte sur la mauvaise branche ne se rattrape pas en cours de route.',
});

const TROIS = S.figure({
  numero: 3,
  titre: 'Les trois temps, et leur ordre',
  corps: S.flux([
    {
      nom: '1. Son point de vue',
      quoi:
        'On demande, et on se tait. On reformule jusqu’à ce que la personne dise «&nbsp;oui, c’est ça&nbsp;». Tant qu’elle ne l’a pas dit, on n’avance pas.',
    },
    {
      nom: '2. Le vôtre',
      quoi:
        'Une phrase, deux au plus. Ce qui vous préoccupe, et pourquoi — pas ce que vous voulez qu’elle fasse. Une solution énoncée ici referme la conversation.',
    },
    {
      nom: '3. Ensemble',
      quoi:
        'On invite&nbsp;: «&nbsp;comment on fait pour que les deux tiennent&nbsp;?&nbsp;» La première idée vient d’elle si possible. On écrit ce qui est décidé.',
    },
  ]),
  legende:
    'L’ordre n’est pas négociable. Commencer par le temps 2 — ce qui arrive presque toujours — transforme la conversation en annonce, et la personne le sait avant la fin de votre première phrase.',
});

const PHRASES = S.figure({
  numero: 4,
  titre: 'Ce qui ferme, et ce qui ouvre',
  corps: S.paires({
    gauche: 'Ce qui vient spontanément',
    droite: 'Ce qui laisse la conversation ouverte',
    lignes: [
      {
        g: '«&nbsp;Pourquoi tu as fait ça&nbsp;?&nbsp;»',
        d: '«&nbsp;J’ai remarqué que… Qu’est-ce qui se passe, à ce moment-là&nbsp;?&nbsp;» La première demande une justification, la seconde demande une information.',
      },
      {
        g: '«&nbsp;Tu sais bien que c’est interdit.&nbsp;»',
        d: 'Rien. On ne rappelle pas la règle au temps 1 — ce n’est pas le moment, et la personne la connaît.',
      },
      {
        g: '«&nbsp;Ce qu’il faudrait, c’est que tu…&nbsp;»',
        d: '«&nbsp;Comment on pourrait faire pour que ça marche pour toi ET pour moi&nbsp;?&nbsp;» La première est une solution déguisée en question.',
      },
      {
        g: '«&nbsp;Tu es d’accord&nbsp;?&nbsp;» (après avoir tout dit)',
        d: '«&nbsp;Redis-moi ce qu’on a décidé&nbsp;?&nbsp;» Un accord qu’on ne peut pas redire n’a pas été compris.',
      },
      {
        g: '«&nbsp;On en a déjà parlé dix fois.&nbsp;»',
        d: '«&nbsp;La dernière fois on avait trouvé ça, et ça n’a pas tenu. Qu’est-ce qui a coincé&nbsp;?&nbsp;» Le reproche ferme ; la même information, posée en question, ouvre.',
      },
      {
        g: 'Le silence qu’on remplit au bout de trois secondes',
        d: 'Le silence qu’on laisse durer dix secondes. C’est le geste le plus difficile du parcours, et celui qui change le plus de conversations.',
      },
    ],
  }),
  legende:
    'Aucune de ces phrases n’est mauvaise en soi. Elles sont mauvaises AU TEMPS 1, où elles annoncent que la solution est déjà trouvée.',
});

const ACCORD = S.figure({
  numero: 5,
  titre: 'À quoi se reconnaît un accord qui va tenir',
  corps: S.echelle(
    [
      {
        niveau: 'Il tiendra',
        libelle:
          'La personne l’a proposé ou modifié, il est faisable dès aujourd’hui, les DEUX préoccupations y sont, et elle peut le redire en une phrase.',
      },
      {
        niveau: 'À revoir',
        libelle:
          'Il répond à votre préoccupation seulement. La personne a dit oui — elle dira non en actes, dans trois jours.',
      },
      {
        niveau: 'Il ne tiendra pas',
        libelle:
          'Il demande un effort permanent, ou il dépend de quelqu’un qui n’était pas dans la pièce, ou il commence «&nbsp;la prochaine fois, j’essaierai de…&nbsp;».',
      },
      {
        niveau: 'Ce n’est pas un accord',
        libelle:
          'Vous l’avez écrit seul et vous le lui faites signer. C’est une consigne avec une signature en bas.',
      },
    ],
    { titreNiveau: 'Pronostic', titreLibelle: 'À quoi on le voit' },
  ),
  legende:
    'Le meilleur indicateur est le premier&nbsp;: qui a eu l’idée. Un accord proposé par la personne tient quatre fois sur cinq&nbsp;; un accord proposé par l’adulte et accepté poliment, rarement.',
});

const APRES = S.figure({
  numero: 6,
  titre: 'L’accord n’a pas tenu. Pourquoi&nbsp;?',
  corps: S.arbre({
    question:
      'Dix jours plus tard, ça ne marche pas. Quatre causes, dans l’ordre où il faut les regarder.',
    branches: [
      {
        condition: 'Il était irréaliste',
        contenu:
          'Trop d’efforts, trop souvent, ou il supposait un matin calme. <strong>On le rend plus petit</strong>, on ne le répète pas plus fort.',
      },
      {
        condition: 'Une préoccupation manquait',
        contenu:
          'La vraie difficulté n’a pas été dite au temps 1 — souvent parce qu’on n’a pas assez attendu. <strong>On refait le temps 1</strong>, et lui seul.',
      },
      {
        condition: 'Quelqu’un ne savait pas',
        contenu:
          'L’accord vivait dans une tête et pas dans l’équipe, ou pas à la maison. <strong>On l’écrit et on le transmet</strong> avant de conclure quoi que ce soit.',
      },
      {
        condition: 'Le problème a changé',
        contenu:
          'Ce n’est plus le même problème qu’il y a dix jours. <strong>On recommence au tri</strong>, sans considérer que le premier accord a échoué.',
      },
    ],
  }),
  legende:
    'Aucune des quatre causes n’est «&nbsp;elle n’a pas voulu&nbsp;». Ce n’est pas de l’optimisme&nbsp;: c’est que cette cinquième hypothèse ne mène à aucune action, alors que les quatre autres en donnent chacune une.',
});

/* ── MODULE 1 ────────────────────────────────────────────────────────────── */

const M1 = {
  reperes: {
    minutes: 12,
    prerequis:
      'Aucun. Il est utile d’avoir suivi «&nbsp;Décrire un comportement sans le juger&nbsp;» — ce parcours demande de nommer un problème en termes que l’autre reconnaîtra.',
    evaluation: 'Cinq questions d’autocorrection, et une feuille de tri remplie.',
    apres:
      'trois problèmes écrits et triés. Le module 2 se lit ensuite, il n’attend rien de plus.',
  },
  objectifs: [
    'Distinguer ce qu’une solution imposée obtient de ce qu’elle n’obtient pas.',
    'Trier un problème entre sécurité, limite non négociable, terrain de recherche commune, et ce qu’on laisse.',
    'Repérer les trois situations où cette conversation ne doit pas être ouverte.',
  ],
  corps: `<h3 style="${G.H3}">1. Ce qu’une solution imposée obtient, et ce qu’elle n’obtient pas</h3>
<p>Une solution imposée obtient quelque chose, et il serait malhonnête de dire le
contraire&nbsp;: elle obtient l’arrêt, souvent tout de suite, et parfois c’est
exactement ce qu’il faut. Le problème n’est pas qu’elle ne marche pas. Le
problème est qu’elle ne marche <em>que</em> tant que vous êtes là.</p>

<p>Regardez n’importe quelle situation qui dure depuis six mois dans votre
service. Elle a presque toujours la même histoire&nbsp;: une règle a été posée,
elle a tenu trois jours, elle a été reposée plus fermement, elle a tenu deux
jours, et maintenant tout le monde est fatigué et personne ne sait plus de quoi
on parle. <strong>Ce n’est pas un défaut d’application. C’est le comportement
normal d’une solution à laquelle une des deux personnes n’a pas
participé.</strong></p>

${CARTE}

<p>Ce que la recherche commune obtient en plus est facile à nommer&nbsp;: la
personne sait pourquoi elle fait ce qu’elle fait, donc elle le fait quand vous
n’êtes pas là&nbsp;; elle a dit ce qui coinçait, donc l’accord porte sur le vrai
obstacle et pas sur celui qu’on avait supposé&nbsp;; et la prochaine fois qu’un
problème arrive, elle sait qu’on peut en parler. Ce troisième effet est le plus
important et le moins visible&nbsp;: ce que vous construisez en une conversation,
ce n’est pas la solution, c’est la possibilité de la suivante.</p>

${G.alerte(
  'Ce parcours ne dit pas d’arrêter de poser des limites',
  `On ne négocie ni la sécurité, ni ce qui ne se négocie pas — et le paragraphe 3
le dit en toutes lettres. Ce qui change, ce n’est pas la fermeté&nbsp;: c’est ce
sur quoi elle porte. On tient la limite, et on cherche à deux ce qu’on fait
AUTOUR d’elle. Un adulte qui ne pose plus rien n’est pas collaboratif, il est
absent — et c’est une autre façon de laisser quelqu’un seul avec son problème.`,
)}

<h3 style="${G.H3}">2. Le tri, et pourquoi il se fait AVANT d’ouvrir la bouche</h3>
<p>La faute la plus coûteuse de ce parcours ne se produit pas pendant la
conversation&nbsp;: elle se produit au moment de décider qu’on va en avoir une.
On ouvre une recherche commune sur quelque chose qui n’en relève pas, et la
conversation est perdue avant la première phrase.</p>

${TRI}

<p>Trois remarques sur ce tri, parce que c’est là que tout se joue.</p>

<p><strong>La deuxième branche est la plus mal comprise.</strong> Une limite non
négociable ne disparaît pas parce qu’on cherche une solution ensemble&nbsp;: on
l’annonce, et on cherche autour. «&nbsp;Tu dois être rentré à 19&nbsp;h, ça je
n’ai pas le choix, c’est la règle du foyer. Ce qu’on peut regarder ensemble,
c’est comment faire pour que ça soit tenable pour toi.&nbsp;» La limite est
posée au début, dans la même phrase que l’invitation. <strong>L’annoncer à la
fin, après avoir laissé quelqu’un proposer, c’est lui faire perdre son
temps</strong> — et lui apprendre que l’invitation était fausse.</p>

<p><strong>La quatrième branche est celle qu’on saute.</strong> Beaucoup de
problèmes de service ne coûtent rien à la personne&nbsp;: ils nous gênent, nous.
Un adolescent qui met une heure à ranger sa chambre le samedi ne perd rien
— c’est l’équipe qui trouve ça long. Ouvrir une conversation de résolution
là-dessus, c’est demander à quelqu’un de résoudre notre problème à notre place,
sous couvert de le faire participer. Il le sentira, et il aura raison. C’est la
même règle que la colonne «&nbsp;à qui ça sert&nbsp;» de «&nbsp;Renforcer ce qui
va&nbsp;» et que la première question de «&nbsp;Mesurer un comportement&nbsp;»&nbsp;:
<strong>on travaille sur ce qui coûte à la personne, pas sur ce qui gêne
l’entourage.</strong></p>

<p><strong>La troisième branche demande un problème NOMMÉ.</strong> «&nbsp;Il est
insolent&nbsp;» n’est pas un problème, c’est un jugement&nbsp;: on ne peut pas
chercher une solution à deux sur une phrase que l’autre ne reconnaîtra pas.
«&nbsp;Les trois derniers samedis, tu es rentré entre 20&nbsp;h&nbsp;et
20&nbsp;h&nbsp;30 alors que c’est 19&nbsp;h&nbsp;» est un problème&nbsp;: c’est
filmable, c’est daté, et il peut répondre dessus. C’est exactement le test de la
caméra de «&nbsp;Décrire un comportement sans le juger&nbsp;», et c’est pour ça
que ce parcours-là est un prérequis utile.</p>

<h3 style="${G.H3}">3. Ce qui ne se négocie jamais</h3>
<p>La liste est courte et elle n’est pas discutable. On ne cherche pas une
solution à deux sur&nbsp;:</p>

<ul style="${G.UL}">
<li style="${G.LI}"><strong>la sécurité physique</strong> de la personne ou de
quelqu’un d’autre&nbsp;;</li>
<li style="${G.LI}"><strong>les soins</strong> et les traitements prescrits — on
peut chercher ensemble COMMENT ils se passent, jamais s’ils ont lieu&nbsp;;</li>
<li style="${G.LI}"><strong>ce que la loi impose</strong> à l’établissement, et
qui ne dépend ni de vous ni d’elle&nbsp;;</li>
<li style="${G.LI}"><strong>les besoins fondamentaux</strong> — repas, sommeil,
hygiène, lien familial, et le moyen de communication. Rien de ce qui est
enseigné ici n’autorise à les mettre dans la balance d’un accord&nbsp;;</li>
<li style="${G.LI}"><strong>ce qui relève d’un autre</strong> — une décision de
justice, une orientation, un protocole médical. On peut en parler, on ne
l’échange pas.</li>
</ul>

<p>Cette liste s’affiche&nbsp;: c’est la fiche&nbsp;1 des annexes. Elle sert
moins à vous qu’à l’équipe le jour où quelqu’un dira «&nbsp;mais on est censés
chercher avec lui, non&nbsp;?&nbsp;» à propos d’un traitement.</p>

${G.exemple(
  'La même situation, des deux côtés de la ligne',
  `<strong>Ne se négocie pas&nbsp;:</strong> que Nadia prenne son traitement du
soir.<br>
<strong>Se cherche à deux&nbsp;:</strong> à quelle heure, avec quoi pour le faire
passer, qui le lui apporte, et pourquoi elle préfère que ce ne soit pas devant
les autres — ce dernier point étant, en l’occurrence, la seule chose qui
bloquait vraiment.`,
)}

<h3 style="${G.H3}">4. Avant tout&nbsp;: peut-elle donner son point de vue&nbsp;?</h3>
<p>Une recherche commune suppose que les deux personnes puissent dire ce qui les
préoccupe. Si l’une des deux n’a pas de moyen fiable de le faire, ce n’est pas
une conversation qu’il faut préparer&nbsp;: c’est le moyen de communication.</p>

<p>Cela ne veut pas dire «&nbsp;parler&nbsp;». Beaucoup de personnes qui ne
parlent pas ont un moyen d’exprimer un choix — images, tablette, gestes, oui/non
fiable, désignation. Avec ce moyen-là, les trois temps du module&nbsp;3 se
tiennent très bien, plus lentement. <strong>Ce qui rend la conversation
impossible, ce n’est pas l’absence de parole, c’est l’absence de moyen.</strong></p>

${G.alerte(
  'Trois situations où l’on n’ouvre pas cette conversation',
  `<strong>1. Il n’y a pas de moyen d’exprimer un point de vue.</strong> On
travaille d’abord là-dessus — voir «&nbsp;Apprendre à demander plutôt qu’à
crier&nbsp;». Tenir la conversation quand même reviendrait à décider seul et à
appeler ça un accord.<br><br>
<strong>2. C’est chaud.</strong> Pendant l’épisode, ou dans les minutes qui
suivent, personne ne cherche de solution&nbsp;: voir «&nbsp;Les premières minutes
d’une crise&nbsp;». On attend, souvent jusqu’au lendemain.<br><br>
<strong>3. Vous connaissez déjà la solution et vous y tenez.</strong> Alors ce
n’est pas une recherche, c’est une annonce — et il vaut mieux l’annoncer
franchement. Une fausse invitation coûte plus cher qu’une consigne assumée&nbsp;:
la consigne se discute, la fausse invitation apprend qu’on ne peut pas vous
croire.`,
)}

<h3 style="${G.H3}">5. À froid, et à un moment choisi</h3>
<p>Le moment fait une grande partie du résultat, et il ne s’improvise pas. Ce
qui marche&nbsp;: un moment neutre, sans public, sans urgence derrière,
suffisamment loin de l’épisode pour que personne ne soit encore en colère, et
suffisamment près pour que tout le monde s’en souvienne. En pratique, le
lendemain ou le surlendemain.</p>

<p>Ce qui ne marche pas&nbsp;: juste après, devant le groupe, en fin de service
quand vous partez dans dix minutes, ou au moment où la personne vient de vous
demander autre chose. Et le pire de tous, parce qu’il a l’air pratique&nbsp;:
pendant le trajet en voiture, quand l’autre ne peut pas s’en aller. Une
conversation dont on ne peut pas sortir n’est pas une invitation.</p>

<p>On annonce le sujet&nbsp;: «&nbsp;Est-ce que je peux te parler cinq minutes
des samedis soir&nbsp;? Pas maintenant si tu veux, dis-moi quand.&nbsp;»
<strong>Et si la réponse est non, c’est non</strong> — on reporte, on ne le prend
pas comme un refus de coopérer, et on propose un autre moment. Un «&nbsp;non,
pas maintenant&nbsp;» respecté est, en soi, la première preuve que l’invitation
était réelle.</p>`,
  aRetenir:
    'On trie avant de parler&nbsp;: sécurité, limite non négociable, problème qui coûte à la personne, ou rien du tout. On ne négocie jamais la sécurité, les soins, ni les besoins fondamentaux. Et on n’ouvre pas la conversation si la personne n’a pas de moyen de donner son point de vue, si c’est encore chaud, ou si vous avez déjà décidé.',
  exercice: {
    nom: 'Le tri de vos trois problèmes',
    duree: '15 minutes, sur des situations réelles',
    quoi: 'Trois problèmes récurrents que vous avez en ce moment, triés et nommés.',
    etapes: [
      'Écrivez trois problèmes qui reviennent en ce moment, avec la personne que vous accompagnez. Un par ligne, tels qu’ils vous viennent — même mal dits.',
      'Réécrivez chacun en termes filmables&nbsp;: quand, où, quoi exactement, et combien de fois ces deux dernières semaines. Si vous ne pouvez pas mettre de chiffre, c’est probablement un jugement et pas un problème.',
      'Passez chacun dans l’arbre de la figure&nbsp;2 et écrivez la branche à côté&nbsp;: sécurité / limite / à deux / on laisse.',
      'Pour ceux qui tombent sur «&nbsp;limite&nbsp;», écrivez la phrase exacte qui l’annonce, et ce qui reste négociable autour.',
      'Pour ceux qui tombent sur «&nbsp;à deux&nbsp;», écrivez en une ligne À QUI ce problème coûte, et en quoi. Si la réponse est «&nbsp;à nous&nbsp;», barrez-le.',
      'Gardez celui qui reste, ou le premier s’il en reste plusieurs. C’est celui du module 3.',
    ],
    reussi:
      'C’est réussi quand vous avez un problème, un seul, écrit en une phrase que la personne concernée reconnaîtrait sans se sentir accusée, et dont vous pouvez dire ce qu’il lui coûte à elle.',
  },
  carnet: {
    intro: 'Le carnet du module 1&nbsp;: ce qui doit être écrit avant d’aller plus loin.',
    lignes: [
      'Les trois problèmes, en termes filmables',
      'La branche de chacun&nbsp;: sécurité / limite / à deux / on laisse',
      'Pour le problème retenu&nbsp;: à qui il coûte, et en quoi',
      'La limite non négociable qui l’entoure, s’il y en a une, et sa phrase',
      'Le moyen par lequel la personne donnera son point de vue',
    ],
  },
  vigilance: [
    'Ouvrir la conversation sur un problème qui ne gêne que l’équipe. C’est le seul point de ce module qui transforme l’outil en son contraire&nbsp;: une participation de façade.',
    'Nommer le problème par un jugement («&nbsp;il est provocateur&nbsp;»). L’autre ne peut pas répondre à ça, et il entendra surtout qu’on parle de lui.',
    'Annoncer la limite à la fin, après avoir laissé chercher. C’est la faute qui fait le plus de dégâts pour le moins d’intention&nbsp;: elle apprend que l’invitation était décorative.',
    'Ouvrir trois conversations la même semaine. Une seule, sur un seul problème&nbsp;: c’est déjà beaucoup pour tout le monde.',
    'Se dire qu’on essaiera «&nbsp;à l’occasion&nbsp;». Une conversation qui n’a pas de moment fixé n’a pas lieu.',
  ],
  annexes: 'la fiche 1 (ce qui ne se négocie jamais) et la fiche 2 (la feuille de tri)',
  quiz: Q[0],
  avant: [
    'Vous avez UN problème, écrit en termes filmables, et vous savez à qui il coûte.',
    'Vous savez sur quelle branche il tombe, et quelle limite l’entoure le cas échéant.',
    'Vous savez comment la personne pourra dire ce qu’elle en pense.',
  ],
};

/* ── MODULE 2 ────────────────────────────────────────────────────────────── */

const M2 = {
  reperes: {
    minutes: 10,
    prerequis: 'Le module 1. Vous avez un problème trié et nommé.',
    evaluation: 'Cinq questions d’autocorrection.',
    apres:
      'rien à faire entre ce module et le suivant. Le module 3 se lit dans la foulée si vous avez le temps.',
  },
  objectifs: [
    'Repérer, dans une conversation réelle, le moment exact où elle cesse d’en être une.',
    'Nommer les quatre phrases qui referment une recherche commune.',
    'Distinguer un accord obtenu d’un accord consenti.',
  ],
  corps: `<h3 style="${G.H3}">1. Six minutes, un samedi de novembre</h3>
<p>Kenza a quinze ans, elle est en MECS depuis deux ans. Les sorties du samedi
après-midi se terminent à 19&nbsp;h&nbsp;: c’est la règle du foyer, elle est
écrite, elle ne dépend pas de l’équipe. Les trois derniers samedis, Kenza est
rentrée à 20&nbsp;h&nbsp;10, 20&nbsp;h&nbsp;30 et 20&nbsp;h. À chaque fois elle
a dit qu’elle n’avait pas vu l’heure.</p>

<p>Le lundi, Marc — son éducateur référent, sept ans de métier, quelqu’un de
bien — décide d’en parler. Il a raison de le décider, il a raison sur le moment
choisi, et il a préparé quelque chose. Voici ce qu’il dit, dans l’ordre.</p>

${G.exemple(
  'La conversation, telle qu’elle a eu lieu',
  `<strong>Marc&nbsp;:</strong> «&nbsp;Kenza, il faut qu’on parle des samedis. Ça
fait trois fois que tu rentres en retard.&nbsp;»<br>
<strong>Kenza&nbsp;:</strong> «&nbsp;Ouais, j’ai pas vu l’heure.&nbsp;»<br>
<strong>Marc&nbsp;:</strong> «&nbsp;Tu as un téléphone, Kenza. Tu sais très bien
qu’à 19&nbsp;h c’est 19&nbsp;h. Pourquoi tu ne regardes pas&nbsp;?&nbsp;»<br>
<strong>Kenza&nbsp;:</strong> «&nbsp;Je sais pas.&nbsp;»<br>
<strong>Marc&nbsp;:</strong> «&nbsp;Bon. Alors on va faire simple&nbsp;: tu mets
une alarme à 18&nbsp;h&nbsp;15, et tu pars. D’accord&nbsp;?&nbsp;»<br>
<strong>Kenza&nbsp;:</strong> «&nbsp;…&nbsp;Ouais.&nbsp;»<br>
<strong>Marc&nbsp;:</strong> «&nbsp;C’est bon, on est d’accord&nbsp;? Alarme à
18&nbsp;h&nbsp;15.&nbsp;»<br>
<strong>Kenza&nbsp;:</strong> «&nbsp;Ouais ouais.&nbsp;»`,
)}

<p>Marc sort de cette conversation avec le sentiment d’avoir fait son travail.
Il a nommé le fait, il n’a pas crié, il a proposé une solution concrète, et elle
a dit oui. <strong>Le samedi suivant, Kenza rentre à 20&nbsp;h&nbsp;15.</strong></p>

<h3 style="${G.H3}">2. Où ça s’est arrêté, exactement</h3>
<p>La conversation a cessé d’en être une à la <strong>troisième réplique</strong>,
et personne ne l’a vu — surtout pas Marc.</p>

${PHRASES}

<p>Reprenons dans l’ordre&nbsp;:</p>

<ul style="${G.UL}">
<li style="${G.LI}"><strong>«&nbsp;Il faut qu’on parle des samedis&nbsp;»</strong> —
correct. Le sujet est annoncé, le fait est daté, il n’y a pas de jugement.
C’est un bon début, et c’est pour ça que la suite est instructive&nbsp;: la
conversation n’a pas été ratée par maladresse.</li>
<li style="${G.LI}"><strong>«&nbsp;Pourquoi tu ne regardes pas&nbsp;?&nbsp;»</strong> —
c’est fini. Cette question demande une justification, pas une information. Elle
n’a qu’une réponse possible pour un adolescent de quinze ans, et c’est celle
qu’il donne&nbsp;: «&nbsp;je sais pas&nbsp;». Il ne ment pas. La plupart des
gens ne savent pas dire pourquoi ils font ce qu’ils font — vous non plus, à
propos de la dernière fois où vous avez été en retard.</li>
<li style="${G.LI}"><strong>«&nbsp;Tu sais très bien&nbsp;»</strong> — la règle est
rappelée au moment où l’on était censé écouter. Kenza connaît la règle. Ce
qu’elle entend, c’est qu’on l’accuse de faire exprès.</li>
<li style="${G.LI}"><strong>«&nbsp;Alors on va faire simple&nbsp;»</strong> — la
solution arrive, et elle vient d’une seule personne. Elle est bonne, d’ailleurs.
Elle ne tiendra pas.</li>
<li style="${G.LI}"><strong>«&nbsp;D’accord&nbsp;?&nbsp;» / «&nbsp;Ouais&nbsp;»</strong> —
c’est un accord obtenu, pas un accord consenti. Kenza dit oui pour que la
conversation s’arrête, ce qui est une réponse parfaitement rationnelle à une
conversation qui n’en est plus une.</li>
</ul>

${G.alerte(
  'Le signe qui ne trompe pas',
  `<strong>Marc connaissait la solution avant d’entrer.</strong> L’alarme à
18&nbsp;h&nbsp;15, il y avait pensé pendant le week-end. Tout le reste de la
conversation était le chemin pour y arriver — et Kenza l’a senti dès la
troisième réplique, bien avant lui.<br><br>
Quand vous connaissez déjà la solution et que vous y tenez, ce n’est pas une
recherche commune&nbsp;: c’est une annonce. Annoncez-la franchement. Une
consigne assumée se discute&nbsp;; une invitation qui n’en était pas une apprend
qu’on ne peut pas vous croire, et c’est ça qui coûte cher la fois suivante.`,
)}

<h3 style="${G.H3}">3. Ce que personne n’a demandé</h3>
<p>Trois semaines plus tard, une collègue qui raccompagnait Kenza apprend par
hasard ce qui se passait le samedi. Kenza voyait sa petite sœur, placée dans une
autre structure, et le bus qui la ramenait passait à 19&nbsp;h&nbsp;40. Il n’y
en avait pas d’autre. Elle n’en avait parlé à personne parce qu’elle était
persuadée qu’on lui interdirait ces visites si on savait.</p>

<p>Regardez ce que devient la conversation avec cette information&nbsp;: l’alarme
à 18&nbsp;h&nbsp;15 ne pouvait pas marcher, parce que le problème n’était pas
l’heure, c’était le bus. Aucune fermeté n’aurait rattrapé ça. Et la seule chose
qui pouvait faire apparaître cette information, c’était un silence de dix
secondes après «&nbsp;qu’est-ce qui se passe, à ce moment-là&nbsp;?&nbsp;».</p>

${G.exemple(
  'La même conversation, si le temps 1 avait eu lieu',
  `<strong>Marc&nbsp;:</strong> «&nbsp;Les trois derniers samedis tu es rentrée
vers 20&nbsp;h&nbsp;15. Qu’est-ce qui se passe, à ce moment-là&nbsp;?&nbsp;»<br>
<strong>Kenza&nbsp;:</strong> «&nbsp;Rien. J’ai pas vu l’heure.&nbsp;»<br>
<strong>Marc&nbsp;:</strong> «&nbsp;D’accord.&nbsp;» <em>(dix secondes de
silence)</em><br>
<strong>Kenza&nbsp;:</strong> «&nbsp;…&nbsp;C’est le bus.&nbsp;»<br>
<strong>Marc&nbsp;:</strong> «&nbsp;Le bus.&nbsp;»<br>
<strong>Kenza&nbsp;:</strong> «&nbsp;Y en a qu’un, il passe à 19&nbsp;h&nbsp;40.
Si je prends celui d’avant je reste vingt minutes avec elle.&nbsp;»<br>
<em>Et là, seulement là, commence le vrai problème à résoudre — qui n’a plus
rien à voir avec une alarme.</em>`,
)}

<p>Ce «&nbsp;d’accord&nbsp;» suivi d’un silence est le geste technique central
du parcours, et c’est le plus difficile. Dix secondes sont très longues. Presque
tout le monde les remplit au bout de trois — par une reformulation, par une
question de plus, par «&nbsp;bon, écoute&nbsp;». <strong>Ce que vous mettez dans
ces sept secondes est exactement ce que l’autre n’aura pas dit.</strong></p>

<h3 style="${G.H3}">4. Et à la maison</h3>
<p>La même scène existe partout, avec d’autres décors. «&nbsp;Tu te mets aux
devoirs maintenant&nbsp;», trois soirs de suite, avec la même solution proposée
par le même adulte et le même oui sans conviction. Puis, au bout de trois
semaines, on apprend que l’exercice de maths n’a pas été noté dans l’agenda
parce que la maîtresse le donne à l’oral en fin de journée, et qu’il ne l’entend
pas.</p>

<p>Le décor change, la mécanique est identique&nbsp;: une solution adulte
appliquée à un problème supposé, et l’information qui aurait tout changé qui
attend qu’on la demande. Un parent a un avantage sur un professionnel — il a
plus d’occasions de demander. Il a aussi un inconvénient&nbsp;: il est rarement
à froid.</p>

<h3 style="${G.H3}">5. Accord obtenu, accord consenti</h3>
<p>La différence se voit à un seul endroit, et elle se voit tout de suite&nbsp;:
<strong>qui a eu l’idée.</strong></p>

${ACCORD}

<p>Un accord que la personne a proposé, ou qu’elle a modifié, tient parce
qu’elle a mis quelque chose dedans. Un accord qu’elle a simplement accepté tient
le temps que vous êtes là pour le rappeler — c’est-à-dire qu’il n’a rien changé,
il a juste déplacé l’effort sur vous.</p>

<p>Le test pratique du module 3 découle directement de là&nbsp;: à la fin, on ne
demande pas «&nbsp;tu es d’accord&nbsp;?&nbsp;», on demande <strong>«&nbsp;redis-moi
ce qu’on a décidé&nbsp;?&nbsp;»</strong>. Quelqu’un qui a participé le redit en
une phrase. Quelqu’un qui a dit oui pour en finir ne peut pas.</p>`,
  aRetenir:
    'Une conversation s’arrête à la question «&nbsp;pourquoi tu as fait ça&nbsp;» et à la solution annoncée par l’adulte. Ce qui la rouvre est un silence de dix secondes. Et un accord se juge à une seule chose&nbsp;: qui a eu l’idée.',
  exercice: {
    nom: 'Votre conversation ratée',
    duree: '10 minutes',
    quoi: 'Une conversation réelle, écrite réplique par réplique, et le moment où elle s’est arrêtée.',
    etapes: [
      'Repensez à une conversation récente sur le problème que vous avez retenu au module 1. Écrivez-la de mémoire, réplique par réplique — six ou sept lignes suffisent.',
      'Entourez la première phrase qui contient une solution, d’où qu’elle vienne. Notez à quelle réplique elle arrive.',
      'Entourez toute question commençant par «&nbsp;pourquoi&nbsp;», et toute phrase contenant «&nbsp;tu sais bien&nbsp;».',
      'Comptez les silences de plus de cinq secondes. Le compte est souvent zéro, et ce n’est pas un reproche&nbsp;: c’est le point de départ du module 3.',
      'Écrivez en une ligne&nbsp;: à la fin, l’autre aurait-il pu redire l’accord&nbsp;?',
    ],
    reussi:
      'C’est réussi quand vous pouvez pointer la réplique exacte où la conversation a cessé d’en être une — et qu’elle arrive plus tôt que vous ne le pensiez.',
  },
  carnet: {
    intro: 'Le carnet du module 2&nbsp;: ce que vous emportez au module 3.',
    lignes: [
      'La conversation écrite, réplique par réplique',
      'Le rang de la réplique où la solution apparaît',
      'Les questions en «&nbsp;pourquoi&nbsp;» et les «&nbsp;tu sais bien&nbsp;»',
      'Le nombre de silences de plus de cinq secondes',
      'Ce que vous ne savez toujours pas de son point de vue',
    ],
  },
  vigilance: [
    'Lire ce module comme un procès de l’éducateur. Marc fait tout ce qu’on lui a appris à faire, et il le fait bien. C’est justement pour ça que la scène est utile&nbsp;: la faute n’est pas un défaut de professionnalisme.',
    'Conclure qu’il ne faut jamais proposer de solution. On en propose — au temps 3, après l’autre, et comme une proposition parmi d’autres.',
    'Croire que le silence est une technique de manipulation. C’est le contraire&nbsp;: c’est le seul moment de la conversation où l’on ne fait rien.',
    'Chercher l’information cachée à tout prix. Il n’y a pas toujours un bus derrière. Parfois la réponse est «&nbsp;c’est nul de rentrer&nbsp;», et c’est une information suffisante.',
    'Se dire «&nbsp;je le savais déjà&nbsp;». Tout le monde sait qu’il ne faut pas demander pourquoi ; presque personne ne tient dix secondes de silence.',
  ],
  annexes: 'la fiche 3 (les phrases qui ouvrent) et la fiche 7 (ce que ce parcours ne traite pas)',
  quiz: Q[1],
  avant: [
    'Vous avez écrit une conversation réelle et repéré où elle s’est arrêtée.',
    'Vous savez dire ce que vous ne savez PAS du point de vue de l’autre.',
    'Vous acceptez d’entrer dans la prochaine conversation sans connaître la solution.',
  ],
};

/* ── MODULE 3 ────────────────────────────────────────────────────────────── */

const M3 = {
  reperes: {
    minutes: 12,
    prerequis: 'Les modules 1 et 2. Un problème trié, et une conversation ratée analysée.',
    evaluation: 'Cinq questions d’autocorrection, puis la conversation tenue pour de vrai.',
    apres:
      'la conversation, puis dix jours. Le module 4 porte sur VOTRE accord — il ne peut pas être fait avant.',
  },
  objectifs: [
    'Préparer les trois temps d’une conversation, écrits mot pour mot.',
    'Tenir le temps 1 sans proposer de solution, silences compris.',
    'Écrire un accord en une phrase que l’autre peut redire.',
  ],
  corps: `<h3 style="${G.H3}">1. On prépare ses phrases. Oui, à l’écrit.</h3>
<p>Écrire ses phrases à l’avance paraît artificiel, et c’est exactement pour ça
qu’il faut le faire. Sous tension — et une conversation de ce genre est toujours
un peu tendue — on retombe sur ses phrases d’habitude, celles du module 2. La
préparation écrite n’est pas là pour être récitée&nbsp;: elle est là pour que
vous sachiez ce que vous alliez dire, et donc pour que vous puissiez ne pas le
dire.</p>

${TROIS}

<p>La préparation tient sur une demi-page et prend dix minutes. Trois
paragraphes, un par temps, dans l’ordre — et l’ordre n’est pas négociable.</p>

<h3 style="${G.H3}">2. Temps 1 — son point de vue, et rien d’autre</h3>
<p>On ouvre avec une observation, pas avec un problème. L’observation est
datée, comptée, filmable, et elle se termine par une question ouverte qui
n’appelle ni oui ni non.</p>

<p><strong>Le gabarit&nbsp;:</strong> «&nbsp;J’ai remarqué que [fait daté et
compté]. Qu’est-ce qui se passe, à ce moment-là&nbsp;?&nbsp;»</p>

<p>Puis vient la partie difficile, et elle tient en trois règles&nbsp;:</p>

<ul style="${G.UL}">
<li style="${G.LI}"><strong>On se tait.</strong> Après la question, et après
chaque réponse, on laisse dix secondes. Comptez-les dans votre tête si
nécessaire — c’est ridicule et ça marche.</li>
<li style="${G.LI}"><strong>On reformule sans interpréter.</strong>
«&nbsp;Donc si je comprends bien, le bus de 19&nbsp;h&nbsp;40 est le seul qui
te laisse le temps de la voir.&nbsp;» Pas «&nbsp;donc en fait tu préfères ta
sœur au foyer&nbsp;».</li>
<li style="${G.LI}"><strong>On ne passe pas au temps 2 tant que la personne n’a
pas dit «&nbsp;oui, c’est ça&nbsp;».</strong> C’est le seul feu vert. S’il ne
vient pas, on n’a pas encore compris, ou elle n’a pas encore tout dit.</li>
</ul>

${G.alerte(
  'Les quatre phrases qui referment le temps 1',
  `«&nbsp;Pourquoi tu as fait ça&nbsp;?&nbsp;» — demande une justification.<br>
«&nbsp;Tu sais bien que…&nbsp;» — rappelle la règle au mauvais moment.<br>
«&nbsp;Ce qu’il faudrait, c’est…&nbsp;» — une solution déguisée en question.<br>
«&nbsp;On en a déjà parlé.&nbsp;» — un reproche qui ferme la porte qu’on vient
d’ouvrir.<br><br>
Si l’une d’elles sort, ce n’est pas grave&nbsp;: on le dit («&nbsp;pardon, je
reprends&nbsp;») et on repose la question ouverte. Une conversation se rattrape.
Ce qui ne se rattrape pas, c’est de ne pas s’en apercevoir.`,
)}

<p>Trois réponses fréquentes, et quoi en faire&nbsp;:</p>

<ul style="${G.UL}">
<li style="${G.LI}"><strong>«&nbsp;Je sais pas.&nbsp;»</strong> C’est presque
toujours vrai, et c’est souvent le début. On attend. Si rien ne vient, on
resserre&nbsp;: «&nbsp;Qu’est-ce que tu faisais, juste avant&nbsp;?&nbsp;» —
une question sur les faits, jamais sur les raisons.</li>
<li style="${G.LI}"><strong>Le silence.</strong> On le laisse. S’il dure
vraiment, on propose de reprendre plus tard et on le fait sans reproche&nbsp;:
«&nbsp;On en reparle demain, je repasse te voir.&nbsp;»</li>
<li style="${G.LI}"><strong>«&nbsp;Ça sert à rien de parler.&nbsp;»</strong>
C’est une information sur les conversations précédentes, pas sur celle-ci.
«&nbsp;Qu’est-ce qui s’est passé les autres fois&nbsp;?&nbsp;» est une bonne
suite — et la réponse vous concerne.</li>
</ul>

<h3 style="${G.H3}">3. Temps 2 — le vôtre, en deux phrases maximum</h3>
<p>On dit ce qui nous préoccupe, et pourquoi. Pas ce qu’on veut que l’autre
fasse&nbsp;: dès qu’une action apparaît, on est au temps 3 sans y être invité,
et la conversation redevient une annonce.</p>

<p><strong>Le gabarit&nbsp;:</strong> «&nbsp;De mon côté, ce qui m’inquiète,
c’est [préoccupation], parce que [raison].&nbsp;»</p>

${G.exemple(
  'Deux formulations de la même préoccupation',
  `<strong>Ça ferme&nbsp;:</strong> «&nbsp;De mon côté il faut que tu sois là à
19&nbsp;h, point.&nbsp;» — c’est une solution, et la conversation s’arrête ici.<br>
<strong>Ça ouvre&nbsp;:</strong> «&nbsp;De mon côté, ce qui m’inquiète c’est que
je ne sais pas où tu es après 19&nbsp;h, et que je suis responsable de toi.
L’heure de 19&nbsp;h n’est pas de moi, c’est la règle du foyer, et je n’ai pas
la main dessus.&nbsp;»<br><br>
La deuxième dit la même chose et laisse tout ouvert&nbsp;: elle sépare ce qui ne
se négocie pas (l’heure) de ce qui se cherche (comment faire pour que ça
tienne).`,
)}

<p><strong>La limite non négociable se pose ICI, jamais plus tard.</strong> Si
le module 1 a trié votre problème sur la branche «&nbsp;limite&nbsp;», elle
s’énonce dans le temps 2, clairement, en disant d’où elle vient — et si elle ne
vient pas de vous, dites-le. «&nbsp;Je n’ai pas la main dessus&nbsp;» est une
phrase honnête qui vous met, sur ce point-là, du même côté que l’autre.</p>

<h3 style="${G.H3}">4. Temps 3 — chercher, et écrire ce qu’on trouve</h3>
<p>On invite, et on laisse la première idée venir de l’autre si possible&nbsp;:
«&nbsp;Comment on pourrait faire pour que les deux tiennent&nbsp;: que tu voies
ta sœur, et que je sache où tu es&nbsp;?&nbsp;»</p>

<p>Quatre règles pour ce temps-là&nbsp;:</p>

<ul style="${G.UL}">
<li style="${G.LI}"><strong>On note toutes les idées, même mauvaises</strong>,
sans commenter. Écarter la première idée de l’autre ferme la suivante.</li>
<li style="${G.LI}"><strong>On juge chaque idée sur une seule question&nbsp;:
est-ce que ça répond aux DEUX préoccupations&nbsp;?</strong> Pas
«&nbsp;est-ce que ça m’arrange&nbsp;», pas «&nbsp;est-ce que c’est
raisonnable&nbsp;».</li>
<li style="${G.LI}"><strong>Si rien ne convient, on s’arrête là et on se
revoit.</strong> «&nbsp;On n’a pas trouvé aujourd’hui, on se revoit
jeudi&nbsp;» est un résultat honorable et fréquent. C’est très supérieur à un
accord bâclé qui ne tiendra pas trois jours.</li>
<li style="${G.LI}"><strong>Vous pouvez proposer</strong> — après l’autre, et
comme une proposition, pas comme une conclusion.</li>
</ul>

<p>Ce qui est décidé s’écrit, devant la personne, en une phrase. Pas un contrat,
pas une signature&nbsp;: <strong>trois lignes sur une demi-feuille</strong>,
qu’on garde tous les deux. La fiche&nbsp;4 des annexes en donne le gabarit
vierge.</p>

${G.exemple(
  'L’accord de Kenza et Marc, tel qu’il a été écrit',
  `<strong>Le problème&nbsp;:</strong> le seul bus qui laisse à Kenza le temps de
voir sa sœur la ramène à 19&nbsp;h&nbsp;40. L’heure de rentrée du foyer est
19&nbsp;h.<br>
<strong>Ce qu’on a décidé&nbsp;:</strong> le samedi où Kenza voit sa sœur, elle
prévient le matin&nbsp;; elle envoie un message quand elle monte dans le bus de
19&nbsp;h&nbsp;40&nbsp;; Marc fait la demande d’autorisation de rentrée à
19&nbsp;h&nbsp;50 auprès du chef de service, et dit la réponse mardi.<br>
<strong>On se revoit&nbsp;:</strong> dans dix jours, le lundi 24.<br>
<em>(Deux exemplaires, un pour chacun.)</em>`,
)}

${G.alerte(
  'Ce que l’accord ne contient jamais',
  `Ni sanction en cas de non-respect — ce n’est pas un contrat, et y mettre une
punition transforme la recherche en négociation sous contrainte&nbsp;; ni
engagement sur une intention («&nbsp;je ferai des efforts&nbsp;»), qui ne se
vérifie pas&nbsp;; ni quoi que ce soit qui dépende d’une personne absente de la
pièce, sauf à écrire explicitement QUI va lui demander et QUAND il répondra —
comme Marc le fait ci-dessus.<br><br>
Et il ne se signe pas. Une signature transforme un accord en preuve, c’est-à-dire
en quelque chose qu’on pourra ressortir contre quelqu’un.`,
)}

<h3 style="${G.H3}">5. La dernière phrase</h3>
<p>On ne demande pas «&nbsp;tu es d’accord&nbsp;?&nbsp;». On demande&nbsp;:
<strong>«&nbsp;Redis-moi ce qu’on a décidé&nbsp;?&nbsp;»</strong></p>

<p>Si la personne le redit en une phrase, l’accord existe. Si elle hésite, si
elle regarde la feuille, si elle dit «&nbsp;bah… ce que tu as dit&nbsp;», il
n’existe pas encore — et cinq minutes de plus maintenant valent mieux que dix
jours pour rien. On reprend le temps 3, ou on remet au lendemain.</p>

<p>Et on dit quand on se revoit. <strong>Un accord sans date de relecture n’est
pas un accord, c’est un espoir</strong> — la date est ce qui fait la différence
entre «&nbsp;on avait dit&nbsp;» et «&nbsp;on regarde ensemble si ça a
marché&nbsp;».</p>`,
  aRetenir:
    'Trois temps dans l’ordre&nbsp;: son point de vue jusqu’au «&nbsp;oui, c’est ça&nbsp;», le vôtre en deux phrases sans solution, puis la recherche à deux. L’accord s’écrit en trois lignes, porte une date de relecture, ne se signe pas — et se termine par «&nbsp;redis-moi ce qu’on a décidé&nbsp;?&nbsp;».',
  exercice: {
    nom: 'La conversation préparée, puis tenue',
    duree: '10 minutes de préparation, puis la conversation',
    quoi: 'Une demi-page de préparation, la conversation tenue, et l’accord écrit en trois lignes.',
    etapes: [
      'Écrivez votre phrase d’ouverture du temps 1&nbsp;: le fait daté et compté, puis la question ouverte. Relisez-la et vérifiez qu’elle ne contient ni «&nbsp;pourquoi&nbsp;», ni jugement, ni solution.',
      'Écrivez votre temps 2 en deux phrases&nbsp;: ce qui vous préoccupe, et pourquoi. Barrez tout verbe qui décrit ce que l’autre devrait faire.',
      'Écrivez votre phrase d’invitation du temps 3, en nommant les DEUX préoccupations dans la même phrase.',
      'Choisissez le moment et dites-le à la personne à l’avance&nbsp;: «&nbsp;je peux te parler cinq minutes de… ? Dis-moi quand.&nbsp;» Si c’est non, reportez sans le reprocher.',
      'Tenez la conversation. Emportez la feuille. Comptez dix secondes après chaque réponse — dans votre tête, sans le montrer.',
      'Écrivez l’accord devant la personne, en trois lignes, avec la date de relecture. Demandez-lui de le redire. Gardez-en chacun un exemplaire.',
    ],
    reussi:
      'C’est réussi quand vous avez appris, pendant le temps 1, au moins une chose que vous ne saviez pas — et quand la personne a pu redire l’accord sans regarder la feuille.',
  },
  carnet: {
    intro: 'Le carnet du module 3&nbsp;: ce qui doit exister sur le papier.',
    lignes: [
      'La préparation des trois temps, écrite avant',
      'Ce que vous avez appris au temps 1 et que vous ignoriez',
      'Les idées proposées, y compris celles qu’on a écartées',
      'L’accord en trois lignes, en deux exemplaires',
      'La date de relecture, notée des deux côtés',
    ],
  },
  vigilance: [
    'Passer au temps 2 avant le «&nbsp;oui, c’est ça&nbsp;». C’est la faute la plus fréquente, et elle annule tout ce qui précède.',
    'Remplir les silences. Ce que vous y mettez est exactement ce que l’autre n’aura pas dit.',
    'Écarter la première idée de l’autre parce qu’elle est irréaliste. On l’écrit quand même&nbsp;: c’est la deuxième qui compte, et elle ne viendra pas si la première a été balayée.',
    'Écrire l’accord après, au calme, tout seul. Un accord écrit hors de la pièce n’est plus le sien.',
    'Faire signer. Une signature transforme un accord en preuve opposable, donc en quelque chose qu’on ressortira contre quelqu’un.',
    'Oublier la date de relecture. Sans elle, un accord qui dérape ne se répare jamais&nbsp;: il s’oublie, puis il ressort en reproche.',
  ],
  annexes: 'la fiche 3 (les phrases qui ouvrent), la fiche 4 (le gabarit d’accord) et la fiche 5 (le suivi à dix jours)',
  quiz: Q[2],
  avant: [
    'La conversation a eu lieu, et l’accord est écrit en trois lignes.',
    'La personne a pu le redire sans regarder la feuille.',
    'La date de relecture est posée, et vous savez qui prévient qui d’ici là.',
  ],
  pause: {
    jours: 10,
    texte:
      'Le module 4 porte sur VOTRE accord&nbsp;: il ne peut pas être fait avant. Revenez le jour de la relecture — et si l’accord a dérapé au troisième jour, revenez quand même au dixième, avec ce qui s’est passé entre les deux.',
  },
};

/* ── MODULE 4 ────────────────────────────────────────────────────────────── */

const M4 = {
  reperes: {
    minutes: 12,
    prerequis:
      'Les modules 1 à 3, la conversation tenue, l’accord écrit, et dix jours passés.',
    evaluation: 'Cinq questions d’autocorrection, et la relecture faite à deux.',
    apres:
      'rien. Le parcours s’arrête ici — et si l’accord n’a pas tenu, il vous renvoie au bon endroit.',
  },
  objectifs: [
    'Relire un accord AVEC la personne plutôt que sur elle.',
    'Attribuer un accord qui n’a pas tenu à l’une des quatre causes, et à aucune autre.',
    'Décider entre ajuster, refaire le temps 1, transmettre, et recommencer au tri.',
  ],
  corps: `<h3 style="${G.H3}">1. La relecture se fait à deux, et elle dure cinq minutes</h3>
<p>Dix jours sont passés. La relecture n’est pas un bilan que vous faites sur la
personne&nbsp;: c’est la même conversation, en plus court, et elle commence
exactement comme la première — par sa version à elle.</p>

<p>Trois questions, dans cet ordre&nbsp;:</p>

<ul style="${G.UL}">
<li style="${G.LI}"><strong>«&nbsp;Alors, ça a donné quoi de ton côté&nbsp;?&nbsp;»</strong>
— et dix secondes de silence.</li>
<li style="${G.LI}"><strong>«&nbsp;De mon côté, j’ai vu [les faits].&nbsp;»</strong>
Les faits, pas le verdict&nbsp;: «&nbsp;deux samedis sur trois tu as envoyé le
message&nbsp;», pas «&nbsp;tu n’as pas vraiment joué le jeu&nbsp;».</li>
<li style="${G.LI}"><strong>«&nbsp;Qu’est-ce qu’on garde, qu’est-ce qu’on
change&nbsp;?&nbsp;»</strong></li>
</ul>

<p>C’est tout. Une relecture qui dure vingt minutes est redevenue une
conversation sur la personne.</p>

${G.alerte(
  'Deux choses qui ruinent une relecture',
  `<strong>La ressortir comme un reproche.</strong> «&nbsp;On avait dit&nbsp;» est
la phrase qui transforme l’accord en preuve — et qui apprend à ne plus rien
accepter d’écrit. Si vous entendez cette phrase sortir de votre bouche, reprenez
à la première question.<br><br>
<strong>Ne pas la faire du tout.</strong> C’est le cas le plus fréquent&nbsp;:
ça s’est bien passé, on passe à autre chose. Sauf qu’un accord jamais relu
s’érode sans que personne ne le remarque, et que la personne n’a jamais su que
ça avait marché. <strong>Une relecture d’un accord qui a tenu est la plus utile
des quatre</strong> — c’est celle qui rend la conversation suivante possible.`,
)}

<h3 style="${G.H3}">2. Ça a tenu. Ce qu’on en fait.</h3>
<p>On le dit, simplement, sans en faire une récompense&nbsp;: «&nbsp;Ça a
marché. Merci d’avoir prévenu les trois fois.&nbsp;» Puis on décide ensemble si
on garde l’accord tel quel, si on l’allège — beaucoup d’accords peuvent perdre
la moitié de leur mécanique au bout de dix jours —, et si on le transmet à
l’équipe pour qu’il ne dépende plus de vous.</p>

<p><strong>Transmettre est le point le plus négligé.</strong> Un accord qui vit
dans la tête de son référent tient jusqu’à son premier jour de congé. Trois
lignes dans le cahier de liaison, écrites comme un accord et pas comme une
consigne — «&nbsp;Kenza prévient le matin quand elle voit sa sœur, rentrée
autorisée à 19&nbsp;h&nbsp;50 ce jour-là&nbsp;» — suffisent, et elles évitent
qu’un collègue de nuit défasse en trente secondes ce qui a demandé deux
conversations.</p>

<h3 style="${G.H3}">3. Ça n’a pas tenu. Quatre causes, et aucune n’est la personne.</h3>
<p>C’est le moment précis où une équipe fatiguée se met à parler de la personne
au lieu de parler de l’accord — «&nbsp;de toute façon elle ne veut pas&nbsp;»,
«&nbsp;il n’est pas capable de tenir un engagement&nbsp;». Ces phrases ont un
défaut commun&nbsp;: elles ne mènent à aucune action.</p>

${APRES}

<p>Les quatre causes ne se valent pas, et elles se regardent dans l’ordre.</p>

<p><strong>Irréaliste.</strong> La plus fréquente de loin. L’accord demandait
trop d’efforts, trop souvent, ou supposait un matin calme. On le rend plus
petit&nbsp;: un samedi sur deux au lieu de tous, un message au lieu de deux, le
lundi seulement. <strong>On ne le répète pas plus fermement</strong> — répéter
un accord irréaliste ne le rend pas réaliste, ça l’use.</p>

<p><strong>Une préoccupation manquait.</strong> La vraie difficulté n’a pas été
dite au temps 1, presque toujours parce qu’on n’a pas assez attendu. On refait
le temps 1, et lui seul&nbsp;: «&nbsp;On avait trouvé ça, et ça n’a pas tenu.
Qu’est-ce qui a coincé&nbsp;?&nbsp;» Dix secondes. C’est souvent là que sort ce
qui manquait la première fois.</p>

<p><strong>Quelqu’un ne savait pas.</strong> L’accord n’est pas sorti de la
pièce&nbsp;: l’équipe du week-end l’ignorait, ou l’autre parent, ou
l’établissement scolaire. Ce n’est pas un échec de l’accord, c’est un défaut de
transmission — et on ne conclut rien tant qu’il n’est pas réparé.</p>

<p><strong>Le problème a changé.</strong> Ce n’est plus le même problème qu’il y
a dix jours. On recommence au tri du module 1, et surtout on ne compte pas ça
comme un échec&nbsp;: le premier accord a fait son travail, il a simplement fini
de le faire.</p>

${G.alerte(
  'La cinquième hypothèse, et pourquoi elle est écartée',
  `«&nbsp;Elle n’a pas voulu&nbsp;» est une hypothèse comme une autre, et elle
est parfois exacte. Elle est écartée ici pour une raison pratique et non par
gentillesse&nbsp;: <strong>elle ne mène à aucune action</strong>, alors que les
quatre autres en donnent chacune une. On ne l’écarte donc pas définitivement —
on la garde pour la fin, après avoir vérifié les quatre autres, ce que presque
personne ne fait.<br><br>
Et si, après les quatre, la personne dit clairement qu’elle ne veut pas&nbsp;:
c’est une information précieuse, pas un refus de coopérer. Elle dit que le
problème qu’on a choisi n’était pas le sien. Retour au tri.`,
)}

<h3 style="${G.H3}">4. Le deuxième tour, et quand s’arrêter</h3>
<p>Un deuxième tour est normal. Il est même le cas le plus fréquent&nbsp;: la
première conversation sert souvent à découvrir le vrai problème, la seconde à le
résoudre. Ce qui n’est pas normal, c’est le quatrième tour sur le même sujet.</p>

${G.exemple(
  'Trois tours, et ce qu’ils disent',
  `<strong>Tour 1&nbsp;:</strong> vous découvrez le bus. L’accord porte sur
l’autorisation de rentrée.<br>
<strong>Tour 2&nbsp;:</strong> l’autorisation a été refusée par le chef de
service. L’accord change&nbsp;: c’est la petite sœur qui vient au foyer un
samedi sur deux.<br>
<strong>Tour 3&nbsp;:</strong> ça tient depuis six semaines. On allège&nbsp;:
plus besoin de prévenir le matin.<br><br>
<em>Trois tours sur dix semaines, et le problème de départ — «&nbsp;elle rentre
en retard&nbsp;» — n’existe plus. Personne n’a été plus ferme que la première
fois.</em>`,
)}

<p>Au-delà de trois tours sans mouvement, ce n’est plus un problème à résoudre à
deux&nbsp;: ou bien il tombe sur une autre branche du tri, ou bien il demande
autre chose que ce parcours. Le module 5 des annexes — la fiche&nbsp;7 — dit
vers où aller&nbsp;: comprendre à quoi sert le comportement, rendre
l’environnement prévisible, travailler la forme de la consigne, ou mesurer ce
qui se passe vraiment avant d’en discuter encore.</p>

<h3 style="${G.H3}">5. Ce qu’on écrit dans le dossier</h3>
<p>Trois lignes, et elles portent sur le dispositif, pas sur la personne.</p>

${G.exemple(
  'Deux façons d’écrire la même relecture',
  `<strong>À éviter&nbsp;:</strong> «&nbsp;Kenza reste dans l’opposition et ne
respecte pas les accords posés.&nbsp;» — un jugement, qui sera recopié dans le
dossier suivant et la suivra des années.<br>
<strong>Ce qu’on écrit&nbsp;:</strong> «&nbsp;Accord du 14&nbsp;: prévenir le
matin et message au départ du bus. Tenu 2 fois sur 3. Relecture du 24&nbsp;:
l’autorisation de rentrée à 19&nbsp;h&nbsp;50 n’ayant pas été accordée, l’accord
est remplacé par une visite de sa sœur au foyer un samedi sur deux, à titre
d’essai jusqu’au 10.&nbsp;»`,
)}

<p>C’est exactement la règle de «&nbsp;Décrire un comportement sans le
juger&nbsp;», appliquée à un accord&nbsp;: on écrit ce qu’une caméra aurait vu,
on date, on dit ce qui remplace, et on ne qualifie personne. Et rappelons-le
puisque c’est le seul point de droit de ce parcours&nbsp;: <strong>la personne a
accès à ce qui est écrit sur elle</strong> (art. L311-3 du CASF). Un compte rendu
d’accord se rédige en le sachant — et, dans l’idéal, avec elle.</p>`,
  aRetenir:
    'La relecture se fait à deux, en cinq minutes, en commençant par sa version. Un accord qui n’a pas tenu était irréaliste, incomplet, mal transmis, ou porte sur un problème qui a changé. Un deuxième tour est normal&nbsp;; un quatrième dit qu’on s’est trompé de parcours.',
  exercice: {
    nom: 'La relecture de votre accord',
    duree: '15 minutes, avec votre feuille sous les yeux',
    quoi: 'La relecture tenue, la décision prise, et trois lignes écrites.',
    etapes: [
      'Sortez l’accord écrit au module 3. Relisez-le avant, seul, et notez les faits des dix derniers jours — combien de fois, et quand, sans qualifier.',
      'Tenez la relecture à deux, dans l’ordre&nbsp;: sa version, vos faits, «&nbsp;qu’est-ce qu’on garde, qu’est-ce qu’on change&nbsp;?&nbsp;». Dix secondes de silence après la première question.',
      'Si ça a tenu&nbsp;: dites-le, décidez ensemble ce qu’on allège, et transmettez l’accord à l’équipe en trois lignes.',
      'Si ça n’a pas tenu&nbsp;: passez par les quatre causes de la figure&nbsp;6, dans l’ordre, et écrivez laquelle. Interdisez-vous la cinquième tant que les quatre n’ont pas été examinées.',
      'Décidez&nbsp;: on ajuste (plus petit), on refait le temps 1, on transmet, ou on retourne au tri.',
      'Écrivez les trois lignes du dossier. Vérifiez qu’aucune ne qualifie la personne, et que la date de la prochaine relecture y figure si le parcours continue.',
    ],
    reussi:
      'C’est réussi quand la décision prise est l’une des quatre, qu’elle est écrite, et que la personne concernée sait laquelle — parce qu’elle était là quand elle a été prise.',
  },
  carnet: {
    intro: 'Le carnet du module 4&nbsp;: la trace de ce qui a été décidé.',
    lignes: [
      'Les faits des dix jours, comptés et datés',
      'Sa version, notée dans ses mots',
      'La cause retenue parmi les quatre',
      'La décision&nbsp;: ajuster / refaire le temps 1 / transmettre / retourner au tri',
      'Les trois lignes du dossier, et la date de la prochaine relecture',
    ],
  },
  vigilance: [
    'Sauter la relecture parce que ça s’est bien passé. C’est la plus utile des quatre&nbsp;: c’est elle qui rend la conversation suivante possible.',
    'Dire «&nbsp;on avait dit&nbsp;». La phrase transforme l’accord en preuve, et apprend à ne plus rien accepter d’écrit.',
    'Aller directement à la cinquième hypothèse. Elle est parfois vraie et elle ne mène nulle part&nbsp;: on la garde pour après les quatre autres.',
    'Répéter plus fermement un accord irréaliste. Le répéter ne le rend pas réaliste&nbsp;; ça l’use, et ça use la personne avec.',
    'Laisser l’accord dans sa propre tête. Il tient jusqu’au premier jour de congé de celui qui l’a passé.',
    'Écrire dans le dossier une phrase qui qualifie la personne. Elle survivra à l’équipe qui l’a produite, et la personne y a accès (art. L311-3 du CASF).',
  ],
  annexes: 'la fiche 5 (le suivi à dix jours), la fiche 6 (les quatre causes) et la fiche 7 (où aller ensuite)',
  quiz: Q[3],
  avant: [
    'La relecture a eu lieu, avec la personne.',
    'La décision est prise et écrite, et elle est l’une des quatre.',
    'Si le parcours continue, la prochaine date est posée&nbsp;; sinon, l’accord est transmis à l’équipe.',
  ],
};

/* ── ANNEXES ─────────────────────────────────────────────────────────────── */

const ANNEXES =
  A.entete('Résoudre un problème avec la personne plutôt que contre elle') +
  A.fiche({
    numero: 1,
    titre: 'Ce qui ne se négocie jamais',
    quand:
      'à afficher en salle d’équipe, et à relire le jour où quelqu’un dira «&nbsp;mais on est censés chercher avec lui, non&nbsp;?&nbsp;»',
    contenu: `<p>Rien de ce qui est enseigné dans ce parcours n’autorise à mettre les
éléments suivants dans la balance d’un accord. On peut chercher ensemble COMMENT
ils se passent&nbsp;; jamais s’ils ont lieu.</p>
${A.tableau(
  ['Ne se négocie pas', 'Ce qui, autour, se cherche à deux'],
  [
    [
      '<strong>La sécurité physique</strong> de la personne ou d’autrui',
      'Ce qu’on met en place pour qu’une situation dangereuse revienne moins souvent',
    ],
    [
      '<strong>Les soins et traitements prescrits</strong>',
      'L’heure, le lieu, qui les apporte, avec quoi, devant qui',
    ],
    [
      '<strong>Les repas, le sommeil, l’hygiène</strong>',
      'L’organisation, les horaires, les préférences, l’aide apportée',
    ],
    [
      '<strong>Le lien familial</strong> et les droits de visite',
      'Les modalités pratiques, dans le cadre fixé par la décision',
    ],
    [
      '<strong>Le moyen de communication</strong> — jamais retiré, à aucun titre',
      'Son perfectionnement, son transport, sa disponibilité',
    ],
    [
      '<strong>Ce que la loi impose</strong> à l’établissement',
      'Comment on l’applique, et ce qu’on peut assouplir légalement',
    ],
    [
      '<strong>Ce qui relève d’un autre</strong> — justice, médecine, orientation',
      'Qui va poser la question, à qui, et quand la réponse arrive',
    ],
  ],
)}
<p><strong>Et une règle de forme&nbsp;:</strong> une limite non négociable
s’annonce au début de la conversation, dans la même phrase que l’invitation à
chercher. L’annoncer à la fin, après avoir laissé quelqu’un proposer, apprend
que l’invitation était décorative.</p>`,
  }) +
  A.fiche({
    numero: 2,
    titre: 'La feuille de tri — à recopier',
    quand: 'avant toute conversation, au module 1, et chaque fois qu’un problème nouveau arrive',
    contenu: `${A.tableau(
      [
        'Le problème, en termes filmables',
        'Combien de fois en 2 semaines',
        'À qui ça coûte, et en quoi',
        'Branche',
      ],
      [
        ['', '', '', ''],
        ['', '', '', ''],
        ['', '', '', ''],
      ],
    )}
<p><strong>Les quatre branches&nbsp;:</strong> <em>S</em> sécurité, on agit
maintenant · <em>L</em> limite non négociable, on l’annonce · <em>D</em> à
chercher à deux · <em>R</em> ça ne gêne que nous, on laisse.</p>
<p>Si la colonne «&nbsp;à qui ça coûte&nbsp;» répond «&nbsp;à nous&nbsp;», la
branche est <em>R</em>, quelle que soit l’envie qu’on a d’en parler. Et si la
première colonne contient un adjectif plutôt qu’un geste, elle n’est pas encore
écrite&nbsp;: personne ne peut répondre à «&nbsp;il est insolent&nbsp;».</p>`,
  }) +
  A.fiche({
    numero: 3,
    titre: 'Les phrases qui ouvrent, et celles qui ferment',
    quand: 'à relire dix minutes avant la conversation, et à garder dans la poche pendant',
    contenu: `${A.tableau(
      ['Temps', 'Ce qu’on dit', 'Ce qu’on ne dit pas'],
      [
        [
          '<strong>1. Son point de vue</strong>',
          '«&nbsp;J’ai remarqué que [fait daté et compté]. Qu’est-ce qui se passe, à ce moment-là&nbsp;?&nbsp;»<br>«&nbsp;Qu’est-ce que tu faisais, juste avant&nbsp;?&nbsp;»<br>«&nbsp;Donc si je comprends bien, […]. C’est ça&nbsp;?&nbsp;»<br><em>puis dix secondes de silence</em>',
          '«&nbsp;Pourquoi tu as fait ça&nbsp;?&nbsp;»<br>«&nbsp;Tu sais bien que…&nbsp;»<br>«&nbsp;On en a déjà parlé.&nbsp;»<br>«&nbsp;Ce qu’il faudrait, c’est…&nbsp;»',
        ],
        [
          '<strong>2. Le vôtre</strong>',
          '«&nbsp;De mon côté, ce qui m’inquiète, c’est [préoccupation], parce que [raison].&nbsp;»<br>«&nbsp;Ça, je n’ai pas la main dessus.&nbsp;»',
          'Tout verbe qui décrit ce que l’autre devrait faire. Toute phrase de plus de deux.',
        ],
        [
          '<strong>3. Ensemble</strong>',
          '«&nbsp;Comment on pourrait faire pour que les deux tiennent&nbsp;: [la sienne] et [la vôtre]&nbsp;?&nbsp;»<br>«&nbsp;Et si ça, ça ne marche pas&nbsp;?&nbsp;»<br>«&nbsp;On n’a pas trouvé aujourd’hui, on se revoit jeudi.&nbsp;»',
          '«&nbsp;Bon, alors on va faire simple&nbsp;: tu…&nbsp;»<br>Écarter la première idée de l’autre.',
        ],
        [
          '<strong>Pour finir</strong>',
          '«&nbsp;Redis-moi ce qu’on a décidé&nbsp;?&nbsp;»<br>«&nbsp;On se revoit le [date].&nbsp;»',
          '«&nbsp;Tu es d’accord&nbsp;?&nbsp;»<br>Partir sans date de relecture.',
        ],
      ],
    )}
<p><strong>Le seul feu vert pour passer du temps 1 au temps 2&nbsp;:</strong> la
personne a dit «&nbsp;oui, c’est ça&nbsp;». Tant qu’elle ne l’a pas dit, vous
n’avez pas encore compris, ou elle n’a pas encore tout dit.</p>`,
  }) +
  A.fiche({
    numero: 4,
    titre: 'Le gabarit d’accord — trois lignes, deux exemplaires',
    quand: 'pendant le temps 3, écrit devant la personne, jamais après au calme',
    contenu: `${A.tableau(
      ['', 'À écrire'],
      [
        ['<strong>Le problème</strong>', 'Les deux préoccupations, en une phrase chacune'],
        ['<strong>Ce qu’on a décidé</strong>', 'Ce que fait chacun, concrètement, à partir de quand'],
        ['<strong>Ce qui dépend d’un tiers</strong>', 'Qui lui demande, et quand il répond'],
        ['<strong>On se revoit</strong>', 'Une date, pas «&nbsp;dans quelques jours&nbsp;»'],
      ],
    )}
<p><strong>Ce qu’un accord ne contient jamais&nbsp;:</strong> ni sanction en cas
de non-respect — ce n’est pas un contrat —, ni engagement sur une intention
(«&nbsp;je ferai des efforts&nbsp;»), qui ne se vérifie pas, ni rien qui dépende
d’une personne absente sans que son nom et une date y figurent.</p>
<p><strong>Et il ne se signe pas.</strong> Une signature transforme un accord en
preuve, c’est-à-dire en quelque chose qu’on pourra ressortir contre quelqu’un.
Deux exemplaires manuscrits suffisent, un pour chacun.</p>`,
  }) +
  A.fiche({
    numero: 5,
    titre: 'Le suivi à dix jours — grille vierge',
    quand: 'entre le module 3 et le module 4, une ligne par occasion, pas une par jour',
    contenu: `${A.tableau(
      ['Date', 'L’occasion s’est-elle présentée&nbsp;?', 'Ce qui a été fait', 'Ce qui a gêné'],
      [
        ['', '', '', ''],
        ['', '', '', ''],
        ['', '', '', ''],
        ['', '', '', ''],
        ['', '', '', ''],
      ],
    )}
<p><strong>Une ligne par OCCASION, pas par jour&nbsp;:</strong> un accord sur
les samedis se juge sur trois lignes en dix jours, pas sur dix. Compter les
jours où rien ne pouvait se produire fabrique un faux échec.</p>
<p>La colonne «&nbsp;ce qui a gêné&nbsp;» est celle qui sert à la relecture&nbsp;:
c’est elle qui dira laquelle des quatre causes est en jeu. Trois mots
suffisent.</p>`,
  }) +
  A.fiche({
    numero: 6,
    titre: 'L’accord n’a pas tenu — les quatre causes',
    quand: 'à la relecture, avant de conclure quoi que ce soit',
    contenu: `${A.tableau(
      ['Cause', 'Comment on la reconnaît', 'Ce qu’on fait'],
      [
        [
          '<strong>Irréaliste</strong><br><em>la plus fréquente</em>',
          'Trop d’efforts, trop souvent, ou il supposait une journée calme. Il a tenu deux jours puis plus rien.',
          'On le rend PLUS PETIT. On ne le répète pas plus fermement.',
        ],
        [
          '<strong>Une préoccupation manquait</strong>',
          'L’accord ne portait pas sur le vrai obstacle. La personne l’applique et ça ne change rien.',
          'On refait le temps 1, et lui seul&nbsp;: «&nbsp;qu’est-ce qui a coincé&nbsp;?&nbsp;» puis dix secondes.',
        ],
        [
          '<strong>Quelqu’un ne savait pas</strong>',
          'Un collègue, l’autre parent, l’école ont défait l’accord sans le savoir.',
          'On l’écrit et on le transmet. On ne conclut rien avant.',
        ],
        [
          '<strong>Le problème a changé</strong>',
          'Ce dont on parle aujourd’hui n’est plus ce dont on parlait il y a dix jours.',
          'On recommence au tri. Le premier accord n’a pas échoué&nbsp;: il a fini son travail.',
        ],
      ],
    )}
<p><strong>La cinquième hypothèse — «&nbsp;elle n’a pas voulu&nbsp;» — se garde
pour après les quatre autres.</strong> Elle est parfois exacte, et elle ne mène
à aucune action. Et si la personne le dit clairement, elle vous apprend quelque
chose d’utile&nbsp;: le problème qu’on avait choisi n’était pas le sien. Retour
au tri.</p>`,
  }) +
  A.fiche({
    numero: 7,
    titre: 'Ce que ce parcours ne traite pas, et où aller',
    quand:
      'au troisième tour sans mouvement, ou quand le tri du module 1 tombe sur une autre branche',
    contenu: `${A.tableau(
      ['Si', 'Alors ce n’est pas ce parcours'],
      [
        [
          'C’est en train de se produire, maintenant',
          '«&nbsp;Les premières minutes d’une crise&nbsp;» — on ne cherche pas de solution pendant.',
        ],
        [
          'La personne n’a aucun moyen fiable de dire ce qu’elle pense',
          '«&nbsp;Apprendre à demander plutôt qu’à crier&nbsp;» — le moyen de communication d’abord, la conversation ensuite.',
        ],
        [
          'On ne sait pas à quoi sert le comportement',
          '«&nbsp;Les quatre fonctions d’un comportement&nbsp;» — chercher à deux sur une hypothèse fausse ne mène nulle part.',
        ],
        [
          'Le problème vient de la forme de la demande',
          '«&nbsp;L’enfant qui dit non à tout&nbsp;» — parfois il n’y a rien à négocier, juste une consigne à reformuler.',
        ],
        [
          'Ça arrive surtout quand la journée est imprévisible',
          '«&nbsp;Rendre l’environnement prévisible&nbsp;» — un accord ne compense pas un cadre qui bouge.',
        ],
        [
          'On n’est pas d’accord en équipe sur ce qui se passe vraiment',
          '«&nbsp;Décrire un comportement sans le juger&nbsp;», puis «&nbsp;Mesurer un comportement&nbsp;» — on discutera mieux avec des faits.',
        ],
        [
          'Il s’agit d’une décision qui ne vous appartient pas',
          'Ni ce parcours ni un autre. On dit à la personne qui décide, et quand la réponse arrive.',
        ],
      ],
    )}
<p>Ce parcours ne dit rien non plus de la <strong>médiation</strong> entre deux
personnes accompagnées, ni de la <strong>réunion d’équipe</strong> — ce sont
d’autres gestes, avec d’autres règles, et les y transposer tels quels ne
marcherait pas.</p>`,
  }) +
  A.pied();

module.exports = {
  uuid: null, // posé après la création côté Teachizy (voir build-v2.js)
  slug: 'resoudre-un-probleme-avec-la-personne',
  modules: [
    { titre: 'Module 1 — Ce qu’une solution imposée ne peut pas faire', minutes: 12, html: G.assembler(M1) },
    { titre: 'Module 2 — La conversation qui s’est arrêtée à la troisième réplique', minutes: 10, html: G.assembler(M2) },
    { titre: 'Module 3 — Exercice guidé : les trois temps, écrits mot pour mot', minutes: 12, html: G.assembler(M3) },
    { titre: 'Module 4 — Tenir l’accord, et ce qu’on fait quand il ne tient pas', minutes: 12, html: G.assembler(M4) },
  ],
  annexes: ANNEXES,
};
