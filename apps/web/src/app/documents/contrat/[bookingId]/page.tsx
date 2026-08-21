// Proposition d'engagement — imprimable et acceptable (authentifié, hors AppShell).
//
// L'établissement y trouve le bouton qui compte : « Établir le CDD ». C'est
// là que la plateforme passe la main, et il ne faut pas qu'il ait à chercher.
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { requireSession, fetchApi } from "../../../_shared/server";
import { ContractDocument, type ContractData } from "../../../_shared/ContractDocument";
import { TimeSheet } from "../../../_shared/TimeSheet";
import { EtablirCdd } from "../../../_shared/EtablirCdd";

export const metadata: Metadata = { title: "Proposition d’engagement" };

export default async function ContratPage({ params }: { params: { bookingId: string } }) {
  const session = await requireSession();
  const res = await fetchApi<ContractData>(session, `/bookings/${params.bookingId}/contract`);
  if (res.error || !res.data) notFound();

  const c = res.data;
  const activeId = session.account.id;
  // Le côté se lit sur les BLOCS du document, jamais sur `c.accountId`.
  // Ce champ ne désigne que le demandeur, et le demandeur change de camp
  // d'un flux à l'autre : intervenant qui candidate à un renfort,
  // établissement qui réserve un atelier. Sur un atelier, le directeur était
  // donc rangé du côté « freelance » et l'intervenant du côté
  // « establishment ». L'API place désormais l'établissement en
  // `mission.account` et l'intervenant en `account` dans les deux flux : ce
  // sont ces deux identités-là qu'on compare.
  const side: "freelance" | "establishment" | "none" =
    activeId === c.mission?.account?.id
      ? "establishment"
      : activeId === c.account?.id
        ? "freelance"
        : "none";

  // Seul l'établissement embauche : le bouton n'apparaît que de son côté, et
  // seulement une fois qu'il a donné son accord sur la proposition.
  //
  // Et seulement sur un RENFORT : un atelier est une prestation facturée par
  // un indépendant, pas une embauche — il n'y a pas de CDD à en tirer, et
  // `POST /contrats/depuis-renfort` le refuse (« Proposition introuvable pour
  // ce renfort »). Le bug masquait ce cas puisque le bouton n'apparaissait
  // jamais à l'établissement ; le corriger le rendrait visible sans lui.
  const peutEtablir =
    side === "establishment" && c.kind !== "service" && Boolean(c.signedEstablishmentAt);

  return (
    <>
      <ContractDocument contract={c} side={side} />
      {peutEtablir ? (
        <div className="mx-auto mt-6 max-w-3xl rounded-lg border border-neutral-200 bg-white p-5 print:hidden">
          <p className="font-medium text-neutral-900">Vous avez accepté cette proposition</p>
          <p className="mt-1 text-sm text-neutral-600">
            Il reste à établir le contrat de travail. Les éléments ci-dessus y seront repris ; vous
            n’aurez à compléter que ce qui relève de votre structure.
          </p>
          <div className="mt-4">
            <EtablirCdd bookingId={c.id} accountId={activeId} />
          </div>
        </div>
      ) : null}
      {side !== "none" ? <TimeSheet bookingId={c.id} accountId={activeId} /> : null}
    </>
  );
}
