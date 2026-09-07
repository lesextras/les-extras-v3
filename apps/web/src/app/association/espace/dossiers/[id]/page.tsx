import Link from 'next/link';
import { notFound } from 'next/navigation';
import { apiEspace, sessionAssociation } from '../../../_session';
import { Barre, Encart, Pastille } from '../../../_ui';
import { LIBELLES_ETAT, LIBELLES_SITUATION, dateCourte, type Dispositif, type Dossier, type SituationPiece } from '../../_types';
import { FicheDossier } from './FicheDossier';

interface DossierComplet extends Dossier {
  dispositif: Dispositif | null;
  assemblage: { code: string; libelle: string; ouLaTrouver: string | null; situation: SituationPiece; fileId: string | null; dateExpiration: string | null }[];
  completude: number;
  manquantes: { code: string; libelle: string }[];
}

/**
 * UN DOSSIER. En haut, où il en est. Au milieu, l'assemblage : chaque pièce
 * exigée, présente ou non. En bas, les dates et montants à tenir.
 */
export default async function DossierPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[a-z0-9]{10,40}$/i.test(id)) notFound();
  const s = await sessionAssociation(`/espace/dossiers/${id}`);
  const { data, error, status } = await apiEspace<DossierComplet>(s, `/association/dossiers/${id}`);
  if (!data) {
    if (status === 404) notFound();
    return <Encart ton="attention">{error ?? 'Ce dossier ne se charge pas pour le moment.'}</Encart>;
  }
  const d = data;

  return (
    <>
      <p className="mb-4 text-sm">
        <Link href="/espace/dossiers" className="underline underline-offset-4">
          ← Tous les dossiers
        </Link>
      </p>
      <header className="mb-6">
        <div className="flex flex-wrap items-center gap-2">
          <Pastille ton={d.etat === 'ACCORDE' || d.etat === 'SOLDE' ? 'ok' : d.etat === 'REFUSE' ? 'attention' : 'neutre'}>{LIBELLES_ETAT[d.etat]}</Pastille>
          <span className="text-xs uppercase tracking-[0.14em] text-[#5C6B63]">{d.financeur}</span>
        </div>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">{d.intitule}</h1>
        {d.dispositif ? (
          <p className="mt-2 max-w-[64ch] text-sm text-[#3E4A44]">
            {d.dispositif.description}{' '}
            {d.dispositif.lien ? (
              <a href={d.dispositif.lien} target="_blank" rel="noopener" className="underline underline-offset-4">
                Où déposer ↗
              </a>
            ) : null}
          </p>
        ) : null}
      </header>

      <section className="mb-8 rounded-md border border-[#DDD8CC] bg-white p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-sm uppercase tracking-[0.14em] text-[#5C6B63]">Assemblage des pièces</h2>
          <span className="text-sm tabular-nums text-[#3E4A44]">{d.completude} % prêt</span>
        </div>
        <div className="mt-2">
          <Barre pourcentage={d.completude} />
        </div>
        {d.assemblage.length === 0 ? (
          <p className="mt-3 text-sm text-[#5C6B63]">Aucune pièce exigée n&apos;est renseignée pour ce dossier. Ajoutez-les ci-dessous.</p>
        ) : (
          <ul className="mt-4 divide-y divide-[#EEEAE0]">
            {d.assemblage.map((p) => {
              const ok = p.situation === 'A_JOUR' || p.situation === 'DEDUITE';
              return (
                <li key={p.code} className="flex flex-col gap-1 py-2 sm:flex-row sm:items-center sm:justify-between">
                  <span className="flex items-center gap-2">
                    <Pastille ton={ok ? 'ok' : p.situation === 'MANQUANTE' ? 'neutre' : 'attention'}>{LIBELLES_SITUATION[p.situation]}</Pastille>
                    <span className="font-medium">{p.libelle}</span>
                  </span>
                  <span className="text-sm text-[#5C6B63]">
                    {p.fileId ? (
                      <a href={`/api/proxy/files/${p.fileId}`} target="_blank" rel="noopener" className="underline underline-offset-4">
                        Voir
                      </a>
                    ) : (
                      <Link href="/espace/classeur" className="underline underline-offset-4">
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
      </section>

      <FicheDossier dossier={d} />
    </>
  );
}
