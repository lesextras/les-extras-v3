// Indicateur de chargement des pages publiques.
//
// Sans lui, un clic dans le menu laissait l'ancienne page figée une à deux
// secondes, sans aucun signe que la navigation était en cours — le visiteur
// recliquait ou croyait le site en panne. Ce squelette s'affiche
// instantanément pendant que le serveur prépare la page.
export default function PublicLoading() {
  return (
    <div aria-busy="true" aria-label="Chargement de la page" className="space-y-8 py-4">
      <div className="h-8 w-2/5 animate-pulse rounded-lg bg-muted" />
      <div className="space-y-3">
        <div className="h-4 w-full animate-pulse rounded bg-muted" />
        <div className="h-4 w-5/6 animate-pulse rounded bg-muted" />
        <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
      </div>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <div className="aspect-[16/10] animate-pulse rounded-xl bg-muted" />
            <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
            <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
          </div>
        ))}
      </div>
    </div>
  );
}
