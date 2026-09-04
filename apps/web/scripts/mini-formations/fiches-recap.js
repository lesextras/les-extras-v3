/**
 * FICHES RÉCAP — le générateur.
 *
 * Une page A4 par mini-formation, à imprimer et à punaiser. Elle ne remplace
 * pas la formation : elle la rappelle. C'est l'objet qu'on retrouve six mois
 * plus tard sur la porte d'un bureau, et c'est pour ça qu'il vaut la peine.
 *
 * ── POURQUOI DU HTML ET PAS UN OUTIL DE DESSIN ──────────────────────────────
 * Parce que le contenu vient des mêmes fichiers que les modules. Le jour où un
 * chiffre change dans un module, la fiche se régénère — elle ne se redessine
 * pas à la main, et elle ne peut donc pas mentir sur ce que la formation dit.
 *
 * ── RENDU ───────────────────────────────────────────────────────────────────
 *   node fiches-recap.js            → écrit les .html dans build/fiches/
 *   puis rendu-fiches.sh            → Chromium headless, PNG 2480×3508 (300 dpi)
 *
 * Le petit script inline en fin de page réduit les blocs qui dépassent plutôt
 * que de les couper : une fiche coupée est inutilisable, une fiche à 96 % de
 * la taille reste parfaitement lisible.
 */

const fs = require('fs');
const path = require('path');
const { FICHES } = require('./fiches-recap-data.js');

const ENCRE = '#1e293b';
const DOUX = '#64748b';
const TRAIT = '#e2e8f0';

/* ── les briques de figures ─────────────────────────────────────────────── */

function figFlux(f) {
  const n = f.cases.length;
  const cells = f.cases
    .map(
      (c, i) => `<td class="fx">
        <div class="fxb"><div class="fxt">${c.t}</div><div class="fxd">${c.d}</div></div>
      </td>${i < n - 1 ? '<td class="fxa">→</td>' : ''}`,
    )
    .join('');
  return `<table class="fxT"><tr>${cells}</tr></table>`;
}

function figBoucle(f) {
  return `${figFlux(f)}
  <div class="bcl"><span class="bcla">↺</span> ${f.retour}</div>`;
}

function figPaires(f) {
  const rows = f.lignes
    .map(
      (l) => `<tr>
      <td class="pg">${l.g}</td>
      <td class="pa">→</td>
      <td class="pd">${l.d}</td>
    </tr>`,
    )
    .join('');
  return `<table class="pT">
    <tr><th class="pth">${f.gauche}</th><th></th><th class="pth pthd">${f.droite}</th></tr>
    ${rows}
  </table>`;
}

function figEchelle(f) {
  const n = f.lignes.length;
  const rows = f.lignes
    .map((l, i) => {
      const w = 100 - (i * 62) / Math.max(1, n - 1);
      return `<tr>
        <td class="en">${l.n}</td>
        <td class="eb"><span class="ebar" style="width:${w}%"></span></td>
        <td class="el">${l.l}</td>
      </tr>`;
    })
    .join('');
  return `<table class="eT">${rows}</table>
  <div class="eleg"><span>＋ d’aide</span><span>moins d’aide ＋ d’autonomie</span></div>`;
}

function figFrise(f) {
  const head = f.segments
    .map(
      (s) =>
        `<td style="width:${s.w}%" class="frh ${s.fort ? 'fort' : ''}">${s.n}</td>`,
    )
    .join('');
  const body = f.segments
    .map((s) => `<td class="frq ${s.fort ? 'fort' : ''}">${s.q}</td>`)
    .join('');
  return `<table class="frT"><tr>${head}</tr><tr>${body}</tr></table>
  <div class="frleg"><b>Barre pleine</b> = l’adulte a une prise réelle &nbsp;·&nbsp; <b>barre claire</b> = on traverse</div>`;
}

function figure(f) {
  const corps =
    f.type === 'flux'
      ? figFlux(f)
      : f.type === 'boucle'
        ? figBoucle(f)
        : f.type === 'paires'
          ? figPaires(f)
          : f.type === 'echelle'
            ? figEchelle(f)
            : figFrise(f);
  return `<div class="box figbox">
    <div class="boxh">${f.titre}</div>
    <div class="boxc shrink">${corps}
      <div class="leg">${f.legende}</div>
    </div>
  </div>`;
}

/* ── l'arbre de décision ────────────────────────────────────────────────── */

function arbre(a) {
  const cards = a.branches
    .map(
      (b) => `<div class="brc">
      <div class="brsi">${b.si}</div>
      <div class="brfl">↓</div>
      <div class="bral">${b.alors}</div>
      <div class="brd">${b.d}</div>
    </div>`,
    )
    .join('');
  return `<div class="box arbox">
    <div class="boxh">${a.titre}</div>
    <div class="boxc shrink">
      <div class="brq">${a.question}</div>
      <div class="brg brg${a.branches.length}">${cards}</div>
    </div>
  </div>`;
}

/* ── la grille vierge, à recopier ──────────────────────────────────────── */

/**
 * L'objet le plus utile de la fiche : la grille du relevé, vide, prête à être
 * recopiée à la main sur une feuille. Les colonnes sont exactement celles du
 * module 4 du parcours — pas une version simplifiée, sinon le relevé rempli ne
 * se lirait plus avec l'arbre de décision de la même fiche.
 */
function grille(g) {
  const th = g.colonnes.map((c) => `<th class="gth">${c}</th>`).join('');
  const td = g.colonnes.map(() => '<td class="gtd">&nbsp;</td>').join('');
  const tr = Array.from({ length: 4 }, () => `<tr>${td}</tr>`).join('');
  return `<div class="box grbox">
    <div class="boxh">${g.titre}</div>
    <div class="boxc">
      <table class="gT"><tr>${th}</tr>${tr}</table>
      <div class="gnote">${g.note}</div>
    </div>
  </div>`;
}

/* ── la page ────────────────────────────────────────────────────────────── */

function page(f, index) {
  const mods = f.parcours
    .map(
      (m, i) => `<div class="mod">
      <div class="modn">${i + 1}</div>
      <div class="modt">${m.quoi}
        <div class="modp">→ vous produisez&nbsp;: <b>${m.produit}</b></div>
      </div>
    </div>`,
    )
    .join('');

  const notionPts = f.notion.points.map((p) => `<li>${p}</li>`).join('');
  const errs = f.erreurs.map((e) => `<li>${e}</li>`).join('');
  const ret = f.retenir.map((r) => `<li>${r}</li>`).join('');
  const ast = f.astuces
    .map((a) => `<div class="ast"><span class="asti">${a.i}</span><span>${a.t}</span></div>`)
    .join('');

  const avert = f.avertissement
    ? `<div class="avert"><b>⚠ Ce que ce parcours ne fait pas.</b> ${f.avertissement}</div>`
    : '';

  return `<!doctype html><html lang="fr"><head><meta charset="utf-8">
<style>
  /* La page fait exactement la taille du gabarit : le PDF sort vectoriel,
     au ratio A4 (1240/1754 = 0,7069 contre 0,7071), et le texte reste net. */
  @page { size: 1240px 1754px; margin: 0 }
  * { box-sizing: border-box; margin: 0; padding: 0 }
  html, body { width: 1240px; height: 1754px }
  body {
    font-family: Poppins, sans-serif; color: ${ENCRE}; background: #fff;
    padding: 26px 30px 22px; display: flex; flex-direction: column; gap: 13px;
    overflow: hidden;
  }
  b, strong { font-weight: 600 }

  /* ── en-tête ─────────────────────────────────────────────────────────── */
  .hd, .comp, .notion, .avert, .astw, .ft { flex: 0 0 auto }
  .hd { display: flex; align-items: flex-start; gap: 18px }
  .hdem { font-size: 54px; line-height: 1; margin-top: 4px }
  .hdx { flex: 1 }
  .kicker { font-size: 12.5px; font-weight: 600; letter-spacing: 1.6px;
    color: ${f.accent}; text-transform: uppercase; margin-bottom: 3px }
  h1 { font-size: 41px; line-height: 1.02; font-weight: 700; letter-spacing: -.6px }
  h1 .t2 { color: ${f.accent} }
  .ruban { display: inline-block; margin-top: 8px; background: ${f.accent};
    color: #fff; font-family: Caveat, cursive; font-size: 25px; line-height: 1;
    padding: 7px 20px 9px; border-radius: 14px; transform: rotate(-.7deg) }
  .hdr { text-align: right; font-size: 11.5px; color: ${DOUX}; line-height: 1.5;
    padding-top: 4px; min-width: 190px }
  .hdr .g { display: inline-block; background: #dcfce7; color: #166534;
    font-weight: 600; padding: 3px 9px; border-radius: 20px; font-size: 11px;
    margin-bottom: 5px }

  .comp { background: ${f.accentDoux}; border-left: 5px solid ${f.accent};
    border-radius: 0 10px 10px 0; padding: 9px 14px; font-size: 13.5px; line-height: 1.4 }
  .comp b { color: ${f.accent} }

  /* ── boîtes ──────────────────────────────────────────────────────────── */
  .box { border: 2px solid ${TRAIT}; border-radius: 14px; overflow: hidden;
    display: flex; flex-direction: column }
  .boxh { font-size: 13px; font-weight: 700; letter-spacing: .9px; padding: 8px 14px;
    color: #fff; background: ${ENCRE} }
  .boxc { padding: 11px 14px; font-size: 12.4px; line-height: 1.42; flex: 1;
    display: flex; flex-direction: column; justify-content: center }
  .leg { margin-top: 9px; font-size: 11px; color: ${DOUX}; font-style: italic;
    line-height: 1.35; border-top: 1px dashed ${TRAIT}; padding-top: 7px }

  /* notion clé */
  .notion { border-color: #fcd34d }
  .notion .boxh { background: #fbbf24; color: #422006 }
  .notion .boxc { background: #fffbeb; flex-direction: row; gap: 14px; align-items: stretch }
  .notion ul { list-style: none; flex: 1 }
  .notion li { position: relative; padding-left: 17px; margin-bottom: 6px; font-size: 12.6px }
  .notion li:last-child { margin-bottom: 0 }
  .notion li::before { content: '●'; position: absolute; left: 0; top: -1px;
    color: #d97706; font-size: 9px }
  .test { width: 300px; background: #fff; border: 2px dashed #f59e0b;
    border-radius: 11px; padding: 10px 12px; display: flex; flex-direction: column;
    justify-content: center }
  .testh { font-size: 10.5px; font-weight: 700; letter-spacing: 1.1px; color: #b45309;
    margin-bottom: 5px }
  .testt { font-family: Caveat, cursive; font-size: 21px; line-height: 1.18; color: #78350f }

  /* ── milieu : parcours + figure ──────────────────────────────────────── */
  .mid { display: grid; grid-template-columns: 1fr 1.18fr; gap: 13px;
    flex: 0 0 auto }
  .parc .boxh { background: ${f.accent} }
  .mod { display: flex; gap: 10px; padding: 7px 0; border-bottom: 1px dashed ${TRAIT} }
  .mod:last-of-type { border-bottom: 0 }
  .modn { width: 25px; height: 25px; flex: 0 0 25px; border-radius: 50%;
    background: ${f.accent}; color: #fff; font-size: 13px; font-weight: 700;
    display: flex; align-items: center; justify-content: center }
  .modt { font-size: 12.4px; line-height: 1.32; font-weight: 500 }
  .modp { font-weight: 400; color: ${DOUX}; font-size: 11.4px; margin-top: 2px }
  .modp b { color: ${f.accent} }
  .rel { margin-top: 9px; background: ${f.accentDoux}; border-radius: 10px;
    padding: 9px 11px; font-size: 11.5px; line-height: 1.36 }
  .rel b { color: ${f.accent} }
  .parc .boxc { justify-content: center }

  /* figures */
  .fxT { width: 100%; border-collapse: collapse }
  .fx { padding: 0 }
  .fxa { color: ${f.accent}; font-size: 19px; font-weight: 700; padding: 0 3px; width: 1% }
  .fxb { border: 2px solid ${f.accent}; background: ${f.accentDoux};
    border-radius: 10px; padding: 7px 6px; text-align: center; height: 100% }
  .fxt { font-size: 12px; font-weight: 700; color: ${f.accent}; line-height: 1.15 }
  .fxd { font-size: 10.4px; color: ${DOUX}; line-height: 1.25; margin-top: 3px }
  .bcl { margin-top: 8px; text-align: center; font-size: 11.6px; color: ${ENCRE};
    background: #f8fafc; border: 1px dashed ${f.accent}; border-radius: 20px; padding: 5px 12px }
  .bcla { color: ${f.accent}; font-weight: 700; margin-right: 5px }

  .pT { width: 100%; border-collapse: collapse }
  .pth { font-size: 10.4px; font-weight: 700; letter-spacing: .5px; text-transform: uppercase;
    color: ${DOUX}; padding-bottom: 5px; text-align: left }
  .pthd { color: ${f.accent} }
  .pT td { padding: 4.5px 0; vertical-align: top; font-size: 11.7px; line-height: 1.3 }
  .pg { color: #9ca3af; width: 41%; padding-right: 8px !important }
  .pg i { font-style: italic; color: #cbd5e1 }
  .pa { color: ${f.accent}; font-weight: 700; width: 5%; text-align: center }
  .pd { width: 54%; padding-left: 8px !important }
  .pT tr + tr td { border-top: 1px solid #f1f5f9 }

  .eT { width: 100%; border-collapse: collapse }
  .eT td { padding: 2.6px 0; vertical-align: middle }
  .en { width: 22px; font-size: 12px; font-weight: 700; color: ${f.accent} }
  .eb { width: 96px; padding-right: 9px !important }
  .ebar { display: block; height: 9px; border-radius: 5px; background: ${f.accent} }
  .el { font-size: 11.4px; line-height: 1.25 }
  .eleg { display: flex; justify-content: space-between; font-size: 10px; color: ${DOUX};
    margin-top: 5px; font-style: italic }

  .frT { width: 100%; border-collapse: separate; border-spacing: 4px 0; table-layout: fixed }
  .frh { text-align: center; font-size: 11px; font-weight: 700; color: #fff;
    background: #fdba74; padding: 6px 3px; border-radius: 8px 8px 0 0; line-height: 1.1 }
  .frh.fort { background: ${f.accent} }
  .frq { font-size: 10.6px; line-height: 1.28; vertical-align: top; padding: 7px 7px;
    background: #fff7ed; border-radius: 0 0 8px 8px; color: ${ENCRE} }
  .frq.fort { background: ${f.accentDoux}; font-weight: 500 }
  .frleg { font-size: 10.4px; color: ${DOUX}; margin-top: 7px; text-align: center }

  /* ── arbre ───────────────────────────────────────────────────────────── */
  .arbox { flex: 0 0 auto }
  .arbox .boxh { background: ${ENCRE} }
  .brq { text-align: center; font-size: 12.6px; font-weight: 600; background: #f8fafc;
    border-radius: 20px; padding: 6px 14px; margin-bottom: 9px }
  .brg { display: grid; gap: 9px }
  .brg2 { grid-template-columns: 1fr 1fr }
  .brg3 { grid-template-columns: repeat(3, 1fr) }
  .brg4 { grid-template-columns: repeat(4, 1fr) }
  .brc { border: 2px solid ${TRAIT}; border-radius: 11px; padding: 8px 9px; text-align: center;
    display: flex; flex-direction: column }
  .brsi { font-size: 11px; color: ${DOUX}; line-height: 1.25; min-height: 27px }
  .brfl { color: ${f.accent}; font-size: 13px; line-height: 1; margin: 3px 0 4px }
  .bral { font-size: 11.4px; font-weight: 700; color: ${f.accent}; line-height: 1.15 }
  .brd { font-size: 10.4px; color: ${DOUX}; line-height: 1.25; margin-top: 4px }

  /* ── grille vierge ───────────────────────────────────────────────────── */
  .grbox .boxh { background: #475569 }
  .gT { width: 100%; border-collapse: collapse; table-layout: fixed }
  .gth { font-size: 10.8px; font-weight: 700; text-transform: uppercase; letter-spacing: .3px;
    color: ${ENCRE}; background: ${f.accentDoux}; border: 1.5px solid ${f.accent};
    padding: 6px 7px; text-align: left; line-height: 1.2 }
  .gtd { border: 1.5px solid #cbd5e1; height: 26px }
  .gnote { margin-top: 8px; font-size: 10.8px; color: ${DOUX}; font-style: italic; line-height: 1.35 }

  /* ── bas : erreurs + à retenir ───────────────────────────────────────── */
  .bot { display: grid; grid-template-columns: 1.42fr 1fr; gap: 13px;
    flex: 0 0 auto }
  .err { border-color: #fecaca }
  .err .boxh { background: #dc2626 }
  .err .boxc { background: #fef2f2; justify-content: flex-start }
  .err ul { list-style: none }
  .err li { position: relative; padding-left: 20px; margin-bottom: 5.5px; font-size: 11.8px;
    line-height: 1.32 }
  .err li:last-child { margin-bottom: 0 }
  .err li::before { content: '✕'; position: absolute; left: 2px; top: 0; color: #dc2626;
    font-weight: 700; font-size: 11px }

  .note { background: #fef9c3; border: 2px solid #fde047; border-radius: 12px;
    padding: 12px 15px 13px; transform: rotate(.5deg);
    box-shadow: 3px 4px 0 rgba(0,0,0,.05) }
  .noteh { font-family: Caveat, cursive; font-size: 27px; color: #854d0e; line-height: 1;
    margin-bottom: 8px }
  .note ul { list-style: none }
  .note li { position: relative; padding-left: 21px; margin-bottom: 6px; font-size: 12.2px;
    line-height: 1.3; font-weight: 500 }
  .note li:last-child { margin-bottom: 0 }
  .note li::before { content: '✓'; position: absolute; left: 0; top: -1px; color: #16a34a;
    font-weight: 700 }

  .avert { background: #fff1f2; border: 2px dashed #fda4af; border-radius: 10px;
    padding: 7px 12px; font-size: 11.2px; line-height: 1.35; color: #881337 }

  /* ── astuces + pied ──────────────────────────────────────────────────── */
  .astw { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px }
  .ast { display: flex; gap: 8px; align-items: flex-start; background: #f8fafc;
    border-radius: 10px; padding: 8px 10px; font-size: 11.1px; line-height: 1.3 }
  .asti { font-size: 15px; line-height: 1.1 }
  .ft { display: flex; justify-content: space-between; align-items: center;
    border-top: 2px solid ${TRAIT}; padding-top: 8px; font-size: 11px; color: ${DOUX} }
  .ft b { color: ${ENCRE} }
  .ftb { background: ${ENCRE}; color: #fff; padding: 4px 12px; border-radius: 20px;
    font-size: 10.6px; font-weight: 600; letter-spacing: .4px }
</style></head><body>

  <div class="hd">
    <div class="hdem">${f.emoji}</div>
    <div class="hdx">
      <div class="kicker">${f.thematique}</div>
      <h1>${f.titre}<br><span class="t2">${f.titre2}</span></h1>
      <div class="ruban">${f.ruban}</div>
    </div>
    <div class="hdr">
      <div class="g">GRATUIT · 100 %</div><br>
      <b style="color:${ENCRE}">Fiche récap ${String(index + 1).padStart(2, '0')}/${FICHES.length}</b><br>
      ${f.duree}<br>
      Association ADéPA · les-extras.fr
    </div>
  </div>

  <div class="comp"><b>La compétence travaillée :</b> ${f.competence}</div>

  <div class="box notion">
    <div class="boxh">${f.notion.titre}</div>
    <div class="boxc">
      <ul>${notionPts}</ul>
      <div class="test">
        <div class="testh">LE TEST QUI TRANCHE</div>
        <div class="testt">${f.notion.test}</div>
      </div>
    </div>
  </div>

  <div class="mid">
    <div class="box parc">
      <div class="boxh">LE PARCOURS EN 4 MODULES</div>
      <div class="boxc">${mods}<div class="rel">${f.releve}</div></div>
    </div>
    ${figure(f.figure)}
  </div>

  ${arbre(f.arbre)}

  ${grille(f.grille)}

  <div class="bot">
    <div class="box err">
      <div class="boxh">LES ERREURS QUI COÛTENT LE PLUS</div>
      <div class="boxc"><ul>${errs}</ul></div>
    </div>
    <div class="note">
      <div class="noteh">À retenir&nbsp;!</div>
      <ul>${ret}</ul>
    </div>
  </div>

  ${avert}

  <div class="astw">${ast}</div>

  <div class="ft">
    <div><b>ADéPA</b> — association loi 1901, Melun (77) · Cette fiche résume un parcours, elle ne le remplace pas.</div>
    <div><span class="ftb">les-extras.fr/formations/${f.slug}</span></div>
  </div>

<script>
/* ── MISE EN PAGE FINALE ───────────────────────────────────────────────────
   Chaque encadré prend la hauteur de son contenu — aucun grand blanc à
   l'intérieur d'une boîte, ce qui donnerait l'impression qu'il manque
   quelque chose. Le reste de la page se répartit en respiration entre les
   encadrés, et si le contenu déborde, ce sont les encadrés eux-mêmes qui se
   réduisent : une fiche coupée serait inutilisable, une fiche à 90 % reste
   parfaitement lisible à l'impression. */
(function () {
  var H = 1754, PAD = 48, GAP = 12;
  var kids = [].filter.call(document.body.children, function (e) {
    return e.tagName !== 'SCRIPT';
  });
  function total() {
    return kids.reduce(function (a, e) { return a + e.getBoundingClientRect().height; }, 0);
  }
  var libre = function (g) { return H - PAD - total() - g * (kids.length - 1); };

  /* 1. le contenu déborde : on réduit les grands encadrés, pas la page */
  var gros = document.querySelectorAll('.mid .boxc, .arbox .boxc, .bot .boxc, .note');
  var z = 1;
  for (var i = 0; i < 30 && libre(GAP) < 0; i++) {
    z -= 0.015;
    [].forEach.call(gros, function (e) { e.style.zoom = z; });
  }

  /* 2. il reste de la place : elle devient de la respiration entre encadrés */
  var g = Math.min(34, GAP + Math.max(0, libre(GAP)) / (kids.length - 1));
  document.body.style.gap = g + 'px';
})();
</script>
</body></html>`;
}

/* ── écriture ───────────────────────────────────────────────────────────── */

const dossier = path.join(__dirname, 'build', 'fiches');
fs.mkdirSync(dossier, { recursive: true });
FICHES.forEach((f, i) => {
  fs.writeFileSync(path.join(dossier, f.slug + '.html'), page(f, i));
  console.log('fiche', String(i + 1).padStart(2, '0'), f.slug);
});
console.log('\n' + FICHES.length + ' fiches ecrites dans', dossier);
