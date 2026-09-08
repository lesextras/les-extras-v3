import type { Metadata } from 'next';
import { apiAcademie, sessionAcademie } from '../_session';
import { Encart, Titre } from '../_ui';
import type { CoursResume, Pack, Vente } from '../_ecole/types';
import { Ventes } from './Ventes';

export const metadata: Metadata = { title: 'Mes ventes', robots: { index: false, follow: false } };

/**
 * `/academie/ventes` — CE QUI A ÉTÉ ACHETÉ.
 *
 * Chaque ligne dit qui, quoi, combien, et où en est le paiement. L'écran sert
 * aussi à enregistrer une vente faite ailleurs — un virement, un chèque, une
 * prise en charge par un OPCO — pour que la comptabilité reste juste.
 */
export default async function VentesPage() {
  const s = await sessionAcademie('/academie/ventes');
  const [ventes, cours, packs] = await Promise.all([
    apiAcademie<Vente[]>(s, '/ecole/ventes'),
    apiAcademie<CoursResume[]>(s, '/ecole/cours'),
    apiAcademie<Pack[]>(s, '/ecole/packs'),
  ]);

  return (
    <>
      <Titre
        surtitre="Ce qui a été acheté"
        sousTitre="Qui, quoi, combien, et où en est le paiement. Tu peux aussi enregistrer ici une vente réglée par virement, par chèque ou par un financeur."
      >
        Mes ventes
      </Titre>

      {ventes.data ? (
        <Ventes
          initiales={Array.isArray(ventes.data) ? ventes.data : []}
          cours={Array.isArray(cours.data) ? cours.data : []}
          packs={Array.isArray(packs.data) ? packs.data : []}
        />
      ) : (
        <Encart ton="attention">{ventes.error ?? 'Les ventes ne se chargent pas pour le moment.'}</Encart>
      )}
    </>
  );
}
