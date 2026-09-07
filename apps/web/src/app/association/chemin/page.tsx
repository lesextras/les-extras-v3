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
        sousTitre="Une étape à la fois. Chaque étape te dit pourquoi, comment faire, et te donne les papiers à remplir. Tu peux cocher ce qui est déjà fait."
      >
        Douze étapes, <Accent>trois parties</Accent>, une subvention au bout.
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
            <span className="font-extrabold text-[#1D1B5C]">Tu veux cocher les étapes au fur et à mesure ?</span> Crée l&apos;espace
            de ton association : il est gratuit, et il retient où tu en es.
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
                <p className="mt-1 text-sm text-[#6B6A8A]">
                  <span className="font-bold">À la fin : </span>
                  {p.resultat}
                </p>
              </div>

              <ol className="mt-3 space-y-3">
                {siennes.map((e) => {
                  const faite = faites.has(e.slug);
                  const estProchaine = prochaine?.slug === e.slug;
                  return (
                    <li key={e.slug}>
                      <Link
                        href={`/chemin/${e.slug}`}
                        className={`${CARTE} group flex items-start gap-4 p-5 no-underline transition hover:border-[#4F46E5] ${estProchaine && connecte ? 'border-2 border-[#4F46E5]' : ''}`}
                      >
                        <span
                          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-lg font-extrabold ${
                            faite ? 'bg-[#1E9E6A] text-white' : `${teinte.fond} ${teinte.texte}`
                          }`}
                          aria-label={faite ? 'Étape faite' : undefined}
                        >
                          {faite ? '✓' : e.numero}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex flex-wrap items-center gap-2">
                            <span className="text-lg font-extrabold leading-snug text-[#1D1B5C] group-hover:text-[#4F46E5]">{e.titre}</span>
                            {estProchaine && connecte ? (
                              <span className="rounded-full bg-[#ECEBFC] px-2 py-0.5 text-[11px] font-extrabold uppercase tracking-wide text-[#4338CA]">Prochaine</span>
                            ) : null}
                          </span>
                          <span className="mt-1 block leading-relaxed">{e.enUnMot}</span>
                          <span className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-[#6B6A8A]">
                            <span><span className="font-bold">Durée :</span> {e.dureeEstimee.split('.')[0]}.</span>
                            <span><span className="font-bold">Coût :</span> {e.cout}</span>
                            {e.documents.length ? (
                              <span>
                                <span className="font-bold">Documents :</span> {e.documents.length}
                              </span>
                            ) : null}
                          </span>
                        </span>
                        <span className="hidden shrink-0 self-center text-2xl text-[#C7C4F2] group-hover:text-[#4F46E5] sm:block">›</span>
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
