import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../common/mail/mail.service';

/** Fenêtre pendant laquelle l'établissement peut encore annuler seul. */
export const FENETRE_ANNULATION_MS = 48 * 60 * 60 * 1000;

// LA FICHE DOIT PERMETTRE DE SE JOINDRE (23/09/2026) : l'intervenant gère la
// réservation directement avec son client. On donne donc la personne derrière
// le compte — son nom, son téléphone — et l'adresse complète, pas seulement
// la ville. Le compte, c'est la personne : ses coordonnées sont les siennes.
const CONTACT = {
  name: true,
  city: true,
  address: true,
  postalCode: true,
  phone: true,
  contactEmail: true,
  owner: { select: { email: true, firstName: true, lastName: true, phone: true } },
} as const;

type CompteContact = {
  name: string;
  city?: string | null;
  address?: string | null;
  postalCode?: string | null;
  phone?: string | null;
  contactEmail?: string | null;
  owner?: {
    email: string | null;
    firstName?: string | null;
    lastName?: string | null;
    phone?: string | null;
  } | null;
} | null;

const coordonnees = (a: CompteContact, defaut: string) => {
  const personne = [a?.owner?.firstName, a?.owner?.lastName].filter(Boolean).join(' ').trim();
  const nom = a?.name ?? defaut;
  const adresse = [a?.address, [a?.postalCode, a?.city].filter(Boolean).join(' ')]
    .filter((x) => x && String(x).trim())
    .join(', ');
  return {
    nom: personne && personne !== nom ? `${personne} · ${nom}` : nom,
    email: a?.contactEmail ?? a?.owner?.email ?? null,
    telephone: a?.phone ?? a?.owner?.phone ?? null,
    ville: adresse || a?.city || null,
  };
};

/**
 * LA FICHE DE RÉSERVATION, ENVOYÉE AUX DEUX PARTIES.
 *
 * Une réservation engage deux personnes : jusqu'ici l'une recevait une cloche
 * dans l'application et l'autre rien du tout, et aucune des deux n'avait de
 * quoi joindre l'autre. C'est ce courriel qui met les deux au même niveau
 * d'information : ce qui est réservé, quand, pour combien de personnes, à quel
 * tarif annoncé, les coordonnées d'en face, et la fenêtre d'annulation de
 * quarante-huit heures.
 *
 * Les Extras n'établit pas de contrat : c'est à partir de cette fiche que
 * l'intervenant contacte le demandeur pour convenir des détails, puis émet son
 * devis et sa feuille de mission.
 *
 * Fonction et non méthode de service : elle est appelée depuis les ateliers,
 * les renforts et les devis acceptés, et un service partagé entre les trois
 * ferait une dépendance circulaire pour rien. Elle n'échoue jamais — un
 * courriel qui ne part pas ne doit pas défaire une réservation.
 */
export async function envoyerFicheReservation(
  prisma: PrismaService,
  mail: MailService,
  bookingId: string,
): Promise<void> {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        account: { select: CONTACT },
        service: {
          select: { title: true, price: true, maxParticipants: true, account: { select: CONTACT } },
        },
        mission: {
          select: { title: true, hourlyRate: true, account: { select: CONTACT } },
        },
      },
    });
    if (!booking) return;

    // Sur un ATELIER, le compte porté par la réservation est l'établissement et
    // la fiche appartient à l'intervenant. Sur un RENFORT, c'est l'inverse :
    // l'établissement publie la mission, l'intervenant la prend.
    const surRenfort = Boolean(booking.missionId && booking.mission);
    const accueil = (surRenfort ? booking.mission?.account : booking.account) ?? null;
    const intervenant = (surRenfort ? booking.account : booking.service?.account) ?? null;
    if (!accueil || !intervenant) return;

    const prestation = booking.service?.title ?? booking.mission?.title ?? 'Prestation';
    const montant = booking.totalAmount ?? booking.service?.price ?? null;
    const reglement =
      booking.modePaiement === 'CARTE'
        ? ' · règlement par carte en ligne'
        : booking.modePaiement === 'VIREMENT'
          ? ' · règlement sur facture, par virement'
          : '';
    const tarif =
      montant === null || montant === undefined
        ? null
        : `${Number(montant).toLocaleString('fr-FR')} €${surRenfort ? ' de l’heure' : ''}${reglement}`;

    const effectif = booking.participants ?? null;
    const plafond = booking.service?.maxParticipants ?? null;
    const depassement = effectif !== null && plafond !== null && effectif > plafond ? plafond : null;

    const commun = {
      reference: booking.id.slice(-8).toUpperCase(),
      prestation,
      quand: booking.scheduledAt,
      participants: effectif,
      note: booking.requestNote ?? null,
      tarif,
      depassement,
      demandeur: coordonnees(accueil, 'Le demandeur'),
      intervenant: coordonnees(intervenant, 'L’intervenant'),
      finAnnulation: new Date(booking.createdAt.getTime() + FENETRE_ANNULATION_MS),
      lien: '/dashboard/reservations',
    };

    const destinataires: Array<{ to: string; role: 'demandeur' | 'intervenant' }> = [];
    if (commun.demandeur.email) destinataires.push({ to: commun.demandeur.email, role: 'demandeur' });
    if (commun.intervenant.email)
      destinataires.push({ to: commun.intervenant.email, role: 'intervenant' });

    for (const cible of destinataires) {
      await mail.sendFicheReservation({ ...commun, ...cible }).catch(() => undefined);
    }
  } catch {
    // Silence volontaire : la réservation existe, c'est l'essentiel.
  }
}
