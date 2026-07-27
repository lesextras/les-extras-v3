"use client";

import { useState, useTransition } from "react";
import type { ComponentProps } from "react";
import { useRouter } from "next/navigation";
import { MessageSquareWarning, Send } from "lucide-react";
import { toast } from "sonner";
import {
  createUserDeskRequest,
  type UserDeskRequestContext,
  type UserDeskRequestType,
} from "@/app/actions/desk";
import { normalizeDeskRequestErrorMessage } from "@/lib/desk-errors";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

type ContextualDeskRequestButtonProps = {
  context: UserDeskRequestContext;
  type?: UserDeskRequestType;
  label?: string;
  variant?: ComponentProps<typeof Button>["variant"];
  size?: ComponentProps<typeof Button>["size"];
  className?: string;
};

export function ContextualDeskRequestButton({
  context,
  type = "LITIGE",
  label = "Signaler un problème au Desk",
  variant = "outline",
  size = "sm",
  className,
}: ContextualDeskRequestButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();
  const hasContext = Boolean(context.bookingId || context.missionId);
  const canSubmit = hasContext && !isPending && message.trim().length >= 5;

  const handleSubmit = () => {
    if (!canSubmit) return;

    startTransition(async () => {
      const result = await createUserDeskRequest(type, message.trim(), context);
      if (!result.ok) {
        toast.error(normalizeDeskRequestErrorMessage(result.error));
        return;
      }

      toast.success("Votre demande a été transmise au Desk.");
      setMessage("");
      setOpen(false);
      router.refresh();
    });
  };

  return (
    <>
      <Button
        type="button"
        variant={variant}
        size={size}
        className={className}
        disabled={!hasContext}
        onClick={() => setOpen(true)}
      >
        <MessageSquareWarning className="mr-1.5 h-4 w-4" aria-hidden="true" />
        {label}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Signaler un problème au Desk</DialogTitle>
            <DialogDescription>
              L'équipe Les Extras centralise le suivi depuis cette demande.
            </DialogDescription>
          </DialogHeader>

          <label className="space-y-1 text-sm">
            <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Message
            </span>
            <Textarea
              rows={5}
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Décrivez le blocage ou le contexte utile au Desk..."
            />
          </label>

          <DialogFooter>
            <Button
              type="button"
              variant="teal"
              size="sm"
              disabled={!canSubmit}
              onClick={handleSubmit}
            >
              <Send className="mr-1.5 h-4 w-4" aria-hidden="true" />
              {isPending ? "Envoi..." : "Envoyer au Desk"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
