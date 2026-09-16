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
} from "../../../_shared/format";
import type { BlocageReponse, Mission } from "../../../_shared/types";

export const metadata: Metadata = { title: "Mission" };

export default async function MissionDetailPage({ params: paramsPromesse }: { params: Promise<{ id: string }>}) {
  const params = await paramsPromesse;
  const session = await requireSession();
  const { data: mission } = await fetchApi<
    Mission & { alreadyApplied?: boolean; blocages?: BlocageReponse[] }
  >(session, `/missions/${params.id}`);
  if (!mission) notFound();

  const isFreelance = session.account.type === "FREELANCE";
  /**
   * ⚠ LE SERVEUR DIT CE QUI MANQUE, L'ÉCRAN LE MONTRE AVANT LE CLIC.
   *
   * Les deux règles réparables — le montage déclaré et le dossier déposé —
   * refusaient la candidature au moment du clic, avec un message rouge sur un
   * bouton qu'on venait de proposer. Un refus qu'on n'a pas vu venir se lit
   * comme une panne, et personne ne va chercher la réparation dans le menu.
   *
   * ⚠ ON N'ENLÈVE PAS LE REFUS SERVEUR pour autant : c'est lui qui fait foi.
   * Ceci ne dispense de rien, ça prévient.
   */
  const blocages = mission.blocages ?? [];
  const canAccept = isFreelance && mission.status === "PUBLISHED" && blocages.length === 0;

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
                  <Row label="Horaires" value={`${mission.startTime ?? "?"}, ${mission.endTime ?? "?"}`} />
                ) : null}
                {mission.job ? <Row label="Métier" value={mission.job} /> : null}
                <Row
                  label="Lieu"
                  value={`${mission.city ?? "-"}${mission.postalCode ? ` (${mission.postalCode})` : ""}`}
                />
                <Row label="Postes" value={String(mission.headcount)} />
              </dl>

              {mission.attachmentUrl ? (
                <a
                  href={mission.attachmentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                >
                  📎 Pièce jointe de la mission
                </a>
              ) : null}

              {/*
                L'avertissement passe AVANT le bouton : lu après, il ne sert
                plus à rien — la personne a déjà cliqué.
              */}
              {isFreelance && blocages.length > 0 ? (
                <div className="space-y-2">
                  {blocages.map((b) => (
                    <div
                      key={b.code}
                      className="rounded-lg border-2 border-secondary/40 bg-secondary/10 p-3"
                    >
                      <p className="text-sm font-semibold">{b.titre}</p>
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground" lang="fr">
                        {b.message}
                      </p>
                      <Button asChild size="sm" variant="outline" className="mt-2 w-full">
                        <Link href={b.href}>{b.action}</Link>
                      </Button>
                    </div>
                  ))}
                </div>
              ) : null}

              {canAccept ? (
                <div className="space-y-2">
                  <AcceptMissionButton
                    missionId={mission.id}
                    accountId={session.account.id}
                    mode={mission.modeAttribution}
                  />
                  <p className="text-center text-xs text-muted-foreground">
                    {mission.modeAttribution === "FILE_ENGAGEMENT"
                      ? "Votre profil est présenté à l’établissement, qui accepte ou refuse. Le contrat n’est émis qu’après son accord : d’ici là, rien ne vous engage."
                      : "Premier arrivé, premier servi : la mission vous est attribuée dès validation."}
                  </p>
                </div>
              ) : mission.status === "FILLED" ? (
                <Button className="w-full" disabled>
                  Mission déjà pourvue
                </Button>
              ) : !isFreelance ? (
                <p className="text-center text-xs text-muted-foreground">
                  Seuls les intervenants peuvent accepter une mission de renfort.
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
