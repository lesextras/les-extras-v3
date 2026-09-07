import Link from 'next/link';
import { apiEspace, sessionAssociation } from '../../_session';
import { nomCourt } from '../../_nom';
import { Barre, BTN_SECONDAIRE, CARTE, Encart, Titre, Tuile } from '../../_ui';
import { CATEGORIES, type Espace } from '../_types';
import { PieceDuClasseur } from './PieceDuClasseur';

/**
 * LE CLASSEUR. Treize pièces, rangées par famille. Chacune dit où elle en
 * est, à quoi elle sert, où la trouver ; on y dépose un fichier, on note sa
 * date, et le lundi s'occupe du reste.
 */
export default async function ClasseurPage() {
  const s = await sessionAssociation('/espace/classeur');
  const { data, error } = await apiEspace<Espace>(s, '/association/espace');
  if (!data) return <Encart ton="attention">{error ?? 'Le classeur ne se charge pas pour le moment.'}</Encart>;

  const parCategorie = data.classeur.reduce<Record<string, Espace['classeur']>>((acc, l) => {
    (acc[l.type.categorie] ??= []).push(l);
    return acc;
  }, {});
  const pretes = data.classeur.filter((l) => l.situation === 'A_JOUR' || l.situation === 'DEDUITE').length;
  const bientot = data.classeur.filter((l) => l.situation === 'BIENTOT_PERIMEE').length;
  const perimees = data.classeur.filter((l) => l.situation === 'PERIMEE').length;
  const manquantes = data.classeur.filter((l) => l.situation === 'MANQUANTE').length;

  return (
    <>
      <Titre
        surtitre="Le classeur"
        sousTitre="Les treize papiers que les financeurs demandent. Tu déposes un fichier, tu notes sa date : on te prévient 60 jours avant qu'il expire."
        actions={
          <Link href="/chemin/les-cinq-pieces-d-identite" className="inline-flex items-center rounded-xl border-2 border-[#D9D6EE] bg-white px-4 py-2 text-sm font-bold text-[#1D1B5C] no-underline hover:border-[#4F46E5]">
            Où trouver chaque papier
          </Link>
        }
      >
        {nomCourt(data.organisation.nom)}
      </Titre>

      <section className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Tuile libelle="Prêtes" valeur={`${pretes} / ${data.classeur.length}`} ton="ok" />
        <Tuile libelle="À fournir" valeur={manquantes} ton={manquantes ? 'neutre' : 'ok'} />
        <Tuile libelle="Expirent bientôt" valeur={bientot} ton={bientot ? 'attention' : 'neutre'} />
        <Tuile libelle="Périmées" valeur={perimees} ton={perimees ? 'alerte' : 'neutre'} />
      </section>
      <div className="mb-8">
        <Barre pourcentage={Math.round((pretes / data.classeur.length) * 100)} ton="ok" />
      </div>

      <div className="space-y-8">
        {Object.entries(parCategorie).map(([cat, lignes]) => (
          <section key={cat}>
            <h2 className="mb-3 text-sm font-extrabold uppercase tracking-[0.12em] text-[#6B6A8A]">{CATEGORIES[cat] ?? cat}</h2>
            <ul className="space-y-3">
              {lignes.map((l) => (
                <PieceDuClasseur key={l.type.code} ligne={l} />
              ))}
            </ul>
          </section>
        ))}
      </div>
      <section className={`${CARTE} mt-8 flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between`}>
        <div>
          <h2 className="text-lg font-extrabold text-[#1D1B5C]">Mes autres documents</h2>
          <p className="mt-1 text-sm text-[#6B6A8A]">Tout ce qui n&apos;est pas une pièce du classeur : conventions, courriers, photos, affiches.</p>
        </div>
        <Link href="/espace/documents" className={BTN_SECONDAIRE}>
          Ouvrir mes documents →
        </Link>
      </section>
      <p className="mt-6 text-xs text-[#6B6A8A]">Référentiel des pièces vérifié le {data.versionReferentiel}.</p>
    </>
  );
}
