"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { getSession } from "@/app/login/actions";

// Verifica se o usuário é MASTER ou ESCRITORIO
async function requireAdmin() {
  const session = await getSession();
  if (!session || (session.userRole !== "MASTER" && session.userRole !== "ESCRITORIO")) {
    throw new Error("Não autorizado.");
  }
  return session;
}

export async function getOportunidadesList() {
  await requireAdmin();

  const oportunidades = await prisma.oportunidade.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });

  // Mapear datas para ISO limpa
  return oportunidades.map((op) => ({
    ...op,
    createdAt: op.createdAt.toISOString().split("T")[0],
    updatedAt: op.updatedAt.toISOString().split("T")[0],
  }));
}

export async function salvarOportunidade(data: {
  id?: number;
  clienteNome: string;
  telefone?: string;
  email?: string;
  endereco?: string;
  descricaoPiscina?: string;
  produto: string; // "PREMIUM" ou "SUPER_PREMIUM"
  areaPiscina: number;
  status: string;
  observacoes?: string;
  precoUnitario?: number;
  precoAditivo?: number;
}) {
  await requireAdmin();

  if (!data.clienteNome.trim()) {
    return { success: false, error: "O nome do cliente é obrigatório." };
  }

  if (data.produto !== "PREMIUM" && data.produto !== "SUPER_PREMIUM") {
    return { success: false, error: "O tipo do produto selecionado é inválido." };
  }

  if (data.areaPiscina < 0) {
    return { success: false, error: "A área da piscina não pode ser menor que zero." };
  }

  // Preços unitários padrão se não informados customizados
  const unitPrice = data.precoUnitario !== undefined && data.precoUnitario !== null 
    ? data.precoUnitario 
    : (data.produto === "SUPER_PREMIUM" ? 350.0 : 270.0);
  
  const aditivoPrice = data.precoAditivo !== undefined && data.precoAditivo !== null
    ? data.precoAditivo
    : 25.0;

  // Cálculo automático do valor final da proposta comercial:
  const valorProposta = data.areaPiscina * (unitPrice + aditivoPrice);

  const payload = {
    clienteNome: data.clienteNome.trim(),
    telefone: data.telefone?.trim() || null,
    email: data.email?.trim() || null,
    endereco: data.endereco?.trim() || null,
    descricaoPiscina: data.descricaoPiscina?.trim() || null,
    produto: data.produto,
    areaPiscina: data.areaPiscina,
    valorProposta: valorProposta,
    status: data.status,
    observacoes: data.observacoes?.trim() || null,
    precoUnitario: unitPrice,
    precoAditivo: aditivoPrice,
  };

  try {
    let oportunidade;
    if (data.id) {
      oportunidade = await prisma.oportunidade.update({
        where: { id: data.id },
        data: payload,
      });
    } else {
      oportunidade = await prisma.oportunidade.create({
        data: payload,
      });
    }

    revalidatePath("/crm");
    return { success: true, data: oportunidade };
  } catch (error: any) {
    console.error("Erro ao salvar oportunidade:", error);
    return { success: false, error: "Erro ao salvar oportunidade no banco de dados." };
  }
}

export async function deleteOportunidade(id: number) {
  await requireAdmin();

  try {
    await prisma.oportunidade.delete({
      where: { id },
    });

    revalidatePath("/crm");
    return { success: true };
  } catch (error) {
    console.error("Erro ao excluir oportunidade:", error);
    return { success: false, error: "Erro ao excluir a oportunidade." };
  }
}

export async function converterParaObra(id: number, nomeObra?: string) {
  await requireAdmin();

  try {
    const oportunidade = await prisma.oportunidade.findUnique({
      where: { id },
    });

    if (!oportunidade) {
      return { success: false, error: "Oportunidade não encontrada." };
    }

    // Cria a Obra com status Ativa
    const novaObra = await prisma.obra.create({
      data: {
        nome: nomeObra?.trim() || `Obra ${oportunidade.clienteNome}`,
        clienteNome: oportunidade.clienteNome,
        endereco: oportunidade.endereco,
        status: "ATIVA",
        progressoEscavacao: 0,
        progressoEstrutura: 0,
        progressoHidraulica: 0,
        progressoRevestimento: 0,
        progressoAcabamento: 0,
      },
    });

    // Atualiza status da oportunidade para ACEITO
    await prisma.oportunidade.update({
      where: { id },
      data: {
        status: "ACEITO",
      },
    });

    revalidatePath("/crm");
    revalidatePath("/obras");

    return { success: true, data: novaObra };
  } catch (error) {
    console.error("Erro ao converter oportunidade em obra:", error);
    return { success: false, error: "Erro ao converter a oportunidade em cliente ativo/obra." };
  }
}
