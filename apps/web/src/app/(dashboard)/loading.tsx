// État de chargement par défaut du groupe (dashboard).
import { SkeletonCard, SkeletonList } from "../_shared/ui";

export default function DashboardLoading() {
  return (
    <div className="space-y-8">
      <div className="h-8 w-64 animate-pulse rounded bg-muted" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
      <SkeletonList rows={3} />
    </div>
  );
}
