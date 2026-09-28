-- LE COMPTE OUVERT PAR LE PAIEMENT D'UN ATELIER (28/09/2026).
-- Additive et rejouable : une colonne nullable, un index, une cle etrangere.
ALTER TABLE "ReservationAtelier" ADD COLUMN IF NOT EXISTS "acheteurAccountId" TEXT;

CREATE INDEX IF NOT EXISTS "ReservationAtelier_acheteurAccountId_idx"
  ON "ReservationAtelier"("acheteurAccountId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ReservationAtelier_acheteurAccountId_fkey'
  ) THEN
    ALTER TABLE "ReservationAtelier"
      ADD CONSTRAINT "ReservationAtelier_acheteurAccountId_fkey"
      FOREIGN KEY ("acheteurAccountId") REFERENCES "Account"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
