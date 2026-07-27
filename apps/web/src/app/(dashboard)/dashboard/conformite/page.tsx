// Coffre-fort de conformité (ESTABLISHMENT) : suivi des pièces obligatoires
// de chaque intervenant (CNI, casier, permis, IBAN, URSSAF…).
import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { requireSession, fetchApi } from "../../../_shared/server";
import { PageHeader, EmptyState, ErrorState, StatCard } from "../../../_shared/ui";
import {
  ComplianceManager,
  type ComplianceMember,
} from "../../../_shared/ComplianceManager";

export const metadata: Metadata = { title: "Coffre-fort conformité" };

interface Summary {
  accountId: string;
  requiredTypes: string[];
  totalMembers: number;
  members: ComplianceMember[];
}

export default async function ConformitePage() {
  const session = await requireSession();

  if (session.account.type !== "ESTABLISHMENT") {
    return (
      <div className="space-y-6">
        <PageHeader title="Coffre-fort de conformité" />
        <EmptyState
          title="Réservé aux établissements"
          description="Le suivi des pièces obligatoires des intervenants est accessible depuis un compte établissement."
          action={
            <Button asChild>
              <Link href="/dashboard">Retour au tableau de bord</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const { data, error } = await fetchApi<Summary>(session, "/conformite");
  const canEdit = ["OWNER", "ADMIN", "MANAGER"].includes(session.account.role);

  if (error || !data) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Coffre-fort de conformité"
          subtitle="Suivez les pièces obligatoires de chaque intervenant et anticipez les renouvellements."
        />
        <ErrorState retryHref="/dashboard/conformite" />
      </div>
    );
  }

  const members = data.members;
  const totalMembers = members.length;
  const fullyCompliant = members.filter((m) => m.completeness.pct === 100).length;
  const toRenew = members.reduce((acc, m) => acc + m.completeness.expiringSoon, 0);
  const missing = members.reduce((acc, m) => acc + m.completeness.missing, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Coffre-fort de conformité"
        subtitle="Suivez les pièces obligatoires de chaque intervenant (CNI, casier judiciaire, permis, IBAN, attestation URSSAF) et anticipez les renouvellements."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Intervenants suivis" value={totalMembers} accent="neutral" />
        <StatCard label="Dossiers conformes" value={fullyCompliant} accent="teal" />
        <StatCard label="Pièces à renouveler" value={toRenew} accent="terracotta" />
        <StatCard label="Pièces manquantes" value={missing} accent="neutral" />
      </div>

      {totalMembers === 0 ? (
        <EmptyState
          title="Aucun intervenant rattaché"
          description="Invitez vos intervenants depuis Équipe & invitations pour suivre leurs pièces obligatoires."
          action={
            <Button asChild>
              <Link href="/dashboard/account">Gérer l'équipe</Link>
            </Button>
          }
        />
      ) : (
        <ComplianceManager members={members} accountId={session.account.id} canEdit={canEdit} />
      )}
    </div>
  );
}
