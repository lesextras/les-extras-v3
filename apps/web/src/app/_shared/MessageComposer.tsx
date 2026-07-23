"use client";

// Zone de saisie d'un message dans un fil de conversation (inbox).
//   POST /conversations/:id/messages { body }
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { apiRequest } from "@/lib/api";
import { Textarea } from "./form-fields";

export function MessageComposer({
  conversationId,
  accountId,
}: {
  conversationId: string;
  accountId: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLTextAreaElement>(null);

  async function send(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const body = ref.current?.value.trim();
    if (!body) return;
    setLoading(true);
    try {
      await apiRequest(`/conversations/${conversationId}/messages`, {
        method: "POST",
        body: { body },
        accountId,
      });
      if (ref.current) ref.current.value = "";
      router.refresh();
    } catch (err) {
      toast({
        title: "Message non envoyé",
        description: err instanceof Error ? err.message : undefined,
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={send} className="flex items-end gap-2 border-t border-border bg-card p-3">
      <Textarea
        ref={ref}
        rows={1}
        name="body"
        placeholder="Écrire un message…"
        className="min-h-[44px] resize-none"
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            e.currentTarget.form?.requestSubmit();
          }
        }}
      />
      <Button type="submit" disabled={loading} className="shrink-0">
        {loading ? "…" : "Envoyer"}
      </Button>
    </form>
  );
}
