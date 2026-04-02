-- CreateEnum
CREATE TYPE "FreizeitausgleichStatus" AS ENUM ('BEANTRAGT', 'GENEHMIGT', 'ABGELEHNT');

-- CreateTable
CREATE TABLE "freizeitausgleich_antrag" (
    "id" TEXT NOT NULL,
    "mitarbeiterId" TEXT NOT NULL,
    "von" DATE NOT NULL,
    "bis" DATE NOT NULL,
    "status" "FreizeitausgleichStatus" NOT NULL DEFAULT 'BEANTRAGT',
    "genehmigtVonId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "freizeitausgleich_antrag_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "freizeitausgleich_antrag_mitarbeiterId_idx" ON "freizeitausgleich_antrag"("mitarbeiterId");

-- CreateIndex
CREATE INDEX "freizeitausgleich_antrag_genehmigtVonId_idx" ON "freizeitausgleich_antrag"("genehmigtVonId");

-- AddForeignKey
ALTER TABLE "freizeitausgleich_antrag" ADD CONSTRAINT "freizeitausgleich_antrag_mitarbeiterId_fkey" FOREIGN KEY ("mitarbeiterId") REFERENCES "mitarbeiter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "freizeitausgleich_antrag" ADD CONSTRAINT "freizeitausgleich_antrag_genehmigtVonId_fkey" FOREIGN KEY ("genehmigtVonId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
