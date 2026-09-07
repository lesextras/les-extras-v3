import Link from 'next/link';
import type { Metadata } from 'next';
import { Accent, BTN_SECONDAIRE, CARTE, Encart, Titre } from '../_ui';
import { AGREMENTS_VERIFIE_LE, FAMILLES_AGREMENTS, TRONC_COMMUN } from '../_agrements';

export const metadata: Metadata = {
  title: 'Nos agréments',
  description:
    "Les agréments qu'une association peut demander : jeunesse et éducation populaire, ESUS, éducation nationale, service civique, sport, environnement, santé, services à la personne. Ce que chacun ouvre, et où le demander.",
  alternates: { canonical: '/agrements' },
};

function formaterDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function AgrementsPage() {
  const total = FAMILLES_AGREMENTS.reduce((t, f) => t + f.agrements.length, 0);

  return (
    <>
      <Titre
        surtitre="Nos agréments"
        sousTitre={`${total} agréments qu'une association peut demander. Pour chacun : ce qu'il ouvre, pour qui c'est, où le demander. La page officielle fait foi.`}
      >
        Se faire <Accent>reconnaître</Accent> par l&apos;État.
      </Titre>

      {/* ------------------------------------------------------ tronc commun */}
      <section className={`${CARTE} mb-10 p-5 sm:p-6`}>
        <h2 className="text-xl font-extrabold text-[#1D1B5C]">{TRONC_COMMUN.titre}</h2>
        <p className="mt-1 max-w-[70ch] leading-relaxed text-[#3B3A66]">{TRONC_COMMUN.enUnMot}</p>
        <ul className="mt-4 grid gap-3 md:grid-cols-2">
          {TRONC_COMMUN.conditions.map((c, i) => (
            <li key={c.titre} className="flex gap-3 rounded-xl bg-[#F5F4FC] p-4">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#ECEBFC] text-sm font-extrabold text-[#4338CA]">{i + 1}</span>
              <span>
                <span className="block font-extrabold text-[#1D1B5C]">{c.titre}</span>
                <span className="mt-0.5 block text-sm leading-relaxed text-[#3B3A66]">{c.detail}</span>
              </span>
            </li>
          ))}
        </ul>
        <a href={TRONC_COMMUN.lien} target="_blank" rel="noopener" className={`${BTN_SECONDAIRE} mt-4`}>
          {TRONC_COMMUN.lienLibelle} ↗
        </a>
      </section>

      {/* --------------------------------------------------------- les fiches */}
      <div className="space-y-10">
        {FAMILLES_AGREMENTS.map((famille) => (
          <section key={famille.code} id={famille.code.toLowerCase()} className="scroll-mt-24">
            <h2 className="text-2xl font-extrabold tracking-tight text-[#1D1B5C]">{famille.titre}</h2>
            <p className="mt-1 max-w-[70ch] leading-relaxed text-[#3B3A66]">{famille.enUnMot}</p>

            <ul className="mt-4 grid gap-4 md:grid-cols-2">
              {famille.agrements.map((a) => (
                <li key={a.code} id={a.code} className="scroll-mt-24">
                  <article className={`${CARTE} flex h-full flex-col p-5`}>
                    <h3 className="text-lg font-extrabold leading-snug text-[#1D1B5C]">{a.nom}</h3>
                    <p className="mt-1 text-sm font-bold text-[#6B6A8A]">{a.par}</p>
                    <p className="mt-3 leading-relaxed text-[#3B3A66]">{a.ouvre}</p>

                    <dl className="mt-4 space-y-2 text-sm">
                      <div>
                        <dt className="font-extrabold text-[#1D1B5C]">Pour qui</dt>
                        <dd className="mt-0.5 leading-relaxed text-[#3B3A66]">{a.pourQui}</dd>
                      </div>
                      {a.duree ? (
                        <div>
                          <dt className="font-extrabold text-[#1D1B5C]">Durée</dt>
                          <dd className="mt-0.5 text-[#3B3A66]">{a.duree}</dd>
                        </div>
                      ) : null}
                      <div>
                        <dt className="font-extrabold text-[#1D1B5C]">Où le demander</dt>
                        <dd className="mt-0.5 leading-relaxed text-[#3B3A66]">{a.ou}</dd>
                      </div>
                    </dl>

                    <a href={a.lien} target="_blank" rel="noopener" className="mt-auto pt-4 text-sm font-bold text-[#4F46E5] underline underline-offset-4">
                      {a.lienLibelle} ↗
                    </a>
                  </article>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      {/* ------------------------------------------------------------ à savoir */}
      <section className="mt-10 grid gap-4 md:grid-cols-2">
        <Encart ton="info">
          <p className="text-lg font-extrabold">Un agrément n&apos;est pas une subvention</p>
          <p className="mt-1 leading-relaxed">
            Il ne garantit pas d&apos;argent : il ouvre des portes et prouve ton sérieux. Les demandes d&apos;argent se suivent dans ton espace.
          </p>
          <Link href="/espace/dossiers" className={`${BTN_SECONDAIRE} mt-4 !bg-white`}>
            Mes subventions et appels à projet →
          </Link>
        </Encart>
        <Encart ton="neutre">
          <p className="text-lg font-extrabold text-[#1D1B5C]">Relu le {formaterDate(AGREMENTS_VERIFIE_LE)}</p>
          <p className="mt-1 leading-relaxed">
            Les conditions et les procédures changent : c&apos;est toujours la page officielle de l&apos;administration qui fait foi. On n&apos;écrit ici aucune
            condition qui n&apos;en vienne pas.
          </p>
        </Encart>
      </section>
    </>
  );
}
