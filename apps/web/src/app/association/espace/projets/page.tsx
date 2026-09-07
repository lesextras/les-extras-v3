import Link from 'next/link';
import { apiEspace, sessionAssociation } from '../../_session';
import { Encart, Titre, Tuile } from '../../_ui';
import type { ActionAssociation, ResumeActions } from '../_types';
import { Kanban } from './Kanban';

/**
 * MES PROJETS : ce que l'association fait, ou veut faire. C'est la matière du
 * rapport d'activité et de toutes les demandes de subvention.
 */
export default async function ProjetsPage() {
  const s = await sessionAssociation('/espace/projets');
  const { data, error } = await apiEspace<{ actions: ActionAssociation[]; resume: ResumeActions }>(s, '/association/actions');
  if (!data) return <Encart ton="attention">{error ?? 'Les projets ne se chargent pas pour le moment.'}</Encart>;
  const { actions, resume } = data;

  return (
    <>
      <Titre
        surtitre="Ce que fait mon association"
        sousTitre="Un projet, c'est une sortie, un atelier, un tournoi, un accompagnement. Noté ici, il se recopie tout seul dans le rapport d'activité et dans tes demandes de subvention."
      >
        Mes projets
      </Titre>

      <section className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Tuile libelle="Projets" valeur={resume.total} detail={`${resume.enCours} en cours · ${resume.prevues} prévu${resume.prevues > 1 ? 's' : ''}`} />
        <Tuile libelle="Personnes touchées" valeur={resume.beneficiaires} detail="Le chiffre que tout financeur demande" ton={resume.beneficiaires ? 'ok' : 'neutre'} />
        <Tuile libelle="Bénévoles engagés" valeur={resume.benevoles} detail={`${resume.heuresBenevoles} heure${resume.heuresBenevoles > 1 ? 's' : ''} données`} />
        <Tuile libelle="Bilans à écrire" valeur={resume.sansBilan} detail={resume.sansBilan ? 'Projets finis sans bilan' : 'Tout est à jour'} ton={resume.sansBilan ? 'attention' : 'ok'} />
      </section>

      <Kanban projets={actions} />

      <p className="mt-6 text-sm text-[#6B6A8A]">
        Ces projets remplissent d&apos;eux-mêmes le rapport d&apos;activité :{' '}
        <Link href="/chemin/la-premiere-assemblee-generale" className="font-bold text-[#4F46E5] underline underline-offset-4">
          le fabriquer en un clic
        </Link>
        . Et pour trouver l&apos;argent qui les finance,{' '}
        <Link href="/espace/dossiers" className="font-bold text-[#4F46E5] underline underline-offset-4">
          mes subventions et appels à projet
        </Link>
        .
      </p>
    </>
  );
}
