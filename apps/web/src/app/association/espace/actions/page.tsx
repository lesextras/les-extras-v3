import Link from 'next/link';
import { apiEspace, sessionAssociation } from '../../_session';
import { Encart, Titre, Tuile } from '../../_ui';
import type { ActionAssociation, ResumeActions } from '../_types';
import { Actions } from './Actions';

/**
 * MES ACTIONS : ce que l'association fait vraiment. C'est la matière du
 * rapport d'activité et de tous les dossiers de subvention.
 */
export default async function ActionsPage() {
  const s = await sessionAssociation('/espace/actions');
  const { data, error } = await apiEspace<{ actions: ActionAssociation[]; resume: ResumeActions }>(s, '/association/actions');
  if (!data) return <Encart ton="attention">{error ?? 'Les actions ne se chargent pas pour le moment.'}</Encart>;
  const { actions, resume } = data;

  return (
    <>
      <Titre surtitre="Ce que fait mon association" sousTitre="Une action, c'est une sortie, un atelier, un tournoi, un accompagnement. Notée ici, elle se recopie toute seule dans le rapport d'activité et dans les dossiers.">
        Mes actions
      </Titre>

      <section className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Tuile libelle="Actions" valeur={resume.total} detail={`${resume.enCours} en cours · ${resume.prevues} prévue${resume.prevues > 1 ? 's' : ''}`} />
        <Tuile libelle="Personnes touchées" valeur={resume.beneficiaires} detail="Le chiffre que tout financeur demande" ton={resume.beneficiaires ? 'ok' : 'neutre'} />
        <Tuile libelle="Bénévoles engagés" valeur={resume.benevoles} detail={`${resume.heuresBenevoles} heure${resume.heuresBenevoles > 1 ? 's' : ''} données`} />
        <Tuile libelle="Bilans à écrire" valeur={resume.sansBilan} detail={resume.sansBilan ? 'Actions finies sans bilan' : 'Tout est à jour'} ton={resume.sansBilan ? 'attention' : 'ok'} />
      </section>

      <Actions actions={actions} />

      <p className="mt-6 text-sm text-[#6B6A8A]">
        Ces actions remplissent d&apos;elles-mêmes le rapport d&apos;activité :{' '}
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
