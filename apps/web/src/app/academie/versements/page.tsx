import { redirect } from 'next/navigation';

/** « Versements » a rejoint la comptabilité de l'académie. */
export default function Versements() {
  redirect('/academie/comptabilite');
}
