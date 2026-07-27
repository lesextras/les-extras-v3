"use client";

import { useState, useTransition, useEffect } from "react";
import { toast } from "sonner";
import { Euro, CalendarDays, FileText, Users, MessageSquare } from "lucide-react";
import { updateQuote, getMyQuotes, type SerializedQuote } from "@/app/actions/quotes";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useUIStore } from "@/lib/stores/useUIStore";

export function QuoteEditorModal() {
  const isOpen = useUIStore((s) => s.isQuoteEditorModalOpen);
  const quoteId = useUIStore((s) => s.quoteEditorQuoteId);
  const close = useUIStore((s) => s.closeQuoteEditorModal);

  const [quote, setQuote] = useState<SerializedQuote | null>(null);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (isOpen && quoteId) {
      // Load the quote from the list
      getMyQuotes().then((quotes) => {
        const q = quotes.find((q) => q.id === quoteId);
        if (q) {
          setQuote(q);
          setAmount(q.amount > 0 ? String(q.amount) : "");
          setDescription(q.description ?? "");
          setStartDate(q.startDate ? (q.startDate.split("T")[0] ?? "") : "");
          setEndDate(q.endDate ? (q.endDate.split("T")[0] ?? "") : "");
        }
      });
    }
  }, [isOpen, quoteId]);

  const handleClose = () => {
    close();
    setTimeout(() => {
      setQuote(null);
      setAmount("");
      setDescription("");
      setStartDate("");
      setEndDate("");
    }, 300);
  };

  const onSubmit = () => {
    if (!quoteId) return;
    const amountNum = Number(amount);
    if (!amountNum || amountNum <= 0) {
      toast.error("Veuillez saisir un montant valide.");
      return;
    }
    if (!description.trim()) {
      toast.error("La description du devis est requise.");
      return;
    }

    startTransition(async () => {
      const result = await updateQuote(quoteId, {
        amount: amountNum,
        description: description.trim(),
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });

      if ("error" in result) {
        toast.error(result.error);
      } else {
        toast.success("Devis envoyé au client !");
        handleClose();
      }
    });
  };

  const establishmentName = quote?.establishment?.profile?.companyName
    ?? `${quote?.establishment?.profile?.firstName ?? ""} ${quote?.establishment?.profile?.lastName ?? ""}`.trim()
    ?? "le client";

  return (
    <Dialog open={isOpen} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Rédiger le devis</DialogTitle>
          <DialogDescription>
            {quote?.service ? `Pour : ${quote.service.title}` : "Chargement…"}
          </DialogDescription>
        </DialogHeader>

        {/* Client request recap */}
        {quote?.booking && (
          <div className="rounded-lg bg-[hsl(var(--color-teal-50))] border border-[hsl(var(--color-teal-200))] p-3 text-sm space-y-1.5">
            <p className="font-medium text-[hsl(var(--color-teal-700))] text-xs uppercase tracking-wide">Demande de {establishmentName}</p>
            <div className="flex flex-wrap gap-3 text-[hsl(var(--teal-text))]">
              {quote.booking.scheduledAt && (
                <span className="flex items-center gap-1 text-xs">
                  <CalendarDays className="w-3.5 h-3.5" />
                  {new Date(quote.booking.scheduledAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}
                </span>
              )}
              {quote.booking.nbParticipants && (
                <span className="flex items-center gap-1 text-xs">
                  <Users className="w-3.5 h-3.5" />
                  {quote.booking.nbParticipants} participants
                </span>
              )}
            </div>
            {quote.booking.message && (
              <p className="flex items-start gap-1 text-xs text-[hsl(var(--teal-text))]">
                <MessageSquare className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                {quote.booking.message}
              </p>
            )}
          </div>
        )}

        <div className="space-y-4 py-1">
          <div className="space-y-2">
            <Label htmlFor="qe-amount" className="flex items-center gap-2">
              <Euro className="w-4 h-4 text-primary" />
              Montant du devis (€)
            </Label>
            <Input
              id="qe-amount"
              type="number"
              min={0}
              step={10}
              placeholder="Ex : 450"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="qe-desc" className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              Description du devis
            </Label>
            <Textarea
              id="qe-desc"
              placeholder="Détaillez les prestations incluses, les conditions, le déroulement…"
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="qe-start" className="flex items-center gap-2 text-xs">
                <CalendarDays className="w-3.5 h-3.5 text-primary" />
                Date de début
              </Label>
              <Input
                id="qe-start"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="qe-end" className="flex items-center gap-2 text-xs">
                <CalendarDays className="w-3.5 h-3.5 text-primary" />
                Date de fin
              </Label>
              <Input
                id="qe-end"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>Annuler</Button>
          <Button
            onClick={onSubmit}
            disabled={isPending}
          >
            {isPending ? "Envoi…" : "Envoyer le devis au client"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
