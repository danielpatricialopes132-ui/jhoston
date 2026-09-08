import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

import { prisma } from "./src/lib/db";

async function main() {
  console.log("Deletando Vales...");
  await prisma.vale.deleteMany({});
  
  console.log("Deletando Diárias de Viagem...");
  await prisma.diariaViagem.deleteMany({});
  
  console.log("Deletando Boletos...");
  await prisma.boleto.deleteMany({});

  console.log("Deletando Transações Financeiras...");
  await prisma.transacaoFinanceira.deleteMany({});

  console.log("Limpando empresas do DB para conferência...");
  const empresas = await prisma.configuracaoEmpresa.findMany({});
  console.log("Empresas:", empresas.map(e => e.nome));
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
