# Exceptions à l'audit de dépendances

La CI (`.github/workflows/ci.yml`, job `security-audit`) échoue sur toute
vulnérabilité **haute ou critique** d'une dépendance de production
(`pnpm audit --prod --audit-level high`).

Quand une correction n'est pas possible immédiatement, le CVE est ajouté à
`package.json` → `"pnpm": { "auditConfig": { "ignoreCves": [] } }` et consigné
ici. Une exception sans date de revue n'est pas acceptée.

| CVE | Paquet | Ajoutée le | Raison | Revue au plus tard |
|---|---|---|---|---|
| (aucune) | | | | |

État au 24/09/2026 : 0 haute, 0 critique, 2 modérées (non bloquantes).
