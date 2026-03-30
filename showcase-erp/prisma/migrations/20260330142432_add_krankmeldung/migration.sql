-- AlterTable
ALTER TABLE "zuteilung" ADD COLUMN     "originalSchicht" "SchichtTyp",
ADD COLUMN     "originalTeilanlage" "Teilanlage";

-- CreateTable
CREATE TABLE "krankmeldung" (
    "id" TEXT NOT NULL,
    "mitarbeiterId" TEXT NOT NULL,
    "von" DATE NOT NULL,
    "bis" DATE NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "krankmeldung_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "krankmeldung_mitarbeiterId_idx" ON "krankmeldung"("mitarbeiterId");

-- AddForeignKey
ALTER TABLE "krankmeldung" ADD CONSTRAINT "krankmeldung_mitarbeiterId_fkey" FOREIGN KEY ("mitarbeiterId") REFERENCES "mitarbeiter"("id") ON DELETE CASCADE ON UPDATE CASCADE;
