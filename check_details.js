const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function getDetails() {
  const tx = await prisma.transacaoFinanceira.findMany();
  console.log('Transações:', JSON.stringify(tx, null, 2));

  const empresas = await prisma.configuracaoEmpresa.findMany();
  console.log('Empresas:', empresas);

  await prisma.$disconnect();
  await pool.end();
}
getDetails().catch(console.error);
