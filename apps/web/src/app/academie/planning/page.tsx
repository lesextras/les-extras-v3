import Link from 'next/link';
import type { Metadata } from 'next';
import { apiAcademie, sessionAcademie } from '../_session';
import { BTN_SECONDAIRE, CARTE, Encart, Pastille, Titre } from '../_ui';

export const metadata: Metadata = { title: 'Planning', robots: { index: false, follow: false } };

interface CreneauPlanning {
  id: string;
  debut: string;
  fin: string;
  distanciel: boolean;
  conflit: boolean;
  session: { id: string; title: string | null; status: string; formation: { title: string } };
  formateur: { id: string; prenom: string; nom: string } | null;
  salle: { id: string; nom: string } | null;
}

const heure = (d: string) => new Date(d).toLocaleTimeString('fr-FR', { timeZone: 'Europe/Paris', hour: '2-digit', minute: '2-digit' });
const jour = (d: Date) => new Intl.DateTimeFormat('fr-CA', { timeZone: 'Europe/Paris', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);

/** Le lundi (à Paris) de la semaine qui contient la date. */
function lundi(d: Date): Date {
  const j = jour(d);
  const base = new Date(`${j}T12:00:00Z`);
  const decalage = (base.getUTCDay() + 6) % 7;
  base.setUTCDate(base.getUTCDate() - decalage);
  return new Date(`${base.toISOString().slice(0, 10)}T00:00:00Z`);
}

/**
 * `/academie/planning` : LA SEMAINE DE TOUTE L'ACADÉMIE.
 *
 * Toutes les sessions, tous les formateurs, toutes les salles : c'est ici que
 * l'on voit qu'une salle est prise deux fois ou qu'un formateur est attendu à
 * deux endroits.
 */
export default async function PlanningPage({ searchParams }: { searchParams: Promise<{ semaine?: string }> }) {
  const s = await sessionAcademie('/academie/planning');
  const { semaine } = await searchParams;
  const debut = lundi(semaine && /^\d{4}-\d{2}-\d{2}$/.test(semaine) ? new Date(`${semaine}T12:00:00Z`) : new Date());
  const fin = new Date(debut.getTime() + 7 * 86_400_000);
  const precedente = new Date(debut.getTime() - 7 * 86_400_000).toISOString().slice(0, 10);
  const suivante = fin.toISOString().slice(0, 10);
  const { data, error } = await apiAcademie<CreneauPlanning[]>(s, `/academie/gestion/planning?de=${new Date(debut.getTime() - 2 * 3_600_000).toISOString()}&a=${fin.toISOString()}`);
  const creneaux = Array.isArray(data) ? data : [];
  const jours = Array.from({ length: 7 }, (_, i) => new Date(debut.getTime() + i * 86_400_000 + 12 * 3_600_000));
  const conflits = creneaux.filter((c) => c.conflit).length;

  return (
    <>
      <Titre
        surtitre="Gestion de l’organisme"
        sousTitre="Les créneaux de toutes tes sessions, semaine par semaine, avec les conflits de formateur et de salle."
        actions={
          <Link href="/academie/sessions" className={BTN_SECONDAIRE}>
            Les sessions
          </Link>
        }
      >
        Planning
      </Titre>
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <Link href={`/academie/planning?semaine=${precedente}`} className={BTN_SECONDAIRE}>
          ← Semaine précédente
        </Link>
        <span className="px-2 text-[16px] font-extrabold text-[#12312A]">
          Semaine du {jours[0].toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
        </span>
        <Link href={`/academie/planning?semaine=${suivante}`} className={BTN_SECONDAIRE}>
          Semaine suivante →
        </Link>
        <Link href="/academie/planning" className="text-sm font-bold text-[#0F5F3E] underline underline-offset-4">
          Cette semaine
        </Link>
      </div>
      {error ? <Encart ton="attention">{error}</Encart> : null}
      {conflits ? (
        <div className="mb-4">
          <Encart ton="alerte">
            {conflits} créneau{conflits > 1 ? 'x' : ''} en conflit cette semaine : un formateur ou une salle est pris deux fois au même moment.
          </Encart>
        </div>
      ) : null}
      <div className="grid gap-3 lg:grid-cols-7">
        {jours.map((j) => {
          const k = jour(j);
          const liste = creneaux.filter((c) => jour(new Date(c.debut)) === k);
          return (
            <section key={k} className={`${CARTE} p-3`}>
              <h2 className="mb-2 text-[14px] font-extrabold capitalize text-[#12312A]">{j.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'short' })}</h2>
              {liste.length ? (
                <ul className="grid gap-2">
                  {liste.map((c) => (
                    <li key={c.id}>
                      <Link href={`/academie/sessions/${c.session.id}?onglet=planning`} className={`block rounded-xl px-3 py-2 text-[13px] no-underline ${c.conflit ? 'bg-[#FDE7EC] text-[#8A1B3D]' : 'bg-[#E3F5EC] text-[#0F5F3E]'}`}>
                        <span className="block font-extrabold tabular-nums">
                          {heure(c.debut)} à {heure(c.fin)}
                        </span>
                        <span className="block font-bold text-[#12312A]">{c.session.title || c.session.formation.title}</span>
                        <span className="block">{c.formateur ? `${c.formateur.prenom} ${c.formateur.nom}` : 'Formateur à préciser'}</span>
                        <span className="block">{c.distanciel ? 'À distance' : c.salle?.nom ?? 'Salle à préciser'}</span>
                        {c.conflit ? <Pastille ton="alerte">Conflit</Pastille> : null}
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-[13px] text-[#8FA79B]">Rien</p>
              )}
            </section>
          );
        })}
      </div>
    </>
  );
}
