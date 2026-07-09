"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function getValesData() {
  const [funcionarios, vales] = await Promise.all([
    prisma.funcionario.findMany({ where: { ativo: true }, orderBy: { nome: "asc" } }),
    prisma.vale.findMany({
      include: {
        funcionario: true,
      },
      orderBy: { id: "desc" },
    }),
  ]);

  return { funcionarios, vales };
}

export async function salvarVale(data: {
  id?: number;
  funcionarioId: number;
  data: string;
  valor: number;
  descricao?: string;
  statusDesconto?: string;
  tipo?: string;
}) {
  const payload = {
    funcionarioId: data.funcionarioId,
    data: new Date(data.data),
    valor: data.valor,
    descricao: data.descricao || "",
    statusDesconto: data.statusDesconto || "PENDENTE",
    tipo: data.tipo || "VALE",
  };

  let vale;
  if (data.id) {
    vale = await prisma.vale.update({
      where: { id: data.id },
      data: payload,
    });
  } else {
    vale = await prisma.vale.create({
      data: payload,
    });
  }

  revalidatePath("/vales");
  revalidatePath("/relatorios");
  revalidatePath("/");
  return { success: true, data: vale };
}

export async function deleteVale(id: number) {
  try {
    await prisma.vale.delete({
      where: { id },
    });
    revalidatePath("/vales");
    revalidatePath("/relatorios");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Erro ao excluir o vale." };
  }
}

export async function alterarStatusDescontoVale(id: number, status: "PENDENTE" | "DESCONTADO") {
  const vale = await prisma.vale.update({
    where: { id },
    data: { statusDesconto: status },
  });
  revalidatePath("/vales");
  revalidatePath("/relatorios");
  revalidatePath("/");
  return { success: true, data: vale };
}
