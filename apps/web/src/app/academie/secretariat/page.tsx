import Link from 'next/link';
import type { Metadata } from 'next';
import { apiAcademie, sessionAcademie } from '../_session';
import { BTN_DISCRET, CARTE, Encart, Pastille, Titre, formaterDate } from '../_ui';
import type { Session } from '../sessions/Sessions';

export const metadata: Metadata = { title: 'Mon secrétariat', robots: { index: false, follow: false } };

/** Les pièces qu'une session doit laisser derrière elle, dans l'ordre. */
const PIECES = [
  {
    code: 'convention',
    titre: 'La convention ou le contrat',
    quand: 'Avant le premier jour',
    quoi: "Convention avec l'employeur ou le financeur, contrat quand la personne paie elle-même. Elle porte l'intitulé, les dates, la durée, le prix et les objectifs.",
  },
  {
    code: 'convocation',
    titre: 'La convocation',
    quand: 'Une semaine avant',
    quoi: "Date, horaires, lieu, accès, et le nom du référent handicap à joindre si un aménagement est nécessaire.",
  },
  {
    code: 'programme',
    titre: 'Le programme remis',
    quand: 'Avant le premier jour',
    quoi: 'Objectifs, public visé, prérequis, déroulé, durée, modalités d’évaluation. Le même que celui du catalogue.',
  },
  {
    code: 'emargement',
    titre: "La feuille d'émargement",
    quand: 'Chaque demi-journée',
    quoi: 'Signée par chaque apprenant et par le formateur, demi-journée par demi-journée. C’est la pièce la plus regardée en contrôle.',
  },
  {
    code: 'chaud',
    titre: "L'évaluation à chaud",
    quand: 'Le dernier jour',
    quoi: 'Ce que la personne en a pensé, à la fin de la session, tant qu’elle est là.',
  },
  {
    code: 'attestation',
    titre: 'L’attestation de fin de formation',
    quand: 'Dans les jours qui suivent',
    quoi: 'Remise à chaque personne : intitulé, dates, durée, objectifs, résultats de l’évaluation des acquis.',
  },
  {
    code: 'froid',
    titre: "L'évaluation à froid",
    quand: 'Trois à six mois après',
    quoi: 'Ce que la formation a changé dans le travail. C’est l’indicateur 11, et c’est celui qu’on oublie.',
  },
];

/**
 * `/academie/secretariat` — LE PAPIER, DANS L'ORDRE.
 *
 * Une session laisse derrière elle sept pièces. Elles ne se produisent pas
 * toutes le même jour, et c'est en ratant l'ordre qu'on se retrouve à courir
 * après une signature six mois plus tard. Cet écran remet la suite à sa place,
 * session par session.
 */
export default async function SecretariatPage() {
  const s = await sessionAcademie('/academie/secretariat');
  const { data, error } = await apiAcademie<Session[]>(s, '/formations/mes-sessions');

  const toutes = Array.isArray(data) ? data : [];
  const maintenant = Date.now();
  const aVenir = toutes
    .filter((x) => new Date(x.startDate).getTime() >= maintenant)
    .sort((a, b) => +new Date(a.startDate) - +new Date(b.startDate));
  const recentes = toutes
    .filter((x) => new Date(x.startDate).getTime() < maintenant)
    .sort((a, b) => +new Date(b.startDate) - +new Date(a.startDate))
    .slice(0, 8);

  return (
    <>
      <Titre
        surtitre="Le papier, dans l'ordre"
        sousTitre="Une session laisse sept pièces derrière elle. Elles ne se font pas le même jour : voici ce qui se prépare avant, ce qui se signe pendant, et ce qui se classe après."
      >
        Mon secrétariat
      </Titre>

      {!data ? (
        <div className="mb-6">
          <Encart ton="attention">{error ?? 'Les sessions ne se chargent pas pour le moment.'}</Encart>
        </div>
      ) : null}

      {/* ------------------------------------------------ ce qui arrive */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <h2 className="text-[19px] font-extrabold text-[#12312A]">
          À préparer <span className="text-[#5E7A6E]">({aVenir.length})</span>
        </h2>
        <Link href="/academie/sessions" className={`${BTN_DISCRET} ml-auto`}>
          Mes sessions
        </Link>
      </div>

      {aVenir.length ? (
        <ul className="mb-9 grid gap-3">
          {aVenir.map((x) => {
            const jours = Math.ceil((new Date(x.startDate).getTime() - maintenant) / 86400000);
            const inscrits = x._count?.inscriptions ?? 0;
            return (
              <li key={x.id} className={`${CARTE} p-4 sm:p-5`}>
                <div className="flex flex-wrap items-start gap-3">
                  <div className="min-w-[220px] flex-1">
                    <p className="text-[16px] font-extrabold text-[#12312A]">
                      {x.title?.trim() || x.formation?.title || 'Session sans intitulé'}
                    </p>
                    <p className="text-[14px] text-[#5E7A6E]">
                      {formaterDate(x.startDate)}
                      {x.location ? ` · ${x.location}` : ''}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Pastille ton={jours <= 7 ? 'attention' : 'neutre'}>
                      {jours <= 0 ? "C'est aujourd'hui" : `Dans ${jours} jour${jours > 1 ? 's' : ''}`}
                    </Pastille>
                    <Pastille ton="neutre">
                      {inscrits} inscrit{inscrits > 1 ? 's' : ''}
                    </Pastille>
                  </div>
                </div>
                <p className="mt-3 rounded-xl bg-[#F2F7F5] px-4 py-3 text-[14px] leading-relaxed text-[#334A42]">
                  {jours <= 7
                    ? 'Convention signée, convocations envoyées, programme remis, feuille d’émargement imprimée.'
                    : 'La convention et le programme se préparent dès maintenant ; les convocations partent une semaine avant.'}
                  {!x.location ? ' Le lieu manque encore : sans adresse, la convocation ne peut pas partir.' : ''}
                </p>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="mb-9 text-[15px] leading-relaxed text-[#5E7A6E]">
          Aucune session à venir. Dès qu&apos;une date est posée, elle apparaît ici avec ce qu&apos;il faut préparer.
        </p>
      )}

      {/* ------------------------------------------------- ce qui suit */}
      {recentes.length ? (
        <>
          <h2 className="mb-4 text-[19px] font-extrabold text-[#12312A]">
            À classer <span className="text-[#5E7A6E]">({recentes.length})</span>
          </h2>
          <ul className="mb-9 grid gap-3">
            {recentes.map((x) => {
              const jours = Math.floor((maintenant - new Date(x.endDate ?? x.startDate).getTime()) / 86400000);
              const froidDu = jours >= 90;
              return (
                <li key={x.id} className={`${CARTE} p-4 sm:p-5`}>
                  <div className="flex flex-wrap items-start gap-3">
                    <div className="min-w-[220px] flex-1">
                      <p className="text-[16px] font-extrabold text-[#12312A]">
                        {x.title?.trim() || x.formation?.title || 'Session sans intitulé'}
                      </p>
                      <p className="text-[14px] text-[#5E7A6E]">
                        Terminée il y a {jours} jour{jours > 1 ? 's' : ''}
                      </p>
                    </div>
                    {froidDu ? (
                      <Pastille ton="attention">Évaluation à froid attendue</Pastille>
                    ) : (
                      <Pastille ton="neutre">Émargement et attestations</Pastille>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      ) : null}

      {/* ------------------------------------------------- le référentiel */}
      <h2 className="mb-4 text-[19px] font-extrabold text-[#12312A]">Les sept pièces, dans l&apos;ordre</h2>
      <ol className="grid gap-3">
        {PIECES.map((p, i) => (
          <li key={p.code} className={`${CARTE} flex gap-4 p-4 sm:p-5`}>
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#E3F5EC] text-[15px] font-black text-[#0F5F3E]">
              {i + 1}
            </span>
            <div>
              <p className="text-[16px] font-extrabold text-[#12312A]">{p.titre}</p>
              <p className="text-[13px] font-bold uppercase tracking-wide text-[#1E9E6A]">{p.quand}</p>
              <p className="mt-1 text-[15px] leading-relaxed text-[#334A42]">{p.quoi}</p>
            </div>
          </li>
        ))}
      </ol>

      <p className="mt-8 max-w-[75ch] text-[14px] leading-relaxed text-[#5E7A6E]">
        Les preuves que tu déposes pour l&apos;audit se rangent dans{' '}
        <Link href="/academie/certification" className="font-bold text-[#0F5F3E] underline underline-offset-4">
          Ma certification Qualiopi
        </Link>
        , et les questionnaires se construisent dans{' '}
        <Link href="/academie/formulaires" className="font-bold text-[#0F5F3E] underline underline-offset-4">
          Mes formulaires
        </Link>
        .
      </p>
    </>
  );
}
