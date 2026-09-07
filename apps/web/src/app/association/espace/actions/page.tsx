import { redirect } from 'next/navigation';

/** « Mes actions » s'appelle « Mes projets », pour parler comme le chemin. */
export default function AnciennesActions() {
  redirect('/espace/projets');
}
