// Boutons de publication de l'en-tête du tableau de bord.
//
// Règle : on n'affiche QUE ce que le serveur autorisera réellement. Un bouton
// qui mène à un 403 est pire que pas de bouton — il fait passer un refus
// d'autorisation pour une panne.
//
// Un compte = une personne (24/09/2026) : la personne du compte publie. La
// règle vit dans `lib/publication.ts`.
import { RenfortModal } from "./modals/RenfortModal";
import { ServiceModal } from "./modals/ServiceModal";
import { Button } from "@/components/ui/button";
import type { AccountRole, AccountType } from "@/lib/types";
// ⚠ La règle vit dans `lib/publication.ts` depuis le 16/09/2026 : elle était
// écrite ici et NULLE PART AILLEURS, alors que `/dashboard/ateliers` monte la
// même modale à trois endroits sans regarder le rôle.
import { peutPublier } from "@/lib/publication";

export function ActionsPublication({
  accountId,
  accountType,
  role,
}: {
  accountId: string;
  accountType: AccountType;
  role: AccountRole;
}) {
  if (!peutPublier(role)) return null;

  const etablissement = accountType === "ESTABLISHMENT";

  // UNE ACTION PRINCIPALE, ET CE QUI RELÈVE VRAIMENT DU PROFIL.
  //
  // Trois boutons de même poids, c'était trop : « Publier un atelier » et
  // « Publier un renfort » s'affichaient des DEUX côtés de la place de
  // marché. On proposait à une directrice de MECS de vendre un atelier, et à
  // un éducateur indépendant de recruter un remplaçant — le métier d'en face,
  // à chaque fois.
  //
  // ⚠ PLUS DE BOUTON « FORMATION » (28/09/2026, décision de Siham) : ni
  // « Organiser une formation » côté structure, ni « Proposer une formation »
  // côté intervenant. Les formations ont quitté Les Extras pour adepa77.fr, le
  // site du centre de formation ADéPA. Reste un bouton par profil : le geste
  // dominant du métier de la personne qui le voit.
  if (etablissement) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <RenfortModal
          accountId={accountId}
          trigger={<Button variant="primary">Publier un renfort</Button>}
        />
      </div>
    );
  }

  // Côté intervenant : son atelier.
  return (
    <div className="flex flex-wrap items-center gap-2">
      <ServiceModal
        accountId={accountId}
        categorieInitiale="ATELIER"
        trigger={<Button variant="primary">Créer un atelier</Button>}
      />
    </div>
  );
}
