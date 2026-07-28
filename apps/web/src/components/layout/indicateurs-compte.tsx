'use client';

// Deux repères permanents dans la barre du haut : le solde de points et la
// note moyenne. Ils étaient enterrés dans des pages qu'il fallait aller
// chercher — donc invisibles, donc sans effet. Les mettre là leur redonne le
// rôle qu'ils sont censés jouer : donner envie de contribuer, et rendre la
// réputation tangible.
//
// Deux règles de retenue :
//  - rien ne s'affiche tant que la donnée n'est pas là (aucun squelette qui
//    clignote à chaque changement de page) ;
//  - la note reste affichée même sans aucun avis reçu. Dans ce cas on montre
//    « 0 avis » et non « 0,0 / 5 » : c'est la même information, mais elle dit
//    « pas encore noté » au lieu de « mal noté ».
import * as React from 'react';
import Link from 'next/link';
import { Award, Star } from 'lucide-react';
import { apiRequest } from '@/lib/api';

interface Solde {
  points: number;
  euros: number;
}
interface Notes {
  count: number;
  average: number | null;
}

export function IndicateursCompte({
  userId,
  accountId,
}: {
  userId: string;
  accountId?: string | null;
}) {
  const [solde, setSolde] = React.useState<Solde | null>(null);
  const [notes, setNotes] = React.useState<Notes | null>(null);

  React.useEffect(() => {
    let vivant = true;
    // Deux appels indépendants : si l'un échoue, l'autre s'affiche quand même.
    if (accountId) {
      apiRequest<Solde>(`/community/points?accountId=${accountId}`, { accountId })
        .then((d) => vivant && setSolde(d))
        .catch(() => undefined);
    }
    apiRequest<Notes>(`/reviews/user/${userId}`, { accountId: accountId ?? undefined })
      .then((d) => vivant && setNotes(d))
      .catch(() => undefined);
    return () => {
      vivant = false;
    };
  }, [userId, accountId]);

  const aDesNotes = notes != null && notes.count > 0 && notes.average != null;
  if (!solde && !notes) return null;

  return (
    <div className="hidden items-center gap-1.5 md:flex">
      {solde ? (
        <Link
          href="/dashboard/points"
          title={`${solde.points} points — soit ${solde.euros} € de réduction`}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-sm font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-accent"
        >
          <Award className="size-4 text-primary" aria-hidden />
          <span className="[font-variant-numeric:tabular-nums]">{solde.points}</span>
          <span className="hidden text-muted-foreground xl:inline">pts</span>
          <span className="sr-only">points de fidélité, soit {solde.euros} euros de réduction</span>
        </Link>
      ) : null}

      {notes ? (
        <Link
          href="/dashboard/avis"
          title={
            aDesNotes
              ? `${notes.average!.toFixed(1)} sur 5 · ${notes.count} avis reçu${notes.count > 1 ? 's' : ''}`
              : 'Aucun avis reçu pour le moment — votre note apparaîtra dès le premier'
          }
          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-sm font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-accent"
        >
          <Star
            className={
              aDesNotes ? 'size-4 fill-warning text-warning' : 'size-4 text-muted-foreground'
            }
            aria-hidden
          />
          {aDesNotes ? (
            <>
              <span className="[font-variant-numeric:tabular-nums]">
                {notes.average!.toFixed(1)}
              </span>
              <span className="hidden text-muted-foreground xl:inline">({notes.count})</span>
              <span className="sr-only">note moyenne sur {notes.count} avis reçus</span>
            </>
          ) : (
            <>
              <span className="[font-variant-numeric:tabular-nums] text-muted-foreground">0</span>
              <span className="hidden text-muted-foreground xl:inline">avis</span>
              <span className="sr-only">aucun avis reçu pour le moment</span>
            </>
          )}
        </Link>
      ) : null}
    </div>
  );
}
