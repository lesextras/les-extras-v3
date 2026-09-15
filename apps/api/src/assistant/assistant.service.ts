import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { AssistantTrame, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PseudonymiseurService, nettoyerJetonsResiduels } from './pseudonymiseur.service';
import { RegistrePseudoService } from './registre-pseudo.service';
import { MOTEUR_LEX, MoteurLex } from './moteur-lex';
import {
  NOMBRE_ANTERIEURS,
  blocAnteriorite,
  extraitUtile,
  sujetsDuTexte,
  trameAvecMemoire,
  type EcritAnterieur,
} from './anteriorite';
import {
  LIBELLES_TRAMES,
  TRAMES_OFFERTES,
  consigneEcritLibre,
  trouverTrame,
} from './trames';
import {
  GROUPES_ACTIVITE, GROUPES_APPUI, GROUPES_ECRIT, consignesDepuisChoix,
} from './options';

/**
 * ENLEVER LE BALISAGE MARKDOWN (25/08/2026).
 *
 * La consigne le dit au modele, mais un modele entraine sur du Markdown y
 * revient : les etoiles reapparaissaient a l'ecran et jusque dans le Word.
 * On ne discute donc pas, on nettoie — c'est deterministe et ca ne rate pas.
 *
 * Un titre en gras seul sur sa ligne devient une ligne en majuscules : c'est
 * la forme d'un ecrit professionnel imprime. Ailleurs, les marques tombent
 * et le texte reste.
 */
export function sansBalisage(texte: string): string {
  return texte
    .split("\n")
    .map((ligne) => {
      const nu = ligne.trim();
      // Une ligne de separation ne veut rien dire sur du papier.
      if (/^([-*_=]\s*){3,}$/.test(nu)) return "";
      // Un titre, quelle que soit sa notation, devient une ligne en capitales.
      const titreDiese = nu.match(/^#{1,6}\s+(.*)$/);
      if (titreDiese) return titreDiese[1].replace(/[*_`]/g, "").toUpperCase();
      const titreGras = nu.match(/^\*\*(.+)\*\*:?$/);
      if (titreGras) return titreGras[1].replace(/[*_`]/g, "").toUpperCase();
      // Une puce reste une puce. ⚠ ELLE S'ÉCRIVAIT AVEC UN TIRET CADRATIN, et
      // le passage du 4/09/2026 qui a retire ces tirets du texte l'a transformee
      // en virgule en tete de ligne : chaque puce d'un document LEX sortait
      // « , texte ». Ici le tiret n'etait pas une ponctuation de phrase mais un
      // MARQUEUR, et un marqueur ne se remplace pas par une virgule. Le point
      // median est ce qu'on lit dans un document Word imprime.
      let corps = ligne.replace(/^(\s*)[-*+]\s+/, "$1\u2022 ");
      // Le reste du balisage tombe, le texte demeure.
      corps = corps
        .replace(/\*\*(.+?)\*\*/g, "$1")
        .replace(/(^|[^*])\*(?!\s)([^*\n]+?)\*(?!\*)/g, "$1$2")
        .replace(/`([^`\n]+)`/g, "$1");
      return corps;
    })
    .join("\n")
    // Trois lignes vides ou plus n'apportent rien : on les ramene a deux.
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

@Injectable()
export class AssistantService {
  private readonly logger = new Logger(AssistantService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly pseudo: PseudonymiseurService,
    private readonly registre: RegistrePseudoService,
    @Inject(MOTEUR_LEX) private readonly moteur: MoteurLex,
  ) {}

  /**
   * A QUI PEUT-ON ENVOYER UN ECRIT ? (25/08/2026)
   *
   * La route d'envoi acceptait n'importe quelle adresse. Comme l'inscription
   * est libre, elle constituait un relais de courriel signe par le domaine :
   * sujet choisi, corps choisi, piece jointe choisie, expedie depuis
   * les-extras.fr avec SPF et DKIM alignes. De quoi ecrire aux directions du
   * secteur en se faisant passer pour la plateforme, et bruler la
   * delivrabilite de tous les courriels du domaine au passage.
   *
   * On borne donc a ce qui a du sens : sa propre adresse, ou celle d'un
   * membre actif du compte courant. Un ecrit professionnel se transmet a son
   * equipe, pas a l'annuaire.
   */
  async destinataireAutorise(accountId: string, userId: string, email: string) {
    const cible = email.trim().toLowerCase();
    const moi = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });
    if (moi?.email.toLowerCase() === cible) return true;
    const membre = await this.prisma.membership.findFirst({
      where: {
        accountId,
        status: 'ACTIVE',
        user: { email: { equals: cible, mode: Prisma.QueryMode.insensitive } },
      },
      select: { id: true },
    });
    return Boolean(membre);
  }

  /**
   * Les trames disponibles + l'état du service (pour l'interface).
   *
   * `trames` ne porte que les genres OFFERTS au choix, dans l'ordre voulu.
   * `libelles` porte tous les genres, y compris ceux qui ne sont plus offerts :
   * sans lui, un document enregistré l'an dernier s'afficherait dans « Mes
   * documents » sous son identifiant technique.
   */
  trames() {
    return {
      disponible: this.moteur.disponible,
      trames: TRAMES_OFFERTES.map(({ system: _system, ...publique }) => publique),
      libelles: LIBELLES_TRAMES,
    };
  }


  /**
   * CE QUE LE MOTEUR VA LIRE, MONTRÉ AVANT L'ENVOI (06/09/2026).
   *
   * Le masquage existait depuis le premier jour, mais personne ne le voyait :
   * on affichait un compteur (« 3 personnes protégées ») et il fallait croire
   * sur parole. Une direction ne signe pas un outil sur parole.
   *
   * Cette route renvoie le texte EXACTEMENT tel qu'il partira, pseudonymes
   * compris. Le professionnel lit, vérifie qu'aucun nom n'est passé au
   * travers, corrige ses notes si besoin, et décide. La promesse cesse d'être
   * probabiliste : elle devient vérifiable, à chaque écrit.
   *
   * GRATUIT et sans appel au modèle : c'est un contrôle, pas une génération.
   * Facturer la vérification d'une garantie serait indéfendable.
   */
  async apercuMasquage(accountId: string, notes: string) {
    const { texte, table } = this.pseudo.masquer(notes);
    // Les mêmes pseudonymes que ceux de la génération : le registre du compte
    // les fixe une fois pour toutes. Un aperçu qui montrerait d'autres jetons
    // que ceux réellement envoyés serait pire que pas d'aperçu du tout.
    const stables = await this.registre.stabiliser(accountId, table);
    return {
      masque: RegistrePseudoService.reecrire(texte, stables),
      protection: this.pseudo.resume(table),
    };
  }

  /**
   * LES ÉCRITS DÉJÀ RÉDIGÉS SUR LES MÊMES PERSONNES.
   *
   * On cherche par pseudonyme stable, jamais par nom : `AssistantDocument.sujets`
   * porte « M.D-1 », et le registre garantit que ce code désigne la même
   * personne d'un écrit à l'autre, dans ce compte et nulle part ailleurs.
   *
   * Le contenu enregistré porte les VRAIS noms, puisqu'il vit dans le compte.
   * Il repasse donc par le masque et par le registre avant de repartir vers le
   * modèle, exactement comme les notes du jour : le moteur ne relit que des
   * pseudonymes, et ce sont les mêmes des deux côtés.
   *
   * Toute panne ici est silencieuse et sans conséquence : une antériorité qu'on
   * n'a pas su relire fait un document sans continuité, pas un échec. On ne
   * bloque jamais une génération pour ça.
   */
  private async anteriorite(
    accountId: string,
    authorId: string,
    trame: AssistantTrame,
    sujets: readonly string[],
  ): Promise<{ ecrits: EcritAnterieur[]; sources: { id: string; titre: string; date: Date }[] }> {
    const vide = { ecrits: [], sources: [] };
    if (!trameAvecMemoire(trame) || sujets.length === 0) return vide;

    try {
      const precedents = await this.prisma.assistantDocument.findMany({
        // ⚠ LE CLOISONNEMENT PAR AUTEUR EST VOLONTAIRE, et repris de
        // `listerDocuments` : un éducateur ne découvre pas par LEX ce qu'un
        // collègue a écrit sur un jeune.
        where: { accountId, authorId, sujets: { hasSome: [...sujets] } },
        orderBy: { createdAt: 'desc' },
        take: NOMBRE_ANTERIEURS,
        select: { id: true, title: true, content: true, createdAt: true },
      });
      if (precedents.length === 0) return vide;

      const ecrits: EcritAnterieur[] = [];
      const sources: { id: string; titre: string; date: Date }[] = [];
      for (const p of precedents) {
        const { texte, table } = this.pseudo.masquer(p.content);
        const stables = await this.registre.stabiliser(accountId, table);
        ecrits.push({
          titre: p.title,
          quand: p.createdAt.toLocaleDateString('fr-FR', {
            day: '2-digit', month: 'long', year: 'numeric',
          }),
          extrait: extraitUtile(RegistrePseudoService.reecrire(texte, stables)),
        });
        sources.push({ id: p.id, titre: p.title, date: p.createdAt });
      }
      // Du plus ancien au plus récent : une évolution se lit dans ce sens.
      ecrits.reverse();
      sources.reverse();
      return { ecrits, sources };
    } catch (e) {
      this.logger.error(`[LEX:anteriorite] ${(e as Error).message}`);
      return vide;
    }
  }

  /**
   * Génère un brouillon d'écrit professionnel.
   *
   * Chaîne complète : pseudonymisation locale → appel au modèle (qui ne voit
   * que des jetons) → restauration locale des vrais noms. Ni les notes brutes
   * ni le brouillon ne sont écrits en base : seule la version validée par
   * l'auteur sera enregistrée, par un appel séparé.
   */
  async generer(
    /** Le compte : c'est lui qui porte le registre des pseudonymes. */
    accountId: string,
    /**
     * L'auteur. Il sert à la mémoire des situations, qui ne franchit pas la
     * frontière posée par `listerDocuments` : on ne relit que ses propres
     * écrits, jamais ceux d'un collègue.
     */
    authorId: string,
    trame: AssistantTrame,
    notes: string,
    trameMaison?: {
      id: string;
      nom: string;
      squelette: string;
      style: string;
      extrait: string | null;
    } | null,
    /** Cases cochées dans l'interface : destinataire, registre, parties, longueur. */
    choix?: Readonly<Record<string, readonly string[] | undefined>>,
    /**
     * Le nom que le professionnel a donné à son écrit, saisi AVANT les notes.
     * Il n'a de sens que pour l'écrit libre : c'est lui qui remplace le genre.
     */
    intitule?: string,
  ) {
    const def = trouverTrame(trame);
    // L'ÉCRIT LIBRE N'A PAS DE GENRE, IL A UN NOM (06/09/2026).
    //
    // Pour les trois genres offerts, la consigne est écrite d'avance et testée
    // en CI. Pour l'écrit libre, elle se compose ici, autour de l'intitulé que
    // la personne a saisi : le socle déontologique reste devant, à l'identique,
    // et c'est la seule chose qui change.
    const nomLibre = def.intituleLibre ? (intitule ?? '').trim() : '';
    if (def.intituleLibre && nomLibre.length < 3) {
      throw new BadRequestException(
        "Donnez d'abord un nom à votre écrit : c'est lui qui dit quel document produire.",
      );
    }
    const consigne = def.intituleLibre ? consigneEcritLibre(nomLibre) : def.system;

    // Les consignes de forme ne contiennent aucune donnée personnelle : elles
    // se placent avant les notes masquées, sans passer par la pseudonymisation.
    const consignes = consignesDepuisChoix(GROUPES_ECRIT, choix ?? {});
    const cadrage = consignes.length
      ? `Consignes de forme, à respecter :\n${consignes.map((c) => `- ${c}`).join('\n')}\n\n`
      : '';

    const { texte: notesMasquees, table } = this.pseudo.masquer(notes);

    // UN PSEUDONYME QUI NE BOUGE PLUS (25/08/2026).
    //
    // Le masque jetable donnait [PERSONNE-A] a Marie ce matin et
    // [PERSONNE-B] cet apres-midi : rien ne pouvait se chainer d'un ecrit a
    // l'autre. Le registre du compte lui attribue « M.D-1 », une fois pour
    // toutes. Aucun nom reel ne circule pour autant : le registre ne garde
    // qu'une empreinte, et la table de restauration vit le temps de l'appel.
    const stables = await this.registre.stabiliser(accountId, table);
    const notesPretes = RegistrePseudoService.reecrire(notesMasquees, stables);

    // LA MÉMOIRE DES SITUATIONS.
    //
    // Les pseudonymes du jour désignent des personnes ; s'il existe déjà des
    // écrits de synthèse sur elles, LEX les relit avant d'écrire. C'est ce qui
    // permet à un rapport trimestriel de dire « depuis le précédent rapport »
    // au lieu de repartir de zéro. Voir `anteriorite.ts` pour les règles.
    const sujets = sujetsDuTexte(notesPretes);
    const { ecrits, sources } = await this.anteriorite(accountId, authorId, trame, sujets);

    const brouillonMasque = await this.moteur.completer({
      system: trameMaison ? AssistantService.avecTrameMaison(consigne, trameMaison) : consigne,
      user: `${cadrage}${blocAnteriorite(ecrits)}Notes brutes du professionnel :\n\n${notesPretes}`,
      // Relire deux écrits antérieurs demande de la place pour répondre : un
      // plafond calculé sur la seule trame produirait un document tronqué.
      maxTokens: ecrits.length ? 2600 : trameMaison ? 1600 : undefined,
    });
    let brouillon = this.pseudo.restaurer(brouillonMasque, table);
    // Le modèle invente parfois des jetons absents de la table ([DATE-9]…) :
    // on les remplace par une mention neutre à compléter par l'auteur.
    brouillon = sansBalisage(nettoyerJetonsResiduels(brouillon));

    return {
      brouillon,
      // Transparence : on montre à l'utilisateur ce qui a été protégé.
      protection: this.pseudo.resume(table),
      trame: def.id,
      trameMaison: trameMaison ? { id: trameMaison.id, nom: trameMaison.nom } : null,
      // Sur un écrit libre, le titre proposé est celui que la personne a écrit
      // elle-même : c'est le seul cas où LEX n'a rien à proposer de mieux.
      titrePropose: nomLibre || def.titre,
      // ⚠ ON DIT TOUJOURS CE QUI A ÉTÉ RELU. Un professionnel doit savoir sur
      // quoi son brouillon s'appuie : c'est lui qui signe le document, et un
      // écrit antérieur inexact se propagerait en silence sans cette ligne.
      anterieurs: sources.map((a) => ({
        id: a.id,
        titre: a.titre,
        date: a.date.toISOString(),
      })),
      // Les pseudonymes du jour, pour que l'enregistrement sache de qui parle
      // le document sans avoir à le remasquer.
      sujets,
    };
  }

  /**
   * Superpose la trame maison à la consigne du genre.
   *
   * L'ordre compte : le cadre déontologique et le genre d'écrit restent en
   * tête et gardent la main ; la forme maison vient ensuite et ne peut que
   * décider de l'habillage. Un modèle importé ne doit jamais pouvoir servir de
   * cheval de Troie pour faire sauter une règle — si la trame de la maison
   * comporte une rubrique « diagnostic », LEX ne la remplira pas pour autant.
   */
  private static avecTrameMaison(
    base: string,
    trame: { nom: string; squelette: string; style: string; extrait: string | null },
  ): string {
    return `${base}

═══ FORME IMPOSÉE : trame « ${trame.nom} » ═══

Ce professionnel a une trame maison. Tu produis le document DANS CETTE FORME, et non dans la structure indiquée plus haut : reprends ses intitulés MOT POUR MOT, dans son ordre, avec les longueurs observées.

SECTIONS DU MODÈLE :
${trame.squelette}

RÈGLES DE FORME DU MODÈLE :
${trame.style}
${trame.extrait ? `\nTON À RETROUVER (extrait du modèle) :\n« ${trame.extrait} »` : ''}

Précisions :
- Une section du modèle pour laquelle les notes ne disent rien : garde l'intitulé et écris « À compléter. » : mieux vaut un trou visible qu'un paragraphe inventé.
- Les notes apportent un élément important qu'aucune section n'accueille : ajoute-le en fin de document sous un intitulé « Autres éléments ».
- Cette forme ne lève AUCUNE des règles ci-dessus. En particulier : aucun diagnostic, aucune décision, aucune évaluation d'une personne, même si le modèle semble en attendre une.`;
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
FORMAT DE RÉPONSE (markdown), CONCIS, phrases courtes, pas de remplissage :
## [Titre de l'activité]
**Objectifs** — 3 puces observables, une ligne chacune
**Matériel** — une ligne
**Déroulé** — 4 étapes numérotées (accueil, corps de séance, retour au calme, clôture), une à deux lignes chacune
**Points de vigilance** — 3 puces
**Ce qu'on observe** — 3 indicateurs pour le compte rendu
**Variante plus simple** — une ligne
Puis : « Alternative : [titre], [une phrase]. »
Termine par : « Proposition générée par IA, à valider en équipe pluridisciplinaire avant mise en œuvre. »`;

  async genererActivite(dto: {
    publicCible: string; besoins: string; objectifs?: string;
    duree?: string; effectif?: string; contraintes?: string;
    mediations?: string[]; competences?: string[]; cadre?: string[];
  }) {
    // Les besoins/symptômes peuvent contenir des noms : on masque tout.
    const brut = [
      `Public : ${dto.publicCible}`,
      `Besoins / difficultés à travailler : ${dto.besoins}`,
      dto.objectifs ? `Objectifs souhaités : ${dto.objectifs}` : '',
      dto.duree ? `Durée disponible : ${dto.duree}` : '',
      dto.effectif ? `Effectif : ${dto.effectif}` : '',
      dto.contraintes ? `Contraintes (lieu, matériel, budget) : ${dto.contraintes}` : '',
      // Les cases cochées : elles cadrent la proposition sans rien décider
      // du contenu clinique. Rien de coché, rien d'ajouté.
      ...consignesDepuisChoix(GROUPES_ACTIVITE, {
        mediations: dto.mediations,
        competences: dto.competences,
        cadre: dto.cadre,
      }),
    ].filter(Boolean).join('\n');
    const { texte: masque, table } = this.pseudo.masquer(brut);
    const reponseMasquee = await this.moteur.completer({
      system: AssistantService.CADRE_ACTIVITE,
      user: masque,
      maxTokens: 950,
    });
    let activite = this.pseudo.restaurer(reponseMasquee, table);
    activite = nettoyerJetonsResiduels(activite);
    return { activite, protection: this.pseudo.resume(table) };
  }


  // ── Appui scolaire ───────────────────────────────────────────────────────

  private static readonly CADRE_APPUI = `Tu conçois des supports d'appui scolaire pour des professionnels
de l'éducation et du social français (éducateurs, animateurs de réussite éducative,
accompagnants) qui aident un enfant en difficulté scolaire.

Règles absolues, sans exception :
1. Tu ne poses AUCUN diagnostic. Tu ne nommes aucun trouble, aucune pathologie,
   aucun handicap, même si la description le suggère fortement. Tu travailles
   sur ce qui est observé, pas sur ce qui pourrait l'expliquer.
2. Tu ne remplaces ni l'enseignant ni le professionnel : tu produis un support
   qu'un adulte présent utilisera avec l'enfant.
3. Tu restes concret. Chaque support doit être utilisable tel quel demain,
   sans matériel rare, sans préparation longue, sans impression couleur.
4. Tu adaptes le vocabulaire et la longueur à l'âge indiqué.
5. Tu n'inventes aucun élément de la situation qui ne t'a pas été donné.
6. Tu ne donnes jamais de conseil médical, ni d'orientation scolaire.

Réponds en français, en texte structuré avec des titres courts.
Produis :
- Le support demandé, prêt à l'emploi.
- « Comment l'amener » : trois phrases que l'adulte peut dire pour lancer.
- « Si ça bloque » : deux replis concrets.
- « Ce qu'on observe » : deux ou trois indices que ça a fonctionné.

Termine toujours par : « Support à ajuster avec l'enseignant de l'enfant et
l'équipe éducative. Il ne vaut pas évaluation ni orientation. »`;

  async genererAppuiScolaire(dto: {
    niveau: string; matiere: string; difficulte: string;
    temps?: string; moyens?: string;
    supports?: string[]; obstacles?: string[]; posture?: string;
  }) {
    // La description peut contenir le prénom de l'enfant : on masque tout.
    const brut = [
      `Niveau / âge : ${dto.niveau}`,
      `Matière ou domaine : ${dto.matiere}`,
      `Ce que le professionnel observe : ${dto.difficulte}`,
      dto.temps ? `Temps disponible : ${dto.temps}` : '',
      dto.moyens ? `Moyens sur place : ${dto.moyens}` : '',
      ...consignesDepuisChoix(GROUPES_APPUI, {
        supports: dto.supports,
        obstacles: dto.obstacles,
        posture: dto.posture ? [dto.posture] : undefined,
      }),
    ].filter(Boolean).join('\n');

    const { texte: masque, table } = this.pseudo.masquer(brut);
    const reponseMasquee = await this.moteur.completer({
      system: AssistantService.CADRE_APPUI,
      user: masque,
      maxTokens: 1100,
    });
    let support = this.pseudo.restaurer(reponseMasquee, table);
    support = nettoyerJetonsResiduels(support);
    return { support, protection: this.pseudo.resume(table) };
  }

  // ── Bot conversationnel ──────────────────────────────────────────────────

  private static readonly FAITS_PLATEFORME = `FAITS (seule source autorisée) :
- Les Extras est le dispositif de l'association ADéPA (loi 1901, engagée depuis 2012 dans l'insertion sociale par l'éducation, la prévention et l'animation).
- Produits : ateliers éducatifs clé en main (~15 au catalogue, le prix figure sur chaque fiche, réservables en ligne ou sur devis SANS créer de compte, devis sous 48 h) ; formations certifiées Qualiopi finançables OPCO (catalogue en cours de publication) ; RenforTeam (remplacement urgent, diffusion en cascade, contrat automatique) ; assistant d'écriture IA (notes brutes → écrits professionnels, noms masqués, notes jamais stockées) ; Édublog (articles publics).
- Modèle : la plateforme est ENTIÈREMENT GRATUITE pour la mise en relation et l'aide à la contractualisation, publier ou réserver un renfort, proposer ou réserver un atelier, jusqu'au contrat et à la facture, pour les intervenants COMME pour les établissements, sans commission : l'établissement paie le tarif de l'intervenant, l'intervenant le touche intégralement. Deux services seulement sont payants : (1) les formations Qualiopi, facturées au devis par l'association ADéPA (certifiée Qualiopi), qui fait appel aux formateurs du réseau Les Extras ; (2) LEX, l'assistant IA, à crédits, un crédit par génération, rechargeable par packs ou par abonnement à recharge quotidienne. Les tarifs exacts (packs, abonnements) sont affichés dans l'espace connecté, page « LEX, Crédits & abonnement » : n'annonce JAMAIS de montant de tête. L'usage interne (planning, gestion d'équipe, formation interne) est gratuit aussi.
- Pages utiles : /ateliers (catalogue), /formations, /edublog, /outils (calculateurs gratuits), /catalogue (recevoir le catalogue par e-mail), /contact (écrire à l'équipe), /register (créer un compte).`;

  private static readonly CADRE_BOT_PUBLIC = `Tu es « Lex », l'assistant du site Les Extras (les-extras.fr).
Tu réponds UNIQUEMENT aux questions sur la plateforme, ses produits, ses tarifs et son fonctionnement.
Règles : réponses courtes (≤ 120 mots), ton chaleureux et professionnel, en français.
Si on te demande autre chose (conseil médical, juridique, personnel, sujets hors plateforme) : décline poliment et propose le formulaire /contact.
Ne demande jamais de données personnelles. N'invente aucun chiffre : si tu ne sais pas, dis-le et oriente vers /contact.
`;

  private static readonly CADRE_BOT_DASHBOARD = `Tu es « Lex », l'assistant intégré de l'espace connecté Les Extras.
Tu aides l'utilisateur à utiliser la plateforme : où trouver quoi, comment faire.
Repères du menu, côté établissement : Tableau de bord ; groupe « Renfort & prestations » → RenforTeam, Mes réservations ateliers, Mes réservations formation, Planning ; groupe « Mon établissement » → Mon équipe, Mon vivier, Former mes équipes, Mes publications, Avis, Devis & factures, LEX · Crédits, Conformité, Points & parrainage. En haut de page : sélecteur de compte, Catalogue, menu « LEX » (assistant d'écriture, générateur d'activités), Recherche, Notifications, Mon profil. Côté intervenant s'ajoutent les opportunités de mission et ses propres ateliers. Raccourci : Ctrl/⌘+K ouvre la recherche. Pour joindre l'équipe : bouton « Contacter le support », en bas du menu de gauche. Il n'y a pas de rubrique « Messagerie » ni « Mon compte » : on dit « Mon profil » et « Mon établissement ».
Règles : réponses courtes (≤ 120 mots), pas-à-pas concrets (« Menu → RenforTeam → Publier »), en français, et TOUJOURS au vouvoiement, jamais de tutoiement, l'interlocuteur est un professionnel.
Ne décris jamais la couleur, la taille ni la position d'un bouton : nomme-le par son libellé exact, entre guillemets.
Jamais de conseil clinique ou juridique individualisé. N'invente rien : si la fonction n'existe pas dans les repères ci-dessus, dis-le et propose le formulaire /contact.
`;

  async chat(mode: 'public' | 'dashboard', message: string,
    historique?: { role: 'user' | 'assistant'; content: string }[]) {
    const { texte: masque, table } = this.pseudo.masquer(message);
    const system = (mode === 'public'
      ? AssistantService.CADRE_BOT_PUBLIC
      : AssistantService.CADRE_BOT_DASHBOARD) + '\n' + AssistantService.FAITS_PLATEFORME;
    const brute = await this.moteur.completer({
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
    const reponseMasquee = await this.moteur.completer({
      system: AssistantService.CADRE_ACTIVITE,
      user: masque,
      maxTokens: 520,
      temperature: 0.5,
    });

    let activite = nettoyerJetonsResiduels(this.pseudo.restaurer(reponseMasquee, table));

    const tronque = activite.length > AssistantService.DEMO_MAX_RENDU;
    if (tronque) {
      const coupe = activite.slice(0, AssistantService.DEMO_MAX_RENDU);
      const fin = Math.max(coupe.lastIndexOf('\n'), coupe.lastIndexOf('. '));
      activite = (fin > 200 ? coupe.slice(0, fin + 1) : coupe).trimEnd();
    }

    return { activite, tronque, protection: this.pseudo.resume(table) };
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
    const brute = await this.moteur.completer({ system, user: masque, maxTokens: 900, temperature: 0.4 });
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
    trame: AssistantTrame; title: string; content: string; trameMaisonId?: string;
  }) {
    // La trame maison n'est rattachée que si elle appartient bien au compte :
    // un identifiant venu du navigateur ne vaut pas autorisation.
    let trameMaisonId: string | null = null;
    if (dto.trameMaisonId) {
      const existe = await this.prisma.trameMaison.findFirst({
        where: { id: dto.trameMaisonId, accountId },
        select: { id: true },
      });
      trameMaisonId = existe?.id ?? null;
    }
    // DE QUI PARLE CE DOCUMENT ? La question se pose ICI, une seule fois, et
    // la réponse se garde en pseudonymes stables. Sans elle, l'écrit suivant
    // sur la même personne repart de zéro : c'est exactement la panne que le
    // registre des pseudonymes annonçait en commentaire depuis le 25/08/2026.
    //
    // ⚠ AUCUN NOM RÉEL N'EST ÉCRIT DANS `sujets`. On masque le contenu validé,
    // on le passe au registre, on ne retient que les codes (« M.D-1 »). Le
    // document, lui, garde ses vrais noms : il vit dans le compte.
    //
    // Un échec ici n'empêche pas d'enregistrer. On perd la continuité pour ce
    // document, on ne perd pas le travail de la personne.
    let sujets: string[] = [];
    try {
      const { texte, table } = this.pseudo.masquer(dto.content);
      const stables = await this.registre.stabiliser(accountId, table);
      sujets = sujetsDuTexte(RegistrePseudoService.reecrire(texte, stables));
    } catch (e) {
      this.logger.error(`[LEX:sujets] ${(e as Error).message}`);
    }

    return this.prisma.assistantDocument.create({
      data: {
        accountId,
        authorId,
        trame: dto.trame,
        title: dto.title,
        content: dto.content,
        trameMaisonId,
        sujets,
      },
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
