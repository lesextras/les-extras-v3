// Facture officielle imprimable (A4) — présentationnelle.
// Rendu serveur, bouton d'impression client (PrintButton → window.print).
import { PrintButton } from "./PrintButton";
import { INVOICE_STATUS_LABEL } from "./format";

interface IdentitePartie {
  id?: string;
  name?: string | null;
  legalName?: string | null;
  address?: string | null;
  city?: string | null;
  postalCode?: string | null;
  siret?: string | null;
  owner?: { email?: string | null } | null;
  vatMention?: string | null;
  /**
   * Coordonnées bancaires de l'émetteur, pour le règlement par virement.
   * Facultatives : tant qu'elles ne sont pas renseignées dans les réglages du
   * compte, le pied de facture ne les affiche pas — on n'invente jamais un
   * IBAN. L'API ne les renvoie que sur le détail d'une facture, et seulement
   * à ses deux parties.
   */
  iban?: string | null;
  bic?: string | null;
}

export interface DocInvoice {
  id: string;
  number: string;
  amount: string | number;
  status: string;
  issuedAt?: string | null;
  createdAt: string;
  /** L'ÉMETTEUR : le compte qui facture. Son identité engage le document. */
  account?: IdentitePartie | null;
  /** Le payeur désigné, quand il n'est pas déductible de la réservation. */
  payer?: IdentitePartie | null;
  booking?: {
    service?: { title?: string | null } | null;
    mission?: { title?: string | null } | null;
    account?: IdentitePartie | null;
    /** Date d'exécution de la prestation : réalisée, sinon programmée. */
    scheduledAt?: string | null;
    completedAt?: string | null;
    /**
     * Le devis accepté dont cette facture est la suite : sa référence rattache
     * la facture à l'engagement signé, et son chiffrage porte la ventilation
     * de la TVA que la facture, réduite à un montant unique, ne pouvait pas
     * exprimer seule.
     */
    quote?: {
      reference?: string | null;
      decidedAt?: string | null;
      lines?: unknown;
    } | null;
  } | null;
  /**
   * Les deux faces d'une formation, dont aucune ne passe par une réservation :
   * l'inscription que l'organisme vend, et l'animation que le formateur lui
   * facture en retour. Le PDF les reçoit déjà (voir `documents.service.ts`) ;
   * la page, elle, ne les demandait pas et n'avait donc rien à désigner.
   */
  inscription?: {
    session?: {
      startDate?: string | null;
      formation?: { title?: string | null } | null;
    } | null;
  } | null;
  sessionRemuneree?: {
    startDate?: string | null;
    formation?: { title?: string | null } | null;
  } | null;
}

const EUR = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" });

function money(value?: string | number | null): string {
  if (value === null || value === undefined || value === "") return "—";
  const n = typeof value === "string" ? Number(value) : value;
  if (Number.isNaN(n)) return "—";
  return EUR.format(n);
}

function fmt(d?: string | null): string {
  if (!d) return "—";
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
}

/**
 * L'échéance découle du délai de règlement annoncé au pied du document :
 * trente jours à compter de l'émission. Tant que la facture n'est pas émise,
 * il n'y a pas d'échéance — le compte à rebours n'a pas commencé.
 * Même calcul que le PDF (`facture.pdf.ts`).
 */
function echeanceTrenteJours(issuedAt?: string | null): string | null {
  if (!issuedAt) return null;
  const emission = new Date(issuedAt);
  if (Number.isNaN(emission.getTime())) return null;
  return new Date(emission.getTime() + 30 * 24 * 3600 * 1000).toISOString();
}

export function InvoiceDocument({ invoice }: { invoice: DocInvoice }) {
  // L'ÉMETTEUR : c'est son identité (raison sociale, SIRET) qui engage le
  // document — jamais une marque fixe, puisque n'importe quel compte
  // (établissement ou freelance) peut émettre sa propre facture depuis cet
  // outil.
  const emetteur = invoice.account;
  const emetteurNom = emetteur?.legalName || emetteur?.name || "Émetteur";
  // LE DESTINATAIRE : le payeur désigné, sinon l'autre compte de la
  // réservation quand aucun payeur explicite n'a été renseigné. Ne jamais
  // retomber sur l'émetteur lui-même — une facture n'a pas deux fois la même
  // partie.
  const destinataire =
    invoice.payer ??
    (invoice.booking?.account && invoice.booking.account.id !== emetteur?.id
      ? invoice.booking.account
      : null);
  const destinataireNom = destinataire?.legalName || destinataire?.name || "Client";
  // LA DÉSIGNATION DE LA PRESTATION, et sa date d'exécution : deux mentions
  // obligatoires (art. L. 441-9 du code de commerce, art. 242 nonies A de
  // l'annexe II au CGI). Une facture de formation n'a pas de réservation — ni
  // l'inscription vendue par l'organisme, ni l'animation que le formateur lui
  // facture — et la page retombait donc sur « Prestation Les Extras », sans
  // date : le client ne savait pas ce qu'il payait, ni pour quand. Même
  // calcul que le PDF (`documents.service.ts`) ; l'ordre importe, une facture
  // porte l'une OU l'autre et le sens n'est pas le même.
  const prestation = invoice.sessionRemuneree?.formation?.title
    ? {
        intitule: `Animation de la formation « ${invoice.sessionRemuneree.formation.title} »`,
        dateRealisation: invoice.sessionRemuneree.startDate ?? null,
      }
    : invoice.inscription?.session?.formation?.title
      ? {
          intitule: `Formation « ${invoice.inscription.session.formation.title} » — inscription`,
          dateRealisation: invoice.inscription.session.startDate ?? null,
        }
      : null;
  const lineLabel =
    prestation?.intitule ||
    invoice.booking?.mission?.title ||
    invoice.booking?.service?.title ||
    "Prestation";
  const dateRealisation =
    invoice.booking?.completedAt ??
    invoice.booking?.scheduledAt ??
    prestation?.dateRealisation ??
    null;
  // UN BROUILLON N'A PAS DE DATE D'ÉMISSION, et on ne lui en invente pas une.
  // Le document annonçait « Émise le … » juste au-dessus du badge
  // « Brouillon » : deux mentions contradictoires, dont l'une fausse. Tant que
  // la facture n'est pas émise, on n'annonce que sa date d'établissement.
  const emise = Boolean(invoice.issuedAt);
  const dateLabel = fmt(invoice.issuedAt ?? invoice.createdAt);
  // AUCUNE DATE D'ÉCHÉANCE N'ÉTAIT AFFICHÉE : le pied de page annonçait un
  // délai de règlement sans jamais dire jusqu'à quand, et la date à laquelle
  // les pénalités courent est précisément ce qui rend le délai opposable.
  const echeance = echeanceTrenteJours(invoice.issuedAt);
  const totalLabel = money(invoice.amount);
  // VENTILATION DE LA TVA, REPRISE DU DEVIS D'ORIGINE.
  //
  // La facture n'a qu'un montant, sous lequel s'imprimait la mention de
  // franchise par défaut. Sur une prestation issue d'un devis soumis à la TVA,
  // elle déclarait donc exonérée une taxe déjà facturée — une mention fiscale
  // fausse. Quand le devis porte de la taxe, c'est lui qui fait foi : les deux
  // pièces doivent dire la même chose. Même calcul que le PDF
  // (`facture.pdf.ts`), pour que les deux rendus ne divergent pas.
  const lignesDevis = Array.isArray(invoice.booking?.quote?.lines)
    ? (invoice.booking!.quote!.lines as {
        quantity?: number | string;
        unitPrice?: number | string;
        vatRate?: number | string | null;
      }[])
    : [];
  const centimes = (v: number) => Math.round(v * 100);
  const ventilation = (() => {
    const parTaux = new Map<number, { baseHt: number; tva: number }>();
    let htC = 0;
    let tvaC = 0;
    for (const l of lignesDevis) {
      const t = Number(l.vatRate ?? 0) || 0;
      const htLigne = centimes((Number(l.quantity) || 0) * (Number(l.unitPrice) || 0));
      const tvaLigne = Math.round((htLigne * t) / 100);
      htC += htLigne;
      tvaC += tvaLigne;
      const cumul = parTaux.get(t) ?? { baseHt: 0, tva: 0 };
      cumul.baseHt += htLigne;
      cumul.tva += tvaLigne;
      parTaux.set(t, cumul);
    }
    return {
      totalHt: htC / 100,
      totalTva: tvaC / 100,
      parTaux: [...parTaux.entries()]
        .sort((a, b) => a[0] - b[0])
        .map(([taux, c]) => ({ taux, baseHt: c.baseHt / 100, tva: c.tva / 100 })),
    };
  })();
  const avecTva = ventilation.totalTva > 0;
  // Mention propre à l'émetteur si renseignée (réglages du compte) ; sinon le
  // défaut, vrai pour la grande majorité des comptes de la plateforme
  // (franchise en base, association non assujettie) — jamais un taux inventé.
  // Mention reprise mot pour mot du PDF (`documents.service.ts`) : la page
  // l'abrégeait autrement, si bien qu'une même facture portait deux rédactions
  // de la même mention obligatoire selon qu'on l'ouvrait ou qu'on l'imprimait.
  const mentionTva =
    emetteur?.vatMention?.trim() ||
    "TVA non applicable, article 293 B du code général des impôts";
  // COORDONNÉES BANCAIRES DE L'ÉMETTEUR. Le produit annonce un règlement par
  // virement ; la facture ne portait pourtant aucun IBAN, et son destinataire
  // n'avait donc aucun moyen de la payer.
  //
  // On n'affiche le bloc que si l'émetteur a renseigné son IBAN (réglages du
  // compte, « Identité de facturation ») : on n'invente pas des coordonnées
  // bancaires. Ni sur une facture réglée ou annulée, qui n'appelle plus de
  // virement — même condition que la date d'échéance. Le BIC ne suit que s'il
  // est connu : il n'est plus exigé en zone SEPA. Bloc identique à celui du
  // PDF (`facture.pdf.ts`) : les deux rendus disent la même chose.
  const ibanEmetteur = emetteur?.iban?.trim() || null;
  const afficherReglement =
    Boolean(ibanEmetteur) && invoice.status !== "PAID" && invoice.status !== "CANCELLED";

  return (
    <div className="min-h-screen bg-neutral-100 py-8 print:bg-white print:py-0">
      <div className="mx-auto mb-4 flex max-w-[210mm] items-center justify-between px-4 print:hidden">
        <a href="/dashboard/facturation?vue=factures" className="text-sm text-neutral-600 hover:underline">
          ← Retour à la finance
        </a>
        <PrintButton label="Imprimer / Enregistrer en PDF" />
      </div>

      {/* Feuille A4 */}
      <div className="mx-auto flex min-h-[297mm] w-full max-w-[210mm] flex-col bg-white px-16 py-14 shadow-lg print:min-h-0 print:shadow-none">
        <header className="flex items-start justify-between border-b border-neutral-200 pb-6">
          <div>
            <p className="text-lg font-bold tracking-tight text-neutral-900">{emetteurNom}</p>
            <p className="mt-1 text-xs leading-relaxed text-neutral-500">
              {emetteur?.address ? <>{emetteur.address}<br /></> : null}
              {emetteur?.postalCode || emetteur?.city ? (
                <>{[emetteur?.postalCode, emetteur?.city].filter(Boolean).join(" ")}<br /></>
              ) : null}
              {emetteur?.siret ? <>SIRET : {emetteur.siret}<br /></> : null}
              {emetteur?.owner?.email ?? "—"}
            </p>
            <p className="mt-1 text-[10px] uppercase tracking-widest text-neutral-400">
              via la plateforme Les Extras
            </p>
          </div>
          <div className="text-right">
            <p className="text-[11px] uppercase tracking-widest text-neutral-400">Facture</p>
            <p className="mt-1 text-base font-semibold text-neutral-900">{invoice.number}</p>
            <p className="text-xs text-neutral-500">
              {emise ? "Émise" : "Établie"} le {dateLabel}
            </p>
            <p className="mt-1 text-[11px] font-medium text-neutral-500">
              {INVOICE_STATUS_LABEL[invoice.status] ?? invoice.status}
            </p>
          </div>
        </header>

        {/* Destinataire */}
        <section className="mt-8 flex justify-end">
          <div className="w-1/2 rounded-lg bg-neutral-50 p-4 text-sm">
            <p className="text-[11px] uppercase tracking-widest text-neutral-400">Facturé à</p>
            <p className="mt-1 font-semibold text-neutral-900">{destinataireNom}</p>
            {destinataire?.address ? <p className="text-neutral-600">{destinataire.address}</p> : null}
            {destinataire?.postalCode || destinataire?.city ? (
              <p className="text-neutral-600">
                {[destinataire?.postalCode, destinataire?.city].filter(Boolean).join(" ")}
              </p>
            ) : null}
            {destinataire?.siret ? (
              <p className="mt-1 text-xs text-neutral-500">SIRET : {destinataire.siret}</p>
            ) : null}
          </div>
        </section>

        {/* Lignes */}
        <section className="mt-10">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200 text-left text-[11px] uppercase tracking-widest text-neutral-400">
                <th className="pb-2 font-medium">Désignation</th>
                <th className="pb-2 text-right font-medium">Montant</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-neutral-100">
                {/* La date d'exécution accompagne la désignation, comme la
                    colonne « Réalisée le » du PDF : elle est obligatoire au
                    même titre, et n'apparaissait pas ici. */}
                <td className="py-3 text-neutral-800">
                  {lineLabel}
                  {dateRealisation ? (
                    <span className="block text-xs text-neutral-500">
                      Réalisée le {fmt(dateRealisation)}
                    </span>
                  ) : null}
                </td>
                <td className="py-3 text-right font-medium text-neutral-900">{totalLabel}</td>
              </tr>
            </tbody>
          </table>

          <div className="mt-6 flex justify-end">
            <div className="w-1/2 space-y-1 text-sm">
              {avecTva ? (
                <>
                  <div className="flex justify-between text-neutral-600">
                    <span>Total hors taxes</span>
                    <span>{money(ventilation.totalHt)}</span>
                  </div>
                  {ventilation.parTaux.map((v) =>
                    v.taux === 0 ? (
                      <div key={v.taux} className="flex justify-between text-neutral-600">
                        <span>Base non soumise à TVA</span>
                        <span>{money(v.baseHt)}</span>
                      </div>
                    ) : (
                      <div key={v.taux} className="flex justify-between text-neutral-600">
                        <span>
                          TVA {String(v.taux).replace(".", ",")} % sur {money(v.baseHt)}
                        </span>
                        <span>{money(v.tva)}</span>
                      </div>
                    ),
                  )}
                  <div className="flex justify-between text-neutral-600">
                    <span>Total TVA</span>
                    <span>{money(ventilation.totalTva)}</span>
                  </div>
                </>
              ) : (
                <div className="flex justify-between text-neutral-600">
                  <span>Total net</span>
                  <span>{totalLabel}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-neutral-200 pt-2 text-base font-semibold text-neutral-900">
                <span>{avecTva ? "Net à payer (TTC)" : "Total à régler"}</span>
                <span>{totalLabel}</span>
              </div>
              {/* Une facture réglée ou annulée n'a plus d'échéance à opposer
                  au client : on ne l'affiche que tant qu'un paiement est dû. */}
              {echeance && invoice.status !== "PAID" && invoice.status !== "CANCELLED" ? (
                <div className="flex justify-between text-neutral-600">
                  <span>Date d’échéance</span>
                  <span>{fmt(echeance)}</span>
                </div>
              ) : null}
            </div>
          </div>
        </section>

        <footer className="mt-auto border-t border-neutral-200 pt-6 text-[11px] leading-relaxed text-neutral-500">
          {/* La mention de franchise n'a de sens que si aucune taxe n'est
              facturée. Affichée sous une facture qui en porte, elle la
              contredirait. */}
          {avecTva ? null : <p>{mentionTva}</p>}
          {/* DEUX CORRECTIONS ICI, sur la même phrase.
              Le délai, d'abord : la page annonçait un règlement « à réception »
              là où le PDF de la même facture annonce trente jours — deux
              délais contractuels différents pour une seule pièce, et le client
              lit celui qui l'arrange.
              Les pénalités, ensuite : « conformément à la réglementation en
              vigueur » ne satisfait pas l'article L. 441-9 du code de commerce,
              qui exige le taux et le montant, pas un renvoi. Faute de les
              chiffrer, elles sont inopposables. Texte repris à l'identique du
              PDF (`facture.pdf.ts`) : les deux rendus disent la même chose. */}
          <p>
            {invoice.status === "PAID"
              ? "Cette facture a été réglée. Aucun paiement ne reste dû."
              : "Règlement à trente jours à compter de la date d’émission. Passé ce délai, des pénalités de retard sont exigibles au taux de trois fois le taux d’intérêt légal, ainsi qu’une indemnité forfaitaire de recouvrement de 40 € (art. L. 441-10 et D. 441-5 du code de commerce). Aucun escompte n’est accordé pour paiement anticipé."}
          </p>
          {/* Coordonnées de règlement — voir `afficherReglement` plus haut. */}
          {afficherReglement ? (
            <div className="mt-3 text-neutral-600">
              <p className="text-[11px] uppercase tracking-widest text-neutral-400">Règlement</p>
              <p className="mt-1">
                <span className="text-neutral-500">IBAN</span>{" "}
                <span className="font-medium text-neutral-900">{ibanEmetteur}</span>
              </p>
              {emetteur?.bic?.trim() ? (
                <p>
                  <span className="text-neutral-500">BIC</span>{" "}
                  <span className="font-medium text-neutral-900">{emetteur.bic.trim()}</span>
                </p>
              ) : null}
              <p className="mt-1">
                Virement à l’ordre de {emetteurNom}, en rappelant la référence {invoice.number}.
              </p>
            </div>
          ) : null}
          <p className="mt-2 text-neutral-400">
            Document généré par la plateforme Les Extras — {invoice.number}.
          </p>
        </footer>
      </div>
    </div>
  );
}
