import { AccountType } from '@prisma/client';
import { ActivationScheduler } from './activation.scheduler';

/**
 * L'E-MAIL D'ACTIVATION — QUI LE REÇOIT, QUI NE LE REÇOIT PAS.
 *
 * On teste `decider()` seule : c'est elle qui porte les règles (« le premier
 * geste est déjà fait → rien d'envoyé », « adresse non confirmée → rien »),
 * l'envoi n'est que de la plomberie.
 */

const scheduler = new ActivationScheduler(undefined as never, undefined as never);

const profilVide = { job: null, city: null, diplomaUrl: null };
const base = { emailVerified: true, profile: profilVide, memberships: [] };

describe('ActivationScheduler.decider', () => {
  it('établissement sans besoin publié → variante établissement', () => {
    const compte = { id: 'e1', type: AccountType.ESTABLISHMENT, profilSalarie: false };
    expect(scheduler.decider(base, compte, new Set())).toBe('etablissement');
  });

  it('établissement qui a déjà publié → silence (le geste est fait)', () => {
    const compte = { id: 'e1', type: AccountType.ESTABLISHMENT, profilSalarie: false };
    expect(scheduler.decider(base, compte, new Set(['e1']))).toBeNull();
  });

  it('indépendant au dossier incomplet → variante indépendant', () => {
    const compte = { id: 'f1', type: AccountType.FREELANCE, profilSalarie: false };
    const u = { ...base, profile: { job: 'Éducateur spécialisé', city: null, diplomaUrl: null } };
    expect(scheduler.decider(u, compte, new Set())).toBe('independant');
  });

  it('indépendant au dossier complet → silence', () => {
    const compte = { id: 'f1', type: AccountType.FREELANCE, profilSalarie: false };
    const u = {
      ...base,
      profile: { job: 'Éducateur spécialisé', city: 'Melun', diplomaUrl: '/d.pdf' },
    };
    expect(scheduler.decider(u, compte, new Set())).toBeNull();
  });

  it('salarié non rattaché → variante salarié', () => {
    const compte = { id: 's1', type: AccountType.FREELANCE, profilSalarie: true };
    expect(scheduler.decider(base, compte, new Set())).toBe('salarie');
  });

  it('salarié déjà rattaché à un établissement → silence', () => {
    const compte = { id: 's1', type: AccountType.FREELANCE, profilSalarie: true };
    const u = { ...base, memberships: [{ account: { type: AccountType.ESTABLISHMENT } }] };
    expect(scheduler.decider(u, compte, new Set())).toBeNull();
  });

  it('adresse non confirmée → silence, quel que soit le compte', () => {
    const compte = { id: 'e1', type: AccountType.ESTABLISHMENT, profilSalarie: false };
    expect(scheduler.decider({ ...base, emailVerified: false }, compte, new Set())).toBeNull();
  });

  it('invité sans compte à lui (membre pur) → silence', () => {
    expect(scheduler.decider(base, undefined, new Set())).toBeNull();
  });
});
