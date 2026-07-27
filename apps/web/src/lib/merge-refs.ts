import type { Ref } from 'react';

/**
 * Affecte un nœud à un ref transféré, qu'il soit fonction ou objet.
 *
 * Les typages React 19 exposent `RefObject.current` en lecture seule pour les
 * refs transférés : la seule écriture légitime passe par ce point unique, ce
 * qui évite d'éparpiller des casts dans les composants.
 */
export function assignRef<T>(ref: Ref<T> | undefined, node: T | null): void {
  if (typeof ref === 'function') {
    ref(node);
    return;
  }
  if (ref) (ref as { current: T | null }).current = node;
}
