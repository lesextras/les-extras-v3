"use client";

import * as React from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

/* ─── D.7 — Review Solicitation Modal ────────────────────────────
   Post-mission review modal with star rating, textarea,
   and quick tags (Ponctuel, Professionnel, Bienveillant, etc.)
   ─────────────────────────────────────────────────────────────── */

const QUICK_TAGS = [
    "Ponctuel",
    "Professionnel",
    "Bienveillant",
    "Compétent",
    "Recommandé",
] as const;

const QUICK_TAGS_FREELANCE = [
    "Bien organisé",
    "Bon accueil",
    "Clair sur les attentes",
    "Je reviendrais",
] as const;

interface ReviewModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    /** Name of the person/entity being reviewed */
    targetName: string;
    /** Context line, e.g. "Mission : AS nuit · 15 mars 2026" */
    context?: string;
    /** "establishment" reviews a freelance, "freelance" reviews an establishment */
    reviewerSide: "establishment" | "freelance";
    onSubmit: (data: { rating: number; text: string; tags: string[] }) => void;
}

export function ReviewModal({
    open,
    onOpenChange,
    targetName,
    context,
    reviewerSide,
    onSubmit,
}: ReviewModalProps) {
    const [rating, setRating] = React.useState(0);
    const [hoveredStar, setHoveredStar] = React.useState(0);
    const [text, setText] = React.useState("");
    const [selectedTags, setSelectedTags] = React.useState<Set<string>>(new Set());

    const tags = reviewerSide === "establishment" ? QUICK_TAGS : QUICK_TAGS_FREELANCE;

    const toggleTag = (tag: string) => {
        setSelectedTags((prev) => {
            const next = new Set(prev);
            if (next.has(tag)) next.delete(tag);
            else next.add(tag);
            return next;
        });
    };

    const handleSubmit = () => {
        if (rating === 0) return;
        onSubmit({ rating, text, tags: Array.from(selectedTags) });
        // Reset
        setRating(0);
        setText("");
        setSelectedTags(new Set());
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="font-display text-heading-md">
                        Comment s&apos;est passée la mission ?
                    </DialogTitle>
                    <DialogDescription>
                        Votre avis sur <strong>{targetName}</strong>
                        {context && <span className="block text-xs mt-1">{context}</span>}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-5 py-2">
                    {/* Star rating */}
                    <div className="flex items-center justify-center gap-1.5" role="radiogroup" aria-label="Note">
                        {[1, 2, 3, 4, 5].map((star) => {
                            const active = star <= (hoveredStar || rating);
                            return (
                                <button
                                    key={star}
                                    type="button"
                                    aria-label={`${star} étoile${star > 1 ? "s" : ""}`}
                                    onClick={() => setRating(star)}
                                    onMouseEnter={() => setHoveredStar(star)}
                                    onMouseLeave={() => setHoveredStar(0)}
                                    className={cn(
                                        "transition-transform duration-150",
                                        active ? "scale-110" : "scale-100",
                                    )}
                                >
                                    <Star
                                        className={cn(
                                            "h-8 w-8 transition-colors",
                                            active
                                                ? "text-amber-400 fill-amber-400"
                                                : "text-muted-foreground",
                                        )}
                                    />
                                </button>
                            );
                        })}
                    </div>

                    {/* Quick tags */}
                    <div className="flex flex-wrap justify-center gap-2">
                        {tags.map((tag) => {
                            const active = selectedTags.has(tag);
                            return (
                                <button
                                    key={tag}
                                    type="button"
                                    onClick={() => toggleTag(tag)}
                                    className={cn(
                                        "px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
                                        active
                                            ? "bg-[hsl(var(--color-teal-600))] text-white border-[hsl(var(--color-teal-600))]"
                                            : "border-border text-muted-foreground hover:border-[hsl(var(--color-teal-300))]",
                                    )}
                                >
                                    {tag}
                                </button>
                            );
                        })}
                    </div>

                    {/* Text feedback */}
                    <textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="Votre avis (optionnel mais encouragé)"
                        rows={3}
                        className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[hsl(var(--teal))] resize-none"
                    />
                </div>

                <DialogFooter className="gap-2">
                    <Button variant="ghost" onClick={() => onOpenChange(false)}>
                        Plus tard
                    </Button>
                    <Button
                        variant="default"
                        onClick={handleSubmit}
                        disabled={rating === 0}
                        className="min-h-[44px]"
                    >
                        Envoyer mon avis
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
