'use client';

import * as React from 'react';
import {
  BadgeCheck,
  Building2,
  ChevronDown,
  Crown,
  EyeOff,
  Landmark,
  ShieldQuestion,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';

/* ------------------------------------------------------------------------ */
/* Types — miroir de ce que renvoie /organisation/organigramme               */
/* ------------------------------------------------------------------------ */

type Niveau = 'DIRECTION' | 'RESPONSABLE' | 'SALARIE';
type Origine = 'INVITATION' | 'RESPONSABLE' | 'DIRECTION' | 'LES_EXTRAS';

export interface PersonneOrg {
  membershipId: string;
  nom: string;
  avatarUrl: string | null;
  poste: string | null;
  cadre: boolean;
  niveau: Niveau;
  /** Le TITRE est-il confirmé ? */
  niveauValide: boolean;
  /** L'APPARTENANCE au service est-elle attestée ? Rien de plus. */
  rattachementVerifie: boolean;
  origineVerification: Origine | null;
  encadre: string[];
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
  perimetre: {
    niveau: Niveau;
    niveauValide: boolean;
    complet: boolean;
    servicesEncadres: string[];
  };
}

/* ------------------------------------------------------------------------ */
/* Étiquettes                                                                */
/* ------------------------------------------------------------------------ */

const LIBELLE_NIVEAU: Record<Niveau, string> = {
  DIRECTION: 'Direction',
  RESPONSABLE: 'Responsable',
  SALARIE: 'Salarié',
};

const LIBELLE_ORIGINE: Record<Origine, string> = {
  INVITATION: 'invitation acceptée',
  RESPONSABLE: 'un responsable',
  DIRECTION: 'la direction',
  LES_EXTRAS: 'Les Extras',
};

function initiales(nom: string): string {
  return nom
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((m) => m[0]?.toUpperCase() ?? '')
    .join('');
}

/* ------------------------------------------------------------------------ */
/* La carte d'une personne                                                   */
/* ------------------------------------------------------------------------ */

function CartePersonne({ p, encadrant }: { p: PersonneOrg; encadrant?: boolean }) {
  return (
    <div
      className={cn(
        'flex items-start gap-2.5 rounded-lg border bg-card p-2.5 transition-colors',
        encadrant ? 'border-primary/45 bg-primary-soft/25' : 'border-border',
      )}
    >
      <span
        className={cn(
          'grid size-9 shrink-0 place-items-center overflow-hidden rounded-full text-xs font-semibold',
          encadrant ? 'bg-primary text-primary-foreground' : 'bg-accent text-accent-foreground',
        )}
        aria-hidden
      >
        {p.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={p.avatarUrl} alt="" className="size-full object-cover" />
        ) : (
          initiales(p.nom)
        )}
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
          <span className="truncate text-sm font-medium">{p.nom}</span>

          {/*
            LE BADGE PORTE SUR LE RATTACHEMENT, JAMAIS SUR LE TITRE.
            Le libellé le dit en toutes lettres au survol : « rattachement
            vérifié par… ». Un badge dont on ne sait pas ce qu'il atteste finit
            par tout attester dans l'esprit du lecteur.
          */}
          {p.rattachementVerifie ? (
            <span
              className="inline-flex items-center gap-1 rounded-full bg-primary-soft px-1.5 py-0.5 text-[10px] font-medium text-primary"
              title={`Rattachement vérifié${
                p.origineVerification ? ` par ${LIBELLE_ORIGINE[p.origineVerification]}` : ''
              }`}
            >
              <BadgeCheck aria-hidden className="size-3" />
              Rattachement vérifié
            </span>
          ) : (
            <span
              className="inline-flex items-center gap-1 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground"
              title="Cette personne s’est déclarée de l’établissement. Personne n’a encore confirmé son rattachement."
            >
              <ShieldQuestion aria-hidden className="size-3" />
              À confirmer
            </span>
          )}
        </div>

        <p className="truncate text-xs text-muted-foreground">
          {p.poste || LIBELLE_NIVEAU[p.niveau]}
          {p.cadre ? ' · cadre' : ''}
        </p>

        {/* LE NIVEAU EST AFFICHÉ À PART, avec sa propre marque. */}
        <p className="mt-0.5 text-[11px]">
          <span
            className={cn(
              'font-medium',
              p.niveau === 'DIRECTION' ? 'text-primary' : 'text-muted-foreground',
            )}
          >
            {LIBELLE_NIVEAU[p.niveau]}
          </span>
          <span className="text-muted-foreground">
            {' · '}
            {p.niveauValide ? 'validé' : 'déclaré'}
          </span>
        </p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------------ */
/* Le bloc d'un service                                                      */
/* ------------------------------------------------------------------------ */

function BlocService({ s, monService }: { s: ServiceOrg; monService: boolean }) {
  const [ouvert, setOuvert] = React.useState(true);
  const encadrantIds = new Set(s.encadrants.map((e) => e.membershipId));
  const autres = s.membres.filter((m) => !encadrantIds.has(m.membershipId));

  return (
    <div
      className={cn(
        'relative rounded-xl border-2 bg-card',
        monService ? 'border-primary/50 shadow-soft' : 'border-border',
      )}
    >
      {/* Le trait qui relie le service à l'établissement, au-dessus. */}
      <span
        aria-hidden
        className="absolute -top-4 left-1/2 hidden h-4 w-px -translate-x-1/2 bg-border lg:block"
      />

      <button
        type="button"
        onClick={() => setOuvert((v) => !v)}
        aria-expanded={ouvert}
        className="flex w-full items-start gap-2.5 rounded-t-[inherit] p-3.5 text-left"
      >
        <span
          className={cn(
            'grid size-9 shrink-0 place-items-center rounded-lg',
            monService ? 'bg-primary text-primary-foreground' : 'bg-accent text-accent-foreground',
          )}
          aria-hidden
        >
          <Users className="size-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold">{s.nom}</span>
          <span className="block text-xs text-muted-foreground">
            {s.effectif} personne{s.effectif > 1 ? 's' : ''}
            {monService ? ' · votre service' : ''}
          </span>
        </span>
        <ChevronDown
          aria-hidden
          className={cn(
            'mt-1 size-4 shrink-0 text-muted-foreground transition-transform',
            ouvert && 'rotate-180',
          )}
        />
      </button>

      {ouvert && (
        <div className="space-y-2 border-t border-border p-3.5 pt-3">
          {s.description && (
            <p className="text-xs text-muted-foreground" lang="fr">
              {s.description}
            </p>
          )}

          {s.encadrants.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-primary">
                Encadrement
              </p>
              {s.encadrants.map((p) => (
                <CartePersonne key={`enc-${p.membershipId}`} p={p} encadrant />
              ))}
            </div>
          )}

          {autres.length > 0 && (
            <div className="space-y-1.5">
              {s.encadrants.length > 0 && (
                <p className="pt-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Équipe
                </p>
              )}
              {autres.map((p) => (
                <CartePersonne key={p.membershipId} p={p} />
              ))}
            </div>
          )}

          {/*
            LES PERSONNES HORS PÉRIMÈTRE SONT COMPTÉES, PAS EFFACÉES.
            Sans cette ligne, un service de douze personnes dont on n'en voit
            aucune paraîtrait vide — et le lecteur en conclurait que personne
            ne s'est inscrit, au lieu de comprendre qu'il ne les voit pas.
          */}
          {s.masques > 0 && (
            <p className="flex items-center gap-1.5 rounded-lg bg-muted/60 px-2.5 py-2 text-xs text-muted-foreground">
              <EyeOff aria-hidden className="size-3.5 shrink-0" />
              {s.masques} personne{s.masques > 1 ? 's' : ''} hors de votre périmètre
            </p>
          )}

          {s.membres.length === 0 && s.masques === 0 && (
            <p className="rounded-lg bg-muted/60 px-2.5 py-2 text-xs text-muted-foreground">
              Personne n’est encore rattaché à ce service.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------------ */
/* L'organigramme                                                            */
/* ------------------------------------------------------------------------ */

export function Organigramme({ donnees }: { donnees: DonneesOrganigramme }) {
  const { structure, etablissement, direction, services, sansService, perimetre } = donnees;
  const mesServices = new Set(perimetre.servicesEncadres);
  const effectifTotal = services.reduce((n, s) => n + s.effectif, 0);

  return (
    <div className="space-y-5">
      {/* Ce que je vois, et pourquoi — dit d'emblée, pas découvert en bas. */}
      <div className="rounded-lg border border-border bg-muted/50 px-3.5 py-2.5 text-xs text-muted-foreground">
        {perimetre.complet ? (
          <>
            Vous voyez <strong className="text-foreground">tout l’établissement</strong> : votre
            niveau Direction est validé.
          </>
        ) : perimetre.niveau === 'RESPONSABLE' ? (
          <>
            Vous voyez les personnes des services que vous encadrez et celles que
            vous avez invitées. Le reste de l’établissement vous est compté, pas
            nommé.
          </>
        ) : (
          <>
            Vous voyez l’organisation de votre établissement et ses effectifs. Les
            noms de vos collègues apparaissent à mesure que vous rejoignez leurs
            services.
          </>
        )}
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* Niveau 1 — la structure                                           */}
      {/* ---------------------------------------------------------------- */}
      {structure && (
        <div className="relative">
          <div className="mx-auto max-w-md rounded-xl border-2 border-border bg-nacre p-4 text-center">
            <span className="mx-auto mb-2 grid size-10 place-items-center rounded-lg bg-accent text-accent-foreground">
              <Landmark aria-hidden className="size-5" />
            </span>
            <p className="text-sm font-semibold">{structure.nom}</p>
            <p className="text-xs text-muted-foreground">
              {[structure.formeJuridique, structure.ville].filter(Boolean).join(' · ') ||
                'Structure de rattachement'}
            </p>
            {structure.verifiee && (
              <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-primary-soft px-1.5 py-0.5 text-[10px] font-medium text-primary">
                <BadgeCheck aria-hidden className="size-3" />
                Entité vérifiée à l’annuaire public
              </span>
            )}
          </div>
          <span aria-hidden className="mx-auto block h-5 w-px bg-border" />
        </div>
      )}

      {/* ---------------------------------------------------------------- */}
      {/* Niveau 2 — l'établissement, et sa direction                       */}
      {/* ---------------------------------------------------------------- */}
      <div className="relative">
        <div className="mx-auto max-w-2xl rounded-xl border-2 border-primary/50 bg-primary-soft/30 p-4">
          <div className="flex items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center overflow-hidden rounded-lg bg-primary text-primary-foreground">
              {etablissement.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={etablissement.logoUrl} alt="" className="size-full object-cover" />
              ) : (
                <Building2 aria-hidden className="size-5" />
              )}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-base font-bold">{etablissement.nom}</p>
              <p className="text-xs text-muted-foreground">
                {[etablissement.ville, `${services.length} service${services.length > 1 ? 's' : ''}`,
                  `${effectifTotal} personne${effectifTotal > 1 ? 's' : ''}`]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
            </div>
          </div>

          {direction.length > 0 && (
            <div className="mt-3 space-y-1.5 border-t border-primary/25 pt-3">
              <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                <Crown aria-hidden className="size-3" />
                Direction
              </p>
              {direction.map((p) => (
                <CartePersonne key={p.membershipId} p={p} encadrant />
              ))}
            </div>
          )}

          {direction.length === 0 && (
            <p className="mt-3 rounded-lg border-t border-primary/25 bg-card/70 px-2.5 py-2 text-xs text-muted-foreground">
              Aucune direction validée pour l’instant. L’établissement fonctionne
              très bien sans : chaque responsable gère ses services.
            </p>
          )}
        </div>
        {services.length > 0 && (
          <span aria-hidden className="mx-auto block h-5 w-px bg-border" />
        )}
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* Niveau 3 — les services                                           */}
      {/* ---------------------------------------------------------------- */}
      {services.length > 0 ? (
        <>
          {/* Le trait horizontal qui relie les services entre eux, sur grand
              écran seulement : empilés sur téléphone, il ne relierait rien. */}
          <div aria-hidden className="mx-auto hidden h-px w-[80%] bg-border lg:block" />
          <div className="grid gap-4 pt-0 sm:grid-cols-2 lg:grid-cols-3 lg:pt-4">
            {services.map((s) => (
              <BlocService key={s.id} s={s} monService={mesServices.has(s.id)} />
            ))}
          </div>
        </>
      ) : (
        <div className="rounded-xl border-2 border-dashed border-border p-6 text-center">
          <p className="text-sm font-medium">Aucun service déclaré</p>
          <p className="mt-1 text-xs text-muted-foreground" lang="fr">
            Créez votre service — internat, pôle jour, SESSAD — puis invitez votre
            équipe. Vous n’avez besoin de l’autorisation de personne.
          </p>
        </div>
      )}

      {sansService.length > 0 && (
        <div className="rounded-xl border border-dashed border-border p-3.5">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Sans service
          </p>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {sansService.map((p) => (
              <CartePersonne key={p.membershipId} p={p} />
            ))}
          </div>
          <p className="mt-2 text-xs text-muted-foreground" lang="fr">
            Ces personnes se sont déclarées de l’établissement sans service. Elles
            n’apparaissent dans le planning de personne tant qu’elles ne sont pas
            rattachées.
          </p>
        </div>
      )}
    </div>
  );
}
