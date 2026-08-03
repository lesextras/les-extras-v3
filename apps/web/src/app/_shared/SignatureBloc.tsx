"use client";

/**
 * LA SIGNATURE ÉLECTRONIQUE, CÔTÉ ÉCRAN.
 *
 * Deux gestes, séparés parce qu'ils n'appartiennent pas aux mêmes personnes :
 * l'établissement met le document à la signature, le signataire saisit le
 * code qu'il a reçu par courriel.
 *
 * Le bloc dit franchement de quelle signature il s'agit. Une signature
 * électronique simple avec faisceau de preuves est parfaitement valable —
 * l'article 1367 du code civil la reconnaît — mais elle ne bénéficie pas de
 * la présomption attachée à la signature qualifiée. Laisser croire le
 * contraire serait le genre de mensonge qui se découvre le jour d'un litige.
 */
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { apiRequest } from "@/lib/api";
import { Field, Textarea } from "./form-fields";

export type StatutSignature = "EN_ATTENTE" | "SIGNEE" | "REFUSEE" | "EXPIREE" | "ANNULEE";

export interface SignatureLigne {
  id: string;
  signataireNom: string;
  signataireEmail: string;
  statut: StatutSignature;
  signeLe: string | null;
  refuseLe: string | null;
  motifRefus: string | null;
  empreinte: string;
  prestataire: string | null;
  createdAt: string;
}

const ETAT: Record<StatutSignature, { label: string; variant: "success" | "warning" | "muted" | "destructive" }> = {
  EN_ATTENTE: { label: "En attente de signature", variant: "warning" },
  SIGNEE: { label: "Signé", variant: "success" },
  REFUSEE: { label: "Refusé", variant: "destructive" },
  EXPIREE: { label: "Expiré", variant: "muted" },
  ANNULEE: { label: "Annulé", variant: "muted" },
};

function Ligne({
  s,
  accountId,
  onChangement,
}: {
  s: SignatureLigne;
  accountId: string;
  onChangement: () => void;
}) {
  const { toast } = useToast();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [ouvert, setOuvert] = useState(false);
  const etat = ETAT[s.statut];

  async function action(chemin: string, corps?: Record<string, unknown>) {
    setBusy(true);
    setErreur(null);
    try {
      await apiRequest(`/signatures/${s.id}${chemin}`, {
        method: "POST",
        accountId,
        body: corps ?? {},
      });
      return true;
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Action impossible");
      return false;
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-xl border border-border p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-medium text-foreground">{s.signataireNom}</p>
          <p className="text-xs text-muted-foreground">{s.signataireEmail}</p>
          {s.signeLe ? (
            <p className="mt-1 text-xs text-muted-foreground">
              Signé le{" "}
              {new Date(s.signeLe).toLocaleString("fr-FR", {
                dateStyle: "long",
                timeStyle: "short",
              })}
            </p>
          ) : null}
          {s.motifRefus ? (
            <p className="mt-1 max-w-prose rounded-md bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
              Motif du refus : {s.motifRefus}
            </p>
          ) : null}
          {/* L'empreinte est ce qui prouve qu'on a signé CE texte. On la
              montre : elle se recopie dans un dossier prud'homal. */}
          <p className="mt-1 font-mono text-[11px] text-muted-foreground/70">
            empreinte {s.empreinte.slice(0, 24)}…
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <Badge variant={etat.variant}>{etat.label}</Badge>
          {s.statut === "SIGNEE" ? (
            <Button asChild size="sm" variant="outline">
              <a href={`/api/proxy/signatures/${s.id}/dossier`} target="_blank" rel="noopener">
                Dossier de preuve
              </a>
            </Button>
          ) : null}
          {s.statut === "EN_ATTENTE" ? (
            <Button size="sm" variant="outline" onClick={() => setOuvert((o) => !o)}>
              {ouvert ? "Fermer" : "Saisir le code"}
            </Button>
          ) : null}
        </div>
      </div>

      {ouvert && s.statut === "EN_ATTENTE" ? (
        <div className="mt-4 space-y-3 border-t border-border pt-4">
          <p className="text-xs text-muted-foreground">
            Un code à six chiffres a été envoyé à {s.signataireEmail}. Il est valable quinze
            minutes et ne sert qu&apos;une fois.
          </p>
          <div className="flex flex-wrap items-end gap-2">
            <Field label="Code reçu par courriel" htmlFor={`code-${s.id}`}>
              <Input
                id={`code-${s.id}`}
                inputMode="numeric"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                placeholder="000000"
                className="w-32 text-center font-mono text-lg tracking-[0.4em]"
              />
            </Field>
            <Button
              size="sm"
              disabled={busy || code.length !== 6}
              onClick={async () => {
                if (await action("/signer", { code })) {
                  toast({
                    title: "Document signé",
                    description: "Le dossier de preuve est disponible.",
                  });
                  onChangement();
                }
              }}
            >
              {busy ? "…" : "Signer"}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              disabled={busy}
              onClick={async () => {
                if (await action("/code")) {
                  toast({ title: "Nouveau code envoyé" });
                }
              }}
            >
              Renvoyer un code
            </Button>
          </div>

          {erreur ? <p className="text-sm text-destructive">{erreur}</p> : null}

          <details className="text-xs">
            <summary className="cursor-pointer text-muted-foreground">
              Je ne souhaite pas signer
            </summary>
            <div className="mt-2 space-y-2">
              <Textarea
                id={`motif-${s.id}`}
                rows={2}
                placeholder="Motif du refus (facultatif)"
                onChange={(e) => setCode((c) => c)}
              />
              <Button
                size="sm"
                variant="outline"
                disabled={busy}
                onClick={async () => {
                  const el = document.getElementById(`motif-${s.id}`) as HTMLTextAreaElement | null;
                  if (await action("/refuser", { motif: el?.value || undefined })) {
                    toast({ title: "Refus enregistré" });
                    onChangement();
                  }
                }}
              >
                Refuser de signer
              </Button>
            </div>
          </details>
        </div>
      ) : null}
    </div>
  );
}

export function SignatureBloc({
  documentType,
  documentId,
  accountId,
  signatures,
  prestataireActif,
  signatairesProposes,
  peutDemander,
}: {
  documentType: "CONTRAT_CDD" | "PROPOSITION" | "DEVIS";
  documentId: string;
  accountId: string;
  signatures: SignatureLigne[];
  prestataireActif: string | null;
  /** Les personnes qu'on propose de faire signer, sans les ressaisir. */
  signatairesProposes?: { nom: string; email: string; userId?: string }[];
  peutDemander: boolean;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [ouvert, setOuvert] = useState(false);

  async function demander(nom: string, email: string, userId?: string) {
    setBusy(true);
    setErreur(null);
    try {
      await apiRequest("/signatures", {
        method: "POST",
        accountId,
        body: { documentType, documentId, signataireNom: nom, signataireEmail: email, userId },
      });
      toast({
        title: "Demande envoyée",
        description: `Un code de signature vient d'être adressé à ${email}.`,
      });
      setOuvert(false);
      router.refresh();
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Envoi impossible");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardHeader className="space-y-2">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h3 className="font-semibold text-foreground">Signature électronique</h3>
            <p className="text-xs text-muted-foreground">
              {prestataireActif
                ? `Signature recueillie par ${prestataireActif}.`
                : "Signature électronique simple, avec faisceau de preuves."}
            </p>
          </div>
          {peutDemander ? (
            <Button size="sm" onClick={() => setOuvert((o) => !o)}>
              {ouvert ? "Fermer" : "Mettre à la signature"}
            </Button>
          ) : null}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* La franchise sur la portée juridique. Elle protège autant
            l'établissement que la plateforme : un directeur qui sait ce qu'il
            a entre les mains ne sera pas surpris devant un conseil. */}
        {!prestataireActif ? (
          <p className="max-w-prose rounded-lg bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
            Ce que le logiciel recueille est une <strong>signature électronique simple</strong>{" "}
            accompagnée d&apos;un faisceau de preuves : empreinte du document, code à usage unique
            vérifié, horodatage, adresse de connexion, journal des étapes. Elle est valable —
            l&apos;article 1367 du code civil reconnaît la signature électronique dès lors que le
            procédé identifie son auteur et garantit son lien avec l&apos;acte. Elle ne bénéficie
            pas, en revanche, de la présomption de fiabilité attachée à la signature qualifiée :
            en cas de contestation, c&apos;est à celui qui l&apos;invoque de démontrer la
            fiabilité du procédé, et le dossier de preuve est fait pour cela. Pour une signature
            avancée, un prestataire de confiance peut être branché sans rien changer d&apos;autre.
          </p>
        ) : null}

        {ouvert && peutDemander ? (
          <div className="space-y-3 rounded-xl border border-dashed border-border p-4">
            {signatairesProposes && signatairesProposes.length > 0 ? (
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">Qui doit signer ?</p>
                {signatairesProposes.map((s) => (
                  <div
                    key={s.email}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border px-3 py-2"
                  >
                    <span className="min-w-0 truncate text-sm">
                      {s.nom} <span className="text-muted-foreground">· {s.email}</span>
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busy}
                      onClick={() => demander(s.nom, s.email, s.userId)}
                    >
                      Envoyer le code
                    </Button>
                  </div>
                ))}
              </div>
            ) : null}

            <form
              className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr_auto]"
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                const nom = String(fd.get("nom") || "").trim();
                const email = String(fd.get("email") || "").trim();
                if (nom && email) void demander(nom, email);
              }}
            >
              <Field label="Nom du signataire" htmlFor="sig-nom">
                <Input id="sig-nom" name="nom" required />
              </Field>
              <Field label="Adresse électronique" htmlFor="sig-email">
                <Input id="sig-email" name="email" type="email" required />
              </Field>
              <div className="flex items-end">
                <Button type="submit" size="sm" disabled={busy}>
                  {busy ? "…" : "Envoyer"}
                </Button>
              </div>
            </form>

            {erreur ? <p className="text-sm text-destructive">{erreur}</p> : null}
          </div>
        ) : null}

        {signatures.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Aucune signature demandée pour ce document.
          </p>
        ) : (
          <div className="space-y-3">
            {signatures.map((s) => (
              <Ligne key={s.id} s={s} accountId={accountId} onChangement={() => router.refresh()} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
