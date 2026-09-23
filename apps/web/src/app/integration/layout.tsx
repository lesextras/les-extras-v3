import type { ReactNode } from 'react';

/** Les cartes à intégrer : aucun habillage du site, un fond transparent. */
export default function LayoutIntegration({ children }: { children: ReactNode }) {
  return <div style={{ background: 'transparent', padding: 4 }}>{children}</div>;
}
