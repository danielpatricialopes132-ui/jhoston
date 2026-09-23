const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const obras = await prisma.obra.findMany({
    where: {
      OR: [
        { nome: { contains: 'Jacqueline', mode: 'insensitive' } },
        { clienteNome: { contains: 'Jacqueline', mode: 'insensitive' } }
      ]
    }
  });
  console.log(obras);
}
main().finally(() => prisma.$disconnect());
