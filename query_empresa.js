require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  const transacoes = await prisma.transacaoFinanceira.findMany({ 
    where: { valor: { in: [44.16, 66775] } } 
  });
  
  console.log(transacoes.map(t => ({ id: t.id, descricao: t.descricao, empresa: t.empresa, valor: t.valor })));
} 

main().finally(() => process.exit(0));
