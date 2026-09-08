-- La fiche programme (Formation, au sens Qualiopi) et la formation suivie
-- (Cours) sont une seule et même chose vue de l'organisme : on les relie.
ALTER TABLE "Cours" ADD COLUMN "formationId" TEXT;

CREATE UNIQUE INDEX "Cours_formationId_key" ON "Cours"("formationId");

ALTER TABLE "Cours" ADD CONSTRAINT "Cours_formationId_fkey"
  FOREIGN KEY ("formationId") REFERENCES "Formation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
