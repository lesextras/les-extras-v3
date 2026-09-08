import { redirect } from 'next/navigation';

/**
 * Le catalogue est devenu l'onglet « Mes programmes » de Mes formations.
 *
 * L'adresse a servi et a pu être mise en favori : elle continue de fonctionner,
 * elle mène simplement là où le contenu vit maintenant.
 */
export default function Page() {
  redirect('/academie/formations');
}
