"use client";

// Panneau RGPD : exporter ses données personnelles, et demander la suppression
// de son compte. Deux zones volontairement séparées — l'une est anodine et
// réversible, l'autre est définitive : elles ne doivent jamais se confondre.
//
//   GET  /users/me/export            → fichier JSON téléchargeable (lien direct
//                                      vers le proxy same-origin, cookie inclus)
//   POST /users/me/deletion-request  → anonymisation (mot de passe + phrase)
import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { apiRequest } from "@/lib/api";
import { logout } from "@/lib/auth-client";
import { Field } from "./form-fields";
import { SectionTitle } from "./ui";

/** Doit correspondre exactement à DELETION_CONFIRMATION_PHRASE côté API. */
const CONFIRMATION_PHRASE = "SUPPRIMER MON COMPTE";

/** Ce qui est effacé — annoncé avant l'action, pas après. */
const EFFACE = [
  "Votre nom, prénom, e-mail, téléphone et photo, remplacés par des valeurs neutres",
  "Votre profil professionnel : métier, présentation, compétences, SIRET, ville, tarif",
  "Vos pièces de conformité : pièce d'identité, casier judiciaire, permis, IBAN, attestations",
  "Vos diplômes, expériences, disponibilités et notifications",
  "Vos ateliers publiés et vos missions encore ouvertes, retirés de la plateforme",
];

/** Ce qui reste — et pourquoi. Dit franchement, sans le noyer en bas de page. */
const CONSERVE = [
  {
    quoi: "Les factures et les heures de travail validées",
    pourquoi:
      "La loi impose de conserver les pièces comptables pendant 10 ans. Elles ne portent plus votre nom, mais les montants restent rattachés aux écritures des structures concernées.",
  },
  {
    quoi: "Les messages et les avis échangés après une mission",
    pourquoi:
      "Ces échanges appartiennent aussi à votre interlocuteur, qui garde le droit de consulter son propre historique.",
  },
  {
    quoi: "Vos dossiers de formation (inscriptions, émargements, attestations)",
    pourquoi:
      "La certification Qualiopi oblige l'organisme de formation à pouvoir les présenter lors d'un audit.",
  },
];

interface DeletionResult {
  message?: string;
}

export function PrivacyPanel({ exportDate }: { exportDate: string }) {
  const { toast } = useToast();

  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const phraseOk =
    confirmation.trim().replace(/\s+/g, " ").toUpperCase() === CONFIRMATION_PHRASE;
  const canSubmit = phraseOk && password.length > 0 && !submitting;

  async function onDelete(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setErrorText(null);
    try {
      // Le ValidationPipe de l'API est en whitelist stricte : exactement
      // ces deux champs, ni plus ni moins.
      const res = await apiRequest<DeletionResult>("/users/me/deletion-request", {
        method: "POST",
        body: { password, confirmation: confirmation.trim() },
      });
      setDone(true);
      toast({
        title: "Compte supprimé",
        description: res?.message ?? "Vos données personnelles ont été effacées.",
      });
      // Le compte est désactivé côté serveur : la session locale n'a plus lieu
      // d'être. On la ferme puis on renvoie sur l'accueil public.
      await logout().catch(() => undefined);
      setTimeout(() => {
        window.location.href = "/";
      }, 2500);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "La demande n'a pas pu être traitée.";
      setErrorText(message);
      toast({
        title: "Suppression impossible",
        description: "Consultez le détail affiché sous le formulaire.",
        variant: "error",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* ── Zone 1 : export ─────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <SectionTitle
            title="Exporter mes données"
            action={<Badge variant="soft">Sans conséquence</Badge>}
          />
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="max-w-2xl text-sm text-muted-foreground">
            Vous récupérez en un fichier tout ce que Les Extras conserve à votre
            sujet : identité, profil, CV, disponibilités, missions et pointages,
            factures, avis, messages, notifications et dossiers de formation. Le
            fichier est au format JSON, lisible dans un simple éditeur de texte
            et réutilisable par un autre service.
          </p>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Votre mot de passe n&apos;y figure pas : il est stocké sous une forme
            chiffrée et irréversible, personne ne peut le relire. Les jetons de
            connexion en sont également exclus, pour votre sécurité.
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <Button asChild>
              {/* Lien direct vers le proxy same-origin : le cookie de session
                  part avec la navigation, le fichier arrive en pièce jointe. */}
              <a
                href="/api/proxy/users/me/export"
                download={`les-extras_mes-donnees-personnelles_${exportDate}.json`}
              >
                Télécharger mes données
              </a>
            </Button>
            <span className="text-xs text-muted-foreground">
              Fichier JSON · téléchargement immédiat
            </span>
          </div>
        </CardContent>
      </Card>

      {/* ── Zone 2 : suppression ────────────────────────────────────────── */}
      <Card className="border-destructive/30">
        <CardHeader className="border-b border-destructive/20 bg-destructive/5">
          <SectionTitle
            title="Supprimer mon compte"
            action={<Badge variant="destructive">Irréversible</Badge>}
          />
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <p className="max-w-2xl text-sm text-muted-foreground">
            Cette action efface définitivement les informations qui vous
            identifient et ferme votre accès. Elle ne peut pas être annulée, et
            aucun compte ne peut être rouvert ensuite. Prenez le temps de
            télécharger votre export avant, si vous souhaitez garder une copie.
          </p>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground">
                Ce qui est effacé
              </h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {EFFACE.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span aria-hidden className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-destructive" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground">
                Ce qui est conservé, et pourquoi
              </h3>
              <ul className="space-y-3 text-sm text-muted-foreground">
                {CONSERVE.map((item) => (
                  <li key={item.quoi} className="flex gap-2">
                    <span aria-hidden className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-muted-foreground" />
                    <span>
                      <span className="font-medium text-foreground">{item.quoi}</span>{" "}
                      — {item.pourquoi}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
            Une demande ne peut pas aboutir s&apos;il vous reste une mission en
            cours, un créneau de planning à venir, une session de formation à
            animer ou une facture non réglée : d&apos;autres personnes comptent
            encore sur vous. Réglez ces points d&apos;abord, la demande passera
            ensuite.
          </div>

          {done ? (
            <div className="rounded-lg border border-border bg-card p-4 text-sm text-foreground">
              Votre compte a été anonymisé et désactivé. Vous allez être
              redirigé vers l&apos;accueil dans quelques secondes.
            </div>
          ) : (
            <form onSubmit={onDelete} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label="Votre mot de passe actuel"
                  htmlFor="rgpd-password"
                  required
                  hint="Il confirme que la demande vient bien de vous."
                >
                  <Input
                    id="rgpd-password"
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </Field>
                <Field
                  label="Phrase de confirmation"
                  htmlFor="rgpd-confirmation"
                  required
                  hint={`Recopiez exactement : ${CONFIRMATION_PHRASE}`}
                >
                  <Input
                    id="rgpd-confirmation"
                    autoComplete="off"
                    spellCheck={false}
                    placeholder={CONFIRMATION_PHRASE}
                    value={confirmation}
                    onChange={(e) => setConfirmation(e.target.value)}
                  />
                </Field>
              </div>

              {errorText ? (
                <div
                  role="alert"
                  className="whitespace-pre-line rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive"
                >
                  {errorText}
                </div>
              ) : null}

              <div className="flex flex-wrap items-center gap-3">
                <Button
                  type="submit"
                  variant="destructive"
                  disabled={!canSubmit}
                  loading={submitting}
                >
                  Supprimer définitivement mon compte
                </Button>
                {!phraseOk && confirmation.length > 0 ? (
                  <span className="text-xs text-muted-foreground">
                    La phrase ne correspond pas encore.
                  </span>
                ) : null}
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
