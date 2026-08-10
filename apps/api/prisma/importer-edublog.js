/**
 * IMPORT DE L'ÉDUBLOG DEPUIS L'ANCIEN WORDPRESS.
 *
 * Les quatorze articles publiés sur les-extras.fr ont été relevés fidèlement
 * depuis l'API REST de WordPress (`edublog-wordpress.json`, à côté de ce
 * fichier). Ce script les crée dans la table `Article` de l'application.
 *
 * Il est IDEMPOTENT : le slug fait foi. Relancer le script ne duplique rien et
 * ne réécrit pas un texte que quelqu'un aurait retouché depuis — on ne met à
 * jour que les articles jamais modifiés dans l'application.
 *
 * Pourquoi un script plutôt qu'un import par l'écran d'administration : les
 * quatorze articles portent leur date de publication d'origine, et c'est elle
 * qui donne son ordre au blog. Les ressaisir à la main les daterait tous
 * d'aujourd'hui, et l'antériorité — donc le référencement déjà acquis sur ces
 * sujets — serait perdue.
 *
 *   node prisma/importer-edublog.js            (depuis /app/apps/api)
 *
 * Option : --brouillon pour tout créer en brouillon plutôt qu'en publié.
 */
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { ArticleKind, ArticleStatus, PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * SIX DES QUATORZE ARTICLES ÉTAIENT DÉJÀ DANS L'APPLICATION, sous un autre
 * slug : ils avaient été repris à la main lors d'une session antérieure, et
 * portent en plus leur image de couverture. Le slug ne suffit donc pas à
 * détecter le doublon — d'où cette table de correspondance.
 *
 * On garde la version déjà en ligne : c'est elle qui a une couverture, c'est
 * elle que Google a indexée, et changer une URL déjà référencée coûte plus
 * cher que tout ce que le nouveau relevé apporterait.
 *
 *   slug WordPress → slug déjà présent dans l'application
 */
const DEJA_EN_LIGNE = {
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
  // WordPress lui-même hébergeait ce billet en double.
  'bilan-competences-educateur-2':
    'bilan-de-compe-tences-e-ducateur-pourquoi-l-envisager-pour-votre-e-quipe',
};

/**
 * LES LIENS SONT LAISSÉS TELS QUELS, sur `les-extras.fr`, parce que c'est là
 * que WordPress répond aujourd'hui. Les faire pointer par anticipation sur
 * `app.les-extras.fr` casse toutes les couvertures du blog tant que le DNS n'a
 * pas bougé — l'erreur a été commise le 10/08/2026 et corrigée dans la foulée.
 *
 * La bascule se fait le jour de l'inversion des domaines, en une commande :
 *   node prisma/nettoyer-edublog.js --wordpress=app.les-extras.fr --appliquer
 */

/**
 * Le résumé est AFFICHÉ TEL QUEL — en tête d'article et sur les vignettes du
 * blog — contrairement au corps, qui passe par un lecteur. La liste d'entités
 * nommées ne suffisait donc pas : WordPress écrit l'apostrophe `&#039;`, en
 * décimal, et « l&#039;agressivité » s'affichait en clair sur la vitrine.
 */
// Les lettres accentuées portent des noms d'entité qui suivent exactement
// l'ordre des points de code 0xC0 à 0xFF : les énumérer une à une invite
// l'oubli (`&eacute;` manquait au premier jet), la table est donc engendrée.
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
      // Point de code hors plage : on laisse l'entité visible plutôt que
      // d'émettre un caractère de contrôle.
      return Number.isFinite(code) && code > 0 && code <= 0x10ffff
        ? String.fromCodePoint(code)
        : brut;
    }
    // Casse respectée d'abord : `&Eacute;` n'est pas `&eacute;`.
    return ENTITES[corps] ?? ENTITES[corps.toLowerCase()] ?? brut;
  });
}

/** Le résumé affiché en liste : celui de WordPress, nettoyé de ses entités. */
function nettoyerExtrait(brut) {
  if (!brut) return null;
  const texte = decoderEntites(brut.replace(/<[^>]+>/g, ''))
    .replace(/\s+/g, ' ')
    .trim();
  return texte ? texte.slice(0, 400) : null;
}

async function main() {
  const enBrouillon = process.argv.includes('--brouillon');
  const chemin = join(__dirname, 'edublog-wordpress.json');
  const articles = JSON.parse(readFileSync(chemin, 'utf8'));

  let crees = 0;
  let ignores = 0;
  let sansContenu = 0;
  let doublons = 0;

  for (const a of articles) {
    const autreSlug = DEJA_EN_LIGNE[a.slug];
    if (autreSlug) {
      const garde = await prisma.article.findUnique({
        where: { slug: autreSlug },
        select: { id: true },
      });
      if (garde) {
        console.log(`  = ${a.slug} — déjà en ligne sous « ${autreSlug} », ignoré.`);
        doublons += 1;
        continue;
      }
      // La version historique a disparu : on importe, plutôt que de perdre
      // l'article. Mieux vaut un slug inattendu qu'un trou dans le blog.
      console.warn(`  ⚠ ${a.slug} — « ${autreSlug} » introuvable, import quand même.`);
    }

    if (!a.contentHtml) {
      // Le relevé a explicitement laissé un trou : on ne publie pas un article
      // vide, et on ne comble surtout pas avec du texte inventé.
      console.warn(`  ⚠ ${a.slug} — contenu absent du relevé, ignoré.`);
      sansContenu += 1;
      continue;
    }

    const existant = await prisma.article.findUnique({
      where: { slug: a.slug },
      select: { id: true, createdAt: true, updatedAt: true },
    });
    if (existant) {
      console.log(`  = ${a.slug} — déjà présent, laissé tel quel.`);
      ignores += 1;
      continue;
    }

    const publieLe = new Date(`${a.publishedAt}T09:00:00.000Z`);
    await prisma.article.create({
      data: {
        slug: a.slug,
        title: a.title,
        kind: ArticleKind.ARTICLE,
        excerpt: nettoyerExtrait(a.excerpt),
        content: a.contentHtml,
        coverUrl: a.coverUrl,
        status: enBrouillon ? ArticleStatus.DRAFT : ArticleStatus.PUBLISHED,
        // La date d'origine, pas celle de l'import : c'est elle qui ordonne le
        // blog et qui porte l'antériorité des sujets.
        publishedAt: enBrouillon ? null : publieLe,
        createdAt: publieLe,
      },
    });
    console.log(`  + ${a.slug} — importé (${a.publishedAt}).`);
    crees += 1;
  }

  console.log(
    `\nÉdublog : ${crees} importé(s), ${ignores} déjà présent(s), `
      + `${doublons} déjà en ligne sous un autre slug, ${sansContenu} sans contenu.`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
