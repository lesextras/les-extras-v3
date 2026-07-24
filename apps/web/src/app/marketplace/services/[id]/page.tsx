// Détail d'un atelier + réserver (ESTABLISHMENT).
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { requireSession, fetchApi } from "../../../_shared/server";
import { BookServiceModal } from "../../../_shared/modals/BookServiceModal";
import {
  SERVICE_CATEGORY_LABEL,
  formatMoney,
  fullName,
  initials,
} from "../../../_shared/format";
import type { Service, PublicUser } from "../../../_shared/types";

export const metadata: Metadata = { title: "Atelier · Les Extras" };

export default async function ServiceDetailPage({ params }: { params: { id: string } }) {
  const session = await requireSession();
  const { data: service } = await fetchApi<Service & { provider?: PublicUser }>(
    session,
    `/services/${params.id}`,
  );
  if (!service) notFound();

  const isEstablishment = session.account.type === "ESTABLISHMENT";

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link href="/marketplace?type=services" className="text-sm text-muted-foreground hover:text-foreground">
        ← Retour aux ateliers
      </Link>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <div className="space-y-3">
            <Badge variant="outline">{SERVICE_CATEGORY_LABEL[service.category]}</Badge>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              {service.title}
            </h1>
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
                <Button asChild variant="ghost" size="sm" className="ml-auto">
                  <Link href={`/freelances/${service.provider.id}`}>Voir le profil</Link>
                </Button>
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader>
              <h2 className="font-semibold text-foreground">Description</h2>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                {service.description}
              </p>
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-4">
          <Card className="lg:sticky lg:top-6">
            <CardContent className="space-y-4 p-5">
              <div className="text-center">
                <p className="text-3xl font-semibold text-secondary">{formatMoney(service.price)}</p>
              </div>
              <dl className="space-y-3 text-sm">
                {service.duration ? <Row label="Durée" value={service.duration} /> : null}
                {service.maxParticipants ? (
                  <Row label="Participants" value={`${service.maxParticipants} max`} />
                ) : null}
                {service.publicTarget ? <Row label="Public" value={service.publicTarget} /> : null}
                {service.city ? <Row label="Lieu" value={service.city} /> : null}
              </dl>

              {isEstablishment ? (
                <BookServiceModal
                  serviceId={service.id}
                  serviceTitle={service.title}
                  price={service.price}
                  accountId={session.account.id}
                  trigger={<Button className="w-full">Réserver cet atelier</Button>}
                />
              ) : (
                <p className="text-center text-xs text-muted-foreground">
                  Seuls les établissements peuvent réserver.
                </p>
              )}
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium text-foreground">{value}</dd>
    </div>
  );
}
