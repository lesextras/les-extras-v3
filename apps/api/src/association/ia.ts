/**
 * L'IA AU SERVICE DE LA DEMANDE DE SUBVENTION.
 *
 * Deux usages, deux consignes. Chercher des financeurs (publics, fondations,
 * mécènes d'entreprise) qui correspondent au projet ; puis rédiger les textes
 * d'une demande à partir de ce que l'association a déjà noté chez elle.
 *
 * Deux règles tenues dans les consignes ET dans la lecture de la réponse :
 *  - AUCUN chiffre ni lien inventé. Le modèle ne donne un montant ou une URL
 *    que s'il en est sûr ; sinon il laisse vide, et l'écran affiche « à
 *    vérifier ».
 *  - la réponse est un JSON strict, pour ne jamais afficher du texte brut.
 */

export interface PisteFinanceur {
  nom: string;
  /** PUBLIC (État, collectivité), FONDATION, ENTREPRISE (mécénat), AUTRE. */
  type: 'PUBLIC' | 'FONDATION' | 'ENTREPRISE' | 'AUTRE';
  /** À quel niveau : commune, département, région, national. */
  echelle?: string;
  /** Ce qu'il soutient, en une phrase. */
  soutient: string;
  /** Pourquoi ça colle avec ce projet. */
  pourquoiVous: string;
  /** Comment s'y prendre : le premier geste concret. */
  commentFaire: string;
  /** Le site, seulement si le modèle en est sûr. */
  lien?: string;
  /** Ce qu'il faut vérifier avant de se lancer. */
  aVerifier?: string;
  /**
   * À quel point c'est accessible pour une petite association qui débute :
   * FACILE (dossier court, réponse rapide), MOYEN, DIFFICILE (gros dossier,
   * concurrence, cofinancements exigés). Les pistes faciles passent devant.
   */
  facilite: 'FACILE' | 'MOYEN' | 'DIFFICILE';
  /** Une ligne qui explique cette note. */
  pourquoiCetteNote?: string;
}

export interface DossierRedige {
  /** Le projet en une page, prêt à recopier dans le formulaire du financeur. */
  presentation: string;
  objectifs: string[];
  publics: string;
  deroulement: string;
  partenaires: string;
  evaluation: string;
  /** Le paragraphe qui explique pourquoi ce financeur en particulier. */
  argumentaire: string;
  /** Ce qu'il manque encore à l'association pour finir le dossier. */
  aCompleter: string[];
}

const REGLES_COMMUNES = `Tu écris pour une petite association loi 1901 en France, sans salarié, qui découvre les démarches.
Règles absolues :
- N'invente JAMAIS un montant, un pourcentage, une date limite, un numéro de dispositif ou une adresse web. Si tu n'es pas certain, laisse le champ vide et dis ce qu'il faut vérifier.
- Pas de jargon : des phrases courtes, des mots simples, le tutoiement n'est pas nécessaire.
- Pas d'emoji, pas de mise en forme markdown.
- Tu réponds UNIQUEMENT par un objet JSON valide, sans texte autour, sans bloc de code.`;

export const CONSIGNE_FINANCEURS = `${REGLES_COMMUNES}
Ta tâche : proposer des pistes de financement adaptées au projet décrit (financeurs publics, fondations, et mécénat d'entreprise).
Privilégie ce qui existe durablement (dispositifs installés, fondations connues, entreprises implantées localement) plutôt que des appels ponctuels dont tu ignores le calendrier.
Note aussi chaque piste selon sa DIFFICULTÉ pour une petite association qui débute :
- FACILE : dossier court, pas de cofinancement exigé, interlocuteur joignable, réponse en quelques semaines (souvent la commune, une petite fondation locale, un commerce du quartier).
- MOYEN : dossier structuré, budget prévisionnel demandé, calendrier annuel à respecter.
- DIFFICILE : gros dossier, forte concurrence, cofinancements ou agrément exigés, association déjà installée attendue.
Explique la note en une ligne dans "pourquoiCetteNote".
Format attendu :
{"pistes":[{"nom":"","type":"PUBLIC|FONDATION|ENTREPRISE|AUTRE","echelle":"","soutient":"","pourquoiVous":"","commentFaire":"","lien":"","aVerifier":"","facilite":"FACILE|MOYEN|DIFFICILE","pourquoiCetteNote":""}]}
Entre 5 et 8 pistes. Commence par les plus faciles à décrocher.`;

export const CONSIGNE_DOSSIER = `${REGLES_COMMUNES}
Ta tâche : rédiger les textes d'une demande de subvention à partir des informations fournies. N'ajoute aucun fait qui n'y figure pas : si une information manque, écris-la dans "aCompleter" au lieu de l'inventer.
Format attendu :
{"presentation":"","objectifs":["",""],"publics":"","deroulement":"","partenaires":"","evaluation":"","argumentaire":"","aCompleter":["",""]}
"presentation" : 8 à 12 lignes, ce que fait l'association et ce que ce projet apporte.`;

/** Lit la réponse du modèle : JSON strict, éventuellement entouré de bavardage. */
export function lireJson<T>(brut: string): T | null {
  const texte = brut.trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
  const debut = texte.indexOf('{');
  const fin = texte.lastIndexOf('}');
  if (debut < 0 || fin <= debut) return null;
  try {
    return JSON.parse(texte.slice(debut, fin + 1)) as T;
  } catch {
    return null;
  }
}

/** Le classement des pistes : le plus accessible d'abord. */
const ORDRE_FACILITE: Record<PisteFinanceur['facilite'], number> = { FACILE: 0, MOYEN: 1, DIFFICILE: 2 };

const texteCourt = (v: unknown, max = 400) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

/** On ne garde d'une piste que des champs propres : rien d'autre n'atteint l'écran. */
export function nettoyerPistes(brut: unknown): PisteFinanceur[] {
  const liste = Array.isArray((brut as { pistes?: unknown })?.pistes) ? ((brut as { pistes: unknown[] }).pistes as Record<string, unknown>[]) : [];
  const types = ['PUBLIC', 'FONDATION', 'ENTREPRISE', 'AUTRE'];
  const facilites = ['FACILE', 'MOYEN', 'DIFFICILE'];
  return liste
    .filter((p) => p && typeof p === 'object' && texteCourt(p.nom, 160))
    .slice(0, 8)
    .map((p) => {
      const lien = texteCourt(p.lien, 300);
      return {
        nom: texteCourt(p.nom, 160),
        type: (types.includes(String(p.type)) ? String(p.type) : 'AUTRE') as PisteFinanceur['type'],
        echelle: texteCourt(p.echelle, 80) || undefined,
        soutient: texteCourt(p.soutient, 400),
        pourquoiVous: texteCourt(p.pourquoiVous, 400),
        commentFaire: texteCourt(p.commentFaire, 400),
        // Un lien n'est gardé que s'il ressemble vraiment à une adresse https.
        lien: /^https:\/\/[\w.-]+\.[a-z]{2,}(\/\S*)?$/i.test(lien) ? lien : undefined,
        aVerifier: texteCourt(p.aVerifier, 300) || undefined,
        facilite: (facilites.includes(String(p.facilite)) ? String(p.facilite) : 'MOYEN') as PisteFinanceur['facilite'],
        pourquoiCetteNote: texteCourt(p.pourquoiCetteNote, 300) || undefined,
      };
    })
    // Du plus facile à décrocher au plus difficile : on commence par le possible.
    .sort((a, b) => ORDRE_FACILITE[a.facilite] - ORDRE_FACILITE[b.facilite]);
}

export function nettoyerDossier(brut: unknown): DossierRedige | null {
  const d = brut as Record<string, unknown> | null;
  if (!d || typeof d !== 'object') return null;
  const liste = (v: unknown, max: number) =>
    (Array.isArray(v) ? v : []).map((x) => texteCourt(x, 300)).filter(Boolean).slice(0, max);
  return {
    presentation: texteCourt(d.presentation, 4000),
    objectifs: liste(d.objectifs, 8),
    publics: texteCourt(d.publics, 1500),
    deroulement: texteCourt(d.deroulement, 3000),
    partenaires: texteCourt(d.partenaires, 1500),
    evaluation: texteCourt(d.evaluation, 1500),
    argumentaire: texteCourt(d.argumentaire, 2500),
    aCompleter: liste(d.aCompleter, 10),
  };
}
