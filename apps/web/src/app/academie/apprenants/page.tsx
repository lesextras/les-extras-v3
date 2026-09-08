import type { Metadata } from 'next';
import { apiAcademie, sessionAcademie } from '../_session';
import { Encart, Titre } from '../_ui';
import type { Apprenant, CoursResume, Vente } from '../_ecole/types';
import { Apprenants } from './Apprenants';

export const metadata: Metadata = { title: 'Mes apprenants', robots: { index: false, follow: false } };

/**
 * `/academie/apprenants` — LES PERSONNES, PAS LES INSCRIPTIONS.
 *
 * L'API rend une ligne par inscription : quelqu'un qui suit trois cours y
 * apparaît trois fois. Ce n'est pas ainsi qu'on pense à ses apprenants. On
 * regroupe donc par personne, on additionne ce qu'elle a payé, et on garde le
 * détail cours par cours sous le chevron.
 */
export default async function ApprenantsPage() {
  const s = await sessionAcademie('/academie/apprenants');
  const [inscriptions, ventes, cours] = await Promise.all([
    apiAcademie<Apprenant[]>(s, '/ecole/apprenants'),
    apiAcademie<Vente[]>(s, '/ecole/ventes'),
    apiAcademie<CoursResume[]>(s, '/ecole/cours'),
  ]);

  return (
    <>
      <Titre
        surtitre="Qui suit tes formations"
        sousTitre="Une ligne par personne : depuis quand elle est inscrite, quand elle est passée pour la dernière fois, où elle en est dans chaque cours, et ce qu'elle a payé."
      >
        Mes apprenants
      </Titre>

      {inscriptions.data ? (
        <Apprenants
          inscriptions={Array.isArray(inscriptions.data) ? inscriptions.data : []}
          ventes={Array.isArray(ventes.data) ? ventes.data : []}
          cours={Array.isArray(cours.data) ? cours.data : []}
        />
      ) : (
        <Encart ton="attention">{inscriptions.error ?? 'Les apprenants ne se chargent pas pour le moment.'}</Encart>
      )}
    </>
  );
}
