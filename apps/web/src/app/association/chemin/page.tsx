import Link from 'next/link';
import type { Metadata } from 'next';
import { fetchPublic } from '../../_shared/server';
import { Encart, Titre } from '../_ui';

export const metadata: Metadata = {
  title: 'Le chemin : piloter une association, étape par étape',
  description:
    "Douze étapes, de la déclaration en préfecture à la première subvention rendue. Une action à la fois, sans jargon, avec le lien vers le bon service à chaque étape.",
  alternates: { canonical: '/chemin' },
};

interface Etape {
  numero: number;
  slug: string;
  titre: string;
  pourquoi: string;
  dureeEstimee: string;
  debloque: string;
}

export default async function CheminPage() {
  const { data } = await fetchPublic<{ etapes: Etape[]; total: number }>('/public/association/chemin', {
    revalidate: 3600,
  });
  const etapes = data?.etapes ?? [];

  return (
    <>
      <Titre
        surtitre="Gratuit, et ça le reste"
        sousTitre="Vous venez de créer une association et personne ne vous a dit par où commencer. Voici l'ordre. Chaque étape dit pourquoi, quoi faire, et combien de temps ça prend. Une étape déjà faite ailleurs, on la saute."
      >
        Piloter une association, une étape à la fois
      </Titre>

      {etapes.length === 0 ? (
        <Encart ton="attention">Le chemin ne se charge pas pour le moment. Rechargez la page dans un instant.</Encart>
      ) : (
        <ol className="relative space-y-3 border-l border-[#DDD8CC] pl-6 sm:pl-8">
          {etapes.map((e) => (
            <li key={e.slug} className="relative">
              <span
                aria-hidden
                className="absolute -left-[calc(1.5rem+9px)] top-5 h-[18px] w-[18px] rounded-full border-2 border-[#1F6A4E] bg-[#F6F4EE] sm:-left-[calc(2rem+9px)]"
              />
              <Link
                href={`/chemin/${e.slug}`}
                className="block rounded-md border border-[#DDD8CC] bg-white p-5 no-underline transition hover:border-[#1F6A4E]"
              >
                <p className="text-xs uppercase tracking-[0.14em] text-[#5C6B63]">
                  Étape {e.numero} sur {etapes.length} · {e.dureeEstimee.split('.')[0]}
                </p>
                <h2 className="mt-1 text-lg font-semibold leading-snug text-[#1E2A25]">{e.titre}</h2>
                <p className="mt-2 leading-relaxed text-[#3E4A44]">{e.pourquoi}</p>
              </Link>
            </li>
          ))}
        </ol>
      )}

      <section className="mt-12 max-w-[64ch]">
        <Encart>
          <p className="font-semibold">Vous avez déjà commencé ?</p>
          <p className="mt-2 leading-relaxed text-[#3E4A44]">
            <Link href="/verifier" className="underline underline-offset-4">
              Vérifiez votre association
            </Link>{' '}
            : les répertoires publics disent quelles étapes sont déjà faites, et le chemin reprend à la suivante.
          </p>
        </Encart>
      </section>
    </>
  );
}
