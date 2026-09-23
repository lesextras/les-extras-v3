'use client';

// L'ORGANIGRAMME, VERSION « UN COMPTE = UNE PERSONNE ».
//
// Le 23/09/2026, les niveaux (direction, responsable, salarié), les
// validations de titre et le découpage en services sortent du produit : Les
// Extras met une structure en relation avec des intervenants, il ne gère pas
// sa hiérarchie interne. Cet écran se contente donc de montrer QUI s'est
// rattaché à la même structure (même SIRET), avec le poste que chacun a
// déclaré. Rien n'est validé par personne : c'est un annuaire, pas un
// organigramme au sens RH.
//
// Les types ci-dessous restent le miroir de /organisation/organigramme, qui
// renvoie encore les regroupements de l'ancien modèle ; on les aplatit ici.
import * as React from 'react';
import Link from 'next/link';
import { Building2, ChevronRight, Landmark, Users } from 'lucide-react';

type Niveau = 'DIRECTION' | 'RESPONSABLE' | 'SALARIE';
type Origine = 'INVITATION' | 'RESPONSABLE' | 'DIRECTION' | 'LES_EXTRAS';

export interface PersonneOrg {
  membershipId: string;
  /** L'identifiant de la personne : c'est lui qui ouvre sa fiche. */
  userId?: string;
  nom: string;
  avatarUrl: string | null;
  poste: string | null;
  cadre: boolean;
  niveau: Niveau;
  niveauValide: boolean;
  rattachementVerifie: boolean;
  origineVerification: Origine | null;
  encadre: string[];
  /** Autre compte, même SIRET : sa fiche interne n'est pas consultable d'ici. */
  compteSepare?: boolean;
}

export interface ServiceOrg {
  id: string;
  nom: string;
  description: string | null;
  effectif: number;
  membres: PersonneOrg[];
  encadrants: PersonneOrg[];
  masques: number;
}

export interface DonneesOrganigramme {
  structure: {
    id: string;
    nom: string;
    formeJuridique: string | null;
    ville: string | null;
    verifiee: boolean;
  } | null;
  etablissement: { id: string; nom: string; ville: string | null; logoUrl: string | null };
  direction: PersonneOrg[];
  services: ServiceOrg[];
  sansService: PersonneOrg[];
  /** Les autres comptes qui ont déclaré la même structure (même SIRET). */
  collegues?: PersonneOrg[];
  perimetre: {
    niveau: Niveau;
    niveauValide: boolean;
    complet: boolean;
    servicesEncadres: string[];
  };
}

function initiales(nom: string) {
  return nom
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((m) => m[0]?.toUpperCase() ?? '')
    .join('');
}

/** Tout le monde, une seule fois, quel que soit le regroupement d'origine. */
function aplatir(donnees: DonneesOrganigramme): PersonneOrg[] {
  const vus = new Map<string, PersonneOrg>();
  const ajouter = (p: PersonneOrg) => {
    if (!vus.has(p.membershipId)) vus.set(p.membershipId, p);
  };
  donnees.direction.forEach(ajouter);
  donnees.services.forEach((s) => {
    s.encadrants.forEach(ajouter);
    s.membres.forEach(ajouter);
  });
  donnees.sansService.forEach(ajouter);
  (donnees.collegues ?? []).forEach(ajouter);
  return [...vus.values()].sort((a, b) => a.nom.localeCompare(b.nom, 'fr'));
}

export function Organigramme({ donnees }: { donnees: DonneesOrganigramme }) {
  const { structure, etablissement } = donnees;
  const personnes = React.useMemo(() => aplatir(donnees), [donnees]);
  const nom = structure?.nom ?? etablissement.nom;
  const ville = structure?.ville ?? etablissement.ville;

  return (
    <div className="space-y-6">
      {/* La structure */}
      <section className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-start gap-4">
          {etablissement.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={etablissement.logoUrl}
              alt=""
              className="size-12 rounded-xl border border-border object-cover"
            />
          ) : (
            <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Building2 className="size-6" aria-hidden />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-lg font-semibold text-foreground">{nom}</h2>
            <p className="text-sm text-muted-foreground">
              {[structure?.formeJuridique, ville].filter(Boolean).join(' · ') || 'Structure'}
              {' · '}
              {personnes.length} {personnes.length > 1 ? 'personnes' : 'personne'}
            </p>
            {structure ? (
              <p className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
                <Landmark className="size-3.5" aria-hidden />
                {structure.verifiee ? 'SIRET rattaché' : 'SIRET déclaré'}
              </p>
            ) : (
              <p className="mt-1 text-xs text-muted-foreground">
                Aucune structure rattachée pour l&apos;instant : indiquez votre SIRET depuis
                « Mon établissement ».
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Les personnes */}
      <section className="space-y-3">
        <h3 className="inline-flex items-center gap-2 text-sm font-medium text-foreground">
          <Users className="size-4" aria-hidden />
          Personnes rattachées
        </h3>
        {personnes.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
            Vous êtes pour l&apos;instant la seule personne rattachée à cette structure.
          </p>
        ) : (
          <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
            {personnes.map((p) => (
              <li key={p.membershipId} className="flex items-center gap-3 px-4 py-3">
                {p.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.avatarUrl} alt="" className="size-9 rounded-full object-cover" />
                ) : (
                  <div className="flex size-9 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
                    {initiales(p.nom)}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{p.nom}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {p.poste ?? 'Poste non renseigné'}
                    {p.cadre ? ' · cadre' : ''}
                  </p>
                </div>
                {p.userId && !p.compteSepare ? (
                  <Link
                    href={`/dashboard/equipe/${p.userId}`}
                    className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-primary hover:underline"
                  >
                    Voir la fiche
                    <ChevronRight className="size-3.5" aria-hidden />
                  </Link>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
