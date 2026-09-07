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
        sousTitre="Un projet, c'est une sortie, un atelier, un tournoi, un accompagnement. Noté ici, il se recopie tout seul dans le rapport d'activité et dans tes demandes de subvention — et il sert à trouver qui peut le financer."
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

      {/* ------------------------------------------------- trouver l'argent */}
      <section id="financeurs" className="mt-12 scroll-mt-24">
        <SousTitre>Trouver des financeurs pour ces projets</SousTitre>
        <p className="mt-1 mb-4 max-w-[70ch] text-sm text-[#6B6A8A]">
          À partir de tes projets, de ton projet en une page et de ta commune : des financeurs publics, des fondations et des entreprises à qui parler. Des
          pistes à vérifier, pas des promesses.
        </p>

        {!projetComplet ? (
          <div className="mb-4">
            <Encart ton="attention">
              <p className="font-extrabold">Remplis d&apos;abord ton projet en une page.</p>
              <p className="mt-1 text-sm leading-relaxed">
                Quatre questions : pour qui, quoi, comment, ce que ça change. C&apos;est ce texte qui sert à chercher les bons financeurs — sans lui, les pistes
                seront vagues.
              </p>
              <Link href="/espace/association#projet" className="mt-3 inline-flex text-sm font-bold text-[#4F46E5] underline underline-offset-4">
                Écrire mon projet →
              </Link>
            </Encart>
          </div>
        ) : null}

        <Recherche disponible={espace.data?.ia?.disponible ?? false} />
      </section>

      <p className="mt-8 text-sm text-[#6B6A8A]">
        Ces projets remplissent d&apos;eux-mêmes le rapport d&apos;activité :{' '}
        <Link href="/chemin/la-premiere-assemblee-generale" className="font-bold text-[#4F46E5] underline underline-offset-4">
          le fabriquer en un clic
        </Link>
        . Les dispositifs déjà repérés à la main sont sur{' '}
        <Link href="/avantages" className="font-bold text-[#4F46E5] underline underline-offset-4">
          ce à quoi j&apos;ai droit
        </Link>
        , et les demandes en cours dans{' '}
        <Link href="/espace/dossiers" className="font-bold text-[#4F46E5] underline underline-offset-4">
          mes subventions et appels à projet
        </Link>
        .
      </p>
    </>
  );
}
