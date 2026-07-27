"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { GlassCard, GlassCardContent } from "@/components/ui/glass-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from "@/components/ui/dialog";
import {
    GraduationCap, Plus, Clock3, Users, CalendarDays, AlertCircle,
    MoreHorizontal, Pencil, Trash2, Archive, Eye, BookOpen,
    TrendingUp, Loader2, Copy
} from "lucide-react";
import { useUIStore } from "@/lib/stores/useUIStore";
import { getCategoryLabel, formatDuration } from "@/lib/atelier-config";
import { updateServiceAction, deleteServiceAction, duplicateServiceAction } from "@/app/actions/marketplace";
import type { BookingLine } from "@/app/actions/bookings";
import type { MesAtelierItem } from "@/app/actions/marketplace";

/* ─── D.6 — « Mes Ateliers et formations » (freelance) ───────────
   Freelance manages their proposed workshops & trainings.
   Tabs: Actifs / Brouillons / Archivés
   Actions: Modifier, Archiver, Supprimer
   ─────────────────────────────────────────────────────────────── */

type ServiceStatus = "ACTIVE" | "DRAFT" | "ARCHIVED";

const STATUS_CONFIG: Record<ServiceStatus, { label: string; variant: "success" | "outline" | "secondary"; dot: string }> = {
    ACTIVE: { label: "Actif", variant: "success", dot: "bg-emerald-500" },
    DRAFT: { label: "Brouillon", variant: "outline", dot: "bg-amber-500" },
    ARCHIVED: { label: "Archivé", variant: "secondary", dot: "bg-gray-400" },
};

interface MesAteliersClientProps {
    ateliers: MesAtelierItem[];
    serviceBookings: BookingLine[];
    error?: string;
}

/* ─── Edit Dialog ────────────────────────────────────────────── */

function EditAtelierDialog({
    atelier,
    open,
    onOpenChange,
    onSaved,
}: {
    atelier: MesAtelierItem;
    open: boolean;
    onOpenChange: (v: boolean) => void;
    onSaved: () => void;
}) {
    const [title, setTitle] = React.useState(atelier.title);
    const [description, setDescription] = React.useState(atelier.description || "");
    const [price, setPrice] = React.useState(String(atelier.price));
    const [capacity, setCapacity] = React.useState(String(atelier.capacity));
    const [durationMinutes, setDurationMinutes] = React.useState(String(atelier.durationMinutes));
    const [saving, setSaving] = React.useState(false);

    React.useEffect(() => {
        setTitle(atelier.title);
        setDescription(atelier.description || "");
        setPrice(String(atelier.price));
        setCapacity(String(atelier.capacity));
        setDurationMinutes(String(atelier.durationMinutes));
    }, [atelier]);

    async function handleSave() {
        setSaving(true);
        const result = await updateServiceAction(atelier.id, {
            title,
            description: description || undefined,
            price: Number(price),
            capacity: Number(capacity),
            durationMinutes: Number(durationMinutes),
        });
        setSaving(false);
        if (!result.ok) {
            toast.error(result.error);
            return;
        }

        onOpenChange(false);
        onSaved();
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Modifier l&apos;atelier</DialogTitle>
                    <DialogDescription>
                        Modifiez les informations de votre atelier ou formation.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="edit-title">Titre</Label>
                        <Input id="edit-title" value={title} onChange={(e) => setTitle(e.target.value)} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="edit-desc">Description</Label>
                        <Textarea id="edit-desc" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                        <div className="grid gap-2">
                            <Label htmlFor="edit-price">Prix (€)</Label>
                            <Input id="edit-price" type="number" min="0" value={price} onChange={(e) => setPrice(e.target.value)} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="edit-capacity">Capacité</Label>
                            <Input id="edit-capacity" type="number" min="1" value={capacity} onChange={(e) => setCapacity(e.target.value)} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="edit-duration">Durée (min)</Label>
                            <Input id="edit-duration" type="number" min="30" value={durationMinutes} onChange={(e) => setDurationMinutes(e.target.value)} />
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
                        Annuler
                    </Button>
                    <Button onClick={handleSave} disabled={saving || !title.trim()}>
                        {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Enregistrer
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

/* ─── Delete Confirmation Dialog ──────────────────────────────── */

function DeleteConfirmDialog({
    atelier,
    open,
    onOpenChange,
    onDeleted,
}: {
    atelier: MesAtelierItem;
    open: boolean;
    onOpenChange: (v: boolean) => void;
    onDeleted: () => void;
}) {
    const [deleting, setDeleting] = React.useState(false);

    async function handleDelete() {
        setDeleting(true);
        const result = await deleteServiceAction(atelier.id);
        setDeleting(false);
        if (!result.ok) {
            toast.error(result.error);
            return;
        }

        onOpenChange(false);
        onDeleted();
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>
                        Supprimer {atelier.type === "TRAINING" ? "cette formation" : "cet atelier"} ?
                    </DialogTitle>
                    <DialogDescription>
                        {atelier.type === "TRAINING"
                            ? "Cette action est irréversible. Si des réservations sont liées à cette formation, elle sera archivée au lieu d'être supprimée."
                            : "Cette action est irréversible. Si des réservations sont liées à cet atelier, il sera archivé au lieu d'être supprimé."}
                    </DialogDescription>
                </DialogHeader>
                <p className="text-sm font-medium">{atelier.title}</p>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={deleting}>
                        Annuler
                    </Button>
                    <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
                        {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Supprimer
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

/* ─── Atelier Row ─────────────────────────────────────────────── */

function AtelierRow({
    atelier,
    onEdit,
    onDelete,
    onArchive,
    onPublish,
    onDuplicate,
}: {
    atelier: MesAtelierItem;
    onEdit: () => void;
    onDelete: () => void;
    onArchive: () => void;
    onPublish: () => void;
    onDuplicate: () => void;
}) {
    const pricingLabel =
        atelier.pricingType === "QUOTE"
            ? "Sur devis"
            : atelier.pricingType === "PER_PARTICIPANT" && atelier.pricePerParticipant
                ? `${atelier.pricePerParticipant} €/pers.`
                : `${atelier.price} €`;

    const slotsCount = Array.isArray(atelier.slots) ? atelier.slots.length : 0;
    const bookingsCount = Array.isArray(atelier.bookings) ? atelier.bookings.length : 0;
    const statusCfg = STATUS_CONFIG[atelier.status] || STATUS_CONFIG.ACTIVE;
    const marketplaceHref =
        atelier.status === "ACTIVE" ? `/marketplace/services/${atelier.id}` : null;

    return (
        <GlassCard className="transition-all hover:shadow-lg hover:-translate-y-0.5 group">
            <GlassCardContent className="p-0">
                <div className="flex items-stretch">
                    {/* Color bar by status */}
                    <div className={`w-1 shrink-0 rounded-l-xl ${statusCfg.dot}`} />

                    <div className="flex-1 p-4">
                        <div className="flex items-start justify-between gap-4">
                            {/* Left: icon + info */}
                            <div className="flex items-start gap-3 min-w-0 flex-1">
                                <div className="h-11 w-11 rounded-xl bg-[hsl(var(--color-violet-50))] dark:bg-[rgba(13,44,52,.72)] flex items-center justify-center shrink-0">
                                    {atelier.type === "TRAINING" ? (
                                        <BookOpen className="h-5 w-5 text-[hsl(var(--teal))]" aria-hidden="true" />
                                    ) : (
                                        <GraduationCap className="h-5 w-5 text-[hsl(var(--color-violet-600))]" aria-hidden="true" />
                                    )}
                                </div>
                                <div className="min-w-0 space-y-1.5">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        {marketplaceHref ? (
                                            <Link href={marketplaceHref} className="hover:underline">
                                                <h3 className="text-sm font-semibold truncate max-w-[300px]">{atelier.title}</h3>
                                            </Link>
                                        ) : (
                                            <h3 className="text-sm font-semibold truncate max-w-[300px]">{atelier.title}</h3>
                                        )}
                                        <Badge variant={statusCfg.variant} className="text-[10px] px-1.5 py-0">
                                            {statusCfg.label}
                                        </Badge>
                                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-[hsl(var(--teal)/0.4)] text-[hsl(var(--teal))]">
                                            {atelier.type === "TRAINING" ? "Formation" : "Atelier"}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                                        {atelier.category && <span>{getCategoryLabel(atelier.category)}</span>}
                                        <span className="inline-flex items-center gap-1">
                                            <Clock3 className="h-3 w-3" aria-hidden="true" />
                                            {formatDuration(atelier.durationMinutes)}
                                        </span>
                                        <span className="inline-flex items-center gap-1">
                                            <Users className="h-3 w-3" aria-hidden="true" />
                                            {atelier.capacity} pers.
                                        </span>
                                        <span className="inline-flex items-center gap-1">
                                            <CalendarDays className="h-3 w-3" aria-hidden="true" />
                                            {slotsCount} créneau{slotsCount !== 1 ? "x" : ""}
                                        </span>
                                        {bookingsCount > 0 && (
                                            <span className="inline-flex items-center gap-1 text-[hsl(var(--teal))] font-medium">
                                                <TrendingUp className="h-3 w-3" aria-hidden="true" />
                                                {bookingsCount} réservation{bookingsCount > 1 ? "s" : ""}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Right: price + actions */}
                            <div className="flex items-center gap-3 shrink-0">
                                <div className="text-right hidden sm:block">
                                    <p className="text-lg font-bold text-[hsl(var(--teal))]">{pricingLabel}</p>
                                    <p className="text-[10px] text-muted-foreground">
                                        {atelier.pricingType === "PER_PARTICIPANT" ? "par participant" : "par session"}
                                    </p>
                                </div>

                                <div className="flex items-center gap-1">
                                    {atelier.status === "DRAFT" && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="gap-1.5"
                                            onClick={onPublish}
                                        >
                                            <TrendingUp className="h-4 w-4" />
                                            Publier
                                        </Button>
                                    )}
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={onEdit}
                                        title="Modifier"
                                    >
                                        <Pencil className="h-4 w-4" />
                                    </Button>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            {marketplaceHref && (
                                                <DropdownMenuItem asChild>
                                                    <Link href={marketplaceHref} className="flex items-center gap-2">
                                                        <Eye className="h-4 w-4" /> Voir la fiche
                                                    </Link>
                                                </DropdownMenuItem>
                                            )}
                                            <DropdownMenuItem onClick={onEdit} className="flex items-center gap-2">
                                                <Pencil className="h-4 w-4" /> Modifier
                                            </DropdownMenuItem>
                                            {atelier.status === "DRAFT" && (
                                                <DropdownMenuItem onClick={onPublish} className="flex items-center gap-2">
                                                    <TrendingUp className="h-4 w-4" /> Publier ce brouillon
                                                </DropdownMenuItem>
                                            )}
                                            <DropdownMenuItem onClick={onDuplicate} className="flex items-center gap-2">
                                                <Copy className="h-4 w-4" /> Dupliquer
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            {atelier.status !== "ARCHIVED" && (
                                                <DropdownMenuItem onClick={onArchive} className="flex items-center gap-2">
                                                    <Archive className="h-4 w-4" /> Archiver
                                                </DropdownMenuItem>
                                            )}
                                            <DropdownMenuItem onClick={onDelete} className="flex items-center gap-2 text-destructive focus:text-destructive">
                                                <Trash2 className="h-4 w-4" /> Supprimer
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </GlassCardContent>
        </GlassCard>
    );
}

/* ─── Main Component ──────────────────────────────────────────── */

export function MesAteliersClient({ ateliers, serviceBookings, error }: MesAteliersClientProps) {
    const router = useRouter();
    const openPublishModal = useUIStore((s) => s.openPublishModal);

    const [editTarget, setEditTarget] = React.useState<MesAtelierItem | null>(null);
    const [deleteTarget, setDeleteTarget] = React.useState<MesAtelierItem | null>(null);

    const pendingCount = serviceBookings.filter((line) => line.status === "PENDING").length;
    const confirmedCount = serviceBookings.filter((line) => line.status === "CONFIRMED").length;
    const completedCount = serviceBookings.filter((line) => line.status === "COMPLETED" || line.status === "PAID").length;

    const activeAteliers = ateliers.filter((a) => a.status === "ACTIVE");
    const draftAteliers = ateliers.filter((a) => a.status === "DRAFT");
    const archivedAteliers = ateliers.filter((a) => a.status === "ARCHIVED");
    const defaultTab =
        activeAteliers.length > 0
            ? "active"
            : draftAteliers.length > 0
                ? "draft"
                : "archived";

    function refresh() {
        router.refresh();
    }

    async function handleArchive(atelier: MesAtelierItem) {
        const result = await updateServiceAction(atelier.id, { status: "ARCHIVED" });
        if (!result.ok) {
            toast.error(result.error);
            return;
        }
        refresh();
    }

    async function handlePublish(atelier: MesAtelierItem) {
        const result = await updateServiceAction(atelier.id, { status: "ACTIVE" });
        if (!result.ok) {
            toast.error(result.error);
            return;
        }
        refresh();
    }

    async function handleDuplicate(atelier: MesAtelierItem) {
        const result = await duplicateServiceAction(atelier.id);
        if (!result.ok) {
            toast.error(result.error);
            return;
        }
        refresh();
    }

    if (error) {
        return (
            <EmptyState
                icon={AlertCircle}
                title="Impossible de charger vos ateliers"
                description={error}
                primaryAction={{ label: "Retour au dashboard", href: "/dashboard" }}
            />
        );
    }

    function renderList(list: MesAtelierItem[], emptyMsg: string) {
        if (list.length === 0) {
            return (
                <div className="py-12 text-center text-sm text-muted-foreground">
                    {emptyMsg}
                </div>
            );
        }
        return (
            <div className="space-y-2">
                {list.map((atelier) => (
                    <AtelierRow
                        key={atelier.id}
                        atelier={atelier}
                        onEdit={() => setEditTarget(atelier)}
                        onDelete={() => setDeleteTarget(atelier)}
                        onArchive={() => handleArchive(atelier)}
                        onPublish={() => handlePublish(atelier)}
                        onDuplicate={() => handleDuplicate(atelier)}
                    />
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="space-y-1">
                    <p className="text-overline uppercase tracking-widest text-muted-foreground">Espace Freelance</p>
                    <h1 className="font-display text-heading-xl tracking-tight">
                        Mes ateliers et formations{" "}
                        {ateliers.length > 0 && <span className="text-muted-foreground">({ateliers.length})</span>}
                    </h1>
                </div>
                <Button variant="default" className="gap-2 min-h-[44px]" onClick={openPublishModal}>
                    <Plus className="h-4 w-4" aria-hidden="true" />
                    Publier un atelier ou une formation
                </Button>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <GlassCard>
                    <GlassCardContent className="p-4 flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                            <Clock3 className="h-5 w-5 text-amber-500" aria-hidden="true" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">Demandes en attente</p>
                            <p className="text-2xl font-bold">{pendingCount}</p>
                        </div>
                    </GlassCardContent>
                </GlassCard>
                <GlassCard>
                    <GlassCardContent className="p-4 flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                            <CalendarDays className="h-5 w-5 text-emerald-500" aria-hidden="true" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">Réservations confirmées</p>
                            <p className="text-2xl font-bold">{confirmedCount}</p>
                        </div>
                    </GlassCardContent>
                </GlassCard>
                <GlassCard>
                    <GlassCardContent className="p-4 flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-[hsl(var(--teal))]/10 flex items-center justify-center shrink-0">
                            <TrendingUp className="h-5 w-5 text-[hsl(var(--teal))]" aria-hidden="true" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">Sessions réalisées</p>
                            <p className="text-2xl font-bold">{completedCount}</p>
                        </div>
                    </GlassCardContent>
                </GlassCard>
            </div>

            {/* Tabs */}
            {ateliers.length === 0 ? (
                <EmptyState
                    icon={GraduationCap}
                    title="Vous n'avez pas encore publié de service"
                    description="Proposez votre premier atelier ou formation pour recevoir des demandes de réservation."
                    primaryAction={{ label: "Publier un atelier ou une formation", onClick: openPublishModal }}
                />
            ) : (
                <Tabs defaultValue={defaultTab} className="w-full">
                    <TabsList className="w-full sm:w-auto">
                        <TabsTrigger value="active" className="gap-1.5">
                            Actifs
                            {activeAteliers.length > 0 && (
                                <Badge variant="success" className="ml-1 text-[10px] px-1.5 py-0 min-w-[18px]">
                                    {activeAteliers.length}
                                </Badge>
                            )}
                        </TabsTrigger>
                        <TabsTrigger value="draft" className="gap-1.5">
                            Brouillons
                            {draftAteliers.length > 0 && (
                                <Badge variant="outline" className="ml-1 text-[10px] px-1.5 py-0 min-w-[18px]">
                                    {draftAteliers.length}
                                </Badge>
                            )}
                        </TabsTrigger>
                        <TabsTrigger value="archived" className="gap-1.5">
                            Archivés
                            {archivedAteliers.length > 0 && (
                                <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 py-0 min-w-[18px]">
                                    {archivedAteliers.length}
                                </Badge>
                            )}
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="active" className="mt-4">
                        {renderList(activeAteliers, "Aucun service actif. Publiez votre premier atelier ou formation !")}
                    </TabsContent>
                    <TabsContent value="draft" className="mt-4">
                        {renderList(draftAteliers, "Aucun brouillon en cours.")}
                    </TabsContent>
                    <TabsContent value="archived" className="mt-4">
                        {renderList(archivedAteliers, "Aucun atelier archivé.")}
                    </TabsContent>
                </Tabs>
            )}

            {/* Edit Dialog */}
            {editTarget && (
                <EditAtelierDialog
                    atelier={editTarget}
                    open={!!editTarget}
                    onOpenChange={(v) => { if (!v) setEditTarget(null); }}
                    onSaved={refresh}
                />
            )}

            {/* Delete Confirmation Dialog */}
            {deleteTarget && (
                <DeleteConfirmDialog
                    atelier={deleteTarget}
                    open={!!deleteTarget}
                    onOpenChange={(v) => { if (!v) setDeleteTarget(null); }}
                    onDeleted={refresh}
                />
            )}
        </div>
    );
}
