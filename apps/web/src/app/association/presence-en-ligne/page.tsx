import Link from 'next/link';
import type { Metadata } from 'next';
import { Accent, BTN_SECONDAIRE, CARTE, Encart, SousTitre, Titre, formaterDate } from '../_ui';
import { ETAPES_PRESENCE, VERIFIE_LE } from '../_avantages';
import { CarteAvantage } from '../CarteAvantage';

export const metadata: Metadata = {
  title: 'Être visible en ligne',
  description:
    "Fiche Google, HelloAsso, réseaux sociaux, adresses e-mail, site, lettre d'information : dix étapes dans l'ordre, avec la marche à suivre et les liens.",
  alternates: { canonical: '/presence-en-ligne' },
};

const CASCADE = ['stagger-1', 'stagger-2', 'stagger-3', 'stagger-4'];

export default function PresenceEnLignePage() {
  const total = ETAPES_PRESENCE.length;

  return (
    <>
      <Titre
        surtitre="Être visible en ligne"
        sousTitre="Quand une famille, un partenaire ou un financeur tape ton nom, il doit te trouver, comprendre en dix secondes ce que vous faites, et pouvoir adhérer ou donner. Dix étapes, dans l'ordre. Tout est gratuit, sauf le nom de domaine."
      >
        Qu&apos;on te trouve, et qu&apos;on <Accent>comprenne</Accent>.
      </Titre>

      {/* ---------------------------------------------------------- le parcours */}
      <section className={`${CARTE} animate-fade-in-up p-5 sm:p-6`}>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="text-sm font-bold uppercase tracking-[0.12em] text-[#6B6A8A]">Le parcours, en {total} étapes</p>
          <p className="text-sm text-[#6B6A8A]">Une par semaine, c&apos;est très bien.</p>
        </div>
        <ol className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          {ETAPES_PRESENCE.map((e) => (
            <li key={e.code}>
              <a href={`#${e.code}`} className="flex h-full items-start gap-2 rounded-xl bg-[#F5F4FC] p-3 no-underline transition hover:bg-[#ECEBFC]">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#1D1B5C] text-xs font-extrabold text-white">{e.numero}</span>
                <span>
                  <span className="block text-sm font-extrabold leading-snug text-[#1D1B5C]">{e.nom}</span>
                  <span className="block text-xs text-[#6B6A8A]">{e.duree}</span>
                </span>
              </a>
            </li>
          ))}
        </ol>
      </section>

      {/* ------------------------------------------------------------- étapes */}
      <section className="mt-10">
        <SousTitre>Étape par étape</SousTitre>
        <div className="space-y-4">
          {ETAPES_PRESENCE.map((e, i) => (
            <div key={e.code} className={i < CASCADE.length ? `animate-fade-in-up ${CASCADE[i]}` : undefined}>
              <CarteAvantage avantage={e} numero={e.numero} duree={e.duree} ouvert={i === 0} />
            </div>
          ))}
        </div>
      </section>

      {/* ---------------------------------------------------------------- suite */}
      <section className="mt-12 grid gap-4 md:grid-cols-2">
        <Encart ton="info">
          <p className="text-lg font-extrabold">Les outils de cette page sont offerts aux associations</p>
          <p className="mt-1 leading-relaxed">
            Google, Canva, Microsoft, HelloAsso, Brevo : la fiche complète de chacun, avec ce qu&apos;il faut envoyer et le lien pour demander, est dans « Ce à quoi j&apos;ai droit ».
          </p>
          <Link href="/avantages" className={`${BTN_SECONDAIRE} mt-4 !bg-white`}>
            Ce à quoi j&apos;ai droit →
          </Link>
        </Encart>
        <Encart ton="neutre">
          <p className="text-lg font-extrabold text-[#1D1B5C]">Pour aller plus loin</p>
          <p className="mt-1 leading-relaxed">
            Faire vivre ces pages chaque semaine, c&apos;est un métier : Toulali forme au community management avec un simple téléphone, et une association peut faire financer la formation.
          </p>
          <p className="mt-3 text-sm text-[#6B6A8A]">
            Liens relus le {formaterDate(VERIFIE_LE)}.{' '}
            <Link href="/se-former" className="font-bold text-[#4F46E5] underline underline-offset-4">
              Se former →
            </Link>
          </p>
        </Encart>
      </section>
    </>
  );
}
