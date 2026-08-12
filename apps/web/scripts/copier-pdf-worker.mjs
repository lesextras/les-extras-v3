// COPIE L'OUVRIER DE PDF.JS DANS LES FICHIERS SERVIS TELS QUELS.
//
// pdf.js délègue la lecture d'un PDF à un « worker ». Le laisser passer par le
// bundler ne marche pas : Next confie l'actif à Terser, qui le lit comme un
// script classique alors que c'est un module ES — et la compilation de tout le
// site échoue sur « 'import' cannot be used outside of module code ».
//
// On le copie donc dans `public/`, où il est servi tel quel, sans passer par
// aucune transformation. Le fichier n'est pas versionné : il est repris du
// paquet installé à chaque construction, donc toujours à la version du
// `package.json`. Une copie figée dans le dépôt aurait vieilli en silence.
import { copyFile, mkdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';

const require = createRequire(import.meta.url);
const racinePdfjs = dirname(require.resolve('pdfjs-dist/package.json'));
const source = join(racinePdfjs, 'legacy', 'build', 'pdf.worker.min.mjs');
const dossier = join(process.cwd(), 'public', 'pdf');

await mkdir(dossier, { recursive: true });
await copyFile(source, join(dossier, 'pdf.worker.min.mjs'));
console.log('pdf.worker.min.mjs copié dans public/pdf/');
