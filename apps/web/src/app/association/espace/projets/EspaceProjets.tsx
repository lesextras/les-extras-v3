'use client';

import { useMemo } from 'react';
import { appel } from '../../_client';
import { Recherche } from '../financeurs/Recherche';
import type { ActionAssociation, FormationCatalogue, MembreEquipe, TacheProjet } from '../_types';
import { FournisseurProjets, type Appel, type ContexteProjets } from '../../../_shared/projets/contexte';
import { AFaire } from '../../../_shared/projets/AFaire';
import { VueProjets } from '../../../_shared/projets/VueProjets';

/** « Mes projets » de l'association : les composants partagés, à la teinte indigo, sur l'API de l'association. */
export function EspaceProjets({
  projets,
  taches,
  equipe,
  iaDisponible,
  catalogue,
}: {
  projets: ActionAssociation[];
  taches: TacheProjet[];
  equipe: MembreEquipe[];
  iaDisponible: boolean;
  /** Les formations des académies reliées ; `null` quand aucune académie n'est reliée. */
  catalogue: FormationCatalogue[] | null;
}) {
  const valeur = useMemo<ContexteProjets>(
    () => ({
      appel: appel as Appel,
      chemins: { projets: '/association/actions', taches: '/association/taches' },
      lienEquipe: '/espace/repertoire',
      formations: catalogue,
      aideSansFormations: "L'académie reliée n'a pas encore de formation.",
      financeurs: (projet) => <Recherche disponible={iaDisponible} projetId={projet.id} projetIntitule={projet.intitule} integre />,
    }),
    [catalogue, iaDisponible],
  );
  return (
    <FournisseurProjets valeur={valeur}>
      <AFaire taches={taches} equipe={equipe} projets={projets} />
      <VueProjets projets={projets} taches={taches} equipe={equipe} />
    </FournisseurProjets>
  );
}
