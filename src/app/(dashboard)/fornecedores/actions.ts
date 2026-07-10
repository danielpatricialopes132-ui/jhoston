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

export async function getFornecedoresList() {
  await requireAdmin();

  const fornecedores = await prisma.fornecedor.findMany({
    include: {
      transacoes: {
        include: {
          obra: true,
        },
        orderBy: {
          dataVencimento: "desc",
        },
      },
    },
    orderBy: {
      nome: "asc",
    },
  });

  // Calcular estatísticas para cada fornecedor
  const mapped = fornecedores.map((f) => {
    const despesas = f.transacoes.filter((t) => t.tipo === "DESPESA");
    
    const totalPago = despesas
      .filter((t) => t.status === "PAGO")
      .reduce((acc, t) => acc + t.valor, 0);

    const totalPendente = despesas
      .filter((t) => t.status === "PENDENTE")
      .reduce((acc, t) => acc + t.valor, 0);

    const totalAtrasado = despesas
      .filter((t) => t.status === "ATRASADO" || (t.status === "PENDENTE" && new Date(t.dataVencimento) < new Date()))
      .reduce((acc, t) => acc + t.valor, 0);

    return {
      ...f,
      totalPago,
      totalPendente,
      totalAtrasado,
      // Mapear datas das transações para string ISO limpa
      transacoes: f.transacoes.map((t) => ({
        ...t,
        dataVencimento: t.dataVencimento.toISOString().split("T")[0],
        dataPagamento: t.dataPagamento ? t.dataPagamento.toISOString().split("T")[0] : null,
      })),
    };
  });

  return mapped;
}

export async function salvarFornecedor(data: {
  id?: number;
  nome: string;
  cnpj?: string;
  telefone?: string;
  email?: string;
  pix?: string;
  contato?: string;
  observacoes?: string;
}) {
  await requireAdmin();

  if (!data.nome.trim()) {
    return { success: false, error: "O nome do fornecedor é obrigatório." };
  }

  const payload = {
    nome: data.nome.trim(),
    cnpj: data.cnpj?.trim() || null,
    telefone: data.telefone?.trim() || null,
    email: data.email?.trim() || null,
    pix: data.pix?.trim() || null,
    contato: data.contato?.trim() || null,
    observacoes: data.observacoes?.trim() || null,
  };

  try {
    let fornecedor;
    if (data.id) {
      fornecedor = await prisma.fornecedor.update({
        where: { id: data.id },
        data: payload,
      });
    } else {
      fornecedor = await prisma.fornecedor.create({
        data: payload,
      });
    }

    revalidatePath("/fornecedores");
    revalidatePath("/financeiro");
    return { success: true, data: fornecedor };
  } catch (error: any) {
    if (error.code === "P2002") {
      return { success: false, error: "Já existe um fornecedor cadastrado com este nome." };
    }
    return { success: false, error: "Erro ao salvar fornecedor no banco de dados." };
  }
}

export async function deleteFornecedor(id: number) {
  await requireAdmin();

  try {
    // Ao deletar o fornecedor, as transações vinculadas terão fornecedorId definido como null (onDelete: SetNull no Prisma)
    await prisma.fornecedor.delete({
      where: { id },
    });

    revalidatePath("/fornecedores");
    revalidatePath("/financeiro");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Erro ao excluir o fornecedor." };
  }
}
