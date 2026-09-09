/** Ce que l'API renvoie pour la boutique. Un seul endroit pour les formes. */

export type NatureProduit = 'REEL' | 'VIRTUEL';
export type StatutProduit = 'BROUILLON' | 'PUBLIE' | 'ARCHIVE';
export type StatutCommande =
  | 'PAYEE'
  | 'PREPAREE'
  | 'EXPEDIEE'
  | 'REMISE'
  | 'ANNULEE'
  | 'REMBOURSEE';

export interface Vitrine {
  nom: string;
  slug: string;
  sousTitre: string | null;
  presentation: string | null;
  logoUrl: string | null;
  banniereUrl: string | null;
  couleur: string;
  contactEmail: string | null;
  cgv: string | null;
  mentions: string | null;
  livraisonTexte: string | null;
  publiee: boolean;
}

export interface Produit {
  id: string;
  titre: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  nature: NatureProduit;
  prixCents: number;
  prixBarreCents: number | null;
  tvaPourcent: number;
  stock: number | null;
  livraisonCents: number;
  fichierUrl: string | null;
  lienUrl: string | null;
  statut: StatutProduit;
  ordre: number;
}

export interface LigneCommande {
  id: string;
  titre: string;
  nature: NatureProduit;
  prixCents: number;
  quantite: number;
  remisUrl: string | null;
}

export interface Commande {
  id: string;
  email: string;
  nom: string | null;
  telephone: string | null;
  adresse: string | null;
  codePostal: string | null;
  ville: string | null;
  pays: string | null;
  totalCents: number;
  fraisPortCents: number;
  statut: StatutCommande;
  note: string | null;
  createdAt: string;
  lignes: LigneCommande[];
}

export interface EtatStripe {
  relie: boolean;
  pret: boolean;
  compteId: string | null;
  versementsActifs: boolean;
  paiementsActifs: boolean;
  aFournir: string[];
  commissionVentePourcent: number;
}

export const LIBELLE_STATUT_COMMANDE: Record<StatutCommande, string> = {
  PAYEE: 'Payée',
  PREPAREE: 'Préparée',
  EXPEDIEE: 'Expédiée',
  REMISE: 'Remise',
  ANNULEE: 'Annulée',
  REMBOURSEE: 'Remboursée',
};

export function euros(cents: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(
    cents / 100,
  );
}
