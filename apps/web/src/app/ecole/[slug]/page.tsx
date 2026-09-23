import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { fetchPublic } from '../../_shared/server';

export const dynamic = 'force-dynamic';

interface Vitrine {
  ecole: {
    nom: string;
    slug: string;
    sousTitre: string | null;
    presentation: string | null;
    logoUrl: string | null;
    banniereUrl: string | null;
    couleur: string;
    couleurFond?: string | null;
    couleurTitres?: string | null;
    couleurTextes?: string | null;
    couleurBoutons?: string | null;
    couleurTexteBoutons?: string | null;
    faviconUrl?: string | null;
    liensSociaux?: { reseau: string; url: string }[] | null;
    contactEmail: string | null;
  };
  cours: {
    titre: string;
    slug: string;
    sousTitre: string | null;
    imageUrl: string | null;
    niveau: string;
    gratuit: boolean;
    prixCents: number;
    prixBarreCents: number | null;
    dureeMinutes: number;
    nbLecons: number;
    certificat: boolean;
  }[];
  packs: { titre: string; slug: string; description: string | null; prixCents: number }[];
}

async function charger(slug: string) {
  const { data } = await fetchPublic<Vitrine>(`/public/ecole/vitrine/${encodeURIComponent(slug)}`, { revalidate: 0 });
  return data && (data as Vitrine).ecole ? (data as Vitrine) : null;
}

interface Seo {
  seo: { titre: string | null; description: string | null; indexable: boolean };
  domaine: string | null;
}

async function chargerSeo(slug: string) {
  const { data } = await fetchPublic<Seo>(`/public/ecole/ecoles/${encodeURIComponent(slug)}/infos`, { revalidate: 0 });
  return data && (data as Seo).seo ? (data as Seo) : null;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const [v, s] = await Promise.all([charger(slug), chargerSeo(slug)]);
  if (!v) return { title: 'École introuvable' };
  // Le référencement réglé par l'école passe avant ce qu'on déduit de sa page.
  const titre = s?.seo.titre || v.ecole.nom;
  const description = s?.seo.description || v.ecole.sousTitre || undefined;
  return {
    title: { absolute: titre },
    description,
    alternates: { canonical: s?.domaine ? `https://${s.domaine}/` : `/ecole/${v.ecole.slug}` },
    openGraph: { title: titre, description, images: v.ecole.banniereUrl ? [v.ecole.banniereUrl] : undefined },
    robots: s && !s.seo.indexable ? { index: false, follow: false } : undefined,
    icons: v.ecole.faviconUrl ? { icon: v.ecole.faviconUrl } : undefined,
  };
}

/**
 * LA VITRINE D'UNE ÉCOLE.
 *
 * Une seule adresse à donner, qui rassemble tous les cours. Les couleurs
 * viennent de l'école : c'est sa page, pas la nôtre.
 */
export default async function PageEcole({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const v = await charger(slug);
  if (!v) notFound();

  const { ecole } = v;

  // Les cinq couleurs facultatives se déduisent de la principale quand elles
  // sont vides : une école qui n'y touche pas garde exactement l'ancien rendu.
  const fond = ecole.couleurFond || '#F7F8F7';
  const titres = ecole.couleurTitres || '#12312A';
  const textes = ecole.couleurTextes || '#334A42';
  const boutons = ecole.couleurBoutons || ecole.couleur;
  const texteBoutons = ecole.couleurTexteBoutons || '#FFFFFF';
  const liens = Array.isArray(ecole.liensSociaux) ? ecole.liensSociaux : [];

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: fond, color: textes, fontFamily: 'var(--font-pilote), system-ui, sans-serif' }}
    >
      <header className="px-4 py-10 sm:py-16" style={{ backgroundColor: ecole.couleur, color: texteBoutons }}>
        <div className="mx-auto flex w-full max-w-[1040px] flex-col items-start gap-5">
          <div className="flex w-full items-start justify-between gap-4">
            {ecole.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={ecole.logoUrl} alt="" className="h-16 w-16 rounded-2xl bg-white/10 object-contain p-1.5" />
            ) : (
              <span />
            )}
            <Link
              href={`/ecole/${ecole.slug}/espace`}
              className="rounded-xl bg-white px-4 py-2.5 text-sm font-extrabold no-underline shadow-sm"
              style={{ color: ecole.couleur }}
            >
              Espace apprenant
            </Link>
          </div>
          <h1 className="text-4xl font-extrabold leading-[1.05] tracking-tight [text-wrap:balance] sm:text-5xl">{ecole.nom}</h1>
          {ecole.sousTitre ? <p className="max-w-[56ch] text-lg leading-relaxed opacity-90">{ecole.sousTitre}</p> : null}
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1040px] px-4 py-10 sm:py-14">
        {ecole.presentation ? (
          <section className="mb-10 max-w-[68ch] whitespace-pre-line text-lg leading-relaxed">{ecole.presentation}</section>
        ) : null}

        <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl" style={{ color: titres }}>Les cours</h2>
        {v.cours.length === 0 ? (
          <p className="mt-3 leading-relaxed">Aucun cours n&apos;est publié pour le moment.</p>
        ) : (
          <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {v.cours.map((c) => (
              <li key={c.slug} className="overflow-hidden rounded-2xl border border-[#DDEBE4] bg-white">
                <Link href={`/cours/${c.slug}`} className="block no-underline">
                  {c.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.imageUrl} alt="" className="h-40 w-full object-cover" />
                  ) : (
                    <div className="h-40 w-full" style={{ backgroundColor: `${ecole.couleur}1A` }} />
                  )}
                  <div className="p-5">
                    <h3 className="text-lg font-extrabold leading-tight tracking-tight" style={{ color: titres }}>{c.titre}</h3>
                    {c.sousTitre ? <p className="mt-1 text-[15px] leading-relaxed text-[#334A42]">{c.sousTitre}</p> : null}
                    <p className="mt-3 text-sm text-[#5E7A6E]">
                      {c.nbLecons} leçon{c.nbLecons > 1 ? 's' : ''}
                      {c.certificat ? ' · attestation' : ''}
                    </p>
                    <p className="mt-2 text-lg font-extrabold" style={{ color: boutons }}>
                      {c.gratuit || c.prixCents === 0 ? 'Gratuit' : prix(c.prixCents)}
                      {c.prixBarreCents ? <span className="ml-2 text-sm font-bold text-[#5E7A6E] line-through">{prix(c.prixBarreCents)}</span> : null}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}

        {v.packs.length ? (
          <>
            <h2 className="mt-12 text-2xl font-extrabold tracking-tight sm:text-3xl" style={{ color: titres }}>Les packs</h2>
            <ul className="mt-5 grid gap-4 sm:grid-cols-2">
              {v.packs.map((p) => (
                <li key={p.slug} className="rounded-2xl border border-[#DDEBE4] bg-white p-5">
                  <h3 className="text-lg font-extrabold tracking-tight" style={{ color: titres }}>{p.titre}</h3>
                  {p.description ? <p className="mt-1 leading-relaxed">{p.description}</p> : null}
                  <p className="mt-3 text-lg font-extrabold" style={{ color: boutons }}>
                    {prix(p.prixCents)}
                  </p>
                </li>
              ))}
            </ul>
          </>
        ) : null}

        <footer className="mt-14 border-t border-[#DDEBE4] pt-6 text-sm leading-relaxed text-[#5E7A6E]">
          {ecole.contactEmail ? (
            <p>
              Une question ?{' '}
              <a href={`mailto:${ecole.contactEmail}`} className="font-bold underline underline-offset-4" style={{ color: boutons }}>
                {ecole.contactEmail}
              </a>
            </p>
          ) : null}
          {liens.length ? (
            <p className="mb-4 flex flex-wrap justify-center gap-x-4 gap-y-2">
              {liens.map((l) => (
                <a
                  key={`${l.reseau}-${l.url}`}
                  href={l.url}
                  target="_blank"
                  rel="noreferrer"
                  className="font-bold underline underline-offset-4"
                  style={{ color: boutons }}
                >
                  {NOM_RESEAU[l.reseau] ?? l.reseau}
                </a>
              ))}
            </p>
          ) : null}
          <p className="mt-2">
            <Link href={`/ecole/${ecole.slug}/legal`} className="font-bold underline underline-offset-4" style={{ color: boutons }}>
              Conditions et confidentialité
            </Link>
          </p>
          <p className="mt-2">
            École en ligne propulsée par{' '}
            <a href="https://pilote.toulali.fr" className="font-bold underline underline-offset-4">
              Piloter
            </a>
            , un outil de Toulali, centre de formation.
          </p>
        </footer>
      </main>
    </div>
  );
}

const NOM_RESEAU: Record<string, string> = {
  site: 'Site web',
  facebook: 'Facebook',
  messenger: 'Messenger',
  whatsapp: 'WhatsApp',
  instagram: 'Instagram',
  tiktok: 'TikTok',
  linkedin: 'LinkedIn',
  youtube: 'YouTube',
  twitter: 'X',
  vimeo: 'Vimeo',
  soundcloud: 'Soundcloud',
  spotify: 'Spotify',
  pinterest: 'Pinterest',
  github: 'GitHub',
};

function prix(cents: number) {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100);
}
