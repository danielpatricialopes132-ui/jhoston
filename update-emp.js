const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

prisma.funcionario.updateMany({
  data: { empresa: 'ECO_STONE' }
}).then(() => console.log('Updated to ECO_STONE')).finally(() => prisma.$disconnect());
