import Link from 'next/link';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { apiAcademie, sessionAcademie } from '../_session';
import { CARTE, Encart, ORIGINE_SITE, Titre } from '../_ui';
import { ListeCours } from '../_ecole/ListeCours';
import type { Classe, CoursResume, ModaliteCours } from '../_ecole/types';
import { Programmes, type Programme } from '../catalogue/Programmes';
import { Sessions, type Session } from '../sessions/Sessions';
import { Classes } from '../classes-virtuelles/Classes';

export const metadata: Metadata = { title: 'Mes formations' };

/**
 * `/academie/formations` — TOUT CE QUI S'ENSEIGNE, AU MÊME ENDROIT.
 *
 * C'était cinq entrées de menu : le catalogue, les cours en ligne, les cours
 * en présentiel, les sessions, les classes virtuelles. Cinq mots pour une même
 * chose — une formation — et il fallait deviner lequel ouvrir.
 *
 * Le présentiel a disparu des onglets : une formation en salle n'est pas une
 * autre sorte de formation, c'est la même, suivie autrement. La modalité se
 * choisit dans la formation, et se filtre ici.
 */

type Onglet = 'formations' | 'programmes' | 'sessions' | 'classes';

const ONGLETS: { cle: Onglet; libelle: string }[] = [
  { cle: 'formations', libelle: 'Mes formations' },
  { cle: 'programmes', libelle: 'Mes programmes' },
  { cle: 'sessions', libelle: 'Mes sessions' },
  { cle: 'classes', libelle: 'Classes virtuelles' },
];

/** Les anciennes adresses continuent d'ouvrir le bon onglet. */
const ANCIENS: Record<string, Onglet> = {
  'en-ligne': 'formations',
  presentiel: 'formations',
  catalogue: 'programmes',
};

/** Ce que chaque onglet contient, dit une fois, en haut. */
const QUOI: Record<Onglet, string> = {
  formations:
    "Ce que tu enseignes : chapitres, leçons, vidéos, documents, quiz. En ligne, en présentiel, en visio ou les deux — la modalité est une option de la formation, elle se règle dans sa fiche et se filtre ici.",
  programmes:
    "La fiche administrative de chaque formation : objectifs, public visé, prérequis, durée, déroulé. C'est ce que lisent l'auditeur et le financeur, et c'est ce qui donne lieu à des sessions et à des conventions.",
  sessions:
    "Les dates où la formation a lieu pour de vrai. C'est la session qui porte la convention, l'émargement et les évaluations.",
  classes:
    'Les rendez-vous en visio : une date, une heure, un lien. Ce que le e-learning ne fait pas — répondre aux questions, corriger ensemble.',
};

interface PageProps {
  searchParams: Promise<{ onglet?: string; modalite?: string }>;
}

/** Le rappel Qualiopi d'une session en salle, sous la liste des sessions. */
function RappelSalle({ sessions }: { sessions: Session[] }) {
  const sansLieu = sessions.filter((x) => !x.location?.trim());
  const salles = new Map<string, number>();
  for (const x of sessions) {
    const lieu = (x.location ?? '').trim();
    if (lieu) salles.set(lieu, (salles.get(lieu) ?? 0) + 1);
  }

  return (
    <>
      {sansLieu.length ? (
        <div className="mt-8">
          <Encart ton="attention">
            <span className="font-extrabold">
              {sansLieu.length} session{sansLieu.length > 1 ? 's' : ''}
            </span>{' '}
            sans lieu renseigné. Si elle se tient en salle, écris où : sans adresse, ni la convention ni
            l&apos;émargement ne tiennent.
          </Encart>
        </div>
      ) : null}

      {salles.size ? (
        <section className="mt-8">
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

      <section className={`${CARTE} mt-8 p-5`}>
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
  const { onglet: brut, modalite: modaliteBrute } = await searchParams;
  const onglet: Onglet = ONGLETS.some((o) => o.cle === brut)
    ? (brut as Onglet)
    : (ANCIENS[brut ?? ''] ?? 'formations');

  // « ?onglet=presentiel » ouvrait un écran ; il ouvre maintenant un filtre.
  const MODALITES: ModaliteCours[] = ['EN_LIGNE', 'PRESENTIEL', 'VIRTUEL', 'MIXTE'];
  const demandee = brut === 'presentiel' ? 'PRESENTIEL' : (modaliteBrute ?? '').toUpperCase();
  const modalite = MODALITES.includes(demandee as ModaliteCours) ? (demandee as ModaliteCours) : null;

  const s = await sessionAcademie('/academie/formations');

  let contenu: ReactNode = null;

  if (onglet === 'formations') {
    const { data, error } = await apiAcademie<CoursResume[]>(s, '/ecole/cours');
    contenu = data ? (
      <ListeCours cours={Array.isArray(data) ? data : []} origine={ORIGINE_SITE} modaliteInitiale={modalite} />
    ) : (
      <Encart ton="attention">{error ?? 'Les formations ne se chargent pas pour le moment.'}</Encart>
    );
  } else if (onglet === 'programmes') {
    const { data, error } = await apiAcademie<{ items?: Programme[] } | Programme[]>(s, '/formations?perPage=100');
    const liste = Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : null;
    contenu = liste ? (
      <Programmes initiaux={liste} />
    ) : (
      <Encart ton="attention">{error ?? 'Le catalogue ne se charge pas pour le moment.'}</Encart>
    );
  } else if (onglet === 'sessions') {
    const [sessions, catalogue] = await Promise.all([
      apiAcademie<Session[]>(s, '/formations/mes-sessions'),
      apiAcademie<{ items?: Programme[] } | Programme[]>(s, '/formations?perPage=100'),
    ]);
    const c = catalogue.data;
    const toutes = Array.isArray(sessions.data) ? sessions.data : [];
    contenu =
      sessions.data || catalogue.data ? (
        <>
          <Sessions
            initiales={toutes}
            programmes={Array.isArray(c) ? c : Array.isArray(c?.items) ? c.items : []}
          />
          <RappelSalle sessions={toutes} />
        </>
      ) : (
        <Encart ton="attention">{sessions.error ?? 'Les sessions ne se chargent pas pour le moment.'}</Encart>
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
        sousTitre="Le contenu, la façon dont on l'apprend, et les dates auxquelles ça se passe : trois questions sur une même formation, au même endroit."
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
                  href={o.cle === 'formations' ? '/academie/formations' : `/academie/formations?onglet=${o.cle}`}
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
