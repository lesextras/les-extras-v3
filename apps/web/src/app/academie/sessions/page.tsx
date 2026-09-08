import Link from 'next/link';
import type { Metadata } from 'next';
import { apiAcademie, sessionAcademie } from '../_session';
import { Encart, Titre } from '../_ui';
import { Sessions, type Programme, type Session } from './Sessions';

export const metadata: Metadata = { title: 'Mes sessions' };

/** `/academie/sessions` — les dates où la formation a lieu pour de vrai. */
export default async function SessionsPage() {
  const s = await sessionAcademie('/academie/sessions');
  const [sessions, catalogue] = await Promise.all([
    apiAcademie<Session[]>(s, '/formations/mes-sessions'),
    apiAcademie<{ items?: Programme[] } | Programme[]>(s, '/formations?perPage=100'),
  ]);

  const liste = Array.isArray(sessions.data) ? sessions.data : [];
  const c = catalogue.data;
  const programmes = Array.isArray(c) ? c : Array.isArray(c?.items) ? c.items : [];

  return (
    <>
      <Titre
        surtitre="Ce qui se passe vraiment"
        sousTitre="Une formation au catalogue ne prouve rien : ce sont les sessions qui portent la convention, l'émargement et les évaluations. C'est là que l'audit regarde."
      >
        Mes sessions
      </Titre>

      {sessions.data || catalogue.data ? (
        <Sessions initiales={liste} programmes={programmes} />
      ) : (
        <Encart ton="attention">{sessions.error ?? 'Les sessions ne se chargent pas pour le moment.'}</Encart>
      )}

      <p className="mt-8 max-w-[75ch] text-[14px] leading-relaxed text-[#5E7A6E]">
        Les formations elles-mêmes se créent dans{' '}
        <Link href="/academie/catalogue" className="font-bold text-[#0F5F3E] underline underline-offset-4">
          Mon catalogue
        </Link>
        , et les personnes inscrites se suivent dans{' '}
        <Link href="/academie/apprenants" className="font-bold text-[#0F5F3E] underline underline-offset-4">
          Mes apprenants
        </Link>
        .
      </p>
    </>
  );
}
