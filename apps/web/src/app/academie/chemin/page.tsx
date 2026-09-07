import Link from 'next/link';
import type { Metadata } from 'next';
import { chargerChemin, TEMPS, TEINTES } from '../_chemin';
import { academieConnectee, apiAcademie, sessionAcademie } from '../_session';
import { Accent, CARTE, CARTE_VIVE, Encart, Pastille, SousTitre, Titre } from '../_ui';
import type { EspaceAcademie } from '../_types';

export const metadata: Metadata = {
  title: 'Le chemin',
  description:
    "Douze étapes, de l'idée à l'organisme de formation certifié Qualiopi et finançable : ce qu'il faut faire, dans l'ordre où ça se pose vraiment.",
};

/**
 * LE CHEMIN D'UNE ACADÉMIE.
 *
 * Public : les douze étapes, groupées en trois temps. Connectée : les mêmes,
 * avec ce qui est déjà fait — et les étapes que l'espace a cochées tout seul
 * parce que la donnée est arrivée.
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

  return (
    <>
      <Titre
        surtitre={nom ? nom : 'Gratuit, sans compte'}
        sousTitre={
          nom
            ? `${faites.size} étape${faites.size > 1 ? 's' : ''} sur ${total}. Les étapes cochées d'elles-mêmes le sont parce que la donnée est arrivée dans ta fiche.`
            : "Dans l'ordre où ça se pose vraiment — y compris l'étape que personne ne voit venir : il faut une première convention signée avant de pouvoir déclarer son activité."
        }
      >
        Le <Accent>chemin</Accent> d&apos;une académie
      </Titre>

      {TEMPS.map((t) => {
        const etapes = chemin.etapes.filter((e) => e.numero >= t.de && e.numero <= t.a);
        const teinte = TEINTES[t.titre];
        return (
          <section key={t.titre} className="mb-10">
            <div className={`mb-4 rounded-2xl border ${teinte.bord} ${teinte.fond} px-5 py-4`}>
              <h2 className={`text-lg font-extrabold ${teinte.texte}`}>
                {t.titre} <span className="font-bold opacity-70">· étapes {t.de} à {t.a}</span>
              </h2>
              <p className={`mt-1 text-sm leading-relaxed ${teinte.texte}`}>{t.resume}</p>
            </div>

            <ol className="space-y-3">
              {etapes.map((e) => {
                const estFaite = faites.has(e.slug);
                return (
                  <li key={e.slug}>
                    <Link href={`/academie/chemin/${e.slug}`} className={`${CARTE_VIVE} flex items-start gap-4 p-4 no-underline sm:p-5`}>
                      <span
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-extrabold ${
                          estFaite ? 'bg-[#1E9E6A] text-white' : `${teinte.pastille} text-white`
                        }`}
                      >
                        {estFaite ? '✓' : e.numero}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-2">
                          <span className="font-extrabold text-[#12312A]">{e.titre}</span>
                          {automatiques.has(e.slug) ? <Pastille ton="ok">cochée d&apos;elle-même</Pastille> : null}
                        </span>
                        <span className="mt-1 block text-sm leading-relaxed text-[#334A42]">{e.resume}</span>
                        <span className="mt-2 block text-sm font-bold text-[#5E7A6E]">
                          Pour passer à la suivante : <span className="font-bold text-[#0F5F3E]">{e.pourPasser}</span>
                        </span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ol>
          </section>
        );
      })}

      {nom ? null : (
        <section className={`${CARTE} p-5 sm:p-7`}>
          <SousTitre>Suivre ce chemin avec ton organisme</SousTitre>
          <p className="max-w-[62ch] leading-relaxed">
            En ouvrant un espace, les étapes se cochent toutes seules à mesure que la donnée arrive : ton SIRET, ton numéro de
            déclaration, ton référent handicap, la date de ton audit. Et tes preuves Qualiopi restent au même endroit, prêtes
            pour le jour où l&apos;auditeur les demande.
          </p>
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
