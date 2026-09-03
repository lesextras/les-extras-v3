import { BadRequestException } from '@nestjs/common';
import { AdminService } from './admin.service';

/**
 * UNE FICHE GRATUITE SANS ADRESSE EST UNE FICHE SANS BOUTON.
 *
 * La fiche formation existe en deux versions. Celle par défaut vend une action
 * Qualiopi au devis : son appel à l'action est le formulaire de devis, qui
 * marche toujours. Celle des mini-formations gratuites n'a QU'UN SEUL bouton,
 * et ce bouton pointe sur `enrollUrl`. S'il manque, la page publique s'affiche
 * normalement — titre, programme, objectifs, mention « Gratuit » — mais il
 * devient impossible de commencer la formation depuis le site.
 *
 * C'est exactement le genre de défaut qui ne se voit pas : rien ne casse, rien
 * ne remonte, et on le découvre des mois plus tard en se demandant pourquoi
 * personne ne s'inscrit. D'où ce garde-fou à la saisie, et ces trois tests qui
 * décrivent la règle plutôt que le code.
 *
 * Le troisième cas est le moins évident et le plus utile : la cohérence se
 * vérifie sur l'ÉTAT RÉSULTANT. Cocher « gratuite » sur une fiche qui porte
 * déjà son adresse est légitime ; effacer l'adresse d'une fiche déjà gratuite
 * ne l'est pas, alors même que le formulaire envoyé ne parle pas de gratuité.
 */
function service(formationEnBase?: Record<string, unknown>) {
  const prisma: any = {
    account: {
      findFirst: jest.fn().mockResolvedValue({ id: 'compte-of', name: 'ADéPA' }),
    },
    formation: {
      findUnique: jest.fn().mockResolvedValue(formationEnBase ?? null),
      create: jest.fn((args: any) => Promise.resolve({ id: 'f-neuve', ...args.data })),
      update: jest.fn((args: any) => Promise.resolve({ id: 'f1', ...args.data })),
    },
  };
  return new AdminService(prisma, {} as any, {} as any, {} as any, {} as any);
}

describe('Formation gratuite en ligne : le drapeau et l’adresse vont ensemble', () => {
  it('refuse une création « gratuite » sans adresse de suivi', async () => {
    await expect(
      service().createFormation({ title: 'Une mini-formation', freeOnline: true } as any),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('accepte une création « gratuite » qui porte son adresse', async () => {
    const cree = await service().createFormation({
      title: 'Une mini-formation',
      freeOnline: true,
      enrollUrl: 'https://exemple.test/formations/une-mini-formation',
    } as any);
    expect(cree).toMatchObject({
      freeOnline: true,
      enrollUrl: 'https://exemple.test/formations/une-mini-formation',
    });
  });

  it('refuse d’effacer l’adresse d’une fiche DÉJÀ gratuite', async () => {
    const enBase = {
      id: 'f1',
      type: 'CERTIFIANTE',
      freeOnline: true,
      enrollUrl: 'https://exemple.test/formations/deja-en-ligne',
    };
    await expect(
      service(enBase).updateFormation('f1', { enrollUrl: null } as any),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('laisse intactes les formations payantes, qui n’ont pas d’adresse de suivi', async () => {
    const cree = await service().createFormation({ title: 'Formation au devis' } as any);
    expect(cree).toMatchObject({ freeOnline: false, enrollUrl: null });
  });
});
