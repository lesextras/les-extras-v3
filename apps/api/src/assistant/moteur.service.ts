import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ClaudeService } from './claude.service';
import { MistralService } from './mistral.service';

/**
 * LE MOTEUR DE RÉDACTION — GEMINI D'ABORD, CLAUDE EN SECOURS.
 *
 * Le reste du code ne sait pas quel modèle répond : il demande un texte, il
 * reçoit un texte. Ce service choisit, dans cet ordre :
 *
 *   1. GEMINI_API_KEY est posée  → Google Gemini ;
 *   1 bis. MISTRAL_API_KEY est posée → Mistral (repli, offre gratuite) ;
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
  /** La consigne : ce que le modèle doit faire, et ce qu'il ne doit jamais faire. */
  system: string;
  user: string;
  /** Le fil de la conversation, quand il y en a un. */
  historique?: { role: 'user' | 'assistant'; content: string }[];
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

  constructor(
    private readonly claude: ClaudeService,
    private readonly mistral: MistralService,
  ) {}

  private get cleGemini(): string | undefined {
    const c = process.env.GEMINI_API_KEY?.trim();
    return c || undefined;
  }

  /** Y a-t-il au moins un moteur branché sur ce serveur ? */
  get disponible(): boolean {
    return Boolean(this.cleGemini) || this.mistral.disponible || this.claude.disponible;
  }

  /** Le nom du moteur qui répondra, pour les écrans qui l'affichent. */
  get moteur(): 'gemini' | 'mistral' | 'claude' | null {
    if (this.cleGemini) return 'gemini';
    if (this.mistral.disponible) return 'mistral';
    if (this.claude.disponible) return 'claude';
    return null;
  }

  async completer(options: OptionsMoteur): Promise<string> {
    // Ce que Gemini a répondu quand il a refusé : gardé pour le joindre à
    // l'échec de Claude. Les deux moteurs tombent parfois pour la même raison
    // (une facturation à zéro, un réseau coupé) et ne voir que le second
    // envoie chercher la panne du mauvais côté.
    let echecGemini: string | null = null;
    const unRepli = this.mistral.disponible || this.claude.disponible;
    if (this.cleGemini) {
      try {
        return await this.gemini(options, this.cleGemini);
      } catch (err) {
        // Gemini a refusé : si un autre moteur est branché, il prend le relais.
        // Sinon on remonte l'échec tel quel, pour que l'écran dise la vraie raison.
        if (!unRepli) throw err;
        echecGemini = propre(err).slice(0, 300);
        this.journal.warn(`Gemini a échoué, on essaie le moteur suivant : ${echecGemini.slice(0, 200)}`);
      }
    }
    // MISTRAL AVANT CLAUDE, ET C'EST VOLONTAIRE.
    //
    // Les trois moteurs se facturent séparément de tout abonnement : un compte
    // Claude payé ne donne AUCUN crédit d'API. Quand la caisse est vide, ce qui
    // sauve l'outil, c'est le moteur qui a une offre gratuite. Gemini et
    // Mistral en ont une ; Claude n'en a pas. L'ordre suit donc le coût :
    // gratuit d'abord, payant en dernier.
    if (this.mistral.disponible) {
      try {
        return await this.mistral.completer(options);
      } catch (err) {
        if (!this.claude.disponible) {
          if (!echecGemini) throw err;
          const c = (err as { cause?: unknown } | null)?.cause;
          const d = c instanceof Error ? c.message : err instanceof Error ? err.message : String(err);
          throw new ServiceUnavailableException(
            "Le service de rédaction est momentanément indisponible. Réessayez dans un instant.",
            { cause: new Error(`Gemini : ${echecGemini} | Mistral : ${d}`) },
          );
        }
        const c = (err as { cause?: unknown } | null)?.cause;
        echecGemini = `${echecGemini ? echecGemini + ' | ' : ''}Mistral : ${
          c instanceof Error ? c.message : propre(err).slice(0, 200)
        }`;
        this.journal.warn(`Mistral a échoué, on repasse sur Claude.`);
      }
    }
    if (this.claude.disponible) {
      try {
        return await this.claude.completer(options);
      } catch (err) {
        if (!echecGemini) throw err;
        // Les deux ont échoué : on remonte l'échec de Claude, en lui accrochant
        // celui de Gemini. L'appelant redacte les clés avant d'afficher quoi
        // que ce soit.
        const cause = (err as { cause?: unknown } | null)?.cause;
        const detailClaude =
          cause instanceof Error ? cause.message : err instanceof Error ? err.message : String(err);
        throw new ServiceUnavailableException(
          "Le service de rédaction est momentanément indisponible. Réessayez dans un instant.",
          { cause: new Error(`Gemini : ${echecGemini} | Claude : ${detailClaude}`) },
        );
      }
    }
    throw new ServiceUnavailableException(
      "Aucun moteur de rédaction n'est branché sur ce serveur. Pose GEMINI_API_KEY, MISTRAL_API_KEY ou ANTHROPIC_API_KEY dans la configuration.",
    );
  }

  /* ------------------------------------------------------------------ gemini */

  private async gemini(options: OptionsMoteur, cle: string): Promise<string> {
    const modele = process.env.GEMINI_MODEL?.trim() || MODELE_PAR_DEFAUT;
    // Gemini parle en « tours » : l'assistant s'appelle « model » chez lui.
    const fil = (options.historique ?? []).map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));
    const corps = {
      contents: [...fil, { role: 'user', parts: [{ text: options.user }] }],
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
