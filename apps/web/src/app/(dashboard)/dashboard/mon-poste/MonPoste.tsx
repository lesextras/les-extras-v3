'use client';

import * as React from 'react';
import { BadgeCheck, Check, Clock, EyeOff, ShieldQuestion, TriangleAlert } from 'lucide-react';
import { apiRequest } from '@/lib/api';
import { groupesDroitsProposes } from '@/lib/droits';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';

type Niveau = 'DIRECTION' | 'RESPONSABLE' | 'SALARIE';
type Origine = 'INVITATION' | 'RESPONSABLE' | 'DIRECTION' | 'LES_EXTRAS';

export interface MaFiche {
  id: string;
  etablissement: {
    id: string;
    name: string;
    city: string | null;
    structure: { id: string; nom: string; verifiee: boolean } | null;
  };
  poste: string | null;
  cadre: boolean;
  niveau: Niveau;
  niveauValide: boolean;
  verifie: boolean;
  origineVerification: Origine | null;
  verifiePar: { firstName: string | null; lastName: string | null } | null;
  masqueOrganigramme: boolean;
  capacites: string[];
  capacitesAccordees: string[];
  services: { id: string; nom: string; portee: 'RATTACHEMENT' | 'ENCADREMENT' }[];
  demandeNiveau: { statut: 'EN_ATTENTE' | 'ACCEPTEE' | 'REFUSEE'; motifRefus: string | null } | null;
}

const NIVEAUX: { cle: Niveau; titre: string; exemples: string; ceQueCaDonne: string; valide: boolean }[] = [
  {
    cle: 'DIRECTION',
    titre: 'Direction',
    exemples: 'Directeur, directrice adjointe, pilote des opérations',
    ceQueCaDonne: 'Tous les services, tous les salariés de l’établissement, et tous les droits.',
    valide: true,
  },
  {
    cle: 'RESPONSABLE',
    titre: 'Responsable',
    exemples: 'Chef de service, coordinateur',
    ceQueCaDonne:
      'Les personnes des services que vous encadrez. Vous invitez votre équipe et lui accordez des droits, sans attendre personne.',
    valide: false,
  },
  {
    cle: 'SALARIE',
    titre: 'Salarié',
    exemples: 'Éducateur, moniteur, AES, veilleur, psychologue…',
    ceQueCaDonne: 'Vos demandes, votre planning, vos inscriptions.',
    valide: false,
  },
];


const LIBELLE_ORIGINE: Record<Origine, string> = {
  INVITATION: 'votre invitation acceptée',
  RESPONSABLE: 'un responsable',
  DIRECTION: 'la direction',
  LES_EXTRAS: 'Les Extras',
};

/** Une question, une carte — même découpage que l'étape d'inscription. */
function Carte({ titre, children }: { titre: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-border bg-card p-4">
      <h3 className="text-sm font-semibold">{titre}</h3>
      <div className="mt-3">{children}</div>
    </section>
  );
}

export function MonPoste({ fiche }: { fiche: MaFiche }) {
  const { toast } = useToast();
  const [poste, setPoste] = React.useState(fiche.poste ?? '');
  const [cadre, setCadre] = React.useState(fiche.cadre);
  const [niveau, setNiveau] = React.useState<Niveau>(fiche.niveau);
  const [droits, setDroits] = React.useState<string[]>(fiche.capacitesAccordees ?? []);
  const [masque, setMasque] = React.useState(fiche.masqueOrganigramme);
  const [envoi, setEnvoi] = React.useState(false);

  const choisi = NIVEAUX.find((n) => n.cle === niveau)!;
  const demandeEnCours = fiche.demandeNiveau?.statut === 'EN_ATTENTE';

  async function enregistrer() {
    setEnvoi(true);
    try {
      const r = await apiRequest<{ demandeDirectionEnvoyee: boolean }>('/organisation/moi', {
        method: 'PATCH',
        body: {
          poste: poste.trim() || undefined,
          cadre,
          niveau,
          capacites: droits,
          justification:
            niveau === 'DIRECTION' ? `${poste.trim() || 'Direction'}${cadre ? ' (cadre)' : ''}` : undefined,
        },
      });
      toast({
        title: 'Enregistré',
        description: r.demandeDirectionEnvoyee
          ? 'Votre demande de niveau Direction est partie à Les Extras.'
          : 'Votre fiche est à jour.',
        variant: 'success',
      });
    } catch (e) {
      toast({
        title: 'Enregistrement impossible',
        description: e instanceof Error ? e.message : 'Réessayez dans un instant.',
        variant: 'error',
      });
    } finally {
      setEnvoi(false);
    }
  }

  async function basculerVisibilite(valeur: boolean) {
    setMasque(valeur);
    await apiRequest('/organisation/moi/visibilite', {
      method: 'PATCH',
      body: { masque: valeur },
    }).catch(() => setMasque(!valeur));
  }

  return (
    <div className="space-y-5">
      {/* L'état du rattachement, dit d'emblée. */}
      <div
        className={cn(
          'flex items-start gap-3 rounded-xl border-2 p-4',
          fiche.verifie ? 'border-primary/40 bg-primary-soft/30' : 'border-secondary/40 bg-secondary/10',
        )}
      >
        {fiche.verifie ? (
          <BadgeCheck aria-hidden className="mt-0.5 size-5 shrink-0 text-primary" />
        ) : (
          <ShieldQuestion aria-hidden className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
        )}
        <div className="min-w-0 flex-1 text-sm">
          <p className="font-semibold">
            {fiche.verifie ? 'Rattachement vérifié' : 'Rattachement à confirmer'}
          </p>
          <p className="mt-0.5 text-muted-foreground" lang="fr">
            {fiche.verifie ? (
              <>
                Votre appartenance à {fiche.etablissement.name} est attestée
                {fiche.origineVerification ? ` par ${LIBELLE_ORIGINE[fiche.origineVerification]}` : ''}.
                {' '}Cela confirme que vous travaillez ici, pas votre titre, qui se
                déclare ci-dessous.
              </>
            ) : (
              <>
                Vous vous êtes déclaré de {fiche.etablissement.name}. Un responsable
                doit le confirmer : d’ici là, vous apparaissez dans l’organigramme
                avec la mention « à confirmer » et n’accédez à aucune donnée de
                l’établissement.
              </>
            )}
          </p>
          {fiche.services.length > 0 && (
            <p className="mt-1.5 flex flex-wrap gap-1.5">
              {fiche.services.map((s) => (
                <span
                  key={`${s.id}-${s.portee}`}
                  className="rounded-full bg-card px-2 py-0.5 text-[11px] font-medium"
                >
                  {s.nom}
                  <span className="text-muted-foreground">
                    {s.portee === 'ENCADREMENT' ? ' · encadre' : ''}
                  </span>
                </span>
              ))}
            </p>
          )}
        </div>
      </div>

      {demandeEnCours && (
        <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/50 p-3.5 text-sm">
          <Clock aria-hidden className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          <p className="text-muted-foreground" lang="fr">
            Votre demande de niveau Direction est en cours d’examen par Les Extras.
            En attendant, votre compte fonctionne normalement, vous n’avez
            simplement pas encore la vue sur l’ensemble de l’établissement.
          </p>
        </div>
      )}

      {fiche.demandeNiveau?.statut === 'REFUSEE' && (
        <div className="flex items-start gap-3 rounded-lg border border-secondary/40 bg-secondary/10 p-3.5 text-sm">
          <TriangleAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
          <p className="text-muted-foreground" lang="fr">
            Votre demande de niveau Direction n’a pas été retenue.
            {fiche.demandeNiveau.motifRefus ? ` Motif : ${fiche.demandeNiveau.motifRefus}` : ''}{' '}
            Vous pouvez la renouveler en enregistrant à nouveau cette fiche.
          </p>
        </div>
      )}

      {/*
        LE POSTE ET LE STATUT CADRE SUR LA MÊME LIGNE.
        Les deux répondent à une seule question, et « cadre » n'a de sens que
        rapporté à l'intitulé qui le précède. Sur deux lignes, ils se lisaient
        comme deux sujets distincts. Identique à l'étape d'inscription : ces
        deux écrans portent le même formulaire et ne doivent pas diverger.
      */}
      <Carte titre="Votre poste">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
          <div className="min-w-0 flex-1">
            <Input
              id="poste"
              value={poste}
              onChange={(e) => setPoste(e.target.value)}
              placeholder="Chef de service éducatif, monitrice-éducatrice…"
              autoComplete="organization-title"
            />
          </div>
          {/* Case à cocher déguisée en bouton : `sr-only` la masque à l'œil
              sans la retirer du DOM, donc l'état reste lisible par un lecteur
              d'écran. Ce n'est pas un `<button>`. */}
          <label
            className={cn(
              'flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-lg border-2 px-4 py-2.5 text-sm font-medium transition-colors sm:h-[2.75rem]',
              cadre
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-card hover:border-primary/40',
            )}
          >
            <input
              type="checkbox"
              checked={cadre}
              onChange={(e) => setCadre(e.target.checked)}
              className="sr-only"
            />
            {cadre ? (
              <Check aria-hidden className="size-4" />
            ) : (
              <span aria-hidden className="size-4 rounded border border-current opacity-50" />
            )}
            Je suis cadre
          </label>
        </div>
      </Carte>

      <Carte titre="Votre niveau de responsabilité">
      <fieldset className="space-y-2">
        <legend className="sr-only">Votre niveau de responsabilité</legend>
        {NIVEAUX.map((n) => {
          const actif = niveau === n.cle;
          return (
            <label
              key={n.cle}
              className={cn(
                'flex cursor-pointer gap-3 rounded-lg border-2 p-3 transition-colors',
                actif ? 'border-primary bg-primary-soft/40' : 'border-border bg-card hover:border-primary/40',
              )}
            >
              <input
                type="radio"
                name="niveau"
                checked={actif}
                onChange={() => setNiveau(n.cle)}
                className="mt-0.5 size-4 shrink-0 border-input text-primary focus-visible:ring-2 focus-visible:ring-ring"
              />
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-1.5">
                  <span className="text-sm font-semibold">{n.titre}</span>
                  {fiche.niveau === n.cle && (
                    <span
                      className={cn(
                        'rounded-full px-1.5 py-0.5 text-[10px] font-medium',
                        fiche.niveauValide
                          ? 'bg-primary-soft text-primary'
                          : 'bg-muted text-muted-foreground',
                      )}
                    >
                      {fiche.niveauValide ? 'validé' : 'déclaré'}
                    </span>
                  )}
                </span>
                <span className="block text-xs text-muted-foreground">{n.exemples}</span>
                <span className="mt-1 block text-xs leading-relaxed" lang="fr">
                  {n.ceQueCaDonne}
                </span>
              </span>
            </label>
          );
        })}
      </fieldset>

      {choisi.valide && !fiche.niveauValide && (
        <div className="rounded-lg border border-secondary/40 bg-secondary/10 p-3.5 text-xs leading-relaxed text-muted-foreground">
          <p className="mb-1 flex items-center gap-1.5 font-semibold text-foreground">
            <TriangleAlert aria-hidden className="size-3.5" />
            Ce niveau est validé par Les Extras
          </p>
          <span lang="fr">
            La direction est le seul niveau qui donne la vue sur des équipes que
            vous n’avez pas constituées vous-même : nous le vérifions à la main.
            En attendant, votre compte fonctionne comme celui d’un salarié.
          </span>
        </div>
      )}
      </Carte>

      <Carte titre="Ce que vous pouvez engager pour votre établissement">
      <fieldset className="space-y-2">
        <legend className="sr-only">Ce que vous pouvez engager</legend>
        <p className="text-xs leading-relaxed text-muted-foreground" lang="fr">
          Ces réponses sont déclaratives. Elles décident notamment si votre bouton
          dit « Réserver » ou « Demander un devis », et elles figurent sur les
          demandes que vous émettez, avec votre poste. C’est ce qui permet à
          votre établissement de savoir qui a engagé quoi. Il n’y a aucun paiement
          sur la plateforme : elles n’engagent jamais d’argent.
        </p>
        <div className="space-y-4 pt-1">
          {groupesDroitsProposes().map((groupe) => (
            <div key={groupe.titre}>
              <p
                className={cn(
                  'mb-1 text-xs font-semibold uppercase tracking-wide',
                  groupe.sensible ? 'text-secondary' : 'text-muted-foreground',
                )}
              >
                {groupe.titre}
              </p>
              {groupe.intro && (
                <p className="mb-1.5 text-xs leading-relaxed text-muted-foreground" lang="fr">
                  {groupe.intro}
                </p>
              )}
              <div className="space-y-1.5">
                {groupe.droits.map((d) => {
                  const coche = droits.includes(d.cle);
                  return (
                    <label
                      key={d.cle}
                      className={cn(
                        'flex cursor-pointer items-start gap-2.5 rounded-lg border p-2.5 transition-colors',
                        coche
                          ? 'border-primary/50 bg-primary-soft/30'
                          : groupe.sensible
                            ? 'border-secondary/30 bg-card hover:border-secondary/60'
                            : 'border-border bg-card hover:border-primary/40',
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={coche}
                        onChange={(e) =>
                          setDroits((v) =>
                            e.target.checked ? [...v, d.cle] : v.filter((x) => x !== d.cle),
                          )
                        }
                        className="mt-0.5 size-4 shrink-0 rounded border-input text-primary focus-visible:ring-2 focus-visible:ring-ring"
                      />
                      <span className="min-w-0">
                        <span className="block text-sm leading-snug">{d.libelle}</span>
                        <span className="block text-xs text-muted-foreground">{d.aide}</span>
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </fieldset>
      </Carte>

      {/*
        LE RETRAIT DE L'ORGANIGRAMME.
        Certaines personnes ont de vraies raisons de ne pas figurer dans un
        annuaire professionnel. On ne leur fait pas payer ce choix par une perte
        de fonctionnalité : elles gardent tout le reste du produit.
      */}
      <label className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-border bg-card p-3">
        <input
          type="checkbox"
          checked={masque}
          onChange={(e) => basculerVisibilite(e.target.checked)}
          className="mt-0.5 size-4 shrink-0 rounded border-input text-primary focus-visible:ring-2 focus-visible:ring-ring"
        />
        <span className="min-w-0">
          <span className="flex items-center gap-1.5 text-sm">
            <EyeOff aria-hidden className="size-3.5" />
            Ne pas me faire figurer dans l’organigramme
          </span>
          <span className="block text-xs text-muted-foreground" lang="fr">
            Votre nom n’apparaîtra pour personne. Vous gardez l’intégralité du
            reste : vos demandes, votre planning, vos inscriptions.
          </span>
        </span>
      </label>

      <Button type="button" className="w-full" size="lg" loading={envoi} onClick={enregistrer}>
        Enregistrer
      </Button>
    </div>
  );
}
