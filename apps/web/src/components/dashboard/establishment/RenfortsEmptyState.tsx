"use client";

import { EmptyState } from "@/components/ui/empty-state";
import { Users } from "lucide-react";
import { useUIStore } from "@/lib/stores/useUIStore";

export function RenfortsEmptyState() {
  const openRenfortModal = useUIStore((s) => s.openRenfortModal);

  return (
    <EmptyState
      icon={Users}
      title="Aucune mission en cours"
      description="Vous n'avez pas de demande de renfort active."
      primaryAction={{ label: "Publier un renfort", onClick: openRenfortModal }}
    />
  );
}
