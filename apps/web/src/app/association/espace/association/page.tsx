import { apiEspace, sessionAssociation } from '../../_session';
import { Encart } from '../../_ui';
import { dateCourte, type Espace } from '../_types';
import { Rattacher } from './Rattacher';
import { FormulaireOrganisation } from './FormulaireOrganisation';

/** L'identité de l'association : ce que disent les répertoires, ce que vous précisez. */
export default async function MonAssociationPage() {
  const s = await sessionAssociation('/espace/association');
  const { data, error } = await apiEspace<Espace>(s, '/association/espace');
  if (!data) return <Encart ton="attention">{error ?? 'La fiche ne se charge pas pour le moment.'}</Encart>;
  const o = data.organisation;

  return (
    <>
      <header className="mb-6">
        <p className="text-xs uppercase tracking-[0.14em] text-[#5C6B63]">Mon association</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">{o.nom}</h1>
      </header>

      <section className="mb-8 rounded-md border border-[#DDD8CC] bg-white p-5">
        <h2 className="text-sm uppercase tracking-[0.14em] text-[#5C6B63]">Ce que disent les répertoires publics</h2>
        {o.rna || o.siret ? (
          <dl className="mt-3 grid grid-cols-[max-content_minmax(0,1fr)] gap-x-4 gap-y-1.5 text-sm [&_dt]:text-[#5C6B63]">
            <dt>RNA</dt>
            <dd className="tabular-nums">{o.rna ?? 'Non renseigné'}</dd>
            <dt>SIREN</dt>
            <dd className="tabular-nums">{o.siren ?? 'Non renseigné'}</dd>
            <dt>SIRET</dt>
            <dd className="tabular-nums">{o.siret ?? 'Non renseigné'}</dd>
            <dt>Forme</dt>
            <dd>{o.natureJuridique ?? 'Non renseignée'}</dd>
            <dt>Siège</dt>
            <dd>{[o.adresse, [o.codePostal, o.commune].filter(Boolean).join(' ')].filter(Boolean).join(', ') || 'Non renseigné'}</dd>
            <dt>Créée le</dt>
            <dd>{dateCourte(o.dateCreation)}</dd>
          </dl>
        ) : (
          <p className="mt-2 text-sm text-[#3E4A44]">Pas encore rattachée. Retrouvez-la : ses numéros rempliront le classeur.</p>
        )}
        <div className="mt-4">
          <p className="mb-2 text-sm text-[#5C6B63]">{o.rna || o.siret ? 'Ce n’est pas la bonne ? Rattachez-en une autre :' : ''}</p>
          <Rattacher valeurInitiale={o.rna || o.siret ? '' : o.nom} />
        </div>
      </section>

      <FormulaireOrganisation organisation={o} />
    </>
  );
}
