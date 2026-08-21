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
 * ── Le dessin (refonte du 21/08/2026, demande Siham) ──────────────────────
 *
 * La première version était un bloc de texte : la récompense se cherchait
 * dans une phrase, le fonctionnement dans une autre. La fenêtre dit désormais
 * les choses dans l'ordre où on se les demande :
 *
 *   — le GAIN d'abord, en bandeau : « 40 points chacun » n'est pas un détail
 *     de paragraphe, c'est la seule raison d'ouvrir cette fenêtre ;
 *   — le COMMENT ensuite, en trois étapes numérotées d'une ligne chacune —
 *     partager, s'inscrire, terminer une première prestation ;
 *   — le GESTE enfin : le lien et son bouton Copier, sur la même ligne.
 *
 * Les confettis ne partent qu'au moment du COPIER : on félicite un geste, pas
 * l'ouverture d'une fenêtre.
 */

import { useCallback, useEffect, useState } from 'react';
import { Check, Copy, Gift } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
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

/**
 * Confettis décoratifs du bandeau : quelques rectangles inclinés aux couleurs
 * de la marque, posés en absolu. Purement ornementaux (aria-hidden) et
 * IMMOBILES — le mouvement est réservé au vrai geste, et lui seul respecte ou
 * non prefers-reduced-motion (voir confettis.ts).
 */
const DECO = [
  { left: '56%', top: '16%', rotate: '-18deg', couleur: 'bg-primary/50' },
  { left: '68%', top: '58%', rotate: '24deg', couleur: 'bg-secondary/60' },
  { left: '78%', top: '24%', rotate: '8deg', couleur: 'bg-primary/35' },
  { left: '87%', top: '60%', rotate: '-30deg', couleur: 'bg-secondary/40' },
  { left: '92%', top: '18%', rotate: '45deg', couleur: 'bg-primary/45' },
];

export function InvitationParrainage({ accountId }: { accountId: string }) {
  const { toast } = useToast();
  const [ouvert, setOuvert] = useState(false);
  const [data, setData] = useState<Parrainage | null>(null);
  const [copie, setCopie] = useState(false);

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

  const points = data.pointsParFilleulActif;
  const euros = Math.round(points / 10);

  // L'origine vient du navigateur, jamais d'une constante : le domaine a déjà
  // changé une fois, et un lien figé sur l'ancien nom aurait envoyé les
  // filleuls sur le mauvais site sans que personne ne le voie.
  const lien = `${window.location.origin}/register?parrain=${data.accountId}`;
  // Sans le protocole à l'écran : « https:// » mange un tiers de la largeur
  // pour une information que personne ne lit. La copie, elle, emporte le lien
  // complet.
  const lienCourt = lien.replace(/^https?:\/\//, '');

  async function copier() {
    try {
      await navigator.clipboard.writeText(lien);
      setCopie(true);
      lancerConfettis();
      toast({
        title: 'Lien copié',
        description: 'Envoyez-le à un confrère du secteur.',
      });
      marquerVue(accountId);
      // On laisse la fenêtre ouverte un instant : la refermer dans la seconde
      // donnerait l'impression que le clic a raté.
      window.setTimeout(() => setOuvert(false), 1600);
    } catch {
      toast({ title: 'Copie impossible', description: lien, variant: 'error' });
    }
  }

  const etapes = [
    <>Envoyez votre lien à un confrère — établissement ou intervenant, il vaut pour les deux.</>,
    <>Il crée son compte avec ce lien. Gratuit, comme le vôtre.</>,
    <>
      À sa première prestation terminée&nbsp;:{' '}
      <strong className="font-semibold text-foreground">{points}&nbsp;points chacun</strong>,
      automatiquement. Jamais à la simple inscription.
    </>,
  ];

  return (
    <Dialog open={ouvert} onOpenChange={fermer}>
      <DialogContent className="max-w-md overflow-hidden p-0">
        {/* ── Le gain, en bandeau ───────────────────────────────────────── */}
        <div className="relative border-b border-border bg-gradient-to-br from-primary/15 via-primary/5 to-transparent px-6 pb-5 pt-7">
          {DECO.map((d) => (
            <span
              key={`${d.left}-${d.top}`}
              aria-hidden
              className={`absolute h-2 w-3 rounded-[2px] ${d.couleur}`}
              style={{ left: d.left, top: d.top, transform: `rotate(${d.rotate})` }}
            />
          ))}
          <div className="relative flex items-center gap-4 pr-6">
            <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-card">
              <Gift className="size-6" aria-hidden />
            </span>
            <div className="min-w-0">
              <DialogTitle className="text-xl">Parrainez un confrère</DialogTitle>
              <p className="mt-0.5 text-sm font-semibold text-primary">
                {points}&nbsp;points pour vous, {points} pour lui — {euros}&nbsp;€ de
                réduction chacun
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-5 px-6 pb-6 pt-5">
          {/* ── Comment ça marche : trois étapes d'une ligne ─────────────── */}
          <ol className="space-y-3">
            {etapes.map((texte, i) => (
              <li key={`etape-${i + 1}`} className="flex items-start gap-3">
                <span
                  aria-hidden
                  className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-bold text-primary"
                >
                  {i + 1}
                </span>
                <p className="text-sm leading-relaxed text-muted-foreground">{texte}</p>
              </li>
            ))}
          </ol>

          {/* ── Le geste : le lien et son bouton, sur la même ligne ──────── */}
          <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/40 p-1.5 pl-3">
            <code className="min-w-0 flex-1 truncate text-xs text-foreground" title={lien}>
              {lienCourt}
            </code>
            <Button size="sm" onClick={copier} className="shrink-0">
              {copie ? (
                <>
                  <Check className="size-3.5" aria-hidden /> Copié
                </>
              ) : (
                <>
                  <Copy className="size-3.5" aria-hidden /> Copier mon lien
                </>
              )}
            </Button>
          </div>

          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              Vous le retrouverez dans «&nbsp;Points &amp; parrainage&nbsp;».
            </p>
            <Button variant="ghost" size="sm" onClick={() => fermer(false)}>
              Plus tard
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
