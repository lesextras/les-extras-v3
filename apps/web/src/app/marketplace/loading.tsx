// État de chargement du marketplace.
import { SkeletonCard } from "../_shared/ui";

export default function MarketplaceLoading() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-52 animate-pulse rounded bg-muted" />
      <div className="h-16 w-full animate-pulse rounded-xl bg-muted" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  );
}
