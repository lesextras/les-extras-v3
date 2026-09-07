import Link from 'next/link';
import { notFound } from 'next/navigation';
import { apiEspace, sessionAssociation } from '../../../_session';
import { Barre, Carte, Encart, Pastille, SousTitre } from '../../../_ui';
import { LIBELLES_ETAT, LIBELLES_NATURE, LIBELLES_SITUATION, dateCourte, formaterEuros, type Dispositif, type Dossier, type SituationPiece } from '../../_types';
import { FicheDossier } from './FicheDossier';
import { BudgetDossier } from './BudgetDossier';
import { RedigerIA } from './RedigerIA';

interface DossierComplet extends Dossier {
  dispositif: Dispositif | null;
  assemblage: { code: string; libelle: string; ouLaTrouver: string | null; situation: SituationPiece; fileId: string | null; dateExpiration: string | null }[];
  completude: number;
  manquantes: { code: string; libelle: string }[];
}

/** Les cinq moments d'un dossier, de gauche à droite. */
const MOMENTS: { etats: Dossier['etat'][]; libelle: string }[] = [
  { etats: ['REPERE'], libelle: 'Repéré' },
  { etats: ['EN_ECRITURE'], libelle: 'En écriture' },
  { etats: ['DEPOSE'], libelle: 'Déposé' },
  { etats: ['ACCORDE', 'REFUSE'], libelle: 'Réponse' },
  { etats: ['SOLDE'], libelle: 'Compte rendu envoyé' },
];

/**
 * UN DOSSIER. En haut, où il en est. Puis l'assemblage des pièces, le budget
 * (prévu, puis réalisé pour le compte rendu), et la fiche à tenir à jour.
 */
export default async function DossierPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[a-z0-9]{10,40}$/i.test(id)) notFound();
  const s = await sessionAssociation(`/espace/dossiers/${id}`);
  const [{ data, error, status }, espace] = await Promise.all([
    apiEspace<DossierComplet>(s, `/association/dossiers/${id}`),
    apiEspace<{ ia?: { disponible: boolean } }>(s, '/association/espace'),
  ]);
  if (!data) {
    if (status === 404) notFound();
    return <Encart ton="attention">{error ?? 'Ce dossier ne se charge pas pour le moment.'}</Encart>;
  }
  const d = data;
  const indexMoment = MOMENTS.findIndex((m) => m.etats.includes(d.etat));

  return (
    <>
      <nav className="mb-4 text-sm text-[#6B6A8A]" aria-label="Fil d'Ariane">
        <Link href="/espace/dossiers" className="font-bold text-[#4F46E5] underline underline-offset-4">
          Mes subventions et appels à projet
        </Link>
        <span className="mx-2">›</span>
        <span>{d.intitule}</span>
      </nav>

      <header className="mb-6">
        <div className="flex flex-wrap items-center gap-2">
          <Pastille ton={d.etat === 'ACCORDE' || d.etat === 'SOLDE' ? 'ok' : d.etat === 'REFUSE' ? 'alerte' : d.etat === 'DEPOSE' ? 'accent' : 'neutre'}>{LIBELLES_ETAT[d.etat]}</Pastille>
          <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${d.nature === 'APPEL_A_PROJET' ? 'bg-[#FEF3E2] text-[#7C3E06]' : 'bg-[#ECEBFC] text-[#4338CA]'}`}>
            {LIBELLES_NATURE[d.nature ?? 'SUBVENTION']}
          </span>
          <span className="text-sm font-bold uppercase tracking-[0.12em] text-[#6B6A8A]">{d.financeur}</span>
        </div>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-[#1D1B5C] sm:text-4xl">{d.intitule}</h1>
        {d.dispositif ? (
          <p className="mt-2 max-w-[70ch] text-sm">
            {d.dispositif.description}{' '}
            {d.dispositif.lien ? (
              <a href={d.dispositif.lien} target="_blank" rel="noopener" className="font-bold text-[#4F46E5] underline underline-offset-4">
                Où déposer ↗
              </a>
            ) : null}
          </p>
        ) : null}
      </header>

      {/* ------------------------------------------------------ les moments */}
      <ol className="mb-6 grid grid-cols-5 gap-1 overflow-x-auto">
        {MOMENTS.map((m, i) => {
          const fait = i < indexMoment || (i === indexMoment && d.etat === 'SOLDE');
          const courant = i === indexMoment;
          return (
            <li key={m.libelle} className="min-w-[96px]">
              <div className={`h-2 rounded-full ${fait ? 'bg-[#1E9E6A]' : courant ? (d.etat === 'REFUSE' ? 'bg-[#C0392B]' : 'bg-[#4F46E5]') : 'bg-[#E6E4F3]'}`} />
              <p className={`mt-1.5 text-xs font-bold ${courant ? 'text-[#1D1B5C]' : 'text-[#6B6A8A]'}`}>{m.libelle}</p>
            </li>
          );
        })}
      </ol>

      <section className="mb-6 grid gap-3 sm:grid-cols-3">
        <Carte>
          <p className="text-sm font-bold text-[#6B6A8A]">Demandé{d.montantMax !== null ? ` (max ${formaterEuros(d.montantMax)})` : ''}</p>
          <p className="text-2xl font-extrabold tabular-nums text-[#1D1B5C]">{formaterEuros(d.montantDemande)}</p>
        </Carte>
        <Carte>
          <p className="text-sm font-bold text-[#6B6A8A]">Accordé</p>
          <p className="text-2xl font-extrabold tabular-nums text-[#1E9E6A]">{formaterEuros(d.montantAccorde)}</p>
        </Carte>
        <Carte>
          <p className="text-sm font-bold text-[#6B6A8A]">{d.etat === 'ACCORDE' ? 'Compte rendu avant le' : 'Date limite de dépôt'}</p>
          <p className="text-2xl font-extrabold tabular-nums text-[#1D1B5C]">{dateCourte(d.etat === 'ACCORDE' ? d.dateCompteRendu : d.dateLimiteDepot)}</p>
        </Carte>
      </section>

      {d.description || d.ideeProjet ? (
        <section className="mb-8 grid gap-4 md:grid-cols-2">
          {d.description ? (
            <Carte>
              <h2 className="text-lg font-extrabold text-[#1D1B5C]">Ce que le financeur demande</h2>
              <p className="mt-2 whitespace-pre-line leading-relaxed">{d.description}</p>
            </Carte>
          ) : null}
          {d.ideeProjet ? (
            <Carte>
              <h2 className="text-lg font-extrabold text-[#1D1B5C]">L&apos;idée qu&apos;on propose</h2>
              <p className="mt-2 whitespace-pre-line leading-relaxed">{d.ideeProjet}</p>
              <Link href="/espace/projets" className="mt-3 inline-flex text-sm font-bold text-[#4F46E5] underline underline-offset-4">
                Mes projets →
              </Link>
            </Carte>
          ) : null}
        </section>
      ) : null}

      <section className="mb-8">
        <RedigerIA dossierId={d.id} disponible={espace.data?.ia?.disponible ?? false} />
      </section>

      {/* ------------------------------------------------------- assemblage */}
      <section className="mb-8">
        <SousTitre>Les papiers à joindre</SousTitre>
        <Carte>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="text-sm text-[#6B6A8A]">Chaque papier demandé par le financeur, et s&apos;il est prêt dans le classeur.</p>
            <span className="text-sm font-extrabold tabular-nums text-[#1D1B5C]">{d.completude} % prêt</span>
          </div>
          <div className="mt-2">
            <Barre pourcentage={d.completude} ton="ok" />
          </div>
          {d.assemblage.length === 0 ? (
            <p className="mt-3 text-sm text-[#6B6A8A]">Aucun papier n&apos;est coché pour ce dossier. Coche-les dans la fiche, plus bas.</p>
          ) : (
            <ul className="mt-4 divide-y divide-[#E6E4F3]">
              {d.assemblage.map((p) => {
                const ok = p.situation === 'A_JOUR' || p.situation === 'DEDUITE';
                return (
                  <li key={p.code} className="flex flex-col gap-1 py-2 sm:flex-row sm:items-center sm:justify-between">
                    <span className="flex items-center gap-2">
                      <Pastille ton={ok ? 'ok' : p.situation === 'MANQUANTE' ? 'neutre' : 'attention'}>{LIBELLES_SITUATION[p.situation]}</Pastille>
                      <span className="font-bold text-[#1D1B5C]">{p.libelle}</span>
                    </span>
                    <span className="text-sm text-[#6B6A8A]">
                      {p.fileId ? (
                        <a href={`/api/proxy/files/${p.fileId}`} target="_blank" rel="noopener" className="font-bold text-[#4F46E5] underline underline-offset-4">
                          Voir
                        </a>
                      ) : (
                        <Link href={`/espace/classeur#${p.code}`} className="font-bold text-[#4F46E5] underline underline-offset-4">
                          Ranger au classeur
                        </Link>
                      )}
                      {p.dateExpiration ? ` · expire le ${dateCourte(p.dateExpiration)}` : ''}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </Carte>
      </section>

      {/* ----------------------------------------------------------- budget */}
      <section className="mb-8">
        <SousTitre>Le budget et le compte rendu</SousTitre>
        <Carte>
          <BudgetDossier dossier={d} />
        </Carte>
      </section>

      {/* ------------------------------------------------------------ fiche */}
      <section>
        <SousTitre>La fiche du dossier</SousTitre>
        <FicheDossier dossier={d} />
      </section>
    </>
  );
}
