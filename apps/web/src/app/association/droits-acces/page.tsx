import type { Metadata } from 'next';
import { apiEspace, sessionAssociation } from '../_session';
import { Encart, Titre } from '../_ui';
import { Equipe, type Invitation, type Membre } from './Equipe';

export const metadata: Metadata = { title: "Droits d'accès" };

interface PageMembres {
  items?: Membre[];
}

/**
 * `/association/droits-acces` — QUI ENTRE, ET JUSQU'OÙ.
 *
 * Deux listes et une seule idée : personne n'est créé ici. On invite par son
 * adresse, la personne crée son compte elle-même, et elle apparaît alors dans
 * l'équipe avec le rôle qu'on lui a donné.
 */
export default async function DroitsAccesPage() {
  const s = await sessionAssociation('/association/droits-acces');
  const [membres, invitations] = await Promise.all([
    apiEspace<PageMembres | Membre[]>(s, '/memberships?perPage=100'),
    apiEspace<Invitation[]>(s, '/invitations'),
  ]);

  const brut = membres.data;
  const liste = Array.isArray(brut) ? brut : Array.isArray(brut?.items) ? brut.items : null;

  return (
    <>
      <Titre
        surtitre="Ton équipe"
        sousTitre="Chacun entre avec son propre compte : tu invites par l'adresse e-mail, la personne s'inscrit elle-même, et tu décides jusqu'où elle peut aller."
      >
        Droits d&apos;accès
      </Titre>

      {liste ? (
        <Equipe membres={liste} invitations={Array.isArray(invitations.data) ? invitations.data : []} />
      ) : (
        <Encart ton="attention">{membres.error ?? "L'équipe ne se charge pas pour le moment."}</Encart>
      )}
    </>
  );
}
