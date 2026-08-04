'use client';

// « Passer pour l'instant » — une sortie qui reste fermée.
//
// Le bouton était un simple lien vers /dashboard. Il n'enregistrait donc
// jamais la sortie du tunnel : à la connexion suivante, et à toutes les
// suivantes, la personne était renvoyée sur l'écran de bienvenue (la
// redirection compare `onboardingStep` à 3, voir login/page.tsx). « Passer »
// ne passait rien — il reportait, indéfiniment. Un écran « Bienvenue ! » au
// troisième mois d'abonnement dit au client qu'on ne sait pas où il en est.
//
// On enregistre donc l'avancement avant de partir, exactement comme le fait
// la dernière étape du wizard. Et si l'enregistrement échoue, on s'en va
// quand même : le pire serait de retenir quelqu'un qui a demandé à sortir.
import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export function PasserOnboarding({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [enCours, setEnCours] = React.useState(false);

  async function passer() {
    setEnCours(true);
    try {
      await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step: 3 }),
      });
    } catch {
      // On sort quand même : voir le commentaire ci-dessus.
    }
    router.push('/dashboard');
    router.refresh();
  }

  return (
    <Button type="button" size="lg" variant="ghost" onClick={passer} loading={enCours}>
      {children}
    </Button>
  );
}
