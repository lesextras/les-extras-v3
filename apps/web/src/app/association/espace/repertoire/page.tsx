import Link from 'next/link';
import { apiEspace, sessionAssociation } from '../../_session';
import { Encart, Titre, Tuile } from '../../_ui';
import type { Contact, ResumeContacts } from '../_types';
import { Repertoire } from './Repertoire';

/**
 * MON ÉQUIPE ET MES CONTACTS : le répertoire de l'association. Une personne
 * peut cumuler les rôles ; les dirigeants ont des mandats datés.
 */
export default async function RepertoirePage() {
  const s = await sessionAssociation('/espace/repertoire');
  const { data, error } = await apiEspace<{ contacts: Contact[]; resume: ResumeContacts }>(s, '/association/repertoire');
  if (!data) return <Encart ton="attention">{error ?? 'Le répertoire ne se charge pas pour le moment.'}</Encart>;
  const { contacts, resume } = data;

  return (
    <>
      <Titre
        surtitre="Mon équipe et mes contacts"
        sousTitre="Qui décide, qui aide, qui est membre, et qui vous connaît à la mairie ou chez les financeurs. Une personne peut avoir plusieurs rôles."
      >
        Le répertoire
      </Titre>

      <section className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Tuile libelle="Membres" valeur={resume.membres} detail={`${resume.membresAJour} à jour de cotisation`} ton={resume.membres && resume.membresAJour < resume.membres ? 'attention' : 'neutre'} />
        <Tuile libelle="Bureau" valeur={resume.bureau.length} detail={resume.bureau.length ? resume.bureau.map((b) => b.nom.split(' ')[0]).join(', ') : 'Président, trésorier, secrétaire'} ton={resume.bureau.length >= 2 ? 'ok' : 'attention'} />
        <Tuile libelle="Bénévoles et salariés" valeur={resume.benevoles + resume.salaries} detail={`${resume.benevoles} bénévole${resume.benevoles > 1 ? 's' : ''} · ${resume.salaries} salarié${resume.salaries > 1 ? 's' : ''}`} />
        <Tuile libelle="Partenaires et financeurs" valeur={resume.partenaires} detail="Mairie, département, élus, écoles…" />
      </section>

      <Repertoire contacts={contacts} />

      <p className="mt-6 text-sm text-[#6B6A8A]">
        Pour encaisser les cotisations en ligne, un service de paiement pour associations fait le travail :{' '}
        <Link href="/outils" className="font-bold text-[#4F46E5] underline underline-offset-4">
          voir les outils utiles
        </Link>
        . Les membres se notent ici, avec leur date d&apos;entrée et leur cotisation.
      </p>
    </>
  );
}
