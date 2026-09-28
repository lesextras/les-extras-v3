import Link from 'next/link';
import type { Metadata } from 'next';
import { Accent, BTN_PRIMAIRE, BTN_SECONDAIRE, CARTE, Encart, SousTitre, Titre, formaterDate } from '../_ui';
import { chargerChemin, TEINTES_PARTIE } from '../_chemin';
import { etapesFaitesSiConnecte } from '../_session';
import { AVANTAGES, FAMILLES_AVANTAGES, VERIFIE_LE } from '../_avantages';
import { CarteAvantage } from '../CarteAvantage';

export const metadata: Metadata = {
  title: 'Le chemin, étape par étape',
  description:
    "Douze étapes pour créer et faire vivre ton association, avec les CERFA, puis tout ce à quoi elle a droit : logiciels offerts, FDVA, Service civique.",
  alternates: { canonical: '/chemin' },
};

export default async function CheminPage() {
  const [chemin, connecte] = await Promise.all([chargerChemin(), etapesFaitesSiConnecte()]);
  const parties = chemin?.parties ?? [];
  const etapes = chemin?.etapes ?? [];
  const faites = connecte?.faites ?? new Set<string>();
  const prochaine = etapes.find((e) => !faites.has(e.slug)) ?? null;

  return (
    <>
      <Titre
        surtitre="Le chemin"
        sousTitre="À chaque étape : tu déposes tes papiers, tu les fabriques sur place, et tu coches. Et une fois l'association née, tout ce à quoi elle a droit est au bout de cette page."
      >
        Douze étapes, <Accent>une subvention</Accent> au bout.
      </Titre>

      <nav className="mb-6 flex flex-wrap gap-2" aria-label="Sur cette page">
        <a href="#partie-1" className="rounded-full border border-[#D9D6EE] bg-white px-3 py-1.5 text-sm font-bold text-[#1D1B5C] no-underline transition hover:border-[#4F46E5] hover:text-[#4F46E5]">
          Les douze étapes
        </a>
        <a href="#droits" className="rounded-full border border-[#D9D6EE] bg-white px-3 py-1.5 text-sm font-bold text-[#1D1B5C] no-underline transition hover:border-[#4F46E5] hover:text-[#4F46E5]">
          Ce à quoi j&apos;ai droit <span className="text-[#6B6A8A]">{AVANTAGES.length}</span>
        </a>
      </nav>

      {!chemin ? (
        <Encart ton="attention">Le chemin ne se charge pas pour le moment. Recharge la page dans un instant.</Encart>
      ) : null}

      {connecte ? (
        <div className={`${CARTE} mb-8 flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between`}>
          <div>
            <p className="text-sm font-bold text-[#6B6A8A]">{connecte.nomAssociation}</p>
            <p className="text-xl font-extrabold text-[#1D1B5C]">
              {faites.size} étape{faites.size > 1 ? 's' : ''} sur {etapes.length} faite{faites.size > 1 ? 's' : ''}
            </p>
          </div>
          {prochaine ? (
            <Link href={`/chemin/${prochaine.slug}`} className={BTN_PRIMAIRE}>
              Continuer : étape {prochaine.numero} →
            </Link>
          ) : (
            <span className="font-bold text-[#1E9E6A]">Le chemin est fini. Bravo !</span>
          )}
        </div>
      ) : (
        <div className={`${CARTE} mb-8 flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between`}>
          <p className="max-w-[60ch] leading-relaxed">
            <span className="font-extrabold text-[#1D1B5C]">Crée ton espace pour cocher les étapes.</span> Gratuit.
          </p>
          <div className="flex shrink-0 gap-2">
            <Link href="/inscription" className={BTN_PRIMAIRE}>
              Créer mon espace
            </Link>
            <Link href="/connexion" className={BTN_SECONDAIRE}>
              Se connecter
            </Link>
          </div>
        </div>
      )}

      <div className="space-y-10">
        {parties.map((p) => {
          const teinte = TEINTES_PARTIE[p.code];
          const siennes = etapes.filter((e) => e.partie === p.code);
          const faitesIci = siennes.filter((e) => faites.has(e.slug)).length;
          return (
            <section key={p.code} id={`partie-${p.numero}`} className="scroll-mt-24">
              <div className={`rounded-2xl border ${teinte.bord} ${teinte.fond} p-5 sm:p-6`}>
                <div className="flex flex-wrap items-center gap-3">
                  <span className={`flex h-10 w-10 items-center justify-center rounded-full text-lg font-extrabold text-white ${teinte.pastille}`}>{p.numero}</span>
                  <h2 className={`text-2xl font-extrabold tracking-tight ${teinte.texte}`}>{p.titre}</h2>
                  {p.code === 'SUBVENTION' ? (
                    <span className="rounded-full bg-[#F5B400] px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wide text-[#1D1B5C]">Le but</span>
                  ) : null}
                  {connecte ? (
                    <span className="ml-auto text-sm font-bold text-[#6B6A8A]">
                      {faitesIci} / {siennes.length}
                    </span>
                  ) : null}
                </div>
                <p className="mt-2 max-w-[70ch] leading-relaxed text-[#1D1B5C]">{p.enUnMot}</p>
              </div>

              <ol className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {siennes.map((e) => {
                  const faite = faites.has(e.slug);
                  const estProchaine = prochaine?.slug === e.slug;
                  return (
                    <li key={e.slug} className="h-full">
                      <Link
                        href={`/chemin/${e.slug}`}
                        className={`${CARTE} group flex h-full flex-col p-5 no-underline transition hover:-translate-y-0.5 hover:border-[#4F46E5] hover:shadow-[0_12px_28px_-20px_rgba(29,27,92,0.8)] ${estProchaine && connecte ? 'border-2 border-[#4F46E5]' : ''}`}
                      >
                        <span className="flex items-center justify-between gap-3">
                          <span
                            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-lg font-extrabold ${
                              faite ? 'bg-[#1E9E6A] text-white' : `${teinte.fond} ${teinte.texte}`
                            }`}
                            aria-label={faite ? 'Étape faite' : undefined}
                          >
                            {faite ? '✓' : e.numero}
                          </span>
                          {faite ? (
                            <span className="rounded-full bg-[#E3F5EC] px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wide text-[#0F5F3E]">Fait</span>
                          ) : estProchaine && connecte ? (
                            <span className="rounded-full bg-[#ECEBFC] px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wide text-[#4338CA]">Prochaine</span>
                          ) : null}
                        </span>
                        <span className="mt-3 block text-lg font-extrabold leading-snug text-[#1D1B5C] group-hover:text-[#4F46E5]">{e.titre}</span>
                        <span className="mt-1 block text-sm leading-relaxed text-[#6B6A8A]">{e.enUnMot}</span>
                        <span className="mt-auto pt-4 text-sm font-bold text-[#4F46E5]">Ouvrir l&apos;étape →</span>
                      </Link>
                    </li>
                  );
                })}
              </ol>
            </section>
          );
        })}
      </div>
      {/* ------------------------------------------------ ce à quoi j'ai droit */}
      <section id="droits" className="mt-16 scroll-mt-24">
        <div className="rounded-2xl border border-[#C7C4F2] bg-[#ECEBFC] p-5 sm:p-6">
          <p className="text-sm font-bold uppercase tracking-[0.12em] text-[#4338CA]">Après le chemin</p>
          <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-[#1D1B5C]">Ce à quoi ton association a droit</h2>
          <p className="mt-2 max-w-[70ch] leading-relaxed text-[#1D1B5C]">
            Des logiciels offerts, des reçus pour tes donateurs, une aide de l&apos;État, un jeune en Service civique, des bénévoles qui te trouvent. Pour chaque chose : ce que tu gagnes, pour qui c&apos;est, ce qu&apos;il te faut, comment faire, et le lien pour le demander.
            {AVANTAGES.length} avantages, aucun lien sponsorisé.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-[#1D1B5C]">
            <span className="font-extrabold">Trois papiers ouvrent presque toutes ces portes</span> : le récépissé de la préfecture, les statuts, le RIB de l&apos;association. Ils sont dans ton classeur dès l&apos;étape 3.
          </p>
          <nav className="mt-4 flex flex-wrap gap-2" aria-label="Aller à une famille">
            {FAMILLES_AVANTAGES.map((f) => (
              <a key={f.code} href={`#${f.code.toLowerCase()}`} className="rounded-full border border-[#C7C4F2] bg-white px-3 py-1.5 text-sm font-bold text-[#1D1B5C] no-underline transition hover:border-[#4F46E5] hover:text-[#4F46E5]">
                {f.titre} <span className="text-[#6B6A8A]">{f.avantages.length}</span>
              </a>
            ))}
          </nav>
        </div>

        {FAMILLES_AVANTAGES.map((f) => (
          <section key={f.code} id={f.code.toLowerCase()} className="mt-10 scroll-mt-24">
            <SousTitre>{f.titre}</SousTitre>
            <p className="-mt-2 mb-5 max-w-[70ch] leading-relaxed text-[#6B6A8A]">{f.enUnMot}</p>
            <div className="space-y-4">
              {f.avantages.map((a) => (
                <CarteAvantage key={a.code} avantage={a} />
              ))}
            </div>
          </section>
        ))}

        <section className="mt-10 grid gap-4 md:grid-cols-2">
          <Encart ton="info">
            <p className="text-lg font-extrabold">Et pour être trouvé sur internet ?</p>
            <p className="mt-1 leading-relaxed">Fiche Google, page HelloAsso, réseaux, adresses e-mail au nom de l&apos;association, site simple : dix étapes dans l&apos;ordre.</p>
            <Link href="/presence-en-ligne" className={`${BTN_SECONDAIRE} mt-4 !bg-white`}>
              Être visible en ligne →
            </Link>
          </Encart>
          <Encart ton="neutre">
            <p className="text-lg font-extrabold text-[#1D1B5C]">Vérifié le {formaterDate(VERIFIE_LE)}</p>
            <p className="mt-1 leading-relaxed">
              Les conditions et les liens ont été relus sur les sites des organismes à cette date. Les offres changent : c&apos;est toujours le site de l&apos;organisme qui fait foi. On n&apos;écrit aucun prix qui ne vienne pas de lui.
            </p>
          </Encart>
        </section>
      </section>
    </>
  );
}
