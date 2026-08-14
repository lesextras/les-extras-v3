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
# LES QUATRE ÉTATS POSSIBLES DE LA BASE, ET CE QU'ON EN FAIT
#   1. vierge (nouvelle instance, restauration à blanc)
#        → migrate deploy crée tout depuis zéro. Rien d'autre à faire.
#   2. déjà gérée par les migrations (le cas normal, tous les démarrages)
#        → migrate deploy n'applique que ce qui manque.
#   3. schéma présent, aucun historique (héritage du db push)
#        → migrate deploy refuse (P3005) ; on inscrit l'historique existant
#          comme appliqué — la procédure de « baseline » documentée par
#          Prisma — puis on redéploie.
#   4. schéma présent, historique contenant une migration EN ÉCHEC
#        → c'est l'état laissé par une tentative de bascule : migrate deploy
#          refuse tout tant que l'échec n'est pas soldé (P3018). On repasse
#          les migrations en échec en « rolled back », puis cas 3.
#
# LE GARDE-FOU QUI COMPTE
# On n'inscrit JAMAIS un historique sans avoir vérifié que les tables sont
# réellement là. Sinon, une base vide dont le déploiement a échoué pour une
# raison passagère (base pas encore prête, réseau) serait marquée « migrée »
# alors qu'elle est vide : Prisma n'y toucherait plus jamais et l'API
# tournerait sur une base sans tables. Dans le doute, on s'arrête et le
# conteneur ne démarre pas — Coolify garde alors l'ancien, qui fonctionne.
# ============================================================================
set -e

SCHEMA=./prisma/schema.prisma

# Vrai si la base contient déjà le schéma métier (on teste une table centrale).
schema_deja_present() {
  echo 'SELECT 1 FROM "Account" LIMIT 1;' \
    | pnpm exec prisma db execute --stdin --schema "$SCHEMA" >/dev/null 2>&1
}

# Solde une éventuelle migration en échec laissée par une tentative précédente.
# Sans effet quand il n'y en a pas.
solder_les_echecs() {
  for dossier in prisma/migrations/*/; do
    nom=$(basename "$dossier")
    pnpm exec prisma migrate resolve --rolled-back "$nom" --schema "$SCHEMA" >/dev/null 2>&1 || true
  done
}

# Inscrit l'historique existant comme appliqué (baseline Prisma).
inscrire_historique() {
  for dossier in prisma/migrations/*/; do
    nom=$(basename "$dossier")
    pnpm exec prisma migrate resolve --applied "$nom" --schema "$SCHEMA" >/dev/null 2>&1 || true
    echo "[entrypoint]   $nom"
  done
}

solder_les_echecs

if ! pnpm exec prisma migrate deploy --schema "$SCHEMA"; then
  if schema_deja_present; then
    echo "[entrypoint] base pré-existante sans historique complet : inscription de l'historique"
    inscrire_historique
    echo "[entrypoint] historique inscrit, nouvelle tentative"
    pnpm exec prisma migrate deploy --schema "$SCHEMA"
  else
    echo "[entrypoint] les migrations ont échoué sur une base qui n'a pas le schéma :"
    echo "[entrypoint] on n'inscrit pas d'historique à l'aveugle. Arrêt."
    exit 1
  fi
fi

exec node dist/main.js
