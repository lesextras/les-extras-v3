-- Achat de crédits LEX : facture Stripe rattachée et date de paiement.
ALTER TABLE "CreditPurchase"
  ADD COLUMN IF NOT EXISTS "stripeInvoiceId" TEXT,
  ADD COLUMN IF NOT EXISTS "factureUrl" TEXT,
  ADD COLUMN IF NOT EXISTS "paidAt" TIMESTAMP(3);
