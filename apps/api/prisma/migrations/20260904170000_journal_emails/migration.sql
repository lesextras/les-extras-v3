-- LE JOURNAL DURABLE DES COURRIELS.
--
-- MailService tenait déjà un compteur et un journal, mais EN MÉMOIRE du
-- processus : remis à zéro à chaque redéploiement, c'est-à-dire plusieurs fois
-- par jour. On ne pouvait donc jamais répondre à « est-ce que mes mails
-- partent ? », qui est la première question posée quand un intervenant dit
-- n'avoir rien reçu.
--
-- Une ligne par envoi, réussi ou non, avec la voie empruntée et le motif
-- d'échec. Additif, sans perte.
CREATE TABLE IF NOT EXISTS "EmailEnvoye" (
  "id"           TEXT NOT NULL,
  "destinataire" TEXT NOT NULL,
  "sujet"        TEXT NOT NULL,
  "voie"         TEXT NOT NULL,
  "ok"           BOOLEAN NOT NULL,
  "erreur"       TEXT,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "EmailEnvoye_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "EmailEnvoye_createdAt_idx" ON "EmailEnvoye"("createdAt");
CREATE INDEX IF NOT EXISTS "EmailEnvoye_ok_createdAt_idx" ON "EmailEnvoye"("ok", "createdAt");
