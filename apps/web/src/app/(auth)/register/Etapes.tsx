'use client';

import * as React from 'react';
import {
  Building,
  Check,
  Landmark,
  Loader2,
  Search,
  ShieldCheck,
  TriangleAlert,
  Users,
} from 'lucide-react';
import { apiRequest } from '@/lib/api';
import { lancerConfettis } from '@/lib/confetti';
import { GROUPES_DROITS } from '@/lib/droits';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

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
export function RechercheEtablissement({
  nom,
  onRejoindre,
}: {
  nom: string;
  onRejoindre: (etablissement: EtablissementExistant) => void;
}) {
  const requete = useValeurRetardee(nom, 450);
  const [resultats, setResultats] = React.useState<EtablissementExistant[]>([]);
  const [chargement, setChargement] = React.useState(false);

  React.useEffect(() => {
    const texte = requete.trim();
    if (texte.length < 3) {
      setResultats([]);
      return;
    }
    let annule = false;
    setChargement(true);
    apiRequest<EtablissementExistant[]>(
      `/public/etablissements?q=${encodeURIComponent(texte)}`,
    )
      .then((r) => {
        if (!annule) setResultats(r);
      })
      .catch(() => {
        // Une recherche qui échoue ne doit pas bloquer la création : on
        // retombe simplement sur le comportement d'avant.
        if (!annule) setResultats([]);
      })
      .finally(() => {
        if (!annule) setChargement(false);
      });
    return () => {
      annule = true;
    };
  }, [requete]);

  if (chargement && resultats.length === 0) return null;
  if (resultats.length === 0) return null;

  return (
    <div className="space-y-2.5 rounded-lg border-2 border-primary/35 bg-primary-soft/30 p-3.5">
      <p className="text-sm font-semibold">
        {resultats.length === 1
          ? 'Cet établissement est déjà sur Les Extras'
          : 'Ces établissements sont déjà sur Les Extras'}
      </p>
      <p className="text-xs leading-relaxed text-muted-foreground" lang="fr">
        Si c’est le vôtre, rattachez-vous plutôt que d’en créer un second : vous
        retrouverez vos collègues, leurs services et l’organigramme.
      </p>
      <div className="space-y-1.5">
        {resultats.map((e) => (
          <button
            key={e.id}
            type="button"
            onClick={() => onRejoindre(e)}
            className="flex w-full items-start gap-3 rounded-lg border border-border bg-card p-3 text-left transition-colors hover:border-primary/60"
          >
            <Building aria-hidden className="mt-0.5 size-4 shrink-0 text-primary" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium">{e.name}</span>
              <span className="block text-xs text-muted-foreground">
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
      <Aide>
        Votre rattachement sera visible par vos collègues mais marqué « à
        confirmer » jusqu’à ce qu’un responsable le valide. Vous n’accédez à
        aucune donnée de l’établissement avant cette confirmation.
      </Aide>
    </div>
  );
}

/* ------------------------------------------------------------------------ */
/* Étape combinée : établissement + structure + service                      */
/* ------------------------------------------------------------------------ */

interface EntiteLegale {
  nom: string;
  sigle: string | null;
  siren: string;
  formeJuridique: string | null;
  adresse: string | null;
  ville: string | null;
  codePostal: string | null;
}

interface StructureDeclaree {
  id: string;
  nom: string;
  siren: string | null;
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
  structure: {
    nom: string;
    siren?: string;
    formeJuridique?: string;
    adresse?: string;
    ville?: string;
    codePostal?: string;
    verifiee?: boolean;
  } | null;
  /** Nom du service, tel qu'écrit. */
  service: string;
}

export const LIEU_VIDE: LieuDeTravail = {
  rejoindre: null,
  structureId: null,
  structure: null,
  service: '',
};

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
function ChampStructure({
  lieu,
  setLieu,
}: {
  lieu: LieuDeTravail;
  setLieu: React.Dispatch<React.SetStateAction<LieuDeTravail>>;
}) {
  const [recherche, setRecherche] = React.useState('');
  const requete = useValeurRetardee(recherche);
  const [chargement, setChargement] = React.useState(false);
  const [declarees, setDeclarees] = React.useState<StructureDeclaree[]>([]);
  const [annuaire, setAnnuaire] = React.useState<EntiteLegale[]>([]);

  const choisie = lieu.structure?.nom ?? null;

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
          {lieu.structure?.verifiee && (
            <span className="block text-xs text-muted-foreground">
              Entité vérifiée à l’annuaire public
            </span>
          )}
        </span>
        <button
          type="button"
          onClick={() => {
            setLieu((l) => ({ ...l, structure: null, structureId: null }));
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
        placeholder="Fondation Poidatz, Mairie de Melun, 820051852…"
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
                setLieu((l) => ({
                  ...l,
                  structureId: st.id,
                  structure: { nom: st.nom, verifiee: st.verifiee },
                }))
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
                setLieu((l) => ({
                  ...l,
                  structureId: null,
                  structure: {
                    nom: e.nom,
                    siren: e.siren,
                    formeJuridique: e.formeJuridique ?? undefined,
                    adresse: e.adresse ?? undefined,
                    ville: e.ville ?? undefined,
                    codePostal: e.codePostal ?? undefined,
                    // « Vérifiée » ne vaut que pour une entité CHOISIE dans la
                    // liste : une saisie manuelle ne l'est jamais.
                    verifiee: true,
                  },
                }))
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
            setLieu((l) => ({
              ...l,
              structureId: null,
              structure: { nom: recherche.trim(), verifiee: false },
            }))
          }
          className="w-full rounded-lg border border-dashed border-border p-2.5 text-left text-xs text-muted-foreground transition-colors hover:border-primary/50"
          lang="fr"
        >
          Aucun résultat. Beaucoup de petites structures ne figurent pas dans
          l’annuaire public — <strong className="text-foreground">utiliser « {recherche.trim()} »</strong>{' '}
          tel quel, ce sera tout aussi valable.
        </button>
      )}
    </div>
  );
}

/**
 * OÙ VOUS TRAVAILLEZ — établissement, structure et service, en une étape.
 *
 * Les trois ne posent qu'une seule question. Séparés sur trois écrans, ils
 * faisaient trois fois le même geste : lire un titre, remplir un champ,
 * cliquer Continuer.
 *
 * ⚠ AUCUNE ÉCRITURE ICI : le compte n'existe pas encore, seules les routes
 * publiques sont appelables. La page applique le rattachement et le service
 * juste après la création du compte.
 */
/**
 * OÙ VOUS TRAVAILLEZ — la structure et le service.
 *
 * ⚠ LE NOM DE L'ÉTABLISSEMENT N'EST PLUS ICI, ET IL NE DOIT PAS Y REVENIR.
 * Il est demandé à l'étape des identifiants, parce qu'il fixe le nom du compte
 * ET son slug — l'adresse publique — tous deux posés à la création et jamais
 * recalculés. Le redemander ici obligerait à renommer un compte déjà créé, et
 * l'adresse garderait pour toujours le prénom de la personne.
 *
 * Les deux champs qui restent sont FACULTATIFS et se complètent aussi plus
 * tard : on ne retient personne sur un écran administratif.
 */
export function EtapeLieuDeTravail({
  lieu,
  setLieu,
}: {
  lieu: LieuDeTravail;
  setLieu: React.Dispatch<React.SetStateAction<LieuDeTravail>>;
}) {
  return (
    <div className="space-y-4">
      {/* --- La structure --- */}
      <div className="rounded-xl border border-border bg-card p-4">
        <h3 className="text-sm font-semibold">
          Votre structure{' '}
          <span className="font-normal text-muted-foreground">(facultatif)</span>
        </h3>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground" lang="fr">
          L’entité juridique qui possède votre établissement : association,
          fondation, mairie, groupe. C’est elle qui permettra à vos collègues
          d’autres sites de vous retrouver.
        </p>
        <div className="mt-3">
          <ChampStructure lieu={lieu} setLieu={setLieu} />
        </div>
      </div>

      {/* --- Le service --- */}
      <div className="rounded-xl border border-border bg-card p-4">
        <h3 className="text-sm font-semibold">
          Votre service{' '}
          <span className="font-normal text-muted-foreground">(facultatif)</span>
        </h3>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground" lang="fr">
          Internat, pôle jour, SESSAD… C’est lui qui vous relie à votre équipe :
          plannings, demandes de renfort, organigramme.
        </p>
        <div className="mt-3">
          <Input
            value={lieu.service}
            onChange={(e) => setLieu((l) => ({ ...l, service: e.target.value }))}
            placeholder="Internat, Pôle jour, SESSAD…"
            leftIcon={<Users />}
            autoComplete="off"
          />
          <div className="mt-1.5">
            <Aide>
              Écrivez-le comme votre équipe le dit. Si un collègue l’a déjà créé,
              nous vous rattacherons au sien plutôt que d’en créer un second.
            </Aide>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------------ */
/* Étape « poste et droits »                                                 */
/* ------------------------------------------------------------------------ */

type Niveau = 'DIRECTION' | 'RESPONSABLE' | 'SALARIE';

const NIVEAUX: {
  cle: Niveau;
  titre: string;
  exemples: string;
  ceQueCaDonne: string;
  /** Vrai quand le niveau demande une validation de Les Extras. */
  valide: boolean;
}[] = [
  {
    cle: 'DIRECTION',
    titre: 'Direction',
    exemples: 'Directeur, directrice adjointe, pilote des opérations',
    ceQueCaDonne:
      'Tous les services, tous les salariés de l’établissement, et tous les droits.',
    valide: true,
  },
  {
    cle: 'RESPONSABLE',
    titre: 'Responsable',
    exemples: 'Chef de service, coordinateur',
    ceQueCaDonne:
      'Les personnes des services que vous encadrez. Vous pouvez inviter votre équipe et lui accorder des droits, sans attendre personne.',
    valide: false,
  },
  {
    cle: 'SALARIE',
    titre: 'Salarié',
    exemples: 'Éducateur, moniteur, AES, veilleur, psychologue…',
    ceQueCaDonne:
      'Vos demandes, votre planning, vos inscriptions. Vous pouvez vous porter volontaire pour un renfort interne ou un CDD.',
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
 * LE POSTE ET LE STATUT CADRE, SUR LA MÊME LIGNE.
 *
 * Les deux répondent à une seule question — « quel est votre poste ? » — et le
 * statut cadre n'a de sens que rapporté à l'intitulé qui le précède. Séparés
 * sur deux lignes, ils se lisaient comme deux sujets distincts, et la case
 * isolée dans son propre cadre paraissait plus importante que le champ.
 *
 * ⚠ C'est une CASE À COCHER déguisée en bouton, pas un `<button>` : l'état
 * coché doit rester lisible par un lecteur d'écran et par l'autoremplissage.
 * `sr-only` masque la case à l'œil sans la retirer du DOM.
 */
function ChampPoste({
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
    <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
      <div className="min-w-0 flex-1">
        <Input
          id="poste"
          value={poste}
          onChange={(e) => setPoste(e.target.value)}
          placeholder="Chef de service éducatif, monitrice-éducatrice…"
          autoComplete="organization-title"
        />
        <div className="mt-1.5">
          <Aide>Tel qu’il figure sur votre fiche de poste.</Aide>
        </div>
      </div>
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
        {cadre ? <Check aria-hidden className="size-4" /> : <span aria-hidden className="size-4 rounded border border-current opacity-50" />}
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
      {GROUPES_DROITS.map((groupe) => (
        <fieldset key={groupe.titre}>
          <legend
            className={cn(
              'mb-1 text-xs font-semibold uppercase tracking-wide',
              groupe.sensible ? 'text-secondary' : 'text-muted-foreground',
            )}
          >
            {groupe.titre}
          </legend>
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
        </fieldset>
      ))}
    </div>
  );
}

export function EtapePoste({ onFait }: { onFait: () => void }) {
  const [poste, setPoste] = React.useState('');
  const [cadre, setCadre] = React.useState(false);
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
              ? `${poste.trim() || 'Direction'}${cadre ? ' — cadre' : ''}`
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
      <Carte titre="Votre poste">
        <ChampPoste poste={poste} setPoste={setPoste} cadre={cadre} setCadre={setCadre} />
      </Carte>

      <Carte
        titre="Votre niveau de responsabilité"
        aide="C’est lui qui décide de ce que vous voyez : votre équipe, vos services, ou tout l’établissement."
      >
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
                  <span className="mt-1 block text-xs leading-relaxed" lang="fr">
                    {n.ceQueCaDonne}
                  </span>
                </span>
              </label>
            );
          })}
        </fieldset>

        {choisi.valide && (
          <div className="mt-3">
            <Encart ton="alerte" icone={TriangleAlert} titre="Ce niveau est validé par Les Extras">
              La direction est le seul niveau qui donne la vue sur des équipes que
              vous n’avez pas constituées vous-même : nous le vérifions donc à la
              main. Votre demande part en même temps que cette déclaration, et
              <strong> en attendant, votre compte fonctionne comme celui d’un salarié</strong> —
              vous ne perdez rien, vous n’avez simplement pas encore la vue complète.
            </Encart>
          </div>
        )}
      </Carte>

      <Carte
        titre="Ce que vous pouvez engager pour votre établissement"
        aide={
          <>
            Ces réponses sont déclaratives : elles décident notamment si votre
            bouton dit « Réserver » ou « Demander un devis ». Elles figureront sur
            les demandes que vous émettez, avec votre poste — c’est ce qui permet à
            votre établissement de savoir qui a engagé quoi.
          </>
        }
      >
        <ListeDroits droits={droits} setDroits={setDroits} />

        <div className="mt-3">
          <Encart icone={ShieldCheck} titre="Il n’y a aucun paiement sur la plateforme">
            Ces droits n’engagent jamais d’argent : la mise en relation et la
            contractualisation sont gratuites. Ils disent seulement ce que vous
            pouvez engager au nom de votre établissement.
          </Encart>
        </div>
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
