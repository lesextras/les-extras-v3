import Link from 'next/link';
import { BTN_DISCRET, CARTE, Pastille, formaterDate } from './_ui';
import type { AssociationReliee } from '../_shared/liaisons/types';

/**
 * L'ASSOCIATION QUI PORTE L'ACADÉMIE, en lecture seule : son identité et ses
 * agréments, lus directement dans l'espace de l'association (lien ACTIVE).
 * Rien n'est recopié : ce qui change là-bas se voit ici.
 */
export function CarteAssociation({ associations, lienReglages = true }: { associations: AssociationReliee[] | null | undefined; lienReglages?: boolean }) {
  if (!associations?.length) {
    if (!lienReglages) return null;
    return (
      <section className={`${CARTE} p-5`}>
        <div className="flex flex-wrap items-start gap-3">
          <div className="min-w-[220px] flex-1">
            <h2 className="text-[18px] font-extrabold text-[#12312A]">Association</h2>
            <p className="mt-1 text-[15px] text-[#334A42]">Aucune association reliée.</p>
          </div>
          <Link href="/academie/parametres#espaces-relies" className={BTN_DISCRET}>
            Relier
          </Link>
        </div>
      </section>
    );
  }
  return (
    <>
      {associations.map((a) => {
        const ag = a.agrement;
        const perime = ag?.dateExpiration ? new Date(ag.dateExpiration).getTime() < Date.now() : false;
        const identite = [
          { libelle: 'SIRET', valeur: a.siret ?? a.siren },
          { libelle: 'RNA', valeur: a.rna },
          { libelle: 'Commune', valeur: [a.codePostal, a.commune].filter(Boolean).join(' ') || null },
        ];
        return (
          <section key={a.id} className={`${CARTE} p-5`}>
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#5E7A6E]">Association</p>
            <h2 className="mt-1 text-[18px] font-extrabold text-[#12312A]">
              {a.nom}
              {a.sigle ? <span className="text-[#5E7A6E]"> ({a.sigle})</span> : null}
            </h2>
            <dl className="mt-3 grid gap-x-6 gap-y-1 sm:grid-cols-3">
              {identite.map((l) => (
                <div key={l.libelle} className="flex items-baseline justify-between gap-2 border-b border-[#EDF4F1] py-1.5">
                  <dt className="text-[14px] text-[#5E7A6E]">{l.libelle}</dt>
                  <dd className="text-[15px] font-bold text-[#12312A]">{l.valeur || '—'}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-4">
              <p className="text-[15px] font-extrabold text-[#12312A]">Agréments</p>
              {ag && ag.etat !== 'A_FOURNIR' ? (
                <div className="mt-1 flex flex-wrap items-center gap-2 text-[15px] text-[#334A42]">
                  <span>{ag.note || ag.preuve || 'Agrément déposé'}</span>
                  {ag.dateExpiration ? (
                    <Pastille ton={perime ? 'alerte' : 'ok'}>
                      {perime ? 'Expiré le' : "Jusqu'au"} {formaterDate(ag.dateExpiration)}
                    </Pastille>
                  ) : (
                    <Pastille ton="ok">Déposé</Pastille>
                  )}
                </div>
              ) : (
                <p className="mt-1 text-[15px] text-[#5E7A6E]">Aucun agrément déposé dans le classeur de l&apos;association.</p>
              )}
            </div>
          </section>
        );
      })}
    </>
  );
}
