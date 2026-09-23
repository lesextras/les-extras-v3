import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Prisma, StatutInscriptionCours, StatutRendu, TypeLecon } from '@prisma/client';
import type { Readable } from 'node:stream';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from '../../storage/storage.service';
import { MailService } from '../../common/mail/mail.service';
import { EcoleService } from '../ecole.service';
import { EmailsEcoleService } from './emails-ecole.service';
import type { CorrigerRenduDto } from './suite.dto';

/** Ce qu'on garde d'un fichier rendu. Le contenu vit dans le dépôt objet. */
export interface FichierRendu {
  cle: string;
  nom: string;
  taille: number;
  type: string;
}

export interface FichierRecuDevoir {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

/** Cinq fichiers de 20 Mo : de quoi rendre un dossier, pas un disque dur. */
export const FICHIERS_MAX = 5;
export const TAILLE_MAX_RENDU = 20 * 1024 * 1024;

const TYPES_ACCEPTES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'text/plain',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.oasis.opendocument.text',
  'application/vnd.oasis.opendocument.spreadsheet',
  'application/zip',
  'audio/mpeg',
  'video/mp4',
];

/**
 * LES DEVOIRS : LE DÉPÔT DE L'APPRENANT, LA CORRECTION DU FORMATEUR.
 *
 * Comme sur Teachizy : l'apprenant dépose un texte et des fichiers, l'académie
 * voit « À corriger », rend une note et un commentaire, et valide ou demande
 * de reprendre. Un devoir validé coche la leçon : la progression et le
 * certificat suivent sans qu'on ait à y penser.
 *
 * ⚠ L'APPRENANT NE COCHE PAS LUI-MÊME UNE LEÇON-DEVOIR. C'est la correction
 * qui la valide ; sinon « J'ai terminé » suffirait à passer un devoir qui n'a
 * jamais été rendu.
 */
@Injectable()
export class DevoirsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stockage: StorageService,
    private readonly mail: MailService,
    private readonly ecole: EcoleService,
    private readonly emails: EmailsEcoleService,
  ) {}

  /* ═══════════════════════════════════════════════════ côté apprenant ══ */

  async monRendu(jeton: string, leconId: string) {
    const { inscription } = await this.leconDevoir(jeton, leconId);
    const r = await this.prisma.renduDevoir.findUnique({
      where: { inscriptionId_leconId: { inscriptionId: inscription.id, leconId } },
    });
    return r ? this.affichage(r) : null;
  }

  async rendre(jeton: string, leconId: string, texte: string | undefined, fichiers: FichierRecuDevoir[]) {
    const { inscription, lecon, cours } = await this.leconDevoir(jeton, leconId);
    const precedent = await this.prisma.renduDevoir.findUnique({
      where: { inscriptionId_leconId: { inscriptionId: inscription.id, leconId } },
    });
    if (precedent?.statut === StatutRendu.VALIDE) {
      throw new ForbiddenException('Ce devoir est déjà validé : il n’y a plus rien à déposer.');
    }
    const propre = (texte ?? '').trim();
    if (!propre && !fichiers.length) {
      throw new BadRequestException('Écrivez votre réponse ou joignez au moins un fichier.');
    }
    if (fichiers.length > FICHIERS_MAX) throw new BadRequestException(`${FICHIERS_MAX} fichiers au plus.`);
    for (const f of fichiers) {
      if (f.size > TAILLE_MAX_RENDU) throw new BadRequestException(`« ${f.originalname} » dépasse 20 Mo.`);
      if (!TYPES_ACCEPTES.includes(f.mimetype)) {
        throw new BadRequestException(`« ${f.originalname} » : ce type de fichier n’est pas accepté.`);
      }
    }

    // Un nouveau dépôt remplace l'ancien : on garde les fichiers seulement
    // s'il n'en arrive pas de nouveaux (un texte corrigé n'efface pas la pièce).
    let pieces: FichierRendu[] = Array.isArray(precedent?.fichiers) ? (precedent!.fichiers as unknown as FichierRendu[]) : [];
    if (fichiers.length) {
      const nouveaux: FichierRendu[] = [];
      for (const f of fichiers) {
        const cle = `devoirs/${cours.accountId}/${inscription.id}/${leconId}/${randomUUID()}${extension(f.originalname)}`;
        await this.stockage.deposer(cle, f.buffer, f.mimetype);
        nouveaux.push({ cle, nom: f.originalname.slice(0, 200), taille: f.size, type: f.mimetype });
      }
      for (const ancien of pieces) void this.stockage.supprimer(ancien.cle);
      pieces = nouveaux;
    }

    const r = await this.prisma.renduDevoir.upsert({
      where: { inscriptionId_leconId: { inscriptionId: inscription.id, leconId } },
      create: {
        inscriptionId: inscription.id,
        leconId,
        coursId: cours.id,
        accountId: cours.accountId,
        texte: propre || null,
        fichiers: pieces as unknown as Prisma.InputJsonValue,
      },
      update: {
        texte: propre || null,
        fichiers: pieces as unknown as Prisma.InputJsonValue,
        statut: StatutRendu.A_CORRIGER,
        tentative: { increment: 1 },
        corrigeLe: null,
      },
    });
    void lecon;
    return this.affichage(r);
  }

  /** Télécharger un de ses propres fichiers. */
  async fichierApprenant(jeton: string, leconId: string, n: number) {
    const { inscription } = await this.leconDevoir(jeton, leconId);
    const r = await this.prisma.renduDevoir.findUnique({
      where: { inscriptionId_leconId: { inscriptionId: inscription.id, leconId } },
    });
    return this.fichier(r?.fichiers, n);
  }

  /* ═══════════════════════════════════════════════════ côté académie ══ */

  async lister(accountId: string, filtre: { statut?: StatutRendu; coursId?: string }) {
    const rendus = await this.prisma.renduDevoir.findMany({
      where: {
        accountId,
        ...(filtre.statut ? { statut: filtre.statut } : {}),
        ...(filtre.coursId ? { coursId: filtre.coursId } : {}),
      },
      include: {
        inscription: { select: { email: true, prenom: true, nom: true, cours: { select: { id: true, titre: true } } } },
        lecon: { select: { id: true, titre: true } },
      },
      orderBy: [{ statut: 'asc' }, { updatedAt: 'desc' }],
      take: 500,
    });
    const compte = await this.prisma.renduDevoir.groupBy({
      by: ['statut'],
      where: { accountId, ...(filtre.coursId ? { coursId: filtre.coursId } : {}) },
      _count: { _all: true },
    });
    return {
      compteurs: {
        aCorriger: compte.find((c) => c.statut === 'A_CORRIGER')?._count._all ?? 0,
        valides: compte.find((c) => c.statut === 'VALIDE')?._count._all ?? 0,
        aReprendre: compte.find((c) => c.statut === 'A_REPRENDRE')?._count._all ?? 0,
      },
      rendus: rendus.map((r) => ({
        ...this.affichage(r),
        apprenant: {
          email: r.inscription.email,
          nom: [r.inscription.prenom, r.inscription.nom].filter(Boolean).join(' ') || null,
        },
        cours: r.inscription.cours,
        lecon: r.lecon,
      })),
    };
  }

  async corriger(accountId: string, id: string, dto: CorrigerRenduDto) {
    const r = await this.prisma.renduDevoir.findFirst({
      where: { id, accountId },
      include: { inscription: { include: { cours: { select: { titre: true } } } }, lecon: { select: { titre: true } } },
    });
    if (!r) throw new NotFoundException("Ce devoir n'existe pas.");
    const maj = await this.prisma.renduDevoir.update({
      where: { id },
      data: {
        statut: dto.statut,
        note: dto.note === undefined ? r.note : dto.note,
        commentaire: dto.commentaire !== undefined ? dto.commentaire.trim() || null : r.commentaire,
        corrigeLe: dto.statut === StatutRendu.A_CORRIGER ? null : new Date(),
      },
    });

    // Validé : la leçon est cochée, la progression suit.
    if (dto.statut === StatutRendu.VALIDE) {
      try {
        await this.ecole.avancer(r.inscription.jeton, r.leconId, { faite: true });
      } catch {
        // Lecture ordonnée ou leçon pas encore ouverte : la correction reste
        // enregistrée, la leçon se cochera quand l'ordre le permettra.
      }
    }

    // L'apprenant est prévenu dès qu'une correction arrive.
    if (dto.statut !== StatutRendu.A_CORRIGER) {
      const ecole = await this.prisma.ecoleEnLigne.findUnique({ where: { accountId }, select: { nom: true, couleur: true } });
      const racine = await this.emails.racine(accountId);
      const valide = dto.statut === StatutRendu.VALIDE;
      await this.mail.sendEcoleLibre({
        to: r.inscription.email,
        ecole: { nom: ecole?.nom ?? 'Votre organisme de formation', couleur: ecole?.couleur ?? null },
        sujet: valide ? `Devoir validé : « ${r.lecon.titre} »` : `Devoir à reprendre : « ${r.lecon.titre} »`,
        titre: valide ? 'Votre devoir est validé' : 'Votre devoir est à reprendre',
        texte: `Bonjour${r.inscription.prenom ? ` ${r.inscription.prenom}` : ''},\n\nVotre devoir « ${r.lecon.titre} » de la formation « ${r.inscription.cours.titre} » a été ${
          valide ? 'validé' : 'relu : il est à reprendre'
        }.${maj.note !== null ? `\n\nNote : ${maj.note} / 100.` : ''}${maj.commentaire ? `\n\nLe mot du formateur :\n${maj.commentaire}` : ''}`,
        bouton: { label: 'Ouvrir ma formation', url: `${racine}/apprendre/${r.inscription.jeton}` },
      }).catch(() => undefined);
    }
    return this.affichage(maj);
  }

  async fichierAcademie(accountId: string, id: string, n: number) {
    const r = await this.prisma.renduDevoir.findFirst({ where: { id, accountId } });
    if (!r) throw new NotFoundException("Ce devoir n'existe pas.");
    return this.fichier(r.fichiers, n);
  }

  /* ═════════════════════════════════════════════════════ les outils ══ */

  private async fichier(liste: Prisma.JsonValue | undefined, n: number): Promise<{ flux: Readable; nom: string; type: string }> {
    const pieces = Array.isArray(liste) ? (liste as unknown as FichierRendu[]) : [];
    const p = pieces[n];
    if (!p) throw new NotFoundException('Ce fichier n’existe pas.');
    return { flux: await this.stockage.lire(p.cle), nom: p.nom, type: p.type };
  }

  private async leconDevoir(jeton: string, leconId: string) {
    const inscription = await this.prisma.inscriptionCours.findUnique({ where: { jeton }, include: { cours: true } });
    if (!inscription) throw new NotFoundException("Ce lien n'ouvre aucun cours.");
    if (inscription.statut === StatutInscriptionCours.SUSPENDUE) throw new ForbiddenException('Cet accès est suspendu.');
    const lecon = await this.prisma.leconCours.findFirst({
      where: { id: leconId, OR: [{ chapitre: { coursId: inscription.coursId } }, { coursId: inscription.coursId }] },
    });
    if (!lecon) throw new NotFoundException("Cette leçon n'appartient pas à ce cours.");
    if (lecon.type !== TypeLecon.DEVOIR) throw new BadRequestException("Cette leçon n'est pas un devoir.");
    return { inscription, lecon, cours: inscription.cours };
  }

  private affichage(r: {
    id: string;
    texte: string | null;
    fichiers: Prisma.JsonValue | null;
    statut: StatutRendu;
    note: number | null;
    commentaire: string | null;
    corrigeLe: Date | null;
    tentative: number;
    createdAt: Date;
    updatedAt: Date;
  }) {
    const pieces = Array.isArray(r.fichiers) ? (r.fichiers as unknown as FichierRendu[]) : [];
    return {
      id: r.id,
      texte: r.texte,
      fichiers: pieces.map((p, n) => ({ n, nom: p.nom, taille: p.taille, type: p.type })),
      statut: r.statut,
      note: r.note,
      commentaire: r.commentaire,
      corrigeLe: r.corrigeLe,
      tentative: r.tentative,
      renduLe: r.updatedAt,
      premierDepot: r.createdAt,
    };
  }
}

function extension(nom: string): string {
  const i = nom.lastIndexOf('.');
  if (i < 0) return '';
  const e = nom.slice(i + 1).toLowerCase().replace(/[^a-z0-9]/g, '');
  return e ? `.${e.slice(0, 8)}` : '';
}
