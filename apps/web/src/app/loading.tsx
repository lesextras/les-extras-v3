// Indicateur de chargement global (page d'accueil et segments sans squelette
// dédié) : un retour visuel immédiat plutôt qu'un écran figé pendant que le
// serveur prépare la page.
export default function RootLoading() {
  return (
    <div aria-busy="true" aria-label="Chargement" className="grid min-h-[60vh] place-items-center">
      <div className="flex flex-col items-center gap-3">
        <span className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <p className="text-sm text-muted-foreground">Chargement…</p>
      </div>
    </div>
  );
}
