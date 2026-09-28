import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { AccountType } from '@prisma/client';
import { RegisterDto } from './dto/register.dto';

/**
 * LES TROIS COMPTES DE LES EXTRAS (28/09/2026) : structure, intervenant
 * indépendant, particulier. Les comptes de Piloter (ASSOCIATION, ACADEMIE) ne
 * s'ouvrent jamais par l'inscription de Les Extras, même en appelant l'API à
 * la main.
 */
const base = {
  email: 'test@exemple.fr',
  password: 'MotDePasse!2026',
  firstName: 'Nadia',
  lastName: 'B',
  acceptTerms: true,
};

async function erreursType(accountType: string) {
  const dto = plainToInstance(RegisterDto, { ...base, accountType, organizationName: 'MECS Test' });
  const erreurs = await validate(dto);
  return erreurs.filter((e) => e.property === 'accountType');
}

describe("L'inscription ouvre trois comptes, pas un de plus", () => {
  it.each([AccountType.ESTABLISHMENT, AccountType.FREELANCE, AccountType.PARTICULIER])('accepte %s', async (t) => {
    expect(await erreursType(t)).toHaveLength(0);
  });

  it.each([AccountType.ASSOCIATION, AccountType.ACADEMIE])('refuse %s (compte Piloter)', async (t) => {
    expect(await erreursType(t)).toHaveLength(1);
  });
});
