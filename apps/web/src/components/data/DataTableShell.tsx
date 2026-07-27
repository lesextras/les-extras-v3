"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { ChevronLeft, ChevronRight, Package } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";

export interface DataTablePagination {
    page: number;
    pageSize: number;
    total: number;
    onPageChange: (page: number) => void;
}

export interface DataTableShellProps extends React.HTMLAttributes<HTMLDivElement> {
    title?: string;
    description?: string;
    filterSlot?: React.ReactNode;
    actionSlot?: React.ReactNode;
    columns: string[];
    pagination?: DataTablePagination;
    emptyTitle?: string;
    emptyDescription?: string;
    isLoading?: boolean;
    density?: "comfortable" | "compact";
}

export function DataTableShell({
    title,
    description,
    filterSlot,
    actionSlot,
    columns,
    pagination,
    emptyTitle = "Aucun résultat",
    emptyDescription = "Essayez de modifier vos filtres.",
    isLoading = false,
    density = "comfortable",
    className,
    children,
    ...props
}: DataTableShellProps) {
    const totalPages = pagination
        ? Math.ceil(pagination.total / pagination.pageSize)
        : 0;

    const isCompact = density === "compact";

    return (
        <div
            className={cn(
                "rounded-lg border border-border bg-card shadow-sm",
                className
            )}
            {...props}
        >
            {/* Header */}
            {(title || filterSlot || actionSlot) && (
                <div className={cn("border-b border-border/50", isCompact ? "px-4 py-3" : "p-5")}>
                    {(title || actionSlot) && (
                        <div className="flex items-start justify-between gap-4 mb-3">
                            <div>
                                {title && (
                                    <h3 className={cn("font-semibold text-foreground", isCompact ? "text-base" : "text-lg")}>
                                        {title}
                                    </h3>
                                )}
                                {description && (
                                    <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
                                )}
                            </div>
                            {actionSlot && <div className="shrink-0 flex items-center gap-2">{actionSlot}</div>}
                        </div>
                    )}
                    {filterSlot && <div className="flex flex-wrap items-center gap-2">{filterSlot}</div>}
                </div>
            )}

            {/* Table */}
            <div className="overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            {columns.map((col) => (
                                <TableHead key={col} className={cn(isCompact && "py-2 text-xs")}>
                                    {col}
                                </TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody className={cn(isCompact && "[&_td]:py-1.5 [&_td]:px-2 [&_td]:text-sm")}>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="py-8 text-center text-sm text-muted-foreground">
                                    Chargement…
                                </TableCell>
                            </TableRow>
                        ) : React.Children.count(children) === 0 ? (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="py-0">
                                    <EmptyState
                                        icon={Package}
                                        title={emptyTitle}
                                        description={emptyDescription}
                                        className="py-10"
                                    />
                                </TableCell>
                            </TableRow>
                        ) : (
                            children
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            {pagination && totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-border/50 px-4 py-3">
                    <p className="text-xs text-muted-foreground">
                        Page {pagination.page} sur {totalPages} · {pagination.total} résultats
                    </p>
                    <div className="flex items-center gap-1">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            disabled={pagination.page <= 1}
                            onClick={() => pagination.onPageChange(pagination.page - 1)}
                            aria-label="Page précédente"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            disabled={pagination.page >= totalPages}
                            onClick={() => pagination.onPageChange(pagination.page + 1)}
                            aria-label="Page suivante"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
