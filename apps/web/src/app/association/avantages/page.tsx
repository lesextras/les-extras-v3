import Link from 'next/link';
import type { Metadata } from 'next';
import { Accent, BTN_SECONDAIRE, CARTE, Encart, SousTitre, Titre, formaterDate } from '../_ui';
import { AVANTAGES, FAMILLES_AVANTAGES, VERIFIE_LE } from '../_avantages';
import { CarteAvantage } from '../CarteAvantage';

export const metadata: Metadata = {
  title: "Ce à quoi mon association a droit",
  description:
    "Google, Canva, Microsoft et Slack offerts, reçus fiscaux, FDVA, agrément, Service civique, bénévoles : pour chaque avantage, ce qu'il te faut, comment faire pas à pas, et le lien direct pour le demander.",
  alternates: { canonical: '/avantages' },
};

/** Les quatre premières cartes apparaissent l'une après l'autre (classes du CSS global). */
const CASCADE = ['stagger-1', 'stagger-2', 'stagger-3', 'stagger-4'];

const PAPIERS_CLES = [
  { libelle: 'Le récépissé de la préfecture', pourquoi: 'Il prouve que l’association existe. Presque tout le monde le demande.' },
  { libelle: 'Les statuts', pourquoi: 'Ils disent ce que vous faites et comment vous décidez.' },
  { libelle: 'Le RIB de l’association', pourquoi: 'Pour recevoir de l’argent : HelloAsso, subventions, dons.' },
];

export default function AvantagesPage() {
  const total = AVANTAGES.length;
  const gratuits = AVANTAGES.filter((a) => a.cout !== 'REMISE').length;

  return (
    <>
      <Titre
        surtitre="Ce à quoi j'ai droit"
        sousTitre="Des logiciels offerts, des reçus pour tes donateurs, une aide de l'État, un jeune en Service civique, des bénévoles qui te trouvent. Pour chaque chose : ce que tu gagnes, pour qui c'est, ce qu'il te faut, comment faire, et le lien pour le demander."
      >
        Ton association a droit à <Accent>plus</Accent> que tu ne crois.
      </Titre>

      {/* ------------------------------------------------------- en un coup d'œil */}
      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]">
        <div className={`${CARTE} animate-fade-in-up p-5 sm:p-6`}>
          <p className="text-sm font-bold text-[#6B6A8A]">En tout</p>
          <p className="mt-1 text-4xl font-extrabold tabular-nums text-[#1D1B5C]">{total} avantages</p>
          <p className="mt-1 text-sm text-[#6B6A8A]">
            dont {gratuits} gratuits ou publics. Aucun lien n&apos;est sponsorisé.
          </p>
          <nav className="mt-4 flex flex-wrap gap-2" aria-label="Aller à une famille">
            {FAMILLES_AVANTAGES.map((f) => (
              <a key={f.code} href={`#${f.code.toLowerCase()}`} className="rounded-full border border-[#D9D6EE] bg-white px-3 py-1.5 text-sm font-bold text-[#1D1B5C] no-underline transition hover:border-[#4F46E5] hover:text-[#4F46E5]">
                {f.titre} <span className="text-[#6B6A8A]">{f.avantages.length}</span>
              </a>
            ))}
          </nav>
        </div>
        <div className={`${CARTE} animate-fade-in-up stagger-1 p-5 sm:p-6`}>
          <p className="text-sm font-bold uppercase tracking-[0.12em] text-[#6B6A8A]">Prépare trois papiers, une fois</p>
          <p className="mt-1 leading-relaxed">Ils ouvrent presque toutes les portes de cette page. S&apos;ils sont dans ton classeur, tu les envoies en deux clics.</p>
          <ul className="mt-3 grid gap-2 sm:grid-cols-3">
            {PAPIERS_CLES.map((p) => (
              <li key={p.libelle} className="rounded-xl bg-[#F5F4FC] p-3">
                <p className="text-sm font-extrabold text-[#1D1B5C]">{p.libelle}</p>
                <p className="mt-1 text-xs leading-relaxed text-[#6B6A8A]">{p.pourquoi}</p>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/espace/classeur" className={`${BTN_SECONDAIRE} !py-2 text-sm`}>
              Ouvrir mon classeur
            </Link>
            <Link href="/chemin/les-cinq-pieces-d-identite" className="inline-flex items-center px-2 py-2 text-sm font-bold text-[#4F46E5] underline underline-offset-4">
              Étape 3 : les cinq papiers →
            </Link>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------ familles */}
      {FAMILLES_AVANTAGES.map((f, fi) => (
        <section key={f.code} id={f.code.toLowerCase()} className="mt-12 scroll-mt-24">
          <SousTitre>{f.titre}</SousTitre>
          <p className="-mt-2 mb-5 max-w-[70ch] leading-relaxed text-[#6B6A8A]">{f.enUnMot}</p>
          <div className="space-y-4">
            {f.avantages.map((a, i) => (
              <div key={a.code} className={fi === 0 && i < CASCADE.length ? `animate-fade-in-up ${CASCADE[i]}` : undefined}>
                <CarteAvantage avantage={a} ouvert={fi === 0 && i === 0} />
              </div>
            ))}
          </div>
        </section>
      ))}

      {/* ---------------------------------------------------------------- suite */}
      <section className="mt-12 grid gap-4 md:grid-cols-2">
        <Encart ton="info">
          <p className="text-lg font-extrabold">Et pour être trouvé sur internet ?</p>
          <p className="mt-1 leading-relaxed">
            Fiche Google, page HelloAsso, réseaux, adresses e-mail au nom de l&apos;association, site simple : dix étapes dans l&apos;ordre, avec les mêmes fiches.
          </p>
          <Link href="/presence-en-ligne" className={`${BTN_SECONDAIRE} mt-4 !bg-white`}>
            Être visible en ligne →
          </Link>
        </Encart>
        <Encart ton="neutre">
          <p className="text-lg font-extrabold text-[#1D1B5C]">Vérifié le {formaterDate(VERIFIE_LE)}</p>
          <p className="mt-1 leading-relaxed">
            Les conditions et les liens ont été relus sur les sites des organismes à cette date. Les offres changent : c&apos;est toujours le site de l&apos;organisme
            qui fait foi. On n&apos;écrit aucun prix qui ne vienne pas de lui.
          </p>
        </Encart>
      </section>
    </>
  );
}
