'use client';

/**
 * L'AGENDA DE L'ASSOCIATION.
 *
 * La même grille que côté académie, en indigo : les échéances des dossiers de
 * financement, les pièces à renouveler, les actions prévues, la clôture des
 * formulaires, les dates choisies par ceux qui y répondent, et les rendez-vous
 * notés à la main. Toute l'équipe voit le même agenda.
 */

import AgendaPilote from '../../../_shared/AgendaPilote';
import { TEINTE_ASSOCIATION } from '../../../_shared/formulaires/types';
import { appel } from '../../_client';

export default function AgendaAssociation() {
  return <AgendaPilote teinte={TEINTE_ASSOCIATION} appel={appel} />;
}
