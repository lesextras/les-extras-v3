// 404 marketplace : offre introuvable.
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function MarketplaceNotFound() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold text-foreground">Offre introuvable</h2>
        <p className="text-sm text-muted-foreground">
          Cette offre n'existe plus ou n'est plus disponible.
        </p>
      </div>
      <Button asChild>
        <Link href="/marketplace">Retour au marketplace</Link>
      </Button>
    </div>
  );
}
