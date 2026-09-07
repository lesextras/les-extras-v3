import { redirect } from 'next/navigation';

/** La demande de subvention vit dans le chemin (partie 3) : une seule porte. */
export default function SubventionPage() {
  redirect('/chemin#partie-3');
}
