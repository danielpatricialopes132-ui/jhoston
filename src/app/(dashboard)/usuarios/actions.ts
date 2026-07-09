"use server";

import { prisma } from "@/lib/db";
import { getSession } from "@/app/login/actions";
import { revalidatePath } from "next/cache";

// Função utilitária para garantir acesso apenas do MASTER
async function assegurarMaster() {
  const session = await getSession();
  if (!session || session.userRole !== "MASTER") {
    throw new Error("Acesso negado. Apenas o usuário MASTER pode gerenciar permissões.");
  }
  return session;
}

export async function getUsuariosList() {
  await assegurarMaster();

  // Retorna todos os usuários exceto o próprio master
  return await prisma.usuario.findMany({
    where: {
      role: {
        not: "MASTER",
      },
    },
    orderBy: {
      usuario: "asc",
    },
  });
}

export async function updateUsuarioRole(userId: number, role: "ESCRITORIO" | "CAMPO") {
  await assegurarMaster();

  const usuario = await prisma.usuario.update({
    where: { id: userId },
    data: { role },
  });

  revalidatePath("/usuarios");
  return { success: true, data: usuario };
}

export async function deleteUsuario(userId: number) {
  await assegurarMaster();

  await prisma.usuario.delete({
    where: { id: userId },
  });

  revalidatePath("/usuarios");
  return { success: true };
}

export async function autorizarResetUsuario(userId: number, autorizar: boolean) {
  await assegurarMaster();

  const statusReset = autorizar ? "AUTORIZADO" : "NENHUM";
  await prisma.usuario.update({
    where: { id: userId },
    data: { statusReset },
  });

  revalidatePath("/usuarios");
  return { success: true };
}
