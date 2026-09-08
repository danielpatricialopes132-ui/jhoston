import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  await prisma.funcionario.updateMany({
    data: { empresa: "ECO STONE" }
  });
  console.log("Updated");
}
main();
