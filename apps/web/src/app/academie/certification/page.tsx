/* Textes allégés le 01/10/2026 (demande : le moins de texte possible) */
import Link from 'next/link';
import type { Metadata } from 'next';
import { apiAcademie, sessionAcademie } from '../_session';
import { CarteAssociation } from '../_association';
import type { AssociationReliee } from '../../_shared/liaisons/types';
import { BTN_SECONDAIRE, CARTE, Encart, Pastille, SousTitre, Titre, formaterDate } from '../_ui';
import { LIBELLES_QUALIOPI, type FicheAcademie } from '../_types';
import { ReferentielQualiopi, type Referentiel } from './Referentiel';

// Écran de l'espace (session requise) : hors des moteurs.
interface PointEdof {
  cle: string;
  libelle: string;
  ok: boolean;
}
interface PreparationEdof {
  organisme: PointEdof[];
  organismePret: boolean;
  formations: { id: string; titre: string; eligible: boolean; pret: boolean; manque: number }[];
  lien: string;
}

export const metadata: Metadata = { title: 'Ma certification Qualiopi et EDOF', robots: { index: false, follow: false } };

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
  const [fiche, ref, edof, reliees] = await Promise.all([
    apiAcademie<FicheAcademie>(s, '/academie/fiche'),
    apiAcademie<Referentiel>(s, '/academie/qualiopi'),
    apiAcademie<PreparationEdof>(s, '/academie/gestion/edof'),
    apiAcademie<{ associations: AssociationReliee[] }>(s, '/academie/association'),
  ]);
  const e = edof.data;
  const eligibles = e ? e.formations.filter((f) => f.eligible || f.pret) : [];
  const pretes = eligibles.filter((f) => f.pret).length;

  const a = fiche.data;

  return (
    <>
      <Titre
        surtitre="Qualité et CPF"
        sousTitre="Une preuve par indicateur, et tes formations prêtes pour Mon Compte Formation."
        info="Cet outil ne délivre aucune certification : il tient tes preuves prêtes pour l'audit."
      >
        Qualiopi et EDOF
      </Titre>

      <nav className="-mt-2 mb-6 flex flex-wrap gap-2 text-sm font-bold">
        <a href="#qualiopi" className="rounded-full border border-[#B7E4CE] bg-white px-4 py-2 text-[#12312A] no-underline hover:bg-[#E3F5EC]">Qualiopi</a>
        <a href="#edof" className="rounded-full border border-[#B7E4CE] bg-white px-4 py-2 text-[#12312A] no-underline hover:bg-[#E3F5EC]">EDOF · CPF</a>
      </nav>

      {/* ------------------------- l'association reliée et ses agréments (lecture seule) */}
      {reliees.data?.associations?.length ? (
        <div className="mb-6 grid gap-4">
          <CarteAssociation associations={reliees.data.associations} lienReglages={false} />
        </div>
      ) : null}

      {/* ------------------------------------------------- l'état administratif */}
      {a ? (
        <section id="qualiopi" className={`${CARTE} mb-6 scroll-mt-24 p-5 sm:p-6`}>
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

      {/* ------------------------------------------------------------ EDOF */}
      <section id="edof" className="mt-10 scroll-mt-24">
        <SousTitre info="On ne se connecte pas à EDOF à ta place : on vérifie que tout est prêt.">EDOF · Mon Compte Formation</SousTitre>
        {e ? (
          <div className={`${CARTE} p-5 sm:p-6`}>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <p className="text-[12px] font-extrabold uppercase tracking-[0.1em] text-[#5E7A6E]">Organisme</p>
                <p className="mt-1">
                  {e.organismePret ? <Pastille ton="ok">Prêt</Pastille> : <Pastille ton="attention">{e.organisme.filter((p) => !p.ok).length} point(s) à compléter</Pastille>}
                </p>
              </div>
              <div>
                <p className="text-[12px] font-extrabold uppercase tracking-[0.1em] text-[#5E7A6E]">Formations éligibles CPF</p>
                <p className="mt-1 text-[16px] font-extrabold text-[#12312A]">{eligibles.length}</p>
              </div>
              <div>
                <p className="text-[12px] font-extrabold uppercase tracking-[0.1em] text-[#5E7A6E]">Prêtes pour EDOF</p>
                <p className="mt-1 text-[16px] font-extrabold text-[#12312A]">{pretes} / {eligibles.length}</p>
              </div>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link href="/academie/edof" className="rounded-xl bg-[#1E9E6A] px-4 py-2.5 text-sm font-bold text-white no-underline hover:bg-[#0F5F3E]">
                Préparer EDOF →
              </Link>
              <a className={`${BTN_SECONDAIRE} !py-2.5 text-sm`} href={e.lien || 'https://www.of.moncompteformation.gouv.fr/'} target="_blank" rel="noopener noreferrer">
                Ouvrir EDOF ↗
              </a>
            </div>
          </div>
        ) : (
          <Encart ton="attention">{edof.error ?? 'EDOF ne se charge pas pour le moment.'}</Encart>
        )}
      </section>

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
