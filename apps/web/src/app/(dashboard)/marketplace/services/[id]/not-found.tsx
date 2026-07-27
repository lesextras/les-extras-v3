import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function ServiceDetailNotFound() {
  return (
    <div className="container max-w-3xl py-10">
      <Card>
        <CardHeader>
          <CardTitle>Cet atelier n&apos;existe plus</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>Le lien est peut-être expiré ou l&apos;atelier a été retiré du catalogue.</p>
          <Button asChild>
            <Link href="/marketplace">Retour au catalogue ateliers</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
