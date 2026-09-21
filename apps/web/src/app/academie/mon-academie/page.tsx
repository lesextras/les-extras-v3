import Link from 'next/link';
import type { Metadata } from 'next';
import { apiAcademie, sessionAcademie } from '../_session';
import { Barre, CARTE, Carte, Encart, Pastille, SousTitre, Titre, formaterDate } from '../_ui';
import { LIBELLES_QUALIOPI, type EspaceAcademie } from '../_types';
import { FormulaireFiche } from './FormulaireFiche';

export const metadata: Metadata = { title: 'Mon académie', robots: { index: false, follow: false } };

/**
 * MON ACADÉMIE : trois cartes vers les pages dédiées — la certification, la
 * comptabilité, le secrétariat — puis la fiche de l'organisme. Le même
 * fonctionnement que « Mon association ».
 */
export default async function MonAcademiePage() {
  const s = await sessionAcademie('/academie/mon-academie');
  const { data, error } = await apiAcademie<EspaceAcademie>(s, '/academie/espace');
  if (!data) return <Encart ton="attention">{error ?? 'La fiche ne se charge pas pour le moment.'}</Encart>;

  const { academie, qualiopi, reclamations, veille } = data;

  /** Trois portes, trois couleurs : chacune mène à sa page, on ne les confond pas. */
  const PORTES = [
    {
      href: '/academie/certification',
      titre: 'Ma certification',
      detail: `Les 7 critères et les ${qualiopi.indicateurs || 32} indicateurs Qualiopi, leurs preuves, et le jour de l'audit. ${qualiopi.couverture} % de couverture aujourd'hui.`,
      bouton: 'Ouvrir ma certification',
      bordure: 'border-[#B7E4CE] hover:border-[#1E9E6A]',
      fond: 'bg-[#E3F5EC]',
      pastille: 'bg-[#1E9E6A]',
      texte: 'text-[#0F5F3E]',
      icone: 'M12 15a6 6 0 1 0 0-12 6 6 0 0 0 0 12zM8.2 13.8L7 22l5-3 5 3-1.2-8.2',
    },
    {
      href: '/academie/comptabilite',
      titre: 'Ma comptabilité',
      detail:
        "Devis, conventions, factures, subrogation OPCO, encaissements, et le bilan pédagogique et financier à déposer chaque année.",
      bouton: 'Ouvrir ma comptabilité',
      bordure: 'border-[#F3B0C2] hover:border-[#D6335C]',
      fond: 'bg-[#FDE7EC]',
      pastille: 'bg-[#D6335C]',
      texte: 'text-[#C42B57]',
      icone: 'M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6',
    },
    {
      href: '/academie/secretariat',
      titre: 'Mon secrétariat',
      detail:
        "Le règlement intérieur, les CGV, le livret d'accueil, la procédure de réclamation, le récépissé de déclaration : tous tes papiers au même endroit.",
      bouton: 'Ouvrir mon secrétariat',
      bordure: 'border-[#C7C4F2] hover:border-[#4F46E5]',
      fond: 'bg-[#ECEBFC]',
      pastille: 'bg-[#4F46E5]',
      texte: 'text-[#4338CA]',
      icone: 'M15 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7zM15 3v4h4M9 13h6M9 17h6',
    },
  ];

  return (
    <>
      <Titre
        surtitre="Mon académie"
        sousTitre="Ce qu'un financeur et un auditeur vérifient en premier : qui tu es, ce que tu es autorisé à faire, et où sont tes preuves."
      >
        {academie.nom}
      </Titre>

      {/* ------------------------------------------- les trois grandes portes */}
      <section className="mb-8 grid gap-4 md:grid-cols-3">
        {PORTES.map((p) => (
          <Link
            key={p.href}
            href={p.href}
            className={`group flex flex-col rounded-2xl border-2 ${p.bordure} ${p.fond} p-5 no-underline transition duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_16px_34px_-18px_rgba(15,95,62,0.5)] motion-reduce:transition-none motion-reduce:hover:translate-y-0`}
          >
            <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${p.pastille} text-white`} aria-hidden="true">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d={p.icone} />
              </svg>
            </span>
            <span className="mt-3 block text-lg font-extrabold text-[#12312A]">{p.titre}</span>
            <span className="mt-1 block text-sm leading-relaxed text-[#334A42]">{p.detail}</span>
            <span className={`mt-auto pt-4 text-sm font-bold ${p.texte}`}>
              {p.bouton} <span className="inline-block transition-transform duration-300 group-hover:translate-x-1">→</span>
            </span>
          </Link>
        ))}
      </section>

      {/* --------------------------------------------------- l'état en un coup */}
      <section className="mb-8 grid gap-4 md:grid-cols-3">
        <Carte>
          <p className="text-sm font-bold text-[#5E7A6E]">Certification</p>
          <p className="mt-1 font-extrabold text-[#12312A]">{LIBELLES_QUALIOPI[academie.qualiopi]}</p>
          <div className="mt-3">
            <Barre pourcentage={qualiopi.couverture} />
          </div>
          <p className="mt-2 text-sm text-[#5E7A6E]">{qualiopi.couverture} % des indicateurs couverts</p>
          {academie.auditPrevuLe ? <p className="mt-1 text-sm text-[#5E7A6E]">Audit le {formaterDate(academie.auditPrevuLe)}</p> : null}
        </Carte>
        <Carte>
          <p className="text-sm font-bold text-[#5E7A6E]">Journal de veille</p>
          <p className="mt-1 text-2xl font-extrabold tabular-nums text-[#12312A]">{veille.total}</p>
          <p className="mt-1 text-sm leading-relaxed text-[#5E7A6E]">
            {veille.total ? 'entrées récentes' : "Aucune entrée : trois indicateurs du critère 6 en dépendent."}
          </p>
          <Link href="/academie/veille" className="mt-2 inline-block text-sm font-bold text-[#0F5F3E] underline underline-offset-4">
            Tenir ma veille →
          </Link>
        </Carte>
        <Carte>
          <p className="text-sm font-bold text-[#5E7A6E]">Réclamations en cours</p>
          <p className="mt-1 text-2xl font-extrabold tabular-nums text-[#12312A]">{reclamations.ouvertes}</p>
          <p className="mt-1 text-sm leading-relaxed text-[#5E7A6E]">Le critère 7 demande la trace du traitement, pas seulement celle de la plainte.</p>
          <Link href="/academie/reclamations" className="mt-2 inline-block text-sm font-bold text-[#0F5F3E] underline underline-offset-4">
            Ouvrir le registre →
          </Link>
        </Carte>
      </section>

      {/* ------------------------------------------------------------- la fiche */}
      <section id="fiche" className={`${CARTE} p-5 sm:p-7`}>
        <SousTitre>La fiche de mon organisme</SousTitre>
        <p className="mb-5 max-w-[68ch] text-sm leading-relaxed text-[#5E7A6E]">
          Ce que l&apos;espace recopie partout ailleurs : dans tes documents, dans tes conventions, et dans les étapes du chemin
          qui se cochent toutes seules quand la donnée arrive.
        </p>
        {academie.nda ? null : (
          <div className="mb-5">
            <Encart ton="attention">
              Ton numéro de déclaration d&apos;activité manque. Tant qu&apos;il n&apos;est pas là, aucune convention ne peut être
              facturée en formation professionnelle, mais tu peux tout préparer sans lui.
            </Encart>
          </div>
        )}
        <FormulaireFiche fiche={academie} />
      </section>

      <p className="mt-6 text-sm text-[#5E7A6E]">
        <Pastille ton="neutre">Rappel</Pastille>{' '}
        <span className="ml-2">
          La mention légale exacte à faire figurer sur tes documents est : « Cet enregistrement ne vaut pas agrément de
          l&apos;État. »
        </span>
      </p>
    </>
  );
}
