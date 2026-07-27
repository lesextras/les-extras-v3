"use client";

import { AlertTriangle, EyeOff, Inbox, Receipt, Star, UserCheck } from "lucide-react";
import { KpiTile } from "@/components/dashboard/KpiTile";
import type { AdminOverviewData } from "@/app/actions/admin";

type AdminStatsProps = {
  data: AdminOverviewData;
};

export function AdminStats({ data }: AdminStatsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <KpiTile
        label="Utilisateurs à valider"
        value={data.pendingUsersCount}
        icon={UserCheck}
        iconColor="teal"
        href="/admin/users"
      />
      <KpiTile
        label="Demandes Desk ouvertes"
        value={data.openDeskRequestsCount}
        icon={Inbox}
        iconColor="violet"
        href="/admin/demandes"
      />
      <KpiTile
        label="Missions urgentes 48h"
        value={data.urgentOpenMissionsCount}
        icon={AlertTriangle}
        iconColor="coral"
        href="/admin/missions"
      />
      <KpiTile
        label="Services mis en avant"
        value={data.featuredServicesCount}
        icon={Star}
        iconColor="amber"
        href="/admin/services"
      />
      <KpiTile
        label="Services masqués"
        value={data.hiddenServicesCount}
        icon={EyeOff}
        iconColor="gray"
        href="/admin/services"
      />
      <KpiTile
        label="Paiements en attente"
        value={data.awaitingPaymentCount}
        icon={Receipt}
        iconColor="emerald"
        href="/admin/finance"
      />
    </div>
  );
}
