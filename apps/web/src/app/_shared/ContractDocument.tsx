"use client";

// PROPOSITION D'ENGAGEMENT (A4 présentationnel).
//
// Ce document s'appelait « contrat de mission de renfort ». Le mot était faux,
// et le faux mot portait un risque : un document signé par les deux parties
// via la plateforme, fixant une rémunération et annonçant une facturation,
// ressemble à une mise à disposition de personnel. Le Conseil d'État, le
// 11 février 2025, a jugé qu'un indépendant intervenant dans les horaires,
// les locaux et sous l'encadrement d'un établissement est en lien de
// subordination.
//
// Ce que la plateforme fait, elle le dit donc : elle a trouvé quelqu'un, elle
// chiffre, elle s'arrête. L'établissement embauche lui-même — et le bouton
// « Établir le CDD » le conduit là où l'outil l'accompagne vraiment.
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
  /** « service » pour un atelier ; absent pour une mission de renfort. */
  kind?: "service";
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
  // Les deux parties telles que l'API les livre désormais, dans les DEUX flux :
  // `mission.account` est l'établissement, `account` est l'intervenant. Sur un
  // atelier, l'API renvoyait l'inverse — le propriétaire de la fiche, donc
  // l'intervenant, tenait le bloc « Établissement ». Rien ne se déduit ici de
  // `contract.accountId`, qui ne dit que le demandeur.
  const est = m?.account;
  const fl = contract.account?.owner;

  const mySigned =
    side === "freelance" ? !!contract.signedFreelanceAt : side === "establishment" ? !!contract.signedEstablishmentAt : true;

  async function sign() {
    setLoading(true);
    try {
      // Le compte actif (freelance ou établissement) signe ; l'API détermine le côté.
      // On envoie l'identifiant du compte de la PARTIE, pas `contract.accountId` :
      // sur un atelier, ce dernier est celui de l'établissement, et le côté
      // « freelance » signait donc au nom du directeur.
      const signingAccountId = side === "freelance" ? contract.account?.id : est?.id;
      await apiRequest(`/bookings/${contract.id}/sign`, { method: "PATCH", accountId: signingAccountId });
      toast({
        title: "Proposition acceptée",
        description: "Votre accord est enregistré. Le contrat de travail reste à établir par l'établissement.",
      });
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
          <div className="text-xs text-neutral-500">Proposition d’engagement — renfort médico-social</div>
        </div>
        <div className="flex gap-2 print:hidden">
          <Button asChild variant="outline" size="sm">
            <a
              href={`/api/proxy/documents/proposition/${contract.id}.pdf`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Télécharger le PDF
            </a>
          </Button>
          <PrintButton label="Imprimer" />
        </div>
      </div>

      <h1 className="mb-1 text-xl font-semibold">{m?.title ?? "Besoin de renfort"}</h1>
      <p className="mb-4 text-xs text-neutral-500">Référence : {contract.id}</p>

      <p className="mb-6 rounded-lg border border-amber-300 bg-amber-50 p-3 text-[12px] leading-relaxed text-neutral-800">
        <strong>Ce document n’est pas un contrat de travail.</strong> Il présente la personne
        trouvée pour votre besoin et chiffre ce que représenterait son engagement. Si vous
        l’acceptez, votre établissement conclut directement un CDD avec elle : vous en êtes
        l’employeur, et la plateforme n’intervient ni dans la rémunération ni dans le lien de
        subordination.
      </p>

      <div className="mb-6 grid grid-cols-2 gap-4">
        <section className="rounded-lg border border-neutral-200 p-3">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">Établissement</h2>
          <p className="font-medium">{est?.legalName || est?.name || "—"}</p>
          {est?.siret ? <p>SIRET : {est.siret}</p> : null}
          <p>{[est?.address, est?.city].filter(Boolean).join(", ") || "—"}</p>
        </section>
        <section className="rounded-lg border border-neutral-200 p-3">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">Personne proposée</h2>
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
          <Line label="Taux horaire brut" value={m?.hourlyRate ? formatRate(m.hourlyRate) : "à convenir"} />
          <Line label="Postes" value={String(m?.headcount ?? 1)} />
        </div>
        {m?.description ? (
          <p className="mt-3 whitespace-pre-wrap text-neutral-700">{m.description}</p>
        ) : null}
      </section>

      <section className="mb-8 text-[12px] text-neutral-600">
        <p className="mb-1 font-semibold text-neutral-700">Ce qui se passe ensuite</p>
        <p>
          Le montant indiqué est une rémunération brute estimée : les cotisations patronales s’y
          ajoutent et dépendent de votre convention collective, de votre effectif et des
          exonérations dont vous bénéficiez. Une fois cette proposition acceptée par les deux
          parties, votre établissement établit le contrat à durée déterminée — les éléments
          ci-dessus y sont repris automatiquement, et l’outil vérifie qu’aucune mention
          obligatoire ne manque avant de vous laisser le transmettre au salarié.
        </p>
      </section>

      <div className="grid grid-cols-2 gap-6">
        <SignBlock title="Accord de l'établissement" signedAt={contract.signedEstablishmentAt} name={est?.name} />
        <SignBlock title="Accord de la personne" signedAt={contract.signedFreelanceAt} name={fullName(fl, contract.account?.name)} />
      </div>

      {side !== "none" ? (
        <div className="mt-6 print:hidden">
          {mySigned ? (
            <p className="text-sm font-medium text-[#156d6b]">✓ Vous avez accepté cette proposition.</p>
          ) : (
            <Button disabled={loading} onClick={sign}>
              {loading ? "…" : "Accepter la proposition"}
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
