import { BadRequestException } from '@nestjs/common';
import { estMarqueTest, refuserPublicationTest, sansTitreTest } from './donnees-test';

describe('données de test : jamais publiées, jamais comptées', () => {
  it.each([
    'Essai technique visioconsultation (ne pas publier)',
    'TEST QA ADÉPA 20260921 — NE PAS TRAITER',
    '[TEST] Atelier boxe',
  ])('reconnaît « %s »', (t) => expect(estMarqueTest(t)).toBe(true));

  it.each(['Tester ses limites par la boxe éducative', 'Atelier théâtre', 'Contest de danse', ''])(
    'laisse passer le vrai titre « %s »',
    (t) => expect(estMarqueTest(t)).toBe(false),
  );

  it('refuse la mise en ligne, avec un message qui dit quoi faire', () => {
    expect(() => refuserPublicationTest('Essai technique (ne pas publier)')).toThrow(BadRequestException);
    expect(() => refuserPublicationTest('Atelier photo')).not.toThrow();
  });

  it('le filtre Prisma exclut chaque marque, sans tenir compte de la casse', () => {
    const f = sansTitreTest();
    expect(f.NOT.length).toBeGreaterThanOrEqual(5);
    expect(f.NOT[0]).toEqual({ title: { contains: 'ne pas publier', mode: 'insensitive' } });
  });
});
