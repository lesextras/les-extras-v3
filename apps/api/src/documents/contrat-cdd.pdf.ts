import {
  dateFr,
  encadre,
  enTete,
  euros,
  garderPlace,
  ligne,
  nomComplet,
  nouveauDocument,
  paragraphe,
  pied,
  signatures,
  titreSection,
} from './pdf';
import { MOTIFS_RECOURS, type MotifRecours } from '../contrats/contrat-cdd';

/**
 * LE CONTRAT, EN PAPIER.
 *
 * Jusqu'ici le produit vérifiait un contrat sans jamais le produire. C'était
 * le chaînon manquant entre « le logiciel a contrôlé » et « j'ai la pièce à
 * montrer ». Le document reprend l'ordre de l'article L. 1242-12 : les parties,
 * le motif, le terme, le poste, la convention, la rémunération, les organismes
 * sociaux — puis les deux signatures.
 *
 * Il porte deux mentions que je n'ai pas voulu taire : l'établissement est
 * l'employeur, et ce document doit être relu au regard de la convention
 * collective, qui peut être plus favorable que les planchers légaux.
 */

export interface DonneesContratPdf {
  contrat: {
    id: string;
    motif: string;
    salarieRemplaceNom: string | null;
    salarieRemplaceQualification: string | null;
    dateDebut: Date;
    dateFin: Date | null;
    dureeMinimaleJours: number | null;
    poste: string | null;
    qualification: string | null;
    posteARisques: boolean | null;
    conventionCollective: string | null;
    remunerationBrute: unknown;
    remunerationDetail: string | null;
    caisseRetraiteComplementaire: string | null;
    organismePrevoyance: string | null;
    periodeEssaiJours: number | null;
    dpaeEffectueeLe: Date | null;
    dpaeReference: string | null;
    transmisLe: Date | null;
    user?: { firstName: string | null; lastName: string | null; email: string } | null;
  };
  employeur: {
    name: string;
    legalName: string | null;
    siret: string | null;
    address: string | null;
    postalCode: string | null;
    city: string | null;
  };
  synthese: {
    dureeJours: number;
    termePrecis: boolean;
    periodeEssaiMaxJours: number;
    indemniteFinDeContrat: { due: boolean; montant: number };
    carenceApres: { jours: number };
    limiteTransmission: Date | string;
  };
}

export async function contratCddPdf(d: DonneesContratPdf): Promise<Buffer> {
  const { contrat: c, employeur, synthese } = d;
  const salarie = nomComplet(c.user) || c.user?.email || 'Salarié';
  const def = MOTIFS_RECOURS[c.motif as MotifRecours];

  const { doc, termine } = nouveauDocument(
    `Contrat à durée déterminée — ${salarie}`,
    employeur.legalName ?? employeur.name,
  );

  enTete(
    doc,
    'Contrat de travail à durée déterminée',
    `Établi le ${dateFr(new Date())} · Référence ${c.id.slice(-8).toUpperCase()}`,
  );

  titreSection(doc, 'Entre les soussignés');
  ligne(doc, "L'employeur", employeur.legalName ?? employeur.name);
  ligne(
    doc,
    'Adresse',
    [employeur.address, [employeur.postalCode, employeur.city].filter(Boolean).join(' ')]
      .filter(Boolean)
      .join(', ') || '—',
  );
  ligne(doc, 'SIRET', employeur.siret ?? '—');
  doc.moveDown(0.3);
  ligne(doc, 'Le salarié', salarie);
  if (c.user?.email) ligne(doc, 'Courriel', c.user.email);
  ligne(doc, 'Qualification', c.qualification ?? '—');

  titreSection(doc, 'Motif de recours');
  paragraphe(doc, def?.libelle ?? c.motif);
  if (def?.article) paragraphe(doc, `Fondement : ${def.article}.`, { gris: true });
  if (def?.exigeSalarieRemplace) {
    ligne(doc, 'Personne remplacée', c.salarieRemplaceNom ?? '—');
    ligne(doc, 'Sa qualification', c.salarieRemplaceQualification ?? '—');
  }

  titreSection(doc, 'Durée du contrat');
  ligne(doc, 'Date de début', dateFr(c.dateDebut));
  if (c.dateFin) {
    ligne(doc, 'Date de fin', dateFr(c.dateFin));
    ligne(doc, 'Durée', `${synthese.dureeJours} jours`);
  } else {
    ligne(doc, 'Terme', 'Imprécis — le contrat prend fin à la réalisation de son objet');
    ligne(doc, 'Durée minimale', `${c.dureeMinimaleJours ?? synthese.dureeJours} jours`);
  }
  ligne(
    doc,
    "Période d'essai",
    `${c.periodeEssaiJours ?? synthese.periodeEssaiMaxJours} jours (maximum légal : ${synthese.periodeEssaiMaxJours})`,
  );

  titreSection(doc, 'Emploi occupé');
  ligne(doc, 'Poste', c.poste ?? '—');
  ligne(
    doc,
    'Poste à risques particuliers',
    c.posteARisques === null || c.posteARisques === undefined
      ? '—'
      : c.posteARisques
        ? 'Oui — une formation renforcée à la sécurité est due'
        : 'Non',
  );
  ligne(doc, 'Convention collective', c.conventionCollective ?? '—');

  titreSection(doc, 'Rémunération');
  ligne(doc, 'Rémunération brute', euros(Number(c.remunerationBrute ?? 0)));
  if (c.remunerationDetail) ligne(doc, 'Composantes', c.remunerationDetail);
  ligne(
    doc,
    'Indemnité de fin de contrat',
    synthese.indemniteFinDeContrat.due
      ? `${euros(synthese.indemniteFinDeContrat.montant)} — 10 % de la rémunération brute totale (art. L. 1243-8)`
      : 'Non due',
  );

  titreSection(doc, 'Organismes sociaux');
  ligne(doc, 'Retraite complémentaire', c.caisseRetraiteComplementaire ?? '—');
  ligne(doc, 'Prévoyance', c.organismePrevoyance ?? '—');
  ligne(
    doc,
    "Déclaration préalable à l'embauche",
    c.dpaeEffectueeLe
      ? `Effectuée le ${dateFr(c.dpaeEffectueeLe)}${c.dpaeReference ? ` — réf. ${c.dpaeReference}` : ''}`
      : 'À effectuer avant la prise de fonction',
  );

  titreSection(doc, 'Échéances à respecter');
  paragraphe(
    doc,
    `Un exemplaire signé doit être transmis au salarié au plus tard le ${dateFr(synthese.limiteTransmission)}, soit dans les deux jours ouvrables suivant l'embauche (art. L. 1242-13). À l'issue de ce contrat, le même poste ne peut être pourvu par un nouveau contrat à durée déterminée avant un délai de carence de ${synthese.carenceApres.jours} jours d'ouverture de l'établissement (art. L. 1244-3 et L. 1244-3-1).`,
  );

  garderPlace(doc, 200);
  encadre(
    doc,
    "L'établissement signataire est l'employeur : il conclut ce contrat en son nom propre et en assume seul la responsabilité. Ce document a été généré à partir des règles du code du travail ; faites-le relire au regard de votre convention collective, qui peut prévoir des dispositions plus favorables au salarié que les planchers légaux appliqués ici.",
  );

  signatures(doc, `Pour l'employeur — ${employeur.legalName ?? employeur.name}`, `Le salarié — ${salarie}`);

  doc.flushPages();
  pied(
    doc,
    `Contrat ${c.id.slice(-8).toUpperCase()} · ${employeur.legalName ?? employeur.name} · document généré par Les Extras`,
  );
  doc.end();
  return termine;
}
