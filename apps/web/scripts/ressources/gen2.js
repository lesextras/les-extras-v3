// Générateur de la banque d'outils : PDF + aperçu PNG + specs.json (pour office.py).
// node gen2.js <sortie> [id]
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const { html } = require('./dsl.js');

const OUTILS = ['scenarios', 'acm', 'social', 'temps', 'motivation', 'emotions', 'observation', 'ecrits', 'animation', 'organisation', 'familles', 'associations', 'affiches', 'presentations']
  .filter((f) => fs.existsSync(path.join(__dirname, 'outils', f + '.js'))).flatMap((f) => require(`./outils/${f}.js`));

const OUT = process.argv[2] || '/tmp/res2/out';
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
body{font-family:Poppins,'Noto Color Emoji',sans-serif;color:var(--navy);font-size:9.6pt;line-height:1.45}
.page{width:210mm;height:297mm;padding:12mm 13mm 10mm;position:relative;overflow:hidden;page-break-after:always;display:flex;flex-direction:column;gap:4mm}
.page.paysage{width:297mm;height:210mm;padding:12mm 15mm 10mm}
.page:last-child{page-break-after:auto}
.page>*{flex-shrink:0}
.tete{display:flex;justify-content:space-between;gap:8mm;align-items:flex-start}
.kicker{font-size:8pt;font-weight:700;letter-spacing:.09em;text-transform:uppercase;color:var(--indigo)}
h1{font-size:23pt;line-height:1.02;font-weight:800;text-transform:uppercase;letter-spacing:-.01em;margin-top:1mm}
h1 span{color:var(--indigo);display:block}
.sous{display:inline-block;margin-top:2.5mm;background:var(--indigo);color:#fff;font-family:Caveat;font-weight:500;font-size:15pt;padding:.6mm 4mm;border-radius:3mm}
.meta{text-align:right;font-size:7.6pt;color:var(--gris);white-space:nowrap}
.meta b{display:block;color:var(--navy);font-size:8.4pt}
.badge{display:inline-block;background:var(--vert-l);color:var(--vert);font-weight:700;font-size:7.4pt;letter-spacing:.05em;padding:.8mm 2.5mm;border-radius:9mm;margin-bottom:2mm}
.mini{display:flex;justify-content:space-between;font-size:8pt;font-weight:700;color:var(--indigo);text-transform:uppercase;letter-spacing:.08em;border-bottom:1.4px solid var(--ligne);padding-bottom:2mm}
.bandeau{background:var(--indigo-l);border-left:4px solid var(--indigo);padding:2.6mm 4mm;border-radius:2mm;font-size:9pt}
.bandeau b{color:var(--indigo)}
.para{font-size:9.4pt}.petit{font-size:7.8pt;color:var(--gris)}
.grille{display:grid;gap:4mm}
.g2{grid-template-columns:1fr 1fr}.g3{grid-template-columns:1fr 1fr 1fr}.g4{grid-template-columns:repeat(4,1fr)}
.bloc{border:1.4px solid var(--ligne);border-radius:3mm;overflow:hidden;background:#fff;display:flex;flex-direction:column}
.bloc>h2{font-size:8.6pt;font-weight:700;letter-spacing:.07em;text-transform:uppercase;padding:2mm 3.6mm;background:var(--navy);color:#fff}
.bloc.jaune>h2{background:var(--jaune);color:var(--navy)}.bloc.indigo>h2{background:var(--indigo)}.bloc.vert>h2{background:var(--vert)}.bloc.corail>h2{background:var(--corail)}
.bloc .c{padding:3mm 3.6mm;flex:1}
.bloc ul{padding-left:4.2mm}.bloc li{margin-bottom:1.1mm}
.bloc ol{padding-left:0;list-style:none;counter-reset:n}
.bloc ol li{counter-increment:n;position:relative;padding-left:8mm;margin-bottom:1.8mm}
.bloc ol li::before{content:counter(n);position:absolute;left:0;top:-.2mm;width:5.6mm;height:5.6mm;border-radius:50%;background:var(--indigo);color:#fff;font-weight:700;font-size:8pt;display:grid;place-items:center}
.temps{display:inline-block;min-width:15mm;font-weight:700;color:var(--indigo)}
.aretenir{background:var(--jaune-l);border:1.4px dashed #d6a91f;border-radius:3mm;padding:3mm 4mm}
.aretenir h3{font-family:Caveat;font-weight:700;font-size:16pt;color:#9a6c00;margin-bottom:1mm}
.aretenir ul{padding-left:4.2mm}
.lignes{display:flex;flex-direction:column;gap:6mm;padding-top:2.4mm}
.lignes i{display:block;border-bottom:1px dotted #9aa1b4;height:0}
table.t{width:100%;border-collapse:collapse;font-size:8.6pt}
table.t th{text-align:left;font-size:7.4pt;letter-spacing:.04em;text-transform:uppercase;color:#fff;background:var(--indigo);padding:1.6mm 2mm;border:1px solid var(--indigo)}
table.t td{padding:1.6mm 2mm;border:1px solid var(--ligne);vertical-align:top}

table.t td.gras{font-weight:600}
table.t td.emo{font-family:'Noto Color Emoji';font-size:15pt;text-align:center;vertical-align:middle}
table.t tr.total td{font-weight:700;background:var(--fond);height:8mm}
.champs{display:grid;gap:1mm 6mm}.champs.c2{grid-template-columns:1fr 1fr}.champs.c3{grid-template-columns:1fr 1fr 1fr}
.champ .etiquette{margin-top:1.4mm}
.etiquette{font-size:7.4pt;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--indigo)}
.cadre{border:2px dashed var(--ligne);border-radius:3mm;padding:2.5mm 3mm;color:var(--gris);font-size:8pt}
.cadre .aide{font-size:7.6pt;margin-top:1mm}
.cartes{display:grid;gap:3mm}
.carte{border:2px solid var(--ligne);border-radius:3mm;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:2mm;min-height:34mm;background:#fff}
.carte .emo{font-family:'Noto Color Emoji';font-size:30pt;line-height:1.1;min-height:12mm}
.carte .mot{font-weight:700;font-size:11pt;text-align:center;margin-top:1.5mm}
.carte.vierge{border-style:dashed}
.coches{display:grid;gap:1.6mm 6mm}.coches.c2{grid-template-columns:1fr 1fr}.coches.c3{grid-template-columns:1fr 1fr 1fr}
.coche{display:flex;gap:2.4mm;align-items:flex-start}
.coche .case{flex:0 0 4.4mm;height:4.4mm;border:1.6px solid var(--indigo);border-radius:1mm;margin-top:.5mm}
.echelle{display:flex;flex-direction:column;gap:3mm;flex:1}
.niv{display:grid;grid-template-columns:20mm 1fr;gap:4mm;flex:1}
.niv .num{border-radius:3mm;display:grid;place-items:center;color:#fff;font-size:24pt;font-weight:800}
.niv .nt{font-size:13pt;font-weight:700;color:var(--navy)}.niv .na{font-size:10pt;margin-top:1mm}
.pied{margin-top:auto;display:flex;justify-content:space-between;align-items:center;gap:6mm;font-size:7.2pt;color:var(--gris);border-top:1px solid var(--ligne);padding-top:2.2mm}
.pied .url{background:var(--navy);color:#fff;padding:1mm 3mm;border-radius:9mm;font-weight:600;white-space:nowrap}
.poster h1{font-size:36pt}
.poster .carte .emo{font-size:40pt}.poster .carte .mot{font-size:14pt}
.diapo{justify-content:flex-start}
.diapo .titre-diapo{font-size:28pt;font-weight:800;margin:2mm 0 4mm}
.diapo .zone{border:2px dashed var(--ligne);border-radius:4mm;padding:7mm;font-size:12pt;color:var(--gris);flex:1}
.diapo .puces{font-size:16pt;line-height:1.7;padding-left:7mm}
.diapo .num{position:absolute;right:15mm;bottom:8mm;font-size:8.5pt;color:var(--gris)}
.diplome{border:5mm solid var(--indigo);border-radius:6mm;flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:10mm;gap:5mm;background:var(--indigo-l)}
.diplome .emo{font-family:'Noto Color Emoji';font-size:54pt}
.diplome .gros{font-size:34pt;font-weight:800;text-transform:uppercase;color:var(--indigo);line-height:1}
.diplome .main{font-family:Caveat;font-size:24pt}
.diplome .ligne-nom{width:70%;border-bottom:2px solid var(--navy);height:14mm}
`;

const PIED = (r) => `<div class="pied"><span><b>ADéPA</b> · association loi 1901, Melun (77) · Outil gratuit, à utiliser et à copier librement dans votre structure, pas à revendre.${r.fictif ? ' Les exemples sont fictifs.' : ''}${r.modele ? ' Modèle à adapter et à faire valider par votre structure.' : ''}</span><span class="url">les-extras.fr/ressources</span></div>`;
const TETE = (r) => `<div class="tete"><div><div class="kicker">${r.kicker}</div><h1>${r.t1}<span>${r.t2}</span></h1>${r.sous ? `<div class="sous">${r.sous}</div>` : ''}</div><div class="meta"><div class="badge">GRATUIT · 100 %</div><b>${r.format}</b>${r.meta ? '<br>' + r.meta : ''}<br>Association ADéPA · les-extras.fr</div></div>`;
const MINI = (r, i, n) => `<div class="mini"><span>${r.t1} ${r.t2}</span><span>${i} / ${n}</span></div>`;

function blocsHtml(blocs) {
  return blocs.map((b) => (typeof b === 'string' ? b : html(b))).join('');
}

function pagesHtml(r) {
  if (r.diapos) {
    return r.diapos.map(([court, grand, items], i) => `<section class="page paysage diapo">
      <div class="kicker">${String(i + 1).padStart(2, '0')} · ${court}</div>
      <div class="titre-diapo">${grand}</div>
      <div class="zone"><div class="etiquette">À écrire ici</div><ul class="puces">${items.map((x) => `<li>${x}</li>`).join('')}</ul></div>
      <div class="num">${r.t1} ${r.t2} · modèle gratuit ADéPA · les-extras.fr/ressources · ${i + 1} / ${r.diapos.length}</div>
    </section>`);
  }
  const pages = r.pages || [r.corps];
  return pages.map((blocs, i) => `<section class="page ${r.paysage ? 'paysage' : ''} ${r.classe || ''}">${i === 0 ? TETE(r) : MINI(r, i + 1, pages.length)}${blocsHtml(blocs)}${PIED(r)}</section>`);
}

function typo(h) {
  return h.replace(/>([^<]*)</g, (m, t) => '>' + t.replace(/ ([?!;:»])/g, '\u202f$1').replace(/« /g, '«\u202f') + '<');
}

function doc(r) {
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><style>${CSS}</style></head><body>${typo(pagesHtml(r).join(''))}</body></html>`;
}

(async () => {
  const seul = process.argv[3];
  const ids = new Set();
  for (const r of OUTILS) {
    if (ids.has(r.id)) throw new Error('doublon ' + r.id);
    ids.add(r.id);
  }
  fs.writeFileSync(path.join(OUT, 'specs.json'), JSON.stringify(OUTILS, null, 1));
  const b = await chromium.launch();
  const p = await b.newPage();
  const rapport = [];
  for (const r of OUTILS) {
    if (seul && r.id !== seul) continue;
    await p.setContent(doc(r), { waitUntil: 'load' });
    await p.evaluate(() => document.fonts.ready);
    await p.evaluate(() => {
      let fs = 9.6;
      const deborde = () => [...document.querySelectorAll('.page')].some((x) => x.scrollHeight > x.clientHeight + 1);
      while (deborde() && fs > 7.2) { fs -= 0.2; document.body.style.fontSize = fs + 'pt'; }
    });
    const paysage = Boolean(r.paysage || r.diapos);
    await p.pdf({ path: path.join(OUT, r.id + '.pdf'), format: 'A4', landscape: paysage, printBackground: true, margin: { top: 0, right: 0, bottom: 0, left: 0 } });
    await p.setViewportSize({ width: paysage ? 1123 : 794, height: paysage ? 794 : 1123 });
    const el = await p.$('.page');
    await el.screenshot({ path: path.join(OUT, 'apercus', r.id + '.png') });
    const deborde = await p.$$eval('.page', (ps) => ps.map((x) => x.scrollHeight > x.clientHeight + 2));
    const fsz = await p.evaluate(() => document.body.style.fontSize || '9.6pt');
    rapport.push(`${r.id} ${deborde.some(Boolean) ? 'DÉBORDE ' + JSON.stringify(deborde) : 'ok'} ${fsz}`);
  }
  await b.close();
  console.log(rapport.join('\n'));
  console.log(OUTILS.length, 'outils');
})();
