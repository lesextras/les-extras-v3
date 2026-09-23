import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { StatutInscriptionCours } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ApprenantService } from './apprenant.service';
import type {
  CollectionDto,
  CommentaireCommunauteDto,
  EspaceCommunauteDto,
  ModererCommentaireDto,
  ModererPublicationDto,
  PublicationDto,
} from './suite.dto';

/**
 * LA COMMUNAUTÉ DE L'ÉCOLE.
 *
 * Même organisation que chez Teachizy : des ESPACES (un fil de publications
 * chacun), rangés dans des COLLECTIONS, ouverts à tous les apprenants ou à
 * ceux de certaines formations. L'académie publie, épingle, masque ; les
 * apprenants publient (si l'espace le permet), commentent et aiment.
 *
 * ⚠ MASQUER N'EFFACE PAS. Une publication masquée disparaît pour les
 * apprenants et reste visible, grisée, pour l'académie : une modération doit
 * pouvoir se défaire, et une trace de ce qui a été retiré protège aussi celui
 * qui modère.
 */
@Injectable()
export class CommunauteService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly apprenants: ApprenantService,
  ) {}

  /* ═══════════════════════════════════════════════════ côté académie ══ */

  async vueAcademie(accountId: string) {
    const [reglages, collections, espaces] = await Promise.all([
      this.prisma.reglagesEcole.findUnique({ where: { accountId } }),
      this.prisma.collectionCommunaute.findMany({ where: { accountId }, orderBy: [{ ordre: 'asc' }, { createdAt: 'asc' }] }),
      this.prisma.espaceCommunaute.findMany({
        where: { accountId },
        orderBy: [{ ordre: 'asc' }, { createdAt: 'asc' }],
        include: { _count: { select: { publications: true } } },
      }),
    ]);
    const membres = await this.prisma.compteApprenant.count({ where: { accountId } });
    return {
      active: Boolean(reglages?.communauteActive),
      description: reglages?.communauteDescription ?? null,
      membres,
      collections,
      espaces: espaces.map((e) => ({ ...e, publications: e._count.publications, _count: undefined })),
    };
  }

  async creerCollection(accountId: string, dto: CollectionDto) {
    return this.prisma.collectionCommunaute.create({ data: { accountId, titre: dto.titre.trim(), ordre: dto.ordre ?? 0 } });
  }

  async modifierCollection(accountId: string, id: string, dto: CollectionDto) {
    await this.maCollection(accountId, id);
    return this.prisma.collectionCommunaute.update({ where: { id }, data: { titre: dto.titre.trim(), ...(dto.ordre !== undefined ? { ordre: dto.ordre } : {}) } });
  }

  async supprimerCollection(accountId: string, id: string) {
    await this.maCollection(accountId, id);
    // Les espaces de la collection restent : ils passent « hors collection ».
    await this.prisma.collectionCommunaute.delete({ where: { id } });
    return { supprime: true };
  }

  async creerEspace(accountId: string, dto: EspaceCommunauteDto) {
    if (!dto.titre?.trim()) throw new ForbiddenException("Donne un nom à l'espace.");
    if (dto.collectionId) await this.maCollection(accountId, dto.collectionId);
    return this.prisma.espaceCommunaute.create({
      data: {
        accountId,
        titre: dto.titre.trim(),
        description: dto.description?.trim() || null,
        icone: dto.icone?.trim() || null,
        collectionId: dto.collectionId ?? null,
        coursIds: dto.coursIds ?? [],
        ecritureApprenants: dto.ecritureApprenants ?? true,
        ordre: dto.ordre ?? 0,
      },
    });
  }

  async modifierEspace(accountId: string, id: string, dto: EspaceCommunauteDto) {
    await this.monEspace(accountId, id);
    if (dto.collectionId) await this.maCollection(accountId, dto.collectionId);
    return this.prisma.espaceCommunaute.update({
      where: { id },
      data: {
        ...(dto.titre !== undefined ? { titre: dto.titre.trim() } : {}),
        ...(dto.description !== undefined ? { description: dto.description.trim() || null } : {}),
        ...(dto.icone !== undefined ? { icone: dto.icone.trim() || null } : {}),
        ...(dto.collectionId !== undefined ? { collectionId: dto.collectionId } : {}),
        ...(dto.coursIds !== undefined ? { coursIds: dto.coursIds } : {}),
        ...(dto.ecritureApprenants !== undefined ? { ecritureApprenants: dto.ecritureApprenants } : {}),
        ...(dto.ordre !== undefined ? { ordre: dto.ordre } : {}),
      },
    });
  }

  async supprimerEspace(accountId: string, id: string) {
    await this.monEspace(accountId, id);
    await this.prisma.espaceCommunaute.delete({ where: { id } });
    return { supprime: true };
  }

  async filAcademie(accountId: string, espaceId: string) {
    const espace = await this.monEspace(accountId, espaceId);
    const publications = await this.prisma.publicationCommunaute.findMany({
      where: { espaceId },
      orderBy: [{ epinglee: 'desc' }, { createdAt: 'desc' }],
      include: { commentaires: { orderBy: { createdAt: 'asc' } } },
      take: 200,
    });
    return { espace, publications: publications.map((p) => this.rendre(p, 'academie', true)) };
  }

  async publierAcademie(accountId: string, espaceId: string, dto: PublicationDto, auteur: string) {
    await this.monEspace(accountId, espaceId);
    const p = await this.prisma.publicationCommunaute.create({
      data: {
        espaceId,
        accountId,
        parAcademie: true,
        auteurNom: auteur,
        titre: dto.titre?.trim() || null,
        texte: dto.texte.trim(),
        epinglee: dto.epinglee ?? false,
      },
      include: { commentaires: true },
    });
    return this.rendre(p, 'academie', true);
  }

  async modererPublication(accountId: string, id: string, dto: ModererPublicationDto) {
    const p = await this.prisma.publicationCommunaute.findFirst({ where: { id, accountId } });
    if (!p) throw new NotFoundException("Cette publication n'existe pas.");
    await this.prisma.publicationCommunaute.update({
      where: { id },
      data: {
        ...(dto.epinglee !== undefined ? { epinglee: dto.epinglee } : {}),
        ...(dto.masquee !== undefined ? { masquee: dto.masquee } : {}),
      },
    });
    return { enregistre: true };
  }

  async supprimerPublication(accountId: string, id: string) {
    const p = await this.prisma.publicationCommunaute.findFirst({ where: { id, accountId } });
    if (!p) throw new NotFoundException("Cette publication n'existe pas.");
    await this.prisma.publicationCommunaute.delete({ where: { id } });
    return { supprime: true };
  }

  async commenterAcademie(accountId: string, publicationId: string, dto: CommentaireCommunauteDto, auteur: string) {
    const p = await this.prisma.publicationCommunaute.findFirst({ where: { id: publicationId, accountId } });
    if (!p) throw new NotFoundException("Cette publication n'existe pas.");
    const c = await this.prisma.commentaireCommunaute.create({
      data: { publicationId, parAcademie: true, auteurNom: auteur, texte: dto.texte.trim() },
    });
    return { id: c.id, auteur: c.auteurNom, parAcademie: true, texte: c.texte, masque: false, publieLe: c.createdAt };
  }

  async modererCommentaire(accountId: string, id: string, dto: ModererCommentaireDto) {
    const c = await this.prisma.commentaireCommunaute.findFirst({ where: { id, publication: { accountId } } });
    if (!c) throw new NotFoundException("Ce commentaire n'existe pas.");
    await this.prisma.commentaireCommunaute.update({ where: { id }, data: { masque: dto.masque } });
    return { enregistre: true };
  }

  /* ═══════════════════════════════════════════════════ côté apprenant ══ */

  async accueilApprenant(jeton: string | undefined) {
    const { compte, coursIds } = await this.membre(jeton);
    const [reglages, collections, espaces] = await Promise.all([
      this.prisma.reglagesEcole.findUnique({ where: { accountId: compte.accountId } }),
      this.prisma.collectionCommunaute.findMany({ where: { accountId: compte.accountId }, orderBy: [{ ordre: 'asc' }, { createdAt: 'asc' }] }),
      this.prisma.espaceCommunaute.findMany({
        where: { accountId: compte.accountId, OR: [{ coursIds: { isEmpty: true } }, { coursIds: { hasSome: coursIds } }] },
        orderBy: [{ ordre: 'asc' }, { createdAt: 'asc' }],
        include: { _count: { select: { publications: { where: { masquee: false } } } } },
      }),
    ]);
    return {
      description: reglages?.communauteDescription ?? null,
      collections,
      espaces: espaces.map((e) => ({
        id: e.id,
        titre: e.titre,
        description: e.description,
        icone: e.icone,
        collectionId: e.collectionId,
        ecritureApprenants: e.ecritureApprenants,
        publications: e._count.publications,
      })),
    };
  }

  async filApprenant(jeton: string | undefined, espaceId: string) {
    const { compte, espace } = await this.espaceOuvert(jeton, espaceId);
    const publications = await this.prisma.publicationCommunaute.findMany({
      where: { espaceId, masquee: false },
      orderBy: [{ epinglee: 'desc' }, { createdAt: 'desc' }],
      include: { commentaires: { where: { masque: false }, orderBy: { createdAt: 'asc' } } },
      take: 200,
    });
    return {
      espace: { id: espace.id, titre: espace.titre, description: espace.description, icone: espace.icone, ecritureApprenants: espace.ecritureApprenants },
      publications: publications.map((p) => this.rendre(p, compte.id, false)),
    };
  }

  async publierApprenant(jeton: string | undefined, espaceId: string, dto: PublicationDto) {
    const { compte, espace } = await this.espaceOuvert(jeton, espaceId);
    if (!espace.ecritureApprenants) throw new ForbiddenException("Dans cet espace, seule l'école publie. Vous pouvez commenter.");
    const p = await this.prisma.publicationCommunaute.create({
      data: {
        espaceId,
        accountId: compte.accountId,
        compteApprenantId: compte.id,
        auteurNom: nomAffiche(compte),
        titre: dto.titre?.trim() || null,
        texte: dto.texte.trim(),
      },
      include: { commentaires: true },
    });
    return this.rendre(p, compte.id, false);
  }

  async commenterApprenant(jeton: string | undefined, publicationId: string, dto: CommentaireCommunauteDto) {
    const p = await this.prisma.publicationCommunaute.findUnique({ where: { id: publicationId } });
    if (!p || p.masquee) throw new NotFoundException("Cette publication n'existe pas.");
    const { compte } = await this.espaceOuvert(jeton, p.espaceId);
    const c = await this.prisma.commentaireCommunaute.create({
      data: { publicationId, compteApprenantId: compte.id, auteurNom: nomAffiche(compte), texte: dto.texte.trim() },
    });
    return { id: c.id, auteur: c.auteurNom, parAcademie: false, texte: c.texte, publieLe: c.createdAt };
  }

  async aimer(jeton: string | undefined, publicationId: string) {
    const p = await this.prisma.publicationCommunaute.findUnique({ where: { id: publicationId } });
    if (!p || p.masquee) throw new NotFoundException("Cette publication n'existe pas.");
    const { compte } = await this.espaceOuvert(jeton, p.espaceId);
    const deja = p.jaime.includes(compte.id);
    const maj = await this.prisma.publicationCommunaute.update({
      where: { id: publicationId },
      data: { jaime: deja ? p.jaime.filter((x) => x !== compte.id) : [...p.jaime, compte.id] },
    });
    return { jaime: !deja, total: maj.jaime.length };
  }

  /** L'auteur retire sa propre publication (c'est la sienne, pas une modération). */
  async retirerMaPublication(jeton: string | undefined, publicationId: string) {
    const compte = await this.apprenants.compteDeSession(jeton);
    const p = await this.prisma.publicationCommunaute.findFirst({ where: { id: publicationId, compteApprenantId: compte.id } });
    if (!p) throw new NotFoundException("Cette publication n'est pas la vôtre.");
    await this.prisma.publicationCommunaute.delete({ where: { id: publicationId } });
    return { supprime: true };
  }

  /* ═════════════════════════════════════════════════════ les outils ══ */

  private async membre(jeton: string | undefined) {
    const compte = await this.apprenants.compteDeSession(jeton);
    const reglages = await this.prisma.reglagesEcole.findUnique({ where: { accountId: compte.accountId } });
    if (!reglages?.communauteActive) throw new ForbiddenException("La communauté de cette école n'est pas ouverte.");
    const inscriptions = await this.prisma.inscriptionCours.findMany({
      where: { email: compte.email, cours: { accountId: compte.accountId }, statut: { not: StatutInscriptionCours.SUSPENDUE } },
      select: { coursId: true },
    });
    if (!inscriptions.length) throw new ForbiddenException('La communauté est réservée aux apprenants de l’école.');
    return { compte, coursIds: inscriptions.map((i) => i.coursId) };
  }

  private async espaceOuvert(jeton: string | undefined, espaceId: string) {
    const { compte, coursIds } = await this.membre(jeton);
    const espace = await this.prisma.espaceCommunaute.findFirst({ where: { id: espaceId, accountId: compte.accountId } });
    if (!espace) throw new NotFoundException("Cet espace n'existe pas.");
    if (espace.coursIds.length && !espace.coursIds.some((c) => coursIds.includes(c))) {
      throw new ForbiddenException('Cet espace est réservé aux apprenants d’autres formations.');
    }
    return { compte, espace };
  }

  private async maCollection(accountId: string, id: string) {
    const c = await this.prisma.collectionCommunaute.findFirst({ where: { id, accountId } });
    if (!c) throw new NotFoundException("Cette collection n'existe pas.");
    return c;
  }

  private async monEspace(accountId: string, id: string) {
    const e = await this.prisma.espaceCommunaute.findFirst({ where: { id, accountId } });
    if (!e) throw new NotFoundException("Cet espace n'existe pas.");
    return e;
  }

  private rendre(
    p: {
      id: string;
      titre: string | null;
      texte: string;
      auteurNom: string;
      parAcademie: boolean;
      compteApprenantId: string | null;
      epinglee: boolean;
      masquee: boolean;
      jaime: string[];
      createdAt: Date;
      commentaires: { id: string; auteurNom: string; parAcademie: boolean; compteApprenantId: string | null; texte: string; masque: boolean; createdAt: Date }[];
    },
    moi: string,
    academie: boolean,
  ) {
    return {
      id: p.id,
      titre: p.titre,
      texte: p.texte,
      auteur: p.auteurNom,
      parAcademie: p.parAcademie,
      estMoi: !academie && p.compteApprenantId === moi,
      epinglee: p.epinglee,
      ...(academie ? { masquee: p.masquee } : {}),
      jaime: p.jaime.length,
      jAime: p.jaime.includes(moi),
      publieLe: p.createdAt,
      commentaires: p.commentaires.map((c) => ({
        id: c.id,
        auteur: c.auteurNom,
        parAcademie: c.parAcademie,
        texte: c.texte,
        ...(academie ? { masque: c.masque } : {}),
        publieLe: c.createdAt,
      })),
    };
  }
}

function nomAffiche(c: { prenom: string | null; nom: string | null; email: string }) {
  const nom = [c.prenom, c.nom ? `${c.nom.trim()[0]?.toUpperCase() ?? ''}.` : null].filter(Boolean).join(' ').trim();
  return nom || 'Un apprenant';
}
