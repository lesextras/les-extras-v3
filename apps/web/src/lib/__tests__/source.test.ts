import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

/**
 * SAVOIR CE QU'ON A ACHETÉ.
 *
 * Une campagne payante dont les visites se comptent en « direct » ne se pilote
 * pas : impossible de dire quelle annonce produit des inscriptions, donc
 * impossible de couper celles qui n'en produisent pas.
 *
 * Le piège, constaté le jour du lancement de la campagne Facebook : les régies
 * n'ajoutent PAS d'UTM à l'URL. Facebook ajoute `fbclid`, Google `gclid`. Et
 * depuis l'application Facebook, `document.referrer` est vide — la visite
 * tombait donc en « direct », indiscernable d'une visite naturelle.
 */

function allerSur(url: string, referent = '') {
  const u = new URL(url);
  Object.defineProperty(window, 'location', {
    value: { search: u.search, pathname: u.pathname, hostname: u.hostname },
    writable: true,
    configurable: true,
  });
  Object.defineProperty(document, 'referrer', { value: referent, configurable: true });
}

async function source() {
  vi.resetModules();
  const m = await import('../source');
  m.memoriserSource();
  return m.sourceComplete();
}

describe('Attribution des visites payantes', () => {
  beforeEach(() => {
    window.sessionStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('reconnaît une annonce Facebook qui n’a que son fbclid', async () => {
    allerSur('https://les-extras.fr/formations?fbclid=IwAR3xYz', '');
    const s = await source();
    expect(s.source).toBe('facebook');
    expect(s.medium).toBe('paid_social');
    expect(s.landing).toBe('/formations');
  });

  it('reconnaît un clic Google Ads (gclid) et ses variantes iOS', async () => {
    for (const p of ['gclid=abc', 'gbraid=abc', 'wbraid=abc']) {
      window.sessionStorage.clear();
      allerSur(`https://les-extras.fr/?${p}`, '');
      const s = await source();
      expect(s.source).toBe('google');
      expect(s.medium).toBe('cpc');
    }
  });

  it('laisse la priorité aux UTM quand ils sont posés', async () => {
    allerSur('https://les-extras.fr/?utm_source=newsletter&utm_medium=email&fbclid=xyz', '');
    const s = await source();
    expect(s.source).toBe('newsletter');
    expect(s.medium).toBe('email');
  });

  it('garde le nom de campagne à côté de l’identifiant de clic', async () => {
    allerSur('https://les-extras.fr/?fbclid=xyz&utm_campaign=renfort-idf', '');
    const s = await source();
    expect(s.source).toBe('facebook');
    expect(s.campaign).toBe('renfort-idf');
  });

  it('n’écrase pas la première origine de la visite', async () => {
    allerSur('https://les-extras.fr/?fbclid=xyz', '');
    await source();
    allerSur('https://les-extras.fr/register', 'https://les-extras.fr/');
    const s = await source();
    expect(s.source).toBe('facebook');
    expect(s.landing).toBe('/');
  });

  it('reste en « direct » quand il n’y a réellement rien à attribuer', async () => {
    allerSur('https://les-extras.fr/', '');
    const s = await source();
    expect(s.source).toBe('direct');
  });
});
