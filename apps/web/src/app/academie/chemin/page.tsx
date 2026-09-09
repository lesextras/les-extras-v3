import Link from 'next/link';
import type { Metadata } from 'next';
import { chargerChemin, TEMPS, TEINTES } from '../_chemin';
import { academieConnectee, apiAcademie, sessionAcademie } from '../_session';
import { Accent, CARTE, Encart, SousTitre, Titre } from '../_ui';
import type { EspaceAcademie } from '../_types';

export const metadata: Metadata = {
  title: 'Le chemin',
  description:
    "Douze étapes, de l'idée à l'organisme de formation certifié Qualiopi et finançable : ce qu'il faut faire, dans l'ordre où ça se pose vraiment.",
};

/**
 * LE CHEMIN D'UNE ACADÉMIE — refondu le 9/09/2026.
 *
 * ⚠ CE QUI CHANGE, ET POURQUOI. C'était une liste verticale de douze lignes,
 * chacune portant trois phrases. On ne lit pas ça : on le fait défiler. Le
 * chemin de l'association, lui, se lit d'un coup d'œil parce qu'il est en
 * cartes — une carte, un numéro, un titre, une ligne. Même grille ici, mêmes
 * repères, et le texte réduit à ce qui se lit debout : ce que c'est, et ce
 * qu'il faut pour passer à la suivante.
 *
 * Les phrases longues ont été remplacées par des repères courts. Une personne
 * qui découvre son parcours administratif a besoin de savoir où elle en est,
 * pas d'un paragraphe par étape — le détail vit dans la page de l'étape.
 */
export default async function CheminPage() {
  const chemin = await chargerChemin();
  if (!chemin) return <Encart ton="attention">Le chemin ne se charge pas pour le moment. Réessaie dans un instant.</Encart>;

  // Ce que l'académie connectée a déjà fait. Sans compte, la liste reste neutre.
  let faites = new Set<string>();
  let automatiques = new Set<string>();
  let nom: string | null = null;
  if (await academieConnectee()) {
    const s = await sessionAcademie('/academie/chemin');
    const { data } = await apiAcademie<EspaceAcademie>(s, '/academie/espace');
    if (data) {
      faites = new Set(data.chemin.etapes.filter((e) => e.faite).map((e) => e.slug));
      automatiques = new Set(data.chemin.etapes.filter((e) => e.automatique).map((e) => e.slug));
      nom = data.academie.nom;
    }
  }

  const total = chemin.etapes.length;
  const prochaine = chemin.etapes.find((e) => !faites.has(e.slug)) ?? null;

  return (
    <>
      <Titre surtitre={nom ?? 'Gratuit, sans compte'} sousTitre="Douze étapes, trois temps. Une carte par étape.">
        Le <Accent>chemin</Accent> d&apos;une académie
      </Titre>

      {/* Où j'en suis — la seule chose qu'on cherche en arrivant ici. */}
      <div className={`${CARTE} mb-8 flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between`}>
        {nom ? (
          <>
            <div>
              <p className="text-sm font-bold text-[#5E7A6E]">{nom}</p>
              <p className="text-xl font-extrabold text-[#12312A]">
                {faites.size} étape{faites.size > 1 ? 's' : ''} sur {total}
              </p>
            </div>
            {prochaine ? (
              <Link
                href={`/academie/chemin/${prochaine.slug}`}
                className="inline-flex shrink-0 items-center justify-center rounded-xl bg-[#1E9E6A] px-5 py-3 text-base font-bold text-white no-underline transition hover:bg-[#17845A]"
              >
                Continuer : étape {prochaine.numero} →
              </Link>
            ) : (
              <span className="font-bold text-[#1E9E6A]">Le chemin est fini. Bravo !</span>
            )}
          </>
        ) : (
          <>
            <p className="max-w-[60ch] leading-relaxed">
              <span className="font-extrabold text-[#12312A]">Ouvre ton espace pour cocher les étapes.</span> Gratuit. Certaines
              se cochent d&apos;elles-mêmes dès que la donnée arrive.
            </p>
            <Link
              href="/academie/inscription"
              className="inline-flex shrink-0 items-center justify-center rounded-xl bg-[#1E9E6A] px-5 py-3 text-base font-bold text-white no-underline transition hover:bg-[#17845A]"
            >
              Ouvrir mon espace
            </Link>
          </>
        )}
      </div>

      <div className="space-y-10">
        {TEMPS.map((t, i) => {
          const etapes = chemin.etapes.filter((e) => e.numero >= t.de && e.numero <= t.a);
          const teinte = TEINTES[t.titre];
          const faitesIci = etapes.filter((e) => faites.has(e.slug)).length;
          return (
            <section key={t.titre} className="scroll-mt-24">
              <div className={`rounded-2xl border ${teinte.bord} ${teinte.fond} p-5 sm:p-6`}>
                <div className="flex flex-wrap items-center gap-3">
                  <span className={`flex h-10 w-10 items-center justify-center rounded-full text-lg font-extrabold text-white ${teinte.pastille}`}>
                    {i + 1}
                  </span>
                  <h2 className={`text-2xl font-extrabold tracking-tight ${teinte.texte}`}>{t.titre}</h2>
                  <span className={`rounded-full bg-white/70 px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wide ${teinte.texte}`}>
                    étapes {t.de} à {t.a}
                  </span>
                  {nom ? (
                    <span className="ml-auto text-sm font-bold text-[#5E7A6E]">
                      {faitesIci} / {etapes.length}
                    </span>
                  ) : null}
                </div>
                <p className={`mt-2 max-w-[70ch] text-sm leading-relaxed ${teinte.texte}`}>{t.resume}</p>
              </div>

              <ol className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {etapes.map((e) => {
                  const faite = faites.has(e.slug);
                  const estProchaine = prochaine?.slug === e.slug;
                  return (
                    <li key={e.slug} className="h-full">
                      <Link
                        href={`/academie/chemin/${e.slug}`}
                        className={`${CARTE} group flex h-full flex-col p-5 no-underline transition hover:-translate-y-0.5 hover:border-[#1E9E6A] hover:shadow-[0_12px_28px_-20px_rgba(15,95,62,0.8)] ${
                          estProchaine && nom ? 'border-2 border-[#1E9E6A]' : ''
                        }`}
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
                          {faite && automatiques.has(e.slug) ? (
                            <span className="rounded-full bg-[#E3F5EC] px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wide text-[#0F5F3E]">
                              Auto
                            </span>
                          ) : faite ? (
                            <span className="rounded-full bg-[#E3F5EC] px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wide text-[#0F5F3E]">
                              Fait
                            </span>
                          ) : estProchaine && nom ? (
                            <span className="rounded-full bg-[#DDEBE4] px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wide text-[#0F5F3E]">
                              Prochaine
                            </span>
                          ) : null}
                        </span>
                        <span className="mt-3 block text-lg font-extrabold leading-snug text-[#12312A] group-hover:text-[#0F5F3E]">
                          {e.titre}
                        </span>
                        <span className="mt-1 block text-sm leading-relaxed text-[#5E7A6E]">{e.resume}</span>
                        <span className="mt-3 block rounded-lg bg-[#F4F9F6] px-3 py-2 text-[13px] leading-snug text-[#334A42]">
                          <span className="font-bold text-[#0F5F3E]">Pour passer :</span> {e.pourPasser}
                        </span>
                        <span className="mt-auto pt-4 text-sm font-bold text-[#1E9E6A]">Ouvrir l&apos;étape →</span>
                      </Link>
                    </li>
                  );
                })}
              </ol>
            </section>
          );
        })}
      </div>

      {nom ? null : (
        <section className={`${CARTE} mt-10 p-5 sm:p-7`}>
          <SousTitre>Suivre ce chemin avec ton organisme</SousTitre>
          <ul className="mt-2 space-y-1.5 text-[15px] leading-relaxed text-[#334A42]">
            <li>· Les étapes se cochent seules quand la donnée arrive : SIRET, numéro de déclaration, référent handicap, date d&apos;audit.</li>
            <li>· Tes preuves Qualiopi restent au même endroit, prêtes pour l&apos;auditeur.</li>
            <li>· Gratuit, et tu gardes la main sur tout.</li>
          </ul>
          <Link
            href="/academie/inscription"
            className="mt-4 inline-flex items-center justify-center rounded-xl bg-[#1E9E6A] px-5 py-3 text-base font-bold text-white no-underline transition hover:bg-[#17845A]"
          >
            Ouvrir mon espace, gratuit
          </Link>
        </section>
      )}
    </>
  );
}
