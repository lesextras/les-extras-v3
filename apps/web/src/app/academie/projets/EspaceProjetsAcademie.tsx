'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { appel } from '../_client';
import type { ActionAssociation, FormationCatalogue, MembreEquipe, TacheProjet } from '../../association/espace/_types';
import { FournisseurProjets, TEINTE_ACADEMIE, type Appel, type ContexteProjets } from '../../_shared/projets/contexte';
import { AFaire } from '../../_shared/projets/AFaire';
import { VueProjets } from '../../_shared/projets/VueProjets';

/**
 * « Mes projets » de l'académie : les mêmes composants que l'association, à
 * la teinte verte, sur l'API de l'académie — qui lit les projets de
 * l'association reliée (mêmes lignes) et ceux de l'académie.
 */
export function EspaceProjetsAcademie({
  projets,
  taches,
  equipe,
  catalogue,
  proprietaires,
}: {
  projets: ActionAssociation[];
  taches: TacheProjet[];
  equipe: MembreEquipe[];
  catalogue: FormationCatalogue[];
  proprietaires: { cle: string; nom: string; type: 'ASSOCIATION' | 'ACADEMIE' }[];
}) {
  const valeur = useMemo<ContexteProjets>(
    () => ({
      appel: appel as Appel,
      chemins: { projets: '/academie/projets', taches: '/academie/taches' },
      lienEquipe: '/academie/droits-acces',
      formations: catalogue,
      lienFormation: (f) => `/academie/formations/${f.id}`,
      aideSansFormations: (
        <Link href="/academie/formations" className="font-bold text-[#0F5F3E] underline underline-offset-2">
          Crée ta première formation
        </Link>
      ),
      proprietaires,
      exemple: 'Studio A2PA, parcours CM, préparation BAFA…',
    }),
    [catalogue, proprietaires],
  );
  return (
    <FournisseurProjets valeur={valeur} teinte={TEINTE_ACADEMIE}>
      <AFaire taches={taches} equipe={equipe} projets={projets} />
      <VueProjets projets={projets} taches={taches} equipe={equipe} />
    </FournisseurProjets>
  );
}
