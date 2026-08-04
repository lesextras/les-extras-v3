// DEVIS & FACTURES — une seule page, deux vues.
//
// Les deux vivaient dans deux entrées de menu éloignées, alors qu'ils sont les
// deux moments du même geste : on chiffre, puis on facture. Chercher un devis
// accepté pour retrouver la facture correspondante obligeait à traverser le
// menu.
//
// La bascule est un simple lien (?vue=…) et non un composant interactif :
// elle marche sans JavaScript, se partage, se met en favori, et le bouton
// « précédent » du navigateur fait ce qu'on attend de lui.
import type { Metadata } from "next";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { requireSession, fetchApi } from "../../../_shared/server";
import { CheckoutButton } from "../../../_shared/BillingActions";
import { FactureActions } from "../../../_shared/FactureActions";
import { PageHeader, StatCard, EmptyState, ErrorState } from "../../../_shared/ui";
import {
  INVOICE_STATUS_LABEL,
  invoiceBadgeVariant,
  formatMoney,
  formatDate,
} from "../../../_shared/format";
import type { Invoice } from "../../../_shared/types";

export const metadata: Metadata = { title: "Devis & factures" };

interface QuoteRow {
  id: string;
  reference: string;
  title: string;
  status: string;
  amount?: string | number | null;
  scheduledAt?: string | null;
  createdAt: string;
  clientAccountId: string;
  providerAccountId: string;
  clientAccount?: { name?: string | null } | null;
  providerAccount?: { name?: string | null } | null;
}

interface FinanceSummary {
  total?: number;
  paid?: number;
  pending?: number;
  invoiceCount?: number;
  /** Les douze derniers mois, du plus ancien au plus récent. */
  parMois?: { mois: string; facture: number; regle: number }[];
}

/**
 * L'HISTOGRAMME DES DOUZE DERNIERS MOIS.
 *
 * Trois totaux cumulés ne disent rien de la tendance : quelqu'un qui a facturé
 * 9 000 € l'an dernier et 200 € ce trimestre lit le même chiffre que quelqu'un
 * qui monte. Or c'est exactement la question qu'on se pose en ouvrant cet
 * écran — est-ce que ça marche, en ce moment ?
 *
 * Barres en CSS pur : pas de bibliothèque de graphiques pour douze valeurs.
 */
function CourbeMensuelle({ parMois }: { parMois: { mois: string; facture: number; regle: number }[] }) {
  const max = Math.max(1, ...parMois.map((m) => m.facture));
  const total = parMois.reduce((s, m) => s + m.facture, 0);
  if (total === 0) return null;

  const libelle = (cle: string) => {
    const [annee, mois] = cle.split("-");
    return new Date(Number(annee), Number(mois) - 1, 1)
      .toLocaleDateString("fr-FR", { month: "short" })
      .replace(".", "");
  };

  return (
    <Card>
      <CardContent className="space-y-3 p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="font-semibold text-foreground">Les douze derniers mois</h3>
          <span className="text-xs text-muted-foreground">
            La partie pleine est ce qui a été réglé.
          </span>
        </div>
        <div className="flex h-32 items-end gap-1.5">
          {parMois.map((m) => {
            const hauteur = Math.round((m.facture / max) * 100);
            const partReglee = m.facture > 0 ? Math.round((m.regle / m.facture) * 100) : 0;
            return (
              <div key={m.mois} className="flex flex-1 flex-col items-center gap-1">
                <div
                  className="flex w-full flex-col justify-end overflow-hidden rounded-t bg-muted"
                  style={{ height: `${Math.max(hauteur, m.facture > 0 ? 4 : 0)}%` }}
                  title={`${libelle(m.mois)} : ${formatMoney(m.facture)} facturé, ${formatMoney(m.regle)} réglé`}
                >
                  <div className="w-full bg-primary" style={{ height: `${partReglee}%` }} />
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex gap-1.5">
          {parMois.map((m) => (
            <span
              key={m.mois}
              className="flex-1 text-center text-[10px] uppercase text-muted-foreground"
            >
              {libelle(m.mois)}
            </span>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

const DEVIS_STATUS: Record<string, string> = {
  REQUESTED: "À chiffrer",
  SENT: "En attente de décision",
  ACCEPTED: "Accepté",
  REFUSED: "Refusé",
  EXPIRED: "Expiré",
};

function tonDevis(status: string): "default" | "secondary" | "outline" | "destructive" {
  if (status === "ACCEPTED") return "default";
  if (status === "REFUSED" || status === "EXPIRED") return "destructive";
  if (status === "SENT") return "secondary";
  return "outline";
}

const euros = (v: string | number | null | undefined) =>
  v == null ? "—" : Number(v).toLocaleString("fr-FR", { style: "currency", currency: "EUR" });

/** Onglet-lien. Actif = fond plein, pour qu'on voie où l'on est sans réfléchir. */
function Onglet({
  href,
  actif,
  children,
  compteur,
}: {
  href: string;
  actif: boolean;
  children: React.ReactNode;
  compteur?: number;
}) {
  return (
    <Link
      href={href}
      aria-current={actif ? "page" : undefined}
      className={cn(
        "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors",
        actif
          ? "bg-primary text-primary-foreground shadow-soft"
          : "text-muted-foreground hover:bg-accent hover:text-foreground",
      )}
    >
      {children}
      {compteur !== undefined && compteur > 0 ? (
        <span
          className={cn(
            "rounded-full px-1.5 py-0.5 text-xs font-bold",
            actif ? "bg-primary-foreground/20" : "bg-muted",
          )}
        >
          {compteur}
        </span>
      ) : null}
    </Link>
  );
}

export default async function FacturationPage({
  searchParams,
}: {
  searchParams?: { vue?: string; paiement?: string };
}) {
  const session = await requireSession();
  const accountId = session.account.id;
  const isEstablishment = session.account.type === "ESTABLISHMENT";
  const vue = searchParams?.vue === "devis" ? "devis" : "factures";

  // La comptabilité n'est pas une information d'équipe : le menu cache déjà
  // cette entrée aux simples membres, et l'API la refuse désormais aussi. Sans
  // ce garde, un membre qui arrive par l'URL tombait sur une page vide, sans
  // rien pour comprendre pourquoi. On le lui dit.
  if (!["OWNER", "ADMIN", "MANAGER"].includes(session.account.role)) {
    return (
      <div className="space-y-6">
        <PageHeader title="Devis & factures" />
        <EmptyState
          title="Réservé aux responsables"
          description="La facturation de votre structure est consultable par la direction, l’administration et les chefs de service. Si vous avez besoin d’un devis ou d’une facture, demandez-la à un responsable de votre établissement."
        />
      </div>
    );
  }
  // Retour de Stripe. Sans ce bandeau, le client revenait de la banque sur une
  // page inchangée, sans savoir si son règlement était passé.
  const retourPaiement = searchParams?.paiement;

  const [quotes, summary, invoices] = await Promise.all([
    fetchApi<{ items: QuoteRow[]; total: number }>(
      session,
      "/quotes?perPage=100",
    ),
    fetchApi<FinanceSummary>(session, "/invoices/summary"),
    fetchApi<Invoice[]>(session, "/invoices?scope=account"),
  ]);

  const listeDevis = quotes.data?.items ?? [];
  const listeFactures = invoices.data ?? [];
  const s = summary.data ?? {};

  // Ce qui attend une action de votre part : c'est ça qu'on compte sur l'onglet.
  const devisAtraiter = listeDevis.filter(
    (q) =>
      (q.providerAccountId === accountId && q.status === "REQUESTED") ||
      (q.clientAccountId === accountId && q.status === "SENT"),
  ).length;
  const facturesAregler = listeFactures.filter((f) => f.status === "ISSUED").length;

  const aChiffrer = listeDevis.filter(
    (q) => q.providerAccountId === accountId && q.status === "REQUESTED",
  );
  const aDecider = listeDevis.filter(
    (q) => q.clientAccountId === accountId && q.status === "SENT",
  );
  const autres = listeDevis.filter((q) => !aChiffrer.includes(q) && !aDecider.includes(q));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Devis & factures"
        subtitle="Le chiffrage et la facturation au même endroit : un devis accepté devient une facture, sans changer de page."
      />

      {retourPaiement === "succes" ? (
        <p className="rounded-xl border border-success/40 bg-success/10 px-4 py-3 text-sm text-foreground">
          Votre règlement a bien été enregistré. La facture passe en « réglée » dès que la banque
          confirme — comptez quelques instants.
        </p>
      ) : retourPaiement === "annule" ? (
        <p className="rounded-xl border border-border bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
          Paiement interrompu : rien n&apos;a été débité. Vous pouvez réessayer quand vous voulez.
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-1 rounded-xl border border-border bg-card p-1">
        <Onglet href="/dashboard/facturation?vue=devis" actif={vue === "devis"} compteur={devisAtraiter}>
          Devis
        </Onglet>
        <Onglet href="/dashboard/facturation?vue=factures" actif={vue === "factures"} compteur={facturesAregler}>
          Factures
        </Onglet>
      </div>

      {vue === "devis" ? (
        <div className="space-y-6">
          {quotes.error ? (
            <ErrorState retryHref="/dashboard/facturation?vue=devis" />
          ) : listeDevis.length === 0 ? (
            <EmptyState
              title="Aucun devis pour l'instant"
              description="Depuis une fiche atelier ou formation, demandez un devis en un clic."
              action={
                <Button asChild>
                  <Link href="/ateliers">Parcourir les ateliers</Link>
                </Button>
              }
            />
          ) : (
            <>
              {aChiffrer.length > 0 && (
                <ListeDevis
                  title="À chiffrer"
                  hint="Ces établissements attendent votre proposition."
                  quotes={aChiffrer}
                  accountId={accountId}
                />
              )}
              {aDecider.length > 0 && (
                <ListeDevis
                  title="En attente de votre décision"
                  hint="Devis reçus : à accepter ou à refuser."
                  quotes={aDecider}
                  accountId={accountId}
                />
              )}
              {autres.length > 0 && (
                <ListeDevis title="Historique" quotes={autres} accountId={accountId} />
              )}
            </>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard
              label={isEstablishment ? "Total dépensé" : "Total facturé"}
              value={formatMoney(s.total ?? 0)}
              accent="teal"
            />
            <StatCard label="Réglé" value={formatMoney(s.paid ?? 0)} accent="terracotta" />
            <StatCard label="En attente" value={formatMoney(s.pending ?? 0)} />
            <StatCard label="Factures" value={s.invoiceCount ?? listeFactures.length} />
          </div>

          {s.parMois && s.parMois.length > 0 ? <CourbeMensuelle parMois={s.parMois} /> : null}

          {invoices.error ? (
            <ErrorState retryHref="/dashboard/facturation?vue=factures" />
          ) : listeFactures.length === 0 ? (
            <EmptyState
              title="Aucune facture"
              description="Un brouillon de facture est préparé pour chaque atelier terminé — de l'intervenant vers l'établissement, sans commission. Les renforts, eux, relèvent du contrat de travail : ils ne passent pas par une facture."
            />
          ) : (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Numéro</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Montant</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead className="text-right">Facture</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {listeFactures.map((inv) => (
                      <TableRow key={inv.id}>
                        <TableCell className="font-medium">{inv.number}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDate(inv.issuedAt ?? inv.createdAt)}
                        </TableCell>
                        <TableCell className="font-medium">{formatMoney(inv.amount)}</TableCell>
                        <TableCell>
                          <Badge variant={invoiceBadgeVariant(inv.status)}>
                            {INVOICE_STATUS_LABEL[inv.status]}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            {/* Le cycle de vie appartient à l'émetteur : c'est
                                sa séquence de numéros qui est engagée. */}
                            <FactureActions
                              invoiceId={inv.id}
                              accountId={accountId}
                              statut={inv.status}
                              estEmetteur={inv.accountId === accountId}
                              compact
                            />
                            {inv.status === "ISSUED" && inv.accountId !== accountId ? (
                              <CheckoutButton
                                accountId={accountId}
                                kind="invoice"
                                invoiceId={inv.id}
                                label="Payer en ligne"
                              />
                            ) : null}
                            {/* Le PDF est produit par le serveur : une pièce
                                comptable identique quel que soit le navigateur,
                                avec les mentions de l'art. L. 441-9. */}
                            <Button asChild size="sm" variant="outline">
                              <a
                                href={`/api/proxy/documents/facture/${inv.id}.pdf`}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                Télécharger le PDF
                              </a>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

function ListeDevis({
  title,
  hint,
  quotes,
  accountId,
}: {
  title: string;
  hint?: string;
  quotes: QuoteRow[];
  accountId: string;
}) {
  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        {hint ? <p className="text-sm text-muted-foreground">{hint}</p> : null}
      </div>
      <div className="space-y-3">
        {quotes.map((q) => {
          const estClient = q.clientAccountId === accountId;
          const contrepartie = estClient
            ? q.providerAccount?.name ?? "Intervenant"
            : q.clientAccount?.name ?? "Établissement";
          return (
            <Card key={q.id}>
              <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <p className="truncate font-medium text-foreground">{q.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {q.reference} · {estClient ? "Pour" : "De"} {contrepartie}
                    {q.scheduledAt ? ` · ${formatDate(q.scheduledAt)}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-foreground">{euros(q.amount)}</span>
                  <Badge variant={tonDevis(q.status)}>
                    {DEVIS_STATUS[q.status] ?? q.status}
                  </Badge>
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/dashboard/devis/${q.id}`}>Ouvrir</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
