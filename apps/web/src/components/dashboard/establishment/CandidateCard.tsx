"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Check, Loader2, User, Euro, FileText, X, ExternalLink, MessageCircle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { declineCandidate } from "@/app/actions/missions";

interface CandidateCardProps {
  bookingId: string;
  freelance: {
    id: string;
    email: string;
    profile?: {
      firstName?: string | null;
      lastName?: string | null;
      avatar?: string | null;
      jobTitle?: string | null;
    } | null;
  };
  status: string;
  motivation?: string | null;
  proposedRate?: number | null;
}

export function CandidateCard({
  bookingId,
  freelance,
  status,
  motivation,
  proposedRate,
}: CandidateCardProps) {
  const router = useRouter();
  const [isDeclining, setIsDeclining] = useState(false);

  const firstName = freelance?.profile?.firstName;
  const lastName = freelance?.profile?.lastName;
  const name =
    firstName || lastName
      ? `${firstName ?? ""} ${lastName ?? ""}`.trim()
      : freelance?.email ?? "Candidat";
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const handleDecline = async () => {
    setIsDeclining(true);
    const result = await declineCandidate(bookingId);
    setIsDeclining(false);

    if (result.ok) {
      toast.info("Candidature refusée.");
      router.refresh();
    } else {
      toast.error("Erreur", {
        description: result.error || "Impossible de refuser ce candidat.",
      });
    }
  };

  const isConfirmed = status === "CONFIRMED";
  const isPending_ = status === "PENDING";

  return (
    <Card className={`flex flex-col overflow-hidden ${isConfirmed ? "border-green-500/50 bg-green-50/30" : ""}`}>
      <CardHeader className="p-4 flex flex-row items-center gap-3 space-y-0">
        <Avatar className="h-10 w-10">
          {freelance?.profile?.avatar && (
            <AvatarImage src={freelance.profile.avatar} alt={name} />
          )}
          <AvatarFallback className="text-xs font-semibold">
            {initials || <User className="h-5 w-5" />}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-sm truncate">{name}</h4>
          {freelance?.profile?.jobTitle && (
            <p className="text-xs text-muted-foreground truncate">{freelance.profile.jobTitle}</p>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {isConfirmed && (
            <Badge className="bg-green-600 text-white text-xs">Accepté</Badge>
          )}
          <Link
            href={`/freelances/${freelance.id}`}
            className="text-muted-foreground hover:text-foreground p-1 rounded"
            title="Voir le profil"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
          {isConfirmed && (
            <Link
              href={`/dashboard/inbox`}
              className="text-muted-foreground hover:text-foreground p-1 rounded"
              title="Ouvrir la messagerie"
            >
              <MessageCircle className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>
      </CardHeader>

      <CardContent className="px-4 pb-0 space-y-2 flex-grow">
        {/* Taux proposé */}
        {proposedRate != null && (
          <div className="flex items-center gap-2 text-sm">
            <Euro className="h-3.5 w-3.5 text-primary shrink-0" />
            <span className="font-semibold text-primary">{proposedRate} €/h</span>
            <span className="text-muted-foreground text-xs">proposé</span>
          </div>
        )}

        {/* Motivation */}
        {motivation && (
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <FileText className="h-3 w-3" />
              <span>Motivation</span>
            </div>
            <p className="text-xs text-foreground leading-relaxed line-clamp-3 bg-muted/40 rounded p-2">
              {motivation}
            </p>
          </div>
        )}
      </CardContent>

      <CardFooter className="p-4 mt-3 border-t bg-muted/10 gap-2">
        {isConfirmed ? (
          <Button
            size="sm"
            className="w-full bg-green-600 hover:bg-green-700 text-white cursor-default"
            disabled
          >
            <Check className="h-3.5 w-3.5" />
            Candidature acceptée
          </Button>
        ) : (
          <>
            <Button
              size="sm"
              variant="outline"
              className="w-full gap-1 border-destructive/40 text-destructive hover:bg-destructive/10"
              onClick={handleDecline}
              disabled={isDeclining || !isPending_}
            >
              {isDeclining ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <X className="h-3.5 w-3.5" />
              )}
              Décliner
            </Button>
          </>
        )}
      </CardFooter>
    </Card>
  );
}
