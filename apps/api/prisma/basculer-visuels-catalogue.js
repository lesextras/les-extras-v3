/**
 * BASCULE DES VISUELS DU CATALOGUE VERS LA MÉDIATHÈQUE WORDPRESS.
 *
 * Le pendant de `nettoyer-edublog.js --wordpress=` pour les fiches du
 * catalogue. Ce dernier n'a réécrit que les ARTICLES : les visuels des
 * ateliers (`Service.images`) et des formations (`Formation.images`) sont
 * restés sur `les-extras.fr/wp-content/…`, adresse qui sert désormais cette
 * application et répond donc 404 sur ces chemins. Résultat constaté en direct
 * le 12/08/2026 : les seize visuels du catalogue étaient tous cassés, pendant
 * que la publicité tournait.
 *
 * La médiathèque WordPress répond, elle, sur `app.les-extras.fr` : on y
 * repointe l'hôte, rien d'autre. Le chemin `/wp-content/uploads/…` est
 * conservé tel quel, et aucune URL hors `/wp-content/` n'est touchée — les
 * liens vers le SaaS vivent sur les mêmes domaines.
 *
 *   node prisma/basculer-visuels-catalogue.js                      # simulation
 *   node prisma/basculer-visuels-catalogue.js --appliquer
 *   node prisma/basculer-visuels-catalogue.js --hote=les-extras.fr --appliquer
 *
 * Sans `--appliquer`, le script n'écrit RIEN : il affiche ce qu'il ferait.
 * Le drapeau `--hote=` permet de revenir en arrière si la médiathèque
 * redéménage — la bascule marche dans les deux sens.
 *
 * ⚠ Même règle qu'en août : DNS d'abord, script ensuite. Réécrire vers un
 * hôte qui ne sert pas encore la médiathèque casse les visuels sur-le-champ.
 *
 * NOTE — ce script ne juge pas le CONTENU des photos. Le portrait d'enfant
 * (`handicap-psychique.jpg`) est écarté à l'affichage par `apps/web/src/lib/
 * media.ts` ; son remplacement se fait depuis l'administration, fiche par
 * fiche.
 */
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/** Hôtes dont on sait qu'ils ne servent plus la médiathèque. */
const HOTES_HERITES = ['les-extras.fr', 'www.les-extras.fr'];

const args = process.argv.slice(2);
const appliquer = args.includes('--appliquer');
const cible = (args.find((a) => a.startsWith('--hote=')) ?? '--hote=app.les-extras.fr').slice(7);

/** Réécrit l'hôte d'une URL de médiathèque. Renvoie null si rien à faire. */
function basculer(url) {
  if (typeof url !== 'string' || !url.startsWith('http')) return null;
  let u;
  try {
    u = new URL(url);
  } catch {
    return null;
  }
  if (u.hostname === cible) return null;
  if (!u.pathname.startsWith('/wp-content/')) return null;
  // On ne touche qu'aux hôtes connus, plus l'hôte cible inverse : sans cela,
  // un `--hote=` de retour en arrière ne trouverait plus rien à réécrire.
  if (!HOTES_HERITES.includes(u.hostname) && u.hostname !== 'app.les-extras.fr') return null;
  u.hostname = cible;
  return u.toString();
}

async function traiter(nom, lire, ecrire) {
  const lignes = await lire();
  let touchees = 0;
  let visuels = 0;

  for (const ligne of lignes) {
    const avant = ligne.images ?? [];
    const apres = avant.map((v) => basculer(v) ?? v);
    const change = apres.filter((v, i) => v !== avant[i]).length;
    if (change === 0) continue;

    touchees += 1;
    visuels += change;
    console.log(`  ${ligne.title}`);
    avant.forEach((v, i) => {
      if (apres[i] !== v) console.log(`    ${v}\n    → ${apres[i]}`);
    });
    if (appliquer) await ecrire(ligne.id, apres);
  }

  console.log(`${nom} : ${touchees} fiche(s), ${visuels} visuel(s).`);
  return visuels;
}

async function main() {
  console.log(
    `Bascule des visuels du catalogue vers « ${cible} »${appliquer ? '' : ' — SIMULATION'}\n`,
  );

  const total =
    (await traiter(
      'Ateliers',
      () => prisma.service.findMany({ select: { id: true, title: true, images: true } }),
      (id, images) => prisma.service.update({ where: { id }, data: { images } }),
    )) +
    (await traiter(
      'Formations',
      () => prisma.formation.findMany({ select: { id: true, title: true, images: true } }),
      (id, images) => prisma.formation.update({ where: { id }, data: { images } }),
    ));

  if (!appliquer && total > 0) {
    console.log('\nRien n’a été écrit. Relancer avec --appliquer.');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
