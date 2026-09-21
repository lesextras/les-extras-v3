'use client';

import * as React from 'react';
import {
  Building,
  Check,
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
import { groupesDroitsProposes } from '@/lib/droits';
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
/* Étape « établissement » — et le doublon d'établissement                   */
/* ------------------------------------------------------------------------ */

export interface EtablissementExistant {
  id: string;
  name: string;
  city: string | null;
  structure: { id: string; nom: string } | null;
}

/**
 * LE DOUBLON D'ÉTABLISSEMENT — le plus coûteux des trois.
 *
 * Douze salariés d'une même MECS qui s'inscrivent chacun de leur côté créent
 * douze établissements homonymes : douze organigrammes d'une personne, douze
 * catalogues, et personne qui se voit. C'est le doublon de service, mais un
 * cran au-dessus — et il ne se répare pas facilement après coup, parce que
 * chaque compte porte déjà des devis et des documents.
 *
 * On cherche donc pendant la frappe, et on propose de REJOINDRE avant de
 * proposer de créer. La déclaration rattache de fait — la personne apparaît
 * dans l'organigramme, elle n'est plus seule — mais non vérifiée : elle ne voit
 * rien de l'établissement tant qu'un responsable ne l'a pas confirmée.
 */
/**
 * LA RECHERCHE DE L'ÉTABLISSEMENT — un champ, une seule question.
 *
 * ⚠⚠ ON A ESSAYÉ DE FONDRE L'ÉTABLISSEMENT ET L'ENTITÉ EMPLOYEUSE DANS UN SEUL
 * CHAMP, ET C'ÉTAIT PLUS OBSCUR, PAS PLUS SIMPLE. Une même frappe interrogeait
 * les deux annuaires : taper « les extras » proposait dessous une association
 * sans rapport, et rien ne disait à laquelle des deux questions on était en
 * train de répondre. Les deux sont donc redevenus DEUX CHAMPS, CÔTE À CÔTE sur
 * la même ligne : « l'ESAT Corail de l'association ADSEA » se lit toujours de
 * gauche à droite, mais on répond à l'un, puis à l'autre.
 *
 * ⚠ CE CHAMP-CI NE CHERCHE QUE LES ÉTABLISSEMENTS DÉJÀ SUR LES EXTRAS, et
 * c'est le seul garde-fou contre le doublon décrit au-dessus. L'entité qui
 * emploie a son propre champ — `ChampStructure` —, qui interroge les
 * structures déclarées puis l'annuaire public.
 *
 * ⚠ REJOINDRE UN ÉTABLISSEMENT NE RENOMME RIEN D'AUTRE : le nom saisi fixe le
 * nom du compte ET son slug, tous deux posés à la création.
 */
export function RechercheEtablissement({
  nom,
  onRejoindre,
}: {
  nom: string;
  onRejoindre: (etablissement: EtablissementExistant) => void;
}) {
  const requete = useValeurRetardee(nom, 450);
  const [etablissements, setEtablissements] = React.useState<EtablissementExistant[]>([]);

  React.useEffect(() => {
    const texte = requete.trim();
    if (texte.length < 3) {
      setEtablissements([]);
      return;
    }
    let annule = false;
    apiRequest<EtablissementExistant[]>(
      `/public/etablissements?q=${encodeURIComponent(texte)}`,
    )
      .then((r) => {
        if (!annule) setEtablissements(r ?? []);
      })
      .catch(() => {
        // Une recherche qui échoue ne doit rien bloquer : on crée, tout
        // simplement — c'est le comportement d'avant la recherche.
        if (!annule) setEtablissements([]);
      });
    return () => {
      annule = true;
    };
  }, [requete]);

  if (etablissements.length === 0) return null;

  return (
    <div className="mt-2 space-y-1.5 rounded-lg border-2 border-primary/35 bg-primary-soft/30 p-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-primary">
        Déjà sur Les Extras
      </p>
      {etablissements.map((e) => (
        <button
          key={e.id}
          type="button"
          onClick={() => onRejoindre(e)}
          className="flex w-full items-start gap-2.5 rounded-lg border border-border bg-card p-2.5 text-left transition-colors hover:border-primary/60"
        >
          <Building aria-hidden className="mt-0.5 size-4 shrink-0 text-primary" />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium">{e.name}</span>
            <span className="block truncate text-xs text-muted-foreground">
              {[e.city, e.structure?.nom].filter(Boolean).join(' · ') ||
                'Établissement déclaré'}
            </span>
          </span>
          <span className="shrink-0 self-center text-xs font-medium text-primary">
            C’est le mien
          </span>
        </button>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------------ */
/* L'entité qui emploie — le champ voisin du nom de l'établissement          */
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
 * CE QUE L'ÉTAPE « OÙ VOUS TRAVAILLEZ » RAMÈNE.
 *
 * Elle ne fait AUCUNE écriture : le compte n'existe pas encore. Elle collecte,
 * et la page applique juste après la création. Voir la note du parcours.
 */
export interface LieuDeTravail {
  /** Établissement existant reconnu comme le sien. */
  rejoindre: EtablissementExistant | null;
  /** Structure déjà déclarée sur la plateforme. */
  structureId: string | null;
  /** Structure venue de l'annuaire, ou saisie à la main. */
  structure: StructureChoisie | null;
  /** Nom du service ou de l'unité, tel qu'écrit. */
  service: string;
  /**
   * L'intitulé du poste et le statut cadre.
   *
   * ⚠ ILS SONT SAISIS AVEC LE RESTE DU LIEU DE TRAVAIL, mais ils ne sont PAS
   * écrits au même moment : ils partent avec le niveau et les droits, dans
   * l'unique PATCH de l'étape suivante (`EtapePoste`). Deux écritures
   * successives sur `/organisation/moi` se marcheraient dessus.
   */
  poste: string;
  cadre: boolean;
}

export const LIEU_VIDE: LieuDeTravail = {
  rejoindre: null,
  structureId: null,
  structure: null,
  service: '',
  poste: '',
  cadre: false,
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
 * si dix établissements d'un même groupe s'y sont rattachés, le onzième doit
 * tomber sur la même ligne plutôt que d'en créer une douzième. L'annuaire
 * public vient ensuite, pour tout le reste.
 *
 * ⚠ LA SAISIE À LA MAIN RESTE OUVERTE, et il ne faut pas la retirer. Beaucoup
 * de petites associations ne se trouvent pas dans l'annuaire ; les obliger à
 * choisir dans une liste où elles ne figurent pas, c'est les mettre dehors.
 */
export function ChampStructure({
  valeur,
  onChange,
  placeholder = 'Fondation Poidatz, Mairie de Melun, 820051852…',
}: {
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
/* Étape « poste et droits »                                                 */
/* ------------------------------------------------------------------------ */

type Niveau = 'DIRECTION' | 'RESPONSABLE' | 'SALARIE';

/**
 * ⚠ DEUX LIGNES PAR NIVEAU, PAS TROIS.
 *
 * Chaque niveau portait son intitulé, ses exemples de poste ET une phrase sur
 * ce qu'il ouvre : neuf lignes pour trois boutons radio, avant même la liste
 * des droits. On choisit son niveau sur son MÉTIER — « je suis chef de
 * service » —, pas sur une description de périmètre qu'on lira de toute façon
 * après coup dans « Mon poste ».
 */
const NIVEAUX: {
  cle: Niveau;
  titre: string;
  exemples: string;
  /** Vrai quand le niveau demande une validation de Les Extras. */
  valide: boolean;
}[] = [
  {
    cle: 'DIRECTION',
    titre: 'Direction',
    exemples: 'Directeur, directrice adjointe, pilote des opérations',
    valide: true,
  },
  {
    cle: 'RESPONSABLE',
    titre: 'Responsable',
    exemples: 'Chef de service, coordinateur',
    valide: false,
  },
  {
    cle: 'SALARIE',
    titre: 'Salarié',
    exemples: 'Éducateur, moniteur, AES, veilleur, psychologue…',
    valide: false,
  },
];


/**
 * VOTRE POSTE ET VOS DROITS.
 *
 * ⚠ CES DROITS SONT DÉCLARATIFS, ET L'ÉCRAN LE DIT. Personne ne les vérifie
 * en amont ; ce qu'ils font, c'est décider si votre bouton dit « Réserver » ou
 * « Demander un devis », et laisser une trace de qui a engagé quoi. Les
 * présenter comme un contrôle serait mentir sur ce qu'ils sont.
 *
 * ⚠ ET DÉCLARER NE DONNE RIEN. Une Direction déclarée voit exactement ce que
 * voit un salarié tant que Les Extras n'a pas validé — c'est écrit ici, à
 * l'endroit où la personne coche, pas dans des conditions générales.
 */
/**
 * UNE SECTION DE L'ÉTAPE, SOUS FORME DE CARTE.
 *
 * L'écran empilait cinq blocs sans frontière : le poste, le statut cadre, les
 * trois niveaux, les cinq droits, l'avertissement. À la lecture, tout se
 * valait et rien ne se distinguait — on ne voyait pas qu'on répondait à trois
 * questions différentes. Chaque question a maintenant sa carte, avec son titre.
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

/**
 * LE POSTE ET LE STATUT CADRE.
 *
 * Les deux répondent à une seule question — « quel est votre poste ? » — et le
 * statut cadre n'a de sens que rapporté à l'intitulé qui le précède. Ils ne se
 * séparent donc pas.
 *
 * ⚠ ILS SONT DEMANDÉS AVEC LE LIEU DE TRAVAIL, à l'étape des identifiants, et
 * plus à l'étape suivante : « où je travaille, dans quel service, à quel
 * poste » est une seule phrase, et on la posait sur trois écrans.
 * L'ÉCRITURE, elle, reste à l'étape suivante, avec le niveau et les droits —
 * un seul PATCH pour toute la déclaration.
 *
 * ⚠ C'est une CASE À COCHER déguisée en bouton, pas un `<button>` : l'état
 * coché doit rester lisible par un lecteur d'écran et par l'autoremplissage.
 * `sr-only` masque la case à l'œil sans la retirer du DOM.
 */
export function ChampPoste({
  poste,
  setPoste,
  cadre,
  setCadre,
}: {
  poste: string;
  setPoste: (v: string) => void;
  cadre: boolean;
  setCadre: (v: boolean) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Input
        id="poste"
        value={poste}
        onChange={(e) => setPoste(e.target.value)}
        placeholder="Chef de service éducatif, monitrice-éducatrice…"
        autoComplete="organization-title"
      />
      <label
        className={cn(
          'flex w-fit cursor-pointer items-center gap-2 rounded-lg border-2 px-3 py-1.5 text-xs font-medium transition-colors',
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
          <Check aria-hidden className="size-3.5" />
        ) : (
          <span aria-hidden className="size-3.5 rounded border border-current opacity-50" />
        )}
        Je suis cadre
      </label>
    </div>
  );
}

/**
 * LES DROITS, PAR GROUPES.
 *
 * Treize cases à la suite se lisent comme une liste de courses : on coche au
 * hasard ou on ne coche rien. Groupées — engager, équipe, publier, sensible —
 * elles se répondent par blocs, et le groupe sensible se voit.
 *
 * ⚠ LE GROUPE « DONNÉES SENSIBLES » EST SIGNALÉ, PAS CACHÉ. Il porte l'accès au
 * coffre-fort de conformité — pièces d'identité, casiers judiciaires,
 * diplômes — et la dépense des générations LEX. Les masquer derrière un
 * « voir plus » ferait qu'on se les accorde sans les lire.
 */
function ListeDroits({
  droits,
  setDroits,
}: {
  droits: string[];
  setDroits: React.Dispatch<React.SetStateAction<string[]>>;
}) {
  return (
    <div className="space-y-4">
      {groupesDroitsProposes().map((groupe) => (
        <fieldset key={groupe.titre}>
          <legend
            className={cn(
              'mb-1 text-xs font-semibold uppercase tracking-wide',
              groupe.sensible ? 'text-secondary' : 'text-muted-foreground',
            )}
          >
            {groupe.titre}
          </legend>
          {/*
            ⚠ L'INTRO N'EST GARDÉE QUE SUR LE GROUPE SENSIBLE. Ailleurs elle
            reformulait le titre du groupe, et cet écran portait déjà treize
            cases avec chacune sa ligne d'aide : quarante lignes pour cocher
            trois choses.
          */}
          {groupe.sensible && groupe.intro && (
            <p className="mb-1.5 text-xs leading-relaxed text-secondary" lang="fr">
              {groupe.intro}
            </p>
          )}
          <div className="grid gap-1.5 sm:grid-cols-2">
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
                  {/*
                    ⚠ LE LIBELLÉ SEUL, SANS SA LIGNE D'AIDE. Les intitulés se
                    suffisent — « Voir les factures », « Gérer le planning » —
                    et l'aide complète reste sur « Mon poste », où l'on vient
                    délibérément régler ses droits. Ici, on coche.
                  */}
                  <span className="min-w-0 text-sm leading-snug">{d.libelle}</span>
                </label>
              );
            })}
          </div>
        </fieldset>
      ))}
    </div>
  );
}

/**
 * ⚠ LE POSTE ET LE STATUT CADRE ARRIVENT D'AILLEURS : ils sont saisis à
 * l'étape des identifiants, avec l'établissement, l'entité employeuse et le
 * service — une seule phrase, un seul écran. Ce qui reste ici, c'est ce qui ne
 * se déclare pas en une ligne : le NIVEAU de responsabilité et les DROITS.
 *
 * ⚠ ILS SONT QUAND MÊME ENVOYÉS D'ICI, et il ne faut pas les écrire plus tôt :
 * `/organisation/moi` reçoit la déclaration entière en une fois. Deux PATCH
 * successifs se marcheraient dessus, et le second gagnerait avec des champs
 * que la personne n'a pas encore remplis.
 */
export function EtapePoste({
  poste,
  cadre,
  onFait,
}: {
  poste: string;
  cadre: boolean;
  onFait: () => void;
}) {
  const [niveau, setNiveau] = React.useState<Niveau>('SALARIE');
  const [droits, setDroits] = React.useState<string[]>([]);
  const [envoi, setEnvoi] = React.useState(false);
  const [erreur, setErreur] = React.useState<string | null>(null);

  const choisi = NIVEAUX.find((n) => n.cle === niveau)!;

  async function valider() {
    setEnvoi(true);
    setErreur(null);
    try {
      await apiRequest('/organisation/moi', {
        method: 'PATCH',
        body: {
          poste: poste.trim() || undefined,
          cadre,
          niveau,
          // Toujours envoyé, même vide : décocher une case doit retirer le
          // droit, et un tableau omis laisserait la déclaration précédente.
          capacites: droits,
          justification:
            niveau === 'DIRECTION'
              ? `${poste.trim() || 'Direction'}${cadre ? ' (cadre)' : ''}`
              : undefined,
        },
      });
      lancerConfettis();
      onFait();
    } catch (e) {
      setErreur(e instanceof Error ? e.message : 'Enregistrement impossible.');
    } finally {
      setEnvoi(false);
    }
  }

  return (
    <div className="space-y-4">
      <Carte titre="Votre niveau de responsabilité" aide="Il décide de ce que vous voyez.">
        <fieldset className="space-y-2">
          <legend className="sr-only">Votre niveau de responsabilité</legend>
          {NIVEAUX.map((n) => {
            const actif = niveau === n.cle;
            return (
              <label
                key={n.cle}
                className={cn(
                  'flex cursor-pointer gap-3 rounded-lg border-2 p-3 transition-colors',
                  actif
                    ? 'border-primary bg-primary-soft/40'
                    : 'border-border bg-card hover:border-primary/40',
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
                  <span className="block text-sm font-semibold">{n.titre}</span>
                  <span className="block text-xs text-muted-foreground">{n.exemples}</span>
                </span>
              </label>
            );
          })}
        </fieldset>

        {/*
          ⚠ CET AVERTISSEMENT RESTE, ET IL RESTE COMPLET DANS SON IDÉE : c'est
          le seul endroit où l'on dit qu'une direction déclarée ne voit rien de
          plus tant qu'elle n'est pas validée. Le raccourcir jusqu'à supprimer
          cette phrase ferait croire à un accès immédiat.
        */}
        {choisi.valide && (
          <div className="mt-3">
            <Encart ton="alerte" icone={TriangleAlert} titre="Validé à la main par Les Extras">
              En attendant, votre compte fonctionne comme celui d’un salarié.
            </Encart>
          </div>
        )}
      </Carte>

      <Carte
        titre="Ce que vous pouvez engager"
        aide="Déclaratif, et sans aucun paiement en jeu : cela décide surtout si votre bouton dit « Réserver » ou « Demander un devis »."
      >
        <ListeDroits droits={droits} setDroits={setDroits} />
      </Carte>

      {erreur && (
        <Encart ton="alerte" icone={TriangleAlert}>
          {erreur}
        </Encart>
      )}

      <Button type="button" className="w-full" size="lg" loading={envoi} onClick={valider}>
        Terminer mon inscription
      </Button>
    </div>
  );
}

/* ------------------------------------------------------------------------ */
/* Intervenant indépendant : sa structure, puis ce qu'il vient faire         */
/* ------------------------------------------------------------------------ */

/**
 * VOTRE STRUCTURE — le SIRET, et rien d'autre.
 *
 * ⚠ FACULTATIVE ICI, EXIGÉE POUR PUBLIER, et c'est toute la règle. Quelqu'un
 * qui vient regarder le catalogue, répondre à un message ou préparer un
 * brouillon n'a besoin d'aucun numéro. Mais une fiche publiée est une offre de
 * prestation : elle produit des devis, des contrats et des factures, qui
 * portent tous le SIRET de l'émetteur. Le refus est donc posé à la
 * publication, jamais ici — on ferme la porte de la publication, on ne mure
 * pas la création de compte.
 *
 * ⚠ LA SORTIE « JE N'AI PAS ENCORE DE STRUCTURE » N'EST PAS UNE POLITESSE.
 * Beaucoup arrivent en cours d'immatriculation, en portage salarial, ou
 * salariés d'une association qui facturera pour eux. Sans cette sortie, l'écran
 * dirait à ces gens-là qu'ils n'ont rien à faire ici — alors qu'ils peuvent
 * déjà tout faire sauf publier.
 */
export function EtapeStructure({ onFait }: { onFait: () => void }) {
  const [choix, setChoix] = React.useState<ChoixStructure>({
    structureId: null,
    structure: null,
  });
  const [envoi, setEnvoi] = React.useState(false);
  const [erreur, setErreur] = React.useState<string | null>(null);

  async function valider() {
    if (!choix.structureId && !choix.structure) {
      onFait();
      return;
    }
    setEnvoi(true);
    setErreur(null);
    try {
      await apiRequest('/structures/rattacher', {
        method: 'POST',
        body: choix.structureId ? { structureId: choix.structureId } : choix.structure,
      });
      lancerConfettis();
      onFait();
    } catch (e) {
      // Le compte existe déjà : un rattachement raté ne doit pas donner
      // l'impression que l'inscription a échoué.
      setErreur(
        e instanceof Error
          ? e.message
          : 'Nous n’avons pas pu enregistrer votre structure. Vous pourrez le faire depuis votre espace.',
      );
    } finally {
      setEnvoi(false);
    }
  }

  return (
    <div className="space-y-4">
      <Carte
        titre="L’entité qui facture vos interventions"
        aide="Micro-entreprise, association, société. Facultatif pour entrer, nécessaire pour publier."
      >
        <ChampStructure
          valeur={choix}
          onChange={setChoix}
          placeholder="Votre SIRET, ou le nom de votre entreprise…"
        />
      </Carte>

      {/*
        ⚠ L'AIDE VIENT APRÈS LE CHAMP, PAS AVANT. Placée au-dessus, elle se
        lisait comme une consigne à traiter avant d'avoir vu ce qu'on demandait
        — et sur un écran d'inscription, un paragraphe qui précède le premier
        champ est un paragraphe sauté.
      */}
      <Encart icone={ShieldCheck} titre="Votre SIRET suffit">
        Nous retrouvons le reste dans l’annuaire public. C’est ce numéro qui
        figurera sur vos devis et vos factures.
      </Encart>

      {erreur && (
        <Encart ton="alerte" icone={TriangleAlert}>
          {erreur}
        </Encart>
      )}

      <Encart>
        <strong className="text-foreground">Pas encore de structure ?</strong> C’est
        très bien aussi. Vous pouvez tout faire ici, être contacté, échanger,
        préparer vos fiches, vous rendre disponible pour des remplacements en CDD.
        Vous la déclarerez le jour où vous voudrez publier.
      </Encart>

      <Button
        type="button"
        className="w-full"
        size="lg"
        loading={envoi}
        onClick={() => void valider()}
      >
        {choix.structureId || choix.structure ? 'Enregistrer ma structure' : 'Continuer'}
      </Button>
    </div>
  );
}

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
