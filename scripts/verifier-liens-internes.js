// Contrôle statique : tout href littéral interne pointe-t-il sur une route
// réellement servie par l'App Router ?
//
// Un lien mort ne se voit pas au build — Next.js compile sans broncher et
// c'est le visiteur qui tombe sur le 404. D'où ce garde-fou, à lancer avant
// de pousser : `node scripts/verifier-liens-internes.js`.
// Sort en code 1 s'il trouve quelque chose, pour être branché en CI.
const fs = require('fs');
const path = require('path');

const RACINE = path.resolve(__dirname, '..', 'apps', 'web', 'src');

// Deux familles de destinations valides : les pages (`page.tsx`) et les
// gestionnaires de route (`route.ts`), qui servent les exports CSV et le
// proxy d'API. Oublier les seconds faisait crier le contrôle sur quatre
// liens parfaitement valides — un outil qui crie au loup finit ignoré.
const routes = new Set();
const parcourirRoutes = (d, base) => {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) {
      // Les groupes `(nom)` structurent les layouts sans peser sur l'URL.
      if (/^\(.*\)$/.test(e.name)) { parcourirRoutes(p, base); continue; }
      if (e.name.startsWith('_')) continue;
      parcourirRoutes(p, base + '/' + e.name);
    } else if (/^(page|route)\.(tsx|ts|jsx|js)$/.test(e.name)) {
      routes.add(base || '/');
    }
  }
};
parcourirRoutes(path.join(RACINE, 'app'), '');

const liens = new Map();
const MOTIF = new RegExp('href\\s*[:=]\\s*[{]?\\s*["\'`](\\/[^"\'`${}\\s]*)["\'`]', 'g');
const parcourirSources = (d) => {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) {
      if (e.name !== 'node_modules' && e.name !== '__tests__') parcourirSources(p);
      continue;
    }
    if (!/\.(tsx|ts)$/.test(e.name)) continue;
    const s = fs.readFileSync(p, 'utf8');
    let m;
    MOTIF.lastIndex = 0;
    while ((m = MOTIF.exec(s)) !== null) {
      const h = (m[1].split('#')[0].split('?')[0]) || '/';
      if (!liens.has(h)) liens.set(h, new Set());
      liens.get(h).add(p.replace(RACINE + '/', ''));
    }
  }
};
parcourirSources(RACINE);

const dynamiques = [...routes].filter((r) => r.includes('['));
const correspond = (h) => {
  if (routes.has(h)) return true;
  const seg = h.split('/').filter(Boolean);
  return dynamiques.some((r) => {
    const rs = r.split('/').filter(Boolean);
    // `[...path]` attrape tout ce qui suit : la longueur n'a pas à coller.
    const attrapeTout = rs.length && rs[rs.length - 1].startsWith('[...');
    if (attrapeTout) {
      if (seg.length < rs.length - 1) return false;
    } else if (rs.length !== seg.length) {
      return false;
    }
    return rs.every((x, i) => x.startsWith('[') || x === seg[i]);
  });
};

const morts = [...liens.entries()].filter(([h]) => !correspond(h));
console.log('routes servies = ' + routes.size + '   |   liens internes distincts = ' + liens.size);
if (!morts.length) {
  console.log('\nAucun lien mort.');
  process.exit(0);
}
console.log('\n--- LIENS VERS UNE ROUTE INEXISTANTE (' + morts.length + ') ---');
morts.sort().forEach(([h, f]) => console.log('  ' + h.padEnd(38) + ' <- ' + [...f].slice(0, 3).join(', ')));
process.exit(1);
