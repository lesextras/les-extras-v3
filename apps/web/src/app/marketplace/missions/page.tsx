import { redirect } from 'next/navigation';

/** /marketplace/missions n'a pas de liste dédiée : on renvoie vers la
 *  marketplace filtrée sur les missions (cible du fil d'Ariane). */
export default function MarketplaceMissionsIndex() {
  redirect('/marketplace?type=missions');
}
