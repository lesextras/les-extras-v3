import { Card, CardContent } from "@/components/ui/card";

export default function MesAteliersLoading() {
  return (
    <div className="space-y-4">
      <div className="h-8 w-56 rounded bg-muted animate-pulse" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <Card key={index}>
            <CardContent className="p-4 space-y-2">
              <div className="h-3 w-24 rounded bg-muted animate-pulse" />
              <div className="h-7 w-10 rounded bg-muted animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <Card key={index}>
            <CardContent className="p-4 space-y-2">
              <div className="h-5 w-2/3 rounded bg-muted animate-pulse" />
              <div className="h-4 w-full rounded bg-muted animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
