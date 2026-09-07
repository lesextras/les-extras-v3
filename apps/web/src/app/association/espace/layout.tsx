import type { ReactNode } from 'react';

/**
 * L'ESPACE CONNECTÉ. La navigation est dans la barre latérale commune ; ici on
 * ne fait que rendre chaque page à la demande (jamais mise en cache).
 */
export const dynamic = 'force-dynamic';

export default function EspaceLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
