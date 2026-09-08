import Link from 'next/link';
import type { Metadata } from 'next';
import { apiAcademie, sessionAcademie } from '../_session';
import { BTN_DISCRET, CARTE, Encart, Pastille, Titre } from '../_ui';

export const metadata: Metadata = { title: 'Mes formateurs', robots: { index: false, follow: false } };

interface Formateur {
  userId: string;
  name: string;
  job: string | null;
  skills: string[];
}

/**
 * `/academie/formateurs` — QUI ANIME, ET AVEC QUELLES COMPÉTENCES.
 *
 * L'indicateur 21 du référentiel demande de prouver la compétence de celles et
 * ceux qui interviennent. La preuve tient en deux lignes par personne : son
 * métier, ses compétences. Personne n'est créé ici : on invite, la personne
 * crée son compte et complète elle-même son profil.
 */
export default async function FormateursPage() {
  const s = await sessionAcademie('/academie/formateurs');
  const { data, error } = await apiAcademie<Formateur[]>(s, '/formations/internal-trainers');

  if (!data) {
    return (
      <>
        <Titre surtitre="Critère 5 du référentiel national qualité">Mes formateurs</Titre>
        <Encart ton="attention">{error ?? 'La liste ne se charge pas pour le moment.'}</Encart>
      </>
    );
  }

  const liste = Array.isArray(data) ? data : [];
  const incomplets = liste.filter((f) => !f.job?.trim() || !f.skills?.length);

  return (
    <>
      <Titre
        surtitre="Critère 5 du référentiel national qualité"
        sousTitre="Celles et ceux qui interviennent pour ton académie, et ce qui prouve leur compétence : leur métier et leurs compétences déclarées."
      >
        Mes formateurs
      </Titre>

      {liste.length === 0 ? (
        <div className="mb-6">
          <Encart ton="attention">
            Personne d&apos;autre que toi n&apos;intervient encore. Invite un formateur par son adresse e-mail : il
            crée son compte lui-même, renseigne son métier et ses compétences, et apparaît alors ici.
          </Encart>
        </div>
      ) : incomplets.length ? (
        <div className="mb-6">
          <Encart ton="attention">
            <span className="font-extrabold">
              {incomplets.length} formateur{incomplets.length > 1 ? 's' : ''}
            </span>{' '}
            sans métier ni compétences renseignés. En audit, c&apos;est ce qui manque pour prouver l&apos;indicateur
            21. Chacun complète son profil lui-même : préviens-les, on ne remplit pas la fiche à leur place.
          </Encart>
        </div>
      ) : (
        <div className="mb-6">
          <Encart ton="ok">
            Chaque personne qui intervient a un métier et des compétences déclarés. L&apos;indicateur 21 est couvert.
          </Encart>
        </div>
      )}

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <h2 className="text-[19px] font-extrabold text-[#12312A]">
          L&apos;équipe pédagogique <span className="text-[#5E7A6E]">({liste.length})</span>
        </h2>
        <Link href="/academie/droits-acces" className={`${BTN_DISCRET} ml-auto`}>
          Inviter un formateur
        </Link>
      </div>

      <ul className="grid gap-3">
        {liste.map((f) => {
          const complet = Boolean(f.job?.trim()) && (f.skills?.length ?? 0) > 0;
          return (
            <li key={f.userId} className={`${CARTE} p-4 sm:p-5`}>
              <div className="flex flex-wrap items-start gap-3">
                <div className="min-w-[220px] flex-1">
                  <p className="text-[16px] font-extrabold text-[#12312A]">{f.name}</p>
                  <p className={`text-[15px] ${f.job ? 'text-[#334A42]' : 'text-[#8A1B3D]'}`}>
                    {f.job || 'Métier non renseigné'}
                  </p>
                </div>
                {complet ? <Pastille ton="ok">Compétences déclarées</Pastille> : <Pastille ton="attention">À compléter</Pastille>}
              </div>

              {f.skills?.length ? (
                <ul className="mt-3 flex flex-wrap gap-2">
                  {f.skills.map((c) => (
                    <li key={c} className="rounded-full bg-[#E3F5EC] px-3 py-1 text-[13px] font-bold text-[#0F5F3E]">
                      {c}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 rounded-xl bg-[#FEF3E2] px-4 py-3 text-[14px] leading-relaxed text-[#7C3E06]">
                  Aucune compétence déclarée. C&apos;est à cette personne de les renseigner depuis son profil.
                </p>
              )}
            </li>
          );
        })}
      </ul>

      <section className={`${CARTE} mt-8 p-5`}>
        <h2 className="text-[18px] font-extrabold text-[#12312A]">Ce que l&apos;auditeur regarde</h2>
        <ul className="mt-2 grid gap-2 text-[15px] leading-relaxed text-[#334A42]">
          <li>
            <span className="font-bold">Indicateur 21</span> — la compétence des formateurs : un métier, des
            compétences, et de quoi les étayer si on demande.
          </li>
          <li>
            <span className="font-bold">Indicateur 22</span> — leur maintien à niveau : c&apos;est ta veille métier
            qui le montre.{' '}
            <Link href="/academie/veille" className="font-bold underline underline-offset-2">
              Ma veille
            </Link>
          </li>
          <li>
            <span className="font-bold">Indicateur 26</span> — le référent handicap : une personne nommée.{' '}
            <Link href="/academie/parametres" className="font-bold underline underline-offset-2">
              Paramètres
            </Link>
          </li>
        </ul>
      </section>
    </>
  );
}
