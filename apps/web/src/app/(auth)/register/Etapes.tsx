'use client';

import * as React from 'react';
import {
  Landmark,
  Loader2,
  Search,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { apiRequest } from '@/lib/api';
import { lancerConfettis } from '@/lib/confetti';
import { renfortSalarieVisible } from '@/lib/offre';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

/* ------------------------------------------------------------------------ */
/* Outils communs                                                            */
/* ------------------------------------------------------------------------ */

/**
 * Attente avant d'interroger le serveur.
 *
 * ⚠ 350 ms, pas moins : l'annuaire public des entreprises est lent et limité
 * en débit. Une requête par frappe le ferait répondre en erreur au bout de
 * trois mots, et la recherche paraîtrait cassée alors qu'elle serait
 * simplement trop bavarde.
 */
function useValeurRetardee<T>(valeur: T, delai = 350): T {
  const [retardee, setRetardee] = React.useState(valeur);
  React.useEffect(() => {
    const t = setTimeout(() => setRetardee(valeur), delai);
    return () => clearTimeout(t);
  }, [valeur, delai]);
  return retardee;
}

function Aide({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs leading-relaxed text-muted-foreground" lang="fr">
      {children}
    </p>
  );
}

function Encart({
  ton = 'neutre',
  icone: Icone,
  titre,
  children,
}: {
  ton?: 'neutre' | 'alerte' | 'succes';
  icone?: React.ElementType;
  titre?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        'rounded-lg border p-3 text-xs leading-relaxed',
        ton === 'alerte' && 'border-secondary/35 bg-secondary/10',
        ton === 'succes' && 'border-primary/35 bg-primary-soft/40',
        ton === 'neutre' && 'border-border bg-muted/50',
      )}
    >
      {titre && (
        <p className="mb-1 flex items-center gap-1.5 font-semibold">
          {Icone && <Icone aria-hidden className="size-3.5 shrink-0" />}
          {titre}
        </p>
      )}
      <div className="text-muted-foreground" lang="fr">
        {children}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------------ */
/* La structure juridique : l'organisme gestionnaire ou l'entité qui facture */
/* ------------------------------------------------------------------------ */

interface EntiteLegale {
  nom: string;
  sigle: string | null;
  siren: string;
  /** Le numéro que les gens ont sous la main : il est sur leurs factures. */
  siret: string | null;
  formeJuridique: string | null;
  adresse: string | null;
  ville: string | null;
  codePostal: string | null;
}

interface StructureDeclaree {
  id: string;
  nom: string;
  siren: string | null;
  siret?: string | null;
  formeJuridique: string | null;
  ville: string | null;
  verifiee: boolean;
  _count?: { comptes: number };
}

/**
 * CE QUE L'ÉCRAN DES IDENTIFIANTS RAMÈNE EN PLUS DU COMPTE : la structure
 * juridique (organisme gestionnaire d'un établissement, entité qui facture
 * pour un intervenant).
 *
 * Elle ne fait AUCUNE écriture : le compte n'existe pas encore. Elle collecte,
 * et la page applique juste après la création.
 */
export interface LieuDeTravail {
  /** Structure déjà déclarée sur la plateforme. */
  structureId: string | null;
  /** Structure venue de l'annuaire, ou saisie à la main. */
  structure: StructureChoisie | null;
}

export const LIEU_VIDE: LieuDeTravail = {
  structureId: null,
  structure: null,
};

/**
 * CE QU'ON RETIENT D'UNE STRUCTURE, d'où qu'elle vienne.
 *
 * ⚠ `siret` EST LÀ PARCE QUE C'EST LUI QUI S'IMPRIME SUR UNE FACTURE. Le
 * SIREN identifie l'entité, le SIRET identifie l'établissement qui émet — et
 * c'est le second que la loi exige sur un document commercial. Le serveur
 * déduit le SIREN du SIRET, jamais l'inverse.
 */
export interface StructureChoisie {
  nom: string;
  siren?: string;
  siret?: string;
  formeJuridique?: string;
  adresse?: string;
  ville?: string;
  codePostal?: string;
  verifiee?: boolean;
}

/** Ce que le champ manipule : une structure déjà déclarée, ou une nouvelle. */
export interface ChoixStructure {
  structureId: string | null;
  structure: StructureChoisie | null;
}

/**
 * LA STRUCTURE — retrouvée, pas saisie.
 *
 * On cherche d'abord parmi les structures DÉJÀ déclarées sur la plateforme :
 * si dix établissements d'un même groupe l'ont déjà déclarée, le onzième doit
 * tomber sur la même ligne plutôt que d'en créer une douzième. L'annuaire
 * public vient ensuite, pour tout le reste.
 *
 * ⚠ LA SAISIE À LA MAIN RESTE OUVERTE, et il ne faut pas la retirer. Beaucoup
 * de petites associations ne se trouvent pas dans l'annuaire ; les obliger à
 * choisir dans une liste où elles ne figurent pas, c'est les mettre dehors.
 */
export function ChampStructure({
  id,
  valeur,
  onChange,
  placeholder = 'Fondation Poidatz, Mairie de Melun, 820051852…',
}: {
  /** Relie le champ de recherche à son libellé. */
  id?: string;
  valeur: ChoixStructure;
  onChange: (v: ChoixStructure) => void;
  placeholder?: string;
}) {
  const [recherche, setRecherche] = React.useState('');
  const requete = useValeurRetardee(recherche);
  const [chargement, setChargement] = React.useState(false);
  const [declarees, setDeclarees] = React.useState<StructureDeclaree[]>([]);
  const [annuaire, setAnnuaire] = React.useState<EntiteLegale[]>([]);

  const choisie = valeur.structure?.nom ?? null;

  React.useEffect(() => {
    const texte = requete.trim();
    if (texte.length < 3 || choisie) {
      setDeclarees([]);
      setAnnuaire([]);
      return;
    }
    let annule = false;
    setChargement(true);
    apiRequest<{ declarees: StructureDeclaree[]; annuaire: EntiteLegale[] }>(
      `/public/structures?q=${encodeURIComponent(texte)}`,
    )
      .then((r) => {
        if (annule) return;
        setDeclarees(r.declarees ?? []);
        setAnnuaire(r.annuaire ?? []);
      })
      .catch(() => {
        // L'annuaire public est lent et parfois indisponible. Son échec ne doit
        // pas bloquer l'inscription : la saisie à la main reste possible.
        if (!annule) {
          setDeclarees([]);
          setAnnuaire([]);
        }
      })
      .finally(() => {
        if (!annule) setChargement(false);
      });
    return () => {
      annule = true;
    };
  }, [requete, choisie]);

  if (choisie) {
    return (
      <div className="flex items-start gap-2.5 rounded-lg border-2 border-primary/45 bg-primary-soft/30 p-3">
        <Landmark aria-hidden className="mt-0.5 size-4 shrink-0 text-primary" />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium">{choisie}</span>
          {valeur.structure?.verifiee && (
            <span className="block text-xs text-muted-foreground">
              Entité vérifiée à l’annuaire public
            </span>
          )}
        </span>
        <button
          type="button"
          onClick={() => {
            onChange({ structure: null, structureId: null });
            setRecherche('');
          }}
          className="shrink-0 text-xs font-medium text-primary hover:underline"
        >
          Changer
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Input
        id={id}
        value={recherche}
        onChange={(e) => setRecherche(e.target.value)}
        placeholder={placeholder}
        leftIcon={chargement ? <Loader2 className="animate-spin" /> : <Search />}
        autoComplete="off"
      />

      {declarees.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-primary">
            Déjà sur Les Extras
          </p>
          {declarees.map((st) => (
            <button
              key={st.id}
              type="button"
              onClick={() =>
                onChange({
                  structureId: st.id,
                  structure: { nom: st.nom, verifiee: st.verifiee },
                })
              }
              className="flex w-full items-start gap-2.5 rounded-lg border border-border bg-card p-2.5 text-left transition-colors hover:border-primary/50"
            >
              <Users aria-hidden className="mt-0.5 size-4 shrink-0 text-primary" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{st.nom}</span>
                <span className="block text-xs text-muted-foreground">
                  {[st.formeJuridique, st.ville, st.siren].filter(Boolean).join(' · ')}
                  {st._count?.comptes
                    ? ` · ${st._count.comptes} établissement${st._count.comptes > 1 ? 's' : ''}`
                    : ''}
                </span>
              </span>
            </button>
          ))}
        </div>
      )}

      {annuaire.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Annuaire public des entreprises
          </p>
          {annuaire.map((e) => (
            <button
              key={e.siren}
              type="button"
              onClick={() =>
                onChange({
                  structureId: null,
                  structure: {
                    nom: e.nom,
                    siren: e.siren,
                    siret: e.siret ?? undefined,
                    formeJuridique: e.formeJuridique ?? undefined,
                    adresse: e.adresse ?? undefined,
                    ville: e.ville ?? undefined,
                    codePostal: e.codePostal ?? undefined,
                    // « Vérifiée » ne vaut que pour une entité CHOISIE dans la
                    // liste : une saisie manuelle ne l'est jamais.
                    verifiee: true,
                  },
                })
              }
              className="flex w-full items-start gap-2.5 rounded-lg border border-border bg-card p-2.5 text-left transition-colors hover:border-primary/50"
            >
              <ShieldCheck aria-hidden className="mt-0.5 size-4 shrink-0 text-primary" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">
                  {e.nom}
                  {e.sigle ? ` (${e.sigle})` : ''}
                </span>
                <span className="block text-xs text-muted-foreground">
                  {[e.formeJuridique, e.ville, `SIREN ${e.siren}`].filter(Boolean).join(' · ')}
                </span>
              </span>
            </button>
          ))}
        </div>
      )}

      {recherche.trim().length >= 3 && !chargement && declarees.length === 0 && annuaire.length === 0 && (
        <button
          type="button"
          onClick={() =>
            onChange({
              structureId: null,
              structure: { nom: recherche.trim(), verifiee: false },
            })
          }
          className="w-full rounded-lg border border-dashed border-border p-2.5 text-left text-xs text-muted-foreground transition-colors hover:border-primary/50"
          lang="fr"
        >
          Aucun résultat. Beaucoup de petites structures ne figurent pas dans
          l’annuaire public. <strong className="text-foreground">Utiliser « {recherche.trim()} »</strong>{' '}
          tel quel, ce sera tout aussi valable.
        </button>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------------ */
/* Mise en page commune des étapes                                           */
/* ------------------------------------------------------------------------ */

/**
 * UNE SECTION DE L'ÉTAPE, SOUS FORME DE CARTE.
 *
 * Des blocs empilés sans frontière se valent tous à la lecture : on ne voit
 * pas qu'on répond à plusieurs questions différentes. Chaque question a donc
 * sa carte, avec son titre.
 */
function Carte({
  titre,
  aide,
  children,
}: {
  titre: string;
  aide?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border bg-card p-4">
      <h3 className="text-sm font-semibold">{titre}</h3>
      {aide && (
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground" lang="fr">
          {aide}
        </p>
      )}
      <div className="mt-3">{children}</div>
    </section>
  );
}

/* ------------------------------------------------------------------------ */
/* Intervenant indépendant : ce qu'il vient faire                            */
/* ------------------------------------------------------------------------ */

/**
 * CE QUE VOUS VOULEZ FAIRE.
 *
 * ⚠⚠ LES DEUX DERNIÈRES CASES SONT DEUX MONTAGES JURIDIQUES DIFFÉRENTS, ET
 * L'ÉCRAN DOIT LE DIRE.
 *
 * Remplacer quelqu'un sur un poste ne se fait qu'en CDD salarié : le Conseil
 * d'État l'a tranché le 11/02/2025 (n° 491128). Intervenir EN PLUS, sur un
 * besoin nommé — un enfant à accompagner, un groupe qui décroche — est une
 * prestation ordinaire, facturée par la structure de l'intervenant.
 *
 * Ce n'est donc pas la personne qui choisit le montage, c'est le BESOIN. Les
 * deux cases existent, et chacune porte le contrat qui va avec : un chef de
 * service pressé ne lit pas, il clique, et « renfort » désigne ici deux choses
 * aux conséquences opposées.
 */
interface Activite {
  cle: string;
  titre: string;
  aide: string;
  /** Le montage, quand il y en a un. Affiché tel quel, jamais paraphrasé. */
  montage?: string;
}

const ACTIVITES: Activite[] = [
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

/** Les deux activités qui rendent visible dans le vivier. */
const MONTAGES = ['RENFORT_CDD', 'RENFORT_PERSONNALISE'];

/**
 * Les activités réellement PROPOSÉES à l'inscription.
 *
 * Depuis le 19/09/2026, le renfort de poste (CDD salarié) est hors de l'offre
 * publique — voir `@/lib/offre`. La case n'est plus montrée ; la clé, le
 * montage, le filtre `MONTAGES` et tout ce qui vit côté serveur restent en
 * place, intacts, pour les comptes qui l'ont déjà cochée.
 */
function activitesProposees(): Activite[] {
  if (renfortSalarieVisible()) return ACTIVITES;
  return ACTIVITES.filter((a) => a.cle !== 'RENFORT_CDD');
}

function CaseActivite({
  activite,
  coche,
  onBascule,
}: {
  activite: Activite;
  coche: boolean;
  onBascule: () => void;
}) {
  return (
    <label
      className={cn(
        'flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors',
        coche ? 'border-primary bg-primary-soft/30' : 'border-border bg-card hover:border-primary/40',
      )}
    >
      <input
        type="checkbox"
        checked={coche}
        onChange={onBascule}
        className="mt-0.5 size-4 shrink-0 rounded border-input accent-[hsl(var(--primary))]"
      />
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium">{activite.titre}</span>
        <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground" lang="fr">
          {activite.aide}
        </span>
        {activite.montage && (
          <span className="mt-1.5 inline-block rounded-full bg-secondary/10 px-2 py-0.5 text-[11px] font-semibold text-secondary">
            {activite.montage}
          </span>
        )}
      </span>
    </label>
  );
}

/**
 * LE CONSENTEMENT À FIGURER DANS LE VIVIER.
 *
 * ⚠ IL EST SÉPARÉ DES CASES D'ACTIVITÉ, ET IL DOIT LE RESTER. Dire « je veux
 * faire des remplacements » est une intention ; accepter d'être vu par des
 * dizaines d'établissements est autre chose. Quelqu'un qui cherche du travail
 * ne doit pas découvrir qu'il est listé parce qu'il a coché une case sur un
 * autre sujet.
 *
 * ⚠ AUCUNE COORDONNÉE N'EST DEMANDÉE ICI, et l'écran le dit. Les
 * établissements écrivent par la messagerie ; le numéro s'ouvre quand la
 * demande est confirmée.
 */
function BlocVisibilite({
  actif,
  setActif,
  metier,
  setMetier,
  departements,
  setDepartements,
  presentation,
  setPresentation,
}: {
  actif: boolean;
  setActif: (v: boolean) => void;
  metier: string;
  setMetier: (v: string) => void;
  departements: string;
  setDepartements: (v: string) => void;
  presentation: string;
  setPresentation: (v: string) => void;
}) {
  return (
    <Carte
      titre="Être visible des établissements"
      aide="Votre profil apparaît dans la liste que consultent les établissements qui cherchent quelqu’un. Ils vous écrivent ici ; vos coordonnées ne sont jamais affichées."
    >
      <label
        className={cn(
          'flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors',
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
            <Aide>
              Les numéros de département, séparés par des virgules. Ceux que nous
              ne reconnaissons pas sont simplement ignorés.
            </Aide>
          </div>
          <div>
            <label htmlFor="presentation" className="text-xs font-semibold">
              Deux lignes sur vous <span className="font-normal text-muted-foreground">(facultatif)</span>
            </label>
            <Textarea
              id="presentation"
              value={presentation}
              onChange={(e) => setPresentation(e.target.value)}
              placeholder="Dix ans en MECS, habitué aux adolescents. Disponible en semaine."
              className="mt-1 min-h-[72px]"
              maxLength={600}
            />
            <Aide>
              Ce n’est pas un CV. N’y mettez ni téléphone ni adresse : les
              établissements vous écrivent par la messagerie.
            </Aide>
          </div>
        </div>
      )}
    </Carte>
  );
}

export function EtapeActivites({ onFait }: { onFait: () => void }) {
  const [choisies, setChoisies] = React.useState<string[]>([]);
  const [actif, setActif] = React.useState(false);
  const [metier, setMetier] = React.useState('');
  const [departements, setDepartements] = React.useState('');
  const [presentation, setPresentation] = React.useState('');
  const [envoi, setEnvoi] = React.useState(false);
  const [erreur, setErreur] = React.useState<string | null>(null);

  const proposeUnMontage = choisies.some((c) => MONTAGES.includes(c));

  function bascule(cle: string) {
    setChoisies((liste) =>
      liste.includes(cle) ? liste.filter((c) => c !== cle) : [...liste, cle],
    );
  }

  async function valider() {
    setEnvoi(true);
    setErreur(null);
    try {
      await apiRequest('/disponibilites/moi', {
        method: 'PATCH',
        body: {
          interets: choisies,
          // On n'envoie la disponibilité que si elle a un sens : sans montage
          // coché, le serveur refuserait un consentement qui ne porte sur rien.
          ...(proposeUnMontage
            ? {
                actif,
                montages: choisies.filter((c) => MONTAGES.includes(c)),
                metier: metier.trim(),
                departements: decouperCodes(departements),
                presentation: presentation.trim(),
              }
            : {}),
        },
      });
      lancerConfettis();
      onFait();
    } catch (e) {
      setErreur(
        e instanceof Error
          ? e.message
          : 'Nous n’avons pas pu enregistrer vos choix. Vous les retrouverez dans votre espace.',
      );
    } finally {
      setEnvoi(false);
    }
  }

  return (
    <div className="space-y-4">
      <Carte
        titre="Ce que vous voulez faire"
        aide="Plusieurs réponses possibles, et tout se change plus tard depuis votre espace."
      >
        <div className="space-y-2">
          {activitesProposees().map((a) => (
            <CaseActivite
              key={a.cle}
              activite={a}
              coche={choisies.includes(a.cle)}
              onBascule={() => bascule(a.cle)}
            />
          ))}
        </div>
      </Carte>

      {proposeUnMontage && (
        <BlocVisibilite
          actif={actif}
          setActif={setActif}
          metier={metier}
          setMetier={setMetier}
          departements={departements}
          setDepartements={setDepartements}
          presentation={presentation}
          setPresentation={setPresentation}
        />
      )}

      {erreur && (
        <Encart ton="alerte" icone={TriangleAlert}>
          {erreur}
        </Encart>
      )}

      <Button
        type="button"
        className="w-full"
        size="lg"
        loading={envoi}
        onClick={() => void valider()}
      >
        Terminer mon inscription
      </Button>
    </div>
  );
}

/**
 * LE PARTICULIER — et ce qu'il peut faire de plus qu'avant.
 *
 * ⚠ CE COMPTE N'EST PLUS SEULEMENT CELUI D'UN PARENT. Il ouvre aussi la porte
 * à quelqu'un qui veut faire des remplacements en établissement : étudiant,
 * professionnel entre deux postes, retraité du secteur. C'est le chemin le plus
 * propre juridiquement — un remplacement se fait en CDD, donc en salarié, donc
 * sans structure ni SIRET à fournir — et c'est ce qui manque le plus au
 * renfort : des bras, pas des demandes.
 *
 * ⚠ IL N'Y A PAS DE CASE « RENFORT PERSONNALISÉ » ICI, et c'est volontaire :
 * facturer une prestation demande une structure. Celui qui veut s'y mettre
 * passe en compte intervenant indépendant, en ajoutant la sienne — l'adresse
 * publique du compte ne bouge pas, elle porte déjà son nom.
 */
/**
 * UNE CARTE D'USAGE — un choix entier du compte, pas une case d'un réglage.
 *
 * ⚠ C'EST UNE CASE À COCHER DÉGUISÉE EN CARTE, pas un `<button>` : l'état
 * coché doit rester lisible par un lecteur d'écran. Même raison que
 * `ChampPoste` plus haut dans ce fichier.
 */
function CarteUsage({
  icone: Icone,
  titre,
  aide,
  etiquette,
  actif,
  onBascule,
}: {
  icone: LucideIcon;
  titre: string;
  aide: string;
  etiquette?: string;
  actif: boolean;
  onBascule: () => void;
}) {
  return (
    <label
      className={cn(
        'flex cursor-pointer flex-col gap-2 rounded-xl border-2 p-4 transition-colors',
        actif
          ? 'border-primary bg-primary-soft/30'
          : 'border-border bg-card hover:border-primary/40',
      )}
    >
      <span className="flex items-center gap-2.5">
        <span
          className={cn(
            'grid size-9 shrink-0 place-items-center rounded-lg',
            actif ? 'bg-primary text-primary-foreground' : 'bg-accent text-accent-foreground',
          )}
        >
          <Icone className="size-4" />
        </span>
        <input
          type="checkbox"
          checked={actif}
          onChange={onBascule}
          className="ml-auto size-4 shrink-0 rounded border-input accent-[hsl(var(--primary))]"
        />
      </span>
      <span className="block text-sm font-semibold leading-snug" lang="fr">
        {titre}
      </span>
      <span className="block text-xs leading-relaxed text-muted-foreground" lang="fr">
        {aide}
      </span>
      {etiquette && (
        <span className="mt-auto inline-block w-fit rounded-full bg-secondary/10 px-2 py-0.5 text-[11px] font-semibold text-secondary">
          {etiquette}
        </span>
      )}
    </label>
  );
}

export function EtapeDisponibilite({ onFait }: { onFait: () => void }) {
  /**
   * ⚠ La seconde carte — le renfort de poste en CDD — n'est plus proposée
   * depuis le 19/09/2026 (voir `@/lib/offre`). Elle s'adressait à quelqu'un
   * SANS structure : la remplacer par le renfort d'indépendant n'aurait pas de
   * sens, celui-ci suppose justement une structure qui facture. On cesse donc
   * de l'offrir, et l'écran se réduit à un seul usage.
   *
   * Rien n'est supprimé : le bloc entier revient tel quel avec
   * NEXT_PUBLIC_OFFRE_PUBLIQUE=complete.
   */
  const montreCdd = renfortSalarieVisible();
  const [reserver, setReserver] = React.useState(true);
  const [remplacer, setRemplacer] = React.useState(false);
  const [actif, setActif] = React.useState(false);
  const [metier, setMetier] = React.useState('');
  const [departements, setDepartements] = React.useState('');
  const [presentation, setPresentation] = React.useState('');
  const [envoi, setEnvoi] = React.useState(false);
  const [erreur, setErreur] = React.useState<string | null>(null);

  async function valider() {
    setEnvoi(true);
    setErreur(null);
    try {
      await apiRequest('/disponibilites/moi', {
        method: 'PATCH',
        body: {
          interets: montreCdd && remplacer ? ['RENFORT_CDD'] : [],
          ...(montreCdd && remplacer
            ? {
                actif,
                montages: ['RENFORT_CDD'],
                metier: metier.trim(),
                departements: decouperCodes(departements),
                presentation: presentation.trim(),
              }
            : {}),
        },
      });
      lancerConfettis();
      onFait();
    } catch (e) {
      setErreur(
        e instanceof Error
          ? e.message
          : 'Nous n’avons pas pu enregistrer vos choix. Vous les retrouverez dans votre espace.',
      );
    } finally {
      setEnvoi(false);
    }
  }

  return (
    <div className="space-y-4">
      {/*
        ⚠ DEUX CARTES CÔTE À CÔTE, PAS DEUX LIGNES DE CASES À COCHER.

        Ce sont deux usages entiers du compte — venir réserver, ou venir
        travailler —, pas deux options d'un même réglage. Les empiler en cases
        les faisait lire comme une liste de préférences, et la seconde, qui est
        la nouveauté, passait inaperçue sous la première.
      */}
      <Carte
        titre="Ce qui vous intéresse"
        aide={
          montreCdd
            ? 'Les deux sont possibles, et rien n’est définitif.'
            : 'Rien n’est définitif : tout se change plus tard depuis votre espace.'
        }
      >
        <div className={cn('grid gap-2', montreCdd && 'sm:grid-cols-2')}>
          <CarteUsage
            icone={Sparkles}
            titre="Réserver un atelier ou une formation"
            aide="Pour votre enfant, votre proche, ou vous-même."
            actif={reserver}
            onBascule={() => setReserver(!reserver)}
          />
          {montreCdd && (
            <CarteUsage
              icone={Users}
              titre="Faire du renfort en CDD"
              aide="L’établissement vous embauche. Aucune structure ni SIRET à fournir."
              etiquette="CDD salarié"
              actif={remplacer}
              onBascule={() => setRemplacer(!remplacer)}
            />
          )}
        </div>
      </Carte>

      {montreCdd && remplacer && (
        <>
          <BlocVisibilite
            actif={actif}
            setActif={setActif}
            metier={metier}
            setMetier={setMetier}
            departements={departements}
            setDepartements={setDepartements}
            presentation={presentation}
            setPresentation={setPresentation}
          />
          {/*
            ⚠ LES PIÈCES SONT EXIGÉES POUR CANDIDATER, ET L'ÉCRAN LE DIT ICI.
            Le refus est posé côté serveur (`assertReponseAutorisee`), au
            moment de la candidature : l'annoncer seulement à ce moment-là
            ferait découvrir la condition à quelqu'un qui vient de trouver la
            mission qui lui convient.
          */}
          <Encart ton="alerte" icone={TriangleAlert} titre="Les pièces à déposer dans votre compte">
            Votre pièce d’identité et votre bulletin n° 3 du casier judiciaire.
            Sans elles, vous ne pouvez pas candidater à un remplacement.
          </Encart>
        </>
      )}

      {erreur && (
        <Encart ton="alerte" icone={TriangleAlert}>
          {erreur}
        </Encart>
      )}

      <Button
        type="button"
        className="w-full"
        size="lg"
        loading={envoi}
        onClick={() => void valider()}
      >
        Terminer mon inscription
      </Button>
    </div>
  );
}

/**
 * « 77, 91, 94 » → ['77', '91', '94'].
 *
 * On ne valide rien ici : le serveur confronte au référentiel des
 * départements, qui fait foi, et ignore ce qu'il ne reconnaît pas. Une
 * validation côté écran se désynchroniserait du référentiel au premier ajout.
 */
function decouperCodes(texte: string): string[] {
  return texte
    .split(/[,;\s]+/)
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 101);
}
