// COPIE LE MOTEUR DE FLOU D'ARRIÈRE-PLAN DANS LES FICHIERS SERVIS TELS QUELS.
//
// Le flou de la visio (`@livekit/track-processors`) s'appuie sur MediaPipe, qui
// charge par défaut son moteur (WebAssembly) depuis jsDelivr et son modèle
// depuis les serveurs de Google. On sert les deux depuis notre domaine :
//  - aucune requête vers un tiers pendant une séance (l'adresse IP de la
//    personne n'a pas à partir chez Google pour qu'elle floute son salon) ;
//  - la politique de sécurité de la salle reste `'self'`.
// Le moteur est repris du paquet installé à chaque construction (toujours à la
// bonne version) ; le modèle, lui, est versionné dans `public/mediapipe/`.
import { copyFile, mkdir, readdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';

const require = createRequire(import.meta.url);
const processeurs = require.resolve('@livekit/track-processors');
const requireProc = createRequire(processeurs);
let dossierVision = dirname(requireProc.resolve('@mediapipe/tasks-vision'));
while (!(await readdir(dossierVision)).includes('wasm')) dossierVision = dirname(dossierVision);
const source = join(dossierVision, 'wasm');
const cible = join(process.cwd(), 'public', 'mediapipe', 'wasm');

await mkdir(cible, { recursive: true });
for (const f of await readdir(source)) await copyFile(join(source, f), join(cible, f));
console.log('Moteur MediaPipe copié dans public/mediapipe/wasm/');
