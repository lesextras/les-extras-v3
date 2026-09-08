import { BadRequestException, ForbiddenException, Injectable, NotFoundException, type OnModuleInit } from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { FormationType, Prisma, StatutCours, StatutInscriptionCours, StatutVente, TypeRemise } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { corrigerQuiz, nettoyerQuiz, quizSansReponses, quizUtilisable, type Quiz } from './quiz';
import type {
  AffilieDto,
  AvancerDto,
  ChapitreDto,
  ClasseDto,
  CodePromoDto,
  CommentaireDto,
  CreerCoursDto,
  EcrireCommentaireDto,
  DeplacerLeconDto,
  EcoleDto,
  InscrireDto,
  LeconDto,
  ModifierCoursDto,
  PackDto,
  RejoindreDto,
  ReordonnerDto,
  VenteDto,
} from './dto/ecole.dto';

/**
 * L'ÉCOLE EN LIGNE.
 *
 * Un cours porte des chapitres, un chapitre porte des leçons. On écrit, on
 * publie, on partage une adresse. Une personne s'inscrit avec son adresse
 * e-mail, reçoit un lien personnel, avance leçon par leçon, passe les quiz, et
 * reçoit son attestation quand tout est fait.
 *
 * Tout appartient au COMPTE. Chaque lecture et chaque écriture passe par
 * `accountId` : jamais par le seul identifiant, qui circule dans les adresses.
 * Les bonnes réponses d'un quiz ne quittent jamais le serveur.
 */
@Injectable()
export class EcoleService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * AU DÉMARRAGE : CHAQUE FICHE PROGRAMME D'UNE ACADÉMIE A SA FORMATION.
   *
   * Avant, l'organisme écrivait ses fiches programme (Formation) d'un côté et
   * ses formations suivies (Cours) de l'autre, sans lien. Les fiches déjà
   * écrites sont rattachées à la formation du même titre quand elle existe ;
   * sinon on lui ouvre une formation en brouillon qui la porte. Idempotent :
   * une fiche déjà rattachée n'est plus touchée.
   */
  async onModuleInit() {
    try {
      await this.rattacherProgrammes();
    } catch {
      // Ne jamais empêcher l'API de démarrer pour un rattachement.
    }
  }

  private async rattacherProgrammes() {
    const orphelines = await this.prisma.formation.findMany({
      where: { cours: { is: null }, ownerAccount: { type: 'ACADEMIE' } },
      select: { id: true, title: true, summary: true, ownerAccountId: true },
      take: 500,
    });
    for (const f of orphelines) {
      const existant = await this.prisma.cours.findFirst({
        where: { accountId: f.ownerAccountId, formationId: null, titre: { equals: f.title.trim(), mode: 'insensitive' } },
        orderBy: { createdAt: 'asc' },
      });
      if (existant) {
        await this.prisma.cours.update({ where: { id: existant.id }, data: { formationId: f.id } });
        continue;
      }
      const titre = f.title.trim();
      await this.prisma.cours.create({
        data: {
          accountId: f.ownerAccountId,
          titre,
          sousTitre: f.summary?.trim() || null,
          slug: await this.slugLibre('cours', titre),
          formationId: f.id,
          chapitres: {
            create: [{ titre: 'Pour commencer', ordre: 0, lecons: { create: [{ titre: 'Bienvenue', ordre: 0, apercu: true }] } }],
          },
        },
      });
    }
  }

  /**
   * ÉCRIRE LA FICHE PROGRAMME D'UNE FORMATION QUI N'EN A PAS.
   *
   * On part de ce qu'on sait déjà — le titre, le sous-titre, les objectifs,
   * les prérequis, le public, la durée — pour que la fiche ne naisse pas vide.
   * Elle reste à compléter dans l'onglet « Descriptions » de la formation.
   */
  async creerProgramme(accountId: string, coursId: string) {
    const c = await this.prisma.cours.findFirst({ where: { id: coursId, accountId } });
    if (!c) throw new NotFoundException("Ce cours n'existe pas.");
    if (c.formationId) {
      const deja = await this.prisma.formation.findUnique({ where: { id: c.formationId } });
      if (deja) return deja;
    }
    const titre = c.titre.trim();
    const heures = c.dureeMinutes > 0 ? Math.max(1, Math.ceil(c.dureeMinutes / 60)) : undefined;
    const programme = await this.prisma.formation.create({
      data: {
        ownerAccountId: accountId,
        type: FormationType.CERTIFIANTE,
        title: titre,
        slug: await this.slugLibre('formation', titre),
        summary: c.sousTitre?.trim() || undefined,
        objectives: c.objectifs.length ? c.objectifs.join('\n') : undefined,
        prerequisites: c.prerequis?.trim() || undefined,
        targetAudience: c.pourQui?.trim().slice(0, 200) || undefined,
        durationHours: heures,
        city: c.lieu?.trim() || undefined,
        freeOnline: c.modalite === 'EN_LIGNE' && (c.gratuit || c.prixCents === 0),
      },
    });
    await this.prisma.cours.update({ where: { id: coursId }, data: { formationId: programme.id } });
    return programme;
  }

  /* ====================================================== LE CATALOGUE ==== */

  async listerCours(accountId: string) {
    const cours = await this.prisma.cours.findMany({
      where: { accountId },
      orderBy: [{ ordre: 'asc' }, { createdAt: 'desc' }],
      include: {
        _count: { select: { inscriptions: true } },
        chapitres: { select: { _count: { select: { lecons: true } } } },
        programme: { select: { id: true, status: true, _count: { select: { sessions: true } } } },
      },
    });

    return cours.map((c) => ({
      id: c.id,
      titre: c.titre,
      slug: c.slug,
      sousTitre: c.sousTitre,
      imageUrl: c.imageUrl,
      statut: c.statut,
      modalite: c.modalite,
      formationId: c.programme?.id ?? null,
      programmeStatut: c.programme?.status ?? null,
      nbSessions: c.programme?._count.sessions ?? 0,
      gratuit: c.gratuit,
      prixCents: c.prixCents,
      nbChapitres: c.chapitres.length,
      nbLecons: c.chapitres.reduce((n, ch) => n + ch._count.lecons, 0),
      nbApprenants: c._count.inscriptions,
      dureeMinutes: c.dureeMinutes,
      modifieLe: c.updatedAt,
    }));
  }

  async lireCours(accountId: string, id: string) {
    const c = await this.prisma.cours.findFirst({
      where: { id, accountId },
      include: {
        chapitres: {
          orderBy: { ordre: 'asc' },
          include: { lecons: { orderBy: { ordre: 'asc' } } },
        },
      },
    });
    if (!c) throw new NotFoundException("Ce cours n'existe pas.");
    return this.rendreCours(c);
  }

  async creerCours(accountId: string, dto: CreerCoursDto) {
    const titre = (dto.titre ?? '').trim();
    const cours = await this.prisma.cours.create({
      data: {
        accountId,
        titre,
        sousTitre: dto.sousTitre?.trim() || null,
        slug: await this.slugLibre('cours', titre),
        chapitres: {
          create: [
            {
              titre: 'Pour commencer',
              ordre: 0,
              lecons: { create: [{ titre: 'Bienvenue', ordre: 0, apercu: true }] },
            },
          ],
        },
      },
      include: { chapitres: { orderBy: { ordre: 'asc' }, include: { lecons: { orderBy: { ordre: 'asc' } } } } },
    });
    return this.rendreCours(cours);
  }

  async modifierCours(accountId: string, id: string, dto: ModifierCoursDto) {
    const actuel = await this.prisma.cours.findFirst({ where: { id, accountId } });
    if (!actuel) throw new NotFoundException("Ce cours n'existe pas.");

    const data: Prisma.CoursUpdateInput = {};
    if (dto.titre !== undefined) data.titre = dto.titre.trim();
    if (dto.sousTitre !== undefined) data.sousTitre = dto.sousTitre.trim() || null;
    if (dto.description !== undefined) data.description = dto.description.trim() || null;
    if (dto.imageUrl !== undefined) data.imageUrl = dto.imageUrl.trim() || null;
    if (dto.bandeAnnonceUrl !== undefined) data.bandeAnnonceUrl = dto.bandeAnnonceUrl.trim() || null;
    if (dto.niveau !== undefined) data.niveau = dto.niveau;
    if (dto.categorie !== undefined) data.categorie = dto.categorie.trim() || null;
    if (dto.objectifs !== undefined) {
      data.objectifs = dto.objectifs.map((o) => String(o).trim()).filter(Boolean).slice(0, 20);
    }
    if (dto.prerequis !== undefined) data.prerequis = dto.prerequis.trim() || null;
    if (dto.pourQui !== undefined) data.pourQui = dto.pourQui.trim() || null;
    if (dto.dureeMinutes !== undefined) data.dureeMinutes = dto.dureeMinutes;
    if (dto.prixCents !== undefined) data.prixCents = dto.prixCents;
    if (dto.prixBarreCents !== undefined) data.prixBarreCents = dto.prixBarreCents || null;
    if (dto.gratuit !== undefined) data.gratuit = dto.gratuit;
    if (dto.certificat !== undefined) data.certificat = dto.certificat;

    if (dto.modalite !== undefined) data.modalite = dto.modalite;
    if (dto.lieu !== undefined) data.lieu = dto.lieu.trim() || null;
    if (dto.lienVisio !== undefined) data.lienVisio = dto.lienVisio.trim() || null;
    if (dto.accesHandicap !== undefined) data.accesHandicap = dto.accesHandicap.trim() || null;
    if (dto.lectureOrdonnee !== undefined) data.lectureOrdonnee = dto.lectureOrdonnee;
    if (dto.placesMax !== undefined) data.placesMax = dto.placesMax || null;
    if (dto.tvaPourcent !== undefined) data.tvaPourcent = dto.tvaPourcent;
    if (dto.echeances !== undefined) data.echeances = dto.echeances;
    if (dto.seoTitre !== undefined) data.seoTitre = dto.seoTitre.trim() || null;
    if (dto.seoDescription !== undefined) data.seoDescription = dto.seoDescription.trim() || null;
    if (dto.commentairesActifs !== undefined) data.commentairesActifs = dto.commentairesActifs;

    // La fiche programme : on ne rattache qu'une fiche du compte, et une seule fois.
    if (dto.formationId !== undefined) {
      if (dto.formationId === null || dto.formationId === '') {
        data.programme = { disconnect: true };
      } else {
        const f = await this.prisma.formation.findFirst({
          where: { id: dto.formationId, ownerAccountId: accountId },
          include: { cours: { select: { id: true } } },
        });
        if (!f) throw new NotFoundException("Cette fiche programme n'existe pas.");
        if (f.cours && f.cours.id !== id) throw new BadRequestException('Cette fiche programme est déjà portée par une autre formation.');
        data.programme = { connect: { id: f.id } };
      }
    }

    // Une salle sans adresse, une visio sans lien : on le dit avant de publier.
    const modalite = dto.modalite ?? actuel.modalite;
    const enSalle = modalite === 'PRESENTIEL' || modalite === 'MIXTE';
    const enVisio = modalite === 'VIRTUEL' || modalite === 'MIXTE';
    const lieu = dto.lieu !== undefined ? dto.lieu.trim() : actuel.lieu;
    const lienVisio = dto.lienVisio !== undefined ? dto.lienVisio.trim() : actuel.lienVisio;
    if (dto.statut === StatutCours.PUBLIE && enSalle && !lieu) {
      throw new BadRequestException('Cette formation se tient en salle : écris où, avant de la publier.');
    }
    if (dto.statut === StatutCours.PUBLIE && enVisio && !lienVisio) {
      throw new BadRequestException('Cette formation se tient en visio : ajoute le lien, avant de la publier.');
    }

    if (dto.slug !== undefined) {
      const voulu = this.enSlug(dto.slug);
      if (!voulu) throw new BadRequestException("Cette adresse n'est pas utilisable.");
      if (voulu !== actuel.slug) {
        const pris = await this.prisma.cours.findUnique({ where: { slug: voulu } });
        if (pris) throw new BadRequestException('Cette adresse est déjà prise. Essaie-en une autre.');
        data.slug = voulu;
      }
    }

    if (dto.statut !== undefined) {
      if (dto.statut === StatutCours.PUBLIE) {
        const lecons = await this.prisma.leconCours.count({ where: { chapitre: { coursId: id } } });
        if (!lecons) throw new BadRequestException('Écris au moins une leçon avant de publier ce cours.');
        if (!actuel.publieLe) data.publieLe = new Date();
      }
      data.statut = dto.statut;
    }

    const cours = await this.prisma.cours.update({
      where: { id },
      data,
      include: { chapitres: { orderBy: { ordre: 'asc' }, include: { lecons: { orderBy: { ordre: 'asc' } } } } },
    });
    return this.rendreCours(cours);
  }

  async supprimerCours(accountId: string, id: string) {
    const c = await this.prisma.cours.findFirst({ where: { id, accountId } });
    if (!c) throw new NotFoundException("Ce cours n'existe pas.");
    await this.prisma.cours.delete({ where: { id } });
    return { supprime: true };
  }

  async dupliquerCours(accountId: string, id: string) {
    const source = await this.prisma.cours.findFirst({
      where: { id, accountId },
      include: { chapitres: { orderBy: { ordre: 'asc' }, include: { lecons: { orderBy: { ordre: 'asc' } } } } },
    });
    if (!source) throw new NotFoundException("Ce cours n'existe pas.");

    const titre = `${source.titre} (copie)`;
    const cours = await this.prisma.cours.create({
      data: {
        accountId,
        titre,
        slug: await this.slugLibre('cours', titre),
        sousTitre: source.sousTitre,
        description: source.description,
        imageUrl: source.imageUrl,
        niveau: source.niveau,
        categorie: source.categorie,
        objectifs: source.objectifs,
        prerequis: source.prerequis,
        pourQui: source.pourQui,
        dureeMinutes: source.dureeMinutes,
        prixCents: source.prixCents,
        prixBarreCents: source.prixBarreCents,
        gratuit: source.gratuit,
        certificat: source.certificat,
        chapitres: {
          create: source.chapitres.map((ch) => ({
            titre: ch.titre,
            resume: ch.resume,
            ordre: ch.ordre,
            lecons: {
              create: ch.lecons.map((l) => ({
                titre: l.titre,
                type: l.type,
                contenu: l.contenu,
                videoUrl: l.videoUrl,
                fichierUrl: l.fichierUrl,
                dureeMinutes: l.dureeMinutes,
                apercu: l.apercu,
                quiz: (l.quiz ?? Prisma.JsonNull) as Prisma.InputJsonValue,
                ordre: l.ordre,
              })),
            },
          })),
        },
      },
      include: { chapitres: { orderBy: { ordre: 'asc' }, include: { lecons: { orderBy: { ordre: 'asc' } } } } },
    });
    return this.rendreCours(cours);
  }

  /* ======================================================= LES CHAPITRES === */

  async creerChapitre(accountId: string, coursId: string, dto: ChapitreDto) {
    await this.monCours(accountId, coursId);
    const dernier = await this.prisma.chapitreCours.findFirst({
      where: { coursId },
      orderBy: { ordre: 'desc' },
      select: { ordre: true },
    });
    await this.prisma.chapitreCours.create({
      data: {
        coursId,
        titre: dto.titre?.trim() || 'Nouveau chapitre',
        resume: dto.resume?.trim() || null,
        ordre: (dernier?.ordre ?? -1) + 1,
      },
    });
    return this.lireCours(accountId, coursId);
  }

  async modifierChapitre(accountId: string, coursId: string, chapitreId: string, dto: ChapitreDto) {
    await this.monChapitre(accountId, coursId, chapitreId);
    await this.prisma.chapitreCours.update({
      where: { id: chapitreId },
      data: {
        ...(dto.titre !== undefined ? { titre: dto.titre.trim() || 'Chapitre' } : {}),
        ...(dto.resume !== undefined ? { resume: dto.resume.trim() || null } : {}),
      },
    });
    return this.lireCours(accountId, coursId);
  }

  async supprimerChapitre(accountId: string, coursId: string, chapitreId: string) {
    await this.monChapitre(accountId, coursId, chapitreId);
    await this.prisma.chapitreCours.delete({ where: { id: chapitreId } });
    return this.lireCours(accountId, coursId);
  }

  async reordonnerChapitres(accountId: string, coursId: string, dto: ReordonnerDto) {
    await this.monCours(accountId, coursId);
    const chapitres = await this.prisma.chapitreCours.findMany({ where: { coursId }, select: { id: true } });
    const connus = new Set(chapitres.map((c) => c.id));
    const ordre = dto.ids.filter((id) => connus.has(id));
    await this.prisma.$transaction(
      ordre.map((id, i) => this.prisma.chapitreCours.update({ where: { id }, data: { ordre: i } })),
    );
    return this.lireCours(accountId, coursId);
  }

  /* ========================================================== LES LEÇONS === */

  async creerLecon(accountId: string, coursId: string, chapitreId: string, dto: LeconDto) {
    await this.monChapitre(accountId, coursId, chapitreId);
    const dernier = await this.prisma.leconCours.findFirst({
      where: { chapitreId },
      orderBy: { ordre: 'desc' },
      select: { ordre: true },
    });
    await this.prisma.leconCours.create({
      data: {
        chapitreId,
        titre: dto.titre?.trim() || 'Nouvelle leçon',
        type: dto.type ?? undefined,
        ordre: (dernier?.ordre ?? -1) + 1,
      },
    });
    return this.lireCours(accountId, coursId);
  }

  async modifierLecon(accountId: string, coursId: string, leconId: string, dto: LeconDto) {
    await this.maLecon(accountId, coursId, leconId);

    const data: Prisma.LeconCoursUpdateInput = {};
    if (dto.titre !== undefined) data.titre = dto.titre.trim() || 'Leçon';
    if (dto.type !== undefined) data.type = dto.type;
    if (dto.contenu !== undefined) data.contenu = dto.contenu || null;
    if (dto.videoUrl !== undefined) data.videoUrl = dto.videoUrl.trim() || null;
    if (dto.fichierUrl !== undefined) data.fichierUrl = dto.fichierUrl.trim() || null;
    if (dto.dureeMinutes !== undefined) data.dureeMinutes = dto.dureeMinutes;
    if (dto.apercu !== undefined) data.apercu = dto.apercu;
    if (dto.quiz !== undefined) {
      data.quiz = (dto.quiz === null ? Prisma.JsonNull : nettoyerQuiz(dto.quiz)) as unknown as Prisma.InputJsonValue;
    }

    await this.prisma.leconCours.update({ where: { id: leconId }, data });
    return this.lireCours(accountId, coursId);
  }

  async supprimerLecon(accountId: string, coursId: string, leconId: string) {
    await this.maLecon(accountId, coursId, leconId);
    await this.prisma.leconCours.delete({ where: { id: leconId } });
    return this.lireCours(accountId, coursId);
  }

  async reordonnerLecons(accountId: string, coursId: string, chapitreId: string, dto: ReordonnerDto) {
    await this.monChapitre(accountId, coursId, chapitreId);
    const lecons = await this.prisma.leconCours.findMany({ where: { chapitreId }, select: { id: true } });
    const connus = new Set(lecons.map((l) => l.id));
    const ordre = dto.ids.filter((id) => connus.has(id));
    await this.prisma.$transaction(
      ordre.map((id, i) => this.prisma.leconCours.update({ where: { id }, data: { ordre: i } })),
    );
    return this.lireCours(accountId, coursId);
  }

  async deplacerLecon(accountId: string, coursId: string, leconId: string, dto: DeplacerLeconDto) {
    await this.maLecon(accountId, coursId, leconId);
    await this.monChapitre(accountId, coursId, dto.chapitreId);
    const dernier = await this.prisma.leconCours.findFirst({
      where: { chapitreId: dto.chapitreId },
      orderBy: { ordre: 'desc' },
      select: { ordre: true },
    });
    await this.prisma.leconCours.update({
      where: { id: leconId },
      data: { chapitreId: dto.chapitreId, ordre: dto.position ?? (dernier?.ordre ?? -1) + 1 },
    });
    return this.lireCours(accountId, coursId);
  }

  /* ======================================================= LES APPRENANTS == */

  async apprenants(accountId: string, coursId?: string) {
    const inscriptions = await this.prisma.inscriptionCours.findMany({
      where: { cours: { accountId }, ...(coursId ? { coursId } : {}) },
      orderBy: { createdAt: 'desc' },
      include: { cours: { select: { id: true, titre: true } } },
      take: 500,
    });

    return inscriptions.map((i) => ({
      id: i.id,
      email: i.email,
      nom: [i.prenom, i.nom].filter(Boolean).join(' ') || null,
      cours: { id: i.cours.id, titre: i.cours.titre },
      statut: i.statut,
      progression: i.progression,
      termineLe: i.termineLe,
      certificatEmisLe: i.certificatEmisLe,
      derniereVisite: i.derniereVisite,
      inscritLe: i.createdAt,
      lien: `/apprendre/${i.jeton}`,
    }));
  }

  async inscrireApprenant(accountId: string, coursId: string, dto: InscrireDto) {
    await this.monCours(accountId, coursId);
    const email = (dto.email ?? '').trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) throw new BadRequestException("Cette adresse e-mail n'est pas valide.");

    const deja = await this.prisma.inscriptionCours.findFirst({ where: { coursId, email } });
    if (deja) throw new BadRequestException('Cette personne est déjà inscrite à ce cours.');

    const inscription = await this.prisma.inscriptionCours.create({
      data: { coursId, email, nom: dto.nom?.trim() || null, prenom: dto.prenom?.trim() || null, jeton: this.nouveauJeton() },
    });
    return { id: inscription.id, email: inscription.email, lien: `/apprendre/${inscription.jeton}` };
  }

  async retirerApprenant(accountId: string, inscriptionId: string) {
    const i = await this.prisma.inscriptionCours.findFirst({ where: { id: inscriptionId, cours: { accountId } } });
    if (!i) throw new NotFoundException("Cette inscription n'existe pas.");
    await this.prisma.inscriptionCours.delete({ where: { id: inscriptionId } });
    return { supprime: true };
  }

  /* =========================================================== LES PACKS === */

  async listerPacks(accountId: string) {
    return this.prisma.packCours.findMany({ where: { accountId }, orderBy: { updatedAt: 'desc' } });
  }

  async creerPack(accountId: string, dto: PackDto) {
    const titre = dto.titre?.trim() || 'Nouveau pack';
    return this.prisma.packCours.create({
      data: {
        accountId,
        titre,
        slug: await this.slugLibre('pack', titre),
        description: dto.description?.trim() || null,
        prixCents: dto.prixCents ?? 0,
        coursIds: dto.coursIds ?? [],
      },
    });
  }

  async modifierPack(accountId: string, id: string, dto: PackDto) {
    const actuel = await this.prisma.packCours.findFirst({ where: { id, accountId } });
    if (!actuel) throw new NotFoundException("Ce pack n'existe pas.");

    const data: Prisma.PackCoursUpdateInput = {};
    if (dto.titre !== undefined) data.titre = dto.titre.trim() || 'Pack';
    if (dto.description !== undefined) data.description = dto.description.trim() || null;
    if (dto.imageUrl !== undefined) data.imageUrl = dto.imageUrl.trim() || null;
    if (dto.prixCents !== undefined) data.prixCents = dto.prixCents;
    if (dto.statut !== undefined) data.statut = dto.statut;
    if (dto.coursIds !== undefined) {
      const miens = await this.prisma.cours.findMany({ where: { accountId, id: { in: dto.coursIds } }, select: { id: true } });
      data.coursIds = dto.coursIds.filter((id2) => miens.some((c) => c.id === id2));
    }
    if (dto.slug !== undefined) {
      const voulu = this.enSlug(dto.slug);
      if (!voulu) throw new BadRequestException("Cette adresse n'est pas utilisable.");
      if (voulu !== actuel.slug) {
        const pris = await this.prisma.packCours.findUnique({ where: { slug: voulu } });
        if (pris) throw new BadRequestException('Cette adresse est déjà prise.');
        data.slug = voulu;
      }
    }
    return this.prisma.packCours.update({ where: { id }, data });
  }

  async supprimerPack(accountId: string, id: string) {
    const p = await this.prisma.packCours.findFirst({ where: { id, accountId } });
    if (!p) throw new NotFoundException("Ce pack n'existe pas.");
    await this.prisma.packCours.delete({ where: { id } });
    return { supprime: true };
  }

  /* ====================================================== LES CODES PROMO == */

  async listerCodes(accountId: string) {
    return this.prisma.codePromo.findMany({ where: { accountId }, orderBy: { createdAt: 'desc' } });
  }

  async creerCode(accountId: string, dto: CodePromoDto) {
    const code = this.enCode(dto.code ?? '') || `PROMO${randomBytes(2).toString('hex').toUpperCase()}`;
    const pris = await this.prisma.codePromo.findFirst({ where: { accountId, code } });
    if (pris) throw new BadRequestException('Ce code existe déjà.');
    return this.prisma.codePromo.create({
      data: {
        accountId,
        code,
        type: dto.type ?? TypeRemise.POURCENTAGE,
        valeur: dto.valeur ?? 10,
        coursIds: dto.coursIds ?? [],
        debuteLe: dto.debuteLe ? new Date(dto.debuteLe) : null,
        expireLe: dto.expireLe ? new Date(dto.expireLe) : null,
        usageMax: dto.usageMax ?? null,
      },
    });
  }

  async modifierCode(accountId: string, id: string, dto: CodePromoDto) {
    const actuel = await this.prisma.codePromo.findFirst({ where: { id, accountId } });
    if (!actuel) throw new NotFoundException("Ce code n'existe pas.");

    const data: Prisma.CodePromoUpdateInput = {};
    if (dto.code !== undefined) {
      const code = this.enCode(dto.code);
      if (!code) throw new BadRequestException("Ce code n'est pas utilisable.");
      if (code !== actuel.code) {
        const pris = await this.prisma.codePromo.findFirst({ where: { accountId, code } });
        if (pris) throw new BadRequestException('Ce code existe déjà.');
        data.code = code;
      }
    }
    if (dto.type !== undefined) data.type = dto.type;
    if (dto.valeur !== undefined) data.valeur = dto.valeur;
    if (dto.coursIds !== undefined) data.coursIds = dto.coursIds;
    if (dto.debuteLe !== undefined) data.debuteLe = dto.debuteLe ? new Date(dto.debuteLe) : null;
    if (dto.expireLe !== undefined) data.expireLe = dto.expireLe ? new Date(dto.expireLe) : null;
    if (dto.usageMax !== undefined) data.usageMax = dto.usageMax;
    if (dto.actif !== undefined) data.actif = dto.actif;

    return this.prisma.codePromo.update({ where: { id }, data });
  }

  async supprimerCode(accountId: string, id: string) {
    const c = await this.prisma.codePromo.findFirst({ where: { id, accountId } });
    if (!c) throw new NotFoundException("Ce code n'existe pas.");
    await this.prisma.codePromo.delete({ where: { id } });
    return { supprime: true };
  }

  /* ========================================================== LES VENTES === */

  async listerVentes(accountId: string) {
    const ventes = await this.prisma.venteCours.findMany({
      where: { accountId },
      orderBy: { createdAt: 'desc' },
      include: { cours: { select: { id: true, titre: true } } },
      take: 500,
    });
    return ventes.map((v) => ({
      id: v.id,
      email: v.email,
      nom: v.nom,
      cours: v.cours ? { id: v.cours.id, titre: v.cours.titre } : null,
      packId: v.packId,
      montantCents: v.montantCents,
      codePromo: v.codePromo,
      affiliation: v.affiliation,
      statut: v.statut,
      moyen: v.moyen,
      le: v.createdAt,
    }));
  }

  async enregistrerVente(accountId: string, dto: VenteDto) {
    if (dto.coursId) await this.monCours(accountId, dto.coursId);
    return this.prisma.venteCours.create({
      data: {
        accountId,
        coursId: dto.coursId || null,
        packId: dto.packId || null,
        email: dto.email.trim().toLowerCase(),
        nom: dto.nom?.trim() || null,
        montantCents: dto.montantCents,
        codePromo: dto.codePromo?.trim() || null,
        affiliation: dto.affiliation?.trim() || null,
        statut: dto.statut ?? StatutVente.PAYEE,
        moyen: dto.moyen?.trim() || null,
      },
    });
  }

  async modifierVente(accountId: string, id: string, dto: VenteDto) {
    const v = await this.prisma.venteCours.findFirst({ where: { id, accountId } });
    if (!v) throw new NotFoundException("Cette vente n'existe pas.");
    return this.prisma.venteCours.update({
      where: { id },
      data: {
        ...(dto.statut !== undefined ? { statut: dto.statut } : {}),
        ...(dto.montantCents !== undefined ? { montantCents: dto.montantCents } : {}),
        ...(dto.moyen !== undefined ? { moyen: dto.moyen.trim() || null } : {}),
      },
    });
  }

  async supprimerVente(accountId: string, id: string) {
    const v = await this.prisma.venteCours.findFirst({ where: { id, accountId } });
    if (!v) throw new NotFoundException("Cette vente n'existe pas.");
    await this.prisma.venteCours.delete({ where: { id } });
    return { supprime: true };
  }

  /* ================================================ LES CLASSES VIRTUELLES = */

  async listerClasses(accountId: string) {
    return this.prisma.classeVirtuelle.findMany({
      where: { accountId },
      orderBy: { debut: 'asc' },
      include: { cours: { select: { id: true, titre: true } } },
    });
  }

  async creerClasse(accountId: string, dto: ClasseDto) {
    if (dto.coursId) await this.monCours(accountId, dto.coursId);
    return this.prisma.classeVirtuelle.create({
      data: {
        accountId,
        coursId: dto.coursId || null,
        titre: dto.titre?.trim() || 'Classe virtuelle',
        description: dto.description?.trim() || null,
        debut: dto.debut ? new Date(dto.debut) : new Date(),
        fin: dto.fin ? new Date(dto.fin) : null,
        lien: dto.lien?.trim() || null,
        placesMax: dto.placesMax ?? null,
      },
    });
  }

  async modifierClasse(accountId: string, id: string, dto: ClasseDto) {
    const c = await this.prisma.classeVirtuelle.findFirst({ where: { id, accountId } });
    if (!c) throw new NotFoundException("Cette classe n'existe pas.");
    if (dto.coursId) await this.monCours(accountId, dto.coursId);
    return this.prisma.classeVirtuelle.update({
      where: { id },
      data: {
        ...(dto.titre !== undefined ? { titre: dto.titre.trim() || 'Classe virtuelle' } : {}),
        ...(dto.description !== undefined ? { description: dto.description.trim() || null } : {}),
        ...(dto.debut !== undefined ? { debut: new Date(dto.debut) } : {}),
        ...(dto.fin !== undefined ? { fin: dto.fin ? new Date(dto.fin) : null } : {}),
        ...(dto.lien !== undefined ? { lien: dto.lien.trim() || null } : {}),
        ...(dto.placesMax !== undefined ? { placesMax: dto.placesMax } : {}),
        ...(dto.coursId !== undefined ? { coursId: dto.coursId || null } : {}),
      },
    });
  }

  async supprimerClasse(accountId: string, id: string) {
    const c = await this.prisma.classeVirtuelle.findFirst({ where: { id, accountId } });
    if (!c) throw new NotFoundException("Cette classe n'existe pas.");
    await this.prisma.classeVirtuelle.delete({ where: { id } });
    return { supprime: true };
  }

  /* ========================================================= LA VITRINE ==== */

  async lireEcole(accountId: string) {
    const ecole = await this.prisma.ecoleEnLigne.findUnique({ where: { accountId } });
    if (ecole) return ecole;

    const compte = await this.prisma.account.findUnique({ where: { id: accountId }, select: { name: true } });
    const nom = compte?.name ?? 'Mon école';
    return this.prisma.ecoleEnLigne.create({
      data: { accountId, nom, slug: await this.slugLibre('ecole', nom) },
    });
  }

  async modifierEcole(accountId: string, dto: EcoleDto) {
    const actuelle = await this.lireEcole(accountId);

    const data: Prisma.EcoleEnLigneUpdateInput = {};
    if (dto.nom !== undefined) data.nom = dto.nom.trim() || actuelle.nom;
    if (dto.sousTitre !== undefined) data.sousTitre = dto.sousTitre.trim() || null;
    if (dto.presentation !== undefined) data.presentation = dto.presentation.trim() || null;
    if (dto.logoUrl !== undefined) data.logoUrl = dto.logoUrl.trim() || null;
    if (dto.banniereUrl !== undefined) data.banniereUrl = dto.banniereUrl.trim() || null;
    if (dto.couleur !== undefined) {
      const c = dto.couleur.trim();
      data.couleur = /^#[0-9a-fA-F]{6}$/.test(c) ? c : actuelle.couleur;
    }
    if (dto.contactEmail !== undefined) data.contactEmail = dto.contactEmail.trim() || null;
    if (dto.cgv !== undefined) data.cgv = dto.cgv || null;
    if (dto.mentions !== undefined) data.mentions = dto.mentions || null;
    if (dto.publiee !== undefined) data.publiee = dto.publiee;

    if (dto.slug !== undefined) {
      const voulu = this.enSlug(dto.slug);
      if (!voulu) throw new BadRequestException("Cette adresse n'est pas utilisable.");
      if (voulu !== actuelle.slug) {
        const pris = await this.prisma.ecoleEnLigne.findUnique({ where: { slug: voulu } });
        if (pris) throw new BadRequestException('Cette adresse est déjà prise.');
        data.slug = voulu;
      }
    }

    return this.prisma.ecoleEnLigne.update({ where: { accountId }, data });
  }

  /* ====================================================== L'AFFILIATION ==== */

  async listerAffilies(accountId: string) {
    return this.prisma.affilie.findMany({ where: { accountId }, orderBy: { createdAt: 'desc' } });
  }

  async creerAffilie(accountId: string, dto: AffilieDto) {
    const code = this.enCode(dto.code ?? '') || `AFF${randomBytes(2).toString('hex').toUpperCase()}`;
    const pris = await this.prisma.affilie.findFirst({ where: { accountId, code } });
    if (pris) throw new BadRequestException('Ce code existe déjà.');
    return this.prisma.affilie.create({
      data: {
        accountId,
        nom: dto.nom?.trim() || 'Partenaire',
        email: (dto.email ?? '').trim().toLowerCase(),
        code,
        commissionPourcent: dto.commissionPourcent ?? 20,
      },
    });
  }

  async modifierAffilie(accountId: string, id: string, dto: AffilieDto) {
    const a = await this.prisma.affilie.findFirst({ where: { id, accountId } });
    if (!a) throw new NotFoundException("Cet affilié n'existe pas.");
    return this.prisma.affilie.update({
      where: { id },
      data: {
        ...(dto.nom !== undefined ? { nom: dto.nom.trim() || a.nom } : {}),
        ...(dto.email !== undefined ? { email: dto.email.trim().toLowerCase() } : {}),
        ...(dto.commissionPourcent !== undefined ? { commissionPourcent: dto.commissionPourcent } : {}),
        ...(dto.actif !== undefined ? { actif: dto.actif } : {}),
      },
    });
  }

  async supprimerAffilie(accountId: string, id: string) {
    const a = await this.prisma.affilie.findFirst({ where: { id, accountId } });
    if (!a) throw new NotFoundException("Cet affilié n'existe pas.");
    await this.prisma.affilie.delete({ where: { id } });
    return { supprime: true };
  }

  /* ==================================================== LES STATISTIQUES === */

  async statistiques(accountId: string) {
    const [cours, inscriptions, ventes, classes] = await Promise.all([
      this.prisma.cours.findMany({
        where: { accountId },
        select: { id: true, titre: true, statut: true, prixCents: true, _count: { select: { inscriptions: true } } },
      }),
      this.prisma.inscriptionCours.findMany({
        where: { cours: { accountId } },
        select: { coursId: true, progression: true, termineLe: true, createdAt: true },
      }),
      this.prisma.venteCours.findMany({
        where: { accountId, statut: StatutVente.PAYEE },
        select: { montantCents: true, createdAt: true, coursId: true },
      }),
      this.prisma.classeVirtuelle.count({ where: { accountId, debut: { gte: new Date() } } }),
    ]);

    const maintenant = new Date();
    const debutMois = new Date(maintenant.getFullYear(), maintenant.getMonth(), 1);
    const il30 = new Date(maintenant.getTime() - 30 * 24 * 3600 * 1000);

    const chiffreTotal = ventes.reduce((n, v) => n + v.montantCents, 0);
    const chiffreMois = ventes.filter((v) => v.createdAt >= debutMois).reduce((n, v) => n + v.montantCents, 0);

    const parCours = cours
      .map((c) => {
        const siennes = inscriptions.filter((i) => i.coursId === c.id);
        const termines = siennes.filter((i) => i.termineLe).length;
        return {
          id: c.id,
          titre: c.titre,
          statut: c.statut,
          apprenants: c._count.inscriptions,
          termines,
          progressionMoyenne: siennes.length
            ? Math.round(siennes.reduce((n, i) => n + i.progression, 0) / siennes.length)
            : 0,
          chiffreCents: ventes.filter((v) => v.coursId === c.id).reduce((n, v) => n + v.montantCents, 0),
        };
      })
      .sort((a, b) => b.apprenants - a.apprenants);

    /** Les douze derniers mois, du plus ancien au plus récent. */
    const mois: { mois: string; chiffreCents: number; ventes: number }[] = [];
    for (let i = 11; i >= 0; i -= 1) {
      const d = new Date(maintenant.getFullYear(), maintenant.getMonth() - i, 1);
      const fin = new Date(d.getFullYear(), d.getMonth() + 1, 1);
      const dedans = ventes.filter((v) => v.createdAt >= d && v.createdAt < fin);
      mois.push({
        mois: d.toISOString().slice(0, 7),
        chiffreCents: dedans.reduce((n, v) => n + v.montantCents, 0),
        ventes: dedans.length,
      });
    }

    return {
      coursPublies: cours.filter((c) => c.statut === StatutCours.PUBLIE).length,
      coursTotal: cours.length,
      apprenants: inscriptions.length,
      apprenantsRecents: inscriptions.filter((i) => i.createdAt >= il30).length,
      termines: inscriptions.filter((i) => i.termineLe).length,
      progressionMoyenne: inscriptions.length
        ? Math.round(inscriptions.reduce((n, i) => n + i.progression, 0) / inscriptions.length)
        : 0,
      ventes: ventes.length,
      chiffreCents: chiffreTotal,
      chiffreMoisCents: chiffreMois,
      classesAVenir: classes,
      parCours,
      mois,
    };
  }

  /* ========================================================== LE PUBLIC ==== */

  /** La vitrine d'une école : ce qu'on voit avant d'acheter. */
  async vitrine(slug: string) {
    const ecole = await this.prisma.ecoleEnLigne.findUnique({ where: { slug } });
    if (!ecole || !ecole.publiee) throw new NotFoundException("Cette école n'existe pas.");

    const [cours, packs] = await Promise.all([
      this.prisma.cours.findMany({
        where: { accountId: ecole.accountId, statut: StatutCours.PUBLIE },
        orderBy: [{ ordre: 'asc' }, { publieLe: 'desc' }],
        include: { chapitres: { select: { _count: { select: { lecons: true } } } } },
      }),
      this.prisma.packCours.findMany({
        where: { accountId: ecole.accountId, statut: StatutCours.PUBLIE },
        orderBy: { updatedAt: 'desc' },
      }),
    ]);

    return {
      ecole: {
        nom: ecole.nom,
        slug: ecole.slug,
        sousTitre: ecole.sousTitre,
        presentation: ecole.presentation,
        logoUrl: ecole.logoUrl,
        banniereUrl: ecole.banniereUrl,
        couleur: ecole.couleur,
        contactEmail: ecole.contactEmail,
      },
      cours: cours.map((c) => ({
        titre: c.titre,
        slug: c.slug,
        sousTitre: c.sousTitre,
        imageUrl: c.imageUrl,
        niveau: c.niveau,
        gratuit: c.gratuit,
        prixCents: c.prixCents,
        prixBarreCents: c.prixBarreCents,
        dureeMinutes: c.dureeMinutes,
        nbLecons: c.chapitres.reduce((n, ch) => n + ch._count.lecons, 0),
        certificat: c.certificat,
      })),
      packs: packs.map((p) => ({ titre: p.titre, slug: p.slug, description: p.description, prixCents: p.prixCents })),
    };
  }

  /** La page publique d'un cours : le programme, sans le contenu des leçons. */
  async pageCours(slug: string) {
    const c = await this.prisma.cours.findUnique({
      where: { slug },
      include: {
        chapitres: { orderBy: { ordre: 'asc' }, include: { lecons: { orderBy: { ordre: 'asc' } } } },
        account: { select: { name: true, ecoleEnLigne: { select: { nom: true, slug: true, couleur: true, logoUrl: true } } } },
      },
    });
    if (!c || c.statut !== StatutCours.PUBLIE) throw new NotFoundException("Ce cours n'existe pas.");

    return {
      titre: c.titre,
      slug: c.slug,
      sousTitre: c.sousTitre,
      description: c.description,
      imageUrl: c.imageUrl,
      bandeAnnonceUrl: c.bandeAnnonceUrl,
      niveau: c.niveau,
      objectifs: c.objectifs,
      prerequis: c.prerequis,
      pourQui: c.pourQui,
      dureeMinutes: c.dureeMinutes || this.dureeCalculee(c.chapitres),
      gratuit: c.gratuit,
      prixCents: c.prixCents,
      prixBarreCents: c.prixBarreCents,
      certificat: c.certificat,
      modalite: c.modalite,
      lieu: c.lieu,
      accesHandicap: c.accesHandicap,
      echeances: c.echeances,
      tvaPourcent: c.tvaPourcent,
      ecole: c.account?.ecoleEnLigne
        ? {
            nom: c.account.ecoleEnLigne.nom,
            slug: c.account.ecoleEnLigne.slug,
            couleur: c.account.ecoleEnLigne.couleur,
            logoUrl: c.account.ecoleEnLigne.logoUrl,
          }
        : { nom: c.account?.name ?? '', slug: null, couleur: '#0F5F3E', logoUrl: null },
      chapitres: c.chapitres.map((ch) => ({
        titre: ch.titre,
        resume: ch.resume,
        lecons: ch.lecons.map((l) => ({
          titre: l.titre,
          type: l.type,
          dureeMinutes: l.dureeMinutes,
          apercu: l.apercu,
        })),
      })),
    };
  }

  /** S'inscrire à un cours depuis sa page publique. Renvoie le lien personnel. */
  async rejoindre(slug: string, dto: RejoindreDto) {
    const cours = await this.prisma.cours.findUnique({ where: { slug } });
    if (!cours || cours.statut !== StatutCours.PUBLIE) throw new NotFoundException("Ce cours n'accepte pas d'inscription.");

    const email = (dto.email ?? '').trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) throw new BadRequestException("Cette adresse e-mail n'est pas valide.");

    const gratuit = cours.gratuit || cours.prixCents === 0;
    if (!gratuit) {
      throw new ForbiddenException(
        "Ce cours est payant : l'inscription se fait après le paiement, depuis l'espace de l'organisme.",
      );
    }

    const deja = await this.prisma.inscriptionCours.findFirst({ where: { coursId: cours.id, email } });
    if (deja) return { lien: `/apprendre/${deja.jeton}`, dejaInscrit: true };

    if (cours.placesMax) {
      const inscrits = await this.prisma.inscriptionCours.count({ where: { coursId: cours.id } });
      if (inscrits >= cours.placesMax) {
        throw new ForbiddenException('Cette formation est complète. Écris à l\'organisme pour la prochaine session.');
      }
    }

    const inscription = await this.prisma.inscriptionCours.create({
      data: {
        coursId: cours.id,
        email,
        nom: dto.nom?.trim() || null,
        prenom: dto.prenom?.trim() || null,
        jeton: this.nouveauJeton(),
      },
    });
    return { lien: `/apprendre/${inscription.jeton}`, dejaInscrit: false };
  }

  /** Le cours tel qu'un apprenant le suit, avec ses leçons et sa progression. */
  async suivre(jeton: string) {
    const i = await this.prisma.inscriptionCours.findUnique({
      where: { jeton },
      include: {
        progressions: true,
        cours: {
          include: {
            chapitres: { orderBy: { ordre: 'asc' }, include: { lecons: { orderBy: { ordre: 'asc' } } } },
            account: { select: { name: true, ecoleEnLigne: { select: { nom: true, couleur: true, logoUrl: true } } } },
          },
        },
      },
    });
    if (!i) throw new NotFoundException("Ce lien n'ouvre aucun cours.");
    if (i.statut === StatutInscriptionCours.SUSPENDUE) throw new ForbiddenException('Cet accès est suspendu.');

    await this.prisma.inscriptionCours.update({ where: { id: i.id }, data: { derniereVisite: new Date() } });

    const faites = new Map(i.progressions.map((p) => [p.leconId, p]));

    return {
      apprenant: { prenom: i.prenom, nom: i.nom, email: i.email },
      progression: i.progression,
      termineLe: i.termineLe,
      certificat: i.cours.certificat,
      cours: {
        titre: i.cours.titre,
        sousTitre: i.cours.sousTitre,
        imageUrl: i.cours.imageUrl,
        certificat: i.cours.certificat,
        modalite: i.cours.modalite,
        lieu: i.cours.lieu,
        lienVisio: i.cours.lienVisio,
        lectureOrdonnee: i.cours.lectureOrdonnee,
        commentairesActifs: i.cours.commentairesActifs,
      },
      ecole: i.cours.account?.ecoleEnLigne
        ? {
            nom: i.cours.account.ecoleEnLigne.nom,
            couleur: i.cours.account.ecoleEnLigne.couleur,
            logoUrl: i.cours.account.ecoleEnLigne.logoUrl,
          }
        : { nom: i.cours.account?.name ?? '', couleur: '#0F5F3E', logoUrl: null },
      chapitres: i.cours.chapitres.map((ch) => ({
        id: ch.id,
        titre: ch.titre,
        resume: ch.resume,
        lecons: ch.lecons.map((l) => {
          const quiz = l.quiz ? nettoyerQuiz(l.quiz) : null;
          const p = faites.get(l.id);
          return {
            id: l.id,
            titre: l.titre,
            type: l.type,
            contenu: l.contenu,
            videoUrl: l.videoUrl,
            fichierUrl: l.fichierUrl,
            dureeMinutes: l.dureeMinutes,
            quiz: quizUtilisable(quiz) ? quizSansReponses(quiz as Quiz) : null,
            faite: Boolean(p?.faite),
            score: p?.score ?? null,
          };
        }),
      })),
    };
  }

  /** Cocher une leçon, ou rendre un quiz. */
  async avancer(jeton: string, leconId: string, dto: AvancerDto) {
    const i = await this.prisma.inscriptionCours.findUnique({ where: { jeton }, include: { cours: true } });
    if (!i) throw new NotFoundException("Ce lien n'ouvre aucun cours.");
    if (i.statut === StatutInscriptionCours.SUSPENDUE) throw new ForbiddenException('Cet accès est suspendu.');

    const lecon = await this.prisma.leconCours.findFirst({
      where: { id: leconId, chapitre: { coursId: i.coursId } },
    });
    if (!lecon) throw new NotFoundException("Cette leçon n'appartient pas à ce cours.");

    // Lecture ordonnée : on ne coche pas une leçon si la précédente ne l'est pas.
    if (i.cours.lectureOrdonnee && dto.faite !== false) {
      const avant = await this.prisma.leconCours.findMany({
        where: { chapitre: { coursId: i.coursId } },
        orderBy: [{ chapitre: { ordre: 'asc' } }, { ordre: 'asc' }],
        select: { id: true },
      });
      const rang = avant.findIndex((l) => l.id === leconId);
      const precedentes = avant.slice(0, Math.max(0, rang)).map((l) => l.id);
      if (precedentes.length) {
        const faitesAvant = await this.prisma.progressionLecon.count({
          where: { inscriptionId: i.id, faite: true, leconId: { in: precedentes } },
        });
        if (faitesAvant < precedentes.length) {
          throw new ForbiddenException('Cette formation se suit dans l\'ordre : termine la leçon précédente.');
        }
      }
    }

    const quiz = lecon.quiz ? nettoyerQuiz(lecon.quiz) : null;
    let score: number | null = null;
    let resultat: ReturnType<typeof corrigerQuiz> | null = null;
    let faite = dto.faite !== false;

    if (quizUtilisable(quiz)) {
      resultat = corrigerQuiz(quiz as Quiz, (dto.reponses ?? {}) as Record<string, unknown>);
      score = resultat.score;
      faite = resultat.reussi;
    }

    await this.prisma.progressionLecon.upsert({
      where: { inscriptionId_leconId: { inscriptionId: i.id, leconId } },
      create: { inscriptionId: i.id, leconId, faite, faiteLe: faite ? new Date() : null, score },
      update: { faite, faiteLe: faite ? new Date() : null, ...(score === null ? {} : { score }) },
    });

    const [total, cochees] = await Promise.all([
      this.prisma.leconCours.count({ where: { chapitre: { coursId: i.coursId } } }),
      this.prisma.progressionLecon.count({ where: { inscriptionId: i.id, faite: true } }),
    ]);
    const progression = total ? Math.round((cochees / total) * 100) : 0;
    const fini = total > 0 && cochees >= total;

    await this.prisma.inscriptionCours.update({
      where: { id: i.id },
      data: {
        progression,
        termineLe: fini ? (i.termineLe ?? new Date()) : null,
        statut: fini ? StatutInscriptionCours.TERMINEE : StatutInscriptionCours.ACTIVE,
        ...(fini && i.cours.certificat && !i.certificatEmisLe ? { certificatEmisLe: new Date() } : {}),
      },
    });

    return {
      progression,
      faite,
      termine: fini,
      ...(resultat
        ? {
            quiz: {
              score: resultat.score,
              reussi: resultat.reussi,
              noteMinimale: (quiz as Quiz).noteMinimale,
              details: resultat.details,
            },
          }
        : {}),
    };
  }

  /* ====================================================== COMMENTAIRES ==== */

  /** Ce que les apprenants ont écrit, tout le compte ou une seule formation. */
  async commentaires(accountId: string, coursId?: string) {
    const liste = await this.prisma.commentaireCours.findMany({
      where: { cours: { accountId }, ...(coursId ? { coursId } : {}) },
      orderBy: { createdAt: 'desc' },
      take: 300,
      include: { cours: { select: { id: true, titre: true } }, lecon: { select: { id: true, titre: true } } },
    });

    return liste.map((c) => ({
      id: c.id,
      cours: { id: c.cours.id, titre: c.cours.titre },
      lecon: c.lecon ? { id: c.lecon.id, titre: c.lecon.titre } : null,
      auteur: c.auteur,
      email: c.email,
      message: c.message,
      reponse: c.reponse,
      reponduLe: c.reponduLe,
      masque: c.masque,
      le: c.createdAt,
    }));
  }

  /** Répondre à un commentaire, ou le masquer. */
  async modifierCommentaire(accountId: string, id: string, dto: CommentaireDto) {
    const c = await this.prisma.commentaireCours.findFirst({ where: { id, cours: { accountId } } });
    if (!c) throw new NotFoundException("Ce commentaire n'existe pas.");

    const data: Prisma.CommentaireCoursUpdateInput = {};
    if (dto.reponse !== undefined) {
      const texte = dto.reponse.trim();
      data.reponse = texte || null;
      data.reponduLe = texte ? new Date() : null;
    }
    if (dto.masque !== undefined) data.masque = dto.masque;

    await this.prisma.commentaireCours.update({ where: { id }, data });
    return this.commentaires(accountId, c.coursId);
  }

  async supprimerCommentaire(accountId: string, id: string) {
    const c = await this.prisma.commentaireCours.findFirst({ where: { id, cours: { accountId } } });
    if (!c) throw new NotFoundException("Ce commentaire n'existe pas.");
    await this.prisma.commentaireCours.delete({ where: { id } });
    return { supprime: true };
  }

  /** Ce qu'un apprenant écrit depuis son lien personnel. */
  async commenter(jeton: string, dto: EcrireCommentaireDto) {
    const i = await this.prisma.inscriptionCours.findUnique({ where: { jeton }, include: { cours: true } });
    if (!i) throw new NotFoundException("Ce lien n'ouvre aucun cours.");
    if (i.statut === StatutInscriptionCours.SUSPENDUE) throw new ForbiddenException('Cet accès est suspendu.');
    if (!i.cours.commentairesActifs) throw new ForbiddenException("Les commentaires sont fermés sur cette formation.");

    const message = (dto.message ?? '').trim();
    if (message.length < 2) throw new BadRequestException('Écris ta question avant de l\'envoyer.');

    if (dto.leconId) {
      const lecon = await this.prisma.leconCours.findFirst({
        where: { id: dto.leconId, chapitre: { coursId: i.coursId } },
        select: { id: true },
      });
      if (!lecon) throw new NotFoundException("Cette leçon n'appartient pas à ce cours.");
    }

    const auteur = [i.prenom, i.nom].filter(Boolean).join(' ').trim() || i.email;
    const c = await this.prisma.commentaireCours.create({
      data: {
        coursId: i.coursId,
        leconId: dto.leconId || null,
        inscriptionId: i.id,
        auteur,
        email: i.email,
        message: message.slice(0, 4000),
      },
    });
    return { id: c.id, envoye: true };
  }

  /* ============================================================= OUTILS ==== */

  private async monCours(accountId: string, coursId: string) {
    const c = await this.prisma.cours.findFirst({ where: { id: coursId, accountId }, select: { id: true } });
    if (!c) throw new NotFoundException("Ce cours n'existe pas.");
    return c;
  }

  private async monChapitre(accountId: string, coursId: string, chapitreId: string) {
    const c = await this.prisma.chapitreCours.findFirst({
      where: { id: chapitreId, coursId, cours: { accountId } },
      select: { id: true },
    });
    if (!c) throw new NotFoundException("Ce chapitre n'existe pas.");
    return c;
  }

  private async maLecon(accountId: string, coursId: string, leconId: string) {
    const l = await this.prisma.leconCours.findFirst({
      where: { id: leconId, chapitre: { coursId, cours: { accountId } } },
      select: { id: true },
    });
    if (!l) throw new NotFoundException("Cette leçon n'existe pas.");
    return l;
  }

  private dureeCalculee(chapitres: { lecons: { dureeMinutes: number }[] }[]) {
    return chapitres.reduce((n, ch) => n + ch.lecons.reduce((m, l) => m + l.dureeMinutes, 0), 0);
  }

  private rendreCours(c: {
    id: string;
    titre: string;
    slug: string;
    sousTitre: string | null;
    description: string | null;
    imageUrl: string | null;
    bandeAnnonceUrl: string | null;
    niveau: string;
    categorie: string | null;
    objectifs: string[];
    prerequis: string | null;
    pourQui: string | null;
    dureeMinutes: number;
    prixCents: number;
    prixBarreCents: number | null;
    gratuit: boolean;
    certificat: boolean;
    modalite: string;
    lieu: string | null;
    lienVisio: string | null;
    accesHandicap: string | null;
    lectureOrdonnee: boolean;
    placesMax: number | null;
    tvaPourcent: number;
    echeances: number;
    seoTitre: string | null;
    seoDescription: string | null;
    commentairesActifs: boolean;
    formationId: string | null;
    statut: string;
    publieLe: Date | null;
    updatedAt: Date;
    chapitres: {
      id: string;
      titre: string;
      resume: string | null;
      ordre: number;
      lecons: {
        id: string;
        titre: string;
        type: string;
        contenu: string | null;
        videoUrl: string | null;
        fichierUrl: string | null;
        dureeMinutes: number;
        apercu: boolean;
        quiz: Prisma.JsonValue;
        ordre: number;
      }[];
    }[];
  }) {
    return {
      id: c.id,
      titre: c.titre,
      slug: c.slug,
      sousTitre: c.sousTitre,
      description: c.description,
      imageUrl: c.imageUrl,
      bandeAnnonceUrl: c.bandeAnnonceUrl,
      niveau: c.niveau,
      categorie: c.categorie,
      objectifs: c.objectifs,
      prerequis: c.prerequis,
      pourQui: c.pourQui,
      dureeMinutes: c.dureeMinutes,
      dureeCalculee: this.dureeCalculee(c.chapitres),
      prixCents: c.prixCents,
      prixBarreCents: c.prixBarreCents,
      gratuit: c.gratuit,
      certificat: c.certificat,
      modalite: c.modalite,
      lieu: c.lieu,
      lienVisio: c.lienVisio,
      accesHandicap: c.accesHandicap,
      lectureOrdonnee: c.lectureOrdonnee,
      placesMax: c.placesMax,
      tvaPourcent: c.tvaPourcent,
      echeances: c.echeances,
      seoTitre: c.seoTitre,
      seoDescription: c.seoDescription,
      commentairesActifs: c.commentairesActifs,
      formationId: c.formationId,
      statut: c.statut,
      publieLe: c.publieLe,
      modifieLe: c.updatedAt,
      adresse: `/cours/${c.slug}`,
      chapitres: c.chapitres.map((ch) => ({
        id: ch.id,
        titre: ch.titre,
        resume: ch.resume,
        ordre: ch.ordre,
        lecons: ch.lecons.map((l) => ({
          id: l.id,
          titre: l.titre,
          type: l.type,
          contenu: l.contenu,
          videoUrl: l.videoUrl,
          fichierUrl: l.fichierUrl,
          dureeMinutes: l.dureeMinutes,
          apercu: l.apercu,
          quiz: l.quiz ? nettoyerQuiz(l.quiz) : null,
          ordre: l.ordre,
        })),
      })),
    };
  }

  private enSlug(brut: string) {
    return normaliser(brut).slice(0, 80).replace(/^-+|-+$/g, '');
  }

  private enCode(brut: string) {
    return brut
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9-]/g, '')
      .slice(0, 40);
  }

  private nouveauJeton() {
    return randomBytes(16).toString('base64url');
  }

  /** Une adresse lisible, libre, dans la table demandée. */
  private async slugLibre(quoi: 'cours' | 'pack' | 'ecole' | 'formation', titre: string) {
    const base = normaliser(titre).slice(0, 60).replace(/^-+|-+$/g, '') || quoi;
    for (let i = 0; i < 40; i += 1) {
      const essai = i === 0 ? base : `${base}-${i + 1}`;
      const pris =
        quoi === 'cours'
          ? await this.prisma.cours.findUnique({ where: { slug: essai } })
          : quoi === 'pack'
            ? await this.prisma.packCours.findUnique({ where: { slug: essai } })
            : quoi === 'formation'
              ? await this.prisma.formation.findUnique({ where: { slug: essai } })
              : await this.prisma.ecoleEnLigne.findUnique({ where: { slug: essai } });
      if (!pris) return essai;
    }
    return `${base}-${randomBytes(3).toString('hex')}`;
  }
}

/** Enlève les accents, met en minuscules, remplace le reste par des tirets. */
function normaliser(brut: string) {
  return brut
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-{2,}/g, '-');
}
