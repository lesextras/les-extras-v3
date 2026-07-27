"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createQuote } from "@/actions/quote-actions";
import { toast } from "sonner";
import { FileText, Loader2 } from "lucide-react";

interface QuoteCreationModalProps {
    trigger?: React.ReactNode;
    initialData?: {
        establishmentId?: string;
        description?: string;
    };
}

export function QuoteCreationModal({ trigger, initialData }: QuoteCreationModalProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    async function handleSubmit(formData: FormData) {
        setLoading(true);
        const result = await createQuote(formData);
        setLoading(false);

        if (result.error) {
            toast.error(result.error);
        } else {
            toast.success("Proposition envoyée avec succès !");
            setOpen(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button className="gap-2">
                        <FileText className="h-4 w-4" />
                        Émettre une proposition
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Nouvelle Proposition via Devis</DialogTitle>
                    <DialogDescription>
                        Créez une proposition pour un établissement. Si acceptée, elle deviendra une mission confirmée.
                    </DialogDescription>
                </DialogHeader>
                <form action={handleSubmit} className="grid gap-4 py-4">
                    {/* Mock Inputs for IDs for now, ideally Select or hidden */}
                    <div className="grid gap-2">
                        <Label htmlFor="establishmentId">ID Établissement (Demo)</Label>
                        <Input
                            id="establishmentId"
                            name="establishmentId"
                            placeholder="cl..."
                            required
                            defaultValue={initialData?.establishmentId}
                        />
                    </div>
                    {/* Freelance ID should be hidden/injected by server */}
                    <div className="grid gap-2">
                        <Label htmlFor="freelanceId">ID Freelance (Demo)</Label>
                        <Input id="freelanceId" name="freelanceId" placeholder="ta..." required />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="amount">Montant Total (€)</Label>
                        <Input id="amount" name="amount" type="number" step="0.01" required />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="dates">Dates</Label>
                        <div className="flex gap-2">
                            <Input type="datetime-local" name="startDate" required />
                            <Input type="datetime-local" name="endDate" required />
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="description">Détails de l'intervention</Label>
                        <Textarea
                            id="description"
                            name="description"
                            placeholder="Description de la mission..."
                            required
                            defaultValue={initialData?.description}
                        />
                    </div>

                    <DialogFooter>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Envoyer la proposition
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
