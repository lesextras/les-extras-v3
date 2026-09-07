-- Les actions de l'association : ce qu'elle fait sur le terrain.
CREATE TYPE "EtatAction" AS ENUM ('PREVUE', 'EN_COURS', 'TERMINEE');

CREATE TABLE "ActionAssociation" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "intitule" TEXT NOT NULL,
    "resume" TEXT,
    "lieu" TEXT,
    "dateDebut" TIMESTAMP(3),
    "dateFin" TIMESTAMP(3),
    "etat" "EtatAction" NOT NULL DEFAULT 'PREVUE',
    "beneficiaires" INTEGER,
    "benevoles" INTEGER,
    "heuresBenevoles" INTEGER,
    "cout" INTEGER,
    "partenaires" TEXT,
    "bilan" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ActionAssociation_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ActionAssociation_organisationId_idx" ON "ActionAssociation"("organisationId");

ALTER TABLE "ActionAssociation" ADD CONSTRAINT "ActionAssociation_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
