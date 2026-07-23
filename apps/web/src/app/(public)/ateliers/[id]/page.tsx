// Page publique de détail d'un atelier / formation (vitrine, sans connexion).
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { fetchPublic } from "../../../_shared/server";
import { SERVICE_CATEGORY_LABEL, formatMoney, initials } from "../../../_shared/format";
import type { CatalogItem } from "../../_catalog";

export const metadata: Metadata = { title: "Atelier · Les Extras" };

type ServiceDetail = CatalogItem & {
  maxParticipants?: number | null;
  publicTarget?: string | null;
};

export default async function AtelierPublicPage({ params }: { params: { id: string } }) {
  const { data: service } = await fetchPublic<ServiceDetail>(`/public/catalog/${params.id}`);
  if (!service) notFound();

  const organisme = service.account;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="space-y-3">
        <Badge variant="outline">
          {service.categoryRef?.title ?? SERVICE_CATEGORY_LABEL[service.category]}
        </Badge>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">{service.title}</h1>
        <p className="text-2xl font-semibold text-secondary">{formatMoney(service.price)}</p>
      </div>

      {organisme ? (
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Avatar className="h-11 w-11">
              <AvatarImage src={organisme.logoUrl ?? undefined} />
              <AvatarFallback>{initials(organisme.name)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium text-foreground">{organisme.name}</p>
              <p className="text-xs text-muted-foreground">
                {organisme.city ?? "Intervenant vérifié"}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <h2 className="font-semibold text-foreground">Description</h2>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
            {service.description}
          </p>
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            {service.duration ? <span>⏱ {service.duration}</span> : null}
            {service.maxParticipants ? <span>👥 {service.maxParticipants} max</span> : null}
            {service.publicTarget ? <span>🎯 {service.publicTarget}</span> : null}
            {service.city ? <span>📍 {service.city}</span> : null}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-primary/5">
        <CardContent className="flex flex-col items-center gap-3 p-6 text-center">
          <p className="text-sm text-muted-foreground">
            Vous êtes un établissement ? Connectez-vous pour réserver cette prestation.
          </p>
          <div className="flex gap-2">
            <Button asChild>
              <Link href={`/marketplace/services/${service.id}`}>Réserver</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/register">Créer un compte</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
