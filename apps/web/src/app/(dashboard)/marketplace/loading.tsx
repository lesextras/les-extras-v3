import { Card, CardContent } from "@/components/ui/card";

export default function MarketplaceLoading() {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="h-4 w-24 rounded bg-muted animate-pulse" />
        <div className="h-8 w-72 rounded bg-muted animate-pulse" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, index) => (
          <Card key={index}>
            <CardContent className="p-4 space-y-3">
              <div className="h-4 w-20 rounded bg-muted animate-pulse" />
              <div className="h-5 w-4/5 rounded bg-muted animate-pulse" />
              <div className="h-4 w-3/5 rounded bg-muted animate-pulse" />
              <div className="h-10 w-full rounded bg-muted animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
