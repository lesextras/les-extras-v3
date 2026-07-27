"use client";

// Palette de commande ⌘K / Ctrl+K : recherche et navigation rapides.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

interface Dest {
  label: string;
  href: string;
  group: string;
  keywords?: string;
}

const DESTINATIONS: Dest[] = [
  { label: "Tableau de bord", href: "/dashboard", group: "Navigation", keywords: "accueil home" },
  { label: "Marketplace", href: "/marketplace", group: "Navigation", keywords: "missions ateliers catalogue" },
  { label: "Opportunités", href: "/dashboard/opportunites", group: "Freelance", keywords: "matching missions" },
  { label: "Mes ateliers", href: "/dashboard/ateliers", group: "Freelance", keywords: "services educatheures" },
  { label: "Mes formations", href: "/dashboard/formations", group: "Freelance", keywords: "formation session émargement apprenants attestation" },
  { label: "SOS Renfort", href: "/dashboard/renforts", group: "Établissement", keywords: "remplacement besoin publier" },
  { label: "Formations", href: "/marketplace/formations", group: "Établissement", keywords: "catalogue certifiant qualiopi inscription salariés" },
  { label: "Coffre-fort conformité", href: "/dashboard/conformite", group: "Établissement", keywords: "conformité pièces obligatoires cni casier judiciaire permis iban urssaf échéance renouvellement" },
  { label: "Planning", href: "/dashboard/planning", group: "Navigation", keywords: "calendrier créneaux" },
  { label: "Messagerie", href: "/dashboard/inbox", group: "Navigation", keywords: "messages chat" },
  { label: "Factures & revenus", href: "/dashboard/finance", group: "Navigation", keywords: "facture argent paiement" },
  { label: "Abonnement & crédits", href: "/dashboard/credits", group: "Établissement", keywords: "stripe paiement abonnement recharger crédits" },
  { label: "Devis", href: "/dashboard/devis", group: "Navigation", keywords: "devis chiffrage proposition estimation prix" },
  { label: "Mon compte", href: "/dashboard/account", group: "Mon espace", keywords: "profil paramètres équipe" },
  { label: "Admin — Vue d’ensemble", href: "/admin", group: "Admin", keywords: "back-office" },
  { label: "Admin — Utilisateurs", href: "/admin/utilisateurs", group: "Admin", keywords: "users comptes rattachements salarié responsable" },
  { label: "Admin — Comptes & sous-comptes", href: "/admin/etablissements", group: "Admin", keywords: "organisations comptes établissements freelances membres sous-comptes rattachés" },
  { label: "Admin — Invitations", href: "/admin/invitations", group: "Admin", keywords: "invitation membres révoquer renvoyer" },
  { label: "Admin — Rôles & droits", href: "/admin/roles", group: "Admin", keywords: "rôles droits permissions matrice direction responsable salarié" },
  { label: "Admin — Catégories", href: "/admin/categories", group: "Admin", keywords: "taxonomie" },
  { label: "Admin — Articles", href: "/admin/articles", group: "Admin", keywords: "contenu blog" },
  { label: "Admin — Missions", href: "/admin/missions", group: "Admin", keywords: "modération" },
  { label: "Admin — Ateliers", href: "/admin/ateliers", group: "Admin", keywords: "services" },
  { label: "Admin — Réservations", href: "/admin/reservations", group: "Admin", keywords: "bookings" },
  { label: "Admin — Educat’heures", href: "/admin/educatheures", group: "Admin", keywords: "banque heures crédits" },
  { label: "Admin — Centre de formation", href: "/admin/formations", group: "Admin", keywords: "formations qualiopi certifiant interne" },
  { label: "Admin — Coffre-fort conformité", href: "/admin/conformite", group: "Admin", keywords: "conformité pièces obligatoires intervenants cni casier permis iban urssaf établissement" },
  { label: "Admin — Factures", href: "/admin/factures", group: "Admin", keywords: "invoices" },
  { label: "Admin — Statistiques", href: "/admin/statistiques", group: "Admin", keywords: "kpi" },
];

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const results = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return DESTINATIONS;
    return DESTINATIONS.filter((d) =>
      `${d.label} ${d.group} ${d.keywords ?? ""}`.toLowerCase().includes(needle),
    );
  }, [q]);

  const close = useCallback(() => {
    setOpen(false);
    setQ("");
    setActive(0);
  }, []);

  const go = useCallback(
    (href: string) => {
      close();
      router.push(href);
    },
    [close, router],
  );

  // Raccourci global ⌘K / Ctrl+K.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      } else if (e.key === "Escape") {
        setOpen(false);
      }
    }
    function onOpen() {
      setOpen(true);
    }
    window.addEventListener("keydown", onKey);
    window.addEventListener("cmdk:open", onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("cmdk:open", onOpen);
    };
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 20);
  }, [open]);

  useEffect(() => {
    setActive(0);
  }, [q]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center bg-foreground/40 p-4 pt-[12vh]"
      onMouseDown={close}
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-xl border border-border bg-card shadow-2xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 border-b border-border px-3">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setActive((a) => Math.min(a + 1, results.length - 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setActive((a) => Math.max(a - 1, 0));
              } else if (e.key === "Enter" && results[active]) {
                e.preventDefault();
                go(results[active].href);
              }
            }}
            placeholder="Rechercher une page, une action…"
            className="w-full bg-transparent py-3 text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
          <kbd className="hidden rounded border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground sm:block">Esc</kbd>
        </div>
        <div className="max-h-[50vh] overflow-y-auto p-1.5">
          {results.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">Aucun résultat.</p>
          ) : (
            results.map((d, i) => (
              <button
                key={d.href}
                onMouseEnter={() => setActive(i)}
                onClick={() => go(d.href)}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm ${
                  i === active ? "bg-primary/10 text-foreground" : "text-foreground hover:bg-muted"
                }`}
              >
                <span>{d.label}</span>
                <span className="text-xs text-muted-foreground">{d.group}</span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
