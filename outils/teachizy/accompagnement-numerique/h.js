// Gabarit HTML des ajouts de la refonte 2026, calqué sur les styles en ligne
// déjà utilisés dans les leçons Toulali (cartes grises, encarts à filet vert,
// tableaux à filets fins). Aucun style nouveau : les ajouts doivent se fondre.

const P = 'margin:14px 0;line-height:1.72';
const UL = 'margin:14px 0;padding-left:22px';
const LI = 'margin:7px 0';
const TH = 'text-align:left;padding:9px 12px;border-bottom:2px solid #d8dde2;font-weight:600;vertical-align:bottom';
const TD = 'padding:9px 12px;border-bottom:1px solid #e8ecef;vertical-align:top';

const h3 = (t) => `<h3 style="margin:34px 0 12px">${t}</h3>`;
const h4 = (t) => `<h4 style="margin:26px 0 8px">${t}</h4>`;
const p = (t) => `<p style="${P}">${t}</p>`;
const ul = (items) => `<ul style="${UL}">${items.map((i) => `<li style="${LI}">${i}</li>`).join('')}</ul>`;
const ol = (items) => `<ol style="${UL}">${items.map((i) => `<li style="${LI}">${i}</li>`).join('')}</ol>`;
const hr = () => '<hr style="height:1px;border:0;background:#e5e0d8;margin:34px 0">';
const table = (head, rows) =>
  `<table style="width:100%;border-collapse:collapse;margin:18px 0;font-size:0.95em"><thead><tr>${head
    .map((c) => `<th style="${TH}">${c}</th>`)
    .join('')}</tr></thead><tbody>${rows
    .map((r) => `<tr>${r.map((c) => `<td style="${TD}">${c}</td>`).join('')}</tr>`)
    .join('')}</tbody></table>`;
// Carte grise, comme « Repères du module » et « À retenir ».
const carte = (titre, inner, marge = '26px 0') =>
  `<div style="background:#f6f7f8;border-radius:12px;padding:18px 24px;margin:${marge}"><h3 style="margin-top:0">${titre}</h3>${inner}</div>`;
// Encart à filet vert, comme « Dans votre secteur ».
const encart = (titre, inner) =>
  `<div style="background:#f4f7f6;border-left:4px solid #7a9c92;border-radius:0 10px 10px 0;padding:16px 22px;margin:26px 0"><h4 style="margin:0 0 8px;color:#3f6158">${titre}</h4>${inner}</div>`;
// Encart d'alerte (même gabarit, filet terracotta de la charte des schémas).
const alerte = (titre, inner) =>
  `<div style="background:#fbf3f0;border-left:4px solid #cf6f56;border-radius:0 10px 10px 0;padding:16px 22px;margin:26px 0"><h4 style="margin:0 0 8px;color:#8f4533">${titre}</h4>${inner}</div>`;
const pe = (t) => `<p style="margin:6px 0;line-height:1.65">${t}</p>`;
const lignes = (n = 2) => Array.from({ length: n }, () => `<p style="margin:4px 0;color:#9aa0a6;overflow:hidden;white-space:nowrap;max-width:100%">…………………………………………………………………………………………</p>`).join('');

// La matrice d'alignement du cahier des charges : aucun objectif sans
// activité, évaluation et preuve.
// La matrice d'alignement du cahier des charges : aucun objectif sans
// activité, évaluation et preuve. Une carte par objectif plutôt qu'un tableau
// à cinq colonnes : lisible sur la largeur étroite de Teachizy et au téléphone.
const LIGNE_L = 'padding:5px 14px 5px 0;color:#6b6f76;vertical-align:top;width:118px;white-space:nowrap;font-size:0.92em';
const LIGNE_V = 'padding:5px 0;vertical-align:top;line-height:1.55';
const matrice = (rows, domaineTitre = 'Cadre DigComp 2.2') =>
  hr() +
  h3('Ce que vous saurez faire, et comment on le vérifie') +
  p('Chaque objectif du module est relié à ce que vous faites pour l’atteindre, à la façon dont il est évalué et à la preuve que vous gardez.') +
  rows
    .map(
      ([obj, act, ev, preuve, dom], i) =>
        `<div style="border:1px solid #e5e0d8;border-left:4px solid #cf6f56;border-radius:10px;padding:14px 20px;margin:14px 0;background:#fff">` +
        `<p style="margin:0 0 10px;font-weight:bold;color:#2b2f36;line-height:1.5"><span style="color:#cf6f56">Objectif ${i + 1}.</span> ${obj}</p>` +
        `<table style="width:100%;border-collapse:collapse;margin:0"><tbody>` +
        [['Activité', act], ['Évaluation', ev], ['Preuve gardée', preuve], [domaineTitre, dom]]
          .map(([l, v]) => `<tr><td style="${LIGNE_L}">${l}</td><td style="${LIGNE_V}">${v}</td></tr>`)
          .join('') +
        `</tbody></table></div>`,
    )
    .join('');

// La grille commune 0 à 3 (cahier des charges, section 7), en deux tableaux
// courts plutôt qu'un tableau à cinq colonnes de texte.
const CRITERES = [
  ['Exactitude', 'aucune erreur de fait, de calcul ou de destinataire'],
  ['Autonomie', 'réalisé seul·e, avec une méthode assumée'],
  ['Qualité professionnelle', 'utilisable tel quel par un collègue ou un client'],
  ['Sécurité et données', 'règles appliquées et expliquées, aucune donnée réelle exposée'],
  ['Accessibilité', 'vérifiée avec l’outil ou la check-list'],
  ['Respect des consignes', 'livrable complet et conforme'],
  ['Explication des choix', 'chaque choix est justifié, avec une alternative'],
  ['Transfert au contexte réel', 'mis en œuvre dans votre travail réel'],
];
const grille = (pointsPropres) =>
  hr() +
  h3('La grille d’évaluation') +
  p('Le formateur note huit critères de 0 à 3, avec la même grille pour tous les devoirs du parcours. Relisez-la avant de déposer : c’est le meilleur moyen de ne pas être surpris.') +
  table(
    ['Note', 'Ce qu’elle veut dire'],
    [
      ['<strong>0</strong>', 'absent, hors sujet, ou une erreur grave'],
      ['<strong>1</strong>', 'partiel, avec beaucoup d’aide'],
      ['<strong>2</strong>', 'presque atteint, un point à reprendre'],
      ['<strong>3</strong>', 'pleinement atteint, en autonomie'],
    ],
  ) +
  table(['Critère', 'Ce qui vaut 3'], CRITERES.map(([c, d]) => [`<strong>${c}</strong>`, d])) +
  table(
    ['Total sur 24', 'Résultat'],
    [
      ['0 à 11', '<strong>Non acquis</strong> : retour détaillé du formateur, nouveau dépôt après correction'],
      ['12 à 16', '<strong>En cours d’acquisition</strong> : deux ou trois points à reprendre, nouveau dépôt conseillé'],
      ['17 à 20', '<strong>Acquis</strong> : devoir validé'],
      ['21 à 24', '<strong>Maîtrisé</strong> : devoir validé, livrable réutilisable comme exemple avec votre accord'],
    ],
  ) +
  alerte('La règle de sécurité', pe('Un 0 sur « Sécurité et données » rend le devoir non validé, quel que soit le total : une donnée réelle exposée ne se compense pas par la qualité du reste.')) +
  (pointsPropres && pointsPropres.length
    ? h4('Ce que le formateur regarde en particulier sur ce devoir') + ul(pointsPropres)
    : '');

const accessibilite = (revue) =>
  carte(
    'Aide, accessibilité et version',
    ul([
      '<strong>Besoin d’un aménagement ?</strong> Temps supplémentaire, supports agrandis ou imprimés, lecture à voix haute, exercice non chronométré, pauses : signalez-le avant ou pendant la formation, sur la page <a href="https://adepa77.fr/accessibilite-handicap/" target="_blank" rel="noopener">Accessibilité et situation de handicap d’ADéPA</a> ou directement au formateur. Toutes les activités chronométrées ont une version sans chronomètre.',
      '<strong>Reprendre après une interruption :</strong> chaque partie se suit seule. Notez dans votre carnet de bord la dernière section terminée, et reprenez par « Avant de passer au module suivant » pour vérifier où vous en êtes.',
      `<strong>Version :</strong> contenu revu le 24 septembre 2026. Les menus, boutons et fonctions d’outils cités ont été vérifiés à cette date et peuvent changer. ${revue}`,
    ]),
  );

const casPratique = (titre, situation, consigne, correction, commentaire) =>
  hr() +
  h3(`Cas pratique corrigé : ${titre}`) +
  encart('La situation', situation) +
  (consigne ? h4('Ce que vous faites') + consigne : '') +
  carte('La correction commentée', correction + (commentaire ? pe(commentaire) : ''));

module.exports = { h3, h4, p, ul, ol, hr, table, carte, encart, alerte, pe, lignes, matrice, grille, accessibilite, casPratique };
