'use client';

/**
 * Ré-export de compat : certains modules importent `useToast` depuis
 * `@/components/ui/use-toast` (convention shadcn). La source est toast.tsx.
 */
export { useToast, ToastProvider } from './toast';
export type { ToastOptions } from './toast';
