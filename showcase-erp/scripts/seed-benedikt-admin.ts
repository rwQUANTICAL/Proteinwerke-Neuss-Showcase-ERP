import "dotenv/config";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { admin } from "better-auth/plugins";
import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL!;
const adapter = new PrismaPg({ connectionString, ssl: { rejectUnauthorized: false } });
const prisma = new PrismaClient({ adapter });

const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: { enabled: true },
  plugins: [admin()],
  trustedOrigins: ["http://localhost:3000"],
});

async function main() {
  // 1. Create Benedikt Willwerth and make admin
  const benediktEmail = "benedikt.willwerth@quantical.com";
  const benediktName = "Benedikt Willwerth";
  const benediktPassword = "Passwort1234!";

  // Check if user already exists
  const existingUser = await prisma.user.findFirst({
    where: { email: benediktEmail },
  });

  let benediktUserId: string;

  if (existingUser) {
    benediktUserId = existingUser.id;
    console.log(`User ${benediktEmail} already exists (id: ${benediktUserId})`);
  } else {
    const signUpRes = await auth.api.signUpEmail({
      body: { email: benediktEmail, password: benediktPassword, name: benediktName },
    });
    benediktUserId = signUpRes?.user?.id!;
    console.log(`Created user: ${benediktEmail} (id: ${benediktUserId})`);
  }

  if (!benediktUserId) {
    console.error("Could not create or find Benedikt.");
    process.exit(1);
  }

  // Set Benedikt to admin
  await prisma.user.update({
    where: { id: benediktUserId },
    data: { role: "admin" },
  });
  console.log(`Set role to admin for ${benediktEmail}`);

  // Create Mitarbeiter record for Benedikt
  const existingBenedikt = await prisma.mitarbeiter.findFirst({
    where: { userId: benediktUserId },
  });

  if (existingBenedikt) {
    console.log(`Mitarbeiter for Benedikt already exists (${existingBenedikt.referenzNummer}).`);
  } else {
    // Find next free MA number
    const allMitarbeiter = await prisma.mitarbeiter.findMany({
      orderBy: { referenzNummer: "desc" },
      take: 1,
    });
    const lastNum = allMitarbeiter.length > 0
      ? parseInt(allMitarbeiter[0].referenzNummer.replace("MA-", ""), 10)
      : 0;
    const nextRef = `MA-${String(lastNum + 1).padStart(3, "0")}`;

    const mitarbeiter = await prisma.mitarbeiter.create({
      data: {
        referenzNummer: nextRef,
        name: benediktName,
        skills: ["MUEHLE", "WALZE"],
        weeklyWorkRequirement: 42,
        urlaubsAnspruch: 30,
        userId: benediktUserId,
      },
    });
    console.log(`Created Mitarbeiter: ${mitarbeiter.referenzNummer} (${mitarbeiter.name})`);
  }

  // 2. Demote Tobias Hustedt to user
  const tobiasUser = await prisma.user.findFirst({
    where: { email: "tobias.hustedt@quantical.com" },
  });

  if (tobiasUser) {
    await prisma.user.update({
      where: { id: tobiasUser.id },
      data: { role: "user" },
    });
    console.log(`Set role to user for tobias.hustedt@quantical.com`);
  } else {
    console.log("Tobias Hustedt user not found — skipping role change.");
  }

  console.log("Done.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
