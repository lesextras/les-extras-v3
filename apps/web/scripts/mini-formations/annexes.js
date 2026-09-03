/**
 * ANNEXES — la boîte à outils de fin de parcours.
 *
 * Le parcours de référence (Community Manager — Essentielle) se termine par une
 * section « Annexes — Boîte à outils ». C'est la partie que les apprenants
 * gardent : le cours se lit une fois, les fiches servent pendant des mois.
 *
 * ── CE QU'ON Y MET, ET CE QU'ON N'Y MET PAS ─────────────────────────────────
 * On y met : les grilles vierges à recopier, les mémos, les exemples corrigés,
 * et les phrases toutes faites — celles qu'on cherche à dix-sept heures un
 * mardi et qu'on ne trouve jamais.
 *
 * On n'y met PAS de fichier à télécharger. Teachizy sait attacher des
 * ressources, mais une annexe promise et absente est pire qu'une annexe
 * absente : les grilles sont donc écrites EN CLAIR dans la page, recopiables
 * sur une feuille et imprimables depuis le navigateur. Le jour où de vrais PDF
 * existeront, ils s'ajouteront — ils ne remplaceront pas ce texte.
 *
 * ⚠ Pas de nom de programme déposé, pas de vignette empruntée, aucun
 * curriculum recopié : la règle du catalogue vaut ici comme ailleurs.
 */

const G = require('./gabarit-v3.js');

/** Un tableau simple, lisible et imprimable, sans dépendre d'un style externe. */
function tableau(entetes, lignes) {
  const th = entetes
    .map(
      (e) =>
        `<th style="border:1px solid #d9d3c9;padding:8px 10px;background:#f6f7f8;text-align:left">${e}</th>`,
    )
    .join('');
  const tr = lignes
    .map(
      (l) =>
        `<tr>${l
          .map((c) => `<td style="border:1px solid #d9d3c9;padding:8px 10px">${c}</td>`)
          .join('')}</tr>`,
    )
    .join('\n');
  return `<table style="border-collapse:collapse;width:100%;margin:18px 0"><thead><tr>${th}</tr></thead><tbody>
${tr}
</tbody></table>`;
}

/** Une fiche technique : un titre, un usage, un contenu. */
function fiche({ numero, titre, quand, contenu }) {
  return `${G.FILET}
<h3 style="${G.H3}">Fiche ${numero} — ${titre}</h3>
<p><em>À sortir quand&nbsp;: ${quand}</em></p>
${contenu}`;
}

/** L'en-tête commun de toutes les sections Annexes. */
function entete(titreFormation) {
  return `<div style="${G.GRIS}">
<h3 style="margin-top:0">Comment se servir de ces annexes</h3>
<p>Ces pages ne se lisent pas&nbsp;: elles se recopient. Chaque fiche tient sur une
feuille A4 et chaque grille se retrace à la main en moins d’une minute — c’est
volontaire, une grille qu’on doit aller chercher dans un ordinateur n’est jamais
remplie sur le terrain.</p>
<p style="margin-bottom:0">Vous pouvez aussi les imprimer directement depuis votre
navigateur (Ctrl+P, ou Cmd+P sur Mac). Elles sont conçues pour rester lisibles en noir
et blanc.</p>
</div>
<p>Annexes du parcours <strong>«&nbsp;${titreFormation}&nbsp;»</strong>. Elles reprennent,
dans l’ordre, ce que chaque module vous demande de produire.</p>`;
}

/** Le pied commun : ce que ces fiches ne sont pas. */
function pied() {
  return `${G.FILET}
<h3 style="${G.H3}">Pour aller plus loin dans le catalogue</h3>
<p>Chaque mini-formation travaille <strong>une seule compétence</strong>. Celles qui
partagent la même thématique ne se répètent pas&nbsp;: elles se suivent en complément. Le
catalogue complet est sur <strong>les-extras.fr/formations</strong>, et toutes sont
gratuites du premier au dernier module.</p>
<p><strong>Trois d’entre elles s’appuient sur une autre</strong>, et il vaut mieux le
savoir avant de commencer&nbsp;:</p>
<ul style="${G.UL}">
<li style="${G.LI}"><strong>«&nbsp;Les quatre fonctions d’un comportement&nbsp;»</strong>
vient en premier. «&nbsp;Apprendre à demander plutôt qu’à crier&nbsp;» commence là où elle
s’arrête&nbsp;: son module&nbsp;1 suppose une fonction déjà identifiée.</li>
<li style="${G.LI}"><strong>«&nbsp;Guider puis s’effacer&nbsp;»</strong> se suit avant
<strong>«&nbsp;Décomposer une routine en étapes&nbsp;»</strong>&nbsp;: la seconde utilise
l’échelle des aides de 0 à 7 que la première installe.</li>
<li style="${G.LI}"><strong>«&nbsp;Rendre l’environnement prévisible&nbsp;»</strong> se
suit seule, à n’importe quel moment. Elle renvoie aux quatre fonctions à un seul endroit,
pour dire quand un support visuel n’est <em>pas</em> la bonne réponse.</li>
</ul>
<div style="${G.ALERTE}">
<h3 style="margin-top:0;color:#8a3a2e">Ce que ces fiches ne sont pas</h3>
<p style="margin-bottom:0">Ce ne sont ni des outils de diagnostic, ni des grilles
d’évaluation normées, ni des documents opposables. Ce sont des supports de travail. Ce
qui entre au dossier d’une personne accompagnée, c’est ce que l’équipe a validé — pas
une note de terrain.</p>
</div>`;
}

module.exports = { tableau, fiche, entete, pied };
