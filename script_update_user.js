const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const email = 'patigrubel@gmail.com';
  let user = await prisma.usuario.findUnique({ where: { email } });
  
  if (user) {
    user = await prisma.usuario.update({
      where: { email },
      data: { senha: 'Maraca132', role: 'MASTER', statusAcesso: 'APROVADO' }
    });
    console.log('User updated successfully:', user.email);
  } else {
    user = await prisma.usuario.create({
      data: { email: email, senha: 'Maraca132', nome: 'Patrícia Grubel', role: 'MASTER', statusAcesso: 'APROVADO', empresa: 'AMBAS' }
    });
    console.log('User created successfully:', user.email);
  }
}

main().catch(e => { console.error(e); process.exit(1); }).finally(async () => { await prisma.$disconnect(); await pool.end(); });
