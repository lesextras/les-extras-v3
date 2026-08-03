-- Le vivier d'intervenants d'un etablissement.
--
-- La logique existait deja en interne : intervenantsConnus() calcule a la volee
-- les comptes ayant travaille pour l'etablissement, et le palier RESERVED s'en
-- sert pour choisir a qui diffuser une offre. Mais rien ne l'affichait, rien ne
-- permettait de l'enrichir, et rien ne permettait de rappeler quelqu'un.
--
-- Cette table porte la partie CHOISIE du vivier. Les habitues detectes
-- automatiquement continuent d'etre calcules a la lecture, sans etre stockes.
CREATE TABLE IF NOT EXISTS "PoolMember" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "intervenantAccountId" TEXT NOT NULL,
    "note" TEXT,
    "addedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PoolMember_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "PoolMember_accountId_intervenantAccountId_key"
    ON "PoolMember"("accountId", "intervenantAccountId");
CREATE INDEX IF NOT EXISTS "PoolMember_accountId_idx" ON "PoolMember"("accountId");
CREATE INDEX IF NOT EXISTS "PoolMember_intervenantAccountId_idx" ON "PoolMember"("intervenantAccountId");

ALTER TABLE "PoolMember" DROP CONSTRAINT IF EXISTS "PoolMember_accountId_fkey";
ALTER TABLE "PoolMember" ADD CONSTRAINT "PoolMember_accountId_fkey"
    FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PoolMember" DROP CONSTRAINT IF EXISTS "PoolMember_intervenantAccountId_fkey";
ALTER TABLE "PoolMember" ADD CONSTRAINT "PoolMember_intervenantAccountId_fkey"
    FOREIGN KEY ("intervenantAccountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PoolMember" DROP CONSTRAINT IF EXISTS "PoolMember_addedById_fkey";
ALTER TABLE "PoolMember" ADD CONSTRAINT "PoolMember_addedById_fkey"
    FOREIGN KEY ("addedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
