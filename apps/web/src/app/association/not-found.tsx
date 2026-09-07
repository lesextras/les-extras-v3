import Link from 'next/link';
import { BTN_PRIMAIRE, BTN_SECONDAIRE, Carte, Titre } from './_ui';

export default function Introuvable() {
  return (
    <div className="mx-auto max-w-[640px]">
      <Titre surtitre="Page introuvable" sousTitre="Cette adresse ne mène nulle part. Rien n'est perdu : voici par où repartir.">
        Il n&apos;y a rien ici
      </Titre>
      <Carte>
        <div className="flex flex-wrap gap-2">
          <Link href="/chemin" className={BTN_PRIMAIRE}>
            Le chemin, étape par étape
          </Link>
          <Link href="/subvention" className={BTN_SECONDAIRE}>
            Demander une subvention
          </Link>
          <Link href="/verifier" className={BTN_SECONDAIRE}>
            Vérifier mon association
          </Link>
        </div>
      </Carte>
    </div>
  );
}
