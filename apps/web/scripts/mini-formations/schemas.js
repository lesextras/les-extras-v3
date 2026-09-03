/**
 * SCHÉMAS — les figures des mini-formations.
 *
 * ── POURQUOI CE FICHIER EXISTE ──────────────────────────────────────────────
 * Le catalogue comptait 136 tableaux, 810 encadrés et ZÉRO schéma. Certaines
 * notions se comprennent en trois secondes sur une figure et en trois
 * paragraphes sans : le cycle avant → comportement → après, l'échelle d'aide de
 * 0 à 7, les quatre temps d'une crise, les six coûts et leurs six leviers. Un
 * schéma n'AJOUTE pas du contenu ici, il en REMPLACE : partout où une figure a
 * été posée, le paragraphe qu'elle rend inutile a été raccourci.
 *
 * ── POURQUOI EN HTML ET PAS EN IMAGE ────────────────────────────────────────
 * Une image de schéma, c'est un fichier de plus à héberger, illisible pour un
 * lecteur d'écran, floue au zoom, impossible à corriger sans rouvrir un
 * éditeur, et cassée le jour où la médiathèque déménage — ce qui est arrivé
 * deux fois en un mois sur ce projet. Ici tout est du HTML à styles en ligne :
 * la plateforme le conserve (vérifié), ça s'imprime, ça reste lisible en noir
 * et blanc, et ça se corrige dans le générateur comme le reste du texte.
 *
 * ⚠ CONSTRUCTIONS AUTORISÉES : table, tr, td, div, span, et des styles en
 * ligne. Rien d'autre. Ce sont les seules dont on ait la preuve, en production,
 * qu'elles traversent le richtext ET s'affichent correctement chez l'apprenant.
 * Pas de SVG (l'API le stocke, mais on n'a pas pu vérifier le rendu côté
 * apprenant sans créer un compte), pas de flexbox, pas de CSS externe.
 *
 * ⚠ CHAQUE FIGURE PORTE UNE LÉGENDE EN TOUTES LETTRES. Un schéma qu'il faut
 * deviner ne vaut rien, et un lecteur d'écran ne lit que la légende.
 */

const CADRE = '#cf6f56';
const ENCRE = '#2b2f36';
const DOUX = '#6b6f76';
const PALE = '#f6f7f8';

const CASE_ =
  'border:2px solid ' + CADRE + ';border-radius:10px;padding:10px 12px;' +
  'text-align:center;vertical-align:middle;background:#fff;line-height:1.35';
const CASE_PALE =
  'border:2px dashed ' + CADRE + ';border-radius:10px;padding:10px 12px;' +
  'text-align:center;vertical-align:middle;background:' + PALE + ';line-height:1.35';
const FLECHE =
  'text-align:center;vertical-align:middle;color:' + CADRE +
  ';font-size:22px;font-weight:bold;padding:0 6px;white-space:nowrap';
const LEGENDE = 'margin:10px 0 0;color:' + DOUX + ';font-size:0.94em;line-height:1.5';

/**
 * L'enveloppe commune. Elle donne un NUMÉRO et un TITRE à la figure : c'est ce
 * qui permet d'y renvoyer depuis le texte et depuis les annexes.
 */
function figure({ numero, titre, corps, legende }) {
  return `<div style="border:1px solid #e5e0d8;border-radius:12px;padding:18px 20px 16px;margin:28px 0;background:#fff">
<p style="margin:0 0 16px;font-weight:bold;color:${ENCRE}">Schéma ${numero} — ${titre}</p>
${corps}
${legende ? `<p style="${LEGENDE}">${legende}</p>` : ''}
</div>`;
}

/** Une chaîne horizontale : A → B → C. Trois ou quatre cases, pas davantage. */
function flux(cases) {
  const cellules = [];
  cases.forEach((c, i) => {
    if (i > 0) cellules.push(`<td style="${FLECHE}">&#8594;</td>`);
    const style = c.pointille ? CASE_PALE : CASE_;
    cellules.push(
      `<td style="${style}">${c.titre ? `<strong>${c.titre}</strong>` : ''}${
        c.titre && c.detail ? '<br>' : ''
      }${c.detail ? `<span style="color:${DOUX};font-size:0.94em">${c.detail}</span>` : ''}</td>`,
    );
  });
  return `<table style="border-collapse:separate;border-spacing:0;width:100%"><tbody><tr>${cellules.join(
    '',
  )}</tr></tbody></table>`;
}

/**
 * Une boucle : la chaîne, plus la flèche de retour dessous.
 * C'est la forme qui rend visible « le comportement se répète parce qu'il
 * marche » sans avoir à l'expliquer.
 */
function boucle(cases, retour) {
  return `${flux(cases)}
<table style="border-collapse:collapse;width:100%;margin-top:-2px"><tbody><tr>
<td style="width:14px"></td>
<td style="border-left:2px solid ${CADRE};border-bottom:2px solid ${CADRE};border-right:2px solid ${CADRE};height:26px"></td>
<td style="width:14px"></td>
</tr></tbody></table>
<p style="margin:8px 0 0;text-align:center;color:${CADRE};font-weight:bold">&#8593;&nbsp; ${retour}</p>`;
}

/**
 * Une échelle graduée. La barre est un simple div à largeur variable : elle
 * donne l'ordre de grandeur d'un coup d'œil, et elle reste lisible imprimée.
 */
function echelle(lignes, { titreNiveau = 'Niveau', titreLibelle = 'Concrètement' } = {}) {
  const n = lignes.length;
  const tr = lignes
    .map((l, i) => {
      const largeur = Math.round(((n - i) / n) * 100);
      return `<tr>
<td style="border-bottom:1px solid #ece7df;padding:7px 10px;text-align:center;font-weight:bold;color:${ENCRE};white-space:nowrap">${l.niveau}</td>
<td style="border-bottom:1px solid #ece7df;padding:7px 10px;width:34%">
<div style="background:${CADRE};height:12px;border-radius:6px;width:${largeur}%"></div>
</td>
<td style="border-bottom:1px solid #ece7df;padding:7px 10px">${l.libelle}</td>
</tr>`;
    })
    .join('\n');
  return `<table style="border-collapse:collapse;width:100%"><thead><tr>
<th style="text-align:left;padding:7px 10px;background:${PALE};border-bottom:1px solid #d9d3c9;white-space:nowrap">${titreNiveau}</th>
<th style="text-align:left;padding:7px 10px;background:${PALE};border-bottom:1px solid #d9d3c9">Coût de l’aide</th>
<th style="text-align:left;padding:7px 10px;background:${PALE};border-bottom:1px solid #d9d3c9">${titreLibelle}</th>
</tr></thead><tbody>
${tr}
</tbody></table>`;
}

/**
 * Un arbre de décision : une question en haut, deux ou trois branches dessous.
 * C'est la figure qui remplace le mieux du texte — une règle « on applique dans
 * cet ordre » se lit dix fois plus vite en arbre qu'en liste.
 */
function arbre({ question, branches }) {
  const largeur = Math.floor(100 / branches.length);
  const tetes = branches
    .map(
      (b) =>
        `<td style="width:${largeur}%;padding:0 6px;text-align:center;color:${CADRE};font-size:20px;font-weight:bold">&#8595;</td>`,
    )
    .join('');
  const cond = branches
    .map(
      (b) =>
        `<td style="width:${largeur}%;padding:0 6px 8px;text-align:center;color:${ENCRE};font-weight:bold;font-size:0.95em">${b.condition}</td>`,
    )
    .join('');
  const corps = branches
    .map(
      (b) =>
        `<td style="width:${largeur}%;padding:0 6px;vertical-align:top"><div style="${CASE_}">${b.alors}</div></td>`,
    )
    .join('');
  return `<div style="${CASE_};font-weight:bold;background:${PALE}">${question}</div>
<table style="border-collapse:collapse;width:100%;margin-top:6px"><tbody>
<tr>${cond}</tr>
<tr>${tetes}</tr>
<tr>${corps}</tr>
</tbody></table>`;
}

/**
 * Deux colonnes qui se font face : à gauche ce qui coûte, à droite ce qui le
 * lève. La flèche du milieu porte tout le sens de la figure.
 */
function paires({ gauche, droite, lignes }) {
  const tr = lignes
    .map(
      (l) => `<tr>
<td style="${CASE_PALE};width:44%">${l.g}</td>
<td style="${FLECHE};width:12%">&#8594;</td>
<td style="${CASE_};width:44%">${l.d}</td>
</tr>`,
    )
    .join('\n<tr><td style="height:8px" colspan="3"></td></tr>\n');
  return `<table style="border-collapse:separate;border-spacing:0 0;width:100%"><thead><tr>
<th style="text-align:center;padding:0 0 8px;color:${DOUX};font-size:0.95em">${gauche}</th>
<th></th>
<th style="text-align:center;padding:0 0 8px;color:${DOUX};font-size:0.95em">${droite}</th>
</tr></thead><tbody>
${tr}
</tbody></table>`;
}

/**
 * Une frise : des segments de largeurs différentes, et ce qui est possible dans
 * chacun. Elle rend visible d'un coup ce qu'aucune liste ne fait passer — que
 * la fenêtre où l'on peut agir n'est pas celle où l'on agit.
 */
function frise(segments) {
  const entetes = segments
    .map(
      (s) =>
        `<td style="width:${s.largeur}%;padding:0 3px 6px;text-align:center;font-weight:bold;color:${ENCRE};font-size:0.95em">${s.nom}</td>`,
    )
    .join('');
  const barres = segments
    .map(
      (s) =>
        `<td style="width:${s.largeur}%;padding:0 3px"><div style="height:16px;border-radius:4px;background:${
          s.fort ? CADRE : '#e3d9d3'
        }"></div></td>`,
    )
    .join('');
  const corps = segments
    .map(
      (s) =>
        `<td style="width:${s.largeur}%;padding:8px 3px 0;vertical-align:top;text-align:center;color:${DOUX};font-size:0.94em">${s.quoi}</td>`,
    )
    .join('');
  return `<table style="border-collapse:collapse;width:100%"><tbody>
<tr>${entetes}</tr>
<tr>${barres}</tr>
<tr>${corps}</tr>
</tbody></table>`;
}

/**
 * La carte du parcours : les quatre modules, ce qu'on y produit, et la période
 * de relevé. Elle sert de récapitulatif imprimable en fin d'annexes.
 */
function carte({ modules, releve }) {
  const cases = modules.map((m) => ({ titre: m.titre, detail: m.produit }));
  return `${flux(cases)}
<table style="border-collapse:collapse;width:100%;margin-top:10px"><tbody><tr>
<td style="${CASE_PALE};padding:8px 12px">${releve}</td>
</tr></tbody></table>`;
}

module.exports = { figure, flux, boucle, echelle, arbre, paires, frise, carte, CADRE, ENCRE, DOUX, PALE };
