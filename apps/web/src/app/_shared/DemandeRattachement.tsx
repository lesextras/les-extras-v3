"use client";

/**
 * Demande de rattachement à un établissement.
 *
 * Recherche par nom, puis envoi. Une même personne peut se rattacher à
 * PLUSIEURS établissements — c'est le cas courant d'un remplaçant qui tourne
 * entre deux maisons — donc l'écran ne se referme pas après un envoi : il
 * propose d'en demander un autre.
 *
 * Le composant sert à deux endroits : l'étape « salarié » du wizard, et
 * l'écran d'attente du tableau de bord. Les deux disaient la même chose ; les
 * écrire deux fois aurait fini par les faire diverger.
 */
import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, Search, Send } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { apiRequest } from "@/lib/api";

interface Etablissement {
  id: string;
  name: string;
  city?: string | null;
}

export function DemandeRattachement({
  accountId,
  onEnvoyee,
}: {
  accountId: string;
  /** Appelé après un envoi réussi (rafraîchir la liste des demandes). */
  onEnvoyee?: () => void;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [recherche, setRecherche] = React.useState("");
  const [resultats, setResultats] = React.useState<Etablissement[]>([]);
  const [enRecherche, setEnRecherche] = React.useState(false);
  const [selection, setSelection] = React.useState<Etablissement | null>(null);
  const [envoi, setEnvoi] = React.useState(false);
  const [envoyees, setEnvoyees] = React.useState<string[]>([]);

  React.useEffect(() => {
    const terme = recherche.trim();
    if (terme.length < 2) {
      setResultats([]);
      return;
    }
    setEnRecherche(true);
    const t = setTimeout(async () => {
      try {
        setResultats(
          await apiRequest<Etablissement[]>(
            `/accounts/etablissements/recherche?q=${encodeURIComponent(terme)}`,
            { accountId },
          ),
        );
      } catch {
        setResultats([]);
      } finally {
        setEnRecherche(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [recherche, accountId]);

  async function envoyer() {
    if (!selection) return;
    setEnvoi(true);
    try {
      await apiRequest("/attachment-requests", {
        method: "POST",
        accountId,
        body: { establishmentAccountId: selection.id },
      });
      setEnvoyees((v) => [...v, selection.name]);
      toast({
        title: "Demande envoyée",
        description: `${selection.name} la verra dans son espace « Équipe ».`,
        variant: "success",
      });
      setSelection(null);
      setRecherche("");
      onEnvoyee?.();
      router.refresh();
    } catch (err) {
      toast({
        title: "Envoi impossible",
        description: err instanceof Error ? err.message : "Réessayez dans un instant.",
        variant: "error",
      });
    } finally {
      setEnvoi(false);
    }
  }

  return (
    <div className="space-y-4">
      {envoyees.length > 0 ? (
        <ul className="space-y-1.5">
          {envoyees.map((nom) => (
            <li key={nom} className="flex items-center gap-2 text-sm text-success">
              <Check className="size-4 shrink-0" />
              Demande envoyée à <span className="font-medium">{nom}</span>
            </li>
          ))}
        </ul>
      ) : null}

      <Input
        placeholder="Nom de l’établissement (MECS Les Tilleuls…)"
        leftIcon={<Search />}
        value={recherche}
        aria-label="Rechercher un établissement"
        onChange={(e) => {
          setRecherche(e.target.value);
          setSelection(null);
        }}
      />

      {enRecherche ? (
        <p className="text-sm text-muted-foreground">Recherche…</p>
      ) : resultats.length > 0 ? (
        <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border">
          {resultats.map((e) => (
            <li key={e.id}>
              <button
                type="button"
                onClick={() => setSelection(e)}
                className={`flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm transition-colors hover:bg-accent ${
                  selection?.id === e.id ? "bg-primary-soft" : ""
                }`}
              >
                <span className="min-w-0">
                  <span className="block truncate font-medium text-foreground">{e.name}</span>
                  {e.city ? (
                    <span className="block truncate text-xs text-muted-foreground">{e.city}</span>
                  ) : null}
                </span>
                {selection?.id === e.id ? (
                  <Check className="size-4 shrink-0 text-primary" />
                ) : null}
              </button>
            </li>
          ))}
        </ul>
      ) : recherche.trim().length >= 2 ? (
        <p className="text-sm text-muted-foreground">
          Aucun établissement de ce nom. Vérifiez l’orthographe, ou demandez à votre direction si
          elle a déjà créé son espace.
        </p>
      ) : null}

      <Button onClick={envoyer} disabled={!selection} loading={envoi}>
        <Send />
        {selection ? `Demander le rattachement à ${selection.name}` : "Choisissez un établissement"}
      </Button>
    </div>
  );
}
