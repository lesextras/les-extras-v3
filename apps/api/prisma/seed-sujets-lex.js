/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * REPRISE DES SUJETS SUR LES ÉCRITS DÉJÀ ENREGISTRÉS.
 *
 * `AssistantDocument.sujets` dit de qui parle un document, en pseudonymes
 * stables. Les documents antérieurs au 4/09/2026 n'en portent aucun : sans
 * cette reprise, la mémoire des situations ne commencerait qu'aux écrits
 * futurs, et un rapport trimestriel resterait aveugle au précédent.
 *
 * ⚠ CE SCRIPT NE PEUT PAS RÉUTILISER LE PSEUDONYMISEUR DE L'APPLICATION : il
 * tourne en JavaScript brut dans le conteneur, sans passer par la compilation
 * TypeScript. Il fait donc l'inverse, et c'est plus sûr : au lieu de deviner
 * les noms présents dans le texte, il part des pseudonymes DÉJÀ ENREGISTRÉS
 * dans `LexPseudonyme` pour ce compte, et regarde lesquels correspondent à un
 * nom réel qui figure dans le document.
 *
 * Or `LexPseudonyme` ne garde qu'une empreinte HMAC, pas le nom : on ne peut
 * pas remonter du registre au texte. La reprise se limite donc à ce qui est
 * lisible sans déchiffrer quoi que ce soit : les pseudonymes que le document
 * porte DÉJÀ en clair, quand l'auteur a laissé la forme « M.D-1 » dans son
 * écrit. C'est peu, c'est honnête, et ça ne fabrique aucune correspondance.
 *
 * Pour tout le reste, la mémoire se construira d'elle-même : chaque nouvel
 * enregistrement pose ses sujets. Deux écrits suffisent à démarrer une
 * continuité.
 *
 * Usage :
 *   node prisma/seed-sujets-lex.js              (aperçu, n'écrit rien)
 *   node prisma/seed-sujets-lex.js --appliquer  (écrit)
 */
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const APPLIQUER = process.argv.includes('--appliquer');

/** Les pseudonymes stables présents dans un texte : « [M.D-1] » → « M.D-1 ». */
function sujetsDuTexte(texte) {
  const trouves = new Set();
  for (const m of texte.matchAll(/\[([A-ZÀ-Ý](?:\.[A-ZÀ-Ý])?-\d+)\]/g)) trouves.add(m[1]);
  return [...trouves].sort();
}

async function main() {
  const docs = await prisma.assistantDocument.findMany({
    select: { id: true, title: true, content: true, sujets: true, accountId: true },
    orderBy: { createdAt: 'asc' },
  });

  let poses = 0;
  let deja = 0;
  let sansSujet = 0;

  for (const d of docs) {
    if (d.sujets && d.sujets.length > 0) {
      deja += 1;
      continue;
    }
    // On croise avec le registre du compte : un code trouvé dans le texte ne
    // vaut que s'il a réellement été attribué, sinon on inventerait un sujet.
    const bruts = sujetsDuTexte(d.content);
    if (bruts.length === 0) {
      sansSujet += 1;
      continue;
    }
    const connus = await prisma.lexPseudonyme.findMany({
      where: { accountId: d.accountId, pseudo: { in: bruts } },
      select: { pseudo: true },
    });
    const sujets = connus.map((c) => c.pseudo).sort();
    if (sujets.length === 0) {
      sansSujet += 1;
      continue;
    }

    console.log(`  ${APPLIQUER ? '✓' : '→'} ${d.title} : ${sujets.join(', ')}`);
    if (APPLIQUER) {
      await prisma.assistantDocument.update({ where: { id: d.id }, data: { sujets } });
    }
    poses += 1;
  }

  console.log(
    `\n${docs.length} document(s) · ${poses} ${APPLIQUER ? 'repris' : 'à reprendre'} · ` +
      `${deja} déjà renseigné(s) · ${sansSujet} sans pseudonyme lisible`,
  );
  if (sansSujet > 0) {
    console.log(
      "Les documents sans pseudonyme lisible ne sont pas perdus : ils portent des noms\n" +
        "réels, et la mémoire se construira à partir des prochains enregistrements.",
    );
  }
  if (!APPLIQUER) console.log('Aperçu seul. Relancer avec --appliquer pour écrire.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
