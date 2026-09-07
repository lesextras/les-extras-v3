import type { Metadata } from 'next';
import { fetchPublic } from '../../_shared/server';
import { Accent, CARTE, Encart, Pastille, Titre } from '../_ui';

export const metadata: Metadata = {
  title: 'Les outils utiles',
  description:
    "Pour chaque besoin d'une association (encaisser, tenir les comptes, chercher des aides, déposer, se former), l'outil qui le fait, gratuit quand il existe.",
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
  const { data } = await fetchPublic<{ besoins: Besoin[]; libellesCout: Record<Cout, string> }>('/public/association/outils', { revalidate: 3600 });
  const besoins = data?.besoins ?? [];
  const libelles = data?.libellesCout ?? ({} as Record<Cout, string>);

  return (
    <>
      <Titre
        surtitre="Les outils utiles"
        sousTitre="Encaisser, tenir les comptes, chercher des aides : d'autres le font très bien, souvent gratuitement. Voici qui, et comment leur résultat revient dans ton dossier."
      >
        On ne refait pas ce que d&apos;autres <Accent>font bien</Accent>.
      </Titre>

      {besoins.length === 0 ? (
        <Encart ton="attention">La carte ne se charge pas pour le moment. Recharge la page dans un instant.</Encart>
      ) : (
        <div className="space-y-8">
          {besoins.map((b) => (
            <section key={b.code} id={b.code.toLowerCase()} className={`${CARTE} grid gap-5 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)]`}>
              <div>
                <h2 className="text-xl font-extrabold leading-snug text-[#1D1B5C]">{b.besoin}</h2>
                <p className="mt-2 leading-relaxed">{b.pourquoiAilleurs}</p>
                <p className="mt-3 text-sm leading-relaxed">
                  <span className="font-bold text-[#6B6A8A]">Retour dans ton dossier : </span>
                  {b.articulation}
                </p>
              </div>
              <ul className="divide-y divide-[#E6E4F3] rounded-xl bg-[#F5F4FC]">
                {b.outils.map((o) => (
                  <li key={o.nom} className="px-4 py-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <a href={o.lien} target="_blank" rel="noopener" className="font-extrabold text-[#4F46E5] underline underline-offset-4">
                        {o.nom} ↗
                      </a>
                      <Pastille ton={o.cout === 'PAYANT' ? 'neutre' : 'ok'}>{libelles[o.cout] ?? o.cout}</Pastille>
                    </div>
                    <p className="mt-1 text-sm leading-relaxed">{o.ceQuIlFait}</p>
                    {o.coutDetail ? <p className="mt-1 text-xs text-[#6B6A8A]">{o.coutDetail}</p> : null}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      <p className="mt-8 max-w-[70ch] text-sm text-[#6B6A8A]">
        Les tarifs changent : on indique seulement si un outil est gratuit, public ou payant. Aucun lien n&apos;est sponsorisé.
      </p>
    </>
  );
}
