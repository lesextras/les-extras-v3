import Link from 'next/link';
import type { Metadata } from 'next';
import { Accent, BTN_PRIMAIRE, BTN_SECONDAIRE, CARTE, CARTE_VIVE, Carte, FormulaireRecherche, SousTitre } from './_ui';
import { chargerChemin, TEINTES_PARTIE } from './_chemin';

export const metadata: Metadata = {
  title: 'Piloter mon association — par Toulali',
  alternates: { canonical: '/' },
};

export default async function AccueilAssociation() {
  const chemin = await chargerChemin();
  const parties = chemin?.parties ?? [];
  const etapes = chemin?.etapes ?? [];

  return (
    <>
      {/* ------------------------------------------------------------ accueil */}
      <section className={`${CARTE} overflow-hidden`}>
        <div className="grid gap-8 p-6 sm:p-10 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] lg:items-center">
          <div>
            <p className="mb-3 text-sm font-bold uppercase tracking-[0.12em] text-[#6B6A8A]">Gratuit, pour toutes les associations</p>
            <h1 className="text-3xl font-extrabold leading-[1.08] tracking-tight text-[#1D1B5C] [text-wrap:balance] sm:text-5xl">
              Ton association, <Accent>étape par étape</Accent>, jusqu&apos;à la subvention.
            </h1>
            <p className="mt-4 max-w-[56ch] text-lg leading-relaxed">
              Douze étapes, expliquées simplement. À chaque étape : pourquoi, comment faire, les formulaires officiels et des
              documents exemples à recopier. Rien à deviner.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/chemin" className={BTN_PRIMAIRE}>
                Commencer le chemin →
              </Link>
              <Link href="/subvention" className={BTN_SECONDAIRE}>
                Demander une subvention
              </Link>
            </div>
          </div>
          <div className="rounded-2xl bg-[#F5F4FC] p-5">
            <p className="text-sm font-bold text-[#1D1B5C]">Où en est ton association ?</p>
            <p className="mt-1 text-sm text-[#6B6A8A]">Tape son nom : on lit les répertoires publics et on te dit ce qui est déjà fait.</p>
            <div className="mt-3">
              <FormulaireRecherche />
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------- trois parties */}
      <section className="mt-10">
        <SousTitre>Le chemin en trois parties</SousTitre>
        <div className="grid gap-4 md:grid-cols-3">
          {parties.map((p) => {
            const teinte = TEINTES_PARTIE[p.code];
            const siennes = etapes.filter((e) => e.partie === p.code);
            const but = p.code === 'SUBVENTION';
            return (
              <Link
                key={p.code}
                href={`/chemin#partie-${p.numero}`}
                className={`${CARTE} group flex flex-col p-6 no-underline transition hover:-translate-y-0.5 hover:shadow-md ${but ? 'border-2 border-[#4F46E5]' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <span className={`flex h-10 w-10 items-center justify-center rounded-full text-lg font-extrabold text-white ${teinte.pastille}`}>{p.numero}</span>
                  {but ? <span className="rounded-full bg-[#F5B400] px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wide text-[#1D1B5C]">Le but</span> : null}
                </div>
                <h3 className="mt-4 text-xl font-extrabold leading-snug text-[#1D1B5C] group-hover:text-[#4F46E5]">{p.titre}</h3>
                <p className="mt-2 flex-1 leading-relaxed">{p.enUnMot}</p>
                <ol className="mt-4 space-y-1 text-sm text-[#6B6A8A]">
                  {siennes.map((e) => (
                    <li key={e.slug} className="flex gap-2">
                      <span className="w-5 shrink-0 text-right tabular-nums">{e.numero}.</span>
                      <span>{e.titre}</span>
                    </li>
                  ))}
                </ol>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ---------------------------------------------------------- subvention */}
      <section className="mt-10 rounded-2xl border-2 border-[#4F46E5] bg-[#ECEBFC] p-6 sm:p-8">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] lg:items-center">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.12em] text-[#4338CA]">Demander une subvention</p>
            <h2 className="mt-2 text-2xl font-extrabold leading-tight text-[#1D1B5C] [text-wrap:balance] sm:text-3xl">
              Un projet en une page, un budget, le formulaire <Accent>CERFA 12156</Accent>, et tu déposes.
            </h2>
            <p className="mt-3 max-w-[58ch] leading-relaxed">
              Mairie, FDVA, département, appels à projets : on t&apos;explique à qui demander, quoi remplir, quels papiers joindre,
              et comment rendre compte ensuite. Tout est gratuit.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href="/subvention" className={BTN_PRIMAIRE}>
                Voir comment faire
              </Link>
              <Link href="/espace/dossiers" className={BTN_SECONDAIRE}>
                Suivre mes dossiers
              </Link>
            </div>
          </div>
          <ul className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            {[
              ['1', 'Raconter le projet', 'Quatre questions, une page.'],
              ['2', 'Chiffrer le budget', 'Dépenses = recettes.'],
              ['3', 'Déposer et rendre compte', 'CERFA 12156, puis 15059.'],
            ].map(([n, t, d]) => (
              <li key={n} className="flex items-start gap-3 rounded-xl bg-white p-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#4F46E5] text-sm font-extrabold text-white">{n}</span>
                <span>
                  <span className="block font-extrabold text-[#1D1B5C]">{t}</span>
                  <span className="block text-sm text-[#6B6A8A]">{d}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ------------------------------------------- ce à quoi j'ai droit */}
      <section className="mt-10 grid gap-4 md:grid-cols-2">
        <Link href="/avantages" className={`${CARTE_VIVE} group block p-5 no-underline sm:p-6`}>
          <p className="text-sm font-bold uppercase tracking-[0.12em] text-[#6B6A8A]">Ce à quoi j&apos;ai droit</p>
          <h2 className="mt-2 text-xl font-extrabold text-[#1D1B5C] group-hover:text-[#4F46E5]">
            Google, Canva, Microsoft offerts, reçus fiscaux, Service civique, bénévoles…
          </h2>
          <p className="mt-2 leading-relaxed text-[#3B3A66]">
            Quinze avantages qu&apos;une association peut demander. Pour chacun : ce qu&apos;il te faut, comment faire, et le lien direct.
          </p>
          <span className="mt-4 inline-block text-sm font-bold text-[#4F46E5]">Voir la liste →</span>
        </Link>
        <Link href="/presence-en-ligne" className={`${CARTE_VIVE} group block p-5 no-underline sm:p-6`}>
          <p className="text-sm font-bold uppercase tracking-[0.12em] text-[#6B6A8A]">Être visible en ligne</p>
          <h2 className="mt-2 text-xl font-extrabold text-[#1D1B5C] group-hover:text-[#4F46E5]">
            Fiche Google, page HelloAsso, réseaux, e-mails au nom de l&apos;association, site simple.
          </h2>
          <p className="mt-2 leading-relaxed text-[#3B3A66]">
            Dix étapes dans l&apos;ordre, une par semaine, presque toutes gratuites. Qu&apos;on te trouve, et qu&apos;on comprenne.
          </p>
          <span className="mt-4 inline-block text-sm font-bold text-[#4F46E5]">Commencer →</span>
        </Link>
      </section>

      {/* ---------------------------------------------------------- mon espace */}
      <section className="mt-10 grid gap-4 md:grid-cols-2">
        <Carte>
          <p className="text-sm font-bold uppercase tracking-[0.12em] text-[#6B6A8A]">Mon espace</p>
          <h2 className="mt-2 text-xl font-extrabold text-[#1D1B5C]">Un classeur qui prévient avant qu&apos;une pièce expire</h2>
          <p className="mt-2 leading-relaxed">
            Tes papiers rangés, tes dossiers de subvention suivis du repérage au compte rendu, ton équipe et tes contacts,
            et chaque lundi ce qui presse. Pré-rempli depuis les répertoires publics.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href="/inscription" className={BTN_PRIMAIRE}>
              Créer l&apos;espace de mon association
            </Link>
            <Link href="/connexion" className={BTN_SECONDAIRE}>
              J&apos;ai déjà un espace
            </Link>
          </div>
        </Carte>
        <Carte>
          <p className="text-sm font-bold uppercase tracking-[0.12em] text-[#6B6A8A]">Pourquoi c&apos;est gratuit</p>
          <p className="mt-2 leading-relaxed">
            Une association qui démarre n&apos;a pas d&apos;argent pour un logiciel, et c&apos;est justement à ce moment-là qu&apos;elle
            a besoin qu&apos;on lui montre le chemin. Ces pages sont là pour ça. Quand elle grandit, l&apos;espace de pilotage prend
            le relais : il est ouvert, et gratuit lui aussi pendant qu&apos;il se construit.
          </p>
          <p className="mt-3 text-sm text-[#6B6A8A]">
            Un outil de Toulali, centre de formation. Pour aller plus loin :{' '}
            <Link href="/se-former" className="font-bold text-[#4F46E5] underline underline-offset-4">
              se former
            </Link>
            .
          </p>
        </Carte>
      </section>
    </>
  );
}
