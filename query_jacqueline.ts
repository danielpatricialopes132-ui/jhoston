import { prisma } from './src/lib/db';
async function main() {
  const obras = await prisma.obra.findMany({
    where: {
      OR: [
        { nome: { contains: 'Jacqueline', mode: 'insensitive' } },
        { clienteNome: { contains: 'Jacqueline', mode: 'insensitive' } }
      ]
    }
  });
  console.log(JSON.stringify(obras, null, 2));
}
main().finally(() => prisma.$disconnect());
