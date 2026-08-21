import {
  MARGE,
  LARGEUR_UTILE,
  dateFr,
  encadre,
  enTete,
  euros,
  garderPlace,
  ligne,
  nouveauDocument,
  paragraphe,
  pied,
  tableau,
  titreSection,
} from './pdf';
import { totauxDevis, totalLigneHt, type LigneChiffrable } from '../quotes/totaux';
import type { PartieFigee } from '../quotes/parties';

/**
 * LE DEVIS, EN PAPIER.
 *
 * C'est la pièce qui manquait, et c'était la plus importante : dans ce métier,
 * ce n'est pas la facture qui contractualise, c'est le devis accepté. La
 * facture ne fait qu'en constater l'exécution. Un établissement public ou
 * associatif n'engage pas une dépense sur un écran ; il lui faut une offre
 * écrite, chiffrée, datée, qu'un directeur revêt de la mention « bon pour
 * accord » et qui remonte ensuite à son conseil d'administration ou à son
 * financeur.
 *
 * ── Ce que le document doit porter ────────────────────────────────────────
 *
 * Un devis n'a pas de liste de mentions obligatoires aussi codifiée que la
 * facture, mais il en emprunte l'essentiel dès lors qu'il vaut offre au sens
 * de l'article 1114 du code civil, et il devient la facture une fois exécuté.
 * On y porte donc, dès le devis :
 *
 *   — l'identité complète des deux parties, SIRET compris ;
 *   — le détail de chaque prestation : nature, quantité, unité, prix
 *     unitaire hors taxes (art. L. 441-9 du code de commerce pour la suite) ;
 *   — la ventilation de la TVA par taux (art. 242 nonies A de l'annexe II au
 *     CGI), ou la mention de franchise quand l'émetteur n'y est pas soumis ;
 *   — la durée de validité de l'offre, sans laquelle l'émetteur reste tenu
 *     sans terme ;
 *   — les conditions de règlement, les pénalités de retard et l'indemnité
 *     forfaitaire de 40 € (art. L. 441-10 et D. 441-5 du code de commerce) ;
 *   — et le bloc d'acceptation, qui est la raison d'être du document.
 *
 * ── Pourquoi les identités sont figées ────────────────────────────────────
 *
 * Les blocs « Prestataire » et « Client » sont lus dans l'instantané pris au
 * moment de l'envoi, pas dans les profils courants. Sans cela, corriger une
 * raison sociale réécrirait un devis déjà accepté, et l'empreinte de la
 * signature porterait sur un texte qui n'existe plus. Voir quotes/parties.ts.
 */

export interface DonneesDevisPdf {
  devis: {
    reference: string;
    title: string;
    request: string | null;
    message: string | null;
    lines: LigneChiffrable[] & { label?: string; unit?: string }[];
    amount: unknown;
    totalHt: unknown;
    totalTva: unknown;
    status: string;
    scheduledAt: Date | null;
    validUntil: Date | null;
    sentAt: Date | null;
    createdAt: Date;
    decidedAt: Date | null;
    acceptedByName: string | null;
    acceptedByRole: string | null;
    refusalReason: string | null;
  };
  prestataire: PartieFigee;
  client: PartieFigee;
  /**
   * Faisceau de preuves, quand le devis a été signé électroniquement. Il
   * remplace alors le cadre à remplir à la main : on n'imprime pas une case à
   * signer sous un document déjà signé.
   */
  signature?: {
    signataireNom: string;
    signataireEmail: string;
    signeLe: Date;
    empreinte: string;
  } | null;
}

const STATUT: Record<string, string> = {
  REQUESTED: 'Demande reçue — chiffrage en cours',
  SENT: 'Proposition en attente de décision',
  ACCEPTED: 'Accepté',
  REFUSED: 'Non retenu',
  EXPIRED: 'Expiré',
};

/**
 * Mention de TVA par défaut.
 *
 * Vraie pour la quasi-totalité des émetteurs de la plateforme : les
 * intervenants indépendants relèvent de la franchise en base, et l'association
 * n'est pas assujettie. Un émetteur qui y est soumis renseigne sa propre
 * mention sur son compte, et c'est elle qui s'affiche alors.
 */
const TVA_NON_APPLICABLE = 'TVA non applicable, article 293 B du code général des impôts';

/**
 * Un taux, écrit à la française : « 5,5 % » et non « 5.5 % ». Le point décimal
 * sur un document comptable français signale une pièce fabriquée ailleurs, et
 * c'est le genre de détail qui décrédibilise le reste.
 */
function taux(v: number): string {
  return `${String(v).replace('.', ',')} %`;
}

function adresse(p: PartieFigee): string {
  return (
    [p.address, [p.postalCode, p.city].filter(Boolean).join(' ')].filter(Boolean).join(', ') || '—'
  );
}

function identite(doc: ReturnType<typeof nouveauDocument>['doc'], p: PartieFigee) {
  ligne(doc, 'Raison sociale', p.legalName ?? p.name);
  ligne(doc, 'Adresse', adresse(p));
  ligne(doc, 'SIRET', p.siret ?? '—');
  if (p.contactEmail) ligne(doc, 'Contact', p.contactEmail);
  if (p.phone) ligne(doc, 'Téléphone', p.phone);
}

export async function devisPdf(d: DonneesDevisPdf): Promise<Buffer> {
  const { devis: q, prestataire, client } = d;
  const lignes = Array.isArray(q.lines) ? q.lines : [];
  const totaux = totauxDevis(lignes);

  // Les devis antérieurs à la structuration n'ont pas de totaux séparés en
  // base. On les recalcule à partir des lignes, ce qui donne le même résultat
  // qu'à l'époque puisque la TVA y valait zéro pour tout le monde.
  const totalHt = q.totalHt != null ? Number(q.totalHt) : totaux.totalHt;
  const totalTva = q.totalTva != null ? Number(q.totalTva) : totaux.totalTva;
  const totalTtc = q.amount != null ? Number(q.amount) : totaux.totalTtc;

  const etabliLe = q.sentAt ?? q.createdAt;
  const accepte = q.status === 'ACCEPTED';
  const perime = q.validUntil != null && q.validUntil < new Date() && !accepte;

  const { doc, termine } = nouveauDocument(
    `Devis ${q.reference}`,
    prestataire.legalName ?? prestataire.name,
  );

  enTete(
    doc,
    `Devis ${q.reference}`,
    `Établi le ${dateFr(etabliLe)} · ${STATUT[q.status] ?? q.status}`,
  );

  titreSection(doc, 'Prestataire');
  identite(doc, prestataire);

  titreSection(doc, 'Client');
  identite(doc, client);

  titreSection(doc, 'Objet');
  ligne(doc, 'Intitulé', q.title);
  if (q.scheduledAt) ligne(doc, "Date d'intervention prévue", dateFr(q.scheduledAt));
  ligne(doc, "Lieu d'exécution", adresse(client));
  if (q.request) {
    doc.moveDown(0.2);
    paragraphe(doc, `Besoin exprimé par le client : ${q.request}`, { gris: true });
  }

  // ── Le chiffrage ────────────────────────────────────────────────────────
  titreSection(doc, 'Détail du chiffrage');
  const soumisTva = totaux.ventilation.some((v) => v.taux > 0);
  tableau(
    doc,
    soumisTva
      ? [
          { titre: 'Désignation', largeur: 44 },
          { titre: 'Qté', largeur: 10, alignement: 'right' },
          { titre: 'Unité', largeur: 12 },
          { titre: 'P.U. HT', largeur: 14, alignement: 'right' },
          { titre: 'TVA', largeur: 8, alignement: 'right' },
          { titre: 'Total HT', largeur: 16, alignement: 'right' },
        ]
      : [
          { titre: 'Désignation', largeur: 52 },
          { titre: 'Qté', largeur: 10, alignement: 'right' },
          { titre: 'Unité', largeur: 14 },
          { titre: 'P.U.', largeur: 12, alignement: 'right' },
          { titre: 'Total', largeur: 16, alignement: 'right' },
        ],
    lignes.map((l) => {
      const base = [
        String((l as { label?: string }).label ?? '—'),
        String(Number(l.quantity ?? 0)),
        String((l as { unit?: string }).unit ?? 'forfait'),
        euros(Number(l.unitPrice ?? 0)),
      ];
      return soumisTva
        ? [...base, taux(Number(l.vatRate ?? 0)), euros(totalLigneHt(l))]
        : [...base, euros(totalLigneHt(l))];
    }),
  );

  doc.moveDown(0.6);
  ligne(doc, 'Total hors taxes', euros(totalHt));
  if (soumisTva) {
    for (const v of totaux.ventilation) {
      if (v.taux === 0) {
        ligne(doc, 'Base non soumise à TVA', euros(v.baseHt));
      } else {
        ligne(doc, `TVA ${taux(v.taux)} sur ${euros(v.baseHt)}`, euros(v.tva));
      }
    }
    ligne(doc, 'Total TVA', euros(totalTva));
  } else {
    ligne(doc, 'TVA', prestataire.vatMention ?? TVA_NON_APPLICABLE);
  }
  ligne(doc, 'TOTAL À RÉGLER', euros(totalTtc));

  if (q.message) {
    titreSection(doc, 'Précisions du prestataire');
    paragraphe(doc, q.message);
  }

  // ── Ce qui engage ───────────────────────────────────────────────────────
  titreSection(doc, "Conditions de l'offre");
  ligne(
    doc,
    "Validité de l'offre",
    q.validUntil ? `jusqu'au ${dateFr(q.validUntil)}` : 'non précisée',
  );
  ligne(doc, 'Établissement du devis', 'Gratuit');
  paragraphe(
    doc,
    "Règlement à trente jours à compter de la date d'émission de la facture. Passé ce délai, des pénalités de retard sont exigibles au taux de trois fois le taux d'intérêt légal, ainsi qu'une indemnité forfaitaire de recouvrement de 40 € (art. L. 441-10 et D. 441-5 du code de commerce). Aucun escompte n'est accordé pour paiement anticipé.",
  );
  paragraphe(
    doc,
    "L'acceptation de ce devis vaut accord sur la prestation, son contenu, son prix et sa date. Elle engage les deux parties. Toute modification ultérieure fera l'objet d'un nouveau devis.",
    { gris: true },
  );

  // ── Le bloc d'acceptation ───────────────────────────────────────────────
  if (d.signature) {
    // Déjà signé : on n'imprime pas une case à remplir sous un document
    // accepté, on imprime la preuve.
    titreSection(doc, 'Acceptation — signature électronique');
    ligne(doc, 'Signataire', d.signature.signataireNom);
    ligne(doc, 'Adresse de signature', d.signature.signataireEmail);
    ligne(doc, 'Date et heure', d.signature.signeLe.toLocaleString('fr-FR'));
    ligne(doc, 'Empreinte du document', d.signature.empreinte);
    encadre(
      doc,
      "Ce devis a été accepté par signature électronique au sens de l'article 1367 du code civil. L'empreinte ci-dessus est celle du document au moment de la signature : toute modification ultérieure de son contenu la rendrait fausse. Le journal complet de la signature — horodatage, adresse de connexion, vérification du code à usage unique — est conservé par l'émetteur et peut être produit sur demande.",
    );
  } else if (accepte) {
    titreSection(doc, 'Acceptation');
    ligne(doc, 'Accepté le', dateFr(q.decidedAt));
    ligne(doc, 'Par', q.acceptedByName ?? '—');
    ligne(doc, 'En qualité de', q.acceptedByRole ?? '—');
    encadre(
      doc,
      `Devis accepté le ${dateFr(q.decidedAt)}${q.acceptedByName ? ` par ${q.acceptedByName}` : ''}, depuis l'espace client de ${client.legalName ?? client.name}. Cette acceptation vaut bon pour accord.`,
    );
  } else if (q.status === 'REFUSED') {
    titreSection(doc, 'Décision');
    ligne(doc, 'Non retenu le', dateFr(q.decidedAt));
    if (q.refusalReason) ligne(doc, 'Motif', q.refusalReason);
  } else {
    // ── « BON POUR ACCORD » ───────────────────────────────────────────────
    //
    // Le cadre à remplir à la main. C'est lui qui transforme une proposition
    // en contrat, et c'est pour lui que le document existe : un directeur
    // imprime le devis, écrit la mention, signe, et le renvoie scanné.
    titreSection(doc, 'Bon pour accord');
    paragraphe(
      doc,
      perime
        ? "Cette offre a dépassé sa durée de validité. Demandez au prestataire un devis actualisé avant de l'accepter."
        : "Pour accepter cette proposition, portez ci-dessous la mention manuscrite « Bon pour accord », datez et signez, puis renvoyez le document au prestataire — ou acceptez-le directement depuis votre espace, ce qui a la même valeur.",
    );
    doc.moveDown(0.4);
    garderPlace(doc, 190);
    const haut = doc.y;
    doc
      .strokeColor('#d8dde3')
      .lineWidth(0.75)
      .roundedRect(MARGE, haut, LARGEUR_UTILE, 170, 4)
      .stroke();

    const interieur = MARGE + 16;
    const largeur = LARGEUR_UTILE - 32;
    doc
      .fillColor('#1b2430')
      .font('Helvetica-Bold')
      .fontSize(10)
      .text('« Bon pour accord »', interieur, haut + 14, { width: largeur });
    doc
      .fillColor('#5b6470')
      .font('Helvetica')
      .fontSize(8.5)
      .text(
        'Mention à recopier de la main du signataire, suivie de la date et de la signature.',
        interieur,
        haut + 30,
        { width: largeur },
      );

    const champs: [string, number][] = [
      ['Nom et prénom du signataire', 58],
      ['Qualité (fonction dans la structure)', 84],
      ['Date', 110],
    ];
    for (const [libelle, decalage] of champs) {
      doc
        .fillColor('#9aa3ad')
        .font('Helvetica')
        .fontSize(8)
        .text(libelle, interieur, haut + decalage, { width: largeur * 0.5, lineBreak: false });
      doc
        .strokeColor('#d8dde3')
        .lineWidth(0.5)
        .moveTo(interieur + largeur * 0.5, haut + decalage + 9)
        .lineTo(interieur + largeur, haut + decalage + 9)
        .stroke();
    }
    doc
      .fillColor('#9aa3ad')
      .fontSize(8)
      .text('Signature et cachet de la structure', interieur, haut + 136, {
        width: largeur,
        lineBreak: false,
      });
    doc.y = haut + 182;
    doc.x = MARGE;
  }

  doc.flushPages();
  pied(
    doc,
    `Devis ${q.reference} · ${prestataire.legalName ?? prestataire.name} · document généré par Les Extras`,
  );
  doc.end();
  return termine;
}
