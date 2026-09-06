import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { prismaClientV2: PrismaClient };

export const prisma =
  globalForPrisma.prismaClientV2 ||
  new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prismaClientV2 = prisma;
