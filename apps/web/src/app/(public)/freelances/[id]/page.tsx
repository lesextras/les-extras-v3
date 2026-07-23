// Profil public d'un freelance.
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { fetchPublic } from "../../../_shared/server";
import { ServiceCard } from "../../../_shared/cards";
import { formatRate, fullName, initials } from "../../../_shared/format";
import type { PublicUser, Review, Service } from "../../../_shared/types";

export const metadata: Metadata = { title: "Freelance · Les Extras" };

interface FreelanceProfile extends PublicUser {
  services?: Service[];
  reviews?: Review[];
  rating?: number;
}

export default async function FreelancePublicPage({ params }: { params: { id: string } }) {
  const { data } = await fetchPublic<FreelanceProfile>(`/freelances/${params.id}`);
  if (!data) notFound();

  const p = data.profile;

  return (
    <div className="space-y-8">
      <Card>
        <CardContent className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center">
          <Avatar className="h-20 w-20">
            <AvatarImage src={data.avatarUrl ?? undefined} />
            <AvatarFallback className="text-xl">
              {initials(data.firstName, data.lastName)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-2">
            <h1 className="text-2xl font-semibold text-foreground">
              {fullName(data.firstName, data.lastName)}
            </h1>
            {p?.job ? <p className="text-primary">{p.job}</p> : null}
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              {p?.city ? <span>📍 {p.city}</span> : null}
              {p?.hourlyRate ? <span>· {formatRate(p.hourlyRate)}</span> : null}
              {typeof data.rating === "number" ? <span>· ⭐ {data.rating.toFixed(1)}</span> : null}
              {p?.available ? <Badge variant="secondary">Disponible</Badge> : null}
            </div>
          </div>
        </CardContent>
      </Card>

      {p?.bio ? (
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-foreground">À propos</h2>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{p.bio}</p>
          </CardContent>
        </Card>
      ) : null}

      {p?.skills && p.skills.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {p.skills.map((s) => (
            <Badge key={s} variant="outline">
              {s}
            </Badge>
          ))}
        </div>
      ) : null}

      {data.services && data.services.length > 0 ? (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Ateliers proposés</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.services.map((sv) => (
              <ServiceCard key={sv.id} service={sv} />
            ))}
          </div>
        </section>
      ) : null}

      {data.reviews && data.reviews.length > 0 ? (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Avis</h2>
          <div className="space-y-3">
            {data.reviews.map((r) => (
              <Card key={r.id}>
                <CardContent className="space-y-1 p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-foreground">
                      {fullName(r.author?.firstName, r.author?.lastName)}
                    </p>
                    <span className="text-sm text-secondary">{"⭐".repeat(r.rating)}</span>
                  </div>
                  {r.comment ? <p className="text-sm text-muted-foreground">{r.comment}</p> : null}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
