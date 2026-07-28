// Écran « Réservé aux adhérents » — style HubSpot : la fonctionnalité est
// visible et expliquée, l'accès demande l'adhésion. L'interne reste gratuit.
import Link from "next/link";
import { Lock, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AdherentGate({ titre, description, benefices }: {
  titre: string;
  description: string;
  benefices: string[];
}) {
  return (
    <div className="mx-auto max-w-2xl rounded-3xl border border-primary/20 bg-card p-8 text-center shadow-soft md:p-12">
      <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-primary-soft text-primary">
        <Lock className="size-6" />
      </span>
      <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-primary">
        Fonctionnalité LEX · réservée aux adhérents
      </p>
      <h2 className="mt-2 text-2xl font-bold tracking-tight md:text-3xl">{titre}</h2>
      <p className="mx-auto mt-3 max-w-lg text-muted-foreground">{description}</p>
      <ul className="mx-auto mt-6 max-w-md space-y-2 text-left">
        {benefices.map((b) => (
          <li key={b} className="flex items-start gap-2.5 text-sm">
            <Check className="mt-0.5 size-4 shrink-0 text-success" />
            <span>{b}</span>
          </li>
        ))}
      </ul>
      <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
        <Button asChild size="lg">
          <Link href="/dashboard/credits">Devenir adhérent — dès 149 € / mois</Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href="/contact">Parler à l'équipe</Link>
        </Button>
      </div>
      <p className="mt-6 text-xs text-muted-foreground">
        L'usage interne de la plateforme (missions à votre équipe, formation interne, planning,
        gestion) reste gratuit. Les prestations externes sont facturées à l'usage.
      </p>
    </div>
  );
}
