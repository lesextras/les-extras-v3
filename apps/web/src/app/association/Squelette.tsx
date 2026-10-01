/**
 * SQUELETTES DE CHARGEMENT de l'espace association : des blocs gris qui
 * pulsent à la place de « Chargement… ». La page garde sa forme pendant que
 * les données arrivent, rien ne saute à l'affichage.
 */

export function Bloc({ className = '' }: { className?: string }) {
  return <div aria-hidden="true" className={`animate-pulse rounded-xl bg-[#ECEBF3] ${className}`} />;
}

/** Une rangée d'onglets, quatre tuiles et deux cartes de graphique. */
export function SqueletteTableau() {
  return (
    <div role="status" aria-busy="true" aria-label="Chargement" className="grid gap-5">
      <div className="flex flex-wrap items-center gap-2">
        <Bloc className="h-10 w-full max-w-[560px]" />
        <Bloc className="ml-auto h-9 w-40" />
      </div>
      <div className="grid gap-3 sm:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Bloc key={i} className="h-[92px]" />
        ))}
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <Bloc className="h-64" />
        <Bloc className="h-64" />
      </div>
    </div>
  );
}

/** Un titre de page et quelques lignes de liste. */
export function SqueletteListe({ lignes = 4 }: { lignes?: number }) {
  return (
    <div role="status" aria-busy="true" aria-label="Chargement" className="grid gap-5">
      <div className="grid gap-2">
        <Bloc className="h-3 w-24" />
        <Bloc className="h-8 w-64 max-w-full" />
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <Bloc key={i} className="h-24" />
        ))}
      </div>
      <div className="grid gap-3">
        {Array.from({ length: lignes }, (_, i) => (
          <Bloc key={i} className="h-16" />
        ))}
      </div>
    </div>
  );
}
