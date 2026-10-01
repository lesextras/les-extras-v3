/* Textes allégés le 01/10/2026 (demande : le moins de texte possible) */
import Link from 'next/link';
import { apiEspace, sessionAssociation } from '../../_session';
import { nomCourt } from '../../_nom';
import { CARTE, Carte, Encart, SousTitre, Titre, Tuile } from '../../_ui';
import {
  LIBELLES_NATURE_MOUVEMENT,
  dateCourte,
  formaterEuros,
  type Espace,
  type Mouvement,
  type NatureMouvement,
  type ResumeBudget,
} from '../_types';
import { Mouvements } from '../budget/Mouvements';

/**
 * MA COMPTABILITÉ : tout l'argent de l'association au même endroit — ce qui est
 * là, ce qui est attendu, ce qui reste à trouver. Le cahier de comptes est la
 * pièce qu'on présente en assemblée générale ; le prévisionnel est celle qu'on
 * joint à une demande de subvention.
 */

const NATURES_RECETTE_AFFICHEES: NatureMouvement[] = ['DON', 'ADHESION', 'VENTE', 'BILLETTERIE', 'SUBVENTION', 'MECENAT', 'PRESTATION', 'AUTRE_RECETTE'];
const NATURES_DEPENSE_AFFICHEES: NatureMouvement[] = ['ACHAT', 'MATERIEL', 'LOCAL', 'ASSURANCE', 'DEPLACEMENT', 'COMMUNICATION', 'SALAIRE', 'BANQUE', 'AUTRE_DEPENSE'];

/** Les plateformes où une association peut ouvrir une collecte, avec ce qu'elles prennent. */
const PLATEFORMES = [
  {
    nom: 'HelloAsso',
    lien: 'https://www.helloasso.com/',
    enUnMot: 'Dons, adhésions, billetterie · sans commission',
  },
  {
    nom: 'Ulule',
    lien: 'https://fr.ulule.com/',
    enUnMot: 'Collecte à objectif, contreparties',
  },
  {
    nom: 'KissKissBankBank',
    lien: 'https://www.kisskissbankbank.com/',
    enUnMot: 'Collecte à objectif · culture, solidarité',
  },
  {
    nom: 'Leetchi',
    lien: 'https://www.leetchi.com/fr',
    enUnMot: 'Cagnotte simple, ponctuelle',
  },
  {
    nom: 'Dartagnans',
    lien: 'https://dartagnans.fr/',
    enUnMot: 'Patrimoine et culture, accompagnée',
  },
];

export default async function ComptabilitePage() {
  const s = await sessionAssociation('/espace/comptabilite');
  const [{ data, error }, comptes] = await Promise.all([
    apiEspace<Espace>(s, '/association/espace'),
    apiEspace<{ mouvements: Mouvement[]; resume: ResumeBudget }>(s, '/association/mouvements'),
  ]);
  if (!data) return <Encart ton="attention">{error ?? 'La comptabilité ne se charge pas pour le moment.'}</Encart>;

  const { organisation, dossiers } = data;
  const budget = comptes.data?.resume;
  const mouvements = comptes.data?.mouvements ?? [];
  const annee = budget?.annee ?? new Date().getFullYear();
  const parNature = budget?.parNature ?? {};
  const montant = (n: NatureMouvement) => parNature[n] ?? 0;

  const donsSansRecu = mouvements.filter((m) => m.nature === 'DON' && !m.recuFiscal);
  const derniersDons = mouvements.filter((m) => m.nature === 'DON').slice(0, 5);

  /* ------------------------------------------------- le prévisionnel financier */
  const accordes = dossiers.filter((d) => d.etat === 'ACCORDE');
  const enAttente = dossiers.filter((d) => d.etat === 'DEPOSE' || d.etat === 'EN_ECRITURE');
  const subventionsAccordees = accordes.reduce((t, d) => t + (d.montantAccorde ?? 0), 0);
  const subventionsEncaissees = montant('SUBVENTION');
  const resteAEncaisser = Math.max(subventionsAccordees - subventionsEncaissees, 0);
  const subventionsDemandees = enAttente.reduce((t, d) => t + (d.montantDemande ?? d.montantMax ?? 0), 0);
  const recettesAnnee = budget?.recettesAnnee ?? 0;
  const depensesAnnee = budget?.depensesAnnee ?? 0;
  const attendu = recettesAnnee + resteAEncaisser;
  const optimiste = attendu + subventionsDemandees;

  const previsionnel = [
    { libelle: 'Déjà encaissé cette année', montant: recettesAnnee, detail: `depuis le 1ᵉʳ janvier ${annee}`, ton: 'ok' as const },
    {
      libelle: 'Subventions accordées, pas encore versées',
      montant: resteAEncaisser,
      detail: accordes.length ? `${accordes.length} subvention${accordes.length > 1 ? 's' : ''}` : 'aucune',
      ton: 'attente' as const,
    },
    {
      libelle: 'Demandes en cours',
      montant: subventionsDemandees,
      detail: enAttente.length ? `${enAttente.length} dossier${enAttente.length > 1 ? 's' : ''}` : 'aucune',
      ton: 'espoir' as const,
    },
    { libelle: 'Déjà dépensé cette année', montant: -depensesAnnee, detail: `depuis le 1ᵉʳ janvier ${annee}`, ton: 'sortie' as const },
  ];

  return (
    <>
      <Titre
        surtitre={nomCourt(organisation.nom)}
        sousTitre="Ce qui est là, attendu, à trouver."
      >
        Ma comptabilité
      </Titre>

      <section className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Tuile libelle="Solde" valeur={formaterEuros(budget?.solde ?? 0)} detail={`${budget?.lignes ?? 0} ligne${(budget?.lignes ?? 0) > 1 ? 's' : ''}`} ton={(budget?.solde ?? 0) < 0 ? 'alerte' : 'ok'} />
        <Tuile libelle={`Entré en ${annee}`} valeur={formaterEuros(recettesAnnee)} ton="ok" />
        <Tuile libelle={`Sorti en ${annee}`} valeur={formaterEuros(depensesAnnee)} />
        <Tuile
          libelle="Reçus fiscaux à faire"
          valeur={donsSansRecu.length}
          ton={donsSansRecu.length ? 'attention' : 'ok'}
        />
      </section>

      {/* ------------------------------------------------------ le prévisionnel */}
      <section id="previsionnel" className="mb-10 scroll-mt-24">
        <SousTitre info="Rempli tout seul depuis le cahier de comptes et tes demandes.">Prévisionnel</SousTitre>
        <div className={`${CARTE} divide-y divide-[#E6E4F3]`}>
          {previsionnel.map((l) => (
            <div key={l.libelle} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
              <div className="min-w-0">
                <p className="font-extrabold text-[#1D1B5C]">{l.libelle}</p>
                <p className="mt-0.5 text-sm text-[#6B6A8A]">{l.detail}</p>
              </div>
              <p
                className={`shrink-0 text-xl font-extrabold tabular-nums ${
                  l.ton === 'sortie' ? 'text-[#8A2419]' : l.ton === 'ok' ? 'text-[#0F5F3E]' : l.ton === 'attente' ? 'text-[#1D1B5C]' : 'text-[#6B6A8A]'
                }`}
              >
                {l.ton === 'sortie' ? '−' : '+'} {formaterEuros(Math.abs(l.montant))}
              </p>
            </div>
          ))}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-[#F5F4FC] px-5 py-4">
            <div>
              <p className="font-extrabold text-[#1D1B5C]">Si tout ce qui est accordé rentre</p>
              <p className="mt-0.5 text-sm text-[#6B6A8A]">Prudent : encaissé + promis</p>
            </div>
            <p className="text-2xl font-extrabold tabular-nums text-[#1D1B5C]">{formaterEuros(attendu - depensesAnnee)}</p>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
            <div>
              <p className="font-extrabold text-[#1D1B5C]">Si toutes les demandes aboutissent</p>
              <p className="mt-0.5 text-sm text-[#6B6A8A]">Optimiste : jamais comme une certitude</p>
            </div>
            <p className="text-xl font-extrabold tabular-nums text-[#6B6A8A]">{formaterEuros(optimiste - depensesAnnee)}</p>
          </div>
        </div>
        <p className="mt-3 text-sm text-[#6B6A8A]">
          Source :{' '}
          <Link href="/espace/dossiers" className="font-bold text-[#4F46E5] underline underline-offset-4">
            mes dossiers
          </Link>
        </p>
      </section>

      {/* ------------------------------------------------- les versements attendus */}
      <section id="versements" className="mb-10 scroll-mt-24">
        <SousTitre info="Accordée ≠ versée : souvent un acompte, puis le solde après le compte rendu.">Versements attendus</SousTitre>

        {accordes.length ? (
          <>
            <div className={`${CARTE} divide-y divide-[#E6E4F3]`}>
              {accordes.map((d) => (
                <div key={d.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                  <div className="min-w-0">
                    <Link href={`/espace/dossiers/${d.id}`} className="font-extrabold text-[#1D1B5C] no-underline hover:underline">
                      {d.intitule}
                    </Link>
                    <p className="mt-0.5 text-sm text-[#6B6A8A]">
                      {d.financeur}
                      {d.dateDecision ? ` · accordée le ${dateCourte(d.dateDecision)}` : ''}
                    </p>
                  </div>
                  <p className="shrink-0 text-lg font-extrabold tabular-nums text-[#1D1B5C]">
                    {formaterEuros(d.montantAccorde ?? 0)}
                  </p>
                </div>
              ))}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-[#F5F4FC] px-5 py-4">
                <div>
                  <p className="font-extrabold text-[#1D1B5C]">Reste à encaisser</p>
                  <p className="mt-0.5 text-sm text-[#6B6A8A]">
                    {formaterEuros(subventionsAccordees)} accordés · {formaterEuros(subventionsEncaissees)} notés
                  </p>
                </div>
                <p className="text-2xl font-extrabold tabular-nums text-[#1D1B5C]">{formaterEuros(resteAEncaisser)}</p>
              </div>
            </div>
            <Encart ton={resteAEncaisser > 0 ? 'attention' : 'ok'}>
              {resteAEncaisser > 0
                ? 'Argent reçu ? Note-le en recette « Subvention » ci-dessous.'
                : 'Tout est noté.'}
            </Encart>
          </>
        ) : (
          <Encart>
            Aucune subvention accordée.{' '}
            <Link href="/espace/dossiers" className="font-bold underline underline-offset-4">
              Mes dossiers
            </Link>
          </Encart>
        )}
      </section>

      {/* -------------------------------------------------------------- les dons */}
      <section id="dons" className="mb-10 scroll-mt-24">
        <SousTitre info="Reçu fiscal : le donateur récupère 66 % sur ses impôts.">Dons</SousTitre>
        <div className="grid gap-4 md:grid-cols-3">
          <div className={`${CARTE} px-5 py-4`}>
            <p className="text-sm font-bold text-[#6B6A8A]">Dons reçus</p>
            <p className="text-2xl font-extrabold tabular-nums text-[#1D1B5C]">{formaterEuros(budget?.dons ?? 0)}</p>
            <p className="text-sm text-[#6B6A8A]">{budget?.donsAvecRecu ?? 0} avec reçu fiscal</p>
          </div>
          <div className={`${CARTE} px-5 py-4`}>
            <p className="text-sm font-bold text-[#6B6A8A]">Mécénat d&apos;entreprise</p>
            <p className="text-2xl font-extrabold tabular-nums text-[#1D1B5C]">{formaterEuros(montant('MECENAT'))}</p>
            <p className="text-sm text-[#6B6A8A]">60 % déductibles</p>
          </div>
          <div className={`${CARTE} px-5 py-4`}>
            <p className="text-sm font-bold text-[#6B6A8A]">Adhésions</p>
            <p className="text-2xl font-extrabold tabular-nums text-[#1D1B5C]">{formaterEuros(budget?.adhesions ?? 0)}</p>
            <p className="text-sm text-[#6B6A8A]">Cotisations</p>
          </div>
        </div>

        {donsSansRecu.length ? (
          <div className="mt-4">
            <Encart ton="attention">
              <p className="font-extrabold">
                {donsSansRecu.length} don{donsSansRecu.length > 1 ? 's' : ''} sans reçu fiscal.
              </p>
              <Link href="/espace/secretariat#documents" className="mt-3 inline-flex text-sm font-bold text-[#4F46E5] underline underline-offset-4">
                Fabriquer un reçu →
              </Link>
            </Encart>
          </div>
        ) : null}

        {derniersDons.length ? (
          <ul className="mt-4 divide-y divide-[#E6E4F3] overflow-hidden rounded-2xl border border-[#E6E4F3] bg-white">
            {derniersDons.map((d) => (
              <li key={d.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
                <span className="min-w-0">
                  <span className="block font-bold text-[#1D1B5C]">{d.tiers ?? d.libelle}</span>
                  <span className="block text-sm text-[#6B6A8A]">
                    {dateCourte(d.date)}
                    {d.recuFiscal ? ' · reçu fait' : ' · reçu à faire'}
                  </span>
                </span>
                <span className="font-extrabold tabular-nums text-[#0F5F3E]">+ {formaterEuros(d.montant)}</span>
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      {/* ---------------------------------------------------------- la collecte */}
      <section id="collecte" className="mb-10 scroll-mt-24">
        <SousTitre info="Dons par carte. Note ici ce que la plateforme te verse.">Collecter en ligne</SousTitre>
        <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {PLATEFORMES.map((p) => (
            <li key={p.nom}>
              <div className={`${CARTE} flex h-full flex-col p-5`}>
                <span className="text-lg font-extrabold text-[#1D1B5C]">{p.nom}</span>
                <span className="mt-1 block text-sm leading-relaxed text-[#6B6A8A]">{p.enUnMot}</span>
                <a href={p.lien} target="_blank" rel="noopener" className="mt-auto pt-4 text-sm font-bold text-[#4F46E5] underline underline-offset-4">
                  Ouvrir ↗
                </a>
              </div>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-sm text-[#6B6A8A]">Frais à vérifier sur chaque site.</p>
      </section>

      {/* ------------------------------------------------- billetterie et ventes */}
      <section id="billetterie" className="mb-10 scroll-mt-24">
        <SousTitre>Billetterie et ventes</SousTitre>
        <div className="grid gap-4 md:grid-cols-3">
          <div className={`${CARTE} px-5 py-4`}>
            <p className="text-sm font-bold text-[#6B6A8A]">Billetterie</p>
            <p className="text-2xl font-extrabold tabular-nums text-[#1D1B5C]">{formaterEuros(montant('BILLETTERIE'))}</p>
            <p className="text-sm text-[#6B6A8A]">Entrées d&apos;événements</p>
          </div>
          <div className={`${CARTE} px-5 py-4`}>
            <p className="text-sm font-bold text-[#6B6A8A]">Ventes</p>
            <p className="text-2xl font-extrabold tabular-nums text-[#1D1B5C]">{formaterEuros(budget?.ventes ?? 0)}</p>
            <p className="text-sm text-[#6B6A8A]">Buvette, objets, gâteaux</p>
          </div>
          <div className={`${CARTE} px-5 py-4`}>
            <p className="text-sm font-bold text-[#6B6A8A]">Prestations facturées</p>
            <p className="text-2xl font-extrabold tabular-nums text-[#1D1B5C]">{formaterEuros(montant('PRESTATION'))}</p>
            <p className="text-sm text-[#6B6A8A]">Ateliers, interventions</p>
          </div>
        </div>
        <p className="mt-3 text-sm text-[#6B6A8A]">
          Rattachées à{' '}
          <Link href="/espace/projets" className="font-bold text-[#4F46E5] underline underline-offset-4">
            mes projets
          </Link>
        </p>
      </section>

      {/* -------------------------------------------------- ce qui entre et sort */}
      <section id="repartition" className="mb-10 scroll-mt-24">
        <SousTitre>Entrées et sorties</SousTitre>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Carte>
            <p className="font-extrabold text-[#0F5F3E]">Les entrées</p>
            <ul className="mt-3 space-y-1.5 text-sm">
              {NATURES_RECETTE_AFFICHEES.filter((n) => montant(n) > 0).map((n) => (
                <li key={n} className="flex items-center justify-between gap-3">
                  <span className="text-[#3B3A66]">{LIBELLES_NATURE_MOUVEMENT[n]}</span>
                  <span className="font-bold tabular-nums text-[#1D1B5C]">{formaterEuros(montant(n))}</span>
                </li>
              ))}
              {NATURES_RECETTE_AFFICHEES.every((n) => montant(n) === 0) ? <li className="text-[#6B6A8A]">Aucune entrée.</li> : null}
            </ul>
            <p className="mt-3 flex items-center justify-between border-t border-[#E6E4F3] pt-3 font-extrabold text-[#1D1B5C]">
              <span>Total</span>
              <span className="tabular-nums">{formaterEuros(budget?.recettes ?? 0)}</span>
            </p>
          </Carte>
          <Carte>
            <p className="font-extrabold text-[#8A2419]">Les sorties</p>
            <ul className="mt-3 space-y-1.5 text-sm">
              {NATURES_DEPENSE_AFFICHEES.filter((n) => montant(n) > 0).map((n) => (
                <li key={n} className="flex items-center justify-between gap-3">
                  <span className="text-[#3B3A66]">{LIBELLES_NATURE_MOUVEMENT[n]}</span>
                  <span className="font-bold tabular-nums text-[#1D1B5C]">{formaterEuros(montant(n))}</span>
                </li>
              ))}
              {NATURES_DEPENSE_AFFICHEES.every((n) => montant(n) === 0) ? <li className="text-[#6B6A8A]">Aucune sortie.</li> : null}
            </ul>
            <p className="mt-3 flex items-center justify-between border-t border-[#E6E4F3] pt-3 font-extrabold text-[#1D1B5C]">
              <span>Total</span>
              <span className="tabular-nums">{formaterEuros(budget?.depenses ?? 0)}</span>
            </p>
          </Carte>
        </div>
      </section>

      {/* ------------------------------------------------- le cahier de comptes */}
      <section id="cahier" className="scroll-mt-24">
        <SousTitre info="Une ligne par mouvement. Recherche, filtre et export tableur.">Cahier de comptes</SousTitre>
        <Mouvements mouvements={mouvements} />
      </section>

      <p className="mt-8 text-sm text-[#6B6A8A]">
        Obligations et documents :{' '}
        <Link href="/espace/secretariat" className="font-bold text-[#4F46E5] underline underline-offset-4">
          mon secrétariat
        </Link>
      </p>
    </>
  );
}
