import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

/**
 * LA PROMESSE : RIEN NE PART SANS ACCORD.
 *
 * Ces tests ne vérifient pas une implémentation, ils vérifient un engagement
 * pris envers la personne qui visite le site — et qui est écrit noir sur blanc
 * sur la page cookies. Trois façons de le trahir, chacune couverte ici :
 *
 *  1. envoyer une conversion alors que la personne n'a pas répondu ;
 *  2. envoyer une conversion après un REFUS ;
 *  3. considérer un stockage inaccessible (navigation privée) comme un oui.
 *
 * Le quatrième cas est l'inverse : quand la mesure n'est pas configurée du
 * tout, on ne doit RIEN demander ni RIEN envoyer, pour que le site ne réclame
 * jamais un consentement dont il n'a pas l'usage.
 */

const ID = 'AW-000000000';
const ETIQUETTE = 'aBcDeFgHiJk';

async function chargerModules() {
  vi.resetModules();
  const consentement = await import('../consentement');
  const conversion = await import('../conversion');
  return { ...consentement, ...conversion };
}

describe('Consentement : la mesure est configurée', () => {
  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_GOOGLE_ADS_ID', ID);
    vi.stubEnv('NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_INSCRIPTION', ETIQUETTE);
    window.localStorage.clear();
    (window as unknown as { gtag?: unknown }).gtag = vi.fn();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    delete (window as unknown as { gtag?: unknown }).gtag;
  });

  it('n’envoie rien tant que la personne n’a pas répondu', async () => {
    const m = await chargerModules();
    expect(m.lireConsentement()).toBe('inconnu');
    m.signalerInscription('ESTABLISHMENT');
    expect((window as unknown as { gtag: ReturnType<typeof vi.fn> }).gtag).not.toHaveBeenCalled();
  });

  it('n’envoie rien après un refus', async () => {
    const m = await chargerModules();
    m.enregistrerConsentement('refuse');
    m.signalerInscription('ESTABLISHMENT');
    expect((window as unknown as { gtag: ReturnType<typeof vi.fn> }).gtag).not.toHaveBeenCalled();
  });

  it('envoie la conversion après un accord, sans donnée personnelle', async () => {
    const m = await chargerModules();
    m.enregistrerConsentement('accepte');
    m.signalerInscription('FREELANCE');

    const gtag = (window as unknown as { gtag: ReturnType<typeof vi.fn> }).gtag;
    expect(gtag).toHaveBeenCalledTimes(1);
    const [evenement, nom, charge] = gtag.mock.calls[0] as [string, string, Record<string, unknown>];
    expect(evenement).toBe('event');
    expect(nom).toBe('conversion');
    expect(charge.send_to).toBe(`${ID}/${ETIQUETTE}`);
    expect(charge.type_compte).toBe('FREELANCE');

    // Aucune trace d'identité dans ce qui part chez Google.
    const envoye = JSON.stringify(charge).toLowerCase();
    ['email', 'mail', 'nom', 'prenom', 'telephone', '@'].forEach((interdit) => {
      expect(envoye).not.toContain(interdit);
    });
  });

  it('reste muet si l’étiquette de conversion n’est pas déclarée', async () => {
    vi.stubEnv('NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_INSCRIPTION', '');
    const m = await chargerModules();
    m.enregistrerConsentement('accepte');
    m.signalerInscription('ESTABLISHMENT');
    expect((window as unknown as { gtag: ReturnType<typeof vi.fn> }).gtag).not.toHaveBeenCalled();
  });

  it('permet de revenir sur un accord', async () => {
    const m = await chargerModules();
    m.enregistrerConsentement('accepte');
    expect(m.mesureAutorisee()).toBe(true);
    m.enregistrerConsentement('refuse');
    expect(m.mesureAutorisee()).toBe(false);
    m.oublier();
    expect(m.lireConsentement()).toBe('inconnu');
  });

  it('traite un stockage inaccessible comme une absence de réponse', async () => {
    const m = await chargerModules();
    m.enregistrerConsentement('accepte');
    const vrai = window.localStorage.getItem.bind(window.localStorage);
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('stockage refusé');
    });
    expect(m.lireConsentement()).toBe('inconnu');
    expect(m.mesureAutorisee()).toBe(false);
    vi.restoreAllMocks();
    expect(vrai).toBeTypeOf('function');
  });
});

describe('Consentement : aucune mesure configurée', () => {
  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_GOOGLE_ADS_ID', '');
    window.localStorage.clear();
    (window as unknown as { gtag?: unknown }).gtag = vi.fn();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    delete (window as unknown as { gtag?: unknown }).gtag;
  });

  it('ne demande aucun consentement et n’envoie rien, même si l’on dit oui', async () => {
    const m = await chargerModules();
    expect(m.mesureConfiguree()).toBe(false);
    m.enregistrerConsentement('accepte');
    expect(m.mesureAutorisee()).toBe(false);
    m.signalerInscription('ESTABLISHMENT');
    expect((window as unknown as { gtag: ReturnType<typeof vi.fn> }).gtag).not.toHaveBeenCalled();
  });
});
