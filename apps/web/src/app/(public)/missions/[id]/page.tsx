// Page publique de détail d'une mission de renfort (vitrine, sans connexion).
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { fetchPublic } from "../../../_shared/server";
import { MISSION_CATEGORY_LABEL, formatDate, formatRate } from "../../../_shared/format";

export const metadata: Metadata = { title: "Mission de renfort" };

interface PublicMission {
  id: string;
  title: string;
  description: string;
  category: keyof typeof MISSION_CATEGORY_LABEL;
  job?: string | null;
  startDate: string;
  endDate?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  city?: string | null;
  postalCode?: string | null;
  hourlyRate?: number | null;
  headcount: number;
  categoryRef?: { id: string; title: string } | null;
  account?: { id: string; name: string; city?: string | null; logoUrl?: string | null } | null;
}

export default async function MissionPublicPage({ params }: { params: { id: string } }) {
  const { data: mission } = await fetchPublic<PublicMission>(`/public/missions/${params.id}`);
  if (!mission) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="text-sm">
        <Link href="/renfort" className="text-muted-foreground hover:text-foreground">
          ← Voir toutes les missions
        </Link>
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="soft">Renfort</Badge>
          <Badge variant="outline">
            {mission.categoryRef?.title ?? MISSION_CATEGORY_LABEL[mission.category]}
          </Badge>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          {mission.title}
        </h1>
        <p className="text-sm text-muted-foreground">
          Publiée par {mission.account?.name ?? "un établissement"}
          {mission.city ? ` · ${mission.city}` : ""}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_300px]">
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-foreground">Description de la mission</h2>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
              {mission.description}
            </p>
          </CardContent>
        </Card>

        <aside className="space-y-4">
          <Card>
            <CardContent className="space-y-3 p-5 text-sm">
              <Row label="Début" value={formatDate(mission.startDate)} />
              {mission.endDate ? <Row label="Fin" value={formatDate(mission.endDate)} /> : null}
              {mission.startTime || mission.endTime ? (
                <Row label="Horaires" value={`${mission.startTime ?? "?"} – ${mission.endTime ?? "?"}`} />
              ) : null}
              {mission.job ? <Row label="Métier" value={mission.job} /> : null}
              <Row
                label="Lieu"
                value={`${mission.city ?? "—"}${mission.postalCode ? ` (${mission.postalCode})` : ""}`}
              />
              <Row label="Postes" value={String(mission.headcount)} />
              {mission.hourlyRate ? (
                <Row label="Rémunération" value={formatRate(mission.hourlyRate)} highlight />
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-3 p-5 text-center">
              <p className="text-sm text-muted-foreground">
                Vous êtes un professionnel du médico-social ?
              </p>
              <Button asChild className="w-full">
                <Link href={`/register?next=/marketplace/missions/${mission.id}`}>
                  Créer un compte pour candidater
                </Link>
              </Button>
              <p className="text-xs text-muted-foreground">
                Déjà inscrit ?{" "}
                <Link href={`/login?next=/marketplace/missions/${mission.id}`} className="text-primary hover:underline">
                  Se connecter
                </Link>
              </p>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={highlight ? "font-semibold text-primary" : "font-medium text-foreground"}>
        {value}
      </dd>
    </div>
  );
}
