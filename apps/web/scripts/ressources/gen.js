// Générateur des ressources gratuites Les Extras (PDF + aperçus).
//
// Usage, depuis ce dossier :
//   npm i --no-save @fontsource/poppins @fontsource/caveat playwright
//   node gen.js /tmp/ressources-sortie [identifiant]
// puis copier les PDF dans apps/web/public/ressources/ et réduire les aperçus
// PNG en JPG de 520 px dans apps/web/public/ressources/apercus/.
//
// ⚠ Les polices sont intégrées en data URI : une page ouverte par setContent
// ne charge pas les fichiers file:// (vu le 01/10/2026, Caveat absente).
// ⚠ Une page qui déborde voit son corps de texte réduit jusqu'à 7,4 pt ;
// au-delà, le script le signale : retirer des lignes, pas réduire encore.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const R = require('./contenu.js');

const OUT = process.argv[2] || '/tmp/res/out';
fs.mkdirSync(path.join(OUT, 'apercus'), { recursive: true });
const F = (n) => 'data:font/woff2;base64,' + fs.readFileSync(path.join(__dirname, 'node_modules/@fontsource', n)).toString('base64');

const CSS = `
@font-face{font-family:Poppins;font-weight:400;src:url(${F('poppins/files/poppins-latin-400-normal.woff2')})}
@font-face{font-family:Poppins;font-weight:600;src:url(${F('poppins/files/poppins-latin-600-normal.woff2')})}
@font-face{font-family:Poppins;font-weight:700;src:url(${F('poppins/files/poppins-latin-700-normal.woff2')})}
@font-face{font-family:Poppins;font-weight:800;src:url(${F('poppins/files/poppins-latin-800-normal.woff2')})}
@font-face{font-family:Caveat;font-weight:500;src:url(${F('caveat/files/caveat-latin-500-normal.woff2')})}
@font-face{font-family:Caveat;font-weight:700;src:url(${F('caveat/files/caveat-latin-700-normal.woff2')})}
:root{--navy:#1e2746;--indigo:#5146d8;--indigo-l:#eceafd;--jaune:#f4c542;--jaune-l:#fdf5d8;--vert:#1f8a5b;--vert-l:#e3f4ec;--corail:#d9454b;--corail-l:#fbe5e5;--gris:#5b6275;--ligne:#d9dce6;--fond:#f5f6fb}
*{box-sizing:border-box;margin:0;padding:0}
html{-webkit-print-color-adjust:exact;print-color-adjust:exact}
body{font-family:Poppins,sans-serif;color:var(--navy);font-size:9.6pt;line-height:1.45}
.page{width:210mm;height:297mm;padding:12mm 13mm 10mm;position:relative;overflow:hidden;page-break-after:always;display:flex;flex-direction:column;gap:4.2mm}
.page.paysage{width:297mm;height:210mm;padding:14mm 16mm}
.page:last-child{page-break-after:auto}
.page>*{flex-shrink:0}
.tete{display:flex;justify-content:space-between;gap:8mm;align-items:flex-start}
.kicker{font-size:8pt;font-weight:700;letter-spacing:.09em;text-transform:uppercase;color:var(--indigo)}
h1{font-size:24pt;line-height:1.02;font-weight:800;text-transform:uppercase;letter-spacing:-.01em;margin-top:1mm}
h1 span{color:var(--indigo);display:block}
.sous{display:inline-block;margin-top:2.5mm;background:var(--indigo);color:#fff;font-family:Caveat;font-weight:500;font-size:15pt;padding:.6mm 4mm;border-radius:3mm}
.meta{text-align:right;font-size:7.6pt;color:var(--gris);white-space:nowrap}
.meta b{display:block;color:var(--navy);font-size:8.4pt}
.badge{display:inline-block;background:var(--vert-l);color:var(--vert);font-weight:700;font-size:7.4pt;letter-spacing:.05em;padding:.8mm 2.5mm;border-radius:9mm;margin-bottom:2mm}
.bandeau{background:var(--indigo-l);border-left:4px solid var(--indigo);padding:2.6mm 4mm;border-radius:2mm;font-size:9pt}
.bandeau b{color:var(--indigo)}
.grille{display:grid;gap:4mm}
.g2{grid-template-columns:1fr 1fr}.g3{grid-template-columns:1fr 1fr 1fr}
.bloc{border:1.4px solid var(--ligne);border-radius:3mm;overflow:hidden;background:#fff;display:flex;flex-direction:column}
.bloc>h2{font-size:8.6pt;font-weight:700;letter-spacing:.07em;text-transform:uppercase;padding:2mm 3.6mm;background:var(--navy);color:#fff}
.bloc.jaune>h2{background:var(--jaune);color:var(--navy)}
.bloc.indigo>h2{background:var(--indigo)}
.bloc.vert>h2{background:var(--vert)}
.bloc.corail>h2{background:var(--corail)}
.bloc .c{padding:3mm 3.6mm;flex:1}
.bloc ul{padding-left:4.2mm}.bloc li{margin-bottom:1.1mm}
.bloc ol{padding-left:0;list-style:none;counter-reset:n}
.bloc ol li{counter-increment:n;position:relative;padding-left:8mm;margin-bottom:1.8mm}
.bloc ol li::before{content:counter(n);position:absolute;left:0;top:-.2mm;width:5.6mm;height:5.6mm;border-radius:50%;background:var(--indigo);color:#fff;font-weight:700;font-size:8pt;display:grid;place-items:center}
.temps{display:inline-block;min-width:15mm;font-weight:700;color:var(--indigo)}
.dit{font-family:Caveat;font-weight:500;font-size:15pt;line-height:1.15;color:var(--navy)}
.aretenir{background:var(--jaune-l);border:1.4px dashed #d6a91f;border-radius:3mm;padding:3mm 4mm}
.aretenir h3{font-family:Caveat;font-weight:700;font-size:17pt;color:#9a6c00;margin-bottom:1mm}
.lignes{display:flex;flex-direction:column;gap:6.2mm;padding-top:2mm}
.lignes i{display:block;border-bottom:1px dotted #9aa1b4;height:0}
table{width:100%;border-collapse:collapse;font-size:8.8pt}
th{text-align:left;font-size:7.6pt;letter-spacing:.05em;text-transform:uppercase;color:var(--indigo);padding:1.6mm 2mm;border-bottom:1.6px solid var(--indigo)}
td{padding:1.8mm 2mm;border-bottom:1px solid var(--ligne);vertical-align:top}
td.vide{height:9mm}
.avant{color:var(--corail)}.apres{color:var(--vert);font-weight:600}
.pied{margin-top:auto;display:flex;justify-content:space-between;align-items:center;gap:6mm;font-size:7.2pt;color:var(--gris);border-top:1px solid var(--ligne);padding-top:2.2mm}
.pied .url{background:var(--navy);color:#fff;padding:1mm 3mm;border-radius:9mm;font-weight:600;white-space:nowrap}
.cadre{border:2px dashed var(--ligne);border-radius:3mm;min-height:24mm;padding:2.5mm 3mm;color:var(--gris);font-size:8pt}
.etiquette{font-size:7.4pt;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--indigo);margin-bottom:1mm}
.poster h1{font-size:40pt}
.diapo{justify-content:center}
.diapo h1{font-size:34pt}
.diapo .num{position:absolute;right:16mm;bottom:10mm;font-size:9pt;color:var(--gris)}
.diapo .zone{border:2px dashed var(--ligne);border-radius:4mm;padding:8mm;font-size:12pt;color:var(--gris);min-height:95mm}
.diapo .titre-diapo{font-size:30pt;font-weight:800;margin-bottom:5mm}
.diapo .titre-diapo small{display:block;font-size:10pt;font-weight:600;color:var(--indigo);letter-spacing:.08em;text-transform:uppercase}
.diapo .puces{font-size:17pt;line-height:1.7;padding-left:7mm}
`;

const PIED = (r) => `<div class="pied"><span><b>ADéPA</b> · association loi 1901, Melun (77) · Ressource gratuite, à utiliser et à copier librement dans votre structure, pas à revendre.${r.fictif ? ' Les exemples sont fictifs.' : ''}</span><span class="url">les-extras.fr/ressources</span></div>`;

const TETE = (r) => `<div class="tete"><div><div class="kicker">${r.kicker}</div><h1>${r.titre1}<span>${r.titre2}</span></h1>${r.sous ? `<div class="sous">${r.sous}</div>` : ''}</div><div class="meta"><div class="badge">GRATUIT · 100 %</div><b>${r.format}</b>${r.meta || ''}<br>Association ADéPA · les-extras.fr</div></div>`;

function html(r) {
  const pages = r.pages ? r.pages(r) : [`<section class="page ${r.classe || ''}">${TETE(r)}${r.corps}${PIED(r)}</section>`];
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><style>${CSS}</style></head><body>${pages.join('')}</body></html>`;
}

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage();
  const seul = process.argv[3];
  for (const r of R) {
    if (seul && r.id !== seul) continue;
    await p.setContent(html(r), { waitUntil: 'load' });
    await p.evaluate(() => document.fonts.ready);
    const polices = await p.evaluate(() => [document.fonts.check('500 12px Caveat'), document.fonts.check('700 12px Poppins')]);
    // Ajustement : on réduit le corps de texte tant qu'une page déborde.
    await p.evaluate(() => {
      let fs = 9.6;
      const deborde = () => [...document.querySelectorAll('.page')].some((x) => x.scrollHeight > x.clientHeight + 1);
      while (deborde() && fs > 7.4) { fs -= 0.2; document.body.style.fontSize = fs + 'pt'; }
    });
    if (!polices[0]) console.log('  police Caveat absente');
    const paysage = Boolean(r.paysage);
    await p.pdf({ path: path.join(OUT, r.id + '.pdf'), format: 'A4', landscape: paysage, printBackground: true, margin: { top: 0, right: 0, bottom: 0, left: 0 } });
    // Aperçu : la première page, à 600 px de large.
    const w = paysage ? 1123 : 794, h = paysage ? 794 : 1123;
    await p.setViewportSize({ width: w, height: h });
    const el = await p.$('.page');
    await el.screenshot({ path: path.join(OUT, 'apercus', r.id + '.png') });
    // Débordement : le contenu doit tenir dans chaque page.
    const deborde = await p.$$eval('.page', (ps) => ps.map((x) => x.scrollHeight > x.clientHeight + 2));
    console.log(r.id, deborde.some(Boolean) ? 'DÉBORDE ' + JSON.stringify(deborde) : 'ok');
  }
  await b.close();
})();
