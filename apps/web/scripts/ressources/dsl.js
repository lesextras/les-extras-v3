// Mini-langage des outils : un même bloc sert au PDF (HTML) et aux fichiers
// modifiables (Word, Excel, PowerPoint, rendus en Python par office.py).
// ⚠ Textes originaux ADéPA, pas de tiret cadratin, pas de diagnostic, pas de prix.

const esc = (s) => String(s);
const L = (n) => `<div class="lignes">${'<i></i>'.repeat(n)}</div>`;

const B = {
  bandeau: (html) => ({ t: 'bandeau', html }),
  texte: (html, petit = false) => ({ t: 'texte', html, petit }),
  tableau: (o) => ({ t: 'tableau', ...o }),
  champs: (o) => ({ t: 'champs', cols: 1, ...o }),
  puces: (titre, items, couleur = '') => ({ t: 'puces', titre, items, couleur }),
  etapes: (titre, items) => ({ t: 'etapes', titre, items }),
  cartes: (o) => ({ t: 'cartes', cols: 4, vides: 0, ...o }),
  zone: (titre, h = 30, aide = '') => ({ t: 'zone', titre, h, aide }),
  cocher: (titre, items, o = {}) => ({ t: 'cocher', titre, items, cols: 1, ...o }),
  echelle: (titre, items) => ({ t: 'echelle', titre, items }),
  aretenir: (titre, items) => ({ t: 'aretenir', titre, items }),
  cote: (...blocs) => ({ t: 'cote', blocs }),
  signatures: (items) => ({ t: 'signatures', items }),
  saut: () => ({ t: 'saut' }),
};

function cellule(v) {
  if (v === '' || v == null || String(v).startsWith('=')) return '';
  return esc(v);
}

function html(b) {
  switch (b.t) {
    case 'bandeau':
      return `<div class="bandeau">${b.html}</div>`;
    case 'texte':
      return `<p class="${b.petit ? 'petit' : 'para'}">${b.html}</p>`;
    case 'tableau': {
      const w = b.cols.map((c) => (c.w ? ` style="width:${c.w}%"` : ''));
      const h = b.h ? ` style="height:${b.h}mm"` : '';
      const lignes = (b.lignes || []).map((l) => `<tr${h}>${l.map((v, i) => `<td${i === 0 && b.premiereGras ? ' class="gras"' : i === 0 && b.emo ? ' class="emo"' : ''}>${cellule(v)}</td>`).join('')}</tr>`);
      for (let i = 0; i < (b.vides || 0); i++) lignes.push(`<tr style="height:${b.h || 9}mm">${b.cols.map(() => '<td class="vide"></td>').join('')}</tr>`);
      if (b.total) lignes.push(`<tr class="total">${b.cols.map((c, i) => `<td>${i === 0 ? 'Total' : b.total.includes(i) ? '' : ''}</td>`).join('')}</tr>`);
      return `<div class="bloc ${b.couleur || ''}">${b.titre ? `<h2>${b.titre}</h2>` : ''}<table class="t"><thead><tr>${b.cols.map((c, i) => `<th${w[i]}>${c.t}</th>`).join('')}</tr></thead><tbody>${lignes.join('')}</tbody></table></div>`;
    }
    case 'champs': {
      const items = b.items.map((it) => {
        const [lab, n] = Array.isArray(it) ? it : [it, 1];
        return `<div class="champ"><div class="etiquette">${lab}</div>${L(n)}</div>`;
      });
      return `<div class="bloc ${b.couleur || ''}">${b.titre ? `<h2>${b.titre}</h2>` : ''}<div class="c champs c${b.cols}">${items.join('')}</div></div>`;
    }
    case 'puces':
      return `<div class="bloc ${b.couleur}">${b.titre ? `<h2>${b.titre}</h2>` : ''}<div class="c"><ul>${b.items.map((x) => `<li>${x}</li>`).join('')}</ul></div></div>`;
    case 'etapes':
      return `<div class="bloc">${b.titre ? `<h2>${b.titre}</h2>` : ''}<div class="c"><ol>${b.items.map(([t, x]) => `<li>${t ? `<span class="temps">${t}</span> ` : ''}${x}</li>`).join('')}</ol></div></div>`;
    case 'cartes': {
      const items = b.items.map(([e, m]) => `<div class="carte"${b.h ? ` style="min-height:${b.h}mm"` : ''}><div class="emo">${e}</div><div class="mot">${m}</div></div>`);
      for (let i = 0; i < b.vides; i++) items.push(`<div class="carte vierge"${b.h ? ` style="min-height:${b.h}mm"` : ''}><div class="emo"></div><div class="mot">&nbsp;</div></div>`);
      return `${b.titre ? `<div class="etiquette">${b.titre}</div>` : ''}<div class="cartes" style="grid-template-columns:repeat(${b.cols},1fr)">${items.join('')}</div>`;
    }
    case 'zone':
      return `<div class="cadre" style="min-height:${b.h}mm"><div class="etiquette">${b.titre}</div>${b.aide ? `<div class="aide">${b.aide}</div>` : ''}</div>`;
    case 'cocher':
      return `<div class="bloc ${b.couleur || ''}">${b.titre ? `<h2>${b.titre}</h2>` : ''}<div class="c coches c${b.cols}">${b.items.map((x) => `<div class="coche"><span class="case"></span><span>${x}</span></div>`).join('')}</div></div>`;
    case 'echelle':
      return `${b.titre ? `<div class="etiquette">${b.titre}</div>` : ''}<div class="echelle">${b.items.map(([c, t, a], i) => `<div class="niv"><div class="num" style="background:${c}">${b.items.length - i}</div><div class="cadre" style="border-color:${c};min-height:0"><div class="nt">${t}</div><div class="na">${a || L(1)}</div></div></div>`).join('')}</div>`;
    case 'aretenir':
      return `<div class="aretenir"><h3>${b.titre}</h3><ul>${b.items.map((x) => `<li>${x}</li>`).join('')}</ul></div>`;
    case 'cote':
      return `<div class="grille g${b.blocs.length}">${b.blocs.map(html).join('')}</div>`;
    case 'signatures':
      return `<div class="grille g${b.items.length}">${b.items.map((s) => `<div class="cadre" style="min-height:22mm"><div class="etiquette">${s}</div></div>`).join('')}</div>`;
    case 'saut':
      return '';
    default:
      throw new Error('bloc inconnu ' + b.t);
  }
}

module.exports = { B, html, L };
