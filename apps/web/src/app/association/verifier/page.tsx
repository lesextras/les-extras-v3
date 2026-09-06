import Link from 'next/link';
import type { Metadata } from 'next';
import { fetchPublic } from '../../_shared/server';
import { Encart, FormulaireRecherche, Pastille, Titre, formaterDate } from '../_ui';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Vérifier mon association',
  description:
    "Retrouvez votre association dans les répertoires publics et voyez en une minute quelles pièces d'un dossier de subvention sont déjà prouvées.",
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
    const { data } = await fetchPublic<AssociationPublique[]>(
      `/public/association/recherche?q=${encodeURIComponent(q)}`,
      { revalidate: 0 },
    );
    if (Array.isArray(data)) resultats = data;
    else erreur = "Le service public des données d'entreprises ne répond pas pour le moment. Réessayez dans quelques minutes.";
  }

  return (
    <>
      <Titre
        surtitre="Étape 1 sur 2"
        sousTitre="Tapez le nom exact, le sigle, le numéro SIREN ou le numéro RNA. Les résultats viennent des répertoires publics, tels que l'administration les connaît."
      >
        Retrouvez votre association
      </Titre>
      <FormulaireRecherche valeur={q} autoFocus={!q} />

      {q && q.length < 3 ? (
        <p className="mt-4 text-[#7A4A0E]">Indiquez au moins trois caractères.</p>
      ) : null}

      {erreur ? (
        <div className="mt-8">
          <Encart ton="attention">{erreur}</Encart>
        </div>
      ) : null}

      {resultats && resultats.length === 0 ? (
        <div className="mt-8 max-w-[64ch]">
          <Encart ton="attention">
            <p className="font-medium">Aucune association trouvée pour « {q} ».</p>
            <p className="mt-2 text-[#3E4A44]">
              Trois causes fréquentes : le nom saisi n&apos;est pas celui déclaré en préfecture (essayez un mot du nom
              plutôt que le nom entier) ; l&apos;association n&apos;a pas encore de numéro SIRET, et n&apos;apparaît donc pas dans
              le répertoire des entreprises ; ou elle vient d&apos;être déclarée et n&apos;y est pas encore.
            </p>
            <p className="mt-2">
              Si elle n&apos;a pas de SIRET,{' '}
              <Link href="/chemin/obtenir-le-siret" className="underline underline-offset-4">
                l&apos;étape 2 du chemin
              </Link>{' '}
              explique comment l&apos;obtenir : sans lui, aucune subvention ne peut être versée.
            </p>
          </Encart>
        </div>
      ) : null}

      {resultats && resultats.length > 0 ? (
        <section className="mt-8">
          <h2 className="mb-3 text-sm uppercase tracking-[0.14em] text-[#5C6B63]">
            {resultats.length === 1 ? 'Une association trouvée' : `${resultats.length} associations trouvées`} — choisissez la vôtre
          </h2>
          <ul className="divide-y divide-[#DDD8CC] rounded-md border border-[#DDD8CC] bg-white">
            {resultats.map((a) => (
              <li key={a.siren}>
                <Link
                  href={`/verifier/${a.siren}`}
                  className="flex flex-col gap-2 px-5 py-4 no-underline hover:bg-[#F6F4EE] sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="font-semibold leading-snug text-[#1E2A25]">
                      {a.nom}
                      {a.sigle ? <span className="ml-2 font-normal text-[#5C6B63]">({a.sigle})</span> : null}
                    </p>
                    <p className="mt-1 text-sm text-[#5C6B63]">
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
          <p className="mt-3 text-sm text-[#5C6B63]">
            Vous ne la voyez pas ? Essayez avec son numéro SIREN ou RNA : ils sont sur le récépissé de préfecture et le
            certificat d&apos;inscription à l&apos;INSEE.
          </p>
        </section>
      ) : null}
    </>
  );
}
