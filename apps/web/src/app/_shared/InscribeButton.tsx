"use client";

// Inscrire un apprenant sur une session (parcours certifiant : établissement
// inscrit un salarié ; financement CPF/OPCO/établissement/perso).
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { apiRequest } from "@/lib/api";
import { Field } from "./form-fields";

const FINANCING = [
  { value: "ESTABLISHMENT", label: "Établissement (plan de développement des compétences)" },
  { value: "CPF", label: "CPF (Compte personnel de formation)" },
  { value: "OPCO", label: "OPCO" },
  { value: "PERSONAL", label: "Financement personnel" },
  { value: "POLE_EMPLOI", label: "France Travail" },
];

export function InscribeButton({
  sessionId,
  accountId,
  label = "Inscrire un apprenant",
}: {
  sessionId: string;
  accountId: string;
  label?: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [financing, setFinancing] = useState("ESTABLISHMENT");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    try {
      await apiRequest(`/formations/sessions/${sessionId}/inscriptions`, {
        method: "POST",
        accountId,
        body: {
          learnerName: String(fd.get("learnerName") || "") || undefined,
          learnerEmail: String(fd.get("learnerEmail") || "") || undefined,
          financing,
        },
      });
      toast({ title: "Apprenant inscrit", description: "L’inscription a été enregistrée." });
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Inscription impossible");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">{label}</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Inscrire un apprenant</DialogTitle>
          <DialogDescription>
            Renseignez le stagiaire et son mode de financement. Une convocation lui sera adressée.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <Field label="Nom de l’apprenant" htmlFor="learnerName" required>
            <Input id="learnerName" name="learnerName" required placeholder="Prénom Nom" />
          </Field>
          <Field
            label="Email"
            htmlFor="learnerEmail"
            hint="Pour l’envoi de la convocation et des documents de fin de formation."
          >
            <Input id="learnerEmail" name="learnerEmail" type="email" placeholder="apprenant@structure.fr" />
          </Field>
          <Field label="Financement" hint="Le CPF n’est mobilisable que sur les formations certifiantes.">
            <Select value={financing} onValueChange={setFinancing}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FINANCING.map((f) => (
                  <SelectItem key={f.value} value={f.value}>
                    {f.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          {error ? (
            <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          ) : null}
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Inscription…" : "Inscrire"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
