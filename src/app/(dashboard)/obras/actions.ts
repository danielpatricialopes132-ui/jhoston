"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function getObras() {
  return await prisma.obra.findMany({
    include: {
      clientes: true,
    },
    orderBy: { id: "desc" },
  });
}

export async function createObra(data: {
  nome: string;
  clientIds?: number[];
  valorFechado: number;
  endereco?: string;
  status?: string;
}) {
  const clientIds = data.clientIds || [];
  
  const clients = await prisma.cliente.findMany({
    where: { id: { in: clientIds } },
  });
  
  const clienteNome = clients.length > 0 
    ? clients.map(c => c.nome).join(", ") 
    : "Sem cliente";

  const obra = await prisma.obra.create({
    data: {
      nome: data.nome,
      clienteNome: clienteNome,
      endereco: data.endereco || "",
      status: data.status || "ATIVA",
      valorFechado: data.valorFechado,
      clientes: {
        connect: clientIds.map(id => ({ id })),
      },
    },
    include: {
      clientes: true,
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
    clientIds?: number[];
    valorFechado: number;
    endereco?: string;
    status?: string;
  }
) {
  const clientIds = data.clientIds || [];

  const clients = await prisma.cliente.findMany({
    where: { id: { in: clientIds } },
  });
  
  const clienteNome = clients.length > 0 
    ? clients.map(c => c.nome).join(", ") 
    : "Sem cliente";

  const obra = await prisma.obra.update({
    where: { id },
    data: {
      nome: data.nome,
      clienteNome: clienteNome,
      endereco: data.endereco || "",
      status: data.status || "ATIVA",
      valorFechado: data.valorFechado,
      clientes: {
        set: clientIds.map(id => ({ id })),
      },
    },
    include: {
      clientes: true,
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
