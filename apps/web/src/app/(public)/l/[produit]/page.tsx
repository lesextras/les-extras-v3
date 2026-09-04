// PAGE D'ATTERRISSAGE D'UN PRODUIT — voir ../donnees.ts pour la doctrine.
//
// Courte, et c'est le point : une promesse, trois preuves, une adresse. Le
// visiteur arrive d'un courriel ou d'un post, il a dix secondes. Tout ce qui
// explique est un clic plus loin, sur la page de fond.
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, CircleCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { metaPublique } from "@/lib/meta";
import { LANDINGS, trouverLanding } from "../donnees";
import { FormulaireLanding } from "../FormulaireLanding";

export function generateStaticParams() {
  return LANDINGS.map((l) => ({ produit: l.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ produit: string }>;
}): Promise<Metadata> {
  const { produit } = await params;
  const l = trouverLanding(produit);
  if (!l) return { title: "Page introuvable", robots: { index: false } };
  return metaPublique({ title: l.titre, description: l.sous, path: `/l/${l.slug}` });
}

export default async function LandingPage({ params }: { params: Promise<{ produit: string }> }) {
  const { produit } = await params;
  const l = trouverLanding(produit);
  if (!l) notFound();

  return (
    <div className="mx-auto max-w-5xl space-y-12 py-4">
      <section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
        <div className="space-y-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">{l.public}</p>
          <h1 className="text-balance text-3xl font-bold leading-tight text-foreground sm:text-4xl">
            {l.promesse}
          </h1>
          <p className="max-w-prose text-base leading-relaxed text-muted-foreground">{l.sous}</p>
          <ul className="space-y-4 pt-2">
            {l.preuves.map((p) => (
              <li key={p.titre} className="flex gap-3">
                <CircleCheck className="mt-0.5 size-5 shrink-0 text-success" />
                <div>
                  <p className="font-semibold text-foreground">{p.titre}</p>
                  <p className="text-sm leading-relaxed text-muted-foreground">{p.texte}</p>
                </div>
              </li>
            ))}
          </ul>
          <div className="pt-2">
            <Button asChild variant="link" className="px-0">
              <Link href={l.enSavoirPlus.href}>
                {l.enSavoirPlus.label} <ArrowRight className="ml-1 size-4" />
              </Link>
            </Button>
          </div>
        </div>
        <div className="lg:sticky lg:top-24">
          <FormulaireLanding sujet={l.sujet} bouton={l.bouton} structure={l.structure} offre={l.offre} />
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-muted/40 p-6 text-sm text-muted-foreground">
        <p>
          <strong className="text-foreground">Les Extras</strong> est édité par l&apos;association ADéPA
          (Melun, Seine-et-Marne), organisme de formation certifié Qualiopi. La mise en relation est
          gratuite pour les établissements comme pour les intervenants — 0 % de commission, sans
          abonnement. Ce que l&apos;association vend, elle le dit&nbsp;: des formations au devis et un
          assistant d&apos;écriture. Le reste est gratuit, et le restera.
        </p>
      </section>
    </div>
  );
}
