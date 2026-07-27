import { Card, CardContent } from "@/components/ui/card";

export default function ServiceDetailLoading() {
  return (
    <div className="container max-w-6xl py-8 space-y-6">
      <div className="h-4 w-40 rounded bg-muted animate-pulse" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <Card key={index}>
              <CardContent className="p-6 space-y-3">
                <div className="h-5 w-28 rounded bg-muted animate-pulse" />
                <div className="h-8 w-4/5 rounded bg-muted animate-pulse" />
                <div className="h-4 w-full rounded bg-muted animate-pulse" />
                <div className="h-4 w-3/4 rounded bg-muted animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>

        <div>
          <Card>
            <CardContent className="p-6 space-y-3">
              <div className="h-7 w-2/3 rounded bg-muted animate-pulse" />
              <div className="h-11 w-full rounded bg-muted animate-pulse" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
