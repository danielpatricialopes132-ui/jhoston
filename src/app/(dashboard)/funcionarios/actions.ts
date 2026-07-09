"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function getFuncionarios() {
  return await prisma.funcionario.findMany({
    orderBy: { nome: "asc" },
  });
}

export async function createFuncionario(data: {
  nome: string;
  cargo: string;
  diariaPadrao: number;
  adicionalMotorista: number;
  pix?: string;
  ativo?: boolean;
}) {
  const funcionario = await prisma.funcionario.create({
    data: {
      nome: data.nome,
      cargo: data.cargo,
      diariaPadrao: data.diariaPadrao,
      adicionalMotorista: data.adicionalMotorista,
      pix: data.pix || "",
      ativo: data.ativo !== undefined ? data.ativo : true,
    },
  });
  revalidatePath("/funcionarios");
  revalidatePath("/ponto");
  revalidatePath("/viagens");
  revalidatePath("/vales");
  revalidatePath("/relatorios");
  return { success: true, data: funcionario };
}

export async function updateFuncionario(
  id: number,
  data: {
    nome: string;
    cargo: string;
    diariaPadrao: number;
    adicionalMotorista: number;
    pix?: string;
    ativo?: boolean;
  }
) {
  const funcionario = await prisma.funcionario.update({
    where: { id },
    data: {
      nome: data.nome,
      cargo: data.cargo,
      diariaPadrao: data.diariaPadrao,
      adicionalMotorista: data.adicionalMotorista,
      pix: data.pix || "",
      ativo: data.ativo !== undefined ? data.ativo : true,
    },
  });
  revalidatePath("/funcionarios");
  revalidatePath("/ponto");
  revalidatePath("/viagens");
  revalidatePath("/vales");
  revalidatePath("/relatorios");
  return { success: true, data: funcionario };
}

export async function deleteFuncionario(id: number) {
  try {
    await prisma.funcionario.delete({
      where: { id },
    });
    revalidatePath("/funcionarios");
    revalidatePath("/ponto");
    revalidatePath("/viagens");
    revalidatePath("/vales");
    revalidatePath("/relatorios");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Não foi possível excluir o funcionário pois existem registros (ponto, viagens ou vales) vinculados a ele." };
  }
}
