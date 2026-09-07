import { redirect } from 'next/navigation';

/** Le chemin se coche désormais depuis ses pages publiques, une fois connecté. */
export default function CheminEspacePage() {
  redirect('/chemin');
}
