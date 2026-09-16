'use client';

import * as React from 'react';
import {
  Building,
  Check,
  Loader2,
  Search,
  ShieldCheck,
  TriangleAlert,
  Users,
} from 'lucide-react';
import { apiRequest } from '@/lib/api';
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
/* Étape « structure »                                                       */
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
 * VOTRE STRUCTURE — retrouvée, pas saisie.
 *
 * On cherche d'abord parmi les structures DÉJÀ déclarées sur la plateforme :
 * si dix établissements d'un même groupe s'y sont rattachés, le onzième doit
 * tomber sur la même ligne plutôt que d'en créer une douzième. On interroge
 * l'annuaire public ensuite, pour tout le reste.
 *
 * ⚠ LA SAISIE À LA MAIN RESTE OUVERTE, et il ne faut pas la retirer. Beaucoup
 * de petites associations ne se trouvent pas dans l'annuaire ; les obliger à
 * choisir dans une liste où elles ne figurent pas, c'est les mettre dehors.
 */
export function EtapeStructure({
  onFait,
  onPasser,
}: {
  onFait: () => void;
  onPasser: () => void;
}) {
  const [recherche, setRecherche] = React.useState('');
  const requete = useValeurRetardee(recherche);
  const [chargement, setChargement] = React.useState(false);
  const [declarees, setDeclarees] = React.useState<StructureDeclaree[]>([]);
  const [annuaire, setAnnuaire] = React.useState<EntiteLegale[]>([]);
  const [erreur, setErreur] = React.useState<string | null>(null);
  const [envoi, setEnvoi] = React.useState(false);
  const [manuel, setManuel] = React.useState(false);

  React.useEffect(() => {
    const texte = requete.trim();
    if (texte.length < 3) {
      setDeclarees([]);
      setAnnuaire([]);
      return;
    }
    let annule = false;
    setChargement(true);
    setErreur(null);

    Promise.allSettled([
      apiRequest<StructureDeclaree[]>(`/structures/declarees?q=${encodeURIComponent(texte)}`),
      apiRequest<EntiteLegale[]>(`/structures/annuaire?q=${encodeURIComponent(texte)}`),
    ])
      .then(([d, a]) => {
        if (annule) return;
        setDeclarees(d.status === 'fulfilled' ? d.value : []);
        setAnnuaire(a.status === 'fulfilled' ? a.value : []);
        // On ne fait PAS échouer l'écran si l'annuaire public ne répond pas :
        // la saisie à la main reste possible, et c'est tout ce qui compte.
        if (a.status === 'rejected' && d.status === 'fulfilled' && d.value.length === 0) {
          setErreur(
            'L’annuaire public ne répond pas en ce moment. Vous pouvez saisir votre structure à la main.',
          );
        }
      })
      .finally(() => {
        if (!annule) setChargement(false);
      });

    return () => {
      annule = true;
    };
  }, [requete]);

  async function rattacher(corps: Record<string, unknown>) {
    setEnvoi(true);
    setErreur(null);
    try {
      await apiRequest('/structures/rattacher', { method: 'POST', body: corps });
      onFait();
    } catch (e) {
      setErreur(e instanceof Error ? e.message : 'Rattachement impossible.');
    } finally {
      setEnvoi(false);
    }
  }

  return (
    <div className="space-y-4">
      <Encart icone={Building} titre="Pourquoi cette question">
        Votre structure regroupe vos établissements. C’est elle qui permettra à
        vos collègues d’autres sites de vous retrouver, et à vos documents de
        porter la bonne entité juridique. Elle est facultative : une petite
        association est souvent sa propre structure.
      </Encart>

      {!manuel && (
        <>
          <div>
            <label className="mb-1.5 block text-sm font-medium" htmlFor="recherche-structure">
              Nom de la structure ou numéro SIREN
            </label>
            <Input
              id="recherche-structure"
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              placeholder="Fondation Poidatz, Mairie de Melun, 820051852…"
              leftIcon={chargement ? <Loader2 className="animate-spin" /> : <Search />}
              autoComplete="off"
            />
            <div className="mt-1.5">
              <Aide>Trois caractères suffisent. Nous cherchons dans l’annuaire public des entreprises.</Aide>
            </div>
          </div>

          {declarees.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                Déjà sur Les Extras
              </p>
              {declarees.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  disabled={envoi}
                  onClick={() => rattacher({ structureId: s.id })}
                  className="flex w-full items-start gap-3 rounded-lg border border-border bg-card p-3 text-left transition-colors hover:border-primary/50 disabled:opacity-60"
                >
                  <Users aria-hidden className="mt-0.5 size-4 shrink-0 text-primary" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{s.nom}</span>
                    <span className="block text-xs text-muted-foreground">
                      {[s.formeJuridique, s.ville, s.siren].filter(Boolean).join(' · ')}
                      {s._count?.comptes
                        ? ` · ${s._count.comptes} établissement${s._count.comptes > 1 ? 's' : ''}`
                        : ''}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          )}

          {annuaire.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Annuaire public des entreprises
              </p>
              {annuaire.map((e) => (
                <button
                  key={e.siren}
                  type="button"
                  disabled={envoi}
                  onClick={() =>
                    rattacher({
                      nom: e.nom,
                      siren: e.siren,
                      formeJuridique: e.formeJuridique ?? undefined,
                      adresse: e.adresse ?? undefined,
                      ville: e.ville ?? undefined,
                      codePostal: e.codePostal ?? undefined,
                      // « Vérifiée » ne vaut que pour une entité CHOISIE dans
                      // la liste : une saisie manuelle ne l'est jamais.
                      verifiee: true,
                    })
                  }
                  className="flex w-full items-start gap-3 rounded-lg border border-border bg-card p-3 text-left transition-colors hover:border-primary/50 disabled:opacity-60"
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

          {requete.trim().length >= 3 && !chargement && declarees.length === 0 && annuaire.length === 0 && (
            <Encart ton="neutre">
              Aucun résultat. Beaucoup de petites structures ne figurent pas dans
              l’annuaire public : saisissez la vôtre à la main, elle sera tout
              aussi valable.
            </Encart>
          )}
        </>
      )}

      {manuel && <StructureManuelle envoi={envoi} onValider={rattacher} />}

      {erreur && (
        <Encart ton="alerte" icone={TriangleAlert}>
          {erreur}
        </Encart>
      )}

      <div className="flex flex-wrap gap-2 pt-1">
        <Button type="button" variant="ghost" size="sm" onClick={() => setManuel((v) => !v)}>
          {manuel ? 'Rechercher dans l’annuaire' : 'Saisir ma structure à la main'}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onPasser} className="ml-auto">
          Je n’ai pas de structure de rattachement
        </Button>
      </div>
    </div>
  );
}

function StructureManuelle({
  envoi,
  onValider,
}: {
  envoi: boolean;
  onValider: (corps: Record<string, unknown>) => void;
}) {
  const [nom, setNom] = React.useState('');
  const [ville, setVille] = React.useState('');

  return (
    <div className="space-y-3">
      <div>
        <label className="mb-1.5 block text-sm font-medium" htmlFor="structure-nom">
          Nom de la structure
        </label>
        <Input
          id="structure-nom"
          value={nom}
          onChange={(e) => setNom(e.target.value)}
          placeholder="Association Les Tilleuls"
        />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium" htmlFor="structure-ville">
          Ville <span className="font-normal text-muted-foreground">(facultatif)</span>
        </label>
        <Input
          id="structure-ville"
          value={ville}
          onChange={(e) => setVille(e.target.value)}
          placeholder="Melun"
        />
      </div>
      <Button
        type="button"
        loading={envoi}
        disabled={nom.trim().length < 2}
        onClick={() => onValider({ nom: nom.trim(), ville: ville.trim() || undefined })}
      >
        Enregistrer ma structure
      </Button>
    </div>
  );
}

/* ------------------------------------------------------------------------ */
/* Étape « service »                                                         */
/* ------------------------------------------------------------------------ */

interface VerificationNom {
  libre: boolean;
  motif: 'doublon' | 'nom-vide' | null;
  existant: {
    id: string;
    name: string;
    description: string | null;
    archiveLe: string | null;
    creePar: { id: string; firstName: string | null; lastName: string | null } | null;
    _count: { membres: number };
  } | null;
}

/**
 * VOTRE SERVICE — et le carrefour du doublon.
 *
 * Dans un même établissement il ne peut pas y avoir deux services du même nom.
 * Quand le nom est pris, on ne renvoie pas une erreur rouge : on ouvre les
 * trois sorties. C'est le moment le plus important de ce parcours, parce que
 * c'est là qu'un établissement se construit — ou se scinde en deux organisations
 * parallèles qui ne se voient pas.
 */
export function EtapeService({
  onFait,
  onPasser,
}: {
  onFait: () => void;
  onPasser: () => void;
}) {
  const [nom, setNom] = React.useState('');
  const requete = useValeurRetardee(nom, 450);
  const [verification, setVerification] = React.useState<VerificationNom | null>(null);
  const [verifie, setVerifie] = React.useState(false);
  const [envoi, setEnvoi] = React.useState(false);
  const [erreur, setErreur] = React.useState<string | null>(null);
  const [message, setMessage] = React.useState<string | null>(null);

  React.useEffect(() => {
    const texte = requete.trim();
    if (texte.length < 2) {
      setVerification(null);
      return;
    }
    let annule = false;
    setVerifie(true);
    apiRequest<VerificationNom>(`/units/verifier-nom?nom=${encodeURIComponent(texte)}`)
      .then((r) => {
        if (!annule) setVerification(r);
      })
      .catch(() => {
        if (!annule) setVerification(null);
      })
      .finally(() => {
        if (!annule) setVerifie(false);
      });
    return () => {
      annule = true;
    };
  }, [requete]);

  const doublon = verification?.motif === 'doublon' ? verification.existant : null;

  async function creer() {
    setEnvoi(true);
    setErreur(null);
    try {
      await apiRequest('/units', { method: 'POST', body: { name: nom.trim() } });
      onFait();
    } catch (e) {
      setErreur(e instanceof Error ? e.message : 'Création impossible.');
    } finally {
      setEnvoi(false);
    }
  }

  async function demander(motif: 'REJOINDRE' | 'SIGNALEMENT') {
    if (!doublon) return;
    setEnvoi(true);
    setErreur(null);
    try {
      await apiRequest('/units/demandes', {
        method: 'POST',
        body: { orgUnitId: doublon.id, motif },
      });
      setMessage(
        motif === 'REJOINDRE'
          ? `Votre demande est partie${
              doublon.creePar?.firstName ? ` à ${doublon.creePar.firstName}` : ''
            }. Vous serez rattaché au service dès qu’elle sera acceptée — vous pouvez continuer sans attendre.`
          : 'Votre signalement est parti à Les Extras. Nous regardons ce service et revenons vers vous.',
      );
    } catch (e) {
      setErreur(e instanceof Error ? e.message : 'Demande impossible.');
    } finally {
      setEnvoi(false);
    }
  }

  return (
    <div className="space-y-4">
      <Encart icone={Users} titre="Pourquoi cette question">
        Le service est ce qui vous relie à votre équipe : plannings, demandes de
        renfort, organigramme. Un chef de service voit les personnes de ses
        services — pas tout l’établissement.
      </Encart>

      <div>
        <label className="mb-1.5 block text-sm font-medium" htmlFor="nom-service">
          Nom de votre service
        </label>
        <Input
          id="nom-service"
          value={nom}
          onChange={(e) => {
            setNom(e.target.value);
            setMessage(null);
          }}
          placeholder="Internat, Pôle jour, SESSAD…"
          leftIcon={verifie ? <Loader2 className="animate-spin" /> : <Users />}
          autoComplete="off"
        />
        <div className="mt-1.5">
          <Aide>
            Écrivez-le comme votre équipe le dit. « SESSAD », « Sessad » et
            « S.E.S.S.A.D. » sont reconnus comme le même service.
          </Aide>
        </div>
      </div>

      {verification?.libre && nom.trim().length >= 2 && (
        <Encart ton="succes" icone={Check} titre="Ce nom est libre">
          Vous allez créer ce service. Vous pourrez ensuite y inviter vos
          collègues, sans attendre que votre direction ouvre un compte.
        </Encart>
      )}

      {/* LE CARREFOUR DU DOUBLON — trois sorties, jamais un mur. */}
      {doublon && !message && (
        <div className="space-y-2.5 rounded-lg border-2 border-secondary/40 bg-secondary/10 p-3.5">
          <p className="text-sm font-semibold">
            Un service « {doublon.name} » existe déjà dans cet établissement.
          </p>
          <p className="text-xs leading-relaxed text-muted-foreground" lang="fr">
            {doublon.creePar
              ? `Créé par ${[doublon.creePar.firstName, doublon.creePar.lastName].filter(Boolean).join(' ')}`
              : 'Créé par un collègue'}
            {doublon._count.membres > 0
              ? `, ${doublon._count.membres} personne${doublon._count.membres > 1 ? 's y sont rattachées' : ' y est rattachée'}.`
              : '.'}{' '}
            Deux services du même nom couperaient votre équipe en deux.
          </p>

          <div className="grid gap-2 pt-0.5">
            <Button type="button" loading={envoi} onClick={() => demander('REJOINDRE')}>
              Demander à rejoindre ce service
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setNom('');
                setVerification(null);
              }}
            >
              Ce n’est pas le mien — préciser mon nom
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={envoi}
              onClick={() => demander('SIGNALEMENT')}
            >
              Ce service n’existe plus — signaler à Les Extras
            </Button>
          </div>
          <Aide>
            « Préciser mon nom » sert quand ce sont deux services différents qui
            portent le même sigle : « SESSAD Melun », « SESSAD Sénart ».
          </Aide>
        </div>
      )}

      {message && (
        <Encart ton="succes" icone={Check}>
          {message}
        </Encart>
      )}

      {erreur && (
        <Encart ton="alerte" icone={TriangleAlert}>
          {erreur}
        </Encart>
      )}

      <div className="flex flex-wrap items-center gap-2 pt-1">
        {verification?.libre && (
          <Button type="button" loading={envoi} onClick={creer}>
            Créer ce service
          </Button>
        )}
        <Button type="button" variant="ghost" size="sm" onClick={onPasser} className="ml-auto">
          {message ? 'Continuer' : 'Je le ferai plus tard'}
        </Button>
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

/** Les droits déclarés, dans les mots du métier. */
const DROITS: { cle: string; libelle: string; aide: string }[] = [
  {
    cle: 'RESERVER_DIRECT',
    libelle: 'Réserver un intervenant directement',
    aide: 'Sinon, votre bouton dira « Demander un devis ».',
  },
  {
    cle: 'DEMANDER_RENFORT_INTERNE',
    libelle: 'Demander du renfort en interne',
    aide: 'Solliciter les salariés de votre établissement.',
  },
  {
    cle: 'OUVRIR_RENFORT_CDD',
    libelle: 'Ouvrir un renfort en CDD',
    aide: 'Publier une mission auprès du réseau.',
  },
  {
    cle: 'VALIDER_INSCRIPTIONS',
    libelle: 'Valider les ateliers et les formations',
    aide: 'Pour les personnes de votre service.',
  },
  {
    cle: 'SIGNER_CONVENTIONS',
    libelle: 'Signer les conventions',
    aide: 'Engager l’établissement sur un document.',
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
      onFait();
    } catch (e) {
      setErreur(e instanceof Error ? e.message : 'Enregistrement impossible.');
    } finally {
      setEnvoi(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1.5 block text-sm font-medium" htmlFor="poste">
          Votre poste
        </label>
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

      <label className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-border bg-card p-3">
        <input
          type="checkbox"
          checked={cadre}
          onChange={(e) => setCadre(e.target.checked)}
          className="size-4 rounded border-input text-primary focus-visible:ring-2 focus-visible:ring-ring"
        />
        <span className="text-sm">Je suis cadre</span>
      </label>

      <fieldset className="space-y-2">
        <legend className="mb-1.5 text-sm font-medium">Votre niveau de responsabilité</legend>
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
        <Encart ton="alerte" icone={TriangleAlert} titre="Ce niveau est validé par Les Extras">
          La direction est le seul niveau qui donne la vue sur des équipes que
          vous n’avez pas constituées vous-même : nous le vérifions donc à la
          main. Votre demande part en même temps que cette déclaration, et
          <strong> en attendant, votre compte fonctionne comme celui d’un salarié</strong> —
          vous ne perdez rien, vous n’avez simplement pas encore la vue complète.
        </Encart>
      )}

      <fieldset className="space-y-2">
        <legend className="mb-1 text-sm font-medium">
          Ce que vous pouvez engager pour votre établissement
        </legend>
        <Aide>
          Ces réponses sont déclaratives : elles décident notamment si votre
          bouton dit « Réserver » ou « Demander un devis ». Elles figureront sur
          les demandes que vous émettez, avec votre poste — c’est ce qui permet à
          votre établissement de savoir qui a engagé quoi.
        </Aide>
        <div className="space-y-1.5 pt-1">
          {DROITS.map((d) => (
            <label
              key={d.cle}
              className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-border bg-card p-2.5"
            >
              <input
                type="checkbox"
                checked={droits.includes(d.cle)}
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
          ))}
        </div>
      </fieldset>

      <Encart icone={ShieldCheck} titre="Il n’y a aucun paiement sur la plateforme">
        Ces droits n’engagent jamais d’argent : la mise en relation et la
        contractualisation sont gratuites. Ils disent seulement ce que vous
        pouvez engager au nom de votre établissement.
      </Encart>

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
