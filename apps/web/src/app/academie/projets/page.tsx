import Link from 'next/link';
import type { Metadata } from 'next';
import { apiAcademie, sessionAcademie } from '../_session';
import { Encart, Titre, Tuile } from '../_ui';
import type { ActionAssociation, FormationCatalogue, ListeTaches, ResumeActions } from '../../association/espace/_types';
import { EspaceProjetsAcademie } from './EspaceProjetsAcademie';

export const metadata: Metadata = { title: 'Mes projets', robots: { index: false, follow: false } };

interface ProjetsAcademie {
  actions: ActionAssociation[];
  resume: ResumeActions;
  proprietaires: { cle: string; nom: string; type: 'ASSOCIATION' | 'ACADEMIE' }[];
  catalogue: FormationCatalogue[];
}

/**
 * `/academie/projets` — MES PROJETS.
 *
 * Reliée à une association (Paramètres → Espaces reliés), l'académie
 * travaille sur les projets DE l'association : les mêmes, pas des copies.
 * Chaque projet se relie aux formations qui le servent.
 */
export default async function ProjetsAcademiePage() {
  const s = await sessionAcademie('/academie/projets');
  const [{ data, error }, listeTaches] = await Promise.all([
    apiAcademie<ProjetsAcademie>(s, '/academie/projets'),
    apiAcademie<ListeTaches>(s, '/academie/taches'),
  ]);
  if (!data) {
    return (
      <>
        <Titre surtitre="Mon académie">Mes projets</Titre>
        <Encart ton="attention">{error ?? 'Les projets ne se chargent pas pour le moment.'}</Encart>
      </>
    );
  }
  const { actions, resume } = data;
  const taches = Array.isArray(listeTaches.data?.taches) ? listeTaches.data.taches : [];
  const equipe = Array.isArray(listeTaches.data?.equipe) ? listeTaches.data.equipe : [];
  const associations = (data.proprietaires ?? []).filter((p) => p.type === 'ASSOCIATION');
  const avecFormation = actions.filter((a) => a.formations?.length).length;

  return (
    <>
      <Titre
        surtitre="Mon académie"
        sousTitre={associations.length ? `Les projets de ${associations.map((a) => a.nom).join(', ')}, et leurs formations.` : 'Chaque projet, ses tâches et ses formations.'}
      >
        Mes projets
      </Titre>

      {!associations.length ? (
        <p className="mb-6 text-sm text-[#5E7A6E]">
          Ton académie appartient à une association ?{' '}
          <Link href="/academie/parametres#espaces-relies" className="font-bold text-[#0F5F3E] underline underline-offset-4">
            Relie-la
          </Link>{' '}
          : vous partagerez les mêmes projets.
        </p>
      ) : null}

      <section className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Tuile libelle="Projets" valeur={resume.total} detail={`${resume.enCours} en cours · ${resume.prevues} prévu${resume.prevues > 1 ? 's' : ''}`} />
        <Tuile libelle="Avec une formation" valeur={avecFormation} ton={avecFormation ? 'ok' : 'neutre'} />
        <Tuile libelle="Personnes touchées" valeur={resume.beneficiaires} ton={resume.beneficiaires ? 'ok' : 'neutre'} />
        <Tuile libelle="Bilans à écrire" valeur={resume.sansBilan} ton={resume.sansBilan ? 'attention' : 'ok'} />
      </section>

      <EspaceProjetsAcademie projets={actions} taches={taches} equipe={equipe} catalogue={data.catalogue ?? []} proprietaires={data.proprietaires ?? []} />
    </>
  );
}
