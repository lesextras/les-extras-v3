/**
 * LE MOTEUR DE LANGAGE DE LEX, VU DU RESTE DE L'APPLICATION.
 *
 * LEX tourne désormais sur Claude (API Anthropic). MistralService reste dans le
 * dépôt et reste branchable : si la clé Anthropic n'est pas posée, c'est lui qui
 * prend le relais. Un seul contrat, deux implémentations, aucun appelant à
 * réécrire le jour où l'on change d'avis.
 */
export interface MoteurLex {
  /** Le service est-il configuré (clé présente) ? */
  readonly disponible: boolean;
  completer(options: {
    system: string;
    user: string;
    historique?: { role: 'user' | 'assistant'; content: string }[];
    maxTokens?: number;
    temperature?: number;
  }): Promise<string>;
}

/** Jeton d'injection Nest — le fournisseur est choisi dans AssistantModule. */
export const MOTEUR_LEX = 'MOTEUR_LEX';
