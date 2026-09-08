import { redirect } from 'next/navigation';

/**
 * Les statistiques ont rejoint le tableau de bord.
 *
 * L'adresse a servi et a pu être mise en favori : elle continue de fonctionner,
 * elle mène simplement là où le contenu vit maintenant.
 */
export default function Page() {
  redirect('/academie');
}
