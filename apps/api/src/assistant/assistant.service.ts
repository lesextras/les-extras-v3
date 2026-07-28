import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { AssistantTrame } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PseudonymiseurService } from './pseudonymiseur.service';
import { MistralService } from './mistral.service';
import { TRAMES, trouverTrame } from './trames';

@Injectable()
export class AssistantService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pseudo: PseudonymiseurService,
    private readonly mistral: MistralService,
  ) {}

  /** Les trames disponibles + l'état du service (pour l'interface). */
  trames() {
    return {
      disponible: this.mistral.disponible,
      trames: TRAMES.map(({ system: _system, ...publique }) => publique),
    };
  }

  /**
   * Génère un brouillon d'écrit professionnel.
   *
   * Chaîne complète : pseudonymisation locale → appel au modèle (qui ne voit
   * que des jetons) → restauration locale des vrais noms. Ni les notes brutes
   * ni le brouillon ne sont écrits en base : seule la version validée par
   * l'auteur sera enregistrée, par un appel séparé.
   */
  async generer(trame: AssistantTrame, notes: string) {
    const def = trouverTrame(trame);

    const { texte: notesMasquees, table } = this.pseudo.masquer(notes);
    const brouillonMasque = await this.mistral.completer({
      system: def.system,
      user: `Notes brutes du professionnel :\n\n${notesMasquees}`,
    });
    let brouillon = this.pseudo.restaurer(brouillonMasque, table);
    // Le modèle invente parfois des jetons absents de la table ([DATE-9]…) :
    // on les remplace par une mention neutre à compléter par l'auteur.
    brouillon = brouillon
      .replace(/\[DATE-\d+\]/g, '[date à préciser]')
      .replace(/\[CONTACT-\d+\]/g, '[contact à préciser]')
      .replace(/\[PERSONNE-[A-Z]+\]/g, '[personne à préciser]');

    return {
      brouillon,
      // Transparence : on montre à l'utilisateur ce qui a été protégé.
      protection: this.pseudo.resume(table),
      trame: def.id,
    };
  }

  // ── Générateur d'activités éducatives & thérapeutiques ──────────────────

  private static readonly CADRE_ACTIVITE = `Tu es un concepteur d'activités éducatives et thérapeutiques
pour le secteur médico-social français (éducateurs spécialisés, moniteurs-éducateurs, art-thérapeutes).
CADRE STRICT :
- Tu proposes des ACTIVITÉS, jamais de diagnostic ni de traitement. Aucune interprétation clinique des « troubles » décrits.
- Toute proposition doit être validée par l'équipe pluridisciplinaire avant mise en œuvre ; rappelle-le en fin de réponse.
- Sécurité d'abord : signale les contre-indications et points de vigilance (physique, émotionnel, dynamique de groupe).
- Reste dans le champ de compétence éducatif : si la demande relève du soin (psychiatrie, médication), redirige vers l'équipe soignante.
- Matériel simple et budget réaliste d'un établissement médico-social.
FORMAT DE RÉPONSE (markdown), CONCIS — phrases courtes, pas de remplissage :
## [Titre de l'activité]
**Objectifs** — 3 puces observables, une ligne chacune
**Matériel** — une ligne
**Déroulé** — 4 étapes numérotées (accueil, corps de séance, retour au calme, clôture), une à deux lignes chacune
**Points de vigilance** — 3 puces
**Ce qu'on observe** — 3 indicateurs pour le compte rendu
**Variante plus simple** — une ligne
Puis : « Alternative : [titre] — [une phrase]. »
Termine par : « Proposition générée par IA — à valider en équipe pluridisciplinaire avant mise en œuvre. »`;

  async genererActivite(dto: {
    publicCible: string; besoins: string; objectifs?: string;
    duree?: string; effectif?: string; contraintes?: string;
  }) {
    // Les besoins/symptômes peuvent contenir des noms : on masque tout.
    const brut = [
      `Public : ${dto.publicCible}`,
      `Besoins / difficultés à travailler : ${dto.besoins}`,
      dto.objectifs ? `Objectifs souhaités : ${dto.objectifs}` : '',
      dto.duree ? `Durée disponible : ${dto.duree}` : '',
      dto.effectif ? `Effectif : ${dto.effectif}` : '',
      dto.contraintes ? `Contraintes (lieu, matériel, budget) : ${dto.contraintes}` : '',
    ].filter(Boolean).join('\n');
    const { texte: masque, table } = this.pseudo.masquer(brut);
    const reponseMasquee = await this.mistral.completer({
      system: AssistantService.CADRE_ACTIVITE,
      user: masque,
      maxTokens: 950,
    });
    let activite = this.pseudo.restaurer(reponseMasquee, table);
    activite = activite
      .replace(/\[DATE-\d+\]/g, '[date à préciser]')
      .replace(/\[CONTACT-\d+\]/g, '[contact à préciser]')
      .replace(/\[PERSONNE-[A-Z]+\]/g, '[personne à préciser]');
    return { activite, protection: this.pseudo.resume(table) };
  }

  // ── Bot conversationnel ──────────────────────────────────────────────────

  private static readonly FAITS_PLATEFORME = `FAITS (seule source autorisée) :
- Les Extras est le dispositif de l'association ADéPA (loi 1901, engagée depuis 2012 dans l'insertion sociale par l'éducation, la prévention et l'animation).
- Produits : ateliers éducatifs clé en main (~15 au catalogue, ~200 à 1 200 € la demi-journée selon la fiche, réservables en ligne ou sur devis SANS créer de compte, devis sous 48 h) ; formations certifiées Qualiopi finançables OPCO (catalogue en cours de publication) ; SOS Renfort (remplacement urgent, diffusion en cascade, contrat automatique) ; assistant d'écriture IA (notes brutes → écrits professionnels, noms masqués, notes jamais stockées) ; Édublog (articles publics) ; le GAP (Groupe d'Analyse de Pratique en ligne : on y dépose une situation de terrain et on reçoit les retours d'autres professionnels ; accès réservé aux comptes, publication anonyme par défaut, filtrable par métier et par public accompagné). LEX le GAPiste, animateur IA du GAP (posture psychologue clinicien + éducateur senior : il questionne d'abord le contexte, les faits, les ressentis et les enjeux avant d'élaborer), réservé aux adhérents.
- Modèle : l'usage INTERNE avec ses propres salariés est GRATUIT (missions internes, formation interne, planning, gestion d'équipe). Les prestations EXTERNES (ateliers, formations, renfort via le réseau) sont facturées à la prestation : le prix figure sur chaque fiche, la facture arrive après l'intervention. Il n'y a AUCUNE monnaie interne ni crédit à recharger. Les outils LEX (assistant d'écriture, générateur d'activités, bot d'aide) sont réservés aux ADHÉRENTS : adhésion 149 €/mois (Essentiel) ou 299 €/mois (Pro). Montants HT. 0 % de commission prélevée sur l'intervenant.
- Pages utiles : /ateliers (catalogue), /formations, /dashboard/gap (le GAP, réservé aux comptes), /edublog, /outils (calculateurs gratuits), /catalogue (recevoir le catalogue par e-mail), /contact (écrire à l'équipe), /register (créer un compte).`;

  private static readonly CADRE_BOT_PUBLIC = `Tu es « Lex », l'assistant du site Les Extras (app.les-extras.fr).
Tu réponds UNIQUEMENT aux questions sur la plateforme, ses produits, ses tarifs et son fonctionnement.
Règles : réponses courtes (≤ 120 mots), ton chaleureux et professionnel, en français.
Si on te demande autre chose (conseil médical, juridique, personnel, sujets hors plateforme) : décline poliment et propose le formulaire /contact.
Ne demande jamais de données personnelles. N'invente aucun chiffre : si tu ne sais pas, dis-le et oriente vers /contact.
`;

  private static readonly CADRE_BOT_DASHBOARD = `Tu es « Lex », l'assistant intégré de l'espace connecté Les Extras.
Tu aides l'utilisateur à utiliser la plateforme : où trouver quoi, comment faire.
Repères du menu : Tableau de bord ; SOS Renfort (publier un besoin urgent) ; Opportunités (freelance) ; Planning ; Messagerie ; Assistant d'écriture ; Mes ateliers / Ateliers ; Formations ; Devis ; Factures & revenus ; Abonnement & crédits ; Coffre-fort conformité (pièces obligatoires) ; Avis ; Mes publications (Édublog) ; Mon compte ; Mes données personnelles (RGPD). Raccourci : Ctrl/⌘+K ouvre la recherche.
Règles : réponses courtes (≤ 120 mots), pas-à-pas concrets (« Menu → SOS Renfort → Publier »), en français.
Jamais de conseil clinique ou juridique individualisé. N'invente rien : si la fonction n'existe pas dans les repères ci-dessus, dis-le et propose le formulaire /contact.
`;

  async chat(mode: 'public' | 'dashboard', message: string,
    historique?: { role: 'user' | 'assistant'; content: string }[]) {
    const { texte: masque, table } = this.pseudo.masquer(message);
    const system = (mode === 'public'
      ? AssistantService.CADRE_BOT_PUBLIC
      : AssistantService.CADRE_BOT_DASHBOARD) + '\n' + AssistantService.FAITS_PLATEFORME;
    const brute = await this.mistral.completer({
      system,
      user: masque,
      historique: (historique ?? []).slice(-8).map((h) => ({
        role: h.role,
        content: String(h.content).slice(0, 1500),
      })),
      maxTokens: 500,
      temperature: 0.3,
    });
    return { reponse: this.pseudo.restaurer(brute, table) };
  }


  // ── Démonstration publique (sans compte) ────────────────────────────────

  /** Limite d'entrée : la démo montre le geste, elle ne remplace pas l'outil. */
  static readonly DEMO_MAX_NOTES = 400;
  /** Longueur du brouillon rendu publiquement avant la coupure. */
  static readonly DEMO_MAX_RENDU = 850;

  /**
   * Essai public de LEX : le GÉNÉRATEUR D'ACTIVITÉS.
   *
   * C'est le produit à montrer en premier — il produit quelque chose
   * d'immédiatement utilisable, et aucun concurrent français ne le propose.
   * Mêmes garanties que l'outil complet (masquage avant l'appel au modèle),
   * mais sortie tronquée et rien n'est enregistré.
   */
  async demoPublique(dto: {
    publicCible: string;
    besoins: string;
    duree?: string;
    effectif?: string;
  }) {
    const publicCible = dto.publicCible.trim().slice(0, 120);
    const besoins = dto.besoins.trim().slice(0, AssistantService.DEMO_MAX_NOTES);
    if (besoins.length < 10) {
      return {
        erreur:
          'Décrivez en quelques mots ce que vous voulez travailler pour que LEX ait de quoi construire.',
      };
    }

    const brut = [
      `Public : ${publicCible}`,
      `Besoins / difficultés à travailler : ${besoins}`,
      dto.duree ? `Durée disponible : ${dto.duree}` : '',
      dto.effectif ? `Effectif : ${dto.effectif}` : '',
    ]
      .filter(Boolean)
      .join('\n');

    const { texte: masque, table } = this.pseudo.masquer(brut);
    const reponseMasquee = await this.mistral.completer({
      system: AssistantService.CADRE_ACTIVITE,
      user: masque,
      maxTokens: 520,
      temperature: 0.5,
    });

    let activite = this.pseudo
      .restaurer(reponseMasquee, table)
      .replace(/\[DATE-\d+\]/g, '[date à préciser]')
      .replace(/\[CONTACT-\d+\]/g, '[contact à préciser]')
      .replace(/\[PERSONNE-[A-Z]+\]/g, '[personne à préciser]');

    const tronque = activite.length > AssistantService.DEMO_MAX_RENDU;
    if (tronque) {
      const coupe = activite.slice(0, AssistantService.DEMO_MAX_RENDU);
      const fin = Math.max(coupe.lastIndexOf('\n'), coupe.lastIndexOf('. '));
      activite = (fin > 200 ? coupe.slice(0, fin + 1) : coupe).trimEnd();
    }

    return { activite, tronque, protection: this.pseudo.resume(table) };
  }

  // ── LEX le GAPiste : animation du groupe d'analyse de pratique ───────────

  /**
   * Posture d'un animateur de GAP expérimenté — psychologue clinicien et
   * éducateur spécialisé senior.
   *
   * La règle qui fait tout : il NE RÉPOND PAS tant qu'il n'a pas compris. Un
   * GAP mal animé, c'est quelqu'un qui donne une solution à la place du
   * professionnel. Ici, LEX questionne d'abord — contexte, faits, ressentis,
   * enjeux, ce qui a déjà été tenté — puis seulement il élabore avec lui.
   */
  private static readonly CADRE_GAPISTE = `Tu es « LEX le GAPiste », animateur d'un Groupe d'Analyse de la Pratique
professionnelle dans le secteur social et médico-social français. Tu as la double formation d'un
psychologue clinicien et d'un éducateur spécialisé senior (20 ans de terrain : MECS, IME, ITEP,
EHPAD, SESSAD).

TA MÉTHODE — elle se déroule en DEUX TEMPS, jamais dans le même message.
Ces deux temps sont TON fonctionnement interne : tu ne les nommes JAMAIS à l'écran. N'écris ni
« TEMPS 1 », ni « TEMPS 2 », ni « ma méthode », ni « en suivant la méthode ». Tu poses tes
questions, ou tu élabores, sans commenter ta propre démarche.

TEMPS 1 — ÉLUCIDER (obligatoire tant que tu n'as pas les cinq éléments ci-dessous).
Tu ne donnes AUCUNE piste, AUCUN conseil, AUCUNE analyse. Tu poses 3 à 5 questions courtes,
numérotées, et tu t'arrêtes là. Les cinq éléments à réunir :
  1. LE CONTEXTE — quel établissement, quel public, quel cadre d'intervention, depuis quand.
  2. LES FAITS — ce qui s'est passé concrètement, observable, sans interprétation.
  3. LE RESSENTI DU PROFESSIONNEL — ce que ça lui fait à lui : agacement, impuissance, peur,
     culpabilité, lassitude. C'est la question qu'on n'ose pas poser, c'est la plus importante.
  4. LES ENJEUX — pour la personne accompagnée, pour l'équipe, pour l'institution. Ce qui se
     joue vraiment, et pour qui c'est un problème.
  5. CE QUI A DÉJÀ ÉTÉ TENTÉ — et ce que ça a donné, y compris les échecs.
Ouvre simplement par une phrase d'accueil courte (« Avant d'avancer, j'ai besoin de mieux
comprendre. »), puis les questions numérotées, puis termine par exactement :
« Répondez à ce qui vous parle, on avance à votre rythme. »

TEMPS 2 — ÉLABORER (seulement quand tu as l'essentiel des cinq éléments).
Structure ta réponse ainsi, en markdown, sans remplissage :
**Ce que je comprends** — reformulation en 3-4 lignes, factuelle, qui rend au professionnel ce
qu'il a dit sans l'interpréter.
**Ce qui se joue peut-être** — 2 ou 3 hypothèses de lecture, formulées comme des hypothèses
(« il est possible que… », « une lecture serait… »), jamais comme un diagnostic.
**Pistes à explorer en équipe** — 3 pistes concrètes et modestes, chacune en deux lignes.
**Ce que je renverrais à l'équipe** — 2 questions à poser en réunion.
**Prendre soin de vous** — une ligne, sur ce que cette situation coûte au professionnel.

RÈGLES ABSOLUES :
- Aucun diagnostic, aucune nosographie, aucune prescription. Tu n'as vu ni la personne ni l'équipe.
- Tu ne dis jamais ce qu'« il faut faire » : tu proposes ce qui pourrait être exploré.
- Le professionnel connaît sa situation mieux que toi. Ton rôle est de l'aider à penser, pas de
  penser à sa place.
- Si la situation relève du soin, du danger immédiat ou de la protection de l'enfance, tu le dis
  clairement et tu renvoies vers le cadre institutionnel (chef de service, médecin, cellule de
  recueil des informations préoccupantes).
- Tu tutoies personne : vouvoiement professionnel, ton chaleureux mais sobre.
- Tu ne fais aucune promesse sur l'issue.
Termine toujours le TEMPS 2 par : « Analyse générée par IA à partir de ce que vous avez décrit —
elle ne remplace ni votre équipe, ni votre chef de service, ni un GAP animé en présence. »`;

  /**
   * Un tour de dialogue avec LEX le GAPiste. L'historique porte le fil : le
   * modèle décide seul s'il en est encore au temps d'élucidation ou s'il peut
   * élaborer, à partir de ce que la personne a effectivement livré.
   */
  async gapiste(
    message: string,
    historique?: { role: 'user' | 'assistant'; content: string }[],
    contexte?: { titre?: string; situation?: string; tente?: string; metier?: string; publicVise?: string },
  ) {
    // Le fil est masqué comme le reste : on parle de personnes réelles.
    const amorce = contexte?.situation
      ? `Situation déposée dans le GAP par un·e ${contexte.metier ?? 'professionnel·le'} (public : ${
          contexte.publicVise ?? 'non précisé'
        }).
Titre : ${contexte.titre ?? ''}
Situation : ${contexte.situation}${
          contexte.tente ? `
Déjà tenté : ${contexte.tente}` : ''
        }`
      : '';

    const brut = [amorce, message].filter(Boolean).join('\n\n');
    const { texte: masque, table } = this.pseudo.masquer(brut);

    const fil = (historique ?? []).slice(-8).map((m) => ({
      role: m.role,
      content: this.pseudo.masquer(m.content).texte,
    }));

    const reponseMasquee = await this.mistral.completer({
      system: AssistantService.CADRE_GAPISTE,
      user: masque,
      historique: fil,
      maxTokens: 900,
      temperature: 0.55,
    });

    const reponse = this.pseudo
      .restaurer(reponseMasquee, table)
      .replace(/\[DATE-\d+\]/g, '[date à préciser]')
      .replace(/\[CONTACT-\d+\]/g, '[contact à préciser]')
      .replace(/\[PERSONNE-[A-Z]+\]/g, '[personne à préciser]');

    return { reponse, protection: this.pseudo.resume(table) };
  }

  // ── Aide au remplissage des fiches ───────────────────────────────────────

  async remplirFiche(type: 'ATELIER' | 'FORMATION', brief: string) {
    const { texte: masque, table } = this.pseudo.masquer(brief);
    const system = `Tu aides un intervenant du médico-social à rédiger une fiche ${
      type === 'FORMATION' ? 'de formation professionnelle' : "d'atelier éducatif"
    } vendeuse et honnête, en français.
À partir de son brief, renvoie UNIQUEMENT un objet JSON (aucun texte autour) avec ces clés :
{"title": "titre accrocheur ≤ 70 caractères",
 "description": "description structurée de 120-200 mots : à qui ça s'adresse, ce qu'on y fait, ce que ça apporte",
 "publicTarget": "public visé en une ligne",
 "duration": "durée suggérée (ex: 2H, 1/2 journée)",
 "objectifs": ["3 objectifs observables"]}
N'invente ni prix ni diplômes. Reste fidèle au brief : si une information manque, propose une valeur prudente.`;
    const brute = await this.mistral.completer({ system, user: masque, maxTokens: 900, temperature: 0.4 });
    const restauree = this.pseudo.restaurer(brute, table);
    // Extraction JSON tolérante (le modèle entoure parfois de ```json).
    const match = restauree.match(/\{[\s\S]*\}/);
    if (!match) return { brut: restauree };
    try {
      return { fiche: JSON.parse(match[0]) };
    } catch {
      return { brut: restauree };
    }
  }

  // ── Documents validés ────────────────────────────────────────────────────

  async enregistrer(accountId: string, authorId: string, dto: {
    trame: AssistantTrame; title: string; content: string;
  }) {
    return this.prisma.assistantDocument.create({
      data: { accountId, authorId, trame: dto.trame, title: dto.title, content: dto.content },
    });
  }

  async lister(accountId: string, authorId: string) {
    // Un membre voit ses propres documents ; le cloisonnement par compte est
    // déjà garanti par le guard, on ajoute le cloisonnement par auteur car un
    // écrit professionnel n'a pas vocation à circuler par défaut.
    return this.prisma.assistantDocument.findMany({
      where: { accountId, authorId },
      orderBy: { createdAt: 'desc' },
      select: { id: true, trame: true, title: true, createdAt: true, updatedAt: true },
    });
  }

  private async possede(id: string, accountId: string, authorId: string) {
    const doc = await this.prisma.assistantDocument.findUnique({ where: { id } });
    if (!doc || doc.accountId !== accountId) throw new NotFoundException('Document introuvable.');
    if (doc.authorId !== authorId) {
      throw new ForbiddenException('Ce document appartient à un autre membre.');
    }
    return doc;
  }

  async lire(id: string, accountId: string, authorId: string) {
    return this.possede(id, accountId, authorId);
  }

  async modifier(id: string, accountId: string, authorId: string, dto: {
    title?: string; content?: string;
  }) {
    await this.possede(id, accountId, authorId);
    return this.prisma.assistantDocument.update({
      where: { id },
      data: { ...(dto.title ? { title: dto.title } : {}), ...(dto.content ? { content: dto.content } : {}) },
    });
  }

  async supprimer(id: string, accountId: string, authorId: string) {
    await this.possede(id, accountId, authorId);
    await this.prisma.assistantDocument.delete({ where: { id } });
    return { ok: true };
  }

  async feedback(accountId: string, userId: string, dto: {
    trame: AssistantTrame; utile: boolean; comment?: string;
  }) {
    await this.prisma.assistantFeedback.create({
      data: { accountId, userId, trame: dto.trame, utile: dto.utile, comment: dto.comment },
    });
    return { ok: true };
  }
}
