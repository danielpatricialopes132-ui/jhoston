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

export async function getContasBancariasList() {
  await requireAdmin();

  const list = await prisma.contaBancaria.findMany({
    orderBy: {
      banco: "asc",
    },
  });

  return list.map((item) => ({
    ...item,
    createdAt: item.createdAt.toISOString().split("T")[0],
    updatedAt: item.updatedAt.toISOString().split("T")[0],
  }));
}

export async function salvarContaBancaria(data: {
  id?: number;
  banco: string;
  agencia?: string;
  conta?: string;
  tipoPix?: string;
  chavePix?: string;
  titular: string;
  documento?: string;
  empresa: string; // "JHOSTON" | "ECO_STONE" | "AMBAS"
  ativa?: boolean;
}) {
  await requireAdmin();

  if (!data.banco.trim()) {
    return { success: false, error: "O nome do banco é obrigatório." };
  }

  if (!data.titular.trim()) {
    return { success: false, error: "O nome do titular é obrigatório." };
  }

  const payload = {
    banco: data.banco.trim(),
    agencia: data.agencia?.trim() || null,
    conta: data.conta?.trim() || null,
    tipoPix: data.tipoPix?.trim() || null,
    chavePix: data.chavePix?.trim() || null,
    titular: data.titular.trim(),
    documento: data.documento?.trim() || null,
    empresa: data.empresa,
    ativa: data.ativa !== undefined ? data.ativa : true,
  };

  try {
    let item;
    if (data.id) {
      item = await prisma.contaBancaria.update({
        where: { id: data.id },
        data: payload,
      });
    } else {
      item = await prisma.contaBancaria.create({
        data: payload,
      });
    }

    revalidatePath("/contas-bancarias");
    return { success: true, data: item };
  } catch (error: any) {
    console.error("Erro ao salvar conta bancária:", error);
    return { success: false, error: "Erro ao salvar no banco de dados." };
  }
}

export async function deleteContaBancaria(id: number) {
  await requireAdmin();

  try {
    await prisma.contaBancaria.delete({
      where: { id },
    });

    revalidatePath("/contas-bancarias");
    return { success: true };
  } catch (error) {
    console.error("Erro ao excluir conta bancária:", error);
    return { success: false, error: "Erro ao excluir a conta bancária." };
  }
}
