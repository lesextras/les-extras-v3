import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  Optional,
  ServiceUnavailableException,
  type OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'node:crypto';
import { MoteurService } from '../assistant/moteur.service';
import { FormationType, Prisma, StatutCours, StatutInscriptionCours, StatutVente, TypeLecon, TypeRemise } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../common/mail/mail.service';
import { StripeConnectService } from '../paiements/stripe-connect.service';
import { EmailsEcoleService } from './suite/emails-ecole.service';
import { corrigerQuiz, nettoyerQuiz, quizSansReponses, quizUtilisable, type Quiz } from './quiz';
import type {
  AffilieDto,
  AcheterCoursDto,
  AvancerDto,
  AjouterContenuDto,
  CocherTachesDto,
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
  LeconIaDto,
  RejoindreDto,
  ReordonnerDto,
  StructureIaDto,
  TitreIaDto,
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
  constructor(
    private readonly prisma: PrismaService,
    private readonly moteur: MoteurService,
    private readonly config: ConfigService,
    private readonly mail: MailService,
    private readonly connect: StripeConnectService,
    /**
     * Les courriels automatiques de l'école (bienvenue, invitations, accès).
     * Optionnel : un test qui construit le service à la main n'a pas à le
     * fournir, et l'inscription ne doit jamais dépendre d'un envoi.
     */
    @Optional() private readonly emailsEcole?: EmailsEcoleService,
  ) {}

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
    try {
      await this.convertirLesLecons();
    } catch {
      // Ni pour une conversion : les leçons se lisent de toute façon.
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
        },
      });
    }
  }

  /**
   * ÉCRIRE EN BLOCS LES LEÇONS D'AVANT.
   *
   * Une leçon portait un seul contenu ; elle porte maintenant une suite de
   * blocs. On convertit une fois pour toutes, sans rien effacer : les anciennes
   * colonnes restent en place, elles ne servent simplement plus.
   */
  private async convertirLesLecons() {
    const anciennes = await this.prisma.leconCours.findMany({
      where: { blocs: { equals: Prisma.DbNull }, type: { in: [TypeLecon.TEXTE, TypeLecon.VIDEO, TypeLecon.AUDIO, TypeLecon.DOCUMENT] } },
      select: { id: true, type: true, contenu: true, videoUrl: true, fichierUrl: true },
      take: 2000,
    });
    for (const l of anciennes) {
      await this.prisma.leconCours.update({
        where: { id: l.id },
        data: { blocs: blocsDepuisLAncien(l) as Prisma.InputJsonValue },
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
        _count: { select: { inscriptions: true, leconsRacine: true } },
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
      nbLecons: c.chapitres.reduce((n, ch) => n + ch._count.lecons, 0) + c._count.leconsRacine,
      nbApprenants: c._count.inscriptions,
      dureeMinutes: c.dureeMinutes,
      creeLe: c.createdAt,
      modifieLe: c.updatedAt,
    }));
  }

  /**
   * CE QU'IL FAUT CHARGER POUR VOIR UNE FORMATION EN ENTIER.
   *
   * Les chapitres avec leurs leçons, ET les leçons posées sans chapitre :
   * le chapitre est facultatif, les deux se rangent dans la même liste.
   */
  private readonly avecContenu = {
    chapitres: { orderBy: { ordre: 'asc' as const }, include: { lecons: { orderBy: { ordre: 'asc' as const } } } },
    leconsRacine: { orderBy: { ordre: 'asc' as const } },
  };

  async lireCours(accountId: string, id: string) {
    const c = await this.prisma.cours.findFirst({ where: { id, accountId }, include: this.avecContenu });
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
      },
      include: this.avecContenu,
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
    if (dto.echeances !== undefined) {
      // UN ECHEANCIER DOIT TOMBER JUSTE.
      //
      // Un prestataire de paiement preleve N fois le MEME montant : il n'y a
      // pas de « derniere echeance qui absorbe la difference ». Un prix de
      // 190 EUR en trois fois donnerait 63,33 x 3 = 189,99 EUR, et l'organisme
      // encaisserait un centime de moins que son prix affiche, indefiniment.
      // On refuse ici, pendant qu'on peut encore changer le chiffre, plutot
      // qu'au moment ou un acheteur essaie de payer.
      const n = dto.echeances;
      const prix = dto.prixCents !== undefined ? dto.prixCents : undefined;
      const prixEffectif =
        prix !== undefined
          ? prix
          : (await this.prisma.cours.findUnique({ where: { id }, select: { prixCents: true } }))
              ?.prixCents ?? 0;
      if (n > 1 && prixEffectif > 0 && prixEffectif % n !== 0) {
        const euros = (c: number) => (c / 100).toFixed(2).replace('.', ',');
        throw new BadRequestException(
          `${euros(prixEffectif)} € ne se divise pas exactement en ${n} : chaque prélèvement doit être identique. Ajuste le prix ou le nombre de fois.`,
        );
      }
      data.echeances = n;
    }
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
        const lecons = await this.prisma.leconCours.count({
          where: { OR: [{ chapitre: { coursId: id } }, { coursId: id }] },
        });
        if (!lecons) throw new BadRequestException('Écris au moins une leçon avant de publier ce cours.');
        if (!actuel.publieLe) data.publieLe = new Date();
      }
      data.statut = dto.statut;
    }

    const cours = await this.prisma.cours.update({
      where: { id },
      data,
      include: this.avecContenu,
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
      include: this.avecContenu,
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
            publie: ch.publie,
            lecons: { create: ch.lecons.map((l) => this.copieDeLecon(l)) },
          })),
        },
        leconsRacine: { create: source.leconsRacine.map((l) => this.copieDeLecon(l)) },
      },
      include: this.avecContenu,
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
        ...(dto.publie !== undefined ? { publie: dto.publie } : {}),
        ...(dto.ouvertureJours !== undefined ? { ouvertureJours: dto.ouvertureJours } : {}),
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
    if (dto.dureeImposee !== undefined) data.dureeImposee = dto.dureeImposee;
    if (dto.ouvertureJours !== undefined) data.ouvertureJours = dto.ouvertureJours;
    if (dto.scormUrl !== undefined) data.scormUrl = dto.scormUrl.trim() || null;
    if (dto.taches !== undefined) {
      data.taches = (dto.taches === null ? Prisma.JsonNull : nettoyerTaches(dto.taches)) as unknown as Prisma.InputJsonValue;
    }
    if (dto.apercu !== undefined) data.apercu = dto.apercu;
    if (dto.publie !== undefined) data.publie = dto.publie;
    if (dto.blocs !== undefined) {
      data.blocs = (dto.blocs === null ? Prisma.JsonNull : nettoyerBlocs(dto.blocs)) as unknown as Prisma.InputJsonValue;
    }
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
    // Sans chapitre, la leçon remonte au premier niveau de la formation.
    const vers = dto.chapitreId?.trim() || null;
    if (vers) await this.monChapitre(accountId, coursId, vers);
    await this.prisma.leconCours.update({
      where: { id: leconId },
      data: {
        chapitreId: vers,
        coursId: vers ? null : coursId,
        ordre: dto.position ?? (await this.prochainOrdre(coursId, vers)),
      },
    });
    return this.lireCours(accountId, coursId);
  }


  /* ====================================================== LE CONTENU ==== */

  /**
   * AJOUTER UN CONTENU PÉDAGOGIQUE.
   *
   * Un seul geste pour tout : un chapitre, une leçon, un quiz, un devoir, une
   * classe en direct. Le chapitre est FACULTATIF — sans `chapitreId`, la leçon
   * se pose directement dans la formation, à la suite de ce qui existe déjà.
   * Chapitres et leçons de premier niveau partagent le même « ordre », si bien
   * qu'ils se rangent côte à côte dans une seule liste.
   */
  async ajouterContenu(accountId: string, coursId: string, dto: AjouterContenuDto) {
    await this.monCours(accountId, coursId);
    const genre = dto.genre ?? 'lecon';

    if (genre === 'chapitre') {
      await this.prisma.chapitreCours.create({
        data: {
          coursId,
          titre: dto.titre?.trim() || 'Nouveau chapitre',
          resume: dto.resume?.trim() || null,
          ordre: await this.prochainOrdre(coursId, null),
        },
      });
      return this.lireCours(accountId, coursId);
    }

    if (dto.chapitreId) await this.monChapitre(accountId, coursId, dto.chapitreId);

    const types: Record<string, string> = {
      quiz: TypeLecon.QUIZ,
      devoir: TypeLecon.DEVOIR,
      live: TypeLecon.LIVE,
      taches: TypeLecon.TACHES,
      scorm: TypeLecon.SCORM,
    };
    const noms: Record<string, string> = {
      quiz: 'Nouveau quiz',
      devoir: 'Nouveau devoir',
      live: 'Nouvelle classe en direct',
      taches: 'Nouvelles tâches',
      scorm: 'Nouveau contenu SCORM',
    };
    const type = (types[genre] ?? TypeLecon.TEXTE) as TypeLecon;
    const parDefaut = noms[genre] ?? 'Nouvelle leçon';

    await this.prisma.leconCours.create({
      data: {
        chapitreId: dto.chapitreId ?? null,
        coursId: dto.chapitreId ? null : coursId,
        titre: dto.titre?.trim() || parDefaut,
        type,
        blocs: (genre === 'lecon' ? [] : Prisma.JsonNull) as Prisma.InputJsonValue,
        ordre: await this.prochainOrdre(coursId, dto.chapitreId ?? null),
      },
    });
    return this.lireCours(accountId, coursId);
  }

  /**
   * RANGER LE PREMIER NIVEAU.
   *
   * Les identifiants arrivent préfixés — `chapitre:xxx`, `lecon:yyy` — parce
   * qu'un chapitre et une leçon peuvent se suivre dans la même liste.
   */
  async reordonnerContenu(accountId: string, coursId: string, dto: ReordonnerDto) {
    await this.monCours(accountId, coursId);
    const chapitres = await this.prisma.chapitreCours.findMany({ where: { coursId }, select: { id: true } });
    const lecons = await this.prisma.leconCours.findMany({ where: { coursId }, select: { id: true } });
    const ch = new Set(chapitres.map((c) => c.id));
    const le = new Set(lecons.map((l) => l.id));

    const gestes: Prisma.PrismaPromise<unknown>[] = [];
    let i = 0;
    for (const brut of dto.ids) {
      const [quoi, id] = brut.includes(':') ? brut.split(':') : ['', brut];
      if (quoi === 'chapitre' && ch.has(id)) gestes.push(this.prisma.chapitreCours.update({ where: { id }, data: { ordre: i++ } }));
      else if (quoi === 'lecon' && le.has(id)) gestes.push(this.prisma.leconCours.update({ where: { id }, data: { ordre: i++ } }));
      else if (!quoi && ch.has(id)) gestes.push(this.prisma.chapitreCours.update({ where: { id }, data: { ordre: i++ } }));
    }
    await this.prisma.$transaction(gestes);
    return this.lireCours(accountId, coursId);
  }

  /** Dupliquer une leçon : elle se pose juste après l'originale. */
  async dupliquerLecon(accountId: string, coursId: string, leconId: string) {
    const source = await this.laLecon(accountId, coursId, leconId);
    await this.prisma.leconCours.create({
      data: {
        ...this.copieDeLecon(source),
        titre: `${source.titre} (copie)`,
        chapitreId: source.chapitreId,
        coursId: source.coursId,
        ordre: source.ordre + 1,
      },
    });
    return this.lireCours(accountId, coursId);
  }

  /** Dupliquer un chapitre, avec tout ce qu'il contient. */
  async dupliquerChapitre(accountId: string, coursId: string, chapitreId: string) {
    await this.monChapitre(accountId, coursId, chapitreId);
    const source = await this.prisma.chapitreCours.findUnique({
      where: { id: chapitreId },
      include: { lecons: { orderBy: { ordre: 'asc' } } },
    });
    if (!source) throw new NotFoundException("Ce chapitre n'existe pas.");
    await this.prisma.chapitreCours.create({
      data: {
        coursId,
        titre: `${source.titre} (copie)`,
        resume: source.resume,
        publie: source.publie,
        ordre: await this.prochainOrdre(coursId, null),
        lecons: { create: source.lecons.map((l) => this.copieDeLecon(l)) },
      },
    });
    return this.lireCours(accountId, coursId);
  }

  /* ============================================================ OUTILS ==== */

  /** Le rang suivant : dans un chapitre, ou au premier niveau de la formation. */
  private async prochainOrdre(coursId: string, chapitreId: string | null) {
    if (chapitreId) {
      const d = await this.prisma.leconCours.findFirst({ where: { chapitreId }, orderBy: { ordre: 'desc' }, select: { ordre: true } });
      return (d?.ordre ?? -1) + 1;
    }
    const [dch, dle] = await Promise.all([
      this.prisma.chapitreCours.findFirst({ where: { coursId }, orderBy: { ordre: 'desc' }, select: { ordre: true } }),
      this.prisma.leconCours.findFirst({ where: { coursId }, orderBy: { ordre: 'desc' }, select: { ordre: true } }),
    ]);
    return Math.max(dch?.ordre ?? -1, dle?.ordre ?? -1) + 1;
  }

  /** Tout ce qu'on recopie d'une leçon, sans son rattachement ni son rang. */
  private copieDeLecon(l: {
    titre: string;
    type: TypeLecon;
    contenu: string | null;
    videoUrl: string | null;
    fichierUrl: string | null;
    blocs: Prisma.JsonValue;
    dureeMinutes: number;
    apercu: boolean;
    publie: boolean;
    quiz: Prisma.JsonValue;
    ordre: number;
  }) {
    return {
      titre: l.titre,
      type: l.type,
      contenu: l.contenu,
      videoUrl: l.videoUrl,
      fichierUrl: l.fichierUrl,
      blocs: (l.blocs ?? Prisma.JsonNull) as Prisma.InputJsonValue,
      dureeMinutes: l.dureeMinutes,
      apercu: l.apercu,
      publie: l.publie,
      quiz: (l.quiz ?? Prisma.JsonNull) as Prisma.InputJsonValue,
      ordre: l.ordre,
    };
  }

  /** La leçon en entier — elle appartient au cours, par son chapitre ou en direct. */
  private async laLecon(accountId: string, coursId: string, leconId: string) {
    const l = await this.prisma.leconCours.findFirst({
      where: { id: leconId, OR: [{ chapitre: { coursId, cours: { accountId } } }, { coursId, cours: { accountId } }] },
    });
    if (!l) throw new NotFoundException("Cette leçon n'existe pas.");
    return l;
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

    // L'INVITATION PART TOUTE SEULE, comme chez Teachizy : sans elle, la
    // personne inscrite par l'organisme ne connaît pas son lien d'accès.
    if (this.emailsEcole) {
      const cours = await this.prisma.cours.findUnique({ where: { id: coursId }, select: { titre: true } });
      const dejaEspace = await this.prisma.compteApprenant.findUnique({
        where: { accountId_email: { accountId, email } },
        select: { motDePasse: true },
      });
      const racine = await this.emailsEcole.racine(accountId);
      await this.emailsEcole
        .programmer({
          accountId,
          type: dejaEspace?.motDePasse ? 'INVITATION_EXISTANT' : 'INVITATION_NOUVEL',
          email,
          cle: `INVITATION:${inscription.id}`,
          donnees: { prenom: inscription.prenom, formation: cours?.titre ?? '', lien: `${racine}/apprendre/${inscription.jeton}` },
        })
        .catch(() => undefined);
    }
    return { id: inscription.id, email: inscription.email, lien: `/apprendre/${inscription.jeton}` };
  }

  /**
   * BLOQUER OU ROUVRIR L'ACCÈS D'UN APPRENANT.
   *
   * Bloquer ne supprime rien : la personne garde son inscription et sa
   * progression, elle ne peut simplement plus ouvrir le cours.
   */
  async bloquerApprenant(accountId: string, inscriptionId: string, bloquer: boolean) {
    const i = await this.prisma.inscriptionCours.findFirst({ where: { id: inscriptionId, cours: { accountId } } });
    if (!i) throw new NotFoundException("Cette inscription n'existe pas.");
    await this.prisma.inscriptionCours.update({
      where: { id: inscriptionId },
      data: { statut: bloquer ? StatutInscriptionCours.SUSPENDUE : StatutInscriptionCours.ACTIVE },
    });
    // La personne est prévenue que son accès change, dans un sens comme dans l'autre.
    if (this.emailsEcole && (i.statut === StatutInscriptionCours.SUSPENDUE) !== bloquer) {
      const cours = await this.prisma.cours.findUnique({ where: { id: i.coursId }, select: { titre: true } });
      const racine = await this.emailsEcole.racine(accountId);
      await this.emailsEcole
        .programmer({
          accountId,
          type: bloquer ? 'DESINSCRIPTION' : 'MODIFICATION_ACCES',
          email: i.email,
          cle: `${bloquer ? 'DESINSCRIPTION' : 'MODIFICATION_ACCES'}:${i.id}:${Date.now()}`,
          donnees: {
            prenom: i.prenom,
            formation: cours?.titre ?? '',
            lien: `${racine}/apprendre/${i.jeton}`,
            date: bloquer ? '' : 'Il est de nouveau ouvert.',
          },
        })
        .catch(() => undefined);
    }
    return { bloque: bloquer };
  }

  async retirerApprenant(accountId: string, inscriptionId: string) {
    const i = await this.prisma.inscriptionCours.findFirst({
      where: { id: inscriptionId, cours: { accountId } },
      include: { cours: { select: { titre: true } } },
    });
    if (!i) throw new NotFoundException("Cette inscription n'existe pas.");
    await this.prisma.inscriptionCours.delete({ where: { id: inscriptionId } });
    // Le message part même si l'inscription n'existe plus : ses données sont recopiées.
    if (this.emailsEcole) {
      await this.emailsEcole
        .programmer({
          accountId,
          type: 'SUPPRESSION',
          email: i.email,
          cle: `SUPPRESSION:${i.id}`,
          donnees: { prenom: i.prenom, formation: i.cours.titre },
        })
        .catch(() => undefined);
    }
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
        description: dto.description?.trim() || null,
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
    if (dto.description !== undefined) data.description = dto.description.trim() || null;
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
    const classes = await this.prisma.classeVirtuelle.findMany({
      where: { accountId },
      orderBy: { debut: 'asc' },
      include: { cours: { select: { id: true, titre: true } }, salle: { select: { jetonAnimateur: true } } },
    });
    // La salle intégrée se voit dans la liste : ouverte ou non, et ses deux liens.
    return classes.map(({ salle, ...c }) => ({
      ...c,
      salleActive: Boolean(salle),
      lienAnimateur: salle ? `/classe/${c.id}?animateur=${salle.jetonAnimateur}` : null,
      lienApprenants: salle ? `/classe/${c.id}` : null,
    }));
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
    if (dto.faviconUrl !== undefined) data.faviconUrl = dto.faviconUrl.trim() || null;

    // La couleur principale ne s'efface pas ; les cinq autres, si.
    if (dto.couleur !== undefined) {
      const c = dto.couleur.trim();
      data.couleur = estUneCouleur(c) ? c : actuelle.couleur;
    }
    if (dto.couleurFond !== undefined) data.couleurFond = couleurOuRien(dto.couleurFond);
    if (dto.couleurTitres !== undefined) data.couleurTitres = couleurOuRien(dto.couleurTitres);
    if (dto.couleurTextes !== undefined) data.couleurTextes = couleurOuRien(dto.couleurTextes);
    if (dto.couleurBoutons !== undefined) data.couleurBoutons = couleurOuRien(dto.couleurBoutons);
    if (dto.couleurTexteBoutons !== undefined) data.couleurTexteBoutons = couleurOuRien(dto.couleurTexteBoutons);

    if (dto.liensSociaux !== undefined) {
      data.liensSociaux = nettoyerLiens(dto.liensSociaux) as unknown as Prisma.InputJsonValue;
    }

    if (dto.contactEmail !== undefined) data.contactEmail = dto.contactEmail.trim() || null;
    if (dto.cgv !== undefined) data.cgv = dto.cgv || null;
    if (dto.mentions !== undefined) data.mentions = dto.mentions || null;

    if (dto.certificatModele !== undefined) data.certificatModele = dto.certificatModele.trim() || null;
    if (dto.certificatsActifs !== undefined) data.certificatsActifs = dto.certificatsActifs;
    if (dto.commentairesActifs !== undefined) data.commentairesActifs = dto.commentairesActifs;

    if (dto.googleAnalytics !== undefined) data.googleAnalytics = dto.googleAnalytics.trim() || null;
    if (dto.pixelMeta !== undefined) data.pixelMeta = dto.pixelMeta.trim() || null;

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
        ...(dto.gainsVersesCents !== undefined ? { gainsVersesCents: dto.gainsVersesCents } : {}),
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
        include: { chapitres: { select: { _count: { select: { lecons: true } } } }, _count: { select: { leconsRacine: true } } },
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
        faviconUrl: ecole.faviconUrl,
        couleur: ecole.couleur,
        couleurFond: ecole.couleurFond,
        couleurTitres: ecole.couleurTitres,
        couleurTextes: ecole.couleurTextes,
        couleurBoutons: ecole.couleurBoutons,
        couleurTexteBoutons: ecole.couleurTexteBoutons,
        liensSociaux: Array.isArray(ecole.liensSociaux) ? ecole.liensSociaux : [],
        googleAnalytics: ecole.googleAnalytics,
        pixelMeta: ecole.pixelMeta,
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
        nbLecons: c.chapitres.reduce((n, ch) => n + ch._count.lecons, 0) + c._count.leconsRacine,
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
        leconsRacine: { orderBy: { ordre: 'asc' } },
        account: { select: { name: true, ecoleEnLigne: { select: { nom: true, slug: true, couleur: true, logoUrl: true } } } },
      },
    });
    if (!c || c.statut !== StatutCours.PUBLIE) throw new NotFoundException("Ce cours n'existe pas.");

    const sommaire = (l: { titre: string; type: string; dureeMinutes: number; apercu: boolean }) => ({
      titre: l.titre,
      type: l.type,
      dureeMinutes: l.dureeMinutes,
      apercu: l.apercu,
    });

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
      dureeMinutes: c.dureeMinutes || this.dureeCalculee(c.chapitres, c.leconsRacine),
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
      // Un chapitre sans titre : les leçons posées directement dans la formation.
      chapitres: [
        ...c.chapitres
          .filter((ch) => ch.publie)
          .map((ch) => ({
            titre: ch.titre as string | null,
            resume: ch.resume,
            ordre: ch.ordre,
            lecons: ch.lecons.filter((l) => l.publie).map((l) => sommaire(l)),
          })),
        ...(c.leconsRacine.some((l) => l.publie)
          ? [
              {
                titre: null as string | null,
                resume: null,
                ordre: c.leconsRacine.find((l) => l.publie)?.ordre ?? 0,
                lecons: c.leconsRacine.filter((l) => l.publie).map((l) => sommaire(l)),
              },
            ]
          : []),
      ].sort((a, b) => a.ordre - b.ordre),
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

    // LE LIEN PART AUSSI PAR COURRIEL. L'afficher à l'écran ne suffit pas :
    // une personne qui ferme l'onglet n'a plus aucun moyen de revenir.
    await this.envoyerAcces({
      email,
      accountId: cours.accountId,
      titre: cours.titre,
      jeton: inscription.jeton,
      paye: false,
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
            leconsRacine: { orderBy: { ordre: 'asc' } },
            account: { select: { name: true, ecoleEnLigne: { select: { nom: true, couleur: true, logoUrl: true } } } },
          },
        },
      },
    });
    if (!i) throw new NotFoundException("Ce lien n'ouvre aucun cours.");
    if (i.statut === StatutInscriptionCours.SUSPENDUE) throw new ForbiddenException('Cet accès est suspendu.');
    const expireLe = await this.finDAcces(i.coursId, i.createdAt);
    if (expireLe && expireLe < new Date()) {
      throw new ForbiddenException(`Votre accès à cette formation a pris fin le ${expireLe.toLocaleDateString('fr-FR', { timeZone: 'Europe/Paris' })}.`);
    }

    await this.prisma.inscriptionCours.update({ where: { id: i.id }, data: { derniereVisite: new Date() } });

    const faites = new Map(i.progressions.map((p) => [p.leconId, p]));
    const joursDepuisInscription = Math.floor((Date.now() - i.createdAt.getTime()) / 86_400_000);

    /**
     * LA DIFFUSION PROGRESSIVE.
     *
     * Une leçon fermée n'est pas cachée : elle s'affiche avec le jour où elle
     * s'ouvre — sinon l'apprenant croit que la formation est plus courte
     * qu'elle ne l'est. Mais son contenu ne part pas dans la réponse : ce qui
     * n'est pas encore dû ne doit pas être lisible en regardant le réseau.
     */
    const rendre = (l: LeconEnBase, ouvertureChapitre = 0) => {
      const quiz = l.quiz ? nettoyerQuiz(l.quiz) : null;
      const p = faites.get(l.id);
      const jours = Math.max(l.ouvertureJours ?? 0, ouvertureChapitre);
      const fermee = jours > joursDepuisInscription;
      const base = {
        id: l.id,
        titre: l.titre,
        type: l.type,
        dureeMinutes: l.dureeMinutes,
        dureeImposee: Boolean(l.dureeImposee),
        ouverteLe: p?.ouverteLe ? p.ouverteLe.toISOString() : null,
        faite: Boolean(p?.faite),
        score: p?.score ?? null,
        ouvreDansJours: fermee ? jours - joursDepuisInscription : 0,
      };
      if (fermee) {
        return { ...base, contenu: null, videoUrl: null, fichierUrl: null, blocs: [], taches: [], tachesFaites: [], scormUrl: null, quiz: null };
      }
      return {
        ...base,
        contenu: l.contenu,
        videoUrl: l.videoUrl,
        fichierUrl: l.fichierUrl,
        blocs: Array.isArray(l.blocs) ? l.blocs : blocsDepuisLAncien(l),
        taches: Array.isArray(l.taches) ? l.taches : [],
        tachesFaites: Array.isArray(p?.taches) ? (p?.taches as string[]) : [],
        scormUrl: l.scormUrl ?? null,
        quiz: quizUtilisable(quiz) ? quizSansReponses(quiz as Quiz) : null,
      };
    };

    const [ecoleSlug, classes] = await Promise.all([
      this.prisma.ecoleEnLigne.findUnique({ where: { accountId: i.cours.accountId }, select: { slug: true } }),
      this.prisma.classeVirtuelle.findMany({
        where: {
          accountId: i.cours.accountId,
          OR: [{ coursId: i.coursId }, { coursId: null }],
          debut: { gte: new Date(Date.now() - 3 * 3600 * 1000) },
        },
        orderBy: { debut: 'asc' },
        take: 10,
        include: { salle: { select: { id: true } } },
      }),
    ]);

    return {
      apprenant: { prenom: i.prenom, nom: i.nom, email: i.email },
      progression: i.progression,
      termineLe: i.termineLe,
      certificat: i.cours.certificat,
      expireLe,
      espace: ecoleSlug ? { slug: ecoleSlug.slug } : null,
      classes: classes.map((c) => ({
        id: c.id,
        titre: c.titre,
        debut: c.debut,
        fin: c.fin,
        integree: Boolean(c.salle),
        lien: c.salle ? null : c.lien,
      })),
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
      // Les leçons posées sans chapitre forment un groupe sans titre, à leur rang.
      chapitres: [
        ...i.cours.chapitres
          .filter((ch) => ch.publie)
          .map((ch) => ({
            id: ch.id,
            titre: ch.titre as string | null,
            resume: ch.resume,
            ordre: ch.ordre,
            lecons: ch.lecons.filter((l) => l.publie).map((l) => rendre(l, ch.ouvertureJours)),
          })),
        ...(i.cours.leconsRacine.some((l) => l.publie)
          ? [
              {
                id: 'sans-chapitre',
                titre: null as string | null,
                resume: null,
                ordre: i.cours.leconsRacine.find((l) => l.publie)?.ordre ?? 0,
                lecons: i.cours.leconsRacine.filter((l) => l.publie).map((l) => rendre(l)),
              },
            ]
          : []),
      ].sort((a, b) => a.ordre - b.ordre),
    };
  }

  /** Cocher une leçon, ou rendre un quiz. */
  async avancer(jeton: string, leconId: string, dto: AvancerDto) {
    const i = await this.prisma.inscriptionCours.findUnique({ where: { jeton }, include: { cours: true } });
    if (!i) throw new NotFoundException("Ce lien n'ouvre aucun cours.");
    if (i.statut === StatutInscriptionCours.SUSPENDUE) throw new ForbiddenException('Cet accès est suspendu.');
    const finAcces = await this.finDAcces(i.coursId, i.createdAt);
    if (finAcces && finAcces < new Date()) throw new ForbiddenException('Votre accès à cette formation a pris fin.');

    // Le chapitre est facultatif : une leçon peut être posée à la racine de la
    // formation. La chercher par son seul chapitre la rendait introuvable.
    const lecon = await this.prisma.leconCours.findFirst({
      where: { id: leconId, OR: [{ chapitre: { coursId: i.coursId } }, { coursId: i.coursId }] },
    });
    if (!lecon) throw new NotFoundException("Cette leçon n'appartient pas à ce cours.");

    // UN DEVOIR SE VALIDE PAR SA CORRECTION, pas par un clic de l'apprenant :
    // sinon « J'ai terminé » suffirait à passer un devoir jamais rendu.
    if (lecon.type === TypeLecon.DEVOIR && dto.faite !== false) {
      const valide = await this.prisma.renduDevoir.findFirst({
        where: { inscriptionId: i.id, leconId, statut: 'VALIDE' },
        select: { id: true },
      });
      if (!valide) throw new ForbiddenException('Ce devoir se valide quand le formateur l’a corrigé : déposez-le d’abord.');
    }

    // La diffusion progressive vaut aussi ici : on ne coche pas une leçon qui
    // ne s'est pas encore ouverte.
    const chapitre = lecon.chapitreId
      ? await this.prisma.chapitreCours.findUnique({ where: { id: lecon.chapitreId }, select: { ouvertureJours: true } })
      : null;
    const jours = Math.max(lecon.ouvertureJours, chapitre?.ouvertureJours ?? 0);
    const depuis = Math.floor((Date.now() - i.createdAt.getTime()) / 86_400_000);
    if (jours > depuis) {
      const reste = jours - depuis;
      throw new ForbiddenException(
        `Cette leçon s'ouvre dans ${reste} jour${reste > 1 ? 's' : ''}.`,
      );
    }

    // Lecture ordonnée : on ne coche pas une leçon si la précédente ne l'est pas.
    if (i.cours.lectureOrdonnee && dto.faite !== false) {
      const avant = await this.prisma.leconCours.findMany({
        where: { OR: [{ chapitre: { coursId: i.coursId } }, { coursId: i.coursId }] },
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

    // La durée minimum : vérifiée sur l'horloge du serveur, à partir de la
    // première ouverture de la leçon. Croire le navigateur n'aurait rien imposé.
    if (lecon.dureeImposee && lecon.dureeMinutes > 0 && dto.faite !== false) {
      const p = await this.prisma.progressionLecon.findUnique({
        where: { inscriptionId_leconId: { inscriptionId: i.id, leconId } },
        select: { ouverteLe: true },
      });
      const debut = p?.ouverteLe?.getTime();
      const attendu = lecon.dureeMinutes * 60_000;
      if (!debut || Date.now() - debut < attendu) {
        const reste = Math.max(1, Math.ceil((attendu - (debut ? Date.now() - debut : 0)) / 60_000));
        throw new ForbiddenException(
          `Cette leçon demande ${lecon.dureeMinutes} minutes : il reste ${reste} minute${reste > 1 ? 's' : ''}.`,
        );
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
      this.prisma.leconCours.count({
        where: { OR: [{ chapitre: { coursId: i.coursId } }, { coursId: i.coursId }] },
      }),
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

  /**
   * L'APPRENANT OUVRE UNE LEÇON.
   *
   * On note l'heure une seule fois : c'est elle qui rend la durée minimum
   * vérifiable. Rouvrir la leçon ne remet pas le compteur à zéro — sinon
   * l'attente ne finirait jamais.
   */
  async ouvrirLecon(jeton: string, leconId: string) {
    const i = await this.prisma.inscriptionCours.findUnique({ where: { jeton } });
    if (!i) throw new NotFoundException("Ce lien n'ouvre aucun cours.");
    if (i.statut === StatutInscriptionCours.SUSPENDUE) throw new ForbiddenException('Cet accès est suspendu.');

    const lecon = await this.prisma.leconCours.findFirst({
      where: { id: leconId, OR: [{ chapitre: { coursId: i.coursId } }, { coursId: i.coursId }] },
      select: { id: true },
    });
    if (!lecon) throw new NotFoundException("Cette leçon n'appartient pas à ce cours.");

    const p = await this.prisma.progressionLecon.upsert({
      where: { inscriptionId_leconId: { inscriptionId: i.id, leconId } },
      create: { inscriptionId: i.id, leconId, ouverteLe: new Date() },
      update: {},
    });
    if (!p.ouverteLe) {
      await this.prisma.progressionLecon.update({ where: { id: p.id }, data: { ouverteLe: new Date() } });
    }
    return { ouverteLe: (p.ouverteLe ?? new Date()).toISOString() };
  }

  /** Les tâches cochées d'une leçon « Tâches & missions ». */
  async cocherTaches(jeton: string, leconId: string, dto: CocherTachesDto) {
    const i = await this.prisma.inscriptionCours.findUnique({ where: { jeton } });
    if (!i) throw new NotFoundException("Ce lien n'ouvre aucun cours.");
    if (i.statut === StatutInscriptionCours.SUSPENDUE) throw new ForbiddenException('Cet accès est suspendu.');

    const lecon = await this.prisma.leconCours.findFirst({
      where: { id: leconId, OR: [{ chapitre: { coursId: i.coursId } }, { coursId: i.coursId }] },
      select: { taches: true },
    });
    if (!lecon) throw new NotFoundException("Cette leçon n'appartient pas à ce cours.");

    // On ne garde que des identifiants qui existent vraiment dans la leçon.
    const connues = new Set(
      (Array.isArray(lecon.taches) ? lecon.taches : [])
        .map((t) => (t && typeof t === 'object' ? String((t as Record<string, unknown>).id ?? '') : ''))
        .filter(Boolean),
    );
    const cochees = [...new Set(dto.ids.filter((x) => connues.has(x)))].slice(0, 200);

    await this.prisma.progressionLecon.upsert({
      where: { inscriptionId_leconId: { inscriptionId: i.id, leconId } },
      create: { inscriptionId: i.id, leconId, taches: cochees as unknown as Prisma.InputJsonValue },
      update: { taches: cochees as unknown as Prisma.InputJsonValue },
    });
    return { taches: cochees };
  }

  /* ================================================ L'AIDE À L'ÉCRITURE ==== */

  /**
   * UN PLAN DE FORMATION PROPOSÉ.
   *
   * Rien n'est écrit en base : la proposition revient à l'écran, et c'est la
   * formatrice qui décide de la poser. Une structure imposée serait plus
   * rapide, et beaucoup plus difficile à défaire.
   */
  async proposerStructure(accountId: string, coursId: string, dto: StructureIaDto) {
    const c = await this.monCours(accountId, coursId);
    const texte = await this.demanderAuMoteur(
      "Tu aides une formatrice à bâtir le plan d'une formation en ligne. Tu réponds UNIQUEMENT par du JSON valide, sans texte autour, sans balise de code.",
      [
        `Formation : « ${c.titre} »${c.sousTitre ? ` — ${c.sousTitre}` : ''}.`,
        c.description ? `Ce qu'elle raconte : ${c.description}` : '',
        dto.consigne ? `Consigne de la formatrice : ${dto.consigne}` : '',
        `Propose ${dto.chapitres ?? 5} chapitres, ${dto.leconsParChapitre ?? 3} leçons par chapitre.`,
        'Réponds avec ce JSON : {"chapitres":[{"titre":"…","lecons":[{"titre":"…","resume":"…"}]}]}',
        'Les titres sont courts et concrets, en français, sans numérotation.',
      ]
        .filter(Boolean)
        .join('\n'),
    );
    const brut = lireJson(texte) as { chapitres?: unknown } | null;
    const chapitres = Array.isArray(brut?.chapitres) ? brut.chapitres : [];
    const propres = chapitres.slice(0, 12).map((ch) => {
      const o = (ch ?? {}) as Record<string, unknown>;
      const lecons = Array.isArray(o.lecons) ? o.lecons : [];
      return {
        titre: String(o.titre ?? 'Chapitre').slice(0, 200),
        lecons: lecons.slice(0, 10).map((l) => {
          const x = (l ?? {}) as Record<string, unknown>;
          return {
            titre: String(x.titre ?? 'Leçon').slice(0, 200),
            resume: String(x.resume ?? '').slice(0, 1000),
          };
        }),
      };
    });
    if (!propres.length) {
      throw new ServiceUnavailableException("La proposition est revenue vide. Réessaie, ou précise ta consigne.");
    }
    return { chapitres: propres };
  }

  /** Poser un plan proposé : les chapitres et leçons s'ajoutent à la suite. */
  async poserStructure(accountId: string, coursId: string, plan: { chapitres: { titre: string; lecons: { titre: string; resume?: string }[] }[] }) {
    await this.monCours(accountId, coursId);
    let rang = await this.prochainOrdre(coursId, null);
    for (const ch of plan.chapitres.slice(0, 12)) {
      const chapitre = await this.prisma.chapitreCours.create({
        data: { coursId, titre: (ch.titre || 'Chapitre').slice(0, 200), ordre: rang++ },
      });
      let r = 0;
      for (const l of (ch.lecons ?? []).slice(0, 10)) {
        await this.prisma.leconCours.create({
          data: {
            chapitreId: chapitre.id,
            titre: (l.titre || 'Leçon').slice(0, 200),
            ordre: r++,
            blocs: (l.resume
              ? [{ id: randomBytes(8).toString('hex'), type: 'texte', html: `<p>${echapperHtml(l.resume)}</p>` }]
              : []) as unknown as Prisma.InputJsonValue,
          },
        });
      }
    }
    return this.lireCours(accountId, coursId);
  }

  /** Des blocs proposés pour une leçon. Ils ne remplacent rien : ils s'ajoutent. */
  async proposerLecon(accountId: string, coursId: string, leconId: string, dto: LeconIaDto) {
    const c = await this.monCours(accountId, coursId);
    const lecon = await this.maLecon(accountId, coursId, leconId);
    const texte = await this.demanderAuMoteur(
      "Tu aides une formatrice à écrire une leçon en ligne. Tu réponds UNIQUEMENT par du JSON valide, sans texte autour, sans balise de code.",
      [
        `Formation : « ${c.titre} ». Leçon : « ${lecon.titre} ».`,
        dto.consigne ? `Consigne de la formatrice : ${dto.consigne}` : '',
        'Réponds avec ce JSON : {"blocs":[{"type":"titre","texte":"…"},{"type":"texte","html":"<p>…</p>"},{"type":"information","html":"<p>…</p>","ton":"info"}]}',
        'Types autorisés : titre, texte, information, separateur. Le HTML se limite à <p>, <strong>, <em>, <ul>, <li>.',
        'Écris en français, à la deuxième personne, sans promesse chiffrée et sans inventer de source.',
      ]
        .filter(Boolean)
        .join('\n'),
    );
    const brut = lireJson(texte) as { blocs?: unknown } | null;
    const blocs = nettoyerBlocs(Array.isArray(brut?.blocs) ? brut.blocs : []);
    if (!blocs.length) {
      throw new ServiceUnavailableException("La proposition est revenue vide. Réessaie, ou précise ta consigne.");
    }
    return { blocs };
  }

  /** Un titre et une description courte, à partir d'un sujet en une ligne. */
  async proposerTitre(dto: TitreIaDto) {
    const texte = await this.demanderAuMoteur(
      "Tu aides une formatrice à nommer sa formation. Tu réponds UNIQUEMENT par du JSON valide, sans texte autour, sans balise de code.",
      [
        `Sujet : ${dto.sujet}`,
        'Réponds avec ce JSON : {"titre":"…","description":"…"}',
        'Le titre fait moins de 70 caractères, la description moins de 200. En français, sans superlatif ni promesse chiffrée.',
      ].join('\n'),
    );
    const brut = (lireJson(texte) ?? {}) as Record<string, unknown>;
    return {
      titre: String(brut.titre ?? '').slice(0, 128),
      description: String(brut.description ?? '').slice(0, 400),
    };
  }

  /** L'appel au moteur, avec une raison lisible quand il refuse. */
  private async demanderAuMoteur(system: string, user: string): Promise<string> {
    if (!this.moteur.disponible) {
      throw new ServiceUnavailableException(
        "Aucun moteur de rédaction n'est branché sur ce serveur. Pose GEMINI_API_KEY dans la configuration.",
      );
    }
    try {
      return await this.moteur.completer({ system, user, maxTokens: 2000, temperature: 0.7 });
    } catch (err) {
      // On garde la VRAIE raison : sans elle, impossible de savoir si c'est la
      // clé, le quota, le modèle ou le réseau. La clé n'apparaît jamais.
      const cause = (err as { cause?: unknown } | null)?.cause;
      const detail = `${err instanceof Error ? err.message : String(err)} ${
        cause instanceof Error ? cause.message : typeof cause === 'string' ? cause : ''
      }`
        .replace(/AIza[A-Za-z0-9_-]{10,}/g, '***')
        .replace(/sk-[A-Za-z0-9_-]{8,}/g, '***')
        .trim();
      console.error('[IA école] le moteur a échoué :', detail.slice(0, 400));

      const quelleCle = this.moteur.moteur === 'gemini' ? 'GEMINI_API_KEY' : 'ANTHROPIC_API_KEY';
      const quelModele = this.moteur.moteur === 'gemini' ? 'GEMINI_MODEL' : 'ANTHROPIC_MODEL';

      // ⚠ NE PAS CLASSER SUR LE DÉTAIL ENTIER (09/09/2026).
      //
      // Quand tous les moteurs tombent, `cause` contient « Gemini : … |
      // Claude : … ». Le refus de Claude (« credit balance too low ») contient
      // le mot « credit » : il attrapait le filtre « quota » et l'écran
      // annonçait un quota atteint — alors que la vraie panne, celle du moteur
      // qu'on essaie EN PREMIER, restait invisible. On classe donc sur la part
      // de Gemini quand elle existe, et on montre le détail complet : à ce
      // stade, savoir pourquoi vaut mieux qu'une phrase ronde.
      const partGemini = /Gemini\s*:/.test(detail)
        ? detail.slice(detail.indexOf('Gemini'), detail.indexOf('| Claude') > 0 ? detail.indexOf('| Claude') : undefined)
        : detail;
      const aClasser = partGemini || detail;
      const suffixe = ` (détail : ${detail.slice(0, 220)})`;

      if (/401|403|API key not valid|PERMISSION_DENIED|unauthor|invalid x-api-key/i.test(aClasser)) {
        throw new ServiceUnavailableException(
          `La clé du moteur de rédaction est refusée. Recopie ${quelleCle} en entier dans la configuration du serveur, sans espace ni retour à la ligne.${suffixe}`,
        );
      }
      if (/quota|RESOURCE_EXHAUSTED|429|rate.?limit|billing|credit|402/i.test(aClasser)) {
        throw new ServiceUnavailableException(
          `Le moteur de rédaction a atteint son quota. Réessaie plus tard, ou recharge le compte du modèle.${suffixe}`,
        );
      }
      if (/404|NOT_FOUND|not_found|model/i.test(aClasser)) {
        throw new ServiceUnavailableException(
          `Le modèle demandé n'existe pas. Vérifie ${quelModele} dans la configuration du serveur.${suffixe}`,
        );
      }
      throw new ServiceUnavailableException(
        `Le moteur de rédaction n'a pas répondu : ${detail.slice(0, 160) || 'raison inconnue'}`,
      );
    }
  }

  /* ================================================= LE PAIEMENT EN LIGNE == */

  /**
   * ACHETER UNE FORMATION.
   *
   * On ne crée ni inscription ni vente ici : tant que Stripe n'a pas confirmé,
   * rien n'existe. C'est le webhook (`kind: 'cours'`) qui inscrit l'apprenant,
   * une fois et une seule.
   */
  async acheterCours(slug: string, dto: AcheterCoursDto, origine: string) {
    const cle = this.config.get<string>('STRIPE_SECRET_KEY');
    if (!cle) {
      throw new ServiceUnavailableException(
        "Le paiement en ligne n'est pas branché sur ce serveur.",
      );
    }
    const cours = await this.prisma.cours.findUnique({
      where: { slug },
      select: {
        id: true,
        accountId: true,
        titre: true,
        prixCents: true,
        gratuit: true,
        statut: true,
        echeances: true,
      },
    });
    if (!cours || cours.statut !== StatutCours.PUBLIE) throw new NotFoundException("Cette formation n'existe pas.");
    if (cours.gratuit || cours.prixCents <= 0) {
      throw new BadRequestException('Cette formation est gratuite : inscris-toi directement.');
    }

    const email = dto.email.trim().toLowerCase();
    const deja = await this.prisma.inscriptionCours.findUnique({
      where: { coursId_email: { coursId: cours.id, email } },
      select: { jeton: true },
    });
    if (deja) return { deja: true, lien: `/apprendre/${deja.jeton}` };

    // ETALER ET REMISER NE SE COMBINENT PAS.
    //
    // Un code promo change le montant, et un montant remise ne tombe presque
    // jamais juste sur N prelevements identiques. Plutot que de rogner la
    // remise en douce ou de laisser filer des centimes, on le dit.
    const etale = cours.echeances > 1;
    if (etale && dto.codePromo?.trim()) {
      throw new BadRequestException(
        "Un code promo ne s'applique pas à un règlement en plusieurs fois. Choisis l'un ou l'autre.",
      );
    }

    const remise = etale ? 0 : await this.remisePour(cours.accountId, cours.id, dto.codePromo);
    const montant = Math.max(0, cours.prixCents - remise);
    if (montant <= 0) throw new BadRequestException('Ce code ramène le prix à zéro : inscris-toi directement.');

    // Le garde-fou du dernier moment : la fiche a pu etre enregistree avant
    // que la regle existe. On ne prend pas l'argent d'un acheteur sur un
    // echeancier bancal.
    if (etale && montant % cours.echeances !== 0) {
      throw new BadRequestException(
        "Le règlement en plusieurs fois n'est pas disponible sur cette formation pour le moment.",
      );
    }

    const echeance = etale ? montant / cours.echeances : montant;
    const racine = origine.replace(/\/$/, '');
    const params: Record<string, string> = {
      mode: etale ? 'subscription' : 'payment',
      'line_items[0][quantity]': '1',
      'line_items[0][price_data][currency]': 'eur',
      'line_items[0][price_data][unit_amount]': String(echeance),
      'line_items[0][price_data][product_data][name]': etale
        ? `${cours.titre.slice(0, 170)} (${cours.echeances} fois)`
        : cours.titre.slice(0, 200),
      customer_email: email,
      // LA FICHE DE LA FORMATION EST SUR /cours/<slug>, PAS SUR /ecole/<slug>.
      // /ecole/<slug> est la vitrine de l'organisme : y renvoyer après le
      // paiement affichait « École introuvable » à quelqu'un qui venait de
      // payer, et le code qui ouvre l'accès au retour ne s'exécutait jamais.
      success_url: `${racine}/cours/${slug}?paiement=succes&session={CHECKOUT_SESSION_ID}`,
      cancel_url: `${racine}/cours/${slug}?paiement=annule`,
      'metadata[kind]': 'cours',
      // D'où vient l'achat : le message d'accès doit renvoyer sur la boutique
      // où la personne a payé, pas sur une autre adresse de la plateforme.
      'metadata[origine]': racine.slice(0, 120),
      'metadata[coursId]': cours.id,
      'metadata[accountId]': cours.accountId,
      'metadata[email]': email,
      'metadata[echeances]': String(etale ? cours.echeances : 1),
      'metadata[total]': String(montant),
    };

    if (etale) {
      params['line_items[0][price_data][recurring][interval]'] = 'month';
      // Les metadonnees de la SESSION ne suivent pas sur les prelevements
      // suivants : seules celles de l'abonnement voyagent avec chaque facture.
      // Sans elles, la deuxieme echeance arriverait sans savoir quelle vente
      // elle paie.
      params['subscription_data[metadata][kind]'] = 'cours';
      params['subscription_data[metadata][coursId]'] = cours.id;
      params['subscription_data[metadata][accountId]'] = cours.accountId;
      params['subscription_data[metadata][email]'] = email;
      params['subscription_data[metadata][echeances]'] = String(cours.echeances);
    }

    if (dto.nom?.trim()) params['metadata[nom]'] = dto.nom.trim().slice(0, 120);
    if (dto.codePromo?.trim()) params['metadata[codePromo]'] = dto.codePromo.trim().slice(0, 40);
    if (dto.affiliation?.trim()) params['metadata[affiliation]'] = dto.affiliation.trim().slice(0, 40);

    // L'ARGENT VA CHEZ L'ORGANISME QUAND IL A RELIÉ SON COMPTE.
    //
    // Sans compte relié, cette ligne n'ajoute rien et la vente suit le chemin
    // historique : encaissée par la plateforme. C'est ce qui permet de poser
    // le versement direct sans rien changer pour les comptes déjà en place.
    Object.assign(
      params,
      etale
        ? await this.connect.parametresDeVersementAbonnement(cours.accountId, echeance)
        : await this.connect.parametresDeVersement(cours.accountId, montant),
    );

    const res = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${cle}`, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(params).toString(),
    });
    const json = (await res.json()) as { id?: string; url?: string; error?: { message?: string } };
    if (!res.ok || !json.url) {
      throw new BadRequestException(json.error?.message ?? "Le paiement n'a pas pu s'ouvrir.");
    }
    // LE PANIER OUVERT : de quoi relancer un achat abandonné. Rien d'autre
    // n'est gardé tant que le paiement n'est pas confirmé.
    if (json.id) {
      await this.prisma.panierCours
        .create({
          data: { accountId: cours.accountId, coursId: cours.id, email, nom: dto.nom?.trim() || null, stripeSessionId: json.id },
        })
        .catch(() => undefined);
    }
    return { deja: false, url: json.url };
  }

  /**
   * ENVOIE LE LIEN D'ACCÈS À UNE FORMATION.
   *
   * Partagée par l'inscription gratuite et par le webhook de paiement, pour
   * que les deux chemins écrivent exactement le même message. Ne lève jamais :
   * un courriel qui ne part pas ne doit pas défaire une inscription déjà
   * enregistrée — la trace reste dans le journal des envois.
   */
  async envoyerAcces(params: {
    email: string;
    accountId: string;
    titre: string;
    jeton: string;
    paye: boolean;
    montantCents?: number | null;
    origine?: string | null;
  }): Promise<void> {
    try {
      const ecole = await this.prisma.ecoleEnLigne.findUnique({
        where: { accountId: params.accountId },
        select: { nom: true, couleur: true },
      });
      const compte = ecole
        ? null
        : await this.prisma.account.findUnique({
            where: { id: params.accountId },
            select: { name: true },
          });
      const racine =
        params.origine?.replace(/\/$/, '') ||
        this.config.get<string>('APP_WEB_URL')?.replace(/\/$/, '') ||
        '';

      // LE COURRIEL DE BIENVENUE DE L'ÉCOLE, quand il est actif : c'est lui qui
      // porte le lien d'accès, avec le texte et le délai que l'académie a
      // choisis. Désactivé, on garde le message d'accès historique : le lien
      // doit partir quoi qu'il arrive.
      if (this.emailsEcole && (await this.emailsEcole.actif(params.accountId, 'BIENVENUE'))) {
        const i = await this.prisma.inscriptionCours.findUnique({ where: { jeton: params.jeton }, select: { id: true, prenom: true } });
        const programme = await this.emailsEcole.programmer({
          accountId: params.accountId,
          type: 'BIENVENUE',
          email: params.email,
          cle: `BIENVENUE:${i?.id ?? params.jeton}`,
          donnees: { prenom: i?.prenom ?? null, formation: params.titre, lien: `${racine}/apprendre/${params.jeton}` },
        });
        if (programme) return;
      }

      await this.mail.sendAccesFormation({
        to: params.email,
        ecole: {
          nom: ecole?.nom || compte?.name || 'Votre organisme de formation',
          couleur: ecole?.couleur ?? null,
        },
        formation: params.titre,
        lien: `${racine}/apprendre/${params.jeton}`,
        paye: params.paye,
        montantCents: params.montantCents ?? null,
      });
    } catch {
      // Volontairement muet : MailService journalise déjà l'échec, et
      // l'inscription ne doit pas dépendre de la disponibilité du serveur SMTP.
    }
  }

  /** Le lien d'accès d'un achat, une fois Stripe passé par le webhook. */
  async achatConfirme(sessionId: string) {
    const vente = await this.prisma.venteCours.findUnique({
      where: { stripeSessionId: sessionId },
      select: { coursId: true, email: true },
    });
    if (!vente?.coursId) return { pret: false as const };
    const i = await this.prisma.inscriptionCours.findUnique({
      where: { coursId_email: { coursId: vente.coursId, email: vente.email } },
      select: { jeton: true },
    });
    return i ? { pret: true as const, lien: `/apprendre/${i.jeton}` } : { pret: false as const };
  }

  /** La remise d'un code promo sur un cours, en centimes. Zéro si le code ne vaut pas. */
  private async remisePour(accountId: string, coursId: string, code?: string): Promise<number> {
    if (!code?.trim()) return 0;
    const promo = await this.prisma.codePromo.findFirst({
      where: { accountId, code: this.enCode(code) },
    });
    if (!promo || !promo.actif) return 0;
    const maintenant = new Date();
    if (promo.debuteLe && promo.debuteLe > maintenant) return 0;
    if (promo.expireLe && promo.expireLe < maintenant) return 0;
    if (promo.usageMax !== null && promo.usages >= promo.usageMax) return 0;
    // Une liste vide veut dire « tout le catalogue ».
    if (promo.coursIds.length && !promo.coursIds.includes(coursId)) return 0;
    const cours = await this.prisma.cours.findUnique({ where: { id: coursId }, select: { prixCents: true } });
    const prix = cours?.prixCents ?? 0;
    return promo.type === TypeRemise.POURCENTAGE
      ? Math.round((prix * promo.valeur) / 100)
      : Math.min(prix, promo.valeur);
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
    const c = await this.prisma.cours.findFirst({
      where: { id: coursId, accountId },
      // Le titre et la description servent aux propositions d'écriture : les
      // demander ici évite une seconde requête à chaque appel.
      select: { id: true, titre: true, sousTitre: true, description: true },
    });
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
      where: { id: leconId, OR: [{ chapitre: { coursId, cours: { accountId } } }, { coursId, cours: { accountId } }] },
      select: { id: true, titre: true },
    });
    if (!l) throw new NotFoundException("Cette leçon n'existe pas.");
    return l;
  }

  private dureeCalculee(chapitres: { lecons: { dureeMinutes: number }[] }[], racine: { dureeMinutes: number }[] = []) {
    return (
      chapitres.reduce((n, ch) => n + ch.lecons.reduce((m, l) => m + l.dureeMinutes, 0), 0) +
      racine.reduce((m, l) => m + l.dureeMinutes, 0)
    );
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
      publie: boolean;
      ouvertureJours: number;
      lecons: LeconEnBase[];
    }[];
    leconsRacine: LeconEnBase[];
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
      dureeCalculee: this.dureeCalculee(c.chapitres, c.leconsRacine),
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
        publie: ch.publie,
        lecons: ch.lecons.map((l) => this.rendreLecon(l)),
      })),
      // LA LISTE UNIQUE : chapitres et leçons sans chapitre, rangés ensemble.
      contenu: [
        ...c.chapitres.map((ch) => ({
          genre: 'chapitre' as const,
          id: ch.id,
          titre: ch.titre,
          resume: ch.resume,
          ordre: ch.ordre,
          publie: ch.publie,
          ouvertureJours: ch.ouvertureJours,
          lecons: ch.lecons.map((l) => this.rendreLecon(l)),
        })),
        ...c.leconsRacine.map((l) => ({ genre: 'lecon' as const, ...this.rendreLecon(l) })),
      ].sort((a, b) => a.ordre - b.ordre),
    };
  }

  /** Une leçon telle que l'atelier la lit : ses blocs, son état, son rang. */
  private rendreLecon(l: LeconEnBase) {
    return {
      id: l.id,
      titre: l.titre,
      type: l.type,
      contenu: l.contenu,
      videoUrl: l.videoUrl,
      fichierUrl: l.fichierUrl,
      blocs: Array.isArray(l.blocs) ? l.blocs : blocsDepuisLAncien(l),
      dureeMinutes: l.dureeMinutes,
      dureeImposee: l.dureeImposee,
      ouvertureJours: l.ouvertureJours,
      taches: Array.isArray(l.taches) ? l.taches : [],
      scormUrl: l.scormUrl ?? null,
      apercu: l.apercu,
      publie: l.publie,
      quiz: l.quiz ? nettoyerQuiz(l.quiz) : null,
      ordre: l.ordre,
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
  /** La fin d'accès d'une inscription, quand la formation a une durée d'accès. */
  private async finDAcces(coursId: string, inscritLe: Date): Promise<Date | null> {
    const r = await this.prisma.reglageCours.findUnique({ where: { coursId }, select: { dureeAccesJours: true } });
    return r?.dureeAccesJours ? new Date(inscritLe.getTime() + r.dureeAccesJours * 86_400_000) : null;
  }

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
/** Une couleur écrite en hexadécimal, la seule forme qu'on accepte. */
function estUneCouleur(v: string) {
  return /^#[0-9a-fA-F]{6}$/.test(v);
}

/** Une couleur, ou rien du tout — pour les couleurs qu'on peut laisser vides. */
function couleurOuRien(brut: string) {
  const c = brut.trim();
  return estUneCouleur(c) ? c : null;
}

/** Les réseaux sur lesquels une école peut renvoyer. */
const RESEAUX = new Set([
  'site',
  'facebook',
  'messenger',
  'whatsapp',
  'instagram',
  'tiktok',
  'linkedin',
  'youtube',
  'twitter',
  'vimeo',
  'soundcloud',
  'spotify',
  'pinterest',
  'github',
]);

/** On garde les liens dont le réseau est connu et l'adresse tient debout. */
function nettoyerLiens(brut: unknown) {
  if (!Array.isArray(brut)) return [];
  const propres: { reseau: string; url: string }[] = [];
  for (const l of brut.slice(0, 30)) {
    if (!l || typeof l !== 'object') continue;
    const lien = l as Record<string, unknown>;
    const reseau = String(lien.reseau ?? '').trim().toLowerCase();
    const url = String(lien.url ?? '').trim().slice(0, 600);
    if (!RESEAUX.has(reseau) || !/^https?:\/\//.test(url)) continue;
    propres.push({ reseau, url });
  }
  return propres;
}

/** Une leçon telle qu'elle est rangée en base. */
type LeconEnBase = {
  id: string;
  titre: string;
  type: string;
  contenu: string | null;
  videoUrl: string | null;
  fichierUrl: string | null;
  blocs: Prisma.JsonValue;
  taches?: Prisma.JsonValue;
  scormUrl?: string | null;
  dureeImposee?: boolean;
  ouvertureJours?: number;
  dureeMinutes: number;
  apercu: boolean;
  publie: boolean;
  quiz: Prisma.JsonValue;
  ordre: number;
};

/**
 * LIRE UNE LEÇON ÉCRITE AVANT LES BLOCS.
 *
 * Avant, une leçon portait un seul contenu : un texte, une vidéo, un fichier.
 * On le rend sous forme de blocs pour que l'atelier n'ait qu'une seule façon
 * de lire. Rien n'est effacé en base : la conversion se fait à la lecture, et
 * une fois pour toutes au premier enregistrement.
 */
function blocsDepuisLAncien(l: {
  type: string;
  contenu: string | null;
  videoUrl: string | null;
  fichierUrl: string | null;
}): unknown[] {
  const blocs: unknown[] = [];
  if (l.videoUrl) blocs.push({ id: 'video', type: l.type === 'AUDIO' ? 'audio' : 'video', url: l.videoUrl });
  if (l.contenu) blocs.push({ id: 'texte', type: 'texte', html: l.contenu });
  if (l.fichierUrl) blocs.push({ id: 'fichier', type: 'fichier', url: l.fichierUrl });
  return blocs;
}

/**
 * Les blocs qu'une leçon sait afficher. Tout le reste est écarté.
 *
 * La liste suit celle du côté web (_shared/blocs.ts) : ce qui n'y figure pas
 * n'est pas rendu, donc n'a rien à faire en base.
 */
const TYPES_DE_BLOC = new Set([
  'titre',
  'texte',
  'video',
  'audio',
  'image',
  'separateur',
  'information',
  'fichier',
  'pdf',
  'lien',
  'classe',
  'leconLiee',
  'markdown',
  'gif',
  'calendly',
  'typeform',
  'youtube',
  'youtubeDirect',
  'vimeo',
  'dailymotion',
  'twitch',
  'soundcloud',
  'googleDocs',
  'googleSheets',
  'googleForms',
  'googleCalendar',
  'googleSlides',
  'html',
  'genially',
  'accordeon',
  'carte',
  'gratter',
  'slideshare',
  'instagram',
  'tweet',
  'pinterest',
  'figma',
  'gist',
  'code',
  'chronologie',
  'jsfiddle',
  'codepen',
  'codesandbox',
  'tiktok',
]);

/**
 * RELIRE LES BLOCS D'UNE LEÇON.
 *
 * Ce qui arrive du navigateur est un tableau libre : on garde les blocs dont
 * le type est connu, on borne les textes, on donne un identifiant à ceux qui
 * n'en ont pas. Le reste est jeté sans bruit.
 */
function nettoyerBlocs(brut: unknown): unknown[] {
  if (!Array.isArray(brut)) return [];
  const propres: unknown[] = [];
  for (const b of brut.slice(0, 200)) {
    if (!b || typeof b !== 'object') continue;
    const bloc = b as Record<string, unknown>;
    const type = String(bloc.type ?? '');
    if (!TYPES_DE_BLOC.has(type)) continue;

    const texte = (v: unknown, max: number) => (typeof v === 'string' ? v.slice(0, max) : undefined);
    const propre: Record<string, unknown> = {
      id: texte(bloc.id, 40) || randomBytes(8).toString('hex'),
      type,
    };
    const html = texte(bloc.html, 60000);
    if (html !== undefined) propre.html = html;
    const contenu = texte(bloc.texte, 60000);
    if (contenu !== undefined) propre.texte = contenu;
    const url = texte(bloc.url, 1000);
    if (url !== undefined) propre.url = url;
    const legende = texte(bloc.legende, 300);
    if (legende !== undefined) propre.legende = legende;
    const nom = texte(bloc.nom, 200);
    if (nom !== undefined) propre.nom = nom;
    const ton = texte(bloc.ton, 20);
    if (ton !== undefined) propre.ton = ton;
    if (typeof bloc.niveau === 'number') propre.niveau = Math.min(4, Math.max(2, Math.round(bloc.niveau)));
    const debut = texte(bloc.debut, 40);
    if (debut !== undefined) propre.debut = debut;
    const verso = texte(bloc.verso, 60000);
    if (verso !== undefined) propre.verso = verso;
    const langue = texte(bloc.langue, 40);
    if (langue !== undefined) propre.langue = langue;
    const leconId = texte(bloc.leconId, 40);
    if (leconId !== undefined) propre.leconId = leconId;

    propres.push(propre);
  }
  return propres;
}

/**
 * TÂCHES & MISSIONS : [{ id, texte }].
 *
 * Une tâche sans texte n'est pas une tâche : on la jette. L'identifiant sert à
 * retrouver la case cochée, il est donné s'il manque.
 */
function nettoyerTaches(brut: unknown): unknown[] {
  if (!Array.isArray(brut)) return [];
  const propres: unknown[] = [];
  for (const t of brut.slice(0, 200)) {
    if (!t || typeof t !== 'object') continue;
    const o = t as Record<string, unknown>;
    const texte = typeof o.texte === 'string' ? o.texte.slice(0, 500).trim() : '';
    if (!texte) continue;
    const id = typeof o.id === 'string' && o.id ? o.id.slice(0, 40) : randomBytes(8).toString('hex');
    propres.push({ id, texte });
  }
  return propres;
}

/** Le HTML que l'on pose nous-mêmes : on échappe ce qui vient d'ailleurs. */
function echapperHtml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * LIRE LE JSON D'UN MODÈLE.
 *
 * Un modèle encadre volontiers sa réponse d'une balise de code ou d'une phrase
 * de politesse. On coupe au premier accolade et à la dernière : plus robuste
 * que d'espérer une réponse parfaite.
 */
function lireJson(brut: string): unknown {
  const t = brut.trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
  const d = t.indexOf('{');
  const f = t.lastIndexOf('}');
  if (d < 0 || f <= d) return null;
  try {
    return JSON.parse(t.slice(d, f + 1));
  } catch {
    return null;
  }
}

function normaliser(brut: string) {
  return brut
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-{2,}/g, '-');
}
