import dotenv from "dotenv";

dotenv.config({
  path: ".env.local",
});

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/index.js";

const globalForPrisma = globalThis;

if (!globalForPrisma.prisma) {
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
  });

  globalForPrisma.prisma = new PrismaClient({
    adapter,
  });
}

export const prisma = globalForPrisma.prisma;