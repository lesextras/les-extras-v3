import type { Metadata } from 'next';
import { apiAcademie, sessionAcademie } from '../_session';
import { Encart, Titre } from '../_ui';
import { Equipe, type Invitation, type Membre } from './Equipe';

export const metadata: Metadata = { title: "Droits d'accès" };

interface PageMembres {
  items?: Membre[];
}

/**
 * `/academie/droits-acces` — QUI ENTRE, ET JUSQU'OÙ.
 *
 * Deux listes et une seule idée : personne n'est créé ici. On invite par son
 * adresse, la personne crée son compte elle-même, et elle apparaît alors dans
 * l'équipe avec le rôle qu'on lui a donné. C'est aussi ce que l'audit demande
 * au titre du critère 5 : savoir qui intervient, et à quel titre.
 */
export default async function DroitsAccesPage() {
  const s = await sessionAcademie('/academie/droits-acces');
  const [membres, invitations] = await Promise.all([
    apiAcademie<PageMembres | Membre[]>(s, '/memberships?perPage=100'),
    apiAcademie<Invitation[]>(s, '/invitations'),
  ]);

  const brut = membres.data;
  const liste = Array.isArray(brut) ? brut : Array.isArray(brut?.items) ? brut.items : null;

  return (
    <>
      <Titre
        surtitre="Ton équipe"
        sousTitre="Invite ton équipe et choisis ce que chacun peut faire."
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
