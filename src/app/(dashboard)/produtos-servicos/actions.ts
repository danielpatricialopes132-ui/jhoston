"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { getSession } from "@/app/login/actions";

async function requireAdmin() {
  const session = await getSession();
  if (!session || (session.userRole !== "MASTER" && session.userRole !== "ESCRITORIO")) {
    throw new Error("Não autorizado.");
  }
  return session;
}

export async function getProdutosServicosList() {
  await requireAdmin();

  const list = await prisma.produtoServico.findMany({
    orderBy: {
      nome: "asc",
    },
  });

  return list.map((item) => ({
    ...item,
    createdAt: item.createdAt.toISOString().split("T")[0],
    updatedAt: item.updatedAt.toISOString().split("T")[0],
  }));
}

export async function salvarProdutoServico(data: {
  id?: number;
  nome: string;
  descricao?: string;
  precoPadrao: number;
  tipo: string; // "PRODUTO" ou "SERVICO"
  empresa: string; // "JHOSTON", "ECO_STONE", "AMBAS"
  ativo?: boolean;
}) {
  await requireAdmin();

  if (!data.nome.trim()) {
    return { success: false, error: "O nome é obrigatório." };
  }

  if (data.precoPadrao < 0) {
    return { success: false, error: "O preço padrão não pode ser menor que zero." };
  }

  const payload = {
    nome: data.nome.trim(),
    descricao: data.descricao?.trim() || null,
    precoPadrao: data.precoPadrao,
    tipo: data.tipo,
    empresa: data.empresa,
    ativo: data.ativo !== undefined ? data.ativo : true,
  };

  try {
    let item;
    if (data.id) {
      item = await prisma.produtoServico.update({
        where: { id: data.id },
        data: payload,
      });
    } else {
      item = await prisma.produtoServico.create({
        data: payload,
      });
    }

    revalidatePath("/produtos-servicos");
    return { success: true, data: item };
  } catch (error: any) {
    console.error("Erro ao salvar produto/serviço:", error);
    return { success: false, error: "Erro ao salvar no banco de dados." };
  }
}

export async function deleteProdutoServico(id: number) {
  await requireAdmin();

  try {
    await prisma.produtoServico.delete({
      where: { id },
    });

    revalidatePath("/produtos-servicos");
    return { success: true };
  } catch (error) {
    console.error("Erro ao excluir produto/serviço:", error);
    return { success: false, error: "Erro ao excluir o item." };
  }
}
