import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AccountRole,
  Capacite,
  MembershipStatus,
  NiveauResponsabilite,
  OrigineVerification,
  PorteeService,
  StatutDemande,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RequestAccount, RequestUser } from '../common/types/request-context';
import {
  SELECT_MEMBRE,
  versMembreCourant,
  estDirection,
  filtreMembresVisibles,
  peutPiloterService,
  capacitesEffectives,
  capacitesDelegables,
  niveauDelegable,
  MembreCourant,
} from '../common/perimetre';
import {
  DeclarerPosteDto,
  ChangerNiveauDto,
  AccorderCapacitesDto,
  DemanderNiveauDto,
  VisibiliteDto,
} from './dto/organisation.dto';

const ROLE_PAR_NIVEAU: Record<NiveauResponsabilite, AccountRole> = {
  [NiveauResponsabilite.DIRECTION]: AccountRole.ADMIN,
  [NiveauResponsabilite.RESPONSABLE]: AccountRole.MANAGER,
  [NiveauResponsabilite.SALARIE]: AccountRole.MEMBER,
};

/**
 * ORGANISATION — niveaux de responsabilité, droits délégués, organigramme.
 *
 * ⚠ DEUX CHOSES DIFFÉRENTES, QU'IL NE FAUT JAMAIS CONFONDRE À L'AFFICHAGE :
 *
 *   — LE RATTACHEMENT est VÉRIFIÉ (`Membership.verifie`) : quelqu'un atteste
 *     que cette personne est bien dans ce service, parce qu'elle y a été
 *     invitée ou acceptée.
 *   — LE NIVEAU est DÉCLARÉ, et seulement VALIDÉ (`niveauValide`) quand
 *     quelqu'un qui en avait le pouvoir l'a confirmé.
 *
 * Un chef de service qui invite un collègue atteste de son appartenance au
 * service, pas de son titre. Si l'organigramme affichait « Directeur ✓ » sur la
 * foi d'un badge posé par un collègue, le badge mentirait — et c'est exactement
 * le genre de mensonge qui ruine la confiance dans un annuaire professionnel.
 */
@Injectable()
export class OrganisationService {
  constructor(private readonly prisma: PrismaService) {}

  private async membreCourant(account: RequestAccount, user: RequestUser): Promise<MembreCourant> {
    const brut = await this.prisma.membership.findFirst({
      where: { userId: user.id, accountId: account.id },
      select: SELECT_MEMBRE,
    });
    if (!brut) throw new ForbiddenException("Vous n'êtes pas membre de ce compte.");
    return versMembreCourant(brut);
  }

  // -------------------------------------------------------------------------
  // MOI
  // -------------------------------------------------------------------------

  /** Ma fiche dans cet établissement : ce que je suis, et ce que je peux. */
  async moi(account: RequestAccount, user: RequestUser) {
    const membership = await this.prisma.membership.findFirst({
      where: { userId: user.id, accountId: account.id },
      include: {
        services: { include: { orgUnit: { select: { id: true, name: true } } } },
        verifiePar: { select: { firstName: true, lastName: true } },
        demandesNiveau: true,
        account: {
          select: {
            id: true,
            name: true,
            city: true,
            structure: { select: { id: true, nom: true, verifiee: true } },
          },
        },
      },
    });
    if (!membership) throw new ForbiddenException("Vous n'êtes pas membre de ce compte.");

    const membre = versMembreCourant({
      id: membership.id,
      accountId: membership.accountId,
      userId: membership.userId,
      niveau: membership.niveau,
      niveauValide: membership.niveauValide,
      capacites: membership.capacites,
      services: membership.services.map((s) => ({ orgUnitId: s.orgUnitId, portee: s.portee })),
    });

    return {
      id: membership.id,
      etablissement: membership.account,
      poste: membership.poste,
      cadre: membership.cadre,
      niveau: membership.niveau,
      niveauValide: membership.niveauValide,
      verifie: membership.verifie,
      origineVerification: membership.origineVerification,
      verifiePar: membership.verifiePar,
      verifieLe: membership.verifieLe,
      masqueOrganigramme: membership.masqueOrganigramme,
      capacites: capacitesEffectives(membre),
      capacitesAccordees: membership.capacites,
      services: membership.services.map((s) => ({
        id: s.orgUnit.id,
        nom: s.orgUnit.name,
        portee: s.portee,
      })),
      demandeNiveau: membership.demandesNiveau[0] ?? null,
    };
  }

  /**
   * Déclarer son poste et son niveau.
   *
   * Déclarer RESPONSABLE ne demande l'autorisation de personne : le périmètre
   * d'un responsable est celui qu'il constitue lui-même, par invitation, et il
   * n'ouvre donc rien qu'on ne lui ait donné. Déclarer DIRECTION crée une
   * DEMANDE, parce que la Direction est le seul niveau qui voie des équipes
   * constituées par d'autres.
   */
  async declarer(account: RequestAccount, user: RequestUser, dto: DeclarerPosteDto) {
    const membership = await this.prisma.membership.findFirst({
      where: { userId: user.id, accountId: account.id },
      select: { id: true, niveau: true, niveauValide: true },
    });
    if (!membership) throw new ForbiddenException("Vous n'êtes pas membre de ce compte.");

    const niveau = dto.niveau ?? membership.niveau;
    const demandeDirection =
      niveau === NiveauResponsabilite.DIRECTION && !membership.niveauValide;

    const majNiveau = demandeDirection
      ? // La déclaration est enregistrée, mais elle ne vaut RIEN tant qu'elle
        // n'est pas validée : niveauValide reste faux, donc le périmètre reste
        // celui d'un salarié. C'est tout le garde-fou du modèle ouvert.
        { niveau, niveauValide: false }
      : { niveau, ...(niveau === membership.niveau ? {} : { niveauValide: niveau !== NiveauResponsabilite.DIRECTION }) };

    const maj = await this.prisma.membership.update({
      where: { id: membership.id },
      data: {
        poste: dto.poste ?? undefined,
        cadre: dto.cadre ?? undefined,
        // Déclaration de ce que la personne peut engager. Elle se l'accorde
        // elle-même — voir la note du DTO : c'est la traçabilité sur les
        // documents émis qui tient le dispositif, pas un contrôle à l'entrée.
        ...(dto.capacites ? { capacites: dto.capacites } : {}),
        ...majNiveau,
        role: ROLE_PAR_NIVEAU[niveau === NiveauResponsabilite.DIRECTION && !membership.niveauValide ? NiveauResponsabilite.SALARIE : niveau],
      },
      select: { id: true, poste: true, cadre: true, niveau: true, niveauValide: true },
    });

    if (demandeDirection) {
      await this.prisma.demandeNiveau.upsert({
        where: { membershipId: membership.id },
        create: {
          membershipId: membership.id,
          niveauDemande: NiveauResponsabilite.DIRECTION,
          justification: dto.justification ?? null,
        },
        update: {
          niveauDemande: NiveauResponsabilite.DIRECTION,
          justification: dto.justification ?? null,
          statut: StatutDemande.EN_ATTENTE,
          decideParId: null,
          decideLe: null,
          motifRefus: null,
        },
      });
    }

    return { ...maj, demandeDirectionEnvoyee: demandeDirection };
  }

  /**
   * Se retirer de l'organigramme — sans rien perdre du reste du produit.
   *
   * Certaines personnes ont de vraies raisons de ne pas figurer dans un
   * annuaire professionnel. Une seule mauvaise histoire sur ce sujet coûte plus
   * cher que quelques absents dans l'arborescence.
   */
  async visibilite(account: RequestAccount, user: RequestUser, dto: VisibiliteDto) {
    const membership = await this.prisma.membership.findFirst({
      where: { userId: user.id, accountId: account.id },
      select: { id: true },
    });
    if (!membership) throw new ForbiddenException("Vous n'êtes pas membre de ce compte.");
    return this.prisma.membership.update({
      where: { id: membership.id },
      data: { masqueOrganigramme: dto.masque },
      select: { id: true, masqueOrganigramme: true },
    });
  }

  /**
   * SE DÉCLARER D'UN ÉTABLISSEMENT DÉJÀ PRÉSENT — « comme sur LinkedIn ».
   *
   * Sans cette route, chaque salarié d'une même MECS créerait son propre compte
   * « MECS Les Tilleuls » : douze établissements homonymes, douze organigrammes
   * d'une personne, et personne qui se voit. C'est le doublon de service, mais
   * un cran au-dessus et bien plus coûteux.
   *
   * ⚠ LA DÉCLARATION RATTACHE DE FAIT, ET NE DONNE RIEN. Le rattachement est
   * créé immédiatement — la personne apparaît dans l'organigramme, elle n'est
   * plus seule — mais `verifie` est FAUX, le niveau est SALARIE et son
   * périmètre se limite à elle-même. Elle ne voit aucune donnée de
   * l'établissement tant qu'un responsable ne l'a pas vérifiée. C'est la même
   * règle que partout : déclarer ne donne rien, c'est l'invitation ou la
   * vérification qui ouvre.
   */
  async rejoindreEtablissement(
    user: RequestUser,
    etablissementId: string,
    message?: string,
  ) {
    const etablissement = await this.prisma.account.findFirst({
      where: { id: etablissementId, type: 'ESTABLISHMENT' },
      select: { id: true, name: true },
    });
    if (!etablissement) throw new NotFoundException('Établissement introuvable.');

    const existant = await this.prisma.membership.findUnique({
      where: { userId_accountId: { userId: user.id, accountId: etablissement.id } },
      select: { id: true, verifie: true },
    });
    if (existant) return { membershipId: existant.id, deja: true };

    const membership = await this.prisma.membership.create({
      data: {
        userId: user.id,
        accountId: etablissement.id,
        role: AccountRole.MEMBER,
        status: MembershipStatus.ACTIVE,
        niveau: NiveauResponsabilite.SALARIE,
        niveauValide: true,
        // NON VÉRIFIÉ : personne n'a encore attesté que cette personne
        // travaille bien ici. L'organigramme l'affichera avec cette réserve.
        verifie: false,
      },
      select: { id: true },
    });

    // On prévient ceux qui peuvent vérifier — sinon la personne reste
    // indéfiniment « non vérifiée » sans que quiconque sache qu'il faut agir.
    const responsables = await this.prisma.membership.findMany({
      where: {
        accountId: etablissement.id,
        status: MembershipStatus.ACTIVE,
        niveau: { in: [NiveauResponsabilite.DIRECTION, NiveauResponsabilite.RESPONSABLE] },
        NOT: { id: membership.id },
      },
      select: { userId: true },
      take: 20,
    });
    if (responsables.length > 0) {
      const nom = [user.email].filter(Boolean).join('');
      await this.prisma.notification
        .createMany({
          data: responsables.map((r) => ({
            userId: r.userId,
            type: 'ORGANISATION',
            title: 'Une personne s’est déclarée de votre établissement',
            body:
              `${nom} indique travailler à ${etablissement.name}. ` +
              `Confirmez son rattachement pour qu’elle rejoigne son service.` +
              (message ? ` Message : ${message}` : ''),
            link: '/dashboard/organigramme',
          })),
        })
        .catch(() => undefined);
    }

    return { membershipId: membership.id, deja: false };
  }

  // -------------------------------------------------------------------------
  // LES AUTRES — dans la limite de son périmètre
  // -------------------------------------------------------------------------

  /** Charge un membre du compte en vérifiant qu'il entre dans mon périmètre. */
  private async membreVisible(membre: MembreCourant, membershipId: string) {
    const cible = await this.prisma.membership.findFirst({
      where: { id: membershipId, ...filtreMembresVisibles(membre) },
      select: {
        id: true,
        userId: true,
        niveau: true,
        niveauValide: true,
        capacites: true,
        parrainMembershipId: true,
        services: { select: { orgUnitId: true, portee: true } },
      },
    });
    if (!cible) {
      throw new NotFoundException(
        "Cette personne n'est pas dans votre périmètre, ou n'existe pas.",
      );
    }
    return cible;
  }

  /** Changer le niveau de quelqu'un, sans jamais dépasser le sien. */
  async changerNiveau(
    account: RequestAccount,
    user: RequestUser,
    membershipId: string,
    dto: ChangerNiveauDto,
  ) {
    const membre = await this.membreCourant(account, user);
    const cible = await this.membreVisible(membre, membershipId);

    if (cible.id === membre.id) {
      throw new BadRequestException(
        'Pour changer votre propre niveau, passez par la déclaration de poste.',
      );
    }

    const niveau = niveauDelegable(membre, dto.niveau);
    if (niveau !== dto.niveau) {
      throw new ForbiddenException('Vous ne pouvez pas accorder un niveau supérieur au vôtre.');
    }
    // Seule une Direction validée peut valider une Direction : c'est ce qui
    // permet à une directrice de nommer son adjoint, et de transmettre avant de
    // partir — sans quoi un établissement se retrouverait sans personne pour
    // valider quiconque.
    const niveauValide =
      niveau === NiveauResponsabilite.DIRECTION ? estDirection(membre) : true;

    return this.prisma.membership.update({
      where: { id: cible.id },
      data: {
        niveau,
        niveauValide,
        role: ROLE_PAR_NIVEAU[niveau],
        ...(dto.poste !== undefined ? { poste: dto.poste } : {}),
        ...(dto.cadre !== undefined ? { cadre: dto.cadre } : {}),
      },
      select: { id: true, niveau: true, niveauValide: true, poste: true, cadre: true },
    });
  }

  /** Accorder ou retirer des droits à l'unité. On ne donne que ce qu'on a. */
  async accorderCapacites(
    account: RequestAccount,
    user: RequestUser,
    membershipId: string,
    dto: AccorderCapacitesDto,
  ) {
    const membre = await this.membreCourant(account, user);
    const cible = await this.membreVisible(membre, membershipId);

    const accordables = capacitesDelegables(membre, dto.capacites);
    const refusees = dto.capacites.filter((c) => !accordables.includes(c));
    if (refusees.length > 0) {
      throw new ForbiddenException(
        `Vous ne détenez pas vous-même ce droit : ${refusees.join(', ')}.`,
      );
    }

    return this.prisma.membership.update({
      where: { id: cible.id },
      data: { capacites: accordables },
      select: { id: true, capacites: true },
    });
  }

  /**
   * VÉRIFIER UN RATTACHEMENT — pas un titre.
   *
   * Sert au cas où quelqu'un s'est déclaré seul (sans invitation) et qu'un
   * responsable confirme qu'il est bien de la maison.
   */
  async verifierRattachement(
    account: RequestAccount,
    user: RequestUser,
    membershipId: string,
  ) {
    const membre = await this.membreCourant(account, user);
    const cible = await this.membreVisible(membre, membershipId);

    const origine = estDirection(membre)
      ? OrigineVerification.DIRECTION
      : OrigineVerification.RESPONSABLE;

    return this.prisma.membership.update({
      where: { id: cible.id },
      data: {
        verifie: true,
        origineVerification: origine,
        verifieParId: user.id,
        verifieLe: new Date(),
        // Le parrainage n'est posé que s'il manquait : celui qui a fait venir
        // quelqu'un le premier garde ce lien.
        ...(cible.parrainMembershipId ? {} : { parrainMembershipId: membre.id }),
      },
      select: { id: true, verifie: true, origineVerification: true, verifieLe: true },
    });
  }

  /**
   * Retirer quelqu'un d'un service.
   *
   * ⚠ On ne supprime jamais le Membership : la personne garde son compte et son
   * historique. On coupe le rattachement, donc la visibilité pour la suite.
   */
  async retirerDuService(
    account: RequestAccount,
    user: RequestUser,
    membershipId: string,
    orgUnitId: string,
  ) {
    const membre = await this.membreCourant(account, user);
    const cible = await this.membreVisible(membre, membershipId);
    if (!peutPiloterService(membre, orgUnitId)) {
      throw new ForbiddenException("Ce service n'est pas dans votre périmètre.");
    }
    await this.prisma.membershipService.deleteMany({
      where: { membershipId: cible.id, orgUnitId },
    });
    await this.prisma.membership.updateMany({
      where: { id: cible.id, orgUnitId },
      data: { orgUnitId: null },
    });
    return { retire: true };
  }

  // -------------------------------------------------------------------------
  // DEMANDES DE NIVEAU — le seul passage par Les Extras
  // -------------------------------------------------------------------------

  async demanderNiveau(account: RequestAccount, user: RequestUser, dto: DemanderNiveauDto) {
    const membership = await this.prisma.membership.findFirst({
      where: { userId: user.id, accountId: account.id },
      select: { id: true, niveauValide: true, niveau: true },
    });
    if (!membership) throw new ForbiddenException("Vous n'êtes pas membre de ce compte.");
    if (membership.niveau === NiveauResponsabilite.DIRECTION && membership.niveauValide) {
      throw new BadRequestException('Vous êtes déjà direction validée de cet établissement.');
    }

    return this.prisma.demandeNiveau.upsert({
      where: { membershipId: membership.id },
      create: {
        membershipId: membership.id,
        niveauDemande: NiveauResponsabilite.DIRECTION,
        justification: dto.justification ?? null,
      },
      update: {
        niveauDemande: NiveauResponsabilite.DIRECTION,
        justification: dto.justification ?? null,
        statut: StatutDemande.EN_ATTENTE,
        decideParId: null,
        decideLe: null,
        motifRefus: null,
      },
    });
  }

  /**
   * Les demandes de Direction en attente, pour Les Extras.
   *
   * Tout est pré-rempli — structure, établissement, poste, cadre, courriel
   * professionnel, ancienneté du compte — pour que la décision tienne en un
   * clic. C'est la seule validation manuelle du modèle : si elle prend un
   * échange de courriels, elle devient un travail quotidien et le produit
   * bloque là.
   */
  async demandesEnAttente() {
    const demandes = await this.prisma.demandeNiveau.findMany({
      where: { statut: StatutDemande.EN_ATTENTE },
      orderBy: { createdAt: 'asc' },
      include: {
        membership: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                emailVerified: true,
                createdAt: true,
              },
            },
            account: {
              select: {
                id: true,
                name: true,
                city: true,
                siret: true,
                structure: true,
                _count: { select: { memberships: true } },
              },
            },
            services: { include: { orgUnit: { select: { id: true, name: true } } } },
          },
        },
      },
    });

    return demandes.map((d) => {
      const domaineCourriel = d.membership.user.email.split('@')[1] ?? '';
      return {
        id: d.id,
        createdAt: d.createdAt,
        justification: d.justification,
        personne: d.membership.user,
        poste: d.membership.poste,
        cadre: d.membership.cadre,
        etablissement: d.membership.account,
        services: d.membership.services.map((s) => ({
          id: s.orgUnit.id,
          nom: s.orgUnit.name,
          portee: s.portee,
        })),
        /** Indices de sérieux, affichés à l'écran pour éclairer la décision. */
        indices: {
          courrielVerifie: d.membership.user.emailVerified,
          domaineCourriel,
          courrielGrandPublic: [
            'gmail.com', 'hotmail.fr', 'hotmail.com', 'outlook.fr', 'outlook.com',
            'yahoo.fr', 'orange.fr', 'free.fr', 'sfr.fr', 'laposte.net', 'wanadoo.fr',
          ].includes(domaineCourriel.toLowerCase()),
          membresDejaDansLEtablissement: d.membership.account._count.memberships,
          structureRenseignee: Boolean(d.membership.account.structure),
        },
      };
    });
  }

  /**
   * Trancher une demande de Direction (Les Extras).
   *
   * ⚠ Accepter, c'est ouvrir à cette personne la vue sur des équipes qu'elle
   * n'a pas constituées. Les salariés concernés doivent le savoir : c'est le
   * rôle de la notification posée ici — pas d'une ligne dans des CGU.
   */
  async deciderDemande(
    decideurId: string,
    id: string,
    accepter: boolean,
    motifRefus?: string,
  ) {
    const demande = await this.prisma.demandeNiveau.findUnique({
      where: { id },
      include: { membership: { select: { id: true, accountId: true, userId: true } } },
    });
    if (!demande) throw new NotFoundException('Demande introuvable.');
    if (demande.statut !== StatutDemande.EN_ATTENTE) {
      throw new BadRequestException('Cette demande a déjà été tranchée.');
    }

    if (!accepter) {
      return this.prisma.demandeNiveau.update({
        where: { id },
        data: {
          statut: StatutDemande.REFUSEE,
          decideParId: decideurId,
          decideLe: new Date(),
          motifRefus: motifRefus ?? null,
        },
      });
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.membership.update({
        where: { id: demande.membership.id },
        data: {
          niveau: NiveauResponsabilite.DIRECTION,
          niveauValide: true,
          role: AccountRole.ADMIN,
          verifie: true,
          origineVerification: OrigineVerification.LES_EXTRAS,
          verifieParId: decideurId,
          verifieLe: new Date(),
        },
      });

      // TRANSPARENCE. Les personnes déjà rattachées à cet établissement
      // apprennent que leur direction voit désormais leurs demandes. C'est une
      // obligation d'information, et c'est aussi ce qui rend le dispositif
      // acceptable en interne : personne ne découvre après coup.
      const autres = await tx.membership.findMany({
        where: {
          accountId: demande.membership.accountId,
          status: MembershipStatus.ACTIVE,
          NOT: { id: demande.membership.id },
        },
        select: { userId: true },
      });
      if (autres.length > 0) {
        await tx.notification.createMany({
          data: autres.map((m) => ({
            userId: m.userId,
            type: 'ORGANISATION',
            title: 'La direction de votre établissement a rejoint la plateforme',
            body:
              'Elle voit désormais les demandes de devis, réservations et inscriptions ' +
              'faites au nom de l’établissement par les comptes qui y sont rattachés. ' +
              'Vos échanges privés et vos données personnelles restent les vôtres.',
          })),
          skipDuplicates: true,
        });
      }

      return tx.demandeNiveau.update({
        where: { id },
        data: {
          statut: StatutDemande.ACCEPTEE,
          decideParId: decideurId,
          decideLe: new Date(),
        },
      });
    });
  }

  // -------------------------------------------------------------------------
  // ORGANIGRAMME
  // -------------------------------------------------------------------------

  /**
   * L'ORGANIGRAMME DE L'ÉTABLISSEMENT.
   *
   * ⚠ L'ARBORESCENCE EST VISIBLE PAR TOUS LES RATTACHÉS, LES NOMS NE LE SONT
   * PAS. Structure → établissement → services → effectifs : tout le monde le
   * voit, et c'est ce qui donne une raison de se déclarer. Les NOMS
   * n'apparaissent que dans le périmètre de qui regarde. Un organigramme qui
   * ne se peuplerait que pour la Direction n'aurait aucune valeur le premier
   * jour, et personne ne le remplirait.
   *
   * Deux marques distinctes sur chaque personne, et il ne faut pas les fondre :
   *   — `rattachementVerifie` : cette personne est bien dans ce service.
   *   — `niveauValide` : son titre a été confirmé par qui pouvait le faire.
   */
  async organigramme(account: RequestAccount, user: RequestUser) {
    const membre = await this.membreCourant(account, user);

    const [etablissement, services, membresVisibles, effectifs] = await Promise.all([
      this.prisma.account.findUniqueOrThrow({
        where: { id: account.id },
        select: {
          id: true,
          name: true,
          city: true,
          logoUrl: true,
          structure: {
            select: { id: true, nom: true, formeJuridique: true, ville: true, verifiee: true },
          },
        },
      }),
      this.prisma.orgUnit.findMany({
        where: { accountId: account.id, archiveLe: null },
        orderBy: { name: 'asc' },
        select: { id: true, name: true, description: true },
      }),
      this.prisma.membership.findMany({
        where: {
          ...filtreMembresVisibles(membre),
          status: MembershipStatus.ACTIVE,
          masqueOrganigramme: false,
        },
        select: {
          id: true,
          niveau: true,
          niveauValide: true,
          poste: true,
          cadre: true,
          verifie: true,
          origineVerification: true,
          orgUnitId: true,
          user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
          services: { select: { orgUnitId: true, portee: true } },
        },
      }),
      // Les effectifs, eux, sont comptés sur TOUT l'établissement : un nombre
      // ne désigne personne, et c'est lui qui montre à un nouvel arrivant que
      // ses collègues sont déjà là.
      this.prisma.membershipService.groupBy({
        by: ['orgUnitId'],
        where: {
          portee: PorteeService.RATTACHEMENT,
          membership: { accountId: account.id, status: MembershipStatus.ACTIVE },
        },
        _count: { _all: true },
      }),
    ]);

    const compteParService = new Map(effectifs.map((e) => [e.orgUnitId, e._count._all]));

    const personne = (m: (typeof membresVisibles)[number]) => ({
      membershipId: m.id,
      userId: m.user.id,
      nom: [m.user.firstName, m.user.lastName].filter(Boolean).join(' ').trim() || 'Sans nom',
      avatarUrl: m.user.avatarUrl,
      poste: m.poste,
      cadre: m.cadre,
      niveau: m.niveau,
      /** Le TITRE est-il confirmé ? */
      niveauValide: m.niveauValide,
      /** L'APPARTENANCE au service est-elle attestée ? Rien de plus. */
      rattachementVerifie: m.verifie,
      origineVerification: m.origineVerification,
      encadre: m.services
        .filter((s) => s.portee === PorteeService.ENCADREMENT)
        .map((s) => s.orgUnitId),
    });

    const membresParService = new Map<string, ReturnType<typeof personne>[]>();
    const sansService: ReturnType<typeof personne>[] = [];
    const direction: ReturnType<typeof personne>[] = [];

    for (const m of membresVisibles) {
      const p = personne(m);
      if (m.niveau === NiveauResponsabilite.DIRECTION && m.niveauValide) {
        direction.push(p);
        continue;
      }
      const rattachements = m.services
        .filter((s) => s.portee === PorteeService.RATTACHEMENT)
        .map((s) => s.orgUnitId);
      const cibles = rattachements.length > 0 ? rattachements : m.orgUnitId ? [m.orgUnitId] : [];
      if (cibles.length === 0) {
        sansService.push(p);
        continue;
      }
      // Une personne rattachée à deux services apparaît aux deux endroits —
      // c'est le comportement correct, et l'écran le signale plutôt que de la
      // dupliquer en silence.
      for (const id of cibles) {
        const liste = membresParService.get(id) ?? [];
        liste.push(p);
        membresParService.set(id, liste);
      }
    }

    // LES COLLÈGUES DU NOUVEAU MODÈLE (23/09/2026) : un compte = une personne.
    // Les autres personnes de la même structure ne sont plus des rattachements
    // de CE compte, ce sont d'autres comptes qui ont déclaré le même SIRET.
    // On les liste ici, avec le poste qu'elles ont déclaré — une information,
    // aucun droit.
    const collegues = etablissement.structure
      ? (
          await this.prisma.account.findMany({
            where: {
              structureId: etablissement.structure.id,
              id: { not: account.id },
              archivedAt: null,
            },
            select: {
              id: true,
              memberships: {
                where: { role: AccountRole.OWNER, status: MembershipStatus.ACTIVE, masqueOrganigramme: false },
                take: 1,
                select: {
                  id: true,
                  poste: true,
                  cadre: true,
                  user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
                },
              },
            },
          })
        )
          .flatMap((a) => a.memberships)
          .map((m) => ({
            membershipId: m.id,
            userId: m.user.id,
            nom: [m.user.firstName, m.user.lastName].filter(Boolean).join(' ').trim() || 'Sans nom',
            avatarUrl: m.user.avatarUrl,
            poste: m.poste,
            cadre: m.cadre,
            niveau: NiveauResponsabilite.SALARIE,
            niveauValide: false,
            rattachementVerifie: false,
            origineVerification: null,
            encadre: [] as string[],
            /** Compte distinct : sa fiche interne n'est pas consultable d'ici. */
            compteSepare: true,
          }))
      : [];

    return {
      structure: etablissement.structure,
      etablissement: {
        id: etablissement.id,
        nom: etablissement.name,
        ville: etablissement.city,
        logoUrl: etablissement.logoUrl,
      },
      direction,
      services: services.map((s) => {
        const visibles = membresParService.get(s.id) ?? [];
        const total = compteParService.get(s.id) ?? 0;
        return {
          id: s.id,
          nom: s.name,
          description: s.description,
          /** Nombre réel de personnes rattachées — visible par tous. */
          effectif: total,
          /** Les noms, eux, sont bornés au périmètre de qui regarde. */
          membres: visibles,
          encadrants: visibles.filter((m) => m.encadre.includes(s.id)),
          /** Combien de personnes existent sans que je puisse les nommer. */
          masques: Math.max(0, total - visibles.length),
        };
      }),
      sansService,
      collegues,
      /** Ce que je vois, et pourquoi — affiché en clair en tête de l'écran. */
      perimetre: {
        niveau: membre.niveau,
        niveauValide: membre.niveauValide,
        complet: estDirection(membre),
        servicesEncadres: membre.servicesEncadres,
      },
    };
  }

  /** L'équipe visible, à plat — sert aux écrans de gestion. */
  async equipe(account: RequestAccount, user: RequestUser) {
    const membre = await this.membreCourant(account, user);
    const membres = await this.prisma.membership.findMany({
      where: { ...filtreMembresVisibles(membre), status: MembershipStatus.ACTIVE },
      orderBy: [{ niveau: 'asc' }, { createdAt: 'asc' }],
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true } },
        services: { include: { orgUnit: { select: { id: true, name: true } } } },
      },
    });

    return membres.map((m) => ({
      id: m.id,
      personne: m.user,
      poste: m.poste,
      cadre: m.cadre,
      niveau: m.niveau,
      niveauValide: m.niveauValide,
      rattachementVerifie: m.verifie,
      origineVerification: m.origineVerification,
      capacitesAccordees: m.capacites,
      capacites: capacitesEffectives(
        versMembreCourant({
          id: m.id,
          accountId: m.accountId,
          userId: m.userId,
          niveau: m.niveau,
          niveauValide: m.niveauValide,
          capacites: m.capacites,
          services: m.services.map((s) => ({ orgUnitId: s.orgUnitId, portee: s.portee })),
        }),
      ),
      services: m.services.map((s) => ({ id: s.orgUnit.id, nom: s.orgUnit.name, portee: s.portee })),
      jeLAiFaitVenir: m.parrainMembershipId === membre.id,
    }));
  }

  /** Les droits que JE peux déléguer — sert à n'afficher que ceux-là. */
  async capacitesDelegablesParMoi(account: RequestAccount, user: RequestUser) {
    const membre = await this.membreCourant(account, user);
    return {
      miennes: capacitesEffectives(membre),
      toutes: Object.values(Capacite),
      niveauxDelegables: Object.values(NiveauResponsabilite).filter(
        (n) => niveauDelegable(membre, n) === n,
      ),
    };
  }
}
