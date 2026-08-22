import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';

/**
 * Client Mistral AI — hébergement européen.
 * Appel HTTP direct, sans SDK, dans la lignée de Stripe et Brevo.
 *
 * DEPUIS AOÛT 2026, CE N'EST PLUS LE MOTEUR PAR DÉFAUT : LEX tourne sur Claude
 * (ClaudeService). Ce client reste en place et branché comme repli — retirer
 * ANTHROPIC_API_KEY suffit à revenir ici, sans redéploiement de code. Il n'est
 * pas supprimé précisément pour que le retour en arrière reste possible ; s'il
 * redevient le moteur principal, les pages publiques (confiance-lex, legal)
 * doivent être remises en cohérence dans le même mouvement.
 */
@Injectable()
export class MistralService {
  private readonly logger = new Logger(MistralService.name);
  private readonly base = 'https://api.mistral.ai/v1';

  private get cle(): string | undefined {
    return process.env.MISTRAL_API_KEY;
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
    const reponse = await fetch(`${this.base}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.cle}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.MISTRAL_MODEL ?? 'mistral-large-latest',
        temperature: options.temperature ?? 0.4,
        max_tokens: options.maxTokens ?? 2048,
        messages: [
          { role: 'system', content: options.system },
          ...(options.historique ?? []).slice(-8),
          { role: 'user', content: options.user },
        ],
      }),
    });
    if (!reponse.ok) {
      const corps = await reponse.text().catch(() => '');
      this.logger.error(`Mistral ${reponse.status}: ${corps.slice(0, 300)}`);
      throw new ServiceUnavailableException(
        "Le service de rédaction est momentanément indisponible. Réessayez dans un instant.",
      );
    }
    const data = (await reponse.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const contenu = data.choices?.[0]?.message?.content;
    if (!contenu) {
      throw new ServiceUnavailableException('Réponse vide du service de rédaction.');
    }
    return contenu.trim();
  }
}
