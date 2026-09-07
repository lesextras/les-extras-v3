import Link from 'next/link';
import { apiEspace, formaterEuros, sessionAssociation } from '../../_session';
import { Encart, Pastille } from '../../_ui';
import { LIBELLES_ETAT, dateCourte, type Espace } from '../_types';
import { NouveauDossier } from './NouveauDossier';

/**
 * LES DOSSIERS. Un dossier = un financeur, un intitulé, un état, des dates.
 * La liste est triée par date limite : ce qui presse est en haut.
 */
export default async function DossiersPage() {
  const s = await sessionAssociation('/espace/dossiers');
  const { data, error } = await apiEspace<Espace>(s, '/association/espace');
  if (!data) return <Encart ton="attention">{error ?? 'Les dossiers ne se chargent pas pour le moment.'}</Encart>;

  const enCours = data.dossiers.filter((d) => d.etat !== 'SOLDE' && d.etat !== 'REFUSE');
  const termines = data.dossiers.filter((d) => d.etat === 'SOLDE' || d.etat === 'REFUSE');

  return (
    <>
      <header className="mb-6">
        <p className="text-xs uppercase tracking-[0.14em] text-[#5C6B63]">{data.organisation.nom}</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">Les dossiers</h1>
        <p className="mt-2 max-w-[64ch] text-[#3E4A44]">
          Un dossier par demande de financement. Notez la date limite : elle remontera sur l&apos;écran du lundi 60 jours avant.
        </p>
      </header>

      <NouveauDossier dispositifs={data.dispositifs} />

      <section className="mt-8">
        <h2 className="mb-3 text-sm uppercase tracking-[0.14em] text-[#5C6B63]">En cours ({enCours.length})</h2>
        {enCours.length === 0 ? (
          <p className="text-sm text-[#5C6B63]">Aucun dossier en cours. Commencez par le premier financeur : votre commune.</p>
        ) : (
          <ListeDossiers dossiers={enCours} />
        )}
      </section>
      {termines.length ? (
        <section className="mt-8">
          <h2 className="mb-3 text-sm uppercase tracking-[0.14em] text-[#5C6B63]">Terminés ({termines.length})</h2>
          <ListeDossiers dossiers={termines} />
        </section>
      ) : null}
    </>
  );
}

function ListeDossiers({ dossiers }: { dossiers: Espace['dossiers'] }) {
  return (
    <ul className="divide-y divide-[#DDD8CC] rounded-md border border-[#DDD8CC] bg-white">
      {dossiers.map((d) => (
        <li key={d.id}>
          <Link href={`/espace/dossiers/${d.id}`} className="flex flex-col gap-1 px-5 py-4 no-underline hover:bg-[#F6F4EE] sm:flex-row sm:items-center sm:justify-between">
            <span className="min-w-0">
              <span className="font-semibold text-[#1E2A25]">{d.intitule}</span>
              <br />
              <span className="text-sm text-[#5C6B63]">
                {d.financeur}
                {d.dateLimiteDepot ? ` · dépôt avant le ${dateCourte(d.dateLimiteDepot)}` : ''}
                {d.dateCompteRendu && d.etat === 'ACCORDE' ? ` · compte rendu le ${dateCourte(d.dateCompteRendu)}` : ''}
                {d.montantAccorde !== null ? ` · ${formaterEuros(d.montantAccorde)} accordés` : d.montantDemande !== null ? ` · ${formaterEuros(d.montantDemande)} demandés` : ''}
              </span>
            </span>
            <Pastille ton={d.etat === 'ACCORDE' || d.etat === 'SOLDE' ? 'ok' : d.etat === 'REFUSE' ? 'attention' : 'neutre'}>{LIBELLES_ETAT[d.etat]}</Pastille>
          </Link>
        </li>
      ))}
    </ul>
  );
}
