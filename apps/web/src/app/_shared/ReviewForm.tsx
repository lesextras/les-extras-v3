"use client";

// Dépôt d'un avis après une prestation terminée — POST /reviews.
// Note obligatoire de 1 à 5 étoiles, commentaire facultatif (2000 caractères).
// Le corps envoyé colle strictement au CreateReviewDto (ValidationPipe en
// whitelist + forbidNonWhitelisted : aucun champ superflu ne doit être envoyé).
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { apiRequest } from "@/lib/api";
import { Field, Textarea } from "./form-fields";

const RATING_HINTS: Record<number, string> = {
  1: "Très insatisfaisant",
  2: "Insatisfaisant",
  3: "Correct",
  4: "Satisfaisant",
  5: "Excellent",
};

export function ReviewForm({
  bookingId,
  targetId,
  accountId,
  targetName,
}: {
  bookingId: string;
  targetId: string;
  accountId: string;
  /** Nom affiché de la personne évaluée (pour l'accessibilité et le libellé). */
  targetName?: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const shown = hovered || rating;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (rating < 1) {
      toast({
        title: "Note requise",
        description: "Sélectionnez une note de 1 à 5 étoiles avant de valider.",
        variant: "error",
      });
      return;
    }
    setLoading(true);
    try {
      const trimmed = comment.trim();
      await apiRequest("/reviews", {
        method: "POST",
        body: {
          bookingId,
          targetId,
          rating,
          // Champ optionnel côté DTO : omis s'il est vide.
          ...(trimmed ? { comment: trimmed } : {}),
        },
        accountId,
      });
      setDone(true);
      toast({
        title: "Avis enregistré",
        description: "Merci, votre retour contribue à la qualité des mises en relation.",
      });
      router.refresh();
    } catch (err) {
      toast({
        title: "Avis non enregistré",
        description: err instanceof Error ? err.message : "Réessayez dans un instant.",
        variant: "error",
      });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <p className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
        Avis déposé. Merci pour votre retour.
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Field
        label="Votre note"
        required
        hint={shown ? RATING_HINTS[shown] : "Cliquez sur les étoiles pour noter de 1 à 5."}
      >
        <div
          className="flex items-center gap-1"
          role="radiogroup"
          aria-label={targetName ? `Note attribuée à ${targetName}` : "Note attribuée"}
          onMouseLeave={() => setHovered(0)}
        >
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={rating === value}
              aria-label={`${value} étoile${value > 1 ? "s" : ""}`}
              title={RATING_HINTS[value]}
              disabled={loading}
              onMouseEnter={() => setHovered(value)}
              onFocus={() => setHovered(value)}
              onBlur={() => setHovered(0)}
              onClick={() => setRating(value)}
              className="rounded-md p-0.5 text-2xl leading-none transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
            >
              <span className={value <= shown ? "text-secondary" : "text-muted-foreground/40"}>
                {value <= shown ? "★" : "☆"}
              </span>
            </button>
          ))}
          <span className="ml-2 text-sm text-muted-foreground">
            {rating > 0 ? `${rating}/5` : "—"}
          </span>
        </div>
      </Field>

      <Field
        label="Commentaire"
        htmlFor={`review-comment-${bookingId}`}
        hint="Facultatif — 2000 caractères maximum. Restez factuel et professionnel."
      >
        <Textarea
          id={`review-comment-${bookingId}`}
          name="comment"
          rows={4}
          maxLength={2000}
          value={comment}
          disabled={loading}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Ponctualité, posture professionnelle, adaptation au public accompagné…"
        />
      </Field>

      <Button type="submit" disabled={loading || rating < 1}>
        {loading ? "Envoi…" : "Déposer l'avis"}
      </Button>
    </form>
  );
}
