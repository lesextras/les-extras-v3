import { redirect } from 'next/navigation';

/** La gestion budgétaire vit maintenant dans « Mon secrétariat ». */
export default function AncienBudget() {
  redirect('/espace/secretariat#comptes');
}
