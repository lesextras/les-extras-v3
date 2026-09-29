import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { AccountType, type Academie } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * LE CONTEXTE COMMUN DE L'ADMINISTRATION : « à qui appartient cette session ? »
 *
 * Toutes les routes de l'administration passent par ici. Une session est à
 * l'académie qui porte son PROGRAMME (`Formation.ownerAccountId`) : c'est la
 * seule règle d'accès, et elle est écrite une fois.
 */
@Injectable()
export class ContexteGestion {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  /** La fiche de l'académie (identité imprimée sur les documents). */
  async academie(accountId: string): Promise<Academie> {
    const compte = await this.prisma.account.findUnique({
      where: { id: accountId },
      select: { id: true, type: true, name: true, academie: true },
    });
    if (!compte) throw new NotFoundException('Compte introuvable.');
    if (compte.type !== AccountType.ACADEMIE) {
      throw new ForbiddenException("L'administration des sessions est réservée aux comptes académie.");
    }
    if (compte.academie) return compte.academie;
    return this.prisma.academie.create({ data: { accountId: compte.id, nom: compte.name } });
  }

  /** La session, si elle appartient à cette académie. */
  async session(accountId: string, sessionId: string) {
    await this.academie(accountId);
    const session = await this.prisma.formationSession.findUnique({
      where: { id: sessionId },
      include: { formation: true },
    });
    if (!session) throw new NotFoundException('Session introuvable.');
    if (session.formation.ownerAccountId !== accountId) {
      throw new ForbiddenException("Cette session n'appartient pas à ton académie.");
    }
    return session;
  }

  /** L'inscription, si sa session appartient à cette académie. */
  async inscription(accountId: string, inscriptionId: string) {
    const inscription = await this.prisma.inscription.findUnique({
      where: { id: inscriptionId },
      include: { session: { include: { formation: true } } },
    });
    if (!inscription) throw new NotFoundException('Inscription introuvable.');
    if (inscription.session.formation.ownerAccountId !== accountId) {
      throw new ForbiddenException("Cette inscription n'appartient pas à ton académie.");
    }
    return inscription;
  }

  /** Le nom et la couleur sous lesquels l'académie écrit (e-mails). */
  async marque(accountId: string): Promise<{ nom: string; couleur: string | null; contactEmail: string | null }> {
    const [academie, ecole] = await Promise.all([
      this.prisma.academie.findUnique({ where: { accountId }, select: { nom: true, courriel: true } }),
      this.prisma.ecoleEnLigne.findUnique({ where: { accountId }, select: { nom: true, couleur: true, contactEmail: true } }),
    ]);
    return {
      nom: academie?.nom ?? ecole?.nom ?? 'Votre organisme de formation',
      couleur: ecole?.couleur ?? null,
      contactEmail: academie?.courriel ?? ecole?.contactEmail ?? null,
    };
  }

  /** L'adresse publique de Pilote, où vivent les liens des stagiaires. */
  get urlPilote(): string {
    return (this.config.get<string>('PILOTE_WEB_URL') || 'https://pilote.toulali.fr').replace(/\/$/, '');
  }
}
