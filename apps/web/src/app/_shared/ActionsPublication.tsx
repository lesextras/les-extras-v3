// Boutons de publication de l'en-tête du tableau de bord.
//
// Règle : on n'affiche QUE ce que le serveur autorisera réellement. Un bouton
// qui mène à un 403 est pire que pas de bouton — il fait passer un refus
// d'autorisation pour une panne.
//
// Côté API, créer une mission de renfort ou une fiche exige un rôle
// OWNER, ADMIN ou MANAGER sur le compte actif (AccountRolesGuard). Un MEMBER
// consulte et candidate, il ne publie pas. C'est cette règle, et elle seule,
// qui est reproduite ici.
import { RenfortModal } from "./modals/RenfortModal";
import { ServiceModal } from "./modals/ServiceModal";
import { Button } from "@/components/ui/button";
import type { AccountRole, AccountType } from "@/lib/types";

/** Rôles autorisés à publier, à l'identique de l'API. */
const PEUT_PUBLIER: AccountRole[] = ["OWNER", "ADMIN", "MANAGER"];

export function ActionsPublication({
  accountId,
  accountType,
  role,
}: {
  accountId: string;
  accountType: AccountType;
  role: AccountRole;
}) {
  if (!PEUT_PUBLIER.includes(role)) return null;

  const etablissement = accountType === "ESTABLISHMENT";

  // UNE ACTION PRINCIPALE, ET CE QUI RELÈVE VRAIMENT DU PROFIL.
  //
  // Trois boutons de même poids, c'était trop : « Publier un atelier » et
  // « Publier un renfort » s'affichaient des DEUX côtés de la place de
  // marché. On proposait à une directrice de MECS de vendre un atelier, et à
  // un éducateur indépendant de recruter un remplaçant — le métier d'en face,
  // à chaque fois.
  //
  // Mais j'étais allé trop loin en ne gardant qu'un seul bouton : un
  // établissement ORGANISE des formations en interne, animées par un salarié
  // référent, et c'est un geste courant, pas une exception. Le retirer de
  // l'en-tête revenait à le cacher. Il revient donc, en second.
  //
  // Un bouton plein pour le geste dominant du profil, un bouton en retrait
  // pour l'autre. Les deux appartiennent bien à la personne qui les voit.
  if (etablissement) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <RenfortModal
          accountId={accountId}
          trigger={<Button variant="primary">Publier un renfort</Button>}
        />
        <ServiceModal
          accountId={accountId}
          categorieInitiale="FORMATION"
          trigger={<Button variant="outline">Organiser une formation</Button>}
        />
      </div>
    );
  }

  // Côté intervenant : son atelier d'abord, et la formation qu'il peut
  // proposer à la validation d'ADéPA juste après.
  return (
    <div className="flex flex-wrap items-center gap-2">
      <ServiceModal
        accountId={accountId}
        categorieInitiale="ATELIER"
        trigger={<Button variant="primary">Créer un atelier</Button>}
      />
      <ServiceModal
        accountId={accountId}
        categorieInitiale="FORMATION"
        trigger={<Button variant="outline">Proposer une formation</Button>}
      />
    </div>
  );
}
