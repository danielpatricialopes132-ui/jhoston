"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

// --- PLANO DE CONTAS ---

export async function getPlanoContas() {
  try {
    return await prisma.planoConta.findMany({
      orderBy: { codigo: "asc" },
    });
  } catch (error) {
    console.error("Erro ao buscar plano de contas:", error);
    return [];
  }
}

export async function criarPlanoConta(data: {
  codigo: string;
  descricao: string;
  tipo: string;
  contaPaiId?: number | null;
}) {
  try {
    const novaConta = await prisma.planoConta.create({
      data,
    });
    revalidatePath("/financeiro/contabilidade");
    revalidatePath("/financeiro");
    return { success: true, data: novaConta };
  } catch (error: any) {
    console.error("Erro ao criar plano de conta:", error);
    return { success: false, error: error.message };
  }
}

export async function deletePlanoConta(id: number) {
  try {
    await prisma.planoConta.delete({ where: { id } });
    revalidatePath("/financeiro/contabilidade");
    revalidatePath("/financeiro");
    return { success: true };
  } catch (error: any) {
    console.error("Erro ao deletar conta:", error);
    return { success: false, error: "Não é possível deletar esta conta pois há transações vinculadas." };
  }
}

export async function seedPlanoContasPadrao() {
  try {
    const count = await prisma.planoConta.count();
    if (count > 0) return { success: true, message: "Já existem contas cadastradas" };

    const contas = [
      { codigo: "1", descricao: "RECEITAS", tipo: "RECEITA", contaPaiId: null },
      { codigo: "2", descricao: "DESPESAS / CUSTOS", tipo: "DESPESAS", contaPaiId: null },
      { codigo: "3", descricao: "IMPOSTOS", tipo: "DESPESAS", contaPaiId: null },
      { codigo: "4", descricao: "LUCRO / DIVIDENDOS", tipo: "DESPESAS", contaPaiId: null },
    ];

    for (const c of contas) {
      await prisma.planoConta.create({ data: c });
    }

    revalidatePath("/financeiro/contabilidade");
    return { success: true, message: "Contas padrão geradas." };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}


// --- CENTROS DE CUSTO ---

export async function getCentrosCusto() {
  try {
    return await prisma.centroCusto.findMany({
      include: { obra: { select: { nome: true } } },
      orderBy: { nome: "asc" },
    });
  } catch (error) {
    console.error("Erro ao buscar centros de custo:", error);
    return [];
  }
}

export async function criarCentroCusto(data: {
  nome: string;
  codigo?: string | null;
  obraId?: number | null;
}) {
  try {
    const novo = await prisma.centroCusto.create({
      data,
    });
    revalidatePath("/financeiro/contabilidade");
    revalidatePath("/financeiro");
    return { success: true, data: novo };
  } catch (error: any) {
    console.error("Erro ao criar centro de custo:", error);
    return { success: false, error: error.message };
  }
}

export async function deleteCentroCusto(id: number) {
  try {
    await prisma.centroCusto.delete({ where: { id } });
    revalidatePath("/financeiro/contabilidade");
    revalidatePath("/financeiro");
    return { success: true };
  } catch (error: any) {
    console.error("Erro ao deletar centro:", error);
    return { success: false, error: "Não é possível deletar este centro de custo." };
  }
}

export async function syncObrasComoCentrosCusto() {
  // Cria um Centro de Custo para cada Obra ativa que ainda não tem um
  try {
    const obras = await prisma.obra.findMany({ where: { status: "ATIVA" } });
    const existentes = await prisma.centroCusto.findMany({ where: { obraId: { not: null } } });
    const existentesIds = existentes.map(c => c.obraId);

    let criados = 0;
    for (const obra of obras) {
      if (!existentesIds.includes(obra.id)) {
        await prisma.centroCusto.create({
          data: {
            nome: `Obra - ${obra.nome}`,
            obraId: obra.id,
            codigo: `OBRA-${obra.id}`,
          }
        });
        criados++;
      }
    }
    
    // Cria o ADM se não existir
    const adm = await prisma.centroCusto.findFirst({ where: { nome: { contains: "Administrativo" } } });
    if (!adm) {
      await prisma.centroCusto.create({
        data: { nome: "Administrativo Sede", codigo: "ADM-01" }
      });
      criados++;
    }

    revalidatePath("/financeiro/contabilidade");
    return { success: true, message: `${criados} centros de custo sincronizados.` };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
