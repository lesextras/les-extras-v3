import Link from 'next/link';
import type { Metadata } from 'next';
import { Accent, CARTE, Carte, Encart, SousTitre } from '../_ui';
import { ADRESSE_ADEPA, FormulaireContact } from './FormulaireContact';

export const metadata: Metadata = {
  title: 'Nous contacter',
  description:
    "Écrire à ADéPA, l'association qui fait « Piloter mon association » : une question, un souci, une idée, un partenariat. On répond à tout le monde.",
  alternates: { canonical: '/nous-contacter' },
};

/**
 * NOUS CONTACTER. L'outil est fait par une association, pas par une
 * plateforme : on donne un vrai nom, une vraie adresse, et on dit sous combien
 * de temps on répond.
 */
export default function NousContacterPage() {
  return (
    <div className="mx-auto max-w-[860px]">
      <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-[#1D1B5C] [text-wrap:balance] sm:text-4xl">
        Nous <Accent>contacter</Accent>
      </h1>
      <p className="mt-3 max-w-[65ch] text-lg leading-relaxed">Écris-nous.</p>
      <ul className="mt-3 max-w-[65ch] space-y-1.5 text-lg leading-relaxed">
        <li>Une question</li>
        <li>Quelque chose qui ne marche pas</li>
        <li>Une idée à nous soumettre</li>
        <li>L&apos;envie de travailler ensemble</li>
      </ul>
      <p className="mt-3 max-w-[65ch] leading-relaxed text-[#3B3A66]">
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
            <p className="mt-2 font-extrabold text-[#1D1B5C]">ADéPA</p>
            <p className="mt-1 text-sm leading-relaxed text-[#3B3A66]">
              Association éducative basée à Melun (Seine-et-Marne). C&apos;est elle qui construit « Piloter mon association » avec Toulali, son centre de
              formation.
            </p>
            <p className="mt-3 text-sm">
              <a href={`mailto:${ADRESSE_ADEPA}`} className="font-bold text-[#4F46E5] underline underline-offset-4">
                {ADRESSE_ADEPA}
              </a>
            </p>
            <p className="mt-2 text-sm text-[#6B6A8A]">On répond en général sous deux à trois jours ouvrés.</p>
          </Carte>

          <Encart ton="info">
            <p className="font-extrabold">Avant d&apos;écrire, jette un œil au chemin.</p>
            <p className="mt-1 text-sm leading-relaxed">
              Les questions les plus fréquentes, statuts, préfecture, SIRET, banque, subventions, ont déjà leur étape expliquée pas à pas.
            </p>
            <Link href="/chemin" className="mt-3 inline-flex text-sm font-bold text-[#4F46E5] underline underline-offset-4">
              Ouvrir le chemin →
            </Link>
          </Encart>

          <Carte>
            <p className="font-extrabold text-[#1D1B5C]">Ce qu&apos;on fait de ton message</p>
            <p className="mt-1 text-sm leading-relaxed text-[#6B6A8A]">
              Rien d&apos;autre que te répondre. Ton message part directement dans notre boîte, il ne traverse pas le site et n&apos;est enregistré nulle part
              ici.
            </p>
          </Carte>
        </div>
      </div>
    </div>
  );
}
