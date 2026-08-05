import 'dotenv/config';
import { prisma } from '../lib/db';

async function main() {
  const produtos = [
    {
      nome: 'Insumos',
      descricao: 'Insumos gerais para a obra',
      precoPadrao: 0,
      tipo: 'PRODUTO',
      empresa: 'AMBAS',
      ativo: true,
    },
    {
      nome: 'Impermeabilizante Baltech 7000',
      descricao: 'Impermeabilizante de alta performance',
      precoPadrao: 0,
      tipo: 'PRODUTO',
      empresa: 'AMBAS',
      ativo: true,
    },
    {
      nome: 'Estadia',
      descricao: 'Custo com estadia da equipe técnica',
      precoPadrao: 0,
      tipo: 'SERVICO',
      empresa: 'AMBAS',
      ativo: true,
    },
    {
      nome: 'Estadia e Deslocamento',
      descricao: 'Custo com estadia e deslocamento da equipe técnica',
      precoPadrao: 0,
      tipo: 'SERVICO',
      empresa: 'AMBAS',
      ativo: true,
    },
  ];

  console.log('Seeding Produtos e Serviços...');
  for (const produto of produtos) {
    const p = await prisma.produtoServico.findFirst({
      where: { nome: produto.nome }
    });

    if (!p) {
      await prisma.produtoServico.create({
        data: produto,
      });
      console.log(`+ Criado: ${produto.nome}`);
    } else {
      console.log(`- Já existe: ${produto.nome}`);
    }
  }
  console.log('Seed de produtos finalizado com sucesso.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
