import Link from 'next/link';
import type { Metadata } from 'next';
import { Accent, CARTE, FilEtapes } from '../_ui';
import { FormulaireInscription } from './FormulaireInscription';

export const metadata: Metadata = {
  title: 'Créer mon espace',
  description:
    "Ouvre gratuitement ton espace : que ton association existe déjà (son classeur naît pré-rempli depuis les répertoires publics) ou que tu partes de zéro (le chemin te guide, étape par étape).",
  alternates: { canonical: '/inscription' },
};

/**
 * DEUX PORTES : on n'a pas encore d'association (on suit le chemin), ou on en
 * a déjà une (on ouvre son espace tout de suite). Sans choix, on montre les
 * deux portes ; le choix se garde dans l'adresse (?type=).
 */
export default async function InscriptionPage({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  const { type } = await searchParams;
  const choix = type === 'particulier' ? 'particulier' : type === 'association' ? 'association' : null;

  return (
    <div className="mx-auto max-w-[760px]">
      <p className="mb-4 text-right text-sm">
        Tu as déjà un compte ?{' '}
        <Link href="/connexion" className="font-bold text-[#4F46E5] underline underline-offset-4">
          Connexion →
        </Link>
      </p>

      {!choix ? (
        <>
          <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-[#1D1B5C] [text-wrap:balance] sm:text-4xl">
            Par où tu <Accent>commences</Accent> ?
          </h1>
          <p className="mt-3 max-w-[60ch] text-lg leading-relaxed">
            Deux portes, gratuites toutes les deux. Tu passeras de l&apos;une à l&apos;autre quand tu voudras.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <Link
              href="/inscription?type=particulier"
              className={`${CARTE} flex flex-col p-6 no-underline transition hover:-translate-y-0.5 hover:border-[#4F46E5]`}
            >
              <span className="text-sm font-extrabold uppercase tracking-[0.12em] text-[#C42B57]">Je n&apos;ai pas encore d&apos;association</span>
              <span className="mt-2 block text-xl font-extrabold leading-snug text-[#1D1B5C]">Je veux en créer une</span>
              <span className="mt-2 block leading-relaxed text-[#3B3A66]">
                Tu crées ton compte, et le chemin te prend par la main : les statuts, la déclaration en préfecture, le SIRET, le compte en banque, puis la
                première subvention. Douze étapes, expliquées simplement.
              </span>
              <span className="mt-4 block text-sm font-bold text-[#4F46E5]">Créer mon compte →</span>
            </Link>

            <Link
              href="/inscription?type=association"
              className={`${CARTE} flex flex-col p-6 no-underline transition hover:-translate-y-0.5 hover:border-[#4F46E5]`}
            >
              <span className="text-sm font-extrabold uppercase tracking-[0.12em] text-[#C42B57]">J&apos;ai déjà une association</span>
              <span className="mt-2 block text-xl font-extrabold leading-snug text-[#1D1B5C]">Association ou fondation</span>
              <span className="mt-2 block leading-relaxed text-[#3B3A66]">
                Tu la retrouves par son nom : ses numéros RNA et SIRET, son siège et sa date de création se remplissent tout seuls depuis les répertoires
                publics. Son classeur est prêt avant ton premier clic.
              </span>
              <span className="mt-4 block text-sm font-bold text-[#4F46E5]">Ouvrir l&apos;espace de mon association →</span>
            </Link>
          </div>

          <p className="mt-6 text-sm text-[#6B6A8A]">Dans les deux cas : rien à installer, rien à payer, et tes pièces restent les tiennes.</p>
        </>
      ) : (
        <div className={`${CARTE} p-6 sm:p-10`}>
          <p className="mb-4 text-sm">
            <Link href="/inscription" className="font-bold text-[#4F46E5] underline underline-offset-4">
              ← Changer de porte
            </Link>
          </p>
          <FilEtapes total={choix === 'association' ? 3 : 2} courante={1} />
          <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-[#1D1B5C] [text-wrap:balance] sm:text-4xl">
            {choix === 'association' ? (
              <>
                Crée l&apos;espace de ton association <Accent>gratuitement</Accent>
              </>
            ) : (
              <>
                On va la créer, ton <Accent>association</Accent>
              </>
            )}
          </h1>
          <p className="mt-3 text-lg leading-relaxed">
            {choix === 'association'
              ? "Ton association, puis toi, puis c'est prêt. Deux minutes. Rien à installer, rien à payer."
              : "Juste ton nom et ton adresse e-mail. Ensuite le chemin t'explique la première étape — et le jour où l'association existe, tu ouvres son espace en un clic."}
          </p>
          <div className="mt-8">
            <FormulaireInscription avecAssociation={choix === 'association'} />
          </div>
        </div>
      )}
    </div>
  );
}
