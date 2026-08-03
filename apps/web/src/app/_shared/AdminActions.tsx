"use client";

// Actions de modération (back-office ADMIN).
//   PATCH /admin/missions/:id/moderate  { status: MissionStatus }
//   PATCH /admin/services/:id/moderate  { status: ServiceStatus }
//   PATCH /admin/users/:id/ban          { reason? }
//   PATCH /admin/users/:id/unban
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { apiRequest } from "@/lib/api";

export function ModerateMissionActions({
  missionId,
  accountId,
  status,
}: {
  missionId: string;
  accountId?: string;
  status?: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState<string | null>(null);

  async function moderate(next: "PUBLISHED" | "CLOSED", label: string) {
    setLoading(next);
    try {
      await apiRequest(`/admin/missions/${missionId}/moderate`, {
        method: "PATCH",
        body: { status: next },
        accountId,
      });
      toast({ title: label });
      router.refresh();
    } catch (err) {
      toast({
        title: "Action impossible",
        description: err instanceof Error ? err.message : undefined,
        variant: "error",
      });
    } finally {
      setLoading(null);
    }
  }

  async function remove() {
    // Une suppression est définitive : un clic malheureux dans une liste ne
    // doit pas suffire à faire disparaître une mission.
    if (!window.confirm("Supprimer définitivement cette mission ? Cette action est irréversible.")) return;
    setLoading("del");
    try {
      await apiRequest(`/admin/missions/${missionId}`, { method: "DELETE", accountId });
      toast({ title: "Mission supprimée" });
      router.refresh();
    } catch (err) {
      toast({ title: "Suppression impossible", description: err instanceof Error ? err.message : undefined, variant: "error" });
    } finally {
      setLoading(null);
    }
  }

  const voirBtn = (
    <Button asChild size="sm" variant="outline">
      <Link href={`/admin/missions/${missionId}`}>Voir</Link>
    </Button>
  );

  const delBtn = (
    <Button
      size="sm"
      variant="ghost"
      className="text-destructive hover:text-destructive"
      disabled={loading !== null}
      onClick={remove}
    >
      {loading === "del" ? "…" : "Supprimer"}
    </Button>
  );

  // Missions déjà clôturées / annulées : on ne propose que la (ré)ouverture.
  if (status === "CLOSED" || status === "CANCELLED") {
    return (
      <div className="flex justify-end gap-2">
        {voirBtn}
        <Button
          size="sm"
          variant="outline"
          disabled={loading !== null}
          onClick={() => moderate("PUBLISHED", "Mission republiée")}
        >
          {loading === "PUBLISHED" ? "…" : "Republier"}
        </Button>
        {delBtn}
      </div>
    );
  }

  // Mission déjà publiée : « Approuver » n'a plus de sens — on ne propose que
  // la dépublication (et la suppression).
  if (status === "PUBLISHED" || status === "FILLED") {
    return (
      <div className="flex justify-end gap-2">
        {voirBtn}
        <Button
          size="sm"
          variant="outline"
          className="text-destructive hover:text-destructive"
          disabled={loading !== null}
          onClick={() => moderate("CLOSED", "Mission dépubliée")}
        >
          {loading === "CLOSED" ? "…" : "Dépublier"}
        </Button>
        {delBtn}
      </div>
    );
  }

  return (
    <div className="flex justify-end gap-2">
      {voirBtn}
      <Button
        size="sm"
        disabled={loading !== null}
        onClick={() => moderate("PUBLISHED", "Mission approuvée")}
      >
        {loading === "PUBLISHED" ? "…" : "Approuver"}
      </Button>
      <Button
        size="sm"
        variant="outline"
        className="text-destructive hover:text-destructive"
        disabled={loading !== null}
        onClick={() => moderate("CLOSED", "Mission rejetée")}
      >
        {loading === "CLOSED" ? "…" : "Rejeter"}
      </Button>
      {delBtn}
    </div>
  );
}

export function ModerateServiceActions({
  serviceId,
  accountId,
  status,
}: {
  serviceId: string;
  accountId?: string;
  status?: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState<string | null>(null);

  async function moderate(next: "PUBLISHED" | "ARCHIVED", label: string) {
    setLoading(next);
    try {
      await apiRequest(`/admin/services/${serviceId}/moderate`, {
        method: "PATCH",
        body: { status: next },
        accountId,
      });
      toast({ title: label });
      router.refresh();
    } catch (err) {
      toast({
        title: "Action impossible",
        description: err instanceof Error ? err.message : undefined,
        variant: "error",
      });
    } finally {
      setLoading(null);
    }
  }

  async function remove() {
    if (!window.confirm("Supprimer définitivement cet atelier ? Cette action est irréversible.")) return;
    setLoading("del");
    try {
      await apiRequest(`/admin/services/${serviceId}`, { method: "DELETE", accountId });
      toast({ title: "Atelier supprimé" });
      router.refresh();
    } catch (err) {
      toast({ title: "Suppression impossible", description: err instanceof Error ? err.message : undefined, variant: "error" });
    } finally {
      setLoading(null);
    }
  }

  const voirBtn = (
    <Button asChild size="sm" variant="outline">
      <Link href={`/admin/ateliers/${serviceId}`}>Voir</Link>
    </Button>
  );

  const delBtn = (
    <Button
      size="sm"
      variant="ghost"
      className="text-destructive hover:text-destructive"
      disabled={loading !== null}
      onClick={remove}
    >
      {loading === "del" ? "…" : "Supprimer"}
    </Button>
  );

  if (status === "ARCHIVED") {
    return (
      <div className="flex justify-end gap-2">
        {voirBtn}
        <Button
          size="sm"
          variant="outline"
          disabled={loading !== null}
          onClick={() => moderate("PUBLISHED", "Atelier republié")}
        >
          {loading === "PUBLISHED" ? "…" : "Republier"}
        </Button>
        {delBtn}
      </div>
    );
  }

  // Atelier déjà publié : « Approuver » n'a plus de sens — on ne propose que
  // l'archivage (et la suppression).
  if (status === "PUBLISHED") {
    return (
      <div className="flex justify-end gap-2">
        {voirBtn}
        <Button
          size="sm"
          variant="outline"
          disabled={loading !== null}
          onClick={() => moderate("ARCHIVED", "Atelier archivé")}
        >
          {loading === "ARCHIVED" ? "…" : "Archiver"}
        </Button>
        {delBtn}
      </div>
    );
  }

  return (
    <div className="flex justify-end gap-2">
      {voirBtn}
      <Button
        size="sm"
        disabled={loading !== null}
        onClick={() => moderate("PUBLISHED", "Atelier approuvé")}
      >
        {loading === "PUBLISHED" ? "…" : "Approuver"}
      </Button>
      <Button
        size="sm"
        variant="outline"
        className="text-destructive hover:text-destructive"
        disabled={loading !== null}
        onClick={() => moderate("ARCHIVED", "Atelier archivé")}
      >
        {loading === "ARCHIVED" ? "…" : "Archiver"}
      </Button>
      {delBtn}
    </div>
  );
}

export function InvoiceStatusActions({
  invoiceId,
  status,
}: {
  invoiceId: string;
  status: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState<string | null>(null);

  async function setStatus(next: string, label: string) {
    setLoading(next);
    try {
      await apiRequest(`/admin/invoices/${invoiceId}/status`, {
        method: "PATCH",
        body: { status: next },
      });
      toast({ title: label });
      router.refresh();
    } catch (err) {
      toast({ title: "Action impossible", description: err instanceof Error ? err.message : undefined, variant: "error" });
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="flex justify-end gap-2">
      {status !== "PAID" ? (
        <Button size="sm" disabled={loading !== null} onClick={() => setStatus("PAID", "Facture marquée payée")}>
          {loading === "PAID" ? "…" : "Marquer payée"}
        </Button>
      ) : null}
      {status === "DRAFT" ? (
        <Button size="sm" variant="outline" disabled={loading !== null} onClick={() => setStatus("ISSUED", "Facture émise")}>
          {loading === "ISSUED" ? "…" : "Émettre"}
        </Button>
      ) : null}
    </div>
  );
}

export function UserStatusActions({
  userId,
  status,
  accountId,
}: {
  userId: string;
  status: string;
  accountId?: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState<string | null>(null);

  async function toggle(action: "ban" | "unban") {
    if (
      action === "ban" &&
      !window.confirm("Bannir cet utilisateur ? Il ne pourra plus se connecter tant qu'il n'est pas réactivé.")
    ) {
      return;
    }
    setLoading(action);
    try {
      await apiRequest(`/admin/users/${userId}/${action}`, {
        method: "PATCH",
        body: action === "ban" ? {} : undefined,
        accountId,
      });
      toast({ title: action === "ban" ? "Utilisateur banni" : "Utilisateur réactivé" });
      router.refresh();
    } catch (err) {
      toast({
        title: "Action impossible",
        description: err instanceof Error ? err.message : undefined,
        variant: "error",
      });
    } finally {
      setLoading(null);
    }
  }

  // Compte anonymisé (droit à l'effacement) : ni bannissement ni réactivation.
  if (status === "ANONYMIZED") {
    return <span className="text-xs text-muted-foreground">Effacé sur demande</span>;
  }
  if (status === "BANNED") {
    return (
      <Button size="sm" variant="outline" disabled={loading !== null} onClick={() => toggle("unban")}>
        {loading === "unban" ? "…" : "Réactiver"}
      </Button>
    );
  }
  return (
    <Button
      size="sm"
      variant="ghost"
      className="text-destructive hover:text-destructive"
      disabled={loading !== null}
      onClick={() => toggle("ban")}
    >
      {loading === "ban" ? "…" : "Bannir"}
    </Button>
  );
}
