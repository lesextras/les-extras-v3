import Link from 'next/link';

/**
 * CE QUE LA LOI DEMANDE, ÉTAPE PAR ÉTAPE : l'affichage commun aux deux chemins
 * (association en indigo, académie en vert), 01/10/2026.
 *
 * Copie des types de apps/api/src/common/chemin-obligations.ts : les deux
 * bougent ensemble. Ce fichier ne charge aucun code serveur, pour que les
 * kanbans (composants client) puissent l'importer : `next build` refuse un
 * composant client qui tire « server-only ».
 */

export type NatureEtape = 'OBLIGATOIRE' | 'CONSEILLE' | 'SI_CONCERNE';

export interface EcheanceEtape {
  texte: string;
  /** Une date fixe chaque année, « MM-JJ ». */
  dateFixe?: string;
  /** La date est un repère : elle peut bouger selon l'année ou l'exercice. */
  indicative?: boolean;
}

export interface ObligationEtape {
  nature?: NatureEtape;
  declencheur?: string;
  echeance?: EcheanceEtape;
  prerequis?: string[];
}

export type Theme = 'association' | 'academie';

/** Ce qu'il faut savoir d'une étape pour en parler : son numéro, son titre. */
export interface EtapeRepere extends ObligationEtape {
  slug: string;
  numero: number;
  titre: string;
  chaqueAnnee?: boolean;
}

const COULEURS: Record<Theme, { lien: string; texte: string; doux: string; bord: string }> = {
  association: { lien: 'text-[#4F46E5]', texte: 'text-[#1D1B5C]', doux: 'text-[#6B6A8A]', bord: 'border-[#E6E4F3]' },
  academie: { lien: 'text-[#0F5F3E]', texte: 'text-[#12312A]', doux: 'text-[#5E7A6E]', bord: 'border-[#DCE9E2]' },
};

export const LIBELLES_NATURE: Record<NatureEtape, string> = {
  OBLIGATOIRE: 'Obligatoire',
  CONSEILLE: 'Conseillé',
  SI_CONCERNE: 'Si concerné',
};

const STYLE_NATURE: Record<NatureEtape, string> = {
  OBLIGATOIRE: 'bg-[#FDE8EC] text-[#9F1239]',
  CONSEILLE: 'bg-[#EEF0F4] text-[#3F4A5C]',
  SI_CONCERNE: 'bg-[#FEF3C7] text-[#92400E]',
};

const AIDE_NATURE: Record<NatureEtape, string> = {
  OBLIGATOIRE: 'La loi ou tes statuts le demandent.',
  CONSEILLE: "Pas obligatoire, mais ça t'évite des ennuis.",
  SI_CONCERNE: 'Obligatoire seulement dans certaines situations.',
};

export function BadgeNature({ nature }: { nature?: NatureEtape }) {
  if (!nature) return null;
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-bold ${STYLE_NATURE[nature]}`} title={AIDE_NATURE[nature]}>
      {LIBELLES_NATURE[nature]}
    </span>
  );
}

function IconeHorloge({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

function IconeCadenas({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  );
}

// ------------------------------------------------------------------ dates

/** Aujourd'hui à Paris, à minuit (en UTC), pour comparer des jours entiers. */
function aujourdhuiParis(maintenant: Date): Date {
  const parties = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Paris', year: 'numeric', month: 'numeric', day: 'numeric' }).formatToParts(maintenant);
  const lire = (type: string) => Number(parties.find((p) => p.type === type)?.value);
  return new Date(Date.UTC(lire('year'), lire('month') - 1, lire('day')));
}

/**
 * La date d'une échéance fixe. Pour une étape qui revient chaque année, c'est
 * celle de l'année en cours (passée, elle est en retard). Sinon, la prochaine.
 */
export function dateEcheance(dateFixe: string, chaqueAnnee: boolean, maintenant: Date = new Date()): { date: Date; depassee: boolean } | null {
  const m = /^(\d{2})-(\d{2})$/.exec(dateFixe);
  if (!m) return null;
  const jour = aujourdhuiParis(maintenant);
  const annee = jour.getUTCFullYear();
  let date = new Date(Date.UTC(annee, Number(m[1]) - 1, Number(m[2])));
  if (date < jour && !chaqueAnnee) date = new Date(Date.UTC(annee + 1, Number(m[1]) - 1, Number(m[2])));
  return { date, depassee: date < jour };
}

export function formaterJour(d: Date): string {
  return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(d);
}

// ---------------------------------------------------------- lignes de carte

/** « 30 avril 2027, à confirmer » quand la date est un repère. */
function libelleDate(e: EcheanceEtape, chaqueAnnee: boolean, maintenant?: Date): { texte: string; depassee: boolean } | null {
  if (!e.dateFixe) return null;
  const d = dateEcheance(e.dateFixe, chaqueAnnee, maintenant);
  if (!d) return null;
  return { texte: `${formaterJour(d.date)}${e.indicative ? ', à confirmer' : ''}`, depassee: d.depassee };
}

/** La ligne à l'horloge : l'échéance, et sa date quand elle est fixe. */
export function LigneEcheance({ echeance, chaqueAnnee = false, theme }: { echeance?: EcheanceEtape; chaqueAnnee?: boolean; theme: Theme }) {
  if (!echeance) return null;
  const date = libelleDate(echeance, chaqueAnnee);
  return (
    <p className={`mt-1.5 flex items-start gap-1.5 text-xs leading-snug ${COULEURS[theme].texte}`}>
      <IconeHorloge className="mt-px shrink-0 text-[#9F1239]" />
      <span>
        {date ? <span className={`font-bold ${date.depassee ? 'text-[#9F1239]' : ''}`}>{date.depassee ? `Date passée (${date.texte}). ` : `${date.texte}. `}</span> : null}
        {echeance.texte}
      </span>
    </p>
  );
}

/**
 * « Il faut d'abord : … ». Seulement les prérequis pas encore faits ; avec
 * `liens`, chacun mène à son étape (impossible dans une carte déjà cliquable).
 */
export function LignePrerequis({
  prerequis,
  etapes,
  faites,
  theme,
  liens = true,
}: {
  prerequis?: string[];
  etapes: EtapeRepere[];
  faites?: Set<string> | string[];
  theme: Theme;
  liens?: boolean;
}) {
  const fait = faites instanceof Set ? faites : new Set(faites ?? []);
  const manquants = (prerequis ?? [])
    .filter((s) => !fait.has(s))
    .map((s) => etapes.find((e) => e.slug === s))
    .filter((e): e is EtapeRepere => Boolean(e))
    .sort((a, b) => a.numero - b.numero);
  if (!manquants.length) return null;
  const c = COULEURS[theme];
  const base = theme === 'association' ? '/chemin/' : '/academie/chemin/';
  return (
    <p className={`mt-1.5 flex items-start gap-1.5 text-xs leading-snug ${c.doux}`}>
      <IconeCadenas className="mt-px shrink-0" />
      <span>
        <span className="font-bold">Il faut d&apos;abord : </span>
        {liens
          ? manquants.map((e, i) => (
              <span key={e.slug}>
                {i > 0 ? ', ' : ''}
                <Link href={`${base}${e.slug}`} draggable={false} className={`font-bold underline underline-offset-2 ${c.lien}`}>
                  {e.numero}. {e.titre}
                </Link>
              </span>
            ))
          : manquants.length === 1
            ? `l'étape ${manquants[0].numero}`
            : `les étapes ${manquants
                .slice(0, -1)
                .map((e) => e.numero)
                .join(', ')} et ${manquants[manquants.length - 1].numero}`}
      </span>
    </p>
  );
}

// ------------------------------------------------- le bandeau des échéances

/**
 * Les échéances à tenir : les étapes obligatoires qui ont une échéance, plus
 * celles « Si concerné » qui reviennent chaque année (on les écarte d'un clic
 * avec « Pas concerné »). Une étape faite, ou faite cette année pour une
 * annuelle (l'API le calcule déjà), n'y est pas. Les dates fixes d'abord.
 */
export function echeancesAVenir(etapes: EtapeRepere[], faites: Set<string> | string[], maintenant: Date = new Date()) {
  const fait = faites instanceof Set ? faites : new Set(faites);
  return etapes
    .filter((e) => e.echeance && !fait.has(e.slug) && (e.nature === 'OBLIGATOIRE' || (e.nature === 'SI_CONCERNE' && e.chaqueAnnee)))
    .map((e) => ({ etape: e, date: e.echeance?.dateFixe ? dateEcheance(e.echeance.dateFixe, Boolean(e.chaqueAnnee), maintenant) : null }))
    .sort((a, b) => {
      if (a.date && b.date) return a.date.date.getTime() - b.date.date.getTime();
      if (a.date) return -1;
      if (b.date) return 1;
      return a.etape.numero - b.etape.numero;
    });
}

const MOIS_COURTS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];

export function BandeauEcheances({
  etapes,
  faites,
  theme,
  maximum = 6,
}: {
  etapes: EtapeRepere[];
  faites: Set<string> | string[];
  theme: Theme;
  maximum?: number;
}) {
  const liste = echeancesAVenir(etapes, faites);
  if (!liste.length) return null;
  const c = COULEURS[theme];
  const base = theme === 'association' ? '/chemin/' : '/academie/chemin/';
  const visibles = liste.slice(0, maximum);
  return (
    <section aria-labelledby="echeances-obligatoires" className="mb-8 rounded-2xl border border-[#F5C2CF] bg-[#FFF5F7] p-4 sm:p-5">
      <h2 id="echeances-obligatoires" className="flex items-center gap-2 text-sm font-extrabold uppercase tracking-[0.12em] text-[#9F1239]">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#9F1239] text-white">
          <IconeHorloge />
        </span>
        Échéances obligatoires
        <span className="ml-auto rounded-full bg-white px-2 py-0.5 text-xs text-[#9F1239]">{liste.length}</span>
      </h2>
      <ul className="mt-3 grid gap-2 sm:grid-cols-2">
        {visibles.map(({ etape: e, date }) => (
          <li key={e.slug}>
            <Link
              href={`${base}${e.slug}`}
              className="group flex h-full items-start gap-3 rounded-xl border border-[#F9D7DF] bg-white p-3 no-underline transition hover:border-[#9F1239] motion-reduce:transition-none"
            >
              {date ? (
                <span
                  className={`flex w-12 shrink-0 flex-col items-center rounded-lg py-1 text-center leading-tight ${date.depassee ? 'bg-[#9F1239] text-white' : 'bg-[#FDE8EC] text-[#9F1239]'}`}
                >
                  <span className="text-lg font-extrabold">{date.date.getUTCDate()}</span>
                  <span className="text-[10px] font-bold uppercase">{MOIS_COURTS[date.date.getUTCMonth()]}</span>
                </span>
              ) : (
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[#FDE8EC] text-[#9F1239]">
                  <IconeHorloge className="h-5 w-5" />
                </span>
              )}
              <span className="min-w-0 flex-1">
                <span className={`block text-sm font-extrabold leading-snug ${c.texte} group-hover:text-[#9F1239]`}>
                  {e.numero}. {e.titre}
                </span>
                <span className={`mt-0.5 block text-xs leading-snug ${c.doux}`}>
                  {date?.depassee ? <span className="font-bold text-[#9F1239]">Date passée. </span> : null}
                  {date && e.echeance?.indicative ? 'Date à confirmer. ' : null}
                  {e.echeance?.texte}
                </span>
                {e.nature === 'SI_CONCERNE' ? (
                  <span className="mt-1 inline-flex rounded-full bg-[#FEF3C7] px-2 py-0.5 text-[11px] font-bold text-[#92400E]">Si concerné</span>
                ) : null}
              </span>
            </Link>
          </li>
        ))}
      </ul>
      {liste.length > visibles.length ? (
        <p className="mt-2 text-xs font-bold text-[#9F1239]">
          Et {liste.length - visibles.length} autre{liste.length - visibles.length > 1 ? 's' : ''} plus bas, dans le chemin.
        </p>
      ) : null}
    </section>
  );
}

// ---------------------------------------------- la ligne d'infos d'une étape

/** En haut d'une page d'étape : la nature, ce qui la déclenche, l'échéance, ce qu'il faut avant. */
export function InfosObligation({
  etape,
  etapes,
  faites,
  theme,
}: {
  etape: EtapeRepere;
  etapes: EtapeRepere[];
  faites?: Set<string>;
  theme: Theme;
}) {
  if (!etape.nature && !etape.declencheur && !etape.echeance && !etape.prerequis?.length) return null;
  const c = COULEURS[theme];
  const base = theme === 'association' ? '/chemin/' : '/academie/chemin/';
  const date = etape.echeance ? libelleDate(etape.echeance, Boolean(etape.chaqueAnnee)) : null;
  const avant = (etape.prerequis ?? [])
    .map((s) => etapes.find((e) => e.slug === s))
    .filter((e): e is EtapeRepere => Boolean(e))
    .sort((a, b) => a.numero - b.numero);
  return (
    <div className={`mb-6 rounded-2xl border ${c.bord} bg-white p-4 text-sm sm:p-5`}>
      <dl className="grid gap-3 sm:grid-cols-2">
        {etape.nature ? (
          <div>
            <dt className={`text-xs font-bold uppercase tracking-[0.1em] ${c.doux}`}>Est-ce obligatoire ?</dt>
            <dd className="mt-1 flex flex-wrap items-center gap-2">
              <BadgeNature nature={etape.nature} />
              <span className={c.doux}>{AIDE_NATURE[etape.nature]}</span>
            </dd>
          </div>
        ) : null}
        {etape.declencheur ? (
          <div>
            <dt className={`text-xs font-bold uppercase tracking-[0.1em] ${c.doux}`}>Quand ?</dt>
            <dd className={`mt-1 leading-snug ${c.texte}`}>{etape.declencheur}</dd>
          </div>
        ) : null}
        {etape.echeance ? (
          <div>
            <dt className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.1em] text-[#9F1239]">
              <IconeHorloge /> Échéance
            </dt>
            <dd className={`mt-1 leading-snug ${c.texte}`}>
              {date ? <span className="mr-1 inline-flex rounded-full bg-[#FDE8EC] px-2 py-0.5 text-xs font-bold text-[#9F1239]">{date.depassee ? `Passée : ${date.texte}` : date.texte}</span> : null}
              {etape.echeance.texte}
            </dd>
          </div>
        ) : null}
        {avant.length ? (
          <div>
            <dt className={`flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.1em] ${c.doux}`}>
              <IconeCadenas /> Il faut d&apos;abord
            </dt>
            <dd className="mt-1">
              <ul className="space-y-0.5">
                {avant.map((e) => {
                  const ok = faites?.has(e.slug);
                  return (
                    <li key={e.slug} className="leading-snug">
                      <span className={ok ? 'text-[#1E9E6A]' : c.doux} aria-label={ok ? 'Fait' : 'À faire'}>
                        {ok ? '✓ ' : '○ '}
                      </span>
                      <Link href={`${base}${e.slug}`} className={`font-bold underline underline-offset-2 ${c.lien}`}>
                        {e.numero}. {e.titre}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </dd>
          </div>
        ) : null}
      </dl>
    </div>
  );
}
