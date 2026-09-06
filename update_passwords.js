const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updatePasswords() {
  // Update master
  const master = await prisma.usuario.findUnique({ where: { email: 'master@master' } });
  if (master) {
    await prisma.usuario.update({
      where: { id: master.id },
      data: { senha: "master" }
    });
    console.log("Updated master@master password.");
  }

  // Update daniel
  const daniel = await prisma.usuario.findUnique({ where: { email: 'danielsmlopes@hotmail.com' } });
  if (daniel) {
    await prisma.usuario.update({
      where: { id: daniel.id },
      data: { senha: "Gabriel2006" }
    });
    console.log("Updated danielsmlopes@hotmail.com password.");
  }
}

updatePasswords()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
