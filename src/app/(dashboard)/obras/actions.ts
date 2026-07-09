"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function getObras() {
  return await prisma.obra.findMany({
    orderBy: { id: "desc" },
  });
}

export async function createObra(data: {
  nome: string;
  clienteNome: string;
  endereco?: string;
  status?: string;
}) {
  const obra = await prisma.obra.create({
    data: {
      nome: data.nome,
      clienteNome: data.clienteNome,
      endereco: data.endereco || "",
      status: data.status || "ATIVA",
    },
  });
  revalidatePath("/obras");
  revalidatePath("/");
  return { success: true, data: obra };
}

export async function updateObra(
  id: number,
  data: {
    nome: string;
    clienteNome: string;
    endereco?: string;
    status?: string;
  }
) {
  const obra = await prisma.obra.update({
    where: { id },
    data: {
      nome: data.nome,
      clienteNome: data.clienteNome,
      endereco: data.endereco || "",
      status: data.status || "ATIVA",
    },
  });
  revalidatePath("/obras");
  revalidatePath("/");
  return { success: true, data: obra };
}

export async function deleteObra(id: number) {
  try {
    await prisma.obra.delete({
      where: { id },
    });
    revalidatePath("/obras");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Não foi possível excluir a obra pois existem registros (ponto, viagens ou financeiro) vinculados a ela." };
  }
}
