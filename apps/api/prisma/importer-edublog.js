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
 * Les liens internes pointaient vers les pages WordPress de l'ancien domaine.
 * Comme le SaaS reprend `les-extras.fr`, ces adresses n'y existent plus : on
 * les fait suivre WordPress sur `app.les-extras.fr`, où elles continueront de
 * répondre. Un lien mort dans un article de blog coûte plus cher qu'un lien
 * qui sort du site.
 */
function reecrireLiens(html) {
  return html.replace(
    /https:\/\/(?:www\.)?les-extras\.fr\//g,
    'https://app.les-extras.fr/',
  );
}

/** Le résumé affiché en liste : celui de WordPress, nettoyé de ses entités. */
function nettoyerExtrait(brut) {
  if (!brut) return null;
  const texte = brut
    .replace(/<[^>]+>/g, '')
    .replace(/&rsquo;/g, '’')
    .replace(/&lsquo;/g, '‘')
    .replace(/&hellip;/g, '…')
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
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

  for (const a of articles) {
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
        content: reecrireLiens(a.contentHtml),
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
    `\nÉdublog : ${crees} article(s) importé(s), ${ignores} déjà présent(s), ${sansContenu} sans contenu.`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
