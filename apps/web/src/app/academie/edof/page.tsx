import Link from 'next/link';
import type { Metadata } from 'next';
import { apiAcademie, sessionAcademie } from '../_session';
import { BTN_SECONDAIRE, CARTE, Encart, Pastille, SousTitre, Titre } from '../_ui';

export const metadata: Metadata = { title: 'Mon Compte Formation (EDOF)', robots: { index: false, follow: false } };

interface Point {
  cle: string;
  libelle: string;
  ok: boolean;
  aide: string;
}
interface Preparation {
  organisme: Point[];
  organismePret: boolean;
  formations: { id: string; titre: string; eligible: boolean; pret: boolean; manque: number; points: Point[] }[];
  lien: string;
}

function Liste({ points }: { points: Point[] }) {
  return (
    <ul className="grid gap-2">
      {points.map((p) => (
        <li key={p.cle} className="flex items-start gap-3 text-[15px]">
          <span aria-hidden="true" className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-sm font-extrabold ${p.ok ? 'bg-[#1E9E6A] text-white' : 'border-2 border-[#F5D6A8] bg-[#FEF3E2] text-[#B45309]'}`}>
            {p.ok ? '✓' : '!'}
          </span>
          <span>
            <span className={p.ok ? 'text-[#334A42]' : 'font-bold text-[#12312A]'}>{p.libelle}</span>
            {!p.ok ? <span className="block text-sm text-[#5E7A6E]">{p.aide}</span> : null}
            <span className="sr-only">{p.ok ? ' : prêt' : ' : à faire'}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

/**
 * `/academie/edof` : PRÉPARER LA MISE EN LIGNE SUR MON COMPTE FORMATION.
 *
 * On ne se connecte pas à EDOF à la place de l'organisme (ProConnect, avec les
 * identifiants de son représentant). On vérifie que tout ce que le formulaire
 * demandera est prêt, formation par formation.
 */
export default async function EdofPage() {
  const s = await sessionAcademie('/academie/edof');
  const { data, error } = await apiAcademie<Preparation>(s, '/academie/gestion/edof');
  return (
    <>
      <Titre
        surtitre="Gestion de l’organisme · CPF"
        sousTitre="Déposer une formation éligible au CPF se fait sur l'espace des organismes de la Caisse des dépôts (EDOF). Avant d'y aller, vérifie ici que rien ne manque."
        actions={
          <a className={BTN_SECONDAIRE} href={data?.lien ?? 'https://www.of.moncompteformation.gouv.fr/'} target="_blank" rel="noopener noreferrer">
            Ouvrir EDOF ↗
          </a>
        }
      >
        Mon Compte Formation
      </Titre>
      {!data ? (
        <Encart ton="attention">{error ?? 'La préparation ne se charge pas pour le moment.'}</Encart>
      ) : (
        <>
          <section className={`${CARTE} mb-6 p-5 sm:p-6`}>
            <SousTitre>L&apos;organisme</SousTitre>
            <Liste points={data.organisme} />
            {!data.organismePret ? (
              <p className="mt-3 text-sm">
                <Link href="/academie/mon-academie#fiche" className="font-bold text-[#0F5F3E] underline underline-offset-4">
                  Compléter la fiche de l&apos;organisme
                </Link>
              </p>
            ) : null}
          </section>
          <Encart ton="info">
            Seules les formations qui mènent à une certification enregistrée (RNCP ou répertoire spécifique), les bilans de compétences et
            l&apos;accompagnement à la VAE sont éligibles au CPF. Les autres n&apos;ont pas leur place sur EDOF, et c&apos;est normal.
          </Encart>
          <div className="mt-6 grid gap-4">
            {data.formations.map((f) => (
              <section key={f.id} className={`${CARTE} p-5 sm:p-6`}>
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <h2 className="text-[18px] font-extrabold text-[#12312A]">{f.titre}</h2>
                  {f.pret ? <Pastille ton="ok">Prête pour EDOF</Pastille> : f.eligible ? <Pastille ton="attention">{f.manque} point{f.manque > 1 ? 's' : ''} à compléter</Pastille> : <Pastille ton="neutre">Non éligible au CPF</Pastille>}
                </div>
                {f.eligible || f.pret ? <Liste points={f.points} /> : <p className="text-[15px] text-[#5E7A6E]">Si elle prépare une certification RNCP ou RS, règle son objectif dans le classement du programme (fiche d&apos;une de ses sessions, onglet Aperçu).</p>}
              </section>
            ))}
            {!data.formations.length ? <Encart ton="info">Aucune formation au catalogue.</Encart> : null}
          </div>
        </>
      )}
    </>
  );
}
