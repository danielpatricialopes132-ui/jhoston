require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const fs = require('fs');

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  const transacoes = await prisma.transacaoFinanceira.findMany({ 
    include: { planoConta: true, centroCusto: true, fornecedor: true, obra: true } 
  });
  
  const ecoTransacoes = transacoes.filter(t => (t.empresa || '').toUpperCase().includes('ECO'));
  
  const lines = ['TIPO,CLIENTE/FORNECEDOR,PLANO DE CONTAS,CENTRO DE CUSTO,DESCRICAO,VENCIMENTO,VALOR,STATUS'];
  
  for(const t of ecoTransacoes) { 
    const plano = t.planoConta ? t.planoConta.codigo + ' - ' + t.planoConta.descricao : 'Não informado'; 
    const cc = t.centroCusto ? t.centroCusto.nome : 'Não informado'; 
    const cliFor = t.clienteFornecedor || (t.fornecedor ? t.fornecedor.nome : 'Não informado'); 
    const val = (t.tipo === 'RECEITA' ? '+' : '-') + t.valor.toFixed(2).replace('.', ','); 
    const date = new Date(t.dataVencimento).toLocaleDateString('pt-BR'); 
    
    lines.push([t.tipo, cliFor, plano, cc, t.descricao, date, val, t.status]
      .map(s => '"' + String(s).replace(/"/g, '""') + '"')
      .join(',')); 
  } 
  
  fs.writeFileSync('eco_stone_lancamentos.csv', lines.join('\n'));
} 

main().finally(() => process.exit(0));
