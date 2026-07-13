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

export async function getClientesList() {
  await requireAdmin();

  const clientes = await prisma.cliente.findMany({
    include: {
      obras: {
        select: {
          id: true,
          nome: true,
          status: true,
        },
      },
      documentos: true,
    },
    orderBy: {
      nome: "asc",
    },
  });

  return clientes;
}

export async function salvarCliente(data: {
  id?: number;
  tipo: string;
  nome: string;
  cpfCnpj?: string;
  rg?: string;
  ie?: string;
  contato?: string;
  telefone?: string;
  email?: string;
  endereco?: string;
}) {
  await requireAdmin();

  if (!data.nome.trim()) {
    return { success: false, error: "O nome ou razão social é obrigatório." };
  }

  const payload = {
    tipo: data.tipo || "PF",
    nome: data.nome.trim(),
    cpfCnpj: data.cpfCnpj?.trim() || null,
    rg: data.rg?.trim() || null,
    ie: data.ie?.trim() || null,
    contato: data.contato?.trim() || null,
    telefone: data.telefone?.trim() || null,
    email: data.email?.trim() || null,
    endereco: data.endereco?.trim() || null,
  };

  try {
    let cliente;
    if (data.id) {
      cliente = await prisma.cliente.update({
        where: { id: data.id },
        data: payload,
      });
    } else {
      cliente = await prisma.cliente.create({
        data: payload,
      });
    }

    revalidatePath("/clientes");
    revalidatePath("/obras");
    revalidatePath("/crm");
    return { success: true, data: cliente };
  } catch (error: any) {
    console.error("Erro ao salvar cliente:", error);
    return { success: false, error: "Erro ao salvar cliente no banco de dados." };
  }
}

export async function deleteCliente(id: number) {
  await requireAdmin();

  try {
    await prisma.cliente.delete({
      where: { id },
    });

    revalidatePath("/clientes");
    revalidatePath("/obras");
    revalidatePath("/crm");
    return { success: true };
  } catch (error) {
    console.error("Erro ao excluir cliente:", error);
    return { success: false, error: "Erro ao excluir o cliente." };
  }
}

export async function addDocumentoCliente(data: {
  clienteId: number;
  nome: string;
  fileName: string;
  base64Data: string;
}) {
  await requireAdmin();

  if (!data.nome.trim()) {
    return { success: false, error: "O nome do documento é obrigatório." };
  }

  try {
    const doc = await prisma.documentoCliente.create({
      data: {
        clienteId: data.clienteId,
        nome: data.nome.trim(),
        fileName: data.fileName,
        base64Data: data.base64Data,
      },
    });

    revalidatePath("/clientes");
    return { success: true, data: doc };
  } catch (error) {
    console.error("Erro ao salvar documento do cliente:", error);
    return { success: false, error: "Erro ao salvar o documento no banco de dados." };
  }
}

export async function deleteDocumentoCliente(id: number) {
  await requireAdmin();

  try {
    await prisma.documentoCliente.delete({
      where: { id },
    });

    revalidatePath("/clientes");
    return { success: true };
  } catch (error) {
    console.error("Erro ao excluir documento do cliente:", error);
    return { success: false, error: "Erro ao excluir o documento." };
  }
}
