import Link from 'next/link';
import { apiEspace, sessionAssociation } from '../../_session';
import { nomCourt } from '../../_nom';
import { Encart, Titre, Tuile } from '../../_ui';
import { formaterEuros, type ActionAssociation, type Contact, type Espace, type NatureDossier } from '../_types';
import { NouveauDossier } from './NouveauDossier';
import { Tableau } from './Tableau';

/**
 * MES SUBVENTIONS ET APPELS À PROJET. Un dossier = un financeur, un intitulé, un état,
 * des dates. Du repérage au compte rendu, comme une colonne par état.
 */

export default async function DossiersPage({ searchParams }: { searchParams: Promise<{ vue?: string }> }) {
  const [{ vue }, s] = await Promise.all([searchParams, sessionAssociation('/espace/dossiers')]);
  // Tout est relié : les financeurs viennent des contacts, les idées des projets.
  const [{ data, error }, repertoire, projets] = await Promise.all([
    apiEspace<Espace>(s, '/association/espace'),
    apiEspace<{ contacts: Contact[] }>(s, '/association/repertoire'),
    apiEspace<{ actions: ActionAssociation[] }>(s, '/association/actions'),
  ]);
  if (!data) return <Encart ton="attention">{error ?? 'Les dossiers ne se chargent pas pour le moment.'}</Encart>;

  const financeursConnus = [
    ...new Set(
      (repertoire.data?.contacts ?? [])
        .filter((c) => c.roles.some((r) => r === 'FINANCEUR' || r === 'INSTITUTIONNEL' || r === 'ELU'))
        .map((c) => c.structure?.trim() || `${c.prenom} ${c.nom}`.trim())
        .filter(Boolean),
    ),
  ].sort((a, b) => a.localeCompare(b, 'fr'));
  const projetsConnus = (projets.data?.actions ?? []).map((a) => a.intitule).filter(Boolean).slice(0, 12);

  // Deux familles : ce qu'on demande, et les concours auxquels on répond.
  const choisie: NatureDossier | null = vue === 'appels' ? 'APPEL_A_PROJET' : vue === 'subventions' ? 'SUBVENTION' : null;
  const subventions = data.dossiers.filter((d) => d.nature !== 'APPEL_A_PROJET');
  const appels = data.dossiers.filter((d) => d.nature === 'APPEL_A_PROJET');
  const dossiers = choisie === 'SUBVENTION' ? subventions : choisie === 'APPEL_A_PROJET' ? appels : data.dossiers;
  const ongletsNature = [
    { code: '', libelle: 'Tout', nombre: data.dossiers.length },
    { code: 'subventions', libelle: 'Mes subventions', nombre: subventions.length },
    { code: 'appels', libelle: 'Mes appels à projet', nombre: appels.length },
  ];

  const demande = dossiers.reduce((t, d) => t + (d.montantDemande ?? 0), 0);
  const accorde = dossiers.filter((d) => d.etat === 'ACCORDE' || d.etat === 'SOLDE').reduce((t, d) => t + (d.montantAccorde ?? 0), 0);
  const aJustifier = dossiers.filter((d) => d.etat === 'ACCORDE').length;

  return (
    <>
      <Titre
        surtitre={nomCourt(data.organisation.nom)}
        sousTitre="D'un côté les subventions que tu demandes, de l'autre les appels à projet auxquels tu réponds. La date limite remonte sur l'accueil 60 jours avant."
        actions={
          <Link href="/chemin#partie-3" className="inline-flex items-center rounded-xl border-2 border-[#D9D6EE] bg-white px-4 py-2 text-sm font-bold text-[#1D1B5C] no-underline hover:border-[#4F46E5]">
            Comment demander une subvention
          </Link>
        }
      >
        Mes subventions et appels à projet
      </Titre>

      <section className="mb-6 grid gap-3 sm:grid-cols-3">
        <Tuile libelle="Demandé" valeur={formaterEuros(demande)} detail={`${dossiers.length} dossier${dossiers.length > 1 ? 's' : ''}`} />
        <Tuile libelle="Accordé" valeur={formaterEuros(accorde)} ton="ok" />
        <Tuile libelle="À justifier" valeur={aJustifier} detail="compte rendu à envoyer" ton={aJustifier ? 'attention' : 'neutre'} />
      </section>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {ongletsNature.map((o) => {
          const actif = (vue ?? '') === o.code;
          return (
            <Link
              key={o.libelle}
              href={o.code ? `/espace/dossiers?vue=${o.code}` : '/espace/dossiers'}
              className={`rounded-full px-4 py-2 text-sm font-bold no-underline ${actif ? 'bg-[#1D1B5C] text-white' : 'bg-white text-[#3B3A66] hover:bg-[#ECEBFC]'}`}
            >
              {o.libelle} <span className={actif ? 'text-[#C7C4F2]' : 'text-[#9A99B5]'}>{o.nombre}</span>
            </Link>
          );
        })}
      </div>

      <NouveauDossier financeursConnus={financeursConnus} projetsConnus={projetsConnus} />

      <div className="mt-8">
        <Tableau dossiers={dossiers} montrerNature={choisie === null} />
      </div>
    </>
  );
}
