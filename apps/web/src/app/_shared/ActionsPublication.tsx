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

  // UNE SEULE ACTION PRINCIPALE.
  //
  // Les trois publications avaient chacune leur couleur pleine — framboise,
  // bleu nuit, vert forêt — alignées et de même poids. Trois boutons qui
  // crient aussi fort, c'est aucune priorité : la personne qui arrive ne sait
  // pas par où commencer. On garde donc UN bouton plein, celui du besoin
  // dominant du profil (couvrir une absence pour un établissement, vendre une
  // prestation pour un intervenant), et les deux autres passent en retrait.
  // Rien n'est retiré : tout reste à un clic, mais l'œil sait où aller.
  const renfort = (
    <RenfortModal
      key="renfort"
      accountId={accountId}
      trigger={
        <Button variant={etablissement ? 'primary' : 'outline'}>Publier un renfort</Button>
      }
    />
  );
  const atelier = (
    <ServiceModal
      key="atelier"
      accountId={accountId}
      categorieInitiale="ATELIER"
      trigger={
        <Button variant={etablissement ? 'outline' : 'primary'}>Publier un atelier</Button>
      }
    />
  );
  const formation = (
    <ServiceModal
      key="formation"
      accountId={accountId}
      categorieInitiale="FORMATION"
      trigger={<Button variant="outline">Publier une formation</Button>}
    />
  );

  return (
    <div className="flex flex-wrap items-center gap-2">
      {etablissement ? [renfort, atelier, formation] : [atelier, formation, renfort]}
    </div>
  );
}
