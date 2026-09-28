import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { cheminRapatrie, visuel, wp } from '../media';
import { lienSite } from '../liens-wordpress';
import { SLUGS_CATALOGUE, WP_RAPATRIES } from '../wp-rapatrie';

/**
 * LE WORDPRESS HISTORIQUE DOIT POUVOIR FERMER (audit du 28/09/2026).
 *
 * Ses images sont copiées dans `public/wp/`, ses liens réécrits vers le site,
 * à la lecture et sans rien écrire en base. Ce qui est vérifié ici :
 *  1. une image rapatriée est servie par le site, quel que soit l'hôte
 *     WordPress qui la référence ;
 *  2. une image NON rapatriée garde son adresse : pointer vers un fichier
 *     absent casserait ce qui marche encore ;
 *  3. la liste et les fichiers sur le disque sont d'accord ;
 *  4. les liens `/listing/<slug>/` mènent à la fiche du même slug quand le
 *     catalogue la connaît, au catalogue sinon, et rien d'autre ne bouge.
 */

const IMAGE = '2025/02/handisport.jpeg';
const ABSENTE = '2019/01/jamais-rapatriee.jpg';

describe('images rapatriées de WordPress', () => {
  it('réécrit les deux hôtes du WordPress vers /wp/', () => {
    expect(visuel(`https://app.les-extras.fr/wp-content/uploads/${IMAGE}`)).toBe(`/wp/${IMAGE}`);
    expect(visuel(`https://les-extras.fr/wp-content/uploads/${IMAGE}`)).toBe(`/wp/${IMAGE}`);
    expect(visuel(`https://ialexia.fr/wp-content/uploads/${IMAGE}`)).toBe(`/wp/${IMAGE}`);
  });

  it('sert aussi les illustrations écrites en dur dans le code', () => {
    expect(wp(`/wp-content/uploads/${IMAGE}`)).toBe(`/wp/${IMAGE}`);
  });

  it('laisse son adresse d’origine à une image qui n’a pas été rapatriée', () => {
    const origine = `https://app.les-extras.fr/wp-content/uploads/${ABSENTE}`;
    expect(cheminRapatrie(`/wp-content/uploads/${ABSENTE}`)).toBeNull();
    expect(visuel(origine)).not.toContain('/wp/');
    expect(visuel(origine)).toContain(`/wp-content/uploads/${ABSENTE}`);
  });

  it('ne touche pas aux fichiers du site qui passent par les mêmes domaines', () => {
    expect(visuel('https://les-extras.fr/api/files/abc.jpg')).toBe('https://les-extras.fr/api/files/abc.jpg');
    expect(visuel('/api/proxy/public/images/abc')).toBe('/api/proxy/public/images/abc');
  });

  it('écarte toujours le portrait d’enfant, même si on le rapatriait un jour', () => {
    expect(visuel('https://app.les-extras.fr/wp-content/uploads/2025/02/handicap-psychique.jpg')).toBeNull();
  });

  it('liste exactement les fichiers présents dans public/wp', () => {
    const racine = join(__dirname, '..', '..', '..', 'public', 'wp');
    expect(WP_RAPATRIES.length).toBeGreaterThan(0);
    for (const chemin of WP_RAPATRIES) {
      expect(existsSync(join(racine, chemin)), chemin).toBe(true);
    }
  });
});

describe('liens des articles vers l’ancien WordPress', () => {
  it('mène une fiche WordPress à la fiche du même slug quand le catalogue la connaît', () => {
    expect(SLUGS_CATALOGUE).toContain('atelier-psycho-boxe');
    expect(lienSite('https://app.les-extras.fr/listing/atelier-psycho-boxe/')).toBe(
      '/ateliers/atelier-psycho-boxe',
    );
  });

  it('mène au catalogue quand le slug n’existe pas, sans deviner une correspondance', () => {
    expect(lienSite('https://app.les-extras.fr/listing/theatre/')).toBe('/ateliers');
    expect(lienSite('https://app.les-extras.fr/listing/gestion-de-ses-emotions/')).toBe('/ateliers');
    expect(lienSite('https://app.les-extras.fr/listing-category/sport/')).toBe('/ateliers');
  });

  it('réécrit une page WordPress qui a un équivalent évident', () => {
    expect(lienSite('https://app.les-extras.fr/devenir-freelance/')).toBe('/intervenant-independant');
    expect(lienSite('https://app.les-extras.fr/blog/')).toBe('/edublog');
  });

  it('laisse une page WordPress sans équivalent telle quelle', () => {
    const lien = 'https://app.les-extras.fr/boutique/panier/';
    expect(lienSite(lien)).toBe(lien);
  });

  it('ne touche ni au site lui-même ni aux autres sites', () => {
    expect(lienSite('https://les-extras.fr/ateliers')).toBe('https://les-extras.fr/ateliers');
    expect(lienSite('https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000006797407')).toBe(
      'https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000006797407',
    );
    expect(lienSite('mailto:contact@adepa77.fr')).toBe('mailto:contact@adepa77.fr');
    expect(lienSite('/contact')).toBe('/contact');
  });
});
