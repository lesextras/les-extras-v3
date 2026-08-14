#!/bin/sh
# ============================================================================
# Démarrage de l'API — migrations d'abord, application ensuite.
#
# POURQUOI CE FICHIER EXISTE
# Jusqu'au 14/08/2026 le conteneur lançait à chaque démarrage :
#     prisma db push --schema ./prisma/schema.prisma --accept-data-loss
# La base suivait donc le schéma sans jamais passer par les migrations, et
# surtout : toute suppression de colonne ou de table se serait appliquée en
# silence au boot, sans confirmation et sans trace. `db push` avait été choisi
# parce qu'il ne bloque pas sur les changements « risqués » (l'ajout de la
# contrainte unique (accountId, number) sur Invoice avait empêché un
# déploiement le 4/8/2026) — mais le remède était pire que le mal.
#
# On repasse sur `migrate deploy` : il n'applique que des migrations écrites,
# relues et versionnées, et il refuse tout ce qui n'est pas dans l'historique.
#
# LE CAS PARTICULIER DE LA BASE ACTUELLE
# Elle contient toutes les tables mais aucune table `_prisma_migrations`,
# puisque `db push` n'en crée pas. `migrate deploy` essaierait donc de rejouer
# la migration initiale sur des tables déjà présentes, et échouerait. On
# détecte ce cas précis et on inscrit l'historique existant comme appliqué
# (« baseline », procédure documentée par Prisma) avant de déployer.
#
# Les trois situations possibles, toutes couvertes :
#   1. base vierge (nouvelle instance, restauration à blanc)
#        → pas de table Account → deploy direct, qui crée tout depuis zéro
#   2. base héritée du db push (production au 14/08/2026)
#        → tables présentes, pas d'historique → baseline puis deploy
#   3. base déjà gérée par les migrations (tous les démarrages suivants)
#        → historique présent → deploy direct, n'applique que le nouveau
# ============================================================================
set -e

SCHEMA=./prisma/schema.prisma

# Renvoie « baseline » si la base contient déjà le schéma mais pas
# l'historique des migrations, « deploy » dans tous les autres cas.
# En cas de doute (base injoignable, erreur inattendue) on renvoie « deploy » :
# migrate deploy échouera proprement et le conteneur ne démarrera pas, plutôt
# que d'inscrire un historique faux sur une base qu'on n'a pas su lire.
diagnostic() {
  node -e '
    const { PrismaClient } = require("@prisma/client");
    const prisma = new PrismaClient();
    const compte = (table) =>
      prisma.$queryRaw`
        SELECT count(*)::int AS n
        FROM information_schema.tables
        WHERE table_schema = current_schema() AND table_name = ${table}
      `.then((r) => Number(r[0].n) > 0);

    Promise.all([compte("Account"), compte("_prisma_migrations")])
      .then(([schemaPresent, historiquePresent]) => {
        console.log(schemaPresent && !historiquePresent ? "baseline" : "deploy");
      })
      .catch(() => console.log("deploy"))
      .finally(() => prisma.$disconnect());
  '
}

if [ "$(diagnostic)" = "baseline" ]; then
  echo "[entrypoint] base héritée de db push : inscription de l'historique des migrations"
  for dossier in prisma/migrations/*/; do
    nom=$(basename "$dossier")
    pnpm exec prisma migrate resolve --applied "$nom" --schema "$SCHEMA"
    echo "[entrypoint]   $nom marquée comme appliquée"
  done
  echo "[entrypoint] historique complet, passage à migrate deploy"
fi

pnpm exec prisma migrate deploy --schema "$SCHEMA"

exec node dist/main.js
