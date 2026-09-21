import Link from 'next/link';
import { apiEspace, sessionAssociation } from '../../_session';
import { Encart, Titre, Tuile } from '../../_ui';
import type { Contact, ResumeContacts } from '../_types';
import { Repertoire } from '../repertoire/Repertoire';

const ROLES_CLASSES = ['PARTENAIRE', 'FINANCEUR', 'ELU', 'INSTITUTIONNEL'];
const ROLES_INTERNES = ['PRESIDENT', 'TRESORIER', 'SECRETAIRE', 'MEMBRE_BUREAU', 'MEMBRE', 'BENEVOLE', 'SALARIE'];

/**
 * MES CONTACTS : tout ce qu'il y a autour de l'association, rangé en quatre
 * familles — partenaires, financeurs, contacts institutionnels, contacts
 * divers. C'est le même répertoire que l'équipe : une personne notée ici
 * ressert partout ailleurs, sans la retaper.
 */
export default async function ContactsPage() {
  const s = await sessionAssociation('/espace/partenaires');
  const { data, error } = await apiEspace<{ contacts: Contact[]; resume: ResumeContacts }>(s, '/association/repertoire');
  if (!data) return <Encart ton="attention">{error ?? 'Le répertoire ne se charge pas pour le moment.'}</Encart>;
  const { contacts } = data;

  const compte = (codes: string[]) => contacts.filter((c) => c.roles.some((r) => codes.includes(r))).length;
  const partenaires = compte(['PARTENAIRE']);
  const financeurs = compte(['FINANCEUR']);
  const institutionnels = compte(['INSTITUTIONNEL', 'ELU']);
  const divers = contacts.filter(
    (c) => c.roles.includes('AUTRE') || (!c.roles.some((r) => ROLES_CLASSES.includes(r)) && !c.roles.some((r) => ROLES_INTERNES.includes(r))),
  ).length;

  return (
    <>
      <Titre
        surtitre="Autour de l'association"
        sousTitre="Un nom, un poste, un téléphone, et sa famille : qui finance, qui décide à la mairie, qui agit avec vous. Noté une fois ici, il ressert partout, dans tes demandes, dans tes courriers, dans tes comptes rendus."
      >
        Mes contacts
      </Titre>

      <section className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Tuile libelle="Partenaires" valeur={partenaires} detail="Ceux qui agissent avec vous" />
        <Tuile libelle="Financeurs" valeur={financeurs} detail="Ceux qui donnent de l'argent" ton={financeurs ? 'ok' : 'neutre'} />
        <Tuile libelle="Institutionnels" valeur={institutionnels} detail="Mairie, CAF, département, élus" />
        <Tuile libelle="Divers" valeur={divers} detail="Presse, prestataires, voisins…" />
      </section>

      <Repertoire contacts={contacts} mode="CONTACTS" />

      <p className="mt-6 text-sm text-[#6B6A8A]">
        Un financeur noté ici se propose tout seul quand tu crées une demande dans{' '}
        <Link href="/espace/dossiers" className="font-bold text-[#4F46E5] underline underline-offset-4">
          mes subventions et appels à projet
        </Link>
        . L&apos;équipe de l&apos;association, elle, est{' '}
        <Link href="/espace/repertoire" className="font-bold text-[#4F46E5] underline underline-offset-4">
          sur sa propre page
        </Link>
        .
      </p>
    </>
  );
}
