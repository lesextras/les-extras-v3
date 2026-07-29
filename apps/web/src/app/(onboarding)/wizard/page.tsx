import { getSession } from '@/lib/session';
import WizardForm from './wizard-form';

/**
 * Le parcours de finalisation diffère selon le type de compte. Le type vit
 * dans la session côté serveur : on le lit ici plutôt que de le redemander
 * au navigateur, qui n'a aucune raison d'en être la source de vérité.
 */
export default async function WizardPage() {
  const session = await getSession();
  const type = session?.activeAccount?.type === 'FREELANCE' ? 'FREELANCE' : 'ESTABLISHMENT';
  return <WizardForm typeDeCompte={type} />;
}
