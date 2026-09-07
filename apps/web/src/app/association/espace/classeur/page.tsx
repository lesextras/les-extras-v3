import { apiEspace, sessionAssociation } from '../../_session';
import { Encart } from '../../_ui';
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

  return (
    <>
      <header className="mb-6">
        <p className="text-xs uppercase tracking-[0.14em] text-[#5C6B63]">{data.organisation.nom}</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">Le classeur</h1>
        <p className="mt-2 max-w-[64ch] text-[#3E4A44]">
          {pretes} pièce{pretes > 1 ? 's' : ''} sur {data.classeur.length} prête{pretes > 1 ? 's' : ''}. Une pièce déposée avec
          sa date est surveillée : vous serez prévenu 60 jours avant qu&apos;elle expire.
        </p>
      </header>
      <div className="space-y-8">
        {Object.entries(parCategorie).map(([cat, lignes]) => (
          <section key={cat}>
            <h2 className="mb-3 text-sm uppercase tracking-[0.14em] text-[#5C6B63]">{CATEGORIES[cat] ?? cat}</h2>
            <ul className="space-y-3">
              {lignes.map((l) => (
                <PieceDuClasseur key={l.type.code} ligne={l} />
              ))}
            </ul>
          </section>
        ))}
      </div>
      <p className="mt-6 text-xs text-[#5C6B63]">Référentiel des pièces vérifié le {data.versionReferentiel}.</p>
    </>
  );
}
