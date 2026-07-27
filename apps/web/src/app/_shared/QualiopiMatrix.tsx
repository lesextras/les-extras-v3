"use client";

// Matrice de conformité Qualiopi : 7 critères / 32 indicateurs.
// Par indicateur : statut + intitulé de la preuve + lien, sauvegardés via
// PATCH /admin/qualiopi/indicators/:id/proof.
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { FileUpload, type FichierDepose } from "./FileUpload";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { apiRequest } from "@/lib/api";

type Status = "TODO" | "UPLOADED" | "VALIDATED" | "REJECTED";

const STATUS_META: Record<Status, { label: string; variant: "muted" | "warning" | "success" | "destructive" }> = {
  TODO: { label: "À faire", variant: "muted" },
  UPLOADED: { label: "Déposée", variant: "warning" },
  VALIDATED: { label: "Validée", variant: "success" },
  REJECTED: { label: "À revoir", variant: "destructive" },
};

interface Indicator {
  id: string;
  number: number;
  label: string;
  proof: { status: Status; label?: string | null; documentUrl?: string | null } | null;
}
interface Criterion {
  id: string;
  number: number;
  title: string;
  indicators: Indicator[];
}
interface Conformite {
  total: number;
  summary: Record<Status, number>;
  criteria: Criterion[];
}

function IndicatorRow({ indicator }: { indicator: Indicator }) {
  const router = useRouter();
  const { toast } = useToast();
  const [status, setStatus] = useState<Status>(indicator.proof?.status ?? "TODO");
  const [label, setLabel] = useState(indicator.proof?.label ?? "");
  const [url, setUrl] = useState(indicator.proof?.documentUrl ?? "");
  // Une preuve déjà déposée est reconnaissable à son adresse interne.
  const dejaDepose = url.startsWith("/api/proxy/files/");
  const [preuve, setPreuve] = useState<FichierDepose | null>(
    dejaDepose
      ? {
          id: url.split("/").pop() ?? "",
          nom: indicator.proof?.label || "Preuve déposée",
          type: "",
          taille: 0,
          url,
        }
      : null,
  );
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    try {
      await apiRequest(`/admin/qualiopi/indicators/${indicator.id}/proof`, {
        method: "PATCH",
        body: { status, label: label || undefined, documentUrl: url || undefined },
      });
      toast({ title: `Indicateur ${indicator.number} enregistré` });
      router.refresh();
    } catch (err) {
      toast({
        title: "Enregistrement impossible",
        description: err instanceof Error ? err.message : undefined,
        variant: "error",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-2 border-t border-border py-3 lg:grid-cols-[2.2rem_1fr_10rem_9rem_auto] lg:items-center lg:gap-3">
      <span className="text-xs font-semibold text-muted-foreground">#{indicator.number}</span>
      <p className="text-sm text-foreground">{indicator.label}</p>
      <Input
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        placeholder="Intitulé de la preuve"
        className="h-9"
      />
      <Select value={status} onValueChange={(v) => setStatus(v as Status)}>
        <SelectTrigger className="h-9">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {(Object.keys(STATUS_META) as Status[]).map((s) => (
            <SelectItem key={s} value={s}>
              {STATUS_META[s].label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button size="sm" onClick={save} disabled={busy}>
        {busy ? "…" : "Enregistrer"}
      </Button>
      <div className="lg:col-span-5">
        <FileUpload
          famille="formation"
          fichier={preuve}
          onChange={(f) => {
            setPreuve(f);
            // La preuve pointe vers la route protégée : elle n'est lisible
            // que par les personnes habilitées, jamais par une adresse publique.
            setUrl(f ? `/api/proxy/files/${f.id}` : "");
          }}
          label="Déposer la preuve"
          aide="PDF, image ou document bureautique · 20 Mo maximum"
        />
      </div>
    </div>
  );
}

export function QualiopiMatrix({ data }: { data: Conformite }) {
  const validated = data.summary.VALIDATED ?? 0;
  const pct = data.total ? Math.round((validated / data.total) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Synthèse */}
      <div className="rounded-lg border border-border bg-card p-5">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm font-semibold text-foreground">Conformité globale</p>
          <span className="text-sm text-muted-foreground">
            {validated}/{data.total} indicateurs validés
          </span>
        </div>
        <div className="h-2.5 overflow-hidden rounded-full bg-muted">
          <div className="h-full bg-success" style={{ width: `${pct}%` }} />
        </div>
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          <Badge variant="success">{data.summary.VALIDATED ?? 0} validées</Badge>
          <Badge variant="warning">{data.summary.UPLOADED ?? 0} déposées</Badge>
          <Badge variant="muted">{data.summary.TODO ?? 0} à faire</Badge>
          <Badge variant="destructive">{data.summary.REJECTED ?? 0} à revoir</Badge>
        </div>
      </div>

      {/* Critères */}
      {data.criteria.map((c) => (
        <div key={c.id} className="rounded-lg border border-border bg-card p-5">
          <h3 className="mb-1 font-semibold text-foreground">
            Critère {c.number} — {c.title}
          </h3>
          <div>
            {c.indicators.map((ind) => (
              <IndicatorRow key={ind.id} indicator={ind} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
