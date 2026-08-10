/**
 * RATTRAPAGE DE L'IMPORT ÉDUBLOG + BASCULE DES LIENS WORDPRESS.
 *
 * Deux opérations indépendantes, chacune avec son drapeau.
 *
 * 1. `--doublons` — LES DOUBLONS DE L'IMPORT. Le premier passage de
 *    `importer-edublog.js` a créé sept articles qui existaient déjà dans
 *    l'application sous un autre slug (repris à la main lors d'une session
 *    antérieure, avec leur image de couverture). On ARCHIVE les nouveaux, on
 *    ne les supprime pas : le texte reste consultable dans le back-office et
 *    un `status = PUBLISHED` suffit à revenir en arrière. On n'archive jamais
 *    un doublon dont la version conservée serait introuvable.
 *
 * 2. `--wordpress=<hôte>` — LES LIENS. Les articles pointent en dur vers les
 *    images `/wp-content/uploads/…` et les pages `/listing/…` de WordPress.
 *    Aujourd'hui WordPress répond sur `les-extras.fr` ; après l'inversion des
 *    domaines il répondra sur `app.les-extras.fr`. Ce drapeau réécrit ces
 *    adresses vers l'hôte indiqué.
 *
 *    ⚠ NE PAS LANCER LA BASCULE AVANT QUE LE DNS N'AIT BOUGÉ. Réécrire vers
 *    `app.les-extras.fr` pendant que WordPress est encore sur `les-extras.fr`
 *    casse toutes les couvertures du blog sur-le-champ (constaté en direct le
 *    10/08/2026, remis en état dans la foulée). L'ordre est : DNS d'abord,
 *    script ensuite.
 *
 *    Seuls les CHEMINS WORDPRESS sont touchés — jamais un lien vers le SaaS
 *    lui-même, qui vit sur les mêmes domaines.
 *
 *   node prisma/nettoyer-edublog.js --doublons --appliquer
 *   node prisma/nettoyer-edublog.js --wordpress=app.les-extras.fr --appliquer
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

/** Les deux domaines qui se échangent leur rôle. */
const HOTES = ['les-extras.fr', 'app.les-extras.fr'];

/**
 * Ce qui appartient à WordPress et doit le suivre. Tout le reste — /dashboard,
 * /edublog, /sos-renfort… — appartient au SaaS et ne doit surtout pas bouger.
 */
const CHEMINS_WORDPRESS = ['wp-content/', 'listing/', 'devenir-freelance'];

/**
 * Les résumés relevés sur WordPress gardent leurs entités HTML. Le corps de
 * l'article passe par un lecteur qui les décode ; le chapô, lui, est affiché
 * tel quel — d'où le « l&#039;agressivité » visible en tête d'article et sur
 * les vignettes du blog.
 */
const LATIN1 =
  'Agrave Aacute Acirc Atilde Auml Aring AElig Ccedil Egrave Eacute Ecirc Euml '
  + 'Igrave Iacute Icirc Iuml ETH Ntilde Ograve Oacute Ocirc Otilde Ouml times '
  + 'Oslash Ugrave Uacute Ucirc Uuml Yacute THORN szlig '
  + 'agrave aacute acirc atilde auml aring aelig ccedil egrave eacute ecirc euml '
  + 'igrave iacute icirc iuml eth ntilde ograve oacute ocirc otilde ouml divide '
  + 'oslash ugrave uacute ucirc uuml yacute thorn yuml';

const ENTITES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
  rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“', sbquo: '‚', bdquo: '„',
  hellip: '…', mdash: '—', ndash: '–', laquo: '«', raquo: '»', euro: '€',
  bull: '•', middot: '·', deg: '°', copy: '©', reg: '®', trade: '™' };
LATIN1.split(' ').forEach((nom, i) => { ENTITES[nom] = String.fromCharCode(0xc0 + i); });

function decoderEntites(texte) {
  return texte.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (brut, corps) => {
    if (corps[0] === '#') {
      const code = corps[1] === 'x' || corps[1] === 'X'
        ? Number.parseInt(corps.slice(2), 16)
        : Number.parseInt(corps.slice(1), 10);
      return Number.isFinite(code) && code > 0 && code <= 0x10ffff
        ? String.fromCodePoint(code)
        : brut;
    }
    return ENTITES[corps] ?? ENTITES[corps.toLowerCase()] ?? brut;
  });
}

async function decoderLesResumes(appliquer) {
  const articles = await prisma.article.findMany({
    select: { id: true, slug: true, excerpt: true },
  });

  let touches = 0;
  for (const a of articles) {
    if (typeof a.excerpt !== 'string') continue;
    const apres = decoderEntites(a.excerpt);
    if (apres === a.excerpt) continue;
    if (appliquer) {
      await prisma.article.update({ where: { id: a.id }, data: { excerpt: apres } });
    }
    console.log(`  ⇢ ${a.slug}`);
    touches += 1;
  }
  return touches;
}

function motifWordpress() {
  const hotes = HOTES.map((h) => h.replace(/\./g, '\\.')).join('|');
  const chemins = CHEMINS_WORDPRESS.map((c) => c.replace(/\//g, '\\/')).join('|');
  return new RegExp(`https?:\\/\\/(?:www\\.)?(?:${hotes})\\/(${chemins})`, 'g');
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

async function basculerLesLiens(hote, appliquer) {
  const motif = motifWordpress();
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
      const apres = avant.replace(motif, `https://${hote}/$1`);
      if (apres !== avant) {
        data[champ] = apres;
        liens += avant.match(motif)?.length ?? 0;
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
  const doublons = process.argv.includes('--doublons');
  const entites = process.argv.includes('--entites');
  const bascule = process.argv.find((x) => x.startsWith('--wordpress='));
  const hote = bascule ? bascule.split('=')[1] : null;

  if (!doublons && !hote && !entites) {
    console.error(
      'Rien à faire. Préciser --doublons, --entites et/ou --wordpress=<hôte>.\n'
        + `Hôtes attendus : ${HOTES.join(' | ')}`,
    );
    process.exitCode = 1;
    return;
  }
  if (hote && !HOTES.includes(hote)) {
    console.error(`Hôte inattendu « ${hote} ». Attendu : ${HOTES.join(' | ')}`);
    process.exitCode = 1;
    return;
  }
  if (!appliquer) console.log('MODE ESSAI — aucune écriture. Ajouter --appliquer.\n');

  let resumeDoublons = '';
  if (doublons) {
    console.log('Doublons de l’import :');
    const { archives, intacts } = await archiverLesDoublons(appliquer);
    resumeDoublons =
      `\n${archives} doublon(s) archivé(s), ${intacts} laissé(s) en ligne par précaution.`;
  }

  let resumeEntites = '';
  if (entites) {
    console.log('\nEntités HTML dans les résumés :');
    const touches = await decoderLesResumes(appliquer);
    resumeEntites = `\n${touches} résumé(s) décodé(s).`;
  }

  let resumeLiens = '';
  if (hote) {
    console.log(`\nLiens WordPress → ${hote} :`);
    const { touches, liens } = await basculerLesLiens(hote, appliquer);
    resumeLiens = `\n${liens} lien(s) réécrit(s) sur ${touches} article(s).`;
  }

  const publies = await prisma.article.count({
    where: { status: ArticleStatus.PUBLISHED },
  });

  console.log(
    `${resumeDoublons}${resumeEntites}${resumeLiens}`
      + `\n${publies} article(s) publié(s) au total.`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
