/**
 * GABARIT v3 — la charpente commune de toutes les mini-formations.
 *
 * ── POURQUOI CE FICHIER ─────────────────────────────────────────────────────
 * La v1 des mini-formations livrait des modules de 2 000 à 3 000 caractères.
 * Le parcours Community Manager — Essentielle, qui est la référence maison,
 * en compte 12 400 par leçon, et surtout il est CHARPENTÉ : chaque leçon
 * s'ouvre sur une carte « Repères du module », enchaîne des objectifs, un
 * corps en sections numérotées, un exercice nommé, un livrable, des points de
 * vigilance, et se ferme sur « Avant de passer au module suivant ». Les
 * modules sont regroupés en SECTIONS, chaque section porte un quiz, et le
 * parcours se termine par une section « Annexes ».
 *
 * Écrire cette charpente à la main vingt fois, c'est vingt occasions de
 * l'oublier quelque part. Elle est donc engendrée ici, et le contenu propre à
 * chaque module est la seule chose qu'on écrit.
 *
 * ── CE QU'ON NE COPIE PAS DE LA RÉFÉRENCE ───────────────────────────────────
 * Le parcours Community Manager annonce « Le cours complet en vidéo — 15
 * minutes ». Nos mini-formations n'ont pas de vidéo. On ne reprend donc PAS ce
 * bloc : une rubrique vidéo vide est pire qu'une rubrique absente, et promettre
 * une vidéo qui n'existe pas est exactement le genre de détail qui ruine la
 * confiance d'un apprenant au premier module.
 *
 * ── STYLES ──────────────────────────────────────────────────────────────────
 * Teachizy conserve les styles en ligne dans son richtext (vérifié). On reprend
 * le gris #f6f7f8 de la référence pour les cartes, et on ajoute deux teintes
 * discrètes pour les encadrés d'alerte et d'exemple — jamais de couleur vive :
 * ces contenus parlent d'enfants en difficulté, pas d'une promotion.
 */

const GRIS = 'background:#f6f7f8;border-radius:12px;padding:18px 24px;margin:26px 0';
const ALERTE =
  'background:#fdf6f3;border-left:4px solid #cf6f56;border-radius:0 10px 10px 0;padding:16px 22px;margin:26px 0';
const EXEMPLE =
  'background:#f4f7f6;border-left:4px solid #7a9c92;border-radius:0 10px 10px 0;padding:16px 22px;margin:26px 0';
const FILET = '<hr style="height:1px;border:0;background:#e5e0d8;margin:34px 0">';
const H3 = 'margin:34px 0 12px';
const UL = 'margin:14px 0;padding-left:22px';
const LI = 'margin:7px 0';

/**
 * Carte d'ouverture : ce que l'apprenant doit savoir avant de commencer.
 *
 * ⚠ Le champ `apres` n'est pas décoratif. Ces parcours annoncent 45 minutes de
 * lecture, et c'est vrai — mais leurs exercices demandent un relevé de sept à
 * quinze jours AVANT de pouvoir conclure quoi que ce soit. Ne l'écrire nulle
 * part revenait à laisser croire qu'on termine le parcours dans l'après-midi,
 * puis à laisser l'apprenant découvrir seul qu'il lui manque deux semaines de
 * données. On l'annonce donc dans la carte du module concerné, et une seconde
 * fois en fin de module sous forme d'encadré.
 */
function reperes({ minutes, prerequis, evaluation, apres }) {
  return `<div style="${GRIS}">
<h3 style="margin-top:0">Repères du module</h3>
<ul style="${UL}">
<li style="${LI}"><strong>Durée&nbsp;:</strong> ${minutes} minutes de lecture. La mise en pratique, elle, se déroule dans votre quotidien.</li>
${apres ? `<li style="${LI}"><strong>Puis, sur le terrain&nbsp;:</strong> ${apres}</li>\n` : ''}<li style="${LI}"><strong>Prérequis&nbsp;:</strong> ${prerequis}</li>
<li style="${LI}"><strong>Modalité&nbsp;:</strong> e-learning asynchrone, à votre rythme, accès illimité et sans date de fin.</li>
<li style="${LI}"><strong>Évaluation&nbsp;:</strong> ${evaluation}</li>
</ul>
</div>`;
}

function objectifs(liste) {
  return `<h3 style="${H3}">Objectifs du module</h3>
<ul style="${UL}">
${liste.map((o) => `<li style="${LI}">${o}</li>`).join('\n')}
</ul>`;
}

/** Encadré « à retenir » — une seule idée, celle qu'on garde si on oublie tout. */
function aRetenir(texte) {
  return `<div style="${GRIS}">
<h3 style="margin-top:0">À retenir</h3>
<p style="margin-bottom:0">${texte}</p>
</div>`;
}

function alerte(titre, texte) {
  return `<div style="${ALERTE}">
<h3 style="margin-top:0;color:#8a3a2e">${titre}</h3>
${texte}
</div>`;
}

function exemple(titre, texte) {
  return `<div style="${EXEMPLE}">
<h3 style="margin-top:0">${titre}</h3>
${texte}
</div>`;
}

/**
 * Exercice nommé, sur le modèle des « Recettes express » de la référence.
 * Le nom compte : un exercice qui porte un nom se raconte à un collègue.
 */
function exercice({ nom, duree, quoi, etapes, reussi }) {
  return `${FILET}
<h3 style="${H3}">Exercice guidé — ${nom}</h3>
<p><em>${duree}. ${quoi}</em></p>
<ol style="${UL}">
${etapes.map((e) => `<li style="${LI}">${e}</li>`).join('\n')}
</ol>
<p><strong>C’est réussi quand&nbsp;:</strong> ${reussi}</p>`;
}

/**
 * Le livrable. La référence l'appelle « Mon carnet de séance » ; on garde le
 * nom, il est bon : ce n'est pas un devoir, c'est une trace de terrain.
 */
function carnet({ intro, lignes }) {
  return `<h3 style="${H3}">Mon carnet de séance</h3>
<p>${intro}</p>
<div style="${GRIS}">
<ul style="${UL}">
${lignes.map((l) => `<li style="${LI}">${l}</li>`).join('\n')}
</ul>
</div>`;
}

function vigilance(liste) {
  return `<h3 style="${H3}">Points de vigilance</h3>
<ul style="${UL}">
${liste.map((v) => `<li style="${LI}">${v}</li>`).join('\n')}
</ul>`;
}

/**
 * Critères de passage. Ils doivent être VÉRIFIABLES par l'apprenant lui-même —
 * « vous avez compris » n'est pas un critère, « vous avez écrit huit étapes »
 * en est un.
 */
function avantDePasser(liste) {
  return `${FILET}
<h3 style="${H3}">Avant de passer au module suivant</h3>
<p>Vous devriez pouvoir cocher ces trois lignes. Si l’une manque, reprenez la
section correspondante&nbsp;: le module suivant s’appuie dessus.</p>
<ul style="${UL}">
${liste.map((c) => `<li style="${LI}">${c}</li>`).join('\n')}
</ul>`;
}

/** Renvoi vers la section Annexes du parcours. */
function renvoiAnnexes(quoi) {
  return `<h3 style="${H3}">📎 Annexes de ce module</h3>
<p>Vous trouverez dans la section <strong>Annexes — fiches techniques et
exercices</strong>, en fin de parcours&nbsp;: ${quoi}</p>`;
}

/**
 * L'encadré de fin de module qui dit que le parcours S'ARRÊTE ici.
 *
 * Il est plus important qu'il n'en a l'air. Sans lui, l'apprenant enchaîne sur
 * le module 4, le lit sans avoir de relevé, et la seule chose qu'il en retire
 * est l'impression d'avoir fini. Le dire noir sur blanc transforme une attente
 * subie en étape du parcours.
 */
function pause({ jours, texte }) {
  return alerte(`Le parcours s’arrête ici pendant ${jours}`, texte);
}

/**
 * QUIZ D'AUTOCORRECTION DE FIN DE MODULE.
 *
 * ⚠ POURQUOI EN HTML ET PAS EN ITEM « QUIZ » TEACHIZY. Le point d'API des quiz
 * n'a jamais été trouvé (404 sur toutes les sondes, septembre 2026), et le
 * champ « Évaluation » de chaque module avait donc été réécrit pour ne plus
 * rien promettre. Un quiz rendu en HTML dans le corps du module contourne le
 * problème entièrement : il s'affiche partout, il s'imprime, il survit à un
 * changement de plateforme, et il ne dépend d'aucun point d'API.
 *
 * ⚠ LES RÉPONSES SONT EN BAS, PAS EN REGARD. On ne peut pas compter sur
 * `<details>` : le richtext de Teachizy n'en garantit pas le rendu. La forme
 * retenue est celle d'un cahier d'exercices papier — les questions, un filet,
 * puis les réponses commentées. C'est moins joli qu'un quiz interactif et
 * nettement plus robuste.
 *
 * ⚠ CHAQUE RÉPONSE PORTE UN « POURQUOI ». Un quiz qui dit seulement « bonne
 * réponse : B » n'enseigne rien. C'est le commentaire qui fait le travail, et
 * il doit expliquer aussi ce qui rend les autres options fausses quand ce
 * n'est pas évident.
 */
function quiz({ titre = 'Vérifiez que c’est acquis', questions }) {
  const LETTRES = ['A', 'B', 'C', 'D', 'E'];
  const enonces = questions
    .map(
      (q, i) => `<p style="margin:14px 0 6px"><strong>${i + 1}. ${q.enonce}</strong></p>
<ul style="${UL};list-style:none;padding-left:8px">
${q.options
  .map((o, j) => `<li style="${LI}"><strong>${LETTRES[j]}.</strong> ${o}</li>`)
  .join('\n')}
</ul>`,
    )
    .join('\n');

  const reponses = questions
    .map(
      (q, i) =>
        `<li style="${LI}"><strong>${i + 1}. ${LETTRES[q.bonne]}</strong> — ${q.pourquoi}</li>`,
    )
    .join('\n');

  return `${FILET}
<h3 style="${H3}">${titre}</h3>
<p><em>${questions.length} questions. Répondez avant de regarder les réponses&nbsp;:
c’est le fait de chercher, pas celui de lire, qui fixe la notion.</em></p>
${enonces}
<div style="${GRIS}">
<h3 style="margin-top:0">Réponses commentées</h3>
<ol style="${UL}">
${reponses}
</ol>
</div>`;
}

/**
 * Assemble un module complet.
 *
 * L'ordre est fixe et il n'est pas négociable : c'est lui qui fait qu'un
 * apprenant reconnaît le parcours d'un module à l'autre, et qu'il sait où
 * chercher l'exercice sans le lire en entier.
 */
function assembler(m) {
  const parties = [
    reperes(m.reperes),
    objectifs(m.objectifs),
    FILET,
    m.corps,
    m.aRetenir ? aRetenir(m.aRetenir) : '',
    exercice(m.exercice),
    carnet(m.carnet),
    vigilance(m.vigilance),
    m.annexes ? renvoiAnnexes(m.annexes) : '',
    m.quiz ? quiz(m.quiz) : '',
    avantDePasser(m.avant),
    m.pause ? pause(m.pause) : '',
  ];
  return parties.filter(Boolean).join('\n');
}

module.exports = {
  GRIS,
  ALERTE,
  EXEMPLE,
  FILET,
  H3,
  UL,
  LI,
  reperes,
  objectifs,
  aRetenir,
  alerte,
  exemple,
  exercice,
  quiz,
  carnet,
  vigilance,
  avantDePasser,
  pause,
  renvoiAnnexes,
  assembler,
};
