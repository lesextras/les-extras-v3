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
  signatures,
  tableau,
  titreSection,
  type Doc,
} from '../../documents/pdf';

/**
 * LES PIÈCES D'UNE SESSION, AUX COULEURS DE L'ACADÉMIE QUI LES ÉMET.
 *
 * ⚠⚠ AUCUN NOM NI NUMÉRO EN DUR. Les générateurs de `documents/formation.pdf.ts`
 * impriment l'identité d'ADéPA (son NDA est écrit dans le fichier) : ils
 * servent les formations de l'association. Ici chaque académie imprime SA
 * raison sociale, SON numéro de déclaration d'activité, SON représentant. Une
 * convention signée au nom d'un autre organisme serait sans valeur.
 *
 * Les mentions suivent le code du travail :
 *  - convention : D6353-1 (intitulé, objectif, contenu, moyens, durée, période,
 *    part à distance, déroulement, suivi, sanction, prix, règlement) ;
 *  - contrat avec une personne qui paie elle-même : L6353-3 à L6353-7 (à peine
 *    de nullité : nature, durée, programme, effectifs, prérequis, conditions de
 *    déroulement, titres des formateurs, paiement ; rétractation de dix jours ;
 *    aucune somme avant la fin du délai, 30 % au plus ensuite) ;
 *  - informations avant l'entrée : L6353-8 (objectifs, contenu, formateurs,
 *    horaires, évaluation, contact, règlement intérieur) ;
 *  - certificat de réalisation : les rubriques du modèle ministériel (qualité
 *    du signataire, nature de l'action parmi quatre, dates, durée réalisée,
 *    conservation des pièces).
 *
 * ⚠ Ce sont des MODÈLES : l'académie les relit, et un juriste les valide avant
 * un premier usage. Aucune clause n'est inventée au-delà de ce que ces textes
 * demandent ; les conditions d'annulation renvoient aux CGV de l'organisme.
 */

export interface OrganismePdf {
  nom: string;
  nda?: string | null;
  siret?: string | null;
  adresse?: string | null;
  codePostal?: string | null;
  commune?: string | null;
  telephone?: string | null;
  courriel?: string | null;
  representantNom?: string | null;
  representantQualite?: string | null;
  referentHandicap?: string | null;
  referentPedagogique?: string | null;
  reglementInterieurUrl?: string | null;
}

export interface CreneauPdf {
  debut: Date;
  fin: Date;
  distanciel?: boolean;
  salle?: string | null;
  formateur?: string | null;
}

export interface SessionPdf {
  intitule: string;
  natureAction: 'ACTION_FORMATION' | 'BILAN_COMPETENCES' | 'VAE' | 'APPRENTISSAGE';
  objectifs: string[];
  objectifsTexte?: string | null;
  prerequis?: string | null;
  publicVise?: string | null;
  programme?: string | null;
  methodes?: string | null;
  evaluation?: string | null;
  debut: Date;
  fin?: Date | null;
  dureeHeures?: number | null;
  lieu?: string | null;
  modalite: 'PRESENTIEL' | 'DISTANCIEL' | 'MIXTE';
  tauxDistanciel?: number | null;
  creneaux: CreneauPdf[];
  formateurs: { nom: string; diplomes?: string | null }[];
  infosPratiques?: string | null;
  certification?: string | null;
  lienEspace?: string | null;
}

export interface StagiairePdf {
  nom: string;
  email?: string | null;
  entreprise?: string | null;
}

export interface ClientConventionPdf {
  nom: string;
  siret?: string | null;
  adresse?: string | null;
  contact?: string | null;
  email?: string | null;
}

export interface PrixPdf {
  totalHt: number;
  tva: number;
  totalTtc: number;
  mentionTva?: string | null;
  modalites?: string | null;
}

export const NATURE_LIBELLE: Record<SessionPdf['natureAction'], string> = {
  ACTION_FORMATION: 'Action de formation',
  BILAN_COMPETENCES: 'Bilan de compétences',
  VAE: 'Action de validation des acquis de l’expérience',
  APPRENTISSAGE: 'Action de formation par apprentissage',
};

const MODALITE_LIBELLE: Record<SessionPdf['modalite'], string> = {
  PRESENTIEL: 'En présentiel',
  DISTANCIEL: 'À distance',
  MIXTE: 'Mixte (présentiel et distance)',
};

function adresseOrganisme(o: OrganismePdf): string {
  return [o.adresse, [o.codePostal, o.commune].filter(Boolean).join(' ')].filter(Boolean).join(', ') || 'Adresse non renseignée';
}

function mentionPied(o: OrganismePdf): string {
  const nda = o.nda
    ? `Déclaration d'activité enregistrée sous le n° ${o.nda}. Cet enregistrement ne vaut pas agrément de l'État.`
    : "Numéro de déclaration d'activité en cours d'attribution.";
  return `${o.nom}${o.siret ? `, SIRET ${o.siret}` : ''}. ${nda}`;
}

function blocOrganisme(doc: Doc, o: OrganismePdf) {
  ligne(doc, 'Organisme de formation', o.nom);
  ligne(doc, 'Adresse', adresseOrganisme(o));
  if (o.siret) ligne(doc, 'SIRET', o.siret);
  ligne(doc, 'Déclaration d’activité', o.nda ? `n° ${o.nda}` : 'En cours d’attribution');
  if (o.representantNom) ligne(doc, 'Représenté par', [o.representantNom, o.representantQualite].filter(Boolean).join(', '));
}

const heureFr = (d: Date) =>
  d.toLocaleTimeString('fr-FR', { timeZone: 'Europe/Paris', hour: '2-digit', minute: '2-digit' }).replace(':', ' h ');
const jourFr = (d: Date) =>
  d.toLocaleDateString('fr-FR', { timeZone: 'Europe/Paris', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
const heures = (n: number | null | undefined) => (n ? `${String(Math.round(n * 100) / 100).replace('.', ',')} heure${n > 1 ? 's' : ''}` : 'Non renseignée');

function periode(s: SessionPdf): string {
  if (!s.fin || s.fin.toDateString() === s.debut.toDateString()) return `Le ${dateFr(s.debut)}`;
  return `Du ${dateFr(s.debut)} au ${dateFr(s.fin)}`;
}

function listeCreneaux(doc: Doc, s: SessionPdf) {
  if (!s.creneaux.length) {
    paragraphe(doc, `${periode(s)}. Les horaires détaillés sont communiqués avec la convocation.`);
    return;
  }
  tableau(
    doc,
    [
      { titre: 'Date', largeur: 38 },
      { titre: 'Horaires', largeur: 22 },
      { titre: 'Lieu', largeur: 40 },
    ],
    s.creneaux.map((c) => [
      jourFr(c.debut),
      `${heureFr(c.debut)} à ${heureFr(c.fin)}`,
      c.distanciel ? 'À distance' : c.salle || s.lieu || 'Lieu communiqué',
    ]),
  );
}

function blocAction(doc: Doc, s: SessionPdf) {
  ligne(doc, 'Intitulé', s.intitule);
  ligne(doc, 'Nature (art. L6313-1)', NATURE_LIBELLE[s.natureAction]);
  if (s.certification) ligne(doc, 'Certification visée', s.certification);
  ligne(doc, 'Période', periode(s));
  ligne(doc, 'Durée par stagiaire', heures(s.dureeHeures));
  ligne(doc, 'Modalité', MODALITE_LIBELLE[s.modalite] + (s.tauxDistanciel ? `, dont ${s.tauxDistanciel} % à distance` : ''));
  ligne(doc, 'Lieu', s.modalite === 'DISTANCIEL' ? 'À distance' : s.lieu || 'Communiqué avec la convocation');
}

function blocObjectifs(doc: Doc, s: SessionPdf) {
  titreSection(doc, 'Objectifs');
  if (s.objectifs.length) s.objectifs.forEach((o) => paragraphe(doc, `• ${o}`));
  else paragraphe(doc, s.objectifsTexte || 'Les objectifs figurent au programme joint.');
}

/* ================================================================ convention */

export async function conventionPdf(d: {
  organisme: OrganismePdf;
  session: SessionPdf;
  client: ClientConventionPdf;
  stagiaires: StagiairePdf[];
  prix: PrixPdf;
  signature?: { nom: string; le: Date; empreinte: string } | null;
  reference: string;
}): Promise<Buffer> {
  const { doc, termine } = nouveauDocument(`Convention de formation, ${d.session.intitule}`, d.organisme.nom);
  enTete(doc, 'Convention de formation professionnelle', `Articles L6353-1 et D6353-1 du code du travail. Référence ${d.reference}.`);

  titreSection(doc, 'Entre les soussignés');
  blocOrganisme(doc, d.organisme);
  doc.moveDown(0.4);
  ligne(doc, 'Et le client', d.client.nom);
  if (d.client.siret) ligne(doc, 'SIRET', d.client.siret);
  if (d.client.adresse) ligne(doc, 'Adresse', d.client.adresse);
  if (d.client.contact) ligne(doc, 'Représenté par', d.client.contact);

  titreSection(doc, 'Article 1. Objet');
  paragraphe(doc, "L'organisme de formation s'engage à réaliser, au bénéfice des stagiaires désignés à l'article 4, l'action décrite ci-dessous.");
  blocAction(doc, d.session);
  blocObjectifs(doc, d.session);
  if (d.session.programme) {
    titreSection(doc, 'Contenu');
    paragraphe(doc, d.session.programme);
  }

  titreSection(doc, 'Article 2. Moyens, déroulement, suivi et sanction');
  paragraphe(doc, d.session.methodes || 'Méthodes et moyens pédagogiques décrits au programme remis avant l’entrée en formation.');
  paragraphe(doc, "Suivi de l'exécution : feuilles d'émargement signées par demi-journée par les stagiaires et le formateur. Évaluation des acquis : " + (d.session.evaluation || 'selon les modalités du programme') + '.');
  paragraphe(doc, "Sanction : une attestation de fin de formation est remise à chaque stagiaire ; un certificat de réalisation est établi à l'issue de l'action.");

  titreSection(doc, 'Article 3. Dates et lieu');
  listeCreneaux(doc, d.session);

  titreSection(doc, 'Article 4. Stagiaires');
  paragraphe(doc, `Effectif : ${d.stagiaires.length} stagiaire${d.stagiaires.length > 1 ? 's' : ''}.`);
  d.stagiaires.forEach((s) => paragraphe(doc, `• ${s.nom}`));

  titreSection(doc, 'Article 5. Prix et modalités de règlement');
  ligne(doc, 'Prix hors taxes', euros(d.prix.totalHt));
  ligne(doc, 'TVA', d.prix.mentionTva ? d.prix.mentionTva : euros(d.prix.tva));
  ligne(doc, 'Prix toutes taxes comprises', euros(d.prix.totalTtc));
  paragraphe(doc, d.prix.modalites || 'Règlement à réception de la facture, établie à l’issue de l’action.');

  titreSection(doc, 'Article 6. Dédit, abandon, différends');
  paragraphe(
    doc,
    "En cas d'annulation, de report ou d'abandon, les conditions applicables sont celles des conditions générales de vente de l'organisme, remises avec la présente convention. Seules les prestations effectivement réalisées sont dues en cas d'abandon pour force majeure dûment reconnue. À défaut d'accord amiable, tout différend relève du tribunal compétent du siège de l'organisme.",
  );

  if (d.signature) {
    encadre(
      doc,
      `Signée électroniquement par ${d.signature.nom} le ${d.signature.le.toLocaleString('fr-FR', { timeZone: 'Europe/Paris' })} (signature électronique simple, art. 1367 du code civil : code à usage unique envoyé par e-mail). Empreinte du document signé : ${d.signature.empreinte.slice(0, 32)}…`,
    );
  }
  signatures(doc, `Pour l'organisme : ${d.organisme.representantNom ?? d.organisme.nom}`, `Pour le client : ${d.client.contact ?? d.client.nom}`);
  pied(doc, mentionPied(d.organisme));
  doc.end();
  return termine;
}

/* ================================================================ contrat */

export async function contratPdf(d: {
  organisme: OrganismePdf;
  session: SessionPdf;
  stagiaire: StagiairePdf & { adresse?: string | null };
  prix: PrixPdf;
  signature?: { nom: string; le: Date; empreinte: string } | null;
  reference: string;
}): Promise<Buffer> {
  const { doc, termine } = nouveauDocument(`Contrat de formation, ${d.session.intitule}`, d.organisme.nom);
  enTete(doc, 'Contrat de formation professionnelle', `Articles L6353-3 à L6353-7 du code du travail. Référence ${d.reference}.`);

  titreSection(doc, 'Entre les soussignés');
  blocOrganisme(doc, d.organisme);
  doc.moveDown(0.4);
  ligne(doc, 'Et le stagiaire', d.stagiaire.nom);
  if (d.stagiaire.adresse) ligne(doc, 'Adresse', d.stagiaire.adresse);
  if (d.stagiaire.email) ligne(doc, 'Courriel', d.stagiaire.email);

  titreSection(doc, 'Article 1. Objet, nature, durée, effectifs');
  blocAction(doc, d.session);
  ligne(doc, 'Effectif de la session', 'Communiqué avec la convocation');
  blocObjectifs(doc, d.session);
  if (d.session.programme) {
    titreSection(doc, 'Programme');
    paragraphe(doc, d.session.programme);
  }

  titreSection(doc, 'Article 2. Niveau de connaissances préalables');
  paragraphe(doc, d.session.prerequis || 'Aucun prérequis.');

  titreSection(doc, 'Article 3. Conditions de déroulement');
  paragraphe(doc, d.session.methodes || 'Moyens pédagogiques et techniques décrits au programme.');
  if (d.session.modalite !== 'PRESENTIEL') {
    paragraphe(doc, "La partie à distance comporte une assistance technique et pédagogique et des évaluations qui jalonnent le parcours ; les activités et leur durée estimée sont indiquées au programme.");
  }
  paragraphe(doc, 'Contrôle des connaissances : ' + (d.session.evaluation || 'selon les modalités du programme') + '. Sanction : attestation de fin de formation.');
  listeCreneaux(doc, d.session);

  titreSection(doc, 'Article 4. Formateurs');
  if (d.session.formateurs.length) {
    d.session.formateurs.forEach((f) => paragraphe(doc, `• ${f.nom}${f.diplomes ? ` : ${f.diplomes}` : ''}`));
  } else {
    paragraphe(doc, 'Le nom, les diplômes et les références des formateurs sont communiqués avant l’entrée en formation.');
  }

  titreSection(doc, 'Article 5. Délai de rétractation');
  paragraphe(
    doc,
    'À compter de la signature du présent contrat, le stagiaire dispose d’un délai de dix jours pour se rétracter, par lettre recommandée avec avis de réception adressée à l’organisme (art. L6353-5). Aucune somme ne peut être exigée avant l’expiration de ce délai (art. L6353-6).',
  );

  titreSection(doc, 'Article 6. Prix et modalités de paiement');
  ligne(doc, 'Prix hors taxes', euros(d.prix.totalHt));
  ligne(doc, 'TVA', d.prix.mentionTva ? d.prix.mentionTva : euros(d.prix.tva));
  ligne(doc, 'Prix toutes taxes comprises', euros(d.prix.totalTtc));
  paragraphe(
    doc,
    (d.prix.modalites ? `${d.prix.modalites} ` : '') +
      "À l'expiration du délai de rétractation, il ne peut être payé plus de 30 % du prix ; le solde est échelonné au fur et à mesure du déroulement de l'action (art. L6353-6).",
  );

  titreSection(doc, 'Article 7. Interruption, abandon');
  paragraphe(
    doc,
    "Si, par suite de force majeure dûment reconnue, le stagiaire est empêché de suivre la formation, il peut rompre le contrat : seules les prestations effectivement dispensées sont dues, au prorata de leur valeur prévue (art. L6353-7). En cas d'inexécution totale ou partielle du fait de l'organisme, celui-ci rembourse les sommes indûment perçues (art. L6354-1). Les autres cas d'abandon relèvent des conditions générales de vente de l'organisme.",
  );

  if (d.signature) {
    encadre(
      doc,
      `Signé électroniquement par ${d.signature.nom} le ${d.signature.le.toLocaleString('fr-FR', { timeZone: 'Europe/Paris' })} (signature électronique simple, art. 1367 du code civil). Empreinte du document signé : ${d.signature.empreinte.slice(0, 32)}…`,
    );
  }
  signatures(doc, `Pour l'organisme : ${d.organisme.representantNom ?? d.organisme.nom}`, `Le stagiaire : ${d.stagiaire.nom}`);
  pied(doc, mentionPied(d.organisme));
  doc.end();
  return termine;
}

/* ================================================================ convocation */

export async function convocationPdf(d: { organisme: OrganismePdf; session: SessionPdf; stagiaire: StagiairePdf }): Promise<Buffer> {
  const { doc, termine } = nouveauDocument(`Convocation, ${d.session.intitule}`, d.organisme.nom);
  enTete(doc, 'Convocation', d.organisme.nom);
  paragraphe(doc, `${d.stagiaire.nom},`);
  paragraphe(doc, `Nous avons le plaisir de vous confirmer votre inscription à la formation « ${d.session.intitule} ».`);
  titreSection(doc, 'Quand et où');
  ligne(doc, 'Période', periode(d.session));
  ligne(doc, 'Durée', heures(d.session.dureeHeures));
  ligne(doc, 'Lieu', d.session.modalite === 'DISTANCIEL' ? 'À distance (le lien vous est communiqué)' : d.session.lieu || 'Communiqué séparément');
  listeCreneaux(doc, d.session);
  if (d.session.infosPratiques) {
    titreSection(doc, 'Informations pratiques');
    paragraphe(doc, d.session.infosPratiques);
  }
  titreSection(doc, 'Émargement');
  paragraphe(
    doc,
    "Chaque demi-journée, vous signez depuis votre téléphone : le formateur affiche un code en salle, vous ouvrez votre lien personnel, vous recopiez le code et vous signez. Gardez ce lien, il vous sert aussi pour vos évaluations et vos documents." +
      (d.session.lienEspace ? ` Votre lien : ${d.session.lienEspace}` : ''),
  );
  titreSection(doc, 'Vos contacts');
  if (d.organisme.referentPedagogique) ligne(doc, 'Référent pédagogique', d.organisme.referentPedagogique);
  ligne(doc, 'Référent handicap', d.organisme.referentHandicap || 'Contactez l’organisme');
  paragraphe(doc, "Si vous avez besoin d'un aménagement lié à une situation de handicap, prévenez le référent avant le premier jour.", { gris: true });
  if (d.organisme.courriel || d.organisme.telephone) ligne(doc, 'Organisme', [d.organisme.courriel, d.organisme.telephone].filter(Boolean).join(' · '));
  if (d.organisme.reglementInterieurUrl) ligne(doc, 'Règlement intérieur', d.organisme.reglementInterieurUrl);
  pied(doc, mentionPied(d.organisme));
  doc.end();
  return termine;
}

/* ================================================================ programme */

export async function programmePdf(d: { organisme: OrganismePdf; session: SessionPdf; prixHt?: number | null }): Promise<Buffer> {
  const { doc, termine } = nouveauDocument(`Programme, ${d.session.intitule}`, d.organisme.nom);
  enTete(doc, d.session.intitule, `Programme de formation. ${d.organisme.nom}`);
  titreSection(doc, 'En bref');
  ligne(doc, 'Nature', NATURE_LIBELLE[d.session.natureAction]);
  ligne(doc, 'Public visé', d.session.publicVise || 'Tout public');
  ligne(doc, 'Prérequis', d.session.prerequis || 'Aucun');
  ligne(doc, 'Durée', heures(d.session.dureeHeures));
  ligne(doc, 'Modalité', MODALITE_LIBELLE[d.session.modalite] + (d.session.tauxDistanciel ? `, dont ${d.session.tauxDistanciel} % à distance` : ''));
  if (d.prixHt !== null && d.prixHt !== undefined) ligne(doc, 'Tarif', `${euros(d.prixHt)} HT par stagiaire`);
  if (d.session.certification) ligne(doc, 'Certification visée', d.session.certification);
  blocObjectifs(doc, d.session);
  if (d.session.programme) {
    titreSection(doc, 'Contenu');
    paragraphe(doc, d.session.programme);
  }
  titreSection(doc, 'Méthodes et moyens');
  paragraphe(doc, d.session.methodes || 'Apports, mises en situation, échanges à partir des pratiques des participants.');
  titreSection(doc, "Modalités d'évaluation");
  paragraphe(doc, d.session.evaluation || "Positionnement à l'entrée, évaluation des acquis à la sortie, questionnaire de satisfaction.");
  titreSection(doc, 'Formateurs');
  if (d.session.formateurs.length) d.session.formateurs.forEach((f) => paragraphe(doc, `• ${f.nom}${f.diplomes ? ` : ${f.diplomes}` : ''}`));
  else paragraphe(doc, 'Communiqués avant l’entrée en formation.');
  titreSection(doc, 'Accessibilité et contacts');
  paragraphe(doc, `Référent handicap : ${d.organisme.referentHandicap || "contactez l'organisme"}. Un aménagement se prévoit avant l'entrée en formation.`);
  if (d.organisme.courriel || d.organisme.telephone) paragraphe(doc, `Contact : ${[d.organisme.courriel, d.organisme.telephone].filter(Boolean).join(' · ')}`);
  pied(doc, mentionPied(d.organisme));
  doc.end();
  return termine;
}

/* ================================================================ attestation */

export async function attestationFinPdf(d: {
  organisme: OrganismePdf;
  session: SessionPdf;
  stagiaire: StagiairePdf;
  heuresRealisees: number;
  resultats: { objectif: string; entree: number | null; sortie: number | null }[];
  appreciation?: string | null;
  faitLe: Date;
}): Promise<Buffer> {
  const { doc, termine } = nouveauDocument(`Attestation de fin de formation, ${d.stagiaire.nom}`, d.organisme.nom);
  enTete(doc, 'Attestation de fin de formation', d.organisme.nom);
  paragraphe(
    doc,
    `${d.organisme.representantNom ? `${d.organisme.representantNom}${d.organisme.representantQualite ? `, ${d.organisme.representantQualite}` : ''}, ` : ''}pour l'organisme de formation ${d.organisme.nom}, atteste que ${d.stagiaire.nom}${d.stagiaire.entreprise ? `, salarié(e) de ${d.stagiaire.entreprise},` : ''} a suivi l'action suivante.`,
  );
  blocAction(doc, d.session);
  ligne(doc, 'Durée suivie', heures(d.heuresRealisees));
  blocObjectifs(doc, d.session);
  titreSection(doc, "Résultats de l'évaluation des acquis");
  const notes = d.resultats.filter((r) => r.sortie !== null);
  if (notes.length) {
    tableau(
      doc,
      [
        { titre: 'Objectif', largeur: 64 },
        { titre: 'Entrée', largeur: 18, alignement: 'right' },
        { titre: 'Sortie', largeur: 18, alignement: 'right' },
      ],
      d.resultats.map((r) => [r.objectif, r.entree === null ? 'Non évalué' : `${r.entree} / 4`, r.sortie === null ? 'Non évalué' : `${r.sortie} / 4`]),
    );
    paragraphe(doc, 'Échelle : 0 non acquis, 1 notions, 2 en cours d’acquisition, 3 acquis, 4 maîtrisé.', { gris: true });
  }
  paragraphe(doc, d.appreciation || (notes.length ? '' : "Les résultats de l'évaluation des acquis figurent au dossier du stagiaire."));
  doc.moveDown(0.6);
  paragraphe(doc, `Fait à ${d.organisme.commune || '…'}, le ${dateFr(d.faitLe)}.`);
  signatures(doc, `Pour l'organisme : ${d.organisme.representantNom ?? d.organisme.nom}`, 'Cachet de l’organisme');
  pied(doc, mentionPied(d.organisme));
  doc.end();
  return termine;
}

/* ======================================================= certificat de réalisation */

export async function certificatRealisationPdf(d: {
  organisme: OrganismePdf;
  session: SessionPdf;
  stagiaire: StagiairePdf;
  heuresRealisees: number;
  faitLe: Date;
}): Promise<Buffer> {
  const { doc, termine } = nouveauDocument(`Certificat de réalisation, ${d.stagiaire.nom}`, d.organisme.nom);
  enTete(doc, 'Certificat de réalisation', 'Selon le modèle du ministère chargé de la formation professionnelle');
  paragraphe(
    doc,
    `Je soussigné(e) ${d.organisme.representantNom || '……………………'}, représentant légal du dispensateur de l'action concourant au développement des compétences ${d.organisme.nom},`,
  );
  paragraphe(doc, `atteste que ${d.stagiaire.nom}${d.stagiaire.entreprise ? `, salarié(e) de l'entreprise ${d.stagiaire.entreprise},` : ''} a suivi l'action`);
  ligne(doc, 'Intitulé de l’action', d.session.intitule);
  titreSection(doc, 'Nature de l’action concourant au développement des compétences');
  const natures: SessionPdf['natureAction'][] = ['ACTION_FORMATION', 'BILAN_COMPETENCES', 'VAE', 'APPRENTISSAGE'];
  for (const n of natures) {
    garderPlace(doc, 18);
    const y = doc.y;
    doc.lineWidth(0.8).strokeColor('#5b6470').rect(MARGE, y + 1, 9, 9).stroke();
    if (n === d.session.natureAction) {
      doc.moveTo(MARGE + 2, y + 5.5).lineTo(MARGE + 4, y + 8).lineTo(MARGE + 8, y + 2.5).stroke();
    }
    doc.fillColor('#1b2430').font('Helvetica').fontSize(10).text(NATURE_LIBELLE[n], MARGE + 16, y, { width: LARGEUR_UTILE - 16 });
    doc.moveDown(0.3);
  }
  doc.moveDown(0.4);
  paragraphe(
    doc,
    `qui s'est déroulée ${d.session.fin && d.session.fin.toDateString() !== d.session.debut.toDateString() ? `du ${dateFr(d.session.debut)} au ${dateFr(d.session.fin)}` : `le ${dateFr(d.session.debut)}`}, pour une durée de ${heures(d.heuresRealisees)}.`,
  );
  if (d.session.modalite !== 'PRESENTIEL') {
    paragraphe(doc, "Pour la partie à distance, la durée tient compte de la réalisation des activités pédagogiques et du temps estimé pour les réaliser.", { gris: true });
  }
  paragraphe(
    doc,
    "Sans préjudice des délais imposés par les règles fiscales, comptables ou commerciales, je m'engage à conserver l'ensemble des pièces justificatives qui ont permis d'établir le présent certificat pendant une durée de trois ans à compter de la fin de l'année du dernier paiement. En cas de cofinancement des fonds européens, la durée de conservation est étendue conformément aux obligations conventionnelles spécifiques.",
  );
  paragraphe(doc, `Fait à ${d.organisme.commune || '…'}, le ${dateFr(d.faitLe)}.`);
  signatures(doc, `${d.organisme.representantNom ?? 'Le représentant légal'}${d.organisme.representantQualite ? `, ${d.organisme.representantQualite}` : ''}`, 'Cachet de l’organisme');
  pied(doc, mentionPied(d.organisme));
  doc.end();
  return termine;
}

/* ================================================================ émargement */

export interface LigneEmargementPdf {
  stagiaire: string;
  etat: 'SIGNE' | 'DECLARE' | 'ABSENT';
  trace?: string | null;
  le?: Date | null;
}

export interface DemiJourneePdf {
  date: Date;
  slot: 'MORNING' | 'AFTERNOON';
  horaires?: string | null;
  heures?: number | null;
  lignes: LigneEmargementPdf[];
  formateur?: { nom: string; trace?: string | null; le?: Date | null } | null;
}

function dessinerTrace(doc: Doc, trace: string, x: number, y: number, largeur: number, hauteur: number) {
  const sx = largeur / 300;
  const sy = hauteur / 100;
  const s = Math.min(sx, sy);
  doc.save();
  doc.translate(x + (largeur - 300 * s) / 2, y + (hauteur - 100 * s) / 2);
  doc.scale(s);
  doc.path(trace).lineWidth(2.2).lineCap('round').lineJoin('round').strokeColor('#1b2430').stroke();
  doc.restore();
}

export async function feuilleEmargementPdf(d: {
  organisme: OrganismePdf;
  session: SessionPdf;
  demiJournees: DemiJourneePdf[];
}): Promise<Buffer> {
  const { doc, termine } = nouveauDocument(`Émargement, ${d.session.intitule}`, d.organisme.nom);
  enTete(doc, "Feuille d'émargement", `${d.session.intitule}. ${periode(d.session)}.`);
  paragraphe(
    doc,
    "Signature par demi-journée. « Signé en ligne » : signature tracée par le stagiaire depuis son lien personnel, après saisie du code affiché en salle ; l'heure, l'adresse IP et l'empreinte de chaque signature sont conservées par l'organisme. « Présence déclarée » : présence enregistrée par l'organisme sans signature du stagiaire.",
    { gris: true },
  );
  if (!d.demiJournees.length) {
    encadre(doc, "Aucune demi-journée n'a encore été émargée pour cette session.");
  }
  for (const j of d.demiJournees) {
    garderPlace(doc, 120);
    titreSection(doc, `${jourFr(j.date)}, ${j.slot === 'MORNING' ? 'matin' : 'après-midi'}${j.horaires ? ` (${j.horaires})` : ''}${j.heures ? `, ${heures(j.heures)}` : ''}`);
    const colNom = LARGEUR_UTILE * 0.36;
    const colSig = LARGEUR_UTILE * 0.34;
    for (const l of j.lignes) {
      garderPlace(doc, 46);
      const y = doc.y;
      doc.fillColor('#1b2430').font('Helvetica-Bold').fontSize(9.5).text(l.stagiaire, MARGE, y + 12, { width: colNom - 8 });
      doc.lineWidth(0.6).strokeColor('#d8dde3').roundedRect(MARGE + colNom, y, colSig, 40, 3).stroke();
      if (l.etat === 'SIGNE' && l.trace) dessinerTrace(doc, l.trace, MARGE + colNom + 4, y + 2, colSig - 8, 36);
      const etat = l.etat === 'SIGNE' ? 'Signé en ligne' : l.etat === 'DECLARE' ? 'Présence déclarée' : 'Absent';
      doc
        .fillColor(l.etat === 'ABSENT' ? '#9aa3ad' : '#1b2430')
        .font('Helvetica')
        .fontSize(8.5)
        .text(`${etat}${l.le ? `\n${l.le.toLocaleString('fr-FR', { timeZone: 'Europe/Paris' })}` : ''}`, MARGE + colNom + colSig + 10, y + 8, { width: LARGEUR_UTILE - colNom - colSig - 10 });
      doc.y = y + 46;
      doc.x = MARGE;
    }
    garderPlace(doc, 50);
    const y = doc.y + 2;
    doc.fillColor('#5b6470').font('Helvetica').fontSize(9).text(`Formateur : ${j.formateur?.nom ?? 'Non signé'}`, MARGE, y + 12, { width: colNom - 8 });
    doc.lineWidth(0.6).strokeColor('#d8dde3').roundedRect(MARGE + colNom, y, colSig, 40, 3).stroke();
    if (j.formateur?.trace) dessinerTrace(doc, j.formateur.trace, MARGE + colNom + 4, y + 2, colSig - 8, 36);
    if (j.formateur?.le) {
      doc.fillColor('#1b2430').fontSize(8.5).text(j.formateur.le.toLocaleString('fr-FR', { timeZone: 'Europe/Paris' }), MARGE + colNom + colSig + 10, y + 14, { width: LARGEUR_UTILE - colNom - colSig - 10 });
    }
    doc.y = y + 50;
    doc.x = MARGE;
    filet(doc);
    doc.moveDown(0.3);
  }
  pied(doc, mentionPied(d.organisme));
  doc.end();
  return termine;
}
