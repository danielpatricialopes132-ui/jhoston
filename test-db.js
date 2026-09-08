require('ts-node').register({ transpileOnly: true });
const { prisma } = require('./src/lib/db');
prisma.funcionario.findMany().then(res => {
  console.log(JSON.stringify(res, null, 2));
}).catch(console.error).finally(() => prisma.$disconnect());
