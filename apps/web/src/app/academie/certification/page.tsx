/* Textes allégés le 01/10/2026 (demande : le moins de texte possible) */
import Link from 'next/link';
import type { Metadata } from 'next';
import { apiAcademie, sessionAcademie } from '../_session';
import { CARTE, Encart, Titre, formaterDate } from '../_ui';
import { LIBELLES_QUALIOPI, type FicheAcademie } from '../_types';
import { ReferentielQualiopi, type Referentiel } from './Referentiel';

// Écran de l'espace (session requise) : hors des moteurs.
export const metadata: Metadata = { title: 'Ma certification Qualiopi', robots: { index: false, follow: false } };

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
        sousTitre="Une preuve par indicateur."
        info="Cet outil ne délivre aucune certification : il tient tes preuves prêtes pour l'audit."
      >
        Ma certification
      </Titre>

      {/* ------------------------------------------------- l'état administratif */}
      {a ? (
        <section className={`${CARTE} mb-6 p-5 sm:p-6`}>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Ligne libelle="État" valeur={LIBELLES_QUALIOPI[a.qualiopi]} />
            <Ligne libelle="Certificateur" valeur={a.certificateur || 'À choisir'} />
            <Ligne libelle="Audit prévu le" valeur={a.auditPrevuLe ? formaterDate(a.auditPrevuLe) : 'Pas de date'} />
            <Ligne
              libelle="Certificat valable"
              valeur={a.certifieDu && a.certifieAu ? `${formaterDate(a.certifieDu)} → ${formaterDate(a.certifieAu)}` : '—'}
            />
          </div>
          <p className="mt-4 text-[14px] text-[#5E7A6E]">
            <Link href="/academie/mon-academie" className="font-bold text-[#0F5F3E] underline underline-offset-4">
              Modifier
            </Link>
          </p>
        </section>
      ) : null}

      {a && a.qualiopi === 'PAS_ENGAGE' ? (
        <div className="mb-6">
          <Encart ton="info">
            Certification <span className="font-extrabold">après</span> la déclaration d&apos;activité. Prépare tes preuves dès maintenant.
          </Encart>
        </div>
      ) : null}

      {/* --------------------------------------------------- le référentiel */}
      {ref.data && Array.isArray(ref.data.criteres) && ref.data.criteres.length ? (
        <ReferentielQualiopi initial={ref.data} />
      ) : (
        <Encart ton="attention">
          {ref.error ?? 'Chargement impossible. Réessaie.'}
        </Encart>
      )}

      <p className="mt-8 text-[13px] text-[#5E7A6E]">Outil de préparation · ne remplace pas un certificateur accrédité.</p>
    </>
  );
}

function Ligne({ libelle, valeur }: { libelle: string; valeur: string | null }) {
  return (
    <div>
      <p className="text-[12px] font-extrabold uppercase tracking-[0.1em] text-[#5E7A6E]">{libelle}</p>
      <p className="mt-1 text-[16px] font-extrabold leading-snug text-[#12312A]">{valeur || 'Non renseigné'}</p>
    </div>
  );
}
