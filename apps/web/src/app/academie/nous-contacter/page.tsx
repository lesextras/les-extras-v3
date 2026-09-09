import Link from 'next/link';
import type { Metadata } from 'next';
import { Accent, CARTE, Carte, SousTitre } from '../_ui';
import { ADRESSE_ADEPA, FormulaireContact } from '../../association/nous-contacter/FormulaireContact';

export const metadata: Metadata = {
  title: 'Nous contacter',
  description:
    "Écrire à ADéPA, l'association qui fait « Piloter mon académie » : une question, un souci, une idée, un partenariat. On répond à tout le monde.",
  alternates: { canonical: '/academie/nous-contacter' },
};

/**
 * NOUS CONTACTER, côté académie. Le formulaire est le même que celui de
 * l'espace association — même équipe, même adresse : on ne le duplique pas.
 */
export default function NousContacterAcademiePage() {
  return (
    <div className="mx-auto max-w-[860px]">
      <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-[#12312A] [text-wrap:balance] sm:text-4xl">
        Nous <Accent>contacter</Accent>
      </h1>
      <p className="mt-3 max-w-[65ch] text-lg leading-relaxed">Écris-nous.</p>
      <ul className="mt-3 max-w-[65ch] space-y-1.5 text-lg leading-relaxed">
        <li>Une question sur ta déclaration d&apos;activité</li>
        <li>Un indicateur Qualiopi qui te bloque</li>
        <li>Quelque chose qui ne marche pas</li>
        <li>L&apos;envie de travailler ensemble</li>
      </ul>
      <p className="mt-3 max-w-[65ch] leading-relaxed text-[#5E7A6E]">
        C&apos;est une petite équipe associative qui lit, et qui répond.
      </p>

      <div className="mt-8 grid gap-4 md:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] md:items-start">
        <div className={`${CARTE} p-5 sm:p-7`}>
          <SousTitre>Écris-nous</SousTitre>
          <div className="mt-4">
            <FormulaireContact />
          </div>
        </div>

        <div className="space-y-4">
          <Carte>
            <p className="text-sm font-extrabold uppercase tracking-[0.12em] text-[#C42B57]">Qui répond</p>
            <p className="mt-2 font-extrabold text-[#12312A]">ADéPA</p>
            <p className="mt-1 text-sm leading-relaxed text-[#334A42]">
              Association éducative basée à Melun (Seine-et-Marne). C&apos;est elle qui construit « Piloter mon académie » avec
              Toulali, son centre de formation certifié Qualiopi.
            </p>
            <p className="mt-3 text-sm">
              <a href={`mailto:${ADRESSE_ADEPA}`} className="font-bold text-[#0F5F3E] underline underline-offset-4">
                {ADRESSE_ADEPA}
              </a>
            </p>
            <p className="mt-2 text-sm text-[#5E7A6E]">On répond en général sous deux à trois jours ouvrés.</p>
          </Carte>

          <Carte>
            <p className="text-sm font-extrabold uppercase tracking-[0.12em] text-[#0F5F3E]">Avant d&apos;écrire</p>
            <p className="mt-2 text-sm leading-relaxed text-[#334A42]">
              Beaucoup de questions trouvent déjà leur réponse dans{' '}
              <Link href="/academie/chemin" className="font-bold text-[#0F5F3E] underline underline-offset-4">
                les douze étapes du chemin
              </Link>
              , qui disent dans quel ordre s&apos;y prendre et ce qu&apos;il faut pour passer à la suivante.
            </p>
          </Carte>
        </div>
      </div>
    </div>
  );
}
