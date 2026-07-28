'use client';

// Mémorise l'origine de la visite dès la première page vue. Ne rend rien,
// n'envoie rien : la valeur ne quitte le navigateur qu'au moment où la
// personne remplit un formulaire ou crée un compte.
import { useEffect } from 'react';
import { memoriserSource } from '@/lib/source';

export function CaptureSource() {
  useEffect(() => {
    memoriserSource();
  }, []);
  return null;
}
