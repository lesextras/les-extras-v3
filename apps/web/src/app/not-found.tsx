// Page 404 globale. Sans ce fichier, Next.js sert sa page par défaut : fond
// ivoire, texte anglais, aucun moyen de repartir. Au milieu d'une application
// sombre, elle donne l'impression d'avoir quitté le site.
import type { Metadata } from "next";
import Link from "next/link";
import { Compass, ArrowLeft, LifeBuoy } from "lucide-react";

export const metadata: Metadata = {
  title: "Page introuvable",
  robots: { index: false, follow: false },
};

const PISTES = [
  { href: "/ateliers", label: "Le catalogue d'ateliers" },
  { href: "/formations", label: "Les formations Qualiopi" },
  { href: "/edublog", label: "L'Édublog" },
];

export default function NotFound() {
  return (
    <div className="theme-sombre flex min-h-screen flex-col items-center justify-center bg-background px-6 py-20 text-foreground">
      <span className="grid size-14 place-items-center rounded-2xl bg-primary-soft text-primary">
        <Compass className="size-7" aria-hidden />
      </span>

      <p className="mt-6 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        Erreur 404
      </p>
      <h1 className="mt-2 max-w-xl text-center text-3xl font-bold tracking-tight md:text-4xl">
        Cette page n&apos;existe pas
      </h1>
      <p className="mt-4 max-w-lg text-center leading-relaxed text-muted-foreground">
        Elle a peut-être été déplacée, ou le lien qui vous a amené ici est erroné. Rien n&apos;est
        perdu : voici par où repartir.
      </p>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Retour à l&apos;accueil
        </Link>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-5 py-2.5 text-sm font-semibold transition hover:border-primary/50"
        >
          Mon espace
        </Link>
      </div>

      <ul className="mt-10 flex flex-wrap justify-center gap-2">
        {PISTES.map((p) => (
          <li key={p.href}>
            <Link
              href={p.href}
              className="inline-flex rounded-full border border-border bg-card px-4 py-1.5 text-sm text-foreground/80 transition-colors hover:border-primary/40 hover:text-primary"
            >
              {p.label}
            </Link>
          </li>
        ))}
      </ul>

      <p className="mt-10 inline-flex items-center gap-2 text-sm text-muted-foreground">
        <LifeBuoy className="size-4" aria-hidden />
        Un lien cassé ?{" "}
        <Link href="/contact" className="font-medium text-primary hover:underline">
          Signalez-le nous
        </Link>
      </p>
    </div>
  );
}
