'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { appel } from './_client';
import { BTN_PRIMAIRE } from './_ui';

/**
 * DÉPOSER DES FICHIERS. Partout où on peut fabriquer un document, on doit
 * aussi pouvoir déposer celui qu'on a déjà — et plusieurs d'un coup : on
 * photographie rarement une seule page.
 *
 * Quand le dépôt remplit une pièce du classeur (`piece`), le premier fichier
 * prend sa place ; les suivants sont rangés dans « Mes documents », dans la
 * même catégorie. Sans pièce, tout part dans « Mes documents ».
 */

const TYPES_ACCEPTES = 'application/pdf,image/jpeg,image/png,image/webp';

export interface DepotProps {
  /** Code de la pièce du classeur à remplir, s'il y en a une. */
  piece?: string;
  /** Catégorie de rangement des documents libres. */
  categorie?: string;
  /** Titre proposé quand on ne dépose qu'un fichier. */
  titre?: string;
  onFini?: () => void;
  onAnnuler?: () => void;
}

export function DeposerFichiers({ piece, categorie = 'Autre', titre, onFini, onAnnuler }: DepotProps) {
  const router = useRouter();
  const champ = useRef<HTMLInputElement>(null);
  const [choisis, setChoisis] = useState<File[]>([]);
  const [avancement, setAvancement] = useState<{ fait: number; total: number } | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);

  const enCours = avancement !== null;

  async function envoyer() {
    const fichiers = choisis.length ? choisis : Array.from(champ.current?.files ?? []);
    if (!fichiers.length) {
      setErreur('Choisis au moins un fichier : PDF, JPEG, PNG ou WEBP.');
      return;
    }
    setErreur(null);
    setAvancement({ fait: 0, total: fichiers.length });
    try {
      for (let i = 0; i < fichiers.length; i += 1) {
        const f = fichiers[i];
        const form = new FormData();
        form.append('file', f);
        // Le premier fichier remplit la pièce du classeur ; les autres sont rangés à côté.
        if (piece && i === 0) {
          await appel(`/association/classeur/${piece}`, { method: 'POST', form });
        } else {
          form.append('titre', (fichiers.length === 1 && titre?.trim()) || f.name);
          form.append('categorie', categorie);
          await appel('/association/documents', { method: 'POST', form });
        }
        setAvancement({ fait: i + 1, total: fichiers.length });
      }
      setChoisis([]);
      if (champ.current) champ.current.value = '';
      onFini?.();
      router.refresh();
    } catch (err) {
      setErreur(err instanceof Error ? err.message : 'Le dépôt a échoué.');
    } finally {
      setAvancement(null);
    }
  }

  return (
    <div className="w-full rounded-xl bg-[#F5F4FC] p-3 text-left text-sm">
      <input
        ref={champ}
        type="file"
        multiple
        accept={TYPES_ACCEPTES}
        onChange={(e) => {
          setChoisis(Array.from(e.target.files ?? []));
          setErreur(null);
        }}
        className="w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-[#ECEBFC] file:px-3 file:py-2 file:font-bold file:text-[#4338CA]"
      />
      <p className="mt-1 text-xs text-[#6B6A8A]">
        Tu peux en choisir plusieurs d&apos;un coup : PDF, JPEG, PNG ou WEBP.
        {piece ? ' Le premier prend la place du papier ; les autres sont rangés dans « Mes documents ».' : ''}
      </p>

      {choisis.length ? (
        <ul className="mt-2 space-y-0.5">
          {choisis.map((f, i) => (
            <li key={`${f.name}-${i}`} className="truncate text-xs text-[#3B3A66]">
              {piece && i === 0 ? '• ' : '· '}
              {f.name}
              {piece && i === 0 ? <span className="text-[#6B6A8A]"> — dans le classeur</span> : null}
            </li>
          ))}
        </ul>
      ) : null}

      {erreur ? <p className="mt-2 text-[#8A2419]">{erreur}</p> : null}

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <button type="button" onClick={envoyer} disabled={enCours} className={`${BTN_PRIMAIRE} !py-2 text-sm`}>
          {enCours ? `Envoi ${avancement.fait + 1} sur ${avancement.total}…` : choisis.length > 1 ? `Enregistrer les ${choisis.length} fichiers` : 'Enregistrer'}
        </button>
        {onAnnuler ? (
          <button type="button" onClick={onAnnuler} className="px-3 text-sm text-[#6B6A8A]">
            Annuler
          </button>
        ) : null}
      </div>
    </div>
  );
}

/**
 * Le bouton et son volet : à mettre à côté de chaque « Fabriquer ». Le libellé
 * change quand un fichier est déjà là — on remplace plutôt qu'on ajoute.
 */
export function BoutonDeposerFichiers({
  classeNom,
  libelle,
  ...depot
}: DepotProps & { classeNom: string; libelle?: string }) {
  const [ouvert, setOuvert] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOuvert((v) => !v)} className={classeNom}>
        {libelle ?? 'Déposer des fichiers'}
      </button>
      {ouvert ? (
        <div className="mt-3 w-full">
          <DeposerFichiers {...depot} onFini={() => setOuvert(false)} onAnnuler={() => setOuvert(false)} />
        </div>
      ) : null}
    </>
  );
}
