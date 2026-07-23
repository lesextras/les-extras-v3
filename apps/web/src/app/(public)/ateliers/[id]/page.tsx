// Page publique d'un atelier (vitrine, sans réservation directe).
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { fetchPublic } from "../../../_shared/server";
import {
  SERVICE_CATEGORY_LABEL,
  formatMoney,
  fullName,
  initials,
} from "../../../_shared/format";
import type { PublicUser, Service } from "../../../_shared/types";

export const metadata: Metadata = { title: "Atelier · Les Extras" };

export default async function AtelierPublicPage({ params }: { params: { id: string } }) {
  const { data: service } = await fetchPublic<Service & { provider?: PublicUser }>(
    `/ateliers/${params.id}`,
  );
  if (!service) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="space-y-3">
        <Badge variant="outline">{SERVICE_CATEGORY_LABEL[service.category]}</Badge>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">{service.title}</h1>
        <p className="text-2xl font-semibold text-secondary">{formatMoney(service.price)}</p>
      </div>

      {service.provider ? (
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Avatar className="h-11 w-11">
              <AvatarImage src={service.provider.avatarUrl ?? undefined} />
              <AvatarFallback>
                {initials(service.provider.firstName, service.provider.lastName)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium text-foreground">
                {fullName(service.provider.firstName, service.provider.lastName)}
              </p>
              <p className="text-xs text-muted-foreground">
                {service.provider.profile?.job ?? "Intervenant"}
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
            Vous êtes un établissement ? Connectez-vous pour réserver cet atelier.
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
