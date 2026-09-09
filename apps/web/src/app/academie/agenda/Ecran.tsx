'use client';

/**
 * L'AGENDA DE L'ACADÉMIE.
 *
 * Une seule grille pour toute l'équipe de l'organisme : les sessions qu'on
 * anime, les classes virtuelles, la clôture des formulaires, les dates que les
 * apprenants ont choisies en y répondant, et les rendez-vous qu'on note à la
 * main. Rien n'y est recopié : tout est lu là où ces dates sont déjà tenues.
 */

import AgendaPilote from '../../_shared/AgendaPilote';
import { TEINTE_ACADEMIE } from '../../_shared/formulaires/types';
import { appel } from '../_client';

export default function AgendaAcademie() {
  return <AgendaPilote teinte={TEINTE_ACADEMIE} appel={appel} />;
}
