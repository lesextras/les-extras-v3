/* Textes allégés le 01/10/2026 (demande : le moins de texte possible) */
import Link from 'next/link';
import type { Metadata } from 'next';
import { apiAcademie, sessionAcademie } from '../_session';
import { BTN_PRIMAIRE, BTN_SECONDAIRE, CARTE_VIVE, Encart, Pastille, Titre, formaterDate } from '../_ui';
import type { LigneSessionAdmin } from '../_gestion/types';

export const metadata: Metadata = { title: 'Sessions et planning', robots: { index: false, follow: false } };

const STATUT: Record<string, string> = {
  SCHEDULED: 'Programmée',
  OPEN: 'Ouverte',
  FULL: 'Complète',
  RUNNING: 'En cours',
  DONE: 'Terminée',
  CANCELLED: 'Annulée',
};

/**
 * `/academie/sessions` : L'ADMINISTRATION, SESSION PAR SESSION.
 *
 * Une session se PROGRAMME depuis sa formation (Mes formations → Sessions) ;
 * elle s'ADMINISTRE ici : planning, stagiaires, émargement, documents,
 * évaluations, facturation. La liste montre d'un coup d'œil ce qui manque à
 * chacune, parce que c'est ce qu'un contrôle demandera.
 */
export default async function SessionsPage({ searchParams }: { searchParams: Promise<{ vue?: string }> }) {
  const s = await sessionAcademie('/academie/sessions');
  const { vue } = await searchParams;
  const { data, error } = await apiAcademie<LigneSessionAdmin[]>(s, '/academie/gestion/sessions');
  const liste = Array.isArray(data) ? data : [];
  const maintenant = Date.now();
  const fin = (x: LigneSessionAdmin) => new Date(x.endDate ?? x.startDate).getTime();
  const enCours = liste.filter((x) => x.status !== 'CANCELLED' && new Date(x.startDate).getTime() <= maintenant && fin(x) >= maintenant - 12 * 3_600_000);
  const aVenir = liste.filter((x) => x.status !== 'CANCELLED' && new Date(x.startDate).getTime() > maintenant).reverse();
  const passees = liste.filter((x) => x.status !== 'CANCELLED' && fin(x) < maintenant - 12 * 3_600_000);
  const annulees = liste.filter((x) => x.status === 'CANCELLED');
  const groupes: [string, string, LigneSessionAdmin[]][] = [
    ['en-cours', 'En cours', enCours],
    ['a-venir', 'À venir', aVenir],
    ['passees', 'Terminées', passees],
    ['annulees', 'Annulées', annulees],
  ];
  const choisi = groupes.find((g) => g[0] === vue);

  return (
    <>
      <Titre
        surtitre="Gestion de l’organisme"
        sousTitre="Tout ce qu'une session produit, au même endroit."
        info="Une session se programme depuis sa formation, onglet « Sessions »."
        actions={
          <>
            <Link href="/academie/planning" className={BTN_SECONDAIRE}>
              Planning
            </Link>
            <Link href="/academie/formations" className={BTN_PRIMAIRE}>
              Nouvelle session
            </Link>
          </>
        }
      >
        Sessions
      </Titre>

      {error ? (
        <div className="mb-6">
          <Encart ton="attention">{error}</Encart>
        </div>
      ) : null}

      {!liste.length && !error ? (
        <Encart ton="info">Aucune session. Programme-la depuis une formation.</Encart>
      ) : (
        <>
          <nav className="mb-6 flex flex-wrap gap-2" aria-label="Filtrer les sessions">
            <Link href="/academie/sessions" className={`rounded-full px-4 py-2 text-sm font-bold no-underline ${!choisi ? 'bg-[#0F5F3E] text-white' : 'bg-[#E3F5EC] text-[#0F5F3E]'}`}>
              Toutes ({liste.length})
            </Link>
            {groupes.map(([cle, libelle, g]) =>
              g.length ? (
                <Link
                  key={cle}
                  href={`/academie/sessions?vue=${cle}`}
                  className={`rounded-full px-4 py-2 text-sm font-bold no-underline ${choisi?.[0] === cle ? 'bg-[#0F5F3E] text-white' : 'bg-[#E3F5EC] text-[#0F5F3E]'}`}
                >
                  {libelle} ({g.length})
                </Link>
              ) : null,
            )}
          </nav>
          {(choisi ? [choisi] : groupes).map(([cle, libelle, g]) =>
            g.length ? (
              <section key={cle} className="mb-8">
                <h2 className="mb-3 text-[17px] font-extrabold text-[#12312A]">{libelle}</h2>
                <ul className="grid gap-3">
                  {g.map((x) => (
                    <LigneSession key={x.id} s={x} />
                  ))}
                </ul>
              </section>
            ) : null,
          )}
        </>
      )}
    </>
  );
}

function LigneSession({ s }: { s: LigneSessionAdmin }) {
  const passee = new Date(s.endDate ?? s.startDate).getTime() < Date.now();
  const manque: string[] = [];
  if (s.status !== 'CANCELLED') {
    if (!s.creneaux) manque.push('Planning');
    if (!s.stagiaires) manque.push('Stagiaires');
    if (s.stagiaires && s.convoques < s.stagiaires && !passee) manque.push(`${s.stagiaires - s.convoques} convocation${s.stagiaires - s.convoques > 1 ? 's' : ''}`);
    if (passee && s.stagiaires && s.evaluesChaud < s.stagiaires) manque.push(`${s.stagiaires - s.evaluesChaud} enquête${s.stagiaires - s.evaluesChaud > 1 ? 's' : ''}`);
    if (passee && s.stagiaires && !s.facturee) manque.push('Facture');
  }
  return (
    <li>
      <Link href={`/academie/sessions/${s.id}`} className={`${CARTE_VIVE} block p-5 no-underline`}>
        <div className="flex flex-wrap items-center gap-2">
          <Pastille ton={s.status === 'CANCELLED' ? 'alerte' : s.status === 'DONE' ? 'neutre' : 'ok'}>{STATUT[s.status] ?? s.status}</Pastille>
          <span className="text-[14px] text-[#5E7A6E]">
            {formaterDate(s.startDate)}
            {s.endDate && new Date(s.endDate).toDateString() !== new Date(s.startDate).toDateString() ? ` au ${formaterDate(s.endDate)}` : ''}
          </span>
          {s.formateur ? <span className="text-[14px] text-[#5E7A6E]">· {s.formateur.prenom} {s.formateur.nom}</span> : null}
          {s.salle ? <span className="text-[14px] text-[#5E7A6E]">· {s.salle.nom}</span> : s.location ? <span className="text-[14px] text-[#5E7A6E]">· {s.location}</span> : null}
        </div>
        <p className="mt-1.5 text-[17px] font-extrabold leading-snug text-[#12312A]">{s.titre}</p>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[14px] text-[#334A42]">
          <span>
            {s.stagiaires} stagiaire{s.stagiaires > 1 ? 's' : ''}
            {s.maxSeats ? ` / ${s.maxSeats}` : ''}
          </span>
          <span>{s.creneaux} créneau{s.creneaux > 1 ? 'x' : ''}</span>
          {s.conventions ? (
            <span>
              {s.conventionsSignees}/{s.conventions} convention{s.conventions > 1 ? 's' : ''}
            </span>
          ) : null}
          {s.facturee ? <span className="font-bold text-[#0F5F3E]">Facturée</span> : null}
        </div>
        {manque.length ? (
          <span className="mt-3 flex flex-wrap items-center gap-1.5">
            {manque.map((m) => (
              <Pastille key={m} ton="attention">
                {m}
              </Pastille>
            ))}
          </span>
        ) : null}
      </Link>
    </li>
  );
}
