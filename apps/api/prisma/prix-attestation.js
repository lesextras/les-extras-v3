/**
 * OUVRIR (OU FERMER) LA VENTE DE L'ATTESTATION DE SUIVI.
 *
 * ⚠⚠ CE SCRIPT DÉBITE DE VRAIES PERSONNES. Poser un montant sur une fiche
 * MET LA VENTE EN SERVICE pour cette fiche : le bouton d'achat apparaît sur la
 * page publique, Stripe Checkout s'ouvre, et le premier acheteur est débité.
 * Il ne se lance pas « pour voir » — sans `--appliquer`, il n'écrit rien et se
 * contente de dire ce qu'il ferait.
 *
 * ── LA SOURCE DE VÉRITÉ ─────────────────────────────────────────────────────
 * `Formation.attestationPrixCents` est À LA FOIS le prix et l'interrupteur :
 *   • `null` (ou 0) → la vente est FERMÉE. Le bouton n'est pas monté à
 *     l'écran, et `POST /attestations` refuse. C'est le défaut.
 *   • un montant en centimes → la vente est ouverte, pour cette fiche seule.
 *
 * Aucun texte du site ne recopie ce montant : la fiche l'affiche depuis la
 * base, et toutes les autres pages renvoient à la fiche. C'est ce qui rend un
 * changement de prix sûr — il n'y a qu'un endroit à changer, ici.
 *
 * ── CE QUE LE SCRIPT NE FAIT PAS ────────────────────────────────────────────
 * Il ne touche QUE les mini-formations gratuites en ligne (`freeOnline`), qui
 * sont les seules à délivrer une attestation de suivi. Les formations Qualiopi
 * vendues au devis n'ont rien à faire là : leur attestation d'assiduité est
 * produite à partir d'une session et d'émargements, pas achetée.
 *
 * Il ne supprime rien et ne publie rien : une fiche archivée le reste.
 *
 * ── AVANT D'OUVRIR, CE QUI RESTE VRAI ───────────────────────────────────────
 * Vendre à un particulier oblige à nommer dans les CGV un médiateur de la
 * consommation référencé par la CECMC (art. L612-1 c. conso). Aucun ne l'est à
 * ce jour ; la page /informations-reglementaires le dit en toutes lettres et
 * rappelle au lecteur ses autres droits, à commencer par la rétractation de
 * quatorze jours. C'est une décision de l'association, prise en connaissance
 * de cause — pas un réglage technique.
 *
 *   node prisma/prix-attestation.js                  → simulation (n'écrit rien)
 *   node prisma/prix-attestation.js --appliquer      → pose 49,00 €
 *   node prisma/prix-attestation.js --euros=39 --appliquer
 *   node prisma/prix-attestation.js --fermer --appliquer   → referme la vente
 *
 * (depuis /app/apps/api dans le conteneur)
 */
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const APPLIQUER = process.argv.includes('--appliquer');
const FERMER = process.argv.includes('--fermer');

/** Prix par défaut, décidé par Siham le 16/09/2026. */
const EUROS_PAR_DEFAUT = 49;

/** Plafond identique à celui du DTO : au-delà, c'est une faute de frappe. */
const PLAFOND_CENTIMES = 20_000;

function eurosDemandes() {
  const arg = process.argv.find((a) => a.startsWith('--euros='));
  if (!arg) return EUROS_PAR_DEFAUT;
  const valeur = Number(arg.slice('--euros='.length).replace(',', '.'));
  if (!Number.isFinite(valeur) || valeur <= 0) {
    throw new Error(`Montant illisible : ${arg}`);
  }
  return valeur;
}

function enEuros(centimes) {
  return (centimes / 100).toFixed(2).replace('.', ',') + ' €';
}

async function main() {
  const centimes = FERMER ? null : Math.round(eurosDemandes() * 100);

  // ⚠ Le plafond arrête la faute qui coûte : un zéro de trop vend le document
  // dix fois son prix, et le débit, lui, est bien réel.
  if (centimes !== null && centimes > PLAFOND_CENTIMES) {
    throw new Error(
      `Montant refusé : ${enEuros(centimes)} dépasse le plafond de ${enEuros(PLAFOND_CENTIMES)}. ` +
        `L'unité attendue est l'EURO (--euros=49), pas le centime.`,
    );
  }

  const fiches = await prisma.formation.findMany({
    where: { freeOnline: true },
    select: { id: true, title: true, slug: true, status: true, attestationPrixCents: true },
    orderBy: { title: 'asc' },
  });

  if (fiches.length === 0) {
    console.log('Aucune mini-formation gratuite en base : rien à faire.');
    return;
  }

  console.log(
    FERMER
      ? `Fermeture de la vente sur ${fiches.length} fiche(s).`
      : `Ouverture de la vente à ${enEuros(centimes)} sur ${fiches.length} fiche(s).`,
  );
  console.log(APPLIQUER ? '' : '(SIMULATION — rien ne sera écrit. Ajoutez --appliquer.)\n');

  let changees = 0;
  for (const f of fiches) {
    const avant =
      f.attestationPrixCents == null ? 'fermée' : enEuros(f.attestationPrixCents);
    const apres = centimes == null ? 'fermée' : enEuros(centimes);
    if (avant === apres) {
      console.log(`  =  ${f.title} — déjà ${apres}`);
      continue;
    }
    console.log(`  ${APPLIQUER ? '+' : '~'}  ${f.title} — ${avant} → ${apres}`);
    if (APPLIQUER) {
      await prisma.formation.update({
        where: { id: f.id },
        data: { attestationPrixCents: centimes },
      });
    }
    changees += 1;
  }

  console.log(
    `\n${APPLIQUER ? 'Modifiées' : 'À modifier'} : ${changees} / ${fiches.length}.`,
  );
  if (APPLIQUER && centimes !== null) {
    console.log(
      'La vente est OUVERTE sur ces fiches. Vérifiez une fiche publique avant de communiquer.',
    );
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
