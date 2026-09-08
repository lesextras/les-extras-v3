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
    enUnMot: 'Dons, adhésions et billetterie. Aucune commission : la plateforme vit des pourboires laissés par les donateurs.',
  },
  {
    nom: 'Ulule',
    lien: 'https://fr.ulule.com/',
    enUnMot: 'Collecte à objectif, avec contreparties. Pensée pour un projet précis qu’on raconte.',
  },
  {
    nom: 'KissKissBankBank',
    lien: 'https://www.kisskissbankbank.com/',
    enUnMot: 'Collecte à objectif elle aussi, très visible sur les projets culturels et solidaires.',
  },
  {
    nom: 'Leetchi',
    lien: 'https://www.leetchi.com/fr',
    enUnMot: 'Cagnotte simple à ouvrir, pour une collecte ponctuelle entre proches et sympathisants.',
  },
  {
    nom: 'Dartagnans',
    lien: 'https://dartagnans.fr/',
    enUnMot: 'Spécialisée patrimoine et culture, avec un accompagnement de la campagne.',
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
    { libelle: 'Déjà encaissé cette année', montant: recettesAnnee, detail: `Tout ce qui est entré depuis le 1ᵉʳ janvier ${annee}`, ton: 'ok' as const },
    {
      libelle: 'Subventions accordées, pas encore versées',
      montant: resteAEncaisser,
      detail: accordes.length ? `${accordes.length} subvention${accordes.length > 1 ? 's' : ''} accordée${accordes.length > 1 ? 's' : ''}` : 'Aucune subvention accordée pour l’instant',
      ton: 'attente' as const,
    },
    {
      libelle: 'Demandes en cours',
      montant: subventionsDemandees,
      detail: enAttente.length ? `${enAttente.length} dossier${enAttente.length > 1 ? 's' : ''} déposé${enAttente.length > 1 ? 's' : ''} ou en écriture` : 'Aucune demande en cours',
      ton: 'espoir' as const,
    },
    { libelle: 'Déjà dépensé cette année', montant: -depensesAnnee, detail: `Tout ce qui est sorti depuis le 1ᵉʳ janvier ${annee}`, ton: 'sortie' as const },
  ];

  return (
    <>
      <Titre
        surtitre={nomCourt(organisation.nom)}
        sousTitre="Tout l'argent de l'association au même endroit : ce qui est là, ce qui est attendu, ce qui reste à trouver. Le cahier de comptes se présente en assemblée générale ; le prévisionnel se joint à une demande de subvention."
      >
        Ma comptabilité
      </Titre>

      <section className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Tuile libelle="Solde" valeur={formaterEuros(budget?.solde ?? 0)} detail={`${budget?.lignes ?? 0} ligne${(budget?.lignes ?? 0) > 1 ? 's' : ''} notée${(budget?.lignes ?? 0) > 1 ? 's' : ''}`} ton={(budget?.solde ?? 0) < 0 ? 'alerte' : 'ok'} />
        <Tuile libelle={`Entré en ${annee}`} valeur={formaterEuros(recettesAnnee)} detail="Dons, adhésions, ventes, subventions" ton="ok" />
        <Tuile libelle={`Sorti en ${annee}`} valeur={formaterEuros(depensesAnnee)} detail="Achats, local, assurance, déplacements" />
        <Tuile
          libelle="Reçus fiscaux à faire"
          valeur={donsSansRecu.length}
          detail={donsSansRecu.length ? 'Un donateur attend son reçu' : 'Tous les dons ont leur reçu'}
          ton={donsSansRecu.length ? 'attention' : 'ok'}
        />
      </section>

      {/* ------------------------------------------------------ le prévisionnel */}
      <section id="previsionnel" className="mb-10 scroll-mt-24">
        <SousTitre>Le prévisionnel financier</SousTitre>
        <p className="mt-1 mb-4 max-w-[70ch] text-sm text-[#6B6A8A]">
          Ce que l&apos;association a déjà, ce qu&apos;elle attend, ce qu&apos;elle espère. Il se remplit tout seul depuis le cahier de comptes et depuis tes
          demandes de subvention : rien à recopier.
        </p>
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
              <p className="mt-0.5 text-sm text-[#6B6A8A]">Le prudent : ce qui est encaissé, plus ce qui est promis.</p>
            </div>
            <p className="text-2xl font-extrabold tabular-nums text-[#1D1B5C]">{formaterEuros(attendu - depensesAnnee)}</p>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
            <div>
              <p className="font-extrabold text-[#1D1B5C]">Si toutes les demandes aboutissent</p>
              <p className="mt-0.5 text-sm text-[#6B6A8A]">L&apos;optimiste : à ne jamais écrire dans un dossier comme une certitude.</p>
            </div>
            <p className="text-xl font-extrabold tabular-nums text-[#6B6A8A]">{formaterEuros(optimiste - depensesAnnee)}</p>
          </div>
        </div>
        <p className="mt-3 text-sm text-[#6B6A8A]">
          Les montants viennent de{' '}
          <Link href="/espace/dossiers" className="font-bold text-[#4F46E5] underline underline-offset-4">
            mes subventions et appels à projet
          </Link>
          . Corrige-les là-bas, ils se mettent à jour ici.
        </p>
      </section>

      {/* ------------------------------------------------- les versements attendus */}
      <section id="versements" className="mb-10 scroll-mt-24">
        <SousTitre>Les versements attendus</SousTitre>
        <p className="mt-1 mb-4 max-w-[70ch] text-sm text-[#6B6A8A]">
          Une subvention accordée n&apos;est pas une subvention versée : il y a souvent un acompte, puis un solde après le
          compte rendu. Cette liste dit, dossier par dossier, ce qui a été promis et ce qui manque encore sur le compte.
        </p>

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
                    {formaterEuros(subventionsAccordees)} accordés, {formaterEuros(subventionsEncaissees)} déjà notés au cahier de comptes.
                  </p>
                </div>
                <p className="text-2xl font-extrabold tabular-nums text-[#1D1B5C]">{formaterEuros(resteAEncaisser)}</p>
              </div>
            </div>
            <Encart ton={resteAEncaisser > 0 ? 'attention' : 'ok'}>
              {resteAEncaisser > 0
                ? "Quand l'argent arrive sur le compte, note-le en recette « Subvention » dans le cahier de comptes ci-dessous : cette ligne se met à jour toute seule."
                : 'Tout ce qui a été accordé est noté au cahier de comptes. Rien ne traîne.'}
            </Encart>
          </>
        ) : (
          <Encart>
            Aucune subvention accordée pour l&apos;instant. Dès qu&apos;un financeur dit oui, note le montant dans{' '}
            <Link href="/espace/dossiers" className="font-bold underline underline-offset-4">
              le dossier concerné
            </Link>{' '}
            : le versement attendu apparaîtra ici.
          </Encart>
        )}
      </section>

      {/* -------------------------------------------------------------- les dons */}
      <section id="dons" className="mb-10 scroll-mt-24">
        <SousTitre>Les dons</SousTitre>
        <p className="mt-1 mb-4 max-w-[70ch] text-sm text-[#6B6A8A]">
          Chaque don noté ici peut donner droit à un reçu fiscal : le donateur récupère 66 % de la somme sur ses impôts. C&apos;est souvent ce qui décide
          quelqu&apos;un à donner davantage.
        </p>
        <div className="grid gap-4 md:grid-cols-3">
          <div className={`${CARTE} px-5 py-4`}>
            <p className="text-sm font-bold text-[#6B6A8A]">Dons reçus</p>
            <p className="text-2xl font-extrabold tabular-nums text-[#1D1B5C]">{formaterEuros(budget?.dons ?? 0)}</p>
            <p className="text-sm text-[#6B6A8A]">{budget?.donsAvecRecu ?? 0} avec reçu fiscal</p>
          </div>
          <div className={`${CARTE} px-5 py-4`}>
            <p className="text-sm font-bold text-[#6B6A8A]">Mécénat d&apos;entreprise</p>
            <p className="text-2xl font-extrabold tabular-nums text-[#1D1B5C]">{formaterEuros(montant('MECENAT'))}</p>
            <p className="text-sm text-[#6B6A8A]">Une entreprise récupère 60 %</p>
          </div>
          <div className={`${CARTE} px-5 py-4`}>
            <p className="text-sm font-bold text-[#6B6A8A]">Adhésions</p>
            <p className="text-2xl font-extrabold tabular-nums text-[#1D1B5C]">{formaterEuros(budget?.adhesions ?? 0)}</p>
            <p className="text-sm text-[#6B6A8A]">Cotisations encaissées</p>
          </div>
        </div>

        {donsSansRecu.length ? (
          <div className="mt-4">
            <Encart ton="attention">
              <p className="font-extrabold">
                {donsSansRecu.length} don{donsSansRecu.length > 1 ? 's' : ''} sans reçu fiscal.
              </p>
              <p className="mt-1 text-sm leading-relaxed">
                Le reçu se fabrique en deux minutes, et il se range tout seul dans tes documents.
              </p>
              <Link href="/espace/secretariat#documents" className="mt-3 inline-flex text-sm font-bold text-[#4F46E5] underline underline-offset-4">
                Fabriquer un reçu fiscal →
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
                    {d.recuFiscal ? ' · reçu fiscal établi' : ' · reçu fiscal à faire'}
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
        <SousTitre>Collecter en ligne</SousTitre>
        <p className="mt-1 mb-4 max-w-[70ch] text-sm text-[#6B6A8A]">
          Une page de collecte permet de recevoir des dons par carte, sans manipuler d&apos;argent. Ouvre-la sur la plateforme qui te convient, puis note ici ce
          qu&apos;elle te verse : le cahier de comptes reste la référence.
        </p>
        <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {PLATEFORMES.map((p) => (
            <li key={p.nom}>
              <div className={`${CARTE} flex h-full flex-col p-5`}>
                <span className="text-lg font-extrabold text-[#1D1B5C]">{p.nom}</span>
                <span className="mt-1 block text-sm leading-relaxed text-[#6B6A8A]">{p.enUnMot}</span>
                <a href={p.lien} target="_blank" rel="noopener" className="mt-auto pt-4 text-sm font-bold text-[#4F46E5] underline underline-offset-4">
                  Ouvrir le site ↗
                </a>
              </div>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-sm text-[#6B6A8A]">
          Les frais et les conditions changent : vérifie-les sur le site de la plateforme avant d&apos;ouvrir une collecte.
        </p>
      </section>

      {/* ------------------------------------------------- billetterie et ventes */}
      <section id="billetterie" className="mb-10 scroll-mt-24">
        <SousTitre>Billetterie et ventes</SousTitre>
        <p className="mt-1 mb-4 max-w-[70ch] text-sm text-[#6B6A8A]">
          Les entrées d&apos;un événement, la buvette, les gâteaux, les objets vendus : chaque recette rentre dans le cahier de comptes et compte dans le
          prévisionnel.
        </p>
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
          Ces recettes se rattachent à{' '}
          <Link href="/espace/projets" className="font-bold text-[#4F46E5] underline underline-offset-4">
            tes projets
          </Link>{' '}
          : on sait alors ce que chaque action a rapporté et ce qu&apos;elle a coûté.
        </p>
      </section>

      {/* -------------------------------------------------- ce qui entre et sort */}
      <section id="repartition" className="mb-10 scroll-mt-24">
        <SousTitre>Ce qui entre, ce qui sort</SousTitre>
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
              {NATURES_RECETTE_AFFICHEES.every((n) => montant(n) === 0) ? <li className="text-[#6B6A8A]">Rien de noté pour l&apos;instant.</li> : null}
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
              {NATURES_DEPENSE_AFFICHEES.every((n) => montant(n) === 0) ? <li className="text-[#6B6A8A]">Rien de noté pour l&apos;instant.</li> : null}
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
        <SousTitre>Le cahier de comptes</SousTitre>
        <p className="mt-1 mb-4 max-w-[70ch] text-sm text-[#6B6A8A]">
          Une ligne par mouvement, dans l&apos;ordre. Tu peux chercher, filtrer par période et tout sortir en tableur pour l&apos;assemblée générale ou pour un
          financeur.
        </p>
        <Mouvements mouvements={mouvements} />
      </section>

      <p className="mt-8 text-sm text-[#6B6A8A]">
        Les obligations à tenir et les documents à fabriquer sont dans{' '}
        <Link href="/espace/secretariat" className="font-bold text-[#4F46E5] underline underline-offset-4">
          mon secrétariat
        </Link>
        .
      </p>
    </>
  );
}
