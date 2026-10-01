/* Textes allégés le 01/10/2026 (demande : le moins de texte possible) */
import Link from 'next/link';
import type { Metadata } from 'next';
import { apiAcademie, sessionAcademie } from '../_session';
import { BTN_DISCRET, CARTE, Encart, Info, Pastille, Titre, formaterDate } from '../_ui';
import type { LigneSessionAdmin } from '../_gestion/types';

export const metadata: Metadata = { title: 'Mon secrétariat', robots: { index: false, follow: false } };

/** Les pièces qu'une session doit laisser derrière elle, dans l'ordre. */
const PIECES = [
  {
    code: 'convention',
    titre: 'La convention ou le contrat',
    quand: 'Avant le premier jour',
    quoi: 'Convention si un employeur ou financeur paie, contrat si la personne paie.',
  },
  {
    code: 'convocation',
    titre: 'La convocation',
    quand: 'Une semaine avant',
    quoi: 'Date, horaires, lieu, référent handicap.',
  },
  {
    code: 'programme',
    titre: 'Le programme remis',
    quand: 'Avant le premier jour',
    quoi: 'Le même que celui du catalogue.',
  },
  {
    code: 'emargement',
    titre: "La feuille d'émargement",
    quand: 'Chaque demi-journée',
    quoi: 'Apprenants et formateur. La pièce la plus contrôlée.',
  },
  {
    code: 'chaud',
    titre: "L'évaluation à chaud",
    quand: 'Le dernier jour',
    quoi: 'Avant que la personne parte.',
  },
  {
    code: 'attestation',
    titre: 'L’attestation de fin de formation',
    quand: 'Dans les jours qui suivent',
    quoi: 'Avec les résultats de l’évaluation des acquis.',
  },
  {
    code: 'froid',
    titre: "L'évaluation à froid",
    quand: 'Trois à six mois après',
    quoi: 'Indicateur 11 : souvent oublié.',
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
  const { data, error } = await apiAcademie<LigneSessionAdmin[]>(s, '/academie/gestion/sessions');

  const toutes = Array.isArray(data) ? data : [];
  const maintenant = Date.now();
  const aVenir = toutes
    .filter((x) => x.status !== 'CANCELLED' && new Date(x.startDate).getTime() >= maintenant)
    .sort((a, b) => +new Date(a.startDate) - +new Date(b.startDate));
  const recentes = toutes
    .filter((x) => x.status !== 'CANCELLED' && new Date(x.startDate).getTime() < maintenant)
    .sort((a, b) => +new Date(b.startDate) - +new Date(a.startDate))
    .slice(0, 8);

  return (
    <>
      <Titre
        surtitre="Le papier, dans l'ordre"
        sousTitre="Avant, pendant, après : les sept pièces d'une session."
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
            const inscrits = x.stagiaires;
            const points = [
              { ok: x.creneaux > 0, texte: 'Planning posé', onglet: 'planning' },
              { ok: inscrits > 0, texte: `${inscrits} stagiaire${inscrits > 1 ? 's' : ''} inscrit${inscrits > 1 ? 's' : ''}`, onglet: 'stagiaires' },
              { ok: x.conventions > 0 && x.conventionsSignees === x.conventions, texte: x.conventions ? `${x.conventionsSignees}/${x.conventions} convention${x.conventions > 1 ? 's' : ''} ou contrat${x.conventions > 1 ? 's' : ''} signé${x.conventionsSignees > 1 ? 's' : ''}` : 'Conventions à envoyer', onglet: 'documents' },
              { ok: inscrits > 0 && x.convoques === inscrits, texte: `${x.convoques}/${inscrits} convocation${inscrits > 1 ? 's' : ''} envoyée${x.convoques > 1 ? 's' : ''}`, onglet: 'documents' },
            ];
            return (
              <li key={x.id} className={`${CARTE} p-4 sm:p-5`}>
                <div className="flex flex-wrap items-start gap-3">
                  <div className="min-w-[220px] flex-1">
                    <p className="text-[16px] font-extrabold text-[#12312A]">
                      {x.titre || 'Session sans intitulé'}
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
                <ul className="mt-3 flex flex-wrap gap-2">
                  {points.map((p) => (
                    <li key={p.texte}>
                      <Link
                        href={`/academie/sessions/${x.id}?onglet=${p.onglet}`}
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[13px] font-bold no-underline ${p.ok ? 'bg-[#E3F5EC] text-[#0F5F3E]' : 'bg-[#FEF3E2] text-[#7C3E06]'}`}
                      >
                        {p.ok ? '✓' : '○'} {p.texte}
                      </Link>
                    </li>
                  ))}
                </ul>
                {!x.location && !x.salle ? <p className="mt-2 text-[14px] text-[#7C3E06]">Lieu manquant : convocation bloquée.</p> : null}
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="mb-9 text-[15px] leading-relaxed text-[#5E7A6E]">Aucune session à venir.</p>
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
                        {x.titre || 'Session sans intitulé'}
                      </p>
                      <p className="text-[14px] text-[#5E7A6E]">
                        Terminée · J+{jours}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Pastille ton={x.stagiaires && x.evaluesChaud === x.stagiaires ? 'ok' : 'attention'}>
                        {x.evaluesChaud}/{x.stagiaires} enquêtes de fin
                      </Pastille>
                      {froidDu ? (
                        <Pastille ton={x.stagiaires && x.evaluesFroid === x.stagiaires ? 'ok' : 'attention'}>
                          {x.evaluesFroid}/{x.stagiaires} à froid
                        </Pastille>
                      ) : null}
                      <Pastille ton={x.facturee ? 'ok' : 'attention'}>{x.facturee ? 'Facturée' : 'À facturer'}</Pastille>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Link href={`/academie/sessions/${x.id}?onglet=documents`} className={BTN_DISCRET}>
                      Attestations et certificats
                    </Link>
                    <Link href={`/academie/sessions/${x.id}?onglet=emargement`} className={BTN_DISCRET}>
                      Feuille d&apos;émargement
                    </Link>
                    <Link href={`/academie/sessions/${x.id}?onglet=facturation`} className={BTN_DISCRET}>
                      Facturation
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      ) : null}

      {/* ------------------------------------------------- le référentiel */}
      <h2 className="mb-4 text-[19px] font-extrabold text-[#12312A]">Les 7 pièces, dans l&apos;ordre</h2>
      <ol className="grid gap-3">
        {PIECES.map((p, i) => (
          <li key={p.code} className={`${CARTE} flex gap-4 p-4 sm:p-5`}>
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#E3F5EC] text-[15px] font-black text-[#0F5F3E]">
              {i + 1}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-[16px] font-extrabold text-[#12312A]">{p.titre}</p>
                <Info>{p.quoi}</Info>
              </div>
              <p className="text-[13px] font-bold uppercase tracking-wide text-[#1E9E6A]">{p.quand}</p>
            </div>
          </li>
        ))}
      </ol>

      <p className="mt-8 flex flex-wrap gap-x-4 gap-y-1 text-[14px] text-[#5E7A6E]">
        <Link href="/academie/certification" className="font-bold text-[#0F5F3E] underline underline-offset-4">
          Ma certification
        </Link>
        <Link href="/academie/formulaires" className="font-bold text-[#0F5F3E] underline underline-offset-4">
          Mes formulaires
        </Link>
      </p>
    </>
  );
}
