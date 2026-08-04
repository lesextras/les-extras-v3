import 'reflect-metadata';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { BadRequestException, ValidationError } from '@nestjs/common';
import { ServiceStatus } from '@prisma/client';
import { RegisterDto } from '../auth/dto/register.dto';
import { exceptionValidationFr } from './validation/messages-fr';
import { ServicesService } from '../services/services.service';
import { MissionsService } from '../missions/missions.service';

/**
 * Les six corrections de l'audit de pré-commercialisation, verrouillées.
 *
 * Chacune de ces règles a été violée EN PRODUCTION : ce ne sont pas des
 * précautions théoriques. Un test par faute constatée, pour qu'une
 * refactorisation ultérieure ne les rouvre pas silencieusement.
 */

/** Valide un DTO et renvoie la liste des contraintes qui ont échoué. */
async function contraintes(dto: object): Promise<string[]> {
  const erreurs = await validate(dto);
  return erreurs.flatMap((e) => Object.keys(e.constraints ?? {}));
}

const COMPTE_VALIDE = {
  email: 'directrice@mecs-exemple.fr',
  firstName: 'Claire',
  lastName: 'Fontaine',
  accountType: 'ESTABLISHMENT',
  organizationName: 'MECS Les Tilleuls',
};

describe('Audit sécurité — mot de passe', () => {
  it('refuse un mot de passe sans chiffre, même assez long', async () => {
    const dto = plainToInstance(RegisterDto, { ...COMPTE_VALIDE, password: 'motdepasse' });
    expect(await contraintes(dto)).toContain('matches');
  });

  it('refuse un mot de passe sans lettre', async () => {
    const dto = plainToInstance(RegisterDto, { ...COMPTE_VALIDE, password: '12345678' });
    expect(await contraintes(dto)).toContain('matches');
  });

  it('refuse « aaaaaaaa », qui passait avant', async () => {
    const dto = plainToInstance(RegisterDto, { ...COMPTE_VALIDE, password: 'aaaaaaaa' });
    expect(await contraintes(dto)).not.toHaveLength(0);
  });

  it('accepte un mot de passe conforme à ce que le formulaire annonce', async () => {
    const dto = plainToInstance(RegisterDto, { ...COMPTE_VALIDE, password: 'Tilleuls2026' });
    expect(await contraintes(dto)).toHaveLength(0);
  });
});

describe('Audit sécurité — messages de validation en français', () => {
  /** Fabrique l'objet que class-validator passe à l'exceptionFactory. */
  function erreur(property: string, constraints: Record<string, string>): ValidationError {
    return { property, constraints, children: [] } as ValidationError;
  }

  function messages(...erreurs: ValidationError[]): string[] {
    const exception = exceptionValidationFr(erreurs);
    expect(exception).toBeInstanceOf(BadRequestException);
    const corps = exception.getResponse() as { message: string | string[] };
    return Array.isArray(corps.message) ? corps.message : [corps.message];
  }

  it('ne laisse plus passer une phrase anglaise de class-validator', () => {
    const rendus = messages(
      erreur('title', { minLength: 'title must be longer than or equal to 3 characters' }),
      erreur('amount', { min: 'amount must not be less than 0' }),
    );
    for (const m of rendus) {
      expect(m).not.toMatch(/must be|should not|must not/i);
    }
  });

  it('nomme le champ en français quand il est connu', () => {
    const [message] = messages(
      erreur('password', { minLength: 'password must be longer than or equal to 8 characters' }),
    );
    expect(message).toContain('mot de passe');
  });

  it('conserve un message métier déjà rédigé en français', () => {
    const ecrit = 'Le mot de passe doit contenir au moins un chiffre.';
    expect(messages(erreur('password', { matches: ecrit }))).toContain(ecrit);
  });
});

describe('Audit sécurité — suppressions qui laissaient des orphelins', () => {
  it('archive un atelier déjà réservé au lieu de le supprimer', async () => {
    const prisma = {
      service: {
        findUnique: jest.fn().mockResolvedValue({ id: 'svc', accountId: 'cpt', title: 'Médiation' }),
        update: jest.fn().mockResolvedValue({}),
        delete: jest.fn(),
      },
      booking: { count: jest.fn().mockResolvedValue(1) },
      quote: { count: jest.fn().mockResolvedValue(0) },
    };
    const services = new ServicesService(prisma as never, {} as never, {} as never);

    const resultat = await services.remove('svc', 'cpt');

    expect(prisma.service.delete).not.toHaveBeenCalled();
    expect(prisma.service.update).toHaveBeenCalledWith({
      where: { id: 'svc' },
      data: { status: ServiceStatus.ARCHIVED },
    });
    expect(resultat).toMatchObject({ deleted: false, archived: true });
  });

  it('archive aussi lorsque seul un devis existe', async () => {
    const prisma = {
      service: {
        findUnique: jest.fn().mockResolvedValue({ id: 'svc', accountId: 'cpt', title: 'Atelier' }),
        update: jest.fn().mockResolvedValue({}),
        delete: jest.fn(),
      },
      booking: { count: jest.fn().mockResolvedValue(0) },
      quote: { count: jest.fn().mockResolvedValue(2) },
    };
    const services = new ServicesService(prisma as never, {} as never, {} as never);

    await services.remove('svc', 'cpt');

    expect(prisma.service.delete).not.toHaveBeenCalled();
  });

  it('supprime réellement tant que rien n’a été engagé', async () => {
    const prisma = {
      service: {
        findUnique: jest.fn().mockResolvedValue({ id: 'svc', accountId: 'cpt', title: 'Brouillon' }),
        update: jest.fn(),
        delete: jest.fn().mockResolvedValue({}),
      },
      booking: { count: jest.fn().mockResolvedValue(0) },
      quote: { count: jest.fn().mockResolvedValue(0) },
    };
    const services = new ServicesService(prisma as never, {} as never, {} as never);

    expect(await services.remove('svc', 'cpt')).toEqual({ deleted: true });
    expect(prisma.service.delete).toHaveBeenCalled();
  });

  it('refuse de supprimer une mission qui a déjà des candidatures', async () => {
    const prisma = {
      reliefMission: {
        findUnique: jest.fn().mockResolvedValue({ id: 'm1', accountId: 'cpt', title: 'Renfort' }),
        delete: jest.fn(),
      },
      booking: { count: jest.fn().mockResolvedValue(3) },
    };
    // MissionsService prend 8 dépendances ; seule Prisma intervient ici.
    const vide = {} as never;
    const missions = new MissionsService(
      prisma as never,
      vide,
      vide,
      vide,
      vide,
      vide,
      vide,
      vide,
    );

    await expect(missions.remove('m1', 'cpt')).rejects.toThrow();
    expect(prisma.reliefMission.delete).not.toHaveBeenCalled();
  });
});
