'use client';

import * as React from 'react';
import { ToastProvider } from '@/components/ui/toast';
import { VisiteurProvider } from '@/app/_shared/Visiteur';

/**
 * Fournisseurs client globaux montés dans le root layout.
 *
 * `VisiteurProvider` fait UNE requête après l'affichage pour savoir qui
 * regarde. Il est monté ici, et pas dans le layout public, pour que l'en-tête
 * de l'accueil et celui des pages publiques partagent la même réponse au lieu
 * d'en demander chacun une. Voir `app/api/visiteur/route.ts` pour le pourquoi.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <VisiteurProvider>{children}</VisiteurProvider>
    </ToastProvider>
  );
}
