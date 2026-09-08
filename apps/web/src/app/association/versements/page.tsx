import { redirect } from 'next/navigation';

/**
 * « VERSEMENTS » A REJOINT LA COMPTABILITÉ.
 *
 * L'argent d'une association ne se lit pas à deux endroits : les subventions
 * accordées, ce qui est déjà versé et ce qui reste attendu vivent avec le
 * cahier de comptes. Cette adresse reste valable — elle emmène là-bas.
 */
export default function Versements() {
  redirect('/espace/comptabilite#versements');
}
