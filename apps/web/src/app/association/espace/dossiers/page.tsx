import Link from 'next/link';
import { apiEspace, sessionAssociation } from '../../_session';
import { CARTE, Encart, Pastille, Titre, Tuile } from '../../_ui';
import { LIBELLES_ETAT, dateCourte, formaterEuros, type Dossier, type Espace } from '../_types';
import { NouveauDossier } from './NouveauDossier';

/**
 * MES DOSSIERS DE SUBVENTION. Un dossier = un financeur, un intitulé, un état,
 * des dates. Du repérage au compte rendu, comme une colonne par état.
 */
const COLONNES: { etats: Dossier['etat'][]; titre: string; aide: string }[] = [
  { etats: ['REPERE', 'EN_ECRITURE'], titre: 'À préparer', aide: 'Repérés ou en cours d’écriture' },
  { etats: ['DEPOSE'], titre: 'Déposés', aide: 'En attente de réponse' },
  { etats: ['ACCORDE'], titre: 'Accordés', aide: 'À justifier par un compte rendu' },
  { etats: ['SOLDE', 'REFUSE'], titre: 'Terminés', aide: 'Soldés ou refusés' },
];

export default async function DossiersPage() {
  const s = await sessionAssociation('/espace/dossiers');
  const { data, error } = await apiEspace<Espace>(s, '/association/espace');
  if (!data) return <Encart ton="attention">{error ?? 'Les dossiers ne se chargent pas pour le moment.'}</Encart>;

  const demande = data.dossiers.reduce((t, d) => t + (d.montantDemande ?? 0), 0);
  const accorde = data.dossiers.filter((d) => d.etat === 'ACCORDE' || d.etat === 'SOLDE').reduce((t, d) => t + (d.montantAccorde ?? 0), 0);
  const aJustifier = data.dossiers.filter((d) => d.etat === 'ACCORDE').length;

  return (
    <>
      <Titre
        surtitre="Mes dossiers de subvention"
        sousTitre="Un dossier par demande : la mairie, le FDVA, le département, un appel à projets. La date limite remonte sur l'écran du lundi 60 jours avant."
        actions={
          <Link href="/subvention" className="inline-flex items-center rounded-xl border-2 border-[#D9D6EE] bg-white px-4 py-2 text-sm font-bold text-[#1D1B5C] no-underline hover:border-[#4F46E5]">
            Comment demander une subvention
          </Link>
        }
      >
        {data.organisation.nom}
      </Titre>

      <section className="mb-6 grid gap-3 sm:grid-cols-3">
        <Tuile libelle="Demandé" valeur={formaterEuros(demande)} detail={`${data.dossiers.length} dossier${data.dossiers.length > 1 ? 's' : ''}`} />
        <Tuile libelle="Accordé" valeur={formaterEuros(accorde)} ton="ok" />
        <Tuile libelle="À justifier" valeur={aJustifier} detail="compte rendu à envoyer" ton={aJustifier ? 'attention' : 'neutre'} />
      </section>

      <NouveauDossier dispositifs={data.dispositifs} />

      <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {COLONNES.map((col) => {
          const siens = data.dossiers.filter((d) => col.etats.includes(d.etat));
          return (
            <div key={col.titre} className="rounded-2xl bg-[#ECEBFC]/60 p-3">
              <p className="px-2 font-extrabold text-[#1D1B5C]">
                {col.titre} <span className="text-[#6B6A8A]">{siens.length}</span>
              </p>
              <p className="px-2 text-xs text-[#6B6A8A]">{col.aide}</p>
              <ul className="mt-3 space-y-2">
                {siens.map((d) => (
                  <li key={d.id}>
                    <Link href={`/espace/dossiers/${d.id}`} className={`${CARTE} block p-3 no-underline transition hover:border-[#4F46E5]`}>
                      <span className="block font-extrabold leading-snug text-[#1D1B5C]">{d.intitule}</span>
                      <span className="block text-sm text-[#6B6A8A]">{d.financeur}</span>
                      <span className="mt-2 flex flex-wrap items-center gap-1.5 text-xs">
                        <Pastille ton={d.etat === 'ACCORDE' || d.etat === 'SOLDE' ? 'ok' : d.etat === 'REFUSE' ? 'alerte' : d.etat === 'DEPOSE' ? 'accent' : 'neutre'}>{LIBELLES_ETAT[d.etat]}</Pastille>
                        {d.dateLimiteDepot && (d.etat === 'REPERE' || d.etat === 'EN_ECRITURE') ? <span className="text-[#6B6A8A]">avant le {dateCourte(d.dateLimiteDepot)}</span> : null}
                        {d.dateCompteRendu && d.etat === 'ACCORDE' ? <span className="text-[#6B6A8A]">compte rendu le {dateCourte(d.dateCompteRendu)}</span> : null}
                        {d.montantAccorde !== null ? <span className="font-bold text-[#0F5F3E]">{formaterEuros(d.montantAccorde)}</span> : d.montantDemande !== null ? <span className="text-[#6B6A8A]">{formaterEuros(d.montantDemande)}</span> : null}
                      </span>
                    </Link>
                  </li>
                ))}
                {siens.length === 0 ? <li className="px-2 py-4 text-center text-sm text-[#9A99B5]">Rien ici</li> : null}
              </ul>
            </div>
          );
        })}
      </section>
    </>
  );
}
