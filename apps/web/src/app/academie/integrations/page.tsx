import type { Metadata } from 'next';
import { apiAcademie, sessionAcademie } from '../_session';
import { Encart, ORIGINE_SITE, Titre } from '../_ui';
import { Integrations } from './Integrations';
import type { CoursResume, Pack } from '../_ecole/types';

export const metadata: Metadata = { title: 'Intégrations externes', robots: { index: false, follow: false } };

/**
 * `/academie/integrations` : VENDRE DEPUIS UN AUTRE SITE.
 *
 * Un lien, un bouton ou une carte à coller sur son site (WordPress, Wix,
 * Squarespace, une page Notion) : le visiteur clique et arrive sur la page de
 * vente de la formation. Le paiement se fait toujours sur nos pages, jamais
 * dans le cadre d'un site tiers.
 */
export default async function PageIntegrations() {
  const s = await sessionAcademie('/academie/integrations');
  const [cours, packs] = await Promise.all([apiAcademie<CoursResume[]>(s, '/ecole/cours'), apiAcademie<Pack[]>(s, '/ecole/packs')]);
  const publies = (Array.isArray(cours.data) ? cours.data : []).filter((c) => c.statut === 'PUBLIE');
  const packsPublies = (Array.isArray(packs.data) ? packs.data : []).filter((p) => p.statut === 'PUBLIE');
  return (
    <>
      <Titre surtitre="Outils marketing" sousTitre="Un lien, un bouton ou une carte à coller sur ton site : tes formations se vendent aussi là où sont déjà tes visiteurs.">
        Intégrations externes
      </Titre>
      {publies.length || packsPublies.length ? (
        <Integrations origine={ORIGINE_SITE} cours={publies} packs={packsPublies} />
      ) : (
        <Encart ton="info">Publie d&apos;abord une formation ou un pack : seuls les contenus publiés s&apos;intègrent ailleurs.</Encart>
      )}
    </>
  );
}
