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
      titre: 'Tenir une assemblée générale par an',
      detail: vie.dateDerniereAG
        ? `Dernière assemblée le ${dateCourte(vie.dateDerniereAG)}${vie.prochaineAG ? ` · la prochaine avant le ${dateCourte(vie.prochaineAG)}` : ''}`
        : "Aucune assemblée notée : c'est la première chose que demandent les financeurs.",
      etat: vie.agEnRetard ? 'ALERTE' : vie.agBientot ? 'ATTENTION' : vie.dateDerniereAG ? 'OK' : 'ATTENTION',
      action: { libelle: 'Noter la date', href: '/espace/association#vie' },
    },
    {
      code: 'bureau',
      titre: 'Un bureau à jour, avec des mandats valides',
      detail: vie.mandatsExpires.length
        ? `${vie.mandatsExpires.length} mandat${vie.mandatsExpires.length > 1 ? 's' : ''} fini${vie.mandatsExpires.length > 1 ? 's' : ''} : à réélire, puis à déclarer en préfecture.`
        : vie.bureau.president && vie.bureau.tresorier
          ? 'Président et trésorier notés.'
          : 'Il manque au moins le président ou le trésorier.',
      etat: vie.mandatsExpires.length ? 'ALERTE' : vie.bureau.president && vie.bureau.tresorier ? 'OK' : 'ATTENTION',
      action: { libelle: 'Mon équipe', href: '/espace/repertoire' },
    },
    {
      code: 'prefecture',
      titre: 'Déclarer les changements en préfecture',
      detail:
        'Changement de bureau, de statuts, de siège : la déclaration se fait dans les 3 mois, en ligne. La liste des dirigeants se fabrique ici.',
      etat: 'INFO',
      action: { libelle: 'Faire la démarche', href: 'https://www.service-public.fr/associations/vosdroits/R37933', externe: true },
    },
    {
      code: 'comptes',
      titre: 'Tenir les comptes et les présenter en assemblée',
      detail: budget
        ? `${budget.lignes} ligne${budget.lignes > 1 ? 's' : ''} notée${budget.lignes > 1 ? 's' : ''} · solde ${formaterEuros(budget.solde)}`
        : 'Le cahier de comptes est vide.',
      etat: budget && budget.lignes > 0 ? 'OK' : 'ATTENTION',
      action: { libelle: 'Ma comptabilité', href: '/espace/comptabilite' },
    },
    {
      code: 'recus',
      titre: 'Délivrer un reçu pour chaque don',
      detail: donsSansRecu
        ? `${donsSansRecu} don${donsSansRecu > 1 ? 's' : ''} sans reçu fiscal noté.`
        : 'Chaque don noté a son reçu.',
      etat: donsSansRecu ? 'ATTENTION' : 'OK',
      action: { libelle: 'Fabriquer un reçu', href: '#documents' },
    },
    {
      code: 'pieces',
      titre: 'Garder les papiers à jour',
      detail: piecesPerimees.length
        ? `${piecesPerimees.length} pièce${piecesPerimees.length > 1 ? 's' : ''} périmée${piecesPerimees.length > 1 ? 's' : ''}.`
        : piecesBientot.length
          ? `${piecesBientot.length} pièce${piecesBientot.length > 1 ? 's' : ''} expire${piecesBientot.length > 1 ? 'nt' : ''} bientôt.`
          : 'Rien ne périme dans les 60 jours.',
      etat: piecesPerimees.length ? 'ALERTE' : piecesBientot.length ? 'ATTENTION' : 'OK',
      action: { libelle: 'Le classeur', href: '/espace/classeur' },
    },
    {
      code: 'comptes-rendus',
      titre: 'Rendre compte des subventions reçues',
      detail: comptesRendus.length
        ? `${comptesRendus.length} subvention${comptesRendus.length > 1 ? 's' : ''} accordée${comptesRendus.length > 1 ? 's' : ''} à justifier.`
        : 'Aucun compte rendu en attente.',
      etat: comptesRendus.length ? 'ATTENTION' : 'OK',
      action: { libelle: 'Mes demandes', href: '/espace/dossiers' },
    },
  ] as const;

  const aTenir = obligations.filter((o) => o.etat === 'ALERTE' || o.etat === 'ATTENTION').length;

  return (
    <>
      <Titre
        surtitre={nomCourt(organisation.nom)}
        sousTitre="Les papiers de la vie de l'association, les obligations à tenir, et l'argent qui entre et qui sort. Tout ce qu'un secrétaire et un trésorier ont à faire, au même endroit."
      >
        Mon secrétariat
      </Titre>

      <section className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Tuile libelle="Obligations à tenir" valeur={aTenir} detail={aTenir ? 'À regarder de près' : 'Tout est en règle'} ton={aTenir ? 'attention' : 'ok'} />
        <Tuile libelle="Documents à fabriquer" valeur={modeles.length} detail="Convocation, PV, reçus…" />
        <Tuile
          libelle="Pièces périmées"
          valeur={piecesPerimees.length}
          detail={piecesBientot.length ? `${piecesBientot.length} expire${piecesBientot.length > 1 ? 'nt' : ''} bientôt` : 'Rien à renouveler'}
          ton={piecesPerimees.length ? 'alerte' : piecesBientot.length ? 'attention' : 'ok'}
        />
        <Tuile
          libelle="Comptes rendus à faire"
          valeur={comptesRendus.length}
          detail={comptesRendus.length ? 'Subventions accordées à justifier' : 'Rien en attente'}
          ton={comptesRendus.length ? 'attention' : 'ok'}
        />
      </section>

      {/* --------------------------------------------------- les obligations */}
      <section id="obligations" className="mb-10 scroll-mt-24">
        <SousTitre>Ce que l&apos;association doit tenir</SousTitre>
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
        <SousTitre>Les documents à fabriquer</SousTitre>
        <p className="mt-1 max-w-[70ch] text-sm text-[#6B6A8A]">
          Tu remplis quelques champs, le document sort en PDF (rangé dans tes documents) et en Word si tu veux le retoucher.
        </p>
        <div className="mt-4">
          <DocumentsSecretariat modeles={modeles} prerempli={prerempli} />
        </div>
      </section>

      {/* --------------------------------------------------------- l'argent */}
      <section id="comptes" className="scroll-mt-24">
        <SousTitre>L&apos;argent</SousTitre>
        <p className="mt-1 mb-4 max-w-[70ch] text-sm text-[#6B6A8A]">
          Les comptes ont leur propre page : le cahier de comptes, le prévisionnel, les dons et les reçus fiscaux, la billetterie et les ventes.
        </p>
        <Link href="/espace/comptabilite" className={`${CARTE} block p-5 no-underline transition hover:border-[#4F46E5]`}>
          <span className="block text-lg font-extrabold text-[#1D1B5C]">Ma comptabilité</span>
          <span className="mt-1 block text-sm text-[#6B6A8A]">
            {budget?.lignes
              ? `${budget.lignes} ligne${budget.lignes > 1 ? 's' : ''} notée${budget.lignes > 1 ? 's' : ''} · solde ${formaterEuros(budget.solde)}`
              : 'Le cahier de comptes est encore vide : une ligne par don, par cotisation, par achat.'}
          </span>
          <span className="mt-3 block text-sm font-bold text-[#4F46E5]">Ouvrir ma comptabilité →</span>
        </Link>
      </section>

    </>
  );
}
