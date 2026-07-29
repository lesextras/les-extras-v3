"use client";

// Activation des notifications sur cet appareil.
//
// Trois choses comptent ici :
//  - on ne demande JAMAIS la permission au chargement de la page. Un navigateur
//    qui reçoit une demande non sollicitée la bloque définitivement, et on perd
//    le canal pour de bon. La demande part au clic, et seulement au clic.
//  - sur iPhone, le push n'existe que si l'application a été ajoutée à l'écran
//    d'accueil. On le dit clairement plutôt que d'afficher un bouton qui échoue.
//  - l'abonnement est propre à l'appareil : activer sur le téléphone n'active
//    pas sur l'ordinateur, et c'est voulu.
import * as React from "react";
import { Bell, BellOff, BellRing, Loader2, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";

type Etat = "chargement" | "impossible" | "ios-a-installer" | "refuse" | "inactif" | "actif";

function base64UrlVersOctets(base64: string): Uint8Array {
  const complement = "=".repeat((4 - (base64.length % 4)) % 4);
  const normal = (base64 + complement).replace(/-/g, "+").replace(/_/g, "/");
  const binaire = atob(normal);
  const octets = new Uint8Array(binaire.length);
  for (let i = 0; i < binaire.length; i += 1) octets[i] = binaire.charCodeAt(i);
  return octets;
}

/** Un libellé d'appareil lisible, pour que la personne s'y retrouve. */
function nommerAppareil(): string {
  const ua = navigator.userAgent;
  const systeme = /iPhone|iPad/.test(ua)
    ? "iPhone"
    : /Android/.test(ua)
      ? "Android"
      : /Mac/.test(ua)
        ? "Mac"
        : /Windows/.test(ua)
          ? "Windows"
          : "Navigateur";
  const navigateur = /Chrome/.test(ua) ? "Chrome" : /Firefox/.test(ua) ? "Firefox" : /Safari/.test(ua) ? "Safari" : "";
  return navigateur ? `${systeme} · ${navigateur}` : systeme;
}

export function BasculeNotifications() {
  const [etat, setEtat] = React.useState<Etat>("chargement");
  const [occupe, setOccupe] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);

  React.useEffect(() => {
    let vivant = true;
    (async () => {
      const supporte =
        typeof window !== "undefined" &&
        "serviceWorker" in navigator &&
        "PushManager" in window &&
        "Notification" in window;

      if (!supporte) {
        // iOS ne fournit le push qu'aux applications installées : on distingue
        // « votre navigateur ne sait pas faire » de « il faut l'installer ».
        const estIos = /iPhone|iPad|iPod/.test(navigator.userAgent);
        const installee = window.matchMedia("(display-mode: standalone)").matches;
        if (vivant) setEtat(estIos && !installee ? "ios-a-installer" : "impossible");
        return;
      }

      if (Notification.permission === "denied") {
        if (vivant) setEtat("refuse");
        return;
      }

      const inscription = await navigator.serviceWorker.ready.catch(() => null);
      const abonnement = await inscription?.pushManager.getSubscription().catch(() => null);
      if (vivant) setEtat(abonnement ? "actif" : "inactif");
    })();
    return () => {
      vivant = false;
    };
  }, []);

  async function activer() {
    setOccupe(true);
    setMessage(null);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setEtat(permission === "denied" ? "refuse" : "inactif");
        return;
      }

      const reponseCle = await fetch("/api/proxy/push/cle");
      const { clePublique } = (await reponseCle.json()) as { clePublique: string | null };
      if (!clePublique) {
        setMessage("Le serveur de notifications n’est pas encore prêt. Réessayez dans un instant.");
        return;
      }

      const inscription = await navigator.serviceWorker.ready;
      const abonnement = await inscription.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: base64UrlVersOctets(clePublique) as BufferSource,
      });

      const brut = abonnement.toJSON() as { endpoint?: string; keys?: { p256dh?: string; auth?: string } };
      const reponse = await fetch("/api/proxy/push/abonnement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: brut.endpoint,
          p256dh: brut.keys?.p256dh,
          auth: brut.keys?.auth,
          appareil: nommerAppareil(),
        }),
      });
      if (!reponse.ok) throw new Error("enregistrement refusé");

      setEtat("actif");
      setMessage("Notifications activées sur cet appareil.");
    } catch {
      setMessage("Activation impossible sur cet appareil.");
    } finally {
      setOccupe(false);
    }
  }

  async function desactiver() {
    setOccupe(true);
    setMessage(null);
    try {
      const inscription = await navigator.serviceWorker.ready;
      const abonnement = await inscription.pushManager.getSubscription();
      if (abonnement) {
        await fetch("/api/proxy/push/abonnement", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: abonnement.endpoint }),
        }).catch(() => undefined);
        await abonnement.unsubscribe().catch(() => undefined);
      }
      setEtat("inactif");
      setMessage("Notifications désactivées sur cet appareil.");
    } finally {
      setOccupe(false);
    }
  }

  async function essayer() {
    setOccupe(true);
    setMessage(null);
    try {
      await fetch("/api/proxy/push/essai", { method: "POST" });
      setMessage("Envoi lancé — la notification doit arriver dans quelques secondes.");
    } finally {
      setOccupe(false);
    }
  }

  if (etat === "chargement") return null;

  if (etat === "ios-a-installer") {
    return (
      <div className="rounded-xl border border-border bg-card p-4">
        <p className="flex items-center gap-2 text-sm font-semibold">
          <Smartphone className="size-4 text-primary" aria-hidden />
          Sur iPhone, installez d’abord l’application
        </p>
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
          Bouton Partager, puis « Sur l’écran d’accueil ». Les notifications deviennent
          disponibles une fois l’application ouverte depuis l’icône.
        </p>
      </div>
    );
  }

  if (etat === "impossible") {
    return (
      <div className="rounded-xl border border-border bg-card p-4">
        <p className="flex items-center gap-2 text-sm font-semibold">
          <BellOff className="size-4 text-muted-foreground" aria-hidden />
          Notifications indisponibles sur ce navigateur
        </p>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Utilisez Chrome, Firefox ou Edge, ou installez l’application sur votre téléphone.
        </p>
      </div>
    );
  }

  if (etat === "refuse") {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4">
        <p className="flex items-center gap-2 text-sm font-semibold">
          <BellOff className="size-4 text-destructive" aria-hidden />
          Notifications bloquées
        </p>
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
          Vous les avez refusées pour ce site. Pour les réactiver : icône du cadenas dans la
          barre d’adresse, puis autorisez les notifications.
        </p>
      </div>
    );
  }

  const actif = etat === "actif";

  return (
    <div
      className={`rounded-xl border p-4 transition-colors ${
        actif ? "border-success/30 bg-success/5" : "border-border bg-card"
      }`}
    >
      <p className="flex items-center gap-2 text-sm font-semibold">
        {actif ? (
          <BellRing className="size-4 text-success" aria-hidden />
        ) : (
          <Bell className="size-4 text-primary" aria-hidden />
        )}
        {actif ? "Notifications activées sur cet appareil" : "Être prévenu sur cet appareil"}
      </p>
      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
        {actif
          ? "Un renfort publié, une réponse au GAP, une mission acceptée : vous êtes prévenu même application fermée."
          : "Un renfort à couvrir ce soir ne peut pas attendre le prochain e-mail. Activez pour être prévenu tout de suite."}
      </p>

      <div className="mt-3.5 flex flex-wrap gap-2">
        {actif ? (
          <>
            <Button size="sm" variant="outline" onClick={essayer} disabled={occupe}>
              {occupe ? <Loader2 className="size-4 animate-spin" /> : null}
              Envoyer un essai
            </Button>
            <Button size="sm" variant="ghost" onClick={desactiver} disabled={occupe}>
              Désactiver
            </Button>
          </>
        ) : (
          <Button size="sm" onClick={activer} disabled={occupe}>
            {occupe ? <Loader2 className="size-4 animate-spin" /> : <Bell className="size-4" />}
            Activer les notifications
          </Button>
        )}
      </div>

      {message ? <p className="mt-3 text-sm text-muted-foreground">{message}</p> : null}
    </div>
  );
}
