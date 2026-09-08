const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const contas = await prisma.planoConta.findMany();
  console.log(JSON.stringify(contas, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
