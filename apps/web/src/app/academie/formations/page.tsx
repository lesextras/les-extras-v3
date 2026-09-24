import type { Metadata } from 'next';
import { apiAcademie, sessionAcademie } from '../_session';
import { Encart, ORIGINE_SITE, Titre } from '../_ui';
import { ListeCours } from '../_ecole/ListeCours';
import type { CoursResume, ModaliteCours } from '../_ecole/types';

export const metadata: Metadata = { title: 'Mes formations' };

/**
 * `/academie/formations` — TOUT CE QUI S'ENSEIGNE, AU MÊME ENDROIT.
 *
 * C'était cinq entrées de menu, puis quatre onglets : le catalogue, les cours
 * en ligne, les cours en présentiel, les sessions, les classes virtuelles.
 * Cinq mots pour une même chose — une formation — et il fallait deviner
 * lequel ouvrir.
 *
 * Il ne reste qu'une liste. Tout ce qui tenait dans les autres onglets vit
 * maintenant DANS la formation : la fiche programme (ce que lisent un
 * financeur et un auditeur) dans « Descriptions », les sessions datées dans
 * « Sessions » quand on se retrouve en salle ou en visio, la classe en direct
 * comme une leçon parmi les autres. La modalité se choisit dans « Paramètres »
 * et se filtre ici.
 */

interface PageProps {
  searchParams: Promise<{ onglet?: string; modalite?: string }>;
}

export default async function FormationsPage({ searchParams }: PageProps) {
  const { onglet: brut, modalite: modaliteBrute } = await searchParams;

  // Les anciennes adresses continuent d'ouvrir le bon endroit : « présentiel »
  // ouvre le filtre, les autres onglets d'autrefois ouvrent la liste.
  const MODALITES: ModaliteCours[] = ['EN_LIGNE', 'PRESENTIEL', 'VIRTUEL', 'MIXTE'];
  const demandee =
    brut === 'presentiel' ? 'PRESENTIEL' : brut === 'classes' ? 'VIRTUEL' : (modaliteBrute ?? '').toUpperCase();
  const modalite = MODALITES.includes(demandee as ModaliteCours) ? (demandee as ModaliteCours) : null;

  const s = await sessionAcademie('/academie/formations');
  const { data, error } = await apiAcademie<CoursResume[]>(s, '/ecole/cours');

  return (
    <>
      <Titre
        surtitre="Tout ce qui s'enseigne"
        sousTitre="Contenu, programme et dates, au même endroit."
      >
        Mes formations
      </Titre>

      {data ? (
        <ListeCours cours={Array.isArray(data) ? data : []} origine={ORIGINE_SITE} modaliteInitiale={modalite} />
      ) : (
        <Encart ton="attention">{error ?? 'Les formations ne se chargent pas pour le moment.'}</Encart>
      )}
    </>
  );
}
