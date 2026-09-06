import Link from 'next/link';
import type { Metadata } from 'next';
import { Encart, FormulaireRecherche, Titre } from './_ui';

export const metadata: Metadata = {
  title: 'Piloter mon association — par Toulali',
  alternates: { canonical: '/' },
};

const ENTREES = [
  {
    href: '/verifier',
    titre: 'Vérifier mon association',
    texte:
      "Tapez le nom de votre association. On lit les répertoires publics et on vous dit ce qui est déjà prouvé, ce qui manque, et où le trouver.",
    duree: 'Une minute',
  },
  {
    href: '/chemin',
    titre: 'Le chemin, étape par étape',
    texte:
      "De « je viens de créer l'association » à « ma première subvention est rendue » : douze étapes, une à la fois, sans jargon.",
    duree: 'Douze étapes',
  },
  {
    href: '/outils',
    titre: 'La carte des outils',
    texte:
      "Pour chaque besoin qu'on ne couvre pas (encaisser, tenir les comptes, chercher des aides), l'outil qui le fait, gratuit quand il existe.",
    duree: 'Sept besoins',
  },
];

export default function AccueilAssociation() {
  return (
    <>
      <section className="grid gap-10 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] lg:items-start">
        <div>
          <Titre
            surtitre="Gratuit, sans compte"
            sousTitre="Un financeur demande toujours les mêmes pièces. Vérifiez lesquelles votre association a déjà, lesquelles manquent, et où les trouver : tout part des répertoires publics, vous n'avez rien à saisir."
          >
            Votre association est-elle prête à demander une subvention ?
          </Titre>
          <FormulaireRecherche autoFocus />
          <p className="mt-3 text-sm text-[#5C6B63]">
            Exemple : le nom complet, le numéro SIREN à neuf chiffres, ou le numéro RNA qui commence par W.
          </p>
        </div>
        <Encart>
          <p className="mb-2 text-xs uppercase tracking-[0.14em] text-[#5C6B63]">Ce qu&apos;on vérifie</p>
          <ul className="space-y-2 leading-relaxed">
            <li>Que l&apos;association est bien déclarée en préfecture (numéro RNA).</li>
            <li>Qu&apos;elle a un numéro SIRET, sans lequel aucune subvention ne peut être versée.</li>
            <li>Combien des pièces exigées par les premiers financeurs (commune, FDVA, dossier CERFA) sont déjà prouvées.</li>
          </ul>
          <p className="mt-3 text-sm text-[#5C6B63]">
            Le reste, statuts, comptes, assurance, ne se lit pas dans les répertoires : on vous dit où le trouver.
          </p>
        </Encart>
      </section>

      <section className="mt-16">
        <h2 className="mb-6 text-xl font-semibold tracking-tight">Trois entrées, selon où vous en êtes</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {ENTREES.map((e) => (
            <Link
              key={e.href}
              href={e.href}
              className="group flex flex-col rounded-md border border-[#DDD8CC] bg-white p-5 no-underline transition hover:border-[#1F6A4E]"
            >
              <p className="mb-2 text-xs uppercase tracking-[0.14em] text-[#5C6B63]">{e.duree}</p>
              <h3 className="text-lg font-semibold leading-snug text-[#1E2A25] group-hover:text-[#1F6A4E]">{e.titre}</h3>
              <p className="mt-2 flex-1 leading-relaxed text-[#3E4A44]">{e.texte}</p>
              <span className="mt-4 text-sm font-medium text-[#1F6A4E]">Ouvrir →</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-16 max-w-[64ch]">
        <h2 className="mb-3 text-xl font-semibold tracking-tight">Pourquoi c&apos;est gratuit</h2>
        <p className="leading-relaxed text-[#3E4A44]">
          Une association qui démarre n&apos;a pas d&apos;argent pour un logiciel, et c&apos;est précisément à ce moment-là
          qu&apos;elle a besoin qu&apos;on lui montre le chemin. Ces pages sont là pour ça. Quand l&apos;association grandit,
          quand elle suit plusieurs financeurs, plusieurs échéances et une équipe, l&apos;espace de pilotage complet prend le
          relais. Il arrive.
        </p>
      </section>
    </>
  );
}
