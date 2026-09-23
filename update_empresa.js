require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  await prisma.transacaoFinanceira.updateMany({
    where: { id: { in: [22, 23] } },
    data: { empresa: 'ECO_STONE' }
  });
  
  console.log("Updated transactions 22 and 23 to ECO_STONE");
} 

main().finally(() => process.exit(0));
