'use client';

import * as React from 'react';
import { ToastProvider } from '@/components/ui/toast';

/**
 * Fournisseurs client globaux montés dans le root layout.
 * (Toasts pour l'instant ; extensible : thème, react-query, etc.)
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return <ToastProvider>{children}</ToastProvider>;
}
