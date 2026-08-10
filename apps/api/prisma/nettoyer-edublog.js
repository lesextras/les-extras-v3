/**
 * RATTRAPAGE DE L'IMPORT ÉDUBLOG + PRÉPARATION DE L'INVERSION DES DOMAINES.
 *
 * Deux corrections, indépendantes l'une de l'autre :
 *
 * 1. LES DOUBLONS. Le premier passage de `importer-edublog.js` a créé sept
 *    articles qui existaient déjà dans l'application sous un slug différent
 *    (repris à la main lors d'une session antérieure, avec leur image de
 *    couverture). On ARCHIVE les nouveaux, on ne les supprime pas : le texte
 *    reste consultable dans le back-office, et un `status = PUBLISHED` suffit
 *    à revenir en arrière. On n'archive jamais un doublon dont la version
 *    conservée serait introuvable.
 *
 * 2. LES LIENS. Après l'inversion, `les-extras.fr` sert le SaaS et WordPress
 *    déménage sur `app.les-extras.fr`. Toutes les adresses en dur vers
 *    `les-extras.fr` dans les articles — images `/wp-content/uploads/…` et
 *    pages `/listing/…` — désignent du contenu WordPress : elles doivent
 *    suivre WordPress, sans quoi chaque illustration du blog casse le jour du
 *    basculement.
 *
 *   node prisma/nettoyer-edublog.js --appliquer   (depuis /app/apps/api)
 *
 * Sans `--appliquer`, le script n'écrit RIEN : il affiche ce qu'il ferait.
 */
const { ArticleStatus, PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/** slug créé par l'import → slug déjà en ligne, qu'on garde. */
const DOUBLONS = {
  'atelier-individuel-ou-collectif':
    'atelier-individuel-ou-collectif-comment-choisir-en-e-tablissement',
  'atelier-socio-esthetique-2':
    'l-atelier-socio-esthe-tique-en-e-tablissement-me-dico-social',
  'atelier-theatre-medico-social':
    'l-atelier-the-a-tre-en-e-tablissement-me-dico-social',
  'recrutement-educateur-freelance':
    'recrutement-e-ducateur-freelance-bien-cadrer-un-renfort-d-e-quipe',
  'atelier-socio-esthetique':
    'atelier-socio-esthe-tique-redonner-une-image-positive-de-soi',
  'bilan-competences-educateur':
    'bilan-de-compe-tences-e-ducateur-pourquoi-l-envisager-pour-votre-e-quipe',
  'bilan-competences-educateur-2':
    'bilan-de-compe-tences-e-ducateur-pourquoi-l-envisager-pour-votre-e-quipe',
};

const ANCIEN = /https?:\/\/(?:www\.)?les-extras\.fr\//g;
const NOUVEAU = 'https://app.les-extras.fr/';

function suivreWordpress(texte) {
  return typeof texte === 'string' ? texte.replace(ANCIEN, NOUVEAU) : texte;
}

async function archiverLesDoublons(appliquer) {
  let archives = 0;
  let intacts = 0;

  for (const [doublon, garde] of Object.entries(DOUBLONS)) {
    const [aArchiver, aGarder] = await Promise.all([
      prisma.article.findUnique({
        where: { slug: doublon },
        select: { id: true, status: true },
      }),
      prisma.article.findUnique({
        where: { slug: garde },
        select: { id: true, status: true },
      }),
    ]);

    if (!aArchiver) {
      console.log(`  · ${doublon} — absent, rien à faire.`);
      continue;
    }
    if (!aGarder) {
      // Garde-fou : sans la version conservée, archiver le doublon reviendrait
      // à faire disparaître l'article du blog.
      console.warn(`  ⚠ ${doublon} — « ${garde} » introuvable, LAISSÉ EN LIGNE.`);
      intacts += 1;
      continue;
    }
    if (aArchiver.status === ArticleStatus.ARCHIVED) {
      console.log(`  = ${doublon} — déjà archivé.`);
      continue;
    }

    if (appliquer) {
      await prisma.article.update({
        where: { id: aArchiver.id },
        data: { status: ArticleStatus.ARCHIVED, publishedAt: null },
      });
    }
    console.log(`  ↓ ${doublon} — archivé (on garde « ${garde} »).`);
    archives += 1;
  }

  return { archives, intacts };
}

async function ferrerLesLiens(appliquer) {
  const articles = await prisma.article.findMany({
    select: { id: true, slug: true, coverUrl: true, content: true, excerpt: true },
  });

  let touches = 0;
  let liens = 0;

  for (const a of articles) {
    const data = {};
    for (const champ of ['coverUrl', 'content', 'excerpt']) {
      const avant = a[champ];
      if (typeof avant !== 'string') continue;
      const apres = suivreWordpress(avant);
      if (apres !== avant) {
        data[champ] = apres;
        liens += avant.match(ANCIEN)?.length ?? 0;
      }
    }
    if (Object.keys(data).length === 0) continue;

    if (appliquer) await prisma.article.update({ where: { id: a.id }, data });
    console.log(`  → ${a.slug} — ${Object.keys(data).join(', ')}`);
    touches += 1;
  }

  return { touches, liens };
}

async function main() {
  const appliquer = process.argv.includes('--appliquer');
  if (!appliquer) console.log('MODE ESSAI — aucune écriture. Ajouter --appliquer.\n');

  console.log('Doublons de l’import :');
  const { archives, intacts } = await archiverLesDoublons(appliquer);

  console.log('\nLiens vers l’ancien domaine :');
  const { touches, liens } = await ferrerLesLiens(appliquer);

  const restants = await prisma.article.count({
    where: { status: ArticleStatus.PUBLISHED },
  });

  console.log(
    `\n${archives} doublon(s) archivé(s), ${intacts} laissé(s) en ligne par précaution.`
      + `\n${liens} lien(s) réécrit(s) sur ${touches} article(s).`
      + `\n${restants} article(s) publié(s) au total.`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
