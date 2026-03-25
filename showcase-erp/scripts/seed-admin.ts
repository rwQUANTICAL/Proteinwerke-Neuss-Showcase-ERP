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
  const signUpRes = await auth.api.signUpEmail({
    body: { email, password, name },
  });

  if (!signUpRes?.user) {
    console.log(`User ${email} may already exist. Trying sign-in...`);
  } else {
    console.log(`Created user: ${email} (id: ${signUpRes.user.id})`);
  }

  // Sign in to get the user ID
  const signInRes = await auth.api.signInEmail({
    body: { email, password },
  });

  const userId = signInRes?.user?.id;
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
    where: { userId },
  });

  if (existing) {
    console.log(`Mitarbeiter already exists (ref: ${existing.referenzNummer}). Skipping.`);
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
