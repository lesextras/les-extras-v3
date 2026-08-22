import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  AccountRole,
  AssistantTrame,
  FileKind,
  GlobalRole,
  PorteeTrame,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PseudonymiseurService } from './pseudonymiseur.service';
import { MOTEUR_LEX, MoteurLex } from './moteur-lex';
import { ExtractionService } from './extraction.service';
import { FilesService, type FichierRecu } from '../storage/files.service';

/**
 * LES TRAMES MAISON.
 *
 * Le professionnel dépose un écrit qu'il a déjà rendu — son dernier rapport,
 * le modèle imposé par sa direction — et LEX en apprend la forme : les
 * intitulés, leur ordre, la longueur habituelle de chaque partie, le registre.
 * Il n'apprend PAS le contenu : ce qu'on garde est un squelette, et ce
 * squelette est extrait après pseudonymisation, donc sans un seul nom.
 *
 * Ce choix n'est pas seulement déontologique, il est économique : le squelette
 * fait quelques centaines de mots, il est produit une seule fois à l'import,
 * et c'est lui seul qu'on renvoie au moteur à chaque génération. Apprendre sa
 * trame ne renchérit donc pas l'usage.
 *
 * Le document d'origine, lui, est conservé dans le compte — c'est le choix de
 * la direction. Il porte de vrais noms de personnes accompagnées : il suit
 * exactement les règles du dépôt (aucune URL publique, droits revérifiés à
 * chaque téléchargement) et il est supprimé avec la trame.
 */

/** Consigne d'extraction. Volontairement pauvre en liberté : on veut une FORME. */
const SYSTEM_EXTRACTION = `Tu analyses un écrit professionnel du secteur social ou médico-social français pour en extraire le MODÈLE, c'est-à-dire sa forme — jamais son contenu.

Le texte a été pseudonymisé : il contient des jetons comme [PERSONNE-A] ou [DATE-1]. C'est normal, ignore-les.

Tu réponds UNIQUEMENT par un objet JSON valide, sans texte autour, avec exactement ces trois clés :

{
  "squelette": "La liste ordonnée des sections du document, une par ligne, sous la forme « - Intitulé exact tel qu'il figure dans le modèle — ce que la section contient, en une phrase — longueur observée (nombre de phrases ou de lignes) ». Reprends les intitulés MOT POUR MOT : c'est tout l'intérêt. Si le document n'a pas d'intitulés apparents, décris les blocs dans leur ordre (en-tête, corps, formule, signature).",
  "style": "Les règles de forme observées, en cinq à dix lignes : personne employée (je / nous / le professionnel), temps dominant, façon de désigner la personne accompagnée, formules d'ouverture et de clôture reprises telles quelles, usage des dates, du gras, des puces, niveau de langue, longueur totale approximative.",
  "extrait": "Deux ou trois phrases RECOPIÉES du modèle, choisies parce qu'elles sont représentatives du ton. Ne recopie aucune phrase qui décrirait une situation personnelle : prends une formule d'usage, une phrase d'introduction ou de conclusion."
}

Règles absolues :
- Tu décris une FORME. Tu ne résumes jamais la situation racontée dans le document.
- Tu n'inventes aucune section absente du modèle.
- Aucun nom propre dans ta réponse, même pseudonymisé : si un jeton apparaît dans un extrait, remplace-le par « … ».`;

/** Ce qu'un membre non responsable ne peut pas faire. */
const ROLES_PUBLICATION: AccountRole[] = [
  AccountRole.OWNER,
  AccountRole.ADMIN,
  AccountRole.MANAGER,
];

const SELECT_PUBLIC = {
  id: true,
  nom: true,
  genre: true,
  portee: true,
  squelette: true,
  style: true,
  extrait: true,
  usages: true,
  authorId: true,
  sourceFileId: true,
  createdAt: true,
  updatedAt: true,
  author: { select: { id: true, firstName: true, lastName: true } },
} satisfies Prisma.TrameMaisonSelect;

@Injectable()
export class TramesMaisonService {
  private readonly logger = new Logger(TramesMaisonService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly pseudo: PseudonymiseurService,
    @Inject(MOTEUR_LEX) private readonly moteur: MoteurLex,
    private readonly extraction: ExtractionService,
    private readonly files: FilesService,
  ) {}

  /**
   * Apprend une trame à partir d'un document déposé ou d'un texte collé.
   *
   * L'ordre des opérations est le cœur de la promesse : on lit, on masque, PUIS
   * on appelle le moteur. À aucun moment un nom d'enfant ne sort d'ici.
   */
  async importer(
    accountId: string,
    userId: string,
    role: AccountRole,
    dto: {
      nom: string;
      genre?: AssistantTrame;
      portee?: PorteeTrame;
      texte?: string;
    },
    fichier?: FichierRecu,
  ) {
    if (!fichier && !dto.texte?.trim()) {
      throw new BadRequestException(
        'Déposez un document (Word, PDF) ou collez le texte de votre modèle.',
      );
    }
    const portee = dto.portee ?? PorteeTrame.PERSONNELLE;
    if (portee === PorteeTrame.ETABLISSEMENT && !ROLES_PUBLICATION.includes(role)) {
      throw new ForbiddenException(
        "Publier une trame pour toute l'équipe est réservé à la direction, à l'administration et aux chefs de service. Vous pouvez la créer pour vous seul.",
      );
    }

    const texteBrut = fichier
      ? await this.extraction.extraire(fichier.buffer, fichier.mimetype, fichier.originalname)
      : (dto.texte ?? '').trim();
    if (texteBrut.length < 120) {
      throw new BadRequestException(
        "Ce modèle est trop court pour qu'on en tire quelque chose. Collez un écrit complet — une page suffit.",
      );
    }

    const { texte: masque } = this.pseudo.masquer(texteBrut);
    const reponse = await this.moteur.completer({
      system: SYSTEM_EXTRACTION,
      user: `Modèle d'écrit à analyser :\n\n${masque}`,
      maxTokens: 1200,
    });
    const analyse = this.lireJson(reponse);

    // On dépose le document APRÈS l'analyse : si le moteur échoue, rien ne
    // traîne dans le dépôt.
    let sourceFileId: string | null = null;
    if (fichier) {
      try {
        const depose = await this.files.deposer({
          fichier,
          famille: FileKind.TRAME,
          userId,
          accountId,
        });
        sourceFileId = depose.id;
      } catch (err) {
        // Le dépôt n'est pas configuré, ou le fichier est refusé : la trame
        // reste parfaitement utilisable sans son original.
        this.logger.warn(`Modèle non conservé (${dto.nom}) : ${err}`);
      }
    }

    const creee = await this.prisma.trameMaison.create({
      data: {
        accountId,
        authorId: userId,
        nom: dto.nom.trim().slice(0, 120),
        genre: dto.genre ?? null,
        portee,
        squelette: analyse.squelette,
        style: analyse.style,
        extrait: analyse.extrait || null,
        sourceFileId,
      },
      select: SELECT_PUBLIC,
    });
    return { trame: creee, sourceConservee: Boolean(sourceFileId) };
  }

  /**
   * Les trames utilisables par cette personne : les siennes, plus celles que
   * son établissement a publiées. Un membre ne voit jamais les trames
   * personnelles d'un collègue — un modèle d'écrit dit beaucoup du
   * professionnel qui l'a produit.
   */
  lister(accountId: string, userId: string) {
    return this.prisma.trameMaison.findMany({
      where: {
        accountId,
        OR: [{ authorId: userId }, { portee: PorteeTrame.ETABLISSEMENT }],
      },
      orderBy: [{ portee: 'asc' }, { usages: 'desc' }, { createdAt: 'desc' }],
      select: SELECT_PUBLIC,
    });
  }

  /** Renomme, rattache à un genre, publie ou dépublie. */
  async modifier(
    id: string,
    accountId: string,
    userId: string,
    role: AccountRole,
    dto: { nom?: string; genre?: AssistantTrame | null; portee?: PorteeTrame },
  ) {
    const trame = await this.assertModifiable(id, accountId, userId, role);
    if (dto.portee && dto.portee !== trame.portee && !ROLES_PUBLICATION.includes(role)) {
      throw new ForbiddenException(
        "Publier ou retirer une trame de l'équipe est réservé aux responsables.",
      );
    }
    return this.prisma.trameMaison.update({
      where: { id },
      data: {
        nom: dto.nom?.trim().slice(0, 120),
        genre: dto.genre === undefined ? undefined : dto.genre,
        portee: dto.portee,
      },
      select: SELECT_PUBLIC,
    });
  }

  /**
   * Supprime une trame, et avec elle le modèle d'origine s'il a été conservé.
   * C'est le seul geste destructeur de ce service, et il est explicite : une
   * personne qui retire son écrit doit être sûre qu'il ne reste pas.
   */
  async supprimer(
    id: string,
    accountId: string,
    userId: string,
    role: AccountRole,
    roleGlobal: GlobalRole,
  ) {
    const trame = await this.assertModifiable(id, accountId, userId, role);
    await this.prisma.trameMaison.delete({ where: { id } });
    if (trame.sourceFileId) {
      await this.files
        .supprimer(trame.sourceFileId, userId, roleGlobal)
        .catch((err: unknown) =>
          this.logger.warn(`Modèle d'origine non supprimé (${trame.sourceFileId}) : ${err}`),
        );
    }
    return { supprimee: true };
  }

  /**
   * La trame à appliquer à une génération, ou `null`. Rejoue le contrôle
   * d'accès : une trame personnelle d'un collègue n'est pas utilisable.
   */
  async pourGeneration(id: string | undefined, accountId: string, userId: string) {
    if (!id) return null;
    const trame = await this.prisma.trameMaison.findFirst({
      where: {
        id,
        accountId,
        OR: [{ authorId: userId }, { portee: PorteeTrame.ETABLISSEMENT }],
      },
    });
    if (!trame) throw new NotFoundException('Trame introuvable.');
    return trame;
  }

  /** Compteur d'usage — jamais bloquant. */
  async compterUsage(id: string) {
    await this.prisma.trameMaison
      .update({ where: { id }, data: { usages: { increment: 1 } } })
      .catch(() => undefined);
  }

  // ── Interne ──────────────────────────────────────────────────────────────

  private async assertModifiable(
    id: string,
    accountId: string,
    userId: string,
    role: AccountRole,
  ) {
    const trame = await this.prisma.trameMaison.findFirst({ where: { id, accountId } });
    if (!trame) throw new NotFoundException('Trame introuvable.');
    // L'auteur dispose de sa trame ; un responsable dispose de celles qui
    // engagent l'établissement.
    const estAuteur = trame.authorId === userId;
    const estResponsable = ROLES_PUBLICATION.includes(role);
    if (!estAuteur && !(estResponsable && trame.portee === PorteeTrame.ETABLISSEMENT)) {
      throw new ForbiddenException('Cette trame ne vous appartient pas.');
    }
    return trame;
  }

  /**
   * Lit la réponse du moteur. Un modèle rend parfois son JSON entouré de
   * texte ou d'une clôture markdown : on récupère l'objet plutôt que d'échouer
   * sur une accolade, mais on refuse net si la forme attendue manque.
   */
  private lireJson(reponse: string): { squelette: string; style: string; extrait: string } {
    const debut = reponse.indexOf('{');
    const fin = reponse.lastIndexOf('}');
    if (debut >= 0 && fin > debut) {
      try {
        const objet = JSON.parse(reponse.slice(debut, fin + 1));
        if (typeof objet?.squelette === 'string' && objet.squelette.trim()) {
          return {
            squelette: String(objet.squelette).slice(0, 4000),
            style: String(objet.style ?? '').slice(0, 2000),
            extrait: String(objet.extrait ?? '').slice(0, 1000),
          };
        }
      } catch {
        // On tombe dans l'erreur explicite ci-dessous.
      }
    }
    throw new BadRequestException(
      "La structure de ce modèle n'a pas pu être identifiée. Réessayez, ou collez directement la partie du document qui porte les intitulés de sections.",
    );
  }
}
