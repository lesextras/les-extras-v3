import Link from 'next/link';
import type { Metadata } from 'next';
import { Accent, BTN_PRIMAIRE, BTN_SECONDAIRE, CARTE, Encart, SousTitre, Titre, formaterDate } from '../_ui';
import { chargerChemin, TEINTES_PARTIE } from '../_chemin';
import { etapesFaitesSiConnecte } from '../_session';
import { AVANTAGES, FAMILLES_AVANTAGES, VERIFIE_LE } from '../_avantages';
import { CarteAvantage } from '../CarteAvantage';
import { FamillesAvantages } from '../FamillesAvantages';
import { KanbanChemin } from './KanbanChemin';
import { LIBELLES_COUT } from '../_avantages';

export const metadata: Metadata = {
  title: 'Le chemin, étape par étape',
  description:
    "Douze étapes pour créer et faire vivre ton association, avec les CERFA, puis tout ce à quoi elle a droit : logiciels offerts, FDVA, Service civique.",
  alternates: { canonical: '/chemin' },
};

const STYLE_FAMILLE: Record<string, { fond: string; bordure: string; pastille: string; texte: string; icone: string; detail: string }> = {
  OUTILS: {
    fond: 'bg-[#E3F5EC]',
    bordure: 'border-[#BFE6D2]',
    pastille: 'bg-[#1E9E6A]',
    texte: 'text-[#0F5F3E]',
    icone: 'M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18v3h3l6.3-6.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.4-.6-.6-2.4z',
    detail: 'Google, Canva, Microsoft, HelloAsso…',
  },
  DROITS: {
    fond: 'bg-[#FEF3E2]',
    bordure: 'border-[#F5D6A8]',
    pastille: 'bg-[#F5B400]',
    texte: 'text-[#7C3E06]',
    icone: 'M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6',
    detail: 'Reçus fiscaux, FDVA, agrément, chèque emploi.',
  },
  BRAS: {
    fond: 'bg-[#ECEBFC]',
    bordure: 'border-[#C7C4F2]',
    pastille: 'bg-[#4F46E5]',
    texte: 'text-[#4338CA]',
    icone: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8',
    detail: 'Service civique, bénévoles, un conseiller.',
  },
};

export default async function CheminPage() {
  const [chemin, connecte] = await Promise.all([chargerChemin(), etapesFaitesSiConnecte()]);
  const parties = chemin?.parties ?? [];
  const etapes = chemin?.etapes ?? [];
  const faites = connecte?.faites ?? new Set<string>();
  const prochaine = etapes.find((e) => !faites.has(e.slug)) ?? null;

  return (
    <>
      <Titre surtitre="Le chemin" sousTitre="Une étape après l'autre. Tu ouvres, tu fais, tu coches.">
        Douze étapes, <Accent>une subvention</Accent> au bout.
      </Titre>

      {!chemin ? (
        <Encart ton="attention">Le chemin ne se charge pas pour le moment. Recharge la page dans un instant.</Encart>
      ) : null}

      {/* ------------------------------------------------ où j'en suis */}
      {connecte ? (
        <div className="mb-8 rounded-2xl bg-[#1D1B5C] p-5 text-white sm:p-6">
          <div className="flex items-center justify-between gap-3 text-sm font-bold">
            <span className="text-[#C9C6F5]">{faites.size} / {etapes.length} faites</span>
            <span className="text-[#C9C6F5]">{etapes.length ? Math.round((faites.size / etapes.length) * 100) : 0} %</span>
          </div>
          <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-white/15" aria-hidden="true">
            <div className="h-full rounded-full bg-[#F5B400]" style={{ width: `${etapes.length ? (faites.size / etapes.length) * 100 : 0}%` }} />
          </div>
          {prochaine ? (
            <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#C9C6F5]">À faire maintenant · étape {prochaine.numero}</p>
                <p className="mt-1 text-xl font-extrabold">{prochaine.titre}</p>
              </div>
              <Link href={`/chemin/${prochaine.slug}`} className="inline-flex shrink-0 items-center justify-center rounded-xl bg-[#F5B400] px-5 py-3 font-extrabold text-[#1D1B5C] no-underline hover:bg-[#FFC933]">
                C&apos;est parti →
              </Link>
            </div>
          ) : (
            <p className="mt-5 text-xl font-extrabold">Le chemin est fini. Bravo !</p>
          )}
        </div>
      ) : (
        <div className={`${CARTE} mb-8 flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between`}>
          <p className="font-extrabold text-[#1D1B5C]">Crée ton espace pour cocher les étapes. Gratuit.</p>
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

      {/* ------------------------------------------------ le chemin : en colonnes une fois connecté, en une ligne sinon */}
      {connecte && chemin ? (
        <KanbanChemin
          etapes={etapes.map((e) => ({ numero: e.numero, slug: e.slug, titre: e.titre, partie: e.partie }))}
          parties={parties.map((p) => ({ code: p.code, titre: p.titre }))}
          faites={[...faites]}
          verifiees={[...connecte.verifiees]}
        />
      ) : (
        <div id="partie-1" className="scroll-mt-24">
          {parties.map((p) => {
            const teinte = TEINTES_PARTIE[p.code];
            const siennes = etapes.filter((e) => e.partie === p.code);
            const faitesIci = siennes.filter((e) => faites.has(e.slug)).length;
            return (
              <section key={p.code} id={`partie-${p.numero}`} className="mb-8 scroll-mt-24">
                <h2 className="mb-3 flex items-center gap-2 text-sm font-extrabold uppercase tracking-[0.12em]">
                  <span className={`h-2.5 w-2.5 rounded-full ${teinte.pastille}`} aria-hidden="true" />
                  <span className={teinte.texte}>{p.titre}</span>
                  {p.code === 'SUBVENTION' ? <span className="rounded-full bg-[#F5B400] px-2 py-0.5 text-[10px] text-[#1D1B5C]">Le but</span> : null}
                  {connecte ? <span className="ml-auto text-[#6B6A8A]">{faitesIci} / {siennes.length}</span> : null}
                </h2>

                <ol className="relative ml-5 border-l-2 border-[#E6E4F3]">
                  {siennes.map((e) => {
                    const faite = faites.has(e.slug);
                    const estProchaine = Boolean(connecte) && prochaine?.slug === e.slug;
                    return (
                      <li key={e.slug} className="relative pb-2 pl-8 last:pb-0">
                        <span
                          className={`absolute -left-[17px] top-3 flex h-8 w-8 items-center justify-center rounded-full text-sm font-extrabold ring-4 ring-[#F5F4FC] ${
                            faite ? 'bg-[#1E9E6A] text-white' : estProchaine ? 'bg-[#4F46E5] text-white' : 'border-2 border-[#D9D6EE] bg-white text-[#6B6A8A]'
                          }`}
                          aria-label={faite ? 'Faite' : undefined}
                        >
                          {faite ? '✓' : e.numero}
                        </span>
                        <Link
                          href={`/chemin/${e.slug}`}
                          className={`group flex items-center gap-3 rounded-xl px-4 py-3 no-underline transition ${
                            estProchaine
                              ? 'border-2 border-[#4F46E5] bg-white shadow-[0_12px_28px_-20px_rgba(29,27,92,0.8)]'
                              : 'hover:bg-white'
                          }`}
                        >
                          <span className="min-w-0 flex-1">
                            <span className={`block font-extrabold leading-snug ${faite ? 'text-[#6B6A8A]' : 'text-[#1D1B5C]'} group-hover:text-[#4F46E5]`}>{e.titre}</span>
                            {estProchaine ? <span className="mt-0.5 block text-sm text-[#6B6A8A]">{e.enUnMot}</span> : null}
                          </span>
                          <span className={`shrink-0 text-sm font-bold ${estProchaine ? 'rounded-lg bg-[#4F46E5] px-3 py-1.5 text-white' : 'text-[#9A99B5] group-hover:text-[#4F46E5]'}`}>
                            {estProchaine ? 'Ouvrir' : faite ? 'Revoir' : '→'}
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ol>
              </section>
            );
          })}
        </div>
      )}

      {/* ------------------------------------------------ ce à quoi j'ai droit */}
      <section id="droits" className="mt-16 scroll-mt-24">
        <div className="rounded-2xl border border-[#C7C4F2] bg-[#ECEBFC] p-5 sm:p-6">
          <p className="text-sm font-bold uppercase tracking-[0.12em] text-[#4338CA]">Après le chemin</p>
          <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-[#1D1B5C]">Ce à quoi ton association a droit</h2>
          <p className="mt-2 text-[#1D1B5C]">{AVANTAGES.length} avantages · il te faut le récépissé, les statuts et le RIB.</p>
        </div>

        {/* Les trois familles : un clic déplie leurs avantages (FamillesAvantages). */}
        <FamillesAvantages
          familles={FAMILLES_AVANTAGES.map((f) => {
            const st = STYLE_FAMILLE[f.code] ?? STYLE_FAMILLE.BRAS;
            return {
              code: f.code,
              titre: f.titre,
              ...st,
              cartes: f.avantages.map((a) => ({
                code: a.code,
                nom: a.nom,
                par: a.par,
                gain: a.gain,
                cout: LIBELLES_COUT[a.cout],
                ton: a.cout === 'PUBLIC' ? 'bg-[#ECEBFC] text-[#4338CA]' : a.cout === 'REMISE' ? 'bg-[#FEF3E2] text-[#7C3E06]' : 'bg-[#E3F5EC] text-[#0F5F3E]',
                fiche: <CarteAvantage avantage={a} ouvert />,
              })),
            };
          })}
        />

        <section className="mt-10 grid gap-4 md:grid-cols-2">
          <Encart ton="info">
            <p className="text-lg font-extrabold">Être trouvé sur internet</p>
            <Link href="/presence-en-ligne" className={`${BTN_SECONDAIRE} mt-4 !bg-white`}>
              Être visible en ligne →
            </Link>
          </Encart>
          <Encart ton="neutre">
            <p className="text-lg font-extrabold text-[#1D1B5C]">Vérifié le {formaterDate(VERIFIE_LE)}</p>
            <p className="mt-1">Le site de l&apos;organisme fait foi.</p>
          </Encart>
        </section>
      </section>
    </>
  );
}
