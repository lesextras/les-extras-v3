/* Textes allégés le 01/10/2026 (demande : le moins de texte possible) */
import Link from 'next/link';
import { apiEspace, sessionAssociation } from '../../_session';
import { Encart, Titre, Tuile } from '../../_ui';
import type { ActionAssociation, Espace, ListeTaches, ResumeActions } from '../_types';
import { AFaire } from './AFaire';
import { VueProjets } from './VueProjets';

/**
 * MES PROJETS : ce que l'association fait, ou veut faire. C'est la matière du
 * rapport d'activité et de toutes les demandes de subvention — et c'est à
 * partir de là qu'on cherche les financeurs.
 */
export default async function ProjetsPage() {
  const s = await sessionAssociation('/espace/projets');
  const [{ data, error }, espace, listeTaches] = await Promise.all([
    apiEspace<{ actions: ActionAssociation[]; resume: ResumeActions }>(s, '/association/actions'),
    apiEspace<Espace>(s, '/association/espace'),
    apiEspace<ListeTaches>(s, '/association/taches'),
  ]);
  if (!data) return <Encart ton="attention">{error ?? 'Les projets ne se chargent pas pour le moment.'}</Encart>;
  const { actions, resume } = data;
  /* Les tâches sont un plus : si elles ne se chargent pas, les projets s'affichent quand même. */
  const taches = Array.isArray(listeTaches.data?.taches) ? listeTaches.data.taches : [];
  const equipe = Array.isArray(listeTaches.data?.equipe) ? listeTaches.data.equipe : [];

  return (
    <>
      <Titre
        surtitre="Ce que fait mon association"
        sousTitre="Sorties, ateliers, tournois, accompagnements."
        info="Recopiés tout seuls dans le rapport d'activité et tes demandes."
      >
        Mes projets
      </Titre>

      <section className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Tuile libelle="Projets" valeur={resume.total} detail={`${resume.enCours} en cours · ${resume.prevues} prévu${resume.prevues > 1 ? 's' : ''}`} />
        <Tuile libelle="Personnes touchées" valeur={resume.beneficiaires} ton={resume.beneficiaires ? 'ok' : 'neutre'} />
        <Tuile libelle="Bénévoles engagés" valeur={resume.benevoles} detail={`${resume.heuresBenevoles} h`} />
        <Tuile libelle="Bilans à écrire" valeur={resume.sansBilan} detail={resume.sansBilan ? 'projets finis' : undefined} ton={resume.sansBilan ? 'attention' : 'ok'} />
      </section>

      <AFaire taches={taches} equipe={equipe} projets={actions} />

      <VueProjets projets={actions} taches={taches} equipe={equipe} iaDisponible={espace.data?.ia?.disponible ?? false} />

      <p className="mt-8 flex flex-wrap gap-x-4 gap-y-1 text-sm text-[#6B6A8A]">
        <Link href="/chemin/la-premiere-assemblee-generale" className="font-bold text-[#4F46E5] underline underline-offset-4">
          Rapport d&apos;activité
        </Link>
        <Link href="/chemin#droits" className="font-bold text-[#4F46E5] underline underline-offset-4">
          Ce à quoi j&apos;ai droit
        </Link>
        <Link href="/espace/dossiers" className="font-bold text-[#4F46E5] underline underline-offset-4">
          Mes dossiers
        </Link>
      </p>
    </>
  );
}
