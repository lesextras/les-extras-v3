// Back-office ADMIN — Rôles & droits (matrice de référence).
import type { Metadata } from "next";
import { requireAdmin } from "../../../_shared/server";
import { PageHeader } from "../../../_shared/ui";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Rôles & droits · Administration" };

const GLOBAL = [
  { role: "USER", label: "Utilisateur", desc: "Compte standard. Accède à son espace, ses comptes et ses actions métier selon son rôle dans chaque structure." },
  { role: "ADMIN", label: "Administrateur plateforme", desc: "Accès total au back-office ADéPA : modération, comptes, contenu, formations, Qualiopi, facturation, statistiques." },
];

// Permissions par rôle DANS un compte (Membership.role).
const ROWS = [
  { perm: "Voir l'espace de la structure", OWNER: true, ADMIN: true, MANAGER: true, MEMBER: true },
  { perm: "Publier un SOS Renfort / une mission", OWNER: true, ADMIN: true, MANAGER: true, MEMBER: false },
  { perm: "Créer un atelier / une formation interne", OWNER: true, ADMIN: true, MANAGER: true, MEMBER: false },
  { perm: "Planifier une session / émarger", OWNER: true, ADMIN: true, MANAGER: true, MEMBER: false },
  { perm: "Inscrire des apprenants / facturer", OWNER: true, ADMIN: true, MANAGER: true, MEMBER: false },
  { perm: "Inviter / gérer les membres", OWNER: true, ADMIN: true, MANAGER: false, MEMBER: false },
  { perm: "Gérer les infos & la facturation de la structure", OWNER: true, ADMIN: true, MANAGER: false, MEMBER: false },
  { perm: "Supprimer le compte / transférer la propriété", OWNER: true, ADMIN: false, MANAGER: false, MEMBER: false },
];

const COLS: { key: "OWNER" | "ADMIN" | "MANAGER" | "MEMBER"; label: string; hint: string }[] = [
  { key: "OWNER", label: "Direction", hint: "Propriétaire du compte" },
  { key: "ADMIN", label: "Administrateur", hint: "Co-gestion de la structure" },
  { key: "MANAGER", label: "Responsable de service", hint: "Pilote l'opérationnel" },
  { key: "MEMBER", label: "Salarié", hint: "Membre de l'équipe" },
];

function Dot({ ok }: { ok: boolean }) {
  return ok ? (
    <span className="text-success" aria-label="autorisé">✓</span>
  ) : (
    <span className="text-muted-foreground/40" aria-label="non autorisé">—</span>
  );
}

export default async function AdminRolesPage() {
  await requireAdmin();
  return (
    <div className="space-y-6">
      <PageHeader
        title="Rôles & droits"
        subtitle="Référence des rôles et des permissions appliqués dans l'application (contrôlés côté serveur)."
      />

      <section className="rounded-lg border border-border bg-card p-5">
        <h3 className="mb-3 font-semibold text-foreground">Rôle global (plateforme)</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {GLOBAL.map((g) => (
            <div key={g.role} className="rounded-lg border border-border p-4">
              <Badge variant={g.role === "ADMIN" ? "soft" : "muted"}>{g.label}</Badge>
              <p className="mt-2 text-sm text-muted-foreground">{g.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-border bg-card p-5">
        <h3 className="mb-1 font-semibold text-foreground">Rôle dans une structure</h3>
        <p className="mb-4 text-sm text-muted-foreground">
          Chaque membre d'un établissement ou d'un compte freelance a l'un de ces rôles. Les droits
          sont vérifiés à chaque action (guards multi-tenant).
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-3 py-2">Permission</th>
                {COLS.map((c) => (
                  <th key={c.key} className="px-3 py-2 text-center">
                    <div className="font-semibold text-foreground">{c.label}</div>
                    <div className="font-normal normal-case text-muted-foreground">{c.hint}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {ROWS.map((r) => (
                <tr key={r.perm}>
                  <td className="px-3 py-2.5 text-foreground">{r.perm}</td>
                  {COLS.map((c) => (
                    <td key={c.key} className="px-3 py-2.5 text-center">
                      <Dot ok={r[c.key]} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
