import { redirect } from 'next/navigation';

/** La recherche de financeurs vit maintenant dans « Mes projets ». */
export default function AncienFinanceurs() {
  redirect('/espace/projets#financeurs');
}
