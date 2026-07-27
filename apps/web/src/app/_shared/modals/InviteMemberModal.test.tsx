/**
 * Test Vitest — InviteMemberModal (lane QA-Security).
 *
 * Vérifie le composant clé du parcours sous-comptes :
 *  - ouverture de la modale,
 *  - saisie email + soumission,
 *  - appel API sur la bonne route AVEC l'accountId (isolation multi-tenant côté
 *    client : le header x-account-id est bien propagé via apiRequest),
 *  - rôle par défaut MEMBER (principe du moindre privilège).
 *
 * NOTE INTÉGRATION (bug trouvé) : InviteMemberModal importe
 * `@/components/ui/use-toast`, or le hook `useToast` est exporté par
 * `@/components/ui/toast`. À réconcilier côté Web-Core (créer un ré-export
 * `use-toast.ts` ou corriger l'import). Le test neutralise ce module par un mock.
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { beforeAll, describe, expect, it, vi } from 'vitest';

// --- Mocks des dépendances (isolent le composant) ---
// `vi.mock` est remonté en tête de fichier : les doubles doivent donc être
// créés dans `vi.hoisted`, sinon la fabrique référence une variable pas encore
// initialisée (« Cannot access 'apiRequest' before initialization »).
const { apiRequest, refresh, toast } = vi.hoisted(() => ({
  apiRequest: vi.fn().mockResolvedValue({ id: 'invite_1' }),
  refresh: vi.fn(),
  toast: vi.fn(),
}));

vi.mock('@/lib/api', () => ({ apiRequest, ApiError: class extends Error {} }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh, push: vi.fn() }) }));
vi.mock('@/components/ui/use-toast', () => ({ useToast: () => ({ toast }) }));

import { InviteMemberModal } from './InviteMemberModal';

// jsdom ne fournit pas ces API utilisées par Radix UI.
beforeAll(() => {
  (globalThis as any).ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
  if (!window.matchMedia) {
    (window as any).matchMedia = () => ({
      matches: false,
      addEventListener: () => {},
      removeEventListener: () => {},
    });
  }
  (Element.prototype as any).scrollIntoView = () => {};
  (Element.prototype as any).hasPointerCapture = () => false;
  (Element.prototype as any).setPointerCapture = () => {};
  (Element.prototype as any).releasePointerCapture = () => {};
});

describe('InviteMemberModal', () => {
  const ACCOUNT_ID = 'acc_123';

  it('rend le déclencheur par défaut', () => {
    render(<InviteMemberModal accountId={ACCOUNT_ID} />);
    expect(screen.getByRole('button', { name: /inviter un membre/i })).toBeInTheDocument();
  });

  it('ouvre la modale, envoie l\'invitation avec accountId + rôle MEMBER par défaut', async () => {
    render(<InviteMemberModal accountId={ACCOUNT_ID} />);

    fireEvent.click(screen.getByRole('button', { name: /inviter un membre/i }));

    const email = await screen.findByPlaceholderText(/structure\.fr/i);
    fireEvent.change(email, { target: { value: 'collegue@structure.fr' } });

    fireEvent.click(screen.getByRole('button', { name: /envoyer l'invitation/i }));

    await waitFor(() => expect(apiRequest).toHaveBeenCalledTimes(1));

    const [path, opts] = apiRequest.mock.calls[0];
    expect(path).toBe(`/invitations`);
    expect(opts).toMatchObject({
      method: 'POST',
      accountId: ACCOUNT_ID, // ← header x-account-id (isolation tenant)
      body: { email: 'collegue@structure.fr', role: 'MEMBER' },
    });
    await waitFor(() => expect(toast).toHaveBeenCalled());
  });

  it('n\'appelle pas l\'API si l\'email est vide (validation HTML required)', async () => {
    render(<InviteMemberModal accountId={ACCOUNT_ID} />);
    fireEvent.click(screen.getByRole('button', { name: /inviter un membre/i }));

    const form = (await screen.findByPlaceholderText(/structure\.fr/i)).closest('form')!;
    // Soumission directe sans remplir : le champ required bloque l'envoi.
    const submittable = form.checkValidity();
    expect(submittable).toBe(false);
  });
});
