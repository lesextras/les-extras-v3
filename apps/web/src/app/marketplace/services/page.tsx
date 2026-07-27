import { redirect } from 'next/navigation';

/** /marketplace/services n'a pas de liste dédiée : on renvoie vers la
 *  marketplace filtrée sur les ateliers (cible du fil d'Ariane). */
export default function MarketplaceServicesIndex() {
  redirect('/marketplace?type=services');
}
