/**
 * LE SQUELETTE DE CHARGEMENT (01/10/2026).
 *
 * À la place du mot « Chargement… » : quelques blocs gris qui ont à peu près
 * la forme de ce qui arrive. `lignes` règle la hauteur de la liste ; `tuiles`
 * ajoute une rangée de chiffres au-dessus quand l'écran en a une.
 */
export function Squelette({ lignes = 3, tuiles = 0 }: { lignes?: number; tuiles?: number }) {
  return (
    <div role="status" aria-live="polite" aria-busy="true" className="grid gap-3">
      <span className="sr-only">Chargement…</span>
      {tuiles ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: tuiles }, (_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-2xl bg-[#E6EFEA] motion-reduce:animate-none" />
          ))}
        </div>
      ) : null}
      {Array.from({ length: lignes }, (_, i) => (
        <div key={i} className="flex items-center gap-4 rounded-2xl border border-[#DDEBE4] bg-white p-4">
          <div className="h-10 w-10 shrink-0 animate-pulse rounded-xl bg-[#E6EFEA] motion-reduce:animate-none" />
          <div className="flex-1 space-y-2">
            <div className="h-3.5 w-2/5 animate-pulse rounded-full bg-[#E6EFEA] motion-reduce:animate-none" />
            <div className="h-3 w-3/5 animate-pulse rounded-full bg-[#EEF4F1] motion-reduce:animate-none" />
          </div>
        </div>
      ))}
    </div>
  );
}
