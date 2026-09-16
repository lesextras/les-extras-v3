'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { BadgeCheck, Building2, Mail, TriangleAlert, Users } from 'lucide-react';
import { apiRequest } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';

export interface DemandeNiveau {
  id: string;
  createdAt: string;
  justification: string | null;
  personne: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
    emailVerified: boolean;
    createdAt: string;
  };
  poste: string | null;
  cadre: boolean;
  etablissement: {
    id: string;
    name: string;
    city: string | null;
    siret: string | null;
    structure: { id: string; nom: string; siren: string | null; verifiee: boolean } | null;
    _count: { memberships: number };
  };
  services: { id: string; nom: string; portee: string }[];
  indices: {
    courrielVerifie: boolean;
    domaineCourriel: string;
    courrielGrandPublic: boolean;
    membresDejaDansLEtablissement: number;
    structureRenseignee: boolean;
  };
}

function Indice({
  bon,
  children,
}: {
  bon: boolean;
  children: React.ReactNode;
}) {
  return (
    <li
      className={cn(
        'flex items-start gap-1.5 text-xs',
        bon ? 'text-foreground' : 'text-muted-foreground',
      )}
    >
      <span
        aria-hidden
        className={cn(
          'mt-[5px] size-1.5 shrink-0 rounded-full',
          bon ? 'bg-primary' : 'bg-muted-foreground/40',
        )}
      />
      <span lang="fr">{children}</span>
    </li>
  );
}

export function DemandesNiveau({ demandes }: { demandes: DemandeNiveau[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [enCours, setEnCours] = React.useState<string | null>(null);
  const [motifs, setMotifs] = React.useState<Record<string, string>>({});

  async function decider(id: string, accepter: boolean) {
    setEnCours(id);
    try {
      await apiRequest(`/admin/organisation/demandes-niveau/${id}/decider`, {
        method: 'POST',
        body: { accepter, motifRefus: accepter ? undefined : motifs[id] || undefined },
      });
      toast({
        title: accepter ? 'Accès direction accordé' : 'Demande refusée',
        description: accepter
          ? 'Les personnes déjà rattachées à cet établissement en sont informées.'
          : 'La personne garde son compte et son périmètre actuel.',
        variant: 'success',
      });
      router.refresh();
    } catch (e) {
      toast({
        title: 'Action impossible',
        description: e instanceof Error ? e.message : 'Réessayez dans un instant.',
        variant: 'error',
      });
    } finally {
      setEnCours(null);
    }
  }

  return (
    <div className="space-y-4">
      {demandes.map((d) => {
        const nom =
          [d.personne.firstName, d.personne.lastName].filter(Boolean).join(' ').trim() ||
          d.personne.email;
        const domaineStructure =
          !d.indices.courrielGrandPublic && d.indices.domaineCourriel
            ? d.indices.domaineCourriel
            : null;

        return (
          <article key={d.id} className="rounded-xl border-2 border-border bg-card p-4">
            <header className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-base font-semibold">{nom}</p>
                <p className="text-sm text-muted-foreground">
                  {d.poste || 'Poste non renseigné'}
                  {d.cadre ? ' · cadre' : ' · non cadre'}
                </p>
                <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Mail aria-hidden className="size-3" />
                  {d.personne.email}
                </p>
              </div>
              <span className="shrink-0 text-xs text-muted-foreground">
                {new Date(d.createdAt).toLocaleDateString('fr-FR')}
              </span>
            </header>

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="flex items-center gap-1.5 text-xs font-semibold">
                  <Building2 aria-hidden className="size-3.5" />
                  Établissement
                </p>
                <p className="mt-1 text-sm font-medium">{d.etablissement.name}</p>
                <p className="text-xs text-muted-foreground">
                  {[d.etablissement.city, d.etablissement.siret ? `SIRET ${d.etablissement.siret}` : null]
                    .filter(Boolean)
                    .join(' · ') || 'Aucune coordonnée renseignée'}
                </p>
                {d.etablissement.structure && (
                  <p className="mt-1 flex items-center gap-1 text-xs">
                    {d.etablissement.structure.verifiee && (
                      <BadgeCheck aria-hidden className="size-3 text-primary" />
                    )}
                    {d.etablissement.structure.nom}
                    {d.etablissement.structure.siren
                      ? ` · SIREN ${d.etablissement.structure.siren}`
                      : ''}
                  </p>
                )}
                {d.services.length > 0 && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Services : {d.services.map((s) => s.nom).join(', ')}
                  </p>
                )}
              </div>

              <div className="rounded-lg bg-muted/50 p-3">
                <p className="flex items-center gap-1.5 text-xs font-semibold">
                  <Users aria-hidden className="size-3.5" />
                  Ce que l’acceptation ouvre
                </p>
                <p className="mt-1 text-xs text-muted-foreground" lang="fr">
                  La vue sur{' '}
                  <strong className="text-foreground">
                    {d.indices.membresDejaDansLEtablissement} compte
                    {d.indices.membresDejaDansLEtablissement > 1 ? 's' : ''}
                  </strong>{' '}
                  de cet établissement, y compris ceux constitués par d’autres
                  avant elle. Ces personnes en seront informées.
                </p>
                <ul className="mt-2 space-y-1">
                  <Indice bon={d.indices.courrielVerifie}>
                    {d.indices.courrielVerifie
                      ? 'Adresse confirmée'
                      : 'Adresse non confirmée'}
                  </Indice>
                  <Indice bon={Boolean(domaineStructure)}>
                    {domaineStructure
                      ? `Courriel professionnel (${domaineStructure})`
                      : 'Adresse grand public — fréquent dans les petites structures, ce n’est pas un motif de refus à soi seul'}
                  </Indice>
                  <Indice bon={d.indices.structureRenseignee}>
                    {d.indices.structureRenseignee
                      ? 'Structure juridique déclarée'
                      : 'Aucune structure déclarée'}
                  </Indice>
                </ul>
              </div>
            </div>

            {d.justification && (
              <p className="mt-3 rounded-lg border border-border p-2.5 text-xs" lang="fr">
                {d.justification}
              </p>
            )}

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Button
                type="button"
                loading={enCours === d.id}
                onClick={() => decider(d.id, true)}
              >
                Accorder l’accès direction
              </Button>
              <Input
                value={motifs[d.id] ?? ''}
                onChange={(e) => setMotifs((m) => ({ ...m, [d.id]: e.target.value }))}
                placeholder="Motif du refus (facultatif)"
                className="max-w-xs"
              />
              <Button
                type="button"
                variant="outline"
                disabled={enCours === d.id}
                onClick={() => decider(d.id, false)}
              >
                Refuser
              </Button>
            </div>

            <p className="mt-2 flex items-start gap-1.5 text-[11px] text-muted-foreground">
              <TriangleAlert aria-hidden className="mt-0.5 size-3 shrink-0" />
              <span lang="fr">
                En cas de doute, refusez avec un motif : la personne garde son
                compte, son équipe et son périmètre, et peut redemander. Un refus
                ne coûte rien ; un accès accordé à tort ouvre les demandes de
                toute une maison.
              </span>
            </p>
          </article>
        );
      })}
    </div>
  );
}
