"use client";

/**
 * MON DOSSIER — le coffre-fort vu du côté de l'intervenant.
 *
 * Le coffre-fort était unilatéral. L'établissement documentait l'intervenant,
 * et l'intervenant n'avait aucun accès à son propre dossier : ni pour voir ce
 * qui manquait, ni pour déposer sa carte d'identité. Un éducateur devait
 * envoyer son casier judiciaire par courriel et attendre que quelqu'un, à
 * l'autre bout, le saisisse à sa place.
 *
 * Le principe qui gouverne cet écran tient en une phrase : **vous fournissez,
 * la structure valide.** Une pièce que vous déposez repart toujours en
 * « en attente de vérification ». C'est ce qui donne sa valeur au tableau de
 * conformité de l'établissement : le vert y signifie que quelqu'un a regardé.
 */
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { apiRequest } from "@/lib/api";
import { Field } from "./form-fields";
import { FileUpload, type FichierDepose } from "./FileUpload";

import {
  TYPE_LABEL,
  TYPE_POURQUOI,
  STATUS_META,
  type DocType,
  type DocStatus,
} from "./conformite";

type Status = DocStatus;

export interface DocLigne {
  id?: string | null;
  type: DocType;
  status: Status;
  required?: boolean;
  label?: string | null;
  fileUrl?: string | null;
  fileId?: string | null;
  issuedAt?: string | null;
  expiresAt?: string | null;
  notes?: string | null;
  file?: { id: string; originalName: string; mimeType: string; size: number } | null;
}

export interface MonDossierData {
  user: { id: string; firstName: string | null; lastName: string | null; email: string };
  completeness: { total: number; valid: number; pct: number; expiringSoon: number; missing: number };
  documents: DocLigne[];
}

function Piece({
  doc,
  accountId,
  onFait,
}: {
  doc: DocLigne;
  accountId: string;
  onFait: () => void;
}) {
  const { toast } = useToast();
  const [ouvert, setOuvert] = useState(false);
  const [busy, setBusy] = useState(false);
  const [fichier, setFichier] = useState<FichierDepose | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const meta = STATUS_META[doc.status];

  async function deposer(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!fichier && !doc.file) {
      setErreur("Déposez d'abord le document.");
      return;
    }
    setBusy(true);
    setErreur(null);
    const fd = new FormData(e.currentTarget);
    try {
      await apiRequest("/conformite/mes-documents", {
        method: "PATCH",
        accountId,
        body: {
          type: doc.type,
          ...(fichier ? { fileId: fichier.id } : {}),
          issuedAt: String(fd.get("issuedAt") || "") || undefined,
          expiresAt: String(fd.get("expiresAt") || "") || undefined,
        },
      });
      toast({
        title: "Pièce déposée",
        description: "Elle passe en attente de vérification par la structure.",
      });
      setOuvert(false);
      setFichier(null);
      onFait();
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Dépôt impossible");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-xl border border-border p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium text-foreground">{TYPE_LABEL[doc.type]}</p>
            {doc.required ? <Badge variant="outline">Obligatoire</Badge> : null}
            <Badge variant={meta.variant}>{meta.labelIntervenant}</Badge>
          </div>
          <p className="text-xs text-muted-foreground">{meta.aide}</p>
          {TYPE_POURQUOI[doc.type] ? (
            <p className="max-w-prose text-xs text-muted-foreground/80">
              {TYPE_POURQUOI[doc.type]}
            </p>
          ) : null}
          {doc.file ? (
            <p className="text-xs text-muted-foreground">Fichier : {doc.file.originalName}</p>
          ) : null}
          {doc.expiresAt ? (
            <p className="text-xs text-muted-foreground">
              Valable jusqu'au {new Date(doc.expiresAt).toLocaleDateString("fr-FR")}
            </p>
          ) : null}
        </div>
        <Button size="sm" variant="outline" onClick={() => setOuvert((o) => !o)}>
          {ouvert ? "Fermer" : doc.file ? "Remplacer" : "Déposer"}
        </Button>
      </div>

      {ouvert ? (
        <form onSubmit={deposer} className="mt-4 space-y-3 border-t border-border pt-4">
          <FileUpload
            famille="compliance"
            accountId={accountId}
            fichier={fichier}
            onChange={(f) => setFichier(f)}
            aide="PDF ou photo lisible. Le fichier n'est accessible qu'à vous et aux responsables de la structure."
          />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field
              label="Délivrée le"
              htmlFor={`issuedAt-${doc.type}`}
              hint="Utile pour le casier judiciaire : il se renouvelle chaque année."
            >
              <Input
                id={`issuedAt-${doc.type}`}
                name="issuedAt"
                type="date"
                defaultValue={doc.issuedAt?.slice(0, 10) ?? ""}
              />
            </Field>
            <Field
              label="Valable jusqu'au"
              htmlFor={`expiresAt-${doc.type}`}
              hint="Passé cette date, la pièce passe automatiquement en « Périmée »."
            >
              <Input
                id={`expiresAt-${doc.type}`}
                name="expiresAt"
                type="date"
                defaultValue={doc.expiresAt?.slice(0, 10) ?? ""}
              />
            </Field>
          </div>
          {erreur ? <p className="text-sm text-destructive">{erreur}</p> : null}
          <div className="flex justify-end">
            <Button type="submit" size="sm" disabled={busy}>
              {busy ? "Envoi…" : "Envoyer la pièce"}
            </Button>
          </div>
        </form>
      ) : null}
    </div>
  );
}

export function MonDossier({ initial, accountId }: { initial: MonDossierData; accountId: string }) {
  const router = useRouter();
  const c = initial.completeness;
  const manquantes = initial.documents.filter(
    (d) => d.required && (d.status === "MISSING" || d.status === "EXPIRED"),
  );

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-border p-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-foreground">Dossier complété à {c.pct} %</p>
            <p className="text-xs text-muted-foreground">
              {c.valid} pièce{c.valid > 1 ? "s" : ""} vérifiée{c.valid > 1 ? "s" : ""} sur{" "}
              {c.total} obligatoire{c.total > 1 ? "s" : ""}
              {c.expiringSoon > 0
                ? ` · ${c.expiringSoon} arrive${c.expiringSoon > 1 ? "nt" : ""} à échéance`
                : ""}
            </p>
          </div>
          {manquantes.length > 0 ? (
            <Badge variant="warning">
              {manquantes.length} pièce{manquantes.length > 1 ? "s" : ""} à fournir
            </Badge>
          ) : (
            <Badge variant="success">Rien à fournir</Badge>
          )}
        </div>
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${Math.min(100, Math.max(0, c.pct))}%` }}
          />
        </div>
        {/* Dire à quoi ça sert, sinon remplir un dossier reste une corvée
            administrative de plus. Un dossier complet fait la différence au
            moment où un établissement choisit entre deux candidatures. */}
        <p className="mt-3 max-w-prose text-xs text-muted-foreground">
          Un dossier complet vous fait passer devant : un établissement qui doit couvrir un
          créneau demain ne prendra pas le risque d'attendre une attestation. Vous déposez, la
          structure vérifie — vous ne pouvez pas valider vos propres pièces, et c'est ce qui
          donne du poids à celles qui sont vérifiées.
        </p>
      </div>

      <div className="space-y-3">
        {initial.documents.map((doc) => (
          <Piece
            key={doc.type + (doc.id ?? "")}
            doc={doc}
            accountId={accountId}
            onFait={() => router.refresh()}
          />
        ))}
      </div>
    </div>
  );
}
