import Link from 'next/link';
import type { Metadata } from 'next';
import { apiAcademie, sessionAcademie } from '../_session';
import { CARTE, Encart, Titre, formaterDate } from '../_ui';
import { LIBELLES_QUALIOPI, type FicheAcademie } from '../_types';
import { ReferentielQualiopi, type Referentiel } from './Referentiel';

export const metadata: Metadata = { title: 'Ma certification Qualiopi' };

/**
 * `/academie/certification` — OÙ EN EST LA CERTIFICATION.
 *
 * Deux choses sur un même écran : l'état administratif (engagée ou non,
 * certificateur, dates) qui vient de la fiche, et la couverture du référentiel,
 * indicateur par indicateur. Le second est le vrai travail ; le premier dit
 * seulement à quel moment du parcours on se trouve.
 */
export default async function CertificationPage() {
  const s = await sessionAcademie('/academie/certification');
  const [fiche, ref] = await Promise.all([
    apiAcademie<FicheAcademie>(s, '/academie/fiche'),
    apiAcademie<Referentiel>(s, '/academie/qualiopi'),
  ]);

  const a = fiche.data;

  return (
    <>
      <Titre
        surtitre="Référentiel national qualité"
        sousTitre="Sept critères, trente-deux indicateurs, une preuve pour chacun. Ce qui manque est en haut de la liste ; ce qui ne te concerne pas se met de côté."
      >
        Ma certification Qualiopi
      </Titre>

      {/* ------------------------------------------------- l'état administratif */}
      {a ? (
        <section className={`${CARTE} mb-6 p-5 sm:p-6`}>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Ligne libelle="Où tu en es" valeur={LIBELLES_QUALIOPI[a.qualiopi]} />
            <Ligne libelle="Certificateur" valeur={a.certificateur || 'Pas encore choisi'} />
            <Ligne libelle="Audit prévu le" valeur={a.auditPrevuLe ? formaterDate(a.auditPrevuLe) : 'Pas de date'} />
            <Ligne
              libelle="Certificat valable"
              valeur={a.certifieDu && a.certifieAu ? `${formaterDate(a.certifieDu)} → ${formaterDate(a.certifieAu)}` : 'Pas encore certifiée'}
            />
          </div>
          <p className="mt-4 text-[14px] text-[#5E7A6E]">
            Ces quatre informations se corrigent dans{' '}
            <Link href="/academie/mon-academie" className="font-bold text-[#0F5F3E] underline underline-offset-4">
              la fiche de l&apos;organisme
            </Link>
            .
          </p>
        </section>
      ) : null}

      {a && a.qualiopi === 'PAS_ENGAGE' ? (
        <div className="mb-6">
          <Encart ton="info">
            La certification vient <span className="font-extrabold">après</span> la déclaration d&apos;activité, jamais
            avant : elle porte sur des pratiques qu&apos;il faut avoir commencé à tenir. Tu peux préparer les preuves dès
            maintenant — c&apos;est même la bonne façon de s&apos;y prendre.
          </Encart>
        </div>
      ) : null}

      {/* --------------------------------------------------- le référentiel */}
      {ref.data && Array.isArray(ref.data.criteres) && ref.data.criteres.length ? (
        <ReferentielQualiopi initial={ref.data} />
      ) : (
        <Encart ton="attention">
          {ref.error ?? "Le référentiel ne se charge pas pour le moment. Réessaie dans un instant."}
        </Encart>
      )}

      <p className="mt-8 max-w-[75ch] text-[14px] leading-relaxed text-[#5E7A6E]">
        Cet outil ne délivre aucune certification et ne remplace pas un certificateur accrédité : il tient tes preuves
        prêtes pour le jour de l&apos;audit. Le référentiel affiché est le référentiel national qualité.
      </p>
    </>
  );
}

function Ligne({ libelle, valeur }: { libelle: string; valeur: string | null }) {
  return (
    <div>
      <p className="text-[12px] font-extrabold uppercase tracking-[0.1em] text-[#5E7A6E]">{libelle}</p>
      <p className="mt-1 text-[16px] font-extrabold leading-snug text-[#12312A]">{valeur || '—'}</p>
    </div>
  );
}
