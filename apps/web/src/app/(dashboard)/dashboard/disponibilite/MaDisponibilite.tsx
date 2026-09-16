'use client';

import * as React from 'react';
import { Check, Eye, EyeOff, RefreshCw, TriangleAlert } from 'lucide-react';
import { apiRequest } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/toast';

type Interet = 'ATELIERS' | 'FORMATIONS' | 'RENFORT_CDD' | 'RENFORT_PERSONNALISE';

export interface EtatDisponibilite {
  interets: Interet[];
  disponibilite: {
    actif: boolean;
    montages: Interet[];
    metier: string | null;
    departements: string[];
    presentation: string | null;
    aPartirDu: string | null;
    confirmeeLe: string;
    enVeille: boolean;
  } | null;
  joursAvantVeille: number;
}

/**
 * ⚠ LES DEUX DERNIÈRES ACTIVITÉS SONT DEUX MONTAGES JURIDIQUES DIFFÉRENTS.
 *
 * Remplacer quelqu'un sur un poste ne se fait qu'en CDD salarié (CE
 * 11/02/2025, n° 491128). Intervenir en plus, sur un besoin nommé, est une
 * prestation facturée par la structure de l'intervenant. « Renfort » désigne
 * donc ici deux choses aux contrats opposés, et chaque case porte le sien :
 * un chef de service pressé ne lit pas, il clique.
 */
const ACTIVITES: { cle: Interet; titre: string; aide: string; montage?: string }[] = [
  {
    cle: 'ATELIERS',
    titre: 'Proposer des ateliers',
    aide: 'Votre fiche au catalogue, les demandes de devis vous arrivent ici.',
  },
  {
    cle: 'FORMATIONS',
    titre: 'Proposer des formations',
    aide: 'En intra, dans les établissements, ou au catalogue de l’association.',
  },
  {
    cle: 'RENFORT_CDD',
    titre: 'Faire des remplacements',
    aide: 'Un poste à couvrir, une absence : l’établissement vous embauche.',
    montage: 'CDD salarié',
  },
  {
    cle: 'RENFORT_PERSONNALISE',
    titre: 'Intervenir en renfort personnalisé',
    aide: 'Un besoin nommé, en plus de l’équipe : un accompagnement, un suivi individuel.',
    montage: 'Prestation facturée par votre structure',
  },
];

const MONTAGES: Interet[] = ['RENFORT_CDD', 'RENFORT_PERSONNALISE'];

export function MaDisponibilite({ etat }: { etat: EtatDisponibilite }) {
  const { toast } = useToast();
  const d = etat.disponibilite;

  const [interets, setInterets] = React.useState<Interet[]>(etat.interets);
  const [actif, setActif] = React.useState(d?.actif ?? false);
  const [metier, setMetier] = React.useState(d?.metier ?? '');
  const [departements, setDepartements] = React.useState((d?.departements ?? []).join(', '));
  const [presentation, setPresentation] = React.useState(d?.presentation ?? '');
  const [enVeille, setEnVeille] = React.useState(d?.enVeille ?? false);
  const [confirmeeLe, setConfirmeeLe] = React.useState(d?.confirmeeLe ?? null);
  const [envoi, setEnvoi] = React.useState(false);

  const proposeUnMontage = interets.some((i) => MONTAGES.includes(i));
  const visible = actif && !enVeille && proposeUnMontage;

  function bascule(cle: Interet) {
    setInterets((l) => (l.includes(cle) ? l.filter((c) => c !== cle) : [...l, cle]));
  }

  async function enregistrer() {
    setEnvoi(true);
    try {
      await apiRequest('/disponibilites/moi', {
        method: 'PATCH',
        body: {
          interets,
          ...(proposeUnMontage
            ? {
                actif,
                montages: interets.filter((i) => MONTAGES.includes(i)),
                metier: metier.trim(),
                departements: departements
                  .split(/[,;\s]+/)
                  .map((t) => t.trim())
                  .filter(Boolean),
                presentation: presentation.trim(),
              }
            : {}),
        },
      });
      // Toute modification vaut confirmation : quelqu'un qui vient de corriger
      // sa fiche est, par définition, toujours là.
      setEnVeille(false);
      setConfirmeeLe(new Date().toISOString());
      toast({ title: 'Enregistré', variant: 'success' });
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

  /**
   * ⚠ SE RETIRER N'EFFACE RIEN. Le métier, le territoire et la présentation
   * restent en place ; seule la visibilité s'éteint. Supprimer obligerait à
   * tout ressaisir pour revenir trois semaines plus tard.
   */
  async function seRetirer() {
    setEnvoi(true);
    try {
      await apiRequest('/disponibilites/moi', { method: 'DELETE' });
      setActif(false);
      toast({
        title: 'Vous n’apparaissez plus dans la liste',
        description: 'Vos informations sont conservées : un clic suffit pour revenir.',
        variant: 'success',
      });
    } catch {
      toast({ title: 'Nous n’avons pas pu vous retirer', variant: 'error' });
    } finally {
      setEnvoi(false);
    }
  }

  async function confirmer() {
    setEnvoi(true);
    try {
      await apiRequest('/disponibilites/moi/confirmer', { method: 'POST' });
      setEnVeille(false);
      setConfirmeeLe(new Date().toISOString());
      toast({ title: 'Disponibilité confirmée', variant: 'success' });
    } catch {
      toast({ title: 'Confirmation impossible', variant: 'error' });
    } finally {
      setEnvoi(false);
    }
  }

  return (
    <div className="space-y-5">
      {/* L'état, en une ligne, avant tout le reste. */}
      <div
        className={cn(
          'flex items-start gap-3 rounded-xl border-2 p-4',
          visible ? 'border-success/40 bg-success/5' : 'border-border bg-muted/40',
        )}
      >
        {visible ? (
          <Eye aria-hidden className="mt-0.5 size-5 shrink-0 text-success" />
        ) : (
          <EyeOff aria-hidden className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
        )}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">
            {visible
              ? 'Les établissements peuvent vous voir'
              : 'Vous n’apparaissez dans aucune liste'}
          </p>
          <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground" lang="fr">
            {enVeille
              ? `Votre fiche est en veille : elle n’a pas été confirmée depuis ${etat.joursAvantVeille} jours. Un clic la réactive.`
              : visible
                ? `Confirmée le ${formaterDate(confirmeeLe)}. Nous vous le redemanderons dans ${etat.joursAvantVeille} jours — une liste périmée fait perdre du temps à tout le monde.`
                : 'Cochez ce que vous acceptez de faire, puis rendez-vous visible.'}
          </p>
        </div>
        {enVeille && (
          <Button type="button" size="sm" variant="outline" loading={envoi} onClick={() => void confirmer()}>
            <RefreshCw />
            Je suis toujours disponible
          </Button>
        )}
      </div>

      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="text-sm font-semibold">Ce que vous acceptez de faire</h2>
        <p className="mt-1 text-xs text-muted-foreground" lang="fr">
          Plusieurs réponses possibles. C’est cette déclaration qui décide des
          demandes qui vous parviennent.
        </p>
        <div className="mt-3 space-y-2">
          {ACTIVITES.map((a) => {
            const coche = interets.includes(a.cle);
            return (
              <label
                key={a.cle}
                className={cn(
                  'flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors',
                  coche
                    ? 'border-primary bg-primary-soft/30'
                    : 'border-border bg-card hover:border-primary/40',
                )}
              >
                <input
                  type="checkbox"
                  checked={coche}
                  onChange={() => bascule(a.cle)}
                  className="mt-0.5 size-4 shrink-0 rounded border-input accent-[hsl(var(--primary))]"
                />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium">{a.titre}</span>
                  <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground" lang="fr">
                    {a.aide}
                  </span>
                  {a.montage && (
                    <span className="mt-1.5 inline-block rounded-full bg-secondary/10 px-2 py-0.5 text-[11px] font-semibold text-secondary">
                      {a.montage}
                    </span>
                  )}
                </span>
              </label>
            );
          })}
        </div>
      </section>

      {proposeUnMontage && (
        <section className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold">Être visible des établissements</h2>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground" lang="fr">
            Votre profil apparaît dans la liste que consultent les établissements
            qui cherchent quelqu’un. Ils vous écrivent ici ; vos coordonnées ne
            sont jamais affichées.
          </p>

          <label
            className={cn(
              'mt-3 flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors',
              actif ? 'border-primary bg-primary-soft/30' : 'border-border bg-card',
            )}
          >
            <input
              type="checkbox"
              checked={actif}
              onChange={() => setActif(!actif)}
              className="mt-0.5 size-4 shrink-0 rounded border-input accent-[hsl(var(--primary))]"
            />
            <span className="text-sm font-medium">
              Oui, affichez-moi dans la liste des personnes disponibles
            </span>
          </label>

          {actif && (
            <div className="mt-3 space-y-3">
              <div>
                <label htmlFor="metier" className="text-xs font-semibold">
                  Votre métier
                </label>
                <Input
                  id="metier"
                  value={metier}
                  onChange={(e) => setMetier(e.target.value)}
                  placeholder="Éducateur spécialisé, AES, moniteur-éducateur…"
                  className="mt-1"
                />
              </div>
              <div>
                <label htmlFor="departements" className="text-xs font-semibold">
                  Où vous pouvez vous déplacer
                </label>
                <Input
                  id="departements"
                  value={departements}
                  onChange={(e) => setDepartements(e.target.value)}
                  placeholder="77, 91, 94"
                  className="mt-1"
                />
                <p className="mt-1 text-xs text-muted-foreground" lang="fr">
                  Les numéros de département, séparés par des virgules.
                </p>
              </div>
              <div>
                <label htmlFor="presentation" className="text-xs font-semibold">
                  Deux lignes sur vous{' '}
                  <span className="font-normal text-muted-foreground">(facultatif)</span>
                </label>
                <Textarea
                  id="presentation"
                  value={presentation}
                  onChange={(e) => setPresentation(e.target.value)}
                  placeholder="Dix ans en MECS, habitué aux adolescents. Disponible en semaine."
                  className="mt-1 min-h-[72px]"
                  maxLength={600}
                />
                <p className="mt-1 text-xs text-muted-foreground" lang="fr">
                  Ce n’est pas un CV. N’y mettez ni téléphone ni adresse.
                </p>
              </div>
            </div>
          )}
        </section>
      )}

      {interets.includes('RENFORT_CDD') && (
        <div className="flex items-start gap-3 rounded-xl border border-secondary/35 bg-secondary/10 p-4">
          <TriangleAlert aria-hidden className="mt-0.5 size-4 shrink-0 text-secondary" />
          <p className="text-xs leading-relaxed" lang="fr">
            <strong>Les pièces à déposer dans votre compte.</strong> Votre pièce
            d’identité et votre bulletin n° 3 du casier judiciaire (art. L. 133-6
            du CASF). Sans elles, vous ne pouvez pas candidater à un
            remplacement.{' '}
            <a href="/dashboard/mon-dossier" className="font-semibold underline">
              Ouvrir mon dossier
            </a>
          </p>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {d?.actif && (
          <Button type="button" variant="ghost" loading={envoi} onClick={() => void seRetirer()}>
            <EyeOff />
            Me retirer de la liste
          </Button>
        )}
        <Button
          type="button"
          className="ml-auto"
          size="lg"
          loading={envoi}
          onClick={() => void enregistrer()}
        >
          <Check />
          Enregistrer
        </Button>
      </div>
    </div>
  );
}

function formaterDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}
