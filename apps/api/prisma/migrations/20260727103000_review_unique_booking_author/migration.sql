-- Un avis par réservation ET par auteur : l'établissement et l'intervenant
-- peuvent chacun déposer le leur sur la même réservation.

-- DropIndex
DROP INDEX "Review_bookingId_key";

-- CreateIndex
CREATE UNIQUE INDEX "Review_bookingId_authorId_key" ON "Review"("bookingId", "authorId");
