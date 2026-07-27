"use client";

// Invitation discrète à installer l'app sur l'écran d'accueil.
// SOS Renfort se consulte au téléphone : l'icône sur l'écran d'accueil (et le
// mode plein écran) fait gagner de vraies secondes le matin.
//
// Règles : masqué si déjà installé (display-mode: standalone), masqué si
// l'utilisateur a refusé (refus mémorisé 30 jours), jamais bloquant.
import { useCallback, useEffect, useState } from "react";
import { Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const DISMISS_KEY = "lesextras.pwa-install-dismissed-at";
const DISMISS_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 jours

/** Événement non standard (Chromium) : typé localement, pas dans lib.dom. */
type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function isStandalone() {
  if (typeof window === "undefined") return false;
  const iosStandalone = (window.navigator as Navigator & { standalone?: boolean }).standalone;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: minimal-ui)").matches ||
    iosStandalone === true
  );
}

function wasRecentlyDismissed() {
  try {
    const raw = window.localStorage.getItem(DISMISS_KEY);
    if (!raw) return false;
    const at = Number(raw);
    if (!Number.isFinite(at)) return false;
    return Date.now() - at < DISMISS_DURATION_MS;
  } catch {
    return false; // localStorage indisponible (mode privé strict) : on n'insiste pas plus.
  }
}

function rememberDismissal() {
  try {
    window.localStorage.setItem(DISMISS_KEY, String(Date.now()));
  } catch {
    // Sans stockage, la bannière pourra réapparaître : acceptable.
  }
}

export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (isStandalone() || wasRecentlyDismissed()) return;

    const onBeforeInstallPrompt = (event: Event) => {
      // Empêche la mini-infobar Chrome : on présente notre propre invitation.
      event.preventDefault();
      setDeferred(event as BeforeInstallPromptEvent);
      setVisible(true);
    };

    const onInstalled = () => {
      setVisible(false);
      setDeferred(null);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const onDismiss = useCallback(() => {
    rememberDismissal();
    setVisible(false);
  }, []);

  const onInstall = useCallback(async () => {
    if (!deferred) return;
    setBusy(true);
    try {
      await deferred.prompt();
      const choice = await deferred.userChoice;
      if (choice.outcome === "dismissed") rememberDismissal();
    } catch {
      // Prompt déjà consommé ou refusé par le navigateur : on referme.
    } finally {
      setBusy(false);
      setVisible(false);
      setDeferred(null);
    }
  }, [deferred]);

  if (!visible || !deferred) return null;

  return (
    <div
      role="dialog"
      aria-label="Installer l’application Les Extras"
      className="fixed inset-x-3 bottom-3 z-[120] animate-slide-up sm:inset-x-auto sm:right-4 sm:bottom-4 sm:w-[22rem]"
    >
      <div className="flex items-start gap-3 rounded-lg border border-border bg-card p-4 shadow-card">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-soft text-accent-foreground"
          aria-hidden
        >
          <Download className="h-5 w-5" />
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          <div className="space-y-0.5">
            <p className="text-sm font-semibold text-foreground">Installer l’application</p>
            <p className="text-[13px] leading-snug text-muted-foreground">
              Ajoutez Les Extras à votre écran d’accueil : vos missions de renfort en un geste,
              même à 7 h du matin.
            </p>
          </div>
          <div className="flex items-center gap-2 pt-0.5">
            <Button size="sm" loading={busy} onClick={onInstall}>
              Installer
            </Button>
            <Button size="sm" variant="ghost" onClick={onDismiss}>
              Plus tard
            </Button>
          </div>
        </div>

        <button
          type="button"
          onClick={onDismiss}
          aria-label="Fermer"
          className="-mr-1 -mt-1 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}
