'use client';

/**
 * L'INVITATION À PARRAINER — UNE FOIS, ET UNE SEULE.
 *
 * Le programme de parrainage existait, il était juste invisible : la page qui
 * porte le lien n'était atteignable que par un compteur de la barre du haut,
 * lequel ne s'affiche qu'à partir du PREMIER point gagné. Un compte tout neuf
 * n'avait donc aucun chemin vers son propre lien — le programme ne pouvait
 * mathématiquement pas démarrer.
 *
 * ── Ce que cette fenêtre s'interdit ───────────────────────────────────────
 *
 *  1. Elle ne s'affiche QU'UNE FOIS PAR COMPTE, et le refus est définitif. Une
 *     fenêtre qui revient à chaque visite n'est plus une invitation, c'est du
 *     harcèlement — et on finit par la fermer sans la lire.
 *  2. Elle ne s'affiche PAS à qui a déjà des filleuls. Inviter quelqu'un à
 *     découvrir ce qu'il utilise déjà lui apprend surtout qu'on ne le regarde
 *     pas.
 *  3. Elle attend quelques secondes. Surgir pendant que la page se monte
 *     interrompt quelqu'un qui venait faire autre chose ; le temps de poser
 *     les yeux sur son tableau de bord, l'interruption devient une pause.
 *  4. Elle se ferme à l'Échap, au clic à côté et par une croix — c'est le
 *     `Dialog` du produit qui s'en charge, on ne réinvente pas une modale.
 *
 * Les confettis ne partent qu'au moment du COPIER : on félicite un geste, pas
 * l'ouverture d'une fenêtre.
 */

import { useCallback, useEffect, useState } from 'react';
import { Gift } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { apiRequest } from '@/lib/api';
import { lancerConfettis } from './confettis';

interface Parrainage {
  accountId: string;
  inscrits: number;
  actifs: number;
  pointsParFilleulActif: number;
}

/** Une clé par compte : une personne qui gère deux structures décide pour chacune. */
const cle = (accountId: string) => `lx.parrainage.invitation.v1.${accountId}`;

/** Le temps de poser les yeux sur sa page avant d'être interrompu. */
const DELAI_MS = 3500;

function dejaVue(accountId: string): boolean {
  try {
    return window.localStorage.getItem(cle(accountId)) === 'vue';
  } catch {
    // Navigation privée ou stockage refusé : on préfère ne rien montrer plutôt
    // que de montrer à chaque visite une fenêtre qu'on ne saura pas retenir.
    return true;
  }
}

function marquerVue(accountId: string) {
  try {
    window.localStorage.setItem(cle(accountId), 'vue');
  } catch {
    /* sans stockage, tant pis : l'invitation aura au moins servi une fois */
  }
}

export function InvitationParrainage({ accountId }: { accountId: string }) {
  const { toast } = useToast();
  const [ouvert, setOuvert] = useState(false);
  const [data, setData] = useState<Parrainage | null>(null);

  useEffect(() => {
    if (!accountId || dejaVue(accountId)) return;
    let vivant = true;
    let minuteur: number | undefined;

    apiRequest<Parrainage>('/community/parrainage', { accountId })
      .then((d) => {
        if (!vivant) return;
        // Déjà des filleuls : cette personne connaît le programme.
        if (d.inscrits > 0) {
          marquerVue(accountId);
          return;
        }
        setData(d);
        minuteur = window.setTimeout(() => vivant && setOuvert(true), DELAI_MS);
      })
      .catch(() => undefined);

    return () => {
      vivant = false;
      if (minuteur) window.clearTimeout(minuteur);
    };
  }, [accountId]);

  const fermer = useCallback(
    (v: boolean) => {
      setOuvert(v);
      // Vue vaut refus : on ne repropose pas. Le lien reste accessible dans
      // « Points & parrainage », qui est maintenant dans le menu.
      if (!v) marquerVue(accountId);
    },
    [accountId],
  );

  if (!data) return null;

  // L'origine vient du navigateur, jamais d'une constante : le domaine a déjà
  // changé une fois, et un lien figé sur l'ancien nom aurait envoyé les
  // filleuls sur le mauvais site sans que personne ne le voie.
  const lien = `${window.location.origin}/register?parrain=${data.accountId}`;

  async function copier() {
    try {
      await navigator.clipboard.writeText(lien);
      lancerConfettis();
      toast({
        title: 'Lien copié',
        description: 'Envoyez-le à un confrère du secteur.',
      });
      marquerVue(accountId);
      // On laisse la fenêtre ouverte un instant : la refermer dans la seconde
      // donnerait l'impression que le clic a raté.
      window.setTimeout(() => setOuvert(false), 1400);
    } catch {
      toast({ title: 'Copie impossible', description: lien, variant: 'error' });
    }
  }

  return (
    <Dialog open={ouvert} onOpenChange={fermer}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="mb-3 inline-flex size-11 items-center justify-center rounded-xl bg-primary/10">
            <Gift className="size-5 text-primary" aria-hidden />
          </div>
          <DialogTitle>Parrainez un confrère</DialogTitle>
          <DialogDescription>
            Quand votre filleul termine sa première prestation, vous gagnez{' '}
            <strong className="font-semibold text-foreground">
              {data.pointsParFilleulActif} points
            </strong>{' '}
            — et lui aussi. Soit {Math.round(data.pointsParFilleulActif / 10)} € de
            réduction chacun, sur vos factures.
          </DialogDescription>
        </DialogHeader>

        <p className="text-sm text-muted-foreground">
          Établissement ou intervenant, peu importe : le lien fonctionne dans les
          deux sens. Les points tombent à la première prestation terminée, jamais à
          l&apos;inscription.
        </p>

        <code className="mt-1 block overflow-x-auto rounded-lg border border-border bg-muted/40 px-3 py-2 text-xs text-foreground">
          {lien}
        </code>

        <DialogFooter>
          <Button variant="ghost" onClick={() => fermer(false)}>
            Plus tard
          </Button>
          <Button onClick={copier}>Copier mon lien</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
