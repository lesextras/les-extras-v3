import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { fetchPublic } from '../../_shared/server';
import type { Champ } from '../../_shared/formulaires/types';
import { Repondre } from './Repondre';

export const dynamic = 'force-dynamic';

interface PagePublique {
  titre: string;
  introduction: string | null;
  structure: string | null;
  champs: Champ[];
  demanderEmail: boolean;
  remerciement: string | null;
  ferme: boolean;
}

async function charger(slug: string): Promise<PagePublique | null> {
  const { data } = await fetchPublic<PagePublique>(`/public/formulaires/${encodeURIComponent(slug)}`, { revalidate: 0 });
  return data && typeof (data as PagePublique).titre === 'string' ? (data as PagePublique) : null;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const f = await charger(slug);
  if (!f) return { title: 'Formulaire introuvable', robots: { index: false, follow: false } };
  return {
    title: f.titre,
    description: f.introduction ?? undefined,
    robots: { index: false, follow: false },
  };
}

/**
 * LA PAGE PUBLIQUE D'UN FORMULAIRE.
 *
 * Elle ne dépend d'aucun espace : ni barre latérale, ni compte, ni cookie.
 * C'est l'adresse qu'on partage, et elle doit s'ouvrir vite sur un téléphone,
 * même chez quelqu'un qui ne connaît pas la plateforme.
 */
export default async function PageFormulaire({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const f = await charger(slug);
  if (!f) notFound();

  return (
    <div
      className="min-h-screen bg-[#F5F4FC] px-4 py-8 text-[#3B3A66] sm:py-14"
      style={{ fontFamily: 'var(--font-pilote), system-ui, sans-serif' }}
    >
      <main className="mx-auto w-full max-w-[720px]">
        <div className="rounded-[24px] border border-[#E6E4F3] bg-white p-6 shadow-sm sm:p-9">
          {f.structure ? (
            <p className="text-sm font-extrabold uppercase tracking-[0.12em] text-[#6B6A8A]">{f.structure}</p>
          ) : null}
          <h1 className="mt-1.5 text-3xl font-extrabold leading-tight tracking-tight text-[#1D1B5C] [text-wrap:balance] sm:text-4xl">
            {f.titre}
          </h1>
          {f.introduction ? (
            <p className="mt-4 whitespace-pre-line text-lg leading-relaxed text-[#3B3A66]">{f.introduction}</p>
          ) : null}
        </div>

        {f.ferme ? (
          <div className="mt-5 rounded-[24px] border-2 border-[#F5D6A8] bg-[#FEF3E2] p-6 text-[#7C3E06] sm:p-8">
            <h2 className="text-xl font-extrabold tracking-tight">Ce formulaire est fermé.</h2>
            <p className="mt-2 leading-relaxed">
              Il n&apos;accepte plus de réponse. Si tu penses que c&apos;est une erreur, préviens la personne qui
              t&apos;a envoyé le lien.
            </p>
          </div>
        ) : (
          <Repondre
            slug={slug}
            champs={f.champs}
            demanderEmail={f.demanderEmail}
            remerciement={f.remerciement ?? 'Merci, ta réponse est bien arrivée.'}
          />
        )}

        <p className="mt-8 text-center text-sm leading-relaxed text-[#6B6A8A]">
          Formulaire créé avec{' '}
          <a href="https://pilote.toulali.fr" className="font-bold text-[#4F46E5] underline underline-offset-4">
            Piloter
          </a>
          , un outil de Toulali, centre de formation. Tes réponses ne sont lues que par la structure qui pose les
          questions.
        </p>
      </main>
    </div>
  );
}
