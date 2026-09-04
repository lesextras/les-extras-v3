/**
 * L'IDENTITÉ LÉGALE DE L'ASSOCIATION SUR SES PROPRES DOCUMENTS.
 *
 * ⚠ POURQUOI CE SCRIPT (04/09/2026). Les factures et les contrats CDD émis par
 * l'association imprimaient « SIRET » suivi d'une virgule : le champ `siret` du
 * compte n'avait jamais été rempli. Une facture sans SIRET n'est pas une
 * facture conforme (art. 242 nonies A, ann. II du CGI), et un CDD sans SIRET
 * d'employeur est un contrat qu'un inspecteur du travail relève immédiatement.
 *
 * ⚠ LES VALEURS VIENNENT DE L'AVIS INSEE, PAS D'UNE DÉDUCTION. Relevé fourni
 * par Siham le 04/09/2026, source Insee mise à jour le 03/09/2026 :
 *   SIREN 820 051 852 · SIRET siège 820 051 852 00011
 *   TVA intracommunautaire FR52820051852
 *   7 rue André Malraux, 77000 Melun · Association loi 1901, créée le 19/06/2012
 *
 * ⚠ ON NE TOUCHE PAS À `vatMention`, ET C'EST DÉLIBÉRÉ. Posséder un numéro de
 * TVA intracommunautaire ne veut PAS dire être assujetti : une association peut
 * en avoir un pour ses achats intracommunautaires tout en restant en franchise.
 * La mention par défaut du produit (non assujetti, art. 293 B du CGI) est celle
 * que documente le schéma pour ce compte. Écrire un taux de TVA ici sur la foi
 * d'un numéro serait inventer un statut fiscal — exactement ce qu'on s'interdit.
 *
 * ⚠ L'ADRESSE EST CELLE DU SIÈGE, PAS CELLE DE DAMMARIE. Le certificat Qualiopi
 * et l'Insee disent tous les deux Melun ; Dammarie-lès-Lys est l'adresse
 * administrative qui traîne encore dans les pieds de page d'e-mails. Le siège
 * est ce qui engage un document juridique.
 *
 * Idempotent : n'écrit que les champs vides, ne remplace jamais une valeur déjà
 * saisie par quelqu'un. Lancer avec `node prisma/seed-identite-association.js`.
 */
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const IDENTITE = {
  legalName: 'ADéPA',
  siret: '82005185200011',
  address: '7 rue André Malraux',
  postalCode: '77000',
  city: 'Melun',
};

/** Le compte de l'association. Repéré par son nom, comme le reste des seeds. */
const NOMS_POSSIBLES = ['ADéPA', 'adépa', 'ADEPA', 'adepa'];

async function main() {
  const comptes = await prisma.account.findMany({
    where: { name: { in: NOMS_POSSIBLES } },
    select: {
      id: true,
      name: true,
      type: true,
      legalName: true,
      siret: true,
      address: true,
      postalCode: true,
      city: true,
    },
  });

  if (comptes.length === 0) {
    console.log('Aucun compte ADéPA trouvé. Rien fait.');
    return;
  }

  for (const c of comptes) {
    // On ne remplit QUE les trous. Si quelqu'un a saisi une autre adresse
    // depuis son espace, c'est son choix qui fait foi, pas ce script.
    const data = {};
    for (const [champ, valeur] of Object.entries(IDENTITE)) {
      if (!c[champ]) data[champ] = valeur;
    }

    if (Object.keys(data).length === 0) {
      console.log(`[=] ${c.name} (${c.type}) : déjà complet, rien à écrire.`);
      continue;
    }

    await prisma.account.update({ where: { id: c.id }, data });
    console.log(`[+] ${c.name} (${c.type}) : ${Object.keys(data).join(', ')}`);
  }

  const restants = await prisma.account.count({
    where: { type: 'ESTABLISHMENT', siret: null },
  });
  console.log(
    `\nÉtablissements encore sans SIRET : ${restants}. ` +
      `Leurs factures et CDD imprimeront « Non renseigné » au lieu d'une virgule.`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
