"use client";

// « Lex » — bot d'aide flottant. Sur le site public il répond sur la
// plateforme uniquement ; dans l'espace connecté il guide l'utilisation.
// Aucune donnée n'est conservée : l'historique vit dans l'onglet.
import * as React from "react";
import { MessageCircle, Send, X, Sparkles, Lock } from "lucide-react";
import { apiRequest } from "@/lib/api";
import { cn } from "@/lib/utils";

type Message = { role: "user" | "assistant"; content: string };

export function ChatBot({ mode, locked = false }: { mode: "public" | "dashboard"; locked?: boolean }) {
  const [open, setOpen] = React.useState(false);
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [saisie, setSaisie] = React.useState("");
  const [envoi, setEnvoi] = React.useState(false);
  const finRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    finRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  async function envoyer(e?: React.FormEvent) {
    e?.preventDefault();
    const texte = saisie.trim();
    if (!texte || envoi) return;
    setSaisie("");
    const suivant: Message[] = [...messages, { role: "user", content: texte }];
    setMessages(suivant);
    setEnvoi(true);
    try {
      const chemin = mode === "public" ? "/public/chatbot" : "/assistant/chat";
      const r = await apiRequest<{ reponse: string }>(chemin, {
        method: "POST",
        body: { message: texte, historique: suivant.slice(-8) },
      });
      setMessages((m) => [...m, { role: "assistant", content: r.reponse }]);
    } catch {
      setMessages((m) => [
        ...m,
        { role: "assistant", content: "Je n'arrive pas à répondre pour le moment. Réessayez dans un instant, ou écrivez-nous via la page Contact." },
      ]);
    } finally {
      setEnvoi(false);
    }
  }

  return (
    <>
      {/* Bouton flottant */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Fermer l'assistant Lex" : "Ouvrir l'assistant Lex"}
        className="fixed bottom-5 right-5 z-50 grid size-14 place-items-center rounded-full bg-primary text-primary-foreground shadow-card transition-transform hover:scale-105"
      >
        {open ? <X className="size-6" /> : <MessageCircle className="size-6" />}
      </button>

      {/* Panneau */}
      {open ? (
        <div
          role="dialog"
          aria-label="Assistant Lex"
          className="fixed bottom-24 right-5 z-50 flex h-[480px] w-[min(380px,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-card"
        >
          <div className="flex items-center gap-2.5 border-b border-border bg-primary px-4 py-3 text-primary-foreground">
            <span className="grid size-8 place-items-center rounded-full bg-white/15">
              <Sparkles className="size-4" />
            </span>
            <div>
              <p className="text-sm font-semibold leading-tight">Lex — l'assistant Les Extras</p>
              <p className="text-[11px] text-primary-foreground/75">
                {mode === "public" ? "Questions sur la plateforme" : "Aide sur votre espace"}
              </p>
            </div>
          </div>

          {locked ? (
            <div className="grid flex-1 place-items-center p-6 text-center">
              <div>
                <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-primary-soft text-primary">
                  <Lock className="size-5" />
                </span>
                <p className="mt-3 font-semibold text-foreground">LEX est réservé aux adhérents</p>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  L'assistant d'écriture, le générateur d'activités et ce bot d'aide sont inclus
                  dans l'adhésion. L'usage interne de la plateforme reste gratuit.
                </p>
                <a
                  href="/dashboard/adhesion"
                  className="mt-4 inline-flex h-10 items-center justify-center rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground hover:opacity-90"
                >
                  Devenir adhérent
                </a>
              </div>
            </div>
          ) : (
          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {messages.length === 0 ? (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Bonjour ! Posez-moi une question{mode === "public" ? " sur les ateliers, formations, tarifs ou le fonctionnement de la plateforme." : " : je vous guide pas à pas dans votre espace."}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {(mode === "public"
                    ? ["Combien coûte un atelier ?", "C'est quoi le SOS Renfort ?", "Comment demander un devis ?"]
                    : ["Comment publier un renfort ?", "Où sont mes factures ?", "Comment créer un atelier ?"]
                  ).map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => { setSaisie(q); }}
                      className="rounded-full border border-border bg-background px-2.5 py-1 text-xs text-foreground/80 hover:border-primary/40 hover:text-primary"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
            {messages.map((m, i) => (
              <div key={i} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2 text-sm leading-relaxed",
                    m.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground",
                  )}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {envoi ? (
              <div className="flex justify-start">
                <div className="rounded-2xl bg-muted px-3.5 py-2 text-sm text-muted-foreground">…</div>
              </div>
            ) : null}
            <div ref={finRef} />
          </div>
          )}

          {locked ? null : (
          <form onSubmit={envoyer} className="flex items-center gap-2 border-t border-border p-3">
            <input
              value={saisie}
              onChange={(e) => setSaisie(e.target.value)}
              placeholder="Votre question…"
              aria-label="Votre question"
              className="h-10 flex-1 rounded-full border border-border bg-background px-3.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
            />
            <button
              type="submit"
              disabled={envoi || !saisie.trim()}
              aria-label="Envoyer"
              className="grid size-10 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground disabled:opacity-50"
            >
              <Send className="size-4" />
            </button>
          </form>
          )}
          <p className="border-t border-border/60 px-3 py-1.5 text-center text-[10px] text-muted-foreground">
            Réponses générées par IA — vérifiez les informations importantes.
          </p>
        </div>
      ) : null}
    </>
  );
}
