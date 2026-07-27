"use client";

// Enregistre le service worker (public/sw.js) — uniquement en production.
// En développement, on désenregistre au contraire tout worker résiduel pour
// éviter de servir un asset périmé pendant le travail sur l'app.
import { useEffect } from "react";

export function PwaRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    if (process.env.NODE_ENV !== "production") {
      navigator.serviceWorker
        .getRegistrations()
        .then((registrations) => {
          registrations.forEach((registration) => {
            void registration.unregister();
          });
        })
        .catch(() => undefined);
      return;
    }

    // On attend le chargement complet pour ne pas concurrencer le rendu initial.
    const register = () => {
      navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {
        // Échec silencieux : l'app reste parfaitement utilisable sans PWA.
      });
    };

    if (document.readyState === "complete") {
      register();
      return;
    }

    window.addEventListener("load", register);
    return () => window.removeEventListener("load", register);
  }, []);

  return null;
}
