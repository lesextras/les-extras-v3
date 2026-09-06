import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { fetchPublic } from '../../../_shared/server';
import { Barre, Encart, Titre } from '../../_ui';

export const revalidate = 3600;

interface Etape {
  numero: number;
  slug: string;
  titre: string;
  pourquoi: string;
  quoiFaire: string[];
  dureeEstimee: string;
  renvois: { nom: string; lien: string; pourQuoi: string }[];
  debloque: string;
  lexique: { mot: string; explication: string }[];
  piecesAjoutees: string[];
  verifiableAvec?: 'RNA' | 'SIRENE';
}

interface Reponse {
  etape: Etape;
  pieces: { code: string; libelle: string; pourquoi: string; ouLaTrouver: string }[];
  total: number;
  precedente: { numero: number; slug: string; titre: string } | null;
  suivante: { numero: number; slug: string; titre: string } | null;
}

async function charger(slug: string) {
  if (!/^[a-z0-9-]{3,80}$/.test(slug)) return null;
  const { data } = await fetchPublic<Reponse>(`/public/association/chemin/${slug}`, { revalidate: 3600 });
  return data && (data as Reponse).etape ? (data as Reponse) : null;
}

export async function generateMetadata({ params }: { params: Promise<{ etape: string }> }): Promise<Metadata> {
  const { etape } = await params;
  const r = await charger(etape);
  if (!r) return { title: 'Étape introuvable' };
  return {
    title: `${r.etape.titre} (étape ${r.etape.numero} sur ${r.total})`,
    description: r.etape.pourquoi,
    alternates: { canonical: `/chemin/${r.etape.slug}` },
  };
}

export default async function EtapePage({ params }: { params: Promise<{ etape: string }> }) {
  const { etape } = await params;
  const r = await charger(etape);
  if (!r) notFound();
  const { etape: e, pieces, total, precedente, suivante } = r;

  return (
    <>
      <p className="mb-6 text-sm">
        <Link href="/chemin" className="underline underline-offset-4">
          ← Toutes les étapes
        </Link>
      </p>

      <div className="mb-6 max-w-[64ch]">
        <Barre pourcentage={Math.round(((e.numero - 1) / total) * 100)} />
        <p className="mt-2 text-xs uppercase tracking-[0.14em] text-[#5C6B63]">
          Étape {e.numero} sur {total}
        </p>
      </div>

      <Titre sousTitre={e.pourquoi}>{e.titre}</Titre>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          <div>
            <h2 className="mb-3 text-sm uppercase tracking-[0.14em] text-[#5C6B63]">Quoi faire</h2>
            <ol className="space-y-3">
              {e.quoiFaire.map((action, i) => (
                <li key={i} className="flex gap-4 rounded-md border border-[#DDD8CC] bg-white px-5 py-4 leading-relaxed">
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#1F6A4E] text-sm font-semibold text-white">
                    {i + 1}
                  </span>
                  <span>{action}</span>
                </li>
              ))}
            </ol>
          </div>

          {e.renvois.length ? (
            <div>
              <h2 className="mb-3 text-sm uppercase tracking-[0.14em] text-[#5C6B63]">Où le faire</h2>
              <ul className="space-y-2">
                {e.renvois.map((rv) => (
                  <li key={rv.lien} className="rounded-md border border-[#DDD8CC] bg-white px-5 py-4">
                    <a href={rv.lien} target="_blank" rel="noopener" className="font-medium text-[#1F6A4E] underline underline-offset-4">
                      {rv.nom} ↗
                    </a>
                    <p className="mt-1 text-sm text-[#3E4A44]">{rv.pourQuoi}</p>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {pieces.length ? (
            <div>
              <h2 className="mb-3 text-sm uppercase tracking-[0.14em] text-[#5C6B63]">Ce qui entre dans le classeur</h2>
              <ul className="space-y-2">
                {pieces.map((p) => (
                  <li key={p.code} className="rounded-md border border-[#DDD8CC] bg-white px-5 py-4">
                    <p className="font-semibold">{p.libelle}</p>
                    <p className="mt-1 text-sm leading-relaxed text-[#3E4A44]">{p.pourquoi}</p>
                    <p className="mt-1 text-sm leading-relaxed">
                      <span className="text-[#5C6B63]">Où la trouver : </span>
                      {p.ouLaTrouver}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>

        <aside className="space-y-4">
          <Encart>
            <p className="mb-1 text-xs uppercase tracking-[0.14em] text-[#5C6B63]">Combien de temps</p>
            <p className="leading-relaxed">{e.dureeEstimee}</p>
          </Encart>
          <Encart ton="ok">
            <p className="mb-1 text-xs uppercase tracking-[0.14em] text-[#5C6B63]">Une fois fait</p>
            <p className="leading-relaxed">{e.debloque}</p>
            {e.verifiableAvec ? (
              <p className="mt-2 text-sm text-[#3E4A44]">
                Cette étape se vérifie toute seule :{' '}
                <Link href="/verifier" className="underline underline-offset-4">
                  cherchez votre association
                </Link>{' '}
                et les répertoires publics diront si elle est faite.
              </p>
            ) : null}
          </Encart>
          {e.lexique.length ? (
            <Encart>
              <p className="mb-2 text-xs uppercase tracking-[0.14em] text-[#5C6B63]">Les mots de cette étape</p>
              <dl className="space-y-2 text-sm">
                {e.lexique.map((m) => (
                  <div key={m.mot}>
                    <dt className="font-semibold">{m.mot}</dt>
                    <dd className="leading-relaxed text-[#3E4A44]">{m.explication}</dd>
                  </div>
                ))}
              </dl>
            </Encart>
          ) : null}
        </aside>
      </section>

      <nav aria-label="Étapes voisines" className="mt-12 flex flex-col gap-3 sm:flex-row sm:justify-between">
        {precedente ? (
          <Link href={`/chemin/${precedente.slug}`} className="rounded-md border border-[#DDD8CC] bg-white px-5 py-3 no-underline hover:border-[#1F6A4E]">
            <span className="block text-xs uppercase tracking-[0.14em] text-[#5C6B63]">← Étape {precedente.numero}</span>
            <span className="font-medium text-[#1E2A25]">{precedente.titre}</span>
          </Link>
        ) : (
          <span />
        )}
        {suivante ? (
          <Link href={`/chemin/${suivante.slug}`} className="rounded-md bg-[#1F6A4E] px-5 py-3 text-white no-underline hover:bg-[#185540] sm:text-right">
            <span className="block text-xs uppercase tracking-[0.14em] text-[#D6E8DE]">Étape {suivante.numero} →</span>
            <span className="font-medium">{suivante.titre}</span>
          </Link>
        ) : (
          <Link href="/verifier" className="rounded-md bg-[#1F6A4E] px-5 py-3 text-white no-underline hover:bg-[#185540] sm:text-right">
            <span className="block text-xs uppercase tracking-[0.14em] text-[#D6E8DE]">Le chemin est fait</span>
            <span className="font-medium">Vérifier mon association</span>
          </Link>
        )}
      </nav>
    </>
  );
}
