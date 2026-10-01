import type { Metadata } from 'next';
import { apiAcademie, sessionAcademie } from '../_session';
import { Titre } from '../_ui';
import type { ListeFactures } from '../_gestion/types';
import { Prospects } from './Prospects';

export const metadata: Metadata = { title: 'Prospects', robots: { index: false, follow: false } };

/**
 * `/academie/prospects` : LE CRM COMMERCIAL DE L'ACADÉMIE.
 *
 * Cinq colonnes, une carte par prospect, une prochaine action datée. Les
 * devis émis sont chargés ici pour pouvoir en relier un à un prospect.
 */
export default async function ProspectsPage() {
  const s = await sessionAcademie('/academie/prospects');
  const { data } = await apiAcademie<ListeFactures>(s, '/academie/gestion/factures?type=DEVIS');
  const devis = (data?.factures ?? [])
    .filter((f) => f.statut !== 'BROUILLON')
    .map((f) => ({ id: f.id, libelle: `${f.numero ?? 'Devis'} · ${f.client.nom}` }));
  return (
    <>
      <Titre surtitre="Gestion de l’organisme" sousTitre="Qui contacter, où en est chacun, quoi faire ensuite.">
        Prospects
      </Titre>
      <Prospects devis={devis} />
    </>
  );
}
