import { Prisma } from '@prisma/client';
import type { PrismaService } from '../prisma/prisma.service';

/**
 * LES FICHES DES ANCIENS COMPTES « SALARIÉ » NE SONT PAS PUBLIQUES.
 *
 * Jusqu'au 24/09/2026, un compte intervenant marqué `profilSalarie` publiait
 * des fiches visibles des seuls établissements qui l'employaient. Le compte
 * salarié rattaché à un établissement n'existe plus (« 1 compte = 1
 * personne », décision de Siham), et avec lui cette portée réservée à
 * l'employeur.
 *
 * ⚠ ON NE LES REND PAS PUBLIQUES POUR AUTANT. Leurs auteurs les ont écrites
 * pour leur maison, pas pour la vitrine : les ouvrir d'un coup publierait des
 * fiches que personne n'a choisi de publier. Elles restent donc hors de tout
 * catalogue et ne se réservent pas ; leur titulaire les voit toujours dans son
 * espace. Pour les proposer au marché, il les recopie depuis un compte
 * intervenant (`POST /accounts/devenir-intervenant`).
 *
 * La même règle vaut à la LISTE et à la RÉSERVATION : une règle qui ne vit que
 * dans la liste se contourne avec une URL.
 */
export const FICHES_OUVERTES: Prisma.ServiceWhereInput = { account: { profilSalarie: false } };

/** Cette fiche peut-elle être réservée ou demandée en devis ? */
export async function ficheReservable(prisma: PrismaService, serviceId: string): Promise<boolean> {
  const trouve = await prisma.service.findFirst({
    where: { id: serviceId, ...FICHES_OUVERTES },
    select: { id: true },
  });
  return trouve !== null;
}

/** Ce qu'on dit à qui tente de réserver une telle fiche. */
export const MESSAGE_FICHE_FERMEE =
  "Cette fiche n'est pas ouverte à la réservation.";
