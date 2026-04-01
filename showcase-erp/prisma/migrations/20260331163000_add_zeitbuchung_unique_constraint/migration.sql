-- CreateIndex
CREATE UNIQUE INDEX "zeitbuchung_mitarbeiterId_datum_key" ON "zeitbuchung"("mitarbeiterId", "datum");
