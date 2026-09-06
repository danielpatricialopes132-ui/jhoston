const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.usuario.findMany();
  for (let i = 0; i < users.length; i++) {
    if (!users[i].email) {
      const tempEmail = `migrado_${users[i].id}@jhoston.com`;
      await prisma.usuario.update({
        where: { id: users[i].id },
        data: { email: tempEmail }
      });
      console.log(`Updated user ${users[i].id} (${users[i].nome}) with ${tempEmail}`);
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
