import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ClaudeService } from './claude.service';

/**
 * LE MOTEUR DE RÉDACTION — GEMINI D'ABORD, CLAUDE EN SECOURS.
 *
 * Le reste du code ne sait pas quel modèle répond : il demande un texte, il
 * reçoit un texte. Ce service choisit, dans cet ordre :
 *
 *   1. GEMINI_API_KEY est posée  → Google Gemini ;
 *   2. sinon (ou en cas de panne) ANTHROPIC_API_KEY → Claude.
 *
 * Deux clés posées, c'est un filet : si Gemini refuse ou tombe, Claude prend
 * le relais sans que personne ne s'en aperçoive. Une seule clé suffit.
 *
 * Les modèles se règlent par GEMINI_MODEL et ANTHROPIC_MODEL. Aucune clé
 * n'apparaît jamais dans un message d'erreur.
 */

const GEMINI_RACINE = 'https://generativelanguage.googleapis.com/v1beta/models';
const MODELE_PAR_DEFAUT = 'gemini-2.5-flash';
const DELAI_MS = 60_000;

export interface OptionsMoteur {
  system?: string;
  user: string;
  maxTokens?: number;
  temperature?: number;
}

interface ReponseGemini {
  candidates?: { content?: { parts?: { text?: string }[] }; finishReason?: string }[];
  promptFeedback?: { blockReason?: string };
  error?: { message?: string; status?: string; code?: number };
}

@Injectable()
export class MoteurService {
  private readonly journal = new Logger(MoteurService.name);

  constructor(private readonly claude: ClaudeService) {}

  private get cleGemini(): string | undefined {
    const c = process.env.GEMINI_API_KEY?.trim();
    return c || undefined;
  }

  /** Y a-t-il au moins un moteur branché sur ce serveur ? */
  get disponible(): boolean {
    return Boolean(this.cleGemini) || this.claude.disponible;
  }

  /** Le nom du moteur qui répondra, pour les écrans qui l'affichent. */
  get moteur(): 'gemini' | 'claude' | null {
    if (this.cleGemini) return 'gemini';
    if (this.claude.disponible) return 'claude';
    return null;
  }

  async completer(options: OptionsMoteur): Promise<string> {
    if (this.cleGemini) {
      try {
        return await this.gemini(options, this.cleGemini);
      } catch (err) {
        // Gemini a refusé : si Claude est branché, il prend le relais. Sinon on
        // remonte l'échec tel quel, pour que l'écran dise la vraie raison.
        if (!this.claude.disponible) throw err;
        this.journal.warn(`Gemini a échoué, on repasse sur Claude : ${propre(err).slice(0, 200)}`);
      }
    }
    if (this.claude.disponible) return this.claude.completer(options);
    throw new ServiceUnavailableException(
      "Aucun moteur de rédaction n'est branché sur ce serveur. Pose GEMINI_API_KEY (ou ANTHROPIC_API_KEY) dans la configuration.",
    );
  }

  /* ------------------------------------------------------------------ gemini */

  private async gemini(options: OptionsMoteur, cle: string): Promise<string> {
    const modele = process.env.GEMINI_MODEL?.trim() || MODELE_PAR_DEFAUT;
    const corps = {
      contents: [{ role: 'user', parts: [{ text: options.user }] }],
      ...(options.system ? { systemInstruction: { parts: [{ text: options.system }] } } : {}),
      generationConfig: {
        temperature: options.temperature ?? 0.3,
        maxOutputTokens: options.maxTokens ?? 2500,
        // Les consignes demandent un JSON strict : on le demande aussi au modèle.
        responseMimeType: 'application/json',
      },
    };

    const arret = new AbortController();
    const minuteur = setTimeout(() => arret.abort(), DELAI_MS);
    let reponse: Response;
    try {
      reponse = await fetch(`${GEMINI_RACINE}/${encodeURIComponent(modele)}:generateContent`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-goog-api-key': cle },
        body: JSON.stringify(corps),
        signal: arret.signal,
      });
    } catch (err) {
      throw new Error(`Gemini injoignable : ${propre(err)}`);
    } finally {
      clearTimeout(minuteur);
    }

    const donnees = (await reponse.json().catch(() => null)) as ReponseGemini | null;
    if (!reponse.ok) {
      const detail = donnees?.error?.message ?? `HTTP ${reponse.status}`;
      throw new Error(`Gemini ${reponse.status} : ${detail}`);
    }

    const bloque = donnees?.promptFeedback?.blockReason;
    if (bloque) throw new Error(`Gemini a refusé la demande (${bloque}).`);

    const texte = (donnees?.candidates?.[0]?.content?.parts ?? [])
      .map((p) => p?.text ?? '')
      .join('')
      .trim();
    if (!texte) throw new Error("Gemini n'a rien renvoyé.");
    return texte;
  }
}

/** Le message d'une erreur, sans jamais la clé. */
function propre(err: unknown): string {
  const cause = (err as { cause?: unknown } | null)?.cause;
  const detail = cause instanceof Error ? cause.message : typeof cause === 'string' ? cause : '';
  return `${err instanceof Error ? err.message : String(err)} ${detail}`
    .replace(/AIza[\w-]{10,}/g, '***')
    .replace(/sk-[A-Za-z0-9_-]{8,}/g, '***')
    .trim();
}
