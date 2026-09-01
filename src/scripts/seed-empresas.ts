import { prisma } from '../lib/db';

async function main() {
  const empresas = [
    {
      nome: "JHOSTON TEC",
      corPrimaria: "#1e3a8a",
      corSecundaria: "#0ea5e9",
      logoUrl: "/logo.png",
    },
    {
      nome: "JHOSTON REVEST",
      corPrimaria: "#1e3a8a",
      corSecundaria: "#0ea5e9",
      logoUrl: "/logo.png",
    },
    {
      nome: "JHOSTON POOLS",
      corPrimaria: "#1e3a8a",
      corSecundaria: "#0ea5e9",
      logoUrl: "/logo.png",
    },
    {
      nome: "JHOSTON CONSTRUÇÕES E REVESTIMENTOS",
      corPrimaria: "#1e3a8a",
      corSecundaria: "#0ea5e9",
      logoUrl: "/logo.png",
    },
    {
      nome: "JHOSTON LAGOONS E POOLS",
      corPrimaria: "#1e3a8a",
      corSecundaria: "#0ea5e9",
      logoUrl: "/logo.png",
    },
    {
      nome: "ECO STONE",
      corPrimaria: "#2E8B57", // Exemplo verde
      corSecundaria: "#3CB371",
      logoUrl: "/logo.png", // Poderá ser editado depois
    },
  ];

  for (const emp of empresas) {
    await prisma.configuracaoEmpresa.upsert({
      where: { nome: emp.nome },
      update: {},
      create: emp,
    });
  }

  console.log('Seed de empresas concluído com sucesso!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
