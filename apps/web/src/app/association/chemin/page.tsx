import Link from 'next/link';
import type { Metadata } from 'next';
import { Accent, BTN_PRIMAIRE, BTN_SECONDAIRE, CARTE, Encart, Titre } from '../_ui';
import { chargerChemin, TEINTES_PARTIE } from '../_chemin';
import { etapesFaitesSiConnecte } from '../_session';

export const metadata: Metadata = {
  title: 'Le chemin, étape par étape',
  description:
    "Faire naître ton association, la faire vivre, demander une subvention : douze étapes expliquées simplement, avec les formulaires CERFA et des documents exemples.",
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
        sousTitre="À chaque étape : tu déposes tes papiers, tu les fabriques sur place, et tu coches."
      >
        Douze étapes, <Accent>une subvention</Accent> au bout.
      </Titre>

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
    </>
  );
}
