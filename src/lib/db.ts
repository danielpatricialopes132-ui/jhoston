import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = global as unknown as { prismaClientV2: PrismaClient };

const connectionString = process.env.DATABASE_URL || "postgresql://postgres:placeholder@localhost:5432/postgres";
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

export const prisma =
  globalForPrisma.prismaClientV2 ||
  new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") globalForPrisma.prismaClientV2 = prisma;
