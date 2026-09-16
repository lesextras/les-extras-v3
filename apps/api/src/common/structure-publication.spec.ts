/**
 * PUBLIER DEMANDE UNE STRUCTURE — s'inscrire, non.
 *
 * ⚠ CETTE DISTINCTION EST TOUTE LA RÈGLE, ET ELLE SE DÉFAIT TRÈS FACILEMENT.
 *
 * Il est tentant d'exiger le SIRET à l'inscription : c'est plus simple à
 * écrire, et « de toute façon un intervenant en a un ». Deux populations
 * entières y perdraient leur compte :
 *
 *   — celles et ceux qui viennent faire des REMPLACEMENTS EN CDD. Un
 *     remplacement se conclut en salarié : exiger une structure leur
 *     fermerait la porte qu'on vient justement d'ouvrir pour eux.
 *   — celles et ceux qui sont en cours d'immatriculation, en portage
 *     salarial, ou dont une association facture à leur place.
 *
 * Mais une fiche PUBLIÉE est une offre de prestation : elle produit des devis,
 * des contrats et des factures, qui portent tous le SIRET de l'émetteur
 * (art. 242 nonies A, ann. II du CGI). Une fiche en ligne sans structure, ce
 * sont des documents « SIRET : Non renseigné » envoyés à des établissements
 * publics — et un intervenant qui découvre le problème une fois la mission
 * acceptée.
 *
 * ⚠ CE DÉFAUT NE LÈVE AUCUNE EXCEPTION. Tout marche : la fiche s'affiche, le
 * devis part, la facture s'imprime. Elle est simplement irrégulière.
 */
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { AccountType } from '@prisma/client';
import {
  StructureRequisePourPublierGuard,
  StructureRequiseSiPublicationGuard,
} from './guards/structure-requise.guard';
import type { PrismaService } from '../prisma/prisma.service';

function contexte(body: Record<string, unknown>, accountId = 'c1'): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => ({ body, account: { id: accountId } }) }),
  } as unknown as ExecutionContext;
}

function prismaAvec(compte: {
  type: AccountType;
  siret?: string | null;
  structure?: { siret: string | null; siren: string | null } | null;
}) {
  return {
    account: {
      findUnique: jest.fn().mockResolvedValue({
        type: compte.type,
        siret: compte.siret ?? null,
        structure: compte.structure ?? null,
      }),
    },
  } as unknown as PrismaService;
}

describe('Publier une fiche sans structure', () => {
  it('est refusé à un intervenant qui n’a rien déclaré', async () => {
    const garde = new StructureRequiseSiPublicationGuard(
      prismaAvec({ type: AccountType.FREELANCE }),
    );
    await expect(garde.canActivate(contexte({ status: 'PUBLISHED' }))).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  /** Le message nomme l'écran : un refus qui constate laisse chercher. */
  it('dit où aller le renseigner', async () => {
    const garde = new StructureRequiseSiPublicationGuard(
      prismaAvec({ type: AccountType.FREELANCE }),
    );
    await expect(garde.canActivate(contexte({ status: 'PUBLISHED' }))).rejects.toThrow(
      /structure/i,
    );
  });

  it('passe dès que le compte porte son propre SIRET', async () => {
    const garde = new StructureRequiseSiPublicationGuard(
      prismaAvec({ type: AccountType.FREELANCE, siret: '82005185200011' }),
    );
    await expect(garde.canActivate(contexte({ status: 'PUBLISHED' }))).resolves.toBe(true);
  });

  it('passe aussi quand c’est la structure déclarée qui le porte', async () => {
    const garde = new StructureRequiseSiPublicationGuard(
      prismaAvec({
        type: AccountType.FREELANCE,
        structure: { siret: '82005185200011', siren: null },
      }),
    );
    await expect(garde.canActivate(contexte({ status: 'PUBLISHED' }))).resolves.toBe(true);
  });

  /**
   * ⚠ IL NE VISE QUE LES COMPTES INTERVENANTS. Un établissement publie sous sa
   * propre raison sociale et porte déjà son SIRET ailleurs ; lui appliquer la
   * même règle bloquerait des comptes qui n'ont rien à voir avec le sujet.
   */
  it('ne s’applique pas à un établissement', async () => {
    const garde = new StructureRequiseSiPublicationGuard(
      prismaAvec({ type: AccountType.ESTABLISHMENT }),
    );
    await expect(garde.canActivate(contexte({ status: 'PUBLISHED' }))).resolves.toBe(true);
  });
});

describe('Ce qui reste ouvert sans structure', () => {
  /**
   * ⚠ CORRIGER UN BROUILLON RESTE POSSIBLE, et c'est le point entier de la
   * variante « SiPublication ». Poser le garde sur toute la route
   * interdirait de corriger une virgule tant qu'on n'a pas son numéro —
   * exactement le blocage qu'on cherche à éviter.
   */
  it('modifier un brouillon ne déclenche rien', async () => {
    const prisma = prismaAvec({ type: AccountType.FREELANCE });
    const garde = new StructureRequiseSiPublicationGuard(prisma);
    await expect(garde.canActivate(contexte({ title: 'Nouveau titre' }))).resolves.toBe(true);
    expect(prisma.account.findUnique).not.toHaveBeenCalled();
  });

  it('dépublier ou archiver non plus', async () => {
    const prisma = prismaAvec({ type: AccountType.FREELANCE });
    const garde = new StructureRequiseSiPublicationGuard(prisma);
    await expect(garde.canActivate(contexte({ status: 'ARCHIVED' }))).resolves.toBe(true);
    expect(prisma.account.findUnique).not.toHaveBeenCalled();
  });
});

describe('La variante inconditionnelle', () => {
  it('vérifie quel que soit le corps de la requête', async () => {
    const garde = new StructureRequisePourPublierGuard(
      prismaAvec({ type: AccountType.FREELANCE }),
    );
    await expect(garde.canActivate(contexte({}))).rejects.toBeInstanceOf(ForbiddenException);
  });
});
