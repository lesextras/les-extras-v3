import {
  LARGEUR_UTILE,
  MARGE,
  dateFr,
  encadre,
  enTete,
  euros,
  filet,
  garderPlace,
  ligne,
  nouveauDocument,
  paragraphe,
  pied,
  tableau,
  titreSection,
} from '../../documents/pdf';
import type { LigneFacture } from './outils';

export interface EmetteurFacture {
  nom: string;
  adresse?: string | null;
  codePostal?: string | null;
  commune?: string | null;
  siret?: string | null;
  nda?: string | null;
  numeroTva?: string | null;
  courriel?: string | null;
  telephone?: string | null;
  coordonneesBancaires?: string | null;
}

export interface ClientFacture {
  nom: string;
  adresse?: string | null;
  codePostal?: string | null;
  ville?: string | null;
  siret?: string | null;
  email?: string | null;
  contact?: string | null;
  genre: 'ENTREPRISE' | 'OPCO' | 'PARTICULIER' | 'PUBLIC' | 'ORGANISME';
}

const TITRE = { FACTURE: 'Facture', AVOIR: 'Avoir', DEVIS: 'Devis' } as const;

/**
 * UNE FACTURE, UN AVOIR OU UN DEVIS DE L'ACADÉMIE.
 *
 * Les mentions obligatoires d'une facture (art. 242 nonies A ann. II CGI,
 * L441-9 c. com.) : numéro unique et continu, date d'émission, identité et
 * SIRET de l'émetteur, identité du client, désignation, quantité, prix
 * unitaire HT, taux et montant de TVA (ou la mention d'exonération), totaux,
 * date d'échéance, pénalités de retard, et pour un client professionnel
 * l'indemnité forfaitaire de 40 € pour frais de recouvrement (D441-5).
 * Depuis la réforme de la facturation électronique, la catégorie de
 * l'opération (ici : prestation de services) et le SIREN du client quand on
 * le connaît.
 *
 * ⚠ UN BROUILLON S'IMPRIME « BROUILLON » EN TÊTE : il n'a pas de numéro, et
 * un document sans numéro ne doit jamais pouvoir passer pour une facture.
 */
export async function factureOrganismePdf(d: {
  type: 'FACTURE' | 'AVOIR' | 'DEVIS';
  numero: string | null;
  emetteur: EmetteurFacture;
  client: ClientFacture;
  lignes: LigneFacture[];
  totalHt: number;
  totalTva: number;
  totalTtc: number;
  mentionTva: string | null;
  dateEmission: Date | null;
  echeance: Date | null;
  conditions: string | null;
  numeroDossier: string | null;
  referenceClient: string | null;
  factureOrigine: string | null;
  montantPaye: number;
  session?: { intitule: string; debut: Date; fin: Date | null } | null;
}): Promise<Buffer> {
  const titre = d.numero ? `${TITRE[d.type]} n° ${d.numero}` : `${TITRE[d.type]} (brouillon)`;
  const { doc, termine } = nouveauDocument(titre, d.emetteur.nom);
  enTete(doc, titre, d.emetteur.nom);

  if (!d.numero) {
    encadre(doc, 'BROUILLON : ce document n’a pas encore de numéro et n’a aucune valeur de facture. Il sert à vérifier les montants avant l’émission.');
  }

  const y0 = doc.y;
  const demi = (LARGEUR_UTILE - 24) / 2;
  const colonne = (x: number, lignes: string[], gras: string) => {
    doc.font('Helvetica-Bold').fontSize(10).fillColor('#1b2430').text(gras, x, y0, { width: demi });
    doc.font('Helvetica').fontSize(9).fillColor('#1b2430');
    for (const l of lignes.filter(Boolean)) doc.text(l, x, doc.y + 1, { width: demi });
    return doc.y;
  };
  const e = d.emetteur;
  const bas1 = colonne(
    MARGE,
    [
      [e.adresse, [e.codePostal, e.commune].filter(Boolean).join(' ')].filter(Boolean).join(', '),
      e.siret ? `SIRET ${e.siret}` : 'SIRET non renseigné',
      e.numeroTva ? `TVA intracommunautaire ${e.numeroTva}` : '',
      e.nda ? `Déclaration d'activité n° ${e.nda}` : '',
      [e.courriel, e.telephone].filter(Boolean).join(' · '),
    ],
    e.nom,
  );
  const c = d.client;
  const bas2 = colonne(
    MARGE + demi + 24,
    [
      c.contact ? `À l'attention de ${c.contact}` : '',
      [c.adresse, [c.codePostal, c.ville].filter(Boolean).join(' ')].filter(Boolean).join(', '),
      c.siret ? `SIRET ${c.siret} (SIREN ${c.siret.slice(0, 9)})` : '',
      c.email ?? '',
    ],
    `Client : ${c.nom}`,
  );
  doc.y = Math.max(bas1, bas2) + 14;
  doc.x = MARGE;
  filet(doc);
  doc.moveDown(0.5);

  if (d.dateEmission) ligne(doc, "Date d'émission", dateFr(d.dateEmission));
  if (d.type === 'DEVIS') {
    if (d.echeance) ligne(doc, 'Valable jusqu’au', dateFr(d.echeance));
  } else if (d.type === 'FACTURE') {
    ligne(doc, "Date d'échéance", d.echeance ? dateFr(d.echeance) : 'À réception');
  }
  if (d.session) {
    const periode = d.session.fin && d.session.fin.toDateString() !== d.session.debut.toDateString()
      ? `du ${dateFr(d.session.debut)} au ${dateFr(d.session.fin)}`
      : `le ${dateFr(d.session.debut)}`;
    ligne(doc, 'Action de formation', `${d.session.intitule}, ${periode}`);
  }
  ligne(doc, "Catégorie de l'opération", 'Prestation de services');
  if (d.numeroDossier) ligne(doc, 'Dossier de prise en charge', d.numeroDossier);
  if (d.referenceClient) ligne(doc, 'Votre référence', d.referenceClient);
  if (d.factureOrigine) ligne(doc, 'Facture d’origine', d.factureOrigine);

  titreSection(doc, 'Détail');
  tableau(
    doc,
    [
      { titre: 'Désignation', largeur: 46 },
      { titre: 'Qté', largeur: 8, alignement: 'right' },
      { titre: 'PU HT', largeur: 15, alignement: 'right' },
      { titre: 'TVA', largeur: 9, alignement: 'right' },
      { titre: 'Total HT', largeur: 16, alignement: 'right' },
    ],
    d.lignes.map((l) => [
      l.libelle,
      String(l.quantite).replace('.', ','),
      euros(l.prixUnitaireHt),
      `${l.tauxTva} %`,
      euros(Math.round(l.quantite * l.prixUnitaireHt * 100) / 100),
    ]),
  );

  garderPlace(doc, 90);
  filet(doc);
  doc.moveDown(0.3);
  ligne(doc, 'Total HT', euros(d.totalHt));
  ligne(doc, 'TVA', d.mentionTva ? '0,00 €' : euros(d.totalTva));
  ligne(doc, d.type === 'AVOIR' ? 'Total de l’avoir TTC' : 'Total TTC', euros(d.totalTtc));
  if (d.type === 'FACTURE' && d.montantPaye > 0) {
    ligne(doc, 'Déjà réglé', euros(d.montantPaye));
    ligne(doc, 'Reste à payer', euros(Math.max(0, Math.round((d.totalTtc - d.montantPaye) * 100) / 100)));
  }
  if (d.mentionTva) paragraphe(doc, d.mentionTva);

  if (d.type === 'FACTURE') {
    titreSection(doc, 'Règlement');
    if (d.conditions) paragraphe(doc, d.conditions);
    if (e.coordonneesBancaires) paragraphe(doc, `Par virement : ${e.coordonneesBancaires}`);
    paragraphe(
      doc,
      'Pas d’escompte pour paiement anticipé. En cas de retard, pénalités au taux d’intérêt appliqué par la Banque centrale européenne à son opération de refinancement la plus récente majoré de 10 points.' +
        (c.genre !== 'PARTICULIER' ? ' Indemnité forfaitaire pour frais de recouvrement : 40 € (art. D441-5 du code de commerce).' : ''),
      { gris: true },
    );
  } else if (d.type === 'DEVIS') {
    titreSection(doc, 'Acceptation');
    if (d.conditions) paragraphe(doc, d.conditions);
    paragraphe(doc, 'Devis à retourner signé avec la mention « bon pour accord ». Il vaut proposition commerciale et ne constitue pas une facture.', { gris: true });
  }

  pied(doc, `${e.nom}${e.siret ? `, SIRET ${e.siret}` : ''}${e.nda ? `. Déclaration d'activité n° ${e.nda}, cet enregistrement ne vaut pas agrément de l'État.` : '.'}`);
  doc.end();
  return termine;
}
