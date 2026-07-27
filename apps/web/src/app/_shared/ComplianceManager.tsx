"use client";

// Coffre-fort de conformité (ESTABLISHMENT) : liste des membres avec barre de
// complétude + alertes. On déplie un membre pour éditer chaque pièce
// (statut, date d'échéance, note) via PATCH /conformite/:userId/documents.
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { apiRequest } from "@/lib/api";
import { FileUpload, type FichierDepose } from "./FileUpload";

type DocType =
  | "IDENTITY"
  | "CRIMINAL_RECORD"
  | "DRIVING_LICENSE"
  | "IBAN"
  | "AUTOENTREPRENEUR"
  | "VITALE"
  | "OTHER";
type Status = "MISSING" | "PENDING" | "VALID" | "EXPIRED";

const TYPE_LABEL: Record<DocType, string> = {
  IDENTITY: "Carte nationale d'identité",
  CRIMINAL_RECORD: "Casier judiciaire (bulletin n°3)",
  DRIVING_LICENSE: "Permis de conduire",
  IBAN: "IBAN / RIB",
  AUTOENTREPRENEUR: "Attestation auto-entrepreneur (URSSAF)",
  VITALE: "Carte Vitale / attestation",
  OTHER: "Autre pièce",
};

const STATUS_META: Record<Status, { label: string; variant: "muted" | "warning" | "success" | "destructive" }> = {
  MISSING: { label: "Manquante", variant: "muted" },
  PENDING: { label: "En attente", variant: "warning" },
  VALID: { label: "Valide", variant: "success" },
  EXPIRED: { label: "Expirée", variant: "destructive" },
};

export interface Completeness {
  total: number;
  valid: number;
  pct: number;
  expiringSoon: number;
  missing: number;
}
export interface ComplianceUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  job: string | null;
}
export interface ComplianceMember {
  membershipRole: string;
  user: ComplianceUser;
  completeness: Completeness;
}
interface ComplianceDoc {
  id: string | null;
  type: DocType;
  label: string | null;
  status: Status;
  fileUrl: string | null;
  /** Fichier réellement déposé dans le dépôt privé (null si aucun). */
  fichier: FichierDepose | null;
  issuedAt: string | null;
  expiresAt: string | null;
  notes: string | null;
  required: boolean;
  expiringSoon: boolean;
  updatedAt: string | null;
}
interface UserDocsResponse {
  user: ComplianceUser;
  completeness: Completeness;
  documents: ComplianceDoc[];
}

function fullName(u: ComplianceUser): string {
  const name = [u.firstName, u.lastName].filter(Boolean).join(" ").trim();
  return name || u.email;
}
function initials(u: ComplianceUser): string {
  const a = u.firstName?.[0] ?? u.email[0] ?? "?";
  const b = u.lastName?.[0] ?? "";
  return `${a}${b}`.toUpperCase();
}
function toDateInput(iso: string | null): string {
  return iso ? iso.slice(0, 10) : "";
}

function ProgressBar({ pct }: { pct: number }) {
  const tone = pct >= 100 ? "bg-success" : pct >= 50 ? "bg-primary" : "bg-secondary";
  return (
    <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
      <div className={`h-full ${tone}`} style={{ width: `${Math.min(100, Math.max(0, pct))}%` }} />
    </div>
  );
}

function DocRow({
  doc,
  userId,
  accountId,
  canEdit,
  onSaved,
}: {
  doc: ComplianceDoc;
  userId: string;
  accountId: string;
  canEdit: boolean;
  onSaved: () => void;
}) {
  const { toast } = useToast();
  const [status, setStatus] = useState<Status>(doc.status);
  const [expiresAt, setExpiresAt] = useState(toDateInput(doc.expiresAt));
  const [issuedAt, setIssuedAt] = useState(toDateInput(doc.issuedAt));
  const [notes, setNotes] = useState(doc.notes ?? "");
  const [fichier, setFichier] = useState<FichierDepose | null>(doc.fichier ?? null);
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    try {
      await apiRequest(`/conformite/${userId}/documents`, {
        method: "PATCH",
        accountId,
        body: {
          type: doc.type,
          status,
          expiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined,
          issuedAt: issuedAt ? new Date(issuedAt).toISOString() : undefined,
          notes: notes || undefined,
          // Chaîne vide = on détache le fichier ; identifiant = on l'attache.
          fileId: fichier?.id ?? "",
        },
      });
      toast({ title: `${TYPE_LABEL[doc.type]} enregistrée` });
      onSaved();
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
    <div className="border-t border-border py-3">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-foreground">{TYPE_LABEL[doc.type]}</p>
          {doc.required ? (
            <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Obligatoire
            </span>
          ) : null}
          {doc.expiringSoon ? <Badge variant="warning">À renouveler</Badge> : null}
        </div>
        <Badge variant={STATUS_META[status].variant}>{STATUS_META[status].label}</Badge>
      </div>

      {canEdit ? (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-[9rem_1fr_1fr_auto] sm:items-end">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Statut</label>
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
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">
              {doc.type === "CRIMINAL_RECORD" ? "Date d'émission" : "Émise le"}
            </label>
            <Input type="date" value={issuedAt} onChange={(e) => setIssuedAt(e.target.value)} className="h-9" />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Échéance</label>
            <Input type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} className="h-9" />
          </div>
          <Button size="sm" onClick={save} disabled={busy}>
            {busy ? "…" : "Enregistrer"}
          </Button>
          <div className="space-y-1 sm:col-span-4">
            <label className="text-xs text-muted-foreground">Pièce justificative</label>
            <FileUpload
              famille="compliance"
              accountId={accountId}
              fichier={fichier}
              onChange={(f) => setFichier(f)}
              aide="PDF ou photo · 10 Mo maximum · visible seulement par les responsables du compte"
            />
          </div>
          <div className="space-y-1 sm:col-span-4">
            <label className="text-xs text-muted-foreground">Note</label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Remarque interne (facultatif)"
              className="h-9"
            />
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">
            {doc.expiresAt ? `Échéance : ${toDateInput(doc.expiresAt)}` : "Aucune échéance renseignée"}
            {doc.notes ? ` · ${doc.notes}` : ""}
          </p>
          {doc.fichier ? (
            <FileUpload
              famille="compliance"
              fichier={doc.fichier}
              onChange={() => undefined}
              disabled
            />
          ) : null}
        </div>
      )}
    </div>
  );
}

function MemberDocuments({
  userId,
  accountId,
  canEdit,
}: {
  userId: string;
  accountId: string;
  canEdit: boolean;
}) {
  const router = useRouter();
  const [data, setData] = useState<UserDocsResponse | null>(null);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setError(false);
    try {
      const res = await apiRequest<UserDocsResponse>(`/conformite/${userId}`, { accountId });
      setData(res);
    } catch {
      setError(true);
    }
  }, [userId, accountId]);

  useEffect(() => {
    void load();
  }, [load]);

  const onSaved = useCallback(() => {
    void load();
    router.refresh();
  }, [load, router]);

  if (error) {
    return <p className="py-4 text-sm text-destructive">Impossible de charger les pièces de ce membre.</p>;
  }
  if (!data) {
    return <p className="py-4 text-sm text-muted-foreground">Chargement des pièces…</p>;
  }

  return (
    <div className="mt-1">
      {data.documents.map((doc) => (
        <DocRow
          key={doc.type}
          doc={doc}
          userId={userId}
          accountId={accountId}
          canEdit={canEdit}
          onSaved={onSaved}
        />
      ))}
    </div>
  );
}

function MemberCard({
  member,
  accountId,
  canEdit,
}: {
  member: ComplianceMember;
  accountId: string;
  canEdit: boolean;
}) {
  const [open, setOpen] = useState(false);
  const c = member.completeness;

  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={member.user.avatarUrl ?? undefined} />
            <AvatarFallback>{initials(member.user)}</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium text-foreground">{fullName(member.user)}</p>
            <p className="text-xs text-muted-foreground">{member.user.job ?? "Intervenant"}</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => setOpen((v) => !v)}>
          {open ? "Réduire" : "Gérer les pièces"}
        </Button>
      </div>

      <div className="mt-4 space-y-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Dossier complété</span>
          <span className="font-semibold text-foreground">
            {c.valid}/{c.total} · {c.pct}%
          </span>
        </div>
        <ProgressBar pct={c.pct} />
        <div className="flex flex-wrap gap-2 pt-1">
          {c.missing > 0 ? <Badge variant="muted">{c.missing} manquante(s)</Badge> : null}
          {c.expiringSoon > 0 ? <Badge variant="warning">{c.expiringSoon} à renouveler</Badge> : null}
          {c.pct === 100 && c.expiringSoon === 0 ? <Badge variant="success">Conforme</Badge> : null}
        </div>
      </div>

      {open ? (
        <MemberDocuments userId={member.user.id} accountId={accountId} canEdit={canEdit} />
      ) : null}
    </div>
  );
}

export function ComplianceManager({
  members,
  accountId,
  canEdit,
}: {
  members: ComplianceMember[];
  accountId: string;
  canEdit: boolean;
}) {
  if (members.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
        Aucun intervenant rattaché à ce compte pour le moment.
      </div>
    );
  }
  return (
    <div className="space-y-4">
      {members.map((m) => (
        <MemberCard key={m.user.id} member={m} accountId={accountId} canEdit={canEdit} />
      ))}
    </div>
  );
}
