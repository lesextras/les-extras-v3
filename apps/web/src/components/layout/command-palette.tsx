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
  /** Fonctionnalité LEX à crédits : masquée de la palette si solde à zéro. */
  premium?: boolean;
}

const DESTINATIONS: Dest[] = [
  { label: "Tableau de bord", href: "/dashboard", group: "Navigation", keywords: "accueil home" },
  { label: "Édublog", href: "/edublog", group: "Navigation", keywords: "articles actualites blog publications" },
  /*
    ⚠⚠ LE CATALOGUE PUBLIC — AJOUTÉ LE 16/09/2026, ET IL NE FAUT PAS LE RETIRER.

    « Ateliers » et « Formations » ne vivent que dans le menu déroulant
    « Catalogue » de la barre du haut, qui est `hidden md:flex`. Le menu de
    gauche ne les porte que pour le compte Particulier. Conséquence mesurée :
    sur téléphone, un intervenant, un établissement ou un administrateur
    n'avait AUCUN chemin dans l'application vers le catalogue public — alors
    que c'est le cœur du produit.

    C'est exactement la règle que `header.tsx` écrit lui-même au-dessus du menu
    LEX : toute entrée montée dans la barre du haut doit avoir son miroir ici.
    Elle avait été appliquée aux trois outils LEX le 03/09, et oubliée pour le
    catalogue.

    ⚠ « Formations » pointe ici sur `/formations` (le catalogue PUBLIC), à ne
    pas confondre avec l'entrée « Formations » du groupe Établissement, qui
    mène à `/marketplace/formations` — l'écran d'inscription des salariés. Deux
    écrans, deux métiers, et c'est pour ça que les libellés diffèrent.
  */
  { label: "Catalogue des ateliers", href: "/ateliers", group: "Navigation", keywords: "catalogue ateliers mediation animation intervenant public vitrine" },
  { label: "Catalogue des formations", href: "/formations", group: "Navigation", keywords: "catalogue formations parcours gratuits qualiopi vitrine" },
  // `premium` : fonctionnalité LEX à crédits. La palette est une porte
  // d'entrée comme une autre — la laisser ouverte pendant que le menu est
  // verrouillé serait incohérent.
  { label: "Assistant d'écriture", href: "/dashboard/assistant", group: "Navigation", keywords: "ia rapport note observation transmission redaction", premium: true },
  // Ajoutés le 03/09/2026, quand les trois outils LEX ont quitté le menu de
  // gauche pour la barre du haut : ce menu déroulant est `hidden md:flex`,
  // donc sur téléphone la palette est le SEUL chemin restant. Sans ces deux
  // lignes, deux outils payants devenaient inatteignables au doigt.
  { label: "Générateur d'activités", href: "/dashboard/activites", group: "Navigation", keywords: "ia activite atelier seance support animation", premium: true },
  { label: "Appui scolaire", href: "/dashboard/appui-scolaire", group: "Navigation", keywords: "ia ecole devoirs fiche memo revision decrochage aesh", premium: true },
  { label: "Opportunités", href: "/dashboard/opportunites", group: "Intervenant", keywords: "matching missions" },
  { label: "Mes ateliers", href: "/dashboard/ateliers", group: "Intervenant", keywords: "services educatheures" },
  { label: "Mes formations", href: "/dashboard/formations", group: "Intervenant", keywords: "formation session émargement apprenants attestation" },
  { label: "RenforTeam", href: "/dashboard/renforts", group: "Établissement", keywords: "remplacement besoin publier" },
  { label: "Formations", href: "/marketplace/formations", group: "Établissement", keywords: "catalogue certifiant qualiopi inscription salariés" },
  { label: "Mes réservations", href: "/dashboard/reservations", group: "Navigation", keywords: "reservations bookings renfort atelier formation inscriptions contrat tout" },
  { label: "Mes réservations ateliers", href: "/dashboard/reservations/ateliers", group: "Navigation", keywords: "reservations ateliers commandes interventions date statut" },
  { label: "Mes réservations formation", href: "/dashboard/reservations/formations", group: "Navigation", keywords: "reservations formations inscriptions session apprenant financement attestation" },
  { label: "Devis & factures", href: "/dashboard/facturation", group: "Navigation", keywords: "devis facture chiffrage paiement reglement finance revenus depenses" },
  { label: "Planning", href: "/dashboard/planning", group: "Navigation", keywords: "calendrier créneaux" },
  { label: "Contrats CDD", href: "/dashboard/contrats", group: "Établissement", keywords: "cdd contrat embauche precarite carence dpae periode essai" },
  /*
    ⚠ AJOUTÉ LE 16/09/2026 : cette page était atteignable UNIQUEMENT en tapant
    son adresse. Son entrée de menu est réservée aux responsables ET rangée
    derrière « Outils avancés » — alors que la page est écrite pour servir
    AUSSI le salarié simple, à qui elle dit « posez vos demandes d'absence ».
    Un salarié n'avait donc aucun moyen de poser une absence.
  */
  { label: "Temps de travail & congés", href: "/dashboard/temps-de-travail", group: "Établissement", keywords: "absence conge planning solde recuperation heures nuit dimanche ferie annualisation demande" },
  { label: "Messagerie", href: "/dashboard/inbox", group: "Navigation", keywords: "messages chat conversation" },
  // Retirées du menu de gauche le 12/08/2026 pour l'alléger : la palette
  // devient leur chemin d'accès, avec des mots-clés larges pour qu'on les
  // trouve sans connaître leur nom exact.
  { label: "Conformité", href: "/dashboard/conformite", group: "Établissement", keywords: "pièces obligatoires cni casier judiciaire diplôme permis échéance manquant" },
  { label: "Mes données personnelles", href: "/dashboard/donnees-personnelles", group: "Mon espace", keywords: "rgpd export suppression effacement vie privée confidentialité" },
  { label: "Boîte à idées", href: "/dashboard/idees", group: "Mon espace", keywords: "idée suggestion amélioration vote proposition" },
  { label: "LEX · Crédits & abonnement", href: "/dashboard/adhesion", group: "Établissement", keywords: "stripe paiement crédits recharge lex abonnement utilisation" },
  { label: "Mon compte", href: "/dashboard/account", group: "Mon espace", keywords: "profil paramètres équipe" },
  { label: "Admin, Vue d’ensemble", href: "/admin", group: "Admin", keywords: "back-office" },
  { label: "Admin, Utilisateurs", href: "/admin/utilisateurs", group: "Admin", keywords: "users comptes rattachements salarié responsable" },
  { label: "Admin, Comptes & sous-comptes", href: "/admin/etablissements", group: "Admin", keywords: "organisations comptes établissements freelances membres sous-comptes rattachés" },
  { label: "Admin, Invitations", href: "/admin/invitations", group: "Admin", keywords: "invitation membres révoquer renvoyer" },
  { label: "Admin, Rôles & droits", href: "/admin/roles", group: "Admin", keywords: "rôles droits permissions matrice direction responsable salarié" },
  { label: "Admin, Catégories", href: "/admin/categories", group: "Admin", keywords: "taxonomie" },
  { label: "Admin, Articles", href: "/admin/articles", group: "Admin", keywords: "contenu blog" },
  { label: "Admin, Missions", href: "/admin/missions", group: "Admin", keywords: "modération" },
  { label: "Admin, Ateliers", href: "/admin/ateliers", group: "Admin", keywords: "services" },
  { label: "Admin, Réservations", href: "/admin/reservations", group: "Admin", keywords: "bookings" },
  { label: "Admin, Centre de formation", href: "/admin/formations", group: "Admin", keywords: "formations qualiopi certifiant interne" },
  { label: "Admin, Conformité Qualiopi", href: "/admin/qualiopi", group: "Admin", keywords: "qualiopi critères indicateurs preuves audit surveillance" },
  { label: "Admin, Registre & BPF", href: "/admin/registre", group: "Admin", keywords: "registre bpf bilan pédagogique financier edof export" },
  { label: "Admin, Coffre-fort conformité", href: "/admin/conformite", group: "Admin", keywords: "conformité pièces obligatoires intervenants cni casier permis iban urssaf établissement" },
  { label: "Admin, Demandes de contact", href: "/admin/contacts", group: "Admin", keywords: "contact messages formulaire public devis" },
  { label: "Admin, Factures", href: "/admin/factures", group: "Admin", keywords: "invoices" },
  { label: "Admin, LEX Crédits", href: "/admin/lex", group: "Admin", keywords: "lex credits ventes consommation abonnements essais stripe" },
  { label: "Admin, Statistiques", href: "/admin/statistiques", group: "Admin", keywords: "kpi" },
  { label: "Admin, Tunnel d'acquisition", href: "/admin/tunnel", group: "Admin", keywords: "tunnel acquisition conversion vues demandes devis réservations" },
  { label: "Admin, Journal d'audit", href: "/admin/journal", group: "Admin", keywords: "journal audit traçabilité actions historique modérations" },
];

export function CommandPalette({
  isMember,
  role,
  accountType,
}: {
  isMember?: boolean;
  /** Rôle global : les entrées Admin ne sont proposées qu'aux administrateurs. */
  role?: "USER" | "ADMIN";
  /** Type du compte actif : filtre les groupes Freelance / Établissement. */
  accountType?: string | null;
} = {}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const results = useMemo(() => {
    // Proposer une page qui répondra « réservé aux freelances » (ou une page
    // admin à un compte standard) fait perdre un aller-retour : on filtre les
    // groupes selon le rôle et le type de compte AVANT la recherche.
    const ouvertes = DESTINATIONS.filter((d) => {
      if (d.premium && !isMember) return false;
      if (d.group === "Admin" && role !== "ADMIN") return false;
      if (d.group === "Freelance" && accountType === "ESTABLISHMENT" && role !== "ADMIN") return false;
      if (d.group === "Établissement" && accountType === "FREELANCE" && role !== "ADMIN") return false;
      /*
        ⚠ LE COMPTE PARTICULIER N'ÉTAIT TESTÉ NULLE PART (corrigé le
        16/09/2026). Les deux lignes ci-dessus ne retirent un groupe qu'en
        présence de l'AUTRE type : un compte PARTICULIER voyait donc les deux,
        c'est-à-dire « RenforTeam », « Contrats CDD », « Conformité »,
        « Opportunités » — toutes des pages qui lui répondent « réservé aux
        établissements » ou le renvoient en silence.

        C'est la qualité même de ce compte qui était défaite : son menu est
        court exprès (« lui servir le menu d'un établissement serait lui
        montrer vingt portes dont dix-huit lui sont fermées », lib/nav.ts) — la
        palette rouvrait les dix-huit.
      */
      if (accountType === "PARTICULIER" && (d.group === "Freelance" || d.group === "Établissement")) {
        return false;
      }
      return true;
    });
    const needle = q.trim().toLowerCase();
    if (!needle) return ouvertes;
    return ouvertes.filter((d) =>
      `${d.label} ${d.group} ${d.keywords ?? ""}`.toLowerCase().includes(needle),
    );
  }, [q, isMember, role, accountType]);

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
