/* Textes allégés le 01/10/2026 (demande : le moins de texte possible) */
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
        sousTitre="Financeurs, élus, partenaires."
        info="Noté une fois, réutilisé dans tes demandes, courriers et comptes rendus."
      >
        Mes contacts
      </Titre>

      <section className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Tuile libelle="Partenaires" valeur={partenaires} />
        <Tuile libelle="Financeurs" valeur={financeurs} ton={financeurs ? 'ok' : 'neutre'} />
        <Tuile libelle="Institutionnels" valeur={institutionnels} />
        <Tuile libelle="Divers" valeur={divers} />
      </section>

      <Repertoire contacts={contacts} mode="CONTACTS" />

      <p className="mt-6 flex flex-wrap gap-x-4 gap-y-1 text-sm text-[#6B6A8A]">
        <Link href="/espace/dossiers" className="font-bold text-[#4F46E5] underline underline-offset-4">
          Mes dossiers
        </Link>
        <Link href="/espace/repertoire" className="font-bold text-[#4F46E5] underline underline-offset-4">
          Mon équipe
        </Link>
      </p>
    </>
  );
}
