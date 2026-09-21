export type SituationPiece = 'DEDUITE' | 'A_JOUR' | 'BIENTOT_PERIMEE' | 'PERIMEE' | 'MANQUANTE';
export type EtatDossier = 'REPERE' | 'EN_ECRITURE' | 'DEPOSE' | 'ACCORDE' | 'REFUSE' | 'SOLDE';
export type NatureDossier = 'SUBVENTION' | 'APPEL_A_PROJET';

export const LIBELLES_NATURE: Record<NatureDossier, string> = {
  SUBVENTION: 'Subvention',
  APPEL_A_PROJET: 'Appel à projet',
};

export interface TypeDePiece {
  code: string;
  libelle: string;
  categorie: string;
  pourquoi: string;
  ouLaTrouver: string;
  dureeValiditeMois?: number;
  parExercice?: boolean;
  deductible?: 'RNA' | 'SIRENE';
}

export interface PieceDecoree {
  typeCode: string;
  etat: 'A_FOURNIR' | 'DEDUITE' | 'PRESENTE';
  situation: SituationPiece;
  preuve: string | null;
  fileId: string | null;
  dateEmission: string | null;
  dateExpiration: string | null;
  exercice: number | null;
  note: string | null;
  updatedAt: string;
}

export interface LigneClasseur {
  type: TypeDePiece;
  piece: PieceDecoree | null;
  situation: SituationPiece;
}

export interface Dossier {
  id: string;
  dispositifCode: string | null;
  financeur: string;
  intitule: string;
  nature: NatureDossier;
  description: string | null;
  ideeProjet: string | null;
  montantMax: number | null;
  etat: EtatDossier;
  montantDemande: number | null;
  montantAccorde: number | null;
  dateLimiteDepot: string | null;
  dateDepot: string | null;
  dateDecision: string | null;
  dateCompteRendu: string | null;
  piecesExigees: string[];
  notes: string | null;
  budgetPrevu: LigneBudget[];
  budgetRealise: LigneBudget[];
  totaux: { prevu: TotauxBudget; realise: TotauxBudget };
  bilanAction: string | null;
  nombreBeneficiaires: number | null;
}

export type SensMouvement = 'RECETTE' | 'DEPENSE';
export type NatureMouvement =
  | 'DON' | 'ADHESION' | 'VENTE' | 'BILLETTERIE' | 'SUBVENTION' | 'MECENAT' | 'PRESTATION' | 'AUTRE_RECETTE'
  | 'ACHAT' | 'MATERIEL' | 'LOCAL' | 'ASSURANCE' | 'DEPLACEMENT' | 'COMMUNICATION' | 'SALAIRE' | 'BANQUE' | 'AUTRE_DEPENSE';
export type MoyenPaiement = 'ESPECES' | 'CHEQUE' | 'VIREMENT' | 'CARTE' | 'EN_LIGNE' | 'AUTRE';

export const NATURES_RECETTE: NatureMouvement[] = ['DON', 'ADHESION', 'VENTE', 'BILLETTERIE', 'SUBVENTION', 'MECENAT', 'PRESTATION', 'AUTRE_RECETTE'];
export const NATURES_DEPENSE: NatureMouvement[] = ['ACHAT', 'MATERIEL', 'LOCAL', 'ASSURANCE', 'DEPLACEMENT', 'COMMUNICATION', 'SALAIRE', 'BANQUE', 'AUTRE_DEPENSE'];

export const LIBELLES_NATURE_MOUVEMENT: Record<NatureMouvement, string> = {
  DON: 'Don',
  ADHESION: 'Adhésion, cotisation',
  VENTE: 'Vente (buvette, gâteaux, objets)',
  BILLETTERIE: 'Billetterie, entrées',
  SUBVENTION: 'Subvention reçue',
  MECENAT: 'Mécénat, sponsor',
  PRESTATION: 'Prestation facturée',
  AUTRE_RECETTE: 'Autre entrée',
  ACHAT: 'Achat, fournitures',
  MATERIEL: 'Matériel',
  LOCAL: 'Local, salle, loyer',
  ASSURANCE: 'Assurance',
  DEPLACEMENT: 'Déplacement',
  COMMUNICATION: 'Communication, impression',
  SALAIRE: 'Salaire, cotisations',
  BANQUE: 'Frais bancaires',
  AUTRE_DEPENSE: 'Autre sortie',
};

export const LIBELLES_MOYEN: Record<MoyenPaiement, string> = {
  ESPECES: 'Espèces',
  CHEQUE: 'Chèque',
  VIREMENT: 'Virement',
  CARTE: 'Carte',
  EN_LIGNE: 'En ligne',
  AUTRE: 'Autre',
};

export interface Mouvement {
  id: string;
  sens: SensMouvement;
  nature: NatureMouvement;
  libelle: string;
  montant: number;
  date: string;
  tiers: string | null;
  moyen: MoyenPaiement | null;
  recuFiscal: boolean;
  dossierId: string | null;
  actionId: string | null;
  notes: string | null;
}

export interface ResumeBudget {
  lignes: number;
  recettes: number;
  depenses: number;
  solde: number;
  annee: number;
  recettesAnnee: number;
  depensesAnnee: number;
  dons: number;
  donsAvecRecu: number;
  adhesions: number;
  ventes: number;
  subventions: number;
  parNature: Record<string, number>;
}

export interface LigneBudget {
  libelle: string;
  montant: number;
  sens: 'DEPENSE' | 'RECETTE';
}

export interface TotauxBudget {
  depenses: number;
  recettes: number;
  equilibre: boolean;
}

export type RoleContact =
  | 'PRESIDENT'
  | 'TRESORIER'
  | 'SECRETAIRE'
  | 'MEMBRE_BUREAU'
  | 'MEMBRE'
  | 'BENEVOLE'
  | 'SALARIE'
  | 'PARTENAIRE'
  | 'FINANCEUR'
  | 'ELU'
  | 'INSTITUTIONNEL'
  | 'AUTRE';

export const LIBELLES_ROLE: Record<RoleContact, string> = {
  PRESIDENT: 'Président·e',
  TRESORIER: 'Trésorier·ère',
  SECRETAIRE: 'Secrétaire',
  MEMBRE_BUREAU: 'Membre du bureau',
  MEMBRE: 'Membre',
  BENEVOLE: 'Bénévole',
  SALARIE: 'Salarié·e',
  PARTENAIRE: 'Partenaire',
  FINANCEUR: 'Financeur',
  ELU: 'Élu·e',
  INSTITUTIONNEL: 'Institution',
  AUTRE: 'Autre',
};

/** Les quatre familles de contacts autour de l'association. */
export type CategorieContact = 'PARTENAIRE' | 'FINANCEUR' | 'INSTITUTIONNEL' | 'DIVERS';

export const CATEGORIES_CONTACT: {
  code: CategorieContact;
  libelle: string;
  enUnMot: string;
  /** Les rôles qui rangent un contact dans cette famille. */
  roles: RoleContact[];
}[] = [
  { code: 'PARTENAIRE', libelle: 'Partenaires', enUnMot: 'Ceux qui agissent avec vous sur le terrain', roles: ['PARTENAIRE'] },
  { code: 'FINANCEUR', libelle: 'Financeurs', enUnMot: 'Ceux qui donnent de l’argent et demandent des comptes', roles: ['FINANCEUR'] },
  {
    code: 'INSTITUTIONNEL',
    libelle: 'Contacts institutionnels',
    enUnMot: 'Mairie, préfecture, CAF, département, école, élus',
    roles: ['INSTITUTIONNEL', 'ELU'],
  },
  { code: 'DIVERS', libelle: 'Contacts divers', enUnMot: 'Tous les autres : presse, prestataires, voisins…', roles: ['AUTRE'] },
];

/** Tous les rôles qui font sortir un contact de l'équipe interne. */
export const ROLES_AUTOUR: RoleContact[] = ['PARTENAIRE', 'FINANCEUR', 'ELU', 'INSTITUTIONNEL', 'AUTRE'];

/** La famille d'un contact : la première qui correspond à un de ses rôles. */
export function categorieDuContact(roles: RoleContact[]): CategorieContact {
  return CATEGORIES_CONTACT.find((c) => roles.some((r) => c.roles.includes(r)))?.code ?? 'DIVERS';
}

export interface Contact {
  id: string;
  prenom: string;
  nom: string;
  email: string | null;
  telephone: string | null;
  structure: string | null;
  /** Son poste dans sa structure : chargée de mission, adjoint aux sports… */
  poste: string | null;
  roles: RoleContact[];
  dateAdhesion: string | null;
  cotisationAJour: boolean;
  mandatDebut: string | null;
  mandatFin: string | null;
  notes: string | null;
}

export interface ResumeContacts {
  total: number;
  membres: number;
  membresAJour: number;
  benevoles: number;
  salaries: number;
  partenaires: number;
  bureau: { id: string; nom: string; roles: RoleContact[] }[];
}

export type EtatAction = 'PREVUE' | 'EN_COURS' | 'TERMINEE';

export const LIBELLES_ETAT_ACTION: Record<EtatAction, string> = {
  PREVUE: 'Prévue',
  EN_COURS: 'En cours',
  TERMINEE: 'Terminée',
};

/** Une action de l'association : ce qu'elle fait vraiment, avec ses chiffres. */
export interface ActionAssociation {
  id: string;
  intitule: string;
  resume: string | null;
  lieu: string | null;
  dateDebut: string | null;
  dateFin: string | null;
  etat: EtatAction;
  beneficiaires: number | null;
  benevoles: number | null;
  heuresBenevoles: number | null;
  cout: number | null;
  partenaires: string | null;
  bilan: string | null;
}

export interface ResumeActions {
  total: number;
  prevues: number;
  enCours: number;
  terminees: number;
  beneficiaires: number;
  benevoles: number;
  heuresBenevoles: number;
  cout: number;
  sansBilan: number;
}

export interface DocumentLibre {
  id: string;
  titre: string;
  categorie: string | null;
  note: string | null;
  fileId: string | null;
  file: { id: string; originalName: string; size: number; mimeType: string } | null;
  createdAt: string;
}

export interface Projet {
  pourQui: string | null;
  quoi: string | null;
  comment: string | null;
  apres: string | null;
  demande: string | null;
  remplis: number;
  complet: boolean;
  texte: string;
}

export interface VieStatutaire {
  dateDerniereAG: string | null;
  dureeMandatMois: number;
  joursDepuisAG: number | null;
  prochaineAG: string | null;
  agEnRetard: boolean;
  agBientot: boolean;
  bureau: { president: boolean; tresorier: boolean; secretaire: boolean };
  mandatsExpires: { id: string; nom: string; roles: RoleContact[]; mandatFin: string }[];
  mandatsBientot: { id: string; nom: string; roles: RoleContact[]; mandatFin: string }[];
}

export interface Dispositif {
  code: string;
  nom: string;
  financeur: string;
  description: string;
  piecesExigees: string[];
  modeDepot: string;
  lien?: string;
}

export interface Organisation {
  id: string;
  nom: string;
  sigle: string | null;
  rna: string | null;
  siren: string | null;
  siret: string | null;
  natureJuridique: string | null;
  adresse: string | null;
  codePostal: string | null;
  commune: string | null;
  dateCreation: string | null;
  niveau: 'PETITE' | 'GESTIONNAIRE' | 'RESEAU';
  moisClotureExercice: number;
  etapesFaites: string[];
  dateDerniereAG: string | null;
  dureeMandatMois: number;
}

export interface Espace {
  organisation: Organisation;
  classeur: LigneClasseur[];
  dossiers: Dossier[];
  chemin: { etapes: { numero: number; slug: string; titre: string; faite: boolean; verifiee: boolean }[]; faites: number; total: number; pourcentage: number };
  lundi: {
    perime: { typeCode: string; libelle: string; dateExpiration: string; jours: number; gravite: 'ROUGE' | 'AMBRE'; action: string }[];
    du: { dossierId: string; intitule: string; financeur: string; echeance: string; nature: 'DEPOT' | 'COMPTE_RENDU'; jours: number; gravite: 'ROUGE' | 'AMBRE' }[];
    enCours: { enEcriture: number; deposes: number; accordesAJustifier: number; refuses: number; reperes: number };
    manque: { typeCode: string; libelle: string; dossiers: number }[];
    cetteAnnee: { annee: number; obtenu: number; dossiersAccordes: number; dossiersDecides: number; tauxReussite: number | null; piecesPerimees: number; etapesFaites: number };
  };
  projet: Projet;
  vieStatutaire: VieStatutaire;
  repertoire: ResumeContacts;
  actions: ActionAssociation[];
  resumeActions: ResumeActions;
  budget: ResumeBudget;
  derniersMouvements: Mouvement[];
  ia?: { disponible: boolean };
  nbDocuments: number;
  configuration: { etapes: { code: string; libelle: string; faite: boolean; href: string }[]; faites: number; total: number; pourcentage: number };
  versionReferentiel: string;
  dispositifs: Dispositif[];
}

export function formaterEuros(n: number | null | undefined) {
  if (n === null || n === undefined) return 'Non renseigné';
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
}

export const LIBELLES_ETAT: Record<EtatDossier, string> = {
  REPERE: 'Repéré',
  EN_ECRITURE: 'En écriture',
  DEPOSE: 'Déposé',
  ACCORDE: 'Accordé, à justifier',
  REFUSE: 'Refusé',
  SOLDE: 'Soldé',
};

export const LIBELLES_SITUATION: Record<SituationPiece, string> = {
  DEDUITE: 'Prouvée par les répertoires',
  A_JOUR: 'À jour',
  BIENTOT_PERIMEE: 'Expire bientôt',
  PERIMEE: 'Périmée',
  MANQUANTE: 'À fournir',
};

export const CATEGORIES: Record<string, string> = {
  IDENTITE: "Pièces d'identité",
  GOUVERNANCE: "Vie de l'association",
  FINANCIER: 'Pièces financières',
  ASSURANCE: 'Assurance',
  AGREMENT: 'Agréments',
  RH: 'Employeur',
};

export function dateCourte(iso: string | null | undefined) {
  if (!iso) return 'Non renseigné';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? 'Non renseigné' : d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function pourInput(iso: string | null | undefined) {
  if (!iso) return '';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10);
}
