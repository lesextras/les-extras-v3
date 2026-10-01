/* Textes allégés le 01/10/2026 (demande : le moins de texte possible) */
import Link from 'next/link';
import { apiEspace, sessionAssociation } from '../../_session';
import { Encart, SousTitre, Titre, Tuile } from '../../_ui';
import type { ActionAssociation, Espace, ResumeActions } from '../_types';
import { Recherche } from '../financeurs/Recherche';
import { Kanban } from './Kanban';

/**
 * MES PROJETS : ce que l'association fait, ou veut faire. C'est la matière du
 * rapport d'activité et de toutes les demandes de subvention — et c'est à
 * partir de là qu'on cherche les financeurs.
 */
export default async function ProjetsPage() {
  const s = await sessionAssociation('/espace/projets');
  const [{ data, error }, espace] = await Promise.all([
    apiEspace<{ actions: ActionAssociation[]; resume: ResumeActions }>(s, '/association/actions'),
    apiEspace<Espace>(s, '/association/espace'),
  ]);
  if (!data) return <Encart ton="attention">{error ?? 'Les projets ne se chargent pas pour le moment.'}</Encart>;
  const { actions, resume } = data;
  const projetComplet = espace.data?.projet.complet ?? false;

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

      <Kanban projets={actions} />

      {/* ------------------------------------------------- trouver l'argent */}
      <section id="financeurs" className="mt-12 scroll-mt-24">
        <SousTitre info="Pistes à vérifier, pas des promesses.">Trouver des financeurs</SousTitre>

        {!projetComplet ? (
          <div className="mb-4">
            <Encart ton="attention">
              <p className="font-extrabold">Projet en une page à remplir d&apos;abord.</p>
              <Link href="/espace/association#projet" className="mt-3 inline-flex text-sm font-bold text-[#4F46E5] underline underline-offset-4">
                Écrire mon projet →
              </Link>
            </Encart>
          </div>
        ) : null}

        <Recherche disponible={espace.data?.ia?.disponible ?? false} />
      </section>

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
