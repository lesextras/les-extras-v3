import { redirect } from 'next/navigation';

/** La gestion budgétaire a sa page : « Ma comptabilité ». */
export default function AncienBudget() {
  redirect('/espace/comptabilite');
}
