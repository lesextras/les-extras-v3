'use client';

/**
 * Revenir sur son choix de mesure, depuis la politique cookies.
 *
 * Un consentement qu'on ne peut pas retirer n'est pas un consentement
 * (art. 7.3 du RGPD). Ce bloc affiche l'état courant et permet d'en changer
 * en un clic, sans passer par les réglages du navigateur.
 */

import { useEffect, useState } from 'react';
import { RotateCcw, Check, Ban } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  enregistrerConsentement,
  lireConsentement,
  mesureConfiguree,
  oublier,
  surChangement,
  type Consentement,
} from '@/lib/consentement';

export function ChoixMesure() {
  const [pret, setPret] = useState(false);
  const [etat, setEtat] = useState<Consentement>('inconnu');

  useEffect(() => {
    if (!mesureConfiguree()) return;
    setPret(true);
    setEtat(lireConsentement());
    return surChangement(setEtat);
  }, []);

  if (!pret) return null;

  const libelle =
    etat === 'accepte'
      ? 'Vous avez accepté la mesure de nos campagnes.'
      : etat === 'refuse'
        ? 'Vous avez refusé la mesure de nos campagnes. Aucun cookie de mesure n’est déposé.'
        : 'Vous n’avez pas encore répondu. Tant que c’est le cas, aucun cookie de mesure n’est déposé.';

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <h2 className="font-semibold">Votre choix</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{libelle}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {etat !== 'refuse' ? (
          <Button variant="outline" size="sm" onClick={() => enregistrerConsentement('refuse')}>
            <Ban className="mr-1.5 size-4" aria-hidden />
            Refuser la mesure
          </Button>
        ) : null}
        {etat !== 'accepte' ? (
          <Button variant="outline" size="sm" onClick={() => enregistrerConsentement('accepte')}>
            <Check className="mr-1.5 size-4" aria-hidden />
            Accepter la mesure
          </Button>
        ) : null}
        {etat !== 'inconnu' ? (
          <Button variant="ghost" size="sm" onClick={oublier}>
            <RotateCcw className="mr-1.5 size-4" aria-hidden />
            Reposer la question
          </Button>
        ) : null}
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        Un refus est conservé aussi longtemps qu’un accord : nous ne vous reposerons pas la question
        à chaque visite. Le refus n’enlève rien au fonctionnement du site.
      </p>
    </div>
  );
}
