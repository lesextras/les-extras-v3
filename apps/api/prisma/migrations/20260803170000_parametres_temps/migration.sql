-- Les regles de temps de travail propres a chaque etablissement.
--
-- Rien de ce qui figure ici n'est impose par la loi, et c'est precisement la
-- raison d'etre de la table. Dans le secteur social et medico-social, la seule
-- majoration legale est celle du 1er mai (art. L. 3133-6). La nuit ouvre un
-- repos compensateur obligatoire mais une compensation salariale seulement
-- « le cas echeant » (L. 3122-8) ; le dimanche n'ouvre aucune majoration
-- legale, les ESSMS relevant d'une derogation permanente au repos dominical
-- (R. 3132-5) ; les dix feries autres que le 1er mai sont travaillables sans
-- majoration.
--
-- Les valeurs par defaut sont donc a ZERO pour les majorations, et aux valeurs
-- SUPPLETIVES du code du travail pour le reste. Aucun taux n'est invente.
CREATE TABLE IF NOT EXISTS "ParametresTemps" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "convention" TEXT,
    "accordEntreprise" BOOLEAN NOT NULL DEFAULT false,
    "nuitDebutHeure" INTEGER NOT NULL DEFAULT 21,
    "nuitFinHeure" INTEGER NOT NULL DEFAULT 6,
    "nuitPct" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "dimanchePct" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "feriePct" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "cumulDimancheEtFerie" BOOLEAN NOT NULL DEFAULT false,
    "droitLocal" BOOLEAN NOT NULL DEFAULT false,
    "vendrediSaint" BOOLEAN NOT NULL DEFAULT false,
    "majorationHS1Pct" DECIMAL(5,2) NOT NULL DEFAULT 25,
    "majorationHS2Pct" DECIMAL(5,2) NOT NULL DEFAULT 50,
    "seuilBasculeHS" INTEGER NOT NULL DEFAULT 8,
    "contingentAnnuel" INTEGER NOT NULL DEFAULT 220,
    "seuilDeclenchementHS" INTEGER NOT NULL DEFAULT 1607,
    "limiteHebdoHaute" INTEGER,
    "limiteHebdoBasse" INTEGER,
    "delaiPrevenanceJours" INTEGER NOT NULL DEFAULT 7,
    "congesTrimestrielsEducatif" INTEGER NOT NULL DEFAULT 0,
    "congesTrimestrielsAutres" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ParametresTemps_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "ParametresTemps_accountId_key" ON "ParametresTemps"("accountId");

ALTER TABLE "ParametresTemps" DROP CONSTRAINT IF EXISTS "ParametresTemps_accountId_fkey";
ALTER TABLE "ParametresTemps" ADD CONSTRAINT "ParametresTemps_accountId_fkey"
    FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Le seuil de declenchement ne peut jamais depasser 1607 heures : c'est un
-- plafond d'ordre public (art. L. 3121-41), confirme par Cass. soc.
-- 11 mai 2016 n° 14-29.512 meme lorsque le salarie n'a pas acquis tous ses
-- droits a conges. Un accord peut descendre en dessous, jamais monter.
ALTER TABLE "ParametresTemps" DROP CONSTRAINT IF EXISTS "ParametresTemps_seuil_plafond_legal";
ALTER TABLE "ParametresTemps" ADD CONSTRAINT "ParametresTemps_seuil_plafond_legal"
    CHECK ("seuilDeclenchementHS" > 0 AND "seuilDeclenchementHS" <= 1607);

-- Plancher de 10 % pour la majoration des heures supplementaires
-- (art. L. 3121-33). Un accord ne peut pas descendre en dessous.
ALTER TABLE "ParametresTemps" DROP CONSTRAINT IF EXISTS "ParametresTemps_plancher_majoration";
ALTER TABLE "ParametresTemps" ADD CONSTRAINT "ParametresTemps_plancher_majoration"
    CHECK ("majorationHS1Pct" >= 10 AND "majorationHS2Pct" >= 10);
