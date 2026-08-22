import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';

/**
 * Client Claude (API Anthropic) — moteur de langage de LEX.
 * Appel HTTP direct, sans SDK, dans la lignée de Stripe et Brevo.
 *
 * Le contrat est volontairement identique à celui de MistralService — même
 * méthode `completer`, mêmes options, mêmes exceptions — pour que le choix du
 * fournisseur reste une ligne de configuration et non une réécriture.
 *
 * Trois différences de protocole avec l'API de Mistral :
 *  - la consigne système est un paramètre de PREMIER NIVEAU (`system`), et non
 *    un message de rôle « system » ;
 *  - `max_tokens` est obligatoire ;
 *  - la réponse arrive en blocs (`content[]`) qu'il faut concaténer.
 */
@Injectable()
export class ClaudeService {
  private readonly logger = new Logger(ClaudeService.name);
  private readonly base = 'https://api.anthropic.com/v1';
  /** Version d'API épinglée : Anthropic l'exige sur chaque requête. */
  private readonly version = '2023-06-01';

  private get cle(): string | undefined {
    return process.env.ANTHROPIC_API_KEY;
  }

  get disponible(): boolean {
    return Boolean(this.cle);
  }

  /** Complétion de chat. Lève une 503 claire si la clé n'est pas configurée. */
  async completer(options: {
    system: string;
    user: string;
    /** Tours précédents (bot conversationnel) — déjà pseudonymisés. */
    historique?: { role: 'user' | 'assistant'; content: string }[];
    maxTokens?: number;
    temperature?: number;
  }): Promise<string> {
    if (!this.cle) {
      throw new ServiceUnavailableException(
        "L'assistant n'est pas encore activé sur cette plateforme (clé API manquante).",
      );
    }
    const reponse = await fetch(`${this.base}/messages`, {
      method: 'POST',
      headers: {
        'x-api-key': this.cle,
        'anthropic-version': this.version,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-5',
        // Obligatoire côté Anthropic : on garde le même défaut que Mistral.
        max_tokens: options.maxTokens ?? 2048,
        temperature: options.temperature ?? 0.4,
        // La consigne système ne voyage PAS comme un message.
        system: options.system,
        messages: [
          ...ClaudeService.filAcceptable(options.historique),
          { role: 'user', content: options.user },
        ],
      }),
    });
    if (!reponse.ok) {
      const corps = await reponse.text().catch(() => '');
      this.logger.error(`Claude ${reponse.status}: ${corps.slice(0, 300)}`);
      throw new ServiceUnavailableException(
        "Le service de rédaction est momentanément indisponible. Réessayez dans un instant.",
      );
    }
    const data = (await reponse.json()) as {
      content?: { type?: string; text?: string }[];
    };
    const contenu = (data.content ?? [])
      .filter((bloc) => bloc?.type === 'text')
      .map((bloc) => bloc.text ?? '')
      .join('')
      .trim();
    if (!contenu) {
      throw new ServiceUnavailableException('Réponse vide du service de rédaction.');
    }
    return contenu;
  }

  /**
   * Met l'historique en état d'être accepté : huit derniers tours, aucun
   * message vide, et un premier tour qui appartient à l'utilisateur.
   *
   * L'API Anthropic refuse un fil qui s'ouvre sur une réponse de l'assistant —
   * ce qui arrive dès qu'une fenêtre de conversation est tronquée au mauvais
   * endroit. Plutôt qu'un 400 opaque en pleine rédaction, on coupe le début.
   */
  private static filAcceptable(
    historique?: { role: 'user' | 'assistant'; content: string }[],
  ): { role: 'user' | 'assistant'; content: string }[] {
    const fil = (historique ?? [])
      .filter((m) => typeof m?.content === 'string' && m.content.trim().length > 0)
      .slice(-8);
    while (fil.length && fil[0].role !== 'user') fil.shift();
    return fil;
  }
}
