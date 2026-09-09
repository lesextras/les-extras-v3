import Link from 'next/link';
import type { Metadata } from 'next';
import { fetchPublic } from '../../_shared/server';
import { Accent, CARTE, Encart, FormulaireRecherche, Pastille, Titre, formaterDate } from '../_ui';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Vérifier mon association',
  description:
    "Retrouve ton association dans les répertoires publics et vois en une minute quels papiers d'un dossier de subvention sont déjà prouvés.",
  alternates: { canonical: '/verifier' },
};

interface AssociationPublique {
  nom: string;
  sigle: string | null;
  siren: string;
  siret: string | null;
  rna: string | null;
  natureLibelle: string;
  codePostal: string | null;
  commune: string | null;
  dateCreation: string | null;
  active: boolean;
}

export default async function VerifierPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q: brut } = await searchParams;
  const q = (brut ?? '').trim();
  let resultats: AssociationPublique[] | null = null;
  let erreur: string | null = null;

  if (q.length >= 3) {
    const { data } = await fetchPublic<AssociationPublique[]>(`/public/association/recherche?q=${encodeURIComponent(q)}`, { revalidate: 0 });
    if (Array.isArray(data)) resultats = data;
    else erreur = "Le service public des données d'entreprises ne répond pas pour le moment. Réessaie dans quelques minutes.";
  }

  return (
    <>
      <Titre
        surtitre="Vérifier mon association"
        sousTitre="Tape le nom, le sigle, le numéro SIREN ou le numéro RNA. On lit les répertoires publics, tels que l'administration les connaît, et on te dit ce qui est déjà fait."
      >
        Où en est <Accent>ton association</Accent> ?
      </Titre>
      <FormulaireRecherche valeur={q} autoFocus={!q} />

      {q && q.length < 3 ? <p className="mt-4 text-[#7C3E06]">Tape au moins trois lettres.</p> : null}

      {erreur ? (
        <div className="mt-8">
          <Encart ton="attention">{erreur}</Encart>
        </div>
      ) : null}

      {resultats && resultats.length === 0 ? (
        <div className="mt-8 max-w-[70ch]">
          <Encart ton="attention">
            <p className="font-extrabold">Aucune association trouvée pour « {q} ».</p>
            <p className="mt-2 font-bold">Trois causes fréquentes.</p>
            <ul className="mt-1.5 list-disc space-y-1 pl-5">
              <li>Le nom tapé n&apos;est pas celui déclaré en préfecture, essaie un seul mot du nom</li>
              <li>
                L&apos;association n&apos;a pas encore de numéro SIRET, donc elle n&apos;est pas dans le
                répertoire des entreprises
              </li>
              <li>Elle vient d&apos;être déclarée et n&apos;y est pas encore</li>
            </ul>
            <p className="mt-2">
              Pas de SIRET ?{' '}
              <Link href="/chemin/obtenir-le-siret" className="font-bold underline underline-offset-4">
                L&apos;étape 2 du chemin
              </Link>{' '}
              explique comment l&apos;obtenir : sans lui, aucune subvention ne peut être versée.
            </p>
          </Encart>
        </div>
      ) : null}

      {resultats && resultats.length > 0 ? (
        <section className="mt-8">
          <h2 className="mb-3 text-sm font-extrabold uppercase tracking-[0.12em] text-[#6B6A8A]">
            {resultats.length === 1 ? 'Une association trouvée' : `${resultats.length} associations trouvées`} — choisis la tienne
          </h2>
          <ul className={`${CARTE} divide-y divide-[#E6E4F3] overflow-hidden`}>
            {resultats.map((a) => (
              <li key={a.siren}>
                <Link
                  href={`/verifier/${a.siren}`}
                  className="flex flex-col gap-2 px-5 py-4 no-underline hover:bg-[#F5F4FC] sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="font-extrabold leading-snug text-[#1D1B5C]">
                      {a.nom}
                      {a.sigle ? <span className="ml-2 font-normal text-[#6B6A8A]">({a.sigle})</span> : null}
                    </p>
                    <p className="mt-1 text-sm text-[#6B6A8A]">
                      {[a.codePostal, a.commune].filter(Boolean).join(' ')}
                      {a.dateCreation ? ` · créée le ${formaterDate(a.dateCreation)}` : ''}
                      {` · SIREN ${a.siren}`}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    <Pastille ton={a.rna ? 'ok' : 'attention'}>{a.rna ? `RNA ${a.rna}` : 'RNA non renseigné'}</Pastille>
                    <Pastille ton={a.siret ? 'ok' : 'attention'}>{a.siret ? 'SIRET' : 'Sans SIRET'}</Pastille>
                    {!a.active ? <Pastille ton="neutre">Fermée</Pastille> : null}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-sm text-[#6B6A8A]">
            Tu ne la vois pas ? Essaie avec son numéro SIREN ou RNA : ils sont sur le récépissé de préfecture et le certificat
            d&apos;inscription à l&apos;INSEE.
          </p>
        </section>
      ) : null}
    </>
  );
}
