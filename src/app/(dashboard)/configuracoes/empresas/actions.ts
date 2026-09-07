"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { getSession } from "@/app/login/actions";

async function assertMaster() {
  const session = await getSession();
  if (!session || session.userRole !== "MASTER") {
    throw new Error("Acesso negado: apenas administradores MASTER podem gerenciar empresas.");
  }
}

export async function getEmpresas() {
  await assertMaster();
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
    await assertMaster();
    const res = await prisma.configuracaoEmpresa.update({
      where: { nome },
      data,
    });
    revalidatePath("/configuracoes/empresas");
    revalidatePath("/obras");
    return { success: true, data: res };
  } catch (error: any) {
    return { success: false, error: error.message || "Erro ao atualizar a empresa." };
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
    await assertMaster();
    const res = await prisma.configuracaoEmpresa.create({
      data,
    });
    revalidatePath("/configuracoes/empresas");
    revalidatePath("/obras");
    return { success: true, data: res };
  } catch (error: any) {
    return { success: false, error: error.message || "Erro ao criar a empresa. Verifique se o nome já não existe." };
  }
}

export async function deleteEmpresa(nome: string) {
  try {
    await assertMaster();
    await prisma.configuracaoEmpresa.delete({
      where: { nome },
    });
    revalidatePath("/configuracoes/empresas");
    revalidatePath("/obras");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Erro ao excluir a empresa." };
  }
}

