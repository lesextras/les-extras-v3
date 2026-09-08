import Link from 'next/link';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { apiAcademie, sessionAcademie } from '../_session';
import { CARTE, Encart, ORIGINE_SITE, Pastille, Titre, formaterDate } from '../_ui';
import { ListeCours } from '../_ecole/ListeCours';
import type { Classe, CoursResume } from '../_ecole/types';
import { Programmes, type Programme } from '../catalogue/Programmes';
import { Sessions, type Session } from '../sessions/Sessions';
import { Classes } from '../classes-virtuelles/Classes';

export const metadata: Metadata = { title: 'Mes formations' };

/**
 * `/academie/formations` — TOUT CE QUI S'ENSEIGNE, AU MÊME ENDROIT.
 *
 * C'était cinq entrées de menu : le catalogue, les cours en ligne, les cours
 * en présentiel, les sessions, les classes virtuelles. Cinq mots pour une même
 * chose — une formation — et il fallait deviner lequel ouvrir. Un seul écran
 * maintenant, cinq onglets, et la même question à chaque fois : de quoi je
 * parle, sous quelle forme on l'apprend, et quand ça se passe.
 *
 * Les onglets sont des liens : l'adresse dit où l'on est, elle se partage, et
 * chaque onglet ne charge que ce dont il a besoin.
 */

type Onglet = 'programmes' | 'en-ligne' | 'sessions' | 'presentiel' | 'classes';

const ONGLETS: { cle: Onglet; libelle: string }[] = [
  { cle: 'programmes', libelle: 'Mes programmes' },
  { cle: 'en-ligne', libelle: 'En ligne' },
  { cle: 'sessions', libelle: 'Mes sessions' },
  { cle: 'presentiel', libelle: 'En présentiel' },
  { cle: 'classes', libelle: 'Classes virtuelles' },
];

/** Ce que chaque onglet contient, dit une fois, en haut. */
const QUOI: Record<Onglet, string> = {
  programmes:
    "La fiche de chaque formation : objectifs, public visé, prérequis, durée, déroulé. C'est ce que lisent l'auditeur et le financeur, et c'est ce qui donne lieu à des sessions et à des conventions.",
  'en-ligne':
    "Les cours que l'on suit à son rythme : chapitres, leçons, vidéos, documents, quiz. Tu écris, tu publies, tu partages l'adresse.",
  sessions:
    "Les dates où la formation a lieu pour de vrai. C'est la session qui porte la convention, l'émargement et les évaluations.",
  presentiel:
    "Les sessions qui se tiennent quelque part. Le présentiel demande un lieu nommé, une salle accessible et une feuille d'émargement signée.",
  classes:
    'Les rendez-vous en visio : une date, une heure, un lien. Ce que le e-learning ne fait pas — répondre aux questions, corriger ensemble.',
};

interface PageProps {
  searchParams: Promise<{ onglet?: string }>;
}

/** Une session en salle, telle qu'on la lit dans la liste. */
function LignePresentiel({ x }: { x: Session }) {
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

function vuePresentiel(toutes: Session[]): ReactNode {
  const enSalle = toutes.filter((x) => x.location?.trim());
  const sansLieu = toutes.filter((x) => !x.location?.trim());
  const maintenant = Date.now();
  const aVenir = enSalle
    .filter((x) => new Date(x.startDate).getTime() >= maintenant)
    .sort((a, b) => +new Date(a.startDate) - +new Date(b.startDate));
  const passees = enSalle
    .filter((x) => new Date(x.startDate).getTime() < maintenant)
    .sort((a, b) => +new Date(b.startDate) - +new Date(a.startDate));

  const salles = new Map<string, number>();
  for (const x of enSalle) {
    const lieu = (x.location ?? '').trim();
    salles.set(lieu, (salles.get(lieu) ?? 0) + 1);
  }

  return (
    <>
      {sansLieu.length ? (
        <div className="mb-6">
          <Encart ton="attention">
            <span className="font-extrabold">
              {sansLieu.length} session{sansLieu.length > 1 ? 's' : ''}
            </span>{' '}
            sans lieu renseigné. Si elle se tient en salle, écris où : sans adresse, ni la convention ni
            l&apos;émargement ne tiennent.{' '}
            <Link href="/academie/formations?onglet=sessions" className="font-bold underline underline-offset-2">
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

      <h2 className="mb-4 text-[19px] font-extrabold text-[#12312A]">
        À venir <span className="text-[#5E7A6E]">({aVenir.length})</span>
      </h2>
      {aVenir.length ? (
        <ul className="grid gap-3">
          {aVenir.map((x) => (
            <LignePresentiel key={x.id} x={x} />
          ))}
        </ul>
      ) : (
        <p className="text-[15px] leading-relaxed text-[#5E7A6E]">
          Aucune session en salle n&apos;est programmée. Ajoute une date et un lieu depuis l&apos;onglet « Mes
          sessions ».
        </p>
      )}

      {passees.length ? (
        <>
          <h2 className="mb-4 mt-9 text-[19px] font-extrabold text-[#12312A]">
            Déjà passées <span className="text-[#5E7A6E]">({passees.length})</span>
          </h2>
          <ul className="grid gap-3">
            {passees.slice(0, 20).map((x) => (
              <LignePresentiel key={x.id} x={x} />
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

export default async function FormationsPage({ searchParams }: PageProps) {
  const { onglet: brut } = await searchParams;
  const onglet: Onglet = ONGLETS.some((o) => o.cle === brut) ? (brut as Onglet) : 'programmes';
  const s = await sessionAcademie('/academie/formations');

  let contenu: ReactNode = null;

  if (onglet === 'programmes') {
    const { data, error } = await apiAcademie<{ items?: Programme[] } | Programme[]>(s, '/formations?perPage=100');
    const liste = Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : null;
    contenu = liste ? (
      <Programmes initiaux={liste} />
    ) : (
      <Encart ton="attention">{error ?? 'Le catalogue ne se charge pas pour le moment.'}</Encart>
    );
  } else if (onglet === 'en-ligne') {
    const { data, error } = await apiAcademie<CoursResume[]>(s, '/ecole/cours');
    contenu = data ? (
      <ListeCours cours={Array.isArray(data) ? data : []} origine={ORIGINE_SITE} />
    ) : (
      <Encart ton="attention">{error ?? 'Les cours ne se chargent pas pour le moment.'}</Encart>
    );
  } else if (onglet === 'sessions') {
    const [sessions, catalogue] = await Promise.all([
      apiAcademie<Session[]>(s, '/formations/mes-sessions'),
      apiAcademie<{ items?: Programme[] } | Programme[]>(s, '/formations?perPage=100'),
    ]);
    const c = catalogue.data;
    contenu =
      sessions.data || catalogue.data ? (
        <Sessions
          initiales={Array.isArray(sessions.data) ? sessions.data : []}
          programmes={Array.isArray(c) ? c : Array.isArray(c?.items) ? c.items : []}
        />
      ) : (
        <Encart ton="attention">{sessions.error ?? 'Les sessions ne se chargent pas pour le moment.'}</Encart>
      );
  } else if (onglet === 'presentiel') {
    const { data, error } = await apiAcademie<Session[]>(s, '/formations/mes-sessions');
    contenu = data ? (
      vuePresentiel(Array.isArray(data) ? data : [])
    ) : (
      <Encart ton="attention">{error ?? 'Les sessions ne se chargent pas pour le moment.'}</Encart>
    );
  } else {
    const [classes, cours] = await Promise.all([
      apiAcademie<Classe[]>(s, '/ecole/classes'),
      apiAcademie<CoursResume[]>(s, '/ecole/cours'),
    ]);
    contenu = classes.data ? (
      <Classes
        initiales={Array.isArray(classes.data) ? classes.data : []}
        cours={Array.isArray(cours.data) ? cours.data : []}
      />
    ) : (
      <Encart ton="attention">{classes.error ?? 'Les classes ne se chargent pas pour le moment.'}</Encart>
    );
  }

  return (
    <>
      <Titre
        surtitre="Tout ce qui s'enseigne"
        sousTitre="Le programme, la façon dont on l'apprend, et les dates auxquelles ça se passe : trois questions sur une même formation, au même endroit."
      >
        Mes formations
      </Titre>

      <nav aria-label="Vues des formations" className="mb-5 overflow-x-auto">
        <ul className="flex min-w-max gap-2 border-b border-[#DDEBE4] pb-px">
          {ONGLETS.map((o) => {
            const actif = o.cle === onglet;
            return (
              <li key={o.cle}>
                <Link
                  href={o.cle === 'programmes' ? '/academie/formations' : `/academie/formations?onglet=${o.cle}`}
                  aria-current={actif ? 'page' : undefined}
                  className={`inline-block rounded-t-xl px-4 py-2.5 text-[15px] font-bold no-underline transition ${
                    actif
                      ? 'border-b-[3px] border-[#1E9E6A] bg-white text-[#0F5F3E]'
                      : 'border-b-[3px] border-transparent text-[#5E7A6E] hover:bg-[#E3F5EC] hover:text-[#0F5F3E]'
                  }`}
                >
                  {o.libelle}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <p className="mb-6 max-w-[75ch] text-[15px] leading-relaxed text-[#5E7A6E]">{QUOI[onglet]}</p>

      {contenu}
    </>
  );
}
