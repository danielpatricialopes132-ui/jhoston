const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function check() {
  const txCount = await prisma.transacaoFinanceira.count();
  const obras = await prisma.obra.findMany({ select: { id: true, nome: true, empresa: true } });
  const vales = await prisma.vale.count();
  const diarias = await prisma.diariaViagem.count();
  const boletos = await prisma.boleto.count();
  console.log(JSON.stringify({ txCount, vales, diarias, boletos, obras }, null, 2));
  await prisma.$disconnect();
  await pool.end();
}
check().catch(console.error);
