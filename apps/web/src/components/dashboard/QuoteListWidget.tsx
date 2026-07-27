"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { acceptQuote } from "@/actions/quotes";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, Check } from "lucide-react";
import type { SerializedQuote } from "@/actions/quotes";

export function QuoteListWidget({ quotes, error }: { quotes: SerializedQuote[]; error?: string | null }) {
    const router = useRouter();
    const [loadingId, setLoadingId] = useState<string | null>(null);

    if (error) {
        return <div className="text-sm text-muted-foreground">{error}</div>;
    }

    if (!quotes || quotes.length === 0) {
        return <div className="text-sm text-muted-foreground">Aucune proposition en attente.</div>;
    }

    async function handleAccept(id: string) {
        setLoadingId(id);
        const result = await acceptQuote(id);

        if (result.error) {
            toast.error(result.error);
            setLoadingId(null);
        } else {
            toast.success("Devis accepté ! Mission créée.");
            setLoadingId(null);
            router.refresh(); // Refresh to show new mission in dashboard
        }
    }

    return (
        <div className="space-y-4">
            {quotes.map((quote) => (
                <Card key={quote.id} className="border-l-4 border-l-blue-500">
                    <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                            <CardTitle className="text-base font-semibold">
                                {quote.freelance?.profile?.firstName} {quote.freelance?.profile?.lastName}
                            </CardTitle>
                            <Badge>{quote.amount} €</Badge>
                        </div>
                        <CardDescription className="text-xs">
                            {new Date(quote.startDate).toLocaleDateString()} - {new Date(quote.endDate).toLocaleDateString()}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pb-2 text-sm">
                        <p className="line-clamp-2">{quote.description}</p>
                    </CardContent>
                    <CardFooter className="pt-0 flex justify-end">
                        <Button
                            size="sm"
                            onClick={() => handleAccept(quote.id)}
                            disabled={loadingId === quote.id}
                        >
                            {loadingId === quote.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4 mr-1" />}
                            Accepter & Engager
                        </Button>
                    </CardFooter>
                </Card>
            ))}
        </div>
    );
}
