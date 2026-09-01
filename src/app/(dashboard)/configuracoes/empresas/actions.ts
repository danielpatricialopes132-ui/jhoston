"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function getEmpresas() {
  return await prisma.configuracaoEmpresa.findMany({
    orderBy: { nome: "asc" },
  });
}

export async function updateEmpresa(nome: string, data: {
  cnpj?: string;
  corPrimaria?: string;
  corSecundaria?: string;
  logoUrl?: string;
  telefone?: string;
  email?: string;
  endereco?: string;
}) {
  try {
    const res = await prisma.configuracaoEmpresa.update({
      where: { nome },
      data,
    });
    revalidatePath("/configuracoes/empresas");
    revalidatePath("/obras");
    return { success: true, data: res };
  } catch (error) {
    return { success: false, error: "Erro ao atualizar a empresa." };
  }
}

export async function createEmpresa(data: {
  nome: string;
  cnpj?: string;
  corPrimaria?: string;
  corSecundaria?: string;
  logoUrl?: string;
}) {
  try {
    const res = await prisma.configuracaoEmpresa.create({
      data,
    });
    revalidatePath("/configuracoes/empresas");
    revalidatePath("/obras");
    return { success: true, data: res };
  } catch (error) {
    return { success: false, error: "Erro ao criar a empresa. Verifique se o nome já não existe." };
  }
}

export async function deleteEmpresa(nome: string) {
  try {
    await prisma.configuracaoEmpresa.delete({
      where: { nome },
    });
    revalidatePath("/configuracoes/empresas");
    revalidatePath("/obras");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Erro ao excluir a empresa." };
  }
}
