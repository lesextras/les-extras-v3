// Détail d'une mission renfort + candidater (FREELANCE).
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { requireSession, fetchApi } from "../../../_shared/server";
import { AcceptMissionButton } from "../../../_shared/AcceptMissionButton";
import {
  MISSION_CATEGORY_LABEL,
  MISSION_STATUS_LABEL,
  missionBadgeVariant,
  formatDate,
  formatRate,
} from "../../../_shared/format";
import type { Mission } from "../../../_shared/types";

export const metadata: Metadata = { title: "Mission · Les Extras" };

export default async function MissionDetailPage({ params }: { params: { id: string } }) {
  const session = await requireSession();
  const { data: mission } = await fetchApi<Mission & { alreadyApplied?: boolean }>(
    session,
    `/missions/${params.id}`,
  );
  if (!mission) notFound();

  const isFreelance = session.account.type === "FREELANCE";
  const canAccept = isFreelance && mission.status === "PUBLISHED";

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link href="/marketplace" className="text-sm text-muted-foreground hover:text-foreground">
        ← Retour au marketplace
      </Link>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={missionBadgeVariant(mission.status)}>
                {MISSION_STATUS_LABEL[mission.status]}
              </Badge>
              <Badge variant="outline">{MISSION_CATEGORY_LABEL[mission.category]}</Badge>
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              {mission.title}
            </h1>
            <p className="text-sm text-muted-foreground">
              Publiée par {mission.account?.name ?? "un établissement"}
            </p>
          </div>

          <Card>
            <CardHeader>
              <h2 className="font-semibold text-foreground">Description</h2>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                {mission.description}
              </p>
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-4">
          <Card className="lg:sticky lg:top-6">
            <CardContent className="space-y-4 p-5">
              <dl className="space-y-3 text-sm">
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
              </dl>

              {canAccept ? (
                <div className="space-y-2">
                  <AcceptMissionButton missionId={mission.id} accountId={session.account.id} />
                  <p className="text-center text-xs text-muted-foreground">
                    Premier arrivé, premier servi : la mission vous est attribuée dès validation.
                  </p>
                </div>
              ) : mission.status === "FILLED" ? (
                <Button className="w-full" disabled>
                  Mission déjà pourvue
                </Button>
              ) : !isFreelance ? (
                <p className="text-center text-xs text-muted-foreground">
                  Seuls les freelances peuvent accepter une mission de renfort.
                </p>
              ) : (
                <Button className="w-full" disabled>
                  Non disponible
                </Button>
              )}
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={highlight ? "font-semibold text-primary" : "font-medium text-foreground"}>
        {value}
      </dd>
    </div>
  );
}
