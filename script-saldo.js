const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

async function main() {
  let plano = await prisma.planoConta.findFirst({
    where: { codigo: "0.0", descricao: "Saldo Inicial" }
  });

  if (!plano) {
    plano = await prisma.planoConta.create({
      data: {
        codigo: "0.0",
        descricao: "Saldo Inicial",
        tipo: "RECEITA"
      }
    });
    console.log("Criado Plano de Conta: Saldo Inicial");
  } else {
    console.log("Plano de Conta: Saldo Inicial já existe");
  }

  const t1 = await prisma.transacaoFinanceira.findFirst({
    where: { descricao: "Saldo Recebido Anterior (Até 05.09.2026)", valor: 66775.00 }
  });
  if (!t1) {
    await prisma.transacaoFinanceira.create({
      data: {
        tipo: "RECEITA",
        descricao: "Saldo Recebido Anterior (Até 05.09.2026)",
        valor: 66775.00,
        status: "PAGO",
        dataVencimento: new Date("2026-09-05T00:00:00Z"),
        dataPagamento: new Date("2026-09-05T00:00:00Z"),
        empresa: "JHOSTON",
        planoContaId: plano.id
      }
    });
    console.log("Transação 1 inserida: 66775.00");
  } else {
    console.log("Transação 1 já inserida.");
  }

  const t2 = await prisma.transacaoFinanceira.findFirst({
    where: { descricao: "Saldo em Conta Anterior (Até 05.09.2026)", valor: 44.16 }
  });
  if (!t2) {
    await prisma.transacaoFinanceira.create({
      data: {
        tipo: "RECEITA",
        descricao: "Saldo em Conta Anterior (Até 05.09.2026)",
        valor: 44.16,
        status: "PAGO",
        dataVencimento: new Date("2026-09-05T00:00:00Z"),
        dataPagamento: new Date("2026-09-05T00:00:00Z"),
        empresa: "JHOSTON",
        planoContaId: plano.id
      }
    });
    console.log("Transação 2 inserida: 44.16");
  } else {
    console.log("Transação 2 já inserida.");
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
