import type { Metadata } from 'next';
import { apiAcademie, sessionAcademie } from '../_session';
import { Titre } from '../_ui';
import type { LigneSessionAdmin } from '../_gestion/types';
import { Financements } from './Financements';

export const metadata: Metadata = { title: 'Financements', robots: { index: false, follow: false } };

/**
 * `/academie/financements` : LES PRISES EN CHARGE PAR UN FINANCEUR.
 *
 * Un dossier par entreprise et par financeur (OPCO, France Travail, CPF…),
 * suivi du dépôt au paiement. Les sessions sont chargées ici pour que le
 * formulaire de création puisse en proposer une.
 */
export default async function FinancementsPage() {
  const s = await sessionAcademie('/academie/financements');
  const { data } = await apiAcademie<LigneSessionAdmin[]>(s, '/academie/gestion/sessions');
  const sessions = (Array.isArray(data) ? data : [])
    .filter((x) => x.status !== 'CANCELLED')
    .map((x) => ({ id: x.id, titre: x.titre, startDate: x.startDate, endDate: x.endDate }));
  return (
    <>
      <Titre surtitre="Gestion de l’organisme" sousTitre="OPCO, France Travail, CPF : chaque dossier, du dépôt au paiement.">
        Financements
      </Titre>
      <Financements sessions={sessions} />
    </>
  );
}
