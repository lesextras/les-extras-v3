import { ServiceUnavailableException } from '@nestjs/common';
import { ClaudeService } from './claude.service';

/**
 * LE MOTEUR DE LEX, ET POURQUOI CES TESTS EXISTENT.
 *
 * LEX est passé de Mistral à Claude. Le protocole d'Anthropic diffère sur trois
 * points qui, mal câblés, produisent soit une erreur 400 en pleine rédaction,
 * soit un texte vide rendu au professionnel :
 *  - la consigne système est un paramètre de premier niveau, jamais un message ;
 *  - `max_tokens` est obligatoire ;
 *  - la réponse arrive en blocs à concaténer.
 *
 * On verrouille aussi les deux comportements que l'interface attend : une 503
 * lisible quand la clé manque, et une 503 lisible quand l'API répond en erreur —
 * jamais une trace technique remontée à l'écran.
 */

/** Réponse conforme au format `content[]` de l'API Messages. */
function reponseOk(blocs: { type: string; text?: string }[]) {
  return {
    ok: true,
    status: 200,
    json: async () => ({ content: blocs }),
    text: async () => '',
  } as never;
}

function corpsEnvoye(): Record<string, unknown> {
  const appel = (globalThis.fetch as unknown as jest.Mock).mock.calls[0];
  return JSON.parse(appel[1].body as string) as Record<string, unknown>;
}

describe('ClaudeService', () => {
  const CLE = process.env.ANTHROPIC_API_KEY;
  const MODELE = process.env.ANTHROPIC_MODEL;

  beforeEach(() => {
    process.env.ANTHROPIC_API_KEY = 'cle-de-test';
    delete process.env.ANTHROPIC_MODEL;
  });

  afterEach(() => {
    jest.restoreAllMocks();
    if (CLE === undefined) delete process.env.ANTHROPIC_API_KEY;
    else process.env.ANTHROPIC_API_KEY = CLE;
    if (MODELE === undefined) delete process.env.ANTHROPIC_MODEL;
    else process.env.ANTHROPIC_MODEL = MODELE;
  });

  it("refuse clairement, sans appel réseau, quand la clé n'est pas configurée", async () => {
    delete process.env.ANTHROPIC_API_KEY;
    const fetchMock = jest.spyOn(globalThis, 'fetch' as never);
    const service = new ClaudeService();

    expect(service.disponible).toBe(false);
    await expect(service.completer({ system: 'S', user: 'U' })).rejects.toThrow(
      ServiceUnavailableException,
    );
    await expect(service.completer({ system: 'S', user: 'U' })).rejects.toThrow(
      /clé API manquante/,
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('envoie le system au premier niveau, et jamais comme message', async () => {
    jest.spyOn(globalThis, 'fetch' as never).mockResolvedValue(
      reponseOk([{ type: 'text', text: 'Brouillon.' }]),
    );
    const service = new ClaudeService();

    await service.completer({
      system: 'Cadre déontologique',
      user: 'Notes masquées',
      historique: [
        { role: 'user', content: 'bonjour' },
        { role: 'assistant', content: 'bonjour à vous' },
      ],
    });

    const [url, init] = (globalThis.fetch as unknown as jest.Mock).mock.calls[0];
    expect(url).toBe('https://api.anthropic.com/v1/messages');
    expect(init.headers).toMatchObject({
      'x-api-key': 'cle-de-test',
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    });
    // Pas d'en-tête Authorization : Anthropic n'en veut pas.
    expect(init.headers).not.toHaveProperty('Authorization');

    const corps = corpsEnvoye();
    expect(corps.system).toBe('Cadre déontologique');
    expect(corps.max_tokens).toBe(2048);
    expect(corps.model).toBe('claude-sonnet-4-5');
    expect(corps.messages).toEqual([
      { role: 'user', content: 'bonjour' },
      { role: 'assistant', content: 'bonjour à vous' },
      { role: 'user', content: 'Notes masquées' },
    ]);
    // La règle qui compte : aucun message de rôle « system ».
    for (const message of corps.messages as { role: string }[]) {
      expect(message.role).not.toBe('system');
    }
  });

  it('respecte maxTokens, la température et le modèle de la variable d’environnement', async () => {
    process.env.ANTHROPIC_MODEL = 'claude-opus-4-1';
    jest.spyOn(globalThis, 'fetch' as never).mockResolvedValue(
      reponseOk([{ type: 'text', text: 'ok' }]),
    );

    await new ClaudeService().completer({
      system: 'S',
      user: 'U',
      maxTokens: 520,
      temperature: 0.5,
    });

    const corps = corpsEnvoye();
    expect(corps.model).toBe('claude-opus-4-1');
    expect(corps.max_tokens).toBe(520);
    expect(corps.temperature).toBe(0.5);
  });

  it('ouvre toujours le fil sur un tour utilisateur', async () => {
    jest.spyOn(globalThis, 'fetch' as never).mockResolvedValue(
      reponseOk([{ type: 'text', text: 'ok' }]),
    );

    await new ClaudeService().completer({
      system: 'S',
      user: 'U',
      // Fil tronqué au mauvais endroit : l'API refuserait un fil qui commence
      // par une réponse de l'assistant.
      historique: [
        { role: 'assistant', content: 'je vous écoute' },
        { role: 'user', content: 'la situation est la suivante' },
      ],
    });

    expect(corpsEnvoye().messages).toEqual([
      { role: 'user', content: 'la situation est la suivante' },
      { role: 'user', content: 'U' },
    ]);
  });

  it('concatène les blocs texte de content[] et ignore le reste', async () => {
    jest.spyOn(globalThis, 'fetch' as never).mockResolvedValue(
      reponseOk([
        { type: 'thinking' },
        { type: 'text', text: '## Atelier\n' },
        { type: 'text', text: 'Déroulé en quatre temps.  ' },
      ]),
    );

    const texte = await new ClaudeService().completer({ system: 'S', user: 'U' });
    expect(texte).toBe('## Atelier\nDéroulé en quatre temps.');
  });

  it('transforme une réponse HTTP en erreur en 503 lisible, sans divulguer la clé', async () => {
    jest.spyOn(globalThis, 'fetch' as never).mockResolvedValue({
      ok: false,
      status: 429,
      text: async () => '{"error":{"message":"rate_limit"}}',
      json: async () => ({}),
    } as never);
    const service = new ClaudeService();
    const journal = jest
      .spyOn(service['logger'], 'error')
      .mockImplementation(() => undefined);

    await expect(
      service.completer({ system: 'S', user: 'Notes confidentielles' }),
    ).rejects.toThrow(/momentanément indisponible/);

    expect(journal).toHaveBeenCalledTimes(1);
    const trace = String(journal.mock.calls[0][0]);
    expect(trace).toContain('Claude 429');
    expect(trace).not.toContain('cle-de-test');
    expect(trace).not.toContain('Notes confidentielles');
  });

  it('refuse une réponse vide plutôt que de rendre un brouillon blanc', async () => {
    jest.spyOn(globalThis, 'fetch' as never).mockResolvedValue(reponseOk([]));
    await expect(
      new ClaudeService().completer({ system: 'S', user: 'U' }),
    ).rejects.toThrow(/Réponse vide/);
  });
});
