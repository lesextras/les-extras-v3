import { getSession } from '@/lib/session';
import { fetchApi } from '../../_shared/server';
import type { Session } from '@/lib/types';
import WizardForm from './wizard-form';

/**
 * Le parcours de finalisation diffère selon le type de compte. Le type vit
 * dans la session côté serveur : on le lit ici plutôt que de le redemander
 * au navigateur, qui n'a aucune raison d'en être la source de vérité.
 */
export default async function WizardPage({
  searchParams: searchParamsPromesse,
}: {
  searchParams?: Promise<{ salarie?: string }>;
}) {
  const searchParams = await searchParamsPromesse;
  const session = await getSession();
  const type = session?.activeAccount?.type === 'FREELANCE' ? 'FREELANCE' : 'ESTABLISHMENT';

  // LE PROFIL SALARIÉ NE SE DÉDUIT PLUS DE L'URL.
  //
  // `?salarie=1` n'est posé qu'une seule fois, par le formulaire d'inscription.
  // La page de connexion, elle, renvoie sur `/welcome` sans ce paramètre : il
  // suffisait donc de fermer l'onglet et de revenir pour perdre l'étape
  // « Établissement » — celle qui conditionne TOUT le compte d'un salarié.
  // Sans elle, aucune demande de rattachement n'est déposée, et la personne
  // atterrit sur le mur « en attente de rattachement » sans savoir pourquoi.
  //
  // L'information existe pourtant en base (`Account.profilSalarie`) et
  // `/auth/me` la renvoie déjà. On la lit là où elle fait autorité, et le
  // paramètre d'URL n'est plus qu'un repli pour le cas où l'appel échoue —
  // c'est-à-dire pour le tout premier passage, juste après l'inscription.
  let estSalarie = type === 'FREELANCE' && searchParams?.salarie === '1';
  if (type === 'FREELANCE' && session) {
    const { data } = await fetchApi<{
      memberships?: { account?: { type?: string; profilSalarie?: boolean } | null }[];
    }>(session as Session, '/auth/me');
    const declare = data?.memberships?.some(
      (m) => m.account?.type === 'FREELANCE' && m.account?.profilSalarie === true,
    );
    if (declare !== undefined && data) estSalarie = declare;
  }

  // Le dépôt de pièces a besoin du compte actif : sans lui, l'étape
  // « Documents » ne peut rien envoyer — c'était exactement son état.
  return (
    <WizardForm
      typeDeCompte={type}
      accountId={session?.activeAccount?.id ?? null}
      estSalarie={estSalarie}
    />
  );
}
