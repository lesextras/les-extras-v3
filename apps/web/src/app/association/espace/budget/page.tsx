import Link from 'next/link';
import { apiEspace, sessionAssociation } from '../../_session';
import { CARTE, Encart, Titre, Tuile } from '../../_ui';
import { LIBELLES_NATURE_MOUVEMENT, formaterEuros, type Mouvement, type NatureMouvement, type ResumeBudget } from '../_types';
import { Mouvements } from './Mouvements';

/**
 * MA GESTION BUDGÉTAIRE : le cahier de comptes de l'association. Les dons, les
 * cotisations, la buvette, les subventions reçues, et tout ce qui sort.
 */
export default async function BudgetPage() {
  const s = await sessionAssociation('/espace/budget');
  const { data, error } = await apiEspace<{ mouvements: Mouvement[]; resume: ResumeBudget }>(s, '/association/mouvements');
  if (!data) return <Encart ton="attention">{error ?? 'Le cahier de comptes ne se charge pas pour le moment.'}</Encart>;
  const { mouvements, resume } = data;

  const familles: { libelle: string; nature: NatureMouvement; montant: number }[] = [
    { libelle: 'Dons', nature: 'DON', montant: resume.dons },
    { libelle: 'Adhésions et cotisations', nature: 'ADHESION', montant: resume.adhesions },
    { libelle: 'Ventes et billetterie', nature: 'VENTE', montant: resume.ventes },
    { libelle: 'Subventions reçues', nature: 'SUBVENTION', montant: resume.subventions },
  ];

  return (
    <>
      <Titre
        surtitre="L'argent de l'association"
        sousTitre="Une ligne par mouvement : ce qui entre (dons, cotisations, ventes, subventions) et ce qui sort. C'est ce cahier qu'on présente en assemblée générale et qu'un financeur peut demander."
      >
        Ma gestion budgétaire
      </Titre>

      <section className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Tuile libelle="Ce qui est entré" valeur={formaterEuros(resume.recettes)} detail={`${formaterEuros(resume.recettesAnnee)} en ${resume.annee}`} ton="ok" />
        <Tuile libelle="Ce qui est sorti" valeur={formaterEuros(resume.depenses)} detail={`${formaterEuros(resume.depensesAnnee)} en ${resume.annee}`} />
        <Tuile libelle="Solde" valeur={formaterEuros(resume.solde)} detail={resume.solde < 0 ? 'Les dépenses dépassent les entrées' : 'Entrées moins sorties'} ton={resume.solde < 0 ? 'alerte' : 'ok'} />
        <Tuile libelle="Lignes notées" valeur={resume.lignes} detail={`${resume.donsAvecRecu} reçu${resume.donsAvecRecu > 1 ? 's' : ''} fiscal${resume.donsAvecRecu > 1 ? 'aux' : ''} envoyé${resume.donsAvecRecu > 1 ? 's' : ''}`} />
      </section>

      <section className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {familles.map((f) => (
          <div key={f.nature} className={`${CARTE} px-5 py-4`}>
            <p className="text-sm font-bold text-[#6B6A8A]">{f.libelle}</p>
            <p className="text-2xl font-extrabold tabular-nums text-[#1D1B5C]">{formaterEuros(f.montant)}</p>
            <p className="text-sm text-[#6B6A8A]">{LIBELLES_NATURE_MOUVEMENT[f.nature]}</p>
          </div>
        ))}
      </section>

      <Mouvements mouvements={mouvements} />

      <p className="mt-6 text-sm text-[#6B6A8A]">
        Pour encaisser les dons et les cotisations en ligne (et éditer les reçus fiscaux automatiquement),{' '}
        <Link href="/outils" className="font-bold text-[#4F46E5] underline underline-offset-4">
          voir les outils utiles
        </Link>
        . Le budget d&apos;un projet précis se remplit dans{' '}
        <Link href="/espace/dossiers" className="font-bold text-[#4F46E5] underline underline-offset-4">
          sa demande de subvention
        </Link>
        .
      </p>
    </>
  );
}
