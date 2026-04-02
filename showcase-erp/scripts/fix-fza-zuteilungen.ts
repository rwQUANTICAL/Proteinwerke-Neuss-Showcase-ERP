import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

const connectionString = process.env.DATABASE_URL!;
const adapter = new PrismaPg({ connectionString, ssl: { rejectUnauthorized: false } });
const prisma = new PrismaClient({ adapter });

async function main() {
  const antraege = await prisma.freizeitausgleichAntrag.findMany({
    where: { status: "GENEHMIGT" },
  });

  console.log("Approved FZA:", antraege.length);

  for (const a of antraege) {
    const start = new Date(a.von);
    const end = new Date(a.bis);
    for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
      const z = await prisma.zuteilung.findUnique({
        where: {
          mitarbeiterId_datum: { mitarbeiterId: a.mitarbeiterId, datum: d },
        },
      });
      if (z && z.schicht === "X_FREI" && !z.originalSchicht) {
        await prisma.zuteilung.update({
          where: { id: z.id },
          data: { originalSchicht: "X_FREI" },
        });
        console.log("Fixed:", z.id, d.toISOString().split("T")[0]);
      }
    }
  }

  console.log("Done");
}

main().finally(() => prisma.$disconnect());
