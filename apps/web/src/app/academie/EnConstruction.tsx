import Link from 'next/link';
import { CARTE, Encart, Titre } from './_ui';

/**
 * Une page du menu dont l'écran n'est pas encore écrit.
 *
 * On préfère dire franchement ce qui arrive, et où sont déjà les données,
 * plutôt que de laisser une page vide ou une entrée de menu qui ne mène nulle
 * part. Chaque page annonce son contenu réel, pas une promesse floue.
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
        <h2 className="text-lg font-extrabold text-[#12312A]">Ce que cet écran contiendra</h2>
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
        <p className="mt-5 text-sm text-[#5E7A6E]">
          En attendant, le{' '}
          <Link href="/academie/chemin" className="font-bold text-[#0F5F3E] underline underline-offset-4">
            chemin
          </Link>{' '}
          et{' '}
          <Link href="/academie/mon-academie" className="font-bold text-[#0F5F3E] underline underline-offset-4">
            ta fiche d&apos;organisme
          </Link>{' '}
          sont ouverts.
        </p>
      </div>
    </>
  );
}
