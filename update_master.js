const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateMasterPassword() {
  const masterEmail = "master@master";
  const master = await prisma.usuario.findFirst({
    where: {
      OR: [
        { email: masterEmail },
        { nome: { contains: "master", mode: "insensitive" } }
      ]
    }
  });

  if (master) {
    await prisma.usuario.update({
      where: { id: master.id },
      data: { senha: "MASTER" }
    });
    console.log(`Updated user ${master.email} (id: ${master.id}) with new password.`);
  } else {
    console.log("Master user not found.");
  }
}

updateMasterPassword()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
