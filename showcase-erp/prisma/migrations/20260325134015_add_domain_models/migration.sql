-- CreateEnum
CREATE TYPE "MitarbeiterSkill" AS ENUM ('MUEHLE', 'WALZE', 'EXTRAKTION', 'LECITHIN');

-- CreateEnum
CREATE TYPE "Teilanlage" AS ENUM ('MUEHLE', 'WALZE', 'EXTRAKTION', 'LECITHIN', 'SPRINGER');

-- CreateEnum
CREATE TYPE "SchichtTyp" AS ENUM ('FRUEH', 'SPAET', 'NACHT', 'SPRINGER', 'URLAUB', 'KRANK', 'X_FREI');

-- CreateTable
CREATE TABLE "mitarbeiter" (
    "id" TEXT NOT NULL,
    "referenzNummer" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "skills" "MitarbeiterSkill"[],
    "weeklyWorkRequirement" DECIMAL(5,2) NOT NULL,
    "urlaubsAnspruch" INTEGER NOT NULL,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mitarbeiter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "zuteilung" (
    "id" TEXT NOT NULL,
    "mitarbeiterId" TEXT NOT NULL,
    "teilanlage" "Teilanlage" NOT NULL,
    "datum" DATE NOT NULL,
    "schicht" "SchichtTyp" NOT NULL,
    "erstelltAm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "erstelltVonId" TEXT NOT NULL,
    "zeitplanId" TEXT NOT NULL,

    CONSTRAINT "zuteilung_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "zeitbuchung" (
    "id" TEXT NOT NULL,
    "mitarbeiterId" TEXT NOT NULL,
    "datum" DATE NOT NULL,
    "von" TIME(0) NOT NULL,
    "bis" TIME(0) NOT NULL,
    "schicht" "SchichtTyp" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "zeitbuchung_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "praemie" (
    "id" TEXT NOT NULL,
    "mitarbeiterId" TEXT NOT NULL,
    "typ" TEXT NOT NULL,
    "zuteilungId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "praemie_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "zeitplan" (
    "id" TEXT NOT NULL,
    "jahr" INTEGER NOT NULL,
    "kalenderwoche" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "zeitplan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "urlaubsantrag" (
    "id" TEXT NOT NULL,
    "mitarbeiterId" TEXT NOT NULL,
    "von" DATE NOT NULL,
    "bis" DATE NOT NULL,
    "genehmigtVonId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "urlaubsantrag_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "mitarbeiter_referenzNummer_key" ON "mitarbeiter"("referenzNummer");

-- CreateIndex
CREATE UNIQUE INDEX "mitarbeiter_userId_key" ON "mitarbeiter"("userId");

-- CreateIndex
CREATE INDEX "zuteilung_datum_idx" ON "zuteilung"("datum");

-- CreateIndex
CREATE INDEX "zuteilung_zeitplanId_idx" ON "zuteilung"("zeitplanId");

-- CreateIndex
CREATE INDEX "zuteilung_erstelltVonId_idx" ON "zuteilung"("erstelltVonId");

-- CreateIndex
CREATE UNIQUE INDEX "zuteilung_mitarbeiterId_datum_key" ON "zuteilung"("mitarbeiterId", "datum");

-- CreateIndex
CREATE INDEX "zeitbuchung_mitarbeiterId_datum_idx" ON "zeitbuchung"("mitarbeiterId", "datum");

-- CreateIndex
CREATE INDEX "praemie_mitarbeiterId_idx" ON "praemie"("mitarbeiterId");

-- CreateIndex
CREATE INDEX "praemie_zuteilungId_idx" ON "praemie"("zuteilungId");

-- CreateIndex
CREATE UNIQUE INDEX "zeitplan_jahr_kalenderwoche_key" ON "zeitplan"("jahr", "kalenderwoche");

-- CreateIndex
CREATE INDEX "urlaubsantrag_mitarbeiterId_idx" ON "urlaubsantrag"("mitarbeiterId");

-- CreateIndex
CREATE INDEX "urlaubsantrag_genehmigtVonId_idx" ON "urlaubsantrag"("genehmigtVonId");

-- AddForeignKey
ALTER TABLE "mitarbeiter" ADD CONSTRAINT "mitarbeiter_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "zuteilung" ADD CONSTRAINT "zuteilung_mitarbeiterId_fkey" FOREIGN KEY ("mitarbeiterId") REFERENCES "mitarbeiter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "zuteilung" ADD CONSTRAINT "zuteilung_erstelltVonId_fkey" FOREIGN KEY ("erstelltVonId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "zuteilung" ADD CONSTRAINT "zuteilung_zeitplanId_fkey" FOREIGN KEY ("zeitplanId") REFERENCES "zeitplan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "zeitbuchung" ADD CONSTRAINT "zeitbuchung_mitarbeiterId_fkey" FOREIGN KEY ("mitarbeiterId") REFERENCES "mitarbeiter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "praemie" ADD CONSTRAINT "praemie_mitarbeiterId_fkey" FOREIGN KEY ("mitarbeiterId") REFERENCES "mitarbeiter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "praemie" ADD CONSTRAINT "praemie_zuteilungId_fkey" FOREIGN KEY ("zuteilungId") REFERENCES "zuteilung"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "urlaubsantrag" ADD CONSTRAINT "urlaubsantrag_mitarbeiterId_fkey" FOREIGN KEY ("mitarbeiterId") REFERENCES "mitarbeiter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "urlaubsantrag" ADD CONSTRAINT "urlaubsantrag_genehmigtVonId_fkey" FOREIGN KEY ("genehmigtVonId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
