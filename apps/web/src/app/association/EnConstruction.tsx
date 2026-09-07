import Link from 'next/link';
import { CARTE, Encart, Titre } from './_ui';

/**
 * Une page du menu dont l'écran n'est pas encore écrit.
 *
 * On préfère dire franchement ce qui arrive, et où sont déjà les données,
 * plutôt qu'une page vide ou une entrée de menu qui ne mène nulle part.
 */
export function EnConstruction({
  titre,
  surtitre,
  quoi,
  contenu,
  deja,
}: {
  titre: string;
  surtitre: string;
  quoi: string;
  contenu: string[];
  deja?: string;
}) {
  return (
    <>
      <Titre surtitre={surtitre} sousTitre={quoi}>
        {titre}
      </Titre>

      <div className={`${CARTE} p-5 sm:p-7`}>
        <h2 className="text-lg font-extrabold text-[#1D1B5C]">Ce que cet écran contiendra</h2>
        <ul className="mt-3 list-disc space-y-1.5 pl-5 leading-relaxed">
          {contenu.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
        {deja ? (
          <div className="mt-5">
            <Encart ton="info">{deja}</Encart>
          </div>
        ) : null}
        <p className="mt-5 text-sm text-[#6B6A8A]">
          En attendant,{' '}
          <Link href="/espace/association" className="font-bold text-[#4F46E5] underline underline-offset-4">
            mon association
          </Link>{' '}
          et{' '}
          <Link href="/mon-profil" className="font-bold text-[#4F46E5] underline underline-offset-4">
            mon profil
          </Link>{' '}
          sont ouverts.
        </p>
      </div>
    </>
  );
}
