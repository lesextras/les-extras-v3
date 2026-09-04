// Back-office ADMIN — le trafic par canal, et ce que chaque canal a produit.
//
// Demandé par Siham le 4/09/2026 : « il faut qu'on puisse voir les statistiques
// du site pour mesurer si ça marche et par quel canal ». Source :
// /admin/stats/audience. Les vues viennent du compteur sans traceur
// (`CompteurVues`), les inscriptions de `Account.source`, les adresses captées
// de `CaptureFiche.source`, les demandes de `ContactRequest.source` — la même
// clé partout, posée à la première page de la visite par `lib/source.ts`.
//
// ⚠ L'audience commence le jour du déploiement du compteur ; les inscriptions
// et les demandes portent leur source depuis bien avant. Un canal peut donc
// afficher des inscriptions sans une seule vue : c'est l'historique, pas un
// bogue. Ça se résorbe en trente jours.
import type { Metadata } from "next";
import Link from "next/link";
import { Eye, Footprints, UserPlus, Mail, MessageSquareQuote } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { requireAdmin, fetchApi } from "../../../_shared/server";
import { PageHeader, StatCard, ErrorState, EmptyState, SectionTitle } from "../../../_shared/ui";

export const metadata: Metadata = { title: "Trafic par canal · Administration" };

interface Canal {
  source: string;
  vues: number;
  visites: number;
  inscriptions: number;
  captures: number;
  demandes: number;
}

interface Audience {
  fenetre: number;
  depuis: string;
  global: {
    vues: number;
    visites: number;
    inscriptions: number;
    captures: number;
    demandes: number;
    partOrganique: number | null;
    capturesTotal: number;
    capturesOptin: number;
  };
  parJour: { jour: string; vues: number; visites: number }[];
  canaux: Canal[];
  pages: { chemin: string; vues: number; visites: number }[];
}

const CANAUX_LISIBLES: Record<string, string> = {
  direct: "Direct (adresse tapée, favori, appli)",
  "google.com": "Google (recherche)",
  "google.fr": "Google (recherche)",
  google: "Google",
  facebook: "Facebook",
  "facebook.com": "Facebook",
  "l.facebook.com": "Facebook",
  "lm.facebook.com": "Facebook",
  "m.facebook.com": "Facebook",
  linkedin: "LinkedIn",
  "linkedin.com": "LinkedIn",
  "lnkd.in": "LinkedIn",
  instagram: "Instagram",
  "instagram.com": "Instagram",
  "l.instagram.com": "Instagram",
  tiktok: "TikTok",
  brevo: "E-mail (Brevo)",
  email: "E-mail",
  parrainage: "Parrainage",
  "bing.com": "Bing",
  "duckduckgo.com": "DuckDuckGo",
  "chatgpt.com": "ChatGPT",
  "perplexity.ai": "Perplexity",
  "app.les-extras.fr": "WordPress (app.les-extras.fr)",
  "adepa77.fr": "adepa77.fr",
  "toulali.teachizy.fr": "Teachizy",
};

function lisible(source: string): string {
  return CANAUX_LISIBLES[source] ?? source;
}

function taux(num: number, den: number): string {
  if (!den) return "–";
  const v = (num / den) * 100;
  return `${v < 1 ? v.toFixed(1) : Math.round(v)} %`;
}

export default async function TraficPage({
  searchParams,
}: {
  searchParams: Promise<{ jours?: string }>;
}) {
  const session = await requireAdmin();
  const { jours } = await searchParams;
  const fenetre = ["7", "30", "90"].includes(jours ?? "") ? jours : "30";
  const { data, error } = await fetchApi<Audience>(session, `/admin/stats/audience?jours=${fenetre}`);

  if (error || !data) {
    return (
      <div className="space-y-6">
        <PageHeader title="Trafic par canal" />
        <ErrorState description={error} />
      </div>
    );
  }

  const g = data.global;
  const maxJour = Math.max(1, ...data.parJour.map((j) => j.vues));

  return (
    <div className="space-y-8">
      <PageHeader
        title="Trafic par canal"
        subtitle="D'où viennent les visites, et lesquelles deviennent des inscriptions, des adresses captées ou des demandes. Un canal qui amène des visites sans jamais amener personne ne vaut pas qu'on y passe du temps."
        actions={
          <div className="flex gap-1 text-sm">
            {(["7", "30", "90"] as const).map((j) => (
              <Link
                key={j}
                href={`/admin/trafic?jours=${j}`}
                className={`rounded-md border px-3 py-1.5 ${
                  fenetre === j
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border text-muted-foreground hover:bg-muted"
                }`}
              >
                {j} jours
              </Link>
            ))}
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard label="Pages vues" value={g.vues} icon={<Eye />} accent="teal" />
        <StatCard
          label="Visites"
          value={g.visites}
          hint={g.partOrganique != null ? `${g.partOrganique} % organiques` : "part organique inconnue"}
          icon={<Footprints />}
        />
        <StatCard
          label="Inscriptions"
          value={g.inscriptions}
          hint={`${taux(g.inscriptions, g.visites)} des visites`}
          icon={<UserPlus />}
          accent="terracotta"
        />
        <StatCard
          label="Adresses captées"
          value={g.captures}
          hint={`${g.capturesOptin} opt-in séquence sur ${g.capturesTotal} au total`}
          icon={<Mail />}
          accent="warning"
        />
        <StatCard
          label="Demandes"
          value={g.demandes}
          hint="contact et devis sans compte"
          icon={<MessageSquareQuote />}
        />
      </div>

      <section className="space-y-4">
        <SectionTitle title="Jour par jour" />
        {data.parJour.length === 0 ? (
          <EmptyState
            title="Aucune vue enregistrée"
            description="Le compteur démarre au premier chargement de page après le déploiement. Revenez demain."
          />
        ) : (
          <Card>
            <CardContent className="p-5">
              <div className="flex h-40 items-end gap-[3px]">
                {data.parJour.map((j) => (
                  <div
                    key={j.jour}
                    className="group relative flex flex-1 flex-col justify-end"
                    title={`${new Date(j.jour).toLocaleDateString("fr-FR")} : ${j.vues} vues, ${j.visites} visites`}
                  >
                    <div
                      className="rounded-t-sm bg-primary/30"
                      style={{ height: `${Math.max(2, (j.vues / maxJour) * 100)}%` }}
                    />
                    <div
                      className="absolute bottom-0 left-0 right-0 rounded-t-sm bg-primary"
                      style={{ height: `${Math.max(1, (j.visites / maxJour) * 100)}%` }}
                    />
                  </div>
                ))}
              </div>
              <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                <span>{new Date(data.parJour[0].jour).toLocaleDateString("fr-FR")}</span>
                <span>
                  <span className="mr-3 inline-block size-2 rounded-sm bg-primary/30" />
                  vues
                  <span className="ml-3 mr-1 inline-block size-2 rounded-sm bg-primary" />
                  visites
                </span>
                <span>
                  {new Date(data.parJour[data.parJour.length - 1].jour).toLocaleDateString("fr-FR")}
                </span>
              </div>
            </CardContent>
          </Card>
        )}
      </section>

      <section className="space-y-4">
        <SectionTitle title="Par canal" />
        <p className="text-sm text-muted-foreground">
          La colonne qui compte est la dernière&nbsp;: une visite sur cent qui s&apos;inscrit ou
          laisse son adresse, c&apos;est un canal qui travaille. Mille visites qui repartent, c&apos;est
          du bruit.
        </p>
        {data.canaux.length === 0 ? (
          <EmptyState title="Aucun canal" description="Rien n'a encore été mesuré sur cette période." />
        ) : (
          <Card>
            <CardContent className="overflow-x-auto p-0">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">Canal</th>
                    <th className="px-4 py-3 text-right font-medium">Visites</th>
                    <th className="px-4 py-3 text-right font-medium">Vues</th>
                    <th className="px-4 py-3 text-right font-medium">Inscriptions</th>
                    <th className="px-4 py-3 text-right font-medium">Adresses</th>
                    <th className="px-4 py-3 text-right font-medium">Demandes</th>
                    <th className="px-4 py-3 text-right font-medium">Conversion</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data.canaux.map((c) => {
                    const gens = c.inscriptions + c.captures + c.demandes;
                    return (
                      <tr key={c.source} className={gens > 0 ? "" : "text-muted-foreground"}>
                        <td className="px-4 py-3">
                          <span className="font-medium text-foreground">{lisible(c.source)}</span>
                          {lisible(c.source) !== c.source ? (
                            <span className="ml-2 text-xs text-muted-foreground">{c.source}</span>
                          ) : null}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums">{c.visites}</td>
                        <td className="px-4 py-3 text-right tabular-nums">{c.vues}</td>
                        <td className="px-4 py-3 text-right tabular-nums">{c.inscriptions}</td>
                        <td className="px-4 py-3 text-right tabular-nums">{c.captures}</td>
                        <td className="px-4 py-3 text-right tabular-nums">{c.demandes}</td>
                        <td className="px-4 py-3 text-right font-medium tabular-nums text-foreground">
                          {taux(gens, c.visites)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </CardContent>
          </Card>
        )}
        <p className="text-xs text-muted-foreground">
          Pour qu&apos;une campagne apparaisse sous son nom, ses liens portent{" "}
          <code>?utm_source=linkedin&amp;utm_medium=social&amp;utm_campaign=parcours-crise</code>.
          Sans paramètre, la visite est rangée sous le site d&apos;où elle vient, ou en « direct ».
        </p>
      </section>

      <section className="space-y-4">
        <SectionTitle title="Pages les plus vues" />
        {data.pages.length === 0 ? null : (
          <Card>
            <CardContent className="overflow-x-auto p-0">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">Page</th>
                    <th className="px-4 py-3 text-right font-medium">Vues</th>
                    <th className="px-4 py-3 text-right font-medium">Entrées</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data.pages.map((p) => (
                    <tr key={p.chemin}>
                      <td className="px-4 py-2.5">
                        <Link href={p.chemin} className="text-foreground hover:underline" target="_blank">
                          {p.chemin}
                        </Link>
                      </td>
                      <td className="px-4 py-2.5 text-right tabular-nums">{p.vues}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums">{p.visites}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        )}
        <p className="text-xs text-muted-foreground">
          « Entrées » : le nombre de fois où cette page a été la première d&apos;une visite. C&apos;est
          elle qui a fait venir, quelle que soit la suite.
        </p>
      </section>
    </div>
  );
}
