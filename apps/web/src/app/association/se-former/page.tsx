import Link from 'next/link';
import type { Metadata } from 'next';
import { Accent, BTN_PRIMAIRE, BTN_SECONDAIRE, CARTE, Carte, Encart, SousTitre, Titre } from '../_ui';

export const metadata: Metadata = {
  title: 'Se former',
  description:
    "Les étapes du chemin pour apprendre gratuitement, et les formations de Toulali, centre de formation certifié Qualiopi, finançables par l'OPCO de l'association.",
  alternates: { canonical: '/se-former' },
};

const GRATUIT = [
  { href: '/chemin/declarer-l-association', titre: "Créer et déclarer l'association", duree: 'Étape 1' },
  { href: '/chemin/tenir-des-comptes-simples', titre: 'Tenir des comptes simples', duree: 'Étape 6' },
  { href: '/chemin/le-projet-en-une-page', titre: 'Écrire le projet en une page', duree: 'Étape 8' },
  { href: '/chemin/constituer-et-deposer-le-dossier', titre: 'Remplir le CERFA 12156', duree: 'Étape 11' },
];

const FORMATIONS = [
  {
    titre: 'Workshop Studio A2PA : créer du contenu pour son association',
    duree: '8 modules en ligne',
    prix: 'Gratuit',
    pourQui: 'Pour commencer : filmer, écrire, publier avec un téléphone.',
    lien: 'https://toulali.teachizy.fr/',
  },
  {
    titre: 'Community manager mobile : 100 % smartphone',
    duree: 'En ligne, à son rythme',
    prix: '190 €',
    pourQui: "Faire connaître l'association sur les réseaux, sans matériel.",
    lien: 'https://toulali.teachizy.fr/',
  },
  {
    titre: 'Community manager IA : Essentielle',
    duree: 'En ligne, à son rythme',
    prix: '790 € (ou 2 × 395 €)',
    pourQui: "Communiquer plus vite avec l'intelligence artificielle : textes, visuels, planning.",
    lien: 'https://toulali.teachizy.fr/',
  },
  {
    titre: 'Community manager IA : Accompagnement',
    duree: 'En ligne + accompagnement',
    prix: '2 200 € (ou 4 × 550 €)',
    pourQui: 'Avec un suivi personnalisé, pour la personne qui tient la communication.',
    lien: 'https://toulali.teachizy.fr/',
  },
];

export default function SeFormerPage() {
  return (
    <>
      <Titre
        surtitre="Se former"
        sousTitre="D'abord ce qui est gratuit : le chemin explique chaque démarche. Ensuite, pour aller plus loin, les formations de Toulali, centre de formation certifié Qualiopi : une association peut les faire financer."
      >
        Apprendre, <Accent>gratuitement</Accent> d&apos;abord.
      </Titre>

      <section>
        <SousTitre>Gratuit : les étapes du chemin</SousTitre>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {GRATUIT.map((g) => (
            <li key={g.href}>
              <Link href={g.href} className={`${CARTE} group flex h-full flex-col p-4 no-underline transition hover:border-[#4F46E5]`}>
                <span className="text-xs font-bold uppercase tracking-[0.12em] text-[#6B6A8A]">{g.duree}</span>
                <span className="mt-1 flex-1 font-extrabold leading-snug text-[#1D1B5C] group-hover:text-[#4F46E5]">{g.titre}</span>
                <span className="mt-3 text-sm font-bold text-[#4F46E5]">Lire →</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10">
        <SousTitre>Les formations Toulali, certifiées Qualiopi</SousTitre>
        <div className="grid gap-4 md:grid-cols-2">
          {FORMATIONS.map((f) => (
            <Carte key={f.titre}>
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-lg font-extrabold leading-snug text-[#1D1B5C]">{f.titre}</h3>
                <span className="shrink-0 rounded-full bg-[#ECEBFC] px-2.5 py-1 text-xs font-extrabold text-[#4338CA]">{f.prix}</span>
              </div>
              <p className="mt-1 text-sm text-[#6B6A8A]">{f.duree}</p>
              <p className="mt-2 leading-relaxed">{f.pourQui}</p>
              <a href={f.lien} target="_blank" rel="noopener" className={`${BTN_SECONDAIRE} mt-4 !py-2 text-sm`}>
                Voir la formation ↗
              </a>
            </Carte>
          ))}
        </div>
        <p className="mt-3 text-xs text-[#6B6A8A]">Les tarifs sont ceux affichés sur la boutique de Toulali ; ils peuvent évoluer.</p>
      </section>

      <section className="mt-10 grid gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <Encart ton="info">
          <p className="text-lg font-extrabold">Comment une association fait financer une formation</p>
          <ol className="mt-3 space-y-2 leading-relaxed">
            <li>
              <span className="font-bold">1. Qui se forme ?</span> Un salarié de l&apos;association : c&apos;est l&apos;OPCO de l&apos;association qui peut
              payer (pour beaucoup d&apos;associations, c&apos;est Uniformation). Un bénévole : certaines collectivités et le FDVA
              « formation des bénévoles » financent aussi.
            </li>
            <li>
              <span className="font-bold">2. Demande un devis et le programme.</span> Toulali est certifié Qualiopi : c&apos;est la condition
              pour qu&apos;un financeur public ou un OPCO accepte.
            </li>
            <li>
              <span className="font-bold">3. Dépose la demande de prise en charge</span> sur le site de ton OPCO, avant le début de la
              formation, avec le devis et le programme.
            </li>
          </ol>
        </Encart>
        <Carte>
          <p className="text-lg font-extrabold text-[#1D1B5C]">Parler à Toulali</p>
          <p className="mt-1 leading-relaxed">
            Pour un devis, un programme, ou savoir quel financement est possible pour ton association.
          </p>
          <a href="https://toulali.fr" target="_blank" rel="noopener" className={`${BTN_PRIMAIRE} mt-4`}>
            toulali.fr ↗
          </a>
        </Carte>
      </section>
    </>
  );
}
