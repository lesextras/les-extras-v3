// Liste d'avis reçus (Server Component) : note moyenne en tête + détail des
// avis. Alimentée par GET /reviews/user/:userId.
import { Card, CardContent } from "@/components/ui/card";
import { formatDate, fullName, initials } from "./format";

export interface ReviewAuthor {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  avatarUrl?: string | null;
}

export interface ReviewItem {
  id: string;
  rating: number;
  comment?: string | null;
  createdAt: string;
  author?: ReviewAuthor | null;
}

export interface ReviewSummary {
  count: number;
  average: number | null;
  reviews: ReviewItem[];
}

/** Rendu non interactif d'une note sur 5. */
export function Stars({ value, className }: { value: number; className?: string }) {
  const rounded = Math.round(value);
  return (
    <span
      className={className ?? "text-base leading-none tracking-tight"}
      aria-label={`${value.toFixed(1)} sur 5`}
      title={`${value.toFixed(1)} sur 5`}
    >
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={i <= rounded ? "text-secondary" : "text-muted-foreground/40"}>
          {i <= rounded ? "★" : "☆"}
        </span>
      ))}
    </span>
  );
}

export function ReviewList({
  summary,
  emptyLabel = "Aucun avis pour le moment.",
}: {
  summary: ReviewSummary;
  emptyLabel?: string;
}) {
  const { count, average, reviews } = summary;

  if (count === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="px-6 py-10 text-center text-sm text-muted-foreground">
          {emptyLabel}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="flex flex-wrap items-center gap-4 p-5">
          <p className="text-[32px] font-bold leading-none tracking-tight text-foreground [font-variant-numeric:tabular-nums]">
            {average !== null ? average.toFixed(1) : "—"}
            <span className="text-base font-medium text-muted-foreground"> / 5</span>
          </p>
          <div className="space-y-1">
            <Stars value={average ?? 0} className="text-lg leading-none" />
            <p className="text-sm text-muted-foreground">
              {count} avis {count > 1 ? "déposés" : "déposé"}
            </p>
          </div>
        </CardContent>
      </Card>

      <ul className="space-y-3">
        {reviews.map((review) => {
          const name = fullName(review.author?.firstName, review.author?.lastName);
          return (
            <li key={review.id}>
              <Card>
                <CardContent className="flex gap-4 p-5">
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary-soft text-sm font-semibold text-primary">
                    {initials(review.author?.firstName, review.author?.lastName)}
                  </span>
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-medium text-foreground">{name}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(review.createdAt)}</p>
                    </div>
                    <Stars value={review.rating} />
                    {review.comment ? (
                      <p className="whitespace-pre-line text-sm text-muted-foreground">
                        {review.comment}
                      </p>
                    ) : (
                      <p className="text-sm italic text-muted-foreground/70">
                        Aucun commentaire laissé.
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
