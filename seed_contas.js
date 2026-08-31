const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL || "postgresql://postgres.zybdinuazildvyiqbhjz:6D3mdjk0WP8dyFfW@aws-1-sa-east-1.pooler.supabase.com:5432/postgres";
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  // Limpa as contas atuais
  await prisma.transacaoFinanceira.updateMany({ data: { planoContaId: null } });
  await prisma.planoConta.deleteMany({});

  const contas = [
    // --- 1. RECEITAS ---
    { codigo: "1.0.0", descricao: "RECEITAS", tipo: "RECEITA", contaPaiId: null },
    { codigo: "1.1.0", descricao: "Receita de Venda de Obras (Revestimento)", tipo: "RECEITA", contaPaiId: null },
    { codigo: "1.2.0", descricao: "Receita de Venda de Materiais/Produtos", tipo: "RECEITA", contaPaiId: null },
    { codigo: "1.3.0", descricao: "Receita de Serviços Avulsos", tipo: "RECEITA", contaPaiId: null },
    { codigo: "1.4.0", descricao: "Transferência Intercompany (Entrada)", tipo: "RECEITA", contaPaiId: null },
    { codigo: "1.9.0", descricao: "Outras Receitas Operacionais", tipo: "RECEITA", contaPaiId: null },

    // --- 2. CUSTOS DIRETOS (OBRAS) ---
    { codigo: "2.0.0", descricao: "CUSTOS DIRETOS (OBRAS)", tipo: "DESPESA", contaPaiId: null },
    { codigo: "2.1.0", descricao: "Materiais de Construção / Revestimento", tipo: "DESPESA", contaPaiId: null },
    { codigo: "2.2.0", descricao: "Mão de Obra Terceirizada (Obras)", tipo: "DESPESA", contaPaiId: null },
    { codigo: "2.3.0", descricao: "Folha de Pagamento (Equipe Campo)", tipo: "DESPESA", contaPaiId: null },
    { codigo: "2.4.0", descricao: "Locação de Máquinas e Equipamentos", tipo: "DESPESA", contaPaiId: null },
    { codigo: "2.5.0", descricao: "Combustível, Fretes e Logística (Obras)", tipo: "DESPESA", contaPaiId: null },
    { codigo: "2.6.0", descricao: "Alimentação e Hospedagem (Obras/Viagem)", tipo: "DESPESA", contaPaiId: null },

    // --- 3. DESPESAS ADMINISTRATIVAS E FIXAS ---
    { codigo: "3.0.0", descricao: "DESPESAS ADMINISTRATIVAS", tipo: "DESPESA", contaPaiId: null },
    { codigo: "3.1.0", descricao: "Pró-labore e Folha de Pagamento (Escritório)", tipo: "DESPESA", contaPaiId: null },
    { codigo: "3.2.0", descricao: "Aluguel, Condomínio e IPTU (Sede)", tipo: "DESPESA", contaPaiId: null },
    { codigo: "3.3.0", descricao: "Energia, Água, Internet e Telefone", tipo: "DESPESA", contaPaiId: null },
    { codigo: "3.4.0", descricao: "Material de Escritório e Limpeza", tipo: "DESPESA", contaPaiId: null },
    { codigo: "3.5.0", descricao: "Softwares e Sistemas (SaaS, Hospedagem)", tipo: "DESPESA", contaPaiId: null },
    { codigo: "3.6.0", descricao: "Marketing e Anúncios (Tráfego Pago)", tipo: "DESPESA", contaPaiId: null },
    { codigo: "3.7.0", descricao: "Despesas com Veículos (Manutenção/IPVA)", tipo: "DESPESA", contaPaiId: null },
    { codigo: "3.8.0", descricao: "Transferência Intercompany (Saída)", tipo: "DESPESA", contaPaiId: null },

    // --- 4. IMPOSTOS E TAXAS ---
    { codigo: "4.0.0", descricao: "IMPOSTOS E TAXAS", tipo: "DESPESA", contaPaiId: null },
    { codigo: "4.1.0", descricao: "Impostos sobre Vendas (DAS / NF-e)", tipo: "DESPESA", contaPaiId: null },
    { codigo: "4.2.0", descricao: "Taxas Bancárias e Juros", tipo: "DESPESA", contaPaiId: null },
    { codigo: "4.3.0", descricao: "Honorários Contábeis e Advocatícios", tipo: "DESPESA", contaPaiId: null },

    // --- 5. INVESTIMENTOS E OUTROS ---
    { codigo: "5.0.0", descricao: "INVESTIMENTOS E OUTROS", tipo: "DESPESA", contaPaiId: null },
    { codigo: "5.1.0", descricao: "Aquisição de Ativos (Máquinas, Veículos)", tipo: "DESPESA", contaPaiId: null },
    { codigo: "5.2.0", descricao: "Retirada de Lucro / Dividendos", tipo: "DESPESA", contaPaiId: null }
  ];

  for (const c of contas) {
    await prisma.planoConta.create({ data: c });
  }

  console.log("Plano de Contas inserido com sucesso!");
}

main().catch(e => {
  console.error(e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
