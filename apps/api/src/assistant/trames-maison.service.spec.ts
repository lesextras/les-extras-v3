import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { AccountRole, GlobalRole, PorteeTrame } from '@prisma/client';
import { TramesMaisonService } from './trames-maison.service';
import { PseudonymiseurService } from './pseudonymiseur.service';
import { ExtractionService } from './extraction.service';

/**
 * LES TRAMES MAISON.
 *
 * Ce qu'on protège, dans l'ordre :
 *   1. Aucun nom d'enfant ne sort d'ici. La pseudonymisation passe AVANT
 *      l'appel au moteur, sans exception — c'est la condition juridique de
 *      tout l'outil, et un modèle d'écrit est le document le plus nominatif
 *      qu'un éducateur puisse déposer.
 *   2. Une trame personnelle reste personnelle : un collègue ne la voit pas,
 *      ne l'utilise pas, ne la supprime pas.
 *   3. Publier pour toute l'équipe engage l'établissement : réservé aux
 *      responsables.
 *   4. Un modèle illisible produit un message qu'on peut suivre, jamais une
 *      erreur technique.
 */

const ANALYSE = JSON.stringify({
  squelette: '- Contexte — le cadre — 2 phrases\n- Faits — la chronologie — 6 lignes',
  style: 'Première personne du pluriel, passé composé, vouvoiement.',
  extrait: "Le présent rapport couvre la période du … au ….",
});

function monter(reponseMoteur = ANALYSE) {
  const prisma: any = {
    trameMaison: {
      create: jest.fn((args: any) => Promise.resolve({ id: 't1', ...args.data })),
      findMany: jest.fn().mockResolvedValue([]),
      findFirst: jest.fn().mockResolvedValue(null),
      update: jest.fn((args: any) => Promise.resolve({ id: args.where.id, ...args.data })),
      delete: jest.fn().mockResolvedValue({ id: 't1' }),
    },
  };
  const mistral = { completer: jest.fn().mockResolvedValue(reponseMoteur) };
  const files = {
    deposer: jest.fn().mockResolvedValue({ id: 'f1' }),
    supprimer: jest.fn().mockResolvedValue({ supprime: true }),
  };
  const service = new TramesMaisonService(
    prisma,
    new PseudonymiseurService(),
    mistral as any,
    new ExtractionService(),
    files as any,
  );
  return { service, prisma, mistral, files };
}

describe('TramesMaisonService — import', () => {
  it("ne laisse AUCUN nom partir au moteur : la pseudonymisation passe avant", async () => {
    const { service, mistral } = monter();
    await service.importer('cpt', 'u1', AccountRole.MEMBER, {
      nom: 'Modèle MECS',
      texte:
        "RAPPORT DE SITUATION\nLe présent rapport concerne Kevin Martin, né le 12/03/2011, accueilli depuis septembre. Sa mère, Sarah Martin, est joignable au 06 12 34 56 78. Contexte : Kevin a intégré le groupe des grands. Faits observés : participation régulière aux activités, scolarité stabilisée depuis novembre.",
    });

    const envoye = mistral.completer.mock.calls[0][0].user as string;
    expect(envoye).not.toContain('Kevin');
    expect(envoye).not.toContain('Martin');
    expect(envoye).not.toContain('06 12 34 56 78');
    expect(envoye).toContain('[PERSONNE-');
  });

  it('enregistre le squelette et le style rendus par le moteur', async () => {
    const { service, prisma } = monter();
    await service.importer('cpt', 'u1', AccountRole.MEMBER, {
      nom: 'Modèle MECS',
      texte: 'A'.repeat(200),
    });
    const data = prisma.trameMaison.create.mock.calls[0][0].data;
    expect(data.squelette).toContain('Contexte');
    expect(data.style).toContain('vouvoiement');
    expect(data.portee).toBe(PorteeTrame.PERSONNELLE);
  });

  it("refuse qu'un membre publie une trame pour toute l'équipe", async () => {
    const { service, mistral } = monter();
    await expect(
      service.importer('cpt', 'u1', AccountRole.MEMBER, {
        nom: 'Modèle imposé',
        portee: PorteeTrame.ETABLISSEMENT,
        texte: 'A'.repeat(200),
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    // Court-circuité avant tout appel payant.
    expect(mistral.completer).not.toHaveBeenCalled();
  });

  it("l'autorise à un chef de service", async () => {
    const { service, prisma } = monter();
    await service.importer('cpt', 'u1', AccountRole.MANAGER, {
      nom: 'Modèle imposé',
      portee: PorteeTrame.ETABLISSEMENT,
      texte: 'A'.repeat(200),
    });
    expect(prisma.trameMaison.create.mock.calls[0][0].data.portee).toBe(
      PorteeTrame.ETABLISSEMENT,
    );
  });

  it('refuse un import vide, sans appeler le moteur', async () => {
    const { service, mistral } = monter();
    await expect(
      service.importer('cpt', 'u1', AccountRole.MEMBER, { nom: 'Vide' }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(mistral.completer).not.toHaveBeenCalled();
  });

  it('refuse un modèle trop court pour livrer une structure', async () => {
    const { service } = monter();
    await expect(
      service.importer('cpt', 'u1', AccountRole.MEMBER, { nom: 'Court', texte: 'Trop court.' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('dit quoi faire quand le moteur ne rend pas de structure exploitable', async () => {
    const { service } = monter('Je ne sais pas analyser ce document.');
    await expect(
      service.importer('cpt', 'u1', AccountRole.MEMBER, { nom: 'X', texte: 'A'.repeat(200) }),
    ).rejects.toThrow(/structure de ce modèle/i);
  });

  it('reste utilisable si le dépôt du document d’origine échoue', async () => {
    const { service, files, prisma } = monter();
    files.deposer.mockRejectedValue(new Error('dépôt non configuré'));
    const r = await service.importer(
      'cpt',
      'u1',
      AccountRole.MEMBER,
      { nom: 'Modèle' },
      {
        originalname: 'modele.txt',
        mimetype: 'text/plain',
        size: 400,
        buffer: Buffer.from('RAPPORT\n' + 'Contexte de la mesure. '.repeat(20)),
      },
    );
    expect(r.sourceConservee).toBe(false);
    expect(prisma.trameMaison.create).toHaveBeenCalled();
  });
});

describe('TramesMaisonService — visibilité et droits', () => {
  it("ne montre que les siennes et celles publiées par l'établissement", async () => {
    const { service, prisma } = monter();
    await service.lister('cpt', 'u1');
    const where = prisma.trameMaison.findMany.mock.calls[0][0].where;
    expect(where.accountId).toBe('cpt');
    expect(where.OR).toEqual([
      { authorId: 'u1' },
      { portee: PorteeTrame.ETABLISSEMENT },
    ]);
  });

  it("refuse d'appliquer la trame personnelle d'un collègue", async () => {
    const { service, prisma } = monter();
    prisma.trameMaison.findFirst.mockResolvedValue(null);
    await expect(service.pourGeneration('t-collegue', 'cpt', 'u1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('sans trame demandée, la génération reste standard', async () => {
    const { service } = monter();
    await expect(service.pourGeneration(undefined, 'cpt', 'u1')).resolves.toBeNull();
  });

  it("un membre ne supprime pas la trame d'un autre", async () => {
    const { service, prisma } = monter();
    prisma.trameMaison.findFirst.mockResolvedValue({
      id: 't1',
      authorId: 'autre',
      portee: PorteeTrame.PERSONNELLE,
    });
    await expect(
      service.supprimer('t1', 'cpt', 'u1', AccountRole.MEMBER, GlobalRole.USER),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.trameMaison.delete).not.toHaveBeenCalled();
  });

  it("supprimer une trame emporte le modèle d'origine", async () => {
    const { service, prisma, files } = monter();
    prisma.trameMaison.findFirst.mockResolvedValue({
      id: 't1',
      authorId: 'u1',
      portee: PorteeTrame.PERSONNELLE,
      sourceFileId: 'f1',
    });
    await service.supprimer('t1', 'cpt', 'u1', AccountRole.MEMBER, GlobalRole.USER);
    expect(prisma.trameMaison.delete).toHaveBeenCalled();
    expect(files.supprimer).toHaveBeenCalledWith('f1', 'u1', GlobalRole.USER);
  });
});
