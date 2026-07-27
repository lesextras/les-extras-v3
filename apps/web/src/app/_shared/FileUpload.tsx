"use client";

// Composant de dépôt de fichier, réutilisé par le coffre-fort de conformité,
// les pièces jointes de mission, la photo de profil et les documents de
// formation. Il parle à l'API (POST /files/<famille>) via le proxy, qui
// transmet le fichier tel quel et vérifie les droits.
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Paperclip, Upload, X, FileText, Loader2 } from "lucide-react";

export type FamilleFichier = "compliance" | "mission" | "avatar" | "formation";

export interface FichierDepose {
  id: string;
  nom: string;
  type: string;
  taille: number;
  url: string;
}

/** Formats proposés dans le sélecteur, par famille. Le serveur revérifie. */
const ACCEPT: Record<FamilleFichier, string> = {
  compliance: ".pdf,.jpg,.jpeg,.png,.webp",
  mission: ".pdf,.jpg,.jpeg,.png,.webp,.docx",
  avatar: ".jpg,.jpeg,.png,.webp",
  formation: ".pdf,.jpg,.jpeg,.png,.webp,.docx,.pptx",
};

/** Taille maximale annoncée à l'utilisateur (Mo). Le serveur fait foi. */
const MAX_MO: Record<FamilleFichier, number> = {
  compliance: 10,
  mission: 10,
  avatar: 3,
  formation: 20,
};

export function poidsLisible(octets: number): string {
  if (octets < 1024) return `${octets} o`;
  if (octets < 1024 * 1024) return `${Math.round(octets / 1024)} Ko`;
  return `${(octets / (1024 * 1024)).toFixed(1)} Mo`;
}

export interface FileUploadProps {
  famille: FamilleFichier;
  /** Fichier déjà déposé, s'il y en a un. */
  fichier?: FichierDepose | null;
  /** Appelé après un dépôt réussi, ou avec `null` après retrait. */
  onChange: (fichier: FichierDepose | null) => void;
  /** Compte actif à transmettre (rattache le fichier au bon périmètre). */
  accountId?: string;
  label?: string;
  /** Phrase d'aide affichée sous le bouton. */
  aide?: string;
  disabled?: boolean;
}

export function FileUpload({
  famille,
  fichier,
  onChange,
  accountId,
  label = "Déposer un fichier",
  aide,
  disabled = false,
}: FileUploadProps) {
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [envoi, setEnvoi] = useState(false);
  const [survol, setSurvol] = useState(false);

  async function envoyer(f: File) {
    const maxOctets = MAX_MO[famille] * 1024 * 1024;
    if (f.size > maxOctets) {
      toast({
        title: "Fichier trop lourd",
        description: `${MAX_MO[famille]} Mo maximum pour ce type de document.`,
        variant: "error",
      });
      return;
    }

    setEnvoi(true);
    try {
      const corps = new FormData();
      corps.append("file", f);
      const entetes: Record<string, string> = {};
      if (accountId) entetes["x-account-id"] = accountId;

      const res = await fetch(`/api/proxy/files/${famille}`, {
        method: "POST",
        body: corps,
        credentials: "include",
        headers: entetes,
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          typeof data?.message === "string"
            ? data.message
            : "Le dépôt n’a pas abouti.",
        );
      }
      onChange(data as FichierDepose);
      toast({ title: "Document déposé" });
    } catch (err) {
      toast({
        title: "Dépôt impossible",
        description: err instanceof Error ? err.message : undefined,
        variant: "error",
      });
    } finally {
      setEnvoi(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  // ── Un fichier est déjà là : on l'affiche, avec ouverture et retrait ──
  if (fichier) {
    return (
      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2">
        <FileText aria-hidden="true" className="size-4 shrink-0 text-primary" />
        <a
          href={`/api/proxy/files/${fichier.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="min-w-0 flex-1 truncate text-sm font-medium text-foreground hover:underline"
          title={`Ouvrir ${fichier.nom}`}
        >
          {fichier.nom}
        </a>
        <span className="shrink-0 text-xs text-muted-foreground">
          {poidsLisible(fichier.taille)}
        </span>
        {!disabled && (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => onChange(null)}
            aria-label={`Retirer ${fichier.nom}`}
          >
            <X aria-hidden="true" className="size-4" />
          </Button>
        )}
      </div>
    );
  }

  // ── Aucun fichier : zone de dépôt ──
  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT[famille]}
        className="sr-only"
        disabled={disabled || envoi}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void envoyer(f);
        }}
      />
      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled && !envoi) setSurvol(true);
        }}
        onDragLeave={() => setSurvol(false)}
        onDrop={(e) => {
          e.preventDefault();
          setSurvol(false);
          if (disabled || envoi) return;
          const f = e.dataTransfer.files?.[0];
          if (f) void envoyer(f);
        }}
        className={[
          "flex flex-wrap items-center gap-2 rounded-lg border border-dashed px-3 py-2 transition-colors",
          survol ? "border-primary bg-primary-soft/50" : "border-border",
        ].join(" ")}
      >
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={disabled || envoi}
          onClick={() => inputRef.current?.click()}
        >
          {envoi ? (
            <>
              <Loader2 aria-hidden="true" className="mr-1.5 size-4 animate-spin" />
              Envoi en cours…
            </>
          ) : (
            <>
              <Upload aria-hidden="true" className="mr-1.5 size-4" />
              {label}
            </>
          )}
        </Button>
        <span className="text-xs text-muted-foreground">
          {aide ?? `ou glissez le fichier ici · ${MAX_MO[famille]} Mo maximum`}
        </span>
      </div>
    </div>
  );
}

/** Variante compacte : une simple pastille « joindre », pour les formulaires denses. */
export function FileUploadCompact(props: FileUploadProps) {
  return (
    <div className="space-y-1">
      {props.label && (
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Paperclip aria-hidden="true" className="size-3.5" />
          {props.label}
        </span>
      )}
      <FileUpload {...props} label="Choisir un fichier" />
    </div>
  );
}
