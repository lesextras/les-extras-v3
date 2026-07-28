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
    const brouillon = this.pseudo.restaurer(brouillonMasque, table);

    return {
      brouillon,
      // Transparence : on montre à l'utilisateur ce qui a été protégé.
      protection: this.pseudo.resume(table),
      trame: def.id,
    };
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
