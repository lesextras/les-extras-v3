import { ServiceUnavailableException } from '@nestjs/common';
import { DELAI_MOTEUR_MS, fetchMoteur } from './appel-borne';

/**
 * CE QUE CES TESTS PROTÈGENT : UN CRÉDIT DÉBITÉ QUI NE REVIENT JAMAIS.
 *
 * `CreditsService.avecCredit` rembourse sur le REJET de la promesse. Une
 * requête qui pend indéfiniment ne rejette pas : elle ne rembourse donc pas,
 * et le débit passe pour normal dans le grand livre. Le seul garde-fou est le
 * délai d'expiration — s'il disparaît, plus rien ne le signale.
 */

describe('L’appel borné au moteur', () => {
  const vraiFetch = global.fetch;
  afterEach(() => {
    global.fetch = vraiFetch;
    jest.useRealTimers();
  });

  it('laisse passer une réponse normale', async () => {
    global.fetch = jest.fn().mockResolvedValue(new Response('ok', { status: 200 }));
    const r = await fetchMoteur('https://exemple.test', { method: 'POST' }, 'Test');
    expect(r.status).toBe(200);
  });

  /**
   * ⚠ LE TEST CENTRAL. Le faux `fetch` respecte le signal d'abandon, comme le
   * vrai : sans le contrôleur, cette promesse ne se résoudrait jamais et le
   * test lui-même expirerait — ce qui est exactement ce qui arrive à
   * l'utilisateur en production.
   */
  it('abandonne quand le moteur ne répond pas, et le dit', async () => {
    global.fetch = jest.fn(
      (_url: unknown, init?: { signal?: AbortSignal }) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () =>
            reject(Object.assign(new Error('The operation was aborted'), { name: 'AbortError' })),
          );
        }),
    ) as unknown as typeof fetch;

    const promesse = fetchMoteur('https://exemple.test', {}, 'Anthropic', 20);
    await expect(promesse).rejects.toBeInstanceOf(ServiceUnavailableException);
    await expect(promesse).rejects.toThrow(/trop de temps/);
    // ⚠ Le message DIT que le crédit a été rendu : sans cette phrase, la
    // personne croit avoir payé pour rien et recommence — donc repaie.
    await expect(promesse).rejects.toThrow(/crédit vous a été rendu/);
  });

  it('traduit aussi une panne réseau en 503, sans laisser fuir le détail', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('getaddrinfo ENOTFOUND'));
    await expect(fetchMoteur('https://exemple.test', {}, 'Mistral')).rejects.toThrow(
      /momentanément indisponible/,
    );
  });

  /**
   * ⚠ Le délai doit rester LARGE : une synthèse longue met couramment une
   * minute. Un jour où quelqu'un le descendra à dix secondes « pour que ça
   * réponde plus vite », ce test dira pourquoi c'est une mauvaise idée.
   */
  it('laisse le temps à une génération longue', () => {
    expect(DELAI_MOTEUR_MS).toBeGreaterThanOrEqual(60_000);
  });
});
