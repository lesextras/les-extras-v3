'use client';

import * as React from 'react';
import Link from 'next/link';
import { FileCheck, MapPin, MessageSquare, Search, UserRound } from 'lucide-react';
import { renfortSalarieVisible } from '@/lib/offre';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export interface PersonneDisponible {
  id: string;
  accountId: string;
  nom: string;
  slug: string;
  logoUrl: string | null;
  /** Calculé par le serveur — voir `LIBELLE_MONTAGE`. */
  montages: { cle: string; libelle: string }[];
  metier: string | null;
  departements: string[];
  territoire: string | null;
  presentation: string | null;
  aPartirDu: string | null;
  confirmeeLe: string;
  /**
   * Les pièces déposées dans le compte de la personne — le compte, jamais le
   * contenu. Savoir que les papiers sont prêts évite de découvrir trois
   * semaines de relances après l'accord ; ouvrir les pièces à quiconque
   * feuillette la liste ferait de cet écran un fichier de documents d'identité.
   */
  dossier: { deposees: number; total: number; complet: boolean };
}

const FILTRES: { cle: string; libelle: string }[] = [
  { cle: 'TOUS', libelle: 'Tout' },
  { cle: 'RENFORT_CDD', libelle: 'Remplacement · CDD' },
  { cle: 'RENFORT_PERSONNALISE', libelle: 'Renfort personnalisé' },
];

/**
 * Les onglets réellement affichés.
 *
 * Le renfort de poste sort de l'offre publique le 19/09/2026 (`@/lib/offre`) :
 * on cesse de proposer l'onglet qui trie par ce montage. « Tout » continue de
 * montrer les personnes qui l'ont déclaré, et leur pastille reste sur la
 * carte — on masque une invitation, pas une donnée.
 */
function filtresProposes() {
  if (renfortSalarieVisible()) return FILTRES;
  return FILTRES.filter((f) => f.cle !== 'RENFORT_CDD');
}

export function VivierOuvert({ personnes }: { personnes: PersonneDisponible[] }) {
  const [montage, setMontage] = React.useState('TOUS');
  const [recherche, setRecherche] = React.useState('');

  /**
   * ⚠ LE FILTRAGE SE FAIT ICI, PAS PAR UN ALLER-RETOUR SERVEUR. La liste est
   * bornée à deux cents lignes côté API : un filtre local répond
   * instantanément, et surtout il permet de revenir en arrière sans perdre ce
   * qu'on avait trouvé.
   */
  const visibles = personnes.filter((p) => {
    if (montage !== 'TOUS' && !p.montages.some((m) => m.cle === montage)) return false;
    const q = recherche.trim().toLowerCase();
    if (!q) return true;
    return [p.nom, p.metier, p.territoire, p.presentation]
      .filter(Boolean)
      .some((t) => (t as string).toLowerCase().includes(q));
  });

  if (personnes.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border p-8 text-center">
        <UserRound aria-hidden className="mx-auto size-8 text-muted-foreground" />
        <p className="mt-3 text-sm font-semibold">Personne ne s’est encore déclaré</p>
        <p className="mx-auto mt-1 max-w-md text-xs leading-relaxed text-muted-foreground" lang="fr">
          Cette liste se remplit avec le temps. En attendant, publiez votre
          besoin : il part à votre équipe, puis à votre réseau, puis au réseau
          Les Extras.
        </p>
        <Button asChild className="mt-4" size="sm">
          <Link href="/dashboard/renforts">Publier un besoin</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {filtresProposes().map((f) => (
          <button
            key={f.cle}
            type="button"
            onClick={() => setMontage(f.cle)}
            className={cn(
              'rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors',
              montage === f.cle
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-card text-muted-foreground hover:border-primary/40',
            )}
          >
            {f.libelle}
          </button>
        ))}
        <Input
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          placeholder="Métier, département, mot-clé…"
          leftIcon={<Search />}
          className="ml-auto w-full sm:w-64"
        />
      </div>

      <p className="text-xs text-muted-foreground">
        {visibles.length} personne{visibles.length > 1 ? 's' : ''} sur {personnes.length}
      </p>

      <div className="grid gap-3 md:grid-cols-2">
        {visibles.map((p) => (
          <article key={p.id} className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-start gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-accent text-accent-foreground">
                <UserRound className="size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{p.nom}</p>
                {p.metier && (
                  <p className="truncate text-xs text-muted-foreground">{p.metier}</p>
                )}
              </div>
            </div>

            {/*
              ⚠ LE MONTAGE EST AFFICHÉ SUR CHAQUE PERSONNE, jamais déduit d'un
              onglet. Un chef de service pressé ne lit pas l'en-tête de la
              colonne : il regarde la carte et il clique.
            */}
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {p.montages.map((m) => (
                <span
                  key={m.cle}
                  className={cn(
                    'rounded-full px-2 py-0.5 text-[11px] font-semibold',
                    m.cle === 'RENFORT_CDD'
                      ? 'bg-primary/10 text-primary'
                      : 'bg-secondary/10 text-secondary',
                  )}
                >
                  {m.libelle}
                </span>
              ))}
            </div>

            <p
              className={cn(
                'mt-2.5 flex items-center gap-1.5 text-xs font-medium',
                p.dossier.complet ? 'text-success' : 'text-muted-foreground',
              )}
            >
              <FileCheck aria-hidden className="size-3.5 shrink-0" />
              {p.dossier.complet
                ? 'Dossier déposé — identité et bulletin n° 3'
                : `Dossier ${p.dossier.deposees}/${p.dossier.total} — ne peut pas encore candidater`}
            </p>

            {p.territoire && (
              <p className="mt-2.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                <MapPin aria-hidden className="size-3.5 shrink-0" />
                <span className="truncate">{p.territoire}</span>
              </p>
            )}

            {p.presentation && (
              <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-muted-foreground" lang="fr">
                {p.presentation}
              </p>
            )}

            <div className="mt-3 flex items-center justify-between gap-2">
              <span className="text-[11px] text-muted-foreground">
                Confirmée le {formaterDate(p.confirmeeLe)}
              </span>
              {/*
                ⚠ ON ÉCRIT PAR LA MESSAGERIE, ET IL N'Y A PAS D'AUTRE CHEMIN.
                Aucune coordonnée ne sort de cette liste : elles s'ouvrent quand
                la demande est confirmée. Un bouton « appeler » ici ferait sortir
                les échanges de la plateforme en une après-midi.
              */}
              <Button asChild size="sm" variant="outline">
                <Link href={`/dashboard/inbox?intervenant=${p.accountId}`}>
                  <MessageSquare />
                  Écrire
                </Link>
              </Button>
            </div>
          </article>
        ))}
      </div>

      {visibles.length === 0 && (
        <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground" lang="fr">
          Aucun résultat avec ces filtres. Élargissez, ou publiez votre besoin —
          il touchera aussi des personnes qui ne figurent pas dans cette liste.
        </p>
      )}
    </div>
  );
}

function formaterDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}
