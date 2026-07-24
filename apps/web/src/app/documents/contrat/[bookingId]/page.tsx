// Contrat de mission de renfort — imprimable & signable (authentifié, hors AppShell).
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { requireSession, fetchApi } from "../../../_shared/server";
import { ContractDocument, type ContractData } from "../../../_shared/ContractDocument";
import { TimeSheet } from "../../../_shared/TimeSheet";

export const metadata: Metadata = { title: "Contrat de mission" };

export default async function ContratPage({ params }: { params: { bookingId: string } }) {
  const session = await requireSession();
  const res = await fetchApi<ContractData>(session, `/bookings/${params.bookingId}/contract`);
  if (res.error || !res.data) notFound();

  const c = res.data;
  const activeId = session.account.id;
  const side: "freelance" | "establishment" | "none" =
    activeId === c.accountId ? "freelance" : activeId === c.mission?.account?.id ? "establishment" : "none";

  return (
    <>
      <ContractDocument contract={c} side={side} />
      {side !== "none" ? <TimeSheet bookingId={c.id} accountId={activeId} /> : null}
    </>
  );
}
