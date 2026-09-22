// LA DEMANDE D'INTERVENANT, CÔTÉ PARTICULIER.
//
// ⚠ CE QUE CETTE PAGE RÉPARE. Depuis le 19/09/2026, la page RenforTeam
// promet que « tout le monde peut demander », et qu'« un particulier réserve
// pour son enfant, son proche ou lui-même, sans passer par un établissement ».
// Son bouton menait pourtant au board des renforts, réservé aux comptes
// établissement : une famille qui suivait la promesse jusqu'au bout, en
// créant son compte, tombait sur « Réservé aux établissements ». La porte se
// fermait exactement là où la page disait qu'il n'y en avait pas.
//
// Le board n'est pas la bonne réponse pour un parent. Candidatures, vivier,
// cascade de diffusion, taux horaire : c'est un poste de pilotage
// d'établissement, et lui servir vingt portes dont dix-huit lui sont fermées
// est la façon la plus sûre de lui faire croire que le site n'est pas pour
// lui. Ici, la demande est un fil : on décrit la situation, ADéPA répond dans
// la page et par courriel, et l'échange reste attaché au compte.
import type { Metadata } from 'next';
import { requireSession, fetchApi } from '../../../_shared/server';
import { PageHeader, ErrorState } from '../../../_shared/ui';
import { Assistance, type FilAssistance } from '../../../_shared/Assistance';

export const metadata: Metadata = { title: 'Demander un intervenant' };

/**
 * Ce qu'il faut nous dire pour qu'une demande soit utilisable du premier coup.
 * Trois questions, pas un formulaire : une famille qui décrit une situation
 * ne remplit pas des cases, elle raconte.
 */
const INDICE =
  'Pour qui, et son âge. Ce que vous cherchez : ergothérapie, éducateur, ' +
  'psychomotricité, orthophonie, psychologue, ou un accompagnement à définir ' +
  'ensemble. Où et quand : chez vous, à l’école, en établissement, et à quel ' +
  'rythme.';

export default async function DemandePage() {
  const session = await requireSession();
  const { data, error } = await fetchApi<FilAssistance[]>(session, '/assistance');

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="Demander un intervenant"
        subtitle="Décrivez la situation en quelques lignes. Nous vous répondons ici et par e-mail, puis nous cherchons la personne qui convient."
      />

      {error ? (
        <ErrorState
          title="Lecture impossible"
          description="Vos échanges n’ont pas pu être chargés. Vous pouvez tout de même écrire : rechargez la page dans un instant."
        />
      ) : (
        <Assistance
          fils={data ?? []}
          accountId={session.account.id}
          sujetInitial="Demande d’intervenant"
          categorieInitiale="RESERVATION"
          placeholderSujet="Un éducateur pour mon fils, deux soirs par semaine"
          indiceMessage={INDICE}
        />
      )}
    </div>
  );
}
