import Link from 'next/link';
import type { Metadata } from 'next';
import { apiAcademie, sessionAcademie } from '../_session';
import { BTN_DISCRET, CARTE, Encart, Pastille, Titre, formaterDate } from '../_ui';
import type { Session } from '../sessions/Sessions';

export const metadata: Metadata = { title: 'Mes cours en présentiel', robots: { index: false, follow: false } };

/**
 * `/academie/cours-en-presentiel` — CE QUI SE PASSE EN SALLE.
 *
 * Le présentiel a des obligations que le distanciel n'a pas : un lieu nommé,
 * une salle accessible, une feuille d'émargement signée demi-journée par
 * demi-journée. Cet écran ne montre donc que les sessions qui ont un lieu, et
 * signale celles qui n'en ont pas encore.
 */
export default async function PresentielPage() {
  const s = await sessionAcademie('/academie/cours-en-presentiel');
  const { data, error } = await apiAcademie<Session[]>(s, '/formations/mes-sessions');

  if (!data) {
    return (
      <>
        <Titre surtitre="En salle">Mes cours en présentiel</Titre>
        <Encart ton="attention">{error ?? 'Les sessions ne se chargent pas pour le moment.'}</Encart>
      </>
    );
  }

  const toutes = Array.isArray(data) ? data : [];
  const enSalle = toutes.filter((x) => x.location?.trim());
  const sansLieu = toutes.filter((x) => !x.location?.trim());
  const maintenant = Date.now();
  const aVenir = enSalle
    .filter((x) => new Date(x.startDate).getTime() >= maintenant)
    .sort((a, b) => +new Date(a.startDate) - +new Date(b.startDate));
  const passees = enSalle
    .filter((x) => new Date(x.startDate).getTime() < maintenant)
    .sort((a, b) => +new Date(b.startDate) - +new Date(a.startDate));

  /** Un lieu revient souvent : autant le voir comme une salle qu'on utilise. */
  const salles = new Map<string, number>();
  for (const x of enSalle) {
    const lieu = x.location!.trim();
    salles.set(lieu, (salles.get(lieu) ?? 0) + 1);
  }

  function Carte({ x }: { x: Session }) {
    const inscrits = x._count?.inscriptions ?? 0;
    return (
      <li className={`${CARTE} p-4 sm:p-5`}>
        <div className="flex flex-wrap items-start gap-3">
          <div className="min-w-[220px] flex-1">
            <p className="text-[16px] font-extrabold text-[#12312A]">
              {x.title?.trim() || x.formation?.title || 'Session sans intitulé'}
            </p>
            <p className="text-[14px] text-[#5E7A6E]">
              {formaterDate(x.startDate)}
              {x.endDate ? ` au ${formaterDate(x.endDate)}` : ''}
            </p>
            <p className="mt-1 text-[15px] font-bold text-[#0F5F3E]">{x.location}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Pastille ton="neutre">
              {inscrits} inscrit{inscrits > 1 ? 's' : ''}
              {x.maxSeats ? ` / ${x.maxSeats}` : ''}
            </Pastille>
            {!x.endDate ? <Pastille ton="attention">Pas de date de fin</Pastille> : null}
          </div>
        </div>
      </li>
    );
  }

  return (
    <>
      <Titre
        surtitre="En salle"
        sousTitre="Les sessions qui se tiennent quelque part. Le présentiel demande un lieu nommé, une salle accessible et une feuille d'émargement signée : c'est ce qui se vérifie en audit."
      >
        Mes cours en présentiel
      </Titre>

      {sansLieu.length ? (
        <div className="mb-6">
          <Encart ton="attention">
            <span className="font-extrabold">
              {sansLieu.length} session{sansLieu.length > 1 ? 's' : ''}
            </span>{' '}
            sans lieu renseigné. Si elle se tient en salle, écris où : sans adresse, ni la convention ni
            l&apos;émargement ne tiennent.{' '}
            <Link href="/academie/sessions" className="font-bold underline underline-offset-2">
              Mes sessions
            </Link>
          </Encart>
        </div>
      ) : null}

      {salles.size ? (
        <section className="mb-7">
          <h2 className="mb-3 text-[19px] font-extrabold text-[#12312A]">Tes lieux</h2>
          <ul className="flex flex-wrap gap-2">
            {[...salles.entries()]
              .sort((a, b) => b[1] - a[1])
              .map(([lieu, n]) => (
                <li key={lieu} className="rounded-full bg-[#E3F5EC] px-3.5 py-1.5 text-[14px] font-bold text-[#0F5F3E]">
                  {lieu} <span className="text-[#5E7A6E]">· {n}</span>
                </li>
              ))}
          </ul>
        </section>
      ) : null}

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <h2 className="text-[19px] font-extrabold text-[#12312A]">
          À venir <span className="text-[#5E7A6E]">({aVenir.length})</span>
        </h2>
        <Link href="/academie/sessions" className={`${BTN_DISCRET} ml-auto`}>
          Programmer une session
        </Link>
      </div>

      {aVenir.length ? (
        <ul className="grid gap-3">
          {aVenir.map((x) => (
            <Carte key={x.id} x={x} />
          ))}
        </ul>
      ) : (
        <p className="text-[15px] leading-relaxed text-[#5E7A6E]">
          Aucune session en salle n&apos;est programmée. Ajoute une date et un lieu depuis Mes sessions.
        </p>
      )}

      {passees.length ? (
        <>
          <h2 className="mb-4 mt-9 text-[19px] font-extrabold text-[#12312A]">
            Déjà passées <span className="text-[#5E7A6E]">({passees.length})</span>
          </h2>
          <ul className="grid gap-3">
            {passees.slice(0, 20).map((x) => (
              <Carte key={x.id} x={x} />
            ))}
          </ul>
        </>
      ) : null}

      <section className={`${CARTE} mt-9 p-5`}>
        <h2 className="text-[18px] font-extrabold text-[#12312A]">Ce qu&apos;une session en salle doit porter</h2>
        <ul className="mt-2 grid gap-2 text-[15px] leading-relaxed text-[#334A42]">
          <li>Un lieu précis, et la façon d&apos;y accéder quand on est en situation de handicap.</li>
          <li>Une feuille d&apos;émargement signée par demi-journée, apprenant et formateur.</li>
          <li>Une évaluation à chaud en fin de session, une évaluation à froid quelques mois après.</li>
          <li>Une attestation de fin de formation remise à chaque personne.</li>
        </ul>
        <p className="mt-3 text-[14px] text-[#5E7A6E]">
          Les feuilles et les attestations se produisent depuis{' '}
          <Link href="/academie/secretariat" className="font-bold text-[#0F5F3E] underline underline-offset-4">
            Mon secrétariat
          </Link>
          .
        </p>
      </section>
    </>
  );
}
