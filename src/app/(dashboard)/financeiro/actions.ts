"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function getFinanceiroData() {
  const [obras, transacoes] = await Promise.all([
    prisma.obra.findMany({ orderBy: { nome: "asc" } }),
    prisma.transacaoFinanceira.findMany({
      include: {
        obra: true,
      },
      orderBy: { dataVencimento: "desc" },
    }),
  ]);

  return { obras, transacoes };
}

export async function salvarTransacao(data: {
  id?: number;
  tipo: "RECEITA" | "DESPESA";
  categoria: string;
  obraId?: number | null;
  descricao: string;
  valor: number;
  dataVencimento: string;
  dataPagamento?: string | null;
  status: string;
  clienteFornecedor?: string;
}) {
  const payload = {
    tipo: data.tipo,
    categoria: data.categoria,
    obraId: data.obraId || null,
    descricao: data.descricao,
    valor: data.valor,
    dataVencimento: new Date(data.dataVencimento),
    dataPagamento: data.dataPagamento ? new Date(data.dataPagamento) : null,
    status: data.status,
    clienteFornecedor: data.clienteFornecedor || "",
  };

  let transacao;
  if (data.id) {
    transacao = await prisma.transacaoFinanceira.update({
      where: { id: data.id },
      data: payload,
    });
  } else {
    transacao = await prisma.transacaoFinanceira.create({
      data: payload,
    });
  }

  revalidatePath("/financeiro");
  revalidatePath("/relatorios");
  revalidatePath("/");
  return { success: true, data: transacao };
}

export async function deleteTransacao(id: number) {
  try {
    await prisma.transacaoFinanceira.delete({
      where: { id },
    });
    revalidatePath("/financeiro");
    revalidatePath("/relatorios");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Erro ao excluir transação." };
  }
}

export async function alterarStatusTransacao(
  id: number,
  status: "PENDENTE" | "PAGO",
  dataPagamentoStr?: string | null
) {
  const transacao = await prisma.transacaoFinanceira.update({
    where: { id },
    data: {
      status,
      dataPagamento: status === "PAGO" ? (dataPagamentoStr ? new Date(dataPagamentoStr) : new Date()) : null,
    },
  });
  revalidatePath("/financeiro");
  revalidatePath("/relatorios");
  revalidatePath("/");
  return { success: true, data: transacao };
}
