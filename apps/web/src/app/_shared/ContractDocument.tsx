"use client";

// Contrat de mission de renfort (A4 présentationnel) + impression + signature en ligne.
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { apiRequest } from "@/lib/api";
import { PrintButton } from "./PrintButton";
import { formatDate, formatRate } from "./format";

export interface ContractData {
  id: string;
  accountId: string;
  status: string;
  scheduledAt?: string | null;
  signedFreelanceAt?: string | null;
  signedEstablishmentAt?: string | null;
  mission?: {
    id: string;
    title: string;
    description?: string | null;
    job?: string | null;
    startDate: string;
    endDate?: string | null;
    startTime?: string | null;
    endTime?: string | null;
    city?: string | null;
    postalCode?: string | null;
    hourlyRate?: number | string | null;
    headcount?: number;
    account?: {
      id: string;
      name: string;
      legalName?: string | null;
      siret?: string | null;
      city?: string | null;
      address?: string | null;
    } | null;
  } | null;
  account?: {
    id: string;
    name: string;
    owner?: {
      firstName?: string | null;
      lastName?: string | null;
      email?: string | null;
      phone?: string | null;
      profile?: { job?: string | null; siret?: string | null; city?: string | null } | null;
    } | null;
  } | null;
}

function fullName(o?: { firstName?: string | null; lastName?: string | null } | null, fallback = "—") {
  const n = [o?.firstName, o?.lastName].filter(Boolean).join(" ");
  return n || fallback;
}

export function ContractDocument({
  contract,
  side,
}: {
  contract: ContractData;
  side: "freelance" | "establishment" | "none";
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const m = contract.mission;
  const est = m?.account;
  const fl = contract.account?.owner;

  const mySigned =
    side === "freelance" ? !!contract.signedFreelanceAt : side === "establishment" ? !!contract.signedEstablishmentAt : true;

  async function sign() {
    setLoading(true);
    try {
      // Le compte actif (freelance ou établissement) signe ; l'API détermine le côté.
      const signingAccountId = side === "freelance" ? contract.accountId : est?.id;
      await apiRequest(`/bookings/${contract.id}/sign`, { method: "PATCH", accountId: signingAccountId });
      toast({ title: "Contrat signé", description: "Votre signature a bien été enregistrée." });
      router.refresh();
    } catch (err) {
      toast({ title: "Signature impossible", description: err instanceof Error ? err.message : undefined, variant: "error" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl bg-white p-8 text-[13px] leading-relaxed text-neutral-900 print:p-0">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <div className="text-lg font-bold text-[#156d6b]">LES EXTRAS</div>
          <div className="text-xs text-neutral-500">Contrat de mission de renfort médico-social</div>
        </div>
        <div className="flex gap-2 print:hidden">
          <PrintButton label="Imprimer / PDF" />
        </div>
      </div>

      <h1 className="mb-1 text-xl font-semibold">{m?.title ?? "Mission de renfort"}</h1>
      <p className="mb-6 text-xs text-neutral-500">Référence : {contract.id}</p>

      <div className="mb-6 grid grid-cols-2 gap-4">
        <section className="rounded-lg border border-neutral-200 p-3">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">Établissement</h2>
          <p className="font-medium">{est?.legalName || est?.name || "—"}</p>
          {est?.siret ? <p>SIRET : {est.siret}</p> : null}
          <p>{[est?.address, est?.city].filter(Boolean).join(", ") || "—"}</p>
        </section>
        <section className="rounded-lg border border-neutral-200 p-3">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">Intervenant (freelance)</h2>
          <p className="font-medium">{fullName(fl, contract.account?.name)}</p>
          {fl?.profile?.job ? <p>{fl.profile.job}</p> : null}
          {fl?.profile?.siret ? <p>SIRET : {fl.profile.siret}</p> : null}
          <p>{[fl?.email, fl?.phone].filter(Boolean).join(" · ") || "—"}</p>
        </section>
      </div>

      <section className="mb-6 rounded-lg border border-neutral-200 p-3">
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">Détail de la mission</h2>
        <div className="grid grid-cols-2 gap-y-1">
          <Line label="Métier" value={m?.job ?? "—"} />
          <Line label="Date" value={formatDate(m?.startDate)} />
          <Line label="Horaires" value={m?.startTime || m?.endTime ? `${m?.startTime ?? "?"} – ${m?.endTime ?? "?"}` : "—"} />
          <Line label="Lieu" value={`${m?.city ?? "—"}${m?.postalCode ? ` (${m.postalCode})` : ""}`} />
          <Line label="Rémunération" value={m?.hourlyRate ? formatRate(m.hourlyRate) : "à convenir"} />
          <Line label="Postes" value={String(m?.headcount ?? 1)} />
        </div>
        {m?.description ? (
          <p className="mt-3 whitespace-pre-wrap text-neutral-700">{m.description}</p>
        ) : null}
      </section>

      <section className="mb-8 text-[12px] text-neutral-600">
        <p className="mb-1 font-semibold text-neutral-700">Conditions</p>
        <p>
          Le présent contrat formalise la mission de renfort ci-dessus entre l'établissement et l'intervenant indépendant,
          via la plateforme Les Extras (ADéPA77). L'intervenant s'engage à réaliser la mission aux dates et conditions
          indiquées et à disposer des habilitations requises (pièces de conformité à jour). La rémunération est celle
          mentionnée ; la facturation est émise à l'issue de la mission. Chaque partie signe électroniquement ci-dessous.
        </p>
      </section>

      <div className="grid grid-cols-2 gap-6">
        <SignBlock title="Pour l'établissement" signedAt={contract.signedEstablishmentAt} name={est?.name} />
        <SignBlock title="Pour l'intervenant" signedAt={contract.signedFreelanceAt} name={fullName(fl, contract.account?.name)} />
      </div>

      {side !== "none" ? (
        <div className="mt-6 print:hidden">
          {mySigned ? (
            <p className="text-sm font-medium text-[#156d6b]">✓ Vous avez signé ce contrat.</p>
          ) : (
            <Button disabled={loading} onClick={sign}>
              {loading ? "…" : "Signer le contrat"}
            </Button>
          )}
        </div>
      ) : null}
    </div>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <>
      <div className="text-neutral-500">{label}</div>
      <div className="font-medium">{value}</div>
    </>
  );
}

function SignBlock({ title, signedAt, name }: { title: string; signedAt?: string | null; name?: string | null }) {
  return (
    <div className="rounded-lg border border-dashed border-neutral-300 p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">{title}</p>
      <p className="mt-1 text-sm font-medium">{name ?? "—"}</p>
      <div className="mt-4 h-10 border-b border-neutral-300" />
      <p className="mt-1 text-[11px] text-neutral-500">
        {signedAt
          ? `Signé électroniquement le ${new Date(signedAt).toLocaleDateString("fr-FR")}`
          : "En attente de signature"}
      </p>
    </div>
  );
}
