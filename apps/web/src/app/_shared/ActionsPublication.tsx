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

  // UNE SEULE ACTION PRINCIPALE — CETTE FOIS POUR DE BON.
  //
  // Le commentaire disait déjà « une seule action principale », et trois
  // boutons s'affichaient quand même : un seul plein, deux en retrait. Trois
  // propositions alignées restent trois propositions — et deux d'entre elles
  // relèvent du métier d'en face. On proposait à une directrice de MECS de
  // VENDRE un atelier, et à un éducateur indépendant de RECRUTER un
  // remplaçant. Ce n'est pas seulement encombrant : c'est déroutant.
  //
  // On garde donc le geste du profil, et lui seul. Le reste n'est pas retiré
  // du produit : atelier et formation restent dans le menu de gauche, à un
  // clic, pour qui les cherche vraiment.
  if (etablissement) {
    return (
      <RenfortModal
        accountId={accountId}
        trigger={<Button variant="primary">Publier un renfort</Button>}
      />
    );
  }

  return (
    <ServiceModal
      accountId={accountId}
      categorieInitiale="ATELIER"
      trigger={<Button variant="primary">Créer un atelier</Button>}
    />
  );
}
