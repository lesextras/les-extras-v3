"use client";

// Dernier filet : erreur survenue dans le layout racine lui-même.
//
// À ce niveau, Next.js a déjà perdu le layout de l'application — ce composant
// doit donc fournir ses propres <html> et <body>. Aucune dépendance à nos
// composants ni à Tailwind : si le rendu racine a échoué, on ne peut rien
// supposer. Styles en ligne, volontairement.
import { useEffect } from "react";

export default function ErreurGlobale({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error(error);
  }, [error]);

  return (
    <html lang="fr">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0d0b12",
          color: "#ece9f2",
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
        }}
      >
        <main style={{ maxWidth: 520, padding: "0 24px", textAlign: "center" }}>
          <p
            style={{
              margin: "0 0 8px",
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: ".08em",
              textTransform: "uppercase",
              color: "#ec4899",
            }}
          >
            Les Extras
          </p>
          <h1 style={{ margin: "0 0 12px", fontSize: 24, lineHeight: 1.3 }}>
            La plateforme est momentanément indisponible
          </h1>
          <p style={{ margin: "0 0 22px", color: "#a79fba", lineHeight: 1.6 }}>
            Un incident empêche l’affichage du site. Nos équipes en sont informées.
            Réessayez dans un instant.
          </p>
          <button
            onClick={reset}
            style={{
              border: 0,
              borderRadius: 10,
              padding: "11px 22px",
              background: "#ec4899",
              color: "#fff",
              fontSize: 15,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Réessayer
          </button>
        </main>
      </body>
    </html>
  );
}
