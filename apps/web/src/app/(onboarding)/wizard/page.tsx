import { getSession } from '@/lib/session';
import WizardForm from './wizard-form';

/**
 * Le parcours de finalisation diffère selon le type de compte. Le type vit
 * dans la session côté serveur : on le lit ici plutôt que de le redemander
 * au navigateur, qui n'a aucune raison d'en être la source de vérité.
 */
export default async function WizardPage({
  searchParams,
}: {
  searchParams?: { salarie?: string };
}) {
  const session = await getSession();
  const type = session?.activeAccount?.type === 'FREELANCE' ? 'FREELANCE' : 'ESTABLISHMENT';
  // Le dépôt de pièces a besoin du compte actif : sans lui, l'étape
  // « Documents » ne peut rien envoyer — c'était exactement son état.
  return (
    <WizardForm
      typeDeCompte={type}
      accountId={session?.activeAccount?.id ?? null}
      estSalarie={type === 'FREELANCE' && searchParams?.salarie === '1'}
    />
  );
}
