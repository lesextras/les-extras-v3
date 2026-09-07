import Link from 'next/link';
import { apiEspace, sessionAssociation } from '../../_session';
import { Encart, Titre, Tuile } from '../../_ui';
import type { Contact, ResumeContacts } from '../_types';
import { Repertoire } from './Repertoire';

/**
 * MON ÉQUIPE ET SES DROITS : qui décide, qui aide, qui est membre — et ce que
 * chaque rôle permet de faire. Les partenaires ont leur propre page.
 */
export default async function RepertoirePage() {
  const s = await sessionAssociation('/espace/repertoire');
  const { data, error } = await apiEspace<{ contacts: Contact[]; resume: ResumeContacts }>(s, '/association/repertoire');
  if (!data) return <Encart ton="attention">{error ?? 'Le répertoire ne se charge pas pour le moment.'}</Encart>;
  const { contacts, resume } = data;

  return (
    <>
      <Titre
        surtitre="Qui fait quoi"
        sousTitre="Chaque rôle donne des droits : le président signe, le trésorier engage les dépenses, le membre à jour de cotisation vote. Une personne peut cumuler les rôles."
      >
        Mon équipe et ses droits
      </Titre>

      <section className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Tuile libelle="Membres" valeur={resume.membres} detail={`${resume.membresAJour} à jour de cotisation`} ton={resume.membres && resume.membresAJour < resume.membres ? 'attention' : 'neutre'} />
        <Tuile libelle="Bureau" valeur={resume.bureau.length} detail={resume.bureau.length ? resume.bureau.map((b) => b.nom.split(' ')[0]).join(', ') : 'Président, trésorier, secrétaire'} ton={resume.bureau.length >= 2 ? 'ok' : 'attention'} />
        <Tuile libelle="Bénévoles et salariés" valeur={resume.benevoles + resume.salaries} detail={`${resume.benevoles} bénévole${resume.benevoles > 1 ? 's' : ''} · ${resume.salaries} salarié${resume.salaries > 1 ? 's' : ''}`} />
        <Tuile libelle="Partenaires et financeurs" valeur={resume.partenaires} detail="Sur la page « Mes partenaires »" />
      </section>

      <Repertoire contacts={contacts} mode="INTERNE" />

      <p className="mt-6 text-sm text-[#6B6A8A]">
        Les personnes autour de l&apos;association sont{' '}
        <Link href="/espace/partenaires" className="font-bold text-[#4F46E5] underline underline-offset-4">
          sur la page des partenaires
        </Link>
        . Pour encaisser les cotisations en ligne,{' '}
        <Link href="/outils" className="font-bold text-[#4F46E5] underline underline-offset-4">
          voir les outils utiles
        </Link>
        .
      </p>
    </>
  );
}
