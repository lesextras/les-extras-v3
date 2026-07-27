import { getPendingKycDocuments } from "@/app/actions/admin";
import { KycQueueTable } from "@/components/admin/KycQueueTable";

export const dynamic = "force-dynamic";

export default async function AdminKycPage() {
  const documents = await getPendingKycDocuments();

  return (
    <section className="space-y-5">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold text-foreground">Documents à vérifier</h1>
        <p className="text-sm text-muted-foreground">
          File KYC du Desk pour les freelances en attente de contrôle.
        </p>
      </header>

      <KycQueueTable initialDocuments={documents} />
    </section>
  );
}
