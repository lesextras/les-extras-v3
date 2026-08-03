import {
  dateFr,
  encadre,
  enTete,
  euros,
  ligne,
  nouveauDocument,
  paragraphe,
  pied,
  tableau,
  titreSection,
} from './pdf';

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
  };
  client: {
    name: string;
    legalName: string | null;
    siret: string | null;
    address: string | null;
    postalCode: string | null;
    city: string | null;
  } | null;
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
  const emission = f.issuedAt ?? f.createdAt;

  const { doc, termine } = nouveauDocument(
    `Facture ${f.number}`,
    emetteur.legalName ?? emetteur.name,
  );

  enTete(
    doc,
    `Facture ${f.number}`,
    `Émise le ${dateFr(emission)} · ${STATUT[f.status] ?? f.status}`,
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
  const intitule =
    f.booking?.mission?.title ??
    f.booking?.service?.title ??
    'Prestation';
  const dateRealisation = f.booking?.completedAt ?? f.booking?.scheduledAt ?? null;
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
  ligne(doc, 'Total', euros(montant));
  ligne(doc, 'TVA', d.mentionTva);
  ligne(doc, 'Net à payer', euros(montant));

  titreSection(doc, 'Règlement');
  paragraphe(
    doc,
    f.status === 'PAID'
      ? 'Cette facture a été réglée. Aucun paiement ne reste dû.'
      : "Règlement à trente jours à compter de la date d'émission. Passé ce délai, des pénalités de retard sont exigibles au taux de trois fois le taux d'intérêt légal, ainsi qu'une indemnité forfaitaire de recouvrement de 40 € (art. L. 441-10 et D. 441-5 du code de commerce). Aucun escompte n'est accordé pour paiement anticipé.",
  );

  encadre(
    doc,
    `Document comptable à conserver. Facture ${f.number}, émise le ${dateFr(emission)} par ${emetteur.legalName ?? emetteur.name}. En cas de désaccord sur son contenu, contactez l'émetteur avant la date d'échéance.`,
  );

  doc.flushPages();
  pied(
    doc,
    `Facture ${f.number} · ${emetteur.legalName ?? emetteur.name} · document généré par Les Extras`,
  );
  doc.end();
  return termine;
}
