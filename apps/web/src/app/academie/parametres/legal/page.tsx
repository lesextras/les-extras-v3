import type { Metadata } from 'next';
import { apiAcademie, sessionAcademie } from '../../_session';
import { Encart, Titre } from '../../_ui';
import { OngletsParametres } from '../_onglets';
import { Legal } from './Legal';
import type { ReglagesSuite } from '../../_ecole/suite-types';

export const metadata: Metadata = { title: 'Liens légaux et RGPD', robots: { index: false, follow: false } };

export default async function PageLegalAcademie() {
  const s = await sessionAcademie('/academie/parametres/legal');
  const [reg, vitrine] = await Promise.all([
    apiAcademie<ReglagesSuite>(s, '/ecole/reglages-suite'),
    apiAcademie<{ slug?: string } | null>(s, '/ecole/vitrine'),
  ]);
  return (
    <>
      <Titre surtitre="Paramètres" sousTitre="CGU et confidentialité de ton école.">
        Liens légaux et RGPD
      </Titre>
      <OngletsParametres actif="/academie/parametres/legal" />
      {reg.data ? <Legal initial={reg.data} slug={vitrine.data?.slug ?? null} /> : <Encart ton="attention">{reg.error ?? 'Les réglages ne se chargent pas.'}</Encart>}
    </>
  );
}
