/* Textes allégés le 01/10/2026 (demande : le moins de texte possible) */
import Link from 'next/link';
import { apiEspace, sessionAssociation } from '../../_session';
import { Encart, Titre, Tuile } from '../../_ui';
import type { Contact, ResumeContacts } from '../_types';
import { Repertoire } from './Repertoire';

/**
 * MON ÉQUIPE ET SES DROITS : qui décide, qui aide, qui est membre — et ce que
 * chaque rôle permet de faire. Les partenaires ont leur propre page.
 */
export default async function RepertoirePage({ searchParams }: { searchParams: Promise<{ onglet?: string }> }) {
  const [{ onglet }, s] = await Promise.all([searchParams, sessionAssociation('/espace/repertoire')]);
  const surMembres = onglet === 'membres';
  const { data, error } = await apiEspace<{ contacts: Contact[]; resume: ResumeContacts }>(s, '/association/repertoire');
  if (!data) return <Encart ton="attention">{error ?? 'Le répertoire ne se charge pas pour le moment.'}</Encart>;
  const { contacts, resume } = data;

  return (
    <>
      <Titre
        surtitre="Qui fait quoi"
        sousTitre="Qui signe, qui dépense, qui vote."
        info="Le président signe, le trésorier engage les dépenses, le membre à jour vote. Rôles cumulables."
      >
        Mon équipe
      </Titre>

      <section className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Tuile
          libelle="Membres"
          valeur={resume.membres}
          detail={
            <>
              <span className="tabular-nums">
                Cotisations : {resume.membresAJour} / {resume.membres}
              </span>
              {resume.membres > resume.membresAJour ? (
                <Link
                  href="/espace/repertoire?onglet=membres"
                  scroll={false}
                  className="mt-1 block font-bold text-[#4F46E5] underline underline-offset-4"
                >
                  Noter les paiements
                </Link>
              ) : null}
            </>
          }
        />
        <Tuile libelle="Bureau" valeur={resume.bureau.length} detail={resume.bureau.length ? resume.bureau.map((b) => b.nom.split(' ')[0]).join(', ') : 'Président, trésorier, secrétaire'} ton={resume.bureau.length >= 2 ? 'ok' : 'attention'} />
        <Tuile libelle="Bénévoles et salariés" valeur={resume.benevoles + resume.salaries} detail={`${resume.benevoles} bénévole${resume.benevoles > 1 ? 's' : ''} · ${resume.salaries} salarié${resume.salaries > 1 ? 's' : ''}`} />
        <Tuile libelle="Partenaires et financeurs" valeur={resume.partenaires} href="/espace/partenaires" />
      </section>

      <Repertoire key={surMembres ? 'membres' : 'equipe'} contacts={contacts} mode="INTERNE" ongletInitial={surMembres ? 'MEMBRES' : undefined} />

      <p className="mt-6 flex flex-wrap gap-x-4 gap-y-1 text-sm text-[#6B6A8A]">
        <Link href="/espace/partenaires" className="font-bold text-[#4F46E5] underline underline-offset-4">
          Mes contacts
        </Link>
        <Link href="/outils" className="font-bold text-[#4F46E5] underline underline-offset-4">
          Cotisations en ligne
        </Link>
      </p>
    </>
  );
}
