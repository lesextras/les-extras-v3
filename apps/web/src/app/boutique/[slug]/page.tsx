import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { fetchPublic } from '../../_shared/server';
import { Panier, type ProduitPublic } from './Panier';

export const dynamic = 'force-dynamic';

interface VitrinePublique {
  boutique: {
    nom: string;
    slug: string;
    sousTitre: string | null;
    presentation: string | null;
    logoUrl: string | null;
    banniereUrl: string | null;
    couleur: string;
    contactEmail: string | null;
    cgv: string | null;
    mentions: string | null;
    livraisonTexte: string | null;
  };
  produits: ProduitPublic[];
}

async function charger(slug: string) {
  const { data } = await fetchPublic<VitrinePublique>(
    `/public/boutique/${encodeURIComponent(slug)}`,
    { revalidate: 0 },
  );
  return data && (data as VitrinePublique).boutique ? (data as VitrinePublique) : null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const v = await charger(slug);
  if (!v) return { title: 'Boutique introuvable' };
  return {
    title: v.boutique.nom,
    description: v.boutique.sousTitre ?? undefined,
    alternates: { canonical: `/boutique/${v.boutique.slug}` },
  };
}

/**
 * LA BOUTIQUE D'UNE ASSOCIATION, CÔTÉ VISITEUR.
 *
 * Une seule adresse à donner, aux couleurs de l'association. Le panier et le
 * formulaire de commande vivent dans un composant à part : ils ont besoin du
 * navigateur, le reste de la page non.
 */
export default async function PageBoutique({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const v = await charger(slug);
  if (!v) notFound();

  const { boutique, produits } = v;
  const teinte = /^#[0-9a-fA-F]{6}$/.test(boutique.couleur) ? boutique.couleur : '#0F5F3E';

  return (
    <div
      className="min-h-screen bg-[#F7F8F7] text-[#334A42]"
      style={{ fontFamily: 'var(--font-pilote), system-ui, sans-serif' }}
    >
      <header className="px-4 py-10 sm:py-14" style={{ backgroundColor: teinte, color: '#FFFFFF' }}>
        <div className="mx-auto flex w-full max-w-[1040px] flex-col items-start gap-5">
          {boutique.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={boutique.logoUrl}
              alt=""
              className="h-16 w-16 rounded-2xl bg-white/10 object-contain p-1.5"
            />
          ) : null}
          <h1 className="text-4xl font-extrabold leading-[1.05] tracking-tight [text-wrap:balance] sm:text-5xl">
            {boutique.nom}
          </h1>
          {boutique.sousTitre ? (
            <p className="max-w-[56ch] text-lg leading-relaxed opacity-90">{boutique.sousTitre}</p>
          ) : null}
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1040px] px-4 py-10 sm:py-14">
        {boutique.presentation ? (
          <section className="mb-10 max-w-[68ch] whitespace-pre-line text-lg leading-relaxed">
            {boutique.presentation}
          </section>
        ) : null}

        <Panier
          slug={boutique.slug}
          teinte={teinte}
          produits={produits}
          livraisonTexte={boutique.livraisonTexte}
        />

        <footer className="mt-14 border-t border-[#DDEBE4] pt-6 text-sm leading-relaxed text-[#5E7A6E]">
          {boutique.contactEmail ? (
            <p>
              Une question ?{' '}
              <a
                href={`mailto:${boutique.contactEmail}`}
                className="font-bold underline underline-offset-4"
                style={{ color: teinte }}
              >
                {boutique.contactEmail}
              </a>
            </p>
          ) : null}
          {boutique.cgv ? (
            <details className="mt-4">
              <summary className="cursor-pointer font-bold">Conditions de vente</summary>
              <p className="mt-2 whitespace-pre-line">{boutique.cgv}</p>
            </details>
          ) : null}
          {boutique.mentions ? (
            <details className="mt-2">
              <summary className="cursor-pointer font-bold">Mentions légales</summary>
              <p className="mt-2 whitespace-pre-line">{boutique.mentions}</p>
            </details>
          ) : null}
        </footer>
      </main>
    </div>
  );
}
