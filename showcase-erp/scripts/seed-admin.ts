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
  const email = "konrad.brixius@quantical.com";
  const name = "Konrad Brixius";
  const password = "Passwort1234!";

  // Sign up via auth API directly — password is hashed correctly
  let userId: string | undefined;
  try {
    const signUpRes = await auth.api.signUpEmail({
      body: { email, password, name },
    });
    userId = signUpRes?.user?.id;
    if (userId) console.log(`Created user: ${email} (id: ${userId})`);
  } catch {
    console.log(`User ${email} may already exist. Trying sign-in...`);
  }

  if (!userId) {
    const signInRes = await auth.api.signInEmail({
      body: { email, password },
    });
    userId = signInRes?.user?.id;
  }

  if (!userId) {
    console.error("Could not sign in. Check credentials.");
    process.exit(1);
  }

  // Set role to admin directly via Prisma
  await prisma.user.update({
    where: { id: userId },
    data: { role: "admin" },
  });
  console.log(`Set role to admin for ${email}`);

  // Create Mitarbeiter record linked to this user
  const existing = await prisma.mitarbeiter.findFirst({
    where: {
      OR: [{ userId }, { referenzNummer: "MA-001" }],
    },
  });

  if (existing) {
    // Update if needed (e.g. link to correct user, update name)
    await prisma.mitarbeiter.update({
      where: { id: existing.id },
      data: { name, userId, skills: ["MUEHLE", "WALZE"] },
    });
    console.log(`Mitarbeiter MA-001 already exists — updated.`);
  } else {
    const mitarbeiter = await prisma.mitarbeiter.create({
      data: {
        referenzNummer: "MA-001",
        name,
        skills: ["MUEHLE", "WALZE"],
        weeklyWorkRequirement: 42,
        urlaubsAnspruch: 30,
        userId,
      },
    });
    console.log(`Created Mitarbeiter: ${mitarbeiter.referenzNummer} (${mitarbeiter.name})`);
  }

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
