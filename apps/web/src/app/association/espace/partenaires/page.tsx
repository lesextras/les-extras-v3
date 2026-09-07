import Link from 'next/link';
import { apiEspace, sessionAssociation } from '../../_session';
import { Encart, Titre, Tuile } from '../../_ui';
import type { Contact, ResumeContacts } from '../_types';
import { Repertoire } from '../repertoire/Repertoire';

/**
 * MES PARTENAIRES ET LEURS RÔLES : la mairie, le financeur, l'élu, l'école.
 * Le même répertoire, filtré sur ce qu'il y a autour de l'association.
 */
export default async function PartenairesPage() {
  const s = await sessionAssociation('/espace/partenaires');
  const { data, error } = await apiEspace<{ contacts: Contact[]; resume: ResumeContacts }>(s, '/association/repertoire');
  if (!data) return <Encart ton="attention">{error ?? 'Le répertoire ne se charge pas pour le moment.'}</Encart>;
  const { contacts, resume } = data;
  const financeurs = contacts.filter((c) => c.roles.includes('FINANCEUR')).length;
  const elus = contacts.filter((c) => c.roles.includes('ELU')).length;

  return (
    <>
      <Titre
        surtitre="Autour de l'association"
        sousTitre="Un nom, un téléphone, et son rôle : qui finance, qui décide à la mairie, qui agit avec vous. Le jour où il faut appeler, on ne cherche plus."
      >
        Mes partenaires et leurs rôles
      </Titre>

      <section className="mb-6 grid gap-3 sm:grid-cols-3">
        <Tuile libelle="Partenaires et financeurs" valeur={resume.partenaires} detail="Mairie, département, écoles, entreprises" />
        <Tuile libelle="Financeurs" valeur={financeurs} detail="Ceux qui donnent de l'argent" ton={financeurs ? 'ok' : 'neutre'} />
        <Tuile libelle="Élus" valeur={elus} detail="Ceux qui peuvent appuyer un dossier" />
      </section>

      <Repertoire contacts={contacts} mode="PARTENAIRES" />

      <p className="mt-6 text-sm text-[#6B6A8A]">
        Un financeur devient un dossier :{' '}
        <Link href="/espace/dossiers" className="font-bold text-[#4F46E5] underline underline-offset-4">
          mes subventions et appels à projet
        </Link>
        . L&apos;équipe de l&apos;association est{' '}
        <Link href="/espace/repertoire" className="font-bold text-[#4F46E5] underline underline-offset-4">
          sur sa propre page
        </Link>
        .
      </p>
    </>
  );
}
