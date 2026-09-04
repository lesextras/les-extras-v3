/**
 * Complétude d'une fiche atelier — ce qui manque, et pourquoi ça manque.
 *
 * D'OÙ VIENT CE FICHIER. Au 3 septembre 2026, le catalogue portait treize
 * ateliers publiés. Trois d'entre eux (déposés à la main dans l'application)
 * avaient durée, participants, matériel, prérequis, créneaux, objectifs,
 * déroulé et évaluation. Les dix autres, importés du catalogue WordPress,
 * n'avaient que description + public + ville + prix + images : les champs
 * pédagogiques n'existaient pas de l'autre côté, il n'y avait donc rien à
 * importer. Résultat visible par n'importe quel visiteur : deux fiches côte à
 * côte dans la même grille, l'une complète, l'autre qui a l'air abandonnée.
 *
 * Personne ne s'en était aperçu parce que RIEN NE LE DISAIT. L'intervenant qui
 * dépose sa fiche voit un formulaire dont la moitié des champs sont facultatifs
 * et repliés ; une fois publiée, la fiche ne lui reproche jamais rien. C'est ce
 * silence que ce module casse : un état visible dans son espace, avec la liste
 * de ce qui manque et la raison de chaque manque.
 *
 * ⚠ AUCUN CHAMP N'EST RENDU OBLIGATOIRE PAR CE FICHIER. Bloquer la publication
 * d'une fiche incomplète mettrait dehors les dix fiches déjà en ligne, et
 * punirait des intervenants qui n'ont jamais rien fait de mal. On informe, on
 * n'interdit pas.
 */

export interface FichePourCompletude {
  description?: string | null;
  objectives?: string | null;
  methodology?: string | null;
  evaluation?: string | null;
  duration?: string | null;
  durationMinutes?: number | null;
  maxParticipants?: number | null;
  material?: string | null;
  prerequisites?: string | null;
  timeSlots?: string[] | null;
  price?: string | number | null;
  city?: string | null;
  publicTargets?: string[] | null;
  images?: string[] | null;
}

export interface PointDeCompletude {
  /** Nom du champ, tel qu'il s'appelle dans le formulaire. */
  champ: string;
  /** Libellé affiché — le même mot que sur le formulaire, sinon on cherche. */
  label: string;
  /** Ce que ce champ change pour celui qui lit la fiche. */
  pourquoi: string;
  rempli: boolean;
  /**
   * `socle` : sans lui, un chef de service ne peut pas décider.
   * `confort` : la fiche fonctionne sans, mais elle convainc moins.
   */
  niveau: "socle" | "confort";
}

const vide = (v: unknown) =>
  v === null ||
  v === undefined ||
  (typeof v === "string" && v.trim() === "") ||
  (Array.isArray(v) && v.length === 0);

export function analyserFiche(f: FichePourCompletude): PointDeCompletude[] {
  const p = (
    champ: string,
    label: string,
    pourquoi: string,
    valeur: unknown,
    niveau: "socle" | "confort" = "socle",
  ): PointDeCompletude => ({ champ, label, pourquoi, rempli: !vide(valeur), niveau });

  return [
    p("description", "Description", "C'est la première chose qu'on lit.", f.description),
    p(
      "duration",
      "Durée",
      "Un chef de service cale l'atelier dans un planning : sans durée, il ne peut pas.",
      // Les deux champs disent la même chose à l'utilisateur : « 2H » écrit à la
      // main, ou 120 minutes normalisées. L'un des deux suffit.
      f.duration || f.durationMinutes,
    ),
    p(
      "maxParticipants",
      "Participants maximum",
      "Décide si l'atelier tient avec le groupe qu'on a : ou s'il faut deux séances.",
      f.maxParticipants,
    ),
    p(
      "price",
      "Prix",
      "Une fiche sans prix ne se compare pas, donc ne se choisit pas.",
      f.price,
    ),
    p(
      "objectives",
      "Objectifs",
      "Ce que les participants savent faire après. C'est ce qui distingue un atelier d'une animation.",
      f.objectives,
    ),
    p(
      "methodology",
      "Déroulé et méthode",
      "Comment la séance se passe, minute par minute. C'est la question qu'on pose toujours au téléphone.",
      f.methodology,
    ),
    p(
      "evaluation",
      "Évaluation",
      "Comment on sait que ça a servi. Un financeur le demande, une équipe aussi.",
      f.evaluation,
    ),
    p(
      "material",
      "Matériel et lieu",
      "Ce que l'établissement doit prévoir, et ce que vous apportez. Évite l'atelier annulé le matin même.",
      f.material,
    ),
    p(
      "prerequisites",
      "Prérequis",
      "Ce qu'il faut avant : ou « Aucun », qui est une réponse à part entière.",
      f.prerequisites,
    ),
    p(
      "timeSlots",
      "Créneaux proposés",
      "Sans créneaux, la demande de réservation part sans heure et il faut rappeler.",
      f.timeSlots,
    ),
    p("city", "Ville ou département", "Le filtre le plus utilisé du catalogue.", f.city),
    p(
      "publicTargets",
      "Publics concernés",
      "Le second filtre du catalogue : sans lui, la fiche ne sort d'aucune recherche.",
      f.publicTargets,
    ),
    p(
      "images",
      "Photos",
      "Une fiche sans image est ouverte deux fois moins souvent que ses voisines.",
      f.images,
      "confort",
    ),
  ];
}

export interface Completude {
  points: PointDeCompletude[];
  manquants: PointDeCompletude[];
  remplis: number;
  total: number;
  /** 0 à 100, arrondi. */
  pourcentage: number;
  /** Vrai quand il ne manque plus rien du socle. */
  socleComplet: boolean;
}

export function completude(f: FichePourCompletude): Completude {
  const points = analyserFiche(f);
  const remplis = points.filter((x) => x.rempli).length;
  const manquants = points.filter((x) => !x.rempli);
  return {
    points,
    manquants,
    remplis,
    total: points.length,
    pourcentage: Math.round((remplis / points.length) * 100),
    socleComplet: !manquants.some((x) => x.niveau === "socle"),
  };
}
