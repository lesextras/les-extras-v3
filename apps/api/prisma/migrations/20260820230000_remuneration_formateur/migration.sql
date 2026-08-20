-- RÉMUNÉRATION DU FORMATEUR
--
-- Jusqu'ici, une session de formation ne connaissait que `priceHt` : ce que
-- l'organisme VEND à l'établissement. Rien, nulle part, ne savait ce qui était
-- DÛ au formateur — donc rien ne pouvait être facturé de son côté, et la
-- seconde moitié du circuit (formateur → organisme) n'existait pas.
--
-- Deux colonnes :
--   `trainerFeeHt`     le montant convenu avec le formateur, fixé par
--                      l'organisme qui commande la prestation ;
--   `trainerInvoiceId` la facture que le FORMATEUR émet à l'organisme. Elle
--                      lui appartient — c'est son SIRET qui l'engage — et le
--                      lien unique garantit qu'il n'y en a qu'une par session.
--
-- ON DELETE SET NULL, et non CASCADE : effacer une facture ne doit jamais
-- emporter la session qu'elle rémunère. Écrit en idempotent (IF NOT EXISTS,
-- garde sur pg_constraint) pour rester sans effet sur une base déjà à jour et
-- correct sur une base restaurée.

ALTER TABLE "FormationSession" ADD COLUMN IF NOT EXISTS "trainerFeeHt" DECIMAL(10,2);
ALTER TABLE "FormationSession" ADD COLUMN IF NOT EXISTS "trainerInvoiceId" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "FormationSession_trainerInvoiceId_key" ON "FormationSession"("trainerInvoiceId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'FormationSession_trainerInvoiceId_fkey'
  ) THEN
    ALTER TABLE "FormationSession"
      ADD CONSTRAINT "FormationSession_trainerInvoiceId_fkey"
      FOREIGN KEY ("trainerInvoiceId") REFERENCES "Invoice"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
