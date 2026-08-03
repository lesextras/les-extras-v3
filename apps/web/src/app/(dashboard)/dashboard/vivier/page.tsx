// MON VIVIER — les intervenants qui connaissent déjà la maison.
//
// Ce que cet écran répare : la plateforme calculait déjà, en interne, la liste
// des intervenants ayant travaillé pour un établissement — c'est ce qui
// alimente le palier « réseau réservé » de la diffusion en cascade. Mais ce
// calcul restait invisible. Un chef de service ne pouvait ni voir qui il avait
// déjà fait venir, ni noter ce qu'il fallait savoir sur eux, ni les rappeler
// autrement qu'en republiant une offre et en espérant.
//
// La fidélisation d'une poignée d'intervenants vaut mieux qu'un catalogue de
// mille inconnus : c'est la personne qui connaît le groupe qu'on veut revoir.
import type { Metadata } from "next";
import Link from "next/link";
import { UsersRound } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { requireSession, fetchApi } from "../../../_shared/server";
import { PageHeader, EmptyState, ErrorState, SectionTitle } from "../../../_shared/ui";
import { RetenirIntervenant, RappelerVivier } from "../../../_shared/VivierActions";

export const metadata: Metadata = { title: "Mon vivier" };

interface Membre {
  accountId: string;
  nom: string;
  slug: string;
  userId: string | null;
  prenom: string | null;
  nomPersonne: string | null;
  avatarUrl: string | null;
  metier: string | null;
  ville: string | null;
  tauxHoraire: string | number | null;
  disponible: boolean | null;
  interventions: number;
  derniereIntervention: string | null;
  noteMoyenne: number | null;
  nombreAvis: number;
  retenu: boolean;
  noteInterne: string | null;
  ajoutePar: string | null;
}

interface Vivier {
  items: Membre[];
  retenus: number;
  habitues: number;
  total: number;
}

interface MissionLegere {
  id: string;
  title: string;
  startDate: string;
  visibility: string;
  status: string;
}

function nomAffiche(m: Membre): string {
  const complet = [m.prenom, m.nomPersonne].filter(Boolean).join(" ");
  return complet || m.nom;
}

function initiales(m: Membre): string {
  const source = nomAffiche(m);
  return source
    .split(/\s+/)
    .slice(0, 2)
    .map((mot) => mot[0]?.toUpperCase() ?? "")
    .join("");
}

function depuis(date: string | null): string {
  if (!date) return "date inconnue";
  const jours = Math.floor((Date.now() - new Date(date).getTime()) / 86_400_000);
  if (jours < 0) return "à venir";
  if (jours === 0) return "aujourd'hui";
  if (jours < 31) return `il y a ${jours} jour${jours > 1 ? "s" : ""}`;
  const mois = Math.floor(jours / 30);
  if (mois < 12) return `il y a ${mois} mois`;
  const ans = Math.floor(mois / 12);
  return `il y a ${ans} an${ans > 1 ? "s" : ""}`;
}

function Fiche({ m, accountId }: { m: Membre; accountId: string }) {
  return (
    <Card className={m.retenu ? "border-primary/30 bg-primary/[0.03]" : undefined}>
      <CardContent className="flex flex-wrap items-start justify-between gap-4 p-4">
        <div className="flex min-w-0 items-start gap-3">
          <Avatar className="size-11 shrink-0">
            <AvatarImage src={m.avatarUrl ?? undefined} />
            <AvatarFallback>{initiales(m)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate font-semibold text-foreground">{nomAffiche(m)}</p>
              {m.retenu ? <Badge variant="soft">Retenu</Badge> : null}
              {/* La disponibilité déclarée par l'intervenant lui-même. Solliciter
                  quelqu'un qui s'est mis en pause fait perdre du temps aux deux. */}
              {m.disponible === false ? <Badge variant="muted">En pause</Badge> : null}
            </div>
            <p className="text-sm text-muted-foreground">
              {m.metier ?? "Intervenant"}
              {m.ville ? ` · ${m.ville}` : ""}
              {m.tauxHoraire ? ` · ${Number(m.tauxHoraire).toFixed(2)} €/h` : ""}
            </p>
            <p className="text-xs text-muted-foreground">
              {m.interventions > 0
                ? `${m.interventions} intervention${m.interventions > 1 ? "s" : ""} chez vous · dernière ${depuis(m.derniereIntervention)}`
                : "Pas encore intervenu chez vous"}
              {m.noteMoyenne != null
                ? ` · ${m.noteMoyenne}/5 sur ${m.nombreAvis} avis`
                : ""}
            </p>
            {m.noteInterne ? (
              <p className="mt-1.5 max-w-prose whitespace-pre-line rounded-md bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
                {m.noteInterne}
                {m.ajoutePar ? (
                  <span className="mt-1 block text-[11px] opacity-70">— {m.ajoutePar}</span>
                ) : null}
              </p>
            ) : null}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button asChild size="sm" variant="ghost">
            <Link href={`/intervenants/${m.slug}`}>Profil</Link>
          </Button>
          <RetenirIntervenant
            intervenantAccountId={m.accountId}
            nom={nomAffiche(m)}
            accountId={accountId}
            retenu={m.retenu}
            noteInterne={m.noteInterne}
          />
        </div>
      </CardContent>
    </Card>
  );
}

export default async function VivierPage() {
  const session = await requireSession();

  if (session.account.type !== "ESTABLISHMENT") {
    return (
      <div className="space-y-6">
        <PageHeader title="Mon vivier" />
        <EmptyState
          title="Réservé aux établissements"
          description="Le vivier réunit les intervenants qu'une structure fait revenir. Depuis un compte intervenant, ce sont vos opportunités qu'il faut regarder."
          action={
            <Button asChild>
              <Link href="/dashboard/opportunites">Voir mes opportunités</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const [resVivier, resMissions] = await Promise.all([
    fetchApi<Vivier>(session, "/vivier"),
    fetchApi<MissionLegere[]>(session, "/missions?scope=account"),
  ]);

  if (resVivier.error) {
    return (
      <div className="space-y-6">
        <PageHeader title="Mon vivier" />
        <ErrorState retryHref="/dashboard/vivier" description={resVivier.error} />
      </div>
    );
  }

  const vivier = resVivier.data ?? { items: [], retenus: 0, habitues: 0, total: 0 };
  const retenus = vivier.items.filter((m) => m.retenu);
  const habitues = vivier.items.filter((m) => !m.retenu);

  // Seules les missions encore ouvertes se rappellent — proposer de solliciter
  // quelqu'un sur un besoin déjà pourvu ferait perdre du temps aux deux côtés.
  const missionsOuvertes = (resMissions.data ?? []).filter((m) =>
    ["PUBLISHED", "OPEN", "DRAFT"].includes(m.status),
  );

  return (
    <div className="space-y-8">
      <PageHeader
        title="Mon vivier"
        subtitle="Les intervenants qui connaissent déjà votre maison. Un remplacement qu'on n'a pas à expliquer coûte moins cher qu'un remplacement de plus."
        actions={
          <RappelerVivier
            accountId={session.account.id}
            missions={missionsOuvertes}
            intervenants={vivier.items.map((m) => ({
              accountId: m.accountId,
              nom: nomAffiche(m),
              metier: m.metier,
            }))}
          />
        }
      />

      {vivier.total === 0 ? (
        <EmptyState
          icon={<UsersRound className="size-6" />}
          title="Votre vivier est encore vide"
          description="Dès qu'un intervenant aura assuré un renfort ou animé un atelier chez vous, il apparaîtra ici automatiquement. Vous pouvez aussi retenir dès maintenant quelqu'un repéré dans l'annuaire."
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <Button asChild>
                <Link href="/intervenants">Parcourir l'annuaire</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/dashboard/renforts">Publier un besoin</Link>
              </Button>
            </div>
          }
        />
      ) : (
        <>
          {retenus.length > 0 ? (
            <section className="space-y-3">
              <SectionTitle
                title={`Retenus — ${retenus.length}`}
                action={
                  <span className="text-xs text-muted-foreground">
                    Prioritaires sur vos besoins de renfort
                  </span>
                }
              />
              {retenus.map((m) => (
                <Fiche key={m.accountId} m={m} accountId={session.account.id} />
              ))}
            </section>
          ) : null}

          {habitues.length > 0 ? (
            <section className="space-y-3">
              <SectionTitle
                title={`Déjà venus chez vous — ${habitues.length}`}
                action={
                  <span className="text-xs text-muted-foreground">
                    Détectés automatiquement
                  </span>
                }
              />
              {habitues.map((m) => (
                <Fiche key={m.accountId} m={m} accountId={session.account.id} />
              ))}
            </section>
          ) : null}

          <p className="max-w-prose text-xs text-muted-foreground">
            Retenir quelqu'un n'est pas un signet : un intervenant retenu reçoit vos besoins de
            renfort au palier « réseau réservé », c'est-à-dire avant que l'offre ne s'ouvre à
            toute la marketplace. Les notes de service restent internes à votre établissement.
          </p>
        </>
      )}
    </div>
  );
}
