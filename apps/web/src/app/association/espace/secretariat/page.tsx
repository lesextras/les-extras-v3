/* Textes allégés le 01/10/2026 (demande : le moins de texte possible) */
import Link from 'next/link';
import { apiEspace, contexteChemin, sessionAssociation } from '../../_session';
import { nomCourt } from '../../_nom';
import { chargerModeles } from '../../_chemin';
import { preremplissageDeBase } from '../../_fabrique';
import { CARTE, Encart, Pastille, SousTitre, Titre, Tuile } from '../../_ui';
import { dateCourte, formaterEuros, type Espace, type Mouvement, type ResumeBudget } from '../_types';
import { DocumentsSecretariat } from './DocumentsSecretariat';

/**
 * MON SECRÉTARIAT : les papiers de la vie de l'association (convocation,
 * ordre du jour, feuille de présence, procès-verbal, reçus fiscaux), les
 * obligations à tenir, et le cahier de comptes.
 */
const CODES_SECRETARIAT = ['convocation-ag', 'ordre-du-jour', 'feuille-de-presence', 'pv-ag', 'liste-dirigeants', 'rapport-activite', 'recu-fiscal'];

export default async function SecretariatPage() {
  const s = await sessionAssociation('/espace/secretariat');
  const [{ data, error }, comptes, modelesTous, contexte] = await Promise.all([
    apiEspace<Espace>(s, '/association/espace'),
    apiEspace<{ mouvements: Mouvement[]; resume: ResumeBudget }>(s, '/association/mouvements'),
    chargerModeles(),
    contexteChemin(),
  ]);
  if (!data) return <Encart ton="attention">{error ?? 'Le secrétariat ne se charge pas pour le moment.'}</Encart>;

  const { vieStatutaire: vie, classeur, dossiers, organisation } = data;
  const budget = comptes.data?.resume;
  const mouvements = comptes.data?.mouvements ?? [];
  const modeles = modelesTous.filter((m) => CODES_SECRETARIAT.includes(m.code));
  const prerempli = { ...preremplissageDeBase(), ...(contexte?.prerempli ?? {}) };

  const piecesPerimees = classeur.filter((c) => c.situation === 'PERIMEE');
  const piecesBientot = classeur.filter((c) => c.situation === 'BIENTOT_PERIMEE');
  const comptesRendus = dossiers.filter((d) => d.etat === 'ACCORDE');
  const donsSansRecu = mouvements.filter((m) => m.nature === 'DON' && !m.recuFiscal).length;

  const obligations = [
    {
      code: 'ag',
      titre: 'Assemblée générale annuelle',
      detail: vie.dateDerniereAG
        ? `Dernière : ${dateCourte(vie.dateDerniereAG)}${vie.prochaineAG ? ` · prochaine avant le ${dateCourte(vie.prochaineAG)}` : ''}`
        : 'Aucune AG notée.',
      etat: vie.agEnRetard ? 'ALERTE' : vie.agBientot ? 'ATTENTION' : vie.dateDerniereAG ? 'OK' : 'ATTENTION',
      action: { libelle: 'Noter la date', href: '/espace/association#vie' },
    },
    {
      code: 'bureau',
      titre: 'Bureau à jour',
      detail: vie.mandatsExpires.length
        ? `${vie.mandatsExpires.length} mandat${vie.mandatsExpires.length > 1 ? 's' : ''} fini${vie.mandatsExpires.length > 1 ? 's' : ''} : réélire, déclarer.`
        : vie.bureau.president && vie.bureau.tresorier
          ? 'Président et trésorier notés.'
          : 'Président ou trésorier manquant.',
      etat: vie.mandatsExpires.length ? 'ALERTE' : vie.bureau.president && vie.bureau.tresorier ? 'OK' : 'ATTENTION',
      action: { libelle: 'Mon équipe', href: '/espace/repertoire' },
    },
    {
      code: 'prefecture',
      titre: 'Changements en préfecture',
      detail: 'Bureau, statuts, siège : sous 3 mois, en ligne.',
      etat: 'INFO',
      action: { libelle: 'Faire la démarche', href: 'https://www.service-public.fr/associations/vosdroits/R37933', externe: true },
    },
    {
      code: 'comptes',
      titre: 'Comptes tenus et présentés',
      detail: budget
        ? `${budget.lignes} ligne${budget.lignes > 1 ? 's' : ''} notée${budget.lignes > 1 ? 's' : ''} · solde ${formaterEuros(budget.solde)}`
        : 'Aucune ligne.',
      etat: budget && budget.lignes > 0 ? 'OK' : 'ATTENTION',
      action: { libelle: 'Ma comptabilité', href: '/espace/comptabilite' },
    },
    {
      code: 'recus',
      titre: 'Un reçu par don',
      detail: donsSansRecu
        ? `${donsSansRecu} don${donsSansRecu > 1 ? 's' : ''} sans reçu.`
        : 'Tous les dons ont leur reçu.',
      etat: donsSansRecu ? 'ATTENTION' : 'OK',
      action: { libelle: 'Fabriquer un reçu', href: '#documents' },
    },
    {
      code: 'pieces',
      titre: 'Papiers à jour',
      detail: piecesPerimees.length
        ? `${piecesPerimees.length} pièce${piecesPerimees.length > 1 ? 's' : ''} périmée${piecesPerimees.length > 1 ? 's' : ''}.`
        : piecesBientot.length
          ? `${piecesBientot.length} pièce${piecesBientot.length > 1 ? 's' : ''} expire${piecesBientot.length > 1 ? 'nt' : ''} bientôt.`
          : 'Rien sous 60 jours.',
      etat: piecesPerimees.length ? 'ALERTE' : piecesBientot.length ? 'ATTENTION' : 'OK',
      action: { libelle: 'Le classeur', href: '/espace/classeur' },
    },
    {
      code: 'comptes-rendus',
      titre: 'Comptes rendus de subventions',
      detail: comptesRendus.length
        ? `${comptesRendus.length} à justifier.`
        : 'Aucun en attente.',
      etat: comptesRendus.length ? 'ATTENTION' : 'OK',
      action: { libelle: 'Mes demandes', href: '/espace/dossiers' },
    },
  ] as const;

  const aTenir = obligations.filter((o) => o.etat === 'ALERTE' || o.etat === 'ATTENTION').length;

  return (
    <>
      <Titre
        surtitre={nomCourt(organisation.nom)}
        sousTitre="Obligations, documents et comptes."
      >
        Mon secrétariat
      </Titre>

      <section className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Tuile libelle="Obligations à tenir" valeur={aTenir} detail={aTenir ? 'à regarder' : 'en règle'} ton={aTenir ? 'attention' : 'ok'} />
        <Tuile libelle="Documents à fabriquer" valeur={modeles.length} detail="Convocation, PV, reçus…" />
        <Tuile
          libelle="Pièces périmées"
          valeur={piecesPerimees.length}
          detail={piecesBientot.length ? `${piecesBientot.length} bientôt` : undefined}
          ton={piecesPerimees.length ? 'alerte' : piecesBientot.length ? 'attention' : 'ok'}
        />
        <Tuile
          libelle="Comptes rendus à faire"
          valeur={comptesRendus.length}
          ton={comptesRendus.length ? 'attention' : 'ok'}
        />
      </section>

      {/* --------------------------------------------------- les obligations */}
      <section id="obligations" className="mb-10 scroll-mt-24">
        <SousTitre>Obligations</SousTitre>
        <ul className="mt-4 grid gap-3 md:grid-cols-2">
          {obligations.map((o) => (
            <li key={o.code}>
              <div className={`${CARTE} flex h-full flex-col p-5`}>
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-extrabold leading-snug text-[#1D1B5C]">{o.titre}</h3>
                  <Pastille ton={o.etat === 'ALERTE' ? 'alerte' : o.etat === 'ATTENTION' ? 'attention' : o.etat === 'OK' ? 'ok' : 'neutre'}>
                    {o.etat === 'ALERTE' ? 'En retard' : o.etat === 'ATTENTION' ? 'À faire' : o.etat === 'OK' ? 'À jour' : 'Bon à savoir'}
                  </Pastille>
                </div>
                <p className="mt-1 text-sm leading-relaxed text-[#3B3A66]">{o.detail}</p>
                {'externe' in o.action && o.action.externe ? (
                  <a href={o.action.href} target="_blank" rel="noopener" className="mt-auto pt-3 text-sm font-bold text-[#4F46E5] underline underline-offset-4">
                    {o.action.libelle} ↗
                  </a>
                ) : (
                  <Link href={o.action.href} className="mt-auto pt-3 text-sm font-bold text-[#4F46E5] underline underline-offset-4">
                    {o.action.libelle} →
                  </Link>
                )}
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* ------------------------------------------------------ les documents */}
      <section id="documents" className="mb-10 scroll-mt-24">
        <SousTitre info="Quelques champs à remplir : PDF rangé dans tes documents, Word en option.">Documents à fabriquer</SousTitre>
        <div className="mt-4">
          <DocumentsSecretariat modeles={modeles} prerempli={prerempli} />
        </div>
      </section>

      {/* --------------------------------------------------------- l'argent */}
      <section id="comptes" className="scroll-mt-24">
        <SousTitre>L&apos;argent</SousTitre>
        <Link href="/espace/comptabilite" className={`${CARTE} block p-5 no-underline transition hover:border-[#4F46E5]`}>
          <span className="block text-lg font-extrabold text-[#1D1B5C]">Ma comptabilité</span>
          <span className="mt-1 block text-sm text-[#6B6A8A]">
            {budget?.lignes
              ? `${budget.lignes} ligne${budget.lignes > 1 ? 's' : ''} notée${budget.lignes > 1 ? 's' : ''} · solde ${formaterEuros(budget.solde)}`
              : 'Aucune ligne.'}
          </span>
          <span className="mt-3 block text-sm font-bold text-[#4F46E5]">Ouvrir →</span>
        </Link>
      </section>

    </>
  );
}
