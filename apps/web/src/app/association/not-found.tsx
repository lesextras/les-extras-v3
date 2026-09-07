import Link from 'next/link';
import { Encart, Titre } from './_ui';

export default function Introuvable() {
  return (
    <>
      <Titre surtitre="Page introuvable" sousTitre="Cette adresse ne mène nulle part. Rien n'est perdu : voici par où repartir.">
        Il n&apos;y a rien ici
      </Titre>
      <div className="max-w-[64ch]">
        <Encart>
          <ul className="space-y-2">
            <li>
              <Link href="/verifier" className="underline underline-offset-4">
                Vérifier mon association
              </Link>{' '}
              : les pièces déjà prouvées, celles qui manquent, où les trouver.
            </li>
            <li>
              <Link href="/chemin" className="underline underline-offset-4">
                Le chemin
              </Link>{' '}
              : piloter une association, une étape à la fois.
            </li>
            <li>
              <Link href="/outils" className="underline underline-offset-4">
                La carte des outils
              </Link>{' '}
              : qui fait quoi, gratuitement ou non.
            </li>
          </ul>
        </Encart>
      </div>
    </>
  );
}
