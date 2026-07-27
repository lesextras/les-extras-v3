"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  ExternalLink,
  MapPin,
  MessageSquareText,
  Receipt,
  Send,
  Trash2,
  UserRound,
} from "lucide-react";
import {
  type AdminMissionCandidate,
  type AdminMissionDetail,
  type AdminMissionLinkedDeskRequest,
} from "@/app/actions/admin";
import { getInvoiceStatusMeta } from "@/components/admin/admin-finance-utils";
import { getDeskRequestTypeLabel } from "@/lib/desk-labels";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { StatusPill } from "@/components/ui/status-pill";
import { Textarea } from "@/components/ui/textarea";

type MissionDetailSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mission: AdminMissionDetail | null;
  isLoading: boolean;
  isPending: boolean;
  onDelete: (missionId: string) => void;
  onReassign: (missionId: string, bookingId: string) => void;
  onNotifyStakeholder: (userId: string, missionId: string, message: string) => void;
};

type NotifyTarget = "ESTABLISHMENT" | "FREELANCE";

const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

const dateTimeFormatter = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

const timeFormatter = new Intl.DateTimeFormat("fr-FR", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

const moneyFormatter = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

function getMissionStatus(
  status: AdminMissionDetail["status"],
): "active" | "published" | "completed" | "cancelled" {
  if (status === "ASSIGNED") return "active";
  if (status === "OPEN") return "published";
  if (status === "COMPLETED") return "completed";
  return "cancelled";
}

function getBookingStatus(
  status: AdminMissionCandidate["status"],
): { pill: "pending" | "confirmed" | "active" | "completed" | "paid" | "cancelled"; label: string } {
  if (status === "PENDING") return { pill: "pending", label: "En attente" };
  if (status === "QUOTE_SENT") return { pill: "pending", label: "Devis envoyé" };
  if (status === "QUOTE_ACCEPTED") return { pill: "confirmed", label: "Devis accepté" };
  if (status === "CONFIRMED") return { pill: "confirmed", label: "Confirmé" };
  if (status === "IN_PROGRESS") return { pill: "active", label: "En cours" };
  if (status === "COMPLETED" || status === "AWAITING_PAYMENT") {
    return { pill: "completed", label: "Terminé" };
  }
  if (status === "PAID") return { pill: "paid", label: "Payé" };
  return { pill: "cancelled", label: "Annulé" };
}

function getDeskStatusMeta(
  status: AdminMissionLinkedDeskRequest["status"],
): { label: string; variant: "default" | "secondary" | "outline" } {
  if (status === "OPEN") return { label: "Ouverte", variant: "default" };
  if (status === "IN_PROGRESS") return { label: "En cours", variant: "secondary" };
  if (status === "ANSWERED") return { label: "Répondue", variant: "outline" };
  return { label: "Clôturée", variant: "outline" };
}

function getPriorityMeta(
  priority: AdminMissionLinkedDeskRequest["priority"],
): { label: string; variant: "quiet" | "default" | "amber" | "coral" } {
  if (priority === "LOW") return { label: "Basse", variant: "quiet" };
  if (priority === "HIGH") return { label: "Haute", variant: "amber" };
  if (priority === "URGENT") return { label: "Urgente", variant: "coral" };
  return { label: "Normale", variant: "default" };
}

function getNotifyTargetUser(mission: AdminMissionDetail, target: NotifyTarget) {
  if (target === "FREELANCE" && mission.assignedFreelance) {
    return mission.assignedFreelance;
  }

  return {
    id: mission.establishmentId,
    name: mission.establishmentName,
    email: mission.establishmentEmail,
  };
}

function buildEstablishmentFollowUp(mission: AdminMissionDetail) {
  return [
    `Le Desk suit actuellement la mission "${mission.title}".`,
    "Merci de confirmer rapidement les éléments encore en attente afin d'éviter un blocage d'attribution ou d'exécution.",
    "Répondez directement dans la plateforme si un arbitrage Desk est nécessaire.",
  ].join("\n");
}

function buildFreelanceFollowUp(mission: AdminMissionDetail) {
  return [
    `Le Desk suit actuellement la mission "${mission.title}".`,
    "Merci de confirmer votre disponibilité et de poursuivre uniquement via la plateforme.",
    "Si un point bloque la mission, répondez directement à l'équipe Desk.",
  ].join("\n");
}

export function MissionDetailSheet({
  open,
  onOpenChange,
  mission,
  isLoading,
  isPending,
  onDelete,
  onReassign,
  onNotifyStakeholder,
}: MissionDetailSheetProps) {
  const [notifyTarget, setNotifyTarget] = useState<NotifyTarget>("ESTABLISHMENT");
  const [notifyMessage, setNotifyMessage] = useState("");

  useEffect(() => {
    if (!mission) {
      setNotifyTarget("ESTABLISHMENT");
      setNotifyMessage("");
      return;
    }

    setNotifyTarget(mission.assignedFreelance ? "FREELANCE" : "ESTABLISHMENT");
    setNotifyMessage("");
  }, [mission]);

  const orderedTimeline = useMemo(() => {
    if (!mission) return [];
    return [...mission.timeline].sort(
      (left, right) => new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime(),
    );
  }, [mission]);

  const notifyUser = mission ? getNotifyTargetUser(mission, notifyTarget) : null;

  const handleNotify = () => {
    if (!mission || !notifyUser) return;
    const message = notifyMessage.trim();
    if (message.length < 5) return;
    onNotifyStakeholder(notifyUser.id, mission.id, message);
    setNotifyMessage("");
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-2xl glass-surface">
        <SheetHeader>
          <SheetTitle>Mission 360</SheetTitle>
          <SheetDescription>
            Lecture opérationnelle de la mission, des acteurs liés et des points de blocage.
          </SheetDescription>
        </SheetHeader>

        {isLoading ? (
          <p className="mt-6 text-sm text-muted-foreground">Chargement de la mission…</p>
        ) : mission ? (
          <div className="mt-6 space-y-6 text-sm">
            <div className="space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Mission</p>
                  <p className="text-xl font-semibold text-foreground">{mission.title}</p>
                  <div className="flex flex-wrap items-center gap-2 text-muted-foreground">
                    <UserRound className="h-4 w-4" aria-hidden="true" />
                    <span>
                      {mission.establishmentName} ({mission.establishmentEmail})
                    </span>
                  </div>
                </div>
                <StatusPill status={getMissionStatus(mission.status)} label={mission.status} />
              </div>

              <div className="flex items-start gap-2 text-muted-foreground">
                <MapPin className="mt-0.5 h-4 w-4" aria-hidden="true" />
                <span>{mission.address}</span>
              </div>

              {mission.attentionItems.length > 0 ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4">
                  <div className="flex items-center gap-2 text-amber-700">
                    <AlertTriangle className="h-4 w-4" aria-hidden="true" />
                    <p className="font-medium">Points d’attention</p>
                  </div>
                  <div className="mt-2 space-y-2">
                    {mission.attentionItems.map((item) => (
                      <p key={item} className="text-sm text-amber-800">
                        {item}
                      </p>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="grid gap-3 rounded-xl border border-border/50 bg-muted/40 p-4 md:grid-cols-3">
              <div>
                <p className="text-xs text-muted-foreground">Date</p>
                <p className="font-medium text-foreground">
                  {dateFormatter.format(new Date(mission.dateStart))}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Créneau</p>
                <p className="font-medium text-foreground">
                  {timeFormatter.format(new Date(mission.dateStart))} -{" "}
                  {timeFormatter.format(new Date(mission.dateEnd))}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Tarif horaire</p>
                <p className="font-medium text-foreground">
                  {moneyFormatter.format(mission.hourlyRate)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Tarif TTC suivi</p>
                <p className="font-medium text-foreground">
                  {mission.proposedTotalTTC != null
                    ? moneyFormatter.format(mission.proposedTotalTTC)
                    : "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Candidatures</p>
                <p className="font-medium text-foreground">{mission.candidatesCount}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Ville / shift</p>
                <p className="font-medium text-foreground">
                  {[mission.city, mission.shift].filter(Boolean).join(" · ") || "—"}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                variant="danger-soft"
                disabled={isPending}
                onClick={() => onDelete(mission.id)}
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
                Annuler proprement
              </Button>
              <Button asChild variant="outline">
                <Link href="/admin/finance">
                  <Receipt className="h-4 w-4" aria-hidden="true" />
                  Voir finance
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/admin/demandes">
                  <ExternalLink className="h-4 w-4" aria-hidden="true" />
                  Voir les tickets
                </Link>
              </Button>
            </div>

            <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="space-y-4 rounded-xl border border-border/60 bg-card/70 p-4">
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    Booking lié
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Attribution confirmée, finance et conversation de la mission.
                  </p>
                </div>

                {mission.linkedBooking ? (
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusPill
                        status={getBookingStatus(mission.linkedBooking.status).pill}
                        label={getBookingStatus(mission.linkedBooking.status).label}
                      />
                      <Badge
                        variant={
                          mission.linkedBooking.paymentStatus === "PAID" ? "success" : "outline"
                        }
                      >
                        paiement {mission.linkedBooking.paymentStatus}
                      </Badge>
                      <span className="font-mono text-xs text-muted-foreground">
                        booking {mission.linkedBooking.id}
                      </span>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                      <div>
                        <p className="text-xs text-muted-foreground">Freelance assigné</p>
                        <p className="font-medium text-foreground">
                          {mission.linkedBooking.assignedFreelance?.name ?? "—"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {mission.linkedBooking.assignedFreelance?.email ?? "—"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Venue confirmée</p>
                        <p className="font-medium text-foreground">
                          {mission.linkedBooking.freelanceAcknowledged ? "Oui" : "Non"}
                        </p>
                      </div>
                    </div>

                    {mission.linkedBooking.invoice || mission.linkedBooking.latestQuote ? (
                      <div className="grid gap-3 md:grid-cols-2">
                        <div className="rounded-lg border border-border/50 bg-muted/30 p-3">
                          <p className="text-xs text-muted-foreground">Facture</p>
                          <p className="font-medium text-foreground">
                            {mission.linkedBooking.invoice?.invoiceNumber ?? "À générer / non suivie"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {mission.linkedBooking.invoice
                              ? `${getInvoiceStatusMeta(mission.linkedBooking.invoice.status).label} · ${moneyFormatter.format(
                                  mission.linkedBooking.invoice.amount,
                                )}`
                              : "Aucune facture liée"}
                          </p>
                        </div>
                        <div className="rounded-lg border border-border/50 bg-muted/30 p-3">
                          <p className="text-xs text-muted-foreground">Dernier devis</p>
                          <p className="font-medium text-foreground">
                            {mission.linkedBooking.latestQuote
                              ? moneyFormatter.format(mission.linkedBooking.latestQuote.totalTTC)
                              : "Aucun devis lié"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {mission.linkedBooking.latestQuote?.status ?? "—"}
                          </p>
                        </div>
                      </div>
                    ) : null}

                    <Separator />

                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <MessageSquareText className="h-4 w-4 text-muted-foreground" />
                        <p className="font-medium text-foreground">Conversation liée</p>
                      </div>
                      {mission.linkedBooking.conversation ? (
                        <div className="space-y-3">
                          <p className="font-mono text-xs text-muted-foreground">
                            conv {mission.linkedBooking.conversation.id}
                          </p>
                          {mission.linkedBooking.conversation.recentMessages.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                              Conversation créée, sans message récent.
                            </p>
                          ) : (
                            mission.linkedBooking.conversation.recentMessages.map((message) => (
                              <div
                                key={message.id}
                                className="rounded-lg border border-border/50 bg-muted/30 p-3"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <p className="font-medium text-foreground">{message.senderName}</p>
                                  <span className="text-xs text-muted-foreground">
                                    {dateTimeFormatter.format(new Date(message.createdAt))}
                                  </span>
                                </div>
                                <p className="mt-2 text-sm text-foreground">
                                  {message.contentExcerpt}
                                </p>
                              </div>
                            ))
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          Aucune conversation liée à ce stade.
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed border-border/60 bg-muted/20 p-4 text-sm text-muted-foreground">
                    Aucun booking confirmé pour cette mission pour le moment.
                  </div>
                )}
              </div>

              <div className="space-y-4 rounded-xl border border-border/60 bg-card/70 p-4">
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    Déblocage Desk
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Relance ciblée de l’établissement ou du freelance déjà impliqué.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    size="xs"
                    variant={notifyTarget === "ESTABLISHMENT" ? "teal-soft" : "outline"}
                    onClick={() => {
                      setNotifyTarget("ESTABLISHMENT");
                      setNotifyMessage(buildEstablishmentFollowUp(mission));
                    }}
                  >
                    Relancer l'établissement
                  </Button>
                  {mission.assignedFreelance ? (
                    <Button
                      size="xs"
                      variant={notifyTarget === "FREELANCE" ? "teal-soft" : "outline"}
                      onClick={() => {
                        setNotifyTarget("FREELANCE");
                        setNotifyMessage(buildFreelanceFollowUp(mission));
                      }}
                    >
                      Relancer le freelance
                    </Button>
                  ) : null}
                </div>

                <div className="rounded-lg border border-border/50 bg-muted/20 p-3">
                  <p className="text-xs text-muted-foreground">Destinataire</p>
                  <p className="font-medium text-foreground">{notifyUser?.name ?? "—"}</p>
                  <p className="text-xs text-muted-foreground">{notifyUser?.email ?? "—"}</p>
                </div>

                <Textarea
                  value={notifyMessage}
                  onChange={(event) => setNotifyMessage(event.target.value)}
                  rows={7}
                  placeholder="Message Desk à transmettre pour débloquer la mission…"
                />

                <Button
                  variant="teal"
                  disabled={isPending || !notifyUser || notifyMessage.trim().length < 5}
                  onClick={handleNotify}
                >
                  <Send className="h-4 w-4" aria-hidden="true" />
                  Notifier l'acteur
                </Button>
              </div>
            </div>

            <div className="space-y-3 rounded-xl border border-border/60 bg-card/70 p-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Candidatures
                </p>
                <p className="text-xs text-muted-foreground">
                  Arbitrage Desk sans ouvrir une messagerie libre entre utilisateurs.
                </p>
              </div>

              {mission.candidates.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border/60 bg-muted/20 p-4 text-sm text-muted-foreground">
                  Aucune candidature enregistrée.
                </div>
              ) : (
                <div className="space-y-3">
                  {mission.candidates.map((candidate) => {
                    const bookingStatus = getBookingStatus(candidate.status);

                    return (
                      <div
                        key={candidate.bookingId}
                        className="rounded-lg border border-border/50 bg-muted/20 p-4"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="space-y-1">
                            <p className="font-medium text-foreground">
                              {candidate.freelance?.name ?? "Freelance non renseigné"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {candidate.freelance?.email ?? "Pas d'email lié"}
                            </p>
                            <p className="font-mono text-[11px] text-muted-foreground">
                              booking {candidate.bookingId}
                            </p>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <StatusPill status={bookingStatus.pill} label={bookingStatus.label} />
                            <Badge
                              variant={candidate.paymentStatus === "PAID" ? "success" : "outline"}
                            >
                              paiement {candidate.paymentStatus}
                            </Badge>
                          </div>
                        </div>

                        <div className="mt-3 grid gap-3 md:grid-cols-4">
                          <div>
                            <p className="text-xs text-muted-foreground">Candidature reçue</p>
                            <p className="font-medium text-foreground">
                              {dateTimeFormatter.format(new Date(candidate.createdAt))}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Taux proposé</p>
                            <p className="font-medium text-foreground">
                              {candidate.proposedRate != null
                                ? moneyFormatter.format(candidate.proposedRate)
                                : "—"}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Dernier devis</p>
                            <p className="font-medium text-foreground">
                              {candidate.latestQuote
                                ? moneyFormatter.format(candidate.latestQuote.totalTTC)
                                : "—"}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Accusé de venue</p>
                            <p className="font-medium text-foreground">
                              {candidate.freelanceAcknowledged ? "Oui" : "Non"}
                            </p>
                          </div>
                        </div>

                        {candidate.canAssign ? (
                          <div className="mt-4">
                            <Button
                              size="sm"
                              variant="teal-soft"
                              disabled={isPending}
                              onClick={() => onReassign(mission.id, candidate.bookingId)}
                            >
                              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                              Attribuer cette candidature
                            </Button>
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="space-y-3 rounded-xl border border-border/60 bg-card/70 p-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Tickets Desk liés
                </p>
                <p className="text-xs text-muted-foreground">
                  {mission.linkedDeskRequests.length} ticket(s) rattaché(s) à la mission.
                </p>
              </div>

              {mission.linkedDeskRequests.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border/60 bg-muted/20 p-4 text-sm text-muted-foreground">
                  Aucun ticket Desk lié.
                </div>
              ) : (
                mission.linkedDeskRequests.map((request) => {
                  const status = getDeskStatusMeta(request.status);
                  const priority = getPriorityMeta(request.priority);

                  return (
                    <div
                      key={request.id}
                      className="rounded-lg border border-border/50 bg-muted/20 p-4"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline">{getDeskRequestTypeLabel(request.type)}</Badge>
                        <Badge variant={status.variant}>{status.label}</Badge>
                        <Badge variant={priority.variant}>{priority.label}</Badge>
                        <span className="text-xs text-muted-foreground">
                          {dateTimeFormatter.format(new Date(request.createdAt))}
                        </span>
                      </div>
                      {request.requester ? (
                        <p className="mt-2 text-xs text-muted-foreground">
                          Demandeur : {request.requester.name} ({request.requester.email})
                        </p>
                      ) : null}
                      <p className="mt-3 text-sm text-foreground">{request.messageExcerpt}</p>
                    </div>
                  );
                })
              )}
            </div>

            <div className="space-y-3 rounded-xl border border-border/60 bg-card/70 p-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Timeline
                </p>
                <p className="text-xs text-muted-foreground">
                  Derniers événements utiles de suivi mission.
                </p>
              </div>

              {orderedTimeline.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border/60 bg-muted/20 p-4 text-sm text-muted-foreground">
                  Aucun événement disponible.
                </div>
              ) : (
                <div className="space-y-3">
                  {orderedTimeline.map((event) => (
                    <div
                      key={event.id}
                      className="rounded-lg border border-border/50 bg-muted/20 p-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-medium text-foreground">{event.label}</p>
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
                          {dateTimeFormatter.format(new Date(event.timestamp))}
                        </span>
                      </div>
                      {event.description ? (
                        <p className="mt-2 text-sm text-muted-foreground">{event.description}</p>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <p className="mt-6 text-sm text-muted-foreground">Aucune mission sélectionnée.</p>
        )}
      </SheetContent>
    </Sheet>
  );
}
