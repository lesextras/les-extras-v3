import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, ServiceStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { DEPARTEMENTS, nomsDepartements } from '../common/territoires';

/**
 * LES ALERTES DE RECHERCHE.
 *
 * ⚠ C'EST LA MÉCANIQUE DE RÉTENTION QUI MANQUAIT. Un directeur cherche
 * « médiation animale, Essonne », ne trouve rien, et il est perdu
 * définitivement : personne ne revient vérifier un catalogue chaque semaine.
 * Avec une alerte, c'est la plateforme qui revient vers lui le jour où la fiche
 * existe. Sur une place de marché jeune, dont le catalogue compte dix-sept
 * fiches, c'est le seul moyen de ne pas gâcher une visite qui ne trouve rien.
 *
 * ⚠ RÉSERVÉ AUX PERSONNES CONNECTÉES, ET C'EST UN CHOIX. Une alerte ouverte
 * aux visiteurs anonymes demanderait un double opt-in, une page de
 * désabonnement autonome et une modération des adresses saisies : trois
 * chantiers pour capter un peu plus haut dans l'entonnoir. Un compte existe
 * déjà, son adresse est vérifiée, et il porte le lien de désabonnement de
 * l'application. On commence là.
 */
@Injectable()
export class AlertesService {
  constructor(private readonly prisma: PrismaService) {}

  /** Ne garde que les codes du référentiel : un code inconnu ne filtre rien. */
  private codesValides(codes?: string[] | null): string[] {
    if (!codes?.length) return [];
    const connus = new Set(DEPARTEMENTS.map((d) => d.code));
    return [...new Set(codes.filter((c) => connus.has(c)))].sort();
  }

  /**
   * Le `where` Prisma correspondant à une alerte.
   *
   * Partagé entre la création (pour compter ce qui existe déjà) et le
   * planificateur (pour trouver les nouveautés) : deux définitions du même
   * filtre finiraient par diverger, et la personne recevrait des fiches qui ne
   * correspondent pas à ce qu'on lui a montré à l'inscription.
   */
  private critères(a: {
    type: string;
    departements: string[];
    categorie?: string | null;
    publicVise?: string | null;
    recherche?: string | null;
    budgetMax?: Prisma.Decimal | null;
  }): Prisma.ServiceWhereInput {
    const where: Prisma.ServiceWhereInput = { status: ServiceStatus.PUBLISHED };
    if (a.departements.length) where.departements = { hasSome: a.departements };
    if (a.categorie) where.categoryRef = { is: { title: a.categorie } };
    if (a.publicVise) where.publicTargets = { has: a.publicVise };
    if (a.budgetMax != null) where.price = { lte: a.budgetMax };
    if (a.recherche) {
      where.OR = [
        { title: { contains: a.recherche, mode: 'insensitive' } },
        { description: { contains: a.recherche, mode: 'insensitive' } },
      ];
    }
    return where;
  }

  /** Ce que l'alerte surveille, en une phrase lisible par son auteur. */
  static resume(a: {
    departements: string[];
    categorie?: string | null;
    publicVise?: string | null;
    recherche?: string | null;
    budgetMax?: Prisma.Decimal | number | null;
  }): string {
    const bouts: string[] = [];
    if (a.recherche) bouts.push(`« ${a.recherche} »`);
    if (a.categorie) bouts.push(a.categorie);
    if (a.publicVise) bouts.push(`public : ${a.publicVise}`);
    if (a.departements.length) {
      const noms = nomsDepartements(a.departements);
      bouts.push(noms.length <= 3 ? noms.join(', ') : `${noms.slice(0, 2).join(', ')} +${noms.length - 2}`);
    } else {
      bouts.push('partout');
    }
    if (a.budgetMax != null) bouts.push(`jusqu'à ${Number(a.budgetMax)} €`);
    return bouts.join(' · ');
  }

  async creer(
    userId: string,
    accountId: string | undefined,
    dto: {
      type?: string;
      departements?: string[];
      categorie?: string;
      publicVise?: string;
      recherche?: string;
      budgetMax?: number;
    },
  ) {
    const departements = this.codesValides(dto.departements);
    const alerte = await this.prisma.alerteRecherche.create({
      data: {
        userId,
        accountId: accountId ?? null,
        type: ['atelier', 'formation', 'all'].includes(dto.type ?? '') ? dto.type! : 'all',
        departements,
        categorie: dto.categorie?.trim() || null,
        publicVise: dto.publicVise?.trim() || null,
        recherche: dto.recherche?.trim() || null,
        budgetMax: dto.budgetMax ?? null,
      },
    });

    // On dit tout de suite combien de fiches correspondent DÉJÀ. Une alerte
    // créée sur un critère qui rend trente résultats n'est pas une alerte,
    // c'est une recherche : mieux vaut le dire que de laisser la personne
    // attendre un courriel qui n'apportera rien de neuf.
    const dejaLa = await this.prisma.service.count({ where: this.critères(alerte) });
    return { ...alerte, dejaLa, resume: AlertesService.resume(alerte) };
  }

  async mesAlertes(userId: string) {
    const alertes = await this.prisma.alerteRecherche.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return alertes.map((a) => ({ ...a, resume: AlertesService.resume(a) }));
  }

  async basculer(userId: string, id: string) {
    const a = await this.prisma.alerteRecherche.findFirst({ where: { id, userId } });
    if (!a) throw new NotFoundException('Alerte introuvable.');
    return this.prisma.alerteRecherche.update({
      where: { id },
      data: { actif: !a.actif },
    });
  }

  async supprimer(userId: string, id: string) {
    const a = await this.prisma.alerteRecherche.findFirst({ where: { id, userId } });
    if (!a) throw new NotFoundException('Alerte introuvable.');
    await this.prisma.alerteRecherche.delete({ where: { id } });
    return { deleted: true };
  }

  /**
   * Les nouveautés à signaler pour une alerte donnée.
   *
   * ⚠ LA BORNE EST `dernierEnvoiAt`, PAS LA DATE DE CRÉATION DE L'ALERTE. Sans
   * elle, chaque passage renverrait les mêmes fiches indéfiniment, et l'alerte
   * deviendrait le courriel qu'on met en filtre. Au premier passage, la borne
   * est la création de l'alerte : on ne signale jamais comme « nouveau » ce qui
   * existait déjà quand la personne l'a posée.
   */
  async nouveautes(alerteId: string, limite = 5) {
    const a = await this.prisma.alerteRecherche.findUnique({ where: { id: alerteId } });
    if (!a) return [];
    const depuis = a.dernierEnvoiAt ?? a.createdAt;
    return this.prisma.service.findMany({
      where: { ...this.critères(a), createdAt: { gt: depuis } },
      orderBy: { createdAt: 'desc' },
      take: limite,
      select: { id: true, slug: true, title: true, city: true, departements: true, price: true },
    });
  }
}
