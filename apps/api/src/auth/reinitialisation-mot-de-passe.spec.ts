import { BadRequestException } from '@nestjs/common';
import { UserStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';

/**
 * RÉINITIALISATION DU MOT DE PASSE.
 *
 * Deux propriétés comptent plus que le reste, et ce sont celles qu'on
 * verrouille ici :
 *
 *  1. le lien ne sert qu'UNE fois — sans table de jetons à révoquer, la
 *     garantie repose entièrement sur l'empreinte du mot de passe scellée
 *     dans le jeton. Si quelqu'un simplifie cette mécanique, ces tests
 *     tombent ;
 *  2. la demande ne dit JAMAIS si l'adresse existe — sinon ce point d'entrée
 *     devient un annuaire des établissements clients.
 */

const SECRET = 'secret-de-test';

/** JWT réduit à ce dont le service a besoin, avec vraie expiration. */
function jwtMock() {
  const emis = new Map<string, { payload: Record<string, unknown>; expire: number }>();
  let n = 0;
  return {
    emis,
    signAsync: jest.fn(async (payload: Record<string, unknown>, opts?: { expiresIn?: string }) => {
      const jeton = `jeton-${++n}`;
      const duree = opts?.expiresIn === '1h' ? 3_600_000 : 172_800_000;
      emis.set(jeton, { payload, expire: 1_000_000 + duree });
      return jeton;
    }),
    verifyAsync: jest.fn(async (jeton: string) => {
      const entree = emis.get(jeton);
      if (!entree) throw new Error('jeton inconnu');
      return entree.payload;
    }),
  };
}

function monter(user: {
  id?: string;
  email?: string;
  password: string;
  status?: UserStatus;
}) {
  const enregistre = {
    id: user.id ?? 'u1',
    email: user.email ?? 'directrice@mecs-exemple.fr',
    firstName: 'Claire',
    password: user.password,
    status: user.status ?? UserStatus.VERIFIED,
    role: 'USER',
  };

  const prisma = {
    user: {
      findUnique: jest.fn(async ({ where }: { where: { id?: string; email?: string } }) => {
        if (where.id && where.id !== enregistre.id) return null;
        if (where.email && where.email !== enregistre.email) return null;
        return { ...enregistre };
      }),
      findUniqueOrThrow: jest.fn(async () => ({ ...enregistre })),
      update: jest.fn(async ({ data }: { data: { password?: string } }) => {
        if (data.password) enregistre.password = data.password;
        return { ...enregistre };
      }),
    },
  };

  const mail = { sendPasswordReset: jest.fn().mockResolvedValue(undefined) };
  const jwt = jwtMock();
  const config = { get: jest.fn().mockReturnValue(SECRET) };

  const service = new AuthService(
    prisma as never,
    jwt as never,
    config as never,
    mail as never,
  );
  // `buildMe` et `signAccessToken` sortent du périmètre de ces tests : ils
  // interrogent des relations qu'on ne simule pas ici.
  jest
    .spyOn(service as unknown as { buildMe: () => Promise<unknown> }, 'buildMe')
    .mockResolvedValue({ id: enregistre.id });
  jest
    .spyOn(
      service as unknown as { signAccessToken: () => Promise<string> },
      'signAccessToken',
    )
    .mockResolvedValue('jeton-de-session');

  return { service, prisma, mail, jwt, enregistre };
}

describe('Mot de passe oublié — la demande ne renseigne personne', () => {
  it('répond la même chose pour une adresse connue et une adresse inconnue', async () => {
    const hache = await bcrypt.hash('Tilleuls2026', 4);
    const { service, mail } = monter({ password: hache });

    const connue = await service.demanderReinitialisation('directrice@mecs-exemple.fr');
    const inconnue = await service.demanderReinitialisation('personne@nulle-part.invalid');

    expect(inconnue).toEqual(connue);
    // Et l'e-mail ne part évidemment que dans le premier cas.
    expect(mail.sendPasswordReset).toHaveBeenCalledTimes(1);
  });

  it('n’envoie rien à un compte suspendu, sans le dire non plus', async () => {
    const hache = await bcrypt.hash('Tilleuls2026', 4);
    const { service, mail } = monter({ password: hache, status: UserStatus.BANNED });

    const r = await service.demanderReinitialisation('directrice@mecs-exemple.fr');

    expect(r.ok).toBe(true);
    expect(mail.sendPasswordReset).not.toHaveBeenCalled();
  });
});

describe('Mot de passe oublié — le lien ne sert qu’une fois', () => {
  async function lienPour(motDePasseActuel: string) {
    const hache = await bcrypt.hash(motDePasseActuel, 4);
    const ctx = monter({ password: hache });
    await ctx.service.demanderReinitialisation('directrice@mecs-exemple.fr');
    const token = ctx.mail.sendPasswordReset.mock.calls[0][1] as string;
    return { ...ctx, token };
  }

  it('change bien le mot de passe au premier usage', async () => {
    const { service, prisma, token } = await lienPour('Tilleuls2026');

    const r = await service.reinitialiserMotDePasse(token, 'Nouveau2027');

    expect(r.ok).toBe(true);
    const data = prisma.user.update.mock.calls[0][0].data as {
      password: string;
      emailVerified: boolean;
    };
    expect(await bcrypt.compare('Nouveau2027', data.password)).toBe(true);
    // Cliquer un lien reçu à cette adresse prouve qu'on la relève.
    expect(data.emailVerified).toBe(true);
  });

  it('REFUSE le même lien une seconde fois', async () => {
    const { service, token } = await lienPour('Tilleuls2026');
    await service.reinitialiserMotDePasse(token, 'Nouveau2027');

    await expect(service.reinitialiserMotDePasse(token, 'Encore2028')).rejects.toThrow(
      /déjà servi/i,
    );
  });

  it('rend caduc un lien plus ancien dès qu’un autre a servi', async () => {
    const hache = await bcrypt.hash('Tilleuls2026', 4);
    const ctx = monter({ password: hache });
    await ctx.service.demanderReinitialisation('directrice@mecs-exemple.fr');
    await ctx.service.demanderReinitialisation('directrice@mecs-exemple.fr');
    const [premier, second] = ctx.mail.sendPasswordReset.mock.calls.map((c) => c[1] as string);

    await ctx.service.reinitialiserMotDePasse(second, 'Nouveau2027');

    await expect(ctx.service.reinitialiserMotDePasse(premier, 'Autre2029')).rejects.toThrow(
      /déjà servi/i,
    );
  });

  it('refuse un jeton fabriqué pour un autre usage', async () => {
    const hache = await bcrypt.hash('Tilleuls2026', 4);
    const { service, jwt } = monter({ password: hache });
    jwt.emis.set('jeton-detourne', {
      payload: { sub: 'u1', purpose: 'email-verify' },
      expire: Number.MAX_SAFE_INTEGER,
    });

    await expect(
      service.reinitialiserMotDePasse('jeton-detourne', 'Nouveau2027'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('refuse un jeton inconnu ou expiré, et dit quoi faire', async () => {
    const hache = await bcrypt.hash('Tilleuls2026', 4);
    const { service } = monter({ password: hache });

    await expect(service.reinitialiserMotDePasse('n-importe-quoi', 'Nouveau2027')).rejects.toThrow(
      /demandez-en un nouveau/i,
    );
  });

  it('refuse de réenregistrer le mot de passe actuel', async () => {
    const { service, token } = await lienPour('Tilleuls2026');

    await expect(service.reinitialiserMotDePasse(token, 'Tilleuls2026')).rejects.toThrow(
      /déjà votre mot de passe actuel/i,
    );
  });
});
