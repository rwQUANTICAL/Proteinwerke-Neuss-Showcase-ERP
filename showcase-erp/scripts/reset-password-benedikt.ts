import "dotenv/config";
import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL!;
const adapter = new PrismaPg({ connectionString, ssl: { rejectUnauthorized: false } });
const prisma = new PrismaClient({ adapter });

import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { admin } from "better-auth/plugins";

const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: { enabled: true },
  plugins: [admin()],
  trustedOrigins: ["http://localhost:3000"],
});

async function main() {
  const email = "benedikt.willwerth@quantical.com";
  const newPassword = "Passwort1234!";

  // Use better-auth's internal password hashing
  const ctx = await auth.$context;
  const hashedPassword = await ctx.password.hash(newPassword);

  // Update the password in the account table
  const user = await prisma.user.findFirst({ where: { email } });
  if (!user) {
    console.error(`User ${email} not found!`);
    process.exit(1);
  }

  const updated = await prisma.account.updateMany({
    where: { userId: user.id, providerId: "credential" },
    data: { password: hashedPassword },
  });

  if (updated.count > 0) {
    console.log(`Password updated for ${email}`);
  } else {
    console.log(`No credential account found for ${email}. Creating one...`);
    await prisma.account.create({
      data: {
        id: crypto.randomUUID(),
        accountId: user.id,
        providerId: "credential",
        userId: user.id,
        password: hashedPassword,
      },
    });
    console.log(`Created credential account with new password for ${email}`);
  }

  // Verify sign-in works
  try {
    const signInRes = await auth.api.signInEmail({
      body: { email, password: newPassword },
    });
    console.log(`Sign-in test successful for ${email} (id: ${signInRes?.user?.id})`);
  } catch (e) {
    console.error("Sign-in test FAILED:", e);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
