import Link from 'next/link';
import type { Metadata } from 'next';
import { apiAcademie, sessionAcademie } from '../_session';
import { BTN_DISCRET, CARTE, Pastille, Titre } from '../_ui';
import type { FormateurOrg, SalleOrg } from '../_gestion/types';
import { Annuaire } from './Annuaire';

export const metadata: Metadata = { title: 'Formateurs et salles', robots: { index: false, follow: false } };

interface FormateurCompte {
  userId: string;
  name: string;
  job: string | null;
  skills: string[];
}

/**
 * `/academie/formateurs` — QUI ANIME, OÙ, ET CE QUI PROUVE SA COMPÉTENCE.
 *
 * L'annuaire ne demande à personne d'ouvrir un compte : un formateur
 * occasionnel n'en a aucune raison. Il porte ce que l'indicateur 21 demande
 * (métier, compétences, diplômes et références) et ce que le BPF compte
 * (personne de l'organisme ou prestataire extérieur). Les salles y vivent
 * aussi : c'est avec elles que le planning détecte les conflits.
 *
 * Les membres de l'équipe qui ont un compte restent listés en dessous : ils
 * complètent leur profil eux-mêmes.
 */
export default async function FormateursPage({ searchParams }: { searchParams: Promise<{ onglet?: string }> }) {
  const s = await sessionAcademie('/academie/formateurs');
  const { onglet } = await searchParams;
  const [formateurs, salles, comptes] = await Promise.all([
    apiAcademie<FormateurOrg[]>(s, '/academie/gestion/formateurs'),
    apiAcademie<SalleOrg[]>(s, '/academie/gestion/salles'),
    apiAcademie<FormateurCompte[]>(s, '/formations/internal-trainers'),
  ]);
  const equipe = Array.isArray(comptes.data) ? comptes.data : [];

  return (
    <>
      <Titre surtitre="Gestion de l’organisme · critère 5 du référentiel" sousTitre="Ton annuaire de formateurs, internes ou prestataires, et tes salles.">
        Formateurs et salles
      </Titre>
      <Annuaire formateurs={formateurs.data ?? []} salles={salles.data ?? []} ongletInitial={onglet === 'salles' ? 'salles' : 'formateurs'} erreur={formateurs.error ?? salles.error ?? null} />

      {equipe.length ? (
        <section className={`${CARTE} mt-8 p-5 sm:p-6`}>
          <div className="mb-3 flex flex-wrap items-center gap-3">
            <h2 className="text-[18px] font-extrabold text-[#12312A]">Les membres de l&apos;équipe qui ont un compte ({equipe.length})</h2>
            <Link href="/academie/droits-acces" className={`${BTN_DISCRET} ml-auto`}>
              Inviter quelqu&apos;un
            </Link>
          </div>
          <ul className="grid gap-2">
            {equipe.map((f) => (
              <li key={f.userId} className="flex flex-wrap items-center gap-2 rounded-xl border border-[#DDEBE4] px-4 py-2">
                <span className="font-bold text-[#12312A]">{f.name}</span>
                <span className="text-[14px] text-[#5E7A6E]">{f.job || 'Métier non renseigné'}</span>
                {f.job && f.skills?.length ? <Pastille ton="ok">Profil complet</Pastille> : <Pastille ton="attention">À compléter par la personne</Pastille>}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className={`${CARTE} mt-8 p-5`}>
        <h2 className="text-[18px] font-extrabold text-[#12312A]">Ce que l&apos;auditeur regarde</h2>
        <ul className="mt-2 grid gap-2 text-[15px] leading-relaxed text-[#334A42]">
          <li>
            <span className="font-bold">Indicateur 17</span>, les moyens : des salles adaptées, accessibles, équipées.
          </li>
          <li>
            <span className="font-bold">Indicateur 21</span>, la compétence des formateurs : un métier, des compétences, des diplômes ou des références.
          </li>
          <li>
            <span className="font-bold">Indicateur 22</span>, leur maintien à niveau : c&apos;est ta veille qui le montre.{' '}
            <Link href="/academie/veille" className="font-bold underline underline-offset-2">
              Ma veille
            </Link>
          </li>
          <li>
            <span className="font-bold">Indicateur 26</span>, le référent handicap : une personne nommée.{' '}
            <Link href="/academie/mon-academie#fiche" className="font-bold underline underline-offset-2">
              Mon académie
            </Link>
          </li>
        </ul>
      </section>
    </>
  );
}
