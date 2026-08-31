const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL || "postgresql://postgres.zybdinuazildvyiqbhjz:6D3mdjk0WP8dyFfW@aws-1-sa-east-1.pooler.supabase.com:5432/postgres";
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const existing = await prisma.planoConta.findFirst({ where: { descricao: "Adiantamentos de Salário / Vales" } });
  if (!existing) {
    await prisma.planoConta.create({
      data: {
        codigo: "2.3.1",
        descricao: "Adiantamentos de Salário / Vales",
        tipo: "DESPESA",
        contaPaiId: null,
      }
    });
    console.log("Conta criada!");
  } else {
    console.log("Conta já existe.");
  }
}

main().catch(e => {
  console.error(e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
