"use client";

// Import d'équipe par CSV : email;prénom;nom;rôle (une ligne par personne).
// Le fichier est lu dans le navigateur, l'API reçoit la liste et envoie les
// invitations une par une — une adresse invalide n'annule pas les autres.
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { apiRequest } from "@/lib/api";

const ROLES_VALIDES = new Set(["ADMIN", "MANAGER", "MEMBER"]);

function parser(texte: string) {
  return texte
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !l.toLowerCase().startsWith("email"))
    .map((l) => {
      const [email, , , role] = l.split(/[;,\t]/).map((c) => (c ?? "").trim());
      const r = (role || "MEMBER").toUpperCase();
      return { email, role: ROLES_VALIDES.has(r) ? r : "MEMBER" };
    })
    .filter((l) => l.email.includes("@"));
}

export function ImportEquipeCsv({ accountId }: { accountId: string }) {
  const { toast } = useToast();
  const router = useRouter();
  const fichier = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function importer(f: File) {
    setBusy(true);
    try {
      const lignes = parser(await f.text());
      if (lignes.length === 0) {
        toast({
          title: "Aucune ligne exploitable",
          description: "Format attendu : email;prénom;nom;rôle — une personne par ligne.",
          variant: "error",
        });
        return;
      }
      const res = await apiRequest<{ envoyees: number; ignorees: { email: string; raison: string }[] }>(
        "/invitations/lot",
        { method: "POST", accountId, body: { lignes } },
      );
      toast({
        title: `${res.envoyees} invitation${res.envoyees > 1 ? "s" : ""} envoyée${res.envoyees > 1 ? "s" : ""}`,
        description:
          res.ignorees.length > 0
            ? `${res.ignorees.length} ligne(s) ignorée(s) : ${res.ignorees.map((i) => i.email).join(", ")}`
            : "Toute l'équipe a été invitée.",
      });
      router.refresh();
    } catch (err) {
      toast({
        title: "Import impossible",
        description: err instanceof Error ? err.message : undefined,
        variant: "error",
      });
    } finally {
      setBusy(false);
      if (fichier.current) fichier.current.value = "";
    }
  }

  return (
    <>
      <input
        ref={fichier}
        type="file"
        accept=".csv,text/csv,text/plain"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void importer(f);
        }}
      />
      <Button size="sm" variant="outline" disabled={busy} onClick={() => fichier.current?.click()}>
        {busy ? "Import…" : "Importer l'équipe (CSV)"}
      </Button>
    </>
  );
}
