import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { fetchPublic } from '../../_shared/server';
import { Rejoindre } from './Rejoindre';

export const dynamic = 'force-dynamic';

interface PageCours {
  titre: string;
  slug: string;
  sousTitre: string | null;
  description: string | null;
  imageUrl: string | null;
  bandeAnnonceUrl: string | null;
  niveau: string;
  objectifs: string[];
  prerequis: string | null;
  pourQui: string | null;
  dureeMinutes: number;
  gratuit: boolean;
  prixCents: number;
  prixBarreCents: number | null;
  /** Le nombre de prélèvements convenus. 1 = règlement en une fois. */
  echeances?: number;
  certificat: boolean;
  ecole: { nom: string; slug: string | null; couleur: string; logoUrl: string | null };
  chapitres: {
    titre: string | null;
    resume: string | null;
    lecons: { titre: string; type: string; dureeMinutes: number; apercu: boolean }[];
  }[];
}

async function charger(slug: string) {
  const { data } = await fetchPublic<PageCours>(`/public/ecole/cours/${encodeURIComponent(slug)}`, { revalidate: 0 });
  return data && typeof (data as PageCours).titre === 'string' ? (data as PageCours) : null;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const c = await charger(slug);
  if (!c) return { title: 'Cours introuvable' };
  return {
    title: `${c.titre} · ${c.ecole.nom}`,
    description: c.sousTitre ?? c.description?.slice(0, 160) ?? undefined,
    alternates: { canonical: `/cours/${c.slug}` },
  };
}

/**
 * LA PAGE PUBLIQUE D'UN COURS.
 *
 * Ce qu'on lit avant de s'inscrire : la promesse, le programme complet, la
 * durée, le prix. Un cours gratuit s'ouvre tout de suite ; un cours payant
 * renvoie vers l'organisme, parce que l'encaissement se fait chez lui.
 */
export default async function PageDuCours({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const c = await charger(slug);
  if (!c) notFound();

  const nbLecons = c.chapitres.reduce((n, ch) => n + ch.lecons.length, 0);

  return (
    <div className="min-h-screen bg-[#F7F8F7] text-[#334A42]" style={{ fontFamily: 'var(--font-pilote), system-ui, sans-serif' }}>
      <header className="px-4 py-10 text-white sm:py-14" style={{ backgroundColor: c.ecole.couleur }}>
        <div className="mx-auto w-full max-w-[1040px]">
          {c.ecole.slug ? (
            <Link href={`/ecole/${c.ecole.slug}`} className="text-sm font-bold text-white/85 no-underline hover:underline">
              ← {c.ecole.nom}
            </Link>
          ) : (
            <p className="text-sm font-bold text-white/85">{c.ecole.nom}</p>
          )}
          <h1 className="mt-3 max-w-[22ch] text-4xl font-extrabold leading-[1.05] tracking-tight [text-wrap:balance] sm:text-5xl">
            {c.titre}
          </h1>
          {c.sousTitre ? <p className="mt-3 max-w-[58ch] text-lg leading-relaxed text-white/90">{c.sousTitre}</p> : null}
          <p className="mt-4 text-[15px] font-bold text-white/85">
            {nbLecons} leçon{nbLecons > 1 ? 's' : ''}
            {c.dureeMinutes ? ` · ${duree(c.dureeMinutes)}` : ''}
            {c.certificat ? ' · attestation de fin' : ''}
          </p>
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-[1040px] gap-8 px-4 py-10 lg:grid-cols-[minmax(0,1fr)_340px] lg:py-14">
        <div className="min-w-0">
          {c.description ? (
            <section className="max-w-[68ch] whitespace-pre-line text-lg leading-relaxed">{c.description}</section>
          ) : null}

          {c.objectifs.length ? (
            <section className="mt-9">
              <h2 className="text-2xl font-extrabold tracking-tight text-[#12312A]">Ce que tu sauras faire</h2>
              <ul className="mt-4 grid gap-2">
                {c.objectifs.map((o) => (
                  <li key={o} className="flex gap-3 leading-relaxed">
                    <span aria-hidden="true" style={{ color: c.ecole.couleur }}>
                      ✓
                    </span>
                    {o}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <section className="mt-9">
            <h2 className="text-2xl font-extrabold tracking-tight text-[#12312A]">Le programme</h2>
            <div className="mt-4 grid gap-3">
              {c.chapitres.map((ch, i) => (
                <div key={`${ch.titre}-${i}`} className="rounded-2xl border border-[#DDEBE4] bg-white p-5">
                  {ch.titre ? (
                    <h3 className="text-lg font-extrabold tracking-tight text-[#12312A]">{ch.titre}</h3>
                  ) : null}
                  {ch.resume ? <p className="mt-1 leading-relaxed">{ch.resume}</p> : null}
                  <ul className="mt-3 grid gap-1.5">
                    {ch.lecons.map((l, j) => (
                      <li key={`${l.titre}-${j}`} className="flex flex-wrap items-center gap-2 text-[15px]">
                        <span className="text-[#5E7A6E]" aria-hidden="true">
                          •
                        </span>
                        <span className="text-[#12312A]">{l.titre}</span>
                        {l.apercu ? (
                          <span className="rounded-full bg-[#FEF3E2] px-2 py-0.5 text-xs font-bold text-[#7C3E06]">Aperçu libre</span>
                        ) : null}
                        {l.dureeMinutes ? <span className="text-sm text-[#5E7A6E]">{duree(l.dureeMinutes)}</span> : null}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          {c.pourQui || c.prerequis ? (
            <section className="mt-9 grid gap-4 sm:grid-cols-2">
              {c.pourQui ? (
                <div className="rounded-2xl border border-[#DDEBE4] bg-white p-5">
                  <h3 className="font-extrabold tracking-tight text-[#12312A]">Pour qui</h3>
                  <p className="mt-1.5 whitespace-pre-line leading-relaxed">{c.pourQui}</p>
                </div>
              ) : null}
              {c.prerequis ? (
                <div className="rounded-2xl border border-[#DDEBE4] bg-white p-5">
                  <h3 className="font-extrabold tracking-tight text-[#12312A]">Prérequis</h3>
                  <p className="mt-1.5 whitespace-pre-line leading-relaxed">{c.prerequis}</p>
                </div>
              ) : null}
            </section>
          ) : null}
        </div>

        <aside className="lg:sticky lg:top-8 lg:self-start">
          <div className="rounded-2xl border border-[#DDEBE4] bg-white p-6">
            <p className="text-3xl font-extrabold" style={{ color: c.ecole.couleur }}>
              {c.gratuit || c.prixCents === 0 ? 'Gratuit' : prix(c.prixCents)}
            </p>
            {c.prixBarreCents ? <p className="mt-1 text-[15px] font-bold text-[#5E7A6E] line-through">{prix(c.prixBarreCents)}</p> : null}

            {/* LE RÈGLEMENT ÉTALÉ, DIT AVANT LE BOUTON.
                Il était réglable côté organisme et invisible côté acheteur :
                personne ne pouvait savoir que la formation se payait en
                plusieurs fois, donc l'option ne servait à rien. Le montant
                affiché est celui qui sera réellement prélevé, chaque mois. */}
            {!c.gratuit && c.prixCents > 0 && (c.echeances ?? 1) > 1 ? (
              <p className="mt-2 text-[15px] font-bold text-[#334A42]">
                ou {c.echeances} × {prix(Math.round(c.prixCents / (c.echeances ?? 1)))} par mois
              </p>
            ) : null}

            <div className="mt-5">
              <Rejoindre
                slug={c.slug}
                gratuit={c.gratuit || c.prixCents === 0}
                couleur={c.ecole.couleur}
                ecole={c.ecole.nom}
                echeances={c.echeances ?? 1}
                echeanceCents={
                  (c.echeances ?? 1) > 1 ? Math.round(c.prixCents / (c.echeances ?? 1)) : null
                }
              />
            </div>

            <ul className="mt-6 grid gap-2 text-[15px] text-[#334A42]">
              <li>{nbLecons} leçon{nbLecons > 1 ? 's' : ''}</li>
              {c.dureeMinutes ? <li>{duree(c.dureeMinutes)} de contenu</li> : null}
              <li>Accès sans limite de temps</li>
              {c.certificat ? <li>Attestation de fin</li> : null}
            </ul>
          </div>
        </aside>
      </main>

      <footer className="mx-auto w-full max-w-[1040px] px-4 pb-12 text-sm leading-relaxed text-[#5E7A6E]">
        Cours proposé par {c.ecole.nom}. Page propulsée par{' '}
        <a href="https://pilote.toulali.fr" className="font-bold underline underline-offset-4">
          Piloter
        </a>
        , un outil de Toulali, centre de formation.
      </footer>
    </div>
  );
}

function prix(cents: number) {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100);
}

function duree(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (!h) return `${m} min`;
  if (!m) return `${h} h`;
  return `${h} h ${String(m).padStart(2, '0')}`;
}
