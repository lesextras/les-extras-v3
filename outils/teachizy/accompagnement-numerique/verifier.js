// Vérifications de contenu2.js avant publication.
const c = require('./contenu2.js');
const ancien = require('./contenu.js');

const nomsExistants = {};
for (const it of [...ancien.J1, ...ancien.J2.items, ...ancien.J3.items]) nomsExistants[it.key] = { name: it.name, section: ancien.J1.includes(it) ? 'J1' : ancien.J2.items.includes(it) ? 'J2' : 'J3', type: it.type };

const TAGS = ['div', 'table', 'thead', 'tbody', 'tr', 'td', 'th', 'ul', 'ol', 'li', 'p', 'h3', 'h4', 'strong', 'em', 'a', 'code', 'span'];
let problemes = 0;
const pb = (ou, m) => { problemes++; console.log('PROBLÈME', ou, ':', m); };

function verifierTexte(t, ou) {
  if (t.includes('—')) pb(ou, 'tiret cadratin');
  if (t.includes('–')) pb(ou, 'tiret demi-cadratin');
  if (/certificat/i.test(t)) pb(ou, 'mot « certificat »');
  if (/ - /.test(t)) pb(ou, 'trait d’union isolé servant de tiret');
  const i = t.indexOf("'");
  if (i >= 0) pb(ou, 'apostrophe droite : ' + t.slice(Math.max(0, i - 30), i + 10));
  if (/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(t)) pb(ou, 'emoji');
}
function verifierHtml(html, ou) {
  for (const t of TAGS) {
    const o = (html.match(new RegExp(`<${t}[\\s>]`, 'g')) || []).length;
    const f = (html.match(new RegExp(`</${t}>`, 'g')) || []).length;
    if (o !== f) pb(ou, `balise ${t} ${o} ouvertes / ${f} fermées`);
  }
  // Ordre d’imbrication : pile simple.
  const pile = [];
  const re = /<\/?([a-z0-9]+)[^>]*>/g;
  let m;
  while ((m = re.exec(html))) {
    const tag = m[1];
    if (['br', 'hr', 'img'].includes(tag)) continue;
    if (m[0][1] === '/') {
      const haut = pile.pop();
      if (haut !== tag) { pb(ou, `imbrication : </${tag}> ferme <${haut}>`); break; }
    } else pile.push(tag);
  }
  if (pile.length) pb(ou, 'balises non fermées : ' + pile.join(','));
  verifierTexte(html.replace(/<[^>]+>/g, ' '), ou);
}

const lignes = [];
for (const [k, v] of Object.entries(c.update)) {
  if (!nomsExistants[k]) pb(k, 'clé inconnue dans contenu.js');
  verifierHtml(v.html, k);
  lignes.push([nomsExistants[k].section, k, nomsExistants[k].name, v.html.length, v.html.replace(/<[^>]+>/g, '').length, v.min, nomsExistants[k].type]);
}
for (const k of Object.keys(nomsExistants)) if (!c.update[k]) pb(k, 'élément existant absent de update');
for (const n of c.nouveaux) {
  verifierHtml(n.html, n.key);
  verifierTexte(n.name, n.key + ':name');
  if (!['J1', 'J2', 'J3'].includes(n.section) || !['debut', 'avant-devoir'].includes(n.position) || n.type !== 'GENERIC') pb(n.key, 'champs section/position/type');
  lignes.push([n.section, n.key, n.name, n.html.length, n.html.replace(/<[^>]+>/g, '').length, n.min, 'GENERIC (nouveau, ' + n.position + ')']);
}
for (const [k, v] of Object.entries(c.noms)) verifierTexte(v, 'noms.' + k);

lignes.sort((a, b) => a[0].localeCompare(b[0]));
console.log('\nSection | clé | taille HTML | texte seul | min | type | titre');
for (const l of lignes) console.log(`${l[0]} | ${l[1]} | ${l[3]} | ${l[4]} | ${l[5]} | ${l[6]} | ${l[2]}`);

// Quiz : réponses lues dans le HTML (« Question n : réponse X »).
console.log('\nRépartition des bonnes réponses :');
for (const n of c.nouveaux.filter((x) => x.key.endsWith('cas'))) {
  const rep = [...n.html.matchAll(/Question (\d) : réponse ([ABCD])/g)].map((m) => m[2]);
  const nbQ = (n.html.match(/<h4[^>]*>Question \d<\/h4>/g) || []).length;
  const opts = (n.html.match(/<strong>[ABCD]\.<\/strong>/g) || []).length;
  const positions = new Set(rep);
  const idxQuestions = n.html.indexOf('Quiz d’autocorrection');
  const idxReponses = n.html.indexOf('Réponses du quiz et explications');
  const apres = n.html.slice(idxReponses);
  const finale = idxReponses > idxQuestions && !/Avant de passer à la suite/.test(apres);
  console.log(`${n.key} : ${rep.join(' ')} | ${nbQ} questions, ${opts} options | ${positions.size} positions différentes | réponses regroupées en fin de leçon : ${finale}`);
  if (rep.length !== 6 || nbQ !== 6 || opts !== 24) pb(n.key, 'quiz incomplet');
  if (positions.size < 3) pb(n.key, 'moins de 3 positions de bonnes réponses');
  if (!finale) pb(n.key, 'réponses pas en bas');
}

// Déroulés : total de 9 h 00 à 17 h 00.
for (const n of c.nouveaux.filter((x) => x.key.endsWith('programme'))) {
  const h = [...n.html.matchAll(/(\d{1,2}) h (\d{2}) à (\d{1,2}) h (\d{2})<\/strong>/g)].map((m) => [+m[1] * 60 + +m[2], +m[3] * 60 + +m[4]]);
  let ok = h.length > 0 && h[0][0] === 540 && h[h.length - 1][1] === 1020;
  for (let i = 1; i < h.length; i++) if (h[i][0] !== h[i - 1][1]) ok = false;
  console.log(`${n.key} : ${h.length} séquences, continu de 9 h 00 à 17 h 00 : ${ok}`);
  if (!ok) pb(n.key, 'déroulé discontinu');
  if (!/28 septembre 2026/.test(n.html)) pb(n.key, 'phrase de revue datée absente');
  if (!/Pour le formateur/.test(n.html)) pb(n.key, 'encart formateur absent');
}

// Tailles des leçons de fond.
for (const l of lignes) if (!/ASSIGNMENT/.test(l[6]) && (l[3] < 12000 || l[3] > 30000)) console.log(`ATTENTION taille ${l[1]} : ${l[3]}`);
console.log(problemes ? `\n${problemes} problème(s)` : '\nAucun problème détecté.');
