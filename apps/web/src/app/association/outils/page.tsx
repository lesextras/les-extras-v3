import type { Metadata } from 'next';
import { fetchPublic } from '../../_shared/server';
import { Encart, Pastille, Titre } from '../_ui';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'La carte des outils',
  description:
    "Pour chaque besoin d'une association (encaisser, tenir les comptes, chercher des aides, déposer, se former), l'outil qui le fait, ce qu'il coûte, et comment il s'articule avec votre dossier.",
  alternates: { canonical: '/outils' },
};

type Cout = 'GRATUIT' | 'PUBLIC' | 'PAYANT' | 'GRATUIT_PUIS_PAYANT';

interface Besoin {
  code: string;
  besoin: string;
  pourquoiAilleurs: string;
  outils: { nom: string; lien: string; ceQuIlFait: string; cout: Cout; coutDetail?: string }[];
  articulation: string;
}

export default async function OutilsPage() {
  const { data } = await fetchPublic<{ besoins: Besoin[]; libellesCout: Record<Cout, string> }>(
    '/public/association/outils',
    { revalidate: 3600 },
  );
  const besoins = data?.besoins ?? [];
  const libelles = data?.libellesCout ?? ({} as Record<Cout, string>);

  return (
    <>
      <Titre
        surtitre="On ne refait pas ce que d'autres font bien"
        sousTitre="Encaisser, tenir les comptes, chercher des aides : d'autres le font très bien, souvent gratuitement. Voici qui, ce que ça coûte en ordre de grandeur, et comment leur résultat revient dans votre dossier."
      >
        La carte des outils
      </Titre>

      {besoins.length === 0 ? (
        <Encart ton="attention">La carte ne se charge pas pour le moment. Rechargez la page dans un instant.</Encart>
      ) : (
        <div className="space-y-10">
          {besoins.map((b) => (
            <section key={b.code} id={b.code.toLowerCase()} className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]">
              <div className="max-w-[48ch]">
                <h2 className="text-xl font-semibold leading-snug tracking-tight">{b.besoin}</h2>
                <p className="mt-2 leading-relaxed text-[#3E4A44]">{b.pourquoiAilleurs}</p>
                <p className="mt-3 text-sm leading-relaxed">
                  <span className="text-[#5C6B63]">Retour dans votre dossier : </span>
                  {b.articulation}
                </p>
              </div>
              <ul className="divide-y divide-[#DDD8CC] rounded-md border border-[#DDD8CC] bg-white">
                {b.outils.map((o) => (
                  <li key={o.nom} className="px-5 py-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <a href={o.lien} target="_blank" rel="noopener" className="font-semibold text-[#1F6A4E] underline underline-offset-4">
                        {o.nom} ↗
                      </a>
                      <Pastille ton={o.cout === 'PAYANT' ? 'neutre' : 'ok'}>{libelles[o.cout] ?? o.cout}</Pastille>
                    </div>
                    <p className="mt-1.5 text-sm leading-relaxed text-[#3E4A44]">{o.ceQuIlFait}</p>
                    {o.coutDetail ? <p className="mt-1 text-xs text-[#5C6B63]">{o.coutDetail}</p> : null}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      <p className="mt-12 max-w-[64ch] text-sm text-[#5C6B63]">
        Les tarifs changent : on indique seulement si un outil est gratuit, public ou payant. Aucun lien n&apos;est
        sponsorisé.
      </p>
    </>
  );
}
