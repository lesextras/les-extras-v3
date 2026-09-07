import Link from 'next/link';
import { apiEspace, sessionAssociation } from '../../_session';
import { nomCourt } from '../../_nom';
import { BTN_SECONDAIRE, CARTE, Carte, Encart, Pastille, SousTitre, Titre } from '../../_ui';
import { ListeAgrements, NOMBRE_AGREMENTS, dateAgrements } from '../../ListeAgrements';
import { LIBELLES_ROLE, dateCourte, type Espace } from '../_types';
import { Rattacher } from './Rattacher';
import { FormulaireOrganisation } from './FormulaireOrganisation';
import { FormulaireProjet } from './FormulaireProjet';
import { FormulaireVieStatutaire } from './FormulaireVieStatutaire';

/**
 * MON ASSOCIATION : son dossier d'identité en trois blocs (comme un dossier de
 * vérification), son projet en une page, sa vie statutaire, son abonnement.
 */
export default async function MonAssociationPage() {
  const s = await sessionAssociation('/espace/association');
  const { data, error } = await apiEspace<Espace>(s, '/association/espace');
  if (!data) return <Encart ton="attention">{error ?? 'La fiche ne se charge pas pour le moment.'}</Encart>;
  const o = data.organisation;
  const { vieStatutaire: vie, repertoire, classeur, projet } = data;

  const rib = classeur.find((c) => c.type.code === 'RIB');
  const ribOk = rib ? rib.situation === 'A_JOUR' || rib.situation === 'DEDUITE' : false;
  const identiteOk = Boolean(o.rna || o.siret);
  const papiersPrets = classeur.filter((c) => c.situation === 'A_JOUR' || c.situation === 'DEDUITE').length;
  const bureauOk = vie.bureau.president && vie.bureau.tresorier;

  const blocs = [
    {
      titre: 'Association',
      ok: identiteOk,
      detail: identiteOk
        ? [o.rna ? `RNA ${o.rna}` : null, o.siret ? `SIRET ${o.siret}` : o.siren ? `SIREN ${o.siren}` : null].filter(Boolean).join(' · ')
        : 'Numéros RNA et SIRET à rattacher',
      href: '#identite',
      action: identiteOk ? 'Modifier' : 'Compléter',
    },
    {
      titre: 'Responsables',
      ok: bureauOk,
      detail: bureauOk
        ? repertoire.bureau.map((b) => `${b.nom} (${b.roles.filter((r) => r !== 'MEMBRE').map((r) => LIBELLES_ROLE[r]).join(', ')})`).join(' · ')
        : 'Président·e et trésorier·ère à noter dans le répertoire',
      href: '/espace/repertoire',
      action: bureauOk ? 'Voir' : 'Compléter',
    },
    {
      titre: 'Coordonnées bancaires',
      ok: ribOk,
      detail: ribOk ? "Le RIB de l'association est dans le classeur" : "Le RIB de l'association manque au classeur",
      href: '/espace/classeur#RIB',
      action: ribOk ? 'Voir' : 'Compléter',
    },
  ];
  const complets = blocs.filter((b) => b.ok).length;

  return (
    <>
      <Titre surtitre="Mon association" sousTitre="Ce que les financeurs vérifient en premier : qui vous êtes, qui décide, où verser l'argent — et tous vos papiers au même endroit.">
        {nomCourt(o.nom)}
      </Titre>

      {/* ------------------------------------------------------- mes papiers */}
      <section className="mb-8 grid gap-4 md:grid-cols-3">
        <Link href="/espace/classeur" className={`${CARTE} block p-5 no-underline transition hover:border-[#4F46E5]`}>
          <span className="block text-lg font-extrabold text-[#1D1B5C]">Mes papiers</span>
          <span className="mt-1 block text-sm text-[#6B6A8A]">
            Les {classeur.length} pièces que les financeurs demandent : {papiersPrets} déjà prêtes.
          </span>
          <span className="mt-3 block text-sm font-bold text-[#4F46E5]">Ouvrir le classeur →</span>
        </Link>
        <Link href="/espace/documents" className={`${CARTE} block p-5 no-underline transition hover:border-[#4F46E5]`}>
          <span className="block text-lg font-extrabold text-[#1D1B5C]">Mes autres documents</span>
          <span className="mt-1 block text-sm text-[#6B6A8A]">
            {data.nbDocuments === 0 ? 'Conventions, courriers, photos, affiches : rien encore.' : `${data.nbDocuments} document${data.nbDocuments > 1 ? 's' : ''} rangé${data.nbDocuments > 1 ? 's' : ''}.`}
          </span>
          <span className="mt-3 block text-sm font-bold text-[#4F46E5]">Ouvrir mes documents →</span>
        </Link>
        <Link href="#agrements" className={`${CARTE} block p-5 no-underline transition hover:border-[#4F46E5]`}>
          <span className="block text-lg font-extrabold text-[#1D1B5C]">Nos agréments</span>
          <span className="mt-1 block text-sm text-[#6B6A8A]">
            Les {NOMBRE_AGREMENTS} reconnaissances officielles qu&apos;une association peut demander, et ce que chacune ouvre.
          </span>
          <span className="mt-3 block text-sm font-bold text-[#4F46E5]">Voir les agréments →</span>
        </Link>
      </section>

      {/* --------------------------------------------------- dossier d'identité */}
      <section>
        <div className="mb-3 flex flex-wrap items-center gap-3">
          <SousTitre>Le dossier d&apos;identité</SousTitre>
          <Pastille ton={complets === 3 ? 'ok' : 'attention'}>{complets === 3 ? 'Complet' : `${complets} sur 3`}</Pastille>
        </div>
        <div className={`${CARTE} divide-y divide-[#E6E4F3]`}>
          {blocs.map((b) => (
            <div key={b.titre} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="font-extrabold text-[#1D1B5C]">{b.titre}</p>
                <p className={`mt-0.5 text-sm ${b.ok ? 'text-[#0F5F3E]' : 'text-[#7C3E06]'}`}>
                  {b.ok ? '✓ ' : '! '}
                  {b.detail}
                </p>
              </div>
              <Link href={b.href} className={`${BTN_SECONDAIRE} !py-2 text-sm`}>
                {b.action}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* -------------------------------------------------------- identité */}
      <section id="identite" className="mt-10 scroll-mt-24">
        <SousTitre>Ce que disent les répertoires publics</SousTitre>
        <Carte>
          {o.rna || o.siret ? (
            <dl className="grid grid-cols-[max-content_minmax(0,1fr)] gap-x-4 gap-y-1.5 text-sm [&_dt]:font-bold [&_dt]:text-[#6B6A8A]">
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
            <p className="text-sm">Pas encore rattachée. Retrouve-la : ses numéros rempliront le classeur tout seuls.</p>
          )}
          <div className="mt-4">
            <p className="mb-2 text-sm text-[#6B6A8A]">{o.rna || o.siret ? 'Ce n’est pas la bonne ? Rattaches-en une autre :' : ''}</p>
            <Rattacher valeurInitiale={o.rna || o.siret ? '' : o.nom} />
          </div>
        </Carte>
        <div className="mt-4">
          <FormulaireOrganisation organisation={o} />
        </div>
      </section>

      {/* ---------------------------------------------------------- projet */}
      <section id="projet" className="mt-10 scroll-mt-24">
        <div className="mb-3 flex flex-wrap items-center gap-3">
          <SousTitre>Le projet en une page</SousTitre>
          <Pastille ton={projet.complet ? 'ok' : 'attention'}>{projet.complet ? 'Prêt' : `${projet.remplis} réponse${projet.remplis > 1 ? 's' : ''} sur 4`}</Pastille>
        </div>
        <p className="mb-4 max-w-[70ch] text-sm text-[#6B6A8A]">
          Quatre questions, quatre réponses courtes. C&apos;est le texte que tu recopies dans chaque demande de subvention et chaque appel
          à projets.{' '}
          <Link href="/chemin/le-projet-en-une-page" className="font-bold text-[#4F46E5] underline underline-offset-4">
            Voir l&apos;étape 8 du chemin
          </Link>
          .
        </p>
        <Carte>
          <FormulaireProjet projet={projet} />
        </Carte>
      </section>

      {/* ------------------------------------------------------------ vie */}
      <section id="vie" className="mt-10 scroll-mt-24">
        <SousTitre>La vie de l&apos;association</SousTitre>
        <Carte>
          <div className="mb-4 flex flex-wrap gap-2">
            {vie.dateDerniereAG ? (
              <Pastille ton={vie.agEnRetard ? 'alerte' : vie.agBientot ? 'attention' : 'ok'}>
                Dernière AG le {dateCourte(vie.dateDerniereAG)}
                {vie.agEnRetard ? ' — il y a plus d’un an' : vie.prochaineAG ? ` — prochaine avant le ${dateCourte(vie.prochaineAG)}` : ''}
              </Pastille>
            ) : (
              <Pastille ton="attention">Date de la dernière AG inconnue</Pastille>
            )}
            {vie.mandatsExpires.map((m) => (
              <Pastille key={m.id} ton="alerte">
                Mandat fini : {m.nom}
              </Pastille>
            ))}
            {vie.mandatsBientot.map((m) => (
              <Pastille key={m.id} ton="attention">
                Mandat bientôt fini : {m.nom}
              </Pastille>
            ))}
          </div>
          <FormulaireVieStatutaire vie={vie} />
          <p className="mt-4 text-sm text-[#6B6A8A]">
            Une assemblée générale par an, au moins. Le procès-verbal va dans le classeur.{' '}
            <Link href="/chemin/la-premiere-assemblee-generale" className="font-bold text-[#4F46E5] underline underline-offset-4">
              Comment faire (étape 7)
            </Link>
            .
          </p>
        </Carte>
      </section>

      {/* ------------------------------------------------------- agréments */}
      <section id="agrements" className="mt-10 scroll-mt-24">
        <SousTitre>Nos agréments</SousTitre>
        <p className="mb-4 max-w-[70ch] text-sm text-[#6B6A8A]">
          Un agrément, c&apos;est l&apos;État qui reconnaît officiellement l&apos;association. Ce n&apos;est pas de l&apos;argent : ça ouvre des portes, des
          financements réservés, et ça prouve ton sérieux. {NOMBRE_AGREMENTS} agréments existent — clique sur une famille pour voir ce que chacun ouvre et où le
          demander. Relu le {dateAgrements()} ; la page officielle fait foi.
        </p>
        <ListeAgrements replie />
      </section>

      {/* ------------------------------------------------------ abonnement */}
      <section className="mt-10">
        <SousTitre>Mon abonnement</SousTitre>
        <Carte>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xl font-extrabold text-[#1D1B5C]">Gratuit</p>
              <p className="mt-1 text-sm leading-relaxed">
                Tout l&apos;espace est gratuit pendant que l&apos;outil se construit : le classeur, les dossiers, le répertoire, les
                documents, le chemin. Rien à payer, pas de carte à donner.
              </p>
            </div>
            <Pastille ton="ok">Actif</Pastille>
          </div>
        </Carte>
      </section>

      <section className="mt-6">
        <Carte>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-extrabold text-[#1D1B5C]">Ce que les autres voient</h2>
              <p className="mt-1 text-sm text-[#6B6A8A]">Ta fiche dans les répertoires publics (RNA, SIRENE) : nom, adresse, activité, date de création.</p>
            </div>
            <Link href="/verifier" className={BTN_SECONDAIRE}>
              Vérifier ma fiche publique →
            </Link>
          </div>
        </Carte>
      </section>
    </>
  );
}
