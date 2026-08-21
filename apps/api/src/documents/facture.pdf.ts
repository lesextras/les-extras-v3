import {
  dateFr,
  encadre,
  enTeteAvecLogo,
  euros,
  ligne,
  nouveauDocument,
  paragraphe,
  pied,
  tableau,
  titreSection,
} from './pdf';
import { totauxDevis, type LigneChiffrable } from '../quotes/totaux';
import { logoDeLEmetteur } from './emetteur';

/**
 * LA FACTURE, EN PAPIER.
 *
 * Le cycle de facturation existait — brouillon, émise, payée — mais aucune
 * facture n'était produite : le statut vivait en base, la pièce nulle part.
 * Or une facture est un document comptable qui doit être conservé et
 * présenté ; le statut d'une ligne dans un logiciel ne s'archive pas.
 *
 * Les mentions obligatoires suivies ici sont celles de l'article L. 441-9 du
 * code de commerce : identité des parties, numéro, date d'émission, désignation
 * de la prestation, montant, et date de règlement avec les pénalités de retard.
 */

export interface DonneesFacturePdf {
  facture: {
    id: string;
    number: string;
    amount: unknown;
    status: string;
    issuedAt: Date | null;
    createdAt: Date;
    booking?: {
      id: string;
      scheduledAt: Date | null;
      completedAt: Date | null;
      mission?: { title: string } | null;
      service?: { title: string } | null;
      /**
       * Le devis accepté dont cette facture est la suite. C'est lui qui
       * contractualise ; la facture ne fait que constater l'exécution de ce
       * qui y était convenu. Sa référence est la mention de bon de commande
       * qu'attend un service comptable, et le fil qui permet de reconstituer
       * le dossier en contrôle.
       */
      quote?: {
        reference: string;
        decidedAt: Date | null;
        /** Lignes chiffrées du devis, pour la ventilation de la TVA. */
        lines?: unknown;
        totalHt?: unknown;
        totalTva?: unknown;
      } | null;
    } | null;
  };
  emetteur: {
    name: string;
    legalName: string | null;
    siret: string | null;
    address: string | null;
    postalCode: string | null;
    city: string | null;
    contactEmail: string | null;
    /**
     * Coordonnées bancaires de l'émetteur, pour le règlement par virement.
     * Nullables, et elles le restent : tant qu'un émetteur ne les a pas
     * renseignées dans les réglages de son compte, le bloc « Coordonnées
     * bancaires » ne s'imprime pas. On n'invente jamais un IBAN.
     */
    iban: string | null;
    bic: string | null;
  };
  client: {
    name: string;
    legalName: string | null;
    siret: string | null;
    address: string | null;
    postalCode: string | null;
    city: string | null;
  } | null;
  /**
   * Désignation de la prestation, quand elle ne se déduit pas d'une
   * réservation.
   *
   * Les factures de formation n'ont pas de `Booking` — ni celle de
   * l'inscription vendue par l'organisme, ni celle de l'animation facturée par
   * le formateur. Le PDF imprimait donc « Prestation » et une date « — » sur
   * un document comptable. Or la désignation de la prestation et sa date
   * d'exécution sont deux mentions obligatoires (art. L. 441-9 du code de
   * commerce, art. 242 nonies A de l'annexe II au CGI) : sans elles, la
   * facture est incomplète et le client ne sait pas ce qu'il paie.
   */
  prestation?: { intitule: string; dateRealisation: Date | null } | null;
  /** Mention de TVA à afficher : une association non assujettie doit le dire. */
  mentionTva: string;
}

const STATUT: Record<string, string> = {
  DRAFT: 'Brouillon — non émise',
  ISSUED: 'Émise — en attente de règlement',
  PAID: 'Réglée',
  CANCELLED: 'Annulée',
};

function adresse(p: {
  address: string | null;
  postalCode: string | null;
  city: string | null;
}): string {
  return (
    [p.address, [p.postalCode, p.city].filter(Boolean).join(' ')].filter(Boolean).join(', ') || '—'
  );
}

export async function facturePdf(d: DonneesFacturePdf): Promise<Buffer> {
  const { facture: f, emetteur, client } = d;
  const montant = Number(f.amount ?? 0);
  // UN BROUILLON N'A PAS DE DATE D'ÉMISSION, et il ne faut pas lui en inventer
  // une. Le document affichait « Émise le … » au-dessus de « Brouillon — non
  // émise » : deux mentions contradictoires sur la même ligne, dont l'une
  // fausse. La date d'émission est une mention obligatoire (art. L. 441-9 du
  // code de commerce) ; tant que la facture n'est pas émise, on annonce
  // seulement la date d'établissement.
  const emise = f.issuedAt != null;
  const emission = f.issuedAt ?? f.createdAt;
  // ÉCHÉANCE. Le pavé de bas de page renvoyait le client à « la date
  // d'échéance » sans que celle-ci figure nulle part. Elle découle du délai
  // annoncé juste au-dessus : trente jours à compter de l'émission.
  const echeance = f.issuedAt ? new Date(f.issuedAt.getTime() + 30 * 24 * 3600 * 1000) : null;

  const { doc, termine } = nouveauDocument(
    `Facture ${f.number}`,
    emetteur.legalName ?? emetteur.name,
  );

  // Le logo est celui de L'ÉMETTEUR, jamais celui de la plateforme : c'est son
  // SIRET qui engage la facture. L'association en a un pour les documents
  // qu'elle émet — formations et crédits LEX ; un intervenant qui facture son
  // atelier sous son propre SIRET sort sans logo, et c'est correct. Voir
  // emetteur.ts.
  const logo = logoDeLEmetteur(emetteur.legalName, emetteur.name);
  enTeteAvecLogo(
    doc,
    `Facture ${f.number}`,
    `${emise ? 'Émise' : 'Établie'} le ${dateFr(emission)} · ${STATUT[f.status] ?? f.status}`,
    logo?.image ?? null,
    logo?.ratio ?? 1,
  );

  titreSection(doc, 'Émetteur');
  ligne(doc, 'Raison sociale', emetteur.legalName ?? emetteur.name);
  ligne(doc, 'Adresse', adresse(emetteur));
  ligne(doc, 'SIRET', emetteur.siret ?? '—');
  if (emetteur.contactEmail) ligne(doc, 'Contact', emetteur.contactEmail);

  titreSection(doc, 'Client');
  ligne(doc, 'Raison sociale', client?.legalName ?? client?.name ?? '—');
  if (client) {
    ligne(doc, 'Adresse', adresse(client));
    ligne(doc, 'SIRET', client.siret ?? '—');
  }

  titreSection(doc, 'Prestation');
  // RÉFÉRENCE DU DEVIS ACCEPTÉ. Le client qui reçoit la facture doit pouvoir
  // la rattacher à l'engagement qu'il a validé : c'est ce rattachement que
  // cherche un service comptable avant de mettre en paiement, et c'est lui
  // qui manque le jour d'un contrôle.
  if (f.booking?.quote) {
    ligne(
      doc,
      'Référence du devis',
      `${f.booking.quote.reference}${
        f.booking.quote.decidedAt ? ` — accepté le ${dateFr(f.booking.quote.decidedAt)}` : ''
      }`,
    );
  }
  const intitule =
    d.prestation?.intitule ??
    f.booking?.mission?.title ??
    f.booking?.service?.title ??
    'Prestation';
  const dateRealisation =
    f.booking?.completedAt ?? f.booking?.scheduledAt ?? d.prestation?.dateRealisation ?? null;
  tableau(
    doc,
    [
      { titre: 'Désignation', largeur: 58 },
      { titre: 'Réalisée le', largeur: 22 },
      { titre: 'Montant', largeur: 20, alignement: 'right' },
    ],
    [[intitule, dateRealisation ? dateFr(dateRealisation) : '—', euros(montant)]],
  );

  doc.moveDown(0.6);
  // VENTILATION DE LA TVA, REPRISE DU DEVIS.
  //
  // La facture ne porte qu'un montant, et elle imprimait sous ce montant la
  // mention de franchise par défaut. Sur une prestation issue d'un devis
  // soumis à la TVA, elle déclarait donc exonérée une taxe déjà facturée —
  // une mention fiscale fausse, et la ventilation par taux qu'impose
  // l'article 242 nonies A de l'annexe II au CGI manquait avec elle.
  //
  // Quand le devis d'origine porte de la taxe, c'est lui qui fait foi : les
  // deux pièces doivent dire la même chose, sous peine d'être toutes deux
  // inopposables.
  const lignesDevis = Array.isArray(f.booking?.quote?.lines)
    ? (f.booking!.quote!.lines as LigneChiffrable[])
    : [];
  const ventile = lignesDevis.length > 0 ? totauxDevis(lignesDevis) : null;
  const avecTva = ventile != null && ventile.totalTva > 0;

  if (avecTva) {
    ligne(doc, 'Total hors taxes', euros(ventile.totalHt));
    for (const v of ventile.ventilation) {
      if (v.taux === 0) {
        ligne(doc, 'Base non soumise à TVA', euros(v.baseHt));
      } else {
        ligne(
          doc,
          `TVA ${String(v.taux).replace('.', ',')} % sur ${euros(v.baseHt)}`,
          euros(v.tva),
        );
      }
    }
    ligne(doc, 'Total TVA', euros(ventile.totalTva));
    ligne(doc, 'Net à payer (TTC)', euros(montant));
  } else {
    ligne(doc, 'Total', euros(montant));
    ligne(doc, 'TVA', d.mentionTva);
    ligne(doc, 'Net à payer', euros(montant));
  }
  if (echeance && f.status !== 'PAID' && f.status !== 'CANCELLED') {
    ligne(doc, "Date d'échéance", dateFr(echeance));
  }

  titreSection(doc, 'Règlement');
  paragraphe(
    doc,
    f.status === 'PAID'
      ? 'Cette facture a été réglée. Aucun paiement ne reste dû.'
      : "Règlement à trente jours à compter de la date d'émission. Passé ce délai, des pénalités de retard sont exigibles au taux de trois fois le taux d'intérêt légal, ainsi qu'une indemnité forfaitaire de recouvrement de 40 € (art. L. 441-10 et D. 441-5 du code de commerce). Aucun escompte n'est accordé pour paiement anticipé.",
  );

  // COORDONNÉES BANCAIRES DE L'ÉMETTEUR. Le produit annonce partout un
  // règlement par virement ; la facture ne portait pourtant aucun IBAN, et le
  // destinataire n'avait donc aucun moyen de la payer.
  //
  // Le bloc ne s'imprime que si l'émetteur a renseigné son IBAN (réglages du
  // compte, « Identité de facturation ») : on n'invente pas des coordonnées
  // bancaires, et une facture sans IBAN vaut mieux qu'une facture portant
  // celui d'un autre. Il ne s'imprime pas non plus sur une facture réglée ou
  // annulée, qui n'appelle plus de virement — même condition que la date
  // d'échéance ci-dessus. Le BIC suit s'il est connu : il n'est plus exigé
  // pour un virement SEPA. Rendu identique côté web (`InvoiceDocument.tsx`).
  const iban = emetteur.iban?.trim() || null;
  const bic = emetteur.bic?.trim() || null;
  if (iban && f.status !== 'PAID' && f.status !== 'CANCELLED') {
    ligne(doc, 'IBAN', iban);
    if (bic) ligne(doc, 'BIC', bic);
    doc.moveDown(0.4);
    paragraphe(
      doc,
      `Virement à l'ordre de ${emetteur.legalName ?? emetteur.name}, en rappelant la référence ${f.number}.`,
    );
  }

  encadre(
    doc,
    `Document comptable à conserver. Facture ${f.number}, ${emise ? 'émise' : 'établie'} le ${dateFr(emission)} par ${emetteur.legalName ?? emetteur.name}. En cas de désaccord sur son contenu, contactez l'émetteur${echeance ? ` avant le ${dateFr(echeance)}` : ' sans attendre'}.`,
  );

  doc.flushPages();
  pied(
    doc,
    `Facture ${f.number} · ${emetteur.legalName ?? emetteur.name} · document généré par Les Extras`,
  );
  doc.end();
  return termine;
}
