"use client";

import { useState, useTransition } from "react";
import { Eye, EyeOff, Star } from "lucide-react";
import { toast } from "sonner";
import {
  featureService,
  getAdminServiceDetail,
  getAdminServices,
  hideService,
  type AdminServiceDetail,
  type AdminServiceRow,
} from "@/app/actions/admin";
import { ServiceDetailSheet } from "@/components/admin/ServiceDetailSheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTableShell } from "@/components/data/DataTableShell";
import { TableCell, TableRow } from "@/components/ui/table";

type ServicesTableProps = {
  services: AdminServiceRow[];
};

const moneyFormatter = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

function getTypeLabel(type: AdminServiceRow["type"]): string {
  return type === "WORKSHOP" ? "Atelier" : "Formation";
}

export function ServicesTable({ services }: ServicesTableProps) {
  const [rows, setRows] = useState<AdminServiceRow[]>(services);
  const [selectedService, setSelectedService] = useState<AdminServiceDetail | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isDetailsLoading, setIsDetailsLoading] = useState(false);
  const [isPending, startTransition] = useTransition();

  const refreshRows = async (serviceId?: string | null) => {
    const [nextRows, nextDetail] = await Promise.all([
      getAdminServices(),
      serviceId ? getAdminServiceDetail(serviceId) : Promise.resolve(null),
    ]);

    setRows(nextRows);
    if (serviceId) {
      setSelectedService(nextDetail);
    }
  };

  const handleOpenDetails = (serviceId: string) => {
    setIsSheetOpen(true);
    setIsDetailsLoading(true);
    setSelectedService(null);

    void getAdminServiceDetail(serviceId)
      .then((nextService) => {
        setSelectedService(nextService);
      })
      .catch((error) => {
        toast.error(error instanceof Error ? error.message : "Impossible de charger le service.");
      })
      .finally(() => {
        setIsDetailsLoading(false);
      });
  };

  const handleToggleFeature = (serviceId: string) => {
    startTransition(() => {
      void (async () => {
        try {
          await featureService(serviceId);
          await refreshRows(selectedService?.id === serviceId ? serviceId : null);
          toast.success("Mise en avant mise à jour.");
        } catch (error) {
          toast.error(error instanceof Error ? error.message : "Impossible de modifier la mise en avant.");
        }
      })();
    });
  };

  const handleToggleHide = (serviceId: string) => {
    startTransition(() => {
      void (async () => {
        try {
          await hideService(serviceId);
          await refreshRows(selectedService?.id === serviceId ? serviceId : null);
          toast.success("Visibilité du service mise à jour.");
        } catch (error) {
          toast.error(error instanceof Error ? error.message : "Impossible de modifier la visibilité.");
        }
      })();
    });
  };

  return (
    <>
      <DataTableShell
        columns={["Titre", "Freelance", "Prix", "Type", "Actions"]}
        emptyTitle="Aucun service à modérer"
        emptyDescription="Tous les services sont traités."
      >
        {rows.map((service) => (
          <TableRow
            key={service.id}
            className="cursor-pointer"
            onClick={() => handleOpenDetails(service.id)}
          >
            <TableCell className="font-medium text-foreground">{service.title}</TableCell>
            <TableCell className="text-sm text-muted-foreground">{service.freelanceName}</TableCell>
            <TableCell className="text-sm text-foreground">
              {moneyFormatter.format(service.price)}
            </TableCell>
            <TableCell>
              <Badge variant="quiet">{getTypeLabel(service.type)}</Badge>
            </TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-2">
                <Button
                  size="sm"
                  variant={service.isFeatured ? "default" : "outline"}
                  disabled={isPending}
                  onClick={(event) => {
                    event.stopPropagation();
                    void handleToggleFeature(service.id);
                  }}
                >
                  <Star className="h-4 w-4" />
                  {service.isFeatured ? "En avant" : "Mettre en avant"}
                </Button>
                <Button
                  size="sm"
                  variant={service.isHidden ? "glass" : "outline"}
                  disabled={isPending}
                  onClick={(event) => {
                    event.stopPropagation();
                    void handleToggleHide(service.id);
                  }}
                >
                  {service.isHidden ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  {service.isHidden ? "Afficher" : "Masquer"}
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </DataTableShell>

      <ServiceDetailSheet
        open={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        service={selectedService}
        isLoading={isDetailsLoading}
        isPending={isPending}
        onToggleFeature={handleToggleFeature}
        onToggleHide={handleToggleHide}
      />
    </>
  );
}
